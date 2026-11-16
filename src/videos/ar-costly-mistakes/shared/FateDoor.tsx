/**
 * FateDoor — "the door that opened": a tall ornate door that CRACKS open (a line of light first), then swings wide with
 * light spilling out onto the floor, and something passes through it (behind the door → in front, growing).
 * Origin: built for ar-costly-mistakes (2026-11-16) — used for the Binance file "was the door" (kind digital, red light)
 * and Suez "the first door that opened" (kind wood, gold light; closeAt = 1956). Night look: thick dark outline,
 * wood/metal gradients, gold trim + studs (wood) or neon edge + circuit lines (digital), one highlight stripe,
 * glow in the light's own colour (reference door/vault lighting, shots 0:25 / 13:30).
 *
 * Props: t · at? (pops in) · x, y = bottom centre (the threshold) · h (640) · w (h·0.52) · kind: wood|digital ·
 * light (colour of the light behind) · openAt (crack 0.35 s → wide by +1.2 s) · closeAt? (swings shut, thump) ·
 * open? (0..1 manual override) · through? {at, node, dur? (1.4), to? [dx, dy] end offset from the threshold, s? end scale}
 * — `node` is drawn centred on 0,0 at about h·0.3 tall; it comes from deep inside the doorway and passes in front ·
 * label? {text, at, kind?} NPill above the door · out? · id.
 * Sounds: pop (appears) · tease (the crack of light) · door (swing open) · whoosh (thing passes) · thump (closes).
 */
import React from 'react';
import {clamp01, ease, flyOut, keys, noise1} from '../../../kit/anim';
import {lb, uid} from '../../../kit/stage';
import {NPill, PillKind} from '../../../kit/night';
import {move, moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {OUT, popAt} from './util';

export type FateDoorProps = {
  t: number; at?: number; x: number; y: number; h?: number; w?: number; kind?: 'wood' | 'digital'; light?: string;
  openAt?: number; closeAt?: number; open?: number;
  through?: {at: number; node: React.ReactNode; dur?: number; to?: [number, number]; s?: number};
  label?: {text: string; at: number; kind?: PillKind};
  out?: number; id: string;
};

export const FateDoor: React.FC<FateDoorProps> = ({t, at, x, y, h = 640, w: w0, kind = 'wood', light = '#FFC928', openAt, closeAt, open, through, label, out, id}) => {
  if (at !== undefined && t < at) return null;
  const w = w0 ?? h * 0.52;
  const g = uid('fdoor', id);
  const q = popAt(t, at);
  const fo = flyOut(t, out, 0, 1);
  // opening: a crack of light (0 → 0.1 in 0.35 s), a breath, then it swings wide; closing swings back in 0.6 s
  let o = open ?? 0;
  if (open === undefined && openAt !== undefined) {
    o = keys(t, [[openAt, 0], [openAt + 0.35, 0.1], [openAt + 0.55, 0.1], [openAt + 1.25, 1]], ease.inOut);
    if (closeAt !== undefined && t >= closeAt) o = o * (1 - ease.in(clamp01((t - closeAt) / 0.6)));
  }
  if (at !== undefined) cueSfx('pop', `fdoor-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125});
  if (openAt !== undefined) {
    cueSfx('tease', `fdoor-${id}-crack-${openAt}`, t >= openAt && t < openAt + 0.3, x, {at: openAt, hit: 0.3});
    cueSfx('door', `fdoor-${id}-open-${openAt}`, t >= openAt + 0.55 && t < openAt + 0.9, x, {at: openAt + 0.55, hit: 0.3});
  }
  if (closeAt !== undefined) cueSfx('thump', `fdoor-${id}-close-${closeAt}`, t >= closeAt && t < closeAt + 0.7, x, {at: closeAt, hit: 0.6});

  // frame geometry (local: threshold at 0,0, door rises to -h)
  const R = w / 2; // arch radius
  const opening = kind === 'wood'
    ? `M${-w / 2} 0 V${-h + R} A${R} ${R} 0 0 1 ${w / 2} ${-h + R} V0 Z`
    : `M${-w / 2} 0 V${-h + 40} Q${-w / 2} ${-h} ${-w / 2 + 40} ${-h} H${w / 2 - 40} Q${w / 2} ${-h} ${w / 2} ${-h + 40} V0 Z`;
  const fw = w * 0.16; // frame thickness
  const frameOuter = kind === 'wood'
    ? `M${-w / 2 - fw} 0 V${-h + R} A${R + fw} ${R + fw} 0 0 1 ${w / 2 + fw} ${-h + R} V0 Z`
    : `M${-w / 2 - fw} 0 V${-h + 30} Q${-w / 2 - fw} ${-h - fw} ${-w / 2 + 30} ${-h - fw} H${w / 2 - 30} Q${w / 2 + fw} ${-h - fw} ${w / 2 + fw} ${-h + 30} V0 Z`;
  const flick = 0.9 + 0.1 * noise1(t * 3, 7);
  const lightA = clamp01(o * 3) * flick;

  // the leaves: hinged on the outer edges, they narrow (cos of the swing) and lean in perspective
  const ang = o * 1.35; // radians-ish
  const sx = Math.max(0.04, Math.cos(ang));
  const skew = Math.sin(ang) * 14;
  const woodA = '#5A3320', woodB = '#2C170D';
  const leaf = (side: -1 | 1) => {
    const lw = w / 2;
    // drawn from its hinge (at side·w/2) toward the centre
    const panel = (
      <g>
        <rect x={0} y={-h - R} width={lw} height={h + R} fill={kind === 'wood' ? `url(#${g}-wood)` : `url(#${g}-dig)`} stroke={OUT} strokeWidth={6} />
        {kind === 'wood' ? (
          <g>
            {[0.14, 0.52].map((f, i) => <rect key={i} x={lw * 0.16} y={-h + h * f} width={lw * 0.68} height={h * (i ? 0.34 : 0.3)} rx={10} fill="none" stroke="#1A0C05" strokeWidth={6} opacity={0.75} />)}
            {[0.14, 0.52].map((f, i) => <rect key={'g' + i} x={lw * 0.16 + 8} y={-h + h * f + 8} width={lw * 0.68 - 16} height={h * (i ? 0.34 : 0.3) - 16} rx={6} fill="none" stroke="#F2B010" strokeWidth={3} opacity={0.8} />)}
            {[0.08, 0.92].map((f, i) => <circle key={'s' + i} cx={lw * 0.5} cy={-h * f} r={7} fill="#F5C64A" stroke={OUT} strokeWidth={2.5} />)}
            {/* handle near the centre edge */}
            <circle cx={lw * 0.86} cy={-h * 0.46} r={13} fill="#FCC018" stroke={OUT} strokeWidth={4} />
          </g>
        ) : (
          <g>
            {[0.2, 0.38, 0.62, 0.8].map((f, i) => <path key={i} d={`M${lw * 0.15} ${-h * f} H${lw * (0.45 + 0.1 * (i % 2))} V${-h * f + 30} H${lw * 0.8}`} fill="none" stroke={light} strokeWidth={4} opacity={0.55} strokeLinecap="round" />)}
            {[0.2, 0.38, 0.62, 0.8].map((f, i) => <circle key={'d' + i} cx={lw * 0.8} cy={-h * f + 30} r={7} fill={light} opacity={0.8} />)}
            <rect x={lw * 0.82} y={-h * 0.56} width={14} height={h * 0.14} rx={7} fill={light} stroke={OUT} strokeWidth={3} />
          </g>
        )}
        {/* the highlight stripe */}
        <rect x={lw * 0.07} y={-h * 0.92} width={8} height={h * 0.8} rx={4} fill="#FFFFFF" opacity={kind === 'wood' ? 0.22 : 0.35} />
      </g>
    );
    return (
      <g transform={`translate(${side * (w / 2)} 0) skewY(${-side * skew}) scale(${sx} 1) scale(${side === -1 ? 1 : -1} 1)`}>
        {panel}
      </g>
    );
  };

  // the thing passing through
  let thru: React.ReactNode = null, thruFront = false;
  if (through && t >= through.at) {
    const d = through.dur ?? 1.4;
    const k = clamp01((t - through.at) / d);
    const [tx, ty] = move(t, through.at, [0, -h * 0.42], through.to ?? [0, h * 0.18], d);
    const ts = moveTo(t, through.at, 0.3, through.s ?? 1.15, d, ease.in);
    thruFront = k > 0.45;
    thru = <g transform={`translate(${tx} ${ty}) scale(${ts})`} opacity={clamp01(k * 5)}>{through.node}</g>;
    cueSfx('whoosh', `fdoor-${id}-thru-${through.at}`, t >= through.at && t < through.at + 0.4, x, {at: through.at, hit: d * 0.45});
  }

  return (
    <g opacity={q.o * fo.o} {...lb('object', id)}>
      <g transform={`translate(${x + fo.dx} ${y + fo.dy}) scale(${q.s})`}>
        <defs>
          <linearGradient id={`${g}-wood`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={woodA} /><stop offset="1" stopColor={woodB} /></linearGradient>
          <linearGradient id={`${g}-dig`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1B2450" /><stop offset="1" stopColor="#0A0F28" /></linearGradient>
          <linearGradient id={`${g}-fr`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={kind === 'wood' ? '#7A4A2A' : '#2A3570'} /><stop offset="0.5" stopColor={kind === 'wood' ? '#4A2814' : '#141B44'} /><stop offset="1" stopColor={kind === 'wood' ? '#2A140A' : '#0A0E26'} />
          </linearGradient>
          <radialGradient id={`${g}-l`} cx="0.5" cy="0.62" r="0.65"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.35" stopColor={light} /><stop offset="1" stopColor={light} stopOpacity={0.55} /></radialGradient>
          <linearGradient id={`${g}-spill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={light} stopOpacity={0.75} /><stop offset="1" stopColor={light} stopOpacity={0} /></linearGradient>
          <filter id={`${g}-b`} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation={h * 0.06} /></filter>
          <clipPath id={`${g}-c`}><path d={opening} /></clipPath>
        </defs>
        {/* aura in the light's colour (always a little, much more when open) */}
        <path d={frameOuter} fill={light} opacity={0.12 + 0.45 * lightA} filter={`url(#${g}-b)`} transform={`scale(${1 + 0.12 * lightA})`} />
        {/* light spilling on the floor toward the viewer */}
        {lightA > 0.01 && (
          <path d={`M${-w * 0.45 * Math.max(0.15, o)} 0 L${w * 0.45 * Math.max(0.15, o)} 0 L${w * (0.6 + 0.9 * o)} ${h * 0.42} L${-w * (0.6 + 0.9 * o)} ${h * 0.42} Z`} fill={`url(#${g}-spill)`} opacity={0.75 * lightA} />
        )}
        {/* frame */}
        <path d={frameOuter} fill={`url(#${g}-fr)`} stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
        {kind === 'wood' ? (
          <path d={`M${-w / 2 - fw * 0.5} 0 V${-h + R} A${R + fw * 0.5} ${R + fw * 0.5} 0 0 1 ${w / 2 + fw * 0.5} ${-h + R} V0`} fill="none" stroke="#F2B010" strokeWidth={5} opacity={0.9} />
        ) : (
          <path d={frameOuter} fill="none" stroke={light} strokeWidth={5} opacity={0.9} transform="scale(0.965 0.985)" />
        )}
        {kind === 'wood' && (
          <g>
            {/* keystone + side studs */}
            <path d={`M-26 ${-h - fw - 6} L26 ${-h - fw - 6} L18 ${-h + 18} L-18 ${-h + 18} Z`} fill="#FCC018" stroke={OUT} strokeWidth={5} />
            {[0.2, 0.45, 0.7].map((f, i) => [-1, 1].map((s) => <circle key={`${i}${s}`} cx={s * (w / 2 + fw / 2)} cy={-h * f} r={8} fill="#F5C64A" stroke={OUT} strokeWidth={3} />))}
          </g>
        )}
        {/* doorway: light inside, the passer-by behind, then the leaves */}
        <g clipPath={`url(#${g}-c)`}>
          <path d={opening} fill={kind === 'wood' ? '#160A04' : '#05081A'} />
          <path d={opening} fill={`url(#${g}-l)`} opacity={lightA} />
          {/* light rays from the gap */}
          {lightA > 0.01 && [-2, -1, 0, 1, 2].map((i) => (
            <rect key={i} x={-6 + i * w * 0.12} y={-h - R} width={12 + Math.abs(i) * 6} height={h + R} fill="#FFFFFF" opacity={0.14 * lightA * (1 - Math.abs(i) * 0.15)} transform={`rotate(${i * 4 + 2 * Math.sin(t * 0.8 + i)} 0 0)`} />
          ))}
          {!thruFront && thru}
          {leaf(-1)}
          {leaf(1)}
          {/* the crack of light */}
          {o > 0.005 && o < 0.4 && <rect x={-4} y={-h - R} width={8} height={h + R} fill="#FFFFFF" opacity={clamp01(o * 10) * (1 - clamp01((o - 0.15) / 0.25))} />}
        </g>
        <path d={opening} fill="none" stroke={OUT} strokeWidth={6} />
        {/* threshold step */}
        <rect x={-w / 2 - fw - 20} y={-4} width={w + 2 * fw + 40} height={26} rx={8} fill={kind === 'wood' ? '#3A2214' : '#1A2250'} stroke={OUT} strokeWidth={6} />
        {thruFront && thru}
      </g>
      {label && t >= label.at && <NPill text={label.text} x={x} y={y - h - (kind === 'wood' ? w * 0.16 : 40) - 70} size={46} kind={label.kind ?? 'gold'} id={`${id}-lbl`} p={clamp01((t - label.at) / 0.3)} />}
    </g>
  );
};
