// Custom shots for C08 · 512.6–574.8 · "The mind next to yours" — personal, the one move, bookend, final image.
import React from 'react';
import {Stage, Cam, World, breathe} from '../../../kit/stage';
import {C, FONT_SANS, FONT_SERIF} from '../../../kit/theme';
import {CamState, camAt, clamp01, ease, lerp, ramp, rand, win} from '../../../kit/anim';
import {Kicker, Tag, Circled} from '../../../kit/text';
import {Bubble} from '../../../kit/cards';
import {LightPool, Particles, Pulse} from '../../../kit/fx';
import {HeadProfile} from '../../../kit/science';
import {Person} from '../../../kit/people';
import {Window, Plant, Bench} from '../../../kit/env';
import {DecoderRig, DECODER_HEAD, SilentWave, ThoughtContent, Beeper, beepFlash} from '../shared';
import {NightRig} from '../shared/NightRoom';
import {mix} from '../shared/util';

const T = {
  s1: 512.6, // "…starts being about you."
  oneMind: 518.0, // "exactly one mind"
  average: 520.8, // "the average one"
  s2: 521.9, // "The mistake isn't believing something false"
  nextTo: 525.5, // "the person next to you"
  s3: 527.9, // "So try one move."
  beep: 529.3, // "catch yourself mid-thought"
  snap: 532.3, // "what was actually there a second ago"
  words: 533.6, // "Words?"
  pic: 534.4, // "A picture?"
  feel: 535.2, // "A feeling?"
  habit: 536.0, // "Not your habit."
  moment: 537.05, // "That moment."
  bars: 538.2, // "Researchers lean on moments…"
  summ: 539.7, // "summaries"
  s4: 542.3, // "…ask them about a moment too."
  hear: 547.0, // "Not 'do you hear a voice?'"
  what: 548.65, // "but 'what was in your head just then?'"
  reply: 550.0,
  s5: 550.96, // "Four words, thought, never spoken."
  cable: 553.84, // "A computer, listening…"
  typed: 555.5,
  noSound: 558.3, // "There was no sound to catch."
  taken: 559.84, // "What it found was language with the sound taken out."
  s6: 562.84, // "Language was built to travel between minds."
  travel: 563.9,
  home: 565.4, // "In yours, it also learned to stay home."
  stay: 567.0, // "stay home"
  s7: 568.3, // "The sources for this video are in the description."
  end: 574.8,
};
const e = (t: number, a: number, b: number, fn: (x: number) => number = ease.out) => ramp(t, a, b, fn);
const PHRASE = 'chitty chitty bang bang';

// ───────────────────────── the decoder room (copied from C01 so S5 echoes it exactly) ─────────────────────────
const RIG = {x: 1060, y: 940, s: 1.25};
const rw = (lx: number, ly: number) => ({x: RIG.x + lx * RIG.s, y: RIG.y + ly * RIG.s});
const HEAD = rw(DECODER_HEAD.x, DECODER_HEAD.y); // ≈ (517, 497)
const MOUTH = {x: HEAD.x + 40, y: HEAD.y + 34};
const PED = rw(DECODER_HEAD.x - 16 + 2, DECODER_HEAD.y - 58 - 12);
const GLASS = {x: -160, y: -526, w: 500, h: 300}; // rig-local monitor glass
const SCREEN_C = rw(GLASS.x + GLASS.w / 2, GLASS.y + GLASS.h / 2); // ≈ (1172, 470)
const scr = (cam: CamState, p: {x: number; y: number}) => ({x: (p.x - cam.cx) * cam.z + 960, y: (p.y - cam.cy) * cam.z + 540});

/** A thin solid line at the lips that stays perfectly flat (nothing leaves the mouth). */
const FlatLine: React.FC<{x: number; y: number; w: number; p: number; color: string; width?: number}> = ({x, y, w, p, color, width = 5}) =>
  p <= 0 ? null : <line x1={x} y1={y} x2={x + w * p} y2={y} stroke={color} strokeWidth={width} strokeLinecap="round" />;

const RigWorld = NightRig; // shared night room + flat lighting (../shared/NightRoom)

// ───────────────────────── the tram carriage (S1, S2) ─────────────────────────
const CAR_FLOOR = 930;
const CS = 0.95; // passenger scale
const SEAT_DX = -104 * CS; // hips sit this far behind the feet (facing right)
const HEAD_DY = -(118 + 262) * CS; // approx head centre above the feet when seated
const PAX = [
  {x: 250, skin: 1, hair: 'short', top: C.cautionLight, seed: 31},
  {x: 700, skin: 2, hair: 'ponytail', top: C.evidenceLight, seed: 32, you: true},
  {x: 1070, skin: 3, hair: 'curly', top: C.theoryLight, seed: 33, next: true},
  {x: 1420, skin: 0, hair: 'bun', top: C.slate, seed: 34},
  {x: 1760, skin: 4, hair: 'short', top: C.cautionTint, seed: 35},
] as const;
const headOf = (x: number) => ({x: x + SEAT_DX * 0.2 + 18, y: CAR_FLOOR + HEAD_DY});

const Carriage: React.FC<{t: number}> = ({t}) => {
  const wall = mix(C.paperShade, C.lamp, 0.16);
  const off = (t * 70) % 520;
  return (
    <g>
      <rect x={-600} y={-300} width={3200} height={1700} fill={wall} />
      {/* windows onto an evening city sliding by */}
      <rect x={-600} y={110} width={3200} height={360} fill={C.night} />
      {[-1, 0, 1, 2, 3, 4].map((i) => {
        const bx = i * 520 - off;
        return (
          <g key={i}>
            {[0, 1, 2].map((k) => {
              const h = 90 + rand(i * 5 + k + 1) * 150 + (k === 1 ? 40 : 0);
              const x = bx + k * 170;
              return (
                <g key={k}>
                  <rect x={x} y={470 - h} width={130} height={h} fill={C.inkSoft} />
                  {[0, 1, 2].map((r) => (
                    <rect key={r} x={x + 18 + (r % 2) * 50} y={470 - h + 20 + r * 38} width={22} height={16} fill={C.lamp} opacity={rand(i * 13 + k * 3 + r) > 0.4 ? 0.7 : 0.12} />
                  ))}
                </g>
              );
            })}
          </g>
        );
      })}
      {[260, 800, 1340, 1880].map((x) => (
        <rect key={x} x={x - 26} y={100} width={52} height={380} fill={wall} />
      ))}
      <rect x={-600} y={470} width={3200} height={20} fill={mix(wall, C.ink, 0.25)} />
      <rect x={-600} y={90} width={3200} height={24} fill={mix(wall, C.ink, 0.18)} />
      {/* lower panel + floor */}
      <rect x={-600} y={490} width={3200} height={CAR_FLOOR - 490} fill={mix(wall, C.paperDeep, 0.5)} />
      <rect x={-600} y={CAR_FLOOR} width={3200} height={500} fill={C.paperDark} />
      <rect x={-600} y={CAR_FLOOR} width={3200} height={8} fill={C.inkMute} opacity={0.5} />
      {/* ceiling rail + swaying straps */}
      <rect x={-600} y={40} width={3200} height={16} fill={C.inkLift} />
      {[120, 540, 980, 1400, 1840].map((x, i) => {
        const sw = Math.sin(t * 1.6 + i * 1.7) * 7;
        return (
          <g key={x} transform={`translate(${x} 56) rotate(${sw})`}>
            <rect x={-5} y={0} width={10} height={150} fill={C.inkMute} />
            <rect x={-30} y={148} width={60} height={14} rx={7} fill={C.cautionLight} />
          </g>
        );
      })}
      {/* seat */}
      <rect x={-600} y={640} width={3200} height={190} fill={mix(C.theory, C.paperShade, 0.5)} />
      <rect x={-600} y={640} width={3200} height={10} fill={mix(C.theory, C.paperShade, 0.3)} />
      <rect x={-600} y={806} width={3200} height={46} fill={mix(C.theory, C.paperShade, 0.3)} />
      <rect x={-600} y={852} width={3200} height={80} fill={C.inkLift} />
      <LightPool x={900} y={120} r={900} color={C.lamp} strength={0.5} />
    </g>
  );
};
const CarPeople: React.FC<{t: number; youLook?: number; smile?: number}> = ({t, youLook = 0, smile = 0}) => (
  <g>
    {PAX.map((p) => (
      <Person
        key={p.seed}
        x={p.x}
        y={CAR_FLOOR}
        s={CS}
        sit={1}
        facing={p.x > 1400 ? -1 : 1}
        t={t}
        outfit="casual"
        top={p.top}
        skin={p.skin}
        hair={p.hair as any}
        seed={p.seed}
        look={'you' in p ? youLook : 0}
        expression={'next' in p && smile > 0.5 ? 'smile' : 'neutral'}
      />
    ))}
  </g>
);

/** A thought bubble (the little "mind-space" over a head). plum = yours, mustard = the imagined copy. */
const MindBubble: React.FC<{x: number; y: number; s?: number; p: number; color: string; fill?: string; t?: number; seed?: number}> = ({x, y, s = 1, p, color, fill = C.paperLight, t = 0, seed = 1}) => {
  if (p <= 0) return null;
  const k = ease.outBack(clamp01(p));
  return (
    <g transform={`translate(${x} ${y}) scale(${s * (0.4 + 0.6 * k)})`} opacity={clamp01(p * 3)}>
      <circle cx={-10} cy={78} r={9} fill={fill} stroke={color} strokeWidth={4} />
      <circle cx={-26} cy={104} r={5} fill={fill} stroke={color} strokeWidth={4} />
      <ellipse cx={0} cy={0} rx={112} ry={70} fill={fill} stroke={color} strokeWidth={5} strokeDasharray="14 10" />
      <circle cx={-44} cy={8 + Math.sin(t * 1.3 + seed) * 4} r={22} fill="none" stroke={C.theory} strokeWidth={4} strokeDasharray="7 6" />
      <circle cx={14} cy={-14 + Math.sin(t * 1.1 + seed * 2) * 4} r={30} fill="none" stroke={C.theory} strokeWidth={4} strokeDasharray="7 6" />
      <circle cx={58} cy={20 + Math.sin(t * 1.5 + seed * 3) * 3} r={16} fill="none" stroke={C.theory} strokeWidth={4} strokeDasharray="7 6" />
    </g>
  );
};

// ───────────────────────── S1 · 512.60 · "…starts being about you. … exactly one mind … the average one." ─────────────────────────
export const S1: React.FC<{t: number}> = ({t}) => {
  const you = headOf(PAX[1].x);
  const cam = breathe(
    camAt(t, [
      [T.s1, you.x + 30, you.y + 120, 1.75],
      [T.oneMind, you.x + 10, you.y + 60, 1.95],
      [T.average - 0.2, you.x + 10, you.y + 60, 1.95],
      [T.average + 1.7, 960, 520, 1.0],
    ]),
    t,
    0.5,
  );
  // brain diagram collapses into the person
  const col = e(t, T.s1, T.s1 + 1.0, ease.inOut);
  const dome = e(t, T.oneMind - 0.2, T.oneMind + 0.8);
  const copies = PAX.filter((p) => !('you' in p));
  return (
    <Stage bg={C.night}>
      <Cam cam={cam}>
        <Carriage t={t} />
        <g opacity={clamp01((col - 0.35) / 0.5)}>
          <CarPeople t={t} />
        </g>
        {col < 1 && (
          <g opacity={1 - col} transform={`translate(${you.x} ${you.y + 20}) scale(${1.15 - 0.85 * col}) translate(${-you.x} ${-you.y - 20})`}>
            <rect x={you.x - 360} y={you.y - 330} width={720} height={680} fill={C.ink} opacity={0.5} />
            <HeadProfile x={you.x - 100} y={you.y + 60} s={1.1} showBrain skin={C.skin[2]} t={t} />
          </g>
        )}
        {/* the dome of one mind */}
        {dome > 0 && (
          <g transform={`translate(${you.x} ${you.y + 90}) scale(${0.7 + 0.3 * ease.outBack(dome)}) translate(${-you.x} ${-you.y - 90})`} opacity={clamp01(dome * 2.5)}>
            <path d={`M${you.x - 250} ${you.y + 330} A250 250 0 0 1 ${you.x + 250} ${you.y + 330} Z`} fill={C.theory} opacity={0.26} />
            <path d={`M${you.x - 250} ${you.y + 330} A250 250 0 0 1 ${you.x + 250} ${you.y + 330}`} fill="none" stroke={C.theory} strokeWidth={10} />
            {[
              {dx: -140, dy: -90, r: 26, ph: 0},
              {dx: 150, dy: -60, r: 34, ph: 2},
              {dx: -60, dy: -190, r: 22, ph: 4},
              {dx: 70, dy: -170, r: 28, ph: 5},
            ].map((b, i) => (
              <circle key={i} cx={you.x + b.dx} cy={you.y + 110 + b.dy + Math.sin(t * 1.2 + b.ph) * 6} r={b.r * e(t, T.oneMind + 0.3 + i * 0.12, T.oneMind + 0.8 + i * 0.12)} fill="none" stroke={C.theoryLight} strokeWidth={5} strokeDasharray="9 8" />
            ))}
          </g>
        )}
        {/* "everyone has a copy of mine" */}
        {copies.map((p, i) => {
          const h = headOf(p.x);
          return <MindBubble key={p.seed} x={h.x} y={h.y - 150} p={e(t, T.average + i * 0.12, T.average + 0.5 + i * 0.12)} color={C.caution} t={t} seed={p.seed} />;
        })}
        <MindBubble x={you.x} y={you.y - 150} p={e(t, T.average - 0.1, T.average + 0.4)} color={C.theory} t={t} seed={7} />
      </Cam>
    </Stage>
  );
};

// ───────────────────────── S2 · 521.90 · "…assuming the person next to you hears what you hear." ─────────────────────────
export const S2: React.FC<{t: number}> = ({t}) => {
  const nb = headOf(PAX[2].x);
  const cam = breathe(
    camAt(t, [
      [T.s2, 960, 520, 1.0],
      [T.s2 + 1.2, 890, 520, 1.55],
      [T.nextTo + 0.6, 990, 500, 1.85],
      [T.end, 990, 500, 1.85],
    ]),
    t,
    0.5,
  );
  const peel = e(t, T.nextTo - 0.2, T.nextTo + 0.7, ease.inOut);
  const real = e(t, T.nextTo + 0.1, T.nextTo + 0.8);
  const bx = lerp(2000, 100, e(t, T.s2, T.nextTo - 0.2, ease.inOut));
  return (
    <Stage bg={C.night}>
      <Cam cam={cam}>
        <Carriage t={t} />
        <CarPeople t={t} youLook={0} smile={t > T.nextTo + 1 ? 1 : 0} />
        <MindBubble x={headOf(PAX[1].x).x} y={headOf(PAX[1].x).y - 150} p={1} color={C.theory} t={t} seed={7} />
        {/* a textbook drifts by — unharmed, not the point */}
        <g transform={`translate(${bx} 250) rotate(-4)`} opacity={win(t, T.s2, T.s2 + 0.3, T.nextTo - 0.3, T.nextTo + 0.1)}>
          <rect x={-170} y={-100} width={340} height={200} rx={10} fill={C.theory} />
          <rect x={-170} y={-100} width={24} height={200} rx={8} fill={C.ink} opacity={0.35} />
          <text x={12} y={14} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={34} letterSpacing={3} fill={C.paperLight}>
            NEUROSCIENCE
          </text>
        </g>
        {/* neighbour: the copied bubble peels off like a sticker, revealing their real content */}
        {real > 0 && (
          <g transform={`translate(${nb.x} ${nb.y - 160}) scale(${0.85 + 0.15 * real})`} opacity={clamp01(real * 3)}>
            <ellipse cx={0} cy={0} rx={190} ry={105} fill={C.paperLight} stroke={C.theory} strokeWidth={5} strokeDasharray="14 10" />
            <ThoughtContent x={-82} y={-2} r={62} p={real} t={t} kind="image" frame="circle" seed={4} />
            <ThoughtContent x={84} y={-2} r={62} p={e(t, T.nextTo + 0.35, T.nextTo + 1.0)} t={t} kind="feeling" frame="circle" seed={5} />
          </g>
        )}
        {peel < 1 && (
          <g opacity={1 - peel * peel} transform={`translate(${nb.x + peel * 150} ${nb.y - 150 - peel * 140}) rotate(${peel * 28}) scale(${1 + peel * 0.1 - 0.3 * peel})`}>
            <MindBubble x={0} y={0} s={1.5} p={1} color={C.caution} t={t} seed={33} />
          </g>
        )}
      </Cam>
    </Stage>
  );
};

// ───────────────────────── S3 · 527.90 · "So try one move… Words? A picture? A feeling? … summaries" ─────────────────────────
const Slip: React.FC<{x: number; y: number; w: number; h: number; p: number; children?: React.ReactNode}> = ({x, y, w, h, p, children}) => {
  if (p <= 0) return null;
  const k = ease.outQuint(clamp01(p));
  return (
    <g transform={`translate(${x} ${y + (1 - k) * 40}) scale(${0.85 + 0.15 * k})`} opacity={clamp01(p * 3)}>
      <rect x={-w / 2 + 8} y={-h / 2 + 10} width={w} height={h} rx={14} fill={C.ink} opacity={0.14} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={C.paperLight} stroke={C.ink} strokeWidth={4} />
      {children}
    </g>
  );
};
export const S3: React.FC<{t: number}> = ({t}) => {
  const fl = beepFlash(t, [T.beep]);
  const tp = Math.min(t, T.beep + 0.05); // "you" freezes mid-gesture on the beep
  const snap = e(t, T.snap, T.snap + 0.8);
  const clear = e(t, T.bars - 0.1, T.bars + 0.45);
  const opt = (a: number) => e(t, a - 0.1, a + 0.45, ease.outBack) * (1 - clear);
  const strike = e(t, T.habit + 0.25, T.habit + 0.75);
  const usually = e(t, T.habit - 0.1, T.habit + 0.3) * (1 - e(t, T.moment - 0.05, T.moment + 0.3));
  const bh = (v: number, a: number) => v * e(t, a, a + 0.7, ease.outQuint);
  return (
    <Stage bg={C.paperShade}>
      <rect x={0} y={960} width={1920} height={120} fill={C.paperDeep} />
      <LightPool x={330} y={500} r={520} color={C.lamp} strength={0.4} />
      <Particles t={t} x={0} y={100} w={1920} h={800} n={14} seed={8} size={[2, 4]} color={C.paperDark} opacity={[0.25, 0.5]} vx={5} vy={-4} />
      <Person x={330} y={1010} s={1.05} t={tp} pose="wave" outfit="casual" top={C.evidenceLight} skin={2} hair="ponytail" seed={32} expression={t > T.beep ? 'surprised' : 'neutral'} />
      <Kicker x={960} y={120} text="TRY ONE MOVE" size={46} color={C.ink} p={e(t, T.s3 + 0.05, T.s3 + 0.6) * (1 - clear)} />
      <g opacity={1 - clear}>
        <Beeper x={640} y={290} s={1.35} r={-8} p={e(t, T.beep - 0.5, T.beep - 0.1)} t={t} beepAt={[T.beep]} />
      </g>
      {/* the snapshot slides out of the head */}
      <Slip x={lerp(380, 1000, ease.outQuint(snap))} y={lerp(460, 450, snap)} w={420} h={320} p={snap}>
        <ThoughtContent x={0} y={0} r={118} p={e(t, T.snap + 0.3, T.snap + 1.0)} t={t} kind="awareness" frame="circle" seed={6} />
      </Slip>
      {(
        [
          ['WORDS?', 'words', 700, T.words, '…'],
          ['A PICTURE?', 'image', 1000, T.pic, ''],
          ['A FEELING?', 'feeling', 1300, T.feel, ''],
        ] as const
      ).map(([label, kind, x, at, txt]) => (
        <g key={label} opacity={opt(at) > 0 ? 1 : 0}>
          <g transform={`translate(${x} ${790}) scale(${opt(at)}) translate(${-x} ${-790})`}>
            <ThoughtContent x={x} y={790} r={110} p={1} t={t} kind={kind as any} text={txt || undefined} frame="circle" seed={x} />
            <text x={x} y={790 + 110 + 54} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={44} letterSpacing={2} fill={C.ink}>
              {label}
            </text>
          </g>
        </g>
      ))}
      {/* "Not your habit" — the red pen on the usual summary */}
      {usually > 0 && (
        <g opacity={usually}>
          <Slip x={1560} y={450} w={420} h={130} p={1}>
            <text x={0} y={18} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={600} fontSize={60} fill={C.ink}>
              USUALLY…
            </text>
          </Slip>
          <line x1={1380} y1={452} x2={1380 + 360 * strike} y2={440 - 14 * strike} stroke={C.oxblood} strokeWidth={10} strokeLinecap="round" />
        </g>
      )}
      <Circled x={1000} y={450} rx={300} ry={225} rot={-3} p={e(t, T.moment - 0.1, T.moment + 0.6, (x) => x)} thick={9} />
      {/* summaries vs moments */}
      {clear > 0 && (
        <g>
          <rect x={1305} y={860 - bh(640, T.bars + 0.2)} width={150} height={bh(640, T.bars + 0.2)} rx={6} fill={C.caution} />
          <rect x={1625} y={860 - bh(400, T.bars + 0.5)} width={150} height={bh(400, T.bars + 0.5)} rx={6} fill={C.evidence} />
          <rect x={1230} y={860} width={630} height={6} fill={C.ink} />
          <text x={1380} y={918} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={42} fill={C.ink} opacity={clear}>
            SUMMARIES
          </text>
          <text x={1700} y={918} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={42} fill={C.ink} opacity={clear}>
            MOMENTS
          </text>
        </g>
      )}
      <Tag x={1480} y={972} anchor="center" kind="caution" size={42} text="Summaries tend to run high" p={e(t, T.summ - 0.1, T.summ + 0.5)} />
      {fl > 0 && <rect x={0} y={0} width={1920} height={1080} fill={C.paperLight} opacity={fl * 0.55} />}
    </Stage>
  );
};

// ───────────────────────── S4 · 542.30 · "ask them about a moment too. Not 'do you hear a voice?' but 'what was in your head just then?'" ─────────────────────────
export const S4: React.FC<{t: number}> = ({t}) => {
  const FY = 960;
  const talkA = (t > T.what - 0.1 && t < T.what + 2.0) || (t > T.hear - 0.1 && t < T.hear + 1.4) ? Math.abs(Math.sin(t * 9)) : 0;
  const talkB = t > T.reply + 0.4 ? Math.abs(Math.sin(t * 8)) * 0.8 : 0;
  const strike = e(t, T.hear + 0.9, T.hear + 1.4);
  const b1 = e(t, T.hear - 0.1, T.hear + 0.4);
  const b1out = e(t, T.what - 0.15, T.what + 0.25);
  const cam = breathe(camAt(t, [[T.s4, 960, 540, 1.02], [T.end, 960, 540, 1.1]]), t, 0.5);
  return (
    <Stage bg={C.sky}>
      <Cam cam={cam}>
        <rect x={-200} y={0} width={2400} height={FY} fill={C.sky} />
        <circle cx={1650} cy={190} r={90} fill={C.lamp} opacity={0.7} />
        {[160, 520, 1500, 1820].map((x, i) => (
          <g key={x}>
            <rect x={x - 12} y={FY - 330 - i * 14} width={24} height={330 + i * 14} fill={C.wood} />
            <circle cx={x} cy={FY - 380 - i * 14} r={130 + (i % 2) * 24} fill={mix(C.evidence, C.paper, 0.45)} />
            <circle cx={x + 60} cy={FY - 330 - i * 14} r={90} fill={mix(C.evidence, C.paper, 0.3)} />
          </g>
        ))}
        <rect x={-200} y={FY - 40} width={2400} height={400} fill={C.paperDeep} />
        <rect x={-200} y={FY - 40} width={2400} height={10} fill={C.paperDark} />
        <Bench x={960} y={FY + 6} w={1040} h={150} />
        <Person x={720} y={FY} s={1.35} sit={1} facing={1} t={t} outfit="casual" top={C.evidenceLight} skin={2} hair="ponytail" seed={32} talk={talkA} expression="neutral" />
        <Person x={1210} y={FY} s={1.35} sit={1} facing={-1} t={t} outfit="casual" top={C.theoryLight} skin={3} hair="curly" seed={33} talk={talkB} expression={t > T.what + 1.0 ? 'smile' : 'neutral'} />
        <LightPool x={960} y={300} r={800} color={C.lamp} strength={0.35} />
      </Cam>
      <Particles t={t} x={0} y={0} w={1920} h={900} n={16} seed={3} size={[2, 4]} color={C.paperLight} opacity={[0.4, 0.8]} vx={8} vy={-3} />
      {/* real talk = solid bubbles */}
      <g opacity={1 - b1out}>
        <Bubble x={760} y={190} w={820} h={140} to={{x: 590, y: 340}} kind="speech" size={60} text="Do you hear a voice?" p={b1} />
        <line x1={470} y1={196} x2={470 + 600 * strike} y2={186 - 8 * strike} stroke={C.oxblood} strokeWidth={10} strokeLinecap="round" />
      </g>
      <Bubble x={880} y={190} w={1200} h={140} to={{x: 590, y: 340}} kind="speech" size={60} text="What was in your head just then?" p={e(t, T.what - 0.05, T.what + 0.45)} type={e(t, T.what, T.what + 1.0, (x) => x)} />
      <Bubble x={1500} y={250} w={240} h={190} to={{x: 1380, y: 340}} kind="speech" p={e(t, T.reply, T.reply + 0.5)} />
      <g opacity={e(t, T.reply + 0.3, T.reply + 0.7)}>
        <ThoughtContent x={1500} y={250} r={66} p={e(t, T.reply + 0.3, T.reply + 0.9)} t={t} kind="image" frame="none" seed={9} />
      </g>
    </Stage>
  );
};

// ───────────────────────── S5 · 550.96 · bookend: "Four words, thought, never spoken. … language with the sound taken out." ─────────────────────────
export const S5: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(
    camAt(t, [
      [T.s5 - 0.3, HEAD.x + 40, HEAD.y - 20, 2.3],
      [T.cable - 0.2, HEAD.x + 40, HEAD.y - 20, 2.45],
      [T.cable + 0.9, 1020, 500, 1.15],
      [556.0, 1090, 500, 1.2],
      [556.9, SCREEN_C.x, SCREEN_C.y + 10, 1.9],
      [557.9, SCREEN_C.x, SCREEN_C.y + 10, 1.9],
      [558.5, MOUTH.x + 20, MOUTH.y, 3.0],
      [T.end, MOUTH.x + 20, MOUTH.y, 3.1],
    ]),
    t,
    0.6,
  );
  const m = scr(cam, MOUTH);
  const h = scr(cam, {x: HEAD.x + 20, y: HEAD.y - 150});
  const glow = e(t, T.s5, T.s5 + 0.8) * (1 - e(t, T.cable - 0.1, T.cable + 0.7));
  const iris = e(t, T.taken, T.taken + 0.9, ease.inOut);
  const R = iris * 2300;
  const silent = e(t, 561.55, 562.5, ease.inOut);
  return (
    <Stage bg={C.night}>
      <RigWorld
        t={t}
        cam={cam}
        glint={e(t, T.cable - 0.1, T.cable + 0.9)}
        signal={e(t, T.cable + 0.2, T.cable + 1.8)}
        text={PHRASE}
        typeP={e(t, T.typed, 557.3, (x) => x)}
        extra={glow > 0 ? <LightPool x={HEAD.x + 10} y={HEAD.y - 40} r={230} color={C.theoryTint} strength={0.9 * glow} /> : null}
      />
      {glow > 0 && (
        <g opacity={glow}>
          <g fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={500} fontSize={68} fill={C.theoryTint} textAnchor="middle">
            {['chitty', 'chitty', 'bang', 'bang'].map((w, i) => {
              const xs = [-330, -110, 110, 330];
              const a = e(t, T.s5 + 0.1 + i * 0.45, T.s5 + 0.5 + i * 0.45, ease.outBack);
              return (
                <g key={i} opacity={clamp01(a * 2)} transform={`translate(${h.x + xs[i]} ${h.y - 40 + Math.sin(t * 1.4 + i) * 5}) scale(${0.6 + 0.4 * a})`}>
                  <text x={0} y={0}>{w}</text>
                  <line x1={-90} y1={26} x2={90} y2={26} stroke={C.theoryLight} strokeWidth={5} strokeDasharray="14 10" strokeLinecap="round" />
                </g>
              );
            })}
          </g>
        </g>
      )}
      {t > T.noSound - 0.3 && iris < 0.2 && (
        <g opacity={e(t, T.noSound - 0.1, T.noSound + 0.3)}>
          <SilentWave x={m.x + 70} y={m.y + 12} w={560} amp={70} t={t} p={e(t, T.noSound, T.noSound + 0.5, (x) => x)} flat={e(t, T.noSound + 0.2, T.noSound + 1.0, ease.inOut)} tone="ink" seed={3} id="s5lip" />
        </g>
      )}
      {iris > 0 && (
        <g>
          <clipPath id="c08-s5iris">
            <circle cx={m.x + 70} cy={m.y} r={R} />
          </clipPath>
          <g clipPath="url(#c08-s5iris)">
            <rect x={0} y={0} width={1920} height={1080} fill={C.paper} />
            <Particles t={t} x={120} y={160} w={1680} h={820} n={18} seed={5} size={[3, 6]} color={C.paperDark} opacity={[0.25, 0.5]} vx={6} vy={-4} />
            <SilentWave x={120} y={650} w={1680} amp={160} t={t} p={e(t, T.taken + 0.05, T.taken + 0.95, ease.out)} silent={silent} seed={4} id="s5hero" />
          </g>
        </g>
      )}
    </Stage>
  );
};

// ───────────────────────── S6 / S7 · the final image: two heads, a line between minds, a lit little house ─────────────────────────
const L = {x: 540, y: 570};
const R2 = {x: 1380, y: 570};
const SH = 1.05;
const P0 = {x: L.x + 215 * SH, y: L.y + 80 * SH};
const EAR = {x: R2.x - 170 * SH, y: R2.y - 10};
const HOME = {x: L.x - 10, y: L.y - 50};
const arc = (k: number) => {
  const c = {x: 960, y: P0.y - 230};
  const u = 1 - k;
  return {x: u * u * P0.x + 2 * u * k * c.x + k * k * EAR.x, y: u * u * P0.y + 2 * u * k * c.y + k * k * EAR.y};
};
const N = 48;
const FinalFrame: React.FC<{t: number}> = ({t}) => {
  const heads = e(t, T.s6, T.s6 + 0.7);
  const morph = e(t, T.s6 + 0.2, T.s6 + 1.2, ease.inOut);
  const draw = e(t, T.travel - 0.2, T.travel + 1.4, ease.inOut);
  const ink = e(t, T.s6 + 0.7, T.s6 + 1.2);
  // the line: the straight dashed plum line (the collapsed wave) -> arc between heads, solid ink
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const a = arc(i / N);
    const sx = lerp(120, 1800, i / N);
    pts.push(`${i ? 'L' : 'M'}${lerp(sx, a.x, morph)} ${lerp(650, a.y, morph)}`);
  }
  const lineD = pts.join(' ');
  const dot = arc(clamp01(draw));
  // home: curl inside one head, settles into a lit house
  const curl = e(t, T.home, T.home + 1.3, ease.inOut);
  const house = e(t, T.stay - 0.9, T.stay + 0.1, ease.inOut);
  const lit = e(t, T.stay - 0.05, T.stay + 0.7, ease.outBack);
  const spiral = (() => {
    let s = `M${P0.x} ${P0.y} C${P0.x + 80} ${P0.y - 200} ${L.x + 260} ${L.y - 190} ${HOME.x + 118} ${HOME.y - 10}`;
    for (let i = 1; i <= 40; i++) {
      const a = i * 0.34;
      const r = 118 - i * 2.4;
      s += ` L${HOME.x + Math.cos(a) * r} ${HOME.y + Math.sin(a) * r * 0.9}`;
    }
    return s;
  })();
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.8);
  const warm = e(t, T.stay - 0.3, T.stay + 1.5, ease.inOut);
  const solid = morph > 0.99 && draw < 1 ? {strokeDasharray: `${draw} 1`} : undefined;
  return (
    <g>
      <rect x={-1200} y={-800} width={4400} height={2800} fill={mix(C.paper, C.lamp, 0.1 + 0.12 * warm)} />
      <circle cx={HOME.x} cy={HOME.y} r={640} fill={C.lamp} opacity={0.2 * warm} />
      <circle cx={HOME.x} cy={HOME.y} r={430} fill={C.lamp} opacity={0.24 * warm} />
      <Particles t={t} x={100} y={100} w={1700} h={800} n={16} seed={21} size={[2, 5]} color={mix(C.lamp, C.paperDark, 0.4)} opacity={[0.3, 0.6]} vx={5} vy={-5} />
      <g opacity={heads}>
        <HeadProfile x={R2.x} y={R2.y} s={SH} facing="left" skin={C.skin[3]} t={t} />
        <HeadProfile x={L.x} y={L.y} s={SH} facing="right" skin={C.skin[1]} t={t} />
      </g>
      {/* the line between minds */}
      <path d={lineD} fill="none" stroke={mix(C.theory, C.ink, ink)} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={ink > 0.5 ? undefined : '16 12'} style={solid} opacity={t < T.s6 + 0.05 ? 0 : 1} />
      {draw > 0 && draw < 1 && <circle cx={dot.x} cy={dot.y} r={12} fill={C.ink} />}
      {/* "it also learned to stay home" */}
      {curl > 0 && (
        <path d={spiral} fill="none" stroke={C.theory} strokeWidth={8} strokeLinecap="round" pathLength={1} style={curl < 1 ? {strokeDasharray: `${curl} 1`} : {strokeDasharray: '0.02 0.012'}} opacity={1 - house} />
      )}
      {house > 0 && (
        <g transform={`translate(${HOME.x} ${HOME.y + 10}) scale(${2.0 + 0.25 * house})`} opacity={clamp01(house * 2)}>
          <circle cx={4} cy={-6} r={(130 + 20 * pulse * lit) * lit} fill={C.lamp} opacity={0.5} />
          <path d="M-62 -4 L0 -62 L62 -4 Z" fill={C.ink} />
          <rect x={-50} y={-6} width={100} height={72} fill={C.theory} />
          <rect x={14} y={14} width={26} height={52} fill={mix(C.ink, C.theory, 0.4)} />
          <rect x={-34} y={14} width={34} height={32} rx={3} fill={mix(C.ink, C.theory, 0.3)} />
          <rect x={-34} y={14} width={34} height={32} rx={3} fill={C.lamp} opacity={lit} />
        </g>
      )}
    </g>
  );
};
export const S6: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s6, 960, 540, 1.0], [T.s7, 900, 540, 1.1]]), t, 0.6);
  const wave = t < T.s6 + 0.25;
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        <FinalFrame t={t} />
      </Cam>
      {wave && <SilentWave x={120} y={650} w={1680} amp={160} t={t} p={1} silent={1} flat={e(t, T.s6, T.s6 + 0.25)} seed={4} id="s5hero" />}
    </Stage>
  );
};

// ───────────────────────── S7 · 568.30 · "The sources for this video are in the description." ─────────────────────────
export const S7: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s7, 900, 540, 1.1], [570.8, 940, 550, 0.82], [T.end, 960, 560, 0.74]], ease.inOut), t, 0.4);
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        <FinalFrame t={t} />
      </Cam>
      <Kicker x={960} y={940} text="SOURCES IN THE DESCRIPTION" size={36} color={C.ink} p={e(t, 570.0, 570.7)} />
    </Stage>
  );
};
