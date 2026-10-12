// Deterministic animation maths. EVERYTHING is a pure function of time t (seconds, absolute
// video time) so any frame renders identically in isolation (seek-safe, chunk-safe).
// Never use Math.random(), Date, setTimeout or React state for animation.

export type EaseFn = (x: number) => number;

export const clamp = (x: number, lo = 0, hi = 1) => (x < lo ? lo : x > hi ? hi : x);
export const clamp01 = (x: number) => clamp(x, 0, 1);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export const ease = {
  linear: (x: number) => x,
  inOut: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x: number) => 1 - Math.pow(1 - x, 3),
  in: (x: number) => x * x * x,
  outQuint: (x: number) => 1 - Math.pow(1 - x, 5),
  inOutQuint: (x: number) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2),
  inOutSine: (x: number) => -(Math.cos(Math.PI * x) - 1) / 2,
  outSine: (x: number) => Math.sin((x * Math.PI) / 2),
  /** gentle settle (~4% overshoot) — ONLY for things that "land" (stamps, pins, a key object) */
  outBack: (x: number) => {
    const c1 = 1.2;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },
  /** soft elastic settle for pops, tiny overshoot then rest */
  outElastic: (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin(((x * 10 - 0.75) * 2 * Math.PI) / 4.5) * 0.35 + 1),
} satisfies Record<string, EaseFn>;

/** 0 → 1 between times a and b, eased and clamped. */
export const ramp = (t: number, a: number, b: number, fn: EaseFn = ease.inOut) => fn(clamp01((t - a) / (b - a || 1e-6)));

/** 1 → 0 between a and b. */
export const unramp = (t: number, a: number, b: number, fn: EaseFn = ease.inOut) => 1 - ramp(t, a, b, fn);

/** Piecewise keyframes [[time, value], ...] with easing between each pair. */
export const keys = (t: number, kf: [number, number][], fn: EaseFn = ease.inOut) => {
  if (t <= kf[0][0]) return kf[0][1];
  for (let i = 0; i < kf.length - 1; i++) {
    const [t0, v0] = kf[i];
    const [t1, v1] = kf[i + 1];
    if (t <= t1) return lerp(v0, v1, fn(clamp01((t - t0) / (t1 - t0 || 1e-6))));
  }
  return kf[kf.length - 1][1];
};

/** Visibility window: fades in over `fi` s from a, out over `fo` s ending at b. */
export const win = (t: number, a: number, b: number, fi = 0.4, fo = 0.4) =>
  Math.min(ramp(t, a, a + fi, ease.inOutSine), 1 - ramp(t, b - fo, b, ease.inOutSine));

/** Smooth deterministic oscillation (idle breathing, floating). */
export const drift = (t: number, period: number, amp: number, phase = 0) => Math.sin((t / period) * Math.PI * 2 + phase) * amp;

/** Stagger: progress of item i of n, items start `gap` s apart from `a`, each takes `dur` s. */
export const stagger = (t: number, a: number, i: number, gap: number, dur: number, fn: EaseFn = ease.out) => ramp(t, a + i * gap, a + i * gap + dur, fn);

/** Deterministic hash → [0,1). Use instead of Math.random: rand(seed), rand(i * 7.13 + 2). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
/** Deterministic value in [lo, hi). */
export const randRange = (seed: number, lo: number, hi: number) => lo + rand(seed) * (hi - lo);

/** Smooth 1-D value noise in [-1,1] (deterministic) — for organic wobble, flicker, drifting particles. */
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(rand(i + seed * 101.3) * 2 - 1, rand(i + 1 + seed * 101.3) * 2 - 1, u);
};

/** Camera keyframes [time, cx, cy, zoom, rotationDeg?]. Zoom is interpolated in log space (even feel). */
export type CamKey = [number, number, number, number, number?];
export type CamState = {cx: number; cy: number; z: number; r: number};
export const camAt = (t: number, kf: CamKey[], fn: EaseFn = ease.inOut): CamState => {
  const at = (k: CamKey) => ({cx: k[1], cy: k[2], z: k[3], r: k[4] ?? 0});
  if (t <= kf[0][0]) return at(kf[0]);
  for (let i = 0; i < kf.length - 1; i++) {
    const a = kf[i];
    const b = kf[i + 1];
    if (t <= b[0]) {
      const k = fn(clamp01((t - a[0]) / (b[0] - a[0] || 1e-6)));
      return {
        cx: lerp(a[1], b[1], k),
        cy: lerp(a[2], b[2], k),
        z: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), k)),
        r: lerp(a[4] ?? 0, b[4] ?? 0, k),
      };
    }
  }
  return at(kf[kf.length - 1]);
};

/** Mix two hex colours (k=0 → a, k=1 → b). Returns rgb(). */
export const mixHex = (a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const m = (s: number) => Math.round(lerp(ch(pa, s), ch(pb, s), clamp01(k)));
  return `rgb(${m(16)},${m(8)},${m(0)})`;
};

/** Typewriter: how many characters of `text` are visible at time t (chars per second). */
export const typeOn = (t: number, a: number, text: string, cps = 28) => text.slice(0, Math.max(0, Math.min(text.length, Math.floor((t - a) * cps))));

/**
 * Exact number count-up. `value` is the EXACT string spoken (e.g. "0.061", "505,000", "98").
 * Returns a string with the same formatting that reaches the exact string at p = 1.
 */
export const countUp = (value: string, p: number) => {
  if (p >= 1) return value;
  const m = value.match(/-?[\d,]*\.?\d+/);
  if (!m) return value;
  const raw = m[0];
  const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
  const hasComma = raw.includes(',');
  const num = parseFloat(raw.replace(/,/g, ''));
  const cur = num * clamp01(p);
  let s = cur.toFixed(decimals);
  if (hasComma) {
    const [i, d] = s.split('.');
    s = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : '');
  }
  return value.replace(raw, s);
};

/** Seconds → frame at 60 fps (for Remotion APIs that want frames). */
export const sec = (s: number, fps = 60) => Math.round(s * fps);
