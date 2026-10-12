import React from 'react';
import {C} from './theme';
import {clamp01, lerp, noise1, rand} from './anim';

/**
 * Parametric flat characters for Binly (story-specific people, NOT a mascot).
 *
 * <Person x={800} y={860} facing={1} outfit="robe" hat="coif" pose="point" t={t} />
 * Origin = between the feet (floor contact). Height ≈ 540 px at s = 1 (≈ 4 heads tall, stylised).
 * Everything is drawn facing right and mirrored for facing = -1, so poses read naturally both ways.
 *
 * Animate with props:  pose (preset), arms (explicit angles, override pose), walk (cycle phase in
 * cycles — pass t * stepsPerSecond / 2), talk (0..1 mouth), look (-1..1 head turn), expression,
 * blink (auto from t unless given), lean (deg), sit (0..1 morph standing→sitting).
 */

export type Expression = 'neutral' | 'smile' | 'happy' | 'worried' | 'surprised' | 'thinking' | 'sad' | 'angry' | 'determined';
export type Outfit = 'tunic' | 'robe' | 'dress' | 'coat' | 'labcoat' | 'suit' | 'casual' | 'royal' | 'scrubs' | 'nightwear';
export type Hat = 'none' | 'coif' | 'hood' | 'tophat' | 'crown' | 'cap' | 'brimmed' | 'scholar' | 'veil' | 'beret' | 'surgical';
export type Hair = 'short' | 'long' | 'bun' | 'curly' | 'bald' | 'tonsure' | 'side' | 'ponytail' | 'none';
export type PosePreset =
  | 'idle'
  | 'point' // front arm points forward/up
  | 'wave'
  | 'think' // hand to chin
  | 'shrug'
  | 'present' // open palm toward something
  | 'hold' // both hands hold something in front (see personHands)
  | 'write' // hand forward-down (writing on a desk)
  | 'cheer'
  | 'worried' // hands near face
  | 'armsOut' // both arms out (explaining / "this big")
  | 'reach' // front arm reaching forward
  | 'handsBack'
  | 'facepalm'
  | 'cross'; // arms folded

/** arm = [shoulderDeg, elbowDeg]: 0 = hanging down, + = rotate forward (toward facing). Elbow + bends forward/up. */
export type ArmAngles = {front: [number, number]; back: [number, number]};

const POSES: Record<PosePreset, ArmAngles> = {
  idle: {front: [6, 10], back: [-6, 8]},
  point: {front: [100, 4], back: [-8, 12]},
  wave: {front: [150, 30], back: [-6, 10]},
  think: {front: [40, 125], back: [20, 80]},
  shrug: {front: [35, 90], back: [-35, -90]},
  present: {front: [70, 20], back: [-4, 10]},
  hold: {front: [40, 60], back: [30, 70]},
  write: {front: [50, 45], back: [25, 40]},
  cheer: {front: [165, 15], back: [-165, -15]},
  worried: {front: [30, 140], back: [22, 140]},
  armsOut: {front: [70, 5], back: [-70, -5]},
  reach: {front: [80, 0], back: [-10, 10]},
  handsBack: {front: [-25, -30], back: [-30, -35]},
  facepalm: {front: [38, 140], back: [-6, 8]},
  cross: {front: [30, 105], back: [28, 110]},
};

const L_UP = 96;
const L_FORE = 90;
const L_THIGH = 112;
const L_SHIN = 112;
const HIP_Y = -232;
const SHOULDER_Y = -408;
const HEAD_Y = -486;
const HEAD_R = 60;

const rad = (d: number) => (d * Math.PI) / 180;
/** vector of length L at angle a (deg) measured from straight-down, + toward facing (right) */
const vec = (a: number, L: number) => ({x: Math.sin(rad(a)) * L, y: Math.cos(rad(a)) * L});

type Pt = {x: number; y: number};

export type PersonProps = {
  x: number;
  y: number;
  s?: number;
  facing?: 1 | -1;
  t?: number; // for idle breathing + auto blink
  pose?: PosePreset;
  arms?: Partial<ArmAngles>;
  walk?: number; // walk cycle phase (cycles). undefined = standing
  stride?: number; // 0..1 walk amplitude
  sit?: number; // 0..1
  lean?: number; // degrees, + leans forward
  look?: number; // -1 (toward back) .. 1 (toward front) head turn
  tilt?: number; // head tilt degrees
  expression?: Expression;
  talk?: number; // 0..1 mouth open
  blink?: number; // 0..1 override
  skin?: number; // index into C.skin (0 light .. 4 deep)
  hair?: Hair;
  hairColor?: string;
  beard?: 'none' | 'short' | 'full' | 'moustache';
  glasses?: boolean;
  outfit?: Outfit;
  top?: string; // main garment colour
  bottom?: string; // trousers / skirt colour
  accent?: string; // trim, belt, tie
  hat?: Hat;
  hatColor?: string;
  shoes?: string;
  silhouette?: string; // draw the whole figure in one flat colour (crowds, distant figures)
  opacity?: number;
  seed?: number; // varies idle timing
};

const OUTFIT_DEFAULTS: Record<Outfit, {top: string; bottom: string; accent: string; long: boolean}> = {
  tunic: {top: C.woodLight, bottom: C.inkLift, accent: C.woodDark, long: false},
  robe: {top: C.inkLift, bottom: C.inkLift, accent: C.oxblood, long: true},
  dress: {top: C.theoryLight, bottom: C.theory, accent: C.paperLight, long: true},
  coat: {top: C.inkLift, bottom: C.inkSoft, accent: C.oxblood, long: false},
  labcoat: {top: C.paperLight, bottom: C.inkLift, accent: C.evidence, long: false},
  suit: {top: C.inkSoft, bottom: C.inkSoft, accent: C.oxblood, long: false},
  casual: {top: C.evidenceLight, bottom: C.slate, accent: C.paperLight, long: false},
  royal: {top: C.oxblood, bottom: C.oxDeep, accent: C.caution, long: true},
  scrubs: {top: C.water, bottom: C.water, accent: C.paperLight, long: false},
  nightwear: {top: C.theoryTint, bottom: C.theoryTint, accent: C.theoryLight, long: true},
};

/** Compute the skeleton (in the figure's local, facing-right space: origin feet, y down positive). */
const skeleton = (p: PersonProps) => {
  const sit = clamp01(p.sit ?? 0);
  const walking = p.walk !== undefined && sit < 0.5;
  const ph = (p.walk ?? 0) * Math.PI * 2;
  const amp = walking ? (p.stride ?? 1) : 0;
  const bob = walking ? -Math.abs(Math.cos(ph)) * 6 * amp + 3 * amp : 0;
  const breathe = Math.sin((p.t ?? 0) * 1.7 + (p.seed ?? 0)) * 1.6;

  // legs: [hipDeg, kneeDeg]; knee negative = shin swings back
  const legA = walking ? [22 * Math.sin(ph) * amp, -Math.max(0, 30 * Math.sin(ph - 1.4)) * amp - 3] : [3, -2];
  const legB = walking ? [22 * Math.sin(ph + Math.PI) * amp, -Math.max(0, 30 * Math.sin(ph + Math.PI - 1.4)) * amp - 3] : [-3, -2];
  // sitting: thighs forward (90deg), shins down
  const thighA = lerp(legA[0], 88, sit);
  const thighB = lerp(legB[0], 84, sit);
  const kneeA = lerp(legA[1], -88, sit);
  const kneeB = lerp(legB[1], -80, sit);

  const hipY = lerp(HIP_Y + bob, -L_SHIN - 6, sit);
  const hipX = lerp(0, -L_THIGH + 8, sit);
  const hip = {x: hipX, y: hipY};
  const lean = (p.lean ?? 0) + (walking ? 3 * amp : 0) + sit * -2;
  const torsoLen = SHOULDER_Y - HIP_Y;
  const sh = {x: hip.x + Math.sin(rad(lean)) * -torsoLen, y: hip.y + Math.cos(rad(lean)) * torsoLen + breathe * 0.4};
  const neck = {x: sh.x + Math.sin(rad(lean)) * 26, y: sh.y - 26};
  const head = {x: hip.x + Math.sin(rad(lean)) * -(HEAD_Y - HIP_Y) * 1.0, y: hip.y + (HEAD_Y - HIP_Y) * Math.cos(rad(lean)) + breathe * 0.6};

  const leg = (hipDeg: number, kneeDeg: number, dx: number) => {
    const h = {x: hip.x + dx, y: hip.y};
    const k = {x: h.x + vec(hipDeg, L_THIGH).x, y: h.y + vec(hipDeg, L_THIGH).y};
    const f = {x: k.x + vec(hipDeg + kneeDeg, L_SHIN).x, y: k.y + vec(hipDeg + kneeDeg, L_SHIN).y};
    return {h, k, f};
  };
  // front leg slightly forward on screen
  const legFront = leg(thighA, kneeA, 8);
  const legBack = leg(thighB, kneeB, -8);

  const base = POSES[p.pose ?? 'idle'];
  const armsDeg: ArmAngles = {front: p.arms?.front ?? base.front, back: p.arms?.back ?? base.back};
  // walking arm swing (only if no explicit arms and idle pose)
  if (walking && !p.arms && (p.pose ?? 'idle') === 'idle') {
    armsDeg.front = [-22 * Math.sin(ph) * amp, 18];
    armsDeg.back = [22 * Math.sin(ph) * amp, 18];
  }
  const arm = (a: [number, number], dx: number) => {
    const s0 = {x: sh.x + dx, y: sh.y + 10};
    const e = {x: s0.x + vec(a[0] + lean, L_UP).x, y: s0.y + vec(a[0] + lean, L_UP).y};
    const h = {x: e.x + vec(a[0] + a[1] + lean, L_FORE).x, y: e.y + vec(a[0] + a[1] + lean, L_FORE).y};
    return {s: s0, e, h};
  };
  const armFront = arm(armsDeg.front, 20);
  const armBack = arm(armsDeg.back, -26);
  return {hip, sh, neck, head, legFront, legBack, armFront, armBack, lean, sit};
};

/** World-space hand positions (for attaching held objects): {front, back}. Same props as <Person>. */
export const personHands = (p: PersonProps) => {
  const k = skeleton(p);
  const s = p.s ?? 1;
  const f = p.facing ?? 1;
  const w = (pt: Pt) => ({x: p.x + pt.x * s * f, y: p.y + pt.y * s});
  return {front: w(k.armFront.h), back: w(k.armBack.h), head: w(k.head)};
};

const limb = (a: Pt, b: Pt, w: number, color: string, key?: string) => <line key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={w} strokeLinecap="round" />;
const limb2 = (a: Pt, b: Pt, c: Pt, w: number, color: string) => (
  <path d={`M${a.x} ${a.y} L${b.x} ${b.y} L${c.x} ${c.y}`} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
);

const shade = (hex: string, k = 0.22) => {
  // darken toward ink (stays in family)
  const pa = parseInt(hex.slice(1), 16);
  const pb = parseInt(C.ink.slice(1), 16);
  const ch = (q: number, sft: number) => (q >> sft) & 255;
  const m = (sft: number) => Math.round(lerp(ch(pa, sft), ch(pb, sft), k));
  return `rgb(${m(16)},${m(8)},${m(0)})`;
};

/** The figure. See module docs above. */
export const Person: React.FC<PersonProps> = (p) => {
  const s = p.s ?? 1;
  const f = p.facing ?? 1;
  const t = p.t ?? 0;
  const k = skeleton(p);
  const outfit = p.outfit ?? 'casual';
  const od = OUTFIT_DEFAULTS[outfit];
  const sil = p.silhouette;
  const top = sil ?? p.top ?? od.top;
  const bottom = sil ?? p.bottom ?? od.bottom;
  const accent = sil ?? p.accent ?? od.accent;
  const skinI = Math.max(0, Math.min(C.skin.length - 1, p.skin ?? 1));
  const skin = sil ?? C.skin[skinI];
  const skinSh = sil ?? C.skinShade[skinI];
  const hairCol = sil ?? p.hairColor ?? C.hair[(p.seed ?? 0) % 3];
  const shoes = sil ?? p.shoes ?? C.ink;
  const topSh = sil ?? shade(top, 0.25);
  const bottomSh = sil ?? shade(bottom, 0.25);
  const long = od.long;
  const expr = p.expression ?? 'neutral';
  const look = p.look ?? 0;
  // auto blink every ~3.7 s (seeded), 0.12 s long
  const blinkAuto = (() => {
    const period = 3.7 + rand((p.seed ?? 0) + 1) * 1.5;
    const ph = ((t + rand(p.seed ?? 0) * period) % period + period) % period;
    return ph < 0.12 ? 1 : 0;
  })();
  const blink = p.blink ?? blinkAuto;
  const talk = clamp01(p.talk ?? 0);

  const {hip, sh, head, legFront, legBack, armFront, armBack} = k;
  const torsoW = 118;
  const waistW = 96;

  // ---------- garment silhouettes
  const torsoPath = () => {
    const sx = sh.x, sy = sh.y, hx = hip.x, hy = hip.y;
    return `M${sx - torsoW / 2} ${sy + 18} Q${sx - torsoW / 2} ${sy - 6} ${sx - torsoW / 2 + 24} ${sy - 10} L${sx + torsoW / 2 - 24} ${sy - 10} Q${sx + torsoW / 2} ${sy - 6} ${sx + torsoW / 2} ${sy + 18} L${hx + waistW / 2 + 4} ${hy + 6} L${hx - waistW / 2 - 4} ${hy + 6} Z`;
  };
  const sway = p.walk !== undefined ? Math.sin(p.walk * Math.PI * 2) * 10 : 0;
  const skirtPath = (len: number, flare: number) => {
    const hx = hip.x, hy = hip.y - 10;
    const by = Math.min(-14, hy + len);
    return `M${hx - waistW / 2 - 2} ${hy} L${hx + waistW / 2 + 2} ${hy} L${hx + flare / 2 + sway} ${by} Q${hx + sway} ${by + 10} ${hx - flare / 2 + sway} ${by} Z`;
  };
  const sat = k.sit > 0.5;
  // long garments: skirt to the floor (standing) or over the lap (sitting)
  const longSkirt = long && !sat ? skirtPath(-hip.y - 4, 196) : null;
  const coatTail = (outfit === 'coat' || outfit === 'labcoat') && !sat ? skirtPath(150, 150) : null;
  const tunicSkirt = outfit === 'tunic' && !sat ? skirtPath(96, 150) : null;

  // ---------- head features (drawn in head-local space, facing right)
  const eyeY = -6;
  const ex1 = 10 + look * 10; // near eye
  const ex2 = -20 + look * 12; // far eye
  const browLift = {neutral: 0, smile: 2, happy: 4, worried: 6, surprised: 10, thinking: 3, sad: 4, angry: -4, determined: -3}[expr];
  const browTilt = {neutral: 0, smile: 0, happy: 0, worried: -12, surprised: 0, thinking: 8, sad: -14, angry: 16, determined: 10}[expr];
  const eye = (cx: number, key: string) =>
    blink > 0.5 ? (
      <line key={key} x1={cx - 7} y1={eyeY} x2={cx + 7} y2={eyeY} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    ) : (
      <ellipse key={key} cx={cx + look * 2} cy={eyeY} rx={expr === 'surprised' ? 7 : 5.5} ry={expr === 'surprised' ? 8 : 7} fill={C.ink} />
    );
  const brow = (cx: number, key: string, side: number) => (
    <line
      key={key}
      x1={cx - 10}
      y1={eyeY - 18 - browLift + (side * browTilt) / 3}
      x2={cx + 10}
      y2={eyeY - 18 - browLift - (side * browTilt) / 3}
      stroke={sil ? 'none' : shade(hairCol, 0.1)}
      strokeWidth={5}
      strokeLinecap="round"
    />
  );
  const mouthX = 0 + look * 10;
  const mouth = () => {
    if (talk > 0.05) return <ellipse cx={mouthX} cy={30} rx={9} ry={2 + 8 * talk} fill={C.oxDeep} />;
    switch (expr) {
      case 'smile':
        return <path d={`M${mouthX - 11} 27 Q${mouthX} 36 ${mouthX + 11} 27`} stroke={C.oxDeep} strokeWidth={4} fill="none" strokeLinecap="round" />;
      case 'happy':
        return <path d={`M${mouthX - 13} 25 Q${mouthX} 42 ${mouthX + 13} 25 Z`} fill={C.oxDeep} />;
      case 'surprised':
        return <ellipse cx={mouthX} cy={32} rx={7} ry={9} fill={C.oxDeep} />;
      case 'worried':
      case 'sad':
        return <path d={`M${mouthX - 10} 33 Q${mouthX} 25 ${mouthX + 10} 33`} stroke={C.oxDeep} strokeWidth={4} fill="none" strokeLinecap="round" />;
      case 'thinking':
        return <path d={`M${mouthX - 9} 30 L${mouthX + 7} 27`} stroke={C.oxDeep} strokeWidth={4} fill="none" strokeLinecap="round" />;
      case 'angry':
      case 'determined':
        return <path d={`M${mouthX - 10} 30 L${mouthX + 10} 30`} stroke={C.oxDeep} strokeWidth={4.5} fill="none" strokeLinecap="round" />;
      default:
        return <path d={`M${mouthX - 8} 29 Q${mouthX} 32 ${mouthX + 8} 29`} stroke={C.oxDeep} strokeWidth={4} fill="none" strokeLinecap="round" />;
    }
  };

  const hair = p.hair ?? 'short';
  const hairBack = () => {
    if (sil) return null;
    switch (hair) {
      case 'long':
        return <path d="M-58 -20 C-66 40 -50 96 -30 104 L36 100 C30 60 30 20 34 -10 Z" fill={hairCol} />;
      case 'ponytail':
        return <path d="M-52 -26 C-92 -10 -96 50 -84 92 C-70 60 -60 20 -44 6 Z" fill={hairCol} />;
      case 'bun':
        return <circle cx={-44} cy={-50} r={26} fill={hairCol} />;
      default:
        return null;
    }
  };
  const hairFront = () => {
    if (sil) return null;
    switch (hair) {
      case 'short':
        return <path d="M-60 -6 C-66 -60 -20 -78 18 -70 C44 -66 62 -46 60 -24 C40 -40 10 -44 -14 -40 C-30 -38 -40 -28 -44 -6 Z" fill={hairCol} />;
      case 'side':
        return <path d="M-60 -2 C-68 -62 -10 -84 30 -66 C52 -56 64 -36 58 -12 C46 -34 34 -48 4 -46 C-24 -44 -40 -26 -46 2 Z" fill={hairCol} />;
      case 'curly':
        return (
          <g fill={hairCol}>
            {[-50, -30, -8, 14, 34, 50].map((cx, i) => (
              <circle key={i} cx={cx} cy={-52 + Math.abs(cx) * 0.25 + (i % 2) * 6} r={20} />
            ))}
            <circle cx={-56} cy={-20} r={18} />
          </g>
        );
      case 'long':
      case 'bun':
      case 'ponytail':
        return <path d="M-60 0 C-66 -60 -16 -80 20 -70 C46 -64 62 -42 58 -18 C38 -40 4 -46 -20 -38 C-40 -30 -46 -16 -48 6 Z" fill={hairCol} />;
      case 'tonsure':
        return <path d="M-60 -8 C-62 -30 -54 -44 -44 -50 C-36 -36 -28 -30 -18 -30 L-50 2 Z M52 -40 C60 -30 62 -20 60 -8 L44 -26 Z" fill={hairCol} />;
      case 'bald':
        return <path d="M-60 -4 C-62 -20 -58 -30 -52 -36 L-46 -4 Z" fill={hairCol} />;
      default:
        return null;
    }
  };
  const beard = () => {
    if (sil || !p.beard || p.beard === 'none') return null;
    if (p.beard === 'moustache') return <path d={`M${mouthX - 16} 22 Q${mouthX} 14 ${mouthX + 16} 22 Q${mouthX} 20 ${mouthX - 16} 22 Z`} fill={hairCol} />;
    if (p.beard === 'short') return <path d="M-44 6 C-40 50 -10 66 16 62 C40 58 52 40 54 12 C44 34 30 40 10 40 C-14 40 -30 30 -44 6 Z" fill={hairCol} />;
    return <path d="M-46 0 C-46 60 -16 92 14 90 C44 88 58 58 56 8 C46 36 30 42 10 42 C-14 42 -32 30 -46 0 Z" fill={hairCol} />;
  };
  const hatEl = () => {
    const hc = sil ?? p.hatColor;
    switch (p.hat ?? 'none') {
      case 'coif':
        return <path d="M-66 10 C-74 -60 -20 -90 20 -80 C56 -72 70 -40 64 0 C60 20 50 36 40 44 L30 30 C40 6 40 -30 10 -40 C-24 -46 -46 -20 -46 20 Z" fill={hc ?? C.paperShade} />;
      case 'hood':
        return <path d="M-74 40 C-84 -50 -30 -96 18 -88 C60 -80 80 -40 74 6 C70 34 58 54 44 64 L34 40 C44 10 42 -30 12 -42 C-24 -50 -48 -22 -48 30 Z" fill={hc ?? C.woodDark} />;
      case 'tophat':
        return (
          <g fill={hc ?? C.ink}>
            <rect x={-46} y={-140} width={88} height={92} rx={4} />
            <rect x={-70} y={-56} width={136} height={14} rx={7} />
            <rect x={-46} y={-72} width={88} height={12} fill={sil ?? C.oxblood} />
          </g>
        );
      case 'crown':
        return (
          <g>
            <path d="M-46 -52 L-46 -102 L-24 -78 L0 -110 L24 -78 L46 -102 L46 -52 Z" fill={hc ?? C.caution} />
            {!sil && <circle cx={0} cy={-70} r={7} fill={C.oxblood} />}
          </g>
        );
      case 'cap':
        return <path d="M-60 -24 C-60 -76 50 -80 58 -24 L104 -18 C104 -10 60 -10 58 -14 Z" fill={hc ?? C.slate} />;
      case 'brimmed':
        return (
          <g fill={hc ?? C.woodDark}>
            <path d="M-50 -40 C-48 -96 46 -96 48 -40 Z" />
            <ellipse cx={0} cy={-40} rx={96} ry={14} />
          </g>
        );
      case 'scholar':
        return (
          <g fill={hc ?? C.ink}>
            <path d="M-58 -42 C-58 -84 56 -84 56 -42 Z" />
            <path d="M-80 -86 L0 -112 L80 -86 L0 -64 Z" />
            {!sil && <line x1={40} y1={-80} x2={56} y2={-34} stroke={C.caution} strokeWidth={4} />}
          </g>
        );
      case 'veil':
        return <path d="M-70 60 C-80 -40 -30 -90 16 -84 C58 -78 76 -40 66 10 L40 0 C42 -32 20 -50 -6 -48 C-34 -46 -48 -20 -50 40 Z" fill={hc ?? C.paperLight} />;
      case 'beret':
        return <ellipse cx={-6} cy={-58} rx={66} ry={24} fill={hc ?? C.oxblood} transform="rotate(-8 -6 -58)" />;
      case 'surgical':
        return <path d="M-62 -16 C-64 -70 54 -78 60 -20 C30 -32 -30 -34 -62 -16 Z" fill={hc ?? C.water} />;
      default:
        return null;
    }
  };

  const handR = 15;
  const sleeve = top;
  const sleeveSh = topSh;
  const isLongSleeve = outfit !== 'casual' && outfit !== 'scrubs';
  const armW = outfit === 'robe' || outfit === 'royal' ? 38 : 32;

  const backArm = (
    <g>
      {limb2(armBack.s, armBack.e, armBack.h, armW, sil ?? (isLongSleeve ? sleeveSh : skinSh))}
      {!isLongSleeve && !sil && limb(armBack.s, {x: lerp(armBack.s.x, armBack.e.x, 0.6), y: lerp(armBack.s.y, armBack.e.y, 0.6)}, armW + 2, sleeveSh)}
      <circle cx={armBack.h.x} cy={armBack.h.y} r={handR} fill={skinSh} />
    </g>
  );
  const frontArm = (
    <g>
      {limb2(armFront.s, armFront.e, armFront.h, armW, sil ?? (isLongSleeve ? sleeve : skin))}
      {!isLongSleeve && !sil && limb(armFront.s, {x: lerp(armFront.s.x, armFront.e.x, 0.6), y: lerp(armFront.s.y, armFront.e.y, 0.6)}, armW + 2, sleeve)}
      {outfit === 'labcoat' && !sil && <circle cx={lerp(armFront.e.x, armFront.h.x, 0.86)} cy={lerp(armFront.e.y, armFront.h.y, 0.86)} r={armW / 2 + 1} fill={sleeve} />}
      <circle cx={armFront.h.x} cy={armFront.h.y} r={handR} fill={skin} />
    </g>
  );
  const legEl = (lg: {h: Pt; k: Pt; f: Pt}, col: string, shoe: string, key: string) => (
    <g key={key}>
      {limb2(lg.h, lg.k, lg.f, 36, col)}
      <ellipse cx={lg.f.x + 14} cy={lg.f.y - 4} rx={30} ry={13} fill={shoe} />
    </g>
  );

  const headRot = (p.tilt ?? 0) + k.lean * 0.3;
  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${s * f} ${s})`} opacity={p.opacity ?? 1}>
      {/* back limbs */}
      {legEl(legBack, bottomSh, shade(shoes, 0.2), 'lb')}
      {backArm}
      {/* front leg (behind long garments) */}
      {legEl(legFront, bottom, shoes, 'lf')}
      {/* lower garments */}
      {longSkirt && <path d={longSkirt} fill={outfit === 'dress' || outfit === 'royal' ? bottom : top} />}
      {longSkirt && !sil && <path d={longSkirt} fill={C.ink} opacity={0.08} transform={`translate(${hip.x * 0.02} 0)`} clipPath="none" />}
      {coatTail && <path d={coatTail} fill={top} />}
      {tunicSkirt && <path d={tunicSkirt} fill={top} />}
      {sat && long && <path d={`M${hip.x - 50} ${hip.y - 10} L${legFront.k.x + 20} ${legFront.k.y - 22} L${legFront.k.x + 22} ${legFront.f.y - 6} L${legFront.k.x - 30} ${legFront.f.y - 6} L${legFront.k.x - 20} ${legFront.k.y + 22} L${hip.x - 40} ${hip.y + 30} Z`} fill={outfit === 'dress' || outfit === 'royal' ? bottom : top} />}
      {/* torso */}
      <path d={torsoPath()} fill={top} />
      {!sil && (
        <g>
          {/* flat shade on the side away from light (back side) */}
          <path d={`M${sh.x - torsoW / 2} ${sh.y + 18} L${hip.x - waistW / 2 - 4} ${hip.y + 6} L${hip.x - waistW / 2 + 18} ${hip.y + 6} L${sh.x - torsoW / 2 + 22} ${sh.y + 10} Z`} fill={topSh} />
          {outfit === 'tunic' && <rect x={hip.x - waistW / 2 - 4} y={hip.y - 18} width={waistW + 8} height={14} fill={accent} />}
          {outfit === 'robe' && <path d={`M${sh.x + 8} ${sh.y - 8} L${sh.x + 20} ${sh.y - 8} L${hip.x + 18} ${-30} L${hip.x + 6} ${-30} Z`} fill={accent} opacity={0.9} />}
          {outfit === 'royal' && (
            <g>
              <path d={`M${sh.x - torsoW / 2 - 6} ${sh.y + 6} C${sh.x - 120} ${sh.y + 160} ${hip.x - 140} ${-80} ${hip.x - 110} ${-14} L${hip.x - 70} ${-14} L${sh.x - torsoW / 2 + 10} ${sh.y + 20} Z`} fill={accent} opacity={0.95} />
              <rect x={sh.x - torsoW / 2} y={sh.y - 14} width={torsoW} height={20} rx={10} fill={C.paperLight} />
            </g>
          )}
          {(outfit === 'coat' || outfit === 'suit') && (
            <g>
              <path d={`M${sh.x + 2} ${sh.y - 10} L${sh.x + 26} ${sh.y - 10} L${sh.x + 18} ${sh.y + 60} Z`} fill={C.paperLight} />
              <path d={`M${sh.x + 10} ${sh.y - 8} L${sh.x + 20} ${sh.y - 8} L${sh.x + 18} ${sh.y + 70} L${sh.x + 12} ${sh.y + 74} Z`} fill={accent} />
            </g>
          )}
          {outfit === 'labcoat' && (
            <g>
              <path d={`M${sh.x - 4} ${sh.y - 10} L${sh.x + 30} ${sh.y - 10} L${hip.x + 24} ${hip.y + 6} L${hip.x - 2} ${hip.y + 6} Z`} fill={C.slate} />
              <line x1={sh.x + 6} y1={sh.y - 6} x2={hip.x + 2} y2={hip.y + 150} stroke={C.paperShade} strokeWidth={4} />
              <rect x={sh.x + 28} y={sh.y + 70} width={26} height={30} rx={3} fill={C.paperShade} />
            </g>
          )}
          {outfit === 'dress' && <path d={`M${sh.x - 30} ${sh.y - 10} Q${sh.x} ${sh.y + 24} ${sh.x + 30} ${sh.y - 10}`} fill={C.paperLight} opacity={0.9} />}
          {outfit === 'casual' && <path d={`M${sh.x - 18} ${sh.y - 10} Q${sh.x} ${sh.y + 12} ${sh.x + 18} ${sh.y - 10} Z`} fill={skinSh} />}
          {outfit === 'scrubs' && <path d={`M${sh.x - 20} ${sh.y - 10} L${sh.x} ${sh.y + 24} L${sh.x + 20} ${sh.y - 10} Z`} fill={skinSh} />}
          {outfit === 'nightwear' && <circle cx={sh.x + 10} cy={sh.y + 40} r={5} fill={accent} />}
        </g>
      )}
      {/* neck + head */}
      <rect x={k.neck.x - 16} y={k.neck.y - 6} width={32} height={34} fill={skinSh} />
      <g transform={`translate(${head.x} ${head.y}) rotate(${headRot})`}>
        {hairBack()}
        {(p.hat === 'hood' || p.hat === 'veil') && !sil && <path d="M-74 40 C-80 70 -60 90 -40 96 L40 96 C50 80 50 60 44 50 Z" fill={p.hatColor ?? (p.hat === 'hood' ? C.woodDark : C.paperLight)} />}
        <ellipse cx={0} cy={0} rx={HEAD_R - 4} ry={HEAD_R + 2} fill={skin} />
        {/* jaw shade on the back side */}
        {!sil && <path d={`M${-HEAD_R + 6} 8 C${-HEAD_R + 10} 40 -20 ${HEAD_R} 0 ${HEAD_R + 2} C-24 ${HEAD_R - 4} -46 40 ${-HEAD_R + 6} 8 Z`} fill={skinSh} opacity={0.6} />}
        {/* ear */}
        {!sil && <ellipse cx={-30 + look * 6} cy={4} rx={10} ry={15} fill={skinSh} />}
        {/* nose (3/4 view, on the facing side) */}
        {!sil && <path d={`M${30 + look * 14} -2 Q${44 + look * 14} 14 ${30 + look * 14} 18`} stroke={skinSh} strokeWidth={5} fill="none" strokeLinecap="round" />}
        {!sil && eye(ex1, 'e1')}
        {!sil && eye(ex2, 'e2')}
        {!sil && brow(ex1, 'b1', 1)}
        {!sil && brow(ex2, 'b2', -1)}
        {!sil && mouth()}
        {!sil && (expr === 'happy' || expr === 'smile') && <ellipse cx={22 + look * 8} cy={16} rx={9} ry={6} fill={C.oxTint} opacity={0.6} />}
        {hairFront()}
        {beard()}
        {p.glasses && !sil && (
          <g fill="none" stroke={C.ink} strokeWidth={3.5}>
            <circle cx={ex1} cy={eyeY} r={13} />
            <circle cx={ex2} cy={eyeY} r={12} />
            <line x1={ex1 - 13} y1={eyeY} x2={ex2 + 12} y2={eyeY} />
          </g>
        )}
        {hatEl()}
      </g>
      {/* front arm on top */}
      {frontArm}
    </g>
  );
};

/**
 * Crowd: rows of people with seeded variety (outfits/skin/hair/heights) and idle life.
 * origin = front row floor line centre. Use `silhouette` for distant crowds, `era` for clothing.
 */
export const Crowd: React.FC<{
  x: number;
  y: number;
  w: number;
  n?: number;
  rows?: number;
  t?: number;
  seed?: number;
  s?: number;
  era?: 'medieval' | '19thc' | 'modern';
  silhouette?: string;
  facing?: 1 | -1 | 'mixed';
  expression?: Expression;
}> = ({x, y, w, n = 9, rows = 2, t = 0, seed = 1, s = 0.6, era = 'modern', silhouette, facing = 'mixed', expression = 'neutral'}) => {
  const outfits: Outfit[] = era === 'medieval' ? ['tunic', 'robe', 'dress', 'tunic'] : era === '19thc' ? ['coat', 'dress', 'suit', 'coat'] : ['casual', 'suit', 'casual', 'dress'];
  const hats: Hat[] = era === 'medieval' ? ['coif', 'hood', 'none', 'none', 'brimmed'] : era === '19thc' ? ['tophat', 'none', 'none', 'brimmed'] : ['none', 'none', 'cap', 'none'];
  const tops = [C.woodLight, C.evidenceLight, C.theoryLight, C.oxLight, C.slate, C.stone, C.cautionLight, C.inkLift];
  const people: React.ReactNode[] = [];
  for (let r = rows - 1; r >= 0; r--) {
    const per = Math.ceil(n / rows);
    for (let i = 0; i < per; i++) {
      const sd = seed * 100 + r * 31 + i * 7;
      const px = x - w / 2 + (w * (i + 0.5 + (r % 2) * 0.5)) / per + (rand(sd) - 0.5) * 30;
      const py = y - r * 70 * s;
      const sc = s * (1 - r * 0.12) * (0.92 + rand(sd + 1) * 0.14);
      const fc: 1 | -1 = facing === 'mixed' ? (rand(sd + 2) > 0.5 ? 1 : -1) : facing;
      const tint = r > 0 && silhouette ? silhouette : undefined;
      people.push(
        <Person
          key={`${r}-${i}`}
          x={px}
          y={py}
          s={sc}
          facing={fc}
          t={t}
          seed={Math.floor(sd)}
          outfit={outfits[Math.floor(rand(sd + 3) * outfits.length)]}
          hat={hats[Math.floor(rand(sd + 4) * hats.length)]}
          hair={(['short', 'long', 'bun', 'curly', 'side', 'bald'] as Hair[])[Math.floor(rand(sd + 5) * 6)]}
          skin={Math.floor(rand(sd + 6) * 5)}
          top={tops[Math.floor(rand(sd + 7) * tops.length)]}
          expression={expression}
          look={noise1(t * 0.2 + i, sd) * 0.6}
          silhouette={silhouette ? tint ?? silhouette : undefined}
        />
      );
    }
  }
  return <g>{people}</g>;
};
