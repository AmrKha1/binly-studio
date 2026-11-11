// SOUND LAB (owner 2026-11-11): design candidate sound effects, 4 versions per type, for the owner to audition and pick.
// The picks are installed into library/sfx/<kind>-N.wav, which the mixer uses instead of its built-in sound (several
// files per kind = it rotates between them, so a run of pops never repeats the exact same one).
//   node tools/audio/sfx-lab.mjs [--group 1] [--only pop,boom]  → samples/sfx-lab/<type>/v1..v4.wav
//   node tools/audio/sfx-lab.mjs --install pop:2,boom:1+3       → copies the picks into library/sfx (+ CREDITS line)
// Every design here is code-made (no third-party audio) and gets the reference's FINISH (SOUND.md §4): no click at the
// start, a rounded top (gentle low-pass, −3 dB around 3.5 kHz), a short room tail where the type rings out.
import fs from 'node:fs';
import path from 'node:path';

const SR = 48000;
const argv = process.argv.slice(2), opt = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
const OUT = path.resolve('samples', 'sfx-lab');

// ------------------------------------------------------------------ dsp
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const buf = (sec) => new Float32Array(Math.round(sec * SR));
// every generated layer reaches silence smoothly (a layer cut mid-decay = a click inside the sound)
const tailFade = (o) => { const n = Math.min(o.length >> 1, Math.round(0.012 * SR)); for (let i = 0; i < n; i++) o[o.length - 1 - i] *= i / n; return o; };
const TAU = Math.PI * 2;
/** oscillator: f(t) Hz, wave sine|tri|saw(additive, n harmonics)|sq; env(t) amplitude */
const osc = (sec, f, env, wave = 'sine', harm = 8) => {
  const o = buf(sec);
  let ph = 0;
  for (let i = 0; i < o.length; i++) {
    const t = i / SR, fr = typeof f === 'function' ? f(t) : f;
    ph += fr / SR;
    let v;
    if (wave === 'sine') v = Math.sin(TAU * ph);
    else if (wave === 'tri') v = (2 / Math.PI) * Math.asin(Math.sin(TAU * ph));
    else { // band-limited additive saw / square
      v = 0;
      for (let k = 1; k <= harm && k * fr < SR / 2.2; k++) if (wave === 'saw' || k % 2) v += Math.sin(TAU * ph * k) / k;
      v *= 0.6;
    }
    o[i] = v * env(t);
  }
  return tailFade(o);
};
const noise = (sec, env, seed = 7) => {
  const r = rng(seed), o = buf(sec);
  for (let i = 0; i < o.length; i++) o[i] = (r() * 2 - 1) * env(i / SR);
  return tailFade(o);
};
// RBJ biquads; f may be a function of time (coefficients refreshed every 32 samples)
const coef = (type, f, q, gainDb = 0) => {
  const w = (TAU * Math.min(f, SR * 0.45)) / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q), A = Math.pow(10, gainDb / 40);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') [b0, b1, b2, a0, a1, a2] = [(1 - c) / 2, 1 - c, (1 - c) / 2, 1 + a, -2 * c, 1 - a];
  else if (type === 'hp') [b0, b1, b2, a0, a1, a2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2, 1 + a, -2 * c, 1 - a];
  else if (type === 'bp') [b0, b1, b2, a0, a1, a2] = [a, 0, -a, 1 + a, -2 * c, 1 - a];
  else if (type === 'peak') [b0, b1, b2, a0, a1, a2] = [1 + a * A, -2 * c, 1 - a * A, 1 + a / A, -2 * c, 1 - a / A];
  else if (type === 'hshelf') {
    const sq = 2 * Math.sqrt(A) * a;
    [b0, b1, b2, a0, a1, a2] = [A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq), (A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq];
  }
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
};
const filt = (x, type, f, q = 0.707, gainDb = 0) => {
  const o = new Float32Array(x.length);
  let k = coef(type, typeof f === 'function' ? f(0) : f, q, gainDb), x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    if (typeof f === 'function' && i % 32 === 0) k = coef(type, f(i / SR), q, gainDb);
    const y = k[0] * x[i] + k[1] * x1 + k[2] * x2 - k[3] * y1 - k[4] * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = y;
    o[i] = y;
  }
  return o;
};
const mix = (...parts) => { // [array, gain, offsetSec]
  const len = Math.max(...parts.map(([a, , off = 0]) => a.length + Math.round(off * SR)));
  const o = new Float32Array(len);
  for (const [a, g = 1, off = 0] of parts) { const s = Math.round(off * SR); for (let i = 0; i < a.length; i++) o[s + i] += a[i] * g; }
  return o;
};
const sat = (x, drive = 2) => x.map((v) => Math.tanh(v * drive) / Math.tanh(drive));
const rev = (x) => Float32Array.from(x).reverse();
const pad = (x, sec) => mix([x, 1, 0], [buf(x.length / SR + sec), 0]);
// a small stereo room (Freeverb style); returns [L, R]
const room = (x, size = 0.8, damp = 0.4, wet = 0.3, tail = 1) => {
  const n = x.length + Math.round(tail * SR);
  const mk = (spread) => {
    const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => ({b: new Float32Array(Math.round(((d + spread) * SR) / 44100)), i: 0, f: 0}));
    const aps = [556, 441, 341, 225].map((d) => ({b: new Float32Array(Math.round(((d + spread) * SR) / 44100)), i: 0}));
    const o = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const v = i < x.length ? x[i] : 0;
      let s = 0;
      for (const c of combs) { const y = c.b[c.i]; c.f = y * (1 - damp) + c.f * damp; c.b[c.i] = v + c.f * size; c.i = (c.i + 1) % c.b.length; s += y; }
      for (const a of aps) { const bb = a.b[a.i]; a.b[a.i] = s + bb * 0.5; a.i = (a.i + 1) % a.b.length; s = bb - s; }
      o[i] = (i < x.length ? x[i] : 0) + s * 0.05 * wet;
    }
    return o;
  };
  return [mk(0), mk(23)];
};
const exp = (d) => (t) => Math.exp(-t * d);
const att = (a, d) => (t) => Math.min(1, t / a) * Math.exp(-Math.max(0, t - a) * d);
const swell = (dur, peakAt = 0.75) => (t) => { const k = t / dur; return k < 0 || k > 1 ? 0 : k < peakAt ? Math.sin((Math.PI / 2) * (k / peakAt)) ** 2 : Math.cos((Math.PI / 2) * ((k - peakAt) / (1 - peakAt))) ** 2; };
const glide = (f0, f1, rate) => (t) => f1 + (f0 - f1) * Math.exp(-t * rate);
const line = (f0, f1, dur) => (t) => f0 + (f1 - f0) * Math.min(1, t / dur);
const bellP = (sec, f, d, partials = [[1, 1, 1], [2.76, 0.5, 3], [5.4, 0.25, 6]]) => mix(...partials.map(([r, g, dd]) => [osc(sec, f * r, att(0.002, d * dd)), g]));

// the reference FINISH: no click, rounded top, −3 dB at 3.5 kHz bite, optional room; then peak-normalised
const finish = (x, {top = 13000, bite = -3, wet = 0, size = 0.78, tail = 0.8, fadeIn = 0.0015, hp = 25} = {}) => {
  // the dry sound must reach silence smoothly BEFORE the room tail (a cut-off dry end = a click halfway through)
  x = Float32Array.from(x);
  const fd = Math.min(Math.round(x.length / 3), Math.round(0.08 * SR));
  for (let i = 0; i < fd; i++) x[x.length - 1 - i] *= (i / fd) ** 2;
  let y = filt(x, 'hp', hp, 0.7);
  y = filt(y, 'lp', top, 0.6);
  y = filt(y, 'peak', 3500, 1.1, bite);
  y = filt(y, 'hshelf', 9000, 0.7, -2);
  const fi = Math.round(fadeIn * SR);
  for (let i = 0; i < fi && i < y.length; i++) y[i] *= i / fi;
  let [L, R] = wet > 0 ? room(y, size, 0.45, wet, tail) : [y, Float32Array.from(y)];
  // trim the silent end + 20 ms fade
  let end = L.length - 1;
  while (end > SR * 0.05 && Math.abs(L[end]) < 1e-4 && Math.abs(R[end]) < 1e-4) end--;
  end = Math.min(L.length, end + Math.round(0.02 * SR));
  L = L.subarray(0, end); R = R.subarray(0, end);
  const fo = Math.round(0.02 * SR);
  for (let i = 0; i < fo; i++) { const g = i / fo; L[L.length - 1 - i] *= g; R[R.length - 1 - i] *= g; }
  let pk = 0;
  for (let i = 0; i < L.length; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
  const g = pk > 0 ? 0.7 / pk : 1;
  return [L.map((v) => v * g), R.map((v) => v * g)];
};

// ------------------------------------------------------------------ the designs (4 per type)
// each: {name, about, make: () => [L, R]}. Group 1 = the reference's own types (references/universe-claude/SOUND.md §2).
const D = {};
D.pop = [
  {name: 'bubble', about: 'round bubble pop, warm', make: () => finish(mix([osc(0.12, glide(1150, 420, 38), att(0.001, 34)), 1], [filt(noise(0.02, exp(260), 3), 'lp', 3000), 0.25]), {wet: 0.25, tail: 0.25})},
  {name: 'pluck', about: 'soft wooden pluck, toy-like', make: () => finish(mix([osc(0.16, glide(760, 560, 30), att(0.001, 26)), 1], [osc(0.16, glide(1520, 1120, 30), att(0.001, 40)), 0.35], [osc(0.08, glide(180, 120, 40), att(0.001, 45)), 0.5]), {wet: 0.2, tail: 0.25})},
  {name: 'glassy', about: 'bright glassy blip, clean', make: () => finish(mix([osc(0.3, 1480, att(0.001, 22)), 1], [osc(0.3, 2960, att(0.001, 40)), 0.3], [osc(0.05, glide(900, 1480, 80), att(0.001, 60)), 0.4]), {wet: 0.35, tail: 0.4})},
  {name: 'plop', about: 'cartoon mouth-pop, playful', make: () => finish(mix([filt(noise(0.06, att(0.001, 70), 11), 'bp', 950, 3), 1.6], [osc(0.1, line(320, 620, 0.05), att(0.002, 40)), 0.8]), {wet: 0.15, tail: 0.2})},
];
D.popup = [
  {name: 'rise-bell', about: 'smooth rising tone that blooms into a soft bell', make: () => finish(mix([osc(0.14, line(420, 1180, 0.11), att(0.012, 18)), 0.9], [bellP(0.6, 1180, 9), 0.35, 0.09]), {wet: 0.35, tail: 0.5})},
  {name: 'two-note', about: 'two quick rising notes (marimba), friendly', make: () => finish(mix([osc(0.3, 659, att(0.002, 22)), 1], [osc(0.3, 1318, att(0.002, 40)), 0.25], [osc(0.4, 988, att(0.002, 18)), 1, 0.07], [osc(0.4, 1976, att(0.002, 36)), 0.25, 0.07]), {wet: 0.3, tail: 0.4})},
  {name: 'airy-fwip', about: 'airy upward "fwip" with a tone underneath', make: () => finish(mix([filt(noise(0.2, swell(0.2, 0.7), 5), 'bp', line(800, 3600, 0.2), 2.2), 1.4], [osc(0.2, line(500, 1300, 0.18), swell(0.2, 0.75)), 0.5]), {wet: 0.25, tail: 0.3})},
  {name: 'chorus-up', about: 'wide, soft, two detuned voices gliding up', make: () => finish(mix([osc(0.22, line(380, 1050, 0.16), att(0.02, 14)), 0.7], [osc(0.22, line(386, 1068, 0.16), att(0.02, 14)), 0.7], [osc(0.22, line(760, 2100, 0.16), att(0.02, 24)), 0.15]), {wet: 0.45, tail: 0.5})},
];
D.boom = [
  {name: 'deep-round', about: 'deep round boom, long smooth tail', make: () => finish(mix([osc(1.6, glide(78, 38, 3), att(0.004, 2.2)), 1], [filt(noise(0.25, exp(18), 21), 'lp', 600), 0.5]), {wet: 0.5, size: 0.86, tail: 1.6, top: 9000})},
  {name: 'cinema', about: 'cinematic hit: sub + low drum body, big tail', make: () => finish(sat(mix([osc(2.2, glide(60, 34, 1.6), att(0.003, 1.6)), 1], [osc(0.5, glide(140, 62, 14), att(0.002, 9)), 0.8], [filt(noise(0.4, exp(10), 23), 'lp', 900), 0.6]), 1.6), {wet: 0.55, size: 0.88, tail: 2, top: 8000})},
  {name: 'trailer-metal', about: 'trailer boom with a metallic ring on top', make: () => finish(mix([osc(1.8, glide(70, 36, 2.4), att(0.004, 2)), 1], [bellP(1.5, 182, 1.6, [[1, 1, 1], [2.27, 0.6, 1.4], [3.8, 0.35, 2.2]]), 0.35], [filt(noise(0.3, exp(14), 25), 'lp', 1400), 0.35]), {wet: 0.55, size: 0.88, tail: 2, top: 10000})},
  {name: 'phone-body', about: 'boom with a mid "body" so it is heard on phones', make: () => finish(mix([osc(1.4, glide(82, 40, 3), att(0.004, 2.6)), 1], [osc(0.5, glide(260, 160, 10), att(0.003, 7)), 0.45], [osc(0.5, glide(520, 320, 10), att(0.003, 11)), 0.15], [filt(noise(0.25, exp(20), 27), 'lp', 1200), 0.4]), {wet: 0.45, size: 0.85, tail: 1.4, top: 9000})},
];
D.thump = [
  {name: 'soft-kick', about: 'soft kick, something lands', make: () => finish(mix([osc(0.22, glide(130, 58, 26), att(0.002, 16)), 1], [filt(noise(0.015, exp(300), 31), 'lp', 2000), 0.25]), {wet: 0.15, tail: 0.2, top: 7000})},
  {name: 'wood-block', about: 'wooden knock on a table', make: () => finish(mix([filt(noise(0.06, exp(60), 33), 'bp', 420, 5), 3], [osc(0.1, glide(240, 200, 30), att(0.001, 35)), 0.6]), {wet: 0.2, tail: 0.25})},
  {name: 'felt', about: 'felt/cushioned low thud, very smooth', make: () => finish(sat(mix([osc(0.3, glide(95, 52, 18), att(0.006, 12)), 1]), 1.4), {wet: 0.1, tail: 0.2, top: 5000})},
  {name: 'box-drop', about: 'cardboard box set down (low + papery)', make: () => finish(mix([osc(0.18, glide(150, 85, 30), att(0.002, 20)), 1], [filt(noise(0.08, exp(45), 35), 'bp', 900, 1.2), 0.9]), {wet: 0.2, tail: 0.25})},
];
D.shimmer = [
  {name: 'arp-bells', about: 'quick rising high bells (like the one you kept)', make: () => finish(mix(...[0, 0.05, 0.1, 0.16, 0.22].map((d, i) => [bellP(0.9, [2093, 2349, 2637, 3136, 3520][i], 5), 0.6, d])), {wet: 0.6, tail: 0.9, top: 15000, hp: 1200})},
  {name: 'glitter', about: 'airy glitter dust (many tiny bells)', make: () => { const r = rng(41); return finish(mix(...Array.from({length: 22}, (_, i) => [osc(0.25, 3000 + r() * 5000, att(0.001, 22 + r() * 18)), 0.25, r() * 0.45])), {wet: 0.7, tail: 0.9, top: 15000, hp: 1800}); }},
  {name: 'harp-gliss', about: 'fast magical harp sweep up', make: () => finish(mix(...[784, 880, 988, 1175, 1319, 1568, 1760, 1976].map((f, i) => [mix([osc(0.7, f, att(0.002, 7)), 1], [osc(0.7, f * 2, att(0.002, 14)), 0.3]), 0.45, i * 0.035])), {wet: 0.55, tail: 0.9, top: 14000, hp: 500})},
  {name: 'magic-swell', about: 'soft sparkle that swells in (chimes + air)', make: () => finish(mix([filt(noise(0.6, swell(0.6, 0.4), 43), 'hp', 5000), 0.35], ...[0.1, 0.18, 0.27].map((d, i) => [bellP(0.8, [2637, 3322, 3951][i], 4), 0.5, d])), {wet: 0.6, tail: 1, top: 15000, hp: 1500})},
];
D.riser = [
  {name: 'air-build', about: 'filtered air that builds into the hit', make: () => finish(filt(noise(1.2, swell(1.2, 0.96), 51), 'bp', line(300, 4200, 1.2), 1.3), {top: 11000})},
  {name: 'tone-build', about: 'rising tone with growing tremolo, tense', make: () => finish(mix([osc(1.2, line(180, 720, 1.2), (t) => swell(1.2, 0.97)(t) * (0.75 + 0.25 * Math.sin(TAU * line(4, 16, 1.2)(t) * t)), 'saw', 10), 0.8], [filt(noise(1.2, swell(1.2, 0.97), 53), 'hp', 3000), 0.15]), {top: 9000})},
  {name: 'reverse-cymbal', about: 'reverse cymbal swell, classic before a reveal', make: () => { const c = mix([filt(noise(1.3, (t) => Math.exp(-t * 2.6), 55), 'hp', 2800), 1], [bellP(1.3, 4100, 2.2, [[1, 0.3, 1], [1.41, 0.2, 1.2]]), 1]); return finish(rev(c), {top: 12000}); }},
  {name: 'suck-in', about: 'reverse boom: the sound "sucks in" to the reveal', make: () => { const [L] = room(mix([osc(1, glide(120, 50, 4), att(0.002, 4)), 1], [filt(noise(0.3, exp(10), 57), 'lp', 1500), 0.6]), 0.88, 0.4, 1.6, 1); return finish(rev(L.subarray(0, Math.round(1.2 * SR))), {top: 9000, fadeIn: 0.15}); }},
];
D.whoosh = [
  {name: 'air', about: 'clean air whoosh (transition)', make: () => finish(filt(noise(0.55, swell(0.55, 0.5), 61), 'bp', line(450, 1700, 0.55), 1.1), {wet: 0.15, tail: 0.25})},
  {name: 'deep-pass', about: 'deep whoosh passing by (fly-in of big things)', make: () => finish(mix([filt(noise(0.7, swell(0.7, 0.55), 63), 'bp', line(180, 700, 0.7), 1.2), 1.2], [osc(0.7, line(70, 110, 0.7), swell(0.7, 0.55)), 0.3]), {wet: 0.15, tail: 0.3, top: 8000})},
  {name: 'whip', about: 'fast bright whip (quick slide-ins)', make: () => finish(filt(noise(0.28, swell(0.28, 0.65), 65), 'bp', line(900, 3200, 0.28), 1.6), {wet: 0.1, tail: 0.2})},
  {name: 'tonal', about: 'whoosh with a soft tone gliding inside', make: () => finish(mix([filt(noise(0.6, swell(0.6, 0.5), 67), 'bp', line(500, 1600, 0.6), 1.1), 1], [osc(0.6, line(300, 520, 0.6), swell(0.6, 0.5)), 0.25]), {wet: 0.25, tail: 0.35})},
];
D.swish = [
  {name: 'flick', about: 'quick paper flick', make: () => finish(filt(noise(0.12, swell(0.12, 0.35), 71), 'hp', 2200), {wet: 0.1, tail: 0.15})},
  {name: 'paper-flutter', about: 'paper with a little flutter', make: () => finish(filt(noise(0.2, (t) => swell(0.2, 0.3)(t) * (0.6 + 0.4 * Math.sin(TAU * 55 * t)), 73), 'bp', 2600, 0.8), {wet: 0.1, tail: 0.15})},
  {name: 'card-snap', about: 'card slapped down: swish + tiny snap', make: () => finish(mix([filt(noise(0.09, swell(0.09, 0.6), 75), 'hp', 1800), 1], [filt(noise(0.012, exp(400), 77), 'bp', 2500, 2), 1.4, 0.07]), {wet: 0.15, tail: 0.15})},
  {name: 'soft-cloth', about: 'soft cloth/sleeve swish, gentle', make: () => finish(filt(noise(0.18, swell(0.18, 0.5), 79), 'bp', line(1500, 2400, 0.18), 1.0), {wet: 0.1, tail: 0.15, top: 9000})},
];
D.tick = [
  {name: 'wood', about: 'soft wooden tick', make: () => finish(mix([filt(noise(0.03, exp(220), 81), 'bp', 2400, 4), 2], [osc(0.03, 1900, att(0.0005, 160)), 0.4]), {wet: 0.1, tail: 0.1})},
  {name: 'clock', about: 'clock tick (two tiny partials)', make: () => finish(mix([osc(0.04, 3100, att(0.0004, 170)), 1], [osc(0.04, 5200, att(0.0004, 240)), 0.5]), {wet: 0.15, tail: 0.15})},
  {name: 'ui-click', about: 'clean modern UI click', make: () => finish(mix([osc(0.025, glide(2200, 1500, 200), att(0.0004, 200)), 1], [filt(noise(0.01, exp(500), 83), 'hp', 3000), 0.4]), {wet: 0.08, tail: 0.1})},
  {name: 'pencil-tap', about: 'pencil tap, dry and small', make: () => finish(filt(noise(0.025, exp(260), 85), 'bp', 1500, 3), {wet: 0.05, tail: 0.1})},
];
D.ding = [
  {name: 'bell', about: 'clear bell ding (like the one you kept)', make: () => finish(bellP(1.4, 1760, 3.2), {wet: 0.35, tail: 0.8, top: 9000})},
  {name: 'glass-ting', about: 'glass "ting", pure and light', make: () => finish(mix([osc(1.2, 2349, att(0.001, 4)), 1], [osc(1.2, 2349 * 2.32, att(0.001, 9)), 0.25]), {wet: 0.4, tail: 0.8, top: 10000})},
  {name: 'marimba', about: 'warm marimba "ding", friendly', make: () => finish(mix([osc(0.8, 1046, att(0.001, 8)), 1], [osc(0.8, 4186, att(0.001, 30)), 0.15], [osc(0.8, 2093, att(0.001, 18)), 0.2]), {wet: 0.3, tail: 0.6})},
  {name: 'vibes', about: 'soft vibraphone with a slow shimmer', make: () => finish(mix([osc(1.6, 1318, (t) => att(0.002, 2.4)(t) * (0.8 + 0.2 * Math.sin(TAU * 5.5 * t))), 1], [osc(1.6, 3955, att(0.002, 8)), 0.12]), {wet: 0.4, tail: 0.9, top: 9000})},
];
D.impact = [
  {name: 'punch', about: 'short punchy hit', make: () => finish(sat(mix([osc(0.25, glide(160, 70, 30), att(0.001, 18)), 1], [filt(noise(0.05, exp(70), 91), 'lp', 2500), 0.8]), 1.8), {wet: 0.2, tail: 0.3, top: 9000})},
  {name: 'metal-clang', about: 'metallic hit, hard accent', make: () => finish(mix([bellP(0.8, 330, 6, [[1, 1, 1], [2.41, 0.7, 1.3], [3.93, 0.5, 1.7], [5.67, 0.3, 2.2]]), 0.8], [filt(noise(0.04, exp(90), 93), 'bp', 2000, 1.5), 1]), {wet: 0.3, tail: 0.5, top: 10000})},
  {name: 'slam', about: 'door-slam style, heavy', make: () => finish(sat(mix([osc(0.4, glide(110, 48, 16), att(0.001, 10)), 1], [filt(noise(0.12, exp(30), 95), 'lp', 1600), 0.9]), 2), {wet: 0.4, size: 0.84, tail: 0.6, top: 8000})},
  {name: 'crack', about: 'snare-like crack with low body', make: () => finish(mix([filt(noise(0.15, exp(28), 97), 'bp', 1800, 0.9), 1.2], [osc(0.15, glide(230, 170, 30), att(0.001, 25)), 0.6], [osc(0.2, glide(110, 60, 20), att(0.001, 16)), 0.6]), {wet: 0.3, tail: 0.4})},
];
D.tail = [
  {name: 'sub-drop', about: 'deep sub drop that falls away', make: () => finish(osc(2.2, glide(95, 28, 1.3), att(0.01, 1.4)), {wet: 0.3, size: 0.88, tail: 1.2, top: 3000})},
  {name: 'long-boom', about: 'boom with a long fading room tail', make: () => finish(mix([osc(3, glide(70, 34, 2), att(0.004, 1)), 1], [filt(noise(0.5, exp(6), 101), 'lp', 700), 0.5]), {wet: 0.9, size: 0.92, tail: 3, top: 6000})},
  {name: 'braam', about: 'low brassy "braam" (cinema trailer)', make: () => finish(filt(sat(osc(3, (t) => 55 + Math.sin(TAU * 0.5 * t) * 0.6, att(0.06, 0.9), 'saw', 14), 1.5), 'lp', line(1800, 400, 3), 0.8), {wet: 0.5, size: 0.9, tail: 2, top: 6000})},
  {name: 'swell-wash', about: 'low swell + soft noise wash, mysterious', make: () => finish(mix([osc(3, 48, (t) => Math.min(1, t / 0.08) * Math.exp(-t * 0.9)), 1], [filt(noise(3, (t) => Math.min(1, t / 0.3) * Math.exp(-t * 1.2), 103), 'lp', 1200), 0.35]), {wet: 0.6, size: 0.9, tail: 2, top: 5000})},
];
export const GROUP1 = ['pop', 'popup', 'boom', 'thump', 'shimmer', 'riser', 'whoosh', 'swish', 'tick', 'ding', 'impact', 'tail'];
// the mixer's kind for each lab type (where the pick is installed)
export const KIND = {shimmer: 'sparkle'};

// ------------------------------------------------------------------ io
const wav = (file, L, R) => {
  const n = L.length, b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4); b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4); }
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, b);
};

// ------------------------------------------------------------------ the listening page (--page --vo <voiceover> [--at s])
// every version (and "now" = today's sound, if captured as <type>/now.wav) is level-matched by the SAME ear ruler the
// mixer uses, so the owner compares sounds, not volumes · "in context" = 5 s of the voiceover with the sound landing at
// the Studio's standard level for its kind (REF_TARGET − OWNER_LIFT under the voice).
const page = async () => {
  const {spawnSync} = await import('node:child_process');
  const {toEarRate, earBands, earPower, peakLevel, voiceLevel} = await import('../lib/ear-level.mjs');
  const {targetUnder} = await import('../lib/sound-ref.mjs');
  const FF = process.env.FFMPEG ?? 'ffmpeg';
  const dec = (f) => {
    const r = spawnSync(FF, ['-v', 'error', '-i', f, '-ac', '2', '-ar', String(SR), '-f', 'f32le', '-'], {maxBuffer: 1 << 28});
    const a = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4), L = new Float32Array(a.length / 2), R = new Float32Array(a.length / 2);
    for (let i = 0; i < L.length; i++) { L[i] = a[2 * i]; R[i] = a[2 * i + 1]; }
    return [L, R];
  };
  const ear = ([L, R]) => peakLevel(earPower(earBands(toEarRate(L.map((v, i) => (v + R[i]) / 2), SR))));
  const mp3 = (file, L, R) => { const tmp = file.replace(/\.mp3$/, '.tmp.wav'); wav(tmp, L, R); spawnSync(FF, ['-v', 'error', '-y', '-i', tmp, '-c:a', 'libmp3lame', '-q:a', '2', file]); fs.rmSync(tmp); };
  const index = JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8'));
  const at = +(opt.at ?? 2), [vL, vR] = dec(opt.vo);
  const seg = [vL.subarray(Math.round(at * SR), Math.round((at + 5) * SR)), vR.subarray(Math.round(at * SR), Math.round((at + 5) * SR))];
  const vEar = voiceLevel(earPower(earBands(toEarRate(seg[0].map((v, i) => (v + seg[1][i]) / 2), SR))));
  const HIT = 2.0; // the sound lands 2 s into the 5 s clip
  const WHEN = {pop: 'pills, tags, small labels', popup: 'headline words (like «الخزنة فاضية»)', boom: 'big reveals, the board jumping, ✖ marks', thump: 'something lands (a podium block, a card set down)', shimmer: 'precious things (diamond, gold, money)', riser: 'the build-up just before a reveal', whoosh: 'transitions, things sliding or flying in', swish: 'a paper or card flick', tick: 'small mechanics (path dots, counting, rows)', ding: 'a value confirmed («غالي!»)', impact: 'a hard accent inside a story', tail: 'the long deep tail under the biggest reveals (new)'};
  let html = '';
  for (const [type, list] of Object.entries(index)) {
    const kind = KIND[type] ?? type, under = type === 'tail' ? 14 : targetUnder(kind);
    const vers = [...(fs.existsSync(path.join(OUT, type, 'now.wav')) ? [{v: 'now', name: 'what we use now', about: 'today\'s sound, for comparison'}] : []), ...list];
    let rows = '';
    for (const it of vers) {
      const src = dec(path.join(OUT, type, `${it.v === 'now' ? 'now' : 'v' + it.v}.wav`));
      const e = ear(src);
      const gA = Math.pow(10, (-14 - e) / 20); // alone: every version at the same ear peak
      mp3(path.join(OUT, type, `alone-${it.v}.mp3`), src[0].map((v) => v * gA), src[1].map((v) => v * gA));
      const gC = Math.pow(10, (vEar - under - e) / 20); // in context: the Studio's standard level for this kind
      const n = seg[0].length, cL = Float32Array.from(seg[0]), cR = Float32Array.from(seg[1]);
      const len = src[0].length, off = Math.round((type === 'riser' ? HIT - len / SR : HIT - 0.05) * SR);
      for (let i = 0; i < len; i++) { const j = off + i; if (j >= 0 && j < n) { cL[j] += src[0][i] * gC; cR[j] += src[1][i] * gC; } }
      mp3(path.join(OUT, type, `context-${it.v}.mp3`), cL, cR);
      const label = it.v === 'now' ? 'NOW' : it.v;
      rows += `<div class="v${it.v === 'now' ? ' now' : ''}"><div class="n">${label}</div><div class="m"><b>${it.name}</b><span>${it.about}</span></div>
<button onclick="play('${type}/alone-${it.v}.mp3',this)">▶ alone</button><button onclick="play('${type}/context-${it.v}.mp3',this)">▶ with voice</button></div>`;
    }
    html += `<section><h2>${type}<small>${WHEN[type] ?? ''}</small></h2>${rows}</section>`;
    console.log(`page: ${type} (${vers.length} versions)`);
  }
  fs.writeFileSync(path.join(OUT, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sound lab</title>
<style>:root{--bg:#0F0A24;--card:#1B1440;--ink:#F3F0FF;--dim:#A99FD0;--gold:#FFC928}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.4 system-ui,Segoe UI,sans-serif;padding:24px 16px}
main{max-width:860px;margin:auto}h1{margin:0 0 4px}p.lead{color:var(--dim);margin:0 0 20px}section{background:var(--card);border-radius:14px;padding:14px 16px;margin:0 0 14px}
h2{margin:0 0 10px;font-size:20px;text-transform:uppercase;letter-spacing:.04em;color:var(--gold)}h2 small{display:block;text-transform:none;letter-spacing:0;color:var(--dim);font-size:13px;font-weight:400}
.v{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid #2C2360}.v.now{opacity:.75}.n{width:44px;font-weight:800;font-size:18px;text-align:center}.m{flex:1;min-width:0}.m b{display:block}.m span{color:var(--dim);font-size:13px}
button{background:#2E2470;color:var(--ink);border:0;border-radius:8px;padding:8px 10px;cursor:pointer;font:inherit;white-space:nowrap}button.on{background:var(--gold);color:#1A1238}
@media(max-width:560px){.v{flex-wrap:wrap}.m{flex-basis:calc(100% - 54px)}}</style></head><body><main>
<h1>Sound lab · group 1</h1><p class="lead">The 12 sound types of the reference. <b>alone</b> = the sound by itself (all at the same loudness) · <b>with voice</b> = 5 s of the voiceover with the sound at the Studio's standard level (−19). Tell Claude your pick per type, e.g. "pop 2, boom 1+4" (two picks = the mixer alternates them).</p>
${html}</main><audio id="a"></audio><script>const a=document.getElementById('a');let cur=null;function play(s,b){if(cur)cur.classList.remove('on');a.src=s;a.play();cur=b;b.classList.add('on');a.onended=()=>b.classList.remove('on')}</script></body></html>`);
  console.log('page: samples/sfx-lab/index.html');
};

if (opt.page) await page();
else if (opt.install) {
  const lib = path.resolve('library', 'sfx');
  for (const pick of String(opt.install).split(',')) {
    const [type, vs] = pick.split(':');
    const kind = KIND[type] ?? type;
    for (const old of fs.readdirSync(lib).filter((f) => new RegExp(`^${kind}(-\\d+)?\\.(wav|flac|ogg|mp3)$`).test(f))) fs.rmSync(path.join(lib, old));
    vs.split('+').forEach((v, i) => fs.copyFileSync(path.join(OUT, type, `v${v}.wav`), path.join(lib, `${kind}-${i + 1}.wav`)));
    fs.appendFileSync(path.join(lib, 'CREDITS.md'), `\n- ${kind}-*.wav — code-made (tools/audio/sfx-lab.mjs, "${type}" v${vs}), owner's pick ${new Date().toISOString().slice(0, 10)}. No third-party audio.`);
    console.log(`installed ${type} v${vs} → library/sfx/${kind}-*.wav`);
  }
} else {
  const types = opt.only ? String(opt.only).split(',') : GROUP1;
  const index = {};
  for (const type of types) {
    index[type] = [];
    D[type].forEach((d, i) => {
      const [L, R] = d.make();
      wav(path.join(OUT, type, `v${i + 1}.wav`), L, R);
      index[type].push({v: i + 1, name: d.name, about: d.about, sec: +(L.length / SR).toFixed(2)});
    });
    console.log(`${type}: ${index[type].map((x) => `v${x.v} ${x.name} (${x.sec}s)`).join(' · ')}`);
  }
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
}
