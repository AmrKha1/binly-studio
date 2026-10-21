import React from 'react';
import {cueSfx} from './sfx';
import {isAr} from './lang';
import {C, FONT_SANS, FONT_SERIF, SEM, Sem} from './theme';
import {clamp01, ease, lerp, ramp, stagger} from './anim';
import {textW} from './text';

// Explanatory diagram primitives: arrows, connectors, flows, cycles, Venn, brackets, callouts.
// Coordinates are absolute (px in the Stage). p = draw-on progress 0→1.

type Pt = {x: number; y: number};

/** Arrow from a to b, optionally curved (bend = sideways offset of the control point, px). Draws on with p. */
export const Arrow: React.FC<{
  from: Pt;
  to: Pt;
  p: number;
  bend?: number;
  color?: string;
  width?: number;
  head?: number;
  dashed?: boolean;
  double?: boolean;
  shorten?: number; // px trimmed from both ends (so arrows don't touch boxes)
}> = ({from, to, p, bend = 0, color = C.ink, width = 6, head = 22, dashed = false, double = false, shorten = 0}) => {
  if (p <= 0) return null;
  cueSfx('swish', `ar@${Math.round(from.x)},${Math.round(from.y)}`, true, from.x, {gain: 0.7});
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const a = {x: from.x + ux * shorten, y: from.y + uy * shorten};
  const b = {x: to.x - ux * shorten, y: to.y - uy * shorten};
  const cx = (a.x + b.x) / 2 - uy * bend;
  const cy = (a.y + b.y) / 2 + ux * bend;
  const k = ease.inOut(clamp01(p));
  // point + tangent on the quadratic at k
  const q = (tt: number) => ({x: (1 - tt) ** 2 * a.x + 2 * (1 - tt) * tt * cx + tt * tt * b.x, y: (1 - tt) ** 2 * a.y + 2 * (1 - tt) * tt * cy + tt * tt * b.y});
  const tip = q(k);
  const prev = q(Math.max(0, k - 0.02));
  const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x);
  const d = `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`;
  const headPath = (pt: Pt, an: number) =>
    `M${pt.x - Math.cos(an - 0.45) * head} ${pt.y - Math.sin(an - 0.45) * head} L${pt.x} ${pt.y} L${pt.x - Math.cos(an + 0.45) * head} ${pt.y - Math.sin(an + 0.45) * head}`;
  return (
    <g fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      {dashed ? (
        <>
          <mask id={`am${Math.round(a.x)}_${Math.round(a.y)}_${Math.round(b.x)}`}>
            <path d={d} pathLength={1} stroke="#fff" strokeWidth={width + 6} strokeDasharray="1 1" strokeDashoffset={1 - k} />
          </mask>
          <path d={d} strokeDasharray={`${width * 2.2} ${width * 1.8}`} mask={`url(#am${Math.round(a.x)}_${Math.round(a.y)}_${Math.round(b.x)})`} />
        </>
      ) : (
        <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
      )}
      {k > 0.05 && <path d={headPath(tip, ang)} />}
      {double && k > 0.05 && <path d={headPath(a, Math.atan2(a.y - q(0.02).y, a.x - q(0.02).x))} />}
    </g>
  );
};

/** Labelled box node (for flows / cause-effect chains). origin = centre. */
export const Node: React.FC<{
  x: number;
  y: number;
  text: string;
  p?: number;
  w?: number;
  h?: number;
  kind?: Sem;
  filled?: boolean;
  size?: number;
  icon?: React.ReactNode; // optional element drawn above the label (node-local, centre 0,0)
}> = ({x, y, text, p = 1, w, h = 110, kind = 'ink', filled = false, size = 44, icon}) => {
  if (p <= 0) return null;
  cueSfx('pop', `nd@${Math.round(x)},${Math.round(y)}`, true, x);
  const col = SEM[kind];
  const ww = w ?? Math.max(220, textW(text, size, 'serif', 600) + 70);
  const k = ease.outBack(clamp01(p));
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={clamp01(p * 3)}>
      <rect x={-ww / 2 + 8} y={-h / 2 + 10} width={ww} height={h} rx={18} fill={C.ink} opacity={0.12} />
      <rect x={-ww / 2} y={-h / 2} width={ww} height={h} rx={18} fill={filled ? col : C.paperLight} stroke={col} strokeWidth={5} />
      {icon && <g transform={`translate(0 ${-h / 2 - 50})`}>{icon}</g>}
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={600} fontSize={size} fill={filled ? C.paperLight : C.ink}>
        {text}
      </text>
    </g>
  );
};

/**
 * Flow chain: nodes in a row/column connected by arrows, revealed in sequence across p.
 * <FlowChain x={960} y={540} items={['Heat','Open pores','Bad air enters']} p={p} kinds={['ink','theory','caution']}/>
 */
export const FlowChain: React.FC<{
  x: number;
  y: number;
  items: string[];
  p: number;
  gap?: number;
  dir?: 'row' | 'column';
  kinds?: Sem[];
  size?: number;
  nodeW?: number;
}> = ({x, y, items, p, gap = 140, dir = 'row', kinds, size = 44, nodeW}) => {
  const widths = items.map((s) => nodeW ?? Math.max(220, textW(s, size, 'serif', 600) + 70));
  const total = dir === 'row' ? widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1) : items.length * 110 + gap * (items.length - 1);
  let cursor = (dir === 'row' ? x : y) - total / 2;
  const centers = items.map((_, i) => {
    const size_ = dir === 'row' ? widths[i] : 110;
    const c = cursor + size_ / 2;
    cursor += size_ + gap;
    return dir === 'row' ? {x: c, y} : {x, y: c};
  });
  const n = items.length;
  const seg = 1 / (n * 2 - 1);
  return (
    <g>
      {items.map((s, i) => {
        const np = ramp(p, i * 2 * seg, i * 2 * seg + seg * 1.2);
        const ap = ramp(p, (i * 2 + 1) * seg, (i * 2 + 2) * seg);
        const c = centers[i];
        const nxt = centers[i + 1];
        return (
          <g key={i}>
            {nxt && (
              <Arrow
                from={dir === 'row' ? {x: c.x + widths[i] / 2, y: c.y} : {x: c.x, y: c.y + 55}}
                to={dir === 'row' ? {x: nxt.x - widths[i + 1] / 2, y: nxt.y} : {x: nxt.x, y: nxt.y - 55}}
                p={ap}
                shorten={16}
                color={C.inkMute}
              />
            )}
            <Node x={c.x} y={c.y} text={s} p={np} w={widths[i]} kind={kinds?.[i] ?? 'ink'} size={size} />
          </g>
        );
      })}
    </g>
  );
};

/** Cycle diagram: items around a circle with curved arrows between them; `spin` rotates (deg). */
export const Cycle: React.FC<{x: number; y: number; r: number; items: string[]; p: number; spin?: number; kinds?: Sem[]; size?: number}> = ({x, y, r, items, p, spin = 0, kinds, size = 40}) => {
  const n = items.length;
  return (
    <g>
      {items.map((s, i) => {
        const a = ((i / n) * 360 - 90 + spin) * (Math.PI / 180);
        const a2 = (((i + 1) / n) * 360 - 90 + spin) * (Math.PI / 180);
        const pt = {x: x + Math.cos(a) * r, y: y + Math.sin(a) * r};
        const pt2 = {x: x + Math.cos(a2) * r, y: y + Math.sin(a2) * r};
        const np = stagger(p, 0, i, 0.7 / n, 0.3);
        return (
          <g key={i}>
            <Arrow from={pt} to={pt2} p={ramp(np, 0.4, 1)} bend={-r * 0.35} shorten={r * 0.38} color={C.inkMute} width={5} head={18} />
            <Node x={pt.x} y={pt.y} text={s} p={np} kind={kinds?.[i] ?? 'ink'} size={size} h={90} />
          </g>
        );
      })}
    </g>
  );
};

/** Two/three-set Venn with labels; overlap label in the middle. */
export const Venn: React.FC<{x: number; y: number; r: number; labels: string[]; overlap?: string; p: number; kinds?: Sem[]; spread?: number}> = ({x, y, r, labels, overlap, p, kinds, spread = 0.62}) => {
  const n = labels.length;
  const cs = labels.map((_, i) => {
    if (n === 2) return {x: x + (i === 0 ? -1 : 1) * r * spread, y};
    const a = ((i / n) * 360 - 90) * (Math.PI / 180);
    return {x: x + Math.cos(a) * r * spread * 0.85, y: y + Math.sin(a) * r * spread * 0.85};
  });
  return (
    <g>
      {cs.map((c, i) => {
        const k = stagger(p, 0, i, 0.15, 0.5, ease.outBack);
        const col = SEM[kinds?.[i] ?? (['confirmed', 'theory', 'caution'] as Sem[])[i % 3]];
        const lx = c.x + (c.x - x) * 0.55;
        const ly = c.y + (c.y - y) * 0.55;
        return (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r={r * k} fill={col} opacity={0.22} />
            <circle cx={c.x} cy={c.y} r={r * k} fill="none" stroke={col} strokeWidth={5} />
            <text x={n === 2 ? c.x + (c.x - x) * 0.6 : lx} y={n === 2 ? y + 10 : ly + 10} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={36} fill={C.ink} opacity={ramp(p, 0.4, 0.8)}>
              {labels[i]}
            </text>
          </g>
        );
      })}
      {overlap && (
        <text x={x} y={y + 12} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={Math.max(26, Math.min(36, (r * 0.62) / (overlap.length * 0.78)))} letterSpacing={2.5} fill={C.oxblood} opacity={ramp(p, 0.7, 1)}>
          {overlap}
        </text>
      )}
    </g>
  );
};

/** Curly bracket spanning a→b (draws on) with an optional label on its outer side. */
export const Bracket: React.FC<{a: Pt; b: Pt; p: number; depth?: number; label?: string; color?: string; size?: number}> = ({a, b, p, depth = 30, label, color = C.ink, size = 40}) => {
  if (p <= 0) return null;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const m = {x: (a.x + b.x) / 2 + nx * depth, y: (a.y + b.y) / 2 + ny * depth};
  const q1 = {x: a.x + nx * depth * 0.5, y: a.y + ny * depth * 0.5};
  const q2 = {x: b.x + nx * depth * 0.5, y: b.y + ny * depth * 0.5};
  const d = `M${a.x} ${a.y} Q${q1.x} ${q1.y} ${lerp(a.x, m.x, 0.5) + nx * depth * 0.1} ${lerp(a.y, m.y, 0.5) + ny * depth * 0.1} L${m.x} ${m.y} M${m.x} ${m.y} L${lerp(b.x, m.x, 0.5) + nx * depth * 0.1} ${lerp(b.y, m.y, 0.5) + ny * depth * 0.1} Q${q2.x} ${q2.y} ${b.x} ${b.y}`;
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease.inOut(clamp01(p))} />
      {label && (
        <text x={m.x + nx * 24} y={m.y + ny * 24 + size * 0.35} textAnchor={Math.abs(nx) > 0.5 ? (nx > 0 ? 'start' : 'end') : 'middle'} fontFamily={FONT_SERIF} fontWeight={600} fontSize={size} fill={color} opacity={ramp(p, 0.6, 1)}>
          {label}
        </text>
      )}
    </g>
  );
};

/** Callout: a leader line from a target point to a label (elbow line), semantic colour. */
export const Callout: React.FC<{target: Pt; label: Pt; text: string; p: number; kind?: Sem; size?: number; anchor?: 'start' | 'end'}> = ({target, label, text, p, kind = 'ink', size = 40, anchor}) => {
  if (p <= 0) return null;
  const col = SEM[kind];
  const k = ease.inOut(clamp01(p * 1.4));
  const an = anchor ?? (label.x >= target.x ? 'start' : 'end');
  const elbow = {x: label.x + (an === 'start' ? -20 : 20), y: label.y};
  const d = `M${target.x} ${target.y} L${elbow.x} ${elbow.y} L${label.x} ${label.y}`;
  return (
    <g>
      <circle cx={target.x} cy={target.y} r={8 * ease.outBack(clamp01(p * 3))} fill={col} stroke={C.paperLight} strokeWidth={5} />
      <path d={d} stroke={col} strokeWidth={3.5} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
      <text x={label.x + (an === 'start' ? 10 : -10)} y={label.y + size * 0.35} textAnchor={an} fontFamily={FONT_SANS} fontWeight={700} fontSize={size} letterSpacing={size * 0.05} fill={col} opacity={ramp(p, 0.5, 1)}>
        {text}
      </text>
    </g>
  );
};

/** Dashed outline around a shape region (= absent, inferred, hypothetical — Binly grammar). */
export const DashedOutline: React.FC<{d: string; p?: number; color?: string; width?: number; fill?: string}> = ({d, p = 1, color = C.theory, width = 5, fill = 'none'}) => {
  if (p <= 0) return null;
  return (
    <g opacity={clamp01(p * 2)}>
      <path d={d} fill={fill} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={`${width * 2.6} ${width * 2}`} strokeLinecap="round" />
    </g>
  );
};

/** Big X / cross-out drawn over something ("not true", "ruled out"). origin = centre. */
export const CrossOut: React.FC<{x: number; y: number; size: number; p: number; color?: string; width?: number}> = ({x, y, size, p, color = C.oxblood, width = 14}) => {
  if (p <= 0) return null;
  const a = ease.out(ramp(p, 0, 0.5));
  const b = ease.out(ramp(p, 0.5, 1));
  const h = size / 2;
  return (
    <g stroke={color} strokeWidth={width} strokeLinecap="round">
      <line x1={x - h} y1={y - h} x2={x - h + size * a} y2={y - h + size * a} />
      {b > 0 && <line x1={x + h} y1={y - h} x2={x + h - size * b} y2={y - h + size * b} />}
    </g>
  );
};

/** Check mark drawn on (confirmed). origin = centre. */
export const CheckMark: React.FC<{x: number; y: number; size: number; p: number; color?: string; width?: number}> = ({x, y, size, p, color = C.evidence, width = 14}) => {
  if (p <= 0) return null;
  cueSfx('confirm', `ck@${Math.round(x)},${Math.round(y)}`, true, x);
  const d = `M${x - size * 0.45} ${y} L${x - size * 0.12} ${y + size * 0.32} L${x + size * 0.48} ${y - size * 0.36}`;
  return (
    <g className="k-nomirror">{/* a tick never mirrors (RTL) */}
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease.inOut(clamp01(p))} />
    </g>
  );
};

/** Question mark that pops (curiosity beat). origin = centre. */
export const QuestionMark: React.FC<{x: number; y: number; size?: number; p: number; color?: string; t?: number}> = ({x, y, size = 200, p, color = C.oxblood, t = 0}) => {
  if (p <= 0) return null;
  const s = ease.outBack(clamp01(p));
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${Math.sin(t * 2) * 3}) translate(${-x} ${-y})`}>
      <text x={x} y={y + size * 0.35} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={900} fontSize={size} fill={color}>
        {isAr() ? '؟' : '?'}
      </text>
    </g>
  );
};
