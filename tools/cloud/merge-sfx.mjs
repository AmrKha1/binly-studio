// Merges SFX cue files into one sorted list: videos/<slug>/sfx/_auto.json (auto cues from the kit, tools/sfx-scan.mjs)
// + videos/<slug>/sfx/<chapter>.json (hand-written story sounds) + videos/<slug>/sfx.json.
// usage: node tools/cloud/merge-sfx.mjs <slug>  → JSON on stdout
// Story (hand) cues always win: an auto cue within 0.15 s of a hand cue is dropped. Bursts are already thinned by the scan.
import fs from 'node:fs';
import path from 'node:path';
import {applyDensity} from '../lib/sfx-density.mjs';
import {readWordTimes} from '../lib/word-times.mjs';

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
// score.kindOnly (per video, owner 2026-11-17): {kind: [times]} — that kind plays ONLY at these moments (± 0.4 s);
// e.g. the long riser kept for the big payoffs only (39 risers felt "everywhere"). [] = the kind is removed.
{
  const sc = (() => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'score.json'), 'utf8')); } catch { return {}; } })();
  // DEFAULT RISER RULE (owner 2026-11-17: 39 long risers in one video felt "everywhere"): a riser/rise/powerup plays only
  // when it BUILDS INTO A HIT (boom/impact/explosion/stamp/slam 0.1–2.2 s after it) and at most one per 45 s; the rest go.
  // A video can still choose its own moments with score.kindOnly (wins over this rule).
  const RISE = /^(riser|rise|powerup)$/, HIT = /^(boom|impact|explosion|stamp|slam|wrong|fall|cash|thump)$/;
  if (!sc.kindOnly && !sc.allRisers) {
    const leadsToHit = (c) => all.some((h) => HIT.test(h.kind) && h.t - c.t > 0.1 && h.t - c.t < 3.0);
    const risers = all.filter((c) => RISE.test(c.kind));
    const keep = new Set();
    // 1) the builders' own risers first (the moments chosen on purpose), 2) auto risers only where no riser is near
    for (const pass of [(c) => !c.auto, (c) => c.auto])
      for (const c of risers.filter(pass))
        if (leadsToHit(c) && [...keep].every((k) => Math.abs(k.t - c.t) >= 45)) keep.add(c);
    const before = all.length;
    all = all.filter((c) => !RISE.test(c.kind) || keep.has(c));
    console.error(`riser rule: kept ${keep.size} riser(s) building into a hit (≥ 45 s apart), removed ${before - all.length}`);
  }
  if (sc.kindOnly) {
    const before = all.length;
    all = all.filter((c) => !(c.kind in sc.kindOnly) || sc.kindOnly[c.kind].some((t) => Math.abs(t - c.t) <= 0.4));
    console.error(`kindOnly: ${before - all.length} cue(s) removed (${Object.keys(sc.kindOnly).join(', ')})`);
  }
}
console.error(`sfx cues: ${all.length} (${hand.length} story + ${autoKept.length} auto; ${auto.length - autoKept.length} auto dropped next to story sounds)`);
// ARABIC = the owner's pick B (tools/lib/sfx-density.mjs): ≤ 34 per minute, silence after the last word
const vj = (() => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'video.json'), 'utf8')); } catch { return {}; } })();
if (vj.lang === 'ar') {
  let last = null;
  const w = readWordTimes(dir); last = w.length ? w[w.length - 1].e ?? w[w.length - 1].s : null; // times only (no words in the repo)
  const d = applyDensity(all, last);
  all = d.cues;
  console.error(`sound density (B): ${all.length} cues · ${d.capped} small auto sounds dropped by the 34/min cap · ${d.afterSignoff} after the sign-off removed`);
}
console.log(JSON.stringify(all));
