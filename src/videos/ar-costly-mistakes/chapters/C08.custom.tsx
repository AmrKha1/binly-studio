// Custom shots for C08 (builder-owned, AZTIKA). Each: export const S<n>: React.FC<{t: number}> returning the shot's WORLD
// (SVG, no <Stage>/<NightScreen> — the chapter provides them; NightShots joins, drifts and pins the host).
// C08 · قالوا لا مرتين — Yahoo, Google ×2. Palette: board purple → neon violet/cyan web (Yahoo purple, Google gold) →
// gold rays on the count. Screen coordinates (NightScreen: no mirroring) — Arabic text is anchored by hand.
// THE SEARCH BOX (S3 → S11 → S18) is one local piece (SBox): empty + «• • •» (the name held back) → the brand pill pops
// gold «قوقل» → it types «قصة ياهو» and the pill under it reads «قوقل».
import React from 'react';
import {clamp01, ease, lerp, noise1, popRef, pressIn, pushT, rand} from '../../../kit/anim';
import {lb, uid} from '../../../kit/stage';
import {GlowText, GridFloor, NightSky, NPill, RevealRing, Sparkle, YearBadge, nightFont, textWidth} from '../../../kit/night';
import {CountNumber, Flash, HeroObject, Mark, Rays, Stamp} from '../../../kit/night-fx';
import {NightCity, PriceTag, RoomWorld, StoryPerson} from '../../../kit/night-worlds';
import {StairGame} from '../../../kit/night-game';
import type {StairEntry} from '../../../kit/night-game';
import {MysteryTile} from '../../../kit/night-props';
import {MarkPill} from '../../../kit/night-data';
import {StoryTable} from '../../../kit/night-story';
import {Magnifier} from '../../../kit/night-sci';
import {move, moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {OUT, popAt} from '../shared/util';
import board from '../../../../videos/ar-costly-mistakes/board.json';

const T = {
  s2: 462.46, la1: 463.66, la2: 464.7, // «بس في شركة قالت "لا" مو مرة، مرتين»
  s3: 465.6, ismaha: 466.88, taktub: 467.43, anta: 468.08, // «اسمها تكتبه أنت كل يوم»
  s4: 468.76, ninety: 469.16, yahoo: 470.16, malika: 471.1, // «آخر التسعينات، ياهو كانت ملكة الإنترنت»
  s5: 472.04, mawqi: 472.45, alam: 473.94, // «أكثر موقع يزوره الناس في العالم»
  s8: 483.36, riwayat: 483.67, bas: 486.54, forsa: 487.46, // «وفي روايات … بس ياهو جتها الفرصة الثانية أكيد»
  s9: 488.52, y2002: 488.88, tikbar: 491.02, tufawid: 492.76, // «في 2002 … تكبر بسرعة … جلست تفاوض»
  s10: 493.76, five: 494.14, three: 496.02, tammat: 496.71, // «طلبوا 5 مليار، وياهو قالت 3. وما تمت الصفقة»
  s11: 497.56, ismaha2: 498.5, google: 498.84, // «الشركة الصغيرة اسمها قوقل»
  s12: 499.22, sinin: 499.96, ms: 500.52, yahoo3: 502.26, // «وبعدها بست سنين، مايكروسوفت عرضت تشتري ياهو»
  s13: 503.02, price: 503.5, yahoo4: 505.92, rafadat: 506.32, // «بحوالي 44.6 مليار … وياهو رفضت بعد»
  s14: 507.1, y2017: 507.48, inbaat: 508.1, v448: 510.64, // «وفي 2017 انباعت … بحوالي 4.48 مليار»
  s15: 513.64, aqal: 514.38, google2: 515.36, // «يعني أقل من السعر اللي قوقل طلبته في 2002»
  s16: 516.58, umm: 517.21, quiet: 518.9, four: 519.86, dollar: 521.0, taqriban: 521.44, four2: 522.0, trn2: 522.28, // «فوق 4 تريليون دولار تقريبًا. 4 تريليون»
  s17: 523.12, mumkin: 523.94, million: 524.5, // «والبداية كان ممكن تكون بمليون»
  s18: 524.96, yiqrun: 526.7, yahoo5: 527.54, yabhath: 527.96, fiGoogle: 528.98, end: 529.32, // «يبون يقرون قصة ياهو، يبحثون عنها في قوقل»
};

const GOLD = '#FFC928', CYAN = '#57D9FA', RED = '#FD4B5B', GREEN = '#22C55E';
const PURPLE = '#8A4AF2', PURPLE_L = '#B98BFF', YRIM = '#B57BFF', MRIM = '#7FD8FF';
const FW = 800;

// ---------------------------------------------------------------- local helpers
/** soft radial light */
const Glow: React.FC<{x: number; y: number; r: number; color: string; o?: number; id: string; ry?: number}> = ({x, y, r, color, o = 1, id, ry}) => {
  if (o <= 0.01) return null;
  const g = uid('c8glow', id);
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

/** a violet (Yahoo) capsule — NPill has no violet kind, so the same capsule recipe in Yahoo's purple */
const VPill: React.FC<{text: string; x: number; y: number; size?: number; p: number; id: string}> = ({text, x, y, size = 48, p, id}) => {
  if (p <= 0) return null;
  cueSfx('pop', `vpill-${id}`, p > 0 && p < 1, x, {hit: 0.125});
  const q = popRef(clamp01(p));
  const g = uid('c8vp', id);
  const h = size * 1.65, w = textWidth(text, size) + size * 1.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${q.s})`} opacity={q.o} {...lb('text', id, text)}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PURPLE_L} />
          <stop offset="1" stopColor={PURPLE} />
        </linearGradient>
        <filter id={g + 'b'} x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation={size * 0.32} />
        </filter>
      </defs>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={PURPLE} opacity={0.6} filter={`url(#${g}b)`} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={`url(#${g})`} stroke={OUT} strokeWidth={size * 0.08} />
      <text x={0} y={size * 0.04} fontSize={size} fontFamily={nightFont()} fontWeight={FW} textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" stroke={OUT} strokeWidth={size * 0.12} strokeLinejoin="round" paintOrder="stroke">
        {text}
      </text>
    </g>
  );
};

/** mouse pointer arrow (tip at 0,0) */
const Cursor: React.FC<{x: number; y: number; s?: number; color?: string; o?: number; rot?: number}> = ({x, y, s = 1, color = '#FFFFFF', o = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <path d="M0 0 L0 46 L11 35 L19 54 L27 50 L19 32 L34 32 Z" fill={color} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
  </g>
);

/** the crown (Yahoo, «ملكة الإنترنت») — gold with purple gems; (x, y) = bottom centre, w wide */
const Crown: React.FC<{x: number; y: number; w: number; rot?: number; o?: number; id: string}> = ({x, y, w, rot = 0, o = 1, id}) => {
  const g = uid('c8crown', id);
  const h = w * 0.62;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={o} {...lb('object', id)}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE38A" />
          <stop offset="1" stopColor="#F2A808" />
        </linearGradient>
      </defs>
      <path d={`M${-w / 2} 0 L${-w / 2} ${-h * 0.55} L${-w * 0.25} ${-h * 0.2} L0 ${-h} L${w * 0.25} ${-h * 0.2} L${w / 2} ${-h * 0.55} L${w / 2} 0 Z`} fill={`url(#${g})`} stroke={OUT} strokeWidth={w * 0.05} strokeLinejoin="round" />
      <rect x={-w / 2} y={-h * 0.2} width={w} height={h * 0.2} fill="#E09A08" stroke={OUT} strokeWidth={w * 0.04} />
      {[-0.28, 0, 0.28].map((k) => <circle key={k} cx={w * k} cy={-h * 0.1} r={w * 0.055} fill={PURPLE_L} stroke={OUT} strokeWidth={w * 0.025} />)}
      {[-0.5, 0, 0.5].map((k) => <circle key={k} cx={w * k} cy={k === 0 ? -h : -h * 0.55} r={w * 0.06} fill="#FFFFFF" stroke={OUT} strokeWidth={w * 0.025} />)}
      <path d={`M${-w * 0.36} ${-h * 0.42} L${-w * 0.2} ${-h * 0.28}`} stroke="#FFFFFF" strokeWidth={w * 0.03} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

/** a glowing website window (no letters): purple header with dots, picture block, text bars. (x, y) = centre */
const SiteTile: React.FC<{x: number; y: number; w: number; h: number; id: string; o?: number; glow?: number; tone?: string}> = ({x, y, w, h, id, o = 1, glow = 1, tone = PURPLE}) => {
  const g = uid('c8site', id);
  const l = x - w / 2, tp = y - h / 2, hh = h * 0.17;
  return (
    <g opacity={o} {...lb('object', id)}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2E2760" />
          <stop offset="1" stopColor="#161233" />
        </linearGradient>
        <filter id={g + 'b'} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={34} />
        </filter>
        <clipPath id={g + 'c'}>
          <rect x={l} y={tp} width={w} height={h} rx={h * 0.08} />
        </clipPath>
      </defs>
      {glow > 0 && <rect x={l} y={tp} width={w} height={h} rx={h * 0.08} fill={tone} opacity={0.55 * glow} filter={`url(#${g}b)`} />}
      <rect x={l} y={tp} width={w} height={h} rx={h * 0.08} fill={`url(#${g})`} />
      <g clipPath={`url(#${g}c)`}>
        <rect x={l} y={tp} width={w} height={hh} fill={tone} />
        <rect x={l} y={tp} width={w} height={hh * 0.35} fill="#FFFFFF" opacity={0.18} />
        {[0, 1, 2].map((i) => <circle key={i} cx={l + w - hh * 0.6 - i * hh * 0.55} cy={tp + hh / 2} r={hh * 0.17} fill="#FFFFFF" opacity={0.9} />)}
        <rect x={l + w * 0.08} y={tp + hh / 2 - hh * 0.2} width={w * 0.5} height={hh * 0.4} rx={hh * 0.2} fill="#FFFFFF" opacity={0.35} />
        {/* picture block + text bars */}
        <rect x={l + w * 0.55} y={tp + hh + h * 0.1} width={w * 0.37} height={h * 0.42} rx={h * 0.04} fill={tone} opacity={0.75} />
        <circle cx={l + w * 0.735} cy={tp + hh + h * 0.31} r={h * 0.12} fill="#FFFFFF" opacity={0.8} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={l + w * 0.08} y={tp + hh + h * 0.12 + i * h * 0.11} width={w * (i === 3 ? 0.25 : 0.4)} height={h * 0.05} rx={h * 0.025} fill="#D8D8E0" opacity={0.7} />
        ))}
        <rect x={l + w * 0.08} y={tp + h * 0.84} width={w * 0.84} height={h * 0.07} rx={h * 0.035} fill={CYAN} opacity={0.55} />
        <polygon points={`${l},${tp} ${l + w * 0.45},${tp} ${l + w * 0.18},${tp + h} ${l},${tp + h}`} fill="#FFFFFF" opacity={0.045} />
      </g>
      <rect x={l} y={tp} width={w} height={h} rx={h * 0.08} fill="none" stroke={OUT} strokeWidth={Math.max(6, w * 0.016)} />
    </g>
  );
};

/** the neon web: night sky, violet grid floor, a faint cyan network in the sky, a few drifting cursor arrows */
const NeonWeb: React.FC<{t: number; id: string; cursors?: boolean; horizon?: number}> = ({t, id, cursors = true, horizon = 836}) => {
  const nodes = Array.from({length: 16}, (_, i) => {
    const bx = 120 + rand(i * 7 + 3) * 1680, by = 90 + rand(i * 11 + 5) * 560;
    return [bx + noise1(t * 0.25, i) * 30, by + noise1(t * 0.25 + 9, i) * 22] as [number, number];
  });
  const links: [number, number][] = [];
  nodes.forEach((a, i) => nodes.forEach((b, j) => {
    if (j > i && Math.hypot(a[0] - b[0], a[1] - b[1]) < 360) links.push([i, j]);
  }));
  return (
    <g>
      <NightSky t={t} id={`${id}s`} horizonY={horizon} />
      <g opacity={0.5}>
        {links.map(([i, j]) => <line key={`${i}-${j}`} x1={nodes[i][0]} y1={nodes[i][1]} x2={nodes[j][0]} y2={nodes[j][1]} stroke={i % 3 ? PURPLE_L : CYAN} strokeWidth={2.5} opacity={0.45} />)}
        {nodes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5 + (i % 3) * 2} fill={i % 2 ? CYAN : PURPLE_L} opacity={0.5 + 0.4 * Math.abs(Math.sin(t * 1.3 + i))} />)}
      </g>
      <GridFloor id={`${id}f`} t={t} y={horizon} wide />
      {cursors && [0, 1, 2, 3, 4].map((i) => {
        const x = 160 + rand(i * 13 + 1) * 1600 + noise1(t * 0.4, i + 20) * 60;
        const y = 120 + rand(i * 17 + 2) * 620 + noise1(t * 0.4 + 5, i + 20) * 40;
        return <Cursor key={i} x={x} y={y} s={0.6 + rand(i) * 0.4} color={i % 2 ? '#FFFFFF' : CYAN} o={0.35} rot={-10 + rand(i + 9) * 20} />;
      })}
    </g>
  );
};

/** THE SEARCH BOX — white glossy bar, gold search button on the left end (Arabic), text typed from the right.
 *  typed = shown text · dots = 0..3 grey dots · gold = border glow 0..1 · press = enter-press 0..1 · lift 0..1 */
const SBox: React.FC<{t: number; x: number; y: number; w?: number; typed?: string; dots?: number; gold?: number; press?: number; lift?: number; id: string; s?: number; crown?: number}> = ({
  t, x, y, w = 1100, typed = '', dots = 0, gold = 0, press = 0, lift = 0, id, s = 1, crown = 0,
}) => {
  const g = uid('c8sb', id);
  const h = 140, left = -w / 2, right = w / 2, top = -h / 2;
  const btnR = 52, btnX = left + 20 + btnR;
  const tx = right - 64;
  const tw = typed ? textWidth(typed, 66) : dots > 0 ? dots * 46 : 0;
  const caretX = tx - tw - 10;
  const blink = Math.floor((t - 0.05) * 2.4) % 2 === 0 ? 1 : 0.15;
  const pb = 1 - 0.12 * Math.sin(clamp01(press) * Math.PI);
  const sc = s * (1 + 0.06 * lift);
  return (
    <g transform={`translate(${x} ${y - 24 * lift}) scale(${sc})`} {...lb('object', id)}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E2E2EE" />
        </linearGradient>
        <filter id={g + 'b'} x="-20%" y="-80%" width="140%" height="260%">
          <feGaussianBlur stdDeviation={30} />
        </filter>
      </defs>
      <ellipse cx={0} cy={h * 0.9 + 30 * lift} rx={w * 0.42} ry={22} fill="#000000" opacity={0.35 + 0.1 * lift} />
      <rect x={left} y={top} width={w} height={h} rx={h / 2} fill={CYAN} opacity={0.45 * (1 - gold)} filter={`url(#${g}b)`} />
      {gold > 0 && <rect x={left} y={top} width={w} height={h} rx={h / 2} fill={GOLD} opacity={0.75 * gold} filter={`url(#${g}b)`} />}
      <rect x={left} y={top} width={w} height={h} rx={h / 2} fill={`url(#${g})`} stroke={OUT} strokeWidth={10} />
      {gold > 0 && <rect x={left + 9} y={top + 9} width={w - 18} height={h - 18} rx={(h - 18) / 2} fill="none" stroke={GOLD} strokeWidth={8} opacity={gold} />}
      <rect x={left + 44} y={top + 16} width={w - 88} height={h * 0.24} rx={h * 0.12} fill="#FFFFFF" opacity={0.8} />
      <g transform={`translate(${btnX} 0) scale(${pb})`}>
        <circle r={btnR} fill={press > 0 && press < 1 ? '#FFE07A' : '#F5C223'} stroke={OUT} strokeWidth={7} />
        <circle cx={-6} cy={-6} r={20} fill="none" stroke="#2A1A00" strokeWidth={8} />
        <path d="M9 9 L24 24" stroke="#2A1A00" strokeWidth={10} strokeLinecap="round" />
      </g>
      {crown > 0 && (
        <g opacity={crown}>
          <Glow x={btnX + 120} y={-4} r={70} color={PURPLE_L} id={id + 'cg'} o={0.8} />
          <Crown x={btnX + 120} y={26} w={84} id={id + 'cr'} />
        </g>
      )}
      {typed && (
        <text x={tx} y={6} fontSize={66} fontFamily={nightFont()} fontWeight={FW} textAnchor="end" dominantBaseline="central" fill="#1A1A2E" {...lb('text', id + 't', typed)}>{typed}</text>
      )}
      {!typed && dots > 0 && Array.from({length: Math.min(3, Math.ceil(dots))}, (_, i) => (
        <circle key={i} cx={tx - 20 - i * 46} cy={4} r={14} fill="#9A9AB0" opacity={clamp01(dots - i)} />
      ))}
      <rect x={caretX - 4} y={-38} width={8} height={76} rx={4} fill={CYAN} opacity={blink} />
    </g>
  );
};

// ==================================================================================================================
// S2 · 462.46 · «بس في شركة قالت "لا" مو مرة، مرتين» — the stairs camera climbs to the EMPTY step above Netflix
const ENTRIES: StairEntry[] = (board.entries as {id: string; label: string; at: number; src?: string; ar?: number; glow?: string; twist?: boolean}[]).map((e) => ({
  id: e.id, label: e.label, at: e.at, src: e.src, ar: e.ar ?? 1, glow: e.glow, twist: e.twist,
}));
const STAIR = {entries: ENTRIES, summitAt: board.summitAt, topLabel: board.topLabel};
// StairGame geometry (Arabic: rising right → left from x 1660, stepW 250, h = 110 + i·62); Netflix = step 5, the
// mystery = step 6 (the step Google takes in C09)
const NEXT = {x: 1660 - 6 * 250, h: 110 + 6 * 62};
export const S2: React.FC<{t: number}> = ({t}) => {
  const base = 836;
  // camera: from BoardShot's Netflix framing (cx 410, horizon fixed) up to the empty step
  const k = ease.inOut(clamp01((t - (T.s2 + 0.05)) / 0.85));
  const cx = lerp(410, 285, k), cy = lerp(base, 420, k), sx = lerp(1040, 1100, k), sy = lerp(base, 560, k);
  const z = lerp(1.06, 1.12, k) * (1 + 0.004 * Math.max(0, t - T.s2));
  const tileX = NEXT.x, tileY = base - NEXT.h - 100;
  const scr = (wx: number, wy: number): [number, number] => [sx + (wx - cx) * z, sy + (wy - cy) * z];
  const [px, py] = scr(tileX, tileY);
  const ghost = clamp01((t - (T.s2 + 0.35)) / 0.4);
  return (
    <g>
      <NightSky t={t} id="c8s2s" horizonY={sy + (base - cy) * z} />
      <g transform={`translate(${sx} ${sy}) scale(${z}) translate(${-cx} ${-cy})`}>
        <GridFloor id="c8s2f" t={t} wide />
        <StairGame t={t} id="c8s2g" {...STAIR} />
        {/* the empty step: a dashed ghost podium waiting for its owner */}
        {ghost > 0 && (
          <g opacity={ghost}>
            <rect x={tileX - 116} y={base - NEXT.h} width={232} height={NEXT.h} rx={16} fill="#FFFFFF" fillOpacity={0.05} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={5} strokeDasharray="22 16" />
          </g>
        )}
        <MysteryTile t={t} at={T.s2 + 0.55} x={tileX} y={tileY} w={250} h={165} id="c8s2t" />
      </g>
      {/* two «لا» stamps on the tile, then a gold ×2 */}
      <Stamp t={t} at={T.la1} text="لا" x={px - 82} y={py + 20} size={92} rot={-10} />
      <Stamp t={t} at={T.la2} text="لا" x={px + 82} y={py + 34} size={92} rot={8} />
      <Pop t={t} at={T.la2 + 0.12} x={px} y={py - 175}>
        <GlowText text="×2" x={px} y={py - 175} size={96} tone="gold" id="c8s2x2" />
      </Pop>
    </g>
  );
};

// S3 · 465.60 · «والشركة اللي رفضوها، اسمها تكتبه أنت كل يوم» — the empty search box, the name held back
const BOX = {x: 1150, y: 470, w: 1000};
export const S3: React.FC<{t: number}> = ({t}) => {
  const q = popAt(t, T.s3 + 0.1);
  const gold = clamp01((t - (T.ismaha - 0.1)) / 0.3) * (0.75 + 0.25 * Math.sin(t * 5));
  // «تكتبه»: three dots type in, hold, then erase (the name is NOT shown)
  const d0 = T.taktub;
  const dots = t < d0 ? 0 : t < d0 + 0.36 ? (t - d0) / 0.12 : t < d0 + 0.62 ? 3 : Math.max(0, 3 - (t - d0 - 0.62) / 0.06);
  cueSfx('typing', 'c8s3-dots', t >= d0 && t < d0 + 0.36, BOX.x, {at: d0, gain: 0.5});
  const lift = ease.out(clamp01((t - (T.anta - 0.1)) / 0.4));
  return (
    <g>
      <NeonWeb t={t} id="c8s3w" />
      <Glow x={BOX.x} y={BOX.y} r={720} ry={320} color={gold > 0.05 ? GOLD : CYAN} o={0.35} id="c8s3g" />
      <g transform={`translate(${BOX.x} ${BOX.y}) scale(${q.s}) translate(${-BOX.x} ${-BOX.y})`} opacity={q.o}>
        <SBox t={t} x={BOX.x} y={BOX.y} typed="" dots={dots} gold={gold} lift={lift} id="c8s3b" w={BOX.w} />
        {/* the brand slot under the box: a grey «؟» — the name we are not told yet */}
        <NPill text="؟" x={BOX.x} y={BOX.y + 190} size={56} kind="grey" id="c8s3q" p={(t - (T.ismaha + 0.05)) / 0.3} />
      </g>
    </g>
  );
};

// S4 · 468.76 · «آخر التسعينات، ياهو كانت ملكة الإنترنت»
const TILE = {x: 960, y: 560, w: 600, h: 420};
const crownY = (t: number) => {
  // drops from above and lands on the tile's top edge with a small settle
  if (t < T.malika - 0.15) return -200;
  const u = clamp01((t - (T.malika - 0.15)) / 0.4);
  return lerp(-200, TILE.y - TILE.h / 2 + 6, ease.outBack(u));
};
export const S4: React.FC<{t: number}> = ({t}) => {
  const [, ty] = move(t, T.s4 + 0.1, [TILE.x, 900], [TILE.x, TILE.y], 0.55, ease.out);
  const rise = clamp01((t - (T.s4 + 0.1)) / 0.3);
  const cy = crownY(t);
  cueSfx('whoosh', 'c8s4-rise', t >= T.s4 + 0.1 && t < T.s4 + 0.4, 960, {at: T.s4 + 0.1, gain: 0.5});
  cueSfx('sparkle', 'c8s4-crown', t >= T.malika + 0.2 && t < T.malika + 0.5, 960, {at: T.malika + 0.25});
  const land = clamp01((t - (T.malika + 0.25)) / 0.5);
  return (
    <g>
      <NeonWeb t={t} id="c8s4w" />
      <Glow x={TILE.x} y={TILE.y} r={620} ry={420} color={PURPLE} o={0.55 * rise} id="c8s4g" />
      <SiteTile x={TILE.x} y={ty} w={TILE.w} h={TILE.h} id="c8s4tile" o={rise} />
      {t >= T.malika - 0.15 && <Crown x={TILE.x} y={cy} w={230} id="c8s4crown" />}
      {land > 0 && land < 1 && [0, 1, 2, 3, 4].map((i) => (
        <Sparkle key={i} x={TILE.x - 150 + i * 75} y={TILE.y - TILE.h / 2 - 150 - (i % 2) * 40} r={16 + (i % 2) * 8} o={Math.sin(land * Math.PI)} color={i % 2 ? '#FFFFFF' : GOLD} />
      ))}
      <NPill text="آخر التسعينات" x={960} y={150} size={44} kind="grey" id="c8s4y" p={(t - (T.ninety - 0.1)) / 0.3} />
      <VPill text="ياهو" x={TILE.x} y={ty + TILE.h / 2 + 80} size={60} p={(t - (T.yahoo - 0.1)) / 0.3} id="c8s4n" />
    </g>
  );
};

// S5 · 472.04 · «أكثر موقع يزوره الناس في العالم» — the world streams into the crowned tile
const Streams: React.FC<{t: number; n: number; seed: number; o: number; cx: number; cy: number}> = ({t, n, seed, o, cx, cy}) => (
  <g opacity={o}>
    {Array.from({length: n}, (_, i) => {
      const a = rand(seed + i * 3.1) * Math.PI * 2;
      const R = 1150 + rand(seed + i * 5.3) * 300;
      const per = 1.5 + rand(seed + i * 7.7) * 0.9;
      const u = (((t + rand(seed + i) * per) / per) % 1 + 1) % 1;
      const k = ease.in(u);
      const x = cx + Math.cos(a) * R * (1 - k), y = cy + Math.sin(a) * R * 0.62 * (1 - k);
      const fade = Math.min(1, u * 5) * Math.min(1, (1 - u) * 6);
      const deg = (Math.atan2(cy - y, cx - x) * 180) / Math.PI - 125;
      return i % 3 === 0
        ? <circle key={i} cx={x} cy={y} r={7} fill={i % 2 ? CYAN : '#FFFFFF'} opacity={fade} />
        : <Cursor key={i} x={x} y={y} s={0.55} color={i % 2 ? CYAN : '#FFFFFF'} o={fade} rot={deg} />;
    })}
  </g>
);
export const S5: React.FC<{t: number}> = ({t}) => {
  const z = moveTo(t, T.s5, 1, 0.74, 0.8);
  const ring = clamp01((t - (T.alam - 0.15)) / 0.35);
  const dbl = clamp01((t - (T.alam - 0.1)) / 0.3);
  cueSfx('swish', 'c8s5-ring', t >= T.alam - 0.15 && t < T.alam + 0.2, 960, {at: T.alam - 0.1, gain: 0.6});
  return (
    <g>
      <NeonWeb t={t} id="c8s5w" cursors={false} />
      <Streams t={t} n={26} seed={11} o={1} cx={TILE.x} cy={TILE.y - 40} />
      <Streams t={t} n={30} seed={47} o={dbl} cx={TILE.x} cy={TILE.y - 40} />
      <g transform={`translate(${TILE.x} ${TILE.y - 40}) scale(${z}) translate(${-TILE.x} ${-TILE.y})`}>
        {/* the globe ring behind the tile */}
        {ring > 0 && (
          <g opacity={0.7 * ring} transform={`translate(${TILE.x} ${TILE.y - 60}) scale(${0.7 + 0.3 * ease.out(ring)})`}>
            <circle r={430} fill="none" stroke={CYAN} strokeWidth={6} />
            {[0, 1, 2].map((i) => {
              const ph = ((t * 0.5 + i / 3) % 1) * Math.PI;
              return <ellipse key={i} rx={Math.abs(Math.cos(ph)) * 430} ry={430} fill="none" stroke={CYAN} strokeWidth={3} opacity={0.6} />;
            })}
            <ellipse rx={430} ry={140} fill="none" stroke={CYAN} strokeWidth={3} opacity={0.6} />
            <ellipse cy={-230} rx={360} ry={110} fill="none" stroke={CYAN} strokeWidth={2.5} opacity={0.4} />
            <ellipse cy={230} rx={360} ry={110} fill="none" stroke={CYAN} strokeWidth={2.5} opacity={0.4} />
          </g>
        )}
        <Glow x={TILE.x} y={TILE.y} r={640} ry={440} color={PURPLE} o={0.6} id="c8s5g" />
        <SiteTile x={TILE.x} y={TILE.y} w={TILE.w} h={TILE.h} id="c8s5tile" />
        <Crown x={TILE.x} y={TILE.y - TILE.h / 2 + 6} w={230} id="c8s5crown" />
        <VPill text="ياهو" x={TILE.x} y={TILE.y + TILE.h / 2 + 80} size={60} p={1} id="c8s5n" />
      </g>
      <NPill text="أكثر موقع يزوره الناس" x={960} y={905} size={52} kind="white" id="c8s5p" p={(t - (T.mawqi - 0.1)) / 0.3} />
    </g>
  );
};

// S8 · 483.36 · «وفي روايات تقول إن العرض الأول كان لشركة ثانية، بس ياهو جتها الفرصة الثانية أكيد» — the fork
const OfferCard: React.FC<{x: number; y: number; id: string}> = ({x, y, id}) => (
  <g {...lb('object', id)}>
    <g transform={`translate(${x - 60} ${y + 10}) rotate(-8)`}>
      <rect x={-85} y={-110} width={170} height={220} rx={14} fill="#F4F1E6" stroke={OUT} strokeWidth={7} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={-58} y={-70 + i * 34} width={i === 3 ? 60 : 116} height={12} rx={6} fill="#B9B4C8" />)}
      <path d="M-50 74 Q-20 54 0 76 T48 70" fill="none" stroke="#2A2A5A" strokeWidth={6} strokeLinecap="round" />
    </g>
  </g>
);
const DOOR = {x: 440, y: 520}, YT = {x: 1460, y: 450};
export const S8: React.FC<{t: number}> = ({t}) => {
  const greyDraw = clamp01((t - (T.riwayat - 0.05)) / 0.5);
  const greyFade = 1 - 0.75 * clamp01((t - T.bas) / 0.35);
  const goldDraw = ease.inOut(clamp01((t - (T.forsa - 0.25)) / 0.45));
  const yahooIn = popAt(t, T.forsa - 0.2);
  cueSfx('swish', 'c8s8-grey', t >= T.riwayat && t < T.riwayat + 0.3, 600, {at: T.riwayat, gain: 0.5});
  cueSfx('whoosh', 'c8s8-gold', t >= T.forsa - 0.25 && t < T.forsa, 1300, {at: T.forsa - 0.2, gain: 0.6});
  const greyPath = `M780 560 C700 560 620 ${DOOR.y + 40} ${DOOR.x + 120} ${DOOR.y + 40}`;
  const goldPath = `M1130 560 C1200 560 1210 ${YT.y + 60} ${YT.x - 230} ${YT.y + 60}`;
  return (
    <g>
      <NightSky t={t} id="c8s8s" />
      <GridFloor id="c8s8f" t={t} wide />
      <Glow x={960} y={560} r={420} color={GOLD} o={0.25} id="c8s8g" />
      {/* grey rumour branch → a faceless grey company door */}
      {greyDraw > 0 && (
        <g opacity={greyFade}>
          <path d={greyPath} fill="none" stroke="#B8B8C8" strokeWidth={10} strokeDasharray="26 20" pathLength={1000} strokeDashoffset={0} opacity={greyDraw} strokeLinecap="round" />
          <g opacity={greyDraw} transform={`translate(${DOOR.x} ${DOOR.y}) scale(1.35) translate(${-DOOR.x} ${-DOOR.y})`}>
            <rect x={DOOR.x - 110} y={DOOR.y - 190} width={220} height={300} rx={14} fill="#3A3850" stroke={OUT} strokeWidth={8} />
            <rect x={DOOR.x - 70} y={DOOR.y - 140} width={140} height={250} rx={8} fill="#5A5870" stroke={OUT} strokeWidth={6} />
            <circle cx={DOOR.x + 42} cy={DOOR.y - 10} r={10} fill="#C4C5CC" stroke={OUT} strokeWidth={4} />
            <GlowText text="؟" x={DOOR.x} y={DOOR.y - 60} size={90} tone="grey" id="c8s8dq" />
          </g>
          <NPill text="روايات: العرض الأول لشركة ثانية" x={560} y={860} size={48} kind="grey" id="c8s8r" p={(t - (T.riwayat + 0.15)) / 0.3} />
        </g>
      )}
      {/* the offer at the centre */}
      <Pop t={t} at={T.s8 + 0.05} x={960} y={560}>
        <g transform="translate(960 560) scale(1.5) translate(-960 -560)">
          <OfferCard x={960} y={560} id="c8s8card" />
          <MysteryTile t={t} x={1010} y={600} w={170} h={115} id="c8s8tile" />
        </g>
      </Pop>
      {/* the gold road to Yahoo */}
      {goldDraw > 0 && (
        <g>
          <path d={goldPath} fill="none" stroke={GOLD} strokeOpacity={0.4} strokeWidth={26} pathLength={1000} strokeDasharray={`${goldDraw * 1000} 1000`} strokeLinecap="round" />
          <path d={goldPath} fill="none" stroke={GOLD} strokeWidth={12} pathLength={1000} strokeDasharray={`${goldDraw * 1000} 1000`} strokeLinecap="round" />
        </g>
      )}
      {yahooIn.o > 0 && (
        <g transform={`translate(${YT.x} ${YT.y}) scale(${yahooIn.s}) translate(${-YT.x} ${-YT.y})`} opacity={yahooIn.o}>
          <Glow x={YT.x} y={YT.y} r={330} color={PURPLE} o={0.6} id="c8s8yg" />
          <SiteTile x={YT.x} y={YT.y} w={420} h={300} id="c8s8yt" />
          <Crown x={YT.x} y={YT.y - 144} w={160} id="c8s8cr" />
          <VPill text="ياهو" x={YT.x} y={YT.y + 210} size={50} p={1} id="c8s8yn" />
        </g>
      )}
      <MarkPill t={t} at={T.forsa} text="الفرصة الثانية أكيد" x={1340} y={810} mark="check" size={48} id="c8s8m" />
    </g>
  );
};

// S9 · 488.52 · «في 2002، والشركة الصغيرة صارت تكبر بسرعة، ياهو جلست تفاوض تشتريها»
const G9 = {x: 640, base: 900};
const S9World: React.FC<{t: number; tableAt: number}> = ({t, tableAt}) => {
  const hgt = lerp(260, 500, ease.out(clamp01((t - (T.tikbar - 0.1)) / 0.7)));
  const top = G9.base - hgt;
  const [yx] = move(t, T.tufawid - 0.35, [2300, 0], [1430, 0], 0.7, ease.out);
  const tbl = popAt(t, tableAt);
  cueSfx('riser', 'c8s9-grow', t >= T.tikbar - 0.1 && t < T.tikbar + 0.2, G9.x, {at: T.tikbar - 0.1, gain: 0.7});
  cueSfx('whoosh', 'c8s9-yahoo', t >= T.tufawid - 0.35 && t < T.tufawid, 1500, {at: T.tufawid - 0.3, gain: 0.6});
  const up = t >= T.tikbar ? clamp01((t - T.tikbar) / 0.3) : 0;
  return (
    <g>
      <NightSky t={t} id="c8s9s" />
      <GridFloor id="c8s9f" t={t} wide />
      <Glow x={G9.x} y={top} r={360} color={GREEN} o={0.4} id="c8s9g" />
      {/* the small company rides a fast-growing green bar */}
      <g {...lb('object', 'c8s9bar')}>
        <rect x={G9.x - 90} y={top} width={180} height={hgt} rx={16} fill={GREEN} stroke={OUT} strokeWidth={8} />
        <rect x={G9.x - 70} y={top + 14} width={26} height={Math.max(0, hgt - 28)} rx={13} fill="#FFFFFF" opacity={0.3} />
      </g>
      <MysteryTile t={t} x={G9.x} y={top - 95} w={270} h={175} id="c8s9t" />
      {up > 0 && (
        <g opacity={up} transform={`translate(${G9.x + 190} ${top + 40 + Math.sin(t * 6) * 12})`}>
          <path d="M0 -60 L52 10 L20 10 L20 70 L-20 70 L-20 10 L-52 10 Z" fill={GREEN} stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
        </g>
      )}
      {/* Yahoo slides in, the table appears between them */}
      {t >= T.tufawid - 0.35 && (
        <g>
          <Glow x={yx} y={460} r={330} color={PURPLE} o={0.55} id="c8s9yg" />
          <SiteTile x={yx} y={460} w={380} h={270} id="c8s9yt" />
          <Crown x={yx} y={460 - 129} w={140} id="c8s9cr" />
          <VPill text="ياهو" x={yx} y={460 + 195} size={50} p={1} id="c8s9yn" />
        </g>
      )}
      {tbl.o > 0 && (
        <g transform={`translate(1040 840) scale(${tbl.s}) translate(-1040 -840)`} opacity={tbl.o}>
          <StoryTable x={1040} y={840} w={380} />
        </g>
      )}
    </g>
  );
};
export const S9: React.FC<{t: number}> = ({t}) => (
  <g>
    <S9World t={t} tableAt={T.tufawid + 0.05} />
    <YearBadge t={t} at={T.y2002 - 0.1} year={2002} from={1998} x={1460} y={170} id="c8s9yb" size={110} />
  </g>
);

// S10 · 493.76 · «طلبوا 5 مليار، وياهو قالت 3. وما تمت الصفقة» — the negotiation table
const Hand: React.FC<{x: number; y: number; color: string; flip?: boolean}> = ({x, y, color, flip}) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
    <rect x={-150} y={-18} width={140} height={36} rx={18} fill="#2E3A5E" stroke={OUT} strokeWidth={6} />
    <circle cx={6} cy={0} r={30} fill="#F2E6D8" stroke={color} strokeWidth={7} />
  </g>
);
export const S10: React.FC<{t: number}> = ({t}) => {
  const reach = ease.out(clamp01((t - (T.s10 + 0.1)) / 0.6));
  const apart = ease.inOut(clamp01((t - T.tammat) / 0.45));
  const gap = lerp(lerp(260, 70, reach), 330, apart);
  const m = pressIn((t - T.tammat) / 0.165);
  cueSfx('thump', 'c8s10-x', t >= T.tammat && t < T.tammat + 0.3, 960, {at: T.tammat});
  return (
    <g>
      <RoomWorld t={t} id="c8s10r" winX={1370} />
      <rect x={0} y={0} width={1920} height={1080} fill="#1A3A7A" opacity={0.28} />
      <Glow x={960} y={760} r={700} ry={260} color={CYAN} o={0.25} id="c8s10g" />
      <StoryPerson t={t} x={430} y={1060} s={1.3} role="businessman" prop="none" rim={MRIM} id="c8s10a" pose="talk" />
      <StoryPerson t={t} x={650} y={1060} s={1.3} role="businessman" prop="none" rim={MRIM} glasses id="c8s10b" pose="idle" body="#2A4A6E" />
      <StoryPerson t={t} x={1450} y={1060} s={1.35} role="businessman" prop="none" rim={YRIM} flip id="c8s10y" pose={t >= T.three ? 'talk' : 'idle'} />
      <StoryTable x={960} y={830} w={980} />
      <Hand x={960 - gap / 2} y={800} color={MRIM} />
      <Hand x={960 + gap / 2} y={800} color={YRIM} flip />
      {t >= T.tammat && (
        <g transform={`translate(960 640) scale(${m.s})`} opacity={m.o}>
          <Mark kind="cross" x={0} y={0} r={80} />
        </g>
      )}
      <NPill text="5 مليار" x={560} y={250} size={70} kind="gold" id="c8s10p5" p={(t - (T.five - 0.1)) / 0.3} />
      <NPill text="3 مليار" x={1440} y={250} size={70} kind="white" id="c8s10p3" p={(t - (T.three - 0.1)) / 0.3} />
    </g>
  );
};

// S11 · 497.56 · «الشركة الصغيرة اسمها قوقل» — the box returns, the brand pill pops GOLD
export const S11: React.FC<{t: number}> = ({t}) => {
  const gold = clamp01((t - (T.ismaha2 - 0.1)) / 0.3);
  const rays = clamp01((t - T.google) / 0.3);
  const pill = (t - (T.google - 0.05)) / 0.3;
  return (
    <g>
      <NeonWeb t={t} id="c8s11w" />
      {rays > 0 && <g opacity={rays}><Rays t={t} id="c8s11r" tone="gold" x={BOX.x} y={BOX.y + 190} /></g>}
      <SBox t={t} x={BOX.x} y={BOX.y} gold={gold} id="c8s11b" w={BOX.w} />
      {t < T.google - 0.05 && <NPill text="؟" x={BOX.x} y={BOX.y + 190} size={56} kind="grey" id="c8s11q" />}
      <NPill text="قوقل" x={BOX.x} y={BOX.y + 200} size={96} kind="gold" id="c8s11g" p={pill} />
      <RevealRing t={t} at={T.google} x={BOX.x} y={BOX.y + 200} r={300} />
      {t >= T.google && t < T.google + 0.5 && <Flash t={t} at={T.google} strength={0.3} color="#FFE7A0" />}
    </g>
  );
};

// S12 · 499.22 · «وبعدها بست سنين، مايكروسوفت عرضت تشتري ياهو» — the Microsoft man walks to Yahoo's tower
const TOWER = {x: 1420, top: 330, w: 330};
const YahooTower: React.FC<{t: number}> = ({t}) => {
  const base = 1020, l = TOWER.x - TOWER.w / 2;
  return (
    <>
      <Glow x={TOWER.x} y={600} r={460} ry={560} color={PURPLE} o={0.5} id="c8tw" />
    <g {...lb('object', 'c8tower')}>
      <rect x={l} y={TOWER.top} width={TOWER.w} height={base - TOWER.top} fill="#2A1A5E" stroke={OUT} strokeWidth={9} />
      <rect x={l + TOWER.w - 70} y={TOWER.top} width={70} height={base - TOWER.top} fill="#1A0F40" />
      {Array.from({length: 9}, (_, r) => [0, 1, 2].map((c) => (
        <rect key={`${r}-${c}`} x={l + 30 + c * 85} y={TOWER.top + 40 + r * 70} width={50} height={36} rx={5} fill={rand(r * 5 + c + Math.floor(t * 0.7)) > 0.25 ? PURPLE_L : '#3A2A70'} opacity={0.9} />
      )))}
      <rect x={l - 20} y={TOWER.top - 20} width={TOWER.w + 40} height={30} rx={8} fill="#3A2A7A" stroke={OUT} strokeWidth={7} />
      <Crown x={TOWER.x} y={TOWER.top - 20} w={170} id="c8twcr" />
    </g>
    </>
  );
};
export const S12: React.FC<{t: number}> = ({t}) => {
  const walking = t < T.yahoo3 - 0.25;
  const [mx] = move(t, T.s12 + 0.2, [330, 0], [900, 0], 2.6);
  return (
    <g>
      <NightCity t={t} id="c8s12c" />
      <YahooTower t={t} />
      <VPill text="ياهو" x={TOWER.x} y={TOWER.top + 120} size={50} p={1} id="c8s12yn" />
      <StoryPerson t={t} x={mx} y={1030} s={1.15} role="businessman" rim={MRIM} id="c8s12m" pose={walking ? 'walk' : 'point'} />
      <NPill text="مايكروسوفت" x={mx} y={1030 - 1.15 * 470} size={48} kind="cyan" id="c8s12p" p={(t - (T.ms - 0.1)) / 0.3} />
      <NPill text="بعدها بست سنين" x={960} y={180} size={52} kind="white" id="c8s12after" p={(t - (T.s12 + 0.2)) / 0.3} />
    </g>
  );
};

// S13 · 503.02 · «بحوالي 44.6 مليار … وياهو رفضت بعد» — the offer, refused
export const S13: React.FC<{t: number}> = ({t}) => {
  const tagP = (t - (T.price - 0.1)) / 0.35;
  const cross = ease.out(clamp01((t - (T.yahoo4 - 0.1)) / 0.35));
  cueSfx('cash', 'c8s13-cash', t >= T.price && t < T.price + 0.3, 960, {at: T.price + 0.05});
  return (
    <g>
      <NightCity t={t} id="c8s13c" base={1000} />
      <rect x={0} y={0} width={1920} height={1080} fill="#0F062B" opacity={0.35} />
      <Glow x={960} y={430} r={560} ry={300} color={GOLD} o={0.4 * clamp01(tagP)} id="c8s13g" />
      <StoryPerson t={t} x={430} y={1090} s={1.45} role="businessman" rim={MRIM} id="c8s13m" pose="hold" prop="none" />
      <StoryPerson t={t} x={1500} y={1090} s={1.45} role="businessman" rim={YRIM} flip id="c8s13y" pose="idle" prop="none" />
      {/* Yahoo crosses his arms (a bar across the chest with both hands) */}
      {cross > 0 && (
        <g opacity={cross} transform={`translate(1500 ${1090 - 1.45 * 205}) scale(${1.45 * (0.7 + 0.3 * cross)})`}>
          <rect x={-78} y={-24} width={156} height={48} rx={24} fill="#2E3A5E" stroke={OUT} strokeWidth={6} />
          <circle cx={-70} cy={-4} r={20} fill="#F2E6D8" stroke={YRIM} strokeWidth={5} />
          <circle cx={70} cy={4} r={20} fill="#F2E6D8" stroke={YRIM} strokeWidth={5} />
        </g>
      )}
      <PriceTag text="حوالي 44.6 مليار" x={960} y={420} size={78} color={GOLD} p={tagP} />
      <Stamp t={t} at={T.rafadat} text="رفضت" x={1250} y={520} size={130} rot={-9} />
      <NPill text="مرة ثانية" x={960} y={640} size={48} kind="grey" id="c8s13again" p={(t - (T.rafadat + 0.4)) / 0.3} />
    </g>
  );
};

// S14 + S15 · 507.10 / 513.64 · «وفي 2017 انباعت … بحوالي 4.48 مليار … يعني أقل من السعر اللي قوقل طلبته في 2002»
// One continuous scene (S15 joins it with a plain dissolve, no drift of its own) — the camera keeps one slow push.
const BARS = {x: 1790, y: 560, len: 1250, max: 5.4, gap: 210, thick: 80};
/** a thick glowing horizontal bar growing leftward from x (Arabic) + its label pill above its far end */
const BigBar: React.FC<{t: number; at: number; x: number; y: number; len: number; c0: string; c1: string; label: string; kind: 'white' | 'gold'; id: string}> = ({t, at, x, y, len, c0, c1, label, kind, id}) => {
  const p = clamp01((t - at) / 0.6);
  if (p <= 0) return null;
  cueSfx('swish', 'bigbar-' + id, t >= at && t < at + 0.3, x - len / 2, {at, gain: 0.5});
  const L = Math.max(BARS.thick, len * ease.out(p));
  const g = uid('c8bar', id);
  const th = BARS.thick;
  return (
    <g {...lb('object', id)}>
      <defs>
        <linearGradient id={g} x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor={c0} /><stop offset="1" stopColor={c1} /></linearGradient>
        <filter id={g + 'b'} x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation={18} /></filter>
      </defs>
      <rect x={x - L} y={y - th / 2} width={L} height={th} rx={th / 2} fill={c1} opacity={0.55} filter={"url(#" + g + "b)"} />
      <rect x={x - L} y={y - th / 2} width={L} height={th} rx={th / 2} fill={"url(#" + g + ")"} stroke={OUT} strokeWidth={8} />
      <rect x={x - L + th / 2} y={y - th / 2 + 10} width={Math.max(0, L - th)} height={10} rx={5} fill="#FFFFFF" opacity={0.4} />
      <NPill text={label} x={x - L + textWidth(label, 50) / 2 + 60} y={y - th / 2 - 52} size={50} kind={kind} id={id + 'p'} p={(t - at - 0.3) / 0.3} />
    </g>
  );
};
const SoldScene: React.FC<{t: number; withGold: boolean}> = ({t, withGold}) => {
  const tile = {x: 640, y: 255, w: 360, h: 250};
  // the crown falls off (tips, drops to the floor and clinks)
  const fall = clamp01((t - (T.y2017 + 0.15)) / 0.55);
  const cX = tile.x - 230 * ease.out(fall), cY = lerp(tile.y - tile.h / 2 + 4, 860, ease.in(fall));
  const cRot = 75 * ease.inOut(fall);
  cueSfx('fall', 'c8s14-crown', t >= T.y2017 + 0.15 && t < T.y2017 + 0.5, tile.x, {at: T.y2017 + 0.15, gain: 0.6});
  // the red «انباعت» tag swings onto the tile (damped pendulum)
  const sw = t >= T.inbaat - 0.1 ? t - (T.inbaat - 0.1) : -1;
  const ang = sw < 0 ? 0 : 38 * Math.exp(-sw * 2.6) * Math.cos(sw * 7.5);
  const tagIn = popAt(t, T.inbaat - 0.1);
  const hx = tile.x + tile.w / 2 - 30, hy = tile.y - tile.h / 2 + 30;
  const dim = withGold ? 0.55 : 1;
  const goldGlow = clamp01((t - (T.google2 - 0.1)) / 0.3);
  const goldLen = BARS.len * (5 / BARS.max);
  const purpleLen = BARS.len * (4.48 / BARS.max);
  const gapP = ease.out(clamp01((t - (T.aqal - 0.1)) / 0.35));
  const pEnd = BARS.x - purpleLen, gEnd = BARS.x - goldLen;
  return (
    <g transform={pushT(t, T.s14, 1100, 600)}>
      <NightSky t={t} id="c8s14s" />
      <GridFloor id="c8s14f" t={t} wide />
      <g opacity={dim}>
        <Glow x={tile.x} y={tile.y} r={300} color={PURPLE} o={0.35} id="c8s14g" />
        <SiteTile x={tile.x} y={tile.y} w={tile.w} h={tile.h} id="c8s14t" glow={0.5} />
        {tagIn.o > 0 && (
          <g transform={`translate(${hx} ${hy}) rotate(${ang}) scale(${tagIn.s})`} opacity={tagIn.o} {...lb('text', 'c8s14tag', 'انباعت')}>
            <line x1={0} y1={0} x2={0} y2={70} stroke="#E8E4DC" strokeWidth={6} />
            <rect x={-120} y={70} width={240} height={110} rx={18} fill={RED} stroke={OUT} strokeWidth={8} />
            <circle cx={0} cy={92} r={9} fill={OUT} />
            <text x={0} y={132} fontSize={60} fontFamily={nightFont()} fontWeight={FW} textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" stroke={OUT} strokeWidth={7} paintOrder="stroke">انباعت</text>
          </g>
        )}
      </g>
      {fall < 1 ? <Crown x={cX} y={cY} w={140} rot={cRot} id="c8s14cr" /> : <Crown x={cX} y={860} w={140} rot={75} o={0.7 * dim} id="c8s14cr2" />}
      <YearBadge t={t} at={T.y2017 - 0.15} year={2017} from={2002} x={1560} y={190} id="c8s14yb" size={110} />
      <BigBar t={t} at={T.v448 - 0.2} x={BARS.x} y={BARS.y} len={purpleLen} c0={PURPLE_L} c1={PURPLE} label="حوالي 4.48 مليار $" kind="white" id="c8s14bp" />
      {withGold && <BigBar t={t} at={T.s15 + 0.1} x={BARS.x} y={BARS.y + BARS.gap} len={goldLen} c0="#FFE07A" c1="#F2B010" label="طلب قوقل 5 مليار $" kind="gold" id="c8s15bg" />}
      {withGold && goldGlow > 0 && (
        <Glow x={BARS.x - goldLen / 2} y={BARS.y + BARS.gap} r={goldLen * 0.6} ry={90} color={GOLD} o={goldGlow * (0.5 + 0.3 * Math.sin(t * 6))} id="c8s15gg" />
      )}
      {withGold && gapP > 0 && (
        <g opacity={gapP}>
          <line x1={pEnd} y1={BARS.y + 50} x2={pEnd} y2={BARS.y + BARS.gap + 80} stroke={RED} strokeWidth={10} strokeDasharray="18 12" strokeLinecap="round" />
          <line x1={gEnd} y1={BARS.y + BARS.gap + 50} x2={gEnd} y2={BARS.y + BARS.gap + 80} stroke={RED} strokeWidth={10} strokeLinecap="round" />
          <path d={"M" + pEnd + " " + (BARS.y + BARS.gap + 80) + " L" + gEnd + " " + (BARS.y + BARS.gap + 80)} stroke={RED} strokeWidth={12} strokeLinecap="round" />
          <Glow x={gEnd - 170} y={BARS.y + BARS.gap / 2} r={200} ry={110} color={RED} o={0.35} id="c8s15rg" />
        </g>
      )}
      {withGold && (
        <Pop t={t} at={T.aqal - 0.08} x={gEnd - 180} y={BARS.y + BARS.gap / 2 + 10}>
          <GlowText text="أقل!" x={gEnd - 180} y={BARS.y + BARS.gap / 2 + 10} size={110} tone="red" id="c8s15aqal" />
        </Pop>
      )}
    </g>
  );
};
export const S14: React.FC<{t: number}> = ({t}) => <SoldScene t={t} withGold={false} />;
export const S15: React.FC<{t: number}> = ({t}) => <SoldScene t={t} withGold />;

// S16 · 516.58 · «أما الشركة الأم لقوقل اليوم فقيمتها فوق 4 تريليون دولار تقريبًا. 4 تريليون» — the biggest count
const NUM = {x: 1070, y: 560};
export const S16: React.FC<{t: number}> = ({t}) => {
  const raysO = 0.35 + 0.65 * clamp01((t - T.dollar) / 0.3);
  const quiet = t >= T.quiet && t < T.four ? 0.7 : 1; // near-silence: the stage holds its breath
  const colP = clamp01((t - T.four) / 1.14);
  const colH = lerp(40, 1200, ease.inOut(colP));
  const punch = ease.inOut(clamp01((t - (T.trn2 - 0.1)) / 0.4));
  const z = 1 + 0.12 * punch;
  const pulse = t >= T.trn2 ? Math.exp(-(t - T.trn2) / 0.4) : 0;
  return (
    <g>
      <NightSky t={t} id="c8s16s" />
      <g opacity={raysO * quiet}><Rays t={t} id="c8s16r" tone="gold" x={NUM.x} y={NUM.y} /></g>
      <g transform={`translate(${NUM.x} ${NUM.y}) scale(${z}) translate(${-NUM.x} ${-NUM.y})`}>
        {/* the gold column rising out of the top of the frame */}
        {t >= T.four && (
          <g {...lb('object', 'c8s16col')}>
            <Glow x={1620} y={1000 - colH / 2} r={260} ry={Math.max(200, colH * 0.6)} color={GOLD} o={0.5} id="c8s16cg" />
            <rect x={1520} y={1000 - colH} width={200} height={colH} fill="#F2B010" stroke={OUT} strokeWidth={9} />
            <rect x={1540} y={1000 - colH} width={34} height={colH} fill="#FFE38A" opacity={0.7} />
            <rect x={1682} y={1000 - colH} width={38} height={colH} fill="#C98F0A" />
          </g>
        )}
        {(() => {
          const [hx, hy] = move(t, T.four - 0.3, [NUM.x, NUM.y - 20], [1620, 250], 0.6);
          const hs = moveTo(t, T.four - 0.3, 1, 0.5, 0.6);
          return (
            <g transform={`translate(${hx} ${hy}) scale(${hs})`}>
              <HeroObject t={t} at={T.s16 + 0.15} src="ar-costly-mistakes/el/magnifier.png" ar={1.02} x={0} y={0} h={400} glow={GOLD} id="c8s16hero" />
            </g>
          );
        })()}
        <Glow x={NUM.x} y={NUM.y} r={560} ry={240} color={GOLD} o={0.35 + 0.5 * pulse} id="c8s16ng" />
        <CountNumber t={t} at={T.four - 0.05} value="4 تريليون $" x={NUM.x} y={NUM.y} size={180} id="c8s16n" dur={1.1} />
        <RevealRing t={t} at={T.dollar} x={NUM.x} y={NUM.y} r={420} tail />
        <NPill text="تقريبًا" x={NUM.x} y={NUM.y + 170} size={44} kind="grey" id="c8s16t" p={(t - (T.taqriban - 0.05)) / 0.3} />
      </g>
      <NPill text="الشركة الأم لقوقل" x={1060} y={160} size={52} kind="white" id="c8s16u" p={(t - (T.umm - 0.1)) / 0.3} />
      {t >= T.dollar && t < T.dollar + 0.5 && <Flash t={t} at={T.dollar} strength={0.35} color="#FFE7A0" />}
    </g>
  );
};

// S17 · 523.12 · «والبداية كان ممكن تكون بمليون» — a giant gold column beside a dot
export const S17: React.FC<{t: number}> = ({t}) => {
  const z = moveTo(t, T.s17, 1.3, 1, 0.75);
  const dot = {x: 960, y: 900};
  return (
    <g>
      <NightSky t={t} id="c8s17s" horizonY={900} />
      <GridFloor id="c8s17f" t={t} y={900} wide />
      <g transform={`translate(1300 560) scale(${z}) translate(-1300 -560)`}>
        <Glow x={1400} y={500} r={360} ry={620} color={GOLD} o={0.55} id="c8s17g" />
        <g {...lb('object', 'c8s17col')}>
          <rect x={1290} y={-200} width={220} height={1100} fill="#F2B010" stroke={OUT} strokeWidth={9} />
          <rect x={1312} y={-200} width={38} height={1100} fill="#FFE38A" opacity={0.7} />
          <rect x={1470} y={-200} width={40} height={1100} fill="#C98F0A" />
        </g>
        <NPill text="4 تريليون $" x={1400} y={400} size={64} kind="gold" id="c8s17p" />
        {/* the start: a column so small it is a dot */}
        <rect x={dot.x - 9} y={dot.y - 7} width={18} height={7} rx={3} fill={GREEN} stroke={OUT} strokeWidth={2} />
        <circle cx={dot.x} cy={dot.y - 4} r={20} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.5 + 0.4 * Math.sin(t * 6)} />
      </g>
      <Magnifier t={t} at={T.million - 0.15} x={880} y={600} r={215} angle={50} id="c8s17m">
        <g>
          <rect x={-215} y={-215} width={430} height={430} fill="#120A30" />
          <line x1={-170} y1={110} x2={170} y2={110} stroke={PURPLE_L} strokeWidth={3} opacity={0.6} />
          <rect x={-40} y={40} width={80} height={70} rx={6} fill={GREEN} stroke={OUT} strokeWidth={6} />
          <g transform="translate(0 -40)">
            <NPill text="1 مليون $" x={0} y={0} size={50} kind="grey" id="c8s17mp" />
          </g>
        </g>
      </Magnifier>
    </g>
  );
};

// S18 · 524.96 · ★ «واليوم أغلب الناس اللي يبون يقرون قصة ياهو، يبحثون عنها في قوقل»
const QUERY = 'قصة ياهو';
const PAY = 528.45; // the gold «قوقل» lands 0.5 s before the word: the C09 stripe wipe covers the frame from 529.09
export const S18: React.FC<{t: number}> = ({t}) => {
  const chars = Array.from(QUERY);
  const t0 = T.yiqrun - 0.05, sp = (T.yahoo5 + 0.05 - t0) / chars.length;
  const n = t < t0 ? 0 : Math.min(chars.length, Math.floor((t - t0) / sp) + 1);
  const typed = chars.slice(0, n).join('');
  cueSfx('typing', 'c8s18-type', t >= t0 && t < t0 + sp * chars.length, BOX.x, {at: t0, gain: 0.55, sustain: true});
  const press = clamp01((t - (T.yabhath - 0.05)) / 0.25);
  cueSfx('click', 'c8s18-enter', t >= T.yabhath - 0.05 && t < T.yabhath + 0.2, BOX.x - 450, {at: T.yabhath});
  const spin = t >= T.yabhath + 0.1 && t < PAY;
  const push = 1 + 0.08 * ease.inOut(clamp01((t - T.s18) / (T.end + 0.4 - T.s18)));
  const crown = clamp01((t - T.yahoo5) / 0.4) * 0.8;
  const q = popAt(t, T.s18 + 0.05);
  const y = BOX.y - 20;
  return (
    <g>
      <NeonWeb t={t} id="c8s18w" cursors={false} />
      <g transform={`translate(${BOX.x} ${y}) scale(${push}) translate(${-BOX.x} ${-y})`}>
        <Glow x={BOX.x} y={y + 120} r={760} ry={360} color={t >= PAY ? GOLD : CYAN} o={0.35} id="c8s18g" />
        {t >= PAY && <g opacity={clamp01((t - PAY) / 0.25) * 0.8}><Rays t={t} id="c8s18r" tone="gold" x={BOX.x} y={y + 210} /></g>}
        <g transform={`translate(${BOX.x} ${y}) rotate(-2) scale(${q.s}) translate(${-BOX.x} ${-y})`} opacity={q.o}>
          <SBox t={t} x={BOX.x} y={y} typed={typed} press={press} crown={crown} id="c8s18b" w={BOX.w} />
        </g>
        {spin && (
          <g transform={`translate(${BOX.x} ${y + 210}) rotate(${t * 520})`}>
            <circle r={40} fill="none" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={12} />
            <path d="M0 -40 A40 40 0 0 1 40 0" fill="none" stroke={CYAN} strokeWidth={12} strokeLinecap="round" />
          </g>
        )}
        <NPill text="قوقل" x={BOX.x} y={y + 215} size={96} kind="gold" id="c8s18g2" p={(t - PAY) / 0.3} />
        {t >= PAY && [0, 1, 2, 3, 4, 5].map((i) => {
          const u = clamp01((t - PAY - i * 0.05) / 0.6);
          return <Sparkle key={i} x={BOX.x - 230 + i * 92} y={y + 215 + (i % 2 ? -95 : 95)} r={14 + (i % 3) * 6} o={Math.sin(u * Math.PI)} color={i % 2 ? '#FFFFFF' : GOLD} />;
        })}
      </g>
      {/* foreground: a few cursors drifting toward the box */}
      {[0, 1, 2].map((i) => {
        const [cx, cy] = [[260, 840], [1720, 820], [1640, 200]][i];
        return <Cursor key={i} x={cx + noise1(t * 0.5, i + 40) * 40} y={cy + noise1(t * 0.5 + 3, i + 40) * 30} s={1.3} color={i === 1 ? CYAN : '#FFFFFF'} o={0.55} rot={i === 0 ? -30 : 20} />;
      })}
    </g>
  );
};
