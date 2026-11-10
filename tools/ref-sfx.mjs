// REF SFX (owner 2026-11-10: "like the reference, not from our brain — the types, the volume, everything"):
// lists EVERY sound effect of a reference video from its separated stems (tools/watch.mjs separate):
//   .cache/ref/<name>/stems/voice.flac (the narrator) + fx.flac (everything else = the sound design)
// For each effect: time, length, TYPE (from its sound: attack, body, pitch, noise, low/high energy, sweep), its level
// UNDER THE VOICE (dB), whether the voice was speaking over it, the nearest cut, and the words around it.
//   node tools/ref-sfx.mjs <name> [--list] [--type whoosh] [--from a --to b]   (one chapter's sounds: --list --from 94 --to 168)
// → .cache/ref/<name>/sfx.json (local only — other creators' material) + a summary table (numbers only).
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, args} from './lib/render.mjs';
import {readWav} from './lib/audio.mjs';
import {earBands, EAR_SR} from './lib/ear-level.mjs'; // the SAME ruler make-audio uses to set our cues

const a = args();
const name = a._[0];
if (!name) (console.log('usage: node tools/ref-sfx.mjs <name> [--list] [--type t]'), process.exit(1));
// --voice v.wav --fx fx.wav --out dir : measure OUR OWN mix the same way (calibration / QA against the reference)
const c = a.out ? path.resolve(a.out) : path.join(ROOT, '.cache', 'ref', name), rdir = path.join(ROOT, 'references', name);
fs.mkdirSync(path.join(c, 'stems'), {recursive: true});
const SR = EAR_SR, HOP = SR / 100; // exactly 10 ms frames
const decode = (src, out) => {
  if (!fs.existsSync(out) || a.fx) { // our own mix: always decode fresh
    const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', out]);
    if (r.status !== 0) throw new Error('ffmpeg: ' + r.stderr);
  }
  return readWav(out).x;
};
const fx = decode(a.fx ? path.resolve(a.fx) : path.join(c, 'stems', 'fx.flac'), path.join(c, 'stems', 'fx-24k.wav'));
const vo = decode(a.voice ? path.resolve(a.voice) : path.join(c, 'stems', 'voice.flac'), path.join(c, 'stems', 'voice-24k.wav'));
// ---------------------------------------------------------------- features (radix-2 FFT, 1024)
const NF = 1024, win = Float32Array.from({length: NF}, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / NF));
const fft = (re, im) => {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let b = n >> 1;
    for (; j & b; b >>= 1) j ^= b;
    j ^= b;
    if (i < j) [re[i], re[j]] = [re[j], re[i]], ([im[i], im[j]] = [im[j], im[i]]);
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len)
      for (let j = 0; j < len / 2; j++) {
        const wr = Math.cos(ang * j), wi = Math.sin(ang * j);
        const ur = re[i + j], ui = im[i + j], vr = re[i + j + len / 2] * wr - im[i + j + len / 2] * wi, vi = re[i + j + len / 2] * wi + im[i + j + len / 2] * wr;
        re[i + j] = ur + vr, (im[i + j] = ui + vi), (re[i + j + len / 2] = ur - vr), (im[i + j + len / 2] = ui - vi);
      }
  }
};
const spec = (a0, a1) => {
  const out = [];
  for (let p = a0; p + NF <= Math.max(a1, a0 + NF); p += NF / 2) {
    const re = new Float32Array(NF), im = new Float32Array(NF);
    for (let i = 0; i < NF; i++) re[i] = (fx[p + i] ?? 0) * win[i];
    fft(re, im);
    out.push(Float32Array.from({length: NF / 2}, (_, i) => re[i] * re[i] + im[i] * im[i]));
  }
  return out;
};
const binHz = SR / NF;

// ---------------------------------------------------------------- per-band levels of both stems (10 ms hop)
// bands: sub <150 · low 150–600 · mid 600–2500 · hi 2500–6000 · air >6000. EAR weights ≈ K-weighting (BS.1770):
// deep sounds count less, the presence/air region a bit more → levels read the way loudness meters read them.
const NB = 5, W = [0.35, 1, 1, 1.5, 1.5];
const bandIdx = Int8Array.from({length: NF / 2}, (_, i) => { const f = i * binHz; return f < 150 ? 0 : f < 600 ? 1 : f < 2500 ? 2 : f < 6000 ? 3 : 4; });
const stft = (x) => {
  const n = Math.floor(x.length / HOP), out = new Float32Array(n * NB), re = new Float32Array(NF), im = new Float32Array(NF);
  for (let k = 0; k < n; k++) {
    const p0 = k * HOP - NF / 2 + Math.floor(HOP / 2);
    for (let i = 0; i < NF; i++) (re[i] = (x[p0 + i] ?? 0) * win[i]), (im[i] = 0);
    fft(re, im);
    for (let i = 1; i < NF / 2; i++) out[k * NB + bandIdx[i]] += (re[i] * re[i] + im[i] * im[i]) / (NF * NF / 8);
  }
  return out;
};
const FB = earBands(fx), VB = earBands(vo), N = Math.min(FB.length, VB.length) / NB;
const dB = (p) => 10 * Math.log10(p + 1e-14);
const VW = new Float32Array(N);
for (let k = 0; k < N; k++) for (let b = 0; b < NB; b++) VW[k] += W[b] * VB[k * NB + b];
const V = VW.map(dB);
const sorted = (arr) => Float32Array.from(arr).sort();
// the voice's speech level = power mean of its loud frames (top 60 %)
const vs = sorted(V), vTop = vs.subarray(Math.floor(vs.length * 0.4));
const VOICE = 10 * Math.log10(vTop.reduce((q, d) => q + Math.pow(10, d / 10), 0) / vTop.length);
const speaking = (k) => V[k] > VOICE - 18;
// the LEAK (a faint copy of the voice the splitter leaves in the fx stem), measured per band while the narrator speaks;
// a band only counts as sound effect where it stands ≥ 6 dB above that leak
const LEAK = Array.from({length: NB}, (_, b) => {
  const r = [];
  for (let k = 0; k < N; k++) if (speaking(k) && VB[k * NB + b] > 1e-10) r.push(FB[k * NB + b] / VB[k * NB + b]);
  r.sort((p, q) => p - q);
  return r[Math.floor(r.length * 0.75)] ?? 0; // 75th percentile: generous, so leak never counts as an effect
});
const E = new Float32Array(N);
for (let k = 0; k < N; k++) for (let b = 0; b < NB; b++) E[k] += W[b] * Math.max(0, FB[k * NB + b] - 4 * LEAK[b] * VB[k * NB + b]);
const F = E.map(dB);
const fxs = sorted(F), FLOOR = Math.max(fxs[Math.floor(fxs.length * 0.2)], -90);
// audible = within 30 dB of the voice (quieter residue is masked / inaudible on any speaker)
const ON = Math.max(FLOOR + 14, VOICE - (+(a.range ?? 30))), OFF = ON - 6;
const BLEED = 10 * Math.log10(LEAK.reduce((q, v, b) => q + W[b] * v, 0) / W.reduce((q, v) => q + v, 0) + 1e-14);
const isFx = (k, thr) => F[k] > thr;

// ---------------------------------------------------------------- events (hysteresis, merge short gaps)
let ev = [];
for (let k = 0; k < N; k++) {
  if (!isFx(k, ON)) continue;
  let s0 = k;
  while (s0 > 0 && F[s0 - 1] > OFF) s0--;
  let e = k, quiet = 0;
  while (e < N - 1 && quiet < 8) (e++, (quiet = isFx(e, OFF) ? 0 : quiet + 1));
  e -= quiet;
  ev.push({s: s0, e: e + 1});
  k = e + 1;
}
const merged = [];
for (const x of ev) {
  const p = merged[merged.length - 1];
  if (p && x.s - p.e <= 6) p.e = Math.max(p.e, x.e);
  else merged.push({...x});
}
ev = merged.filter((x) => x.e - x.s >= 3);
// the ear's view: power × f (pink-flat), so deep sounds don't swamp the picture; bands + noisiness + tonal lines + sweep
const describe = (S) => {
  const avg = new Float64Array(NF / 2);
  for (const s0 of S) for (let i = 0; i < avg.length; i++) avg[i] += (s0[i] * i) / S.length;
  const band = [0, 0, 0, 0, 0]; // sub <150 · low 150–600 · mid 600–2500 · hi 2500–6000 · air >6000
  let tot = 0, cen = 0, lg = 0, mx = 0;
  for (let i = 2; i < avg.length; i++) {
    const f = i * binHz, p = avg[i] + 1e-14;
    tot += p, (cen += f * p), (lg += Math.log(p)), (mx = Math.max(mx, p));
    band[f < 150 ? 0 : f < 600 ? 1 : f < 2500 ? 2 : f < 6000 ? 3 : 4] += p;
  }
  const n = avg.length - 2, flat = Math.exp(lg / n) / (tot / n), tonal = 10 * Math.log10(mx / (tot / n));
  const cOf = (s0) => {
    let t = 0, c0 = 0;
    for (let i = 2; i < s0.length; i++) (t += s0[i] * i), (c0 += i * binHz * s0[i] * i);
    return c0 / (t + 1e-14);
  };
  const h = Math.max(1, Math.floor(S.length / 2));
  const c1 = S.slice(0, h).reduce((q, s0) => q + cOf(s0), 0) / h, c2 = S.slice(h).reduce((q, s0) => q + cOf(s0), 0) / Math.max(1, S.length - h);
  const b = band.map((v) => v / tot);
  return {centroid: cen / tot, sub: b[0], low: b[1], mid: b[2], hi: b[3], air: b[4], flat, tonal, sweep: S.length > 3 ? (c2 - c1) / (cen / tot) : 0};
};
const shots = fs.existsSync(path.join(rdir, 'shots.json')) ? JSON.parse(fs.readFileSync(path.join(rdir, 'shots.json'), 'utf8')) : [];
const cuts = (shots.shots ?? shots).map((s) => s.s).filter((t) => t > 0);
const words = fs.existsSync(path.join(rdir, 'timing', 'words.json')) ? JSON.parse(fs.readFileSync(path.join(rdir, 'timing', 'words.json'), 'utf8')) : [];

const out = ev.map(({s, e}) => {
  let pk = s;
  for (let k = s; k < e; k++) if (F[k] > F[pk]) pk = k;
  const dur = (e - s) / 100, attack = (pk - s) / 100;
  const peak = F[pk];
  const d = describe(spec(s * HOP, Math.min(e, s + 300) * HOP));
  let speakFrames = 0;
  for (let k = s; k < e; k++) if (speaking(k)) speakFrames++;
  const overVoice = speakFrames / (e - s) > 0.5;
  // ---- type from the sound itself
  let type;
  const deep = d.sub + d.low, bright = d.hi + d.air, isTonal = d.tonal > 22 && d.flat < 0.25, late = attack > dur * 0.55;
  if (dur > 3) type = isTonal ? 'bed: drone / pad (tonal)' : 'bed: ambience (noise)';
  else if (dur >= 0.7 && (d.sweep > 0.25 || late) && !isTonal) type = 'riser (builds up)';
  else if (d.flat > 0.2 && dur >= 0.25 && attack >= 0.06 && !isTonal) type = d.sweep < -0.2 ? 'whoosh (falling)' : 'whoosh';
  else if (attack <= 0.03 && deep >= 0.3 && bright >= 0.2) type = 'impact (broad hit)';
  else if (deep >= 0.6 && bright < 0.15) type = dur >= 0.2 ? 'boom (deep, long)' : 'thump (deep, short)';
  else if (bright >= 0.55 && dur >= 0.12) type = isTonal ? 'shimmer (tonal sparkle)' : 'shimmer (airy sparkle)';
  else if (isTonal && dur >= 0.2) type = d.centroid > 900 ? 'ding / chime / bell' : 'tone (low musical hit)';
  else if (d.flat > 0.2 && dur < 0.25 && bright >= 0.35) type = 'swish (short air)';
  else if (dur < 0.1) type = bright >= 0.4 ? 'click / tick' : 'pop';
  else if (dur < 0.25) type = isTonal ? 'blip (short tone)' : 'pop';
  else type = 'other';
  const t = s / 100;
  const cut = cuts.reduce((b, x) => (Math.abs(x - t) < Math.abs(b - t) ? x : b), -99);
  const near = words.filter((w) => w.e > t - 0.6 && w.s < t + 0.8).map((w) => w.w).join(' ');
  return {t: +t.toFixed(2), dur: +dur.toFixed(2), type, under_voice_db: +(VOICE - peak).toFixed(1), over_voice: overVoice, attack: +attack.toFixed(2),
    centroid: Math.round(d.centroid), bands: [d.sub, d.low, d.mid, d.hi, d.air].map((v) => +v.toFixed(2)), flat: +d.flat.toFixed(2), tonal: +d.tonal.toFixed(0), sweep: +d.sweep.toFixed(2),
    at_cut: Math.abs(cut - t) <= 0.3 ? +(cut - t).toFixed(2) : null, words: near};
});
fs.writeFileSync(path.join(c, 'sfx.json'), JSON.stringify({voice_db: +VOICE.toFixed(1), floor_db: +FLOOR.toFixed(1), on_db: +ON.toFixed(1), events: out}, null, 1));

// ---------------------------------------------------------------- report
const mm = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const med = (arr) => (arr.length ? [...arr].sort((p, q) => p - q)[Math.floor(arr.length / 2)] : NaN);
const dur = N / 100;
console.log(`${name}: ${out.length} sound effects in ${(dur / 60).toFixed(1)} min = ${(out.length / (dur / 60)).toFixed(1)} per minute · voice ${VOICE.toFixed(1)} dB · fx floor ${FLOOR.toFixed(1)} dB · voice leak in the fx stem ≈ ${BLEED.toFixed(1)} dB relative (removed per band)`);
console.log(`level under the voice: median ${med(out.map((e) => e.under_voice_db)).toFixed(1)} dB · while the voice speaks ${med(out.filter((e) => e.over_voice).map((e) => e.under_voice_db)).toFixed(1)} dB (${out.filter((e) => e.over_voice).length}) · in pauses ${med(out.filter((e) => !e.over_voice).map((e) => e.under_voice_db)).toFixed(1)} dB (${out.filter((e) => !e.over_voice).length}) · on a cut (±0.3 s): ${out.filter((e) => e.at_cut !== null).length}`);
const types = [...new Set(out.map((e) => e.type))].sort((p, q) => out.filter((e) => e.type === q).length - out.filter((e) => e.type === p).length);
console.log('\ntype                     count  under voice (median)  length (median)  on a cut  over voice  e.g.');
for (const ty of types) {
  const g = out.filter((e) => e.type === ty);
  console.log(`${ty.padEnd(24)} ${String(g.length).padStart(5)}  ${med(g.map((e) => e.under_voice_db)).toFixed(1).padStart(10)} dB  ${med(g.map((e) => e.dur)).toFixed(2).padStart(12)} s  ${String(g.filter((e) => e.at_cut !== null).length).padStart(8)}  ${String(g.filter((e) => e.over_voice).length).padStart(10)}  ${g.slice(0, 5).map((e) => mm(e.t)).join(' ')}`);
}
console.log('\nper minute: ' + Array.from({length: Math.ceil(dur / 60)}, (_, m) => out.filter((e) => e.t >= m * 60 && e.t < m * 60 + 60).length).join(' '));
if (a.list || a.type) for (const e of out.filter((x) => (!a.type || x.type.startsWith(a.type)) && x.t >= +(a.from ?? 0) && x.t < +(a.to ?? 1e9))) console.log(`${mm(e.t).padStart(7)} ${e.dur.toFixed(2)}s ${e.type.padEnd(22)} −${e.under_voice_db} dB ${e.over_voice ? 'over voice' : 'pause    '} ${e.at_cut !== null ? 'CUT' : '   '} c${e.centroid} b${e.bands.join('/')} fl${e.flat} to${e.tonal} sw${e.sweep}  ${e.words}`);

// --cues sfx.json (with --voice/--fx): measure EACH known cue at its own time with the same ear-weighted metric →
// per kind: median dB under the voice (calibration of tools/audio/make-audio.mjs against the reference's numbers)
if (a.cues) {
  const cues = JSON.parse(fs.readFileSync(path.resolve(a.cues), 'utf8'));
  const per = {};
  for (const q of cues) {
    const k0 = Math.max(0, Math.round((q.t - (q.kind === "riser" ? 1.5 : 0.35)) * 100)), k1 = Math.min(N, Math.round((q.t + Math.max(0.3, q.dur ?? 0) + 0.6) * 100));
    let pk = -200;
    for (let k = k0; k < k1; k++) pk = Math.max(pk, F[k]);
    if (process.env.DBG) console.log(q.t, q.kind, q.gain, k0, k1, pk.toFixed(1));
    (per[q.kind] ??= []).push(VOICE - pk + 20 * Math.log10(q.gain ?? 1)); // normalised to gain 1 (a gain-2 cue sits 6 dB louder)
  }
  console.log('\nper kind (gain-1 level, dB under the voice): ' + Object.entries(per).map(([k, v]) => `${k} ${med(v).toFixed(1)} (n${v.length})`).join(' · '));
  fs.writeFileSync(path.join(c, 'cue-levels.json'), JSON.stringify(Object.fromEntries(Object.entries(per).map(([k, v]) => [k, +med(v).toFixed(1)]))));
}
