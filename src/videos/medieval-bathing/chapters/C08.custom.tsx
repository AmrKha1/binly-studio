// Custom shots for C08 (builder-owned) · "Back to the bath" — the ENDING, bookend of C01 S1.
import React from 'react';
import {Stage, Cam, breathe} from '../../../kit/stage';
import {C, FONT_HAND, FONT_SERIF} from '../../../kit/theme';
import {camAt, clamp01, ease, keys, lerp, mixHex, noise1, ramp, randRange, win} from '../../../kit/anim';
import {Kicker, Tag} from '../../../kit/text';
import {Arrow, CrossOut, QuestionMark} from '../../../kit/diagrams';
import {LightPool, Pulse, Steam, Vignette} from '../../../kit/fx';
import {Icon} from '../../../kit/icons';
import {RichText} from '../../../kit/templates';
import {getLength, getPointAtLength} from '@remotion/paths';
import {HeroTub, Miasma, PoreSkin} from '../shared';

const T = {
  s1: 560.0, // "So go back to where we started."
  herbs: 561.8,
  medicine: 562.5, // "A hot bath was medicine"
  split: 564.6, // "…also…"
  danger: 566.5, // "a potential danger"
  s2: 567.83,
  contra: 568.0, // "contradiction"
  strike: 569.0,
  sameIdea: 571.5, // "the same idea"
  two: 574.9, // "two different situations"
  s3: 576.44,
  ordinary: 576.7, // "In an ordinary year"
  heal: 578.5, // "could help it heal"
  plague: 579.4, // "In a year when the air…"
  disease: 583.8, // "help disease get in"
  s4: 584.98,
  nobody: 585.1, // "Nobody in 1348"
  hate: 587.9, // "hate water"
  king: 588.8, // "A king"
  question: 590.4, // "serious question"
  logical: 592.3, // "the most logical answer"
  seal: 593.6,
  s7: 609.68,
  clean: 609.8, // "Medieval Europe never made the simple journey from clean to dirty"
  imagine: 613.5, // "that we like to imagine"
  winding: 614.1, // "What actually happened was more complicated"
  human: 616.4, // "more human"
  s9: 629.17,
  world: 632.0, // "the world around it just kept changing"
  s10: 634.86,
  sources: 637.6,
  fade: 641.0,
  end: 642.84,
};

// shared little helpers ----------------------------------------------------------------------
const FallingHerbs: React.FC<{t: number; t0: number}> = ({t, t0}) => (
  <g>
    {Array.from({length: 9}, (_, i) => {
      const a = t0 + i * 0.07;
      const k = ramp(t, a, a + 0.75, ease.in);
      if (k <= 0 || k >= 1) return null;
      const x0 = 640 + randRange(i * 13 + 1, -140, 260);
      const x = x0 + noise1(t * 2 + i, i) * 18 + k * 40;
      const y = lerp(120, 610 + randRange(i * 7, -10, 20), k);
      const r = (t * 220 + i * 47) % 360;
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`} opacity={win(k, 0, 1, 0.1, 0.12)}>
          {i % 3 === 0 ? <circle r={9} fill={C.cautionLight} /> : <ellipse rx={16} ry={7} fill={i % 2 ? C.evidenceLight : C.evidence} />}
        </g>
      );
    })}
  </g>
);

const WaxSeal: React.FC<{x: number; y: number; p: number; s?: number}> = ({x, y, p, s = 1}) => {
  if (p <= 0) return null;
  const k = clamp01(p);
  const sc = lerp(1.8, 1, ease.out(k)) * s;
  const scallop = Array.from({length: 18}, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const r = 78 + (i % 2 ? 6 : -4);
    return `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={ramp(k, 0, 0.35)}>
      <path d={`${scallop} Z`} fill={C.oxblood} transform="translate(6 8)" opacity={0.35} />
      <path d={`${scallop} Z`} fill={C.oxblood} />
      <circle r={56} fill="none" stroke={C.oxDeep} strokeWidth={6} />
      <Icon name="crown" x={0} y={2} s={0.75} color={C.oxDeep} accent={C.oxDeep} knock={C.oxblood} />
    </g>
  );
};

// S1 · 560.00 · "So go back to where we started. A hot bath was medicine… also a potential danger." — BOOKEND of C01 S1
export const S1: React.FC<{t: number}> = ({t}) => {
  const split = ramp(t, T.split - 0.4, T.split + 1.2, ease.inOut);
  const cam = breathe(camAt(t, [[T.s1 - 0.6, 960, 560, 0.99], [T.danger, 985, 548, 1.05], [T.s2 + 0.6, 1000, 545, 1.07]]), t);
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <HeroTub x={960} y={1075} s={1.02} split={split} splitX={0} herbs={ramp(t, T.herbs, T.herbs + 1.1, ease.out)} bather={1} steam={1} light={1} backdrop t={t} seed={1} />
        <FallingHerbs t={t} t0={T.herbs} />
      </Cam>
      <Tag x={590} y={330} anchor="right" text="Medicine" kind="evidence" size={46} p={ramp(t, T.medicine, T.medicine + 0.5, ease.out)} />
      <Tag x={1170} y={330} anchor="left" text="A potential danger" kind="caution" size={46} p={ramp(t, T.danger, T.danger + 0.5, ease.out)} />
      <Vignette strength={0.5} />
    </Stage>
  );
};

// S2 · 567.83 · "That wasn't a contradiction… the same idea… applied to two different situations."
const Card: React.FC<{x: number; y: number; w: number; h: number; p: number; fill?: string; dashed?: boolean; stroke?: string; tint?: number}> = ({x, y, w, h, p, fill = C.paperLight, dashed, stroke = C.ink, tint}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  return (
    <g transform={`translate(${x} ${y + (1 - k) * 24}) scale(${0.94 + 0.06 * k})`} opacity={k}>
      {!dashed && <rect x={-w / 2 + 10} y={-h / 2 + 12} width={w} height={h} rx={16} fill={C.ink} opacity={0.14} />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill={fill} stroke={stroke} strokeWidth={dashed ? 5 : 4} strokeDasharray={dashed ? '18 14' : undefined} />
      {tint !== undefined && <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill={stroke} opacity={tint} />}
    </g>
  );
};

export const S2: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s2 - 0.4, 960, 540, 1.03], [T.s3 + 0.4, 960, 540, 1.0]]), t, 0.6);
  const contra = ramp(t, T.contra - 0.1, T.contra + 0.5, ease.out);
  const contraOut = ramp(t, T.sameIdea - 0.5, T.sameIdea + 0.0, ease.inOut);
  const cardP = ramp(t, T.sameIdea - 0.2, T.sameIdea + 0.5, ease.out);
  const brA = ramp(t, T.two - 0.1, T.two + 0.55, ease.out);
  const brB = ramp(t, T.two + 0.1, T.two + 0.75, ease.out);
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        <g opacity={1 - contraOut} transform={`translate(0 ${-30 * contraOut})`}>
          <RichText x={260} y={380} w={1400} h={200} text="Contradiction?" size={120} align="center" valign="middle" weight={700} mode="words" p={contra} strike={ramp(t, T.strike, T.strike + 0.5)} />
        </g>
        {/* the single idea */}
        <Card x={960} y={400} w={1040} h={280} p={cardP} />
        {cardP > 0 && (
          <g opacity={ease.out(cardP)}>
            <Icon name="flame" x={600} y={400} s={1.7} color={C.oxblood} accent={C.cautionLight} knock={C.paperLight} p={ramp(t, T.sameIdea, T.sameIdea + 0.4, ease.outBack)} />
            <text x={702} y={420} fontFamily="serif" fontSize={64} fontWeight={700} fill={C.ink}>+</text>
            <Icon name="drop" x={810} y={400} s={1.7} color={C.water} accent={C.paperDeep} knock={C.paperLight} p={ramp(t, T.sameIdea + 0.25, T.sameIdea + 0.65, ease.outBack)} />
            <RichText x={900} y={320} w={500} h={160} text="Heat and moisture change the body" size={46} align="left" valign="middle" weight={600} mode="words" p={ramp(t, T.sameIdea + 0.1, T.sameIdea + 0.9)} />
          </g>
        )}
        {/* branch to two situations */}
        <Arrow from={{x: 900, y: 540}} to={{x: 560, y: 740}} p={brA} bend={-0.15} color={C.inkSoft} width={7} />
        <Arrow from={{x: 1020, y: 540}} to={{x: 1360, y: 740}} p={brB} bend={0.15} color={C.inkSoft} width={7} />
        <Card x={560} y={870} w={640} h={230} p={brA} dashed fill={mixHex(C.paper, C.lamp, 0.4)} stroke={C.caution} />
        <Card x={1360} y={870} w={640} h={230} p={brB} dashed fill={C.theoryTint} stroke={C.theory} />
        <Kicker x={560} y={880} text="Situation one" size={26} color={C.caution} p={ramp(t, T.two + 0.5, T.two + 1.0)} />
        <Kicker x={1360} y={880} text="Situation two" size={26} color={C.theory} p={ramp(t, T.two + 0.7, T.two + 1.2)} />
      </Cam>
      <Vignette strength={0.25} />
    </Stage>
  );
};

// S3 · 576.44 · PoreSkin split — callback to C04 S15, brighter and calmer
export const S3: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s3 - 0.4, 960, 560, 1.04], [T.disease + 1, 960, 540, 1.0]]), t, 0.5);
  const plumP = ramp(t, T.plague - 0.1, T.plague + 1.1);
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        <rect x={960} y={-200} width={1200} height={1480} fill={C.theoryTint} opacity={0.8 * plumP} />
        <LightPool x={480} y={380} r={560} color={C.lamp} strength={ramp(t, T.ordinary, T.ordinary + 1.0) * 0.9} />
        <line x1={960} y1={190} x2={960} y2={lerp(190, 860, ramp(t, T.ordinary, T.ordinary + 0.8))} stroke={C.inkFaint} strokeWidth={4} strokeDasharray="14 12" />
        <Miasma x={1000} y={160} w={860} h={420} density={0.8} from="right" vx={-14} toward={{x: 1420, y: 610, k: 0.8}} p={ramp(t, T.plague, T.plague + 1.8)} t={t} seed={51} />
        <PoreSkin x={960} y={620} s={1} w={1700} pores={11} open={ramp(t, T.s3 - 0.3, T.s3 + 0.9)} heat={0.7} flowOut={ramp(t, T.ordinary + 0.6, T.heal + 0.6)} flowIn={ramp(t, T.plague + 0.4, T.disease)} split={0} p={ramp(t, T.s3 - 0.3, T.s3 + 0.5)} t={t} seed={9} />
      </Cam>
      <Icon name="sun" x={480} y={120} s={0.9} color={C.cautionLight} accent={C.lamp} knock={C.paper} p={ramp(t, T.ordinary - 0.1, T.ordinary + 0.4, ease.outBack)} />
      <Kicker x={480} y={215} text="AN ORDINARY YEAR" size={36} color={C.ink} p={ramp(t, T.ordinary, T.ordinary + 0.5)} />
      <Icon name="cloud" x={1440} y={120} s={0.9} color={C.theory} accent={C.theoryTint} knock={C.theoryTint} p={ramp(t, T.plague - 0.1, T.plague + 0.4, ease.outBack)} />
      <Kicker x={1440} y={215} text="A PLAGUE YEAR" size={36} color={C.theory} p={ramp(t, T.plague, T.plague + 0.5)} />
      <Tag x={535} y={925} anchor="center" text="Helps it heal" kind="evidence" size={38} p={ramp(t, T.heal, T.heal + 0.5)} />
      <Tag x={1385} y={925} anchor="center" text="Helps disease get in" kind="theory" size={38} p={ramp(t, T.disease, T.disease + 0.5)} />
    </Stage>
  );
};

// S4 · 584.98 · "Nobody in 1348 woke up and decided to hate water. A king asked his physicians…"
export const S4: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s4 - 0.4, 960, 540, 1.0], [T.king, 960, 540, 1.0], [T.seal + 1, 960, 545, 1.05]]), t, 0.6);
  const leftOut = 1 - ramp(t, T.king + 0.1, T.king + 0.6, ease.inOut);
  const pageIn = ramp(t, T.king - 0.15, T.king + 0.65, ease.out);
  const pageX = lerp(1600, 960, pageIn);
  const q = ramp(t, T.question - 0.1, T.question + 0.4);
  const qOut = 1 - ramp(t, T.logical - 0.2, T.logical + 0.2);
  const steps = ['Heat opens the body', '→  Corrupted air enters', '→  Avoid the bath'];
  const hateP = ramp(t, T.hate - 0.3, T.hate + 0.2);
  const hateOut = 1 - ramp(t, T.hate + 1.0, T.hate + 1.5);
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        <g opacity={leftOut}>
          <text x={560} y={390} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={800} fontSize={150} fill={C.ink} opacity={ramp(t, T.nobody, T.nobody + 0.5)}>1348</text>
          <Icon name="drop" x={560} y={640} s={4.6} color={C.water} accent={C.paperDeep} knock={C.paper} p={ramp(t, T.nobody + 0.4, T.nobody + 1.0, ease.outBack)} r={Math.sin(t * 1.4) * 2} />
          <g opacity={hateP * hateOut}>
            <text x={560} y={940} textAnchor="middle" fontFamily={FONT_HAND} fontSize={90} fill={C.inkSoft}>hate water</text>
            <CrossOut x={560} y={915} size={170} p={ramp(t, T.hate + 0.1, T.hate + 0.6)} width={10} />
          </g>
        </g>
        {pageIn > 0 && (
          <g transform={`translate(${pageX} ${540 + (1 - pageIn) * 40}) rotate(${lerp(6, 0.6, pageIn)})`}>
            <rect x={-370} y={-410} width={760} height={860} fill={C.ink} opacity={0.18} />
            <rect x={-380} y={-420} width={760} height={860} fill={C.paperLight} stroke={C.paperDark} strokeWidth={4} />
            {Array.from({length: 4}, (_, i) => (
              <rect key={i} x={-300} y={-290 + i * 36} width={[600, 560, 590, 420][i]} height={10} rx={5} fill={C.paperDeep} />
            ))}
            <Icon name="crown" x={0} y={-350} s={1.2} color={C.caution} accent={C.cautionLight} knock={C.paperLight} p={ramp(t, T.king, T.king + 0.4, ease.outBack)} />
            <g opacity={qOut}>
              <QuestionMark x={150} y={-30} size={330} p={q} t={t} />
            </g>
            {steps.map((s, i) => (
              <RichText key={i} x={-310} y={-60 + i * 130} w={640} h={100} text={s} size={48} valign="middle" weight={600} mode="type" p={ramp(t, T.logical + i * 0.7, T.logical + i * 0.7 + 0.9)} color={i === 2 ? C.ink : C.inkSoft} />
            ))}
            <WaxSeal x={230} y={340} s={0.9} p={ramp(t, T.logical - 0.1, T.logical + 0.3)} />
            <Pulse x={230} y={340} r={160} p={ramp(t, T.seal, T.seal + 0.7)} color={C.oxblood} />
          </g>
        )}
      </Cam>
      <Vignette strength={0.3} />
    </Stage>
  );
};

// S7 · 609.68 · "Medieval Europe never made the simple journey from clean to dirty…" — straight myth road → winding human path
const Sign: React.FC<{x: number; y: number; text: string; dirty?: boolean; p: number}> = ({x, y, text, dirty, p}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  const board = dirty ? C.stoneDark : C.paperLight;
  return (
    <g transform={`translate(${x} ${y + (1 - k) * 30})`} opacity={k}>
      <rect x={-8} y={0} width={16} height={160} fill={C.woodDark} />
      <rect x={-130} y={-70} width={260} height={96} rx={10} fill={C.ink} opacity={0.14} transform="translate(8 8)" />
      <rect x={-130} y={-70} width={260} height={96} rx={10} fill={board} stroke={dirty ? C.ink : C.caution} strokeWidth={6} />
      {dirty && [[-90, -20, 26], [30, 0, 20], [80, -40, 22]].map(([a, b, r], i) => <circle key={i} cx={a} cy={b} r={r} fill={C.inkSoft} opacity={0.4} />)}
      <text x={0} y={-5} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={800} fontSize={40} letterSpacing={6} fill={dirty ? C.paperShade : C.ink}>{text}</text>
    </g>
  );
};

const WIND = 'M200 840 C 480 940, 560 640, 780 720 S 1020 930, 1220 740 S 1440 470, 1720 400';
const BRANCH = 'M780 720 C 800 600, 900 560, 960 500';

export const S7: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s7 - 0.3, 960, 540, 1.04], [T.human + 1.2, 960, 520, 1.0]]), t, 0.6);
  const mythP = ramp(t, T.clean + 0.1, T.clean + 1.2, ease.inOut);
  const mythOut = 1 - ramp(t, T.imagine - 0.1, T.imagine + 0.5, ease.inOut);
  const draw = ramp(t, T.winding, T.winding + 2.0, ease.inOut);
  const branch = ramp(t, T.winding + 1.0, T.winding + 1.9, ease.out);
  const fracs: {f: number; icon: 'bath' | 'skull' | 'document' | 'house'; accent: string}[] = [
    {f: 0.12, icon: 'bath', accent: C.lamp},
    {f: 0.38, icon: 'skull', accent: C.paperShade},
    {f: 0.66, icon: 'document', accent: C.caution},
    {f: 0.95, icon: 'house', accent: C.lamp},
  ];
  const L = getLength(WIND);
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        {/* the myth */}
        <g opacity={mythOut} transform={`translate(0 ${(1 - mythOut) * 24})`}>
          <Sign x={290} y={420} text="CLEAN" p={ramp(t, T.clean - 0.1, T.clean + 0.5)} />
          <Sign x={1630} y={420} text="DIRTY" dirty p={ramp(t, T.clean + 0.6, T.clean + 1.2)} />
          <line x1={340} y1={600} x2={lerp(340, 1580, mythP)} y2={600} stroke={C.inkSoft} strokeWidth={10} strokeDasharray="30 22" strokeLinecap="round" />
          {mythP > 0.95 && <polygon points="1580,574 1624,600 1580,626" fill={C.inkSoft} />}
        </g>
        {/* the real path */}
        <path d={WIND} fill="none" stroke={C.wood} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
        <path d={WIND} fill="none" stroke={C.paperLight} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 18" opacity={0.7 * draw} />
        <path d={BRANCH} fill="none" stroke={C.wood} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - branch} />
        {fracs.map((v, i) => {
          const k = ramp(draw, v.f - 0.04, v.f + 0.1, ease.outBack);
          if (k <= 0) return null;
          const pt = getPointAtLength(WIND, v.f * L) ?? {x: 0, y: 0};
          const off = i % 2 ? 130 : -130;
          return (
            <g key={i} opacity={clamp01(k)}>
              <line x1={pt.x} y1={pt.y} x2={pt.x} y2={pt.y + off * 0.45} stroke={C.inkFaint} strokeWidth={3} strokeDasharray="6 8" />
              <circle cx={pt.x} cy={pt.y + off} r={74 * k} fill={C.paperLight} stroke={C.ink} strokeWidth={5} />
              <Icon name={v.icon} x={pt.x} y={pt.y + off} s={1.05 * k} color={C.ink} accent={v.accent} knock={C.paperLight} />
              {v.icon === 'house' && <LightPool x={pt.x} y={pt.y + off} r={130} color={C.lamp} strength={0.45} />}
            </g>
          );
        })}
      </Cam>
      <Kicker x={960} y={150} text="MORE COMPLICATED · MORE HUMAN" size={46} color={C.oxblood} p={ramp(t, T.human - 0.1, T.human + 0.5)} />
      <Vignette strength={0.25} />
    </Stage>
  );
};

// S9 · 629.17 · FINAL IMAGE — HeroTub constant, backdrop cycles through three worlds
const WorldBath: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={-400} y={-300} width={2720} height={1060} fill={C.stone} />
    {[0, 1, 2, 3, 4].map((i) => (
      <g key={i}>
        <path d={`M${60 + i * 440} 760 V 330 a 160 160 0 0 1 320 0 V 760 Z`} fill={C.stoneShade} opacity={0.65} />
        <rect x={20 + i * 440} y={300} width={40} height={460} fill={C.stoneDark} opacity={0.5} />
      </g>
    ))}
    <rect x={-400} y={760} width={2720} height={500} fill={C.stoneDark} />
    <LightPool x={400} y={420} r={720} color={C.lamp} strength={0.9 + noise1(t * 1.5, 4) * 0.06} />
  </g>
);

const WorldNight: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={-400} y={-300} width={2720} height={1560} fill={C.ink} />
    <rect x={-400} y={760} width={2720} height={500} fill={C.inkLift} opacity={0.8} />
    <Icon name="moon" x={1560} y={190} s={1.6} color={C.paperShade} accent={C.inkLift} knock={C.ink} />
    <Miasma x={-200} y={-80} w={2400} h={900} density={0.9} from="left" vx={30} dark p={1} t={t} seed={61} />
  </g>
);

const WorldDusk: React.FC<{t: number}> = ({t}) => {
  const sky = mixHex(C.slate, C.oxblood, 0.18);
  return (
    <g>
      <rect x={-400} y={-300} width={2720} height={1060} fill={sky} />
      <rect x={-400} y={470} width={2720} height={300} fill={mixHex(sky, C.cautionLight, 0.35)} opacity={0.6} />
      {Array.from({length: 7}, (_, i) => {
        const bx = -60 + i * 340;
        const bh = 300 + randRange(i * 5, 0, 160);
        return (
          <g key={i}>
            <path d={`M${bx} 760 V ${760 - bh} L ${bx + 140} ${760 - bh - 90} L ${bx + 280} ${760 - bh} V 760 Z`} fill={C.ink} opacity={0.88} />
            {[0, 1].map((r) => [0, 1].map((c) => {
              const on = (i * 3 + r * 2 + c) % 3 !== 0;
              const fl = 0.85 + noise1(t * 2 + i + r + c, i + 7) * 0.12;
              return <rect key={`${r}${c}`} x={bx + 50 + c * 120} y={760 - bh + 70 + r * 100} width={52} height={64} rx={6} fill={on ? C.lamp : C.inkLift} opacity={on ? fl : 0.6} />;
            }))}
          </g>
        );
      })}
      <rect x={-400} y={760} width={2720} height={500} fill={C.inkLift} />
    </g>
  );
};

export const S9: React.FC<{t: number}> = ({t}) => {
  const pull = ramp(t, T.s9, T.s10, ease.inOut);
  const sc = lerp(1.1, 0.92, pull);
  // world weights: bath → night → dusk → bath
  const night = ramp(t, T.world, T.world + 0.9, ease.inOut) * (1 - ramp(t, 633.2, 634.0, ease.inOut));
  const dusk = ramp(t, 633.1, 634.0, ease.inOut) * (1 - ramp(t, 634.3, 634.86, ease.inOut));
  const cam = breathe(camAt(t, [[T.s9 - 0.5, 960, 540, 1.0]]), t, 0.6);
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <WorldBath t={t} />
        <g opacity={dusk}><WorldDusk t={t} /></g>
        <g opacity={night}><WorldNight t={t} /></g>
        <HeroTub x={960} y={lerp(1090, 1010, pull)} s={sc} bather={1} steam={1} light={1} herbs={1} t={t} seed={5} />
      </Cam>
      <Vignette strength={0.5} />
    </Stage>
  );
};

// S10 · 634.86 · tub settles small on paper, SOURCES IN THE DESCRIPTION, fade to paper, steam last
export const S10: React.FC<{t: number}> = ({t}) => {
  const settle = ramp(t, T.s10, T.s10 + 1.6, ease.inOut);
  const wall = 1 - settle; // bathhouse backdrop dissolves into paper
  const tubFade = 1 - ramp(t, T.fade + 0.2, T.fade + 1.3, ease.inOut);
  const steamFade = 1 - ramp(t, T.end - 0.6, T.end + 0.5, ease.inOut);
  const sc = lerp(0.92, 0.46, settle);
  const y = lerp(1010, 800, settle);
  return (
    <Stage bg={C.paper}>
      <g opacity={wall}>
        <WorldBath t={t} />
      </g>
      <LightPool x={960} y={y - 230 * sc} r={300 * sc + 120} color={C.lamp} strength={0.8 * tubFade * settle} />
      <g opacity={tubFade}>
        <HeroTub x={960} y={y} s={sc} bather={1} steam={tubFade > 0.99 ? 1 : 0.5 * tubFade} light={0} herbs={1} t={t} seed={5} />
      </g>
      <g opacity={steamFade * ramp(t, T.fade + 0.2, T.fade + 1.0)}>
        <Steam t={t} x={960} y={y - 300 * sc} w={300 * sc + 60} h={260} n={4} strength={0.9} color={C.paperLight} />
      </g>
      <Kicker x={960} y={940} text="SOURCES IN THE DESCRIPTION" size={30} color={C.inkMute} p={ramp(t, T.sources - 0.2, T.sources + 0.6) * (1 - ramp(t, T.fade, T.fade + 1.2))} />
      <Vignette strength={0.3 * wall} />
    </Stage>
  );
};
