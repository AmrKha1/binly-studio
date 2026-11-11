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
const GROUP = +(opt.group ?? 1);
const OUT = path.resolve('samples', GROUP === 1 ? 'sfx-lab' : `sfx-lab-${GROUP}`);

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
const BODY = +(opt.body ?? 0.55);
const HB_BODY = +(opt.hb ?? 0.4), EX_BODY = +(opt.ex ?? 0.3); // heartbeat / cartoon explosion: phone body weights // boom v4: weight of the mid body layers (phone presence)
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
  {name: 'phone-body', about: 'boom with a mid "body" so it is heard on phones', make: () => finish(mix([osc(1.4, glide(82, 40, 3), att(0.004, 2.6)), 1], [osc(0.6, glide(260, 170, 9), att(0.003, 6)), 0.5], [osc(0.6, glide(440, 300, 9), att(0.003, 6.5)), BODY], [osc(0.6, glide(880, 600, 9), att(0.003, 9)), BODY * 0.35], [filt(noise(0.25, exp(20), 27), 'lp', 1800), 0.45]), {wet: 0.45, size: 0.85, tail: 1.4, top: 9000})}, // owner 2026-11-11: body strengthened so the boom is heard on phones (the reference's booms lose only ≈ 4 dB there)
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
// ---- GROUP 2: story sounds the reference rarely or never used (owner 2026-11-11)
D.cash = [
  {name: 'ka-ching', about: 'classic register: two bright bells + drawer rattle', make: () => finish(mix([bellP(0.9, 2093, 5), 0.6], [bellP(0.9, 2637, 5), 0.6, 0.08], [filt(noise(0.15, exp(30), 111), 'bp', 3200, 1.5), 0.6, 0.06], [osc(0.15, glide(160, 90, 25), att(0.001, 20)), 0.5]), {wet: 0.3, tail: 0.6, top: 11000})},
  {name: 'coin-ching', about: 'bright bells + coins rattling', make: () => { const r = rng(113); return finish(mix(...[0, 0.05, 0.1].map((d, i) => [bellP(0.8, [2349, 2794, 3136][i], 6), 0.45, d]), ...Array.from({length: 9}, () => [osc(0.06, 4000 + r() * 3000, att(0.0005, 70)), 0.2, 0.1 + r() * 0.35])), {wet: 0.35, tail: 0.6, top: 12000}); }},
  {name: 'soft-ching', about: 'soft modern two-tone "ka-ching" (app style)', make: () => finish(mix([filt(noise(0.02, exp(300), 115), 'bp', 2500, 2), 0.6], [osc(0.6, 1568, att(0.002, 7)), 0.7, 0.03], [osc(0.8, 2093, att(0.002, 5)), 0.8, 0.11]), {wet: 0.35, tail: 0.6})},
  {name: 'drawer', about: 'register drawer slides open + one bell', make: () => finish(mix([osc(0.12, glide(150, 90, 30), att(0.001, 25)), 0.6], [filt(noise(0.3, swell(0.3, 0.3), 117), 'bp', 1400, 1.2), 0.7, 0.04], [bellP(1, 2349, 4), 0.7, 0.2]), {wet: 0.3, tail: 0.6})},
];
const coinHit = (f, d = 26) => mix([osc(0.25, f, att(0.0005, d)), 1], [osc(0.25, f * 1.52, att(0.0005, d * 1.3)), 0.6], [osc(0.25, f * 2.21, att(0.0005, d * 1.7)), 0.4]);
D.coins = [
  {name: 'drop', about: 'one coin drops and bounces', make: () => finish(mix(...[0, 0.12, 0.21, 0.27, 0.31, 0.34].map((d, i) => [coinHit(3100 + i * 40, 24 + i * 6), 0.8 * Math.pow(0.7, i), d])), {wet: 0.25, tail: 0.4})},
  {name: 'pile', about: 'a handful of coins landing on a pile', make: () => { const r = rng(121); return finish(mix(...Array.from({length: 18}, (_, i) => [coinHit(2600 + r() * 2400, 30 + r() * 20), 0.35 * (1 - i / 22), r() * 0.55])), {wet: 0.3, tail: 0.4}); }},
  {name: 'spin', about: 'a coin spinning and settling', make: () => { const r = rng(125); const hits = []; let t = 0, gap = 0.16; while (t < 1.1) { hits.push([coinHit(3500 + r() * 200, 40), 0.5 * (1 - t / 1.3), t]); t += gap; gap = Math.max(0.025, gap * 0.82); } return finish(mix(...hits), {wet: 0.25, tail: 0.4}); }},
  {name: 'pour', about: 'coins pouring (money flowing in)', make: () => { const r = rng(123); return finish(mix(...Array.from({length: 40}, (_, i) => [coinHit(2400 + r() * 3000, 35 + r() * 25), 0.22 * Math.sin(Math.PI * (i / 40)), (i / 40) * 1.0 + r() * 0.03])), {wet: 0.35, tail: 0.5}); }},
];
D.tease = [
  {name: 'question', about: 'curious rising "hmm?" with a little wobble', make: () => finish(osc(0.55, (t) => line(520, 880, 0.45)(t) * (1 + 0.02 * Math.sin(TAU * 7 * t)), att(0.02, 4), 'tri'), {wet: 0.3, tail: 0.4})},
  {name: 'pizz', about: 'two plucks, the second higher and hanging (curious)', make: () => finish(mix([osc(0.3, 392, att(0.002, 14), 'tri'), 1], [osc(0.7, 587, att(0.002, 5), 'tri'), 1, 0.18]), {wet: 0.3, tail: 0.5})},
  {name: 'tiptoe', about: 'sneaky staccato low-high-low (something hidden)', make: () => finish(mix(...[[247, 0], [370, 0.14], [262, 0.28]].map(([f, d]) => [osc(0.12, f, att(0.002, 30), 'tri'), 1, d])), {wet: 0.25, tail: 0.3})},
  {name: 'mystery', about: 'three soft bells, a mysterious turn', make: () => finish(mix(...[[1319, 0], [1047, 0.16], [1245, 0.32]].map(([f, d]) => [bellP(1, f, 3.5), 0.6, d])), {wet: 0.5, tail: 0.9})},
];
const holdEnv = (len, a = 0.3, r = 0.4) => (t) => Math.max(0, Math.min(1, t / a, (len - t) / r));
D.suspense = [
  {name: 'heartbeat', about: 'deep heartbeat with a soft tail', make: () => finish(mix([osc(0.3, glide(70, 45, 18), att(0.004, 14)), 1], [osc(0.3, glide(62, 42, 20), att(0.004, 16)), 0.75, 0.24], [osc(0.3, glide(220, 150, 20), att(0.004, 18)), 0.25], [osc(0.3, glide(200, 140, 20), att(0.004, 20)), 0.2, 0.24], [osc(0.25, glide(480, 380, 20), att(0.003, 22)), HB_BODY], [osc(0.25, glide(440, 350, 20), att(0.003, 24)), HB_BODY * 0.75, 0.24], [filt(noise(0.06, exp(60), 161), 'bp', 700, 2), HB_BODY * 0.8], [filt(noise(0.06, exp(60), 163), 'bp', 650, 2), HB_BODY * 0.6, 0.24]), {wet: 0.3, tail: 0.6, top: 4000})}, // owner 2026-11-11: + a mid knock so the pulse is heard on phones
  {name: 'pulse-drone', about: 'low throbbing drone (tension holds)', make: () => finish(mix([osc(2.5, 55, (t) => holdEnv(2.5)(t) * (0.6 + 0.4 * Math.sin(TAU * 2 * t))), 1], [osc(2.5, 110, (t) => holdEnv(2.5)(t) * (0.6 + 0.4 * Math.sin(TAU * 2 * t)), 'saw', 6), 0.3]), {wet: 0.3, tail: 0.8, top: 3000})},
  {name: 'rising-tension', about: 'low tone slowly rising, throbbing faster', make: () => finish(osc(2.5, line(70, 110, 2.5), (t) => holdEnv(2.5, 0.4, 0.2)(t) * (0.6 + 0.4 * Math.sin(TAU * line(1.5, 6, 2.5)(t) * t)), 'saw', 8), {wet: 0.25, tail: 0.6, top: 2500})},
  {name: 'clock-race', about: 'clock ticks speeding up over a low hum', make: () => { const ticks = []; let t = 0, gap = 0.4; while (t < 2.4) { ticks.push([mix([osc(0.04, 2600, att(0.0004, 160)), 1], [osc(0.04, 4300, att(0.0004, 220)), 0.4]), 0.5, t]); t += gap; gap = Math.max(0.1, gap * 0.85); } return finish(mix([osc(2.6, 60, holdEnv(2.6, 0.5, 0.3)), 0.5], ...ticks), {wet: 0.2, tail: 0.4}); }},
];
D.wrong = [
  {name: 'buzzer', about: 'game-show buzzer, softened', make: () => finish(filt(mix([osc(0.22, 196, att(0.005, 3), 'sq', 9), 1], [osc(0.3, 147, att(0.005, 3), 'sq', 9), 1, 0.18]), 'lp', 2200), {wet: 0.2, tail: 0.3})},
  {name: 'sad-trombone', about: '"wah-wah" sad notes (comic mistake)', make: () => finish(mix(...[[294, 0, 0.25], [277, 0.26, 0.25], [262, 0.52, 0.25], [247, 0.78, 0.6]].map(([f, d, l]) => [filt(osc(l, (t) => f * (1 + 0.012 * Math.sin(TAU * 6 * t)), att(0.03, 2.2), 'saw', 10), 'lp', (t) => 500 + 900 * Math.sin(Math.PI * Math.min(1, t / l)), 1.4), 0.8, d])), {wet: 0.25, tail: 0.4})},
  {name: 'down-thud', about: 'low thud with a falling tone ("oops")', make: () => finish(mix([osc(0.3, glide(120, 60, 16), att(0.002, 10)), 1], [osc(0.5, line(440, 220, 0.4), att(0.01, 5), 'tri'), 0.5]), {wet: 0.25, tail: 0.4})},
  {name: 'ui-error', about: 'two soft falling blips (app error)', make: () => finish(mix([osc(0.12, 660, att(0.003, 18), 'tri'), 1], [osc(0.18, 440, att(0.003, 14), 'tri'), 1, 0.12]), {wet: 0.2, tail: 0.3})},
];
D.correct = [
  {name: 'two-up', about: 'two notes up (yes!)', make: () => finish(mix([bellP(0.6, 1047, 6), 0.8], [bellP(0.9, 1568, 4), 0.8, 0.1]), {wet: 0.3, tail: 0.6})},
  {name: 'arpeggio', about: 'three-note happy marimba run up', make: () => finish(mix(...[1047, 1319, 1568].map((f, i) => [mix([osc(0.6, f, att(0.001, 9)), 1], [osc(0.6, f * 4, att(0.001, 30)), 0.12]), 0.8, i * 0.08])), {wet: 0.3, tail: 0.5})},
  {name: 'sparkle-ding', about: 'a ding with a little sparkle on top', make: () => finish(mix([bellP(1.2, 1760, 3.5), 0.8], ...[0.05, 0.1, 0.16].map((d, i) => [osc(0.4, [3520, 4186, 4699][i], att(0.001, 12)), 0.2, d])), {wet: 0.4, tail: 0.7})},
  {name: 'glass-ting-ting', about: 'two light glass tings', make: () => finish(mix([osc(0.8, 2093, att(0.001, 6)), 0.8], [osc(1, 2637, att(0.001, 5)), 0.8, 0.12]), {wet: 0.4, tail: 0.7})},
];
D.stamp = [
  {name: 'rubber', about: 'rubber stamp on paper (thud + paper slap)', make: () => finish(mix([osc(0.25, glide(150, 70, 22), att(0.001, 16)), 1], [filt(noise(0.08, exp(50), 131), 'bp', 1200, 1.2), 1]), {wet: 0.25, tail: 0.35})},
  {name: 'heavy', about: 'heavy official stamp with a short ring', make: () => finish(sat(mix([osc(0.4, glide(110, 50, 14), att(0.001, 9)), 1], [bellP(0.4, 260, 9, [[1, 1, 1], [2.3, 0.5, 1.4]]), 0.3], [filt(noise(0.1, exp(40), 133), 'lp', 2000), 0.7]), 1.6), {wet: 0.35, tail: 0.5, top: 9000})},
  {name: 'ink-press', about: 'press + soft ink squish', make: () => finish(mix([osc(0.2, glide(130, 70, 24), att(0.001, 18)), 1], [filt(noise(0.18, swell(0.18, 0.3), 135), 'bp', 600, 1.5), 0.8, 0.03]), {wet: 0.2, tail: 0.3})},
  {name: 'press-release', about: 'stamp press, then a light "clack" lift', make: () => finish(mix([osc(0.25, glide(140, 70, 22), att(0.001, 15)), 1], [filt(noise(0.06, exp(60), 137), 'bp', 1100, 1.4), 0.9], [filt(noise(0.03, exp(120), 139), 'bp', 2400, 2), 0.5, 0.22]), {wet: 0.25, tail: 0.3})},
];
const beepEnv = (len, a = 0.008, r = 0.02) => (t) => Math.max(0, Math.min(1, t / a, (len - t) / r));
D.alert = [
  {name: 'two-tone', about: 'soft two-tone warning beep, twice', make: () => finish(mix(...[[880, 0], [660, 0.16], [880, 0.4], [660, 0.56]].map(([f, d]) => [osc(0.15, f, beepEnv(0.15), 'tri'), 0.8, d])), {wet: 0.2, tail: 0.3})},
  {name: 'siren', about: 'short warning siren swell', make: () => finish(osc(1, (t) => 700 + 250 * Math.sin(TAU * 1.5 * t - Math.PI / 2), swell(1, 0.5), 'tri'), {wet: 0.25, tail: 0.4})},
  {name: 'triple-beep', about: 'urgent triple beep', make: () => finish(mix(...[0, 0.12, 0.24].map((d) => [osc(0.08, 1320, beepEnv(0.08, 0.005, 0.015), 'tri'), 0.8, d])), {wet: 0.2, tail: 0.3})},
  {name: 'klaxon', about: 'low soft klaxon, two pulses (danger)', make: () => finish(filt(mix(...[0, 0.38].map((d) => [osc(0.3, 220, beepEnv(0.3, 0.02, 0.04), 'sq', 9), 0.8, d])), 'lp', 1800), {wet: 0.25, tail: 0.4})},
];
D.ping = [
  {name: 'message', about: 'phone message ping (two bright notes)', make: () => finish(mix([osc(0.3, 1760, att(0.002, 14)), 0.8], [osc(0.5, 2637, att(0.002, 9)), 0.8, 0.08]), {wet: 0.25, tail: 0.4})},
  {name: 'bubble', about: 'soft bubble notification', make: () => finish(osc(0.25, line(700, 1400, 0.08), att(0.003, 14)), {wet: 0.25, tail: 0.3})},
  {name: 'bell-ping', about: 'single clear high ping with a tail', make: () => finish(bellP(1, 2349, 4.5), {wet: 0.35, tail: 0.6})},
  {name: 'done-chime', about: '"transfer done" three-note chime', make: () => finish(mix(...[1319, 1568, 2093].map((f, i) => [osc(0.6, f, att(0.002, 7)), 0.6, i * 0.09])), {wet: 0.3, tail: 0.5})},
];
D.explosion = [
  {name: 'cartoon', about: 'round cartoon boom (fun, not scary)', make: () => finish(mix([osc(1.2, glide(90, 40, 4), att(0.003, 3)), 1], [filt(noise(0.6, exp(7), 141), 'lp', line(3000, 300, 0.6)), 0.9], [osc(0.7, glide(600, 400, 7), att(0.003, 5)), EX_BODY], [osc(0.7, glide(1050, 700, 7), att(0.003, 7)), EX_BODY * 0.5], [filt(noise(0.4, exp(9), 165), 'bp', 900, 1), EX_BODY * 0.8]), {wet: 0.4, tail: 1, top: 8000})}, // owner 2026-11-11: + a mid body so the blast is heard on phones
  {name: 'debris', about: 'big blast with crackling debris', make: () => { const r = rng(143); return finish(mix([osc(1.5, glide(80, 34, 2.5), att(0.003, 2.4)), 1], [filt(noise(0.8, exp(5), 145), 'lp', 2500), 0.9], ...Array.from({length: 25}, () => [filt(noise(0.02, exp(250), 147 + Math.floor(r() * 99)), 'bp', 1500 + r() * 3000, 2), 0.25, 0.15 + r() * 1.1])), {wet: 0.4, tail: 1.2, top: 9000}); }},
  {name: 'distant', about: 'distant explosion, deep and muffled', make: () => finish(mix([osc(2, glide(60, 30, 2), att(0.01, 1.6)), 1], [filt(noise(1, exp(3.5), 149), 'lp', 600), 0.8]), {wet: 0.7, size: 0.9, tail: 2, top: 1500})},
  {name: 'rocket-blast', about: 'a roar that swells, then the blast (rocket)', make: () => finish(mix([filt(noise(1, swell(1, 0.9), 151), 'lp', line(400, 2500, 1)), 0.7], [osc(1.6, glide(85, 36, 2.6), att(0.003, 2.2)), 1, 0.95], [filt(noise(0.7, exp(6), 153), 'lp', 2000), 0.8, 0.95]), {wet: 0.4, tail: 1.2, top: 9000})},
];
export const GROUP2 = ['cash', 'coins', 'tease', 'suspense', 'wrong', 'correct', 'stamp', 'alert', 'ping', 'explosion'];
// ---- GROUP 3: nice-to-have story sounds (owner 2026-11-11)
const key = (seed, f = 2600, q = 2, g = 1) => mix([filt(noise(0.03, exp(220), seed), 'bp', f, q), g], [osc(0.03, 520, att(0.0005, 200)), 0.07 * g]); // a light thock above the phone cutoff (a 300 Hz one made typing vanish on phones)
const burst = (n, seed, every, make) => { const r = rng(seed); const parts = []; let t = 0; for (let i = 0; i < n; i++) { parts.push([make(i, r), 0.7 + 0.3 * r(), t]); t += every * (0.6 + 0.8 * r()); } return mix(...parts); };
D.typing = [
  {name: 'laptop', about: 'soft laptop keys, a short burst', make: () => finish(burst(12, 171, 0.085, (i, r) => key(200 + i, 2200 + r() * 1400, 2.5)), {wet: 0.15, tail: 0.2})},
  {name: 'mechanical', about: 'clicky mechanical keyboard', make: () => finish(burst(11, 173, 0.095, (i, r) => mix([key(300 + i, 1500 + r() * 400, 3, 1.2), 1], [filt(noise(0.012, exp(500), 400 + i), 'bp', 4200, 3), 0.6])), {wet: 0.15, tail: 0.2})},
  {name: 'type-enter', about: 'fast typing, then a big ENTER', make: () => finish(mix([burst(9, 175, 0.07, (i, r) => key(500 + i, 2400 + r() * 1200, 2.5)), 1], [mix([key(600, 1300, 2, 1.8), 1], [osc(0.08, glide(520, 420, 30), att(0.001, 30)), 0.15]), 1, 0.75]), {wet: 0.2, tail: 0.25})},
  {name: 'phone-taps', about: 'soft phone-screen taps', make: () => finish(burst(8, 177, 0.11, (i, r) => osc(0.04, 1200 + r() * 500, att(0.001, 90))), {wet: 0.15, tail: 0.2})},
];
D.shutter = [
  {name: 'dslr', about: 'camera: two quick mechanical clicks', make: () => finish(mix([filt(noise(0.03, exp(160), 181), 'bp', 2600, 1.5), 1], [osc(0.05, glide(300, 180, 40), att(0.001, 60)), 0.5], [filt(noise(0.04, exp(120), 183), 'bp', 1900, 1.5), 0.8, 0.07]), {wet: 0.2, tail: 0.25})},
  {name: 'phone-cam', about: 'phone camera click, crisp', make: () => finish(mix([filt(noise(0.02, exp(250), 185), 'bp', 3000, 2), 1], [osc(0.03, 1800, att(0.0005, 140)), 0.4], [filt(noise(0.015, exp(300), 187), 'bp', 2600, 2), 0.7, 0.05]), {wet: 0.2, tail: 0.2})},
  {name: 'film-wind', about: 'old film camera: click + film winding', make: () => finish(mix([filt(noise(0.03, exp(160), 189), 'bp', 2400, 1.5), 1], ...Array.from({length: 7}, (_, i) => [filt(noise(0.015, exp(300), 191 + i), 'bp', 1600, 3), 0.45, 0.15 + i * 0.045])), {wet: 0.2, tail: 0.25})},
  {name: 'flash', about: 'click + old flash charging whine', make: () => finish(mix([filt(noise(0.03, exp(160), 199), 'bp', 2600, 1.5), 1], [osc(0.7, line(900, 3200, 0.7), (t) => 0.25 * Math.min(1, t / 0.05) * Math.min(1, (0.7 - t) / 0.1)), 0.5, 0.06]), {wet: 0.2, tail: 0.3})},
];
const tk = (f, d = 150) => mix([osc(0.05, f, att(0.0004, d)), 1], [osc(0.05, f * 1.7, att(0.0004, d * 1.4)), 0.4], [filt(noise(0.01, exp(500), Math.round(f)), 'bp', f * 1.2, 3), 0.5]);
D.clock = [
  {name: 'tick-tock', about: 'one clock tick-tock (time passing)', make: () => finish(mix(...Array.from({length: 2}, (_, i) => [tk(i % 2 ? 1900 : 2500), 0.8, i * 0.42])), {wet: 0.25, tail: 0.3})}, // owner 2026-11-11: one tick-tock (4 was too long for an effect)
  {name: 'grandfather', about: 'big old clock: deep tock in a room', make: () => finish(mix(...Array.from({length: 3}, (_, i) => [mix([tk(i % 2 ? 900 : 1200, 70), 1], [osc(0.2, glide(220, 180, 20), att(0.001, 14)), 0.5]), 0.8, i * 0.75])), {wet: 0.5, size: 0.85, tail: 0.8})},
  {name: 'stopwatch', about: 'fast stopwatch ticks (a race against time)', make: () => finish(mix(...Array.from({length: 8}, (_, i) => [tk(3200, 220), 0.7, i * 0.125])), {wet: 0.15, tail: 0.2})},
  {name: 'times-up', about: 'tick-tock, then a bell: time is up', make: () => finish(mix(...Array.from({length: 3}, (_, i) => [tk(i % 2 ? 1900 : 2500), 0.8, i * 0.45]), [bellP(1.2, 1568, 3.5), 0.7, 1.35]), {wet: 0.3, tail: 0.6})},
];
const crush = (x, steps = 10, hold = 6) => { const o = new Float32Array(x.length); let v = 0; for (let i = 0; i < x.length; i++) { if (i % hold === 0) v = Math.round(x[i] * steps) / steps; o[i] = v; } return o; };
D.glitch = [
  {name: 'stutter', about: 'digital stutter (something breaks)', make: () => { const r = rng(211); const g = osc(0.07, 600, (t) => 1, 'sq', 7); return finish(filt(mix(...Array.from({length: 7}, (_, i) => [crush(g, 6, 4 + i), 0.6, i * 0.075 + r() * 0.02])), 'lp', 5000), {wet: 0.1, tail: 0.15}); }},
  {name: 'static', about: 'short static burst with jumps', make: () => { const r = rng(213); return finish(mix(...Array.from({length: 6}, (_, i) => [filt(noise(0.05 + r() * 0.05, (t) => 1, 215 + i), 'bp', 800 + r() * 3000, 1.5), 0.7, i * 0.06])), {wet: 0.1, tail: 0.15}); }},
  {name: 'data-blips', about: 'random data blips (sci-fi computer error)', make: () => { const r = rng(217); return finish(mix(...Array.from({length: 10}, (_, i) => [osc(0.04, 400 + r() * 2400, att(0.001, 60), 'sq', 5), 0.4, i * 0.045])), {wet: 0.15, tail: 0.2}); }},
  {name: 'power-down', about: 'power-down glitch: tone falls and stutters', make: () => finish(crush(osc(0.7, line(900, 120, 0.7), (t) => (Math.sin(TAU * 18 * t) > -0.3 ? 1 : 0.2) * Math.min(1, (0.7 - t) / 0.1), 'sq', 7), 8, 5), {wet: 0.15, tail: 0.25, top: 6000})},
];
const scratchAt = (seed, dur, from, to) => filt(noise(dur, (t) => Math.sin(Math.PI * Math.min(1, t / dur)) ** 0.7, seed), 'bp', line(from, to, dur), 3);
D.scratch = [
  {name: 'record', about: 'classic record scratch (wait, what?!)', make: () => finish(mix([scratchAt(221, 0.12, 600, 2400), 1], [scratchAt(223, 0.14, 2200, 500), 1, 0.12]), {wet: 0.1, tail: 0.15})},
  {name: 'tape-stop', about: 'tape stop: a tone slows down to nothing', make: () => finish(osc(0.8, (t) => 520 * Math.max(0.05, 1 - (t / 0.8) ** 1.5), (t) => Math.min(1, (0.8 - t) / 0.15), 'saw', 8), {wet: 0.1, tail: 0.15, top: 6000})},
  {name: 'quick', about: 'one quick scratch', make: () => finish(scratchAt(225, 0.16, 500, 2600), {wet: 0.1, tail: 0.15})},
  {name: 'needle-stop', about: 'needle dragged across, then silence', make: () => finish(mix([filt(noise(0.35, (t) => 1 - t / 0.35, 227), 'bp', line(3000, 600, 0.35), 1.2), 1], ...Array.from({length: 5}, (_, i) => [filt(noise(0.01, exp(400), 229 + i), 'bp', 2000, 2), 0.6, i * 0.07])), {wet: 0.1, tail: 0.2})},
];
// a crowd voice: a saw through two vowel formants ("oo" ≈ 300/870 Hz, "ah" ≈ 730/1090 Hz)
const voiceV = (len, f0, vowel, env, seed) => { const [f1, f2] = vowel === 'oo' ? [300, 870] : vowel === 'ah' ? [730, 1090] : [530, 1840]; const s = osc(len, (t) => f0 * (1 + 0.03 * Math.sin(TAU * (4 + seed % 3) * t)), env, 'saw', 20); return mix([filt(s, 'bp', f1, 4), 1], [filt(s, 'bp', f2, 5), 0.6]); };
D.crowd = [
  {name: 'gasp', about: 'a crowd gasps (shock)', make: () => { const r = rng(231); return finish(mix(...Array.from({length: 10}, (_, i) => [filt(noise(0.5, (t) => Math.min(1, t / 0.08) * Math.exp(-t * 5), 233 + i), 'bp', 900 + r() * 900, 2), 0.4, r() * 0.06])), {wet: 0.4, tail: 0.5}); }},
  {name: 'ooh', about: 'an amazed "ooooh" from a crowd', make: () => { const r = rng(235); return finish(mix(...Array.from({length: 8}, (_, i) => [voiceV(1.4, 140 + r() * 160, 'oo', swell(1.4, 0.35), i), 0.4, r() * 0.08])), {wet: 0.5, tail: 0.6}); }},
  {name: 'cheer', about: 'a cheering crowd ("yeah!")', make: () => { const r = rng(237); return finish(mix(...Array.from({length: 10}, (_, i) => [voiceV(1.1, 180 + r() * 220, 'ah', swell(1.1, 0.3), i), 0.35, r() * 0.15]), [filt(noise(1.2, swell(1.2, 0.3), 239), 'bp', 1500, 0.8), 0.4]), {wet: 0.5, tail: 0.6}); }},
  {name: 'applause', about: 'applause (a win, a great idea)', make: () => { const r = rng(241); return finish(mix(...Array.from({length: 70}, (_, i) => [filt(noise(0.02, exp(250), 243 + i), 'bp', 1000 + r() * 1800, 1.5), 0.3 * Math.sin(Math.PI * Math.min(1, (i / 70) * 1.2)), r() * 1.4])), {wet: 0.35, tail: 0.5}); }},
];
D.fall = [
  {name: 'whistle', about: 'cartoon falling whistle + soft landing', make: () => finish(mix([osc(1, line(1800, 350, 1), (t) => Math.min(1, t / 0.05) * Math.min(1, (1 - t) / 0.05)), 0.6], [osc(0.3, glide(120, 60, 16), att(0.002, 12)), 1, 1]), {wet: 0.2, tail: 0.3})},
  {name: 'price-drop', about: 'three falling notes + a low thud (value falls)', make: () => finish(mix(...[[784, 0], [587, 0.15], [440, 0.3]].map(([f, d]) => [osc(0.25, f, att(0.002, 10), 'tri'), 0.7, d]), [osc(0.4, glide(100, 50, 12), att(0.002, 8)), 0.9, 0.48]), {wet: 0.25, tail: 0.4})},
  {name: 'swoop-down', about: 'air swooping down', make: () => finish(filt(noise(0.7, swell(0.7, 0.4), 251), 'bp', line(3000, 300, 0.7), 1.3), {wet: 0.15, tail: 0.25})},
  {name: 'crash', about: 'falls, then crashes (debris)', make: () => { const r = rng(253); return finish(mix([osc(0.7, line(1500, 400, 0.7), (t) => Math.min(1, t / 0.05) * Math.min(1, (0.7 - t) / 0.03)), 0.4], [osc(0.5, glide(110, 50, 10), att(0.002, 7)), 1, 0.7], [filt(noise(0.5, exp(8), 255), 'lp', 3000), 0.6, 0.7], ...Array.from({length: 8}, () => [coinHit(1200 + r() * 2000, 30), 0.15, 0.72 + r() * 0.4])), {wet: 0.3, tail: 0.5}); }},
];
D.levelup = [
  {name: 'arp-up', about: 'four quick notes up (game level-up)', make: () => finish(mix(...[784, 988, 1175, 1568].map((f, i) => [osc(0.35, f, att(0.002, 9), 'tri'), 0.6, i * 0.07])), {wet: 0.3, tail: 0.4})},
  {name: 'rise-ding', about: 'short rise, then a ding at the top', make: () => finish(mix([filt(noise(0.5, swell(0.5, 0.95), 261), 'bp', line(500, 3500, 0.5), 1.3), 0.8], [bellP(1, 2093, 4), 0.7, 0.48]), {wet: 0.3, tail: 0.6})},
  {name: 'power-up', about: 'retro power-up sweep, softened', make: () => finish(filt(osc(0.6, (t) => line(300, 1200, 0.6)(t) * (1 + 0.04 * Math.sin(TAU * 14 * t)), (t) => Math.min(1, t / 0.02) * Math.min(1, (0.6 - t) / 0.08), 'sq', 7), 'lp', 4000), {wet: 0.25, tail: 0.3})},
  {name: 'step-up', about: 'two notes up with a whoosh (climbing a step)', make: () => finish(mix([filt(noise(0.35, swell(0.35, 0.6), 263), 'bp', line(600, 2000, 0.35), 1.2), 0.7], [bellP(0.6, 1319, 6), 0.6, 0.2], [bellP(0.8, 1760, 4), 0.6, 0.32]), {wet: 0.3, tail: 0.5})},
];
export const GROUP3 = ['typing', 'shutter', 'clock', 'glitch', 'scratch', 'crowd', 'fall', 'levelup'];
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
  const WHEN = {pop: 'pills, tags, small labels', popup: 'headline words (like «الخزنة فاضية»)', boom: 'big reveals, the board jumping, ✖ marks', thump: 'something lands (a podium block, a card set down)', shimmer: 'precious things (diamond, gold, money)', riser: 'the build-up just before a reveal', whoosh: 'transitions, things sliding or flying in', swish: 'a paper or card flick', tick: 'small mechanics (path dots, counting, rows)', ding: 'a value confirmed («غالي!»)', impact: 'a hard accent inside a story', tail: 'the long deep tail under the biggest reveals (new)', cash: 'money earned, paid or sold', coins: 'coins dropping, a pile growing', tease: '«ليش؟», a mystery, "wait…"', suspense: 'tension before a twist', wrong: 'a mistake («غلطة»), a wrong answer', correct: '✔, a win, the right answer', stamp: '«تم البيع», «انسرقت!»', alert: 'a red warning («تحويل بالغلط!»)', ping: 'phone, message, transfer done', explosion: 'a blast (the rocket blowing up)', typing: 'laptops and screens', shutter: 'photos, newspapers', clock: 'a deadline, time running out', glitch: 'a digital error, hacking', scratch: '"stop, wait…", a comic twist', crowd: 'reactions (gasp, ooh, cheer, applause)', fall: 'a price falling, something crashing', levelup: 'climbing the board / stairs'};
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
<button onclick="play('${type}/alone-${it.v}',this)">▶ alone</button><button onclick="play('${type}/context-${it.v}',this)">▶ with voice</button></div>`;
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
<h1>Sound lab · group ${GROUP}</h1><p class="lead">${GROUP === 1 ? 'The 12 sound types of the reference.' : GROUP === 2 ? 'Story sounds the reference rarely or never used.' : 'Nice-to-have story sounds.'} <b>alone</b> = the sound by itself (all at the same loudness) · <b>with voice</b> = 5 s of the voiceover with the sound at the Studio's standard level (−19). Tell Claude your pick per type, e.g. "pop 2, boom 1+4" (two picks = the mixer alternates them).</p>
${html}</main><div id="err" style="position:fixed;left:16px;right:16px;bottom:16px;background:#E23A4E;color:#fff;padding:10px;border-radius:8px;display:none"></div><audio id="a"></audio><script>const CLIPS=${JSON.stringify(Object.fromEntries(Object.keys(index).flatMap((type)=>fs.readdirSync(path.join(OUT,type)).filter((f)=>f.endsWith('.mp3')).map((f)=>[type+'/'+f.replace(/.mp3$/,''),'data:audio/mpeg;base64,'+fs.readFileSync(path.join(OUT,type,f)).toString('base64')]))))};
const a=document.getElementById('a'),er=document.getElementById('err');let cur=null;
function play(k,b){if(cur)cur.classList.remove('on');a.pause();a.src=CLIPS[k];cur=b;b.classList.add('on');a.onended=()=>b.classList.remove('on');a.play().then(()=>er.style.display='none').catch(e=>{er.textContent='Could not play: '+e.message+' — check the volume / the tab is not muted.';er.style.display='block';b.classList.remove('on')})}</script></body></html>`);
  console.log(`page: ${path.relative(process.cwd(), path.join(OUT, 'index.html'))}`);
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
  const types = opt.only ? String(opt.only).split(',') : GROUP === 2 ? GROUP2 : GROUP === 3 ? GROUP3 : GROUP1;
  const indexFile = path.join(OUT, 'index.json');
  const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : {}; // merge: --only must not drop the other types
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
