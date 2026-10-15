import React from 'react';
import {C, FONT_SANS} from '../../../kit/theme';
import {clamp01, ease, lerp} from '../../../kit/anim';
import {mix} from './util';

/** 0..1 flash level of the beeper at time t (LCD blinks and fades over ~1 s after each beep). */
export const beepFlash = (t: number, beepAt: number[] = []) => {
  let v = 0;
  for (const b of beepAt) {
    const dt = t - b;
    if (dt < 0 || dt > 1.1) continue;
    const env = dt < 0.06 ? dt / 0.06 : 1 - ease.inOutSine(clamp01((dt - 0.06) / 1.04));
    v = Math.max(v, env * (0.65 + 0.35 * Math.cos(dt * Math.PI * 2 * 3)));
  }
  return clamp01(v);
};

export type BeeperProps = {
  x: number;
  y: number;
  s?: number;
  /** rotation in degrees */
  r?: number;
  /** entrance 0→1 (rise + settle) */
  p?: number;
  t?: number;
  /** times (s) when it beeps: LCD flash, rings pulse out, small shake */
  beepAt?: number[];
  /** LCD text (default "BEEP" while beeping, else blank) */
  lcd?: string;
  /** ring colour (default theory plum; pass C.oxblood for the key beat) */
  ringColor?: string;
  tone?: 'paper' | 'ink';
  /** show the belt clip (default true) */
  clip?: boolean;
};

/**
 * Beeper — a 1990s pager in 3/4 front view (experience sampling). origin = centre, ≈260×170 at s=1.
 * beepAt → LCD flash + 3 rings + small shake (use `beepFlash(t, beepAt)` to sync the rest of the shot).
 */
export const Beeper: React.FC<BeeperProps> = ({x, y, s = 1, r = 0, p = 1, t = 0, beepAt = [], lcd, ringColor, tone = 'paper', clip = true}) => {
  if (p <= 0) return null;
  const ink = tone === 'ink';
  const pe = ease.outQuint(clamp01(p));
  const fl = beepFlash(t, beepAt);
  // shake: decaying wiggle after the latest beep
  let shake = 0;
  let rings: {k: number}[] = [];
  for (const b of beepAt) {
    const dt = t - b;
    if (dt >= 0 && dt < 0.6) shake += Math.sin(dt * 70) * (1 - dt / 0.6) * 3.2;
    for (let i = 0; i < 3; i++) {
      const k = (dt - i * 0.22) / 1.1;
      if (k > 0 && k < 1) rings.push({k});
    }
  }
  rings = rings.slice(-6);
  const rc = ringColor ?? (ink ? C.theoryLight : C.theory);
  const body = C.inkSoft;
  const side = C.ink;
  const lit = fl > 0.02;
  const lcdBg = mix(C.evidenceTint, C.lamp, fl * 0.75);
  const text = lcd ?? (lit ? 'BEEP' : '');
  const idle = Math.sin(t * 1.3) * 0.8;

  return (
    <g transform={`translate(${x} ${y + (1 - pe) * 40}) rotate(${r + shake + idle * 0.3}) scale(${s * lerp(0.9, 1, pe)})`} opacity={pe}>
      {/* rings (behind) */}
      {rings.map((g, i) => (
        <rect
          key={i}
          x={-130 - g.k * 120}
          y={-85 - g.k * 120}
          width={260 + g.k * 240}
          height={170 + g.k * 240}
          rx={30 + g.k * 120}
          fill="none"
          stroke={rc}
          strokeWidth={6 * (1 - g.k) + 2}
          opacity={(1 - g.k) * 0.85}
        />
      ))}
      {/* belt clip peeking behind the top */}
      {clip && <path d="M-70 -92 L60 -92 Q74 -92 74 -78 L74 -60 L-84 -60 L-84 -78 Q-84 -92 -70 -92 Z" fill={C.stoneDark} />}
      {/* side thickness (3/4 view: right + bottom) */}
      <rect x={-118} y={-74} width={258} height={168} rx={30} fill={side} />
      {/* front face */}
      <rect x={-130} y={-85} width={250} height={162} rx={28} fill={body} stroke={ink ? C.inkMute : 'none'} strokeWidth={ink ? 3 : 0} />
      {/* top highlight strip */}
      <path d="M-106 -76 L96 -76" stroke={C.inkMute} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      {/* LCD bezel + screen */}
      <rect x={-108} y={-56} width={172} height={74} rx={10} fill={side} />
      <rect x={-100} y={-48} width={156} height={58} rx={6} fill={lcdBg} />
      <path d="M-100 -48 L-60 -48 L-100 -8 Z" fill={C.paperLight} opacity={0.18} />
      {text && (
        <text x={-22} y={-8} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={34} letterSpacing={3} fill={C.ink} opacity={lit || lcd ? 0.88 : 0}>
          {text}
        </text>
      )}
      {/* button */}
      <circle cx={92} cy={-18} r={17} fill={side} />
      <circle cx={92} cy={-20} r={13} fill={lit ? C.oxLight : C.inkMute} />
      {/* speaker grille + brand line */}
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={-96} y1={36 + i * 9} x2={-30} y2={36 + i * 9} stroke={side} strokeWidth={4} strokeLinecap="round" />
      ))}
      <rect x={10} y={40} width={58} height={10} rx={5} fill={C.inkMute} opacity={0.8} />
      {/* LED */}
      <circle cx={92} cy={44} r={7} fill={lit ? C.oxLight : C.inkLift} />
      {lit && <circle cx={92} cy={44} r={14} fill={C.oxLight} opacity={0.3 * fl} />}
    </g>
  );
};
