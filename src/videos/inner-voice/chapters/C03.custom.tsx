// Custom shots for C03 "What fills the silence" (builder-owned).
import React from 'react';
import {Stage, Cam, breathe} from '../../../kit/stage';
import {C} from '../../../kit/theme';
import {camAt, clamp01, ease, mixHex, noise1, ramp} from '../../../kit/anim';
import {Headline, Kicker, Tag} from '../../../kit/text';
import {CrossOut} from '../../../kit/diagrams';
import {Icon} from '../../../kit/icons';
import {Person} from '../../../kit/people';
import {Room, Plant, Table} from '../../../kit/env';
import {HeadProfile} from '../../../kit/science';
import {LightPool, Particles} from '../../../kit/fx';
import {MindSpace} from '../../../kit/env';
import {Beeper, ThoughtContent} from '../shared';
import type {ThoughtKind} from '../shared';

// ---- cue times (spoken words as comments)
const T = {
  s1: 121.6, // "So what filled the other moments?"
  beep: 121.8,
  pic: 123.98, // "Pictures."
  feel: 124.48, // "A feeling."
  room: 125.4, // "the room" (125.94)
  s2: 128.5, // "And one report that's harder to picture"
  noWords: 131.6, // "with no words" (131.99)
  noImage: 132.8, // "and no image" (133.02)
  debated: 133.9, // "That one is still debated"
  s3: 138.1, // "But the pattern holds."
  empty: 140.6, // "is not an empty mind" (142.02)
  s4: 142.9, // "Picture two people sitting silently"
  narr: 146.0, // "One is narrating"
  why: 147.2, // "Why did I say that?"
  leave: 148.2, // "I need to leave in five minutes."
  other: 149.8, // "The other is moving through images"
  neither: 153.9, // "Neither suspects"
  s5: 156.4, // "And even for people who do hear a voice"
  conv: 159.5, // "Sometimes it's a conversation with yourself."
  word: 161.3, // "Sometimes it's a single word"
  s7: 169.8, // "Watch a two- or three-year-old"
  nobody: 172.6, // "They talk out loud, to nobody"
  priv: 176.2, // "Researchers call it private speech"
  grow: 178.0, // "As children grow, it gets quieter."
  silent: 180.2, // "Then it goes silent."
  s8: 181.3, // "One influential idea"
  between: 185.3, // "Language, which starts as a line between you and other people"
  back: 188.2, // "gets aimed back at yourself"
  fold: 190.0, // "then folded inward"
  evid: 191.0, // "There's real evidence behind it."
  could: 192.8, // "But it explains how the voice could appear"
  messy: 196.9, // "Later work has made the picture messier"
  end: 202.2,
};

const typed = (str: string, t: number, at: number, dur: number) => str.slice(0, Math.floor(str.length * ramp(t, at, at + dur, ease.linear) + 0.0001));
const e = (t: number, a: number, b: number) => ramp(t, a, b, ease.out);
const inv = (v: number) => 1 - v;

// ============ shared helper: speech/inner bubble that can hold children (solid ink or dashed plum) ============
const Bub: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  to?: {x: number; y: number};
  p?: number;
  dashed?: boolean;
  stroke?: string;
  fill?: string;
  sc?: number;
  op?: number;
  children?: React.ReactNode;
}> = ({x, y, w, h, to, p = 1, dashed, stroke = C.ink, fill = C.paperLight, sc = 1, op = 1, children}) => {
  if (p <= 0 || op <= 0) return null;
  const k = ease.outBack(clamp01(p)) * sc;
  const dash = dashed ? '14 10' : undefined;
  let tail: React.ReactNode = null;
  if (to) {
    const dx = to.x - x;
    const dy = to.y - y;
    const a = Math.atan2(dy, dx);
    const bx = Math.cos(a) * w * 0.3;
    const by = Math.sin(a) * h * 0.38;
    const nx = -Math.sin(a) * 18;
    const ny = Math.cos(a) * 18;
    const tx = dx / k;
    const ty = dy / k;
    tail = <path d={`M${bx + nx} ${by + ny} L${tx} ${ty} L${bx - nx} ${by - ny} Z`} fill={fill} stroke={stroke} strokeWidth={5} strokeDasharray={dash} strokeLinejoin="round" />;
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={op}>
      {tail}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.42} fill={fill} stroke={stroke} strokeWidth={5} strokeDasharray={dash} />
      {children}
    </g>
  );
};

// ============ S1–S3 card wall ============
const COLS = 4;
const CR = 125;
const cx = (i: number) => 960 + ((i % COLS) - 1.5) * 300;
const cy = (i: number) => 540 + (Math.floor(i / COLS) - 1) * 290;
const FINAL: ThoughtKind[] = ['words', 'image', 'awareness', 'feeling', 'feeling', 'words', 'image', 'wordless', 'awareness', 'image', 'words', 'feeling'];
const WORDS = ['Call him back.', 'Milk, eggs.', 'Next, colour.'];

type Fill = {idx: number; at: number; dur?: number};

const Wall: React.FC<{t: number; entrance?: number; fills: Fill[]; beepAt?: number[]; showBeeper?: boolean}> = ({t, entrance, fills, beepAt = [], showBeeper = true}) => {
  const wordIdx = [0, 5, 10];
  return (
    <g>
      {FINAL.map((kind, i) => {
        const f = fills.find((q) => q.idx === i);
        const isWord = wordIdx.includes(i);
        const bob = Math.sin(t * 0.9 + i * 1.3) * 4;
        const ep = entrance === undefined ? 1 : ramp(t, entrance + i * 0.05, entrance + i * 0.05 + 0.5, ease.outQuint);
        if (ep <= 0) return null;
        let k: ThoughtKind = 'empty';
        let p = ep;
        if (isWord) {
          k = 'words';
          p = ep;
        } else if (f) {
          const fp = ramp(t, f.at, f.at + (f.dur ?? 0.8), ease.out);
          if (fp > 0) {
            k = kind;
            p = fp;
          }
        }
        return (
          <g key={i} transform={`translate(0 ${bob})`}>
            {k !== 'empty' && !isWord && <ThoughtContent x={cx(i)} y={cy(i)} r={CR} kind="empty" frame="card" p={1} t={t} seed={i + 1} id={`e${i}`} />}
            <ThoughtContent x={cx(i)} y={cy(i)} r={CR} kind={k} frame="card" p={p} t={t} seed={i + 1} id={`w${i}`} text={isWord ? WORDS[wordIdx.indexOf(i)] : undefined} />
          </g>
        );
      })}
      {showBeeper && <Beeper x={1735} y={150} s={0.8} r={-9} t={t} beepAt={beepAt} p={ramp(t, T.s1, T.s1 + 0.5, ease.outQuint)} />}
    </g>
  );
};

// S1 · 121.60 · "So what filled the other moments? Pictures. A feeling. Awareness of the room, the chair, the light."
export const S1: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s1, 960, 540, 1.0], [T.s2, 990, 540, 1.1]]), t);
  const fills: Fill[] = [
    {idx: 6, at: T.pic - 0.1, dur: 0.7},
    {idx: 9, at: T.feel - 0.1, dur: 0.7},
    {idx: 2, at: T.room, dur: 2.6},
  ];
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <Wall t={t} entrance={T.s1 + 0.1} fills={fills} beepAt={[T.beep]} />
      </Cam>
      <Particles t={t} x={0} y={0} w={1920} h={1080} n={14} seed={3} color={C.paperDark} />
    </Stage>
  );
};

const S1_FILLS: Fill[] = [
  {idx: 6, at: 0, dur: 0.01},
  {idx: 9, at: 0, dur: 0.01},
  {idx: 2, at: 0, dur: 0.01},
];

// S2 · 128.50 · "one report that's harder to picture: a specific thought, with no words and no image attached"
export const S2: React.FC<{t: number}> = ({t}) => {
  const base = camAt(t, [[T.s2, 990, 540, 1.1], [T.s2 + 2.3, cx(7), cy(7), 2.6]], ease.inOut);
  const cam = breathe(base, t, 0.6);
  const pw = e(t, T.s2 + 1.6, T.s2 + 2.8);
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <Wall t={t} fills={S1_FILLS} />
        {/* the wordless card */}
        <g transform={`translate(0 ${Math.sin(t * 0.9 + 8.3) * 4})`}>
          <ThoughtContent x={cx(7)} y={cy(7)} r={CR} kind="wordless" frame="card" p={pw} t={t} seed={8} id="wl" />
        </g>
      </Cam>
      {/* icons crossed out, screen space */}
      <g opacity={e(t, T.noWords - 0.5, T.noWords - 0.1)}>
        <circle cx={520} cy={540} r={120} fill={C.paperShade} stroke={C.ink} strokeWidth={5}/>
        <Icon name="speech" x={520} y={540} s={1.9} color={C.inkMute} p={e(t, T.noWords - 0.5, T.noWords)} />
        <CrossOut x={520} y={540} size={190} p={ramp(t, T.noWords, T.noWords + 0.45)} />
      </g>
      <g opacity={e(t, T.noImage - 0.5, T.noImage - 0.1)}>
        <circle cx={1400} cy={540} r={120} fill={C.paperShade} stroke={C.ink} strokeWidth={5}/>
        <Icon name="house" x={1400} y={540} s={1.9} color={C.inkMute} p={e(t, T.noImage - 0.5, T.noImage)} />
        <CrossOut x={1400} y={540} size={190} p={ramp(t, T.noImage, T.noImage + 0.45)} />
      </g>
      <Tag x={960} y={960} anchor="center" kind="caution" size={46} text="Still debated — a report, not a verdict" p={ramp(t, T.debated, T.debated + 0.6)} />
    </Stage>
  );
};

// S3 · 138.10 · "But the pattern holds. A mind without a constant voice is not an empty mind."
export const S3: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s3, cx(7), cy(7), 2.6], [T.s3 + 2.0, 960, 610, 0.88]], ease.inOut), t, 0.6);
  const order = [1, 3, 4, 8, 11, 6, 9, 2];
  const fills: Fill[] = order.map((idx, n) => ({idx, at: T.s3 + 0.5 + n * 0.16, dur: idx === 6 || idx === 9 || idx === 2 ? 0.01 : 0.7}));
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <Wall t={t} fills={fills} />
        <ThoughtContent x={cx(7)} y={cy(7)} r={CR} kind="wordless" frame="card" p={1} t={t} seed={8} id="wl" />
      </Cam>
      <Headline x={960} y={950} text="Not an empty mind." size={92} mode="words" accent={{empty: C.oxblood}} p={ramp(t, T.empty, T.empty + 1.6)} />
    </Stage>
  );
};

// ============ S4 · two people, one room ============
const Sofa: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-250} y={-250} width={500} height={170} rx={34} fill={mixHex(C.inkMute, C.theory, 0.3)} />
    <rect x={-290} y={-170} width={64} height={120} rx={26} fill={mixHex(C.inkMute, C.theory, 0.15)} />
    <rect x={-268} y={-100} width={540} height={70} rx={20} fill={C.inkMute} />
    <rect x={-268} y={-40} width={540} height={20} fill={C.inkLift} />
    <rect x={-240} y={-20} width={20} height={20} fill={C.woodDark} />
    <rect x={220} y={-20} width={20} height={20} fill={C.woodDark} />
  </g>
);
const Armchair: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-140} y={-260} width={290} height={190} rx={36} fill={C.woodLight} />
    <rect x={-170} y={-150} width={60} height={110} rx={24} fill={mixHex(C.woodLight, C.wood, 0.5)} />
    <rect x={-160} y={-100} width={330} height={70} rx={20} fill={mixHex(C.woodLight, C.paper, 0.1)} />
    <rect x={-160} y={-40} width={330} height={20} fill={C.wood} />
    <rect x={-135} y={-20} width={18} height={20} fill={C.woodDark} />
    <rect x={120} y={-20} width={18} height={20} fill={C.woodDark} />
  </g>
);

const FLOOR_Y = 880;
const SC = 0.95;
const HEAD_L = {x: 560, y: 480};
const HEAD_R = {x: 1400, y: 480};

// S4 · 142.90 · "Picture two people sitting silently in the same room. One is narrating… The other…"
export const S4: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(
    camAt(t, [
      [T.s4, 960, 540, 1.0],
      [T.s4 + 2.4, 960, 540, 1.04],
      [T.narr - 0.3, 800, 500, 1.1],
      [T.why + 0.4, 690, 490, 1.24],
      [T.other - 0.4, 690, 490, 1.24],
      [T.other + 0.9, 1000, 510, 1.04],
      [T.neither - 0.2, 1000, 510, 1.04],
      [T.neither + 1.6, 960, 540, 0.98],
    ]),
    t,
    0.8,
  );
  const wallP = ramp(t, T.neither, T.neither + 1.4, ease.inOut);
  const glance = e(t, T.neither + 0.6, T.neither + 1.2);
  const smile = e(t, T.neither + 1.2, T.neither + 1.6);
  const imgSlots = [
    {x: 1660, y: 400, kind: 'image' as ThoughtKind, at: T.other + 0.0},
    {x: 1500, y: 240, kind: 'feeling' as ThoughtKind, at: T.other + 1.5},
    {x: 1290, y: 340, kind: 'awareness' as ThoughtKind, at: T.other + 2.8},
  ];
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <Room era="modern" window="square" windowX={960} door={false} sky="dusk" t={t} seed={4} />
        <rect x={-300} y={0} width={2520} height={1080} fill={C.ink} opacity={0.13} />
        <Plant x={110} y={FLOOR_Y} s={1.5} kind="tall" t={t} />
        {/* floor lamp */}
        <g transform={`translate(1790 ${FLOOR_Y})`}>
          <rect x={-5} y={-440} width={10} height={440} fill={C.woodDark} />
          <rect x={-45} y={-8} width={90} height={12} rx={5} fill={C.woodDark} />
          <path d="M-60 -430 L-36 -520 L36 -520 L60 -430 Z" fill={C.cautionTint} />
        </g>
        <LightPool x={1790} y={-470 + FLOOR_Y} r={430} strength={1.1} />
        <Sofa x={470} y={FLOOR_Y} />
        <Armchair x={1500} y={FLOOR_Y} />
        <Person x={560} y={FLOOR_Y - 8} s={SC} sit={1} facing={1} outfit="casual" skin={1} hair="short" t={t} seed={3} look={glance * 0.8} expression={smile > 0.5 ? 'smile' : 'neutral'} />
        <Person x={1400} y={FLOOR_Y - 8} s={SC} sit={1} facing={-1} outfit="casual" top={C.evidenceLight} skin={3} hair="curly" t={t} seed={7} look={glance * 0.8} expression={smile > 0.5 ? 'smile' : 'neutral'} />

        {/* left: narrating (dashed words) */}
        <Bub x={480} y={330} w={560} h={120} dashed stroke={C.theory} to={HEAD_L} p={ramp(t, T.narr - 0.15, T.narr + 0.5)}>
          <text x={-235} y={14} textAnchor="start" fontFamily="Fraunces, Georgia, serif" fontStyle="italic" fontSize={48} fill={C.theory}>{typed('Why did I say that?', t, T.why, 0.9)}</text>
        </Bub>
        <Bub x={760} y={185} w={800} h={120} dashed stroke={C.theory} p={ramp(t, T.leave - 0.35, T.leave + 0.2)}>
          <text x={-350} y={14} textAnchor="start" fontFamily="Fraunces, Georgia, serif" fontStyle="italic" fontSize={46} fill={C.theory}>{typed('I need to leave in five minutes.', t, T.leave, 1.5)}</text>
        </Bub>

        {/* right: images and sensations, no words */}
        {[0, 1, 2].map((n) => {
          const s = imgSlots[n];
          const p = ramp(t, s.at, s.at + 0.7, ease.outQuint);
          const next = n < 2 ? imgSlots[n + 1].at : 1e9;
          const dim = 1 - 0.4 * ramp(t, next, next + 0.6);
          if (p <= 0) return null;
          return (
            <g key={n} opacity={dim}>
              <circle cx={s.x} cy={s.y} r={108 * ease.outQuint(p)} fill="none" stroke={C.theory} strokeWidth={4} strokeDasharray="12 10" />
              <ThoughtContent x={s.x} y={s.y + Math.sin(t * 1.2 + n) * 5} r={95} kind={s.kind} frame="circle" p={p} t={t} seed={n + 4} id={`o${n}`} />
            </g>
          );
        })}
        {ramp(t, T.other - 0.1, T.other + 0.4) > 0 && (
          <g fill="none" stroke={C.theory} strokeWidth={4} strokeDasharray="8 10" opacity={ramp(t, T.other - 0.1, T.other + 0.4)}>
            <circle cx={1450} cy={400} r={9} />
            <circle cx={1490} cy={360} r={14} />
          </g>
        )}

        {/* the invisible wall */}
        {wallP > 0 && (
          <g>
            <rect x={955} y={120} width={10} height={760 * wallP} fill={C.theory} opacity={0.1} />
            <line x1={960} y1={120} x2={960} y2={120 + 760 * wallP} stroke={C.theory} strokeWidth={6} strokeDasharray="16 14" strokeLinecap="round" />
          </g>
        )}
      </Cam>
    </Stage>
  );
};

// ============ S5 · ink mind-space ============
const WordBars: React.FC<{x: number; y: number; n: number; seed: number; lit: number; color: string}> = ({x, y, n, seed, lit, color}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const w = 50 + ((seed * 37 + i * 53) % 90);
      let ox = 0;
      for (let j = 0; j < i; j++) ox += 50 + ((seed * 37 + j * 53) % 90) + 16;
      return <rect key={i} x={x + ox} y={y} width={w} height={20} rx={10} fill={color} opacity={0.25 + 0.75 * clamp01(lit * n - i)} />;
    })}
  </g>
);

// S5 · 156.40 · "And even for people who do hear a voice, it isn't one thing…"
export const S5: React.FC<{t: number}> = ({t}) => {
  const PL = C.theoryLight;
  const phase2 = e(t, T.word - 0.15, T.word + 0.5);
  const phase1 = inv(phase2) * e(t, T.s5 + 0.2, T.s5 + 0.9);
  // ping-pong: 6 turns between conv and word
  const per = 0.5;
  const tt = Math.max(0, t - T.conv);
  const turn = Math.floor(tt / per);
  const inTurn = (tt % per) / per;
  const leftTurn = turn % 2 === 0;
  const litL = t < T.conv ? 0 : leftTurn ? ease.out(clamp01(inTurn * 1.4)) : 1 - ease.in(clamp01(inTurn));
  const litR = t < T.conv ? 0 : !leftTurn ? ease.out(clamp01(inTurn * 1.4)) : 1 - ease.in(clamp01(inTurn));
  const dotX = leftTurn ? 700 + 520 * ease.inOut(inTurn) : 1220 - 520 * ease.inOut(inTurn);
  const dotY = 215 - Math.sin(inTurn * Math.PI) * 60;
  const HEAD = {x: 960, y: 800, s: 0.66};
  const kp = e(t, T.word + 0.2, T.word + 0.9);
  return (
    <Stage bg={C.ink}>
      <MindSpace t={t} bg="ink" seed={5} />
      <HeadProfile x={HEAD.x} y={HEAD.y} s={HEAD.s} facing="right" skin={C.skin[2]} t={t} />
      {/* phase 1: a conversation with yourself */}
      <g opacity={phase1}>
        <Bub x={640} y={340} w={400} h={140} dashed stroke={PL} fill={C.inkSoft} to={{x: 900, y: 590}} p={e(t, T.s5 + 0.3, T.s5 + 1)}>
          <WordBars x={-165} y={-10} n={3} seed={2} lit={litL} color={C.paperShade} />
        </Bub>
        <Bub x={1280} y={340} w={400} h={140} dashed stroke={PL} fill={C.inkSoft} to={{x: 1020, y: 590}} p={e(t, T.s5 + 0.6, T.s5 + 1.3)}>
          <WordBars x={-165} y={-10} n={3} seed={5} lit={litR} color={C.paperShade} />
        </Bub>
        {t >= T.conv && t < T.word && <circle cx={dotX} cy={dotY + 120} r={11} fill={PL} />}
        <Kicker x={960} y={170} text="A CONVERSATION WITH YOURSELF" size={44} color={C.paperShade} p={e(t, T.conv - 0.4, T.conv + 0.4)} />
      </g>
      {/* phase 2: one word, a whole thought */}
      {phase2 > 0 && (
        <g opacity={phase2}>
          <Kicker x={960} y={170} text="ONE WORD, A WHOLE THOUGHT" size={44} color={C.paperShade} p={e(t, T.word, T.word + 0.6)} />
          {/* connectors */}
          <g stroke={PL} strokeWidth={4} strokeDasharray="10 12" fill="none" strokeLinecap="round" opacity={0.7}>
            <path d="M870 340 Q740 330 690 340" pathLength={1} strokeDashoffset={0} opacity={kp} />
            <path d="M1050 340 Q1180 330 1230 340" opacity={kp} />
            <path d="M960 432 L960 450" opacity={kp} />
          </g>
          <Bub x={960} y={340} w={360} h={180} dashed stroke={PL} fill={C.inkSoft} to={{x: 960, y: 600}} p={e(t, T.word + 0.1, T.word + 0.7)}>
            <text x={0} y={32} textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontStyle="italic" fontWeight={600} fontSize={100} fill={C.paperLight}>Keys!</text>
          </Bub>
          <g opacity={0.8}>
            <Icon name="key" x={610} y={340} s={1.5} color={PL} accent={C.paperShade} knock={C.ink} p={e(t, T.word + 0.9, T.word + 1.5)} />
            <g opacity={e(t, T.word + 1.3, T.word + 1.9)} transform={`translate(960 ${510 - (1 - e(t, T.word + 1.3, T.word + 1.9)) * 20})`}>
              <rect x={-44} y={-62} width={88} height={124} rx={6} fill="none" stroke={PL} strokeWidth={7} />
              <rect x={-30} y={-48} width={60} height={96} fill={PL} opacity={0.25} />
              <circle cx={20} cy={4} r={7} fill={PL} />
            </g>
            <Icon name="clock" x={1310} y={340} s={1.5} color={PL} accent={C.paperShade} knock={C.ink} p={e(t, T.word + 1.7, T.word + 2.3)} />
          </g>
        </g>
      )}
    </Stage>
  );
};

// ============ S7 · toddler private speech ============
const ShapeIcon: React.FC<{kind: number; color?: string}> = ({kind, color = C.ink}) => {
  if (kind === 0)
    return (
      <g fill="none" stroke={color} strokeWidth={7} strokeLinejoin="round">
        <circle cx={-46} cy={0} r={22} />
        <rect x={0} y={-22} width={44} height={44} />
        <path d="M70 22 L92 -22 L114 22 Z" transform="translate(-22 0)" />
      </g>
    );
  if (kind === 1)
    return (
      <g fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M-60 0 L50 0" />
        <path d="M18 -34 L56 0 L18 34" />
      </g>
    );
  if (kind === 2)
    return (
      <g fill="none" stroke={color} strokeWidth={8} strokeLinecap="round">
        <path d="M-24 -18 Q-24 -46 2 -46 Q30 -46 30 -20 Q30 -4 4 4 L4 16" />
        <circle cx={4} cy={42} r={3} fill={color} />
      </g>
    );
  return (
    <g fill="none" stroke={color} strokeWidth={7} strokeLinejoin="round">
      <rect x={-70} y={-22} width={44} height={44} />
      <path d="M-4 0 L30 0" strokeLinecap="round" />
      <circle cx={56} cy={0} r={22} />
    </g>
  );
};

// S7 · 169.80 · "Watch a two- or three-year-old working through a problem. They talk out loud, to nobody…"
export const S7: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s7, 900, 590, 1.15], [T.priv, 920, 590, 1.22], [T.end, 900, 590, 1.15]]), t, 0.8);
  const g = ramp(t, T.grow, T.silent + 0.2, ease.inOut);
  const s = 1.15 + 0.24 * g;
  const CUSH = 620;
  const HIP = 835;
  const FY = HIP + 0.62 * s * 118;
  const FX = CUSH + 104 * 0.62 * s;
  // child head approx (child is 0.62 * s * ~540 tall; head near top)
  const headY = HIP - 0.62 * s * 400;
  const headX = CUSH + 20;
  const bubbles = [
    {at: T.nobody - 0.2, kind: 0, x: 330, y: 400},
    {at: T.nobody + 1.0, kind: 1, x: 700, y: 260},
    {at: T.nobody + 2.0, kind: 2, x: 960, y: 420},
    {at: T.nobody + 3.0, kind: 3, x: 1000, y: 250},
  ];
  const shrink = 1 - 0.55 * g;
  const fade = 1 - ramp(t, T.silent - 0.6, T.silent + 0.1);
  const slip = ramp(t, T.silent, T.silent + 1.1, ease.inOut);
  const talk = t > T.nobody - 0.3 && t < T.silent - 0.5 ? Math.abs(Math.sin(t * 8)) : 0;
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <Room era="modern" window="square" windowX={1500} door={false} wall={C.paperLight} t={t} seed={9} />
        <ellipse cx={960} cy={900} rx={560} ry={60} fill={C.cautionTint} />
        <ellipse cx={960} cy={900} rx={440} ry={40} fill={C.oxTint} opacity={0.5} />
        {/* toy blocks */}
        <rect x={210} y={856} width={52} height={52} fill={C.evidenceLight} />
        <rect x={236} y={812} width={44} height={44} fill={C.cautionLight} />
        <rect x={CUSH - 110} y={HIP + 6} width={220} height={62} rx={26} fill={C.oxTint} /><rect x={CUSH - 110} y={HIP + 44} width={220} height={24} rx={12} fill={C.oxLight} opacity={0.6} />
        {/* shape sorter box */}
        <g transform={`translate(1030 915) scale(1.5)`}>
          <rect x={-70} y={-86} width={140} height={86} fill={C.oxLight} />
          <rect x={-70} y={-86} width={140} height={14} fill={C.oxTint} />
          <circle cx={-34} cy={-50} r={13} fill={C.ink} />
          <rect x={-8} y={-62} width={24} height={24} fill={C.ink} />
          <path d="M36 -38 L48 -62 L60 -38 Z" fill={C.ink} />
          <circle cx={-110} cy={-14} r={16} fill={C.cautionLight} />
          <rect x={94} y={-26} width={26} height={26} fill={C.evidenceLight} />
        </g>
        <Person x={FX} y={FY} s={s} age="child" facing={1} outfit="casual" top={C.cautionLight} bottom={C.theoryLight} skin={2} hair="short" sit={1} arms={{front: [62, 28], back: [18, 8]}} talk={talk} expression={t > T.silent ? 'neutral' : 'thinking'} t={t} seed={11} />
        {/* solid private-speech bubbles with only icons */}
        {bubbles.map((b, i) => {
          const p = ramp(t, b.at, b.at + 0.5);
          if (p <= 0) return null;
          const last = i === 3;
          // earlier bubbles shrink + fade with growth
          if (!last) {
            return (
              <Bub key={i} x={b.x} y={b.y} w={290} h={150} to={{x: headX, y: headY}} p={p} sc={shrink} op={inv(ramp(t, T.grow + i * 0.35, T.grow + i * 0.35 + 1.4)) * 1}>
                <ShapeIcon kind={b.kind} />
              </Bub>
            );
          }
          // last bubble: stays, turns dashed plum, slips inside the head
          const px = b.x + (headX - b.x) * slip;
          const py = b.y + (headY - 20 - b.y) * slip;
          const sc = shrink * (1 - 0.62 * slip);
          const plum = ramp(t, T.silent, T.silent + 0.35);
          return (
            <Bub
              key={i}
              x={px}
              y={py}
              w={250}
              h={130}
              p={p}
              sc={sc}
              dashed={plum > 0.5}
              stroke={plum > 0.5 ? C.theory : C.ink}
              fill={plum > 0.5 ? mixHex(C.paperLight, C.theoryTint, 0.5) : C.paperLight}
              to={slip < 0.5 ? {x: headX, y: headY} : undefined}
              op={1 - 0.25 * slip}
            >
              <ShapeIcon kind={b.kind} color={plum > 0.5 ? C.theory : C.ink} />
            </Bub>
          );
        })}
      </Cam>
      <Tag x={900} y={700} kind="confirmed" size={46} text="Private speech" p={ramp(t, T.priv, T.priv + 0.5)} />
    </Stage>
  );
};

// ============ S8 · language folds inward ============
export const S8: React.FC<{t: number}> = ({t}) => {
  const L = {x: 540, y: 570};
  const R = {x: 1380, y: 570};
  const SH = 1.05;
  const draw = ramp(t, T.between - 0.4, T.between + 1.4, ease.inOut);
  const trav = Math.min(draw, ramp(t, T.between + 0.2, T.between + 2.5, ease.inOut));
  const bend = ramp(t, T.back - 0.3, T.back + 1.5, ease.inOut);
  const fold = ramp(t, T.fold - 0.1, T.fold + 1.4, ease.inOut);
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
  // mouth of the left head
  const P0 = {x: L.x + 215 * SH, y: L.y + 80 * SH};
  // end target: other head (ear) -> back to left head -> inside the head
  const endX = lerp(lerp(R.x - 170 * SH, L.x + 40, bend), L.x - 20, fold);
  const endY = lerp(lerp(R.y - 10, L.y - 120 * SH, bend), L.y - 40, fold);
  const ctlX = lerp(lerp(960, 880, bend), L.x + 150, fold);
  const ctlY = lerp(lerp(P0.y - 40, 190, bend), L.y - 280 * SH, fold);
  const d = `M${P0.x} ${P0.y} Q${ctlX} ${ctlY} ${endX} ${endY}`;
  const col = mixHex(C.ink, C.theory, fold);
  const bez = (u: number) => ({x: (1 - u) * (1 - u) * P0.x + 2 * (1 - u) * u * ctlX + u * u * endX, y: (1 - u) * (1 - u) * P0.y + 2 * (1 - u) * u * ctlY + u * u * endY});
  const bp = bez(trav);
  const bubP = ramp(t, T.between - 0.4, T.between + 0.1);
  const bubSc = 1 - 0.65 * ramp(t, T.fold, T.fold + 1.0, ease.inOut);
  const bubPlum = ramp(t, T.fold + 0.1, T.fold + 0.5);
  const bubOp = 1 - ramp(t, T.fold + 1.1, T.fold + 1.6);
  // spiral inside the head
  const sp = ramp(t, T.fold + 0.4, T.fold + 1.4);
  const spiral = (() => {
    let s = '';
    const cxs = L.x - 10;
    const cys = L.y - 50;
    for (let i = 0; i <= 40; i++) {
      const a = i * 0.34;
      const r = 118 - i * 2.7;
      s += `${i === 0 ? 'M' : 'L'}${cxs + Math.cos(a) * r} ${cys + Math.sin(a) * r * 0.9} `;
    }
    return s;
  })();
  // three origins
  const split = ramp(t, T.messy, T.messy + 1.4, ease.inOut);
  const rFade = 1;
  const strands = [
    {from: {x: 70, y: 150}, c: {x: 330, y: 190}, ph: 0},
    {from: {x: 1060, y: 90}, c: {x: 800, y: 150}, ph: 7},
    {from: {x: 80, y: 990}, c: {x: 330, y: 780}, ph: 13},
  ];
  const cam = camAt(t, [[T.messy - 0.2, 960, 540, 1.0], [T.messy + 1.2, 930, 540, 0.9], [T.messy + 2.2, 930, 540, 0.9], [T.end, L.x - 10, L.y - 50, 5.2]], ease.inOut);
  const inkR = ramp(t, T.end - 1.5, T.end - 0.2, ease.inOut);
  return (
    <Stage bg={C.paper}>
      <Cam cam={breathe(cam, t, 0.6)}>
        <g opacity={rFade}>
          <HeadProfile x={R.x} y={R.y} s={SH} facing="left" skin={C.skin[3]} t={t} />
        </g>
        <HeadProfile x={L.x} y={L.y} s={SH} facing="right" skin={C.skin[1]} t={t} />
        {draw > 0 && <path d={d} fill="none" stroke={col} strokeWidth={10} strokeLinecap="round" strokeDasharray={fold > 0.7 ? '16 12' : undefined} pathLength={1} style={draw < 1 ? {strokeDasharray: `${draw} 1`} : undefined} opacity={1 - split * 0.5} />}
        {bubP > 0 && (
          <Bub x={bp.x} y={bp.y - 30} w={210} h={140} p={bubP} sc={bubSc} op={bubOp} dashed={bubPlum > 0.5} stroke={bubPlum > 0.5 ? C.theory : C.ink} fill={bubPlum > 0.5 ? C.theoryTint : C.paperLight}>
            <rect x={-66} y={-34} width={132} height={17} rx={6} fill={bubPlum > 0.5 ? C.theory : C.ink} />
            <rect x={-66} y={-4} width={92} height={17} rx={6} fill={bubPlum > 0.5 ? C.theory : C.ink} />
            <rect x={-66} y={26} width={112} height={17} rx={6} fill={bubPlum > 0.5 ? C.theory : C.ink} />
          </Bub>
        )}
        {/* #5 evidence cards pinned on the folded line */}
        {[0, 1, 2].map((i) => {
          const q = ease.outBack(ramp(t, T.evid - 0.15 + i * 0.25, T.evid + 0.35 + i * 0.25)) * (1 - ramp(t, T.messy - 0.5, T.messy + 0.1));
          if (q <= 0.01) return null;
          const cpos = [{x: 930, y: 610}, {x: 900, y: 440}, {x: 720, y: 350}][i];
          const pin = bez([0.15, 0.45, 0.7][i]);
          return (
            <g key={i}>
              <line x1={pin.x} y1={pin.y} x2={cpos.x} y2={cpos.y} stroke={C.evidence} strokeWidth={4} opacity={q} />
              <g transform={`translate(${cpos.x} ${cpos.y}) rotate(${[-4, 3, -3][i]}) scale(${q})`}>
                <rect x={-100} y={-70} width={200} height={140} rx={12} fill={C.paperLight} stroke={C.evidence} strokeWidth={6} />
                <rect x={-70} y={-40} width={140} height={14} rx={5} fill={C.evidenceTint} />
                <rect x={-70} y={-12} width={100} height={14} rx={5} fill={C.evidenceTint} />
                <rect x={-70} y={16} width={120} height={14} rx={5} fill={C.evidenceTint} />
              </g>
              <circle cx={pin.x} cy={pin.y} r={9 * q} fill={C.evidence} />
            </g>
          );
        })}
        {/* #6 could / did: origin gets a dashed mustard circle with ? */}
        {(() => {
          const qp = ramp(t, T.could - 0.2, T.could + 0.4) * (1 - ramp(t, T.messy - 0.4, T.messy + 0.1));
          if (qp <= 0) return null;
          const k = ease.outBack(qp);
          return (
            <g transform={`translate(${P0.x} ${P0.y}) scale(${k})`} opacity={qp}>
              <circle r={82} fill={C.paperLight} fillOpacity={0.85} stroke={C.caution} strokeWidth={7} strokeDasharray="14 11" />
              <text x={0} y={34} textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight={700} fontSize={104} fill={C.caution}>?</text>
            </g>
          );
        })()}
        {sp > 0 && <path d={spiral} fill="none" stroke={C.theory} strokeWidth={9} strokeLinecap="round" strokeDasharray="16 12" opacity={sp * (1 - 0.3 * split)} />}
        {split > 0 &&
          strands.map((s, i) => {
            const p2 = ramp(t, T.messy - 0.1 + i * 0.2, T.messy - 0.1 + i * 0.2 + 1.2, ease.out);
            const tx = L.x - 10;
            const ty = L.y - 50;
            return (
              <g key={i}>
                <path d={`M${tx} ${ty} Q${s.c.x} ${s.c.y} ${s.from.x} ${s.from.y}`} fill="none" stroke={C.theory} strokeWidth={9} strokeLinecap="round" strokeDasharray="14 12" pathLength={1} style={{strokeDasharray: p2 < 1 ? `${p2} 1` : '0.025 0.02'}} strokeDashoffset={p2 < 1 ? 0 : -((t * 0.06 + s.ph) % 0.045)} />
                <circle cx={s.from.x} cy={s.from.y} r={17 * ease.outBack(ramp(p2, 0.8, 1))} fill={C.theory} />
              </g>
            );
          })}
        <circle cx={L.x - 10} cy={L.y - 50} r={1600 * inkR} fill={C.ink} />
      </Cam>
      <Tag x={960} y={150} anchor="center" kind="theory" size={46} text="One influential idea" p={ramp(t, T.s8 - 0.1, T.s8 + 0.5) * inv(ramp(t, T.evid - 0.2, T.evid + 0.4))} />
      <Tag x={960} y={150} anchor="center" kind="confirmed" size={46} text="Real evidence behind it" p={ramp(t, T.evid, T.evid + 0.5) * inv(ramp(t, T.messy - 0.4, T.messy + 0.2))} />
      <Tag x={960} y={218} anchor="center" kind="caution" size={46} text="How it could appear — not how it did" p={ramp(t, T.could - 0.1, T.could + 0.5) * inv(ramp(t, T.messy - 0.4, T.messy + 0.2))} />
    </Stage>
  );
};
