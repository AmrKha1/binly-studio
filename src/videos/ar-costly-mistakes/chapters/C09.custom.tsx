// Custom shots for C09 (builder-owned, AZTIKA). Each: export const S<n>: React.FC<{t: number}> returning the shot's WORLD
// (SVG, no <Stage>/<NightScreen> — the chapter provides them; NightShots joins, drifts and pins the host).
// C09 · ثمن ما ينحسب بالدولار — Chernobyl (ref war ladder, shots-05 #128–#134). SERIOUS: no jokes, no comic poses.
// Palette: purple board → the $ breaks into a human, RED WarWorld → paper map (yellow-green = radiation) → grey clouds.
// Screen coordinates (NightScreen: no mirroring). AZTIKA (hud) stands at sideLeft (x≈420): keep x > 640 clear while he is on
// (S1–S3, S15–S20); he is OFF in the mini-story S4–S14.
import React from 'react';
import {clamp01, ease, lerp, noise1, popRef, pressIn, rand} from '../../../kit/anim';
import {uid} from '../../../kit/stage';
import {GlowText, GridFloor, NightSky, NPill, Sparkle, WordPop, YearBadge, textWidth, nightFont} from '../../../kit/night';
import type {PopWord} from '../../../kit/night';
import {Flash, HeroObject, Rays, CountNumber, WhooshOut} from '../../../kit/night-fx';
import {PaperMap, RoomWorld, StoryPerson, SunsetWorld} from '../../../kit/night-worlds';
import {StairGame} from '../../../kit/night-game';
import type {StairEntry} from '../../../kit/night-game';
import {BlueprintCard, CloudWorld, Coin, MysteryTile} from '../../../kit/night-props';
import {MarkPill, NBars, NGauge, WarWorld} from '../../../kit/night-data';
import {Spotlight} from '../../../kit/night-story';
import {MassGrid} from '../../../kit/night-sci';
import {NightMap, nightProj} from '../../../kit/night-maps';
import {countryD} from '../../../kit/geo';
import {move} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {OUT, popAt} from '../shared/util';
import board from '../../../../videos/ar-costly-mistakes/board.json';

const T = {
  s1: 529.3, google: 529.45, nawqif: 530.0, arqam: 530.89, trill: 532.4, fulus: 533.32, // «وهنا لازم نوقف شوي. كل الأرقام اللي فاتت، حتى التريليونات، فلوس»
  s2: 533.72, tiji: 534.36, yakhsar: 535.27, yaksab: 536.26, // «تروح وتجي، أحد يخسر وأحد يكسب»
  s3: 536.64, thaman: 537.6, dollar: 538.54, bashar: 539.34, s4: 540.06, // «بس في غلطات ثمنها ما ينحسب بالدولار. ينحسب بالبشر»
  s5: 545.36, ukr: 545.52, ussr: 547.22, // «في أوكرانيا، وقتها جزء من الاتحاد السوفييتي»
  s7: 551.9, ijtama: 553.04, aib: 553.84, tasmim: 554.22, qarar: 556.2, athna: 557.06, // «عيب في تصميم المفاعل … مع قرارات غلط أثناء التجربة»
  s8: 557.96, infijar: 558.92, ghubar: 559.7, // «والنتيجة انفجار، وغبار مشع»
  s9: 561.36, masahat: 562.1, dakhma: 562.72, // «انتشر على مساحات ضخمة»
  s10: 563.16, ghalta: 564.16, wahid: 564.74, // «هنا ما نتكلم عن غلطة شخص واحد»
  s11: 565.08, silsila: 566.04, saghira: 568.38, // «نتكلم عن سلسلة قرارات، كل واحدة شكلها صغيرة لحالها»
  s12: 569.24, jara: 570.72, rub: 572.52, talawath: 573.44, // «بيلاروسيا، الدولة الجارة، … ربع أراضيها تلوثت»
  s13: 574.06, milyonin: 575.06, mutadarrira: 577.18, // «وأكثر من مليونين إنسان عاشوا في المناطق المتضررة»
  s14: 577.82, y1986: 578.54, k22: 581.42, idtarru: 583.12, yatrukun: 583.7, // «في سنة 1986 … أكثر من 22 ألف شخص اضطروا يتركون بيوتهم»
  s15: 584.62, bel: 585.28, n235: 588.0, dollar2: 589.96, // «وحكومة بيلاروسيا قدّرت خسارتها … بحوالي 235 مليار دولار»
  s16: 590.5, mizania: 591.04, n32: 592.94, // «يعني ميزانية الدولة كاملة وقتها 32 مرة»
  s17: 594.22, qaddaru: 595.2, thalath: 596.72, n700: 598.9, dollar3: 599.92, n30: 600.94, // «… الدول الثلاث … 700 مليار دولار خلال 30 سنة»
  s18: 601.72, iftiradat: 604.64, shakk: 605.68, // «تقدير مبني على افتراضات وفيه شك كبير»
  s19: 606.34, haqiqi: 607.24, ma: 607.74, ahad: 607.88, yarifuh: 608.12, // «يعني الرقم الحقيقي ما أحد يعرفه»
  s20: 608.56, n40: 609.88, duwal: 611.38, tasrif: 613.4, end: 614.58, // «كملت 40 سنة … والدول المتضررة للحين تصرف على آثارها»
};

const GOLD = '#FFC928', RED = '#FD4B5B', TOX = '#C6E83A', TOX_D = '#7FA51E', CYAN = '#57D9FA';

// ---------------------------------------------------------------- local helpers
const Glow: React.FC<{x: number; y: number; r: number; color: string; o?: number; id: string; ry?: number}> = ({x, y, r, color, o = 1, id, ry}) => {
  if (o <= 0.01) return null;
  const g = uid('c9glow', id);
  return (
    <g opacity={o}>
      <defs>
        <radialGradient id={g}>
          <stop offset="0" stopColor={color} stopOpacity={0.75} />
          <stop offset="0.45" stopColor={color} stopOpacity={0.25} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={r} ry={ry ?? r} fill={`url(#${g})`} />
    </g>
  );
};

/** the reference pop around a point */
const Pop: React.FC<{t: number; at: number; x: number; y: number; children: React.ReactNode; out?: number}> = ({t, at, x, y, children, out}) => {
  const q = popAt(t, at);
  const fo = out === undefined ? 1 : 1 - clamp01((t - out) / 0.25);
  if (q.o * fo <= 0.001) return null;
  return <g transform={`translate(${x} ${y}) scale(${q.s}) translate(${-x} ${-y})`} opacity={q.o * fo}>{children}</g>;
};

/** a WordPop centred on cx */
const CWords: React.FC<{t: number; words: PopWord[]; y: number; size: number; cx: number; id: string; out?: number}> = ({t, words, y, size, cx, id, out}) => {
  const gap = size * 0.2;
  const tot = words.reduce((a, w) => a + textWidth(w.w, size), 0) + gap * (words.length - 1);
  return <WordPop t={t} words={words} y={y} size={size} right={cx + tot / 2} gap={gap} id={id} out={out} />;
};

/** a small ▲/▼ badge drawn as a path (no glyphs) */
const Arrow: React.FC<{x: number; y: number; up: boolean; color: string; s?: number}> = ({x, y, up, color, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) ${up ? '' : 'rotate(180)'}`}>
    <path d="M0 -30 L28 14 L-28 14 Z" fill={color} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
  </g>
);

/** radiation trefoil disc (the reactor icon) — `hot` 0..1 turns it red and glowing */
const Reactor: React.FC<{x: number; y: number; r?: number; hot: number; t: number; id: string}> = ({x, y, r = 90, hot, t, id}) => {
  const fill = hot > 0.5 ? '#FF4A4A' : '#F2C94C';
  const blade = (a: number) => {
    const a0 = ((a - 30) * Math.PI) / 180, a1 = ((a + 30) * Math.PI) / 180;
    const r0 = r * 0.26, r1 = r * 0.8;
    return `M${Math.cos(a0) * r0} ${Math.sin(a0) * r0} L${Math.cos(a0) * r1} ${Math.sin(a0) * r1} A${r1} ${r1} 0 0 1 ${Math.cos(a1) * r1} ${Math.sin(a1) * r1} L${Math.cos(a1) * r0} ${Math.sin(a1) * r0} A${r0} ${r0} 0 0 0 ${Math.cos(a0) * r0} ${Math.sin(a0) * r0} Z`;
  };
  return (
    <g transform={`translate(${x} ${y})`}>
      <Glow x={0} y={0} r={r * 2.3} color={RED} o={hot * (0.75 + 0.25 * Math.sin(t * 9))} id={id + 'g'} />
      {hot > 0 && [0, 1].map((k) => {
        const u = ((t * 1.2 + k * 0.5) % 1);
        return <circle key={k} r={r * (1 + u * 0.9)} fill="none" stroke={RED} strokeWidth={6} opacity={hot * (1 - u) * 0.8} />;
      })}
      <circle r={r} fill="#1A1430" stroke={OUT} strokeWidth={10} />
      <circle r={r - 9} fill={fill} />
      <g fill="#1A1430">
        {[90, 210, 330].map((a) => <path key={a} d={blade(a - 180)} />)}
        <circle r={r * 0.14} />
      </g>
    </g>
  );
};

/** a toggle switch: lever up (green LED) → down (red LED) as `on` goes 0 → 1 */
const Toggle: React.FC<{x: number; y: number; on: number; s?: number}> = ({x, y, on, s = 1}) => {
  const a = lerp(-32, 32, ease.inOut(clamp01(on)));
  const red = on > 0.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-46} y={-70} width={92} height={140} rx={16} fill="#3A3F55" stroke={OUT} strokeWidth={7} />
      <rect x={-34} y={-58} width={68} height={10} rx={5} fill="#FFFFFF" opacity={0.15} />
      <circle cx={0} cy={-44} r={11} fill={red ? '#FF3B4E' : '#2EE88B'} stroke={OUT} strokeWidth={4} />
      {red && <circle cx={0} cy={-44} r={24} fill="#FF3B4E" opacity={0.35} />}
      <circle cx={0} cy={18} r={22} fill="#1E2233" stroke={OUT} strokeWidth={5} />
      <g transform={`translate(0 18) rotate(${a})`}>
        <rect x={-9} y={-62} width={18} height={62} rx={9} fill="#D9DEEA" stroke={OUT} strokeWidth={5} />
        <circle cx={0} cy={-62} r={14} fill={red ? '#FF5A5A' : '#E9EDF6'} stroke={OUT} strokeWidth={5} />
      </g>
    </g>
  );
};

/** a tiny white person glyph (MassGrid) */
const Human: React.FC<{color: string; s?: number}> = ({color, s = 1}) => (
  <g transform={`scale(${s})`}>
    <circle cx={0} cy={-13} r={8.5} fill={color} />
    <path d="M-13 15 Q-13 -2 0 -2 Q13 -2 13 15 Z" fill={color} />
  </g>
);

// ==================================================================================================================
// S1 · 529.30 · «وهنا لازم نوقف شوي. كل الأرقام اللي فاتت، حتى التريليونات، فلوس» — Google takes its step, the game PAUSES
const ENTRIES: StairEntry[] = (board.entries as {id: string; label: string; at: number; src?: string; ar?: number; glow?: string; twist?: boolean}[]).map((e) => ({
  id: e.id, label: e.label, at: e.at, src: e.src, ar: e.ar ?? 1, glow: e.glow, twist: e.twist,
}));
const STAIR = {entries: ENTRIES, summitAt: board.summitAt, topLabel: board.topLabel};
const stepX = (i: number) => 1660 - i * 250;
const stepH = (i: number) => 110 + i * 62 + (i === 8 ? 37 : 0);
const FREEZE = 530.24; // the google pill has finished popping — then the whole game holds still like a paused video
export const S1: React.FC<{t: number}> = ({t}) => {
  const base = 836;
  const tf = Math.min(t, FREEZE);
  // camera: Netflix framing (end of C08) → google's step → pull back over every step on «الأرقام»
  const k1 = ease.inOut(clamp01((t - T.google) / 0.7));
  const k2 = ease.inOut(clamp01((t - (T.arqam - 0.1)) / 1.2));
  const A = {cx: 285, cy: 420, z: 1.12, sx: 1100, sy: 560};
  const G = {cx: stepX(6), cy: base - stepH(6) / 2 - 150, z: 1.05, sx: 1080, sy: 560};
  const L = {cx: 660, cy: 420, z: 0.53, sx: 1250, sy: 520};
  const mix = (a: number, b: number, c: number) => lerp(lerp(a, b, k1), c, k2);
  const cx = mix(A.cx, G.cx, L.cx), cy = mix(A.cy, G.cy, L.cy), sx = mix(A.sx, G.sx, L.sx), sy = mix(A.sy, G.sy, L.sy);
  const z = mix(A.z, G.z, L.z) * (1 + 0.004 * Math.max(0, t - T.s1));
  const scr = (wx: number, wy: number): [number, number] => [sx + (wx - cx) * z, sy + (wy - cy) * z];
  // pause: colours drain 30 %
  const drain = clamp01((t - T.nawqif) / 0.35);
  const fid = uid('c9s1', 'sat');
  cueSfx('tick', 'c9s1-pause', t >= T.nawqif && t < T.nawqif + 0.3, 960, {at: T.nawqif, hit: 0.1});
  // the gold «قوقل» pill (where C08 left it) flies onto its step
  const gTop = base - stepH(6);
  const [gpx, gpy] = scr(stepX(6), gTop - 200 - 52);
  const fly = ease.inOut(clamp01((t - (T.s1 + 0.05)) / 0.5));
  const flyO = 1 - clamp01((t - (T.s1 + 0.5)) / 0.2);
  cueSfx('whoosh', 'c9s1-fly', t >= T.s1 + 0.05 && t < T.s1 + 0.35, 960, {at: T.s1 + 0.05, hit: 0.25, gain: 0.6});
  // the google step glows once on «التريليونات»
  const glow = Math.sin(Math.PI * clamp01((t - (T.trill - 0.1)) / 0.9));
  cueSfx('sparkle', 'c9s1-trill', t >= T.trill - 0.1 && t < T.trill + 0.2, 960, {at: T.trill - 0.1, hit: 0.3});
  cueSfx('coins', 'c9s1-coins', t >= T.fulus && t < T.fulus + 0.3, 1100, {at: T.fulus, hit: 0.15});
  return (
    <g>
      <defs>
        <filter id={fid} x="0" y="0" width="100%" height="100%">
          <feColorMatrix type="saturate" values={String(1 - 0.32 * drain)} />
        </filter>
      </defs>
      <g filter={drain > 0 ? `url(#${fid})` : undefined}>
        <NightSky t={tf} id="c9s1s" horizonY={sy + (base - cy) * z} />
        <g transform={`translate(${sx} ${sy}) scale(${z}) translate(${-cx} ${-cy})`}>
          <GridFloor id="c9s1f" t={tf} wide />
          <Glow x={stepX(6)} y={gTop - 120} r={330} ry={420} color={GOLD} o={glow * 0.9} id="c9s1gl" />
          <StairGame t={tf} id="c9s1g" {...STAIR} />
          {/* «فلوس»: a gold coin pops over each money step, right → left */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const at = T.fulus - 0.05 + i * 0.07;
            const q = popAt(t, at);
            if (q.o <= 0) return null;
            const x = stepX(i), y = base - stepH(i) - 200 - 52 - 120;
            return (
              <g key={i} transform={`translate(${x} ${y + Math.sin(t * 2.4 + i) * 6}) scale(${q.s})`} opacity={q.o}>
                <Coin x={0} y={0} r={58} t={t} spin={0.6} phase={i} />
              </g>
            );
          })}
        </g>
        <rect x={0} y={0} width={1920} height={1080} fill="#1A1238" opacity={0.18 * drain} />
      </g>
      {flyO > 0 && (
        <g opacity={flyO}>
          <NPill text="قوقل" x={lerp(1060, gpx, fly)} y={lerp(665, gpy - 70, fly)} size={lerp(90, 46, fly)} kind="gold" id="c9s1qg" />
        </g>
      )}
      {/* the pause badge — the game has stopped */}
      <Pop t={t} at={T.nawqif} x={1250} y={150}>
        <g transform="translate(1250 150)">
          <circle r={74} fill="#000000" opacity={0.3} transform="translate(5 8)" />
          <circle r={70} fill="#151030" stroke="#FFFFFF" strokeWidth={8} />
          <rect x={-30} y={-32} width={20} height={64} rx={8} fill="#FFFFFF" />
          <rect x={10} y={-32} width={20} height={64} rx={8} fill="#FFFFFF" />
        </g>
      </Pop>
      <NPill text="فلوس" x={1250} y={150} size={60} kind="white" id="c9s1fl" p={(t - (T.fulus - 0.05)) / 0.3} />
    </g>
  );
};

// ==================================================================================================================
// S2 · 533.72 · «تروح وتجي، أحد يخسر وأحد يكسب» — money passes back and forth (loser on the RIGHT: read first in Arabic)
const WIN = {x: 880, y: 960}, LOSE = {x: 1460, y: 960};
const coinStream = (t: number, at: number, from: [number, number], to: [number, number], key: string) => {
  cueSfx('coins', key, t >= at && t < at + 0.3, (from[0] + to[0]) / 2, {at, hit: 0.3, gain: 0.7});
  return [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const u = clamp01((t - at - i * 0.06) / 0.62);
    if (u <= 0 || u >= 1) return null;
    const e = ease.inOut(u);
    const x = lerp(from[0], to[0], e), y = lerp(from[1], to[1], e) - 250 * Math.sin(Math.PI * e);
    const o = Math.min(1, u * 6, (1 - u) * 6);
    return <g key={key + i} opacity={o}><Coin x={x} y={y} r={30} t={t} spin={1.4} phase={i} /></g>;
  });
};
export const S2: React.FC<{t: number}> = ({t}) => {
  const slump = ease.out(clamp01((t - (T.yakhsar - 0.1)) / 0.4));
  const hA: [number, number] = [WIN.x + 120, 640], hB: [number, number] = [LOSE.x - 120, 640];
  return (
    <g>
      <NightSky t={t} id="c9s2s" />
      <GridFloor id="c9s2f" t={t} />
      <Glow x={1170} y={700} r={620} ry={260} color="#8A4AF2" o={0.4} id="c9s2g" />
      <ellipse cx={WIN.x} cy={WIN.y + 6} rx={120} ry={20} fill="#000000" opacity={0.35} />
      <ellipse cx={LOSE.x} cy={LOSE.y + 6} rx={120} ry={20} fill="#000000" opacity={0.35} />
      <StoryPerson x={WIN.x} y={WIN.y} s={1.25} role="man" pose={t >= T.yaksab - 0.1 ? 'cheer' : t < T.tiji ? 'hold' : 'idle'} flip t={t} id="c9s2w" />
      <g transform={`translate(0 ${slump * 26})`}>
        <StoryPerson x={LOSE.x} y={LOSE.y} s={1.25} role="man" rim="#7FD8FF" pose={t >= T.yakhsar - 0.1 ? 'shock' : t >= T.tiji ? 'hold' : 'idle'} t={t} id="c9s2l" />
      </g>
      {coinStream(t, T.s2 + 0.08, hA, hB, 'c9s2-go')}
      {coinStream(t, T.tiji - 0.05, hB, hA, 'c9s2-back')}
      <Pop t={t} at={T.yakhsar - 0.08} x={LOSE.x} y={300}>
        <NPill text="يخسر" x={LOSE.x + 30} y={300} size={60} kind="red" id="c9s2p1" />
        <Arrow x={LOSE.x - 120} y={300} up={false} color={RED} s={1.1} />
      </Pop>
      <Pop t={t} at={T.yaksab - 0.08} x={WIN.x} y={300}>
        <NPill text="يكسب" x={WIN.x + 30} y={300} size={60} kind="green" id="c9s2p2" />
        <Arrow x={WIN.x - 120} y={296} up color="#22C55E" s={1.1} />
      </Pop>
    </g>
  );
};

// ==================================================================================================================
// S3 · 536.64 · ★ «بس في غلطات ثمنها ما ينحسب بالدولار. ينحسب بالبشر» — the $ cracks open and a human stands in it
const P = {x: 1120, y: 450};
const PW = 600, PH = 330;
const CRACK: [number, number][] = [[-30, -165], [14, -98], [-22, -40], [26, 18], [-14, 70], [18, 118], [-6, 165]];
const DollarPill: React.FC<{crack: number; id: string}> = ({crack, id}) => {
  const g = uid('c9pill', id);
  const d = CRACK.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE58A" />
          <stop offset="0.55" stopColor="#FFC21A" />
          <stop offset="1" stopColor="#D88A00" />
        </linearGradient>
      </defs>
      <rect x={-PW / 2} y={-PH / 2} width={PW} height={PH} rx={PH / 2} fill={`url(#${g})`} stroke={OUT} strokeWidth={13} />
      <rect x={-PW / 2 + 60} y={-PH / 2 + 26} width={PW - 120} height={22} rx={11} fill="#FFFFFF" opacity={0.45} />
      <text x={0} y={18} fontSize={280} fontFamily={nightFont()} fontWeight={900} textAnchor="middle" dominantBaseline="central"
        fill="#FFF8E0" stroke={OUT} strokeWidth={16} paintOrder="stroke" strokeLinejoin="round">$</text>
      {crack > 0 && (
        <g>
          <path d={d} fill="none" stroke={OUT} strokeWidth={16} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={`${crack} 1`} />
          <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={`${crack} 1`} />
        </g>
      )}
    </g>
  );
};
export const S3: React.FC<{t: number}> = ({t}) => {
  const push = 1 + 0.12 * ease.inOut(clamp01((t - T.s3) / (T.s4 - T.s3)));
  const red = ease.out(clamp01((t - T.bashar) / 0.35));
  const q = popAt(t, T.thaman - 0.06);
  cueSfx('pop', 'c9s3-pill', t >= T.thaman - 0.06 && t < T.thaman + 0.2, P.x, {at: T.thaman - 0.06, hit: 0.125, gain: 1.4});
  const sh = t >= T.dollar ? 14 * Math.sin((t - T.dollar) * 70) * Math.exp(-(t - T.dollar) / 0.12) : 0;
  const crack = ease.out(clamp01((t - T.dollar) / 0.16));
  cueSfx('glass', 'c9s3-crack', t >= T.dollar && t < T.dollar + 0.2, P.x, {at: T.dollar, hit: 0.05, gain: 0.8});
  const br = t - T.bashar;
  cueSfx('boom', 'c9s3-human', br >= 0 && br < 0.25, P.x, {at: T.bashar, hit: 0.05, gain: 2});
  const hq = br >= 0 ? popRef(clamp01(br / 0.3)) : {s: 0, o: 0};
  const anticip = t >= T.bashar - 0.3 && t < T.bashar ? 1 - 0.04 * Math.sin(Math.PI * ((t - (T.bashar - 0.3)) / 0.3)) : 1;
  return (
    <g>
      <NightSky t={t} id="c9s3s" />
      <GridFloor id="c9s3f" t={t} />
      {red > 0 && <g opacity={red}><WarWorld t={t} id="c9s3w" /></g>}
      <g transform={`translate(${P.x} ${P.y}) scale(${push}) translate(${-P.x} ${-P.y})`}>
        <Glow x={P.x} y={P.y} r={520} ry={380} color={br >= 0 ? '#FFFFFF' : GOLD} o={clamp01((t - T.s3 - 0.1) / 0.6) * (br >= 0 ? 0.55 : 0.35)} id="c9s3g" />
        {br >= 0 && <g opacity={0.65 * red}><Rays t={t} id="c9s3r" tone="red" x={P.x} y={P.y} /></g>}
        {/* the pill — whole until «بالبشر», then 8 shards fly apart */}
        {br < 0 && q.o > 0 && (
          <g transform={`translate(${P.x + sh} ${P.y}) scale(${q.s * anticip})`} opacity={q.o}>
            <DollarPill crack={crack} id="c9s3p" />
          </g>
        )}
        {br >= 0 && br < 0.9 && [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
          const a0 = (k * 45 - 90) * (Math.PI / 180), a1 = ((k + 1) * 45 - 90) * (Math.PI / 180);
          const R = 700;
          const cid = uid('c9shard', String(k));
          const am = (a0 + a1) / 2;
          const u = ease.out(clamp01(br / 0.8));
          const dx = Math.cos(am) * 560 * u, dy = Math.sin(am) * 420 * u + 260 * u * u;
          return (
            <g key={k} opacity={1 - clamp01((br - 0.35) / 0.5)}>
              <defs>
                <clipPath id={cid}>
                  <path d={`M0 0 L${Math.cos(a0) * R} ${Math.sin(a0) * R} L${Math.cos(a1) * R} ${Math.sin(a1) * R} Z`} />
                </clipPath>
              </defs>
              <g transform={`translate(${P.x + dx} ${P.y + dy}) rotate(${(k % 2 ? 1 : -1) * 50 * u})`}>
                <g clipPath={`url(#${cid})`}><DollarPill crack={1} id={'c9s3s' + k} /></g>
              </g>
            </g>
          );
        })}
        {/* the human — glowing white, standing where the $ was */}
        {br >= 0 && (
          <g transform={`translate(${P.x} ${P.y + 10}) scale(${hq.s * (1 + 0.012 * Math.sin(t * 2.2))})`} opacity={hq.o}>
            <g filter={`url(#${uid('c9hb', 'f')})`} opacity={0.9}>
              <defs>
                <filter id={uid('c9hb', 'f')} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation={26} /></filter>
              </defs>
              <circle cx={0} cy={-120} r={70} fill="#FFFFFF" />
              <path d="M-120 190 Q-124 -10 -70 -42 Q0 -74 70 -42 Q124 -10 120 190 Z" fill="#FFFFFF" />
            </g>
            <circle cx={0} cy={-120} r={60} fill="#FFFFFF" stroke={OUT} strokeWidth={8} />
            <path d="M-108 186 Q-112 -6 -64 -36 Q0 -64 64 -36 Q112 -6 108 186 Z" fill="#FFFFFF" stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
            <path d="M-80 120 Q-82 0 -50 -18" fill="none" stroke="#E6E1F5" strokeWidth={10} strokeLinecap="round" />
          </g>
        )}
        {br >= 0 && [0, 1, 2, 3, 4, 5].map((i) => {
          const u = clamp01((br - 0.1 - i * 0.07) / 0.8);
          const a = (i / 6) * Math.PI * 2 + 0.4;
          return <Sparkle key={i} x={P.x + Math.cos(a) * (200 + 60 * u)} y={P.y + Math.sin(a) * (170 + 50 * u)} r={14 + (i % 3) * 6} o={Math.sin(u * Math.PI)} color="#FFFFFF" />;
        })}
      </g>
      {/* foreground drifting sparkles */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <Sparkle key={'f' + i} x={700 + rand(i * 7 + 3) * 1150 + noise1(t * 0.3, i + 9) * 40} y={140 + rand(i * 5 + 1) * 700 + noise1(t * 0.3 + 5, i + 9) * 30}
          r={8 + rand(i) * 10} o={0.35 + 0.35 * Math.sin(t * 2 + i)} color={br >= 0 ? '#FFD0D0' : GOLD} />
      ))}
      <CWords t={t} cx={P.x} y={860} size={140} id="c9s3w2" words={[{w: 'بالبشر', at: T.bashar, tone: 'red', enter: 'pop'}]} />
      {br >= 0 && br < 0.5 && <Flash t={t} at={T.bashar} strength={0.6} />}
    </g>
  );
};

// ==================================================================================================================
// THE MAP (S5 · S9 · S12) — one paper map of eastern Europe, the camera moves over it
const REGION: [[number, number], [number, number]] = [[16, 43], [44, 58.5]];
const proj = nightProj(REGION);
const CH = proj(30.1, 51.39); // Chernobyl
const NEUTRAL = ['Poland', 'Lithuania', 'Latvia', 'Estonia', 'Slovakia', 'Hungary', 'Romania', 'Moldova', 'Russia', 'Belarus', 'Ukraine', 'Germany', 'Czechia', 'Czech Rep.', 'Austria', 'Serbia', 'Bulgaria', 'Turkey', 'Georgia', 'Finland', 'Sweden', 'Slovenia', 'Croatia', 'Bosnia and Herz.', 'Kosovo', 'Montenegro', 'Macedonia', 'Albania', 'Greece', 'Denmark', 'Norway', 'Kazakhstan'];
const USSR = ['Ukraine', 'Belarus', 'Russia', 'Moldova', 'Lithuania', 'Latvia', 'Estonia', 'Georgia', 'Kazakhstan'];
type MapCam = {cx: number; cy: number; z: number};
const mapScr = (c: MapCam, p: [number, number]): [number, number] => [960 + (p[0] - c.cx) * c.z, 540 + (p[1] - c.cy) * c.z];
const MapWorld: React.FC<{t: number; cam: MapCam; id: string; ukr?: number; children?: React.ReactNode; over?: React.ReactNode}> = ({t, cam, id, ukr = 0, children, over}) => (
  <g>
    <PaperMap t={t} id={id + 'p'} />
    <g transform={`translate(960 540) scale(${cam.z}) translate(${-cam.cx} ${-cam.cy})`}>
      <NightMap t={t} region={REGION} id={id + 'm'} areas={[{countries: NEUTRAL, fill: '#E4D3A6'}]} />
      {ukr > 0 && (
        <g opacity={ukr}>
          <path d={countryD(REGION, 1920, 1080, ['Ukraine'])} fill="#F6D96B" stroke={OUT} strokeWidth={9} strokeLinejoin="round" />
        </g>
      )}
      {children}
    </g>
    {over}
  </g>
);
/** the red pin on Chernobyl (world coords, size kept constant on screen) */
const Pin: React.FC<{t: number; at: number; z: number; pulse?: boolean}> = ({t, at, z, pulse}) => {
  if (t < at) return null;
  const u = clamp01((t - at) / 0.4);
  cueSfx('thump', `c9pin-${at}`, t < at + 0.3, 960, {at, hit: 0.3});
  const dy = lerp(-180, 0, ease.outBack(u));
  return (
    <g transform={`translate(${CH[0]} ${CH[1]}) scale(${1 / z})`} opacity={clamp01(u * 3)}>
      {pulse && [0, 1].map((k) => {
        const v = (t * 0.9 + k * 0.5) % 1;
        return <circle key={k} r={30 + v * 90} fill="none" stroke={RED} strokeWidth={6} opacity={(1 - v) * 0.8} />;
      })}
      <ellipse cx={0} cy={4} rx={22} ry={8} fill="#000000" opacity={0.3} />
      <g transform={`translate(0 ${dy})`}>
        <path d="M0 0 C-14 -26 -44 -50 -44 -82 A44 44 0 1 1 44 -82 C44 -50 14 -26 0 0 Z" fill={RED} stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
        <circle cx={0} cy={-84} r={17} fill="#FFFFFF" stroke={OUT} strokeWidth={5} />
      </g>
    </g>
  );
};

// S5 · 545.36 · «في أوكرانيا، وقتها جزء من الاتحاد السوفييتي»
export const S5: React.FC<{t: number}> = ({t}) => {
  const k = ease.inOut(clamp01((t - (T.ussr - 0.2)) / 0.9));
  const ua = proj(31.5, 48.6);
  const cam = {cx: lerp(ua[0], ua[0] + 120, k), cy: lerp(ua[1] - 30, ua[1] - 120, k), z: lerp(1.15, 0.82, k)};
  const ukr = ease.out(clamp01((t - (T.ukr - 0.05)) / 0.3));
  cueSfx('thump', 'c9s5-ukr', t >= T.ukr - 0.05 && t < T.ukr + 0.2, 960, {at: T.ukr - 0.05, hit: 0.15});
  const us = clamp01((t - (T.ussr - 0.05)) / 0.4);
  cueSfx('swish', 'c9s5-ussr', t >= T.ussr - 0.05 && t < T.ussr + 0.2, 960, {at: T.ussr - 0.05, hit: 0.2});
  const dU = countryD(REGION, 1920, 1080, USSR);
  const [ux, uy] = mapScr(cam, ua);
  const [rx, ry] = mapScr(cam, proj(36, 55.2));
  return (
    <MapWorld t={t} cam={cam} id="c9s5" ukr={ukr}
      over={
        <>
          <NPill text="أوكرانيا" x={ux} y={uy + 40} size={56} kind="white" id="c9s5u" p={(t - (T.ukr - 0.02)) / 0.3} />
          <NPill text="الاتحاد السوفييتي" x={Math.min(1600, rx)} y={Math.max(170, ry)} size={52} kind="grey" id="c9s5s" p={(t - T.ussr) / 0.3} />
        </>
      }>
      {us > 0 && (
        <g opacity={us}>
          <path d={dU} fill="#E2343F" fillOpacity={0.12} stroke={RED} strokeWidth={22 / cam.z} opacity={0.35} strokeLinejoin="round" />
          <path d={dU} fill="none" stroke="#C81E2C" strokeWidth={9 / cam.z} strokeDasharray={`${26 / cam.z} ${18 / cam.z}`} strokeDashoffset={-t * 40} strokeLinejoin="round" />
        </g>
      )}
      <Pin t={t} at={T.s5 + 0.05} z={cam.z} pulse />
    </MapWorld>
  );
};

// ==================================================================================================================
// S7 · 551.90 · «اجتمع فيه عيب في تصميم المفاعل نفسه، مع قرارات غلط أثناء التجربة» — two causes lock together
const Blueprint: React.FC<{t: number; crack: number; id: string}> = ({t, crack, id}) => {
  const w = 500, h = 380;
  const g = uid('c9bp', id);
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2F6FE0" />
          <stop offset="1" stopColor="#1C46A8" />
        </linearGradient>
      </defs>
      <rect x={-w / 2 + 14} y={-h / 2 + 18} width={w} height={h} rx={12} fill="#000000" opacity={0.35} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={12} fill={`url(#${g})`} stroke="#0E2A6E" strokeWidth={9} />
      <g stroke="#8DB6FF" strokeWidth={1.5} opacity={0.4}>
        {Array.from({length: 17}, (_, i) => <line key={'v' + i} x1={-w / 2 + i * 30} y1={-h / 2} x2={-w / 2 + i * 30} y2={h / 2} />)}
        {Array.from({length: 13}, (_, i) => <line key={'h' + i} x1={-w / 2} y1={-h / 2 + i * 30} x2={w / 2} y2={-h / 2 + i * 30} />)}
      </g>
      {/* the reactor schematic: core + rods + tower */}
      <g fill="none" stroke="#EAF2FF" strokeWidth={6} strokeLinejoin="round">
        <rect x={-150} y={-60} width={200} height={170} rx={10} />
        <circle cx={-50} cy={25} r={52} />
        {[-80, -50, -20].map((x) => <line key={x} x1={x} y1={-100} x2={x} y2={20} />)}
        <path d="M90 110 L110 -40 Q140 -60 170 -40 L190 110 Z" />
        <line x1={50} y1={60} x2={95} y2={60} />
      </g>
      {crack > 0 && (
        <g>
          <path d="M-60 -190 L-30 -110 L-70 -40 L-20 30 L-50 100 L-10 190" fill="none" stroke={OUT} strokeWidth={16} strokeLinejoin="round" pathLength={1} strokeDasharray={`${crack} 1`} />
          <path d="M-60 -190 L-30 -110 L-70 -40 L-20 30 L-50 100 L-10 190" fill="none" stroke="#FF3B4E" strokeWidth={8} strokeLinejoin="round" pathLength={1} strokeDasharray={`${crack} 1`} />
        </g>
      )}
      <circle cx={0} cy={0} r={1} fill="none" opacity={0.001 + 0 * t} />
    </g>
  );
};
const PANEL_SW = [-130, 0, 130];
export const S7: React.FC<{t: number}> = ({t}) => {
  const lock = T.athna - 0.05;
  const [bx] = move(t, lock, [1380, 0], [1250, 0], 0.5, ease.inOut);
  const [px] = move(t, lock, [560, 0], [680, 0], 0.5, ease.inOut);
  const hot = clamp01((t - (lock + 0.4)) / 0.3);
  cueSfx('error', 'c9s7-alarm', t >= lock + 0.4 && t < lock + 0.7, 960, {at: lock + 0.4, gain: 0.7});
  cueSfx('thump', 'c9s7-lock', t >= lock + 0.35 && t < lock + 0.6, 960, {at: lock + 0.35, hit: 0.1});
  const crack = ease.out(clamp01((t - (T.aib - 0.05)) / 0.3));
  cueSfx('glass', 'c9s7-crack', t >= T.aib - 0.05 && t < T.aib + 0.2, bx, {at: T.aib - 0.05, hit: 0.1, gain: 0.6});
  const bq = popAt(t, T.s7 + 0.08), pq = popAt(t, T.s7 + 0.3);
  cueSfx('swish', 'c9s7-bp', t >= T.s7 + 0.08 && t < T.s7 + 0.3, 1380, {at: T.s7 + 0.08, hit: 0.1});
  cueSfx('swish', 'c9s7-pn', t >= T.s7 + 0.3 && t < T.s7 + 0.5, 560, {at: T.s7 + 0.3, hit: 0.1});
  // the hand flips the three switches on «قرارات غلط»
  const flips = [T.qarar - 0.15, T.qarar + 0.2, T.qarar + 0.55];
  flips.forEach((f, i) => cueSfx('click', `c9s7-sw${i}`, t >= f && t < f + 0.2, px, {at: f, hit: 0.08}));
  const handAt = (i: number) => [px + PANEL_SW[i] + 30, 600] as [number, number];
  let hand: [number, number] = [px - 260, 980];
  hand = move(t, T.qarar - 0.6, hand, handAt(0), 0.4);
  if (t >= flips[0] + 0.05) hand = move(t, flips[0] + 0.05, handAt(0), handAt(1), 0.3);
  if (t >= flips[1] + 0.05) hand = move(t, flips[1] + 0.05, handAt(1), handAt(2), 0.3);
  if (t >= flips[2] + 0.15) hand = move(t, flips[2] + 0.15, handAt(2), [px + 80, 1000], 0.5);
  const handO = clamp01((t - (T.qarar - 0.6)) / 0.2) * (1 - clamp01((t - (flips[2] + 0.5)) / 0.2));
  return (
    <g>
      <NightSky t={t} id="c9s7s" />
      <GridFloor id="c9s7f" t={t} />
      <Glow x={960} y={500} r={700} ry={360} color={hot > 0 ? RED : '#3B82F6'} o={0.3 + 0.2 * hot} id="c9s7g" />
      {/* the reactor between them */}
      <Pop t={t} at={T.ijtama + 0.4} x={960} y={470}>
        <Reactor x={960} y={470} r={88} hot={hot} t={t} id="c9s7r" />
      </Pop>
      {/* RIGHT: the design flaw */}
      {bq.o > 0 && (
        <g transform={`translate(${bx} 450) rotate(4) scale(${bq.s})`} opacity={bq.o}>
          <Blueprint t={t} crack={crack} id="c9s7b" />
        </g>
      )}
      <NPill text="عيب في التصميم" x={bx} y={205} size={52} kind="white" id="c9s7p1" p={(t - (T.tasmim - 0.1)) / 0.3} />
      {/* LEFT: wrong decisions — a control panel */}
      {pq.o > 0 && (
        <g transform={`translate(${px} 470) scale(${pq.s})`} opacity={pq.o}>
          <rect x={-250 + 12} y={-200 + 16} width={500} height={400} rx={26} fill="#000000" opacity={0.35} />
          <rect x={-250} y={-200} width={500} height={400} rx={26} fill="#262A3C" stroke={OUT} strokeWidth={10} />
          <rect x={-210} y={-170} width={420} height={90} rx={14} fill="#0E1222" stroke={OUT} strokeWidth={6} />
          {/* a small readout that climbs into the red as the switches flip */}
          <path d={`M-190 ${-110} L-120 ${-118} L-60 ${-112} L0 ${-124} L60 ${-128 - 10 * clamp01((t - flips[0]) / 0.3)} L120 ${-134 - 14 * clamp01((t - flips[1]) / 0.3)} L190 ${-140 - 18 * clamp01((t - flips[2]) / 0.3)}`}
            fill="none" stroke={t >= flips[1] ? '#FF3B4E' : '#2EE88B'} strokeWidth={6} strokeLinejoin="round" />
          {PANEL_SW.map((x, i) => <Toggle key={i} x={x} y={70} on={clamp01((t - flips[i]) / 0.15)} s={1.05} />)}
        </g>
      )}
      <NPill text="قرارات غلط" x={px} y={205} size={52} kind="white" id="c9s7p2" p={(t - (T.qarar - 0.05)) / 0.3} />
      {handO > 0 && (
        <g opacity={handO}>
          <path d={`M${hand[0] - 40} 1120 Q${hand[0] - 60} ${(hand[1] + 1120) / 2} ${hand[0]} ${hand[1] + 20}`} fill="none" stroke={OUT} strokeWidth={46} strokeLinecap="round" />
          <path d={`M${hand[0] - 40} 1120 Q${hand[0] - 60} ${(hand[1] + 1120) / 2} ${hand[0]} ${hand[1] + 20}`} fill="none" stroke="#2A2340" strokeWidth={34} strokeLinecap="round" />
          <circle cx={hand[0]} cy={hand[1]} r={32} fill="#1A1430" stroke={GOLD} strokeWidth={8} />
        </g>
      )}
      {/* the two locks: chain links between each side and the reactor */}
      {hot > 0 && [[px + 250, bx - 250]].map(([a, b], i) => (
        <g key={i} opacity={hot}>
          <line x1={a} y1={470} x2={960 - 88} y2={470} stroke={RED} strokeWidth={10} strokeLinecap="round" />
          <line x1={960 + 88} y1={470} x2={b} y2={470} stroke={RED} strokeWidth={10} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};

// ==================================================================================================================
// S8 · 557.96 · «والنتيجة انفجار، وغبار مشع» — unit 4 blows, radioactive dust drifts west with the wind
const PL = {x: 1180, y: 590, h: 560};
const EX = {x: PL.x + 120, y: PL.y - 90};
export const S8: React.FC<{t: number}> = ({t}) => {
  const e = t - T.infijar;
  const shake = e >= 0 ? Math.exp(-e / 0.2) : 0;
  const sx = shake * 18 * Math.sin(e * 75), sy = shake * 12 * Math.cos(e * 61);
  cueSfx('boom', 'c9s8-boom', e >= 0 && e < 0.25, EX.x, {at: T.infijar, hit: 0.05, gain: 2.2});
  cueSfx('wind', 'c9s8-dust', t >= T.ghubar && t < T.ghubar + 0.3, 700, {at: T.ghubar, gain: 0.7});
  const fb = ease.out(clamp01(e / 0.7));
  const rise = ease.out(clamp01((e - 0.2) / 1.6));
  return (
    <g>
      <WarWorld t={t} id="c9s8w" />
      <g transform={`translate(${sx} ${sy})`}>
        <path d="M-40 1100 L-40 880 Q400 840 900 862 Q1400 880 1960 850 L1960 1100 Z" fill="#1A0810" stroke={OUT} strokeWidth={8} />
        <ellipse cx={PL.x} cy={PL.y + PL.h / 2 - 6} rx={300} ry={30} fill="#000000" opacity={0.45} />
        <HeroObject t={t} at={T.s8 + 0.05} src="ar-costly-mistakes/el/nuclear-plant.png" ar={1.124} x={PL.x} y={PL.y} h={PL.h} glow="#FF5A6A" enter="rise" float={false} sparkles={0} id="c9s8p" />
        {/* the dust — yellow-green puffs billowing west (left) with the wind */}
        {t >= T.ghubar - 0.2 && Array.from({length: 22}, (_, i) => {
          const at = T.ghubar - 0.2 + i * 0.06;
          const u = clamp01((t - at) / 2.4);
          if (u <= 0) return null;
          const k = ease.out(u);
          const x = EX.x - 60 - (300 + rand(i * 3) * 900) * k, y = EX.y - 160 + (rand(i * 7) - 0.5) * 240 + 120 * k;
          const r = lerp(30, 70 + rand(i) * 70, k);
          return <circle key={i} cx={x} cy={y} r={r} fill={i % 3 ? TOX : '#A9C83A'} opacity={0.42 * Math.min(1, u * 5) * (1 - 0.4 * u)} />;
        })}
        {/* the fireball + column */}
        {e >= 0 && (
          <g opacity={1 - clamp01((e - 2) / 0.8) * 0.4}>
            <Glow x={EX.x} y={EX.y} r={520 * fb} color="#FF7A2A" o={0.8} id="c9s8g" />
            <rect x={EX.x - 40 * fb} y={EX.y - 280 * rise} width={80 * fb} height={280 * rise} rx={30} fill="#FF8A2A" stroke={OUT} strokeWidth={8} />
            {[[-1, 0], [1, 0], [0, -0.5], [-0.55, -0.45], [0.55, -0.45], [0, 0.2]].map(([dx, dy], i) => (
              <circle key={i} cx={EX.x + dx * 110 * rise} cy={EX.y - 300 * rise + dy * 90 * rise} r={(50 + 75 * rise) * (i === 2 ? 1.1 : 1)} fill={i % 2 ? '#4A2630' : '#6A3034'} stroke={OUT} strokeWidth={7} />
            ))}
            <ellipse cx={EX.x} cy={EX.y - 290 * rise + 30 * rise} rx={150 * rise} ry={36 * rise} fill="#FF7A2A" opacity={0.85} />
            <circle cx={EX.x} cy={EX.y} r={190 * fb} fill="#FF5A2A" stroke={OUT} strokeWidth={9} />
            <circle cx={EX.x} cy={EX.y - 10} r={130 * fb} fill="#FFB23A" />
            <circle cx={EX.x} cy={EX.y - 20} r={70 * fb} fill="#FFF3C0" />
            {Array.from({length: 16}, (_, i) => {
              const a = -Math.PI * (0.05 + 0.9 * rand(i * 11));
              const v = 260 + rand(i * 5) * 420;
              const u = clamp01(e / 1.1);
              const k = ease.out(u);
              return <circle key={i} cx={EX.x + Math.cos(a) * v * k} cy={EX.y + Math.sin(a) * v * k + 380 * u * u} r={9 + rand(i) * 8} fill={i % 2 ? '#FFC928' : '#FF7A2A'} stroke={OUT} strokeWidth={3} opacity={1 - u} />;
            })}
          </g>
        )}
      </g>
      {e >= 0 && e < 0.6 && <Flash t={t} at={T.infijar} strength={0.7} color="#FFE6C0" />}
    </g>
  );
};

// S9 · 561.36 · «انتشر على مساحات ضخمة» — the radioactive tint spreads from the pin
const SPREAD = ['Belarus', 'Ukraine', 'Russia'];
export const S9: React.FC<{t: number}> = ({t}) => {
  const cam = {cx: CH[0] + 120, cy: CH[1] - 20, z: 0.86};
  const u = ease.inOut(clamp01((t - (T.s9 + 0.2)) / 1.3));
  const cid = uid('c9s9', 'clip');
  const gid = uid('c9s9', 'grad');
  cueSfx('whoosh', 'c9s9-spread', t >= T.s9 + 0.2 && t < T.s9 + 0.5, 960, {at: T.s9 + 0.2, hit: 0.6, gain: 0.7});
  const [px, py] = mapScr(cam, [CH[0] + 120, CH[1] - 260]);
  return (
    <MapWorld t={t} cam={cam} id="c9s9" ukr={1}
      over={<NPill text="مساحات ضخمة" x={px} y={Math.max(170, py)} size={60} kind="red" id="c9s9p" p={(t - (T.dakhma - 0.05)) / 0.3} />}>
      <defs>
        <clipPath id={cid}><path d={countryD(REGION, 1920, 1080, SPREAD)} /></clipPath>
        <radialGradient id={gid}>
          <stop offset="0" stopColor={TOX} stopOpacity={0.95} />
          <stop offset="0.7" stopColor={TOX} stopOpacity={0.65} />
          <stop offset="1" stopColor={TOX} stopOpacity={0.15} />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${cid})`}>
        <ellipse cx={CH[0] + 90 * u} cy={CH[1] - 110 * u} rx={40 + 620 * u} ry={30 + 420 * u} fill={`url(#${gid})`} transform={`rotate(-18 ${CH[0]} ${CH[1]})`} />
      </g>
      <Pin t={t} at={-1} z={cam.z} pulse />
    </MapWorld>
  );
};

// ==================================================================================================================
// S10 · 563.16 · «هنا ما نتكلم عن غلطة شخص واحد» — one operator in a spotlight
export const S10: React.FC<{t: number}> = ({t}) => {
  const wide = ease.inOut(clamp01((t - (T.wahid - 0.1)) / 0.5));
  return (
    <g>
      <RoomWorld t={t} id="c9s10r" />
      <rect x={0} y={0} width={1920} height={1080} fill="#05030F" opacity={0.68} />
      <Spotlight x={960} y={990} w={lerp(460, 1100, wide)} id="c9s10s" o={0.9} />
      <StoryPerson x={960} y={1010} s={1.55} role="engineer" pose={t >= T.ghalta ? 'think' : 'idle'} t={t} id="c9s10p" />
      {/* the console in front of him */}
      <path d="M260 820 L1660 820 L1760 1100 L160 1100 Z" fill="#20243A" stroke={OUT} strokeWidth={10} strokeLinejoin="round" />
      <rect x={300} y={832} width={1320} height={16} rx={8} fill="#FFFFFF" opacity={0.08} />
      {Array.from({length: 22}, (_, i) => {
        const x = 360 + i * 57, y = 880 + (i % 2) * 40;
        const c = [CYAN, '#2EE88B', '#FFC928', '#FF5A6A'][i % 4];
        return <circle key={i} cx={x} cy={y} r={11} fill={c} opacity={0.55 + 0.45 * Math.sin(t * 3 + i * 1.7)} stroke={OUT} strokeWidth={3} />;
      })}
      <MarkPill t={t} at={T.wahid - 0.08} text="مو غلطة شخص واحد" x={1390} y={380} mark="cross" size={52} id="c9s10m" />
    </g>
  );
};

// S11 · 565.08 · «نتكلم عن سلسلة قرارات، كل واحدة شكلها صغيرة لحالها» — 8 small switches flip one by one (right → left)
const SW_N = 8;
const swX = (i: number) => 1700 - i * 165;
const swAt = (i: number) => T.silsila + i * ((T.saghira - 0.05 - T.silsila) / (SW_N - 1));
export const S11: React.FC<{t: number}> = ({t}) => {
  const k = ease.inOut(clamp01((t - (T.s11 + 0.1)) / 3.0));
  const z = lerp(1.45, 1.0, k), cx = lerp(1560, 960, k), cy = 520;
  const lastFlip = swAt(SW_N - 1);
  const flow = clamp01((t - (lastFlip + 0.1)) / 0.45);
  const hot = clamp01((t - (lastFlip + 0.5)) / 0.3);
  for (let i = 0; i < SW_N; i++) cueSfx('tick', `c9s11-${i}`, t >= swAt(i) && t < swAt(i) + 0.15, swX(i), {at: swAt(i), hit: 0.05});
  cueSfx('error', 'c9s11-hot', t >= lastFlip + 0.5 && t < lastFlip + 0.8, 300, {at: lastFlip + 0.5, gain: 0.6});
  // how far along the wire the red has run: up to the last flipped switch, then on to the reactor
  let lit = 1780;
  for (let i = 0; i < SW_N; i++) if (t >= swAt(i) + 0.1) lit = swX(i);
  if (flow > 0) lit = lerp(swX(SW_N - 1), 340, ease.inOut(flow));
  const sparks = t - lastFlip;
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#121526" />
      <Glow x={960} y={540} r={1000} ry={520} color="#3B4A8A" o={0.45} id="c9s11g" />
      <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
        {/* the console strip */}
        <rect x={160} y={360} width={1700} height={320} rx={30} fill="#262A3C" stroke={OUT} strokeWidth={10} />
        <rect x={190} y={378} width={1640} height={14} rx={7} fill="#FFFFFF" opacity={0.07} />
        <line x1={340} y1={600} x2={1780} y2={600} stroke={OUT} strokeWidth={18} strokeLinecap="round" />
        <line x1={340} y1={600} x2={1780} y2={600} stroke="#4A5070" strokeWidth={8} strokeLinecap="round" />
        <line x1={lit} y1={600} x2={1780} y2={600} stroke="#FF3B4E" strokeWidth={8} strokeLinecap="round" />
        {lit < 1780 && <line x1={lit} y1={600} x2={1780} y2={600} stroke="#FF3B4E" strokeWidth={22} strokeLinecap="round" opacity={0.25} />}
        {Array.from({length: SW_N}, (_, i) => <Toggle key={i} x={swX(i)} y={510} on={clamp01((t - swAt(i)) / 0.14)} s={0.95} />)}
        <Reactor x={250} y={540} r={84} hot={hot} t={t} id="c9s11r" />
        {sparks >= 0 && sparks < 0.7 && Array.from({length: 8}, (_, i) => {
          const a = -Math.PI * (0.1 + 0.8 * rand(i * 13));
          const u = clamp01(sparks / 0.6), kk = ease.out(u);
          return <Sparkle key={i} x={swX(SW_N - 1) + Math.cos(a) * 110 * kk} y={450 + Math.sin(a) * 110 * kk} r={12} o={1 - u} color={i % 2 ? '#FFC928' : '#FFFFFF'} />;
        })}
      </g>
      <NPill text="كل واحدة صغيرة" x={1060} y={830} size={56} kind="grey" id="c9s11p" p={(t - (T.saghira - 0.05)) / 0.3} />
    </g>
  );
};

// S12 · 569.24 · «بيلاروسيا، الدولة الجارة، يقولون إن تقريبًا ربع أراضيها تلوثت» — zoom on Belarus, its SE quarter poisoned
export const S12: React.FC<{t: number}> = ({t}) => {
  const by = proj(28, 53.6);
  const k = ease.inOut(clamp01((t - T.s12) / 1.0));
  const cam = {cx: lerp(CH[0] + 120, by[0], k), cy: lerp(CH[1] - 20, by[1] + 40, k), z: lerp(0.86, 1.7, k)};
  const dB = countryD(REGION, 1920, 1080, ['Belarus']);
  const dim = clamp01((t - (T.jara - 0.1)) / 0.4);
  const tox = ease.out(clamp01((t - (T.rub - 0.1)) / 0.6));
  cueSfx('thump', 'c9s12-tox', t >= T.rub - 0.1 && t < T.rub + 0.2, 1100, {at: T.rub - 0.1, hit: 0.2});
  const cid = uid('c9s12', 'clip'), hid = uid('c9s12', 'hatch');
  const [bx, byy] = mapScr(cam, proj(27, 54.4));
  const [tx, ty] = mapScr(cam, proj(29.6, 52.0));
  return (
    <MapWorld t={t} cam={cam} id="c9s12" ukr={1}
      over={
        <>
          <NPill text="بيلاروسيا" x={bx} y={byy} size={60} kind="gold" id="c9s12b" p={(t - (T.s12 + 0.05)) / 0.3} />
          <NPill text="ربع أراضيها تلوثت" x={Math.min(1560, tx + 120)} y={Math.min(900, ty + 150)} size={52} kind="red" id="c9s12r" p={(t - (T.talawath - 0.25)) / 0.3} />
        </>
      }>
      <defs>
        <clipPath id={cid}><path d={dB} /></clipPath>
        <pattern id={hid} width={22} height={22} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={22} height={22} fill={TOX} />
          <rect width={8} height={22} fill={TOX_D} />
        </pattern>
      </defs>
      {/* Ukraine dims: the story is Belarus now */}
      <path d={countryD(REGION, 1920, 1080, ['Ukraine'])} fill="#2A2238" opacity={0.45 * dim} />
      <path d={dB} fill="#F1E2B0" stroke={OUT} strokeWidth={9} strokeLinejoin="round" />
      <g clipPath={`url(#${cid})`}>
        <circle cx={CH[0] + 20} cy={CH[1] - 20} r={300 * tox} fill={`url(#${hid})`} opacity={0.92} />
      </g>
      <path d={dB} fill="none" stroke={GOLD} strokeWidth={7} strokeLinejoin="round" opacity={0.9} />
      <Pin t={t} at={-1} z={cam.z} />
    </MapWorld>
  );
};

// ==================================================================================================================
// S13 · 574.06 · «وأكثر من مليونين إنسان عاشوا في المناطق المتضررة» — a crowd of people fills the frame, then tints grey-red
const MG = {cols: 30, rows: 11};
export const S13: React.FC<{t: number}> = ({t}) => (
  <g>
    <WarWorld t={t} id="c9s13w" embers={14} />
    <rect x={0} y={0} width={1920} height={1080} fill="#0B0614" opacity={0.35} />
    <MassGrid t={t} at={T.milyonin - 0.1} x={960} y={600} w={1560} h={560} cols={MG.cols} rows={MG.rows} dur={1.2}
      node={(i) => {
        const r = Math.floor(i / MG.cols);
        const k = clamp01((t - (T.mutadarrira - 0.1 + (MG.rows - 1 - r) * 0.07)) / 0.3);
        const c = k > 0.5 ? '#C77A80' : '#FFFFFF';
        return <g opacity={1 - 0.25 * k}><Human color={c} s={1.25} /></g>;
      }} />
    <NPill text="أكثر من مليونين إنسان" x={960} y={200} size={60} kind="white" id="c9s13p" p={(t - (T.milyonin - 0.05)) / 0.3} />
  </g>
);

// S14 · 577.82 · «وفي سنة 1986 لحالها أكثر من 22 ألف شخص اضطروا يتركون بيوتهم» — dusk village; families walk away, lights go out
const HOUSES = [{x: 640, y: 660}, {x: 1020, y: 640}, {x: 1400, y: 660}];
const WALKERS: {role: 'woman' | 'man' | 'child' | 'oldMan'; x: number; s: number}[] = [
  {role: 'man', x: 1610, s: 0.8}, {role: 'woman', x: 1700, s: 0.78}, {role: 'child', x: 1775, s: 0.8}, {role: 'oldMan', x: 1850, s: 0.78},
];
export const S14: React.FC<{t: number}> = ({t}) => {
  const did = uid('c9s14', 'dark');
  return (
    <g>
      <SunsetWorld t={t} id="c9s14s" skyline="town" />
      <rect x={0} y={0} width={1920} height={1080} fill="#2A1626" opacity={0.5} />
      <defs>
        <filter id={did} x="-10%" y="-10%" width="120%" height="120%">
          <feComponentTransfer>
            <feFuncR type="linear" slope={0.32} />
            <feFuncG type="linear" slope={0.3} />
            <feFuncB type="linear" slope={0.42} />
          </feComponentTransfer>
        </filter>
      </defs>
      <path d="M-40 1100 L-40 840 Q500 810 960 828 Q1460 846 1960 818 L1960 1100 Z" fill="#2B1A2C" stroke={OUT} strokeWidth={8} />
      {HOUSES.map((h, i) => {
        const off = clamp01((t - (T.yatrukun + i * 0.4)) / 0.35);
        cueSfx('click', `c9s14-off${i}`, t >= T.yatrukun + i * 0.4 && t < T.yatrukun + i * 0.4 + 0.2, h.x, {at: T.yatrukun + i * 0.4, gain: 0.5});
        return (
          <g key={i}>
            <Glow x={h.x} y={h.y} r={240} color="#FFB060" o={0.45 * (1 - off)} id={'c9s14g' + i} />
            <ellipse cx={h.x} cy={h.y + 180} rx={190} ry={22} fill="#000000" opacity={0.4} />
            <HeroObject t={t} at={T.s14 - 1} src="ar-costly-mistakes/el/small-house.png" ar={1.052} x={h.x} y={h.y} h={380} glow="#FFB060" float={false} shine={false} sparkles={0} id={'c9s14h' + i} />
            {off > 0 && (
              <g opacity={off} filter={`url(#${did})`}>
                <HeroObject t={t} at={T.s14 - 1} src="ar-costly-mistakes/el/small-house.png" ar={1.052} x={h.x} y={h.y} h={380} glow="#20203A" float={false} shine={false} sparkles={0} id={'c9s14d' + i} />
              </g>
            )}
          </g>
        );
      })}
      {WALKERS.map((w, i) => {
        const at = T.idtarru + i * 0.15;
        const [x] = move(t, at, [w.x, 0], [w.x - 2100, 0], 4.6, ease.inOut);
        return <StoryPerson key={i} x={x} y={968} s={w.s} role={w.role} prop={w.role === 'child' ? undefined : 'briefcase'} pose={t >= at ? 'walk' : 'idle'} flip={t < at} rim="#C9B8D8" t={t} id={'c9s14p' + i} />;
      })}
      <YearBadge t={t} at={T.y1986 - 0.1} year={1986} x={1640} y={200} id="c9s14y" size={110} />
      <NPill text="أكثر من 22 ألف شخص" x={960} y={190} size={58} kind="white" id="c9s14p" p={(t - (T.k22 - 0.05)) / 0.3} />
    </g>
  );
};

// ==================================================================================================================
// S15 · 584.62 · «وحكومة بيلاروسيا قدّرت خسارتها لحالها بحوالي 235 مليار دولار» — the count
const BEL_BOX: [[number, number], [number, number]] = [[23, 51.2], [33, 56.3]];
export const S15: React.FC<{t: number}> = ({t}) => {
  const dB = countryD(BEL_BOX, 340, 300, ['Belarus']);
  const land = clamp01((t - T.dollar2) / 0.4);
  return (
    <g>
      <WarWorld t={t} id="c9s15w" />
      {land > 0 && <g opacity={0.55 * land}><Rays t={t} id="c9s15r" tone="red" x={1160} y={600} /></g>}
      <Pop t={t} at={T.bel - 0.15} x={1600} y={260}>
        <g transform="translate(1430 110)">
          <path d={dB} fill="#000000" opacity={0.3} transform="translate(8 12)" />
          <path d={dB} fill="#E2343F" stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
        </g>
      </Pop>
      <NPill text="حكومة بيلاروسيا" x={1600} y={470} size={52} kind="white" id="c9s15p" p={(t - (T.bel - 0.05)) / 0.3} />
      <Glow x={1100} y={640} r={560} ry={260} color={RED} o={0.35} id="c9s15g" />
      <CountNumber t={t} at={T.n235 - 0.05} dur={T.dollar2 - T.n235 + 0.05} value="235 مليار $" x={1100} y={660} size={170} tone="gold" id="c9s15c" />
    </g>
  );
};

// S16 · 590.50 · «يعني ميزانية الدولة كاملة وقتها 32 مرة» — the whole state budget vs 32 times it
const BX = 1440, BLEN = 800;
export const S16: React.FC<{t: number}> = ({t}) => {
  const k = ease.inOut(clamp01((t - 591.9) / 0.9));
  const z = lerp(1.7, 1.0, k), cx = lerp(1330, 1040, k), cy = lerp(520, 620, k);
  const slam = clamp01((t - (T.n32 - 0.05)) / 0.2);
  const pi = pressIn(slam);
  cueSfx('boom', 'c9s16-32', t >= T.n32 - 0.05 && t < T.n32 + 0.2, 1040, {at: T.n32 - 0.05, hit: 0.1, gain: 1.8});
  cueSfx('whoosh', 'c9s16-bar', t >= 591.95 && t < 592.2, 1000, {at: 591.95, hit: 0.3, gain: 0.7});
  const br = clamp01((t - (T.n32 - 0.3)) / 0.3);
  return (
    <g>
      <WarWorld t={t} id="c9s16w" />
      <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
        <NBars t={t} x={BX} y={540} len={BLEN} gap={220} thick={44} id="c9s16b" bars={[
          {label: 'ميزانية الدولة كاملة', value: 1, at: T.mizania - 0.1, color: 'cyan'},
          {label: '235 مليار $', value: 32, at: 591.95, color: 'hot', kind: 'red'},
        ]} />
        {br > 0 && (
          <g opacity={br}>
            <path d={`M${BX - BLEN} 800 V820 H${BX} V800`} fill="none" stroke={GOLD} strokeWidth={6} strokeDasharray="20 12" strokeLinejoin="round" />
          </g>
        )}
      </g>
      {slam > 0 && (
        <g transform={`translate(1040 900) scale(${pi.s})`} opacity={pi.o}>
          <GlowText text="32 مرة" x={0} y={0} size={120} tone="gold" id="c9s16x" />
        </g>
      )}
    </g>
  );
};

// S17 · 594.22 · «وفي باحثين قدّروا التكلفة على الدول الثلاث … بحوالي 700 مليار دولار خلال 30 سنة» — the gauge climbs
const GX = 1000, GY = 520;
const FLAGS: string[][] = [['#C8102E', '#C8102E', '#007A3D'], ['#0057B7', '#FFD700'], ['#FFFFFF', '#0039A6', '#D52B1E']];
const FlagDisc: React.FC<{x: number; y: number; r: number; cols: string[]; id: string}> = ({x, y, r, cols, id}) => {
  const cid = uid('c9flag', id);
  const n = cols.length;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><clipPath id={cid}><circle r={r} /></clipPath></defs>
      <g clipPath={`url(#${cid})`}>
        {cols.map((c, i) => <rect key={i} x={-r} y={-r + (2 * r * i) / n} width={2 * r} height={(2 * r) / n + 1} fill={c} />)}
      </g>
      <circle r={r} fill="none" stroke={OUT} strokeWidth={7} />
    </g>
  );
};
const GaugeScene: React.FC<{t: number; id: string; live: boolean}> = ({t, id, live}) => (
  <NGauge t={t} x={GX} y={GY} h={520} id={id} ticks={live ? [
    {at: T.qaddaru, level: 0.3, label: '235 مليار $'},
    {at: T.n700 - 0.05, level: 0.92, label: '700 مليار $', kind: 'gold'},
  ] : [{at: 0, level: 0.92, label: '700 مليار $', kind: 'gold'}]} />
);
export const S17: React.FC<{t: number}> = ({t}) => (
  <g>
    <WarWorld t={t} id="c9s17w" />
    <Glow x={GX} y={GY} r={520} ry={420} color={RED} o={0.3} id="c9s17g" />
    <StoryPerson x={1640} y={1000} s={1.15} role="scientist" prop="clipboard" pose={t >= T.thalath ? 'point' : 'hold'} t={t} id="c9s17p" />
    <GaugeScene t={t} id="c9s17n" live />
    {FLAGS.map((f, i) => (
      <Pop key={i} t={t} at={T.thalath - 0.1 + i * 0.1} x={GX - 110 + i * 110} y={170}>
        <FlagDisc x={GX - 110 + i * 110} y={170} r={42} cols={f} id={'c9s17f' + i} />
      </Pop>
    ))}
    <NPill text="3 دول" x={GX + 260} y={170} size={50} kind="white" id="c9s17d" p={(t - (T.thalath + 0.2)) / 0.3} />
    <NPill text="خلال 30 سنة" x={GX} y={860} size={50} kind="grey" id="c9s17y" p={(t - (T.n30 - 0.05)) / 0.3} />
  </g>
);

// S18 · 601.72 · «وهم بنفسهم يقولون إن هذا تقدير مبني على افتراضات وفيه شك كبير» — clouds roll in over the gauge
const Fog: React.FC<{t: number; o: number; seed: number}> = ({t, o, seed}) => (
  <g opacity={o} fill="#3A4259">
    {Array.from({length: 6}, (_, i) => {
      const x = 500 + i * 300 + noise1(t * 0.25, seed + i) * 120, y = 860 + (i % 2) * 70 + noise1(t * 0.3 + 4, seed + i) * 20;
      const r = 150 + rand(seed + i) * 80;
      return <g key={i} opacity={0.75}><circle cx={x} cy={y} r={r} /><circle cx={x + r * 0.8} cy={y + 30} r={r * 0.7} /></g>;
    })}
  </g>
);
export const S18: React.FC<{t: number}> = ({t}) => {
  const qy = lerp(260, 175, ease.out(clamp01((t - (T.shakk - 0.1)) / 0.5)));
  cueSfx('thump', 'c9s18-q', t >= T.shakk - 0.1 && t < T.shakk + 0.2, 1420, {at: T.shakk - 0.1, hit: 0.15});
  const qo = clamp01((t - (T.shakk - 0.1)) / 0.25);
  return (
    <g>
      <CloudWorld t={t} id="c9s18c" />
      <g opacity={0.8}><GaugeScene t={t} id="c9s18n" live={false} /></g>
      <StoryPerson x={1640} y={1000} s={1.15} role="scientist" pose="up" t={t} id="c9s18p" />
      <BlueprintCard t={t} at={T.s18 + 0.15} x={1600} y={380} w={300} h={210} rot={-6} id="c9s18b" />
      <Fog t={t} o={0.85} seed={20} />
      {qo > 0 && (
        <g opacity={qo}>
          <GlowText text="؟" x={GX + 217} y={qy} size={150} tone="gold" id="c9s18q" />
        </g>
      )}
      <NPill text="تقدير مبني على افتراضات" x={1100} y={900} size={50} kind="grey" id="c9s18a" p={(t - (T.iftiradat - 0.1)) / 0.3} />
    </g>
  );
};

// S19 · 606.34 · «يعني الرقم الحقيقي ما أحد يعرفه» — the number dissolves into the fog; a «؟» tile takes its place
const M19 = {x: 1180, y: 430};
export const S19: React.FC<{t: number}> = ({t}) => {
  const blur = clamp01((t - (T.s19 + 0.2)) / 0.7);
  const bid = uid('c9s19', 'blur');
  return (
    <g>
      <CloudWorld t={t} id="c9s19c" />
      <Glow x={M19.x} y={M19.y} r={420} ry={280} color={GOLD} o={0.25 + 0.2 * clamp01((t - T.haqiqi) / 0.3)} id="c9s19g" />
      <defs>
        <filter id={bid} x="-40%" y="-80%" width="180%" height="260%"><feGaussianBlur stdDeviation={0.01 + 16 * blur} /></filter>
      </defs>
      {t < T.haqiqi + 0.2 && (
        <g filter={`url(#${bid})`} opacity={1 - clamp01((t - (T.haqiqi - 0.25)) / 0.4)}>
          <NPill text="700 مليار $" x={M19.x} y={M19.y} size={88} kind="gold" id="c9s19p" />
        </g>
      )}
      <MysteryTile t={t} at={T.haqiqi - 0.1} x={M19.x} y={M19.y} w={440} h={290} id="c9s19t" />
      <Fog t={t} o={0.9} seed={40} />
      <CWords t={t} cx={M19.x} y={780} size={120} id="c9s19w" words={[{w: 'ما', at: T.ma - 0.05}, {w: 'أحد', at: T.ahad - 0.05}, {w: 'يعرفه', at: T.yarifuh - 0.08, tone: 'red', enter: 'pop'}]} />
    </g>
  );
};

// S20 · 608.56 · «وهذي السنة كملت 40 سنة على الحادثة، والدول المتضررة للحين تصرف على آثارها» — the bill is still being paid
const TILES = [{name: 'Belarus', box: [[23, 51.2], [33, 56.3]] as [[number, number], [number, number]], x: 760},
  {name: 'Ukraine', box: [[22, 44.3], [40.3, 52.4]] as [[number, number], [number, number]], x: 1000},
  {name: 'Russia', box: [[27, 41], [70, 70]] as [[number, number], [number, number]], x: 1240}];
const BAR = {x: 1000, y: 700, h: 330};
export const S20: React.FC<{t: number}> = ({t}) => {
  const out = T.end - 0.2;
  const fo = 1 - clamp01((t - out) / 0.25);
  const yPos = move(t, T.duwal - 0.45, [1150, 400], [1590, 280], 0.55);
  const yS = lerp(1, 0.68, ease.inOut(clamp01((t - (T.duwal - 0.45)) / 0.55)));
  cueSfx('coins', 'c9s20-drip', t >= T.tasrif - 0.1 && t < T.tasrif + 0.2, BAR.x, {at: T.tasrif - 0.1, gain: 0.6});
  return (
    <g>
      <NightSky t={t} id="c9s20s" />
      <GridFloor id="c9s20f" t={t} />
      <Glow x={BAR.x} y={BAR.y} r={520} ry={300} color={TOX} o={0.22} id="c9s20g" />
      <g opacity={fo}>
        {/* the years: big in the middle first, then they step aside to the top-right for the barrel */}
        <g transform={`translate(${yPos[0]} ${yPos[1]}) scale(${yS}) translate(-1150 -400)`}>
          <YearBadge t={t} at={T.s20 + 0.1} year={2026} from={1986} x={1150} y={400} id="c9s20y" size={170} />
          <NPill text="40 سنة" x={1150} y={600} size={76} kind="green" id="c9s20p" p={(t - (T.n40 - 0.08)) / 0.3} />
        </g>
        {/* the barrel the bills keep falling into */}
        {t >= T.duwal && <ellipse cx={BAR.x} cy={BAR.y + BAR.h / 2 - 4} rx={150} ry={22} fill="#000000" opacity={0.45} />}
        <HeroObject t={t} at={T.duwal + 0.1} src="ar-costly-mistakes/el/radiation-barrel.png" ar={0.603} x={BAR.x} y={BAR.y} h={BAR.h} glow={TOX} enter="drop" float={false} sparkles={2} id="c9s20b" />
        {TILES.map((c, i) => {
          const at = T.duwal - 0.05 + i * 0.12;
          return (
            <Pop key={i} t={t} at={at} x={c.x} y={250}>
              <g transform={`translate(${c.x} 250)`}>
                <rect x={-95 + 6} y={-80 + 8} width={190} height={160} rx={22} fill="#000000" opacity={0.35} />
                <rect x={-95} y={-80} width={190} height={160} rx={22} fill="#1A1430" stroke={OUT} strokeWidth={8} />
                <rect x={-95} y={-80} width={190} height={160} rx={22} fill="none" stroke="#C9B8D8" strokeWidth={3} />
                <g transform="translate(-75 -62)">
                  <path d={countryD(c.box, 150, 124, [c.name])} fill="#E2343F" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
                </g>
              </g>
            </Pop>
          );
        })}
        {/* coins drip from each country into the barrel — endlessly */}
        {TILES.map((c, i) => Array.from({length: 6}, (_, j) => {
          const at = T.tasrif - 0.1 + i * 0.16 + j * 0.42;
          const u = clamp01((t - at) / 0.7);
          if (u <= 0 || u >= 1) return null;
          const k = ease.in(u);
          const [x, y] = [lerp(c.x, BAR.x + (i - 1) * 40, k), lerp(340, BAR.y - BAR.h / 2 + 40, k)];
          return <g key={`${i}-${j}`} opacity={Math.min(1, (1 - u) * 5)}><Coin x={x} y={y} r={24} t={t} spin={1.5} phase={i + j} /></g>;
        }))}
      </g>
      <WhooshOut t={t} at={out} />
    </g>
  );
};
