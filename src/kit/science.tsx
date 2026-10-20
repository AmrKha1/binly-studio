import React from 'react';
import {C, FONT_SANS} from './theme';
import {clamp01, ease, lerp, noise1, rand, randRange} from './anim';
import {uid} from './stage';

/** Colour mix that accepts '#rrggbb' or 'rgb(r,g,b)' (so mixes can be chained). k=0 → a, 1 → b. */
const rgbOf = (c: string): number[] => (c.startsWith('#') ? [0, 2, 4].map((i) => parseInt(c.slice(1 + i, 3 + i), 16)) : (c.match(/\d+(\.\d+)?/g) ?? ['0', '0', '0']).slice(0, 3).map(Number));
const mix = (a: string, b: string, k: number) => {
  const A = rgbOf(a);
  const B = rgbOf(b);
  const kk = clamp01(k);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], kk))).join(',')})`;
};

// Body, brain & science visuals (flat editorial anatomy). Light from upper-left; flat shade
// crescents on the lower-right. Flesh = oxblood family, signals/thought = theory plum,
// healthy/confirmed = evidence green, germs/warning = caution mustard.

// ---------------------------------------------------------------------------------------------
// Geometry helpers (pure)

export type Pt = [number, number];
const r1 = (v: number) => Math.round(v * 10) / 10;

const crSegs = (pts: Pt[], closed: boolean) => {
  const n = pts.length;
  const get = (i: number): Pt => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const segs: [Pt, Pt, Pt, Pt][] = [];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    segs.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
  }
  return segs;
};

/** Smooth (Catmull-Rom) SVG path through points. `cont` = start with "L" instead of "M" (append to a path). */
export const smoothPath = (pts: Pt[], closed = false, cont = false) => {
  let d = `${cont ? 'L' : 'M'}${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (const [, a, b, p] of crSegs(pts, closed)) d += ` C${r1(a[0])} ${r1(a[1])} ${r1(b[0])} ${r1(b[1])} ${r1(p[0])} ${r1(p[1])}`;
  return closed ? d + ' Z' : d;
};

export type Curve = {d: string; len: number; poly: Pt[]; at: (k: number) => {x: number; y: number; a: number}; sub: (k0: number, k1: number) => string};

/** Sampled smooth curve through points: arc-length `at(k)` (k 0→1, a = tangent degrees) and `sub(k0,k1)` polyline. */
export const makeCurve = (pts: Pt[], closed = false, steps = 14): Curve => {
  const poly: Pt[] = [];
  crSegs(pts, closed).forEach(([p0, c1, c2, p3], si) => {
    for (let j = si === 0 ? 0 : 1; j <= steps; j++) {
      const u = j / steps;
      const v = 1 - u;
      poly.push([
        v * v * v * p0[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * p3[0],
        v * v * v * p0[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * p3[1],
      ]);
    }
  });
  const cum = [0];
  for (let i = 1; i < poly.length; i++) cum.push(cum[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  const len = cum[cum.length - 1] || 1;
  const idx = (L: number) => {
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (cum[m] <= L) lo = m;
      else hi = m;
    }
    return lo;
  };
  const at = (k: number) => {
    const L = clamp01(k) * len;
    const i = Math.min(idx(L), poly.length - 2);
    const f = clamp01((L - cum[i]) / (cum[i + 1] - cum[i] || 1));
    const a = poly[i];
    const b = poly[i + 1];
    return {x: lerp(a[0], b[0], f), y: lerp(a[1], b[1], f), a: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI};
  };
  const sub = (k0: number, k1: number) => {
    const A = at(k0);
    const B = at(k1);
    let d = `M${r1(A.x)} ${r1(A.y)}`;
    const i0 = idx(clamp01(k0) * len) + 1;
    const i1 = idx(clamp01(k1) * len);
    for (let i = i0; i <= i1; i++) d += ` L${r1(poly[i][0])} ${r1(poly[i][1])}`;
    return d + ` L${r1(B.x)} ${r1(B.y)}`;
  };
  return {d: smoothPath(pts, closed), len, poly, at, sub};
};

/** Closed tapered ribbon along a curve (organic strokes: dendrites, vessels, flagella). */
const taper = (c: Curve, w0: number, w1: number) => {
  const P = c.poly;
  const n = P.length;
  const L: string[] = [];
  const R: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)];
    const b = P[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const m = Math.hypot(dx, dy) || 1;
    const w = lerp(w0, w1, i / (n - 1)) / 2;
    L.push(`${r1(P[i][0] - (dy / m) * w)} ${r1(P[i][1] + (dx / m) * w)}`);
    R.push(`${r1(P[i][0] + (dy / m) * w)} ${r1(P[i][1] - (dx / m) * w)}`);
  }
  return `M${L.join(' L')} L${R.reverse().join(' L')} Z`;
};

/** Flat shade crescent inside shape `d` (lower-right side): shape minus a copy shifted toward the light. */
const Shade: React.FC<{id: string; d: string; dx?: number; dy?: number; color?: string; o?: number; transform?: string}> = ({id, d, dx = -14, dy = -14, color = C.ink, o = 0.14, transform}) => (
  <g transform={transform}>
    <mask id={id}>
      <path d={d} fill="#fff" />
      <path d={d} fill="#000" transform={`translate(${dx} ${dy})`} />
    </mask>
    <path d={d} fill={color} opacity={o} mask={`url(#${id})`} />
  </g>
);

/** Flat-shaded sphere: shade disc + lit disc nudged toward the light + tiny highlight. */
const Ball: React.FC<{x: number; y: number; r: number; fill: string; shade: string; hi?: boolean; stroke?: string}> = ({x, y, r, fill, shade, hi = true, stroke}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={shade} stroke={stroke} strokeWidth={stroke ? 3 : 0} />
    <circle cx={x - r * 0.1} cy={y - r * 0.1} r={r * 0.855} fill={fill} />
    {hi && <circle cx={x - r * 0.4} cy={y - r * 0.4} r={r * 0.15} fill={C.paperLight} opacity={0.6} />}
  </g>
);

/** Small diagram label: anchor dot + leader + tracked caps (sans 34). Drawn in absolute coords. */
const Leader: React.FC<{ax: number; ay: number; lx: number; ly: number; text: string; p?: number; color?: string; dot?: string}> = ({ax, ay, lx, ly, text, p = 1, color = C.inkMute, dot = C.ink}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  const right = lx >= ax;
  return (
    <g opacity={k}>
      <path d={`M${ax} ${ay} L${lerp(ax, lx, k)} ${lerp(ay, ly, k)}`} stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" />
      <circle cx={ax} cy={ay} r={5.5} fill={dot} stroke={C.paperLight} strokeWidth={2.5} />
      <text x={lx + (right ? 10 : -10)} y={ly + 12} textAnchor={right ? 'start' : 'end'} fontFamily={FONT_SANS} fontWeight={700} fontSize={34} letterSpacing={3.5} fill={C.ink}>
        {text.toUpperCase()}
      </text>
    </g>
  );
};

const flip = (facing: 'left' | 'right') => (facing === 'left' ? -1 : 1);

// ---------------------------------------------------------------------------------------------
// Brain (side view). Local coords: front of brain → +x, origin = centre of cerebrum.

export type BrainRegion = 'frontal' | 'motor' | 'parietal' | 'temporal' | 'occipital' | 'cerebellum' | 'brainstem';
export const BRAIN_REGIONS: BrainRegion[] = ['frontal', 'motor', 'parietal', 'temporal', 'occipital', 'cerebellum', 'brainstem'];

const BR_OUT = 'M-162 0 C-165 -70 -110 -118 -30 -124 C50 -130 125 -100 150 -50 C168 -15 162 25 140 38 C120 48 100 44 92 46 C102 62 96 86 74 92 C40 104 -20 106 -70 92 C-110 80 -150 60 -162 0 Z';
const BR_CEREBELLUM = 'M-158 70 C-160 40 -120 34 -86 40 C-50 46 -34 64 -38 92 C-42 120 -80 130 -112 124 C-140 118 -156 98 -158 70 Z';
const BR_STEM = 'M-44 70 C-46 110 -36 150 -30 198 L2 198 C0 172 4 152 14 136 C26 118 20 90 16 70 Z';
const CS: Pt[] = [[-30, -200], [-10, -128], [0, -95], [-2, -70], [14, -45], [20, -15], [34, 8], [44, 29]];
const PM: Pt[] = [[12, -200], [32, -126], [40, -95], [38, -68], [52, -42], [58, -14], [72, 12], [86, 40]];
const SF: Pt[] = [[160, 48], [86, 40], [44, 29], [0, 22], [-40, 24], [-70, 32], [-112, 44]];
const SFB: Pt[] = [[-112, 44], [-70, 32], [-40, 24], [0, 22], [44, 29]];
const PO: Pt[] = [[-80, -200], [-98, -118], [-104, -70], [-108, -20], [-112, 44]];
const rv = (p: Pt[]) => [...p].reverse();
const cont = (p: Pt[]) => smoothPath(p, false, true);
const BR_REG: Record<Exclude<BrainRegion, 'cerebellum' | 'brainstem'>, string> = {
  frontal: `M300 -200 ${cont(PM)} L160 48 L300 48 Z`,
  motor: `M-30 -200 ${cont(CS)} L86 40 ${cont(rv(PM))} Z`,
  parietal: `M-30 -200 L-80 -200 ${cont(PO)} ${cont(SFB)} ${cont(rv(CS))} Z`,
  occipital: `M-300 -200 ${cont(PO)} L-130 200 L-300 200 Z`,
  temporal: `M300 48 ${cont(SF)} L-130 200 L300 200 Z`,
};
const BR_MAJOR = [smoothPath(CS.slice(1)), smoothPath(SF), smoothPath(PO.slice(1))];
const BR_MINOR = [
  smoothPath(PM.slice(1)),
  'M58 -112 C80 -104 104 -100 128 -80',
  'M72 -66 C92 -74 112 -60 140 -50',
  'M88 -20 C104 -28 122 -12 150 -14',
  'M98 14 C112 8 126 22 146 20',
  'M-26 -112 C-44 -96 -62 -104 -84 -90',
  'M-16 -52 C-38 -62 -60 -40 -88 -48',
  'M-30 0 C-50 -10 -70 10 -96 4',
  'M-122 -72 C-138 -54 -130 -36 -150 -20',
  'M-124 8 C-136 22 -128 38 -146 42',
  'M100 62 C60 52 20 66 -30 58 C-56 54 -80 62 -104 58',
  'M66 84 C40 78 0 92 -50 84',
];
const BR_LOBE: Record<BrainRegion, string> = {
  frontal: C.cautionTint,
  motor: C.oxTint,
  parietal: C.evidenceTint,
  temporal: C.theoryTint,
  occipital: C.paperDeep,
  cerebellum: C.boneShade,
  brainstem: C.stone,
};
const BR_LABEL: Record<BrainRegion, {a: Pt; l: Pt; text: string}> = {
  frontal: {a: [112, -40], l: [215, -110], text: 'Frontal'},
  motor: {a: [36, -108], l: [92, -190], text: 'Motor cortex'},
  parietal: {a: [-50, -78], l: [-120, -175], text: 'Parietal'},
  occipital: {a: [-136, -14], l: [-222, -40], text: 'Occipital'},
  temporal: {a: [40, 70], l: [210, 92], text: 'Temporal'},
  cerebellum: {a: [-104, 104], l: [-215, 150], text: 'Cerebellum'},
  brainstem: {a: [-12, 168], l: [90, 210], text: 'Brainstem'},
};
const BR_SIGNAL = makeCurve([[122, -40], [84, -82], [40, -104], [22, -64], [8, 0], [-6, 60], [-12, 120], [-12, 192]]);

type HL = BrainRegion | BrainRegion[] | Partial<Record<BrainRegion, string>>;
const hlMap = (h: HL | undefined, col: string): Partial<Record<BrainRegion, string>> => {
  if (!h) return {};
  if (typeof h === 'string') return {[h]: col};
  if (Array.isArray(h)) return Object.fromEntries(h.map((r) => [r, col]));
  return h;
};

/** Plum signal dot with a short fading trail along a Curve (k = 0→1). Draws nothing at k ≤ 0 or ≥ 1.02. */
const SignalDot: React.FC<{c: Curve; k: number; color?: string; r?: number; trail?: number}> = ({c, k, color = C.theory, r = 10, trail = 0.22}) => {
  if (k <= 0 || k >= 1.02) return null;
  const P = c.at(Math.min(1, k));
  const fade = 1 - clamp01((k - 0.96) / 0.06);
  return (
    <g opacity={fade}>
      <path d={c.sub(Math.max(0, k - trail), Math.min(1, k))} stroke={C.theoryLight} strokeWidth={r * 0.9} strokeLinecap="round" fill="none" opacity={0.75} />
      <circle cx={P.x} cy={P.y} r={r * 2.6} fill={color} opacity={0.14} />
      <circle cx={P.x} cy={P.y} r={r * 1.7} fill={color} opacity={0.22} />
      <circle cx={P.x} cy={P.y} r={r} fill={color} />
      <circle cx={P.x - r * 0.3} cy={P.y - r * 0.3} r={r * 0.32} fill={C.paperLight} opacity={0.8} />
    </g>
  );
};

/** Brain artwork in local coords (front → +x). Internal: shared by Brain and HeadProfile. */
const BrainArt: React.FC<{id: string; facing: 'left' | 'right'; fill: string; lobes: boolean; hl: Partial<Record<BrainRegion, string>>; hp: number; signal?: number}> = ({id, facing, fill, lobes, hl, hp, signal}) => {
  const fx = flip(facing);
  const col = (r: BrainRegion) => {
    const base = lobes ? BR_LOBE[r] : r === 'cerebellum' ? mix(fill, C.oxLight, 0.18) : r === 'brainstem' ? mix(fill, C.boneShade, 0.45) : fill;
    const h = hl[r];
    return h ? mix(base, h, clamp01(hp)) : base;
  };
  const shade = lobes ? C.ink : mix(fill, C.oxLight, 0.55);
  const shadeO = lobes ? 0.12 : 0.55;
  const groove = mix(fill, C.oxDeep, 0.55);
  return (
    <g>
      <clipPath id={`${id}c`}>
        <path d={BR_OUT} />
      </clipPath>
      <clipPath id={`${id}b`}>
        <path d={BR_CEREBELLUM} />
      </clipPath>
      {/* brainstem + cerebellum sit behind the cerebrum */}
      <path d={BR_STEM} fill={col('brainstem')} />
      <path d="M-44 70 C-46 110 -36 150 -30 198 L-18 198 C-22 160 -30 110 -28 70 Z" fill={C.ink} opacity={0.1} />
      <path d={BR_CEREBELLUM} fill={col('cerebellum')} />
      <g clipPath={`url(#${id}b)`} fill="none" stroke={groove} strokeWidth={4} strokeLinecap="round" opacity={0.45}>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M-168 ${66 + i * 14} Q-100 ${50 + i * 16} -30 ${74 + i * 11}`} />
        ))}
      </g>
      <Shade id={`${id}sb`} d={BR_CEREBELLUM} dx={-8 * fx} dy={-10} color={shade} o={shadeO} />
      {/* cerebrum regions */}
      <g clipPath={`url(#${id}c)`}>
        <path d={BR_OUT} fill={fill} />
        {(Object.keys(BR_REG) as (keyof typeof BR_REG)[]).map((r) => (
          <path key={r} d={BR_REG[r]} fill={col(r)} />
        ))}
      </g>
      <Shade id={`${id}s`} d={BR_OUT} dx={-12 * fx} dy={-16} color={shade} o={shadeO} />
      <Shade id={`${id}l`} d={BR_OUT} dx={10 * fx} dy={12} color={C.paperLight} o={0.22} />
      <g clipPath={`url(#${id}c)`} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {BR_MINOR.map((d, i) => (
          <path key={i} d={d} stroke={groove} strokeWidth={4} opacity={0.38} />
        ))}
        {BR_MAJOR.map((d, i) => (
          <path key={i} d={d} stroke={groove} strokeWidth={6} opacity={0.7} />
        ))}
      </g>
      {signal !== undefined && <SignalDot c={BR_SIGNAL} k={signal} />}
    </g>
  );
};

/**
 * Brain, side view. origin = centre of the cerebrum; ≈330×330 at s=1 (incl. brainstem).
 * facing: which way the forehead points. highlight: region(s) or {region: colour}; hp = highlight progress.
 * lobes: colour-code every lobe. signal: 0→1 a plum pulse travels frontal → motor cortex → brainstem.
 * labels: true or a list of regions (labels sit outside the brain, upright).
 */
export const Brain: React.FC<{
  x: number;
  y: number;
  s?: number;
  facing?: 'left' | 'right';
  highlight?: HL;
  highlightColor?: string;
  hp?: number;
  lobes?: boolean;
  signal?: number;
  labels?: boolean | BrainRegion[];
  labelP?: number;
  fill?: string;
  o?: number;
}> = ({x, y, s = 1, facing = 'right', highlight, highlightColor = C.theoryLight, hp = 1, lobes = false, signal, labels, labelP = 1, fill = C.oxTint, o = 1}) => {
  if (o <= 0) return null;
  const fx = flip(facing);
  const id = uid('brain', x, y, s);
  const lab = labels === true ? BRAIN_REGIONS : labels || [];
  return (
    <g opacity={o}>
      <g transform={`translate(${x} ${y}) scale(${s * fx} ${s})`}>
        <BrainArt id={id} facing={facing} fill={fill} lobes={lobes} hl={hlMap(highlight, highlightColor)} hp={hp} signal={signal} />
      </g>
      {lab.map((r, i) => {
        const L = BR_LABEL[r];
        return <Leader key={r} ax={x + L.a[0] * s * fx} ay={y + L.a[1] * s} lx={x + L.l[0] * s * fx} ly={y + L.l[1] * s} text={L.text} p={clamp01(labelP * 1.6 - i * 0.1)} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// Head (side profile). Local coords: face → +x, origin = centre of the cranium.

const HEAD =
  'M-110 330 C-108 270 -115 215 -130 180 C-195 130 -212 20 -200 -55 C-186 -160 -95 -208 10 -208 C125 -208 192 -140 196 -45 C198 -20 204 -5 198 12 C210 35 236 62 246 80 C252 92 236 102 214 100 C210 108 214 116 216 126 C214 134 206 138 204 142 C212 148 214 156 208 162 C202 168 200 174 204 184 C210 206 196 230 165 234 C130 238 100 240 82 252 C74 270 72 300 72 330 Z';
const HEAD_WINDOW = 'M-180 -30 C-185 -115 -115 -170 -20 -175 C75 -180 155 -140 177 -75 C193 -25 177 15 145 30 C115 80 5 95 -75 90 C-145 85 -180 40 -180 -30 Z';
const CAP_EDGE = 'M210 -78 C140 -50 70 -28 10 -24 C-70 -18 -150 10 -230 70';

/** Small external electrode disc (EEG / implant pedestal LED). origin = centre, r≈13 at s=1. */
export const Electrode: React.FC<{x: number; y: number; s?: number; active?: number; color?: string}> = ({x, y, s = 1, active = 0, color = C.theoryLight}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {active > 0 && <circle r={24} fill={color} opacity={0.3 * active} />}
    <circle r={14} fill={C.paperLight} />
    <circle r={14} fill="none" stroke={C.stoneShade} strokeWidth={3} />
    <circle r={6.5} fill={mix(C.inkLift, color, clamp01(active))} />
  </g>
);

/**
 * Utah-style micro-electrode array (3/4 view): metal plate, needle grid, gold ribbon wire.
 * origin = centre of the plate top; ≈130×90 at s=1. t + active (0→1) = tips flicker plum (recording).
 */
export const ElectrodeArray: React.FC<{x: number; y: number; s?: number; r?: number; n?: number; t?: number; active?: number; wire?: boolean}> = ({x, y, s = 1, r = 0, n = 6, t = 0, active = 0, wire = true}) => {
  const L: Pt = [-60, 0];
  const T: Pt = [0, -24];
  const B: Pt = [0, 24];
  const P = (u: number, v: number): Pt => [L[0] + u * (T[0] - L[0]) + v * (B[0] - L[0]), L[1] + u * (T[1] - L[1]) + v * (B[1] - L[1])];
  const needles: React.ReactNode[] = [];
  for (let a = 0; a < n; a++)
    for (let b = 0; b < n; b++) {
      const [px, py] = P((a + 0.5) / n, (b + 0.5) / n);
      const k = active * clamp01(0.5 + 0.5 * Math.sin(t * randRange(a * 9 + b, 3, 7) + rand(a * 13 + b * 7) * 6.28));
      needles.push(
        <g key={`${a}-${b}`}>
          <path d={`M${px} ${py + 10} L${px} ${py + 46}`} stroke={C.stoneDark} strokeWidth={3.5} strokeLinecap="round" />
          <circle cx={px} cy={py + 47} r={3.2} fill={k > 0.05 ? mix(C.cautionLight, C.theoryLight, k) : C.cautionLight} />
          {k > 0.5 && <circle cx={px} cy={py + 47} r={8} fill={C.theoryLight} opacity={(k - 0.5) * 0.8} />}
        </g>,
      );
    }
  const R: Pt = [60, 0];
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      {wire && <path d="M30 -10 C60 -40 70 -80 110 -96" stroke={C.caution} strokeWidth={9} fill="none" strokeLinecap="round" />}
      {wire && <path d="M30 -10 C60 -40 70 -80 110 -96" stroke={C.cautionLight} strokeWidth={3} fill="none" strokeLinecap="round" transform="translate(-2 -2)" />}
      {needles}
      {/* plate: top face + two side faces */}
      <path d={`M${L[0]} ${L[1]} L${B[0]} ${B[1]} L${B[0]} ${B[1] + 10} L${L[0]} ${L[1] + 10} Z`} fill={C.stoneShade} />
      <path d={`M${B[0]} ${B[1]} L${R[0]} ${R[1]} L${R[0]} ${R[1] + 10} L${B[0]} ${B[1] + 10} Z`} fill={C.stoneDark} />
      <path d={`M${L[0]} ${L[1]} L${T[0]} ${T[1]} L${R[0]} ${R[1]} L${B[0]} ${B[1]} Z`} fill={C.metal} />
      <path d={`M${L[0] + 10} ${L[1]} L${T[0]} ${T[1] + 5} L${R[0] - 10} ${R[1]}`} stroke={C.paperLight} strokeWidth={3} opacity={0.45} fill="none" strokeLinejoin="round" />
      {wire && <circle cx={30} cy={-4} r={7} fill={C.caution} />}
    </g>
  );
};

/** Skull-top pedestal/connector of an implant. origin = base centre; ≈60 wide at s=1. */
const Pedestal: React.FC<{x: number; y: number; r?: number; t: number}> = ({x, y, r = 0, t}) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-30} y={-6} width={60} height={12} rx={4} fill={C.stoneDark} />
    <path d="M-20 -6 C-20 -30 20 -30 20 -6 Z" fill={C.metal} />
    <path d="M-14 -10 C-12 -20 -4 -24 4 -24" stroke={C.paperLight} strokeWidth={3} opacity={0.5} fill="none" strokeLinecap="round" />
    <circle cx={0} cy={-15} r={5} fill={C.theoryLight} opacity={0.55 + 0.45 * Math.sin(t * 4)} />
  </g>
);

/**
 * Human head, side profile (bald editorial style). origin = centre of the cranium; ≈450×540 at s=1
 * (neck bottom at y=+330). facing: way the face points. showBrain: cut-away revealing a Brain
 * (highlight / hp / signal / lobes pass through). Without brain, `highlight` shows as a glow on the skull.
 * eeg: EEG cap with electrodes + cable (t animates readings). implant: electrode array on motor cortex + pedestal.
 */
export const HeadProfile: React.FC<{
  x: number;
  y: number;
  s?: number;
  facing?: 'left' | 'right';
  skin?: string;
  skinShade?: string;
  showBrain?: boolean;
  highlight?: HL;
  highlightColor?: string;
  hp?: number;
  lobes?: boolean;
  signal?: number;
  eeg?: boolean;
  implant?: boolean;
  t?: number;
  o?: number;
}> = ({x, y, s = 1, facing = 'right', skin = C.skin[1], skinShade, showBrain = false, highlight, highlightColor = C.theoryLight, hp = 1, lobes = false, signal, eeg = false, implant = false, t = 0, o = 1}) => {
  if (o <= 0) return null;
  const fx = flip(facing);
  const id = uid('head', x, y, s);
  const si = C.skin.indexOf(skin);
  const sh = skinShade ?? (si >= 0 ? C.skinShade[si] : mix(skin, C.ink, 0.14));
  const hl = hlMap(highlight, highlightColor);
  const electrodes: Pt[] = [];
  if (eeg)
    [
      [178, 7],
      [122, 5],
      [66, 3],
    ].forEach(([rad, n]) => {
      for (let i = 0; i < n; i++) {
        const a = ((lerp(-158, -28, n === 1 ? 0.5 : i / (n - 1)) + (rad === 122 ? 0 : 0)) * Math.PI) / 180;
        electrodes.push([Math.cos(a) * rad * 1.02, -12 + Math.sin(a) * rad * 0.98]);
      }
    });
  electrodes.push([0, -14]);
  return (
    <g transform={`translate(${x} ${y}) scale(${s * fx} ${s})`} opacity={o}>
      <clipPath id={`${id}h`}>
        <path d={HEAD} />
      </clipPath>
      <path d={HEAD} fill={skin} />
      <g clipPath={`url(#${id}h)`}>
        {/* neck in shadow under the jaw */}
        <path d="M95 236 C40 290 -70 262 -135 180 L-160 420 L140 420 Z" fill={sh} />
      </g>
      <Shade id={`${id}s`} d={HEAD} dx={-16 * fx} dy={-12} color={sh} o={1} />
      {/* face details */}
      <path d="M150 -34 Q174 -44 194 -32" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.75} />
      <path d="M160 -6 Q172 -14 186 -6" stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
      <ellipse cx={176} cy={0} rx={5} ry={6} fill={C.ink} />
      <path d="M214 92 Q222 96 226 90" stroke={sh} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M190 143 L205 142" stroke={sh} strokeWidth={5} strokeLinecap="round" />
      {!showBrain && (
        <g>
          <path d="M-6 20 C-36 14 -46 50 -40 78 C-34 104 -12 116 4 110 C18 104 16 86 10 76 C22 56 26 26 -6 20 Z" fill={skin} />
          <path d="M-6 20 C-36 14 -46 50 -40 78 C-34 104 -12 116 4 110 C18 104 16 86 10 76 C22 56 26 26 -6 20 Z" fill="none" stroke={sh} strokeWidth={4} />
          <path d="M-4 40 C-22 40 -26 64 -20 82 C-16 92 -6 94 -2 88" stroke={sh} strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
      )}
      {!showBrain && Object.keys(hl).length > 0 && hp > 0 && (
        <g clipPath={`url(#${id}h)`}>
          {(Object.keys(hl) as BrainRegion[]).map((r) => {
            const a = BR_LABEL[r].a;
            return (
              <g key={r} fill={hl[r]}>
                {[1, 0.72, 0.46].map((k, i) => (
                  <circle key={i} cx={a[0] + 5} cy={a[1] - 30} r={110 * k} opacity={0.2 * clamp01(hp)} />
                ))}
              </g>
            );
          })}
        </g>
      )}
      {showBrain && (
        <g>
          <g transform="translate(5 -30)">
            <path d={HEAD_WINDOW} fill={C.bone} />
            <path d={HEAD_WINDOW} fill={mix(sh, C.oxDeep, 0.22)} transform="scale(0.94) translate(2 0)" />
          </g>
          <g transform="translate(5 -30)">
            <BrainArt id={id + 'b'} facing={facing} fill={C.oxTint} lobes={lobes} hl={hl} hp={hp} signal={signal} />
          </g>
        </g>
      )}
      {eeg && (
        <g>
          <clipPath id={`${id}cap`}>
            <path d={`${CAP_EDGE} L-400 -400 L400 -400 Z`} />
          </clipPath>
          <g clipPath={`url(#${id}h)`}>
            <g clipPath={`url(#${id}cap)`}>
              <path d={HEAD} fill={C.inkLift} />
              <path d={HEAD} fill={C.ink} opacity={0.35} mask={`url(#${id}s)`} />
              {/* elastic mesh between electrodes */}
              <g stroke={C.inkFaint} strokeWidth={3} fill="none" opacity={0.7}>
                {[178, 122, 66].map((rad) => (
                  <path key={rad} d={`M${Math.cos(-2.9) * rad} ${-12 + Math.sin(-2.9) * rad} A${rad} ${rad} 0 0 1 ${Math.cos(-0.35) * rad} ${-12 + Math.sin(-0.35) * rad}`} />
                ))}
                {[-155, -125, -93, -62, -32].map((ang) => (
                  <path key={ang} d={`M0 -12 L${Math.cos((ang * Math.PI) / 180) * 220} ${-12 + Math.sin((ang * Math.PI) / 180) * 220}`} />
                ))}
              </g>
            </g>
          </g>
          <path d={CAP_EDGE} stroke={C.ink} strokeWidth={6} fill="none" clipPath={`url(#${id}h)`} />
          {/* cable bundle off the back */}
          <path d="M-150 40 C-190 90 -230 170 -250 300" stroke={C.ink} strokeWidth={11} fill="none" strokeLinecap="round" />
          <path d="M-136 20 C-160 50 -150 40 -150 40" stroke={C.ink} strokeWidth={11} fill="none" strokeLinecap="round" />
          {electrodes.map(([ex, ey], i) => (
            <Electrode key={i} x={ex} y={ey} active={clamp01((Math.sin(t * 2.6 + i * 1.9) - 0.35) / 0.65)} />
          ))}
        </g>
      )}
      {implant && (
        <g>
          {showBrain ? (
            <g>
              <path d="M26 -150 C30 -175 40 -196 58 -210" stroke={C.caution} strokeWidth={6} fill="none" strokeLinecap="round" />
              <ElectrodeArray x={20} y={-160} s={0.42} r={10 * fx} t={t} active={1} wire={false} />
            </g>
          ) : (
            <path d="M58 -210 L40 -150" stroke={sh} strokeWidth={4} strokeDasharray="6 8" opacity={0.8} />
          )}
          <path d="M66 -224 C10 -262 -150 -240 -212 -130 C-232 -90 -240 -30 -244 30" stroke={C.inkLift} strokeWidth={8} fill="none" strokeLinecap="round" />
          <rect x={-256} y={24} width={24} height={40} rx={6} fill={C.inkSoft} />
          <rect x={-250} y={62} width={12} height={10} rx={2} fill={C.metal} />
          <Pedestal x={60} y={-208} r={20} t={t} />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// Lungs, heart, vessels, body

const LUNG_R: Pt[] = [[-30, -108], [-62, -100], [-90, -62], [-106, 0], [-112, 60], [-104, 108], [-70, 118], [-36, 110], [-22, 70], [-20, 20], [-22, -40], [-24, -90]];
const LUNG_L: Pt[] = [[30, -108], [62, -100], [90, -62], [106, 0], [112, 60], [104, 108], [72, 120], [46, 114], [32, 98], [40, 72], [30, 52], [20, 20], [22, -40], [24, -90]];
const LUNG_RD = smoothPath(LUNG_R, true);
const LUNG_LD = smoothPath(LUNG_L, true);

/**
 * Lungs, front view (trachea + bronchial tree). origin = centre; ≈240×300 at s=1 (trachea top y=-175).
 * breath 0→1 inflates. o2 1→0 shifts tissue toward grey stone (oxygen deprivation).
 */
export const Lungs: React.FC<{x: number; y: number; s?: number; breath?: number; o2?: number; color?: string; airway?: string; o?: number}> = ({
  x,
  y,
  s = 1,
  breath = 0.5,
  o2 = 1,
  color = C.oxTint,
  airway = C.paperLight,
  o = 1,
}) => {
  if (o <= 0) return null;
  const id = uid('lungs', x, y, s);
  const fill = mix(color, C.stone, 1 - clamp01(o2));
  const shade = mix(fill, C.oxLight, 0.45);
  const b = clamp01(breath);
  const lung = (d: string, cx: number, side: string) => (
    <g transform={`translate(${cx} -100) scale(${1 + 0.1 * b} ${1 + 0.06 * b}) translate(${-cx} 100)`}>
      <path d={d} fill={fill} />
      <Shade id={`${id}${side}`} d={d} dx={-12} dy={-14} color={shade} o={1} />
      <path d={side === 'r' ? 'M-30 -30 C-50 0 -80 30 -100 70' : 'M30 -10 C55 20 80 50 104 76'} stroke={shade} strokeWidth={4} fill="none" strokeLinecap="round" />
    </g>
  );
  const br = (sx: number) => (
    <g stroke={airway} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M0 -92 C${sx * 14} -76 ${sx * 30} -62 ${sx * 40} -46`} strokeWidth={14} />
      <path d={`M${sx * 40} -46 C${sx * 56} -28 ${sx * 66} -6 ${sx * 70} 26`} strokeWidth={8} />
      <path d={`M${sx * 40} -46 C${sx * 40} -20 ${sx * 38} 20 ${sx * 42} 60`} strokeWidth={7} />
      <path d={`M${sx * 54} -26 C${sx * 70} -40 ${sx * 76} -58 ${sx * 72} -76`} strokeWidth={5} />
      <path d={`M${sx * 66} 0 C${sx * 82} 6 ${sx * 90} 20 ${sx * 92} 36`} strokeWidth={4} />
      <path d={`M${sx * 70} 26 C${sx * 74} 46 ${sx * 72} 66 ${sx * 66} 84`} strokeWidth={4} />
      <path d={`M${sx * 40} 10 C${sx * 52} 22 ${sx * 56} 40 ${sx * 58} 54`} strokeWidth={4} />
      <path d={`M${sx * 42} 60 C${sx * 42} 76 ${sx * 46} 88 ${sx * 50} 96`} strokeWidth={4} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      {lung(LUNG_RD, -20, 'r')}
      {lung(LUNG_LD, 20, 'l')}
      <g opacity={0.85}>
        {br(-1)}
        {br(1)}
      </g>
      <rect x={-12} y={-175} width={24} height={90} rx={10} fill={C.bone} />
      <g stroke={C.boneShade} strokeWidth={4} strokeLinecap="round">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M-9 ${-165 + i * 14} L9 ${-165 + i * 14}`} />
        ))}
      </g>
    </g>
  );
};

/** Heartbeat curve: 0→1 lub-dub pulse at `bpm`, as a function of time t (s). */
export const heartPulse = (t: number, bpm = 72) => {
  const ph = (((t * bpm) / 60) % 1 + 1) % 1;
  return Math.exp(-(((ph - 0.04) / 0.045) ** 2)) + 0.6 * Math.exp(-(((ph - 0.22) / 0.045) ** 2));
};

const HEART_BODY = smoothPath(
  [[-72, -28], [-46, -56], [0, -62], [50, -56], [78, -22], [80, 22], [62, 66], [32, 104], [14, 114], [-14, 92], [-52, 44], [-74, 6]],
  true,
);

/** Anatomical-but-friendly heart (front view) with aorta, vena cava, pulmonary trunk. origin = centre; ≈200×260 at s=1. t + bpm = beat. */
export const Heart: React.FC<{x: number; y: number; s?: number; t?: number; bpm?: number; beat?: number; color?: string; o?: number}> = ({x, y, s = 1, t = 0, bpm = 72, beat, color = C.oxLight, o = 1}) => {
  if (o <= 0) return null;
  const id = uid('heart', x, y, s);
  const k = beat ?? heartPulse(t, bpm);
  const sc = 1 + 0.06 * k;
  const shade = mix(color, C.oxblood, 0.7);
  const vein = C.theoryLight;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * sc})`} opacity={o}>
      {/* behind: vena cava + descending aorta */}
      <path d="M-50 -40 L-50 -128" stroke={vein} strokeWidth={26} strokeLinecap="round" />
      <path d="M-56 -40 L-56 -128" stroke={C.theory} strokeWidth={8} opacity={0.35} />
      <path d="M-4 -50 C-8 -112 12 -136 42 -134 C66 -132 74 -112 72 -70" stroke={shade} strokeWidth={30} fill="none" />
      <path d="M-4 -50 C-8 -112 12 -136 42 -134 C66 -132 74 -112 72 -70" stroke={color} strokeWidth={22} fill="none" transform="translate(-3 -3)" />
      {[8, 30, 52].map((bx, i) => (
        <path key={i} d={`M${bx} ${-130 - (i === 1 ? 6 : 0)} L${bx + (i - 1) * 6} ${-166}`} stroke={color} strokeWidth={11} strokeLinecap="round" />
      ))}
      {/* atrium */}
      <ellipse cx={-62} cy={-26} rx={28} ry={32} fill={mix(color, C.oxTint, 0.35)} />
      <path d={HEART_BODY} fill={color} />
      <Shade id={`${id}s`} d={HEART_BODY} dx={-16} dy={-14} color={shade} o={1} />
      <Shade id={`${id}l`} d={HEART_BODY} dx={10} dy={12} color={C.paperLight} o={0.18} />
      <path d="M-62 -18 C-24 -6 30 -12 76 -2" stroke={C.oxDeep} strokeWidth={5} fill="none" opacity={0.45} strokeLinecap="round" />
      <path d="M22 -44 C8 4 12 56 30 104" stroke={C.oxDeep} strokeWidth={5} fill="none" opacity={0.45} strokeLinecap="round" />
      {/* pulmonary trunk (deoxygenated) */}
      <path d="M16 -40 C22 -70 40 -88 64 -96" stroke={vein} strokeWidth={24} fill="none" strokeLinecap="round" />
      <path d="M14 -46 C20 -70 34 -84 54 -92" stroke={C.theoryTint} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
    </g>
  );
};

/**
 * Blood vessel with flowing cells along a smooth path through `points` (absolute px).
 * Cells shift colour from `from` (start) to `to` (end), e.g. oxygenated oxblood → deoxygenated plum.
 * t = flow time, speed px/s, p = draw-on 0→1, width = lumen width.
 */
export const BloodVessel: React.FC<{
  points: Pt[];
  t?: number;
  speed?: number;
  width?: number;
  from?: string;
  to?: string;
  wall?: string;
  p?: number;
  density?: number;
  seed?: number;
}> = ({points, t = 0, speed = 90, width = 26, from = C.oxblood, to = C.oxblood, wall = C.oxTint, p = 1, density = 1, seed = 1}) => {
  if (p <= 0) return null;
  const c = makeCurve(points);
  const k = ease.inOut(clamp01(p));
  const n = Math.max(2, Math.floor((c.len / (width * 1.25)) * density));
  const lumen = mix(C.oxTint, C.paperLight, 0.55);
  return (
    <g>
      <path d={c.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} stroke={wall} strokeWidth={width + 14} fill="none" strokeLinecap="round" />
      <path d={c.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} stroke={lumen} strokeWidth={width} fill="none" strokeLinecap="round" />
      {Array.from({length: n}, (_, i) => {
        const u = (((i + rand(seed + i) * 0.5) / n + (t * speed) / c.len) % 1 + 1) % 1;
        if (u > k || u < 0.02 || u > 0.98) return null;
        const P = c.at(u);
        const off = (rand(seed * 3 + i) - 0.5) * width * 0.4;
        const rad = (P.a * Math.PI) / 180;
        const cx = P.x - Math.sin(rad) * off;
        const cy = P.y + Math.cos(rad) * off;
        const col = mix(from, to, u);
        const tilt = P.a + 90 + noise1(t * 0.8 + i, seed) * 35;
        return (
          <g key={i} transform={`translate(${r1(cx)} ${r1(cy)}) rotate(${r1(tilt)})`}>
            <ellipse rx={width * 0.36} ry={width * 0.26} fill={col} />
            <ellipse rx={width * 0.18} ry={width * 0.1} fill={mix(col, C.oxDeep, 0.5)} opacity={0.6} />
          </g>
        );
      })}
    </g>
  );
};

export type Organ = 'lungs' | 'heart' | 'brain' | 'stomach' | 'blood';

// Front-view silhouette (origin = between the feet, height 700 at s=1).
const BODY_R: Pt[] = [
  [17, -592], [21, -568], [60, -556], [102, -540], [123, -506], [128, -450], [134, -386], [142, -322], [151, -272], [146, -240], [128, -246],
  [122, -292], [112, -382], [98, -468], [86, -420], [78, -372], [90, -320], [88, -240], [72, -150], [74, -82], [52, -22], [68, -4], [14, -2],
  [20, -32], [16, -110], [12, -172], [8, -262],
];
const BODY_D = smoothPath([...BODY_R, [0, -298], ...BODY_R.slice().reverse().map(([a, b]) => [-a, b] as Pt)], true);
const VESSELS: Pt[][] = [
  [[8, -480], [6, -540], [4, -592], [0, -624]],
  [[0, -500], [-50, -540], [-104, -524], [-124, -452], [-132, -386], [-140, -322], [-142, -276]],
  [[16, -500], [56, -540], [104, -524], [124, -452], [132, -386], [140, -322], [142, -276]],
  [[6, -460], [4, -380], [0, -320], [-40, -296], [-52, -236], [-44, -150], [-42, -84], [-36, -24]],
  [[6, -460], [4, -380], [0, -320], [40, -296], [52, -236], [44, -150], [42, -84], [36, -24]],
];
const VESSEL_C = VESSELS.map((v) => makeCurve(v));

/**
 * Human figure, front view, with toggleable organs. origin = between the feet; ≈310×700 at s=1.
 * organs: {lungs, heart, brain, stomach, blood} each true or a 0→1 reveal. t drives breathing,
 * heartbeat and blood flow (oxygenated oxblood near the heart → deoxygenated plum at the extremities).
 */
export const BodyOutline: React.FC<{
  x: number;
  y: number;
  s?: number;
  t?: number;
  p?: number;
  organs?: Partial<Record<Organ, boolean | number>>;
  fill?: string;
  shade?: string;
  bpm?: number;
  o2?: number;
}> = ({x, y, s = 1, t = 0, p = 1, organs = {}, fill = C.paperDeep, shade = C.paperDark, bpm = 72, o2 = 1}) => {
  if (p <= 0) return null;
  const id = uid('body', x, y, s);
  const v = (o: Organ) => (organs[o] === true ? 1 : typeof organs[o] === 'number' ? clamp01(organs[o] as number) : 0);
  const k = ease.out(clamp01(p));
  const breath = 0.5 + 0.5 * Math.sin((t / 4) * Math.PI * 2);
  const blood = v('blood');
  return (
    <g transform={`translate(${x} ${y + (1 - k) * 20}) scale(${s})`} opacity={k}>
      <ellipse cx={0} cy={-648} rx={48} ry={58} fill={fill} />
      <path d={BODY_D} fill={fill} />
      <Shade id={`${id}s`} d={BODY_D} dx={-16} dy={-6} color={shade} o={1} />
      <Shade id={`${id}h`} d="M-48 -648 A48 58 0 1 0 48 -648 A48 58 0 1 0 -48 -648 Z" dx={-12} dy={-8} color={shade} o={1} />
      {blood > 0 && (
        <g>
          {VESSEL_C.map((c, i) => (
            <path key={i} d={c.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease.inOut(blood)} stroke={C.oxTint} strokeWidth={7} fill="none" strokeLinecap="round" />
          ))}
          {VESSEL_C.map((c, i) =>
            Array.from({length: Math.floor(c.len / 26)}, (_, j) => {
              const n = Math.floor(c.len / 26);
              const u = ((j / n + (t * 70) / c.len) % 1 + 1) % 1;
              if (u > blood) return null;
              const P = c.at(u);
              return <circle key={`${i}-${j}`} cx={P.x} cy={P.y} r={5.5} fill={mix(C.oxblood, C.theory, u)} />;
            }),
          )}
        </g>
      )}
      {v('stomach') > 0 && (
        <g transform={`translate(30 -392) scale(${ease.outBack(v('stomach'))})`}>
          <path d="M-20 -32 C-4 -42 22 -34 28 -10 C36 18 22 42 -6 42 C-24 42 -38 36 -46 30 C-32 22 -18 22 -12 10 C-8 0 -20 -10 -20 -32 Z" fill={C.cautionTint} />
          <path d="M28 -10 C36 18 22 42 -6 42 C-24 42 -38 36 -46 30 L-40 26 C-20 34 10 34 18 14 Z" fill={C.cautionLight} opacity={0.7} />
        </g>
      )}
      {v('lungs') > 0 && <Lungs x={0} y={-478} s={0.5 * (0.8 + 0.2 * ease.out(v('lungs')))} breath={breath} o={v('lungs')} o2={o2} />}
      {v('heart') > 0 && <Heart x={14} y={-462} s={0.3 * ease.outBack(v('heart'))} t={t} bpm={bpm} />}
      {v('brain') > 0 && (
        <g transform={`translate(0 -656) scale(${ease.outBack(v('brain'))})`}>
          <path d="M0 -30 C-22 -34 -40 -22 -40 -2 C-40 16 -28 26 -12 26 L0 20 L12 26 C28 26 40 16 40 -2 C40 -22 22 -34 0 -30 Z" fill={C.oxTint} />
          <path d="M28 -18 C40 -6 40 14 26 24 L14 22 C26 14 30 0 28 -18 Z" fill={C.oxLight} opacity={0.5} />
          <g stroke={mix(C.oxTint, C.oxDeep, 0.5)} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6}>
            <path d="M0 -28 L0 20" />
            <path d="M-30 -12 C-22 -18 -14 -8 -8 -14" />
            <path d="M-32 6 C-24 0 -16 12 -8 4" />
            <path d="M30 -12 C22 -18 14 -8 8 -14" />
            <path d="M32 6 C24 0 16 12 8 4" />
          </g>
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// Eyes

/**
 * Eye, front view, with lids. origin = centre; ≈330×200 at s=1. look [-1..1, -1..1] moves the iris,
 * blink 0 (open) → 1 (closed), pupil 0 (pinpoint) → 1 (dilated). frame = skin lid patch around it.
 */
export const Eye: React.FC<{x: number; y: number; s?: number; look?: [number, number]; blink?: number; pupil?: number; iris?: string; skin?: string; frame?: boolean}> = ({
  x,
  y,
  s = 1,
  look = [0, 0],
  blink = 0,
  pupil = 0.45,
  iris = C.evidenceLight,
  skin = C.skin[1],
  frame = true,
}) => {
  const id = uid('eye', x, y, s);
  const si = C.skin.indexOf(skin);
  const sh = si >= 0 ? C.skinShade[si] : mix(skin, C.ink, 0.14);
  const b = clamp01(blink);
  const up = lerp(-66, 26, ease.inOut(b));
  const lo = lerp(48, 30, b);
  const W2 = 128;
  const upper = `M${-W2} 4 C${-W2 * 0.45} ${up * 1.33} ${W2 * 0.5} ${up * 1.33} ${W2} 0`;
  const opening = `${upper} C${W2 * 0.5} ${lo * 1.33} ${-W2 * 0.45} ${lo * 1.33} ${-W2} 4 Z`;
  const ix = look[0] * 52;
  const iy = look[1] * 22;
  const ir = 54;
  const pr = ir * lerp(0.26, 0.68, clamp01(pupil));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {frame && (
        <g>
          <path d="M-170 10 C-140 -118 140 -118 170 6 C130 92 -120 96 -170 10 Z" fill={skin} />
          <path d="M-150 -6 C-90 -104 92 -104 150 -10" stroke={sh} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.8} />
        </g>
      )}
      {up < lo - 3 && (
        <g>
          <clipPath id={`${id}o`}>
            <path d={opening} />
          </clipPath>
          <path d={opening} fill={C.paperLight} />
          <g clipPath={`url(#${id}o)`}>
            <path d={opening} fill={C.paperShade} transform="translate(10 16)" opacity={0} />
            <circle cx={ix} cy={iy} r={ir} fill={iris} />
            <circle cx={ix} cy={iy} r={ir} fill="none" stroke={mix(iris, C.ink, 0.45)} strokeWidth={6} />
            <g stroke={mix(iris, C.paperLight, 0.35)} strokeWidth={3} opacity={0.6}>
              {Array.from({length: 12}, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return <path key={i} d={`M${ix + Math.cos(a) * (pr + 6)} ${iy + Math.sin(a) * (pr + 6)} L${ix + Math.cos(a) * (ir - 10)} ${iy + Math.sin(a) * (ir - 10)}`} />;
              })}
            </g>
            <circle cx={ix} cy={iy} r={pr} fill={C.ink} />
            <circle cx={ix - 20} cy={iy - 20} r={11} fill={C.paperLight} opacity={0.9} />
            <circle cx={ix + 16} cy={iy + 14} r={5} fill={C.paperLight} opacity={0.5} />
            {/* lid shadow on the eyeball */}
            <path d={upper} stroke={C.ink} strokeWidth={24} opacity={0.12} fill="none" />
          </g>
          <path d={`M${-W2} 4 C${-W2 * 0.45} ${lo * 1.33} ${W2 * 0.5} ${lo * 1.33} ${W2} 0`} stroke={sh} strokeWidth={4} fill="none" />
        </g>
      )}
      <path d={upper} stroke={C.ink} strokeWidth={8} fill="none" strokeLinecap="round" />
      <g stroke={C.ink} strokeWidth={5} strokeLinecap="round">
        <path d={`M${W2 - 4} 0 Q${W2 + 10} -4 ${W2 + 18} -16`} fill="none" />
      </g>
    </g>
  );
};

/**
 * Eye cross-section (side view, light enters from the right). origin = eyeball centre; R=150
 * (≈440×300 at s=1 incl. optic nerve). rays 0→1 draws light focusing on the retina. labels on/off.
 */
export const EyeCrossSection: React.FC<{x: number; y: number; s?: number; rays?: number; labels?: boolean; labelP?: number; children?: React.ReactNode}> = ({
  x,
  y,
  s = 1,
  rays = 0,
  labels = false,
  labelP = 1,
  children,
}) => {
  const id = uid('eyex', x, y, s);
  const vit = mix(C.paperLight, C.water, 0.12);
  const focus: Pt = [-126, 6];
  const rk = ease.inOut(clamp01(rays));
  const L = (ax: number, ay: number, lx: number, ly: number, text: string, i: number) => (
    <Leader key={text} ax={x + ax * s} ay={y + ay * s} lx={x + lx * s} ly={y + ly * s} text={text} p={clamp01(labelP * 1.6 - i * 0.12)} />
  );
  return (
    <g>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <clipPath id={`${id}v`}>
          <circle r={126} />
        </clipPath>
        {/* optic nerve */}
        <path d="M-120 -26 C-170 -30 -210 -40 -250 -44 L-250 40 C-210 36 -170 30 -120 26 Z" fill={C.bone} />
        <path d="M-250 22 C-210 20 -170 22 -130 18 L-120 26 C-170 30 -210 36 -250 40 Z" fill={C.boneShade} />
        <path d="M-136 -4 C-180 -8 -220 -12 -250 -12" stroke={C.oxLight} strokeWidth={5} fill="none" opacity={0.7} />
        {/* sclera, choroid, retina, vitreous */}
        <circle r={150} fill={C.paperLight} />
        <path d="M0 150 A150 150 0 0 1 -150 0 L-140 0 A140 140 0 0 0 0 140 Z" fill={C.paperShade} />
        <circle r={140} fill={C.oxTint} />
        <circle r={133} fill={C.oxLight} />
        <circle r={126} fill={vit} />
        <g clipPath={`url(#${id}v)`}>{children}</g>
        {/* optic disc gap */}
        <rect x={-142} y={-12} width={20} height={24} fill={C.bone} />
        {/* front: anterior chamber + cornea wipe the back layers */}
        <path d="M112 -100 C180 -82 196 -30 196 0 C196 30 180 82 112 100 C126 60 130 30 130 0 C130 -30 126 -60 112 -100 Z" fill={mix(C.paperLight, C.water, 0.1)} />
        <path d="M112 -100 C180 -82 196 -30 196 0 C196 30 180 82 112 100" stroke={C.water} strokeWidth={6} fill="none" strokeLinecap="round" />
        {/* ciliary body + zonules */}
        <path d="M100 -112 L126 -92 L104 -80 Z" fill={C.oxLight} />
        <path d="M100 112 L126 92 L104 80 Z" fill={C.oxLight} />
        <g stroke={C.inkFaint} strokeWidth={3} opacity={0.7}>
          <path d="M108 -84 L98 -58" />
          <path d="M108 84 L98 58" />
        </g>
        {/* lens */}
        <ellipse cx={96} cy={0} rx={26} ry={62} fill={C.cautionTint} />
        <path d="M110 -46 C122 -20 122 20 110 46 C118 20 118 -20 110 -46 Z" fill={C.cautionLight} opacity={0.6} />
        <ellipse cx={96} cy={0} rx={26} ry={62} fill="none" stroke={C.cautionLight} strokeWidth={4} />
        {/* iris */}
        <path d="M124 -94 L124 -32" stroke={C.evidenceLight} strokeWidth={12} strokeLinecap="round" />
        <path d="M124 94 L124 32" stroke={C.evidenceLight} strokeWidth={12} strokeLinecap="round" />
        {/* fovea */}
        <circle cx={focus[0] - 4} cy={focus[1]} r={4} fill={C.oxblood} />
        {rk > 0 &&
          [-58, 0, 58].map((oy, i) => {
            const d = `M330 ${oy} L196 ${oy * 0.92} L104 ${oy * 0.75} L${focus[0]} ${focus[1]}`;
            return <path key={i} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - rk} stroke={C.caution} strokeWidth={4} fill="none" strokeLinejoin="round" strokeLinecap="round" />;
          })}
        {rk >= 1 && <circle cx={focus[0]} cy={focus[1]} r={9} fill={C.caution} />}
        {/* outline of the globe */}
        <path d="M112 -100 A150 150 0 1 0 112 100" stroke={C.paperDark} strokeWidth={4} fill="none" />
      </g>
      {labels && (
        <g>
          {L(186, -46, 236, -150, 'Cornea', 0)}
          {L(96, 40, 210, 168, 'Lens', 1)}
          {L(124, -64, 120, -196, 'Iris', 2)}
          {L(-96, -96, -120, -196, 'Retina', 3)}
          {L(-200, 24, -130, 196, 'Optic nerve', 4)}
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// Neurons & synapse

type NeuronGeo = {soma: string; dend: string[]; axon: Curve; myelin: [number, number][]; terms: {c: Curve; end: Pt}[]};
const neuronCache = new Map<string, NeuronGeo>();
const neuronGeo = (seed: number, length: number): NeuronGeo => {
  const key = `${seed}|${length}`;
  const hit = neuronCache.get(key);
  if (hit) return hit;
  const somaPts: Pt[] = Array.from({length: 9}, (_, i) => {
    const a = (i / 9) * Math.PI * 2;
    const r = randRange(seed * 11 + i, 40, 52);
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
  const dend: string[] = [];
  [80, 128, 165, 200, 238, 278].forEach((deg, i) => {
    const a = ((deg + randRange(seed + i * 3, -10, 10)) * Math.PI) / 180;
    const len = randRange(seed + i * 5, 100, 140);
    const bend = randRange(seed + i * 7, -0.35, 0.35);
    const pts: Pt[] = [0, 0.33, 0.66, 1].map((u) => {
      const aa = a + bend * u;
      return [Math.cos(aa) * (24 + len * u), Math.sin(aa) * (24 + len * u)];
    });
    dend.push(taper(makeCurve(pts, false, 8), 26, 6));
    // secondary branch
    const c = makeCurve(pts, false, 8);
    const m = c.at(0.55);
    [1, -1].forEach((sg, j) => {
      if (j === 1 && rand(seed + i * 13) < 0.5) return;
      const b2 = a + sg * randRange(seed + i * 17 + j, 0.45, 0.8);
      const l2 = randRange(seed + i * 19 + j, 50, 80);
      const p2: Pt[] = [[m.x, m.y], [m.x + Math.cos(b2) * l2 * 0.5, m.y + Math.sin(b2) * l2 * 0.5], [m.x + Math.cos(b2 + sg * 0.2) * l2, m.y + Math.sin(b2 + sg * 0.2) * l2]];
      dend.push(taper(makeCurve(p2, false, 8), 13, 4));
    });
    // end fork
    const e = c.at(1);
    [-0.45, 0.45].forEach((da) => {
      const l3 = 34;
      const p3: Pt[] = [[e.x - Math.cos(a) * 6, e.y - Math.sin(a) * 6], [e.x + Math.cos(a + da) * l3, e.y + Math.sin(a + da) * l3]];
      dend.push(taper(makeCurve(p3, false, 6), 8, 3.5));
    });
  });
  const L = length;
  const axon = makeCurve([[30, 0], [L * 0.22, -14], [L * 0.45, 10], [L * 0.68, -10], [L * 0.86, 4]]);
  const myelin: [number, number][] = [0, 1, 2, 3, 4].map((i) => [0.14 + i * 0.165, 0.14 + i * 0.165 + 0.135]);
  const end = axon.at(1);
  const terms = [-0.75, -0.25, 0.25, 0.75].map((da, i) => {
    const l = 60 + (i % 2) * 14;
    const tip: Pt = [end.x + Math.cos(da) * l, end.y + Math.sin(da) * l];
    return {c: makeCurve([[end.x, end.y], [end.x + Math.cos(da * 0.5) * l * 0.5, end.y + Math.sin(da * 0.5) * l * 0.5], tip], false, 8), end: tip};
  });
  const g = {soma: smoothPath(somaPts, true), dend, axon, myelin, terms};
  neuronCache.set(key, g);
  return g;
};

/**
 * Neuron (soma + dendrites + myelinated axon + terminals), axon pointing right. origin = soma centre;
 * ≈(length+80)×330 at s=1. signal 0→1 = plum action potential running down the axon; terminals flash at the end.
 */
export const Neuron: React.FC<{x: number; y: number; s?: number; r?: number; length?: number; signal?: number; seed?: number; color?: string; o?: number}> = ({
  x,
  y,
  s = 1,
  r = 0,
  length = 560,
  signal,
  seed = 3,
  color = C.oxTint,
  o = 1,
}) => {
  if (o <= 0) return null;
  const g = neuronGeo(seed, length);
  const shade = mix(color, C.oxLight, 0.5);
  const sig = signal ?? -1;
  const flash = clamp01(1 - Math.abs(sig - 1.02) / 0.12);
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      <path d={g.axon.d} stroke={color} strokeWidth={12} fill="none" strokeLinecap="round" />
      {g.terms.map((tm, i) => (
        <g key={i}>
          <path d={tm.c.d} stroke={color} strokeWidth={8} fill="none" strokeLinecap="round" />
          <circle cx={tm.end[0]} cy={tm.end[1]} r={13} fill={mix(color, C.theoryLight, flash)} />
          <circle cx={tm.end[0] + 3} cy={tm.end[1] + 3} r={13} fill={shade} opacity={0.6} clipPath="none" />
          <circle cx={tm.end[0] - 1.5} cy={tm.end[1] - 1.5} r={10.5} fill={mix(color, C.theoryLight, flash)} />
          {flash > 0 && <circle cx={tm.end[0]} cy={tm.end[1]} r={13 + 14 * flash} fill={C.theoryLight} opacity={0.3 * flash} />}
        </g>
      ))}
      {g.dend.map((d, i) => (
        <path key={i} d={d} fill={color} />
      ))}
      <path d={g.soma} fill={color} />
      <Shade id={uid('neu', x, y, s, seed)} d={g.soma} dx={-10} dy={-10} color={shade} o={1} />
      <circle cx={-4} cy={-3} r={14} fill={mix(color, C.theory, 0.35)} />
      <circle cx={-8} cy={-7} r={4} fill={C.paperLight} opacity={0.6} />
      {g.myelin.map(([a, b], i) => {
        const mid = (a + b) / 2;
        const lit = sig > 0 ? clamp01(1 - Math.abs(sig - mid) / 0.1) : 0;
        return (
          <g key={i}>
            <path d={g.axon.sub(a, b)} stroke={mix(C.boneShade, C.theoryLight, lit)} strokeWidth={30} fill="none" strokeLinecap="round" />
            <path d={g.axon.sub(a, b)} stroke={mix(C.paperLight, C.theoryTint, lit)} strokeWidth={22} fill="none" strokeLinecap="round" transform="translate(-1.5 -3)" />
          </g>
        );
      })}
      {sig > 0 && <SignalDot c={g.axon} k={sig} r={11} trail={0.16} />}
    </g>
  );
};

/**
 * Synapse close-up: presynaptic terminal (top) releasing plum neurotransmitter across the cleft to
 * receptors on the postsynaptic spine (bottom). origin = centre of the cleft; ≈340×420 at s=1. p 0→1 = one release.
 */
export const Synapse: React.FC<{x: number; y: number; s?: number; p?: number; t?: number; color?: string}> = ({x, y, s = 1, p = 0, t = 0, color = C.oxTint}) => {
  const id = uid('syn', x, y, s);
  const shade = mix(color, C.oxLight, 0.5);
  const PRE = 'M-62 -230 L-62 -150 C-140 -130 -158 -40 -122 -20 L122 -20 C158 -40 140 -130 62 -150 L62 -230 Z';
  const POST = 'M-62 230 L-62 150 C-140 130 -158 40 -122 20 L122 20 C158 40 140 130 62 150 L62 230 Z';
  const recX = [-96, -58, -20, 20, 58, 96];
  const rel = clamp01(p);
  const ves: Pt[] = [[-70, -70], [-20, -100], [36, -78], [80, -56], [-90, -40], [10, -48], [-40, -40], [58, -110]];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={PRE} fill={color} />
      <Shade id={`${id}a`} d={PRE} dx={-14} dy={-12} color={shade} o={1} />
      <path d={POST} fill={color} />
      <Shade id={`${id}b`} d={POST} dx={-14} dy={-12} color={shade} o={1} />
      {/* membranes */}
      <path d="M-122 -20 L122 -20" stroke={mix(color, C.oxDeep, 0.4)} strokeWidth={5} strokeLinecap="round" />
      <path d="M-122 20 L122 20" stroke={mix(color, C.oxDeep, 0.4)} strokeWidth={5} strokeLinecap="round" />
      {/* vesicles */}
      {ves.map(([vx, vy], i) => {
        const fusing = i === 5 || i === 6 ? ease.inOut(clamp01(rel * 3)) : 0;
        const yy = lerp(vy + noise1(t * 0.6 + i, 4) * 4, -34, fusing);
        const open = i === 5 || i === 6 ? clamp01(rel * 3 - 0.8) : 0;
        if (open >= 1) return null;
        return (
          <g key={i} opacity={1 - open}>
            <circle cx={vx + noise1(t * 0.5 + i, 2) * 4} cy={yy} r={20} fill={C.paperLight} stroke={C.theoryLight} strokeWidth={4} />
            {[0, 1, 2, 3].map((j) => (
              <circle key={j} cx={vx + Math.cos(j * 1.7 + i) * 8} cy={yy + Math.sin(j * 1.7 + i) * 8} r={4} fill={C.theory} />
            ))}
          </g>
        );
      })}
      {/* receptors */}
      {recX.map((rx, i) => {
        const lit = clamp01((rel - 0.45 - i * 0.04) * 4);
        return <rect key={i} x={rx - 10} y={14} width={20} height={18} rx={5} fill={mix(C.evidenceLight, C.theoryLight, lit)} />;
      })}
      {/* neurotransmitters crossing the cleft */}
      {rel > 0.25 &&
        Array.from({length: 18}, (_, i) => {
          const k = clamp01((rel - 0.25 - rand(i + 3) * 0.2) / 0.45);
          if (k <= 0) return null;
          const sx0 = (i % 2 ? 10 : -40) + randRange(i * 3.1, -12, 12);
          const ex = recX[i % recX.length] + randRange(i * 5.3, -8, 8);
          const px = lerp(sx0, ex, ease.inOut(k)) + Math.sin(k * 9 + i) * 10 * (1 - k);
          const py = lerp(-22, 8, ease.inOut(k)) - Math.sin(Math.PI * k) * randRange(i * 7, -6, 30);
          return <circle key={i} cx={px} cy={py} r={5.5} fill={C.theory} opacity={1 - clamp01((rel - 0.9) * 10) * 0.5} />;
        })}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// Cells & germs

const blobPts = (R: number, n: number, rf: (a: number) => number): Pt[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = R * rf(a);
    return [Math.cos(a) * r, Math.sin(a) * r];
  });

/**
 * Generic animal cell: wobbling membrane, nucleus + nucleolus, mitochondria, ER, vesicles.
 * origin = centre; r=110 at s=1. t = wobble/drift; tone: 'healthy' (green) | 'stressed' (mustard) | 'neutral' (paper).
 */
export const Cell: React.FC<{x: number; y: number; s?: number; t?: number; seed?: number; tone?: 'healthy' | 'stressed' | 'neutral'; r?: number}> = ({
  x,
  y,
  s = 1,
  t = 0,
  seed = 1,
  tone = 'healthy',
  r = 110,
}) => {
  const id = uid('cell', x, y, s, seed);
  const [fill, mem] = tone === 'healthy' ? [C.evidenceTint, C.evidenceLight] : tone === 'stressed' ? [C.cautionTint, C.cautionLight] : [C.paperLight, C.paperDark];
  const ph = [rand(seed) * 6.28, rand(seed + 1) * 6.28, rand(seed + 2) * 6.28];
  const out = smoothPath(
    blobPts(r, 40, (a) => 1 + 0.035 * Math.sin(2 * a + t * 0.9 + ph[0]) + 0.025 * Math.sin(3 * a - t * 1.3 + ph[1]) + 0.015 * Math.sin(5 * a + t * 1.7 + ph[2])),
    true,
  );
  const dx = (k: number) => noise1(t * 0.4 + k, seed) * 4;
  const mito = (mx: number, my: number, rot: number, k: number) => (
    <g key={k} transform={`translate(${mx + dx(k)} ${my + dx(k + 5)}) rotate(${rot + noise1(t * 0.3 + k, seed) * 8})`}>
      <rect x={-26} y={-12} width={52} height={24} rx={12} fill={C.cautionLight} />
      <rect x={-24} y={-11} width={46} height={19} rx={9.5} fill={C.cautionTint} />
      <path d="M-16 -8 L-16 4 M-6 -8 L-6 4 M4 -8 L4 4 M14 -8 L14 4" stroke={C.cautionLight} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={out} fill={fill} />
      <Shade id={`${id}s`} d={out} dx={-14} dy={-14} color={mem} o={0.35} />
      <path d={out} fill="none" stroke={mem} strokeWidth={6} />
      <g stroke={mem} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7}>
        <path d={`M${-70 + dx(1)} 30 C-50 56 -20 70 12 66`} />
        <path d={`M${-62 + dx(2)} 46 C-40 72 -6 84 24 80`} />
      </g>
      {mito(48, -46, 30, 1)}
      {mito(60, 34, -50, 2)}
      {mito(-52, 52, 10, 3)}
      {[
        [30, 70],
        [76, -4],
        [-78, -20],
        [-30, -74],
      ].map(([vx, vy], i) => (
        <circle key={i} cx={vx + dx(i + 9)} cy={vy + dx(i + 12)} r={7 + (i % 2) * 3} fill={C.paperLight} stroke={mem} strokeWidth={3} />
      ))}
      <g transform={`translate(${-14 + dx(20)} ${-8 + dx(21)})`}>
        <circle r={42} fill={C.theoryTint} />
        <circle r={42} fill="none" stroke={C.theoryLight} strokeWidth={5} />
        <circle cx={8} cy={6} r={14} fill={C.theoryLight} />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={Math.cos(i * 1.3) * 26} cy={Math.sin(i * 1.3) * 22} r={3.5} fill={C.theoryLight} opacity={0.7} />
        ))}
      </g>
    </g>
  );
};

/**
 * Immune cell (macrophage/neutrophil-style) patrolling: blobby body with pseudopods reaching toward
 * `heading` (degrees, 0 = right), lobed nucleus, granules. origin = centre; r=70 at s=1. t animates.
 */
export const ImmuneCell: React.FC<{x: number; y: number; s?: number; t?: number; heading?: number; seed?: number; color?: string; membrane?: string}> = ({
  x,
  y,
  s = 1,
  t = 0,
  heading = 0,
  seed = 1,
  color = C.evidenceTint,
  membrane = C.evidenceLight,
}) => {
  const id = uid('imm', x, y, s, seed);
  const h = (heading * Math.PI) / 180;
  const pods = [
    {a: h, amp: 0.42 + 0.16 * Math.sin(t * 1.4 + seed), w: 0.32},
    {a: h + 1.25, amp: 0.22 + 0.16 * Math.sin(t * 1.1 + seed * 2), w: 0.26},
    {a: h - 1.35, amp: 0.2 + 0.17 * Math.sin(t * 1.25 + seed * 3 + 1), w: 0.24},
    {a: h + 2.7, amp: 0.1 + 0.08 * Math.sin(t * 0.9 + seed), w: 0.4},
  ];
  const wrap = (d: number) => Math.atan2(Math.sin(d), Math.cos(d));
  const out = smoothPath(
    blobPts(70, 64, (a) => {
      let r = 1 + 0.04 * Math.sin(3 * a + t * 1.6 + seed) + 0.03 * Math.sin(5 * a - t * 2.1);
      for (const p of pods) r += p.amp * Math.exp(-((wrap(a - p.a) / p.w) ** 2));
      return r;
    }),
    true,
  );
  const back = h + Math.PI;
  const nx = Math.cos(back) * 16;
  const ny = Math.sin(back) * 16;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={out} fill={color} />
      <Shade id={`${id}s`} d={out} dx={-12} dy={-12} color={membrane} o={0.4} />
      <path d={out} fill="none" stroke={membrane} strokeWidth={5} strokeLinejoin="round" />
      {Array.from({length: 11}, (_, i) => {
        const a = rand(seed * 7 + i) * 6.28 + t * 0.2;
        const rr = randRange(seed * 3 + i, 18, 52);
        return <circle key={i} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr} r={randRange(i + seed, 3.5, 6)} fill={membrane} opacity={0.75} />;
      })}
      <g transform={`translate(${nx} ${ny}) rotate(${(back * 180) / Math.PI + noise1(t * 0.5, seed) * 10})`}>
        {[
          [-6, -14, 15],
          [8, 4, 16],
          [-10, 16, 13],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={C.evidence} />
        ))}
        <circle cx={-10} cy={-18} r={4} fill={C.evidenceLight} />
      </g>
    </g>
  );
};

export type GermKind = 'rod' | 'coccus' | 'spiral' | 'virus';

/** Bacterium: 'rod' (bacillus with flagellum), 'coccus' (grape cluster), 'spiral'. origin = centre; ≈160 at s=1. seed = pose; t = wiggle. */
export const Bacterium: React.FC<{x: number; y: number; s?: number; kind?: Exclude<GermKind, 'virus'>; seed?: number; t?: number; color?: string; shade?: string}> = ({
  x,
  y,
  s = 1,
  kind = 'rod',
  seed = 1,
  t = 0,
  color = C.cautionLight,
  shade = C.caution,
}) => {
  const rot = randRange(seed, -40, 40) + noise1(t * 0.3, seed) * 6;
  if (kind === 'coccus') {
    const n = 4 + Math.floor(rand(seed + 2) * 4);
    const pts: Pt[] = [[0, 0]];
    for (let i = 1; i < n; i++) {
      const a = rand(seed * 5 + i) * 6.28;
      const base = pts[Math.floor(rand(seed * 3 + i) * pts.length)];
      pts.push([base[0] + Math.cos(a) * 38, base[1] + Math.sin(a) * 38]);
    }
    const cx = pts.reduce((m, p) => m + p[0], 0) / n;
    const cy = pts.reduce((m, p) => m + p[1], 0) / n;
    return (
      <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
        {pts
          .slice()
          .sort((a, b) => a[1] - b[1])
          .map(([px, py], i) => (
            <Ball key={i} x={px - cx + noise1(t + i, seed) * 2} y={py - cy} r={23} fill={color} shade={shade} />
          ))}
      </g>
    );
  }
  if (kind === 'spiral') {
    const pts: Pt[] = Array.from({length: 13}, (_, i) => [-90 + i * 15, Math.sin(i * 0.95 - t * 4) * 18]);
    const c = makeCurve(pts, false, 8);
    return (
      <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
        <path d={c.d} stroke={shade} strokeWidth={20} fill="none" strokeLinecap="round" />
        <path d={c.d} stroke={color} strokeWidth={12} fill="none" strokeLinecap="round" transform="translate(-1.5 -2.5)" />
      </g>
    );
  }
  const fl: Pt[] = Array.from({length: 7}, (_, i) => [-58 - i * 16, Math.sin(i * 1.1 - t * 7) * (4 + i * 2.2)]);
  const body = 'M-56 -22 L56 -22 A22 22 0 0 1 56 22 L-56 22 A22 22 0 0 1 -56 -22 Z';
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
      <path d={makeCurve(fl, false, 8).d} stroke={shade} strokeWidth={4} fill="none" strokeLinecap="round" />
      {[-30, 0, 30].map((px, i) => (
        <g key={i} stroke={shade} strokeWidth={3} strokeLinecap="round">
          <path d={`M${px} -22 L${px + 4} -34`} />
          <path d={`M${px + 10} 22 L${px + 6} 34`} />
        </g>
      ))}
      <path d={body} fill={shade} />
      <path d={body} fill={color} transform="translate(-2 -3) scale(0.97 0.86)" />
      <path d="M-34 -2 C-20 -12 -8 8 6 -2 C18 -10 28 6 38 -2" stroke={shade} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
      <circle cx={-48} cy={-8} r={4} fill={C.paperLight} opacity={0.6} />
    </g>
  );
};

/** Virus (spiked capsid, corona-like). origin = centre; ≈130 at s=1. t = slow spin; seed = pose. */
export const Virus: React.FC<{x: number; y: number; s?: number; seed?: number; t?: number; color?: string; shade?: string}> = ({
  x,
  y,
  s = 1,
  seed = 1,
  t = 0,
  color = C.cautionTint,
  shade = C.caution,
}) => {
  const rot = rand(seed) * 360 + t * 12;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g transform={`rotate(${rot})`}>
        {Array.from({length: 14}, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const c = Math.cos(a);
          const sn = Math.sin(a);
          return (
            <g key={i}>
              <path d={`M${c * 40} ${sn * 40} L${c * 58} ${sn * 58}`} stroke={shade} strokeWidth={5} strokeLinecap="round" />
              <circle cx={c * 61} cy={sn * 61} r={7.5} fill={C.cautionLight} stroke={shade} strokeWidth={3} />
            </g>
          );
        })}
      </g>
      <Ball x={0} y={0} r={46} fill={color} shade={C.cautionLight} />
      <g transform={`rotate(${rot})`} fill={shade} opacity={0.55}>
        {[
          [-14, -10],
          [12, -16],
          [16, 12],
          [-10, 16],
          [2, 0],
        ].map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r={4.5} />
        ))}
      </g>
    </g>
  );
};

/** Germ dispatcher: kind 'rod' | 'coccus' | 'spiral' | 'virus'. origin = centre. */
export const Germ: React.FC<{x: number; y: number; s?: number; kind?: GermKind; seed?: number; t?: number; color?: string; shade?: string}> = ({kind = 'rod', ...p}) =>
  kind === 'virus' ? <Virus {...p} /> : <Bacterium kind={kind} {...p} />;

// ---------------------------------------------------------------------------------------------
// Molecules

/** DNA double helix along x. origin = centre; length × (2·radius) at s=1. t = rotation, p = build left→right. */
export const DNA: React.FC<{x: number; y: number; s?: number; r?: number; length?: number; radius?: number; pitch?: number; t?: number; p?: number; speed?: number; seed?: number; backbone?: string}> = ({
  x,
  y,
  s = 1,
  r = 0,
  length = 560,
  radius = 56,
  pitch = 230,
  t = 0,
  p = 1,
  speed = 1.2,
  seed = 2,
  backbone = C.inkLift,
}) => {
  if (p <= 0) return null;
  const x0 = -length / 2;
  const reach = length * clamp01(p);
  const ph = (xx: number) => ((xx - x0) / pitch) * Math.PI * 2 + t * speed;
  const off = Math.PI * 0.78;
  const N = Math.ceil(reach / 5);
  const back: React.ReactNode[] = [];
  const front: React.ReactNode[] = [];
  [0, off].forEach((o, si) => {
    for (let i = 0; i < N; i++) {
      const xa = x0 + i * 5;
      const xb = Math.min(x0 + reach, xa + 5.5);
      const ya = Math.sin(ph(xa) + o) * radius;
      const yb = Math.sin(ph(xb) + o) * radius;
      const z = Math.cos(ph((xa + xb) / 2) + o);
      const el = <path key={`${si}-${i}`} d={`M${r1(xa)} ${r1(ya)} L${r1(xb)} ${r1(yb)}`} stroke={z >= 0 ? backbone : C.inkFaint} strokeWidth={z >= 0 ? 11 : 8} strokeLinecap="round" />;
      (z >= 0 ? front : back).push(el);
    }
  });
  const pairs: [string, string][] = [
    [C.oxLight, C.cautionLight],
    [C.cautionLight, C.oxLight],
    [C.evidenceLight, C.theoryLight],
    [C.theoryLight, C.evidenceLight],
  ];
  const rungs: React.ReactNode[] = [];
  const step = pitch / 10;
  for (let xx = x0 + step / 2; xx < x0 + reach; xx += step) {
    const i = Math.round((xx - x0) / step);
    const ya = Math.sin(ph(xx)) * radius;
    const yb = Math.sin(ph(xx) + off) * radius;
    const grow = ease.out(clamp01((x0 + reach - xx) / 60));
    const [ca, cb] = pairs[Math.floor(rand(seed * 31 + i) * 4)];
    const ym = (ya + yb) / 2;
    rungs.push(
      <g key={i} opacity={0.55 + 0.45 * Math.abs(ya - yb) / (radius * 1.85)}>
        <path d={`M${r1(xx)} ${r1(ya)} L${r1(xx)} ${r1(lerp(ya, ym, grow))}`} stroke={ca} strokeWidth={7} strokeLinecap="round" />
        <path d={`M${r1(xx)} ${r1(yb)} L${r1(xx)} ${r1(lerp(yb, ym, grow))}`} stroke={cb} strokeWidth={7} strokeLinecap="round" />
      </g>,
    );
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      {back}
      {rungs}
      {front}
    </g>
  );
};

type Atom = {el: 'O' | 'C' | 'H' | 'N'; x: number; y: number};
const ATOM: Record<Atom['el'], {r: number; fill: string; shade: string}> = {
  O: {r: 30, fill: C.oxLight, shade: C.oxblood},
  C: {r: 28, fill: C.inkLift, shade: C.ink},
  H: {r: 18, fill: C.paperLight, shade: C.paperDark},
  N: {r: 29, fill: C.theoryLight, shade: C.theory},
};
const MOLS: Record<string, {atoms: Atom[]; bonds: [number, number, number][]}> = {
  O2: {atoms: [{el: 'O', x: -32, y: 0}, {el: 'O', x: 32, y: 0}], bonds: [[0, 1, 2]]},
  CO2: {atoms: [{el: 'O', x: -64, y: 0}, {el: 'C', x: 0, y: 0}, {el: 'O', x: 64, y: 0}], bonds: [[0, 1, 2], [1, 2, 2]]},
  H2O: {atoms: [{el: 'O', x: 0, y: -8}, {el: 'H', x: -46, y: 28}, {el: 'H', x: 46, y: 28}], bonds: [[0, 1, 1], [0, 2, 1]]},
  CO: {atoms: [{el: 'C', x: -30, y: 0}, {el: 'O', x: 30, y: 0}], bonds: [[0, 1, 3]]},
  N2: {atoms: [{el: 'N', x: -30, y: 0}, {el: 'N', x: 30, y: 0}], bonds: [[0, 1, 3]]},
};

/** Ball-and-stick molecule: kind 'O2' | 'CO2' | 'H2O' | 'CO' | 'N2'. origin = centre; ≈190 wide (CO2) at s=1. r + t·spin rotate; label shows the formula. */
export const Molecule: React.FC<{x: number; y: number; s?: number; kind?: keyof typeof MOLS | string; r?: number; t?: number; spin?: number; label?: boolean; p?: number}> = ({
  x,
  y,
  s = 1,
  kind = 'O2',
  r = 0,
  t = 0,
  spin = 0,
  label = false,
  p = 1,
}) => {
  if (p <= 0) return null;
  const m = MOLS[kind] ?? MOLS.O2;
  const k = ease.outBack(clamp01(p));
  const rot = r + t * spin;
  const rad = (rot * Math.PI) / 180;
  const P = (a: Atom): Pt => [a.x * Math.cos(rad) - a.y * Math.sin(rad), a.x * Math.sin(rad) + a.y * Math.cos(rad)];
  const sub = kind.replace(/(\d)/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]);
  return (
    <g opacity={clamp01(p * 3)}>
    <g transform={`translate(${x} ${y}) scale(${s * k})`}>
      {m.bonds.map(([a, b, n], i) => {
        const A = P(m.atoms[a]);
        const B = P(m.atoms[b]);
        const dx = B[0] - A[0];
        const dy = B[1] - A[1];
        const L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L;
        const ny = dx / L;
        return (
          <g key={i} stroke={C.inkFaint} strokeWidth={n === 1 ? 10 : 6} strokeLinecap="round">
            {Array.from({length: n}, (_, j) => {
              const o = (j - (n - 1) / 2) * 10;
              return <path key={j} d={`M${A[0] + nx * o} ${A[1] + ny * o} L${B[0] + nx * o} ${B[1] + ny * o}`} />;
            })}
          </g>
        );
      })}
      {m.atoms
        .map((a, i) => ({a, i, p: P(a)}))
        .map(({a, i, p: q}) => (
          <Ball key={i} x={q[0]} y={q[1]} r={ATOM[a.el].r} fill={ATOM[a.el].fill} shade={ATOM[a.el].shade} stroke={a.el === 'H' ? C.paperDark : undefined} />
        ))}
    </g>
      {label && (
        <text x={x} y={y + 74 * s + 36} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={36} fill={C.inkMute}>
          {sub}
        </text>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// Signals

/**
 * Scrolling signal line. origin = left end of the baseline; w wide, ±amp tall.
 * kind: 'speech' (syllable bursts), 'eeg' (brain rhythm), 'ecg' (heartbeat), 'flat' (flatline).
 * t scrolls, freq scales the rhythm, p draws it on left→right.
 */
export const Waveform: React.FC<{x: number; y: number; w?: number; amp?: number; t?: number; freq?: number; kind?: 'speech' | 'eeg' | 'ecg' | 'flat'; color?: string; width?: number; p?: number; seed?: number; speed?: number}> = ({
  x,
  y,
  w = 400,
  amp = 50,
  t = 0,
  freq = 1,
  kind = 'eeg',
  color,
  width = 4,
  p = 1,
  seed = 1,
  speed = 140,
}) => {
  if (p <= 0) return null;
  const col = color ?? (kind === 'eeg' ? C.theory : kind === 'ecg' ? C.oxblood : kind === 'flat' ? C.inkFaint : C.ink);
  const N = Math.max(40, Math.round(w / 2.5));
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const sx = u * w + t * speed;
    const edge = Math.min(1, u / 0.06, (1 - u) / 0.06);
    let v = 0;
    if (kind === 'speech') {
      const env = Math.max(0, noise1(sx / (70 / freq), seed) * 1.3 + 0.15) ** 1.3;
      v = env * Math.sin(sx * 0.32 * freq) * (0.65 + 0.35 * Math.sin(sx * 0.071));
    } else if (kind === 'eeg') {
      v = 0.45 * Math.sin(sx * 0.055 * freq + seed) + 0.25 * Math.sin(sx * 0.14 * freq + 1.3) + 0.3 * noise1(sx * 0.09 * freq, seed) + 0.12 * noise1(sx * 0.4, seed + 3);
    } else if (kind === 'ecg') {
      const per = 220 / freq;
      const f = ((sx / per) % 1 + 1) % 1;
      const g = (c: number, wd: number) => Math.exp(-(((f - c) / wd) ** 2));
      v = 0.12 * g(0.18, 0.03) - 0.14 * g(0.3, 0.008) + 1 * g(0.32, 0.01) - 0.3 * g(0.345, 0.01) + 0.22 * g(0.52, 0.045);
    } else {
      v = 0.025 * noise1(sx * 0.12, seed);
    }
    pts.push(`${r1(u * w)} ${r1(-v * amp * edge)}`);
  }
  const k = clamp01(p);
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M${pts.join(' L')}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} stroke={col} strokeWidth={width} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
};
