import React from 'react';
import {C} from '../../../kit/theme';
import {clamp01, ease, lerp, rand, randRange} from '../../../kit/anim';
import {uid} from '../../../kit/stage';
import {LightPool, Steam} from '../../../kit/fx';
import {frac, mix, P2, smooth} from './util';

export type PoreSkinProps = {
  x?: number;
  y?: number;
  s?: number;
  /** strip width at s=1 (depth is fixed ≈ 300) */
  w?: number;
  pores?: number;
  /** 0 = closed slits → 1 = wide funnels (mouth ≈ 84 px) */
  open?: number;
  /** warm light + rising steam above the surface */
  heat?: number;
  /** warm/green drops & wisps leaving through the pores (healing) */
  flowOut?: number;
  /** plum wisps entering the pores and spreading into the second layer (corrupted air) */
  flowIn?: number;
  /** 0..1 morph to the modern view: continuous sealed barrier, no openings */
  sealed?: number;
  tone?: 'paper' | 'ink';
  /** local x (relative to origin, before s): left of it uses flowOut only, right of it flowIn only */
  split?: number;
  /** entrance 0..1 (rise + fade) */
  p?: number;
  t?: number;
  seed?: number;
};

const D = 300; // strip depth
const STEP = 20;

/**
 * PoreSkin — cut-away strip of skin with pores as little doors ("heat opens the body").
 * Origin = centre of the top surface; w ≈ 1400 × depth 300 at s=1, steam/flows rise ≈ 260 above.
 * Dials: open, heat, flowOut, flowIn, sealed, tone, split, p, t, seed.
 */
export const PoreSkin: React.FC<PoreSkinProps> = ({
  x = 0,
  y = 0,
  s = 1,
  w = 1400,
  pores = 9,
  open = 0.5,
  heat = 0,
  flowOut = 0,
  flowIn = 0,
  sealed = 0,
  tone = 'paper',
  split,
  p = 1,
  t = 0,
  seed = 1,
}) => {
  if (p <= 0) return null;
  const ink = tone === 'ink';
  const half = w / 2;
  const sl = clamp01(sealed);
  const o = clamp01(open) * (1 - sl);
  const fOut = clamp01(flowOut) * (1 - sl);
  const fIn = clamp01(flowIn) * (1 - sl);
  const h = clamp01(heat);
  const id = uid('pore', seed, Math.round(x), Math.round(y), Math.round(w));

  // layer boundaries (wavy, deterministic)
  const y1 = (xx: number) => 86 + 6 * Math.sin(xx / 90 + seed);
  const y2 = (xx: number) => 212 + 10 * Math.sin(xx / 140 + seed * 2);
  const yb = (xx: number) => D + 7 * Math.sin(xx / 55 + seed * 3) + 4 * Math.sin(xx / 23 + seed);
  const xs: number[] = [];
  for (let xx = -half; xx < half; xx += STEP) xs.push(xx);
  xs.push(half);
  const band = (top: (x: number) => number, bot: (x: number) => number, xa = -half, xb = half) => {
    const sx = xs.filter((v) => v >= xa && v <= xb);
    if (!sx.length || sx[0] > xa) sx.unshift(xa);
    if (sx[sx.length - 1] < xb) sx.push(xb);
    const a = sx.map((v) => `${v.toFixed(1)} ${top(v).toFixed(1)}`);
    const b = [...sx].reverse().map((v) => `${v.toFixed(1)} ${bot(v).toFixed(1)}`);
    return `M${a.join(' L')} L${b.join(' L')} Z`;
  };

  // colours (same skin on paper and ink so it stays readable)
  const epi = mix(mix(C.skin[1], C.paperDeep, 0.25), C.oxTint, h * 0.35);
  const derm = mix(C.skin[2], C.oxTint, 0.22 + h * 0.15);
  const hypo = mix(C.oxTint, C.oxLight, 0.3 + h * 0.15);
  const fat = mix(C.oxTint, C.paperLight, 0.35);
  const line = ink ? C.paperShade : C.ink;
  const wall = C.skinShade[3];
  const plum = ink ? C.theoryLight : C.theory;
  const steamCol = ink ? C.paperLight : mix(C.paperDark, C.oxTint, 0.45);

  // pores
  const gap = w / pores;
  const P = Array.from({length: pores}, (_, i) => {
    const px = -half + gap * (i + 0.5) + randRange(seed * 7 + i, -0.14, 0.14) * gap;
    const br = 1 + 0.05 * Math.sin(t * 1.6 + i * 1.3);
    const m = lerp(5, 42, o) * br * (1 - sl); // half mouth width
    const d = lerp(24, 112, o) * (1 - sl); // funnel depth
    const nw = lerp(1.5, 7, o) * (1 - sl); // neck half width
    const side: 'both' | 'out' | 'in' = split === undefined ? 'both' : px < split ? 'out' : 'in';
    return {i, px, m, d, nw, side};
  });
  // trumpet-shaped funnel walls: wide mouth narrowing fast into a duct
  const wallsD = (q: (typeof P)[number]) =>
    `C${q.px - q.m * 0.8} ${q.d * 0.12} ${q.px - q.m * 0.32} ${q.d * 0.36} ${q.px - q.nw} ${q.d * 0.62} L${q.px - q.nw} ${q.d} Q${q.px} ${q.d + q.nw * 1.4} ${q.px + q.nw} ${q.d} L${q.px + q.nw} ${q.d * 0.62} C${q.px + q.m * 0.32} ${q.d * 0.36} ${q.px + q.m * 0.8} ${q.d * 0.12} ${q.px + q.m} -1`;
  const funnel = (q: (typeof P)[number]) => `M${q.px - q.m - 4} -6 L${q.px - q.m} -1 ${wallsD(q)} L${q.px + q.m + 4} -6 Z`;
  // surface contour: top line dipping into each pore
  let contour = `M${-half} 0`;
  P.forEach((q) => {
    contour += ` L${q.px - q.m} 0 ${wallsD(q)} L${q.px + q.m} 0`;
  });
  contour += ` L${half} 0`;
  const outline = `M${half} 0 ${xs
    .slice()
    .reverse()
    .map((v) => `L${v.toFixed(1)} ${yb(v).toFixed(1)}`)
    .join(' ')} L${-half} 0`;

  // invasion side range
  const inA = split === undefined ? -half : Math.max(-half, split);
  const pe = ease.out(clamp01(p));

  return (
    <g transform={`translate(${x} ${y + (1 - pe) * 30}) scale(${s})`} opacity={pe}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-half - 20} y={-400} width={w + 40} height={800}>
          <rect x={-half - 20} y={-400} width={w + 40} height={800} fill="#fff" />
          {sl < 0.999 ? P.map((q) => <path key={q.i} d={funnel(q)} fill="#000" />) : null}
        </mask>
      </defs>

      {/* heat: flat warm light over the surface */}
      {h > 0 && (
        <g>
          <LightPool x={0} y={-20} r={half * 0.95} sy={0.22} color={C.lamp} strength={h * 1.6} />
          <LightPool x={-half * 0.3} y={-10} r={half * 0.55} sy={0.25} color={C.oxTint} strength={h * 1.3} />
        </g>
      )}
      
      {/* skin layers (pores cut out) */}
      <g mask={`url(#${id})`}>
        <path d={band(y2, yb)} fill={hypo} />
        {xs
          .filter((_, k) => k % 3 === 1)
          .map((v, k) => (
            <ellipse key={k} cx={v + randRange(seed + k, -14, 14)} cy={y2(v) + 44 + (k % 2) * 22} rx={randRange(seed * 3 + k, 18, 30)} ry={randRange(seed * 5 + k, 13, 19)} fill={fat} opacity={0.75} />
          ))}
        <path d={band(y1, y2)} fill={derm} />
        <path d={band((v) => y2(v) - 12, y2)} fill={mix(derm, C.ink, 0.12)} />
        <path d={band(() => 0, y1)} fill={epi} />
        <path d={band((v) => y1(v) - 10, y1)} fill={mix(epi, C.ink, 0.08)} />
        <path d={band(() => 0, () => 7)} fill={mix(epi, C.paperLight, 0.35)} />
        {/* sweat ducts + coiled glands */}
        {P.map((q) => (
          <g key={q.i} fill="none" stroke={mix(derm, C.ink, 0.35)} strokeWidth={lerp(3, 6, o)} strokeLinecap="round">
            <path d={`M${q.px} ${q.d} C${q.px + 8} ${q.d + 30} ${q.px - 8} ${150} ${q.px + 2} 172`} />
            <ellipse cx={q.px - 6} cy={180} rx={15} ry={8} />
            <ellipse cx={q.px + 6} cy={190} rx={15} ry={8} />
          </g>
        ))}
        {/* plum invasion spreading into the second layer */}
        {fIn > 0 && (
          <g>
            <path d={band(y1, y2, inA, half)} fill={C.theory} opacity={0.22 * fIn * fIn} />
            {P.filter((q) => q.side !== 'out').map((q) =>
              [0, 1, 2].map((j) => {
                const gr = clamp01(fIn * 1.3 - j * 0.15);
                const wob = Math.sin(t * 0.9 + q.i + j * 2);
                return (
                  <ellipse
                    key={`${q.i}-${j}`}
                    cx={q.px + (j - 1) * 34 * gr + wob * 6}
                    cy={lerp(q.d + 8, 150, j / 2) + wob * 4}
                    rx={(18 + 62 * gr) * (j === 1 ? 1 : 0.7)}
                    ry={(10 + 28 * gr) * (j === 1 ? 1 : 0.8)}
                    fill={C.theory}
                    opacity={0.4 * gr}
                  />
                );
              }),
            )}
          </g>
        )}
        {/* modern view: barrier of tight cells */}
        {sl > 0 && (
          <g opacity={sl}>
            {[0, 1, 2].map((row) =>
              Array.from({length: Math.ceil(w / 54) + 1}, (_, k) => {
                const cx = -half + k * 54 + (row % 2 ? 27 : 0) - 27;
                return <rect key={`${row}-${k}`} x={cx + 2} y={5 + row * 18} width={50} height={15} rx={7} fill={mix(C.skin[0], C.paperLight, 0.45 - row * 0.12)} stroke={mix(C.evidence, C.skinShade[1], 0.4)} strokeWidth={3} />;
              }),
            )}
          </g>
        )}
      </g>

      {/* dark throats: the openings read as pits going into the body */}
      {sl < 0.999 && P.map((q) => <path key={q.i} d={funnel(q)} fill={ink ? C.skinShade[3] : mix(C.skinShade[4], C.ink, 0.3)} opacity={lerp(0.5, 0.9, o)} />)}

      {/* outlines */}
      <path d={outline} fill="none" stroke={line} strokeWidth={4} strokeLinejoin="round" opacity={0.55} />
      <path d={contour} fill="none" stroke={wall} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" opacity={0.55 * (1 - sl)} />
      <path d={contour} fill="none" stroke={line} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      {sl > 0 && <path d={`M${-half} 0 L${half} 0`} stroke={C.evidence} strokeWidth={9} strokeLinecap="round" opacity={sl} />}

      {/* heat = steam */}
      {h > 0 && <Steam t={t} x={0} y={-6} w={w * 0.92} h={260} n={Math.max(4, Math.round(pores * 0.9))} color={steamCol} seed={seed + 4} strength={h * 1.25} />}

      {/* flow OUT: warm/green drops & wisps rising out of the pores */}
      {fOut > 0 &&
        P.filter((q) => q.side !== 'in').map((q) =>
          [0, 1, 2, 3].map((j) => {
            const ph = frac(t * 0.42 + rand(seed * 31 + q.i * 7 + j));
            const a = clamp01(fOut * 4 - j) * Math.sin(Math.PI * ph);
            if (a <= 0.01) return null;
            const yy = lerp(q.d * 0.75, -250, ease.out(ph));
            const xx = q.px + Math.sin(ph * 5 + j * 2 + q.i) * lerp(2, 26, ph);
            if (j % 2 === 0) {
              const r = lerp(10, 6, ph);
              return (
                <path
                  key={`${q.i}-${j}`}
                  d={`M${xx} ${yy - r * 1.9} C${xx + r * 0.6} ${yy - r * 0.9} ${xx + r} ${yy - r * 0.2} ${xx + r} ${yy + r * 0.25} A${r} ${r} 0 0 1 ${xx - r} ${yy + r * 0.25} C${xx - r} ${yy - r * 0.2} ${xx - r * 0.6} ${yy - r * 0.9} ${xx} ${yy - r * 1.9} Z`}
                  fill={j === 0 ? C.evidenceLight : C.cautionLight}
                  opacity={a}
                />
              );
            }
            const pts: P2[] = [0, 1, 2, 3].map((k) => [xx + Math.sin(k * 1.4 + t * 2 + j) * 9, yy + 12 - k * 16]);
            return <path key={`${q.i}-${j}`} d={smooth(pts)} fill="none" stroke={j === 1 ? C.cautionLight : C.evidenceLight} strokeWidth={6} strokeLinecap="round" opacity={a} />;
          }),
        )}

      {/* flow IN: plum wisps descending into the pores */}
      {fIn > 0 &&
        P.filter((q) => q.side !== 'out').map((q) =>
          [0, 1, 2].map((j) => {
            const ph = frac(t * 0.3 + rand(seed * 17 + q.i * 5 + j));
            const a = clamp01(fIn * 3 - j) * Math.sin(Math.PI * ph);
            if (a <= 0.01) return null;
            const xo = randRange(seed * 13 + q.i * 3 + j, -70, 70);
            const at = (u: number): P2 => [q.px + Math.pow(1 - u, 1.5) * xo + Math.sin(u * 6 + t + j) * 14 * (1 - u), lerp(-280, q.d, u)];
            const pts: P2[] = [0, 1, 2, 3, 4].map((k) => at(clamp01(ph - 0.32 + k * 0.08)));
            return <path key={`${q.i}-${j}`} d={smooth(pts)} fill="none" stroke={plum} strokeWidth={13 - j * 3} strokeLinecap="round" opacity={a * 0.85} />;
          }),
        )}
    </g>
  );
};
