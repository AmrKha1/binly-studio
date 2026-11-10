// SOUND DENSITY — the owner's pick B (2026-11-10, by ear from samples/sfx-ab): the reference's map and levels, kept ALIVE
// through the whole video (references/universe-claude/SOUND.md §3). Arabic videos only; English keeps its own rules.
//   · CAP     at most 34 effects in any 60 s (the reference's hook rate) — the smallest auto sounds give way first
//   · SIGNOFF silence after the last spoken word (+0.4 s for its tail)
//   · report  QUIET = a stretch > 3.6 s of speech with no sound · LOW = a minute under 24/min (hook under 30/min)
//             → the fix is a visual beat that carries its own sound (a pill, label, count, path dot), never a filler
// Used by tools/cloud/merge-sfx.mjs (applies CAP + SIGNOFF to the final list) and tools/sfx-scan.mjs (prints the report).
export const DENSITY = {cap: 34, window: 60, quiet: 3.6, low: 24, hookLow: 30, hook: 60, tail: 0.4};
// lower = gives way first under the cap (booms, stamps, risers, reveals are never dropped)
const RANK = {tick: 1, click: 1, pop: 2, popup: 2, swish: 2, blip: 2, thump: 3, whoosh: 4, swoosh: 4, sparkle: 5, shimmer: 5, ding: 6, chime: 6};
const KEEP = 7; // anything not in RANK (boom, slam, stamp, riser, impact, neon …) is never dropped

/** apply CAP + SIGNOFF. cues: [{t, kind, auto?}] sorted; lastWord: end time of the last spoken word (s) */
export const applyDensity = (cues, lastWord) => {
  let out = cues.filter((c) => !(lastWord != null && c.t > lastWord + DENSITY.tail));
  const afterSignoff = cues.length - out.length;
  let capped = 0;
  for (;;) {
    // every cue inside ANY over-cap 60 s window is a candidate
    const over = new Uint8Array(out.length);
    for (let i = 0, j = 0; i < out.length; i++) {
      while (out[j].t < out[i].t - DENSITY.window + 1e-9) j++;
      if (i - j + 1 > DENSITY.cap) over.fill(1, j, i + 1);
    }
    // the smallest kind gives way first; among equals the most crowded one (closest to a neighbour) — thins evenly
    let worst = null;
    for (let k = 0; k < out.length; k++) {
      if (!over[k]) continue;
      const c = out[k], r = c.auto ? RANK[c.kind] ?? KEEP : KEEP;
      if (r >= KEEP) continue;
      const gap = (k > 0 ? c.t - out[k - 1].t : 9) + (k < out.length - 1 ? out[k + 1].t - c.t : 9); // the hole it would leave
      const score = r * 100 + gap;
      if (!worst || score < worst.score) worst = {k, score};
    }
    if (!worst) break;
    out.splice(worst.k, 1);
    capped++;
  }
  return {cues: out, afterSignoff, capped};
};

/** the B report: flags for quiet stretches and thin minutes while the narrator speaks */
export const densityReport = (cues, words) => {
  const flags = [];
  if (!words?.length) return {flags, perMin: null};
  const first = words[0].s, last = words[words.length - 1].e ?? words[words.length - 1].s;
  const ts = cues.map((c) => c.t).filter((t) => t >= first - 0.5 && t <= last + DENSITY.tail).sort((a, b) => a - b);
  const pts = [first, ...ts, last];
  for (let i = 1; i < pts.length; i++)
    if (pts[i] - pts[i - 1] > DENSITY.quiet) flags.push({type: 'QUIET', from: pts[i - 1], to: pts[i], msg: `${(pts[i] - pts[i - 1]).toFixed(1)} s of speech with no sound — add a visual beat that carries its sound`});
  const span = last - first;
  const count = (a, b) => ts.filter((t) => t >= a && t < b).length;
  const hookEnd = Math.min(first + DENSITY.hook, last);
  const hookRate = (count(first, hookEnd) / Math.max(1, hookEnd - first)) * 60;
  if (span > 30 && hookRate < DENSITY.hookLow) flags.push({type: 'LOW', from: first, to: hookEnd, msg: `hook ${hookRate.toFixed(0)}/min (reference 34, floor ${DENSITY.hookLow})`});
  for (let a = first + DENSITY.hook; a + DENSITY.window <= last; a += 15) {
    const r = count(a, a + DENSITY.window);
    if (r < DENSITY.low) flags.push({type: 'LOW', from: a, to: a + DENSITY.window, msg: `${r}/min (floor ${DENSITY.low})`});
  }
  // merge overlapping LOW windows into one flag
  const quiet = flags.filter((f) => f.type === 'QUIET'), low = [];
  for (const f of flags.filter((f) => f.type === 'LOW')) {
    const p = low[low.length - 1], r = Number(f.msg.match(/^(?:hook )?(\d+)/)[1]);
    if (p && !p.hook && !f.msg.startsWith('hook') && f.from <= p.to) { p.to = f.to; p.min = Math.min(p.min, r); }
    else low.push({...f, min: r, hook: f.msg.startsWith('hook')});
  }
  for (const f of low) if (!f.hook) f.msg = `lowest ${f.min}/min in this stretch (floor ${DENSITY.low})`;
  const all = [...quiet, ...low.map(({min, hook, ...f}) => f)].sort((x, y) => x.from - y.from);
  return {flags: all, perMin: (ts.length / Math.max(1, span)) * 60, hookRate};
};
