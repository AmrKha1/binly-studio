// Custom shots for C01 (builder-owned, AZTIKA). Each: export const S<n>: React.FC<{t: number}> returning the shot's WORLD
// (SVG, no <Stage>/<NightScreen> — the chapter provides them; NightShots joins, drifts and pins the host).
// HOOK — matched to the reference's hook (shots-01 #1–#17): rich close-ups, a glowing «؟», the board, the open loop.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp01, ease, lerp, noise1, popRef, rand} from '../../../kit/anim';
import {GlowText, GridFloor, NightSky, NPill, Podium, PopWord, RevealRing, Sparkle, WordPop, textWidth} from '../../../kit/night';
import {Bokeh, Flash, HeroObject, Mark, Rays} from '../../../kit/night-fx';
import {coinArt} from '../../../kit/night-objects';
import {Laptop, MessageCard} from '../../../kit/night-ui';
import {NightMap, nightProj} from '../../../kit/night-maps';
import {Magnifier} from '../../../kit/night-sci';
import {move, moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {FateDoor, MistakeBill} from '../shared';

const SLUG = 'ar-costly-mistakes';
const el = (n: string) => `${SLUG}/el/${n}.png`;

const T = {
  khat: 0.8, //      «خط» صغير
  darba: 1.92, //    «ضربة» قلم
  kees: 10.03, //    «كيس» زبالة
  madfoon: 11.28, // «مدفون» فيه
  tharwa: 11.96, //  «ثروة»
  miat: 12.36, //    «بمئات» الملايين
  wadheefa: 14.26, // رسالة «وظيفة»
  linkedin: 14.82, // على «لينكدإن»
  fatahat: 15.2, //  «فتحت» الباب
  bab: 15.72, //     «الباب»
  akbar: 16.18, //   لـ«أكبر»
  sariqa: 16.72, //  «سرقة»
  tareekh: 17.68, // في «التاريخ»
  akeed: 18.12, //   «أكيد» بتقول
  ubalegh: 18.96, // إني «أبالغ»
  bas: 19.56, //     «بس» كل هذا
  kul: 19.89, //     «كل» هذا
  saar: 20.28, //    «صار»
  feelan: 20.6, //   «فعلًا»
  wel: 21.02, //     «واليوم»
  ntla: 21.31, //    «بنطلع»
  daraja: 22.12, //  «درجة» درجة
  daraja2: 22.56, // درجة «درجة»
  arkhas: 23.26, //  من «أرخص»
  lain: 24.24, //    «لين» نوصل لأغلى
  asghar: 29.5, //   «أصغر»
  raqam: 30.06, //   «رقم»
  video: 31.0, //    في «الفيديو» كله
  agrab: 31.7, //    «والأغرب»
  mo: 32.62, //      «مو» بعيدة
  ard: 34.3, //      «أرض» عربية
  arabia: 34.54, //  «عربية»
  fatoora: 35.0, //  «وفاتورتها»
  nas: 36.28, //     «ناس»
  mawjoodeen: 37.44, // «موجودين»
};

// ---- local helpers -----------------------------------------------------------------------------------------------
/** a generated art piece drawn at 0,0 (centre); `sil` = the reference's black mystery silhouette with a violet rim */
const Art: React.FC<{src: string; ar: number; h: number; sil?: boolean}> = ({src, ar, h, sil}) => {
  const w = h * ar;
  return (
    <foreignObject x={-w / 2 - 30} y={-h / 2 - 30} width={w + 60} height={h + 60}>
      <Img
        src={staticFile(src)}
        style={{position: 'absolute', left: 30, top: 30, width: w, height: h, filter: sil ? 'brightness(0) drop-shadow(0 0 16px rgba(170,120,255,0.75))' : 'drop-shadow(0 0 10px rgba(255,214,90,0.5))'}}
      />
    </foreignObject>
  );
};

/** WordPop centred on cx (Arabic: WordPop anchors its right edge) */
const CWords: React.FC<{t: number; words: PopWord[]; y: number; size: number; cx: number; id: string; out?: number}> = ({t, words, y, size, cx, id, out}) => {
  const gap = size * 0.2;
  const tot = words.reduce((a, w) => a + textWidth(w.w, size), 0) + gap * (words.length - 1);
  return <WordPop t={t} words={words} y={y} size={size} right={cx + tot / 2} gap={gap} id={id} out={out} />;
};

/** a soft blurred glow blob */
const Glow: React.FC<{x: number; y: number; r: number; color: string; o: number; id: string}> = ({x, y, r, color, o, id}) =>
  o <= 0.01 ? null : (
    <g>
      <defs>
        <radialGradient id={`c01g-${id}`}>
          <stop offset="0" stopColor={color} stopOpacity={1} />
          <stop offset="0.45" stopColor={color} stopOpacity={0.45} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#c01g-${id})`} opacity={o} />
    </g>
  );

const pop = (t: number, at: number) => (t < at ? {s: 0, o: 0} : popRef(clamp01((t - at) / 0.3)));

// ==================================================================================================================
// S1 · 0.00 · «خط صغير بحجم ضربة قلم» — the gold pen over the bill: digits rolling, ONE tiny stroke, then it flares
export const S1: React.FC<{t: number}> = ({t}) => {
  const bx = 1170, by = 600, bs = 1.12;
  // the bill (w 900, one row + total): row centre y local = −235 + 128 + 48 = −59 ; row label «خط صغير» ends at x 410
  const sy = by + (-59 - 50) * bs; // the overline sits just above the label
  const sx1 = bx + 400 * bs, sx0 = bx + 290 * bs; // drawn right → left (Arabic hand)
  const k = ease.inOut(clamp01((t - T.khat) / 0.45));
  const end = lerp(sx1, sx0, k);
  // the nib: hovers → touches on «خط» → draws → lifts
  const PH = 520, nibDx = -0.46 * PH, nibDy = 0.43 * PH; // nib = bottom-left tip of fountain-pen.png
  let [nx, ny] = move(t, -0.3, [sx1 + 70, sy - 80], [sx1, sy], 1.0);
  if (t >= T.khat) [nx, ny] = move(t, T.khat, [sx1, sy], [sx0, sy], 0.45);
  if (t >= 1.4) [nx, ny] = move(t, 1.4, [sx0, sy], [sx0 - 30, sy - 70], 0.6);
  const flare = t >= T.darba ? Math.exp(-(t - T.darba) / 0.5) : 0;
  const frozen = t >= T.darba;
  const roll = Math.floor(rand(Math.floor(t * 18) + 11) * 899e6 + 100e6).toLocaleString('en-US');
  cueSfx('scribble', 'c01-s1-stroke', t >= T.khat && t < T.khat + 0.45, sx1, {at: T.khat, hit: 0.1, gain: 0.8});
  return (
    <g>
      <NightSky t={t} id="c01s1" />
      <g opacity={0.75}>
        <Rays t={t} id="c01s1r" x={bx} y={by} tone="violet" />
      </g>
      <Bokeh t={t} n={22} seed={3} />
      <MistakeBill
        t={t} at={-0.6} x={bx} y={by} s={bs} rot={0} id="c01-bill1" title="الفاتورة"
        rows={[{label: 'خط صغير', value: '؟', tone: 'red', at: -0.5}]}
        total={{label: 'المجموع', value: frozen ? '؟؟؟ $' : `${roll} $`, tone: 'gold', at: -0.4}}
      />
      {/* the stroke: one tiny glowing gold line */}
      {t >= T.khat && (
        <g>
          <line x1={sx1} y1={sy} x2={end} y2={sy} stroke="#FFC928" strokeWidth={16 + 22 * flare} strokeLinecap="round" opacity={0.35 + 0.4 * flare} style={{filter: 'blur(8px)'}} />
          <line x1={sx1} y1={sy} x2={end} y2={sy} stroke="#05030F" strokeWidth={14} strokeLinecap="round" />
          <line x1={sx1} y1={sy} x2={end} y2={sy} stroke={flare > 0.05 ? '#FFE9A0' : '#FCC018'} strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
      <Glow x={(sx0 + sx1) / 2} y={sy} r={200} color="#FFC928" o={0.9 * flare} id="s1flare" />
      <RevealRing t={t} at={T.darba} x={(sx0 + sx1) / 2} y={sy} r={170} />
      {[0, 1, 2, 3].map((i) => flare > 0.05 && <Sparkle key={i} x={(sx0 + sx1) / 2 + Math.cos(i * 1.7) * (60 + 90 * (1 - flare))} y={sy + Math.sin(i * 1.7) * (40 + 70 * (1 - flare))} r={18 * flare + 6} o={flare} color="#FFE08A" />)}
      <HeroObject t={t} at={-0.5} src={el('fountain-pen')} ar={1.004} x={nx - nibDx} y={ny - nibDy} h={PH} glow="#FFC928" float={false} sparkles={3} id="c01-pen" />
    </g>
  );
};

// ==================================================================================================================
// S5 · 9.76 · «كيس زبالة واحد مدفون فيه ثروة بمئات الملايين» — the bag drops, the landfill rises over it, gold inside
const STRATA = ['#3B3140', '#5A4838', '#46474F', '#6A5543', '#3E3B47', '#5B4A3A', '#4E505B'];
export const S5: React.FC<{t: number}> = ({t}) => {
  const bx = 1170, base = 836, bh = 360, by = base - bh / 2 + 12;
  const rise = ease.out(clamp01((t - (T.madfoon - 0.15)) / 0.65));
  const top = lerp(1120, 420, rise);
  const gold = ease.out(clamp01((t - T.tharwa) / 0.5));
  const land = t - T.kees;
  const shake = land > 0 && land < 0.35 ? Math.sin(land * 60) * 9 * (1 - land / 0.35) : 0;
  const hole = {rx: 245, ry: 228};
  cueSfx('rumble', 'c01-s5-rise', t >= T.madfoon - 0.15 && t < T.madfoon + 0.4, bx, {at: T.madfoon - 0.15, hit: 0.3, gain: 0.7});
  return (
    <g transform={`translate(0 ${shake})`}>
      <NightSky t={t} id="c01s5" />
      <GridFloor id="c01s5f" t={t} />
      {/* the pocket (cave) behind the bag, once the ground is around it */}
      <defs>
        <clipPath id="c01s5-under"><rect x={0} y={top} width={1920} height={1200} /></clipPath>
        <mask id="c01s5-mask">
          <rect x={-100} y={-100} width={2200} height={1400} fill="#FFFFFF" />
          <ellipse cx={bx} cy={by} rx={hole.rx} ry={hole.ry} fill="#000000" />
        </mask>
      </defs>
      <g clipPath="url(#c01s5-under)">
        <ellipse cx={bx} cy={by} rx={hole.rx} ry={hole.ry} fill="#140C24" />
      </g>
      <Glow x={bx} y={by} r={330} color="#FFC928" o={gold} id="s5gold" />
      <HeroObject t={t} at={T.kees - 0.22} src={el('trash-bag')} ar={0.931} x={bx} y={by} h={bh} glow={gold > 0.1 ? '#FFC928' : '#8A7DFF'} enter="drop" float={false} sparkles={gold > 0.1 ? 6 : 0} id="c01-bag" />
      {/* gold light glowing out of the bag's neck */}
      <Glow x={bx} y={by - 40} r={160} color="#FFE08A" o={0.8 * gold * (0.85 + 0.15 * Math.sin(t * 5))} id="s5in" />
      {/* the landfill rises over it: strata with rubbish bits, a hole cut around the bag */}
      {rise > 0 && (
        <g mask="url(#c01s5-mask)">
          {STRATA.map((c, i) => (
            <path key={i} d={`M-40 ${top + i * 100 + Math.sin(i * 2.1) * 10} Q 960 ${top + i * 100 - 30 + Math.cos(i) * 20} 1960 ${top + i * 100 + 14} V1200 H-40 Z`} fill={c} stroke="#05030F" strokeWidth={6} />
          ))}
          {Array.from({length: 26}, (_, i) => {
            const x = 60 + rand(i * 7 + 1) * 1800, y = top + 50 + rand(i * 7 + 2) * 600, r = rand(i * 7 + 3) * 360;
            const kind = i % 3;
            return (
              <g key={'b' + i} transform={`translate(${x} ${y}) rotate(${r})`} opacity={0.85}>
                {kind === 0 && <rect x={-22} y={-14} width={44} height={28} rx={4} fill="#8C6A44" stroke="#05030F" strokeWidth={4} />}
                {kind === 1 && <rect x={-10} y={-20} width={20} height={40} rx={8} fill="#7B8496" stroke="#05030F" strokeWidth={4} />}
                {kind === 2 && <circle r={18} fill="#2A2238" stroke="#05030F" strokeWidth={4} />}
              </g>
            );
          })}
          {/* the lit surface edge */}
          <path d={`M-40 ${top + 4} Q 960 ${top - 26} 1960 ${top + 18}`} fill="none" stroke="#9C8CC8" strokeWidth={5} opacity={0.6} />
        </g>
      )}
      {/* the pocket's rim */}
      <g clipPath="url(#c01s5-under)">
        <ellipse cx={bx} cy={by} rx={hole.rx} ry={hole.ry} fill="none" stroke="#05030F" strokeWidth={12} />
        <ellipse cx={bx} cy={by} rx={hole.rx - 8} ry={hole.ry - 8} fill="none" stroke={gold > 0.1 ? '#FFC928' : '#7A6AA8'} strokeWidth={4} opacity={0.5 + 0.4 * gold} />
      </g>
      <RevealRing t={t} at={T.tharwa} x={bx} y={by} r={260} boom={false} />
      <NPill text="مئات الملايين" x={bx} y={300} size={56} kind="gold" id="c01-s5-pill" p={(t - (T.miat - 0.1)) / 0.3} />
    </g>
  );
};

// ==================================================================================================================
// S6 · 13.52 · «رسالة وظيفة على لينكدإن» — the laptop, a job message pops, the camera leans in
const Feed: React.FC = () => (
  <g>
    <rect x={0} y={0} width={1000} height={90} fill="#0E5A8A" />
    <rect x={40} y={28} width={260} height={34} rx={17} fill="#FFFFFF" opacity={0.35} />
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(60 ${140 + i * 160})`}>
        <rect x={0} y={0} width={880} height={130} rx={20} fill="#26306E" />
        <circle cx={820} cy={65} r={40} fill="#3A4690" />
        <rect x={360} y={38} width={400} height={22} rx={11} fill="#5A66B0" />
        <rect x={500} y={76} width={260} height={18} rx={9} fill="#46529A" />
      </g>
    ))}
  </g>
);
export const S6: React.FC<{t: number}> = ({t}) => {
  const cx = 1180, cy = 560;
  const z = moveTo(t, T.wadheefa + 0.05, 1, 1.14, 0.9);
  return (
    <g>
      <NightSky t={t} id="c01s6" />
      <GridFloor id="c01s6f" t={t} />
      <g transform={`translate(${cx} ${cy}) scale(${z}) translate(${-cx} ${-cy})`}>
        <Laptop t={t} at={13.3} x={cx} y={990} w={1180} screen={<Feed />} id="c01-laptop" />
        <MessageCard t={t} at={T.wadheefa - 0.12} x={cx} y={cy - 10} w={860} kind="job" from="مسؤول توظيف" text="فرصة وظيفة" id="c01-job" />
        <NPill text="لينكدإن" x={cx} y={205} size={54} kind="white" id="c01-li" p={(t - (T.linkedin - 0.1)) / 0.3} />
      </g>
    </g>
  );
};

// ==================================================================================================================
// S7 · 15.20 · «فتحت الباب لأكبر سرقة من نوعها في التاريخ» — the card flies into the door, coins pour out, alarm
export const S7: React.FC<{t: number}> = ({t}) => {
  const dx = 1180, dy = 930, dh = 600;
  const doorC: [number, number] = [dx, dy - dh * 0.42];
  // the job card flies into the doorway
  const [cxp, cyp] = move(t, 15.25, [dx, 520], doorC, 0.5);
  const cs = moveTo(t, 15.25, 0.62, 0.08, 0.5);
  const co = 1 - clamp01((t - 15.62) / 0.15);
  // punch-in on «التاريخ»
  const z = moveTo(t, T.tareekh - 0.08, 1, 1.16, 0.45);
  const alarm = t >= T.sariqa ? clamp01((t - T.sariqa) / 0.2) : 0;
  const beam = (t - T.sariqa) * 260;
  cueSfx('coins', 'c01-s7-coins', t >= 16.45 && t < 16.75, dx, {at: 16.45, hit: 0.2});
  return (
    <g>
      <NightSky t={t} id="c01s7" />
      <GridFloor id="c01s7f" t={t} />
      <g transform={`translate(${dx} 640) scale(${z}) translate(${-dx} -640)`}>
        <FateDoor t={t} at={14.9} x={dx} y={dy} h={dh} kind="digital" light="#FFC928" openAt={T.bab - 0.12} id="c01-door" />
        {/* the alarm light beside the door */}
        {alarm > 0 && (
          <g>
            <g transform={`translate(1600 760)`} opacity={alarm}>
              <path d={`M0 -60 L${Math.cos((beam * Math.PI) / 180) * 900} ${-60 + Math.sin((beam * Math.PI) / 180) * 300 - 200} L${Math.cos(((beam + 18) * Math.PI) / 180) * 900} ${-60 + Math.sin(((beam + 18) * Math.PI) / 180) * 300 - 200} Z`} fill="#FF2E4D" opacity={0.18} />
            </g>
            <HeroObject t={t} at={T.sariqa} src={el('alarm-light')} ar={0.861} x={1600} y={740} h={190} glow="#FF2E4D" float={false} sparkles={0} id="c01-alarm" />
          </g>
        )}
        {t < 15.8 && t >= 15.0 && (
          <g transform={`translate(${cxp} ${cyp}) scale(${cs})`} opacity={co}>
            <MessageCard t={t} at={14.0} x={0} y={0} w={860} kind="job" from="مسؤول توظيف" text="فرصة وظيفة" id="c01-job2" />
          </g>
        )}
        {/* ₿ coins pour OUT of the door toward the viewer */}
        {Array.from({length: 18}, (_, i) => {
          const at = 16.42 + i * 0.075;
          if (t < at) return null;
          const tx = dx + (rand(i * 5 + 1) - 0.5) * 1500, ty = 1010 + rand(i * 5 + 2) * 90;
          const d = 0.95;
          const k = clamp01((t - at) / d);
          const [px, py] = move(t, at, doorC, [tx, ty], d, ease.out);
          const arc = -Math.sin(Math.PI * Math.min(1, k * 1.1)) * (180 + rand(i * 5 + 3) * 160);
          const s = moveTo(t, at, 0.3, 1.05 + rand(i * 5 + 4) * 0.35, d, ease.in);
          return (
            <g key={i} transform={`translate(${px} ${py + arc}) rotate(${(t - at) * (200 + rand(i) * 200)}) scale(${s})`} opacity={clamp01(k * 6)}>
              {coinArt('₿')(110)}
            </g>
          );
        })}
      </g>
      {/* red alarm wash on the edges */}
      {alarm > 0 && (
        <g opacity={alarm * (0.55 + 0.25 * Math.sin((t - T.sariqa) * 9))}>
          <defs>
            <radialGradient id="c01s7-red" cx="0.5" cy="0.5" r="0.75">
              <stop offset="0.55" stopColor="#FF2E4D" stopOpacity={0} />
              <stop offset="1" stopColor="#FF2E4D" stopOpacity={0.55} />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={1920} height={1080} fill="url(#c01s7-red)" />
        </g>
      )}
      <Flash t={t} at={T.sariqa} strength={0.28} color="#FF5A6A" />
      <CWords t={t} cx={1180} y={175} size={130} id="c01-s7-w" words={[{w: 'أكبر', at: T.akbar - 0.08}, {w: 'سرقة', at: T.sariqa - 0.08, tone: 'red'}]} />
    </g>
  );
};

// ==================================================================================================================
// S8 · 18.12 · «أكيد بتقول إني أبالغ … بس كل هذا صار فعلًا» — AZTIKA to the viewer; the 4 teasers each get ✔
const TEASERS = [
  {id: 'pen', src: 'fountain-pen', ar: 1.004, h: 170},
  {id: 'pizza', src: 'two-pizzas', ar: 1.548, h: 120},
  {id: 'bag', src: 'trash-bag', ar: 0.931, h: 180},
  {id: 'laptop', src: '', ar: 1, h: 0},
];
const CHECKS = [T.kul, 20.08, T.saar, T.feelan];
export const S8: React.FC<{t: number}> = ({t}) => {
  const base = 836, ph = 140, xs = [1000, 760, 520, 280]; // right → left (the order they were told)
  const doubtOut = T.bas - 0.15;
  return (
    <g>
      <NightSky t={t} id="c01s8" />
      <GridFloor id="c01s8f" t={t} />
      <CWords t={t} cx={640} y={250} size={130} id="c01-s8-a" out={doubtOut} words={[{w: 'أبالغ؟', at: T.ubalegh - 0.1}]} />
      <CWords t={t} cx={640} y={250} size={130} id="c01-s8-b" words={[{w: 'صار', at: T.saar - 0.08}, {w: 'فعلًا!', at: T.feelan - 0.08, tone: 'green'}]} />
      {TEASERS.map((o, i) => {
        const at = T.bas + i * 0.1;
        const x = xs[i];
        const top = base - ph * ease.out(clamp01((t - at) / 0.5));
        const oy = top - 105;
        const ck = CHECKS[i];
        const mq = pop(t, ck);
        cueSfx('ding', `c01-s8-ck-${i}`, t >= ck && t < ck + 0.3, x, {at: ck, hit: 0.125, gain: 0.8});
        return (
          <g key={o.id}>
            <Podium x={x} base={base} w={200} h={ph} grow={(t - at) / 0.5} id={`c01-s8-p${i}`} color="green" />
            {o.src ? (
              <HeroObject t={t} at={at + 0.15} src={el(o.src)} ar={o.ar} x={x} y={oy} h={o.h} glow="#FFC928" sparkles={2} id={`c01-s8-o${i}`} />
            ) : (
              <Laptop t={t} at={at + 0.15} x={x} y={top - 12} w={230} id="c01-s8-lap" />
            )}
            {mq.o > 0 && (
              <g transform={`translate(${x + 78} ${oy - 70}) scale(${mq.s})`} opacity={mq.o}>
                <Mark kind="check" x={0} y={0} r={38} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

// ==================================================================================================================
// S9 · 21.02 · ★ «واليوم بنطلع درجة درجة، من أرخص غلطة لين نوصل لأغلى» — the empty staircase, the summit «؟» ignites
// Geometry = StairGame's (stepW 250, stepH 62, h0 110, Arabic: rising RIGHT → LEFT from x 1660) with the video's 9 steps
// (8 mistakes + the summit), so this shot dissolves into the full board once board.json holds every entry.
const N_STEPS = 9, STEP_W = 250;
const stepX = (i: number) => 1660 - i * STEP_W;
const stepH = (i: number) => 110 + i * 62 + (i === N_STEPS - 1 ? 37 : 0);
const SIL: Record<number, {src: string; ar: number; h: number} | 'laptop'> = {
  0: {src: 'fountain-pen', ar: 1.004, h: 170}, // Mariner (the line)
  1: {src: 'trash-bag', ar: 0.931, h: 180}, // Howells (the bag)
  2: {src: 'two-pizzas', ar: 1.548, h: 115}, // the pizza
  4: 'laptop', // the Binance message
};
type Cam = {cx: number; cy: number; z: number; sx: number; sy: number};
const CAM_WIDE: Cam = {cx: 560, cy: 836, z: 0.8, sx: 960, sy: 836};
const CAM_STEP1: Cam = {cx: 1540, cy: 660, z: 1.38, sx: 1080, sy: 600};
const CAM_TOP: Cam = {cx: -300, cy: 250, z: 1.12, sx: 1000, sy: 520};
const CLIMB = 23.5;
const camOf = (t: number): Cam => {
  const seg = (a: Cam, b: Cam, at: number, dur: number): Cam => {
    const [cx, cy] = move(t, at, [a.cx, a.cy], [b.cx, b.cy], dur);
    const [sx, sy] = move(t, at, [a.sx, a.sy], [b.sx, b.sy], dur);
    return {cx, cy, sx, sy, z: moveTo(t, at, a.z, b.z, dur)};
  };
  const c = t < T.daraja - 0.1 ? CAM_WIDE : t < CLIMB ? seg(CAM_WIDE, CAM_STEP1, T.daraja - 0.1, 0.75) : seg(CAM_STEP1, CAM_TOP, CLIMB, 1.15);
  return {...c, z: c.z * (1 + 0.004 * Math.max(0, t - T.wel))};
};
const litAt = (i: number) => (i === 0 ? T.daraja : i === 1 ? T.daraja2 : CLIMB + 0.1 + (i - 1) * 0.12);
export const S9: React.FC<{t: number}> = ({t}) => {
  const base = 836;
  const c = camOf(t);
  const scr = (x: number, y: number): [number, number] => [c.sx + (x - c.cx) * c.z, c.sy + (y - c.cy) * c.z];
  const sI = N_STEPS - 1, sx = stepX(sI);
  const sGrow = ease.out(clamp01((t - 21.12) / 0.5));
  const sTop = base - stepH(sI) * sGrow;
  const qY = sTop - 125 + Math.sin(t * 2) * 6;
  const [rx, ry] = scr(sx, qY);
  const lit = t >= T.ntla ? ease.out(clamp01((t - T.ntla) / 0.4)) : 0;
  const q = pop(t, T.ntla);
  return (
    <g>
      <NightSky t={t} id="c01s9" horizonY={Math.max(300, Math.min(1400, c.sy + (base - c.cy) * c.z))} />
      {lit > 0 && (
        <g opacity={0.6 * lit}>
          <Rays t={t} id="c01s9r" x={rx} y={ry} tone="gold" />
        </g>
      )}
      <Bokeh t={t} n={18} seed={9} />
      <g transform={`translate(${c.sx} ${c.sy}) scale(${c.z}) translate(${-c.cx} ${-c.cy})`}>
        <GridFloor id="c01s9f" t={t} wide />
        {/* the empty steps rise one by one, right → left; dark until the camera climbs past them */}
        {Array.from({length: N_STEPS - 1}, (_, i) => {
          const at = T.wel - 0.25 + i * 0.045;
          const L = clamp01((t - litAt(i)) / 0.3);
          cueSfx('tick', `c01-s9-lit-${i}`, t >= litAt(i) && t < litAt(i) + 0.2, scr(stepX(i), 700)[0], {at: litAt(i), hit: 0.05, gain: 0.8});
          return (
            <g key={i} style={{filter: `brightness(${lerp(0.38, 1, L)}) saturate(${lerp(0.4, 1, L)})`}}>
              <Podium x={stepX(i)} base={base} w={STEP_W - 18} h={stepH(i)} grow={(t - at) / 0.5} id={`c01-s9-st${i}`} color="green" />
            </g>
          );
        })}
        {/* the four teasers as dark silhouettes, waiting over their empty steps */}
        {Object.entries(SIL).map(([k, v], j) => {
          const i = Number(k);
          const at = T.wel + 0.05 + j * 0.1;
          const pq = pop(t, at);
          const top = base - stepH(i);
          const y = top - 125 + Math.sin(t * 1.8 + i) * 7;
          return (
            <g key={'s' + i} transform={`translate(${stepX(i)} ${y}) scale(${pq.s})`} opacity={pq.o}>
              {v === 'laptop' ? (
                <g style={{filter: 'brightness(0) drop-shadow(0 0 16px rgba(170,120,255,0.75))'}}>
                  <Laptop t={t} at={20} x={0} y={70} w={220} id="c01-s9-lap" />
                </g>
              ) : (
                <Art src={el(v.src)} ar={v.ar} h={v.h} sil />
              )}
            </g>
          );
        })}
        {/* the summit: gold, its «؟» ignites on «بنطلع» */}
        <Podium x={sx} base={base} w={STEP_W - 18} h={stepH(sI)} grow={(t - 21.12) / 0.5} id="c01-s9-summit" color="gold" />
        <Glow x={sx} y={qY} r={260} color="#FFC928" o={0.75 * lit} id="s9q" />
        {q.o > 0 && (
          <g transform={`translate(${sx} ${qY}) scale(${q.s})`} opacity={q.o}>
            <GlowText text="؟" x={0} y={0} size={210} tone="gold" id="c01-s9-q" />
          </g>
        )}
        <RevealRing t={t} at={T.ntla} x={sx} y={qY} r={280} tail />
        {[0, 1, 2, 3, 4].map((i) => lit > 0 && <Sparkle key={i} x={sx + Math.cos(i * 1.26 + t * 0.4) * 190} y={qY + Math.sin(i * 1.26 + t * 0.4) * 130} r={12 + 6 * Math.sin(t * 3 + i)} o={lit * (0.6 + 0.4 * Math.sin(t * 2.4 + i))} color="#FFE08A" />)}
        <NPill text="أرخص" x={stepX(0)} y={base - 58} size={52} kind="grey" id="c01-s9-cheap" p={(t - (T.arkhas - 0.1)) / 0.3} />
      </g>
    </g>
  );
};

// ==================================================================================================================
// S12 · 29.50 · «سعرها أصغر رقم بتسمعه في الفيديو كله» — big numbers orbit, a tiny «؟ $» shrinks under the lens
const BIG = ['150 مليون $', '785 مليون', 'مئات الملايين'];
export const S12: React.FC<{t: number}> = ({t}) => {
  const cx = 1240, cy = 500;
  const spread = moveTo(t, T.video - 0.1, 1, 1.12, 0.6);
  const grow = moveTo(t, T.asghar, 1, 1.12, 0.6);
  const [tx, ty] = move(t, T.asghar - 0.05, [cx, 120], [cx, cy], 0.45);
  const tiny = moveTo(t, T.asghar + 0.35, 1, 0.66, 0.6);
  return (
    <g>
      <NightSky t={t} id="c01s12" />
      <GridFloor id="c01s12f" t={t} />
      <Bokeh t={t} n={20} seed={12} />
      {BIG.map((s, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3 + 0.22 * (t - 29.3);
        const x = cx + Math.cos(a) * 470 * spread, y = cy + Math.sin(a) * 230 * spread;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${grow})`}>
            <NPill text={s} x={0} y={0} size={62} kind="gold" id={`c01-s12-b${i}`} p={(t - (29.25 + i * 0.08)) / 0.3} />
          </g>
        );
      })}
      {t >= T.asghar - 0.05 && t < T.raqam + 0.1 && (
        <g transform={`translate(${tx} ${ty}) scale(${tiny})`}>
          <NPill text="؟ $" x={0} y={0} size={56} kind="dark" id="c01-s12-tiny" p={1} />
        </g>
      )}
      <Magnifier t={t} at={T.raqam - 0.08} x={cx} y={cy} r={150} id="c01-s12-mag">
        <GlowText text="؟ $" x={0} y={0} size={110} tone="gold" id="c01-s12-mz" />
      </Magnifier>
    </g>
  );
};

// ==================================================================================================================
// S13 · 31.70 · «مو بعيدة عنا أبدًا، صارت في أرض عربية» — the neon map glides closer; the whole Arab region turns gold
const ARAB = ['Morocco', 'W. Sahara', 'Algeria', 'Tunisia', 'Libya', 'Egypt', 'Sudan', 'Mauritania', 'Somalia', 'Somaliland', 'Djibouti', 'Saudi Arabia', 'Yemen', 'Oman', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Iraq', 'Syria', 'Jordan', 'Lebanon', 'Palestine', 'Israel'];
const NEAR = ['Turkey', 'Iran', 'Cyprus', 'Greece', 'Italy', 'Spain', 'Portugal', 'France', 'Mali', 'Niger', 'Chad', 'Ethiopia', 'Eritrea', 'S. Sudan', 'Central African Rep.', 'Kenya', 'Senegal', 'Afghanistan', 'Pakistan', 'Turkmenistan', 'Armenia', 'Azerbaijan', 'Georgia', 'Burkina Faso', 'Nigeria', 'Cameroon', 'Uganda', 'Guinea', 'Gambia', 'Bulgaria', 'Albania', 'Macedonia', 'Uzbekistan'];
const MAP_REGION: [[number, number], [number, number]] = [[-19, 3], [63, 41]];
export const S13: React.FC<{t: number}> = ({t}) => {
  const proj = nightProj(MAP_REGION);
  const [fx, fy] = proj(24, 24);
  const z = moveTo(t, T.mo - 0.1, 1, 1.24, 1.1);
  const rays = t >= T.ard ? ease.out(clamp01((t - T.ard) / 0.5)) : 0;
  const pq = pop(t, T.arabia);
  const pinY = fy - 120 + Math.sin(t * 2.2) * 8;
  const pill1 = 1 - clamp01((t - (T.ard - 0.2)) / 0.2);
  return (
    <g>
      <NightSky t={t} id="c01s13" stars={90} />
      {rays > 0 && (
        <g opacity={0.7 * rays}>
          <Rays t={t} id="c01s13r" x={960} y={540 + 30 * z} tone="orange" />
        </g>
      )}
      <g transform={`translate(960 540) scale(${z}) translate(${-fx} ${-fy + 30})`}>
        <NightMap t={t} region={MAP_REGION} mode="neon" neon="#4C6BFF" id="c01-map" areas={[
          {countries: NEAR, fill: '#0B0F2E', outline: '#2E3C8A'},
          {countries: ARAB, fill: '#171E58'},
          {countries: ARAB, fill: '#E2B45C', at: T.ard - 0.05, spread: [24, 24], dur: 0.9, outline: '#FFE08A'},
        ]} />
        <Glow x={fx} y={fy} r={420} color="#FFC928" o={0.35 * rays} id="s13g" />
        {pq.o > 0 && (
          <g transform={`translate(${fx} ${pinY}) scale(${pq.s})`} opacity={pq.o}>
            <line x1={0} y1={40} x2={0} y2={118} stroke="#05030F" strokeWidth={12} strokeLinecap="round" />
            <line x1={0} y1={40} x2={0} y2={116} stroke="#FFC928" strokeWidth={6} strokeLinecap="round" />
            <circle cx={0} cy={0} r={62} fill="#1A1040" stroke="#05030F" strokeWidth={10} />
            <circle cx={0} cy={0} r={56} fill="none" stroke="#FFC928" strokeWidth={6} />
            <GlowText text="؟" x={0} y={4} size={86} tone="gold" id="c01-s13-q" />
          </g>
        )}
      </g>
      <RevealRing t={t} at={T.arabia} x={960} y={540 + z * (pinY - fy + 30)} r={200} boom={false} />
      {pill1 > 0 && <g opacity={pill1}><NPill text="مو بعيدة عنا" x={1180} y={150} size={56} kind="white" id="c01-s13-p1" p={(t - (T.mo - 0.1)) / 0.3} /></g>}
      <NPill text="أرض عربية" x={1180} y={150} size={62} kind="gold" id="c01-s13-p2" p={(t - (T.ard - 0.05)) / 0.3} />
    </g>
  );
};

// ==================================================================================================================
// S14 · 35.00 · «وفاتورتها دفعها ناس ما كانوا حتى موجودين وقتها» — the bill drifts to a row of ghost people
const GHOSTS = [
  {x: 1460, s: 1.05}, {x: 1290, s: 0.92}, {x: 1120, s: 0.72}, {x: 950, s: 1.0}, {x: 780, s: 0.88},
];
const Ghost: React.FC<{x: number; y: number; s: number; o: number}> = ({x, y, s, o}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <ellipse cx={0} cy={4} rx={95} ry={16} fill="#9FB4FF" opacity={0.18} />
    <path d="M-100 0 V-150 Q-100 -238 0 -238 Q100 -238 100 -150 V0 Z" fill="#B9C6FF" fillOpacity={0.1} stroke="#9FB4FF" strokeWidth={18} strokeOpacity={0.18} />
    <path d="M-100 0 V-150 Q-100 -238 0 -238 Q100 -238 100 -150 V0 Z" fill="none" stroke="#E4E9FF" strokeWidth={6} strokeDasharray="20 13" strokeLinejoin="round" />
    <circle cx={0} cy={-310} r={60} fill="#B9C6FF" fillOpacity={0.1} stroke="#9FB4FF" strokeWidth={18} strokeOpacity={0.18} />
    <circle cx={0} cy={-310} r={60} fill="none" stroke="#E4E9FF" strokeWidth={6} strokeDasharray="20 13" />
  </g>
);
export const S14: React.FC<{t: number}> = ({t}) => {
  const base = 880;
  return (
    <g>
      <NightSky t={t} id="c01s14" />
      <GridFloor id="c01s14f" t={t} />
      <Bokeh t={t} n={16} seed={14} color="#9FB4FF" />
      {/* a cold light falls from the bill onto the row */}
      <Glow x={1120} y={760} r={560} color="#7F95FF" o={0.28 * clamp01((t - T.nas) / 0.6)} id="s14l" />
      {GHOSTS.map((g, i) => {
        const at = T.nas - 0.05 + i * 0.12;
        let o = ease.out(clamp01((t - at) / 0.4));
        if (t >= T.mawjoodeen) o *= 0.45 + 0.55 * clamp01(0.5 + 0.9 * noise1((t - T.mawjoodeen) * 7, i * 13 + 2));
        cueSfx('swish', `c01-s14-g${i}`, t >= at && t < at + 0.3, g.x, {at, hit: 0.15, gain: 0.5});
        return o > 0.01 ? <Ghost key={i} x={g.x} y={base + (1 - o) * 30} s={g.s} o={o * 0.95} /> : null;
      })}
      <MistakeBill
        t={t} at={34.6} x={1600} y={500} s={0.8} id="c01-bill14" title="الفاتورة" rows={[]}
        total={{label: 'المجموع', value: '؟', tone: 'red', at: T.fatoora + 0.05}}
        fly={{at: 35.45, x: 1120, y: 290, s: 0.62, dur: 1.6}}
      />
    </g>
  );
};
