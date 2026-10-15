// Custom shots for C07 (builder-owned): "Europe never stopped bathing"
import React from 'react';
import {Stage, Cam, breathe} from '../../../kit/stage';
import {C, FONT_SERIF, FONT_SANS} from '../../../kit/theme';
import {camAt, clamp01, ease, lerp, ramp, rand, win, keys} from '../../../kit/anim';
import {Headline, Kicker, Tag} from '../../../kit/text';
import {Card, OpenBook, Bubble} from '../../../kit/cards';
import {Arrow, CrossOut, CheckMark, QuestionMark} from '../../../kit/diagrams';
import {GeoMap, makeProjection} from '../../../kit/geo';
import {Icon} from '../../../kit/icons';
import {Person} from '../../../kit/people';
import {Banner, Bathtub, Bench, BookStack, Bookshelf, CitySkyline, Door, Lantern, Table} from '../../../kit/env';
import {LightPool, Particles, Steam, Vignette} from '../../../kit/fx';

// ---------------------------------------------------------------- cues
const T = {
  // S1 [485.00]
  s1: 485.0,
  kick1: 485.3, // "By the early 1500s"
  back: 488.2, // camera eases back
  // S3 [494.60] "…far less popular than they had been roughly 25 years earlier."
  s3: 494.6,
  popular: 495.4, // "far less popular"
  y1523: 495.3,
  earlier: 497.6, // "roughly 25 years earlier"
  // S4 [499.08]
  cross: 499.9, // "census"
  book: 501.1,
  lit: 504.6, // "a literary observation"
  repu: 507.2, // "changing reputation"
  // S5 [509.44]
  declined: 511.82,
  notEvery: 514.56,
  noSingle: 516.6,
  // S7 [528.30]
  qm: 529.5,
  europe: 532.3, // "Europe didn't stop bathing."
  pub: 534.4,
  pubDown: 534.94, // "declined"
  itself: 535.9,
  // S8 [537.06]
  home: 537.6,
  med: 540.12,
  spa: 541.66,
  sweat: 542.73,
  inst: 544.26, // "institution changed"
  cont: 545.9,
  // S9 [547.50]
  s9: 547.5,
  cd: 547.6,
  strike: 548.7,
  town: 550.4,
  redis: 550.7, // "redistribution"
  kick9: 551.0,
  shared: 555.32, // "shared public"
  ctrl: 558.68, // "controlled spaces"
};

// ---------------------------------------------------------------- helpers (copied from C06)
const SIGN_WOOD = C.wood;
const BathSign: React.FC<{x: number; y: number; s?: number; t: number; glow?: number; swing?: number}> = ({x, y, s = 1, t, glow = 1, swing = 1}) => {
  const sw = Math.sin(t * 1.3) * 1.6 * swing;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-250} y={-60} width={26} height={150} rx={6} fill={C.woodDark} />
      <line x1={-236} y1={0} x2={130} y2={0} stroke={C.woodDark} strokeWidth={14} strokeLinecap="round" />
      <path d="M-236 70 L-150 4" stroke={C.woodDark} strokeWidth={9} />
      <g transform={`rotate(${sw} 0 0)`}>
        <Banner kind="hanging" w={170} h={240} color={SIGN_WOOD} emblem="none" x={0} y={0} t={t} />
        <circle cx={0} cy={130} r={56} fill={C.paperLight} />
        <Icon name="bath" x={0} y={130} s={1.05} color={C.ink} accent={C.oxblood} knock={C.paperLight} />
      </g>
      <g transform={`rotate(${-sw * 0.8} -150 0)`}>
        <Lantern x={-150} y={186} chain={40} t={t} glow={glow} lit={glow > 0.04} />
      </g>
    </g>
  );
};

const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

// ================================================================ S1 · 485.00 · quill, early 1500s
type Pt = [number, number, boolean]; // x, y, moveTo
const HW_LINES: Pt[][] = Array.from({length: 8}).map((_, li) => {
  const pts: Pt[] = [];
  const y0 = 330 + li * 46;
  const wid = li === 7 ? 220 : 520 - (li % 3) * 40;
  let x = 700;
  while (x < 700 + wid) {
    const wl = 28 + rand(li * 31 + x) * 60;
    const n = Math.round(wl / 7);
    for (let i = 0; i < n; i++) {
      const xx = x + (wl / n) * i;
      const yy = y0 + Math.sin(i * 2.3 + li) * 7 * (0.5 + rand(li * 7 + i + x)) - (i % 4 === 2 ? 10 * rand(li + i) : 0);
      pts.push([xx, yy, i === 0]);
    }
    pts.push([x + wl, y0, false]);
    x += wl + 16;
  }
  return pts;
});
const dOf = (pts: Pt[]) => {
  let d = '';
  pts.forEach((p, i) => {
    d += `${p[2] || i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)} `;
  });
  return d;
};

export const S1: React.FC<{t: number}> = ({t}) => {
  const wp = ramp(t, T.s1 + 0.2, 487.95, ease.inOut) * HW_LINES.length;
  const li = Math.min(HW_LINES.length - 1, Math.floor(wp));
  const lf = wp - li;
  const cur = HW_LINES[li];
  const k = Math.max(1, Math.floor(cur.length * lf));
  const part = cur.slice(0, k);
  const tip = part[part.length - 1];
  const done = HW_LINES.slice(0, li);
  const cam = breathe(camAt(t, [[T.s1, 930, 440, 2.3], [T.back - 0.2, 930, 440, 2.3], [T.back + 1.6, 960, 540, 1.0]]), t, 0.5);
  const sheetP = ramp(t, T.back, T.back + 1.2, ease.out);
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <rect x={-600} y={-400} width={3200} height={1300} fill={mix(C.paperShade, C.bone, 0.5)} />
        <Bookshelf x={250} y={700} w={420} h={560} seed={4} />
        <Bookshelf x={1700} y={700} w={380} h={560} seed={9} />
        <polygon points="1150,-40 1330,-40 1100,700 840,700" fill={C.lamp} opacity={0.12} />
        <rect x={-600} y={690} width={3200} height={500} fill={C.wood} />
        <rect x={-600} y={690} width={3200} height={22} fill={C.woodLight} />
        <g opacity={sheetP}>
          <BookStack x={430} y={700} n={4} w={190} seed={3} />
          <BookStack x={1520} y={700} n={3} w={170} seed={8} />
          <g transform="rotate(5 1400 640)">
            <rect x={1230} y={560} width={210} height={150} fill={C.paperLight} stroke={C.inkFaint} strokeWidth={2} />
            <path d="M1230 560 L1335 640 L1440 560" fill="none" stroke={C.inkFaint} strokeWidth={2} />
            <circle cx={1335} cy={640} r={13} fill={C.oxblood} />
          </g>
          <g transform="rotate(-6 560 650)">
            <rect x={470} y={590} width={170} height={110} fill={C.paperLight} stroke={C.inkFaint} strokeWidth={2} />
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M485 ${615 + i * 24} q 30 -8 60 0 t 80 0`} stroke={C.inkFaint} strokeWidth={3} fill="none" />
            ))}
          </g>
          <rect x={1090} y={640} width={50} height={56} rx={10} fill={C.ink} />
          <rect x={1100} y={628} width={30} height={16} fill={C.inkSoft} />
        </g>
        <g transform="rotate(-1.5 960 480)">
          <rect x={640} y={230} width={640} height={540} fill={C.paperLight} stroke={C.paperDark} strokeWidth={3} />
          <g fill="none" stroke={C.ink} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
            {done.map((l, i) => (
              <path key={i} d={dOf(l)} />
            ))}
            <path d={dOf(part)} />
          </g>
          <g transform={`translate(${tip[0]} ${tip[1] + 2}) rotate(${-8 + Math.sin(t * 9) * 3})`}>
            <path d="M0 0 L16 -70 Q44 -170 120 -250 Q96 -160 50 -66 Z" fill={C.paperLight} stroke={C.ink} strokeWidth={3} />
            <path d="M16 -70 Q50 -170 120 -250" fill="none" stroke={C.inkMute} strokeWidth={2} />
            <path d="M0 0 L4 -18" stroke={C.ink} strokeWidth={4} />
          </g>
        </g>
      </Cam>
      <Kicker x={960} y={128} size={34} text="EARLY 1500s" p={ramp(t, T.kick1 - 0.1, T.kick1 + 0.6, ease.out)} />
    </Stage>
  );
};

// ================================================================ S3 · 494.60 · two vignettes
type Walker = {x: number; leave?: number; dir?: number; outfit: any; hat: any; hair?: any; seed: number; age?: any};
const Vignette3: React.FC<{t: number; ox: number; oy: number; id: string; folk: Walker[]; glow: number; steamN: number; steamK: number}> = ({t, ox, oy, id, folk, glow, steamN, steamK}) => {
  const W3 = 760;
  const H3 = 560;
  return (
    <g transform={`translate(${ox} ${oy})`}>
      <clipPath id={id}>
        <rect x={0} y={0} width={W3} height={H3} rx={10} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x={0} y={0} width={W3} height={H3} fill={mix(C.paperShade, C.paperDeep, 0.3)} />
        <polygon points="40,150 380,40 720,150" fill={C.woodDark} />
        <rect x={60} y={150} width={640} height={310} fill={C.stone} />
        <rect x={60} y={150} width={640} height={120} fill={C.bone} />
        <rect x={50} y={266} width={660} height={14} fill={C.woodDark} />
        {[0.1, 0.5, 0.9].map((k, i) => (
          <rect key={i} x={60 + 640 * k - 5} y={150} width={10} height={120} fill={C.woodLight} />
        ))}
        {[150, 300].map((wx) => (
          <rect key={wx} x={wx} y={182} width={56} height={62} rx={4} fill={mix(C.inkSoft, C.lamp, 0.55 * glow)} />
        ))}
        <Door x={400} y={460} w={130} h={190} style="plank" open={0.5} inside={C.lamp} />
        <LightPool x={400} y={460} r={170} strength={0.5 * glow} />
        <rect x={0} y={460} width={W3} height={H3 - 460} fill={C.stoneShade} />
        <rect x={0} y={460} width={W3} height={8} fill={C.stoneDark} opacity={0.5} />
        <Steam t={t} x={400} y={290} w={150} h={170} n={Math.max(1, steamN)} strength={steamK} color={C.paperLight} />
        <BathSign x={600} y={118} s={0.5} t={t} glow={glow} />
        {folk.map((f, i) => {
          const lv = f.leave !== undefined ? ramp(t, f.leave, f.leave + 1.8, ease.inOut) : 0;
          const dir = f.dir ?? 1;
          const moving = lv > 0.001 && lv < 0.999;
          const x = f.x + dir * lv * 420;
          const fade = 1 - clamp01((lv - 0.85) / 0.15);
          return (
            <g key={i} opacity={fade}>
              <Person x={x} y={512 + (i % 2) * 6} s={0.3} t={t} facing={(f.leave !== undefined && lv > 0 ? dir : i % 2 ? -1 : 1) as 1 | -1} walk={moving ? t * 1.2 + i : undefined} outfit={f.outfit} hat={f.hat} hair={f.hair ?? 'short'} seed={f.seed} age={f.age} expression="neutral" talk={!moving && i % 3 === 0 ? Math.abs(Math.sin(t * 7 + i)) * 0.7 : 0} />
            </g>
          );
        })}
      </g>
      <rect x={0} y={0} width={W3} height={H3} rx={10} fill="none" stroke={C.ink} strokeWidth={6} />
    </g>
  );
};

const FOLK: Walker[] = [
  {x: 150, outfit: 'peasant', hat: 'coif', seed: 11},
  {x: 245, outfit: 'merchant', hat: 'hood', seed: 12},
  {x: 520, outfit: 'dress', hat: 'coif', hair: 'bun', seed: 13},
  {x: 620, outfit: 'tunic', hat: 'beret', seed: 14},
  {x: 300, outfit: 'peasant', hat: 'none', seed: 15, age: 'child'},
  {x: 680, outfit: 'dress', hat: 'veil', hair: 'long', seed: 16},
];

export const S3: React.FC<{t: number}> = ({t}) => {
  const leaves = [0, 0.25, 0.5, 0.15, 0.4].map((d) => T.popular + 0.1 + d);
  const right: Walker[] = FOLK.map((f, i) => (i === 3 ? f : {...f, leave: leaves[i > 3 ? i - 1 : i], dir: i % 2 ? 1 : -1}));
  const gl = 1 - 0.82 * ramp(t, T.popular, T.popular + 2.2, ease.inOut);
  const pL = ramp(t, T.s3, T.s3 + 0.9, ease.outQuint);
  const th = ramp(t, T.popular, T.popular + 2);
  return (
    <Stage bg={C.paperShade}>
      <Kicker x={960} y={128} size={28} text="BRABANT · IN ERASMUS'S DIALOGUE" p={ramp(t, T.s3 + 0.2, T.s3 + 0.9, ease.out)} />
      <g opacity={pL} transform={`translate(0 ${(1 - pL) * 30})`}>
        <Vignette3 t={t} ox={110} oy={200} id="c7v0" folk={FOLK} glow={1} steamN={3} steamK={1} />
        <Vignette3 t={t} ox={1050} oy={200} id="c7v1" folk={right} glow={gl} steamN={Math.round(lerp(3, 1, th))} steamK={lerp(1, 0.25, th)} />
      </g>
      <Headline x={490} y={900} size={44} text="Roughly 25 years earlier" mode="rise" p={ramp(t, T.earlier - 0.2, T.earlier + 0.6, ease.out)} />
      <Headline x={1430} y={900} size={64} text="1523" mode="rise" color={C.oxblood} p={ramp(t, T.y1523 - 0.1, T.y1523 + 0.6, ease.out)} />
    </Stage>
  );
};

// ================================================================ S4 · 499.08 · census vs literature
export const S4: React.FC<{t: number}> = ({t}) => {
  const ledP = ramp(t, 499.2, 499.9, ease.outQuint);
  const ledOut = ramp(t, 500.9, 501.5, ease.in);
  const crossP = ramp(t, T.cross - 0.05, T.cross + 0.45, ease.out);
  const bookP = ramp(t, T.book, T.book + 0.9, ease.outQuint);
  const sp = (k: number) => Math.abs(Math.sin(t * 8 + k));
  const speak1 = win(t, 502.0, 503.4) * sp(1);
  const speak2 = win(t, 503.4, 504.8) * sp(2);
  const sign = ramp(t, T.repu - 0.1, T.repu + 0.8, ease.outQuint);
  const glow = 1 - ramp(t, T.repu + 0.2, T.repu + 1.2, ease.inOut);
  const tilt = ramp(t, T.repu, T.repu + 0.9, ease.outBack) * 16;
  return (
    <Stage bg={C.paperShade}>
      <g opacity={1 - ledOut} transform={`translate(${-ledOut * 140} 0)`}>
        <Card x={400} y={540} w={500} h={600} p={ledP} fill={C.paperLight} stroke={C.ink} rot={-3}>
          <text x={250} y={62} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={24} letterSpacing={6} fill={C.inkMute}>CENSUS</text>
          <line x1={30} y1={84} x2={470} y2={84} stroke={C.ink} strokeWidth={3} />
          {[170, 320].map((x) => (
            <line key={x} x1={x} y1={84} x2={x} y2={570} stroke={C.inkFaint} strokeWidth={2} />
          ))}
          {Array.from({length: 9}).map((_, r) => (
            <g key={r}>
              <line x1={30} y1={130 + r * 52} x2={470} y2={130 + r * 52} stroke={C.paperDark} strokeWidth={2} />
              {Array.from({length: 1 + (r % 4)}).map((__, k) => (
                <line key={k} x1={190 + k * 18} y1={98 + r * 52} x2={190 + k * 18} y2={124 + r * 52} stroke={C.ink} strokeWidth={3.5} />
              ))}
              <path d={`M45 ${112 + r * 52} q 25 -10 50 0 t 60 0`} stroke={C.inkFaint} strokeWidth={3} fill="none" />
            </g>
          ))}
        </Card>
        <CrossOut x={400} y={540} size={470} p={crossP} color={C.caution} />
      </g>
      <g opacity={bookP}>
        <OpenBook x={950} y={600} s={1.45} p={bookP} cover={C.woodDark} lines={7} />
        <Person x={770} y={720} s={0.34} t={t} facing={1} outfit="merchant" hat="hood" pose="present" talk={speak1} seed={31} expression={speak1 > 0.1 ? 'happy' : 'neutral'} />
        <Person x={1130} y={720} s={0.34} t={t} facing={-1} outfit="dress" hat="coif" hair="bun" pose="idle" talk={speak2} seed={32} expression={speak2 > 0.1 ? 'smile' : 'neutral'} />
        <Bubble x={640} y={410} w={250} h={86} text="…" to={{x: 770, y: 540}} p={ramp(t, 501.9, 502.5, ease.outBack)} size={44} />
        <Bubble x={1090} y={380} w={270} h={86} text="…?" to={{x: 1130, y: 540}} p={ramp(t, 503.3, 503.9, ease.outBack)} size={44} />
      </g>
      <Tag x={960} y={925} size={38} anchor="center" text="A literary observation" kind="caution" p={ramp(t, T.lit - 0.2, T.lit + 0.6, ease.out)} />
      <g opacity={sign}>
        <g transform={`rotate(${tilt} 1700 330)`}>
          <BathSign x={1670} y={330} s={0.5} t={t} glow={glow} swing={1 + (1 - glow) * 2} />
        </g>
        <Arrow from={{x: 1700, y: 600}} to={{x: 1700, y: 760}} color={C.caution} width={10} p={ramp(t, T.repu + 0.5, T.repu + 1.2, ease.out)} />
      </g>
    </Stage>
  );
};

// ================================================================ S5 · 509.44 · map of dimming lanterns
const CITIES: [number, number][] = [
  [-0.1, 51.5], [-2.6, 51.45], [-1.08, 53.96], [2.35, 48.86], [1.1, 49.44], [-1.68, 48.11], [-0.58, 44.84], [4.83, 45.76],
  [4.35, 50.85], [4.4, 51.2], [3.22, 51.2], [4.9, 52.4], [6.96, 50.94], [8.68, 50.1], [11.08, 49.45], [10.9, 48.37],
  [7.75, 48.58], [7.6, 47.56], [8.54, 47.37], [6.14, 46.2], [9.19, 45.46], [2.17, 41.39], [-3.7, 40.4], [13.4, 52.5], [-6.26, 53.35], [12.5, 41.9],
];
const STAY = [3, 9, 14, 7, 21];
export const S5: React.FC<{t: number}> = ({t}) => {
  const proj = makeProjection('western-europe', 980, 800, {x: 200, y: 140});
  const mp = ramp(t, 509.44, 510.4, ease.outQuint);
  return (
    <Stage bg={C.paperShade}>
      <GeoMap x={200} y={140} w={980} h={800} region="western-europe" p={mp} borders={false}>
        {CITIES.map(([lo, la], i) => {
          const [px, py] = proj(lo, la);
          const stay = STAY.includes(i);
          const at = 510.2 + i * 0.03;
          const born = ramp(t, at, at + 0.4, ease.outBack);
          const dimAt = T.declined + rand(i * 5 + 3) * 3.4 + (i % 3) * 0.2;
          const dim = stay ? 0 : ramp(t, dimAt, dimAt + 0.8, ease.inOut);
          const ring = stay ? ramp(t, T.notEvery, T.notEvery + 0.7, ease.out) : 0;
          return (
            <g key={i} transform={`translate(${px} ${py}) scale(${born})`}>
              {dim < 0.95 && <LightPool x={0} y={0} r={46} strength={0.85 * (1 - dim)} />}
              <circle r={10} fill={mix(C.lamp, C.inkFaint, dim)} stroke={C.ink} strokeWidth={2} />
              {stay && <circle r={24} fill="none" stroke={C.evidence} strokeWidth={5} opacity={ring} />}
            </g>
          );
        })}
      </GeoMap>
      <Kicker x={1270} y={400} anchor="start" size={34} text="16TH CENTURY" p={ramp(t, 509.6, 510.3, ease.out)} />
      <Tag x={1270} y={500} size={40} anchor="left" text="No single reason" kind="caution" p={ramp(t, T.noSingle - 0.2, T.noSingle + 0.6, ease.out)} />
    </Stage>
  );
};

// ================================================================ S7 · 528.30 · no single year
export const S7: React.FC<{t: number}> = ({t}) => {
  const ax = ramp(t, 528.3, 529.2, ease.out);
  const mx = keys(t, [[528.5, 1300], [529.2, 1560], [529.8, 1360], [530.5, 1660], [531.2, 1450], [532.0, 1540]]);
  const qm = ramp(t, T.qm, T.qm + 0.5, ease.outBack) * (1 - ramp(t, T.europe - 0.1, T.europe + 0.3));
  const mxPx = 210 + ((mx - 1300) / 400) * 1500;
  const hp = ramp(t, T.europe - 0.1, T.europe + 1.0, ease.out);
  const rowA = ramp(t, T.pub, T.pub + 0.6, ease.out);
  const rowB = ramp(t, T.itself - 0.4, T.itself + 0.4, ease.out);
  const lineA = ramp(t, T.pubDown - 0.1, T.pubDown + 0.9, ease.out);
  const lineB = ramp(t, T.itself, T.itself + 1.0, ease.out);
  const mag = ramp(t, 528.4, 528.9, ease.out) * (1 - ramp(t, T.europe, T.europe + 0.4));
  return (
    <Stage bg={C.paper}>
      <g opacity={ax}>
        <line x1={210} y1={480} x2={210 + 1500 * ax} y2={480} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
        {[1300, 1400, 1500, 1600, 1700].map((yr, i) => (
          <g key={yr} opacity={ramp(t, 528.5 + i * 0.08, 529.0 + i * 0.08)}>
            <line x1={210 + i * 375} y1={462} x2={210 + i * 375} y2={498} stroke={C.ink} strokeWidth={5} />
            <text x={210 + i * 375} y={552} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={32} letterSpacing={2} fill={C.inkMute}>{yr}</text>
          </g>
        ))}
      </g>
      <g opacity={mag} transform={`translate(${mxPx} ${400 + Math.sin(t * 5) * 5})`}>
        <circle r={150} fill={C.paperLight} fillOpacity={0.55} stroke={C.ink} strokeWidth={16} />
        <line x1={106} y1={106} x2={270} y2={270} stroke={C.woodDark} strokeWidth={34} strokeLinecap="round" />
      </g>
      <QuestionMark x={960} y={130} size={130} p={qm} t={t} />
      <Headline x={960} y={700} size={88} text="Europe didn't stop bathing." mode="words" p={hp} accent={{bathing: C.evidence}} />
      <g opacity={rowA}>
        <text x={420} y={830} fontFamily={FONT_SERIF} fontSize={46} fill={C.ink} fontWeight={600}>Public bathhouses</text>
        <path d="M900 805 Q 1050 800 1150 840 T 1400 890" fill="none" stroke={C.caution} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - lineA} />
        <Arrow from={{x: 1500, y: 800}} to={{x: 1500, y: 900}} color={C.caution} width={12} p={lineA} />
      </g>
      <g opacity={rowB}>
        <text x={420} y={950} fontFamily={FONT_SERIF} fontSize={46} fill={C.ink} fontWeight={600}>Bathing itself</text>
        <path d="M900 930 Q 1050 920 1150 932 T 1400 928" fill="none" stroke={C.evidence} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - lineB} />
        <CheckMark x={1500} y={935} size={80} p={lineB} />
      </g>
    </Stage>
  );
};

// ================================================================ S8 · 537.06 · where bathing went
const labelW = (s: string) => s.length * 19.5;
const Panel8: React.FC<{cx: number; cy: number; p: number; label: string; warm: number; id: string; children: React.ReactNode}> = ({cx, cy, p, label, warm, id, children}) => {
  const w = 780;
  const h = 340;
  const sc = lerp(0.82, 1, p);
  return (
    <g transform={`translate(${cx} ${cy}) scale(${sc}) translate(${-w / 2} ${-h / 2})`} opacity={clamp01(p * 2)}>
      <clipPath id={id}>
        <rect width={w} height={h} rx={14} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        {children}
        <rect width={w} height={h} fill={C.lamp} opacity={0.2 * warm} />
      </g>
      <rect width={w} height={h} rx={14} fill="none" stroke={C.woodDark} strokeWidth={12} />
      <rect x={-6} y={-6} width={w + 12} height={h + 12} rx={18} fill="none" stroke={mix(C.woodDark, C.lamp, warm * 0.8)} strokeWidth={3} />
      <rect x={24} y={20} width={labelW(label) + 28} height={44} rx={6} fill={C.paperLight} />
      <text x={38} y={52} fontFamily={FONT_SANS} fontWeight={800} fontSize={24} letterSpacing={3} fill={C.ink}>{label.toUpperCase()}</text>
    </g>
  );
};

export const S8: React.FC<{t: number}> = ({t}) => {
  const pop = (a: number) => ramp(t, a - 0.15, a + 0.65, ease.outBack);
  const warm = ramp(t, T.cont - 0.2, T.cont + 1.0, ease.inOut);
  const signGlow = 1 - ramp(t, T.inst, T.inst + 1.2, ease.inOut) * 0.9;
  const swingK = 1 + win(t, T.inst - 0.1, T.inst + 1.8) * 7;
  const FL = 300;
  return (
    <Stage bg={C.paperShade}>
      <Panel8 id="c7p1" cx={520} cy={290} p={pop(T.home)} label="At home" warm={warm}>
        <rect width={780} height={340} fill={mix(C.bone, C.wood, 0.25)} />
        <rect y={FL} width={780} height={60} fill={C.woodDark} />
        <Table x={430} y={FL} w={280} h={110} />
        <ellipse cx={430} cy={FL - 112} rx={72} ry={14} fill={C.stoneShade} />
        <ellipse cx={430} cy={FL - 114} rx={58} ry={9} fill={C.paperLight} />
        <Person x={330} y={FL + 16} s={0.5} t={t} facing={1} outfit="dress" hair="bun" hat="coif" pose="hold" lean={10} look={0.5} seed={51} expression="smile" />
        <Lantern x={650} y={80} chain={50} t={t} glow={1} lit />
      </Panel8>
      <Panel8 id="c7p2" cx={1400} cy={290} p={pop(T.med)} label="Medicinal baths" warm={warm}>
        <rect width={780} height={340} fill={mix(C.stone, C.wood, 0.3)} />
        <rect y={FL} width={780} height={60} fill={C.stoneShade} />
        <Bathtub x={330} y={FL + 6} kind="wood" w={330} t={t} part="back" />
        <Person x={330} y={FL - 24} s={0.4} t={t} facing={1} outfit="nightwear" hair="long" hat="none" sit={1} seed={52} expression="smile" />
        <Bathtub x={330} y={FL + 6} kind="wood" w={330} t={t} part="front" />
        <Steam t={t} x={330} y={150} w={120} h={110} n={3} strength={0.8} color={C.paperLight} />
        <Person x={600} y={FL + 14} s={0.5} t={t} facing={-1} outfit="robe" hat="hood" beard="short" pose="reach" seed={53} />
        <Particles t={t} x={380} y={60} w={150} h={150} n={9} seed={4} size={[4, 7]} color={C.evidenceLight} opacity={[0.7, 1]} vy={30} />
      </Panel8>
      <Panel8 id="c7p3" cx={520} cy={680} p={pop(T.spa)} label="Spas" warm={warm}>
        <rect width={780} height={340} fill={C.paperShade} />
        <path d="M0 210 Q 120 90 260 190 T 520 150 T 780 200 V340 H0Z" fill={C.evidenceTint} />
        <path d="M0 250 Q 180 170 360 240 T 780 230 V340 H0Z" fill={C.evidenceLight} opacity={0.7} />
        <ellipse cx={400} cy={270} rx={290} ry={60} fill={mix(C.evidenceTint, C.bone, 0.2)} stroke={C.stoneDark} strokeWidth={6} />
        <ellipse cx={400} cy={272} rx={268} ry={48} fill={mix(C.paperLight, C.lamp, 0.3)} />
        <Person x={300} y={268} s={0.4} t={t} facing={1} outfit="nightwear" hair="bun" hat="coif" pose="idle" seed={54} expression="smile" />
        <Person x={470} y={266} s={0.4} t={t} facing={-1} outfit="nightwear" hat="hood" beard="full" pose="idle" seed={55} expression="happy" />
        <path d="M118 272 Q 400 372 682 272 Q 400 300 118 272Z" fill={mix(C.paperLight, C.lamp, 0.3)} />
        <Steam t={t} x={400} y={230} w={380} h={170} n={5} strength={0.9} color={C.paperLight} />
      </Panel8>
      <Panel8 id="c7p4" cx={1400} cy={680} p={pop(T.sweat)} label="Sweat bathing" warm={warm}>
        <rect width={780} height={340} fill={C.woodLight} />
        {Array.from({length: 14}).map((_, i) => (
          <line key={i} x1={i * 60} y1={0} x2={i * 60} y2={340} stroke={C.wood} strokeWidth={4} />
        ))}
        <rect y={FL} width={780} height={60} fill={C.woodDark} />
        <Bench x={330} y={FL - 36} w={400} h={90} />
        <Person x={250} y={FL - 66} s={0.42} t={t} facing={1} outfit="nightwear" hat="coif" sit={1} seed={56} expression="neutral" />
        <Person x={400} y={FL - 66} s={0.42} t={t} facing={1} outfit="nightwear" hair="long" hat="none" sit={1} seed={57} expression="smile" />
        <rect x={610} y={FL - 120} width={110} height={120} rx={8} fill={C.stoneDark} />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={635 + i * 28} cy={FL - 125} r={16} fill={C.stoneShade} stroke={C.ink} strokeWidth={2} />
        ))}
        <Steam t={t} x={660} y={FL - 130} w={140} h={200} n={4} strength={1} color={C.paperLight} />
      </Panel8>
      <circle cx={960} cy={485} r={78} fill={C.paperShade} />
      <BathSign x={985} y={455} s={0.26} t={t} glow={signGlow} swing={swingK} />
      <Tag x={960} y={960} size={36} anchor="center" text="Bathing continued" kind="evidence" p={ramp(t, T.cont - 0.2, T.cont + 0.6, ease.out)} />
    </Stage>
  );
};

// ================================================================ S9 · 547.50 · redistribution (signature)
type Home = {x: number; w: number; top: number};
const HOMES: Home[] = [
  {x: 60, w: 250, top: 470},
  {x: 360, w: 270, top: 430},
  {x: 1290, w: 270, top: 440},
  {x: 1610, w: 260, top: 480},
];
const WINS: {x: number; y: number; tub: boolean}[] = [];
HOMES.forEach((h, hi) => {
  const n = Math.max(2, Math.floor(h.w / 110));
  for (let i = 0; i < n; i++) WINS.push({x: h.x + (h.w / n) * (i + 0.5), y: h.top + 60, tub: (hi + i) % 2 === 0});
  for (let i = 0; i < n; i++) WINS.push({x: h.x + (h.w / n) * (i + 0.5), y: h.top + 150, tub: (hi + i) % 3 === 0});
});
const BH = {x: 960, y: 560};
const ORBS = Array.from({length: 34}).map((_, i) => ({
  w: i % WINS.length,
  start: T.redis + 0.1 + rand(i * 3 + 1) * 1.1,
  dur: 1.8 + rand(i * 7 + 2) * 2.6,
  lift: 120 + rand(i + 9) * 220,
  jx: (rand(i * 11) - 0.5) * 120,
}));
const winArrive = WINS.map((_, wi) => {
  const os = ORBS.filter((o) => o.w === wi);
  return os.length ? Math.min(...os.map((o) => o.start + o.dur)) : T.ctrl - 2;
});

export const S9: React.FC<{t: number}> = ({t}) => {
  const cardP = ramp(t, T.cd - 0.1, T.cd + 0.7, ease.outQuint);
  const cardOut = ramp(t, T.town - 0.3, T.town + 0.5, ease.in);
  const s2 = ramp(t, T.strike - 0.05, T.strike + 0.5, ease.out);
  const townP = ramp(t, T.town - 0.2, T.town + 0.8, ease.inOut);
  const bGlow = 1 - 0.85 * ramp(t, T.shared - 0.1, T.shared + 1.4, ease.inOut);
  const split = ramp(t, T.redis, T.redis + 1.0, ease.inOut);
  const allLit = ramp(t, T.ctrl - 0.15, T.ctrl + 0.9, ease.inOut);
  const cam = breathe(camAt(t, [[T.s9, 960, 540, 1.1], [560.5, 960, 540, 1.0]]), t, 0.4);
  return (
    <Stage bg={C.paperShade}>
      <g opacity={1 - cardOut} transform={`translate(0 ${-cardOut * 60})`}>
        <Card x={960} y={470} w={1100} h={360} p={cardP} fill={C.paperLight} stroke={C.ink}>
          <text x={190} y={215} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={600} fontSize={120} fill={C.evidence}>Clean</text>
          <text x={910} y={215} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={600} fontSize={120} fill={C.ink}>Dirty</text>
          <Arrow from={{x: 400, y: 180}} to={{x: 690, y: 180}} color={C.ink} width={12} p={ramp(t, T.cd + 0.2, T.cd + 0.9, ease.out)} />
        </Card>
        <line x1={430} y1={640} x2={430 + 1060 * s2} y2={640 - 340 * s2} stroke={C.oxblood} strokeWidth={16} strokeLinecap="round" opacity={s2 > 0 ? 1 : 0} />
      </g>

      <g opacity={townP}>
        <rect x={0} y={0} width={1920} height={1080} fill={C.dusk} />
        <Cam cam={cam}>
          <CitySkyline era="medieval" layer="far" tone="dusk" y={640} x0={-300} x1={2300} t={t} seed={5} lit />
          <rect x={-400} y={820} width={2800} height={400} fill={mix(C.woodDark, C.ink, 0.5)} />
          {HOMES.map((h, i) => (
            <g key={i}>
              <polygon points={`${h.x - 18},${h.top} ${h.x + h.w / 2},${h.top - 120} ${h.x + h.w + 18},${h.top}`} fill={mix(C.woodDark, C.ink, 0.5)} />
              <rect x={h.x} y={h.top} width={h.w} height={820 - h.top} fill={mix(C.stoneShade, C.ink, 0.55)} />
              <rect x={h.x} y={h.top} width={h.w} height={105} fill={mix(C.bone, C.ink, 0.62)} />
              <rect x={h.x - 8} y={h.top + 100} width={h.w + 16} height={12} fill={mix(C.woodDark, C.ink, 0.4)} />
            </g>
          ))}
          <g>
            <polygon points="700,400 960,250 1220,400" fill={mix(C.woodDark, C.ink, 0.35)} />
            <rect x={710} y={400} width={500} height={420} fill={mix(C.stoneShade, C.ink, 0.35)} />
            <rect x={710} y={400} width={500} height={160} fill={mix(C.bone, C.ink, 0.4)} />
            {[790, 960, 1130].map((wx) => (
              <rect key={wx} x={wx - 30} y={440} width={60} height={72} rx={5} fill={mix(C.inkSoft, C.lamp, 0.95 * bGlow)} />
            ))}
            <Door x={960} y={820} w={150} h={210} style="plank" open={0.5} inside={mix(C.inkSoft, C.lamp, bGlow)} />
            <LightPool x={960} y={640} r={520} strength={0.55 * bGlow} />
            <Steam t={t} x={960} y={400} w={280} h={260} n={4} strength={bGlow} color={C.paperShade} />
            <BathSign x={1135} y={600} s={0.5} t={t} glow={bGlow} swing={0.6} />
          </g>
          <rect x={-400} y={-300} width={2800} height={1500} fill={C.ink} opacity={0.18} />
          {WINS.map((w, i) => {
            const lit = ramp(t, winArrive[i], winArrive[i] + 0.8, ease.out);
            const L = Math.max(lit, allLit);
            return (
              <g key={i}>
                {L > 0.02 && <LightPool x={w.x} y={w.y + 30} r={90} strength={0.7 * L} />}
                <rect x={w.x - 24} y={w.y - 4} width={48} height={60} rx={4} fill={mix(C.inkSoft, C.lamp, L)} stroke={C.woodDark} strokeWidth={4} />
                {w.tub && <path d={`M${w.x - 17} ${w.y + 36} h34 q-2 14 -17 14 q-15 0 -17 -14z`} fill={C.ink} opacity={allLit} />}
                <line x1={w.x} y1={w.y - 4} x2={w.x} y2={w.y + 56} stroke={C.woodDark} strokeWidth={3} />
              </g>
            );
          })}
          {ORBS.map((o, i) => {
            const pr = ramp(t, o.start, o.start + o.dur, ease.inOut);
            if (pr <= 0 || pr >= 1) return null;
            const w = WINS[o.w];
            const sx = BH.x + o.jx * 0.4;
            const sy = BH.y;
            const mx = (sx + w.x) / 2 + o.jx;
            const my = Math.min(sy, w.y) - o.lift;
            const x = (1 - pr) * (1 - pr) * sx + 2 * (1 - pr) * pr * mx + pr * pr * w.x;
            const y = (1 - pr) * (1 - pr) * sy + 2 * (1 - pr) * pr * my + pr * pr * (w.y + 26);
            const a = Math.min(1, pr * 6) * (1 - ramp(pr, 0.92, 1));
            return (
              <g key={i} opacity={a}>
                <LightPool x={x} y={y} r={34} strength={0.9} />
                <circle cx={x} cy={y} r={9 - pr * 2} fill={C.lamp} />
              </g>
            );
          })}
          {split < 0.999 && <LightPool x={BH.x} y={BH.y} r={150 * (1 - split * 0.4)} strength={1.0 * (1 - split)} />}
          <Particles t={t} x={0} y={300} w={1920} h={520} n={22} seed={9} size={[3, 5]} color={C.lamp} opacity={[0.25, 0.6]} vy={-8} twinkle />
        </Cam>
        <Kicker x={960} y={128} size={32} text="A REDISTRIBUTION OF CLEANLINESS" color={C.paperLight} p={ramp(t, T.kick9 - 0.1, T.kick9 + 0.7, ease.out)} />
        <Vignette strength={0.3} />
      </g>
    </Stage>
  );
};
