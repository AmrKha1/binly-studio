// Merges SFX cue files into one sorted list: videos/<slug>/sfx/_auto.json (auto cues from the kit, tools/sfx-scan.mjs)
// + videos/<slug>/sfx/<chapter>.json (hand-written story sounds) + videos/<slug>/sfx.json.
// usage: node tools/cloud/merge-sfx.mjs <slug>  → JSON on stdout
// Story (hand) cues always win: an auto cue within 0.15 s of a hand cue is dropped. Bursts are already thinned by the scan.
import fs from 'node:fs';
import path from 'node:path';

const slug = process.argv[2];
const dir = path.join('videos', slug);
let hand = [];
let auto = [];
const read = (f) => {
  try {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    return Array.isArray(j) ? j.filter((s) => typeof s.t === 'number') : [];
  } catch (e) {
    console.error(`WARNING: bad sfx file ${f}: ${e.message}`);
    return [];
  }
};
if (fs.existsSync(path.join(dir, 'sfx.json'))) hand = hand.concat(read(path.join(dir, 'sfx.json')));
if (fs.existsSync(path.join(dir, 'sfx')))
  for (const f of fs.readdirSync(path.join(dir, 'sfx')).sort())
    if (f.endsWith('.json')) (f === '_auto.json' ? (auto = auto.concat(read(path.join(dir, 'sfx', f)))) : (hand = hand.concat(read(path.join(dir, 'sfx', f)))));
hand.sort((a, b) => a.t - b.t);
const near = (t) => hand.some((h) => Math.abs(h.t - t) < 0.15);
const autoKept = auto.filter((s) => !near(s.t));
const all = hand.concat(autoKept).sort((a, b) => a.t - b.t);
console.error(`sfx cues: ${all.length} (${hand.length} story + ${autoKept.length} auto; ${auto.length - autoKept.length} auto dropped next to story sounds)`);
console.log(JSON.stringify(all));
