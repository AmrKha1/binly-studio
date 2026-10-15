// Custom shots for C01 (builder-owned). Each: export const S<n>: React.FC<{t: number}> returning a full <Stage>.
// C01 · 0.0–49.2 · "A voice that makes no sound" — the hook.
import React from 'react';
import {Stage, Cam, World, breathe} from '../../../kit/stage';
import {C, FONT_SANS, FONT_SERIF} from '../../../kit/theme';
import {CamState, camAt, clamp01, ease, keys, lerp, ramp, rand, win} from '../../../kit/anim';
import {Headline, Tag, textW} from '../../../kit/text';
import {Bubble} from '../../../kit/cards';
import {LightPool, Particles, Pulse, DrawPath} from '../../../kit/fx';
import {HeadProfile, Waveform} from '../../../kit/science';
import {MindSpace, Window, Plant} from '../../../kit/env';
import {DecoderRig, DECODER_HEAD, SilentWave} from '../shared';
import {NightRig} from '../shared/NightRoom';
import {mix} from '../shared/util';

// Measured times (word cues before 8.3 s are wrong — these come from the brief)
const T = {
  open: 0.0, // "A person with severe paralysis thinks four words."
  dont: 3.0, // "They don't say them."
  nothing: 4.2, // "Nothing leaves their mouth."
  w1: 5.7, // "Chitty"
  w2: 6.05, // "chitty"
  w3: 6.6, // "bang"
  w4: 6.85, // "bang"
  s3: 7.4, // "A computer connected to…"
  electrodes: 8.56, // "electrodes in their brain"
  recog: 9.9, // "recognizes the phrase"
  n98: 11.32, // "more than 98 percent"
  s4: 13.0, // "Then it starts turning…"
  turning: 13.44, // "turning"
  silentSent: 14.0, // "silent sentences"
  screen: 15.98, // "on a screen"
  s6: 20.6,
  strange: 20.68, // "And the strange part isn't that it worked."
  read: 22.79, // "It's what the computer had to read."
  hush: 23.9,
  voice: 24.2, // "A voice that makes no sound."
  noSound: 25.42, // "no sound"
  s7: 26.4,
  oneToo: 26.53, // "You have one too."
  say: 27.61, // "Say this in your head:"
  should: 28.81, // "I should call him tomorrow."
  tomorrowEnd: 29.89,
  s8: 30.1, // "Look at what just happened."
  lips: 31.43, // "Your lips didn't move."
  vibrated: 32.66, // "Nothing vibrated in the air."
  yet: 34.37, // "And yet a sentence played inside you,"
  order: 36.47, // "words in order,"
  maybe: 37.78, // "maybe even in a tone,"
  tone: 38.56, // "tone"
  felt: 39.86, // "in something that felt exactly like a voice."
  likeVoice: 40.58,
  s9: 41.8, // "So what did that computer actually read?"
  q2: 44.05, // "What is a voice with no sound?"
  q3: 45.92, // "And if it can be found, why do some people say…"
  never: 48.3, // "never had one"
  end: 49.2,
};

// ───────────────────────── the decoder room (one world for S1, S3, S4, S6) ─────────────────────────
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

// ───────────────────────── S1 · 0.00 · "A person with severe paralysis thinks four words." ─────────────────────────
export const S1: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(
    camAt(t, [
      [-0.6, MOUTH.x + 10, MOUTH.y - 20, 3.3],
      [0.0, MOUTH.x + 10, MOUTH.y - 20, 3.2],
      [2.5, 960, 560, 1.12],
      [T.dont, 940, 555, 1.1],
      [5.5, HEAD.x + 125, HEAD.y + 75, 1.6], // head lands at screen (760, 420) for the zoom-through
    ]),
    t,
  );
  const flatP = ramp(t, T.nothing - 0.15, T.nothing + 0.6, ease.out);
  return (
    <Stage bg={C.night}>
      <RigWorld
        t={t}
        cam={cam}
        extra={
          flatP > 0 && (
            <g opacity={win(t, T.nothing - 0.15, 9, 0.3, 0.3)}>
              <FlatLine x={MOUTH.x + 26} y={MOUTH.y} w={110} p={flatP} color={C.paperLight} width={4} />
            </g>
          )
        }
      />
    </Stage>
  );
};

// ───────────────────────── S2 · 5.50 · "Chitty chitty bang bang" (inside the head) ─────────────────────────
const S2_WORDS: [string, number][] = [
  ['chitty', T.w1],
  ['chitty', T.w2],
  ['bang', T.w3],
  ['bang', T.w4],
];
export const S2: React.FC<{t: number}> = ({t}) => {
  const size = 104;
  const gap = 70;
  const ws = S2_WORDS.map(([w]) => textW(w, size, 'serif', 500) * 1.02);
  const total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
  let cx = 960 - total / 2;
  const z = lerp(1.0, 1.07, ramp(t, 5.5, 7.6, ease.outSine));
  return (
    <Stage bg={C.ink}>
      <g transform={`translate(960 540) scale(${z}) translate(-960 -540)`}>
        <MindSpace t={t} bg="plum" seed={3} density={0.8} />
      </g>
      {S2_WORDS.map(([w, at], i) => {
        const k = ramp(t, at - 0.12, at + 0.25, ease.outBack);
        const o = clamp01(ramp(t, at - 0.12, at + 0.05, ease.out));
        const x0 = cx;
        cx += ws[i] + gap;
        const mid = x0 + ws[i] / 2;
        const y = 560 + (i % 2 ? -26 : 18);
        const ring = ramp(t, at - 0.05, at + 0.9, ease.out);
        return (
          <g key={i}>
            {ring > 0 && ring < 1 && <ellipse cx={mid} cy={y - 36} rx={(ws[i] / 2 + 40) * (0.8 + 0.6 * ring)} ry={(90) * (0.8 + 0.6 * ring)} fill="none" stroke={C.theoryTint} strokeWidth={3} strokeDasharray="10 10" opacity={0.6 * (1 - ring)} />}
            <g opacity={o} transform={`translate(${mid} ${y}) scale(${0.6 + 0.4 * k}) translate(${-mid} ${-y})`}>
              <text x={mid} y={y} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={500} fontSize={size} fill={C.theoryTint}>
                {w}
              </text>
              <line x1={x0} y1={y + 30} x2={x0 + ws[i]} y2={y + 30} stroke={C.theoryLight} strokeWidth={5} strokeDasharray="14 10" strokeLinecap="round" />
            </g>
          </g>
        );
      })}
    </Stage>
  );
};

// ───────────────────────── S3 · 7.40 · "A computer connected to electrodes… more than 98 percent" ─────────────────────────
const PHRASE = 'chitty chitty bang bang';
const BADGE = {x: 1775, y: 470};
/** Big oxblood plate beside the monitor: MORE THAN / 98% */
const Badge98: React.FC<{p: number}> = ({p}) => {
  if (p <= 0) return null;
  const k = ease.outBack(clamp01(p));
  const w = Math.max(textW('MORE THAN', 72, 'serif', 700), textW('98%', 170, 'serif', 700)) + 90;
  const h = 300;
  return (
    <g transform={`translate(${BADGE.x} ${BADGE.y}) scale(${0.5 + 0.5 * k})`} opacity={clamp01(p * 3)}>
      <path d={`M${-w / 2 + 2} -30 L${-w / 2 - 34} 0 L${-w / 2 + 2} 30 Z`} fill={C.oxblood} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={28} fill={C.oxblood} />
      <text x={0} y={-58} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={72} fill={C.paperLight}>
        MORE THAN
      </text>
      <text x={0} y={112} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={170} fill={C.paperLight}>
        98%
      </text>
    </g>
  );
};
const S3_CAM_END: [number, number, number, number] = [13.0, 1190, 480, 1.0];
export const S3: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(
    camAt(t, [
      [T.s3, HEAD.x + 40, HEAD.y - 20, 2.3],
      [9.6, 900, 500, 1.12],
      [11.0, 1180, 480, 1.0],
      S3_CAM_END,
    ]),
    t,
  );
  return (
    <Stage bg={C.night}>
      <RigWorld
        t={t}
        cam={cam}
        glint={ramp(t, T.electrodes - 0.15, T.electrodes + 0.9, ease.out)}
        signal={ramp(t, T.electrodes + 0.4, T.recog, ease.out)}
        text={PHRASE}
        typeP={ramp(t, T.recog + 0.1, T.recog + 1.2, (x) => x)}
        extra={<Badge98 p={ramp(t, T.n98 - 0.2, T.n98 + 0.4, (x) => x)} />}
      />
    </Stage>
  );
};

// ───────────────────────── S4 · 13.00 · "turning their silent sentences into text on a screen" ─────────────────────────
const BAR_W = [380, 300, 410, 250, 340, 290];
const ScreenFeed: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  const lineH = 54;
  const starts = [T.turning, T.silentSent, T.silentSent + 0.7, T.screen - 0.6, T.screen + 0.1, T.screen + 0.8];
  const shownN = starts.filter((s) => t >= s - 0.05).length; // bar lines started
  const scroll = keys(t, starts.map((s, i) => [s, Math.max(0, i - 1) * lineH] as [number, number]).reduce<[number, number][]>((a, k) => [...a, [k[0] - 0.05, (a.length ? a[a.length - 1][1] : 0)], [k[0] + 0.35, k[1]]], [[t0, 0]]), ease.inOut);
  const top = 160;
  return (
    <g>
      <rect x={0} y={0} width={GLASS.w} height={GLASS.h} fill={C.inkSoft} />
      <rect x={22} y={18} width={GLASS.w - 44} height={70} rx={8} fill={C.ink} opacity={0.6} />
      <Waveform x={30} y={53} w={GLASS.w - 60} amp={22} t={t} kind="eeg" color={C.theoryLight} width={3} seed={1} speed={150} />
      <clipPath id="c01-feed">
        <rect x={0} y={100} width={GLASS.w} height={GLASS.h - 100} />
      </clipPath>
      <g clipPath="url(#c01-feed)"><g transform={`translate(0 ${-scroll})`}>
        {/* the decoded phrase */}
        <g transform={`translate(0 ${top})`}>
          <circle cx={40} cy={-11} r={13} fill="none" stroke={C.theoryLight} strokeWidth={3} strokeDasharray="5 4" />
          <text x={66} y={0} fontFamily={FONT_SANS} fontWeight={600} fontSize={30} fill={C.paperLight}>
            {PHRASE}
          </text>
        </g>
        {starts.map((s, i) => {
          const p = ramp(t, s, s + 0.55, ease.out);
          if (p <= 0) return null;
          const y = top + (i + 1) * lineH;
          const pulse = 0.5 + 0.5 * Math.sin((t - s) * 7);
          const live = i === shownN - 1 && p < 1;
          return (
            <g key={i} transform={`translate(0 ${y})`}>
              <circle cx={40} cy={-11} r={13 + (live ? 3 * pulse : 0)} fill="none" stroke={C.theoryLight} strokeWidth={3} strokeDasharray="5 4" opacity={0.6 + 0.4 * (live ? pulse : 1)} />
              <rect x={66} y={-26} width={BAR_W[i] * p} height={22} rx={11} fill={C.inkFaint} />
              {live && <rect x={66 + BAR_W[i] * p + 8} y={-30} width={14} height={30} fill={C.theoryLight} />}
            </g>
          );
        })}
        </g>
      </g>
    </g>
  );
};
export const S4: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(
    camAt(t, [
      S3_CAM_END,
      [13.3, 1190, 480, 1.0],
      [14.6, SCREEN_C.x, SCREEN_C.y + 10, 2.5],
      [16.8, SCREEN_C.x + 10, SCREEN_C.y + 10, 2.7],
    ]),
    t,
    0.6,
  );
  const fo = 1 - ramp(t, 13.0, 13.4, ease.out);
  return (
    <Stage bg={C.night}>
      <RigWorld t={t} cam={cam} signal={1} overlay={<ScreenFeed t={t} t0={T.s4} />} extra={<g opacity={fo}><Badge98 p={1} /></g>} />
    </Stage>
  );
};

// ───────────────────────── S6 · 20.60 · "the strange part… A voice that makes no sound." ─────────────────────────
const S6_CAM: [number, number, number, number][] = [
  [20.4, SCREEN_C.x, SCREEN_C.y + 10, 2.3],
  [20.6, SCREEN_C.x, SCREEN_C.y + 10, 2.3],
  [22.5, 1060, 520, 1.12], // screen recedes
  [22.75, 1050, 520, 1.12],
  [23.9, HEAD.x + 60, HEAD.y + 10, 2.5], // track back along the cable to the head
  [24.5, MOUTH.x + 20, MOUTH.y, 3.0],
];
export const S6: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, S6_CAM), t);
  const m = scr(cam, MOUTH);
  const iris = ramp(t, T.voice - 0.2, T.voice + 0.45, ease.inOut);
  const R = iris * 2300;
  const wp = ramp(t, T.voice + 0.05, T.voice + 0.95, ease.out);
  const silent = ramp(t, T.noSound - 0.15, 26.15, ease.inOut);
  return (
    <Stage bg={C.night}>
      <RigWorld t={t} cam={cam} signal={1} dim={ramp(t, T.read, T.hush, ease.inOut) * 0.6} overlay={<ScreenFeed t={t} t0={13} />} />
      {iris > 0 && (
        <g>
          <clipPath id="c01-s6iris">
            <circle cx={m.x} cy={m.y} r={R} />
          </clipPath>
          <g clipPath="url(#c01-s6iris)">
            <rect x={0} y={0} width={1920} height={1080} fill={C.paper} />
            {/* sound rings from the left — they fade as the voice loses its sound */}
            {[0, 1, 2, 3, 4].map((i) => {
              const r = 260 + i * 210 + ((t * 40) % 210);
              return <circle key={i} cx={140} cy={640} r={r} fill="none" stroke={C.paperDeep} strokeWidth={6} opacity={(1 - silent * 0.85) * (1 - (r - 260) / 1100)} />;
            })}
            <Particles t={t} x={120} y={160} w={1680} h={820} n={18} seed={5} size={[3, 6]} color={C.paperDark} opacity={[0.25, 0.5]} vx={6} vy={-4} />
            <SilentWave x={120} y={650} w={1680} amp={160} t={t} p={wp} silent={silent} seed={4} id="s6hero" />
            <Headline x={960} y={300} text="A voice that makes no sound." size={96} mode="words" accent={{no: C.oxblood, sound: C.oxblood}} p={ramp(t, T.voice - 0.05, 25.8, (x) => x)} />
          </g>
        </g>
      )}
    </Stage>
  );
};

// ───────────────────────── S7 · 26.40 · "You have one too. Say this in your head: I should call him tomorrow." ─────────────────────────
const VH = {x: 470, y: 690, s: 1.3}; // the viewer's head
const VMOUTH = {x: VH.x + 198 * VH.s, y: VH.y + 142 * VH.s};
const BUB = {x: 1250, y: 300, w: 860, h: 190};
const SENT = 'I should call him tomorrow.';
const ViewerRoom: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={-1200} y={-800} width={4400} height={2800} fill={C.paperShade} />
    <rect x={-1200} y={980} width={4400} height={600} fill={C.paperDeep} />
    <Window x={1560} y={940} w={320} h={420} sky="day" t={t} seed={2} />
    <LightPool x={1300} y={980} r={520} color={C.paperLight} strength={0.35} sy={0.35} />
    <Plant x={1840} y={1100} kind="tall" t={t} seed={4} />
  </g>
);
const s7Cam = (t: number): CamState => camAt(t, [[26.0, 960, 540, 1.0], [30.1, 990, 560, 1.06]], ease.inOutSine);
export const S7: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(s7Cam(t), t);
  return (
    <Stage bg={C.paperShade}>
      <World
        cam={cam}
        layers={[
          {depth: 0.8, el: <ViewerRoom t={t} />},
          {depth: 1, el: <HeadProfile x={VH.x} y={VH.y + (1 - ramp(t, 26.3, 27.0, ease.out)) * 40} s={VH.s} skin={C.skin[1]} t={t} />},
        ]}
      />
      <Bubble x={BUB.x} y={BUB.y} w={BUB.w} h={BUB.h} kind="inner" to={{x: 800, y: 470}} size={60} text={SENT} p={ramp(t, T.say - 0.15, T.say + 0.45, (x) => x)} type={ramp(t, T.should - 0.1, T.tomorrowEnd - 0.1, (x) => x)} />
    </Stage>
  );
};

// ───────────────────────── S8 · 30.10 · "Look at what just happened… exactly like a voice." ─────────────────────────
const SW_WORDS = ['I', 'should', 'call', 'him', 'tomorrow.'];
const DUST = Array.from({length: 16}, (_, i) => ({x: VMOUTH.x + 40 + rand(i * 3 + 1) * 300, y: VMOUTH.y - 120 + rand(i * 3 + 2) * 230, r: 3 + rand(i * 3 + 3) * 3}));
const MindSentence: React.FC<{t: number}> = ({t}) => {
  const size = 100;
  const gap = 34;
  const ws = SW_WORDS.map((w) => textW(w, size, 'serif', 500) * 1.02);
  const total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
  let cx = 960 - total / 2;
  const morph = ramp(t, T.felt - 0.3, T.likeVoice + 0.2, ease.inOut);
  const curveP = ramp(t, T.maybe - 0.1, T.tone + 0.5, ease.inOut);
  const y0 = 470;
  const pos = ws.map((w) => {
    const x = cx;
    cx += w + gap;
    return {x, mid: x + w / 2, w};
  });
  // intonation curve over the words (rises on "tomorrow")
  const tonePts = pos.map((p, i) => [p.mid, y0 - 120 - [10, 30, 60, 20, 90][i]] as [number, number]);
  const toneD = `M${pos[0].x - 30} ${y0 - 120} ` + tonePts.map(([x, y], i) => (i === 0 ? `Q${x - 40} ${y} ${x} ${y}` : `T${x} ${y}`)).join(' ') + ` T${pos[4].x + pos[4].w + 40} ${y0 - 250}`;
  return (
    <g>
      <DrawPath d={toneD} p={curveP} stroke={C.theoryLight} width={6} dash o={1 - morph} />
      {pos.map((p, i) => {
        const at = T.yet + 0.75 + i * 0.27;
        const k = ramp(t, at - 0.1, at + 0.35, ease.out);
        const oth = ramp(t, T.order - 0.1 + i * 0.22, T.order + 0.2 + i * 0.22, ease.outBack);
        return (
          <g key={i} opacity={k * (1 - morph)} transform={`translate(0 ${(1 - k) * 26 + morph * 120})`}>
            <text x={p.mid} y={y0} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={500} fontSize={size} fill={C.theoryTint}>
              {SW_WORDS[i]}
            </text>
            <line x1={p.x} y1={y0 + 26} x2={p.x + p.w} y2={y0 + 26} stroke={C.theoryLight} strokeWidth={4} strokeDasharray="12 9" strokeLinecap="round" />
            {oth > 0 && (
              <g transform={`translate(${p.mid} ${y0 + 118}) scale(${oth})`}>
                <circle r={34} fill="none" stroke={C.paperShade} strokeWidth={3} strokeDasharray="6 5" />
                <text y={14} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={40} fill={C.paperLight}>
                  {i + 1}
                </text>
              </g>
            )}
          </g>
        );
      })}
      <SilentWave x={310} y={560} w={1300} amp={140} t={t} p={ramp(t, T.felt - 0.1, T.likeVoice + 0.5, ease.out)} silent={1} tone="ink" words={SW_WORDS.map((w) => w.replace('.', ''))} labelSize={44} seed={6} id="s8mind" />
    </g>
  );
};
export const S8: React.FC<{t: number}> = ({t}) => {
  const base = s7Cam(30.1);
  const cam = breathe(
    camAt(t, [
      [30.1, base.cx, base.cy, base.z],
      [T.lips - 0.25, base.cx + 50, base.cy + 40, base.z * 1.14],
      [T.lips + 0.75, VMOUTH.x + 60, VMOUTH.y - 40, 2.6],
      [T.yet, VMOUTH.x + 80, VMOUTH.y - 50, 2.75],
      [T.yet + 0.5, VH.x + 20, VH.y - 60, 3.2],
      [T.yet + 1.1, VH.x, VH.y - 60, 9],
    ]),
    t,
  );
  const bubbleOut = ramp(t, 30.1, 30.7, ease.inOut);
  const cut = ramp(t, T.yet + 0.05, T.yet + 0.45, ease.out); // cut-away window into the head
  const mind = ramp(t, T.yet + 0.75, T.yet + 1.05, ease.inOut);
  const flatP = ramp(t, T.lips + 0.3, T.lips + 0.9, ease.out);
  const dustP = ramp(t, T.vibrated - 0.2, T.vibrated + 0.4, ease.out);
  return (
    <Stage bg={C.paperShade}>
      <World
        cam={cam}
        layers={[
          {depth: 0.8, el: <ViewerRoom t={t} />},
          {
            depth: 1,
            el: (
              <g>
                <HeadProfile x={VH.x} y={VH.y} s={VH.s} skin={C.skin[1]} t={t} />
                <FlatLine x={VMOUTH.x + 24} y={VMOUTH.y} w={150} p={flatP} color={C.ink} width={4} />
                {dustP > 0 &&
                  DUST.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={C.inkFaint} opacity={dustP * (0.35 + 0.25 * rand(i + 40))} />)}
                {cut > 0 && (
                  <g>
                    <circle cx={VH.x} cy={VH.y - 60} r={135 * VH.s * ease.outBack(cut)} fill={C.ink} />
                    <circle cx={VH.x} cy={VH.y - 60} r={135 * VH.s * ease.outBack(cut)} fill="none" stroke={C.theoryLight} strokeWidth={4} strokeDasharray="12 9" />
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <circle key={i} cx={VH.x + Math.cos(i * 1.7 + t * 0.6) * 90 * cut} cy={VH.y - 60 + Math.sin(i * 2.3 + t * 0.5) * 70 * cut} r={4} fill={C.theoryLight} opacity={0.7 * cut} />
                    ))}
                  </g>
                )}
              </g>
            ),
          },
        ]}
      />
      {/* the inner bubble from S7 sinks back into the head */}
      {bubbleOut < 1 && (
        <g opacity={1 - bubbleOut} transform={`translate(${BUB.x} ${BUB.y}) scale(${1 - 0.4 * bubbleOut}) translate(${-BUB.x} ${-BUB.y + 0})`}>
          <Bubble x={BUB.x} y={BUB.y} w={BUB.w} h={BUB.h} kind="inner" to={{x: 800, y: 470}} size={60} text={SENT} />
        </g>
      )}
      <Tag x={1270} y={330} text="Silent" kind="caution" size={48} anchor="left" p={ramp(t, T.vibrated + 0.1, T.vibrated + 0.6, ease.out) * (1 - ramp(t, T.yet, T.yet + 0.3))} />
      {mind > 0 && (
        <g opacity={mind}>
          <rect x={0} y={0} width={1920} height={1080} fill={C.ink} />
          <MindSpace t={t} bg="ink" seed={7} density={0.3} />
          <MindSentence t={t} />
        </g>
      )}
    </Stage>
  );
};

// ───────────────────────── S9 · 41.80 · three open loops ─────────────────────────
const Q: {at: number; y: number; size: number; ix: number; parts: [string, string][]}[] = [
  {at: T.s9, y: 290, size: 68, ix: 300, parts: [['What did the computer read?', C.paperLight]]},
  {at: T.q2, y: 520, size: 68, ix: 300, parts: [['What is a voice with no sound?', C.paperLight]]},
  {at: T.q3, y: 840, size: 84, ix: 300, parts: [['Why do some people have ', C.paperLight], ['none', C.oxLight], ['?', C.paperLight]]},
];
const MiniMonitor: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={-90} y={-62} width={180} height={116} rx={10} fill={C.inkLift} />
    <rect x={-78} y={-50} width={156} height={92} rx={4} fill={C.inkSoft} />
    <Waveform x={-66} y={-4} w={132} amp={16} t={t} kind="eeg" color={C.theoryLight} width={3} seed={2} speed={120} />
    <rect x={-10} y={54} width={20} height={20} fill={C.inkLift} />
    <rect x={-44} y={72} width={88} height={8} rx={4} fill={C.inkLift} />
  </g>
);
export const S9: React.FC<{t: number}> = ({t}) => {
  const tx = 470;
  const grow = ramp(t, T.never - 0.4, T.end + 0.6, ease.inOutSine);
  // slow push toward the empty bubble (anchor = bubble), small enough that the longest line stays in SAFE
  const z = lerp(1, 1.05, ramp(t, T.s9, T.end + 0.6, ease.inOutSine));
  const BX = 410;
  const BY = 650;
  return (
    <Stage bg={C.ink}>
      <Particles t={t} x={0} y={0} w={1920} h={1080} n={30} seed={19} size={[2, 4]} color={C.theoryTint} opacity={[0.1, 0.3]} vx={3} vy={-5} />
      <g transform={`translate(${BX} ${BY}) scale(${z}) translate(${-BX} ${-BY})`}>
        {Q.map((q, i) => {
          const k = ramp(t, q.at - 0.15, q.at + 0.45, ease.out);
          if (k <= 0) return null;
          const next = Q[i + 1];
          const dimK = next ? ramp(t, next.at - 0.1, next.at + 0.4, ease.inOut) : 0;
          const ik = ramp(t, q.at - 0.2, q.at + 0.35, ease.outBack);
          const full = q.parts.map((pp) => pp[0]).join('');
          const size = Math.min(q.size, (1630 - tx) / (textW(full, 100, 'serif', 600) / 100));
          return (
            <g key={i} opacity={k * (1 - 0.5 * dimK)} transform={`translate(${(1 - k) * 40} 0)`}>
              <g transform={`translate(${q.ix} ${q.y - size * 0.32}) scale(${ik})`}>
                {i === 0 && <MiniMonitor t={t} />}
                {i === 1 && <SilentWave x={-90} y={0} w={180} amp={62} t={t} silent={1} tone="ink" seed={8} id="s9wave" />}
                {i === 2 && (
                  <g>
                    <HeadProfile x={-70} y={40} s={0.5} skin={C.skin[3]} t={t} />
                    <g transform={`translate(110 -150) scale(${1 + 0.22 * grow})`}>
                      <ellipse cx={0} cy={0} rx={96} ry={60} fill="none" stroke={C.theoryLight} strokeWidth={5} strokeDasharray="13 10" />
                      <circle cx={-56} cy={74} r={11} fill="none" stroke={C.theoryLight} strokeWidth={4} strokeDasharray="6 5" />
                      <circle cx={-76} cy={102} r={6} fill="none" stroke={C.theoryLight} strokeWidth={3} />
                    </g>
                  </g>
                )}
              </g>
              <text x={tx} y={q.y} fontFamily={FONT_SERIF} fontWeight={600} fontSize={size} xmlSpace="preserve">
                {q.parts.map(([s, col], j) => (
                  <tspan key={j} fill={col}>
                    {s}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </g>
    </Stage>
  );
};
