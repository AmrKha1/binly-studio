// NIGHT DATA — numbers, time and lists in the AZTIKA look (references/universe-claude, GAP-CHECK P1):
// WarWorld (dark red, smoke, embers — 8:45) · NTimeline (glowing line, year pins, labels — 8:45 / 9:02) · NGauge
// (a tube that fills green → yellow → red as the estimate climbs — 7:27) · NBars (glowing horizontal bars, 11:07) ·
// NBarChart (glowing columns with labels — 12:46) · Receipt (the universe's invoice — 14:22) · CalendarCard (a counting
// day/date card — 0:00, 0:56, 10:37) · JourneyPath (the hook's road map: dotted wave through what's coming — 0:09).
// Screen coordinates — use inside <NightScreen>. Silent: the voice carries counts, bars and lists.
import React from 'react';
import {clamp01, ease, lerp, popIn, rand, spring} from './anim';
import {H, W} from './theme';
import {uid} from './stage';
import {N, nightFont, NPill, PillKind, textWidth} from './night';
import {isAr} from './lang';
import {Mark} from './night-fx';

const WEIGHT = () => (isAr() ? 800 : 900);
const fmt = (n: number, decimals = 0) => {
  const [i, d] = n.toFixed(decimals).split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : '');
};

/** WarWorld — dark blood-red backdrop (measured 8:50: centre #4F1515 → #260C0D → edges #11050B), drifting smoke, rising embers. */
export const WarWorld: React.FC<{t: number; id: string; embers?: number}> = ({t, id, embers = 28}) => {
  const g = uid('nwar', id);
  return (
    <g>
      <defs>
        <radialGradient id={g} cx="0.5" cy="0.85" r="0.9">
          <stop offset="0" stopColor="#5A1818" />
          <stop offset="0.45" stopColor="#2E0E0F" />
          <stop offset="1" stopColor="#11050B" />
        </radialGradient>
        <filter id={g + '__b'} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={60} />
        </filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      <g filter={`url(#${g}__b)`} fill="#0A0204" opacity={0.55}>
        {Array.from({length: 7}, (_, i) => (
          <circle key={i} cx={((rand(i * 3) * W + t * (10 + i * 3)) % (W + 400)) - 200} cy={H * (0.55 + rand(i * 7) * 0.45)} r={160 + rand(i) * 140} />
        ))}
      </g>
      {Array.from({length: embers}, (_, i) => {
        const x = (rand(i * 5 + 1) * W + Math.sin(t + i) * 30) % W;
        const y = H - ((t * (30 + rand(i * 3) * 50) + rand(i * 9) * H) % (H + 40));
        const fl = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i));
        return <circle key={i} cx={x} cy={y} r={1.5 + rand(i * 11) * 2.5} fill={i % 3 ? '#FF8A3A' : '#FFC23A'} opacity={0.55 * fl} />;
      })}
    </g>
  );
};

export type TimelineEvent = {year?: string; label?: string; sub?: string; at: number; x?: number; mystery?: boolean; subKind?: PillKind};
/**
 * NTimeline — a thin glowing cream line with year pins (8:45 «1861», 9:02 «1914 · 1861 · ؟»): gold year pill above the
 * pin, white label pill below, an optional small sub pill (subKind, default red) under it. mystery = red "?" pin for
 * "something bigger…". The line draws on from `from` towards `to` (Arabic: right → left) as the first event arrives;
 * events without x are spread evenly. y = the line.
 */
export const NTimeline: React.FC<{t: number; events: TimelineEvent[]; y?: number; from?: number; to?: number; id: string; size?: number; out?: number}> = ({
  t, events, y = 560, from, to, id, size = 34, out,
}) => {
  const rtl = isAr();
  const a = from ?? (rtl ? 1760 : 160), b = to ?? (rtl ? 160 : 1760);
  if (!events.length || t < events[0].at - 0.4) return null;
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const draw = ease.out(clamp01((t - (events[0].at - 0.4)) / 0.6));
  const g = uid('ntl', id);
  const xs = events.map((e, i) => e.x ?? lerp(a, b, (i + 1) / (events.length + 1)));
  return (
    <g opacity={fade}>
      <defs>
        <filter id={g} x="-10%" y="-400%" width="120%" height="900%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      <line x1={a} y1={y} x2={lerp(a, b, draw)} y2={y} stroke="#FFE3B0" strokeWidth={8} opacity={0.4} filter={`url(#${g})`} />
      <line x1={a} y1={y} x2={lerp(a, b, draw)} y2={y} stroke="#F6E6C8" strokeWidth={4} strokeLinecap="round" />
      {events.map((e, i) => {
        const p = clamp01((t - e.at) / 0.25);
        if (p <= 0) return null;
        const q = popIn(p, 0.45, 0.3);
        const x = xs[i];
        return (
          <g key={i}>
            <g transform={`translate(${x} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
              {e.mystery ? (
                <g>
                  <circle r={size * 0.62} fill="#E23A4E" stroke="#FFFFFF" strokeWidth={4} />
                  <text x={0} y={2} fontSize={size * 0.9} fontFamily={nightFont()} fontWeight={WEIGHT()} textAnchor="middle" dominantBaseline="central" fill="#FFFFFF">
                    {rtl ? '؟' : '?'}
                  </text>
                </g>
              ) : (
                <g>
                  <circle r={size * 0.42} fill="#FFC928" opacity={0.35} />
                  <circle r={size * 0.28} fill="#FFC928" stroke="#2A1A00" strokeWidth={3} />
                </g>
              )}
            </g>
            {e.year && <NPill text={e.year} x={x} y={y - size * 1.9} size={size * 1.05} kind="gold" id={`${id}-y${i}`} p={(t - e.at - 0.05) / 0.25} />}
            {e.label && <NPill text={e.label} x={x} y={y + (e.mystery ? -size * 1.9 : size * 1.7)} size={size * 0.8} kind={e.mystery ? 'red' : 'white'} id={`${id}-l${i}`} p={(t - e.at - 0.12) / 0.25} />}
            {e.sub && <NPill text={e.sub} x={x} y={y + size * 3.1} size={size * 0.62} kind={e.subKind ?? 'red'} id={`${id}-s${i}`} p={(t - e.at - 0.2) / 0.25} />}
          </g>
        );
      })}
    </g>
  );
};

export type GaugeTick = {at: number; level: number; label: string; kind?: PillKind};
/**
 * NGauge — a dark rounded tube that fills from the bottom (7:27–7:40 «التقديرات»: green "hundreds of billions" →
 * red "8.8 trillion"). The fill colour is a fixed green → yellow → red gradient, so the higher it climbs the hotter it
 * looks. ticks = [{at, level 0..1, label}] — each one raises the fill to its level (spring) and pops its pill on the
 * side. A red ↑ arrow bobs beside the tube while it climbs. title = pill above the tube.
 */
export const NGauge: React.FC<{t: number; x: number; y: number; w?: number; h?: number; ticks: GaugeTick[]; title?: string; id: string; side?: 'right' | 'left'; out?: number}> = ({
  t, x, y, w = 92, h = 420, ticks, title, id, side = 'right', out,
}) => {
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  let level = 0, prev = 0, lastAt = -1;
  for (const k of ticks) if (t >= k.at) {
    prev = level;
    level = k.level;
    lastAt = k.at;
  }
  const u = lastAt >= 0 ? spring(clamp01((t - lastAt) / 0.9), 0.15) : 0;
  const lv = lerp(prev, level, u);
  const climbing = lastAt >= 0 && t - lastAt < 1.4;
  const g = uid('ngauge', id);
  const top = y - h / 2, bot = y + h / 2, pad = 10;
  const fillH = (h - pad * 2) * clamp01(lv);
  const sx = side === 'right' ? 1 : -1;
  return (
    <g opacity={fade}>
      <defs>
        <linearGradient id={g} gradientUnits="userSpaceOnUse" x1={0} y1={bot} x2={0} y2={top}>
          <stop offset="0" stopColor="#2EE88B" />
          <stop offset="0.45" stopColor="#B8E34A" />
          <stop offset="0.7" stopColor="#FFC928" />
          <stop offset="1" stopColor="#FF3B4E" />
        </linearGradient>
        <filter id={g + '__b'} x="-80%" y="-30%" width="260%" height="160%">
          <feGaussianBlur stdDeviation={16} />
        </filter>
      </defs>
      <rect x={x - w / 2} y={bot - pad - fillH} width={w} height={fillH + pad} rx={w / 2} fill={`url(#${g})`} opacity={0.45} filter={`url(#${g}__b)`} />
      <rect x={x - w / 2} y={top} width={w} height={h} rx={w / 2} fill="#14101F" stroke={N.outline} strokeWidth={8} />
      <rect x={x - w / 2} y={top} width={w} height={h} rx={w / 2} fill="none" stroke="#3A3352" strokeWidth={3} />
      {fillH > 2 && <rect x={x - w / 2 + pad} y={bot - pad - fillH} width={w - pad * 2} height={fillH} rx={(w - pad * 2) / 2} fill={`url(#${g})`} />}
      {fillH > 20 && <rect x={x - w / 2 + pad + 8} y={bot - pad - fillH + 10} width={8} height={Math.max(0, fillH - 20)} rx={4} fill="#FFFFFF" opacity={0.35} />}
      {climbing && (
        <g transform={`translate(${x - sx * (w / 2 + 50)} ${bot - pad - fillH + 30 + Math.sin(t * 8) * 8})`}>
          <path d="M0 -34 L18 -8 L7 -8 L7 30 L-7 30 L-7 -8 L-18 -8 Z" fill="#FF3B4E" stroke={N.outline} strokeWidth={3} strokeLinejoin="round" />
        </g>
      )}
      {ticks.map((k, i) => {
        if (t < k.at) return null;
        const ty = bot - pad - (h - pad * 2) * k.level;
        const lx = x + sx * (w / 2 + 18), px = x + sx * (w / 2 + 40 + textWidth(k.label, 30) / 2 + 30);
        return (
          <g key={i}>
            <line x1={lx} y1={ty} x2={lx + sx * 24} y2={ty} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={clamp01((t - k.at) / 0.2)} />
            <NPill text={k.label} x={px} y={ty} size={30} kind={k.kind ?? (i === ticks.length - 1 && k.level > 0.7 ? 'red' : 'white')} id={`${id}-t${i}`} p={(t - k.at - 0.1) / 0.25} />
          </g>
        );
      })}
      {title && <NPill text={title} x={x + sx * 40} y={top - 60} size={38} kind="white" id={id + '__ttl'} />}
    </g>
  );
};

export type NBar = {label: string; value: number; at: number; color?: 'cyan' | 'hot' | 'gold' | 'green' | 'pink' | 'violet'; kind?: PillKind};
const BARC: Record<string, [string, string, string]> = {
  cyan: ['#7FE6FF', '#34D2FA', '#57D9FA'],
  hot: ['#FFB23A', '#FF3B4E', '#FF5A3A'],
  gold: ['#FFE07A', '#F2B010', '#FFC928'],
  green: ['#7BF0A8', '#22C55E', '#2EE88B'],
  pink: ['#FF8AD8', '#E83AB0', '#FF4FC8'],
  violet: ['#C9A8FF', '#8A4AF2', '#B98BFF'],
};
/**
 * NBars — thick glowing horizontal bars (11:07 «عمر الكون» vs «الوقت اللي تحتاجه»): each grows from `anchor` (Arabic:
 * the right edge) to value/max of `len`, its label pill sitting above its far end. Rows go down from y by `gap`.
 */
export const NBars: React.FC<{t: number; bars: NBar[]; x: number; y: number; len?: number; max?: number; thick?: number; gap?: number; id: string; out?: number}> = ({
  t, bars, x, y, len = 1100, max, thick = 26, gap = 130, id, out,
}) => {
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const rtl = isAr();
  const mx = max ?? Math.max(...bars.map((b) => b.value));
  const g = uid('nbars', id);
  return (
    <g opacity={fade}>
      <defs>
        <filter id={g} x="-20%" y="-300%" width="140%" height="700%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
      </defs>
      {bars.map((b, i) => {
        const p = clamp01((t - b.at) / 0.8);
        if (p <= 0) return null;
        const L = Math.max(thick, len * (b.value / mx) * ease.out(p));
        const by = y + i * gap;
        const x0 = rtl ? x - L : x;
        const [c0, c1, glow] = BARC[b.color ?? (i % 2 ? 'hot' : 'cyan')];
        const gid = `${g}-${i}`;
        const end = rtl ? x - L : x + L;
        return (
          <g key={i}>
            <defs>
              <linearGradient id={gid} x1={rtl ? '1' : '0'} y1="0" x2={rtl ? '0' : '1'} y2="0">
                <stop offset="0" stopColor={c0} />
                <stop offset="1" stopColor={c1} />
              </linearGradient>
            </defs>
            <rect x={x0} y={by - thick / 2} width={L} height={thick} rx={thick / 2} fill={glow} opacity={0.6} filter={`url(#${g})`} />
            <rect x={x0} y={by - thick / 2} width={L} height={thick} rx={thick / 2} fill={`url(#${gid})`} />
            <rect x={x0 + thick / 2} y={by - thick / 2 + 4} width={Math.max(0, L - thick)} height={5} rx={2.5} fill="#FFFFFF" opacity={0.4} />
            <NPill text={b.label} x={end + (rtl ? 1 : -1) * (textWidth(b.label, 30) / 2 + 30)} y={by - thick / 2 - 34} size={30} kind={b.kind ?? 'white'} id={`${id}-${i}`} p={(t - b.at - 0.3) / 0.25} />
          </g>
        );
      })}
    </g>
  );
};

/**
 * NBarChart — glowing columns on a baseline (12:46 «أكبر من اقتصادات دول كاملة»): the hero bar first and tallest (pink),
 * the others plain; tiny white label pills under each. x = centre of the LEFT column. Columns rise one after another from each `at`.
 */
export const NBarChart: React.FC<{t: number; bars: NBar[]; x: number; base: number; colW?: number; gap?: number; maxH?: number; max?: number; id: string; out?: number}> = ({
  t, bars, x, base, colW = 70, gap = 40, maxH = 420, max, id, out,
}) => {
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const mx = max ?? Math.max(...bars.map((b) => b.value));
  const g = uid('nbch', id);
  const cols = ['pink', 'gold', 'green', 'cyan', 'violet'];
  return (
    <g opacity={fade}>
      <defs>
        <filter id={g} x="-80%" y="-30%" width="260%" height="160%">
          <feGaussianBlur stdDeviation={16} />
        </filter>
      </defs>
      {bars.map((b, i) => {
        const p = clamp01((t - b.at) / 0.7);
        if (p <= 0) return null;
        const hh = maxH * (b.value / mx) * spring(p, 0.2);
        const cx = x + i * (colW + gap); // charts read left → right even in Arabic (12:46: the hero bar is the left one)
        const [c0, c1, glow] = BARC[b.color ?? cols[i % cols.length]];
        const gid = `${g}-${i}`;
        return (
          <g key={i}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={c0} />
                <stop offset="1" stopColor={c1} />
              </linearGradient>
            </defs>
            <rect x={cx - colW / 2} y={base - hh} width={colW} height={hh} rx={8} fill={glow} opacity={0.45} filter={`url(#${g})`} />
            <rect x={cx - colW / 2} y={base - hh} width={colW} height={hh} rx={8} fill={`url(#${gid})`} />
            <rect x={cx - colW / 2 + 8} y={base - hh + 8} width={8} height={Math.max(0, hh - 16)} rx={4} fill="#FFFFFF" opacity={0.35} />
            <NPill text={b.label} x={cx} y={base + 30} size={20} kind={b.kind ?? 'white'} id={`${id}-${i}`} p={(t - b.at - 0.2) / 0.25} />
          </g>
        );
      })}
    </g>
  );
};

/**
 * Receipt — a slightly tilted paper invoice (14:22 «فاتورة الكون»): title, rows (label right, value left in green),
 * a dashed rule and the TOTAL in big green; zigzag torn bottom. Rows print one by one from `at` (every `step` s).
 */
export const Receipt: React.FC<{t: number; at: number; x: number; y: number; title: string; rows: {label: string; value: string}[]; total: {label: string; value: string}; w?: number; rot?: number; step?: number; id: string; out?: number}> = ({
  t, at, x, y, title, rows, total, w = 440, rot = -2, step = 0.35, id, out,
}) => {
  if (t < at) return null;
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const rtl = isAr();
  const rowH = 62, head = 90, h = head + rows.length * rowH + 150;
  const slide = ease.out(clamp01((t - at) / 0.45));
  const g = uid('nrcpt', id);
  const m = Math.ceil(w / 24);
  const zig = Array.from({length: m + 1}, (_, i) => `L${Math.max(-w / 2, w / 2 - i * 24)} ${h / 2 + (i % 2 ? 12 : 0)}`).join(' '); // torn bottom edge
  const lx = rtl ? w / 2 - 34 : -w / 2 + 34, vx = rtl ? -w / 2 + 34 : w / 2 - 34;
  const la = rtl ? 'end' : 'start', va = rtl ? 'start' : 'end';
  const txt = (s: string, xx: number, yy: number, size: number, fill: string, anchor: string) => (
    <text x={xx} y={yy} fontSize={size} fontFamily={nightFont()} fontWeight={WEIGHT()} textAnchor={anchor as 'start'} dominantBaseline="central" fill={fill}>
      {s}
    </text>
  );
  const totalP = clamp01((t - at - 0.45 - rows.length * step) / 0.25);
  return (
    <g transform={`translate(${x} ${y + (1 - slide) * 700}) rotate(${rot})`} opacity={fade}>
      <defs>
        <filter id={g} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={18} />
        </filter>
      </defs>
      <rect x={-w / 2 + 16} y={-h / 2 + 20} width={w} height={h} fill="#000000" opacity={0.45} filter={`url(#${g})`} />
      <path d={`M${-w / 2} ${-h / 2} H${w / 2} ${zig} Z`} fill="#F6F3EC" />
      {txt(title, 0, -h / 2 + 50, 40, '#1A1A2E', 'middle')}
      <line x1={-w / 2 + 28} x2={w / 2 - 28} y1={-h / 2 + head} y2={-h / 2 + head} stroke="#1A1A2E" strokeWidth={3} opacity={0.6} />
      {rows.map((r, i) => {
        const p = clamp01((t - at - 0.45 - i * step) / 0.2);
        if (p <= 0) return null;
        const ry = -h / 2 + head + rowH * (i + 0.6);
        return (
          <g key={i} opacity={p}>
            {txt(r.label, lx, ry, 30, '#2A2A3E', la)}
            {txt(r.value, vx, ry, 30, '#16A34A', va)}
          </g>
        );
      })}
      <line x1={-w / 2 + 28} x2={w / 2 - 28} y1={h / 2 - 105} y2={h / 2 - 105} stroke="#1A1A2E" strokeWidth={3} strokeDasharray="10 8" opacity={0.6} />
      {totalP > 0 && (
        <g opacity={totalP} transform={`translate(0 ${h / 2 - 55}) scale(${popIn(totalP, 0.45, 0.6).sx})`}>
          {txt(total.label, lx, 0, 36, '#1A1A2E', la)}
          {txt(total.value, vx, 0, 50, '#16A34A', va)}
        </g>
      )}
    </g>
  );
};

/**
 * CalendarCard — a tear-off calendar card that counts (0:00 «اليوم 11,378 → 28,391», 10:37 «75»): red header with
 * binder rings and a label, big dark number. Counts from `from` to `to` over `dur` s starting at `at` (from = to for a
 * still date). pill = optional green pill under it («+ مليار $»).
 */
export const CalendarCard: React.FC<{t: number; at: number; x: number; y: number; to: number; from?: number; dur?: number; label?: string; pill?: string; size?: number; id: string; out?: number; decimals?: number}> = ({
  t, at, x, y, to, from, dur = 2, label, pill, size = 1, id, out, decimals = 0,
}) => {
  if (t < at) return null;
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const q = popIn(clamp01((t - at) / 0.3), 0.45, 0.4);
  const k = from === undefined ? 1 : clamp01((t - at) / dur);
  const v = from === undefined ? to : lerp(from, to, k);
  const w = 230, h = 220, hh = 62;
  const num = fmt(v, decimals);
  const ns = Math.min(78, (w - 30) / Math.max(1, textWidth(num, 78) / 78));
  return (
    <g transform={`translate(${x} ${y}) scale(${q.sx * size} ${q.sy * size})`} opacity={q.o * fade}>
      <rect x={-w / 2 + 6} y={-h / 2 + 10} width={w} height={h} rx={26} fill="#000000" opacity={0.35} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill="#FFFFFF" stroke={N.outline} strokeWidth={5} />
      <path d={`M${-w / 2} ${-h / 2 + hh} V${-h / 2 + 26} Q${-w / 2} ${-h / 2} ${-w / 2 + 26} ${-h / 2} H${w / 2 - 26} Q${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 26} V${-h / 2 + hh} Z`} fill="#EF3B4E" stroke={N.outline} strokeWidth={5} />
      {[-w * 0.26, w * 0.26].map((rx) => (
        <rect key={rx} x={rx - 8} y={-h / 2 - 20} width={16} height={38} rx={8} fill="#2A2A3E" stroke={N.outline} strokeWidth={3} />
      ))}
      {label && (
        <text x={0} y={-h / 2 + hh / 2 + 4} fontSize={32} fontFamily={nightFont()} fontWeight={WEIGHT()} textAnchor="middle" dominantBaseline="central" fill="#FFFFFF">
          {label}
        </text>
      )}
      <text x={0} y={hh / 2 + 4} fontSize={ns} fontFamily={nightFont()} fontWeight={WEIGHT()} textAnchor="middle" dominantBaseline="central" fill="#14141F">
        {num}
      </text>
      {pill && <NPill text={pill} x={0} y={h / 2 + 18} size={30} kind="green" id={id + '__p'} p={(t - at - 0.4) / 0.25} />}
    </g>
  );
};

export type Station = {u: number; node?: React.ReactNode; dx?: number; dy?: number};
/**
 * JourneyPath — the hook's road map (0:09–0:14 «رحلة بين أغلى وأثمن الأشياء»): a dotted gold wave drawn on from
 * (x0, y0) to (x1, y1) over `dur`, a glowing head, big gold station dots; each station's node (a HeroObject, an icon,
 * a MysteryBox…) pops above its dot when the head reaches it. u = 0..1 along the path; dx/dy offset the node.
 */
export const JourneyPath: React.FC<{t: number; at: number; dur?: number; x0?: number; y0?: number; x1?: number; y1?: number; amp?: number; waves?: number; stations?: Station[]; id: string; out?: number}> = ({
  t, at, dur = 3, x0 = 260, y0 = 735, x1 = 1910, y1 = 540, amp = 240, waves = 1.25, stations = [], id, out,
}) => {
  if (t < at) return null;
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const P = (u: number) => [lerp(x0, x1, u), lerp(y0, y1, u) - amp * Math.sin(u * Math.PI * 2 * waves)] as const;
  const prog = ease.inOut(clamp01((t - at) / dur));
  const n = 90;
  const g = uid('njour', id);
  const head = P(prog);
  return (
    <g opacity={fade}>
      <defs>
        <filter id={g} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      {Array.from({length: n + 1}, (_, i) => {
        const u = i / n;
        if (u > prog) return null;
        const [px, py] = P(u);
        return <circle key={i} cx={px} cy={py} r={6} fill="#FFD23A" />;
      })}
      {stations.map((s, i) => {
        if (s.u > prog) return null;
        const [px, py] = P(s.u);
        const lp = clamp01((prog - s.u) * dur / 0.3);
        const q = popIn(lp, 0.45, 0.3);
        return (
          <g key={i}>
            <circle cx={px} cy={py} r={15} fill="#FFD23A" stroke={N.outline} strokeWidth={4} />
            {s.node && (
              <g transform={`translate(${px + (s.dx ?? 0)} ${py + (s.dy ?? -110)}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
                {s.node}
              </g>
            )}
          </g>
        );
      })}
      {prog < 1 && (
        <g>
          <circle cx={head[0]} cy={head[1]} r={26} fill="#FFC928" opacity={0.7} filter={`url(#${g})`} />
          <circle cx={head[0]} cy={head[1]} r={10} fill="#FFF3C4" />
        </g>
      )}
    </g>
  );
};

/** ✔/✖ row next to a pill — for the receipt's «ما اشتريناها ✖» lines and quick verdict lists (14:28). */
export const MarkPill: React.FC<{t: number; at: number; text: string; x: number; y: number; mark?: 'check' | 'cross'; size?: number; id: string}> = ({t, at, text, x, y, mark = 'cross', size = 40, id}) => {
  const p = clamp01((t - at) / 0.25);
  if (p <= 0) return null;
  const rtl = isAr();
  const w = textWidth(text, size) + size * 1.5;
  const mx = x + (rtl ? 1 : -1) * (w / 2 + size * 0.9);
  const q = popIn(p, 0.45, 0.3);
  return (
    <g>
      <g transform={`translate(${mx} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
        <Mark kind={mark} x={0} y={0} r={size * 0.55} />
      </g>
      <NPill text={text} x={x} y={y} size={size} kind="white" id={id} p={(t - at - 0.08) / 0.25} />
    </g>
  );
};

/** fmt with thousands commas (12345.6, 1) → "12,345.6" — for numbers you compute yourself. */
export const formatNum = fmt;
