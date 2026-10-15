import React from 'react';
import {C} from '../../../kit/theme';
import {clamp01, ease, lerp, noise1, rand, randRange} from '../../../kit/anim';
import {uid} from '../../../kit/stage';
import {LightPool, Steam} from '../../../kit/fx';
import {frac, mix, P2, smooth} from './util';

export type HeroTubProps = {
  x?: number;
  y?: number;
  s?: number;
  /** 0..1: a boundary wipes in from the right; right of it = night (ink, cold light, plum steam curling DOWN) */
  split?: number;
  /** local x (relative to origin, before s) where the boundary rests at split = 1 (0 = tub centre) */
  splitX?: number;
  steam?: number;
  /** warm lamp light from the left */
  light?: number;
  /** floating herb leaves & flowers on the water */
  herbs?: number;
  /** calm bather (head + shoulders, back turned, in a linen shift) rising into view */
  bather?: number;
  /** simple stone wall + beam + floor behind the tub */
  backdrop?: boolean;
  t?: number;
  seed?: number;
};

const RIM = -440; // rim centre y
const RX = 560;
const RY = 78;
const BX = 480;
const BY = 60;
const WY = -422; // water surface centre y
const rimFront = (xx: number) => RIM + RY * Math.sqrt(Math.max(0, 1 - (xx / RX) ** 2));
const botFront = (xx: number) => BY * Math.sqrt(Math.max(0, 1 - (xx / BX) ** 2));

type Pal = {wood: string; woodL: string; woodD: string; iron: string; ironL: string; linen: string; linenS: string; water: string; waterL: string; skin: string; skinS: string; hair: string; leaf: string; leafD: string; stone: string; stoneS: string; beam: string; floor: string};
const palOf = (night: boolean): Pal => {
  const n = (c: string, k = 0.8) => (night ? mix(mix(c, C.ink, k), C.slate, 0.1) : c);
  return {
    wood: n(C.wood, 0.66),
    woodL: n(C.woodLight, 0.6),
    woodD: n(C.woodDark, 0.72),
    iron: n(C.slate, 0.55),
    ironL: n(C.metal, 0.6),
    linen: n(C.paperLight, 0.62),
    linenS: n(C.paperDeep, 0.68),
    water: night ? mix(C.waterDeep, C.ink, 0.62) : C.water,
    waterL: night ? mix(C.theoryLight, C.ink, 0.25) : C.paperLight,
    skin: n(C.skin[1], 0.62),
    skinS: n(C.skinShade[1], 0.66),
    hair: n(C.hair[2]),
    leaf: n(C.evidenceLight),
    leafD: n(C.evidence),
    stone: n(C.stone, 0.9),
    stoneS: n(C.stoneShade, 0.84),
    beam: n(C.woodDark, 0.85),
    floor: n(C.stoneDark, 0.86),
  };
};

/** Tub body silhouette (front wall), local coords. */
const BODY = `M${-RX} ${RIM} C${-RX - 26} ${RIM + 150} ${-BX - 50} ${-90} ${-BX} 0 A${BX} ${BY} 0 0 0 ${BX} 0 C${BX + 50} ${-90} ${RX + 26} ${RIM + 150} ${RX} ${RIM} A${RX} ${RY} 0 0 1 ${-RX} ${RIM} Z`;

const Backdrop: React.FC<{c: Pal}> = ({c}) => (
  <g>
    <rect x={-1500} y={-1300} width={3000} height={1300} fill={c.stone} />
    {Array.from({length: 9}, (_, r) =>
      Array.from({length: 14}, (_, k) => {
        const bw = 220;
        const bx = -1500 + k * bw + (r % 2 ? bw / 2 : 0) + randRange(r * 31 + k, -20, 20);
        const by = -1300 + r * 130 + 20;
        return <rect key={`${r}-${k}`} x={bx + 8} y={by + 8} width={bw - 22} height={110} rx={10} fill={c.stoneS} opacity={0.35 + 0.25 * rand(r * 7 + k)} />;
      }),
    )}
    <rect x={-1500} y={-1180} width={3000} height={90} fill={c.beam} />
    <rect x={-1500} y={-1100} width={3000} height={16} fill={C.ink} opacity={0.25} />
    <rect x={-1500} y={-40} width={3000} height={400} fill={c.floor} />
    <rect x={-1500} y={-40} width={3000} height={12} fill={C.ink} opacity={0.2} />
  </g>
);

const TubArt: React.FC<{c: Pal; night: boolean; t: number; steam: number; light: number; herbs: number; bather: number; seed: number; cid: string}> = ({c, night, t, steam, light, herbs, bather, seed, cid}) => {
  const STAVES = 14;
  const staves = Array.from({length: STAVES}, (_, i) => {
    const f0 = i / STAVES;
    const f1 = (i + 1) / STAVES;
    const xt0 = lerp(-RX, RX, f0);
    const xt1 = lerp(-RX, RX, f1);
    const xb0 = lerp(-BX, BX, f0);
    const xb1 = lerp(-BX, BX, f1);
    const fill = i % 2 ? c.wood : mix(c.wood, c.woodL, 0.45);
    return <path key={i} d={`M${xt0} ${rimFront(xt0) - 4} L${xt1} ${rimFront(xt1) - 4} L${xb1} ${botFront(xb1) + 4} L${xb0} ${botFront(xb0) + 4} Z`} fill={fill} />;
  });
  const seams = Array.from({length: STAVES - 1}, (_, i) => {
    const f = (i + 1) / STAVES;
    const xt = lerp(-RX, RX, f);
    const xb = lerp(-BX, BX, f);
    return <path key={i} d={`M${xt} ${rimFront(xt)} L${xb} ${botFront(xb)}`} stroke={c.woodD} strokeWidth={4} />;
  });
  const hoop = (f: number, k: number) => {
    const cy = lerp(RIM, 0, f);
    const rx = lerp(RX, BX, f) + 22 * Math.sin(Math.PI * f) + 6;
    const ry = lerp(RY, BY, f);
    return (
      <g key={k}>
        <path d={`M${-rx} ${cy} A${rx} ${ry} 0 0 0 ${rx} ${cy}`} fill="none" stroke={c.iron} strokeWidth={30} />
        <path d={`M${-rx} ${cy - 10} A${rx} ${ry} 0 0 0 ${rx} ${cy - 10}`} fill="none" stroke={c.ironL} strokeWidth={4} opacity={0.6} />
        {[-0.75, -0.35, 0.05, 0.45, 0.82].map((u, j) => (
          <circle key={j} cx={u * rx} cy={cy + ry * Math.sqrt(1 - u * u)} r={5} fill={c.ironL} />
        ))}
      </g>
    );
  };
  // water ripples
  const ripples = [0, 1, 2].map((i) => {
    const ph = frac(t * 0.22 + i / 3);
    return <ellipse key={i} cx={-120 + i * 140} cy={WY + 6} rx={lerp(40, 260, ph)} ry={lerp(6, 34, ph)} fill="none" stroke={c.waterL} strokeWidth={4} opacity={(1 - ph) * 0.45} />;
  });
  // bather
  const bp = ease.out(clamp01(bather));
  const bx = 150;
  const by = WY + 4 + (1 - bp) * 120;
  const breath = Math.sin(t * 1.3) * 2;
  const tiltH = Math.sin(t * 0.5) * 2;
  // herbs
  const hp = clamp01(herbs);
  const leaves = Array.from({length: 11}, (_, i) => {
    const ap = clamp01(hp * 2.2 - i * 0.1);
    if (ap <= 0) return null;
    const a = rand(seed * 5 + i) * Math.PI * 2 + t * 0.05 * (i % 2 ? 1 : -1);
    const rr = randRange(seed + i * 3, 0.25, 0.9);
    let lx = Math.cos(a) * 470 * rr;
    const ly = WY + 8 + Math.sin(a) * 44 * rr + Math.sin(t * 1.4 + i) * 2;
    if (bather > 0.1 && Math.abs(lx - bx) < 120) lx += lx < bx ? -110 : 110;
    const rot = rand(seed * 9 + i) * 180 + Math.sin(t * 0.7 + i) * 10;
    const sc = ease.outBack(ap);
    if (i % 4 === 3) {
      return (
        <g key={i} transform={`translate(${lx} ${ly}) scale(${sc} ${sc * 0.6})`}>
          {[0, 1, 2, 3, 4, 5].map((pt) => (
            <ellipse key={pt} cx={Math.cos(pt) * 11} cy={Math.sin(pt) * 11} rx={8} ry={5} transform={`rotate(${(pt * 180) / Math.PI} ${Math.cos(pt) * 11} ${Math.sin(pt) * 11})`} fill={c.linen} />
          ))}
          <circle r={7} fill={night ? mix(C.caution, C.night, 0.5) : C.cautionLight} />
        </g>
      );
    }
    return (
      <g key={i} transform={`translate(${lx} ${ly}) rotate(${rot}) scale(${sc} ${sc * 0.62})`}>
        <path d="M-26 0 Q0 -16 26 0 Q0 16 -26 0 Z" fill={i % 2 ? c.leaf : c.leafD} />
        <path d="M-22 0 L22 0" stroke={c.leafD} strokeWidth={3} opacity={0.6} />
      </g>
    );
  });

  return (
    <g>
      <LightPool x={0} y={-6} r={640} sy={0.12} color={C.ink} strength={2.2} />
      {/* body */}
      <clipPath id={`${cid}-body`}>
        <path d={BODY} />
      </clipPath>
      <g clipPath={`url(#${cid}-body)`}>
        <rect x={-RX - 60} y={RIM - 100} width={RX * 2 + 120} height={-RIM + 200} fill={c.wood} />
        {staves}
        {seams}
        <rect x={250} y={RIM - 100} width={400} height={-RIM + 200} fill={c.woodD} opacity={0.35} />
        <rect x={-RX - 60} y={RIM - 100} width={240} height={-RIM + 200} fill={C.lamp} opacity={0.18 * light * (night ? 0 : 1)} />
        {hoop(0.2, 0)}
        {hoop(0.8, 1)}
      </g>
      <path d={BODY} fill="none" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" opacity={0.6} />
      {/* rim + inside */}
      <ellipse cx={0} cy={RIM} rx={RX} ry={RY} fill={c.woodL} stroke={C.ink} strokeWidth={5} strokeOpacity={0.6} />
      <clipPath id={`${cid}-in`}>
        <ellipse cx={0} cy={RIM + 4} rx={RX - 30} ry={RY - 14} />
      </clipPath>
      <g clipPath={`url(#${cid}-in)`}>
        <rect x={-RX} y={RIM - RY} width={RX * 2} height={RY * 2 + 20} fill={c.woodD} />
        {/* linen lining on the back wall */}
        <path d={`M${-RX} ${RIM - 70} L${RX} ${RIM - 70} L${RX} ${WY - 22} ${Array.from({length: 13}, (_, k) => `L${RX - (k + 0.5) * (RX / 6.5)} ${WY - 32 + (k % 2) * 12}`).join(' ')} L${-RX} ${WY - 22} Z`} fill={c.linen} />
        <ellipse cx={0} cy={WY} rx={RX - 34} ry={RY - 8} fill={c.water} />
        <ellipse cx={-160} cy={WY - 8} rx={220} ry={22} fill={night ? c.waterL : C.lamp} opacity={night ? 0.15 : 0.25 * light} />
        {ripples}
      </g>
        {/* bather — head & shoulders above water, back turned, linen shift */}
        {bp > 0 && (
          <g opacity={clamp01(bp * 2)}>
            <clipPath id={`${cid}-bw`}>
              <rect x={-RX} y={-1400} width={RX * 2} height={1400 + WY + 6} />
            </clipPath>
            <g clipPath={`url(#${cid}-bw)`}>
              <g transform={`translate(${bx} ${by})`}>
                <path d={`M-130 30 C-130 ${-40 - breath} -92 ${-78 - breath} -36 ${-86 - breath} L36 ${-86 - breath} C92 ${-78 - breath} 130 ${-40 - breath} 130 30 Z`} fill={c.linen} />
                <path d={`M40 ${-84 - breath} C92 ${-74 - breath} 128 ${-40 - breath} 130 30 L70 30 C80 -20 70 -60 40 ${-84 - breath} Z`} fill={c.linenS} opacity={0.6} />
                <path d="M-60 -50 Q-70 -10 -66 30 M-10 -70 Q-6 -20 -14 30 M52 -60 Q64 -20 58 30" stroke={c.linenS} strokeWidth={4} fill="none" strokeLinecap="round" />
                <path d={`M-30 ${-86 - breath} Q0 ${-74 - breath} 30 ${-86 - breath}`} stroke={c.linenS} strokeWidth={5} fill="none" strokeLinecap="round" />
                <g transform={`rotate(${tiltH - 4} 0 -100)`}>
                  <rect x={-24} y={-128 - breath} width={48} height={50} rx={14} fill={c.skinS} />
                  <circle cx={0} cy={-170 - breath} r={54} fill={c.skin} />
                  <ellipse cx={-50} cy={-162 - breath} rx={10} ry={16} fill={c.skinS} />
                  <path d={`M-40 ${-205 - breath} C-30 ${-236 - breath} 30 ${-240 - breath} 50 ${-200 - breath} C62 ${-170 - breath} 52 ${-134 - breath} 34 ${-120 - breath} C10 ${-130 - breath} -20 ${-140 - breath} -34 ${-150 - breath} C-46 ${-170 - breath} -50 ${-190 - breath} -40 ${-205 - breath} Z`} fill={c.hair} />
                  <circle cx={14} cy={-222 - breath} r={26} fill={c.hair} />
                  <path d={`M-4 ${-226 - breath} Q14 ${-238 - breath} 32 ${-222 - breath}`} stroke={C.ink} strokeOpacity={0.3} strokeWidth={4} fill="none" strokeLinecap="round" />
                </g>
              </g>
            </g>
            <ellipse cx={bx} cy={WY + 8} rx={150} ry={18} fill="none" stroke={c.waterL} strokeWidth={4} opacity={0.5} />
          </g>
        )}
      <g clipPath={`url(#${cid}-in)`}>{leaves}</g>
      {/* linen drape over the front-left rim */}
      <path
        d={`M-430 ${rimFront(-430) - 18} C-330 ${rimFront(-330) - 26} -220 ${rimFront(-220) - 22} -120 ${rimFront(-120) - 12} L-128 ${rimFront(-120) + 120} Q-170 ${rimFront(-170) + 150} -210 ${rimFront(-210) + 112} Q-260 ${rimFront(-260) + 168} -310 ${rimFront(-310) + 118} Q-360 ${rimFront(-360) + 150} -412 ${rimFront(-412) + 96} Z`}
        fill={c.linen}
        stroke={C.ink}
        strokeOpacity={0.35}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d={`M-370 ${rimFront(-370) + 4} Q-372 ${rimFront(-372) + 60} -360 ${rimFront(-360) + 130} M-260 ${rimFront(-260) + 2} Q-266 ${rimFront(-266) + 70} -260 ${rimFront(-260) + 150} M-170 ${rimFront(-170) + 2} Q-168 ${rimFront(-168) + 60} -172 ${rimFront(-172) + 120}`} stroke={c.linenS} strokeWidth={5} fill="none" strokeLinecap="round" />
      {/* steam: warm & rising by day; at night handled outside (plum, curling down) */}
      {!night && steam > 0 && <Steam t={t} x={-40} y={WY - 10} w={900} h={460} n={8} color={C.paperLight} seed={seed + 2} strength={steam * 1.8} />}
    </g>
  );
};

/** Plum steam curling DOWN toward the water and spreading over it (night side). */
const DownSteam: React.FC<{t: number; steam: number; seed: number}> = ({t, steam, seed}) => (
  <g fill="none" strokeLinecap="round">
    <ellipse cx={0} cy={WY - 2} rx={470} ry={44} fill={C.theoryLight} opacity={0.42 * steam} />
    {Array.from({length: 8}, (_, i) => {
      const ph = frac(t * 0.2 + rand(seed * 3 + i));
      const bx0 = -400 + i * 114 + noise1(t * 0.4 + i, seed) * 24;
      const y0 = lerp(-880, WY - 26, ease.inOut(ph));
      const len = 380;
      const sway = Math.sin(t * 0.7 + i * 1.7) * (6 + 8 * ph);
      const dir = i % 2 ? 1 : -1;
      const spread = 90 * ease.out(clamp01((ph - 0.55) / 0.45));
      const pts: P2[] = [
        [bx0 - sway * 0.6, y0 - len],
        [bx0 + sway, y0 - len * 0.62],
        [bx0 - sway * 0.7, y0 - len * 0.28],
        [bx0, y0],
        [bx0 + dir * (30 + spread), y0 + 6],
        [bx0 + dir * (60 + spread * 1.6), y0 - 18 + spread * 0.1],
      ];
      return <path key={i} d={smooth(pts)} stroke={i % 2 ? C.theoryLight : mix(C.theoryLight, C.theoryTint, 0.35)} strokeWidth={30 + ph * 18} opacity={Math.min(1, Math.sin(Math.PI * ph) * 1.6) * 0.78 * steam} />;
    })}
  </g>
);

/**
 * HeroTub — hero close-up of a steaming medieval wooden tub (staves, iron hoops, linen lining + drape, water).
 * Origin = bottom centre of the tub, ≈ 1120 × 520 at s=1 (steam rises ≈ 500 more).
 * Dials: split (night wipes in from the right), splitX, steam, light, herbs, bather (clothed, back turned), backdrop, t, seed.
 */
export const HeroTub: React.FC<HeroTubProps> = ({x = 960, y = 1000, s = 1, split = 0, splitX = 0, steam = 1, light = 1, herbs = 0, bather = 0, backdrop = false, t = 0, seed = 1}) => {
  const cid = uid('herotub', seed, Math.round(x), Math.round(y));
  const sp = ease.inOut(clamp01(split));
  const bxp = lerp(1500, splitX, sp);
  const day = palOf(false);
  const nite = palOf(true);
  // wavy boundary
  const edge: P2[] = Array.from({length: 11}, (_, i) => [bxp + noise1(i * 0.7 + t * 0.4, seed) * 22, -1400 + i * 180]);
  const edgeD = edge.map(([ex, ey]) => `L${ex.toFixed(1)} ${ey}`).join(' ');
  const leftClip = `M-2000 -1400 ${edgeD} L-2000 400 Z`;
  const rightClip = `M2000 -1400 ${edgeD} L2000 400 Z`;
  const art = (night: boolean) => (
    <g>
      {backdrop && <Backdrop c={night ? nite : day} />}
      {night && !backdrop && <rect x={-2000} y={-1400} width={4000} height={1800} fill={C.ink} />}
      {!night && light > 0 && <LightPool x={-760} y={-560} r={700} color={C.lamp} strength={light * 1.4} />}
      {night && <LightPool x={620} y={-760} r={420} color={C.theoryLight} strength={0.6} />}
      <TubArt c={night ? nite : day} night={night} t={t} steam={steam} light={light} herbs={herbs} bather={bather} seed={seed} cid={`${cid}${night ? 'n' : 'd'}`} />
      {night && steam > 0 && <DownSteam t={t} steam={steam} seed={seed} />}
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <clipPath id={`${cid}-L`}>
          <path d={leftClip} />
        </clipPath>
        <clipPath id={`${cid}-R`}>
          <path d={rightClip} />
        </clipPath>
      </defs>
      <g clipPath={sp > 0.001 ? `url(#${cid}-L)` : undefined}>{art(false)}</g>
      {sp > 0.001 && (
        <g>
          <g clipPath={`url(#${cid}-R)`}>{art(true)}</g>
          <path d={`M${edge[0][0]} ${edge[0][1]} ${edgeD}`} fill="none" stroke={C.theoryLight} strokeWidth={4} opacity={0.5} />
        </g>
      )}
    </g>
  );
};
