// Watch a reference video the way a filmmaker studies one: every cut, every shot, motion, colour, sound, words.
// Reference videos live in references/<name>/ (the .mp4 stays local, git-ignored; everything learned is committed).
//
//   node tools/watch.mjs ingest <file.mp4> --as <name> [--lang ar] [--copy]
//        probe + one decode pass → shots.json (every cut), audio.json (loudness/silences), report.md (pace, colour,
//        sound stats), overview/min-NN.jpg (a tile every 3 s), shots/shots-NN.jpg (every shot's middle frame)
//   node tools/watch.mjs list                                   all reference videos + their stats
//   node tools/watch.mjs shots <name> [--from a --to b]         the shot list (start, length, motion, colour)
//   node tools/watch.mjs sheet <name> --from a --to b [--n 20 --cols 5] | --times a,b,c   exact-time contact sheet
//   node tools/watch.mjs strip <name> --at t [--span 2 --fps 8 --cols 8]   dense frames → see HOW something animates
//   node tools/watch.mjs frames <name> --at t[,t2]              full-res 1920×1080 frames
//   node tools/watch.mjs audio <name> --from a --to b [--step 0.25]   loudness bars + words (hear the mix/rhythm)
//   node tools/watch.mjs transcribe <name> [--lang ar]          cloud whisper (large-v3) → references/<name>/timing/
//   node tools/watch.mjs transcript <name> [--from a --to b]    timed spoken lines
// Outputs of sheet/strip/frames go to .cache/ref/<name>/ (look at them with Read).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {ROOT, args, list} from './lib/render.mjs';
import {FFMPEG, FFPROBE, gh, sh} from './lib/sys.mjs';
import {dispatch, wait} from './lib/gha.mjs';

const a = args();
const [cmd, nameArg] = a._;
const REFS = path.join(ROOT, 'references');
const refDir = (n) => path.join(REFS, n);
const cacheDir = (n) => path.join(ROOT, '.cache', 'ref', n);
const SW = 48, SH = 27, SFPS = 10; // scan frames (cut/motion/colour detection)
const TW = 320, TH = 180; // 1 fps thumbnails

// ------------------------------------------------------------------ small helpers
const fmt = (t) => {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
};
const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};
const mean = (xs) => (xs.length ? xs.reduce((x, y) => x + y, 0) / xs.length : 0);
const bar = (v, max, w = 30) => '█'.repeat(Math.max(0, Math.round((Math.min(v, max) / max) * w)));
const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

function ff(argsList, {buffer = false} = {}) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-v', 'error', ...argsList], {maxBuffer: 1 << 30, encoding: buffer ? 'buffer' : 'utf8'});
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${String(r.stderr).slice(-800)}`);
  return r.stdout;
}

function loadRef(n) {
  if (!n) throw new Error('give the reference name (node tools/watch.mjs list)');
  const d = refDir(n);
  const info = path.join(d, 'info.json');
  if (!fs.existsSync(info)) throw new Error(`no reference "${n}" (node tools/watch.mjs list)`);
  const meta = JSON.parse(fs.readFileSync(info, 'utf8'));
  meta.video = path.join(d, 'video.mp4');
  return meta;
}
const needVideo = (meta) => {
  if (!fs.existsSync(meta.video)) throw new Error(`the video file is missing: ${path.relative(ROOT, meta.video)} (git-ignored; put the original .mp4 back there)`);
};

// ------------------------------------------------------------------ PNG encode/decode (no image libraries here)
const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc32 = (buf) => {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
function encodePNG(img) {
  const {w, h, data} = img;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) data.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  const chunk = (type, body) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const tb = Buffer.concat([Buffer.from(type), body]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc32(tb));
    return Buffer.concat([len, tb, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, {level: 6})), chunk('IEND', Buffer.alloc(0))]);
}
function decodePNG(buf) {
  let p = 8, w = 0, h = 0, ct = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const body = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      w = body.readUInt32BE(0);
      h = body.readUInt32BE(4);
      ct = body[9];
      if (body[8] !== 8 || body[12] !== 0) throw new Error('unsupported PNG');
    } else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : ct === 0 ? 1 : 0;
  if (!bpp) throw new Error('unsupported PNG colour type ' + ct);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const out = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const A = x >= bpp ? out[y * stride + x - bpp] : 0;
      const B = y ? out[(y - 1) * stride + x] : 0;
      const C = x >= bpp && y ? out[(y - 1) * stride + x - bpp] : 0;
      let v = row[x];
      if (f === 1) v += A;
      else if (f === 2) v += B;
      else if (f === 3) v += (A + B) >> 1;
      else if (f === 4) {
        const pp = A + B - C, pa = Math.abs(pp - A), pb = Math.abs(pp - B), pc = Math.abs(pp - C);
        v += pa <= pb && pa <= pc ? A : pb <= pc ? B : C;
      }
      out[y * stride + x] = v & 255;
    }
  }
  const data = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) for (let c = 0; c < 3; c++) data[i * 3 + c] = bpp === 1 ? out[i] : out[i * bpp + c];
  return {w, h, data};
}

// ------------------------------------------------------------------ AVI (rawvideo bgr24) reader
function readAVI(file, w, h) {
  const buf = fs.readFileSync(file);
  const size = w * h * 3;
  const strf = buf.indexOf('strf');
  const bottomUp = strf > 0 ? buf.readInt32LE(strf + 8 + 8) > 0 : true;
  const frames = [];
  let p = buf.indexOf('movi');
  while (p >= 0 && p < buf.length - 8) {
    const q = buf.indexOf('00d', p);
    if (q < 0) break;
    const sz = buf.readUInt32LE(q + 4);
    if ((buf[q + 3] === 0x62 || buf[q + 3] === 0x63) && sz === size) {
      const src = buf.subarray(q + 8, q + 8 + size);
      const rgb = Buffer.alloc(size);
      for (let y = 0; y < h; y++) {
        const sy = bottomUp ? h - 1 - y : y;
        for (let x = 0; x < w; x++) {
          const s = (sy * w + x) * 3, d = (y * w + x) * 3;
          rgb[d] = src[s + 2];
          rgb[d + 1] = src[s + 1];
          rgb[d + 2] = src[s];
        }
      }
      frames.push(rgb);
      p = q + 8 + size;
    } else p = q + 3;
  }
  return frames;
}

// ------------------------------------------------------------------ canvas + tiny bitmap font for labels
const FONT = {
  '0': '01110100011001110101110011000101110', '1': '00100011000010000100001000010001110', '2': '01110100010000100010001000100011111',
  '3': '11110000010000101110000010000111110', '4': '00010001100101010010111110001000010', '5': '11111100001111000001000011000101110',
  '6': '00110010001000011110100011000101110', '7': '11111000010001000100010000100001000', '8': '01110100011000101110100011000101110',
  '9': '01110100011000101111000010001001100', ':': '00000001100110000000011001100000000', '.': '00000000000000000000000000110001100',
  '#': '01010010101111101010111110101001010', 's': '00000000000111010000011100000111110', '-': '00000000000000011111000000000000000',
  ' ': '00000000000000000000000000000000000', 'x': '00000000001000101010001000101010001', '/': '00001000010001000100010001000010000',
};
const canvas = (w, h, rgb = [24, 24, 28]) => {
  const data = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) data.set(rgb, i * 3);
  return {w, h, data};
};
function blit(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++) {
    const dy = oy + y;
    if (dy < 0 || dy >= dst.h) continue;
    src.data.copy(dst.data, (dy * dst.w + ox) * 3, y * src.w * 3, (y + 1) * src.w * 3);
  }
}
function resize(img, w, h) {
  if (img.w === w && img.h === h) return img;
  const out = canvas(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const s = (Math.floor((y * img.h) / h) * img.w + Math.floor((x * img.w) / w)) * 3;
      img.data.copy(out.data, (y * w + x) * 3, s, s + 3);
    }
  return out;
}
function label(img, text, ox, oy, scale = 2) {
  const cw = 6 * scale, tw = text.length * cw + 2 * scale, th = 9 * scale;
  for (let y = 0; y < th; y++)
    for (let x = 0; x < tw; x++) {
      const px = ox + x, py = oy + y;
      if (px < img.w && py < img.h) img.data.set([0, 0, 0], (py * img.w + px) * 3);
    }
  [...text].forEach((ch, i) => {
    const g = FONT[ch] ?? FONT[' '];
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 5; c++)
        if (g[r * 5 + c] === '1')
          for (let sy = 0; sy < scale; sy++)
            for (let sx = 0; sx < scale; sx++) {
              const px = ox + scale + i * cw + c * scale + sx, py = oy + scale + r * scale + sy;
              if (px < img.w && py < img.h) img.data.set([255, 255, 255], (py * img.w + px) * 3);
            }
  });
}
/** Grid of {img,text} tiles → JPG file. */
function writeSheet(tiles, cols, tw, th, file) {
  const gap = 4;
  const rows = Math.ceil(tiles.length / cols);
  const sheet = canvas(cols * tw + (cols + 1) * gap, rows * th + (rows + 1) * gap);
  tiles.forEach((t, i) => {
    const x = gap + (i % cols) * (tw + gap), y = gap + Math.floor(i / cols) * (th + gap);
    blit(sheet, resize(t.img, tw, th), x, y);
    if (t.text) label(sheet, t.text, x + 4, y + 4, tw >= 300 ? 2 : 1);
  });
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const tmp = file.replace(/\.jpg$/, '.tmp.png');
  fs.writeFileSync(tmp, encodePNG(sheet));
  ff(['-y', '-i', tmp, '-q:v', '4', file]);
  fs.rmSync(tmp);
  return file;
}
/** One exact frame (fast seek) → {w,h,data}. */
function grab(video, t, w = 384, h = 216) {
  const png = ff(['-ss', String(Math.max(0, t)), '-i', video, '-frames:v', '1', '-s', `${w}x${h}`, '-c:v', 'png', '-f', 'image2pipe', '-'], {buffer: true});
  return decodePNG(png);
}

// ------------------------------------------------------------------ analysis
function frameStats(rgb) {
  let L = 0, S = 0, white = 0, dark = 0;
  const n = rgb.length / 3;
  for (let i = 0; i < n; i++) {
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    L += l;
    S += mx ? (mx - mn) / mx : 0;
    if (l > 200 && mx - mn < 40) white++;
    if (l < 50) dark++;
  }
  return {lum: L / n, sat: S / n, white: white / n, dark: dark / n};
}
const diff = (p, q) => {
  let d = 0;
  for (let i = 0; i < p.length; i++) d += Math.abs(p[i] - q[i]);
  return d / p.length;
};

function detectShots(frames, duration) {
  const d = frames.map((f, i) => (i ? diff(frames[i - 1], f) : 0));
  const cuts = [0];
  for (let i = 1; i < d.length; i++) {
    const win = [];
    for (let k = Math.max(1, i - 6); k <= Math.min(d.length - 1, i + 6); k++) if (k !== i) win.push(d[k]);
    const local = median(win);
    if (d[i] > 14 && d[i] > 3 * local + 4 && i - cuts[cuts.length - 1] >= 3) cuts.push(i);
  }
  return cuts.map((c, k) => {
    const end = k + 1 < cuts.length ? cuts[k + 1] : frames.length;
    const inner = d.slice(c + 1, end);
    const mid = frames[Math.floor((c + end) / 2)] ?? frames[c];
    const st = frameStats(mid);
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < mid.length; i += 3) (r += mid[i]), (g += mid[i + 1]), (b += mid[i + 2]);
    const n = mid.length / 3;
    const s = +(c / SFPS).toFixed(2), e = +Math.min(duration, end / SFPS).toFixed(2);
    return {i: k + 1, s, e, dur: +(e - s).toFixed(2), cut: +d[c].toFixed(1), motion: +mean(inner).toFixed(2), lum: Math.round(st.lum), sat: +st.sat.toFixed(2), white: +st.white.toFixed(2), dark: +st.dark.toFixed(2), avg: hex(r / n, g / n, b / n)};
  });
}

function palette(frames) {
  const counts = new Map();
  let total = 0;
  for (let f = 0; f < frames.length; f += 5)
    for (let i = 0; i < frames[f].length; i += 3) {
      const key = ((frames[f][i] >> 5) << 6) | ((frames[f][i + 1] >> 5) << 3) | (frames[f][i + 2] >> 5);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      total++;
    }
  return [...counts.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, 12)
    .map(([k, c]) => ({hex: hex(((k >> 6) & 7) * 32 + 16, ((k >> 3) & 7) * 32 + 16, (k & 7) * 32 + 16), share: +(c / total).toFixed(3)}));
}

function readWav(file) {
  const buf = fs.readFileSync(file);
  let p = 12;
  while (buf.toString('ascii', p, p + 4) !== 'data') p += 8 + buf.readUInt32LE(p + 4);
  return new Int16Array(buf.buffer, buf.byteOffset + p + 8, buf.readUInt32LE(p + 4) / 2);
}
function audioEnvelope(wav, sr = 16000, hop = 0.1) {
  const pcm = readWav(wav);
  const n = Math.floor(pcm.length / (sr * hop));
  const db = [];
  for (let k = 0; k < n; k++) {
    let s = 0;
    const o = k * sr * hop;
    for (let i = 0; i < sr * hop; i++) s += (pcm[o + i] / 32768) ** 2;
    db.push(+(10 * Math.log10(s / (sr * hop) + 1e-10)).toFixed(1));
  }
  const loud = median(db.filter((x) => x > -60));
  const thr = loud - 18;
  const quiet = [];
  for (let k = 0; k < db.length; ) {
    if (db[k] < thr) {
      let j = k;
      while (j < db.length && db[j] < thr) j++;
      if (j - k >= 4) quiet.push({s: +(k * hop).toFixed(1), e: +(j * hop).toFixed(1)});
      k = j;
    } else k++;
  }
  return {hop, db, median_db: loud, quiet_threshold_db: +thr.toFixed(1), quiet};
}

// ------------------------------------------------------------------ commands
function probe(file) {
  const out = JSON.parse(sh(FFPROBE, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]));
  const v = out.streams.find((s) => s.codec_type === 'video');
  const au = out.streams.find((s) => s.codec_type === 'audio');
  const [fn, fd] = v.r_frame_rate.split('/').map(Number);
  return {duration: +(+out.format.duration).toFixed(2), width: v.width, height: v.height, fps: +(fn / fd).toFixed(2), video_codec: v.codec_name, audio: au ? `${au.codec_name} ${au.sample_rate} Hz ${au.channels}ch` : 'none', size_mb: Math.round(+out.format.size / 1e6)};
}

function ingest() {
  const src = nameArg;
  const name = a.as;
  if (!src || !name || name === true) throw new Error('usage: node tools/watch.mjs ingest <file.mp4> --as <name>');
  const d = refDir(name), c = cacheDir(name);
  fs.mkdirSync(d, {recursive: true});
  fs.mkdirSync(c, {recursive: true});
  const video = path.join(d, 'video.mp4');
  if (path.resolve(src) !== video) {
    if (a.copy) fs.copyFileSync(src, video);
    else fs.renameSync(src, video);
  }
  const meta = {name, source_file: path.basename(src), lang: a.lang ?? 'ar', ...probe(video), ingested: new Date().toISOString().slice(0, 10)};
  console.log(`${name}: ${meta.width}x${meta.height} ${meta.fps} fps, ${fmt(meta.duration)}, ${meta.audio}`);

  console.log('decoding (one pass: scan frames 10 fps + thumbnails 1 fps + audio) …');
  const scan = path.join(c, 'scan.avi'), thumbs = path.join(c, 'thumbs.avi'), wav = path.join(c, 'audio.wav');
  ff(['-y', '-i', video,
    '-map', '0:v', '-an', '-r', String(SFPS), '-s', `${SW}x${SH}`, '-pix_fmt', 'bgr24', '-c:v', 'rawvideo', scan,
    '-map', '0:v', '-an', '-r', '1', '-s', `${TW}x${TH}`, '-pix_fmt', 'bgr24', '-c:v', 'rawvideo', thumbs,
    '-map', '0:a', '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav]);

  const frames = readAVI(scan, SW, SH);
  const shots = detectShots(frames, meta.duration);
  fs.writeFileSync(path.join(d, 'shots.json'), JSON.stringify(shots));
  const env = audioEnvelope(wav);
  fs.writeFileSync(path.join(d, 'audio.json'), JSON.stringify(env));
  meta.palette = palette(frames);
  const st = frames.map(frameStats);
  meta.look = {lum: Math.round(mean(st.map((x) => x.lum))), sat: +mean(st.map((x) => x.sat)).toFixed(2), white_share: +mean(st.map((x) => x.white)).toFixed(2), dark_share: +mean(st.map((x) => x.dark)).toFixed(2)};
  meta.shots = shots.length;
  meta.avg_shot = +(meta.duration / shots.length).toFixed(2);
  meta.median_shot = median(shots.map((s) => s.dur));
  fs.writeFileSync(path.join(d, 'info.json'), JSON.stringify(meta, null, 2));
  console.log(`${shots.length} shots (avg ${meta.avg_shot}s, median ${meta.median_shot}s)`);

  console.log('contact sheets …');
  const th = readAVI(thumbs, TW, TH).map((data) => ({w: TW, h: TH, data}));
  const ov = path.join(d, 'overview');
  fs.rmSync(ov, {recursive: true, force: true});
  for (let m = 0; m * 60 < meta.duration; m++) {
    const tiles = [];
    for (let t = m * 60; t < Math.min(meta.duration, (m + 1) * 60); t += 3) if (th[t]) tiles.push({img: th[t], text: fmt(t).replace(/\.0$/, '')});
    writeSheet(tiles, 5, TW, TH, path.join(ov, `min-${String(m).padStart(2, '0')}.jpg`));
  }
  const sd = path.join(d, 'shots');
  fs.rmSync(sd, {recursive: true, force: true});
  for (let k = 0; k * 30 < shots.length; k++) {
    const tiles = shots.slice(k * 30, k * 30 + 30).map((s) => ({img: th[Math.min(th.length - 1, Math.round((s.s + s.e) / 2))], text: `#${s.i} ${fmt(s.s)} ${s.dur.toFixed(1)}s`}));
    writeSheet(tiles, 6, TW, TH, path.join(sd, `shots-${String(k + 1).padStart(2, '0')}.jpg`));
  }
  report(name);
  fs.rmSync(scan);
  fs.rmSync(thumbs);
  console.log(`→ references/${name}/report.md · overview/min-NN.jpg · shots/shots-NN.jpg   (next: node tools/watch.mjs transcribe ${name})`);
}

function report(name) {
  const meta = loadRef(name);
  const d = refDir(name);
  const shots = JSON.parse(fs.readFileSync(path.join(d, 'shots.json'), 'utf8'));
  const env = JSON.parse(fs.readFileSync(path.join(d, 'audio.json'), 'utf8'));
  const words = fs.existsSync(path.join(d, 'timing', 'words.json')) ? JSON.parse(fs.readFileSync(path.join(d, 'timing', 'words.json'), 'utf8')) : null;
  const mins = Math.ceil(meta.duration / 60);
  const L = [];
  L.push(`# ${name} — machine report`, '', `Source: \`${meta.source_file}\` · ${meta.width}×${meta.height} ${meta.fps} fps · ${fmt(meta.duration)} · ${meta.audio}`, '');
  L.push('## Pace (cuts)', `- **${shots.length} shots**, average **${meta.avg_shot}s**, median **${meta.median_shot}s** (Binly target: a visible change every 2–4 s)`);
  const dur = shots.map((s) => s.dur);
  const bucket = (lo, hi) => dur.filter((x) => x >= lo && x < hi).length;
  L.push(`- shot lengths: <1s ${bucket(0, 1)} · 1–2s ${bucket(1, 2)} · 2–4s ${bucket(2, 4)} · 4–8s ${bucket(4, 8)} · 8s+ ${bucket(8, 1e9)}`);
  const hook = shots.filter((s) => s.s < 60);
  L.push(`- first 60 s (the hook): ${hook.length} shots (avg ${(60 / Math.max(1, hook.length)).toFixed(1)}s) vs whole video avg ${meta.avg_shot}s`);
  L.push(`- longest shots: ${[...shots].sort((x, y) => y.dur - x.dur).slice(0, 6).map((s) => `#${s.i} @${fmt(s.s)} ${s.dur}s`).join(' · ')}`, '');
  L.push('Cuts per minute · motion inside shots (0 = still, 5+ = lively) · brightness · loudness' + (words ? ' · words/min' : ''), '```');
  for (let m = 0; m < mins; m++) {
    const ss = shots.filter((s) => s.s >= m * 60 && s.s < (m + 1) * 60);
    const mot = mean(ss.map((s) => s.motion));
    const lum = mean(ss.map((s) => s.lum));
    const db = mean(env.db.slice(m * 600, (m + 1) * 600));
    const wpm = words ? words.filter((w) => w.s >= m * 60 && w.s < (m + 1) * 60).length : null;
    L.push(`${String(m).padStart(2)}m  cuts ${String(ss.length).padStart(3)} ${bar(ss.length, 40, 20).padEnd(20)}  motion ${mot.toFixed(1).padStart(4)}  lum ${String(Math.round(lum)).padStart(3)}  ${db.toFixed(1)} dB${wpm !== null ? `  ${wpm} w` : ''}`);
  }
  L.push('```', '');
  L.push('## Look', `- average brightness ${meta.look.lum}/255 · saturation ${meta.look.sat} · near-white area ${Math.round(meta.look.white_share * 100)}% · dark area ${Math.round(meta.look.dark_share * 100)}%`);
  L.push(`- dominant colours (share of all pixels): ${meta.palette.map((p) => `${p.hex} ${Math.round(p.share * 100)}%`).join(' · ')}`, '');
  L.push('## Sound', `- median loudness ${env.median_db} dB (RMS, 0.1 s windows); quiet = below ${env.quiet_threshold_db} dB`);
  const q = env.quiet.filter((x) => x.e - x.s >= 0.4);
  L.push(`- ${q.length} quiet gaps ≥ 0.4 s (beats / breaths / dramatic pauses): ${q.slice(0, 30).map((x) => `${fmt(x.s)} (${(x.e - x.s).toFixed(1)}s)`).join(' · ')}${q.length > 30 ? ' …' : ''}`);
  if (words) {
    L.push(`- speech: ${words.length} words → ${(words.length / (meta.duration / 60)).toFixed(0)} words/min`);
  } else L.push(`- no transcript yet → node tools/watch.mjs transcribe ${name}`);
  L.push('', '## Files', '- `overview/min-NN.jpg` — a frame every 3 s, one sheet per minute', '- `shots/shots-NN.jpg` — the middle frame of every shot, numbered like shots.json', '- `shots.json` — every shot: s/e/dur, cut strength, motion, lum, sat, white/dark share, average colour', '- `audio.json` — loudness every 0.1 s + quiet gaps', '- `timing/` — transcript (after transcribe)', '- `STUDY.md` — the director\'s analysis (what to copy, what to avoid)');
  fs.writeFileSync(path.join(d, 'report.md'), L.join('\n') + '\n');
}

function cmdList() {
  if (!fs.existsSync(REFS)) return console.log('no reference videos yet');
  for (const n of fs.readdirSync(REFS)) {
    const f = path.join(REFS, n, 'info.json');
    if (!fs.existsSync(f)) continue;
    const m = JSON.parse(fs.readFileSync(f, 'utf8'));
    const study = fs.existsSync(path.join(REFS, n, 'STUDY.md')) ? 'STUDY.md' : 'no study yet';
    const vid = fs.existsSync(path.join(REFS, n, 'video.mp4')) ? '' : ' (video file missing)';
    console.log(`${n.padEnd(22)} ${fmt(m.duration)}  ${m.fps}fps  ${m.shots} shots (avg ${m.avg_shot}s)  ${study}${vid}  — ${m.source_file}`);
  }
}

function cmdShots() {
  loadRef(nameArg);
  const shots = JSON.parse(fs.readFileSync(path.join(refDir(nameArg), 'shots.json'), 'utf8'));
  const from = +(a.from ?? 0), to = +(a.to ?? 1e9);
  for (const s of shots.filter((x) => x.e > from && x.s < to)) console.log(`#${String(s.i).padEnd(4)} ${fmt(s.s)}–${fmt(s.e)}  ${s.dur.toFixed(1).padStart(5)}s  motion ${s.motion.toFixed(1).padStart(4)}  lum ${String(s.lum).padStart(3)}  sat ${s.sat}  ${s.avg}`);
}

function cmdSheet() {
  const meta = loadRef(nameArg);
  needVideo(meta);
  let times = list(a.times).map(Number);
  if (!times.length) {
    const from = +(a.from ?? 0), to = +(a.to ?? Math.min(meta.duration, from + 60)), n = +(a.n ?? 20);
    times = Array.from({length: n}, (_, i) => from + ((to - from) * i) / Math.max(1, n - 1));
  }
  const tiles = times.map((t) => ({img: grab(meta.video, t), text: fmt(t)}));
  const f = writeSheet(tiles, +(a.cols ?? 5), 384, 216, path.join(cacheDir(nameArg), 'sheets', `sheet-${times[0].toFixed(1)}-${times.at(-1).toFixed(1)}.jpg`));
  console.log(path.relative(ROOT, f));
}

function cmdStrip() {
  const meta = loadRef(nameArg);
  needVideo(meta);
  const at = +a.at, span = +(a.span ?? 2), fps = +(a.fps ?? 8);
  const t0 = Math.max(0, at - span / 2);
  const c = cacheDir(nameArg);
  fs.mkdirSync(c, {recursive: true});
  const tmp = path.join(c, 'strip.avi');
  ff(['-y', '-ss', String(t0), '-i', meta.video, '-t', String(span), '-an', '-r', String(fps), '-s', '384x216', '-pix_fmt', 'bgr24', '-c:v', 'rawvideo', tmp]);
  const fr = readAVI(tmp, 384, 216);
  fs.rmSync(tmp);
  const tiles = fr.map((data, i) => ({img: {w: 384, h: 216, data}, text: fmt(t0 + i / fps)}));
  const f = writeSheet(tiles, +(a.cols ?? 8), 384, 216, path.join(c, 'strips', `strip-${at.toFixed(1)}.jpg`));
  console.log(`${path.relative(ROOT, f)}  (${fr.length} frames, ${fps} fps)`);
}

function cmdFrames() {
  const meta = loadRef(nameArg);
  needVideo(meta);
  const out = path.join(cacheDir(nameArg), 'frames');
  fs.mkdirSync(out, {recursive: true});
  for (const t of list(a.at).map(Number)) {
    const f = path.join(out, `t-${t.toFixed(2)}.jpg`);
    ff(['-y', '-ss', String(t), '-i', meta.video, '-frames:v', '1', '-q:v', '2', f]);
    console.log(path.relative(ROOT, f));
  }
}

function cmdAudio() {
  loadRef(nameArg);
  const d = refDir(nameArg);
  const env = JSON.parse(fs.readFileSync(path.join(d, 'audio.json'), 'utf8'));
  const wf = path.join(d, 'timing', 'words.json');
  const words = fs.existsSync(wf) ? JSON.parse(fs.readFileSync(wf, 'utf8')) : [];
  const from = +(a.from ?? 0), to = +(a.to ?? from + 20), step = +(a.step ?? 0.25);
  const k = Math.max(1, Math.round(step / env.hop));
  for (let t = from; t < to; t += step) {
    const i = Math.round(t / env.hop);
    const v = Math.max(...env.db.slice(i, i + k));
    const w = words.filter((x) => x.s >= t && x.s < t + step).map((x) => x.w).join(' ');
    console.log(`${fmt(t)} ${v.toFixed(0).padStart(4)} dB ${bar(v + 60, 60, 30).padEnd(30)} ${w}`);
  }
}

async function cmdTranscribe() {
  const meta = loadRef(nameArg);
  const c = cacheDir(nameArg);
  const wav = path.join(c, 'audio.wav');
  if (!fs.existsSync(wav)) {
    needVideo(meta);
    fs.mkdirSync(c, {recursive: true});
    ff(['-y', '-i', meta.video, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav]);
  }
  const slug = `ref-${nameArg}`, tag = `vo-${slug}`;
  const up = path.join(c, 'voiceover.wav');
  fs.copyFileSync(wav, up);
  if (sh('gh', ['release', 'view', tag], {allowFail: true}) !== null) gh('release', 'upload', tag, up, '--clobber');
  else gh('release', 'create', tag, up, '--title', `Reference audio: ${nameArg}`, '--notes', 'Audio of a reference video (study only, never used in a render).');
  const lang = a.lang ?? meta.lang ?? 'ar';
  const id = await dispatch('analyze.yml', {slug, model: a.model ?? (lang === 'ar' ? 'large-v3' : 'small.en'), lang});
  console.log(`transcribe run ${id} started`);
  await wait(id, 'transcribe');
  const dir = path.join(refDir(nameArg), 'timing');
  fs.rmSync(dir, {recursive: true, force: true});
  gh('run', 'download', String(id), '-n', `${slug}-timing`, '-D', dir);
  report(nameArg);
  console.log(`→ references/${nameArg}/timing/ (transcript.md, words.json) · report.md updated`);
}

function cmdTranscript() {
  loadRef(nameArg);
  const wf = path.join(refDir(nameArg), 'timing', 'words.json');
  if (!fs.existsSync(wf)) throw new Error(`no transcript yet → node tools/watch.mjs transcribe ${nameArg}`);
  const words = JSON.parse(fs.readFileSync(wf, 'utf8'));
  const from = +(a.from ?? 0), to = +(a.to ?? 1e9);
  let line = [], start = null, last = null;
  const flush = () => {
    if (line.length) console.log(`${fmt(start)}–${fmt(last)}  ${line.join(' ')}`);
    line = [];
  };
  for (const w of words.filter((x) => x.s >= from && x.s < to)) {
    if (last !== null && (w.s - last > 0.45 || line.length >= 14)) flush();
    if (!line.length) start = w.s;
    line.push(w.w);
    last = w.e;
  }
  flush();
}

const cmds = {ingest, list: cmdList, shots: cmdShots, sheet: cmdSheet, strip: cmdStrip, frames: cmdFrames, audio: cmdAudio, transcribe: cmdTranscribe, transcript: cmdTranscript, report: () => (report(nameArg), console.log(`references/${nameArg}/report.md`))};
if (!cmds[cmd]) console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
else await cmds[cmd]();
