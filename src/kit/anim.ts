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
  /** pop/land with a springy bounce (the channel's signature motion — now a real damped spring, see `spring`) */
  outBack: (x: number) => spring(x, 0.4),
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

/**
 * spring — the channel's signature motion (owner, 2026-10-20: "the popup and bounce is so good — everywhere, smooth").
 * Damped-spring 0→1 for x in 0..1: rises fast, overshoots once or twice and settles softly (lands exactly at 1).
 * bounce 0 = no overshoot (smooth), 0.35 = elegant default, 0.7 = playful.
 */
export const spring = (x: number, bounce = 0.35): number => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const zeta = Math.max(0.12, 0.75 - bounce * 0.9); // damping ratio
  const w0 = 11; // natural frequency over the 0..1 span
  const wd = w0 * Math.sqrt(Math.max(1e-4, 1 - zeta * zeta));
  const y = 1 - Math.exp(-zeta * w0 * x) * (Math.cos(wd * x) + ((zeta * w0) / wd) * Math.sin(wd * x));
  const tail = clamp01((x - 0.85) / 0.15); // guarantee an exact, motionless landing
  return y + (1 - y) * tail * tail * (3 - 2 * tail);
};

/**
 * popIn — pop-up with bounce + a touch of squash & stretch (jelly), for anything that appears: pills, icons, medals,
 * bubbles, stickers, cards. Use: transform={`translate(x y) scale(${q.sx} ${q.sy})`} opacity={q.o}. from = start scale.
 */
export const popIn = (p: number, bounce = 0.35, from = 0.3) => {
  const k = spring(clamp01(p), bounce);
  const s = from + (1 - from) * k;
  const over = s - 1; // >0 while overshooting → stretch up a little, squash on the way back
  return {s, sx: s * (1 - over * 0.35), sy: s * (1 + over * 0.35), o: clamp01(p * 4)};
};

/**
 * popRef — the REFERENCE's pop-in (references/universe-claude/MOTION.md §1, measured frame by frame 2026-11-11): ONE smooth
 * swell, no wobble, no squash — from 0.46, quadratic ease-out to 1.16 at 125 ms, then a sine glide back to 1.00 by 295 ms
 * (fitted to the measured frames: max error 0.018). Same {s, sx, sy, o} shape as popIn, so night pieces swap it in place.
 * p = (t - at) / 0.3 (a 0.25–0.3 s entrance). The extra args are ignored (kept so popIn calls convert 1:1).
 */
export const popRef = (p: number, _bounce?: number, _from?: number) => {
  const x = clamp01(p);
  const t = x * 0.3; // seconds into a 0.3 s entrance
  const s = t < 0.125 ? 0.46 + 0.7 * (1 - Math.pow(1 - t / 0.125, 2)) : 1.16 - 0.16 * ease.inOutSine(clamp01((t - 0.125) / 0.17));
  return {s, sx: s, sy: s, o: clamp01(x * 8)};
};
/** pressIn — the reference's STAMP (MOTION.md §2): from 1.64× decelerating to 1.00 in 165 ms (1.64·1.43·1.27·1.17·1.10·
 * 1.05·1.02·1.00 per 1/60 s — fitted, max error 0.008), fading in while it shrinks, then rock still. u = (t - at) / 0.165. */
export const pressIn = (u: number) => {
  const x = clamp01(u);
  return {s: 1 + 0.64 * Math.pow(1 - x, 3.7), o: clamp01(0.6 + x * 1.6)}; // clearly visible from its first (biggest) frame, as in the reference
};
/** countCurve — the reference's COUNT-UP (MOTION.md §5, 100 → 3,106 in 1.64 s): slow start that builds suspense, fast
 * middle, eases into the number (fitted: max error 1.7 % of the range). p = (t - at) / 1.64. */
export const countCurve = (p: number) => {
  const x = Math.pow(clamp01(p), 1.6), c = 2.25;
  return x < 0.5 ? Math.pow(2, c - 1) * Math.pow(x, c) : 1 - Math.pow(-2 * x + 2, c) / 2;
};
/** flyOut — the reference's EXIT (MOTION.md §4, 0:27.4): pieces fly away accelerating in ≈ 0.2 s instead of fading.
 * Returns {dx, dy, o} for a piece leaving at `out` toward (dirX, dirY) (screen fractions, e.g. (0, 1) = drops down). */
export const flyOut = (t: number, out: number | undefined, dirX = 0, dirY = 1, dur = 0.22) => {
  if (out === undefined || t < out) return {dx: 0, dy: 0, o: 1};
  const u = clamp01((t - out) / dur), k = u * u * u; // ease-in: leaves slowly then fast
  return {dx: dirX * 1100 * k, dy: dirY * 900 * k, o: 1 - clamp01((u - 0.7) / 0.3)};
};
/** pushT — the reference's camera is NEVER still (MOTION.md §3): a slow push-in ≈ 0.35 % per second from the shot's
 * start, around a focus point. <g transform={pushT(t, shotStart, cx, cy)}>…the shot's world…</g> (hosts stay outside). */
export const pushT = (t: number, start: number, cx = 960, cy = 540, rate = 0.0035) => {
  const z = 1 + rate * Math.max(0, t - start);
  return `translate(${cx} ${cy}) scale(${z}) translate(${-cx} ${-cy})`;
};

/** bob — gentle idle float for held hero objects/pills (keeps the frame alive). px amplitude, deterministic. */
export const bob = (t: number, amp = 6, period = 3.2, phase = 0) => Math.sin((t / period) * Math.PI * 2 + phase) * amp;
