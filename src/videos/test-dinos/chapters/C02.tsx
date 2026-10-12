import React from 'react';
import {Stage, Cam, shake} from '../../../kit/stage';
import {C, FONT_SERIF} from '../../../kit/theme';
import {camAt, ease, lerp, ramp, win, clamp01} from '../../../kit/anim';
import {Headline, Kicker, Tag} from '../../../kit/text';
import {Polaroid} from '../../../kit/cards';
import {QuestionMark} from '../../../kit/diagrams';
import {Pulse, Particles, WipeReveal, Vignette, LightPool} from '../../../kit/fx';
import {Person, personHands, Crowd} from '../../../kit/people';
import {Study, MuseumHall, Plinth, mixC} from '../../../kit/env';
import {Shots} from '../../../kit/shots';

// ---------------------------------------------------------------- cues (absolute seconds)
const T = {
  open: 26.4,
  uncomf: 26.45, // "Here's the uncomfortable part"
  bad: 28.42, // "badly wrong before"
  c19: 30.14, // "In the 19th century"
  igua: 35.62, // "Iguanodon"
  found: 36.7, // "found a strange"
  spike: 38.02, // "spike-shaped bone"
  couldnt: 40.38, // "couldn't quite place it"
  guess: 41.71, // "Their best guess"
  horn: 44.79, // "a horn"
  nose: 46.04, // "on the nose"
  years: 46.7, // "For years, that's exactly how Iguanodon was"
  drawn: 49.38, // "drawn"
  sculpted: 50.22, // "sculpted"
  displayed: 50.94, // "displayed"
  wasnt: 52.12, // "It wasn't stupidity"
  best: 53.6, // "the best possible reading"
  incomplete: 55.04, // "of incomplete evidence"
  end: 56.35,
};

// ---------------------------------------------------------------- shared little shapes (local)
// T. rex silhouette (facing right, ground y=205)
const REX_BODY =
  'M-190 40 C-120 20 -60 -10 -30 -50 C0 -85 40 -100 80 -100 C110 -100 120 -120 130 -150 C140 -190 160 -205 200 -205 C235 -205 260 -190 262 -168 C264 -150 255 -142 240 -140 L200 -128 C180 -120 160 -115 140 -100 C135 -60 120 -30 100 0 C80 20 40 25 0 25 C-50 30 -110 50 -190 40 Z';
const REX_LEG = 'M-30 10 C10 -10 70 0 80 40 L70 110 L45 125 L55 190 L105 195 L105 205 L10 205 L10 130 C-20 100 -40 60 -30 10 Z';
const Rex: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = C.inkSoft}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={REX_LEG} fill={color} transform="translate(-14 0)" opacity={0.85} />
    <path d={REX_BODY} fill={color} />
    <path d={REX_LEG} fill={color} />
    <path d="M150 -62 L178 -28" stroke={color} strokeWidth={13} strokeLinecap="round" />
    <circle cx={214} cy={-176} r={6} fill={C.paperShade} />
  </g>
);

// Iguanodon (facing right, ground y = 218, spans x -400..430, y -245..218)
const IG_BODY =
  'M-400 120 C-300 100 -230 60 -170 0 C-120 -50 -40 -80 40 -90 C100 -95 150 -110 190 -150 C230 -195 255 -230 290 -235 C330 -245 380 -235 405 -200 C425 -185 430 -165 415 -150 C395 -140 350 -140 320 -150 C290 -150 270 -130 255 -100 C235 -50 210 0 180 40 C170 70 150 90 100 100 C40 110 -50 105 -110 90 C-190 110 -300 140 -400 120 Z';
const IG_LEG = 'M-90 30 C-40 -10 40 0 70 40 L60 110 L35 135 L45 205 C80 205 110 208 115 218 L-5 218 L-5 200 L0 140 C-40 110 -80 80 -90 30 Z';
const IG_ARM = 'M165 -30 C190 0 205 40 235 62 L225 75 C190 60 165 20 150 -10 Z';
const IG_SHAPES = [
  {d: IG_LEG, tx: 70, o: 0.8},
  {d: IG_BODY, tx: 0, o: 1},
  {d: IG_LEG, tx: 0, o: 1},
  {d: IG_ARM, tx: 0, o: 1},
];
const NOSE = {x: 392, y: -214, rot: 24}; // where the horn sits, local to the dinosaur

const Spike: React.FC<{x: number; y: number; rot?: number; s?: number; fill?: string; shade?: string; line?: string}> = ({x, y, rot = 0, s = 1, fill = C.bone, shade = C.paperDark, line = C.inkLift}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-30 0 Q-24 -60 2 -150 Q26 -60 30 0 Q0 16 -30 0 Z" fill={fill} stroke={line} strokeWidth={4 / s} strokeLinejoin="round" />
    <path d="M2 -150 Q26 -60 30 0 Q14 9 0 11 Q8 -70 2 -150 Z" fill={shade} opacity={0.55} />
    <ellipse cx={0} cy={1} rx={30} ry={9} fill={shade} stroke={line} strokeWidth={3 / s} />
  </g>
);

/** dashed stroke that grows along the path (unique mask id per instance) */
const Grow: React.FC<{id: string; d: string; p: number; color: string; w?: number; tx?: number; o?: number}> = ({id, d, p, color, w = 5, tx = 0, o = 1}) => {
  if (p <= 0) return null;
  const k = ease.inOut(clamp01(p));
  return (
    <g transform={`translate(${tx} 0)`} opacity={o}>
      <mask id={id}>
        <path d={d} pathLength={1} stroke="#fff" strokeWidth={w + 6} fill="none" strokeDasharray="1 1" strokeDashoffset={1 - k} />
      </mask>
      <path d={d} stroke={color} strokeWidth={w} fill="none" strokeDasharray={`${w * 2.6} ${w * 1.9}`} strokeLinecap="round" strokeLinejoin="round" mask={`url(#${id})`} />
    </g>
  );
};

// ---------------------------------------------------------------- Shot A · 26.4 — the museum photo tilts, "?" pops
const PhotoScene: React.FC = () => (
  <g>
    <rect x={-300} y={-300} width={600} height={600} fill={C.paperShade} />
    <rect x={-230} y={-250} width={100} height={260} rx={50} fill={C.paperLight} opacity={0.8} />
    <rect x={130} y={-250} width={100} height={260} rx={50} fill={C.paperLight} opacity={0.8} />
    <rect x={-300} y={110} width={600} height={190} fill={C.paperDeep} />
    <rect x={-300} y={106} width={600} height={8} fill={C.inkSoft} opacity={0.35} />
    <Rex x={-20} y={108} s={0.78} color={C.inkSoft} />
  </g>
);

const Intro: React.FC<{t: number}> = ({t}) => {
  const base = camAt(t, [
    [T.open, 960, 540, 1.07],
    [T.c19, 960, 540, 1.0],
  ]);
  const cam = shake(base, t, T.bad, 9, 6);
  const tiltK = ramp(t, T.bad - 0.25, T.bad + 0.6, ease.outBack);
  const rot = lerp(-1.2, -9, tiltK) + Math.sin(t * 1.3) * 0.5;
  const px = lerp(960, 690, ramp(t, T.bad - 0.4, T.bad + 0.7, ease.inOutQuint));
  const py = 520 + Math.sin(t * 1.1) * 4;
  return (
    <Stage bg={C.ink}>
      <Cam cam={cam}>
        <Particles t={t} x={0} y={0} w={1920} h={1080} n={26} seed={4} size={[2, 5]} color={C.paperShade} opacity={[0.1, 0.3]} vy={-6} />
        <Polaroid id="c02-ph" x={px} y={py} w={620} rot={rot} imageBg={C.paperShade} caption="Natural History Museum">
          <PhotoScene />
        </Polaroid>
        <QuestionMark x={1330} y={470} size={420} p={ramp(t, T.bad - 0.1, T.bad + 0.55)} t={t} color={C.oxblood} />
      </Cam>
      <Kicker x={960} y={130} size={30} text="The uncomfortable part" color={C.paperShade} p={ramp(t, T.uncomf, T.uncomf + 0.7)} />
      <Vignette strength={1.2} />
    </Stage>
  );
};

// ---------------------------------------------------------------- Shot B · 30.0 — the 19th-century study
const PERSON = {x: 640, y: 950, s: 1} as const;
const WRITE = {front: [34, 14], back: [22, 30]} as const;
const HOLD = {front: [40, 60], back: [30, 70]} as const;

const personAt = (t: number) => {
  const k = ramp(t, 36.75, 37.95, ease.inOut);
  const mix = (a: readonly number[], b: readonly number[]): [number, number] => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const expression = t < T.found ? 'neutral' : t < T.couldnt - 0.2 ? 'surprised' : t < T.guess + 0.4 ? 'thinking' : 'determined';
  return {
    ...PERSON,
    t,
    facing: 1 as const,
    outfit: 'coat' as const,
    hair: 'side' as const,
    beard: 'moustache' as const,
    glasses: true,
    arms: {front: mix(WRITE.front, HOLD.front), back: mix(WRITE.back, HOLD.back)},
    expression: expression as 'neutral' | 'surprised' | 'thinking' | 'determined',
    lean: 4 * k,
    look: 0.3 * k,
    talk: 0,
  };
};

const DeskBones: React.FC<{t: number}> = ({t}) => {
  const p = ramp(t, T.c19 + 0.3, T.c19 + 1.0, ease.out);
  const labelP = ramp(t, T.igua - 0.1, T.igua + 0.5, ease.outBack);
  return (
    <g opacity={p}>
      {/* femur */}
      <g transform="translate(1262 670) rotate(-5)">
        <rect x={-85} y={-12} width={170} height={24} rx={12} fill={C.bone} />
        <circle cx={-88} cy={-12} r={17} fill={C.bone} />
        <circle cx={-88} cy={12} r={15} fill={C.bone} />
        <circle cx={88} cy={-10} r={20} fill={C.bone} />
        <circle cx={90} cy={12} r={14} fill={C.bone} />
        <rect x={-85} y={2} width={170} height={10} rx={5} fill={C.paperDark} opacity={0.4} />
      </g>
      {/* vertebrae */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <ellipse cx={1150 + i * 6} cy={662 - i * 14} rx={24} ry={11} fill={C.bone} />
          <ellipse cx={1150 + i * 6} cy={666 - i * 14} rx={24} ry={7} fill={C.paperDark} opacity={0.45} />
        </g>
      ))}
      {/* specimen label */}
      <g transform={`translate(1130 590) rotate(-3) scale(${labelP})`} opacity={clamp01(labelP * 3)}>
        <rect x={-150} y={-38} width={300} height={76} rx={4} fill={C.paperLight} />
        <rect x={-140} y={-30} width={280} height={60} fill="none" stroke={C.inkFaint} strokeWidth={2} />
        <text x={0} y={14} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={46} fill={C.ink}>
          Iguanodon
        </text>
      </g>
    </g>
  );
};

const StudyShot: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, [
    [T.c19 - 0.4, 780, 570, 1.22],
    [T.found + 1.2, 960, 540, 1.0],
  ]);
  const pp = personAt(t);
  const hands = personHands(pp);
  // bone: follows the front hand (which rests on it in the 'write' pose, then lifts it)
  const pick = ramp(t, 36.75, 37.95, ease.inOut);
  const bx = hands.front.x;
  const by = hands.front.y;
  const boneRot = lerp(72, -8, pick);
  const boneOnStage = t < T.guess;
  // after 41.7 the bone is drawn in the overlay (camera is identity from found+1.2 on)
  const paperP = ramp(t, T.guess - 0.1, T.guess + 0.75, ease.outQuint);
  const dim = ramp(t, T.guess - 0.15, T.guess + 0.5) * 0.62;
  const PAPER = {x: 1220, y: 500, w: 900, h: 600};
  const IG = {x: PAPER.x - 15 * 0.9, y: PAPER.y + 18, s: 0.9};
  const fly = ramp(t, T.horn - 0.55, T.horn + 0.09, ease.inOut);
  const nx = IG.x + (NOSE.x - 2) * IG.s;
  const ny = IG.y + (NOSE.y + 8) * IG.s;
  const fx = lerp(bx, nx, fly);
  const fy = lerp(by, ny, fly) - Math.sin(Math.PI * fly) * 150;
  const fr = lerp(-8, NOSE.rot, fly);
  const fs = lerp(1, 0.62, fly);
  const sinceHit = t - (T.horn + 0.09);
  const outline = ramp(t, T.guess + 0.2, T.guess + 2.0);
  const fill = ramp(t, T.guess + 2.0, T.guess + 2.8);
  const frac = (n: number) => ramp(outline, n, n + 0.6);

  const tagFade = 1 - ramp(t, T.guess - 0.3, T.guess + 0.2);
  return (
    <Stage bg={C.ink}>
      <Cam cam={cam}>
        <Study layer="back" t={t} seed={3} />
        <Person {...pp} />
        <Study layer="front" t={t} seed={3} />
        <DeskBones t={t} />
        <Particles t={t} x={300} y={300} w={800} h={420} n={22} seed={9} size={[2, 4]} color={C.lamp} opacity={[0.15, 0.45]} vy={-5} />
        {boneOnStage && <Spike x={bx} y={by} rot={boneRot} s={1} />}
      </Cam>

      {/* captions / tags (screen space) */}
      <Kicker x={960} y={965} size={30} text="19th century" color={C.paperShade} p={ramp(t, T.c19 - 0.1, T.c19 + 0.6) * win(t, 0, T.guess + 0.2, 0.01, 0.4)} />
      <g opacity={tagFade}>
        <Tag x={hands.front.x + 80} y={hands.front.y - 150} anchor="left" text="Spike-shaped bone" kind="caution" size={30} p={ramp(t, T.spike - 0.15, T.spike + 0.55)} to={{x: hands.front.x + 12, y: hands.front.y - 105}} />
        <QuestionMark x={hands.front.x + 585} y={hands.front.y - 150} size={170} p={ramp(t, T.couldnt - 0.15, T.couldnt + 0.45)} t={t} color={C.caution} />
      </g>

      {/* best-guess drawing */}
      <rect x={0} y={0} width={1920} height={1080} fill={C.ink} opacity={dim} />
      {paperP > 0 && (
        <g transform={`translate(0 ${(1 - paperP) * 520}) rotate(${lerp(-7, -1.2, paperP)} ${PAPER.x} ${PAPER.y})`} opacity={clamp01(paperP * 4)}>
          <rect x={PAPER.x - PAPER.w / 2 + 14} y={PAPER.y - PAPER.h / 2 + 18} width={PAPER.w} height={PAPER.h} fill={C.ink} opacity={0.35} />
          <rect x={PAPER.x - PAPER.w / 2} y={PAPER.y - PAPER.h / 2} width={PAPER.w} height={PAPER.h} fill={C.paperLight} />
          <rect x={PAPER.x - PAPER.w / 2 + 20} y={PAPER.y - PAPER.h / 2 + 20} width={PAPER.w - 40} height={PAPER.h - 40} fill="none" stroke={C.paperDeep} strokeWidth={3} />
          <text x={PAPER.x - PAPER.w / 2 + 52} y={PAPER.y + PAPER.h / 2 - 44} fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={40} fill={C.inkMute}>
            Iguanodon
          </text>
          <g transform={`translate(${IG.x} ${IG.y}) scale(${IG.s})`}>
            {IG_SHAPES.map((sh, i) => (
              <path key={i} d={sh.d} transform={`translate(${sh.tx} 0)`} fill={C.theoryTint} opacity={fill * 0.85 * sh.o} />
            ))}
            {IG_SHAPES.map((sh, i) => (
              <Grow key={i} id={`c02-g${i}`} d={sh.d} p={frac(i * 0.12)} color={C.theory} w={5.5} tx={sh.tx} o={sh.o} />
            ))}
          </g>
        </g>
      )}
      {/* the bone leaves the hand and lands ON the nose */}
      {!boneOnStage && <Spike x={fx} y={fy} rot={fr} s={fs} />}
      {sinceHit > 0 && (
        <g>
          <Pulse x={nx} y={ny - 40} r={100} p={sinceHit / 0.9} width={9} />
          <Pulse x={nx} y={ny - 40} r={100} p={(sinceHit - 0.25) / 0.9} width={6} />
        </g>
      )}
      <Tag x={PAPER.x} y={PAPER.y + PAPER.h / 2 + 62} anchor="center" text="Best guess: a nose horn" kind="theory" size={32} p={ramp(t, T.horn + 0.2, T.horn + 0.9)} />
      <Vignette strength={1.1} />
    </Stage>
  );
};

// ---------------------------------------------------------------- Shot C · 46.7–52 — drawn / sculpted / displayed
const HATCH = Array.from({length: 34}, (_, i) => i);

const Drawn: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, [
    [T.years, 960, 540, 1.0],
    [T.sculpted, 960, 520, 1.08],
  ]);
  const outline = ramp(t, T.years + 0.3, T.drawn + 0.1, ease.inOut);
  const hatch = ramp(t, T.years + 1.6, T.drawn + 0.35, ease.linear);
  const F = {x: 960, y: 560, w: 1080, h: 740};
  const S = 0.85;
  const origin = {x: 960 - 15 * S, y: 572 + 13 * S};
  return (
    <Stage bg={C.paperDeep}>
      <rect x={0} y={150} width={1920} height={10} fill={C.paperDark} opacity={0.5} />
      <Cam cam={cam}>
        <g>
          <rect x={F.x - F.w / 2 + 16} y={F.y - F.h / 2 + 22} width={F.w} height={F.h} fill={C.ink} opacity={0.18} />
          <rect x={F.x - F.w / 2} y={F.y - F.h / 2} width={F.w} height={F.h} fill={C.woodDark} />
          <rect x={F.x - F.w / 2 + 22} y={F.y - F.h / 2 + 22} width={F.w - 44} height={F.h - 44} fill={C.wood} />
          <rect x={F.x - F.w / 2 + 54} y={F.y - F.h / 2 + 54} width={F.w - 108} height={F.h - 108} fill={C.paperLight} />
          <rect x={F.x - F.w / 2 + 100} y={F.y - F.h / 2 + 100} width={F.w - 200} height={F.h - 200} fill={C.paper} />
          <rect x={F.x - F.w / 2 + 100} y={F.y - F.h / 2 + 100} width={F.w - 200} height={F.h - 200} fill="none" stroke={C.inkFaint} strokeWidth={2} />
          <g transform={`translate(${origin.x} ${origin.y}) scale(${S})`}>
            <clipPath id="c02-hatch">
              <path d={IG_BODY} />
              <path d={IG_LEG} />
              <path d={IG_LEG} transform="translate(70 0)" />
            </clipPath>
            <g clipPath="url(#c02-hatch)" opacity={0.55}>
              {HATCH.map((i) => {
                const a = ramp(hatch, i / 40, i / 40 + 0.35, ease.linear);
                const x = -430 + i * 28;
                return a > 0 ? <path key={i} d={`M${x} -260 L${x + 120 * a} ${-260 + 520 * a}`} stroke={C.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" /> : null;
              })}
            </g>
            {IG_SHAPES.map((sh, i) => {
              const k = ramp(outline, i * 0.1, 0.65 + i * 0.1);
              return k > 0 ? <path key={i} d={sh.d} transform={`translate(${sh.tx} 0)`} pathLength={1} fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - ease.inOut(k)} /> : null;
            })}
            <path d="M-420 222 L450 222" stroke={C.ink} strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ramp(outline, 0.4, 1)} />
            <g opacity={ramp(outline, 0.55, 0.9)}>
              <Spike x={NOSE.x - 2} y={NOSE.y + 8} rot={NOSE.rot} s={0.62} fill={C.paperLight} shade={C.paperDark} line={C.ink} />
            </g>
          </g>
        </g>
      </Cam>
      <Kicker x={960} y={120} size={36} text="Drawn" color={C.ink} p={ramp(t, T.drawn - 0.12, T.drawn + 0.4)} />
    </Stage>
  );
};

const Statue: React.FC<{x: number; y: number; s: number; stone?: string; shade?: string; idp: string}> = ({x, y, s, stone = C.stone, shade = C.stoneShade, idp}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <clipPath id={`${idp}-clip`}>
      {IG_SHAPES.map((sh, i) => (
        <path key={i} d={sh.d} transform={`translate(${sh.tx} 0)`} />
      ))}
    </clipPath>
    {IG_SHAPES.map((sh, i) => (
      <path key={i} d={sh.d} transform={`translate(${sh.tx} 0)`} fill={i === 0 ? shade : stone} stroke={shade} strokeWidth={3} strokeLinejoin="round" />
    ))}
    <g clipPath={`url(#${idp}-clip)`}>
      <path d="M-420 60 L-120 95 L100 108 L200 60 L450 -120 L450 260 L-420 260 Z" fill={shade} opacity={0.55} />
    </g>
    <Spike x={NOSE.x - 2} y={NOSE.y + 8} rot={NOSE.rot} s={0.62} fill={stone} shade={shade} line={shade} />
  </g>
);

const Sculpted: React.FC<{t: number}> = ({t}) => {
  const rise = ramp(t, T.drawn + 0.62, T.sculpted + 0.42);
  const S = 0.92;
  const top = 800;
  return (
    <Stage bg={mixC(C.ink, C.wood, 0.25)}>
      <rect x={0} y={840} width={1920} height={240} fill={mixC(C.ink, C.woodDark, 0.5)} />
      <LightPool x={960} y={560} r={620} strength={1.4} sy={0.75} />
      <Plinth x={960} y={940} w={1000} h={140} color={C.stoneDark} label={false} />
      <WipeReveal id="c02-sc" x={0} y={0} w={1920} h={1080} p={rise} dir="up">
        <Statue x={940} y={top - 218 * S} s={S} idp="c02-st" />
      </WipeReveal>
      <Particles t={t} x={520} y={450} w={900} h={380} n={34} seed={12} size={[3, 7]} color={C.stone} opacity={[0.3, 0.6]} vy={30} vx={4} />
      <Kicker x={960} y={130} size={36} text="Sculpted" color={C.paperShade} p={ramp(t, T.sculpted - 0.12, T.sculpted + 0.4)} />
      <Vignette strength={1.0} />
    </Stage>
  );
};

const Displayed: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, [
    [T.displayed - 0.4, 960, 560, 1.0],
    [T.wasnt + 0.3, 960, 540, 1.06],
  ]);
  const S = 0.78;
  return (
    <Stage bg={C.paperDeep}>
      <Cam cam={cam}>
        <MuseumHall t={t} windows={4} plinth={false} />
        <Plinth x={960} y={920} w={760} h={330} color={C.inkSoft} label={false} />
        <Statue x={940} y={590 - 218 * S} s={S} idp="c02-dp" stone={mixC(C.stone, C.ink, 0.45)} shade={mixC(C.stoneShade, C.ink, 0.55)} />
        <Crowd x={960} y={1060} w={1500} n={10} rows={2} t={t} seed={7} s={0.58} era="19thc" facing="mixed" />
      </Cam>
      <Kicker x={960} y={140} size={36} text="Displayed" color={C.ink} p={ramp(t, T.displayed - 0.12, T.displayed + 0.4)} />
    </Stage>
  );
};

// ---------------------------------------------------------------- Shot D · 52.1 — evidence vs guess, calm paper
const IG_SPINE = 'M-380 112 C-280 92 -200 40 -140 -10 C-80 -55 0 -72 80 -78 C150 -84 190 -128 215 -168 C235 -200 262 -214 292 -218';
const IG_SKULL = 'M286 -226 C335 -236 385 -222 408 -190 C418 -172 410 -158 395 -156 C360 -152 322 -156 298 -168 C282 -188 280 -212 286 -226 Z';
const IG_BONES: {d: string; w: number; o?: number}[] = [
  {d: 'M-6 -8 L48 96', w: 24},
  {d: 'M48 96 L20 168', w: 18},
  {d: 'M20 168 L98 210', w: 16},
  {d: 'M64 -8 L118 96', w: 22, o: 0.65},
  {d: 'M118 96 L90 168', w: 16, o: 0.65},
  {d: 'M90 168 L168 210', w: 14, o: 0.65},
  {d: 'M170 -42 L222 50', w: 14},
];
const RIBS = [0, 1, 2, 3, 4].map((i) => `M${14 + i * 30} -76 C${i * 30} -20 ${6 + i * 30} 34 ${52 + i * 26} 76`);

const Conclusion: React.FC<{t: number}> = ({t}) => {
  const camK = ramp(t, T.wasnt - 0.5, T.wasnt + 1.5, ease.inOut);
  const z = lerp(1.22, 1.0, camK);
  const S = 1.2;
  const O = {x: 960 - 15 * S, y: 750 + 13 * S};
  const flesh = ramp(t, T.wasnt + 0.3, T.wasnt + 1.9);
  const bones = ramp(t, T.wasnt - 0.2, T.wasnt + 0.65, ease.out);
  const fillP = ramp(t, T.wasnt + 1.3, T.wasnt + 2.3);
  const sub = (a: number, b: number) => ramp(bones, a, b);
  return (
    <Stage bg={C.paper}>
      <Cam cam={{cx: 960, cy: 640, z, r: 0}}>
        <g transform={`translate(${O.x} ${O.y}) scale(${S})`}>
          {IG_SHAPES.map((sh, i) => (
            <path key={i} d={sh.d} transform={`translate(${sh.tx} 0)`} fill={C.theoryTint} opacity={fillP * 0.7 * sh.o} />
          ))}
          {IG_SHAPES.map((sh, i) => (
            <Grow key={i} id={`c02-f${i}`} d={sh.d} p={ramp(flesh, i * 0.1, 0.7 + i * 0.1)} color={C.theory} w={5.5} tx={sh.tx} o={sh.o} />
          ))}
          {/* solid bones = evidence */}
          <g stroke={C.evidence} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={IG_SPINE} pathLength={1} strokeWidth={11} strokeDasharray="1 1" strokeDashoffset={1 - ease.inOut(sub(0, 0.55))} />
            <path d={IG_SKULL} fill={C.evidenceTint} strokeWidth={6} opacity={sub(0.2, 0.5)} />
            <circle cx={366} cy={-196} r={9} fill={C.evidence} stroke="none" opacity={sub(0.3, 0.55)} />
            {RIBS.map((d, i) => (
              <path key={i} d={d} pathLength={1} strokeWidth={8} strokeDasharray="1 1" strokeDashoffset={1 - ease.out(sub(0.3 + i * 0.05, 0.6 + i * 0.05))} />
            ))}
            {IG_BONES.map((b, i) => (
              <path key={i} d={b.d} pathLength={1} strokeWidth={b.w} opacity={b.o ?? 1} strokeDasharray="1 1" strokeDashoffset={1 - ease.out(sub(0.45 + i * 0.05, 0.8 + i * 0.05))} />
            ))}
          </g>
          <g opacity={sub(0.7, 1)}>
            <Spike x={238} y={72} rot={118} s={0.3} fill={C.evidenceTint} shade={C.evidenceLight} line={C.evidence} />
          </g>
        </g>
      </Cam>
      <Headline x={960} y={225} size={84} text="the best possible reading" p={ramp(t, T.best - 0.1, T.best + 1.0)} mode="words" accent={{best: C.oxblood}} />
      <Headline x={960} y={325} size={84} text="of incomplete evidence." p={ramp(t, T.incomplete - 0.1, T.incomplete + 1.0)} mode="words" accent={{incomplete: C.oxblood}} />
      <Kicker x={960} y={125} size={28} text="It wasn't stupidity" p={ramp(t, T.wasnt - 0.2, T.wasnt + 0.4)} />
      <Tag x={190} y={960} anchor="left" text="Bone: evidence" kind="evidence" size={28} p={ramp(t, T.best + 0.3, T.best + 1.0)} />
      <Tag x={1730} y={960} anchor="right" text="Flesh: a guess" kind="theory" size={28} p={ramp(t, T.best + 0.5, T.best + 1.2)} />
    </Stage>
  );
};

// ---------------------------------------------------------------- chapter
export const C02: React.FC<{t: number}> = ({t}) => (
  <Shots
    t={t}
    shots={[
      {start: T.open, render: (t) => <Intro t={t} />},
      {start: T.c19 - 0.1, in: {kind: 'dip', dur: 0.7}, render: (t) => <StudyShot t={t} />},
      {start: T.years, in: {kind: 'push', dir: 'left', dur: 0.5}, render: (t) => <Drawn t={t} />},
      {start: T.drawn + 0.72, in: {kind: 'wipe', dir: 'left', dur: 0.4}, render: (t) => <Sculpted t={t} />},
      {start: T.displayed - 0.15, in: {kind: 'wipe', dir: 'left', dur: 0.4}, render: (t) => <Displayed t={t} />},
      {start: T.wasnt - 0.2, in: {kind: 'fade', dur: 0.4}, render: (t) => <Conclusion t={t} />},
    ]}
  />
);
