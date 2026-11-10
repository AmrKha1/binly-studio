// NIGHT STORY TOOLS — the small storytelling devices of the AZTIKA look (references/universe-claude, GAP-CHECK P2):
// IconList (5:26) · StrikeSwap («بيت ✖ → شركة ✔» 5:36) · Lineup (circles with ✖ «عالم / مستكشف / بطل» 2:12, 12:39) ·
// Callout (leader line + pill, 1:30) · Measure (dimension line «170 كم» 7:20, «76 سم» 1:30) · DashedFrame («المخطط /
// المبني» 7:43) · ProgressBar («نسبة الإنجاز 89 %» 0:57) · Spotlight (1:07, 1:19) · StoryCrowd (1:19) · StoryTable (3:05) ·
// Newspapers (slap in one by one, 1:16) · PaperStorm (the flying grey papers behind them) · QuoteCard (Quran / hadith /
// historical quote — from the second reference) · ChapterTitle (running chapter pill — from the second reference).
// Screen coordinates — use inside <NightScreen>. Sound: Newspapers slap = soft swish; the rest silent.
import React from 'react';
import {clamp01, ease, lerp, popIn, rand} from './anim';
import {H, W} from './theme';
import {uid} from './stage';
import {GlowText, nightFont, NPill, PillKind, textWidth} from './night';
import {Mark} from './night-fx';
import {StoryPerson} from './night-worlds';
import {isAr} from './lang';
import {cueSfx} from './sfx';

const WEIGHT = () => (isAr() ? 800 : 900);
const OUT = '#14101C';
const txt = (s: string, x: number, y: number, size: number, fill: string, anchor: 'start' | 'middle' | 'end' = 'middle', weight?: number) => (
  <text x={x} y={y} fontSize={size} fontFamily={nightFont()} fontWeight={weight ?? WEIGHT()} textAnchor={anchor} dominantBaseline="central" fill={fill}>
    {s}
  </text>
);

export type ListRow = {text: string; at: number; icon?: React.ReactNode; color?: string};
/**
 * IconList — long white rows with a coloured icon disc at the end (5:26 «168 موقف سيارة · 3 مهابط هليكوبتر · غرفة ثلج»).
 * Arabic: text right-aligned, disc on the left end. x = row centre, rows go down from y by gap. Each row slides in.
 * icon = any SVG node drawn at 0,0 inside the disc (~40 px), default a gold dot.
 */
export const IconList: React.FC<{t: number; rows: ListRow[]; x: number; y: number; w?: number; size?: number; gap?: number; id: string; out?: number}> = ({
  t, rows, x, y, w = 700, size = 44, gap = 100, id, out,
}) => {
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const rtl = isAr();
  const h = size * 1.7, d = h * 0.78;
  return (
    <g opacity={fade}>
      {rows.map((r, i) => {
        const p = clamp01((t - r.at) / 0.3);
        if (p <= 0) return null;
        const e = ease.out(p);
        const ry = y + i * gap;
        const dx = (1 - e) * (rtl ? 160 : -160);
        const discX = rtl ? -w / 2 + h / 2 : w / 2 - h / 2;
        return (
          <g key={i} transform={`translate(${x + dx} ${ry})`} opacity={e}>
            <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={h / 2} fill="#000000" opacity={0.3} />
            <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill="#FFFFFF" stroke="#D8D8E0" strokeWidth={2} />
            <circle cx={discX} cy={0} r={d / 2} fill={r.color ?? '#FFC928'} stroke={OUT} strokeWidth={4} />
            <g transform={`translate(${discX} 0)`}>{r.icon ?? <circle r={d * 0.16} fill={OUT} />}</g>
            {txt(r.text, rtl ? w / 2 - size * 0.8 : -w / 2 + size * 0.8, size * 0.04, size, '#14141F', rtl ? 'end' : 'start')}
          </g>
        );
      })}
    </g>
  );
};

/**
 * StrikeSwap — the wrong word gets struck out and the right one slides in under it (5:36 «بيت ✖» → «شركة ✔»): a white
 * pill with ✖ and a red line drawn across at `strikeAt`, then a big green pill with ✔ at `swapAt`.
 */
export const StrikeSwap: React.FC<{t: number; at: number; strikeAt: number; swapAt: number; from: string; to: string; x: number; y: number; size?: number; id: string; out?: number}> = ({
  t, at, strikeAt, swapAt, from, to, x, y, size = 60, id, out,
}) => {
  if (t < at) return null;
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const rtl = isAr();
  const w1 = textWidth(from, size) + size * 3, h1 = size * 1.6;
  const w2 = textWidth(to, size * 1.25) + size * 3.4, h2 = size * 2;
  const q1 = popIn(clamp01((t - at) / 0.25), 0.45, 0.3);
  const s = ease.out(clamp01((t - strikeAt) / 0.3));
  const p2 = clamp01((t - swapAt) / 0.3);
  const q2 = popIn(p2, 0.45, 0.3);
  const mside = rtl ? -1 : 1; // the mark sits at the start of reading on the far side
  return (
    <g opacity={fade}>
      <g transform={`translate(${x} ${y}) scale(${q1.sx} ${q1.sy}) rotate(${-2 * s})`} opacity={q1.o * (1 - 0.25 * s)}>
        <rect x={-w1 / 2} y={-h1 / 2} width={w1} height={h1} rx={h1 * 0.2} fill="#FFFFFF" stroke={OUT} strokeWidth={5} />
        {txt(from, size * 0.5 * -mside, size * 0.04, size, '#14141F')}
        {s > 0 && (() => {
          const tx = size * 0.5 * -mside, half = textWidth(from, size) / 2 + size * 0.2;
          const a = rtl ? tx + half : tx - half, b = rtl ? tx - half : tx + half; // strike in reading direction
          return <line x1={a} x2={lerp(a, b, s)} y1={size * 0.05} y2={size * 0.05} stroke="#E23A4E" strokeWidth={size * 0.12} strokeLinecap="round" />;
        })()}
        {s > 0 && <Mark kind="cross" x={mside * (w1 / 2 - size * 0.75)} y={0} r={size * 0.42} />}
      </g>
      {p2 > 0 && (
        <g transform={`translate(${x} ${y + h1 / 2 + h2 / 2 + size * 0.5}) scale(${q2.sx} ${q2.sy})`} opacity={q2.o}>
          <rect x={-w2 / 2} y={-h2 / 2} width={w2} height={h2} rx={h2 * 0.2} fill="#22C55E" stroke="#0E4F2A" strokeWidth={5} />
          {txt(to, size * 0.55 * -mside, size * 0.05, size * 1.25, '#FFFFFF')}
          <Mark kind="check" x={mside * (w2 / 2 - size * 0.85)} y={0} r={size * 0.48} />
        </g>
      )}
    </g>
  );
};

export type LineupItem = {label: string; at: number; node?: React.ReactNode; mark?: 'cross' | 'check'; markAt?: number; kind?: PillKind};
/**
 * Lineup — a row of round frames, each holding a small figure/icon with a label pill under it; ✖/✔ slams onto the
 * top corner at markAt (2:12 «مو عالم ✖ · مو مستكشف ✖ · مو بطل ✖», 12:39 «مو كيلو · مو صندوق · مو شاحنة»).
 * Arabic order: first item on the right. node = SVG drawn at 0,0 (≈ r px), e.g. <StoryPerson s={0.3}…/> or an Icon.
 */
export const Lineup: React.FC<{t: number; items: LineupItem[]; x: number; y: number; r?: number; gap?: number; id: string; out?: number}> = ({
  t, items, x, y, r = 140, gap = 110, id, out,
}) => {
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const rtl = isAr();
  const step = r * 2 + gap, total = step * (items.length - 1);
  const g = uid('nline', id);
  return (
    <g opacity={fade}>
      <defs>
        {items.map((_, i) => (
          <clipPath key={i} id={`${g}-${i}`}>
            <circle r={r - 6} />
          </clipPath>
        ))}
      </defs>
      {items.map((it, i) => {
        const p = clamp01((t - it.at) / 0.3);
        if (p <= 0) return null;
        const q = popIn(p, 0.45, 0.3);
        const cx = x + (rtl ? total / 2 - i * step : -total / 2 + i * step);
        const mk = it.mark && t >= (it.markAt ?? it.at + 0.5) ? popIn(clamp01((t - (it.markAt ?? it.at + 0.5)) / 0.2), 0.5, 0.6) : null;
        const crossed = it.mark === 'cross' && mk;
        return (
          <g key={i}>
            <g transform={`translate(${cx} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
              <circle r={r} fill="#1E1840" stroke="#3A3166" strokeWidth={6} />
              <circle r={r} fill="none" stroke={crossed ? '#E23A4E' : '#7B6BD6'} strokeWidth={3} opacity={0.6} />
              <g clipPath={`url(#${g}-${i})`} opacity={crossed ? 0.55 : 1}>{it.node}</g>
              {mk && (
                <g transform={`translate(${r * 0.72} ${-r * 0.72}) scale(${mk.sx} ${mk.sy})`}>
                  <Mark kind={it.mark!} x={0} y={0} r={r * 0.24} />
                </g>
              )}
            </g>
            <NPill text={it.label} x={cx} y={y + r + 50} size={42} kind={it.kind ?? 'white'} id={`${id}-${i}`} p={(t - it.at - 0.15) / 0.25} />
          </g>
        );
      })}
    </g>
  );
};

/** Callout — a dot on the thing, a line drawn out to a pill label (1:30 «طبقات زيت ملون», «لوح خشب»). */
export const Callout: React.FC<{t: number; at: number; x: number; y: number; lx: number; ly: number; text: string; kind?: PillKind; size?: number; id: string; out?: number}> = ({
  t, at, x, y, lx, ly, text, kind = 'white', size = 40, id, out,
}) => {
  if (t < at) return null;
  cueSfx('whoosh', `callout-${id}-${at}`, t >= at && t < at + 0.3, lx, {gain: 0.6, at, hit: 0.03}); // SOUND MAP: labels slide in
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const u = ease.out(clamp01((t - at) / 0.3));
  const pw = textWidth(text, size) + size * 1.5;
  const ex = lx + (lx > x ? -pw / 2 : pw / 2); // the line ends at the pill's near edge
  return (
    <g opacity={fade}>
      <line x1={x} y1={y} x2={lerp(x, ex, u)} y2={lerp(y, ly, u)} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
      <circle cx={x} cy={y} r={9} fill="#FFFFFF" stroke={OUT} strokeWidth={3} />
      <NPill text={text} x={lx} y={ly} size={size} kind={kind} id={id} p={(t - at - 0.25) / 0.25} />
    </g>
  );
};

/**
 * Measure — a dimension line between two points with end ticks and a pill on it (7:20 «170 كم» along the wall, 1:30
 * «76 سم» beside the painting). Draws from (x1, y1) to (x2, y2); the pill sits at the middle, pushed `off` px sideways.
 */
export const Measure: React.FC<{t: number; at: number; x1: number; y1: number; x2: number; y2: number; label: string; kind?: PillKind; size?: number; off?: number; color?: string; id: string; out?: number}> = ({
  t, at, x1, y1, x2, y2, label, kind = 'gold', size = 50, off = 0, color = '#FFFFFF', id, out,
}) => {
  if (t < at) return null;
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const u = ease.inOut(clamp01((t - at) / 0.5));
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / len, ny = (x2 - x1) / len; // normal
  const tk = 22;
  const mx = (x1 + x2) / 2 + nx * off, my = (y1 + y2) / 2 + ny * off;
  const tick = (x: number, y: number, k: number) => <line x1={x - nx * tk} y1={y - ny * tk} x2={x + nx * tk} y2={y + ny * tk} stroke={color} strokeWidth={4} strokeLinecap="round" opacity={k} />;
  return (
    <g opacity={fade}>
      <line x1={lerp(mx - nx * off, x1, u)} y1={lerp(my - ny * off, y1, u)} x2={lerp(mx - nx * off, x2, u)} y2={lerp(my - ny * off, y2, u)} stroke={color} strokeWidth={4} strokeLinecap="round" />
      {tick(x1, y1, u)}
      {tick(x2, y2, u)}
      <NPill text={label} x={mx} y={my} size={size} kind={kind} id={id} p={(t - at - 0.3) / 0.25} />
    </g>
  );
};

/** DashedFrame — a dashed outline around a region with a pill on its top edge (7:43 «المخطط» cyan vs «المبني» white). */
export const DashedFrame: React.FC<{t: number; at: number; x: number; y: number; w: number; h: number; label?: string; kind?: PillKind; color?: string; id: string; out?: number}> = ({
  t, at, x, y, w, h, label, kind = 'cyan', color = '#57D9FA', id, out,
}) => {
  if (t < at) return null;
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const u = ease.out(clamp01((t - at) / 0.5));
  const per = 2 * (w + h);
  return (
    <g opacity={fade}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill={color} opacity={0.06 * u} />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="none" stroke={color} strokeWidth={4} strokeDasharray="14 10" strokeDashoffset={-t * 20} opacity={u} pathLength={per} />
      {label && <NPill text={label} x={x} y={y - h / 2} size={42} kind={kind} id={id} p={(t - at - 0.2) / 0.25} />}
    </g>
  );
};

/**
 * ProgressBar — «نسبة الإنجاز» (0:57): label pill, a dark rounded track with a striped green fill that runs from `from`
 * to `to` (0..100) over dur, and the big % in GlowText under it.
 */
export const ProgressBar: React.FC<{t: number; at: number; x: number; y: number; w?: number; from?: number; to: number; dur?: number; label?: string; id: string; out?: number}> = ({
  t, at, x, y, w = 480, from = 0, to, dur = 1.5, label, id, out,
}) => {
  if (t < at) return null;
  cueSfx('tick', `pb-${id}-${at}`, t >= at && t < at + 0.2, x, {at}); // SOUND MAP: the % starts ticking
  cueSfx('ding', `pbend-${id}-${at}`, t >= at + dur && t < at + dur + 0.2, x, {at: at + dur});
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const v = lerp(from, to, ease.out(clamp01((t - at) / dur)));
  const h = 44, g = uid('nprog', id);
  const fw = Math.max(h - 10, (w - 10) * (v / 100));
  return (
    <g opacity={fade}>
      <defs>
        <pattern id={g} width={24} height={24} patternUnits="userSpaceOnUse" patternTransform={`rotate(45) translate(${t * 30} 0)`}>
          <rect width={24} height={24} fill="#22C55E" />
          <rect width={10} height={24} fill="#4BEA92" />
        </pattern>
      </defs>
      {label && <NPill text={label} x={x} y={y - 74} size={42} kind="white" id={id + '__l'} />}
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill="#14101F" stroke={OUT} strokeWidth={5} />
      <rect x={x - w / 2 + 5} y={y - h / 2 + 5} width={fw} height={h - 10} rx={(h - 10) / 2} fill={`url(#${g})`} />
      <GlowText text={`${Math.round(v)}%`} x={x} y={y + 90} size={100} tone="white" id={id + '__v'} />
    </g>
  );
};

/** Spotlight — a soft cone of light from above onto (x, y) with a bright pool on the floor (1:07 the Louvre, 1:19). */
export const Spotlight: React.FC<{x: number; y: number; top?: number; w?: number; color?: string; id: string; o?: number}> = ({x, y, top = -40, w = 520, color = '#FFF1C4', id, o = 1}) => {
  const g = uid('nspot', id);
  return (
    <g opacity={o}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.55" />
          <stop offset="1" stopColor={color} stopOpacity="0.08" />
        </linearGradient>
        <filter id={g + '__b'} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={18} />
        </filter>
      </defs>
      <path d={`M${x - w * 0.12} ${top} L${x + w * 0.12} ${top} L${x + w / 2} ${y} L${x - w / 2} ${y} Z`} fill={`url(#${g})`} filter={`url(#${g}__b)`} />
      <ellipse cx={x} cy={y} rx={w * 0.55} ry={w * 0.09} fill={color} opacity={0.35} filter={`url(#${g}__b)`} />
    </g>
  );
};

/** StoryCrowd — rows of faceless story people seen from behind/below, cut by the frame bottom (1:19 everyone staring). */
export const StoryCrowd: React.FC<{t: number; x0?: number; x1?: number; y?: number; n?: number; rows?: number; s?: number; seed?: number; id: string; cheer?: boolean}> = ({
  t, x0 = 40, x1 = W - 40, y = H + 120, n = 14, rows = 2, s = 0.55, seed = 2, id, cheer,
}) => {
  const cols = ['#E23A4E', '#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#14B8A6', '#EC4899', '#EAB308'];
  const out: React.ReactNode[] = [];
  for (let r = rows - 1; r >= 0; r--) {
    for (let i = 0; i < n; i++) {
      const k = r * 31 + i + seed * 7;
      const x = lerp(x0, x1, (i + (r % 2) * 0.5) / (n - 0.5)) + (rand(k) - 0.5) * 30;
      const hop = cheer ? Math.max(0, Math.sin(t * 6 + i * 1.3)) * 18 : 0;
      out.push(<StoryPerson key={`${r}-${i}`} x={x} y={y - r * 70 - hop} s={s * (1 - r * 0.12)} body={cols[Math.floor(rand(k + 3) * cols.length)]} pose={cheer && i % 3 === 0 ? 'up' : 'idle'} t={t + i} id={`${id}-${r}-${i}`} />);
    }
  }
  return <g>{out}</g>;
};

/** StoryTable — a wooden table for deals and meetings (3:05 the Louisiana deal): top + legs, optional thing on it. */
export const StoryTable: React.FC<{x: number; y: number; w?: number; children?: React.ReactNode}> = ({x, y, w = 420, children}) => (
  <g>
    <g stroke={OUT} strokeWidth={6} strokeLinejoin="round">
      <rect x={x - w / 2 + 30} y={y} width={18} height={130} fill="#5A3A22" />
      <rect x={x + w / 2 - 48} y={y} width={18} height={130} fill="#5A3A22" />
      <rect x={x - w / 2} y={y - 26} width={w} height={30} rx={6} fill="#8A5A34" />
    </g>
    <rect x={x - w / 2 + 8} y={y - 22} width={w - 16} height={6} rx={3} fill="#B07A4A" />
    {children}
  </g>
);

export type Paper = {headline: string; sub?: string; masthead?: string; node?: React.ReactNode; at: number};
/**
 * Newspapers — front pages slap in one after another, each a bit to the side and tilted (1:16 «سرقة القرن!» → «أين
 * اللوحة؟» → «رجعت الموناليزا!»): cream paper, small masthead, red headline, a sub line, a picture box (node or "؟").
 */
export const Newspapers: React.FC<{t: number; papers: Paper[]; x: number; y: number; dx?: number; w?: number; id: string; out?: number}> = ({
  t, papers, x, y, dx, w = 460, id, out,
}) => {
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const rtl = isAr();
  const step = dx ?? (rtl ? -w * 0.62 : w * 0.62);
  const h = w * 1.25;
  return (
    <g opacity={fade}>
      {papers.map((pp, i) => {
        cueSfx('swish', `${id}-paper-${i}`, t >= pp.at && t < pp.at + 0.25, x + i * step, {at: pp.at, hit: 0.05});
        const u = clamp01((t - pp.at) / 0.22);
        if (u <= 0) return null;
        const sc = lerp(1.8, 1, ease.out(u));
        const rot = lerp(-25, (rand(i * 7 + 1) - 0.5) * 12, ease.out(u));
        const px = x + (i - (papers.length - 1) / 2) * step, py = y + (rand(i * 3) - 0.5) * 40;
        return (
          <g key={i} transform={`translate(${px} ${py}) rotate(${rot}) scale(${sc})`} opacity={u}>
            <rect x={-w / 2 + 10} y={-h / 2 + 14} width={w} height={h} fill="#000000" opacity={0.35} />
            <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#F3EEDF" stroke="#C9C0A6" strokeWidth={3} />
            {txt(pp.masthead ?? (rtl ? 'الجريدة اليومية' : 'THE DAILY NEWS'), 0, -h / 2 + 30, 24, '#2A2A3E', 'middle', 700)}
            <line x1={-w / 2 + 20} x2={w / 2 - 20} y1={-h / 2 + 52} y2={-h / 2 + 52} stroke="#2A2A3E" strokeWidth={3} />
            {txt(pp.headline, 0, -h / 2 + 98, Math.min(52, (w - 40) / Math.max(1, textWidth(pp.headline, 52) / 52)), '#D21F3C')}
            {pp.sub && txt(pp.sub, 0, -h / 2 + 154, 34, '#3A3A4A', 'middle', 700)}
            <rect x={-w * 0.3} y={-h / 2 + 185} width={w * 0.6} height={h * 0.42} fill="#E3DCC8" stroke="#2A2A3E" strokeWidth={3} />
            <g transform={`translate(0 ${-h / 2 + 185 + h * 0.21})`}>{pp.node ?? txt(rtl ? '؟' : '?', 0, 0, 90, '#2A2A3E')}</g>
            {[0, 1, 2].map((k) => (
              <rect key={k} x={-w / 2 + 24} y={h / 2 - 70 + k * 18} width={w - 48 - (k === 2 ? w * 0.3 : 0)} height={7} rx={3} fill="#B9B29C" />
            ))}
          </g>
        );
      })}
    </g>
  );
};

/** PaperStorm — dark grey sheets tumbling slowly behind the newspapers (1:16 background). */
export const PaperStorm: React.FC<{t: number; n?: number; seed?: number; color?: string}> = ({t, n = 16, seed = 1, color = '#4A4560'}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const k = seed * 13 + i;
      const x = ((rand(k) * W + t * (20 + rand(k + 1) * 40)) % (W + 200)) - 100;
      const y = ((rand(k + 2) * H + t * (10 + rand(k + 3) * 30)) % (H + 200)) - 100;
      const s = 50 + rand(k + 4) * 80;
      return <rect key={i} x={x - s / 2} y={y - s * 0.65} width={s} height={s * 1.3} rx={4} fill={color} opacity={0.35 + rand(k + 5) * 0.3} transform={`rotate(${rand(k + 6) * 360 + t * (rand(k + 7) - 0.5) * 40} ${x} ${y})`} />;
    })}
  </g>
);

/**
 * QuoteCard — a respectful framed card for Quran verses, hadith and historical quotes (from the second reference):
 * cream paper, double gold border with corner ornaments, centred dark lines, a gold source pill under it. It fades and
 * rises gently — no bounce, no glow pulse (sacred text is never "popped"). lines = the exact words, one per line.
 */
export const QuoteCard: React.FC<{t: number; at: number; x: number; y: number; lines: string[]; source?: string; w?: number; size?: number; id: string; out?: number}> = ({
  t, at, x, y, lines, source, w = 1300, size = 70, id, out,
}) => {
  if (t < at) return null;
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.3) : 1;
  if (fade <= 0) return null;
  const p = ease.out(clamp01((t - at) / 0.5));
  const lh = size * 1.55, h = lines.length * lh + size * 2.2;
  const g = uid('nquote', id);
  const corner = (cx: number, cy: number, sx: number, sy: number) => (
    <path d={`M${cx} ${cy + sy * 46} V${cy} H${cx + sx * 46} M${cx + sx * 14} ${cy + sy * 14} m${-sx * 4} 0 a4 4 0 1 0 ${sx * 8} 0 a4 4 0 1 0 ${-sx * 8} 0`} fill="none" stroke="#B8860B" strokeWidth={4} />
  );
  return (
    <g transform={`translate(${x} ${y + (1 - p) * 30})`} opacity={p * fade}>
      <defs>
        <filter id={g} x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur stdDeviation={30} />
        </filter>
        <linearGradient id={g + '__f'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBF6E6" />
          <stop offset="1" stopColor="#EFE4C6" />
        </linearGradient>
      </defs>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={20} fill="#FFC928" opacity={0.25} filter={`url(#${g})`} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={20} fill={`url(#${g}__f)`} stroke="#C9A24A" strokeWidth={8} />
      <rect x={-w / 2 + 18} y={-h / 2 + 18} width={w - 36} height={h - 36} rx={12} fill="none" stroke="#C9A24A" strokeWidth={2.5} />
      {corner(-w / 2 + 34, -h / 2 + 34, 1, 1)}
      {corner(w / 2 - 34, -h / 2 + 34, -1, 1)}
      {corner(-w / 2 + 34, h / 2 - 34, 1, -1)}
      {corner(w / 2 - 34, h / 2 - 34, -1, -1)}
      {lines.map((l, i) => (
        <g key={i}>{txt(l, 0, (i - (lines.length - 1) / 2) * lh, size, '#2A1E0A')}</g>
      ))}
      {source && <NPill text={source} x={0} y={h / 2} size={42} kind="gold" id={id + '__s'} p={(t - at - 0.5) / 0.3} />}
    </g>
  );
};

/**
 * ChapterTitle — a quiet running title pill at the top (from the second reference, our style): dark glass capsule with a
 * thin gold border, a gold number disc and the chapter name. chapters = [{at, text, n?}] — it slides/fades to the new
 * one at each `at`. Use it in list videos ("6 empires", "7 secrets"); not on hook / mini-story shots (pass hide).
 */
export const ChapterTitle: React.FC<{t: number; chapters: {at: number; text: string; n?: number}[]; x?: number; y?: number; size?: number; hide?: boolean; id: string}> = ({
  t, chapters, x = W / 2, y = 70, size = 40, hide,
}) => {
  let i = -1;
  for (let k = 0; k < chapters.length; k++) if (t >= chapters[k].at) i = k;
  if (i < 0 || hide) return null;
  const c = chapters[i];
  const u = ease.out(clamp01((t - c.at) / 0.35));
  const rtl = isAr();
  const tw = textWidth(c.text, size);
  const d = size * 1.25, h = size * 1.7, w = tw + size * 1.6 + (c.n !== undefined ? d + 12 : 0);
  const discX = rtl ? w / 2 - h / 2 : -w / 2 + h / 2;
  const tx = c.n !== undefined ? (rtl ? -(d + 12) / 2 : (d + 12) / 2) : 0;
  return (
    <g transform={`translate(${x} ${y - (1 - u) * 30})`} opacity={u}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill="#0E0A22" opacity={0.78} stroke="#C9A24A" strokeWidth={2.5} />
      {c.n !== undefined && (
        <g>
          <circle cx={discX} cy={0} r={d / 2} fill="#FFC928" />
          {txt(String(c.n), discX, size * 0.04, size * 0.8, '#2A1A00')}
        </g>
      )}
      {txt(c.text, tx, size * 0.04, size, '#FFFFFF')}
    </g>
  );
};

