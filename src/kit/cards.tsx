import React from 'react';
import {cueSfx} from './sfx';
import {C, FONT_SANS, FONT_SERIF, GLOW, SEM, Sem, TYPE} from './theme';
import {clamp01, ease, ramp, spring} from './anim';
import {Para, Tag, textW} from './text';
import {TEXT_FO} from './stage';

// Paper objects: cards, documents, photos, notes, screens. Origin = CENTRE unless noted.
// All accept p (0→1 entrance: rises + settles) and rot (deg).

// cards/panels/documents pop up and settle with a spring (owner 2026-10-20: pop-up and bounce on everything)
const entrance = (p: number) => {
  const k = spring(clamp01(p), 0.4);
  return {o: clamp01(p * 3), dy: (1 - k) * 70, s: 0.85 + 0.15 * k};
};

/** Flat card / panel with offset shadow. Children are drawn in card-local coords (0,0 = top-left). */
export const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  p?: number;
  rot?: number;
  fill?: string;
  stroke?: string;
  radius?: number;
  shadow?: number;
  children?: React.ReactNode;
}> = ({x, y, w, h, p = 1, rot = 0, fill = C.paperLight, stroke, radius = 14, shadow = 1, children}) => {
  if (p <= 0) return null;
  cueSfx('swoosh', `card@${Math.round(x)},${Math.round(y)},${Math.round(w)}`, true, x, {gain: 0.8});
  const e = entrance(p);
  return (
    <g transform={`translate(${x} ${y + e.dy}) rotate(${rot}) scale(${e.s})`} opacity={e.o}>
      {/* white mode: soft lifted shadow (GLOW.soft) instead of a flat offset block */}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={radius} fill={fill} stroke={stroke} strokeWidth={stroke ? 3 : 0} filter={shadow > 0 ? GLOW.soft : undefined} />
      <g transform={`translate(${-w / 2} ${-h / 2})`}>{children}</g>
    </g>
  );
};

/**
 * Aged document page (decree, report, letter, study). Title + optional body lines (abstract bars or real
 * short text), seal, signature, highlighted line. Size ≈ 560×740 at s=1.
 */
export const DocumentPage: React.FC<{
  x: number;
  y: number;
  s?: number;
  p?: number;
  rot?: number;
  title?: string;
  subtitle?: string;
  lines?: number; // abstract text lines
  text?: string; // or a short real excerpt (wraps)
  highlight?: {line: number; p: number; color?: string}; // highlight an abstract line
  seal?: boolean;
  sealColor?: string;
  signature?: boolean;
  style?: 'parchment' | 'modern' | 'journal';
  write?: number; // 0→1 lines appear progressively (being written)
}> = ({x, y, s = 1, p = 1, rot = 0, title, subtitle, lines = 11, text, highlight, seal = false, sealColor = C.oxblood, signature = false, style = 'parchment', write = 1}) => {
  if (p <= 0) return null;
  const e = entrance(p);
  const w = 560;
  const h = 740;
  const paper = style === 'parchment' ? C.bone : style === 'journal' ? C.paperLight : '#F7F3EB';
  const edge = style === 'parchment' ? C.boneShade : C.paperShade;
  const ink = C.ink;
  const top = -h / 2 + 70;
  const lineY = (i: number) => top + (title ? 120 : 20) + (subtitle ? 30 : 0) + i * 44;
  return (
    <g transform={`translate(${x} ${y + e.dy}) rotate(${rot}) scale(${s * e.s})`} opacity={e.o}>
      <rect x={-w / 2 + 14} y={-h / 2 + 18} width={w} height={h} rx={6} fill={C.ink} opacity={0.15} />
      {style === 'parchment' ? (
        <path
          d={`M${-w / 2} ${-h / 2 + 8} Q${-w / 4} ${-h / 2 - 6} 0 ${-h / 2 + 4} Q${w / 4} ${-h / 2 + 12} ${w / 2} ${-h / 2} L${w / 2 - 4} ${h / 2 - 6} Q${w / 4} ${h / 2 + 8} 0 ${h / 2 - 2} Q${-w / 4} ${h / 2 - 10} ${-w / 2 + 4} ${h / 2} Z`}
          fill={paper}
        />
      ) : (
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={paper} />
      )}
      <rect x={-w / 2 + 26} y={-h / 2 + 26} width={w - 52} height={h - 52} fill="none" stroke={edge} strokeWidth={3} rx={4} />
      {style === 'journal' && <rect x={-w / 2} y={-h / 2} width={w} height={14} fill={C.oxblood} />}
      {title && (
        <text x={0} y={top + 50} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={title.length > 22 ? 42 : 52} fill={ink}>
          {title}
        </text>
      )}
      {subtitle && (
        <text x={0} y={top + 96} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={Math.min(26, (26 * (w - 100)) / textW(subtitle.toUpperCase(), 26, 'sansCaps', 700))} letterSpacing={3} fill={C.inkMute}>
          {subtitle.toUpperCase()}
        </text>
      )}
      {title && <line x1={-120} x2={120} y1={top + (subtitle ? 112 : 78)} y2={top + (subtitle ? 112 : 78)} stroke={edge} strokeWidth={3} />}
      {text ? (
        <Para x={-w / 2 + 60} y={lineY(0) - 30} w={w - 120} h={h - 260} text={text} size={TYPE.small} p={write} color={ink} italic={style === 'parchment'} />
      ) : (
        Array.from({length: lines}, (_, i) => {
          const lw = (w - 140) * (i === lines - 1 ? 0.55 : 0.82 + ((i * 37) % 17) / 100);
          const vis = clamp01(write * lines - i);
          if (vis <= 0) return null;
          const hl = highlight && highlight.line === i;
          return (
            <g key={i}>
              {hl && <rect x={-w / 2 + 64} y={lineY(i) - 18} width={lw * ease.inOut(clamp01(highlight!.p)) + 12} height={30} rx={5} fill={highlight!.color ?? C.cautionLight} opacity={0.6} />}
              <rect x={-w / 2 + 70} y={lineY(i) - 8} width={lw * vis} height={10} rx={5} fill={ink} opacity={hl ? 0.85 : 0.32} />
            </g>
          );
        })
      )}
      {signature && (
        <path d={`M${40} ${h / 2 - 120} c20 -30 30 10 50 -10 s20 -20 30 0 s30 10 60 -14`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ramp(write, 0.85, 1)} />
      )}
      {seal && (
        <g transform={`translate(${-w / 2 + 120} ${h / 2 - 120})`} opacity={ramp(write, 0.9, 1)}>
          <circle r={52} fill={sealColor} />
          <circle r={38} fill="none" stroke={C.paperLight} strokeWidth={3} opacity={0.5} />
          <path d="M-14 -16 L0 14 L14 -16" stroke={C.paperLight} strokeWidth={5} fill="none" opacity={0.6} />
        </g>
      )}
    </g>
  );
};

/** Instant photo. Children render inside the square image window (window-local coords, centre 0,0). */
export const Polaroid: React.FC<{
  id: string;
  x: number;
  y: number;
  w?: number;
  p?: number;
  rot?: number;
  imageBg?: string;
  caption?: string;
  children?: React.ReactNode;
}> = ({id, x, y, w = 460, p = 1, rot = 0, imageBg = C.ink, caption, children}) => {
  if (p <= 0) return null;
  const e = entrance(p);
  const pad = w * 0.06;
  const img = w - pad * 2;
  const hTot = pad + img + w * 0.24;
  return (
    <g transform={`translate(${x} ${y + e.dy}) rotate(${rot}) scale(${e.s})`} opacity={e.o}>
      <rect x={-w / 2 + 14} y={-pad - img / 2 + 18} width={w} height={hTot} rx={6} fill={C.ink} opacity={0.16} />
      <rect x={-w / 2} y={-pad - img / 2} width={w} height={hTot} rx={6} fill={C.paperLight} />
      <clipPath id={`${id}-win`}>
        <rect x={-img / 2} y={-img / 2} width={img} height={img} />
      </clipPath>
      <rect x={-img / 2} y={-img / 2} width={img} height={img} fill={imageBg} />
      <g clipPath={`url(#${id}-win)`}>{children}</g>
      {caption && (
        <text x={0} y={img / 2 + w * 0.14} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={Math.max(TYPE.small, w * 0.07)} fill={C.ink}>
          {caption}
        </text>
      )}
    </g>
  );
};

/**
 * Research study card — who/when/what + a certainty tag. Size 760×460.
 * <StudyCard x y title="Inner speech sampling" who="Hurlburt & Heavey" year="2011" finding="Inner speech in 26% of sampled moments" n="~30 people" tag={{text:'One method', kind:'caution'}} p={p}/>
 */
export const StudyCard: React.FC<{
  x: number;
  y: number;
  p?: number;
  rot?: number;
  title: string;
  who?: string;
  year?: string;
  finding?: string;
  n?: string;
  tag?: {text: string; kind: Sem};
  accent?: string;
}> = ({x, y, p = 1, rot = 0, title, who, year, finding, n, tag, accent = C.oxblood}) => {
  const w = 760;
  const h = 460;
  return (
    <Card x={x} y={y} w={w} h={h} p={p} rot={rot}>
      <rect x={0} y={0} width={14} height={h} fill={accent} />
      <text x={48} y={72} fontFamily={FONT_SANS} fontWeight={700} fontSize={30} letterSpacing={3.5} fill={C.inkMute}>
        {[who, year].filter(Boolean).join(' · ').toUpperCase()}
      </text>
      <Para x={46} y={94} w={w - 90} h={130} text={title} size={TYPE.read} weight={700} p={ramp(p, 0.2, 0.8)} />
      {finding && <Para x={48} y={226} w={w - 90} h={120} text={finding} size={TYPE.small} weight={500} color={C.inkSoft} p={ramp(p, 0.4, 1)} />}
      {n && (
        <text x={48} y={h - 40} fontFamily={FONT_SANS} fontWeight={600} fontSize={30} fill={C.inkMute}>
          {n}
        </text>
      )}
      {tag && <Tag x={w - 40} y={h - 56} text={tag.text} kind={tag.kind} p={ramp(p, 0.6, 1)} anchor="right" />}
    </Card>
  );
};

/** Sticky note / index card with a short handwritten-style line. Size ≈ 340×300. */
export const Note: React.FC<{x: number; y: number; text: string; p?: number; rot?: number; color?: string; w?: number; h?: number; size?: number}> = ({
  x,
  y,
  text,
  p = 1,
  rot = -3,
  color = C.cautionTint,
  w = 340,
  h = 300,
  size = 42,
}) => (
  <Card x={x} y={y} w={w} h={h} p={p} rot={rot} fill={color} radius={4}>
    <rect x={w / 2 - 50} y={-14} width={100} height={30} fill={C.paperShade} opacity={0.8} transform={`rotate(${-rot} ${w / 2} 0)`} />
    <Para x={28} y={40} w={w - 56} h={h - 60} text={text} size={size} italic weight={600} />
  </Card>
);

/** Open book (two pages) with optional abstract lines and a ribbon. Size ≈ 640×420. */
export const OpenBook: React.FC<{x: number; y: number; s?: number; p?: number; rot?: number; cover?: string; lines?: number; leftTitle?: string; rightTitle?: string}> = ({
  x,
  y,
  s = 1,
  p = 1,
  rot = 0,
  cover = C.oxDeep,
  lines = 8,
  leftTitle,
  rightTitle,
}) => {
  if (p <= 0) return null;
  const e = entrance(p);
  const page = (side: -1 | 1, title?: string) => (
    <g>
      <path d={`M0 -190 Q${side * 150} -214 ${side * 300} -196 L${side * 300} 190 Q${side * 150} 172 0 196 Z`} fill={C.paperLight} />
      <path d={`M0 -190 Q${side * 40} -196 ${side * 60} -194 L${side * 60} 192 Q${side * 30} 194 0 196 Z`} fill={C.paperShade} opacity={0.7} />
      {title && (
        <text x={side * 160} y={-130} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={44} fill={C.ink}>
          {title}
        </text>
      )}
      {Array.from({length: lines}, (_, i) => (
        <rect key={i} x={side > 0 ? 70 : -270} y={-90 + i * 34} width={200 - ((i * 23) % 50)} height={8} rx={4} fill={C.ink} opacity={0.28} />
      ))}
    </g>
  );
  return (
    <g transform={`translate(${x} ${y + e.dy}) rotate(${rot}) scale(${s * e.s})`} opacity={e.o}>
      <path d="M-322 -200 L322 -200 L322 214 L0 226 L-322 214 Z" fill={cover} />
      {page(-1, leftTitle)}
      {page(1, rightTitle)}
      <path d="M150 -206 L150 -120 L166 -136 L182 -120 L182 -206 Z" fill={C.oxblood} />
    </g>
  );
};

/**
 * Screen / monitor (e.g. brain–computer interface output, a study dashboard). Children draw inside
 * the screen (screen-local coords, top-left 0,0, size w×h). frame: 'monitor' | 'tablet' | 'phone'.
 */
export const Screen: React.FC<{
  id: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  p?: number;
  frame?: 'monitor' | 'tablet' | 'phone';
  bg?: string;
  children?: React.ReactNode;
}> = ({id, x, y, w = 760, h = 440, p = 1, frame = 'monitor', bg = C.night, children}) => {
  if (p <= 0) return null;
  const e = entrance(p);
  const b = frame === 'phone' ? 18 : 22;
  return (
    <g transform={`translate(${x} ${y + e.dy}) scale(${e.s})`} opacity={e.o}>
      {frame === 'monitor' && (
        <g fill={C.inkSoft}>
          <rect x={-40} y={h / 2 + b} width={80} height={90} />
          <rect x={-150} y={h / 2 + b + 80} width={300} height={22} rx={11} />
        </g>
      )}
      <rect x={-w / 2 - b + 12} y={-h / 2 - b + 16} width={w + b * 2} height={h + b * 2} rx={frame === 'monitor' ? 18 : 36} fill={C.ink} opacity={0.15} />
      <rect x={-w / 2 - b} y={-h / 2 - b} width={w + b * 2} height={h + b * 2} rx={frame === 'monitor' ? 18 : 36} fill={C.ink} />
      <clipPath id={`${id}-scr`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={frame === 'monitor' ? 4 : 14} />
      </clipPath>
      <g clipPath={`url(#${id}-scr)`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={bg} />
        <g transform={`translate(${-w / 2} ${-h / 2})`}>{children}</g>
      </g>
    </g>
  );
};

/** Terminal-style decoded text line for screens (typewriter with cursor). Draw inside <Screen>. */
export const ScreenText: React.FC<{x: number; y: number; text: string; p: number; t: number; size?: number; color?: string; cursor?: boolean}> = ({x, y, text, p, t, size = TYPE.read, color = C.paperLight, cursor = true}) => {
  const n = Math.floor(clamp01(p) * text.length);
  const shown = text.slice(0, n);
  const cw = textW(shown, size, 'sans', 500);
  return (
    <g>
      <text x={x} y={y} fontFamily={FONT_SANS} fontWeight={500} fontSize={size} fill={color}>
        {shown}
      </text>
      {cursor && Math.floor(t * 2) % 2 === 0 && <rect x={x + cw + 4} y={y - size * 0.8} width={size * 0.08 + 2} height={size * 0.9} fill={C.cautionLight} />}
    </g>
  );
};

/** Speech bubble (tail points to `to`). Size from w/h; text centred. kind 'speech' | 'thought' | 'inner' (dashed: silent voice). */
export const Bubble: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  to?: {x: number; y: number};
  p?: number;
  kind?: 'speech' | 'thought' | 'inner';
  fill?: string;
  color?: string;
  size?: number;
  type?: number; // 0→1 typewriter for the text
}> = ({x, y, w, h, text, to, p = 1, kind = 'speech', fill = C.paperLight, color = C.ink, size = 44, type = 1}) => {
  if (p <= 0) return null;
  cueSfx('popup', `bubble@${Math.round(x)},${Math.round(y)}`, true, x);
  const k = ease.outBack(clamp01(p));
  const stroke = kind === 'inner' ? C.theory : C.ink;
  const dash = kind === 'inner' ? '14 10' : undefined;
  const tail = to
    ? (() => {
        const ang = Math.atan2(to.y - y, to.x - x);
        const bx = x + Math.cos(ang) * w * 0.32;
        const by = y + Math.sin(ang) * h * 0.32;
        const nx = -Math.sin(ang) * 18;
        const ny = Math.cos(ang) * 18;
        return `M${bx + nx} ${by + ny} L${to.x} ${to.y} L${bx - nx} ${by - ny} Z`;
      })()
    : null;
  const shown = text ? text.slice(0, Math.ceil(clamp01(type) * text.length)) : '';
  return (
    <g transform={`translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`} opacity={clamp01(p * 3)}>
      {kind === 'thought' && to ? (
        [0.35, 0.6, 0.82].map((f, i) => <circle key={i} cx={x + (to.x - x) * f} cy={y + (to.y - y) * f} r={14 - i * 4} fill={fill} stroke={stroke} strokeWidth={4} />)
      ) : tail ? (
        <path d={tail} fill={fill} stroke={stroke} strokeWidth={4} strokeLinejoin="round" strokeDasharray={dash} />
      ) : null}
      {kind === 'thought' ? (
        <g>
          {Array.from({length: 10}, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return <circle key={i} cx={x + Math.cos(a) * w * 0.42} cy={y + Math.sin(a) * h * 0.38} r={Math.min(w, h) * 0.2} fill={fill} stroke={stroke} strokeWidth={4} />;
          })}
          <ellipse cx={x} cy={y} rx={w * 0.46} ry={h * 0.42} fill={fill} />
        </g>
      ) : (
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={Math.min(h / 2, 40)} fill={fill} stroke={stroke} strokeWidth={4} strokeDasharray={dash} />
      )}
      {tail && kind !== 'thought' && <path d={tail} fill={fill} stroke="none" transform={`translate(${(x - (to?.x ?? x)) * 0.02} ${(y - (to?.y ?? y)) * 0.02})`} />}
      {text && (
        <foreignObject className={TEXT_FO} x={x - w / 2 + 24} y={y - h / 2} width={w - 48} height={h}>
          <div style={{height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: FONT_SERIF, fontStyle: kind === 'inner' ? 'italic' : 'normal', fontWeight: 600, fontSize: size, lineHeight: 1.15, color: kind === 'inner' ? C.theory : color}}>
            {shown}
          </div>
        </foreignObject>
      )}
    </g>
  );
};

