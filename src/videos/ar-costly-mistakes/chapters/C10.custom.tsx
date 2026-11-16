// Custom shots for C10 (builder-owned, AZTIKA). Each: export const S<n>: React.FC<{t: number}> returning the shot's WORLD
// (SVG, no <Stage>/<NightScreen> — the chapter provides them; NightShots joins, drifts and pins the host).
// C10 · توقيع بـ4 مليون — the Suez deal. Palette: dark red → purple board → black/gold pen → plate Egypt 1869 → warm
// banquet → dream → debt data → London blue → lamp-gold desk → paper map. Screen coordinates (no mirroring).
// THE PEN (S4 → S16) is one local piece (Pen + Signature): the same gold pen writes the same glowing ink right → left.
import React from 'react';
import {staticFile} from 'remotion';
import {clamp01, ease, lerp, noise1, phaseOf, pressIn, rand} from '../../../kit/anim';
import {lb, uid} from '../../../kit/stage';
import {GlowText, GridFloor, NightSky, NPill, RevealRing, Sparkle, WordPop, YearBadge, textWidth} from '../../../kit/night';
import {CountNumber, Flash, HeroObject, Rays, Stamp} from '../../../kit/night-fx';
import {NightCity, PaperMap, RoomWorld, StoryPerson, MoneyBag} from '../../../kit/night-worlds';
import {StairGame, stairCamT} from '../../../kit/night-game';
import type {StairEntry} from '../../../kit/night-game';
import {MysteryTile, Coin} from '../../../kit/night-props';
import {MarkPill, WarWorld} from '../../../kit/night-data';
import {IconList, Lineup, Spotlight, StoryTable} from '../../../kit/night-story';
import {PlateWorld, PlateFx} from '../../../kit/night-places';
import {NightMap, NeonLines, nightProj} from '../../../kit/night-maps';
import {move, moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {OUT, popAt} from '../shared/util';
import board from '../../../../videos/ar-costly-mistakes/board.json';

const T = {
  s1: 614.58, mufaal: 615.9, infajar: 616.96, dowal: 618.32, miat: 619.66, // «أدري وش في بالك … مفاعل نووي انفجر، ولوّث دول، وكلّف مئات المليارات»
  s3: 622.49, ghalta: 622.85, infijar: 624.64, sarookh: 625.48, hackers: 626.51, // «بس أغلى غلطة … ما فيها انفجار، ولا صاروخ، ولا هاكرز»
  s4: 627.1, tawqi: 627.46, siar: 628.08, four: 628.8, // «فيها توقيع. وسعرها 4 مليون»
  s5: 629.72, sana: 630.4, y1869: 631.04, // «مصر، سنة 1869»
  s6: 632.16, suez: 633.09, tanfatih: 633.74, ismail: 635.48, ostori: 636.84, // «قناة السويس تنفتح … الخديوي إسماعيل … احتفال أسطوري»
  s7: 637.48, million: 638.78, muluk: 640.64, ajanib: 641.52, // «ويصرف أكثر من مليون دولار بس على ضيافة الملوك والضيوف الأجانب»
  s8: 642.12, hilm: 643.32, misr: 644.58, qitaa: 644.94, min: 645.25, europa: 645.45, // «كان عنده حلم كبير: يخلي مصر قطعة من أوروبا»
  s9: 645.9, mashari: 646.66, tahdith: 647.64, bas: 648.34, dayn: 649.34, // «قصور، مشاريع، تحديث. بس كل هذا كان بالدين»
  s10: 649.8, y1875: 650.96, duyun: 651.88, h100: 654.32, spoken: 655.2, // «ولما وصلنا لسنة 1875، ديون مصر صارت تقريبًا 100 مليون جنيه إسترليني»
  s11: 656.1, seven: 657.3, istalam: 658.82, whip: 659.1, // «بعد ما كانت حوالي 7 ملايين بس لما استلم الحكم»
  s12: 659.5, khilsat: 659.77, wakan: 660.44, shay: 661.74, qima: 662.72, // «والفلوس خلصت. وكان باقي عند مصر شيء واحد له قيمة»
  s13: 663.1, sharika: 663.84, p44: 665.22, ashum: 666.6, // «حصتها في شركة قناة السويس، حوالي 44% من الأسهم»
  s15: 670.4, walk: 670.6, barlaman: 671.92, rothschild: 673.86, iqtarad: 674.44, // «ما انتظر حتى موافقة البرلمان، راح لعائلة روتشيلد واقترض المبلغ»
  s16: 675.5, nov: 676.12, y1875b: 677.4, hush: 677.9, tammat: 678.82, safqa: 679.65, // «وفي 25 نوفمبر سنة 1875 تمت الصفقة»
  s17: 680.34, ahamm: 682.02, mamarr: 682.54, alam: 683.32, // «44% من أهم ممر مائي في العالم»
  s18: 683.76, four2: 684.66, end: 686.66, // «مقابل 4 مليون جنيه إسترليني»
};

const GOLD = '#FFC928', CYAN = '#5CF2FF', RED = '#FD4B5B', CREAM = '#F4E7C6';
const EL = (n: string) => `ar-costly-mistakes/el/${n}.png`;

// ---------------------------------------------------------------- local helpers
/** soft radial light */
const Glow: React.FC<{x: number; y: number; r: number; color: string; o?: number; id: string; ry?: number}> = ({x, y, r, color, o = 1, id, ry}) => {
  if (o <= 0.01) return null;
  const g = uid('c10glow', id);
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

/** THE PEN — the fountain-pen art with its nib at (x, y); a warm gold halo behind it. Silent (the scratch is a story cue). */
const PEN_AR = 1.004;
const Pen: React.FC<{x: number; y: number; h: number; o?: number; rot?: number; id: string}> = ({x, y, h, o = 1, rot = 0, id}) => {
  if (o <= 0.01) return null;
  const w = h * PEN_AR;
  // nib tip sits at (0.12, 0.92) of the art box
  const left = -0.12 * w, top = -0.92 * h;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={o} {...lb('object', id)}>
      <Glow x={left + w * 0.5} y={top + h * 0.5} r={h * 0.55} color={GOLD} o={0.55} id={`${id}h`} />
      <image href={staticFile(EL('fountain-pen'))} x={left} y={top} width={w} height={h} />
    </g>
  );
};

/** a hand-written signature as points, from x0 (right) to x1 (left) — Arabic writing direction */
const sigPts = (x0: number, x1: number, y: number, amp: number, n = 110): [number, number][] =>
  Array.from({length: n}, (_, i) => {
    const u = i / (n - 1);
    const env = Math.sin(Math.PI * Math.min(1, u * 1.15)) * 0.8 + 0.2;
    return [lerp(x0, x1, u) + amp * 0.42 * Math.cos(i * 0.62), y + amp * env * (0.72 * Math.sin(i * 0.62) + 0.28 * Math.sin(i * 0.19 + 1))];
  });
/** glowing gold ink drawn up to k (0..1); returns the head point too */
const inkHead = (pts: [number, number][], k: number): [number, number] => {
  const f = clamp01(k) * (pts.length - 1), i = Math.floor(f), r = f - i;
  const a = pts[i], b = pts[Math.min(pts.length - 1, i + 1)];
  return [lerp(a[0], b[0], r), lerp(a[1], b[1], r)];
};
const Signature: React.FC<{pts: [number, number][]; k: number; id: string; w?: number}> = ({pts, k, id, w = 8}) => {
  if (k <= 0) return null;
  const f = clamp01(k) * (pts.length - 1), n = Math.floor(f);
  const head = inkHead(pts, k);
  const d = 'M' + [...pts.slice(0, n + 1), head].map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
  const g = uid('c10sig', id);
  return (
    <g {...lb('object', id)}>
      <defs>
        <filter id={g} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
      </defs>
      <path d={d} fill="none" stroke={GOLD} strokeWidth={w * 3} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} filter={`url(#${g})`} />
      <path d={d} fill="none" stroke="#FFD95A" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#FFF6D0" strokeWidth={w * 0.35} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
    </g>
  );
};

/** a cream paper (contract / slip): faint printed lines, gold inner frame, a dotted signature line at sy */
const Paper: React.FC<{x: number; y: number; w: number; h: number; rot?: number; lines?: number; sy?: number; id: string}> = ({x, y, w, h, rot = 0, lines = 0, sy, id}) => {
  const g = uid('c10pap', id);
  return (
    <g transform={`rotate(${rot} ${x} ${y})`} {...lb('object', id)}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#FFF8E4" />
          <stop offset="1" stopColor="#E8D3A2" />
        </linearGradient>
        <filter id={g + 'b'} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={22} />
        </filter>
      </defs>
      <rect x={x - w / 2 + 14} y={y - h / 2 + 22} width={w} height={h} rx={14} fill="#000" opacity={0.45} filter={`url(#${g}b)`} />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={14} fill={`url(#${g})`} stroke={OUT} strokeWidth={8} />
      <rect x={x - w / 2 + 22} y={y - h / 2 + 22} width={w - 44} height={h - 44} rx={8} fill="none" stroke="#C99A2E" strokeWidth={4} opacity={0.8} />
      {Array.from({length: lines}, (_, i) => (
        <rect key={i} x={x - w / 2 + 70 + (i % 3 === 2 ? w * 0.25 : 0)} y={y - h / 2 + 80 + i * 44} width={w - 140 - (i % 3 === 2 ? w * 0.25 : 0)} height={12} rx={6} fill="#B9A274" opacity={0.55} />
      ))}
      {sy !== undefined && <line x1={x - w / 2 + 70} y1={sy} x2={x + w / 2 - 70} y2={sy} stroke="#8C7A55" strokeWidth={4} strokeDasharray="4 12" strokeLinecap="round" />}
    </g>
  );
};

/** a code firework: rays + tip dots growing out of a point, fading (≈ 1.3 s) */
const Firework: React.FC<{t: number; at: number; x: number; y: number; r: number; color: string; n?: number}> = ({t, at, x, y, r, color, n = 16}) => {
  const e = t - at;
  if (e < 0 || e > 1.5) return null;
  const g = ease.out(clamp01(e / 0.55));
  const o = 1 - clamp01((e - 0.6) / 0.9);
  return (
    <g opacity={o}>
      <circle cx={x} cy={y} r={r * 0.25 * (1 - clamp01(e / 0.3))} fill="#FFFFFF" opacity={0.8} />
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 + at;
        const r1 = r * g, r0 = r * Math.max(0, g - 0.45);
        return (
          <g key={i}>
            <line x1={x + Math.cos(a) * r0} y1={y + Math.sin(a) * r0 + e * e * 30} x2={x + Math.cos(a) * r1} y2={y + Math.sin(a) * r1 + e * e * 40} stroke={color} strokeWidth={5} strokeLinecap="round" />
            <circle cx={x + Math.cos(a) * r1} cy={y + Math.sin(a) * r1 + e * e * 40} r={6} fill="#FFFFFF" />
          </g>
        );
      })}
    </g>
  );
};

/** soft grey smoke puffs rising from a chimney */
const Smoke: React.FC<{t: number; x: number; y: number; s?: number; color?: string; o?: number}> = ({t, x, y, s = 1, color = '#8A7A80', o = 0.5}) => (
  <g opacity={o}>
    {[0, 1, 2, 3, 4].map((i) => {
      const ph = ((t * 0.35 + i / 5) % 1);
      return <circle key={i} cx={x + noise1(t * 0.3 + i, i + 3) * 30 * s + ph * 60 * s} cy={y - ph * 260 * s} r={(22 + ph * 50) * s} fill={color} opacity={(1 - ph) * 0.8} />;
    })}
  </g>
);

// ==================================================================================================================
// S1 · 614.58 · «أدري وش في بالك الحين. مفاعل نووي انفجر، ولوّث دول، وكلّف مئات المليارات» — C09's red world, the plant counted
export const S1: React.FC<{t: number}> = ({t}) => {
  const PX = 470, PY = 760, PH = 430;
  const boom = clamp01((t - T.infajar) / 0.6);
  const stain = ease.out(clamp01((t - T.dowal) / 0.9));
  return (
    <g>
      <WarWorld t={t} id="c10s1w" embers={18} />
      <rect x={0} y={0} width={1920} height={1080} fill="#0A0308" opacity={0.45} />
      {/* the boom puff behind the plant */}
      {boom > 0 && boom < 1 && (
        <g opacity={1 - boom}>
          <circle cx={PX + 30} cy={PY - 120} r={120 + 380 * ease.out(boom)} fill="#FF8A3D" opacity={0.55} />
          <circle cx={PX + 30} cy={PY - 120} r={60 + 220 * ease.out(boom)} fill="#FFD27A" opacity={0.7} />
        </g>
      )}
      <Glow x={PX + 30} y={PY - 120} r={360} color="#FF6A3D" o={0.35 * clamp01((t - T.infajar) / 0.4)} id="c10s1fire" />
      {/* the red stain spreading under the plant */}
      {stain > 0 && (
        <g>
          <ellipse cx={PX + 40} cy={PY + PH * 0.42} rx={60 + 420 * stain} ry={22 + 90 * stain} fill={RED} opacity={0.45} />
          <ellipse cx={PX + 40} cy={PY + PH * 0.42} rx={30 + 260 * stain} ry={12 + 55 * stain} fill="#B3122A" opacity={0.6} />
        </g>
      )}
      <Smoke t={t} x={PX + 150} y={PY - PH * 0.48} s={1.2} o={0.55 * clamp01((t - T.mufaal) / 0.5)} />
      <HeroObject t={t} at={T.mufaal - 0.15} src={EL('nuclear-plant')} ar={1.124} x={PX} y={PY} h={PH} glow={RED} enter="rise" id="c10s1plant" />
      {/* coins burst out of the plant on «مئات» */}
      {t >= T.miat && Array.from({length: 12}, (_, i) => {
        const e = t - T.miat - i * 0.03;
        if (e < 0) return null;
        const a = -Math.PI / 2 + (rand(i * 3 + 1) - 0.5) * 2.2;
        const k = ease.out(clamp01(e / 0.7));
        const v = 320 + rand(i * 7) * 260;
        return <Coin key={i} x={PX + Math.cos(a) * v * k} y={PY - 100 + Math.sin(a) * v * k + e * e * 260} r={26} t={t} spin={7} phase={i} />;
      })}
      {/* the count of what Chernobyl did — stacked pills left-centre, each on its word */}
      <NPill text="مفاعل انفجر" x={840} y={230} size={52} kind="red" id="c10s1p1" p={(t - T.infajar + 0.1) / 0.3} />
      <NPill text="لوّث دول" x={840} y={350} size={52} kind="red" id="c10s1p2" p={(t - T.dowal + 0.1) / 0.3} />
      <NPill text="مئات المليارات" x={840} y={470} size={52} kind="gold" id="c10s1p3" p={(t - T.miat + 0.1) / 0.3} />
    </g>
  );
};

// ==================================================================================================================
// S3 · 622.49 · «بس أغلى غلطة في الفيديو كله ما فيها انفجار، ولا صاروخ، ولا هاكرز» — on the board, three ✖
const ENTRIES: StairEntry[] = (board.entries as {id: string; label: string; at: number; src?: string; ar?: number; glow?: string; twist?: boolean}[]).map((e) => ({
  id: e.id, label: e.label, at: e.at, src: e.src, ar: e.ar ?? 1, glow: e.glow, twist: e.twist,
}));
const STAIR = {entries: ENTRIES, summitAt: board.summitAt, topLabel: board.topLabel};

const BurstIcon: React.FC<{r: number}> = ({r}) => {
  const pts = (k: number, n: number) => Array.from({length: n * 2}, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2;
    const rr = (i % 2 ? 0.5 : 1) * r * k;
    return `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
  }).join(' ');
  return (
    <g>
      <polygon points={pts(0.78, 10)} fill="#FF6A2A" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
      <polygon points={pts(0.5, 8)} fill="#FFD23F" />
      <circle r={r * 0.16} fill="#FFFFFF" />
    </g>
  );
};
const RocketIcon: React.FC<{r: number}> = ({r}) => (
  <g transform={`rotate(35) scale(${r / 100})`}>
    <path d="M-18 40 Q0 90 18 40 Z" fill="#FF8A2A" />
    <path d="M-30 30 L-48 55 L-22 48 Z M30 30 L48 55 L22 48 Z" fill={RED} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
    <path d="M0 -75 Q30 -40 28 40 L-28 40 Q-30 -40 0 -75 Z" fill="#F2F4FA" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
    <circle cx={0} cy={-10} r={13} fill="#5CB8FF" stroke={OUT} strokeWidth={5} />
  </g>
);
const HoodIcon: React.FC<{r: number}> = ({r}) => (
  <g transform={`scale(${r / 100})`}>
    <path d="M-62 80 Q-70 -10 -40 -50 Q0 -90 40 -50 Q70 -10 62 80 Z" fill="#1E1B2E" stroke={OUT} strokeWidth={6} />
    <ellipse cx={0} cy={0} rx={34} ry={40} fill="#05030F" />
    {[-14, 0, 14].map((dx, i) => <rect key={i} x={dx - 3} y={-24 + i * 6} width={6} height={30 - i * 6} rx={3} fill="#22E07A" opacity={0.85} />)}
  </g>
);

export const S3: React.FC<{t: number}> = ({t}) => {
  const lx = 1170, ly = 610;
  const words = [{w: 'أغلى', at: T.s3}, {w: 'غلطة', at: T.ghalta, tone: 'gold' as const}];
  const tw = words.reduce((s, w) => s + textWidth(w.w, 130), 0) + 130 * 0.2;
  return (
    <g>
      <NightSky t={t} id="c10s3s" />
      <g transform={stairCamT(t, STAIR)}>
        <GridFloor id="c10s3f" t={t} wide />
        <StairGame t={t} id="c10s3g" {...STAIR} />
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#0A0420" opacity={0.55} />
      <WordPop t={t} id="c10s3h" y={190} size={130} right={lx + tw / 2} words={words} />
      <Lineup t={t} x={lx} y={ly} r={118} gap={80} id="c10s3l" items={[
        {label: 'انفجار', at: T.infijar - 0.12, node: <BurstIcon r={100} />, mark: 'cross', markAt: T.infijar + 0.2},
        {label: 'صاروخ', at: T.sarookh - 0.12, node: <RocketIcon r={92} />, mark: 'cross', markAt: T.sarookh + 0.2},
        {label: 'هاكرز', at: T.hackers - 0.12, node: <HoodIcon r={95} />, mark: 'cross', markAt: T.hackers + 0.2},
      ]} />
    </g>
  );
};

// ==================================================================================================================
// S4 · 627.10 · «فيها توقيع. وسعرها 4 مليون» ★ — the summit's price is a pen stroke next to the smallest price of the video
const S4SIG = sigPts(1380, 920, 655, 34);
export const S4: React.FC<{t: number}> = ({t}) => {
  const cz = 1 + 0.12 * ease.inOut(clamp01((t - T.s4) / 2.6));
  const ink = ease.inOut(clamp01((t - T.tawqi) / 1.1));
  const [hx, hy] = inkHead(S4SIG, Math.max(ink, 0));
  // the pen comes down onto the paper (627.10 → 627.46), writes, then lifts away a little
  const down = move(t, T.s4, [1500, 330], [S4SIG[0][0], S4SIG[0][1]], 0.36, ease.out);
  const lift = move(t, T.tawqi + 1.15, [0, 0], [60, -70], 0.5);
  const [px, py] = t < T.tawqi ? down : [hx + lift[0], hy + lift[1]];
  const fourY = moveTo(t, T.four - 0.05, 540, 600, 0.4, ease.out);
  cueSfx('tick', 'c10s4four', t >= T.four - 0.05 && t < T.four + 0.25, 1150, {at: T.four - 0.05, hit: 0.12, gain: 0.8});
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#06040A" />
      <g transform={`translate(1150 640) scale(${cz}) translate(-1150 -640)`}>
        <Spotlight x={1150} y={760} top={-40} w={900} color="#FFE2A0" id="c10s4sp" o={0.85} />
        <Glow x={1150} y={640} r={560} ry={300} color="#FFB54A" o={0.35} id="c10s4warm" />
        <Paper x={1150} y={600} w={760} h={300} rot={-2} lines={3} sy={680} id="c10s4paper" />
        <Signature pts={S4SIG} k={ink} id="c10s4ink" />
        {ink > 0 && ink < 1 && <Sparkle x={hx} y={hy} r={18} o={0.9} color="#FFF3C0" />}
        <Pen x={px} y={py} h={330} id="c10s4pen" o={clamp01((t - T.s4 + 0.1) / 0.25)} />
      </g>
      {/* the tiniest price of the video: grey, 34 px, dropping beside the ink */}
      <NPill text="4 مليون" x={870} y={fourY + 210} size={34} kind="grey" id="c10s4four" p={(t - T.four + 0.05) / 0.3} />
    </g>
  );
};

// ==================================================================================================================
// the Suez plate: overlays follow PlateWorld's camera (same maths) — u, v = fractions of the plate
type PCam = {at: number; dur: number; from: {x: number; y: number; s: number}; to: {x: number; y: number; s: number}};
const plateMap = (t: number, c: PCam) => {
  const k = ease.inOut(clamp01((t - c.at) / c.dur));
  const s = lerp(c.from.s, c.to.s, k), fx = lerp(c.from.x, c.to.x, k), fy = lerp(c.from.y, c.to.y, k);
  const w = 1920 * s, h = 1080 * s;
  const left = Math.min(0, Math.max(1920 - w, 960 - fx * w)), top = Math.min(0, Math.max(1080 - h, 540 - fy * h));
  return {s, at: (u: number, v: number): [number, number] => [left + u * w, top + v * h]};
};
const PLATE = 'ar-costly-mistakes/bg/suez-1869.jpg';

// S5 · 629.72 · «مصر، سنة 1869» — the night of the opening
const P5: PCam = {at: T.s5, dur: 2.6, from: {x: 0.5, y: 0.5, s: 1.0}, to: {x: 0.5, y: 0.46, s: 1.06}};
export const S5: React.FC<{t: number}> = ({t}) => (
  <g>
    <PlateWorld t={t} src={PLATE} id="c10s5p" look="natural" {...P5} />
    <PlateFx t={t} kind="confetti" density={0.45} seed={3} />
    <Firework t={t} at={630.55} x={430} y={250} r={150} color={GOLD} />
    <Firework t={t} at={631.15} x={1520} y={210} r={170} color="#FFFFFF" />
    <Firework t={t} at={631.7} x={760} y={140} r={120} color={CYAN} />
    <NPill text="مصر" x={960} y={345} size={56} kind="white" id="c10s5m" p={(t - T.s5 - 0.05) / 0.3} />
    <YearBadge t={t} at={T.sana} year={1869} from={1875} x={960} y={175} id="c10s5y" size={110} />
  </g>
);

// S6 · 632.16 · «قناة السويس تنفتح أخيرًا، والخديوي إسماعيل يسوي احتفال أسطوري» — the ship cuts the ribbon
const P6: PCam = {at: T.s6, dur: 5.4, from: {x: 0.4, y: 0.52, s: 1.18}, to: {x: 0.6, y: 0.52, s: 1.18}};
export const S6: React.FC<{t: number}> = ({t}) => {
  const pm = plateMap(t, P6);
  const S = pm.s;
  // the ship sails INTO the canal (away from us): bottom v 1.02 → 0.62, scale 1 → 0.5; it meets the ribbon on «تنفتح»
  const k = ease.inOut(clamp01((t - (T.s6 + 0.1)) / 2.2));
  const sv = lerp(1.02, 0.62, k), ss = lerp(1, 0.5, k);
  const [shx, shy] = pm.at(0.5, sv);
  const shipH = 470 * ss * S, shipW = shipH * 1.124;
  const broke = t >= T.tanfatih;
  const [r0x, r0y] = pm.at(0.29, 0.69), [r1x, r1y] = pm.at(0.68, 0.69);
  const sag = broke ? ease.out(clamp01((t - T.tanfatih) / 0.5)) : 0;
  const midX = (r0x + r1x) / 2;
  cueSfx('swish', 'c10s6ribbon', broke && t < T.tanfatih + 0.3, midX, {at: T.tanfatih, hit: 0.05});
  const [ix, iy] = pm.at(0.855, 0.875);
  const [sx2, sy2] = pm.at(0.5, 0.2);
  return (
    <g>
      <PlateWorld t={t} src={PLATE} id="c10s6p" look="natural" {...P6} />
      {/* the gold ribbon across the canal (two poles), snapping on «تنفتح» */}
      <g>
        <line x1={r0x} y1={r0y - 90 * S} x2={r0x} y2={r0y + 10} stroke={OUT} strokeWidth={10} />
        <line x1={r0x} y1={r0y - 90 * S} x2={r0x} y2={r0y + 10} stroke={GOLD} strokeWidth={5} />
        <line x1={r1x} y1={r1y - 90 * S} x2={r1x} y2={r1y + 10} stroke={OUT} strokeWidth={10} />
        <line x1={r1x} y1={r1y - 90 * S} x2={r1x} y2={r1y + 10} stroke={GOLD} strokeWidth={5} />
        {!broke ? (
          <path d={`M${r0x} ${r0y - 70 * S} Q${midX} ${r0y - 40 * S} ${r1x} ${r1y - 70 * S}`} fill="none" stroke={GOLD} strokeWidth={12} strokeLinecap="round" />
        ) : (
          <g>
            <path d={`M${r0x} ${r0y - 70 * S} Q${lerp(midX - 60, r0x + 30, sag)} ${lerp(r0y - 40 * S, r0y + 40 * S, sag)} ${lerp(midX - 10, r0x + 20, sag)} ${lerp(r0y - 45 * S, r0y + 60 * S, sag)}`} fill="none" stroke={GOLD} strokeWidth={12} strokeLinecap="round" />
            <path d={`M${r1x} ${r1y - 70 * S} Q${lerp(midX + 60, r1x - 30, sag)} ${lerp(r1y - 40 * S, r1y + 40 * S, sag)} ${lerp(midX + 10, r1x - 20, sag)} ${lerp(r1y - 45 * S, r1y + 60 * S, sag)}`} fill="none" stroke={GOLD} strokeWidth={12} strokeLinecap="round" />
          </g>
        )}
      </g>
      {/* the steamship */}
      <Glow x={shx} y={shy - shipH * 0.5} r={shipW * 0.6} color={GOLD} o={0.35} id="c10s6shipg" />
      <Smoke t={t} x={shx - shipW * 0.08} y={shy - shipH * 0.82} s={ss * S} o={0.45} color="#C9C2D6" />
      <image href={staticFile(EL('steamship-1869'))} x={shx - shipW / 2} y={shy - shipH * 0.95} width={shipW} height={shipH} {...lb('object', 'c10s6ship')} />
      <RevealRing t={t} at={T.tanfatih} x={midX} y={r0y - 60} r={240} boom={false} />
      {broke && <Sparkle x={midX} y={r0y - 70 * S} r={40 * (1 - clamp01((t - T.tanfatih) / 0.6))} o={0.9} color="#FFF3C0" />}
      {/* Ismail on the pavilion */}
      {t >= T.ismail - 0.4 && (
        <g opacity={clamp01((t - T.ismail + 0.4) / 0.3)}>
          <Glow x={ix} y={iy - 160 * S} r={200 * S} color={GOLD} o={0.4} id="c10s6ig" />
          <StoryPerson x={ix} y={iy} s={0.62 * S} hat="tarboush" outfit="bisht" rim={GOLD} pose={t >= T.ostori ? 'cheer' : 'up'} flip t={t} id="c10s6ismail" />
        </g>
      )}
      <NPill text="الخديوي إسماعيل" x={Math.min(ix - 40, 1620)} y={iy - 330 * S} size={46} kind="white" id="c10s6name" p={(t - T.ismail + 0.1) / 0.3} />
      <NPill text="قناة السويس" x={sx2} y={sy2 + 40} size={52} kind="white" id="c10s6suez" p={(t - T.suez + 0.1) / 0.3} />
      {/* the legendary party */}
      <PlateFx t={t} kind="confetti" density={t >= T.ostori ? 1 : 0.35} seed={7} />
      <Firework t={t} at={633.2} x={420} y={200} r={130} color={GOLD} />
      <Firework t={t} at={T.ostori - 0.05} x={520} y={240} r={230} color={GOLD} n={20} />
      <Firework t={t} at={T.ostori + 0.15} x={1380} y={200} r={210} color="#FFFFFF" n={20} />
      <Firework t={t} at={T.ostori + 0.4} x={960} y={130} r={160} color={CYAN} />
      <NPill text="احتفال أسطوري" x={960} y={175} size={56} kind="gold" id="c10s6party" p={(t - T.ostori + 0.05) / 0.3} />
    </g>
  );
};

// ==================================================================================================================
// S7 · 637.48 · «ويصرف أكثر من مليون دولار بس على ضيافة الملوك والضيوف الأجانب» — the palace banquet
const Chandelier: React.FC<{t: number; x: number; y: number; id: string}> = ({t, x, y, id}) => (
  <g>
    <line x1={x} y1={-10} x2={x} y2={y - 40} stroke={OUT} strokeWidth={6} />
    <Glow x={x} y={y + 10} r={220} color="#FFD27A" o={0.45 + 0.05 * Math.sin(t * 3 + phaseOf(id))} id={id} />
    <path d={`M${x - 120} ${y} Q${x} ${y + 70} ${x + 120} ${y}`} fill="none" stroke="#E0A82A" strokeWidth={12} strokeLinecap="round" />
    <path d={`M${x - 120} ${y} Q${x} ${y + 70} ${x + 120} ${y}`} fill="none" stroke={OUT} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
    <circle cx={x} cy={y + 30} r={26} fill="#F2C14E" stroke={OUT} strokeWidth={5} />
    {[-120, -60, 0, 60, 120].map((dx, i) => (
      <g key={i}>
        <rect x={x + dx - 6} y={y - 34 + (dx === 0 ? 30 : Math.abs(dx) === 60 ? 22 : 0)} width={12} height={28} rx={3} fill="#FFF4D8" stroke={OUT} strokeWidth={3} />
        <ellipse cx={x + dx} cy={y - 44 + (dx === 0 ? 30 : Math.abs(dx) === 60 ? 22 : 0)} rx={7} ry={11 + Math.sin(t * 9 + i) * 2} fill="#FFD23F" />
      </g>
    ))}
  </g>
);

const CROWN_GUESTS = [
  {x: 640, role: 'king' as const, rim: '#FFFFFF'},
  {x: 900, role: 'queen' as const, rim: CYAN},
  {x: 1160, role: 'king' as const, rim: '#FFFFFF'},
];
export const S7: React.FC<{t: number}> = ({t}) => {
  const TY = 770; // table top
  const bag = {x: 1530, y: 905};
  const open = ease.out(clamp01((t - T.s7) / 0.4));
  const glint = clamp01((t - T.muluk) / 0.6);
  return (
    <g>
      <RoomWorld t={t} id="c10s7r" winX={1480} winY={60} />
      <rect x={0} y={0} width={1920} height={1080} fill="#3A1A05" opacity={0.25} />
      <Chandelier t={t} x={560} y={170} id="c10s7c1" />
      <Chandelier t={t} x={1150} y={150} id="c10s7c2" />
      {/* crowned guests behind the table */}
      {CROWN_GUESTS.map((g, i) => (
        <g key={i}>
          <StoryPerson x={g.x} y={TY + 150} s={0.82} role={g.role} rim={g.rim} pose={t >= T.muluk + i * 0.1 && t < T.muluk + 1.2 ? 'cheer' : 'idle'} t={t} id={`c10s7g${i}`} />
          {glint > 0 && glint < 1 && <Sparkle x={g.x + 26} y={TY + 150 - 350} r={34 * Math.sin(Math.PI * glint)} o={1} color="#FFF3C0" />}
        </g>
      ))}
      {/* the foreign guests slide in at the far end */}
      {[0, 1].map((i) => {
        const x = moveTo(t, T.ajanib - 0.35 + i * 0.12, -200, 230 + i * 150, 0.6, ease.out);
        return t >= T.ajanib - 0.35 + i * 0.12 && (
          <StoryPerson key={i} x={x} y={TY + 150} s={0.82} hat="top" outfit="suit" body={i ? '#2B3A6B' : '#4A3A6A'} rim={CYAN} pose="idle" t={t} id={`c10s7f${i}`} />
        );
      })}
      {/* the long banquet table */}
      <g>
        <rect x={360} y={TY - 10} width={1060} height={36} rx={10} fill="#FFF8E8" stroke={OUT} strokeWidth={7} />
        <path d={`M370 ${TY + 24} L1410 ${TY + 24} L1390 ${TY + 150} L390 ${TY + 150} Z`} fill="#F1E3C4" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
        <path d={`M370 ${TY + 24} L1410 ${TY + 24} L1405 ${TY + 60} L375 ${TY + 60} Z`} fill="#C9A24A" opacity={0.6} />
        {[480, 700, 920, 1140, 1320].map((x, i) => (
          <g key={i}>
            <ellipse cx={x} cy={TY + 2} rx={52} ry={14} fill="#FFFFFF" stroke={OUT} strokeWidth={4} />
            <path d={`M${x + 60} ${TY - 2} l6 -40 l14 0 l6 40 Z`} fill="#F2C14E" stroke={OUT} strokeWidth={3} />
          </g>
        ))}
      </g>
      {/* the coins arc from Ismail's bag onto the table */}
      {Array.from({length: 14}, (_, i) => {
        const at = T.million - 0.3 + i * 0.07;
        const e = t - at;
        if (e < 0) return null;
        const p = ease.out(clamp01(e / 0.65));
        const tx = 1300 - i * 62, ty = TY - 18 - (i % 3) * 8;
        const x = lerp(bag.x, tx, p), y = lerp(bag.y - 140, ty, p) - Math.sin(Math.PI * p) * 220;
        return <Coin key={i} x={x} y={y} r={20} t={t} spin={p < 1 ? 9 : 0} phase={i} />;
      })}
      {/* Ismail at the head of the table, opening the money bag */}
      <Glow x={1650} y={720} r={260} color={GOLD} o={0.35} id="c10s7ig" />
      <StoryPerson x={1660} y={1000} s={0.95} hat="tarboush" outfit="bisht" rim={GOLD} pose={t >= T.s7 && t < T.million + 0.8 ? 'hold' : 'talk'} flip t={t} id="c10s7ismail" />
      <g transform={`translate(${bag.x} ${bag.y}) rotate(${-14 * open}) translate(${-bag.x} ${-bag.y})`}>
        <MoneyBag x={bag.x} y={bag.y} s={1.15} />
      </g>
      <Glow x={bag.x} y={bag.y - 140} r={110} color={GOLD} o={0.6 * open} id="c10s7bag" />
      <NPill text="أكثر من مليون $" x={900} y={330} size={60} kind="gold" id="c10s7m" p={(t - T.million + 0.1) / 0.3} />
      {t < T.ajanib - 0.2 && <Pop t={t} at={T.million + 0.15} x={900} y={440} out={T.ajanib - 0.45}><GlowText text="أكثر من مليون دولار" x={900} y={440} size={56} tone="white" id="c10s7sp" /></Pop>}
      <NPill text="ضيوف أجانب" x={380} y={440} size={48} kind="white" id="c10s7f" p={(t - T.ajanib + 0.1) / 0.3} />
    </g>
  );
};

// ==================================================================================================================
// S8 · 642.12 · «إسماعيل كان عنده حلم كبير: يخلي مصر قطعة من أوروبا» — the dream cloud
const NEON_EU = [
  // an opera dome (left)
  'M380 610 L380 470 Q380 360 470 340 Q560 360 560 470 L560 610 M350 610 L590 610 M470 340 L470 300 M420 470 L520 470',
  // columns (right)
  'M1180 610 L1180 430 M1240 610 L1240 430 M1300 610 L1300 430 M1360 610 L1360 430 M1150 430 L1390 430 L1270 360 Z M1150 610 L1390 610',
  // a clock tower (far right)
  'M1440 610 L1440 300 L1520 300 L1520 610 M1430 300 L1480 210 L1530 300 M1480 360 m-26 0 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0',
];
export const S8: React.FC<{t: number}> = ({t}) => {
  const cl = ease.out(clamp01((t - (T.s8 + 0.2)) / 0.7));
  const puffs: [number, number, number][] = [[960, 450, 300], [700, 470, 210], [1220, 470, 220], [820, 330, 190], [1100, 320, 200], [560, 560, 150], [1360, 560, 150], [960, 600, 230]];
  const neon = ease.inOut(clamp01((t - T.misr) / 0.9));
  const words = [{w: 'قطعة', at: T.qitaa}, {w: 'من', at: T.min}, {w: 'أوروبا', at: T.europa, tone: 'gold' as const}];
  const tw = words.reduce((s, w) => s + textWidth(w.w, 120), 0) + 2 * 24;
  return (
    <g>
      <NightSky t={t} id="c10s8s" />
      {/* thought bubbles from Ismail up to the cloud */}
      {[[1540, 760, 22], [1480, 690, 34], [1400, 620, 48]].map(([x, y, r], i) => (
        <Pop key={i} t={t} at={T.s8 + 0.05 + i * 0.08} x={x} y={y}><circle cx={x} cy={y} r={r} fill="#E9E2FF" stroke={OUT} strokeWidth={6} /></Pop>
      ))}
      {cl > 0 && (
        <g transform={`translate(960 470) scale(${0.3 + 0.7 * cl}) translate(-960 -470)`} opacity={clamp01(cl * 2)}>
          <Glow x={960} y={460} r={760} ry={420} color="#B98BFF" o={0.45} id="c10s8cg" />
          {puffs.map(([x, y, r], i) => <circle key={`o${i}`} cx={x} cy={y} r={r + 8} fill={OUT} />)}
          {puffs.map(([x, y, r], i) => <circle key={`f${i}`} cx={x} cy={y} r={r} fill="#E9E2FF" />)}
          {puffs.map(([x, y, r], i) => <circle key={`h${i}`} cx={x - r * 0.15} cy={y - r * 0.2} r={r * 0.75} fill="#FFFFFF" opacity={0.5} />)}
          {/* the European outlines drawing in neon gold */}
          {neon > 0 && NEON_EU.map((d, i) => (
            <g key={i}>
              <path d={d} fill="none" stroke={GOLD} strokeWidth={16} opacity={0.35} pathLength={1} strokeDasharray={`${neon} 1`} strokeLinecap="round" strokeLinejoin="round" />
              <path d={d} fill="none" stroke="#E0A20E" strokeWidth={7} pathLength={1} strokeDasharray={`${neon} 1`} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
        </g>
      )}
      <HeroObject t={t} at={T.hilm - 0.1} src={EL('khedive-palace')} ar={1.028} x={960} y={455} h={420} glow={GOLD} enter="pop" id="c10s8pal" />
      <RevealRing t={t} at={T.hilm - 0.1} x={960} y={455} r={300} boom={false} />
      <Glow x={1600} y={880} r={200} color={GOLD} o={0.3} id="c10s8ig" />
      <StoryPerson x={1610} y={1040} s={0.62} hat="tarboush" outfit="bisht" rim={GOLD} pose="up" flip t={t} id="c10s8ismail" />
      <WordPop t={t} id="c10s8h" y={880} size={120} right={900 + tw / 2} words={words} gap={24} />
    </g>
  );
};

// ==================================================================================================================
// S9 · 645.90 · «قصور، مشاريع، تحديث. بس كل هذا كان بالدين» — the spending list, then a red tag on every row
const PalaceGlyph = () => (
  <g fill="#FFFFFF" stroke="none">
    <path d="M-16 12 L-16 -2 Q0 -22 16 -2 L16 12 Z" />
    <rect x={-20} y={10} width={40} height={6} />
    <rect x={-1.5} y={-26} width={3} height={8} />
  </g>
);
const CraneGlyph = () => (
  <g stroke="#FFFFFF" strokeWidth={4} fill="none" strokeLinecap="round">
    <path d="M-10 16 L-10 -18 L20 -18 M-10 -18 L-22 -12 M16 -18 L16 -4" />
    <rect x={10} y={-4} width={12} height={8} fill="#FFFFFF" stroke="none" />
  </g>
);
const TrainGlyph = () => (
  <g fill="#FFFFFF" stroke="none">
    <rect x={-18} y={-16} width={30} height={22} rx={4} />
    <rect x={12} y={-8} width={8} height={14} />
    <rect x={-12} y={-24} width={6} height={9} />
    <circle cx={-10} cy={12} r={5} />
    <circle cx={8} cy={12} r={5} />
  </g>
);
const LIST = {x: 1240, y: 330, gap: 160, w: 780};
export const S9: React.FC<{t: number}> = ({t}) => {
  const tilt = moveTo(t, T.bas, 0, -3.5, 0.5);
  const rows = [
    {text: 'قصور', at: T.s9 - 0.1, icon: <PalaceGlyph />, color: GOLD},
    {text: 'مشاريع', at: T.mashari - 0.1, icon: <CraneGlyph />, color: CYAN},
    {text: 'تحديث', at: T.tahdith - 0.1, icon: <TrainGlyph />, color: '#22C55E'},
  ];
  return (
    <g transform={`rotate(${tilt} 960 540)`}>
      <NightSky t={t} id="c10s9s" />
      <GridFloor id="c10s9f" t={t} wide />
      <HeroObject t={t} at={T.s9 - 2} src={EL('khedive-palace')} ar={1.028} x={470} y={560} h={440} glow={GOLD} id="c10s9pal" />
      <IconList t={t} rows={rows} x={LIST.x} y={LIST.y} w={LIST.w} size={56} gap={LIST.gap} id="c10s9l" />
      {/* «بالدين»: a red «دين» tag swings onto every row */}
      {rows.map((r, i) => {
        const at = T.dayn - 0.1 + i * 0.15;
        const e = t - at;
        if (e < 0) return null;
        const y = LIST.y + i * LIST.gap;
        const x = LIST.x - LIST.w / 2 - 30;
        const rot = 28 * Math.exp(-e * 3.2) * Math.cos(e * 10);
        return (
          <g key={i} transform={`rotate(${rot} ${x} ${y - 46})`}>
            <line x1={x} y1={y - 46} x2={x} y2={y - 10} stroke="#FFFFFF" strokeWidth={4} opacity={clamp01(e / 0.2)} />
            <NPill text="دين" x={x} y={y + 22} size={42} kind="red" id={`c10s9d${i}`} p={e / 0.3} />
          </g>
        );
      })}
      <Glow x={960} y={540} r={900} ry={600} color={RED} o={0.18 * clamp01((t - T.dayn) / 0.4)} id="c10s9red" />
    </g>
  );
};

// ==================================================================================================================
// the DEBT TUBE (S10 → S11): a tall glass tube filling green → yellow → red. (x = centre, b = bottom, h = height)
const TUBE = {x: 760, b: 960, h: 720, w: 150};
const Tube: React.FC<{t: number; level: number; id: string}> = ({t, level, id}) => {
  const g = uid('c10tube', id);
  const {x, b, h, w} = TUBE;
  const fh = h * clamp01(level);
  return (
    <g {...lb('object', id)}>
      <defs>
        <linearGradient id={g} x1={0} y1={b} x2={0} y2={b - h} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22C55E" />
          <stop offset="0.5" stopColor="#FFC928" />
          <stop offset="1" stopColor="#FD4B5B" />
        </linearGradient>
        <clipPath id={g + 'c'}>
          <rect x={x - w / 2 + 14} y={b - h + 14} width={w - 28} height={h - 28} rx={(w - 28) / 2} />
        </clipPath>
        <filter id={g + 'b'} x="-60%" y="-20%" width="220%" height="140%">
          <feGaussianBlur stdDeviation={26} />
        </filter>
      </defs>
      {fh > 4 && <rect x={x - w / 2} y={b - fh} width={w} height={fh} rx={w / 2} fill={level > 0.6 ? RED : '#22C55E'} opacity={0.45} filter={`url(#${g}b)`} />}
      <rect x={x - w / 2} y={b - h} width={w} height={h} rx={w / 2} fill="#140C2A" stroke={OUT} strokeWidth={10} />
      <g clipPath={`url(#${g}c)`}>
        <rect x={x - w / 2} y={b - 14 - fh} width={w} height={fh + 14} fill={`url(#${g})`} />
        {fh > 10 && <ellipse cx={x} cy={b - 14 - fh} rx={w / 2} ry={8 + Math.sin(t * 6) * 3} fill="#FFFFFF" opacity={0.35} />}
      </g>
      <rect x={x - w / 2 + 22} y={b - h + 40} width={14} height={h - 80} rx={7} fill="#FFFFFF" opacity={0.22} />
      {Array.from({length: 9}, (_, i) => <rect key={i} x={x + w / 2 + 10} y={b - 14 - ((i + 1) / 10) * (h - 28)} width={i % 2 ? 22 : 36} height={6} rx={3} fill="#FFFFFF" opacity={0.5} />)}
      <rect x={x - w / 2 - 30} y={b - 6} width={w + 60} height={30} rx={10} fill="#2A1E4A" stroke={OUT} strokeWidth={7} />
    </g>
  );
};
const debtLevel = (t: number) => (t < T.duyun ? 0.07 * clamp01((t - T.s10 - 0.3) / 0.6) : lerp(0.07, 0.97, ease.inOut(clamp01((t - T.duyun) / 2.4))));

// S10 · 649.80 · «ولما وصلنا لسنة 1875، ديون مصر صارت تقريبًا 100 مليون جنيه إسترليني»
export const S10: React.FC<{t: number}> = ({t}) => {
  const lv = debtLevel(t);
  const climbing = t >= T.duyun && t < T.duyun + 2.4;
  const ay = TUBE.b - 14 - TUBE.h * lv;
  cueSfx('rise', 'c10s10rise', climbing && t < T.duyun + 0.3, TUBE.x, {at: T.duyun, gain: 0.8});
  return (
    <g>
      <NightSky t={t} id="c10s10s" />
      <GridFloor id="c10s10f" t={t} wide />
      <Glow x={TUBE.x} y={600} r={420} ry={520} color={lv > 0.6 ? RED : '#22C55E'} o={0.25} id="c10s10g" />
      <Tube t={t} level={lv} id="c10s10tube" />
      {climbing && (
        <g transform={`translate(${TUBE.x - 160} ${ay + Math.sin(t * 9) * 10})`}>
          <path d="M0 -40 L32 0 L12 0 L12 40 L-12 40 L-12 0 L-32 0 Z" fill={RED} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
        </g>
      )}
      <NPill text="ديون مصر" x={TUBE.x} y={170} size={52} kind="white" id="c10s10t" p={(t - T.s10 - 0.15) / 0.3} />
      <YearBadge t={t} at={T.y1875 - 0.1} year={1875} x={1640} y={180} id="c10s10y" size={110} />
      <CountNumber t={t} at={T.h100 - 1.4} dur={1.4} value="100 مليون £" x={1310} y={360} size={130} tone="red" id="c10s10n" />
      <Pop t={t} at={T.spoken} x={1310} y={500}><GlowText text="تقريبًا 100 مليون جنيه إسترليني" x={1310} y={500} size={56} tone="white" id="c10s10sp" /></Pop>
    </g>
  );
};

// S11 · 656.10 · «بعد ما كانت حوالي 7 ملايين بس لما استلم الحكم» — dive to the base, then whip back to the red top
export const S11: React.FC<{t: number}> = ({t}) => {
  const dive = move(t, T.s11 + 0.1, [960, 540], [760, 860], 0.75);
  const back = move(t, T.whip, [0, 0], [1, 0], 0.5);
  const zIn = moveTo(t, T.s11 + 0.1, 1, 2.1, 0.75);
  const kb = back[0];
  const cx = lerp(dive[0], 900, kb), cy = lerp(dive[1], 540, kb);
  const z = lerp(zIn, 1, kb) * (1 + 0.004 * Math.max(0, t - T.s11));
  const scr = (wx: number, wy: number): [number, number] => [960 + (wx - cx) * z, 540 + (wy - cy) * z];
  const lv = 0.97;
  const sevenY = TUBE.b - 14 - (TUBE.h - 28) * 0.07;
  const [sx, sy] = scr(TUBE.x + TUBE.w / 2 + 10, sevenY);
  const [ix, iy] = scr(600, TUBE.b);
  const [topx, topy] = scr(TUBE.x, TUBE.b - TUBE.h);
  const lit = clamp01((t - T.seven + 0.1) / 0.3);
  cueSfx('whoosh', 'c10s11whip', t >= T.whip && t < T.whip + 0.3, 960, {at: T.whip, hit: 0.2, gain: 0.8});
  return (
    <g>
      <NightSky t={t} id="c10s11s" />
      <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
        <GridFloor id="c10s11f" t={t} wide />
        <Glow x={TUBE.x} y={600} r={420} ry={520} color={RED} o={0.25} id="c10s11g" />
        <Tube t={t} level={lv} id="c10s11tube" />
        {/* the grey 7-million mark near the base */}
        <rect x={TUBE.x - TUBE.w / 2 - 20} y={sevenY - 4} width={TUBE.w + 40} height={8} rx={4} fill="#C9C6D6" opacity={0.3 + 0.7 * lit} />
        <Glow x={TUBE.x} y={sevenY} r={140} ry={50} color="#FFFFFF" o={0.4 * lit} id="c10s11sev" />
        <g opacity={clamp01((t - T.istalam + 0.4) / 0.3)}>
          <StoryPerson x={600} y={TUBE.b} s={0.36} hat="tarboush" outfit="bisht" rim={GOLD} pose="point" t={t} id="c10s11ismail" />
        </g>
      </g>
      <NPill text="7 ملايين" x={sx + 150} y={sy} size={48} kind="grey" id="c10s11seven" p={(t - T.seven + 0.1) / 0.3} />
      {t < T.whip + 0.2 && <NPill text="لما استلم الحكم" x={ix} y={iy - 330 * Math.max(z, 1) * 0.5} size={46} kind="white" id="c10s11gov" p={((t - T.istalam + 0.1) / 0.3) * (1 - clamp01((t - T.whip) / 0.2))} />}
      <NPill text="100 مليون £" x={topx + 280} y={topy + 40} size={56} kind="red" id="c10s11top" p={(t - T.whip - 0.2) / 0.3} />
    </g>
  );
};

// ==================================================================================================================
// S12 · 659.50 · «والفلوس خلصت. وكان باقي عند مصر شيء واحد له قيمة» — the bag tips, the lights die, one spotlight
const TILE = {x: 1180, y: 560, w: 360, h: 230};
export const S12: React.FC<{t: number}> = ({t}) => {
  const bx = 640, by = 940;
  const tip = moveTo(t, T.khilsat - 0.1, 0, -78, 0.45, ease.out);
  const cx0 = bx - 30, cx1 = 1020;
  const roll = t >= T.khilsat + 0.2 ? moveTo(t, T.khilsat + 0.2, cx0, cx1, 1.0, ease.out) : cx0;
  const dark = clamp01((t - T.wakan) / 0.35);
  const spot = t >= T.shay ? 1 : 0;
  const glint = clamp01((t - T.qima + 0.1) / 0.6);
  cueSfx('coins', 'c10s12roll', t >= T.khilsat + 0.2 && t < T.khilsat + 0.5, roll, {at: T.khilsat + 0.2, gain: 0.6});
  cueSfx('thump', 'c10s12spot', t >= T.shay && t < T.shay + 0.3, TILE.x, {at: T.shay, hit: 0.03});
  return (
    <g>
      <RoomWorld t={t} id="c10s12r" winX={1380} winY={90} />
      <rect x={0} y={0} width={1920} height={1080} fill="#05030F" opacity={0.25} />
      {/* the empty bag tips over */}
      <g transform={`translate(${bx + 70} ${by}) rotate(${tip}) translate(${-bx - 70} ${-by})`}>
        <MoneyBag x={bx} y={by} s={2.0} />
      </g>
      {t >= T.khilsat + 0.2 && <Coin x={roll} y={by - 30} r={30} t={t} spin={0} />}
      {t >= T.khilsat + 1.1 && t < T.khilsat + 1.8 && (
        <g opacity={1 - clamp01((t - T.khilsat - 1.1) / 0.7)}>
          {[0, 1, 2].map((i) => <circle key={i} cx={cx1 - 30 + i * 30} cy={by - 10 - (t - T.khilsat - 1.1) * 40} r={14 + (t - T.khilsat - 1.1) * 30} fill="#C9B79A" opacity={0.5} />)}
        </g>
      )}
      {/* the lights die */}
      <rect x={0} y={0} width={1920} height={1080} fill="#020108" opacity={0.93 * dark} />
      {spot > 0 && (
        <g>
          <Spotlight x={TILE.x} y={TILE.y + 330} top={-40} w={620} color="#FFF1C4" id="c10s12sp" o={0.85} />
          <Glow x={TILE.x} y={TILE.y} r={340} color={GOLD} o={0.3} id="c10s12g" />
          <MysteryTile t={t} at={T.shay + 0.05} x={TILE.x} y={TILE.y} w={TILE.w} h={TILE.h} id="c10s12tile" />
          {glint > 0 && glint < 1 && (
            <g opacity={Math.sin(Math.PI * glint)}>
              <path d={`M${TILE.x - TILE.w / 2 + glint * TILE.w * 1.2 - 80} ${TILE.y - TILE.h / 2} l60 0 l-90 ${TILE.h} l-60 0 Z`} fill="#FFFFFF" opacity={0.55} />
              <Sparkle x={TILE.x + TILE.w * 0.4} y={TILE.y - TILE.h * 0.45} r={40} o={1} color="#FFF3C0" />
            </g>
          )}
        </g>
      )}
      <NPill text="قيمة" x={TILE.x} y={TILE.y + 210} size={52} kind="gold" id="c10s12q" p={(t - T.qima + 0.05) / 0.3} />
    </g>
  );
};

// ==================================================================================================================
// S13 · 663.10 · «حصتها في شركة قناة السويس، حوالي 44% من الأسهم» — the tile flips into the share; the 44 % donut
const CERT = {x: 700, y: 520, h: 610};
export const S13: React.FC<{t: number}> = ({t}) => {
  const f = clamp01((t - T.s13) / 0.45);
  const sx = f < 0.5 ? 1 - ease.inOut(f * 2) : ease.inOut((f - 0.5) * 2);
  cueSfx('swish', 'c10s13flip', t >= T.s13 && t < T.s13 + 0.3, CERT.x, {at: T.s13, hit: 0.2});
  const dk = 0.44 * ease.inOut(clamp01((t - T.p44) / 1.4));
  const D = {x: 1390, y: 450, r: 200};
  const arc = (k: number) => {
    const a = -Math.PI / 2 + k * Math.PI * 2;
    return `M${D.x} ${D.y - D.r} A${D.r} ${D.r} 0 ${k > 0.5 ? 1 : 0} 1 ${D.x + Math.cos(a) * D.r} ${D.y + Math.sin(a) * D.r}`;
  };
  const donut = popAt(t, T.p44 - 0.25);
  return (
    <g>
      <Rays t={t} id="c10s13r" x={CERT.x} y={CERT.y} tone="gold" />
      <g transform={`translate(${CERT.x} ${CERT.y}) scale(${Math.max(0.02, sx)} 1) translate(${-CERT.x} ${-CERT.y})`}>
        {f < 0.5 ? (
          <MysteryTile t={t} x={CERT.x} y={CERT.y} w={TILE.w} h={TILE.h} id="c10s13tile" />
        ) : (
          <HeroObject t={t} at={T.s13 - 1} src={EL('share-certificate')} ar={0.86} x={CERT.x} y={CERT.y} h={CERT.h} glow={GOLD} id="c10s13cert" />
        )}
      </g>
      <RevealRing t={t} at={T.s13 + 0.22} x={CERT.x} y={CERT.y} r={340} />
      <NPill text="شركة قناة السويس" x={CERT.x} y={905} size={50} kind="white" id="c10s13c" p={(t - T.sharika + 0.1) / 0.3} />
      {donut.o > 0 && (
        <g transform={`translate(${D.x} ${D.y}) scale(${donut.s}) translate(${-D.x} ${-D.y})`} opacity={donut.o} {...lb('object', 'c10s13donut')}>
          <circle cx={D.x} cy={D.y} r={D.r + 46} fill="#140C2A" stroke={OUT} strokeWidth={8} />
          <circle cx={D.x} cy={D.y} r={D.r} fill="none" stroke="#3A2E5A" strokeWidth={60} />
          {dk > 0.002 && <path d={arc(dk)} fill="none" stroke={GOLD} strokeWidth={60} />}
          {dk > 0.002 && <path d={arc(dk)} fill="none" stroke="#FFF1B0" strokeWidth={14} opacity={0.6} />}
          <circle cx={D.x} cy={D.y} r={D.r - 32} fill="#0F0824" stroke={OUT} strokeWidth={6} />
        </g>
      )}
      <CountNumber t={t} at={T.p44} dur={1.4} value="44%" x={D.x} y={D.y} size={110} tone="gold" id="c10s13n" />
      <NPill text="من الأسهم" x={D.x} y={790} size={50} kind="white" id="c10s13a" p={(t - T.ashum + 0.1) / 0.3} />
    </g>
  );
};

// ==================================================================================================================
// S15 · 670.40 · «والرجال ما انتظر حتى موافقة البرلمان، راح لعائلة روتشيلد واقترض المبلغ» — London night
const PARL = 'M1060 830 L1060 560 L1120 560 L1120 500 L1160 500 L1160 560 L1600 560 L1600 500 L1640 500 L1640 560 L1700 560 L1700 830 Z M1120 830 L1120 640 M1220 830 L1220 640 M1320 830 L1320 640 M1420 830 L1420 640 M1520 830 L1520 640 M1620 830 L1620 640 M1760 830 L1760 330 L1840 330 L1840 830 M1750 330 L1800 230 L1850 330 M1800 400 m-28 0 a28 28 0 1 0 56 0 a28 28 0 1 0 -56 0';
export const S15: React.FC<{t: number}> = ({t}) => {
  const [dx] = move(t, T.walk, [1450, 0], [880, 0], 2.9);
  const walking = t >= T.walk && t < T.walk + 2.9;
  const neon = ease.inOut(clamp01((t - T.s15) / 1.0));
  const door = ease.out(clamp01((t - (T.rothschild - 0.45)) / 0.5));
  const [px] = move(t, T.iqtarad - 0.05, [430, 0], [700, 0], 0.55, ease.out);
  return (
    <g>
      <NightCity t={t} id="c10s15c" />
      <rect x={0} y={0} width={1920} height={1080} fill="#06102E" opacity={0.3} />
      {/* the neon parliament */}
      <path d={PARL} fill="none" stroke={CYAN} strokeWidth={18} opacity={0.3} pathLength={1} strokeDasharray={`${neon} 1`} strokeLinejoin="round" />
      <path d={PARL} fill="none" stroke="#BDF8FF" strokeWidth={6} pathLength={1} strokeDasharray={`${neon} 1`} strokeLinejoin="round" />
      {/* the dark door that opens to warm light */}
      <g>
        <rect x={190} y={470} width={300} height={430} rx={12} fill="#120A06" stroke={OUT} strokeWidth={10} />
        <rect x={210} y={490} width={260} height={410} fill="#FFC870" opacity={0.85 * door} />
        <Glow x={340} y={720} r={360} color="#FFC870" o={0.5 * door} id="c10s15door" />
        <path d={`M210 490 L${210 + 260 * (1 - door * 0.8)} ${490 + 20 * door} L${210 + 260 * (1 - door * 0.8)} ${900 - 20 * door} L210 900 Z`} fill="#3A2412" stroke={OUT} strokeWidth={6} />
      </g>
      {door > 0.3 && <StoryPerson x={360} y={960} s={0.9} role="banker" hat="top" rim={GOLD} pose={t >= T.iqtarad ? 'point' : 'idle'} t={t} id="c10s15banker" />}
      <StoryTable x={620} y={830} w={360} />
      {t >= T.iqtarad - 0.05 && (
        <HeroObject t={t} at={T.iqtarad - 0.05} src={EL('sovereign-pile')} ar={1.27} x={px} y={720} h={230} glow={GOLD} enter="pop" float={false} id="c10s15gold" />
      )}
      <StoryPerson x={dx} y={960} s={0.9} role="politician" hat="top" rim={CYAN} prop="none" pose={walking ? 'walk' : t >= T.iqtarad ? 'cheer' : 'idle'} flip t={t} id="c10s15dis" />
      <MarkPill t={t} at={T.barlaman} text="موافقة البرلمان" x={1360} y={240} mark="cross" size={50} id="c10s15p" />
      <NPill text="عائلة روتشيلد" x={360} y={400} size={48} kind="white" id="c10s15r" p={(t - T.rothschild + 0.1) / 0.3} />
      <NPill text="اقترض" x={700} y={540} size={46} kind="gold" id="c10s15q" p={(t - T.iqtarad - 0.2) / 0.3} />
    </g>
  );
};

// ==================================================================================================================
// THE DESK (S16 → S18): lamp-lit wood desk, panelled wall + clock, the contract, two cuffs (cyan Britain · gold Egypt)
const SIG16 = sigPts(1120, 800, 790, 30, 100);
const Desk: React.FC<{t: number; ink: number; sealAt: number; id: string}> = ({t, ink, sealAt, id}) => {
  const g = uid('c10desk', id);
  const sec = Math.floor(t);
  return (
    <g>
      <defs>
        <linearGradient id={g + 'w'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A160E" />
          <stop offset="1" stopColor="#3A2014" />
        </linearGradient>
        <linearGradient id={g + 'd'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7A4526" />
          <stop offset="1" stopColor="#3A1E10" />
        </linearGradient>
      </defs>
      {/* wall */}
      <rect x={0} y={0} width={1920} height={430} fill={`url(#${g}w)`} />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={40 + i * 320} y={40} width={280} height={340} rx={10} fill="none" stroke="#5A3420" strokeWidth={6} />)}
      {/* the clock (ticks every second) */}
      <g>
        <circle cx={330} cy={210} r={100} fill="#F4E7C6" stroke="#C99A2E" strokeWidth={14} />
        <circle cx={330} cy={210} r={100} fill="none" stroke={OUT} strokeWidth={4} />
        {Array.from({length: 12}, (_, i) => <rect key={i} x={327} y={122} width={6} height={16} fill={OUT} transform={`rotate(${i * 30} 330 210)`} />)}
        <line x1={330} y1={210} x2={330} y2={150} stroke={OUT} strokeWidth={8} strokeLinecap="round" transform="rotate(320 330 210)" />
        <line x1={330} y1={210} x2={330} y2={128} stroke={RED} strokeWidth={4} strokeLinecap="round" transform={`rotate(${sec * 6} 330 210)`} />
        <circle cx={330} cy={210} r={9} fill={OUT} />
      </g>
      {/* desk */}
      <rect x={0} y={430} width={1920} height={650} fill={`url(#${g}d)`} />
      {[520, 640, 790, 960].map((y, i) => <line key={i} x1={0} y1={y} x2={1920} y2={y + 6} stroke="#2A140A" strokeWidth={3} opacity={0.5} />)}
      <rect x={0} y={420} width={1920} height={20} fill="#8A5A34" stroke={OUT} strokeWidth={5} />
      {/* the brass lamp + its warm pool */}
      <Glow x={980} y={640} r={820} ry={430} color="#FFB54A" o={0.42} id={`${id}pool`} />
      <g>
        <rect x={1510} y={560} width={120} height={22} rx={8} fill="#C99A2E" stroke={OUT} strokeWidth={6} />
        <path d="M1570 560 L1560 330 L1500 300" fill="none" stroke="#C99A2E" strokeWidth={14} strokeLinecap="round" />
        <path d="M1570 560 L1560 330 L1500 300" fill="none" stroke={OUT} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
        <path d="M1380 300 Q1440 210 1560 250 L1540 330 Z" fill="#1F5A3A" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
        <ellipse cx={1460} cy={322} rx={60} ry={14} fill="#FFF1C4" />
      </g>
      {/* the contract */}
      <Paper x={960} y={650} w={640} h={540} rot={-2} lines={7} sy={810} id={`${id}paper`} />
      <Signature pts={SIG16} k={ink} id={`${id}ink`} w={7} />
      {/* the cuffs: cyan (Britain) left, gold (Egypt) right */}
      <g>
        <path d="M-40 1120 L210 860 L330 960 L120 1160 Z" fill="#1B2440" stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
        <path d="M200 870 L245 830 L365 930 L320 970 Z" fill={CYAN} stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
        <circle cx={330} cy={860} r={58} fill={CYAN} stroke={OUT} strokeWidth={7} />
        <path d="M1960 1120 L1710 860 L1590 960 L1800 1160 Z" fill="#2A1E12" stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
        <path d="M1720 870 L1675 830 L1555 930 L1600 970 Z" fill={GOLD} stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
        <circle cx={1590} cy={860} r={58} fill={GOLD} stroke={OUT} strokeWidth={7} />
      </g>
      {/* the wax seal + the gold stamp */}
      {t >= sealAt && (() => {
        const pr = pressIn((t - sealAt) / 0.165);
        return (
          <g transform={`translate(1170 805) scale(${pr.s})`} opacity={pr.o}>
            <circle r={70} fill="#B3122A" stroke={OUT} strokeWidth={7} />
            <circle r={50} fill="none" stroke={GOLD} strokeWidth={6} />
            <path d="M-22 -8 L0 -30 L22 -8 L14 22 L-14 22 Z" fill={GOLD} stroke={OUT} strokeWidth={3} />
          </g>
        );
      })()}
      <Stamp t={t} at={sealAt} text="تمت الصفقة" x={930} y={545} size={92} rot={-7} color={GOLD} />
    </g>
  );
};

// S16 · 675.50 · «وفي 25 نوفمبر سنة 1875 تمت الصفقة» ★ — the same pen signs, the seal lands on «الصفقة»
export const S16: React.FC<{t: number}> = ({t}) => {
  const sigC = [960, 790];
  const pin = move(t, T.tammat - 0.55, [960, 600], [sigC[0], sigC[1]], 0.75);
  const zIn = moveTo(t, T.tammat - 0.55, 1.02, 1.4, 0.75);
  const lift = moveTo(t, T.safqa - 0.08, 0, 1, 0.45, ease.out);
  const cx = lerp(pin[0], 960, lift), cy = lerp(pin[1], 640, lift);
  const z = lerp(zIn, 1.12, lift) * (1 + 0.003 * Math.max(0, t - T.s16));
  const se = t - T.safqa;
  const shake = se > 0 ? 9 * Math.exp(-se * 9) * Math.sin(se * 55) : 0;
  const ink = ease.inOut(clamp01((t - T.tammat) / 0.75));
  const [hx, hy] = inkHead(SIG16, ink);
  const [pdx, pdy] = move(t, T.tammat - 0.45, [1500, 300], [SIG16[0][0], SIG16[0][1]], 0.45, ease.out);
  const away = move(t, T.tammat + 0.78, [0, 0], [180, -260], 0.4);
  const [penX, penY] = t < T.tammat ? [pdx, pdy] : [hx + away[0], hy + away[1]];
  const penO = clamp01((t - T.tammat + 0.45) / 0.2) * (1 - clamp01((t - T.tammat - 1.05) / 0.2));
  const fade = 1 - clamp01((t - (T.tammat - 0.6)) / 0.3);
  return (
    <g>
      <g transform={`translate(${960 + shake} ${540 + shake * 0.6}) scale(${z}) translate(${-cx} ${-cy})`}>
        <Desk t={t} ink={ink} sealAt={T.safqa} id="c10s16d" />
        {ink > 0 && ink < 1 && <Sparkle x={hx} y={hy} r={16} o={0.9} color="#FFF3C0" />}
        <Pen x={penX} y={penY} h={300} o={penO} id="c10s16pen" />
        {se > 0 && se < 1.2 && Array.from({length: 14}, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const k = ease.out(clamp01(se / 0.8));
          return <Sparkle key={i} x={930 + Math.cos(a) * 260 * k} y={545 + Math.sin(a) * 150 * k} r={14 * (1 - clamp01(se / 1.2))} o={1} color={GOLD} />;
        })}
      </g>
      <g opacity={fade}>
        <NPill text="25 نوفمبر" x={1360} y={150} size={52} kind="white" id="c10s16nov" p={(t - T.nov + 0.1) / 0.3} />
        <YearBadge t={t} at={T.y1875b - 0.1} year={1875} x={1680} y={160} id="c10s16y" size={100} />
      </g>
      <Flash t={t} at={T.safqa} strength={0.3} color="#FFE7A0" />
    </g>
  );
};

// ==================================================================================================================
// S17 · 680.34 · «44% من أهم ممر مائي في العالم» — the canal draws on the paper map, then the world's route through it
const NEAR: [[number, number], [number, number]] = [[27.5, 26.5], [37.5, 33.2]];
const WIDE: [[number, number], [number, number]] = [[-12, 4], [80, 58]];
const PN = nightProj(NEAR), PW = nightProj(WIDE);
const CANAL: [number, number][] = [[32.3, 31.27], [32.31, 30.9], [32.27, 30.6], [32.35, 30.3], [32.55, 29.95]];
// similarity near-px → wide-px from the canal's two ends
const nA = PN(CANAL[0][0], CANAL[0][1]) as [number, number], nB = PN(CANAL[4][0], CANAL[4][1]) as [number, number];
const wA = PW(CANAL[0][0], CANAL[0][1]) as [number, number], wB = PW(CANAL[4][0], CANAL[4][1]) as [number, number];
const NB = Math.hypot(wB[0] - wA[0], wB[1] - wA[1]) / Math.hypot(nB[0] - nA[0], nB[1] - nA[1]);
const NC: [number, number] = [wA[0] - NB * nA[0], wA[1] - NB * nA[1]];
const NEAR_LAND = ['egypt', 'libya', 'sudan', 'israel', 'palestine', 'jordan', 'saudi arabia', 'cyprus', 'syria', 'lebanon', 'turkey'];
const WIDE_LAND = ['united kingdom', 'ireland', 'france', 'spain', 'portugal', 'italy', 'germany', 'belgium', 'netherlands', 'switzerland', 'austria', 'poland', 'czechia', 'hungary', 'romania', 'bulgaria', 'greece', 'serbia', 'croatia', 'ukraine', 'belarus', 'russia', 'turkey', 'syria', 'iraq', 'iran', 'saudi arabia', 'yemen', 'oman', 'united arab emirates', 'jordan', 'israel', 'lebanon', 'kuwait', 'qatar', 'libya', 'tunisia', 'algeria', 'morocco', 'sudan', 'south sudan', 'chad', 'niger', 'mali', 'mauritania', 'ethiopia', 'eritrea', 'somalia', 'djibouti', 'kenya', 'nigeria', 'afghanistan', 'pakistan', 'india', 'nepal', 'kazakhstan', 'turkmenistan', 'uzbekistan', 'georgia', 'azerbaijan', 'armenia', 'sweden', 'norway', 'finland', 'denmark', 'western sahara', 'burkina faso', 'cameroon', 'central african rep.', 'uganda', 'tajikistan', 'kyrgyzstan', 'china', 'bangladesh', 'sri lanka', 'myanmar'];
const ROUTES: [number, number][][] = [
  [[-5, 49.5], [-10, 43], [-9.5, 37], [-5.6, 35.95], [3, 37.5], [11, 37.4], [20, 34.6], [32.3, 31.6], [32.55, 29.9], [34.5, 27.5], [38.5, 21], [42.5, 14], [43.5, 12.4], [51, 13.5], [62, 16.5], [72.8, 18.95]],
  [[32.55, 29.9], [36, 25.5], [40, 18.5], [43.4, 12.6], [52, 11.5], [60, 9.5], [70, 7], [79.5, 6.5]],
];
export const S17: React.FC<{t: number}> = ({t}) => {
  // camera in WIDE px: starts so the near map fills the screen exactly (scale 1/NB), pulls back on «أهم»
  const Z0 = 1 / NB;
  const F0: [number, number] = [NC[0] + NB * 960, NC[1] + NB * 540];
  const kb = moveTo(t, T.ahamm - 0.05, 0, 1, 0.9);
  const z = Math.pow(Z0, 1 - kb) * (1 + 0.004 * Math.max(0, t - T.s17));
  const F: [number, number] = [lerp(F0[0], 960, kb), lerp(F0[1], 540, kb)];
  const scr = (lon: number, lat: number): [number, number] => {
    const [x, y] = PW(lon, lat) as [number, number];
    return [960 + (x - F[0]) * z, 540 + (y - F[1]) * z];
  };
  const nearO = 1 - clamp01((t - T.ahamm) / 0.45);
  const draw = ease.inOut(clamp01((t - T.s17 - 0.1) / 0.9));
  const pts = CANAL.map(([lo, la]) => scr(lo, la));
  const head = inkHead(pts, draw);
  const cd = 'M' + [...pts.slice(0, Math.floor(draw * (pts.length - 1)) + 1), head].map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
  const pulse = t >= T.alam ? 0.5 + 0.5 * Math.sin((t - T.alam) * 8) : 0;
  const routes = ROUTES.map((r) => r.map(([lo, la]) => scr(lo, la)));
  cueSfx('whoosh', 'c10s17canal', t >= T.s17 + 0.1 && t < T.s17 + 0.4, 960, {at: T.s17 + 0.1, hit: 0.4, gain: 0.7});
  const cam = `translate(960 540) scale(${z}) translate(${-F[0]} ${-F[1]})`;
  return (
    <g>
      <PaperMap t={t} id="c10s17pm" />
      <g opacity={1 - nearO}>
        <g transform={cam}>
          <NightMap t={t} region={WIDE} areas={[{countries: WIDE_LAND, fill: '#E9D9AE'}, {countries: ['egypt'], fill: '#F2C14E'}]} mode="paper" min={2.5} id="c10s17w" />
        </g>
      </g>
      {nearO > 0 && (
        <g opacity={nearO}>
          <g transform={`${cam} translate(${NC[0]} ${NC[1]}) scale(${NB})`}>
            <NightMap t={t} region={NEAR} areas={[{countries: NEAR_LAND, fill: '#E9D9AE'}, {countries: ['egypt'], fill: '#F2C14E'}]} mode="paper" min={3} detail="50m" id="c10s17n" />
          </g>
        </g>
      )}
      {/* the canal, drawn north → south in glowing gold */}
      <path d={cd} fill="none" stroke={GOLD} strokeWidth={34} opacity={0.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={cd} fill="none" stroke="#2F7FD8" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
      <path d={cd} fill="none" stroke={GOLD} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <NeonLines t={t} at={T.ahamm + 0.2} lines={routes} color={GOLD} dur={1.0} id="c10s17r" />
      {pulse > 0 && routes.map((r, i) => {
        const u = ((t - T.alam) * 0.6 + i * 0.4) % 1;
        const [px, py] = inkHead(r, u);
        return <circle key={i} cx={px} cy={py} r={12 + pulse * 6} fill="#FFF3C0" stroke={GOLD} strokeWidth={4} />;
      })}
      <NPill text="44%" x={Math.min(head[0] + 170, 1700)} y={head[1]} size={60} kind="gold" id="c10s17p" p={(t - T.s17 - 0.05) / 0.3} />
      <NPill text="أهم ممر مائي في العالم" x={960} y={150} size={52} kind="white" id="c10s17m" p={(t - T.mamarr + 0.1) / 0.3} />
    </g>
  );
};

// ==================================================================================================================
// S18 · 683.76 · «مقابل 4 مليون جنيه إسترليني» — back on the signed paper: 44 % beside a tiny grey price
export const S18: React.FC<{t: number}> = ({t}) => {
  const z = 1.18 + 0.006 * Math.max(0, t - T.s18);
  const fy = moveTo(t, T.four2 - 0.05, 420, 470, 0.4, ease.out);
  cueSfx('tick', 'c10s18four', t >= T.four2 - 0.05 && t < T.four2 + 0.25, 1240, {at: T.four2 - 0.05, hit: 0.12, gain: 0.8});
  return (
    <g>
      <g transform={`translate(960 540) scale(${z}) translate(-960 -640)`}>
        <Desk t={t} ink={1} sealAt={T.safqa} id="c10s18d" />
      </g>
      <NPill text="44%" x={900} y={470} size={90} kind="gold" id="c10s18p" p={(t - T.s18 - 0.1) / 0.3} />
      <NPill text="4 مليون £" x={1215} y={fy} size={34} kind="grey" id="c10s18f" p={(t - T.four2 + 0.05) / 0.3} />
      <Pop t={t} at={T.four2 + 0.3} x={960} y={930}><GlowText text="مقابل 4 مليون جنيه إسترليني" x={960} y={930} size={60} tone="grey" id="c10s18sp" /></Pop>
    </g>
  );
};
