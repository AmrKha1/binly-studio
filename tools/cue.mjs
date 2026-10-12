// Exact narration timing lookups from videos/<slug>/timing/words.json (slug = active video unless --slug).
//   node tools/cue.mjs "hot bath was medicine"          → start/end seconds of every occurrence
//   node tools/cue.mjs "opens the body" "1348" "Paris"  → several phrases at once
//   node tools/cue.mjs --range 120 185                  → every word with its start time in that window
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, args} from './lib/render.mjs';

const a = args();
const active = fs.readFileSync(path.join(ROOT, 'src', 'active.ts'), 'utf8').match(/videos\/([^']+)'/)?.[1];
const slug = a.slug ?? active;
const file = path.join(ROOT, 'videos', slug, 'timing', 'words.json');
if (!fs.existsSync(file)) {
  console.log(`no timing for "${slug}" yet (${path.relative(ROOT, file)}) — run node tools/cloud.mjs analyze ${slug}`);
  process.exit(1);
}
const words = JSON.parse(fs.readFileSync(file, 'utf8'));
const norm = (s) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^\w'.%]+/g, ' ').replace(/(?<!\d)\.|\.(?!\d)/g, ' ').trim();
const keys = words.map((w) => norm(w.w));

if (a.range) {
  const [s, e] = [Number(a.range), Number(a._[0])];
  const sel = words.filter((w) => w.s >= s && w.s <= e);
  console.log(sel.map((w) => `${w.s.toFixed(2)} ${w.w}`).join('  '));
  process.exit(0);
}
for (const phrase of a._) {
  const target = norm(phrase).split(' ').filter(Boolean);
  const hits = [];
  for (let i = 0; i + target.length <= keys.length; i++) {
    let ok = true;
    for (let k = 0; k < target.length; k++) {
      if (keys[i + k] !== target[k] && !(k === target.length - 1 && keys[i + k].startsWith(target[k]))) {
        ok = false;
        break;
      }
    }
    if (ok) hits.push(`${words[i].s.toFixed(2)}–${words[i + target.length - 1].e.toFixed(2)} (P${words[i].p})`);
  }
  console.log(`"${phrase}": ${hits.length ? hits.join(', ') : 'NOT FOUND (check spelling against the transcript)'}`);
}
