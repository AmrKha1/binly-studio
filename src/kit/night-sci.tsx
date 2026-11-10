// NIGHT SCIENCE EXTRAS — the antimatter chapter's devices (references/universe-claude 9:55–12:46, GAP-CHECK P2):
// Particle (glowing ball with a symbol + label, 10:08 «إلكترون e⁻ / بوزترون e⁺») · ParticleSwarm (a jittering cloud of
// glowing dots, 10:01) · WeighScale (digital scale «1.000 g», 9:59) · Magnifier (lens that shows a zoomed world inside,
// «×1,000,000» 12:16) · RingGauge (accelerator ring with a % in the middle, 11:39 «99.99% من سرعة الضوء») · MassGrid (one
// small thing repeated hundreds of times = "one for every person who ever lived", 11:12). Use inside <NightScreen>.
import React from 'react';
import {clamp01, ease, lerp, popIn, rand} from './anim';
import {uid} from './stage';
import {GlowText, NPill, Tone} from './night';
import {cueSfx} from './sfx';

const OUT = '#14101C';

/** Particle — glowing ball with a symbol in it and an optional label pill under it (10:08). */
export const Particle: React.FC<{t: number; at?: number; x: number; y: number; r?: number; color?: string; symbol?: string; label?: string; id: string}> = ({t, at = -1, x, y, r = 46, color = '#3B82F6', symbol, label, id}) => {
  if (t < at) return null;
  const q = at >= 0 ? popIn(clamp01((t - at) / 0.25), 0.45, 0.4) : {sx: 1, sy: 1, o: 1};
  const g = uid('npart', id);
  const jx = Math.sin(t * 3.1 + x) * 3, jy = Math.cos(t * 2.7 + y) * 3;
  return (
    <g>
      <g transform={`translate(${x + jx} ${y + jy}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
        <defs>
          <radialGradient id={g} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="0.35" stopColor={color} />
            <stop offset="1" stopColor={color} stopOpacity="0.85" />
          </radialGradient>
          <filter id={g + '__b'} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={r * 0.5} />
          </filter>
        </defs>
        <circle r={r * 1.5} fill={color} opacity={0.5} filter={`url(#${g}__b)`} />
        <circle r={r} fill={`url(#${g})`} />
        {symbol && (
          <text x={0} y={r * 0.05} fontSize={r * 0.9} fontFamily="Poppins, sans-serif" fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#FFFFFF">
            {symbol}
          </text>
        )}
      </g>
      {label && <NPill text={label} x={x} y={y + r + 46} size={38} kind="white" id={id + '__l'} p={at >= 0 ? (t - at - 0.15) / 0.25 : 1} />}
    </g>
  );
};

/** ParticleSwarm — a cloud of small glowing dots jittering around (x, y) (10:01 matter vs antimatter). */
export const ParticleSwarm: React.FC<{t: number; x: number; y: number; r?: number; n?: number; color?: string; seed?: number; at?: number}> = ({t, x, y, r = 160, n = 14, color = '#FF4FC8', seed = 1, at = -1}) => {
  if (t < at) return null;
  const p = at >= 0 ? clamp01((t - at) / 0.4) : 1;
  return (
    <g opacity={p}>
      {Array.from({length: n}, (_, i) => {
        const k = seed * 17 + i;
        const a = rand(k) * Math.PI * 2 + t * (0.3 + rand(k + 1) * 0.5) * (i % 2 ? 1 : -1);
        const d = Math.sqrt(rand(k + 2)) * r * lerp(0.3, 1, ease.out(p));
        const rr = 6 + rand(k + 3) * 8;
        return (
          <g key={i}>
            <circle cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d} r={rr * 2.2} fill={color} opacity={0.2} />
            <circle cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d} r={rr} fill={color} />
          </g>
        );
      })}
    </g>
  );
};

/**
 * WeighScale — a dark digital scale with a white plate and a glowing green readout (9:59 «1.000 g»). value = exact
 * reading (counts up from 0 over 0.6 s if `count`); children sit ON the plate (draw them at x, plateY).
 */
export const WeighScale: React.FC<{t: number; at?: number; x: number; y: number; w?: number; value: string; count?: boolean; children?: React.ReactNode}> = ({t, at = -1, x, y, w = 640, value, count = true, children}) => {
  if (t < at) return null;
  const q = at >= 0 ? popIn(clamp01((t - at) / 0.3), 0.45, 0.3) : {sx: 1, sy: 1, o: 1};
  const k = count && at >= 0 ? clamp01((t - at - 0.3) / 0.6) : 1;
  const num = value.replace(/[\d.]+/, (m) => (parseFloat(m) * k).toFixed((m.split('.')[1] ?? '').length));
  const h = w * 0.36;
  return (
    <g transform={`translate(${x} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
      <path d={`M${-w / 2} ${h / 2} L${-w * 0.42} ${-h / 2} H${w * 0.42} L${w / 2} ${h / 2} Z`} fill="#24222E" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-w * 0.46} y={-h / 2 - 28} width={w * 0.92} height={24} rx={12} fill="#E8EAF0" stroke={OUT} strokeWidth={5} />
      <rect x={-w * 0.26} y={-h * 0.18} width={w * 0.52} height={h * 0.5} rx={10} fill="#0B2A1A" stroke="#1F5A38" strokeWidth={4} />
      <text x={0} y={h * 0.07} fontSize={h * 0.32} fontFamily="Poppins, sans-serif" fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#4BEA92" style={{filter: 'drop-shadow(0 0 8px #22C55E)'}}>
        {num}
      </text>
      <g transform={`translate(0 ${-h / 2 - 30})`}>{children}</g>
    </g>
  );
};

/**
 * Magnifier — a big lens that shows a zoomed view inside (12:16 «كميات مجهرية» + «×1,000,000»): `children` are drawn
 * inside the lens, clipped, centred at 0,0. A fine grid fills the lens if no children. zoom = label beside it.
 */
export const Magnifier: React.FC<{t: number; at?: number; x: number; y: number; r?: number; angle?: number; zoom?: string; zoomTone?: Tone; id: string; children?: React.ReactNode}> = ({
  t, at = -1, x, y, r = 210, angle = 45, zoom, zoomTone = 'cyan', id, children,
}) => {
  if (t < at) return null;
  const q = at >= 0 ? popIn(clamp01((t - at) / 0.3), 0.45, 0.3) : {sx: 1, sy: 1, o: 1};
  const g = uid('nmag', id);
  const a = (angle * Math.PI) / 180;
  const hx = Math.cos(a) * r, hy = Math.sin(a) * r;
  return (
    <g>
      <g transform={`translate(${x + Math.sin(t * 0.9) * 6} ${y + Math.cos(t * 0.7) * 5}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
        <defs>
          <clipPath id={g}>
            <circle r={r} />
          </clipPath>
        </defs>
        <line x1={hx * 1.05} y1={hy * 1.05} x2={hx * 1.75} y2={hy * 1.75} stroke={OUT} strokeWidth={56} strokeLinecap="round" />
        <line x1={hx * 1.08} y1={hy * 1.08} x2={hx * 1.72} y2={hy * 1.72} stroke="#8A5A34" strokeWidth={38} strokeLinecap="round" />
        <circle r={r} fill="#0C0A1C" />
        <g clipPath={`url(#${g})`}>
          {children ?? (
            <g stroke="#3A3466" strokeWidth={2}>
              {Array.from({length: 21}, (_, i) => (
                <g key={i}>
                  <line x1={-r + i * (r / 10)} y1={-r} x2={-r + i * (r / 10)} y2={r} />
                  <line x1={-r} y1={-r + i * (r / 10)} x2={r} y2={-r + i * (r / 10)} />
                </g>
              ))}
            </g>
          )}
          <path d={`M${-r * 0.7} ${-r * 0.35} Q${-r * 0.55} ${-r * 0.75} ${-r * 0.15} ${-r * 0.82}`} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={0.35} />
        </g>
        <circle r={r} fill="none" stroke={OUT} strokeWidth={30} />
        <circle r={r} fill="none" stroke="#C9CED6" strokeWidth={16} />
      </g>
      {zoom && <GlowText text={zoom} x={x + r * 1.55} y={y - r * 0.55} size={84} tone={zoomTone} id={id + '__z'} />}
    </g>
  );
};

/**
 * RingGauge — a glowing particle-accelerator ring (11:39): blue neon ring with orange segments racing round, a pill on
 * top (label), the big % in the middle, a small pill under it (sub). value counts from `from` (default 0) when at is set.
 */
export const RingGauge: React.FC<{t: number; at?: number; x: number; y: number; r?: number; value: string; from?: number; label?: string; sub?: string; id: string}> = ({
  t, at = -1, x, y, r = 320, value, from = 0, label, sub, id,
}) => {
  if (t < at) return null;
  const q = at >= 0 ? popIn(clamp01((t - at) / 0.35), 0.45, 0.3) : {sx: 1, sy: 1, o: 1};
  const k = at >= 0 ? ease.out(clamp01((t - at - 0.2) / 1.2)) : 1;
  const m = value.match(/[\d.]+/);
  const dec = m ? (m[0].split('.')[1] ?? '').length : 0;
  const shown = m ? value.replace(m[0], lerp(from, parseFloat(m[0]), k).toFixed(dec)) : value;
  const g = uid('nring', id);
  return (
    <g transform={`translate(${x} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
      <defs>
        <filter id={g} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={16} />
        </filter>
      </defs>
      <circle r={r} fill="none" stroke="#2F8BFF" strokeWidth={34} opacity={0.5} filter={`url(#${g})`} />
      <circle r={r} fill="none" stroke="#123A8A" strokeWidth={30} />
      <circle r={r} fill="none" stroke="#57D9FA" strokeWidth={4} />
      <circle r={r - 26} fill="none" stroke="#57D9FA" strokeWidth={2} opacity={0.5} />
      <g transform={`rotate(${t * 140})`}>
        {Array.from({length: 18}, (_, i) => (
          <rect key={i} x={-7} y={-r - 12} width={14} height={24} rx={3} fill="#FF8A1C" transform={`rotate(${i * 20})`} opacity={0.9} />
        ))}
      </g>
      {Array.from({length: 10}, (_, i) => {
        const a = rand(i * 3) * Math.PI * 2 + t * 2.4;
        const d = r + 30 + rand(i * 5) * 120;
        return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={3 + rand(i) * 3} fill={i % 2 ? '#FF4FC8' : '#57D9FA'} opacity={0.8} />;
      })}
      {label && <NPill text={label} x={0} y={-r * 0.34} size={36} kind="white" id={id + '__l'} />}
      <GlowText text={shown} x={0} y={r * 0.02} size={r * 0.3} tone="cyan" id={id + '__v'} />
      {sub && <NPill text={sub} x={0} y={r * 0.34} size={34} kind="cyan" id={id + '__s'} />}
    </g>
  );
};

/**
 * MassGrid — one small thing repeated in a big grid that fills in with a sweep (11:12 «موزة لكل إنسان عاش في التاريخ»).
 * node(i) returns the small SVG drawn at 0,0 (keep it simple: a path, an emoji-like glyph). cols × rows cells over w × h.
 */
export const MassGrid: React.FC<{t: number; at: number; x: number; y: number; w: number; h: number; cols?: number; rows?: number; dur?: number; node: (i: number) => React.ReactNode}> = ({
  t, at, x, y, w, h, cols = 26, rows = 14, dur = 1.6, node,
}) => {
  if (t < at) return null;
  cueSfx('boom', `mass-${x}-${y}-${at}`, t >= at && t < at + 0.3, x + w / 2, {at, hit: 0.1}); // SOUND MAP: «70 مليون إنسان» = boom
  const sweep = clamp01((t - at) / dur);
  const cw = w / cols, ch = h / rows;
  const out: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const d = Math.hypot(c / cols - 0.5, r / rows - 0.5) / 0.71; // from the centre outwards
      const p = clamp01((sweep - d * 0.85) / 0.15);
      if (p <= 0) continue;
      out.push(
        <g key={i} transform={`translate(${x - w / 2 + (c + 0.5) * cw} ${y - h / 2 + (r + 0.5) * ch + Math.sin(t * 2 + i * 0.3) * 2}) scale(${ease.out(p)})`}>
          {node(i)}
        </g>,
      );
    }
  return <g>{out}</g>;
};

/** A tiny banana glyph for MassGrid (11:12). */
export const BananaGlyph: React.FC<{s?: number}> = ({s = 1}) => (
  <path d="M-14 -6 Q0 12 16 -8" transform={`scale(${s})`} fill="none" stroke="#FFD23A" strokeWidth={7} strokeLinecap="round" />
);

