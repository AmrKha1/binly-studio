// Text-steadiness ("vibration") test: does text move exactly with the shapes around it during slow camera moves?
// Chrome/Skia can snap glyphs to whole pixels; under a slow drift the text then lags and jumps (sawtooth) while
// shapes glide. This renders N consecutive frames, measures the centroid of each text box relative to a reference
// shape box, and fails if any frame-to-frame residual exceeds the limit.
//
//   node tools/jitter-test.mjs --kit                                   built-in test page (Gallery "jitter"): SVG + HTML text
//   node tools/jitter-test.mjs --at 53.0 --text x0,y0,x1,y1 --ref x0,y0,x1,y1 [--frames 30]   real shot of the active video
//   node tools/jitter-test.mjs --mp4 file.mp4 --at 334 --text … --ref …                     a rendered video
//   node tools/jitter-test.mjs --dir .cache/jitter/run [--kit | --text … --ref …]           re-measure kept frames
// Options: --comp Gallery --props '{"page":"templates"}' (another composition) · --frames N (30) · --limit px (0.5) · --keep (keep the PNGs in .cache/jitter/run) · several --text boxes allowed.
// Boxes are screen pixels (1920×1080). Pick a text box with only that text inside, and a ref box around a flat shape
// that moves with the text (same camera layer) and stays fully inside the box for all frames.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {ROOT, args, done, list, stills} from './lib/render.mjs';
import {FFMPEG} from './lib/sys.mjs';

const a = args();
const N = Number(a.frames ?? 30);
// a pixel-snapping sawtooth shows as ~1.0 px residuals (0.6–1.0 in an encoded mp4); sub-pixel glyph quantisation noise
// stays below ~0.5 px.
const LIMIT = Number(a.limit ?? 0.5);
const box = (s) => s.split(',').map(Number);
const outDir = path.join(ROOT, '.cache', 'jitter', 'run');
const fresh = () => { fs.rmSync(outDir, {recursive: true, force: true}); fs.mkdirSync(outDir, {recursive: true}); };
const pngsIn = (d) => fs.readdirSync(d).filter((n) => n.endsWith('.png') && /^f\d+/.test(n)).sort().map((n) => path.join(d, n));

let texts, ref, files;
if (a.dir) a.keep = true; // re-measure already rendered frames (f000.png, f001.png, …) — never delete them
if (a.kit) {
  // boxes for src/gallery/pages/jitter.tsx at t = 1.0–1.5 s
  ref = [1400, 130, 1660, 350];
  texts = {'SVG Headline': [180, 180, 1000, 310], 'HTML RichText': [180, 365, 1250, 480], 'HTML Para': [180, 565, 1250, 690], 'SVG Kicker 30': [180, 750, 900, 830]};
  if (a.dir) files = pngsIn(path.resolve(a.dir));
  else {
  fresh();
  files = Array.from({length: N}, (_, i) => path.join(outDir, `f${String(i).padStart(3, '0')}.png`));
  await stills({id: 'Gallery', props: {page: 'jitter'}, frames: files.map((_, i) => 60 + i), outFiles: files, quiet: true});
  await done();
  }
} else if ((a.at !== undefined || a.dir) && a.text && a.ref) {
  ref = box(a.ref);
  texts = Object.fromEntries(list(a.text).length ? [].concat(a.text).map((s, i) => [`text ${i + 1}`, box(s)]) : []);
  const f0 = Math.round(Number(a.at ?? 0) * 60);
  if (!a.dir) fresh();
  files = Array.from({length: N}, (_, i) => path.join(outDir, `f${String(i).padStart(3, '0')}.png`));
  if (a.dir) files = pngsIn(path.resolve(a.dir));
  else if (a.mp4) {
    const r = spawnSync(FFMPEG, ['-v', 'error', '-ss', String(a.at), '-i', path.resolve(a.mp4), '-frames:v', String(N), '-pix_fmt', 'gray', path.join(outDir, 'f%03d.png')], {encoding: 'utf8'});
    if (r.status !== 0) throw new Error(r.stderr);
    files = fs.readdirSync(outDir).sort().map((n) => path.join(outDir, n));
  } else {
    await stills({id: a.comp ?? 'Main', props: a.props ? JSON.parse(a.props) : {}, frames: files.map((_, i) => f0 + i), outFiles: files, quiet: true});
    await done();
  }
} else {
  console.log('usage: node tools/jitter-test.mjs --kit | --at <sec> --text x0,y0,x1,y1 --ref x0,y0,x1,y1 [--mp4 file] [--frames 30] [--limit 0.25]');
  process.exit(1);
}

// --- PNG decode (8-bit, gray / gray+alpha / RGB / RGBA, non-interlaced) → luminance
function decode(file) {
  const b = fs.readFileSync(file);
  let o = 8, w, h, ct, idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), ty = b.toString('ascii', o + 4, o + 8), d = b.subarray(o + 8, o + 8 + len);
    if (ty === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; if (d[8] !== 8 || d[12]) throw new Error('only 8-bit non-interlaced PNG'); }
    if (ty === 'IDAT') idat.push(d);
    o += 12 + len;
  }
  const bpp = {0: 1, 2: 3, 4: 2, 6: 4}[ct];
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const st = w * bpp, px = Buffer.alloc(st * h), lum = new Float32Array(w * h);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[p++];
    for (let x = 0; x < st; x++) {
      const A = x >= bpp ? px[y * st + x - bpp] : 0, U = y ? px[(y - 1) * st + x] : 0, Cc = x >= bpp && y ? px[(y - 1) * st + x - bpp] : 0;
      let v = raw[p++];
      if (ft === 1) v += A; else if (ft === 2) v += U; else if (ft === 3) v += (A + U) >> 1;
      else if (ft === 4) { const pp = A + U - Cc, pa = Math.abs(pp - A), pb = Math.abs(pp - U), pc = Math.abs(pp - Cc); v += pa <= pb && pa <= pc ? A : pb <= pc ? U : Cc; }
      px[y * st + x] = v & 255;
    }
  }
  for (let i = 0; i < w * h; i++) {
    const q = i * bpp;
    lum[i] = bpp >= 3 ? (px[q] + px[q + 1] + px[q + 2]) / 3 : px[q]; // equal weights: robust to LCD (ClearType) colour fringes
  }
  return {w, h, lum};
}
// centroid of "ink" in a box: weight = |lum − background| (background = median of the box border)
function centroid(im, [x0, y0, x1, y1]) {
  const border = [];
  for (let x = x0; x < x1; x++) border.push(im.lum[y0 * im.w + x], im.lum[(y1 - 1) * im.w + x]);
  for (let y = y0; y < y1; y++) border.push(im.lum[y * im.w + x0], im.lum[y * im.w + x1 - 1]);
  border.sort((p, q) => p - q);
  const bg = border[border.length >> 1];
  let s = 0, sx = 0, sy = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const v = Math.max(0, Math.abs(im.lum[y * im.w + x] - bg) - 6);
    s += v; sx += v * x; sy += v * y;
  }
  return s ? [sx / s, sy / s] : [NaN, NaN];
}

const imgs = files.map(decode);
const refC = imgs.map((im) => centroid(im, ref));
if (refC.some((c) => Number.isNaN(c[0]))) {
  console.log('reference box is empty (no shape inside) in some frames — pick a box around a solid shape');
  process.exit(2);
}
const median = (v) => [...v].sort((p, q) => p - q)[v.length >> 1];
let fail = false;
const mv = (k) => (refC.at(-1)[k] - refC[0][k]) / (refC.length - 1);
console.log(`${files.length} frames · reference moves ${mv(0).toFixed(3)} px/frame in x, ${mv(1).toFixed(3)} in y · limit ${LIMIT} px`);
for (const [name, bx] of Object.entries(texts)) {
  const r = imgs.map((im, i) => { const c = centroid(im, bx); return [c[0] - refC[i][0], c[1] - refC[i][1]]; });
  const res = [0, 1].map((k) => {
    const d = r.slice(1).map((v, i) => v[k] - r[i][k]);
    const m = median(d);
    const e = d.map((v) => v - m); // frame-to-frame residual vs the smooth trend
    const d2 = d.slice(1).map((v, i) => v - d[i]);
    const sd = Math.sqrt(e.reduce((s, v) => s + v * v, 0) / e.length);
    return {max: Math.max(...e.map(Math.abs)), d2: Math.max(...d2.map(Math.abs)), sd};
  });
  const ok = res.every((q) => q.max <= LIMIT);
  if (!ok) fail = true;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(14)}  x: max residual ${res[0].max.toFixed(3)} sd ${res[0].sd.toFixed(3)} max|d2| ${res[0].d2.toFixed(3)}   y: max residual ${res[1].max.toFixed(3)} sd ${res[1].sd.toFixed(3)} max|d2| ${res[1].d2.toFixed(3)}`);
  if (a.verbose) r.forEach((v, i) => console.log(String(i).padStart(4), v[0].toFixed(3).padStart(9), v[1].toFixed(3).padStart(9)));
}
if (!a.keep) fs.rmSync(outDir, {recursive: true, force: true});
console.log(fail ? 'JITTER TEST FAILED — text lags/jumps against shapes' : 'JITTER TEST PASSED');
process.exit(fail ? 1 : 0);
