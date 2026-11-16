// Custom shots for C06 (builder-owned, AZTIKA). Each: export const S<n>: React.FC<{t: number}> returning the shot's WORLD
// (SVG, no <Stage>/<NightScreen> — the chapter provides them; NightShots joins, drifts and pins the host).
// C06 · Binance — a fake job interview opens the door to 6.3 مليار. Palette: purple → cold cyan screens → red danger →
// icy cyan → gold warning. Screen coordinates (NightScreen: no mirroring).
import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp01, ease, lerp, noise1, popRef, pressIn, rand} from '../../../kit/anim';
import {lb, uid} from '../../../kit/stage';
import {W, H} from '../../../kit/theme';
import {GlowText, GridFloor, NightSky, NPill, RevealRing, Sparkle} from '../../../kit/night';
import {Bokeh, CountNumber, Flash, Mark, Rays} from '../../../kit/night-fx';
import {ScienceWorld, StoryPerson, HoloRing, StoryPropIcon} from '../../../kit/night-worlds';
import {MarkPill} from '../../../kit/night-data';
import {Spotlight} from '../../../kit/night-story';
import {NightMap, nightProj} from '../../../kit/night-maps';
import {AlertBanner, DownloadBar, Laptop, MessageCard, Phone, TransferScreen, VideoCall} from '../../../kit/night-ui';
import {move, moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {FateDoor} from '../shared';
import {OUT, popAt} from '../shared/util';

const SLUG = 'ar-costly-mistakes';
const T = {
  s2: 304.78, strike: 305.15, interview: 306.92, // «وما احتاجت تحويل غلط. احتاجت مقابلة وظيفية»
  s4: 310.38, binance: 312.58, akbar: 313.04, platform: 313.64, // «مهندس برمجيات يشتغل في بينانس، أكبر منصة عملات رقمية»
  s5: 315.4, msg: 315.72, tawzif: 316.94, mudir: 318.42, // «يجيه تواصل على منصة توظيف … مدير مشروع»
  s6: 319.64, call1: 319.92, ula: 320.72, // «مقابلة أولى مع موظف موارد بشرية»
  s7: 322.38, thania: 323.58, ceo: 324.12, company: 325.04, // «مقابلة ثانية مع الرئيس التنفيذي للشركة»
  s8: 325.6, kul: 325.84, rasmi: 326.66, muhtaram: 327.18, // «كل شيء يبين رسمي ومحترم»
  s9: 327.72, ask: 328.6, dl: 329.32, normal: 333.02, // «يطلبون منه يحمّل ملف … زي أي اختبار توظيف عادي»
  s10: 333.36, sharika: 334.12, mawjuda: 334.96, rais: 336.05, notCeo: 337.04, notTask: 338.6, // «الشركة ما كانت موجودة … مو رئيس … مو مهمة»
  s11: 339.16, door: 339.8, file: 340.18, said: 341.32, // «كان هذا هو الباب. وحسب كلام بينانس»
  s12: 342.24, korean: 343.26, kpill: 343.76, gather: 344.42, // «المهاجمين كوريين شماليين، وجمعوا معلومات»
  s13: 345.28, khata: 345.92, eng2: 346.72, dl2: 347.64, fake: 348.42, ad: 350.22, // «خطأ ثاني لمهندس ثاني حمّل نسخة مزيفة … من إعلان»
  s14: 351.38, reach: 351.98, open: 352.58, hours: 354.17, // «وصلوا للمحافظ، وخلال ساعات»
  s15: 355.12, land: 356.46, // «سحبوا حوالي 6.3 مليار»
  s17: 362.42, line: 363.89, person: 364.78, dream: 366.66, dreamPill: 367.04, // «من ملف حمّله شخص … وظيفة أحلامه»
  s18: 367.56, back: 368.58, count: 369.54, freeze: 370.86, stolen: 372.06, // «تسترجع حوالي 2.5 مليار بعد ما تجمّدت … المسروقة»
  s19: 372.64, shield: 373.56, safe: 374.48, probe: 374.96, ongoing: 376.22, // «أموال العملاء بأمان، والتحقيق للحين مستمر»
  s20: 376.66, staff: 377.64, notPublic: 380.1, banned: 380.98, linkedin: 383.08, // «مو واجهة للعامة ممنوعين … لينكدإن»
  s21: 383.48, q: 384.2, viol: 385.56, orNot: 386.12, // «وما قالت إذا هذا المهندس كان مخالف ولا لا»
  s22: 386.44, offer: 388.1, tooGood: 389.16, download: 390.86, think: 391.44, end: 392.8, // «عرض وظيفة أحلى من اللازم … تحمّل شيء، فكّر مرتين»
};

const GOLD = '#FFC928', CYAN = '#5CF2FF', RED = '#FD4B5B', GREEN = '#22C55E';
const art = (name: string) => `${SLUG}/el/${name}.png`;
const AR: Record<string, number> = {'crypto-vault': 1, 'malware-file': 0.766, 'server-tower': 0.722, magnifier: 1.02, 'bitcoin-coin': 0.981, 'bitcoin-pile': 1.391};
const pp = (t: number, at: number) => (t - at) / 0.3; // NPill pop progress

// ---------------------------------------------------------------- local helpers
/** a generated image, centred at x,y (h tall), optional glow — layerable + movable */
const Pic: React.FC<{name: string; x: number; y: number; h: number; o?: number; s?: number; sx?: number; rot?: number; glow?: string; id: string; tint?: string}> = ({name, x, y, h, o = 1, s = 1, sx = 1, rot = 0, glow, id, tint}) => {
  if (o <= 0.001 || s <= 0.001) return null;
  const w = h * (AR[name] ?? 1);
  const filt = [glow ? `drop-shadow(0 0 10px ${glow}) drop-shadow(0 0 30px ${glow}aa)` : 'drop-shadow(0 10px 8px rgba(0,0,0,0.45))', tint ?? ''].join(' ');
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * sx} ${s})`} opacity={o} {...lb('object', id)}>
      <foreignObject x={-w / 2 - 50} y={-h / 2 - 50} width={w + 100} height={h + 100}>
        <div style={{position: 'relative', width: w + 100, height: h + 100}}>
          <Img src={staticFile(art(name))} style={{position: 'absolute', left: 50, top: 50, width: w, height: h, filter: filt}} />
        </div>
      </foreignObject>
    </g>
  );
};

/** soft radial light */
const Glow: React.FC<{x: number; y: number; r: number; color: string; o?: number; id: string; ry?: number}> = ({x, y, r, color, o = 1, id, ry}) => {
  const g = uid('c6glow', id);
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
      <ellipse cx={x} cy={y} rx={r} ry={ry ?? r} fill={`url(#${g})`} />
    </g>
  );
};

/** pop wrapper (the reference pop) around a point */
const Pop: React.FC<{t: number; at: number; x: number; y: number; children: React.ReactNode; out?: number}> = ({t, at, x, y, children, out}) => {
  const q = popAt(t, at);
  const fo = out === undefined ? 1 : 1 - clamp01((t - out) / 0.25);
  if (q.o * fo <= 0.001) return null;
  return <g transform={`translate(${x} ${y}) scale(${q.s}) translate(${-x} ${-y})`} opacity={q.o * fo}>{children}</g>;
};

/** a small camera shake after each hit time (decays in 0.3 s) */
const shakeAt = (t: number, times: number[], amp = 10): [number, number] => {
  let dx = 0, dy = 0;
  for (const a of times) {
    const u = (t - a) / 0.3;
    if (u > 0 && u < 1) {
      const k = (1 - u) * (1 - u) * amp;
      dx += noise1(t * 38, a) * k;
      dy += noise1(t * 38 + 17, a) * k;
    }
  }
  return [dx, dy];
};

/** RGB-split + sliced glitch of its children (on = 0..1 intensity); deterministic per 1/30 s step */
const Glitchy: React.FC<{t: number; on: number; seed: number; id: string; box: [number, number, number, number]; children: React.ReactNode}> = ({t, on, seed, id, box, children}) => {
  if (on <= 0.02) return <>{children}</>;
  const g = uid('c6gl', id);
  const [bx, by, bw, bh] = box;
  const n = 7;
  const fr = Math.floor(t * 30);
  return (
    <g>
      <defs>
        <filter id={g + 'r'}><feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.85 0" /></filter>
        <filter id={g + 'c'}><feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.85 0" /></filter>
        {Array.from({length: n}, (_, i) => (
          <clipPath key={i} id={`${g}s${i}`}><rect x={bx - 300} y={by + (bh * i) / n} width={bw + 600} height={bh / n + 1} /></clipPath>
        ))}
      </defs>
      <g transform={`translate(${-16 * on} 0)`} filter={`url(#${g}r)`} opacity={0.9}>{children}</g>
      <g transform={`translate(${16 * on} 0)`} filter={`url(#${g}c)`} opacity={0.9}>{children}</g>
      {Array.from({length: n}, (_, i) => {
        const big = rand(seed * 31 + i * 7 + fr * 3) > 0.55 ? 1 : 0.15;
        const dx = (rand(seed * 100 + i * 13 + fr) - 0.5) * 2 * 46 * on * big;
        return <g key={i} clipPath={`url(#${g}s${i})`} transform={`translate(${dx} 0)`}>{children}</g>;
      })}
    </g>
  );
};

/** glitch intensity: a burst at `a` (decays over d) */
const burst = (t: number, a: number, d = 0.45) => (t < a ? 0 : Math.max(0, 1 - (t - a) / d)) * (0.6 + 0.4 * Math.abs(Math.sin(t * 47)));

/** the cold room of the engineers: dark blue wall, a big window on the night city, a floor, cyan dust */
const ColdRoom: React.FC<{t: number; id: string; win?: [number, number, number, number]; inWindow?: React.ReactNode; tone?: string}> = ({t, id, win = [1080, 96, 740, 560], inWindow, tone = CYAN}) => {
  const g = uid('c6room', id);
  const [wx, wy, ww, wh] = win;
  return (
    <g>
      <defs>
        <linearGradient id={g + 'w'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141E58" />
          <stop offset="1" stopColor="#070B26" />
        </linearGradient>
        <linearGradient id={g + 's'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A1240" />
          <stop offset="1" stopColor="#24308A" />
        </linearGradient>
        <clipPath id={g + 'c'}><rect x={wx} y={wy} width={ww} height={wh} rx={22} /></clipPath>
      </defs>
      <rect x={-40} y={-40} width={W + 80} height={H + 80} fill={`url(#${g}w)`} />
      {/* window on the night city */}
      <rect x={wx - 14} y={wy - 14} width={ww + 28} height={wh + 28} rx={30} fill="#0B0F2E" stroke={OUT} strokeWidth={10} />
      <g clipPath={`url(#${g}c)`}>
        <rect x={wx} y={wy} width={ww} height={wh} fill={`url(#${g}s)`} />
        {Array.from({length: 18}, (_, i) => (
          <Sparkle key={i} x={wx + rand(i * 3.1) * ww} y={wy + rand(i * 7.7) * wh * 0.5} r={3 + rand(i) * 4} o={0.35 + 0.5 * Math.abs(Math.sin(t * 1.3 + i))} />
        ))}
        {Array.from({length: 11}, (_, i) => {
          const bw2 = 60 + rand(i * 2.3) * 70, bh2 = 120 + rand(i * 5.1) * 230, bx2 = wx + i * (ww / 10) - 30;
          return (
            <g key={i}>
              <rect x={bx2} y={wy + wh - bh2} width={bw2} height={bh2} fill="#121A4C" stroke="#0A0E2A" strokeWidth={4} />
              {Array.from({length: 4}, (_, j) => (
                <rect key={j} x={bx2 + 12 + (j % 2) * 26} y={wy + wh - bh2 + 20 + Math.floor(j / 2) * 40} width={12} height={16} fill={tone} opacity={rand(i * 9 + j) > 0.45 ? 0.55 : 0.12} />
              ))}
            </g>
          );
        })}
        {inWindow}
        <polygon points={`${wx},${wy} ${wx + ww * 0.3},${wy} ${wx + ww * 0.12},${wy + wh} ${wx},${wy + wh}`} fill="#FFFFFF" opacity={0.05} />
      </g>
      <rect x={wx + ww / 2 - 6} y={wy} width={12} height={wh} fill="#0B0F2E" stroke={OUT} strokeWidth={4} />
      {/* floor */}
      <rect x={-40} y={880} width={W + 80} height={260} fill="#080B24" />
      <rect x={-40} y={876} width={W + 80} height={8} fill={tone} opacity={0.18} />
      <Bokeh t={t} n={12} color={tone} seed={7} />
    </g>
  );
};

/** a desk with a thick outline (top at y) */
const Desk: React.FC<{x1: number; x2: number; y: number}> = ({x1, x2, y}) => (
  <g>
    <rect x={x1 + 30} y={y + 30} width={22} height={200} fill="#1A1640" stroke={OUT} strokeWidth={6} />
    <rect x={x2 - 52} y={y + 30} width={22} height={200} fill="#1A1640" stroke={OUT} strokeWidth={6} />
    <rect x={x1 + 20} y={y + 30} width={x2 - x1 - 40} height={260} fill="#211C4C" stroke={OUT} strokeWidth={7} />
    <rect x={x1 + 20} y={y + 40} width={x2 - x1 - 40} height={10} fill="#000000" opacity={0.25} />
    <rect x={x1} y={y} width={x2 - x1} height={44} rx={10} fill="#3A3370" stroke={OUT} strokeWidth={8} />
    <rect x={x1 + 14} y={y + 6} width={x2 - x1 - 28} height={7} rx={3} fill="#FFFFFF" opacity={0.25} />
  </g>
);

// The laptop of the story, pushed in until its screen fills the frame. k = 0 (whole laptop) → 1 (screen = 1600 × 1000).
// Local screen units (1000 × 625) map to screen px × 1.6 with the top-left at (160, 40) when k = 1.
const LAP_SCY = 693, LAP_Z = 2.276;
const LapZoom: React.FC<{t: number; at: number; k: number; screen: React.ReactNode; id: string; glow?: string}> = ({t, at, k, screen, id, glow}) => {
  const z = lerp(1, LAP_Z, k), cy = lerp(LAP_SCY, 540, k);
  return (
    <g transform={`translate(960 ${cy}) scale(${z}) translate(-960 ${-LAP_SCY})`}>
      <Laptop t={t} at={at} x={960} y={1000} w={900} screen={screen} glow={glow} id={id} />
    </g>
  );
};
/** app header strip inside the laptop screen (local units) */
const AppBar: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <g>
    <rect x={0} y={0} width={1000} height={78} fill="#1A1850" />
    <rect x={0} y={76} width={1000} height={4} fill={CYAN} opacity={0.4} />
    {[0, 1, 2].map((i) => <circle key={i} cx={950 - i * 30} cy={39} r={9} fill={['#FD4B5B', '#FCC018', '#22C55E'][i]} stroke={OUT} strokeWidth={3} />)}
    {children}
  </g>
);

const coin = (t: number, x: number, y: number, h: number, id: string, o = 1, rot = 0, tint?: string) => (
  <Pic key={id} name="bitcoin-coin" x={x} y={y} h={h} o={o} rot={rot} id={id} tint={tint} />
);

// ---------------------------------------------------------------- S2
// S2 · 304.78 · «وما احتاجت تحويل غلط. احتاجت مقابلة وظيفية» — the wrong transfer is struck, a job interview takes its place
const InterviewSet: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  const chair = (cx: number, flip: number) => (
    <g transform={`translate(${cx} ${y}) scale(${flip} 1)`}>
      <rect x={-70} y={-240} width={34} height={190} rx={14} fill="#4A3A9A" stroke={OUT} strokeWidth={8} />
      <rect x={-80} y={-70} width={150} height={36} rx={12} fill="#5B48B8" stroke={OUT} strokeWidth={8} />
      <rect x={-6} y={-36} width={14} height={60} fill="#2A2458" stroke={OUT} strokeWidth={5} />
      <path d="M-60 34 L66 34" stroke={OUT} strokeWidth={14} strokeLinecap="round" />
      <path d="M-60 34 L66 34" stroke="#8C84C8" strokeWidth={6} strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      <Glow x={x} y={y - 40} r={420} ry={160} color={GOLD} o={0.35} id="s2pool" />
      {chair(x - 230, 1)}
      {chair(x + 230, -1)}
      {/* small table + briefcase */}
      <rect x={x - 70} y={y - 120} width={140} height={22} rx={8} fill="#3A3370" stroke={OUT} strokeWidth={7} />
      <rect x={x - 8} y={y - 100} width={16} height={130} fill="#2A2458" stroke={OUT} strokeWidth={5} />
      <g transform={`translate(${x} ${y - 124 + Math.sin(t * 2) * 2})`}>
        <rect x={-18} y={-92} width={36} height={22} rx={8} fill="none" stroke={OUT} strokeWidth={14} />
        <rect x={-18} y={-92} width={36} height={22} rx={8} fill="none" stroke="#7A4A22" strokeWidth={6} />
        <rect x={-62} y={-74} width={124} height={74} rx={12} fill="#9A5C2A" stroke={OUT} strokeWidth={8} />
        <rect x={-62} y={-48} width={124} height={8} fill="#5A3416" />
        <rect x={-10} y={-54} width={20} height={18} rx={4} fill={GOLD} stroke={OUT} strokeWidth={4} />
      </g>
    </g>
  );
};

export const S2: React.FC<{t: number}> = ({t}) => {
  const X = 1200;
  const strikeQ = pressIn((t - T.strike) / 0.165);
  const swap = T.interview - 0.3;
  return (
    <g>
      <NightSky t={t} id="c6s2" />
      <GridFloor t={t} id="c6s2f" />
      {t >= T.interview - 0.05 && <Rays t={t} id="c6s2r" x={X} y={430} tone="gold" n={18} spin={3} />}
      {/* the old mistake: a transfer */}
      <TransferScreen t={t} at={T.s2} x={X} y={520} s={0.72} from="سيتي بنك" to="المقرضين" amount="894 مليون $" press={400} id="c6s2tr" out={swap} />
      {t < swap + 0.3 && (
        <g opacity={1 - clamp01((t - swap) / 0.25)}>
          <NPill text="تحويل غلط" x={X} y={150} size={52} kind="white" id="c6s2p" p={pp(t, T.s2 + 0.1)} />
          {t >= T.strike && (
            <g>
              <path d={`M${X - 170} 158 L${lerp(X - 170, X + 170, ease.out(clamp01((t - T.strike) / 0.2)))} 142`} stroke={RED} strokeWidth={12} strokeLinecap="round" />
              <g transform={`translate(${X} 520) scale(${strikeQ.s})`} opacity={strikeQ.o}>
                <Mark kind="cross" x={0} y={0} r={110} />
              </g>
            </g>
          )}
        </g>
      )}
      {/* the new one: a job interview */}
      <Pop t={t} at={T.interview} x={X} y={760}>
        <InterviewSet t={t} x={X} y={820} />
      </Pop>
      <Pop t={t} at={T.interview + 0.08} x={X} y={300}>
        <GlowText text="مقابلة وظيفية" x={X} y={300} size={120} tone="gold" id="c6s2t" />
      </Pop>
    </g>
  );
};

// ---------------------------------------------------------------- S4
// S4 · 310.38 · «مهندس برمجيات يشتغل في بينانس، أكبر منصة عملات رقمية في العالم»
export const S4: React.FC<{t: number}> = ({t}) => {
  const grow = moveTo(t, T.akbar, 1, 1.16, 0.5);
  const push = moveTo(t, T.s4, 1, 1.06, 5);
  const TX = 1460, TY = 420;
  const coins = [0, 1, 2].map((i) => {
    const a = t * 1.4 + (i * Math.PI * 2) / 3;
    const depth = Math.sin(a);
    return {x: TX + Math.cos(a) * 270 * grow, y: TY - 40 + depth * 60, s: 0.8 + 0.25 * depth, front: depth > 0, i};
  });
  const coinP = popAt(t, T.binance - 0.1);
  const drawCoins = (front: boolean) => coins.filter((c) => c.front === front).map((c) => coin(t, c.x, c.y, 96 * c.s * coinP.s, `c6s4c${c.i}`, coinP.o));
  cueSfx('pop', 'c6s4-coins', t >= T.binance - 0.1 && t < T.binance + 0.2, TX, {at: T.binance - 0.1, hit: 0.125});
  const tower = (
    <g>
      <Glow x={TX} y={TY} r={330 * grow} color={CYAN} o={0.7} id="c6s4tg" />
      {drawCoins(false)}
      <Pic name="server-tower" x={TX} y={TY + 40 - 30 * (grow - 1)} h={430 * grow} glow={CYAN} id="c6s4tower" />
      {drawCoins(true)}
    </g>
  );
  return (
    <g transform={`translate(960 600) scale(${push}) translate(-960 -600)`}>
      <ColdRoom t={t} id="c6s4" inWindow={tower} />
      <NPill text="بينانس" x={TX} y={150} size={56} kind="gold" id="c6s4b" p={pp(t, T.binance)} />
      <StoryPerson x={520} y={1010} s={1.25} role="programmer" outfit="hoodie" hat="hood" pose="point" t={t} id="c6s4eng" />
      <Desk x1={300} x2={1240} y={850} />
      <Laptop t={t} at={T.s4 + 0.25} x={930} y={852} w={430} id="c6s4lap" />
      <NPill text="مهندس برمجيات" x={520} y={430} size={52} kind="white" id="c6s4p" p={pp(t, T.s4)} />
      <NPill text="أكبر منصة عملات رقمية" x={TX} y={720} size={46} kind="white" id="c6s4p2" p={pp(t, T.platform)} />
    </g>
  );
};

// ---------------------------------------------------------------- S5 · S6 · S7 · S9 (inside the laptop)
// S5 · 315.40 · «يجيه تواصل على منصة توظيف من شخص يقول إنه مدير مشروع»
export const S5: React.FC<{t: number}> = ({t}) => {
  const k = moveTo(t, T.s5 + 0.05, 0, 1, 0.6);
  const hl = popAt(t, T.mudir);
  const screen = (
    <g>
      <AppBar>
        <NPill text="منصة توظيف" x={500} y={39} size={36} kind="white" id="c6s5app" p={pp(t, T.tawzif)} />
      </AppBar>
      {/* the role line glows gold on «مدير» */}
      {hl.o > 0 && <rect x={380} y={186} width={460} height={112} rx={40} fill="none" stroke={GOLD} strokeWidth={6} opacity={hl.o * (0.7 + 0.3 * Math.sin(t * 6))} />}
      <MessageCard t={t} at={T.msg} x={500} y={340} w={640} from="مدير مشروع" text="فرصة عمل في شركتنا" kind="job" hat="tie" id="c6s5msg" />
    </g>
  );
  return (
    <g>
      <ColdRoom t={t} id="c6s5" />
      <Desk x1={300} x2={1620} y={1000} />
      <LapZoom t={t} at={T.s5 - 0.4} k={k} screen={screen} id="c6lap" />
    </g>
  );
};

/** the engineer's own small self-view tile (screen px) */
const SelfTile: React.FC<{t: number; x: number; y: number; w: number; id: string; at: number}> = ({t, x, y, w, id, at}) => {
  const h = w * 0.66;
  const g = uid('c6self', id);
  return (
    <Pop t={t} at={at} x={x} y={y}>
      <defs><clipPath id={g}><rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={18} /></clipPath></defs>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={18} fill="#1C2A5A" />
      <g clipPath={`url(#${g})`}>
        <StoryPerson x={x} y={y + 200 + Math.sin(t * 3) * 3} s={0.62} role="programmer" outfit="hoodie" hat="hood" t={t} id={id + 'p'} />
      </g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={18} fill="none" stroke={OUT} strokeWidth={6} />
    </Pop>
  );
};

// S6 · 319.64 · «بعدها مقابلة أولى مع موظف موارد بشرية»
export const S6: React.FC<{t: number}> = ({t}) => {
  // the message card (from S5) slides aside and shrinks
  const [mx, my] = move(t, T.s6 + 0.05, [500, 340], [870, 170], 0.5);
  const ms = moveTo(t, T.s6 + 0.05, 1, 0.3, 0.5);
  const screen = (
    <g>
      <AppBar>
        <NPill text="المقابلة الأولى" x={500} y={39} size={36} kind="gold" id="c6s6p" p={pp(t, T.ula)} />
      </AppBar>
      <g transform={`translate(${mx} ${my}) scale(${ms}) translate(-500 -340)`} opacity={0.85}>
        <MessageCard t={t} at={T.s5} x={500} y={340} w={640} from="مدير مشروع" text="فرصة عمل في شركتنا" kind="job" hat="tie" badge={false} id="c6s5msg" />
      </g>
      <VideoCall t={t} at={T.call1 - 0.15} x={430} y={350} w={540} people={[{name: 'موارد بشرية', hat: 'headset'}]} speaking={[[T.call1 + 0.4, 0]]} id="c6call1" />
    </g>
  );
  return (
    <g>
      <ColdRoom t={t} id="c6s6" />
      <LapZoom t={t} at={T.s5 - 0.4} k={1} screen={screen} id="c6lap" />
      <SelfTile t={t} x={1590} y={790} w={240} at={T.ula + 0.5} id="c6self6" />
    </g>
  );
};

// S7 · 322.38 · «بعدها مقابلة ثانية مع الرئيس التنفيذي للشركة»
const CALL2_W = 820;
export const S7: React.FC<{t: number}> = ({t}) => {
  const swap = T.ceo - 0.27; // the call grows to two tiles: HR first (index 0), the boss pops on «الرئيس»
  const tw = (CALL2_W - 74) / 2, th = tw * 0.82, h2 = 74 + th + 136;
  const top = 345 - h2 / 2;
  const ceoCx = 500 - CALL2_W / 2 + 26 + tw / 2; // Arabic: the 2nd person sits on the LEFT tile
  const ceoTy = top + 74;
  const gf = popAt(t, T.ceo + 0.12);
  const screen = (
    <g>
      <AppBar>
        <NPill text="المقابلة الثانية" x={500} y={39} size={36} kind="gold" id="c6s7p" p={pp(t, T.thania)} />
      </AppBar>
      {t < swap + 0.02 && <VideoCall t={t} at={T.call1 - 0.15} x={430} y={350} w={540} people={[{name: 'موارد بشرية', hat: 'headset'}]} speaking={0} id="c6call1" />}
      {t >= swap && (
        <g>
          {gf.o > 0 && <rect x={ceoCx - tw / 2 - 14} y={ceoTy - 14} width={tw + 28} height={th + 28} rx={34} fill="none" stroke={GOLD} strokeWidth={10} opacity={gf.o} />}
          <VideoCall t={t} at={swap} x={500} y={345} w={CALL2_W} people={[{name: 'موارد بشرية', hat: 'headset'}, {name: 'الرئيس التنفيذي', hat: 'tie', body: '#2B2F6E'}]} speaking={[[T.ceo + 0.3, 1]]} id="c6call2" />
          {gf.o > 0 && <rect x={ceoCx - tw / 2 - 4} y={ceoTy - 4} width={tw + 8} height={th + 8} rx={28} fill="none" stroke={GOLD} strokeWidth={5} opacity={gf.o} />}
          <NPill text="الشركة" x={ceoCx} y={ceoTy + 2} size={34} kind="dark" id="c6s7co" p={pp(t, T.company)} />
        </g>
      )}
    </g>
  );
  return (
    <g>
      <ColdRoom t={t} id="c6s7" />
      <LapZoom t={t} at={T.s5 - 0.4} k={1} screen={screen} id="c6lap" />
    </g>
  );
};

// ---------------------------------------------------------------- S8 · S10 (the funnel row, screen px)
const ROW = {cardX: 1490, cardY: 400, callX: 650, callY: 420, callW: 1000};
const rowGeo = () => {
  const tw = (ROW.callW - 74) / 2, th = tw * 0.82, h = 74 + th + 136;
  const top = ROW.callY - h / 2, ty = top + 74, left = ROW.callX - ROW.callW / 2;
  return {tw, th, h, top, ty, ceoX: left + 26 + tw / 2, hrX: left + 26 + tw + 22 + tw / 2};
};
const CALL_PEOPLE_TIE = [{name: 'موارد بشرية', hat: 'headset'}, {name: 'الرئيس التنفيذي', hat: 'tie', body: '#2B2F6E'}];
const CALL_PEOPLE_HOOD = [{name: 'موارد بشرية', hat: 'headset'}, {name: 'مو رئيس تنفيذي', hat: 'hood', body: '#3A0A18'}];
const JobCard: React.FC<{t: number; at: number; id: string}> = ({t, at, id}) => (
  <MessageCard t={t} at={at} x={ROW.cardX} y={ROW.cardY} w={560} from="مدير مشروع" text="فرصة عمل في شركتنا" kind="job" hat="tie" badge={false} id={id} />
);

// S8 · 325.60 · «كل شيء يبين رسمي ومحترم»
export const S8: React.FC<{t: number}> = ({t}) => {
  const G = rowGeo();
  const z = moveTo(t, T.s8, 1.3, 1, 0.6);
  // gold dotted path under the row: card → HR → CEO (right → left)
  const pts: [number, number][] = [];
  for (let i = 0; i <= 26; i++) {
    const u = i / 26;
    const x = lerp(ROW.cardX, G.ceoX, u);
    const y = 780 + Math.sin(u * Math.PI * 2) * 18;
    pts.push([x, y]);
  }
  const ok = (at: number, x: number, y: number, key: string) => (
    <Pop t={t} at={at} x={x} y={y} key={key}><Mark kind="check" x={x} y={y} r={40} /></Pop>
  );
  const gl = popAt(t, T.muhtaram + 0.1);
  return (
    <g>
      <NightSky t={t} id="c6s8" />
      <Bokeh t={t} n={14} color={CYAN} seed={3} />
      <Glow x={960} y={430} r={900} ry={380} color={GOLD} o={0.28 * gl.o} id="c6s8g" />
      <g transform={`translate(960 430) scale(${z}) translate(-960 -430)`}>
        {pts.map(([x, y], i) => {
          const q = popAt(t, T.kul + i * 0.03);
          return q.o > 0 ? <circle key={i} cx={x} cy={y} r={9 * q.s} fill={GOLD} stroke={OUT} strokeWidth={3} opacity={q.o} /> : null;
        })}
        {[ROW.cardX, G.hrX, G.ceoX].map((x, i) => (
          <Pop t={t} at={T.kul + i * 0.3} x={x} y={780} key={i}>
            <circle cx={x} cy={780} r={30} fill={GOLD} stroke={OUT} strokeWidth={6} />
            <path d={`M${x} ${ROW.cardY + 150 - (i === 0 ? 0 : -150)} L${x} 750`} stroke={GOLD} strokeWidth={5} strokeDasharray="4 14" strokeLinecap="round" opacity={0.7} />
          </Pop>
        ))}
        <JobCard t={t} at={T.s8 - 0.5} id="c6s8job" />
        <VideoCall t={t} at={T.s8 - 0.5} x={ROW.callX} y={ROW.callY} w={ROW.callW} people={CALL_PEOPLE_TIE} id="c6s8call" />
        {ok(T.kul, ROW.cardX + 250, ROW.cardY - 130, 'k1')}
        {ok(T.rasmi, G.hrX + G.tw / 2 - 30, G.ty + 30, 'k2')}
        {ok(T.muhtaram, G.ceoX + G.tw / 2 - 30, G.ty + 30, 'k3')}
      </g>
      {gl.o > 0 && [0, 1, 2, 3, 4, 5].map((i) => <Sparkle key={i} x={300 + i * 280} y={150 + (i % 2) * 560} r={14 + 6 * Math.sin(t * 5 + i)} o={gl.o * (0.5 + 0.5 * Math.sin(t * 4 + i))} color="#FFE7A0" />)}
    </g>
  );
};

// S9 · 327.72 · «يطلبون منه يحمّل ملف عشان يحل مهمة تقييم، زي أي اختبار توظيف عادي»
export const S9: React.FC<{t: number}> = ({t}) => {
  const k = moveTo(t, T.s9, 0.86, 1, 0.6);
  const dlAt = T.dl, dur = T.normal - 0.15 - dlAt - 0.3; // verdict pill lands on «عادي»
  const screen = (
    <g>
      <MessageCard t={t} at={T.ask - 0.1} x={500} y={170} w={760} from="الرئيس التنفيذي" text="حمّل الملف وحلّ المهمة" kind="chat" hat="tie" id="c6s9msg" />
      <DownloadBar t={t} at={dlAt} x={500} y={505} w={780} file="مهمة تقييم" dur={dur} verdict="اختبار توظيف عادي" id="c6s9dl" />
    </g>
  );
  return (
    <g>
      <ColdRoom t={t} id="c6s9" />
      <LapZoom t={t} at={T.s9 - 0.6} k={k} screen={screen} id="c6lap9" />
    </g>
  );
};

// S10 · 333.36 · ★ SIGNATURE — «الشركة ما كانت موجودة، والرئيس التنفيذي مو رئيس تنفيذي، والمهمة مو مهمة»
export const S10: React.FC<{t: number}> = ({t}) => {
  const G = rowGeo();
  const push = moveTo(t, T.s10, 1, 1.04, 5.8, ease.inOutSine);
  const [sx, sy] = shakeAt(t, [T.sharika, T.mawjuda, T.notCeo, T.notTask], 12);
  // job card: RGB flicker on «الشركة», dissolves to static on «موجودة»
  const cardGone = clamp01((t - T.mawjuda) / 0.45);
  const cardOn = Math.max(burst(t, T.sharika, 0.6), cardGone > 0 && cardGone < 1 ? 1 - cardGone : 0);
  // CEO tile: a hint on «والرئيس», then it tears into a hood on «مو رئيس»
  const hoodP = clamp01((t - T.notCeo) / 0.4);
  const ceoOn = Math.max(burst(t, T.rais, 0.3) * 0.5, burst(t, T.notCeo, 0.7));
  const fr = Math.floor(t * 30);
  const gid = uid('c6s10', 'clip');
  const tileBox: [number, number, number, number] = [G.ceoX - G.tw / 2, G.ty, G.tw, G.th];
  const bands = 8;
  cueSfx('glitch', 'c6s10-g1', t >= T.sharika && t < T.sharika + 0.3, ROW.cardX, {at: T.sharika});
  cueSfx('glitch', 'c6s10-g2', t >= T.mawjuda && t < T.mawjuda + 0.3, ROW.cardX, {at: T.mawjuda});
  cueSfx('glitch', 'c6s10-g3', t >= T.notCeo && t < T.notCeo + 0.3, G.ceoX, {at: T.notCeo});
  cueSfx('wrong', 'c6s10-w', t >= T.notTask && t < T.notTask + 0.3, 700, {at: T.notTask});
  const warnQ = pressIn((t - T.notTask) / 0.165);
  const red = clamp01((t - T.notCeo) / 0.3);
  return (
    <g>
      <NightSky t={t} id="c6s10" />
      <rect x={-40} y={-40} width={W + 80} height={H + 80} fill="#03040F" opacity={0.45} />
      <Bokeh t={t} n={10} color={CYAN} seed={11} />
      <Glow x={G.ceoX} y={G.ty + G.th / 2} r={520} ry={420} color={RED} o={0.55 * red} id="c6s10red" />
      <g transform={`translate(${sx} ${sy}) translate(760 600) scale(${push}) translate(-760 -600)`}>
        {/* the job card */}
        {cardGone < 1 && (
          <g opacity={1 - cardGone}>
            <Glitchy t={t} on={cardOn} seed={3} id="c6s10job" box={[ROW.cardX - 280, ROW.cardY - 150, 560, 300]}>
              <JobCard t={t} at={T.s8 - 0.5} id="c6s10jobc" />
              <Mark kind="check" x={ROW.cardX + 250} y={ROW.cardY - 130} r={40} />
            </Glitchy>
          </g>
        )}
        {cardGone > 0 && cardGone < 1 && Array.from({length: 60}, (_, i) => (
          <rect key={i} x={ROW.cardX - 280 + rand(i * 3 + fr) * 560} y={ROW.cardY - 150 + rand(i * 7 + fr * 2) * 300} width={10 + rand(i + fr) * 40} height={6} fill={i % 3 ? '#C9CEE8' : RED} opacity={(1 - cardGone) * 0.8} />
        ))}
        {t >= T.mawjuda + 0.15 && (
          <g>
            <rect x={ROW.cardX - 280} y={ROW.cardY - 150} width={560} height={300} rx={40} fill="none" stroke={RED} strokeWidth={6} strokeDasharray="22 16" opacity={0.7 * popAt(t, T.mawjuda + 0.15).o} />
            <Pop t={t} at={T.mawjuda + 0.15} x={ROW.cardX} y={ROW.cardY}><Mark kind="cross" x={ROW.cardX} y={ROW.cardY - 40} r={70} /></Pop>
            <NPill text="الشركة ما كانت موجودة" x={ROW.cardX} y={ROW.cardY + 90} size={42} kind="red" id="c6s10p1" p={pp(t, T.mawjuda + 0.3)} />
          </g>
        )}
        {/* the call: HR + the CEO → a hood */}
        <Glitchy t={t} on={ceoOn} seed={9} id="c6s10call" box={tileBox}>
          <VideoCall t={t} at={T.s8 - 0.5} x={ROW.callX} y={ROW.callY} w={ROW.callW} people={CALL_PEOPLE_TIE} id="c6s10ca" />
          {hoodP > 0 && (
            <g>
              <defs>
                <clipPath id={gid}>
                  {hoodP >= 1
                    ? <rect x={tileBox[0] - 6} y={tileBox[1] - 6} width={tileBox[2] + 12} height={tileBox[3] + 12} />
                    : Array.from({length: bands}, (_, i) => (rand(i * 11 + fr * 5) < hoodP * 1.2 ? <rect key={i} x={tileBox[0] - 6} y={tileBox[1] + (tileBox[3] * i) / bands} width={tileBox[2] + 12} height={tileBox[3] / bands + 1} /> : null))}
                </clipPath>
              </defs>
              <g clipPath={`url(#${gid})`}>
                <VideoCall t={t} at={T.s8 - 0.5} x={ROW.callX} y={ROW.callY} w={ROW.callW} people={CALL_PEOPLE_HOOD} id="c6s10cb" />
              </g>
            </g>
          )}
          {hoodP > 0 && <rect x={tileBox[0]} y={tileBox[1]} width={tileBox[2]} height={tileBox[3]} rx={24} fill={RED} opacity={hoodP * (0.16 + 0.08 * Math.sin(t * 9))} />}
          {hoodP >= 1 && <circle cx={G.ceoX} cy={G.ty + G.th * 0.42} r={G.th * 0.24} fill="none" stroke={RED} strokeWidth={9} opacity={0.75 + 0.25 * Math.sin(t * 9)} />}
          {red > 0 && <rect x={tileBox[0] - 4} y={tileBox[1] - 4} width={tileBox[2] + 8} height={tileBox[3] + 8} rx={28} fill="none" stroke={RED} strokeWidth={8} opacity={red} />}
          {hoodP < 1 && <Mark kind="check" x={G.ceoX + G.tw / 2 - 30} y={G.ty + 30} r={40} />}
          <Mark kind="check" x={G.hrX + G.tw / 2 - 30} y={G.ty + 30} r={40} />
        </Glitchy>
        {hoodP >= 1 && <Pop t={t} at={T.notCeo + 0.4} x={G.ceoX + G.tw / 2 - 30} y={G.ty + 30}><Mark kind="cross" x={G.ceoX + G.tw / 2 - 30} y={G.ty + 30} r={44} /></Pop>}
        {/* the download: ✔ → red ⚠ on «مو مهمة» */}
        <DownloadBar t={t} at={T.s8 - 4} x={700} y={860} w={960} file="مهمة تقييم" id="c6s10dl" />
        {t >= T.notTask && (
          <g opacity={warnQ.o}>
            <rect x={220} y={755} width={960} height={210} rx={36} fill={RED} opacity={0.28} />
            <rect x={220} y={755} width={960} height={210} rx={36} fill="none" stroke={RED} strokeWidth={8} />
            <g transform={`translate(${700 - 480 + 72} ${860 - 43}) scale(${warnQ.s})`}>
              <circle r={46} fill={RED} stroke="#FFFFFF" strokeWidth={8} />
              <rect x={-6} y={-28} width={12} height={34} rx={6} fill="#FFFFFF" />
              <circle cx={0} cy={18} r={7} fill="#FFFFFF" />
            </g>
            <NPill text="مو مهمة" x={1330} y={860} size={48} kind="red" id="c6s10p3" p={pp(t, T.notTask + 0.1)} />
          </g>
        )}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- S11
// S11 · 339.16 · «كان هذا هو الباب. وحسب كلام بينانس نفسها»
export const S11: React.FC<{t: number}> = ({t}) => (
  <g>
    <NightSky t={t} id="c6s11" />
    <GridFloor t={t} id="c6s11f" />
    {t >= T.door && <g opacity={clamp01((t - T.door) / 0.4)}><Rays t={t} id="c6s11r" x={960} y={520} tone="red" n={20} spin={3} /></g>}
    <FateDoor t={t} at={T.s11} x={960} y={930} h={680} kind="digital" light={RED} openAt={T.door} id="c6door"
      through={{at: T.file, node: <Pic name="malware-file" x={0} y={0} h={210} glow={RED} id="c6s11file" />, dur: 1.3, to: [0, 60], s: 1.9}}
      label={{text: 'حسب كلام بينانس', at: T.said, kind: 'white'}} />
  </g>
);

// ---------------------------------------------------------------- S12
// S12 · 342.24 · «المهاجمين كوريين شماليين، وجمعوا معلومات»
const KOREA: [[number, number], [number, number]] = [[112, 30], [144, 46]];
export const S12: React.FC<{t: number}> = ({t}) => {
  const pr = nightProj(KOREA);
  const [nkx, nky] = pr(127.2, 40.2);
  const pinDrop = ease.outBack(clamp01((t - T.korean) / 0.35));
  const hk = [760, 1060, 1360];
  return (
    <g>
      <rect x={-40} y={-40} width={W + 80} height={H + 80} fill="#060A22" />
      <NightMap t={t} region={KOREA} mode="neon" neon="#3B82F6" id="c6s12map" areas={[
        {countries: ['China', 'Russia', 'Mongolia', 'Japan'], fill: '#10173C'},
        {countries: ['South Korea'], fill: '#16205A'},
        {countries: ['North Korea'], fill: '#6A0E26', outline: '#FF5A6A', at: T.s12 + 0.1},
      ]} />
      <Glow x={nkx} y={nky} r={260} color={RED} o={0.6 * clamp01((t - T.s12) / 0.4)} id="c6s12ng" />
      {/* the pin */}
      {t >= T.korean && (
        <g transform={`translate(${nkx} ${nky - 260 * (1 - pinDrop)})`}>
          <path d="M0 0 C-12 -26 -44 -46 -44 -82 A44 44 0 1 1 44 -82 C44 -46 12 -26 0 0 Z" fill={RED} stroke={OUT} strokeWidth={8} />
          <circle cx={0} cy={-82} r={16} fill="#FFFFFF" stroke={OUT} strokeWidth={5} />
        </g>
      )}
      <NPill text="كوريين شماليين" x={nkx} y={nky - 190} size={52} kind="red" id="c6s12p" p={pp(t, T.kpill)} />
      {/* three hackers rise in front */}
      {hk.map((x, i) => {
        const at = T.s12 + i * 0.12;
        const [, y] = move(t, at, [x, 1400], [x, 1070], 0.5, ease.out);
        if (t < at) return null;
        return (
          <g key={i}>
            <Glow x={x} y={y - 200} r={190} color={RED} o={0.35} id={`c6s12h${i}`} />
            <StoryPerson x={x} y={y} s={0.95} role="hacker" hat="hood" outfit="hoodie" body="#1A1030" rim="#FF5A6A" pose="hold" prop="laptop" t={t} id={`c6s12hk${i}`} />
          </g>
        );
      })}
      {/* documents fly into their hands */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const at = T.gather + i * 0.09;
        if (t < at) return null;
        const from: [number, number] = [i % 2 ? W + 80 : -80, 200 + i * 90];
        const to: [number, number] = [hk[i % 3] + (i % 2 ? 60 : -60), 860];
        const [x, y] = move(t, at, from, to, 0.6);
        const k = clamp01((t - at) / 0.6);
        const o = k < 0.95 ? 1 : 1 - (k - 0.95) / 0.05;
        cueSfx('swish', `c6s12d${i}`, t >= at && t < at + 0.2, x, {at, gain: 0.6});
        return <g key={i} opacity={o} transform={`translate(${x} ${y}) rotate(${(1 - k) * (i % 2 ? 40 : -40)})`}><StoryPropIcon prop="document" x={0} y={60} s={0.6} /></g>;
      })}
    </g>
  );
};

// ---------------------------------------------------------------- S13
// S13 · 345.28 · «من خطأ ثاني لمهندس ثاني حمّل نسخة مزيفة من برنامج مشهور من إعلان على الإنترنت»
export const S13: React.FC<{t: number}> = ({t}) => {
  const dur = T.fake - T.dl2 - 0.3;
  const ad = popAt(t, T.ad);
  const blink = 0.6 + 0.4 * (Math.floor(t * 4) % 2);
  // dashed arrow: ad banner → the download bar (drawn on)
  const ap = ease.out(clamp01((t - T.ad - 0.25) / 0.45));
  const P0: [number, number] = [1290, 190], P1: [number, number] = [1660, 230], P2: [number, number] = [1680, 360];
  const bez = (u: number): [number, number] => [
    (1 - u) * (1 - u) * P0[0] + 2 * (1 - u) * u * P1[0] + u * u * P2[0],
    (1 - u) * (1 - u) * P0[1] + 2 * (1 - u) * u * P1[1] + u * u * P2[1],
  ];
  const path = Array.from({length: 21}, (_, i) => bez((i / 20) * ap)).map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  const [ex, ey] = bez(ap);
  return (
    <g>
      <ColdRoom t={t} id="c6s13" win={[160, 96, 560, 420]} />
      <StoryPerson x={560} y={1010} s={1.2} role="programmer" outfit="shirt" rim={CYAN} glasses pose={t >= T.fake ? 'shock' : 'point'} flip t={t} id="c6s13eng" />
      <Desk x1={300} x2={1260} y={850} />
      <Laptop t={t} at={T.s13 + 0.1} x={950} y={852} w={400} glow={t >= T.fake ? RED : CYAN} id="c6s13lap" />
      <NPill text="خطأ ثاني" x={560} y={330} size={56} kind="red" id="c6s13p1" p={pp(t, T.khata)} />
      <NPill text="مهندس ثاني" x={560} y={420} size={44} kind="white" id="c6s13p2" p={pp(t, T.eng2)} />
      <DownloadBar t={t} at={T.dl2} x={1300} y={480} w={880} file="برنامج مشهور" dur={dur} danger verdict="نسخة مزيفة" id="c6s13dl" />
      {/* the flashy ad that caused it */}
      {ad.o > 0 && (
        <g transform={`translate(1050 180) scale(${ad.s}) translate(-1050 -180)`} opacity={ad.o}>
          <rect x={810} y={110} width={480} height={140} rx={26} fill={GOLD} opacity={0.3 * blink} transform="translate(-10 -10) scale(1)" />
          <rect x={820} y={120} width={460} height={120} rx={24} fill="#3A2A08" stroke={OUT} strokeWidth={9} />
          <rect x={834} y={134} width={432} height={92} rx={18} fill="none" stroke={GOLD} strokeWidth={6} strokeDasharray="18 12" opacity={blink} />
          <GlowText text="إعلان" x={1050} y={180} size={64} tone="gold" id="c6s13ad" />
          {[0, 1, 2].map((i) => <Sparkle key={i} x={840 + i * 210} y={110 + (i % 2) * 140} r={12 + 4 * Math.sin(t * 6 + i)} color="#FFE7A0" />)}
        </g>
      )}
      {ap > 0 && (
        <g>
          <path d={path} fill="none" stroke={GOLD} strokeWidth={7} strokeDasharray="16 14" strokeLinecap="round" />
          <circle cx={ex} cy={ey} r={12} fill={GOLD} stroke={OUT} strokeWidth={4} />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- S14
// S14 · 351.38 · «ومن هنا وصلوا للمحافظ، وخلال ساعات»
const VX = 1180, VY = 520, VH = 620;
export const S14: React.FC<{t: number}> = ({t}) => {
  const beam = ease.out(clamp01((t - T.reach) / 0.5));
  const op = ease.inOut(clamp01((t - T.open) / 0.7));
  cueSfx('thump', 'c6s14-open', t >= T.open && t < T.open + 0.3, VX, {at: T.open, hit: 0.2, gain: 1.6});
  const clk = popAt(t, T.hours);
  const hand = (t - T.hours) * 900;
  return (
    <g>
      <ScienceWorld t={t} id="c6s14" />
      {/* the red light of the hackers reaches the vault */}
      {beam > 0 && <polygon points={`120,560 ${lerp(120, VX - 300, beam)},${lerp(560, VY - 180, beam)} ${lerp(120, VX - 300, beam)},${lerp(560, VY + 180, beam)} 120,700`} fill={RED} opacity={0.22} />}
      {[150, 330].map((x, i) => (
        <g key={i}>
          <Glow x={x} y={760} r={170} color={RED} o={0.35} id={`c6s14hg${i}`} />
          <StoryPerson x={x} y={1040} s={0.85} role="hacker" hat="hood" outfit="hoodie" body="#1A1030" rim="#FF5A6A" pose="point" t={t} id={`c6s14hk${i}`} />
        </g>
      ))}
      <HoloRing x={VX} y={VY + VH * 0.45} rx={380} t={t} />
      {/* the open vault: a dark round hole with gold inside, the door swings on its left hinge */}
      {op > 0 && (
        <g>
          <circle cx={VX} cy={VY} r={VH * 0.4} fill="#05030F" stroke={OUT} strokeWidth={10} />
          <Glow x={VX} y={VY} r={VH * 0.38} color={GOLD} o={op} id="c6s14in" />
          <Pic name="bitcoin-pile" x={VX} y={VY + 60} h={260} o={op} id="c6s14pile" />
        </g>
      )}
      <Pic name="crypto-vault" x={VX - (VH / 2) * 0.86 * op} y={VY} h={VH} sx={1 - 0.86 * op} glow={op > 0.1 ? RED : CYAN} id="c6s14vault" />
      {/* ₿ coins stream out to the left */}
      {t >= T.open + 0.3 && Array.from({length: 12}, (_, i) => {
        const cyc = 1.5;
        const u = ((t - T.open - 0.3) / cyc + i / 12) % 1;
        if (t - T.open - 0.3 < (i / 12) * cyc * 0) return null;
        const e = ease.in(u);
        const x = lerp(VX - 40, -120, e);
        const y = VY + 40 + Math.sin(u * Math.PI) * -120 + (rand(i) - 0.5) * 160;
        return coin(t, x, y, 70 + rand(i * 3) * 30, `c6s14c${i}`, clamp01(u * 6), u * 360);
      })}
      {/* «خلال ساعات»: a clock spinning fast */}
      {clk.o > 0 && (
        <g transform={`translate(1660 250) scale(${clk.s})`} opacity={clk.o}>
          <circle r={96} fill="#F4F1FF" stroke={OUT} strokeWidth={10} />
          {Array.from({length: 12}, (_, i) => <rect key={i} x={-4} y={-84} width={8} height={16} rx={3} fill="#2A2458" transform={`rotate(${i * 30})`} />)}
          <rect x={-6} y={-62} width={12} height={66} rx={6} fill={OUT} transform={`rotate(${hand})`} />
          <rect x={-5} y={-44} width={10} height={48} rx={5} fill={RED} transform={`rotate(${hand / 12})`} />
          <circle r={10} fill={OUT} />
        </g>
      )}
      <NPill text="خلال ساعات" x={1660} y={410} size={48} kind="white" id="c6s14p" p={pp(t, T.hours + 0.1)} />
    </g>
  );
};

// ---------------------------------------------------------------- S15
// S15 · 355.12 · «سحبوا حوالي 6.3 مليار»
export const S15: React.FC<{t: number}> = ({t}) => {
  const X = 1200, Y = 540, PW = 920, PH = 560;
  const g = uid('c6s15', 'p');
  const p = ease.out(clamp01((t - T.s15) / 1.34));
  const pts = Array.from({length: 13}, (_, i) => [X - PW / 2 + 60 + i * ((PW - 120) / 12), Y + 210 - Math.pow(i / 12, 1.8) * 170 + Math.sin(i * 2.1) * 12] as [number, number]);
  const n = Math.max(1, Math.round(p * 12));
  const line = pts.slice(0, n + 1).map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  const landed = t >= T.land;
  const bump = landed ? 1 + 0.06 * Math.sin(Math.PI * clamp01((t - T.land) / 0.25)) : 1;
  const q = popAt(t, T.s15 - 0.1);
  return (
    <g>
      <NightSky t={t} id="c6s15" />
      <Rays t={t} id="c6s15r" x={X} y={Y} tone={landed ? 'gold' : 'red'} n={22} spin={4} />
      {/* coins rush past behind the panel */}
      {Array.from({length: 10}, (_, i) => {
        const u = ((t - T.s15) * 0.9 + i / 10) % 1;
        const x = lerp(W + 100, -100, ease.inOutSine(u));
        return coin(t, x, 160 + rand(i * 5) * 760, 60 + rand(i) * 40, `c6s15c${i}`, 0.75, u * 300);
      })}
      <g transform={`translate(${X} ${Y}) scale(${q.s * bump}) translate(${-X} ${-Y})`} opacity={q.o}>
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3A1236" />
            <stop offset="1" stopColor="#14061C" />
          </linearGradient>
        </defs>
        <Glow x={X} y={Y} r={PW * 0.7} ry={PH * 0.7} color={RED} o={0.55} id="c6s15g" />
        <rect x={X - PW / 2} y={Y - PH / 2} width={PW} height={PH} rx={44} fill={`url(#${g})`} stroke={OUT} strokeWidth={10} />
        <rect x={X - PW / 2 + 30} y={Y - PH / 2 + 12} width={PW - 60} height={8} rx={4} fill={RED} />
        <path d={line} fill="none" stroke={RED} strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
        <CountNumber t={t} at={T.s15} value="6.3 مليار $" x={X} y={Y - 10} size={170} tone="gold" dur={T.land - T.s15} id="c6s15n" />
      </g>
      <NPill text="المسروق" x={X} y={Y - PH / 2} size={52} kind="red" id="c6s15p" p={pp(t, T.s15)} />
      <RevealRing t={t} at={T.land} x={X} y={Y} r={360} color="#FFB0B8" tail />
      <Flash t={t} at={T.land} strength={0.6} />
    </g>
  );
};

// ---------------------------------------------------------------- S17
// S17 · 362.42 · «و300 مليون من ملف حمّله شخص كان يحسب إنه يقرب من وظيفة أحلامه»
export const S17: React.FC<{t: number}> = ({t}) => {
  const FX = 860, FY = 470, NX = 1420, NY = 330;
  const lp = ease.inOut(clamp01((t - T.line) / 0.5));
  cueSfx('swish', 'c6s17-line', t >= T.line && t < T.line + 0.2, FX, {at: T.line});
  const bub = popAt(t, T.dream);
  const BX = 1330, BY = 700;
  return (
    <g>
      <NightSky t={t} id="c6s17" />
      <GridFloor t={t} id="c6s17f" />
      <Glow x={NX} y={NY} r={420} ry={260} color={GOLD} o={0.45} id="c6s17ng" />
      <NPill text="6.3 مليار $" x={NX} y={NY} size={84} kind="gold" id="c6s17n" p={pp(t, T.s17)} />
      <Glow x={FX} y={FY + 90} r={90} ry={30} color={CYAN} o={0.9} id="c6s17fd" />
      <Pop t={t} at={T.s17 + 0.25} x={FX} y={FY}>
        <Pic name="malware-file" x={FX} y={FY + Math.sin(t * 2) * 6} h={130} glow={RED} id="c6s17file" />
      </Pop>
      {lp > 0 && <path d={`M${FX + 60} ${FY - 30} L${lerp(FX + 60, NX - 230, lp)} ${lerp(FY - 30, NY + 20, lp)}`} stroke={GOLD} strokeWidth={8} strokeDasharray="18 14" strokeLinecap="round" />}
      <Pop t={t} at={T.person} x={FX} y={1030}>
        <StoryPerson x={FX} y={1040} s={0.95} role="programmer" outfit="hoodie" hat="hood" pose="idle" t={t} id="c6s17eng" />
      </Pop>
      {bub.o > 0 && (
        <g opacity={bub.o}>
          {[[FX + 110, 790, 14], [FX + 170, 760, 22]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r * bub.s} fill="#1E3A6E" stroke={CYAN} strokeWidth={5} />)}
          <g transform={`translate(${BX} ${BY}) scale(${bub.s})`}>
            <ellipse rx={190} ry={130} fill="#1E3A6E" stroke={OUT} strokeWidth={12} />
            <ellipse rx={190} ry={130} fill="none" stroke={CYAN} strokeWidth={5} />
            <Glow x={0} y={-10} r={110} color={GOLD} o={0.8} id="c6s17sg" />
            <path d={Array.from({length: 10}, (_, i) => { const r = i % 2 ? 30 : 72; const a = -Math.PI / 2 + (i * Math.PI) / 5; return `${i ? 'L' : 'M'}${Math.cos(a) * r} ${Math.sin(a) * r - 10}`; }).join(' ') + 'Z'}
              fill={GOLD} stroke={OUT} strokeWidth={8} strokeLinejoin="round" transform={`rotate(${Math.sin(t * 2) * 6})`} />
          </g>
          <NPill text="وظيفة أحلامه" x={BX} y={BY + 160} size={48} kind="cyan" id="c6s17p" p={pp(t, T.dreamPill)} />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- S18
// S18 · 367.56 · «بينانس قدرت تسترجع حوالي 2.5 مليار بعد ما تجمّدت بعض العملات المسروقة»
export const S18: React.FC<{t: number}> = ({t}) => {
  const VXr = 1640, VYr = 560;
  const fz = ease.out(clamp01((t - T.freeze) / 0.35));
  return (
    <g>
      <NightSky t={t} id="c6s18" />
      <Glow x={VXr} y={VYr} r={300} color={CYAN} o={0.5} id="c6s18vg" />
      <Pic name="crypto-vault" x={VXr} y={VYr} h={380} glow={CYAN} id="c6s18vault" />
      {Array.from({length: 14}, (_, i) => {
        const back = i % 3 === 0; // a third of the coins turn back
        const lane = 380 + rand(i * 2.7) * 420;
        const baseU = ((367.56 - 360) * 0.5 + i / 14) % 1;
        // stolen coins drift left; from «تسترجع» the returned ones fly back into the vault
        const driftX = lerp(1380, 140, baseU) - (t - T.s18) * 90;
        if (back && t >= T.back) {
          const at = T.back + (i / 14) * 0.5;
          const [x, y] = move(t, at, [driftX, lane], [VXr, VYr], 0.9);
          const k = clamp01((t - at) / 0.9);
          return k < 1 ? <g key={i}>{coin(t, x, y, 100, `c6s18c${i}`, 1 - Math.max(0, k - 0.8) * 5, 0, 'hue-rotate(60deg) saturate(1.3)')}</g> : null;
        }
        const x = back ? driftX : lerp(driftX, driftX + 0, fz);
        const freezeX = lerp(1380, 140, baseU) - (T.freeze - T.s18) * 90;
        const fx = t >= T.freeze ? freezeX : x;
        const shiver = t >= T.freeze ? Math.sin(t * 40 + i) * 2 * (1 - fz) : 0;
        return (
          <g key={i}>
            {coin(t, fx + shiver, lane, 100, `c6s18c${i}`, 1, t >= T.freeze ? 0 : (t - T.s18) * 120 + i * 20, 'sepia(0.4) hue-rotate(-40deg) saturate(2.2)')}
            {fz > 0 && !back && (
              <g transform={`translate(${fx} ${lane}) scale(${0.6 + 0.4 * fz})`} opacity={fz}>
                <rect x={-74} y={-74} width={148} height={148} rx={26} fill="#9BEBFF" opacity={0.45} stroke="#E6FBFF" strokeWidth={6} />
                <path d="M-44 -40 L-10 -40" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={0.8} />
              </g>
            )}
          </g>
        );
      })}
      {t >= T.back && <Pop t={t} at={T.back} x={1640} y={300}><path d="M1640 250 L1690 320 L1590 320 Z" fill={GREEN} stroke={OUT} strokeWidth={7} strokeLinejoin="round" /></Pop>}
      <CountNumber t={t} at={T.count} value="2.5 مليار $" x={900} y={210} size={150} tone="green" dur={0.42} id="c6s18n" />
      <NPill text="تجمّدت" x={760} y={900} size={56} kind="cyan" id="c6s18p" p={pp(t, T.stolen - 0.6)} />
    </g>
  );
};

// ---------------------------------------------------------------- S19
// S19 · 372.64 · «وتقول إن أموال العملاء بأمان، والتحقيق للحين مستمر»
export const S19: React.FC<{t: number}> = ({t}) => {
  const VXs = 1260, VYs = 470;
  const sh = popAt(t, T.shield);
  const [mx, my] = move(t, T.probe, [980, 760], [300, 760], 1.1);
  const mag = popAt(t, T.probe - 0.1);
  return (
    <g>
      <NightSky t={t} id="c6s19" />
      <HoloRing x={VXs} y={VYs + 300} rx={360} t={t} />
      {sh.o > 0 && (
        <g transform={`translate(${VXs} ${VYs}) scale(${sh.s})`} opacity={sh.o}>
          <Glow x={0} y={0} r={420} color={CYAN} o={0.6} id="c6s19sg" />
          <path d="M0 -330 L270 -230 Q270 140 0 330 Q-270 140 -270 -230 Z" fill="#5CF2FF" opacity={0.12} stroke={CYAN} strokeWidth={10} strokeLinejoin="round" />
        </g>
      )}
      <Pic name="crypto-vault" x={VXs} y={VYs} h={460} glow={CYAN} id="c6s19vault" />
      <MarkPill t={t} at={T.safe} text="أموال العملاء بأمان" x={VXs} y={VYs + 380} mark="check" size={52} id="c6s19m" />
      {/* the frozen coins + the magnifier sweep */}
      {[220, 400, 580, 760, 940].map((x, i) => (
        <g key={i} transform={`translate(${x} ${790 + (i % 2) * 30})`}>
          {coin(t, 0, 0, 70, `c6s19c${i}`, 1, 0, 'sepia(0.4) hue-rotate(-40deg) saturate(2.2)')}
          <rect x={-52} y={-52} width={104} height={104} rx={18} fill="#9BEBFF" opacity={0.4} stroke="#E6FBFF" strokeWidth={5} />
        </g>
      ))}
      {mag.o > 0 && <Pic name="magnifier" x={mx} y={my - 30 + Math.sin(t * 3) * 8} h={230} o={mag.o} rot={-15} id="c6s19mag" />}
      <NPill text="التحقيق مستمر" x={580} y={560} size={52} kind="white" id="c6s19p" p={pp(t, T.ongoing)} />
      {t >= T.ongoing + 0.2 && [0, 1, 2].map((i) => <circle key={i} cx={530 + i * 50} cy={630} r={11} fill="#FFFFFF" stroke={OUT} strokeWidth={4} opacity={0.35 + 0.65 * Math.max(0, Math.sin(t * 6 - i * 0.9))} />)}
    </g>
  );
};

// ---------------------------------------------------------------- S20
// S20 · 376.66 · «الموظفين اللي شغلهم مو واجهة للعامة ممنوعين أصلًا يكون عندهم حسابات على لينكدإن»
export const S20: React.FC<{t: number}> = ({t}) => {
  const xs = [760, 1060, 1360, 1660];
  const ban = pressIn((t - T.banned) / 0.165);
  const card = popAt(t, T.banned - 0.35);
  const CX = 1210, CY = 330;
  cueSfx('thump', 'c6s20-ban', t >= T.banned && t < T.banned + 0.3, CX, {at: T.banned, hit: 0.16, gain: 1.4});
  const push = moveTo(t, T.s20, 1, 1.05, 6.5, ease.inOutSine);
  return (
    <g transform={`translate(1200 600) scale(${push}) translate(-1200 -600)`}>
      <rect x={-60} y={-60} width={W + 120} height={H + 120} fill="#120C30" />
      <rect x={-60} y={700} width={W + 120} height={500} fill="#0A0720" />
      {/* ceiling light strips */}
      {[500, 1000, 1500].map((x, i) => <rect key={i} x={x - 160} y={70} width={320} height={16} rx={8} fill="#E6F4FF" opacity={0.7} />)}
      <Glow x={1200} y={560} r={900} ry={300} color={CYAN} o={0.18} id="c6s20amb" />
      {xs.map((x, i) => {
        const at = T.s20 + 0.1 + i * 0.12;
        const lit = popAt(t, T.staff + i * 0.1);
        return (
          <Pop t={t} at={at} x={x} y={820} key={i}>
            <Glow x={x + 90} y={700} r={140} color={CYAN} o={0.5 * lit.o} id={`c6s20m${i}`} />
            <StoryPerson x={x} y={980} s={0.72} role="programmer" outfit={i % 2 ? 'shirt' : 'hoodie'} glasses={i === 2} pose="idle" t={t} id={`c6s20w${i}`} />
            {/* monitor beside each worker */}
            <rect x={x + 62} y={640} width={130} height={100} rx={12} fill="#1D2A66" stroke={OUT} strokeWidth={7} />
            <rect x={x + 74} y={652} width={106} height={76} rx={6} fill={CYAN} opacity={0.15 + 0.5 * lit.o} />
            <rect x={x + 120} y={740} width={14} height={50} fill="#2A2458" stroke={OUT} strokeWidth={4} />
            <rect x={x - 130} y={790} width={300} height={34} rx={8} fill="#3A3370" stroke={OUT} strokeWidth={7} />
          </Pop>
        );
      })}
      <NPill text="مو واجهة للعامة" x={1210} y={560} size={48} kind="grey" id="c6s20p1" p={pp(t, T.notPublic)} />
      {/* the profile card + the ban sign */}
      {card.o > 0 && (
        <g transform={`translate(${CX} ${CY}) scale(${card.s})`} opacity={card.o}>
          <rect x={-280} y={-105} width={560} height={210} rx={30} fill="#1E2A60" stroke={OUT} strokeWidth={9} />
          <rect x={-254} y={-94} width={508} height={8} rx={4} fill="#4DA3FF" />
          <circle cx={170} cy={0} r={62} fill="#2A2050" stroke={GOLD} strokeWidth={7} />
          <circle cx={170} cy={-12} r={24} fill="#0E0A22" />
          <path d="M128 40 Q170 0 212 40" fill="#0E0A22" />
          {[-40, 0, 40].map((y, i) => <rect key={i} x={-230} y={y - 9} width={i === 0 ? 300 : 240} height={18} rx={9} fill="#C9CEE8" opacity={0.7} />)}
        </g>
      )}
      {t >= T.banned && (
        <g transform={`translate(${CX} ${CY}) scale(${ban.s})`} opacity={ban.o}>
          <circle r={150} fill="none" stroke={OUT} strokeWidth={42} />
          <circle r={150} fill="none" stroke={RED} strokeWidth={28} />
          <path d="M-106 106 L106 -106" stroke={OUT} strokeWidth={42} />
          <path d="M-106 106 L106 -106" stroke={RED} strokeWidth={28} />
        </g>
      )}
      <NPill text="لينكدإن" x={CX} y={CY - 175} size={48} kind="cyan" id="c6s20p2" p={pp(t, T.linkedin)} />
    </g>
  );
};

// ---------------------------------------------------------------- S21
// S21 · 383.48 · «وما قالت إذا هذا المهندس كان مخالف ولا لا»
export const S21: React.FC<{t: number}> = ({t}) => {
  const X = 1060;
  // the two verdicts flicker back and forth and neither wins
  const which = t < T.viol ? -1 : t < T.orNot ? 0 : Math.floor((t - T.orNot) * 3) % 2 === 0 ? 1 : 0;
  const card = (txt: string, x: number, kind: 'red' | 'grey', on: boolean, at: number, id: string) => {
    const q = popAt(t, at);
    if (q.o <= 0) return null;
    const s = q.s * (on ? 1.12 : 0.92);
    return (
      <g transform={`translate(${x} 620) scale(${s})`} opacity={q.o * (on ? 1 : 0.55)}>
        <NPill text={txt} x={0} y={0} size={60} kind={kind} id={id} />
      </g>
    );
  };
  cueSfx('tick', `c6s21-flip-${which}-${Math.floor((t - T.orNot) * 3)}`, t >= T.viol && t < T.s22 && which >= 0, X, {gain: 0.6});
  return (
    <g>
      <rect x={-40} y={-40} width={W + 80} height={H + 80} fill="#07051A" />
      <Spotlight x={X} y={1000} top={-40} w={640} id="c6s21spot" />
      <StoryPerson x={X} y={1200} s={1.85} role="programmer" outfit="hoodie" hat="hood" prop="none" pose="think" t={t} id="c6s21eng" />
      <Pop t={t} at={T.q} x={X} y={170}>
        <GlowText text="؟" x={X} y={170} size={200} tone="white" id="c6s21q" />
      </Pop>
      {card('مخالف', 1560, 'red', which === 0, T.viol - 0.15, 'c6s21a')}
      {card('ولا لا', 580, 'grey', which === 1, T.viol - 0.05, 'c6s21b')}
    </g>
  );
};

// ---------------------------------------------------------------- S22
// S22 · 386.44 · «فالمرة الجاية إذا جاك عرض وظيفة أحلى من اللازم، وطلبوا منك تحمّل شيء، فكّر مرتين»
export const S22: React.FC<{t: number}> = ({t}) => {
  const PX = 700;
  const tt = Math.min(t, T.download + 0.55); // the download freezes at a few %
  const offer = popAt(t, T.offer);
  return (
    <g>
      <NightSky t={t} id="c6s22" />
      <Rays t={t} id="c6s22r" x={PX} y={400} tone="gold" n={18} spin={3} />
      <Bokeh t={t} n={18} color={GOLD} seed={5} />
      <Phone t={t} at={T.s22 + 0.1} x={PX} y={560} h={820} glow={GOLD} id="c6s22ph" />
      {offer.o > 0 && <Glow x={PX} y={360} r={460} ry={220} color={GOLD} o={0.6 * offer.o} id="c6s22og" />}
      <MessageCard t={t} at={T.offer} x={PX} y={360} w={740} from="عرض وظيفة" text="وظيفة أحلامك تنتظرك" kind="job" hat="tie" id="c6s22msg" />
      {offer.o > 0 && Array.from({length: 8}, (_, i) => (
        <Sparkle key={i} x={PX - 380 + rand(i * 4.1) * 760} y={190 + rand(i * 2.9) * 340} r={(10 + rand(i) * 14) * (0.5 + 0.5 * Math.abs(Math.sin(t * 3 + i * 1.3)))} o={offer.o} color="#FFE7A0" />
      ))}
      <NPill text="أحلى من اللازم" x={PX} y={150} size={48} kind="grey" id="c6s22p" p={pp(t, T.tooGood)} />
      {t >= T.download && <DownloadBar t={tt} at={T.download} x={PX} y={650} w={740} file="ملف المهمة" dur={30} id="c6s22dl" />}
      <AlertBanner t={t} at={T.think} x={PX + 40} y={880} text="فكّر مرتين" tone="gold" id="c6s22al" />
    </g>
  );
};
