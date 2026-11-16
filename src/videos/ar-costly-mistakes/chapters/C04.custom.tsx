// Custom shots for C04 (builder-owned, AZTIKA). Each: export const S<n>: React.FC<{t: number}> returning the shot's WORLD
// (SVG, no <Stage>/<NightScreen> — the chapter provides them; NightShots joins, drifts and pins the host).
// C04 · Laszlo's two pizzas — grey rain (Howells) vs warm light (Laszlo) → the golden balance → the maths → the open bill.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp01, ease, lerp, popRef, rand} from '../../../kit/anim';
import {lb, uid} from '../../../kit/stage';
import {W, H} from '../../../kit/theme';
import {GlowText, GridFloor, NightSky, NPill, Podium, RevealRing, Sparkle, YearBadge} from '../../../kit/night';
import {Bokeh, Bubble, CountNumber, Flash, HeroObject, Mark, Rays} from '../../../kit/night-fx';
import {HoloRing, RoomWorld, StoryPerson} from '../../../kit/night-worlds';
import {Coin} from '../../../kit/night-props';
import {MarkPill} from '../../../kit/night-data';
import {PlateFx} from '../../../kit/night-places';
import {move, moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {MistakeBill} from '../shared';
import {OUT, popAt} from '../shared/util';

const SLUG = 'ar-costly-mistakes';
const T = {
  s1: 179.48, howells: 179.6, threw: 180.8, wrong: 181.54, amma: 182.0, paid: 183.36, will: 183.88, happy: 184.82, dinner: 186.0, // «هاولز على الأقل رمى ثروته بالغلط. أما … فدفعها بإرادته، وهو مبسوط، مقابل عشاء»
  s2: 186.32, year: 186.75, btc: 187.2, nw: 188.58, odd: 189.22, // «سنة 2010، البيتكوين شيء جديد وغريب»
  s4: 193.18, laszlo: 194.66, buy: 196.14, pizza: 196.52, withBtc: 196.88, // «مبرمج أمريكي اسمه لازلو هانيتش قرر يشتري بيتزا بالبيتكوين»
  s5: 197.5, n10k: 197.83, btcW: 198.98, two: 199.64, deal: 200.54, mistake: 201.64, fun: 202.74, // «ودفع 10000 بيتكوين على بيتزتين … ما كانت غلطة … تجربة طريفة»
  s6: 203.52, count: 204.2, today: 204.6, price: 205.19, week: 206.02, v78: 207.06, v78end: 208.34, // «تعال نحسبها اليوم. سعر البيتكوين هذا الأسبوع حوالي 78 ألف و500 دولار»
  s7: 209.24, times: 209.56, worth: 210.34, eq: 210.88, v785: 211.68, land: 212.7, // «البيتزتين قيمتهم اليوم تقريبًا 785 مليون دولار»
  s9: 217.28, rest: 217.59, chain: 218.9, cheese: 220.16, twoP: 220.62, // «مو مطعم، مو سلسلة مطاعم، مو مصنع جبن. بيتزتين»
  s10: 221.44, howells2: 222.94, nothing: 223.72, atLeast: 224.64, ate: 225.5, // «هاولز ما استفاد أي شيء. هذا على الأقل تعشى»
  s11: 225.94, note: 226.24, back: 227.06, cheap: 230.06, real: 230.52, came: 231.76, years: 232.52, out: 232.7, // «انتبه … بنرجع له في النهاية … تافه. الفاتورة الحقيقية وصلت بعدين بسنين»
};

const GOLD = '#FFC928', GREY_RIM = '#9AA3B5';
const ART = {
  bag: {src: `${SLUG}/el/trash-bag.png`, ar: 0.931},
  box: {src: `${SLUG}/el/pizza-box.png`, ar: 0.921},
  pizzas: {src: `${SLUG}/el/two-pizzas.png`, ar: 1.548},
  coin: {src: `${SLUG}/el/bitcoin-coin.png`, ar: 0.981},
  pile: {src: `${SLUG}/el/bitcoin-pile.png`, ar: 1.391},
  landfill: {src: `${SLUG}/el/landfill-tile.png`, ar: 1.209},
};

// ---------------------------------------------------------------- local helpers
/** a generated image centred at x,y (h tall); layerable + movable; optional glow */
const Pic: React.FC<{src: string; x: number; y: number; h: number; ar: number; o?: number; s?: number; rot?: number; glow?: string; id: string}> = ({src, x, y, h, ar, o = 1, s = 1, rot = 0, glow, id}) => {
  if (o <= 0.001 || s <= 0.001) return null;
  const w = h * ar;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} {...lb('object', id)}>
      <foreignObject x={-w / 2 - 50} y={-h / 2 - 50} width={w + 100} height={h + 100}>
        <div style={{position: 'relative', width: w + 100, height: h + 100}}>
          <Img src={staticFile(src)} style={{position: 'absolute', left: 50, top: 50, width: w, height: h, filter: glow ? `drop-shadow(0 0 10px ${glow}) drop-shadow(0 0 30px ${glow}aa)` : 'drop-shadow(0 10px 8px rgba(0,0,0,0.45))'}} />
        </div>
      </foreignObject>
    </g>
  );
};

const Glow: React.FC<{x: number; y: number; r: number; color: string; o?: number; id: string}> = ({x, y, r, color, o = 1, id}) => {
  const g = uid('c4glow', id);
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

/** an arc move (eased via move()): [x, y, k] */
const arc = (t: number, at: number, from: [number, number], to: [number, number], lift: number, dur = 0): [number, number, number] => {
  const [x, y] = move(t, at, from, to, dur);
  const dist = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
  const k = clamp01(Math.hypot(x - from[0], y - from[1]) / dist);
  return [x, y - lift * Math.sin(Math.PI * k), k];
};

/** p 0..1 → reference pop scale (0 before) */
const pop = (t: number, at: number, d = 0.3) => (t < at ? 0 : popRef(clamp01((t - at) / d)).s);

/** the split stage: cold grey rain on the right, warm room light on the left, a glowing seam between */
const Split: React.FC<{t: number; warm: number; cold?: number; id: string}> = ({t, warm, cold = 1, id}) => {
  const g = uid('c4split', id);
  return (
    <g>
      <defs>
        <clipPath id={g + 'r'}><rect x={960} y={0} width={960} height={H} /></clipPath>
        <clipPath id={g + 'l'}><rect x={0} y={0} width={960} height={H} /></clipPath>
        <linearGradient id={g + 'c'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A4260" />
          <stop offset="1" stopColor="#151A2C" />
        </linearGradient>
        <linearGradient id={g + 's'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* LEFT — warm room */}
      <g clipPath={`url(#${g}l)`}>
        <rect x={0} y={0} width={960} height={H} fill="#1A0F3A" />
        <g opacity={0.25 + 0.75 * warm}>
          <RoomWorld t={t} id={id + 'room'} winX={170} winY={110} />
        </g>
        <Glow x={480} y={560} r={620} color="#FFB347" o={0.45 * warm} id={id + 'warm'} />
      </g>
      {/* RIGHT — grey rain */}
      <g clipPath={`url(#${g}r)`}>
        <rect x={960} y={0} width={960} height={H} fill={`url(#${g}c)`} />
        <g opacity={0.5 * cold}>
          <path d="M960 760 L1100 690 L1180 720 L1300 650 L1420 700 L1560 640 L1700 690 L1800 660 L1920 700 L1920 1080 L960 1080 Z" fill="#232A40" />
        </g>
        <rect x={960} y={960} width={960} height={120} fill="#1B2032" />
        <PlateFx t={t} kind="rain" density={1.1 * cold} seed={4} />
      </g>
      {/* the seam */}
      <rect x={952} y={0} width={16} height={H} fill={`url(#${g}s)`} opacity={0.35} />
      <rect x={957} y={0} width={6} height={H} fill={`url(#${g}s)`} />
    </g>
  );
};

/** a wooden counter across the left half (hides the legs: the person stands behind it) */
const Counter: React.FC<{y: number; x0?: number; x1?: number}> = ({y, x0 = -40, x1 = 940}) => (
  <g>
    <rect x={x0} y={y} width={x1 - x0} height={H - y + 40} fill="#5A3324" stroke={OUT} strokeWidth={8} />
    <rect x={x0} y={y} width={x1 - x0} height={26} fill="#8A5636" stroke={OUT} strokeWidth={6} />
    <rect x={x0} y={y + 4} width={x1 - x0} height={6} fill="#C08155" opacity={0.7} />
  </g>
);

/** rising steam (three soft wavy lines) */
const Steam: React.FC<{t: number; x: number; y: number; o: number}> = ({t, x, y, o}) => (
  <g opacity={o} fill="none" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round">
    {[0, 1, 2].map((i) => {
      const ph = (t * 0.9 + i * 0.33) % 1;
      const yy = y - ph * 110;
      const dx = (i - 1) * 50;
      return <path key={i} d={`M${x + dx} ${yy} q 18 -25 0 -50 q -18 -25 0 -50`} opacity={Math.sin(Math.PI * ph) * 0.8} />;
    })}
  </g>
);

// ---------------------------------------------------------------- S1 · 179.48 · «هاولز رمى ثروته بالغلط. أما … فدفعها بإرادته … مقابل عشاء»
export const S1: React.FC<{t: number}> = ({t}) => {
  const warm = ease.inOut(clamp01((t - (T.amma - 0.1)) / 0.6));
  // Howells: holds the bag, winds up, throws on «رمى»
  const wind = t < T.threw ? Math.sin(clamp01((t - (T.threw - 0.6)) / 0.6) * Math.PI) * -14 : 0;
  const [bx, by, bk] = arc(t, T.threw - 0.05, [1310, 760], [1180, 1240], 220, 0.75);
  const bagRot = wind + bk * 160;
  if (t >= T.threw - 0.05) cueSfx('swish', 'c4-s1-throw', t < T.threw + 0.3, 1250, {at: T.threw - 0.05, hit: 0.2, gain: 0.7});
  // Laszlo-to-be: the coins slide across the counter on «فدفعها»
  const [cx] = move(t, T.paid - 0.1, [520, 0], [175, 0], 0.7);
  const coinsO = 1 - clamp01((t - (T.paid + 1.4)) / 0.3);
  const coinsIn = clamp01((t - (T.amma + 0.4)) / 0.3);
  const pose = t >= T.happy - 0.1 ? 'cheer' : t >= T.paid - 0.3 ? 'point' : 'idle';
  const box = popAt(t, T.dinner - 0.1);
  if (t >= T.dinner - 0.1) cueSfx('pop', 'c4-s1-box', t < T.dinner + 0.2, 300, {at: T.dinner - 0.1, hit: 0.06});
  return (
    <>
      <NightSky t={t} id="c4s1" />
      <Split t={t} warm={warm} id="c4s1sp" />
      {/* RIGHT — Howells */}
      <StoryPerson x={1450} y={1010} s={1.25} role="man" rim={GREY_RIM} pose={t >= T.threw ? 'up' : 'hold'} t={t} id="c4s1-how" />
      <Pic {...ART.bag} x={bx} y={by} h={250} rot={bagRot} id="c4s1-bag" />
      <NPill text="هاولز" x={1450} y={430} size={48} kind="white" id="c4s1-hn" p={(t - T.howells) / 0.3} />
      <NPill text="بالغلط" x={1250} y={880} size={56} kind="red" id="c4s1-wr" p={(t - (T.wrong - 0.1)) / 0.3} />
      {/* LEFT — the programmer at the counter */}
      <g opacity={0.35 + 0.65 * warm}>
        <StoryPerson x={600} y={1010} s={1.25} role="programmer" glasses pose={pose} flip t={t} id="c4s1-las" />
      </g>
      <Counter y={830} />
      {coinsIn > 0 && coinsO > 0 && (
        <g opacity={coinsIn * coinsO}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Coin key={i} x={cx + (i % 2) * 6} y={808 - i * 14} r={36} />
          ))}
        </g>
      )}
      {box.s > 0 && (
        <g>
          <Glow x={300} y={690} r={260} color={GOLD} o={0.7 * box.o} id="c4s1-bg" />
          <g transform={`translate(300 830) scale(${box.s}) translate(-300 -830)`}>
            <Pic {...ART.box} x={300} y={690} h={290} glow={GOLD} id="c4s1-box" />
          </g>
        </g>
      )}
      <MarkPill t={t} at={T.will - 0.1} text="بإرادته" x={560} y={360} mark="check" size={52} id="c4s1-will" />
    </>
  );
};

// ---------------------------------------------------------------- S2 · 186.32 · «سنة 2010، البيتكوين شيء جديد وغريب»
export const S2: React.FC<{t: number}> = ({t}) => {
  const marks = [T.nw - 0.1, T.odd - 0.1];
  return (
    <>
      <RoomWorld t={t} id="c4s2r" />
      <rect x={0} y={0} width={W} height={H} fill="#0F062B" opacity={0.4} />
      <HoloRing x={960} y={800} rx={300} t={t} />
      <RevealRing t={t} at={T.btc - 0.05} x={960} y={540} r={280} boom={false} />
      <HeroObject t={t} at={T.btc - 0.1} src={ART.coin.src} ar={ART.coin.ar} x={960} y={540} h={420} glow={GOLD} sparkles={4} id="c4s2-coin" />
      {marks.map((at, i) => {
        const s = pop(t, at);
        if (s <= 0) return null;
        cueSfx('pop', `c4-s2-q${i}`, t < at + 0.25, i ? 640 : 1280, {at, hit: 0.06});
        const a = (i ? Math.PI : 0) + (t - 188) * 0.7;
        const x = 960 + Math.cos(a) * 360, y = 520 + Math.sin(a) * 200;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <GlowText text="؟" x={0} y={0} size={150} tone="white" id={`c4s2-q${i}`} />
          </g>
        );
      })}
      <YearBadge t={t} at={T.s2 + 0.03} year={2010} from={2013} x={1580} y={210} label="سنة" id="c4s2-y" />
    </>
  );
};

// ---------------------------------------------------------------- S4 · 193.18 · «مبرمج أمريكي اسمه لازلو هانيتش قرر يشتري بيتزا بالبيتكوين»
const ThoughtCloud: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => {
  const puffs: [number, number, number][] = [
    [-0.32, -0.22, 0.3], [0, -0.3, 0.34], [0.32, -0.2, 0.3], [0.4, 0.12, 0.26], [0.12, 0.28, 0.3], [-0.2, 0.28, 0.3], [-0.42, 0.06, 0.26],
  ];
  const shape = (fill: string, stroke: number) => (
    <g fill={fill} stroke={OUT} strokeWidth={stroke}>
      {puffs.map(([px, py, pr], i) => <circle key={i} cx={x + px * w} cy={y + py * h} r={pr * h} />)}
      <ellipse cx={x} cy={y} rx={w * 0.42} ry={h * 0.36} />
    </g>
  );
  return (
    <g>
      {shape('#FFFFFF', 16)}
      {shape('#FFFFFF', 0)}
      <ellipse cx={x - w * 0.15} cy={y - h * 0.32} rx={w * 0.12} ry={h * 0.05} fill="#E9E4FF" />
    </g>
  );
};
export const S4: React.FC<{t: number}> = ({t}) => {
  const cl = popAt(t, T.buy - 0.1);
  const arrow = ease.out(clamp01((t - (T.pizza - 0.15)) / 0.35));
  const pz = pop(t, T.pizza - 0.1);
  const coin = pop(t, T.buy + 0.05);
  const pose = t >= T.withBtc - 0.1 ? 'point' : 'hold';
  if (t >= T.pizza - 0.1) cueSfx('pop', 'c4-s4-pizza', t < T.pizza + 0.2, 1040, {at: T.pizza - 0.1, hit: 0.06});
  const CX = 1250, CY = 420;
  return (
    <>
      <RoomWorld t={t} id="c4s4r" winX={1500} />
      <rect x={0} y={0} width={W} height={H} fill="#0F062B" opacity={0.3} />
      <Glow x={600} y={760} r={260} color="#7FD8FF" o={0.55} id="c4s4-screen" />
      <StoryPerson x={560} y={1040} s={1.45} role="programmer" glasses prop="laptop" pose={pose} t={t} id="c4s4-las" />
      {/* the thought */}
      {cl.s > 0 && (
        <g opacity={cl.o}>
          {[[740, 520, 18], [800, 480, 28]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r * pop(t, T.buy - 0.1 + i * 0.05)} fill="#FFFFFF" stroke={OUT} strokeWidth={8} />
          ))}
          <g transform={`translate(${CX} ${CY}) scale(${cl.s}) translate(${-CX} ${-CY})`}>
            <ThoughtCloud x={CX} y={CY} w={760} h={420} />
            {coin > 0 && (
              <g transform={`translate(1440 420) scale(${coin}) translate(-1440 -420)`}>
                <Pic {...ART.coin} x={1440} y={420} h={210} glow={GOLD} id="c4s4-coin" />
              </g>
            )}
            {arrow > 0 && (
              <g stroke={OUT} strokeLinecap="round" strokeLinejoin="round">
                <line x1={1310} y1={425} x2={lerp(1310, 1205, arrow)} y2={425} strokeWidth={26} />
                <line x1={1310} y1={425} x2={lerp(1310, 1205, arrow)} y2={425} stroke={GOLD} strokeWidth={14} />
                {arrow > 0.8 && <path d="M1225 395 L1185 425 L1225 455" fill="none" stroke={GOLD} strokeWidth={14} />}
              </g>
            )}
            {pz > 0 && (
              <g transform={`translate(1040 430) scale(${pz}) translate(-1040 -430)`}>
                <Pic {...ART.pizzas} x={1040} y={430} h={180} id="c4s4-pz" />
              </g>
            )}
          </g>
        </g>
      )}
      <NPill text="مبرمج أمريكي" x={560} y={380} size={52} kind="white" id="c4s4-job" p={t < T.laszlo - 0.15 ? (t - (T.s4 + 0.05)) / 0.3 : 1 - (t - (T.laszlo - 0.15)) / 0.15} />
      <NPill text="لازلو هانيتش" x={560} y={380} size={56} kind="gold" id="c4s4-name" p={(t - T.laszlo + 0.05) / 0.3} />
    </>
  );
};

// ---------------------------------------------------------------- S5 ★ · 197.50 · «ودفع 10000 بيتكوين على بيتزتين … ما كانت غلطة أبدًا، كانت تجربة طريفة»
const PX = 900, PY = 330, L = 420, CH = 300;
/** the beam angle (deg; + = right side down): coins pour → the beam swings past level → settles LEVEL on «بيتزتين» */
const beamAng = (t: number) => {
  if (t < 199.5) return lerp(12, -3, ease.inOut(clamp01((t - 197.6) / 1.9)));
  const e = t - 199.5;
  return -3 * Math.exp(-e * 4.5) * Math.cos(e * 9.5) + Math.sin(t * 1.3) * 0.25 * clamp01(e);
};
const Pan: React.FC<{x: number; y: number; id: string}> = ({x, y, id}) => {
  const g = uid('c4pan', id);
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE58A" />
          <stop offset="1" stopColor="#B07A06" />
        </linearGradient>
      </defs>
      <path d={`M${x - 190} ${y} Q${x} ${y + 120} ${x + 190} ${y} Z`} fill={`url(#${g})`} stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
      <rect x={x - 196} y={y - 9} width={392} height={18} rx={9} fill="#FFD45A" stroke={OUT} strokeWidth={7} />
      <path d={`M${x - 120} ${y + 30} Q${x - 40} ${y + 62} ${x + 30} ${y + 52}`} fill="none" stroke="#FFF6CC" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
    </g>
  );
};
export const S5: React.FC<{t: number}> = ({t}) => {
  const a = (beamAng(t) * Math.PI) / 180;
  const lx = PX - L * Math.cos(a), ly = PY - L * Math.sin(a);
  const rx = PX + L * Math.cos(a), ry = PY + L * Math.sin(a);
  const lp = ly + CH, rp = ry + CH;
  const grow = ease.out(clamp01((t - 197.65) / 1.4));
  const purple = ease.inOut(clamp01((t - 197.5) / 2.2));
  const level = clamp01((t - (T.two - 0.05)) / 0.4);
  const z = moveTo(t, T.s5, 1, 1.06, 6);
  const fun = popAt(t, T.fun - 0.45);
  const g = uid('c4scale', 'a');
  if (t >= T.s5) cueSfx('coins', 'c4-s5-pour', t < T.s5 + 0.3, lx, {at: T.s5, hit: 0.1});
  // the coin cascade: 26 coins fall (gravity) onto the growing pile
  const coins = Array.from({length: 26}, (_, i) => {
    const t0 = 197.45 + i * 0.055, d = 0.42;
    const k = (t - t0) / d;
    if (k < 0 || k > 1) return null;
    const x = lx + (rand(i * 3.7) - 0.5) * 220;
    const top = lp - 30 - 200 * grow;
    const y = lerp(-80, top, ease.in(k));
    return <Coin key={i} x={x} y={y} r={30} t={t} spin={9} phase={i} />;
  });
  const pileH = 250 * Math.max(0.12, grow);
  const strike = ease.out(clamp01((t - (T.mistake + 0.1)) / 0.25));
  return (
    <>
      <RoomWorld t={t} id="c4s5r" />
      <rect x={0} y={0} width={W} height={H} fill="#1A0B45" opacity={0.25 + 0.6 * purple} />
      <g opacity={level}><Rays t={t} id="c4s5-rays" x={PX} y={PY + 100} tone="gold" /></g>
      <Bokeh t={t} n={12} color={GOLD} seed={4} />
      <g transform={`translate(${PX} 560) scale(${z}) translate(${-PX} -560)`}>
        <Glow x={PX} y={950} r={520} color={GOLD} o={0.35 + 0.35 * level} id="c4s5-floor" />
        <Podium x={PX} base={1010} w={560} h={110} id="c4s5-pod" color="gold" />
        {/* stand */}
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFE58A" />
            <stop offset="0.5" stopColor="#E9A90C" />
            <stop offset="1" stopColor="#8A5A04" />
          </linearGradient>
        </defs>
        <path d={`M${PX - 140} 900 L${PX - 60} 850 L${PX + 60} 850 L${PX + 140} 900 Z`} fill={`url(#${g})`} stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
        <rect x={PX - 22} y={PY} width={44} height={530} fill={`url(#${g})`} stroke={OUT} strokeWidth={8} />
        {/* chains */}
        {[[lx, lp], [rx, rp]].map(([ex, py], i) => (
          <g key={i} stroke="#C99A2E" strokeWidth={6}>
            <line x1={ex} y1={PY + (ex - PX) * Math.tan(a)} x2={ex - 180} y2={py} />
            <line x1={ex} y1={PY + (ex - PX) * Math.tan(a)} x2={ex + 180} y2={py} />
          </g>
        ))}
        {/* LEFT pan: the bitcoin mountain */}
        <Pic {...ART.pile} x={lx} y={lp + 8 - pileH / 2} h={pileH} glow={grow > 0.5 ? GOLD : undefined} id="c4s5-pile" />
        {coins}
        <Pan x={lx} y={lp} id="l" />
        {/* RIGHT pan: two pizzas */}
        <Pic {...ART.pizzas} x={rx} y={rp - 70} h={170} id="c4s5-pz" />
        <Pan x={rx} y={rp} id="r" />
        {/* beam */}
        <g transform={`translate(${PX} ${PY}) rotate(${beamAng(t)})`}>
          <rect x={-L - 30} y={-18} width={2 * L + 60} height={36} rx={18} fill={`url(#${g})`} stroke={OUT} strokeWidth={8} />
          <rect x={-L - 10} y={-10} width={2 * L + 20} height={7} rx={3} fill="#FFF3B8" opacity={0.8} />
          <circle cx={-L} cy={0} r={16} fill="#FFD45A" stroke={OUT} strokeWidth={6} />
          <circle cx={L} cy={0} r={16} fill="#FFD45A" stroke={OUT} strokeWidth={6} />
        </g>
        <path d={`M${PX} ${PY - 90} L${PX + 34} ${PY - 20} L${PX - 34} ${PY - 20} Z`} fill="#FFD45A" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
        <circle cx={PX} cy={PY} r={36} fill="#FFD45A" stroke={OUT} strokeWidth={8} />
        <circle cx={PX - 10} cy={PY - 10} r={10} fill="#FFF6CC" />
        {level > 0 && level < 1 && <Sparkle x={PX} y={PY} r={70 * Math.sin(Math.PI * level)} o={1} color="#FFFFFF" />}
        <RevealRing t={t} at={T.two - 0.05} x={PX} y={PY} r={200} boom={false} />
      </g>
      {/* text: the count + «بيتكوين» (leave on «الصفقة»), «الصفقة», struck «غلطة» */}
      <g opacity={1 - clamp01((t - (T.deal - 0.2)) / 0.25)}>
        <CountNumber t={t} at={T.n10k - 0.1} value="10000" x={470} y={790} size={110} tone="white" dur={1.2} id="c4s5-n" />
        <NPill text="بيتكوين" x={470} y={900} size={50} kind="white" id="c4s5-btc" p={(t - (T.btcW - 0.1)) / 0.3} />
      </g>
      <g opacity={1 - clamp01((t - (T.fun - 0.3)) / 0.25)}>
        <NPill text="الصفقة" x={PX} y={170} size={60} kind="gold" id="c4s5-deal" p={(t - (T.deal - 0.1)) / 0.3} />
      </g>
      {t >= T.mistake - 0.1 && (
        <g>
          <NPill text="غلطة" x={PX} y={560} size={72} kind="red" id="c4s5-mis" p={(t - (T.mistake - 0.1)) / 0.3} />
          {strike > 0 && <line x1={PX - 120} y1={560} x2={PX - 120 + 240 * strike} y2={560} stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" />}
          {strike > 0.9 && <Mark kind="cross" x={PX + 140} y={520} r={34} />}
        </g>
      )}
      {/* Laszlo, happy beside his deal */}
      {fun.s > 0 && (
        <g transform={`translate(1690 1010) scale(${fun.s}) translate(-1690 -1010)`} opacity={fun.o}>
          <StoryPerson x={1690} y={1010} s={0.9} role="programmer" glasses pose="cheer" t={t} id="c4s5-las" />
        </g>
      )}
      <Bubble t={t} at={T.fun - 0.1} lines={['تجربة طريفة']} x={1600} y={430} tx={1670} ty={650} size={56} mark="check" />
    </>
  );
};

// ---------------------------------------------------------------- S6 · 203.52 · «تعال نحسبها اليوم. سعر البيتكوين هذا الأسبوع حوالي 78 ألف و500 دولار»
const CX6 = 1180, CY6 = 420;
export const S6: React.FC<{t: number}> = ({t}) => {
  const spin = clamp01((t - T.count) / (T.today - T.count));
  const sx = Math.abs(Math.cos(Math.PI * ease.inOut(spin)));
  if (t >= T.count) cueSfx('swish', 'c4-s6-spin', t < T.count + 0.3, 1600, {at: T.count, hit: 0.2, gain: 0.6});
  const swap = clamp01((t - (T.week - 0.15)) / 0.15);
  return (
    <>
      <NightSky t={t} id="c4s6" />
      <Rays t={t} id="c4s6-rays" x={CX6} y={CY6} tone="gold" />
      <GridFloor t={t} id="c4s6f" />
      <HoloRing x={CX6} y={690} rx={260} t={t} />
      <HeroObject t={t} at={T.s6 + 0.05} src={ART.coin.src} ar={ART.coin.ar} x={CX6} y={CY6} h={420} glow={GOLD} sparkles={4} id="c4s6-coin" />
      {/* «2010» spins into «اليوم» → «هذا الأسبوع» */}
      <g transform={`translate(1640 190) scale(${Math.max(0.02, sx)} 1) translate(-1640 -190)`}>
        {spin < 0.5 ? (
          <YearBadge t={t} at={T.s6} year={2010} x={1640} y={190} id="c4s6-y" />
        ) : (
          <g opacity={1 - swap}>
            <NPill text="اليوم" x={1640} y={190} size={64} kind="gold" id="c4s6-today" />
          </g>
        )}
      </g>
      {swap > 0 && <NPill text="هذا الأسبوع" x={1640} y={190} size={52} kind="white" id="c4s6-week" p={(t - (T.week - 0.05)) / 0.3} />}
      <g opacity={1 - clamp01((t - (T.v78 - 0.25)) / 0.2)}>
        <NPill text="سعر البيتكوين" x={CX6} y={760} size={56} kind="white" id="c4s6-price" p={(t - (T.price - 0.1)) / 0.3} />
      </g>
      <CountNumber t={t} at={T.v78 - 0.1} value="78 ألف و500 $" x={CX6} y={790} size={124} tone="gold" dur={T.v78end - T.v78 + 0.1} id="c4s6-n" />
    </>
  );
};

// ---------------------------------------------------------------- S7 · 209.24 · «يعني البيتزتين قيمتهم اليوم تقريبًا 785 مليون دولار»
export const S7: React.FC<{t: number}> = ({t}) => {
  const [cx, cy] = move(t, T.s7 + 0.05, [CX6, CY6], [1560, 210], 0.5);
  const cs = moveTo(t, T.s7 + 0.05, 1, 0.5, 0.5);
  const count0 = 1 - clamp01((t - T.s7) / 0.2);
  const rise = ease.out(clamp01((t - (T.worth - 0.1)) / 0.45));
  const xs = pop(t, T.times - 0.1);
  const eq = pop(t, T.eq - 0.1);
  if (t >= T.times - 0.1) cueSfx('thump', 'c4-s7-x', t < T.times + 0.2, 1130, {at: T.times - 0.1, hit: 0.06, gain: 0.7});
  if (t >= T.worth - 0.1) cueSfx('whoosh', 'c4-s7-rise', t < T.worth + 0.3, 1000, {at: T.worth - 0.1, hit: 0.2, gain: 0.6});
  if (t >= T.eq - 0.1) cueSfx('pop', 'c4-s7-eq', t < T.eq + 0.2, 1000, {at: T.eq - 0.1, hit: 0.06, gain: 0.6});
  const landed = clamp01((t - T.land) / 0.3);
  return (
    <>
      <NightSky t={t} id="c4s7" />
      <Rays t={t} id="c4s7-rays" x={1000} y={520} tone="gold" />
      <GridFloor t={t} id="c4s7f" />
      <g transform={`translate(${cx} ${cy}) scale(${cs})`}>
        <HeroObject t={t} at={T.s6 + 0.05} src={ART.coin.src} ar={ART.coin.ar} x={0} y={0} h={420} glow={GOLD} sparkles={2} id="c4s7-coin" />
      </g>
      {count0 > 0 && <g opacity={count0}><GlowText text="78 ألف و500 $" x={CX6} y={790} size={124} tone="gold" id="c4s7-n0" /></g>}
      <NPill text="78 ألف و500 $" x={1560} y={355} size={44} kind="white" id="c4s7-tag" p={(t - (T.s7 + 0.3)) / 0.3} />
      {xs > 0 && (
        <g transform={`translate(1150 250) scale(${xs})`}>
          <GlowText text="× 10000" x={0} y={0} size={104} tone="white" id="c4s7-x" />
        </g>
      )}
      {rise > 0 && (
        <g>
          <Glow x={1000} y={520} r={380} color={GOLD} o={0.5 * rise} id="c4s7-pg" />
          <Pic {...ART.pizzas} x={1000} y={lerp(700, 520, rise)} h={270} o={rise} glow={GOLD} id="c4s7-pz" />
        </g>
      )}
      {eq > 0 && (
        <g transform={`translate(1000 735) scale(${eq})`} opacity={1 - 0.6 * landed}>
          <GlowText text="=" x={0} y={0} size={96} tone="white" id="c4s7-eq" />
        </g>
      )}
      <CountNumber t={t} at={T.v785} value="785 مليون $" x={1000} y={870} size={150} tone="gold" dur={T.land - T.v785} id="c4s7-n" />
      <RevealRing t={t} at={T.land} x={1000} y={870} r={360} boom={false} tail />
      <Flash t={t} at={T.land} strength={0.45} />
    </>
  );
};

// ---------------------------------------------------------------- S9 · 217.28 · «مو مطعم، مو سلسلة مطاعم، مو مصنع جبن. بيتزتين»
const Shopfront: React.FC<{x: number; y: number; s: number; c: string}> = ({x, y, s, c}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-70} y={-60} width={140} height={120} fill="#E9DCC0" stroke={OUT} strokeWidth={7} />
    <rect x={-30} y={0} width={42} height={60} fill="#4A2A1E" stroke={OUT} strokeWidth={5} />
    <rect x={22} y={0} width={36} height={32} fill="#FFD27A" stroke={OUT} strokeWidth={5} />
    <path d="M-82 -60 L82 -60 L72 -100 L-72 -100 Z" fill={c} stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
    {[-54, -18, 18, 54].map((sx) => <path key={sx} d={`M${sx - 9} -100 L${sx + 9} -100 L${sx + 11} -60 L${sx - 11} -60 Z`} fill="#FFFFFF" opacity={0.85} />)}
  </g>
);
const CheeseFactory: React.FC = () => (
  <g>
    <rect x={-95} y={-10} width={190} height={90} fill="#6E5A8C" stroke={OUT} strokeWidth={7} />
    <rect x={40} y={-110} width={34} height={100} fill="#4E3E6A" stroke={OUT} strokeWidth={6} />
    <circle cx={70} cy={-128} r={16} fill="#B9B4CC" opacity={0.8} />
    <circle cx={88} cy={-150} r={20} fill="#B9B4CC" opacity={0.6} />
    <path d="M-80 70 L-80 0 L20 -40 L60 70 Z" fill="#FFC928" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
    <circle cx={-40} cy={30} r={11} fill="#E9A90C" />
    <circle cx={10} cy={45} r={8} fill="#E9A90C" />
    <circle cx={-10} cy={5} r={7} fill="#E9A90C" />
  </g>
);
/** one big lineup frame (local: the kit Lineup's pills are 42 px and its marks small — the director wanted them big) */
const BigFrame: React.FC<{t: number; at: number; markAt: number; x: number; y: number; r: number; label: string; mark: 'cross' | 'check'; gold?: boolean; id: string; children: React.ReactNode}> = ({t, at, markAt, x, y, r, label, mark, gold, id, children}) => {
  const p = clamp01((t - at) / 0.3);
  if (p <= 0) return null;
  const q = popRef(p, 0.45, 0.3);
  const g = uid('c4bf', id);
  const mk = t >= markAt ? popRef(clamp01((t - markAt) / 0.22), 0.5, 0.6) : null;
  const crossed = mark === 'cross' && !!mk;
  cueSfx('pop', `c4-bf-${id}`, t < at + 0.25, x, {at, hit: 0.06, gain: 0.6});
  return (
    <g>
      <g transform={`translate(${x} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
        <defs><clipPath id={g}><circle r={r - 8} /></clipPath></defs>
        {gold && <Glow x={0} y={0} r={r * 1.7} color={GOLD} o={0.85} id={id + 'g'} />}
        <circle r={r} fill={gold ? '#3A2A10' : '#1E1840'} stroke={gold ? GOLD : '#3A3166'} strokeWidth={gold ? 14 : 8} />
        <circle r={r} fill="none" stroke={crossed ? '#E23A4E' : gold ? '#FFE58A' : '#7B6BD6'} strokeWidth={4} opacity={0.8} />
        <g clipPath={`url(#${g})`} opacity={crossed ? 0.5 : 1} transform={`scale(${r / 135})`}>{children}</g>
        {mk && (
          <g transform={`translate(${r * 0.72} ${-r * 0.72}) scale(${mk.sx} ${mk.sy})`}>
            <Mark kind={mark} x={0} y={0} r={r * (gold ? 0.3 : 0.27)} />
          </g>
        )}
      </g>
      <NPill text={label} x={x} y={y + r + 56} size={gold ? 56 : 48} kind={gold ? 'gold' : 'white'} id={id + 'p'} p={(t - at - 0.12) / 0.25} />
    </g>
  );
};
export const S9: React.FC<{t: number}> = ({t}) => {
  // Arabic order right → left: مطعم · سلسلة مطاعم · مصنع جبن · then the gold «بيتزتين» (biggest) on the left
  const Y = 470, R = 165, RP = 215;
  return (
    <>
      <NightSky t={t} id="c4s9" />
      <GridFloor t={t} id="c4s9f" />
      <BigFrame t={t} at={T.s9} markAt={T.rest + 0.1} x={1545} y={Y} r={R} label="مطعم" mark="cross" id="c4s9-a">
        <Shopfront x={0} y={20} s={1.05} c="#D2363A" />
      </BigFrame>
      <BigFrame t={t} at={T.s9 + 0.1} markAt={T.chain + 0.1} x={1175} y={Y} r={R} label="سلسلة مطاعم" mark="cross" id="c4s9-b">
        <g>
          <Shopfront x={-72} y={40} s={0.6} c="#2E8FD8" />
          <Shopfront x={72} y={40} s={0.6} c="#2E8FD8" />
          <Shopfront x={0} y={0} s={0.72} c="#2E8FD8" />
        </g>
      </BigFrame>
      <BigFrame t={t} at={T.s9 + 0.2} markAt={T.cheese + 0.1} x={805} y={Y} r={R} label="مصنع جبن" mark="cross" id="c4s9-c">
        <CheeseFactory />
      </BigFrame>
      <RevealRing t={t} at={T.twoP - 0.05} x={385} y={Y} r={260} boom={false} />
      <BigFrame t={t} at={T.twoP - 0.12} markAt={T.twoP + 0.1} x={385} y={Y} r={RP} label="بيتزتين" mark="check" gold id="c4s9-d">
        <Pic {...ART.pizzas} x={0} y={0} h={165} glow={GOLD} id="c4s9-pz" />
      </BigFrame>
    </>
  );
};

// ---------------------------------------------------------------- S10 · 221.44 · «والفرق بينه وبين هاولز؟ هاولز ما استفاد أي شيء. هذا على الأقل تعشى»
export const S10: React.FC<{t: number}> = ({t}) => {
  const warm = ease.inOut(clamp01((t - (T.atLeast - 0.1)) / 0.5));
  const cold = 1 - 0.4 * warm;
  const [px, py] = move(t, T.ate - 0.2, [270, 860], [330, 640], 0.5);
  const lift = clamp01((t - (T.ate - 0.2)) / 0.5);
  if (t >= T.ate - 0.2) cueSfx('swish', 'c4-s10-lift', t < T.ate + 0.2, 330, {at: T.ate - 0.2, hit: 0.25, gain: 0.6});
  return (
    <>
      <NightSky t={t} id="c4s10" />
      <Split t={t} warm={0.25 + 0.75 * warm} cold={cold} id="c4s10sp" />
      {/* RIGHT — Howells on the landfill, empty hands */}
      <Pic {...ART.landfill} x={1700} y={900} h={280} o={0.85} id="c4s10-lf" />
      <StoryPerson x={1450} y={1010} s={1.25} role="man" rim={GREY_RIM} pose={t >= T.nothing - 0.1 ? 'up' : 'idle'} t={t} id="c4s10-how" />
      <NPill text="هاولز" x={1450} y={440} size={48} kind="white" id="c4s10-hn" p={(t - (T.howells2 - 0.1)) / 0.3} />
      <MarkPill t={t} at={T.nothing - 0.1} text="ما استفاد شيء" x={1420} y={300} mark="cross" size={50} id="c4s10-no" />
      {/* LEFT — Laszlo eats */}
      <Glow x={480} y={640} r={460} color={GOLD} o={0.5 * warm} id="c4s10-g" />
      <g opacity={0.45 + 0.55 * warm}>
        <StoryPerson x={560} y={1010} s={1.25} role="programmer" glasses rim={GOLD} pose={t >= T.ate - 0.2 ? 'cheer' : 'idle'} flip t={t} id="c4s10-las" />
      </g>
      <Counter y={850} />
      <Pic {...ART.box} x={px} y={py} h={260} glow={lift > 0.5 ? GOLD : undefined} id="c4s10-box" />
      <Steam t={t} x={px} y={py - 140} o={lift} />
      <MarkPill t={t} at={T.ate - 0.05} text="تعشى" x={520} y={330} mark="check" size={56} id="c4s10-ate" />
    </>
  );
};

// ---------------------------------------------------------------- S11 · 225.94 · «انتبه لشيء بنرجع له في النهاية … تافه. الفاتورة الحقيقية وصلت بعدين بسنين»
/** a blank tear-off calendar block (no numbers — none spoken): pages tear away fast */
const CalBlock: React.FC<{t: number; at: number; x: number; y: number; out?: number}> = ({t, at, x, y, out}) => {
  const q = popAt(t, at - 0.5);
  if (q.s <= 0) return null;
  const fo = out !== undefined ? 1 - clamp01((t - out) / 0.25) : 1;
  const pages = Array.from({length: 11}, (_, i) => {
    const t0 = at + i * 0.09;
    const k = (t - t0) / 0.55;
    if (k < 0 || k > 1) return null;
    const dx = -(80 + rand(i * 5.1) * 320), dy = -200 - rand(i * 2.3) * 200;
    const e = ease.out(k);
    return (
      <g key={i} transform={`translate(${x + dx * e} ${y - 20 + dy * e + 300 * k * k}) rotate(${(rand(i) - 0.5) * 120 * e})`} opacity={1 - k}>
        <rect x={-110} y={-80} width={220} height={170} rx={10} fill="#FFFBF0" stroke={OUT} strokeWidth={6} />
      </g>
    );
  });
  if (t >= at) cueSfx('page', 'c4-s11-cal', t < at + 0.3, x, {at, hit: 0.05});
  return (
    <g opacity={fo}>
      <g transform={`translate(${x} ${y}) scale(${q.s}) translate(${-x} ${-y})`} opacity={q.o}>
        <rect x={x - 130} y={y - 150} width={260} height={290} rx={18} fill="#FFFBF0" stroke={OUT} strokeWidth={8} />
        <rect x={x - 130} y={y - 150} width={260} height={80} rx={18} fill="#D2363A" stroke={OUT} strokeWidth={8} />
        <rect x={x - 130} y={y - 100} width={260} height={30} fill="#D2363A" />
        {[-70, 70].map((rx) => <rect key={rx} x={x + rx - 10} y={y - 175} width={20} height={50} rx={10} fill="#2A2040" stroke={OUT} strokeWidth={5} />)}
        {[0, 1, 2].map((r) => <rect key={r} x={x - 90} y={y - 30 + r * 50} width={180} height={18} rx={9} fill="#D9D0BC" />)}
      </g>
      {pages}
    </g>
  );
};
export const S11: React.FC<{t: number}> = ({t}) => {
  const z = moveTo(t, T.s11, 1, 1.07, 6.6); // slow push-in on the bill
  return (
    <>
      <NightSky t={t} id="c4s11" />
      <GridFloor t={t} id="c4s11f" />
      <Bokeh t={t} n={10} color={GOLD} seed={11} />
      <g transform={`translate(860 540) scale(${z}) translate(-860 -540)`}>
        <MistakeBill t={t} at={T.note - 0.1} x={940} y={530} w={900} s={1.05} title="فاتورة البيتزا" id="c4s11-bill" out={T.out}
          rows={[
            {label: 'وقتها', value: 'تافه', tone: 'ink', at: T.cheap - 0.1},
            {label: 'الفاتورة الحقيقية', value: 'بعدين', tone: 'gold', at: T.real - 0.1},
          ]}
          total={{label: 'المجموع', value: '؟', tone: 'gold', at: T.note + 0.5}}
        />
        <g opacity={1 - clamp01((t - T.out) / 0.2)}>
          <NPill text="بنرجع له في النهاية" x={1230} y={215} size={44} kind="gold" id="c4s11-back" p={(t - (T.back - 0.1)) / 0.3} />
        </g>
        <CalBlock t={t} at={T.came} x={290} y={520} out={T.out} />
        <g opacity={1 - clamp01((t - T.out) / 0.2)}>
          <NPill text="بسنين" x={290} y={770} size={60} kind="white" id="c4s11-yrs" p={(t - (T.years - 0.1)) / 0.3} />
        </g>
      </g>
    </>
  );
};
