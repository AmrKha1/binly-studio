import React from 'react';
import {clamp01, ease, lerp, rand, spring} from './anim';
import {C, FONT_SERIF} from './theme';
import {cueSfx} from './sfx';
import {textW} from './text';

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// EDIT FX — the high-end YouTube editor's toolbox (owner 2026-10-21: "edits so good, like a real high-end YouTuber"),
// in Binly's clean style: bold extruded pop text, speed lines from the corners, comic bursts with halftone dots,
// dynamic tilted "camera" angles, punch-in shake. Use them on BEATS (a number lands, a twist, a joke, a reveal) —
// they lose power when they never stop. All deterministic; each cues its own sound.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * PopText — big bold sticker-style words like "6:30 AM": white (or `fill`) heavy rounded text with a thick dark
 * extruded 3D shadow (`depth` px, toward bottom-right) and a thin outline; pops in with a spring + slight tilt.
 * Arabic works too (Stage swaps the font). size auto-fits `maxW` if given.
 */
export const PopText: React.FC<{
  t: number; at: number; x: number; y: number; text: string; size?: number; fill?: string; shadow?: string; depth?: number;
  rot?: number; out?: number; maxW?: number; anchor?: 'start' | 'middle' | 'end'; glow?: boolean;
}> = ({t, at, x, y, text, size = 150, fill = '#FFFFFF', shadow = '#1F2A5C', depth, rot = -3, out, maxW, anchor = 'middle', glow = true}) => {
  if (t < at - 0.02) return null;
  const outP = out === undefined ? 0 : clamp01((t - out) / 0.3);
  if (outP >= 1) return null;
  const fs = maxW ? Math.min(size, maxW / Math.max(1, textW(text, 1, 'serif', 800) * 1.15)) : size;
  const d = depth ?? Math.round(fs * 0.075);
  const k = spring(clamp01((t - at) / 0.45), 0.5);
  const s = lerp(0.3, 1, k) * (1 - outP * 0.4);
  const r = rot * (2 - k);
  cueSfx('popup', `pt@${at}:${text}`, true, x);
  const common = {x: 0, y: fs * 0.35, textAnchor: anchor, fontFamily: FONT_SERIF, fontWeight: 900, fontSize: fs} as const;
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={clamp01((t - at) * 8) * (1 - outP)}>
      {/* soft glow so it catches the eye on any background */}
      {glow && <text {...common} fill={shadow} opacity={0.35} style={{filter: `blur(${(fs * 0.08).toFixed(1)}px)`}}>{text}</text>}
      {/* extrusion: stacked copies toward bottom-right (thick, dark) */}
      {Array.from({length: d}, (_, i) => (
        <text key={i} {...common} x={i + 1} y={fs * 0.35 + i + 1} fill={shadow} stroke={shadow} strokeWidth={fs * 0.1} strokeLinejoin="round">
          {text}
        </text>
      ))}
      {/* border ring */}
      <text {...common} fill={shadow} stroke={shadow} strokeWidth={fs * 0.1} strokeLinejoin="round">
        {text}
      </text>
      {/* fat face: fill + same-colour stroke makes the letters chunkier than the font's heaviest weight */}
      <text {...common} fill={fill} stroke={fill} strokeWidth={fs * 0.045} strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
};

/**
 * SpeedLines — anime/comic focus streaks rushing in from the frame edges toward (cx, cy): "look HERE / this is big".
 * Animated (they flicker and slide inward). colour: white on photos/dark, ink on white. p = strength 0..1 (fade it).
 */
export const SpeedLines: React.FC<{t: number; p?: number; cx?: number; cy?: number; color?: string; n?: number; inner?: number; seed?: number}> = ({
  t, p = 1, cx = 960, cy = 540, color = '#FFFFFF', n = 46, inner = 420, seed = 3,
}) => {
  if (p <= 0) return null;
  cueSfx('whoosh', `sl@${cx},${cy}`, true, cx, {gain: 0.6});
  const R = 1500;
  const frame = Math.floor(t * 12); // re-shuffle 12× per second → flicker like hand-drawn lines
  return (
    <g opacity={clamp01(p)}>
      {Array.from({length: n}, (_, i) => {
        const r0 = rand(seed * 13 + i * 7.3 + frame * 0.37);
        const a = (i / n) * Math.PI * 2 + (r0 - 0.5) * 0.12;
        const start = inner + r0 * 260;
        const w = 4 + rand(seed + i * 3.1 + frame) * 14;
        const x1 = cx + Math.cos(a) * start, y1 = cy + Math.sin(a) * start;
        const x2 = cx + Math.cos(a) * R, y2 = cy + Math.sin(a) * R;
        const nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
        return <path key={i} d={`M${x1} ${y1} L${x2 + nx} ${y2 + ny} L${x2 - nx} ${y2 - ny} Z`} fill={color} opacity={0.55 + 0.45 * r0} />;
      })}
    </g>
  );
};

/** Halftone dot pattern (comic print) — use as a fill: <Halftone id="h1" color="#B4382B" /> then fill="url(#h1)". */
export const Halftone: React.FC<{id: string; color?: string; size?: number; r?: number}> = ({id, color = '#B4382B', size = 14, r = 3.6}) => (
  <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
    <circle cx={size / 2} cy={size / 2} r={r} fill={color} />
  </pattern>
);

/**
 * Burst — comic explosion star behind a big word/number ("500 MILLION"): spiky starburst with a halftone shadow,
 * slams in with overshoot. Put PopText on top. colours from the Binly palette by default.
 */
export const Burst: React.FC<{t: number; at: number; x: number; y: number; r?: number; spikes?: number; fill?: string; dots?: string; out?: number; seed?: number; rot?: number}> = ({
  t, at, x, y, r = 330, spikes = 14, fill = '#FFFFFF', dots = '#B4382B', out, seed = 5, rot = -8,
}) => {
  if (t < at - 0.02) return null;
  const outP = out === undefined ? 0 : clamp01((t - out) / 0.3);
  if (outP >= 1) return null;
  const k = spring(clamp01((t - at) / 0.4), 0.55);
  cueSfx('impact', `bu@${at}`, true, x, {gain: 0.8});
  const pts = Array.from({length: spikes * 2}, (_, i) => {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r * (0.92 + 0.18 * rand(seed + i)) : r * (0.62 + 0.08 * rand(seed * 3 + i));
    return `${Math.cos(a) * rr} ${Math.sin(a) * rr}`;
  });
  const id = `bt${Math.round(x)}_${Math.round(y)}`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + (1 - k) * 25}) scale(${lerp(0.2, 1, k) * (1 - outP * 0.5)})`} opacity={1 - outP}>
      <defs><Halftone id={id} color={dots} /></defs>
      <path d={`M${pts.join(' L')} Z`} fill={`url(#${id})`} transform="translate(22 26)" />
      <path d={`M${pts.join(' L')} Z`} fill={fill} stroke={C.ink} strokeWidth={10} strokeLinejoin="round" />
    </g>
  );
};

/**
 * Tilt — a dynamic "camera angle" on a group (like a stats counter shot at an angle): skews + rotates the content and
 * drifts slowly so a flat thing feels filmed. Pair with Depth (kit/asset) to blur its far side for the full effect.
 */
export const Tilt: React.FC<{t: number; x?: number; y?: number; angle?: number; skew?: number; drift?: number; children?: React.ReactNode}> = ({t, x = 960, y = 540, angle = -8, skew = -10, drift = 1, children}) => {
  const d = Math.sin(t * 0.6) * 1.2 * drift;
  return <g transform={`translate(${x} ${y}) rotate(${angle + d}) skewX(${skew}) scale(${1.05 + 0.02 * Math.sin(t * 0.5) * drift}) translate(${-x} ${-y})`}>{children}</g>;
};

/**
 * Punch — a punch-in zoom + tiny shake on a beat (a hit, a reveal, a joke): wrap the whole scene. Lasts ~0.5 s.
 */
export const Punch: React.FC<{t: number; at: number; x?: number; y?: number; amount?: number; children?: React.ReactNode}> = ({t, at, x = 960, y = 540, amount = 0.12, children}) => {
  const u = t - at;
  if (u < 0 || u > 1.2) return <>{children}</>;
  cueSfx('thump', `pu@${at}`, true, x, {gain: 0.7});
  const zoom = 1 + amount * Math.exp(-u * 4) * (u < 0.06 ? u / 0.06 : 1);
  const sh = u < 0.35 ? Math.sin(u * 90) * 10 * (1 - u / 0.35) : 0;
  return <g transform={`translate(${x + sh} ${y + sh * 0.5}) scale(${zoom}) translate(${-x} ${-y})`}>{children}</g>;
};

/** EmoteMark — manga emotion symbols near a character's head: 'anger' (vein), 'sweat', 'shock' (lines), 'idea' (bulb glint). */
export const EmoteMark: React.FC<{t: number; at: number; x: number; y: number; kind: 'anger' | 'sweat' | 'shock' | 'sparkle'; s?: number; color?: string}> = ({t, at, x, y, kind, s = 1, color}) => {
  if (t < at) return null;
  const k = spring(clamp01((t - at) / 0.35), 0.6);
  const pulse = 1 + 0.08 * Math.sin((t - at) * 10);
  cueSfx(kind === 'anger' ? 'error' : kind === 'sweat' ? 'drip' : kind === 'shock' ? 'pop' : 'sparkle', `em@${at}`, true, x, {gain: 0.6});
  const col = color ?? (kind === 'anger' ? '#C8372B' : kind === 'sweat' ? '#4F8FD6' : C.ink);
  const sc = s * k * pulse;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`}>
      {kind === 'anger' && (
        <g stroke={col} strokeWidth={9} strokeLinecap="round" fill="none">
          <path d="M-30 -8 Q-12 -12 -8 -30" /><path d="M8 -30 Q12 -12 30 -8" /><path d="M30 8 Q12 12 8 30" /><path d="M-8 30 Q-12 12 -30 8" />
        </g>
      )}
      {kind === 'sweat' && <path d="M0 -36 C14 -14 22 0 22 12 C22 26 12 34 0 34 C-12 34 -22 26 -22 12 C-22 0 -14 -14 0 -36 Z" fill={col} stroke={C.ink} strokeWidth={4} />}
      {kind === 'shock' && (
        <g stroke={col} strokeWidth={7} strokeLinecap="round">
          {[-60, -30, 0, 30, 60].map((a) => <line key={a} x1={Math.sin((a * Math.PI) / 180) * 30} y1={-Math.cos((a * Math.PI) / 180) * 30} x2={Math.sin((a * Math.PI) / 180) * 62} y2={-Math.cos((a * Math.PI) / 180) * 62} />)}
        </g>
      )}
      {kind === 'sparkle' && <path d="M0 -40 C4 -6 6 -4 40 0 C6 4 4 6 0 40 C-4 6 -6 4 -40 0 C-6 -4 -4 -6 0 -40 Z" fill={col === C.ink ? C.goldLight : col} stroke={C.ink} strokeWidth={3} />}
    </g>
  );
};

/** easing helper re-export for scenes that combine these */
export const editEase = ease;
