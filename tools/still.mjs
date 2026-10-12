// Render full-resolution QA stills.
//   node tools/still.mjs --at 12.5 --at 40            (Main = active video, times in seconds)
//   node tools/still.mjs --at 12.5,13,13.5 --scale 0.5
//   node tools/still.mjs --comp Gallery --props '{"page":"icons"}' --at 2
// Output: .cache/stills/<comp>-<time>.png (or --out <dir>)
import path from 'node:path';
import {ROOT, args, done, list, stills} from './lib/render.mjs';

const a = args();
const id = a.comp ?? 'Main';
const props = a.props ? JSON.parse(a.props) : {};
const times = list(a.at).map(Number);
if (!times.length) {
  console.log('usage: node tools/still.mjs [--comp Main|Gallery] [--props JSON] --at <seconds>[,<seconds>...] [--scale 0.5] [--out dir]');
  process.exit(1);
}
const outDir = path.resolve(ROOT, a.out ?? '.cache/stills');
const tag = props.page ? `${id}-${props.page}` : id;
await stills({
  id,
  props,
  frames: times.map((s) => Math.round(s * 60)),
  outFiles: times.map((s) => path.join(outDir, `${tag}-${s.toFixed(2)}.png`)),
  scale: Number(a.scale ?? 1),
});
await done();
