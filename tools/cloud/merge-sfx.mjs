// Merges SFX cue files into one sorted list: videos/<slug>/sfx/_auto.json (auto cues from the kit, tools/sfx-scan.mjs)
// + videos/<slug>/sfx/<chapter>.json (hand-written story sounds) + videos/<slug>/sfx.json.
// usage: node tools/cloud/merge-sfx.mjs <slug>  → JSON on stdout
// Story (hand) cues always win: an auto cue within 0.15 s of a hand cue is dropped. Bursts are already thinned by the scan.
import fs from 'node:fs';
import path from 'node:path';
import {applyDensity} from '../lib/sfx-density.mjs';

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
let all = hand.concat(autoKept).sort((a, b) => a.t - b.t);
console.error(`sfx cues: ${all.length} (${hand.length} story + ${autoKept.length} auto; ${auto.length - autoKept.length} auto dropped next to story sounds)`);
// ARABIC = the owner's pick B (tools/lib/sfx-density.mjs): ≤ 34 per minute, silence after the last word
const vj = (() => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'video.json'), 'utf8')); } catch { return {}; } })();
if (vj.lang === 'ar') {
  let last = null;
  try { const w = JSON.parse(fs.readFileSync(path.join(dir, 'timing', 'words.json'), 'utf8')); last = w.length ? w[w.length - 1].e ?? w[w.length - 1].s : null; } catch {}
  const d = applyDensity(all, last);
  all = d.cues;
  console.error(`sound density (B): ${all.length} cues · ${d.capped} small auto sounds dropped by the 34/min cap · ${d.afterSignoff} after the sign-off removed`);
}
console.log(JSON.stringify(all));
