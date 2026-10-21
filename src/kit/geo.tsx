import React from 'react';
import {geoConicConformal, geoEqualEarth, geoGraticule, geoMercator, geoPath, GeoPermissibleObjects, GeoProjection} from 'd3-geo';
import {feature, mesh} from 'topojson-client';
import type {GeometryCollection, Topology} from 'topojson-specification';
import world50json from 'world-atlas/countries-50m.json';
import world110json from 'world-atlas/countries-110m.json';
import {C, FONT_SANS, FONT_SERIF} from './theme';
import {clamp01, ease, lerp} from './anim';
import {uid} from './stage';

// Maps for history / geography beats, styled like elegant old-print maps: paper land, slightly
// darker sea with engraved coast lines, thin ink coastlines, faint graticule, Fraunces italic seas.
// All data is local (world-atlas TopoJSON) and every projection/path is memoised per region+size.

type Topo = Topology<{countries: GeometryCollection<{name: string}>; land: GeometryCollection}>;
const TOPO: Record<'50m' | '110m', Topo> = {'50m': world50json as unknown as Topo, '110m': world110json as unknown as Topo};

export type LonLat = [number, number];
export type BBox = [LonLat, LonLat]; // [[west, south], [east, north]]
export type ProjName = 'mercator' | 'equalEarth' | 'conicConformal';
export type RegionName =
  | 'world'
  | 'europe'
  | 'western-europe'
  | 'mediterranean'
  | 'north-america'
  | 'south-america'
  | 'africa'
  | 'middle-east'
  | 'asia'
  | 'iberia'
  | 'british-isles'
  | 'france'
  | 'italy'
  | 'low-countries'
  | 'alps';
export type Region = RegionName | BBox;

/** Region presets: bbox [[W,S],[E,N]] + default projection. */
export const REGIONS: Record<RegionName, {bbox: BBox; proj: ProjName}> = {
  world: {bbox: [[-180, -60], [180, 84]], proj: 'equalEarth'},
  europe: {bbox: [[-12, 35], [32, 60]], proj: 'conicConformal'},
  'western-europe': {bbox: [[-11, 36], [16, 56]], proj: 'conicConformal'},
  mediterranean: {bbox: [[-7, 29], [37, 46.5]], proj: 'conicConformal'},
  'north-america': {bbox: [[-128, 14], [-60, 58]], proj: 'conicConformal'},
  'south-america': {bbox: [[-84, -56], [-33, 13]], proj: 'mercator'},
  africa: {bbox: [[-19, -36], [52, 38]], proj: 'mercator'},
  'middle-east': {bbox: [[24, 12], [64, 42]], proj: 'mercator'},
  asia: {bbox: [[60, -8], [148, 56]], proj: 'conicConformal'},
  iberia: {bbox: [[-10, 35.6], [4, 44]], proj: 'mercator'},
  'british-isles': {bbox: [[-11, 49.5], [2.5, 59.5]], proj: 'mercator'},
  france: {bbox: [[-5.5, 41.2], [9.8, 51.3]], proj: 'mercator'},
  italy: {bbox: [[6, 36.5], [19, 47.2]], proj: 'mercator'},
  'low-countries': {bbox: [[2.4, 49.4], [7.3, 53.6]], proj: 'mercator'},
  alps: {bbox: [[5, 43.5], [17, 48.5]], proj: 'mercator'},
};

// ---------------------------------------------------------------------------------------------
// Projection + path cache (module level, deterministic)

const projCache = new Map<string, GeoProjection>();
const keyOf = (region: Region, w: number, h: number, proj?: ProjName) => `${typeof region === 'string' ? region : JSON.stringify(region)}|${Math.round(w)}|${Math.round(h)}|${proj ?? ''}`;

const buildProjection = (region: Region, w: number, h: number, proj?: ProjName): GeoProjection => {
  const key = keyOf(region, w, h, proj);
  const hit = projCache.get(key);
  if (hit) return hit;
  const preset = typeof region === 'string' ? REGIONS[region] : {bbox: region, proj: 'mercator' as ProjName};
  const name = proj ?? preset.proj;
  const [[w0, s0], [e0, n0]] = preset.bbox;
  let p: GeoProjection;
  if (region === 'world') {
    p = (name === 'mercator' ? geoMercator() : geoEqualEarth()).rotate([-10, 0]);
    if (name === 'mercator') p.fitExtent([[0, 0], [w, h]], {type: 'MultiPoint', coordinates: [[-170, -58], [190, 80]]});
    else p.fitExtent([[3, 3], [w - 3, h - 3]], {type: 'Sphere'});
  } else {
    const lon0 = (w0 + e0) / 2;
    p =
      name === 'conicConformal'
        ? geoConicConformal()
            .parallels([lerp(s0, n0, 0.25), lerp(s0, n0, 0.75)])
            .rotate([-lon0, 0])
        : name === 'equalEarth'
          ? geoEqualEarth().rotate([-lon0, 0])
          : geoMercator().rotate([-lon0, 0]);
    const pts: LonLat[] = [];
    for (let i = 0; i <= 12; i++) {
      const k = i / 12;
      pts.push([lerp(w0, e0, k), s0], [lerp(w0, e0, k), n0], [w0, lerp(s0, n0, k)], [e0, lerp(s0, n0, k)]);
    }
    p.fitExtent([[0, 0], [w, h]], {type: 'MultiPoint', coordinates: pts});
    p.clipExtent([[-40, -40], [w + 40, h + 40]]);
  }
  projCache.set(key, p);
  return p;
};

/**
 * Pure projection helper: same projection GeoMap uses for (region, w, h). Returns (lon, lat) → [x, y]
 * in absolute stage px when you pass the map's x/y. Use it to place pins, routes, labels on a map.
 */
export const makeProjection = (region: Region, w: number, h: number, opts: {x?: number; y?: number; projection?: ProjName} = {}) => {
  const p = buildProjection(region, w, h, opts.projection);
  const ox = opts.x ?? 0;
  const oy = opts.y ?? 0;
  return (lon: number, lat: number): [number, number] => {
    const r = p([lon, lat]) ?? [NaN, NaN];
    return [r[0] + ox, r[1] + oy];
  };
};
export type Proj = ReturnType<typeof makeProjection>;

type Feat = {id: string; name: string; f: GeoJSON.Feature};
const featCache = new Map<string, Feat[]>();
const features = (detail: '50m' | '110m') => {
  let f = featCache.get(detail);
  if (!f) {
    const topo = TOPO[detail];
    const fc = feature(topo, topo.objects.countries) as GeoJSON.FeatureCollection<GeoJSON.Geometry, {name: string}>;
    f = fc.features.map((g) => ({id: String(g.id ?? ''), name: (g.properties?.name ?? '').toLowerCase(), f: g as GeoJSON.Feature}));
    featCache.set(detail, f);
  }
  return f;
};

/**
 * Path context that decimates (drops vertices < `min` px apart), drops sub-paths smaller than `tiny` px
 * and rounds to 0.1 px — keeps 50m data light enough to paint fast every frame.
 */
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
    private min = 1.2,
    private tiny = 3,
  ) {}
  private flush() {
    if (this.buf.length && Math.max(this.x1 - this.x0, this.y1 - this.y0) >= this.tiny) this.out.push(this.buf.join(''));
    this.buf = [];
  }
  moveTo(x: number, y: number) {
    this.flush();
    this.buf.push(`M${x.toFixed(1)} ${y.toFixed(1)}`);
    this.lx = this.x0 = this.x1 = x;
    this.ly = this.y0 = this.y1 = y;
  }
  lineTo(x: number, y: number) {
    if (Math.abs(x - this.lx) + Math.abs(y - this.ly) < this.min) return;
    this.buf.push(`L${x.toFixed(1)} ${y.toFixed(1)}`);
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
const lean = (p: GeoProjection, obj: GeoPermissibleObjects, min = 1.2, tiny = 3) => {
  const ctx = new LeanPath(min, tiny);
  geoPath(p, ctx)(obj);
  return ctx.result();
};

type MapPaths = {land: string; coast: string; ripple: string; borders: string; sphere: string; grat: Map<number, string>; countries: Map<string, string>};
const pathCache = new Map<string, MapPaths>();
const mapPaths = (region: Region, w: number, h: number, proj: ProjName | undefined, detail: '50m' | '110m'): MapPaths => {
  const key = keyOf(region, w, h, proj) + '|' + detail;
  let m = pathCache.get(key);
  if (m) return m;
  const p = buildProjection(region, w, h, proj);
  const topo = TOPO[detail];
  m = {
    land: lean(p, feature(topo, topo.objects.land)),
    coast: lean(p, mesh(topo, topo.objects.countries, (a, b) => a === b)),
    borders: lean(p, mesh(topo, topo.objects.countries, (a, b) => a !== b), 1.5, 6),
    ripple: lean(p, mesh(topo, topo.objects.countries, (a, b) => a === b), 5, 16),
    sphere: geoPath(p)({type: 'Sphere'}) ?? '',
    grat: new Map(),
    countries: new Map(),
  };
  pathCache.set(key, m);
  return m;
};
const gratPath = (m: MapPaths, region: Region, w: number, h: number, proj: ProjName | undefined, step: number) => {
  let d = m.grat.get(step);
  if (d === undefined) {
    d = lean(buildProjection(region, w, h, proj), geoGraticule().step([step, step])(), 2, 0);
    m.grat.set(step, d);
  }
  return d;
};
const countryPath = (m: MapPaths, region: Region, w: number, h: number, proj: ProjName | undefined, detail: '50m' | '110m', c: string | number) => {
  const q = String(c).toLowerCase();
  const k = `${q}`;
  let d = m.countries.get(k);
  if (d === undefined) {
    const qn = /^\d+$/.test(q) ? q.padStart(3, '0') : '';
    const f = features(detail).find((x) => x.name === q || (qn && x.id === qn));
    d = f ? lean(buildProjection(region, w, h, proj), f.f) : '';
    m.countries.set(k, d);
  }
  return d;
};

// ---------------------------------------------------------------------------------------------
// GeoMap

export type MapHighlight = {countries: (string | number)[]; color?: string; p?: number; outline?: string};
export type MapLabelSpec = {text: string; lon: number; lat: number; kind?: 'sea' | 'region' | 'country'; size?: number; rotate?: number};

/**
 * Old-print style map rendered in the box (x, y, w, h), clipped. region: preset name or bbox
 * [[W,S],[E,N]]; projection defaults per preset (conicConformal for Europe, equalEarth for world).
 * detail: '50m' (default, regional) | '110m' (default for world). highlight: countries by name or ISO
 * numeric with colour + progress. labels: seas/regions in Fraunces italic. p: map fades/settles in.
 * children are drawn on top, clipped to the box (place them with makeProjection(region, w, h, {x, y})).
 * World maps show the globe outline (outside = page background).
 */
export const GeoMap: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  region?: Region;
  projection?: ProjName;
  detail?: '50m' | '110m';
  p?: number;
  land?: string;
  sea?: string;
  border?: string;
  coast?: string;
  borders?: boolean;
  graticule?: boolean | number;
  ripples?: boolean;
  frame?: boolean;
  highlight?: MapHighlight[];
  labels?: MapLabelSpec[];
  labelP?: number;
  children?: React.ReactNode;
}> = ({
  x,
  y,
  w,
  h,
  region = 'europe',
  projection,
  detail,
  p = 1,
  land = C.paperLight,
  sea = C.paperShade,
  border = C.inkFaint,
  coast = C.inkLift,
  borders = true,
  graticule = true,
  ripples,
  frame = true,
  highlight = [],
  labels = [],
  labelP = 1,
  children,
}) => {
  if (p <= 0) return null;
  const isWorld = region === 'world';
  const det = detail ?? (isWorld ? '110m' : '50m');
  const m = mapPaths(region, w, h, projection, det);
  const proj = makeProjection(region, w, h, {projection});
  const id = uid('map', x, y, w, h);
  const k = ease.out(clamp01(p));
  const step = typeof graticule === 'number' ? graticule : isWorld ? 30 : 5;
  const rip = ripples ?? !isWorld;
  const seaLine = C.paperDeep;
  return (
    <g opacity={k} className="k-nomirror">{/* RTL: maps keep real geography */}
      <clipPath id={`${id}c`}>{isWorld ? <path d={m.sphere} transform={`translate(${x} ${y})`} /> : <rect x={x} y={y} width={w} height={h} />}</clipPath>
      <g clipPath={`url(#${id}c)`}>
        <g transform={`translate(${x} ${y})`}>
          {isWorld ? <path d={m.sphere} fill={sea} /> : <rect width={w} height={h} fill={sea} />}
          {graticule !== false && <path d={gratPath(m, region, w, h, projection, step)} fill="none" stroke={C.inkFaint} strokeWidth={1.5} opacity={0.3} />}
          {rip && (
            <g fill="none" strokeLinejoin="round">
              <path d={m.ripple} stroke={seaLine} strokeWidth={22} opacity={0.7} />
              <path d={m.ripple} stroke={sea} strokeWidth={15} />
            </g>
          )}
          <path d={m.land} fill={land} />
          {highlight.map((hl, i) => {
            const hp = clamp01(hl.p ?? 1);
            if (hp <= 0) return null;
            const col = hl.color ?? C.oxLight;
            return (
              <g key={i}>
                {hl.countries.map((c) => {
                  const d = countryPath(m, region, w, h, projection, det, c);
                  return (
                    <g key={String(c)}>
                      <path d={d} fill={col} opacity={0.75 * ease.inOut(hp)} />
                      <path d={d} fill="none" stroke={hl.outline ?? col} strokeWidth={2.5} strokeLinejoin="round" opacity={hp} />
                    </g>
                  );
                })}
              </g>
            );
          })}
          {borders && <path d={m.borders} fill="none" stroke={border} strokeWidth={isWorld ? 1.2 : 2} strokeLinejoin="round" opacity={0.75} />}
          <path d={m.coast} fill="none" stroke={coast} strokeWidth={isWorld ? 1.6 : 2.4} strokeLinejoin="round" />
          {isWorld && <path d={m.sphere} fill="none" stroke={C.inkLift} strokeWidth={3} />}
        </g>
        {labels.map((l, i) => {
          const [lx, ly] = proj(l.lon, l.lat);
          return <MapLabel key={i} x={x + lx} y={y + ly} text={l.text} kind={l.kind ?? 'sea'} size={l.size} rotate={l.rotate} p={clamp01(labelP * 1.5 - i * 0.12)} />;
        })}
        {children}
      </g>
      {frame && !isWorld && (
        <g fill="none">
          <rect x={x} y={y} width={w} height={h} stroke={C.ink} strokeWidth={3} />
          <rect x={x - 9} y={y - 9} width={w + 18} height={h + 18} stroke={C.inkLift} strokeWidth={1.5} />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// Map annotations

const halo = {paintOrder: 'stroke', stroke: C.paperLight, strokeWidth: 7, strokeLinejoin: 'round'} as const;

/** Map text: 'sea' = Fraunces italic tracked (inkMute), 'region' = sans caps tracked, 'country' = Fraunces caps. origin = text centre. */
export const MapLabel: React.FC<{x: number; y: number; text: string; kind?: 'sea' | 'region' | 'country'; size?: number; rotate?: number; p?: number; color?: string}> = ({
  x,
  y,
  text,
  kind = 'sea',
  size,
  rotate = 0,
  p = 1,
  color,
}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  const sz = size ?? (kind === 'sea' ? 40 : kind === 'region' ? 34 : 38);
  const common = {x: 0, y: sz * 0.35, textAnchor: 'middle' as const};
  return (
    <g transform={`translate(${x} ${y + (1 - k) * 8}) rotate(${rotate})`} opacity={k}>
      {kind === 'sea' && (
        <text {...common} fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={500} fontSize={sz} letterSpacing={sz * 0.12} fill={color ?? C.inkMute}>
          {text}
        </text>
      )}
      {kind === 'region' && (
        <text {...common} fontFamily={FONT_SANS} fontWeight={700} fontSize={sz} letterSpacing={sz * 0.22} fill={color ?? C.inkMute} {...halo}>
          {text}
        </text>
      )}
      {kind === 'country' && (
        <text {...common} fontFamily={FONT_SERIF} fontWeight={600} fontSize={sz} letterSpacing={sz * 0.16} fill={color ?? C.inkLift} {...halo}>
          {text}
        </text>
      )}
    </g>
  );
};

/**
 * Map pin that drops in with a gentle settle. origin = pin tip (the exact location); ≈44×64 at s=1.
 * label (Fraunces) + optional sub (sans caps) sit beside it (side 'right' | 'left' | 'top').
 */
export const MapPin: React.FC<{x: number; y: number; p?: number; label?: string; sub?: string; color?: string; s?: number; side?: 'right' | 'left' | 'top'}> = ({
  x,
  y,
  p = 1,
  label,
  sub,
  color = C.oxblood,
  s = 1,
  side = 'right',
}) => {
  if (p <= 0) return null;
  const drop = ease.outBack(clamp01(p * 1.4));
  const lk = ease.out(clamp01(p * 1.6 - 0.5));
  const pin = 'M0 0 C-5 -12 -21 -24 -21 -40 A21 21 0 1 1 21 -40 C21 -24 5 -12 0 0 Z';
  const half = 'M0 0 C5 -12 21 -24 21 -40 A21 21 0 0 0 4 -60.6 C14 -52 14 -30 0 0 Z';
  const tx = side === 'left' ? -34 : side === 'top' ? 0 : 34;
  const ty = side === 'top' ? (sub ? -122 : -84) : -38;
  const anchor = side === 'left' ? 'end' : side === 'top' ? 'middle' : 'start';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={12 * drop} ry={4 * drop} fill={C.ink} opacity={0.25 * clamp01(p * 2)} />
      <g transform={`translate(0 ${-50 * (1 - drop)})`} opacity={clamp01(p * 4)}>
        <path d={pin} fill={color} />
        <path d={half} fill={C.ink} opacity={0.18} />
        <circle cx={0} cy={-40} r={8} fill={C.paperLight} />
      </g>
      {label && (
        <g opacity={lk}>
          <text x={tx} y={ty + (sub ? 0 : 10)} textAnchor={anchor} fontFamily={FONT_SERIF} fontWeight={600} fontSize={44} fill={C.ink} {...halo}>
            {label}
          </text>
          {sub && (
            <text x={tx} y={ty + 40} textAnchor={anchor} fontFamily={FONT_SANS} fontWeight={700} fontSize={30} letterSpacing={3} fill={C.inkMute} {...halo} strokeWidth={6}>
              {sub}
            </text>
          )}
        </g>
      )}
    </g>
  );
};

/** City dot (ring + centre) with Fraunces label. origin = the city. side 'right' | 'left' | 'top' | 'bottom'. */
export const CityDot: React.FC<{x: number; y: number; label?: string; p?: number; color?: string; side?: 'right' | 'left' | 'top' | 'bottom'; size?: number; italic?: boolean}> = ({
  x,
  y,
  label,
  p = 1,
  color = C.ink,
  side = 'right',
  size = 40,
  italic = false,
}) => {
  if (p <= 0) return null;
  const k = ease.outBack(clamp01(p * 1.5));
  const lk = ease.out(clamp01(p * 1.5 - 0.4));
  const pos = {right: [18, 9, 'start'], left: [-18, 9, 'end'], top: [0, -18, 'middle'], bottom: [0, 36, 'middle']}[side] as [number, number, 'start' | 'end' | 'middle'];
  return (
    <g>
      <g transform={`translate(${x} ${y}) scale(${k})`}>
        <circle r={10} fill={C.paperLight} stroke={color} strokeWidth={3.5} />
        <circle r={4.5} fill={color} />
      </g>
      {label && (
        <text x={x + pos[0]} y={y + pos[1]} textAnchor={pos[2]} fontFamily={FONT_SERIF} fontStyle={italic ? 'italic' : 'normal'} fontWeight={600} fontSize={size} fill={C.ink} opacity={lk} {...halo}>
          {label}
        </text>
      )}
    </g>
  );
};

/** Soft area marker for a region without a modern border (e.g. "Brabant"): flat tint + dashed rim that draws on. origin = centre. */
export const AreaMark: React.FC<{x: number; y: number; rx: number; ry?: number; rot?: number; p?: number; color?: string; label?: string; labelDy?: number}> = ({
  x,
  y,
  rx,
  ry,
  rot = 0,
  p = 1,
  color = C.theory,
  label,
  labelDy,
}) => {
  if (p <= 0) return null;
  const k = ease.inOut(clamp01(p));
  const r2 = ry ?? rx * 0.7;
  const id = uid('area', x, y, rx);
  const d = `M${-rx} 0 A${rx} ${r2} 0 1 1 ${rx} 0 A${rx} ${r2} 0 1 1 ${-rx} 0 Z`;
  return (
    <g>
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        <path d={d} fill={color} opacity={0.16 * k} />
        <mask id={id}>
          <path d={d} pathLength={1} stroke="#fff" strokeWidth={10} fill="none" strokeDasharray="1 1" strokeDashoffset={1 - k} />
        </mask>
        <path d={d} stroke={color} strokeWidth={3.5} fill="none" strokeDasharray="10 7" strokeLinecap="round" mask={`url(#${id})`} />
      </g>
      {label && <MapLabel x={x} y={y + (labelDy ?? 0)} text={label} kind="region" p={clamp01(p * 1.5 - 0.5)} color={color} />}
    </g>
  );
};

// small Catmull-Rom sampler for routes
type RPt = [number, number];
const routeCurve = (pts: RPt[]) => {
  const n = pts.length;
  const g = (i: number) => pts[Math.max(0, Math.min(n - 1, i))];
  const poly: RPt[] = [];
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const [p0, p1, p2, p3] = [g(i - 1), g(i), g(i + 1), g(i + 2)];
    const c1: RPt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: RPt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    for (let j = i === 0 ? 0 : 1; j <= 20; j++) {
      const u = j / 20;
      const v = 1 - u;
      poly.push([
        v * v * v * p1[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * p2[0],
        v * v * v * p1[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * p2[1],
      ]);
    }
  }
  const cum = [0];
  for (let i = 1; i < poly.length; i++) cum.push(cum[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  const len = cum[cum.length - 1] || 1;
  const at = (k: number) => {
    const L = clamp01(k) * len;
    let i = 0;
    while (i < cum.length - 2 && cum[i + 1] < L) i++;
    const f = clamp01((L - cum[i]) / (cum[i + 1] - cum[i] || 1));
    const a = poly[i];
    const b = poly[i + 1] ?? a;
    return {x: lerp(a[0], b[0], f), y: lerp(a[1], b[1], f), a: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI};
  };
  return {d, at, len};
};

/**
 * Route line that draws on (trade route, plague spread, journey). points: [lon,lat][] with `proj`
 * (from makeProjection) or absolute px points without it. Two points arc by `bend` (fraction of length,
 * + = bulge left of travel). dashed, arrow (head travels with the tip), dots at waypoints.
 */
export const Route: React.FC<{
  points: [number, number][];
  proj?: Proj;
  p?: number;
  color?: string;
  width?: number;
  dashed?: boolean;
  arrow?: boolean;
  bend?: number;
  dots?: boolean;
}> = ({points, proj, p = 1, color = C.oxblood, width = 5, dashed = false, arrow = true, bend = 0.18, dots = false}) => {
  if (p <= 0 || points.length < 2) return null;
  let pts: RPt[] = points.map((q) => (proj ? proj(q[0], q[1]) : q));
  if (pts.length === 2) {
    const [a, b] = pts;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    pts = [a, [(a[0] + b[0]) / 2 + dy * bend, (a[1] + b[1]) / 2 - dx * bend], b];
  }
  const c = routeCurve(pts);
  const k = ease.inOut(clamp01(p));
  const id = uid('route', pts[0][0], pts[0][1], pts[pts.length - 1][0], pts.length);
  const tip = c.at(k);
  const ah = width * 3.4;
  return (
    <g>
      <mask id={id}>
        <path d={c.d} pathLength={1} stroke="#fff" strokeWidth={width + 10} fill="none" strokeDasharray="1 1" strokeDashoffset={1 - k} strokeLinecap="butt" />
      </mask>
      <g mask={`url(#${id})`}>
        <path d={c.d} stroke={C.paperLight} strokeWidth={width + 5} fill="none" strokeLinecap="round" strokeDasharray={dashed ? `${width * 2.6} ${width * 1.6}` : undefined} opacity={0.8} />
        <path d={c.d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeDasharray={dashed ? `${width * 2.6} ${width * 1.6}` : undefined} />
      </g>
      {dots &&
        points.map((_, i) => {
          const q = proj ? proj(points[i][0], points[i][1]) : points[i];
          const show = i === 0 || k >= 1 || i < points.length - 1;
          return show ? <circle key={i} cx={q[0]} cy={q[1]} r={width * 1.3} fill={color} stroke={C.paperLight} strokeWidth={3} opacity={i === 0 ? 1 : clamp01(k * points.length - i + 0.5)} /> : null;
        })}
      {arrow && k > 0.02 && (
        <g transform={`translate(${tip.x} ${tip.y}) rotate(${tip.a})`}>
          <path d={`M${ah * 0.55} 0 L${-ah * 0.6} ${-ah * 0.55} L${-ah * 0.3} 0 L${-ah * 0.6} ${ah * 0.55} Z`} fill={color} stroke={C.paperLight} strokeWidth={2.5} strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

/** Outbreak rings: a filled core with rings expanding outward on a loop (t). origin = centre; r = max ring radius. p fades the whole mark in. */
export const SpreadRings: React.FC<{t: number; x: number; y: number; r?: number; n?: number; period?: number; color?: string; p?: number; core?: number}> = ({
  t,
  x,
  y,
  r = 110,
  n = 3,
  period = 2.4,
  color = C.oxblood,
  p = 1,
  core = 12,
}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  return (
    <g transform={`translate(${x} ${y})`} opacity={k}>
      {Array.from({length: n}, (_, i) => {
        const q = ((t / period + i / n) % 1 + 1) % 1;
        const rr = r * ease.out(q) * k;
        return (
          <g key={i}>
            <circle r={rr} fill={color} opacity={0.12 * (1 - q)} />
            <circle r={rr} fill="none" stroke={color} strokeWidth={3.5 * (1 - q) + 1} opacity={0.9 * (1 - q)} />
          </g>
        );
      })}
      <circle r={core * 2.2 * k} fill={color} opacity={0.22} />
      <circle r={core * k} fill={color} stroke={C.paperLight} strokeWidth={3} />
    </g>
  );
};
