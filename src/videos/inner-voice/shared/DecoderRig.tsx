import React from 'react';
import {getPointAtLength, getLength} from '@remotion/paths';
import {C, FONT_SANS, FONT_SERIF} from '../../../kit/theme';
import {clamp01, ease} from '../../../kit/anim';
import {Person, PersonProps, personHands} from '../../../kit/people';
import {Desk, Plant, Window, Frame} from '../../../kit/env';
import {LightPool} from '../../../kit/fx';
import {Waveform} from '../../../kit/science';
import {textW} from '../../../kit/text';
import {frac} from './util';

export type DecoderRigProps = {
  x: number;
  y: number;
  s?: number;
  t?: number;
  /** decoded sentence typed on the monitor */
  text?: string;
  /** 0→1 typing progress of `text` */
  typeP?: number;
  /** 0→1 plum pulses travel head → cable → screen (and the screen waveform wakes up) */
  signal?: number;
  /** small badge on the screen (e.g. "98%") */
  badge?: string;
  badgeP?: number;
  /** padlock in the screen corner: undefined = none, 0 = open, 1 = closed */
  lock?: number;
  /** 'still' (default) or 'talk' (mouth moves) */
  mouth?: 'still' | 'talk';
  /** dashed plum words floating above the head */
  thought?: string[];
  thoughtP?: number;
  /** dim room lit by the screen */
  night?: boolean;
  /** 'back' = room only · 'front' = chair, person, desk, monitor · 'all' (default) */
  layer?: 'all' | 'back' | 'front';
  /** draw the room behind (default true) */
  room?: boolean;
  /** overrides for the seated person (skin, hair, outfit, expression, …) */
  person?: Partial<PersonProps>;
  seed?: number;
};

// geometry at s=1, origin = floor line under the middle of the rig
const FEET_X = -330;
const DESK_X = 60;
const DESK_W = 440;
const DESK_H = 170;
const SW = 500; // screen
const SH = 300;
const MON_X = 90;
const SCR_BOTTOM = -DESK_H - 56;
const SCR_TOP = SCR_BOTTOM - SH;

const Wheel: React.FC<{cx: number; cy: number; r: number; far?: boolean}> = ({cx, cy, r, far}) => (
  <g transform={`translate(${cx} ${cy})`} opacity={far ? 0.55 : 1}>
    <circle r={r} fill="none" stroke={C.ink} strokeWidth={14} />
    <circle r={r - 14} fill="none" stroke={C.metal} strokeWidth={4} />
    {!far &&
      [0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI;
        return <line key={i} x1={Math.cos(a) * (r - 14)} y1={Math.sin(a) * (r - 14)} x2={-Math.cos(a) * (r - 14)} y2={-Math.sin(a) * (r - 14)} stroke={C.metal} strokeWidth={2.5} opacity={0.8} />;
      })}
    <circle r={12} fill={C.slate} />
  </g>
);

/**
 * DecoderRig — a brain–computer-interface scene: a person seated in a wheelchair (profile, facing right) with an
 * implant pedestal on the head, a cable to a monitor that types the decoded `text`. origin = floor line, rig centre;
 * ≈1100×700 at s=1 (head ≈ y −355, screen spans x −160..340, y −526..−226). Room spans far wider (back layer).
 */
export const DecoderRig: React.FC<DecoderRigProps> = ({
  x,
  y,
  s = 1,
  t = 0,
  text = '',
  typeP = 0,
  signal = 0,
  badge,
  badgeP = 1,
  lock,
  mouth = 'still',
  thought,
  thoughtP = 0,
  night = false,
  layer = 'all',
  room = true,
  person,
  seed = 1,
}) => {
  const showBack = layer !== 'front' && room;
  const showFront = layer !== 'back';
  const sg = clamp01(signal);
  const pp: PersonProps = {
    x: FEET_X,
    y: 0,
    s: 1,
    t,
    sit: 1,
    facing: 1,
    outfit: 'casual',
    hair: 'short',
    skin: 2,
    expression: 'neutral',
    look: 0.4,
    pose: 'idle',
    arms: {front: [8, 72], back: [4, 66]},
    talk: mouth === 'talk' ? Math.abs(Math.sin(t * 9)) : 0,
    seed,
    ...person,
  };
  const head = personHands(pp).head;
  const ped = {x: head.x - 16, y: head.y - 58};
  const cableD = `M${ped.x + 2} ${ped.y - 22} C${ped.x + 10} ${ped.y - 150} ${MON_X - SW / 2 - 120} ${SCR_TOP - 110} ${MON_X - SW / 2 + 6} ${SCR_TOP + 70}`;
  const cableLen = getLength(cableD);

  const wall = night ? C.night : C.paperShade;
  const wains = night ? C.inkSoft : C.paperDeep;
  const floor = night ? C.ink : C.paperDark;

  const back = (
    <g>
      <rect x={-1600} y={-1400} width={3200} height={1400} fill={wall} />
      <rect x={-1600} y={-250} width={3200} height={250} fill={wains} />
      <line x1={-1600} y1={-250} x2={1600} y2={-250} stroke={night ? C.inkLift : C.paperDark} strokeWidth={6} />
      <rect x={-1600} y={0} width={3200} height={600} fill={floor} />
      <line x1={-1600} y1={0} x2={1600} y2={0} stroke={night ? C.inkLift : C.stoneShade} strokeWidth={5} />
      <Window x={-820} y={-430} w={300} h={360} sky={night ? 'night' : 'day'} moon={night} t={t} seed={seed} />
      <Frame x={640} y={-640} w={220} h={160} kind="landscape" />
      <Plant x={560} y={0} kind="tall" t={t} seed={seed + 2} />
      {night && <rect x={-1600} y={-1400} width={3200} height={2000} fill={C.ink} opacity={0.25} />}
    </g>
  );

  // ---- monitor content
  const pad = 30;
  const n = Math.floor(text.length * clamp01(typeP) + 1e-4);
  const shown = text.slice(0, n);
  let size = 40;
  const maxW = SW - pad * 2;
  const words = text.split(' ');
  let lines = [text];
  if (textW(text, size, 'sans', 600) > maxW) {
    const half = Math.ceil(words.length / 2);
    lines = [words.slice(0, half).join(' '), words.slice(half).join(' ')];
    const wMax = Math.max(...lines.map((l) => textW(l, 40, 'sans', 600)));
    size = Math.max(30, Math.min(40, (40 * maxW) / wMax));
  }
  let used = 0;
  let caretLine = lines.length - 1;
  {
    let acc = 0;
    for (let i = 0; i < lines.length; i++) {
      if (n <= acc + lines[i].length) {
        caretLine = i;
        break;
      }
      acc += lines[i].length + 1;
    }
  }
  const caretOn = typeP > 0 && typeP < 1 ? true : Math.sin(t * 6) > 0;
  const bp = ease.outBack(clamp01(badgeP));

  const screen = (
    <g transform={`translate(${MON_X - SW / 2} ${SCR_TOP})`}>
      {/* stand */}
      <rect x={SW / 2 - 16} y={SH + 10} width={32} height={50} fill={C.slate} />
      <rect x={SW / 2 - 80} y={SH + 50} width={160} height={10} rx={5} fill={C.slate} />
      {/* bezel + glass */}
      <rect x={-14} y={-14} width={SW + 28} height={SH + 28} rx={16} fill={C.ink} />
      <rect x={0} y={0} width={SW} height={SH} rx={6} fill={C.inkSoft} />
      {/* waveform strip */}
      <rect x={pad - 8} y={24} width={SW - pad * 2 + 16 - (lock !== undefined ? 70 : 0)} height={96} rx={8} fill={C.ink} opacity={0.6} />
      <Waveform x={pad} y={72} w={SW - pad * 2 - (lock !== undefined ? 70 : 0)} amp={10 + 28 * sg} t={t} kind="eeg" color={C.theoryLight} width={4} seed={seed} speed={90 + 80 * sg} />
      {/* decoded text */}
      {lines.map((ln, i) => {
        const part = shown.slice(used, used + ln.length);
        used += ln.length + 1;
        const yy = 196 + i * size * 1.2 - (lines.length - 1) * size * 0.5;
                const wPart = textW(part, size, 'sans', 600) * 0.93;
        return (
          <g key={i}>
            <text x={pad} y={yy} fontFamily={FONT_SANS} fontWeight={600} fontSize={size} fill={C.paperLight}>
              {part}
            </text>
            {i === caretLine && caretOn && typeP > 0 && (
              <rect x={pad + wPart + 6} y={yy - size * 0.78} width={size * 0.45} height={size * 0.9} fill={C.theoryLight} opacity={0.9} />
            )}
          </g>
        );
      })}
      {/* badge */}
      {badge && badgeP > 0 && (
        <g transform={`translate(${SW - pad - 10} ${SH - 46}) scale(${bp})`}>
          <rect x={-textW(badge, 30, 'sans', 700) - 30} y={-24} width={textW(badge, 30, 'sans', 700) + 40} height={48} rx={24} fill={C.evidence} />
          <text x={-textW(badge, 30, 'sans', 700) / 2 - 10} y={11} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={30} fill={C.paperLight}>
            {badge}
          </text>
        </g>
      )}
      {/* padlock (user-held password) */}
      {lock !== undefined && (
        <g transform={`translate(${SW - pad - 22} 70)`}>
          <path
            d="M-12 -4 L-12 -18 A12 12 0 0 1 12 -18 L12 -4"
            fill="none"
            stroke={C.cautionLight}
            strokeWidth={5}
            strokeLinecap="round"
            transform={`translate(0 ${-10 * (1 - clamp01(lock))}) rotate(${-28 * (1 - clamp01(lock))} 12 -4)`}
          />
          <rect x={-18} y={-6} width={36} height={28} rx={5} fill={C.caution} />
          <circle cx={0} cy={6} r={4} fill={C.ink} />
        </g>
      )}
      {/* glass sheen */}
      <path d={`M0 0 L${SW * 0.22} 0 L0 ${SH * 0.4} Z`} fill={C.paperLight} opacity={0.05} />
    </g>
  );

  // pulses along the cable
  const pulses = sg > 0
    ? [0, 1, 2, 3].map((i) => {
        const u = frac(t * 0.55 + i / 4);
        if (u > sg * 1.05) return null;
        const pt = getPointAtLength(cableD, u * cableLen);
        if (!pt) return null;
        const o = sg * Math.min(1, u / 0.08, (1 - u) / 0.08);
        return (
          <g key={i} opacity={o}>
            <circle cx={pt.x} cy={pt.y} r={16} fill={C.theoryLight} opacity={0.3} />
            <circle cx={pt.x} cy={pt.y} r={8} fill={night ? C.theoryTint : C.theoryLight} />
          </g>
        );
      })
    : null;

  // thoughts (dashed plum words above the head)
  const thoughtEl = () => {
    if (!thought?.length || thoughtP <= 0) return null;
    const tc = night ? C.theoryLight : C.theory;
    const tsz = 46;
    const gap = 24;
    const ws = thought.map((w) => textW(w, tsz, 'serif', 500));
    const total = ws.reduce((a, b) => a + b, 0) + gap * (thought.length - 1);
    let cx = head.x - total / 2 - 40;
    const ty = head.y - 260;
    const nn = thought.length;
    const dots = [0, 1, 2].map((i) => ({x: head.x - 40 - i * 34, y: head.y - 96 - i * 40, r: 7 + i * 4}));
    return (
      <g>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="none" stroke={tc} strokeWidth={3} strokeDasharray="5 4" opacity={clamp01(thoughtP * 4 - i * 0.6)} />
        ))}
        {thought.map((w, i) => {
          const a = (i / nn) * 0.6;
          const k = ease.out(clamp01((thoughtP - a) / 0.4));
          const wx = cx;
          cx += ws[i] + gap;
          const fy = ty + Math.sin(t * 1.4 + i * 1.7) * 6 + (1 - k) * 24 - (i % 2) * 10;
          return (
            <g key={i} opacity={k}>
              <text x={wx} y={fy} fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={500} fontSize={tsz} fill={tc}>
                {w}
              </text>
              <line x1={wx} y1={fy + 12} x2={wx + ws[i]} y2={fy + 12} stroke={tc} strokeWidth={3} strokeDasharray="9 7" strokeLinecap="round" />
            </g>
          );
        })}
      </g>
    );
  };

  const hipX = FEET_X - 104;
  const front = (
    <g>
      {/* screen light on the floor/desk */}
      {/* wheelchair: far side */}
      <Wheel cx={hipX - 10} cy={-92} r={92} far />
      <path d={`M${hipX - 72} -112 L${hipX - 92} -340 L${hipX - 132} -344`} stroke={C.slate} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x={hipX - 92} y={-330} width={34} height={200} rx={12} fill={C.inkLift} transform={`rotate(-5 ${hipX - 75} -230)`} />
      {/* person */}
      <Person {...pp} />
      {/* implant pedestal + glow */}
      <circle cx={ped.x} cy={ped.y + 10} r={30} fill={C.theoryLight} opacity={0.35 * sg * (0.6 + 0.4 * Math.sin(t * 5))} />
      <g transform={`translate(${ped.x} ${ped.y}) rotate(-12)`}>
        <rect x={-22} y={-6} width={44} height={12} rx={4} fill={C.stoneDark} />
        <path d="M-15 -6 C-15 -26 15 -26 15 -6 Z" fill={C.metal} />
        <circle cx={0} cy={-13} r={4.5} fill={C.theoryLight} opacity={0.5 + 0.5 * Math.max(sg, 0.5 + 0.5 * Math.sin(t * 4))} />
      </g>
      {/* wheelchair: near side */}
      <path d={`M${hipX - 80} -108 L${FEET_X + 6} -108 L${FEET_X + 40} -22`} stroke={C.slate} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x={FEET_X + 10} y={-24} width={70} height={10} rx={4} fill={C.slate} />
      <Wheel cx={hipX - 10} cy={-92} r={92} />
      <circle cx={hipX - 10} cy={-92} r={70} fill="none" stroke={C.stoneDark} strokeWidth={4} />
      <line x1={FEET_X - 20} y1={-108} x2={FEET_X - 20} y2={-40} stroke={C.slate} strokeWidth={7} />
      <circle cx={FEET_X - 20} cy={-20} r={20} fill={C.ink} />
      <circle cx={FEET_X - 20} cy={-20} r={7} fill={C.metal} />
      {/* desk */}
      <Desk x={DESK_X} y={0} w={DESK_W} h={DESK_H} color={C.woodLight} />
      {/* cable */}
      <path d={cableD} stroke={C.inkLift} strokeWidth={8} fill="none" strokeLinecap="round" />
      {night && <rect x={-1600} y={-1400} width={3200} height={2000} fill={C.ink} opacity={0.32} />}
      {night && <LightPool x={MON_X - 120} y={(SCR_TOP + SCR_BOTTOM) / 2 + 40} r={460} color={C.theoryTint} strength={0.45} sy={0.8} />}
      {screen}
      {pulses}
      {thoughtEl()}
    </g>
  );

  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {showBack && back}
      {showFront && front}
    </g>
  );
};

/** Approximate head centre of the seated person at s=1 (rig-local coords) — for camera targets / overlays. */
export const DECODER_HEAD = {x: FEET_X - 104, y: -354};
