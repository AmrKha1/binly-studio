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
//   node tools/watch.mjs zoom <name> --at t[,t2] --box x,y,w,h [--fps 30 --span 1]   crop+enlarge (text/glow detail, pop-in frame by frame)
//   node tools/watch.mjs color <name> --at t --pts "x,y;x,y" | --line x1,y1,x2,y2 [--n 12]   exact colour codes
//   node tools/watch.mjs spectro <name> --from a --to b | --file x.ogg   SEE the sound: spectrogram under the frames
//   node tools/watch.mjs hits <name> [--from a --to b --db 9]   sound-effect hits + the words around them
//   node tools/watch.mjs audio <name> --from a --to b [--step 0.25]   loudness bars + words (hear the mix/rhythm)
//   node tools/watch.mjs transcribe <name> [--lang ar]          cloud whisper (large-v3), ENCRYPTED both ways → references/<name>/timing/ (local only)
//   node tools/watch.mjs transcript <name> [--from a --to b]    timed spoken lines
//   node tools/watch.mjs separate <name>                        cloud Demucs: voice / sound-effects stems, ENCRYPTED both ways → .cache/ref/<name>/stems (local only)
//   node tools/watch.mjs sfx <name>                             every sound effect of the reference: time, type, level under the voice, what is on screen
// Outputs of sheet/strip/frames go to .cache/ref/<name>/ (look at them with Read).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {ROOT, args, list} from './lib/render.mjs';
import {FFMPEG, FFPROBE, gh, sh} from './lib/sys.mjs';
import {dispatch, wait} from './lib/gha.mjs';
import {encryptFile, decryptFile} from './cloud/crypt.mjs';

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

/** The private key for sealed cloud jobs: .cache/ref/key.txt locally + repo secret REF_KEY (set once). */
function refKey() {
  const f = path.join(ROOT, '.cache', 'ref', 'key.txt');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  const key = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(path.dirname(f), {recursive: true});
  sh('gh', ['secret', 'set', 'REF_KEY', '--body', key]);
  fs.writeFileSync(f, key);
  return key;
}

// Reference videos are OTHER creators' work and the repo is public: the audio goes up ENCRYPTED, the transcript comes
// back ENCRYPTED, and the upload is deleted afterwards. Nothing readable ever touches GitHub.
async function cmdTranscribe() {
  const meta = loadRef(nameArg);
  const c = cacheDir(nameArg);
  const wav = path.join(c, 'audio.wav');
  if (!fs.existsSync(wav)) {
    needVideo(meta);
    fs.mkdirSync(c, {recursive: true});
    ff(['-y', '-i', meta.video, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav]);
  }
  const key = refKey();
  const slug = `ref-${nameArg}`, tag = `vo-${slug}`;
  const up = path.join(c, 'voiceover.enc');
  encryptFile(wav, up, key);
  if (sh('gh', ['release', 'view', tag], {allowFail: true}) !== null) gh('release', 'upload', tag, up, '--clobber');
  else gh('release', 'create', tag, up, '--title', 'Sealed study audio', '--notes', 'Encrypted (AES-256-GCM). Temporary; deleted after transcription.');
  fs.rmSync(up);
  const lang = a.lang ?? meta.lang ?? 'ar';
  try {
    const id = await dispatch('analyze.yml', {slug, model: a.model ?? (lang === 'ar' ? 'large-v3' : 'small.en'), lang, sealed: '1'});
    console.log(`transcribe run ${id} started (sealed)`);
    await wait(id, 'transcribe');
    const tmp = path.join(c, 'dl');
    fs.rmSync(tmp, {recursive: true, force: true});
    gh('run', 'download', String(id), '-n', `${slug}-timing`, '-D', tmp);
    const tgz = path.join(c, 'timing.tgz');
    decryptFile(path.join(tmp, 'timing.enc'), tgz, key);
    const dir = path.join(refDir(nameArg), 'timing');
    fs.rmSync(dir, {recursive: true, force: true});
    sh('tar', ['-xzf', path.basename(tgz), '-C', path.relative(c, refDir(nameArg)).split(path.sep).join('/')], {cwd: c});
    fs.rmSync(tmp, {recursive: true, force: true});
    fs.rmSync(tgz);
  } finally {
    sh('gh', ['release', 'delete', tag, '--yes', '--cleanup-tag'], {allowFail: true});
  }
  report(nameArg);
  console.log(`→ references/${nameArg}/timing/ (local only) · report.md updated · cloud upload deleted`);
}

// SEPARATE (owner 2026-11-10: "like the reference, not from our brain"): split the reference audio into VOICE and
// EVERYTHING ELSE (its sound effects) in the cloud — sealed both ways like transcribe — so `sfx` can list every effect.
// → .cache/ref/<name>/stems/voice.flac + fx.flac (local only, never committed)
async function cmdSeparate() {
  const meta = loadRef(nameArg);
  const c = cacheDir(nameArg);
  needVideo(meta);
  fs.mkdirSync(c, {recursive: true});
  const src = path.join(c, 'mix.wav');
  if (!fs.existsSync(src)) ff(['-y', '-i', meta.video, '-vn', '-c:a', 'pcm_s16le', src]); // original 44.1 kHz stereo, lossless
  const key = refKey();
  const slug = `ref-${nameArg}`, tag = `vo-${slug}`;
  const up = path.join(c, 'voiceover.enc');
  encryptFile(src, up, key);
  if (sh('gh', ['release', 'view', tag], {allowFail: true}) !== null) gh('release', 'upload', tag, up, '--clobber');
  else gh('release', 'create', tag, up, '--title', 'Sealed study audio', '--notes', 'Encrypted (AES-256-GCM). Temporary; deleted after separation.');
  fs.rmSync(up);
  try {
    const id = await dispatch('separate.yml', {slug, model: a.model ?? 'htdemucs_ft'});
    console.log(`separate run ${id} started (sealed)`);
    await wait(id, 'separate');
    const tmp = path.join(c, 'dl');
    fs.rmSync(tmp, {recursive: true, force: true});
    gh('run', 'download', String(id), '-n', `${slug}-stems`, '-D', tmp);
    const tar = path.join(c, 'stems.tar');
    decryptFile(path.join(tmp, 'stems.enc'), tar, key);
    fs.rmSync(path.join(c, 'stems'), {recursive: true, force: true});
    sh('tar', ['-xf', 'stems.tar'], {cwd: c});
    fs.rmSync(tmp, {recursive: true, force: true});
    fs.rmSync(tar);
  } finally {
    sh('gh', ['release', 'delete', tag, '--yes', '--cleanup-tag'], {allowFail: true});
  }
  console.log(`→ ${path.relative(ROOT, path.join(c, 'stems'))}/voice.flac + fx.flac (local only) · cloud upload deleted · next: node tools/watch.mjs sfx ${nameArg}`);
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

/** Crop a box of the 1920×1080 frame at one or many times, enlarged → see text outlines, glow, pop-in frame by frame. */
function cmdZoom() {
  const meta = loadRef(nameArg);
  needVideo(meta);
  const [x, y, w, h] = list(a.box).map(Number);
  if (!(w > 0 && h > 0)) throw new Error('--box x,y,w,h (in 1920×1080 pixels)');
  const k = +(a.scale ?? Math.min(4, Math.max(1, Math.floor(900 / w))));
  let times = list(a.at).map(Number);
  if (a.fps) {
    const t0 = times[0], span = +(a.span ?? 1), fps = +a.fps;
    times = Array.from({length: Math.round(span * fps)}, (_, i) => +(t0 + i / fps).toFixed(3));
  }
  const tiles = times.map((t) => {
    const png = ff(['-ss', String(t), '-i', meta.video, '-frames:v', '1', '-vf', `crop=${w}:${h}:${x}:${y},scale=${w * k}:${h * k}:flags=neighbor`, '-c:v', 'png', '-f', 'image2pipe', '-'], {buffer: true});
    return {img: decodePNG(png), text: fmt(t).replace(/(\.\d)$/, (m) => m) + (a.fps ? ` ${((t - times[0]) * 1000).toFixed(0)}ms` : '')};
  });
  const cols = +(a.cols ?? Math.max(1, Math.min(times.length, Math.floor(2400 / (w * k)))));
  const f = writeSheet(tiles, cols, w * k, h * k, path.join(cacheDir(nameArg), 'zoom', `zoom-${times[0].toFixed(2)}-${x}-${y}.jpg`));
  console.log(`${path.relative(ROOT, f)}  (${times.length} × ${w}×${h} @${k}x)`);
}

/** Exact colours: --pts "x,y;x,y" or --line x1,y1,x2,y2 [--n 12] (1920×1080 coords, 5×5 average). */
function cmdColor() {
  const meta = loadRef(nameArg);
  needVideo(meta);
  const img = decodePNG(ff(['-ss', String(+a.at), '-i', meta.video, '-frames:v', '1', '-c:v', 'png', '-f', 'image2pipe', '-'], {buffer: true}));
  const at = (px, py) => {
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const X = Math.min(img.w - 1, Math.max(0, Math.round(px) + dx)), Y = Math.min(img.h - 1, Math.max(0, Math.round(py) + dy));
        const i = (Y * img.w + X) * 3;
        r += img.data[i], g += img.data[i + 1], b += img.data[i + 2], n++;
      }
    return hex(r / n, g / n, b / n);
  };
  let pts = String(a.pts ?? '').split(';').filter(Boolean).map((p) => p.split(',').map(Number));
  if (a.line) {
    const [x1, y1, x2, y2] = list(a.line).map(Number), n = +(a.n ?? 12);
    pts = Array.from({length: n}, (_, i) => [x1 + ((x2 - x1) * i) / (n - 1), y1 + ((y2 - y1) * i) / (n - 1)]);
  }
  for (const [px, py] of pts) console.log(`${String(Math.round(px)).padStart(4)},${String(Math.round(py)).padEnd(4)} ${at(px, py)}`);
}

/** Sound-effect hits: sudden bright (high-frequency) energy jumps, with the words spoken at that moment. */
function cmdHits() {
  loadRef(nameArg);
  const wav = path.join(cacheDir(nameArg), 'audio.wav');
  if (!fs.existsSync(wav)) throw new Error('audio.wav missing in .cache — run ingest again');
  const pcm = readWav(wav), sr = 16000, hop = 160; // 10 ms
  const n = Math.floor(pcm.length / hop);
  const full = new Float64Array(n), hf = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    let s = 0, d = 0;
    for (let i = k * hop; i < (k + 1) * hop; i++) {
      const v = pcm[i] / 32768, dv = i ? v - pcm[i - 1] / 32768 : 0;
      s += v * v;
      d += dv * dv;
    }
    full[k] = 10 * Math.log10(s / hop + 1e-10);
    hf[k] = 10 * Math.log10(d / hop + 1e-10);
  }
  const wf = path.join(refDir(nameArg), 'timing', 'words.json');
  const words = fs.existsSync(wf) ? JSON.parse(fs.readFileSync(wf, 'utf8')) : [];
  const from = +(a.from ?? 0), to = +(a.to ?? n / 100), thr = +(a.db ?? 18);
  const cuts = JSON.parse(fs.readFileSync(path.join(refDir(nameArg), "shots.json"), "utf8")).map((x) => x.s);
  const loudRef = median([...full].filter((x) => x > -60));
  let last = -1;
  for (let k = Math.round(from * 100) + 20; k < Math.min(n, to * 100); k++) {
    const prev = median([...hf.slice(k - 20, k - 2)]);
    const jump = hf[k] - prev;
    if (jump > thr && full[k] > loudRef - 12 && k - last > 15) {
      last = k;
      const t = k / 100;
      const w = words.filter((x) => x.s > t - 0.6 && x.s < t + 0.6).map((x) => (Math.abs(x.s - t) < 0.04 ? `[${x.w}]` : x.w)).join(' ');
      const cut = cuts.find((c) => Math.abs(c - t) <= 0.25);
      console.log(`${fmt(t)}  +${jump.toFixed(0).padStart(2)} dB  ${cut !== undefined ? `CUT ${fmt(cut)}` : "          "}  ${w}`);
    }
  }
}

/**
 * See the sound: a spectrogram (log frequency 60 Hz–8 kHz, time →) lined up under video frames of the same moment.
 *   watch.mjs spectro <ref> --from a --to b [--pps 220]     reference video moment
 *   watch.mjs spectro --file x.ogg [--from a --to b]        any audio file (compare candidate SFX with the reference)
 * Read the shapes: whoosh = a sweeping noise band · pop/click = a short vertical blip · ding/chime = clean horizontal
 * lines that ring out · hit/thump = a heavy low blob · riser = a band climbing · speech = stacked wavy stripes (formants).
 * Vertical white ticks = word starts (if a transcript exists).
 */
function cmdSpectro() {
  const SR = 16000, NFFT = 1024, pps = +(a.pps ?? 220), HGT = 300;
  let pcm, video = null, words = [], lbl;
  const from = +(a.from ?? 0);
  if (a.file) {
    const tmp = path.join(ROOT, '.cache', 'ref', '_spectro.wav');
    fs.mkdirSync(path.dirname(tmp), {recursive: true});
    ff(['-y', '-i', String(a.file), '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', tmp]);
    pcm = readWav(tmp);
    lbl = path.basename(String(a.file));
  } else {
    const meta = loadRef(nameArg);
    pcm = readWav(path.join(cacheDir(nameArg), 'audio.wav'));
    video = fs.existsSync(meta.video) ? meta.video : null;
    const wf = path.join(refDir(nameArg), 'timing', 'words.json');
    if (fs.existsSync(wf)) words = JSON.parse(fs.readFileSync(wf, 'utf8'));
    lbl = nameArg;
  }
  const to = +(a.to ?? Math.min(pcm.length / SR, from + 4));
  const n0 = Math.floor(from * SR), n1 = Math.min(pcm.length, Math.floor(to * SR));
  const cols = Math.max(1, Math.round((to - from) * pps));
  // radix-2 FFT
  const fft = (re, im) => {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) [re[i], re[j]] = [re[j], re[i]], [im[i], im[j]] = [im[j], im[i]];
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (-2 * Math.PI) / len;
      for (let i = 0; i < n; i += len)
        for (let k = 0; k < len / 2; k++) {
          const wr = Math.cos(ang * k), wi = Math.sin(ang * k);
          const ur = re[i + k], ui = im[i + k];
          const vr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi, vi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
          re[i + k] = ur + vr, im[i + k] = ui + vi, re[i + k + len / 2] = ur - vr, im[i + k + len / 2] = ui - vi;
        }
    }
  };
  const hann = Float64Array.from({length: NFFT}, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (NFFT - 1)));
  const fLo = 60, fHi = 8000;
  const binOf = (row) => (fLo * Math.pow(fHi / fLo, 1 - row / (HGT - 1)) * NFFT) / SR;
  const mag = [];
  let peak = -200;
  for (let c = 0; c < cols; c++) {
    const center = n0 + Math.round(((n1 - n0) * c) / cols);
    const re = new Float64Array(NFFT), im = new Float64Array(NFFT);
    for (let i = 0; i < NFFT; i++) {
      const k = center - NFFT / 2 + i;
      re[i] = k >= 0 && k < pcm.length ? (pcm[k] / 32768) * hann[i] : 0;
    }
    fft(re, im);
    const col = new Float64Array(HGT);
    for (let r = 0; r < HGT; r++) {
      const b = binOf(r), b0 = Math.floor(b), b1 = Math.min(NFFT / 2 - 1, b0 + 1), fr = b - b0;
      const m0 = Math.hypot(re[b0], im[b0]), m1 = Math.hypot(re[b1], im[b1]);
      col[r] = 20 * Math.log10(m0 * (1 - fr) + m1 * fr + 1e-9);
      if (col[r] > peak) peak = col[r];
    }
    mag.push(col);
  }
  const ramp = (v) => {
    // magma-like: black → purple → orange → pale yellow
    const st = [[0, 0, 0, 4], [0.3, 80, 18, 123], [0.6, 222, 73, 104], [0.85, 252, 170, 95], [1, 252, 253, 191]];
    for (let i = 1; i < st.length; i++)
      if (v <= st[i][0]) {
        const k = (v - st[i - 1][0]) / (st[i][0] - st[i - 1][0]);
        return [0, 1, 2].map((j) => Math.round(st[i - 1][j + 1] + (st[i][j + 1] - st[i - 1][j + 1]) * k));
      }
    return st[st.length - 1].slice(1);
  };
  const tileW = 192, tileH = 108;
  const top = video ? tileH + 6 : 0;
  const img = canvas(cols, top + HGT + 22, [18, 18, 22]);
  if (video) {
    for (let x = 0; x + tileW <= cols + tileW / 2; x += tileW) {
      const t = from + (x + tileW / 2) / pps;
      if (t > to) break;
      const fr = resize(grab(video, t, tileW, tileH), tileW, tileH);
      const cut = {w: Math.min(tileW, cols - x), h: tileH, data: Buffer.alloc(Math.min(tileW, cols - x) * tileH * 3)};
      for (let yy = 0; yy < tileH; yy++) fr.data.copy(cut.data, yy * cut.w * 3, yy * tileW * 3, yy * tileW * 3 + cut.w * 3);
      blit(img, cut, x, 0);
    }
  }
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < HGT; r++) {
      const v = clamp01v((mag[c][r] - (peak - 75)) / 75);
      img.data.set(ramp(v), ((top + r) * cols + c) * 3);
    }
  // frequency guides (500 Hz, 1k, 2k, 4k) + word ticks + time labels
  for (const f of [250, 1000, 4000]) {
    const r = Math.round((1 - Math.log(f / fLo) / Math.log(fHi / fLo)) * (HGT - 1));
    for (let c = 0; c < cols; c += 6) img.data.set([120, 120, 140], ((top + r) * cols + c) * 3);
  }
  for (const w of words.filter((x) => x.s >= from && x.s < to)) {
    const c = Math.round((w.s - from) * pps);
    for (let r = 0; r < 14; r++) img.data.set([255, 255, 255], ((top + r) * cols + c) * 3);
  }
  for (let s = Math.ceil(from * 4) / 4; s < to; s += 0.25) {
    const c = Math.round((s - from) * pps);
    const big = Math.abs(s - Math.round(s)) < 1e-6;
    for (let r = 0; r < (big ? 10 : 5); r++) img.data.set([200, 200, 200], ((top + HGT + r) * cols + c) * 3);
    if (Math.abs((s * 2) - Math.round(s * 2)) < 1e-6) label(img, fmt(s), Math.min(cols - 70, c + 2), top + HGT + 8, 1);
  }
  const out = path.join(ROOT, '.cache', 'ref', a.file ? '_files' : nameArg, 'spectro', `${lbl.replace(/[^\w.-]/g, '_')}-${from.toFixed(2)}.jpg`);
  fs.mkdirSync(path.dirname(out), {recursive: true});
  const tmp = out.replace(/\.jpg$/, '.tmp.png');
  fs.writeFileSync(tmp, encodePNG(img));
  ff(['-y', '-i', tmp, '-q:v', '3', out]);
  fs.rmSync(tmp);
  console.log(`${path.relative(ROOT, out)}  (${(to - from).toFixed(2)} s, ${cols}px)`);
}
const clamp01v = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

const cmds = {spectro: cmdSpectro, zoom: cmdZoom, color: cmdColor, hits: cmdHits, ingest, list: cmdList, shots: cmdShots, sheet: cmdSheet, strip: cmdStrip, frames: cmdFrames, audio: cmdAudio, transcribe: cmdTranscribe, separate: cmdSeparate, transcript: cmdTranscript, report: () => (report(nameArg), console.log(`references/${nameArg}/report.md`))};
if (!cmds[cmd]) console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
else await cmds[cmd]();
