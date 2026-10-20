// Cut characters out of a white-background picture → one transparent PNG per figure.
//   node tools/cutout.mjs <image.png|jpg|webp> --out library/hosts/oddestory [--names shocked,confused,laugh,angry,wink]
//        [--white 232]
// How: everything near-white that is CONNECTED TO THE IMAGE BORDER is background (the character's white face, shirt and
// hands stay, because the black outline encloses them). Edge pixels get soft alpha (anti-aliasing kept, no white fringe).
// Then each separate figure (connected region) is cropped and saved, ordered row by row, left to right.
// Note: white gaps fully enclosed by the outline (e.g. between an arm and the body) stay white — fine on white mode.
// Uses only the bundled ffmpeg (no installs).
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import zlib from 'node:zlib';
import {ROOT, args} from './lib/render.mjs';

const FF = path.join(ROOT, 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe');
const FP = path.join(ROOT, 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffprobe.exe');
const ff = fs.existsSync(FF) ? FF : 'ffmpeg';
const fp = fs.existsSync(FP) ? FP : 'ffprobe';
const a = args();
const input = a._[0];
if (!input || !fs.existsSync(input)) {
  console.log('usage: node tools/cutout.mjs <image> --out <folder> [--names a,b,c] [--white 232]');
  process.exit(1);
}
const outDir = path.resolve(ROOT, a.out ?? 'library/hosts/_cutout');
const names = a.names ? String(a.names).split(',') : [];
const WHITE = Number(a.white ?? 232);
fs.mkdirSync(outDir, {recursive: true});

// ── decode to raw RGBA
const [W, H] = execFileSync(fp, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', input], {encoding: 'utf8'}).trim().split(',').map(Number);
const raw = execFileSync(ff, ['-v', 'error', '-i', input, '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'rawvideo', '-pix_fmt', 'rgba', '-'], {maxBuffer: 1 << 30});
const px = new Uint8ClampedArray(raw.buffer, raw.byteOffset, W * H * 4);
const N = W * H;
const minC = (i) => Math.min(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
const maxC = (i) => Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
const isWhite = (i) => minC(i) >= WHITE && maxC(i) - minC(i) < 18;

// ── background = near-white connected to the border (4-connected flood fill)
const bg = new Uint8Array(N);
const stack = [];
const push = (i) => {
  if (!bg[i] && isWhite(i)) {
    bg[i] = 1;
    stack.push(i);
  }
};
for (let x = 0; x < W; x++) push(x), push((H - 1) * W + x);
for (let y = 0; y < H; y++) push(y * W), push(y * W + W - 1);
while (stack.length) {
  const i = stack.pop();
  const x = i % W;
  if (x > 0) push(i - 1);
  if (x < W - 1) push(i + 1);
  if (i >= W) push(i - W);
  if (i < N - W) push(i + W);
}

// ── alpha: background 0; foreground pixels next to the background get soft alpha from how dark they are
const alpha = new Uint8ClampedArray(N);
for (let i = 0; i < N; i++) alpha[i] = bg[i] ? 0 : 255;
const nearBg = (i) => {
  const x = i % W, y = (i / W) | 0;
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < W && yy < H && bg[yy * W + xx]) return true;
    }
  return false;
};
for (let i = 0; i < N; i++) {
  if (bg[i] || !nearBg(i)) continue;
  const m = minC(i);
  if (m < 150) continue; // solid outline: keep opaque
  // a grey edge pixel = outline colour mixed with white → un-mix: alpha from darkness, colour pulled back to the outline
  const al = Math.max(0, Math.min(1, (255 - m) / (255 - 150)));
  alpha[i] = Math.round(al * 255);
  for (let c = 0; c < 3; c++) {
    const v = px[i * 4 + c];
    px[i * 4 + c] = al > 0.02 ? Math.max(0, Math.min(255, (v - (1 - al) * 255) / al)) : v;
  }
}

// ── figures = 8-connected regions of alpha > 0; merge small bits into the nearest big figure
const lab = new Int32Array(N).fill(-1);
const comps = [];
for (let s0 = 0; s0 < N; s0++) {
  if (alpha[s0] === 0 || lab[s0] >= 0) continue;
  const id = comps.length;
  const c = {id, n: 0, x0: W, y0: H, x1: 0, y1: 0, px: []};
  const q = [s0];
  lab[s0] = id;
  while (q.length) {
    const i = q.pop();
    c.px.push(i);
    c.n++;
    const x = i % W, y = (i / W) | 0;
    if (x < c.x0) c.x0 = x;
    if (x > c.x1) c.x1 = x;
    if (y < c.y0) c.y0 = y;
    if (y > c.y1) c.y1 = y;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = yy * W + xx;
        if (alpha[j] > 0 && lab[j] < 0) {
          lab[j] = id;
          q.push(j);
        }
      }
  }
  comps.push(c);
}
const big = comps.filter((c) => c.n > N * 0.01);
const small = comps.filter((c) => c.n <= N * 0.01 && c.n > 25);
for (const s of small) {
  // attach to the big figure whose box (grown by 4%) contains it; otherwise it is dust → dropped
  const g = Math.round(Math.max(W, H) * 0.04);
  const host = big.find((b) => s.x0 >= b.x0 - g && s.x1 <= b.x1 + g && s.y0 >= b.y0 - g && s.y1 <= b.y1 + g);
  if (host) {
    host.px.push(...s.px);
    host.x0 = Math.min(host.x0, s.x0);
    host.y0 = Math.min(host.y0, s.y0);
    host.x1 = Math.max(host.x1, s.x1);
    host.y1 = Math.max(host.y1, s.y1);
  }
}
// --split (opt-in): split figures that TOUCH (e.g. overlapping feathers): find empty columns in the lower half of a figure (between the
// bodies/legs) and cut there. Upper parts that overlap are divided at the same line (a straight cut through a feather
// tip can show — if it does, regenerate the sheet with more space between poses).
if (a.split) {
  const out = [];
  for (const c of big) {
    const hgt = c.y1 - c.y0 + 1, wid = c.x1 - c.x0 + 1;
    const col = new Int32Array(wid);
    const yb = c.y0 + hgt * 0.5;
    for (const i of c.px) if (((i / W) | 0) >= yb) col[(i % W) - c.x0]++;
    const cuts = [];
    let run = -1;
    for (let x = 0; x < wid; x++) {
      if (col[x] === 0) { if (run < 0) run = x; }
      else if (run >= 0) { if (x - run >= 6 && run > wid * 0.08 && x < wid * 0.92) cuts.push(c.x0 + ((run + x) >> 1)); run = -1; }
    }
    if (!cuts.length) { out.push(c); continue; }
    const edges = [c.x0 - 1, ...cuts, c.x1 + 1];
    for (let k = 0; k < edges.length - 1; k++) {
      const part = {id: c.id, n: 0, x0: W, y0: H, x1: 0, y1: 0, px: []};
      for (const i of c.px) {
        const x = i % W, y = (i / W) | 0;
        if (x > edges[k] && x <= edges[k + 1]) { part.px.push(i); part.n++; if (x < part.x0) part.x0 = x; if (x > part.x1) part.x1 = x; if (y < part.y0) part.y0 = y; if (y > part.y1) part.y1 = y; }
      }
      if (part.n > N * 0.005) out.push(part);
    }
  }
  big.length = 0;
  big.push(...out);
}
// order: rows (by vertical centre, tolerance 15% of height), then left → right
big.sort((p, q) => {
  const cy = (c) => (c.y0 + c.y1) / 2;
  return Math.abs(cy(p) - cy(q)) > H * 0.15 ? cy(p) - cy(q) : p.x0 - q.x0;
});

// minimal PNG writer (RGBA 8-bit) — Node zlib + CRC, no dependencies
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([l, td, c]); };
const pngRGBA = (rgba, w, h) => {
  const rows = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { rows[y * (w * 4 + 1)] = 0; rgba.copy(rows, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(rows, {level: 9})), chunk('IEND', Buffer.alloc(0))]);
};

// ── write each figure as a cropped RGBA PNG (16 px padding)
const PAD = 16;
const written = [];
big.forEach((c, k) => {
  const x0 = Math.max(0, c.x0 - PAD), y0 = Math.max(0, c.y0 - PAD);
  const w = Math.min(W, c.x1 + PAD + 1) - x0, h = Math.min(H, c.y1 + PAD + 1) - y0;
  const buf = Buffer.alloc(w * h * 4);
  for (const i of c.px) {
    const x = (i % W) - x0, y = ((i / W) | 0) - y0;
    const o = (y * w + x) * 4;
    buf[o] = px[i * 4];
    buf[o + 1] = px[i * 4 + 1];
    buf[o + 2] = px[i * 4 + 2];
    buf[o + 3] = alpha[i];
  }
  const name = (names[k] ?? `pose-${String(k + 1).padStart(2, '0')}`).trim();
  const file = path.join(outDir, `${name}.png`);
  fs.writeFileSync(file, pngRGBA(buf, w, h));
  written.push(`${path.relative(ROOT, file)} (${w}×${h})`);
});
console.log(`cutout: ${big.length} figure(s) from ${path.basename(input)} (${W}×${H})`);
written.forEach((w) => console.log('  ' + w));
if (names.length && names.length !== big.length) console.log(`WARNING: ${names.length} names given but ${big.length} figures found — check the files`);
