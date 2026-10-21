import React from 'react';
import {word} from './lang';
import {C, FONT_SANS, FONT_SERIF, TYPE} from './theme';
import {clamp01, countUp, ease, lerp, mixHex, ramp} from './anim';
import {Para} from './text';

// Data visualisation for EXACT statistics. Every number on screen comes from an explicit prop
// (value / label strings), so what is shown is exactly what the narration says.
// Big numbers: Fraunces 700. Labels: Inter 700 caps, tracked. Ink on paper, oxblood = the key datum.

/** Linear sub-ramp (components apply their own easing on top). */
const rl = (p: number, a: number, b: number) => ramp(p, a, b, ease.linear);

type Anchor = 'start' | 'middle' | 'end';

/** Insert thousands separators into a plain number ("12500" → "12,500"). */
export const fmtNum = (v: number) => {
  const s = String(v);
  const [i, d] = s.split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : '');
};

/** Default year formatter: negative = BCE. `ce` adds " CE" to positive years (use when the range crosses 0). */
export const fmtYear = (y: number, ce = false) => {
  const r = Math.round(y);
  if (r < 0) return `${-r >= 10000 ? fmtNum(-r) : -r} BCE`;
  const n = Math.abs(r) >= 10000 ? fmtNum(r) : String(r);
  return ce ? `${n} CE` : n;
};

/** Staggered sub-progress of item i of n inside one 0→1 progress (each item takes `span`). */
const seg = (p: number, i: number, n: number, span = 0.5) => {
  const start = n > 1 ? (i * (1 - span)) / (n - 1) : 0;
  return clamp01((p - start) / span);
};

/** Caps label (sans, tracked). Multi-line with "\n". */
const Lbl: React.FC<{x: number; y: number; text: string; size?: number; color?: string; anchor?: Anchor; o?: number; weight?: number; fit?: number}> = ({
  x,
  y,
  text,
  size: size0 = TYPE.small,
  color = C.inkMute,
  anchor = 'middle',
  o = 1,
  weight = 700,
  fit,
}) => {
  // phone-readable floor; `fit` (max width) may shrink a crowded label down to 28 px — if that's not enough, make the chart bigger
  const want = Math.max(size0, TYPE.small);
  const longest = Math.max(...text.split('\n').map((l) => l.length));
  const size = fit ? Math.max(28, Math.min(want, fit / (longest * 0.82))) : want;
  return o <= 0 ? null : (
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT_SANS} fontWeight={weight} fontSize={size} letterSpacing={size * 0.12} fill={color} opacity={o}>
      {text
        
        .split('\n')
        .map((ln, i) => (
          <tspan key={i} x={x} dy={i ? size * 1.25 : 0}>
            {ln}
          </tspan>
        ))}
    </text>
  );
};

/** Serif number with an optional smaller trailing suffix ("26%" → 26 + small %). */
const Num: React.FC<{x: number; y: number; text: string; size: number; color?: string; anchor?: Anchor; o?: number}> = ({x, y, text, size, color = C.ink, anchor = 'middle', o = 1}) => {
  if (o <= 0) return null;
  const m = text.match(/^(.*\d)(\D{1,3})$/);
  const main = m ? m[1] : text;
  const suf = m ? m[2] : '';
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT_SERIF} fontWeight={700} fontSize={size} fill={color} opacity={o} style={{fontVariantNumeric: 'tabular-nums lining-nums'}}>
      {main}
      {suf && (
        <tspan fontSize={size * 0.5} fontWeight={600} dx={size * 0.04}>
          {suf}
        </tspan>
      )}
    </text>
  );
};

/** SVG arc path on a circle (angles in degrees, 0 = 3 o'clock, clockwise). */
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p0 = [cx + r * Math.cos((a0 * Math.PI) / 180), cy + r * Math.sin((a0 * Math.PI) / 180)];
  const p1 = [cx + r * Math.cos((a1 * Math.PI) / 180), cy + r * Math.sin((a1 * Math.PI) / 180)];
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${p0[0].toFixed(2)} ${p0[1].toFixed(2)} A${r} ${r} 0 ${large} ${a1 > a0 ? 1 : 0} ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`;
};

// ───────────────────────────────────────────────────────────────── BarChart

export type Bar = {label: string; value: number; color?: string; valueLabel?: string};

/**
 * BarChart — vertical bars that grow staggered. Box (x,y)=top-left, w×h INCLUDES value labels on top
 * and category labels below (use "\n" for 2-line labels). `valueLabel` = exact string shown (counts up).
 * `highlight` = index painted oxblood, others muted.
 */
export const BarChart: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  bars: Bar[];
  p: number;
  max?: number;
  highlight?: number;
  color?: string;
  highlightColor?: string;
  grid?: boolean;
  labelSize?: number;
}> = ({x, y, w, h, bars, p, max, highlight, color = C.inkLift, highlightColor = C.oxblood, grid = true, labelSize = TYPE.small}) => {
  if (p <= 0 || !bars.length) return null;
  const n = bars.length;
  const slot = w / n;
  const lines = Math.max(...bars.map((b) => b.label.split('\n').length));
  const labelH = 22 + lines * labelSize * 1.25;
  const valueSize = Math.min(54, Math.max(30, slot * 0.34));
  const yB = y + h - labelH;
  const yT = y + valueSize * 1.35;
  const top = max ?? Math.max(...bars.map((b) => b.value));
  const barW = Math.min(slot * 0.58, 140);
  const axisK = ease.inOut(rl(p, 0, 0.25));
  return (
    <g>
      {grid &&
        [1 / 3, 2 / 3, 1].map((f) => (
          <line key={f} x1={x} x2={x + w * axisK} y1={yB - (yB - yT) * f} y2={yB - (yB - yT) * f} stroke={C.paperShade} strokeWidth={5} strokeDasharray="2 10" strokeLinecap="round" />
        ))}
      {bars.map((b, i) => {
        const bp = seg(rl(p, 0.1, 1), i, n, 0.45);
        const cx = x + slot * (i + 0.5);
        const fill = b.color ?? (highlight === undefined ? color : i === highlight ? highlightColor : C.inkFaint);
        const bh = ((yB - yT) * b.value) / (top || 1) * ease.out(bp);
        const rr = Math.min(8, barW / 4, bh);
        const bx = cx - barW / 2;
        const d = `M${bx} ${yB} V${yB - bh + rr} Q${bx} ${yB - bh} ${bx + rr} ${yB - bh} H${bx + barW - rr} Q${bx + barW} ${yB - bh} ${bx + barW} ${yB - bh + rr} V${yB}Z`;
        const vText = b.valueLabel ?? fmtNum(b.value);
        return (
          <g key={i}>
            {bh > 0.5 && <path d={d} fill={fill} />}
            <Num x={cx} y={yB - bh - 14} text={countUp(vText, ease.outQuint(bp))} size={valueSize} color={i === highlight ? highlightColor : C.ink} o={rl(bp, 0.05, 0.4)} />
            <Lbl x={cx} y={yB + 22 + labelSize} text={b.label} size={labelSize} fit={slot * 0.94} color={i === highlight ? highlightColor : C.inkMute} o={rl(bp, 0, 0.4)} />
          </g>
        );
      })}
      <line x1={x} x2={x + w * axisK} y1={yB} y2={yB} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

// ───────────────────────────────────────────────────────────────── DotGrid

/** Pixel size of a DotGrid (for layout). */
export const dotGridSize = (cols: number, rows: number, size = 26, gap = size * 0.42) => ({w: cols * size + (cols - 1) * gap, h: rows * size + (rows - 1) * gap});

/**
 * DotGrid (waffle) — "26 out of 100". Origin (x,y) = top-left; size = cols·size + gaps (see dotGridSize).
 * Empty dots appear first, then `filled` dots fill IN ORDER (row-major, or column-major with order="col").
 * `groups` = several coloured runs ([{count:26,color:C.oxblood},{count:40,color:C.theory}]) instead of filled/color.
 */
export const DotGrid: React.FC<{
  x: number;
  y: number;
  cols: number;
  rows: number;
  filled?: number;
  p: number;
  size?: number;
  gap?: number;
  color?: string;
  empty?: string;
  groups?: {count: number; color: string}[];
  shape?: 'dot' | 'square' | 'person';
  order?: 'row' | 'col';
}> = ({x, y, cols, rows, filled = 0, p, size = 26, gap, color = C.oxblood, empty = C.paperDeep, groups, shape = 'dot', order = 'row'}) => {
  if (p <= 0) return null;
  const g = gap ?? size * 0.42;
  const runs = groups ?? [{count: filled, color}];
  const total = Math.min(cols * rows, runs.reduce((s, r) => s + r.count, 0));
  const colorAt = (j: number) => {
    let acc = 0;
    for (const r of runs) {
      acc += r.count;
      if (j < acc) return r.color;
    }
    return empty;
  };
  const emptyO = ease.out(rl(p, 0, 0.18));
  const glyph = (cx: number, cy: number, sc: number, fill: string, key: string | number) => {
    if (sc <= 0) return null;
    if (shape === 'square') {
      const s = size * sc;
      return <rect key={key} x={cx - s / 2} y={cy - s / 2} width={s} height={s} rx={size * 0.16} fill={fill} />;
    }
    if (shape === 'person') {
      return (
        <g key={key} transform={`translate(${cx} ${cy}) scale(${(size / 40) * sc})`} fill={fill}>
          <circle cy={-11} r={8} />
          <path d="M-14 20 V9 C-14 1 -8 -2 0 -2 C8 -2 14 1 14 9 V20Z" />
        </g>
      );
    }
    return <circle key={key} cx={cx} cy={cy} r={(size / 2) * sc} fill={fill} />;
  };
  const cells: React.ReactNode[] = [];
  for (let j = 0; j < cols * rows; j++) {
    const col = order === 'row' ? j % cols : Math.floor(j / rows);
    const row = order === 'row' ? Math.floor(j / cols) : j % rows;
    const cx = x + col * (size + g) + size / 2;
    const cy = y + row * (size + g) + size / 2;
    const fp = j < total ? clamp01((p - (0.18 + (0.72 * j) / Math.max(1, total))) / 0.1) : 0;
    cells.push(
      <g key={j}>
        {fp < 1 && glyph(cx, cy, emptyO * (shape === 'person' ? 1 : 0.94), empty, 'e')}
        {fp > 0 && glyph(cx, cy, ease.outBack(fp), colorAt(j), 'f')}
      </g>
    );
  }
  return <g>{cells}</g>;
};

// ───────────────────────────────────────────────────────────────── PercentRing

/**
 * PercentRing — donut that fills to `value` (0–100) while `label` (exact string, e.g. "26%") counts up.
 * Origin = ring centre; outer radius r + thick/2. Optional `caption` (caps) under the ring.
 */
export const PercentRing: React.FC<{
  x: number;
  y: number;
  r?: number;
  value: number;
  label: string;
  p: number;
  color?: string;
  track?: string;
  thick?: number;
  caption?: string;
  labelSize?: number;
}> = ({x, y, r = 120, value, label, p, color = C.oxblood, track = C.paperShade, thick, caption, labelSize}) => {
  if (p <= 0) return null;
  const th = thick ?? r * 0.2;
  const k = ease.out(rl(p, 0.1, 0.9));
  const circ = 2 * Math.PI * r;
  const len = (circ * Math.max(0, Math.min(100, value)) * k) / 100;
  const full = value >= 100 && k >= 1;
  const ls = labelSize ?? r * 0.56;
  return (
    <g opacity={ease.out(rl(p, 0, 0.15))}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={track} strokeWidth={th} />
      {len > 0.5 && (
        <circle
          cx={x}
          cy={y}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={th}
          strokeLinecap={full ? 'butt' : 'round'}
          strokeDasharray={full ? undefined : `${Math.max(0.01, len - th)} ${circ}`}
          strokeDashoffset={full ? undefined : -th / 2}
          transform={`rotate(-90 ${x} ${y})`}
        />
      )}
      <Num x={x} y={y + ls * 0.34} text={countUp(label, k)} size={ls} color={C.ink} />
      {caption && <Lbl x={x} y={y + r + th / 2 + 44} text={caption} o={rl(p, 0.5, 1)} />}
    </g>
  );
};

// ───────────────────────────────────────────────────────────────── Comparison

/** One side of a Comparison. count:false shows the value as-is (years, codes) instead of counting up. */
export type Side = {title: string; value?: string; body?: string; color?: string; count?: boolean};

/**
 * Comparison — split A-vs-B panel. Box (x,y)=top-left, w×h for both panels together.
 * Each side: caps `title`, optional big exact `value` (counts up unless count:false), optional short serif `body`.
 * Left slides in from the left, right from the right, then the VS badge pops (`vs={null}` hides it).
 */
export const Comparison: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  left: Side;
  right: Side;
  p: number;
  vs?: string | null;
  gap?: number;
  valueSize?: number;
  bodySize?: number;
}> = ({x, y, w, h, left, right, p, vs = 'vs', gap = 36, valueSize, bodySize = 36}) => {
  if (vs === 'vs') vs = word('vs');
  if (p <= 0) return null;
  const pw = (w - gap) / 2;
  const vsz = valueSize ?? Math.min(110, h * 0.3);
  const panel = (s: Side, px: number, sp: number, dir: number) => {
    if (sp <= 0) return null;
    const col = s.color ?? C.ink;
    const k = ease.outQuint(sp);
    const pad = 36;
    const titleY = y + 64;
    const valueY = titleY + 14 + vsz * 0.86;
    const bodyY = s.value ? valueY + 18 : titleY + 26;
    const id = `cmp${Math.round(px)}_${Math.round(y)}_${Math.round(pw)}`;
    const vText = s.count === false ? s.value : countUp(s.value ?? '', ease.outQuint(rl(sp, 0.2, 1)));
    return (
      <g transform={`translate(${dir * (1 - k) * 60} 0)`} opacity={clamp01(sp * 2.5)}>
        <clipPath id={id}>
          <rect x={px} y={y} width={pw} height={h} rx={14} />
        </clipPath>
        <g clipPath={`url(#${id})`}>
          <rect x={px} y={y} width={pw} height={h} fill={mixHex(col, C.paperLight, 0.86)} />
          <rect x={px} y={y} width={pw} height={10} fill={col} />
        </g>
        <Lbl x={px + pad} y={titleY} text={s.title} anchor="start" color={col} />
        {s.value && <Num x={px + pad} y={valueY} text={vText ?? ''} size={vsz} color={col} anchor="start" />}
        {s.body && <Para x={px + pad} y={bodyY} w={pw - pad * 2} h={Math.max(40, y + h - bodyY)} text={s.body} size={bodySize} color={C.inkSoft} p={rl(sp, 0.3, 1)} lineHeight={1.25} />}
      </g>
    );
  };
  const vp = rl(p, 0.55, 0.85);
  const cx = x + pw + gap / 2;
  const cyv = y + h / 2;
  return (
    <g>
      {panel(left, x, rl(p, 0, 0.6), -1)}
      {panel(right, x + pw + gap, rl(p, 0.2, 0.8), 1)}
      {vs && vp > 0 && (
        <g transform={`translate(${cx} ${cyv}) scale(${ease.outBack(vp)})`}>
          <circle r={42} fill={C.ink} stroke={C.paper} strokeWidth={8} />
          <text y={11} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={34} fill={C.paperLight}>
            {vs}
          </text>
        </g>
      )}
    </g>
  );
};

// ───────────────────────────────────────────────────────────────── TimelineAxis

export type TimelineEvent = {year: number; label: string; above?: boolean; color?: string; stem?: number; yearLabel?: string};

const niceStep = (span: number, target = 6) => {
  const raw = span / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * mag;
};

/**
 * TimelineAxis — horizontal year axis with ticks, staggered event pins and an optional moving `cursor` (year).
 * Origin (x,y) = left end of the axis line; length w. Events alternate above/below unless `above` is set
 * (labels need ~110 px above/below the axis). `format` turns a year into text (default: negative → "BCE";
 * for deep time pass e.g. y => `${-y / 1e6} MYA`). `ticks` = explicit years or a step.
 */
export const TimelineAxis: React.FC<{
  x: number;
  y: number;
  w: number;
  from: number;
  to: number;
  events?: TimelineEvent[];
  p: number;
  ticks?: number[] | number;
  cursor?: number;
  format?: (year: number) => string;
  color?: string;
  cursorColor?: string;
  labelSize?: number;
  tickLabels?: boolean;
}> = ({x, y, w, from, to, events = [], p, ticks, cursor, format, color = C.ink, cursorColor = C.oxblood, labelSize = 44, tickLabels = true}) => {
  if (p <= 0) return null;
  const fmt = format ?? ((v: number) => fmtYear(v, from < 0 && to > 0));
  const xOf = (yr: number) => x + ((yr - from) / (to - from || 1)) * w;
  const axisK = ease.inOut(rl(p, 0, 0.35));
  let tv: number[];
  if (Array.isArray(ticks)) tv = ticks;
  else {
    const step = ticks ?? niceStep(to - from);
    tv = [];
    for (let v = Math.ceil(from / step) * step; v <= to + 1e-9; v += step) tv.push(Math.round(v * 1e6) / 1e6);
  }
  const sorted = events.map((e, i) => ({e, i})).sort((a, b) => a.e.year - b.e.year);
  const order = new Map(sorted.map((s, k) => [s.i, k]));
  const textW = (txt: string) => txt.length * TYPE.small * 0.82;
  const cursorX = cursor === undefined || rl(p, 0.3, 0.5) <= 0 ? null : xOf(Math.max(from, Math.min(to, cursor)));
  const cursorW = cursor === undefined ? 0 : fmt(cursor).length * 21 + 44;
  // big phone-readable tick labels: drop any tick label that would collide with the previous one
  const tickShown = new Set<number>();
  let lastR = -Infinity;
  for (const v of tv) {
    const half = textW(fmt(v)) / 2;
    if (xOf(v) - half > lastR + 18) {
      tickShown.add(v);
      lastR = xOf(v) + half;
    }
  }
  return (
    <g>
      <line x1={x} x2={x + w * axisK} y1={y} y2={y} stroke={color} strokeWidth={5} strokeLinecap="round" />
      {tv.map((v) => {
        const tx = xOf(v);
        const f = (tx - x) / w;
        if (axisK < f - 0.005) return null;
        const o = axisK >= 1 ? 1 : clamp01((axisK - f) * 12 + 0.3);
        const hidden = cursorX !== null && Math.abs(tx - cursorX) < cursorW / 2 + textW(fmt(v)) / 2 + 12;
        return (
          <g key={v} opacity={o}>
            <line x1={tx} x2={tx} y1={y - 9} y2={y + 9} stroke={color} strokeWidth={4} strokeLinecap="round" />
            {tickLabels && !hidden && tickShown.has(v) && <Lbl x={tx} y={y + 46} text={fmt(v)} />}
          </g>
        );
      })}
      {cursor !== undefined &&
        (() => {
          const cx = xOf(Math.max(from, Math.min(to, cursor)));
          const co = rl(p, 0.3, 0.5);
          if (co <= 0) return null;
          const txt = fmt(cursor);
          const pw = cursorW;
          return (
            <g opacity={co}>
              <line x1={x} x2={cx} y1={y} y2={y} stroke={cursorColor} strokeWidth={7} strokeLinecap="round" />
              <rect x={cx - pw / 2} y={y + 22} width={pw} height={50} rx={25} fill={cursorColor} />
              <text x={cx} y={y + 58} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={30} letterSpacing={2} fill={C.paperLight}>
                {txt}
              </text>
              <circle cx={cx} cy={y} r={12} fill={cursorColor} stroke={C.paperLight} strokeWidth={4} />
            </g>
          );
        })()}
      {events.map((e, i) => {
        const k = order.get(i) ?? i;
        const ep = seg(rl(p, 0.3, 1), k, events.length, 0.35);
        if (ep <= 0) return null;
        const ex = xOf(e.year);
        const up = e.above ?? k % 2 === 0;
        const col = e.color ?? color;
        const stem = (e.stem ?? 70) * ease.out(ep);
        const dir = up ? -1 : 1;
        const tipY = y + dir * stem;
        const lo = rl(ep, 0.4, 1);
        const yearY = up ? tipY - 14 - labelSize * 1.15 : tipY + 30;
        const labY = up ? tipY - 14 : tipY + 30 + labelSize * 1.15;
        return (
          <g key={i}>
            <line x1={ex} x2={ex} y1={y} y2={tipY} stroke={col} strokeWidth={4} strokeLinecap="round" />
            <circle cx={ex} cy={y} r={10 * ease.outBack(ep)} fill={col} stroke={C.paper} strokeWidth={4} />
            <Lbl x={ex} y={yearY + (1 - lo) * dir * -8} text={e.yearLabel ?? fmt(e.year)} color={col} o={lo} />
            <text x={ex} y={labY + (1 - lo) * dir * -8} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={600} fontSize={labelSize} fill={C.ink} opacity={lo}>
              {e.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// ───────────────────────────────────────────────────────────────── LineChart

/**
 * LineChart — straight-segment line that draws on left→right (with a soft flat area under it).
 * Box (x,y,w,h) = the PLOT area; y-tick labels sit left of x (~70 px), x-tick labels + xLabel below (~80 px),
 * yLabel above the top-left corner. `highlight` = point index (+ optional exact label) that pops when reached.
 */
export const LineChart: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  points: [number, number][];
  p: number;
  xLabel?: string;
  yLabel?: string;
  highlight?: number | {index: number; label?: string};
  xDomain?: [number, number];
  yDomain?: [number, number];
  xTicks?: number[];
  yTicks?: number[];
  fmtX?: (v: number) => string;
  fmtY?: (v: number) => string;
  color?: string;
  area?: boolean;
}> = ({x, y, w, h, points, p, xLabel, yLabel, highlight, xDomain, yDomain, xTicks, yTicks, fmtX = String, fmtY = fmtNum, color = C.oxblood, area = true}) => {
  if (p <= 0 || points.length < 2) return null;
  const xs = points.map((q) => q[0]);
  const ys = points.map((q) => q[1]);
  const [x0, x1] = xDomain ?? [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = yDomain ?? [Math.min(0, ...ys), Math.max(...ys)];
  const X = (v: number) => x + ((v - x0) / (x1 - x0 || 1)) * w;
  const Y = (v: number) => y + h - ((v - y0) / (y1 - y0 || 1)) * h;
  const yt = yTicks ?? [y0, (y0 + y1) / 2, y1];
  const xt = xTicks ?? [x0, x1];
  const axisK = ease.inOut(rl(p, 0, 0.2));
  const k = ease.inOut(rl(p, 0.15, 0.95));
  const edge = x + w * k;
  const id = `lc${Math.round(x)}_${Math.round(y)}_${Math.round(w)}_${Math.round(h)}`;
  const pts = points.map((q) => [X(q[0]), Y(q[1])] as [number, number]);
  const line = 'M' + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L');
  const areaD = `${line} L${pts[pts.length - 1][0]} ${y + h} L${pts[0][0]} ${y + h}Z`;
  // leading dot = line height at the reveal edge
  let lead: [number, number] | null = null;
  if (k > 0 && k < 1) {
    for (let i = 0; i < pts.length - 1; i++) {
      if (edge >= pts[i][0] && edge <= pts[i + 1][0]) {
        const f = (edge - pts[i][0]) / (pts[i + 1][0] - pts[i][0] || 1);
        lead = [edge, lerp(pts[i][1], pts[i + 1][1], f)];
      }
    }
  }
  const hi = highlight === undefined ? null : typeof highlight === 'number' ? {index: highlight} : highlight;
  const hp = hi ? clamp01((edge - pts[hi.index][0]) / 40) : 0;
  return (
    <g>
      <clipPath id={id}>
        <rect x={x - 10} y={y - 40} width={w * k + 10} height={h + 50} />
      </clipPath>
      {yt.map((v) => (
        <g key={v} opacity={axisK}>
          <line x1={x} x2={x + w} y1={Y(v)} y2={Y(v)} stroke={C.paperShade} strokeWidth={5} />
          <Lbl x={x - 18} y={Y(v) + 7} text={fmtY(v)} anchor="end" />
        </g>
      ))}
      {xt.map((v) => (
        <Lbl key={v} x={X(v)} y={y + h + 38} text={fmtX(v)} o={axisK} />
      ))}
      <g clipPath={`url(#${id})`}>
        {area && <path d={areaD} fill={color} opacity={0.14} />}
        <path d={line} fill="none" stroke={color} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
      </g>
      <path d={`M${x} ${y - 10} V${y + h} H${x + w * axisK}`} fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      {lead && <circle cx={lead[0]} cy={lead[1]} r={8} fill={color} stroke={C.paperLight} strokeWidth={5} />}
      {hi && hp > 0 && (
        <g>
          <line x1={pts[hi.index][0]} x2={pts[hi.index][0]} y1={pts[hi.index][1]} y2={y + h} stroke={color} strokeWidth={5} strokeDasharray="4 8" strokeLinecap="round" opacity={hp} />
          <circle cx={pts[hi.index][0]} cy={pts[hi.index][1]} r={12 * ease.outBack(hp)} fill={color} stroke={C.paperLight} strokeWidth={4} />
          <Num x={pts[hi.index][0]} y={pts[hi.index][1] - 28} text={hi.label ?? fmtY(points[hi.index][1])} size={40} color={color} o={hp} />
        </g>
      )}
      {yLabel && <Lbl x={x} y={y - 34} text={yLabel} anchor="start" color={C.ink} o={axisK} />}
      {xLabel && <Lbl x={x + w} y={y + h + 78} text={xLabel} anchor="end" color={C.ink} o={axisK} />}
    </g>
  );
};

// ───────────────────────────────────────────────────────────────── Meter / Gauge

/**
 * Meter — horizontal certainty bar. Origin (x,y) = left end of the track's centre line; length w.
 * Fills to `value` (0–1), a marker + optional `valueLabel` sits above it; `labels` [left, right] below the ends;
 * optional `title` above-left. `zones` tints the track in equal bands (e.g. [C.theoryTint, C.cautionTint, C.evidenceTint]).
 */
export const Meter: React.FC<{
  x: number;
  y: number;
  w: number;
  value: number;
  labels: [string, string];
  p: number;
  color?: string;
  title?: string;
  valueLabel?: string;
  zones?: string[];
  thick?: number;
}> = ({x, y, w, value, labels, p, color = C.oxblood, title, valueLabel, zones, thick = 22}) => {
  if (p <= 0) return null;
  const o = ease.out(rl(p, 0, 0.2));
  const k = ease.inOut(rl(p, 0.15, 0.85));
  const vx = x + w * clamp01(value) * k;
  const id = `mt${Math.round(x)}_${Math.round(y)}_${Math.round(w)}`;
  return (
    <g opacity={o}>
      <clipPath id={id}>
        <rect x={x} y={y - thick / 2} width={w} height={thick} rx={thick / 2} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        {zones && zones.length ? (
          zones.map((z, i) => <rect key={i} x={x + (w * i) / zones.length} y={y - thick / 2} width={w / zones.length + 1} height={thick} fill={z} />)
        ) : (
          <rect x={x} y={y - thick / 2} width={w} height={thick} fill={C.paperShade} />
        )}
        <rect x={x} y={y - thick / 2} width={vx - x} height={thick} fill={color} />
      </g>
      {zones &&
        zones.slice(1).map((_, i) => (
          <line key={i} x1={x + (w * (i + 1)) / zones.length} x2={x + (w * (i + 1)) / zones.length} y1={y - thick / 2} y2={y + thick / 2} stroke={C.paper} strokeWidth={5} />
        ))}
      <g opacity={rl(p, 0.15, 0.3)}>
        <path d={`M${vx} ${y - thick / 2 - 4} l-11 -16 h22Z`} fill={C.ink} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
        {valueLabel && <Lbl x={vx} y={y - thick / 2 - 34} text={valueLabel} color={C.ink} o={rl(p, 0.75, 1)} />}
      </g>
      {title && <Lbl x={x} y={y - thick / 2 - 84} text={title} anchor="start" color={C.inkMute} />}
      <Lbl x={x} y={y + thick / 2 + 40} text={labels[0]} anchor="start" fit={w * 0.46} />
      <Lbl x={x + w} y={y + thick / 2 + 40} text={labels[1]} anchor="end" fit={w * 0.46} />
    </g>
  );
};

/**
 * Gauge — semicircular certainty dial with a needle. Origin = needle pivot (centre of the flat side);
 * spans x±(r+thick/2), y−r−thick/2 … y+70 (labels). `value` 0–1, `labels` [left,right] under the ends,
 * `valueLabel` (exact text) under the pivot. `zones` = coloured bands along the arc.
 */
export const Gauge: React.FC<{
  x: number;
  y: number;
  r?: number;
  value: number;
  labels: [string, string];
  p: number;
  color?: string;
  valueLabel?: string;
  zones?: string[];
  thick?: number;
}> = ({x, y, r = 150, value, labels, p, color = C.oxblood, valueLabel, zones, thick}) => {
  if (p <= 0) return null;
  const th = thick ?? r * 0.17;
  const o = ease.out(rl(p, 0, 0.2));
  const k = ease.outBack(rl(p, 0.2, 0.9));
  const v = clamp01(value);
  const ang = 180 + 180 * v * k;
  const fillEnd = 180 + 180 * v * Math.min(1, k);
  const nl = r - th * 0.2;
  return (
    <g opacity={o}>
      {zones && zones.length ? (
        zones.map((z, i) => <path key={i} d={arc(x, y, r, 180 + (180 * i) / zones.length + (i ? 1 : 0), 180 + (180 * (i + 1)) / zones.length - (i < zones.length - 1 ? 1 : 0))} stroke={z} strokeWidth={th} fill="none" />)
      ) : (
        <path d={arc(x, y, r, 180, 360)} stroke={C.paperShade} strokeWidth={th} fill="none" />
      )}
      {v * k > 0.002 && <path d={arc(x, y, r, 180, Math.max(180.5, fillEnd))} stroke={color} strokeWidth={th * 0.42} fill="none" strokeLinecap="round" />}
      {Array.from({length: 11}, (_, i) => {
        const a = ((180 + i * 18) * Math.PI) / 180;
        const r0 = r - th / 2 - 10;
        const r1 = r0 - (i % 5 === 0 ? 18 : 10);
        return <line key={i} x1={x + Math.cos(a) * r0} y1={y + Math.sin(a) * r0} x2={x + Math.cos(a) * r1} y2={y + Math.sin(a) * r1} stroke={C.inkFaint} strokeWidth={5} strokeLinecap="round" />;
      })}
      <g transform={`translate(${x} ${y}) rotate(${ang})`}>
        <path d={`M0 -7 L${nl} 0 L0 7Z`} fill={C.ink} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      </g>
      <circle cx={x} cy={y} r={14} fill={C.ink} />
      <circle cx={x} cy={y} r={5} fill={color} />
      <Lbl x={x - r} y={y + 44} text={labels[0]} fit={r * 0.6} />
      <Lbl x={x + r} y={y + 44} text={labels[1]} fit={r * 0.6} />
      {valueLabel && <Lbl x={x} y={y + 46} text={valueLabel} color={color} o={rl(p, 0.7, 1)} fit={r * 0.75} />}
    </g>
  );
};

// ───────────────────────────────────────────────────────────────── BalanceScale

/**
 * BalanceScale — "weighing two theories". Origin (x,y) = beam pivot; at s=1 the beam is 460 px wide and the
 * stand reaches y+330. `tilt` −1…1 (animate it yourself; +1 = right pan down). `leftItems`/`rightItems`:
 * a number (stack of weight blocks) or any SVG node drawn with origin = centre of the pan's rim.
 * Labels hang under the pans and stay true-size (labelSize) at any `s`.
 */
export const BalanceScale: React.FC<{
  x: number;
  y: number;
  tilt: number;
  leftLabel?: string;
  rightLabel?: string;
  leftItems?: number | React.ReactNode;
  rightItems?: number | React.ReactNode;
  leftColor?: string;
  rightColor?: string;
  color?: string;
  s?: number;
  p?: number;
  labelSize?: number;
}> = ({x, y, tilt, leftLabel, rightLabel, leftItems, rightItems, leftColor = C.theory, rightColor = C.evidence, color = C.ink, s = 1, p = 1, labelSize = TYPE.small}) => {
  if (p <= 0) return null;
  const L = 230;
  const th = (Math.max(-1, Math.min(1, tilt)) * 14 * Math.PI) / 180;
  const ends: [number, number][] = [
    [-L * Math.cos(th), -L * Math.sin(th)],
    [L * Math.cos(th), L * Math.sin(th)],
  ];
  const HANG = 150;
  const blocks = (n: number, col: string) => {
    const out: React.ReactNode[] = [];
    let row = 0;
    let left = n;
    while (left > 0) {
      const inRow = Math.min(3 - Math.min(row, 2), left) || 1;
      for (let i = 0; i < inRow; i++) {
        const bx = (i - (inRow - 1) / 2) * 44;
        out.push(<rect key={`${row}-${i}`} x={bx - 20} y={-30 - row * 30} width={40} height={27} rx={5} fill={col} />);
      }
      left -= inRow;
      row++;
    }
    return out;
  };
  const pan = (side: 0 | 1, items: number | React.ReactNode | undefined, col: string) => {
    const [ex, ey] = ends[side];
    const py = ey + HANG;
    return (
      <g>
        <path d={`M${ex} ${ey} L${ex - 78} ${py} M${ex} ${ey} L${ex + 78} ${py}`} stroke={color} strokeWidth={4} strokeLinecap="round" />
        <g transform={`translate(${ex} ${py})`}>
          {typeof items === 'number' ? blocks(items, col) : items}
          <path d="M-92 0 H92 C84 30 50 42 0 42 C-50 42 -84 30 -92 0Z" fill={color} />
        </g>
        <circle cx={ex} cy={ey} r={8} fill={color} />
      </g>
    );
  };
  // labels are drawn outside the scaled group so they stay readable at any s
  const label = (side: 0 | 1, text: string | undefined, col: string) =>
    text ? <Lbl x={x + ends[side][0] * s} y={y + (ends[side][1] + HANG + 42) * s + 34} text={text} size={labelSize} color={col} /> : null;
  return (
    <g opacity={ease.out(clamp01(p))}>
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-8} y={0} width={16} height={312} rx={4} fill={color} />
      <path d="M-90 330 L-70 306 H70 L90 330Z" fill={color} stroke={color} strokeWidth={6} strokeLinejoin="round" />
      {pan(0, leftItems, leftColor)}
      {pan(1, rightItems, rightColor)}
      <path d={`M${ends[0][0]} ${ends[0][1]} L${ends[1][0]} ${ends[1][1]}`} stroke={color} strokeWidth={12} strokeLinecap="round" />
      <path d="M0 -40 L-16 -6 H16Z" fill={color} stroke={color} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={0} cy={0} r={13} fill={C.oxblood} stroke={color} strokeWidth={5} />
    </g>
    {label(0, leftLabel, leftColor)}
    {label(1, rightLabel, rightColor)}
    </g>
  );
};

// ───────────────────────────────────────────────────────────────── CounterRow

/**
 * CounterRow — a row of exact figures that count up in turn, separated by thin rules.
 * Origin (x,y) = left end of the row, at the numbers' baseline; total width w. Labels (caps) sit below.
 */
export const CounterRow: React.FC<{
  x: number;
  y: number;
  w: number;
  items: {value: string; label: string; color?: string; count?: boolean}[];
  p: number;
  size?: number;
}> = ({x, y, w, items, p, size = 88}) => {
  if (p <= 0 || !items.length) return null;
  const slot = w / items.length;
  return (
    <g>
      {items.map((it, i) => {
        const ip = seg(p, i, items.length, 0.55);
        const cx = x + slot * (i + 0.5);
        return (
          <g key={i} opacity={ease.out(clamp01(ip * 3))}>
            {i > 0 && <line x1={x + slot * i} x2={x + slot * i} y1={y - size * 0.75} y2={y + 44} stroke={C.paperDeep} strokeWidth={5} />}
            <Num x={cx} y={y} text={it.count === false ? it.value : countUp(it.value, ease.outQuint(ip))} size={size} color={it.color ?? C.ink} />
            <Lbl x={cx} y={y + 42} text={it.label} o={rl(ip, 0.3, 1)} />
          </g>
        );
      })}
    </g>
  );
};
