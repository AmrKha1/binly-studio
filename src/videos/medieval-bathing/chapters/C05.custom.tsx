// Custom shots for C05 (builder-owned): "Not one simple wrong idea"
import React from 'react';
import {Stage, Cam, breathe} from '../../../kit/stage';
import {C, FONT_SERIF, FONT_SANS} from '../../../kit/theme';
import {camAt, clamp01, ease, lerp, ramp, rand, win} from '../../../kit/anim';
import {Kicker, Tag} from '../../../kit/text';
import {Icon} from '../../../kit/icons';
import {Bubble} from '../../../kit/cards';
import {Person, Emote} from '../../../kit/people';
import {Germ} from '../../../kit/science';
import {Banner, Bathhouse, Door, Lantern, Table} from '../../../kit/env';
import {LightPool, Steam, Particles} from '../../../kit/fx';
import {Miasma} from '../shared/Miasma';

// ---------------------------------------------------------------- cues
const T = {
  // S1 [300.90] "But before you file this away… Miasma wasn't the only theory in circulation."
  s1: 300.9,
  slide: 301.8, // "file this away"
  jam: 306.5, // "leaves out"
  pull: 307.3, // "Miasma"
  split: 308.3, // "only theory"
  // S3 [317.95] "People who had contact with the sick…"
  s3: 317.95,
  inf0: 318.1,
  inf1: 318.6,
  air: 321.0, // "same air"
  ring: 324.0, // "near the infected"
  // S6 [336.71] "So this wasn't a monolith."
  s6: 336.71,
  crack: 337.4,
  plaque: 340.2,
  strike: 341.2, // "simple, wrong"
  drift: 341.8,
  // S7 [342.72] "It was a live medical debate…"
  s7: 342.72,
  grow: 343.1,
  bub: 345.8, // "different conclusions"
  truth: 349.0, // "closer to the truth"
  // S8 [351.78] "There was also another reason… Bathhouses were crowded."
  s8: 351.78,
  iconsOut: 352.0,
  pull8: 356.3, // "crowded"
  crowded: 357.4,
  // S9 [358.08] "During an epidemic…"
  s9: 358.08,
  cool: 358.5,
  sick: 361.4, // "already be sick"
  cough: 361.6,
  reason: 363.2,
  germ: 365.6,
  // S11 [375.01] "Some of the fear was simply people noticing…"
  s11: 375.01,
  walk: 375.5,
  open: 377.9,
  pause: 380.2, // "mass death"
  close: 381.3,
  end: 382.32,
};

const mixc = (a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const m = (s: number) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, clamp01(k)));
  return '#' + [m(16), m(8), m(0)].map((v) => v.toString(16).padStart(2, '0')).join('');
};

// ---------------------------------------------------------------- shared local helpers
const BathSign: React.FC<{x: number; y: number; s?: number; t: number; glow?: number}> = ({x, y, s = 1, t, glow = 1}) => {
  const sw = Math.sin(t * 1.3) * 1.6;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-250} y={-60} width={26} height={150} rx={6} fill={C.woodDark} />
      <line x1={-236} y1={0} x2={130} y2={0} stroke={C.woodDark} strokeWidth={14} strokeLinecap="round" />
      <path d="M-236 70 L-150 4" stroke={C.woodDark} strokeWidth={9} />
      <g transform={`rotate(${sw} 0 0)`}>
        <Banner kind="hanging" w={170} h={240} color={C.wood} emblem="none" x={0} y={0} t={t} />
        <circle cx={0} cy={130} r={56} fill={C.paperLight} />
        <Icon name="bath" x={0} y={130} s={1.05} color={C.ink} accent={C.oxblood} knock={C.paperLight} />
      </g>
      <g transform={`rotate(${-sw * 0.8} -150 0)`}>
        <Lantern x={-150} y={186} chain={40} t={t} glow={glow} lit={glow > 0.04} />
      </g>
    </g>
  );
};

const PoreGlyph: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-44 -34 L-16 -34 Q-8 -34 -6 -20 L-4 14 Q0 26 4 14 L6 -20 Q8 -34 16 -34 L44 -34 L44 40 L-44 40 Z" fill={C.oxTint} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <ellipse cx={0} cy={-34} rx={18} ry={6} fill={C.ink} />
  </g>
);

// ---------------------------------------------------------------- S1
// S1 · 300.90 · filing cabinet: folder jams, page → Miasma card + face-down ? card
const FolderStack: React.FC<{x: number; y: number; w: number; h: number; rot?: number; fill: string; children?: React.ReactNode}> = ({x, y, w, h, rot = 0, fill, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={10} fill={C.ink} opacity={0.18} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={fill} stroke={C.ink} strokeWidth={4} />
    {children}
  </g>
);

export const S1: React.FC<{t: number}> = ({t}) => {
  const slide = ramp(t, T.slide, T.slide + 3.3, ease.out);
  const folderX = lerp(330, 1330, slide);
  const jamShake = win(t, T.jam, T.jam + 0.5) * Math.sin((t - T.jam) * 46) * 5 * (1 - clamp01((t - T.jam) / 0.5));
  const folderY = 470;
  // page sticks out, then pulls to centre
  const stick = ramp(t, T.jam + 0.1, T.jam + 0.6, ease.outBack);
  const pull = ramp(t, T.pull - 0.1, T.pull + 0.75);
  const px = lerp(1250, 700, pull);
  const py = lerp(folderY - 110 - 40 * stick, 520, pull) - Math.sin(pull * Math.PI) * 90;
  const psc = lerp(1, 1.7, pull);
  const prot = lerp(-9, 0, pull);
  const cardsP = ramp(t, T.split, T.split + 0.9, ease.outQuint);
  const flip = ramp(t, T.split + 0.1, T.split + 0.8);
  const pageVis = 1 - clamp01((t - T.split) / 0.12);
  const cabinetIn = ramp(t, T.s1, T.s1 + 0.6, ease.out);
  const dust = win(t, T.jam, T.jam + 0.9);
  const cx = 1400;
  return (
    <Stage bg={C.paperShade}>
      <rect x={0} y={880} width={1920} height={200} fill={C.paperDeep} />
      {/* filing cabinet */}
      <g opacity={cabinetIn} transform={`translate(${(1 - cabinetIn) * 60} 0)`}>
        <rect x={cx} y={250} width={380} height={640} rx={10} fill={C.woodLight} stroke={C.ink} strokeWidth={5} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={cx + 24} y={274 + i * 205} width={332} height={185} rx={6} fill={C.wood} stroke={C.ink} strokeWidth={4} />
            <rect x={cx + 130} y={304 + i * 205} width={120} height={36} rx={6} fill={C.paperLight} stroke={C.ink} strokeWidth={3} />
            <rect x={cx + 160} y={366 + i * 205} width={60} height={14} rx={7} fill={C.ink} />
          </g>
        ))}
        {/* open slot (middle drawer) */}
        <rect x={cx - 6} y={410} width={34} height={120} fill={C.ink} />
      </g>
      {/* page peeking out of the folder */}
      <g opacity={pageVis * clamp01(stick * 4)}>
        <g transform={`translate(${px} ${py}) rotate(${prot + Math.sin(t * 5) * 0.6 * (1 - pull)}) scale(${psc})`}>
          <rect x={-90} y={-120} width={180} height={240} rx={4} fill={C.paperLight} stroke={C.ink} strokeWidth={3} />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={-64} y={-84 + i * 30} width={i === 4 ? 70 : 128} height={8} rx={4} fill={C.inkFaint} />
          ))}
        </g>
      </g>
      {/* the folder, clipped by the slot */}
      <clipPath id="c5s1-clip">
        <rect x={0} y={0} width={cx} height={1080} />
      </clipPath>
      <g clipPath="url(#c5s1-clip)" opacity={1 - clamp01((t - T.pull - 0.5) / 0.6) * 0.0}>
        <FolderStack x={folderX + jamShake} y={folderY} w={440} h={150} fill={C.cautionTint}>
          <path d="M-220 -75 L-220 -92 Q-220 -102 -210 -102 L-120 -102 L-100 -75 Z" fill={C.cautionTint} stroke={C.ink} strokeWidth={4} />
          <text x={0} y={-6} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={25} letterSpacing={2} fill={C.ink}>
            MEDIEVAL DOCTORS:
          </text>
          <text x={0} y={34} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={30} letterSpacing={2} fill={C.oxblood}>
            SIMPLY WRONG
          </text>
        </FolderStack>
      </g>
      {/* jam puffs */}
      <Particles t={t} x={1260} y={400} w={140} h={90} n={7} seed={5} size={[5, 9]} color={C.paperDark} opacity={[0.3 * dust, 0.7 * dust]} vy={-30} vx={-20} />
      {/* two cards */}
      {cardsP > 0 && (
        <>
          <g transform={`translate(${lerp(700, 520, cardsP)} ${540 + Math.sin(t * 1.4) * 4}) rotate(${lerp(0, -4, cardsP)})`} opacity={clamp01(cardsP * 4)}>
            <rect x={-170 + 8} y={-230 + 10} width={340} height={460} rx={14} fill={C.ink} opacity={0.15} />
            <rect x={-170} y={-230} width={340} height={460} rx={14} fill={C.theoryTint} stroke={C.theory} strokeWidth={6} />
            <Icon name="wind" x={0} y={-60} s={2.3} color={C.theory} accent={C.theoryLight} knock={C.theoryTint} p={ramp(t, T.pull + 0.5, T.pull + 1.2, ease.outBack)} />
            <text x={0} y={140} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={64} fill={C.theory}>
              Miasma
            </text>
          </g>
          <g transform={`translate(${lerp(700, 900, cardsP)} ${540 + Math.sin(t * 1.4 + 1) * 4}) rotate(${lerp(0, 4, cardsP)}) scale(${Math.max(0.02, Math.abs(Math.cos(flip * Math.PI * 0.0 + (1 - flip) * 0)))} 1)`} opacity={clamp01(cardsP * 4)}>
            <rect x={-170 + 8} y={-230 + 10} width={340} height={460} rx={14} fill={C.ink} opacity={0.15} />
            <rect x={-170} y={-230} width={340} height={460} rx={14} fill={C.inkSoft} stroke={C.ink} strokeWidth={6} />
            <rect x={-146} y={-206} width={292} height={412} rx={8} fill="none" stroke={C.paperDark} strokeWidth={3} strokeDasharray="12 10" />
            <text x={0} y={52} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={190} fill={C.paperLight}>
              ?
            </text>
          </g>
        </>
      )}
      <Kicker x={960} y={150} text="THE STORY USUALLY LEAVES OUT" p={ramp(t, T.s1 + 0.4, T.s1 + 1.1)} />
    </Stage>
  );
};

// ---------------------------------------------------------------- S3
// S3 · 317.95 · figure field: contact spread, same air over everyone, green ring
type Fig = {x: number; y: number; inf: number; parent: number};
const COLS = 8;
const ROWS = 5;
const FIGS: Fig[] = (() => {
  const f: Fig[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      f.push({x: 200 + c * 217 + (rand(i + 3) - 0.5) * 50, y: 400 + r * 120 + (rand(i + 77) - 0.5) * 24, inf: -1, parent: -1});
    }
  const d = (a: number, b: number) => Math.hypot(f[a].x - f[b].x, f[a].y - f[b].y);
  const start = 2 * COLS + 3;
  f[start].inf = 0;
  const order = f
    .map((_, i) => i)
    .filter((i) => i !== start && d(i, start) < 480)
    .sort((a, b) => d(a, start) - d(b, start))
    .slice(0, 8);
  const done = [start];
  for (const i of order) {
    // parent = nearest already-infected neighbour (within contact range)
    let best = -1;
    for (const j of done) if (d(i, j) < 262 && (best < 0 || d(i, j) < d(i, best))) best = j;
    if (best < 0) continue;
    f[i].parent = best;
    f[i].inf = f[best].inf + 1;
    done.push(i);
  }
  return f;
})();
const infTime = (lvl: number) => (lvl === 0 ? T.inf0 : T.inf1 + (lvl - 1) * 0.62);

export const S3: React.FC<{t: number}> = ({t}) => {
  const infected = FIGS.filter((f) => f.inf >= 0);
  const cxm = infected.reduce((a, f) => a + f.x, 0) / infected.length;
  const cym = infected.reduce((a, f) => a + f.y, 0) / infected.length;
  const rx = Math.max(...infected.map((f) => Math.abs(f.x - cxm))) + 95;
  const ry = Math.max(...infected.map((f) => Math.abs(f.y - cym))) + 95;
  const air = ramp(t, T.air, T.air + 1.6, ease.out);
  const ringP = ramp(t, T.ring, T.ring + 0.9);
  return (
    <Stage bg={C.paper}>
      <Kicker x={960} y={150} text="WHAT HE NOTICED" p={ramp(t, T.s3 + 0.1, T.s3 + 0.7)} />
      {/* contact lines */}
      {FIGS.map((f, i) =>
        f.parent >= 0 ? (
          <line
            key={'l' + i}
            x1={FIGS[f.parent].x}
            y1={FIGS[f.parent].y - 40}
            x2={lerp(FIGS[f.parent].x, f.x, ramp(t, infTime(f.inf) - 0.3, infTime(f.inf), ease.out))}
            y2={lerp(FIGS[f.parent].y - 40, f.y - 40, ramp(t, infTime(f.inf) - 0.3, infTime(f.inf), ease.out))}
            stroke={C.oxblood}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray="2 11"
          />
        ) : null,
      )}
      {FIGS.map((f, i) => {
        const k = f.inf >= 0 ? ramp(t, infTime(f.inf) - 0.05, infTime(f.inf) + 0.3) : 0;
        const appear = ramp(t, T.s3 - 0.1 + (i % COLS) * 0.01 + Math.floor(i / COLS) * 0.015, T.s3 + 0.15 + (i % COLS) * 0.01, ease.out);
        const bob = Math.sin(t * 1.6 + i) * 1.5;
        const fill = mixc(C.paperLight, C.oxblood, k);
        const stroke = mixc(C.ink, C.oxDeep, k);
        return (
          <g key={i} transform={`translate(${f.x} ${f.y + bob + (1 - appear) * 14}) scale(${1.25 + k * 0.1})`} opacity={appear}>
            <path d="M-18 0 L-14 -54 Q0 -66 14 -54 L18 0 Z" fill={fill} stroke={stroke} strokeWidth={4} strokeLinejoin="round" />
            <circle cx={0} cy={-76} r={16} fill={fill} stroke={stroke} strokeWidth={4} />
          </g>
        );
      })}
      {/* same air over everyone */}
      <rect x={0} y={330} width={1920} height={600} fill={C.theory} opacity={0.11 * air} />
      <Miasma x={0} y={300} w={1920} h={640} density={0.7} p={air} from="left" vx={30} color={C.theory} opacity={0.9} t={t} seed={4} />
      {/* green ring around the infected cluster */}
      <ellipse
        cx={cxm}
        cy={cym - 36}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={C.evidence}
        strokeWidth={8}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={`${ringP} 1`}
        transform={`rotate(-90 ${cxm} ${cym - 36})`}
      />
      <Tag x={960} y={950} anchor="center" text="Same air — not everyone sick" kind="theory" p={ramp(t, T.air + 0.9, T.air + 1.6)} />
    </Stage>
  );
};

// ---------------------------------------------------------------- S6 / S7 shared blocks
// block: [w, h, stack x, stack y (rel to 960,500), final x, final y]
const BLOCKS: [number, number, number, number, number, number][] = [
  [300, 160, 0, -200, 960, 640],
  [150, 200, -75, -20, 360, 640],
  [150, 200, 75, -20, 1260, 640],
  [150, 200, -75, 180, 660, 640],
  [150, 200, 75, 180, 1560, 640],
];
const BLOCK_FILL = [C.stone, C.paperDark, C.stone, C.paperDark, C.stone];
const blockPos = (t: number, i: number) => {
  const b = BLOCKS[i];
  const k = ramp(t, T.drift + i * 0.05, T.drift + 1.1 + i * 0.05, ease.inOut);
  const x = lerp(960 + b[2], b[4], k);
  const y = lerp(500 + b[3], b[5], k) - Math.sin(k * Math.PI) * 60;
  const sc = lerp(1, 0.62, k);
  const rot = Math.sin(k * Math.PI) * (i % 2 ? 7 : -7);
  return {x, y, sc, rot, k};
};

// S6 · 336.71 · "So this wasn't a monolith."
export const S6: React.FC<{t: number}> = ({t}) => {
  const crackP = ramp(t, T.crack, T.crack + 0.7, ease.out);
  const plaqueP = ramp(t, T.plaque, T.plaque + 0.55, ease.outBack);
  const strike = ramp(t, T.strike, T.strike + 0.4);
  const labelOut = 1 - ramp(t, T.drift, T.drift + 0.4);
  const enter = ramp(t, T.s6, T.s6 + 0.6, ease.out);
  const shake = win(t, T.crack, T.crack + 0.5) * Math.sin(t * 60) * 3;
  const splitK = ramp(t, T.drift - 0.1, T.drift + 0.2);
  const plaqueOut = 1 - ramp(t, T.drift, T.drift + 0.5);
  const crack = 'M960 220 L944 296 L974 372 L950 450 L970 540 L952 640 L962 780';
  return (
    <Stage bg={C.paperShade}>
      <rect x={0} y={800} width={1920} height={280} fill={C.paperDeep} opacity={plaqueOut} />
      <Kicker x={960} y={130} text="MEDICINE IN THE 1300s" p={ramp(t, T.s6 + 0.2, T.s6 + 0.8)} />
      <g transform={`translate(${shake} ${(1 - enter) * 30})`} opacity={enter}>
        {BLOCKS.map((b, i) => {
          const q = blockPos(t, i);
          return (
            <g key={i} transform={`translate(${q.x} ${q.y}) rotate(${q.rot}) scale(${q.sc})`}>
              <rect x={-b[0] / 2 + 9} y={-b[1] / 2 + 11} width={b[0]} height={b[1]} fill={C.ink} opacity={0.14 * (splitK) } />
              <rect x={-b[0] / 2} y={-b[1] / 2} width={b[0]} height={b[1]} fill={BLOCK_FILL[i]} stroke={C.inkMute} strokeWidth={4 / q.sc} />
              <rect x={-b[0] / 2 + 12} y={-b[1] / 2 + 12} width={b[0] - 24} height={14} fill={C.paperLight} opacity={0.18} />
            </g>
          );
        })}
        <g opacity={labelOut}>
          <text x={960} y={462} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={34} letterSpacing={4} fill={C.ink}>
            MEDIEVAL
          </text>
          <text x={960} y={508} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={34} letterSpacing={4} fill={C.ink}>
            MEDICINE
          </text>
        </g>
        <g opacity={1 - splitK}>
          <path d={crack} fill="none" stroke={C.ink} strokeWidth={9} strokeLinejoin="round" pathLength={1} strokeDasharray={`${crackP} 1`} />
        </g>
      </g>
      {/* plaque */}
      <g transform={`translate(960 ${870 + (1 - plaqueP) * 40})`} opacity={clamp01(plaqueP * 3) * plaqueOut}>
        <rect x={-340 + 6} y={-48 + 8} width={680} height={96} rx={10} fill={C.ink} opacity={0.15} />
        <rect x={-340} y={-48} width={680} height={96} rx={10} fill={C.paperLight} stroke={C.ink} strokeWidth={4} />
        <text x={0} y={16} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={600} fontSize={52} fill={C.ink}>
          One simple, wrong thing
        </text>
        <line x1={-318} y1={4} x2={lerp(-318, 318, strike)} y2={lerp(10, -4, strike)} stroke={C.oxblood} strokeWidth={9} strokeLinecap="round" />
      </g>
    </Stage>
  );
};

// ---------------------------------------------------------------- S7
// S7 · 342.72 · "It was a live medical debate…"
type Scholar = {x: number; face: 1 | -1; pose: 'present' | 'point' | 'think'; hat: 'coif' | 'hood' | 'beret' | 'none'; age: 'adult' | 'elder'; beard: 'none' | 'short' | 'full'; top: string; side: 'L' | 'R' | 'M'; seed: number; at: number};
const SCHOLARS: Scholar[] = [
  {x: 360, face: 1, pose: 'present', hat: 'coif', age: 'adult', beard: 'short', top: C.theoryLight, side: 'L', seed: 3, at: T.bub},
  {x: 660, face: 1, pose: 'point', hat: 'hood', age: 'elder', beard: 'full', top: C.theory, side: 'L', seed: 11, at: T.bub + 0.45},
  {x: 960, face: 1, pose: 'think', hat: 'beret', age: 'adult', beard: 'none', top: C.woodLight, side: 'M', seed: 5, at: 0},
  {x: 1260, face: -1, pose: 'point', hat: 'none', age: 'adult', beard: 'short', top: C.evidenceLight, side: 'R', seed: 7, at: T.bub + 0.9},
  {x: 1560, face: -1, pose: 'present', hat: 'hood', age: 'elder', beard: 'full', top: C.evidence, side: 'R', seed: 13, at: T.bub + 1.35},
];

export const S7: React.FC<{t: number}> = ({t}) => {
  const room = ramp(t, T.s7, T.s7 + 0.8, ease.out);
  const truthP = ramp(t, T.truth, T.truth + 0.8);
  return (
    <Stage bg={C.paperShade}>
      <rect x={0} y={800} width={1920} height={280} fill={C.paperDeep} opacity={room} />
      <rect x={0} y={780} width={1920} height={22} fill={C.paperDark} opacity={room} />
      {/* soft green light on the right-hand scholars */}
      <LightPool x={1410} y={640} r={430} color={C.evidenceLight} strength={0.28 * truthP} sy={0.9} />
      {SCHOLARS.map((s, i) => {
        const g = ramp(t, T.grow + i * 0.1, T.grow + 0.7 + i * 0.1, ease.outBack);
        const talking = s.side === 'M' ? 0 : win(t, s.at, s.at + 3.4) * Math.abs(Math.sin(t * 8 + i * 1.7));
        const sc = 0.9 * Math.max(0.001, g);
        return (
          <g key={i} opacity={clamp01(g * 4)}>
            <Person x={s.x} y={900} s={sc} facing={s.face} t={t} outfit="robe" top={s.top} pose={s.pose} hat={s.hat} age={s.age} beard={s.beard} talk={talking} expression={s.side === 'M' ? 'thinking' : 'neutral'} seed={s.seed} />
          </g>
        );
      })}
      {/* blocks that turn into people */}
      {BLOCKS.map((b, i) => {
        const q = blockPos(t, i);
        const shrink = 1 - ramp(t, T.grow + i * 0.1, T.grow + 0.5 + i * 0.1);
        if (shrink <= 0.01) return null;
        return (
          <g key={i} transform={`translate(${q.x} ${q.y}) rotate(${q.rot * shrink}) scale(${q.sc * shrink})`}>
            <rect x={-b[0] / 2} y={-b[1] / 2} width={b[0]} height={b[1]} fill={BLOCK_FILL[i]} stroke={C.inkMute} strokeWidth={4 / Math.max(0.1, q.sc)} />
          </g>
        );
      })}
      {/* long table in front */}
      <g opacity={room}>
        <Table x={960} y={960} w={1700} h={210} color={C.wood} />
      </g>
      {/* bubbles */}
      {SCHOLARS.filter((s) => s.side !== 'M').map((s, i) => {
        const p = ramp(t, s.at, s.at + 0.45, ease.out);
        const wind = s.side === 'L';
        const by = 285 + (i % 2) * 28 + Math.sin(t * 1.5 + i) * 4;
        return (
          <g key={i}>
            <Bubble x={s.x + (wind ? 10 : -10)} y={by} w={170} h={132} to={{x: s.x + (wind ? 22 : -22), y: 395}} p={p} kind="speech" fill={wind ? C.theoryTint : C.evidenceTint} />
            <Icon name={wind ? 'wind' : 'people'} x={s.x + (wind ? 10 : -10)} y={by - 4} s={1.1} color={wind ? C.theory : C.evidence} accent={wind ? C.theoryLight : C.evidenceLight} knock={wind ? C.theoryTint : C.evidenceTint} p={ramp(t, s.at + 0.15, s.at + 0.6, ease.outBack)} />
          </g>
        );
      })}
      <Kicker x={960} y={130} text="A LIVE DEBATE" p={ramp(t, T.s7 + 0.4, T.s7 + 1.1)} />
      <Tag x={1560} y={990} anchor="center" text="Closer to the truth" kind="evidence" p={ramp(t, T.truth, T.truth + 0.7)} />
    </Stage>
  );
};

// ---------------------------------------------------------------- bathhouse world (S8 + S9)
type Bather = {x: number; y: number; s: number; outfit: 'tunic' | 'robe' | 'dress' | 'peasant'; hat: 'none' | 'coif' | 'hood' | 'beret'; face: 1 | -1; seed: number; kind?: 'tub'};
const BATHERS: Bather[] = [
  // in the tubs
  {x: 420, y: 866, s: 0.5, outfit: 'tunic', hat: 'coif', face: 1, seed: 1, kind: 'tub'},
  {x: 520, y: 866, s: 0.5, outfit: 'dress', hat: 'none', face: -1, seed: 2, kind: 'tub'},
  {x: 1430, y: 866, s: 0.5, outfit: 'peasant', hat: 'hood', face: -1, seed: 3, kind: 'tub'},
  {x: 1530, y: 866, s: 0.5, outfit: 'tunic', hat: 'none', face: 1, seed: 4, kind: 'tub'},
  // standing, behind the tub line, in the gap between the tubs (never overlapping a tub)
  {x: 780, y: 905, s: 0.5, outfit: 'robe', hat: 'beret', face: 1, seed: 5},
  {x: 880, y: 910, s: 0.5, outfit: 'dress', hat: 'coif', face: -1, seed: 6},
  {x: 980, y: 905, s: 0.5, outfit: 'peasant', hat: 'none', face: 1, seed: 7},
  {x: 1080, y: 910, s: 0.5, outfit: 'tunic', hat: 'hood', face: -1, seed: 8},
  {x: 1180, y: 905, s: 0.5, outfit: 'dress', hat: 'none', face: -1, seed: 17},
  // front row, feet low, fully in front, in the gaps
  {x: 120, y: 1030, s: 0.66, outfit: 'dress', hat: 'coif', face: 1, seed: 9},
  {x: 770, y: 1030, s: 0.66, outfit: 'peasant', hat: 'hood', face: 1, seed: 11},
  {x: 910, y: 1038, s: 0.66, outfit: 'robe', hat: 'none', face: -1, seed: 12},
  {x: 1050, y: 1030, s: 0.66, outfit: 'tunic', hat: 'beret', face: 1, seed: 13},
  {x: 1190, y: 1038, s: 0.66, outfit: 'dress', hat: 'none', face: -1, seed: 14},
  {x: 1800, y: 1030, s: 0.66, outfit: 'tunic', hat: 'hood', face: -1, seed: 16},
];
const TOPS = [C.woodLight, C.evidenceLight, C.theoryLight, C.oxLight, C.slate, C.stone, C.cautionLight, C.inkLift];
const SICK = [10, 11, 13]; // front-row figures, fully visible

const BathWorld: React.FC<{t: number; sickP?: number; coughP?: number}> = ({t, sickP = 0, coughP = 0}) => (
  <g>
    <Bathhouse t={t} seed={3} layer="back" />
    {BATHERS.map((b, i) => b.kind === 'tub' === true ? (
      <Person
        key={i}
        x={b.x}
        y={b.y}
        s={b.s}
        t={t}
        facing={b.face}
        outfit={b.outfit}
        hat={b.hat}
        top={TOPS[i % TOPS.length]}
        pose={i % 3 === 0 ? 'idle' : i % 3 === 1 ? 'hold' : 'idle'}
        expression={SICK.includes(i) && sickP > 0.5 ? 'worried' : 'neutral'}
        seed={b.seed * 3 + 1}
      />
    ) : null)}
    <Bathhouse t={t} seed={3} layer="front" />
    {BATHERS.map((b, i) => b.kind === 'tub' === false ? (
      <Person
        key={i}
        x={b.x}
        y={b.y}
        s={b.s}
        t={t}
        facing={b.face}
        outfit={b.outfit}
        hat={b.hat}
        top={TOPS[i % TOPS.length]}
        pose={i % 3 === 0 ? 'idle' : i % 3 === 1 ? 'hold' : 'idle'}
        expression={SICK.includes(i) && sickP > 0.5 ? 'worried' : 'neutral'}
        seed={b.seed * 3 + 1}
      />
    ) : null)}
    {SICK.map((i, k) => {
      const b = BATHERS[i];
      const p = ramp(t, T.sick + k * 0.28, T.sick + k * 0.28 + 0.4, ease.outBack);
      if (p <= 0) return null;
      const h = 540 * b.s;
      return (
        <g key={i} opacity={clamp01(p * 3)} transform={`translate(${b.x} ${b.y - h / 2 + 10}) scale(${p})`}>
          <rect x={-60} y={-h / 2 - 10} width={120} height={h + 20} rx={60} fill="none" stroke={C.caution} strokeWidth={6} strokeDasharray="14 11" strokeDashoffset={-t * 14} />
        </g>
      );
    })}
    {/* a cough from bather 12 */}
    {coughP > 0 &&
      [0, 1, 2, 3].map((j) => {
        const b = BATHERS[SICK[2]];
        const q = clamp01((coughP * 1.0 - j * 0.1) / 0.9);
        return (
          <circle key={j} cx={b.x + 60 * b.face + q * 90 * b.face} cy={b.y - 330 + (j - 1.5) * 12 - q * 18} r={8 + q * 20} fill={C.paperLight} stroke={C.inkMute} strokeWidth={3} opacity={(1 - q) * 0.9} />
        );
      })}
  </g>
);

// S8 · 351.78 · "There was also another reason…" icons slide off, doorway push, pull back to packed Bathhouse
export const S8: React.FC<{t: number}> = ({t}) => {
  const base = camAt(t, [
    [T.s8, 960, 640, 2.2],
    [T.pull8 - 0.4, 960, 650, 2.8],
    [T.pull8 + 1.1, 960, 540, 1],
  ]);
  const cam = breathe(base, t);
  const wallOp = 1 - ramp(t, T.pull8 + 0.1, T.pull8 + 0.75);
  const out = ramp(t, T.iconsOut, T.iconsOut + 0.9, ease.in);
  const hole = 'M0 0 H1920 V1080 H0 Z M690 1080 V380 Q690 230 960 230 Q1230 230 1230 380 V1080 Z';
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <BathWorld t={t} />
        {/* wall with a doorway, fades out as the camera pulls back */}
        <g opacity={wallOp}>
          <path d={hole} fillRule="evenodd" fill={C.stone} stroke={C.inkMute} strokeWidth={6} />
          <path d="M690 1080 V380 Q690 230 960 230 Q1230 230 1230 380 V1080" fill="none" stroke={C.woodLight} strokeWidth={22} />
          <Steam t={t} x={960} y={700} w={420} h={420} n={10} strength={0.9} />
        </g>
      </Cam>
      {/* pore + wind icons slide off */}
      <g transform={`translate(${-out * 2200} 0)`}>
        <circle cx={620} cy={540} r={180} fill={C.paperLight} stroke={C.ink} strokeWidth={6} />
        <PoreGlyph x={620} y={540} s={2.1} />
        <circle cx={1300} cy={540} r={180} fill={C.theoryTint} stroke={C.theory} strokeWidth={6} />
        <Icon name="wind" x={1300} y={540} s={3} color={C.theory} accent={C.theoryLight} knock={C.theoryTint} />
      </g>
      <Kicker x={960} y={150} text="CROWDED" p={ramp(t, T.crowded, T.crowded + 0.6)} />
    </Stage>
  );
};

// S9 · 358.08 · light cools, three flagged bathers, "Reasonable to avoid", dashed germ ?
export const S9: React.FC<{t: number}> = ({t}) => {
  const cool = ramp(t, T.cool, T.cool + 1.8);
  const cam = breathe(camAt(t, [[T.s9, 960, 540, 1], [T.s9 + 9, 1010, 560, 1.06]]), t);
  const germP = ramp(t, T.germ, T.germ + 0.5, ease.out) * (1 - ramp(t, T.germ + 1.2, T.germ + 1.8));
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <BathWorld t={t} sickP={ramp(t, T.sick, T.sick + 0.5)} coughP={clamp01((t - T.cough) / 1.0)} />
      </Cam>
      <rect x={0} y={0} width={1920} height={1080} fill={C.night} opacity={0.2 * cool} />
      <Kicker x={960} y={150} text="CROWDED" p={1} />
      <Tag x={960} y={260} anchor="center" size={40} text="Reasonable to avoid" kind="evidence" p={ramp(t, T.reason, T.reason + 0.7)} />
      {germP > 0 && (
        <g transform={`translate(960 450) scale(${0.6 + germP * 0.4})`} opacity={germP}>
          <circle r={100} fill={C.paperLight} stroke={C.ink} strokeWidth={5} strokeDasharray="14 11" strokeDashoffset={-t * 12} />
          <g opacity={0.5}>
            <Germ x={0} y={0} s={0.9} kind="coccus" t={t} color={C.theoryLight} shade={C.theory} />
          </g>
          <text x={0} y={30} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={90} fill={C.ink}>
            ?
          </text>
        </g>
      )}
    </Stage>
  );
};

// ---------------------------------------------------------------- S11
// S11 · 375.01 · dusk street: townsperson opens the bathhouse door, sees packed steam, closes it, backs away
export const S11: React.FC<{t: number}> = ({t}) => {
  const doorX = 1330;
  const open = ramp(t, T.open, T.open + 0.7, ease.out) * (1 - ramp(t, T.close + 0.1, T.close + 0.85, ease.inOut));
  const walkP = ramp(t, T.walk, T.open - 0.2, ease.out);
  const backP = ramp(t, T.close + 0.1, T.close + 1.8, ease.inOut);
  const px = lerp(520, 1040, walkP) - backP * 190;
  const walking = (t > T.walk && t < T.open - 0.15) || (t > T.close + 0.1 && t < T.close + 1.8);
  const phase = walking ? (t < T.open ? (t - T.walk) * 1.15 : -(t - T.close) * 1.0) : 0;
  const heads = Array.from({length: 16}, (_, i) => ({x: doorX - 88 + rand(i + 40) * 176, y: 700 + rand(i + 90) * 190, r: 24 + rand(i + 5) * 8}));
  const cool = 0.34;
  const glow = 0.9 + Math.sin(t * 7) * 0.05 + Math.sin(t * 13.3) * 0.03;
  const steamP = open;
  const cam = breathe(camAt(t, [[T.s11, 880, 560, 1.04], [T.end, 1010, 560, 1.12]]), t);
  return (
    <Stage bg={C.night}>
      <Cam cam={cam}>
        {/* dusk sky bands */}
        <rect x={-200} y={-100} width={2400} height={360} fill={C.night} />
        <rect x={-200} y={260} width={2400} height={200} fill={C.slate} opacity={0.6} />
        <rect x={-200} y={420} width={2400} height={200} fill={C.oxTint} opacity={0.2} />
        {/* far roofline */}
        <path d="M-200 520 L120 520 L120 440 L260 440 L260 520 L560 520 L560 400 L700 360 L840 400 L840 520 L1000 520 L1000 460 L1100 460 L1100 520 L2200 520 V900 H-200 Z" fill={C.inkSoft} />
        {/* ground */}
        <rect x={-200} y={900} width={2400} height={300} fill={C.inkLift} />
        <rect x={-200} y={900} width={2400} height={10} fill={C.inkMute} opacity={0.6} />
        {/* bathhouse front */}
        <rect x={1060} y={220} width={1000} height={690} fill={C.stone} />
        <rect x={1060} y={220} width={1000} height={690} fill={C.night} opacity={cool} />
        {[0, 1, 2].map((r) => (
          <line key={r} x1={1060} x2={2060} y1={380 + r * 170} y2={380 + r * 170} stroke={C.inkMute} strokeWidth={3} opacity={0.35} />
        ))}
        <rect x={1040} y={196} width={1040} height={36} fill={C.woodDark} />
        {/* inside, seen through the open door */}
        <g opacity={clamp01(open * 1.5)}>
          <clipPath id="c5s11-in">
            <rect x={doorX - 100} y={540} width={200} height={360} />
          </clipPath>
          <g clipPath="url(#c5s11-in)">
            <rect x={doorX - 100} y={540} width={200} height={360} fill={C.lamp} opacity={0.55} />
            {heads.map((h, i) => (
              <g key={i}>
                <circle cx={h.x} cy={h.y} r={h.r} fill={i % 3 ? C.ink : C.wood} opacity={0.85} />
                <rect x={h.x - h.r * 1.5} y={h.y + h.r * 0.8} width={h.r * 3} height={160} rx={h.r} fill={i % 3 ? C.ink : C.wood} opacity={0.85} />
              </g>
            ))}
            <rect x={doorX - 100} y={540} width={200} height={360} fill={C.paperLight} opacity={0.3 * steamP} />
          </g>
        </g>
        <Door x={doorX} y={900} w={200} h={360} style="plank" shape="arched" open={open} inside="transparent" />
        <LightPool x={doorX} y={900} r={300} color={C.lamp} strength={0.2 + 0.25 * open} sy={0.35} />
        <BathSign x={1760} y={330} t={t} glow={glow} />
        <LightPool x={1610} y={520} r={260} color={C.lamp} strength={0.22 * glow} />
        {/* steam out of the door */}
        <g opacity={0.35 + steamP * 0.65}>
          <Steam t={t} x={doorX} y={560} w={260} h={360} n={9} strength={0.35 + 0.65 * steamP} />
        </g>
        {/* the townsperson */}
        <Person
          x={px}
          y={900}
          s={0.9}
          facing={1}
          t={t}
          outfit="peasant"
          hat="hood"
          top={C.woodLight}
          walk={phase}
          pose={t > T.pause - 0.4 && t < T.close ? 'worried' : 'idle'}
          expression={t > T.open && t < T.close + 0.8 ? 'worried' : 'neutral'}
          emote={t >= T.pause && t < T.close + 0.8 ? 'sweat' : undefined}
          emoteP={ramp(t, T.pause, T.pause + 0.4, ease.outBack)}
          seed={9}
        />
        <Particles t={t} x={1000} y={300} w={900} h={500} n={14} seed={2} size={[3, 6]} color={C.paperDark} opacity={[0.1, 0.3]} vy={-8} />
      </Cam>
    </Stage>
  );
};
