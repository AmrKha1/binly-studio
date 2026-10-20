import React from 'react';
import {clamp01, ease, lerp, spring} from './anim';
import {cueSfx} from './sfx';

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// CODE-DRAWN AZTIKA — fallback until his illustrated pose sheet exists (the hosts are image-based: kit/image-host).
// AZTIKA details: A friendly Aztec storyteller who talks to the
// viewer: points at things, presents, shrugs, thinks, reacts. MODERATE, MEANINGFUL animation (owner 2026-10-20): alive
// (breathing, sway, head tilt, nods while talking, hands drifting, poses gliding on a spring, blinking, lip movement),
// never jumpy for no reason. HOW MUCH and WHERE is the video director's choice: `life` 0 still · 1 natural (default) ·
// 2 lively; move him (x/y), wrap him in kit/motion Enter/Attention/Exit for a jump-in, a tada, a shake, an exit. Drawn in code from the owner's reference illustration (white head, feather
// headdress, gold & turquoise jewellery, cream tunic with red belt, cape, stick limbs, sandals).
//
//   <Host t={t} x={300} y={1000} s={1}
//     poses={[[0, 'idle'], [42.1, 'pointRight'], [46.8, 'shrug']]}          // [time, pose]
//     faces={[[0, 'neutral'], [42.1, 'surprised'], [44, 'happy']]}         // [time, expression]
//     talk={speaking(t)} />                                                 // 0..1 mouth (see `talkFrom`)
// (x, y) = the point between his feet on the ground. s=1 → ~800 px tall (headdress tip to sandals).
// Poses: idle · pointLeft · pointRight · present · presentRight · shrug · think · wave · thumbsUp · surprised · explain ·
// count (holds up one finger) · handsOnHips.  Faces: neutral · happy · surprised · thinking · worried · excited · wink.
// In Arabic videos the Stage mirrors the scene, so "pointRight" always points toward the layout's right side as drawn.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

export type HostPose = 'idle' | 'pointLeft' | 'pointRight' | 'present' | 'presentRight' | 'shrug' | 'think' | 'wave' | 'thumbsUp' | 'surprised' | 'explain' | 'count' | 'handsOnHips';
export type HostFace = 'neutral' | 'happy' | 'surprised' | 'thinking' | 'worried' | 'excited' | 'wink';
type Hand = 'open' | 'point' | 'fist' | 'thumb' | 'palmUp';

const INK = '#2B2420';
const COL = {
  skin: '#FFFFFF',
  gold: '#D8A93C',
  goldDeep: '#A87B1F',
  turq: '#2E9C8F',
  turqLight: '#6CC4B8',
  red: '#A8382B',
  redDeep: '#7E2A20',
  cream: '#F3E6C8',
  creamShade: '#E3D0A6',
  green: '#4E9A4B',
  greenDeep: '#2F6E3A',
  teal: '#2F8C83',
  orange: '#D9822B',
  sandal: '#8A5A36',
  mouth: '#5A1A12',
  tongue: '#E07A6E',
};

// arm = [upper-arm angle, forearm angle, hand shape, hand rotation offset]; angles in degrees, screen coords
// (0° = right, 90° = down). L = arm on the screen-left side, R = screen-right side.
type Arm = [number, number, Hand, number];
const POSES: Record<HostPose, {L: Arm; R: Arm; lean: number}> = {
  idle: {L: [104, 96, 'open', 0], R: [76, 84, 'open', 0], lean: 0},
  pointLeft: {L: [192, 182, 'point', 0], R: [78, 86, 'open', 0], lean: -2},
  pointRight: {L: [102, 94, 'open', 0], R: [-12, -2, 'point', 0], lean: 2},
  present: {L: [150, 196, 'palmUp', 0], R: [78, 86, 'open', 0], lean: -1},
  presentRight: {L: [102, 94, 'open', 0], R: [30, -16, 'palmUp', 0], lean: 1},
  shrug: {L: [148, 222, 'palmUp', 0], R: [32, -42, 'palmUp', 0], lean: 0},
  think: {L: [104, 96, 'open', 0], R: [-12, 194, 'fist', 0], lean: 1},
  wave: {L: [104, 96, 'open', 0], R: [-36, -84, 'open', 0], lean: 1},
  thumbsUp: {L: [104, 96, 'open', 0], R: [52, -48, 'thumb', 0], lean: 1},
  surprised: {L: [206, 268, 'open', 0], R: [-26, -92, 'open', 0], lean: 0},
  explain: {L: [128, 168, 'palmUp', 0], R: [52, 12, 'palmUp', 0], lean: 0},
  count: {L: [104, 96, 'open', 0], R: [44, -70, 'point', -20], lean: 1},
  handsOnHips: {L: [140, 52, 'fist', 0], R: [40, 128, 'fist', 0], lean: 0},
};

type FaceDef = {brow: [number, number]; browTilt: number; eye: number; mouth: 'smile' | 'grin' | 'o' | 'flat' | 'wavy' | 'open'; look: [number, number]; wink?: boolean};
const FACES: Record<HostFace, FaceDef> = {
  neutral: {brow: [0, 0], browTilt: 0, eye: 1, mouth: 'smile', look: [0, 0]},
  happy: {brow: [-6, -6], browTilt: -4, eye: 0.85, mouth: 'grin', look: [0, 0]},
  surprised: {brow: [-16, -16], browTilt: 0, eye: 1.22, mouth: 'o', look: [0, 0]},
  thinking: {brow: [-12, 4], browTilt: 6, eye: 1, mouth: 'flat', look: [6, -8]},
  worried: {brow: [-4, -4], browTilt: 14, eye: 1.05, mouth: 'wavy', look: [0, 2]},
  excited: {brow: [-12, -12], browTilt: -6, eye: 1.1, mouth: 'open', look: [0, -2]},
  wink: {brow: [-4, -2], browTilt: -3, eye: 1, mouth: 'grin', look: [0, 0], wink: true},
};

/** Current & previous keyframe of a [time, value] track, with blend progress (spring, 0.35 s). */
const track = <V,>(t: number, keys: [number, V][], dur = 0.38): {a: V; b: V; k: number; at: number} => {
  let i = 0;
  for (let j = 0; j < keys.length; j++) if (t >= keys[j][0]) i = j;
  const b = keys[i][1];
  const a = i > 0 ? keys[i - 1][1] : b;
  const k = i > 0 ? spring(clamp01((t - keys[i][0]) / dur), 0.3) : 1;
  return {a, b, k, at: keys[i][0]};
};
const lerpAng = (a: number, b: number, k: number) => {
  let d = ((b - a + 540) % 360) - 180;
  return a + d * k;
};
const rad = (d: number) => (d * Math.PI) / 180;

/** Mouth openness 0..1 from word timings: flaps naturally while a word is being spoken. words = [[start, end], …] */
export const talkFrom = (t: number, words: [number, number][]): number => {
  for (const [a, b] of words) {
    if (t >= a - 0.02 && t <= b + 0.04) {
      const u = (t - a) / Math.max(0.08, b - a);
      return 0.35 + 0.65 * Math.abs(Math.sin(u * Math.PI * Math.max(1, Math.round((b - a) / 0.16))));
    }
    if (a > t) break;
  }
  return 0;
};

// ─── hands (drawn pointing along +x, wrist at 0,0) ───
const HandShape: React.FC<{kind: Hand; fill?: string}> = ({kind, fill = INK}) => {
  const st = {fill, stroke: INK, strokeWidth: fill === INK ? 2 : 3.2, strokeLinejoin: 'round' as const};
  if (kind === 'point')
    return (
      <g {...st}>
        <ellipse cx={14} cy={4} rx={17} ry={15} />
        <rect x={20} y={-6} width={36} height={11} rx={5.5} />
        <ellipse cx={10} cy={-10} rx={8} ry={6} transform="rotate(-30 10 -10)" />
      </g>
    );
  if (kind === 'fist')
    return (
      <g {...st}>
        <ellipse cx={14} cy={0} rx={18} ry={16} />
      </g>
    );
  if (kind === 'thumb')
    return (
      <g {...st}>
        <ellipse cx={14} cy={2} rx={17} ry={15} />
        <rect x={6} y={-34} width={11} height={30} rx={5.5} />
      </g>
    );
  if (kind === 'palmUp')
    return (
      <g {...st}>
        <path d="M0 -6 C10 -14 34 -14 46 -6 C52 -2 52 6 44 8 L6 10 C-2 10 -4 0 0 -6 Z" />
        <ellipse cx={14} cy={-14} rx={9} ry={5} transform="rotate(-20 14 -14)" />
      </g>
    );
  // open (mitten with thumb)
  return (
    <g {...st}>
      <path d="M0 -10 C12 -18 34 -16 42 -6 C48 2 44 12 34 14 L6 14 C-4 12 -6 -2 0 -10 Z" />
      <ellipse cx={12} cy={-16} rx={9} ry={6} transform="rotate(-45 12 -16)" />
    </g>
  );
};

const ArmView: React.FC<{sx: number; sy: number; up: number; fore: number; hand: Hand; rot: number; sleeve?: string; handFill?: string}> = ({sx, sy, up, fore, hand, rot, sleeve, handFill}) => {
  const U = 118;
  const F = 112;
  const ex = sx + Math.cos(rad(up)) * U;
  const ey = sy + Math.sin(rad(up)) * U;
  const hx = ex + Math.cos(rad(fore)) * F;
  const hy = ey + Math.sin(rad(fore)) * F;
  // hands point along the forearm; on the screen-left side the mitten is mirrored so the thumb stays on top
  const left = Math.cos(rad(fore)) < 0;
  return (
    <g>
      {sleeve ? (
        <>
          <path d={`M${sx} ${sy} Q${ex} ${ey} ${hx} ${hy}`} stroke={INK} strokeWidth={40} fill="none" strokeLinecap="round" />
          <path d={`M${sx} ${sy} Q${ex} ${ey} ${hx} ${hy}`} stroke={sleeve} strokeWidth={30} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <path d={`M${sx} ${sy} Q${ex} ${ey} ${hx} ${hy}`} stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
      )}
      <g transform={`translate(${hx} ${hy}) rotate(${fore + rot}) scale(1.75 ${left ? -1.75 : 1.75})`}>
        <HandShape kind={hand} fill={handFill} />
      </g>
    </g>
  );
};

// ─── entrances / exits (director's choice; small, tested vocabulary) ───
export type HostMoveKind = 'pop' | 'slideLeft' | 'slideRight' | 'rise' | 'drop' | 'peek' | 'walkInLeft' | 'walkInRight' | 'sink' | 'fly' | 'popOut' | 'slideOutLeft' | 'slideOutRight' | 'walkOutLeft' | 'walkOutRight';
export type HostMove = {kind: HostMoveKind; at: number; dur?: number};
export const MOVE_SFX: Record<HostMoveKind, string> = {
  pop: 'popup', slideLeft: 'swoosh', slideRight: 'swoosh', rise: 'rise', drop: 'thump', peek: 'swish', walkInLeft: 'footsteps', walkInRight: 'footsteps',
  sink: 'fall', fly: 'whoosh', popOut: 'popdown', slideOutLeft: 'swoosh', slideOutRight: 'swoosh', walkOutLeft: 'footsteps', walkOutRight: 'footsteps',
};
/** offset/scale/opacity of the host for his entrance (spring) and exit; slides travel ~1100 px (fully off-frame) */
export const hostMove = (t: number, enter?: HostMove, exit?: HostMove) => {
  let dx = 0, dy = 0, sc = 1, o = 1, walking = false;
  if (enter) {
    const d = enter.dur ?? (enter.kind.startsWith('walk') ? 1.4 : 0.7);
    const u = (t - enter.at) / d;
    if (u < 0) return {visible: false, dx, dy, s: sc, o, walking};
    if (u < 1) {
      const k = spring(u, enter.kind === 'drop' ? 0.6 : 0.35);
      const lin = ease.inOut(u);
      switch (enter.kind) {
        case 'pop': sc = lerp(0.2, 1, k); o = clamp01(u * 4); break;
        case 'slideLeft': dx = -(1 - k) * 1100; break;
        case 'slideRight': dx = (1 - k) * 1100; break;
        case 'rise': dy = (1 - k) * 900; break;
        case 'drop': dy = -(1 - k) * 1100; break;
        case 'peek': dx = (1 - k) * -360; break;
        case 'walkInLeft': dx = -(1 - lin) * 1100; walking = true; break;
        case 'walkInRight': dx = (1 - lin) * 1100; walking = true; break;
        default: break;
      }
    }
  }
  if (exit) {
    const d = exit.dur ?? (exit.kind.startsWith('walk') ? 1.4 : 0.55);
    const u = (t - exit.at) / d;
    if (u >= 1) return {visible: false, dx, dy, s: sc, o, walking};
    if (u > 0) {
      const k = ease.in(u);
      switch (exit.kind) {
        case 'popOut': sc *= u < 0.3 ? lerp(1, 1.1, u / 0.3) : lerp(1.1, 0, (u - 0.3) / 0.7); break;
        case 'sink': dy += k * 900; break;
        case 'fly': dy -= k * 1200; break;
        case 'slideOutLeft': dx -= k * 1100; break;
        case 'slideOutRight': dx += k * 1100; break;
        case 'walkOutLeft': dx -= ease.inOut(u) * 1100; walking = true; break;
        case 'walkOutRight': dx += ease.inOut(u) * 1100; walking = true; break;
        default: o *= 1 - u;
      }
    }
  }
  return {visible: true, dx, dy, s: sc, o, walking};
};

const Feather: React.FC<{ang: number; len: number; w: number; fill: string}> = ({ang, len, w, fill}) => (
  <g transform={`rotate(${ang})`}>
    <path d={`M0 0 C${w} ${-len * 0.3} ${w * 0.9} ${-len * 0.8} 0 ${-len} C${-w * 0.9} ${-len * 0.8} ${-w} ${-len * 0.3} 0 0 Z`} fill={fill} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d={`M0 ${-len * 0.12} L0 ${-len * 0.86}`} stroke={INK} strokeWidth={2.2} opacity={0.55} />
  </g>
);

const Mouth: React.FC<{kind: FaceDef['mouth']; talk: number}> = ({kind, talk}) => {
  const y = -650;
  // talking overrides closed shapes with a flapping open mouth (keeps the expression's character)
  const open = kind === 'open' || kind === 'o' ? Math.max(0.7, talk) : talk;
  if (open > 0.06) {
    if (kind === 'o') {
      const r = 10 + 10 * open;
      return <ellipse cx={0} cy={y + 4} rx={r * 0.8} ry={r} fill={COL.mouth} stroke={INK} strokeWidth={4} />;
    }
    const w = kind === 'grin' || kind === 'open' ? 30 : 22;
    const d = 8 + 26 * open;
    return (
      <g>
        <path d={`M${-w} ${y - 4} Q0 ${y - 8} ${w} ${y - 4} Q${w * 0.8} ${y + d} 0 ${y + d} Q${-w * 0.8} ${y + d} ${-w} ${y - 4} Z`} fill={COL.mouth} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <ellipse cx={0} cy={y + d * 0.72} rx={w * 0.45} ry={Math.max(2, d * 0.22)} fill={COL.tongue} />
      </g>
    );
  }
  if (kind === 'grin') return <path d={`M-30 ${y - 6} Q0 ${y + 26} 30 ${y - 6} Q0 ${y + 6} -30 ${y - 6} Z`} fill={COL.mouth} stroke={INK} strokeWidth={4} strokeLinejoin="round" />;
  if (kind === 'flat') return <path d={`M-16 ${y} L18 ${y - 3}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />;
  if (kind === 'wavy') return <path d={`M-20 ${y} q7 -7 14 0 t14 0 t12 0`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />;
  return <path d={`M-20 ${y - 4} Q0 ${y + 12} 20 ${y - 4}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />;
};

export const Host: React.FC<{
  t: number;
  x: number;
  y: number;
  s?: number;
  poses?: [number, HostPose][];
  faces?: [number, HostFace][];
  talk?: number;
  p?: number; // entrance (0→1, linear): pops in with a bounce
  id?: string;
  life?: number; // 0 still · 1 natural (default) · 2 lively — idle motion amount (the director chooses per shot)
  sfx?: boolean; // optional: a soft swish on each pose change (off by default — the director decides)
  mirror?: boolean; // Arabic videos: true (default) = mirror with the RTL layout; false = keep his real orientation
  walk?: number; // 0 = standing; >0 = walking (steps per second ≈ 2×walk) while you move x — legs swing, body bobs
  lean?: number; // extra body lean in degrees (peeking in from an edge, hostShot('peek') sets it)
  enter?: HostMove; // animated arrival (director's choice): {kind, at, dur?}
  exit?: HostMove; // animated departure: {kind, at, dur?}
}> = ({t, x, y, s = 1, poses = [[0, 'idle']], faces = [[0, 'neutral']], talk = 0, p = 1, id = 'host', life = 1, sfx = false, mirror = true, walk = 0, lean: leanX = 0, enter, exit}) => {
  if (p <= 0) return null;
  const mv = hostMove(t, enter, exit);
  if (!mv.visible) return null;
  // entrance/exit sounds (footsteps last exactly as long as the walk)
  for (const [m, tag] of [[enter, 'in'], [exit, 'out']] as [HostMove | undefined, string][]) {
    if (!m) continue;
    const isWalk = m.kind.startsWith('walk');
    const d = m.dur ?? (isWalk ? 1.4 : 0.6);
    cueSfx(MOVE_SFX[m.kind], `${id}-${tag}@${m.at}`, t >= m.at && (!isWalk || t < m.at + d), x, {sustain: isWalk});
  }
  const odd = false; // the code-drawn rig is AZTIKA only (ODDESTORY is image-based)
  const pt = track(t, poses);
  const ft = track(t, faces, 0.25);
  // a soft swish whenever he changes pose (auto-SFX), quiet so it never competes with the voice
  if (sfx && pt.at > 0) cueSfx('swish', `${id}-pose@${pt.at}`, true, x, {gain: 0.45});
  const A = POSES[pt.a];
  const B = POSES[pt.b];
  const arm = (side: 'L' | 'R'): [number, number, Hand, number] => {
    const a = A[side];
    const b = B[side];
    const ph = side === 'L' ? 0 : 1.7;
    const drift = Math.sin(t * 1.6 + ph) * 3 * life; // hands never freeze completely
    return [lerpAng(a[0], b[0], pt.k) + drift, lerpAng(a[1], b[1], pt.k) + drift * 1.4, pt.k > 0.5 ? b[2] : a[2], lerp(a[3], b[3], pt.k)];
  };
  const L = arm('L');
  const R = arm('R');
  const lean = lerp(A.lean, B.lean, clamp01(pt.k));
  const fa = FACES[ft.a];
  const fb = FACES[ft.b];
  const fk = clamp01(ft.k);
  const browL = lerp(fa.brow[0], fb.brow[0], fk);
  const browR = lerp(fa.brow[1], fb.brow[1], fk);
  const tilt = lerp(fa.browTilt, fb.browTilt, fk);
  const eyeS = lerp(fa.eye, fb.eye, fk);
  const lookX = lerp(fa.look[0], fb.look[0], fk);
  const lookY = lerp(fa.look[1], fb.look[1], fk);
  const face = fk > 0.5 ? fb : fa;
  // life: breathing + blink (deterministic)
  const breath = Math.sin(t * 1.9) * 0.009 * (0.6 + 0.6 * life);
  const sway = Math.sin(t * 0.9) * 1.1 * life + leanX; // degrees, whole body around the feet
  const walkNow = walk > 0 ? walk : mv.walking ? 1.1 : 0;
  const step = walkNow > 0 ? Math.sin(t * Math.PI * 2 * walkNow) : 0; // −1..1 leg swing
  const bobY = walkNow > 0 ? -Math.abs(step) * 10 : 0;
  const headTilt = Math.sin(t * 1.25 + 0.6) * 2.2 * life + talk * 1.6 * Math.sin(t * 7) * Math.min(1, life); // nods while talking
  const bphase = (t + 0.7) % 3.7;
  const blink = bphase < 0.13 ? Math.abs(Math.cos((bphase / 0.13) * Math.PI)) : 1;
  const winkK = face.wink ? 0.12 : 1;
  // entrance: pops up from the ground with a bounce
  const ek = spring(clamp01(p), 0.45);
  const es = lerp(0.6, 1, ek);

  const feathers: [number, number, string][] = [
    [-78, 170, COL.green], [-62, 205, COL.teal], [-46, 225, COL.green], [-30, 238, COL.teal], [-14, 246, COL.green],
    [2, 250, COL.teal], [18, 244, COL.green], [34, 232, COL.teal], [50, 214, COL.green], [66, 190, COL.teal], [80, 160, COL.green],
    [-54, 150, COL.orange], [-26, 168, COL.red], [0, 176, COL.orange], [26, 168, COL.red], [54, 150, COL.orange],
  ];

  return (
    <g transform={`translate(${x + mv.dx} ${y + mv.dy}) scale(${s * es * mv.s}) `} opacity={clamp01(p * 4) * mv.o} className={mirror ? undefined : 'k-nomirror'}>
      {/* ground shadow */}
      <ellipse cx={0} cy={4} rx={120} ry={16} fill={INK} opacity={0.12} />
      <g transform={`translate(0 ${bobY}) rotate(${lean + sway} 0 0) scale(${1 - breath * 0.4} ${1 + breath})`}>
        <g transform="translate(0 80)">
        {/* cape (behind) — AZTIKA only */}
        {!odd && <path d="M-70 -548 C-120 -400 -150 -250 -128 -170 L128 -170 C150 -250 120 -400 70 -548 Z" fill={COL.creamShade} stroke={INK} strokeWidth={5} strokeLinejoin="round" />}
        </g>
        {/* legs: AZTIKA thin legs + sandals · ODDESTORY black trousers + shoes */}
        {(
          <>
            <path d={`M-30 -182 L${-34 + step * 26} -10 M30 -182 L${34 - step * 26} -10`} stroke={INK} strokeWidth={10} strokeLinecap="round" />
            {[-1, 1].map((d) => (
              <g key={d} transform={`translate(${d * 40 + (d < 0 ? step : -step) * 26} ${walkNow > 0 && (d < 0 ? step : -step) > 0 ? -Math.abs(step) * 8 : 0})`}>
                <path d="M-30 -2 C-30 -22 30 -22 34 -6 C34 2 -30 4 -30 -2 Z" fill="#FFFFFF" stroke={INK} strokeWidth={4} />
                <rect x={-34} y={-6} width={72} height={12} rx={6} fill={COL.sandal} stroke={INK} strokeWidth={4} />
                <path d="M-10 -16 L6 -10" stroke={COL.sandal} strokeWidth={6} strokeLinecap="round" />
              </g>
            ))}
          </>
        )}
        <g transform="translate(0 80)">
        {(
        <>
        {/* tunic */}
        <path d="M-62 -560 L62 -560 L88 -255 L-88 -255 Z" fill={COL.cream} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {/* loincloth panel */}
        <rect x={-46} y={-392} width={92} height={150} fill={COL.red} stroke={INK} strokeWidth={4} />
        <rect x={-38} y={-384} width={76} height={134} fill="none" stroke={COL.gold} strokeWidth={5} />
        <path d="M-10 -350 h20 v14 h14 v20 h-14 v14 h-20 v-14 h-14 v-20 h14 Z" fill={COL.turq} stroke={INK} strokeWidth={3} />
        <rect x={-4} y={-330} width={8} height={8} fill={COL.gold} />
        {/* belt + medallion */}
        <rect x={-70} y={-428} width={140} height={38} rx={6} fill={COL.red} stroke={INK} strokeWidth={4} />
        <rect x={-70} y={-428} width={140} height={7} fill={COL.gold} />
        <rect x={-70} y={-397} width={140} height={7} fill={COL.gold} />
        <circle cx={0} cy={-409} r={27} fill={COL.gold} stroke={INK} strokeWidth={4} />
        <circle cx={0} cy={-409} r={16} fill="none" stroke={COL.goldDeep} strokeWidth={4} />
        <circle cx={0} cy={-409} r={7} fill={COL.goldDeep} />
        {/* collar: red cape-collar, green scallops, gold beads, medallion */}
        <path d="M-96 -548 C-70 -476 70 -476 96 -548 C70 -588 -70 -588 -96 -548 Z" fill={COL.red} stroke={INK} strokeWidth={4} />
        {Array.from({length: 9}, (_, i) => {
          const a = Math.PI * (0.12 + (i / 8) * 0.76);
          const cx = -Math.cos(a) * 82;
          const cy = -548 + Math.sin(a) * 50;
          return <path key={i} d={`M${cx - 11} ${cy - 6} Q${cx} ${cy + 22} ${cx + 11} ${cy - 6} Z`} fill={i % 2 ? COL.greenDeep : COL.green} stroke={INK} strokeWidth={3} />;
        })}
        <path d="M-74 -556 C-50 -520 50 -520 74 -556" fill="none" stroke={COL.gold} strokeWidth={9} strokeLinecap="round" />
        <circle cx={0} cy={-520} r={26} fill={COL.gold} stroke={INK} strokeWidth={4} />
        <ellipse cx={0} cy={-520} rx={14} ry={16} fill={COL.turq} stroke={INK} strokeWidth={3} />
        <ellipse cx={-4} cy={-526} rx={4} ry={5} fill={COL.turqLight} />
        {/* neck */}
        <path d="M0 -590 L0 -606" stroke={INK} strokeWidth={10} />
        </>
        )}
        {/* arms (behind nothing; drawn over the tunic) */}
        <ArmView sx={odd ? -72 : -58} sy={-546} up={L[0]} fore={L[1]} hand={L[2]} rot={L[3]} />
        <ArmView sx={odd ? 72 : 58} sy={-546} up={R[0]} fore={R[1]} hand={R[2]} rot={R[3]} />
        {/* feathers (behind the head) */}
        <g transform={`rotate(${headTilt} 0 -600)`}>
        {!odd && (
          <g transform="translate(0 -780)">
            {feathers.map(([a, l, c], i) => (
              <Feather key={i} ang={a} len={l} w={l * 0.17} fill={c} />
            ))}
          </g>
        )}
        {/* ear spools — AZTIKA */}
        {!odd && [-1, 1].map((d) => (
          <g key={d} transform={`translate(${d * 98} -690)`}>
            <rect x={-8} y={18} width={16} height={34} rx={3} fill={COL.gold} stroke={INK} strokeWidth={3} />
            <path d={`M-9 52 h18`} stroke={COL.goldDeep} strokeWidth={4} />
            <circle r={22} fill={COL.gold} stroke={INK} strokeWidth={4} />
            <circle r={11} fill={COL.turq} stroke={INK} strokeWidth={3} />
          </g>
        ))}
        {/* head */}
        <circle cx={0} cy={-690} r={100} fill={COL.skin} stroke={INK} strokeWidth={6} />
        {/* headdress band with key pattern + gem — AZTIKA */}
        {!odd && (
        <>
        <path d="M-92 -722 C-60 -790 60 -790 92 -722 L84 -700 C52 -760 -52 -760 -84 -700 Z" fill={COL.gold} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {Array.from({length: 7}, (_, i) => {
          const a = Math.PI * (0.18 + (i / 6) * 0.64);
          const cx = -Math.cos(a) * 80;
          const cy = -712 - Math.sin(a) * 40;
          return i === 3 ? null : <path key={i} d={`M${cx - 6} ${cy + 4} v-8 h12 v5 h-6`} stroke={COL.goldDeep} strokeWidth={2.6} fill="none" />;
        })}
        <ellipse cx={0} cy={-756} rx={18} ry={22} fill={COL.turq} stroke={INK} strokeWidth={4} />
        <ellipse cx={-5} cy={-762} rx={5} ry={7} fill={COL.turqLight} />
        <path d="M-10 -780 L0 -796 L10 -780 Z" fill={COL.gold} stroke={INK} strokeWidth={3} />
        </>
        )}
        {/* face */}
        <g>
          {[-1, 1].map((d) => {
            const by = -730 + (d < 0 ? browL : browR);
            const eyeSY = eyeS * blink * (face.wink && d > 0 ? winkK : 1);
            return (
              <g key={d}>
                <path d={`M${d * 16} ${by + d * tilt * 0.3 - (odd ? 10 : 0)} Q${d * 34} ${by - 8 - (odd ? 12 : 0)} ${d * 54} ${by - d * tilt * 0.3 + 2 - (odd ? 8 : 0)}`} stroke={INK} strokeWidth={odd ? 9 : 6} fill="none" strokeLinecap="round" />
                {odd ? (
                  <g transform={`translate(${d * 42} -680) scale(${eyeS} ${eyeSY})`}>
                    <ellipse rx={38} ry={42} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
                    <circle cx={lookX * 1.8 + 4} cy={lookY * 1.6 - 6} r={18} fill={INK} />
                    <circle cx={lookX * 1.8 + 10} cy={lookY * 1.6 - 13} r={5.5} fill="#FFFFFF" />
                  </g>
                ) : (
                  <g transform={`translate(${d * 32 + lookX} ${-688 + lookY}) scale(${eyeS} ${eyeSY})`}>
                    <ellipse rx={12} ry={22} fill={INK} />
                    <ellipse cx={-3} cy={-9} rx={4} ry={6} fill="#FFFFFF" />
                  </g>
                )}
              </g>
            );
          })}
          <Mouth kind={face.mouth} talk={talk} />
        </g>
        </g>
        </g>
      </g>
    </g>
  );
};

/**
 * hostShot — ready framings for the host (all on a 1920×1080 frame; the frame edge crops what's below). The director picks
 * per shot and may animate between them (lerp x/y/s with keys) so he walks, slides, rises or drops in:
 *   full   — whole body standing (≈ 800 px)          half  — waist up, big (legs below the frame)
 *   close  — head & shoulders, very big (reactions)    peek  — leans in from the left/right edge, only head + one arm
 *   tiny   — small full figure for wide scenes          (combine with a side: 'left' | 'center' | 'right')
 * Returns the props {x, y, s} (+ lean for peek). Example:
 *   const h = hostShot('half', 'right'); <Host t={t} {...h} poses={…} />
 */
export const hostShot = (framing: 'full' | 'half' | 'close' | 'peek' | 'tiny', side: 'left' | 'center' | 'right' = 'left') => {
  const X = {left: 330, center: 960, right: 1590}[side];
  switch (framing) {
    case 'half':
      return {x: X, y: 1080 + 470, s: 1.7};
    case 'close':
      return {x: X, y: 1080 + 1020, s: 2.9};
    case 'peek':
      return {x: side === 'right' ? 1920 + 40 : -40, y: 1080 + 260, s: 1.5, lean: side === 'right' ? -14 : 14};
    case 'tiny':
      return {x: X, y: 980, s: 0.5};
    case 'full':
    default:
      return {x: X, y: 1035, s: 1.05};
  }
};
