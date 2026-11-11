// NIGHT-UI — screens & app UI for AZTIKA stories set in the modern world (owner 2026-11-11): a laptop, a phone, a
// message card, a video call, a download bar, a bank transfer, a search box, a wallet balance and an alert banner.
// Built in the reference's look (references/universe-claude/STYLE-BIBLE.md): deep indigo glossy panels, thick dark
// outlines, one soft highlight, gold/cyan glow, heavy Arabic text — never a flat wireframe, never a real app or logo
// (brand NAMES only, as text). Use inside <NightScreen> (screen coordinates; text reads right-to-left in Arabic).
// Every piece: `t` (absolute time), `at` (entrance), `id` (unique, ASCII), optional `out` (exit = the reference's
// flyOut). Entrances use the reference curves (popRef pop / ease.out slide); sounds follow SOUND.md via cueSfx.
import React from 'react';
import {clamp01, countCurve, ease, flyOut, lerp, popRef, pressIn} from './anim';
import {isAr} from './lang';
import {GlowText, N, NPill, nightFont, textWidth} from './night';
import type {PillKind} from './night';
import {uid} from './stage';
import {cueSfx} from './sfx';

const OUT = N.outline;
const WT = 800;
const L = (ar: string, en: string) => (isAr() ? ar : en);
const RED = '#FD4B5B';
const GREEN = '#22C55E';
const CYAN = N.cyan;
const GOLD = '#FFC928';

/** pop entrance + flyOut exit in one: null when not visible. */
const life = (t: number, at: number, out?: number, dirY = 1) => {
  const p = (t - at) / 0.3;
  if (p <= 0) return null;
  const q = popRef(p);
  const f = flyOut(t, out, 0, dirY);
  const o = q.o * f.o;
  if (o <= 0.001) return null;
  return {s: q.s, o, dx: f.dx, dy: f.dy};
};

/** Heavy text with a dark outline (paint-order stroke) — the reference's UI text. */
const Txt: React.FC<{x: number; y: number; size: number; text: string; fill?: string; anchor?: 'start' | 'middle' | 'end'; outline?: number; o?: number}> = ({
  x, y, size, text, fill = '#FFFFFF', anchor = 'middle', outline = 1, o = 1,
}) => (
  <text x={x} y={y} fontSize={size} fontFamily={nightFont()} fontWeight={WT} textAnchor={anchor} dominantBaseline="central" fill={fill}
    stroke={OUT} strokeWidth={size * 0.13 * outline} strokeLinejoin="round" paintOrder="stroke" opacity={o}>
    {text}
  </text>
);

/** start-side anchor: Arabic text starts at the RIGHT edge. */
const startAt = (left: number, right: number) => (isAr() ? {x: right, anchor: 'end' as const} : {x: left, anchor: 'start' as const});
const endAt = (left: number, right: number) => (isAr() ? {x: left, anchor: 'start' as const} : {x: right, anchor: 'end' as const});

const wrap = (text: string, size: number, maxW: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (cur && textWidth(test, size) > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
};

/** Glossy night panel: soft colour glow · gradient body · thick outline · inner rim light · diagonal sheen. x,y = top-left. */
const Panel: React.FC<{x: number; y: number; w: number; h: number; r?: number; id: string; top?: string; low?: string; glow?: string; glowO?: number; sw?: number}> = ({
  x, y, w, h, r = 36, id, top = '#2E2760', low = '#151130', glow, glowO = 0.5, sw = 8,
}) => {
  const g = uid('nuip', id);
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={low} />
        </linearGradient>
        <filter id={g + '__b'} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={34} />
        </filter>
        <clipPath id={g + '__c'}>
          <rect x={x} y={y} width={w} height={h} rx={r} />
        </clipPath>
      </defs>
      {glow && glowO > 0 && <rect x={x} y={y} width={w} height={h} rx={r} fill={glow} opacity={glowO} filter={`url(#${g}__b)`} />}
      <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${g})`} />
      <g clipPath={`url(#${g}__c)`}>
        <polygon points={`${x},${y} ${x + w * 0.5},${y} ${x + w * 0.2},${y + h} ${x},${y + h}`} fill="#FFFFFF" opacity={0.045} />
      </g>
      <rect x={x + sw * 0.9} y={y + sw * 0.9} width={w - sw * 1.8} height={h - sw * 1.8} rx={Math.max(4, r - sw)} fill="none" stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={3} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={OUT} strokeWidth={sw} />
    </g>
  );
};

// ---------- small icons (flat, thick outline) ----------
const IconCheck: React.FC<{x: number; y: number; r: number; color?: string}> = ({x, y, r, color = GREEN}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={color} stroke={OUT} strokeWidth={r * 0.16} />
    <path d={`M${x - r * 0.42} ${y + r * 0.02} L${x - r * 0.12} ${y + r * 0.32} L${x + r * 0.45} ${y - r * 0.3}`} stroke="#FFFFFF" strokeWidth={r * 0.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
const IconWarn: React.FC<{x: number; y: number; r: number; color?: string; ink?: string}> = ({x, y, r, color = RED, ink = '#FFFFFF'}) => (
  <g>
    <path d={`M${x} ${y - r} L${x + r * 1.08} ${y + r * 0.82} L${x - r * 1.08} ${y + r * 0.82} Z`} fill={color} stroke={OUT} strokeWidth={r * 0.16} strokeLinejoin="round" />
    <path d={`M${x} ${y - r * 0.38} L${x} ${y + r * 0.2}`} stroke={ink} strokeWidth={r * 0.2} strokeLinecap="round" />
    <circle cx={x} cy={y + r * 0.52} r={r * 0.11} fill={ink} />
  </g>
);
const IconBriefcase: React.FC<{x: number; y: number; s: number; color?: string}> = ({x, y, s, color = CYAN}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-16} y={-30} width={32} height={18} rx={6} fill="none" stroke={OUT} strokeWidth={9} />
    <rect x={-16} y={-30} width={32} height={18} rx={6} fill="none" stroke={color} strokeWidth={4} />
    <rect x={-38} y={-16} width={76} height={50} rx={10} fill={color} stroke={OUT} strokeWidth={6} />
    <rect x={-38} y={-2} width={76} height={6} fill={OUT} opacity={0.5} />
    <rect x={-7} y={-6} width={14} height={14} rx={3} fill="#FFFFFF" stroke={OUT} strokeWidth={3} />
  </g>
);
const IconChat: React.FC<{x: number; y: number; s: number; color?: string}> = ({x, y, s, color = GOLD}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-36 -28 Q-36 -36 -28 -36 L28 -36 Q36 -36 36 -28 L36 12 Q36 20 28 20 L-6 20 L-22 36 L-20 20 L-28 20 Q-36 20 -36 12 Z" fill={color} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
    {[-16, 0, 16].map((d) => <circle key={d} cx={d} cy={-8} r={5} fill={OUT} />)}
  </g>
);
const IconBank: React.FC<{x: number; y: number; s: number; color?: string}> = ({x, y, s, color = GOLD}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-44 -14 L0 -42 L44 -14 Z" fill={color} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
    {[-30, -10, 10, 30].map((d) => <rect key={d} x={d - 5} y={-10} width={10} height={34} fill={color} stroke={OUT} strokeWidth={4} />)}
    <rect x={-46} y={24} width={92} height={12} rx={4} fill={color} stroke={OUT} strokeWidth={6} />
  </g>
);
const IconMag: React.FC<{x: number; y: number; r: number; color?: string}> = ({x, y, r, color = OUT}) => (
  <g>
    <circle cx={x - r * 0.15} cy={y - r * 0.15} r={r * 0.55} fill="none" stroke={color} strokeWidth={r * 0.22} />
    <path d={`M${x + r * 0.25} ${y + r * 0.25} L${x + r * 0.7} ${y + r * 0.7}`} stroke={color} strokeWidth={r * 0.26} strokeLinecap="round" />
  </g>
);
const IconFile: React.FC<{x: number; y: number; h: number; color: string; mark?: 'down' | 'warn' | 'check'}> = ({x, y, h, color, mark = 'down'}) => {
  const w = h * 0.78, f = h * 0.28, l = x - w / 2, tp = y - h / 2;
  return (
    <g>
      <path d={`M${l} ${tp + 10} Q${l} ${tp} ${l + 10} ${tp} L${l + w - f} ${tp} L${l + w} ${tp + f} L${l + w} ${tp + h - 10} Q${l + w} ${tp + h} ${l + w - 10} ${tp + h} L${l + 10} ${tp + h} Q${l} ${tp + h} ${l} ${tp + h - 10} Z`} fill="#F4F4FA" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
      <path d={`M${l + w - f} ${tp} L${l + w - f} ${tp + f} L${l + w} ${tp + f}`} fill="#C9C9D8" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
      <rect x={l + 4} y={tp + h * 0.56} width={w - 8} height={h * 0.3} fill={color} opacity={0.95} />
      {mark === 'down' && <path d={`M${x} ${tp + h * 0.22} L${x} ${tp + h * 0.46} M${x - h * 0.1} ${tp + h * 0.37} L${x} ${tp + h * 0.47} L${x + h * 0.1} ${tp + h * 0.37}`} stroke={OUT} strokeWidth={h * 0.07} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {mark === 'warn' && <IconWarn x={x} y={tp + h * 0.36} r={h * 0.13} />}
      {mark === 'check' && <IconCheck x={x} y={tp + h * 0.34} r={h * 0.14} />}
    </g>
  );
};
const Coin: React.FC<{x: number; y: number; r: number; symbol: string; id: string}> = ({x, y, r, symbol, id}) => {
  const g = uid('nuicoin', id);
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE07A" />
          <stop offset="1" stopColor="#F2A808" />
        </linearGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${g})`} stroke={OUT} strokeWidth={r * 0.14} />
      <circle cx={x} cy={y} r={r * 0.74} fill="none" stroke="#C98F0A" strokeWidth={r * 0.08} />
      <text x={x} y={y + r * 0.04} fontSize={r * 1.05} fontFamily={nightFont()} fontWeight={WT} textAnchor="middle" dominantBaseline="central" fill="#7A4A00">{symbol}</text>
      <path d={`M${x - r * 0.55} ${y - r * 0.45} Q${x - r * 0.2} ${y - r * 0.8} ${x + r * 0.25} ${y - r * 0.72}`} stroke="#FFFFFF" strokeWidth={r * 0.1} fill="none" strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

// ---------- faceless people (the story characters' dark head + gold rim) ----------
/** Identity details for faceless avatars: tie (boss/CEO) · glasses · headset (HR/recruiter) · hood (hacker) · hijab · cap · top · crown · bun. */
export type UiHat = 'none' | 'tie' | 'glasses' | 'headset' | 'hood' | 'hijab' | 'cap' | 'top' | 'crown' | 'bun';
const Bust: React.FC<{hx: number; hy: number; hr: number; body?: string; hat?: string; hatColor?: string}> = ({hx, hy, hr, body = '#7A3FC8', hat = 'none', hatColor = '#5B3FA0'}) => {
  const sw = hr * 0.12;
  const sh = `M${hx - hr * 2.7} ${hy + hr * 4.4} Q${hx - hr * 2.6} ${hy + hr * 1.5} ${hx} ${hy + hr * 1.45} Q${hx + hr * 2.6} ${hy + hr * 1.5} ${hx + hr * 2.7} ${hy + hr * 4.4} Z`;
  const headFill = hat === 'hood' ? '#05030F' : '#16121F';
  return (
    <g>
      {hat === 'hood' && <path d={`M${hx - hr * 1.35} ${hy + hr * 1.7} Q${hx - hr * 1.5} ${hy - hr * 1.2} ${hx} ${hy - hr * 1.55} Q${hx + hr * 1.5} ${hy - hr * 1.2} ${hx + hr * 1.35} ${hy + hr * 1.7} Z`} fill="#2A2440" stroke={OUT} strokeWidth={sw} />}
      {hat === 'hijab' && <ellipse cx={hx} cy={hy + hr * 0.35} rx={hr * 1.3} ry={hr * 1.55} fill={hatColor} stroke={OUT} strokeWidth={sw} />}
      <path d={sh} fill={hat === 'hood' ? '#2A2440' : body} stroke={OUT} strokeWidth={sw} />
      {hat === 'tie' && (
        <g>
          <path d={`M${hx - hr * 0.6} ${hy + hr * 1.47} L${hx} ${hy + hr * 2.3} L${hx + hr * 0.6} ${hy + hr * 1.47} Z`} fill="#FFFFFF" stroke={OUT} strokeWidth={sw * 0.6} />
          <path d={`M${hx - hr * 0.18} ${hy + hr * 1.62} L${hx + hr * 0.18} ${hy + hr * 1.62} L${hx + hr * 0.28} ${hy + hr * 2.9} L${hx} ${hy + hr * 3.2} L${hx - hr * 0.28} ${hy + hr * 2.9} Z`} fill="#D2363A" stroke={OUT} strokeWidth={sw * 0.6} strokeLinejoin="round" />
        </g>
      )}
      <circle cx={hx} cy={hy} r={hat === 'hijab' ? hr * 0.82 : hr} fill={headFill} stroke={GOLD} strokeWidth={hr * 0.13} />
      {hat === 'glasses' && (
        <g stroke="#FFFFFF" strokeWidth={hr * 0.1} fill={CYAN} fillOpacity={0.35}>
          <rect x={hx - hr * 0.78} y={hy - hr * 0.22} width={hr * 0.62} height={hr * 0.4} rx={hr * 0.12} />
          <rect x={hx + hr * 0.16} y={hy - hr * 0.22} width={hr * 0.62} height={hr * 0.4} rx={hr * 0.12} />
          <path d={`M${hx - hr * 0.16} ${hy - hr * 0.05} L${hx + hr * 0.16} ${hy - hr * 0.05}`} fill="none" />
        </g>
      )}
      {hat === 'headset' && (
        <g>
          <path d={`M${hx - hr * 1.02} ${hy + hr * 0.1} Q${hx - hr * 1.1} ${hy - hr * 1.3} ${hx} ${hy - hr * 1.3} Q${hx + hr * 1.1} ${hy - hr * 1.3} ${hx + hr * 1.02} ${hy + hr * 0.1}`} fill="none" stroke={OUT} strokeWidth={hr * 0.3} />
          <path d={`M${hx - hr * 1.02} ${hy + hr * 0.1} Q${hx - hr * 1.1} ${hy - hr * 1.3} ${hx} ${hy - hr * 1.3} Q${hx + hr * 1.1} ${hy - hr * 1.3} ${hx + hr * 1.02} ${hy + hr * 0.1}`} fill="none" stroke="#D9D9E3" strokeWidth={hr * 0.14} />
          <rect x={hx - hr * 1.22} y={hy - hr * 0.3} width={hr * 0.4} height={hr * 0.7} rx={hr * 0.15} fill={CYAN} stroke={OUT} strokeWidth={sw * 0.7} />
          <rect x={hx + hr * 0.82} y={hy - hr * 0.3} width={hr * 0.4} height={hr * 0.7} rx={hr * 0.15} fill={CYAN} stroke={OUT} strokeWidth={sw * 0.7} />
          <path d={`M${hx + hr * 1.0} ${hy + hr * 0.4} Q${hx + hr * 0.9} ${hy + hr * 0.95} ${hx + hr * 0.3} ${hy + hr * 0.85}`} fill="none" stroke="#D9D9E3" strokeWidth={hr * 0.1} strokeLinecap="round" />
          <circle cx={hx + hr * 0.28} cy={hy + hr * 0.85} r={hr * 0.12} fill={CYAN} stroke={OUT} strokeWidth={sw * 0.5} />
        </g>
      )}
      {hat === 'cap' && (
        <g>
          <path d={`M${hx - hr} ${hy - hr * 0.3} Q${hx - hr} ${hy - hr * 1.25} ${hx} ${hy - hr * 1.25} Q${hx + hr} ${hy - hr * 1.25} ${hx + hr} ${hy - hr * 0.3} Z`} fill={hatColor} stroke={OUT} strokeWidth={sw} />
          <path d={`M${hx + hr * 0.2} ${hy - hr * 0.35} L${hx + hr * 1.5} ${hy - hr * 0.25}`} stroke={OUT} strokeWidth={hr * 0.28} strokeLinecap="round" />
        </g>
      )}
      {hat === 'top' && (
        <g>
          <rect x={hx - hr * 0.7} y={hy - hr * 2.05} width={hr * 1.4} height={hr * 1.3} rx={hr * 0.1} fill="#1A1636" stroke={OUT} strokeWidth={sw} />
          <rect x={hx - hr * 0.7} y={hy - hr * 1.05} width={hr * 1.4} height={hr * 0.2} fill="#F5D27A" />
          <rect x={hx - hr * 1.05} y={hy - hr * 0.88} width={hr * 2.1} height={hr * 0.24} rx={hr * 0.1} fill="#1A1636" stroke={OUT} strokeWidth={sw} />
        </g>
      )}
      {hat === 'crown' && <path d={`M${hx - hr * 0.75} ${hy - hr * 0.8} L${hx - hr * 0.8} ${hy - hr * 1.55} L${hx - hr * 0.35} ${hy - hr * 1.15} L${hx} ${hy - hr * 1.7} L${hx + hr * 0.35} ${hy - hr * 1.15} L${hx + hr * 0.8} ${hy - hr * 1.55} L${hx + hr * 0.75} ${hy - hr * 0.8} Z`} fill="#F5C223" stroke={OUT} strokeWidth={sw} strokeLinejoin="round" />}
      {hat === 'bun' && <circle cx={hx} cy={hy - hr * 1.15} r={hr * 0.42} fill="#16121F" stroke={GOLD} strokeWidth={hr * 0.1} />}
    </g>
  );
};

/** Faceless round avatar with a gold rim (like the story characters). x,y = centre, r = radius. */
const Avatar: React.FC<{x: number; y: number; r: number; id: string; body?: string; hat?: string; ring?: string}> = ({x, y, r, id, body, hat, ring = GOLD}) => {
  const g = uid('nuiav', id);
  return (
    <g>
      <defs>
        <radialGradient id={g} cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#4A3C9A" />
          <stop offset="1" stopColor="#1E1844" />
        </radialGradient>
        <clipPath id={g + '__c'}>
          <circle cx={x} cy={y} r={r} />
        </clipPath>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${g})`} />
      <g clipPath={`url(#${g}__c)`}>
        <Bust hx={x} hy={y - r * 0.16} hr={r * 0.34} body={body} hat={hat} />
      </g>
      <circle cx={x} cy={y} r={r} fill="none" stroke={OUT} strokeWidth={r * 0.2} />
      <circle cx={x} cy={y} r={r} fill="none" stroke={ring} strokeWidth={r * 0.09} />
    </g>
  );
};

// ======================================================================================================================
/**
 * Laptop — sleek glossy laptop with a glowing screen. (x, y) = bottom-centre of the base, w = base width.
 * `screen` renders inside the screen in a LOCAL box 1000 × 625 (16:10, origin top-left, clipped) — e.g.
 * <TransferScreen x={500} y={312} s={0.7} …/> or <MessageCard x={500} y={312} …/>. The screen lights up 0.15–0.45 s
 * after `at`. glow = colour of the screen light (default cyan). Sound: pop.
 */
export const Laptop: React.FC<{t: number; at: number; x: number; y: number; w: number; screen?: React.ReactNode; glow?: string; id: string; out?: number}> = ({
  t, at, x, y, w, screen, glow = CYAN, id, out,
}) => {
  const lf = life(t, at, out);
  if (!lf) return null;
  cueSfx('pop', `laptop-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125});
  const g = uid('nuilap', id);
  const LW = w * 0.84, b = LW * 0.035, SW = LW - 2 * b, SH = SW * 0.625, LH = SH + 2 * b + b * 0.6;
  const baseH = w * 0.05;
  const lx = -LW / 2, ly = -baseH - LH; // lid top-left (local, origin = base bottom-centre)
  const sx = lx + b, sy = ly + b;
  const on = ease.out(clamp01((t - at - 0.15) / 0.3));
  const sc = SW / 1000;
  return (
    <g transform={`translate(${x + lf.dx} ${y + lf.dy}) scale(${lf.s})`} opacity={lf.o}>
      <defs>
        <linearGradient id={g + 'lid'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A3370" />
          <stop offset="1" stopColor="#1C1838" />
        </linearGradient>
        <linearGradient id={g + 'scr'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1D2A66" />
          <stop offset="1" stopColor="#120C38" />
        </linearGradient>
        <linearGradient id={g + 'base'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9C97C8" />
          <stop offset="1" stopColor="#4A4472" />
        </linearGradient>
        <filter id={g + 'b'} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={w * 0.06} />
        </filter>
        <clipPath id={g + 'c'}>
          <rect x={sx} y={sy} width={SW} height={SH} rx={b * 0.4} />
        </clipPath>
      </defs>
      {/* screen light spilling around the laptop + a pool on the floor */}
      <ellipse cx={0} cy={ly + LH * 0.5} rx={LW * 0.62} ry={LH * 0.62} fill={glow} opacity={0.32 * on} filter={`url(#${g}b)`} />
      <ellipse cx={0} cy={-baseH * 0.2} rx={w * 0.6} ry={w * 0.06} fill={glow} opacity={0.25 * on} filter={`url(#${g}b)`} />
      {/* lid */}
      <rect x={lx} y={ly} width={LW} height={LH} rx={b * 1.1} fill={`url(#${g}lid)`} stroke={OUT} strokeWidth={9} />
      <rect x={sx} y={sy} width={SW} height={SH} rx={b * 0.4} fill={`url(#${g}scr)`} stroke={OUT} strokeWidth={4} />
      <g clipPath={`url(#${g}c)`}>
        <rect x={sx} y={sy} width={SW} height={SH} fill={glow} opacity={0.1 * on} />
        <g opacity={on} transform={`translate(${sx} ${sy}) scale(${sc})`}>{screen}</g>
        <polygon points={`${sx},${sy} ${sx + SW * 0.42},${sy} ${sx + SW * 0.2},${sy + SH} ${sx},${sy + SH}`} fill="#FFFFFF" opacity={0.06} />
      </g>
      <circle cx={0} cy={ly + b * 0.5} r={b * 0.16} fill="#0A0818" stroke="#5A5490" strokeWidth={2} />
      {/* base / keyboard deck */}
      <path d={`M${-LW / 2 - w * 0.02} ${-baseH} L${LW / 2 + w * 0.02} ${-baseH} L${w / 2} ${-baseH * 0.35} Q${w / 2} 0 ${w / 2 - baseH * 0.35} 0 L${-w / 2 + baseH * 0.35} 0 Q${-w / 2} 0 ${-w / 2} ${-baseH * 0.35} Z`}
        fill={`url(#${g}base)`} stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
      <path d={`M${-LW / 2} ${-baseH + 5} L${LW / 2} ${-baseH + 5}`} stroke="#FFFFFF" strokeWidth={3} opacity={0.6} />
      <rect x={-w * 0.09} y={-baseH} width={w * 0.18} height={baseH * 0.32} rx={baseH * 0.16} fill="#3A3466" stroke={OUT} strokeWidth={4} />
    </g>
  );
};

/**
 * Phone — modern phone with a dynamic-island notch and a glowing screen. (x, y) = centre, h = height.
 * `screen` renders inside the screen in a LOCAL box 450 × 900 (origin top-left, clipped). Floats gently. Sound: pop.
 */
export const Phone: React.FC<{t: number; at: number; x: number; y: number; h: number; screen?: React.ReactNode; glow?: string; id: string; out?: number; float?: boolean}> = ({
  t, at, x, y, h, screen, glow = CYAN, id, out, float = true,
}) => {
  const lf = life(t, at, out);
  if (!lf) return null;
  cueSfx('pop', `phone-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125});
  const g = uid('nuiph', id);
  const b = h * 0.028, SH = h - 2 * b, SW = SH / 2, w = SW + 2 * b;
  const bob = float ? Math.sin((t - at) * 1.6) * h * 0.006 : 0;
  const on = ease.out(clamp01((t - at - 0.15) / 0.3));
  return (
    <g transform={`translate(${x + lf.dx} ${y + lf.dy + bob}) scale(${lf.s})`} opacity={lf.o}>
      <defs>
        <linearGradient id={g + 'body'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4A4280" />
          <stop offset="1" stopColor="#1C1838" />
        </linearGradient>
        <linearGradient id={g + 'scr'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1D2A66" />
          <stop offset="1" stopColor="#120C38" />
        </linearGradient>
        <filter id={g + 'b'} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={h * 0.06} />
        </filter>
        <clipPath id={g + 'c'}>
          <rect x={-SW / 2} y={-SH / 2} width={SW} height={SH} rx={w * 0.12} />
        </clipPath>
      </defs>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.16} fill={glow} opacity={0.35 * on} filter={`url(#${g}b)`} />
      <rect x={w / 2 - 2} y={-h * 0.28} width={b * 0.8} height={h * 0.12} rx={3} fill="#2A2450" stroke={OUT} strokeWidth={4} />
      <rect x={-w / 2 - b * 0.8 + 2} y={-h * 0.3} width={b * 0.8} height={h * 0.08} rx={3} fill="#2A2450" stroke={OUT} strokeWidth={4} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.16} fill={`url(#${g}body)`} stroke={OUT} strokeWidth={9} />
      <rect x={-SW / 2} y={-SH / 2} width={SW} height={SH} rx={w * 0.12} fill={`url(#${g}scr)`} stroke={OUT} strokeWidth={4} />
      <g clipPath={`url(#${g}c)`}>
        <rect x={-SW / 2} y={-SH / 2} width={SW} height={SH} fill={glow} opacity={0.1 * on} />
        <g opacity={on} transform={`translate(${-SW / 2} ${-SH / 2}) scale(${SW / 450})`}>{screen}</g>
        <polygon points={`${-SW / 2},${-SH / 2} ${SW * 0.1},${-SH / 2} ${-SW * 0.2},${SH / 2} ${-SW / 2},${SH / 2}`} fill="#FFFFFF" opacity={0.06} />
      </g>
      <rect x={-SW * 0.17} y={-SH / 2 + SH * 0.018} width={SW * 0.34} height={SH * 0.035} rx={SH * 0.0175} fill="#05030F" />
    </g>
  );
};

/**
 * MessageCard — a message / notification card. (x, y) = centre, w default 820. Faceless avatar (gold rim) on the start
 * side, name + role, the wrapped message text (right-to-left in Arabic), a kind icon and a red «جديد» badge on the end
 * side. kind: 'job' (cyan, briefcase) · 'chat' (gold, bubble) · 'alert' (red, ⚠). action = optional button label.
 * hat/body = the sender's identity detail (see UiHat). Sound: pop.
 */
export const MessageCard: React.FC<{t: number; at: number; x: number; y: number; w?: number; from: string; role?: string; text: string; kind?: 'job' | 'chat' | 'alert'; action?: string; badge?: boolean; hat?: string; body?: string; id: string; out?: number}> = ({
  t, at, x, y, w = 820, from, role, text, kind = 'chat', action, badge = true, hat, body, id, out,
}) => {
  const lf = life(t, at, out);
  if (!lf) return null;
  cueSfx('ping', `msg-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125}); // a message arrives → ping
  const accent = kind === 'job' ? CYAN : kind === 'alert' ? RED : GOLD;
  const pad = 40, ar = 60, ts = 44, lh = 60;
  const lines = wrap(text, ts, w - pad * 2);
  const head = ar * 2;
  const actH = action ? 100 : 0;
  const h = pad + head + 34 + lines.length * lh + actH + pad - 10;
  const left = -w / 2, right = w / 2, top = -h / 2;
  const avX = isAr() ? right - pad - ar : left + pad + ar;
  const avY = top + pad + ar;
  const nm = isAr() ? {x: avX - ar - 26, anchor: 'end' as const} : {x: avX + ar + 26, anchor: 'start' as const};
  const ic = isAr() ? left + pad + 40 : right - pad - 40;
  const bw = textWidth(L('جديد', 'New'), 34) + 51;
  const bx = isAr() ? ic + 50 + bw / 2 : ic - 50 - bw / 2;
  const slide = (1 - ease.out(clamp01((t - at) / 0.35))) * 40;
  const bp = (t - at - 0.35) / 0.3;
  const bq = popRef(bp);
  const tx = startAt(left + pad, right - pad);
  return (
    <g transform={`translate(${x + lf.dx} ${y + lf.dy + slide}) scale(${lf.s})`} opacity={lf.o}>
      <Panel x={left} y={top} w={w} h={h} r={40} id={id} glow={accent} glowO={0.42} />
      <rect x={left + 26} y={top + 8} width={w - 52} height={8} rx={4} fill={accent} opacity={0.9} />
      <Avatar x={avX} y={avY} r={ar} id={id + 'av'} hat={hat} body={body} />
      <Txt x={nm.x} y={avY - (role ? 24 : 0)} size={48} text={from} anchor={nm.anchor} />
      {role && <Txt x={nm.x} y={avY + 34} size={36} text={role} fill={accent} anchor={nm.anchor} outline={0.8} />}
      {kind === 'job' && <IconBriefcase x={ic} y={avY - 4} s={0.95} color={accent} />}
      {kind === 'chat' && <IconChat x={ic} y={avY - 2} s={0.95} color={accent} />}
      {kind === 'alert' && <IconWarn x={ic} y={avY} r={36} />}
      {badge && bp > 0 && (
        <g transform={`translate(${bx} ${avY - 2}) scale(${bq.s})`} opacity={bq.o}>
          <NPill text={L('جديد', 'New')} x={0} y={0} size={34} kind="red" id={id + 'badge'} />
        </g>
      )}
      <rect x={left + pad} y={top + pad + head + 14} width={w - pad * 2} height={3} fill="#FFFFFF" opacity={0.12} />
      {lines.map((ln, i) => {
        const o = ease.out(clamp01((t - at - 0.15 - i * 0.08) / 0.25));
        return <Txt key={i} x={tx.x} y={top + pad + head + 34 + lh * (i + 0.5)} size={ts} text={ln} anchor={tx.anchor} fill="#E8E8F2" outline={0.7} o={o} />;
      })}
      {action && (
        <NPill text={action} x={isAr() ? left + pad + (textWidth(action, 40) + 60) / 2 : right - pad - (textWidth(action, 40) + 60) / 2} y={top + h - pad - 34} size={40}
          kind={kind === 'job' ? 'cyan' : kind === 'alert' ? 'red' : 'gold'} id={id + 'act'} />
      )}
    </g>
  );
};

/**
 * VideoCall — a video-call window with 1–3 tiles of faceless people (name pill, optional role pill, identity hat).
 * (x, y) = centre, w = window width. speaking = index of the talking tile, or a timeline [[time, index], …] — that tile
 * glows cyan, its head nods and sound bars move. Tiles pop in one by one (0.12 s apart). Sound: pop per tile.
 */
export const VideoCall: React.FC<{t: number; at: number; x: number; y: number; w: number; people: {name: string; role?: string; hat?: string; body?: string}[]; speaking?: number | [number, number][]; id: string; out?: number}> = ({
  t, at, x, y, w, people, speaking, id, out,
}) => {
  const lf = life(t, at, out);
  if (!lf) return null;
  cueSfx('pop', `vcall-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125});
  const n = Math.max(1, Math.min(3, people.length));
  const pad = 26, gap = 22, headH = 74, ctrlH = 110;
  const tw = (w - pad * 2 - gap * (n - 1)) / n;
  const th = n === 1 ? tw * 0.6 : tw * 0.82;
  const h = headH + th + ctrlH + pad;
  const left = -w / 2, top = -h / 2;
  let spk = -1;
  if (typeof speaking === 'number') spk = speaking;
  else if (speaking) for (const [ts, i] of speaking) if (t >= ts) spk = i;
  const secs = Math.max(0, Math.floor(t - at));
  const timer = `00:${String(secs % 60).padStart(2, '0')}`;
  const tones = [['#3B2A8C', '#1A1446'], ['#155A6E', '#0B2638'], ['#5A2A6E', '#22103A']];
  const bodies = ['#7A3FC8', '#1F8A9E', '#C2457A'];
  const g = uid('nuivc', id);
  return (
    <g transform={`translate(${x + lf.dx} ${y + lf.dy}) scale(${lf.s})`} opacity={lf.o}>
      <Panel x={left} y={top} w={w} h={h} r={40} id={id} glow={CYAN} glowO={0.35} top="#2A2458" low="#120E28" />
      {/* header: window dots + REC timer */}
      {[0, 1, 2].map((i) => <circle key={i} cx={isAr() ? -left - 46 - i * 34 : left + 46 + i * 34} cy={top + headH / 2 + 4} r={11} fill={['#FD4B5B', '#FCC018', '#22C55E'][i]} stroke={OUT} strokeWidth={4} />)}
      <g>
        <circle cx={isAr() ? left + 44 : -left - 44} cy={top + headH / 2 + 4} r={12} fill={RED} opacity={0.6 + 0.4 * (Math.floor(t * 1.6) % 2)} stroke={OUT} strokeWidth={4} />
        <Txt x={isAr() ? left + 70 : -left - 70} y={top + headH / 2 + 6} size={36} text={timer} anchor={isAr() ? 'start' : 'end'} fill="#E8E8F2" outline={0.7} />
      </g>
      {people.slice(0, n).map((pp, i) => {
        const k = isAr() ? n - 1 - i : i; // first person = start side
        const tx = left + pad + k * (tw + gap), ty = top + headH;
        const ta = at + 0.15 + i * 0.12;
        const pt = (t - ta) / 0.3;
        if (pt <= 0) return null;
        cueSfx('pop', `vtile-${id}-${i}-${at}`, t >= ta && t < ta + 0.3, x + tx + tw / 2, {at: ta, hit: 0.125});
        const q = popRef(pt);
        const isSpk = i === spk;
        const nod = isSpk ? Math.sin(t * 9) * th * 0.008 : 0;
        const tg = g + 't' + i;
        const hr = th * 0.19;
        const cx = tx + tw / 2;
        return (
          <g key={i} transform={`translate(${cx} ${ty + th / 2}) scale(${q.s}) translate(${-cx} ${-(ty + th / 2)})`} opacity={q.o}>
            <defs>
              <linearGradient id={tg} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={tones[i % 3][0]} />
                <stop offset="1" stopColor={tones[i % 3][1]} />
              </linearGradient>
              <clipPath id={tg + 'c'}>
                <rect x={tx} y={ty} width={tw} height={th} rx={24} />
              </clipPath>
              <filter id={tg + 'b'} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation={16} />
              </filter>
            </defs>
            {isSpk && <rect x={tx - 4} y={ty - 4} width={tw + 8} height={th + 8} rx={28} fill={CYAN} opacity={0.75} filter={`url(#${tg}b)`} />}
            <rect x={tx} y={ty} width={tw} height={th} rx={24} fill={`url(#${tg})`} />
            <g clipPath={`url(#${tg}c)`}>
              {/* a soft room light + a shelf line behind the person */}
              <circle cx={tx + tw * 0.25} cy={ty + th * 0.25} r={th * 0.35} fill="#FFFFFF" opacity={0.06} />
              <rect x={tx} y={ty + th * 0.3} width={tw} height={6} fill="#FFFFFF" opacity={0.07} />
              <Bust hx={cx} hy={ty + th * 0.42 + nod} hr={hr} hat={pp.hat} body={pp.body ?? bodies[i % 3]} />
            </g>
            <rect x={tx} y={ty} width={tw} height={th} rx={24} fill="none" stroke={isSpk ? CYAN : OUT} strokeWidth={isSpk ? 7 : 6} />
            {pp.role && <NPill text={pp.role} x={isAr() ? tx + tw - 20 - (textWidth(pp.role, 34) + 51) / 2 : tx + 20 + (textWidth(pp.role, 34) + 51) / 2} y={ty + 46} size={34} kind="cyan" id={`${id}-r${i}`} />}
            <NPill text={pp.name} x={cx} y={ty + th - 44} size={38} kind={isSpk ? 'gold' : 'white'} id={`${id}-n${i}`} />
            {isSpk && [0, 1, 2, 3].map((b) => {
              const bh = 14 + 26 * Math.abs(Math.sin(t * (7 + b * 1.7) + b));
              const bx0 = (isAr() ? tx + 30 : tx + tw - 70) + b * 12;
              return <rect key={b} x={bx0} y={ty + 46 - bh / 2} width={8} height={bh} rx={4} fill={CYAN} stroke={OUT} strokeWidth={2} />;
            })}
          </g>
        );
      })}
      {/* controls: mic · camera · red hang-up */}
      {[-1, 0, 1].map((k) => {
        const cx = k * 120, cy = top + headH + th + ctrlH / 2 + 6;
        const red = k === 1;
        return (
          <g key={k}>
            <circle cx={cx} cy={cy} r={38} fill={red ? RED : '#3A3466'} stroke={OUT} strokeWidth={6} />
            {k === -1 && <g><rect x={cx - 9} y={cy - 22} width={18} height={30} rx={9} fill="#FFFFFF" /><path d={`M${cx - 16} ${cy} Q${cx} ${cy + 20} ${cx + 16} ${cy}`} stroke="#FFFFFF" strokeWidth={5} fill="none" /><rect x={cx - 2.5} y={cy + 10} width={5} height={10} fill="#FFFFFF" /></g>}
            {k === 0 && <g><rect x={cx - 22} y={cy - 13} width={30} height={26} rx={6} fill="#FFFFFF" /><path d={`M${cx + 9} ${cy - 2} L${cx + 22} ${cy - 11} L${cx + 22} ${cy + 11} L${cx + 9} ${cy + 2} Z`} fill="#FFFFFF" /></g>}
            {red && <path d={`M${cx - 22} ${cy + 4} Q${cx} ${cy - 16} ${cx + 22} ${cy + 4}`} stroke="#FFFFFF" strokeWidth={10} fill="none" strokeLinecap="round" />}
          </g>
        );
      })}
    </g>
  );
};

/**
 * DownloadBar — a file chip with a progress bar. (x, y) = centre, w default 960. The bar starts at at+0.3 and fills over
 * `dur` with the % ticking; on complete a green ✔ (or with `danger` the bar, glow and file turn red with a ⚠). verdict =
 * optional pill shown on complete (e.g. «برنامج خبيث»). Sounds: pop (chip) · tick (start) · ding (done) / boom (danger).
 */
export const DownloadBar: React.FC<{t: number; at: number; x: number; y: number; w?: number; file: string; dur?: number; danger?: boolean; verdict?: string; id: string; out?: number}> = ({
  t, at, x, y, w = 960, file, dur = 2, danger, verdict, id, out,
}) => {
  const lf = life(t, at, out);
  if (!lf) return null;
  const s0 = at + 0.3, done = s0 + dur;
  cueSfx('pop', `dl-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125});
  cueSfx('tick', `dlgo-${id}-${at}`, t >= s0 && t < s0 + 0.2, x, {at: s0});
  cueSfx(danger ? 'boom' : 'ping', `dlend-${id}-${at}`, t >= done && t < done + 0.3, x, {at: done, hit: danger ? 0.125 : 0});
  const pr = clamp01((t - s0) / dur);
  const v = ease.inOutSine(pr) * 0.85 + pr * 0.15;
  const fin = t >= done;
  const fq = popRef((t - done) / 0.3);
  const bad = danger && fin;
  const accent = bad ? RED : fin ? GREEN : CYAN;
  const h = 210, pad = 36, left = -w / 2, top = -h / 2, right = w / 2;
  const icX = isAr() ? right - pad - 44 : left + pad + 44;
  const inR = isAr() ? right - pad - 112 : right - pad; // text/track span (start side after the icon)
  const inL = isAr() ? left + pad : left + pad + 112;
  const g = uid('nuidl', id);
  const trackY = top + 140, th = 38;
  const tw = inR - inL;
  const fw = Math.max(th - 10, (tw - 10) * v);
  const punch = bad ? 1 + 0.05 * Math.sin(Math.PI * clamp01((t - done) / 0.25)) : 1;
  const nm = startAt(inL, inR);
  const pc = endAt(inL, inR);
  return (
    <g transform={`translate(${x + lf.dx} ${y + lf.dy}) scale(${lf.s * punch})`} opacity={lf.o}>
      <defs>
        <pattern id={g} width={26} height={26} patternUnits="userSpaceOnUse" patternTransform={`rotate(45) translate(${t * 40} 0)`}>
          <rect width={26} height={26} fill={accent} />
          <rect width={10} height={26} fill="#FFFFFF" opacity={0.35} />
        </pattern>
      </defs>
      <Panel x={left} y={top} w={w} h={h} r={36} id={id} glow={accent} glowO={bad ? 0.7 : 0.4} top={bad ? '#4A1830' : '#2E2760'} low={bad ? '#1E0814' : '#151130'} />
      <IconFile x={icX} y={top + h / 2} h={118} color={accent} mark={bad ? 'warn' : fin ? 'check' : 'down'} />
      <Txt x={nm.x} y={top + 64} size={44} text={file} anchor={nm.anchor} fill={bad ? '#FFC2C8' : '#FFFFFF'} />
      {!fin && <Txt x={pc.x} y={top + 64} size={48} text={`${Math.floor(v * 100)}%`} anchor={pc.anchor} fill={CYAN} />}
      {fin && (
        <g transform={`translate(${pc.anchor === 'start' ? pc.x + 36 : pc.x - 36} ${top + 62}) scale(${fq.s})`} opacity={fq.o}>
          {bad ? <IconWarn x={0} y={0} r={36} /> : <IconCheck x={0} y={0} r={34} />}
        </g>
      )}
      <rect x={inL} y={trackY - th / 2} width={tw} height={th} rx={th / 2} fill="#0E0B1E" stroke={OUT} strokeWidth={6} />
      <rect x={isAr() ? inR - 5 - fw : inL + 5} y={trackY - th / 2 + 5} width={fw} height={th - 10} rx={(th - 10) / 2} fill={`url(#${g})`} />
      {verdict && fin && <NPill text={verdict} x={0} y={top - 50} size={44} kind={danger ? 'red' : 'green'} id={id + 'v'} p={(t - done - 0.15) / 0.3} />}
    </g>
  );
};

/**
 * TransferScreen — a bank-transfer panel (from / to / amount / confirm). (x, y) = centre, s = scale (920 × 760 at s 1).
 * The amount is shown EXACTLY as given. The confirm button is pressed at `press` (default at+0.4). With `wrong`, the
 * amount field rolls up (over `dur`, default 0.6 s, starting 0.25 s after the press) into the wrong amount, which lands
 * in RED with a flash. Sounds: pop (panel) · thump (press) · boom (wrong amount lands).
 */
export const TransferScreen: React.FC<{t: number; at: number; x: number; y: number; from: string; to: string; amount: string; wrong?: string; dur?: number; press?: number; s?: number; title?: string; button?: string; id: string; out?: number}> = ({
  t, at, x, y, from, to, amount, wrong, dur = 0.6, press, s = 1, title, button, id, out,
}) => {
  const lf = life(t, at, out);
  if (!lf) return null;
  const tp = press ?? at + 0.4;
  const r0 = tp + 0.25, land = r0 + dur;
  cueSfx('pop', `tr-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125});
  cueSfx('thump', `trpress-${id}-${at}`, t >= tp && t < tp + 0.3, x, {at: tp, hit: 0.06});
  if (wrong) cueSfx('boom', `trwrong-${id}-${at}`, t >= land && t < land + 0.3, x, {at: land});
  const w = 920, h = 760, left = -w / 2, top = -h / 2, right = w / 2, pad = 44;
  const bad = !!wrong && t >= land;
  const flash = bad ? 1 - clamp01((t - land) / 0.35) : 0;
  const punch = bad ? 1 + 0.045 * Math.sin(Math.PI * clamp01((t - land) / 0.3)) : 1;
  const rowIn = (i: number) => ease.out(clamp01((t - at - 0.08 - i * 0.07) / 0.25));
  const st = startAt(left + pad + 28, right - pad - 28);
  const Row = ({i, y0, label, value}: {i: number; y0: number; label: string; value: string}) => {
    const o = rowIn(i);
    const lab = startAt(left + pad + 28, right - pad - 28);
    const lw = textWidth(label, 38) + 34;
    const val = isAr() ? {x: right - pad - 28 - lw, anchor: 'end' as const} : {x: left + pad + 28 + lw, anchor: 'start' as const};
    return (
      <g opacity={o} transform={`translate(${(1 - o) * (isAr() ? 30 : -30)} 0)`}>
        <rect x={left + pad} y={y0} width={w - pad * 2} height={96} rx={26} fill="#0E0B1E" stroke={OUT} strokeWidth={6} />
        <rect x={left + pad + 6} y={y0 + 6} width={w - pad * 2 - 12} height={40} rx={20} fill="#FFFFFF" opacity={0.04} />
        <Txt x={lab.x} y={y0 + 50} size={38} text={label} anchor={lab.anchor} fill="#A9A6C8" outline={0.6} />
        <Txt x={val.x} y={y0 + 50} size={46} text={value} anchor={val.anchor} />
      </g>
    );
  };
  // amount field
  const fy = 378, fh = 170, fx = left + pad, fw = w - pad * 2;
  const g = uid('nuitr', id);
  const fit = (txt: string) => Math.max(56, Math.min(110, (110 * (fw - 80)) / Math.max(1, textWidth(txt, 110))));
  const k = wrong ? ease.inOut(clamp01((t - r0) / dur)) : 0;
  const amY = top + fy + fh / 2;
  // confirm button
  const by = top + 610, bh = 106, bw = fw;
  const pu = t - tp;
  const pressS = pu >= 0 && pu < 0.24 ? 1 - 0.07 * Math.sin(Math.PI * pu / 0.24) : 1;
  const ring = pu >= 0 && pu < 0.45 ? pu / 0.45 : -1;
  return (
    <g transform={`translate(${x + lf.dx} ${y + lf.dy}) scale(${lf.s * s * punch})`} opacity={lf.o}>
      <defs>
        <clipPath id={g + 'c'}>
          <rect x={fx} y={top + fy} width={fw} height={fh} rx={30} />
        </clipPath>
        <linearGradient id={g + 'btn'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4BEA92" />
          <stop offset="1" stopColor="#139F66" />
        </linearGradient>
      </defs>
      <Panel x={left} y={top} w={w} h={h} r={44} id={id} glow={bad ? RED : GOLD} glowO={bad ? 0.75 : 0.38} top={bad ? '#4A1830' : '#2E2760'} low={bad ? '#1E0814' : '#151130'} />
      {/* header */}
      <IconBank x={isAr() ? right - pad - 40 : left + pad + 40} y={top + 74} s={0.85} />
      <Txt x={isAr() ? right - pad - 100 : left + pad + 100} y={top + 72} size={52} text={title ?? L('تحويل بنكي', 'Bank transfer')} anchor={st.anchor} />
      <Row i={0} y0={top + 128} label={L('من', 'From')} value={from} />
      <Row i={1} y0={top + 240} label={L('إلى', 'To')} value={to} />
      {/* amount */}
      <g opacity={rowIn(2)}>
        <rect x={fx} y={top + fy} width={fw} height={fh} rx={30} fill={bad ? '#5A0F1E' : '#0E0B1E'} stroke={bad ? RED : GOLD} strokeWidth={7} />
        <g clipPath={`url(#${g}c)`}>
          <rect x={fx} y={top + fy} width={fw} height={fh * 0.4} fill="#FFFFFF" opacity={0.04} />
          {k < 1 && (
            <g transform={`translate(0 ${-k * fh})`}>
              <GlowText text={amount} x={0} y={amY} size={fit(amount)} tone="gold" id={id + 'am'} />
            </g>
          )}
          {wrong && k > 0 && (
            <g transform={`translate(0 ${(1 - k) * fh})`}>
              <GlowText text={wrong} x={0} y={amY} size={fit(wrong)} tone="red" id={id + 'wr'} />
            </g>
          )}
          {flash > 0 && <rect x={fx} y={top + fy} width={fw} height={fh} fill="#FFFFFF" opacity={0.7 * flash} />}
        </g>
      </g>
      {/* confirm */}
      <g opacity={rowIn(3)} transform={`translate(0 ${by + bh / 2 + top * 0}) scale(${pressS}) translate(0 ${-(by + bh / 2)})`}>
        {ring >= 0 && <rect x={fx - ring * 40} y={by - ring * 40} width={bw + ring * 80} height={bh + ring * 80} rx={bh / 2 + ring * 40} fill="none" stroke="#4BEA92" strokeWidth={8} opacity={1 - ring} />}
        <rect x={fx} y={by} width={bw} height={bh} rx={bh / 2} fill={`url(#${g}btn)`} stroke={OUT} strokeWidth={7} />
        <rect x={fx + 20} y={by + 10} width={bw - 40} height={bh * 0.32} rx={bh * 0.16} fill="#FFFFFF" opacity={0.22} />
        {pu >= 0 && pu < 0.3 && <rect x={fx} y={by} width={bw} height={bh} rx={bh / 2} fill="#FFFFFF" opacity={0.4 * (1 - pu / 0.3)} />}
        <Txt x={0} y={by + bh / 2 + 2} size={50} text={button ?? L('تأكيد التحويل', 'Confirm transfer')} fill="#FFFFFF" />
      </g>
    </g>
  );
};

/**
 * SearchBox — a rounded glowing search bar; `text` types in letter by letter from at+0.35 (`speed` s per letter,
 * default 0.07) with a caret; a gold search button on the end side. brand = the engine's NAME as a small pill above
 * (text only — never a logo). (x, y) = centre, w default 1100. Sounds: pop · typing.
 */
export const SearchBox: React.FC<{t: number; at: number; x: number; y: number; w?: number; text: string; brand?: string; speed?: number; glow?: string; id: string; out?: number}> = ({
  t, at, x, y, w = 1100, text, brand, speed = 0.07, glow = CYAN, id, out,
}) => {
  const lf = life(t, at, out);
  if (!lf) return null;
  const chars = Array.from(text);
  const t0 = at + 0.35, t1 = t0 + chars.length * speed;
  cueSfx('pop', `sb-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125});
  cueSfx('typing', `sbtype-${id}-${at}`, t >= t0 && t < t1, x, {sustain: true, gain: 0.5, at: t0});
  const n = Math.max(0, Math.min(chars.length, Math.floor((t - t0) / speed) + 1));
  const typed = t < t0 ? '' : chars.slice(0, n).join('');
  const h = 132, left = -w / 2, right = w / 2, top = -h / 2;
  const btnR = 48;
  const btnX = isAr() ? left + 18 + btnR : right - 18 - btnR;
  const st = startAt(left + 56, right - 56);
  const tw = typed ? textWidth(typed, 56) : 0;
  const caretX = isAr() ? st.x - tw - 8 : st.x + tw + 8;
  const blink = t < t1 + 0.1 ? 1 : Math.floor((t - t1) * 2.2) % 2 === 0 ? 1 : 0;
  const g = uid('nuisb', id);
  const bw = brand ? textWidth(brand, 40) + 60 : 0;
  return (
    <g transform={`translate(${x + lf.dx} ${y + lf.dy}) scale(${lf.s})`} opacity={lf.o}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E2E2EE" />
        </linearGradient>
        <filter id={g + 'b'} x="-20%" y="-80%" width="140%" height="260%">
          <feGaussianBlur stdDeviation={30} />
        </filter>
      </defs>
      <rect x={left} y={top} width={w} height={h} rx={h / 2} fill={glow} opacity={0.5} filter={`url(#${g}b)`} />
      <rect x={left} y={top} width={w} height={h} rx={h / 2} fill={`url(#${g})`} stroke={OUT} strokeWidth={9} />
      <rect x={left + 40} y={top + 14} width={w - 80} height={h * 0.26} rx={h * 0.13} fill="#FFFFFF" opacity={0.8} />
      <circle cx={btnX} cy={0} r={btnR} fill={N.goldPill} stroke={OUT} strokeWidth={7} />
      <IconMag x={btnX} y={0} r={36} color={N.goldInk} />
      {typed && (
        <text x={st.x} y={4} fontSize={56} fontFamily={nightFont()} fontWeight={WT} textAnchor={st.anchor} dominantBaseline="central" fill="#1A1A2E">{typed}</text>
      )}
      <rect x={caretX - 3} y={-34} width={6} height={68} rx={3} fill={CYAN} opacity={blink} />
      {brand && <NPill text={brand} x={isAr() ? right - 30 - bw / 2 : left + 30 + bw / 2} y={top - 52} size={40} kind="white" id={id + 'br'} />}
    </g>
  );
};

const decOf = (n: number) => {
  const s = String(n);
  const k = s.indexOf('.');
  return k < 0 ? 0 : Math.min(2, s.length - k - 1);
};
const fmtVal = (v: number, dec: number) => {
  const [i, d] = Math.abs(v).toFixed(dec).split('.');
  const ii = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (v < 0 ? '-' : '') + (d ? `${ii}.${d}` : ii);
};

/**
 * WalletBalance — a glowing wallet card whose balance counts from `from` to `to` (countCurve, `dur` default 1.64 s,
 * starting at `start` = at+0.4). to < from → draining: red value, red ▼, red trend line; to > from → rising, green ▲.
 * unit = pill under the number (e.g. «مليار $»); symbol = coin glyph (default ₿); label = card title. (x, y) = centre,
 * 780 × 470 at s 1. Sounds: pop · tick (count starts) · boom (drained) / sparkle (risen).
 */
export const WalletBalance: React.FC<{t: number; at: number; x: number; y: number; from: number; to: number; unit?: string; dur?: number; start?: number; symbol?: string; label?: string; s?: number; id: string; out?: number}> = ({
  t, at, x, y, from, to, unit, dur = 1.64, start, symbol = '₿', label, s = 1, id, out,
}) => {
  const lf = life(t, at, out);
  if (!lf) return null;
  const c0 = start ?? at + 0.4, c1 = c0 + dur;
  const down = to < from;
  cueSfx('pop', `wal-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125});
  cueSfx('tick', `walgo-${id}-${at}`, t >= c0 && t < c0 + 0.2, x, {at: c0});
  cueSfx(down ? 'boom' : 'cash', `walend-${id}-${at}`, t >= c1 && t < c1 + 0.3, x, {at: c1});
  const p = countCurve((t - c0) / dur);
  const v = lerp(from, to, p);
  const dec = Math.max(decOf(from), decOf(to));
  const moving = t >= c0;
  const tone = !moving ? 'white' : down ? 'red' : 'green';
  const col = !moving ? CYAN : down ? RED : GREEN;
  const w = 780, h = 470, left = -w / 2, top = -h / 2, right = w / 2, pad = 40;
  const g = uid('nuiwal', id);
  // trend line (drawn as the count runs)
  const pts: string[] = [];
  const N_ = 24;
  const shown = moving ? Math.max(1, Math.round(p * N_)) : 0;
  for (let i = 0; i <= shown; i++) {
    const u = i / N_;
    const wig = Math.sin(i * 1.9) * 10 + Math.sin(i * 0.7) * 6;
    const yy = top + h - 70 - (down ? 1 - u : u) * 120 + wig * (down ? 1 : 1);
    pts.push(`${left + 30 + u * (w - 60)},${yy}`);
  }
  const endPunch = t >= c1 ? 1 + 0.04 * Math.sin(Math.PI * clamp01((t - c1) / 0.25)) : 1;
  const coinX = isAr() ? right - pad - 44 : left + pad + 44;
  const st = startAt(left + pad + 104, right - pad - 104);
  const arX = isAr() ? left + pad + 40 : right - pad - 40;
  return (
    <g transform={`translate(${x + lf.dx} ${y + lf.dy}) scale(${lf.s * s * endPunch})`} opacity={lf.o}>
      <defs>
        <clipPath id={g + 'c'}>
          <rect x={left} y={top} width={w} height={h} rx={44} />
        </clipPath>
        <linearGradient id={g + 'a'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={col} stopOpacity="0.35" />
          <stop offset="1" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <Panel x={left} y={top} w={w} h={h} r={44} id={id} glow={col} glowO={0.5} />
      <g clipPath={`url(#${g}c)`}>
        {pts.length > 1 && (
          <g>
            <polygon points={`${pts.join(' ')} ${pts[pts.length - 1].split(',')[0]},${top + h} ${left + 30},${top + h}`} fill={`url(#${g}a)`} />
            <polyline points={pts.join(' ')} fill="none" stroke={col} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
          </g>
        )}
      </g>
      <Coin x={coinX} y={top + pad + 40} r={44} symbol={symbol} id={id} />
      <Txt x={st.x} y={top + pad + 40} size={46} text={label ?? L('المحفظة', 'Wallet')} anchor={st.anchor} />
      {moving && (
        <g transform={`translate(${arX} ${top + pad + 40})`}>
          <circle r={34} fill={col} stroke={OUT} strokeWidth={6} />
          <path d={down ? 'M0 16 L-15 -8 L15 -8 Z' : 'M0 -16 L-15 8 L15 8 Z'} fill="#FFFFFF" />
        </g>
      )}
      <GlowText text={fmtVal(v, dec)} x={0} y={top + 220} size={140} tone={tone} id={id + 'v'} />
      {unit && <NPill text={unit} x={0} y={top + 330} size={44} kind={moving ? (down ? 'red' : 'green') : 'white'} id={id + 'u'} />}
    </g>
  );
};

/**
 * AlertBanner — a warning banner that SLAMS in (pressIn: 1.64× → 1 in 165 ms, white flash, shock ring), hazard stripes
 * at both ends and a ⚠. tone 'red' (danger) or 'gold' (caution). (x, y) = centre; width follows the text. Sound: boom.
 */
export const AlertBanner: React.FC<{t: number; at: number; x: number; y: number; text: string; tone?: 'red' | 'gold'; size?: number; id: string; out?: number}> = ({
  t, at, x, y, text, tone = 'red', size = 76, id, out,
}) => {
  if (t < at) return null;
  const f = flyOut(t, out, 0, -1);
  if (f.o <= 0) return null;
  cueSfx('boom', `alert-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.16});
  const u = (t - at) / 0.165;
  const q = pressIn(u);
  const red = tone === 'red';
  const body = red ? ['#FF6B78', '#D92A3E'] : ['#FFD45A', '#F2B010'];
  const ink = red ? '#FFFFFF' : N.goldInk;
  const hgt = size * 2, stripe = size * 1.1;
  const w = textWidth(text, size) + size * 1.6 + hgt * 0.9 + stripe * 2;
  const left = -w / 2, top = -hgt / 2;
  const g = uid('nuial', id);
  const flash = 1 - clamp01((t - at) / 0.25);
  const ring = clamp01((t - at) / 0.5);
  const icX = isAr() ? w / 2 - stripe - hgt * 0.5 : -w / 2 + stripe + hgt * 0.5;
  const txX = isAr() ? icX - hgt * 0.5 - size * 0.3 : icX + hgt * 0.5 + size * 0.3;
  return (
    <g transform={`translate(${x + f.dx} ${y + f.dy})`} opacity={f.o}>
      {ring < 1 && <rect x={left - ring * 120} y={top - ring * 70} width={w + ring * 240} height={hgt + ring * 140} rx={hgt / 2 + ring * 70} fill="none" stroke={body[0]} strokeWidth={10 * (1 - ring)} opacity={0.8 * (1 - ring)} />}
      <g transform={`scale(${q.s})`} opacity={q.o}>
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={body[0]} />
            <stop offset="1" stopColor={body[1]} />
          </linearGradient>
          <pattern id={g + 'p'} width={44} height={44} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={44} height={44} fill="#16121F" />
            <rect width={22} height={44} fill={red ? '#FCC018' : '#16121F'} opacity={red ? 1 : 0} />
            {!red && <rect width={22} height={44} fill="#FFFFFF" opacity={0.9} />}
          </pattern>
          <filter id={g + 'b'} x="-30%" y="-80%" width="160%" height="260%">
            <feGaussianBlur stdDeviation={34} />
          </filter>
          <clipPath id={g + 'c'}>
            <rect x={left} y={top} width={w} height={hgt} rx={hgt * 0.28} />
          </clipPath>
        </defs>
        <rect x={left} y={top} width={w} height={hgt} rx={hgt * 0.28} fill={body[0]} opacity={0.6 + 0.1 * Math.sin((t - at) * 4)} filter={`url(#${g}b)`} />
        <rect x={left} y={top} width={w} height={hgt} rx={hgt * 0.28} fill={`url(#${g})`} />
        <g clipPath={`url(#${g}c)`}>
          <rect x={left} y={top} width={stripe} height={hgt} fill={`url(#${g}p)`} />
          <rect x={w / 2 - stripe} y={top} width={stripe} height={hgt} fill={`url(#${g}p)`} />
          <rect x={left} y={top} width={w} height={hgt * 0.3} fill="#FFFFFF" opacity={0.2} />
          {flash > 0 && <rect x={left} y={top} width={w} height={hgt} fill="#FFFFFF" opacity={0.85 * flash} />}
        </g>
        <rect x={left} y={top} width={w} height={hgt} rx={hgt * 0.28} fill="none" stroke={OUT} strokeWidth={10} />
        <circle cx={icX} cy={0} r={hgt * 0.34} fill="#FFFFFF" stroke={OUT} strokeWidth={7} />
        <IconWarn x={icX} y={-hgt * 0.02} r={hgt * 0.2} color={red ? RED : N.goldDeep} />
        <Txt x={txX} y={size * 0.04} size={size} text={text} anchor={isAr() ? 'end' : 'start'} fill={ink} outline={red ? 1 : 0} />
      </g>
    </g>
  );
};

/** Pill kinds re-exported for callers that colour UI labels. */
export type {PillKind};
