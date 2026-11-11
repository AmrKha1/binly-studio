// MOTION CHECK (owner 2026-11-11: "no harsh animation — the viewer must feel good"). Measures how a rendered video
// MOVES with the same ruler we measured the reference with, and flags what makes motion feel harsh:
//   node tools/motion-check.mjs <video.mp4> [--from s --to s] [--json]
// Ruler: every frame (30 fps, 96×54 grey) vs the previous one → % of the picture that changed.
//   cuts/min      — hard cuts (a frame that changes > 8 % while its neighbours are calm). Reference: 1–3.5/min.
//   wipes/min     — full-frame sweeps (≥ 3 frames in a row each changing > 8 %: a wipe, a flash, a fast settle). Ref 1.5–7.
//   still %       — frames where almost nothing moves (< 0.15 %). Reference: 34–65 %.
//   flow          — the median change: the gentle life between beats. Reference: 0.07–0.32.
//   sudden/min    — motion that starts at full speed from rest (no ease-in), not counting cuts. Reference: 0.5–2.5/min.
// Reference: the WHOLE video measured in seven 2-minute windows (2026-11-11). Limits = the reference's own worst window
// (+ a hair): a video inside them moves like the reference; outside = harsher (cuts, sweeps, sudden starts) or deader.
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const REF = {cuts: [1, 3.5], wipes: [1.5, 7], still: [34, 65], flow: [0.07, 0.32], sudden: [0.5, 2.5]};
export const LIMIT = {cuts: 4, wipes: 7.5, still: 66, flow: 0.07, sudden: 3};

export const motionProfile = (file, from = 0, to = 1e6) => new Promise((resolve, reject) => {
  const W = 96, H = 54, N = W * H, FPS = 30;
  const p = spawn(process.env.FFMPEG ?? 'ffmpeg', ['-v', 'error', '-ss', String(from), '-to', String(to), '-i', file, '-vf', `fps=${FPS},scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-']);
  let buf = Buffer.alloc(0), prev = null;
  const d = [];
  p.stdout.on('data', (c) => {
    buf = Buffer.concat([buf, c]);
    while (buf.length >= N) {
      const fr = buf.subarray(0, N);
      buf = buf.subarray(N);
      if (prev) { let s = 0; for (let i = 0; i < N; i++) s += Math.abs(fr[i] - prev[i]); d.push(s / N / 2.55); }
      prev = Buffer.from(fr);
    }
  });
  p.on('error', reject);
  p.on('close', () => {
    if (!d.length) return reject(new Error('no frames decoded'));
    const sec = d.length / FPS, sorted = [...d].sort((a, b) => a - b);
    const big = d.map((x) => x > 8);
    const wipes = [], cuts = [];
    for (let i = 0; i < d.length; i++) {
      if (big[i] && big[i + 1] && big[i + 2] && !(i > 0 && big[i - 1])) { wipes.push(i); continue; }
      const inRun = big[i] && ((i > 0 && big[i - 1]) || big[i + 1]);
      if (inRun) continue;
      const nb = d.slice(Math.max(0, i - 5), i).concat(d.slice(i + 1, i + 6)).sort((a, b) => a - b), med = nb[nb.length >> 1] ?? 0;
      if (d[i] > 8 && d[i] > 4 * med + 2) cuts.push(i);
    }
    let sudden = 0;
    for (let i = 1; i < d.length; i++) if (d[i] > 3 && d[i - 1] < 0.6 && !big[i]) sudden++;
    const at = (list) => list.map((i) => +((i + 1) / FPS + from).toFixed(2));
    resolve({seconds: +sec.toFixed(1), cuts: +(cuts.length / sec * 60).toFixed(1), wipes: +(wipes.length / sec * 60).toFixed(1), still: +(100 * d.filter((x) => x < 0.15).length / d.length).toFixed(1),
      flow: +sorted[Math.floor(0.5 * (sorted.length - 1))].toFixed(2), sudden: +(sudden / sec * 60).toFixed(1), cutTimes: at(cuts), wipeTimes: at(wipes)});
  });
});

export const motionVerdict = (m) => {
  const w = [];
  if (m.cuts > LIMIT.cuts) w.push(`motion: ${m.cuts} hard cuts/min (reference ${REF.cuts.join('–')}) — join scenes with NightShots 'match' (dissolve + settle), cut only on a slam/punchline · at ${m.cutTimes.slice(0, 8).join(', ')} s`);
  if (m.wipes > LIMIT.wipes) w.push(`motion: ${m.wipes} full-frame sweeps/min (reference ${REF.wipes.join('–')}) — the stripe wipe is for CHAPTER changes only · at ${m.wipeTimes.slice(0, 8).join(', ')} s`);
  if (m.still > LIMIT.still) w.push(`motion: ${m.still} % of frames are still (reference ${REF.still.join('–')} %) — let scenes drift (NightShots does it) and keep small life moving`);
  if (m.flow < LIMIT.flow) w.push(`motion: the picture's gentle flow is ${m.flow} (reference ${REF.flow.join('–')}) — too static between the beats`);
  if (m.sudden > LIMIT.sudden) w.push(`motion: ${m.sudden} sudden starts/min (reference ${REF.sudden.join('–')}) — big moves must ease in (move()/moveTo())`);
  return w;
};
export const motionLines = (m) => [
  '| measure | this video | reference |', '|---|---|---|',
  `| hard cuts per minute | ${m.cuts} | ${REF.cuts.join('–')} |`, `| full-frame sweeps per minute | ${m.wipes} | ${REF.wipes.join('–')} |`,
  `| still frames | ${m.still} % | ${REF.still.join('–')} % |`, `| gentle flow (median change) | ${m.flow} | ${REF.flow.join('–')} |`, `| sudden starts per minute | ${m.sudden} | ${REF.sudden.join('–')} |`,
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2), o = {};
  const file = a.find((x) => !x.startsWith('--') && !/^[\d.]+$/.test(x));
  for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) o[a[i].slice(2)] = a[i + 1]?.startsWith('--') || a[i + 1] === undefined ? true : a[++i];
  if (!file) { console.log('usage: node tools/motion-check.mjs <video.mp4> [--from s --to s] [--json]'); process.exit(1); }
  const m = await motionProfile(file, +(o.from ?? 0), +(o.to ?? 1e6));
  if (o.json) console.log(JSON.stringify(m));
  else {
    console.log(motionLines(m).join('\n'));
    const w = motionVerdict(m);
    console.log(w.length ? '\n' + w.map((x) => '⚠ ' + x).join('\n') : '\nMOTION: smooth — within the reference\'s range');
  }
}
