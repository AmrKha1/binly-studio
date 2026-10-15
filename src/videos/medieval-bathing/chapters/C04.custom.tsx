// Custom shots for C04 (builder-owned). Each: export const S<n>: React.FC<{t: number}> returning a full <Stage>.
// C04 · 192.45–300.90 · "1348: the king's report" — the CLIMAX (reveal S14 274.9, key image S15).
import React from 'react';
import {Stage, Cam, breathe, uid} from '../../../kit/stage';
import {C} from '../../../kit/theme';
import {camAt, ease, keys, lerp, noise1, ramp, clamp01} from '../../../kit/anim';
import {Headline, Kicker, Tag, Underline, Highlight} from '../../../kit/text';
import {Card, OpenBook} from '../../../kit/cards';
import {Node, Arrow, QuestionMark} from '../../../kit/diagrams';
import {Particles, Steam, Vignette, LightPool} from '../../../kit/fx';
import {Person, Crowd} from '../../../kit/people';
import {Street, Study, Room, Table, Candle, Lantern, Bench} from '../../../kit/env';
import {Icon} from '../../../kit/icons';
import {PoreSkin, Miasma, HeroTub, HumorWheel} from '../shared';
import {mix, smooth, P2} from '../shared/util';

const T = {
  open: 192.45, // "Because in 1348…"
  y1348: 193.2, // "1348"
  collide: 196.12, // "collide"
  scale: 198.82, // "on that scale"
  phys: 210.44, // "And physicians were trying to explain it"
  turn: 212.4, // page turn
  street: 213.42, // "One explanation that became influential"
  creep: 214.5,
  miasma: 215.46, // "miasma"
  poisoned: 217.74, // "poisoned air"
  stupid: 220.38, // "This wasn't a stupid idea"
  clustered: 221.74, // "Sickness clustered"
  observe: 224.56, // "Given what physicians could observe"
  airItself: 227.68, // "the air itself"
  two: 228.4, // "Now put the two ideas next to each other"
  pores: 230.6, // "A hot bath opens the pores"
  corrupt: 232.34, // "Corrupted air is dangerous"
  combine: 234.02, // "What happens if you combine them?"
  combineW: 235.16, // "combine"
  report: 243.4, // "…official report on the pestilence"
  causes: 245.5,
  whatToDo: 247.8, // "what people should do"
  exists: 248.98, // "That report still exists"
  outbreak: 252.24, // "during the outbreak itself"
  inside: 253.38, // "Inside it, alongside advice about"
  diet: 255.36, // "diet"
  sleep: 256.14, // "sleep"
  emotional: 256.88, // "emotional state"
  bathing: 258.82, // "exercise and bathing"
  warned: 260.32, // "The faculty warned that bathing…"
  vuln: 263.12, // "vulnerability"
  notWater: 264.72, // "Not because water itself was evil"
  water: 265.1, // "water itself"
  hotBath: 267.4, // "but because a hot bath"
  openBody: 267.78, // "opened the body"
  openBody2: 269.7, // "an open body"
  air: 270.3, // "in air they believed"
  corrupted: 271.38, // "already corrupted"
  defenses: 273.06, // "defenses down"
  reveal: 273.94, // "This is where the contradiction disappears"
  contra: 274.98, // "contradiction"
  same: 276.64, // "The same mechanism"
  thera: 278.22, // "therapeutic"
  diffSet: 282.48, // "different set of circumstances"
  danger: 285.3, // "dangerous"
  other: 291.33, // "Other plague writings"
  warm: 294.92, // "warm water opened the pores"
  enter: 297.52, // "could enter more easily"
  avoid: 300.58, // "something to avoid"
  end: 300.9,
};

const out = ease.outQuint;
/** decaying shake offset */
const kick = (t: number, t0: number, a: number, seed: number) => (t < t0 ? 0 : a * Math.exp(-(t - t0) * 5) * noise1(t * 38, seed));
const DEEP = mix(C.ink, '#000000', 0.6); // deepest ink (shade of the ink family)

// ───────────────────────── S1 · 192.45 · "in 1348 … collide … on that scale"
const waveD = (front: number, top: number, t: number, seed: number, phase: number): string => {
  const n = 9;
  const edge: P2[] = [];
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    const y = lerp(1180, top, u);
    const x = front + 46 * Math.sin(k * 1.25 + t * 2.1 + phase) + 34 * noise1(k * 0.8 + t * 0.7, seed) - u * u * 150;
    edge.push([x, y]);
  }
  const topPts: P2[] = [];
  for (let k = 1; k <= 6; k++) {
    const x = lerp(edge[n][0], 2500, k / 6);
    topPts.push([x, top + 40 * Math.sin(k * 1.7 + t * 1.3 + phase) + 30 + k * 6]);
  }
  const d = smooth([...edge, ...topPts]);
  return `${d} L2600 1200 L${edge[0][0]} 1200 Z`;
};

export const S1: React.FC<{t: number}> = ({t}) => {
  const slam = ramp(t, T.y1348 - 0.12, T.y1348 + 0.22, out);
  const numS = lerp(1.7, 1, slam) * lerp(1, 0.62, ramp(t, T.collide - 0.1, T.collide + 0.9));
  const numX = lerp(600, 470, ramp(t, T.collide - 0.1, T.collide + 0.9));
  const numY = lerp(600, 380, ramp(t, T.collide - 0.1, T.collide + 0.9));
  const numO = clamp01(slam * 3) * lerp(1, 0.55, ramp(t, T.scale, T.scale + 0.6));
  const sx = kick(t, T.y1348 + 0.1, 22, 3) + kick(t, T.collide, 8, 5) + kick(t, T.scale, 16, 7) + noise1(t * 20, 9) * 3 * ramp(t, T.collide, T.collide + 0.5);
  const sy = kick(t, T.y1348 + 0.1, 14, 4) + kick(t, T.scale, 10, 8);
  // the little open-pore card from the left
  const cardIn = ramp(t, T.collide - 0.15, T.collide + 1.0, out);
  const cardX = lerp(-320, 600, cardIn) - 90 * ramp(t, T.scale - 0.1, T.scale + 0.7, out);
  const cardS = lerp(1, 0.72, ramp(t, T.scale - 0.1, T.scale + 0.7, out));
  // the dark wave from the right
  const front = keys(t, [[T.collide - 0.2, 2250], [T.collide + 1.4, 1380], [T.scale - 0.15, 1300], [T.scale + 0.5, 760]], ease.out);
  const top = keys(t, [[T.collide - 0.2, 760], [T.collide + 1.4, 520], [T.scale - 0.15, 470], [T.scale + 0.5, 40]], ease.out);
  return (
    <Stage bg={C.ink}>
      <g transform={`translate(${sx} ${sy})`}>
        <Particles t={t} x={0} y={0} w={1920} h={1080} n={26} seed={4} size={[3, 6]} color={C.inkLift} opacity={[0.4, 0.9]} vx={-12} vy={-6} />
        {/* 1348 */}
        {slam > 0 && (
          <g transform={`translate(${numX} ${numY}) scale(${numS})`} opacity={numO}>
            <text x={0} y={0} textAnchor="middle" fontFamily='"Fraunces", Georgia, serif' fontWeight={700} fontSize={300} fill={C.oxblood}>
              1348
            </text>
          </g>
        )}
        {/* wave */}
        {front < 2240 && (
          <g>
            <path d={waveD(front + 170, top - 90, t, 11, 1.4)} fill={mix(C.night, C.theory, 0.3)} />
            <path d={waveD(front, top, t, 12, 0)} fill={DEEP} stroke={C.theory} strokeWidth={10} strokeLinejoin="round" />
            <path d={waveD(front + 34, top + 30, t, 12, 0)} fill="none" stroke={C.theoryLight} strokeWidth={3} opacity={0.35} />
            <Miasma x={front - 260} y={Math.max(80, top - 120)} w={700} h={1000 - Math.max(80, top - 120)} density={0.7} from="right" vx={-60} dark opacity={0.8} t={t} seed={13} />
          </g>
        )}
        {/* the open body card */}
        {cardIn > 0 && (
          <g transform={`translate(${cardX} 700) scale(${cardS})`}>
            <Card x={0} y={0} w={400} h={250} p={1} fill={C.paperLight}>
              <PoreSkin x={200} y={140} s={0.25} w={1400} pores={7} open={1} heat={1} t={t} seed={2} />
            </Card>
          </g>
        )}
      </g>
      <Vignette strength={0.5} />
    </Stage>
  );
};

// ───────────────────────── S4 · 210.44 · "And physicians were trying to explain it…"
export const S4: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.phys - 0.5, 940, 500, 1.18], [T.street + 0.6, 900, 470, 1.32]]), t);
  const q = ramp(t, T.turn - 0.15, T.turn + 0.55);
  const bx = 760;
  const by = 640;
  const pw = 112 * Math.cos(Math.PI * q);
  const lift = 14 * Math.sin(Math.PI * q);
  return (
    <Stage bg={C.ink}>
      <Cam cam={cam}>
        <Study t={t} layer="back" lamp={false} seed={4} />
        <Person x={1000} y={820} s={1} t={t} facing={-1} outfit="robe" hat="beret" hatColor={C.inkSoft} beard="full" age="elder" pose="think" expression="thinking" seed={41} />
        <Study t={t} layer="front" lamp={false} seed={4} />
        <Candle x={530} y={690} h={80} t={t} />
        <OpenBook x={bx} y={by} s={0.38} />
        {q > 0 && q < 1 && (
          <path
            d={`M${bx} ${by - 66} L${bx + pw} ${by - 66 - lift} L${bx + pw} ${by + 58 - lift} L${bx} ${by + 58} Z`}
            fill={q < 0.5 ? C.paperLight : C.paperShade}
            stroke={C.paperDark}
            strokeWidth={2}
          />
        )}
        {/* humor sheet */}
        <g transform="translate(1210 640) rotate(-6)">
          <rect x={-110} y={-70} width={220} height={140} fill={C.paperLight} stroke={C.paperDark} strokeWidth={2} />
          <HumorWheel x={0} y={0} s={0.17} t={t} />
        </g>
        {/* flask */}
        <g transform="translate(1410 688)">
          <rect x={-10} y={-104} width={20} height={44} fill={C.paperShade} opacity={0.5} />
          <circle cx={0} cy={-36} r={38} fill={C.water} opacity={0.75} />
          <circle cx={0} cy={-36} r={38} fill="none" stroke={C.paperShade} strokeWidth={4} />
          <ellipse cx={-14} cy={-48} rx={7} ry={12} fill={C.paperLight} opacity={0.6} />
        </g>
      </Cam>
      <Vignette strength={0.6} />
    </Stage>
  );
};

// ───────────────────────── S5 + S6 · 213.42–228.40 · one night street, camera tracks right into the alley
const Stink: React.FC<{x: number; y: number; t: number; i: number; o: number}> = ({x, y, t, i, o}) => {
  const ph = t * 2.2 + i * 1.7;
  const pts: P2[] = Array.from({length: 6}, (_, k) => [x + 16 * Math.sin(ph + k * 1.4), y - k * 34 - ((t * 30 + i * 40) % 40)]);
  return <path d={smooth(pts)} fill="none" stroke={C.theoryLight} strokeWidth={5} strokeLinecap="round" opacity={o * 0.75} />;
};

const StreetShot: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(
    camAt(t, [
      [T.street - 0.6, 800, 560, 1.12],
      [T.stupid, 900, 560, 1.12],
      [T.clustered - 0.4, 900, 560, 1.12],
      [T.clustered + 1.2, 1330, 600, 1.3],
      [T.airItself - 0.3, 1290, 610, 1.32],
      [T.airItself + 0.9, 1300, 330, 1.45],
    ]),
    t,
  );
  const alley = ramp(t, T.clustered - 0.6, T.clustered + 0.8);
  const dx = keys(t, [[T.observe - 0.5, 840], [T.observe + 0.7, 1030]], ease.out);
  const walking = t > T.observe - 0.5 && t < T.observe + 0.7;
  const tx = 150;
  return (
    <Stage bg={C.night}>
      <Cam cam={cam}>
        <Street era="medieval" tone="night" t={t} seed={7} />
        <Miasma x={700} y={-160} w={1500} h={560} density={lerp(0.35, 0.9, ramp(t, T.airItself - 1, T.airItself + 0.8))} from="bottom" vx={20} dark p={ramp(t, T.creep, T.creep + 4)} t={t} seed={21} />
        {/* gutter */}
        <rect x={-300} y={952} width={2600} height={24} fill={DEEP} />
        <rect x={-300} y={958} width={2600} height={4} fill={C.theoryLight} opacity={0.18} />
        {/* the alley's sick, clustered where the air is thickest */}
        <Crowd x={1560} y={850} w={520} n={6} rows={1} s={0.42} t={t} seed={8} era="medieval" expression="worried" facing="mixed" />
        <Bench x={1240} y={930} s={0.6} color={C.stoneDark} />
        <Person x={1290} y={930} s={0.62} t={t} sit={1} outfit="peasant" hat="coif" expression="worried" pose="worried" seed={51} />
        <Person x={1530} y={960} s={0.62} t={t} lie={1} facing={-1} outfit="peasant" expression="sad" seed={52} />
        <Bench x={1760} y={930} s={0.6} color={C.stoneDark} />
        <Person x={1710} y={930} s={0.62} t={t} sit={1} facing={-1} outfit="dress" hair="bun" age="elder" expression="sad" seed={53} />
        <Person x={1880} y={940} s={0.64} t={t} facing={-1} outfit="peasant" pose="worried" expression="worried" seed={54} />
        {[1150, 1330, 1450, 1640, 1820].map((x, i) => (
          <Stink key={i} x={x} y={950} t={t} i={i} o={alley} />
        ))}
        <Miasma x={1080} y={430} w={980} h={560} density={1} from="right" vx={-18} dark p={ramp(t, T.creep + 0.5, T.clustered + 0.6)} t={t} seed={22} />
        <Miasma x={-200} y={640} w={2400} h={360} density={0.7} from="bottom" vx={34} dark p={ramp(t, T.creep, T.creep + 3.2)} t={t} seed={23} />
        {/* physician observes from the alley mouth */}
        {t > T.observe - 0.6 && (
          <Person x={dx} y={950} s={0.68} t={t} outfit="robe" hat="hood" beard="short" walk={walking ? t * 0.9 : undefined} pose={walking ? undefined : 'think'} expression="thinking" seed={55} />
        )}
      </Cam>
      <Vignette strength={0.55} />
      <Kicker x={tx} y={200} anchor="start" text="MIASMA" size={72} color={C.theoryTint} p={ramp(t, T.miasma - 0.15, T.miasma + 0.5) * (1 - ramp(t, T.stupid - 0.5, T.stupid - 0.1))} />
      <Tag x={tx} y={275} text="Theory: bad air carries disease" kind="theory" p={ramp(t, T.poisoned - 0.15, T.poisoned + 0.5) * (1 - ramp(t, T.stupid - 0.5, T.stupid - 0.1))} />
      <Tag x={tx} y={200} text="Not a stupid idea" kind="caution" size={30} p={ramp(t, T.stupid - 0.05, T.stupid + 0.5) * (1 - ramp(t, T.airItself - 0.8, T.airItself - 0.3))} />
    </Stage>
  );
};
export const S5 = StreetShot;
export const S6 = StreetShot;

// ───────────────────────── S7 · 228.40 · "Now put the two ideas next to each other … combine them?"
export const S7: React.FC<{t: number}> = ({t}) => {
  const inL = ramp(t, T.two + 0.1, T.two + 1.0, out);
  const inR = ramp(t, T.two + 0.25, T.two + 1.15, out);
  const comb = ramp(t, T.combine - 0.1, T.combine + 0.7, ease.inOut);
  const lx = lerp(-460, 560, inL) + 100 * comb;
  const rx = lerp(2380, 1360, inR) - 100 * comb;
  const plusP = ramp(t, T.two + 0.9, T.two + 1.3, ease.outBack) * (1 - ramp(t, T.combineW - 0.55, T.combineW - 0.25));
  const qP = ramp(t, T.combineW - 0.4, T.combineW + 0.1);
  const cam = breathe(camAt(t, [[T.two, 960, 540, 1.0], [T.combine, 960, 540, 1.02], [T.combineW + 0.8, 960, 520, 1.1]]), t);
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        <Card x={lx} y={520} w={700} h={600} p={inL} rot={-1.5}>
          <PoreSkin x={350} y={320} s={0.42} w={1400} pores={7} open={ramp(t, T.pores + 0.6, T.pores + 1.6)} heat={ramp(t, T.pores, T.pores + 1.2)} t={t} seed={3} />
          <Headline x={350} y={530} text="A hot bath opens the pores" size={38} mode="words" p={ramp(t, T.pores - 0.1, T.pores + 0.9)} />
        </Card>
        <Card x={rx} y={520} w={700} h={600} p={inR} rot={1.5}>
          <Particles t={t} x={60} y={60} w={580} h={380} n={10} seed={5} size={[3, 7]} color={C.theoryLight} opacity={[0.3, 0.6]} vx={-8} vy={-4} />
          <Miasma x={40} y={50} w={620} h={400} density={0.85} from="right" p={ramp(t, T.corrupt - 0.2, T.corrupt + 1.3)} t={t} seed={31} />
          <Headline x={350} y={530} text="Corrupted air is dangerous" size={38} mode="words" p={ramp(t, T.corrupt - 0.1, T.corrupt + 0.9)} />
        </Card>
        {plusP > 0 && (
          <g transform={`translate(960 500) rotate(${45 * ramp(t, T.combineW - 0.55, T.combineW - 0.25)}) scale(${plusP})`}>
            <circle r={48} fill={C.ink} />
            <rect x={-22} y={-5} width={44} height={10} rx={5} fill={C.paperLight} />
            <rect x={-5} y={-22} width={10} height={44} rx={5} fill={C.paperLight} />
          </g>
        )}
        {qP > 0 && (
          <g>
            <circle cx={960} cy={500} r={150 * ease.outBack(qP)} fill={C.paperLight} stroke={C.oxblood} strokeWidth={8} />
            <QuestionMark x={960} y={510} size={200} p={qP} t={t} color={C.oxblood} />
          </g>
        )}
      </Cam>
    </Stage>
  );
};

// ───────────────────────── S9–S12 · 243.40–264.72 · the Paris report, one continuous document
const PAGE_LINE = (x: number, y: number, w: number, p: number, key: number) =>
  p > 0 ? <rect key={key} x={x} y={y - 4} width={w * ease.out(clamp01(p))} height={8} rx={4} fill={C.paperDark} opacity={0.75} /> : null;

const ITEMS = [
  {text: 'Diet', y: -40, at: T.diet},
  {text: 'Sleep', y: 6, at: T.sleep},
  {text: 'Emotional state', y: 52, at: T.emotional},
  {text: 'Exercise and bathing', y: 104, at: T.bathing},
];

const Page: React.FC<{t: number}> = ({t}) => {
  const big = ramp(t, T.bathing - 0.1, T.bathing + 0.5, out);
  const l2 = 'vulnerability to the plague.';
  const l2x = -textWidth(l2) / 2;
  return (
    <g>
      <rect x={-286} y={-386} width={600} height={800} fill={C.ink} opacity={0.3} />
      <rect x={-300} y={-400} width={600} height={800} fill={C.paperLight} stroke={C.paperDark} strokeWidth={3} />
      <rect x={-276} y={-376} width={552} height={752} fill="none" stroke={C.paperDeep} strokeWidth={2} />
      <text x={0} y={-312} textAnchor="middle" fontFamily='"Fraunces", Georgia, serif' fontStyle="italic" fontWeight={600} fontSize={42} fill={C.ink}>
        Compendium de epidemia
      </text>
      <line x1={-180} y1={-286} x2={180} y2={-286} stroke={C.paperDark} strokeWidth={3} />
      {/* Causes */}
      <Headline x={-240} y={-226} anchor="start" text="Causes" size={32} weight={700} mode="type" p={ramp(t, T.causes - 0.1, T.causes + 0.5, ease.linear)} />
      {[470, 430, 300].map((w, i) => PAGE_LINE(-240, -190 + i * 26, w, ramp(t, T.causes + 0.4 + i * 0.25, T.causes + 1.0 + i * 0.25), i))}
      {/* What to do */}
      <Headline x={-240} y={-92} anchor="start" text="What to do" size={32} weight={700} mode="type" p={ramp(t, T.whatToDo - 0.1, T.whatToDo + 0.6, ease.linear)} />
      {ITEMS.map((it, i) => {
        const shown = ramp(t, T.whatToDo + 0.5 + i * 0.15, T.whatToDo + 1.0 + i * 0.15);
        const last = i === 3;
        const size = last ? lerp(28, 34, big) : 28;
        const hl = ramp(t, it.at - 0.15, it.at + 0.35);
        const w = textWidth(it.text, size) + 24;
        return (
          <g key={i} opacity={shown}>
            <Highlight x={-232} y={it.y - size * 0.95} w={w} h={size * 1.25} p={hl} color={last ? C.caution : C.paperDeep} opacity={last ? 0.55 : 0.9} />
            <circle cx={-246} cy={it.y - size * 0.32} r={4} fill={C.inkMute} />
            <text x={-222} y={it.y} fontFamily='"Fraunces", Georgia, serif' fontWeight={last ? 700 : 500} fontSize={size} fill={hl > 0.5 ? C.ink : C.inkMute}>
              {it.text}
            </text>
          </g>
        );
      })}
      {/* the warning (S12) */}
      <Headline x={0} y={196} text="Bathing could increase" size={30} mode="words" p={ramp(t, T.warned + 0.1, T.warned + 1.3)} />
      <Headline x={0} y={238} text={l2} size={30} mode="words" p={ramp(t, T.warned + 0.9, T.warned + 2.2)} />
      <Underline x={l2x} y={250} w={textWidth('vulnerability')} p={ramp(t, T.vuln - 0.05, T.vuln + 0.5)} thick={5} wobble={2} />
      {/* stamp (S10) */}
      <Stamp t={t} />
    </g>
  );
};
const textWidth = (s: string, size = 30) => s.length * size * 0.5;

const Stamp: React.FC<{t: number}> = ({t}) => {
  const p = ramp(t, T.exists - 0.08, T.exists + 0.25, out);
  if (p <= 0) return null;
  return (
    <g transform={`translate(200 316) rotate(-12) scale(${lerp(1.8, 1, p)})`} opacity={clamp01(p * 2) * 0.9}>
      <circle r={58} fill="none" stroke={C.evidence} strokeWidth={7} />
      <circle r={46} fill="none" stroke={C.evidence} strokeWidth={2} />
      <Icon name="check" x={0} y={0} s={0.8} color={C.evidence} accent={C.evidence} knock={C.paperLight} />
    </g>
  );
};

const DocShot: React.FC<{t: number}> = ({t}) => {
  const K: [number, number, number, number, number, number][] = [
    // time, fx, fy, k, sx, sy
    [T.report + 0.55, 0, 0, 0.2, 960, 700],
    [T.report + 1.6, 0, 0, 0.9, 960, 575],
    [T.exists - 0.4, 0, 0, 0.9, 960, 575],
    [T.exists + 0.5, 0, 0, 0.92, 780, 560],
    [T.inside - 0.1, 0, 0, 0.98, 770, 560],
    [T.inside + 1.0, -20, 30, 1.5, 900, 560],
    [T.bathing - 0.2, -20, 34, 1.56, 900, 560],
    [T.bathing + 0.7, -40, 104, 1.8, 900, 560],
    [T.warned - 0.05, -40, 104, 1.82, 900, 560],
    [T.warned + 0.8, 0, 210, 2.3, 960, 560],
    [T.notWater + 0.6, 0, 214, 2.4, 960, 560],
  ];
  const at = (j: number) => keys(t, K.map((r) => [r[0], r[j]] as [number, number]));
  const fx = at(1), fy = at(2), k = at(3), sx = at(4), sy = at(5);
  const ox = sx - fx * k + noise1(t * 0.25, 1) * 4;
  const oy = sy - fy * k + noise1(t * 0.22, 2) * 3;
  const rot = lerp(-8, 0, ramp(t, T.report + 0.55, T.report + 1.6));
  const dim = ramp(t, T.report + 0.5, T.report + 1.5) * 0.62;
  const hallCam = camAt(t, [[T.report - 0.6, 960, 560, 1.0], [T.report + 2, 960, 540, 1.08]]);
  const writing = Math.abs(Math.sin(t * 7));
  return (
    <Stage bg={C.ink}>
      <Cam cam={hallCam}>
        <Room era="medieval" windowX={1520} doorX={260} night={false} t={t} seed={9} />
        <Person x={780} y={820} s={0.8} t={t} outfit="robe" top={C.inkSoft} hat="beret" hatColor={C.woodDark} beard="full" age="elder" pose="think" expression="thinking" seed={61} />
        <Person x={1150} y={820} s={0.8} t={t} facing={-1} outfit="robe" top={C.woodDark} hat="hood" beard="short" expression="neutral" talk={writing * 0.6} seed={62} />
        <Table x={960} y={900} w={820} h={170} />
        <Bench x={560} y={940} s={0.84} />
        <Person x={620} y={940} s={0.84} t={t} sit={1} outfit="robe" top={C.slate} hat="coif" pose="write" expression="thinking" seed={63} />
        <Bench x={1360} y={940} s={0.84} />
        <Person x={1300} y={940} s={0.84} t={t} sit={1} facing={-1} outfit="robe" top={C.wood} hat="beret" hatColor={C.inkSoft} beard="moustache" expression="neutral" seed={64} />
      </Cam>
      <rect x={0} y={0} width={1920} height={1080} fill={C.ink} opacity={dim} />
      <g transform={`translate(${ox} ${oy}) scale(${k}) rotate(${rot})`}>
        <Page t={t} />
      </g>
      <Kicker x={960} y={130} text="PARIS MEDICAL FACULTY · 1348" size={26} color={C.paperShade} p={ramp(t, T.report + 1.0, T.report + 1.6) * (1 - ramp(t, T.exists - 0.6, T.exists - 0.2))} />
      <Tag x={1140} y={430} text="Still exists" kind="evidence" size={30} p={ramp(t, T.exists - 0.05, T.exists + 0.45) * (1 - ramp(t, T.inside - 0.1, T.inside + 0.3))} />
      <Kicker x={1140} y={520} anchor="start" text="WRITTEN DURING THE OUTBREAK" size={24} color={C.paperShade} p={ramp(t, T.outbreak - 0.15, T.outbreak + 0.4) * (1 - ramp(t, T.inside - 0.1, T.inside + 0.3))} />
      <Kicker x={110} y={130} anchor="start" text="SECTIONS (PARAPHRASED)" size={22} color={C.paperShade} p={ramp(t, T.inside + 0.6, T.inside + 1.2) * (1 - ramp(t, T.warned - 0.3, T.warned + 0.1))} />
      <Tag x={960} y={900} anchor="center" text="The faculty's warning · paraphrased" kind="caution" p={ramp(t, T.warned + 1.6, T.warned + 2.2)} />
    </Stage>
  );
};
export const S9 = DocShot;
export const S10 = DocShot;
export const S11 = DocShot;
export const S12 = DocShot;

// ───────────────────────── S13 · 264.72 · "Not because water itself was evil … defenses down"
export const S13: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.notWater, 960, 560, 1.0], [T.defenses + 0.9, 960, 600, 1.1]]), t);
  const dropIn = ramp(t, T.water - 0.2, T.water + 0.35, ease.outBack);
  const dropOut = ramp(t, T.hotBath - 0.7, T.hotBath - 0.1, ease.in);
  const fall = ramp(t, T.defenses - 0.05, T.defenses + 0.7, ease.in);
  return (
    <Stage bg={C.ink}>
      <Cam cam={cam}>
        <Miasma x={300} y={40} w={1320} h={420} density={0.85} from="top" vx={12} dark toward={{x: 960, y: 660, k: ramp(t, T.air, T.corrupted + 1)}} p={ramp(t, T.air - 0.1, T.corrupted + 0.2)} t={t} seed={41} />
        <PoreSkin x={960} y={660} s={1} w={1500} pores={9} tone="ink" p={ramp(t, T.hotBath - 0.3, T.hotBath + 0.4)} heat={ramp(t, T.hotBath, T.hotBath + 1.2)} open={ramp(t, T.openBody, T.openBody2)} flowIn={ramp(t, T.air + 0.3, T.defenses - 0.2)} t={t} seed={7} />
        {/* the body's guard */}
        <g transform={`translate(${1600 + 50 * fall} ${300 + 200 * fall}) rotate(${95 * fall})`} opacity={1 - 0.6 * fall}>
          <Icon name="shield" x={0} y={0} s={1.5} color={C.paperShade} accent={C.evidenceLight} knock={C.ink} p={ramp(t, T.openBody2 - 1.2, T.openBody2 - 0.6)} />
        </g>
      </Cam>
      {dropIn > 0 && dropOut < 1 && (
        <g transform={`translate(960 ${440 - 120 * dropOut}) scale(${dropIn * (1 - dropOut)})`}>
          <Icon name="drop" x={0} y={0} s={2.4} color={C.water} accent={C.paperLight} knock={C.ink} />
        </g>
      )}
      <Kicker x={960} y={620} text="NOT THE WATER" size={34} color={C.paperShade} p={ramp(t, T.water, T.water + 0.4) * (1 - dropOut)} />
      <Kicker x={1560} y={540} text="DEFENSES DOWN" size={34} color={C.caution} p={ramp(t, T.defenses + 0.15, T.defenses + 0.55)} />
      <Vignette strength={0.5} />
    </Stage>
  );
};

// ───────────────────────── S14 · 273.94 · "This is where the contradiction disappears." — THE REVEAL
// One split tub (warm | night) → 274.9 the boundary glows oxblood (slam + shake) → 275.3–276.2 split 1→0: the night washes
// back off the tub and we end on ONE whole warm tub.
export const S14: React.FC<{t: number}> = ({t}) => {
  const split = 1 - ramp(t, T.contra + 0.32, T.contra + 1.22);
  const bx = 960 + 0.95 * lerp(1500, 0, ease.inOut(clamp01(split))); // screen x of HeroTub's boundary
  const glow = ramp(t, T.contra - 0.12, T.contra + 0.12, out) * (1 - ramp(t, T.contra + 0.9, T.contra + 1.3));
  const flash = ramp(t, T.contra - 0.08, T.contra + 0.05) * (1 - ramp(t, T.contra + 0.05, T.contra + 0.5));
  const cam = breathe(camAt(t, [[T.reveal, 960, 560, 1.0], [T.contra - 0.1, 960, 560, 1.03], [T.contra + 0.25, 960, 575, 1.09], [T.same + 0.4, 960, 600, 1.15]]), t, 0.6);
  const sh = kick(t, T.contra, 12, 17);
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        <g transform={`translate(${sh} 0)`}>
          <HeroTub x={960} y={1010} s={0.95} split={split} splitX={0} steam={1} light={1} herbs={1} backdrop t={t} seed={3} />
          {glow > 0 && bx < 2300 && (
            <g>
              <rect x={bx - 34 * glow} y={-200} width={68 * glow} height={1500} fill={C.oxblood} opacity={0.18 * glow + 0.2 * flash} />
              <rect x={bx - 6} y={-200} width={12} height={1500} fill={C.oxblood} opacity={glow} />
            </g>
          )}
        </g>
      </Cam>
      <Vignette strength={0.3} />
    </Stage>
  );
};

// ───────────────────────── S15 · 276.54 · "The same mechanism … therapeutic … different set … dangerous" — KEY IMAGE
export const S15: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.same - 0.4, 960, 560, 1.1], [T.thera + 1, 960, 540, 1.0], [T.danger + 1, 960, 540, 1.0]]), t, 0.6);
  const plum = ramp(t, T.diffSet - 0.1, T.diffSet + 1.1);
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        <rect x={960} y={-200} width={1200} height={780} fill={C.theoryTint} opacity={0.85 * plum} />
        <LightPool x={480} y={360} r={520} color={C.lamp} strength={ramp(t, T.thera - 0.4, T.thera + 0.8) * 0.9} />
        <line x1={960} y1={190} x2={960} y2={lerp(190, 560, ramp(t, T.same - 0.1, T.same + 0.6))} stroke={C.inkFaint} strokeWidth={4} strokeDasharray="14 12" />
        <Miasma x={1000} y={140} w={860} h={380} density={0.9} from="right" vx={-14} toward={{x: 1420, y: 560, k: 0.8}} p={ramp(t, T.diffSet, T.diffSet + 1.8)} t={t} seed={51} />
        <PoreSkin x={960} y={560} s={1} w={1700} pores={11} open={ramp(t, T.same - 0.3, T.same + 0.7)} heat={0.7} flowOut={ramp(t, T.thera - 0.2, T.thera + 1.4)} flowIn={ramp(t, T.diffSet + 0.4, T.danger)} split={0} t={t} seed={9} />
      </Cam>
      <Kicker x={960} y={140} text="SAME MECHANISM" size={48} weight={700} color={C.oxblood} p={ramp(t, T.same - 0.2, T.same + 0.4)} />
      <Tag x={535} y={925} anchor="center" text="Ordinary times: sickness out" kind="evidence" size={36} p={ramp(t, T.thera - 0.1, T.thera + 0.5)} />
      <Tag x={1385} y={925} anchor="center" text="Plague air: disease in" kind="theory" size={36} p={ramp(t, T.danger - 0.2, T.danger + 0.4)} />
    </Stage>
  );
};

// ───────────────────────── S17 · 291.33 · "Other plague writings … so bathing was something to avoid."
const Sheet: React.FC<{i: number; p: number}> = ({i, p}) => {
  const rot = [-14, 0, 13][i] * ease.out(p);
  const dx = [-70, 0, 70][i] * ease.out(p);
  if (p <= 0) return null;
  return (
    <g transform={`translate(${470 + dx} 840) rotate(${rot}) translate(0 ${-30 * (1 - p)})`} opacity={clamp01(p * 2)}>
      <rect x={-160} y={-456} width={330} height={440} fill={C.ink} opacity={0.18} transform="translate(10 10)" />
      <rect x={-165} y={-460} width={330} height={440} fill={C.paperLight} stroke={C.paperDark} strokeWidth={3} />
      <rect x={-110} y={-420} width={220} height={12} rx={6} fill={C.paperDark} />
      {Array.from({length: 9}, (_, k) => (
        <rect key={k} x={-130} y={-380 + k * 36} width={[250, 230, 260, 200, 245, 220, 255, 180, 140][k]} height={7} rx={3.5} fill={C.paperDeep} />
      ))}
    </g>
  );
};

export const S17: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.other - 0.6, 960, 540, 1.04], [T.end + 0.6, 960, 540, 1.0]]), t, 0.5);
  const lampGlow = 1 - ramp(t, T.avoid, T.avoid + 0.7);
  const nx = 1170;
  const ys = [330, 560, 790];
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        {[0, 1, 2].map((i) => (
          <Sheet key={i} i={i} p={ramp(t, T.other + 0.1 + i * 0.12, T.other + 0.9 + i * 0.12, out)} />
        ))}
        <Kicker x={470} y={300} text="OTHER PLAGUE WRITINGS" size={26} color={C.inkMute} p={ramp(t, T.other + 0.4, T.other + 1.0)} />
        <Node x={nx} y={ys[0]} w={600} text="Warm water opens the pores" size={32} p={ramp(t, T.warm - 0.15, T.warm + 0.45)} />
        <Arrow from={{x: nx, y: ys[0] + 60}} to={{x: nx, y: ys[1] - 60}} p={ramp(t, T.enter - 0.6, T.enter - 0.1)} />
        <Node x={nx} y={ys[1]} w={600} text="Corrupted air enters" kind="theory" size={32} p={ramp(t, T.enter - 0.1, T.enter + 0.5)} />
        <Arrow from={{x: nx, y: ys[1] + 60}} to={{x: nx, y: ys[2] - 60}} p={ramp(t, T.avoid - 0.6, T.avoid - 0.15)} />
        <Node x={nx} y={ys[2]} w={600} text="Avoid bathing" kind="signal" filled size={36} p={ramp(t, T.avoid - 0.15, T.avoid + 0.35)} />
        {/* the bathhouse sign + lantern: the institution's light dims */}
        <g>
          <rect x={1590} y={600} width={250} height={10} rx={5} fill={C.inkSoft} />
          <rect x={1830} y={590} width={14} height={60} rx={4} fill={C.inkSoft} />
          <line x1={1640} y1={610} x2={1640} y2={650} stroke={C.inkSoft} strokeWidth={4} />
          <line x1={1790} y1={610} x2={1790} y2={650} stroke={C.inkSoft} strokeWidth={4} />
          <rect x={1615} y={650} width={200} height={120} rx={8} fill={C.wood} stroke={C.woodDark} strokeWidth={5} />
          <Icon name="bath" x={1715} y={710} s={0.85} color={C.paperLight} accent={C.paperShade} knock={C.wood} />
          <Lantern x={1660} y={940} t={t} chain={60} lit={lampGlow > 0.25} glow={lampGlow} />
          <Steam t={t} x={1715} y={650} w={120} h={90} n={3} strength={0.5 * lampGlow} />
          <rect x={1580} y={580} width={280} height={380} fill={C.paper} opacity={0.35 * (1 - lampGlow)} />
        </g>
      </Cam>
    </Stage>
  );
};
