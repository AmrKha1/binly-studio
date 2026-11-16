// Custom shots for C11 (builder-owned, AZTIKA). Each: export const S<n>: React.FC<{t: number}> returning the shot's WORLD
// (SVG, no <Stage>/<NightScreen> — the chapter provides them; NightShots joins, drifts and pins the host).
// C11 · «الباب اللي انفتح» — the price of the Suez signature, paid year by year (ref war ladder, shots-05 #128–#134).
// SERIOUS tone. Screen coordinates (NightScreen: no mirroring). AZTIKA: peekRight (x ≈ 1450–1870, y > 570) in S1–S2 and
// S8 → keep that corner clear; sideLeft (x < 700) from S12 → keep the left clear. OFF in the mini-story S3–S7, S9–S11.
import React from 'react';
import {clamp01, ease, lerp, noise1, rand} from '../../../kit/anim';
import {uid} from '../../../kit/stage';
import {GlowText, GridFloor, NightSky, NPill, Sparkle, WordPop, YearBadge, textWidth} from '../../../kit/night';
import type {PopWord} from '../../../kit/night';
import {CountNumber, Flash, HeroObject, Mark, Rays} from '../../../kit/night-fx';
import {PaperMap, RoomWorld, StoryPerson, SunsetWorld} from '../../../kit/night-worlds';
import {CalendarCard, NBars, WarWorld} from '../../../kit/night-data';
import {PlateFx} from '../../../kit/night-places';
import {NightMap, nightProj} from '../../../kit/night-maps';
import {countryD} from '../../../kit/geo';
import {move, moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {ConsequenceTrain, FateDoor} from '../shared';
import type {ConsequenceTile} from '../shared';
import {OUT, popAt} from '../shared/util';

const T = {
  s1: 686.66, wesh: 687.26, bay: 688.98, mahal: 689.5, // «طيب، وش صار بعدها؟ المشكلة إن البيع ما حل شيء»
  s2: 689.86, akbar: 691.14, safqa: 691.6, // «الديون كانت أكبر من الصفقة»
  s3: 692.08, sana: 692.43, ajz: 694.0, // «وفي السنة اللي بعدها مصر أعلنت عجزها»
  s4: 694.96, brit: 695.76, fra: 696.34, turaqib: 696.82, yajma: 698.56, yasrif: 699.88, // «بريطانيا وفرنسا تراقب … مين يجمع الفلوس، ومين يصرفها»
  s5: 700.86, y1879: 701.17, ismail: 702.74, inazal: 704.14, // «وفي سنة 1879 إسماعيل نفسه انعزل من الحكم»
  s6: 704.98, y1882: 705.31, dakhalat: 706.74, misr: 708.82, maaraka: 709.48, // «1882 دخلت القوات البريطانية مصر بعد معركة التل الكبير»
  s7: 710.7, ihtilal: 711.25, asharat: 712.46, fall: 712.9, // «وبدأ احتلال استمر عشرات السنين»
  s8: 713.54, amana: 714.22, sabab: 715.82, duyun: 716.68, marad: 717.78, // «وللأمانة التاريخية، البيع ما كان السبب الوحيد. الديون كانت هي المرض»
  s9: 718.16, safqa2: 718.52, awwal: 719.54, bab: 719.9, infatah: 720.22, walbab: 720.7, // «لكن الصفقة كانت أول باب انفتح. والباب هذا»
  s10: 722.64, lamma: 723.4, jamal: 724.78, ammam: 725.8, qanah: 726.12, // «… 1956، لما جمال عبد الناصر أمّم القناة»
  s11: 726.56, inhajam: 727.46, thalath: 728.24, // «وبعدها مصر انهجم عليها من ثلاث دول»
  s12: 728.84, b4: 729.74, yawm: 730.7, ihtaj: 731.02, n81: 731.78, harb: 733.02, yarja: 733.68, // «بـ4 مليون في يوم، احتاج 81 سنة وحرب عشان يرجع»
  s13: 734.3, dakhalat2: 735.5, y2023: 736.54, hawali: 738.28, n10: 738.64, dollar: 740.42, sana1: 740.76, wahda: 741.1, end: 741.7,
};

const GOLD = '#FFC928', RED = '#FD4B5B', KHAKI = '#8C7A48';
const EL = (n: string) => `ar-costly-mistakes/el/${n}.png`;

// ---------------------------------------------------------------- local helpers
const Glow: React.FC<{x: number; y: number; r: number; color: string; o?: number; id: string; ry?: number}> = ({x, y, r, color, o = 1, id, ry}) => {
  if (o <= 0.01) return null;
  const g = uid('c11glow', id);
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

/** a pill that pops on `at` and fades on `out` */
const Pill: React.FC<{t: number; at: number; text: string; x: number; y: number; size?: number; kind?: 'gold' | 'white' | 'grey' | 'red' | 'green'; id: string; out?: number}> = ({t, at, text, x, y, size = 48, kind = 'white', id, out}) => {
  const fo = out === undefined ? 1 : 1 - clamp01((t - out) / 0.2);
  if (fo <= 0) return null;
  return <g opacity={fo}><NPill text={text} x={x} y={y} size={size} kind={kind} id={id} p={(t - at) / 0.3} /></g>;
};

/** a WordPop centred on cx */
const CWords: React.FC<{t: number; words: PopWord[]; y: number; size: number; cx: number; id: string; out?: number}> = ({t, words, y, size, cx, id, out}) => {
  const gap = size * 0.2;
  const tot = words.reduce((a, w) => a + textWidth(w.w, size), 0) + gap * (words.length - 1);
  return <WordPop t={t} words={words} y={y} size={size} right={cx + tot / 2} gap={gap} id={id} out={out} />;
};

/** a world camera: (cx, cy) of the world lands on the screen centre at zoom z */
const camT = (cx: number, cy: number, z: number) => `translate(960 540) scale(${z}) translate(${-cx} ${-cy})`;

/** a gold sovereign coin */
const Sov: React.FC<{x: number; y: number; r?: number; rot?: number}> = ({x, y, r = 30, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <circle r={r} fill="#E0A10E" stroke={OUT} strokeWidth={5} />
    <circle r={r * 0.72} fill="#FCC94A" />
    <circle r={r * 0.5} fill="none" stroke="#C88A08" strokeWidth={3} />
    <rect x={-r * 0.55} y={-r * 0.62} width={r * 0.22} height={r * 0.6} rx={r * 0.1} fill="#FFFFFF" opacity={0.6} />
  </g>
);

/** the tarboush (fez), drawn with its bottom centre on 0,0, `s` 1 ≈ 90 px wide */
const Tarboush: React.FC<{s?: number}> = ({s = 1}) => (
  <g transform={`scale(${s})`}>
    <path d="M-45 0 L-35 -70 Q0 -80 35 -70 L45 0 Q0 9 -45 0 Z" fill="#C8283A" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
    <ellipse cx={0} cy={-71} rx={35} ry={8} fill="#A81E2E" stroke={OUT} strokeWidth={5} />
    <rect x={-28} y={-62} width={8} height={52} rx={4} fill="#FFFFFF" opacity={0.3} />
    <path d="M0 -74 Q30 -70 38 -30" fill="none" stroke="#14101E" strokeWidth={6} strokeLinecap="round" />
    <path d="M34 -36 L44 -14 L30 -16 Z" fill="#14101E" />
  </g>
);

// ---- tile icons (≈ 120 px, centred on 0,0)
const IconContract = () => (
  <g>
    <rect x={-44} y={-58} width={88} height={116} rx={8} fill="#FFF7E4" stroke={OUT} strokeWidth={6} />
    {[-34, -16, 2].map((y) => <rect key={y} x={-28} y={y} width={56} height={7} rx={3.5} fill="#B9AD95" />)}
    <path d="M-28 30 Q-14 18 -4 32 T20 28" fill="none" stroke="#2A4A9A" strokeWidth={5} strokeLinecap="round" />
    <circle cx={26} cy={42} r={17} fill={GOLD} stroke={OUT} strokeWidth={5} />
  </g>
);
const IconPurse = () => (
  <g>
    <path d="M-30 -38 Q0 -30 30 -38 L22 -24 Q56 0 50 30 Q44 58 0 58 Q-44 58 -50 30 Q-56 0 -22 -24 Z" fill="#B9874E" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-24 -24 Q0 -16 24 -24" fill="none" stroke="#6E4A22" strokeWidth={6} strokeLinecap="round" />
    <rect x={-36} y={-6} width={8} height={44} rx={4} fill="#FFFFFF" opacity={0.3} />
    <Mark kind="cross" x={34} y={-44} r={24} />
  </g>
);
const IconTarboush = () => (
  <g>
    <g transform="translate(-4 34) rotate(-24)"><Tarboush s={1} /></g>
    <path d="M44 -52 V-8 M30 -22 L44 -6 L58 -22" fill="none" stroke={RED} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
const IconHelmet = () => (
  <g>
    <path d="M-48 14 Q-48 -52 0 -52 Q48 -52 48 14 Z" fill="#EDE3C8" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-66 18 Q0 4 66 18 Q60 32 0 30 Q-60 32 -66 18 Z" fill="#D8CBA8" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-46} y={-8} width={92} height={12} fill="#7A2030" stroke={OUT} strokeWidth={4} />
    <circle cx={0} cy={-56} r={8} fill="#D8CBA8" stroke={OUT} strokeWidth={4} />
    <rect x={-34} y={-40} width={8} height={30} rx={4} fill="#FFFFFF" opacity={0.5} />
  </g>
);

// ---------------------------------------------------------------- THE TRAIN (S3 · S7 · S8): one world, the camera moves over it
const TRAIN = {x: 960, y: 600, gap: 420, tileW: 210, tileH: 400, pill: 56, label: 48};
const SUB_Y = TRAIN.y + 34 + 40 + TRAIN.pill * 2 + TRAIN.label * 0.9 + 90;
const tileX = (i: number) => TRAIN.x + 1.5 * TRAIN.gap - i * TRAIN.gap; // Arabic: the sequence runs right → left
const FALL = [T.fall, T.fall + 0.2, T.fall + 0.4, T.fall + 0.6];
const tiles = (falls: boolean): ConsequenceTile[] => [
  {year: '1875', label: 'البيع', icon: <IconContract />, at: 690.0, fallAt: falls ? FALL[0] : undefined},
  {year: '1876', label: 'أعلنت عجزها', icon: <IconPurse />, at: T.ajz - 0.1, fallAt: falls ? FALL[1] : undefined},
  {year: '1879', label: 'إسماعيل انعزل', icon: <IconTarboush />, at: T.s7 - 0.05, fallAt: falls ? FALL[2] : undefined},
  {year: '1882', label: 'احتلال', icon: <IconHelmet />, at: T.ihtilal - 0.1, fallAt: falls ? FALL[3] : undefined},
];
const Train: React.FC<{t: number; falls: boolean; id: string}> = ({t, falls, id}) => (
  <ConsequenceTrain t={t} x={TRAIN.x} y={TRAIN.y} gap={TRAIN.gap} tileW={TRAIN.tileW} tileH={TRAIN.tileH} pillSize={TRAIN.pill} labelSize={TRAIN.label} tiles={tiles(falls)} id={id} />
);

// ==================================================================================================================
// S1 · 686.66 · «طيب، وش صار بعدها؟ المشكلة إن البيع ما حل شيء» — the signed paper slides left; the debt tube barely moves
export const S1: React.FC<{t: number}> = ({t}) => {
  const [cx] = move(t, T.s1, [960, 0], [600, 0], 0.8);
  const TX = 1240, TOP = 210, BOT = 840, TW = 150;
  const bump = t >= T.bay ? Math.exp(-(t - T.bay) / 0.35) * Math.sin((t - T.bay) * 22) : 0;
  const level = 0.9 - 0.02 * clamp01((t - T.bay) / 0.15) * (t < T.bay + 0.6 ? 1 : 0.5) + 0.012 * bump;
  const ly = lerp(BOT, TOP, level);
  const coinsAt = T.wesh - 0.05;
  cueSfx('coins', 'c11s1-coins', t >= coinsAt && t < coinsAt + 0.4, TX, {at: coinsAt, hit: 0.45});
  cueSfx('thump', 'c11s1-clunk', t >= T.bay && t < T.bay + 0.3, TX, {at: T.bay, hit: 0.08, gain: 0.8});
  const g = uid('c11s1', 'tube');
  return (
    <g>
      <NightSky t={t} id="c11s1k" />
      <GridFloor id="c11s1f" t={t} />
      <Glow x={cx} y={520} r={420} color={GOLD} o={0.35} id="c11s1g" />
      <HeroObject t={t} at={T.s1 - 1} src={EL('contract-blank')} ar={0.941} x={cx} y={520} h={560} glow={GOLD} float={false} sparkles={2} id="c11s1c" />
      {/* the gold seal (C10's stamp) */}
      <g transform={`translate(${cx + 150} ${700})`}>
        <circle r={56} fill="#E0A10E" stroke={OUT} strokeWidth={7} />
        <circle r={40} fill="none" stroke="#FFE7A0" strokeWidth={5} />
        <path d="M-16 0 L-4 13 L20 -14" fill="none" stroke="#FFF4D0" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* the debt tube */}
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FF6A6A" /><stop offset="1" stopColor="#C81E36" /></linearGradient>
        <clipPath id={g + 'c'}><rect x={TX - TW / 2 + 12} y={TOP + 12} width={TW - 24} height={BOT - TOP - 24} rx={(TW - 24) / 2} /></clipPath>
      </defs>
      <Glow x={TX} y={(TOP + BOT) / 2 + 80} r={240} ry={380} color={RED} o={0.55} id="c11s1r" />
      <rect x={TX - TW / 2} y={TOP} width={TW} height={BOT - TOP} rx={TW / 2} fill="#1A1430" stroke={OUT} strokeWidth={9} />
      <g clipPath={`url(#${g}c)`}>
        <rect x={TX - TW / 2} y={ly} width={TW} height={BOT - ly} fill={`url(#${g})`} />
        <rect x={TX - TW / 2} y={ly - 4} width={TW} height={8} fill="#FFC0C0" opacity={0.7} />
      </g>
      <rect x={TX - TW / 2 + 22} y={TOP + 40} width={12} height={BOT - TOP - 80} rx={6} fill="#FFFFFF" opacity={0.25} />
      {/* the needle at the level, wobbling on «البيع» */}
      <g transform={`translate(${TX - TW / 2 - 18} ${ly}) rotate(${bump * 14})`}>
        <path d="M0 0 L-56 -22 L-56 22 Z" fill={RED} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
      </g>
      <NPill text="ديون مصر" x={TX} y={TOP - 66} size={56} kind="red" id="c11s1t" />
      {/* the sovereigns pour in */}
      {Array.from({length: 8}, (_, i) => {
        const a = coinsAt + i * 0.1;
        if (t < a) return null;
        const k = ease.in(clamp01((t - a) / 0.5));
        const y = lerp(-80, TOP + 30, k);
        const o = 1 - clamp01((k - 0.92) / 0.08);
        return <g key={i} opacity={o}><Sov x={TX + (rand(i * 3.1) - 0.5) * 50} y={y} r={30} rot={i * 37 + t * 200} /></g>;
      })}
      <Pill t={t} at={T.wesh + 0.15} text="4 مليون £" x={TX + 260} y={300} size={50} kind="grey" id="c11s1m" />
    </g>
  );
};

// ==================================================================================================================
// S2 · 689.86 · «الديون كانت أكبر من الصفقة» — a long red bar vs a gold stub
export const S2: React.FC<{t: number}> = ({t}) => {
  const RX = 1390;
  const xAt = T.safqa + 0.4;
  cueSfx('thump', 'c11s2-x', t >= xAt && t < xAt + 0.3, 1210, {at: xAt, hit: 0.1, gain: 0.7});
  return (
    <g>
      <NightSky t={t} id="c11s2k" />
      <GridFloor id="c11s2f" t={t} />
      <Glow x={840} y={330} r={700} ry={180} color={RED} o={clamp01((t - T.s2) / 0.6) * 0.35} id="c11s2g" />
      <NBars t={t} x={RX} y={330} len={1110} gap={200} thick={90} id="c11s2b" bars={[
        {label: '100 مليون £', value: 100, at: T.s2 - 0.05, color: 'hot', kind: 'red'},
        {label: '4 مليون £', value: 4, at: T.safqa - 0.1, color: 'gold', kind: 'grey'},
      ]} />
      <Pop t={t} at={T.s2 + 0.1} x={1580} y={330}><GlowText text="الديون" x={1580} y={330} size={72} tone="white" id="c11s2a" /></Pop>
      <Pop t={t} at={T.safqa} x={1580} y={530}><GlowText text="الصفقة" x={1580} y={530} size={72} tone="white" id="c11s2c" /></Pop>
      <Pop t={t} at={xAt} x={1210} y={530}><Mark kind="cross" x={1210} y={530} r={40} /></Pop>
    </g>
  );
};

// ==================================================================================================================
// S3 · 692.08 · «وفي السنة اللي بعدها مصر أعلنت عجزها» — the first two dominoes on a red dusk line
export const S3: React.FC<{t: number}> = ({t}) => (
  <g>
    <WarWorld t={t} id="c11s3w" embers={10} />
    <g transform={camT(1380, 525, 1.1)}>
      <Train t={t} falls={false} id="c11tr3" />
    </g>
    <YearBadge t={t} at={T.sana} year={1876} from={1875} x={1600} y={180} size={100} id="c11s3y" />
  </g>
);

// ==================================================================================================================
// S4 · 694.96 · «وصارت بريطانيا وفرنسا تراقب مالية البلد بنفسها: مين يجمع الفلوس، ومين يصرفها» — two hands on one purse
const Arm: React.FC<{from: [number, number]; to: [number, number]; sleeve: string; cuff: string; rim: string}> = ({from, to, sleeve, cuff, rim}) => {
  const ang = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  return (
    <g transform={`translate(${from[0]} ${from[1]}) rotate(${ang})`}>
      <rect x={-40} y={-50} width={len - 30} height={100} rx={46} fill={sleeve} stroke={OUT} strokeWidth={8} />
      <rect x={len - 120} y={-54} width={46} height={108} rx={14} fill={cuff} stroke={OUT} strokeWidth={7} />
      <rect x={0} y={-36} width={len - 140} height={12} rx={6} fill="#FFFFFF" opacity={0.18} />
      <circle cx={len - 20} cy={0} r={62} fill="#16121F" stroke={rim} strokeWidth={8} />
    </g>
  );
};
export const S4: React.FC<{t: number}> = ({t}) => {
  const PX = 960, PY = 520;
  const L = move(t, T.brit - 0.25, [-160, 300], [PX - 190, PY - 70], 0.6, ease.out);
  const R = move(t, T.fra - 0.25, [2080, 300], [PX + 190, PY - 70], 0.6, ease.out);
  cueSfx('swoosh', 'c11s4-l', t >= T.brit - 0.25 && t < T.brit + 0.1, 400, {at: T.brit - 0.25, hit: 0.3});
  cueSfx('swoosh', 'c11s4-r', t >= T.fra - 0.25 && t < T.fra + 0.1, 1500, {at: T.fra - 0.25, hit: 0.3});
  cueSfx('coins', 'c11s4-in', t >= T.yajma && t < T.yajma + 0.4, 600, {at: T.yajma, hit: 0.3});
  cueSfx('coins', 'c11s4-out', t >= T.yasrif && t < T.yasrif + 0.4, 1400, {at: T.yasrif, hit: 0.3});
  const tug = Math.sin(t * 2.2) * 6;
  // magnifier glides over the ledger
  const [mx, my] = move(t, T.turaqib - 0.15, [1500, 1100], [1060, 860], 0.7);
  const mo = clamp01((t - (T.turaqib - 0.15)) / 0.2);
  cueSfx('swish', 'c11s4-mag', t >= T.turaqib - 0.15 && t < T.turaqib + 0.2, 1200, {at: T.turaqib - 0.15, hit: 0.35});
  // coin streams: purse → left hand (collect) · right hand → off the right edge (spend)
  const stream = (at: number, a: [number, number], b: [number, number], key: string, lift: number) =>
    t < at ? null : Array.from({length: 7}, (_, i) => {
      const ph = ((t - at) * 1.1 - i * 0.17);
      if (ph < 0) return null;
      const u = ph % 1;
      const k = ease.inOut(u);
      const x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k) - Math.sin(Math.PI * k) * lift;
      return <g key={key + i} opacity={Math.min(1, u * 8, (1 - u) * 8)}><Sov x={x} y={y} r={26} rot={u * 360 + i * 40} /></g>;
    });
  return (
    <g>
      <NightSky t={t} id="c11s4k" />
      <Rays t={t} id="c11s4r" tone="dark" x={PX} y={PY} />
      <GridFloor id="c11s4f" t={t} />
      {/* the ledger page under the purse */}
      <g transform="translate(960 870) rotate(-3)">
        <rect x={-330} y={-70} width={660} height={150} rx={12} fill="#FFF4DC" stroke={OUT} strokeWidth={7} />
        {[-36, -6, 24, 54].map((y) => <rect key={y} x={-290} y={y} width={580} height={8} rx={4} fill="#C8B994" />)}
        <rect x={60} y={-60} width={6} height={130} fill="#C8B994" />
      </g>
      {/* the purse */}
      <Glow x={PX} y={PY} r={360} color={GOLD} o={0.45} id="c11s4g" />
      <g transform={`translate(${PX} ${PY + 210}) scale(1 ${1 + 0.01 * Math.sin(t * 2.2)}) translate(${-PX} ${-PY - 210})`}>
        <path d={`M${PX - 120} ${PY - 190} Q${PX} ${PY - 170} ${PX + 120} ${PY - 190} L${PX + 90} ${PY - 130} Q${PX + 250} ${PY - 40} ${PX + 230} ${PY + 90} Q${PX + 210} ${PY + 210} ${PX} ${PY + 210} Q${PX - 210} ${PY + 210} ${PX - 230} ${PY + 90} Q${PX - 250} ${PY - 40} ${PX - 90} ${PY - 130} Z`}
          fill="#C08E52" stroke={OUT} strokeWidth={10} strokeLinejoin="round" />
        <path d={`M${PX - 96} ${PY - 128} Q${PX} ${PY - 104} ${PX + 96} ${PY - 128}`} fill="none" stroke="#6E4A22" strokeWidth={14} strokeLinecap="round" />
        <path d={`M${PX - 40} ${PY - 118} Q${PX - 70} ${PY - 60} ${PX - 30} ${PY - 40}`} fill="none" stroke={GOLD} strokeWidth={9} strokeLinecap="round" />
        <rect x={PX - 180} y={PY - 60} width={18} height={190} rx={9} fill="#FFFFFF" opacity={0.28} />
        <path d={`M${PX - 150} ${PY + 170} Q${PX} ${PY + 196} ${PX + 150} ${PY + 170}`} fill="none" stroke="#8E6234" strokeWidth={8} opacity={0.6} />
      </g>
      <NPill text="مصر" x={PX} y={PY + 60} size={56} kind="white" id="c11s4m" />
      {stream(T.yajma - 0.1, [PX - 60, PY - 150], [L[0] - 40, L[1] - 20], 'in', 120)}
      {stream(T.yasrif - 0.1, [R[0] + 60, R[1]], [1990, 200], 'out', 80)}
      {/* the hands */}
      {t >= T.brit - 0.25 && <Arm from={[-260, 380]} to={[L[0], L[1] + tug]} sleeve="#1F3A7A" cuff="#E8E4D8" rim="#7FD8FF" />}
      {t >= T.fra - 0.25 && <Arm from={[2180, 380]} to={[R[0], R[1] - tug]} sleeve="#2E5EAA" cuff="#E8E4D8" rim="#7FD8FF" />}
      <Pill t={t} at={T.brit} text="بريطانيا" x={470} y={190} size={52} id="c11s4b" out={T.yajma - 0.3} />
      <Pill t={t} at={T.fra} text="فرنسا" x={1450} y={190} size={52} id="c11s4f2" out={T.yasrif - 0.3} />
      <Pill t={t} at={T.yajma} text="يجمع" x={470} y={190} size={52} kind="gold" id="c11s4j" />
      <Pill t={t} at={T.yasrif} text="يصرف" x={1450} y={190} size={52} kind="red" id="c11s4s" />
      {/* the magnifier over the ledger */}
      {mo > 0 && (
        <g opacity={mo}>
          <HeroObject t={t} at={T.turaqib - 0.15} src={EL('magnifier')} ar={1.02} x={mx} y={my} h={260} glow="#7FD8FF" enter="pop" float={false} shine={false} sparkles={0} id="c11s4g2" />
        </g>
      )}
    </g>
  );
};

// ==================================================================================================================
// S5 · 700.86 · «وفي سنة 1879 إسماعيل نفسه انعزل من الحكم» — the tarboush falls, the chair stays empty
const Chair: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-150 0 V-520 Q-150 -620 0 -640 Q150 -620 150 -520 V0" fill="#5A2A7A" stroke={OUT} strokeWidth={10} strokeLinejoin="round" />
    <path d="M-110 -260 V-500 Q-110 -580 0 -594 Q110 -580 110 -500 V-260 Z" fill="#8A3FB8" stroke={OUT} strokeWidth={7} />
    <path d="M-30 -640 L0 -690 L30 -640" fill={GOLD} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
    <circle cx={0} cy={-700} r={16} fill={GOLD} stroke={OUT} strokeWidth={5} />
    <path d="M-150 -520 Q-150 -620 0 -640 Q150 -620 150 -520" fill="none" stroke={GOLD} strokeWidth={9} />
    <rect x={-190} y={-280} width={380} height={70} rx={20} fill="#C8283A" stroke={OUT} strokeWidth={8} />
    <rect x={-200} y={-300} width={46} height={150} rx={14} fill={GOLD} stroke={OUT} strokeWidth={7} />
    <rect x={154} y={-300} width={46} height={150} rx={14} fill={GOLD} stroke={OUT} strokeWidth={7} />
    <rect x={-170} y={-210} width={22} height={210} fill="#3A1A50" stroke={OUT} strokeWidth={6} />
    <rect x={148} y={-210} width={22} height={210} fill="#3A1A50" stroke={OUT} strokeWidth={6} />
    <rect x={-120} y={-560} width={14} height={260} rx={7} fill="#FFFFFF" opacity={0.22} />
  </g>
);
export const S5: React.FC<{t: number}> = ({t}) => {
  const CX = 960, FEET = 1000, S = 1.32;
  const gone = T.inazal + 0.25;
  const [px] = move(t, gone, [CX, 0], [-320, 0], 0.95, ease.in);
  const fallen = t >= T.inazal;
  // the tarboush: knocked off on «انعزل», falls, bounces, rolls right
  const headTop = FEET - 408 * S;
  const u = t - T.inazal;
  let tx = CX, ty = headTop, rot = 0;
  if (fallen) {
    const [rx] = move(t, T.inazal, [CX, 0], [CX + 330, 0], 1.0, ease.out);
    tx = rx;
    const k = clamp01(u / 0.5);
    ty = lerp(headTop, FEET - 8, ease.in(k)) - (u > 0.5 ? Math.abs(Math.sin((u - 0.5) * 7)) * 40 * Math.exp(-(u - 0.5) * 4) : 0);
    rot = moveTo(t, T.inazal, 0, 300, 1.0, ease.out);
  }
  cueSfx('thump', 'c11s5-fall', t >= T.inazal && t < T.inazal + 0.6, CX, {at: T.inazal, hit: 0.5});
  cueSfx('whoosh', 'c11s5-out', t >= gone && t < gone + 0.5, 300, {at: gone, hit: 0.5, gain: 0.6});
  return (
    <g>
      <RoomWorld t={t} id="c11s5r" winX={1420} />
      <Glow x={CX} y={520} r={520} color="#B07CFF" o={0.35} id="c11s5v" />
      <Glow x={CX} y={460} r={300} color={GOLD} o={0.35} id="c11s5g" />
      <Chair x={CX} y={FEET} />
      <StoryPerson x={px} y={FEET} s={S} role="sultan" hat="none" outfit="bisht" body="#2A1A3A" beard="#4A4058" pose={fallen ? 'shock' : 'idle'} t={t} id="c11s5p" />
      <g transform={`translate(${tx} ${ty}) rotate(${rot})`}><Tarboush s={S} /></g>
      <YearBadge t={t} at={T.y1879 - 0.1} year={1879} from={1876} x={1600} y={180} size={100} id="c11s5y" />
      <Pill t={t} at={T.ismail} text="إسماعيل" x={CX} y={headTop - 150} size={52} id="c11s5n" out={T.inazal + 0.2} />
    </g>
  );
};

// ==================================================================================================================
// S6 · 704.98 · «وفي سنة 1882 دخلت القوات البريطانية مصر بعد معركة التل الكبير» — the march in from the left at dawn
export const S6: React.FC<{t: number}> = ({t}) => {
  const smoke = clamp01((t - T.maaraka) / 0.4);
  cueSfx('footsteps', 'c11s6-march', t >= T.dakhalat && t < T.dakhalat + 0.3, 500, {at: T.dakhalat, hit: 0.2, gain: 0.6});
  cueSfx('boom', 'c11s6-boom', t >= T.maaraka && t < T.maaraka + 0.3, 1200, {at: T.maaraka, hit: 0.05});
  return (
    <g>
      <SunsetWorld t={t} id="c11s6s" skyline="desert" sunX={1250} sunY={560} />
      <HeroObject t={t} at={T.y1882 + 0.3} src={EL('warship')} ar={1.276} x={1470} y={640} h={240} glow="#FF9A50" enter="rise" float={false} shine={false} sparkles={0} id="c11s6w" />
      {/* the column marches in from the left */}
      {Array.from({length: 6}, (_, i) => {
        const at = T.dakhalat - 0.3 + i * 0.08;
        const [x] = move(t, at, [-180 - i * 170, 0], [1060 - i * 150, 0], 2.0, ease.out);
        const walking = t >= at && t < at + 1.9;
        return <StoryPerson key={i} x={x} y={1000 - (i % 2) * 10} s={0.95} role="soldier" body="#B8283A" hat="army" hatColor="#E8DDC0" rim="#7FD8FF" pose={walking ? 'walk' : 'idle'} t={t + i * 0.13} id={'c11s6p' + i} />;
      })}
      {smoke > 0 && (
        <g opacity={smoke}>
          {[0, 1, 2, 3, 4].map((i) => {
            const u = clamp01((t - T.maaraka - i * 0.15) / 2.2);
            const sx = 1250 + (rand(i * 7.7) - 0.5) * 500, sy = 780 - u * 160;
            return <circle key={i} cx={sx} cy={sy} r={60 + u * 120} fill="#5A4A58" opacity={0.55 * (1 - u * 0.6)} />;
          })}
          <PlateFx t={t} kind="embers" density={0.8} seed={11} />
        </g>
      )}
      <Flash t={t} at={T.maaraka} strength={0.3} color="#FFD9A0" />
      <YearBadge t={t} at={T.y1882 - 0.1} year={1882} from={1879} x={1600} y={180} size={100} id="c11s6y" />
      <Pill t={t} at={T.misr - 0.05} text="مصر" x={1340} y={880} size={52} id="c11s6m" />
      <Pill t={t} at={T.maaraka} text="معركة التل الكبير" x={820} y={190} size={56} id="c11s6b" />
    </g>
  );
};

// ==================================================================================================================
// S7 · 710.70 · «وبدأ احتلال استمر عشرات السنين» — four dominoes, then the first push
export const S7: React.FC<{t: number}> = ({t}) => {
  const k = ease.inOut(clamp01((t - T.s7) / 0.9));
  const cx = lerp(1380, 960, k), cy = 525, z = lerp(1.1, 1.0, k);
  return (
    <g>
      <WarWorld t={t} id="c11s7w" embers={14} />
      <g transform={camT(cx, cy, z)}>
        <Train t={t} falls id="c11tr7" />
        <Pill t={t} at={T.asharat - 0.05} text="عشرات السنين" x={tileX(3)} y={SUB_Y} size={48} kind="red" id="c11s7s" />
      </g>
    </g>
  );
};

// ==================================================================================================================
// S8 · 713.54 · «وللأمانة التاريخية، البيع ما كان السبب الوحيد. الديون كانت هي المرض» — the fever under it all
export const S8: React.FC<{t: number}> = ({t}) => {
  const k = ease.inOut(clamp01((t - T.s8) / 0.8));
  const cx = lerp(960, 780, k), cy = 560, z = lerp(1.0, 0.8, k);
  const scr = (wx: number, wy: number): [number, number] => [960 + (wx - cx) * z, 540 + (wy - cy) * z];
  const dim = 1 - 0.45 * clamp01((t - T.amana) / 0.5);
  // the fever thermometer
  const TX = 170, TOP = 220, BULB = 840;
  const up = ease.out(clamp01((t - (T.duyun - 0.15)) / 0.5));
  const lvl = lerp(0.12, 0.88, ease.inOut(clamp01((t - T.duyun) / (T.marad - T.duyun))));
  const hot = clamp01((t - T.marad) / 0.25);
  const pulse = hot * (0.5 + 0.5 * Math.sin((t - T.marad) * 7));
  const col = hot > 0.5 ? '#F0263E' : '#FF8A3A';
  const ly = lerp(BULB - 60, TOP + 30, lvl);
  cueSfx('rise', 'c11s8-rise', t >= T.duyun && t < T.duyun + 0.4, TX, {at: T.duyun, hit: 0.6, gain: 0.6});
  cueSfx('heartbeat', 'c11s8-fever', t >= T.marad && t < T.marad + 0.3, TX, {at: T.marad, hit: 0.1, gain: 0.7});
  const [px, py] = scr(tileX(0) - 120, 300);
  return (
    <g>
      <WarWorld t={t} id="c11s8w" embers={8} />
      <g transform={camT(cx, cy, z)} opacity={dim}>
        <Train t={t} falls id="c11tr8" />
      </g>
      <Pill t={t} at={T.amana - 0.1} text="للأمانة" x={960} y={150} size={60} id="c11s8a" out={T.marad - 0.2} />
      <Pill t={t} at={T.sabab - 0.1} text="مو السبب الوحيد" x={px} y={py} size={48} id="c11s8b" />
      {up > 0 && (
        <g transform={`translate(0 ${(1 - up) * 300})`} opacity={up}>
          <Glow x={TX} y={BULB} r={180 + 40 * pulse} color={RED} o={0.3 + 0.5 * pulse} id="c11s8g" />
          <rect x={TX - 40} y={TOP} width={80} height={BULB - TOP} rx={40} fill="#F4F1EA" stroke={OUT} strokeWidth={9} />
          <circle cx={TX} cy={BULB} r={76} fill="#F4F1EA" stroke={OUT} strokeWidth={9} />
          <rect x={TX - 20} y={ly} width={40} height={BULB - ly} rx={20} fill={col} />
          <circle cx={TX} cy={BULB} r={56} fill={col} />
          {[0.2, 0.4, 0.6, 0.8].map((f) => <rect key={f} x={TX + 40} y={lerp(BULB - 60, TOP + 30, f) - 3} width={26} height={6} rx={3} fill={OUT} />)}
          <rect x={TX - 28} y={TOP + 30} width={9} height={BULB - TOP - 120} rx={4.5} fill="#FFFFFF" opacity={0.6} />
        </g>
      )}
      <Pill t={t} at={T.duyun} text="الديون" x={TX + 30} y={TOP - 80} size={52} id="c11s8d" />
      <Pill t={t} at={T.marad - 0.05} text="المرض" x={TX + 260} y={BULB - 20} size={56} kind="red" id="c11s8m" />
    </g>
  );
};

// ==================================================================================================================
// S9 ★ · 718.16 · «لكن الصفقة كانت أول باب انفتح. والباب هذا ما تسكّر إلا في سنة 1956» — the door that opened
const DOOR = {x: 960, y: 830, h: 590};
const EGY_REGION: [[number, number], [number, number]] = [[24, 21], [37, 32]];
const EgyptFloor: React.FC<{t: number; o: number}> = ({t, o}) => {
  if (o <= 0) return null;
  const d = countryD(EGY_REGION, 1920, 1080, ['Egypt']);
  return (
    <g opacity={o * (0.85 + 0.15 * Math.sin(t * 1.6))} transform="translate(960 915) scale(0.9 0.16) translate(-960 -540)">
      <path d={d} fill={GOLD} opacity={0.12} />
      <path d={d} fill="none" stroke={GOLD} strokeWidth={14} opacity={0.55} />
    </g>
  );
};
/** what comes out of the door: a warship with a line of soldier silhouettes in front */
const Invasion: React.FC<{t: number}> = ({t}) => (
  <g opacity={1 - clamp01((t - (T.infatah + 1.75)) / 0.35)}>
    <HeroObject t={t} at={0} src={EL('warship')} ar={1.276} x={0} y={-40} h={230} glow={RED} float={false} shine={false} sparkles={0} id="c11inv" />
    {[-90, -30, 30, 90].map((x, i) => (
      <g key={i} transform={`translate(${x} ${70 + Math.abs(Math.sin(t * 6 + i)) * -4})`}>
        <circle cx={0} cy={-44} r={13} fill="#16121F" stroke={RED} strokeWidth={4} />
        <path d="M-16 -30 Q0 -36 16 -30 L13 10 H-13 Z" fill="#7A1E2C" stroke={RED} strokeWidth={4} />
        <rect x={-14} y={-60} width={28} height={8} rx={4} fill="#16121F" />
        <rect x={16} y={-50} width={5} height={52} fill="#2A2030" />
      </g>
    ))}
  </g>
);
const YearCounter: React.FC<{t: number; at: number; land: number; x: number; y: number; id: string}> = ({t, at, land, x, y, id}) => {
  if (t < at) return null;
  const k = ease.inOut(clamp01((t - at) / (land - at)));
  const yr = Math.round(lerp(1875, 1956, k));
  const steps = 8;
  for (let i = 0; i < steps; i++) {
    const a = at + (i / steps) * (land - at);
    cueSfx('tick', `c11yc-${i}`, t >= a && t < a + 0.12, x, {at: a, hit: 0.02, gain: 0.45});
  }
  return <NPill text={String(yr)} x={x} y={y} size={k >= 1 ? 80 : 72} kind={k >= 1 ? 'gold' : 'white'} id={id} p={(t - at) / 0.3} />;
};
export const S9: React.FC<{t: number}> = ({t}) => {
  const z = moveTo(t, T.walbab - 0.1, 1.0, 1.16, 1.4);
  const flood = clamp01((t - T.infatah) / 0.8);
  return (
    <g>
      <NightSky t={t} id="c11s9k" />
      <g transform={`translate(960 560) scale(${z}) translate(-960 -560)`}>
        <GridFloor id="c11s9f" t={t} wide />
        <EgyptFloor t={t} o={0.6 + 0.4 * flood} />
        <Glow x={960} y={900} r={900} ry={220} color={GOLD} o={0.55 * flood} id="c11s9fl" />
        <FateDoor t={t} at={T.safqa2 - 0.1} x={DOOR.x} y={DOOR.y} h={DOOR.h} kind="wood" light={GOLD} openAt={T.bab - 0.05}
          through={{at: T.infatah + 0.1, node: <Invasion t={t} />, dur: 1.7, to: [0, 90], s: 2.3}}
          label={{text: 'أول باب', at: T.awwal - 0.05, kind: 'gold'}} id="c11door9" />
        {flood > 0 && [0, 1, 2, 3, 4, 5].map((i) => (
          <Sparkle key={i} x={760 + rand(i * 5.3) * 400} y={360 + rand(i * 2.9) * 380} r={10 + 8 * rand(i)} o={flood * (0.5 + 0.5 * Math.sin(t * 3 + i * 1.7))} color="#FFF1C0" />
        ))}
      </g>
      <YearCounter t={t} at={721.0} land={T.s10 - 0.02} x={1500} y={400} id="c11s9y" />
    </g>
  );
};

// ==================================================================================================================
// S10 · 722.64 · «لما جمال عبد الناصر أمّم القناة» — he walks in and pushes the door shut
export const S10: React.FC<{t: number}> = ({t}) => {
  const [nx] = move(t, T.lamma - 0.2, [2150, 0], [1330, 0], 1.6, ease.out);
  const walking = t >= T.lamma - 0.2 && t < T.lamma + 1.4;
  const [nx2] = move(t, T.ammam - 0.45, [nx, 0], [1255, 0], 0.4);
  const x = t >= T.ammam - 0.45 ? nx2 : nx;
  const shut = clamp01((t - T.ammam - 0.5) / 0.15);
  const dust = clamp01((t - (T.ammam + 0.55)) / 0.9);
  return (
    <g>
      <NightSky t={t} id="c11s10k" />
      <g transform="translate(960 560) scale(1.16) translate(-960 -560)">
        <GridFloor id="c11s10f" t={t} wide />
        <EgyptFloor t={t} o={1 - 0.6 * shut} />
        <Glow x={960} y={900} r={900} ry={220} color={GOLD} o={0.55 * (1 - shut)} id="c11s10fl" />
        <FateDoor t={t} x={DOOR.x} y={DOOR.y} h={DOOR.h} kind="wood" light={GOLD} openAt={700} closeAt={T.ammam - 0.05} id="c11door10" />
        {dust > 0 && dust < 1 && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i / 8) * Math.PI - Math.PI;
          const d = 80 + dust * 260;
          return <circle key={i} cx={960 + Math.cos(a) * d * 1.4} cy={DOOR.y - 10 + Math.sin(a) * d * 0.3} r={30 + dust * 30} fill="#C8B8A0" opacity={0.6 * (1 - dust)} />;
        })}
        <StoryPerson x={x} y={DOOR.y + 120} s={1.05} role="officer" body={KHAKI} hatColor={KHAKI} hair="short" hairColor="#1A1420" medals rim={GOLD}
          pose={walking ? 'walk' : t >= T.ammam - 0.45 && t < T.ammam + 0.6 ? 'point' : 'idle'} flip t={t} id="c11s10n" />
      </g>
      <Flash t={t} at={T.ammam + 0.5} strength={0.25} color="#FFE8B0" />
      <YearBadge t={t} at={T.s10 - 0.02} year={1956} x={1640} y={170} size={96} id="c11s10y" />
      <Pill t={t} at={T.jamal - 0.05} text="جمال عبد الناصر" x={1390} y={330} size={50} id="c11s10p" out={T.qanah - 0.15} />
      <Pill t={t} at={T.qanah - 0.05} text="أمّم القناة" x={480} y={330} size={66} kind="gold" id="c11s10q" />
    </g>
  );
};

// ==================================================================================================================
// S11 · 726.56 · «وبعدها مصر انهجم عليها من ثلاث دول» — three red arrows on the canal (no names: not spoken)
const MAP_REGION: [[number, number], [number, number]] = [[28.4, 28.2], [37.0, 33.4]];
const mp = nightProj(MAP_REGION);
const EGY_PILL = mp(30.4, 29.3);
const PORT = mp(32.3, 31.26), SUEZ = mp(32.55, 29.97), ISM = mp(32.27, 30.6);
const STRIKES: {from: [number, number]; to: [number, number]; bend: number}[] = [
  {from: mp(35.4, 30.9), to: mp(32.75, 30.55), bend: -60},
  {from: mp(31.5, 33.0), to: mp(32.22, 31.38), bend: 50},
  {from: mp(33.4, 33.0), to: mp(32.42, 31.4), bend: -50},
];
const Strike: React.FC<{t: number; at: number; from: [number, number]; to: [number, number]; bend: number; id: string}> = ({t, at, from, to, bend, id}) => {
  if (t < at) return null;
  const k = ease.out(clamp01((t - at) / 0.35));
  const mx = (from[0] + to[0]) / 2 + bend, my = (from[1] + to[1]) / 2 - Math.abs(bend);
  const q = (u: number): [number, number] => [
    (1 - u) * (1 - u) * from[0] + 2 * (1 - u) * u * mx + u * u * to[0],
    (1 - u) * (1 - u) * from[1] + 2 * (1 - u) * u * my + u * u * to[1],
  ];
  const pts = Array.from({length: 21}, (_, i) => q((i / 20) * k));
  const d = 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
  const [hx, hy] = pts[20];
  const [bx, by] = pts[18];
  const ang = (Math.atan2(hy - by, hx - bx) * 180) / Math.PI;
  cueSfx('whoosh', `c11s11-${id}`, t >= at && t < at + 0.3, hx, {at, hit: 0.25, gain: 0.7});
  return (
    <g>
      <path d={d} fill="none" stroke={OUT} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={RED} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(${hx} ${hy}) rotate(${ang})`}>
        <path d="M14 0 L-34 -30 L-34 30 Z" fill={RED} stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
      </g>
    </g>
  );
};
export const S11: React.FC<{t: number}> = ({t}) => {
  const HIT = T.inhajam;
  const hit = clamp01((t - HIT) / 0.5);
  cueSfx('boom', 'c11s11-boom', t >= HIT && t < HIT + 0.25, PORT[0], {at: HIT, hit: 0.05, gain: 0.8});
  return (
    <g>
      <PaperMap t={t} id="c11s11p" />
      <NightMap t={t} region={MAP_REGION} id="c11s11m" areas={[
        {countries: ['Libya', 'Sudan', 'Israel', 'Palestine', 'Jordan', 'Saudi Arabia', 'Lebanon', 'Syria', 'Cyprus'], fill: '#E4D3A6'},
        {countries: ['Egypt'], fill: '#E9B949'},
      ]} />
      {/* the canal, gold */}
      <path d={`M${PORT[0]} ${PORT[1]} Q${ISM[0] - 20} ${ISM[1]} ${SUEZ[0]} ${SUEZ[1]}`} fill="none" stroke={OUT} strokeWidth={32} strokeLinecap="round" />
      <path d={`M${PORT[0]} ${PORT[1]} Q${ISM[0] - 20} ${ISM[1]} ${SUEZ[0]} ${SUEZ[1]}`} fill="none" stroke="#FFE58A" strokeWidth={18} strokeLinecap="round" />
      {STRIKES.map((s, i) => <Strike key={i} t={t} at={T.s11 + 0.25 + i * 0.3} from={s.from} to={s.to} bend={s.bend} id={'a' + i} />)}
      {hit > 0 && [0, 1, 2, 3].map((i) => {
        const u = clamp01((t - HIT - i * 0.12) / 1.6);
        const [sx, sy] = [lerp(PORT[0], SUEZ[0], 0.15 + i * 0.22), lerp(PORT[1], SUEZ[1], 0.15 + i * 0.22)];
        return <circle key={i} cx={sx + noise1(t + i, 3) * 10} cy={sy - u * 90} r={26 + u * 60} fill="#4A3A48" opacity={0.6 * (1 - u * 0.7) * hit} />;
      })}
      <Flash t={t} at={HIT} strength={0.2} color="#FFD0C0" />
      <NPill text="مصر" x={EGY_PILL[0]} y={EGY_PILL[1]} size={60} kind="white" id="c11s11e" />
      <Pill t={t} at={T.thalath - 0.05} text="ثلاث دول" x={1440} y={170} size={60} kind="red" id="c11s11t" />
    </g>
  );
};

// ==================================================================================================================
// S12 · 728.84 · «يعني اللي انباع بـ4 مليون في يوم، احتاج 81 سنة وحرب عشان يرجع» — one day vs 81 years
export const S12: React.FC<{t: number}> = ({t}) => {
  const A = 1740, B = 440, Y = 330;
  const head = moveTo(t, T.ihtaj, A, B, 1.4);
  const lineOn = t >= T.ihtaj;
  const showB = clamp01((t - (T.ihtaj + 1.3)) / 0.3);
  const rideX = lerp(A, B, 0.5);
  const [rx] = move(t, T.ihtaj + 0.05, [A - 160, 0], [rideX, 0], 0.7);
  cueSfx('riser', 'c11s12-run', t >= T.ihtaj && t < T.ihtaj + 0.4, 1260, {at: T.ihtaj, hit: 1.2, gain: 0.6});
  cueSfx('thump', 'c11s12-pinB', t >= T.ihtaj + 1.3 && t < T.ihtaj + 1.6, B, {at: T.ihtaj + 1.3, hit: 0.1, gain: 0.7});
  const g = uid('c11s12', 'ln');
  const pin = (x: number, o: number) => (
    <g opacity={o}>
      <circle cx={x} cy={Y} r={30} fill={GOLD} opacity={0.35} />
      <circle cx={x} cy={Y} r={18} fill={GOLD} stroke="#2A1A00" strokeWidth={4} />
    </g>
  );
  return (
    <g>
      <NightSky t={t} id="c11s12k" />
      <GridFloor id="c11s12f" t={t} />
      <defs><filter id={g} x="-10%" y="-400%" width="120%" height="900%"><feGaussianBlur stdDeviation={7} /></filter></defs>
      {/* the short day */}
      {pin(A, clamp01((t - (T.b4 - 0.3)) / 0.2))}
      <Pill t={t} at={T.b4 - 0.3} text="1875" x={A} y={Y - 100} size={64} kind="gold" id="c11s12a" />
      <Pill t={t} at={T.b4} text="4 مليون" x={A - 40} y={Y + 110} size={58} kind="grey" id="c11s12m" />
      <Pill t={t} at={T.yawm - 0.05} text="في يوم" x={A - 40} y={Y + 210} size={58} id="c11s12d" />
      {/* the long line to 1956 */}
      {lineOn && (
        <g>
          <line x1={A} x2={head} y1={Y} y2={Y} stroke="#FFE3B0" strokeWidth={12} opacity={0.5} filter={`url(#${g})`} />
          <line x1={A} x2={head} y1={Y} y2={Y} stroke="#F6E6C8" strokeWidth={6} strokeLinecap="round" />
          {Array.from({length: 9}, (_, i) => {
            const x = lerp(A, B, (i + 1) / 10);
            return (head <= x + 1) ? <rect key={i} x={x - 2} y={Y - 12} width={4} height={24} rx={2} fill="#F6E6C8" opacity={0.7} /> : null;
          })}
        </g>
      )}
      {t >= T.ihtaj + 0.05 && (
        <Pop t={t} at={T.ihtaj + 0.05} x={rx} y={Y}><NPill text="81 سنة" x={rx} y={Y} size={110} kind="gold" id="c11s12r" /></Pop>
      )}
      {pin(B, showB)}
      <Pill t={t} at={T.ihtaj + 1.3} text="1956" x={B} y={Y - 100} size={64} kind="white" id="c11s12b" />
      <Pill t={t} at={T.harb - 0.05} text="وحرب" x={B + 340} y={Y + 120} size={62} kind="red" id="c11s12h" />
      <Pop t={t} at={T.yarja - 0.05} x={B + 360} y={Y + 230}>
        <g>
          <Mark kind="check" x={B + 505} y={Y + 230} r={36} />
          <NPill text="رجعت" x={B + 360} y={Y + 230} size={62} kind="gold" id="c11s12y" />
        </g>
      </Pop>
    </g>
  );
};

// ==================================================================================================================
// S13 · 734.30 · «واليوم القناة لحالها دخلت لمصر في سنة 2023 بس حوالي 10.2 مليار … دولار. سنة وحدة.»
export const S13: React.FC<{t: number}> = ({t}) => {
  const HX = 1180, HY = 440, HH = 470, HW = HH * 1.274;
  const x0 = HX - HW / 2, y0 = HY - HH / 2;
  const P1: [number, number] = [x0 + 0.77 * HW, y0 + 0.23 * HH], P2: [number, number] = [x0 + 0.27 * HW, y0 + 0.66 * HH];
  const shimmer = clamp01((t - T.sana1) / 0.3);
  cueSfx('water', 'c11s13-water', t >= T.s13 && t < T.s13 + 0.3, HX, {at: T.s13, hit: 0.3, gain: 0.4});
  return (
    <g>
      <NightSky t={t} id="c11s13k" />
      <Rays t={t} id="c11s13r" tone="cyan" x={HX} y={HY} />
      <GridFloor id="c11s13f" t={t} />
      <HeroObject t={t} at={T.s13 - 0.2} src={EL('suez-canal-tile')} ar={1.274} x={HX} y={HY} h={HH} glow="#57D9FA" enter="pop" float={false} sparkles={4} id="c11s13c" />
      {/* small ships streaming along the canal (looping glide, upper-right → lower-left) */}
      {[0, 1, 2].map((i) => {
        const u = ((t - T.s13) * 0.12 + i / 3) % 1;
        const k = ease.inOut(u);
        const x = lerp(P1[0], P2[0], k), y = lerp(P1[1], P2[1], k);
        const o = Math.min(1, u * 6, (1 - u) * 6);
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(0.9)`} opacity={o}>
            <path d="M-30 -2 L30 -12 L24 8 L-24 14 Z" fill="#2A2238" stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
            <rect x={-12} y={-26} width={22} height={16} rx={3} fill="#F4F1EA" stroke={OUT} strokeWidth={3} />
            <rect x={-4} y={-38} width={8} height={14} fill="#C8283A" stroke={OUT} strokeWidth={3} />
          </g>
        );
      })}
      {shimmer > 0 && [0, 1, 2, 3, 4].map((i) => {
        const u = (i + 0.5) / 5;
        return <Sparkle key={i} x={lerp(P1[0], P2[0], u)} y={lerp(P1[1], P2[1], u) - 10} r={14} o={shimmer * (0.5 + 0.5 * Math.sin(t * 5 + i * 1.3))} color="#E8FBFF" />;
      })}
      <Pill t={t} at={T.s13 - 0.05} text="اليوم" x={HX} y={140} size={56} id="c11s13a" out={T.sana1 - 0.3} />
      <YearBadge t={t} at={T.y2023 - 0.1} year={2023} x={1640} y={220} size={96} id="c11s13y" />
      <CountNumber t={t} at={T.hawali} dur={T.n10 + 0.25 - T.hawali} value="10.2 مليار $" x={HX} y={790} size={150} tone="gold" id="c11s13n" />
      {t >= T.hawali && t < T.sana1 && (
        <g opacity={clamp01((t - T.hawali) / 0.3) * (1 - clamp01((t - (T.sana1 - 0.25)) / 0.25))}>
          <GlowText text="حوالي 10.2 مليار دولار" x={HX} y={920} size={56} tone="grey" id="c11s13w" />
        </g>
      )}
      <CalendarCard t={t} at={T.sana1 - 0.05} x={1640} y={560} to={1} size={0.8} id="c11s13cal" />
      <CWords t={t} y={140} size={110} cx={HX} id="c11s13h" words={[
        {w: 'سنة', at: T.sana1 - 0.05},
        {w: 'وحدة', at: T.wahda - 0.1, tone: 'gold'},
      ]} />
    </g>
  );
};
