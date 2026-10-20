import React from 'react';
import {cueSfx} from './sfx';
import {C, FONT_HAND, FONT_SANS, FONT_SERIF, GLOW, glowFor, SEM, Sem, TYPE} from './theme';
import {clamp01, countUp, ease, lerp, popIn, ramp, spring} from './anim';
import {TEXT_FO} from './stage';
import {isAr} from './lang';

// Typography. Rules: short editorial headlines/labels only, no burned-in subtitles,
// ink on paper or paper on ink, keep inside SAFE margins, numbers EXACTLY as spoken.

/** Approximate rendered width (px) of a single line — good enough for layout boxes. */
export const textW = (text: string, size: number, font: 'serif' | 'sans' | 'sansCaps' = 'serif', weight = 600) => {
  // Arabic (Baloo Bhaijaan 2, no tracking, no caps): one width for every role
  const k = isAr() ? 0.5 : font === 'serif' ? 0.52 : font === 'sansCaps' ? 0.7 : 0.56;
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
  mode?: 'rise' | 'words' | 'type' | 'mask' | 'bounce'; // bounce = words pop up one by one and land with a spring (kinetic type)
  /** words to tint (exact word match, case-insensitive) → colour */
  accent?: Record<string, string>;
  font?: 'serif' | 'sans';
  out?: number; // 0→1 exit progress (fades/lifts out)
}> = ({x, y, text, p, size = 72, color = C.ink, anchor = 'middle', italic = false, weight = 600, mode = 'bounce', accent, font = 'serif', out = 0}) => { // default: words pop up and bounce (owner 2026-10-20)
  if (p <= 0 || out >= 1) return null;
  cueSfx('swish', `${text}@${Math.round(x)},${Math.round(y)}`, true, x);
  const ff = font === 'serif' ? FONT_SERIF : FONT_SANS;
  const exitK = ease.in(clamp01(out));
  const style = {fontFamily: ff, fontStyle: italic ? 'italic' : 'normal', fontWeight: weight, fontSize: size} as const;
  const words = text.split(' ');
  const tint = (w: string) => accent?.[w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '')] ?? color;
  // elegant glow under accent words only (gold key word = gold halo): a twin text whose other words are invisible
  const glowF = accent ? glowFor(Object.values(accent)[0]) : undefined;
  const glowSpans = (fo?: (i: number) => number) =>
    words.map((w, i) => (
      <tspan key={i} fill={tint(w) !== color ? tint(w) : 'transparent'} fillOpacity={fo ? fo(i) : 1}>
        {w + (i < words.length - 1 ? ' ' : '')}
      </tspan>
    ));
  if (mode === 'type') {
    const n = Math.floor(clamp01(p) * text.length);
    return (
      <text x={x} y={y} textAnchor={anchor} fill={color} opacity={1 - exitK} {...style}>
        {text.slice(0, n)}
      </text>
    );
  }
  if (mode === 'bounce') {
    // each word jumps up into place with a springy landing, one after another (≈0.12 s apart at p speed)
    const n = words.length;
    // relative dy per word (an absolute y would start a new text chunk → words re-centred on top of each other)
    const lifts = words.map((_, i) => (1 - spring(clamp01((p * (n + 2) - i) / 2.2), 0.55)) * size * 0.55);
    const dyOf = (i: number) => lifts[i] - (i ? lifts[i - 1] : 0);
    return (
      <g>
        {glowF && (
          <text x={x} y={y} textAnchor={anchor} opacity={1 - exitK} filter={glowF} {...style}>
            {words.map((w, i) => (
              <tspan key={i} dy={dyOf(i)} fill={tint(w) !== color ? tint(w) : 'transparent'} fillOpacity={clamp01((p * (n + 2) - i) * 3)}>
                {w + (i < n - 1 ? ' ' : '')}
              </tspan>
            ))}
          </text>
        )}
        <text x={x} y={y} textAnchor={anchor} opacity={1 - exitK} {...style}>
          {words.map((w, i) => {
            const wp = clamp01((p * (n + 2) - i) / 2.2);
            cueSfx('pop', `hw${i}:${w}@${Math.round(x)},${Math.round(y)}`, wp > 0, x, {gain: 0.6});
            return (
              <tspan key={i} dy={dyOf(i)} fill={tint(w)} fillOpacity={clamp01(wp * 4)}>
                {w + (i < n - 1 ? ' ' : '')}
              </tspan>
            );
          })}
        </text>
      </g>
    );
  }
  if (mode === 'words') {
    return (
      <g>
      {glowF && (
        <text x={x} y={y - exitK * 20} textAnchor={anchor} opacity={1 - exitK} filter={glowF} {...style}>
          {glowSpans((i) => ease.out(clamp01(p * words.length * 1.15 - i * 1.0)))}
        </text>
      )}
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
      </g>
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
        {glowF && (
          <g clipPath={`url(#${id})`}>
            <text x={x} y={y + (1 - k) * size * 1.2} textAnchor={anchor} filter={glowF} {...style}>
              {glowSpans()}
            </text>
          </g>
        )}
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
  const k = spring(clamp01(p), 0.45); // rise with a springy landing
  return (
    <g>
      {glowF && (
        <text x={x} y={y + (1 - k) * size * 0.35 - exitK * 20} textAnchor={anchor} opacity={k * (1 - exitK)} filter={glowF} {...style}>
          {glowSpans()}
        </text>
      )}
      <text x={x} y={y + (1 - k) * size * 0.35 - exitK * 20} textAnchor={anchor} opacity={k * (1 - exitK)} {...style}>
        {words.map((w, i) => (
          <tspan key={i} fill={tint(w)}>
            {w + (i < words.length - 1 ? ' ' : '')}
          </tspan>
        ))}
      </text>
    </g>
  );
};

/** Small uppercase tracked label (sans) — section kickers, axis labels, captions on diagrams. */
export const Kicker: React.FC<{x: number; y: number; text: string; p?: number; size?: number; color?: string; anchor?: Anchor; weight?: number}> = ({
  x,
  y,
  text,
  p = 1,
  size = TYPE.small,
  color = C.inkMute,
  anchor = 'middle',
  weight = 700,
}) => {
  if (p <= 0) return null;
  cueSfx('tick', `${text}@${Math.round(x)},${Math.round(y)}`, true, x, {gain: 0.7});
  const k = spring(clamp01(p), 0.45);
  size = Math.max(size, TYPE.small); // phone-readable floor
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
}> = ({x, y, w, h = 600, text, p = 1, size = TYPE.read, color = C.ink, align = 'left', font = 'serif', weight = 500, italic = false, lineHeight = 1.25}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  return (
    <foreignObject className={TEXT_FO} x={x} y={y + (1 - k) * 14} width={w} height={h} opacity={k}>
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
 * Semantic certainty label. kind = confirmed/evidence (green), theory/speculation (plum), caution/debated (mustard),
 * signal (oxblood), ink. look 'caption' (default — museum-caption style: colour stripe + italic serif on a paper slip)
 * or 'pill' (old solid chip). Optional leader line `to` a point. p drives the reveal.
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
  look?: 'caption' | 'pill';
}> = ({x, y, text, kind = 'ink', p, size: size0 = 44, to, anchor = 'left', dot = false, look = 'pill'}) => {
  if (p <= 0) return null;
  if (look !== 'pill') cueSfx('tick', `${text}@${Math.round(x)},${Math.round(y)}`, true, x);
  if (look === 'pill') return <GlowPill x={x} y={y} text={text} kind={kind} p={p} size={size0} to={to} anchor={anchor} />;
  const col = SEM[kind];
  const onCol = kind === 'caution' ? C.ink : C.paperLight; // dark text on mustard for contrast
  const cap = look === 'caption';
  const size = Math.max(size0, cap ? TYPE.read / 1.12 : TYPE.label); // phone-readable floor (caption text renders at size × 1.12)
  const label = cap ? text : text.toUpperCase();
  const fs = cap ? size * 1.12 : size;
  const w = cap ? size * 0.22 + size * 0.55 + textW(label, fs, 'serif', 600) * 1.06 + size * 0.75 : textW(label, size, 'sansCaps', 700) + size * (dot ? 2.3 : 1.6);
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
        {cap ? (
          <g>
            <g clipPath={`url(#${id})`}>
              <rect width={w} height={h} rx={3} fill={C.paperLight} opacity={0.94} />
              <text x={size * 0.22 + size * 0.55} y={h / 2 + fs * 0.34} fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={fs} fill={C.ink} opacity={textP}>
                {label}
              </text>
            </g>
            <rect x={0} y={0} width={size * 0.22} height={h * ease.out(Math.min(1, p * 1.6))} fill={col} />
          </g>
        ) : (
        <g clipPath={`url(#${id})`}>
          <rect width={w} height={h} rx={h / 2} fill={col} />
          {dot && <circle cx={h / 2} cy={h / 2} r={size * 0.26} fill={onCol} opacity={0.9} />}
          <text x={dot ? h * 0.86 : size * 0.8} y={h / 2 + size * 0.36} fontFamily={FONT_SANS} fontWeight={700} fontSize={size} letterSpacing={size * 0.08} fill={onCol} opacity={textP}>
            {label}
          </text>
        </g>
        )}
      </g>
    </g>
  );
};

/** @legacy Rubber stamp — NOT used by Binly any more (verdicts = the red pen). Kept only so old code still renders. */
export const Stamp: React.FC<{x: number; y: number; text: string; p: number; color?: string; size?: number; rot?: number}> = ({x, y, text, p, color = C.oxblood, size = 56, rot = -6}) => {
  if (p <= 0) return null;
  cueSfx('stamp', `${text}@${Math.round(x)},${Math.round(y)}`, true, x);
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
 * RedPen — the editor's red pen: hand-drawn strike(s) through a false claim (`lines` = the text lines to cross out,
 * each {x, y (middle of the text line), w}), then a handwritten `note` (HandNote) at noteX/noteY. strike:false →
 * a hand-drawn underline instead (for a verdict on a TRUE claim). p 0→0.6 draws the strikes, 0.5→1 writes the note.
 * Binly's ONLY verdict style (myth-busting). For the climax verdict use it at hero size (full-screen claim, big note).
 */
export const RedPen: React.FC<{
  lines: {x: number; y: number; w: number}[];
  p: number;
  note?: string;
  noteX?: number;
  noteY?: number;
  noteSize?: number;
  noteAnchor?: Anchor;
  strike?: boolean;
  color?: string;
  thick?: number;
  seed?: number;
}> = ({lines, p, note, noteX, noteY, noteSize = 56, noteAnchor = 'start', strike = true, color = C.oxblood, thick = 7, seed = 1}) => {
  if (p <= 0) return null;
  const n = Math.max(1, lines.length);
  const sp = ramp(p, 0, 0.6, ease.linear);
  const last = lines[lines.length - 1];
  return (
    <g>
      {lines.map((l, i) => {
        const lp = clamp01(sp * n - i);
        if (lp <= 0) return null;
        const wob = (k: number) => Math.sin((seed + i) * 12.9898 + k * 78.233) * 4;
        const y0 = l.y + (strike ? 0 : 18);
        const d = `M${l.x - 10} ${y0 + wob(1)} C ${l.x + l.w * 0.3} ${y0 - 6 + wob(2)}, ${l.x + l.w * 0.65} ${y0 + 7 + wob(3)}, ${l.x + l.w + 12} ${y0 - 3 + wob(4)}`;
        return <path key={i} d={d} stroke={color} strokeWidth={thick} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease.inOut(lp)} />;
      })}
      {note && last && (
        <HandNote x={noteX ?? last.x + last.w * 0.5} y={noteY ?? last.y + noteSize * 1.25} text={note} p={ramp(p, 0.5, 1, ease.linear)} size={noteSize} color={color} anchor={noteAnchor} rot={-4} />
      )}
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
  cueSfx(count ? 'count' : 'pop', `stat${value}@${Math.round(x)},${Math.round(y)}`, count ? p < 1 : true, x, {sustain: count});
  cueSfx('ding', `stat${value}@${Math.round(x)},${Math.round(y)}`, count && p >= 1, x);
  const k = ease.out(clamp01(p * 3));
  const shown = count ? countUp(value, ease.outQuint(clamp01(p))) : value;
  return (
    <g opacity={k}>
      <text x={x} y={y} textAnchor={anchor} fontFamily={FONT_SERIF} fontWeight={700} fontSize={size} fill={color} filter={glowFor(color)} style={{fontVariantNumeric: 'tabular-nums'}}>
        {shown}
        {unit && (
          <tspan fontSize={size * 0.42} fontWeight={600} dx={size * 0.08}>
            {unit}
          </tspan>
        )}
      </text>
      {label && (
        <text x={x} y={y + size * 0.42} textAnchor={anchor} fontFamily={FONT_SANS} fontWeight={700} fontSize={Math.max(TYPE.label, size * 0.2)} letterSpacing={size * 0.02} fill={labelColor} opacity={ramp(p, 0.4, 1)}>
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

/** Pill colours per certainty kind (white mode): fill, text, glow. */
const PILL: Record<Sem, {bg: string; fg: string; glow: string}> = {
  ink: {bg: '#FFFFFF', fg: C.ink, glow: GLOW.soft},
  caution: {bg: C.goldLight, fg: C.ink, glow: GLOW.gold},
  debated: {bg: C.goldLight, fg: C.ink, glow: GLOW.gold},
  theory: {bg: C.lavender, fg: C.ink, glow: GLOW.lavender},
  speculation: {bg: C.lavender, fg: C.ink, glow: GLOW.lavender},
  confirmed: {bg: C.evidenceTint, fg: C.evidence, glow: GLOW.green},
  evidence: {bg: C.evidenceTint, fg: C.evidence, glow: GLOW.green},
  signal: {bg: C.oxblood, fg: '#FFFFFF', glow: GLOW.oxblood},
};

/**
 * GlowPill — the channel's signature label (owner's pick, 2026-10-20): a fully rounded pill, heavy text, soft glow in
 * its colour. kind picks the colour (ink = white pill with a soft lift). Pops in (scale + fade); optional leader `to`.
 */
export const GlowPill: React.FC<{x: number; y: number; text: string; kind?: Sem; p: number; size?: number; to?: {x: number; y: number}; anchor?: 'left' | 'right' | 'center'; font?: string}> = ({
  x, y, text, kind = 'ink', p, size: size0 = 44, to, anchor = 'left', font = FONT_SANS,
}) => {
  if (p <= 0) return null;
  cueSfx('popup', `${text}@${Math.round(x)},${Math.round(y)}`, true, x);
  const size = Math.max(size0, 44); // heavy 800 text: phone-readable floor
  const st = PILL[kind];
  const h = size * 1.75;
  const w = textW(text, size, 'sans', 800) * 1.12 + size * 1.5; // Inter 800 runs ~10% wider than the estimate
  const ox = anchor === 'left' ? 0 : anchor === 'right' ? -w : -w / 2;
  const q = popIn(p * 1.25, 0.45, 0.25); // pop-up with bounce + jelly
  const cx = x + ox + w / 2;
  return (
    <g>
      {to && (
        <g opacity={clamp01(p * 2)}>
          <path d={`M${cx} ${y} L${to.x} ${to.y}`} stroke={kind === 'ink' ? C.inkMute : st.bg} strokeWidth={4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease.out(clamp01(p * 1.25))} fill="none" strokeLinecap="round" />
          <circle cx={to.x} cy={to.y} r={9 * ease.out(clamp01(p * 1.25))} fill={kind === 'ink' ? C.ink : st.bg} stroke="#FFFFFF" strokeWidth={3} />
        </g>
      )}
      <g transform={`translate(${cx} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={st.bg} filter={st.glow} />
        <rect x={-w / 2 + h * 0.3} y={-h / 2 + 5} width={w - h * 0.6} height={h * 0.22} rx={h * 0.11} fill="#FFFFFF" opacity={kind === 'ink' ? 0 : 0.35} />
        <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={font} fontWeight={800} fontSize={size} fill={st.fg} opacity={ramp(p, 0.25, 0.8)}>
          {text}
        </text>
      </g>
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
  cueSfx('swoosh', `${name}@${Math.round(x)},${Math.round(y)}`, true, x);
  const k = ease.out(clamp01(p));
  const nameSize = 64;
  const subSize = TYPE.small;
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
      {kicker && <Kicker x={x} y={y - size * 0.95} text={kicker} p={ramp(p, 0, 0.5)} color={kickerColor} />}
      <Headline x={x} y={y} text={title} p={ramp(p, 0.1, 0.9)} size={size} color={color} mode="mask" />
      <rect x={x - lineW / 2} y={y + size * 0.42} width={lineW} height={5} fill={kickerColor} />
    </g>
  );
};

/**
 * HandNote — a handwritten note (Caveat), written on letter by letter as p goes 0→1. RARE accent: scribbled notes
 * on images/documents only — never titles or body text. size ≥ 34. rot = slight tilt in degrees.
 */
export const HandNote: React.FC<{x: number; y: number; text: string; p?: number; size?: number; color?: string; rot?: number; anchor?: Anchor; weight?: 500 | 700}> = ({
  x, y, text, p = 1, size = 50, color = C.oxblood, rot = -3, anchor = 'start', weight = 700,
}) => {
  const n = Math.ceil(text.length * clamp01(p));
  if (n <= 0) return null;
  cueSfx('scribble', `${text}@${Math.round(x)},${Math.round(y)}`, p < 1, x, {sustain: true});
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <text x={x} y={y} textAnchor={anchor} fontFamily={FONT_HAND} fontWeight={weight} fontSize={Math.max(TYPE.read, size)} fill={color}>
        {text.slice(0, n)}
      </text>
    </g>
  );
};

/**
 * SlamTitle — the "in your face" headline (owner's request, 2026-10-20): ONE giant word slams toward the viewer
 * (scale 2.4 → 1, overshoot + a small impact shake), thick deep-colour outline + soft glow in its colour, while the scene
 * behind fades to a clean white wash. Holds, then flies past the viewer (scales up + fades) at `out`.
 * Use for the 3–6 BIG pivots of a video (a chapter's one-word theme: "WAR", "الحرب", "MONEY") — never for normal labels.
 *   tone: 'red' (war, danger, death) · 'gold' (money, treasure, wins) · 'lavender' (mystery, mind) · 'green' (life, nature)
 *   size: auto-fits the word to ~85% of the frame width (cap 400 px). sub: optional pill under the word.
 */
export const SlamTitle: React.FC<{t: number; at: number; out?: number; text: string; tone?: 'red' | 'gold' | 'lavender' | 'green'; size?: number; sub?: string; wash?: number; y?: number}> = ({
  t, at, out, text, tone = 'red', size, sub, wash = 0.88, y = 560,
}) => {
  if (t < at - 0.05 || (out !== undefined && t > out + 0.45)) return null;
  cueSfx('slam', `${text}@${at}`, t >= at, 960);
  cueSfx('whoosh', `${text}@out`, out !== undefined && t >= out, 960);
  const TONES = {
    red: {fill: '#E0645A', deep: C.oxDeep, glow: GLOW.oxblood},
    gold: {fill: C.goldLight, deep: '#7A5506', glow: GLOW.gold},
    lavender: {fill: C.theoryLight, deep: C.theory, glow: GLOW.lavender},
    green: {fill: C.evidenceLight, deep: C.evidence, glow: GLOW.green},
  } as const;
  const T = TONES[tone];
  const caps = /[A-Z]/.test(text) && text === text.toUpperCase(); // capitals run ~40% wider than the serif estimate
  const fs = size ?? Math.min(400, 1630 / Math.max(2, textW(text, 1, 'serif', 800) * (caps ? 1.45 : 1)));
  const inP = clamp01((t - at) / 0.38);
  const outP = out === undefined ? 0 : clamp01((t - out) / 0.4);
  const s = lerp(2.4, 1, ease.outBack(inP)) * lerp(1, 1.5, ease.in(outP));
  const hit = Math.max(0, t - at - 0.3); // impact shake right after landing, decays in ~0.4 s
  const shake = hit > 0 && hit < 0.45 ? Math.sin(hit * 70) * 14 * (1 - hit / 0.45) : 0;
  const o = clamp01(inP * 3) * (1 - outP);
  const wk = wash * clamp01((t - at + 0.05) / 0.25) * (1 - outP);
  return (
    <g>
      <rect x={-200} y={-200} width={2320} height={1480} fill="#FFFFFF" opacity={wk} />
      <g transform={`translate(${960 + shake} ${y + shake * 0.4}) scale(${s})`} opacity={o}>
        <text x={0} y={fs * 0.34} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={800} fontSize={fs} fill={T.fill} stroke={T.deep} strokeWidth={fs * 0.12} strokeLinejoin="round" paintOrder="stroke" filter={T.glow}>
          {text}
        </text>
      </g>
      {sub && <GlowPill x={960} y={y + fs * 0.62} text={sub} kind={tone === 'gold' ? 'caution' : tone === 'lavender' ? 'theory' : tone === 'green' ? 'confirmed' : 'ink'} anchor="center" p={clamp01((t - at - 0.45) / 0.4) * (1 - outP)} size={52} />}
    </g>
  );
};
