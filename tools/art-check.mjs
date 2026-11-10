// ART CHECK — the gate every cut-out passes before it may be used in a video (owner 2026-11-10: "make a check step for
// every element before using it"). For each transparent PNG it looks for the background remover's typical mistakes:
//   HOLE    a white area inside the object walled by its outline (background stuck in a gap: trophy handles, rings)
//   FRINGE  a light/white halo along the edge (shows as a white rim on the night sky)
//   SPECKS  loose little bits floating around the object
//   CUT     the object touches the image border (part of it may be cut off)
//   SMALL   too few pixels to stay sharp at hero size (< 360 px on its long side)
// and draws a review sheet: every item on the NIGHT background and on bright MAGENTA (magenta exposes any leftover white),
// labelled PASS / the flags. Nothing flagged should go into a video until fixed (regenerate — images are free) or
// approved by eye (`node tools/art.mjs approve <name>`).
//   node tools/art-check.mjs <folder | a.png b.png …> [--sheet out.jpg] [--json]
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {ROOT, args} from './lib/render.mjs';

const BFF = path.join(ROOT, 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe');
const BFP = path.join(ROOT, 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffprobe.exe');
const has = (c) => spawnSync(c, ['-version'], {encoding: 'utf8'}).status === 0;
const FULL = has('ffmpeg'); // the full build (drawtext) draws the labels; the bundled one still checks
const FF = FULL ? 'ffmpeg' : BFF, FP = has('ffprobe') ? 'ffprobe' : BFP;

export const checkPng = (file) => {
  const [W, H] = execFileSync(FP, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file], {encoding: 'utf8'}).trim().split(',').map(Number);
  const raw = execFileSync(FF, ['-v', 'error', '-i', file, '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'rawvideo', '-pix_fmt', 'rgba', '-'], {maxBuffer: 1 << 30});
  const p = new Uint8Array(raw.buffer, raw.byteOffset, W * H * 4);
  const N = W * H;
  const A = (i) => p[i * 4 + 3];
  const mn = (i) => Math.min(p[i * 4], p[i * 4 + 1], p[i * 4 + 2]);
  const mx = (i) => Math.max(p[i * 4], p[i * 4 + 1], p[i * 4 + 2]);
  const flags = [];
  let opaque = 0;
  for (let i = 0; i < N; i++) if (A(i) > 128) opaque++;
  // CUT: opaque pixels on the outer 2 px
  let border = 0;
  for (let x = 0; x < W; x++) for (const y of [0, 1, H - 2, H - 1]) if (A(y * W + x) > 128) border++;
  for (let y = 0; y < H; y++) for (const x of [0, 1, W - 2, W - 1]) if (A(y * W + x) > 128) border++;
  if (border > 20) flags.push(`CUT (${border} px on the border)`);
  // FRINGE: edge pixels (opaque next to transparent) that are near-white
  let edge = 0, light = 0;
  for (let i = 0; i < N; i++) {
    if (A(i) < 128) continue;
    const x = i % W;
    const t = (x > 0 && A(i - 1) < 20) || (x < W - 1 && A(i + 1) < 20) || (i >= W && A(i - W) < 20) || (i < N - W && A(i + W) < 20);
    if (!t) continue;
    edge++;
    if (mn(i) > 225) light++;
  }
  if (edge && light / edge > 0.12) flags.push(`FRINGE (${Math.round((100 * light) / edge)} % of the edge is white)`);
  // HOLE: pure-white opaque regions walled by dark outline
  const seen = new Uint8Array(N);
  const pure = (i) => A(i) > 200 && mn(i) >= 244 && mx(i) - mn(i) < 10;
  let holes = 0, holePx = 0;
  for (let s = 0; s < N; s++) {
    if (seen[s] || !pure(s)) continue;
    const reg = [s];
    seen[s] = 1;
    let dark = 0, wall = 0;
    for (let k = 0; k < reg.length; k++) {
      const i = reg[k], x = i % W;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1]) {
        if (j < 0) continue;
        if (pure(j)) { if (!seen[j]) { seen[j] = 1; reg.push(j); } continue; }
        const d = j - i;
        let w = j, kind = 0;
        for (let q = 0; q < 6 && w >= 0 && w < N; q++, w += d) {
          if (A(w) < 128) { kind = 3; break; }
          if (mx(w) < 120) { kind = 1; break; }
          if (mn(w) < 200 && mx(w) - mn(w) > 25) { kind = 2; break; }
        }
        wall++;
        if (kind === 1) dark++;
      }
    }
    if (reg.length >= Math.max(400, opaque * 0.004) && wall && dark / wall >= 0.55) {
      holes++;
      holePx += reg.length;
    }
  }
  if (holes) flags.push(`HOLE (${holes} white gap${holes > 1 ? 's' : ''}, ${((100 * holePx) / opaque).toFixed(1)} % of the object)`);
  // SPECKS: separate opaque islands much smaller than the object
  const lab = new Uint8Array(N);
  const sizes = [];
  for (let s = 0; s < N; s++) {
    if (lab[s] || A(s) < 128) continue;
    const st = [s];
    lab[s] = 1;
    let n = 0;
    while (st.length) {
      const i = st.pop();
      n++;
      const x = i % W;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1]) if (j >= 0 && !lab[j] && A(j) >= 128) { lab[j] = 1; st.push(j); }
    }
    sizes.push(n);
  }
  sizes.sort((a, b) => b - a);
  const specks = sizes.slice(1).filter((n) => n < sizes[0] * 0.01).length;
  if (specks > 3) flags.push(`SPECKS (${specks} loose bits)`);
  if (Math.max(W, H) < 360) flags.push(`SMALL (${W}×${H})`);
  return {file, w: W, h: H, flags, ok: flags.length === 0};
};

// ── review sheet: each item on the night sky and on magenta, labelled
export const reviewSheet = (results, out) => {
  const T = 300, cols = 4, cellW = T * 2 + 30, cellH = T + 60;
  const rows = Math.ceil(results.length / cols);
  const inputs = [], parts = [];
  results.forEach((r, i) => inputs.push('-i', r.file));
  let chain = `color=c=0x10081F:s=${cols * cellW}x${rows * cellH}[bg0]`;
  let last = 'bg0';
  results.forEach((r, i) => {
    const cx = (i % cols) * cellW, cy = Math.floor(i / cols) * cellH;
    parts.push(`[${i}]scale=${T}:${T}:force_original_aspect_ratio=decrease,split[a${i}][b${i}]`);
    parts.push(`color=c=0x1E0D4A:s=${T}x${T}[n${i}]`, `color=c=0xFF00FF:s=${T}x${T}[m${i}]`);
    parts.push(`[n${i}][a${i}]overlay=(W-w)/2:(H-h)/2[na${i}]`, `[m${i}][b${i}]overlay=(W-w)/2:(H-h)/2[mb${i}]`);
    parts.push(`[${last}][na${i}]overlay=${cx + 10}:${cy + 10}[s${i}a]`, `[s${i}a][mb${i}]overlay=${cx + T + 20}:${cy + 10}[s${i}b]`);
    last = `s${i}b`;
    if (FULL) {
      const label = `${path.basename(r.file, '.png')}  ${r.ok ? 'PASS' : r.flags.map((f) => f.split(' ')[0]).join(' ')}`.replace(/[':\\]/g, '');
      parts.push(`[${last}]drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':text='${label}':x=${cx + 12}:y=${cy + T + 20}:fontsize=24:fontcolor=${r.ok ? '0x4BEA92' : '0xFF5A6A'}[t${i}]`);
      last = `t${i}`;
    }
  });
  const fc = [chain, ...parts].join(';');
  execFileSync(FF, ['-v', 'error', '-y', ...inputs, '-filter_complex', fc, '-map', `[${last}]`, '-frames:v', '1', out]);
  return out;
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const a = args();
  const files = a._.flatMap((x) => (fs.statSync(x).isDirectory() ? fs.readdirSync(x).filter((f) => f.endsWith('.png')).sort().map((f) => path.join(x, f)) : [x]));
  if (!files.length) {
    console.log('usage: node tools/art-check.mjs <folder | a.png …> [--sheet out.jpg] [--json]');
    process.exit(1);
  }
  const res = files.map(checkPng);
  if (a.json) console.log(JSON.stringify(res, null, 1));
  else for (const r of res) console.log(`${r.ok ? '✓' : '✗'} ${path.basename(r.file)}${r.ok ? '' : '  ' + r.flags.join(' · ')}`);
  const sheet = path.resolve(ROOT, a.sheet ?? '.cache/art-check/review.jpg');
  fs.mkdirSync(path.dirname(sheet), {recursive: true});
  reviewSheet(res, sheet);
  console.log(`review sheet → ${path.relative(ROOT, sheet)}  (${res.filter((r) => !r.ok).length} flagged of ${res.length})`);
  process.exit(res.every((r) => r.ok) ? 0 : 2);
}
