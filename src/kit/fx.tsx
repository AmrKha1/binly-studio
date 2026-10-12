import React from 'react';
import {C} from './theme';
import {clamp01, ease, EaseFn, noise1, rand, randRange} from './anim';

// Light, emphasis and motion helpers. Flat only: no blur, no gradients over large areas, no noise.

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
