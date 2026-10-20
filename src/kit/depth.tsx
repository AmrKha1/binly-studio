import React from 'react';
import {geoGraticule, geoInterpolate, geoOrthographic, geoPath, GeoPermissibleObjects, GeoProjection} from 'd3-geo';
import {feature, mesh} from 'topojson-client';
import type {GeometryCollection, Topology} from 'topojson-specification';
import world50json from 'world-atlas/countries-50m.json';
import world110json from 'world-atlas/countries-110m.json';
import {C, FONT_SERIF, H, W} from './theme';
import {clamp01, ease, lerp, rand, randRange} from './anim';
import {uid} from './stage';

// "Looks 3D, drawn flat": globes, isometric blocks, shaded spheres and perspective layer stacks.
// Pure SVG — no WebGL, no blur, no gradients. Depth comes from projection maths (orthographic globe,
// 2:1 isometric), flat crescent shading shapes (terminator + core shadow + rim) and parallax.
// Light comes from the upper-left by default: tops/lit sides lightest, left faces mid, right faces darkest.

// ============================================================================================
// Colour helpers (palette families only)

const rgbOf = (c: string): [number, number, number] => {
  if (c[0] === '#') {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = c.match(/\d+/g);
  return m ? [+m[0], +m[1], +m[2]] : [0, 0, 0];
};
/** Mix two palette colours (hex or rgb()) → hex. Chainable. k = 0 → a, k = 1 → b. */
export const mixTone = (a: string, b: string, k: number): string => {
  const A = rgbOf(a);
  const B = rgbOf(b);
  const h = (i: number) => Math.round(lerp(A[i], B[i], clamp01(k))).toString(16).padStart(2, '0');
  return '#' + h(0) + h(1) + h(2);
};
const lt = (c: string, k: number) => mixTone(c, C.paperLight, k);
const dk = (c: string, k: number) => mixTone(c, C.ink, k);

const f1 = (v: number) => (Math.abs(v) < 1e-9 ? '0' : v.toFixed(1));
const f2 = (v: number) => (Math.abs(v) < 1e-9 ? '0' : v.toFixed(2));
const RAD = Math.PI / 180;

/**
 * Flat crescent path: the part of a disc (centre 0,0, radius r) beyond a terminator ellipse, on the side
 * pointing to `angle` (radians, screen coords). n = 0 → nothing, 0.5 → half disc, 1 → whole disc.
 * The building block of every sphere/globe shade here.
 */
export const crescentPath = (r: number, angle: number, n: number) => {
  const k = clamp01(n);
  if (k <= 0.002) return '';
  if (k >= 0.998) return `M${f2(-r)} 0 A${f2(r)} ${f2(r)} 0 1 0 ${f2(r)} 0 A${f2(r)} ${f2(r)} 0 1 0 ${f2(-r)} 0 Z`;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const qx = -dy * r;
  const qy = dx * r;
  const b = r * (1 - 2 * k);
  const rot = (Math.atan2(qy, qx) * 180) / Math.PI;
  return `M${f2(-qx)} ${f2(-qy)} A${f2(r)} ${f2(r)} 0 0 1 ${f2(qx)} ${f2(qy)} A${f2(r)} ${f2(Math.abs(b))} ${f2(rot)} 0 ${b >= 0 ? 0 : 1} ${f2(-qx)} ${f2(-qy)} Z`;
};

const lightAngle = (light: [number, number]) => Math.atan2(light[1], light[0]);

// ============================================================================================
// GLOBE — orthographic world-atlas globe

type Topo = Topology<{countries: GeometryCollection<{name: string}>; land: GeometryCollection}>;
type Detail = '50m' | '110m';
const TOPO: Record<Detail, Topo> = {'50m': world50json as unknown as Topo, '110m': world110json as unknown as Topo};
export type LonLat = [number, number];

type GeoData = {land: GeoPermissibleObjects; borders: GeoPermissibleObjects; countries: {id: string; name: string; f: GeoPermissibleObjects}[]};
const dataCache = new Map<Detail, GeoData>();
const geoData = (detail: Detail): GeoData => {
  let d = dataCache.get(detail);
  if (!d) {
    const topo = TOPO[detail];
    const fc = feature(topo, topo.objects.countries) as GeoJSON.FeatureCollection<GeoJSON.Geometry, {name: string}>;
    d = {
      land: feature(topo, topo.objects.land),
      borders: mesh(topo, topo.objects.countries, (a, b) => a !== b),
      countries: fc.features.map((g) => ({id: String(g.id ?? ''), name: (g.properties?.name ?? '').toLowerCase(), f: g})),
    };
    dataCache.set(detail, d);
  }
  return d;
};

/** Path context: drops vertices < `min` px apart and sub-paths smaller than `tiny` px, rounds to 0.1 px. */
class LeanPath {
  private out: string[] = [];
  private buf: string[] = [];
  private lx = 0;
  private ly = 0;
  private x0 = 0;
  private x1 = 0;
  private y0 = 0;
  private y1 = 0;
  constructor(
    private min = 1,
    private tiny = 2,
  ) {}
  private flush() {
    if (this.buf.length && Math.max(this.x1 - this.x0, this.y1 - this.y0) >= this.tiny) this.out.push(this.buf.join(''));
    this.buf = [];
  }
  moveTo(x: number, y: number) {
    this.flush();
    this.buf.push(`M${f1(x)} ${f1(y)}`);
    this.lx = this.x0 = this.x1 = x;
    this.ly = this.y0 = this.y1 = y;
  }
  lineTo(x: number, y: number) {
    if (Math.abs(x - this.lx) + Math.abs(y - this.ly) < this.min) return;
    this.buf.push(`L${f1(x)} ${f1(y)}`);
    this.lx = x;
    this.ly = y;
    if (x < this.x0) this.x0 = x;
    if (x > this.x1) this.x1 = x;
    if (y < this.y0) this.y0 = y;
    if (y > this.y1) this.y1 = y;
  }
  closePath() {
    this.buf.push('Z');
  }
  arc() {}
  beginPath() {}
  result() {
    this.flush();
    const r = this.out.join('');
    this.out = [];
    return r;
  }
}
const lean = (p: GeoProjection, obj: GeoPermissibleObjects, min = 1, tiny = 2) => {
  const ctx = new LeanPath(min, tiny);
  geoPath(p, ctx)(obj);
  return ctx.result();
};

// Cache per (detail, r, rotate rounded to 0.01°). Paths are always computed from the ROUNDED values,
// so the output depends only on props (cache hit or miss gives the identical frame).
type GlobePaths = {proj: GeoProjection; land: string; borders: string; grat: Map<number, string>; countries: Map<string, string>};
const globeCache = new Map<string, GlobePaths>();
const GLOBE_CACHE_MAX = 120;
const q2 = (v: number) => Math.round(v * 100) / 100;
const wrapLon = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;
const globePaths = (detail: Detail, r: number, rotate: LonLat): GlobePaths => {
  const rr = Math.round(r * 2) / 2;
  const lon = q2(wrapLon(rotate[0]));
  const lat = q2(Math.max(-90, Math.min(90, rotate[1])));
  const key = `${detail}|${rr}|${lon}|${lat}`;
  const hit = globeCache.get(key);
  if (hit) return hit;
  const proj = geoOrthographic().scale(rr).translate([0, 0]).rotate([-lon, -lat]).clipAngle(90).precision(0.5);
  const d = geoData(detail);
  const fine = rr > 400 ? 1.6 : 1.4;
  const g: GlobePaths = {
    proj,
    land: lean(proj, d.land, fine, 2),
    borders: lean(proj, d.borders, 2.4, 6),
    grat: new Map(),
    countries: new Map(),
  };
  if (globeCache.size >= GLOBE_CACHE_MAX) globeCache.delete(globeCache.keys().next().value as string);
  globeCache.set(key, g);
  return g;
};
const globeGrat = (g: GlobePaths, step: number) => {
  let d = g.grat.get(step);
  if (d === undefined) {
    d = lean(g.proj, geoGraticule().step([step, step]).extentMinor([[-180, -80 - 1e-6], [180, 80 + 1e-6]])(), 2, 0);
    g.grat.set(step, d);
  }
  return d;
};
const globeCountry = (g: GlobePaths, detail: Detail, c: string | number) => {
  const q = String(c).toLowerCase();
  let d = g.countries.get(q);
  if (d === undefined) {
    const qn = /^\d+$/.test(q) ? q.padStart(3, '0') : '';
    const f = geoData(detail).countries.find((x) => x.name === q || (qn && x.id === qn));
    d = f ? lean(g.proj, f.f, 0.9, 1) : '';
    g.countries.set(q, d);
  }
  return d;
};

/**
 * Pure globe projection (same maths as <Globe>): rotate = [lon, lat] of the point facing the camera.
 * Returns (lon, lat) → [x, y] relative to the globe centre (+ at.x/at.y), or null on the far side.
 */
export const globeProject = (rotate: LonLat, r: number, at: {x?: number; y?: number} = {}) => {
  const [lon0, lat0] = rotate;
  const sp0 = Math.sin(lat0 * RAD);
  const cp0 = Math.cos(lat0 * RAD);
  const ox = at.x ?? 0;
  const oy = at.y ?? 0;
  return (lon: number, lat: number): [number, number] | null => {
    const l = (lon - lon0) * RAD;
    const p = lat * RAD;
    const cp = Math.cos(p);
    const sp = Math.sin(p);
    if (sp0 * sp + cp0 * cp * Math.cos(l) < 0) return null;
    return [ox + r * cp * Math.sin(l), oy - r * (cp0 * sp - sp0 * cp * Math.cos(l))];
  };
};

/** How much a point faces the camera on a globe turned to `rotate`: 1 = centre, 0 = limb, < 0 = far side. */
export const globeFacing = (rotate: LonLat, lon: number, lat: number) => {
  const p0 = rotate[1] * RAD;
  const p = lat * RAD;
  return Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos((lon - rotate[0]) * RAD);
};

export type GlobeHighlight = {countries: (string | number)[]; color?: string; p?: number};
export type GlobePin = {lon: number; lat: number; label?: string; color?: string; side?: 'right' | 'left'; p?: number};
export type GlobeRoute = {from: LonLat; to: LonLat; p?: number; color?: string; dashed?: boolean; width?: number};

/**
 * Orthographic globe of world-atlas countries. origin = globe centre; radius r px.
 * rotate = [lon, lat] facing the camera (animate it to spin / turn to a region). p = build-in (fade + settle).
 * highlight countries (Natural Earth name or ISO numeric), graticule, night (0..1 flat crescent on the side
 * away from `light`), rim (flat light ring), pins (hidden on the far side, fade at the limb), routes
 * (great-circle arcs drawing on with p, clipped to the visible hemisphere). Detail: 110m (r ≤ 400) / 50m.
 */
export const Globe: React.FC<{
  x: number;
  y: number;
  r: number;
  rotate?: LonLat;
  p?: number;
  land?: string;
  sea?: string;
  border?: string;
  coast?: string;
  borders?: boolean;
  detail?: Detail;
  highlight?: GlobeHighlight[];
  graticule?: boolean | number;
  night?: number;
  shade?: boolean;
  light?: [number, number];
  rim?: boolean;
  pins?: GlobePin[];
  routes?: GlobeRoute[];
  children?: React.ReactNode;
}> = ({
  x,
  y,
  r,
  rotate = [0, 20],
  p = 1,
  land = C.paperLight,
  sea = C.paperShade,
  border = C.inkFaint,
  coast = C.inkLift,
  borders = true,
  detail,
  highlight = [],
  graticule = true,
  night = 0,
  shade = true,
  light = [-0.6, -0.8],
  rim = true,
  pins = [],
  routes = [],
  children,
}) => {
  if (p <= 0) return null;
  const det: Detail = detail ?? (r > 400 ? '50m' : '110m');
  const g = globePaths(det, r, rotate);
  const k = ease.out(clamp01(p));
  const la = lightAngle(light);
  const dark = la + Math.PI;
  const step = typeof graticule === 'number' ? graticule : r < 220 ? 30 : 15;
  const proj = globeProject(rotate, r);
  const sw = Math.max(1.4, r / 180);
  return (
    <g transform={`translate(${x} ${y}) scale(${lerp(0.9, 1, k)})`} opacity={clamp01(p * 2)}>
      {rim && <circle r={r + Math.max(6, r * 0.035) + Math.max(4, r * 0.022) / 2} fill="none" stroke={C.paperLight} strokeWidth={Math.max(4, r * 0.022)} opacity={0.9} />}
      <circle r={r} fill={sea} />
      {graticule !== false && <path d={globeGrat(g, step)} fill="none" stroke={C.inkFaint} strokeWidth={sw} strokeOpacity={0.32} />}
      <path d={g.land} fill={land} stroke={coast} strokeWidth={sw * 1.15} />
      {highlight.map((hl, i) => {
        const hp = clamp01(hl.p ?? 1);
        if (hp <= 0) return null;
        const col = hl.color ?? C.oxLight;
        return (
          <g key={i}>
            {hl.countries.map((c) => {
              const d = globeCountry(g, det, c);
              return (
                <g key={String(c)}>
                  <path d={d} fill={col} opacity={0.85 * ease.inOut(hp)} />
                  <path d={d} fill="none" stroke={dk(col, 0.25)} strokeWidth={sw * 1.4} strokeLinejoin="round" opacity={hp} />
                </g>
              );
            })}
          </g>
        );
      })}
      {borders && <path d={g.borders} fill="none" stroke={border} strokeWidth={sw * 0.9} strokeOpacity={0.7} />}
      {routes.map((rt, i) => {
        const rp = clamp01(rt.p ?? 1);
        if (rp <= 0) return null;
        const col = rt.color ?? C.oxblood;
        const interp = geoInterpolate(rt.from, rt.to);
        const n = Math.max(2, Math.ceil(72 * rp));
        const coords = Array.from({length: n + 1}, (_, j) => interp((rp * j) / n));
        const d = lean(g.proj, {type: 'LineString', coordinates: coords}, 0.8, 0);
        const head = proj(coords[n][0], coords[n][1]);
        const tail = proj(rt.from[0], rt.from[1]);
        const wdt = rt.width ?? Math.max(3.5, r / 75);
        return (
          <g key={`rt${i}`}>
            <path d={d} fill="none" stroke={C.paperLight} strokeWidth={wdt + 4} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
            <path d={d} fill="none" stroke={col} strokeWidth={wdt} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={rt.dashed ? `${wdt * 3} ${wdt * 2.4}` : undefined} />
            {tail && <circle cx={tail[0]} cy={tail[1]} r={wdt * 1.4} fill={C.paperLight} stroke={col} strokeWidth={wdt * 0.8} />}
            {head && rp < 1 && <circle cx={head[0]} cy={head[1]} r={wdt * 1.5} fill={col} />}
          </g>
        );
      })}
      {shade && <path d={crescentPath(r, dark, 0.2)} fill={C.ink} opacity={0.07} />}
      {night > 0 && (
        <g fill={C.night}>
          <path d={crescentPath(r, dark, night)} opacity={0.36} />
          <path d={crescentPath(r, dark, night * 0.55)} opacity={0.18} />
        </g>
      )}
      {rim && <path d={crescentPath(r, la, 0.035)} fill={C.paperLight} opacity={0.55} />}
      <circle r={r} fill="none" stroke={C.inkLift} strokeWidth={Math.max(3, r / 110)} />
      {pins.map((pn, i) => {
        const fc = globeFacing(rotate, pn.lon, pn.lat);
        const pp = clamp01(pn.p ?? 1);
        const o = clamp01((fc - 0.04) / 0.2) * pp;
        const at = proj(pn.lon, pn.lat);
        if (!at || o <= 0) return null;
        const col = pn.color ?? C.oxblood;
        const lift = 30 * ease.outBack(pp);
        const left = pn.side === 'left';
        return (
          <g key={`pin${i}`} transform={`translate(${f1(at[0])} ${f1(at[1])})`} opacity={o}>
            <ellipse rx={8} ry={3.5} fill={C.ink} opacity={0.3} />
            <line x1={0} y1={0} x2={0} y2={-lift} stroke={C.inkSoft} strokeWidth={3.5} strokeLinecap="round" />
            <circle cy={-lift - 4} r={11} fill={col} />
            <path d={crescentPath(11, 0.6, 0.3)} transform={`translate(0 ${-lift - 4})`} fill={C.ink} opacity={0.22} />
            <circle cx={-3.5} cy={-lift - 7.5} r={3.2} fill={C.paperLight} opacity={0.8} />
            {pn.label && (
              <text
                x={left ? -20 : 20}
                y={-lift + 4}
                textAnchor={left ? 'end' : 'start'}
                fontFamily={FONT_SERIF}
                fontWeight={600}
                fontSize={Math.max(36, Math.min(48, r / 8))}
                fill={C.ink}
                paintOrder="stroke"
                stroke={C.paperLight}
                strokeWidth={7}
                strokeLinejoin="round"
                opacity={clamp01(pp * 2 - 0.6)}
              >
                {pn.label}
              </text>
            )}
          </g>
        );
      })}
      {children}
    </g>
  );
};

// ============================================================================================
// ISOMETRIC (2:1). World axes: +x → right-down, +y → left-down, +z → up. 1 unit = 1 px at s = 1.

/** 2:1 isometric projection of world point (x, y, z) → screen offset [sx, sy] (scale s). */
export const iso = (x: number, y: number, z = 0, s = 1): [number, number] => [(x - y) * s, ((x + y) * 0.5 - z) * s];

type P3 = [number, number, number];
const ipts = (pts: P3[], s: number, kz = 1) =>
  pts
    .map(([a, b, c]) => {
      const [u, v] = iso(a, b, c * kz, s);
      return `${f1(u)},${f1(v)}`;
    })
    .join(' ');

export type IsoColors = {top: string; left: string; right: string};
/** Three face tones of one palette colour (light from upper-left): top lightest, left = base, right darkest. */
export const isoShades = (base: string): IsoColors => ({top: lt(base, 0.32), left: base, right: dk(base, 0.24)});

const Face: React.FC<{pts: P3[]; s: number; kz?: number; fill: string; o?: number}> = ({pts, s, kz = 1, fill, o}) => (
  <polygon points={ipts(pts, s, kz)} fill={fill} stroke={o === undefined ? fill : undefined} strokeWidth={0.8} strokeLinejoin="round" opacity={o} />
);

const boxFaces = (key: string, x0: number, y0: number, z0: number, w: number, d: number, h: number, s: number, col: IsoColors, kz = 1) => [
  <Face key={key + 'r'} s={s} kz={kz} fill={col.right} pts={[[x0 + w, y0, z0], [x0 + w, y0 + d, z0], [x0 + w, y0 + d, z0 + h], [x0 + w, y0, z0 + h]]} />,
  <Face key={key + 'l'} s={s} kz={kz} fill={col.left} pts={[[x0, y0 + d, z0], [x0 + w, y0 + d, z0], [x0 + w, y0 + d, z0 + h], [x0, y0 + d, z0 + h]]} />,
  <Face key={key + 't'} s={s} kz={kz} fill={col.top} pts={[[x0, y0, z0 + h], [x0 + w, y0, z0 + h], [x0 + w, y0 + d, z0 + h], [x0, y0 + d, z0 + h]]} />,
];

/** Flat cast shadow of a w×d×h block on the ground, falling to the lower-right (light upper-left). */
const isoShadow = (w: number, d: number, h: number, s: number, o = 0.13) => {
  const L = h * 0.45;
  return <polygon points={ipts([[0, 0, 0], [w + L, 0, 0], [w + L, d, 0], [0, d, 0]], s)} fill={C.ink} opacity={o} />;
};

/**
 * Isometric box. origin (x, y) = screen point of the box's back ground corner (world 0,0,0); it extends
 * +x right-down by w, +y left-down by d, up by h (world units = px at s = 1). p raises it from the ground.
 * color → 3 face tones via isoShades, or pass colors {top,left,right}.
 */
export const IsoBox: React.FC<{x: number; y: number; w: number; d: number; h: number; s?: number; color?: string; colors?: Partial<IsoColors>; p?: number; shadow?: boolean; children?: React.ReactNode}> = ({
  x,
  y,
  w,
  d,
  h,
  s = 1,
  color = C.stone,
  colors,
  p = 1,
  shadow = true,
  children,
}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  const col = {...isoShades(color), ...colors};
  return (
    <g transform={`translate(${x} ${y})`} opacity={clamp01(p * 8)}>
      {shadow && isoShadow(w, d, h * k, s)}
      {boxFaces('b', 0, 0, 0, w, d, h * k, s, col)}
      {children}
    </g>
  );
};

/** Single floor tile slab (size × size × h). origin = back ground corner. */
export const IsoTile: React.FC<{x: number; y: number; size?: number; h?: number; color?: string; s?: number; p?: number}> = ({x, y, size = 48, h = 8, color = C.stone, s = 1, p = 1}) => (
  <IsoBox x={x} y={y} w={size} d={size} h={h} s={s} color={color} p={p} shadow={false} />
);

/**
 * Tiled floor slab: cols × rows tiles of `size`, two-tone checker, grout lines; tiles drop in as a diagonal
 * wave with p. origin = back corner of the floor's top surface (world z = 0); slab hangs below by `thick`.
 */
export const IsoFloor: React.FC<{x: number; y: number; cols: number; rows: number; size?: number; colors?: [string, string]; grout?: string; thick?: number; s?: number; p?: number; gap?: number}> = ({
  x,
  y,
  cols,
  rows,
  size = 48,
  colors = [C.stone, lt(C.stone, 0.22)],
  grout,
  thick = 14,
  s = 1,
  p = 1,
  gap = 2.5,
}) => {
  if (p <= 0) return null;
  const W0 = cols * size;
  const D0 = rows * size;
  const base = grout ?? dk(colors[0], 0.16);
  const total = cols + rows;
  const tiles: React.ReactNode[] = [];
  for (let sum = 0; sum <= cols + rows - 2; sum++) {
    for (let i = Math.max(0, sum - rows + 1); i <= Math.min(cols - 1, sum); i++) {
      const j = sum - i;
      const tp = clamp01((p * (total + 5) - sum) / 5);
      if (tp <= 0) continue;
      const e = ease.out(tp);
      const z = (1 - e) * 36;
      const a = i * size + gap;
      const b = j * size + gap;
      const c = size - gap * 2;
      tiles.push(<Face key={`${i}-${j}`} s={s} fill={colors[(i + j) % 2]} o={e} pts={[[a, b, z], [a + c, b, z], [a + c, b + c, z], [a, b + c, z]]} />);
    }
  }
  return (
    <g transform={`translate(${x} ${y})`} opacity={clamp01(p * 4)}>
      {boxFaces('slab', 0, 0, -thick, W0, D0, thick, s, {top: base, left: dk(colors[0], 0.1), right: dk(colors[0], 0.3)})}
      {tiles}
    </g>
  );
};

/**
 * Isometric staircase: `steps` steps rising to height h. dir 'left' = risers face the left-front (+y) and the
 * stairs climb toward the back-right; 'right' = risers face the right-front (+x). origin = back ground corner.
 */
export const IsoStairs: React.FC<{x: number; y: number; w: number; d: number; h: number; steps?: number; dir?: 'left' | 'right'; color?: string; s?: number; p?: number; shadow?: boolean}> = ({
  x,
  y,
  w,
  d,
  h,
  steps = 6,
  dir = 'left',
  color = C.stone,
  s = 1,
  p = 1,
  shadow = true,
}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  const col = {...isoShades(color), top: lt(color, 0.45), left: dk(color, 0.04)};
  const out: React.ReactNode[] = [];
  for (let i = 0; i < steps; i++) {
    const hh = (h * (i + 1)) / steps;
    if (dir === 'left') out.push(...boxFaces(`s${i}`, 0, 0, 0, w, (d * (steps - i)) / steps, hh, s, col, k));
    else out.push(...boxFaces(`s${i}`, 0, 0, 0, (w * (steps - i)) / steps, d, hh, s, col, k));
  }
  return (
    <g transform={`translate(${x} ${y})`} opacity={clamp01(p * 8)}>
      {shadow && isoShadow(w, d, h * k * 0.6, s)}
      {out}
    </g>
  );
};

const FLOOR_H = {medieval: 44, modern: 36};
const ROOF_K = 0.42; // gable height = ROOF_K × the shorter footprint side

/** Screen offset of an IsoBuilding's chimney top (relative to the building origin) — e.g. to emit Steam. */
export const isoChimneyTop = (o: {w?: number; d?: number; floors?: number; era?: 'medieval' | 'modern'; s?: number}): [number, number] => {
  const {w = 120, d = 100, floors = 2, era = 'medieval', s = 1} = o;
  const H0 = floors * FLOOR_H[era];
  const ridgeX = w >= d;
  const rh = Math.min(w, d) * ROOF_K;
  return ridgeX ? iso(w * 0.72 + 10, d * 0.24 + 10, H0 + rh + 35, s) : iso(d * 0.24 + 10, w * 0.72 + 10, H0 + rh + 35, s);
};

/**
 * Isometric building. origin = back ground corner; footprint w × d (world px), floors × 44 (medieval) / 36
 * (modern) high. roof 'gable' (ridge along the longer side) | 'flat'. era 'medieval' (stone ground floor,
 * timber-framed plaster or stone, small shuttered windows, door, optional chimney) | 'modern' (concrete,
 * ribbon windows, parapet + roof unit). windowsLit: 0..1 fraction (seeded) or boolean. p = rises from the ground.
 */
export const IsoBuilding: React.FC<{
  x: number;
  y: number;
  w?: number;
  d?: number;
  floors?: number;
  roof?: 'flat' | 'gable';
  era?: 'medieval' | 'modern';
  windowsLit?: number | boolean;
  p?: number;
  seed?: number;
  s?: number;
  wall?: string;
  roofColor?: string;
  chimney?: boolean;
  door?: boolean;
  shadow?: boolean;
  material?: 'timber' | 'stone';
}> = ({x, y, w = 120, d = 100, floors = 2, roof = 'gable', era = 'medieval', windowsLit = 0, p = 1, seed = 1, s = 1, wall, roofColor, chimney, door = true, shadow = true, material}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  const med = era === 'medieval';
  const fh = FLOOR_H[era];
  const H0 = floors * fh;
  const r0 = rand(seed * 3.1 + 1);
  const timber = med && floors > 1 && (material ? material === 'timber' : r0 < 0.6);
  const baseWall = wall ?? (med ? (timber ? C.bone : C.stone) : [C.paperDeep, C.stone, C.paperShade][Math.floor(rand(seed * 5.7) * 3)]);
  const roofBase = roofColor ?? (med ? [C.slate, C.woodLight, mixTone(C.oxLight, C.stoneShade, 0.45), C.stoneDark][Math.floor(rand(seed * 7.3 + 2) * 4)] : C.stoneShade);
  const wc = isoShades(baseWall);
  const stoneC = isoShades(C.stone);
  const lit = typeof windowsLit === 'boolean' ? (windowsLit ? 1 : 0) : windowsLit;
  const wantChimney = chimney ?? (med && roof === 'gable' && rand(seed * 2.3) < 0.55);
  const out: React.ReactNode[] = [];
  let key = 0;
  const F = (pts: P3[], fill: string, o?: number) => out.push(<Face key={key++} pts={pts} s={s} kz={k} fill={fill} o={o} />);
  const line = (a: P3, b: P3, stroke: string, width: number) => {
    const [x1, y1] = iso(a[0], a[1], a[2] * k, s);
    const [x2, y2] = iso(b[0], b[1], b[2] * k, s);
    out.push(<line key={key++} x1={f1(x1)} y1={f1(y1)} x2={f1(x2)} y2={f1(y2)} stroke={stroke} strokeWidth={width * s} strokeLinecap="round" />);
  };

  // walls (stone plinth / ground floor for timber houses)
  if (timber) {
    out.push(...boxFaces('g', 0, 0, 0, w, d, fh, s, stoneC, k));
    out.push(...boxFaces('u', 0, 0, fh, w, d, H0 - fh, s, wc, k).slice(0, 2));
  } else out.push(...boxFaces('w', 0, 0, 0, w, d, H0, s, wc, k).slice(0, 2));

  // windows on both visible faces. face 'L' = plane y = d (u along x), 'R' = plane x = w (u along y)
  const glassOff = med ? C.inkLift : C.waterDeep;
  const win = (face: 'L' | 'R', u0: number, u1: number, z0: number, z1: number, idx: number) => {
    const P = (u: number, z: number): P3 => (face === 'L' ? [u, d, z] : [w, u, z]);
    const isLit = rand(seed * 13.7 + idx * 1.93) < lit;
    const glass = isLit ? C.lamp : glassOff;
    if (med) F([P(u0 - 2, z0 - 2), P(u1 + 2, z0 - 2), P(u1 + 2, z1 + 2), P(u0 - 2, z1 + 2)], face === 'L' ? C.woodDark : dk(C.woodDark, 0.2));
    F([P(u0, z0), P(u1, z0), P(u1, z1), P(u0, z1)], face === 'R' && !isLit ? dk(glass, 0.15) : glass);
    if (!med) F([P(u0, z0), P((u0 + u1) / 2, z0), P((u0 + u1) / 2 - 2, z1), P(u0, z1)], C.paperLight, isLit ? 0.12 : 0.1);
  };
  let wi = 0;
  const doorFace: 'L' | 'R' = 'L';
  const doorU = w * (0.3 + rand(seed * 4.1) * 0.4);
  for (let f = 0; f < floors; f++) {
    const zb = f * fh;
    for (const face of ['L', 'R'] as const) {
      const len = face === 'L' ? w : d;
      if (med) {
        const n = Math.max(1, Math.floor((len - 16) / 34));
        const gap = len / n;
        for (let i = 0; i < n; i++) {
          const cu = gap * (i + 0.5);
          if (f === 0 && door && face === doorFace && Math.abs(cu - doorU) < 22) continue;
          if (rand(seed * 9.1 + f * 3 + i + (face === 'L' ? 0 : 50)) < 0.18) continue;
          win(face, cu - 6.5, cu + 6.5, zb + fh * 0.36, zb + fh * 0.78, wi++);
        }
      } else {
        const n = Math.max(1, Math.floor((len - 10) / 22));
        const gap = (len - 10) / n;
        for (let i = 0; i < n; i++) {
          const cu = 5 + gap * (i + 0.5);
          if (f === 0 && door && face === doorFace && Math.abs(cu - doorU) < 14) continue;
          win(face, cu - gap * 0.36, cu + gap * 0.36, zb + fh * 0.3, zb + fh * 0.82, wi++);
        }
      }
    }
  }
  // timber framing
  if (timber) {
    const tc = C.woodDark;
    for (let f = 1; f <= floors; f++) {
      line([0, d, f * fh], [w, d, f * fh], tc, 5);
      line([w, d, f * fh], [w, 0, f * fh], dk(tc, 0.2), 5);
    }
    line([0, d, fh], [0, d, H0], tc, 5);
    line([w, d, fh], [w, d, H0], tc, 6);
    line([w, 0, fh], [w, 0, H0], dk(tc, 0.2), 5);
    for (let f = 1; f < floors; f++) {
      const n = Math.max(1, Math.round(w / 46));
      for (let i = 1; i < n; i++) line([(w * i) / n, d, f * fh], [(w * i) / n, d, (f + 1) * fh], tc, 4);
      line([0, d, f * fh], [w / n, d, (f + 1) * fh], tc, 3.5);
    }
  }
  // door
  if (door) {
    const dw = med ? 13 : 11;
    const dh = med ? fh * 0.7 : fh * 0.78;
    F([[doorU - dw, d, 0], [doorU + dw, d, 0], [doorU + dw, d, dh], [doorU - dw, d, dh]], med ? C.woodDark : C.inkLift);
    if (med) F([[doorU - dw - 3, d, dh], [doorU + dw + 3, d, dh], [doorU + dw + 3, d, dh + 4], [doorU - dw - 3, d, dh + 4]], C.stoneDark);
    else F([[doorU - dw + 2, d, 2], [doorU, d, 2], [doorU, d, dh - 2], [doorU - dw + 2, d, dh - 2]], C.water);
  }

  // roof
  if (roof === 'gable') {
    const ridgeX = w >= d;
    const L = ridgeX ? w : d; // along ridge
    const S = ridgeX ? d : w; // across ridge
    const rh = Math.min(w, d) * ROOF_K;
    const e = 6;
    // M maps (along, across, z) → world. ridge along x: across = y (front slope faces +y = left face)
    const M = (a: number, c: number, z: number): P3 => (ridgeX ? [a, c, z] : [c, a, z]);
    const rc = isoShades(roofBase);
    const frontTone = ridgeX ? lt(roofBase, 0.08) : dk(roofBase, 0.12);
    const backTone = dk(roofBase, 0.3);
    const gableTone = ridgeX ? wc.right : wc.left;
    // back slope
    F([M(-e, -e, H0 - 2), M(L + e, -e, H0 - 2), M(L + e, S / 2, H0 + rh), M(-e, S / 2, H0 + rh)], backTone);
    // chimney (stands on the back slope, ridge along the long side)
    if (wantChimney) {
      const cw = 20;
      const ca = L * 0.72;
      const cc = S * 0.24;
      const zb = H0 + rh * ((cc + cw) / (S / 2)) - 4;
      const ch = H0 + rh + 30 - zb;
      const [cx0, cy0] = ridgeX ? [ca, cc] : [cc, ca];
      out.push(...boxFaces('ch', cx0, cy0, zb, cw, cw, ch, s, isoShades(C.stoneDark), k));
      out.push(...boxFaces('cht', cx0 - 2, cy0 - 2, zb + ch, cw + 4, cw + 4, 5, s, isoShades(C.stoneShade), k));
    }
    // gable wall triangle
    F(ridgeX ? [[w, 0, H0], [w, d, H0], [w, d / 2, H0 + rh]] : [[0, d, H0], [w, d, H0], [w / 2, d, H0 + rh]], gableTone);
    if (med && timber) {
      const a: P3 = ridgeX ? [w, d / 2, H0] : [w / 2, d, H0];
      const b: P3 = ridgeX ? [w, d / 2, H0 + rh * 0.9] : [w / 2, d, H0 + rh * 0.9];
      line(a, b, dk(C.woodDark, 0.15), 4);
    }
    // front slope + eave fascia + barge board
    F([M(-e, S + e, H0 - 2), M(L + e, S + e, H0 - 2), M(L + e, S / 2, H0 + rh), M(-e, S / 2, H0 + rh)], frontTone);
    // tile courses on the front slope
    for (let i = 1; i < 4; i++) {
      const c = S / 2 + ((S / 2 + e) * i) / 4;
      const z = H0 + rh - ((rh + 2) * i) / 4;
      const A = M(-e, c, z);
      const B = M(L + e, c, z);
      line(A, B, dk(frontTone, 0.12), 2.5);
    }
    F([M(-e, S + e, H0 - 2), M(L + e, S + e, H0 - 2), M(L + e, S + e, H0 - 7), M(-e, S + e, H0 - 7)], dk(roofBase, 0.35));
    const bA = M(L + e, -e, H0 - 2);
    const bB = M(L + e, S / 2, H0 + rh);
    const bC = M(L + e, S + e, H0 - 2);
    const tA = iso(bA[0], bA[1], bA[2] * k, s);
    const tB = iso(bB[0], bB[1], bB[2] * k, s);
    const tC = iso(bC[0], bC[1], bC[2] * k, s);
    out.push(
      <polyline key={key++} points={`${f1(tA[0])},${f1(tA[1])} ${f1(tB[0])},${f1(tB[1])} ${f1(tC[0])},${f1(tC[1])}`} fill="none" stroke={rc.right} strokeWidth={6 * s} strokeLinejoin="round" strokeLinecap="round" />,
    );
    const rP = M(-e, S / 2, H0 + rh);
    const rA = iso(rP[0], rP[1], rP[2] * k, s);
    out.push(<line key={key++} x1={f1(rA[0])} y1={f1(rA[1])} x2={f1(tB[0])} y2={f1(tB[1])} stroke={lt(roofBase, 0.3)} strokeWidth={3 * s} strokeLinecap="round" />);
  } else {
    // flat roof: top, parapet inset, roof unit
    const pc = isoShades(baseWall);
    F([[0, 0, H0], [w, 0, H0], [w, d, H0], [0, d, H0]], pc.top);
    const i = 7;
    F([[i, i, H0], [w - i, i, H0], [w - i, d - i, H0], [i, d - i, H0]], dk(pc.top, 0.14));
    F([[i, i, H0], [w - i, i, H0], [w - i, i, H0 - 4], [i, i, H0 - 4]], dk(pc.top, 0.22));
    if (!med || rand(seed * 6.6) < 0.5) {
      const uw = Math.min(w, d) * 0.3;
      const ux = w * (0.25 + rand(seed * 8.8) * 0.3);
      const uy = d * 0.25;
      out.push(...boxFaces('unit', ux, uy, H0, uw, uw * 0.8, 14, s, isoShades(C.metal), k));
    }
  }
  return (
    <g transform={`translate(${x} ${y})`} opacity={clamp01(p * 8)}>
      {shadow && isoShadow(w, d, (H0 + (roof === 'gable' ? Math.min(w, d) * 0.4 : 0)) * k, s)}
      {out}
    </g>
  );
};

/**
 * Isometric room stage: floor slab + two back walls (left wall on the x = 0 plane, right wall on y = 0),
 * thick wall caps, optional window with a flat light patch. origin = back corner of the floor (world 0,0,0);
 * children are drawn inside the room in the same local frame — place props with iso(x, y, z).
 */
export const IsoRoom: React.FC<{
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  wallColors?: {left?: string; right?: string};
  floorColor?: string;
  tiles?: number;
  window?: boolean;
  thick?: number;
  s?: number;
  p?: number;
  children?: React.ReactNode;
}> = ({x, y, w, d, h, wallColors = {}, floorColor = C.stone, tiles = 40, window: hasWin = true, thick = 12, s = 1, p = 1, children}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  const L = wallColors.left ?? C.bone;
  const R = wallColors.right ?? C.boneShade;
  const t = thick;
  const hh = h * k;
  const fl = isoShades(floorColor);
  const grid: React.ReactNode[] = [];
  if (tiles > 0) {
    for (let a = tiles; a < w - 1; a += tiles) {
      const [x1, y1] = iso(a, 0, 0, s);
      const [x2, y2] = iso(a, d, 0, s);
      grid.push(<line key={`a${a}`} x1={f1(x1)} y1={f1(y1)} x2={f1(x2)} y2={f1(y2)} />);
    }
    for (let b = tiles; b < d - 1; b += tiles) {
      const [x1, y1] = iso(0, b, 0, s);
      const [x2, y2] = iso(w, b, 0, s);
      grid.push(<line key={`b${b}`} x1={f1(x1)} y1={f1(y1)} x2={f1(x2)} y2={f1(y2)} />);
    }
  }
  const wy0 = d * 0.3;
  const wy1 = d * 0.62;
  const wz0 = h * 0.42;
  const wz1 = h * 0.82;
  return (
    <g transform={`translate(${x} ${y})`} opacity={clamp01(p * 6)}>
      {boxFaces('fl', -t, -t, -t, w + t, d + t, t, s, {top: fl.top, left: dk(floorColor, 0.12), right: dk(floorColor, 0.3)})}
      <g stroke={dk(floorColor, 0.1)} strokeWidth={2.5 * s} opacity={0.8}>
        {grid}
      </g>
      {/* right back wall (y = 0 plane) */}
      <Face s={s} fill={dk(R, 0.06)} pts={[[0, 0, 0], [w, 0, 0], [w, 0, hh], [0, 0, hh]]} />
      <Face s={s} fill={dk(R, 0.28)} pts={[[w, -t, 0], [w, 0, 0], [w, 0, hh], [w, -t, hh]]} />
      <Face s={s} fill={lt(R, 0.3)} pts={[[-t, -t, hh], [w, -t, hh], [w, 0, hh], [-t, 0, hh]]} />
      {/* left back wall (x = 0 plane) */}
      <Face s={s} fill={L} pts={[[0, 0, 0], [0, d, 0], [0, d, hh], [0, 0, hh]]} />
      <Face s={s} fill={dk(L, 0.12)} pts={[[-t, d, 0], [0, d, 0], [0, d, hh], [-t, d, hh]]} />
      <Face s={s} fill={lt(L, 0.3)} pts={[[-t, 0, hh], [0, 0, hh], [0, d, hh], [-t, d, hh]]} />
      {/* skirting */}
      <Face s={s} fill={dk(L, 0.25)} pts={[[0, 0, 0], [0, d, 0], [0, d, 7 * k], [0, 0, 7 * k]]} />
      <Face s={s} fill={dk(R, 0.32)} pts={[[0, 0, 0], [w, 0, 0], [w, 0, 7 * k], [0, 0, 7 * k]]} />
      {hasWin && k > 0.5 && (
        <g opacity={clamp01((k - 0.5) * 3)}>
          <Face s={s} fill={C.paperLight} o={0.22} pts={[[0, wy0, 0], [0, wy1, 0], [w * 0.55, wy1 + d * 0.06, 0], [w * 0.4, wy0 + d * 0.06, 0]]} />
          <Face s={s} fill={C.woodDark} pts={[[0, wy0 - 4, wz0 - 4], [0, wy1 + 4, wz0 - 4], [0, wy1 + 4, wz1 + 4], [0, wy0 - 4, wz1 + 4]]} />
          <Face s={s} fill={C.sky} pts={[[0, wy0, wz0], [0, wy1, wz0], [0, wy1, wz1], [0, wy0, wz1]]} />
          <Face s={s} fill={C.woodDark} pts={[[0, (wy0 + wy1) / 2 - 2, wz0], [0, (wy0 + wy1) / 2 + 2, wz0], [0, (wy0 + wy1) / 2 + 2, wz1], [0, (wy0 + wy1) / 2 - 2, wz1]]} />
          <Face s={s} fill={C.woodDark} pts={[[0, wy0, (wz0 + wz1) / 2 - 2], [0, wy1, (wz0 + wz1) / 2 - 2], [0, wy1, (wz0 + wz1) / 2 + 2], [0, wy0, (wz0 + wz1) / 2 + 2]]} />
        </g>
      )}
      {children}
    </g>
  );
};

/**
 * Isometric cylinder (tower / tub / barrel / plain). origin (x, y) = screen point of the base centre; r = world
 * radius (screen half-width = r·1.41·s), h = height. top: 'flat' | 'cone' | 'open' | 'crenel' (kind sets a default:
 * tower → cone, tub → open, barrel → flat). fill = liquid level 0..1 for open tops. p = rises from the ground.
 */
export const IsoCylinder: React.FC<{
  x: number;
  y: number;
  r: number;
  h: number;
  kind?: 'tower' | 'tub' | 'barrel' | 'plain';
  top?: 'flat' | 'cone' | 'open' | 'crenel';
  color?: string;
  roofColor?: string;
  roofH?: number;
  fill?: number;
  fillColor?: string;
  windows?: number;
  s?: number;
  p?: number;
  shadow?: boolean;
  seed?: number;
}> = ({x, y, r, h, kind = 'plain', top, color, roofColor = C.slate, roofH, fill = 0.7, fillColor = C.water, windows, s = 1, p = 1, shadow = true, seed = 1}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  const tp = top ?? (kind === 'tower' ? 'cone' : kind === 'tub' ? 'open' : 'flat');
  const base = color ?? (kind === 'tower' ? C.stone : kind === 'barrel' || kind === 'tub' ? C.wood : C.stone);
  const R = r * Math.SQRT2 * s;
  const ry = R / 2;
  const Hs = h * s * k;
  const sh = isoShades(base);
  const arcY = (u: number) => ry * Math.sqrt(Math.max(0, 1 - u * u));
  const band = (a: number, b: number) => {
    const n = 14;
    const pts: string[] = [];
    for (let i = 0; i <= n; i++) {
      const u = lerp(a, b, i / n);
      pts.push(`${f1(u * R)},${f1(arcY(u))}`);
    }
    for (let i = n; i >= 0; i--) {
      const u = lerp(a, b, i / n);
      pts.push(`${f1(u * R)},${f1(-Hs + arcY(u))}`);
    }
    return pts.join(' ');
  };
  const body = `M${f1(-R)} ${f1(-Hs)} L${f1(-R)} 0 A${f1(R)} ${f1(ry)} 0 0 0 ${f1(R)} 0 L${f1(R)} ${f1(-Hs)} A${f1(R)} ${f1(ry)} 0 0 0 ${f1(-R)} ${f1(-Hs)} Z`;
  const id = uid('cyl', x, y, r, h);
  const nWin = windows ?? (kind === 'tower' ? Math.max(1, Math.floor(h / 70)) : 0);
  const rhh = (roofH ?? r * 1.6) * s * k;
  const re = R * 1.12;
  const rye = re / 2;
  const merlons = (front: boolean) => {
    const out: React.ReactNode[] = [];
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.31;
      const sy = Math.sin(a);
      if (front !== sy > 0) continue;
      const cx = Math.cos(a) * R * 0.92;
      const cy = -Hs + sy * ry * 0.92;
      const mw = R * 0.2;
      out.push(<rect key={i} x={f1(cx - mw / 2)} y={f1(cy - 16 * s)} width={f1(mw)} height={f1(16 * s)} fill={Math.cos(a) > 0.3 ? sh.right : sh.left} />);
    }
    return out;
  };
  return (
    <g transform={`translate(${x} ${y})`} opacity={clamp01(p * 8)}>
      {shadow && (
        <ellipse cx={f1(Hs * 0.17)} cy={f1(Hs * 0.085)} rx={f1(R * 1.02 + Hs * 0.19)} ry={f1(ry * 1.2)} transform={`rotate(26.57 ${f1(Hs * 0.17)} ${f1(Hs * 0.085)})`} fill={C.ink} opacity={0.12} />
      )}
      <path d={body} fill={base} />
      <polygon points={band(0.12, 1)} fill={C.ink} opacity={0.12} />
      <polygon points={band(0.58, 1)} fill={C.ink} opacity={0.14} />
      <polygon points={band(-0.66, -0.46)} fill={C.paperLight} opacity={0.2} />
      {kind === 'barrel' &&
        [0.2, 0.8].map((z, i) => (
          <path key={i} d={`M${f1(-R)} ${f1(-Hs * z)} A${f1(R)} ${f1(ry)} 0 0 0 ${f1(R)} ${f1(-Hs * z)}`} fill="none" stroke={C.inkLift} strokeWidth={Math.max(3, 4 * s)} />
        ))}
      {kind === 'tub' && <path d={`M${f1(-R)} ${f1(-Hs * 0.5)} A${f1(R)} ${f1(ry)} 0 0 0 ${f1(R)} ${f1(-Hs * 0.5)}`} fill="none" stroke={C.metal} strokeWidth={Math.max(3, 4 * s)} />}
      {Array.from({length: nWin}, (_, i) => {
        const z = -Hs * ((i + 0.6) / (nWin + 0.4));
        const u = -0.28 + (rand(seed * 3 + i) - 0.5) * 0.3;
        return <rect key={i} x={f1(u * R - 4 * s)} y={f1(z + arcY(u) - 13 * s * k)} width={f1(8 * s)} height={f1(26 * s * k)} rx={4 * s} fill={C.inkSoft} />;
      })}
      {tp === 'flat' && <ellipse cx={0} cy={-Hs} rx={R} ry={ry} fill={sh.top} />}
      {tp === 'flat' && kind === 'barrel' && <ellipse cx={0} cy={-Hs} rx={R * 0.78} ry={ry * 0.78} fill="none" stroke={dk(base, 0.2)} strokeWidth={Math.max(3, 3 * s)} />}
      {tp === 'crenel' && (
        <>
          {merlons(false)}
          <ellipse cx={0} cy={-Hs} rx={R} ry={ry} fill={sh.top} />
          <ellipse cx={0} cy={-Hs} rx={R * 0.8} ry={ry * 0.8} fill={dk(base, 0.18)} />
          {merlons(true)}
        </>
      )}
      {tp === 'open' && (
        <>
          <clipPath id={id}>
            <ellipse cx={0} cy={-Hs} rx={R * 0.86} ry={ry * 0.86} />
          </clipPath>
          <ellipse cx={0} cy={-Hs} rx={R} ry={ry} fill={sh.top} />
          <ellipse cx={0} cy={-Hs} rx={R * 0.86} ry={ry * 0.86} fill={dk(base, 0.4)} />
          {fill > 0 && (
            <g clipPath={`url(#${id})`}>
              <ellipse cx={0} cy={-Hs + (1 - fill) * Math.min(Hs * 0.8, ry * 1.2)} rx={R * 0.86} ry={ry * 0.86} fill={fillColor} />
              <ellipse cx={-R * 0.2} cy={-Hs + (1 - fill) * Math.min(Hs * 0.8, ry * 1.2) - ry * 0.2} rx={R * 0.3} ry={ry * 0.18} fill={C.paperLight} opacity={0.3} />
            </g>
          )}
        </>
      )}
      {tp === 'cone' && (
        <>
          <path d={`M${f1(-re)} ${f1(-Hs)} L0 ${f1(-Hs - rhh)} L${f1(re)} ${f1(-Hs)} A${f1(re)} ${f1(rye)} 0 0 1 ${f1(-re)} ${f1(-Hs)} Z`} fill={roofColor} />
          <path d={`M0 ${f1(-Hs - rhh)} L${f1(re)} ${f1(-Hs)} A${f1(re)} ${f1(rye)} 0 0 1 ${f1(re * 0.15)} ${f1(-Hs + rye * 0.99)} Z`} fill={C.ink} opacity={0.22} />
          <path d={`M0 ${f1(-Hs - rhh)} L${f1(-re * 0.62)} ${f1(-Hs + rye * 0.78)} L${f1(-re * 0.45)} ${f1(-Hs + rye * 0.89)} Z`} fill={C.paperLight} opacity={0.18} />
          <line x1={0} y1={-Hs - rhh} x2={0} y2={-Hs - rhh - 18 * s * k} stroke={C.inkLift} strokeWidth={4 * s} strokeLinecap="round" />
        </>
      )}
    </g>
  );
};

// ============================================================================================
// SPHERE — reads round with flat crescents (terminator, core shadow, bounce rim) + specular blob

type SpherePreset = 'planet' | 'moon' | 'cell' | 'eyeball';
const SPHERE_PRESETS: Record<SpherePreset, {color: string; pattern: 'none' | 'bands' | 'spots' | 'craters'; terminator: number; rim: boolean; highlight: boolean}> = {
  planet: {color: C.cautionTint, pattern: 'bands', terminator: 0.34, rim: true, highlight: false},
  moon: {color: C.stone, pattern: 'craters', terminator: 0.3, rim: false, highlight: false},
  cell: {color: C.evidenceTint, pattern: 'spots', terminator: 0.22, rim: true, highlight: true},
  eyeball: {color: C.paperLight, pattern: 'none', terminator: 0.2, rim: false, highlight: true},
};

/** Project a surface point (lon, lat in degrees) of a unit sphere with spin + axial tilt → [x, y, facing]. */
const sph = (lon: number, lat: number, spin: number, tilt: number): [number, number, number] => {
  const l = (lon + spin) * RAD;
  const ph = lat * RAD;
  const t = tilt * RAD;
  const cp = Math.cos(ph);
  const X = cp * Math.sin(l);
  const Y = Math.sin(ph) * Math.cos(t) - cp * Math.cos(l) * Math.sin(t);
  const Z = Math.sin(ph) * Math.sin(t) + cp * Math.cos(l) * Math.cos(t);
  return [X, -Y, Z];
};

/** Foreshortened surface blob: ellipse at (lon, lat) with angular radius a (rad). null when on the far side. */
const blob = (r: number, lon: number, lat: number, a: number, spin: number, tilt: number) => {
  const [X, Y, Z] = sph(lon, lat, spin, tilt);
  if (Z < -0.05) return null;
  const rho = Math.hypot(X, Y);
  const ang = rho < 1e-6 ? 0 : (Math.atan2(Y, X) * 180) / Math.PI;
  return {cx: X * r, cy: Y * r, rx: Math.max(0.5, r * Math.sin(a) * Math.max(0.08, Z)), ry: r * Math.sin(a), ang, z: Z};
};

/**
 * Shaded sphere (planet, moon, cell, eyeball…). origin = centre; radius r. Reads round from 2–3 flat crescents:
 * terminator shade (0..1 = how much is in shade), deeper core shadow, optional rim (bounce light on the dark
 * edge) and a flat specular highlight. pattern 'bands' | 'spots' | 'craters' (seeded) spins with `rotate` (deg).
 * preset fills sensible defaults; explicit props win. children draw on the surface (clipped, origin = centre)
 * BEFORE the shading — e.g. an iris for an eyeball. p = pop-in.
 */
export const Sphere: React.FC<{
  x: number;
  y: number;
  r: number;
  preset?: SpherePreset;
  color?: string;
  light?: [number, number];
  terminator?: number;
  rim?: boolean;
  highlight?: boolean;
  pattern?: 'none' | 'bands' | 'spots' | 'craters';
  patternColor?: string;
  seed?: number;
  rotate?: number;
  tilt?: number;
  outline?: boolean;
  p?: number;
  children?: React.ReactNode;
}> = ({x, y, r, preset, light = [-0.6, -0.8], rim, highlight, pattern, patternColor, seed = 1, rotate = 0, tilt = 14, outline = true, p = 1, children, ...rest}) => {
  if (p <= 0) return null;
  const pre = preset ? SPHERE_PRESETS[preset] : undefined;
  const color = rest.color ?? pre?.color ?? C.stone;
  const term = rest.terminator ?? pre?.terminator ?? 0.3;
  const pat = pattern ?? pre?.pattern ?? 'none';
  const useRim = rim ?? pre?.rim ?? true;
  const useHi = highlight ?? pre?.highlight ?? true;
  const pc = patternColor ?? color;
  const k = ease.outBack(clamp01(p));
  const la = lightAngle(light);
  const dark = la + Math.PI;
  const lx = Math.cos(la);
  const ly = Math.sin(la);
  const id = uid('sph', x, y, r, seed);
  const pats: React.ReactNode[] = [];
  if (pat === 'bands') {
    // latitude bands, exact visible arcs (limb-limited), extended past the rim (clipped)
    const n = 7 + Math.floor(rand(seed * 1.7) * 3);
    const edges: number[] = [-82];
    for (let i = 1; i < n; i++) edges.push(lerp(-70, 70, i / n) + randRange(seed * 5 + i, -6, 6));
    edges.push(82);
    const tilt0 = tilt * RAD;
    const arc = (lat: number, rev: boolean) => {
      const c = Math.max(-1, Math.min(1, -Math.tan(lat * RAD) * Math.tan(tilt0)));
      const lim = (Math.acos(c) * 180) / Math.PI;
      const pts: [number, number][] = [];
      const m = 28;
      for (let i = 0; i <= m; i++) {
        const lon = -lim + (2 * lim * i) / m;
        const [X, Y] = sph(lon, lat, 0, tilt);
        pts.push([X * r, Y * r]);
      }
      // push the ends past the rim so clipping closes the band against the limb
      pts.unshift([pts[0][0] * 1.5, pts[0][1] * 1.5]);
      pts.push([pts[pts.length - 1][0] * 1.5, pts[pts.length - 1][1] * 1.5]);
      return rev ? pts.reverse() : pts;
    };
    for (let i = 0; i < n; i++) {
      if (i % 2 === 0 && rand(seed * 2.2 + i) < 0.75) continue;
      const tone = rand(seed * 4.4 + i) < 0.5 ? dk(pc, 0.12 + rand(seed + i) * 0.1) : lt(pc, 0.3);
      const pts = [...arc(edges[i], false), ...arc(edges[i + 1], true)];
      pats.push(<polygon key={`b${i}`} points={pts.map(([a, b]) => `${f1(a)},${f1(b)}`).join(' ')} fill={tone} />);
    }
    // a storm oval that shows the spin
    const st = blob(r, randRange(seed * 6.1, 0, 360), randRange(seed * 6.7, -30, -12), 0.16, rotate, tilt);
    if (st) pats.push(<ellipse key="storm" cx={st.cx} cy={st.cy} rx={st.rx * 1.5} ry={st.ry * 0.85} transform={`rotate(${st.ang} ${st.cx} ${st.cy})`} fill={dk(pc, 0.28)} />);
  } else if (pat === 'spots' || pat === 'craters') {
    const craters = pat === 'craters';
    const n = craters ? 24 : 13;
    const items: {lon: number; lat: number; a: number; i: number}[] = [];
    for (let i = 0; i < n; i++) {
      const big = craters && i < 4;
      items.push({
        lon: randRange(seed * 11.3 + i * 7.1, 0, 360),
        lat: (Math.asin(randRange(seed * 3.9 + i * 2.3, -0.85, 0.85)) * 180) / Math.PI,
        a: big ? randRange(seed + i * 1.7, 0.32, 0.5) : randRange(seed * 2 + i * 3.3, craters ? 0.07 : 0.08, craters ? 0.17 : 0.17),
        i,
      });
    }
    for (const it of items) {
      const b = blob(r, it.lon, it.lat, it.a, rotate, tilt);
      if (!b) continue;
      const tr = `rotate(${f1(b.ang)} ${f1(b.cx)} ${f1(b.cy)})`;
      if (craters && it.i < 4) {
        pats.push(<ellipse key={it.i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} transform={tr} fill={dk(pc, 0.14)} opacity={0.75} />);
      } else if (craters) {
        const off = b.ry * 0.16;
        pats.push(
          <g key={it.i}>
            <ellipse cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} transform={tr} fill={lt(pc, 0.35)} />
            <ellipse cx={b.cx + lx * off} cy={b.cy + ly * off} rx={b.rx * 0.84} ry={b.ry * 0.84} transform={`rotate(${f1(b.ang)} ${f1(b.cx + lx * off)} ${f1(b.cy + ly * off)})`} fill={dk(pc, 0.2)} />
          </g>,
        );
      } else {
        const tone = it.i % 3 === 0 ? dk(pc, 0.18) : lt(pc, 0.32);
        pats.push(<ellipse key={it.i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} transform={tr} fill={tone} />);
      }
    }
  }
  const sw = Math.max(3, r * 0.022);
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={clamp01(p * 3)}>
      <clipPath id={id}>
        <circle r={r} />
      </clipPath>
      <circle r={r} fill={color} />
      {(pats.length > 0 || children) && (
        <g clipPath={`url(#${id})`}>
          {pats}
          {children}
        </g>
      )}
      <path d={crescentPath(r, dark, term)} fill={C.ink} opacity={0.17} />
      <path d={crescentPath(r, dark, term * 0.5)} fill={C.ink} opacity={0.13} />
      {useRim && <path d={crescentPath(r, dark, 0.06)} fill={C.paperLight} opacity={0.22} />}
      {useHi && (
        <g fill={C.paperLight}>
          <ellipse cx={lx * r * 0.48} cy={ly * r * 0.48} rx={r * 0.17} ry={r * 0.1} transform={`rotate(${f1((la * 180) / Math.PI + 90)} ${f1(lx * r * 0.48)} ${f1(ly * r * 0.48)})`} opacity={0.7} />
          <circle cx={lx * r * 0.25 + ly * r * 0.22} cy={ly * r * 0.25 - lx * r * 0.22} r={r * 0.04} opacity={0.6} />
        </g>
      )}
      {outline && <circle r={r} fill="none" stroke={dk(color, 0.45)} strokeWidth={sw} />}
    </g>
  );
};

// ============================================================================================
// DEPTH STACK — perspective layers for "dolly through" shots

export type DepthCam = {x: number; y: number; zoom?: number; z?: number};

/** Perspective scale + screen shift of a layer at depth z for camera `cam` (see DepthStack). */
export const depthAt = (z: number, cam: DepthCam, frame: {w: number; h: number} = {w: W, h: H}) => {
  const dz = z - (cam.z ?? 0);
  const zoom = cam.zoom ?? 1;
  return {dz, s: (zoom * z) / dz, dx: (-(cam.x - frame.w / 2) * zoom) / dz, dy: (-(cam.y - frame.h / 2) * zoom) / dz};
};

/**
 * Flat layers placed at depths z (1 = main plane, 2 = twice as far, 0.5 = foreground) and viewed through a
 * simple perspective camera: scale = zoom·z / (z − cam.z), pan shift ∝ 1 / (z − cam.z). Each layer is designed in
 * its own frame (default 1920×1080) and looks exactly as designed at rest (cam at frame centre, z 0, zoom 1).
 * Dolly = animate cam.z toward a layer: near layers grow fast, fade and pass the camera (hidden at dz < 0.12).
 * haze 0..1 + focus: layers beyond `focus` get a flat hazeColor veil (atmospheric perspective, no blur).
 */
export const DepthStack: React.FC<{
  layers: {el: React.ReactNode; z: number}[];
  cam: DepthCam;
  focus?: number;
  haze?: number;
  hazeColor?: string;
  frame?: {x: number; y: number; w: number; h: number};
}> = ({layers, cam, focus = 1, haze = 0, hazeColor = C.paper, frame = {x: 0, y: 0, w: W, h: H}}) => {
  const sorted = layers.map((l, i) => ({...l, i})).sort((a, b) => b.z - a.z || a.i - b.i);
  const hz = sorted.map((l) => {
    const dz = l.z - (cam.z ?? 0);
    return dz <= 0 ? 0 : clamp01(haze * (1 - focus / dz));
  });
  const cx = frame.x + frame.w / 2;
  const cy = frame.y + frame.h / 2;
  return (
    <g>
      {sorted.map((l, j) => {
        const d = depthAt(l.z, cam, frame);
        const o = clamp01((d.dz - 0.12) / 0.23);
        const next = j + 1 < hz.length ? hz[j + 1] : 0;
        const veil = hz[j] > 0 ? clamp01(1 - (1 - hz[j]) / (1 - next || 1e-6)) : 0;
        return (
          <React.Fragment key={l.i}>
            {d.dz > 0.12 && o > 0 && (
              <g transform={`translate(${f2(cx + d.dx)} ${f2(cy + d.dy)}) scale(${d.s.toFixed(4)}) translate(${-frame.w / 2} ${-frame.h / 2})`} opacity={o}>
                {l.el}
              </g>
            )}
            {veil > 0.001 && <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill={hazeColor} opacity={veil} />}
          </React.Fragment>
        );
      })}
    </g>
  );
};
