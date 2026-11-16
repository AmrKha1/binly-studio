// Custom shots for C07 (builder-owned, AZTIKA). Each: export const S<n>: React.FC<{t: number}> returning the shot's WORLD
// (SVG, no <Stage>/<NightScreen> — the chapter provides them; NightShots joins, drifts and pins the host).
// C07 · اجتماع في دالاس — the TURN (lost money → money that never existed), then Netflix vs Blockbuster.
// Palette: board purple → red losses / cyan ghost steps → warm 2000 office → red «لا» → night city time-lapse.
// Screen coordinates (NightScreen: no mirroring).
import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp01, ease, lerp, popRef, pressIn, rand, flyOut} from '../../../kit/anim';
import {lb, uid} from '../../../kit/stage';
import {W, H} from '../../../kit/theme';
import {GlowText, GridFloor, NightSky, NPill, Podium, RevealRing, WordPop, YearBadge, textWidth} from '../../../kit/night';
import type {PopWord} from '../../../kit/night';
import {Bubble, CountNumber, Flash, HeroObject, Mark, Stamp} from '../../../kit/night-fx';
import {NightCity, PriceTag, RoomWorld, Route, StoryPerson} from '../../../kit/night-worlds';
import {PlateWorld} from '../../../kit/night-places';
import {StairGame} from '../../../kit/night-game';
import type {StairEntry} from '../../../kit/night-game';
import {MarkPill} from '../../../kit/night-data';
import {Spotlight} from '../../../kit/night-story';
import {move, moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {OUT, popAt} from '../shared/util';
import BOARD from '../../../../videos/ar-costly-mistakes/board.json';

const SLUG = 'ar-costly-mistakes';
const T = {
  s2: 396.02, tint: 396.23, kul: 397.02, mawjuda: 397.7, // «بس كل اللي فات كان خسارة في فلوس موجودة»
  s3: 398.54, naw: 399.28, ghost: 400.3, notYet: 401.46, // «الحين ندخل نوع ثاني تمامًا: خسارة فلوس ما كانت موجودة لسه»
  s4: 402.76, jatak: 403.07, legs: 403.76, la: 405.04, // «فرصة جاتك برجولها، وقلت لها لا»
  s6: 408.08, reed: 409.04, marc: 409.96, door: 411.0, // «اثنين اسمهم ريد هاستنقز ومارك راندولف داخلين على مكتب الرئيس التنفيذي»
  s8: 415.98, netflix: 417.42, mail: 419.32, hard: 420.58, // «شركتهم الصغيرة اسمها نتفليكس، ترسل الأفلام للناس بالبريد، ووضعها صعب»
  s9: 420.96, lose: 422.24, fifty: 422.68, dollar: 423.8, sameYear: 424.48, // «تخسر 50 مليون دولار في نفس السنة»
  s10: 425.14, bigger: 426.04, hundred: 427.48, // «وبلوكباستر أكبر منهم تقريبًا 100 مرة»
  s11: 428.2, idea: 428.8, listen: 430.4, nod: 430.88, // «يعرضون الفكرة، والرئيس التنفيذي يسمع، ويهز راسه»
  s12: 431.8, howMuch: 432.74, said: 434.16, fiftyM: 434.72, // «طيب كم تبون عشان نشتريكم؟ قالوا: 50 مليون»
  s13: 436.18, randolph: 437.0, tries: 438.24, holds: 438.66, laugh: 439.3, over: 440.46, no: 441.88, // «يحاول يمسك نفسه لا يضحك … والجواب: لا»
  s14: 442.16, logic: 443.62, bubble: 445.3, burst: 446.14, losing: 447.58, // «وقتها كان عنده منطق. فقاعة الإنترنت كانت تنفجر، ونتفليكس شركة تخسر»
  s15: 448.36, fikra: 448.59, lastLaugh: 449.64, right: 450.86, // «اللي يضحك أخيرًا هو اللي يضحك صح»
  s16: 451.16, three: 453.04, dollars: 454.18, bb: 454.66, oneStore: 456.92, visit: 458.76, memories: 460.12, end: 460.7,
};

const GOLD = '#FFC928', CYAN = '#5CF2FF', RED = '#FD4B5B', RIM2 = '#7FD8FF';
const SKIN = '#16121F';
const art = (name: string) => `${SLUG}/el/${name}.png`;
const AR: Record<string, number> = {'dvd-mailer': 0.909, 'rental-store-blank': 1.085, 'netflix-tower': 0.557, 'small-house': 1.052};
const pp = (t: number, at: number) => (t - at) / 0.3; // NPill pop progress

// ---------------------------------------------------------------- local helpers
/** a generated image, centred at x,y (h tall), optional glow — layerable + movable */
const Pic: React.FC<{name: string; x: number; y: number; h: number; o?: number; s?: number; sy?: number; rot?: number; glow?: string; id: string; tint?: string}> = ({name, x, y, h, o = 1, s = 1, sy = 1, rot = 0, glow, id, tint}) => {
  if (o <= 0.001 || s <= 0.001) return null;
  const w = h * (AR[name] ?? 1);
  const filt = [glow ? `drop-shadow(0 0 10px ${glow}) drop-shadow(0 0 30px ${glow}aa)` : 'drop-shadow(0 10px 8px rgba(0,0,0,0.45))', tint ?? ''].join(' ');
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s} ${s * sy})`} opacity={o} {...lb('object', id)}>
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
  const g = uid('c7glow', id);
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

/** the reference pop around a point (+ optional fade-out) */
const Pop: React.FC<{t: number; at: number; x: number; y: number; children: React.ReactNode; out?: number}> = ({t, at, x, y, children, out}) => {
  const q = popAt(t, at);
  const fo = out === undefined ? 1 : 1 - clamp01((t - out) / 0.25);
  if (q.o * fo <= 0.001) return null;
  return <g transform={`translate(${x} ${y}) scale(${q.s}) translate(${-x} ${-y})`} opacity={q.o * fo}>{children}</g>;
};

/** laugh squiggles (little curly marks) around a point, popping one by one */
const Squiggles: React.FC<{t: number; at: number; x: number; y: number; r: number; color?: string; n?: number; out?: number}> = ({t, at, x, y, r, color = '#FFFFFF', n = 4, out}) => {
  if (t < at) return null;
  const fo = out === undefined ? 1 : 1 - clamp01((t - out) / 0.25);
  if (fo <= 0) return null;
  return (
    <g opacity={fo}>
      {Array.from({length: n}, (_, i) => {
        const a = -2.5 + (i / Math.max(1, n - 1)) * 1.9 + (i % 2) * 0.12; // fan over the top of the head
        const q = popAt(t, at + i * 0.1);
        if (q.o <= 0) return null;
        const jig = Math.sin(t * 22 + i * 1.7) * 6;
        const px = x + Math.cos(a) * (r + 40 + jig), py = y + Math.sin(a) * (r + 40 + jig);
        const rot = (a * 180) / Math.PI + 90;
        return (
          <g key={i} transform={`translate(${px} ${py}) rotate(${rot}) scale(${q.s * r * 0.012})`} opacity={q.o}>
            <path d="M0 -26 C12 -18 -12 -8 0 0 C12 8 -12 18 0 26" fill="none" stroke={OUT} strokeWidth={12} strokeLinecap="round" />
            <path d="M0 -26 C12 -18 -12 -8 0 0 C12 8 -12 18 0 26" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

/** a cyan sweat drop */
const Drop: React.FC<{x: number; y: number; s?: number; o?: number}> = ({x, y, s = 1, o = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M0 -26 C10 -10 16 0 16 8 A16 16 0 0 1 -16 8 C-16 0 -10 -10 0 -26 Z" fill="#9FE6FF" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
    <ellipse cx={-5} cy={6} rx={4} ry={6} fill="#FFFFFF" opacity={0.8} />
  </g>
);

/** code-drawn gift box with a ribbon (centre bottom at 0,0; ~h tall) */
const GiftArt: React.FC<{h: number; dim: number; t: number}> = ({h, dim, t}) => {
  const k = h / 300;
  const box = lerpHex('#F5C223', '#8A8A9A', dim), lid = lerpHex('#FFD84A', '#A0A0B0', dim), rib = lerpHex('#E0313F', '#6A5A66', dim);
  const wig = Math.sin(t * 18) * 8 * (1 - dim);
  return (
    <g transform={`scale(${k})`}>
      <rect x={-120} y={-200} width={240} height={190} rx={16} fill={box} stroke={OUT} strokeWidth={10} />
      <rect x={-120} y={-200} width={70} height={190} rx={10} fill="#FFFFFF" opacity={0.14} />
      <rect x={-24} y={-200} width={48} height={190} fill={rib} stroke={OUT} strokeWidth={6} />
      <rect x={-136} y={-250} width={272} height={58} rx={14} fill={lid} stroke={OUT} strokeWidth={10} />
      <rect x={-26} y={-250} width={52} height={58} fill={rib} stroke={OUT} strokeWidth={6} />
      <g transform={`translate(0 -250) rotate(${wig})`}>
        <path d="M0 0 C-30 -60 -100 -50 -70 -10 C-55 8 -20 4 0 0 Z" fill={rib} stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
        <path d="M0 0 C30 -60 100 -50 70 -10 C55 8 20 4 0 0 Z" fill={rib} stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
        <circle cx={0} cy={-4} r={16} fill={rib} stroke={OUT} strokeWidth={7} />
      </g>
    </g>
  );
};
function lerpHex(a: string, b: string, u: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp01(u))).toString(16).padStart(2, '0')).join('');
}

/** a red ▼ coin tag */
const DownTag: React.FC<{x: number; y: number; s: number; o: number}> = ({x, y, s, o}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <circle r={34} fill="#B3122A" stroke={OUT} strokeWidth={7} />
    <circle r={24} fill="none" stroke="#FF8A96" strokeWidth={3} opacity={0.6} />
    <path d="M-14 -8 H14 L0 14 Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={4} strokeLinejoin="round" />
  </g>
);

/** a gold coin (solid or dashed ghost) */
const CoinIcon: React.FC<{x: number; y: number; r?: number; ghost?: boolean}> = ({x, y, r = 30, ghost}) =>
  ghost ? (
    <g>
      <circle cx={x} cy={y} r={r} fill="none" stroke={CYAN} strokeWidth={5} strokeDasharray="9 8" />
      <circle cx={x} cy={y} r={r * 0.62} fill="none" stroke={CYAN} strokeWidth={3} strokeDasharray="6 6" opacity={0.7} />
    </g>
  ) : (
    <g>
      <circle cx={x} cy={y} r={r} fill="#F5C223" stroke={OUT} strokeWidth={6} />
      <circle cx={x} cy={y} r={r * 0.66} fill="none" stroke="#B88308" strokeWidth={4} />
      <ellipse cx={x - r * 0.3} cy={y - r * 0.32} rx={r * 0.22} ry={r * 0.12} fill="#FFFFFF" opacity={0.7} />
    </g>
  );

// ================================================================ S2 + S3 · the board, one continuous camera
// the stairs: StairGame geometry (Arabic: rising RIGHT → LEFT from x 1660, stepW 250, h 110 + 62·i, base 836)
const ENTRIES: StairEntry[] = (BOARD.entries as {id: string; label: string; at: number; src?: string; ar?: number; glow?: string; twist?: boolean}[]).map((e) => ({
  id: e.id, label: e.label, at: e.at, src: e.src, ar: e.ar ?? 1, glow: e.glow, twist: e.twist,
}));
const SUMMIT = BOARD.summitAt as number;
const stepX = (i: number) => 1660 - 250 * i;
const stepH = (i: number) => 110 + 62 * i;
const BASE = 836;
const LOST = ENTRIES.filter((e) => !e.twist && e.at < T.s2).sort((a, b) => a.at - b.at); // the 5 steps so far
const BINANCE_AT = LOST[LOST.length - 1]?.at ?? 361.32;
const S1_WORDS: PopWord[] = [{w: 'رقم', at: 394.8}, {w: 'مرعب', at: 395.19, tone: 'gold'}, {w: 'صح؟', at: 395.68}];
const centredRight = (words: PopWord[], size: number, x = 960) => {
  const ws = words.map((w) => textWidth(w.w, size));
  const gaps = ws.slice(0, -1).reduce((s, w, i) => s + Math.max(size * 0.2, 0.085 * (w + ws[i + 1])), 0);
  return x + (ws.reduce((s, w) => s + w, 0) + gaps) / 2;
};

const boardCam = (t: number) => {
  // A = exactly where S1's board camera is (stairCamT on the newest step, slow push) → B = pulled back on every lost step
  // → C = tilted UP and over to the empty air above the top step (the ghost steps)
  const A = {cx: stepX(LOST.length - 1), sx: 1040, dy: 0, z: 1.05 * (1 + 0.0035 * Math.max(0, t - BINANCE_AT))};
  const B = {cx: 1160, sx: 1190, dy: 50, z: 0.9};
  const C = {cx: 300, sx: 1380, dy: 170, z: 0.86};
  const u1 = ease.inOut(clamp01((t - 396.1) / 0.85)), u2 = ease.inOut(clamp01((t - 398.62) / 1.05));
  const m = (k: keyof typeof A) => lerp(lerp(A[k], B[k], u1), C[k], u2);
  const z = m('z') * (1 + 0.004 * Math.max(0, t - 397.0));
  return `translate(${m('sx')} ${BASE + m('dy')}) scale(${z}) translate(${-m('cx')} ${-BASE})`;
};

const BoardWorld: React.FC<{t: number}> = ({t}) => {
  const tintGroup = LOST.map((e, i) => {
    const at = T.tint + i * 0.13; // right → left, step by step
    const p = ease.out(clamp01((t - at) / 0.3));
    if (p <= 0) return null;
    const x = stepX(i), h = stepH(i);
    cueSfx('tick', `c7-tint-${i}`, t >= at && t < at + 0.3, 960, {at, hit: 0.1, gain: 0.6});
    const q = popAt(t, at + 0.12);
    return (
      <g key={e.id}>
        <rect x={x - 116} y={BASE - h - 6} width={232} height={h + 6} rx={6} fill="#6E0A1C" opacity={0.55 * p} />
        <Glow x={x} y={BASE - h - 110} r={140} color="#FF2E4A" o={0.45 * p} id={`c7tg${i}`} />
        <DownTag x={x} y={BASE - h * 0.48} s={q.s * 1.1} o={q.o} />
      </g>
    );
  });
  // ghost steps: dashed cyan, empty, a faint shimmer — the money that did not exist yet
  const ghosts = [5, 6, 7].map((i, k) => {
    const at = T.ghost + k * 0.16;
    const g = ease.out(clamp01((t - at) / 0.5));
    if (g <= 0) return null;
    const x = stepX(i), h = stepH(i) * g;
    const sh = 0.75 + 0.25 * Math.sin(t * 4 + k * 1.3);
    return (
      <g key={i} opacity={sh}>
        <rect x={x - 112} y={BASE - h} width={224} height={h} rx={10} fill={CYAN} opacity={0.07} />
        <rect x={x - 112} y={BASE - h} width={224} height={h} rx={10} fill="none" stroke={CYAN} strokeWidth={6} strokeDasharray="20 14" strokeDashoffset={-t * 30} style={{filter: `drop-shadow(0 0 8px ${CYAN})`}} />
        <line x1={x - 100} y1={BASE - h + 22} x2={x + 100} y2={BASE - h + 22} stroke={CYAN} strokeWidth={3} strokeDasharray="10 12" opacity={0.6} />
      </g>
    );
  });
  // the dashed pill on the first ghost step
  const gp = clamp01((t - T.notYet) / 0.3);
  const gx = stepX(5), gy = BASE - stepH(5) - 70;
  const gText = 'فلوس ما كانت موجودة';
  const gw = textWidth(gText, 54) + 54 * 1.3;
  const gq = popRef(gp);
  return (
    <>
      <NightSky t={t} id="c7bs" />
      <g transform={boardCam(t)}>
        <GridFloor id="c7bf" t={t} wide />
        <StairGame t={t} id="bd39280" entries={ENTRIES} summitAt={SUMMIT} topLabel={BOARD.topLabel as string} />
        {tintGroup}
        {ghosts}
        {gp > 0 && (
          <g transform={`translate(${gx} ${gy}) scale(${gq.s}) translate(${-gx} ${-gy})`} opacity={gq.o}>
            <NPill text={gText} x={gx} y={gy} size={54} kind="cyan" id="c7gpill" />
            <rect x={gx - gw / 2 - 12} y={gy - 54 * 0.95} width={gw + 24} height={54 * 1.9} rx={54 * 0.95} fill="none" stroke={CYAN} strokeWidth={5} strokeDasharray="16 12" />
            <CoinIcon x={gx + gw / 2 + 62} y={gy} r={36} ghost />
          </g>
        )}
      </g>
      {/* S1's line leaves softly (the cut is inside the same board) */}
      <WordPop t={t} id="bd39280w" y={975} size={80} right={centredRight(S1_WORDS, 80)} words={S1_WORDS} out={396.1} />
      {/* «فلوس موجودة» under the lost steps — solid gold coin */}
      {(() => {
        const p = pp(t, T.mawjuda);
        if (p <= 0) return null;
        const f = flyOut(t, 398.62, 0, 1);
        const txt = 'فلوس موجودة', x = 1190, y = 930;
        const w = textWidth(txt, 52) + 52 * 1.3;
        const q = popRef(clamp01(p));
        return (
          <g transform={`translate(${f.dx} ${f.dy})`} opacity={f.o}>
            <NPill text={txt} x={x} y={y} size={52} kind="white" id="c7mpill" p={p} />
            <g transform={`translate(${x + w / 2 + 50} ${y}) scale(${q.s}) translate(${-(x + w / 2 + 50)} ${-y})`} opacity={q.o}>
              <CoinIcon x={x + w / 2 + 50} y={y} r={34} />
            </g>
          </g>
        );
      })()}
    </>
  );
};
// S2 · 396.02 · «بس كل اللي فات كان خسارة في فلوس موجودة»
export const S2: React.FC<{t: number}> = ({t}) => <BoardWorld t={t} />;
// S3 · 398.54 · «الحين ندخل نوع ثاني تمامًا: خسارة فلوس ما كانت موجودة لسه»
export const S3: React.FC<{t: number}> = ({t}) => <BoardWorld t={t} />;

// ================================================================ S4 · the gift on little legs
// S4 · 402.76 · «فرصة جاتك برجولها، وقلت لها لا»
export const S4: React.FC<{t: number}> = ({t}) => {
  const walkA = 402.86, walkB = 403.72;
  const x = moveTo(t, walkA, 1520, 800, walkB - walkA);
  const walking = t > walkA && t < walkB;
  const hopU = clamp01((t - T.legs) / 0.5);
  const hop = Math.sin(Math.PI * hopU) * 120;
  const bob = walking ? Math.abs(Math.sin(t * 13)) * 12 : 0;
  const dim = ease.inOut(clamp01((t - T.la - 0.05) / 0.35));
  const droop = 1 - 0.12 * dim;
  const y = 905 - hop - bob;
  const sw = walking ? Math.sin(t * 13) * 28 : hopU > 0 && hopU < 1 ? 18 : 0;
  cueSfx('pop', 'c7-gift-in', t >= walkA && t < walkA + 0.3, x, {at: walkA, gain: 0.6});
  const enter = popAt(t, walkA - 0.04);
  return (
    <>
      <NightSky t={t} id="c7s4s" />
      <GridFloor id="c7s4f" t={t} />
      <Glow x={x} y={y - 150} r={260} color={GOLD} o={0.55 * (1 - dim)} id="c7gift" />
      <ellipse cx={x} cy={912} rx={130} ry={18} fill="#000000" opacity={0.35} />
      <g transform={`translate(${x} ${y}) scale(${enter.s}) rotate(${6 * dim}) scale(1 ${droop})`} opacity={enter.o} {...lb('object', 'c7gift')}>
        {/* little legs */}
        {[-1, 1].map((side) => (
          <g key={side} transform={`rotate(${side * sw} ${side * 45} -10)`}>
            <path d={`M${side * 45} -14 V40`} stroke={OUT} strokeWidth={22} strokeLinecap="round" />
            <path d={`M${side * 45} -14 V40`} stroke="#2A2148" strokeWidth={12} strokeLinecap="round" />
            <rect x={side * 45 - 6} y={30} width={44} height={22} rx={11} fill="#FFFFFF" stroke={OUT} strokeWidth={5} />
          </g>
        ))}
        <g transform="translate(0 -6)" style={{filter: dim < 0.5 ? `drop-shadow(0 0 16px ${GOLD})` : undefined}}>
          <GiftArt h={300} dim={dim} t={t} />
        </g>
      </g>
      <Bubble t={t} at={T.la} lines={['لا']} x={700} y={300} tx={540} ty={430} size={84} mark="cross" />
    </>
  );
};

// ================================================================ S6 · the corridor in Dallas
const Suit: React.FC<{t: number; x: number; walking: boolean; glasses?: boolean; flip?: boolean; s?: number; y?: number; id: string; body?: string; pose?: 'idle' | 'point' | 'talk' | 'walk' | 'hold' | 'think'; prop?: 'briefcase' | 'none'}> = ({t, x, walking, glasses, flip, s = 1.5, y = 1000, id, body = '#2E3A5E', pose, prop = 'briefcase'}) => (
  <StoryPerson t={t} id={id} x={x} y={y} s={s} role="businessman" rim={RIM2} glasses={glasses} body={body} pose={walking ? 'walk' : pose ?? 'idle'} flip={flip} prop={prop} />
);

// S6 · 408.08 · «اثنين اسمهم ريد هاستنقز ومارك راندولف داخلين على مكتب الرئيس التنفيذي»
export const S6: React.FC<{t: number}> = ({t}) => {
  const hx = t < 410.9 ? moveTo(t, 408.12, -160, 720, 1.4) : moveTo(t, 410.9, 720, 1250, 1.6);
  const rx = t < 411.1 ? moveTo(t, 408.32, -430, 470, 1.4) : moveTo(t, 411.1, 470, 1020, 1.6);
  const hw = (t > 408.12 && t < 409.52) || (t > 410.9 && t < 412.5);
  const rw = (t > 408.32 && t < 409.72) || (t > 411.1 && t < 412.7);
  const open = ease.inOut(clamp01((t - T.door) / 0.55));
  const dx = 1480, dw = 300, dh = 640, dTop = 900 - dh;
  cueSfx('swish', 'c7-door-open', t >= T.door && t < T.door + 0.3, dx, {at: T.door, gain: 0.5});
  const namesOut = 410.75;
  return (
    <>
      <g style={{filter: 'blur(5px)'}}>
        <PlateWorld t={t} src={`${SLUG}/bg/office-2000.jpg`} id="c7s6p" at={T.s6} dur={5} look="natural" from={{x: 0.5, y: 0.5, s: 1.12}} to={{x: 0.55, y: 0.5, s: 1.18}} />
      </g>
      <rect x={0} y={0} width={W} height={H} fill="#2A1430" opacity={0.42} />
      {/* corridor: a carpet floor, a wainscot line */}
      <rect x={0} y={900} width={W} height={H - 900} fill="#4A1F26" />
      <rect x={0} y={900} width={W} height={10} fill="#2A0F14" />
      <path d={`M0 1080 L520 900 M1920 1080 L1400 900`} stroke="#2A0F14" strokeWidth={4} opacity={0.5} />
      {/* the CEO's door: light spills out as it opens */}
      <g {...lb('object', 'c7door')}>
        <rect x={dx - dw / 2 - 26} y={dTop - 26} width={dw + 52} height={dh + 26} rx={8} fill="#3A2414" stroke={OUT} strokeWidth={9} />
        <rect x={dx - dw / 2} y={dTop} width={dw} height={dh} fill="#FFE6B0" />
        <Glow x={dx} y={dTop + dh * 0.5} r={260} ry={360} color="#FFE2A8" o={open} id="c7dlight" />
        {open > 0.02 && <path d={`M${dx - dw / 2} 900 L${dx + dw / 2} 900 L${dx + dw / 2 + 120} ${H} L${dx - dw / 2 - 420} ${H} Z`} fill="#FFE2A8" opacity={0.28 * open} />}
        <g transform={`translate(${dx + dw / 2} 0) scale(${1 - 0.82 * open} 1) translate(${-(dx + dw / 2)} 0)`}>
          <rect x={dx - dw / 2} y={dTop} width={dw} height={dh} fill="#7A4A26" stroke={OUT} strokeWidth={8} />
          <rect x={dx - dw / 2 + 36} y={dTop + 40} width={dw - 72} height={dh * 0.38} rx={8} fill="#6A3E1E" stroke={OUT} strokeWidth={5} />
          <rect x={dx - dw / 2 + 36} y={dTop + 60 + dh * 0.38} width={dw - 72} height={dh * 0.42} rx={8} fill="#6A3E1E" stroke={OUT} strokeWidth={5} />
          <circle cx={dx - dw / 2 + 40} cy={dTop + dh * 0.52} r={14} fill={GOLD} stroke={OUT} strokeWidth={4} />
        </g>
      </g>
      <Pop t={t} at={410.3} x={dx} y={dTop - 70}>
        <NPill text="الرئيس التنفيذي" x={dx} y={dTop - 70} size={44} kind="gold" id="c7plate" />
      </Pop>
      {/* the two: Randolph (glasses) behind, Hastings in front */}
      <Suit t={t} x={rx} walking={rw} glasses id="c7rand" body="#3A3466" />
      <Suit t={t} x={hx} walking={hw} id="c7reed" />
      {(() => {
        const f = flyOut(t, namesOut, 0, -1);
        return (
          <g transform={`translate(${f.dx} ${f.dy})`} opacity={f.o}>
            <NPill text="ريد هاستنقز" x={hx} y={330} size={50} kind="white" id="c7n1" p={pp(t, T.reed - 0.08)} />
            <NPill text="مارك راندولف" x={rx} y={250} size={50} kind="white" id="c7n2" p={pp(t, T.marc - 0.08)} />
          </g>
        );
      })()}
    </>
  );
};

// ================================================================ S8 · the little red envelope
const MAIL0: [number, number] = [860, 520];
const HOUSE: [number, number] = [330, 600];
const bez = (u: number, a: [number, number], c: [number, number], b: [number, number]): [number, number] => [
  (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0],
  (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1],
];
const ROUTE_C: [number, number] = [600, 230];
// S8 · 415.98 · «شركتهم الصغيرة اسمها نتفليكس، ترسل الأفلام للناس بالبريد، ووضعها صعب»
export const S8: React.FC<{t: number}> = ({t}) => {
  const [sx, sy] = move(t, 416.0, [960, 560], [1600, 640], 0.75);
  const sh = lerp(430, 270, ease.inOut(clamp01((t - 416.0) / 0.75)));
  const go = ease.inOut(clamp01((t - T.mail) / 0.6)), back = ease.inOut(clamp01((t - 420.02) / 0.5));
  const u = go * (1 - back);
  const [mx, my] = bez(u, MAIL0, ROUTE_C, [HOUSE[0] + 70, HOUSE[1] + 10]);
  const ms = 1 - 0.5 * u;
  const wob = t > T.hard ? Math.sin((t - T.hard) * 16) * 7 * Math.exp(-(t - T.hard) * 1.5) : 0;
  const rain = clamp01((t - T.hard) / 0.3);
  cueSfx('whoosh', 'c7-mail-back', t >= 420.02 && t < 420.3, mx, {at: 420.02, hit: 0.25, gain: 0.6});
  return (
    <>
      <NightSky t={t} id="c7s8s" />
      <GridFloor id="c7s8f" t={t} />
      <Pic name="rental-store-blank" x={sx} y={sy} h={sh} id="c7s8store" o={1 - 0.35 * clamp01((t - 416.3) / 0.5)} />
      <Pop t={t} at={418.9} x={HOUSE[0]} y={HOUSE[1]}>
        <Pic name="small-house" x={HOUSE[0]} y={HOUSE[1]} h={280} id="c7house" glow="#FFE2A8" />
      </Pop>
      <Route d={`M${MAIL0[0]} ${MAIL0[1]} Q${ROUTE_C[0]} ${ROUTE_C[1]} ${HOUSE[0] + 70} ${HOUSE[1] + 10}`} p={ease.out(clamp01((t - 419.05) / 0.45))} id="c7route" color={RED} />
      <g transform={`rotate(${wob} ${mx} ${my + 100})`}>
        <HeroObject t={t} at={416.3} src={art('dvd-mailer')} ar={AR['dvd-mailer']} x={mx} y={my} h={240 * ms} glow="#FF4A5A" id="c7s8mail" sparkles={3} />
      </g>
      <NPill text="نتفليكس" x={MAIL0[0]} y={730} size={56} kind="red" id="c7s8n" p={pp(t, T.netflix - 0.1)} />
      {rain > 0 && (
        <g opacity={rain}>
          {Array.from({length: 12}, (_, i) => {
            const rx = MAIL0[0] - 150 + rand(i * 3 + 1) * 300;
            const ry = 260 + ((t * 700 + rand(i * 7) * 300) % 300);
            return <line key={i} x1={rx} y1={ry} x2={rx - 8} y2={ry + 34} stroke="#9FC4FF" strokeWidth={6} strokeLinecap="round" opacity={0.75} />;
          })}
          <Pop t={t} at={T.hard} x={MAIL0[0]} y={220}>
            <g transform={`translate(${MAIL0[0]} 220)`}>
              <path d="M-170 40 Q-180 -20 -110 -30 Q-90 -100 -10 -90 Q50 -130 100 -60 Q180 -60 170 20 Q170 50 130 50 H-140 Q-170 50 -170 40 Z" fill="#5A5F78" stroke={OUT} strokeWidth={9} strokeLinejoin="round" />
              <path d="M-120 -10 Q-100 -60 -40 -60" fill="none" stroke="#8C92AE" strokeWidth={10} strokeLinecap="round" />
            </g>
          </Pop>
        </g>
      )}
    </>
  );
};

// ================================================================ S9 · the red line
const LOSS_PTS: [number, number][] = [[420, 340], [560, 380], [660, 360], [780, 470], [880, 450], [1000, 560], [1110, 540], [1230, 660], [1340, 640], [1460, 760], [1580, 740], [1700, 850]];
const LOSS_D = 'M' + LOSS_PTS.map((p) => p.join(' ')).join(' L');
// S9 · 420.96 · «كانت على طريق إنها تخسر 50 مليون دولار في نفس السنة»
export const S9: React.FC<{t: number}> = ({t}) => {
  const p = ease.inOut(clamp01((t - 421.05) / 1.6));
  const head = (() => {
    const n = LOSS_PTS.length - 1, f = p * n, i = Math.min(n - 1, Math.floor(f)), k = f - i;
    return [lerp(LOSS_PTS[i][0], LOSS_PTS[i + 1][0], k), lerp(LOSS_PTS[i][1], LOSS_PTS[i + 1][1], k)];
  })();
  cueSfx('fall', 'c7-line', t >= 421.05 && t < 421.3, 960, {at: 421.05, gain: 0.5});
  const val = '50 مليون $';
  const nw = textWidth(val, 170);
  const tri = popAt(t, T.dollar);
  return (
    <>
      <NightSky t={t} id="c7s9s" />
      <g opacity={0.18} stroke="#C9B8FF" strokeWidth={2}>
        {[300, 450, 600, 750, 900].map((y) => <line key={y} x1={380} y1={y} x2={1760} y2={y} />)}
        {[420, 700, 980, 1260, 1540].map((x) => <line key={x} x1={x} y1={280} x2={x} y2={900} />)}
      </g>
      <path d={LOSS_D} fill="none" stroke={RED} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} style={{filter: `drop-shadow(0 0 12px ${RED})`}} opacity={0.9} />
      {p > 0 && p < 1 && <circle cx={head[0]} cy={head[1]} r={16} fill="#FFFFFF" style={{filter: `drop-shadow(0 0 12px ${RED})`}} />}
      <Pic name="dvd-mailer" x={300} y={360} h={190} id="c7s9mail" glow="#FF4A5A" rot={-6} />
      <CountNumber t={t} at={T.fifty} value={val} x={1040} y={520} size={170} tone="red" id="c7s9n" dur={1.12} />
      {tri.o > 0 && (
        <g transform={`translate(${1040 - nw / 2 - 90} 520) scale(${tri.s})`} opacity={tri.o}>
          <path d="M-50 -34 H50 L0 46 Z" fill={RED} stroke={OUT} strokeWidth={9} strokeLinejoin="round" style={{filter: `drop-shadow(0 0 10px ${RED})`}} />
        </g>
      )}
      <NPill text="نفس السنة" x={1040} y={710} size={52} kind="grey" id="c7s9y" p={pp(t, T.sameYear - 0.1)} />
    </>
  );
};

// ================================================================ S10 · ×100
// S10 · 425.14 · «وبلوكباستر أكبر منهم تقريبًا 100 مرة»
export const S10: React.FC<{t: number}> = ({t}) => {
  const g1 = ease.out(clamp01((t - 425.2) / 0.5)), g2 = ease.out(clamp01((t - 425.3) / 0.5));
  cueSfx('thump', 'c7-pods', t >= 425.2 && t < 425.5, 960, {at: 425.2, hit: 0.3, gain: 0.7});
  const br = ease.inOut(clamp01((t - T.bigger) / 0.55));
  const mTop = 836 - 90 * g1 - 150, sTop = 836 - 200 * g2 - 470;
  const ax = 860;
  const sl = clamp01((t - T.hundred) / 0.165);
  const q = pressIn(sl);
  return (
    <>
      <NightSky t={t} id="c7s10s" />
      <GridFloor id="c7s10f" t={t} />
      <Podium x={500} base={836} w={220} h={Math.max(1, 90 * g1)} id="c7p1" color="red" />
      <Podium x={1340} base={836} w={600} h={Math.max(1, 200 * g2)} id="c7p2" color="green" />
      <HeroObject t={t} at={425.4} src={art('dvd-mailer')} ar={AR['dvd-mailer']} x={500} y={836 - 90 * g1 - 80} h={150} glow="#FF4A5A" id="c7s10m" sparkles={2} />
      <HeroObject t={t} at={425.5} src={art('rental-store-blank')} ar={AR['rental-store-blank']} x={1340} y={836 - 200 * g2 - 240} h={470} glow={GOLD} id="c7s10st" />
      {br > 0 && (
        <g stroke={GOLD} strokeWidth={6} fill="none" strokeLinecap="round" style={{filter: `drop-shadow(0 0 8px ${GOLD})`}}>
          <line x1={600} y1={mTop + 10} x2={lerp(600, 1090, br)} y2={mTop + 10} strokeDasharray="18 14" />
          <line x1={1090} y1={sTop + 20} x2={lerp(1090, 600, br)} y2={sTop + 20} strokeDasharray="18 14" />
          <line x1={ax} y1={mTop + 10} x2={ax} y2={lerp(mTop + 10, sTop + 20, br)} strokeWidth={8} />
          {br > 0.9 && <path d={`M${ax - 22} ${sTop + 48} L${ax} ${sTop + 20} L${ax + 22} ${sTop + 48}`} strokeWidth={8} />}
          <path d={`M${ax - 22} ${mTop - 18} L${ax} ${mTop + 10} L${ax + 22} ${mTop - 18}`} strokeWidth={8} />
        </g>
      )}
      {sl > 0 && (
        <g transform={`translate(600 360) scale(${q.s})`} opacity={q.o}>
          <GlowText text="×100" x={0} y={0} size={180} tone="gold" id="c7x100" />
        </g>
      )}
      <Flash t={t} at={T.hundred + 0.05} strength={0.3} />
      <NPill text="نتفليكس" x={500} y={895} size={44} kind="red" id="c7s10a" p={pp(t, 425.7)} />
      <NPill text="بلوكباستر" x={1340} y={895} size={44} kind="white" id="c7s10b" p={pp(t, 425.8)} />
    </>
  );
};

// ================================================================ S11–S13 · the CEO's office (one world, three framings)
const CEO = {x: 1520, y: 1010, s: 1.35};
const ceoHead = {x: CEO.x, y: CEO.y - 330 * CEO.s};
const Desk: React.FC = () => (
  <g {...lb('object', 'c7desk')}>
    <rect x={1170} y={770} width={680} height={40} rx={10} fill="#7A4524" stroke={OUT} strokeWidth={9} />
    <rect x={1200} y={806} width={620} height={280} fill="#5A3018" stroke={OUT} strokeWidth={9} />
    <rect x={1240} y={840} width={250} height={150} rx={8} fill="#4C2812" stroke={OUT} strokeWidth={5} />
    <rect x={1530} y={840} width={250} height={150} rx={8} fill="#4C2812" stroke={OUT} strokeWidth={5} />
    <rect x={1180} y={776} width={660} height={8} rx={4} fill="#FFFFFF" opacity={0.18} />
    {/* a desk lamp */}
    <path d="M1760 770 V700 L1720 650" stroke={OUT} strokeWidth={14} fill="none" strokeLinecap="round" />
    <path d="M1760 770 V700 L1720 650" stroke="#C9A24A" strokeWidth={7} fill="none" strokeLinecap="round" />
    <path d="M1660 660 L1740 610 L1770 660 Z" fill="#2E5A3A" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
  </g>
);
const FlipChart: React.FC<{t: number; x: number}> = ({t, x}) => {
  const d = ease.inOut(clamp01((t - T.idea) / 0.9));
  return (
    <g {...lb('object', 'c7chart')}>
      <path d={`M${x - 130} 1010 L${x - 40} 300 M${x + 130} 1010 L${x + 40} 300 M${x} 1000 L${x} 700`} stroke={OUT} strokeWidth={16} strokeLinecap="round" />
      <path d={`M${x - 130} 1010 L${x - 40} 300 M${x + 130} 1010 L${x + 40} 300`} stroke="#8A5A32" strokeWidth={8} strokeLinecap="round" />
      <rect x={x - 180} y={290} width={360} height={420} rx={8} fill="#F4F1EA" stroke={OUT} strokeWidth={8} />
      <rect x={x - 190} y={278} width={380} height={30} rx={8} fill="#4A3A2A" stroke={OUT} strokeWidth={6} />
      <g fill="none" stroke="#C2272D" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
        {/* envelope (right) → house (left): the mail goes home */}
        <path d={`M${x + 50} 440 H${x + 150} V510 H${x + 50} Z M${x + 50} 440 L${x + 100} 480 L${x + 150} 440`} pathLength={1} strokeDasharray={`${clamp01(d * 2.2)} 1`} />
        <path d={`M${x + 35} 560 H${x - 40} M${x - 10} 535 L${x - 40} 560 L${x - 10} 585`} pathLength={1} strokeDasharray={`${clamp01(d * 2.2 - 0.8)} 1`} />
        <path d={`M${x - 150} 470 L${x - 105} 430 L${x - 60} 470 V530 H${x - 150} Z M${x - 118} 530 V495 H${x - 92} V530`} stroke="#2F4C8C" pathLength={1} strokeDasharray={`${clamp01(d * 2.2 - 1.2)} 1`} />
      </g>
    </g>
  );
};
type Phase = 's11' | 's12' | 's13';
const OfficeWorld: React.FC<{t: number; phase: Phase}> = ({t, phase}) => {
  // CEO: listens → leans back, hands together → nods → (S13) holds in a laugh
  const lean = phase === 's11' ? 4 * ease.inOut(clamp01((t - T.listen) / 0.4)) : 3;
  const nod = phase === 's11' && t > T.nod && t < T.nod + 0.7 ? Math.sin(((t - T.nod) / 0.35) * Math.PI) ** 2 * 10 : 0;
  const amp = phase === 's13' ? 7 * ease.inOut(clamp01((t - T.tries) / 1.0)) + 3 * ease.inOut(clamp01((t - T.laugh) / 0.6)) - 10 * ease.inOut(clamp01((t - 441.7) / 0.3)) : 0;
  const shx = Math.sin(t * 57) * amp * 0.5, shy = Math.sin(t * 46 + 1) * amp;
  const ceoPose = phase === 's13' && t >= T.holds ? 'think' : phase === 's11' && t < T.listen ? 'idle' : 'hold';
  const puff = phase === 's13' ? ease.out(clamp01((t - T.laugh) / 0.5)) * (1 - ease.inOut(clamp01((t - 441.6) / 0.4))) : 0;
  // visitors: S11 at the flip chart · S12/S13 at the desk · S13 end: they turn and walk out
  const s11 = phase === 's11';
  const outW = phase === 's13' ? 440.75 : 1e9;
  const hX = s11 ? 470 : moveTo(t, outW, 600, -260, 2.0);
  const rX = s11 ? 250 : moveTo(t, outW + 0.15, 830, -40, 2.0);
  const leaving = t > outW;
  const walkH = leaving && t < outW + 2.0, walkR = leaving && t < outW + 2.15;
  const hx = ceoHead.x + shx, hy = ceoHead.y + shy;
  const r = 78 * CEO.s;
  return (
    <>
      <RoomWorld t={t} id="c7room" winX={1370} winY={95} />
      {s11 && <FlipChart t={t} x={760} />}
      <Suit t={t} x={rX} walking={walkR} glasses flip={leaving} s={1.3} y={1010} id="c7orand" body="#3A3466" prop="none" pose={s11 ? 'idle' : 'idle'} />
      <Suit t={t} x={hX} walking={walkH} flip={leaving} s={1.3} y={1010} id="c7oreed" prop="none" pose={s11 && t > T.idea - 0.1 ? 'point' : 'talk'} />
      <g transform={`translate(${shx} ${shy - nod * 0.3}) rotate(${lean} ${CEO.x} ${CEO.y - 120}) translate(0 ${nod})`}>
        <StoryPerson t={t} id="c7ceo" x={CEO.x} y={CEO.y} s={CEO.s} role="businessman" tieColor={GOLD} prop="none" flip pose={ceoPose} />
        {puff > 0.01 && (
          <g>
            {/* the swollen head: cheeks puff, a red flush — about to burst */}
            <ellipse cx={ceoHead.x} cy={ceoHead.y + 6} rx={r * (1 + 0.16 * puff)} ry={r * (1 + 0.07 * puff)} fill={SKIN} stroke={GOLD} strokeWidth={8} />
            <ellipse cx={ceoHead.x - r * 0.55} cy={ceoHead.y + r * 0.35} rx={r * 0.32 * puff} ry={r * 0.22 * puff} fill="#E0314A" opacity={0.45} />
            <ellipse cx={ceoHead.x + r * 0.45} cy={ceoHead.y + r * 0.35} rx={r * 0.28 * puff} ry={r * 0.2 * puff} fill="#E0314A" opacity={0.35} />
            <circle cx={ceoHead.x - 38 * CEO.s} cy={CEO.y - 253.6 * CEO.s} r={20 * CEO.s} fill={SKIN} stroke={GOLD} strokeWidth={5} />
          </g>
        )}
      </g>
      <Desk />
      {phase === 's13' && (
        <>
          <Squiggles t={t} at={T.holds + 0.05} x={hx} y={hy} r={r} n={5} out={441.6} />
          {[0, 1].map((i) => {
            const at = T.holds + 0.25 + i * 0.3;
            const u = clamp01((t - at) / 1.6);
            if (t < at || t > 441.6) return null;
            const q = popAt(t, at);
            return <Drop key={i} x={hx + (i ? -1 : 1) * r * 1.08} y={hy - r * 0.2 + u * 40} s={q.s * 0.9} o={q.o} />;
          })}
        </>
      )}
    </>
  );
};
const camT = (cx: number, cy: number, z: number) => `translate(960 540) scale(${z}) translate(${-cx} ${-cy})`;

// S11 · 428.20 · «يعرضون الفكرة، والرئيس التنفيذي يسمع، ويهز راسه»
export const S11: React.FC<{t: number}> = ({t}) => {
  cueSfx('pop', 'c7-chart', t >= T.idea && t < T.idea + 0.3, 760, {at: T.idea, gain: 0.5});
  return <OfficeWorld t={t} phase="s11" />;
};

// S12 · 431.80 · «ويسأل: طيب كم تبون عشان نشتريكم؟ قالوا: 50 مليون»
export const S12: React.FC<{t: number}> = ({t}) => {
  const z = 1.28, cx = 1110, cy = 600;
  const sx = (x: number) => 960 + (x - cx) * z, sy = (y: number) => 540 + (y - cy) * z;
  const tagP = clamp01((t - 435.0) / 0.3);
  const drop = (1 - ease.out(clamp01((t - 435.0) / 0.3))) * -70;
  return (
    <>
      <g transform={camT(cx, cy, z)}>
        <OfficeWorld t={t} phase="s12" />
      </g>
      <PriceTag text="50 مليون $" x={sx(1330)} y={sy(742) + drop} size={50} color={GOLD} p={tagP} />
      <Bubble t={t} at={T.howMuch} lines={['طيب كم تبون؟']} x={1300} y={200} tx={sx(ceoHead.x - 90)} ty={sy(ceoHead.y + 20)} size={66} out={T.said} />
      <Bubble t={t} at={T.fiftyM} lines={['50 مليون']} x={760} y={200} tx={sx(830 + 60)} ty={sy(ceoHead.y + 20)} size={72} />
    </>
  );
};

// S13 · 436.18 · ★ «وراندولف يقول إنه شاف الرجال يحاول يمسك نفسه لا يضحك. وانتهى الاجتماع، والجواب: لا»
export const S13: React.FC<{t: number}> = ({t}) => {
  // close on the CEO, a slow push to his head → at «وانتهى الاجتماع» pull back to the two-shot as the two walk out
  const push = ease.inOut(clamp01((t - T.s13) / (T.over - T.s13)));
  const back = ease.inOut(clamp01((t - T.over) / 0.85));
  const z = lerp(lerp(1.95, 2.25, push), 1.18, back);
  const cx = lerp(lerp(1440, 1500, push), 1080, back), cy = lerp(lerp(650, 590, push), 590, back);
  const sx = (x: number) => 960 + (x - cx) * z, sy = (y: number) => 540 + (y - cy) * z;
  return (
    <>
      <g transform={camT(cx, cy, z)}>
        <OfficeWorld t={t} phase="s13" />
        <PriceTag text="50 مليون $" x={1330} y={742} size={44} color={GOLD} p={1} />
      </g>
      {(() => {
        const f = flyOut(t, T.over, 0, -1);
        return (
          <g transform={`translate(${f.dx} ${f.dy})`} opacity={f.o}>
            <NPill text="راندولف يقول:" x={1460} y={150} size={48} kind="grey" id="c7s13r" p={pp(t, T.randolph - 0.1)} />
          </g>
        );
      })()}
      <Stamp t={t} at={T.no - 0.08} text="لا" x={sx(1330)} y={sy(742) - 30} size={210} rot={-10} color={RED} />
      {t >= T.no + 0.05 && (() => { const q = popAt(t, T.no + 0.05); return <g transform={`translate(${sx(1330) + 210} ${sy(742) - 120}) scale(${q.s})`} opacity={q.o}><Mark kind="cross" x={0} y={0} r={52} /></g>; })()}
    </>
  );
};

// ================================================================ S14 · the dot-com bubble
const RISE_PTS: [number, number][] = [[240, 860], [380, 820], [500, 780], [620, 700], [740, 650], [860, 560], [980, 520], [1100, 430], [1200, 390]];
const CRASH_PTS: [number, number][] = [[1200, 390], [1260, 520], [1310, 480], [1370, 700], [1420, 660], [1480, 880]];
const BUB = {x: 800, y: 420, r: 250};
// S14 · 442.16 · «وللأمانة، وقتها كان عنده منطق. فقاعة الإنترنت كانت تنفجر، ونتفليكس شركة تخسر»
export const S14: React.FC<{t: number}> = ({t}) => {
  const rise = ease.inOut(clamp01((t - 442.2) / 1.3));
  const crash = ease.in(clamp01((t - T.burst - 0.05) / 0.7));
  const alive = t < T.burst;
  const fl = Math.sin(t * 1.6) * 12;
  const tiles = [[-120, -90], [10, -110], [120, -60], [-150, 30], [-30, 20], [100, 70], [-60, 130]] as [number, number][];
  const pop = clamp01((t - T.burst) / 0.5);
  cueSfx('fall', 'c7-crash', t >= T.burst + 0.05 && t < T.burst + 0.3, 1300, {at: T.burst + 0.05, gain: 0.6});
  const g = uid('c7bub', 'b');
  return (
    <>
      <NightSky t={t} id="c7s14s" />
      <g opacity={0.16} stroke="#C9B8FF" strokeWidth={2}>
        {[400, 560, 720, 880].map((y) => <line key={y} x1={200} y1={y} x2={1520} y2={y} />)}
      </g>
      <line x1={200} y1={900} x2={1520} y2={900} stroke="#C9B8FF" strokeWidth={5} opacity={0.5} />
      <path d={'M' + RISE_PTS.map((p) => p.join(' ')).join(' L')} fill="none" stroke={t < T.burst ? '#2EE88B' : '#2EE88B'} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${rise} 1`} style={{filter: 'drop-shadow(0 0 10px #2EE88B)'}} />
      {crash > 0 && <path d={'M' + CRASH_PTS.map((p) => p.join(' ')).join(' L')} fill="none" stroke={RED} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${crash} 1`} style={{filter: `drop-shadow(0 0 12px ${RED})`}} />}
      {/* the soap bubble with glowing website tiles inside */}
      {alive && (
        <Pop t={t} at={442.35} x={BUB.x} y={BUB.y + fl}>
          <g transform={`translate(${BUB.x} ${BUB.y + fl}) scale(${1 + 0.04 * clamp01((t - 445.6) / 0.5) + 0.02 * Math.sin(t * 9) * clamp01((t - 445.6) / 0.3)})`} {...lb('object', 'c7bubble')}>
            <defs>
              <radialGradient id={g} cx="0.4" cy="0.35" r="0.7">
                <stop offset="0.6" stopColor="#9FE6FF" stopOpacity={0.05} />
                <stop offset="0.88" stopColor="#C9A2FF" stopOpacity={0.28} />
                <stop offset="1" stopColor="#FF9FD8" stopOpacity={0.55} />
              </radialGradient>
            </defs>
            {tiles.map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y + Math.sin(t * 2 + i) * 6})`}>
                <rect x={-46} y={-32} width={92} height={64} rx={10} fill="#1E2B6A" stroke="#7FD8FF" strokeWidth={4} style={{filter: 'drop-shadow(0 0 8px #5CF2FF)'}} />
                <rect x={-34} y={-20} width={44} height={8} rx={4} fill="#7FD8FF" opacity={0.8} />
                <rect x={-34} y={-4} width={64} height={6} rx={3} fill="#FFFFFF" opacity={0.5} />
                <rect x={-34} y={10} width={30} height={6} rx={3} fill="#FFC928" opacity={0.8} />
              </g>
            ))}
            <circle r={BUB.r} fill={`url(#${g})`} stroke="#E8F6FF" strokeWidth={5} opacity={0.95} />
            <path d={`M${-BUB.r * 0.62} ${-BUB.r * 0.42} A${BUB.r * 0.78} ${BUB.r * 0.78} 0 0 1 ${-BUB.r * 0.1} ${-BUB.r * 0.78}`} fill="none" stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" opacity={0.75} />
            <circle cx={BUB.r * 0.55} cy={BUB.r * 0.5} r={14} fill="#FFFFFF" opacity={0.5} />
          </g>
        </Pop>
      )}
      {/* POP: droplets fly out, the tiles fall */}
      {!alive && pop < 1 && (
        <g>
          {Array.from({length: 16}, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const d = BUB.r * (0.9 + 0.7 * ease.out(pop));
            return <circle key={i} cx={BUB.x + Math.cos(a) * d} cy={BUB.y + Math.sin(a) * d + pop * pop * 120} r={10 * (1 - pop) + 2} fill="#BFF3FF" opacity={1 - pop} />;
          })}
        </g>
      )}
      {!alive && (
        <g>
          {tiles.map(([x, y], i) => {
            const u = t - T.burst;
            const fy = y + 420 * u * u + 60 * u;
            if (BUB.y + fy > 1150) return null;
            return (
              <g key={i} transform={`translate(${BUB.x + x + (x / 3) * u} ${BUB.y + fy}) rotate(${(i % 2 ? 1 : -1) * u * 120})`} opacity={clamp01(1.4 - u)}>
                <rect x={-46} y={-32} width={92} height={64} rx={10} fill="#3A2A4A" stroke="#7A6A8A" strokeWidth={4} />
              </g>
            );
          })}
        </g>
      )}
      <Flash t={t} at={T.burst} strength={0.3} />
      <MarkPill t={t} at={T.logic - 0.1} text="وقتها كان عنده منطق" x={760} y={120} mark="check" size={50} id="c7s14ok" />
      {alive && <NPill text="فقاعة الإنترنت" x={BUB.x} y={BUB.y - BUB.r - 10 + fl} size={52} kind="white" id="c7s14b" p={pp(t, T.bubble - 0.1)} />}
      {/* Netflix: a company losing money */}
      {(() => {
        const mx = moveTo(t, T.losing - 0.1, -200, 330, 0.6);
        if (t < T.losing - 0.1) return null;
        return (
          <g>
            <Pic name="dvd-mailer" x={mx} y={700} h={210} id="c7s14m" glow="#FF4A5A" rot={-5} />
            <NPill text="تخسر ▼" x={mx} y={870} size={50} kind="red" id="c7s14l" p={pp(t, T.losing + 0.25)} />
          </g>
        );
      })()}
    </>
  );
};

// ================================================================ S15 · who laughs last
// S15 · 448.36 · «بس الفكرة إن اللي يضحك أخيرًا هو اللي يضحك صح»
export const S15: React.FC<{t: number}> = ({t}) => {
  const lift = ease.inOut(clamp01((t - T.right) / 0.5));
  const flick = t > T.right ? (Math.sin(t * 60) > 0.2 ? 1 : 0.45) : 1;
  const mailY = 640 - 50 * lift;
  return (
    <>
      <NightCity t={t} id="c7s15c" />
      <rect x={0} y={0} width={W} height={H} fill="#0B0626" opacity={0.25} />
      <YearBadge t={t} at={T.fikra} year={2026} from={2000} x={960} y={170} id="c7s15y" size={110} />
      <Glow x={460} y={mailY} r={220} color="#FF4A5A" o={0.35 + 0.5 * lift} id="c7s15g" />
      <Pic name="dvd-mailer" x={460} y={mailY} h={230 * (1 + 0.15 * lift)} id="c7s15m" glow="#FF4A5A" />
      <g opacity={flick}>
        <Pic name="rental-store-blank" x={1150} y={720} h={420} id="c7s15st" glow={GOLD} />
      </g>
      {t > T.right && <rect x={930} y={500} width={440} height={430} fill="#05010F" opacity={(1 - flick) * 0.5} />}
      <Squiggles t={t} at={T.lastLaugh} x={460} y={mailY} r={130} color={GOLD} n={4} />
    </>
  );
};

// ================================================================ S16 · ★ the time-lapse: tower up, one store left
const TOWER = {x: 1330, base: 900, h: 1050};
const STORE = {x: 2260, base: 900, h: 330};
const Skyline: React.FC<{t: number; dim: number}> = ({t, dim}) => (
  <g>
    {Array.from({length: 22}, (_, i) => {
      const x = -700 + i * 170 + rand(i * 3) * 40, w = 120 + rand(i * 5) * 70, h = 220 + rand(i * 7) * 380;
      return (
        <g key={i}>
          <rect x={x} y={TOWER.base - h} width={w} height={h} fill="#232867" />
          {Array.from({length: Math.floor(h / 60)}, (_, r) =>
            [0, 1].map((c) => {
              const lit = rand(i * 31 + r * 7 + c) > 0.4;
              return lit ? <rect key={`${r}-${c}`} x={x + 22 + c * (w / 2)} y={TOWER.base - h + 24 + r * 60} width={w / 4} height={26} rx={3} fill="#E9CF7C" opacity={0.55 * (1 - dim) + 0.15 * Math.sin(t + i + r)} /> : null;
            })
          )}
        </g>
      );
    })}
    <rect x={-1500} y={TOWER.base} width={5000} height={700} fill="#0E1030" />
    <rect x={-1500} y={TOWER.base} width={5000} height={6} fill="#7A5CFF" opacity={0.6} />
  </g>
);
// S16 · 451.16 · «اليوم نتفليكس قيمتها تقريبًا 300 مليار دولار. وبلوكباستر؟ ما بقى منها إلا فرع واحد … عشان الذكريات»
export const S16: React.FC<{t: number}> = ({t}) => {
  // camera: on the mailer → tilt UP with the rising tower → pan right and down to the last store (tower top stays top-left)
  const up = ease.inOut(clamp01((t - 451.55) / 1.5));
  const pan = ease.inOut(clamp01((t - (T.bb + 0.1)) / 1.2));
  const cx = lerp(lerp(1330, 1360, up), 1560, pan), cy = lerp(lerp(640, 330, up), 420, pan);
  const z = lerp(lerp(1.0, 0.85, up), 0.8, pan) * (1 + 0.003 * Math.max(0, t - 455.9));
  const sx = (x: number) => 960 + (x - cx) * z, sy = (y: number) => 540 + (y - cy) * z;
  const rise = ease.inOut(clamp01((t - 451.6) / 1.4));
  const mailO = 1 - clamp01((t - 451.6) / 0.35);
  const clip = uid('c7tw', 'clip');
  // the number moves up-right of the tower top while the camera pans
  const [nx, ny] = move(t, T.bb + 0.1, [1560, 300], [1330, 150], 1.2);
  const nS = lerp(1, 0.78, ease.inOut(clamp01((t - (T.bb + 0.1)) / 1.2)));
  const spot = ease.out(clamp01((t - T.oneStore + 0.1) / 0.4));
  const storeS = popAt(t, T.oneStore - 0.05);
  return (
    <>
      <NightSky t={t} id="c7s16s" />
      <g transform={camT(cx, cy, z)}>
        <Skyline t={t} dim={pan} />
        {/* the tower rises out of the floor */}
        <defs>
          <clipPath id={clip}><rect x={-1000} y={-2000} width={5000} height={2000 + TOWER.base + 4} /></clipPath>
        </defs>
        <Glow x={TOWER.x} y={TOWER.base - TOWER.h * 0.5 * rise} r={420} ry={TOWER.h * 0.6 * rise + 50} color="#FF3048" o={0.45 * rise} id="c7twg" />
        <g clipPath={`url(#${clip})`}>
          <g transform={`translate(0 ${(1 - rise) * TOWER.h})`}>
            <Pic name="netflix-tower" x={TOWER.x} y={TOWER.base - TOWER.h / 2} h={TOWER.h} id="c7tower" glow="#FF3048" />
          </g>
        </g>
        <Pic name="dvd-mailer" x={TOWER.x} y={TOWER.base - 100} h={180} id="c7s16m" glow="#FF4A5A" o={mailO} s={1 + 0.3 * (1 - mailO)} />
        <RevealRing t={t} at={451.62} x={TOWER.x} y={TOWER.base - 120} r={300} color="#FF6A7A" boom={false} />
        {/* the last store under a spotlight + the visitors */}
        {t > T.oneStore - 0.2 && (
          <g>
            <Spotlight x={STORE.x} y={STORE.base} top={-200} w={640} id="c7spot" o={spot} />
            <g transform={`translate(${STORE.x} ${STORE.base}) scale(${storeS.s}) translate(${-STORE.x} ${-STORE.base})`} opacity={storeS.o}>
              <Pic name="rental-store-blank" x={STORE.x} y={STORE.base - STORE.h / 2} h={STORE.h} id="c7s16st" glow={GOLD} />
            </g>
            {[{x: STORE.x - 300, f: false, role: 'man' as const}, {x: STORE.x + 250, f: true, role: 'woman' as const}, {x: STORE.x + 370, f: true, role: 'man' as const}].map((p, i) => {
              const at = T.visit - 0.6 + i * 0.12;
              const q = popAt(t, at - 0.8);
              const up2 = t >= T.visit + i * 0.15;
              const fl = t >= T.visit + i * 0.3 && t < T.visit + i * 0.3 + 0.18;
              return (
                <g key={i} opacity={q.o}>
                  <StoryPerson t={t} id={`c7tour${i}`} x={p.x} y={STORE.base + 10} s={0.62} role={p.role} body={['#3B82F6', '#C0587E', '#22A06B'][i]} prop={up2 ? 'phone' : 'none'} pose={up2 ? 'up' : 'idle'} flip={p.f} />
                  {fl && <circle cx={p.x + (p.f ? -1 : 1) * 37} cy={STORE.base + 10 - 300 * 0.62} r={46} fill="#FFFFFF" opacity={0.85} style={{filter: 'drop-shadow(0 0 20px #FFFFFF)'}} />}
                </g>
              );
            })}
          </g>
        )}
      </g>
      {/* the count + the name, beside the tower */}
      <g transform={`translate(${nx} ${ny}) scale(${nS}) translate(${-nx} ${-ny})`}>
        <CountNumber t={t} at={T.three} value="300 مليار $" x={nx} y={ny} size={140} tone="gold" id="c7s16n" dur={T.dollars - T.three} />
      </g>
      {(() => {
        const f = flyOut(t, T.bb + 0.1, 0, -1);
        return (
          <g transform={`translate(${f.dx} ${f.dy})`} opacity={f.o}>
            <NPill text="نتفليكس" x={1560} y={430} size={52} kind="red" id="c7s16nf" p={pp(t, 453.6)} />
          </g>
        );
      })()}
      {/* Blockbuster's branches blink out on a mini map */}
      <BranchMap t={t} at={T.bb + 0.3} x={1430} y={520} />
      {(() => {
        const f = flyOut(t, T.memories - 0.15, 0, -1);
        return (
          <g transform={`translate(${f.dx} ${f.dy})`} opacity={f.o}>
            <NPill text="فرع واحد" x={sx(STORE.x)} y={sy(STORE.base - STORE.h) - 80} size={52} kind="white" id="c7s16one" p={pp(t, T.oneStore + 0.1)} />
          </g>
        );
      })()}
      <NPill text="الذكريات" x={sx(STORE.x)} y={sy(STORE.base - STORE.h) - 80} size={52} kind="grey" id="c7s16mem" p={pp(t, T.memories - 0.05)} />
    </>
  );
};

/** a dark mini map card with ~20 gold store dots that blink out one by one, leaving ONE */
const BranchMap: React.FC<{t: number; at: number; x: number; y: number}> = ({t, at, x, y}) => {
  const q = popAt(t, at);
  const out = 1 - clamp01((t - (T.oneStore - 0.35)) / 0.3);
  if (q.o * out <= 0.01) return null;
  const w = 560, h = 320;
  const dots = Array.from({length: 22}, (_, i) => ({dx: (rand(i * 11 + 2) - 0.5) * (w - 80), dy: (rand(i * 17 + 5) - 0.5) * (h - 80), off: at + 0.4 + (i / 22) * 1.5 + rand(i) * 0.1}));
  const last = 9;
  cueSfx('tick', 'c7-branch', t >= at + 0.4 && t < at + 0.7, x, {at: at + 0.4, gain: 0.5});
  return (
    <g transform={`translate(${x} ${y}) scale(${q.s})`} opacity={q.o * out} {...lb('object', 'c7map')}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill="#120B36" stroke="#7A5CFF" strokeWidth={6} style={{filter: 'drop-shadow(0 0 14px #7A5CFF)'}} />
      <path d={`M${-w * 0.4} ${-h * 0.2} Q${-w * 0.2} ${-h * 0.42} ${w * 0.1} ${-h * 0.3} Q${w * 0.42} ${-h * 0.32} ${w * 0.4} ${h * 0.05} Q${w * 0.3} ${h * 0.4} ${w * 0.02} ${h * 0.34} Q${-w * 0.3} ${h * 0.38} ${-w * 0.42} ${h * 0.1} Z`} fill="#241A5E" stroke="#4B3A9A" strokeWidth={4} />
      {dots.map((d, i) => {
        const on = i === last || t < d.off;
        const fade = i === last ? 1 : 1 - clamp01((t - d.off) / 0.12);
        return fade > 0 ? <circle key={i} cx={d.dx} cy={d.dy} r={i === last ? 16 : 11} fill={on ? GOLD : '#555'} opacity={fade} style={{filter: `drop-shadow(0 0 6px ${GOLD})`}} /> : null;
      })}
    </g>
  );
};
