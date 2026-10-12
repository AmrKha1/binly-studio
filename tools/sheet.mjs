// Contact sheet of the active video: many moments in ONE image (cheap to inspect).
//   node tools/sheet.mjs --from 120 --to 215             (12 evenly spaced frames, 4 columns)
//   node tools/sheet.mjs --from 120 --to 215 --n 20 --cols 5
//   node tools/sheet.mjs --times 121.2,121.5,121.8,122.1 --cols 4   (exact moments, e.g. a transition)
// Output: .cache/sheets/sheet-<from>-<to>.png (or --out file.png)
import path from 'node:path';
import {ROOT, args, done, list, stills} from './lib/render.mjs';

const a = args();
const times = list(a.times).map(Number);
const from = Number(a.from ?? (times[0] ?? 0));
const to = Number(a.to ?? (times[times.length - 1] ?? 10));
const n = Number(a.n ?? 12);
const cols = Number(a.cols ?? (times.length ? Math.min(4, times.length) : 4));
const out = path.resolve(ROOT, a.out ?? `.cache/sheets/sheet-${from.toFixed(1)}-${to.toFixed(1)}${times.length ? '-t' : ''}.png`);
await stills({id: 'Sheet', props: {from, to, n, cols, times}, frames: [0], outFiles: [out]});
await done();
