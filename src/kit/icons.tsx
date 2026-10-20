import React from 'react';
import {C} from './theme';
import {clamp01, ease, lerp, popIn} from './anim';

// Binly pictogram family. Every glyph is drawn in a 96×96 box centred on (0,0) (content within ±44),
// built from bold flat shapes + 6px round-capped strokes. Two-tone: `color` (main) + `accent` (one detail).
// Negative space (holes, highlights, cut lines) is painted with `knock` — set it to the background colour
// when the icon sits on anything other than paper.

/** Shared drawing context handed to each glyph. */
type G = {c: string; a: string; k: string};

const SW = 6; // standard stroke weight
const BW = 8; // bold mark weight (glyph knocked out of a badge disc)

const st = (color: string, w = SW) => ({
  stroke: color,
  strokeWidth: w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
});

/** Star polygon points (n tips). */
const starPts = (n: number, ro: number, ri: number, cy = 0) =>
  Array.from({length: n * 2}, (_, i) => {
    const r = i % 2 ? ri : ro;
    const ang = (i * Math.PI) / n - Math.PI / 2;
    return `${(Math.cos(ang) * r).toFixed(2)},${(Math.sin(ang) * r + cy).toFixed(2)}`;
  }).join(' ');

/** Gear outline path. */
const gearPath = (teeth: number, ro: number, ri: number) => {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step - Math.PI / 2;
    const seq: [number, number][] = [
      [a0 - step * 0.3, ri],
      [a0 - step * 0.19, ro],
      [a0 + step * 0.19, ro],
      [a0 + step * 0.3, ri],
    ];
    for (const [ang, r] of seq) pts.push(`${(Math.cos(ang) * r).toFixed(2)} ${(Math.sin(ang) * r).toFixed(2)}`);
  }
  return 'M' + pts.join(' L') + 'Z';
};

/** Lumpy closed blob (germ body), sampled. */
const blob = (r: number, amp: number, lumps: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 84; i++) {
    const ang = (i / 84) * Math.PI * 2;
    const rr = r + amp * Math.sin(ang * lumps + 0.4);
    pts.push(`${(Math.cos(ang) * rr).toFixed(2)} ${(Math.sin(ang) * rr).toFixed(2)}`);
  }
  return 'M' + pts.join(' L') + 'Z';
};

/** DNA strand path, sampled. */
const helix = (amp: number, sign: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const y = -40 + i * 2;
    const x = sign * amp * Math.sin(((y + 40) / 80) * Math.PI * 2.5);
    pts.push(`${x.toFixed(2)} ${y}`);
  }
  return 'M' + pts.join(' L');
};

const Person = ({dx = 0, dy = 0, s = 1, fill, outline}: {dx?: number; dy?: number; s?: number; fill: string; outline?: string}) => (
  <g transform={`translate(${dx} ${dy}) scale(${s})`}>
    {outline && (
      <g stroke={outline} strokeWidth={10} strokeLinejoin="round">
        <circle cy={-22} r={15} fill={outline} />
        <path d="M-28 42 V24 C-28 6 -16 -2 0 -2 C16 -2 28 6 28 24 V42Z" fill={outline} />
      </g>
    )}
    <circle cy={-22} r={15} fill={fill} />
    <path d="M-28 42 V24 C-28 6 -16 -2 0 -2 C16 -2 28 6 28 24 V42Z" fill={fill} />
  </g>
);

const Disc = ({c}: {c: string}) => <circle r={40} fill={c} />;

const GLYPHS = {
  // ---------- signs
  question: ({c, k}: G) => (
    <>
      <Disc c={c} />
      <path d="M-12 -11 C-12 -21 -6 -26 1 -26 C9 -26 13 -20 13 -13 C13 -5 3 -3 1 4 V6" {...st(k, BW)} />
      <circle cy={20} r={5.5} fill={k} />
    </>
  ),
  exclamation: ({c, k}: G) => (
    <>
      <Disc c={c} />
      <path d="M0 -24 V6" {...st(k, BW)} />
      <circle cy={20} r={5.5} fill={k} />
    </>
  ),
  check: ({c, k}: G) => (
    <>
      <Disc c={c} />
      <path d="M-17 1 L-5 13 L18 -12" {...st(k, BW)} />
    </>
  ),
  cross: ({c, k}: G) => (
    <>
      <Disc c={c} />
      <path d="M-13 -13 L13 13 M13 -13 L-13 13" {...st(k, BW)} />
    </>
  ),
  warning: ({c, k}: G) => (
    <>
      <polygon points="0,-36 41,34 -41,34" fill={c} stroke={c} strokeWidth={10} strokeLinejoin="round" />
      <path d="M0 -10 V12" {...st(k, BW)} />
      <circle cy={24} r={5} fill={k} />
    </>
  ),
  info: ({c, k}: G) => (
    <>
      <Disc c={c} />
      <circle cy={-19} r={5.5} fill={k} />
      <path d="M0 -4 V22" {...st(k, BW)} />
    </>
  ),

  // ---------- body
  eye: ({c, a, k}: G) => (
    <>
      <path d="M-42 0 C-26 -28 26 -28 42 0 C26 28 -26 28 -42 0Z" {...st(c)} />
      <circle r={15} fill={a} />
      <circle r={7} fill={c} />
      <circle cx={5} cy={-6} r={3.5} fill={k} />
    </>
  ),
  brain: ({c, a, k}: G) => (
    <>
      <path d="M-3 -34 C-14 -40 -28 -34 -31 -24 C-41 -20 -43 -6 -37 2 C-43 10 -39 24 -28 27 C-24 36 -11 38 -3 32Z" fill={c} />
      <path d="M3 -34 C14 -40 28 -34 31 -24 C41 -20 43 -6 37 2 C43 10 39 24 28 27 C24 36 11 38 3 32Z" fill={c} />
      <path d="M-30 -10 C-22 -14 -18 -6 -11 -10 M-26 13 C-20 7 -14 15 -9 9 M-19 -26 C-16 -20 -12 -22 -10 -16" {...st(k, 5)} />
      <path d="M30 -10 C22 -14 18 -6 11 -10 M26 13 C20 7 14 15 9 9 M19 -26 C16 -20 12 -22 10 -16" {...st(k, 5)} />
      <path d="M-3 32 V42" {...st(a)} />
    </>
  ),
  ear: ({c, a}: G) => (
    <>
      <path d="M-10 -12 C-10 -32 6 -42 20 -38 C34 -34 40 -18 34 -2 C30 8 20 12 18 24 C16 36 6 42 -2 40 C-8 39 -12 34 -12 28" {...st(c)} />
      <path d="M2 -8 C2 -22 18 -26 24 -16 C28 -8 22 0 16 2 C10 4 8 8 9 14" {...st(c)} />
      <path d="M-26 -14 C-34 -4 -34 10 -26 20 M-38 -22 C-50 -6 -50 14 -38 28" {...st(a)} />
    </>
  ),
  mouth: ({c, a, k}: G) => (
    <>
      <path d="M-40 2 C-30 -6 -21 -19 -11 -18 C-6 -17 -3 -14 0 -11 C3 -14 6 -17 11 -18 C21 -19 30 -6 40 2Z" fill={a} />
      <path d="M-40 2 C-27 26 27 26 40 2Z" fill={a} />
      <path d="M-40 2 C-14 9 14 9 40 2" {...st(c)} />
      <path d="M-16 13 C-6 16 6 16 16 13" {...st(k, 4)} />
    </>
  ),
  hand: ({c, a}: G) => (
    <>
      <path d="M-24 14 L-38 -4" {...st(c, 13)} />
      <rect x={-26} y={-34} width={11} height={44} rx={5.5} fill={c} />
      <rect x={-13} y={-42} width={11} height={50} rx={5.5} fill={c} />
      <rect x={0} y={-38} width={11} height={46} rx={5.5} fill={c} />
      <rect x={13} y={-28} width={11} height={38} rx={5.5} fill={c} />
      <path d="M-26 0 H24 V20 C24 34 14 42 0 42 C-14 42 -26 34 -26 20Z" fill={c} />
      <circle cx={0} cy={22} r={7} fill={a} />
    </>
  ),
  heart: ({a, k}: G) => (
    <>
      <path d="M0 36 C-30 16 -42 0 -41 -15 C-40 -32 -16 -39 0 -20 C16 -39 40 -32 41 -15 C42 0 30 16 0 36Z" fill={a} />
      <path d="M-27 -13 C-26 -21 -21 -25 -14 -25" {...st(k, 5)} />
    </>
  ),
  lungs: ({c, a}: G) => (
    <>
      <path d="M-8 -14 C-8 -24 -15 -27 -23 -22 C-37 -12 -42 12 -40 29 C-39 37 -32 39 -24 35 L-11 27 C-8 25 -8 21 -8 17Z" fill={c} />
      <path d="M8 -14 C8 -24 15 -27 23 -22 C37 -12 42 12 40 29 C39 37 32 39 24 35 L11 27 C8 25 8 21 8 17Z" fill={c} />
      <path d="M0 -40 V-6 M0 -6 C-4 2 -11 4 -18 10 M0 -6 C4 2 11 4 18 10" {...st(a)} />
    </>
  ),
  drop: ({c, k}: G) => (
    <>
      <path d="M0 -42 C12 -24 30 -4 30 14 C30 31 16 42 0 42 C-16 42 -30 31 -30 14 C-30 -4 -12 -24 0 -42Z" fill={c} />
      <path d="M-17 14 C-17 23 -11 29 -4 30" {...st(k, 5)} />
    </>
  ),
  flame: ({a, k}: G) => (
    <>
      <path d="M2 -44 C10 -26 32 -14 32 10 C32 29 18 42 0 42 C-18 42 -32 29 -32 10 C-32 -7 -20 -15 -15 -28 C-9 -18 -7 -13 -3 -9 C3 -20 1 -32 2 -44Z" fill={a} />
      <path d="M0 42 C-10 42 -16 34 -16 25 C-16 13 -6 7 -2 -3 C5 7 16 13 16 25 C16 34 10 42 0 42Z" fill={k} />
    </>
  ),
  thermometer: ({c, a}: G) => (
    <>
      <path d="M-9 12 V-32 A9 9 0 0 1 9 -32 V12 A17 17 0 1 1 -9 12Z" {...st(c)} />
      <circle cy={26.4} r={10} fill={a} />
      <rect x={-3} y={-20} width={6} height={44} rx={3} fill={a} />
      <path d="M18 -30 H27 M18 -16 H24 M18 -2 H27" {...st(c)} />
    </>
  ),

  // ---------- nature & sky
  sun: ({c, a}: G) => (
    <>
      <circle r={17} fill={a} />
      {Array.from({length: 8}, (_, i) => {
        const ang = (i * Math.PI) / 4;
        return <path key={i} d={`M${Math.cos(ang) * 28} ${Math.sin(ang) * 28} L${Math.cos(ang) * 40} ${Math.sin(ang) * 40}`} {...st(c)} />;
      })}
    </>
  ),
  moon: ({c, a}: G) => (
    <>
      <path d="M8 -34 A34 34 0 1 0 36 8 A27 27 0 0 1 8 -34Z" fill={c} stroke={c} strokeWidth={2} strokeLinejoin="round" transform="translate(-4 4)" />
      <polygon points={starPts(4, 11, 3.5)} transform="translate(26 -26)" fill={a} />
    </>
  ),
  star: ({c}: G) => <polygon points={starPts(5, 40, 17, 4)} fill={c} stroke={c} strokeWidth={6} strokeLinejoin="round" />,
  cloud: ({c}: G) => (
    <g transform="translate(0 6)">
      <rect x={-38} y={2} width={76} height={20} rx={10} fill={c} />
      <circle cx={-19} cy={4} r={17} fill={c} />
      <circle cx={4} cy={-8} r={24} fill={c} />
      <circle cx={25} cy={6} r={15} fill={c} />
    </g>
  ),
  wind: ({c, a}: G) => (
    <>
      <path d="M-40 -14 H14 C25 -14 29 -25 22 -31 C16 -36 7 -32 8 -24" {...st(c)} />
      <path d="M-40 16 H22 C33 16 37 27 30 33 C24 38 15 34 16 26" {...st(c)} />
      <path d="M-30 1 H38" {...st(a)} />
    </>
  ),
  lightning: ({a}: G) => <path d="M10 -42 L-24 6 H0 L-10 42 L26 -8 H2Z" fill={a} stroke={a} strokeWidth={4} strokeLinejoin="round" />,

  // ---------- time
  clock: ({c, a}: G) => (
    <>
      <circle r={37} {...st(c)} />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={Math.cos((i * Math.PI) / 2) * 26} cy={Math.sin((i * Math.PI) / 2) * 26} r={3} fill={c} />
      ))}
      <path d="M0 0 V-21" {...st(c)} />
      <path d="M0 0 L15 9" {...st(a)} />
      <circle r={5} fill={c} />
    </>
  ),
  hourglass: ({c, a}: G) => (
    <>
      <path d="M-14 -24 H14 C10 -13 3 -9 0 -4 C-3 -9 -10 -13 -14 -24Z" fill={a} />
      <path d="M-16 32 C-13 22 -5 16 0 14 C5 16 13 22 16 32Z" fill={a} />
      <path d="M0 -4 V14" {...st(a, 3)} />
      <path d="M-20 -38 C-20 -14 -4 -7 -4 0 C-4 7 -20 14 -20 38 M20 -38 C20 -14 4 -7 4 0 C4 7 20 14 20 38" {...st(c)} />
      <path d="M-28 -38 H28 M-28 38 H28" {...st(c)} />
    </>
  ),
  calendar: ({c, a}: G) => (
    <>
      <rect x={-36} y={-30} width={72} height={68} rx={8} {...st(c)} />
      <path d="M-36 -10 V-22 Q-36 -30 -28 -30 H28 Q36 -30 36 -22 V-10Z" fill={c} />
      <path d="M-18 -42 V-32 M18 -42 V-32" {...st(c)} />
      {[0, 1, 2, 3].map((i) =>
        [0, 1].map((j) => {
          const hot = i === 2 && j === 1;
          return <rect key={`${i}${j}`} x={-25 + i * 14 - (hot ? 2 : 0)} y={2 + j * 15 - (hot ? 2 : 0)} width={hot ? 12 : 8} height={hot ? 12 : 8} rx={hot ? 3 : 2} fill={hot ? a : c} />;
        })
      )}
    </>
  ),

  // ---------- knowledge
  book: ({c, a, k}: G) => (
    <>
      <path d="M-3 -24 C-14 -32 -30 -32 -42 -26 V30 C-30 24 -14 24 -3 32Z" fill={c} />
      <path d="M3 -24 C14 -32 30 -32 42 -26 V30 C30 24 14 24 3 32Z" fill={c} />
      <path d="M-33 -12 C-26 -15 -18 -15 -12 -12 M-33 0 C-26 -3 -18 -3 -12 0 M-33 12 C-26 9 -18 9 -12 12" {...st(k, 4)} />
      <path d="M22 -30 V-2 L27 -8 L32 -2 V-30Z" fill={a} />
    </>
  ),
  scroll: ({c, a}: G) => (
    <>
      <rect x={-26} y={-32} width={52} height={64} {...st(c)} />
      <path d="M-15 -16 H15 M-15 -3 H15 M-15 10 H4" {...st(c)} />
      <rect x={-36} y={-42} width={72} height={15} rx={7.5} fill={c} />
      <rect x={-36} y={27} width={72} height={15} rx={7.5} fill={c} />
      <circle cx={16} cy={14} r={7} fill={a} />
    </>
  ),
  document: ({c, a}: G) => (
    <>
      <path d="M-28 -40 H12 L30 -22 V40 H-28Z" {...st(c)} />
      <path d="M12 -40 V-22 H30Z" fill={c} stroke={c} strokeWidth={6} strokeLinejoin="round" />
      <path d="M-16 -16 H2" {...st(a)} />
      <path d="M-16 -2 H18 M-16 12 H18 M-16 26 H6" {...st(c)} />
    </>
  ),
  quill: ({c, a, k}: G) => (
    <>
      <path d="M-22 30 C-24 -2 0 -30 38 -42 C30 -12 8 16 -22 30Z" fill={c} />
      <path d="M-22 30 C-6 6 12 -16 32 -36" {...st(k, 4)} />
      <path d="M10 -14 L22 -10 M-2 2 L10 6" {...st(k, 4)} />
      <path d="M-22 30 L-34 42" {...st(a)} />
    </>
  ),
  magnifier: ({c, a}: G) => (
    <>
      <path d="M12 12 L35 35" {...st(c, 13)} />
      <circle cx={-8} cy={-8} r={25} {...st(c)} />
      <path d="M-22 -10 A15 15 0 0 1 -10 -22" {...st(a, 5)} />
    </>
  ),
  microscope: ({c, a}: G) => (
    <>
      <rect x={-34} y={32} width={64} height={10} rx={5} fill={c} />
      <path d="M14 32 C34 22 34 -8 10 -14" {...st(c)} />
      <path d="M-26 16 H10" {...st(c)} />
      <g transform="translate(-6 -14) rotate(-28)">
        <rect x={-9} y={-24} width={18} height={40} rx={4} fill={c} />
        <rect x={-12} y={-34} width={24} height={10} rx={3} fill={a} />
        <rect x={-5} y={16} width={10} height={10} rx={2} fill={c} />
      </g>
    </>
  ),
  flask: ({c, a}: G) => (
    <>
      <path d="M-19 10 H19 L30 28 Q33 36 24 36 H-24 Q-33 36 -30 28Z" fill={a} />
      <path d="M-14 -38 H14 M-7 -38 V-12 L-30 28 Q-33 36 -24 36 H24 Q33 36 30 28 L7 -12 V-38" {...st(c)} />
      <circle cx={-2} cy={0} r={3.5} fill={a} />
      <circle cx={6} cy={-10} r={2.5} fill={a} />
    </>
  ),
  pill: ({c, a, k}: G) => (
    <g transform="rotate(-45)">
      <path d="M0 -15 H-25 A15 15 0 0 0 -25 15 H0Z" fill={c} />
      <path d="M0 -15 H25 A15 15 0 0 1 25 15 H0Z" fill={a} />
      <path d="M-28 -6 H-14" {...st(k, 4)} />
    </g>
  ),
  syringe: ({c, a}: G) => (
    <g transform="rotate(-45) scale(1.12)">
      <rect x={-2} y={-6} width={24} height={12} fill={a} />
      <rect x={-20} y={-12} width={44} height={24} rx={3} {...st(c)} />
      <path d="M-20 -19 V19 M-20 0 H-36 M-36 -12 V12 M24 0 H46 M4 -12 V-4 M12 -12 V-4" {...st(c)} />
    </g>
  ),
  germ: ({c, a}: G) => (
    <>
      <path d={blob(31, 6, 7)} fill={c} />
      <circle cx={-10} cy={-6} r={7} fill={a} />
      <circle cx={10} cy={8} r={5.5} fill={a} />
      <circle cx={9} cy={-12} r={3.5} fill={a} />
      <circle cx={-6} cy={14} r={3} fill={a} />
    </>
  ),
  virus: ({c, a, k}: G) => (
    <>
      {Array.from({length: 8}, (_, i) => {
        const ang = (i * Math.PI) / 4 + Math.PI / 8;
        const cx = Math.cos(ang);
        const cy = Math.sin(ang);
        return (
          <g key={i}>
            <path d={`M${cx * 22} ${cy * 22} L${cx * 34} ${cy * 34}`} {...st(c)} />
            <circle cx={cx * 37} cy={cy * 37} r={6} fill={a} />
          </g>
        );
      })}
      <circle r={25} fill={c} />
      <circle cx={-8} cy={-7} r={5} fill={k} />
      <circle cx={9} cy={6} r={4} fill={k} />
      <circle cx={8} cy={-11} r={2.5} fill={k} />
    </>
  ),
  dna: ({c, a}: G) => (
    <>
      {Array.from({length: 9}, (_, i) => {
        const y = -36 + i * 9;
        const x = 18 * Math.sin(((y + 40) / 80) * Math.PI * 2.5);
        return Math.abs(x) > 5 ? <path key={i} d={`M${-x} ${y} L${x} ${y}`} {...st(a, 4)} /> : null;
      })}
      <path d={helix(18, 1)} {...st(c)} />
      <path d={helix(18, -1)} {...st(c)} />
    </>
  ),
  atom: ({c, a}: G) => (
    <>
      {[0, 60, 120].map((r) => (
        <ellipse key={r} rx={41} ry={15} transform={`rotate(${r})`} stroke={c} strokeWidth={5} fill="none" />
      ))}
      <circle r={8} fill={a} />
      <circle cx={-41} cy={0} r={5} fill={c} />
    </>
  ),

  // ---------- people & power
  person: ({c}: G) => <Person fill={c} />,
  people: ({c, a, k}: G) => (
    <>
      <Person dx={14} dy={-6} s={0.82} fill={a} />
      <Person dx={-12} dy={6} s={0.82} fill={c} outline={k} />
    </>
  ),
  crown: ({c, a}: G) => (
    <>
      <path d="M-34 20 L-38 -16 L-18 2 L0 -26 L18 2 L38 -16 L34 20Z" fill={c} stroke={c} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-36} y={27} width={72} height={10} rx={4} fill={c} />
      <circle cx={-38} cy={-22} r={5.5} fill={a} />
      <circle cx={0} cy={-32} r={5.5} fill={a} />
      <circle cx={38} cy={-22} r={5.5} fill={a} />
      <circle cx={0} cy={8} r={6} fill={a} />
    </>
  ),
  skull: ({c, k}: G) => (
    <>
      <path d="M-31 4 C-35 -24 -18 -40 0 -40 C18 -40 35 -24 31 4 C29 13 21 16 21 22 V31 C21 35 17 38 13 38 H-13 C-17 38 -21 35 -21 31 V22 C-21 16 -29 13 -31 4Z" fill={c} />
      <ellipse cx={-12} cy={-5} rx={9} ry={10} fill={k} />
      <ellipse cx={12} cy={-5} rx={9} ry={10} fill={k} />
      <path d="M0 9 L-5 18 H5Z" fill={k} stroke={k} strokeWidth={2} strokeLinejoin="round" />
      <path d="M-8 28 V38 M0 28 V38 M8 28 V38" {...st(k, 4)} />
    </>
  ),

  // ---------- places & buildings
  house: ({c, a, k}: G) => (
    <>
      <rect x={14} y={-36} width={11} height={22} fill={c} />
      <path d="M-30 -4 L0 -30 L30 -4 V38 H-30Z" fill={c} />
      <path d="M-42 0 L0 -36 L42 0" {...st(a, 7)} />
      <rect x={-8} y={14} width={16} height={24} rx={3} fill={k} />
      <rect x={-6} y={-12} width={12} height={12} rx={2} fill={k} />
    </>
  ),
  building: ({c, a, k}: G) => (
    <>
      <rect x={-34} y={-40} width={44} height={80} rx={3} fill={c} />
      <rect x={14} y={-10} width={24} height={50} rx={3} fill={c} />
      {[0, 1, 2].map((i) =>
        [0, 1, 2, 3].map((j) => <rect key={`${i}${j}`} x={-26 + i * 12} y={-30 + j * 14} width={7} height={8} rx={1.5} fill={i === 1 && j === 1 ? a : k} />)
      )}
      <rect x={-18} y={26} width={12} height={14} rx={2} fill={k} />
      <rect x={20} y={0} width={12} height={6} rx={1.5} fill={k} />
      <rect x={20} y={14} width={12} height={6} rx={1.5} fill={k} />
    </>
  ),
  church: ({c, a, k}: G) => (
    <>
      <path d="M-42 40 V8 L-27 -6 L-12 8 V40Z M42 40 V8 L27 -6 L12 8 V40Z" fill={c} />
      <rect x={-13} y={-14} width={26} height={54} fill={c} />
      <path d="M-17 -12 L0 -32 L17 -12Z" fill={c} stroke={c} strokeWidth={3} strokeLinejoin="round" />
      <path d="M0 -46 V-33 M-6 -40 H6" {...st(a, 5)} />
      <path d="M-7 40 V28 A7 7 0 0 1 7 28 V40Z" fill={k} />
      <circle cy={6} r={5} fill={k} />
      <rect x={-30} y={16} width={6} height={12} rx={3} fill={k} />
      <rect x={24} y={16} width={6} height={12} rx={3} fill={k} />
    </>
  ),
  castle: ({c, a, k}: G) => (
    <>
      <path d="M-30 -30 V-44 M-30 -44 L-16 -40 L-30 -36" {...st(a, 4)} />
      <rect x={-42} y={-30} width={22} height={70} fill={c} />
      <rect x={20} y={-30} width={22} height={70} fill={c} />
      <rect x={-20} y={-10} width={40} height={50} fill={c} />
      {[-42, -34.5, -27].map((x) => (
        <rect key={x} x={x} y={-38} width={7} height={9} fill={c} />
      ))}
      {[20, 27.5, 35].map((x) => (
        <rect key={x} x={x} y={-38} width={7} height={9} fill={c} />
      ))}
      {[-20, -8.5, 3, 14].map((x) => (
        <rect key={x} x={x} y={-18} width={6} height={9} fill={c} />
      ))}
      <path d="M-11 40 V24 A11 11 0 0 1 11 24 V40Z" fill={k} />
      <rect x={-34} y={-16} width={6} height={13} rx={3} fill={k} />
      <rect x={28} y={-16} width={6} height={13} rx={3} fill={k} />
    </>
  ),
  globe: ({c, a}: G) => (
    <>
      <ellipse rx={16} ry={37} {...st(c, 5)} />
      <path d="M0 -37 V37 M-32 -18 H32 M-32 18 H32" {...st(c, 5)} />
      <path d="M-37 0 H37" {...st(a, 5)} />
      <circle r={37} {...st(c)} />
    </>
  ),
  pin: ({c, a, k}: G) => (
    <>
      <ellipse cy={40} rx={14} ry={4} fill={c} />
      <path d="M0 40 C-10 24 -30 7 -30 -12 C-30 -30 -16 -42 0 -42 C16 -42 30 -30 30 -12 C30 7 10 24 0 40Z" fill={a} />
      <circle cy={-12} r={11} fill={k} />
    </>
  ),
  key: ({c, a, k}: G) => (
    <g transform="rotate(-35)">
      <rect x={-12} y={-5} width={54} height={10} rx={3} fill={c} />
      <rect x={26} y={2} width={7} height={14} rx={2} fill={c} />
      <rect x={36} y={2} width={6} height={10} rx={2} fill={c} />
      <circle cx={-24} r={18} fill={a} />
      <circle cx={-28} r={7} fill={k} />
    </g>
  ),
  lock: ({c, a}: G) => (
    <>
      <path d="M-17 -4 V-20 A17 17 0 0 1 17 -20 V-4" {...st(c, 8)} />
      <rect x={-28} y={-6} width={56} height={46} rx={7} fill={c} />
      <circle cy={11} r={7} fill={a} />
      <path d="M-3 14 L-5 28 H5 L3 14Z" fill={a} stroke={a} strokeWidth={2} strokeLinejoin="round" />
    </>
  ),

  // ---------- technology & talk
  phone: ({c, a, k}: G) => (
    <>
      <rect x={-30} y={-40} width={40} height={80} rx={8} fill={c} />
      <rect x={-24} y={-30} width={28} height={52} rx={2} fill={k} />
      <circle cx={-10} cy={31} r={3.5} fill={k} />
      <path d="M20 -16 A18 18 0 0 1 20 8 M30 -24 A30 30 0 0 1 30 16" {...st(a)} />
    </>
  ),
  computer: ({c, a, k}: G) => (
    <>
      <rect x={-42} y={-36} width={84} height={56} rx={5} fill={c} />
      <rect x={-35} y={-29} width={70} height={42} rx={2} fill={k} />
      <path d="M-25 4 L-11 -8 L1 0 L23 -19" {...st(a, 5)} />
      <path d="M-6 20 L-9 34 H9 L6 20Z" fill={c} />
      <path d="M-20 36 H20" {...st(c)} />
    </>
  ),
  chip: ({c, a, k}: G) => (
    <>
      {[-15, -5, 5, 15].map((o) => (
        <path key={o} d={`M${o} -26 V-38 M${o} 26 V38 M-26 ${o} H-38 M26 ${o} H38`} {...st(c, 5)} />
      ))}
      <rect x={-26} y={-26} width={52} height={52} rx={6} fill={c} />
      <rect x={-13} y={-13} width={26} height={26} rx={3} fill={k} />
      <rect x={-6} y={-6} width={12} height={12} rx={2} fill={a} />
    </>
  ),
  speech: ({c, a, k}: G) => (
    <>
      <path d="M-18 16 L-26 38 L4 16Z" fill={c} stroke={c} strokeWidth={4} strokeLinejoin="round" />
      <rect x={-42} y={-36} width={84} height={56} rx={16} fill={c} />
      <circle cx={-16} cy={-8} r={5.5} fill={k} />
      <circle cx={0} cy={-8} r={5.5} fill={k} />
      <circle cx={16} cy={-8} r={5.5} fill={a} />
    </>
  ),
  thought: ({c, a}: G) => (
    <>
      <rect x={-38} y={-14} width={76} height={26} rx={13} fill={c} />
      <circle cx={-19} cy={-14} r={15} fill={c} />
      <circle cx={3} cy={-22} r={19} fill={c} />
      <circle cx={23} cy={-12} r={14} fill={c} />
      <circle cx={-20} cy={24} r={7} fill={c} />
      <circle cx={-32} cy={37} r={4.5} fill={a} />
    </>
  ),
  lightbulb: ({c, a}: G) => (
    <>
      <path d="M-13 12 C-13 2 -26 -4 -26 -18 C-26 -32 -14 -42 0 -42 C14 -42 26 -32 26 -18 C26 -4 13 2 13 12Z" {...st(c)} />
      <path d="M-6 12 V-4 C-6 -12 6 -12 6 -4 V12" {...st(a, 5)} />
      <path d="M-13 22 H13 M-10 32 H10" {...st(c)} />
      <path d="M-4 41 H4" {...st(c)} />
    </>
  ),

  // ---------- society & data
  coin: ({c, a, k}: G) => (
    <>
      <ellipse cx={6} cy={6} rx={36} ry={36} fill={a} />
      <circle cx={-2} cy={-2} r={36} fill={c} />
      <circle cx={-2} cy={-2} r={27} stroke={k} strokeWidth={4} fill="none" />
      <polygon points={starPts(5, 13, 5.5, 0)} transform="translate(-2 -1)" fill={k} stroke={k} strokeWidth={2} strokeLinejoin="round" />
    </>
  ),
  scale: ({c, a}: G) => (
    <>
      <path d="M0 -30 V34 M-18 38 H18" {...st(c)} />
      <path d="M-36 -22 H36" {...st(c)} />
      <path d="M-36 -22 L-45 6 M-36 -22 L-27 6 M36 -22 L27 6 M36 -22 L45 6" {...st(c, 3.5)} />
      <path d="M-47 6 H-25 A11 11 0 0 1 -47 6Z M25 6 H47 A11 11 0 0 1 25 6Z" fill={c} stroke={c} strokeWidth={3} strokeLinejoin="round" />
      <circle cy={-32} r={6} fill={a} />
    </>
  ),
  shield: ({c, a}: G) => (
    <>
      <path d="M0 -42 L35 -30 V-2 C35 18 19 33 0 42 C-19 33 -35 18 -35 -2 V-30Z" fill={c} />
      <path d="M0 -32 L26 -23 V-2 C26 13 15 25 0 32Z" fill={a} />
    </>
  ),
  chart: ({c, a}: G) => (
    <>
      <path d="M-38 -38 V36 H40" {...st(c)} />
      <rect x={-26} y={6} width={14} height={24} rx={2} fill={c} />
      <rect x={-5} y={-10} width={14} height={40} rx={2} fill={c} />
      <rect x={16} y={-30} width={14} height={60} rx={2} fill={a} />
    </>
  ),
  gear: ({c, a, k}: G) => (
    <>
      <path d={gearPath(8, 40, 29)} fill={c} stroke={c} strokeWidth={4} strokeLinejoin="round" />
      <circle r={13} fill={k} />
      <circle r={5} fill={a} />
    </>
  ),
  'arrow-right': ({c}: G) => <polygon points="-38,-10 6,-10 6,-28 38,0 6,28 6,10 -38,10" fill={c} stroke={c} strokeWidth={6} strokeLinejoin="round" />,
  'arrow-up': ({c}: G) => <polygon points="-38,-10 6,-10 6,-28 38,0 6,28 6,10 -38,10" fill={c} stroke={c} strokeWidth={6} strokeLinejoin="round" transform="rotate(-90)" />,
  bath: ({c, a}: G) => (
    <>
      <circle cx={-4} cy={-12} r={6} fill={a} />
      <circle cx={10} cy={-17} r={8} fill={a} />
      <circle cx={24} cy={-11} r={5} fill={a} />
      <path d="M-30 -2 V-28 C-30 -38 -16 -40 -13 -30" {...st(c)} />
      <path d="M-43 0 H43" {...st(c)} />
      <path d="M-36 4 H36 V12 C36 27 24 34 10 34 H-10 C-24 34 -36 27 -36 12Z" fill={c} />
      <path d="M-24 34 L-28 42 M24 34 L28 42" {...st(c)} />
    </>
  ),
} satisfies Record<string, (g: G) => React.ReactNode>;

export type IconName = keyof typeof GLYPHS;

/** All available icon names (for galleries, pickers, validation). */
export const ICON_NAMES = Object.keys(GLYPHS) as IconName[];

/**
 * Icon — bold flat pictogram from the Binly icon family. origin = centre; 96×96 px at s=1.
 * Two-tone: `color` (main, default ink) + `accent` (one detail, default oxblood); `knock` paints cut-outs
 * (default paper — set it to the background colour on dark panels). `p` 0→1 pops it in (settles at 1).
 */
export const Icon: React.FC<{
  name: IconName;
  x: number;
  y: number;
  s?: number;
  color?: string;
  accent?: string;
  knock?: string;
  p?: number;
  r?: number;
}> = ({name, x, y, s = 1, color = C.ink, accent = C.oxblood, knock = C.paper, p = 1, r = 0}) => {
  if (p <= 0) return null;
  const glyph = GLYPHS[name];
  if (!glyph) return null;
  const k = clamp01(p);
  const q = popIn(k, 0.45, 0.3); // pop-up with bounce + jelly
  const rot = r + (1 - ease.out(k)) * -10;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * q.sx} ${s * q.sy})`} opacity={q.o}>
      {glyph({c: color, a: accent, k: knock})}
    </g>
  );
};
