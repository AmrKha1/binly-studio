import React from 'react';
import {clamp01, ease, lerp, popIn, spring} from './anim';
import {cueSfx} from './sfx';

// MOTION PRESETS — the channel's juicy-but-elegant movement vocabulary (owner, 2026-10-20: "the pop-up and bounce is so
// good — everywhere, and more like it, all smooth"). Classic motion-design entrances / attention moves (the Animate.css
// family: bounceIn, backIn*, jackInTheBox, flipIn, rubberBand, heartBeat, tada, wobble, shakeX …) rebuilt on a real
// damped spring so everything lands softly. Every preset also cues its own sound effect (auto-SFX).
//
//   <Enter kind="pop" p={ramp(t, 3.2, 3.9, ease.linear)} x={640} y={500}>…your element drawn around (x, y)…</Enter>
//   <Attention kind="heartBeat" t={t} at={8.4} x={640} y={500}>…</Attention>
//   <Exit kind="popOut" p={ramp(t, 12, 12.4, ease.linear)} x={640} y={500}>…</Exit>
// p must be LINEAR progress 0→1 (the preset does the easing). (x, y) = the pivot (usually the element's centre;
// for drop/jack use its bottom). Keep entrances 0.5–0.9 s, attention moves 0.6–1.3 s.

export type EnterKind = 'pop' | 'bounceDrop' | 'backInUp' | 'backInDown' | 'backInLeft' | 'backInRight' | 'jackInTheBox' | 'flipIn' | 'zoomSpin' | 'whipLeft' | 'whipRight' | 'rise' | 'stamp';
const ENTER_SFX: Record<EnterKind, string> = {
  pop: 'popup', bounceDrop: 'thump', backInUp: 'swoosh', backInDown: 'swoosh', backInLeft: 'swoosh', backInRight: 'swoosh',
  jackInTheBox: 'popup', flipIn: 'card', zoomSpin: 'whoosh', whipLeft: 'swish', whipRight: 'swish', rise: 'swish', stamp: 'stamp',
};

type T = {dx: number; dy: number; sx: number; sy: number; rot: number; o: number};
const ID: T = {dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, o: 1};

/** Transform for an entrance at linear progress p (0 → hidden, 1 → at rest). Pure. */
export const enterT = (kind: EnterKind, p: number): T => {
  const x = clamp01(p);
  if (x >= 1) return ID;
  switch (kind) {
    case 'pop': {
      const q = popIn(x, 0.45, 0.25);
      return {dx: 0, dy: 0, sx: q.sx, sy: q.sy, rot: 0, o: q.o};
    }
    case 'bounceDrop': {
      // falls in from above, bounces twice on the floor, squashes on each impact
      const k = spring(x, 0.65);
      const dy = -(1 - k) * 320;
      const impact = Math.min(0.14, Math.max(0, k - 1) * 0.8); // gentle squash while it overshoots the floor
      return {dx: 0, dy, sx: 1 + impact, sy: 1 - impact, rot: 0, o: clamp01(x * 5)};
    }
    case 'backInUp':
    case 'backInDown':
    case 'backInLeft':
    case 'backInRight': {
      // travels in small (0.7) from off-place, then grows to full size with a soft overshoot
      const travel = ease.outQuint(clamp01(x / 0.6));
      const grow = spring(clamp01((x - 0.45) / 0.55), 0.35);
      const d = (1 - travel) * 420;
      const s = lerp(0.7, 1, grow);
      return {
        dx: kind === 'backInLeft' ? -d : kind === 'backInRight' ? d : 0,
        dy: kind === 'backInUp' ? d : kind === 'backInDown' ? -d : 0,
        sx: s, sy: s, rot: 0, o: clamp01(x * 3),
      };
    }
    case 'jackInTheBox': {
      // springs up from the pivot (bottom) with a wobbling twist
      const k = spring(x, 0.5);
      const rot = 30 * Math.exp(-5 * x) * Math.cos(x * 16);
      return {dx: 0, dy: 0, sx: lerp(0.1, 1, k), sy: lerp(0.1, 1, k), rot, o: clamp01(x * 4)};
    }
    case 'flipIn': {
      // card flip toward the viewer: width opens from 0 with a springy overshoot
      const k = spring(x, 0.45);
      return {dx: 0, dy: 0, sx: Math.max(0.001, k), sy: 1 + (1 - Math.min(1, k)) * 0.06, rot: 0, o: clamp01(x * 4)};
    }
    case 'zoomSpin': {
      const k = spring(x, 0.3);
      return {dx: 0, dy: 0, sx: k, sy: k, rot: -160 * (1 - ease.outQuint(x)), o: clamp01(x * 4)};
    }
    case 'whipLeft':
    case 'whipRight': {
      // fast smear in from the side (stretched), snaps into place with a squash
      const k = spring(x, 0.4);
      const dir = kind === 'whipLeft' ? -1 : 1;
      const v = 1 - Math.min(1, k);
      return {dx: dir * v * 700, dy: 0, sx: 1 + Math.abs(v) * 0.6 + Math.max(0, k - 1) * -2, sy: 1 - Math.abs(v) * 0.25 + Math.max(0, k - 1) * 2, rot: 0, o: clamp01(x * 4)};
    }
    case 'stamp': {
      // slams down from big, lands with a tiny bounce
      const k = spring(x, 0.3);
      const s = lerp(2.2, 1, k);
      return {dx: 0, dy: 0, sx: s, sy: s, rot: -6 * (1 - k), o: clamp01(x * 4)};
    }
    case 'rise':
    default: {
      const k = ease.outQuint(x);
      return {dx: 0, dy: (1 - k) * 60, sx: 1, sy: 1, rot: 0, o: clamp01(x * 2)};
    }
  }
};

const apply = (t: T, x: number, y: number) =>
  `translate(${x + t.dx} ${y + t.dy}) rotate(${t.rot}) scale(${t.sx} ${t.sy}) translate(${-x} ${-y})`;

/** Entrance wrapper. Children are drawn in normal scene coords; (x, y) is the pivot. */
export const Enter: React.FC<{kind?: EnterKind; p: number; x: number; y: number; sfx?: boolean; id?: string; children?: React.ReactNode}> = ({kind = 'pop', p, x, y, sfx = true, id, children}) => {
  if (p <= 0) return null;
  if (sfx) cueSfx(ENTER_SFX[kind], `enter-${id ?? ''}@${Math.round(x)},${Math.round(y)}`, true, x);
  const tr = enterT(kind, p);
  return (
    <g transform={apply(tr, x, y)} opacity={tr.o}>
      {children}
    </g>
  );
};

export type ExitKind = 'popOut' | 'shrink' | 'flyUp' | 'flyDown' | 'fade';
/** Exit wrapper: p 0 → at rest, 1 → gone. */
export const Exit: React.FC<{kind?: ExitKind; p: number; x: number; y: number; children?: React.ReactNode}> = ({kind = 'popOut', p, x, y, children}) => {
  const k = clamp01(p);
  if (k >= 1) return null;
  if (k <= 0) return <>{children}</>;
  let tr: T = ID;
  if (kind === 'popOut') {
    const s = k < 0.3 ? lerp(1, 1.12, ease.out(k / 0.3)) : lerp(1.12, 0, ease.in((k - 0.3) / 0.7));
    tr = {...ID, sx: s, sy: s, o: 1 - clamp01((k - 0.5) / 0.5)};
  } else if (kind === 'shrink') tr = {...ID, sx: 1 - ease.in(k), sy: 1 - ease.in(k), o: 1 - k};
  else if (kind === 'flyUp' || kind === 'flyDown') {
    const back = k < 0.25 ? ease.out(k / 0.25) * 20 : 20 - ease.in((k - 0.25) / 0.75) * 520;
    tr = {...ID, dy: (kind === 'flyUp' ? -1 : 1) * -back, o: 1 - clamp01((k - 0.4) / 0.6)};
  } else tr = {...ID, o: 1 - k};
  return (
    <g transform={apply(tr, x, y)} opacity={tr.o}>
      {children}
    </g>
  );
};

export type AttentionKind = 'rubberBand' | 'heartBeat' | 'tada' | 'wobble' | 'shake' | 'pulse' | 'jello' | 'float';
const ATT_DUR: Record<AttentionKind, number> = {rubberBand: 0.9, heartBeat: 1.3, tada: 1.0, wobble: 1.0, shake: 0.7, pulse: 1.2, jello: 0.9, float: Infinity};
const ATT_SFX: Partial<Record<AttentionKind, string>> = {rubberBand: 'blip', heartBeat: 'heartbeat', tada: 'win', wobble: 'blip', shake: 'error', jello: 'blip'};

/** Transform for an attention move, u = seconds since it started. Pure. */
export const attentionT = (kind: AttentionKind, u: number): T => {
  if (u <= 0) return ID;
  const D = ATT_DUR[kind];
  if (u >= D) return kind === 'float' ? attentionT('float', u) : ID;
  const x = u / D;
  const decay = 1 - x;
  switch (kind) {
    case 'rubberBand': {
      const a = Math.sin(x * Math.PI * 4) * 0.25 * decay;
      return {...ID, sx: 1 + a, sy: 1 - a};
    }
    case 'heartBeat': {
      const beat = (c: number) => Math.max(0, 1 - Math.abs(x - c) / 0.12);
      const s = 1 + 0.16 * (beat(0.14) + beat(0.42));
      return {...ID, sx: s, sy: s};
    }
    case 'tada': {
      const s = x < 0.15 ? lerp(1, 0.92, x / 0.15) : 1 + 0.1 * Math.sin(Math.min(1, (x - 0.15) / 0.2) * Math.PI / 2) * (x < 0.85 ? 1 : (1 - x) / 0.15);
      const rot = x > 0.15 && x < 0.85 ? Math.sin(x * Math.PI * 10) * 3 : 0;
      return {...ID, sx: s, sy: s, rot};
    }
    case 'wobble':
      return {...ID, dx: Math.sin(x * Math.PI * 5) * 40 * decay, rot: Math.sin(x * Math.PI * 5) * 5 * decay};
    case 'shake':
      return {...ID, dx: Math.sin(x * Math.PI * 10) * 18 * decay};
    case 'pulse': {
      const s = 1 + 0.06 * Math.sin(x * Math.PI);
      return {...ID, sx: s, sy: s};
    }
    case 'jello': {
      const a = Math.sin(x * Math.PI * 6) * 9 * decay;
      return {...ID, rot: a * 0.3, sx: 1 + a / 120, sy: 1 - a / 120};
    }
    case 'float':
    default:
      return {...ID, dy: Math.sin(u * 2) * 8};
  }
};

/** Attention wrapper: plays `kind` starting at `at` (absolute seconds). (x, y) = pivot. */
export const Attention: React.FC<{kind: AttentionKind; t: number; at: number; x: number; y: number; sfx?: boolean; children?: React.ReactNode}> = ({kind, t, at, x, y, sfx = true, children}) => {
  const u = t - at;
  if (sfx && ATT_SFX[kind]) cueSfx(ATT_SFX[kind]!, `att-${kind}@${at}`, u >= 0 && u < ATT_DUR[kind], x);
  const tr = attentionT(kind, u);
  return <g transform={apply(tr, x, y)}>{children}</g>;
};
