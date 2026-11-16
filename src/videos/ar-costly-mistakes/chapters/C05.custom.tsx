// Custom shots for C05 (builder-owned, AZTIKA). Each: export const S<n>: React.FC<{t: number}> returning the shot's WORLD
// (SVG, no <Stage>/<NightScreen> — the chapter provides them; NightShots joins, drifts and pins the host).
// C05 · Citibank — one routine button press pays 894 million by mistake, then two years of court.
// Palette: purple board → cool blue money city → bank office → red wrong amount → courtroom wood → violet hourglass.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp01, ease, ramp} from '../../../kit/anim';
import {lb, uid} from '../../../kit/stage';
import {W, H} from '../../../kit/theme';
import {GlowText, GridFloor, NightSky, NPill, Podium, RevealRing, Sparkle, WordPop, YearBadge} from '../../../kit/night';
import {Bubble, CountNumber, Flash, HeroObject, Mark, Rays, Bokeh, Stamp} from '../../../kit/night-fx';
import {HoloRing, NightCity, RoomWorld, StoryPerson} from '../../../kit/night-worlds';
import {Coin, FlyingBills, MysteryTile} from '../../../kit/night-props';
import {CalendarCard, MarkPill} from '../../../kit/night-data';
import {Callout} from '../../../kit/night-story';
import {Phone} from '../../../kit/night-ui';
import {documentArt} from '../../../kit/night-objects';
import {move, moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {OUT, popAt} from '../shared/util';

const SLUG = 'ar-costly-mistakes';
const T = {
  // S2 · «الغلطة الجاية أكبر من البيتزا، بس صاحبها حصل شيء ما حصله أحد في هذا الفيديو كله: فرصة ثانية»
  s2: 235.6, bigger: 236.58, x1: 239.22, x2: 239.84, x3: 240.38, chance: 241.1, second: 241.38,
  // S3 · «أغسطس 2020، سيتي بنك، واحد من أكبر بنوك العالم»
  s3: 242.04, y2020: 242.92, citi: 243.76, bank: 244.1, akbar: 245.5, banks: 245.92,
  // S4 · «البنك كان المسؤول عن إدارة قرض ضخم لشركة مستحضرات التجميل ريفلون»
  s4: 246.68, idara: 248.18, loan: 248.6, huge: 248.94, cosm: 249.9, tajmeel: 250.52, revlon: 251.0,
  // S5 · «والمطلوب منه دفعة فوائد عادية قيمتها حوالي 7.8 مليون دولار»
  s5: 251.54, pay: 252.5, normal: 253.3, v78: 254.82, million: 255.77,
  // S6 · «ضغطة، تحويل، وخلصنا. بس اللي صار إن البنك بالغلط سدد القرض كامل، حوالي 894 مليون دولار»
  s6: 257.12, press: 257.12, transfer: 257.76, done: 258.5, oops: 260.74, full: 261.64, v894: 263.26, mln: 263.92,
  // S7 · «لمقرضين القرض ما يستحق عندهم إلا بعد ثلاث سنين»
  s7: 265.52, lenders: 265.52, due: 266.42, after: 268.12,
  // S8 · «بعضهم رجعوا الفلوس. وبعضهم، معهم حوالي 504 مليون، قالوا: لا، هذي فلوسنا أصلًا»
  s8: 268.98, back: 269.32, some: 270.4, v504: 272.2, said: 273.54, ours: 275.1,
  // S9 · «ورفعوا القضية. والمفاجأة إن المحكمة في البداية حكمت لصالحهم! يعني تقدرون تخلونها»
  s9: 276.04, case: 276.62, ruled: 279.14, favor: 279.64, keep: 280.55,
  // S10 · «لكن في 2022 محكمة الاستئناف قلبت الحكم»
  s10: 281.48, y2022: 281.81, appeal: 283.8, flip: 284.38, hukm: 284.86,
  // S11 · «وقالت إن الإشارات كانت واضحة إنه خطأ، وكان المفروض يتصلون يتأكدون»
  s11: 285.3, signs: 285.9, clear: 286.88, call: 288.94, check: 289.46,
  // S12 · «وبنهاية 2022 رجعت الفلوس كلها»
  s12: 290.04, end22: 290.8, ret: 291.28, all: 292.9,
  // S13 · «الحمد لله، مرت على خير، بس بعد أكثر من سنتين محاكم»
  s13: 293.3, fine: 294.06, after2: 295.36, two: 296.12, courts: 296.62,
  // S14 · «يعني حتى الغلطة اللي ترجع فلوسها، تاخذ من عمرك»
  s14: 297.12, mistake: 297.86, refund: 298.72, take: 299.14, from: 299.63, life: 299.96,
};

const GOLD = '#FFC928', CYAN = '#7FD8FF', RED = '#FD4B5B', GREEN = '#3EE08A';
const ART = {
  pizzas: {src: `${SLUG}/el/two-pizzas.png`, ar: 1.548},
  rocket: {src: `${SLUG}/el/mariner-rocket.png`, ar: 0.317},
  bag: {src: `${SLUG}/el/trash-bag.png`, ar: 0.931},
  bank: {src: `${SLUG}/el/bank-building.png`, ar: 1.035},
  cash: {src: `${SLUG}/el/money-bundles.png`, ar: 0.965},
  gavel: {src: `${SLUG}/el/judge-gavel.png`, ar: 1.134},
  alarm: {src: `${SLUG}/el/alarm-light.png`, ar: 0.861},
  glass: {src: `${SLUG}/el/golden-hourglass.png`, ar: 0.578},
};

// ---------------------------------------------------------------- local helpers
/** a generated image centred at x,y (h tall) — movable/layerable (same idea as C03's Pic) */
const Pic: React.FC<{src: string; x: number; y: number; h: number; ar: number; o?: number; s?: number; rot?: number; glow?: string; id: string}> = ({src, x, y, h, ar, o = 1, s = 1, rot = 0, glow, id}) => {
  if (o <= 0.001 || s <= 0.001) return null;
  const w = h * ar;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} {...lb('object', id)}>
      <foreignObject x={-w / 2 - 50} y={-h / 2 - 50} width={w + 100} height={h + 100}>
        <div style={{position: 'relative', width: w + 100, height: h + 100}}>
          <Img src={staticFile(src)} style={{position: 'absolute', left: 50, top: 50, width: w, height: h, filter: glow ? `drop-shadow(0 0 10px ${glow}) drop-shadow(0 0 28px ${glow}aa)` : 'drop-shadow(0 10px 8px rgba(0,0,0,0.45))'}} />
        </div>
      </foreignObject>
    </g>
  );
};

/** an eased arc move: [x, y, k] */
const arc = (t: number, at: number, from: [number, number], to: [number, number], lift: number, dur = 0): [number, number, number] => {
  const [x, y] = move(t, at, from, to, dur);
  const dist = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
  const k = clamp01(Math.hypot(x - from[0], y - from[1]) / dist);
  return [x, y - lift * Math.sin(Math.PI * k), k];
};

const Glow: React.FC<{x: number; y: number; r: number; color: string; o?: number; id: string}> = ({x, y, r, color, o = 1, id}) => {
  const g = uid('c5glow', id);
  if (o <= 0.01) return null;
  return (
    <g opacity={o}>
      <defs>
        <radialGradient id={g}>
          <stop offset="0" stopColor={color} stopOpacity={0.8} />
          <stop offset="0.4" stopColor={color} stopOpacity={0.3} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${g})`} />
    </g>
  );
};

/** pop wrapper around (x, y) */
const PopG: React.FC<{t: number; at: number; x: number; y: number; children: React.ReactNode}> = ({t, at, x, y, children}) => {
  const q = popAt(t, at);
  if (q.o <= 0.001) return null;
  return <g transform={`translate(${x} ${y}) scale(${q.s}) translate(${-x} ${-y})`} opacity={q.o}>{children}</g>;
};

/** dark office / night room backdrop (cool) */
const DarkRoom: React.FC<{t: number; id: string; top?: string; low?: string; bokeh?: string}> = ({t, id, top = '#1B2A63', low = '#070A22', bokeh = '#5CA8FF'}) => {
  const g = uid('c5room', id);
  return (
    <g>
      <defs>
        <radialGradient id={g} cx="0.5" cy="0.3" r="0.9">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={low} />
        </radialGradient>
      </defs>
      <rect x={-60} y={-60} width={W + 120} height={H + 120} fill={`url(#${g})`} />
      <Bokeh t={t} n={12} color={bokeh} seed={5} />
    </g>
  );
};

/** cool tint over RoomWorld (bank office instead of a warm home) + window blinds */
const CoolOffice: React.FC<{t: number; id: string}> = ({t, id}) => (
  <g>
    <RoomWorld t={t} id={id} winX={1370} winY={95} />
    <rect x={-60} y={-60} width={W + 120} height={H + 120} fill="#0D2A66" opacity={0.42} />
    {Array.from({length: 7}, (_, i) => (
      <rect key={i} x={1370 - 10} y={110 + i * 46} width={420} height={14} rx={6} fill="#9FC4FF" opacity={0.18} />
    ))}
  </g>
);

/** a code-drawn glowing lipstick — draw(h) for HeroObject, centred at (0,0) */
const lipstickArt = (h: number) => {
  const g = 'c5lip';
  const cw = h * 0.34, ch = h * 0.5, bw = h * 0.24;
  const cy0 = h * 0.5 - ch; // case top
  return (
    <g>
      <defs>
        <linearGradient id={`${g}-case`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFF1B8" /><stop offset="0.35" stopColor="#FFD45A" /><stop offset="0.75" stopColor="#E9A90C" /><stop offset="1" stopColor="#8A5A04" />
        </linearGradient>
        <linearGradient id={`${g}-bul`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FF8A9A" /><stop offset="0.4" stopColor="#E8243C" /><stop offset="1" stopColor="#8A0A1E" />
        </linearGradient>
      </defs>
      {/* bullet (slanted tip) */}
      <path d={`M${-bw / 2} ${cy0 - h * 0.06} L${-bw / 2} ${-h * 0.32} L${bw / 2} ${-h * 0.5} L${bw / 2} ${cy0 - h * 0.06} Z`} fill={`url(#${g}-bul)`} stroke={OUT} strokeWidth={h * 0.025} strokeLinejoin="round" />
      <path d={`M${-bw * 0.28} ${cy0 - h * 0.1} L${-bw * 0.28} ${-h * 0.31}`} stroke="#FFFFFF" strokeWidth={h * 0.025} strokeLinecap="round" opacity={0.7} />
      {/* inner collar */}
      <rect x={-bw / 2 - h * 0.03} y={cy0 - h * 0.08} width={bw + h * 0.06} height={h * 0.1} rx={h * 0.02} fill="#E9A90C" stroke={OUT} strokeWidth={h * 0.022} />
      {/* case */}
      <rect x={-cw / 2} y={cy0} width={cw} height={ch} rx={h * 0.04} fill={`url(#${g}-case)`} stroke={OUT} strokeWidth={h * 0.028} />
      <rect x={-cw / 2} y={cy0 + ch * 0.32} width={cw} height={h * 0.035} fill="#8A5A04" opacity={0.8} />
      <rect x={-cw * 0.32} y={cy0 + h * 0.03} width={cw * 0.12} height={ch * 0.85} rx={cw * 0.06} fill="#FFFFFF" opacity={0.55} />
    </g>
  );
};

/** paper envelope (centre x,y, w wide) */
const Envelope: React.FC<{x: number; y: number; w: number; rot?: number}> = ({x, y, w, rot = 0}) => {
  const h = w * 0.62;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill="#F4F1FF" stroke={OUT} strokeWidth={7} />
      <path d={`M${-w / 2 + 6} ${-h / 2 + 6} L0 ${h * 0.08} L${w / 2 - 6} ${-h / 2 + 6}`} fill="#DCD6F5" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={0} cy={h * 0.08} r={w * 0.07} fill={RED} stroke={OUT} strokeWidth={5} />
      <text x={0} y={h * 0.08 + w * 0.035} fontSize={w * 0.09} fontWeight={900} textAnchor="middle" fill="#FFFFFF" fontFamily="Arial Black, Arial">$</text>
    </g>
  );
};

/** grey ✖ badge (an old one that got no second chance) */
const GreyCross: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#6E6A86" stroke={OUT} strokeWidth={6} />
    <path d={`M${x - r * 0.42} ${y - r * 0.42} L${x + r * 0.42} ${y + r * 0.42} M${x + r * 0.42} ${y - r * 0.42} L${x - r * 0.42} ${y + r * 0.42}`} stroke="#FFFFFF" strokeWidth={r * 0.26} strokeLinecap="round" />
  </g>
);

/** the round gold "hand" of the presser: mitt + pointing finger, finger tip at (0,0) */
const PressHand: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-22} y={0} width={44} height={110} rx={22} fill="#FFD45A" stroke={OUT} strokeWidth={8} />
    <rect x={-60} y={90} width={150} height={150} rx={70} fill="#FFC928" stroke={OUT} strokeWidth={8} />
    <rect x={-10} y={10} width={10} height={70} rx={5} fill="#FFFFFF" opacity={0.6} />
    <rect x={70} y={210} width={70} height={140} rx={30} fill="#2A3A8C" stroke={OUT} strokeWidth={8} />
  </g>
);

/** the big transfer panel (our own, so the press, the ✔ and the roll sit on their own cue words). Centre x,y. */
type MarkState = 'none' | 'check' | 'cross';
const TransferView: React.FC<{
  x: number; y: number; s?: number; id: string; amount: string; tone: 'gold' | 'white' | 'red'; amountDy?: number; amountS?: number;
  bar: number; mark: MarkState; markS?: number; glow: string; bad?: boolean; flash?: number;
}> = ({x, y, s = 1, id, amount, tone, amountDy = 0, amountS = 1, bar, mark, markS = 1, glow, bad = false, flash = 0}) => {
  const g = uid('c5tr', id);
  const w = 1120, h = 640, l = -w / 2, tp = -330;
  const fy = -10, fh = 190;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} {...lb('object', id)}>
      <defs>
        <linearGradient id={g + 'p'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bad ? '#4A1830' : '#2E2760'} />
          <stop offset="1" stopColor={bad ? '#1E0814' : '#151130'} />
        </linearGradient>
        <filter id={g + 'b'} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={40} /></filter>
        <clipPath id={g + 'c'}><rect x={l + 50} y={fy} width={w - 100} height={fh} rx={30} /></clipPath>
      </defs>
      <rect x={l} y={tp} width={w} height={h} rx={48} fill={glow} opacity={0.42} filter={`url(#${g}b)`} />
      <rect x={l} y={tp} width={w} height={h} rx={48} fill={`url(#${g}p)`} stroke={OUT} strokeWidth={10} />
      <rect x={l + 30} y={tp + 10} width={w - 60} height={10} rx={5} fill={glow} opacity={0.9} />
      <GlowText text="تحويل بنكي" x={0} y={tp + 74} size={60} id={id + 'h'} />
      {/* rows */}
      {[{y0: tp + 130, lab: 'من', val: 'سيتي بنك'}, {y0: tp + 232, lab: 'إلى', val: 'المقرضين'}].map((r, i) => (
        <g key={i}>
          <rect x={l + 50} y={r.y0} width={w - 100} height={90} rx={26} fill="#0E0B1E" stroke={OUT} strokeWidth={6} />
          <NPill text={r.lab} x={w / 2 - 130} y={r.y0 + 45} size={36} kind="grey" id={`${id}-l${i}`} />
          <GlowText text={r.val} x={-40} y={r.y0 + 47} size={58} id={`${id}-v${i}`} />
        </g>
      ))}
      {/* amount field */}
      <rect x={l + 50} y={fy} width={w - 100} height={fh} rx={30} fill={bad ? '#5A0F1E' : '#0E0B1E'} stroke={bad ? RED : GOLD} strokeWidth={8} />
      <g clipPath={`url(#${g}c)`}>
        <g transform={`translate(60 ${fy + fh / 2 + amountDy}) scale(${amountS})`}>
          <GlowText text={amount} x={0} y={0} size={112} tone={tone} id={id + 'am'} />
        </g>
        {flash > 0 && <rect x={l + 50} y={fy} width={w - 100} height={fh} fill="#FFFFFF" opacity={0.75 * flash} />}
      </g>
      {mark !== 'none' && (
        <g transform={`translate(${l + 140} ${fy + fh / 2}) scale(${markS})`}>
          <Mark kind={mark} x={0} y={0} r={52} />
        </g>
      )}
      {/* progress bar (fills right → left) */}
      <rect x={l + 50} y={tp + h - 82} width={w - 100} height={40} rx={20} fill="#0E0B1E" stroke={OUT} strokeWidth={6} />
      {bar > 0 && <rect x={w / 2 - 50 - (w - 112) * bar - 6} y={tp + h - 76} width={(w - 112) * bar} height={28} rx={14} fill={bad ? RED : GREEN} />}
    </g>
  );
};

/** courtroom backdrop: dark wood panels + a warm lamp glow */
const Courtroom: React.FC<{t: number; id: string}> = ({t, id}) => {
  const g = uid('c5court', id);
  return (
    <g>
      <defs>
        <radialGradient id={g} cx="0.5" cy="0.25" r="0.9">
          <stop offset="0" stopColor="#5A3420" />
          <stop offset="1" stopColor="#1A0C08" />
        </radialGradient>
      </defs>
      <rect x={-60} y={-60} width={W + 120} height={H + 120} fill={`url(#${g})`} />
      {Array.from({length: 11}, (_, i) => (
        <g key={i}>
          <rect x={-40 + i * 190} y={120} width={150} height={560} rx={10} fill="#3E2214" stroke="#1A0C08" strokeWidth={6} opacity={0.75} />
          <rect x={-30 + i * 190} y={130} width={12} height={540} rx={6} fill="#8A5A3A" opacity={0.35} />
        </g>
      ))}
      <rect x={-60} y={680} width={W + 120} height={420} fill="#24120A" />
      <rect x={-60} y={680} width={W + 120} height={10} fill="#8A5A3A" opacity={0.6} />
      <Glow x={960} y={300} r={620} color="#FFC77A" o={0.28} id={id + 'lamp'} />
      <Bokeh t={t} n={8} color="#FFC77A" seed={9} />
    </g>
  );
};

const Bench: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => (
  <g>
    <rect x={x - w / 2} y={y} width={w} height={h} rx={10} fill="#6A3A1E" stroke={OUT} strokeWidth={9} />
    <rect x={x - w / 2 - 20} y={y - 30} width={w + 40} height={40} rx={10} fill="#8A5230" stroke={OUT} strokeWidth={8} />
    <rect x={x - w / 2 - 20} y={y - 30} width={w + 40} height={10} rx={5} fill={GOLD} opacity={0.85} />
    <rect x={x - w / 2 + 30} y={y + 40} width={w - 60} height={h - 80} rx={8} fill="none" stroke={GOLD} strokeWidth={5} opacity={0.7} />
    <circle cx={x} cy={y + h / 2} r={42} fill={GOLD} stroke={OUT} strokeWidth={6} />
    <path d={`M${x - 22} ${y + h / 2 - 8} L${x + 22} ${y + h / 2 - 8} M${x} ${y + h / 2 - 22} L${x} ${y + h / 2 + 20}`} stroke={OUT} strokeWidth={6} strokeLinecap="round" />
  </g>
);

/** a lender: StoryPerson businessman with the cyan rim, popping in at `at` */
const Lender: React.FC<{t: number; x: number; y: number; s: number; at?: number; pose: 'idle' | 'shock' | 'hold' | 'up' | 'cheer' | 'talk'; id: string; flip?: boolean}> = ({t, x, y, s, at, pose, id, flip}) => {
  const q = popAt(t, at);
  if (q.o <= 0.001) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${q.s}) translate(${-x} ${-y})`} opacity={q.o}>
      <ellipse cx={x} cy={y + 6} rx={90 * s} ry={16 * s} fill="#000000" opacity={0.35} />
      <StoryPerson x={x} y={y} s={s} t={t} id={id} role="businessman" rim={CYAN} pose={pose} flip={flip} prop="none" />
    </g>
  );
};

// ================================================================= S2 · 235.60 · «الغلطة الجاية أكبر… فرصة ثانية»
export const S2: React.FC<{t: number}> = ({t}) => {
  const tileX = 1000, tileY = 380;
  const [, rise] = move(t, T.bigger - 0.12, [0, 460], [0, 0], 0.5, ease.out);
  const colTop = tileY + 100 + rise;
  const loopP = ramp(t, T.chance - 0.1, T.chance + 0.45, ease.out);
  const R = 215, C = 2 * Math.PI * R * 0.86;
  const a0 = -Math.PI * 0.32, a1 = a0 + Math.PI * 2 * 0.86 * loopP;
  const head: [number, number] = [tileX + R * Math.cos(a1), tileY + R * Math.sin(a1)];
  const biggerO = t < T.x1 - 0.3 ? 1 : 1 - clamp01((t - (T.x1 - 0.3)) / 0.25);
  const icons = [
    {a: ART.rocket, x: 1170, h: 190, at: T.x1},
    {a: ART.bag, x: 1390, h: 150, at: T.x2},
    {a: ART.pizzas, x: 1620, h: 110, at: T.x3},
  ];
  icons.forEach((ic, i) => cueSfx('thump', `c5s2x-${i}`, t >= ic.at && t < ic.at + 0.3, ic.x, {at: ic.at, hit: 0.1, gain: 0.7}));
  cueSfx('pop', 'c5s2row', t >= 238.9 && t < 239.2, 1380, {at: 238.9, hit: 0.12, gain: 0.6});
  return (
    <>
      <NightSky t={t} id="c5s2" />
      <GridFloor id="c5s2f" t={t} />
      {/* the old step: pizzas, small */}
      <Podium x={1560} base={836} w={300} h={130} id="c5s2pd" grow={1} color="gold" />
      <Pic {...ART.pizzas} x={1560} y={636} h={140} glow={GOLD} id="c5s2pz" />
      <NPill text="785 مليون $" x={1560} y={520} size={44} kind="white" id="c5s2pl" />
      {/* the dark tile that rises taller */}
      {t >= T.bigger - 0.12 && (
        <g>
          <rect x={tileX - 120} y={colTop} width={240} height={Math.max(0, 836 - colTop)} fill="#140C30" stroke={OUT} strokeWidth={8} />
          <rect x={tileX - 104} y={colTop} width={22} height={Math.max(0, 836 - colTop)} fill="#3B2A7A" opacity={0.7} />
          <g transform={`translate(0 ${rise})`}>
            <MysteryTile t={t} at={T.bigger - 0.12} x={tileX} y={tileY} w={300} h={200} id="c5s2mt" />
          </g>
        </g>
      )}
      {biggerO > 0 && t >= T.bigger && (
        <NPill text="أكبر" x={tileX} y={tileY - 170} size={52} kind="gold" id="c5s2bg" p={((t - T.bigger - 0.1) / 0.3) * biggerO} />
      )}
      {/* the row of the others: no second chance */}
      {icons.map((ic, i) => (
        <PopG key={i} t={t} at={238.9 + i * 0.1} x={ic.x} y={930}>
          <Pic {...ic.a} x={ic.x} y={930 - (ic.h - 92) / 2} h={ic.h} o={t >= ic.at ? 0.55 : 1} id={`c5s2i${i}`} />
          {t >= ic.at && (
            <g transform={`translate(${ic.x + 52} 900) scale(${popAt(t, ic.at).s}) translate(${-(ic.x + 52)} -900)`}>
              <GreyCross x={ic.x + 52} y={900} r={40} />
            </g>
          )}
        </PopG>
      ))}
      {/* the gold loop ↻ */}
      {loopP > 0 && (
        <g>
          <path d={`M${tileX + R * Math.cos(a0)} ${tileY + R * Math.sin(a0)} A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${head[0]} ${head[1]}`}
            fill="none" stroke={GOLD} strokeWidth={18} strokeLinecap="round" style={{filter: `drop-shadow(0 0 12px ${GOLD})`}} strokeDasharray={`${C} ${C}`} />
          <g transform={`translate(${head[0]} ${head[1]}) rotate(${(a1 * 180) / Math.PI + 90})`}>
            <path d="M-30 -10 L0 30 L30 -10 Z" fill={GOLD} stroke={OUT} strokeWidth={6} strokeLinejoin="round" transform="rotate(-90)" />
          </g>
          {[0, 1, 2, 3].map((i) => <Sparkle key={i} x={tileX + Math.cos(i * 1.7) * 260} y={tileY + Math.sin(i * 1.7) * 240} r={14 + 6 * Math.sin(t * 4 + i)} o={loopP} color="#FFE9A0" />)}
        </g>
      )}
      {t >= T.second && <NPill text="فرصة ثانية" x={tileX} y={tileY - 290} size={54} kind="gold" id="c5s2fc" p={(t - T.second + 0.05) / 0.3} />}
    </>
  );
};

// ================================================================= S3 · 242.04 · «أغسطس 2020، سيتي بنك، واحد من أكبر بنوك العالم»
export const S3: React.FC<{t: number}> = ({t}) => {
  const [, dy] = move(t, T.akbar, [0, 0], [0, 150], 0.9);
  const z = moveTo(t, T.akbar, 1, 1.1, 0.9);
  return (
    <>
      <g transform={`translate(960 540) scale(${z}) translate(-960 ${-540 + dy})`}>
        <NightCity t={t} id="c5s3c" />
        <HoloRing x={960} y={850} rx={360} t={t} />
        <RevealRing t={t} at={T.citi} x={960} y={560} r={330} color={CYAN} />
        <HeroObject t={t} at={T.citi - 0.1} {...ART.bank} x={960} y={560} h={560} glow={CYAN} enter="rise" id="c5s3bank" />
        {t >= T.bank && <NPill text="سيتي بنك" x={960} y={905} size={52} kind="white" id="c5s3n" p={(t - T.bank) / 0.3} />}
      </g>
      <YearBadge t={t} at={T.s3 + 0.05} year={2020} from={2010} x={1560} y={230} label="أغسطس" id="c5s3y" size={110} />
      {t >= T.banks && <NPill text="من أكبر بنوك العالم" x={860} y={150} size={50} kind="gold" id="c5s3big" p={(t - T.banks + 0.1) / 0.3} />}
    </>
  );
};

// ================================================================= S4 · 246.68 · «إدارة قرض ضخم لشركة مستحضرات التجميل ريفلون»
export const S4: React.FC<{t: number}> = ({t}) => {
  const swell = moveTo(t, T.huge - 0.05, 1, 1.32, 0.35, ease.outBack);
  const lineP = ramp(t, T.cosm + 0.1, T.cosm + 0.6, ease.out);
  const docX = 1120, docY = 470;
  cueSfx('thump', 'c5s4swell', t >= T.huge - 0.05 && t < T.huge + 0.25, docX, {at: T.huge - 0.05, hit: 0.15});
  return (
    <>
      <CoolOffice t={t} id="c5s4r" />
      {/* the banker (gold rim = the bank's side) */}
      <ellipse cx={1520} cy={1006} rx={130} ry={22} fill="#000000" opacity={0.35} />
      <StoryPerson x={1520} y={1000} s={1.45} t={t} id="c5s4bk" role="banker" prop="document" pose={t >= T.loan - 0.1 ? 'point' : 'talk'} flip />
      {/* the loan document beside him */}
      {t >= T.loan - 0.12 && (
        <g transform={`translate(${docX} ${docY}) scale(${swell}) translate(${-docX} ${-docY})`}>
          <HeroObject t={t} at={T.loan - 0.12} draw={documentArt('')} ar={0.78} x={docX} y={docY} h={330} glow={GOLD} id="c5s4doc" />
        </g>
      )}
      {t >= T.loan && <NPill text={t >= T.huge ? 'قرض ضخم' : 'قرض'} x={docX} y={docY - 165 * swell - 60} size={54} kind="gold" id="c5s4q" p={(t - T.loan) / 0.3} />}
      {/* the dotted link bank → client */}
      {lineP > 0 && (
        <path d={`M1360 760 Q 1000 860 ${700 + (1 - lineP) * 660} 760`} fill="none" stroke={GOLD} strokeWidth={10} strokeDasharray="4 26" strokeLinecap="round" opacity={0.9} />
      )}
      {/* the lipstick */}
      <RevealRing t={t} at={T.cosm} x={560} y={560} r={260} color="#FF8A9A" boom={false} />
      <HeroObject t={t} at={T.cosm - 0.1} draw={lipstickArt} ar={0.5} x={560} y={560} h={460} glow="#FF6A80" enter="pop" id="c5s4lip" />
      {t >= T.tajmeel && <NPill text="مستحضرات تجميل" x={560} y={860} size={44} kind="grey" id="c5s4c" p={(t - T.tajmeel) / 0.3} />}
      {t >= T.revlon && <NPill text="ريفلون" x={560} y={250} size={56} kind="white" id="c5s4rv" p={(t - T.revlon + 0.05) / 0.3} />}
    </>
  );
};

// ================================================================= S5 · 251.54 · «دفعة فوائد عادية قيمتها حوالي 7.8 مليون دولار»
export const S5: React.FC<{t: number}> = ({t}) => {
  const [ex, ey] = move(t, T.pay - 0.15, [520, 640], [1020, 560], 0.8);
  const envO = clamp01((t - (T.pay - 0.15)) / 0.15);
  const eRot = moveTo(t, T.pay - 0.15, -14, 4, 0.8);
  return (
    <>
      <CoolOffice t={t} id="c5s5r" />
      {/* banker behind his desk with a monitor */}
      <StoryPerson x={1500} y={1010} s={1.3} t={t} id="c5s5bk" role="banker" pose={t >= T.normal ? 'talk' : 'idle'} flip />
      <rect x={1180} y={800} width={680} height={60} rx={12} fill="#5A3A2A" stroke={OUT} strokeWidth={8} />
      <rect x={1220} y={860} width={600} height={240} fill="#3E2618" stroke={OUT} strokeWidth={8} />
      <g>
        <rect x={1240} y={560} width={300} height={200} rx={18} fill="#1D2A66" stroke={OUT} strokeWidth={8} />
        <rect x={1256} y={576} width={268} height={168} rx={10} fill="#5CA8FF" opacity={0.35 + 0.08 * Math.sin(t * 3)} />
        <rect x={1370} y={760} width={40} height={42} fill="#2A2450" stroke={OUT} strokeWidth={6} />
        <Glow x={1390} y={660} r={240} color="#5CA8FF" o={0.35} id="c5s5mon" />
      </g>
      {/* the client: lipstick, small */}
      <HeroObject t={t} at={T.s5 - 0.6} draw={lipstickArt} ar={0.5} x={460} y={600} h={330} glow="#FF6A80" enter="pop" sparkles={2} id="c5s5lip" />
      {/* the envelope */}
      {envO > 0 && (
        <g opacity={envO}>
          <Envelope x={ex} y={ey} w={260} rot={eRot} />
          <NPill text="دفعة فوائد" x={ex} y={ey - 140} size={46} kind="white" id="c5s5env" p={(t - T.pay) / 0.3} />
        </g>
      )}
      {t >= T.normal && <MarkPill t={t} at={T.normal} text="عادية" x={1020} y={760} mark="check" size={48} id="c5s5ok" />}
      <CountNumber t={t} at={T.v78 - 0.45} value="7.8 مليون $" x={900} y={230} size={130} tone="white" id="c5s5n" dur={1.4} />
    </>
  );
};

// ================================================================= S6 ★ · 257.12 · «ضغطة، تحويل، وخلصنا… بالغلط… 894 مليون دولار»
export const S6: React.FC<{t: number}> = ({t}) => {
  const PX = 860, PY = 470; // panel centre
  const AY = PY + 85; // amount field centre (screen)
  // camera: still, then a push into the digits from «القرض كامل»
  const z = moveTo(t, T.full, 1, 1.32, 1.5);
  const [cx, cy] = move(t, T.full, [960, 540], [PX + 60, AY], 1.5);
  // the press
  const [hx, hy0] = move(t, T.s6 - 0.45, [1760, 1180], [1580, 670], 0.4, ease.out);
  const pu = t - T.press;
  const dip = pu >= 0 && pu < 0.3 ? Math.sin((Math.PI * pu) / 0.3) : 0;
  const [, hyOut] = move(t, T.done + 0.1, [0, 0], [0, 420], 0.45);
  const hy = hy0 + dip * 34 + hyOut;
  const btnS = 1 - 0.08 * dip;
  const ringK = pu >= 0 && pu < 0.45 ? pu / 0.45 : -1;
  cueSfx('click', 'c5s6press', t >= T.press && t < T.press + 0.2, 1580, {at: T.press, hit: 0.08});
  // states
  const bar = ease.inOut(clamp01((t - T.transfer) / 0.65));
  const okAt = T.done;
  cueSfx('ding', 'c5s6ok', t >= okAt && t < okAt + 0.3, 520, {at: okAt, hit: 0.1});
  let mark: MarkState = t >= okAt ? 'check' : 'none';
  if (t >= T.oops - 0.05 && t < T.oops + 0.6) mark = Math.floor((t - T.oops + 0.05) * 12) % 2 === 0 ? 'cross' : 'check';
  else if (t >= T.oops + 0.6) mark = 'cross';
  const markS = t >= okAt ? popAt(t, okAt).s : 0;
  const rolling = t >= T.full && t < T.v894;
  const landed = t >= T.v894;
  let amount = '7.8 مليون $';
  let tone: 'gold' | 'white' | 'red' = 'gold';
  let amountDy = 0;
  if (rolling) {
    const k = clamp01((t - T.full) / (T.v894 - T.full));
    const v = 7.8 + (894 - 7.8) * Math.pow(k, 2.2);
    const step = Math.floor((t - T.full) / 0.07);
    const frac = ((t - T.full) / 0.07) - step;
    amount = `${v < 10 ? v.toFixed(1) : Math.floor(v)} مليون $`;
    tone = 'white';
    amountDy = (1 - ease.out(frac)) * -26;
    cueSfx('tick', `c5s6roll-${Math.floor(step / 3)}`, true, PX, {at: T.full + Math.floor(step / 3) * 0.21, gain: 0.45});
  }
  if (landed) {
    amount = '894 مليون $';
    tone = 'red';
  }
  const amountS = landed ? 1 + 0.12 * Math.sin(Math.PI * clamp01((t - T.v894) / 0.3)) : 1;
  const flash = landed ? 1 - clamp01((t - T.v894) / 0.35) : 0;
  cueSfx('boom', 'c5s6wrong', landed && t < T.v894 + 0.3, PX, {at: T.v894, gain: 1.6});
  const glow = landed ? RED : t >= T.oops ? '#FF7A5A' : t >= okAt ? GREEN : GOLD;
  // the banker leans back after «وخلصنا», leaves before AZTIKA peeks in
  const lean = moveTo(t, T.done, 0, -11, 0.5);
  const bankerO = 1 - clamp01((t - (T.v894 - 0.5)) / 0.3);
  const shake = landed && t < T.v894 + 0.3 ? Math.sin((t - T.v894) * 70) * 8 * (1 - (t - T.v894) / 0.3) : 0;
  return (
    <>
      <DarkRoom t={t} id="c5s6r" top={landed ? '#4A1530' : '#1B2A63'} low={landed ? '#14040C' : '#070A22'} bokeh={landed ? '#FF6A7A' : '#5CA8FF'} />
      <g transform={`translate(${960 + shake} 540) scale(${z}) translate(${-cx} ${-cy})`}>
        <TransferView x={PX} y={PY} id="c5s6tv" amount={amount} tone={tone} amountDy={amountDy} amountS={amountS} bar={bar} mark={mark} markS={markS} glow={glow} bad={landed} flash={flash} />
        {/* foreground: the gold confirm button + the pressing hand */}
        <g transform={`translate(1580 760) scale(${btnS * 1.3}) translate(-1580 -760)`}>
          <ellipse cx={1580} cy={810} rx={150} ry={40} fill="#000000" opacity={0.4} />
          {ringK >= 0 && <circle cx={1580} cy={760} r={115 + ringK * 70} fill="none" stroke={GOLD} strokeWidth={10} opacity={1 - ringK} />}
          <ellipse cx={1580} cy={780} rx={128} ry={58} fill="#A86F05" stroke={OUT} strokeWidth={9} />
          <ellipse cx={1580} cy={752 + dip * 14} rx={118} ry={52} fill={GOLD} stroke={OUT} strokeWidth={9} style={{filter: `drop-shadow(0 0 16px ${GOLD})`}} />
          <ellipse cx={1550} cy={738 + dip * 14} rx={60} ry={16} fill="#FFFFFF" opacity={0.5} />
        </g>
        <PressHand x={hx} y={hy - 50} s={1.15} />
        {bankerO > 0 && (
          <g opacity={bankerO} transform={`rotate(${lean} 1790 1010)`}>
            <StoryPerson x={1790} y={1010} s={0.85} t={t} id="c5s6bk" role="banker" pose={t >= T.oops ? 'shock' : 'idle'} flip />
          </g>
        )}
      </g>
      <Flash t={t} at={T.v894} strength={0.45} color="#FFD6DA" />
      <Stamp t={t} at={T.mln} text="بالغلط" x={860} y={905} size={110} rot={-7} />
    </>
  );
};

// ================================================================= S7 · 265.52 · «لمقرضين… ما يستحق عندهم إلا بعد ثلاث سنين»
const LX = [330, 600, 870, 1140];
export const S7: React.FC<{t: number}> = ({t}) => (
  <>
    <DarkRoom t={t} id="c5s7r" top="#1A3A6A" low="#060A20" bokeh="#7FD8FF" />
    <GridFloor id="c5s7f" t={t} y={880} />
    {/* the wrong transfer, small, bursting */}
    <TransferView x={1560} y={420} s={0.42} id="c5s7tv" amount="894 مليون $" tone="red" bar={1} mark="cross" glow={RED} bad />
    <FlyingBills t={t} at={T.lenders - 0.1} x={1560} y={420} n={12} spread={420} dur={2.2} w={80} />
    {LX.map((x, i) => {
      const at = T.lenders + 0.05 + i * 0.12;
      const [bx, by, k] = arc(t, at, [1560, 420], [x, 760], 220, 0.75);
      const caught = k >= 0.99;
      cueSfx('pop', `c5s7c${i}`, t >= at + 0.75 && t < at + 1.0, x, {at: at + 0.75, gain: 0.6});
      return (
        <g key={i}>
          <Lender t={t} x={x} y={1000} s={0.95} at={T.lenders - 0.3 + i * 0.08} pose={caught ? 'shock' : 'idle'} id={`c5s7l${i}`} flip={i >= 2} />
          {t >= at && <Pic {...ART.cash} x={bx} y={by} h={130} rot={(1 - k) * -30} glow={caught ? GREEN : undefined} id={`c5s7b${i}`} />}
        </g>
      );
    })}
    {t >= T.lenders && <NPill text="مقرضين" x={735} y={500} size={52} kind="white" id="c5s7p" p={(t - T.lenders) / 0.3} />}
    <CalendarCard t={t} at={T.after} x={735} y={230} to={3} label="سنين" size={0.8} id="c5s7cal" />
  </>
);

// ================================================================= S8 · 268.98 · «بعضهم رجعوا الفلوس… 504 مليون… لا، هذي فلوسنا أصلًا»
export const S8: React.FC<{t: number}> = ({t}) => {
  const [cx, cy] = move(t, T.some - 0.1, [960, 540], [465, 640], 0.9);
  const z = moveTo(t, T.some - 0.1, 1, 1.32, 0.9);
  const squeeze = t >= T.ours ? 1 + 0.06 * Math.sin(Math.PI * clamp01((t - T.ours) / 0.35)) : 1;
  return (
    <>
      <DarkRoom t={t} id="c5s8r" top="#1A3A6A" low="#060A20" bokeh="#7FD8FF" />
      <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
        <GridFloor id="c5s8f" t={t} y={880} wide />
        {LX.map((x, i) => {
          const back = i >= 2;
          const at = T.back - 0.1 + (i - 2) * 0.15;
          const [bx, by, k] = back ? arc(t, at, [x, 800], [2200, 260], 160, 0.8) : [x, 830, 0];
          const pose = back ? (t >= at && t < at + 0.9 ? 'up' : 'idle') : 'hold';
          const s = i === 1 ? squeeze : 1;
          return (
            <g key={i} transform={`translate(${x} 1000) scale(${s}) translate(${-x} -1000)`}>
              <Lender t={t} x={x} y={1000} s={0.95} pose={pose} id={`c5s8l${i}`} flip={i >= 2} />
              {(!back || k < 1) && <Pic {...ART.cash} x={bx} y={by} h={back ? 130 : 120} rot={back ? k * 40 : 0} glow={back ? undefined : GOLD} id={`c5s8b${i}`} />}
            </g>
          );
        })}
        {t >= T.back + 0.15 && t < T.some + 0.2 && <MarkPill t={t} at={T.back + 0.15} text="رجعوا الفلوس" x={1005} y={470} mark="check" size={48} id="c5s8ok" />}
      </g>
      {t >= T.v504 && <NPill text="504 مليون $" x={800} y={300} size={60} kind="gold" id="c5s8n" p={(t - T.v504 + 0.05) / 0.3} />}
      <Bubble t={t} at={T.said} lines={['لا، هذي فلوسنا أصلًا']} x={1470} y={360} tx={1180} ty={560} size={62} />
    </>
  );
};

// ================================================================= S9 · 276.04 · «ورفعوا القضية… حكمت لصالحهم!»
export const S9: React.FC<{t: number}> = ({t}) => {
  const [, dy] = move(t, T.case - 0.3, [0, -620], [0, 0], 0.32, ease.in);
  const slapped = t >= T.case + 0.02;
  cueSfx('paper', 'c5s9doc', t >= T.case && t < T.case + 0.2, 960, {at: T.case, gain: 0.8});
  const swing = t < T.ruled - 0.25 ? -38 : moveTo(t, T.ruled - 0.25, -38, 6, 0.25, ease.in);
  const hit = t >= T.ruled && t < T.ruled + 0.35 ? 1 - (t - T.ruled) / 0.35 : 0;
  const cheer = t >= T.keep;
  return (
    <>
      <Courtroom t={t} id="c5s9c" />
      {/* judge behind the bench */}
      <StoryPerson x={960} y={800} s={1.0} t={t} id="c5s9j" role="judge" pose={t >= T.ruled - 0.3 && t < T.ruled + 0.4 ? 'up' : 'idle'} />
      <Bench x={960} y={600} w={640} h={300} />
      {/* the case file slaps onto the bench */}
      {t >= T.case - 0.3 && (
        <g transform={`translate(0 ${dy}) rotate(${slapped ? -4 : -14} 800 560)`}>
          <rect x={660} y={505} width={200} height={110} rx={10} fill="#F4F1FF" stroke={OUT} strokeWidth={7} />
          {[0, 1, 2].map((i) => <rect key={i} x={685} y={530 + i * 24} width={150 - i * 30} height={10} rx={5} fill="#B8B2D8" />)}
        </g>
      )}
      {slapped && t < T.favor - 0.1 && <NPill text="القضية" x={760} y={455} size={48} kind="white" id="c5s9q" p={(t - T.case) / 0.3} />}
      {/* the gavel */}
      <g transform={`rotate(${swing} 1290 560)`}>
        <Pic {...ART.gavel} x={1190} y={500} h={190} id="c5s9g" />
      </g>
      {hit > 0 && <circle cx={1110} cy={570} r={60 + (1 - hit) * 120} fill="none" stroke={GOLD} strokeWidth={10} opacity={hit} />}
      {/* lenders (cyan) left · the bank (gold) right */}
      {[620, 800].map((x, i) => (
        <g key={i} transform={cheer ? `translate(0 ${-Math.abs(Math.sin((t - T.keep) * 7 + i)) * 18})` : undefined}>
          <Lender t={t} x={x} y={1010} s={0.85} pose={cheer ? 'cheer' : t >= T.favor ? 'shock' : 'idle'} id={`c5s9l${i}`} />
        </g>
      ))}
      <StoryPerson x={1480} y={1010} s={0.85} t={t} id="c5s9bk" role="banker" pose={t >= T.favor ? 'shock' : 'idle'} flip />
      {t >= T.favor && <MarkPill t={t} at={T.favor} text="لصالحهم" x={710} y={560} mark="check" size={52} id="c5s9ok" />}
    </>
  );
};

// ================================================================= S10 · 281.48 · «لكن في 2022 محكمة الاستئناف قلبت الحكم»
export const S10: React.FC<{t: number}> = ({t}) => {
  const k = clamp01((t - T.flip) / 0.32);
  const sx = Math.abs(Math.cos(Math.PI * ease.inOut(k)));
  const back = k >= 0.5;
  const swing = t < T.flip - 0.25 ? -50 : moveTo(t, T.flip - 0.25, -50, 8, 0.25, ease.in);
  const gO = clamp01((t - (T.y2022 - 0.1)) / 0.25) * (1 - clamp01((t - (T.flip + 0.9)) / 0.3));
  const shake = t >= T.flip && t < T.flip + 0.3 ? Math.sin((t - T.flip) * 80) * 10 * (1 - (t - T.flip) / 0.3) : 0;
  cueSfx('impact', 'c5s10slam', t >= T.flip && t < T.flip + 0.2, 1100, {at: T.flip, gain: 1.4});
  const CX = 1010, CY = 560, CW = 600, CH = 560;
  return (
    <>
      <NightSky t={t} id="c5s10" />
      <Rays t={t} id="c5s10ry" x={CX} y={CY} tone={back ? 'red' : 'green'} />
      <g transform={`translate(${shake} 0)`}>
        <PopG t={t} at={T.s10 - 0.3} x={CX} y={CY}>
          <g transform={`translate(${CX} ${CY}) scale(${sx} 1) translate(${-CX} ${-CY})`}>
            <rect x={CX - CW / 2} y={CY - CH / 2} width={CW} height={CH} rx={44} fill={back ? '#4A1830' : '#123A2A'} stroke={OUT} strokeWidth={11} style={{filter: `drop-shadow(0 0 30px ${back ? RED : GREEN})`}} />
            <rect x={CX - CW / 2 + 22} y={CY - CH / 2 + 22} width={CW - 44} height={CH - 44} rx={30} fill="none" stroke={back ? RED : GREEN} strokeWidth={6} opacity={0.8} />
            {!back ? (
              <g>
                <Mark kind="check" x={CX} y={CY - 70} r={110} />
                <GlowText text="لصالحهم" x={CX} y={CY + 150} size={90} tone="green" id="c5s10a" />
              </g>
            ) : (
              <g>
                <Mark kind="cross" x={CX} y={CY - 70} r={110} />
                <GlowText text="قلبت الحكم" x={CX} y={CY + 150} size={84} tone="red" id="c5s10b" />
              </g>
            )}
          </g>
        </PopG>
        {gO > 0 && (
          <g opacity={gO} transform={`rotate(${swing} 1560 380)`}>
            <Pic {...ART.gavel} x={1420} y={300} h={260} id="c5s10g" />
          </g>
        )}
        {t >= T.hukm - 0.1 && [0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2 + 0.4, d = 80 + clamp01((t - T.hukm + 0.1) / 0.5) * 140;
          return <Sparkle key={i} x={CX + 230 + Math.cos(a) * d} y={CY - 250 + Math.sin(a) * d} r={16} o={1 - clamp01((t - T.hukm) / 0.7)} color="#FFE0A0" />;
        })}
      </g>
      <YearBadge t={t} at={T.flip} year={2022} x={1010} y={150} id="c5s10y" size={100} />
      {t >= T.appeal && <NPill text="محكمة الاستئناف" x={1010} y={915} size={50} kind="white" id="c5s10p" p={(t - T.appeal + 0.05) / 0.3} />}
    </>
  );
};

// ================================================================= S11 · 285.30 · «الإشارات كانت واضحة… المفروض يتصلون يتأكدون»
export const S11: React.FC<{t: number}> = ({t}) => {
  const lights: [number, number][] = [[260, 220], [1000, 220], [630, 880]];
  return (
    <>
      <DarkRoom t={t} id="c5s11r" top="#2A1240" low="#08041A" bokeh="#FF6A7A" />
      <TransferView x={630} y={540} s={0.6} id="c5s11tv" amount="894 مليون $" tone="red" bar={1} mark="cross" glow={RED} bad />
      {lights.map(([x, y], i) => {
        const at = T.signs + i * 0.15;
        const blink = t >= at ? 0.5 + 0.5 * Math.sin((t - at) * 9) : 0;
        cueSfx('blip', `c5s11a${i}`, t >= at && t < at + 0.2, x, {at, gain: 0.7});
        return (
          <PopG key={i} t={t} at={at} x={x} y={y}>
            <Glow x={x} y={y} r={170} color={RED} o={blink} id={`c5s11g${i}`} />
            <Pic {...ART.alarm} x={x} y={y} h={140} id={`c5s11l${i}`} />
          </PopG>
        );
      })}
      {t >= T.signs && t < T.clear && <NPill text="الإشارات" x={630} y={120} size={50} kind="white" id="c5s11p" p={(t - T.signs) / 0.3} />}
      {t >= T.clear && <NPill text="واضحة" x={630} y={120} size={56} kind="red" id="c5s11p2" p={(t - T.clear + 0.05) / 0.3} />}
      {/* a lender with a phone that should have rung */}
      <StoryPerson x={1560} y={1010} s={1.15} t={t} id="c5s11l" role="businessman" rim={CYAN} pose={t >= T.call ? 'think' : 'idle'} flip />
      <Phone t={t} at={T.call - 0.6} x={1280} y={560} h={360} glow={CYAN} id="c5s11ph" screen={
        <g>
          {t >= T.call && [0, 1, 2].map((i) => {
            const k = ((t - T.call) * 1.4 + i / 3) % 1;
            return <circle key={i} cx={225} cy={420} r={80 + k * 160} fill="none" stroke={CYAN} strokeWidth={10} opacity={1 - k} />;
          })}
          <circle cx={225} cy={420} r={80} fill="#22C55E" stroke={OUT} strokeWidth={8} />
          <path d="M190 400 q10 -30 30 -10 l10 10 q-10 20 10 40 q20 20 40 10 l10 10 q20 20 -10 30 q-60 10 -90 -80 Z" fill="#FFFFFF" />
          {t >= T.call && <GlowText text="؟" x={225} y={700} size={200} tone="white" id="c5s11q" />}
        </g>
      } />
      <Callout t={t} at={T.check} x={1280} y={420} lx={1340} ly={150} text="كان المفروض يتصلون" kind="cyan" size={44} id="c5s11co" />
    </>
  );
};

// ================================================================= S12 · 290.04 · «وبنهاية 2022 رجعت الفلوس كلها»
export const S12: React.FC<{t: number}> = ({t}) => {
  const lit = clamp01((t - (T.ret + 0.9)) / 0.4);
  return (
    <>
      <NightCity t={t} id="c5s12c" />
      <HoloRing x={1080} y={850} rx={360} t={t} />
      <Glow x={1080} y={560} r={480} color={GOLD} o={0.55 * lit} id="c5s12lit" />
      <HeroObject t={t} at={T.s12} {...ART.bank} x={1080} y={560} h={540} glow={lit > 0.5 ? GOLD : CYAN} enter="pop" id="c5s12bank" />
      {Array.from({length: 7}, (_, i) => {
        const at = T.ret - 0.1 + i * 0.1;
        const from: [number, number] = [-160, 360 + (i % 3) * 170];
        const [bx, by, k] = arc(t, at, from, [1080, 600], 140, 0.8);
        if (t < at || k >= 0.98) return null;
        return <Pic key={i} {...ART.cash} x={bx} y={by} h={120} s={1 - k * 0.5} rot={20 - k * 40} id={`c5s12b${i}`} />;
      })}
      <YearBadge t={t} at={T.end22 - 0.05} year={2022} x={1640} y={220} label="نهاية" id="c5s12y" size={100} />
      {t >= T.all && <MarkPill t={t} at={T.all} text="رجعت كلها" x={1080} y={915} mark="check" size={52} id="c5s12ok" />}
    </>
  );
};

// ================================================================= S13 · 293.30 · «الحمد لله، مرت على خير، بس بعد أكثر من سنتين محاكم»
export const S13: React.FC<{t: number}> = ({t}) => {
  const tap = t >= T.courts ? Math.sin(Math.PI * clamp01((t - T.courts) / 0.25)) : 0;
  const tap2 = t >= T.courts + 0.45 ? Math.sin(Math.PI * clamp01((t - T.courts - 0.45) / 0.25)) : 0;
  cueSfx('thump', 'c5s13tap', t >= T.courts + 0.1 && t < T.courts + 0.3, 1520, {at: T.courts + 0.1, gain: 0.8});
  return (
    <>
      <NightSky t={t} id="c5s13" />
      <GridFloor id="c5s13f" t={t} />
      <Glow x={1150} y={520} r={560} color={GREEN} o={0.45 * clamp01((t - T.fine) / 0.5)} id="c5s13g" />
      {t >= T.fine && <MarkPill t={t} at={T.fine} text="مرت على خير" x={1150} y={190} mark="check" size={56} id="c5s13ok" />}
      <CalendarCard t={t} at={T.after2 - 0.1} x={1120} y={540} from={0} to={2} dur={0.8} label="سنين" size={1.25} id="c5s13cal" />
      {t >= T.two && <NPill text="سنتين محاكم" x={1120} y={840} size={54} kind="white" id="c5s13p" p={(t - T.two) / 0.3} />}
      <PopG t={t} at={T.courts - 0.25} x={1520} y={600}>
        <g transform={`rotate(${-30 + (tap + tap2) * 34} 1600 640)`}>
          <Pic {...ART.gavel} x={1520} y={580} h={200} id="c5s13gv" />
        </g>
      </PopG>
    </>
  );
};

// ================================================================= S14 · 297.12 · «حتى الغلطة اللي ترجع فلوسها، تاخذ من عمرك»
export const S14: React.FC<{t: number}> = ({t}) => {
  const GX = 1180, GY = 430, GH = 560;
  const rot = moveTo(t, T.mistake + 0.15, 0, 180, 0.55, ease.inOut);
  const q = popAt(t, T.mistake - 0.1);
  cueSfx('pop', 'c5s14pop', t >= T.mistake - 0.1 && t < T.mistake + 0.1, GX, {at: T.mistake - 0.1, hit: 0.12});
  const sandOn = t >= T.mistake + 0.6;
  return (
    <>
      <NightSky t={t} id="c5s14" />
      <Rays t={t} id="c5s14ry" x={GX} y={GY} tone="violet" />
      {q.o > 0 && (
        <g transform={`translate(${GX} ${GY}) scale(${q.s}) rotate(${rot}) translate(${-GX} ${-GY})`} opacity={q.o}>
          <Glow x={GX} y={GY} r={340} color={GOLD} o={0.4} id="c5s14g" />
          <Pic {...ART.glass} x={GX} y={GY} h={GH} glow={GOLD} id="c5s14hg" />
        </g>
      )}
      {/* the sand stream (screen space, after the flip) */}
      {sandOn && (
        <g>
          <rect x={GX - 4} y={GY - 10} width={8} height={170} rx={4} fill="#FFD45A" opacity={0.95} />
          {Array.from({length: 6}, (_, i) => {
            const k = ((t * 1.6) + i / 6) % 1;
            return <circle key={i} cx={GX + Math.sin(i * 2.1) * 3} cy={GY - 10 + k * 170} r={5} fill="#FFF1B8" />;
          })}
        </g>
      )}
      {/* coins drop back into the top bulb */}
      {[0, 1, 2, 3].map((i) => {
        const at = T.refund - 0.15 + i * 0.16;
        if (t < at) return null;
        const [cx, cy, k] = arc(t, at, [GX - 120 + i * 80, -60], [GX - 40 + i * 26, GY - 150], 0, 0.5);
        const o = 1 - clamp01((t - at - 0.6) / 0.25);
        if (o <= 0) return null;
        cueSfx('coins', `c5s14c${i}`, t >= at + 0.45 && t < at + 0.6, cx, {at: at + 0.45, gain: 0.5});
        return <g key={i} opacity={o}><Coin x={cx} y={cy} r={30 - k * 6} t={t} spin={2} phase={i} /></g>;
      })}
      <WordPop t={t} id="c5s14w" y={880} size={120} right={1640}
        words={[{w: 'تاخذ', at: T.take}, {w: 'من', at: T.from}, {w: 'عمرك', at: T.life - 0.05, tone: 'gold'}]} />
    </>
  );
};

