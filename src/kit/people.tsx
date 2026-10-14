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
 * blink (auto from t unless given), lean (deg), sit (0..1 morph standing→sitting), lie (0..1 lying down).
 * Variety dials: age ('child' | 'adult' | 'elder'), build ('slim' | 'average' | 'heavy'), prop (held in front hand).
 */

export type Expression = 'neutral' | 'smile' | 'happy' | 'worried' | 'surprised' | 'thinking' | 'sad' | 'angry' | 'determined';
export type Outfit =
  | 'tunic' | 'robe' | 'dress' | 'coat' | 'labcoat' | 'suit' | 'casual' | 'royal' | 'scrubs' | 'nightwear'
  | 'peasant' | 'merchant' | 'nun' | 'soldier' | 'worker';
export type Hat =
  | 'none' | 'coif' | 'hood' | 'tophat' | 'crown' | 'cap' | 'brimmed' | 'scholar' | 'veil' | 'beret' | 'surgical'
  | 'helmet' | 'hardhat' | 'wimple';
export type Hair = 'short' | 'long' | 'bun' | 'curly' | 'bald' | 'tonsure' | 'side' | 'ponytail' | 'none';
export type Age = 'child' | 'adult' | 'elder';
export type Build = 'slim' | 'average' | 'heavy';
export type HeldProp = 'book' | 'scroll' | 'cup' | 'basket' | 'tool' | 'lantern' | 'phone';
export type PosePreset =
  | 'idle'
  | 'point' // front arm points forward/up
  | 'wave' // waves (animated from t)
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
  | 'facepalm' // hand over the eyes, head down
  | 'cross' // arms folded
  | 'armsCrossed' // = cross
  | 'carry' // both hands in front at belly height (box / basket)
  | 'kneel' // on one knee, hands together (moves the legs too)
  | 'handsOnHips'
  | 'awe'; // looking up, arms slightly open

/** arm = [shoulderDeg, elbowDeg]: 0 = hanging down, + = rotate forward (toward facing). Elbow + bends forward/up. */
export type ArmAngles = {front: [number, number]; back: [number, number]};

const L_UP = 96;
const L_FORE = 90;
const L_THIGH = 128;
const L_SHIN = 116;
const HIP_Y = -250;
const SHOULDER_Y = -408;
const HEAD_Y = -486;
const HEAD_R = 60;
const SH_FRONT = 20; // shoulder x offsets
const SH_BACK = -26;
const LIE_UP = 62;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
/** vector of length L at angle a (deg) measured from straight-down, + toward facing (right) */
const vec = (a: number, L: number) => ({x: Math.sin(rad(a)) * L, y: Math.cos(rad(a)) * L});

type Pt = {x: number; y: number};

/** two-bone IK (standing, no lean): arm angles that put the hand at (tx, ty) in figure space. */
const ik = (dx: number, tx: number, ty: number, bend: 'fwd' | 'back' | 'down'): [number, number] => {
  const sx = dx, sy = SHOULDER_Y + 10;
  const raw = Math.hypot(tx - sx, ty - sy);
  const d = Math.max(Math.abs(L_UP - L_FORE) + 2, Math.min(L_UP + L_FORE - 1, raw));
  const base = deg(Math.atan2(tx - sx, ty - sy));
  const al = deg(Math.acos((L_UP * L_UP + d * d - L_FORE * L_FORE) / (2 * L_UP * d)));
  const T = {x: sx + vec(base, d).x, y: sy + vec(base, d).y};
  const cand = [base + al, base - al].map((a) => {
    const e = {x: sx + vec(a, L_UP).x, y: sy + vec(a, L_UP).y};
    let el = deg(Math.atan2(T.x - e.x, T.y - e.y)) - a;
    el = ((((el + 180) % 360) + 360) % 360) - 180;
    return {a, el, e};
  });
  const [c0, c1] = cand;
  const pick = bend === 'fwd' ? (c0.e.x > c1.e.x ? c0 : c1) : bend === 'back' ? (c0.e.x < c1.e.x ? c0 : c1) : c0.e.y > c1.e.y ? c0 : c1;
  return [Math.round(pick.a), Math.round(pick.el)];
};

const CROSS: ArmAngles = {front: [16, -106], back: [12, 96]};
const POSES: Record<PosePreset, ArmAngles> = {
  idle: {front: [6, 12], back: [-6, 10]},
  point: {front: [86, 12], back: [-8, 14]},
  wave: {front: [100, 60], back: [-6, 12]},
  think: {front: ik(SH_FRONT, 40, -416, 'down'), back: [20, 80]},
  shrug: {front: [35, 90], back: [-35, -90]},
  present: {front: ik(SH_FRONT, 122, -330, 'down'), back: [-4, 12]},
  hold: {front: [40, 60], back: [30, 70]},
  write: {front: [50, 45], back: [25, 40]},
  cheer: {front: [130, 30], back: [-130, -30]},
  worried: {front: ik(SH_FRONT, 52, -444, 'down'), back: ik(SH_BACK, -50, -444, 'down')},
  armsOut: {front: [66, 16], back: [-66, -16]},
  reach: {front: [78, 8], back: [-10, 12]},
  handsBack: {front: [-25, -30], back: [-30, -35]},
  facepalm: {front: ik(SH_FRONT, 20, -488, 'down'), back: [-6, 10]},
  cross: CROSS,
  armsCrossed: CROSS,
  carry: {front: ik(SH_FRONT, 98, -316, 'down'), back: ik(SH_BACK, 80, -324, 'down')},
  kneel: {front: ik(SH_FRONT, 64, -376, 'down'), back: ik(SH_BACK, 58, -370, 'down')},
  handsOnHips: {front: ik(SH_FRONT, 46, -262, 'fwd'), back: ik(SH_BACK, -56, -262, 'back')},
  awe: {front: [34, 34], back: [-30, -26]},
};
/** head tilt / lean that some poses imply (used only when tilt / lean props are not given) */
const POSE_HEAD: Partial<Record<PosePreset, {tilt?: number; lean?: number}>> = {
  facepalm: {tilt: 10, lean: 3},
  think: {tilt: 4},
  awe: {tilt: -16, lean: -4},
  kneel: {lean: 4},
};

const AGE: Record<Age, {s: number; head: number}> = {child: {s: 0.62, head: 1.3}, adult: {s: 1, head: 1}, elder: {s: 0.97, head: 1}};
const BUILD: Record<Build, {torso: number; waist: number; limb: number}> = {
  slim: {torso: 0.9, waist: 0.84, limb: 0.86},
  average: {torso: 1, waist: 1, limb: 1},
  heavy: {torso: 1.16, waist: 1.5, limb: 1.18},
};

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
  lie?: number; // 0..1 lying on the back (sick / sleeping); the head ends up behind the feet
  lean?: number; // degrees, + leans forward
  look?: number; // -1 (toward back) .. 1 (toward front) head turn
  tilt?: number; // head tilt degrees
  expression?: Expression;
  talk?: number; // 0..1 mouth open
  blink?: number; // 0..1 override
  age?: Age; // child = smaller with a bigger head; elder = grey hair + slight stoop
  build?: Build;
  skin?: number; // index into C.skin (0 light .. 4 deep)
  hair?: Hair;
  hairColor?: string;
  beard?: 'none' | 'short' | 'full' | 'moustache';
  glasses?: boolean;
  outfit?: Outfit;
  top?: string; // main garment colour
  bottom?: string; // trousers / skirt colour
  accent?: string; // trim, belt, tie
  hat?: Hat; // default: none (nun → wimple, soldier → helmet, worker → hardhat)
  hatColor?: string;
  shoes?: string;
  prop?: HeldProp; // object in the front hand
  propColor?: string;
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
  peasant: {top: C.stone, bottom: C.woodDark, accent: C.paperShade, long: false},
  merchant: {top: C.evidence, bottom: C.inkLift, accent: C.caution, long: false},
  nun: {top: C.ink, bottom: C.ink, accent: C.paperLight, long: true},
  soldier: {top: C.slate, bottom: C.inkLift, accent: C.oxblood, long: false},
  worker: {top: C.water, bottom: C.slate, accent: C.cautionLight, long: false},
};
/** hat used when `hat` is not given */
const OUTFIT_HAT: Partial<Record<Outfit, Hat>> = {nun: 'wimple', soldier: 'helmet', worker: 'hardhat'};

/** Compute the skeleton (in the figure's local, facing-right space: origin feet, y down positive). */
const skeleton = (p: PersonProps) => {
  const sit = clamp01(p.sit ?? 0);
  const walking = p.walk !== undefined && sit < 0.5;
  const ph = (p.walk ?? 0) * Math.PI * 2;
  const amp = walking ? (p.stride ?? 1) : 0;
  const bob = walking ? -Math.abs(Math.cos(ph)) * 6 * amp + 3 * amp : 0;
  const breathe = Math.sin((p.t ?? 0) * 1.7 + (p.seed ?? 0)) * 1.6;
  const kneel = p.pose === 'kneel' && sit < 0.5 && !walking;

  // legs: [hipDeg, kneeDeg]; knee negative = shin swings back
  const legA = kneel ? [80, -80] : walking ? [22 * Math.sin(ph) * amp, -Math.max(0, 30 * Math.sin(ph - 1.4)) * amp - 3] : [3, -2];
  const legB = kneel ? [10, -100] : walking ? [22 * Math.sin(ph + Math.PI) * amp, -Math.max(0, 30 * Math.sin(ph + Math.PI - 1.4)) * amp - 3] : [-3, -2];
  // sitting: thighs forward (90deg), shins down
  const thighA = lerp(legA[0], 88, sit);
  const thighB = lerp(legB[0], 84, sit);
  const kneeA = lerp(legA[1], -88, sit);
  const kneeB = lerp(legB[1], -80, sit);

  // seat geometry is fixed (hips 118 above / 104 behind the feet) so existing scenes keep working
  const hipY = lerp(kneel ? -144 : HIP_Y + bob, -118, sit);
  const hipX = lerp(kneel ? -40 : 0, -104, sit);
  const hip = {x: hipX, y: hipY};
  const ph0 = POSE_HEAD[p.pose ?? 'idle'];
  const lean = (p.lean ?? ph0?.lean ?? 0) + (p.age === 'elder' ? 7 : 0) + (walking ? 3 * amp : 0) + sit * -2;
  const bd = BUILD[p.build ?? 'average'];
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
  if (p.pose === 'wave' && !p.arms?.front) armsDeg.front = [base.front[0], base.front[1] + Math.sin((p.t ?? 0) * 7) * 16];
  const arm = (a: [number, number], dx: number) => {
    const s0 = {x: sh.x + dx, y: sh.y + 10};
    const e = {x: s0.x + vec(a[0] + lean, L_UP).x, y: s0.y + vec(a[0] + lean, L_UP).y};
    const h = {x: e.x + vec(a[0] + a[1] + lean, L_FORE).x, y: e.y + vec(a[0] + a[1] + lean, L_FORE).y};
    return {s: s0, e, h};
  };
  const armFront = arm(armsDeg.front, SH_FRONT * bd.torso);
  const armBack = arm(armsDeg.back, SH_BACK * bd.torso);
  return {hip, sh, neck, head, legFront, legBack, armFront, armBack, lean, sit};
};

/** World-space hand positions (for attaching held objects): {front, back, head}. Same props as <Person>. */
export const personHands = (p: PersonProps) => {
  const k = skeleton(p);
  const s = (p.s ?? 1) * AGE[p.age ?? 'adult'].s;
  const f = p.facing ?? 1;
  const lie = clamp01(p.lie ?? 0);
  const th = rad(-90 * lie);
  const w = (pt: Pt) => {
    const q = {x: pt.x * Math.cos(th) - pt.y * Math.sin(th), y: pt.x * Math.sin(th) + pt.y * Math.cos(th) - lie * LIE_UP};
    return {x: p.x + q.x * s * f, y: p.y + q.y * s};
  };
  return {front: w(k.armFront.h), back: w(k.armBack.h), head: w(k.head)};
};

const limb = (a: Pt, b: Pt, w: number, color: string, key?: string) => <line key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={w} strokeLinecap="round" />;

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
  const age = AGE[p.age ?? 'adult'];
  const s = (p.s ?? 1) * age.s;
  const f = p.facing ?? 1;
  const t = p.t ?? 0;
  const lie = clamp01(p.lie ?? 0);
  const k = skeleton(p);
  const bd = BUILD[p.build ?? 'average'];
  const outfit = p.outfit ?? 'casual';
  const hat: Hat = p.hat ?? OUTFIT_HAT[outfit] ?? 'none';
  const od = OUTFIT_DEFAULTS[outfit];
  const sil = p.silhouette;
  const top = sil ?? p.top ?? od.top;
  const bottom = sil ?? p.bottom ?? od.bottom;
  const accent = sil ?? p.accent ?? od.accent;
  const skinI = Math.max(0, Math.min(C.skin.length - 1, p.skin ?? 1));
  const skin = sil ?? C.skin[skinI];
  const skinSh = sil ?? C.skinShade[skinI];
  const hairCol = sil ?? p.hairColor ?? (p.age === 'elder' ? C.hair[4] : C.hair[(p.seed ?? 0) % 3]);
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
  const torsoW = 118 * bd.torso;
  const waistW = 96 * bd.waist;

  // ---------- garment silhouettes
  const torsoPath = () => {
    const sx = sh.x, sy = sh.y, hx = hip.x, hy = hip.y;
    const bulge = 6 + (bd.waist - 1) * 60; // soft chest / belly curve on the front side
    const mx = (sx + hx) / 2, my = (sy + hy) / 2;
    return `M${sx - torsoW / 2} ${sy + 22} Q${sx - torsoW / 2} ${sy - 8} ${sx - torsoW / 2 + 30} ${sy - 10} L${sx + torsoW / 2 - 30} ${sy - 10} Q${sx + torsoW / 2} ${sy - 8} ${sx + torsoW / 2} ${sy + 22} Q${mx + (torsoW + waistW) / 4 + bulge} ${my + 20} ${hx + waistW / 2 + 4} ${hy + 6} L${hx - waistW / 2 - 4} ${hy + 6} Q${mx - (torsoW + waistW) / 4 - 4} ${my} ${sx - torsoW / 2} ${sy + 22} Z`;
  };
  const sway = p.walk !== undefined ? Math.sin(p.walk * Math.PI * 2) * 10 : 0;
  const skirtPath = (len: number, flare: number) => {
    const hx = hip.x, hy = hip.y - 10;
    const by = Math.min(-14, hy + len);
    return `M${hx - waistW / 2 - 2} ${hy} L${hx + waistW / 2 + 2} ${hy} L${hx + flare / 2 + sway} ${by} Q${hx + sway} ${by + 10} ${hx - flare / 2 + sway} ${by} Z`;
  };
  const sat = k.sit > 0.5;
  const kneeling = p.pose === 'kneel' && !sat && p.walk === undefined;
  // long garments: skirt to the floor (standing) or over the lap (sitting)
  const longSkirt = long && !sat ? skirtPath(-hip.y - 4, 196 * bd.waist) : null;
  const coatTail = (outfit === 'coat' || outfit === 'labcoat') && !sat ? skirtPath(150, 150) : outfit === 'merchant' && !sat ? skirtPath(176, 160 * bd.waist) : null;
  const tunicSkirt = (outfit === 'tunic' || outfit === 'peasant' || outfit === 'soldier') && !sat ? skirtPath(kneeling ? 70 : outfit === 'peasant' ? 120 : 100, 150 * bd.waist) : null;

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
    switch (hat) {
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
      case 'helmet':
        return (
          <g>
            <path d="M-64 -14 C-66 -84 60 -90 62 -14 Z" fill={hc ?? C.metal} />
            <rect x={-72} y={-22} width={142} height={12} rx={6} fill={sil ?? C.stoneDark} />
            {!sil && <path d="M-30 -60 C-20 -74 10 -78 26 -70" stroke={C.paperShade} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.7} />}
          </g>
        );
      case 'hardhat':
        return (
          <g fill={hc ?? C.caution}>
            <path d="M-60 -28 C-60 -94 58 -94 58 -28 Z" />
            <rect x={-70} y={-34} width={146} height={12} rx={6} />
            {!sil && <rect x={-6} y={-90} width={12} height={58} rx={5} fill={C.cautionLight} />}
          </g>
        );
      case 'wimple':
        return (
          <g>
            <path d="M-74 60 C-84 -50 -30 -94 16 -88 C60 -82 80 -44 70 10 L46 0 C48 -34 24 -54 -4 -52 C-34 -50 -50 -22 -52 46 Z" fill={hc ?? C.ink} />
            {!sil && <path d="M-50 -30 C-40 -58 30 -62 50 -26 L44 -14 C24 -44 -30 -44 -44 -18 Z" fill={C.paperLight} />}
            {!sil && <path d="M-46 40 C-30 70 30 74 46 46 L46 64 C26 84 -28 84 -46 60 Z" fill={C.paperLight} />}
          </g>
        );
      default:
        return null;
    }
  };

  const sleeve = top;
  const sleeveSh = topSh;
  const isLongSleeve = outfit !== 'casual' && outfit !== 'scrubs';
  const armW = (outfit === 'robe' || outfit === 'royal' || outfit === 'nun' ? 38 : 32) * bd.limb;
  const foreW = armW * 0.86;

  /** mitten hand: rounded palm along the forearm + a thumb */
  const handLine = sil ? undefined : shade(skin, 0.35);
  const hand = (e: Pt, h: Pt, col: string, outline?: boolean) => {
    const a = deg(Math.atan2(h.y - e.y, h.x - e.x));
    const st = outline && handLine ? {stroke: handLine, strokeWidth: 3} : {};
    return (
      <g transform={`translate(${h.x} ${h.y}) rotate(${a})`}>
        <ellipse cx={-3} cy={-12} rx={8} ry={6.5} fill={col} transform="rotate(-30 -3 -12)" {...st} />
        <ellipse cx={5} cy={0} rx={19} ry={15.5} fill={col} {...st} />
        {outline && <ellipse cx={-3} cy={-12} rx={6.5} ry={5} fill={col} transform="rotate(-30 -3 -12)" />}
      </g>
    );
  };
  const armEl = (ar: {s: Pt; e: Pt; h: Pt}, col: string, sl: string, hc: string, cuff?: string, contour?: string) => (
    <g>
      {contour && limb(ar.e, ar.h, foreW + 6, contour)}
      {contour && limb(ar.s, ar.e, armW + 6, contour)}
      {limb(ar.e, ar.h, foreW, col)}
      {limb(ar.s, ar.e, armW, col)}
      {!isLongSleeve && !sil && limb(ar.s, {x: lerp(ar.s.x, ar.e.x, 0.6), y: lerp(ar.s.y, ar.e.y, 0.6)}, armW + 2, sl)}
      {cuff && <circle cx={lerp(ar.e.x, ar.h.x, 0.84)} cy={lerp(ar.e.y, ar.h.y, 0.84)} r={foreW / 2 + 1.5} fill={cuff} />}
      {hand(ar.e, ar.h, hc, !!contour)}
    </g>
  );
  const backArm = armEl(armBack, sil ?? (isLongSleeve ? sleeveSh : skinSh), sleeveSh, skinSh);
  // front arm gets a thin darker contour so it reads over a same-coloured torso / face
  const frontArm = armEl(armFront, sil ?? (isLongSleeve ? sleeve : skin), sleeve, skin, outfit === 'labcoat' && !sil ? sleeve : undefined, sil ? undefined : isLongSleeve ? shade(top, 0.4) : handLine);
  const legW = 36 * bd.limb;
  const legEl = (lg: {h: Pt; k: Pt; f: Pt}, col: string, shoe: string, key: string) => (
    <g key={key}>
      {limb(lg.k, lg.f, legW * 0.88, col)}
      {limb(lg.h, lg.k, legW, col)}
      <path d={`M${lg.f.x - 16} ${lg.f.y + 6} C${lg.f.x - 20} ${lg.f.y - 18} ${lg.f.x + 30} ${lg.f.y - 20} ${lg.f.x + 42} ${lg.f.y + 2} C${lg.f.x + 44} ${lg.f.y + 8} ${lg.f.x + 40} ${lg.f.y + 9} ${lg.f.x + 34} ${lg.f.y + 9} L${lg.f.x - 12} ${lg.f.y + 9} Z`} fill={shoe} />
    </g>
  );

  // ---------- held prop (front hand, kept upright in figure space)
  const propEl = () => {
    if (!p.prop) return null;
    const {x: hx, y: hy} = armFront.h;
    const pc = sil ?? p.propColor;
    const lt = (c: string) => sil ?? c;
    switch (p.prop) {
      case 'book':
        return (
          <g>
            <rect x={hx - 8} y={hy - 50} width={50} height={64} rx={4} fill={pc ?? C.oxblood} />
            <rect x={hx + 34} y={hy - 46} width={6} height={56} fill={lt(C.paperLight)} />
            <rect x={hx} y={hy - 34} width={26} height={6} rx={3} fill={lt(C.caution)} />
          </g>
        );
      case 'scroll':
        return (
          <g>
            <rect x={hx - 30} y={hy - 46} width={64} height={54} fill={pc ?? C.bone} />
            <rect x={hx - 36} y={hy - 54} width={76} height={14} rx={7} fill={lt(C.boneShade)} />
            <rect x={hx - 36} y={hy + 2} width={76} height={14} rx={7} fill={lt(C.boneShade)} />
            {!sil && [0, 1, 2].map((i) => <line key={i} x1={hx - 20} y1={hy - 30 + i * 12} x2={hx + 22} y2={hy - 30 + i * 12} stroke={C.inkFaint} strokeWidth={3} strokeLinecap="round" />)}
          </g>
        );
      case 'cup':
        return (
          <g>
            <path d={`M${hx - 4} ${hy - 40} L${hx + 34} ${hy - 40} L${hx + 30} ${hy + 4} L${hx} ${hy + 4} Z`} fill={pc ?? C.paperLight} />
            <rect x={hx - 6} y={hy - 44} width={42} height={8} rx={4} fill={lt(C.paperShade)} />
          </g>
        );
      case 'basket':
        return (
          <g>
            <path d={`M${hx - 40} ${hy + 30} C${hx - 40} ${hy - 30} ${hx + 40} ${hy - 30} ${hx + 40} ${hy + 30}`} stroke={lt(C.wood)} strokeWidth={7} fill="none" />
            <path d={`M${hx - 52} ${hy + 26} L${hx + 52} ${hy + 26} L${hx + 40} ${hy + 80} L${hx - 40} ${hy + 80} Z`} fill={pc ?? C.woodLight} />
            {!sil && <line x1={hx - 46} y1={hy + 46} x2={hx + 46} y2={hy + 46} stroke={C.wood} strokeWidth={4} />}
            {!sil && <line x1={hx - 42} y1={hy + 63} x2={hx + 42} y2={hy + 63} stroke={C.wood} strokeWidth={4} />}
          </g>
        );
      case 'tool':
        return (
          <g>
            <rect x={hx - 5} y={hy - 70} width={10} height={100} rx={4} fill={lt(C.wood)} />
            <rect x={hx - 24} y={hy - 86} width={48} height={22} rx={4} fill={pc ?? C.metal} />
          </g>
        );
      case 'lantern':
        return (
          <g>
            <line x1={hx} y1={hy} x2={hx} y2={hy + 24} stroke={lt(C.inkLift)} strokeWidth={4} />
            <rect x={hx - 18} y={hy + 22} width={36} height={10} rx={3} fill={lt(C.inkLift)} />
            <rect x={hx - 15} y={hy + 32} width={30} height={40} fill={pc ?? C.lamp} />
            {!sil && <line x1={hx} y1={hy + 32} x2={hx} y2={hy + 72} stroke={C.inkLift} strokeWidth={3} />}
            <rect x={hx - 19} y={hy + 70} width={38} height={10} rx={3} fill={lt(C.inkLift)} />
          </g>
        );
      case 'phone':
        return (
          <g>
            <rect x={hx - 4} y={hy - 46} width={26} height={46} rx={5} fill={pc ?? C.ink} />
            {!sil && <rect x={hx} y={hy - 41} width={18} height={34} rx={2} fill={C.slate} />}
          </g>
        );
      default:
        return null;
    }
  };

  // ---------- outfit details drawn over the torso (new outfits)
  const extras = () => {
    if (sil) return null;
    const hx = hip.x, hy = hip.y;
    switch (outfit) {
      case 'peasant':
        return (
          <g>
            <rect x={hx - waistW / 2 - 4} y={hy - 16} width={waistW + 8} height={10} fill={C.woodDark} />
            <path d={`M${hx - 18} ${hy - 8} L${hx + waistW / 2} ${hy - 8} L${hx + waistW / 2 + 14} ${hy + (kneeling ? 60 : 104)} L${hx - 10} ${hy + (kneeling ? 60 : 104)} Z`} fill={accent} />
          </g>
        );
      case 'merchant':
        return (
          <g>
            <path d={`M${sh.x + 4} ${sh.y - 10} L${sh.x + 26} ${sh.y - 10} L${hx + 24} ${hy - 14} L${hx + 6} ${hy - 14} Z`} fill={C.paperShade} />
            <rect x={hx - waistW / 2 - 4} y={hy - 18} width={waistW + 8} height={14} fill={accent} />
            <path d={`M${hx + 14} ${hy - 4} L${hx + 40} ${hy - 4} L${hx + 38} ${hy + 30} Q${hx + 27} ${hy + 38} ${hx + 16} ${hy + 30} Z`} fill={C.wood} />
          </g>
        );
      case 'nun':
        return <path d={`M${sh.x - 34} ${sh.y - 10} Q${sh.x} ${sh.y + 40} ${sh.x + 38} ${sh.y - 10} Z`} fill={accent} />;
      case 'soldier':
        return (
          <g>
            <path d={`M${sh.x - 20} ${sh.y - 10} L${sh.x + 40} ${sh.y - 10} L${hx + 42} ${hy + (kneeling ? 50 : 80)} L${hx - 14} ${hy + (kneeling ? 50 : 80)} Z`} fill={accent} />
            <rect x={hx - waistW / 2 - 4} y={hy - 18} width={waistW + 8} height={14} fill={C.woodDark} />
            <rect x={hx + 6} y={hy - 20} width={16} height={18} rx={3} fill={C.metal} />
          </g>
        );
      case 'worker':
        return (
          <g>
            <path d={`M${sh.x - torsoW / 2 + 12} ${sh.y - 8} L${sh.x - 6} ${sh.y - 8} L${hx + 2} ${hy + 6} L${hx - waistW / 2 + 2} ${hy + 6} Z`} fill={accent} />
            <path d={`M${sh.x + 18} ${sh.y - 8} L${sh.x + torsoW / 2 - 10} ${sh.y - 8} L${hx + waistW / 2 + 2} ${hy + 6} L${hx + 26} ${hy + 6} Z`} fill={accent} />
            <path d={`M${hx - waistW / 2 + 2} ${hy - 44} L${hx + waistW / 2 + 2} ${hy - 44} L${hx + waistW / 2 + 2} ${hy - 34} L${hx - waistW / 2 + 2} ${hy - 34} Z`} fill={C.paperLight} />
            <path d={`M${sh.x - 14} ${sh.y - 10} L${sh.x + 2} ${sh.y + 16} L${sh.x + 18} ${sh.y - 10} Z`} fill={skinSh} />
          </g>
        );
      default:
        return null;
    }
  };

  const headRot = (p.tilt ?? POSE_HEAD[p.pose ?? 'idle']?.tilt ?? 0) + (p.age === 'elder' ? 4 : 0) + k.lean * 0.3;
  const hs = age.head;
  const lieT = lie > 0 ? ` translate(0 ${-lie * LIE_UP}) rotate(${-90 * lie})` : '';
  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${s * f} ${s})${lieT}`} opacity={p.opacity ?? 1}>
      {/* back limbs */}
      {legEl(legBack, bottomSh, shade(shoes, 0.2), 'lb')}
      {backArm}
      {/* front leg (behind long garments) */}
      {legEl(legFront, bottom, shoes, 'lf')}
      {/* lower garments */}
      {longSkirt && <path d={longSkirt} fill={outfit === 'dress' || outfit === 'royal' || outfit === 'nun' ? bottom : top} />}
      {longSkirt && !sil && <path d={longSkirt} fill={C.ink} opacity={0.08} transform={`translate(${hip.x * 0.02} 0)`} clipPath="none" />}
      {coatTail && <path d={coatTail} fill={top} />}
      {tunicSkirt && <path d={tunicSkirt} fill={top} />}
      {sat && long && <path d={`M${hip.x - 50} ${hip.y - 10} L${legFront.k.x + 20} ${legFront.k.y - 22} L${legFront.k.x + 22} ${legFront.f.y - 6} L${legFront.k.x - 30} ${legFront.f.y - 6} L${legFront.k.x - 20} ${legFront.k.y + 22} L${hip.x - 40} ${hip.y + 30} Z`} fill={outfit === 'dress' || outfit === 'royal' || outfit === 'nun' ? bottom : top} />}
      {/* torso */}
      <path d={torsoPath()} fill={top} />
      {!sil && (
        <g>
          {/* flat shade on the side away from light (back side) */}
          <path d={`M${sh.x - torsoW / 2} ${sh.y + 22} L${hip.x - waistW / 2 - 4} ${hip.y + 6} L${hip.x - waistW / 2 + 18} ${hip.y + 6} L${sh.x - torsoW / 2 + 22} ${sh.y + 12} Z`} fill={topSh} />
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
      {extras()}
      {/* neck + head */}
      <rect x={k.neck.x - 16} y={k.neck.y - 6} width={32} height={34} fill={skinSh} />
      <g transform={`translate(${head.x} ${head.y - (hs - 1) * 46}) rotate(${headRot})${hs !== 1 ? ` scale(${hs})` : ''}`}>
        {hairBack()}
        {(hat === 'hood' || hat === 'veil' || hat === 'wimple') && !sil && <path d="M-74 40 C-80 70 -60 90 -40 96 L40 96 C50 80 50 60 44 50 Z" fill={p.hatColor ?? (hat === 'hood' ? C.woodDark : hat === 'wimple' ? C.ink : C.paperLight)} />}
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
      {/* front arm on top; a held prop sits in the hand (hand redrawn over it) */}
      {frontArm}
      {propEl()}
      {p.prop && hand(armFront.e, armFront.h, skin, !sil)}
    </g>
  );
};

/**
 * Crowd: rows of people with seeded variety (outfits/skin/hair/heights) and idle life.
 * origin = front row floor line centre. Use `silhouette` for distant crowds, `era` for clothing,
 * `variety` to mix in children / elders and slim / heavy builds.
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
  variety?: boolean;
}> = ({x, y, w, n = 9, rows = 2, t = 0, seed = 1, s = 0.6, era = 'modern', silhouette, facing = 'mixed', expression = 'neutral', variety = false}) => {
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
      const av = rand(sd + 8);
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
          age={variety ? (av < 0.16 ? 'child' : av > 0.84 ? 'elder' : 'adult') : undefined}
          build={variety ? (['slim', 'average', 'average', 'heavy'] as Build[])[Math.floor(rand(sd + 9) * 4)] : undefined}
          silhouette={silhouette ? tint ?? silhouette : undefined}
        />
      );
    }
  }
  return <g>{people}</g>;
};
