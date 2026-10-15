// Custom shots for C02 (builder-owned). Each: export const S<n>: React.FC<{t: number}> returning a full <Stage>.
import React from 'react';
import {Stage, World, At, breathe} from '../../../kit/stage';
import {Kicker, Tag} from '../../../kit/text';
import {C} from '../../../kit/theme';
import {camAt, ease, ramp, win, keys, drift, lerp, clamp01} from '../../../kit/anim';
import {Sky, Hills, CitySkyline, Ground, Street, Room, Bathhouse, Bathtub, Cauldron, Bench, Door, Lantern, Banner, Barrel, ENV_FLOOR, Window} from '../../../kit/env';
import {Person, personHands} from '../../../kit/people';
import {makeProjection, GeoMap} from '../../../kit/geo';
import {Steam, LightPool, Particles, DrawPath, GroundShadow, Vignette} from '../../../kit/fx';
import {Icon} from '../../../kit/icons';
import {CrossOut} from '../../../kit/diagrams';
import {Bubble} from '../../../kit/cards';
import {Shots as _unused} from '../../../kit/shots';
import {mix, smooth, frac} from '../shared/util';

void _unused;

const LINEN = '#E9DFC8';
const LINEN2 = '#D9CDB0';

// ---------------------------------------------------------------- local helpers

/** Hanging bathhouse sign (kit Banner with bath emblem) + lantern, swaying. Origin = bracket anchor on the wall. */
const BathSign: React.FC<{x: number; y: number; t: number; s?: number; lit?: number; seed?: number}> = ({x, y, t, s = 1, lit = 1, seed = 0}) => {
  const sw = Math.sin(t * 1.6 + seed) * 3.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* bracket arm */}
      <rect x={-6} y={-8} width={170} height={12} rx={5} fill={C.woodDark} />
      <path d="M0 4 L70 -2 L0 60 Z" fill={C.woodDark} />
      <g transform={`translate(110 4) rotate(${sw})`}>
        <Banner kind="hanging" w={110} h={170} t={t} color={C.oxLight} emblem="none" trim={C.lamp} x={0} y={0} />
        <circle cx={0} cy={86} r={40} fill={LINEN} />
        <Icon name="bath" x={0} y={86} s={0.62} color={C.ink} accent={C.water} knock={LINEN} />
      </g>
      <g transform={`translate(-34 20) rotate(${-sw * 0.7} 0 0)`}>
        <Lantern x={0} y={60} t={t} lit={lit > 0.5} chain={60} glow={lit} />
      </g>
    </g>
  );
};

/** Clothed bather in a linen shift (shoulders-up in a tub). */
const Bather: React.FC<{x: number; y: number; t: number; s?: number; facing?: 1 | -1; seed?: number; talk?: number; hat?: 'coif' | 'none' | 'veil'; hair?: any; skin?: number; expression?: any; arms?: any; prop?: any; sit?: number}> = ({
  x, y, t, s = 0.62, facing = 1, seed = 0, talk = 0, hat = 'none', hair = 'short', skin = 1, expression = 'smile', arms, prop, sit = 1,
}) => (
  <Person x={x} y={y + Math.sin(t * 1.3 + seed) * 2} s={s} facing={facing} t={t} sit={sit} outfit="tunic" top={LINEN} bottom={LINEN2} accent={LINEN2}
    hat={hat} hair={hair} skin={skin} expression={expression} talk={talk} seed={seed} arms={arms} prop={prop} pose={arms ? undefined : 'idle'} />
);

const talkAmt = (t: number, a: number, b: number, k = 9) => (t > a && t < b ? Math.abs(Math.sin(t * k)) : 0);

// ================================================================ S2 · 65.08 · "Picture a medieval European city in the 1300s."
const T2 = {open: 65.08, kicker: 66.9, end: 68.04};
const SkylineWorld: React.FC<{t: number; tone: 'day' | 'dusk'; cam: any; lit?: boolean; lanterns?: boolean}> = ({t, tone, cam, lit, lanterns}) => {
  const dusk = tone === 'dusk';
  const plumes: [number, number][] = [[250, 655], [780, 640], [1075, 690], [1335, 645], [1800, 615]];
  return (
    <World cam={cam} layers={[
      {depth: 0.1, el: <g><Sky variant={tone} t={t} clouds={dusk ? 3 : 4} />{dusk && <g><rect x={-200} y={0} width={2320} height={1080} fill={C.lamp} opacity={0.22} /><rect x={-200} y={0} width={2320} height={1080} fill={C.oxLight} opacity={0.14} /></g>}{!dusk && <rect x={-200} y={0} width={2320} height={1080} fill={C.lamp} opacity={0.2} />}</g>},
      {depth: 0.3, el: <Hills layer="far" tone={tone} />},
      {depth: 0.6, el: (
        <g>
          <CitySkyline era="medieval" layer={dusk ? "mid" : "near"} tone={tone} walls t={t} lit={lit} color={dusk ? undefined : mix(C.stoneDark, C.woodDark, 0.4)} />
          {plumes.map(([px, py], i) => (
            <g key={i}>
              <Steam t={t + i * 1.7} x={px} y={py} w={110 + (i % 2) * 40} h={i === 3 ? 460 : 380} n={6} strength={dusk ? 1.6 : 2.4} seed={i + 3} color={dusk ? mix(C.paperShade, C.oxLight, 0.2) : C.paperLight} />
            </g>
          ))}
        </g>
      )},
      {depth: 1, el: <Ground y={830} tone={tone} kind="earth" />},
    ]} />
  );
};

export const S2: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T2.open, 960, 520, 1.0], [T2.end + 0.5, 1250, 560, 1.7]]), t, 0.6);
  return (
    <Stage bg={C.paperShade}>
      <SkylineWorld t={t} tone="day" cam={cam} />
      <Kicker x={96} y={120} anchor="start" text="EUROPE · 1300s" p={ramp(t, T2.kicker - 0.15, T2.kicker + 0.5, ease.out)} />
      <Vignette strength={0.25} />
    </Stage>
  );
};

// ================================================================ S3 · 68.04 · "You need to wash… wealthy… servants… the bathhouse."
const T3 = {open: 68.04, window: 69.2, pour: 72.4, walk: 73.2, door: 75.5, end: 75.92};

const RichRoom: React.FC<{t: number; p: number}> = ({t, p}) => {
  // small medieval room cut-away, local coords 0..520 x 0..420
  const pour = ramp(t, T3.pour - 0.2, T3.pour + 0.5);
  const fill = ramp(t, T3.pour, T3.pour + 2.2);
  return (
    <g>
      <rect x={0} y={0} width={520} height={420} fill={C.stoneShade} />
      {[0, 1, 2, 3].map((r) => <path key={r} d={`M0 ${70 + r * 70} H520`} stroke={C.stoneDark} strokeWidth={3} opacity={0.35} />)}
      <rect x={0} y={330} width={520} height={90} fill={C.woodLight} />
      <rect x={0} y={330} width={520} height={8} fill={C.wood} />
      <Window x={110} y={270} w={110} h={170} shape="arched" sky="day" t={t} />
      {/* fire + cauldron */}
      <At x={420} y={350}><Cauldron x={0} y={0} w={130} t={t} fire steam /></At>
      {/* tub */}
      <Bathtub x={190} y={385} w={230} t={t} water={mix(C.water, C.paperShade, 0.3)} />
      {/* servant */}
      <Person x={330} y={385} s={0.44} facing={-1} t={t} outfit="peasant" pose="hold" hat="coif" hair="bun" expression="neutral" seed={5} skin={1} />
      {/* pour stream */}
      {pour > 0 && <path d={`M300 255 Q270 270 250 ${300 + 70 * fill}`} stroke={C.waterDeep} strokeWidth={8} strokeLinecap="round" fill="none" opacity={win(t, T3.pour - 0.1, T3.pour + 2.6, 0.2, 0.6)} />}
      <Steam t={t} x={190} y={300} w={120} h={150} n={4} />
      <LightPool x={120} y={300} r={140} strength={0.3} />
    </g>
  );
};

export const S3: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T3.open, 760, 520, 1.12], [T3.window, 740, 520, 1.14], [T3.walk - 0.1, 760, 520, 1.12], [T3.door, 1450, 540, 1.15], [T3.end + 0.6, 1480, 540, 1.17]]), t, 0.5);
  const youX = keys(t, [[T3.open, 860], [T3.walk, 880], [T3.door, 1600]], ease.inOut);
  const walking = ramp(t, T3.walk - 0.2, T3.walk + 0.3) * (1 - ramp(t, T3.door - 0.3, T3.door + 0.2));
  const panelP = ramp(t, T3.window, T3.window + 0.7, ease.outQuint) * (1 - ramp(t, T3.walk - 0.2, T3.walk + 0.6));
  const queue = [{x: 1640, s: 'a'}, {x: 1730, s: 'b'}];
  return (
    <Stage bg={C.paperShade}>
      <World cam={cam} layers={[
        {depth: 1, el: (
          <g>
            <Street era="medieval" tone="day" t={t} seed={3} />
            {/* the bathhouse door + sign + lantern */}
            <Door x={1960} y={ENV_FLOOR} w={190} h={330} style="plank" open={ramp(t, T3.door - 0.3, T3.door + 0.7)} inside={C.lamp} />
            <BathSign x={1760} y={250} t={t} s={1.15} seed={1} />
            <LightPool x={1960} y={800} r={220} strength={0.35} />
            {/* queue */}
            <Person x={1740} y={ENV_FLOOR + 10} s={0.72} facing={1} t={t} outfit="peasant" hat="coif" hair="bun" expression="smile" seed={21} />
            <Person x={1830} y={ENV_FLOOR + 16} s={0.72} facing={1} t={t} outfit="merchant" hair="short" expression="neutral" seed={22} skin={2} />
            <Steam t={t} x={1960} y={480} w={160} h={220} n={4} />
            {/* "you" */}
            <GroundShadow x={youX} y={ENV_FLOOR + 22} w={150} />
            <Person x={youX} y={ENV_FLOOR + 22} s={0.8} facing={1} t={t} outfit="peasant" hair="short" skin={1} expression={t > T3.walk ? 'smile' : 'neutral'}
              walk={walking > 0.01 ? (t - T3.walk) * 1.7 : undefined} pose={walking > 0.01 ? undefined : 'idle'} prop="basket" seed={9} talk={0} />
            {/* rich cut-away window */}
            {panelP > 0.001 && (
              <g opacity={clamp01(panelP * 1.4)} transform={`translate(70 ${180 + (1 - panelP) * 40}) scale(${0.9 + 0.1 * panelP})`}>
                <rect x={-14} y={-14} width={548} height={448} rx={10} fill={C.woodDark} />
                <clipPath id="c02s3win"><rect x={0} y={0} width={520} height={420} rx={4} /></clipPath>
                <g clipPath="url(#c02s3win)"><RichRoom t={t} p={panelP} /></g>
              </g>
            )}
          </g>
        )},
      ]} />
      <Vignette strength={0.2} />
    </Stage>
  );
};

// ================================================================ S4 / S5 · bathhouse world
const T4 = {open: 75.92, cross: 78.2, open2: 79.8, kicker: 81.0, end: 83.66};
const T5 = {open: 83.66, close: 84.5, plank: 85.8, drink: 86.5, clink: 87.0, bubbles: 87.3, end: 88.44};

const BathersLayer: React.FC<{t: number; show: number; close?: number}> = ({t, show, close = 0}) => {
  const bob = (k: number) => Math.sin(t * 1.2 + k) * 2;
  const rightX = (x: number) => x;
  // right tub (x 1470): three bathers; shuffle closer from T5.close
  const sh = ramp(t, T5.close, T5.close + 0.9, ease.out);
  const rA = lerp(1370, 1405, sh);
  const rB = lerp(1470, 1465, sh);
  const rC = lerp(1580, 1540, sh);
  const cupL = ramp(t, T5.drink, T5.clink, ease.out);
  const toast = ramp(t, T5.clink, T5.clink + 0.25, ease.out) * (1 - ramp(t, T5.clink + 0.3, T5.clink + 0.7));
  const armsA = {front: [lerp(30, 98 + toast * 6, cupL), lerp(10, 40, cupL)], back: [8, 10]};
  const armsC = {front: [lerp(30, 98 + toast * 6, cupL), lerp(10, 40, cupL)], back: [8, 10]};
  const baseY = 905;
  const pa = { x: rA, y: baseY - 40, s: 0.6, facing: 1 as const, sit: 1, arms: armsA };
  const pc = { x: rC, y: baseY - 40, s: 0.6, facing: -1 as const, sit: 1, arms: armsC };
  const hA = personHands({x: pa.x, y: pa.y + bob(0), s: pa.s, facing: pa.facing, sit: 1, arms: armsA, t, outfit: 'tunic', pose: undefined} as any);
  const hC = personHands({x: pc.x, y: pc.y + bob(2), s: pc.s, facing: pc.facing, sit: 1, arms: armsC, t, outfit: 'tunic', pose: undefined} as any);
  const showCups = cupL > 0.02;
  const tt = (a: number, b: number) => ramp(t, a, b, ease.outBack);
  const bubbleP = (a: number) => ramp(t, a, a + 0.5, ease.outBack);
  return (
    <g opacity={show}>
      {/* left tub, two bathers */}
      <Bathtub x={460} y={905} w={420} t={t} part="back" />
      <Bather x={400} y={865} t={t} seed={1} hair="bun" hat="coif" skin={1} s={0.6} talk={talkAmt(t, 81, 83.6)} />
      <Bather x={530} y={865} t={t} seed={2} facing={-1} hair="short" skin={2} s={0.6} />
      <Bathtub x={460} y={905} w={420} t={t} part="front" />
      {/* right tub, shared */}
      <Bathtub x={1470} y={905} w={460} t={t} part="back" />
      <Bather x={pa.x} y={baseY - 40} t={t} seed={3} s={0.6} hair="short" skin={2} arms={armsA} talk={talkAmt(t, 86.5, 88.4)} />
      <Bather x={rB} y={baseY - 38} t={t} seed={4} s={0.58} hair="bun" hat="coif" skin={1} facing={-1} />
      <Bather x={pc.x} y={baseY - 40} t={t} seed={5} s={0.6} facing={-1} hair="curly" skin={3} arms={armsC} talk={talkAmt(t, 87.2, 88.4, 8)} />
      {showCups && [hA.front, hC.front].map((h, i) => (
        <g key={i} transform={`translate(${h.x} ${h.y})`}>
          <path d="M-20 -32 H20 L16 20 H-16 Z" fill={C.metal} />
          <rect x={-20} y={-32} width={40} height={9} fill={C.paperLight} opacity={0.6} />
        </g>
      ))}
      {toast > 0.05 && (
        <g transform={`translate(${(hA.front.x + hC.front.x) / 2} ${(hA.front.y + hC.front.y) / 2 - 40})`} stroke={C.lamp} strokeWidth={5} strokeLinecap="round">
          <path d="M-8 -14 l-12 -14 M0 -20 v-20 M8 -14 l12 -14" opacity={toast} />
        </g>
      )}
      {/* conversation bubbles */}
      {t > T5.bubbles - 0.1 && (
        <g>
          <Bubble x={1335} y={590} w={150} h={104} to={{x: 1385, y: 672}} p={bubbleP(T5.bubbles)} kind="speech" />
          <Icon name="sun" x={1335} y={590} s={0.7} color={C.ink} accent={C.lamp} p={bubbleP(T5.bubbles + 0.2)} />
          <Bubble x={1665} y={572} w={150} h={104} to={{x: 1555, y: 660}} p={bubbleP(T5.bubbles + 0.35)} kind="speech" />
          <Icon name="heart" x={1665} y={572} s={0.7} color={C.ink} accent={C.oxblood} p={bubbleP(T5.bubbles + 0.55)} />
        </g>
      )}
    </g>
  );
};


const FoodPlank: React.FC<{t: number}> = ({t}) => {
  const k = ramp(t, T5.plank - 0.2, T5.plank + 0.45, ease.outBack);
  if (t < T5.plank - 0.3) return null;
  return (
    <g transform={`translate(0 ${-(1 - k) * 70})`} opacity={clamp01((t - (T5.plank - 0.3)) * 6)}>
      <rect x={1290} y={738} width={360} height={14} rx={4} fill={C.woodLight} />
      <rect x={1290} y={746} width={360} height={6} fill={C.wood} />
      <ellipse cx={1390} cy={726} rx={38} ry={16} fill={C.fire} />
      <path d="M1366 724 q24 -9 48 0" stroke={C.woodDark} strokeWidth={3} fill="none" strokeLinecap="round" />
      <ellipse cx={1446} cy={730} rx={22} ry={11} fill={mix(C.fire, C.lamp, 0.4)} />
      <circle cx={1510} cy={724} r={14} fill={C.oxLight} />
      <circle cx={1538} cy={728} r={12} fill={C.evidence} />
      <circle cx={1526} cy={714} r={12} fill={C.lamp} />
    </g>
  );
};

const BathhouseWorld: React.FC<{t: number; cam: any; showBathers: number}> = ({t, cam, showBathers}) => (
  <World cam={cam} layers={[
    {depth: 1, el: (
      <g>
        <Bathhouse t={t} layer="back" seed={2} />
        {/* bench people */}
        <Bench x={960} y={900} w={420} />
        <g opacity={showBathers}>
          <Person x={880} y={885} s={0.5} sit={1} t={t} outfit="tunic" top={LINEN} bottom={LINEN2} accent={LINEN2} hat="coif" hair="bun" skin={1} expression="smile" seed={7} />
          <Person x={1040} y={885} s={0.5} facing={-1} sit={1} t={t} outfit="tunic" top={LINEN} bottom={LINEN2} accent={LINEN2} hair="short" skin={2} expression="happy" seed={8} talk={talkAmt(t, 80.5, 83.4)} />
        </g>
        <BathersLayer t={t} show={showBathers} />
        <Bathhouse t={t} layer="front" seed={2} />
        <FoodPlank t={t} />
      </g>
    )},
  ]} />
);

const Gloomy: React.FC<{t: number}> = ({t}) => (
  <g>
    <Room era="medieval" t={t} window="none" door={false} light={false} night />
    <rect x={-400} y={-100} width={2720} height={1300} fill={C.ink} opacity={0.5} />
    <Bathtub x={640} y={900} w={400} t={t} water={mix(C.slate, C.ink, 0.5)} color={mix(C.woodDark, C.ink, 0.35)} />
    {/* drip */}
    {(() => {
      const ph = frac((t - T4.open) / 1.1);
      const dy = 380 + ph * ph * 330;
      return (
        <g>
          <path d={`M640 ${dy - 18} q10 18 0 22 q-10 -4 0 -22 Z`} fill={C.waterDeep} opacity={ph < 0.97 ? 1 : 0} />
          <ellipse cx={960} cy={818} rx={10 + ph * 40} ry={3 + ph * 8} fill="none" stroke={C.slate} strokeWidth={3} opacity={ph > 0.8 ? 0 : 0} />
        </g>
      );
    })()}
  </g>
);

export const S4: React.FC<{t: number}> = ({t}) => {
  const open = ramp(t, T4.open2, T4.open2 + 1.1, ease.inOut);
  const cam = breathe(camAt(t, [[T4.open, 960, 540, 1.05], [T4.open2, 960, 540, 1.0], [T4.end + 0.4, 1050, 560, 1.1]]), t, 0.5);
  const show = ramp(t, T4.open2 + 0.1, T4.open2 + 0.8);
  const crossP = ramp(t, T4.cross, T4.cross + 0.7);
  return (
    <Stage bg={C.ink}>
      <BathhouseWorld t={t} cam={cam} showBathers={show} />
      {/* gloomy room splits and slides away */}
      {open < 1 && (
        <g>
          <clipPath id="c02s4L"><rect x={-100} y={0} width={1060} height={1080} /></clipPath>
          <clipPath id="c02s4R"><rect x={960} y={0} width={1060} height={1080} /></clipPath>
          <g transform={`translate(${-open * 1100} 0)`}><g clipPath="url(#c02s4L)"><Gloomy t={t} /><CrossOut x={640} y={770} size={300} p={crossP} color={C.caution} width={20} /></g></g>
          <g transform={`translate(${open * 1100} 0)`}><g clipPath="url(#c02s4R)"><Gloomy t={t} /><CrossOut x={640} y={770} size={300} p={crossP} color={C.caution} width={20} /></g></g>
        </g>
      )}
      <Kicker x={960} y={120} text="A PUBLIC SQUARE — WITH WATER" p={ramp(t, T4.kicker - 0.1, T4.kicker + 0.6, ease.out)} />
    </Stage>
  );
};

export const S5: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T5.open, 1050, 560, 1.1], [T5.open + 1.0, 1380, 700, 1.55], [T5.end + 0.5, 1470, 720, 1.75]]), t, 0.5);
  return (
    <Stage bg={C.ink}>
      <BathhouseWorld t={t} cam={cam} showBathers={1} />
      <Kicker x={960} y={120} text="A PUBLIC SQUARE — WITH WATER" p={win(t, T5.open - 0.4, T5.open + 0.6, 0.01, 0.6)} />
    </Stage>
  );
};

// ================================================================ S8 · 102.26 · soap
const T8 = {open: 102.26, land: 102.5, fat: 105.3, ash: 106.2, firm: 107.2, herbs: 108.0, out: 108.8, tag: 110.5, end: 111.72};

const Bar: React.FC<{x: number; y: number; s?: number; w?: number; firm?: number; o?: number; rot?: number}> = ({x, y, s = 1, w = 360, firm = 1, o = 1, rot = 0}) => {
  const h = w * 0.34;
  const d = w * 0.12; // top-face depth
  const olive = mix(mix(C.caution, C.lamp, 0.35), C.ink, 0.22);
  const side = mix(mix(olive, C.woodLight, 0.25), olive, firm);
  const front = mix(side, C.ink, 0.12);
  const top = mix(mix(side, C.lamp, 0.35), C.paperLight, 0.3);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} strokeLinejoin="round" stroke={C.ink} strokeWidth={4}>
      <path d={`M${-w / 2} 0 L${-w / 2 + 6} ${-h} L${w / 2 - 6} ${-h} L${w / 2} 0 Z`} fill={front} />
      <path d={`M${-w / 2 + 6} ${-h} L${-w / 2 + 6 + d * 0.8} ${-h - d} L${w / 2 - 6 + d * 0.3} ${-h - d} L${w / 2 - 6} ${-h} Z`} fill={top} />
      <path d={`M${-w / 2 + w * 0.12} ${-h * 0.62} H${-w / 2 + w * 0.4}`} stroke={C.paperLight} strokeWidth={w * 0.02} strokeLinecap="round" opacity={0.55} />
      <path d={`M${-w / 2 + w * 0.14} ${-h - d * 0.55} H${-w / 2 + w * 0.34} M${w * 0.1} ${-h * 0.3} H${w * 0.3}`} stroke={C.paperLight} strokeWidth={w * 0.018} strokeLinecap="round" opacity={0.6} />
    </g>
  );
};

const Sprig: React.FC<{x: number; y: number; r?: number; p: number}> = ({x, y, r = 0, p}) => (
  <g transform={`translate(${x} ${y - (1 - p) * 40}) rotate(${r})`} opacity={clamp01(p * 3)}>
    <path d="M0 0 L0 -50" stroke={C.evidence} strokeWidth={4} strokeLinecap="round" />
    {[-30, -16, -4].map((yy, i) => (
      <g key={i}>
        <ellipse cx={-10} cy={yy} rx={10} ry={5} transform={`rotate(-35 -10 ${yy})`} fill={C.evidence} />
        <ellipse cx={10} cy={yy - 6} rx={10} ry={5} transform={`rotate(35 10 ${yy - 6})`} fill={mix(C.evidence, C.paperLight, 0.25)} />
      </g>
    ))}
  </g>
);

const EUROPE = "M520 560 L560 500 L640 490 L690 420 L760 360 L800 320 L860 300 L930 340 L1000 400 L1080 360 L1180 380 L1300 340 L1440 330 L1580 380 L1630 470 L1590 570 L1500 640 L1400 690 L1320 760 L1250 720 L1160 700 L1090 650 L1000 620 L930 610 L880 650 L840 640 L780 700 L690 700 L610 660 Z";
const ITALY = "M1010 650 L1090 700 L1150 780 L1220 850 L1190 900 L1120 860 L1060 790 L1010 720 Z";
const ISLAND = "M440 330 L500 300 L530 360 L500 440 L450 430 Z";
const IBERIA = "M600 680 L780 690 L800 770 L720 830 L620 810 L560 750 Z";
const SCAND = "M880 300 L960 210 L1060 170 L1160 200 L1100 270 L1020 300 L960 360 Z";

const qpt = (a: [number, number], c: [number, number], b: [number, number], k: number): [number, number] => {
  const u = 1 - k;
  return [u * u * a[0] + 2 * u * k * c[0] + k * k * b[0], u * u * a[1] + 2 * u * k * c[1] + k * k * b[1]];
};

export const S8: React.FC<{t: number}> = ({t}) => {
  const out = ramp(t, T8.out - 0.1, T8.out + 1.0, ease.inOut);
  const land = ramp(t, T8.land - 0.25, T8.land + 0.2, ease.in);
  const bounce = t > T8.land ? Math.max(0, Math.sin((t - T8.land) * 18)) * 8 * Math.exp(-(t - T8.land) * 6) : 0;
  const barY = keys(t, [[T8.land - 0.35, 380], [T8.land, 800]], ease.in) - bounce;
  const fatP = ramp(t, T8.fat - 0.2, T8.fat + 0.7, ease.out);
  const ashP = ramp(t, T8.ash - 0.2, T8.ash + 0.7, ease.out);
  const pourF = win(t, T8.fat + 0.4, T8.fat + 1.8, 0.1, 0.4);
  const pourA = win(t, T8.ash + 0.4, T8.ash + 1.5, 0.1, 0.4);
  const firm = ramp(t, T8.firm - 0.3, T8.firm + 0.7);
  const herbP = [0, 1, 2].map((i) => ramp(t, T8.herbs - 0.1 + i * 0.14, T8.herbs + 0.25 + i * 0.14, ease.outBack));
  // scene transform: whole bench scene shrinks toward Western Europe point on the map
  const sc = lerp(1, 0.09, ease.inOut(out));
  const ox = lerp(0, 0, out);
  const geo = makeProjection("europe", 1520, 820, {x: 200, y: 130});
  const [barMapX, barMapY] = geo(2.35, 48.86);
  const mapP = ramp(t, T8.out + 0.2, T8.out + 1.0, ease.out);
  const dests: [number, number][] = [geo(-0.12, 51.5), geo(18.07, 59.33), geo(12.5, 41.9), geo(30.5, 50.45)];
  const ctr: [number, number][] = dests.map((d, i) => [(barMapX + d[0]) / 2 + [-20, 60, -70, 20][i], (barMapY + d[1]) / 2 - [50, 40, 10, 70][i]] as [number, number]);
  return (
    <Stage bg={C.paperShade}>
      {/* bench scene */}
      <g opacity={1 - ease.in(clamp01(out * 1.3 - 0.1))} transform={`translate(${lerp(0, barMapX, out)} ${lerp(0, barMapY, out)}) scale(${sc}) translate(${-800 * out} ${-800 * out})`}>
        <rect x={-300} y={0} width={2520} height={1080} fill={mix(C.woodDark, C.ink, 0.45)} />
        <rect x={-300} y={820} width={2520} height={300} fill={mix(C.wood, C.woodDark, 0.4)} />
        <rect x={-300} y={820} width={2520} height={14} fill={C.woodDark} />
        {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${-200 + i * 560} 900 h360`} stroke={C.woodDark} strokeWidth={4} opacity={0.35} strokeLinecap="round" />)}
        {/* back wall lamp light */}
        <LightPool x={960} y={500} r={520} strength={0.18} />
        <Cauldron x={1420} y={810} w={260} t={t} fire steam liquid={mix(C.bone, C.stone, 0.4)} />
        <GroundShadow x={1420} y={832} w={320} /><GroundShadow x={800} y={850} w={600} />
        {/* fat crock (left) */}
        {fatP > 0 && (
          <g transform={`translate(${lerp(-200, 1230, fatP)} ${540 - pourF * 10}) rotate(${pourF * 38})`}>
            <path d="M-80 0 Q-100 -120 -60 -150 H60 Q100 -120 80 0 Z" fill={C.woodDark} />
            <ellipse cx={0} cy={-150} rx={60} ry={16} fill={C.bone} />
            <rect x={-72} y={-100} width={144} height={8} fill={C.wood} />
          </g>
        )}
        {/* ash heap (right) */}
        {ashP > 0 && (
          <g transform={`translate(${lerp(2300, 1760, ashP)} 800) rotate(${-pourA * 30} 0 0)`}>
            <path d="M-150 0 Q-100 -40 -50 -100 Q0 -150 50 -100 Q100 -40 150 0 Z" fill={C.stoneShade} />
            <path d="M-20 0 Q30 -60 50 -100 Q100 -40 150 0 Z" fill={C.stoneDark} opacity={0.55} />
            <path d="M-40 -30 l14 -10 M30 -55 l16 -6" stroke={C.stone} strokeWidth={5} strokeLinecap="round" />
          </g>
        )}
        {/* pour streams */}
        {pourF > 0.02 && <path d={`M1290 470 Q1380 480 1410 640`} stroke={C.bone} strokeWidth={10} strokeLinecap="round" fill="none" strokeDasharray="22 14" strokeDashoffset={-t * 90} opacity={pourF} />}
        {pourA > 0.02 && <path d={`M1700 700 Q1590 580 1500 660`} stroke={C.stoneShade} strokeWidth={10} strokeLinecap="round" fill="none" strokeDasharray="14 14" strokeDashoffset={t * 80} opacity={pourA} />}
        {firm > 0.02 && firm < 1 && <path d="M1320 700 Q1150 600 1000 740" stroke={C.bone} strokeWidth={8} strokeLinecap="round" fill="none" strokeDasharray="18 14" strokeDashoffset={-t * 80} opacity={0.8} />}
        {/* the bar */}
        <Bar x={800} y={barY} w={540} firm={firm} o={land} />
        {herbP.map((p, i) => p > 0 && <Sprig key={i} x={680 + i * 120} y={600 + (i % 2) * 6} r={[-20, 8, 24][i]} p={p} />)}
        <Particles t={t} x={700} y={500} w={520} h={260} n={14} seed={4} size={[3, 6]} color={C.lamp} opacity={[0.2, 0.4]} vy={-12} />
      </g>
      {/* map */}
      {mapP > 0 && (
        <g opacity={mapP}>
          <GeoMap x={200} y={130} w={1520} h={820} region="europe" borders={false} p={1} />
          {dests.map((d, i) => {
            const st = T8.out + 0.7 + i * 0.28;
            const dp = ramp(t, st, st + 1.3, ease.inOut);
            const c = ctr[i];
            const a: [number, number] = [barMapX, barMapY];
            const pos = qpt(a, c, d, dp);
            return (
              <g key={i}>
                <path d={`M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${d[0]} ${d[1]}`} stroke={C.oxblood} strokeWidth={4} fill="none" strokeDasharray="4 14" strokeLinecap="round" opacity={ramp(t, st - 0.1, st + 0.4)} />
                <circle cx={d[0]} cy={d[1]} r={9} fill={C.ink} opacity={dp > 0.95 ? 1 : 0} />
                {dp > 0 && dp < 1.001 && <Bar x={pos[0]} y={pos[1] + 10} w={60} firm={1} o={clamp01(dp * 6)} />}
                {dp > 0.99 && <Bar x={d[0]} y={d[1] - 10} w={46} firm={1} />}
              </g>
            );
          })}
          <Bar x={barMapX} y={barMapY + 10} w={74} firm={1} />
          <circle cx={barMapX} cy={barMapY + 12} r={28 + (Math.sin(t * 3) + 1) * 4} fill="none" stroke={C.oxblood} strokeWidth={3} opacity={0.5} />
        </g>
      )}
      <Tag x={96} y={1000} anchor="left" text="Since at least the ninth century" kind="evidence" p={ramp(t, T8.tag - 0.1, T8.tag + 0.6, ease.out)} />
    </Stage>
  );
};

// ================================================================ S9 · 111.72 · dusk town
const T9 = {open: 111.72, kicker: 114.6, end: 116.09};
export const S9: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T9.open, 1000, 540, 1.28], [T9.end + 0.5, 960, 540, 1.0]]), t, 0.4);
  const doors = [300, 640, 1020, 1380, 1730];
  return (
    <Stage bg={C.dusk}>
      <SkylineWorld t={t} tone="dusk" cam={cam} lit />
      <World cam={cam} layers={[
        {depth: 1.05, el: (
          <g>
            <rect x={-400} y={830} width={2720} height={400} fill={mix(C.woodDark, C.ink, 0.4)} />
            {doors.map((dx, i) => (
              <g key={i}>
                <rect x={dx - 90} y={640} width={180} height={190} fill={mix(C.stoneShade, C.ink, 0.45)} />
                <Door x={dx} y={830} w={90} h={150} style="plank" open={0.6} inside={C.lamp} />
                <LightPool x={dx} y={830} r={150} strength={0.45} />
                <BathSign x={dx + 60} y={650} t={t} s={0.45} seed={i * 1.3} />
                <Steam t={t + i} x={dx} y={620} w={90} h={170} n={3} strength={0.8} color={mix(C.paperShade, C.oxLight, 0.2)} />
              </g>
            ))}
            {/* tiny figures heading in */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const tx = doors[i % 5];
              const sx = tx - 260 - i * 20;
              const x = lerp(sx, tx - 20, ramp(t, T9.open + i * 0.35, T9.end + 0.6 + i * 0.1, ease.inOut));
              return <Person key={i} x={x} y={846 + (i % 2) * 8} s={0.26} t={t} walk={t * 1.3 + i} outfit={i % 2 ? 'peasant' : 'merchant'} hat={i % 3 === 0 ? 'coif' : 'none'} seed={40 + i} />;
            })}
          </g>
        )},
      ]} />
      <Particles t={t} x={0} y={300} w={1920} h={600} n={26} seed={9} size={[3, 5]} color={C.lamp} opacity={[0.3, 0.7]} vy={-8} twinkle />
      <Kicker x={960} y={130} size={30} text="A NORMAL PART OF LIFE" color={C.paperShade} p={ramp(t, T9.kicker - 0.1, T9.kicker + 0.6, ease.out)} />
      <Vignette strength={0.3} />
    </Stage>
  );
};
