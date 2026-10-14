// Binly audio engine: generates the MUSIC stem and the SFX stem for a video from two small JSON files.
// The voiceover is only READ (for its timing envelope, used to duck the music) — never modified.
//
//   node tools/audio/make-audio.mjs <voiceover> <score.json> <sfx.json> <outDir>
//
// Needs ffmpeg on PATH (the cloud runner has it) to decode the voiceover / library tracks.
// score.json  { "key":"D", "mode":"minor", "bpm":68, "seed":7, "level":0,
//               "sections":[{"t":0,"mood":"curious","level":0.8}, {"t":41.2,"mood":"tension"}, ...],
//               "accents":[{"t":12.3,"kind":"swell","dur":3}, {"t":95,"kind":"drop","dur":2.5}, ...] }
//   moods: curious, wonder, tension, dark, build, reflective, warm, neutral, playful, sad, triumphant
//   section.track (optional): "library/music/<file>.mp3" + "offset" (s) → use a real track for that section
//   accents: swell (lift music), drop (dramatic near-silence), resolve (soft bell chord), sting (low hit + bell),
//            silence (mute music), riser (soft rising air into t)
// sfx.json    [ {"t":3.06,"kind":"stamp","gain":1,"pan":0}, {"t":12,"file":"library/sfx/door.wav","gain":0.8} ]
//   kinds: stamp, whoosh, swoosh, swish, pop, tick, click, thump, rumble, shutter, paper, page, chime, bell,
//          riser, impact, clack, scribble, typing, bubble, sparkle, heartbeat, breath, drip, splash, crowd,
//          wind, fire, door, bell_toll, glass, heartbeat_slow, low_drone, sweep_down, ding
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import os from 'node:os';

const [, , voPath, scorePath, sfxPath, outDir] = process.argv;
if (!voPath || !scorePath || !outDir) {
  console.log('usage: node tools/audio/make-audio.mjs <voiceover> <score.json> <sfx.json|-> <outDir>');
  process.exit(1);
}
const SR = 48000;
const FF = process.env.FFMPEG ?? 'ffmpeg';

// ------------------------------------------------------------------ io
// decode any audio to float32 PCM at SR via a temporary 16-bit WAV (works with full and minimal ffmpeg builds)
let tmpN = 0;
const decode = (file, channels = 1) => {
  const tmp = path.join(os.tmpdir(), `binly-dec-${process.pid}-${tmpN++}.wav`);
  const r = spawnSync(FF, ["-v", "error", "-y", "-i", file, "-ac", String(channels), "-ar", String(SR), "-c:a", "pcm_s16le", "-f", "wav", tmp], {encoding: "utf8"});
  if (r.status !== 0) throw new Error(`ffmpeg could not decode ${file}: ${r.stderr}`);
  const b = fs.readFileSync(tmp);
  fs.rmSync(tmp, {force: true});
  let p = 12;
  while (p < b.length - 8) {
    const id = b.toString("ascii", p, p + 4);
    const size = b.readUInt32LE(p + 4);
    if (id === "data") {
      const n = Math.min(size, b.length - p - 8) >> 1;
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = b.readInt16LE(p + 8 + i * 2) / 32768;
      return out;
    }
    p += 8 + size + (size % 2);
  }
  throw new Error("no data chunk in decoded wav");
};
const writeWav = (file, L, R) => {
  const n = L.length;
  const b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + n * 4, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 4, 28);
  b.writeUInt16LE(4, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(file, b);
};

// ------------------------------------------------------------------ dsp helpers
const mulberry = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const biquad = (type, f, q) => {
  const w = (2 * Math.PI * f) / SR;
  const a = Math.sin(w) / (2 * q);
  const c = Math.cos(w);
  let b0, b1, b2;
  if (type === 'lp') [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
  else if (type === 'hp') [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
  else [b0, b1, b2] = [a, 0, -a];
  const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
};
const makeReverb = (room = 0.84, damp = 0.35) => {
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => Math.round((d * SR) / 44100));
  const apT = [556, 441, 341, 225].map((d) => Math.round((d * SR) / 44100));
  const mk = (spread) => {
    const combs = combT.map((d) => ({buf: new Float32Array(d + spread), i: 0, f: 0}));
    const aps = apT.map((d) => ({buf: new Float32Array(d + spread), i: 0}));
    return (x) => {
      let out = 0;
      for (const cb of combs) {
        const y = cb.buf[cb.i];
        cb.f = y * (1 - damp) + cb.f * damp;
        cb.buf[cb.i] = x + cb.f * room;
        cb.i = (cb.i + 1) % cb.buf.length;
        out += y;
      }
      for (const ap of aps) {
        const b = ap.buf[ap.i];
        ap.buf[ap.i] = out + b * 0.5;
        ap.i = (ap.i + 1) % ap.buf.length;
        out = b - out;
      }
      return out * 0.03;
    };
  };
  const l = mk(0), r = mk(25);
  return (x) => [l(x), r(x)];
};

// ------------------------------------------------------------------ inputs
const vo = decode(voPath, 1);
const N = vo.length;
const DUR = N / SR;
const score = JSON.parse(fs.readFileSync(scorePath, 'utf8'));
const sfxList = sfxPath && sfxPath !== '-' && fs.existsSync(sfxPath) ? JSON.parse(fs.readFileSync(sfxPath, 'utf8')) : [];
console.log(`voiceover ${DUR.toFixed(3)} s · ${score.sections?.length ?? 0} music sections · ${score.accents?.length ?? 0} accents · ${sfxList.length} sfx`);

// narration envelope (0..1) for ducking
const env = new Float32Array(N);
{
  let acc = 0;
  const win = Math.round(SR * 0.03);
  for (let i = 0; i < N; i++) {
    acc += vo[i] * vo[i] - (i >= win ? vo[i - win] * vo[i - win] : 0);
    env[i] = Math.sqrt(Math.max(0, acc) / win);
  }
  // speech envelope for ducking: fast attack, HOLD 0.35 s so music doesn't pump between words, slow release in real gaps
  let g = 0, hold = 0;
  const att = Math.exp(-1 / (SR * 0.12)), rel = Math.exp(-1 / (SR * 0.9)), HOLD = Math.round(SR * 0.35);
  for (let i = 0; i < N; i++) {
    const target = Math.min(1, env[i] / 0.05);
    if (target >= g) { g = att * g + (1 - att) * target; hold = HOLD; }
    else if (hold > 0) hold--;
    else g = rel * g + (1 - rel) * target;
    env[i] = g;
  }
}

// ------------------------------------------------------------------ harmony
const KEYS = {C: 48, 'C#': 49, Db: 49, D: 50, 'D#': 51, Eb: 51, E: 52, F: 53, 'F#': 54, Gb: 54, G: 43, 'G#': 44, Ab: 44, A: 45, 'A#': 46, Bb: 46, B: 47};
const root = KEYS[score.key ?? 'D'] ?? 50;
const minor = (score.mode ?? 'minor') === 'minor';
// scale degrees as semitone offsets (natural minor / major)
const SC = minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
const deg = (d, oct = 0) => root + SC[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);
// chord = stack of scale degrees from degree d (triad + 7th + 9th), voiced around middle register
const chord = (d, ext = [0, 2, 4, 6], bass = true) => {
  const notes = ext.map((e) => deg(d + e, 1));
  if (bass) notes.unshift(deg(d, 0));
  return notes;
};
// mood → {prog (scale degrees, minor-relative), bright, pluck density, pulse, level, pluckOct}
const MOODS = {
  curious: {prog: [0, 5, 2, 6], ext: [0, 2, 4, 8], bright: 0.42, pluck: 0.55, pulse: 0, level: 0.9, oct: 1},
  wonder: {prog: [5, 2, 6, 3], ext: [0, 2, 4, 6, 8], bright: 0.68, pluck: 0.7, pulse: 0, level: 1.0, oct: 2},
  tension: {prog: [0, 0, 1, 0], ext: [0, 2, 7], bright: 0.14, pluck: 0.0, pulse: 0.5, level: 0.8, oct: 0, cluster: true},
  dark: {prog: [0, 5, 0, 4], ext: [0, 2, 4], bright: 0.12, pluck: 0.12, pulse: 0, level: 0.75, oct: 0},
  build: {prog: [0, 5, 2, 6], ext: [0, 2, 4, 6], bright: 0.55, pluck: 0.85, pulse: 1, level: 1.05, oct: 1, rise: true},
  reflective: {prog: [5, 6, 0, 0], ext: [0, 2, 4, 8], bright: 0.36, pluck: 0.3, pulse: 0, level: 0.85, oct: 1},
  warm: {prog: [2, 6, 5, 2], ext: [0, 2, 4, 6], bright: 0.55, pluck: 0.45, pulse: 0, level: 0.95, oct: 1},
  neutral: {prog: [0, 5], ext: [0, 2, 4], bright: 0.3, pluck: 0.15, pulse: 0, level: 0.7, oct: 1},
  playful: {prog: [2, 5, 6, 2], ext: [0, 2, 4], bright: 0.7, pluck: 1.0, pulse: 0.4, level: 0.95, oct: 2, staccato: true},
  sad: {prog: [5, 3, 0, 4], ext: [0, 2, 4, 6], bright: 0.25, pluck: 0.25, pulse: 0, level: 0.8, oct: 1},
  triumphant: {prog: [5, 6, 2, 2], ext: [0, 2, 4, 7], bright: 0.75, pluck: 0.6, pulse: 1, level: 1.1, oct: 1},
};
const bpm = score.bpm ?? 68;
const beat = 60 / bpm;
const chordLen = beat * 8; // two bars of 4/4 per chord
const sections = (score.sections ?? [{t: 0, mood: 'curious'}]).slice().sort((a, b) => a.t - b.t);
const secAt = (tt) => {
  let s = sections[0];
  for (const x of sections) if (x.t <= tt) s = x;
  return s;
};

// ------------------------------------------------------------------ MUSIC
const rnd = mulberry(score.seed ?? 7);
const L = new Float32Array(N), R = new Float32Array(N);
const padL = new Float32Array(N), padR = new Float32Array(N), dry = new Float32Array(N);
const XF = 2.2; // section/chord crossfade seconds

// build an event list of chords across all sections
const chords = [];
sections.forEach((s, si) => {
  const m = MOODS[s.mood] ?? MOODS.curious;
  const end = si + 1 < sections.length ? sections[si + 1].t : DUR + 2;
  if (s.track) return; // real track handles this section
  let k = 0;
  for (let tt = s.t; tt < end; tt += chordLen, k++) {
    const d = m.prog[k % m.prog.length];
    let notes = chord(d, m.ext);
    if (m.cluster) notes = [deg(0, 0), deg(0, 1), deg(1, 1) - (minor ? 1 : 0), deg(4, 1)];
    chords.push({t0: tt, t1: Math.min(end, tt + chordLen), notes, m, lvl: s.level ?? 1, si});
  }
});

// pad
for (const c of chords) {
  const i0 = Math.max(0, Math.floor((c.t0 - XF) * SR));
  const i1 = Math.min(N, Math.ceil((c.t1 + XF) * SR));
  c.notes.forEach((midi, ni) => {
    const f = mtof(midi);
    const det = [-0.07, 0, 0.08];
    const ph = [rnd(), rnd(), rnd()];
    const pan = ((ni % 3) - 1) * 0.35;
    const low = midi < root + 10;
    for (let i = i0; i < i1; i++) {
      const tt = i / SR;
      const a = smooth((tt - (c.t0 - XF)) / XF) * (1 - smooth((tt - c.t1) / XF));
      if (a <= 0) continue;
      let s = 0;
      for (let d = 0; d < 3; d++) {
        ph[d] += (f * Math.pow(2, det[d] / 12) * (1 + 0.0015 * Math.sin(tt * (0.3 + d * 0.11)))) / SR;
        const p = ph[d] * 2 * Math.PI;
        s += Math.sin(p) + 0.3 * Math.sin(2 * p) * c.m.bright + 0.12 * Math.sin(3 * p) * c.m.bright;
      }
      const breath = 0.86 + 0.14 * Math.sin(tt * 0.8 + ni);
      const rise = c.m.rise ? 0.75 + 0.25 * ((tt - c.t0) / chordLen) : 1;
      const v = (s / 3) * a * c.m.level * c.lvl * breath * rise * (low ? 0.75 : 0.32 + c.m.bright * 0.3) * 0.05;
      padL[i] += v * (1 - pan);
      padR[i] += v * (1 + pan);
    }
  });
}
{
  const lpL = biquad('lp', 2000, 0.5), lpR = biquad('lp', 2000, 0.5), hpL = biquad('hp', 55, 0.7), hpR = biquad('hp', 55, 0.7);
  for (let i = 0; i < N; i++) {
    padL[i] = hpL(lpL(padL[i]));
    padR[i] = hpR(lpR(padR[i]));
  }
}
// plucks (felt piano / music box) — seeded melodic figures over each chord
const pluck = (t0, midi, vel, decay = 2.2) => {
  const f = mtof(midi);
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor(2.8 * SR);
  for (let k = 0; k < len && i0 + k < N; k++) {
    const tt = k / SR;
    const p = 2 * Math.PI * f * tt;
    const s = Math.sin(p) * Math.exp(-tt * decay) + 0.35 * Math.sin(2 * p) * Math.exp(-tt * 4) + 0.1 * Math.sin(3.01 * p) * Math.exp(-tt * 7) + 0.04 * Math.sin(5.4 * p) * Math.exp(-tt * 12);
    dry[i0 + k] += s * Math.min(1, tt / 0.004) * vel * 0.045;
  }
};
for (const c of chords) {
  if (c.m.pluck <= 0) continue;
  const pool = c.notes.slice(1).map((n) => n + 12 * c.m.oct - 12);
  const step = c.m.staccato ? beat / 2 : beat;
  for (let tt = c.t0 + beat * 0.5; tt < c.t1 - 0.2; tt += step) {
    if (rnd() > c.m.pluck * 0.75) continue;
    const n = pool[Math.floor(rnd() * pool.length)];
    pluck(tt, n, (0.3 + rnd() * 0.25) * c.lvl, c.m.staccato ? 4 : 2.2);
  }
}
// bass pulse (build / tension / triumphant)
for (const c of chords) {
  if (!c.m.pulse) continue;
  const f = mtof(c.notes[0] - (c.notes[0] > root + 5 ? 12 : 0));
  for (let tt = c.t0; tt < c.t1; tt += beat * (c.m.pulse >= 1 ? 1 : 2)) {
    const i0 = Math.floor(tt * SR);
    for (let k = 0; k < SR * 0.9 && i0 + k < N; k++) {
      const x = k / SR;
      dry[i0 + k] += Math.sin(2 * Math.PI * f * x) * Math.min(1, x / 0.012) * Math.exp(-x * 4.5) * 0.06 * c.lvl;
    }
  }
}
// accents
for (const a of score.accents ?? []) {
  if (a.kind === 'resolve' || a.kind === 'sting') {
    const notes = [deg(0, 2), deg(2, 2), deg(4, 2)];
    notes.forEach((n, i) => pluck(a.t + i * 0.04, n, 0.55, 1.4));
    if (a.kind === 'sting') {
      const i0 = Math.floor(a.t * SR);
      for (let k = 0; k < SR * 1.6 && i0 + k < N; k++) {
        const x = k / SR;
        dry[i0 + k] += Math.sin(2 * Math.PI * mtof(root - 12) * x) * Math.min(1, x / 0.01) * Math.exp(-x * 2.2) * 0.12;
      }
    }
  }
}
// reverb + mix
{
  const rev = makeReverb(0.86, 0.4);
  for (let i = 0; i < N; i++) {
    const [wl, wr] = rev(dry[i] + (padL[i] + padR[i]) * 0.35);
    L[i] = padL[i] + dry[i] * 0.9 + wl * 0.9;
    R[i] = padR[i] + dry[i] * 0.9 + wr * 0.9;
  }
}
// library tracks for sections that request them
sections.forEach((s, si) => {
  if (!s.track) return;
  const file = path.resolve(s.track);
  if (!fs.existsSync(file)) {
    console.log(`WARNING: track not found ${s.track} — section at ${s.t}s will be silent`);
    return;
  }
  const end = si + 1 < sections.length ? sections[si + 1].t : DUR;
  const st = decode(file, 2);
  const off = Math.floor((s.offset ?? 0) * SR);
  const i0 = Math.floor(s.t * SR);
  const i1 = Math.min(N, Math.ceil(end * SR) + Math.floor(XF * SR));
  const g = (s.level ?? 1) * 0.5;
  for (let i = Math.max(0, i0 - Math.floor(XF * SR)); i < i1; i++) {
    const j = off + (i - i0);
    if (j < 0 || j * 2 + 1 >= st.length) continue;
    const tt = i / SR;
    const a = smooth((tt - (s.t - XF)) / XF) * (1 - smooth((tt - end) / XF));
    L[i] += st[j * 2] * a * g;
    R[i] += st[j * 2 + 1] * a * g;
  }
});
// voice-band carve: while the voice speaks, pull the music down around 1–4 kHz (where speech intelligibility lives)
{
  const bL = biquad('bp', 2200, 0.6), bR = biquad('bp', 2200, 0.6);
  for (let i = 0; i < N; i++) {
    const k = 0.6 * env[i];
    L[i] -= k * bL(L[i]);
    R[i] -= k * bR(R[i]);
  }
}
// automation: duck under voice, accents (swell/drop/silence), global fades
const accentGain = (tt) => {
  let g = 1;
  for (const a of score.accents ?? []) {
    const d = a.dur ?? 2;
    if (a.kind === 'swell') g *= 1 + 0.6 * Math.sin(Math.PI * Math.min(1, Math.max(0, (tt - a.t) / d)));
    if (a.kind === 'drop' || a.kind === 'silence') {
      const k = smooth((tt - (a.t - 0.4)) / 0.4) * (1 - smooth((tt - (a.t + d)) / 1.2));
      g *= 1 - k * (a.kind === 'silence' ? 1 : 0.85);
    }
  }
  return g;
};
for (let i = 0; i < N; i++) {
  const tt = i / SR;
  const duck = 1 - 0.6 * env[i]; // ≈ -8 dB while the voice speaks, back up in gaps
  const fade = smooth(tt / 1.5) * (1 - smooth((tt - (DUR - (score.endFade ?? 3))) / (score.endFade ?? 3)));
  const g = duck * fade * accentGain(tt);
  L[i] *= g;
  R[i] *= g;
}

// ------------------------------------------------------------------ SFX
const sL = new Float32Array(N), sR = new Float32Array(N);
const srnd = mulberry(1234);
let curGain = 1;
// every sound event is rendered into its own small buffer (tgt*, starting at sample tgtOff), levelled, then mixed
let tgtL = sL, tgtR = sR, tgtOff = 0;
const add = (t0, len, fn, pan = 0, gain = 1) => {
  const i0 = Math.floor(t0 * SR) - tgtOff;
  for (let k = 0; k < len * SR && i0 + k < tgtL.length; k++) {
    if (i0 + k < 0) continue;
    const v = fn(k / SR) * gain * curGain;
    tgtL[i0 + k] += v * (1 - pan * 0.6);
    tgtR[i0 + k] += v * (1 + pan * 0.6);
  }
};
const noise = (lpHz, shape, gain = 1, hpHz = 0) => {
  const f = biquad('lp', lpHz, 0.7);
  const h = hpHz ? biquad('hp', hpHz, 0.7) : (x) => x;
  return (tt) => h(f(srnd() * 2 - 1)) * shape(tt) * gain;
};
const tone = (f0, f1, decay, gain, sweep = 18) => {
  let ph = 0;
  return (tt) => {
    const f = f1 + (f0 - f1) * Math.exp(-tt * sweep);
    ph += f / SR;
    return Math.sin(2 * Math.PI * ph) * Math.min(1, tt / 0.003) * Math.exp(-tt * decay) * gain;
  };
};
const band = (dur, from, to, gain, q = 0.8) => {
  let f = biquad('bp', from, q), last = from;
  return (tt) => {
    const k = Math.min(1, tt / dur);
    const hz = from + (to - from) * k;
    if (Math.abs(hz - last) > 30) {
      f = biquad('bp', hz, q);
      last = hz;
    }
    return f(srnd() * 2 - 1) * Math.sin(Math.PI * k) ** 2 * gain;
  };
};
const bell = (f, decay, gain) => (tt) => (Math.sin(2 * Math.PI * f * tt) + 0.5 * Math.sin(2 * Math.PI * f * 2.76 * tt) * Math.exp(-tt * 3) + 0.25 * Math.sin(2 * Math.PI * f * 5.4 * tt) * Math.exp(-tt * 6)) * Math.exp(-tt * decay) * Math.min(1, tt / 0.002) * gain;
const ex = (d) => (x) => Math.exp(-x * d);
const SFX = {
  stamp: (t, p) => { add(t, 0.5, tone(110, 52, 14, 0.22), p); add(t, 0.2, noise(1800, ex(30), 0.12), p); },
  whoosh: (t, p) => add(t - 0.2, 0.7, band(0.7, 300, 1500, 0.07), p),
  swoosh: (t, p) => add(t - 0.15, 0.5, band(0.5, 2400, 900, 0.06), p),
  swish: (t, p) => add(t - 0.1, 0.35, band(0.35, 2600, 1800, 0.05), p),
  sweep_down: (t, p) => add(t - 0.3, 1.0, band(1.0, 1500, 300, 0.06), p),
  pop: (t, p) => add(t, 0.15, tone(900, 420, 30, 0.1, 40), p),
  tick: (t, p) => add(t, 0.05, noise(5000, ex(140), 0.08, 1500), p),
  click: (t, p) => { add(t, 0.04, noise(4000, ex(120), 0.1, 800), p); add(t, 0.06, tone(1800, 1200, 60, 0.03), p); },
  thump: (t, p) => add(t, 0.5, tone(140, 55, 12, 0.2), p),
  impact: (t, p) => { add(t, 0.9, tone(90, 40, 5, 0.25), p); add(t, 0.4, noise(900, ex(12), 0.1), p); },
  rumble: (t, p) => add(t, 2.2, noise(140, (x) => Math.min(1, x / 0.3) * Math.exp(-x * 1.4), 0.3), p),
  low_drone: (t, p) => add(t, 4, tone(55, 55, 0.6, 0.12), p),
  shutter: (t, p) => { add(t, 0.05, noise(3200, ex(120), 0.12), p); add(t + 0.06, 0.08, noise(2400, ex(80), 0.1), p); add(t + 0.02, 0.4, tone(220, 140, 22, 0.05), p); },
  paper: (t, p) => add(t, 0.45, noise(3500, (x) => Math.sin(Math.PI * Math.min(1, x / 0.45)) * (0.6 + 0.4 * Math.sin(x * 90)), 0.05, 600), p),
  page: (t, p) => add(t, 0.6, band(0.6, 1200, 4200, 0.05, 0.6), p),
  chime: (t, p) => add(t, 2.5, bell(1320, 2.2, 0.05), p),
  ding: (t, p) => add(t, 1.6, bell(1760, 3.2, 0.05), p),
  bell: (t, p) => add(t, 3.5, bell(660, 1.4, 0.06), p),
  bell_toll: (t, p) => { add(t, 6, bell(220, 0.7, 0.1), p); add(t, 6, bell(330, 0.9, 0.03), p); },
  riser: (t, p) => add(t - 1.6, 1.7, band(1.6, 300, 2600, 0.05, 1.2), p),
  clack: (t, p) => { add(t, 0.12, tone(950, 700, 50, 0.06), p); add(t + 0.02, 0.06, noise(4000, ex(90), 0.05), p); },
  scribble: (t, p, d = 1.2) => add(t, d, noise(5200, (x) => (0.5 + 0.5 * Math.sin(x * 38)) * Math.sin(Math.PI * Math.min(1, x / d)), 0.035, 1800), p),
  typing: (t, p, d = 1.5) => { for (let k = 0; k * 0.09 < d; k++) add(t + k * 0.09 + srnd() * 0.03, 0.04, noise(4500, ex(150), 0.07, 1200), p); },
  bubble: (t, p) => add(t, 0.25, tone(500, 1100, 14, 0.06, -8), p),
  sparkle: (t, p) => [0, 0.07, 0.15].forEach((d, i) => add(t + d, 1.2, bell(2200 + i * 330, 4, 0.025), p)),
  heartbeat: (t, p) => { add(t, 0.25, tone(60, 45, 18, 0.25), p); add(t + 0.22, 0.25, tone(55, 42, 20, 0.18), p); },
  heartbeat_slow: (t, p) => SFX.heartbeat(t, p),
  breath: (t, p) => add(t, 1.6, noise(1600, (x) => Math.sin(Math.PI * Math.min(1, x / 1.6)) ** 2, 0.05, 300), p),
  drip: (t, p) => add(t, 0.2, tone(1400, 2600, 24, 0.07, -20), p),
  splash: (t, p) => add(t, 0.9, noise(3000, (x) => Math.min(1, x / 0.01) * Math.exp(-x * 5), 0.12, 400), p),
  wind: (t, p, d = 4) => add(t, d, band(d, 300, 500, 0.06, 0.5), p),
  fire: (t, p, d = 3) => add(t, d, noise(1200, (x) => (0.6 + 0.4 * Math.sin(x * 13 + Math.sin(x * 7))) * Math.sin(Math.PI * Math.min(1, x / d)), 0.04, 200), p),
  crowd: (t, p, d = 4) => add(t, d, noise(900, (x) => (0.7 + 0.3 * Math.sin(x * 3)) * Math.sin(Math.PI * Math.min(1, x / d)), 0.05, 250), p),
  door: (t, p) => { add(t, 0.8, tone(80, 70, 6, 0.12), p); add(t, 0.3, noise(600, ex(10), 0.08), p); },
  glass: (t, p) => add(t, 1.2, bell(2800, 5, 0.04), p),
};
let unknown = 0;
// ---- levels: felt, never competing with the voice -------------------------------------------------------------
// Each sound is levelled on its own to the same perceived loudness (loudest 50 ms), then given its kind's character
// offset (soft textures quieter than hits), ducked ~6 dB while the narrator speaks, and placed relative to the voice:
// a 0 dB kind sits ~16 dB under the speech level in a pause (~22 dB under it while the narrator talks).
const KIND_DB = {stamp: 0, impact: 0, bell_toll: 0, thump: -1, heartbeat: -1, heartbeat_slow: -1, whoosh: -2, swoosh: -2, riser: -2,
  rumble: -2, bell: -2, sweep_down: -3, splash: -3, door: -3, footsteps: -5, swish: -4, paper: -4, page: -4, shutter: -4, chime: -4, pop: -4,
  click: -5, clack: -5, ding: -5, glass: -5, bubble: -5, drip: -5, sparkle: -5, tick: -6, scribble: -6, typing: -6, breath: -6,
  low_drone: -6, wind: -8, fire: -8, crowd: -8, water: -8};
const SFX_OFFSET_DB = -16 + (score.sfxLevel ?? 0); // global trim (score.json "sfxLevel", dB) if a video wants it
const voSpeechLvl = (() => { let q = 0, c = 0; for (let i = 0; i < N; i += 4) if (env[i] > 0.5) { q += vo[i] * vo[i]; c++; } return Math.sqrt(q / Math.max(1, c)); })();
const REF = (voSpeechLvl > 1e-5 ? voSpeechLvl : 0.1) * Math.pow(10, SFX_OFFSET_DB / 20);
const W50 = Math.round(SR * 0.05);
const loudOf = (a, b) => {
  let best = 0, acc = 0;
  for (let i = 0; i < a.length; i++) {
    acc += (a[i] * a[i] + b[i] * b[i]) / 2;
    if (i >= W50) acc -= (a[i - W50] * a[i - W50] + b[i - W50] * b[i - W50]) / 2;
    if (acc > best) best = acc;
  }
  return Math.sqrt(Math.max(0, best) / W50);
};
// real recordings: library/sfx/<kind>.wav|mp3|ogg|flac (or <kind>-1, <kind>-2 … variants) REPLACE the synthetic kind automatically
const LIB = path.resolve('library', 'sfx');
const libFiles = fs.existsSync(LIB) ? fs.readdirSync(LIB).filter((x) => /.(wav|mp3|ogg|flac)$/i.test(x)) : [];
const libFor = (kind, t) => {
  const c = libFiles.filter((x) => x.replace(/.[^.]+$/, '').replace(/-d+$/, '') === kind).sort();
  return c.length ? path.join(LIB, c[Math.floor(Math.abs(Math.sin(t * 12.9898) * 43758.5453) % 1 * c.length)]) : null;
};
const LEAD = {whoosh: 0.2, swoosh: 0.15, swish: 0.1, sweep_down: 0.3}; // peak lands on the cue
const decCache = new Map();
const placeFile = (file, t, kind, pan, dur) => {
  if (!decCache.has(file)) decCache.set(file, decode(file, 2));
  const st = decCache.get(file);
  const fileLen = st.length / 2;
  const want = dur ? Math.round(dur * SR) : Math.min(fileLen, Math.round(6 * SR));
  const start = kind === 'riser' ? t - fileLen / SR : t - (LEAD[kind] ?? 0);
  const i0 = Math.floor(start * SR) - tgtOff;
  const fade = Math.round(SR * (dur ? 0.3 : 0.02));
  for (let k = 0; k < want && i0 + k < tgtL.length; k++) {
    if (i0 + k < 0) continue;
    const j = k % fileLen; // long kinds (crowd, wind, fire …) loop to the requested dur
    const env2 = Math.min(1, k / (dur ? fade : 1), (want - k) / fade);
    tgtL[i0 + k] += st[j * 2] * env2 * (1 - pan * 0.6);
    tgtR[i0 + k] += st[j * 2 + 1] * env2 * (1 + pan * 0.6);
  }
};
for (const s of sfxList) {
  const p = s.pan ?? 0;
  const d = s.dur ?? 0;
  const lenS = 2.5 + Math.max(7, d + 2);
  tgtOff = Math.max(0, Math.floor((s.t - 2.5) * SR));
  tgtL = new Float32Array(Math.round(lenS * SR));
  tgtR = new Float32Array(tgtL.length);
  const file = s.file ? path.resolve(s.file) : libFor(s.kind, s.t);
  if (file) {
    if (!fs.existsSync(file)) { console.log(`WARNING: sfx file missing ${s.file}`); continue; }
    placeFile(file, s.t, s.kind, p, d);
  } else {
    const fn = SFX[s.kind];
    if (!fn) { unknown++; console.log(`WARNING: unknown sfx kind "${s.kind}" at ${s.t}s`); continue; }
    fn(s.t, p, s.dur);
  }
  const l = loudOf(tgtL, tgtR);
  if (l < 1e-7) continue;
  const g = (REF / l) * Math.pow(10, (KIND_DB[s.kind] ?? -4) / 20) * (s.gain ?? 1);
  for (let k = 0; k < tgtL.length; k++) {
    const i = tgtOff + k;
    if (i >= N) break;
    const duck = 1 - 0.5 * env[i]; // ~ -6 dB while the narrator speaks
    sL[i] += tgtL[k] * g * duck;
    sR[i] += tgtR[k] * g * duck;
  }
}
tgtL = sL; tgtR = sR; tgtOff = 0;

// ------------------------------------------------------------------ gain staging (voice untouched)
const speech = (i) => env[i] > 0.5;
const rmsDb = (a, mask) => {
  let s = 0, c = 0;
  for (let i = 0; i < a.length; i += 4) if (mask(i)) { s += a[i] * a[i]; c++; }
  return 20 * Math.log10(Math.sqrt(s / Math.max(1, c)) + 1e-12);
};
const peakDb = (a) => { let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i])); return 20 * Math.log10(m + 1e-12); };
const scale = (arrs, db) => { const g = Math.pow(10, db / 20); for (const a of arrs) for (let i = 0; i < a.length; i++) a[i] *= g; };
const voSpeech = rmsDb(vo, speech);
const musTarget = (voSpeech < -90 ? -18 : voSpeech - 21) + (score.level ?? 0); // (no voice at all → demo mode, fixed level) // music ~21 dB under the voice while it speaks (background, never competing)
scale([L, R], musTarget - (voSpeech < -90 ? rmsDb(L, () => true) : rmsDb(L, speech)));
if (sfxList.length) {
  // safety only: no SFX peak may come closer than 8 dB to the voice peak (levels are set per sound above)
  const voPeak = peakDb(vo);
  const sp = Math.max(peakDb(sL), peakDb(sR));
  if (sp > voPeak - 8) scale([sL, sR], voPeak - 8 - sp);
}
const gap = (i) => env[i] < 0.25 && i > SR * 3 && i < N - SR * 4;
const levelLine = `levels: VO speech ${voSpeech.toFixed(1)} dBFS · music under speech ${(rmsDb(L, speech) - voSpeech).toFixed(1)} dB rel. VO · music in gaps ${(() => { const v = rmsDb(L, gap); return v < -150 ? 'n/a (no long pauses)' : (v - voSpeech).toFixed(1) + ' dB rel. VO'; })()} · music peak ${peakDb(L).toFixed(1)} · sfx peak ${Math.max(peakDb(sL), peakDb(sR)).toFixed(1)} dBFS${unknown ? ` · ${unknown} unknown sfx kinds` : ''}`;
console.log(levelLine);
fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(path.join(outDir, 'levels.txt'), levelLine + '\n');

fs.mkdirSync(outDir, {recursive: true});
writeWav(path.join(outDir, 'music.wav'), L, R);
writeWav(path.join(outDir, 'sfx.wav'), sL, sR);
console.log(`wrote ${path.join(outDir, 'music.wav')} and sfx.wav`);
