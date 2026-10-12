import React from 'react';
import {C, FONT_SANS, FONT_SERIF, SEM, Sem} from './theme';
import {clamp01, countUp, ease, lerp, ramp} from './anim';

// Typography. Rules: short editorial headlines/labels only, no burned-in subtitles,
// ink on paper or paper on ink, keep inside SAFE margins, numbers EXACTLY as spoken.

/** Approximate rendered width (px) of a single line — good enough for layout boxes. */
export const textW = (text: string, size: number, font: 'serif' | 'sans' | 'sansCaps' = 'serif', weight = 600) => {
  const k = font === 'serif' ? 0.52 : font === 'sansCaps' ? 0.7 : 0.56;
  return text.length * size * k * (weight >= 700 ? 1.04 : 1);
};

type Anchor = 'start' | 'middle' | 'end';

/**
 * Headline (serif). p: 0→1 reveal progress. mode:
 *  'rise'  — whole line fades/rises (default)
 *  'words' — words reveal one after another across p
 *  'type'  — typewriter
 *  'mask'  — line slides up from behind a mask (editorial)
 */
export const Headline: React.FC<{
  x: number;
  y: number;
  text: string;
  p: number;
  size?: number;
  color?: string;
  anchor?: Anchor;
  italic?: boolean;
  weight?: number;
  mode?: 'rise' | 'words' | 'type' | 'mask';
  /** words to tint (exact word match, case-insensitive) → colour */
  accent?: Record<string, string>;
  font?: 'serif' | 'sans';
  out?: number; // 0→1 exit progress (fades/lifts out)
}> = ({x, y, text, p, size = 72, color = C.ink, anchor = 'middle', italic = false, weight = 600, mode = 'rise', accent, font = 'serif', out = 0}) => {
  if (p <= 0 || out >= 1) return null;
  const ff = font === 'serif' ? FONT_SERIF : FONT_SANS;
  const exitK = ease.in(clamp01(out));
  const style = {fontFamily: ff, fontStyle: italic ? 'italic' : 'normal', fontWeight: weight, fontSize: size} as const;
  const words = text.split(' ');
  const tint = (w: string) => accent?.[w.toLowerCase().replace(/[^\w']/g, '')] ?? color;
  if (mode === 'type') {
    const n = Math.floor(clamp01(p) * text.length);
    return (
      <text x={x} y={y} textAnchor={anchor} fill={color} opacity={1 - exitK} {...style}>
        {text.slice(0, n)}
      </text>
    );
  }
  if (mode === 'words') {
    return (
      <text x={x} y={y - exitK * 20} textAnchor={anchor} opacity={1 - exitK} {...style}>
        {words.map((w, i) => {
          const k = ease.out(clamp01(p * words.length * 1.15 - i * 1.0));
          return (
            <tspan key={i} fill={tint(w)} fillOpacity={k} dy={0}>
              {w + (i < words.length - 1 ? ' ' : '')}
            </tspan>
          );
        })}
      </text>
    );
  }
  if (mode === 'mask') {
    const k = ease.outQuint(clamp01(p));
    const id = `hm${Math.round(x)}_${Math.round(y)}_${text.length}`;
    return (
      <g opacity={1 - exitK}>
        <clipPath id={id}>
          <rect x={-10000} y={y - size * 1.05} width={20000} height={size * 1.4} />
        </clipPath>
        <text x={x} y={y + (1 - k) * size * 1.2} textAnchor={anchor} clipPath={`url(#${id})`} {...style}>
          {words.map((w, i) => (
            <tspan key={i} fill={tint(w)}>
              {w + (i < words.length - 1 ? ' ' : '')}
            </tspan>
          ))}
        </text>
      </g>
    );
  }
  const k = ease.out(clamp01(p));
  return (
    <text x={x} y={y + (1 - k) * size * 0.35 - exitK * 20} textAnchor={anchor} opacity={k * (1 - exitK)} {...style}>
      {words.map((w, i) => (
        <tspan key={i} fill={tint(w)}>
          {w + (i < words.length - 1 ? ' ' : '')}
        </tspan>
      ))}
    </text>
  );
};

/** Small uppercase tracked label (sans) — section kickers, axis labels, captions on diagrams. */
export const Kicker: React.FC<{x: number; y: number; text: string; p?: number; size?: number; color?: string; anchor?: Anchor; weight?: number}> = ({
  x,
  y,
  text,
  p = 1,
  size = 24,
  color = C.inkMute,
  anchor = 'middle',
  weight = 700,
}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  return (
    <text x={x} y={y + (1 - k) * 10} textAnchor={anchor} fontFamily={FONT_SANS} fontWeight={weight} fontSize={size} letterSpacing={size * 0.16} fill={color} opacity={k}>
      {text.toUpperCase()}
    </text>
  );
};

/**
 * Wrapped paragraph text (HTML inside SVG). Use for card bodies, quotes, multi-line captions.
 * Keep it SHORT — this is a video, not a slide deck.
 */
export const Para: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  text: React.ReactNode;
  p?: number;
  size?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  font?: 'serif' | 'sans';
  weight?: number;
  italic?: boolean;
  lineHeight?: number;
}> = ({x, y, w, h = 600, text, p = 1, size = 36, color = C.ink, align = 'left', font = 'serif', weight = 500, italic = false, lineHeight = 1.25}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  return (
    <foreignObject x={x} y={y + (1 - k) * 14} width={w} height={h} opacity={k}>
      <div
        style={{
          fontFamily: font === 'serif' ? FONT_SERIF : FONT_SANS,
          fontSize: size,
          fontWeight: weight,
          fontStyle: italic ? 'italic' : 'normal',
          color,
          textAlign: align,
          lineHeight,
        }}
      >
        {text}
      </div>
    </foreignObject>
  );
};

/**
 * Semantic chip. kind = confirmed/evidence (green), theory/speculation (plum), caution/debated (mustard),
 * signal (oxblood), ink. Optional leader line `to` a point. p drives the reveal.
 */
export const Tag: React.FC<{
  x: number;
  y: number;
  text: string;
  kind?: Sem;
  p: number;
  size?: number;
  to?: {x: number; y: number};
  anchor?: 'left' | 'right' | 'center';
  dot?: boolean;
}> = ({x, y, text, kind = 'ink', p, size = 26, to, anchor = 'left', dot = true}) => {
  if (p <= 0) return null;
  const col = SEM[kind];
  const label = text.toUpperCase();
  const w = textW(label, size, 'sansCaps', 700) + size * (dot ? 2.3 : 1.6);
  const h = size * 1.9;
  const ox = anchor === 'left' ? 0 : anchor === 'right' ? -w : -w / 2;
  const reveal = ease.out(Math.min(1, p * 1.25));
  const textP = ramp(p, 0.35, 1, ease.out);
  const id = `tag${Math.round(x)}_${Math.round(y)}_${label.length}`;
  const lx = x + ox + (anchor === 'right' ? w : anchor === 'left' ? 0 : w / 2);
  return (
    <g>
      {to && (
        <g opacity={Math.min(1, p * 2)}>
          <path d={`M${lx} ${y} L${to.x} ${to.y}`} stroke={col} strokeWidth={4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - reveal} fill="none" strokeLinecap="round" />
          <circle cx={to.x} cy={to.y} r={9 * reveal} fill={col} stroke={C.paperLight} strokeWidth={3} />
        </g>
      )}
      <g transform={`translate(${x + ox} ${y - h / 2})`}>
        <clipPath id={id}>
          <rect x={0} y={-4} width={w * reveal} height={h + 8} />
        </clipPath>
        <g clipPath={`url(#${id})`}>
          <rect width={w} height={h} rx={h / 2} fill={col} />
          {dot && <circle cx={h / 2} cy={h / 2} r={size * 0.26} fill={C.paperLight} opacity={0.9} />}
          <text x={dot ? h * 0.86 : size * 0.8} y={h / 2 + size * 0.36} fontFamily={FONT_SANS} fontWeight={700} fontSize={size} letterSpacing={size * 0.08} fill={C.paperLight} opacity={textP}>
            {label}
          </text>
        </g>
      </g>
    </g>
  );
};

/** Rubber stamp that thumps down. Use for verdicts: "NOT TRUE", "BANNED", "1348". */
export const Stamp: React.FC<{x: number; y: number; text: string; p: number; color?: string; size?: number; rot?: number}> = ({x, y, text, p, color = C.oxblood, size = 56, rot = -6}) => {
  if (p <= 0) return null;
  const s = 1.35 - 0.35 * ease.outBack(Math.min(1, p));
  const label = text.toUpperCase();
  const w = textW(label, size, 'sansCaps', 800) + size * 1.2;
  const h = size * 1.7;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={Math.min(1, p * 3)}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="none" stroke={color} strokeWidth={size * 0.11} />
      <rect x={-w / 2 + size * 0.16} y={-h / 2 + size * 0.16} width={w - size * 0.32} height={h - size * 0.32} rx={6} fill="none" stroke={color} strokeWidth={size * 0.035} opacity={0.7} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={size} letterSpacing={size * 0.06} fill={color}>
        {label}
      </text>
    </g>
  );
};

/**
 * Big exact statistic. `value` is the EXACT spoken figure as a string ("0.061", "505,000", "26").
 * It counts up while p goes 0→1 and lands EXACTLY on `value`. `unit` sits beside it ("%", "percent", "kPa").
 */
export const Stat: React.FC<{
  x: number;
  y: number;
  value: string;
  unit?: string;
  label?: string;
  p: number;
  count?: boolean;
  size?: number;
  color?: string;
  anchor?: Anchor;
  labelColor?: string;
}> = ({x, y, value, unit, label, p, count = true, size = 180, color = C.ink, anchor = 'middle', labelColor = C.inkMute}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p * 3));
  const shown = count ? countUp(value, ease.outQuint(clamp01(p))) : value;
  return (
    <g opacity={k}>
      <text x={x} y={y} textAnchor={anchor} fontFamily={FONT_SERIF} fontWeight={700} fontSize={size} fill={color} style={{fontVariantNumeric: 'tabular-nums'}}>
        {shown}
        {unit && (
          <tspan fontSize={size * 0.42} fontWeight={600} dx={size * 0.08}>
            {unit}
          </tspan>
        )}
      </text>
      {label && (
        <text x={x} y={y + size * 0.42} textAnchor={anchor} fontFamily={FONT_SANS} fontWeight={700} fontSize={size * 0.15} letterSpacing={size * 0.02} fill={labelColor} opacity={ramp(p, 0.4, 1)}>
          {label.toUpperCase()}
        </text>
      )}
    </g>
  );
};

/** Hand-drawn-feel underline / highlight stroke under a word or line. */
export const Underline: React.FC<{x: number; y: number; w: number; p: number; color?: string; thick?: number; wobble?: number}> = ({x, y, w, p, color = C.oxblood, thick = 8, wobble = 4}) => {
  if (p <= 0) return null;
  const d = `M${x} ${y} C${x + w * 0.3} ${y + wobble} ${x + w * 0.6} ${y - wobble} ${x + w} ${y + wobble * 0.5}`;
  return <path d={d} stroke={color} strokeWidth={thick} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease.inOut(clamp01(p))} />;
};

/** Marker highlight band behind text (draw left→right). Put it BEFORE the text in the SVG. */
export const Highlight: React.FC<{x: number; y: number; w: number; h: number; p: number; color?: string; opacity?: number}> = ({x, y, w, h, p, color = C.cautionLight, opacity = 0.55}) => {
  if (p <= 0) return null;
  return <rect x={x} y={y} width={w * ease.inOut(clamp01(p))} height={h} rx={h * 0.2} fill={color} opacity={opacity} />;
};

/** Hand-drawn circle/ellipse around something (draws on). */
export const Circled: React.FC<{x: number; y: number; rx: number; ry?: number; p: number; color?: string; thick?: number; rot?: number}> = ({x, y, rx, ry, p, color = C.oxblood, thick = 6, rot = -8}) => {
  if (p <= 0) return null;
  const r2 = ry ?? rx * 0.62;
  // slightly open spiral: start and end don't meet exactly (hand-made feel)
  const d = `M${-rx * 0.9} ${-r2 * 0.35} C${-rx * 0.95} ${-r2 * 1.1} ${rx * 0.9} ${-r2 * 1.15} ${rx} ${-r2 * 0.05} C${rx * 1.05} ${r2 * 1.1} ${-rx * 1.0} ${r2 * 1.1} ${-rx * 1.02} ${r2 * 0.1} C${-rx * 1.03} ${-r2 * 0.5} ${-rx * 0.6} ${-r2 * 0.95} ${-rx * 0.25} ${-r2 * 1.05}`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={d} stroke={color} strokeWidth={thick} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease.inOut(clamp01(p))} />
    </g>
  );
};

/** Name card for a real person / source: "Ibn al-Khatib" + "Physician · Granada · 14th century". */
export const NameTag: React.FC<{x: number; y: number; name: string; sub?: string; p: number; anchor?: 'left' | 'right'; color?: string; dark?: boolean}> = ({
  x,
  y,
  name,
  sub,
  p,
  anchor = 'left',
  color = C.oxblood,
  dark = false,
}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  const nameSize = 46;
  const subSize = 22;
  const w = Math.max(textW(name, nameSize, 'serif'), sub ? textW(sub.toUpperCase(), subSize, 'sansCaps') : 0) + 60;
  const ox = anchor === 'left' ? 0 : -w;
  const fg = dark ? C.paperLight : C.ink;
  return (
    <g transform={`translate(${x + ox + (1 - k) * (anchor === 'left' ? -30 : 30)} ${y})`} opacity={k}>
      <rect x={0} y={-nameSize * 0.95} width={8} height={sub ? nameSize * 1.95 : nameSize * 1.2} fill={color} />
      <text x={26} y={0} fontFamily={FONT_SERIF} fontWeight={700} fontSize={nameSize} fill={fg}>
        {name}
      </text>
      {sub && (
        <text x={28} y={subSize * 1.7} fontFamily={FONT_SANS} fontWeight={700} fontSize={subSize} letterSpacing={subSize * 0.12} fill={dark ? C.paperShade : C.inkMute} opacity={ramp(p, 0.3, 1)}>
          {sub.toUpperCase()}
        </text>
      )}
    </g>
  );
};

/** Chapter / section title card content (draw it on its own Stage or over a dimmed scene). */
export const TitleCard: React.FC<{x?: number; y?: number; kicker?: string; title: string; p: number; out?: number; color?: string; kickerColor?: string; size?: number}> = ({
  x = 960,
  y = 540,
  kicker,
  title,
  p,
  out = 0,
  color = C.ink,
  kickerColor = C.oxblood,
  size = 96,
}) => {
  if (p <= 0 || out >= 1) return null;
  const lineW = lerp(0, Math.min(520, textW(title, size) * 0.6), ease.inOut(ramp(p, 0.15, 0.8)));
  return (
    <g opacity={1 - ease.in(clamp01(out))}>
      {kicker && <Kicker x={x} y={y - size * 0.95} text={kicker} p={ramp(p, 0, 0.5)} color={kickerColor} size={26} />}
      <Headline x={x} y={y} text={title} p={ramp(p, 0.1, 0.9)} size={size} color={color} mode="mask" />
      <rect x={x - lineW / 2} y={y + size * 0.42} width={lineW} height={5} fill={kickerColor} />
    </g>
  );
};
