import React from 'react';
import {C} from './theme';
import {clamp01, drift, lerp, noise1, rand, randRange} from './anim';
import {Flame, LightPool, LightShaft, Particles, Steam} from './fx';

// Environments + props for staging scenes (Binly Warm Editorial look).
// Flat vector only: colour blocking, flat shade shapes on the side away from light (upper-left light),
// stepped bands instead of gradients, low-opacity flat shapes for light. Everything is a pure function
// of props; idle life comes from `t`; variation from `seed`.
//
// Conventions
//  - Environments fill a 1920×1080 frame (origin = top-left, s = 1) and overscan ~400px left/right and
//    below for camera parallax. The character floor line of interiors is ENV_FLOOR (y = 820).
//  - Props: origin = base / bottom-centre unless the JSDoc says otherwise. Place with x, y, s, flip.

// ------------------------------------------------------------------ colour helpers

const rgbOf = (c: string): [number, number, number] => {
  if (c[0] === '#') {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = c.match(/\d+/g);
  return m ? [+m[0], +m[1], +m[2]] : [0, 0, 0];
};
/** Mix two colours (hex or rgb()) → hex. Chainable (unlike mixHex). k=0 → a, k=1 → b. */
export const mixC = (a: string, b: string, k: number): string => {
  const A = rgbOf(a);
  const B = rgbOf(b);
  const h = (i: number) => Math.round(lerp(A[i], B[i], clamp01(k))).toString(16).padStart(2, '0');
  return '#' + h(0) + h(1) + h(2);
};
const dk = (c: string, k = 0.2) => mixC(c, C.ink, k);
const lt = (c: string, k = 0.25) => mixC(c, C.paperLight, k);

/** Time-of-day / weather tone used by skies, landscapes and windows. */
export type Tone = 'day' | 'dusk' | 'night' | 'overcast';
/** Parallax layer. far = atmospheric, simple silhouettes; near = detailed. */
export type Layer = 'far' | 'mid' | 'near';
const FAR: Record<Layer, number> = {far: 1, mid: 0.5, near: 0};

/** Re-tint a material colour for a tone; `far` 0..1 adds atmospheric perspective (mix toward the sky). */
export const toned = (c: string, tone: Tone = 'day', far = 0): string => {
  switch (tone) {
    case 'dusk':
      return mixC(mixC(c, C.theory, 0.22), C.dusk, far * 0.45);
    case 'night':
      return mixC(mixC(c, C.night, 0.6), C.slate, far * 0.35);
    case 'overcast':
      return mixC(mixC(c, C.stone, 0.25), C.paperShade, far * 0.45);
    default:
      return mixC(c, C.sky, far * 0.55);
  }
};

/** Character floor line used by every interior. */
export const ENV_FLOOR = 820;
const FL = ENV_FLOOR;
const X0 = -400;
const X1 = 2320;
const YB = 1500;

type Place = {x?: number; y?: number; s?: number; flip?: boolean};
const tf = ({x = 0, y = 0, s = 1, flip}: Place) => `translate(${x} ${y}) scale(${flip ? -s : s} ${s})`;
const pick = <T,>(arr: T[], seed: number): T => arr[Math.floor(rand(seed) * arr.length) % arr.length];
const BRASS = mixC(C.caution, C.wood, 0.35);
const IRON = C.inkLift;
/** Muted book-spine / cloth palette (all inside the brand families). */
export const BOOK_COLORS = [
  mixC(C.oxDeep, C.wood, 0.25),
  mixC(C.evidence, C.wood, 0.3),
  mixC(C.theory, C.wood, 0.25),
  mixC(C.caution, C.wood, 0.4),
  C.woodLight,
  C.stoneDark,
  C.boneShade,
  C.inkLift,
  C.slate,
];

// ------------------------------------------------------------------ SKY

const SKY_BANDS: Record<Tone, string[]> = {
  day: [mixC(C.sky, C.water, 0.24), mixC(C.sky, C.water, 0.16), mixC(C.sky, C.water, 0.08), C.sky, mixC(C.sky, C.paperLight, 0.5)],
  dusk: [mixC(C.theory, C.dusk, 0.38), mixC(C.theoryLight, C.dusk, 0.5), mixC(C.oxTint, C.dusk, 0.5), C.dusk, mixC(C.dusk, C.cautionTint, 0.6)],
  night: [mixC(C.night, C.ink, 0.45), C.night, mixC(C.night, C.slate, 0.3), mixC(C.night, C.slate, 0.58), mixC(C.slate, C.theory, 0.15)],
  overcast: [mixC(C.stone, C.slate, 0.25), mixC(C.stone, C.slate, 0.12), C.stone, mixC(C.stone, C.paperShade, 0.5), C.paperShade],
};
/** The 5 stepped sky colours (top → horizon) for a tone. */
export const skyBands = (tone: Tone = 'day') => SKY_BANDS[tone];
const BAND_AT = [0, 0.36, 0.6, 0.78, 0.91];

const CLOUD_COL: Record<Tone, [string, string, number]> = {
  day: [C.paperLight, mixC(C.paperLight, C.water, 0.2), 1],
  dusk: [mixC(C.oxTint, C.cautionTint, 0.5), mixC(C.theoryLight, C.oxTint, 0.45), 1],
  night: [mixC(C.slate, C.night, 0.25), mixC(C.night, C.ink, 0.2), 0.85],
  overcast: [mixC(C.paperShade, C.stone, 0.25), C.stone, 1],
};

const sparkle = (x: number, y: number, R: number) => `M${x} ${y - R} Q${x} ${y} ${x + R} ${y} Q${x} ${y} ${x} ${y + R} Q${x} ${y} ${x - R} ${y} Q${x} ${y} ${x} ${y - R} Z`;

/** Twinkling star field (seeded). Box x,y,w,h. */
export const Stars: React.FC<{t?: number; seed?: number; x?: number; y?: number; w?: number; h?: number; n?: number; color?: string}> = ({t = 0, seed = 1, x = -200, y = 20, w = 2320, h = 560, n = 80, color = C.paperLight}) => (
  <g fill={color}>
    {Array.from({length: n}, (_, i) => {
      const s = seed * 977 + i * 13.1;
      const px = x + rand(s) * w;
      const py = y + Math.pow(rand(s + 1), 1.3) * h;
      const r = randRange(s + 2, 1.6, 3.4);
      const o = (0.35 + 0.65 * rand(s + 3)) * (0.7 + 0.3 * Math.sin(t * randRange(s + 4, 0.8, 2.2) + i));
      if (i % 11 === 0) return <path key={i} d={sparkle(px, py, r * 3.2)} opacity={o} />;
      return <circle key={i} cx={px} cy={py} r={r} opacity={o} />;
    })}
  </g>
);

/** Flat cloud: rounded base + three puffs, shade strip underneath. origin = bottom-centre, width w. */
export const Cloud: React.FC<Place & {w?: number; color?: string; shade?: string; o?: number}> = ({w = 300, color = C.paperLight, shade, o = 1, ...p}) => {
  const puffs = (k: number, dx: number) => (
    <>
      <circle cx={-0.2 * w + dx} cy={-0.17 * w} r={0.14 * w - k} />
      <circle cx={0.03 * w + dx} cy={-0.23 * w} r={0.2 * w - k} />
      <circle cx={0.25 * w + dx} cy={-0.15 * w} r={0.12 * w - k} />
    </>
  );
  return (
    <g transform={tf(p)} opacity={o}>
      <g fill={shade ?? dk(color, 0.08)}>
        <rect x={-0.42 * w} y={-0.18 * w} width={0.84 * w} height={0.18 * w} rx={0.09 * w} />
        {puffs(0, 0)}
      </g>
      <g fill={color}>
        <rect x={-0.41 * w} y={-0.2 * w} width={0.8 * w} height={0.12 * w} rx={0.06 * w} />
        {puffs(0.012 * w, -0.012 * w)}
      </g>
    </g>
  );
};

/**
 * Flat banded sky (5 stepped bands, no gradients) with sun/moon, stars and drifting clouds.
 * Fills the frame + overscan. origin = top-left. `horizon` = y where the lowest band sits.
 */
export const Sky: React.FC<{
  variant?: Tone;
  t?: number;
  horizon?: number;
  stars?: boolean;
  sun?: boolean;
  sunX?: number;
  sunY?: number;
  moon?: 'full' | 'crescent';
  clouds?: number;
  cloudSpeed?: number;
  seed?: number;
}> = ({variant = 'day', t = 0, horizon = 760, stars, sun = true, sunX, sunY, moon = 'full', clouds, cloudSpeed = 1, seed = 1}) => {
  const bands = SKY_BANDS[variant];
  const night = variant === 'night';
  const dusk = variant === 'dusk';
  const sx = sunX ?? (dusk ? 1300 : night ? 1450 : 1440);
  const sy = sunY ?? (dusk ? horizon - 120 : night ? 220 : 240);
  const nC = clouds ?? {day: 5, dusk: 4, night: 3, overcast: 9}[variant];
  const [cc, cs, co] = CLOUD_COL[variant];
  return (
    <g>
      {bands.map((c, i) => (
        <rect key={i} x={X0} y={i === 0 ? -400 : horizon * BAND_AT[i]} width={X1 - X0} height={YB + 400} fill={c} />
      ))}
      {(stars ?? night) && <Stars t={t} seed={seed} h={horizon * 0.72} />}
      {sun && variant !== 'overcast' && night && <Moon x={sx} y={sy} r={62} phase={moon} />}
      {sun && variant !== 'overcast' && !night && (
        <g>
          {[3, 2.2, 1.55].map((k, i) => (
            <circle key={i} cx={sx} cy={sy} r={(dusk ? 100 : 70) * k} fill={dusk ? C.cautionTint : C.paperLight} opacity={dusk ? 0.16 : 0.2} />
          ))}
          <circle cx={sx} cy={sy} r={dusk ? 100 : 70} fill={dusk ? mixC(C.cautionLight, C.lamp, 0.55) : C.paperLight} />
        </g>
      )}
      {variant === 'overcast' && sun && <circle cx={sx} cy={sy} r={66} fill={C.paperLight} opacity={0.35} />}
      {Array.from({length: nC}, (_, i) => {
        const s = seed * 31 + i * 7.3;
        const w = randRange(s, 200, 400) * (variant === 'overcast' ? 1.25 : 1);
        const cy = randRange(s + 1, 110, horizon * 0.58);
        const speed = randRange(s + 2, 5, 12) * cloudSpeed;
        const span = 2500 + w;
        const cx = ((((randRange(s + 3, 0, span) + t * speed) % span) + span) % span) - 290 - w / 2;
        return <Cloud key={i} x={cx} y={cy} w={w} color={cc} shade={cs} o={co} />;
      })}
    </g>
  );
};

/** Moon disc (full or crescent) with flat halo rings. origin = centre. */
export const Moon: React.FC<{x: number; y: number; r?: number; phase?: 'full' | 'crescent'; color?: string}> = ({x, y, r = 60, phase = 'full', color = C.paperLight}) => (
  <g transform={`translate(${x} ${y})`}>
    {[2.6, 1.9, 1.4].map((k, i) => (
      <circle key={i} r={r * k} fill={color} opacity={0.05} />
    ))}
    {phase === 'full' ? (
      <>
        <circle r={r} fill={color} />
        <circle cx={-r * 0.3} cy={-r * 0.2} r={r * 0.2} fill={mixC(color, C.stone, 0.3)} />
        <circle cx={r * 0.25} cy={r * 0.3} r={r * 0.14} fill={mixC(color, C.stone, 0.3)} />
        <circle cx={r * 0.35} cy={-r * 0.35} r={r * 0.09} fill={mixC(color, C.stone, 0.3)} />
      </>
    ) : (
      <path d={`M0 ${-r} A${r} ${r} 0 1 0 0 ${r} A${r * 0.72} ${r} 0 1 1 0 ${-r} Z`} fill={color} transform="rotate(-20)" />
    )}
  </g>
);

// ------------------------------------------------------------------ LANDSCAPE

const HILL: Record<Layer, {y: number; amp: number; step: number; c: string}> = {
  far: {y: 650, amp: 90, step: 330, c: mixC(C.evidenceTint, C.stone, 0.35)},
  mid: {y: 730, amp: 70, step: 270, c: mixC(C.evidenceLight, C.paperDark, 0.45)},
  near: {y: 850, amp: 50, step: 360, c: mixC(C.evidenceLight, C.woodLight, 0.3)},
};

/**
 * Rolling hill band (fills down to the bottom). Flat shade on right-facing slopes.
 * origin = frame; `y` = base line of the crests (default far 650 / mid 730 / near 850).
 */
export const Hills: React.FC<{seed?: number; layer?: Layer; color?: string; tone?: Tone; y?: number; amp?: number; shade?: boolean}> = ({seed = 1, layer = 'mid', color, tone = 'day', y, amp, shade = true}) => {
  const d = HILL[layer];
  const base = y ?? d.y;
  const a = amp ?? d.amp;
  const col = toned(color ?? d.c, tone, FAR[layer]);
  const pts: [number, number][] = [];
  for (let x = X0 - 300, i = 0; x <= X1 + 400; i++) {
    pts.push([x, base - a * rand(seed * 31 + i * 7.7)]);
    x += d.step * randRange(seed * 7 + i, 0.7, 1.3);
  }
  const path = (dx: number) => {
    let s = `M${pts[0][0] + dx} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, yy] = pts[i];
      const [nx, ny] = pts[i + 1];
      s += ` Q${x + dx} ${yy} ${(x + nx) / 2 + dx} ${(yy + ny) / 2}`;
    }
    const last = pts[pts.length - 1];
    return s + ` L${last[0] + dx} ${last[1]} L${X1 + 500} ${YB} L${X0 - 500} ${YB} Z`;
  };
  return (
    <g>
      {shade && <path d={path(0)} fill={dk(col, 0.12)} />}
      <path d={path(shade ? -d.step * 0.17 : 0)} fill={col} />
    </g>
  );
};

/** Flat ground plane from y down (grass / earth / sand) with sparse perspective marks. origin = frame. */
export const Ground: React.FC<{y?: number; color?: string; tone?: Tone; kind?: 'grass' | 'earth' | 'sand'; seed?: number}> = ({y = FL, color, tone = 'day', kind = 'grass', seed = 1}) => {
  const base = color ?? (kind === 'grass' ? mixC(C.evidenceLight, C.woodLight, 0.45) : kind === 'earth' ? C.paperDark : C.paperDeep);
  const col = toned(base, tone);
  const marks: React.ReactNode[] = [];
  for (let k = 0; k < 7; k++) {
    const yy = y + 22 + k * k * 7 + k * 16;
    if (yy > 1100) break;
    const gap = 150 + k * 70;
    const len = 18 + k * 12;
    for (let x = -300 + rand(seed + k) * gap, j = 0; x < 2220; x += gap * randRange(seed * 3 + k * 11 + j, 0.7, 1.3), j++) {
      marks.push(<line key={`${k}-${j}`} x1={x} y1={yy} x2={x + len} y2={yy} strokeWidth={3 + k * 0.8} />);
    }
  }
  return (
    <g>
      <rect x={X0} y={y} width={X1 - X0} height={YB} fill={col} />
      <rect x={X0} y={y} width={X1 - X0} height={7} fill={lt(col, 0.14)} />
      <g stroke={dk(col, 0.14)} strokeLinecap="round" opacity={0.6}>
        {marks}
      </g>
    </g>
  );
};

export type TreeKind = 'round' | 'conifer' | 'bare' | 'poplar';
const TREE_COL: Record<TreeKind, string> = {
  round: mixC(C.evidenceLight, C.evidence, 0.35),
  conifer: mixC(C.evidence, C.slate, 0.25),
  bare: C.woodDark,
  poplar: mixC(C.evidenceLight, C.paperDark, 0.2),
};

/**
 * Stylised flat tree. origin = base of trunk, height h (default 300). Kinds: round | conifer | bare | poplar.
 * `t` gives a gentle sway; `far` (0..1) + `tone` tint it for atmosphere.
 */
export const Tree: React.FC<Place & {kind?: TreeKind; h?: number; color?: string; trunk?: string; seed?: number; t?: number; tone?: Tone; far?: number}> = ({
  kind = 'round',
  h = 300,
  color,
  trunk,
  seed = 1,
  t = 0,
  tone = 'day',
  far = 0,
  ...p
}) => {
  const col = toned(color ?? TREE_COL[kind], tone, far);
  const sh = dk(col, 0.22);
  const tr = toned(trunk ?? C.woodDark, tone, far);
  const sway = drift(t, 4 + rand(seed) * 2, 1.2, seed);
  if (kind === 'bare') {
    const segs: [number, number, number, number, number][] = [];
    const br = (x: number, y: number, a: number, len: number, w: number, dpt: number, s: number) => {
      const x2 = x + Math.cos(a) * len;
      const y2 = y + Math.sin(a) * len;
      segs.push([x, y, x2, y2, w]);
      if (dpt === 0) return;
      for (let j = 0; j < 2; j++) br(x2, y2, a + (j ? 1 : -1) * randRange(s + j, 0.3, 0.65), len * randRange(s + j + 5, 0.62, 0.78), w * 0.62, dpt - 1, s * 3 + j + 1);
    };
    br(0, 0, -Math.PI / 2, h * 0.42, h * 0.07, 3, seed + 1);
    return (
      <g transform={tf(p)}>
        <g transform={`rotate(${sway * 0.6} 0 0)`} stroke={col} strokeLinecap="round">
          {segs.map(([a, b, c, d, w], i) => (
            <line key={i} x1={a} y1={b} x2={c} y2={d} strokeWidth={Math.max(3, w)} />
          ))}
        </g>
      </g>
    );
  }
  if (kind === 'conifer') {
    const tiers: [number, number, number][] = [
      [-h * 0.58, -h * 0.14, h * 0.28],
      [-h * 0.8, -h * 0.38, h * 0.22],
      [-h, -h * 0.62, h * 0.16],
    ];
    return (
      <g transform={tf(p)}>
        <rect x={-h * 0.03} y={-h * 0.18} width={h * 0.06} height={h * 0.18} fill={tr} />
        <g transform={`rotate(${sway * 0.5} 0 0)`}>
          {tiers.map(([ap, b, hw], i) => (
            <g key={i}>
              <path d={`M0 ${ap} L${hw} ${b} L${-hw} ${b} Z`} fill={sh} />
              <path d={`M0 ${ap} L${-hw * 0.12} ${b} L${-hw} ${b} Z`} fill={col} />
            </g>
          ))}
        </g>
      </g>
    );
  }
  if (kind === 'poplar') {
    return (
      <g transform={tf(p)}>
        <rect x={-h * 0.025} y={-h * 0.2} width={h * 0.05} height={h * 0.2} fill={tr} />
        <g transform={`rotate(${sway * 0.6} 0 0)`}>
          <ellipse cx={0} cy={-h * 0.56} rx={h * 0.13} ry={h * 0.42} fill={sh} />
          <ellipse cx={-h * 0.02} cy={-h * 0.59} rx={h * 0.1} ry={h * 0.37} fill={col} />
        </g>
      </g>
    );
  }
  const blobs: [number, number, number][] = [
    [0, -0.6, 0.29],
    [-0.18, -0.5, 0.2],
    [0.19, -0.52, 0.21],
    [0.03, -0.8, 0.2],
  ];
  return (
    <g transform={tf(p)}>
      <path d={`M${-h * 0.045} 0 L${-h * 0.03} ${-h * 0.5} L${h * 0.03} ${-h * 0.5} L${h * 0.045} 0 Z`} fill={tr} />
      <g transform={`rotate(${sway} 0 ${-h * 0.35})`}>
        <g fill={sh}>
          {blobs.map(([x, y, r], i) => (
            <circle key={i} cx={x * h} cy={y * h} r={r * h} />
          ))}
        </g>
        <g fill={col}>
          {blobs.map(([x, y, r], i) => (
            <circle key={i} cx={x * h - r * h * 0.12} cy={y * h - r * h * 0.1} r={r * h * 0.8} />
          ))}
        </g>
      </g>
    </g>
  );
};

const TREE_ROW: Record<Layer, {s: number; y: number}> = {far: {s: 0.4, y: 690}, mid: {s: 0.7, y: 780}, near: {s: 1.15, y: 900}};

/** Seeded row of trees across the frame (+ overscan). origin = frame; `y` = trunk bases. */
export const Trees: React.FC<{seed?: number; layer?: Layer; kind?: TreeKind | 'mixed'; y?: number; color?: string; tone?: Tone; t?: number; density?: number; x0?: number; x1?: number; h?: number}> = ({
  seed = 1,
  layer = 'mid',
  kind = 'mixed',
  y,
  color,
  tone = 'day',
  t = 0,
  density = 1,
  x0 = -250,
  x1 = 2170,
  h = 300,
}) => {
  const L = TREE_ROW[layer];
  const by = y ?? L.y;
  const items: React.ReactNode[] = [];
  const kinds: TreeKind[] = ['round', 'conifer', 'round', 'poplar', 'conifer'];
  for (let x = x0 + rand(seed) * 80, i = 0; x < x1; i++) {
    const s = seed * 91 + i * 5.3;
    const k = kind === 'mixed' ? pick(kinds, s) : kind;
    const hh = h * L.s * randRange(s + 1, 0.75, 1.25);
    items.push(<Tree key={i} x={x} y={by + randRange(s + 2, -6, 6) * L.s} kind={k} h={hh} seed={s} t={t} tone={tone} far={FAR[layer]} color={color} />);
    x += (h * L.s * randRange(s + 3, 0.35, 0.8)) / density;
  }
  return <g>{items}</g>;
};

/** Lake / river band: flat water with drifting ripple dashes and optional sun glint column. origin = frame. */
export const Water: React.FC<{y?: number; h?: number; t?: number; color?: string; tone?: Tone; seed?: number; glintX?: number; x?: number; w?: number}> = ({
  y = 780,
  h = 400,
  t = 0,
  color,
  tone = 'day',
  seed = 1,
  glintX,
  x = X0,
  w = X1 - X0,
}) => {
  const col = toned(color ?? mixC(C.water, C.sky, 0.25), tone);
  const hi = tone === 'night' ? mixC(col, C.paperLight, 0.3) : lt(col, 0.4);
  const rows: React.ReactNode[] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const yy = y + h * Math.pow((i + 0.7) / (n + 0.5), 1.5);
    if (yy > 1090) break;
    const k = (i + 1) / n;
    const gap = 160 + 260 * k;
    for (let xx = x - 200 + rand(seed + i) * gap, j = 0; xx < x + w + 200; xx += gap * randRange(seed * 5 + i * 9 + j, 0.6, 1.4), j++) {
      const s = seed * 13 + i * 31 + j;
      const len = (24 + 90 * k) * randRange(s, 0.6, 1.3);
      const sx = xx + drift(t, randRange(s + 1, 4, 7), 10 + 16 * k, rand(s) * 6);
      const o = 0.35 + 0.35 * Math.sin(t * randRange(s + 2, 0.6, 1.4) + j);
      rows.push(<line key={`${i}-${j}`} x1={sx} y1={yy} x2={sx + len} y2={yy} strokeWidth={3 + 3 * k} opacity={o} />);
    }
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={YB} fill={col} />
      <rect x={x} y={y} width={w} height={8} fill={dk(col, 0.2)} opacity={0.5} />
      <g stroke={hi} strokeLinecap="round">{rows}</g>
      {glintX !== undefined && (
        <g stroke={tone === 'dusk' ? C.cautionTint : C.paperLight} strokeLinecap="round">
          {Array.from({length: 8}, (_, i) => {
            const yy = y + 16 + i * i * 6 + i * 10;
            const len = (60 + i * 26) * (0.7 + 0.3 * Math.sin(t * 1.7 + i * 1.3));
            const off = noise1(t * 0.8 + i, seed) * 14;
            return <line key={i} x1={glintX - len / 2 + off} y1={yy} x2={glintX + len / 2 + off} y2={yy} strokeWidth={4 + i * 0.6} opacity={0.75 - i * 0.06} />;
          })}
        </g>
      )}
    </g>
  );
};

/** Ready-made landscape: sky + far/mid hills + trees + (lake) + near ground. For parallax use the layer components. */
export const Landscape: React.FC<{tone?: Tone; seed?: number; t?: number; water?: boolean; trees?: TreeKind | 'mixed'}> = ({tone = 'day', seed = 1, t = 0, water = false, trees = 'mixed'}) => (
  <g>
    <Sky variant={tone} t={t} horizon={720} seed={seed} />
    <Hills layer="far" seed={seed + 1} tone={tone} />
    <Trees layer="far" seed={seed + 5} tone={tone} t={t} kind={trees === 'mixed' ? 'conifer' : trees} y={700} density={0.6} />
    <Hills layer="mid" seed={seed + 2} tone={tone} y={water ? 750 : 735} amp={water ? 40 : 70} />
    {water ? (
      <>
        <Water y={790} tone={tone} t={t} seed={seed} glintX={tone === 'overcast' ? undefined : tone === 'dusk' ? 1300 : 1440} />
        <Ground y={955} tone={tone} seed={seed} />
        <Trees layer="near" seed={seed + 3} tone={tone} t={t} kind={trees} y={960} x0={-200} x1={420} />
        <Trees layer="near" seed={seed + 4} tone={tone} t={t} kind={trees} y={960} x0={1620} x1={2150} />
      </>
    ) : (
      <>
        <Trees layer="mid" seed={seed + 3} tone={tone} t={t} kind={trees} y={800} density={trees === 'bare' ? 0.4 : 0.7} />
        <Hills layer="near" seed={seed + 4} tone={tone} y={870} amp={40} />
        <Trees layer="near" seed={seed + 6} tone={tone} t={t} kind={trees} y={1010} x0={-200} x1={330} />
      </>
    )}
  </g>
);

// ------------------------------------------------------------------ CITY

/** Architecture era for skylines/streets. */
export type Era = 'medieval' | 'early-modern' | 'modern';
const SKYL: Record<Layer, {s: number; y: number; c: string}> = {
  far: {s: 0.55, y: 760, c: mixC(C.stone, C.sky, 0.3)},
  mid: {s: 0.8, y: 800, c: C.stoneShade},
  near: {s: 1, y: 860, c: C.stoneDark},
};

/**
 * City silhouette band. medieval = gabled houses, towers, church spire (+ optional town walls);
 * early-modern = stepped gables, domes, clock tower; modern = blocks with window grids (lit at night).
 * origin = frame; `y` = ground line of the buildings (they extend below it).
 */
export const CitySkyline: React.FC<{seed?: number; era?: Era; layer?: Layer; color?: string; tone?: Tone; y?: number; lit?: boolean; t?: number; walls?: boolean; x0?: number; x1?: number}> = ({
  seed = 1,
  era = 'medieval',
  layer = 'mid',
  color,
  tone = 'day',
  y,
  lit,
  t = 0,
  walls = false,
  x0 = -300,
  x1 = 2220,
}) => {
  const L = SKYL[layer];
  const s = L.s;
  const base = y ?? L.y;
  const col = toned(color ?? L.c, tone, FAR[layer]);
  const detail = layer !== 'far';
  const night = lit ?? tone === 'night';
  const sh = dk(col, 0.12);
  const roofC = dk(col, 0.07);
  const offWin = dk(col, 0.3);
  const lw = Math.max(3, 4 * s);
  const winC = (k: number): string | null => {
    const on = night && (rand(k) > 0.42) !== (rand(k * 3.7 + Math.floor(t / 5 + rand(k) * 5)) > 0.94);
    if (on) return C.lamp;
    return layer === 'near' || (detail && !night) ? offWin : null;
  };
  const els: React.ReactNode[] = [];
  let key = 0;
  let bc = col;
  const R = (x: number, yy: number, w: number, h: number, fill: string, rx = 0) => els.push(<rect key={key++} x={x} y={yy} width={w} height={h} fill={fill === col ? bc : fill} rx={rx} />);
  const P = (d: string, fill: string) => els.push(<path key={key++} d={d} fill={fill === col ? bc : fill} />);
  const wins = (x: number, top: number, w: number, h: number, cols: number, rows: number, ww: number, wh: number, sd: number) => {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const f = winC(sd * 17 + r * 7 + c);
        if (!f) continue;
        R(x + ((c + 0.5) * w) / cols - ww / 2, top + ((r + 0.5) * h) / rows - wh / 2, ww, wh, f);
      }
  };
  let x = x0;
  let lastSpecial = -9999;
  for (let i = 0; x < x1; i++) {
    const sd = seed * 53 + i * 3.1;
    const r = rand(sd + 0.5);
    const jit = layer === 'far' ? 0 : randRange(sd * 1.31 + 7, -0.07, 0.07);
    bc = jit > 0 ? lt(col, jit) : dk(col, -jit);
    if (era === 'medieval') {
      if (r < 0.12 && x - lastSpecial > 900) {
        // church: tower + spire + nave
        lastSpecial = x;
        const tw = 52 * s;
        const th = 230 * s;
        const nw = 200 * s;
        const nh = 110 * s;
        R(x + tw, base - nh, nw - tw, nh + 400, col);
        P(`M${x + tw - 4 * s} ${base - nh} L${x + tw + 26 * s} ${base - nh - 56 * s} L${x + nw - 26 * s} ${base - nh - 56 * s} L${x + nw + 4 * s} ${base - nh} Z`, roofC);
        if (detail) for (let k = 0; k < 3; k++) wins(x + tw + 20 * s + k * 42 * s, base - nh + 26 * s, 16 * s, 46 * s, 1, 1, 12 * s, 40 * s, sd + k);
        R(x, base - th, tw, th + 400, col);
        P(`M${x - 5 * s} ${base - th} L${x + tw / 2} ${base - th - 175 * s} L${x + tw + 5 * s} ${base - th} Z`, roofC);
        if (detail) {
          R(x + tw * 0.72, base - th, tw * 0.28, th + 400, sh);
          P(`M${x + tw / 2} ${base - th - 175 * s} L${x + tw + 5 * s} ${base - th} L${x + tw / 2} ${base - th} Z`, dk(roofC, 0.12));
          wins(x, base - th + 30 * s, tw, 40 * s, 1, 1, 12 * s, 26 * s, sd + 9);
        }
        R(x + tw / 2 - lw / 2, base - th - 205 * s, lw, 32 * s, roofC);
        R(x + tw / 2 - 10 * s, base - th - 196 * s, 20 * s, lw, roofC);
        x += nw + 6 * s;
      } else if (r < 0.26) {
        const w = randRange(sd, 50, 70) * s;
        const h = randRange(sd + 1, 180, 260) * s;
        R(x, base - h, w, h + 400, col);
        if (rand(sd + 2) > 0.5) {
          P(`M${x - 6 * s} ${base - h} L${x + w / 2} ${base - h - 90 * s} L${x + w + 6 * s} ${base - h} Z`, roofC);
          if (detail) P(`M${x + w / 2} ${base - h - 90 * s} L${x + w + 6 * s} ${base - h} L${x + w / 2} ${base - h} Z`, dk(roofC, 0.12));
        } else for (let m = 0; m < 3; m++) R(x + (m * w) / 2.5, base - h - 16 * s, w * 0.24, 17 * s, col);
        if (detail) {
          R(x + w * 0.75, base - h, w * 0.25, h + 400, sh);
          wins(x, base - h + 26 * s, w, 60 * s, 1, 2, 9 * s, 18 * s, sd);
        }
        x += w + randRange(sd + 3, 0, 20) * s;
      } else {
        const w = randRange(sd, 70, 125) * s;
        const wh = randRange(sd + 1, 80, 150) * s;
        const top = base - wh;
        R(x, top, w, wh + 400, col);
        if (rand(sd + 2) > 0.4) {
          const rh = w * randRange(sd + 3, 0.55, 0.8);
          P(`M${x - 4 * s} ${top} L${x + w / 2} ${top - rh} L${x + w + 4 * s} ${top} Z`, roofC);
          if (detail) P(`M${x + w / 2} ${top - rh} L${x + w + 4 * s} ${top} L${x + w / 2} ${top} Z`, dk(roofC, 0.12));
        } else {
          const rh = 46 * s;
          if (rand(sd + 4) > 0.5) R(x + w * 0.68, top - rh - 22 * s, 13 * s, 40 * s, roofC);
          P(`M${x - 6 * s} ${top} L${x + 14 * s} ${top - rh} L${x + w - 14 * s} ${top - rh} L${x + w + 6 * s} ${top} Z`, roofC);
        }
        if (detail) {
          R(x + w * 0.8, top, w * 0.2, wh + 400, sh);
          wins(x, top + 14 * s, w * 0.8, wh * 0.6, w > 100 * s ? 2 : 1, wh > 120 * s ? 2 : 1, 11 * s, 15 * s, sd);
        }
        x += w - randRange(sd + 5, 0, 8) * s;
      }
    } else if (era === 'early-modern') {
      if (r < 0.09 && x - lastSpecial > 800) {
        lastSpecial = x;
        const dw = 150 * s;
        R(x + 15 * s, base - 150 * s, dw - 30 * s, 550 * s, col);
        P(`M${x + 8 * s} ${base - 150 * s} A${dw / 2 - 8 * s} ${85 * s} 0 0 1 ${x + dw - 8 * s} ${base - 150 * s} Z`, roofC);
        R(x + dw / 2 - 9 * s, base - 260 * s, 18 * s, 30 * s, roofC);
        P(`M${x + dw / 2 - 11 * s} ${base - 258 * s} L${x + dw / 2} ${base - 290 * s} L${x + dw / 2 + 11 * s} ${base - 258 * s} Z`, roofC);
        if (detail) {
          P(`M${x + dw / 2} ${base - 235 * s} A${dw / 2 - 8 * s} ${85 * s} 0 0 1 ${x + dw - 8 * s} ${base - 150 * s} L${x + dw / 2} ${base - 150 * s} Z`, dk(roofC, 0.12));
          wins(x + 15 * s, base - 130 * s, dw - 30 * s, 60 * s, 3, 1, 12 * s, 30 * s, sd);
        }
        x += dw + 4 * s;
      } else if (r < 0.17 && x - lastSpecial > 500) {
        lastSpecial = x;
        const w = 62 * s;
        const h = 300 * s;
        R(x, base - h, w, h + 400, col);
        P(`M${x - 6 * s} ${base - h} L${x + w / 2} ${base - h - 120 * s} L${x + w + 6 * s} ${base - h} Z`, roofC);
        if (detail) {
          R(x + w * 0.75, base - h, w * 0.25, h + 400, sh);
          els.push(<circle key={key++} cx={x + w / 2} cy={base - h + 40 * s} r={17 * s} fill={lt(col, 0.4)} />);
        }
        x += w + 4 * s;
      } else {
        const w = randRange(sd, 62, 95) * s;
        const h = randRange(sd + 1, 140, 225) * s;
        const top = base - h;
        R(x, top, w, h + 400, col);
        if (rand(sd + 2) > 0.45) {
          const st = w * 0.14;
          const g = 22 * s;
          P(
            `M${x} ${top} L${x} ${top - g} L${x + st} ${top - g} L${x + st} ${top - 2 * g} L${x + 2 * st} ${top - 2 * g} L${x + 2 * st} ${top - 3 * g} L${x + w - 2 * st} ${top - 3 * g} L${x + w - 2 * st} ${top - 2 * g} L${x + w - st} ${top - 2 * g} L${x + w - st} ${top - g} L${x + w} ${top - g} L${x + w} ${top} Z`,
            col,
          );
        } else {
          P(`M${x} ${top} Q${x} ${top - 30 * s} ${x + w * 0.2} ${top - 40 * s} Q${x + w * 0.3} ${top - 72 * s} ${x + w / 2} ${top - 82 * s} Q${x + w * 0.7} ${top - 72 * s} ${x + w * 0.8} ${top - 40 * s} Q${x + w} ${top - 30 * s} ${x + w} ${top} Z`, col);
        }
        if (detail) {
          R(x + w * 0.82, top, w * 0.18, h + 400, sh);
          wins(x, top + 20 * s, w * 0.82, h * 0.75, 2, Math.max(1, Math.floor(h / (48 * s))), 10 * s, 18 * s, sd);
        }
        x += w + randRange(sd + 3, -2, 6) * s;
      }
    } else {
      const w = randRange(sd, 90, 210) * s;
      const tall = r > 0.72;
      const h = (tall ? randRange(sd + 2, 360, 520) : randRange(sd + 2, 150, 320)) * s;
      const top = base - h;
      R(x, top, w, h + 400, col);
      let top2 = top;
      if (rand(sd + 3) > 0.6) {
        top2 = top - h * 0.16;
        R(x + w * 0.2, top2, w * 0.6, h * 0.16 + 2, col);
      }
      const ex = rand(sd + 4);
      if (ex < 0.3) R(x + w * 0.5 - lw / 2, top2 - 60 * s, lw, 60 * s, col);
      else if (ex < 0.55 && detail) {
        R(x + w * 0.22, top - 30 * s, 30 * s, 20 * s, col);
        R(x + w * 0.22 + 3 * s, top - 12 * s, lw, 12 * s, col);
        R(x + w * 0.22 + 27 * s - lw, top - 12 * s, lw, 12 * s, col);
      } else if (ex < 0.7) R(x + w * 0.6, top - 14 * s, w * 0.25, 14 * s, col);
      if (detail) R(x + w * 0.8, top2, w * 0.2, h * 1.2 + 400, sh);
      if (detail || night) {
        const cols = Math.max(1, Math.floor((w * 0.8 - 12 * s) / (24 * s)));
        const rows = Math.max(1, Math.floor((h - 30 * s) / (32 * s)));
        wins(x + 8 * s, top + 18 * s, w * 0.8 - 12 * s, rows * 32 * s, cols, rows, 12 * s, 17 * s, sd);
      }
      x += w + randRange(sd + 5, 0, 18) * s;
    }
  }
  if (walls && era === 'medieval') {
    const wy = base - 70 * s;
    const wc = mixC(col, C.paperDeep, 0.18);
    R(x0, wy, x1 - x0, 500, wc);
    for (let mx = x0; mx < x1; mx += 40 * s) R(mx, wy - 16 * s, 22 * s, 17 * s, wc);
    for (let gx = x0 + 260 + rand(seed) * 200; gx < x1; gx += 700 * s) {
      R(gx - 50 * s, base - 150 * s, 100 * s, 600, wc);
      for (let m = 0; m < 4; m++) R(gx - 50 * s + m * 27 * s, base - 168 * s, 19 * s, 19 * s, wc);
      if (detail) {
        R(gx + 26 * s, base - 150 * s, 24 * s, 600, dk(wc, 0.12));
        P(`M${gx - 22 * s} ${base + 40} L${gx - 22 * s} ${base - 50 * s} A${22 * s} ${22 * s} 0 0 1 ${gx + 22 * s} ${base - 50 * s} L${gx + 22 * s} ${base + 40} Z`, dk(wc, 0.4));
      }
    }
  }
  return <g>{els}</g>;
};

// ------------------------------------------------------------------ STREET

const Cobbles: React.FC<{y: number; color: string; seed: number}> = ({y, color, seed}) => {
  const out: React.ReactNode[] = [];
  let yy = y + 8;
  let h = 12;
  for (let i = 0; yy < 1100; i++) {
    const cw = h * 2.1;
    const off = (i % 2) * cw * 0.55 + rand(seed + i) * 12;
    let j = 0;
    for (let xx = -80 - off; xx < 2000; xx += cw + 4 + h * 0.25, j++) out.push(<rect key={`${i}-${j}`} x={xx} y={yy} width={cw} height={h} rx={h * 0.42} />);
    yy += h * 1.2 + 3;
    h *= 1.22;
  }
  return <g fill={lt(color, 0.12)} opacity={0.75}>{out}</g>;
};

const MedievalHouse: React.FC<{x: number; w: number; seed: number; night: boolean; tone: Tone; t: number}> = ({x, w, seed, night, tone, t}) => {
  const tn = (c: string) => toned(c, tone);
  const stone = tn(pick([C.stone, C.stoneShade, mixC(C.stone, C.paperDeep, 0.5)], seed));
  const plaster = tn(pick([C.bone, C.paperShade, mixC(C.cautionTint, C.bone, 0.5), C.paperDeep], seed + 1));
  const timber = tn(C.woodDark);
  const roof = tn(pick([C.slate, C.woodDark, mixC(C.oxDeep, C.woodDark, 0.5), C.stoneDark], seed + 2));
  const winFill = night ? C.lamp : tn(C.inkSoft);
  const gH = Math.round(randRange(seed * 1.618 + 0.3, 200, 245));
  const fH = Math.round(randRange(seed * 2.17 + 0.7, 150, 180));
  const nF = rand(seed * 3.41 + 1.9) < 0.45 ? 1 : 2;
  const out: React.ReactNode[] = [];
  let k = 0;
  // ground floor (stone)
  out.push(<rect key={k++} x={x} y={FL - gH} width={w} height={gH + 300} fill={stone} />);
  for (let b = 0; b < 6; b++) {
    const bx = x + rand(seed * 7 + b) * (w - 70);
    const by = FL - gH + 20 + rand(seed * 9 + b) * (gH - 60);
    out.push(<rect key={k++} x={bx} y={by} width={64} height={30} rx={6} fill={b % 2 ? lt(stone, 0.1) : dk(stone, 0.07)} />);
  }
  const doorLeft = rand(seed + 4) < 0.5;
  const dx = x + w * (doorLeft ? 0.28 : 0.7);
  out.push(<path key={k++} d={`M${dx - 62} ${FL} L${dx - 62} ${FL - 128} A62 62 0 0 1 ${dx + 62} ${FL - 128} L${dx + 62} ${FL} Z`} fill={dk(stone, 0.16)} />);
  out.push(<path key={k++} d={`M${dx - 48} ${FL} L${dx - 48} ${FL - 128} A48 48 0 0 1 ${dx + 48} ${FL - 128} L${dx + 48} ${FL} Z`} fill={tn(C.wood)} />);
  out.push(<path key={k++} d={`M${dx - 48} ${FL - 128} A48 48 0 0 1 ${dx - 20} ${FL - 172} L${dx - 20} ${FL} L${dx - 48} ${FL} Z`} fill={tn(C.woodLight)} opacity={0.5} />);
  for (let pl = -1; pl <= 1; pl++) out.push(<line key={k++} x1={dx + pl * 16} y1={FL - 160 + Math.abs(pl) * 8} x2={dx + pl * 16} y2={FL} stroke={timber} strokeWidth={4} opacity={0.6} />);
  out.push(<rect key={k++} x={dx - 48} y={FL - 110} width={70} height={10} rx={5} fill={tn(IRON)} />);
  out.push(<rect key={k++} x={dx - 48} y={FL - 50} width={70} height={10} rx={5} fill={tn(IRON)} />);
  out.push(<circle key={k++} cx={dx + 26} cy={FL - 80} r={9} fill="none" stroke={tn(IRON)} strokeWidth={4} />);
  const wx = x + w * (doorLeft ? 0.72 : 0.28);
  out.push(<rect key={k++} x={wx - 40} y={FL - 168} width={80} height={62} rx={4} fill={dk(stone, 0.16)} />);
  out.push(<rect key={k++} x={wx - 30} y={FL - 160} width={60} height={46} fill={winFill} />);
  for (let b = -1; b <= 1; b++) out.push(<rect key={k++} x={wx + b * 15 - 2} y={FL - 160} width={4} height={46} fill={tn(IRON)} />);
  // upper floors (jettied, half-timbered)
  for (let f = 0; f < nF; f++) {
    const ox = 16 * (f + 1);
    const fy = FL - gH - (f + 1) * fH;
    const fx = x - ox;
    const fw = w + 2 * ox;
    out.push(<rect key={k++} x={fx} y={fy} width={fw} height={fH} fill={plaster} />);
    out.push(<rect key={k++} x={fx + 16} y={fy + fH} width={fw - 32} height={16} fill={C.ink} opacity={0.2} />);
    const nP = Math.max(2, Math.round(fw / 120));
    const pw = fw / nP;
    for (let pI = 0; pI < nP; pI++) {
      const px = fx + pI * pw;
      const isWin = (pI + f) % 2 === (nP > 2 ? 1 : 0) || nP === 2;
      if (isWin && !(nP === 2 && pI === 1 && rand(seed + f) < 0.3)) {
        const cx = px + pw / 2;
        const wy = fy + 38;
        out.push(<rect key={k++} x={cx - 50} y={wy} width={22} height={78} fill={tn(C.wood)} />);
        out.push(<rect key={k++} x={cx + 28} y={wy} width={22} height={78} fill={tn(dk(C.wood, 0.15))} />);
        out.push(<rect key={k++} x={cx - 28} y={wy} width={56} height={78} fill={winFill} />);
        out.push(<rect key={k++} x={cx - 2.5} y={wy} width={5} height={78} fill={timber} />);
        out.push(<rect key={k++} x={cx - 28} y={wy + 36} width={56} height={5} fill={timber} />);
        out.push(<rect key={k++} x={cx - 34} y={wy + 78} width={68} height={9} fill={timber} />);
        if (night) out.push(<rect key={k++} x={cx - 28} y={wy + 78 + 9} width={56} height={40} fill={C.lamp} opacity={0.12} />);
      } else {
        const d1 = rand(seed * 5 + pI + f) > 0.5;
        out.push(<line key={k++} x1={d1 ? px + 8 : px + pw - 8} y1={fy + fH - 12} x2={px + pw / 2} y2={fy + 14} stroke={timber} strokeWidth={10} />);
        out.push(<line key={k++} x1={d1 ? px + pw - 8 : px + 8} y1={fy + fH - 12} x2={px + pw / 2} y2={fy + 14} stroke={timber} strokeWidth={10} />);
      }
      out.push(<rect key={k++} x={px} y={fy} width={11} height={fH} fill={timber} />);
    }
    out.push(<rect key={k++} x={fx + fw - 11} y={fy} width={11} height={fH} fill={timber} />);
    out.push(<rect key={k++} x={fx} y={fy} width={fw} height={12} fill={timber} />);
    out.push(<rect key={k++} x={fx} y={fy + fH - 15} width={fw} height={15} fill={timber} />);
  }
  // roof
  const top = FL - gH - nF * fH;
  const ox = 16 * nF;
  if (rand(seed + 5) < 0.6) {
    const rh = w * randRange(seed + 6, 0.5, 0.62);
    const L = x - ox - 6;
    const Rr = x + w + ox + 6;
    const ax = (L + Rr) / 2;
    out.push(<path key={k++} d={`M${L} ${top} L${ax} ${top - rh} L${Rr} ${top} Z`} fill={plaster} />);
    out.push(<rect key={k++} x={ax - 22} y={top - rh * 0.55} width={44} height={50} fill={winFill} />);
    out.push(<rect key={k++} x={ax - 3} y={top - rh * 0.55} width={6} height={50} fill={timber} />);
    out.push(<path key={k++} d={`M${L - 22} ${top + 14} L${ax} ${top - rh - 16} L${Rr + 22} ${top + 14}`} fill="none" stroke={roof} strokeWidth={30} strokeLinejoin="round" strokeLinecap="round" />);
    out.push(<rect key={k++} x={L} y={top - 10} width={Rr - L} height={12} fill={timber} />);
  } else {
    const rh = 120;
    out.push(<path key={k++} d={`M${x - ox - 26} ${top + 4} L${x - ox + 30} ${top - rh} L${x + w + ox - 30} ${top - rh} L${x + w + ox + 26} ${top + 4} Z`} fill={roof} />);
    out.push(<rect key={k++} x={x - ox - 26} y={top - 8} width={w + 2 * ox + 52} height={12} fill={dk(roof, 0.2)} />);
    if (rand(seed + 7) > 0.4) {
      const cx = x + w * randRange(seed + 8, 0.2, 0.75);
      out.push(<rect key={k++} x={cx} y={top - rh - 46} width={34} height={56} fill={stone} />);
      out.push(<rect key={k++} x={cx - 5} y={top - rh - 52} width={44} height={10} fill={dk(stone, 0.15)} />);
      out.push(<Steam key={k++} t={t} x={cx + 17} y={top - rh - 50} w={40} h={160} n={2} color={tone === 'night' ? C.slate : C.paperLight} seed={seed} strength={0.8} />);
    }
  }
  return <g>{out}</g>;
};

const ModernHouse: React.FC<{x: number; w: number; seed: number; night: boolean; tone: Tone}> = ({x, w, seed, night, tone}) => {
  const tn = (c: string) => toned(c, tone);
  const fac = tn(pick([C.paperDeep, C.stone, C.bone, mixC(C.oxTint, C.paperDeep, 0.55), mixC(C.water, C.paperDeep, 0.6)], seed));
  const trim = lt(fac, 0.35);
  const glass = night ? C.lamp : tn(mixC(C.water, C.sky, 0.35));
  const glassOff = tn(mixC(C.waterDeep, C.slate, 0.3));
  const gH = 210;
  const fH = 150;
  const nF = 2 + Math.floor(rand(seed + 1) * 2);
  const top = FL - gH - nF * fH;
  const out: React.ReactNode[] = [];
  let k = 0;
  out.push(<rect key={k++} x={x} y={top} width={w} height={FL - top + 300} fill={fac} />);
  out.push(<rect key={k++} x={x + w - 14} y={top} width={14} height={FL - top} fill={dk(fac, 0.1)} />);
  out.push(<rect key={k++} x={x - 10} y={top - 22} width={w + 20} height={24} fill={trim} />);
  out.push(<rect key={k++} x={x - 4} y={top + 2} width={w + 8} height={8} fill={dk(fac, 0.15)} />);
  const nW = Math.max(2, Math.floor(w / 125));
  for (let f = 0; f < nF; f++) {
    const fy = top + 34 + f * fH;
    for (let j = 0; j < nW; j++) {
      const cx = x + ((j + 0.5) * w) / nW;
      const on = !night || rand(seed * 11 + f * 5 + j) > 0.4;
      out.push(<rect key={k++} x={cx - 38} y={fy - 6} width={76} height={108} fill={trim} />);
      out.push(<rect key={k++} x={cx - 30} y={fy} width={60} height={92} fill={on ? glass : glassOff} />);
      if (!night) out.push(<path key={k++} d={`M${cx - 30} ${fy + 50} L${cx - 2} ${fy} L${cx + 14} ${fy} L${cx - 30} ${fy + 76} Z`} fill={C.paperLight} opacity={0.25} />);
      out.push(<rect key={k++} x={cx - 2.5} y={fy} width={5} height={92} fill={trim} />);
      out.push(<rect key={k++} x={cx - 44} y={fy + 100} width={88} height={10} fill={dk(trim, 0.1)} />);
    }
  }
  // shop floor
  const sy = FL - gH;
  out.push(<rect key={k++} x={x} y={sy} width={w} height={gH} fill={dk(fac, 0.05)} />);
  out.push(<rect key={k++} x={x + 16} y={sy + 6} width={w - 32} height={38} fill={tn(C.inkSoft)} />);
  const sw = w * 0.58;
  out.push(<rect key={k++} x={x + 26} y={FL - 140} width={sw} height={128} fill={trim} />);
  out.push(<rect key={k++} x={x + 34} y={FL - 132} width={sw - 16} height={112} fill={night ? mixC(C.lamp, C.cautionTint, 0.3) : glass} />);
  if (!night) out.push(<path key={k++} d={`M${x + 34} ${FL - 60} L${x + 110} ${FL - 132} L${x + 140} ${FL - 132} L${x + 34} ${FL - 30} Z`} fill={C.paperLight} opacity={0.25} />);
  const awn = pick([mixC(C.theoryLight, C.paperShade, 0.25), mixC(C.cautionLight, C.paperShade, 0.25), mixC(C.evidenceLight, C.paperShade, 0.25), C.stoneDark], seed + 2);
  const aw = sw + 30;
  out.push(<path key={k++} d={`M${x + 12} ${FL - 160} L${x + 12 + aw} ${FL - 160} L${x + aw + 30} ${FL - 118} L${x - 6} ${FL - 118} Z`} fill={tn(awn)} />);
  const stripes = Math.round(aw / 46);
  for (let st = 0; st < stripes; st += 2) {
    const a = x + 12 + (st * aw) / stripes;
    const b = a + aw / stripes;
    const ka = (st / stripes) * (aw + 36) - 18;
    const kb = ((st + 1) / stripes) * (aw + 36) - 18;
    out.push(<path key={k++} d={`M${a} ${FL - 160} L${b} ${FL - 160} L${x + kb} ${FL - 118} L${x + ka} ${FL - 118} Z`} fill={C.paperLight} opacity={0.45} />);
  }
  out.push(<rect key={k++} x={x - 6} y={FL - 118} width={aw + 36} height={9} fill={dk(tn(awn), 0.2)} />);
  const dx = x + 26 + sw + (w - 26 - sw) / 2;
  out.push(<rect key={k++} x={dx - 40} y={FL - 172} width={80} height={172} fill={trim} />);
  out.push(<rect key={k++} x={dx - 32} y={FL - 164} width={64} height={164} fill={tn(pick([C.slate, C.woodDark, C.evidence, C.theory], seed + 3))} />);
  out.push(<rect key={k++} x={dx - 22} y={FL - 150} width={44} height={60} fill={night ? C.lamp : glass} opacity={0.85} />);
  out.push(<circle key={k++} cx={dx + 20} cy={FL - 78} r={5} fill={BRASS} />);
  return <g>{out}</g>;
};

/** Street lamp post (modern). origin = base of pole. `lit` adds a flat glow. */
export const StreetLamp: React.FC<Place & {h?: number; lit?: boolean; color?: string}> = ({h = 420, lit = false, color = C.inkLift, ...p}) => (
  <g transform={tf(p)}>
    {lit && <LightPool x={30} y={-h + 20} r={170} strength={1.6} />}
    {lit && <path d={`M10 ${-h + 30} L50 ${-h + 30} L150 0 L-90 0 Z`} fill={C.lamp} opacity={0.1} />}
    <rect x={-14} y={-20} width={28} height={20} rx={4} fill={color} />
    <rect x={-6} y={-h} width={12} height={h} fill={color} />
    <path d={`M0 ${-h + 6} Q0 ${-h - 34} 34 ${-h - 34} L40 ${-h - 34}`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" />
    <path d={`M14 ${-h - 30} L66 ${-h - 30} L56 ${-h - 10} L24 ${-h - 10} Z`} fill={color} />
    <rect x={26} y={-h - 12} width={28} height={8} rx={4} fill={lit ? C.lamp : C.paperShade} />
  </g>
);

/**
 * Street scene band: sky, distant city, a row of house facades and the street surface.
 * medieval = stone ground floors, jettied half-timbered upper floors, cobbles, lanterns at night;
 * modern = facades with shopfronts/awnings, sidewalk (floor line y = 820), road, street lamps.
 * origin = frame.
 */
export const Street: React.FC<{era?: 'medieval' | 'modern'; seed?: number; t?: number; tone?: Tone}> = ({era = 'medieval', seed = 1, t = 0, tone = 'day'}) => {
  const night = tone === 'night';
  const houses: React.ReactNode[] = [];
  const xs: number[] = [];
  let x = -60;
  for (let i = 0; x < 1990; i++) {
    const s = seed * 37 + i * 11;
    const w = randRange(s * 1.37 + 0.2, era === 'medieval' ? 320 : 380, era === 'medieval' ? 470 : 520);
    houses.push(era === 'medieval' ? <MedievalHouse key={i} x={x} w={w} seed={s} night={night} tone={tone} t={t} /> : <ModernHouse key={i} x={x} w={w} seed={s} night={night} tone={tone} />);
    xs.push(x);
    x += w + (rand(s + 1) < 0.18 ? randRange(s + 2, 70, 130) : era === 'medieval' ? 30 : 0);
  }
  const groundC = toned(era === 'medieval' ? C.stoneShade : C.paperDeep, tone);
  return (
    <g>
      <Sky variant={tone} t={t} horizon={640} seed={seed} clouds={3} sunX={1500} sunY={150} />
      <CitySkyline era={era === 'medieval' ? 'medieval' : 'modern'} layer="far" tone={tone} y={640} seed={seed + 3} t={t} />
      <CitySkyline era={era === 'medieval' ? 'medieval' : 'modern'} layer="mid" tone={tone} y={720} seed={seed + 4} t={t} />
      {houses}
      {era === 'medieval' ? (
        <>
          <rect x={X0} y={FL} width={X1 - X0} height={YB} fill={groundC} />
          <Cobbles y={FL} color={groundC} seed={seed} />
          <rect x={X0} y={FL} width={X1 - X0} height={10} fill={C.ink} opacity={0.16} />
          {night && xs.slice(1).map((hx, i) => (i % 2 === 0 ? <Lantern key={i} x={hx + 6} y={FL - 250} t={t} lit chain={0} s={0.9} /> : null))}
        </>
      ) : (
        <>
          <rect x={X0} y={FL} width={X1 - X0} height={60} fill={groundC} />
          {Array.from({length: 14}, (_, i) => (
            <rect key={i} x={-60 + i * 160} y={FL} width={4} height={60} fill={dk(groundC, 0.12)} />
          ))}
          <rect x={X0} y={FL} width={X1 - X0} height={8} fill={C.ink} opacity={0.14} />
          <rect x={X0} y={FL + 60} width={X1 - X0} height={16} fill={toned(C.stone, tone)} />
          <rect x={X0} y={FL + 76} width={X1 - X0} height={YB} fill={toned(mixC(C.slate, C.stoneDark, 0.5), tone)} />
          {Array.from({length: 8}, (_, i) => (
            <rect key={i} x={-100 + i * 300} y={FL + 170} width={150} height={10} rx={5} fill={toned(C.paperShade, tone)} opacity={0.7} />
          ))}
          {[260, 1160, 2060].map((lx, i) => (
            <StreetLamp key={i} x={lx} y={FL + 50} lit={night} />
          ))}
        </>
      )}
    </g>
  );
};

// ------------------------------------------------------------------ PROPS (furniture & objects)

/** Window with stepped-sky glass, mullions, sill and optional curtains/moon. origin = sill centre (bottom). */
export const Window: React.FC<
  Place & {w?: number; h?: number; shape?: 'arched' | 'square'; sky?: Tone; frame?: string; reveal?: string; t?: number; curtains?: boolean; curtainColor?: string; moon?: boolean; panes?: boolean; seed?: number}
> = ({w = 240, h = 360, shape = 'square', sky = 'day', frame = C.paperDark, reveal = C.stoneShade, t = 0, curtains = false, curtainColor = mixC(C.theory, C.wood, 0.35), moon, panes = true, seed = 1, ...p}) => {
  const r = w / 2;
  const top = -h;
  const night = sky === 'night';
  const bands = SKY_BANDS[sky].map((b) => (night ? b : mixC(b, C.paperLight, 0.55)));
  const glass = (ins: number) =>
    shape === 'arched'
      ? `M${-r + ins} 0 L${-r + ins} ${top + r} A${r - ins} ${r - ins} 0 0 1 ${r - ins} ${top + r} L${r - ins} 0 Z`
      : `M${-r + ins} 0 L${-r + ins} ${top + ins} L${r - ins} ${top + ins} L${r - ins} 0 Z`;
  const by = (k: number) => Math.max(top + (shape === 'arched' ? r : 0) + 4, top + h * k);
  const mullW = Math.max(6, w * 0.035);
  const cDk = dk(curtainColor, 0.15);
  return (
    <g transform={tf(p)}>
      <path d={glass(-20)} fill={reveal} />
      <path d={glass(0)} fill={bands[1]} />
      <rect x={-r} y={by(0.5)} width={w} height={-by(0.5)} fill={bands[2]} />
      <rect x={-r} y={by(0.72)} width={w} height={-by(0.72)} fill={bands[3]} />
      <rect x={-r} y={by(0.88)} width={w} height={-by(0.88)} fill={bands[4]} />
      {night && (moon ?? true) && <Moon x={r * 0.32} y={top + Math.max(h * 0.28, shape === 'arched' ? r : 0)} r={w * 0.12} />}
      {night && <Stars t={t} seed={seed} x={-r + 10} y={top + (shape === 'arched' ? r * 0.6 : 10)} w={w - 20} h={h * 0.6} n={10} />}
      {!night && (
        <g fill={C.paperLight} opacity={0.35}>
          <path d={`M${-r} ${top + h * 0.62} L${-r + w * 0.55} ${top + h * 0.2} L${-r + w * 0.72} ${top + h * 0.2} L${-r} ${top + h * 0.75} Z`} />
          <path d={`M${-r} ${top + h * 0.86} L${-r + w * 0.8} ${top + h * 0.28} L${-r + w * 0.86} ${top + h * 0.28} L${-r} ${top + h * 0.92} Z`} />
        </g>
      )}
      {panes && (
        <g fill={frame}>
          <rect x={-mullW / 2} y={top + 4} width={mullW} height={h - 4} />
          {shape === 'arched' ? (
            <rect x={-r} y={top + r - mullW / 2} width={w} height={mullW} />
          ) : (
            <rect x={-r} y={top + h * 0.5 - mullW / 2} width={w} height={mullW} />
          )}
          <rect x={-r} y={top + (shape === 'arched' ? r + (h - r) * 0.5 : h * 0.25) - mullW / 2} width={w} height={mullW} />
          {shape === 'square' && <rect x={-r} y={top + h * 0.75 - mullW / 2} width={w} height={mullW} />}
          <path d={glass(0)} fill="none" stroke={frame} strokeWidth={mullW * 1.6} />
        </g>
      )}
      <path d={`M${-r} ${top + (shape === 'arched' ? r : 0)} L${-r + 14} ${top + (shape === 'arched' ? r : 14)} L${-r + 14} 0 L${-r} 0 Z`} fill={C.ink} opacity={0.12} />
      <rect x={-r - 30} y={0} width={w + 60} height={18} rx={3} fill={lt(reveal, 0.2)} />
      <rect x={-r - 22} y={18} width={w + 44} height={10} fill={C.ink} opacity={0.15} />
      {curtains && (
        <g>
          <rect x={-r - 90} y={top - 60} width={w + 180} height={12} rx={6} fill={C.woodDark} />
          <circle cx={-r - 92} cy={top - 54} r={11} fill={C.woodDark} />
          <circle cx={r + 92} cy={top - 54} r={11} fill={C.woodDark} />
          <path d={`M${-r - 70} ${top - 48} L${-r + w * 0.2} ${top - 48} Q${-r + w * 0.04} ${top + h * 0.42} ${-r + 4} ${top + h * 0.6} Q${-r + w * 0.14} ${top + h * 0.8} ${-r + w * 0.1} 40 L${-r - 70} 40 Z`} fill={curtainColor} />
          <path d={`M${r + 70} ${top - 48} L${r - w * 0.2} ${top - 48} Q${r - w * 0.04} ${top + h * 0.42} ${r - 4} ${top + h * 0.6} Q${r - w * 0.14} ${top + h * 0.8} ${r - w * 0.1} 40 L${r + 70} 40 Z`} fill={cDk} />
          <g stroke={dk(curtainColor, 0.25)} strokeWidth={5} strokeLinecap="round" opacity={0.6}>
            <path d={`M${-r - 40} ${top - 40} L${-r - 40} 30`} />
            <path d={`M${-r - 8} ${top - 40} Q${-r - 12} ${top + h * 0.4} ${-r - 16} ${top + h * 0.58}`} />
            <path d={`M${r + 40} ${top - 40} L${r + 40} 30`} />
          </g>
          <rect x={-r - 30} y={top + h * 0.58} width={44} height={14} rx={7} fill={BRASS} />
          <rect x={r - 14} y={top + h * 0.58} width={44} height={14} rx={7} fill={BRASS} />
        </g>
      )}
    </g>
  );
};

/** Door: plank (medieval, iron straps), panel (19th c.) or flush (modern). origin = threshold centre. `open` 0..1 swings the leaf. */
export const Door: React.FC<Place & {w?: number; h?: number; shape?: 'arched' | 'square'; style?: 'plank' | 'panel' | 'flush'; color?: string; frame?: string; open?: number; inside?: string}> = ({
  w = 200,
  h = 360,
  shape = 'square',
  style = 'panel',
  color = C.wood,
  frame = C.woodLight,
  open = 0,
  inside = C.ink,
  ...p
}) => {
  const r = w / 2;
  const top = -h;
  const shp = (ins: number) =>
    shape === 'arched'
      ? `M${-r + ins} 0 L${-r + ins} ${top + r} A${r - ins} ${r - ins} 0 0 1 ${r - ins} ${top + r} L${r - ins} 0 Z`
      : `M${-r + ins} 0 L${-r + ins} ${top + ins} L${r - ins} ${top + ins} L${r - ins} 0 Z`;
  const k = 1 - clamp01(open) * 0.82;
  const sh = dk(color, 0.14);
  return (
    <g transform={tf(p)}>
      <path d={shp(-20)} fill={frame} />
      <path d={`M${r} 0 L${r} ${top + (shape === 'arched' ? r : 0)} L${r + 20} ${top + (shape === 'arched' ? r : -20)} L${r + 20} 0 Z`} fill={dk(frame, 0.14)} />
      <path d={shp(0)} fill={inside} />
      <g transform={`translate(${-r} 0) scale(${k} 1) translate(${r} 0)`}>
        <path d={shp(0)} fill={color} />
        {style === 'plank' && (
          <g>
            {[1, 2, 3, 4].map((i) => (
              <line key={i} x1={-r + (i * w) / 5} y1={top + (shape === 'arched' ? 20 : 4)} x2={-r + (i * w) / 5} y2={0} stroke={sh} strokeWidth={4} />
            ))}
            {[0.3, 0.75].map((f, i) => (
              <g key={i}>
                <rect x={-r} y={top + h * f} width={w * 0.72} height={12} rx={6} fill={IRON} />
                <circle cx={-r + w * 0.72} cy={top + h * f + 6} r={9} fill={IRON} />
              </g>
            ))}
            <circle cx={r * 0.55} cy={top + h * 0.55} r={14} fill="none" stroke={IRON} strokeWidth={5} />
          </g>
        )}
        {style === 'panel' &&
          [0, 1].map((c) =>
            [0, 1, 2].map((rr) => {
              const px = -r + 22 + c * (w / 2 - 11);
              const pw = w / 2 - 33;
              const ph = rr === 1 ? h * 0.18 : h * 0.3;
              const py = top + 22 + (rr === 0 ? 0 : rr === 1 ? h * 0.3 + 14 : h * 0.48 + 28);
              return (
                <g key={`${c}${rr}`}>
                  <rect x={px} y={py} width={pw} height={ph} fill={sh} />
                  <rect x={px} y={py} width={pw} height={5} fill={dk(color, 0.3)} opacity={0.5} />
                  <rect x={px} y={py + ph - 4} width={pw} height={4} fill={lt(color, 0.2)} />
                </g>
              );
            }),
          )}
        {style === 'flush' && <rect x={-r + w * 0.3} y={top + h * 0.12} width={w * 0.14} height={h * 0.4} fill={mixC(C.water, C.paperLight, 0.5)} />}
        {style === 'flush' ? <rect x={r - 34} y={top + h * 0.5} width={10} height={60} rx={5} fill={C.metal} /> : style === 'panel' ? <circle cx={r - 28} cy={top + h * 0.53} r={9} fill={BRASS} /> : null}
        <rect x={-r} y={top + (shape === 'arched' ? r : 0)} width={12} height={h - (shape === 'arched' ? r : 0)} fill={C.ink} opacity={0.12} />
      </g>
      <rect x={-r - 26} y={-8} width={w + 52} height={8} fill={lt(frame, 0.2)} />
    </g>
  );
};

/** Table (side/front view, slab top + 2 visible legs). origin = floor centre. w×h default 360×150. */
export const Table: React.FC<Place & {w?: number; h?: number; color?: string}> = ({w = 360, h = 150, color = C.wood, ...p}) => (
  <g transform={tf(p)}>
    <rect x={-w / 2 + 26} y={-h + 24} width={22} height={h - 24} fill={color} />
    <rect x={w / 2 - 48} y={-h + 24} width={22} height={h - 24} fill={dk(color, 0.18)} />
    <rect x={-w / 2 + 20} y={-h + 22} width={w - 40} height={22} fill={dk(color, 0.22)} />
    <rect x={-w / 2} y={-h} width={w} height={24} rx={4} fill={color} />
    <rect x={-w / 2} y={-h} width={w} height={7} rx={3} fill={lt(color, 0.22)} />
  </g>
);

/** Writing desk with drawer pedestal on the right. origin = floor centre. default 440×170. */
export const Desk: React.FC<Place & {w?: number; h?: number; color?: string}> = ({w = 440, h = 170, color = C.wood, ...p}) => {
  const pw = w * 0.34;
  const px = w / 2 - pw - 10;
  return (
    <g transform={tf(p)}>
      <rect x={-w / 2 + 18} y={-h + 24} width={22} height={h - 24} fill={color} />
      <rect x={-w / 2 + 18} y={-h + 22} width={w - 40} height={20} fill={dk(color, 0.22)} />
      <rect x={px} y={-h + 24} width={pw} height={h - 24} fill={color} />
      <rect x={px + pw - 14} y={-h + 24} width={14} height={h - 24} fill={dk(color, 0.15)} />
      {[0, 1, 2].map((i) => {
        const dh = (h - 44) / 3;
        const dy = -h + 32 + i * dh;
        return (
          <g key={i}>
            <rect x={px + 10} y={dy} width={pw - 30} height={dh - 8} rx={3} fill={dk(color, 0.1)} />
            <rect x={px + 10} y={dy + dh - 12} width={pw - 30} height={4} fill={lt(color, 0.18)} />
            <circle cx={px + pw / 2 - 5} cy={dy + dh / 2 - 4} r={6} fill={BRASS} />
          </g>
        );
      })}
      <rect x={-w / 2} y={-h} width={w} height={24} rx={4} fill={color} />
      <rect x={-w / 2} y={-h} width={w} height={7} rx={3} fill={lt(color, 0.22)} />
    </g>
  );
};

/** Chair, side view; the sitter faces right (flip for left). origin = floor centre. ~130×240. */
export const Chair: React.FC<Place & {h?: number; color?: string}> = ({h = 240, color = C.wood, ...p}) => {
  const seat = h * 0.47;
  return (
    <g transform={tf(p)}>
      <rect x={42} y={-seat} width={16} height={seat} fill={dk(color, 0.18)} />
      <path d={`M-58 0 L-40 0 L-44 ${-seat} L-54 ${-h + 8} Q-56 ${-h - 4} -66 ${-h} L-72 ${-h + 6} L-60 ${-seat} Z`} fill={color} />
      <path d={`M-52 ${-h + 30} L-47 ${-seat - 8}`} stroke={lt(color, 0.18)} strokeWidth={5} strokeLinecap="round" />
      <rect x={-66} y={-h * 0.86} width={18} height={14} rx={3} fill={dk(color, 0.22)} />
      <rect x={-62} y={-h * 0.68} width={18} height={14} rx={3} fill={dk(color, 0.22)} />
      <rect x={-62} y={-seat - 6} width={128} height={18} rx={5} fill={color} />
      <rect x={-62} y={-seat - 6} width={128} height={6} rx={3} fill={lt(color, 0.2)} />
      <rect x={-46} y={-seat * 0.35} width={96} height={9} fill={dk(color, 0.25)} />
    </g>
  );
};

/** Bed (side view): headboard left, mattress, blanket, pillow, footboard. origin = floor centre. default w 560. */
export const Bed: React.FC<Place & {w?: number; frame?: string; blanket?: string; pillow?: string; sheet?: string}> = ({
  w = 560,
  frame = C.wood,
  blanket = mixC(C.theoryLight, C.paperShade, 0.35),
  pillow = C.paperLight,
  sheet = C.paperLight,
  ...p
}) => {
  const L = -w / 2;
  const R = w / 2;
  return (
    <g transform={tf(p)}>
      <rect x={L} y={-270} width={26} height={270} rx={8} fill={frame} />
      <rect x={L + 4} y={-262} width={8} height={240} fill={lt(frame, 0.18)} />
      <rect x={L + 20} y={-110} width={w - 40} height={40} fill={dk(frame, 0.15)} />
      <rect x={L + 26} y={-70} width={16} height={70} fill={frame} />
      <rect x={R - 46} y={-70} width={16} height={70} fill={dk(frame, 0.2)} />
      <rect x={L + 26} y={-160} width={w - 50} height={52} rx={14} fill={sheet} />
      <path d={`M${L + 34} -170 Q${L + 30} -212 ${L + 80} -210 L${L + 150} -206 Q${L + 178} -196 ${L + 168} -170 Z`} fill={pillow} />
      <path d={`M${L + 40} -172 L${L + 166} -172`} stroke={dk(pillow, 0.12)} strokeWidth={6} strokeLinecap="round" />
      <path d={`M${L + 150} -176 Q${L + 260} -196 ${R - 60} -172 L${R - 30} -172 L${R - 24} -88 Q${R - 60} -80 ${R - 90} -96 L${L + 150} -104 Z`} fill={blanket} />
      <path d={`M${L + 150} -120 L${R - 30} -116 L${R - 24} -88 Q${R - 60} -80 ${R - 90} -96 L${L + 150} -104 Z`} fill={dk(blanket, 0.14)} />
      <path d={`M${L + 150} -176 Q${L + 168} -150 ${L + 150} -104 L${L + 136} -104 Q${L + 152} -150 ${L + 136} -176 Z`} fill={sheet} />
      <rect x={R - 26} y={-180} width={26} height={180} rx={8} fill={dk(frame, 0.08)} />
      <rect x={R - 22} y={-172} width={7} height={150} fill={lt(frame, 0.15)} />
    </g>
  );
};

/** Bookshelf filled with seeded books (some leaning, a few objects). origin = floor centre. default 300×520. */
export const Bookshelf: React.FC<Place & {w?: number; h?: number; seed?: number; color?: string; shelves?: number; fill?: number}> = ({
  w = 300,
  h = 520,
  seed = 1,
  color = C.woodDark,
  shelves,
  fill = 0.9,
  ...p
}) => {
  const n = shelves ?? Math.max(2, Math.round(h / 130));
  const side = 16;
  const top = -h;
  const inner = dk(color, 0.4);
  const sh = (h - 46) / n;
  const out: React.ReactNode[] = [];
  let k = 0;
  for (let i = 0; i < n; i++) {
    const by = top + 30 + (i + 1) * sh - 12;
    let x = -w / 2 + side + 6;
    const maxX = w / 2 - side - 4;
    for (let j = 0; x < maxX; j++) {
      const s = seed * 131 + i * 37 + j * 3.3;
      const bw = randRange(s, 14, 30);
      if (x + bw > maxX) break;
      if (rand(s + 1) > fill) {
        x += bw + 6;
        continue;
      }
      const bh = (sh - 16) * randRange(s + 2, 0.62, 0.92);
      const c = pick(BOOK_COLORS, s + 3);
      if (rand(s + 4) < 0.07 && x + 40 < maxX) {
        out.push(<rect key={k++} x={x} y={by - bh} width={bw} height={bh} fill={c} transform={`rotate(18 ${x + bw} ${by})`} />);
        x += bw + 18;
        continue;
      }
      if (rand(s + 5) < 0.05 && x + 46 < maxX) {
        out.push(<path key={k++} d={`M${x + 4} ${by} L${x + 8} ${by - 34} Q${x + 20} ${by - 46} ${x + 32} ${by - 34} L${x + 36} ${by} Z`} fill={pick([C.water, C.boneShade, C.stone], s + 6)} />);
        x += 44;
        continue;
      }
      out.push(<rect key={k++} x={x} y={by - bh} width={bw} height={bh} fill={c} />);
      out.push(<rect key={k++} x={x} y={by - bh + bh * 0.14} width={bw} height={4} fill={lt(c, 0.3)} opacity={0.7} />);
      if (bw > 20) out.push(<rect key={k++} x={x} y={by - bh * 0.3} width={bw} height={4} fill={lt(c, 0.3)} opacity={0.7} />);
      out.push(<rect key={k++} x={x + bw - 4} y={by - bh} width={4} height={bh} fill={C.ink} opacity={0.18} />);
      x += bw + (rand(s + 7) < 0.15 ? 4 : 1);
    }
  }
  return (
    <g transform={tf(p)}>
      <rect x={-w / 2} y={top} width={w} height={h} fill={color} />
      <rect x={-w / 2 + side} y={top + 30} width={w - 2 * side} height={h - 46} fill={inner} />
      {out}
      {Array.from({length: n}, (_, i) => {
        const by = top + 30 + (i + 1) * sh - 12;
        return (
          <g key={i}>
            <rect x={-w / 2 + side} y={by} width={w - 2 * side} height={14} fill={color} />
            <rect x={-w / 2 + side} y={by} width={w - 2 * side} height={4} fill={lt(color, 0.18)} />
            <rect x={-w / 2 + side} y={by + 14} width={w - 2 * side} height={8} fill={C.ink} opacity={0.25} />
          </g>
        );
      })}
      <rect x={-w / 2 + side} y={top + 30} width={14} height={h - 46} fill={C.ink} opacity={0.2} />
      <rect x={-w / 2 - 10} y={top} width={w + 20} height={24} fill={color} />
      <rect x={-w / 2 - 10} y={top} width={w + 20} height={6} fill={lt(color, 0.2)} />
      <rect x={w / 2 - side} y={top + 24} width={side} height={h - 24} fill={dk(color, 0.15)} />
    </g>
  );
};

/** Horizontal stack of books (seeded). origin = bottom centre. */
export const BookStack: React.FC<Place & {n?: number; w?: number; seed?: number}> = ({n = 4, w = 150, seed = 1, ...p}) => {
  let y = 0;
  return (
    <g transform={tf(p)}>
      {Array.from({length: n}, (_, i) => {
        const s = seed * 17 + i * 5;
        const bh = randRange(s, 18, 28);
        const bw = w * randRange(s + 1, 0.78, 1.05);
        const off = randRange(s + 2, -12, 12);
        const c = pick(BOOK_COLORS, s + 3);
        y -= bh;
        const pages = rand(s + 4) > 0.5;
        return (
          <g key={i}>
            <rect x={-bw / 2 + off} y={y} width={bw} height={bh} rx={3} fill={c} />
            {pages ? (
              <rect x={-bw / 2 + off + 8} y={y + 4} width={bw - 12} height={bh - 8} fill={C.paperLight} />
            ) : (
              <>
                <rect x={-bw / 2 + off + bw * 0.12} y={y} width={5} height={bh} fill={lt(c, 0.3)} />
                <rect x={-bw / 2 + off + bw * 0.82} y={y} width={5} height={bh} fill={lt(c, 0.3)} />
              </>
            )}
            <rect x={-bw / 2 + off} y={y + bh - 4} width={bw} height={4} fill={C.ink} opacity={0.15} />
          </g>
        );
      })}
    </g>
  );
};

/** Oil lamp (brass font, glass chimney, flame + glow). origin = base centre. ~150 tall. */
export const OilLamp: React.FC<Place & {t?: number; lit?: boolean; color?: string; glow?: number}> = ({t = 0, lit = true, color = BRASS, glow = 1, ...p}) => (
  <g transform={tf(p)}>
    {lit && glow > 0 && <LightPool x={0} y={-90} r={300} strength={1.3 * glow} />}
    <path d="M-40 0 L-30 -16 L30 -16 L40 0 Z" fill={color} />
    <rect x={-8} y={-44} width={16} height={30} fill={dk(color, 0.1)} />
    <ellipse cx={0} cy={-62} rx={36} ry={24} fill={color} />
    <path d="M10 -84 A36 24 0 0 1 36 -62 A36 24 0 0 1 10 -40 Z" fill={dk(color, 0.18)} />
    <ellipse cx={-14} cy={-70} rx={10} ry={5} fill={lt(color, 0.4)} />
    <rect x={-18} y={-92} width={36} height={12} rx={3} fill={dk(color, 0.12)} />
    {lit && <Flame t={t} x={0} y={-96} s={0.34} glow={false} />}
    <path d="M-12 -92 Q-28 -118 -12 -140 L-10 -162 L10 -162 L12 -140 Q28 -118 12 -92 Z" fill={C.paperLight} opacity={0.4} />
    <path d="M-8 -100 Q-18 -118 -8 -134" fill="none" stroke={C.paperLight} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
    <circle cx={22} cy={-86} r={5} fill={dk(color, 0.2)} />
  </g>
);

/** Candle on a dish holder (flame flicker by t). origin = base centre. default candle 90 tall. */
export const Candle: React.FC<Place & {t?: number; lit?: boolean; h?: number; color?: string; holder?: string; glow?: number}> = ({t = 0, lit = true, h = 90, color = C.bone, holder = BRASS, glow = 1, ...p}) => (
  <g transform={tf(p)}>
    {lit && glow > 0 && <LightPool x={0} y={-h - 30} r={200} strength={1.2 * glow} />}
    <ellipse cx={0} cy={-6} rx={42} ry={9} fill={holder} />
    <rect x={-42} y={-8} width={84} height={8} rx={4} fill={dk(holder, 0.15)} />
    <rect x={-17} y={-h - 8} width={34} height={h} rx={3} fill={color} />
    <rect x={7} y={-h - 8} width={10} height={h} fill={dk(color, 0.12)} />
    <path d={`M-17 ${-h - 6} Q-12 ${-h + 18} -8 ${-h + 8} L-6 ${-h - 6} Z`} fill={lt(color, 0.3)} />
    <line x1={0} y1={-h - 8} x2={0} y2={-h - 18} stroke={C.ink} strokeWidth={3} />
    {lit && <Flame t={t} x={0} y={-h - 12} s={0.3} glow={false} />}
  </g>
);

/** Wall torch: iron bracket, wooden handle, pitch bowl, big flame. origin = bottom of handle. ~260 tall incl. flame. */
export const Torch: React.FC<Place & {t?: number; lit?: boolean; seed?: number; glow?: number}> = ({t = 0, lit = true, seed = 1, glow = 1, ...p}) => (
  <g transform={tf(p)}>
    {lit && glow > 0 && <LightPool x={0} y={-190} r={340} strength={1.4 * glow} />}
    <rect x={-32} y={-88} width={14} height={50} fill={IRON} />
    <rect x={-32} y={-74} width={30} height={10} fill={IRON} />
    <path d="M-10 0 L-14 -150 L14 -150 L10 0 Z" fill={C.woodDark} />
    <path d="M2 0 L4 -150 L14 -150 L10 0 Z" fill={dk(C.woodDark, 0.25)} />
    <rect x={-18} y={-80} width={36} height={10} rx={3} fill={IRON} />
    <path d="M-30 -168 L30 -168 L18 -142 L-18 -142 Z" fill={IRON} />
    <rect x={-32} y={-174} width={64} height={10} rx={3} fill={dk(IRON, 0.2)} />
    {lit && <Flame t={t} x={0} y={-170} s={0.95} seed={seed} glow={false} />}
  </g>
);

/** Bathtub. kind wood = medieval stave tub with hoops + linen; modern = clawfoot enamel tub. origin = floor centre.
 *  part: 'back' (rim + water, draw before a bather) / 'front' (body, draw after) / 'all'. */
export const Bathtub: React.FC<Place & {kind?: 'wood' | 'modern'; w?: number; t?: number; water?: string; color?: string; linen?: boolean; part?: 'all' | 'back' | 'front'}> = ({
  kind = 'wood',
  w = 380,
  t = 0,
  water = mixC(C.water, C.paperShade, 0.25),
  color,
  linen = true,
  part = 'all',
  ...p
}) => {
  const hw = w / 2;
  const back = part !== 'front';
  const front = part !== 'back';
  if (kind === 'modern') {
    const h = w * 0.36;
    const c = color ?? C.paperLight;
    const ry = w * 0.05;
    return (
      <g transform={tf(p)}>
        {back && (
          <>
            <path d={`M${-hw + 30} ${-h - 10} L${-hw + 30} ${-h - 70} Q${-hw + 30} ${-h - 96} ${-hw + 60} ${-h - 96} Q${-hw + 86} ${-h - 96} ${-hw + 86} ${-h - 70}`} fill="none" stroke={C.metal} strokeWidth={10} strokeLinecap="round" />
            <ellipse cx={0} cy={-h - 4} rx={hw - 8} ry={ry} fill={c} />
            <ellipse cx={0} cy={-h - 2} rx={hw - 22} ry={ry - 6} fill={water} />
            <path d={`M${-hw * 0.4 + drift(t, 3, 12)} ${-h - 2} l50 0 M${hw * 0.15 + drift(t, 4, 10, 1)} ${-h + 1} l70 0`} stroke={lt(water, 0.45)} strokeWidth={4} strokeLinecap="round" />
          </>
        )}
        {front && (
          <>
            {[-1, 1].map((sx) => (
              <path key={sx} d={`M${sx * hw * 0.62} ${-h * 0.2} L${sx * hw * 0.66} -14 Q${sx * hw * 0.7} 0 ${sx * (hw * 0.66 + 16)} 0 L${sx * (hw * 0.66 - 14)} 0 Z`} fill={C.metal} />
            ))}
            <path d={`M${-hw} ${-h} C${-hw} ${-h * 0.25} ${-hw * 0.82} ${-h * 0.1} ${-hw * 0.6} ${-h * 0.1} L${hw * 0.6} ${-h * 0.1} C${hw * 0.82} ${-h * 0.1} ${hw} ${-h * 0.25} ${hw} ${-h} A${hw} ${ry} 0 0 1 ${-hw} ${-h} Z`} fill={c} />
            <path d={`M${-hw * 0.95} ${-h * 0.45} C${-hw * 0.8} ${-h * 0.2} ${-hw * 0.7} ${-h * 0.18} ${-hw * 0.5} ${-h * 0.18} L${hw * 0.6} ${-h * 0.18} C${hw * 0.82} ${-h * 0.18} ${hw} ${-h * 0.3} ${hw} ${-h * 0.6} L${hw} ${-h * 0.25} C${hw} ${-h * 0.25} ${hw * 0.82} ${-h * 0.1} ${hw * 0.6} ${-h * 0.1} L${-hw * 0.6} ${-h * 0.1} C${-hw * 0.82} ${-h * 0.1} ${-hw} ${-h * 0.25} ${-hw * 0.95} ${-h * 0.45} Z`} fill={dk(c, 0.12)} />
            <path d={`M${-hw - 6} ${-h} A${hw + 6} ${ry + 2} 0 0 0 ${hw + 6} ${-h}`} fill="none" stroke={lt(c, 0.3)} strokeWidth={14} strokeLinecap="round" />
          </>
        )}
      </g>
    );
  }
  const h = w * 0.46;
  const c = color ?? C.wood;
  const ry = w * 0.075;
  const arcY = (x: number, yb: number, rx: number) => yb + ry * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2));
  const shadePts: string[] = [];
  for (let i = 0; i <= 8; i++) {
    const x = lerp(hw * 0.5, hw, i / 8);
    shadePts.push(`${x} ${arcY(x, -h, hw)}`);
  }
  return (
    <g transform={tf(p)}>
      {back && (
        <>
          <ellipse cx={0} cy={-h} rx={hw} ry={ry} fill={lt(c, 0.15)} />
          <ellipse cx={0} cy={-h + 3} rx={hw - 16} ry={ry - 6} fill={water} />
          <g stroke={lt(water, 0.45)} strokeWidth={4} strokeLinecap="round">
            <path d={`M${-hw * 0.5 + drift(t, 3, 14)} ${-h + 2} l60 0`} />
            <path d={`M${hw * 0.1 + drift(t, 4, 12, 2)} ${-h + 7} l80 0`} />
          </g>
        </>
      )}
      {front && (
        <>
          <path d={`M${-hw} ${-h} A${hw} ${ry} 0 0 0 ${hw} ${-h} L${hw * 0.92} -10 Q${hw * 0.92} 0 ${hw * 0.88} 0 L${-hw * 0.88} 0 Q${-hw * 0.92} 0 ${-hw * 0.92} -10 Z`} fill={c} />
          <path d={`M${shadePts.join(' L')} L${hw * 0.92} -10 Q${hw * 0.92} 0 ${hw * 0.88} 0 L${hw * 0.46} 0 Z`} fill={dk(c, 0.18)} />
          <g stroke={dk(c, 0.25)} strokeWidth={4} opacity={0.55}>
            {Array.from({length: 7}, (_, i) => {
              const fx = -0.75 + i * 0.25;
              const xt = fx * hw;
              return <line key={i} x1={xt} y1={arcY(xt, -h, hw) + 4} x2={xt * 0.92} y2={-4} />;
            })}
          </g>
          {[0.28, 0.78].map((f, i) => {
            const rx = hw * lerp(1, 0.92, f);
            const yb = -h + h * f;
            return <path key={i} d={`M${-rx} ${yb - ry * 0.4} A${rx} ${ry} 0 0 0 ${rx} ${yb - ry * 0.4}`} fill="none" stroke={IRON} strokeWidth={12} />;
          })}
          <path d={`M${-hw} ${-h} A${hw} ${ry} 0 0 0 ${hw} ${-h}`} fill="none" stroke={lt(c, 0.2)} strokeWidth={12} />
          {linen && (
            <path
              d={`M${-hw * 0.7} ${arcY(-hw * 0.7, -h, hw) - 6} A${hw} ${ry} 0 0 0 ${hw * 0.25} ${arcY(hw * 0.25, -h, hw) - 6} L${hw * 0.22} ${-h + ry + 40} Q${hw * 0.12} ${-h + ry + 54} ${hw * 0.02} ${-h + ry + 40} Q${-hw * 0.1} ${-h + ry + 58} ${-hw * 0.24} ${-h + ry + 42} Q${-hw * 0.4} ${-h + ry + 56} ${-hw * 0.52} ${-h + ry + 38} Q${-hw * 0.64} ${-h + ry + 46} ${-hw * 0.7} ${-h + 40} Z`}
              fill={C.bone}
            />
          )}
        </>
      )}
    </g>
  );
};

/** Wooden bucket with hoops and handle (optional water). origin = base centre. ~90×100. */
export const Bucket: React.FC<Place & {w?: number; color?: string; water?: boolean}> = ({w = 90, color = C.wood, water = true, ...p}) => {
  const h = w * 1.05;
  const hw = w / 2;
  return (
    <g transform={tf(p)}>
      <path d={`M${-hw} ${-h} Q0 ${-h - w * 0.9} ${hw} ${-h}`} fill="none" stroke={IRON} strokeWidth={5} />
      <ellipse cx={0} cy={-h} rx={hw} ry={w * 0.1} fill={lt(color, 0.15)} />
      <ellipse cx={0} cy={-h + 2} rx={hw - 8} ry={w * 0.06} fill={water ? C.water : dk(color, 0.4)} />
      <path d={`M${-hw} ${-h} A${hw} ${w * 0.1} 0 0 0 ${hw} ${-h} L${hw * 0.82} 0 L${-hw * 0.82} 0 Z`} fill={color} />
      <path d={`M${hw * 0.5} ${-h + w * 0.08} L${hw} ${-h} L${hw * 0.82} 0 L${hw * 0.42} 0 Z`} fill={dk(color, 0.18)} />
      {[0.25, 0.75].map((f, i) => (
        <rect key={i} x={-hw * lerp(1, 0.82, f)} y={-h + h * f} width={w * lerp(1, 0.82, f)} height={7} fill={IRON} />
      ))}
    </g>
  );
};

/** Potted plant. kind leafy | tall (snake plant) | bush. origin = base of pot. ~100–200 tall. */
export const Plant: React.FC<Place & {kind?: 'leafy' | 'tall' | 'bush'; seed?: number; t?: number; pot?: string; color?: string}> = ({
  kind = 'leafy',
  seed = 1,
  t = 0,
  pot = mixC(C.oxLight, C.paperDark, 0.45),
  color = C.evidenceLight,
  ...p
}) => {
  const sh = dk(color, 0.22);
  const sway = drift(t, 3.5, 2, seed);
  const leaves: React.ReactNode[] = [];
  if (kind === 'tall') {
    for (let i = 0; i < 6; i++) {
      const s = seed * 7 + i;
      const a = -24 + i * 9.5 + randRange(s, -3, 3);
      const L = randRange(s + 1, 110, 170);
      leaves.push(<path key={i} d={`M-7 0 Q-12 ${-L * 0.6} 0 ${-L} Q12 ${-L * 0.6} 7 0 Z`} fill={i % 2 ? sh : color} transform={`translate(0 -76) rotate(${a + sway})`} />);
    }
  } else if (kind === 'bush') {
    leaves.push(<circle key="a" cx={4} cy={-120} r={52} fill={sh} />);
    leaves.push(<circle key="b" cx={-4} cy={-128} r={44} fill={color} />);
    leaves.push(<circle key="c" cx={-30} cy={-100} r={30} fill={color} />);
  } else {
    for (let i = 0; i < 9; i++) {
      const s = seed * 7 + i;
      const a = -75 + i * 18.7 + randRange(s, -6, 6);
      const L = randRange(s + 1, 70, 120) * (1 - Math.abs(a) / 220);
      const lw = L * 0.32;
      leaves.push(<path key={i} d={`M0 0 Q${lw} ${-L * 0.5} 0 ${-L} Q${-lw} ${-L * 0.5} 0 0 Z`} fill={a > 8 ? sh : color} transform={`translate(0 -76) rotate(${a + sway * (0.5 + rand(s + 2))})`} />);
    }
  }
  return (
    <g transform={tf(p)}>
      {leaves}
      <path d="M-46 -80 L46 -80 L36 0 L-36 0 Z" fill={pot} />
      <path d="M14 -80 L46 -80 L36 0 L10 0 Z" fill={dk(pot, 0.15)} />
      <rect x={-52} y={-86} width={104} height={20} rx={4} fill={lt(pot, 0.1)} />
    </g>
  );
};

/** Barrel with bulging staves and iron hoops. origin = base centre. default 150×200. */
export const Barrel: React.FC<Place & {w?: number; h?: number; color?: string}> = ({w = 150, h = 200, color = C.wood, ...p}) => {
  const a = w * 0.42;
  const b = w * 0.56;
  return (
    <g transform={tf(p)}>
      <path d={`M${-a} 0 Q${-b} ${-h / 2} ${-a} ${-h} L${a} ${-h} Q${b} ${-h / 2} ${a} 0 Z`} fill={color} />
      <path d={`M${a * 0.55} ${-h} Q${a * 0.75} ${-h / 2} ${a * 0.55} 0 L${a} 0 Q${b} ${-h / 2} ${a} ${-h} Z`} fill={dk(color, 0.18)} />
      <g stroke={dk(color, 0.25)} strokeWidth={4} opacity={0.5} fill="none">
        {[-0.55, -0.15, 0.25].map((f, i) => (
          <path key={i} d={`M${f * a} 0 Q${f * b} ${-h / 2} ${f * a} ${-h}`} />
        ))}
      </g>
      {[0.1, 0.3, 0.7, 0.9].map((f, i) => {
        const yy = -h * f;
        const half = a + (b - a) * 2 * f * (1 - f) + 2;
        return <rect key={i} x={-half} y={yy - 5} width={half * 2} height={10} fill={IRON} />;
      })}
      <ellipse cx={0} cy={-h} rx={a} ry={9} fill={lt(color, 0.2)} />
    </g>
  );
};

/** Iron cauldron on legs, bubbling liquid, optional steam + fire. origin = floor centre. default w 220. */
export const Cauldron: React.FC<Place & {w?: number; t?: number; steam?: boolean; fire?: boolean; liquid?: string; color?: string}> = ({
  w = 220,
  t = 0,
  steam = true,
  fire = false,
  liquid = mixC(C.evidenceLight, C.water, 0.4),
  color = C.inkLift,
  ...p
}) => {
  const hw = w / 2;
  const cy = -w * 0.42;
  return (
    <g transform={tf(p)}>
      {fire && (
        <g>
          <rect x={-hw * 0.6} y={-18} width={hw * 1.2} height={16} rx={8} fill={C.woodDark} transform="rotate(-6)" />
          <rect x={-hw * 0.6} y={-18} width={hw * 1.2} height={16} rx={8} fill={C.wood} transform="rotate(6)" />
          <Flame t={t} x={-hw * 0.25} y={-14} s={0.5} seed={2} glow={false} />
          <Flame t={t} x={hw * 0.2} y={-12} s={0.42} seed={5} glow={false} />
          <LightPool x={0} y={-30} r={w * 1.1} strength={1.2} />
        </g>
      )}
      {[-0.6, 0, 0.6].map((f, i) => (
        <rect key={i} x={f * hw - 8} y={cy + w * 0.3} width={16} height={-cy - w * 0.3 - (fire ? 22 : 0)} fill={dk(color, 0.2)} />
      ))}
      <ellipse cx={0} cy={cy} rx={hw} ry={w * 0.36} fill={color} />
      <path d={`M${hw * 0.35} ${cy - w * 0.34} A${hw} ${w * 0.36} 0 0 1 ${hw * 0.35} ${cy + w * 0.34} A${hw * 0.75} ${w * 0.36} 0 0 0 ${hw * 0.35} ${cy - w * 0.34} Z`} fill={dk(color, 0.25)} />
      <path d={`M${-hw * 0.75} ${cy - w * 0.1} Q${-hw * 0.7} ${cy - w * 0.26} ${-hw * 0.4} ${cy - w * 0.3}`} fill="none" stroke={lt(color, 0.2)} strokeWidth={8} strokeLinecap="round" />
      <circle cx={-hw - 4} cy={cy - w * 0.16} r={14} fill="none" stroke={dk(color, 0.2)} strokeWidth={7} />
      <circle cx={hw + 4} cy={cy - w * 0.16} r={14} fill="none" stroke={dk(color, 0.2)} strokeWidth={7} />
      <ellipse cx={0} cy={cy - w * 0.3} rx={hw * 0.86} ry={w * 0.07} fill={dk(color, 0.3)} />
      <ellipse cx={0} cy={cy - w * 0.29} rx={hw * 0.76} ry={w * 0.05} fill={liquid} />
      {Array.from({length: 4}, (_, i) => {
        const ph = (((t * 0.9 + i * 0.37) % 1) + 1) % 1;
        return <circle key={i} cx={(-0.5 + i * 0.33) * hw} cy={cy - w * 0.3 - ph * 8} r={4 + ph * 7} fill="none" stroke={lt(liquid, 0.4)} strokeWidth={3} opacity={1 - ph} />;
      })}
      <rect x={-hw * 0.92} y={cy - w * 0.36} width={hw * 1.84} height={w * 0.07} rx={w * 0.035} fill={dk(color, 0.1)} />
      {steam && <Steam t={t} x={0} y={cy - w * 0.36} w={w * 0.7} h={w * 1.4} n={4} />}
    </g>
  );
};

/** Unrolled parchment scroll with text lines. origin = TOP roll centre; `p` 0..1 unrolls downward. default 360×300. */
export const Scroll: React.FC<Place & {w?: number; h?: number; p?: number; color?: string; lines?: boolean; seed?: number}> = ({w = 360, h = 300, p: pr = 1, color = C.bone, lines = true, seed = 1, ...p}) => {
  const hh = Math.max(0, h * clamp01(pr));
  const roll = (y: number) => (
    <g>
      <rect x={-w / 2 - 14} y={y - 15} width={w + 28} height={30} rx={15} fill={C.boneShade} />
      <rect x={-w / 2 - 14} y={y - 15} width={w + 28} height={10} rx={5} fill={lt(color, 0.3)} />
      <rect x={-w / 2 - 30} y={y - 8} width={18} height={16} rx={6} fill={C.woodDark} />
      <rect x={w / 2 + 12} y={y - 8} width={18} height={16} rx={6} fill={C.woodDark} />
    </g>
  );
  return (
    <g transform={tf(p)}>
      {hh > 0 && <rect x={-w / 2} y={0} width={w} height={hh} fill={color} />}
      {hh > 0 && <rect x={w / 2 - 14} y={0} width={14} height={hh} fill={C.boneShade} />}
      {lines &&
        Array.from({length: Math.floor((hh - 50) / 32)}, (_, i) => (
          <line key={i} x1={-w / 2 + 34} y1={40 + i * 32} x2={-w / 2 + 34 + (w - 80) * randRange(seed * 3 + i, 0.55, 1)} y2={40 + i * 32} stroke={C.ink} strokeWidth={6} strokeLinecap="round" opacity={0.2} />
        ))}
      {roll(0)}
      {roll(hh)}
    </g>
  );
};

/** Plain wooden bench. origin = floor centre. default 420×110. */
export const Bench: React.FC<Place & {w?: number; h?: number; color?: string}> = ({w = 420, h = 110, color = C.wood, ...p}) => (
  <g transform={tf(p)}>
    <rect x={-w / 2 + 40} y={-h + 18} width={28} height={h - 18} fill={color} />
    <rect x={w / 2 - 68} y={-h + 18} width={28} height={h - 18} fill={dk(color, 0.18)} />
    <rect x={-w / 2 + 50} y={-h * 0.4} width={w - 100} height={12} fill={dk(color, 0.22)} />
    <rect x={-w / 2} y={-h} width={w} height={24} rx={5} fill={color} />
    <rect x={-w / 2} y={-h} width={w} height={7} rx={3} fill={lt(color, 0.22)} />
  </g>
);

/** Lantern (iron frame, glass, flame + glow). origin = base centre; `chain` px of chain drawn above the ring. */
export const Lantern: React.FC<Place & {t?: number; lit?: boolean; chain?: number; color?: string; glow?: number}> = ({t = 0, lit = true, chain = 0, color = C.inkSoft, glow = 1, ...p}) => (
  <g transform={tf(p)}>
    {lit && glow > 0 && <LightPool x={0} y={-56} r={230} strength={1.3 * glow} />}
    {chain > 0 && <line x1={0} y1={-146} x2={0} y2={-146 - chain} stroke={color} strokeWidth={5} strokeDasharray="10 5" />}
    <circle cx={0} cy={-138} r={9} fill="none" stroke={color} strokeWidth={5} />
    <rect x={-30} y={-96} width={60} height={84} fill={lit ? C.lamp : mixC(C.paperShade, C.water, 0.3)} opacity={lit ? 1 : 0.7} />
    {lit && <Flame t={t} x={0} y={-24} s={0.28} glow={false} />}
    <g fill={color}>
      <rect x={-34} y={-98} width={8} height={88} />
      <rect x={26} y={-98} width={8} height={88} />
      <rect x={-3} y={-96} width={6} height={84} opacity={0.7} />
      <path d="M-46 -94 L0 -130 L46 -94 Z" />
      <rect x={-40} y={-14} width={80} height={14} rx={3} />
    </g>
    <path d="M0 -130 L46 -94 L0 -94 Z" fill={dk(color, 0.25)} />
  </g>
);

/** Wall clock with hands driven by `time` (hours, 0–12, e.g. 3.5 = 3:30); optional pendulum case swinging with t. origin = face centre. */
export const Clock: React.FC<Place & {time?: number; r?: number; t?: number; pendulum?: boolean; color?: string; face?: string}> = ({
  time = 10.15,
  r = 90,
  t = 0,
  pendulum = false,
  color = C.wood,
  face = C.paperLight,
  ...p
}) => {
  const ma = ((time % 1) + 1) % 1 * 360;
  const ha = ((((time % 12) + 12) % 12) / 12) * 360;
  const sw = Math.sin(t * Math.PI) * 14;
  return (
    <g transform={tf(p)}>
      {pendulum && (
        <g>
          <rect x={-r * 0.62} y={0} width={r * 1.24} height={r * 3} rx={12} fill={color} />
          <rect x={r * 0.4} y={0} width={r * 0.22} height={r * 3} fill={dk(color, 0.15)} />
          <rect x={-r * 0.42} y={r * 1.15} width={r * 0.84} height={r * 1.6} rx={r * 0.42} fill={dk(color, 0.45)} />
          <g transform={`rotate(${sw} 0 ${r * 1.1})`}>
            <rect x={-3} y={r * 1.1} width={6} height={r * 1.2} fill={BRASS} />
            <circle cx={0} cy={r * 2.35} r={r * 0.22} fill={BRASS} />
            <circle cx={-r * 0.06} cy={r * 2.3} r={r * 0.08} fill={lt(BRASS, 0.4)} />
          </g>
        </g>
      )}
      <circle r={r + 14} fill={color} />
      <path d={`M${(r + 14) * 0.5} ${-(r + 14) * 0.87} A${r + 14} ${r + 14} 0 0 1 ${(r + 14) * 0.5} ${(r + 14) * 0.87} A${r + 6} ${r + 6} 0 0 0 ${(r + 14) * 0.5} ${-(r + 14) * 0.87} Z`} fill={dk(color, 0.2)} />
      <circle r={r} fill={face} />
      {Array.from({length: 12}, (_, i) => (
        <rect key={i} x={-3} y={-r + 8} width={6} height={i % 3 === 0 ? 18 : 10} fill={C.ink} transform={`rotate(${i * 30})`} />
      ))}
      <rect x={-5} y={-r * 0.5} width={10} height={r * 0.58} rx={5} fill={C.ink} transform={`rotate(${ha})`} />
      <rect x={-3.5} y={-r * 0.8} width={7} height={r * 0.88} rx={3.5} fill={C.ink} transform={`rotate(${ma})`} />
      <circle r={8} fill={C.ink} />
    </g>
  );
};

/** Hanging bell on a wooden yoke; `swing` (deg) × sin(t) rocks it. origin = top (hanging point). default r 80. */
export const Bell: React.FC<Place & {r?: number; t?: number; swing?: number; color?: string}> = ({r = 80, t = 0, swing = 0, color = mixC(C.caution, C.woodDark, 0.35), ...p}) => {
  const a = swing * Math.sin(t * 2.6);
  const body = `M${-0.42 * r} ${0.14 * r} C${-0.52 * r} ${0.14 * r} ${-0.5 * r} ${0.55 * r} ${-0.6 * r} ${0.9 * r} C${-0.66 * r} ${1.1 * r} ${-0.8 * r} ${1.2 * r} ${-0.82 * r} ${1.3 * r} L${0.82 * r} ${1.3 * r} C${0.8 * r} ${1.2 * r} ${0.66 * r} ${1.1 * r} ${0.6 * r} ${0.9 * r} C${0.5 * r} ${0.55 * r} ${0.52 * r} ${0.14 * r} ${0.42 * r} ${0.14 * r} Z`;
  return (
    <g transform={tf(p)}>
      <rect x={-r * 1.1} y={-18} width={r * 2.2} height={22} rx={4} fill={C.woodDark} />
      <g transform={`rotate(${a})`}>
        <rect x={-r * 0.16} y={-2} width={r * 0.32} height={r * 0.2} rx={4} fill={dk(color, 0.2)} />
        <g transform={`rotate(${-a * 0.6} 0 ${r * 0.2})`}>
          <rect x={-3} y={r * 0.6} width={6} height={r * 0.8} fill={IRON} />
          <circle cx={0} cy={r * 1.42} r={r * 0.12} fill={IRON} />
        </g>
        <path d={body} fill={color} />
        <path d={`M${0.1 * r} ${0.14 * r} L${0.42 * r} ${0.14 * r} C${0.52 * r} ${0.14 * r} ${0.5 * r} ${0.55 * r} ${0.6 * r} ${0.9 * r} C${0.66 * r} ${1.1 * r} ${0.8 * r} ${1.2 * r} ${0.82 * r} ${1.3 * r} L${0.36 * r} ${1.3 * r} C${0.34 * r} ${0.9 * r} ${0.24 * r} ${0.4 * r} ${0.1 * r} ${0.14 * r} Z`} fill={dk(color, 0.2)} />
        <path d={`M${-0.36 * r} ${0.3 * r} C${-0.4 * r} ${0.6 * r} ${-0.44 * r} ${0.85 * r} ${-0.56 * r} ${1.08 * r}`} fill="none" stroke={lt(color, 0.3)} strokeWidth={Math.max(4, r * 0.06)} strokeLinecap="round" />
        <rect x={-0.88 * r} y={1.22 * r} width={1.76 * r} height={0.14 * r} rx={0.07 * r} fill={dk(color, 0.1)} />
      </g>
    </g>
  );
};

/**
 * Flag or banner, waving with t. kind 'flag' = cloth on a pole (origin = foot of pole, pole height h);
 * 'hanging' = swallow-tailed banner on a rod (origin = rod centre, cloth hangs down h).
 */
export const Banner: React.FC<Place & {kind?: 'flag' | 'hanging'; w?: number; h?: number; t?: number; color?: string; emblem?: 'none' | 'circle' | 'cross' | 'stripe'; trim?: string}> = ({
  kind = 'hanging',
  w = 200,
  h = 320,
  t = 0,
  color = mixC(C.oxDeep, C.theory, 0.35),
  emblem = 'circle',
  trim = C.cautionTint,
  ...p
}) => {
  if (kind === 'flag') {
    const ch = w * 0.62;
    const top = -h + 10;
    const N = 10;
    const yOf = (k: number) => Math.sin(k * 0.9 - t * 4) * 12 * (k / N);
    const quads = Array.from({length: N}, (_, k) => {
      const xa = (k / N) * w;
      const xb = ((k + 1) / N) * w;
      const ya = yOf(k);
      const yb = yOf(k + 1);
      const shade = yb > ya;
      return <path key={k} d={`M${xa} ${top + ya} L${xb + 0.5} ${top + yb} L${xb + 0.5} ${top + yb + ch} L${xa} ${top + ya + ch} Z`} fill={shade ? dk(color, 0.15) : color} />;
    });
    return (
      <g transform={tf(p)}>
        {quads}
        {emblem === 'stripe' && <path d={`M0 ${top + ch * 0.42} ${Array.from({length: N + 1}, (_, k) => `L${(k / N) * w} ${top + yOf(k) + ch * 0.42}`).join(' ')} L${w} ${top + yOf(N) + ch * 0.58} ${Array.from({length: N + 1}, (_, k) => `L${((N - k) / N) * w} ${top + yOf(N - k) + ch * 0.58}`).join(' ')} Z`} fill={trim} />}
        {emblem === 'circle' && <circle cx={w * 0.42} cy={top + yOf(N * 0.42) + ch / 2} r={ch * 0.2} fill={trim} />}
        {emblem === 'cross' && (
          <g fill={trim}>
            <rect x={w * 0.3} y={top + yOf(3) + 0} width={ch * 0.14} height={ch} />
            <path d={`M0 ${top + ch * 0.43} ${Array.from({length: N + 1}, (_, k) => `L${(k / N) * w} ${top + yOf(k) + ch * 0.43}`).join(' ')} L${w} ${top + yOf(N) + ch * 0.57} L0 ${top + ch * 0.57} Z`} />
          </g>
        )}
        <rect x={-7} y={-h} width={14} height={h} fill={C.woodDark} />
        <circle cx={0} cy={-h - 6} r={11} fill={BRASS} />
      </g>
    );
  }
  const sw = drift(t, 3.6, 7);
  const fold = drift(t, 3.6, 1, 1.2);
  const tail = 56;
  const cloth = `M${-w / 2} 6 L${w / 2} 6 L${w / 2 + sw} ${h} L${sw} ${h - tail} L${-w / 2 + sw} ${h} Z`;
  const cy = h * 0.42;
  return (
    <g transform={tf(p)}>
      <path d={cloth} fill={color} />
      <path d={`M${w / 6} 6 L${w / 2} 6 L${w / 2 + sw} ${h} L${w / 6 + sw * 0.8 + fold * 4} ${h - tail * 0.66} Z`} fill={dk(color, 0.16)} />
      <path d={`M${-w / 2 + 16} 6 L${-w / 2 + 16 + sw * 0.9} ${h - 30} M${w / 2 - 16} 6 L${w / 2 - 16 + sw * 0.9} ${h - 30}`} stroke={trim} strokeWidth={6} opacity={0.8} />
      {emblem === 'circle' && <circle cx={sw * 0.42} cy={cy} r={w * 0.2} fill={trim} />}
      {emblem === 'circle' && <circle cx={sw * 0.42} cy={cy} r={w * 0.09} fill={color} />}
      {emblem === 'cross' && (
        <g fill={trim} transform={`translate(${sw * 0.42} ${cy})`}>
          <rect x={-w * 0.06} y={-w * 0.25} width={w * 0.12} height={w * 0.5} />
          <rect x={-w * 0.22} y={-w * 0.06} width={w * 0.44} height={w * 0.12} />
        </g>
      )}
      {emblem === 'stripe' && <path d={`M${-w / 2 + sw * 0.3} ${cy - 20} L${w / 2 + sw * 0.3} ${cy - 20} L${w / 2 + sw * 0.45} ${cy + 20} L${-w / 2 + sw * 0.45} ${cy + 20} Z`} fill={trim} />}
      <rect x={-w / 2 - 26} y={-6} width={w + 52} height={14} rx={7} fill={C.woodDark} />
      <circle cx={-w / 2 - 30} cy={1} r={11} fill={BRASS} />
      <circle cx={w / 2 + 30} cy={1} r={11} fill={BRASS} />
    </g>
  );
};

/** Museum plinth (dark stepped block with a blank label plate). origin = floor centre. default 600×90. */
export const Plinth: React.FC<Place & {w?: number; h?: number; color?: string; label?: boolean}> = ({w = 600, h = 90, color = C.inkSoft, label = true, ...p}) => (
  <g transform={tf(p)}>
    <rect x={-w / 2} y={-26} width={w} height={26} fill={dk(color, 0.2)} />
    <rect x={-w / 2 + 22} y={-h} width={w - 44} height={h - 26} fill={color} />
    <rect x={-w / 2 + 14} y={-h - 8} width={w - 28} height={14} fill={lt(color, 0.15)} />
    <rect x={w / 2 - 60} y={-h + 6} width={38} height={h - 32} fill={dk(color, 0.2)} />
    {label && <rect x={-90} y={-h + 18} width={180} height={28} rx={3} fill={C.paperDeep} />}
  </g>
);

/** Framed picture for walls: landscape | portrait | map | blank. origin = centre. default 300×220. */
export const Frame: React.FC<Place & {w?: number; h?: number; kind?: 'landscape' | 'portrait' | 'map' | 'blank'; color?: string}> = ({w = 300, h = 220, kind = 'landscape', color = C.woodDark, ...p}) => {
  const iw = w - 44;
  const ih = h - 44;
  return (
    <g transform={tf(p)}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={color} />
      <rect x={-w / 2} y={-h / 2} width={w} height={8} fill={lt(color, 0.2)} />
      <rect x={-iw / 2} y={-ih / 2} width={iw} height={ih} fill={kind === 'map' ? C.bone : C.paperDeep} />
      {kind === 'landscape' && (
        <g>
          <rect x={-iw / 2} y={-ih / 2} width={iw} height={ih * 0.6} fill={mixC(C.sky, C.water, 0.15)} />
          <path d={`M${-iw / 2} ${ih * 0.1} Q${-iw * 0.2} ${-ih * 0.2} ${iw * 0.05} ${ih * 0.05} Q${iw * 0.25} ${-ih * 0.12} ${iw / 2} ${ih * 0.08} L${iw / 2} ${ih / 2} L${-iw / 2} ${ih / 2} Z`} fill={mixC(C.evidenceLight, C.paperDark, 0.4)} />
          <circle cx={iw * 0.28} cy={-ih * 0.22} r={ih * 0.1} fill={C.paperLight} />
        </g>
      )}
      {kind === 'portrait' && (
        <g>
          <rect x={-iw / 2} y={-ih / 2} width={iw} height={ih} fill={mixC(C.inkLift, C.wood, 0.3)} />
          <path d={`M${-iw * 0.36} ${ih / 2} Q${-iw * 0.34} ${ih * 0.06} 0 ${ih * 0.04} Q${iw * 0.34} ${ih * 0.06} ${iw * 0.36} ${ih / 2} Z`} fill={C.inkSoft} />
          <ellipse cx={0} cy={-ih * 0.12} rx={iw * 0.15} ry={ih * 0.19} fill={C.skin[1]} />
        </g>
      )}
      {kind === 'map' && (
        <g fill="none" stroke={C.inkMute} strokeWidth={4} strokeLinecap="round" opacity={0.6}>
          <path d={`M${-iw * 0.4} ${-ih * 0.3} Q${-iw * 0.1} ${-ih * 0.4} ${-iw * 0.05} ${-ih * 0.1} Q${0} ${ih * 0.2} ${iw * 0.3} ${ih * 0.25}`} />
          <path d={`M${iw * 0.1} ${-ih * 0.35} Q${iw * 0.35} ${-ih * 0.3} ${iw * 0.38} ${-ih * 0.05}`} />
          <circle cx={-iw * 0.2} cy={ih * 0.2} r={10} />
        </g>
      )}
      <rect x={-iw / 2} y={-ih / 2} width={iw} height={10} fill={C.ink} opacity={0.15} />
    </g>
  );
};

// ------------------------------------------------------------------ INTERIORS

/** Interior era. */
export type RoomEra = 'medieval' | '19thc' | 'modern';
const ROOM: Record<RoomEra, {wall: string; floor: string; trim: string; window: 'arched' | 'square' | 'none'; wx: number; dx: number}> = {
  medieval: {wall: C.stone, floor: C.stoneShade, trim: C.woodDark, window: 'arched', wx: 560, dx: 1500},
  '19thc': {wall: mixC(C.cautionTint, C.paperShade, 0.45), floor: C.wood, trim: C.wood, window: 'square', wx: 540, dx: 1480},
  modern: {wall: mixC(C.paperShade, C.paperLight, 0.35), floor: C.woodLight, trim: C.paperLight, window: 'square', wx: 600, dx: 1520},
};

/** Floor band below ENV_FLOOR: planks | flagstones | tiles (perspective joints). origin = frame. */
export const Floor: React.FC<{y?: number; color?: string; kind?: 'planks' | 'flags' | 'tiles'; seed?: number}> = ({y = FL, color = C.wood, kind = 'planks', seed = 1}) => {
  const lines: React.ReactNode[] = [];
  const ys = [y + 24, y + 58, y + 102, y + 160, y + 236, y + 330];
  ys.forEach((yy, i) => {
    lines.push(<rect key={`h${i}`} x={X0} y={yy} width={X1 - X0} height={3 + i * 0.8} />);
    if (kind === 'planks' && i > 0) {
      const g = 300 + i * 120;
      for (let x = -200 + rand(seed + i) * g, j = 0; x < 2200; x += g, j++) lines.push(<rect key={`v${i}-${j}`} x={x} y={ys[i - 1]} width={3 + i * 0.6} height={yy - ys[i - 1]} />);
    }
    if (kind !== 'planks') {
      const g = kind === 'tiles' ? 120 + i * 50 : 180 + i * 80;
      const prev = i === 0 ? y : ys[i - 1];
      for (let x = -200 + (kind === 'tiles' ? 0 : (i % 2) * g * 0.5), j = 0; x < 2200; x += g, j++) {
        const xx = kind === 'tiles' ? 960 + (x - 960) * (1 + i * 0.12) : x;
        lines.push(<rect key={`v${i}-${j}`} x={xx} y={prev} width={3 + i * 0.6} height={yy - prev} />);
      }
    }
  });
  return (
    <g>
      <rect x={X0} y={y} width={X1 - X0} height={YB} fill={color} />
      <g fill={dk(color, 0.14)} opacity={0.6}>
        {lines}
      </g>
      <rect x={X0} y={y} width={X1 - X0} height={16} fill={C.ink} opacity={0.14} />
    </g>
  );
};

/**
 * Generic room interior (back wall + floor, floor line y = 820) for medieval / 19thc / modern.
 * Optional window (arched/square, with LightShaft and floor patch), door, night mode. origin = frame.
 */
export const Room: React.FC<{
  era?: RoomEra;
  wall?: string;
  floor?: string;
  trim?: string;
  window?: 'arched' | 'square' | 'none';
  windowX?: number;
  door?: boolean;
  doorX?: number;
  doorOpen?: number;
  light?: boolean;
  night?: boolean;
  sky?: Tone;
  t?: number;
  seed?: number;
}> = ({era = '19thc', wall, floor, trim, window, windowX, door = true, doorX, doorOpen = 0, light = true, night = false, sky, t = 0, seed = 1}) => {
  const D = ROOM[era];
  const nt = (c: string) => (night ? mixC(c, C.night, 0.55) : c);
  const W0 = nt(wall ?? D.wall);
  const F0 = nt(floor ?? D.floor);
  const T0 = nt(trim ?? D.trim);
  const win = window ?? D.window;
  const wx = windowX ?? D.wx;
  const dxp = doorX ?? D.dx;
  const sk: Tone = sky ?? (night ? 'night' : 'day');
  const out: React.ReactNode[] = [];
  let k = 0;
  out.push(<rect key={k++} x={X0} y={-400} width={X1 - X0} height={FL + 400} fill={W0} />);
  if (era === 'medieval') {
    for (let r = 0, yy = FL - 66; yy > -60; r++, yy -= 66) {
      for (let x = -200 + (r % 2) * 70 + rand(seed + r) * 40, j = 0; x < 2200; x += 140 + rand(seed * 3 + r * 7 + j) * 40, j++) {
        const s = seed * 19 + r * 31 + j;
        if (rand(s) > 0.38) continue;
        out.push(<rect key={k++} x={x} y={yy + 4} width={124} height={58} rx={8} fill={rand(s + 1) > 0.5 ? lt(W0, 0.07) : dk(W0, 0.06)} />);
      }
    }
    out.push(<rect key={k++} x={X0} y={-400} width={X1 - X0} height={460} fill={T0} />);
    out.push(<rect key={k++} x={X0} y={44} width={X1 - X0} height={16} fill={dk(T0, 0.25)} />);
    for (let bx = 120; bx < 2000; bx += 440) {
      out.push(<path key={k++} d={`M${bx - 30} 60 L${bx + 30} 60 L${bx + 18} 110 L${bx - 18} 110 Z`} fill={T0} />);
      out.push(<path key={k++} d={`M${bx + 6} 60 L${bx + 30} 60 L${bx + 18} 110 L${bx + 4} 110 Z`} fill={dk(T0, 0.2)} />);
    }
  } else if (era === '19thc') {
    for (let x = -180; x < 2140; x += 74) out.push(<rect key={k++} x={x} y={40} width={26} height={560} fill={dk(W0, 0.05)} />);
    out.push(<rect key={k++} x={X0} y={-400} width={X1 - X0} height={436} fill={lt(W0, 0.3)} />);
    out.push(<rect key={k++} x={X0} y={36} width={X1 - X0} height={10} fill={dk(W0, 0.15)} />);
    out.push(<rect key={k++} x={X0} y={246} width={X1 - X0} height={10} fill={T0} />);
    out.push(<rect key={k++} x={X0} y={600} width={X1 - X0} height={FL - 600} fill={T0} />);
    out.push(<rect key={k++} x={X0} y={592} width={X1 - X0} height={16} fill={lt(T0, 0.15)} />);
    out.push(<rect key={k++} x={X0} y={608} width={X1 - X0} height={6} fill={C.ink} opacity={0.15} />);
    for (let x = -160; x < 2140; x += 250) {
      out.push(<rect key={k++} x={x} y={632} width={200} height={150} fill={dk(T0, 0.1)} />);
      out.push(<rect key={k++} x={x} y={632} width={200} height={6} fill={dk(T0, 0.3)} opacity={0.5} />);
      out.push(<rect key={k++} x={x} y={778} width={200} height={4} fill={lt(T0, 0.2)} />);
    }
  } else {
    out.push(<rect key={k++} x={X0} y={-400} width={X1 - X0} height={430} fill={dk(W0, 0.05)} />);
    out.push(<rect key={k++} x={X0} y={FL - 26} width={X1 - X0} height={26} fill={T0} />);
    out.push(<rect key={k++} x={X0} y={FL - 26} width={X1 - X0} height={5} fill={lt(T0, 0.3)} />);
  }
  if (win !== 'none') {
    const ww = era === 'modern' ? 420 : era === 'medieval' ? 230 : 250;
    const wh = era === 'modern' ? 320 : era === 'medieval' ? 340 : 380;
    const sill = era === 'modern' ? 580 : era === 'medieval' ? 590 : 600;
    out.push(
      <Window
        key={k++}
        x={wx}
        y={sill}
        w={ww}
        h={wh}
        shape={win}
        sky={sk}
        t={t}
        seed={seed}
        frame={era === 'medieval' ? nt(C.inkLift) : nt(C.paperLight)}
        reveal={era === 'medieval' ? nt(C.stoneShade) : era === '19thc' ? nt(C.woodLight) : nt(lt(W0, 0.4))}
        curtains={era === '19thc'}
        curtainColor={nt(mixC(C.theory, C.wood, 0.35))}
      />,
    );
    if (light) {
      const top = sill - wh * 0.8;
      out.push(<LightShaft key={k++} x1={wx - ww / 2} x2={wx + ww / 2} y={top} dx={440} len={FL - top + 150} color={C.paperLight} strength={night ? 0.55 : 1} />);
    }
  }
  if (era === 'modern') {
    if (win !== 'none') {
      const rw = 300;
      out.push(<rect key={k++} x={wx - rw / 2} y={630} width={rw} height={110} rx={10} fill={lt(W0, 0.5)} />);
      for (let i = 1; i < 10; i++) out.push(<rect key={k++} x={wx - rw / 2 + (i * rw) / 10 - 3} y={642} width={6} height={86} rx={3} fill={dk(W0, 0.08)} />);
      out.push(<rect key={k++} x={wx - rw / 2 + 20} y={740} width={10} height={FL - 26 - 740} fill={dk(W0, 0.15)} />);
      out.push(<rect key={k++} x={wx + rw / 2 - 30} y={740} width={10} height={FL - 26 - 740} fill={dk(W0, 0.15)} />);
    }
    const lx = (wx + dxp) / 2 + 60;
    out.push(<line key={k++} x1={lx} y1={-10} x2={lx} y2={150} stroke={dk(W0, 0.5)} strokeWidth={4} />);
    out.push(<path key={k++} d={`M${lx - 70} 210 Q${lx - 64} 150 ${lx} 148 Q${lx + 64} 150 ${lx + 70} 210 Z`} fill={nt(C.inkSoft)} />);
    out.push(<path key={k++} d={`M${lx + 20} 150 Q${lx + 64} 152 ${lx + 70} 210 L${lx + 30} 210 Z`} fill={C.ink} opacity={0.4} />);
    out.push(<ellipse key={k++} cx={lx} cy={210} rx={44} ry={8} fill={night ? C.lamp : C.paperShade} />);
    if (night) out.push(<LightPool key={k++} x={lx} y={260} r={340} strength={1.3} />);
  }
  if (door) {
    out.push(
      <Door
        key={k++}
        x={dxp}
        y={FL}
        shape={era === 'medieval' ? 'arched' : 'square'}
        style={era === 'medieval' ? 'plank' : era === '19thc' ? 'panel' : 'flush'}
        w={era === 'modern' ? 180 : 200}
        h={era === 'medieval' ? 330 : 360}
        color={nt(era === 'modern' ? C.paperDeep : C.wood)}
        frame={nt(era === 'medieval' ? C.stoneShade : era === '19thc' ? C.woodLight : C.paperLight)}
        open={doorOpen}
      />,
    );
  }
  return (
    <g>
      {out}
      <Floor y={FL} color={F0} kind={era === 'medieval' ? 'flags' : 'planks'} seed={seed} />
      {win !== 'none' && light && (
        <path d={`M${wx - 80 + 330} ${FL + 24} L${wx + 120 + 330} ${FL + 24} L${wx + 230 + 360} ${FL + 140} L${wx - 10 + 360} ${FL + 140} Z`} fill={C.paperLight} opacity={night ? 0.1 : 0.18} />
      )}
    </g>
  );
};

/** Medieval public bathhouse: stone arcade, beams, wooden tubs (one under a linen canopy), steam, light shafts.
 *  layer: 'back' = room + tub backs (draw bathers after), 'front' = tub fronts + steam, 'all'. origin = frame. */
export const Bathhouse: React.FC<{t?: number; seed?: number; layer?: 'all' | 'back' | 'front'}> = ({t = 0, seed = 1, layer = 'all'}) => {
  const wall = mixC(C.stone, C.cautionTint, 0.22);
  const back = layer !== 'front';
  const front = layer !== 'back';
  const tubs: [number, number, number][] = [
    [460, 900, 460],
    [1470, 890, 420],
  ];
  const archXs = [240, 720, 1200, 1680];
  return (
    <g>
      {back && (
        <g>
          <rect x={X0} y={-400} width={X1 - X0} height={FL + 400} fill={wall} />
          {archXs.map((ax, i) => (
            <g key={i}>
              <path d={`M${ax - 190} ${FL} L${ax - 190} 400 A190 190 0 0 1 ${ax + 190} 400 L${ax + 190} ${FL} Z`} fill={dk(wall, 0.12)} />
              <path d={`M${ax - 160} ${FL} L${ax - 160} 400 A160 160 0 0 1 ${ax + 160} 400 L${ax + 160} ${FL} Z`} fill={mixC(C.stoneDark, C.ink, 0.3)} />
              <path d={`M${ax - 160} 400 A160 160 0 0 1 ${ax + 160} 400 L${ax + 160} 430 L${ax - 160} 430 Z`} fill={C.ink} opacity={0.18} />
              <rect x={ax - 110} y={560} width={220} height={FL - 560} fill={mixC(C.stoneDark, C.wood, 0.3)} />
              <rect x={ax - 110} y={560} width={220} height={14} fill={lt(mixC(C.stoneDark, C.wood, 0.3), 0.15)} />
              <Steam t={t + i} x={ax} y={600} w={200} h={200} n={3} strength={0.4} seed={seed + i} />
              <rect x={ax - 206} y={392} width={34} height={20} fill={lt(wall, 0.15)} />
              <rect x={ax + 172} y={392} width={34} height={20} fill={lt(wall, 0.15)} />
              <circle cx={ax + 240} cy={200} r={42} fill={dk(wall, 0.12)} />
              <circle cx={ax + 240} cy={200} r={30} fill={C.paperLight} opacity={0.85} />
            </g>
          ))}
          <rect x={X0} y={-400} width={X1 - X0} height={470} fill={C.woodDark} />
          <rect x={X0} y={70} width={X1 - X0} height={18} fill={C.ink} opacity={0.2} />
          {Array.from({length: 7}, (_, i) => (
            <rect key={i} x={-60 + i * 340} y={0} width={44} height={70} fill={dk(C.woodDark, 0.2)} />
          ))}
          {archXs.map((ax, i) => (
            <LightShaft key={i} x1={ax + 214} x2={ax + 266} y={200} dx={300} len={720} color={C.paperLight} strength={0.9} />
          ))}
          <Floor y={FL} color={mixC(C.stoneShade, C.wood, 0.25)} kind="flags" seed={seed} />
          <ellipse cx={980} cy={940} rx={150} ry={16} fill={C.paperLight} opacity={0.18} />
          <ellipse cx={1760} cy={1010} rx={110} ry={13} fill={C.paperLight} opacity={0.15} />
          <Bench x={980} y={FL + 30} w={340} color={C.woodLight} />
          <Bucket x={760} y={FL + 70} w={80} />
          <Bucket x={1180} y={FL + 120} w={90} />
          {/* canopy over the left tub */}
          <rect x={tubs[0][0] - 8} y={290} width={16} height={tubs[0][1] - 290 - tubs[0][2] * 0.46} fill={C.woodDark} />
          <path d={`M${tubs[0][0]} 300 Q${tubs[0][0] - 140} 420 ${tubs[0][0] - tubs[0][2] / 2 - 36} 760 L${tubs[0][0] - tubs[0][2] / 2 + 46} 760 Q${tubs[0][0] - 90} 500 ${tubs[0][0]} 300 Z`} fill={C.bone} />
          <path d={`M${tubs[0][0]} 300 Q${tubs[0][0] + 140} 420 ${tubs[0][0] + tubs[0][2] / 2 + 36} 760 L${tubs[0][0] + tubs[0][2] / 2 - 46} 760 Q${tubs[0][0] + 90} 500 ${tubs[0][0]} 300 Z`} fill={C.boneShade} />
          <ellipse cx={tubs[0][0]} cy={300} rx={34} ry={14} fill={C.woodDark} />
          {tubs.map(([x, y, w], i) => (
            <Bathtub key={i} x={x} y={y} w={w} t={t} part="back" />
          ))}
        </g>
      )}
      {front && (
        <g>
          {tubs.map(([x, y, w], i) => (
            <g key={i}>
              <ellipse cx={x} cy={y} rx={w * 0.52} ry={14} fill={C.ink} opacity={0.18} />
              <Bathtub x={x} y={y} w={w} t={t} part="front" linen={i === 0} />
              <Steam t={t} x={x} y={y - w * 0.46} w={w * 0.7} h={360} n={5} seed={seed + i * 4} strength={0.9} />
            </g>
          ))}
          <Particles t={t} x={0} y={120} w={1920} h={700} n={26} seed={seed} size={[3, 7]} vy={-12} opacity={[0.15, 0.4]} />
        </g>
      )}
    </g>
  );
};

const Flask: React.FC<Place & {kind?: 'erlen' | 'beaker' | 'round' | 'tube' | 'bottle' | 'jar'; liquid?: string; level?: number}> = ({kind = 'erlen', liquid = C.evidenceTint, level = 0.5, ...p}) => {
  const glass = C.paperLight;
  const shapes: Record<string, string> = {
    erlen: 'M-12 -110 L12 -110 L12 -70 L48 -6 Q50 0 42 0 L-42 0 Q-50 0 -48 -6 L-12 -70 Z',
    beaker: 'M-34 -90 L34 -90 L32 0 L-32 0 Z',
    round: 'M-10 -120 L10 -120 L10 -80 A40 40 0 1 1 -10 -80 Z',
    tube: 'M-9 -110 L9 -110 L9 -10 A9 9 0 0 1 -9 -10 Z',
    bottle: 'M-10 -110 L10 -110 L10 -84 Q30 -80 30 -60 L30 0 L-30 0 L-30 -60 Q-30 -80 -10 -84 Z',
    jar: 'M-30 -76 L30 -76 L30 0 L-30 0 Z',
  };
  const hTot = kind === 'jar' ? 76 : kind === 'beaker' ? 90 : 110;
  const lvl = -hTot * level * (kind === 'round' ? 0.6 : 0.8);
  const clip = `M-60 0 L60 0 L60 ${lvl} L-60 ${lvl} Z`;
  return (
    <g transform={tf(p)}>
      <path d={shapes[kind]} fill={glass} opacity={0.55} />
      <g>
        <clipPath id={`fl-${kind}-${Math.round((p.x ?? 0) * 10)}-${Math.round((p.y ?? 0) * 10)}-${Math.round(level * 100)}`}>
          <path d={shapes[kind]} />
        </clipPath>
        <path d={clip} fill={liquid} clipPath={`url(#fl-${kind}-${Math.round((p.x ?? 0) * 10)}-${Math.round((p.y ?? 0) * 10)}-${Math.round(level * 100)})`} />
      </g>
      <path d={shapes[kind]} fill="none" stroke={C.inkMute} strokeWidth={4} strokeLinejoin="round" opacity={0.7} />
      {kind === 'jar' && <rect x={-34} y={-90} width={68} height={16} rx={4} fill={C.woodDark} />}
      {kind === 'bottle' && <rect x={-12} y={-122} width={24} height={14} rx={3} fill={C.woodDark} />}
    </g>
  );
};

/** Research lab: counter with glassware & microscope (modern adds a monitor; 19thc a retort), wall shelves, window. origin = frame. */
export const Lab: React.FC<{t?: number; seed?: number; era?: '19thc' | 'modern'; night?: boolean}> = ({t = 0, seed = 1, era = 'modern', night = false}) => {
  const nt = (c: string) => (night ? mixC(c, C.night, 0.5) : c);
  const wall = nt(era === 'modern' ? mixC(C.paperShade, C.water, 0.14) : mixC(C.paperShade, C.wood, 0.15));
  const cab = nt(era === 'modern' ? mixC(C.slate, C.paperShade, 0.4) : C.wood);
  const top = nt(era === 'modern' ? C.paperLight : C.woodLight);
  const CT = 640;
  const liquids = [C.evidenceTint, C.theoryTint, C.cautionTint, mixC(C.water, C.paperLight, 0.3), C.oxTint];
  return (
    <g>
      <rect x={X0} y={-400} width={X1 - X0} height={FL + 400} fill={wall} />
      {era === 'modern' &&
        Array.from({length: 4}, (_, r) => <rect key={r} x={X0} y={480 + r * 40} width={X1 - X0} height={3} fill={dk(wall, 0.1)} />)}
      {era === 'modern' && Array.from({length: 40}, (_, i) => <rect key={i} x={-200 + i * 60} y={480} width={3} height={160} fill={dk(wall, 0.1)} />)}
      <rect x={X0} y={-400} width={X1 - X0} height={430} fill={dk(wall, 0.06)} />
      {era === 'modern' ? (
        <g>
          <rect x={760} y={30} width={400} height={20} fill={nt(C.metal)} />
          <rect x={780} y={50} width={360} height={12} rx={6} fill={night ? C.slate : C.paperLight} />
          {!night && <path d="M780 62 L1140 62 L1300 600 L620 600 Z" fill={C.paperLight} opacity={0.08} />}
        </g>
      ) : (
        <Lantern x={960} y={210} chain={180} lit t={t} />
      )}
      <Window x={280} y={560} w={300} h={300} shape="square" sky={night ? 'night' : 'day'} t={t} frame={nt(C.paperLight)} reveal={nt(lt(wall, 0.35))} />
      {!night && <LightShaft x1={130} x2={430} y={330} dx={420} len={600} color={C.paperLight} />}
      {[300, 440].map((sy, r) => (
        <g key={r}>
          <rect x={1300} y={sy} width={460} height={14} fill={nt(era === 'modern' ? C.paperLight : C.woodDark)} />
          <rect x={1300} y={sy + 14} width={460} height={8} fill={C.ink} opacity={0.15} />
          {Array.from({length: 7}, (_, i) => {
            const s = seed * 23 + r * 11 + i;
            return <Flask key={i} x={1340 + i * 62 + randRange(s, -6, 6)} y={sy} s={randRange(s + 1, 0.5, 0.75)} kind={pick(['bottle', 'jar', 'bottle', 'jar', 'beaker'] as const, s + 2)} liquid={pick(liquids, s + 3)} level={randRange(s + 4, 0.3, 0.8)} />;
          })}
        </g>
      ))}
      <rect x={160} y={CT} width={1600} height={FL - CT} fill={cab} />
      {Array.from({length: 8}, (_, i) => (
        <g key={i}>
          <rect x={180 + i * 198} y={CT + 40} width={180} height={FL - CT - 64} fill={dk(cab, 0.08)} />
          <rect x={180 + i * 198 + 150} y={CT + 70} width={10} height={40} rx={5} fill={nt(C.metal)} />
        </g>
      ))}
      <rect x={160} y={FL - 22} width={1600} height={22} fill={dk(cab, 0.3)} />
      <rect x={140} y={CT} width={1640} height={26} fill={top} />
      <rect x={140} y={CT + 26} width={1640} height={10} fill={C.ink} opacity={0.15} />
      {/* microscope */}
      <g transform={`translate(420 ${CT})`} fill={nt(C.inkLift)}>
        <rect x={-60} y={-16} width={120} height={16} rx={4} />
        <path d="M20 -16 L36 -16 Q50 -90 20 -150 L4 -142 Q30 -90 20 -16 Z" />
        <rect x={-50} y={-62} width={70} height={10} />
        <rect x={-24} y={-190} width={30} height={110} rx={6} transform="rotate(-18 -9 -135)" />
        <rect x={-40} y={-206} width={36} height={18} rx={4} transform="rotate(-18 -22 -197)" />
        <rect x={-8} y={-84} width={16} height={22} />
      </g>
      <Flask x={620} y={CT} kind="erlen" liquid={C.evidenceTint} level={0.45} />
      <Flask x={720} y={CT} kind="beaker" liquid={C.theoryTint} level={0.6} />
      <g transform={`translate(860 ${CT})`}>
        <rect x={-70} y={-60} width={140} height={14} fill={nt(C.woodLight)} />
        <rect x={-66} y={-46} width={10} height={46} fill={nt(C.woodLight)} />
        <rect x={56} y={-46} width={10} height={46} fill={nt(C.woodLight)} />
        {[-45, -15, 15, 45].map((x, i) => (
          <Flask key={i} x={x} y={-6} s={0.8} kind="tube" liquid={pick(liquids, seed + i)} level={0.5 + i * 0.1} />
        ))}
      </g>
      {era === 'modern' ? (
        <g transform={`translate(1260 ${CT})`}>
          <rect x={-20} y={-60} width={40} height={60} fill={nt(C.inkLift)} />
          <rect x={-70} y={-10} width={140} height={10} rx={4} fill={nt(C.inkLift)} />
          <rect x={-150} y={-250} width={300} height={196} rx={10} fill={nt(C.inkSoft)} />
          <rect x={-136} y={-236} width={272} height={168} rx={4} fill={night ? mixC(C.water, C.night, 0.3) : mixC(C.slate, C.ink, 0.3)} />
          <path d={`M-120 -100 L-80 -130 L-40 -115 L0 -170 L40 -150 L80 -200 L120 -185`} fill="none" stroke={C.evidenceTint} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <rect x={-120} y={-222} width={90} height={10} rx={5} fill={C.paperLight} opacity={0.4} />
          <rect x={-120} y={-204} width={60} height={8} rx={4} fill={C.paperLight} opacity={0.25} />
        </g>
      ) : (
        <g transform={`translate(1180 ${CT})`}>
          <Flask x={0} y={-40} kind="round" liquid={C.cautionTint} level={0.6} />
          <path d="M8 -150 L140 -120" stroke={C.paperLight} strokeWidth={12} strokeLinecap="round" opacity={0.6} />
          <path d="M8 -150 L140 -120" stroke={C.inkMute} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
          <rect x={-30} y={-40} width={60} height={10} fill={C.inkLift} />
          <rect x={-26} y={-30} width={8} height={30} fill={C.inkLift} />
          <rect x={18} y={-30} width={8} height={30} fill={C.inkLift} />
          <Flame t={t} x={0} y={-30} s={0.18} glow={false} />
          <Flask x={160} y={0} kind="beaker" liquid={C.cautionTint} level={0.2} s={0.8} />
        </g>
      )}
      <Flask x={1510} y={CT} kind="bottle" liquid={C.oxTint} level={0.5} />
      <Flask x={1580} y={CT} kind="erlen" liquid={mixC(C.water, C.paperLight, 0.3)} level={0.35} s={0.8} />
      <Floor y={FL} color={nt(mixC(C.stone, C.paperShade, 0.45))} kind="tiles" seed={seed} />
    </g>
  );
};

/** Classroom desks row for the foreground (near layer). origin = frame. */
export const ClassroomFront: React.FC<{color?: string; y?: number}> = ({color = C.woodDark, y = 960}) => (
  <g>
    {[150, 640, 1280, 1770].map((x, i) => (
      <g key={i}>
        <rect x={x - 220} y={y} width={440} height={300} fill={color} />
        <rect x={x - 220} y={y} width={440} height={10} fill={lt(color, 0.2)} />
        <rect x={x + 150} y={y + 10} width={70} height={300} fill={dk(color, 0.2)} />
        <rect x={x - 240} y={y - 22} width={480} height={26} rx={4} fill={lt(color, 0.12)} />
      </g>
    ))}
  </g>
);

/** Classroom / lecture room: chalkboard with faint chalk notes, clock, window, teacher desk, foreground desks.
 *  layer: 'back' (no foreground desks), 'front' (desks only) or 'all'. origin = frame. */
export const Classroom: React.FC<{t?: number; seed?: number; layer?: 'all' | 'back' | 'front'; time?: number}> = ({t = 0, seed = 1, layer = 'all', time = 9.25}) => {
  const wall = mixC(C.paperShade, C.cautionTint, 0.25);
  const board = mixC(C.slate, C.ink, 0.3);
  const chalk = C.paperLight;
  if (layer === 'front') return <ClassroomFront />;
  return (
    <g>
      <rect x={X0} y={-400} width={X1 - X0} height={FL + 400} fill={wall} />
      <rect x={X0} y={-400} width={X1 - X0} height={430} fill={dk(wall, 0.05)} />
      <rect x={X0} y={620} width={X1 - X0} height={FL - 620} fill={C.woodLight} />
      <rect x={X0} y={612} width={X1 - X0} height={14} fill={C.wood} />
      <Window x={230} y={590} w={260} h={400} sky="day" t={t} frame={C.paperLight} reveal={C.woodLight} />
      <LightShaft x1={100} x2={360} y={250} dx={480} len={720} color={C.paperLight} />
      <rect x={560} y={180} width={820} height={400} fill={C.wood} />
      <rect x={576} y={196} width={788} height={368} fill={board} />
      <rect x={1340} y={196} width={24} height={368} fill={C.ink} opacity={0.2} />
      <rect x={550} y={572} width={840} height={16} fill={C.woodLight} />
      <g stroke={chalk} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.42}>
        {[0, 1, 2, 3].map((r) =>
          Array.from({length: 4}, (_, j) => {
            const s = seed * 7 + r * 5 + j;
            const x = 630 + j * 92 + rand(s) * 10;
            return <path key={`${r}-${j}`} d={`M${x} ${260 + r * 56} l${randRange(s + 1, 40, 76)} 0`} />;
          }),
        )}
        <circle cx={1180} cy={330} r={70} />
        <path d="M1110 330 L1250 330 M1180 260 L1180 400" opacity={0.6} />
        <path d="M1050 470 Q1120 420 1210 480" />
        <path d="M1200 468 L1214 482 L1196 488" />
      </g>
      <rect x={720} y={566} width={40} height={8} rx={4} fill={chalk} opacity={0.8} />
      <Clock x={1560} y={250} r={64} time={time} t={t} />
      <Desk x={1600} y={FL + 20} w={400} color={C.wood} />
      <BookStack x={1520} y={FL + 20 - 170} n={3} w={120} seed={seed} />
      <Floor y={FL} color={C.woodLight} kind="planks" seed={seed} />
      {layer === 'all' && <ClassroomFront />}
    </g>
  );
};

/** Museum hall: tall arched windows between pilasters, cornice, flat light shafts, polished floor, central plinth. origin = frame. */
export const MuseumHall: React.FC<{t?: number; seed?: number; plinth?: boolean; windows?: number; wall?: string}> = ({t = 0, seed = 1, plinth = true, windows = 4, wall = mixC(C.paperShade, C.paperDeep, 0.25)}) => {
  const n = windows;
  const xs = Array.from({length: n}, (_, i) => (1920 * (i + 0.5)) / n);
  const step = 1920 / n;
  const pil = mixC(wall, C.paperDeep, 0.45);
  return (
    <g>
      <rect x={X0} y={-400} width={X1 - X0} height={FL + 400} fill={wall} />
      {xs.map((x, i) => (
        <Window key={i} x={x} y={600} w={230} h={440} shape="arched" sky="day" t={t} seed={seed + i} frame={C.paperDark} reveal={C.paperDeep} />
      ))}
      {Array.from({length: n + 1}, (_, i) => {
        const x = i * step;
        return (
          <g key={i}>
            <rect x={x - 46} y={100} width={92} height={FL - 100} fill={pil} />
            <rect x={x + 14} y={100} width={32} height={FL - 100} fill={dk(pil, 0.1)} />
            <rect x={x - 58} y={110} width={116} height={26} fill={lt(pil, 0.2)} />
            <rect x={x - 58} y={FL - 50} width={116} height={50} fill={lt(pil, 0.12)} />
          </g>
        );
      })}
      <rect x={X0} y={-400} width={X1 - X0} height={480} fill={mixC(wall, C.paperDeep, 0.5)} />
      <rect x={X0} y={56} width={X1 - X0} height={24} fill={lt(wall, 0.3)} />
      <rect x={X0} y={80} width={X1 - X0} height={10} fill={dk(wall, 0.12)} />
      {Array.from({length: 60}, (_, i) => (
        <rect key={i} x={-200 + i * 40} y={90} width={22} height={20} fill={mixC(wall, C.paperDeep, 0.6)} />
      ))}
      <rect x={X0} y={110} width={X1 - X0} height={8} fill={C.ink} opacity={0.1} />
      {xs.map((x, i) => (
        <LightShaft key={i} x1={x - 115} x2={x + 115} y={220} dx={300} len={700} color={C.paperLight} strength={0.55} />
      ))}
      <Floor y={FL} color={C.paperDeep} kind="tiles" seed={seed} />
      <rect x={X0} y={FL - 10} width={X1 - X0} height={10} fill={C.inkSoft} />
      {xs.map((x, i) => (
        <path key={i} d={`M${x + 200} ${FL + 30} L${x + 420} ${FL + 30} L${x + 520} ${FL + 150} L${x + 300} ${FL + 150} Z`} fill={C.paperLight} opacity={0.2} />
      ))}
      {plinth && <Plinth x={960} y={FL + 70} w={760} h={120} />}
    </g>
  );
};

/** Library / study: dark panelled walls, tall bookshelves both sides, framed map, desk with oil lamp in front.
 *  layer: 'back' (no desk), 'front' (desk + lamp only), 'all'. origin = frame. */
export const Study: React.FC<{t?: number; seed?: number; layer?: 'all' | 'back' | 'front'; lamp?: boolean}> = ({t = 0, seed = 1, layer = 'all', lamp = true}) => {
  const wall = mixC(C.ink, C.wood, 0.32);
  const back = layer !== 'front';
  const front = layer !== 'back';
  return (
    <g>
      {back && (
        <g>
          <rect x={X0} y={-400} width={X1 - X0} height={FL + 400} fill={wall} />
          {Array.from({length: 12}, (_, i) => (
            <rect key={i} x={-120 + i * 190} y={60} width={140} height={FL - 120} fill={lt(wall, 0.04)} />
          ))}
          <rect x={X0} y={-400} width={X1 - X0} height={460} fill={dk(wall, 0.15)} />
          <rect x={X0} y={520} width={X1 - X0} height={14} fill={lt(wall, 0.08)} />
          {lamp && <LightPool x={480} y={560} r={720} strength={1.5} />}
          <Bookshelf x={230} y={FL} w={420} h={720} seed={seed} />
          <Bookshelf x={1690} y={FL} w={420} h={720} seed={seed + 5} />
          <Frame x={960} y={300} w={380} h={260} kind="map" />
          <Floor y={FL} color={mixC(C.woodDark, C.ink, 0.2)} kind="planks" seed={seed} />
        </g>
      )}
      {front && (
        <g>
          <rect x={220} y={706} width={1480} height={420} fill={C.woodDark} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={300 + i * 480} y={760} width={360} height={120} fill={dk(C.woodDark, 0.12)} />
              <circle cx={480 + i * 480} cy={820} r={8} fill={BRASS} />
            </g>
          ))}
          <rect x={1600} y={726} width={100} height={400} fill={dk(C.woodDark, 0.2)} />
          <rect x={200} y={690} width={1520} height={28} rx={4} fill={C.wood} />
          <rect x={200} y={690} width={1520} height={8} rx={4} fill={C.woodLight} />
          <BookStack x={1420} y={692} n={4} w={170} seed={seed + 2} />
          <rect x={800} y={672} width={220} height={20} fill={C.paperLight} transform="rotate(-3 900 682)" />
          <rect x={1120} y={666} width={30} height={26} rx={6} fill={C.ink} />
          <path d="M1136 668 Q1160 600 1190 560" stroke={C.paperLight} strokeWidth={5} fill="none" strokeLinecap="round" />
          {lamp && <OilLamp x={480} y={692} t={t} glow={0.6} />}
        </g>
      )}
    </g>
  );
};

/** Bedroom at night: dark wall, curtained window with moon & stars, moonlight shaft onto the bed, nightstand. origin = frame. */
export const Bedroom: React.FC<{t?: number; seed?: number; candle?: boolean; night?: boolean}> = ({t = 0, seed = 1, candle = false, night = true}) => {
  const wall = night ? mixC(C.slate, C.night, 0.35) : mixC(C.theoryTint, C.paperShade, 0.5);
  const floor = night ? mixC(C.woodDark, C.night, 0.45) : C.wood;
  return (
    <g>
      <rect x={X0} y={-400} width={X1 - X0} height={FL + 400} fill={wall} />
      {Array.from({length: 11}, (_, r) =>
        Array.from({length: 24}, (_, c) => <circle key={`${r}-${c}`} cx={-60 + c * 90 + (r % 2) * 45} cy={40 + r * 70} r={5} fill={lt(wall, 0.12)} opacity={0.5} />),
      )}
      <rect x={X0} y={FL - 30} width={X1 - X0} height={30} fill={dk(wall, 0.2)} />
      <Window x={560} y={600} w={300} h={360} sky={night ? 'night' : 'day'} t={t} seed={seed} curtains frame={dk(wall, 0.3)} reveal={dk(wall, 0.15)} curtainColor={mixC(C.theory, C.night, night ? 0.3 : 0)} />
      <LightShaft x1={420} x2={700} y={300} dx={560} len={640} color={C.paperLight} strength={night ? 0.75 : 1} />
      <Frame x={1250} y={330} w={200} h={150} kind="landscape" color={dk(C.woodDark, 0.2)} />
      <Floor y={FL} color={floor} kind="planks" seed={seed} />
      <ellipse cx={1000} cy={940} rx={420} ry={40} fill={mixC(C.theory, C.night, 0.4)} />
      <Bed x={1250} y={890} w={760} s={1.12} blanket={night ? mixC(C.theoryLight, C.slate, 0.4) : C.theoryLight} pillow={night ? mixC(C.paperShade, C.slate, 0.3) : C.paperLight} sheet={night ? mixC(C.paperShade, C.slate, 0.25) : C.paperLight} frame={night ? mixC(C.wood, C.night, 0.35) : C.wood} />
      <Table x={1760} y={890} w={150} h={190} color={night ? mixC(C.wood, C.night, 0.35) : C.wood} />
      <Candle x={1760} y={700} t={t} lit={candle} h={60} s={0.9} glow={0.8} />
      <path d={`M${980} ${FL + 40} L${1280} ${FL + 40} L${1360} ${FL + 160} L${1060} ${FL + 160} Z`} fill={C.paperLight} opacity={night ? 0.1 : 0.16} />
    </g>
  );
};

/** Abstract "mind space": calm ink or plum field with slowly floating soft shapes, orbit rings, dust. Centre kept calm for text. origin = frame. */
export const MindSpace: React.FC<{t?: number; bg?: 'ink' | 'plum'; seed?: number; density?: number}> = ({t = 0, bg = 'plum', seed = 1, density = 1}) => {
  const base = bg === 'ink' ? C.ink : mixC(C.theory, C.ink, 0.5);
  const cols = [C.theoryLight, C.theoryTint, C.paperLight, C.cautionTint, C.theoryLight];
  const n = Math.round(26 * density);
  return (
    <g>
      <rect x={X0} y={-400} width={X1 - X0} height={YB + 400} fill={base} />
      {[900, 680, 470].map((r, i) => (
        <circle key={i} cx={960} cy={540} r={r} fill={lt(base, 0.04 + i * 0.015)} />
      ))}
      {[300, 560, 820].map((r, i) => (
        <circle key={i} cx={960} cy={540} r={r} fill="none" stroke={C.paperLight} strokeWidth={3} strokeDasharray="4 22" strokeLinecap="round" opacity={0.18} transform={`rotate(${t * (i % 2 ? -3 : 4)} 960 540)`} />
      ))}
      {Array.from({length: n}, (_, i) => {
        const s = seed * 71 + i * 9.7;
        let x = randRange(s, 60, 1860);
        let y = randRange(s + 1, 60, 1020);
        const dx = (x - 960) / 520;
        const dy = (y - 540) / 280;
        const d = Math.hypot(dx, dy);
        if (d < 1) {
          x = 960 + (dx / (d || 1)) * 520 * 1.05;
          y = 540 + (dy / (d || 1)) * 280 * 1.05;
        }
        x += noise1(t * 0.12 + i, seed) * 40;
        y += noise1(t * 0.1 + i * 1.3, seed + 4) * 30 + drift(t, randRange(s + 2, 5, 9), 10, i);
        const sz = randRange(s + 3, 26, 110);
        const rot = t * randRange(s + 4, -8, 8) + rand(s + 5) * 360;
        const c = pick(cols, s + 6);
        const o = randRange(s + 7, 0.16, 0.45);
        const kind = Math.floor(rand(s + 8) * 5);
        const tr = `translate(${x} ${y}) rotate(${rot})`;
        if (kind === 0) return <circle key={i} cx={x} cy={y} r={sz * 0.6} fill={c} opacity={o} />;
        if (kind === 1) return <circle key={i} cx={x} cy={y} r={sz * 0.7} fill="none" stroke={c} strokeWidth={Math.max(4, sz * 0.12)} opacity={o} />;
        if (kind === 2) return <rect key={i} x={-sz / 2} y={-sz / 2} width={sz} height={sz} rx={sz * 0.28} fill={c} opacity={o} transform={tr} />;
        if (kind === 3) return <path key={i} d={`M0 ${-sz * 0.6} L${sz * 0.55} ${sz * 0.4} L${-sz * 0.55} ${sz * 0.4} Z`} fill={c} opacity={o} transform={tr} strokeLinejoin="round" stroke={c} strokeWidth={sz * 0.12} />;
        return <path key={i} d={`M${-sz} 0 q${sz / 2} ${-sz / 2} ${sz} 0 t${sz} 0`} fill="none" stroke={c} strokeWidth={Math.max(4, sz * 0.12)} strokeLinecap="round" opacity={o} transform={tr} />;
      })}
      <Particles t={t} x={0} y={0} w={1920} h={1080} n={50} seed={seed + 2} size={[2, 4.5]} vx={4} vy={-6} opacity={[0.15, 0.5]} twinkle />
    </g>
  );
};
