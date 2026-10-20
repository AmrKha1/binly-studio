import React from 'react';
import {cueSfx} from './sfx';
import {C, GLOW} from './theme';
import {clamp01, ease, EaseFn, noise1, rand, randRange} from './anim';

// Light, emphasis and motion helpers. ELEGANT GLOW (owner, 2026-10-20): soft halos (Halo, GLOW filters) and a few
// twinkling Sparkles on the hero object / key number — never neon, never on everything. No noise.

/** 4-point sparkle star path, radius 1 (scale it). */
const STAR = 'M0 -1 C0.11 -0.14 0.14 -0.11 1 0 C0.14 0.11 0.11 0.14 0 1 C-0.11 0.14 -0.14 0.11 -1 0 C-0.14 -0.11 -0.11 -0.14 0 -1Z';

/**
 * Sparkles — a few twinkling 4-point stars around a hero object (diamond, gold, a discovery). Deterministic in t.
 * (x, y) = centre, r = spread radius, n = count (3–6 is elegant), size = biggest star radius (px).
 */
export const Sparkles: React.FC<{t: number; x: number; y: number; r: number; n?: number; size?: number; color?: string; seed?: number; p?: number; period?: number}> = ({
  t, x, y, r, n = 4, size = 22, color = C.goldLight, seed = 1, p = 1, period = 2.4,
}) => {
  if (p <= 0) return null;
  cueSfx('sparkle', `sp@${Math.round(x)},${Math.round(y)}`, true, x, {gain: 0.7});
  return (
    <g opacity={clamp01(p)} filter={GLOW.gold}>
      {Array.from({length: n}, (_, i) => {
        const a = rand(seed * 7.1 + i * 3.3) * Math.PI * 2;
        const d = r * (0.55 + 0.45 * rand(seed * 2.3 + i * 5.7));
        const ph = rand(seed + i * 1.9) * Math.PI * 2;
        const tw = 0.5 + 0.5 * Math.sin((t / period) * Math.PI * 2 + ph); // 0..1 twinkle
        const s = size * (i === 0 ? 1 : 0.45 + 0.4 * rand(seed * 4.4 + i)) * (0.55 + 0.6 * tw);
        return <path key={i} d={STAR} transform={`translate(${x + Math.cos(a) * d} ${y + Math.sin(a) * d}) scale(${s})`} fill="#FFF8E6" stroke={color} strokeWidth={1.4 / s} opacity={0.45 + 0.55 * tw} />;
      })}
    </g>
  );
};

/**
 * GlowBackdrop — THE channel background (white mode): clean white page with light pouring OUT from behind the hero
 * object: a soft radial glow + gentle sunburst rays that turn very slowly + a few faint twinkling stars. Put it first
 * (behind everything); place your object/character/title on top at (x, y).
 *   tone: 'gold' (discovery, money, treasure, wins) · 'lavender' (gems, mystery, mind, science) · 'green' (nature, life,
 *   health) · 'sky' (cool blue-grey: tech, water, space-by-day) · 'warm' (gentle peach: people, home, history)
 *   rays: number of rays (0 = no rays) · spin: degrees per second (0.6–2 is elegant) · strength 0..1.5 · p reveal.
 * Deterministic (pure function of t). Use one per shot — it IS the background, not decoration on top.
 */
export const GlowBackdrop: React.FC<{
  t: number; id: string; x?: number; y?: number; tone?: 'gold' | 'lavender' | 'green' | 'sky' | 'warm';
  rays?: number; spin?: number; strength?: number; stars?: number; p?: number; seed?: number; r?: number;
}> = ({t, id, x = 960, y = 560, tone = 'gold', rays = 16, spin = 1, strength = 1, stars = 10, p = 1, seed = 1, r = 900}) => {
  const TONES = {
    gold: {glow: C.goldLight, ray: '#FBF1D6', star: C.goldLight},
    lavender: {glow: C.lavender, ray: '#ECE6F4', star: C.theoryLight},
    green: {glow: C.evidenceTint, ray: '#E7EEE2', star: C.evidenceLight},
    sky: {glow: '#D6E2EE', ray: '#EAF0F6', star: '#8FA6BD'},
    warm: {glow: '#F3D9C9', ray: '#F8EAE1', star: C.oxTint},
  } as const;
  const T = TONES[tone];
  const k = clamp01(p) * strength * (tone === 'gold' ? 0.7 : 1); // gold reads strong on white: keep it airy
  const L = 2600; // ray length: always past the frame corners
  const rot = t * spin;
  const half = (Math.PI / Math.max(1, rays)) * 0.42; // ray half-angle: rays fill ~42% of the circle (soft, airy)
  return (
    <g>
      <rect x={-200} y={-200} width={2320} height={1480} fill={C.paper} />
      <radialGradient id={`${id}-glow`} cx={x} cy={y} r={r} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={T.glow} stopOpacity={0.7 * k} />
        <stop offset="0.3" stopColor={T.glow} stopOpacity={0.28 * k} />
        <stop offset="1" stopColor={T.glow} stopOpacity={0} />
      </radialGradient>
      <radialGradient id={`${id}-rayfade`} cx={x} cy={y} r={r * 1.25} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
        <stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0.55} />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
      </radialGradient>
      <mask id={`${id}-raymask`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={2320} height={1480}>
        <rect x={-200} y={-200} width={2320} height={1480} fill={`url(#${id}-rayfade)`} />
      </mask>
      {rays > 0 && (
        <g mask={`url(#${id}-raymask)`} opacity={0.7 * k}>
          <g transform={`translate(${x} ${y}) rotate(${rot})`}>
            {Array.from({length: rays}, (_, i) => {
              const a = (i / rays) * Math.PI * 2;
              return <path key={i} d={`M0 0 L${Math.cos(a - half) * L} ${Math.sin(a - half) * L} L${Math.cos(a + half) * L} ${Math.sin(a + half) * L} Z`} fill={T.ray} />;
            })}
          </g>
        </g>
      )}
      <circle cx={x} cy={y} r={r} fill={`url(#${id}-glow)`} />
      {stars > 0 && (
        <g opacity={k}>
          {Array.from({length: stars}, (_, i) => {
            const sx = 120 + rand(seed * 3.1 + i * 7.7) * 1680;
            const sy = 90 + rand(seed * 5.3 + i * 2.9) * 900;
            const tw = 0.5 + 0.5 * Math.sin(t * (1.6 + rand(seed + i) * 1.2) + i * 2.1);
            const sz = (5 + rand(seed * 9.1 + i) * 9) * (0.6 + 0.6 * tw);
            return <path key={i} d={STAR} transform={`translate(${sx} ${sy}) scale(${sz})`} fill={T.star} opacity={0.18 + 0.4 * tw} />;
          })}
        </g>
      )}
    </g>
  );
};

/**
 * GlowFloor — the "stage" background (white mode): clean white sky, a softly glowing horizon line, and a perspective
 * grid floor whose lines fade toward the horizon (objects, bars, characters stand ON it). A few faint stars in the sky.
 *   horizon: y of the horizon line (560–700 typical) · tone: glow colour of the horizon · drift: floor scroll speed
 *   (px/s toward the viewer, 0 = still; 20–60 = gentle travel) · p reveal. Deterministic in t. Use instead of GlowBackdrop.
 */
export const GlowFloor: React.FC<{
  t: number; id: string; horizon?: number; tone?: 'gold' | 'lavender' | 'green' | 'sky' | 'warm';
  drift?: number; strength?: number; stars?: number; p?: number; seed?: number; vx?: number;
}> = ({t, id, horizon = 640, tone = 'lavender', drift = 0, strength = 1, stars = 12, p = 1, seed = 2, vx = 960}) => {
  const TONES = {gold: C.goldLight, lavender: C.theoryLight, green: C.evidenceLight, sky: '#8FA6BD', warm: C.oxLight} as const;
  const glow = TONES[tone];
  const k = clamp01(p) * strength;
  const H0 = horizon;
  const floorH = 1080 - H0;
  // radial lines from a vanishing point far above the horizon centre → floor perspective
  const n = 24;
  const lines = Array.from({length: n + 1}, (_, i) => {
    const xb = vx + (i - n / 2) * 260; // x at the bottom edge of the frame
    const xt = vx + (i - n / 2) * 34; // x at the horizon
    return <line key={i} x1={xt} y1={H0} x2={xb} y2={1080 + 40} />;
  });
  // horizontal lines: perspective spacing (denser near the horizon), scrolling toward the viewer with drift
  const rows = 14;
  const ph = ((t * drift) / 120) % 1;
  const hl = Array.from({length: rows}, (_, j) => {
    const u = (j + ph) / rows; // 0 at horizon → 1 at bottom
    const y = H0 + floorH * Math.pow(u, 2.1);
    return <line key={j} x1={-200} y1={y} x2={2120} y2={y} opacity={0.25 + 0.75 * u} />;
  });
  return (
    <g>
      <rect x={-200} y={-200} width={2320} height={1480} fill={C.paper} />
      <linearGradient id={`${id}-sky`} x1="0" y1={H0 - 420} x2="0" y2={H0} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={glow} stopOpacity={0} />
        <stop offset="1" stopColor={glow} stopOpacity={0.16 * k} />
      </linearGradient>
      <rect x={-200} y={H0 - 420} width={2320} height={420} fill={`url(#${id}-sky)`} />
      <linearGradient id={`${id}-floorfade`} x1="0" y1={H0} x2="0" y2={1080} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.15} />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity={1} />
      </linearGradient>
      <mask id={`${id}-fm`} maskUnits="userSpaceOnUse" x={-200} y={H0} width={2320} height={floorH + 200}>
        <rect x={-200} y={H0} width={2320} height={floorH + 200} fill={`url(#${id}-floorfade)`} />
      </mask>
      <rect x={-200} y={H0} width={2320} height={floorH + 200} fill={glow} opacity={0.07 * k} />
      <g mask={`url(#${id}-fm)`} stroke={glow} strokeWidth={2.2} opacity={0.55 * k}>
        {lines}
        {hl}
      </g>
      <rect x={-200} y={H0 - 3} width={2320} height={6} rx={3} fill={glow} opacity={k} filter={`url(#${id}-hz)`} />
      <rect x={-200} y={H0 - 1} width={2320} height={2} fill="#FFFFFF" opacity={0.9 * k} />
      <filter id={`${id}-hz`} x="-10%" y="-800%" width="120%" height="1700%" colorInterpolationFilters="sRGB">
        <feDropShadow dx={0} dy={0} stdDeviation={6} floodColor={glow} floodOpacity={1} />
        <feDropShadow dx={0} dy={0} stdDeviation={22} floodColor={glow} floodOpacity={0.8} />
        <feDropShadow dx={0} dy={0} stdDeviation={60} floodColor={glow} floodOpacity={0.45} />
      </filter>
      {stars > 0 && (
        <g opacity={k}>
          {Array.from({length: stars}, (_, i) => {
            const sx = 100 + rand(seed * 3.7 + i * 6.1) * 1720;
            const sy = 70 + rand(seed * 1.9 + i * 4.3) * (H0 - 160);
            const tw = 0.5 + 0.5 * Math.sin(t * (1.5 + rand(seed + i) * 1.3) + i * 1.7);
            const sz = (5 + rand(seed * 7.3 + i) * 9) * (0.6 + 0.6 * tw);
            return <path key={i} d={STAR} transform={`translate(${sx} ${sy}) scale(${sz})`} fill={glow} opacity={0.15 + 0.4 * tw} />;
          })}
        </g>
      )}
    </g>
  );
};

/** Halo — a soft radial glow behind a hero object (lavender for gems, gold for treasure/discovery). origin = centre. */
export const Halo: React.FC<{id: string; x: number; y: number; r: number; color?: string; p?: number; strength?: number}> = ({id, x, y, r, color = C.lavender, p = 1, strength = 1}) =>
  p <= 0 ? null : (
    <g opacity={clamp01(p) * strength}>
      <radialGradient id={id}>
        <stop offset="0" stopColor={color} stopOpacity={0.95} />
        <stop offset="0.45" stopColor={color} stopOpacity={0.45} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
    </g>
  );

/** Flat light pool: concentric low-opacity discs (no gradients → no banding). origin = centre. */
export const LightPool: React.FC<{x: number; y: number; r: number; color?: string; strength?: number; sy?: number}> = ({x, y, r, color = C.lamp, strength = 1, sy = 1}) => (
  <g transform={`translate(${x} ${y}) scale(1 ${sy})`} fill={color}>
    {[1, 0.78, 0.58, 0.4].map((k, i) => (
      <circle key={i} r={r * k} opacity={0.07 * strength} />
    ))}
  </g>
);

/** Flat light shaft (window/door beam): a polygon from a source edge widening downward. */
export const LightShaft: React.FC<{x1: number; x2: number; y: number; dx: number; len: number; spread?: number; color?: string; strength?: number}> = ({
  x1,
  x2,
  y,
  dx,
  len,
  spread = 0.35,
  color = C.paperLight,
  strength = 1,
}) => {
  const w = x2 - x1;
  return (
    <g fill={color}>
      <path d={`M${x1} ${y} L${x2} ${y} L${x2 + dx + w * spread} ${y + len} L${x1 + dx - w * spread} ${y + len} Z`} opacity={0.16 * strength} />
      <path d={`M${x1 + w * 0.2} ${y} L${x2 - w * 0.2} ${y} L${x2 + dx} ${y + len} L${x1 + dx} ${y + len} Z`} opacity={0.12 * strength} />
    </g>
  );
};

/** Soft flat drop shadow ellipse (ground contact). origin = contact point. */
export const GroundShadow: React.FC<{x: number; y: number; w: number; h?: number; o?: number; color?: string}> = ({x, y, w, h, o = 0.18, color = C.ink}) => (
  <ellipse cx={x} cy={y} rx={w / 2} ry={(h ?? w * 0.12) / 2} fill={color} opacity={o} />
);

/** Flat vignette: four soft-edged dark bands built from stepped rects (no gradient banding). */
export const Vignette: React.FC<{strength?: number; color?: string; w?: number; h?: number}> = ({strength = 1, color = C.ink, w = 1920, h = 1080}) => {
  const steps = 6;
  return (
    <g fill="none" stroke={color} pointerEvents="none">
      {Array.from({length: steps}, (_, i) => {
        const sw = 60 + i * 55;
        return <rect key={i} x={-sw / 2} y={-sw / 2} width={w + sw} height={h + sw} strokeWidth={sw} opacity={(0.05 * strength) / (1 + i * 0.15)} />;
      })}
    </g>
  );
};

/** Glow ring pulse around a point (emphasis). p 0→1 = one pulse. */
export const Pulse: React.FC<{x: number; y: number; r: number; p: number; color?: string; width?: number}> = ({x, y, r, p, color = C.oxblood, width = 6}) => {
  if (p <= 0 || p >= 1) return null;
  const k = ease.out(p);
  return <circle cx={x} cy={y} r={r * (0.6 + 0.8 * k)} fill="none" stroke={color} strokeWidth={width * (1 - k) + 1} opacity={1 - k} />;
};

/** Repeating gentle pulse (attention marker) driven by t. */
export const Beacon: React.FC<{x: number; y: number; r: number; t: number; period?: number; color?: string}> = ({x, y, r, t, period = 1.6, color = C.oxblood}) => {
  const p = ((t % period) + period) % period / period;
  return (
    <g>
      <Pulse x={x} y={y} r={r} p={p} color={color} />
      <circle cx={x} cy={y} r={r * 0.32} fill={color} />
    </g>
  );
};

/**
 * Draw-on wrapper for strokes: children paths must set pathLength={1}. Simplest use is the `d` prop:
 * <DrawPath d="M0 0 C..." p={p} stroke={C.ink} width={5}/>
 */
export const DrawPath: React.FC<{d: string; p: number; stroke?: string; width?: number; fill?: string; dash?: boolean; cap?: 'round' | 'butt'; o?: number; fn?: EaseFn}> = ({
  d,
  p,
  stroke = C.ink,
  width = 5,
  fill = 'none',
  dash = false,
  cap = 'round',
  o = 1,
  fn = ease.inOut,
}) => {
  if (p <= 0) return null;
  const k = fn(clamp01(p));
  if (dash) {
    // dashed line that "grows": reveal with a mask-free trick (clip by dash offset on a solid copy)
    return (
      <g opacity={o}>
        <mask id={`dm${d.length}_${Math.round(width)}_${d.charCodeAt(1) || 0}`}>
          <path d={d} pathLength={1} stroke="#fff" strokeWidth={width + 4} fill="none" strokeDasharray="1 1" strokeDashoffset={1 - k} />
        </mask>
        <path d={d} stroke={stroke} strokeWidth={width} fill="none" strokeDasharray={`${width * 2.4} ${width * 1.8}`} strokeLinecap={cap} mask={`url(#dm${d.length}_${Math.round(width)}_${d.charCodeAt(1) || 0})`} />
      </g>
    );
  }
  return <path d={d} pathLength={1} stroke={stroke} strokeWidth={width} fill={fill} strokeDasharray="1 1" strokeDashoffset={1 - k} strokeLinecap={cap} strokeLinejoin="round" opacity={o} />;
};

/** Pop-in transform: scales from 0 with a gentle settle. Wrap any element. origin = (x,y). */
export const Pop: React.FC<{x: number; y: number; p: number; from?: number; children?: React.ReactNode; r?: number}> = ({x, y, p, from = 0, children, r = 0}) => {
  if (p <= 0) return null;
  cueSfx('pop', `pp@${Math.round(x)},${Math.round(y)}`, true, x);
  const s = from + (1 - from) * ease.outBack(clamp01(p));
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={clamp01(p * 4)}>
      {children}
    </g>
  );
};

/** Slide+fade in from an offset (dx,dy). Wrap any element positioned in absolute coords. */
export const SlideIn: React.FC<{p: number; dx?: number; dy?: number; children?: React.ReactNode; fade?: boolean}> = ({p, dx = 0, dy = 40, children, fade = true}) => {
  if (p <= 0) return null;
  const k = ease.outQuint(clamp01(p));
  return (
    <g transform={`translate(${dx * (1 - k)} ${dy * (1 - k)})`} opacity={fade ? clamp01(p * 2) : 1}>
      {children}
    </g>
  );
};

/** Reveal children through a rectangle that grows from one side (wipe-on). Needs a unique id. */
export const WipeReveal: React.FC<{id: string; x: number; y: number; w: number; h: number; p: number; dir?: 'right' | 'left' | 'down' | 'up'; children?: React.ReactNode}> = ({id, x, y, w, h, p, dir = 'right', children}) => {
  if (p <= 0) return null;
  const k = ease.inOut(clamp01(p));
  const r =
    dir === 'right' ? {x, y, width: w * k, height: h} : dir === 'left' ? {x: x + w * (1 - k), y, width: w * k, height: h} : dir === 'down' ? {x, y, width: w, height: h * k} : {x, y: y + h * (1 - k), width: w, height: h * k};
  return (
    <g>
      <clipPath id={id}>
        <rect {...r} />
      </clipPath>
      <g clipPath={`url(#${id})`}>{children}</g>
    </g>
  );
};

/**
 * Deterministic drifting particles (dust in light, spores, embers, "miasma" specks, bubbles).
 * Particles wrap inside the box; motion = velocity + noise wobble. Pure function of t.
 */
export const Particles: React.FC<{
  t: number;
  x: number;
  y: number;
  w: number;
  h: number;
  n?: number;
  seed?: number;
  size?: [number, number];
  color?: string;
  opacity?: [number, number];
  vx?: number; // px/s
  vy?: number; // px/s (negative = rising)
  wobble?: number; // px
  shape?: 'dot' | 'ring' | 'blob';
  twinkle?: boolean;
}> = ({t, x, y, w, h, n = 40, seed = 1, size = [3, 9], color = C.paperLight, opacity = [0.25, 0.7], vx = 6, vy = -10, wobble = 18, shape = 'dot', twinkle = false}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const s = seed * 1000 + i * 17.3;
      const px = ((rand(s) * w + vx * t * randRange(s + 1, 0.6, 1.4) + noise1(t * 0.4 + i, seed) * wobble) % w + w) % w;
      const py = ((rand(s + 2) * h + vy * t * randRange(s + 3, 0.6, 1.4) + noise1(t * 0.35 + i * 1.7, seed + 3) * wobble) % h + h) % h;
      const r = randRange(s + 4, size[0], size[1]);
      let o = randRange(s + 5, opacity[0], opacity[1]);
      if (twinkle) o *= 0.55 + 0.45 * Math.sin(t * randRange(s + 6, 1.5, 3.5) + i);
      // fade near box edges so wrapping is invisible
      const edge = Math.min(px / 40, (w - px) / 40, py / 40, (h - py) / 40, 1);
      o *= clamp01(edge);
      if (shape === 'ring') return <circle key={i} cx={x + px} cy={y + py} r={r} fill="none" stroke={color} strokeWidth={Math.max(1.5, r * 0.25)} opacity={o} />;
      if (shape === 'blob') return <ellipse key={i} cx={x + px} cy={y + py} rx={r * 1.4} ry={r} fill={color} opacity={o} transform={`rotate(${rand(s + 7) * 180} ${x + px} ${y + py})`} />;
      return <circle key={i} cx={x + px} cy={y + py} r={r} fill={color} opacity={o} />;
    })}
  </g>
);

/** Rising wisps of steam/smoke: soft flat S-curves that rise, sway and fade. origin = source centre. */
export const Steam: React.FC<{t: number; x: number; y: number; w?: number; h?: number; n?: number; color?: string; seed?: number; strength?: number}> = ({
  t,
  x,
  y,
  w = 200,
  h = 320,
  n = 5,
  color = C.paperLight,
  seed = 3,
  strength = 1,
}) => (
  <g fill="none" stroke={color} strokeLinecap="round">
    {Array.from({length: n}, (_, i) => {
      const period = randRange(seed + i, 3.2, 4.6);
      const ph = (((t + rand(seed * 9 + i) * period) % period) + period) % period / period; // 0..1 life
      const bx = x - w / 2 + (w * (i + 0.5)) / n + noise1(t * 0.5 + i, seed) * 10;
      const rise = ph * h;
      const amp = 18 + ph * 26;
      const y0 = y - rise;
      const len = h * 0.42;
      const sway = Math.sin(t * 1.3 + i) * amp;
      const d = `M${bx} ${y0} C${bx + sway} ${y0 - len * 0.33} ${bx - sway} ${y0 - len * 0.66} ${bx + sway * 0.5} ${y0 - len}`;
      const o = Math.sin(Math.PI * ph) * 0.42 * strength;
      return <path key={i} d={d} strokeWidth={14 + ph * 16} opacity={o} />;
    })}
  </g>
);

/** Candle / torch flame (flat, flickering). origin = base of flame. */
export const Flame: React.FC<{t: number; x: number; y: number; s?: number; seed?: number; glow?: boolean}> = ({t, x, y, s = 1, seed = 1, glow = true}) => {
  const f = 1 + noise1(t * 8, seed) * 0.12;
  const lean = noise1(t * 3, seed + 2) * 6;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {glow && <LightPool x={0} y={-30} r={120 * f} color={C.lamp} strength={1.1} />}
      <path d={`M0 0 C-22 -6 -20 -40 ${lean} ${-86 * f} C20 -40 22 -6 0 0 Z`} fill={C.fire} />
      <path d={`M0 -4 C-11 -8 -10 -30 ${lean * 0.6} ${-56 * f} C10 -30 11 -8 0 -4 Z`} fill={C.lamp} />
      <ellipse cx={0} cy={-12} rx={5} ry={9} fill={C.paperLight} opacity={0.85} />
    </g>
  );
};

/** Concentric ripples (water drop, sound, signal). p cycles via t. origin = centre. */
export const Ripples: React.FC<{t: number; x: number; y: number; r: number; n?: number; period?: number; color?: string; sy?: number; width?: number}> = ({t, x, y, r, n = 3, period = 2.4, color = C.ink, sy = 1, width = 4}) => (
  <g transform={`translate(${x} ${y}) scale(1 ${sy})`} fill="none" stroke={color}>
    {Array.from({length: n}, (_, i) => {
      const p = ((((t / period + i / n) % 1) + 1) % 1);
      return <circle key={i} r={r * p} strokeWidth={width * (1 - p) + 0.5} opacity={(1 - p) * 0.8} />;
    })}
  </g>
);

export type WeatherKind = 'rain' | 'snow' | 'fog' | 'wind' | 'leaves';
const wrapM = (v: number, m: number) => ((v % m) + m) % m;
const LEAF_COLS = [C.caution, C.oxLight, C.cautionLight, C.evidenceLight, C.woodLight];

/**
 * Weather overlay drawn over any scene (deterministic, gently animated). Box defaults to the full frame
 * (origin = box top-left, clipped). kind: rain (slanted streaks) · snow (swaying flakes) · fog (flat
 * translucent drifting bands) · wind (curling streaks) · leaves (tumbling flat leaves). strength scales count/opacity.
 */
export const Weather: React.FC<{t: number; kind: WeatherKind; strength?: number; seed?: number; x?: number; y?: number; w?: number; h?: number; color?: string}> = ({
  t,
  kind,
  strength = 1,
  seed = 1,
  x = 0,
  y = 0,
  w = 1920,
  h = 1080,
  color,
}) => {
  const n = (base: number) => Math.max(1, Math.round(base * strength * Math.max(0.3, (w * h) / (1920 * 1080))));
  const ids = Array.from({length: kind === 'rain' ? n(120) : kind === 'snow' ? n(90) : kind === 'wind' ? n(16) : kind === 'leaves' ? n(26) : 4}, (_, i) => i);
  const id = `wx-${kind}-${Math.round(x)}-${Math.round(y)}-${Math.round(w)}-${Math.round(h)}`;
  let body: React.ReactNode = null;
  if (kind === 'rain') {
    body = (
      <g stroke={color ?? C.water} strokeLinecap="round" strokeWidth={3}>
        {ids.map((i) => {
          const s = seed * 1000 + i * 13.7;
          const sp = randRange(s, 1100, 1500);
          const len = randRange(s + 1, 34, 60);
          const px = x + wrapM(rand(s + 2) * w - t * sp * 0.2, w + 40);
          const py = y + wrapM(rand(s + 3) * (h + len) + t * sp, h + len) - len;
          return <line key={i} x1={px} y1={py} x2={px - len * 0.2} y2={py + len} opacity={randRange(s + 4, 0.35, 0.75) * Math.min(1, strength)} />;
        })}
      </g>
    );
  } else if (kind === 'snow') {
    body = (
      <g fill={color ?? C.paperLight}>
        {ids.map((i) => {
          const s = seed * 1000 + i * 11.3;
          const r = randRange(s, 3, 7.5);
          const px = x + wrapM(rand(s + 1) * w + noise1(t * 0.5 + i, seed) * 40 + t * 12, w);
          const py = y + wrapM(rand(s + 2) * (h + 20) + t * randRange(s + 3, 50, 110) * (r / 6), h + 20) - 10;
          return <circle key={i} cx={px} cy={py} r={r} opacity={randRange(s + 4, 0.65, 0.95)} />;
        })}
      </g>
    );
  } else if (kind === 'fog') {
    body = (
      <g fill={color ?? C.paperLight}>
        {ids.map((i) => {
          const yb = y + h * (0.3 + i * 0.17);
          const bh = h * 0.14;
          const P = Math.max(600, w * 0.7);
          const off = t * (18 + i * 9) * (i % 2 ? -1 : 1) + rand(seed + i) * P;
          const top: string[] = [];
          const bot: string[] = [];
          for (let xx = x; xx <= x + w + 40; xx += 40) {
            const k = ((xx + off) / P) * Math.PI * 2;
            top.push(`${xx} ${yb + Math.sin(k) * bh * 0.35 + Math.sin(k * 2 + i) * bh * 0.12}`);
            bot.unshift(`${xx} ${yb + bh + Math.sin(k * 1.5 + 1) * bh * 0.25}`);
          }
          return <path key={i} d={`M${top.join(' L')} L${bot.join(' L')} Z`} opacity={0.22 * Math.min(1.6, strength)} />;
        })}
      </g>
    );
  } else if (kind === 'wind') {
    body = (
      <g fill="none" stroke={color ?? C.paperLight} strokeLinecap="round" strokeWidth={4}>
        {ids.map((i) => {
          const s = seed * 1000 + i * 7.9;
          const per = randRange(s, 1.6, 2.6);
          const ph = wrapM(t / per + rand(s + 1), 1);
          const cyc = Math.floor(t / per + rand(s + 1));
          const len = randRange(s + 2, 120, 240);
          const px = x + rand(s + cyc * 3.1) * (w - len) + ph * 260 - 130;
          const py = y + 30 + rand(s + cyc * 5.7 + 1) * (h - 60);
          const curl = rand(s + 4) > 0.5;
          const d = curl
            ? `M${px} ${py} Q${px + len * 0.5} ${py - 14} ${px + len * 0.8} ${py} Q${px + len} ${py + 14} ${px + len * 0.9} ${py + 22} Q${px + len * 0.78} ${py + 20} ${px + len * 0.84} ${py + 10}`
            : `M${px} ${py} Q${px + len * 0.5} ${py - 12} ${px + len} ${py}`;
          return <path key={i} d={d} opacity={Math.sin(Math.PI * ph) * 0.7 * Math.min(1, strength)} />;
        })}
      </g>
    );
  } else {
    body = (
      <g>
        {ids.map((i) => {
          const s = seed * 1000 + i * 9.1;
          const vx = randRange(s, 80, 160);
          const vy = randRange(s + 1, 40, 80);
          const px = x + wrapM(rand(s + 2) * w + t * vx, w + 80) - 40;
          const py = y + wrapM(rand(s + 3) * h + t * vy + Math.sin(t * 1.7 + i) * 26, h + 80) - 40;
          const rot = t * randRange(s + 4, 60, 160) + rand(s + 5) * 360;
          const flipX = Math.cos(t * randRange(s + 6, 2, 4) + i);
          const c = color ?? LEAF_COLS[i % LEAF_COLS.length];
          return (
            <g key={i} transform={`translate(${px} ${py}) rotate(${rot}) scale(${(0.25 + 0.75 * Math.abs(flipX)) * 1.4} 1.4)`}>
              <path d="M0 -16 Q13 -3 0 17 Q-13 -3 0 -16 Z" fill={c} />
              <line x1={0} y1={-12} x2={0} y2={20} stroke={C.inkSoft} strokeWidth={2.5} opacity={0.45} />
            </g>
          );
        })}
      </g>
    );
  }
  return (
    <g>
      <clipPath id={id}>
        <rect x={x} y={y} width={w} height={h} />
      </clipPath>
      <g clipPath={`url(#${id})`}>{body}</g>
    </g>
  );
};
