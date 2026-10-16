// Sync check — AFTER building, before the final render: does every spoken sentence get a visible change on screen?
// Renders a small frame just before and just after each sentence's cue and measures how much of the picture changed.
// A sentence whose picture barely changes ("words over a still frame") is flagged. No tokens: pixels are compared here,
// you only read the short list. Takes ~10–20 min on this PC for a 10-min video (2 small stills per sentence).
//   node tools/sync-check.mjs [--slug s] [--chapter C03] [--min 3.5]     (--min = % of pixels that must change)
// A flag is fine when the hold is intentional (payoff moment, big reveal held 2–3 s) — note it, don't "fix" it.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {ROOT, args, done, stills} from './lib/render.mjs';

const a = args();
const active = fs.readFileSync(path.join(ROOT, 'src', 'active.ts'), 'utf8').match(/videos\/([^']+)'/)?.[1];
const slug = a.slug ?? active;
if (slug !== active) {
  console.log(`sync-check renders the ACTIVE video (${active}). Run: node tools/activate.mjs ${slug}`);
  process.exit(1);
}
const vdir = path.join(ROOT, 'videos', slug);
const MIN = Number(a.min ?? 3.5); // % of pixels that must change (measured: a new idea ≥ 5 %, a small tag only ~1–3 %)
const BEFORE = 0.35, AFTER = 1.0; // s around the sentence start (entrances land ~0.15 s before the word)
const FPS = 60;

const words = JSON.parse(fs.readFileSync(path.join(vdir, 'timing', 'words.json'), 'utf8'));
let sents = [];
let cur = [];
for (const w of words) {
  cur.push(w);
  if (/[.?!…]["”')]?$/.test(w.w)) { sents.push({s: cur[0].s, text: cur.map((x) => x.w).join(' ')}); cur = []; }
}
if (cur.length) sents.push({s: cur[0].s, text: cur.map((x) => x.w).join(' ')});
const chapters = JSON.parse(fs.readFileSync(path.join(vdir, 'chapters.json'), 'utf8'));
if (a.chapter) {
  const ch = chapters.find((c) => c.id === a.chapter);
  if (!ch) { console.log(`no chapter ${a.chapter}`); process.exit(1); }
  sents = sents.filter((x) => x.s >= ch.start && x.s < ch.end);
}
sents = sents.filter((x) => x.s > BEFORE + 0.1);
const chOf = (t) => chapters.find((c) => t >= c.start && t < c.end)?.id ?? '?';

// tiny PNG decoder (8-bit, non-interlaced RGB/RGBA/gray — what Chrome writes) → luminance array
function lumaOf(file) {
  const b = fs.readFileSync(file);
  let p = 8, w = 0, h = 0, ct = 0;
  const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), type = b.toString('ascii', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; W = w; }
    else if (type === 'IDAT') idat.push(d);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : ct === 4 ? 2 : 1;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp, out = new Uint8Array(w * h);
  let prev = new Uint8Array(stride), row = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const left = i >= bpp ? row[i - bpp] : 0, up = prev[i], ul = i >= bpp ? prev[i - bpp] : 0;
      let v = src[i];
      if (f === 1) v += left; else if (f === 2) v += up; else if (f === 3) v += (left + up) >> 1;
      else if (f === 4) { const pa = Math.abs(up - ul), pb = Math.abs(left - ul), pc = Math.abs(left + up - 2 * ul); v += pa <= pb && pa <= pc ? left : pb <= pc ? up : ul; }
      row[i] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const o = x * bpp;
      out[y * w + x] = bpp >= 3 ? (row[o] * 299 + row[o + 1] * 587 + row[o + 2] * 114) / 1000 : row[o];
    }
    [prev, row] = [row, prev];
  }
  return out;
}
// % of pixels that changed, after aligning the two frames (±3 px) so the camera's slow drift doesn't count as "new"
let W = 480;
const changed = (A, B) => {
  const H = A.length / W;
  let best = 100;
  for (let dy = -3; dy <= 3; dy++)
    for (let dx = -3; dx <= 3; dx++) {
      let n = 0, tot = 0;
      for (let y = 4; y < H - 4; y += 2)
        for (let x = 4; x < W - 4; x += 2) {
          tot++;
          if (Math.abs(A[y * W + x] - B[(y + dy) * W + x + dx]) > 18) n++;
        }
      best = Math.min(best, (100 * n) / tot);
    }
  return best;
};

const dir = path.join(ROOT, '.cache', 'sync-check');
fs.rmSync(dir, {recursive: true, force: true});
fs.mkdirSync(dir, {recursive: true});
const frames = [], files = [];
sents.forEach((x, i) => {
  frames.push(Math.round((x.s - BEFORE) * FPS), Math.round((x.s + AFTER) * FPS));
  files.push(path.join(dir, `${i}-a.png`), path.join(dir, `${i}-b.png`));
});
console.log(`sync-check ${slug}${a.chapter ? ' ' + a.chapter : ''}: ${sents.length} sentences → rendering ${frames.length} small frames…`);
const t0 = Date.now();
await stills({id: 'Main', frames, outFiles: files, scale: 0.25, quiet: true});
await done();
const flags = [];
sents.forEach((x, i) => {
  const pct = changed(lumaOf(files[2 * i]), lumaOf(files[2 * i + 1]));
  if (pct < MIN) flags.push(`  WEAK ${chOf(x.s)} ${Math.floor(x.s / 60)}:${(x.s % 60).toFixed(1).padStart(4, '0')}  ${pct.toFixed(2)}% changed  "${x.text.slice(0, 70)}${x.text.length > 70 ? '…' : ''}"`);
});
fs.rmSync(dir, {recursive: true, force: true});
flags.forEach((l) => console.log(l));
console.log(`\nsync-check: ${sents.length} sentences, ${flags.length} with only a weak visible change (< ${MIN}% of pixels) · ${((Date.now() - t0) / 60000).toFixed(1)} min`);
console.log(flags.length ? 'Fix the real ones (one round) — an intentional hold on a payoff moment is fine.' : 'PASS');
