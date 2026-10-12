// Merges per-chapter SFX cue files (videos/<slug>/sfx/*.json) + videos/<slug>/sfx.json into one sorted list.
// usage: node tools/cloud/merge-sfx.mjs <slug>  → JSON on stdout
import fs from 'node:fs';
import path from 'node:path';

const slug = process.argv[2];
const dir = path.join('videos', slug);
let all = [];
const read = (f) => {
  try {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (Array.isArray(j)) all = all.concat(j);
  } catch (e) {
    console.error(`WARNING: bad sfx file ${f}: ${e.message}`);
  }
};
if (fs.existsSync(path.join(dir, 'sfx.json'))) read(path.join(dir, 'sfx.json'));
if (fs.existsSync(path.join(dir, 'sfx'))) for (const f of fs.readdirSync(path.join(dir, 'sfx')).sort()) if (f.endsWith('.json')) read(path.join(dir, 'sfx', f));
all = all.filter((s) => typeof s.t === 'number').sort((a, b) => a.t - b.t);
// enforce restraint: drop cues closer than 0.25 s to the previous one
const kept = [];
for (const s of all) if (!kept.length || s.t - kept[kept.length - 1].t >= 0.25) kept.push(s);
console.error(`sfx cues: ${kept.length} (${all.length - kept.length} dropped as too close)`);
console.log(JSON.stringify(kept));
