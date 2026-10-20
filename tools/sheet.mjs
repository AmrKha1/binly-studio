// Contact sheet of the active video: many moments in ONE image (cheap to inspect).
//   node tools/sheet.mjs --from 120 --to 215             (12 evenly spaced frames, 4 columns)
//   node tools/sheet.mjs --from 120 --to 215 --n 20 --cols 5
//   node tools/sheet.mjs --times 121.2,121.5,121.8,122.1 --cols 4   (exact moments, e.g. a transition)
//   add --phone  → tiles rendered at upright-phone size (390 px wide, as YouTube shows them on a held-upright phone):
//                  if a label or detail is hard to read on this sheet, it is too small for phone viewers.
// Each tile is rendered as its own still (so SVG clip/mask ids can't collide), then composed into one image.
// Output: .cache/sheets/sheet-<from>-<to>.png (or --out file.png)
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, args, done, list, stills} from './lib/render.mjs';

const a = args();
let times = list(a.times).map(Number);
const from = Number(a.from ?? (times[0] ?? 0));
const to = Number(a.to ?? (times[times.length - 1] ?? 10));
const n = Number(a.n ?? 12);
if (!times.length) times = Array.from({length: n}, (_, i) => (n === 1 ? from : from + ((to - from) * i) / (n - 1)));
const cols = Number(a.cols ?? Math.min(4, times.length));
const phone = a.phone !== undefined;
const out = path.resolve(ROOT, a.out ?? `.cache/sheets/sheet-${from.toFixed(1)}-${to.toFixed(1)}${a.times ? '-t' : ''}${phone ? '-phone' : ''}.png`);
const tileDir = path.join(ROOT, '.cache', 'sheets', `tiles-${process.pid}`); // per run: parallel builders never overwrite each other's tiles
fs.rmSync(tileDir, {recursive: true, force: true});
const scale = phone ? 390 / 1920 : Math.min(1, (1920 / cols - 10) / 1920);
const files = times.map((s, i) => path.join(tileDir, `t${String(i).padStart(3, '0')}.png`));
await stills({id: 'Main', frames: times.map((s) => Math.round(s * 60)), outFiles: files, scale, quiet: true});
const images = files.map((f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`);
const labels = times.map((tt) => `${Math.floor(tt / 60)}:${(tt % 60).toFixed(1).padStart(4, '0')}`);
await stills({id: 'Grid', props: {images, labels, cols}, frames: [0], outFiles: [out]});
fs.rmSync(tileDir, {recursive: true, force: true});
await done();
