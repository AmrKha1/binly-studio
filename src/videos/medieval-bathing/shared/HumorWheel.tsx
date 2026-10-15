import React from 'react';
import {C, FONT_SANS} from '../../../kit/theme';
import {clamp01, ease, lerp} from '../../../kit/anim';
import {mix} from './util';

export type HumorWheelProps = {
  x?: number;
  y?: number;
  s?: number;
  /** pop-in per humor [blood, phlegm, yellow bile, black bile] 0..1 */
  reveal?: [number, number, number, number];
  /** axes + HOT/COLD/WET/DRY labels draw on */
  axesP?: number;
  /** 0 blood · 1 phlegm · 2 yellow bile · 3 black bile — glows, others dim */
  highlight?: number;
  /** centre balance: 1 = level, 0 = tilted by `tilt` */
  balance?: number;
  /** imbalance direction −1..1 (sign = which pan drops) */
  tilt?: number;
  /** warm arrow pushing toward HOT + WET (blood quadrant) */
  heatArrow?: number;
  /** on an ink panel */
  dark?: boolean;
  /** whole-wheel entrance */
  p?: number;
  t?: number;
};

const R = 330;
// quadrants: HOT left, COLD right, WET top, DRY bottom (screen angles, degrees, 0 = right, clockwise)
const HUM = [
  {name: 'BLOOD', a0: 180, a1: 270, wedge: C.oxTint, drop: C.oxblood},
  {name: 'PHLEGM', a0: 270, a1: 360, wedge: mix(C.paperLight, C.slate, 0.12), drop: mix(C.paperShade, C.slate, 0.45)},
  {name: 'YELLOW BILE', a0: 90, a1: 180, wedge: C.cautionTint, drop: C.caution},
  {name: 'BLACK BILE', a0: 0, a1: 90, wedge: mix(C.paperShade, C.ink, 0.3), drop: C.ink},
];
const rad = (d: number) => (d * Math.PI) / 180;
const pol = (r: number, d: number): [number, number] => [r * Math.cos(rad(d)), r * Math.sin(rad(d))];

const Drop: React.FC<{x: number; y: number; r: number; color: string}> = ({x, y, r, color}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M0 ${-r * 1.9} C${r * 0.55} ${-r} ${r} ${-r * 0.35} ${r} ${r * 0.15} A${r} ${r} 0 0 1 ${-r} ${r * 0.15} C${-r} ${-r * 0.35} ${-r * 0.55} ${-r} 0 ${-r * 1.9} Z`} fill={color} />
    <path d={`M${r * 0.15} ${r * 0.15} A${r * 0.85} ${r * 0.85} 0 0 1 ${-r * 0.7} ${r * 0.62} A${r} ${r} 0 0 0 ${r} ${r * 0.15} Z`} fill={C.ink} opacity={0.18} />
    <ellipse cx={-r * 0.4} cy={-r * 0.2} rx={r * 0.18} ry={r * 0.32} fill={C.paperLight} opacity={0.55} transform={`rotate(20 ${-r * 0.4} ${-r * 0.2})`} />
  </g>
);

/**
 * HumorWheel — the four humors on HOT↔COLD (horizontal) × WET↔DRY (vertical) axes.
 * Origin = centre, radius ≈ 330 at s=1 (axis labels reach ≈ ±470 x, ±420 y).
 * Blood = hot+wet (top-left), phlegm = cold+wet (top-right), yellow bile = hot+dry (bottom-left), black bile = cold+dry (bottom-right).
 */
export const HumorWheel: React.FC<HumorWheelProps> = ({
  x = 960,
  y = 540,
  s = 1,
  reveal = [1, 1, 1, 1],
  axesP = 1,
  highlight,
  balance = 1,
  tilt = 1,
  heatArrow = 0,
  dark = false,
  p = 1,
  t = 0,
}) => {
  if (p <= 0) return null;
  const pe = ease.out(clamp01(p));
  const ax = clamp01(axesP);
  const txt = dark ? C.paperLight : C.ink;
  const axisCol = dark ? C.paperDark : C.inkMute;
  const hub = dark ? C.inkLift : C.paperLight;
  const ang = (1 - clamp01(balance)) * Math.max(-1, Math.min(1, tilt)) * 22 + Math.sin(t * 1.4) * 1.2;
  const L = R + 70;
  const axLen = (L * 2) * ease.inOut(ax);
  const labels: [string, number, number, string, 'start' | 'end' | 'middle'][] = [
    ['HOT', -L - 18, 9, C.oxLight, 'end'],
    ['COLD', L + 18, 9, dark ? C.theoryTint : C.slate, 'start'],
    ['WET', 0, -L - 18, dark ? C.evidenceTint : C.waterDeep, 'middle'],
    ['DRY', 0, L + 42, C.caution, 'middle'],
  ];
  const ha = ease.out(clamp01(heatArrow)) * (1 + Math.sin(t * 3) * 0.03);
  return (
    <g transform={`translate(${x} ${y}) scale(${s * lerp(0.92, 1, pe)})`} opacity={pe}>
      {/* axes */}
      {ax > 0 && (
        <g stroke={axisCol} strokeWidth={4} strokeLinecap="round" fill="none">
          <path d={`M${-axLen / 2} 0 L${axLen / 2} 0`} />
          <path d={`M0 ${-axLen / 2} L0 ${axLen / 2}`} />
          <g opacity={ax > 0.9 ? (ax - 0.9) * 10 : 0}>
            <path d={`M${-L + 16} -12 L${-L} 0 L${-L + 16} 12`} />
            <path d={`M${L - 16} -12 L${L} 0 L${L - 16} 12`} />
            <path d={`M-12 ${-L + 16} L0 ${-L} L12 ${-L + 16}`} />
            <path d={`M-12 ${L - 16} L0 ${L} L12 ${L - 16}`} />
          </g>
        </g>
      )}
      {labels.map(([tx, lx, ly, col, an], i) => {
        const a = clamp01(ax * 2.2 - 1 - i * 0.12);
        return a > 0 ? (
          <text key={tx} x={lx} y={ly} textAnchor={an} fontFamily={FONT_SANS} fontWeight={800} fontSize={28} letterSpacing={3} fill={col} opacity={a}>
            {tx}
          </text>
        ) : null;
      })}

      {/* wedges */}
      {HUM.map((hm, i) => {
        const rv = clamp01(reveal[i] ?? 0);
        if (rv <= 0) return null;
        const sc = ease.outBack(rv);
        const on = highlight === undefined || highlight === i;
        const hi = highlight === i;
        const mid = (hm.a0 + hm.a1) / 2;
        const g = 7;
        const [cx, cy] = pol(g * 1.41, mid);
        const r0 = 104;
        const [ax0, ay0] = pol(R, hm.a0);
        const [ax1, ay1] = pol(R, hm.a1);
        const [ix0, iy0] = pol(r0, hm.a0);
        const [ix1, iy1] = pol(r0, hm.a1);
        const [dx, dy] = pol(R * 0.6, mid);
        const bob = Math.sin(t * 1.5 + i * 1.7) * 4;
        const dark4 = i === 3;
        return (
          <g key={hm.name} transform={`translate(${cx * (hi ? 3 : 1)} ${cy * (hi ? 3 : 1)}) translate(${dx} ${dy}) scale(${sc * (hi ? 1.05 : 1)}) translate(${-dx} ${-dy})`} opacity={(on ? 1 : 0.32) * clamp01(rv * 3)}>
            <path d={`M${ix0} ${iy0} L${ax0} ${ay0} A${R} ${R} 0 0 1 ${ax1} ${ay1} L${ix1} ${iy1} A${r0} ${r0} 0 0 0 ${ix0} ${iy0} Z`} fill={hm.wedge} stroke={hi ? C.oxblood : dark ? C.inkSoft : C.paperDeep} strokeWidth={hi ? 7 : 4} strokeLinejoin="round" />
            <Drop x={dx} y={dy - 22 + bob} r={34} color={hm.drop} />
            <text x={dx} y={dy + 52} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={26} letterSpacing={1.5} fill={dark4 ? C.paperLight : C.ink}>
              {hm.name}
            </text>
          </g>
        );
      })}

      {/* heat arrow toward HOT + WET */}
      {ha > 0 && (
        <g transform={`rotate(225)`} opacity={clamp01(ha * 3)}>
          <path
            d={`M120 -13 L${lerp(120, R + 20, ha) - 30} -13 L${lerp(120, R + 20, ha) - 30} -30 L${lerp(120, R + 20, ha) + 18} 0 L${lerp(120, R + 20, ha) - 30} 30 L${lerp(120, R + 20, ha) - 30} 13 L120 13 Z`}
            fill={C.fire}
            stroke={dark ? C.ink : C.paperLight}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* centre: balance */}
      <circle r={92} fill={hub} stroke={dark ? C.paperDark : C.ink} strokeWidth={4} />
      <g stroke={dark ? C.paperLight : C.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M-22 48 L0 6 L22 48 Z" fill={dark ? C.paperLight : C.ink} />
        <g transform={`rotate(${ang} 0 6)`}>
          <path d="M-62 6 L62 6" />
          {[-1, 1].map((sd) => (
            <g key={sd} transform={`translate(${sd * 58} 6) rotate(${-ang})`}>
              <path d="M0 0 L-14 26 M0 0 L14 26" strokeWidth={3} />
              <path d="M-20 26 L20 26 Q0 42 -20 26 Z" fill={sd < 0 ? C.oxTint : C.paperShade} strokeWidth={3} />
            </g>
          ))}
        </g>
        <circle cx={0} cy={6} r={6} fill={C.oxblood} stroke="none" />
      </g>
    </g>
  );
};
