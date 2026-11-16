// Custom shots for C02 (builder-owned, AZTIKA). Each: export const S<n>: React.FC<{t: number}> returning the shot's WORLD
// (SVG, no <Stage>/<NightScreen> — the chapter provides them; NightShots joins, drifts and pins the host).
// C02 · 38.30–109.40 · Mariner 1 — «خط صغير»
import React from 'react';
import {staticFile} from 'remotion';
import {clamp01, ease, keys, noise1, rand} from '../../../kit/anim';
import {GlowText, GridFloor, NightSky, NPill, RevealRing, WordPop, textWidth} from '../../../kit/night';
import {Flash, HeroObject, Mark, Rays, Stamp} from '../../../kit/night-fx';
import {ScienceWorld, StoryPerson, SunsetWorld} from '../../../kit/night-worlds';
import {Earth, SpaceWorld} from '../../../kit/night-space';
import {Callout, Lineup} from '../../../kit/night-story';
import {CalendarCard, MarkPill} from '../../../kit/night-data';
import {PlateWorld} from '../../../kit/night-places';
import {move, moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {EquationBar, MistakeBill, RangeSafetyButton, WobbleRocket} from '../shared';
import {OUT, popAt, prog} from '../shared/util';

const T = {
  usa: 41.14, // «أمريكا»
  race: 42.3, // «سباق الفضاء»
  ussr: 43.22, // «السوفييت»
  venus: 48.46, // «الزهرة»
  mariner: 49.37, // «مارينر 1»
  one: 50.08, // «1»
  lift: 51.16, // «ينطلق»
  sway: 53.4, // «يتمايل»
  off: 53.96, // «ويطلع عن مساره»
  stop: 55.84, // «توقفه»
  fix: 56.94, // «وتصلحه»
  officer: 57.52, // «فضابط السلامة»
  press: 58.6, // «ضغط»
  destruct: 59.14, // «التدمير»
  boom: 60.5, // «انفجر»
  five: 61.84, // «خمس دقائق»
  why: 63.29, // «وش السبب؟»
  engine: 64.21, // «محرك»
  fuel: 65.1, // «وقود»
  storm: 65.99, // «عاصفة»
  line: 67.3, // «خط صغير»
  mark: 68.41, // «علامة … كان»
  above: 69.9, // «فوق رمز»
  forgot: 71.2, // «وأحد نسيها» (71.56)
  computer: 73.56, // «للكمبيوتر»
  noTrust: 74.56, // «لا تصدق»
  avg: 76.06, // «خذ المتوسط»
  without: 77.84, // «وبدونه صار»
  shake: 79.7, // «اهتزازة»
  disaster: 81.28, // «كارثة»
  fixes: 81.8, // «ويصلحها»
  harder: 83.18, // «أعنف»
  lost: 84.2, // «ضاع الصاروخ»
  then: 86.8, // «18.5»
  today: 89.88, // «150»
  notDash: 97.08, // «مو شرطة»
  name: 98.31, // «الاسم علق»
  backup: 102.5, // «انطلقت»
  weeks: 103.16, // «خمس أسابيع»
  win: 104.48, // «ونجحت»
};

const ROCKET = 'ar-costly-mistakes/el/mariner-rocket.png';
const PROBE = 'ar-costly-mistakes/el/mariner-probe.png';
const VENUS = 'ar-costly-mistakes/el/planet-venus.png';
const ALARM = 'ar-costly-mistakes/el/alarm-light.png';

/** point on a quadratic bezier */
const qb = (u: number, a: [number, number], c: [number, number], b: [number, number]): [number, number] => {
  const k0 = (1 - u) * (1 - u), k1 = 2 * u * (1 - u), k2 = u * u;
  return [k0 * a[0] + k1 * c[0] + k2 * b[0], k0 * a[1] + k1 * c[1] + k2 * b[1]];
};

/** dotted path drawn on (dots appear up to progress p) */
const DotPath: React.FC<{a: [number, number]; c: [number, number]; b: [number, number]; p: number; n?: number; color?: string; r?: number}> = ({a, c, b, p, n = 26, color = '#FCC018', r = 9}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const u = i / (n - 1);
      const k = clamp01((p - u) * n);
      if (k <= 0) return null;
      const [x, y] = qb(u, a, c, b);
      return (
        <g key={i}>
          <circle cx={x} cy={y} r={r * 1.9} fill={color} opacity={0.22 * k} />
          <circle cx={x} cy={y} r={r * (0.4 + 0.6 * k)} fill={color} stroke={OUT} strokeWidth={3} />
        </g>
      );
    })}
  </g>
);

/** a small race rocket (code-drawn, upright, centred on 0,0) with its trail colour */
const MiniRocket: React.FC<{x: number; y: number; s: number; nose: string; trail: string; t: number; id: string; tail: number}> = ({x, y, s, nose, trail, t, id, tail}) => {
  const fl = 0.85 + 0.15 * noise1(t * 12, id.length);
  return (
    <g>
      <rect x={x - 16 * s} y={y + 60 * s} width={32 * s} height={tail} rx={16 * s} fill={trail} opacity={0.35} />
      <rect x={x - 7 * s} y={y + 60 * s} width={14 * s} height={tail * 0.8} rx={7 * s} fill={trail} opacity={0.75} />
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <path d={`M-14 58 Q0 ${58 + 70 * fl} 14 58 Z`} fill="#FFB43A" />
        <path d="M-22 40 L-40 66 L-18 60 Z M22 40 L40 66 L18 60 Z" fill={nose} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
        <path d="M-22 60 V-20 Q-22 -62 0 -84 Q22 -62 22 -20 V60 Z" fill="#E9ECF4" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
        <path d="M-17 -34 Q0 -50 17 -34 Q12 -64 0 -78 Q-12 -64 -17 -34 Z" fill={nose} />
        <circle cx={0} cy={0} r={9} fill="#7FD8FF" stroke={OUT} strokeWidth={4} />
        <rect x={-14} y={-24} width={5} height={70} rx={2.5} fill="#FFFFFF" opacity={0.85} />
      </g>
    </g>
  );
};

// S2 · 41.14 · «أمريكا في عز سباق الفضاء مع السوفييت» — two leaders on the globe, two rockets race up between them
export const S2: React.FC<{t: number}> = ({t}) => {
  const a = 41.14;
  const usa = popAt(t, T.usa - 0.12), su = popAt(t, T.ussr - 0.12);
  const rise = (d: number, lag: number) => moveTo(t, T.race - 0.05 + lag, 930, 260, d, ease.inOut);
  const yG = rise(1.5, 0), yR = rise(1.6, 0.12);
  const racing = t >= T.race - 0.05;
  const tail = (y: number) => Math.max(0, 900 - y) * 0.9;
  return (
    <g>
      <SpaceWorld t={t} id="c2s2" />
      <Earth t={t} x={960} y={1960} r={1100} id="c2s2e" lon={-60} lat={30} />
      {racing && (
        <g>
          <MiniRocket x={880} y={yG} s={0.95} nose="#FCC018" trail="#FCC018" t={t} id="g" tail={tail(yG)} />
          <MiniRocket x={1040} y={yR} s={0.95} nose="#E23A4E" trail="#FF5A6A" t={t} id="red" tail={tail(yR)} />
        </g>
      )}
      {/* USA — right (Arabic reads right first) */}
      <g opacity={usa.o} transform={`translate(1450 990) scale(${usa.s}) translate(-1450 -990)`}>
        <StoryPerson x={1450} y={990} s={1.25} role="politician" pose="point" flip t={t - a} id="c2s2-usa" />
      </g>
      <g opacity={su.o} transform={`translate(470 990) scale(${su.s}) translate(-470 -990)`}>
        <StoryPerson x={470} y={990} s={1.25} role="officer" hat="army" rim="#FF5A6A" pose="point" t={t - a} id="c2s2-su" />
      </g>
      <NPill text="أمريكا" x={1450} y={400} size={48} kind="white" id="c2s2-p1" p={(t - T.usa) / 0.3} />
      <NPill text="السوفييت" x={470} y={400} size={48} kind="red" id="c2s2-p2" p={(t - T.ussr) / 0.3} />
      <NPill text="سباق الفضاء" x={960} y={150} size={56} kind="gold" id="c2s2-p3" p={(t - T.race) / 0.3} />
    </g>
  );
};

// S4 · 48.18 · «كوكب الزهرة … اسمها مارينر 1» — the probe and the dotted road to Venus
export const S4: React.FC<{t: number}> = ({t}) => {
  const a = 48.18;
  const vs = moveTo(t, a, 0.85, 1.08, 2.2, ease.out);
  const P0: [number, number] = [1440, 600], C0: [number, number] = [1000, 180], P1: [number, number] = [560, 470];
  const road = ease.inOut(prog(t, a + 0.15, 1.6));
  // the probe sets off on «1»
  const u = 0.12 * ease.inOut(prog(t, T.one - 0.1, 0.6)) + 0.02 * clamp01(t - T.one - 0.5);
  const [px, py] = qb(u, P0, C0, P1);
  return (
    <g>
      <SpaceWorld t={t} id="c2s4" />
      <Rays t={t} id="c2s4r" x={560} y={470} tone="violet" n={14} />
      <g transform={`translate(560 470) scale(${vs}) translate(-560 -470)`}>
        <HeroObject t={t} at={a} src={VENUS} ar={1} x={560} y={470} h={440} glow="#FFC24A" enter="zoom" id="c2s4-venus" />
      </g>
      <DotPath a={P0} c={C0} b={P1} p={road} n={24} />
      <HeroObject t={t} at={a + 0.1} src={PROBE} ar={1.509} x={px} y={py} h={210} glow="#FFC928" enter="pop" id="c2s4-probe" />
      <NPill text="الزهرة" x={560} y={760} size={52} kind="white" id="c2s4-p1" p={(t - T.venus + 0.1) / 0.3} />
      <RevealRing t={t} at={T.mariner - 0.1} x={1440} y={600} r={200} boom={false} />
      <NPill text="مارينر 1" x={1440} y={420} size={60} kind="gold" id="c2s4-p2" p={(t - T.mariner + 0.1) / 0.3} />
    </g>
  );
};

/** the night sky above the launch plate (so the camera can tilt up past the plate's top) */
const SkyAbove: React.FC<{t: number}> = ({t}) => (
  <g>
    <defs>
      <linearGradient id="c2-skyab" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0A0624" />
        <stop offset="1" stopColor="#2B2A70" />
      </linearGradient>
      <linearGradient id="c2-seam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2B2A70" stopOpacity={1} />
        <stop offset="1" stopColor="#2B2A70" stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect x={-200} y={-1400} width={2320} height={1420} fill="url(#c2-skyab)" />
    {Array.from({length: 46}, (_, i) => (
      <circle key={i} cx={rand(i * 3 + 1) * 1920} cy={-1380 + rand(i * 7 + 2) * 1380} r={1.5 + rand(i + 5) * 2.5} fill="#FFFFFF" opacity={0.35 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2 + i))} />
    ))}
  </g>
);

// S5 · 50.46 · «الصاروخ ينطلق … يتمايل ويطلع عن مساره» — lift-off from the dawn pad, camera tilts up, the path bends away
export const S5: React.FC<{t: number}> = ({t}) => {
  const camY = keys(t, [[T.lift + 0.3, 0], [T.lift + 2.2, 380], [54.98 + 0.5, 640]], ease.inOut);
  const s = 1.15, L = 380 * s;
  const x0 = 960, y0 = 880, cx = 960, cy = 120, x1 = 1350, y1 = -760;
  const start: [number, number] = [x0, y0 - L * 0.48];
  const planned = ease.inOut(prog(t, T.lift + 0.2, 1.6));
  return (
    <g>
      <g transform={`translate(0 ${camY})`}>
        <SkyAbove t={t} />
        <PlateWorld t={t} src="ar-costly-mistakes/bg/launch-1962.jpg" id="c2s5" at={50.46} dur={5} look="natural" from={{x: 0.5, y: 0.6, s: 1.04}} to={{x: 0.5, y: 0.55, s: 1.08}} />
        <rect x={-200} y={-4} width={2320} height={110} fill="url(#c2-seam)" />
        {/* the plan: a dashed white path */}
        <g opacity={0.85}>
          {Array.from({length: 30}, (_, i) => {
            const u = i / 29;
            if (u > planned) return null;
            const [px, py] = qb(u, start, [cx, cy], [x1, y1]);
            return <circle key={i} cx={px} cy={py} r={7} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeDasharray="6 5" />;
          })}
        </g>
        <WobbleRocket t={t} at={T.lift} x0={x0} y0={y0} x1={x1} y1={y1} cx={cx} cy={cy} dur={6.5} wobbleAt={T.sway} wobble={13} s={s} id="c2s5-rkt" />
      </g>
      <NPill text="عن مساره" x={1500} y={300} size={48} kind="red" id="c2s5-p" p={(t - T.off) / 0.3} />
    </g>
  );
};

// S6 · 54.98 · «ما تقدر توقفه على جنب الطريق وتصلحه» — the roadside gag
export const S6: React.FC<{t: number}> = ({t}) => {
  const a = 54.98;
  const look = t >= T.stop ? 'up' : 'idle';
  const x = popAt(t, T.fix - 0.08);
  cueSfx('pop', `c2s6-x-${T.fix}`, t >= T.fix - 0.08 && t < T.fix + 0.2, 1240, {at: T.fix - 0.08, hit: 0.1});
  return (
    <g>
      <SunsetWorld t={t} id="c2s6" skyline="desert" sunX={1500} sunY={640} />
      {/* the rocket, small and high, still wobbling */}
      <WobbleRocket t={t} at={a - 4} x0={560} y0={1100} cx={520} cy={500} x1={700} y1={-300} dur={7} wobbleAt={a - 2} wobble={10} s={0.42} pad={false} trail id="c2s6-rkt" />
      {/* the road */}
      <rect x={-100} y={850} width={2120} height={300} fill="#2A2238" />
      <rect x={-100} y={846} width={2120} height={14} fill="#4A3E5E" stroke={OUT} strokeWidth={4} />
      {Array.from({length: 9}, (_, i) => <rect key={i} x={-60 + i * 250} y={960} width={140} height={16} rx={8} fill="#FCC018" opacity={0.85} />)}
      {/* the roadside sign */}
      <g transform="translate(560 850)">
        <rect x={-10} y={-330} width={20} height={330} fill="#7E889E" stroke={OUT} strokeWidth={5} />
      </g>
      <NPill text="جنب الطريق" x={560} y={500} size={48} kind="white" id="c2s6-sign" p={(t - a - 0.1) / 0.3} />
      {/* the worker with his wrench, looking up at the sky */}
      <StoryPerson x={1150} y={1000} s={1.35} role="worker" pose={look} flip t={t - a} id="c2s6-wk" />
      {x.o > 0 && (
        <g transform={`translate(1380 560) scale(${x.s})`} opacity={x.o}>
          <Mark kind="cross" x={0} y={0} r={70} />
        </g>
      )}
    </g>
  );
};

// S7 · 57.52 · «فضابط السلامة ضغط زر التدمير» — the officer at his console; push in on the red button
export const S7: React.FC<{t: number}> = ({t}) => {
  const a = 57.52;
  const z = moveTo(t, T.press - 0.55, 1, 1.32, 0.6, ease.inOut);
  const fx = 1240, fy = 560;
  const alarm = t >= T.press ? 0.5 + 0.5 * Math.sin((t - T.press) * 14) : 0;
  return (
    <g>
      <g transform={`translate(${fx} ${fy}) scale(${z}) translate(${-fx} ${-fy})`}>
        <ScienceWorld t={t} id="c2s7" />
        {/* tracking screens on the wall */}
        {[0, 1, 2].map((i) => {
          const sx = 760 + i * 420;
          return (
            <g key={i}>
              <rect x={sx - 170} y={130} width={340} height={210} rx={18} fill="#06231C" stroke={OUT} strokeWidth={8} />
              <path d={`M${sx - 140} 310 Q${sx - 40} ${300 - 20 * i} ${sx + 20} 230 T${sx + 140} ${170 + 30 * Math.sin(t * 6 + i)}`} fill="none" stroke={i === 1 ? '#FF6B78' : '#57D9FA'} strokeWidth={6} strokeLinecap="round" />
              <circle cx={sx + 140} cy={170 + 30 * Math.sin(t * 6 + i)} r={10} fill="#FFFFFF" />
            </g>
          );
        })}
        {/* the console */}
        <path d="M200 1080 L330 820 H1720 L1820 1080 Z" fill="#232A44" stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
        <rect x={330} y={812} width={1390} height={22} rx={8} fill="#3C4260" stroke={OUT} strokeWidth={5} />
        {Array.from({length: 10}, (_, i) => (
          <circle key={i} cx={420 + i * 52} cy={900} r={11} fill={['#22C55E', '#FCC018', '#57D9FA'][i % 3]} opacity={0.5 + 0.5 * Math.sin(t * 4 + i * 1.7)} stroke={OUT} strokeWidth={3} />
        ))}
        <RangeSafetyButton t={t} x={1240} y={600} s={0.92} guardAt={58.1} pressAt={T.press} id="c2s7-btn" />
        <StoryPerson x={560} y={1060} s={1.45} role="officer" hat="officer" pose={t >= 58.1 ? 'point' : 'talk'} t={t - a} id="c2s7-off" />
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#FF2E4D" opacity={0.16 * alarm} />
      <NPill text="ضابط السلامة" x={560} y={330} size={50} kind="white" id="c2s7-p" p={(t - T.officer - 0.2) / 0.3} />
    </g>
  );
};

// S8 · 59.68 · «والصاروخ انفجر قبل ما يكمل خمس دقائق» — the burst in the sky
export const S8: React.FC<{t: number}> = ({t}) => {
  const e = t - T.boom;
  const sh = e > 0 && e < 0.6 ? (1 - e / 0.6) * 14 : 0;
  const dx = sh * noise1(t * 40, 2), dy = sh * noise1(t * 40, 9);
  return (
    <g>
      <g transform={`translate(${dx} ${dy})`}>
        <NightSky t={t} id="c2s8" stars={90} />
        <WobbleRocket t={t} at={58.5} x0={960} y0={1150} cx={960} cy={600} x1={1100} y1={-400} dur={4} wobbleAt={58.6} wobble={16} explodeAt={T.boom} s={0.8} pad={false} id="c2s8-rkt" />
      </g>
      <Flash t={t} at={T.boom} strength={0.55} />
      <NPill text="قبل 5 دقائق" x={980} y={860} size={56} kind="white" id="c2s8-p" p={(t - T.five + 0.1) / 0.3} />
    </g>
  );
};

/** lineup icons */
const Gear: React.FC = () => (
  <g>
    {Array.from({length: 8}, (_, i) => <rect key={i} x={-14} y={-92} width={28} height={36} rx={6} fill="#B9C1D6" stroke={OUT} strokeWidth={5} transform={`rotate(${i * 45})`} />)}
    <circle r={66} fill="#B9C1D6" stroke={OUT} strokeWidth={7} />
    <circle r={24} fill="#1E1840" stroke={OUT} strokeWidth={6} />
    <path d="M-48 -26 A54 54 0 0 1 -20 -50" fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={0.8} />
  </g>
);
const Fuel: React.FC = () => (
  <g>
    <path d="M0 -92 Q60 -10 60 30 A60 60 0 0 1 -60 30 Q-60 -10 0 -92 Z" fill="#FCC018" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-30 20 Q-32 50 -8 62" fill="none" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" opacity={0.8} />
  </g>
);
const Storm: React.FC = () => (
  <g>
    <path d="M-80 10 A40 40 0 0 1 -50 -50 A52 52 0 0 1 40 -62 A42 42 0 0 1 84 4 Q84 30 56 30 H-56 Q-80 30 -80 10 Z" fill="#9AA2B8" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
    <path d="M6 30 L-20 78 H8 L-10 116 L40 60 H12 L30 30 Z" fill="#FCC018" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
  </g>
);

// S9 · 63.02 · «طيب وش السبب؟ مو محرك، مو وقود، مو عاصفة»
export const S9: React.FC<{t: number}> = ({t}) => {
  const size = 130;
  const wW = textWidth('وش', size) + textWidth('السبب؟', size) + size * 0.2;
  return (
    <g>
      <NightSky t={t} id="c2s9" />
      <GridFloor id="c2s9f" t={t} />
      <WordPop t={t} id="c2s9-w" y={220} size={size} right={860 + wW / 2} words={[{w: 'وش', at: T.why - 0.15}, {w: 'السبب؟', at: T.why + 0.05, tone: 'gold'}]} />
      <Lineup t={t} id="c2s9-l" x={860} y={560} r={135} gap={90} items={[
        {label: 'محرك', at: 63.9, node: <Gear />, mark: 'cross', markAt: T.engine},
        {label: 'وقود', at: 64.8, node: <Fuel />, mark: 'cross', markAt: T.fuel},
        {label: 'عاصفة', at: 65.66, node: <Storm />, mark: 'cross', markAt: T.storm},
      ]} />
    </g>
  );
};

/** the 1962 pencil (foreground of the desk) */
const Pencil: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-300} y={6} width={560} height={46} rx={10} fill="#000" opacity={0.35} />
    <path d="M-300 -22 H200 L280 0 L200 22 H-300 Z" fill="#FCC018" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
    <path d="M200 -22 L280 0 L200 22 Z" fill="#E9C9A0" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
    <path d="M254 -8 L280 0 L254 8 Z" fill="#2B2440" />
    <rect x={-340} y={-22} width={48} height={44} rx={8} fill="#E8879A" stroke={OUT} strokeWidth={6} />
    <rect x={-300} y={-22} width={30} height={44} fill="#B9C1D6" stroke={OUT} strokeWidth={5} />
    <rect x={-260} y={-14} width={440} height={8} rx={4} fill="#FFFFFF" opacity={0.6} />
  </g>
);

// S10 ★ SIGNATURE · 66.60 · «السبب خط صغير … علامة كان المفروض تنكتب فوق رمز في معادلة، وأحد نسيها»
export const S10: React.FC<{t: number}> = ({t}) => {
  const a = 66.6;
  // camera: the whole card on the desk → push into R̄ → ease back a little as the bar floats away
  const z = keys(t, [[a, 0.82], [T.line - 0.2, 0.86], [T.mark + 0.4, 1.38], [70.7, 1.46], [72.2, 1.3]], ease.inOut);
  const cy = keys(t, [[a, 540], [T.line - 0.2, 530], [T.mark + 0.4, 470], [72.2, 430]], ease.inOut);
  const lift = 70.8;
  const glow = prog(t, T.line - 0.1, 0.35) * (1 - prog(t, lift, 0.3));
  const barY = 560 - 380 * 0.47;
  const pulse = prog(t, 71.56, 0.7);
  const lamp = 0.9 + 0.1 * noise1(t * 2, 4);
  cueSfx('pop', `c2s10-glow-${T.line}`, t >= T.line - 0.1 && t < T.line + 0.2, 960, {at: T.line - 0.1, hit: 0.1, gain: 0.6});
  return (
    <g>
      <defs>
        <linearGradient id="c2s10-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0C3640" />
          <stop offset="1" stopColor="#051A22" />
        </linearGradient>
        <filter id="c2s10-blur" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation={22} /></filter>
        <radialGradient id="c2s10-pool" cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#FFE9B0" stopOpacity={0.32} />
          <stop offset="1" stopColor="#FFE9B0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={`translate(960 540) scale(${z}) translate(-960 ${-cy})`}>
        <rect x={-800} y={-600} width={3520} height={2400} fill="url(#c2s10-desk)" />
        {/* desk grain lines */}
        {Array.from({length: 14}, (_, i) => <path key={i} d={`M-800 ${-500 + i * 170} q900 ${30 * Math.sin(i)} 3520 0`} fill="none" stroke="#14505C" strokeWidth={4} opacity={0.5} />)}
        <ellipse cx={860} cy={520} rx={1300} ry={900} fill="url(#c2s10-pool)" opacity={lamp} />
        <EquationBar t={t} at={a} x={960} y={560} w={1240} h={660} symbol="R" size={380} liftAt={lift} id="c2s10-eq" />
        {/* the rest of the equation, in faint chalk-white */}
        <GlowText text="2 +" x={600} y={590} size={150} tone="grey" id="c2s10-eqa" />
        {/* the tiny bar glows gold on «خط صغير» */}
        {glow > 0 && <ellipse cx={960} cy={barY} rx={150 + 40 * glow} ry={46 + 14 * glow} fill="#FCC018" opacity={0.55 * glow} filter="url(#c2s10-blur)" />}
        <Callout t={t} at={T.mark - 0.1} x={1080} y={barY - 6} lx={1360} ly={240} text="فوق الرمز" kind="gold" size={42} id="c2s10-co" out={lift - 0.1} />
        {/* «نسيها»: one red pulse around R, alone */}
        {pulse > 0 && pulse < 1 && <circle cx={960} cy={583} r={190 + 140 * ease.out(pulse)} fill="none" stroke="#FF2E4D" strokeWidth={14 * (1 - pulse)} opacity={1 - pulse} />}
        <Pencil x={1330} y={960} rot={-14} />
      </g>
      {/* the lamp, top-left, out of focus foreground */}
      <g opacity={0.95}>
        <path d="M-40 -40 L330 120" stroke="#2B2F45" strokeWidth={30} strokeLinecap="round" />
        <path d="M230 60 L420 120 L360 250 L170 190 Z" fill="#3A8F7A" stroke={OUT} strokeWidth={9} strokeLinejoin="round" />
        <ellipse cx={360} cy={220} rx={70} ry={26} fill="#FFF3C8" opacity={0.9 * lamp} transform="rotate(20 360 220)" />
      </g>
      {pulse > 0 && pulse < 1 && <rect x={0} y={0} width={1920} height={1080} fill="#FF2E4D" opacity={0.1 * (1 - pulse)} />}
    </g>
  );
};

/** the 1962 computer: a beige cabinet with a dark screen of readings, an alarm light on top */
const Computer: React.FC<{t: number; id: string; dots: [number, number]; jumpAt?: number; avgIn?: number; avgOut?: number; shakeAt?: number; rawAt?: number; alarmAt?: number}> = ({t, id, dots, jumpAt, avgIn, avgOut, shakeAt, rawAt, alarmAt}) => {
  const X = 860, Y = 600, W = 1180, H = 700, SW = 980, SH = 470, SY = Y - 40;
  const n = 20;
  const px = (i: number) => X - SW / 2 + 70 + ((SW - 140) * i) / (n - 1);
  const val = (i: number) => SY + 40 * Math.sin(i * 0.45 + 1) + (rand(i * 13 + 5) - 0.5) * 130;
  const jump = jumpAt === undefined ? 0 : ease.out(prog(t, jumpAt - 0.15, 0.25));
  const dotY = (i: number) => val(i) - (i === 13 ? 150 * jump : 0) + (shakeAt !== undefined && i === 10 && t >= shakeAt && t < shakeAt + 0.6 ? 14 * Math.sin((t - shakeAt) * 50) : 0);
  const avgV = (i: number) => {
    let s = 0, c = 0;
    for (let k = Math.max(0, i - 3); k <= Math.min(n - 1, i + 3); k++) { s += val(k); c++; }
    return s / c;
  };
  const avgPath = Array.from({length: n}, (_, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${avgV(i).toFixed(1)}`).join(' ');
  const rawPath = Array.from({length: n}, (_, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${(SY + (val(i) - SY) * (i % 2 ? 2.6 : -2.2)).toFixed(1)}`).join(' ');
  const avgP = avgIn === undefined ? 0 : ease.inOut(prog(t, avgIn - 0.1, 0.7));
  const avgO = avgOut === undefined ? 1 : 1 - prog(t, avgOut, 0.35);
  const rawP = rawAt === undefined ? 0 : ease.inOut(prog(t, rawAt, 1.0));
  const alarm = alarmAt !== undefined && t >= alarmAt ? 0.5 + 0.5 * Math.sin((t - alarmAt) * 12) : 0;
  if (alarmAt !== undefined) cueSfx('wrong', `c2-alarm-${id}`, t >= alarmAt && t < alarmAt + 0.3, X, {at: alarmAt, hit: 0.05});
  if (avgOut !== undefined) cueSfx('fall', `c2-avgout-${id}`, t >= avgOut && t < avgOut + 0.3, X, {at: avgOut, hit: 0.1, gain: 0.6});
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-cab`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E6DCC4" />
          <stop offset="1" stopColor="#A89C82" />
        </linearGradient>
        <clipPath id={`${id}-scr`}><rect x={X - SW / 2} y={SY - SH / 2} width={SW} height={SH} rx={30} /></clipPath>
        <clipPath id={`${id}-avg`}><rect x={X - SW / 2} y={SY - SH / 2} width={SW * avgP} height={SH} /></clipPath>
        <clipPath id={`${id}-raw`}><rect x={X - SW / 2} y={SY - SH / 2 - 400} width={SW * rawP} height={SH + 800} /></clipPath>
      </defs>
      {/* alarm glow */}
      <circle cx={X} cy={Y} r={760} fill="#FF2E4D" opacity={0.22 * alarm} />
      {/* cabinet */}
      <rect x={X - W / 2 + 18} y={Y - H / 2 + 26} width={W} height={H} rx={46} fill="#000" opacity={0.4} />
      <rect x={X - W / 2} y={Y - H / 2} width={W} height={H} rx={46} fill={`url(#${id}-cab)`} stroke={OUT} strokeWidth={10} />
      <rect x={X - W / 2 + 26} y={Y - H / 2 + 30} width={14} height={H - 60} rx={7} fill="#FFFFFF" opacity={0.6} />
      {/* screen */}
      <rect x={X - SW / 2 - 16} y={SY - SH / 2 - 16} width={SW + 32} height={SH + 32} rx={40} fill="#2B2F45" stroke={OUT} strokeWidth={8} />
      <g clipPath={`url(#${id}-scr)`}>
        <rect x={X - SW / 2} y={SY - SH / 2} width={SW} height={SH} fill="#062A2A" />
        {Array.from({length: 24}, (_, i) => <rect key={i} x={X - SW / 2} y={SY - SH / 2 + i * 20} width={SW} height={3} fill="#0E4A44" opacity={0.6} />)}
        <path d={`M${X - SW / 2 + 40} ${SY + SH / 2 - 40} H${X + SW / 2 - 40}`} stroke="#57D9FA" strokeWidth={4} opacity={0.5} />
        {/* the raw over-reacting line */}
        {rawP > 0 && (
          <g clipPath={`url(#${id}-raw)`}>
            <path d={rawPath} fill="none" stroke="#FF2E4D" strokeWidth={22} opacity={0.35} strokeLinejoin="round" />
            <path d={rawPath} fill="none" stroke="#FF6B78" strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
          </g>
        )}
        {/* the average line */}
        {avgP > 0 && avgO > 0 && (
          <g clipPath={`url(#${id}-avg)`} opacity={avgO}>
            <path d={avgPath} fill="none" stroke="#FCC018" strokeWidth={26} opacity={0.35} strokeLinejoin="round" />
            <path d={avgPath} fill="none" stroke={OUT} strokeWidth={16} strokeLinejoin="round" strokeLinecap="round" />
            <path d={avgPath} fill="none" stroke="#FCC018" strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
          </g>
        )}
        {/* the readings */}
        {Array.from({length: n}, (_, i) => {
          const k = clamp01((t - dots[0]) / (dots[1] - dots[0]) * n - i);
          if (k <= 0) return null;
          const jit = 5 * noise1(t * 3 + i * 7, i);
          return <circle key={i} cx={px(i)} cy={dotY(i) + jit} r={14 * (0.5 + 0.5 * ease.outBack(k))} fill={i === 13 && jump > 0 ? '#FF6B78' : '#FFFFFF'} stroke={OUT} strokeWidth={5} />;
        })}
      </g>
      {jumpAt !== undefined && t >= jumpAt && (() => {
        const q = popAt(t, jumpAt);
        return <g transform={`translate(${px(13) + 60} ${val(13) - 190}) scale(${q.s})`} opacity={q.o}><Mark kind="cross" x={0} y={0} r={36} /></g>;
      })()}
      {/* knobs + vents */}
      {[0, 1, 2].map((i) => <circle key={i} cx={X - 380 + i * 120} cy={Y + H / 2 - 60} r={24} fill="#5E6880" stroke={OUT} strokeWidth={6} />)}
      {Array.from({length: 6}, (_, i) => <rect key={i} x={X + 150 + i * 50} y={Y + H / 2 - 80} width={26} height={44} rx={8} fill="#7E7460" />)}
      {/* alarm light on top */}
      <g transform={`translate(${X - 380} ${Y - H / 2 - 50})`}>
        {alarm > 0 && <circle r={160} fill="#FF2E4D" opacity={0.45 * alarm} />}
        <HeroObject t={t} src={ALARM} ar={0.861} x={0} y={0} h={130} glow={alarm > 0 ? '#FF2E4D' : '#7A2030'} float={false} shine={false} sparkles={0} id={`${id}-al`} />
      </g>
    </g>
  );
};

// S11 · 72.16 · «الخط هذا كان يقول للكمبيوتر: لا تصدق كل قراءة لحالها، خذ المتوسط»
export const S11: React.FC<{t: number}> = ({t}) => (
  <g>
    <ScienceWorld t={t} id="c2s11" />
    <Computer t={t} id="c2s11c" dots={[72.4, 74.0]} jumpAt={T.noTrust} avgIn={T.avg} />
    {t >= T.avg && (() => {
      const q = popAt(t, T.avg + 0.25);
      return (
        <g>
          <NPill text="المتوسط" x={1180} y={210} size={52} kind="gold" id="c2s11-p" p={(t - T.avg - 0.2) / 0.3} />
          <g transform={`translate(1350 210) scale(${q.s})`} opacity={q.o}><Mark kind="check" x={0} y={0} r={32} /></g>
        </g>
      );
    })()}
  </g>
);

// S12 · 77.20 · «وبدونه صار الكمبيوتر يتعامل مع كل اهتزازة بسيطة كأنها كارثة»
export const S12: React.FC<{t: number}> = ({t}) => (
  <g>
    <ScienceWorld t={t} id="c2s12" />
    <Computer t={t} id="c2s12c" dots={[60, 61]} jumpAt={undefined} avgIn={60} avgOut={T.without - 0.1} shakeAt={T.shake - 0.05} rawAt={T.shake + 0.4} alarmAt={T.disaster - 0.2} />
    <WordPop t={t} id="c2s12-w" y={140} size={130} right={860 + textWidth('كارثة!', 130) / 2} words={[{w: 'كارثة!', at: T.disaster - 0.12, tone: 'red'}]} />
  </g>
);

// S13 · 81.55 · «ويصلحها بحركة أعنف منها، لين ضاع الصاروخ» — every correction bigger than the shake
export const S13: React.FC<{t: number}> = ({t}) => {
  const a = 81.55;
  const camY = keys(t, [[a, 0], [83.0, 320], [T.lost + 0.2, 640], [86, 700]], ease.inOut);
  const lostK = ease.in(prog(t, T.lost, 0.9));
  const L = 380 * 0.9;
  const start: [number, number] = [960, 1300 - L * 0.48];
  return (
    <g>
      <NightSky t={t} id="c2s13" stars={90} />
      <g transform={`translate(0 ${camY})`}>
        {/* the plan: a straight dashed line */}
        {Array.from({length: 26}, (_, i) => {
          const [px, py] = qb(i / 25, start, [960, 400], [960, -900]);
          return <circle key={i} cx={px} cy={py} r={7} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.7} />;
        })}
        <g opacity={1 - 0.75 * lostK}>
          <WobbleRocket t={t} at={80.0} x0={960} y0={1300} cx={960} cy={400} x1={960} y1={-900} dur={6} wobbleAt={a} wobble={24} s={0.9} pad={false} id="c2s13-rkt" />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#05010F" opacity={0.45 * lostK} />
      <NPill text="أعنف" x={1480} y={260} size={52} kind="red" id="c2s13-p" p={(t - T.harder + 0.1) / 0.3} />
    </g>
  );
};

// S14 · 85.32 · «التكلفة كانت حوالي 18.5 مليون … أكثر من 150 مليون بفلوس اليوم»
export const S14: React.FC<{t: number}> = ({t}) => (
  <g>
    <NightSky t={t} id="c2s14" />
    <Rays t={t} id="c2s14r" x={1160} y={560} tone="gold" n={16} />
    <GridFloor id="c2s14f" t={t} />
    <MistakeBill t={t} at={85.4} x={1160} y={545} w={860} title="فاتورة مارينر 1" id="c2s14-bill"
      rows={[{label: 'وقتها', value: '18.5 مليون $', at: T.then - 0.1}]}
      total={{label: 'اليوم', value: 'أكثر من 150 مليون $', tone: 'gold', at: T.today - 0.1}} />
  </g>
);

/** the gold bar alone (the same look as EquationBar's) */
const GoldBar: React.FC<{x: number; y: number; w: number; h: number; rot: number}> = ({x, y, w, h, rot}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill="#FCC018" opacity={0.5} transform="scale(1.15 1.8)" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill="#FCC018" stroke={OUT} strokeWidth={8} />
    <rect x={-w / 2 + h * 0.5} y={-h * 0.28} width={w - h} height={h * 0.18} rx={h * 0.09} fill="#FFFFFF" opacity={0.85} />
  </g>
);

// S16 · 95.78 · «مع إنها تقنيًا مو شرطة أصلًا، بس الاسم علق»
export const S16: React.FC<{t: number}> = ({t}) => {
  const a = 95.78;
  const [bx, by] = move(t, a, [1500, -120], [1240, 430], 0.9, ease.out);
  const rot = moveTo(t, a, -24, -3, 1.0, ease.out) + 2 * Math.sin(t * 1.6);
  const dash = popAt(t, a + 0.35);
  return (
    <g>
      <NightSky t={t} id="c2s16" />
      <Rays t={t} id="c2s16r" x={960} y={500} tone="violet" n={14} />
      {/* the bar, over a faint R (it was an over-line) */}
      <GlowText text="R" x={1240} y={660} size={360} tone="grey" id="c2s16-r" />
      <GoldBar x={bx} y={by} w={300} h={46} rot={rot} />
      {/* the dash */}
      <g transform={`translate(660 600) scale(${dash.s})`} opacity={dash.o}>
        <rect x={-190} y={-23} width={380} height={46} rx={23} fill="#FFFFFF" stroke={OUT} strokeWidth={9} />
      </g>
      <MarkPill t={t} at={T.notDash - 0.1} text="مو شرطة" x={660} y={780} size={56} id="c2s16-mp" />
      <Stamp t={t} at={T.name - 0.1} text="أغلى شرطة في التاريخ" x={1100} y={220} size={72} rot={-6} color="#FCC018" />
    </g>
  );
};

// S18 · 101.20 · «المركبة الاحتياطية انطلقت بعد خمس أسابيع بس، ونجحت»
export const S18: React.FC<{t: number}> = ({t}) => {
  const a = 101.2;
  const P0: [number, number] = [1420, 860], C0: [number, number] = [1100, 380], P1: [number, number] = [560, 400];
  const u = ease.inOut(prog(t, T.backup - 0.1, T.win - T.backup - 0.15));
  const [px, py] = qb(u, P0, C0, P1);
  const [nx, ny] = qb(Math.min(1, u + 0.02), P0, C0, P1);
  const ang = (Math.atan2(ny - py, nx - px) * 180) / Math.PI + 90;
  const isProbe = u > 0.55;
  const swap = clamp01((u - 0.5) / 0.1);
  return (
    <g>
      <SpaceWorld t={t} id="c2s18" />
      <Earth t={t} x={1500} y={1520} r={680} id="c2s18e" lon={-80} lat={28} />
      <HeroObject t={t} at={a} src={VENUS} ar={1} x={560} y={400} h={360} glow="#FFC24A" enter="zoom" id="c2s18-venus" />
      <DotPath a={P0} c={C0} b={P1} p={u} n={22} color="#FCC018" r={8} />
      {!isProbe && t >= T.backup - 0.15 && (
        <g transform={`translate(${px} ${py}) rotate(${ang})`} opacity={1 - swap}>
          <image href={staticFile(ROCKET)} x={-0.317 * 220 / 2} y={-110} width={0.317 * 220} height={220} />
        </g>
      )}
      {u > 0.45 && (
        <g opacity={swap}>
          <HeroObject t={t} src={PROBE} ar={1.509} x={px} y={py} h={150} glow="#FFC928" float={false} sparkles={2} id="c2s18-probe" />
        </g>
      )}
      <CalendarCard t={t} at={T.weeks - 0.1} x={1520} y={290} to={5} size={0.8} pill="أسابيع" id="c2s18-cal" />
      <RevealRing t={t} at={T.win - 0.1} x={560} y={400} r={260} color="#7CF0A0" boom={false} />
      <MarkPill t={t} at={T.win - 0.05} text="نجحت" mark="check" x={560} y={660} size={56} id="c2s18-ok" />
    </g>
  );
};
