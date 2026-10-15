import React from 'react';
import {C, FONT_SANS} from '../../../kit/theme';
import {clamp01, ease, lerp, noise1, rand} from '../../../kit/anim';
import {idOf, mix, smooth, syllables, P2} from './util';

export type SilentWaveGhost = {
  /** x offset of the ghost wave in px (default 0). */
  offset?: number;
  /** 0 = solid outline (sound), 1 = dashed (silent / forecast). default 1 */
  silent?: number;
  /** outline colour (default caution mustard). */
  color?: string;
  /** 1 = same shape as the main wave, 0 = visibly different shape. default 1 */
  match?: number;
  /** ghost draw-on 0→1 (default = main p). */
  p?: number;
};

export type SilentWaveProps = {
  x: number;
  y: number;
  /** width in px (default 900) */
  w?: number;
  /** half-height of the loudest burst (default 90) */
  amp?: number;
  t?: number;
  /** draw-on left → right */
  p?: number;
  seed?: number;
  /** 0 = SOUND (solid bars/line), 1 = SILENT (dashed plum contour + faint plum shape); sweeps left → right */
  silent?: number;
  /** 0 → 1 collapse to a flat line (nothing vibrated) */
  flat?: number;
  /** optional labels under each burst — one burst per word (syllable count shapes the burst) */
  words?: string[];
  /** number of bursts when no words are given (default 5) */
  bursts?: number;
  /** 'bars' (default, audio-meter bars) | 'line' (oscillating line) */
  style?: 'bars' | 'line';
  /** sound colour (default ink on paper, paperLight on ink) */
  color?: string;
  /** silent colour (default theory on paper, theoryLight on ink) */
  silentColor?: string;
  tone?: 'paper' | 'ink';
  /** idle life 0..1 (default 1; only once fully drawn) */
  live?: number;
  /** label size (default 34) */
  labelSize?: number;
  ghost?: SilentWaveGhost;
  /** unique id seed for clip paths when two waves share x/y/seed */
  id?: string;
};

type Burst = {c: number; hw: number; a: number}[];

/** Syllable-burst envelope layout in u ∈ [0,1]. variant ≠ 0 perturbs it (ghost mismatch). */
const layout = (groups: number[], seed: number, variant: number): Burst => {
  const units = groups.map((m) => m + 0.7);
  const gap = 0.55;
  const total = units.reduce((a, b) => a + b, 0) + gap * (groups.length - 1);
  const span = 0.92;
  let u = 0.04;
  const out: Burst = [];
  groups.forEach((m, gi) => {
    const gw = (units[gi] / total) * span;
    for (let k = 0; k < m; k++) {
      const sd = seed * 13.7 + gi * 5.1 + k * 1.3;
      const c = u + (gw * (k + 0.5 + 0.35 / m)) / (m + 0.35);
      const a = 0.62 + 0.38 * rand(sd);
      const dv = variant * (rand(sd + 77) - 0.5);
      out.push({c: c + dv * 0.07, hw: ((gw / m) * 0.62) * (1 + variant * (rand(sd + 3) - 0.3) * 0.9), a: clamp01(a * (1 + dv * 1.6))});
    }
    u += gw + (gap / total) * span;
  });
  return out;
};

const env = (u: number, b: Burst) => {
  let v = 0;
  for (const s of b) {
    const d = (u - s.c) / s.hw;
    if (Math.abs(d) < 1) v = Math.max(v, s.a * Math.cos((d * Math.PI) / 2) ** 2);
  }
  return v;
};

/**
 * SilentWave — Binly's "voice with the sound taken out" motif. origin = LEFT end of the baseline; w wide, ±amp.
 * silent 0→1 sweeps left→right from solid sound bars to a dashed plum contour (same shape, lower, faint plum fill).
 * words label the bursts; flat collapses it; ghost overlays a second wave (forecast vs real).
 */
export const SilentWave: React.FC<SilentWaveProps> = ({
  x,
  y,
  w = 900,
  amp = 90,
  t = 0,
  p = 1,
  seed = 1,
  silent = 0,
  flat = 0,
  words,
  bursts = 5,
  style = 'bars',
  color,
  silentColor,
  tone = 'paper',
  live = 1,
  labelSize = 34,
  ghost,
  id,
}) => {
  if (p <= 0) return null;
  const ink = tone === 'ink';
  const col = color ?? (ink ? C.paperLight : C.ink);
  const scol = silentColor ?? (ink ? C.theoryLight : C.theory);
  const groups = words?.length ? words.map(syllables) : Array.from({length: bursts}, (_, i) => 1 + Math.floor(rand(seed * 3.3 + i) * 3));
  const B = layout(groups, seed, 0);
  const pp = clamp01(p);
  const lv = clamp01(live) * clamp01((pp - 0.95) / 0.05);
  const fl = clamp01(flat);
  const sl = clamp01(silent);
  const SOFT = 0.25;
  const kAt = (u: number) => clamp01((sl * (1 + SOFT) - u) / SOFT);
  const front = clamp01(sl * (1 + SOFT) - SOFT * 0.5);
  const grow = (u: number) => ease.out(clamp01((pp * 1.12 - u) / 0.12));
  const cid = `sw-${id ?? ''}-${idOf(x, y, w, seed)}`;

  // per-bar heights (half height, px)
  const step = 15;
  const n = Math.max(12, Math.round(w / step));
  const bars = Array.from({length: n}, (_, i) => {
    const u = (i + 0.5) / n;
    const tex = 0.6 + 0.4 * Math.abs(noise1(i * 0.9 + t * 2.4 * lv, seed + 4));
    const pulse = 1 + 0.12 * lv * noise1(t * 1.5 + i * 0.3, seed + 9);
    const k = kAt(u);
    const e = env(u, B);
    const h = Math.max(3, amp * e * tex * pulse * lerp(1, 0.8, k) * (1 - fl) * grow(u));
    return {u, bx: u * w, h, k, e};
  });

  // contour through bar tips (silent outline / glow), clipped to the drained part
  const top: P2[] = [[0, 0], ...bars.map((b) => [b.bx, -b.h] as P2), [w, 0]];
  const bot: P2[] = top.map(([a, b]) => [a, -b] as P2);
  const topD = smooth(top);
  const botD = smooth(bot);
  const fillD = smooth([...top, ...bot.slice().reverse()], true);
  const visW = Math.min(front, pp * 1.05) * w;

  // line style: oscillating line built from the same envelope
  const lineD = () => {
    const N = Math.round(w / 3);
    const pts: string[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const e = env(u, B) * (0.75 + 0.25 * Math.abs(noise1(u * 30 + t * 2 * lv, seed)));
      const v = e * Math.sin(u * w * 0.2 + t * 6 * lv) * amp * lerp(1, 0.8, kAt(u)) * (1 - fl) * (1 + 0.1 * lv * noise1(t * 1.5 + u * 9, seed + 9));
      pts.push(`${(u * w).toFixed(1)} ${(-v).toFixed(1)}`);
    }
    return 'M' + pts.join(' L');
  };

  // ghost (forecast) contour
  const ghostEl = () => {
    if (!ghost) return null;
    const gp = clamp01(ghost.p ?? pp);
    if (gp <= 0) return null;
    const mt = clamp01(ghost.match ?? 1);
    const GB = layout(groups, seed, 1).map((s, i) => ({c: lerp(s.c, B[i].c, mt), hw: lerp(s.hw, B[i].hw, mt), a: lerp(s.a, B[i].a, mt)}));
    const gs = clamp01(ghost.silent ?? 1);
    const gcol = ghost.color ?? (ink ? C.cautionLight : C.caution);
    const gt: P2[] = [[0, 0]];
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const tex = 0.6 + 0.4 * Math.abs(noise1(i * 0.9 + t * 2.4 * lv, seed + 4));
      gt.push([u * w, -Math.max(3, amp * env(u, GB) * lerp(tex, 1, 0.5) * lerp(1, 0.8, gs) * (1 - fl))]);
    }
    gt.push([w, 0]);
    const gb = gt.map(([a, b]) => [a, -b] as P2);
    return (
      <g transform={`translate(${ghost.offset ?? 0} 0)`} clipPath={`url(#${cid}-g)`}>
        <defs>
          <clipPath id={`${cid}-g`}>
            <rect x={-20} y={-amp * 2 - 40} width={gp * w + 20} height={amp * 4 + 80} />
          </clipPath>
        </defs>
        {[smooth(gt), smooth(gb)].map((d, i) => (
          <path key={i} d={d} fill="none" stroke={gcol} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={gs > 0.5 ? '14 10' : undefined} />
        ))}
      </g>
    );
  };

  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={`${cid}-s`}>
          <rect x={-20} y={-amp * 2 - 40} width={Math.max(0, visW) + 20} height={amp * 4 + 80} />
        </clipPath>
        <clipPath id={`${cid}-a`}>
          <rect x={Math.max(0, visW)} y={-amp * 2 - 40} width={w + 40} height={amp * 4 + 80} />
        </clipPath>
      </defs>
      {/* baseline */}
      <line x1={0} y1={0} x2={w * pp} y2={0} stroke={mix(col, scol, sl)} strokeWidth={3} strokeLinecap="round" opacity={0.35 + 0.4 * fl} strokeDasharray={sl > 0.5 ? '10 10' : undefined} />
      {/* silent: faint plum shape ("the shape remains") */}
      {sl > 0 && fl < 1 && (
        <g clipPath={`url(#${cid}-s)`}>
          <path d={fillD} fill={scol} opacity={0.1 * (1 - fl)} transform="scale(1 1.22)" />
          <path d={fillD} fill={scol} opacity={0.16 * (1 - fl)} />
        </g>
      )}
      {style === 'bars'
        ? bars.map((b, i) =>
            b.u > pp * 1.12 ? null : (
              <g key={i}>
                {b.k < 1 && <line x1={b.bx} y1={-b.h} x2={b.bx} y2={b.h} stroke={col} strokeWidth={8} strokeLinecap="round" opacity={1 - b.k} />}
                {b.k > 0 && <line x1={b.bx} y1={-b.h * 0.7} x2={b.bx} y2={b.h * 0.7} stroke={scol} strokeWidth={4} strokeLinecap="round" opacity={0.35 * b.k} />}
              </g>
            ),
          )
        : (
          <g>
            <defs>
              <clipPath id={`${cid}-p`}>
                <rect x={-20} y={-amp * 2 - 40} width={pp * w + 20} height={amp * 4 + 80} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${cid}-p)`}>
              <g clipPath={`url(#${cid}-a)`}>
                <path d={lineD()} fill="none" stroke={col} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
              </g>
              <g clipPath={`url(#${cid}-s)`}>
                <path d={lineD()} fill="none" stroke={scol} strokeWidth={5} strokeLinecap="round" strokeDasharray="12 9" opacity={0.85} />
              </g>
            </g>
          </g>
        )}
      {/* silent: dashed plum contour */}
      {sl > 0 && fl < 1 && (
        <g clipPath={`url(#${cid}-s)`} opacity={1 - fl}>
          {[topD, botD].map((d, i) => (
            <path key={i} d={d} fill="none" stroke={scol} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="14 10" />
          ))}
        </g>
      )}
      {ghostEl()}
      {/* word labels under the bursts */}
      {words?.length
        ? (() => {
            let bi = 0;
            return words.map((wd, gi) => {
              const m = groups[gi];
              const part = B.slice(bi, bi + m);
              bi += m;
              const cu = part.reduce((a, s) => a + s.c, 0) / m;
              const o = ease.out(clamp01((pp * 1.12 - cu) / 0.12));
              const k = kAt(cu);
              return (
                <text
                  key={gi}
                  x={cu * w}
                  y={amp + labelSize + 26 + (1 - o) * 16}
                  textAnchor="middle"
                  fontFamily={FONT_SANS}
                  fontWeight={600}
                  fontSize={labelSize}
                  letterSpacing={labelSize * 0.08}
                  fill={mix(col, scol, k)}
                  opacity={o}
                >
                  {wd.toUpperCase()}
                </text>
              );
            });
          })()
        : null}
    </g>
  );
};
