import React from 'react';
import {World} from '../../../kit/stage';
import {C} from '../../../kit/theme';
import {CamState, clamp01, rand} from '../../../kit/anim';
import {Particles, Pulse} from '../../../kit/fx';
import {Person, PersonProps} from '../../../kit/people';
import {Window, Plant} from '../../../kit/env';
import {DecoderRig, DECODER_HEAD} from './DecoderRig';
import {mix} from './util';

/**
 * NightRoom / NightRig — the decoder participant's room at night, flat-lit (used by C01, C04, C08).
 * One fixed world: DecoderRig at RIG (floor line y=940, s=1.25). Light is flat shapes BEHIND the figure
 * (cool slate pool from the monitor on wall + floor, warm city spill from the window) plus a flat lit side
 * (screen side) and a flat shade side on the person — never a veil over the character.
 */
export const RIG = {x: 1060, y: 940, s: 1.25};
export const rigPt = (lx: number, ly: number) => ({x: RIG.x + lx * RIG.s, y: RIG.y + ly * RIG.s});
export const RIG_HEAD = rigPt(DECODER_HEAD.x, DECODER_HEAD.y); // ≈ (517, 497)
export const RIG_GLASS = {x: -160, y: -526, w: 500, h: 300}; // rig-local monitor glass
export const RIG_SCREEN = rigPt(RIG_GLASS.x + RIG_GLASS.w / 2, RIG_GLASS.y + RIG_GLASS.h / 2); // ≈ (1172, 470)
const WIN = rigPt(-820, -610);
const FL = RIG.y;

/** Night city inside the rig's window (rig-local coords). */
export const NightCity: React.FC<{t: number}> = ({t}) => {
  const bx = [-950, -905, -860, -800, -760, -715];
  const bh = [120, 190, 90, 160, 210, 110];
  return (
    <g>
      {bx.map((x, i) => (
        <g key={i}>
          <rect x={x} y={-440 - bh[i]} width={42} height={bh[i]} fill={C.ink} />
          {[0, 1, 2, 3].map((k) =>
            k * 40 + 24 < bh[i] ? (
              <rect key={k} x={x + 10 + (k % 2) * 14} y={-440 - bh[i] + 16 + k * 40} width={8} height={10} fill={C.lamp} opacity={rand(i * 7 + k) > 0.45 ? 0.8 + 0.15 * Math.sin(t * 0.7 + i + k) : 0.12} />
            ) : null,
          )}
        </g>
      ))}
    </g>
  );
};

/** Foreground shelf silhouette (bottom-left, world coords; use at parallax depth ≈1.35). */
export const NightShelf: React.FC = () => (
  <g fill={C.ink}>
    <rect x={-500} y={860} width={940} height={440} />
    <path d="M300 860 L300 770 L372 770 L372 860 Z" />
    <path d="M372 790 C410 790 410 840 372 842" stroke={C.ink} strokeWidth={12} fill="none" />
    <rect x={40} y={700} width={46} height={160} />
    <rect x={92} y={730} width={38} height={130} />
    <rect x={134} y={712} width={50} height={148} transform="rotate(8 159 860)" />
  </g>
);

/** The room behind the rig: deep night wall, cool monitor pool, warm window spill, window + city + plant. */
export const NightRoom: React.FC<{t: number}> = ({t}) => {
  const wains = FL - 250 * RIG.s;
  return (
    <g>
      <rect x={-2500} y={-1500} width={7000} height={2600} fill={C.night} />
      <rect x={-2500} y={wains} width={7000} height={FL - wains} fill={mix(C.night, C.ink, 0.55)} />
      <rect x={-2500} y={FL} width={7000} height={1600} fill={C.ink} />
      {/* cool monitor light on the wall (two flat steps) and on the floor */}
      <ellipse cx={940} cy={470} rx={780} ry={470} fill={C.slate} opacity={0.3} />
      <ellipse cx={990} cy={440} rx={520} ry={300} fill={C.slate} opacity={0.3} />
      <line x1={-2500} y1={wains} x2={4500} y2={wains} stroke={C.inkLift} strokeWidth={6} />
      <ellipse cx={1000} cy={FL + 40} rx={640} ry={80} fill={C.slate} opacity={0.45} />
      {/* warm city light from the window: glow on the wall + spill on the floor */}
      <ellipse cx={WIN.x} cy={WIN.y} rx={310} ry={350} fill={C.lamp} opacity={0.08} />
      <path d={`M${WIN.x - 190} ${WIN.y + 225} L${WIN.x + 190} ${WIN.y + 225} L${WIN.x + 430} ${FL + 140} L${WIN.x - 70} ${FL + 140} Z`} fill={C.lamp} opacity={0.05} />
      <g transform={`translate(${RIG.x} ${RIG.y}) scale(${RIG.s})`}>
        <Window x={-820} y={-430} w={300} h={360} sky="night" moon t={t} seed={1} frame={C.inkLift} />
        <NightCity t={t} />
        <Plant x={560} y={0} kind="tall" t={t} seed={3} color={C.inkSoft} />
      </g>
    </g>
  );
};

// the seated person exactly as DecoderRig draws it (for flat lit/shade shapes)
const personOf = (t: number, over: Partial<PersonProps>): PersonProps => ({
  x: -330,
  y: 0,
  s: 1,
  t,
  sit: 1,
  facing: 1,
  outfit: 'casual',
  hair: 'short',
  skin: 2,
  expression: 'neutral',
  look: 0.4,
  pose: 'idle',
  arms: {front: [8, 72], back: [4, 66]},
  talk: 0,
  seed: 1,
  ...over,
});

export const NIGHT_PERSON: Partial<PersonProps> = {skin: 3, hair: 'short', hairColor: C.hair[0], expression: 'neutral'};

export type NightRigProps = {
  t: number;
  cam: CamState;
  text?: string;
  typeP?: number;
  signal?: number;
  /** 0→1 pulse ring at the implant */
  glint?: number;
  /** drawn over the monitor glass, in glass coords (0..500 × 0..300) */
  overlay?: React.ReactNode;
  /** world-space extras above the rig */
  extra?: React.ReactNode;
  /** 0..1 darken everything */
  dim?: number;
  /** unique clip id suffix */
  id?: string;
  person?: Partial<PersonProps>;
};

/** Full night scene as a parallax World: room · rig + flat light on the person · dust · foreground shelf. */
export const NightRig: React.FC<NightRigProps> = ({t, cam, text = '', typeP = 0, signal = 0, glint = 0, overlay, extra, dim = 0, id = 'a', person}) => {
  const pOver = {...NIGHT_PERSON, ...person};
  const pp = personOf(t, pOver);
  const ped = rigPt(DECODER_HEAD.x - 14, DECODER_HEAD.y - 70);
  const hx = DECODER_HEAD.x;
  const cid = `nr-${id}`;
  const rigG = (el: React.ReactNode) => <g transform={`translate(${RIG.x} ${RIG.y}) scale(${RIG.s})`}>{el}</g>;
  return (
    <World
      cam={cam}
      layers={[
        {
          depth: 1,
          el: (
            <g>
              <NightRoom t={t} />
              <DecoderRig x={RIG.x} y={RIG.y} s={RIG.s} t={t} layer="front" text={text} typeP={typeP} signal={signal} person={pOver} />
              {rigG(
                <g>
                  <defs>
                    <clipPath id={`${cid}-shade`}>
                      <path d={`M-2000 -270 L${hx - 28} -270 L${hx - 50} -120 L${hx - 120} 300 L-2000 300 Z`} />
                    </clipPath>
                    <clipPath id={`${cid}-lit`}>
                      <path d={`M-2000 -2000 L2000 -2000 L2000 -150 L${hx - 40} -150 L${hx - 28} -270 L-2000 -270 Z`} />
                    </clipPath>
                    <clipPath id={`${cid}-low`}>
                      <rect x={-2000} y={-120} width={4000} height={400} />
                    </clipPath>
                  </defs>
                  {/* far side of the figure in shade, lap/legs below the light, screen side lit */}
                  <g clipPath={`url(#${cid}-shade)`} opacity={0.45}>
                    <Person {...pp} silhouette={C.ink} />
                  </g>
                  <g clipPath={`url(#${cid}-low)`} opacity={0.3}>
                    <Person {...pp} silhouette={C.ink} />
                  </g>
                  <g clipPath={`url(#${cid}-lit)`} opacity={0.14}>
                    <Person {...pp} silhouette={C.paperLight} />
                  </g>
                </g>,
              )}
              {overlay &&
                rigG(
                  <g transform={`translate(${RIG_GLASS.x} ${RIG_GLASS.y})`}>
                    <clipPath id={`${cid}-glass`}>
                      <rect x={0} y={0} width={RIG_GLASS.w} height={RIG_GLASS.h} rx={6} />
                    </clipPath>
                    <g clipPath={`url(#${cid}-glass)`}>{overlay}</g>
                  </g>,
                )}
              {glint > 0 && glint < 1 && <Pulse x={ped.x} y={ped.y} r={46} p={glint} color={C.theoryTint} width={6} />}
              {glint > 0 && glint < 1 && <Pulse x={ped.x} y={ped.y} r={80} p={clamp01(glint * 1.3 - 0.3)} color={C.theoryLight} width={4} />}
              {dim > 0 && <rect x={-2000} y={-1500} width={6000} height={4000} fill={C.ink} opacity={0.55 * dim} />}
              {extra}
            </g>
          ),
        },
        {depth: 1.08, el: <Particles t={t} x={700} y={160} w={900} h={620} n={22} seed={11} size={[2, 4]} color={C.theoryTint} opacity={[0.15, 0.4]} vx={4} vy={-6} />},
        {depth: 1.35, el: <NightShelf />},
      ]}
    />
  );
};
