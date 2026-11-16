// Custom shots for C12 (builder-owned, AZTIKA). Each: export const S<n>: React.FC<{t: number}> returning the shot's WORLD
// (SVG, no <Stage>/<NightScreen> — the chapter provides them; NightShots joins, drifts and pins the host).
// C12 · «الفاتورة» — recap on the stairs → near-silence → TWIST (the cheapest number takes the summit) → every bill reached
// its owner → Howells digs → the dead store → ★ the Suez bill skips its signer and lands with a child → thesis → late bill.
// Palette: purple board → black hush → GOLD summit → grey landfill → dead-neon store → night timeline (gold bill) → gold.
// The stairs use ONE local camera (StairCam) on the kit's StairGame layout so overlays (lights, recap pills, the climb
// line, the flying contract, bills, owners) sit exactly on the steps.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp01, ease, lerp, popRef} from '../../../kit/anim';
import {lb, uid} from '../../../kit/stage';
import {GlowText, GridFloor, NightSky, NPill, Podium, RevealRing, Sparkle, WordPop, textWidth} from '../../../kit/night';
import type {PopWord} from '../../../kit/night';
import {Bokeh, Flash, HeroObject, Mark, Rays, Stamp} from '../../../kit/night-fx';
import {NightCity, StoryPerson} from '../../../kit/night-worlds';
import type {StairEntry} from '../../../kit/night-game';
import {PlateFx} from '../../../kit/night-places';
import {move, moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {MistakeBill} from '../shared';
import {OUT, popAt} from '../shared/util';
import board from '../../../../videos/ar-costly-mistakes/board.json';

const T = {
  // S1 «من بداية الفيديو وإحنا نطلع: 18 مليون، 600 مليون، 785 مليون، 900 مليون، 6 مليار، 300 مليار، 4 تريليون، 700 مليار»
  s1: 741.7, think: 742.94,
  recap: [743.62, 744.76, 746.08, 747.9, 749.2, 750.32, 751.46, 752.66],
  hush: 753.2, // near-silence until 754.96
  // S2 «وآخر رقم 4 مليون. أرخص رقم في الفيديو، وأغلى غلطة فيه»
  s2: 753.94, four: 754.96, arkhas: 755.78, riser: 756.3, aghla: 757.24, ghalta: 758.06,
  // S3 «ليش؟ لأن كل غلطة قبلها، الفاتورة وصلت لصاحبها»
  s3: 758.62, kul: 760.04, fatura: 760.86, wasalat: 761.66,
  // S4 «اللي رمى الهارديسك هو اللي يحفر في الزبالة»
  s4: 762.54, hdd: 763.12, yahfur: 764.06,
  // S5 «واللي رفض نتفليكس هي شركته اللي سكرت»
  s5: 764.82, netflix: 765.52, sakkarat: 766.76,
  // S6 «لكن صفقة السويس فاتورتها ما دفعها اللي وقّع. دفعها ناس ما كانوا مولودين يوم انكتبت»
  s6: 767.18, safqa: 767.54, faturatha: 768.5, waqqa: 769.84, dafaha: 770.16, mawludin: 771.62, inkatabat: 772.3,
  // S7 «وهذا اللي حاولت أوصله من البيتزا لين هنا»
  s7: 772.74, pizza: 774.3, huna: 774.96,
  // S8 «الغلطة ما تنقاس بسعرها يوم تصير. تنقاس بمين بيدفع ثمنها بعدين»
  s8: 775.1, ma: 775.78, tanqas: 775.88, bisiriha: 776.31, tasir: 776.96,
  l2: [777.34, 777.85, 778.36, 778.74, 779.1],
  // S9 «والفاتورة دايم توصل متأخرة»
  s9: 779.52, dayim: 780.26, tosal: 780.64, mutakhira: 780.96,
};

const GOLD = '#FFC928', RED = '#FD4B5B', GREY_RIM = '#A9B0C8';
const EL = (n: string) => `ar-costly-mistakes/el/${n}.png`;

// ---------------------------------------------------------------- the board (same data + layout as kit StairGame)
const ENTRIES: StairEntry[] = (board.entries as {id: string; label: string; at: number; src?: string; ar?: number; glow?: string; twist?: boolean}[]).map((e) => ({
  id: e.id, label: e.label, at: e.at, src: e.src, ar: e.ar ?? 1, glow: e.glow, twist: e.twist,
}));
// S2 draws the twist itself in SCREEN-wide space (the kit StairGame's Flash sits inside the camera and would only cover part
// of the screen when the camera is zoomed) — so S2 runs the board without the twist entry and without the waiting summit.
const TWIST = ENTRIES.find((e) => e.twist)!;
const PLAIN = ENTRIES.filter((e) => !e.twist).sort((a, b) => a.at - b.at);
const BASE = 836, N_STEPS = PLAIN.length + 1, SUM = N_STEPS - 1;
// Arabic stairs rise RIGHT → LEFT (kit layout: start W-260, stepW 250, stepH 62, h0 110, summit +0.6 step)
const SX = (i: number) => 1660 - 250 * i;
const SH = (i: number) => 110 + 62 * i + (i === SUM ? 62 * 0.6 : 0);
const TOP = (i: number) => BASE - SH(i);
const OBJ_Y = (i: number) => TOP(i) - 114; // object centre (objH 200)
const PILL_Y = (i: number) => TOP(i) - 252; // price pill

// ---------------------------------------------------------------- the stair camera (horizon fixed, like stairCamT)
type Cam = {cx: number; sx: number; z: number};
type CamKey = [number, number, number, number, number]; // at, cx (world), sx (screen), z, dur
const camAtK = (t: number, K: CamKey[]): Cam => {
  let k = 0;
  for (let i = 0; i < K.length; i++) if (t >= K[i][0]) k = i;
  const b = K[k], a = K[Math.max(0, k - 1)];
  const u = k === 0 ? 1 : ease.inOut(clamp01((t - b[0]) / b[4]));
  const drift = 1 + 0.0035 * Math.max(0, t - K[0][0]); // never still (MOTION.md §3)
  return {cx: lerp(a[1], b[1], u), sx: lerp(a[2], b[2], u), z: lerp(a[3], b[3], u) * drift};
};
const camT = (c: Cam) => `translate(${c.sx} ${BASE}) scale(${c.z}) translate(${-c.cx} ${-BASE})`;
const toScreen = (c: Cam, x: number, y: number): [number, number] => [c.sx + c.z * (x - c.cx), BASE + c.z * (y - BASE)];
const WHOLE: [number, number, number] = [660, 1240, 0.512];

// ---------------------------------------------------------------- local helpers
/** soft radial light */
const Glow: React.FC<{x: number; y: number; r: number; color: string; o?: number; id: string; ry?: number}> = ({x, y, r, color, o = 1, id, ry}) => {
  if (o <= 0.01) return null;
  const g = uid('c12glow', id);
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

/** a generated art image (cut-out) with an optional glow and CSS filter (the store's lights dying) */
const Pic: React.FC<{src: string; x: number; y: number; h: number; ar: number; o?: number; s?: number; rot?: number; glow?: string; filter?: string; id: string}> = ({src, x, y, h, ar, o = 1, s = 1, rot = 0, glow, filter, id}) => {
  if (o <= 0.001 || s <= 0.001) return null;
  const w = h * ar;
  const f = filter ?? (glow ? `drop-shadow(0 0 10px ${glow}) drop-shadow(0 0 30px ${glow}aa)` : 'drop-shadow(0 10px 8px rgba(0,0,0,0.45))');
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} {...lb('object', id)}>
      <foreignObject x={-w / 2 - 50} y={-h / 2 - 50} width={w + 100} height={h + 100}>
        <div style={{position: 'relative', width: w + 100, height: h + 100}}>
          <Img src={staticFile(src)} style={{position: 'absolute', left: 50, top: 50, width: w, height: h, filter: f}} />
        </div>
      </foreignObject>
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

/** the dark hush over the board with a light hole on one point (the summit) */
const Hush: React.FC<{d: number; x: number; y: number; r?: number; id: string}> = ({d, x, y, r = 1100, id}) => {
  if (d <= 0.01) return null;
  const g = uid('c12hush', id);
  return (
    <g>
      <defs>
        <radialGradient id={g} gradientUnits="userSpaceOnUse" cx={x} cy={y} r={r}>
          <stop offset="0" stopColor="#07031A" stopOpacity={0} />
          <stop offset="0.2" stopColor="#07031A" stopOpacity={0} />
          <stop offset="0.42" stopColor="#07031A" stopOpacity={d} />
          <stop offset="1" stopColor="#07031A" stopOpacity={d} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill={`url(#${g})`} />
    </g>
  );
};

/** a small bill glyph (no text — it is the motif's silhouette): dark header, gold title bar, print lines, a total bar */
const MiniBill: React.FC<{x: number; y: number; s?: number; total?: string; glow?: number; rot?: number; id: string}> = ({x, y, s = 1, total = GOLD, glow = 0, rot = 0, id}) => {
  const w = 120, h = 150;
  const zig = Array.from({length: 11}, (_, i) => `L${w / 2 - i * 12} ${h / 2 + (i % 2 ? 8 : 0)}`).join(' ');
  const d = `M${-w / 2} ${-h / 2 + 10} Q${-w / 2} ${-h / 2} ${-w / 2 + 10} ${-h / 2} H${w / 2 - 10} Q${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 10} V${h / 2} ${zig} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} {...lb('object', id)}>
      {glow > 0.01 && <Glow x={0} y={0} r={130} color={GOLD} o={glow} id={`${id}-g`} />}
      <path d={d} transform="translate(6 8)" fill="#000" opacity={0.4} />
      <path d={d} fill="#F6EEDB" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-w / 2 + 3} y={-h / 2 + 3} width={w - 6} height={34} rx={8} fill="#2A1C5C" />
      <rect x={-30} y={-h / 2 + 14} width={60} height={12} rx={6} fill={GOLD} />
      {[0, 1, 2].map((i) => <rect key={i} x={-w / 2 + 16} y={-14 + i * 20} width={w - 32 - (i % 2) * 24} height={7} rx={3.5} fill="#1A1430" opacity={0.35} />)}
      <rect x={-w / 2 + 16} y={h / 2 - 34} width={w - 32} height={16} rx={8} fill={total} />
    </g>
  );
};

/** the climb line: a gold stair-step line along the step tops, drawn up to step `u` (fractional), glowing head */
const climbPts = (() => {
  const pts: [number, number][] = [[SX(0) + 150, TOP(0) - 6]];
  for (let i = 0; i < N_STEPS; i++) {
    pts.push([SX(i) + 116, TOP(i) - 6]);
    pts.push([SX(i), TOP(i) - 6]);
    if (i < N_STEPS - 1) {
      pts.push([SX(i) - 116, TOP(i) - 6]);
      pts.push([SX(i) - 116, TOP(i + 1) - 6]);
    }
  }
  return pts;
})();
const climbLen = climbPts.map((p, i) => (i === 0 ? 0 : Math.hypot(p[0] - climbPts[i - 1][0], p[1] - climbPts[i - 1][1]))).reduce<number[]>((acc, d) => [...acc, (acc[acc.length - 1] ?? 0) + d], []);
const stepLen = (i: number) => climbLen[2 + i * 4]; // length to the middle of step i's top
const ClimbLine: React.FC<{t: number; u: number; o?: number; id: string}> = ({t, u, o = 1, id}) => {
  if (u <= -0.99 || o <= 0.01) return null;
  const i0 = Math.floor(Math.max(0, u)), fr = Math.max(0, u) - i0;
  const L = u < 0 ? lerp(0, stepLen(0), u + 1) : lerp(stepLen(Math.min(i0, SUM)), stepLen(Math.min(i0 + 1, SUM)), fr);
  // the head: walk the polyline to length L
  let hx = climbPts[0][0], hy = climbPts[0][1];
  for (let i = 1; i < climbPts.length; i++) {
    if (climbLen[i] >= L) {
      const k = (L - climbLen[i - 1]) / Math.max(1, climbLen[i] - climbLen[i - 1]);
      hx = lerp(climbPts[i - 1][0], climbPts[i][0], k); hy = lerp(climbPts[i - 1][1], climbPts[i][1], k);
      break;
    }
  }
  const d = climbPts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
  const total = climbLen[climbLen.length - 1];
  const g = uid('c12climb', id);
  return (
    <g opacity={o}>
      <defs><filter id={g} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={9} /></filter></defs>
      <path d={d} fill="none" stroke={GOLD} strokeWidth={22} strokeDasharray={`${L} ${total}`} filter={`url(#${g})`} opacity={0.7} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={OUT} strokeWidth={16} strokeDasharray={`${L} ${total}`} strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke="#FFE27A" strokeWidth={9} strokeDasharray={`${L} ${total}`} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={hx} cy={hy} r={20} fill="#FFF6D0" stroke={OUT} strokeWidth={5} />
      <Sparkle x={hx} y={hy} r={34 + 6 * Math.sin(t * 7)} o={0.9} color="#FFFFFF" />
    </g>
  );
};

/** WordPop centred on cx (computes the line width exactly like WordPop) → also returns each word's centre x */
const lineLayout = (words: string[], size: number, cx: number) => {
  const ws = words.map((w) => textWidth(w, size));
  const gaps = ws.map((w, i) => (i < ws.length - 1 ? Math.max(size * 0.2, 0.085 * (w + ws[i + 1])) : 0));
  const total = ws.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
  const right = cx + total / 2;
  let cur = right;
  const centres = ws.map((w, i) => {
    const c = cur - w / 2;
    cur -= w + gaps[i];
    return c;
  });
  return {right, centres, ws};
};
const CWords: React.FC<{t: number; words: PopWord[]; y: number; size: number; cx?: number; id: string; out?: number}> = ({t, words, y, size, cx = 960, id, out}) => {
  const L = lineLayout(words.map((w) => w.w), size, cx);
  return <WordPop t={t} words={words} y={y} size={size} right={L.right} id={id} out={out} />;
};

/** piecewise eased path: keys [at, x, y, s] — each leg eased in and out from the previous key, `dur` = leg length */
const legs = (t: number, K: [number, number, number, number, number][]): [number, number, number] => {
  let k = 0;
  for (let i = 0; i < K.length; i++) if (t >= K[i][0]) k = i;
  const b = K[k], a = K[Math.max(0, k - 1)];
  if (k === 0) return [b[1], b[2], b[3]];
  const [x, y] = move(t, b[0], [a[1], a[2]], [b[1], b[2]], b[4]);
  return [x, y, moveTo(t, b[0], a[3], b[3], b[4])];
};

// the board world (sky + floor + the stairs) under a camera. The stairs are drawn locally (same layout + pieces as the kit
// StairGame, every entry already arrived in C12) so the step pills can be HIDDEN where other text carries the story
// (recap, bills, thesis) and dropped when they leave the safe frame (layout gate 2026-11-16).
type PillMode = 'none' | 'safe';
const pillIn = (c: Cam, dy: number, x: number, y: number, text: string, size: number) => {
  const [sx, sy] = toScreen(c, x, y);
  const w = (textWidth(text, size) + size * 1.5) * c.z, h = size * 1.65 * c.z;
  return sx - w / 2 >= 96 && sx + w / 2 <= 1824 && sy + dy - h / 2 >= 60 && sy + dy + h / 2 <= 984;
};
const Stairs: React.FC<{t: number; c: Cam; dy: number; pills: PillMode; summit: 'wait' | 'twist' | 'none'; summitLabels?: boolean; objects?: boolean}> = ({t, c, dy, pills, summit, summitLabels = true, objects = true}) => (
  <g>
    {PLAIN.map((e, i) => (
      <g key={e.id}>
        <Podium x={SX(i)} base={BASE} w={232} h={SH(i)} id={`c12st-${e.id}`} color="green" />
        {objects && <HeroObject t={t} at={e.at + 0.25} src={e.src} ar={e.ar ?? 1} x={SX(i)} y={OBJ_Y(i)} h={200} glow={e.glow} sparkles={4} id={`c12st-${e.id}-o`} />}
        {pills === 'safe' && pillIn(c, dy, SX(i), PILL_Y(i), e.label, 40) && <NPill text={e.label} x={SX(i)} y={PILL_Y(i)} size={40} kind="white" id={`c12st-${e.id}-p`} />}
      </g>
    ))}
    {summit !== 'none' && <Podium x={SX(SUM)} base={BASE} w={232} h={SH(SUM)} id="c12st-sum" color="gold" />}
    {summit === 'wait' && (
      <g transform={`translate(${SX(SUM)} ${TOP(SUM) - 90 + Math.sin(t * 2) * 6})`}>
        <GlowText text="؟" x={0} y={0} size={150} tone="gold" id="c12st-q" />
      </g>
    )}
    {summit === 'twist' && (
      <g>
        <HeroObject t={t} at={TWIST.at + 0.25} src={TWIST.src} ar={TWIST.ar ?? 1} x={SX(SUM)} y={OBJ_Y(SUM)} h={200} glow={GOLD} sparkles={7} id="c12st-sumo" />
        {summitLabels && pills === 'safe' && pillIn(c, dy, SX(SUM), PILL_Y(SUM), TWIST.label, 50) && <NPill text={TWIST.label} x={SX(SUM)} y={PILL_Y(SUM)} size={50} kind="gold" id="c12st-sump" />}
        {summitLabels && <GlowText text={board.topLabel} x={SX(SUM)} y={TOP(SUM) - 340} size={96} tone="gold" id="c12st-top" />}
      </g>
    )}
  </g>
);
const Board: React.FC<{t: number; c: Cam; id: string; children?: React.ReactNode; over?: React.ReactNode; dy?: number; behind?: React.ReactNode; pills?: PillMode; summit?: 'wait' | 'twist' | 'none'; summitLabels?: boolean; objects?: boolean}> = ({t, c, id, children, over, dy = 0, behind, pills = 'safe', summit = 'twist', summitLabels, objects}) => (
  <g>
    <NightSky t={t} id={`${id}k`} />
    {behind}
    <g transform={`translate(0 ${dy}) ${camT(c)}`}>
      <GridFloor id={`${id}f`} t={t} wide />
      <Stairs t={t} c={c} dy={dy} pills={pills} summit={summit} summitLabels={summitLabels} objects={objects} />
      {children}
    </g>
    {over}
  </g>
);

// ==================================================================================================================
// S1 · 741.70 · «من بداية الفيديو وإحنا نطلع: 18 مليون … 700 مليار» — recap: the whole staircase, then the camera climbs
// with the numbers; each step lights and the SPOKEN number pops over its price pill; a gold climb-line walks up.
const RECAP = [
  {text: '18 مليون', kind: 'white'}, {text: '600 مليون', kind: 'white'}, {text: '785 مليون', kind: 'white'},
  {text: '900 مليون', kind: 'white'}, {text: '6 مليار', kind: 'white'}, {text: '300 مليار', kind: 'white'},
  {text: '4 تريليون', kind: 'gold'}, {text: '700 مليار', kind: 'red'},
] as const;
const S1_CAM: CamKey[] = [
  [T.s1, ...WHOLE, 0.7],
  [T.recap[0] - 0.5, SX(0) - 120, 1250, 0.82, 0.8],
  ...T.recap.slice(1).map((at, i): CamKey => [at - 0.25, SX(i + 1) + 60, 1150, 0.82, 0.55]),
  [T.hush - 0.05, ...WHOLE, 0.75],
];
const climbU = (t: number) => {
  let u = -1;
  T.recap.forEach((at, i) => {
    u = lerp(u, i, ease.inOut(clamp01((t - (at - 0.25)) / 0.45)));
  });
  return u;
};
const stepLight = (t: number, i: number) => {
  const at = T.recap[i];
  if (t < at - 0.1) return 0;
  const pulse = Math.exp(-Math.max(0, t - at) / 0.35);
  return 0.35 + 0.65 * pulse * clamp01((t - at + 0.1) / 0.1);
};
const StepLights: React.FC<{t: number; dim?: number}> = ({t, dim = 1}) => (
  <g opacity={dim}>
    {PLAIN.map((e, i) => {
      const l = stepLight(t, i);
      if (l <= 0) return null;
      const col = i === 7 ? RED : e.glow ?? GOLD;
      return (
        <g key={e.id}>
          <Glow x={SX(i)} y={OBJ_Y(i)} r={190} color={col} o={0.55 * l} id={`c12l${i}`} />
          <rect x={SX(i) - 116} y={TOP(i) - 5} width={232} height={10} rx={5} fill={i === 7 ? RED : '#FFE27A'} opacity={l} />
        </g>
      );
    })}
  </g>
);
export const S1: React.FC<{t: number}> = ({t}) => {
  const c = camAtK(t, S1_CAM);
  const hushD = 0.6 * ease.inOut(clamp01((t - T.hush) / 0.5));
  const [qx, qy] = toScreen(c, SX(SUM), TOP(SUM) - 90);
  const pillsOut = 1 - clamp01((t - T.hush) / 0.3);
  return (
    <Board t={t} c={c} id="c12s1" pills="none" summit="wait" over={
      <g>
        <Hush d={hushD} x={qx} y={qy} id="c12s1h" />
        {/* the spoken numbers — screen-space pills (46 px) over each step's price pill */}
        {pillsOut > 0.01 && RECAP.map((r, i) => {
          const [px, py] = toScreen(c, SX(i), PILL_Y(i));
          // the spoken pill replaces the step's own pill; it leaves (no pop-out) once it slides out of the safe frame
          const hw = (textWidth(r.text, 52) + 52 * 1.5) / 2;
          if (px - hw < 96 || px + hw > 1824 || py - 46 < 60) return null;
          return (
            <g key={i} opacity={pillsOut}>
              <NPill text={r.text} x={px} y={py} size={52} kind={r.kind} id={`c12s1r${i}`} p={(t - (T.recap[i] - 0.12)) / 0.3} />
            </g>
          );
        })}
      </g>
    }>
      <StepLights t={t} dim={1 - 0.6 * clamp01((t - T.hush) / 0.5)} />
      <ClimbLine t={t} u={climbU(t)} o={1 - 0.5 * clamp01((t - T.hush) / 0.5)} id="c12s1c" />
    </Board>
  );
};

// ==================================================================================================================
// S2 · 753.94 · ★ «وآخر رقم 4 مليون. أرخص رقم في الفيديو، وأغلى غلطة فيه» — THE TWIST: near-silence, the camera drifts to
// the stair FOOT, the signed contract pops tiny (grey «4 مليون £», «الأرخص»), then on «وأغلى» it shoots up past every step
// and takes the gold summit «الأغلى» (StairGame's twist + our tail ring); on «غلطة» the old steps dim.
const FOOT: [number, number] = [1905, 785];
const LAUNCH = T.aghla - 0.55, LAND = T.aghla + 0.2;
// the hero frame: the summit object big (330 world = ≈ 330 px), the camera pushed in and lowered (dy) so the summit fills the frame
const HOBJ: [number, number] = [SX(SUM), TOP(SUM) - 175], HERO_H = 330, HERO_DY = 487;
const S2_CAM: CamKey[] = [
  [T.s2, ...WHOLE, 0.5],
  [T.s2 + 0.08, SX(0) + 140, 1080, 1.15, 0.95],
  [LAUNCH + 0.05, -150, 880, 0.7, 0.72],
  [LAND - 0.12, SX(SUM), 1010, 1.0, 0.45],
];
export const S2: React.FC<{t: number}> = ({t}) => {
  const c = camAtK(t, S2_CAM);
  // hush: deep until the price pops, lighter at the foot, back on «غلطة» (all but the summit)
  const hushD = t < T.four ? 0.6 : t < T.ghalta ? lerp(0.6, 0.3, ease.inOut(clamp01((t - T.four) / 0.4))) : lerp(0.3, 0.55, ease.inOut(clamp01((t - T.ghalta) / 0.4)));
  const dy = HERO_DY * ease.inOut(clamp01((t - (LAND - 0.12)) / 0.45));
  const [hx, hy0] = toScreen(c, SX(SUM), t < T.aghla ? TOP(SUM) - 90 : HOBJ[1]);
  const hy = hy0 + dy;
  const hero = clamp01((t - (LAND - 0.1)) / 0.3);
  // the contract: crouch (anticipation) → arc up over the stairs → lands on the summit, handing over to StairGame's object
  const crouch = Math.sin(Math.PI * clamp01((t - (LAUNCH - 0.35)) / 0.35)) * (t < LAUNCH ? 1 : 0);
  const u = ease.inOut(clamp01((t - LAUNCH) / (LAND - LAUNCH)));
  const P0 = FOOT, P2: [number, number] = HOBJ, P1: [number, number] = [900, -420];
  const bx = (1 - u) * (1 - u) * P0[0] + 2 * (1 - u) * u * P1[0] + u * u * P2[0];
  const by = (1 - u) * (1 - u) * P0[1] + 2 * (1 - u) * u * P1[1] + u * u * P2[1];
  const bh = lerp(110, HERO_H, u);
  const handOff = 1 - clamp01((t - LAND) / 0.08);
  const flying = t >= LAUNCH && t < LAND + 0.2;
  cueSfx('tick', 'c12s2-four', t >= T.four - 0.05 && t < T.four + 0.25, 1300, {at: T.four - 0.05, hit: 0.08});
  cueSfx('whoosh', 'c12s2-shoot', t >= LAUNCH && t < LAUNCH + 0.3, 960, {at: LAUNCH, hit: 0.3, gain: 0.8});
  // trail: a few past positions along the arc
  const trail = flying ? [0.08, 0.16, 0.24, 0.32].map((d) => {
    const uu = ease.inOut(clamp01((t - d - LAUNCH) / (LAND - LAUNCH)));
    return [(1 - uu) * (1 - uu) * P0[0] + 2 * (1 - uu) * uu * P1[0] + uu * uu * P2[0], (1 - uu) * (1 - uu) * P0[1] + 2 * (1 - uu) * uu * P1[1] + uu * uu * P2[1]];
  }) : [];
  const tagOut = 1 - clamp01((t - LAUNCH) / 0.2);
  return (
    <Board t={t} c={c} id="c12s2" summit="none" dy={dy} behind={hero > 0 ? <g opacity={hero}><Rays t={t} id="c12s2r" tone="gold" x={hx} y={hy} /></g> : null} over={
      <g>
        <Hush d={hushD * (1 - 0.5 * hero)} x={hx} y={hy} id="c12s2h" />
        {/* the hero labels — screen space, phone-size */}
        <NPill text={TWIST.label} x={hx} y={hy - HERO_H / 2 - 62} size={62} kind="gold" id="c12s2-sump" p={(t - (LAND + 0.3)) / 0.3} />
        <CWords t={t} y={hy - HERO_H / 2 - 200} size={160} cx={hx} id="c12s2top" words={[{w: board.topLabel, at: LAND + 0.1, tone: 'gold'}]} />
        <Flash t={t} at={T.aghla + 0.15} strength={0.5} />
      </g>
    }>
      <Summit t={t} />
      <StepLights t={t} dim={0.4} />
      <ClimbLine t={t} u={SUM - 1} o={0.45} id="c12s2c" />
      {/* the gold trail of the shot */}
      {trail.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={46 - i * 9} fill={GOLD} opacity={0.5 - i * 0.1} />)}
      {/* the signed contract at the foot */}
      {t >= T.four - 0.05 && handOff > 0.01 && (
        <g opacity={handOff}>
          {u === 0 && <ellipse cx={FOOT[0]} cy={FOOT[1] + 58} rx={60} ry={12} fill="#000" opacity={0.45} />}
          <Pop t={t} at={T.four - 0.05} x={FOOT[0]} y={FOOT[1]}>
            <g transform={`translate(${bx} ${by}) scale(${1 + 0.08 * crouch} ${1 - 0.12 * crouch}) rotate(${u * 360}) translate(${-bx} ${-by})`}>
              <Pic src={EL('contract-blank')} ar={0.941} x={bx} y={by} h={bh} glow={u > 0 || crouch > 0 ? GOLD : undefined} id="c12s2-k" />
            </g>
          </Pop>
        </g>
      )}
      {tagOut > 0.01 && (
        <g opacity={tagOut}>
          <NPill text="4 مليون £" x={FOOT[0]} y={FOOT[1] - 112} size={40} kind="grey" id="c12s2-p" p={(t - (T.four + 0.12)) / 0.3} />
          <NPill text="الأرخص" x={FOOT[0]} y={FOOT[1] - 185} size={40} kind="grey" id="c12s2-a" p={(t - (T.arkhas - 0.1)) / 0.3} />
        </g>
      )}
      <RevealRing t={t} at={LAND} x={HOBJ[0]} y={HOBJ[1]} r={360} tail boom={false} />
    </Board>
  );
};

/** the summit as StairGame draws it (gold podium · «؟» waiting · the twist: object, gold pill, «الأغلى», ring, boom) */
const Summit: React.FC<{t: number}> = ({t}) => {
  const at = T.aghla, el = t - at, top = TOP(SUM), x = SX(SUM);
  const wait = 1 - clamp01(el / 0.3);
  cueSfx('boom', 'c12s2-summit-boom', t >= at && t < at + 0.3, 700, {at, hit: 0.13, gain: 1.6});
  return (
    <g>
      <Podium x={x} base={BASE} w={232} h={SH(SUM)} id="c12s2sum" color="gold" />
      {wait > 0.01 && (
        <g opacity={wait} transform={`translate(${x} ${top - 90 + Math.sin(t * 2) * 6})`}>
          <GlowText text="؟" x={0} y={0} size={150} tone="gold" id="c12s2q" />
        </g>
      )}
      <HeroObject t={t} at={LAND} src={TWIST.src} ar={TWIST.ar ?? 1} x={HOBJ[0]} y={HOBJ[1]} h={HERO_H} glow={GOLD} sparkles={8} id="c12s2-sumo" />
      {/* the old champion loses its gold the moment the twist lands (one gold pill per frame) */}
    </g>
  );
};

// ==================================================================================================================
// S3 · 758.62 · «ليش؟ لأن كل غلطة قبلها، الفاتورة وصلت لصاحبها» — every step prints its bill, they glow, each flies to
// its owner standing in front of the step, a green ✔ on each.
const OWNERS: {role?: 'engineer' | 'man' | 'programmer' | 'banker' | 'businessman' | 'worker'; outfit?: 'hoodie'; glasses?: boolean; tie?: string; rim?: string; hat?: 'hardhat'; body?: string}[] = [
  {role: 'engineer'}, // mariner
  {role: 'man', rim: GREY_RIM}, // howells
  {role: 'programmer', glasses: true}, // pizza (Laszlo)
  {role: 'banker'}, // citi
  {role: 'programmer', outfit: 'hoodie', body: '#2F3550'}, // binance engineer
  {role: 'businessman', tie: GOLD}, // blockbuster CEO
  {role: 'businessman', rim: '#B57BFF'}, // yahoo
  {role: 'worker', hat: 'hardhat'}, // chernobyl
];
const OWN_Y = 1000, OWN_S = 0.75;
const S3_CAM: CamKey[] = [[T.s3, 1300, 1150, 0.9, 0.6], [T.s3 + 0.05, 760, 1150, 0.9, 3.8]];
export const S3: React.FC<{t: number}> = ({t}) => {
  const c = camAtK(t, S3_CAM);
  const glowAll = clamp01((t - (T.fatura - 0.1)) / 0.2) * (1 - 0.6 * clamp01((t - T.wasalat) / 0.4));
  return (
    <Board t={t} c={c} id="c12s3" pills="none" summitLabels={false} over={
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill="#07031A" opacity={0.18} />
        <CWords t={t} y={150} size={130} cx={1180} id="c12s3w" words={[{w: 'ليش؟', at: T.s3 - 0.05, tone: 'gold'}]} />
      </g>
    }>
      {PLAIN.map((e, i) => {
        const bAt = T.kul + i * 0.07;
        const own = OWNERS[i];
        const oAt = T.wasalat - 0.45 + i * 0.04;
        const fAt = T.wasalat + i * 0.05;
        const from: [number, number] = [SX(i), BASE - 70];
        const to: [number, number] = [SX(i) + 30, OWN_Y - 175];
        const [bx, by] = move(t, fAt, from, to, 0.45);
        const bs = moveTo(t, fAt, 1, 0.7, 0.45);
        const checkAt = fAt + 0.45;
        return (
          <g key={e.id}>
            {t >= oAt && (
              <Pop t={t} at={oAt} x={SX(i)} y={OWN_Y}>
                <StoryPerson t={t} x={SX(i)} y={OWN_Y} s={OWN_S} role={own.role} outfit={own.outfit} glasses={own.glasses} tieColor={own.tie} rim={own.rim} hat={own.hat} body={own.body} pose={t >= checkAt ? 'hold' : 'idle'} id={`c12s3o${i}`} />
              </Pop>
            )}
            {t >= bAt && (
              <Pop t={t} at={bAt} x={from[0]} y={from[1]}>
                <MiniBill x={bx} y={by} s={bs} glow={glowAll} total={i === 7 ? RED : GOLD} rot={-4 + (i % 3) * 3} id={`c12s3b${i}`} />
              </Pop>
            )}
            {t >= checkAt && (
              <Pop t={t} at={checkAt} x={SX(i) + 80} y={OWN_Y - 330}>
                <Mark kind="check" x={SX(i) + 80} y={OWN_Y - 330} r={36} />
              </Pop>
            )}
          </g>
        );
      })}
      {glowAll > 0.2 && PLAIN.map((e, i) => <Sparkle key={i} x={SX(i) + 50} y={BASE - 130} r={22} o={glowAll * (0.5 + 0.5 * Math.sin(t * 6 + i))} color="#FFFFFF" />)}
    </Board>
  );
};

/** a MiniBill that pops in and flies (eased) to its owner, with a whoosh */
const FlyBill: React.FC<{t: number; at: number; fly: number; from: [number, number, number]; to: [number, number, number]; id: string}> = ({t, at, fly, from, to, id}) => {
  if (t < at) return null;
  const [x, y] = move(t, fly, [from[0], from[1]], [to[0], to[1]], 0.5);
  const s = moveTo(t, fly, from[2], to[2], 0.5);
  cueSfx('whoosh', `${id}-fly`, t >= fly && t < fly + 0.3, to[0], {at: fly, hit: 0.3, gain: 0.7});
  return <Pop t={t} at={at} x={from[0]} y={from[1]}><MiniBill x={x} y={y} s={s} rot={lerp(-12, -4, clamp01((t - fly) / 0.5))} glow={0.5} id={id} /></Pop>;
};

// ==================================================================================================================
// S4 · 762.54 · «اللي رمى الهارديسك هو اللي يحفر في الزبالة» — grey rain night: Howells digs on the landfill, his bill
// lands on his back; on «يحفر» the strokes throw rubbish.
const Rubbish: React.FC<{x: number; y: number; r: number; k: number}> = ({x, y, r, k}) => {
  const col = ['#6D7A5A', '#8A8FA6', '#5A4E6E', '#A7896A'][k % 4];
  return k % 2 ? <rect x={x - r} y={y - r * 0.7} width={r * 2} height={r * 1.4} rx={4} fill={col} stroke={OUT} strokeWidth={4} transform={`rotate(${k * 37} ${x} ${y})`} />
    : <path d={`M${x - r} ${y} L${x} ${y - r} L${x + r} ${y + r * 0.2} L${x + r * 0.2} ${y + r} Z`} fill={col} stroke={OUT} strokeWidth={4} strokeLinejoin="round" />;
};
export const S4: React.FC<{t: number}> = ({t}) => {
  const HX = 860, HY = 598; // his feet on the mound's top
  // dig cycle: a stroke every 0.55 s (wind-up up → down), stronger from «يحفر»
  const ph = ((t - T.s4) / 0.55) % 1;
  const amp = t < T.yahfur ? 0.6 : 1;
  const lean = (ph < 0.6 ? -ease.inOut(ph / 0.6) * 6 : -6 + ease.out((ph - 0.6) / 0.4) * 20) * amp;
  const strokes = Array.from({length: 8}, (_, k) => T.s4 + 0.33 + k * 0.55).filter((s) => s < 765.2);
  strokes.forEach((s, k) => cueSfx('thump', `c12s4-dig${k}`, t >= s && t < s + 0.2, HX - 120, {at: s, hit: 0.02, gain: s >= T.yahfur - 0.1 ? 0.8 : 0.45}));
  return (
    <g>
      <NightSky t={t} id="c12s4k" />
      <rect x={0} y={0} width={1920} height={1080} fill="#2A2E40" opacity={0.55} />
      <Glow x={960} y={900} r={900} ry={300} color="#8C93B0" o={0.35} id="c12s4fl" />
      <rect x={0} y={900} width={1920} height={180} fill="#14111F" />
      <Pic src={EL('landfill-tile')} ar={1.209} x={960} y={790} h={660} id="c12s4lf" />
      <g transform={`rotate(${lean} ${HX} ${HY})`}>
        <StoryPerson t={t} x={HX} y={HY} s={1.0} role="man" rim={GREY_RIM} prop="pickaxe" pose={ph > 0.6 ? 'hold' : 'up'} flip id="c12s4how" />
      </g>
      {/* rubbish thrown by each stroke after «يحفر» */}
      {strokes.filter((s) => s >= T.yahfur - 0.2).map((s, k) => [0, 1, 2].map((j) => {
        const e = t - s;
        if (e < 0 || e > 0.9) return null;
        const vx = 260 + j * 140, vy = -620 + j * 90;
        const x = HX - 160 - vx * e * (k % 2 ? 0.8 : -0.4), y = HY + 10 + vy * e + 1500 * e * e;
        return <g key={`${k}-${j}`} opacity={1 - clamp01((e - 0.6) / 0.3)}><Rubbish x={x} y={y} r={16 + j * 5} k={k * 3 + j} /></g>;
      }))}
      <PlateFx t={t} kind="rain" density={1.3} seed={4} />
      {/* his bill: drops from the sky and lands on his back */}
      <FlyBill t={t} at={T.s4 + 0.02} fly={T.s4 + 0.12} from={[1400, 220, 1.9]} to={[HX + 120, HY - 250, 1.0]} id="c12s4b" />
      <NPill text="يحفر" x={HX - 300} y={300} size={52} kind="white" id="c12s4p" p={(t - (T.yahfur - 0.1)) / 0.3} />
    </g>
  );
};

// ==================================================================================================================
// S5 · 764.82 · «واللي رفض نتفليكس هي شركته اللي سكرت» — the rental store lit, the CEO in front; «رفض نتفليكس» + his bill;
// on «سكرت» the lights flicker twice and die, he droops.
const lightsOn = (t: number) => {
  const a = T.sakkarat;
  if (t < a) return 1;
  if (t < a + 0.1) return 0.15;
  if (t < a + 0.18) return 0.9;
  if (t < a + 0.28) return 0.1;
  if (t < a + 0.34) return 0.7;
  return Math.max(0, 0.3 - (t - a - 0.34) * 2);
};
export const S5: React.FC<{t: number}> = ({t}) => {
  const L = lightsOn(t);
  const droop = ease.inOut(clamp01((t - (T.sakkarat + 0.3)) / 0.5));
  const SXs = 1250, SYs = 560, SHs = 640;
  return (
    <g>
      <NightCity t={t} id="c12s5c" />
      <rect x={0} y={0} width={1920} height={1080} fill="#07031A" opacity={0.25 + 0.3 * (1 - L)} />
      <Glow x={SXs} y={SYs + 80} r={520} color={GOLD} o={0.55 * L} id="c12s5g" />
      <ellipse cx={SXs} cy={SYs + SHs / 2 - 20} rx={360} ry={34} fill="#000" opacity={0.45} />
      <Pic src={EL('rental-store-blank')} ar={1.085} x={SXs} y={SYs} h={SHs} id="c12s5st" filter={`brightness(${(0.32 + 0.68 * L).toFixed(3)}) saturate(${(0.45 + 0.55 * L).toFixed(3)})`} />
      {/* the light from the store on the pavement */}
      <Glow x={SXs} y={960} r={600} ry={90} color="#FFE7A8" o={0.45 * L} id="c12s5pv" />
      <g transform={`translate(0 ${droop * 18}) rotate(${droop * 7} 600 1020)`}>
        <StoryPerson t={t} x={600} y={1020} s={1.3} role="businessman" tieColor={GOLD} pose={droop > 0.3 ? 'think' : 'hold'} id="c12s5ceo" />
      </g>
      <NPill text="رفض نتفليكس" x={600} y={360} size={52} kind="white" id="c12s5p" p={(t - (T.netflix - 0.12)) / 0.3} />
      <FlyBill t={t} at={T.netflix - 0.15} fly={T.netflix + 0.1} from={[1560, 220, 1.9]} to={[690, 770, 1.2]} id="c12s5b" />
    </g>
  );
};

// ==================================================================================================================
// S6 · 767.18 · ★ «لكن صفقة السويس فاتورتها ما دفعها اللي وقّع. دفعها ناس ما كانوا مولودين يوم انكتبت» — a long glowing
// timeline (1875 right → today left): the bill prints by the signer, lifts, flies PAST him (red ✖), the camera follows it
// over 1882 · 1956 · 2023 while later generations pop up, and it lands in a child's hands; the signature glows once.
const LINE_Y = 960; // the timeline = the ground they stand on
const ISM = 1180; // Ismail
const KX = 1540; // the contract (signature) at 1875
const PINS = [{year: '1875', x: KX + 10}, {year: '1882', x: 420}, {year: '1956', x: -760}, {year: '2023', x: -1980}];
const PEOPLE = [
  {x: 560, at: 770.32, role: 'worker' as const, rim: '#7FD8FF'},
  {x: -640, at: 770.72, role: 'soldier' as const, rim: '#7FD8FF'},
  {x: -1420, at: 771.05, role: 'woman' as const, rim: '#7FD8FF'},
  {x: -2280, at: 771.3, role: 'child' as const, rim: GOLD},
];
const CHILD = PEOPLE[3];
const S6_CAM: CamKey[] = [
  [T.s6, 1240, 960, 1.0, 0.5],
  [T.dafaha - 0.1, -2150, 960, 0.92, 1.55],
  [T.inkatabat - 0.35, -400, 960, 0.43, 0.6],
];
const camT6 = (c: Cam) => `translate(${c.sx} 540) scale(${c.z}) translate(${-c.cx} -540)`;
export const S6: React.FC<{t: number}> = ({t}) => {
  const c = camAtK(t, S6_CAM);
  // the bill's flight (world): prints by the contract → lifts → hovers toward him → passes him → down the line → child
  const [bx, by, bs] = legs(t, [
    [T.safqa, KX - 60, 470, 0.62, 0],
    [T.faturatha, KX - 160, 310, 0.6, 0.5],
    [T.waqqa - 0.3, ISM + 160, 330, 0.58, 0.6],
    [T.waqqa, ISM - 360, 400, 0.54, 0.4],
    [T.dafaha, CHILD.x + 200, 460, 0.48, 1.4],
    [T.mawludin - 0.12, CHILD.x + 20, LINE_Y - 115, 0.27, 0.4],
  ]);
  const sig = Math.exp(-Math.max(0, t - T.inkatabat) / 0.35) * clamp01((t - T.inkatabat + 0.05) / 0.1);
  const lineDraw = ease.out(clamp01((t - T.s6) / 1.2));
  const lineL = 4500;
  cueSfx('whoosh', 'c12s6-pass', t >= T.waqqa - 0.3 && t < T.waqqa, ISM, {at: T.waqqa - 0.3, hit: 0.2, gain: 0.7});
  return (
    <g>
      <NightSky t={t} id="c12s6k" />
      <Bokeh t={t} n={18} color="#FFE7A8" seed={6} />
      <g transform={camT6(c)}>
        {/* ground + the glowing timeline (drawn from 1875 toward today) */}
        <rect x={-3200} y={LINE_Y} width={5600} height={900} fill="#120A2E" />
        <path d={`M${KX + 220} ${LINE_Y} H${KX + 220 - lineL}`} stroke={GOLD} strokeWidth={30} opacity={0.25} strokeDasharray={`${lineL * lineDraw} ${lineL}`} />
        <path d={`M${KX + 220} ${LINE_Y} H${KX + 220 - lineL}`} stroke="#FFF1C8" strokeWidth={10} strokeLinecap="round" strokeDasharray={`${lineL * lineDraw} ${lineL}`} />
        {PINS.map((p, i) => (
          <g key={p.year}>
            <line x1={p.x} x2={p.x} y1={LINE_Y} y2={i === 0 ? 300 : 200} stroke="#FFF1C8" strokeWidth={4} strokeDasharray="8 10" opacity={0.5} />
            <circle cx={p.x} cy={LINE_Y} r={14} fill={GOLD} stroke={OUT} strokeWidth={5} />
            <NPill text={p.year} x={p.x} y={i === 0 ? 260 : 160} size={50} kind="white" id={`c12s6y${i}`} p={i === 0 ? (t - T.s6) / 0.3 : (t - (PEOPLE[i - 1].at - 0.2)) / 0.3} />
          </g>
        ))}
        {/* 1875: the signed contract on a little stand; its signature glows once on «انكتبت» */}
        <rect x={KX - 70} y={LINE_Y - 120} width={140} height={120} rx={10} fill="#3A2468" stroke={OUT} strokeWidth={6} />
        <Glow x={KX} y={LINE_Y - 220} r={200} color={GOLD} o={0.3 + 0.7 * sig} id="c12s6sg" />
        <Pic src={EL('contract-blank')} ar={0.941} x={KX} y={LINE_Y - 220} h={200} glow={GOLD} id="c12s6k1" />
        <path d={`M${KX - 50} ${LINE_Y - 175} c 18 -26 30 10 44 -8 s 22 -20 30 6 s 18 -4 26 -14`} fill="none" stroke={GOLD} strokeWidth={6 + 6 * sig} strokeLinecap="round" />
        {sig > 0.05 && <Sparkle x={KX + 40} y={LINE_Y - 190} r={40 * sig + 12} o={sig} color="#FFFFFF" />}
        {/* the signer */}
        <StoryPerson t={t} x={ISM} y={LINE_Y} s={1.15} hat="tarboush" outfit="bisht" rim={GOLD} prop="pen" pose={t >= T.waqqa ? 'shock' : 'hold'} flip id="c12s6ism" />
        <NPill text="إسماعيل" x={ISM - 260} y={LINE_Y - 400} size={46} kind="white" id="c12s6n" p={(t - (T.s6 + 0.15)) / 0.3} />
        {t >= T.waqqa + 0.05 && (
          <Pop t={t} at={T.waqqa + 0.05} x={ISM + 120} y={LINE_Y - 430}>
            <Mark kind="cross" x={ISM + 120} y={LINE_Y - 430} r={48} />
          </Pop>
        )}
        {/* later generations pop up along the line */}
        {PEOPLE.map((p, i) => (
          <Pop key={i} t={t} at={p.at} x={p.x} y={LINE_Y}>
            {i === 3 && <Glow x={p.x} y={LINE_Y - 160} r={260} color={GOLD} o={0.6 * clamp01((t - T.mawludin) / 0.3)} id="c12s6cg" />}
            <StoryPerson t={t} x={p.x} y={LINE_Y} s={i === 3 ? 0.9 : 1.0} role={p.role} rim={p.rim} pose={i === 3 && t >= T.mawludin ? 'hold' : 'idle'} flip id={`c12s6p${i}`} />
          </Pop>
        ))}
        {/* the bill (fg) */}
        <g transform={`translate(${bx} ${by}) scale(${bs}) rotate(${-6 + 6 * clamp01((t - T.mawludin) / 0.3)})`}>
          <MistakeBill t={t} at={T.safqa} x={0} y={0} w={900} title="فاتورة السويس" rows={[{label: 'وقتها', value: '4 مليون £', at: T.safqa + 0.35}]} rot={0} id="c12s6b" />
        </g>
      </g>
    </g>
  );
};

// ==================================================================================================================
// S7 · 772.74 · «وهذا اللي حاولت أوصله من البيتزا لين هنا» — back on the stairs, low and close on the pizza step; it glows
// on «البيتزا», then the camera glides up the steps to the gold summit on «هنا».
const SUMMIT_VIEW: [number, number, number] = [SX(SUM) + 160, 860, 0.66];
const S7_CAM: CamKey[] = [
  [T.s7, SX(2) - 60, 1240, 1.12, 0.5],
  [T.pizza + 0.05, ...SUMMIT_VIEW, 0.85],
];
export const S7: React.FC<{t: number}> = ({t}) => {
  const c = camAtK(t, S7_CAM);
  const lit = stepPulse(t, T.pizza - 0.08);
  cueSfx('sparkle', 'c12s7-huna', t >= T.huna - 0.1 && t < T.huna + 0.2, 700, {at: T.huna - 0.1, hit: 0.15});
  const [px, py] = toScreen(c, SX(2), PILL_Y(2) - 70);
  return (
    <Board t={t} c={c} id="c12s7" over={
      <NPill text="البيتزا" x={px} y={py} size={48} kind="white" id="c12s7p" p={(t - (T.pizza - 0.12)) / 0.3} />
    }>
      <Glow x={SX(2)} y={OBJ_Y(2)} r={220} color={GOLD} o={0.7 * lit} id="c12s7g" />
      <rect x={SX(2) - 116} y={TOP(2) - 5} width={232} height={10} rx={5} fill="#FFE27A" opacity={lit} />
      <ClimbLine t={t} u={lerp(1.4, SUM, ease.inOut(clamp01((t - (T.pizza + 0.05)) / 0.85)))} o={0.85} id="c12s7c" />
      <Glow x={SX(SUM)} y={OBJ_Y(SUM)} r={300} color={GOLD} o={0.5 * clamp01((t - (T.huna - 0.2)) / 0.3)} id="c12s7sg" />
    </Board>
  );
};
const stepPulse = (t: number, at: number) => (t < at ? 0 : 0.45 + 0.55 * Math.exp(-(t - at) / 0.4));

// ==================================================================================================================
// S8 · 775.10 · «الغلطة ما تنقاس بسعرها يوم تصير. تنقاس بمين بيدفع ثمنها بعدين» — the thesis over the dimmed gold summit;
// «بسعرها» struck red on «تصير»; «بعدين» gold.
const L1 = ['الغلطة', 'ما', 'تنقاس', 'بسعرها'];
const L2 = ['تنقاس', 'بمين', 'بيدفع', 'ثمنها', 'بعدين'];
const S8_CAM: CamKey[] = [[T.s8, SX(SUM), 480, 0.62, 0.5]];
export const S8: React.FC<{t: number}> = ({t}) => {
  const c = camAtK(t, S8_CAM);
  const size = 100, cx = 1130;
  const lay = lineLayout(L1, size, cx);
  const bx = lay.centres[3], bw = lay.ws[3];
  const strike = ease.out(clamp01((t - (T.tasir - 0.05)) / 0.25));
  cueSfx('swish', 'c12s8-strike', t >= T.tasir - 0.05 && t < T.tasir + 0.2, bx, {at: T.tasir - 0.05, hit: 0.15, gain: 0.7});
  return (
    <Board t={t} c={c} id="c12s8" pills="none" summitLabels={false} objects={false} over={
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill="#07031A" opacity={0.5} />
        <CWords t={t} y={470} size={size} cx={cx} id="c12s8a" words={[
          {w: L1[0], at: T.s8 - 0.05}, {w: L1[1], at: T.ma - 0.05}, {w: L1[2], at: T.tanqas}, {w: L1[3], at: T.bisiriha - 0.05},
        ]} />
        {strike > 0 && (
          <g>
            <line x1={bx + bw / 2 + 14} x2={bx + bw / 2 + 14 - (bw + 28) * strike} y1={482} y2={462} stroke={OUT} strokeWidth={22} strokeLinecap="round" />
            <line x1={bx + bw / 2 + 14} x2={bx + bw / 2 + 14 - (bw + 28) * strike} y1={482} y2={462} stroke={RED} strokeWidth={13} strokeLinecap="round" />
          </g>
        )}
        {t >= T.tasir + 0.15 && (
          <Pop t={t} at={T.tasir + 0.15} x={bx - bw / 2 - 30} y={390}>
            <Mark kind="cross" x={bx - bw / 2 - 30} y={390} r={40} />
          </Pop>
        )}
        <CWords t={t} y={660} size={size} cx={cx} id="c12s8b" words={L2.map((w, i) => ({w, at: T.l2[i] - 0.05, tone: i === 4 ? 'gold' as const : undefined}))} />
      </g>
    }>
      <Glow x={SX(SUM)} y={OBJ_Y(SUM)} r={340} color={GOLD} o={0.55} id="c12s8sg" />
    </Board>
  );
};

// ==================================================================================================================
// S9 · 779.52 · «والفاتورة دايم توصل متأخرة» — close: the Suez bill slides in; «وقتها 4 مليون £» · «الثمن 81 سنة وحرب»;
// a GOLD stamp «متأخرة» presses on it.
export const S9: React.FC<{t: number}> = ({t}) => {
  const [x] = move(t, T.s9, [1420, 540], [1040, 540], 0.5);
  return (
    <g>
      <NightSky t={t} id="c12s9k" />
      <Rays t={t} id="c12s9r" tone="gold" x={1080} y={540} />
      <MistakeBill t={t} at={T.s9} x={x} y={540} w={1000} s={1.25} title="فاتورة السويس" rows={[
        {label: 'وقتها', value: '4 مليون £', at: T.dayim - 0.1},
        {label: 'الثمن', value: '81 سنة وحرب', tone: 'red', at: T.tosal - 0.1},
      ]} rot={-3} id="c12s9b" />
      {/* the last word of the story: a RED ink stamp pressed ON the bill */}
      <Stamp t={t} at={T.mutakhira - 0.05} text="متأخرة" x={x + 110} y={700} size={124} rot={-8} />
    </g>
  );
};
