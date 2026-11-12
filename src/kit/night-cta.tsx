// NIGHT CTA (owner 2026-11-11): "make it easy for people — especially on phones — to really hit like and subscribe".
// The script's closing line («إذا عجبك المقطع اضغط زر اللايك واشترك في القناة») acted out in the night look, each press
// ON its spoken word. Our own drawn icons (a glowing thumb, a red «اشترك» pill, a bell) — never YouTube's logo. Phones:
// the real buttons sit UNDER the video, so the pieces point DOWN to where the thumb goes.
//   CtaPress  (A) — the like + subscribe buttons pop beside AZTIKA; a tap presses each on its word; the bell rings
//   CtaPhone  (B) — a phone shows a video with the like/subscribe row under it; a finger taps them in order
//   CtaBoard  (C) — the game's last step: like + subscribe climb onto glowing podiums like champions
//   EndScreen (D) — the last ≈ 10 s: a calm frame that leaves room for YouTube's REAL end-screen buttons
import React from 'react';
import {clamp01, ease, popRef} from './anim';
/** a button PRESS: sinks smoothly to 90 % and comes back in 0.22 s (never a snap) */
const pressDip = (t: number, press: number) => (t >= press && t < press + 0.22 ? 1 - 0.1 * Math.sin((Math.PI * (t - press)) / 0.22) : 1);
import {GlowText, GridFloor, NightSky, Podium} from './night';
import {Rays} from './night-fx';
import {Phone} from './night-ui';
import {move} from './night-scenes';
import {cueSfx} from './sfx';
import {lb, uid} from './stage';

const OUT = '#14101C', GOLD = '#FFC928', RED = '#E8303D';

// ── icons (drawn centred at 0,0, about `s` px tall) ──────────────────────────────────────────────────────────────────
export const ThumbIcon: React.FC<{s: number; fill: string; stroke?: string}> = ({s, fill, stroke = OUT}) => {
  const k = s / 100;
  return (
    <g transform={`scale(${k})`}>
      <rect x={-46} y={-6} width={22} height={50} rx={6} fill={fill} stroke={stroke} strokeWidth={8} strokeLinejoin="round" />
      <path d="M-18 -6 L-2 -40 Q4 -52 14 -46 Q22 -41 18 -26 L12 -10 L36 -10 Q50 -10 48 4 L42 34 Q38 44 26 44 L-18 44 Z" fill={fill} stroke={stroke} strokeWidth={8} strokeLinejoin="round" />
    </g>
  );
};
export const BellIcon: React.FC<{s: number; fill: string; swing?: number}> = ({s, fill, swing = 0}) => {
  const k = s / 100;
  return (
    <g transform={`scale(${k}) rotate(${swing} 0 -46)`}>
      <circle cx={0} cy={-46} r={7} fill={fill} stroke={OUT} strokeWidth={7} />
      <path d="M-34 22 Q-34 -40 0 -40 Q34 -40 34 22 L44 32 L-44 32 Z" fill={fill} stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
      <path d={`M-12 34 Q0 ${48 - swing * 0.2} 12 34`} fill={fill} stroke={OUT} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
};
/** a pointing finger (tip at 0,0, pointing up-left), drawn in the cast's style: round, thick outline */
export const Finger: React.FC<{s?: number}> = ({s = 1}) => (
  <g transform={`scale(${s})`}>
    <path d="M0 0 Q-8 -4 -6 -14 Q-2 -24 8 -18 L22 2 L30 -4 Q40 -8 44 2 L50 0 Q60 -2 62 8 L66 6 Q76 6 76 18 L76 48 Q76 74 52 80 L30 80 Q14 76 8 60 L-6 26 Q-10 14 0 10 Z"
      fill="#F2D3B3" stroke={OUT} strokeWidth={7} strokeLinejoin="round" transform="rotate(-25)" />
  </g>
);
/** the tap: a finger dips in, a ring ripples out from the press point */
const Tap: React.FC<{t: number; at: number; x: number; y: number; s?: number}> = ({t, at, x, y, s = 1}) => {
  const u = t - at;
  if (u < -0.35 || u > 0.7) return null;
  const inK = ease.out(clamp01((u + 0.35) / 0.3)), dip = u >= 0 && u < 0.18 ? Math.sin((u / 0.18) * Math.PI) * 10 : 0;
  const ring = clamp01(u / 0.45);
  return (
    <g>
      {u >= 0 && <circle cx={x} cy={y} r={20 + 90 * ease.out(ring) * s} fill="none" stroke="#FFFFFF" strokeWidth={6 * (1 - ring)} opacity={1 - ring} />}
      <g transform={`translate(${x + 26 * s - 30 * (1 - inK)} ${y + 22 * s + 40 * (1 - inK) + dip})`} opacity={inK * (u > 0.45 ? 1 - (u - 0.45) / 0.25 : 1)}>
        <Finger s={1.1 * s} />
      </g>
    </g>
  );
};

// ── the buttons ──────────────────────────────────────────────────────────────────────────────────────────────────────
/** a glowing like button: pops in at `at`, PRESSED at `press` (fills gold, sparkles) */
export const LikeButton: React.FC<{t: number; at: number; press: number; x: number; y: number; size?: number; id: string}> = ({t, at, press, x, y, size = 170, id}) => {
  if (t < at) return null;
  cueSfx('pop', `like-in-${id}-${at}`, t < at + 0.3, x, {at, hit: 0.125});
  cueSfx('click', `like-press-${id}-${press}`, t >= press && t < press + 0.3, x, {at: press, hit: 0.03});
  cueSfx('sparkle', `like-done-${id}-${press}`, t >= press && t < press + 0.3, x, {at: press + 0.05, hit: 0.1});
  const q = popRef(clamp01((t - at) / 0.3));
  const d = pressDip(t, press);
  const on = clamp01((t - press) / 0.12);
  const g = uid('ctalike', id);
  const r = size / 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${q.sx * d} ${q.sy * d})`} opacity={q.o} {...lb('text', `like-${id}`)}>
      <defs><filter id={g} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={size * 0.12} /></filter></defs>
      <circle r={r * 1.05} fill={on > 0 ? GOLD : '#7FD8FF'} opacity={0.35 + 0.25 * on} filter={`url(#${g})`} />
      <rect x={-r} y={-r} width={size} height={size} rx={size * 0.28} fill={on > 0 ? '#3A2A08' : '#1E1A3C'} stroke={on > 0 ? GOLD : '#7FD8FF'} strokeWidth={9} />
      <ThumbIcon s={size * 0.62} fill={on > 0 ? GOLD : '#FFFFFF'} />
      {t >= press && t < press + 0.7 && Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 2, d = r * (1.1 + 0.7 * ease.out(clamp01((t - press) / 0.5)));
        return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={8 * (1 - clamp01((t - press) / 0.7))} fill={GOLD} />;
      })}
    </g>
  );
};
/** the subscribe pill: red «اشترك» → pressed at `press` → grey «مشترك ✓» */
export const SubscribeButton: React.FC<{t: number; at: number; press: number; x: number; y: number; size?: number; id: string}> = ({t, at, press, x, y, size = 64, id}) => {
  if (t < at) return null;
  cueSfx('pop', `sub-in-${id}-${at}`, t < at + 0.3, x, {at, hit: 0.125});
  cueSfx('click', `sub-press-${id}-${press}`, t >= press && t < press + 0.3, x, {at: press, hit: 0.03});
  const q = popRef(clamp01((t - at) / 0.3));
  const done = t >= press + 0.1;
  const label = done ? 'مشترك ✓' : 'اشترك';
  const w = size * (done ? 5.0 : 4.2), h = size * 1.55;
  const dip = pressDip(t, press);
  const g = uid('ctasub', id);
  return (
    <g transform={`translate(${x} ${y}) scale(${q.sx * dip} ${q.sy * dip})`} opacity={q.o} {...lb('text', `sub-${id}`, label)}>
      <defs><filter id={g} x="-60%" y="-120%" width="220%" height="340%"><feGaussianBlur stdDeviation={size * 0.25} /></filter></defs>
      {!done && <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={RED} opacity={0.5} filter={`url(#${g})`} />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={done ? '#3A3550' : RED} stroke={OUT} strokeWidth={8} />
      <rect x={-w / 2 + 10} y={-h / 2 + 8} width={w - 20} height={h * 0.32} rx={h * 0.16} fill="#FFFFFF" opacity={done ? 0.08 : 0.22} />
      <GlowText text={label} x={0} y={size * 0.05} size={size} tone="white" id={`${g}-t`} glow={done ? 0 : 0.6} />
    </g>
  );
};
/** the bell: appears at `at`, RINGS at `ring` (a damped swing + its ding) */
export const RingBell: React.FC<{t: number; at: number; ring: number; x: number; y: number; size?: number; id: string}> = ({t, at, ring, x, y, size = 110, id}) => {
  if (t < at) return null;
  cueSfx('pop', `bell-in-${id}-${at}`, t < at + 0.3, x, {at, hit: 0.125});
  cueSfx('ding', `bell-ring-${id}-${ring}`, t >= ring && t < ring + 0.3, x, {at: ring, hit: 0.05});
  const q = popRef(clamp01((t - at) / 0.3));
  const u = t - ring;
  const swing = u > 0 ? 24 * Math.exp(-u * 3.2) * Math.sin(u * 22) : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o} {...lb('object', `bell-${id}`)}>
      <BellIcon s={size} fill={u > 0 ? GOLD : '#FFFFFF'} swing={swing} />
      {u > 0 && u < 0.8 && [1, -1].map((side) => (
        <path key={side} d={`M${side * size * 0.55} ${-size * 0.35} q${side * 14} ${size * 0.15} 0 ${size * 0.3}`} fill="none" stroke={GOLD} strokeWidth={6} strokeLinecap="round" opacity={1 - u / 0.8} />
      ))}
    </g>
  );
};
/** arrows pointing DOWN to where the real buttons are on a phone (under the video) */
export const DownArrows: React.FC<{t: number; at: number; x: number; y: number; id: string; s?: number}> = ({t, at, x, y, id, s = 1}) => {
  if (t < at) return null;
  cueSfx('whoosh', `down-${id}-${at}`, t < at + 0.3, x, {at, hit: 0.2});
  const k = ease.out(clamp01((t - at) / 0.35));
  return (
    <g opacity={k}>
      {[0, 1, 2].map((i) => {
        const ph = ((t - at) * 1.6 + i / 3) % 1; // a calm cascade down
        return <path key={i} d={`M${x - 34 * s} ${y + (i * 34 + ph * 10) * s} l${34 * s} ${26 * s} l${34 * s} ${-26 * s}`} fill="none" stroke={GOLD} strokeWidth={12 * s} strokeLinecap="round" strokeLinejoin="round" opacity={(0.35 + 0.65 * (1 - Math.abs(ph - 0.5) * 2)) * k} />;
      })}
    </g>
  );
};

// ── A · AZTIKA presses it ────────────────────────────────────────────────────────────────────────────────────────────
export const CtaPress: React.FC<{t: number; at: number; like: number; sub: number; bell?: number; x?: number; y?: number; id: string}> = ({t, at, like, sub, bell, x = 1120, y = 520, id}) => (
  <g>
    <LikeButton t={t} at={at} press={like} x={x - 330} y={y} size={230} id={id} />
    <SubscribeButton t={t} at={like + 0.4} press={sub} x={x + 140} y={y} size={84} id={id} />
    <RingBell t={t} at={sub + 0.25} ring={bell ?? sub + 0.6} x={x + 520} y={y - 6} size={140} id={id} />
    <Tap t={t} at={like} x={x - 330} y={y} s={1.3} />
    <Tap t={t} at={sub} x={x + 140} y={y} s={1.3} />
    <DownArrows t={t} at={(bell ?? sub + 0.6) + 0.35} x={x} y={y + 200} id={id} />
  </g>
);

// ── B · the phone that teaches ───────────────────────────────────────────────────────────────────────────────────────
export const CtaPhone: React.FC<{t: number; at: number; like: number; sub: number; bell?: number; x?: number; y?: number; id: string}> = ({t, at, like, sub, bell, x = 1180, y = 540, id}) => {
  const ring = bell ?? sub + 0.7;
  // the phone's screen space (night-ui Phone): 450 × 900 units, origin top-left
  const ROW = 392; // the row UNDER the video — where the real buttons are on a phone
  const likeP: [number, number] = [100, ROW], subP: [number, number] = [282, ROW], bellP: [number, number] = [408, ROW];
  // the finger travels: in from below → like → subscribe → the bell (eased in and out)
  const [fx, fy] = t < like + 0.25 ? move(t, like - 0.6, [330, 780], likeP, 0.5) : t < sub + 0.3 ? move(t, like + 0.25, likeP, subP, 0.5) : move(t, sub + 0.3, subP, bellP, 0.35);
  const swing = t >= ring ? 24 * Math.exp(-(t - ring) * 3.2) * Math.sin((t - ring) * 22) : 0;
  const screen = (
    <g>
      {/* the video playing at the top of the screen (a little night board inside it) */}
      <rect x={18} y={92} width={414} height={233} rx={16} fill="#2A1660" stroke={OUT} strokeWidth={4} />
      {[0, 1, 2].map((i) => <rect key={i} x={150 + i * 56} y={300 - 46 * (3 - i)} width={44} height={46 * (3 - i)} fill={i ? '#1BC077' : GOLD} stroke={OUT} strokeWidth={3} />)}
      <rect x={18} y={316} width={260} height={8} fill={RED} />
      <rect x={18} y={342} width={300} height={22} rx={8} fill="#FFFFFF" opacity={0.75} />
      {/* like · subscribe · bell */}
      <g transform={`translate(${likeP[0]} ${likeP[1]})`}>
        <rect x={-74} y={-38} width={148} height={76} rx={38} fill={t >= like ? '#3A2A08' : '#2B2650'} stroke={t >= like ? GOLD : '#6B65A8'} strokeWidth={5} />
        <ThumbIcon s={54} fill={t >= like ? GOLD : '#FFFFFF'} />
      </g>
      <g transform={`translate(${subP[0]} ${subP[1]})`}>
        <rect x={-92} y={-38} width={184} height={76} rx={38} fill={t >= sub ? '#3A3550' : RED} stroke={OUT} strokeWidth={5} />
        <GlowText text={t >= sub ? 'مشترك' : 'اشترك'} x={0} y={2} size={44} id={`${id}-pt`} glow={0} />
      </g>
      {t >= sub && <g transform={`translate(${bellP[0]} ${bellP[1]})`}><BellIcon s={60} fill={t >= ring ? GOLD : '#FFFFFF'} swing={swing} /></g>}
      {/* the rest of the page */}
      {[0, 1, 2, 3].map((i) => <rect key={i} x={18} y={470 + i * 92} width={414} height={70} rx={12} fill="#1E1A3C" opacity={0.75} />)}
      {t >= like - 0.6 && t < ring + 0.6 && (
        <g transform={`translate(${fx + 14} ${fy + 18})`} opacity={clamp01((t - like + 0.6) / 0.2) * (1 - clamp01((t - ring - 0.3) / 0.3))}><Finger s={0.8} /></g>
      )}
      {[like, sub].map((pt, i) => (t >= pt && t < pt + 0.5 ? <circle key={i} cx={(i ? subP : likeP)[0]} cy={ROW} r={30 + 70 * ease.out((t - pt) / 0.5)} fill="none" stroke="#FFFFFF" strokeWidth={5 * (1 - (t - pt) / 0.5)} opacity={1 - (t - pt) / 0.5} /> : null))}
    </g>
  );
  cueSfx('click', `ph-like-${id}-${like}`, t >= like && t < like + 0.3, x, {at: like, hit: 0.03});
  cueSfx('sparkle', `ph-like-g-${id}-${like}`, t >= like && t < like + 0.3, x, {at: like + 0.05, hit: 0.1});
  cueSfx('click', `ph-sub-${id}-${sub}`, t >= sub && t < sub + 0.3, x, {at: sub, hit: 0.03});
  cueSfx('ding', `ph-bell-${id}-${ring}`, t >= ring && t < ring + 0.3, x, {at: ring, hit: 0.05});
  // the camera PUSHES IN on the button row while the finger taps (readable on a real phone), then eases back out
  const zin = ease.inOut(clamp01((t - (like - 0.75)) / 0.6)) * (1 - ease.inOut(clamp01((t - (ring + 0.5)) / 0.6)));
  const z = 1 + 0.75 * zin, rowY = y + (ROW - 450) * ((900 * 0.944) / 900); // the row's screen position
  return (
    <g transform={`translate(${x} ${rowY}) scale(${z}) translate(${-x} ${-rowY})`} {...lb('object', `phone-${id}`)}>
      <Phone t={t} at={at} x={x} y={y} h={900} screen={screen} id={`${id}-ph`} glow="#7FD8FF" float={false} />
    </g>
  );
};

// ── C · on the board ─────────────────────────────────────────────────────────────────────────────────────────────────
export const CtaBoard: React.FC<{t: number; at: number; like: number; sub: number; bell?: number; x?: number; base?: number; id: string}> = ({t, at, like, sub, bell, x = 1150, base = 836, id}) => {
  // owner pick (2026-11-11): C + D. Big enough for a phone screen (like 230 px, «اشترك» 76 px), and after the bell the
  // gold arrows point DOWN — on a phone the real buttons are right under the video.
  const ring = bell ?? sub + 0.6;
  const g1 = ease.out(clamp01((t - at) / 0.5)), g2 = ease.out(clamp01((t - like - 0.3) / 0.5));
  cueSfx('thump', `cb-p1-${id}-${at}`, t >= at && t < at + 0.3, x, {at: at + 0.4});
  cueSfx('thump', `cb-p2-${id}-${like}`, t >= like + 0.3 && t < like + 0.6, x, {at: like + 0.7});
  const L = {x: x - 240, y: base - 280 - 150}, S = {x: x + 240, y: base - 210 - 85};
  return (
    <g>
      <Rays t={t} id={`${id}-r`} tone="gold" x={x} y={base - 330} />
      <Podium x={L.x} base={base} w={300} h={280} id={`${id}-p1`} grow={g1} color="gold" />
      <Podium x={S.x} base={base} w={300} h={210} id={`${id}-p2`} grow={g2} color="gold" />
      <LikeButton t={t} at={at + 0.45} press={like} x={L.x} y={L.y} size={230} id={id} />
      <SubscribeButton t={t} at={like + 0.75} press={sub} x={S.x} y={S.y} size={76} id={id} />
      <RingBell t={t} at={sub + 0.25} ring={ring} x={S.x} y={S.y - 175} size={120} id={id} />
      <Tap t={t} at={like} x={L.x} y={L.y} s={1.3} />
      <Tap t={t} at={sub} x={S.x} y={S.y} s={1.3} />
      <DownArrows t={t} at={ring + 0.4} x={x} y={base + 10} id={id} s={1.7} />
    </g>
  );
};

// ── D · the end screen: a calm last frame that leaves room for YouTube's REAL buttons ───────────────────────────────
/** Place it for the last ≈ 10 s (after the closing words). In YouTube Studio → End screen, put the SUBSCRIBE element on the
 *  circle and a VIDEO element on the frame (both outlines are where YouTube's own elements go: 1920×1080 coordinates).
 *  SILENT: it comes after the closing words — the reference is silent after its sign-off. */
export const END_SCREEN = {video: {x: 1010, y: 300, w: 760, h: 428}, subscribe: {x: 760, y: 514, r: 120}};
export const EndScreen: React.FC<{t: number; at: number; id: string}> = ({t, at, id}) => {
  if (t < at) return null;
  const k = ease.out(clamp01((t - at) / 0.6)), {video: V, subscribe: S} = END_SCREEN;
  return (
    <g opacity={k}>
      <NightSky t={t} id={`${id}-s`} />
      <GridFloor id={`${id}-f`} t={t} />
      <rect x={V.x} y={V.y} width={V.w} height={V.h} rx={22} fill="#120C30" stroke="#7FD8FF" strokeWidth={6} opacity={0.9} />
      <circle cx={S.x} cy={S.y} r={S.r} fill="#120C30" stroke={RED} strokeWidth={6} opacity={0.9} />
    </g>
  );
};
