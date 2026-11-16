/**
 * MistakeBill — the motif of ar-costly-mistakes «الفاتورة»: every mistake gets its bill.
 * Origin: built for ar-costly-mistakes (2026-11-16), drawn after kit/night-data Receipt (reference 14:22 «فاتورة الكون»)
 * but ours: dark header band with a glowing gold title, cream paper that GROWS as each row prints (the printer feel),
 * a total that pops in gold or red (GlowText), an optional red Stamp pressed on it, and `fly` — the bill shrinks and
 * flies to a point (its step on the stair board). Night look: thick dark outline, paper gradient, one highlight stripe,
 * soft glow in the total's colour. Screen coordinates (inside <NightScreen>); Arabic labels on the right automatically.
 *
 * Props: t · at (appears, reference pop) · x, y = centre of the FULL bill · w (900) · title · rows [{label, value,
 * tone?: ink|red|green|gold, at}] (each prints on its `at`) · total? {label, value, tone: gold|red, at} ·
 * stamp? {text, at, color?, dx?, dy?} (default: pressed over the torn bottom corner) · fly? {at, x, y, s (absolute end scale), dur?} · out? (flies
 * down) · rot (−2°) · s (scale, 1) · id.
 * Sounds: page (appears) · tick (each row) · ding/thump (gold/red total) · stamp (kit Stamp) · whoosh (fly).
 */
import React from 'react';
import {clamp01, ease, flyOut, lerp} from '../../../kit/anim';
import {lb, uid} from '../../../kit/stage';
import {GlowText, nightFont, symText} from '../../../kit/night';
import {Stamp} from '../../../kit/night-fx';
import {move, moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {isAr} from '../../../kit/lang';
import {INK, OUT, popAt, prog} from './util';

export type BillTone = 'ink' | 'red' | 'green' | 'gold';
export type BillRow = {label: string; value: string; tone?: BillTone; at: number};
export type MistakeBillProps = {
  t: number; at: number; x: number; y: number; w?: number; title: string; rows: BillRow[];
  total?: {label: string; value: string; tone?: 'gold' | 'red'; at: number};
  stamp?: {text: string; at: number; color?: string; dx?: number; dy?: number};
  fly?: {at: number; x: number; y: number; s: number; dur?: number};
  out?: number; rot?: number; s?: number; id: string;
};

const ROW_INK: Record<BillTone, string> = {ink: INK, red: '#D21F3C', green: '#0F8A4E', gold: '#B07A06'};
const HEAD = 128, ROW = 96, TOT = 200, PAD = 46;

export const MistakeBill: React.FC<MistakeBillProps> = ({t, at, x, y, w = 900, title, rows, total, stamp, fly, out, rot = -2, s: s0 = 1, id}) => {
  if (t < at) return null;
  const rtl = isAr();
  const fullH = HEAD + rows.length * ROW + (total ? TOT : 0) + PAD;
  // SOUND MAP: the paper lands (page) · each row prints (tick) · the total lands (ding gold / thump red) · flies (whoosh)
  cueSfx('page', `mbill-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125});
  rows.forEach((r, i) => cueSfx('tick', `mbill-${id}-r${i}-${r.at}`, t >= r.at && t < r.at + 0.25, x, {at: r.at, hit: 0.08}));
  if (total) cueSfx(total.tone === 'red' ? 'thump' : 'ding', `mbill-${id}-tot-${total.at}`, t >= total.at && t < total.at + 0.3, x, {at: total.at, hit: 0.125});
  if (fly) cueSfx('whoosh', `mbill-${id}-fly-${fly.at}`, t >= fly.at && t < fly.at + 0.4, fly.x, {at: fly.at, hit: 0.3, gain: 0.8});

  // paper grows as rows print (ease.out 0.35 s each)
  const rowP = rows.map((r) => ease.out(prog(t, r.at, 0.35)));
  const totP = total ? ease.out(prog(t, total.at, 0.35)) : 0;
  // a total printed before (some of) the rows reserves their space at once, so it always sits INSIDE the paper
  const rowSum = rowP.reduce((a, b) => a + b, 0);
  const curH = HEAD + Math.max(rowSum, totP * rows.length) * ROW + totP * (total ? TOT : 0) + PAD;
  const top = -fullH / 2;

  const q = popAt(t, at);
  const rise = (1 - ease.out(prog(t, at, 0.45))) * 50;
  // fly to its stair step: eased in and out, scale with it, the tilt straightens
  const fd = fly?.dur ?? 0.8;
  const [px, py] = fly ? move(t, fly.at, [x, y], [fly.x, fly.y], fd) : [x, y];
  const fs = fly ? moveTo(t, fly.at, s0, fly.s, fd) : s0;
  const fr = fly ? lerp(rot, 0, ease.inOut(prog(t, fly.at, fd))) : rot;
  const fo = flyOut(t, out, 0, 1);

  const g = uid('mbill', id);
  const zigN = Math.ceil(w / 26);
  const bottom = top + curH;
  const zig = Array.from({length: zigN + 1}, (_, i) => `L${Math.max(-w / 2, w / 2 - i * 26)} ${bottom + (i % 2 ? 13 : 0)}`).join(' ');
  const paper = `M${-w / 2} ${top + 24} Q${-w / 2} ${top} ${-w / 2 + 24} ${top} H${w / 2 - 24} Q${w / 2} ${top} ${w / 2} ${top + 24} V${bottom} ${zig} Z`;
  const lx = rtl ? w / 2 - 40 : -w / 2 + 40, vx = rtl ? -w / 2 + 40 : w / 2 - 40;
  const la = rtl ? 'end' : 'start', va = rtl ? 'start' : 'end';
  const txt = (s: string, xx: number, yy: number, size: number, fill: string, anchor: string) => (
    <text x={xx} y={yy} fontSize={size} fontFamily={nightFont()} fontWeight={800} textAnchor={anchor as 'start'} dominantBaseline="central" fill={fill}>{symText(s)}</text>
  );
  const glowC = total ? (total.tone === 'red' ? '#FF2E4D' : '#FCC018') : '#FFE7A8';

  return (
    <g transform={`translate(${px + fo.dx} ${py + rise + fo.dy}) rotate(${fr}) scale(${fs * q.s})`} opacity={q.o * fo.o} {...lb('object', id)}>
      <defs>
        <linearGradient id={`${g}-p`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFBF0" /><stop offset="0.6" stopColor="#F3ECDB" /><stop offset="1" stopColor="#E2D7BF" /></linearGradient>
        <linearGradient id={`${g}-h`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2E1F63" /><stop offset="1" stopColor="#1A1040" /></linearGradient>
        <filter id={`${g}-b`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation={26} /></filter>
        <clipPath id={`${g}-c`}><path d={paper} /></clipPath>
      </defs>
      {/* glow in the total's colour (soft, behind) + drop shadow */}
      <path d={paper} fill={glowC} opacity={0.18 + 0.22 * totP} filter={`url(#${g}-b)`} />
      <path d={paper} transform="translate(14 18)" fill="#000" opacity={0.4} />
      <path d={paper} fill={`url(#${g}-p)`} stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
      <g clipPath={`url(#${g}-c)`}>
        {/* header band */}
        <rect x={-w / 2} y={top} width={w} height={HEAD} fill={`url(#${g}-h)`} />
        <line x1={-w / 2} x2={w / 2} y1={top + HEAD} y2={top + HEAD} stroke={OUT} strokeWidth={6} />
        {/* the highlight stripe */}
        <rect x={rtl ? w / 2 - 34 : -w / 2 + 16} y={top + HEAD + 14} width={10} height={Math.max(0, curH - HEAD - 40)} rx={5} fill="#FFFFFF" opacity={0.75} />
        {/* faint print lines */}
        {rows.map((_, i) => (rowP[i] > 0 ? <line key={i} x1={-w / 2 + 34} x2={w / 2 - 34} y1={top + HEAD + ROW * (i + 1)} y2={top + HEAD + ROW * (i + 1)} stroke={INK} strokeWidth={2} strokeDasharray="3 9" opacity={0.25} /> : null))}
      </g>
      <GlowText text={title} x={0} y={top + HEAD / 2 + 4} size={62} tone="gold" id={`${id}-title`} />
      {rows.map((r, i) => {
        const p = rowP[i];
        if (p <= 0) return null;
        const ry = top + HEAD + ROW * (i + 0.5);
        return (
          <g key={i} opacity={clamp01(p * 1.6)} transform={`translate(0 ${(1 - p) * -22})`}>
            {txt(r.label, lx, ry, 56, INK, la)}
            {txt(r.value, vx, ry, 60, ROW_INK[r.tone ?? 'ink'], va)}
          </g>
        );
      })}
      {total && totP > 0 && (() => {
        const ty = top + HEAD + rows.length * ROW + TOT / 2 + 4;
        const tq = popAt(t, total.at);
        return (
          <g>
            <line x1={-w / 2 + 30} x2={w / 2 - 30} y1={ty - TOT / 2 + 8} y2={ty - TOT / 2 + 8} stroke={INK} strokeWidth={5} strokeDasharray="14 10" opacity={0.7} />
            <g opacity={tq.o}>
              {txt(total.label, lx, ty - 52, 56, INK, la)}
              <g transform={`translate(0 ${ty + 30}) scale(${tq.s})`}>
                <GlowText text={total.value} x={0} y={0} size={80} tone={total.tone ?? 'gold'} id={`${id}-tot`} />
              </g>
            </g>
          </g>
        );
      })()}
      {stamp && <Stamp t={t} at={stamp.at} text={stamp.text} x={stamp.dx ?? w * 0.3} y={stamp.dy ?? fullH / 2 + 40} size={84} rot={-10} color={stamp.color} />}
    </g>
  );
};
