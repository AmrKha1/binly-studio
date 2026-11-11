// NIGHT PROPS — mystery + money devices of the AZTIKA look (references/universe-claude, GAP-CHECK P1):
// MysteryBox (gold "?" block, 0:09) · MysteryPillar (on a glowing gold column, 0:09 / 12:16) · MysteryTile (dark tile
// with a gold "?", 5:45) · ChoiceCards (two "?" cards that flip to the answer, 2:45) · BlueprintCard (a plan that is
// itself a "?", 7:08) · CloudWorld (dark cloudy sky = "nobody knows", 4:07 / 7:08) · Bill · Coin · MoneyPile (0:00,
// 5:03) · FlyingBills (a reward bursting out, 2:24) · CoinRain (6:56). Screen coordinates — use inside <NightScreen>.
// Sound: the flip of a choice card = soft swish; everything else silent (the voice carries it).
import React from 'react';
import {clamp01, ease, lerp, popRef, rand, spring} from './anim';
import {H, W} from './theme';
import {uid} from './stage';
import {nightFont, Sparkle} from './night';
import {isAr} from './lang';
import {cueSfx} from './sfx';

const WEIGHT = () => (isAr() ? 800 : 900);
const OUT = '#1A1408';
const Q = () => (isAr() ? '؟' : '?');

/** The "?" glyph in the heavy font. */
const QMark: React.FC<{size: number; color: string; y?: number; glow?: string; id?: string}> = ({size, color, y = 0, glow, id = 'q'}) => {
  const g = uid('nqm', id);
  return (
    <g>
      {glow && (
        <>
          <defs>
            <filter id={g} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation={size * 0.1} />
            </filter>
          </defs>
          <text x={0} y={y} fontSize={size} fontFamily={nightFont()} fontWeight={WEIGHT()} textAnchor="middle" dominantBaseline="central" fill={glow} filter={`url(#${g})`} opacity={0.8}>
            {Q()}
          </text>
        </>
      )}
      <text x={0} y={y} fontSize={size} fontFamily={nightFont()} fontWeight={WEIGHT()} textAnchor="middle" dominantBaseline="central" fill={color}>
        {Q()}
      </text>
    </g>
  );
};

/**
 * MysteryBox — glossy gold rounded block with a dark "?" (0:09, 13:30): thick dark outline, light top-left shine,
 * soft gold glow that breathes, slow float. size = side in px. Pops in at `at`.
 */
export const MysteryBox: React.FC<{t: number; at?: number; x: number; y: number; size?: number; id: string; float?: boolean; out?: number}> = ({t, at = -1, x, y, size = 240, id, float = true, out}) => {
  if (t < at) return null;
  // SOUND MAP (references/universe-claude/SOUND.md, measured 2026-11-10): the mystery box lands with a boom
  if (at >= 0) cueSfx('boom', `mbox-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125});
  const q = at >= 0 ? popRef(clamp01((t - at) / 0.3), 0.45, 0.3) : {sx: 1, sy: 1, o: 1};
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const g = uid('nmbox', id);
  const s = size, r = s * 0.16;
  const fl = float ? Math.sin(t * 1.4) * s * 0.03 : 0;
  const pulse = 0.75 + 0.25 * Math.sin(t * 2.2);
  return (
    <g transform={`translate(${x} ${y + fl}) scale(${q.sx} ${q.sy})`} opacity={q.o * fade}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE77A" />
          <stop offset="0.55" stopColor="#F7C832" />
          <stop offset="1" stopColor="#E9A912" />
        </linearGradient>
        <filter id={g + '__b'} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={s * 0.12} />
        </filter>
      </defs>
      <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={r} fill="#FFC928" opacity={0.6 * pulse} filter={`url(#${g}__b)`} />
      <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={r} fill={`url(#${g})`} stroke={OUT} strokeWidth={s * 0.045} />
      <rect x={-s / 2 + s * 0.09} y={-s / 2 + s * 0.08} width={s * 0.82} height={s * 0.2} rx={s * 0.1} fill="#FFFFFF" opacity={0.35} />
      <path d={`M${-s / 2 + s * 0.06} ${s / 2 - s * 0.16} Q${-s / 2 + s * 0.06} ${s / 2 - s * 0.06} ${-s / 2 + s * 0.16} ${s / 2 - s * 0.06} H${s / 2 - s * 0.16} Q${s / 2 - s * 0.06} ${s / 2 - s * 0.06} ${s / 2 - s * 0.06} ${s / 2 - s * 0.16}`} fill="none" stroke="#C98F0A" strokeWidth={s * 0.04} opacity={0.6} />
      <QMark size={s * 0.72} color={OUT} y={s * 0.04} />
    </g>
  );
};

/** MysteryPillar — the MysteryBox standing on a tall glowing gold column that rises from the floor (0:09, 12:16). base = floor y. */
export const MysteryPillar: React.FC<{t: number; at?: number; x: number; base?: number; h?: number; size?: number; id: string; out?: number}> = ({t, at = -1, x, base = 836, h = 300, size = 220, id, out}) => {
  if (t < at) return null;
  if (at >= 0) cueSfx('boom', `mpillar-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125}); // SOUND MAP
  const u = at >= 0 ? clamp01((t - at) / 0.5) : 1;
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const hh = h * ease.out(u); // grows like the reference podium (no bounce)
  const w = size * 0.72;
  const g = uid('nmpil', id);
  return (
    <g opacity={fade}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFE07A" />
          <stop offset="0.25" stopColor="#F5C223" />
          <stop offset="0.8" stopColor="#E0A20E" />
          <stop offset="1" stopColor="#B87F06" />
        </linearGradient>
        <linearGradient id={g + '__v'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#FFF1B0" stopOpacity="0.7" />
        </linearGradient>
        <filter id={g + '__b'} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={30} />
        </filter>
      </defs>
      <ellipse cx={x} cy={base} rx={w * 1.4} ry={40} fill="#FFC928" opacity={0.55} filter={`url(#${g}__b)`} />
      <rect x={x - w / 2 - 20} y={base - hh} width={w + 40} height={hh} fill="#FFC928" opacity={0.3} filter={`url(#${g}__b)`} />
      <rect x={x - w / 2} y={base - hh} width={w} height={hh} fill={`url(#${g})`} />
      <rect x={x - w / 2} y={base - hh} width={w} height={hh} fill={`url(#${g}__v)`} />
      {u > 0.6 && <MysteryBox t={t} at={at >= 0 ? at + 0.3 : -1} x={x} y={base - hh - size * 0.5 - 12} size={size} id={id + '__box'} />}
    </g>
  );
};

/** MysteryTile — a dark box with a glowing gold "?" (5:45 «في بيت ثاني...»): the unknown that is not the main mystery. */
export const MysteryTile: React.FC<{t: number; at?: number; x: number; y: number; w?: number; h?: number; id: string; out?: number}> = ({t, at = -1, x, y, w = 260, h = 170, id, out}) => {
  if (t < at) return null;
  if (at >= 0) cueSfx('thump', `mtile-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125}); // SOUND MAP: a tile lands
  const q = at >= 0 ? popRef(clamp01((t - at) / 0.3), 0.45, 0.3) : {sx: 1, sy: 1, o: 1};
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  return (
    <g transform={`translate(${x} ${y + Math.sin(t * 1.3) * 5}) scale(${q.sx} ${q.sy})`} opacity={q.o * fade}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.12} fill="#0B0A12" stroke="#2A2638" strokeWidth={4} />
      <QMark size={h * 0.75} color="#FFC928" glow="#FFB914" y={h * 0.03} id={id} />
    </g>
  );
};

export type Choice = {x: number; y: number; w?: number; h?: number; color?: 'gold' | 'cyan' | 'violet' | 'red'; reveal?: number; content?: React.ReactNode};
const CARD = {gold: ['#FFC928', '#E0A20E'], cyan: ['#57D9FA', '#2BB8E0'], violet: ['#B98BFF', '#8A4AF2'], red: ['#FF6B78', '#E83A4E']};
/**
 * ChoiceCards — big dark cards with a glowing border and a "?" (2:45: "rarity or prestige?"). Each card flips (scaleX
 * through 0, soft swish) at `reveal` to show `content` (any SVG: a GlowText, an icon, a HeroObject…) centred at 0,0.
 */
export const ChoiceCards: React.FC<{t: number; at: number; cards: Choice[]; id: string; out?: number}> = ({t, at, cards, id, out}) => {
  if (t < at) return null;
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  return (
    <g opacity={fade}>
      {cards.map((c, i) => {
        const w = c.w ?? 360, h = c.h ?? 460;
        const [col, deep] = CARD[c.color ?? (i % 2 ? 'cyan' : 'gold')];
        const p = clamp01((t - at - i * 0.15) / 0.3);
        if (p <= 0) return null;
        const q = popRef(p, 0.45, 0.3);
        const rv = c.reveal !== undefined ? clamp01((t - c.reveal) / 0.35) : 0;
        if (c.reveal !== undefined) cueSfx('swish', `${id}-flip-${i}`, t >= c.reveal && t < c.reveal + 0.35, c.x, {at: c.reveal, hit: 0.175}); // the card is edge-on at the middle of its flip
        const flipX = rv > 0 && rv < 1 ? Math.abs(Math.cos(rv * Math.PI)) : 1;
        const showBack = rv >= 0.5;
        const g = uid('nchoice', id, i);
        return (
          <g key={i} transform={`translate(${c.x} ${c.y + Math.sin(t * 1.2 + i) * 6}) scale(${q.sx * flipX} ${q.sy})`} opacity={q.o}>
            <defs>
              <filter id={g} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation={22} />
              </filter>
              <linearGradient id={g + '__f'} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2E1A5C" />
                <stop offset="1" stopColor="#1A0E3A" />
              </linearGradient>
            </defs>
            <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill={col} opacity={0.45} filter={`url(#${g})`} />
            <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill={`url(#${g}__f)`} stroke={col} strokeWidth={7} />
            <rect x={-w / 2 + 14} y={-h / 2 + 14} width={w - 28} height={h - 28} rx={24} fill="none" stroke={deep} strokeWidth={2} opacity={0.6} />
            {showBack && c.content ? c.content : <QMark size={Math.min(w, h) * 0.55} color={col} glow={deep} id={`${id}-${i}`} />}
          </g>
        );
      })}
    </g>
  );
};

/** BlueprintCard — a tilted blue plan sheet with a grid and a big glowing white "?" (7:08 «المشروع نفسه مو واضح»). */
export const BlueprintCard: React.FC<{t: number; at?: number; x: number; y: number; w?: number; h?: number; rot?: number; id: string}> = ({t, at = -1, x, y, w = 560, h = 380, rot = -6, id}) => {
  if (t < at) return null;
  const q = at >= 0 ? popRef(clamp01((t - at) / 0.35), 0.45, 0.3) : {sx: 1, sy: 1, o: 1};
  if (at >= 0) cueSfx('swish', `nblue-${id}-${at}`, t < at + 0.3, x, {at, hit: 0.125}); // SOUND MAP: a card flick
  const g = uid('nblue', id);
  return (
    <g transform={`translate(${x} ${y + Math.sin(t * 1.1) * 6}) rotate(${rot}) skewX(-4) scale(${q.sx} ${q.sy})`} opacity={q.o}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2F6FE0" />
          <stop offset="1" stopColor="#1C46A8" />
        </linearGradient>
        <clipPath id={g + '__k'}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} />
        </clipPath>
      </defs>
      <rect x={-w / 2 + 14} y={-h / 2 + 18} width={w} height={h} rx={10} fill="#000000" opacity={0.35} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={`url(#${g})`} />
      <g clipPath={`url(#${g}__k)`} stroke="#8DB6FF" strokeWidth={1.5} opacity={0.45}>
        {Array.from({length: Math.ceil(w / 28)}, (_, i) => <line key={'v' + i} x1={-w / 2 + i * 28} y1={-h / 2} x2={-w / 2 + i * 28} y2={h / 2} />)}
        {Array.from({length: Math.ceil(h / 28)}, (_, i) => <line key={'h' + i} x1={-w / 2} y1={-h / 2 + i * 28} x2={w / 2} y2={-h / 2 + i * 28} />)}
      </g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="none" stroke="#0E2A6E" strokeWidth={8} />
      <QMark size={h * 0.75} color="#EAF2FF" glow="#9CC2FF" id={id} />
    </g>
  );
};

/** CloudWorld — dark slate night sky with heavy rolling clouds (4:07 "?" in the clouds, 7:08): uncertainty, "nobody knows". */
export const CloudWorld: React.FC<{t: number; id: string}> = ({t, id}) => {
  const g = uid('ncloud', id);
  const row = (y: number, n: number, rr: number, col: string, speed: number, seed: number) => (
    <g fill={col}>
      {Array.from({length: n}, (_, i) => {
        const x = ((i / n) * (W + 400) + t * speed + rand(seed + i) * 80) % (W + 400) - 200;
        const r = rr * (0.7 + rand(seed + i * 3) * 0.6);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={r} />
            <circle cx={x + r * 0.9} cy={y + r * 0.25} r={r * 0.75} />
            <circle cx={x - r * 0.9} cy={y + r * 0.3} r={r * 0.7} />
          </g>
        );
      })}
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141A2B" />
          <stop offset="0.6" stopColor="#252C42" />
          <stop offset="1" stopColor="#2E3550" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      {row(70, 7, 120, '#2A3148', 6, 1)}
      {row(30, 6, 110, '#1E2436', 10, 5)}
      {row(H - 130, 8, 150, '#3A4259', 8, 9)}
      {row(H - 30, 7, 170, '#2B3247', 14, 13)}
    </g>
  );
};

/** Bill — one green banknote with a white "$" seal (0:00). w = width; rot = degrees; tilt 0..1 = seen edge-on (flutter). */
export const Bill: React.FC<{x: number; y: number; w?: number; rot?: number; tilt?: number}> = ({x, y, w = 150, rot = 0, tilt = 1}) => {
  const h = w * 0.48;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(1 ${Math.max(0.12, tilt)})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.06} fill="#2FA25B" stroke="#0F4F2A" strokeWidth={w * 0.03} />
      <rect x={-w / 2 + w * 0.07} y={-h / 2 + h * 0.13} width={w * 0.86} height={h * 0.74} rx={w * 0.04} fill="#45C474" stroke="#BFF3D2" strokeWidth={w * 0.015} />
      <circle r={h * 0.27} fill="#E9FFF1" stroke="#0F4F2A" strokeWidth={w * 0.015} />
      <text x={0} y={h * 0.02} fontSize={h * 0.36} fontFamily="Arial Black, sans-serif" fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#1D7A43">
        $
      </text>
    </g>
  );
};

/** Coin — gold coin with a "$", spinning around its vertical axis when spin is set (radians/s). */
export const Coin: React.FC<{x: number; y: number; r?: number; t?: number; spin?: number; phase?: number}> = ({x, y, r = 34, t = 0, spin = 0, phase = 0}) => {
  const k = spin ? Math.cos(t * spin + phase) : 1;
  const sx = Math.max(0.12, Math.abs(k));
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} 1)`}>
      <circle r={r} fill="#C98F0A" stroke={OUT} strokeWidth={r * 0.1} />
      <circle r={r * 0.8} fill="#FFC928" />
      <circle r={r * 0.62} fill="none" stroke="#E0A20E" strokeWidth={r * 0.08} />
      {sx > 0.4 && (
        <text x={0} y={r * 0.04} fontSize={r * 0.9} fontFamily="Arial Black, sans-serif" fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#B07A06">
          $
        </text>
      )}
    </g>
  );
};

/**
 * MoneyPile — a mound of banknotes (0:00 «11.4 تريليون $», 5:03): rows of bills, wide at the bottom, a few coins, a soft
 * green glow. s = scale (1 ≈ 520 px wide). grow 0..1 builds it from the bottom row up. A few bills flutter above it.
 */
export const MoneyPile: React.FC<{t: number; x: number; y: number; s?: number; grow?: number; id: string; flutter?: boolean}> = ({t, x, y, s = 1, grow = 1, id, flutter = true}) => {
  const g = uid('nmoney', id);
  const rows = 7;
  const bills: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const n = rows - r + 2;
    const shown = clamp01(grow * rows - r);
    if (shown <= 0) continue;
    for (let i = 0; i < n; i++) {
      const bx = (i - (n - 1) / 2) * 62 + (rand(r * 31 + i) - 0.5) * 22;
      const by = -r * 34 - 20 + (rand(r * 17 + i * 3) - 0.5) * 10;
      bills.push(<Bill key={`${r}-${i}`} x={bx} y={by + (1 - shown) * 40} w={128} rot={(rand(r * 7 + i) - 0.5) * 40} />);
    }
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <filter id={g} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={50} />
        </filter>
      </defs>
      <ellipse cx={0} cy={-90} rx={300} ry={170} fill="#2EE88B" opacity={0.22 * grow} filter={`url(#${g})`} />
      <ellipse cx={0} cy={4} rx={290} ry={26} fill="#000000" opacity={0.35} />
      {bills}
      {grow >= 1 && [[-160, -10], [150, -14], [40, -6], [-60, -150], [90, -190]].map(([cx, cy], i) => <Coin key={i} x={cx} y={cy} r={22} />)}
      {flutter && grow >= 1 && Array.from({length: 4}, (_, i) => {
        const ph = t * 0.9 + i * 1.7;
        return <Bill key={'f' + i} x={(rand(i * 5 + 1) - 0.5) * 420 + Math.sin(ph) * 20} y={-300 - rand(i * 3) * 140 + Math.cos(ph * 0.7) * 16} w={92} rot={Math.sin(ph) * 25 + i * 30} tilt={Math.abs(Math.cos(ph))} />;
      })}
      {grow >= 1 && Array.from({length: 4}, (_, i) => {
        const tw = Math.max(0, Math.sin(t * 2.3 + i * 1.9));
        return tw > 0.1 ? <Sparkle key={'s' + i} x={(rand(i * 9) - 0.5) * 380} y={-40 - rand(i * 4) * 220} r={8 + 12 * tw} o={tw} /> : null;
      })}
    </g>
  );
};

/** FlyingBills — banknotes burst up out of (x, y) and flutter down around it (2:24 the reward, a jackpot). */
export const FlyingBills: React.FC<{t: number; at: number; x: number; y: number; n?: number; spread?: number; dur?: number; w?: number}> = ({t, at, x, y, n = 14, spread = 520, dur = 3, w = 90}) => {
  const e = t - at;
  if (e < 0 || e > dur + 1) return null;
  cueSfx('whoosh', `nbills-${x}-${y}-${at}`, e < 0.3, x, {at, hit: 0.2}); // SOUND MAP: things fly out → one whoosh (never per bill)
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const vx = (rand(i * 7 + 1) - 0.5) * spread * 1.4, vy = -(500 + rand(i * 3) * 500);
        const tt = Math.max(0, e - rand(i * 11) * 0.3);
        const gy = 520; // gentle gravity + air drag = flutter
        const px = x + vx * (1 - Math.exp(-tt * 1.6)) / 1.6 + Math.sin(tt * 3 + i) * 30;
        const py = y + vy * (1 - Math.exp(-tt * 1.6)) / 1.6 + gy * tt * tt * 0.5 * 0.6;
        const o = clamp01(tt / 0.1) * (1 - clamp01((e - dur) / 1));
        return (
          <g key={i} opacity={o}>
            <Bill x={px} y={py} w={w} rot={tt * (rand(i) - 0.5) * 300} tilt={Math.abs(Math.cos(tt * 4 + i))} />
          </g>
        );
      })}
    </g>
  );
};

/** CoinRain — gold coins falling and spinning through the frame (6:56, 3:55). From `at`, for `dur` s (coins keep falling past it). */
export const CoinRain: React.FC<{t: number; at: number; n?: number; x0?: number; x1?: number; r?: number; dur?: number; speed?: number}> = ({t, at, n = 16, x0 = 0, x1 = W, r = 30, dur = 4, speed = 420}) => {
  const e = t - at;
  if (e < 0) return null;
  cueSfx('sparkle', `ncoinrain-${x0}-${at}`, e < 0.3, (x0 + x1) / 2, {at, hit: 0.3}); // SOUND MAP: money → one shimmer (never per coin)
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const start = rand(i * 13 + 2) * dur;
        const tt = e - start;
        if (tt < 0) return null;
        const y = -60 + tt * speed * (0.8 + rand(i * 5) * 0.4);
        if (y > H + 60) return null;
        const x = lerp(x0, x1, rand(i * 7 + 1)) + Math.sin(tt * 2 + i) * 14;
        return <Coin key={i} x={x} y={y} r={r * (0.7 + rand(i * 3) * 0.5)} t={t} spin={4 + rand(i) * 3} phase={i} />;
      })}
    </g>
  );
};

