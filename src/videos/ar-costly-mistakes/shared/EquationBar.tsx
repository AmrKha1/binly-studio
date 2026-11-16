/**
 * EquationBar — SIGNATURE of ar-costly-mistakes C02 (Mariner 1): the symbol «R» with the tiny bar over it (R̄ = "use the
 * AVERAGE") on a glowing cyan blueprint card; at `liftAt` the bar winds up, lifts off, wobbles and floats away, fading —
 * and a dashed red ghost stays where it was (the missing bar). The Latin «R» is a maths symbol, the only Latin glyph.
 * + ReadingsGraph — the same blueprint card with noisy readings (dots): `avg` = the calm average line (bar present),
 * `raw` = the jittery line that over-reacts to every dot (bar missing), `both` = the two together.
 * Origin: built for ar-costly-mistakes (2026-11-16). Night look: cyan blueprint (kit BlueprintCard family) with a thick
 * dark outline, faint grid, one highlight stripe, cyan glow; the bar = the ONE gold key accent; reference pop.
 * Screen coordinates (inside <NightScreen>).
 *
 * EquationBar props: t · at? (card pops in) · x, y (card centre) · w (900) · h (620) · symbol ('R') · size (380) ·
 * liftAt? · label? {text, at, kind?} (NPill under the card) · out? · id.
 * Sounds: pop (card) · tease (the bar lifts) · wrong (the red ghost appears).
 * ReadingsGraph props: t · at? · x, y · w (900) · h (520) · mode avg|raw|both · p (0..1 draw progress) · n (22) ·
 * seed · label? {text, at, kind?} · out? · id. Sounds: pop (card) · tick (readings start).
 */
import React from 'react';
import {clamp01, ease, flyOut, rand} from '../../../kit/anim';
import {lb, uid} from '../../../kit/stage';
import {GlowText, NPill, PillKind, textWidth} from '../../../kit/night';
import {moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {OUT, popAt, prog} from './util';

/** the glowing cyan blueprint card (shared by both views) */
const BlueprintPanel: React.FC<{w: number; h: number; g: string; t: number; children?: React.ReactNode}> = ({w, h, g, t, children}) => (
  <g>
    <defs>
      <linearGradient id={`${g}-bg`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0F5A82" /><stop offset="0.55" stopColor="#0A3B5E" /><stop offset="1" stopColor="#06233D" /></linearGradient>
      <filter id={`${g}-gl`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={34} /></filter>
      <clipPath id={`${g}-k`}><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={28} /></clipPath>
    </defs>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={28} fill="#57D9FA" opacity={0.42 + 0.06 * Math.sin(t * 1.3)} filter={`url(#${g}-gl)`} />
    <rect x={-w / 2 + 16} y={-h / 2 + 22} width={w} height={h} rx={28} fill="#000" opacity={0.4} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={28} fill={`url(#${g}-bg)`} />
    <g clipPath={`url(#${g}-k)`}>
      <g stroke="#57D9FA" strokeWidth={1.6} opacity={0.22}>
        {Array.from({length: Math.ceil(w / 40) + 1}, (_, i) => <line key={'v' + i} x1={-w / 2 + i * 40} y1={-h / 2} x2={-w / 2 + i * 40} y2={h / 2} />)}
        {Array.from({length: Math.ceil(h / 40) + 1}, (_, i) => <line key={'h' + i} x1={-w / 2} y1={-h / 2 + i * 40} x2={w / 2} y2={-h / 2 + i * 40} />)}
      </g>
      {children}
      <rect x={-w / 2 + 22} y={-h / 2 + 30} width={10} height={h - 60} rx={5} fill="#FFFFFF" opacity={0.35} />
    </g>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={28} fill="none" stroke={OUT} strokeWidth={9} />
    <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 24} rx={20} fill="none" stroke="#7FE6FF" strokeWidth={3} opacity={0.6} />
    {/* corner marks */}
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
      <path key={i} d={`M${sx * (w / 2 - 34)} ${sy * (h / 2 - 70)} V${sy * (h / 2 - 34)} H${sx * (w / 2 - 70)}`} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
    ))}
  </g>
);

export type EquationBarProps = {
  t: number; at?: number; x: number; y: number; w?: number; h?: number; symbol?: string; size?: number; liftAt?: number;
  label?: {text: string; at: number; kind?: PillKind}; out?: number; id: string;
};

export const EquationBar: React.FC<EquationBarProps> = ({t, at, x, y, w = 900, h = 620, symbol = 'R', size = 380, liftAt, label, out, id}) => {
  if (at !== undefined && t < at) return null;
  const g = uid('eqbar', id);
  const q = popAt(t, at);
  const fo = flyOut(t, out, 0, 1);
  if (at !== undefined) cueSfx('pop', `eqbar-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125});
  if (liftAt !== undefined) {
    cueSfx('tease', `eqbar-${id}-lift-${liftAt}`, t >= liftAt && t < liftAt + 0.4, x, {at: liftAt, hit: 0.25});
    cueSfx('wrong', `eqbar-${id}-ghost-${liftAt}`, t >= liftAt + 1.3 && t < liftAt + 1.6, x, {at: liftAt + 1.3, hit: 0.125, gain: 0.7});
  }
  const sw = textWidth(symbol, size);
  const barW = Math.max(sw * 0.82, 150), barH = size * 0.085;
  const barY = -size * 0.47; // just above the cap height
  const symY = size * 0.06;
  // the bar: a tiny wind-up, then it lifts, wobbles and floats away, fading
  let bx = 0, by = 0, br = 0, bo = 1;
  if (liftAt !== undefined && t >= liftAt) {
    const e = t - liftAt;
    const wind = Math.sin(clamp01(e / 0.22) * Math.PI) * 8; // dips first (anticipation)
    by = wind + moveTo(t, liftAt + 0.18, 0, -h * 0.62, 2.2, ease.inOut);
    bx = moveTo(t, liftAt + 0.18, 0, sw * 0.9, 2.2, ease.inOut) + Math.sin(e * 3.2) * 18 * clamp01(e / 0.5);
    br = Math.sin(e * 4.2) * 16 * clamp01((e - 0.15) / 0.4) * (1 - 0.4 * clamp01(e / 2.4));
    bo = 1 - clamp01((e - 1.3) / 1.0);
  }
  const ghost = liftAt === undefined ? 0 : prog(t, liftAt + 1.3, 0.3);
  return (
    <g opacity={q.o * fo.o} {...lb('object', id)}>
      <g transform={`translate(${x + fo.dx} ${y + fo.dy}) scale(${q.s})`}>
        <BlueprintPanel w={w} h={h} g={g} t={t}>
          {/* faint working lines (abstract, no letters) */}
          <g fill="none" stroke="#7FE6FF" strokeWidth={4} strokeLinecap="round" opacity={0.28}>
            <path d={`M${-w / 2 + 70} ${h / 2 - 90} q40 -40 80 0 t80 0 t80 0`} />
            <path d={`M${w / 2 - 300} ${-h / 2 + 80} h120 m30 0 h90`} />
            <path d={`M${w / 2 - 260} ${h / 2 - 80} l60 -60 l60 60 l60 -60`} />
          </g>
        </BlueprintPanel>
        <GlowText text={symbol} x={0} y={symY} size={size} tone="white" id={`${id}-sym`} />
        {/* the ghost: where the bar was */}
        {ghost > 0 && (
          <g opacity={ghost} transform={`translate(0 ${barY}) scale(${popAt(t, (liftAt ?? 0) + 1.3).s})`}>
            <rect x={-barW / 2} y={-barH / 2} width={barW} height={barH} rx={barH / 2} fill="#FF2E4D" fillOpacity={0.12} stroke="#FF6B78" strokeWidth={6} strokeDasharray="18 12" />
          </g>
        )}
        {bo > 0 && (
          <g transform={`translate(${bx} ${barY + by}) rotate(${br})`} opacity={bo}>
            <defs>
              <linearGradient id={`${g}-bar`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE38A" /><stop offset="0.5" stopColor="#FCC018" /><stop offset="1" stopColor="#D99A00" /></linearGradient>
              <filter id={`${g}-bb`} x="-40%" y="-200%" width="180%" height="500%"><feGaussianBlur stdDeviation={14} /></filter>
            </defs>
            <rect x={-barW / 2} y={-barH / 2} width={barW} height={barH} rx={barH / 2} fill="#FCC018" opacity={0.85} filter={`url(#${g}-bb)`} />
            <rect x={-barW / 2} y={-barH / 2} width={barW} height={barH} rx={barH / 2} fill={`url(#${g}-bar)`} stroke={OUT} strokeWidth={7} />
            <rect x={-barW / 2 + barH * 0.5} y={-barH * 0.28} width={barW - barH} height={barH * 0.16} rx={barH * 0.08} fill="#FFFFFF" opacity={0.8} />
          </g>
        )}
      </g>
      {label && t >= label.at && <NPill text={label.text} x={x} y={y + h / 2 + 70} size={46} kind={label.kind ?? 'cyan'} id={`${id}-lbl`} p={clamp01((t - label.at) / 0.3)} />}
    </g>
  );
};

export type ReadingsGraphProps = {
  t: number; at?: number; x: number; y: number; w?: number; h?: number; mode?: 'avg' | 'raw' | 'both'; p?: number; n?: number; seed?: number;
  label?: {text: string; at: number; kind?: PillKind}; out?: number; id: string;
};

export const ReadingsGraph: React.FC<ReadingsGraphProps> = ({t, at, x, y, w = 900, h = 520, mode = 'avg', p = 1, n = 22, seed = 4, label, out, id}) => {
  if (at !== undefined && t < at) return null;
  const g = uid('rgraph', id);
  const q = popAt(t, at);
  const fo = flyOut(t, out, 0, 1);
  if (at !== undefined) cueSfx('pop', `rgraph-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125});
  cueSfx('tick', `rgraph-${id}-draw-${mode}`, p > 0 && p < 1, x, {hit: 0.05, gain: 0.7});
  const x0 = -w / 2 + 80, x1 = w / 2 - 70, y0 = h / 2 - 70, y1 = -h / 2 + 70;
  const X = (i: number) => x0 + ((x1 - x0) * i) / (n - 1);
  const Y = (v: number) => y0 + (y1 - y0) * v;
  const truth = (i: number) => 0.5 + 0.08 * Math.sin(i * 0.33 + seed);
  const reading = (i: number) => truth(i) + (rand(seed * 31 + i) - 0.5) * 0.36;
  const avg = (i: number) => {
    let s = 0, c = 0;
    for (let k = Math.max(0, i - 3); k <= Math.min(n - 1, i + 3); k++) { s += reading(k); c++; }
    return s / c;
  };
  const raw = (i: number) => truth(i) + (reading(i) - truth(i)) * 1.9; // over-reacts to every dot
  const smoothPath = (f: (i: number) => number) => {
    const pts = Array.from({length: n}, (_, i) => [X(i), Y(f(i))]);
    return pts.map(([px, py], i) => {
      if (!i) return `M${px} ${py}`;
      const [qx, qy] = pts[i - 1];
      const mx = (qx + px) / 2;
      return `C${mx} ${qy} ${mx} ${py} ${px} ${py}`;
    }).join(' ');
  };
  const rawPath = Array.from({length: n}, (_, i) => `${i ? 'L' : 'M'}${X(i)} ${Y(raw(i))}`).join(' ');
  const pe = ease.inOut(clamp01(p));
  const showN = pe * n;
  return (
    <g opacity={q.o * fo.o} {...lb('object', id)}>
      <g transform={`translate(${x + fo.dx} ${y + fo.dy}) scale(${q.s})`}>
        <defs><clipPath id={`${g}-draw`}><rect x={-w / 2} y={-h / 2} width={(x1 - x0 + 40) * pe + 70} height={h} /></clipPath></defs>
        <BlueprintPanel w={w} h={h} g={g} t={t}>
          {/* axes */}
          <path d={`M${x0 - 20} ${y1 - 20} V${y0 + 10} H${x1 + 20}`} fill="none" stroke="#BFF3FF" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
        </BlueprintPanel>
        <g clipPath={`url(#${g}-draw)`}>
          {(mode === 'raw' || mode === 'both') && (
            <g>
              <path d={rawPath} fill="none" stroke="#FF2E4D" strokeWidth={18} opacity={0.35} strokeLinejoin="round" />
              <path d={rawPath} fill="none" stroke="#FF6B78" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          )}
          {(mode === 'avg' || mode === 'both') && (
            <g>
              <path d={smoothPath(avg)} fill="none" stroke="#FCC018" strokeWidth={22} opacity={0.35} />
              <path d={smoothPath(avg)} fill="none" stroke={OUT} strokeWidth={14} strokeLinecap="round" />
              <path d={smoothPath(avg)} fill="none" stroke="#FCC018" strokeWidth={8} strokeLinecap="round" />
            </g>
          )}
        </g>
        {Array.from({length: n}, (_, i) => {
          const k = clamp01(showN - i);
          if (k <= 0) return null;
          const s = 0.5 + 0.5 * ease.outBack(k);
          return <circle key={i} cx={X(i)} cy={Y(reading(i))} r={13 * s} fill="#FFFFFF" stroke={OUT} strokeWidth={5} opacity={clamp01(k * 3)} />;
        })}
      </g>
      {label && t >= label.at && <NPill text={label.text} x={x} y={y - h / 2 - 50} size={46} kind={label.kind ?? (mode === 'raw' ? 'red' : 'gold')} id={`${id}-lbl`} p={clamp01((t - label.at) / 0.3)} />}
    </g>
  );
};
