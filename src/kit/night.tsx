// NIGHT — the AZTIKA look (owner 2026-11-08: copy the model video's style as it is).
// Every value here was MEASURED from references/universe-claude (see references/universe-claude/STYLE-BIBLE.md).
// Pieces: NightScreen (screen coordinates, no RTL mirroring) · NightSky · GridFloor · GlowText (4-layer bold glowing
// text) · WordPop (word-by-word headline) · NPill (gold/white/grey/cyan) · Podium · RevealRing · Sparkle · YearBadge.
import React from 'react';
import {measureText} from '@remotion/layout-utils';
import {clamp01, ease, lerp, popIn, rand, spring} from './anim';
import {ImageHost} from './image-host';
import type {HostMove} from './host';
import {FONT_AR, isAr} from './lang';
import {FONT_SERIF, H, W} from './theme';
import {uid} from './stage';
import {cueSfx} from './sfx';

/** Measured palette (STYLE-BIBLE §3). */
export const N = {
  skyTop: '#0F062B',
  skyMid: '#181944',
  skySide: '#1D0B30',
  haze: '#3A1A7A',
  horizon: '#8A4AF2',
  floor: '#1E0D48',
  floorDeep: '#12072E',
  grid: '#7B4BE0',
  gold: '#FCC018',
  goldDeep: '#F2B010',
  goldPill: '#F5C223',
  goldPillTop: '#F2CA50',
  goldInk: '#2A1A00',
  white: '#FFFFFF',
  whiteLow: '#D8D8E0',
  grey: '#C4C5CC',
  greyPill: '#D9D9E3',
  greyInk: '#3A3A4A',
  cyan: '#57D9FA',
  cyanLow: '#34D2FA',
  cyanInk: '#04212B',
  outline: '#05030F',
  green: '#139F66',
  greenLight: '#39B17E',
  greenDark: '#0E8351',
  greenTop: '#4EB081',
  greenGlow: '#2BE08A',
  badge: '#141414',
} as const;

export type Tone = 'white' | 'gold' | 'grey' | 'cyan' | 'red' | 'green';
const TONE: Record<Tone, {top: string; low: string; glow: string}> = {
  white: {top: N.white, low: N.whiteLow, glow: '#E6F2FF'},
  gold: {top: '#FFCB2A', low: '#FFB914', glow: N.gold},
  grey: {top: '#DADBE0', low: N.grey, glow: '#C9CBD6'},
  cyan: {top: '#7FE6FF', low: N.cyanLow, glow: N.cyan},
  red: {top: '#FF6B78', low: '#FD4B5B', glow: '#FF2E4D'}, // «انسرقت!» 1:14.3 (measured #FD4B5B) — bad news, twists, war
  green: {top: '#7BF0A8', low: '#2EE88B', glow: '#22C55E'}, // money won, «مكافأة» — good news
};

/** The display face: heavy rounded Arabic (Baloo Bhaijaan 2 800); English → Poppins 900. */
export const nightFont = () => (isAr() ? FONT_AR : FONT_SERIF);
const WEIGHT = () => (isAr() ? 800 : 900);
export const textWidth = (text: string, size: number) => measureText({text, fontFamily: nightFont(), fontSize: size, fontWeight: String(WEIGHT())}).width;

/**
 * Screen coordinates for night scenes: children are NOT mirrored in Arabic (we copy the reference's layout exactly —
 * headlines top-right, host bottom-left). Use it as the first child of <Stage>.
 */
export const NightScreen: React.FC<{children?: React.ReactNode}> = ({children}) =>
  isAr() ? (
    // Undo the Stage's RTL mirror with an exact matrix (not the CSS fill-box flip, which shifts the scene whenever
    // artwork reaches past the frame edges); k-nomirror keeps every text un-flipped inside.
    <g className="k-nomirror" style={{scale: 'none', transformBox: 'view-box', transformOrigin: '0px 0px'}} transform={`matrix(-1 0 0 1 ${W} 0)`}>
      {children}
    </g>
  ) : (
    <g>{children}</g>
  );

/** Deep indigo space with twinkling stars and 4-point sparkles (0:26.2). horizonY = where the floor starts. */
export const NightSky: React.FC<{t: number; id?: string; horizonY?: number; stars?: number}> = ({t, id = 'sky', horizonY = 836, stars = 70}) => {
  const g = uid('nsky', id);
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={N.skyTop} />
          <stop offset="0.5" stopColor="#1E0D4A" />
          <stop offset="0.88" stopColor="#311463" />
          <stop offset="1" stopColor={N.haze} />
        </linearGradient>
        <radialGradient id={g + '__v'} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#05010F" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={horizonY} fill={`url(#${g})`} />
      <defs>
        <radialGradient id={g + "__r"} cx="0.75" cy="0.3" r="0.6">
          <stop offset="0" stopColor="#3A1590" stopOpacity="0.55" />
          <stop offset="1" stopColor="#3A1590" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={horizonY} fill={`url(#${g}__r)`} />
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g}__v)`} />
      {Array.from({length: stars}, (_, i) => {
        const x = rand(i * 7 + 1) * W, y = rand(i * 13 + 5) * (horizonY - 60);
        const tw = 0.55 + 0.45 * Math.sin(t * (1.2 + rand(i) * 2) + i);
        return i % 9 === 0 ? <Sparkle key={i} x={x} y={y} r={7 + rand(i + 3) * 5} o={0.5 + 0.5 * tw} /> : <circle key={i} cx={x} cy={y} r={1 + rand(i + 9) * 1.6} fill="#FFFFFF" opacity={0.35 + 0.5 * tw} />;
      })}
    </g>
  );
};

/** 4-point sparkle star. */
export const Sparkle: React.FC<{x: number; y: number; r?: number; o?: number; color?: string}> = ({x, y, r = 10, o = 1, color = '#FFFFFF'}) => {
  const k = r * 0.22;
  return <path d={`M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r}Z`} fill={color} opacity={o} />;
};

/** Synthwave floor: glowing purple horizon line + perspective grid (0:26.2). */
export const GridFloor: React.FC<{y?: number; id?: string; t?: number}> = ({y = 836, id = 'floor', t = 0}) => {
  const g = uid('nflr', id);
  const vx = W / 2, vy = y - 260; // vanishing point above the horizon → gentle perspective
  const verticals = Array.from({length: 41}, (_, i) => -2400 + i * 120);
  const rows = Array.from({length: 9}, (_, i) => y + Math.pow((i + 1 + ((t * 0.6) % 1)) / 9, 2.1) * (H - y + 40));
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2C1460" />
          <stop offset="0.35" stopColor={N.floor} />
          <stop offset="1" stopColor={N.floorDeep} />
        </linearGradient>
        <linearGradient id={g + '__f'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={N.grid} stopOpacity="0.55" />
          <stop offset="1" stopColor={N.grid} stopOpacity="0.12" />
        </linearGradient>
        <filter id={g + '__b'} x="-10%" y="-400%" width="120%" height="900%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <rect x={0} y={y} width={W} height={H - y} fill={`url(#${g})`} />
      <g stroke={`url(#${g}__f)`} strokeWidth={1.6}>
        {verticals.map((bx, i) => {
          const k = (y - vy) / (H + 40 - vy);
          return <line key={i} x1={vx + (bx + W / 2 - vx) * k} y1={y} x2={bx + W / 2} y2={H + 40} />;
        })}
        {rows.map((ry, i) => <line key={'r' + i} x1={0} y1={ry} x2={W} y2={ry} opacity={0.3 + 0.7 * ((ry - y) / (H - y))} />)}
      </g>
      <rect x={0} y={y - 70} width={W} height={90} fill={N.horizon} opacity={0.28} filter={`url(#${g}__b)`} />
      <rect x={0} y={y - 22} width={W} height={44} fill="#A06BFF" opacity={0.45} filter={`url(#${g}__b)`} />
      <rect x={0} y={y - 2} width={W} height={4} fill="#B98BFF" />
    </g>
  );
};

/**
 * GlowText — the reference's text recipe (STYLE-BIBLE §1): soft colour glow → thick dark outline (also in the holes) →
 * gradient fill (white fades to light grey; gold #FCC018). x/y = centre of the text. pulse = 0..1 glow breathing.
 */
export const GlowText: React.FC<{text: string; x: number; y: number; size: number; tone?: Tone; id: string; glow?: number; outline?: number; anchor?: 'middle' | 'start' | 'end'}> = ({
  text, x, y, size, tone = 'white', id, glow = 1, outline = 1, anchor = 'middle',
}) => {
  const c = TONE[tone];
  const g = uid('ngt', id);
  const common = {x, y, fontSize: size, fontFamily: nightFont(), fontWeight: WEIGHT(), textAnchor: anchor, dominantBaseline: 'central' as const};
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.15" stopColor={c.top} />
          <stop offset="1" stopColor={c.low} />
        </linearGradient>
        <filter id={g + '__b'} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation={size * 0.11} />
        </filter>
      </defs>
      {glow > 0 && <text {...common} fill={c.glow} stroke={c.glow} strokeWidth={size * 0.16} strokeLinejoin="round" opacity={0.55 * glow} filter={`url(#${g}__b)`}>{text}</text>}
      {outline > 0 && <text {...common} fill={N.outline} stroke={N.outline} strokeWidth={size * 0.14 * outline} strokeLinejoin="round" opacity={0.72}>{text}</text>}
      <text {...common} fill={`url(#${g})`} stroke="none">{text}</text>
    </g>
  );
};

export type PopWord = {w: string; at: number; tone?: Tone};
/**
 * WordPop — headline built word by word on the spoken words (0:25.5): each word scales 0.3 → ~1.08 → 1 in ~0.15 s.
 * Right-to-left in Arabic: `right` = right edge of the line (screen coords). English: `left` = left edge.
 * Glow breathes slowly while the line holds.
 */
export const WordPop: React.FC<{t: number; words: PopWord[]; y: number; size: number; right?: number; left?: number; id: string; gap?: number; out?: number}> = ({
  t, words, y, size, right, left, id, gap, out,
}) => {
  const sp = gap ?? size * 0.2;
  const ws = words.map((w) => textWidth(w.w, size));
  const rtl = isAr();
  let cursor = rtl ? (right ?? W - 120) : (left ?? 120);
  const pulse = 0.85 + 0.15 * Math.sin(t * 2.4);
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.15) : 1;
  return (
    <g opacity={fade}>
      {words.map((w, i) => {
        const cx = rtl ? cursor - ws[i] / 2 : cursor + ws[i] / 2;
        cursor = rtl ? cursor - ws[i] - sp : cursor + ws[i] + sp;
        const p = clamp01((t - w.at) / 0.22);
        if (p <= 0) return null;
        const q = popIn(p, 0.45, 0.3);
        return (
          <g key={i} transform={`translate(${cx} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
            <GlowText text={w.w} x={0} y={0} size={size} tone={w.tone ?? 'white'} id={`${id}-${i}`} glow={pulse} />
          </g>
        );
      })}
    </g>
  );
};

export type PillKind = 'gold' | 'white' | 'grey' | 'cyan' | 'red' | 'green' | 'dark';
const PILL: Record<PillKind, {top: string; low: string; ink: string; glow: string}> = {
  gold: {top: N.goldPillTop, low: N.goldPill, ink: N.goldInk, glow: N.gold},
  white: {top: '#FFFFFF', low: '#ECECF2', ink: '#1A1A2E', glow: '#FFFFFF'},
  grey: {top: '#E4E4EC', low: N.greyPill, ink: N.greyInk, glow: '#B8B8C8'},
  cyan: {top: '#7FE6FF', low: N.cyanLow, ink: N.cyanInk, glow: N.cyan},
  red: {top: '#FF6B78', low: '#E83A4E', ink: '#FFFFFF', glow: '#FF2E4D'}, // «شي أكبر...» 9:02 · «أقل من إنك تقدر تشوفها» 12:16
  green: {top: '#4BEA92', low: '#22C55E', ink: '#04210F', glow: '#22C55E'}, // «لما العالم يتعاون» 8:40 · ✔ answers
  dark: {top: '#2A2440', low: '#1A1530', ink: '#FFFFFF', glow: '#000000'}, // quiet tag on bright scenes
};
/** NPill — rounded capsule label with soft glow (gold = now/hero, white = before, grey = small/old, cyan = topic). x,y = centre. */
export const NPill: React.FC<{text: string; x: number; y: number; size?: number; kind?: PillKind; id: string; p?: number}> = ({text, x, y, size = 44, kind = 'gold', id, p = 1}) => {
  if (p <= 0) return null;
  const k = PILL[kind];
  const g = uid('npl', id);
  const h = size * 1.65, w = textWidth(text, size) + size * 1.5;
  const q = popIn(p, 0.45, 0.2);
  return (
    <g transform={`translate(${x} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={k.top} />
          <stop offset="1" stopColor={k.low} />
        </linearGradient>
        <filter id={g + '__b'} x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation={size * 0.32} />
        </filter>
      </defs>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={k.glow} opacity={0.55} filter={`url(#${g}__b)`} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={`url(#${g})`} />
      <text x={0} y={size * 0.04} fontSize={size} fontFamily={nightFont()} fontWeight={WEIGHT()} textAnchor="middle" dominantBaseline="central" fill={k.ink} stroke={k.ink} strokeWidth={size * 0.035} strokeLinejoin="round" paintOrder="stroke">
        {text}
      </text>
    </g>
  );
};

/** Glowing 3D green podium (0:26.2): front + light left facet + dark right side + lighter top. x = centre, base = floor y. */
export const Podium: React.FC<{x: number; base: number; w: number; h: number; id: string; grow?: number; color?: 'green' | 'gold' | 'red'}> = ({x, base, w, h, id, grow = 1, color = 'green'}) => {
  const hh = h * spring(clamp01(grow), 0.3);
  if (hh <= 1) return null;
  const pal = color === 'green' ? ['#1BC077', '#3FD58F', '#0B895B', '#5BE3A0', N.greenGlow] : color === 'gold' ? ['#F2B010', '#FFD45A', '#C98F0A', '#FFE08A', '#FFC928'] : color === 'red' ? ['#D2363A', '#E86367', '#A8262A', '#F08A8D', '#FF5A60'] : [N.green, N.greenLight, N.greenDark, N.greenTop, N.greenGlow];
  const g = uid('npd', id);
  const r = Math.min(18, w * 0.08);
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pal[3]} />
          <stop offset="0.1" stopColor={pal[0]} />
          <stop offset="1" stopColor={pal[2]} />
        </linearGradient>
        <filter id={g + '__b'} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={22} />
        </filter>
      </defs>
      <rect x={x - w / 2 - 6} y={base - hh - 6} width={w + 12} height={hh + 6} rx={r} fill={pal[4]} opacity={0.35} filter={`url(#${g}__b)`} />
      <path d={`M${x - w / 2} ${base} V${base - hh + r} Q${x - w / 2} ${base - hh} ${x - w / 2 + r} ${base - hh} H${x + w / 2 - r} Q${x + w / 2} ${base - hh} ${x + w / 2} ${base - hh + r} V${base} Z`} fill={`url(#${g})`} />
      <rect x={x - w / 2} y={base - hh + r} width={w * 0.2} height={hh - r} fill={pal[1]} opacity={0.75} />
      <rect x={x + w / 2 - w * 0.2} y={base - hh + r} width={w * 0.2} height={hh - r} fill={pal[2]} opacity={0.85} />
    </g>
  );
};

/** Reveal burst when something appears (0:25.2): thin gold ring expands + fades, sparkles spray out. */
export const RevealRing: React.FC<{t: number; at: number; x: number; y: number; r?: number; color?: string}> = ({t, at, x, y, r = 230, color = '#F5D27A'}) => {
  cueSfx('sparkle', `ring-${x}-${y}-${at}`, t >= at && t < at + 0.7, x, {gain: 0.6});
  const p = (t - at) / 0.7;
  if (p < 0 || p > 1) return null;
  const e = 1 - Math.pow(1 - p, 3);
  return (
    <g>
      <circle cx={x} cy={y} r={r * (0.35 + 0.65 * e)} fill="none" stroke={color} strokeWidth={3} opacity={(1 - p) * 0.9} />
      {Array.from({length: 14}, (_, i) => {
        const a = rand(i * 3 + 1) * Math.PI * 2, d = r * (0.25 + 0.75 * e) * (0.5 + rand(i * 5) * 0.6);
        return <Sparkle key={i} x={x + Math.cos(a) * d} y={y + Math.sin(a) * d} r={5 + rand(i) * 7} o={1 - p} color={i % 3 ? '#FFE08A' : '#FFFFFF'} />;
      })}
    </g>
  );
};

/** Year badge (0:40.5): black tile + gold border + gold digits, «سنة» pill on top, place pill below. Counts from `from`. */
export const YearBadge: React.FC<{t: number; at: number; year: number; from?: number; x: number; y: number; label?: string; place?: string; id: string; size?: number}> = ({
  t, at, year, from, x, y, label, place, id, size = 120,
}) => {
  const p = clamp01((t - at) / 0.25);
  if (p <= 0) return null;
  const steps = from !== undefined ? Math.abs(year - from) : 0;
  const k = steps ? Math.min(steps, Math.floor((t - at) / 0.1)) : 0;
  const shown = from !== undefined ? from + Math.sign(year - from) * k : year;
  const w = textWidth(String(year), size) + size * 0.8, h = size * 1.4; // measured 0:40.6: box ≈ 1.4× the digit size
  const q = popIn(p, 0.45, 0.4);
  return (
    <g transform={`translate(${x} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={size * 0.22} fill={N.badge} stroke={N.gold} strokeWidth={size * 0.045} />
      <GlowText text={String(shown)} x={0} y={size * 0.04} size={size} tone="gold" id={id + '__n'} outline={0.5} />
      {label && <NPill text={label} x={0} y={-h / 2} size={size * 0.3} kind="gold" id={id + '__l'} />}
      {place && <NPill text={place} x={0} y={h / 2} size={size * 0.3} kind="white" id={id + '__p'} />}
    </g>
  );
};

/**
 * HostGlow — the reference host treatment (0:16.4, 0:26.2): thin gold rim line around the silhouette + soft gold glow.
 * Wrap any character: <HostGlow id="h"><Host …/></HostGlow>. rim = line width px, glow = 0..1.
 */
export const HostGlow: React.FC<{id: string; rim?: number; glow?: number; color?: string; children?: React.ReactNode}> = ({id, rim = 4, glow = 1, color = '#FFC928', children}) => {
  const f = uid('nhg', id);
  return (
    <g>
      <defs>
        <filter id={f} x="-25%" y="-15%" width="150%" height="130%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius={rim} result="fat" />
          <feFlood floodColor={color} result="col" />
          <feComposite in="col" in2="fat" operator="in" result="rim" />
          <feGaussianBlur in="rim" stdDeviation={18} result="halo" />
          <feComponentTransfer in="halo" result="halo2">
            <feFuncA type="linear" slope={0.7 * glow} />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="halo2" />
            <feMergeNode in="rim" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${f})`}>{children}</g>
    </g>
  );
};

/**
 * Named spots (safe, tested positions; screen coords, Arabic night scenes). Pick by INTENT, not coordinates.
 * side*: presenter beside the action (default) · close*: big, near the camera, talking to the viewer · peek*: rises from
 * the bottom edge (an aside, a thought) · small*: little in a lower corner while the scene is the star · off: not in frame.
 */
export const SPOTS = {
  sideLeft: {x: 420, y: 1068, h: 340},
  sideRight: {x: 1500, y: 1068, h: 340},
  closeLeft: {x: 520, y: 1180, h: 470},
  closeRight: {x: 1400, y: 1180, h: 470},
  peekLeft: {x: 260, y: 1250, h: 360},
  peekRight: {x: 1660, y: 1250, h: 360},
  smallLeft: {x: 190, y: 1060, h: 220},
  smallRight: {x: 1730, y: 1060, h: 220},
} as const;
export type SpotName = keyof typeof SPOTS;

/**
 * Reason recipes — every move/pose has a story reason (owner 2026-11-08: alive, but smooth and never too much).
 * present: shows the stage/object · point: aims at the new thing · react: shock at a number/twist · viewer: talks to the
 * viewer (wink/thumbs) · welcome: greets/opens · think: a question/doubt · room: steps aside so the subject can be big ·
 * joy: a win · shrug: "who knows / that's it".
 */
export const BEAT_POSE = {
  present: 'full-present', point: 'full-point-right', react: 'full-surprised', viewer: 'full-thumbsup-wink', welcome: 'full-welcome',
  think: 'full-thinking', room: 'full-present', joy: 'full-jump-joy', shrug: 'full-shrug', doubt: 'full-skeptical', scared: 'full-scared',
} as const;
export type BeatReason = keyof typeof BEAT_POSE;

export type HostSpot = {at: number; spot?: SpotName; x?: number; y?: number; h?: number; flip?: boolean; move?: 'hop' | 'glide' | 'walk'; dur?: number};
const place = (s: HostSpot) => ({...(s.spot ? SPOTS[s.spot] : {x: W / 2, y: 1068, h: 340}), ...(s.x !== undefined ? {x: s.x} : {}), ...(s.y !== undefined ? {y: s.y} : {}), ...(s.h !== undefined ? {h: s.h} : {})});
/**
 * HostTrack — AZTIKA alive in the frame (owner 2026-11-08): he moves to wherever is best for the viewer — left, right,
 * centre-front close to the camera (big), peeking up from the bottom, small up high — between beats.
 * spots: where he stands from each time on (x = centre, y = feet, h = size as in ImageHost). Moves take `dur`
 * (default 0.55 s): 'hop' (default: a springy arc jump with squash), 'glide' (smooth slide), 'walk' (stepping).
 * He faces the centre automatically (flipped when he stands right of centre) unless the spot sets flip.
 * enter/exit = ImageHost moves (pop, rise, drop, peek, slide…). Wrapped in HostGlow (gold rim).
 */
export const HostTrack: React.FC<{t: number; spots: HostSpot[]; poses: [number, BeatReason | string][]; id: string; enter?: HostMove; exit?: HostMove; glow?: boolean}> = ({
  t, spots, poses, id, enter, exit, glow = true,
}) => {
  let i = 0;
  for (let k = 0; k < spots.length; k++) if (t >= spots[k].at) i = k;
  const cur = spots[i], prev = spots[Math.max(0, i - 1)];
  const P = place(prev), Q = place(cur);
  const dur = cur.dur ?? (cur.move === 'walk' ? 1.1 : 0.55);
  const u = i > 0 ? clamp01((t - cur.at) / dur) : 1;
  const kind = cur.move ?? 'hop';
  const e = kind === 'hop' ? spring(u, 0.25) : ease.inOut(u);
  const x = lerp(P.x, Q.x, e), y0 = lerp(P.y, Q.y, e), h = lerp(P.h, Q.h, e);
  const moving = u > 0 && u < 1;
  if (i > 0) cueSfx('swish', `${id}-move@${cur.at}`, moving, x, {gain: 0.35});
  const lift = moving ? (kind === 'hop' ? Math.sin(Math.PI * Math.min(1, u * 1.15)) * 70 : kind === 'walk' ? Math.abs(Math.sin(u * Math.PI * 5)) * 14 : 0) : 0;
  const faceOf = (s: HostSpot) => s.flip ?? place(s).x > W / 2;
  const flip = moving && u < 0.5 ? faceOf(prev) : faceOf(cur);
  const ps = poses.map(([at, p]) => [at, (BEAT_POSE as Record<string, string>)[p] ?? p] as [number, string]);
  const el = <ImageHost t={t} x={x} y={y0 - lift} h={h} poses={ps} flip={flip} shadow={false} swapSfx={false} enter={enter} exit={exit} id={id} />;
  return glow ? <HostGlow id={id}>{el}</HostGlow> : el;
};
