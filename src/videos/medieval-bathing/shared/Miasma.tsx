import React from 'react';
import {C} from '../../../kit/theme';
import {clamp01, ease, lerp, noise1, rand, randRange} from '../../../kit/anim';
import {frac, mix, P2, smooth} from './util';

export type MiasmaProps = {
  /** top-left of the box */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  /** 0..1 how many / how thick the bands are */
  density?: number;
  /** creep-in 0..1 from the `from` side */
  p?: number;
  from?: 'left' | 'right' | 'top' | 'bottom';
  /** pattern drift speed, px/s along the creep direction */
  vx?: number;
  /** tendrils bend and flow into this point (absolute coords) with strength k 0..1 */
  toward?: {x: number; y: number; k?: number};
  color?: string;
  /** use the lighter shade set (for ink backgrounds) */
  dark?: boolean;
  opacity?: number;
  t?: number;
  seed?: number;
};

/**
 * Miasma — corrupted air: flat, low-opacity plum fog ribbons + curling tendrils + motes (no blur).
 * Origin = top-left of box x,y,w,h. Dials: density, p (creeps in from `from`), vx, toward {x,y,k}, color, dark, opacity, t, seed.
 */
export const Miasma: React.FC<MiasmaProps> = ({
  x = 0,
  y = 0,
  w = 1920,
  h = 1080,
  density = 0.6,
  p = 1,
  from = 'left',
  vx = 40,
  toward,
  color,
  dark = false,
  opacity = 1,
  t = 0,
  seed = 1,
}) => {
  if (p <= 0 || density <= 0) return null;
  const den = clamp01(density);
  const base = color ?? (dark ? C.theoryLight : C.theory);
  const cols = dark ? [base, mix(base, C.paperLight, 0.3), mix(base, C.theory, 0.4)] : [base, mix(base, C.theoryLight, 0.5), mix(base, C.ink, 0.25)];
  const horiz = from === 'left' || from === 'right';
  const Lh = horiz ? w : h; // length along creep
  const Cr = horiz ? h : w; // cross size
  const map = (u: number, v: number): P2 => {
    switch (from) {
      case 'right':
        return [x + w - u, y + v];
      case 'top':
        return [x + v, y + u];
      case 'bottom':
        return [x + v, y + h - u];
      default:
        return [x + u, y + v];
    }
  };
  const k = toward ? clamp01(toward.k ?? 1) : 0;
  const pull = (pt: P2, f: number): P2 => (toward && k > 0 ? [lerp(pt[0], toward.x, k * f), lerp(pt[1], toward.y, k * f)] : pt);
  const pp = ease.inOut(clamp01(p));
  const n = Math.round(3 + den * 7);
  const shift = t * vx;
  const SEG = 14;

  const bands = Array.from({length: n}, (_, i) => {
    const sd = seed * 41 + i * 13;
    const vc = Cr * ((i + 0.5) / n) + randRange(sd, -0.3, 0.3) * (Cr / n);
    const th = Cr / n * lerp(0.5, 1.1, den) * randRange(sd + 1, 0.7, 1.3);
    const front = Lh * pp * randRange(sd + 2, 0.82, 1.08) + noise1(t * 0.3, sd) * 30;
    const len = Math.max(0, Math.min(Lh * 1.05, front));
    if (len < 20) return null;
    const top: P2[] = [];
    const bot: P2[] = [];
    for (let j = 0; j <= SEG; j++) {
      const f = j / SEG;
      const u = f * len;
      const wv = noise1((u - shift) / 260 + i * 3.1, sd) * th * 0.9 + Math.sin((u - shift) / 180 + i + t * 0.4) * th * 0.35;
      const taper = Math.min(1, f * 6) * Math.min(1, (1 - f) * 3 + 0.06) * (toward ? lerp(1, 0.15, k * Math.pow(f, 1.4)) : 1);
      const half = (th / 2) * taper * (0.75 + 0.25 * noise1(u / 140 - t * 0.5, sd + 5));
      const g = toward ? Math.pow(f, 1.6) : 0;
      top.push(pull(map(u, vc + wv - half), g));
      bot.push(pull(map(u, vc + wv + half), g));
    }
    const d = smooth([...top, ...bot.reverse()], true);
    return <path key={i} d={d} fill={cols[i % 3]} opacity={(0.16 + 0.14 * rand(sd + 3)) * opacity * (0.6 + 0.4 * den)} />;
  });

  // curling tendrils (strokes) + motes flowing along
  const nt = Math.round(2 + den * 4);
  const tendrils = Array.from({length: nt}, (_, i) => {
    const sd = seed * 77 + i * 19;
    const vc = Cr * randRange(sd, 0.1, 0.9);
    const len = Lh * pp * randRange(sd + 1, 0.6, 0.95);
    if (len < 40) return null;
    const pts: P2[] = [];
    const S = 10;
    for (let j = 0; j <= S; j++) {
      const f = j / S;
      const u = f * len;
      const wv = Math.sin((u - shift * 0.8) / 150 + i * 2 + t * 0.6) * 40 + noise1(u / 200 + t * 0.2, sd) * 50;
      pts.push(pull(map(u, vc + wv), toward ? Math.pow(f, 1.6) : 0));
    }
    // curl at the tip (only when not flowing into a target)
    if (!toward) {
      const [ex, ey] = pts[pts.length - 1];
      const cr = 26 + 10 * Math.sin(t + i);
      const sp = t * 0.8 + i;
      for (let c = 1; c <= 5; c++) {
        const a = sp + c * 1.1;
        pts.push([ex + Math.cos(a) * cr * (1 - c * 0.14), ey + Math.sin(a) * cr * (1 - c * 0.14)]);
      }
    }
    const motes = toward
      ? [0, 1, 2].map((m) => {
          const ph = frac(t * 0.28 + rand(sd + m * 7));
          const idx = Math.min(pts.length - 1, Math.floor(ph * (S + 1)));
          const [mx, my] = pts[idx];
          return <circle key={m} cx={mx} cy={my} r={lerp(9, 4, ph)} fill={cols[0]} opacity={Math.sin(Math.PI * ph) * 0.6 * opacity} />;
        })
      : null;
    return (
      <g key={i}>
        <path d={smooth(pts)} fill="none" stroke={cols[(i + 1) % 3]} strokeWidth={lerp(8, 14, den)} strokeLinecap="round" opacity={0.32 * opacity} />
        {motes}
      </g>
    );
  });

  return (
    <g>
      {bands}
      {tendrils}
    </g>
  );
};
