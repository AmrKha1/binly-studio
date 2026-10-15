// Custom shots for C04 (builder-owned). Each: export const S<n>: React.FC<{t: number}> returning a full <Stage>.
import React from 'react';
import {getLength, getPointAtLength} from '@remotion/paths';
import {Stage, Cam, World, breathe} from '../../../kit/stage';
import {C, FONT_SANS, FONT_SERIF} from '../../../kit/theme';
import {CamState, camAt, clamp01, ease, lerp, ramp, rand, win} from '../../../kit/anim';
import {Headline, Kicker, Tag, RedPen, Circled, textW} from '../../../kit/text';
import {CrossOut, Bracket} from '../../../kit/diagrams';
import {LightPool, Particles, Pulse} from '../../../kit/fx';
import {HeadProfile} from '../../../kit/science';
import {Person} from '../../../kit/people';
import {Icon, IconName} from '../../../kit/icons';
import {Photo} from '../../../kit/photo';
import {DecoderRig, DECODER_HEAD, SilentWave} from '../shared';
import {NightRig} from '../shared/NightRoom';

const T = {
  open: 202.2, // "Which brings us back to the computer."
  ears: 205.08, // "It wasn't listening to the ears."
  throat: 206.76, // "It wasn't listening to the throat."
  s2: 207.4, // "It was listening to the motor cortex,"
  motor: 208.32, // "motor cortex"
  controlling: 211.0, // "involved in controlling speech"
  s3: 212.32, // "In four participants,"
  imagining: 214.98, // "imagining a sentence"
  similar: 216.54, // "a pattern similar"
  trying: 217.54, // "to trying to say it"
  weaker: 218.55, // "Weaker,"
  close: 219.2, // "but close,"
  different: 220.24, // "and different enough to tell apart."
  s4: 221.86, // "From that, the computer decoded…"
  decoded: 223.04, // "decoded"
  realTime: 224.98, // "in real time"
  n74: 226.38, // "74 percent"
  vocab: 228.72, // "vocabulary"
  n125k: 229.25, // "125,000" (between "of" and "words")
  words: 231.28, // "words"
  s5: 232.06, // "It even caught numbers…"
  numbers: 232.56, // "numbers participants"
  counting: 233.82, // "silently counting"
  unasked: 234.88, // "without being asked"
  s6: 236.36, // "That last detail…"
  password: 238.68, // "built the password"
  translates: 239.84, // "only translates"
  choose: 241.44, // "chooses to start"
  s7: 242.57, // "This is not mind reading."
  people: 243.99, // "four people"
  electrodes: 245.04, // "implanted electrodes"
  tasks: 246.5, // "controlled tasks"
  lock: 247.82, // "a lock the user holds"
  s8: 249.35, // "What the computer found wasn't a secret thought."
  secret: 250.74, // "secret thought"
  speech: 251.56, // "It was speech with the sound taken out."
  soundOut: 252.7, // "sound taken out"
  end: 253.7,
};

// ───────────────────────── the decoder room (same world as C01 S1/S3/S4/S6) ─────────────────────────
const RIG = {x: 1060, y: 940, s: 1.25};
const rw = (lx: number, ly: number) => ({x: RIG.x + lx * RIG.s, y: RIG.y + ly * RIG.s});
const HEAD = rw(DECODER_HEAD.x, DECODER_HEAD.y); // ≈ (517, 497)
const EAR = rw(DECODER_HEAD.x - 28, DECODER_HEAD.y + 4);
const THROAT = rw(DECODER_HEAD.x + 4, DECODER_HEAD.y + 78);
const PED = rw(DECODER_HEAD.x - 16 + 2, DECODER_HEAD.y - 58 - 12);
const GLASS = {x: -160, y: -526, w: 500, h: 300};
const SCREEN_C = rw(GLASS.x + GLASS.w / 2, GLASS.y + GLASS.h / 2); // ≈ (1172, 470)
const scr = (cam: CamState, p: {x: number; y: number}) => ({x: (p.x - cam.cx) * cam.z + 960, y: (p.y - cam.cy) * cam.z + 540});

// cable path (rig-local, mirrors DecoderRig's own cable)
const PEDL = {x: DECODER_HEAD.x - 16, y: DECODER_HEAD.y - 58};
const CABLE_D = `M${PEDL.x + 2} ${PEDL.y - 22} C${PEDL.x + 10} ${PEDL.y - 150} ${90 - 250 - 120} ${-526 - 110} ${90 - 250 + 6} ${-526 + 70}`;
const CABLE_LEN = getLength(CABLE_D);

const RigWorld = NightRig; // shared night room + flat lighting (../shared/NightRoom)

/** dashed plum wave flowing across the screen's top strip (glass coords) */
const FlowWave: React.FC<{t: number; p: number; w?: number; y?: number; amp?: number}> = ({t, p, w = GLASS.w - 60, y = 58, amp = 26}) => {
  if (p <= 0) return null;
  const n = 90;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = 30 + u * w * p;
    const env = 0.35 + 0.65 * Math.abs(Math.sin(u * 7.3 + t * 1.1)) * (0.6 + 0.4 * Math.sin(u * 2.1 - t * 0.7));
    const yy = y + Math.sin(u * 46 - t * 9) * amp * env;
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${yy.toFixed(1)} `;
  }
  return (
    <g>
      <rect x={18} y={y - 40} width={GLASS.w - 36} height={80} rx={8} fill={C.ink} opacity={0.6} />
      <path d={d} fill="none" stroke={C.theoryLight} strokeWidth={4} strokeDasharray="9 7" strokeLinecap="round" />
    </g>
  );
};

const CrossAt: React.FC<{x: number; y: number; glow: number; cross: number; size: number}> = ({x, y, glow, cross, size}) => (
  <g>
    {glow > 0 && <circle cx={x} cy={y} r={size * 0.55 * (0.8 + 0.2 * glow)} fill={C.theoryLight} opacity={0.45 * glow * (1 - 0.5 * cross)} />}
    {glow > 0 && glow < 1 && <Pulse x={x} y={y} r={size * 0.9} p={glow} color={C.theoryTint} />}
    <CrossOut x={x} y={y} size={size} p={cross} width={12} />
  </g>
);

// ───────────────────────── S1 · 202.20 · "Which brings us back to the computer… not the ears… not the throat" ─────────────────────────
export const S1: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(
    camAt(t, [
      [T.open - 0.6, 900, 520, 1.5],
      [T.open, 880, 520, 1.5],
      [T.open + 1.8, HEAD.x + 60, HEAD.y + 40, 2.5],
      [T.throat - 0.3, HEAD.x + 50, HEAD.y + 50, 2.7],
      [T.s2 + 0.3, HEAD.x + 40, HEAD.y + 20, 3.0],
    ]),
    t,
  );
  const e = scr(cam, EAR);
  const th = scr(cam, THROAT);
  const earGlow = ramp(t, T.ears - 0.25, T.ears + 0.2, ease.out);
  const earX = ramp(t, T.ears + 0.15, T.ears + 0.55, ease.out);
  const thGlow = ramp(t, T.throat - 0.25, T.throat + 0.2, ease.out);
  const thX = ramp(t, T.throat + 0.15, T.throat + 0.55, ease.out);
  return (
    <Stage bg={C.night}>
      <RigWorld t={t} cam={cam} signal={0.35} id="s1" />
      {thGlow > 0 && (
        <line x1={th.x - 4 * cam.z} y1={th.y - 22 * cam.z} x2={th.x + 2 * cam.z} y2={th.y + 18 * cam.z} stroke={C.theoryTint} strokeWidth={6 * cam.z} strokeLinecap="round" opacity={thGlow} />
      )}
      <CrossAt x={e.x} y={e.y} glow={earGlow} cross={earX} size={60 * cam.z / 2.5} />
      <CrossAt x={th.x} y={th.y} glow={thGlow} cross={thX} size={60 * cam.z / 2.5} />
    </Stage>
  );
};

// ───────────────────────── S2 · 207.40 · "It was listening to the motor cortex…" ─────────────────────────
const HP = {x: 760, y: 600, s: 1.2};
const MOTOR = {x: HP.x + 42 * HP.s, y: HP.y - 140 * HP.s};
export const S2: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s2, 820, 560, 1.0], [T.s2 + 4.9, 860, 520, 1.12]], ease.inOutSine), t);
  const hp = ramp(t, T.motor - 0.2, T.motor + 0.5, ease.out);
  const sig = ramp(t, T.motor + 0.4, T.motor + 2.0, ease.inOut);
  const m = scr(cam, MOTOR);
  const lab = {x: 1080, y: 220};
  const cp = ramp(t, T.motor, T.motor + 0.6, ease.out);
  return (
    <Stage bg={C.night}>
      <Particles t={t} x={100} y={100} w={1720} h={880} n={26} seed={4} size={[2, 4]} color={C.theoryTint} opacity={[0.12, 0.35]} vx={3} vy={-5} />
      <Cam cam={cam}>
        <LightPool x={HP.x + 60} y={HP.y - 40} r={520} color={C.theoryTint} strength={0.12} sy={1} />
        <HeadProfile x={HP.x} y={HP.y} s={HP.s} skin={C.skin[3]} showBrain implant highlight="motor" hp={hp} signal={sig} t={t} />
        {hp > 0 && <Pulse x={MOTOR.x} y={MOTOR.y} r={90} p={ramp(t, T.motor, T.motor + 0.9, ease.out)} color={C.theoryTint} />}
      </Cam>
      {cp > 0 && (
        <g opacity={cp}>
          <circle cx={m.x} cy={m.y} r={9} fill={C.paperLight} />
          <path d={`M${m.x} ${m.y} L${lerp(m.x, lab.x - 30, cp)} ${lerp(m.y, lab.y, cp)} L${lab.x - 30 + 0 * cp} ${lab.y}`} fill="none" stroke={C.paperLight} strokeWidth={4} />
          <text x={lab.x} y={lab.y + 18} fontFamily={FONT_SANS} fontWeight={700} fontSize={52} letterSpacing={3} fill={C.paperLight}>
            MOTOR CORTEX
          </text>
        </g>
      )}
      <Tag x={1800} y={lab.y + 100} anchor="right" text="Involved in controlling speech" kind="confirmed" size={38} p={ramp(t, T.controlling - 0.2, T.controlling + 0.4, ease.out)} />
    </Stage>
  );
};

// ───────────────────────── S3 · 212.32 · "In four participants… weaker, but close, and different enough" ─────────────────────────
const ROWS = 6;
const PW = 1300;
const PX = 260;
const PANEL_H = 250;
const TOP_Y = 330;
const BOT_Y = 680;
const CENTERS = [0.1, 0.27, 0.46, 0.64, 0.84];
const DIFF: Record<number, number> = {1: 1, 3: 3, 5: 0}; // row → burst index that differs in the imagined pattern
const DIFF_SPOTS = Object.entries(DIFF).map(([r, b]) => ({row: +r, u: CENTERS[b] + (rand(+r * 9 + 3) > 0.5 ? 0.05 : -0.05)}));

const envAt = (u: number, row: number, alt: boolean) => {
  let v = 0;
  CENTERS.forEach((c, b) => {
    const on = rand(row * 17 + b * 5 + 1) > 0.32;
    let cc = c + (rand(row * 3 + b) - 0.5) * 0.03;
    let a = on ? 0.45 + 0.55 * rand(row * 11 + b * 7 + 2) : 0;
    const w = 0.035 + 0.02 * rand(row + b * 13);
    if (alt && DIFF[row] === b) {
      cc += rand(row * 9 + 3) > 0.5 ? 0.05 : -0.05;
      a = Math.max(a, 0.8);
    }
    v += a * Math.exp(-(((u - cc) / w) ** 2));
  });
  return Math.min(1, v);
};

const RowPattern: React.FC<{row: number; y: number; amp: number; alt: boolean; t: number}> = ({row, y, amp, alt, t}) => {
  const n = 160;
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const jit = 0.75 + 0.25 * Math.sin(u * 140 + row * 2.3 + t * 3);
    const f = envAt(u, row, alt) * jit;
    const x = PX + 40 + u * (PW - 80);
    top.push(`${x.toFixed(1)} ${(y - f * amp).toFixed(1)}`);
    bot.push(`${x.toFixed(1)} ${(y + f * amp * 0.75).toFixed(1)}`);
  }
  const d = `M${top.join(' L')} L${bot.reverse().join(' L')} Z`;
  return alt ? (
    <g>
      <path d={d} fill={C.theoryLight} opacity={0.65} />
      <path d={d} fill="none" stroke={C.theory} strokeWidth={3.5} strokeDasharray="8 5" strokeLinejoin="round" />
    </g>
  ) : (
    <path d={d} fill={C.ink} />
  );
};

const Panel: React.FC<{y: number; alt: boolean; draw: number; ampK: number; t: number; id: string; label: string; lp: number}> = ({y, alt, draw, ampK, t, id, label, lp}) => {
  const gap = PANEL_H / (ROWS + 0.4);
  const head = PX + 40 + (PW - 80) * draw;
  return (
    <g>
      <Kicker x={PX} y={y - 22} text={label} anchor="start" size={36} color={alt ? C.theoryTint : C.paperShade} p={lp} />
      <rect x={PX} y={y} width={PW} height={PANEL_H} rx={14} fill={C.paperLight} />
      {Array.from({length: ROWS}, (_, r) => (
        <line key={r} x1={PX + 40} x2={PX + PW - 40} y1={y + gap * (r + 0.7)} y2={y + gap * (r + 0.7)} stroke={C.paperDeep} strokeWidth={1.5} />
      ))}
      <clipPath id={`c04-s3-${id}`}>
        <rect x={PX} y={y} width={head - PX} height={PANEL_H} />
      </clipPath>
      <g clipPath={`url(#c04-s3-${id})`}>
        {Array.from({length: ROWS}, (_, r) => (
          <RowPattern key={r} row={r} y={y + gap * (r + 0.7)} amp={gap * 0.62 * ampK} alt={alt} t={t} />
        ))}
      </g>
      {draw > 0 && draw < 1 && <line x1={head} x2={head} y1={y + 8} y2={y + PANEL_H - 8} stroke={alt ? C.theory : C.oxLight} strokeWidth={4} />}
    </g>
  );
};

const Seated: React.FC<{x: number; y: number; t: number; seed: number; p: number}> = ({x, y, t, seed, p}) => {
  if (p <= 0) return null;
  const k = ease.outBack(clamp01(p));
  return (
    <g opacity={clamp01(p * 3)} transform={`translate(${x} ${y + (1 - k) * 60}) scale(2)`}>
      <rect x={-130} y={-170} width={26} height={170} rx={8} fill={C.inkLift} />
      <rect x={-140} y={-112} width={130} height={18} rx={6} fill={C.inkLift} />
      <Person x={0} y={0} s={0.62} t={t} sit={1} facing={1} silhouette={C.paperLight} seed={seed} />
    </g>
  );
};

export const S3: React.FC<{t: number}> = ({t}) => {
  const outA = ramp(t, T.imagining - 0.4, T.imagining + 0.2, ease.inOut);
  const inB = ramp(t, T.imagining - 0.3, T.imagining + 0.4, ease.out);
  const ampK = 1 - 0.35 * ramp(t, T.weaker - 0.15, T.weaker + 0.55, ease.inOut);
  const botDraw = ramp(t, T.imagining, T.similar + 0.6, ease.inOutSine);
  const topDraw = ramp(t, T.trying - 0.3, T.trying + 0.9, ease.inOutSine);
  const gap = PANEL_H / (ROWS + 0.4);
  const z = lerp(1, 1.04, ramp(t, T.s3, T.s4, ease.inOutSine));
  return (
    <Stage bg={C.ink}>
      <Particles t={t} x={100} y={100} w={1720} h={880} n={20} seed={8} size={[2, 4]} color={C.theoryLight} opacity={[0.1, 0.3]} vx={3} vy={-4} />
      {/* A · four participants */}
      {outA < 1 && (
        <g opacity={1 - outA} transform={`translate(0 ${-outA * 160})`}>
          <Kicker x={960} y={190} text="4 PARTICIPANTS" size={52} color={C.paperShade} p={ramp(t, T.s3 - 0.1, T.s3 + 0.5, ease.out)} />
          {[0, 1, 2, 3].map((i) => (
            <Seated key={i} x={575 + i * 330} y={900} t={t} seed={i + 3} p={ramp(t, T.s3 + 0.15 + i * 0.12, T.s3 + 0.65 + i * 0.12, (x) => x)} />
          ))}
        </g>
      )}
      {/* B · trying vs imagining */}
      {inB > 0 && (
        <g opacity={inB} transform={`translate(960 540) scale(${z}) translate(-960 ${-540 + (1 - inB) * 120})`}>
          <Panel y={TOP_Y} alt={false} draw={topDraw} ampK={1} t={t} id="top" label="TRYING TO SAY IT" lp={ramp(t, T.trying - 0.3, T.trying + 0.3, ease.out)} />
          <Panel y={BOT_Y} alt draw={botDraw} ampK={ampK} t={t} id="bot" label="IMAGINING IT" lp={ramp(t, T.imagining - 0.1, T.imagining + 0.5, ease.out)} />
          <Bracket a={{x: PX + PW + 30, y: TOP_Y + PANEL_H / 2}} b={{x: PX + PW + 30, y: BOT_Y + PANEL_H / 2}} depth={-60} color={C.paperShade} p={ramp(t, T.close - 0.15, T.close + 0.5, ease.out)} />
          {DIFF_SPOTS.map((s, i) => (
            <Circled key={i} x={PX + 40 + s.u * (PW - 80)} y={BOT_Y + gap * (s.row + 0.7)} rx={52} ry={30} color={C.caution} thick={6} p={ramp(t, T.different - 0.1 + i * 0.22, T.different + 0.4 + i * 0.22, ease.out)} />
          ))}
        </g>
      )}
    </Stage>
  );
};

// ───────────────────────── S4 · 221.86 · "decoded imagined sentences… 74 percent… 125,000 words" ─────────────────────────
const BARS = [
  [300, 110],
  [380, 0],
  [250, 150],
  [340, 60],
];
const WALL = (() => {
  const out: {x: number; y: number; w: number; o: number}[] = [];
  for (let r = 0; r < 24; r++) {
    let x = 14 + rand(r * 7) * 10;
    let k = 0;
    while (x < GLASS.w - 14) {
      const w = 10 + rand(r * 31 + k * 3) * 30;
      out.push({x, y: 10 + r * 12, w: Math.min(w, GLASS.w - 14 - x), o: (x / GLASS.w + r / 24) / 2});
      x += w + 6;
      k++;
    }
  }
  return out;
})();
const S4_KEYS: [number, number, number, number][] = [
  [T.s4 - 0.6, SCREEN_C.x - 30, SCREEN_C.y + 10, 2.1],
  [T.s4, SCREEN_C.x - 30, SCREEN_C.y + 10, 2.1],
  [T.decoded + 0.4, SCREEN_C.x, SCREEN_C.y + 6, 2.55],
  [T.s5, SCREEN_C.x, SCREEN_C.y + 6, 2.62],
  [T.s6, SCREEN_C.x, SCREEN_C.y + 6, 2.7],
];
const ScreenDecode: React.FC<{t: number}> = ({t}) => {
  const wallP = (o: number) => ramp(t, T.n125k - 0.2 + o * 1.4, T.n125k + 0.2 + o * 1.4, ease.out);
  const dimBars = 1 - 0.65 * ramp(t, T.n125k - 0.2, T.n125k + 0.6, ease.out);
  return (
    <g>
      <rect x={0} y={0} width={GLASS.w} height={GLASS.h} fill={C.inkSoft} />
      {WALL.map((b, i) => {
        const p = wallP(b.o);
        return p > 0 ? <rect key={i} x={b.x} y={b.y} width={b.w * p} height={6} rx={3} fill={C.inkFaint} opacity={0.55 * p} /> : null;
      })}
      <g opacity={dimBars}>
        <FlowWave t={t} p={ramp(t, T.s4 + 0.1, T.decoded, ease.out)} />
        {BARS.map(([w, indent], i) => {
          const s = T.decoded + i * 1.25;
          const p = ramp(t, s, s + 1.0, ease.inOut);
          if (p <= 0) return null;
          const y = 140 + i * 40;
          const live = p < 1;
          // a bar line = 2–3 word chunks
          const chunks = [0.32, 0.22, 0.46].map((f) => f * w);
          let cx = 30 + indent * 0;
          return (
            <g key={i}>
              {chunks.map((cw, k) => {
                const a = k / chunks.length;
                const kp = clamp01((p - a) * chunks.length);
                const x0 = cx;
                cx += cw + 12;
                return kp > 0 ? <rect key={k} x={x0} y={y - 11} width={cw * kp} height={20} rx={10} fill={C.paperShade} opacity={0.75} /> : null;
              })}
              {live && <rect x={30 + w * p + 22} y={y - 14} width={12} height={26} fill={C.theoryLight} />}
            </g>
          );
        })}
      </g>
    </g>
  );
};
const Badge74: React.FC<{t: number}> = ({t}) => {
  const p = ramp(t, T.n74 - 0.2, T.n74 + 0.35, (x) => x);
  if (p <= 0) return null;
  const k = ease.outBack(clamp01(p));
  const mv = ramp(t, T.n125k - 0.4, T.n125k + 0.3, ease.inOut);
  const x = 960;
  const y = lerp(540, 250, mv);
  const sc = lerp(1, 0.62, mv) * (0.4 + 0.6 * k);
  const txt = 'UP TO 74%';
  const w = textW(txt, 150, 'serif', 700) + 120;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={clamp01(p * 3)}>
      <rect x={-w / 2} y={-110} width={w} height={220} rx={110} fill={C.oxblood} />
      <text x={0} y={52} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={150} fill={C.paperLight}>
        {txt}
      </text>
    </g>
  );
};
const VocabLabel: React.FC<{p: number}> = ({p}) => {
  if (p <= 0) return null;
  const txt = '125,000-WORD VOCABULARY';
  const size = 54;
  const w = textW(txt, size, 'sansCaps', 700) + 90;
  return (
    <g opacity={p} transform={`translate(960 ${720 + (1 - p) * 30})`}>
      <rect x={-w / 2} y={-55} width={w} height={110} rx={18} fill={C.ink} />
      <text x={0} y={19} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={size} letterSpacing={3} fill={C.paperLight}>
        {txt}
      </text>
    </g>
  );
};
export const S4: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, S4_KEYS), t, 0.5);
  return (
    <Stage bg={C.night}>
      <RigWorld t={t} cam={cam} signal={1} overlay={<ScreenDecode t={t} />} id="s4" />
      <Badge74 t={t} />
      <VocabLabel p={ramp(t, T.n125k + 0.1, T.n125k + 0.6, ease.out)} />
    </Stage>
  );
};

// ───────────────────────── S5 · 232.06 · "It even caught numbers… without being asked" ─────────────────────────
const DIGITS = ['1', '2', '3', '4'];
const DIGIT_T = [232.5, 233.3, 234.1, 234.9];
const ScreenCount: React.FC<{t: number}> = ({t}) => {
  const clear = ramp(t, T.s5 - 0.05, T.s5 + 0.4, ease.out);
  return (
    <g>
      <rect x={0} y={0} width={GLASS.w} height={GLASS.h} fill={C.inkSoft} />
      {clear < 1 && <g opacity={1 - clear}><ScreenDecode t={t} /></g>}
      <FlowWave t={t} p={1} amp={18} />
      {DIGITS.map((d, i) => {
        const p = ramp(t, DIGIT_T[i] - 0.1, DIGIT_T[i] + 0.3, ease.out);
        if (p <= 0) return null;
        const x = 70 + i * 120;
        const y = 228;
        return (
          <g key={i} opacity={p} transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * ease.outBack(p)})`}>
            <text x={0} y={0} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={110} fill={C.theory} opacity={0.35}>
              {d}
            </text>
            <text x={0} y={0} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={110} fill="none" stroke={C.theoryTint} strokeWidth={3} strokeDasharray="7 5">
              {d}
            </text>
            {i < 3 && [0, 1, 2].map((k) => <circle key={k} cx={46 + k * 12} cy={-14} r={3.5} fill={C.theoryLight} opacity={ramp(t, DIGIT_T[i] + 0.2 + k * 0.12, DIGIT_T[i] + 0.35 + k * 0.12)} />)}
          </g>
        );
      })}
    </g>
  );
};
export const S5: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, S4_KEYS), t, 0.5);
  const vocOut = 1 - ramp(t, T.s5 - 0.05, T.s5 + 0.35, ease.out);
  return (
    <Stage bg={C.night}>
      <RigWorld t={t} cam={cam} signal={1} overlay={<ScreenCount t={t} />} id="s5" />
      {vocOut > 0 && <g opacity={vocOut}><Badge74 t={t} /><VocabLabel p={1} /></g>}
      <Tag x={960} y={930} anchor="center" text="Without being asked" kind="caution" size={46} p={ramp(t, T.unasked - 0.2, T.unasked + 0.4, ease.out)} />
    </Stage>
  );
};

// ───────────────────────── S6 · 236.36 · "…why the team built the password… chooses to start" ─────────────────────────
const PW_WORDS = ['chitty', 'chitty', 'bang', 'bang'];
const PW_T0 = 237.2;
const PW_GAP = 0.55;
const PW_DUR = 1.9;
const BigLock: React.FC<{open: number; x: number; y: number; s: number}> = ({open, x, y, s}) => {
  const col = open > 0.5 ? C.evidence : C.caution;
  const shk = open > 0.5 ? C.evidenceLight : C.cautionLight;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-16 -4 L-16 -24 A16 16 0 0 1 16 -24 L16 -4" fill="none" stroke={shk} strokeWidth={7} strokeLinecap="round" transform={`translate(0 ${-12 * open}) rotate(${-32 * open} 16 -4)`} />
      <rect x={-24} y={-8} width={48} height={38} rx={7} fill={col} />
      <circle cx={0} cy={8} r={5} fill={C.ink} />
      <rect x={-2} y={8} width={4} height={10} fill={C.ink} />
    </g>
  );
};
const ScreenPassword: React.FC<{t: number}> = ({t}) => {
  const open = ramp(t, T.choose - 0.1, T.choose + 0.35, ease.outBack);
  const sz = 30;
  const ws = PW_WORDS.map((w) => textW(w, sz, 'serif', 500));
  let cx = 30;
  return (
    <g>
      <rect x={0} y={0} width={GLASS.w} height={GLASS.h} fill={C.inkSoft} />
      <FlowWave t={t} p={1} w={GLASS.w - 150} amp={12 + 14 * open} />
      <BigLock open={open} x={GLASS.w - 52} y={52} s={1.1} />
      {open > 0 && open < 1 && <Pulse x={GLASS.w - 52} y={56} r={70} p={ramp(t, T.choose, T.choose + 0.7)} color={C.evidenceLight} />}
      {PW_WORDS.map((w, i) => {
        const arr = PW_T0 + i * PW_GAP + PW_DUR;
        const p = ramp(t, arr - 0.15, arr + 0.25, ease.out);
        const x0 = cx;
        cx += ws[i] + 16;
        if (p <= 0) return null;
        const solid = ramp(t, T.choose + 0.2, T.choose + 0.6, ease.out);
        return (
          <g key={i} opacity={p}>
            <text x={x0} y={200} fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={500} fontSize={sz} fill={solid > 0.5 ? C.paperLight : C.theoryTint}>
              {w}
            </text>
            <line x1={x0} y1={210} x2={x0 + ws[i]} y2={210} stroke={solid > 0.5 ? C.evidenceLight : C.theoryLight} strokeWidth={3} strokeDasharray={solid > 0.5 ? undefined : '7 5'} />
          </g>
        );
      })}
      {/* after unlocking: translation begins */}
      {[0, 1].map((k) => {
        const p = ramp(t, T.choose + 0.5 + k * 0.4, T.choose + 1.1 + k * 0.4, ease.out);
        return p > 0 ? <rect key={k} x={30} y={238 + k * 28} width={[300, 200][k] * p} height={16} rx={8} fill={C.paperShade} opacity={0.6} /> : null;
      })}
    </g>
  );
};
export const S6: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s6 - 0.4, 920, 480, 1.45], [T.choose, 900, 470, 1.55], [T.s7 + 0.6, 905, 470, 1.58]], ease.inOutSine), t);
  const flying = PW_WORDS.map((w, i) => {
    const t0 = PW_T0 + i * PW_GAP;
    const u = ramp(t, t0, t0 + PW_DUR, ease.inOutSine);
    const appear = ramp(t, t0 - 0.35, t0 + 0.05, ease.out);
    if (appear <= 0 || u >= 1) return null;
    const pt = getPointAtLength(CABLE_D, u * CABLE_LEN);
    if (!pt) return null;
    const wp = rw(pt.x, pt.y);
    const lift = 34;
    const spread = (1 - ease.out(clamp01(u * 2.5))) * (i - 1.5) * 150;
    const o = appear * (1 - ramp(u, 0.85, 1));
    const fs = 44;
    const ww = textW(w, fs, 'serif', 500);
    return (
      <g key={i} opacity={o} transform={`translate(${wp.x + spread} ${wp.y - lift})`}>
        <rect x={-ww / 2 - 10} y={-fs} width={ww + 20} height={fs + 18} rx={10} fill={C.ink} opacity={0.75} />
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={500} fontSize={fs} fill={C.theoryTint}>
          {w}
        </text>
        <line x1={-ww / 2} y1={9} x2={ww / 2} y2={9} stroke={C.theoryLight} strokeWidth={3} strokeDasharray="7 5" />
      </g>
    );
  });
  const sig = 0.4 + 0.6 * ramp(t, T.choose, T.choose + 0.8, ease.out);
  return (
    <Stage bg={C.night}>
      <RigWorld t={t} cam={cam} signal={sig} overlay={<ScreenPassword t={t} />} extra={<g>{flying}</g>} id="s6" />
      <rect x={1010} y={912} width={340} height={64} rx={12} fill={C.ink} opacity={ramp(t, T.password - 0.2, T.password + 0.4, ease.out) * 0.85} />
      <Kicker x={1180} y={960} text="THE PASSWORD" size={48} color={C.paperShade} p={ramp(t, T.password - 0.2, T.password + 0.4, ease.out)} />
    </Stage>
  );
};

// ───────────────────────── S7 · 242.57 · "This is not mind reading. Four people, implanted electrodes…" ─────────────────────────
const LIST: [IconName, string, number][] = [
  ['people', 'Four people', T.people],
  ['chip', 'Implanted electrodes', T.electrodes],
  ['document', 'Controlled tasks', T.tasks],
  ['lock', 'A lock the user holds', T.lock],
];
export const S7: React.FC<{t: number}> = ({t}) => {
  const ph = {x: 1440, y: 460, w: 480, h: 720};
  return (
    <Stage bg={C.paper}>
      <Headline x={150} y={250} anchor="start" text="Not mind reading" size={104} p={ramp(t, T.s7 - 0.15, T.s7 + 0.7, (x) => x)} />
      {LIST.map(([icon, txt, at], i) => {
        const p = ramp(t, at - 0.2, at + 0.35, ease.out);
        if (p <= 0) return null;
        const y = 430 + i * 135;
        return (
          <g key={i} opacity={clamp01(p * 2)} transform={`translate(${(1 - p) * -30} 0)`}>
            <Icon name={icon} x={205} y={y - 4} s={1.0} color={C.ink} accent={i === 3 ? C.evidence : C.theory} knock={C.paper} p={p} />
            <text x={290} y={y + 20} fontFamily={FONT_SERIF} fontWeight={600} fontSize={64} fill={C.ink}>
              {txt}
            </text>
          </g>
        );
      })}
      <Photo slug="inner-voice" src="img/braingate.jpg" x={ph.x} y={ph.y} w={ph.w} h={ph.h} frame="print" tint="paper" t={t} rot={1.2} p={ramp(t, T.s7 - 0.1, T.s7 + 0.6, ease.out)}
        pan={{a: T.s7, b: T.s8 + 0.4, from: [0.5, 0.55, 1.0], to: [0.6, 0.43, 1.45]}} />
      <g opacity={ramp(t, T.s7 + 0.4, T.s7 + 1.0, ease.out)}>
        <text x={ph.x} y={ph.y + ph.h / 2 + 70} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={34} fill={C.ink}>
          A brain–computer interface system
        </text>
        <text x={ph.x} y={ph.y + ph.h / 2 + 112} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={34} fill={C.ink}>
          on display (BrainGate)
        </text>
        <text x={ph.x} y={ph.y + ph.h / 2 + 150} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={600} fontSize={24} letterSpacing={1} fill={C.inkMute}>
          PaulWicks · Public domain
        </text>
      </g>
    </Stage>
  );
};

// ───────────────────────── S8 · 249.35 · "…wasn't a secret thought. It was speech with the sound taken out." ─────────────────────────
export const S8: React.FC<{t: number}> = ({t}) => {
  const cardIn = ramp(t, T.s8 - 0.05, T.s8 + 0.4, ease.out);
  const cardOut = ramp(t, T.speech - 0.25, T.speech + 0.3, ease.inOut);
  const txt = 'A secret thought';
  const fs = 76;
  const tw = textW(txt, fs, 'serif', 600);
  const cy = 540;
  const DW = 1000;
  const DH = 640;
  const dx = 960 - DW / 2;
  const dy = cy - DH / 2;
  const pc = 890; // label plate centre x
  const tx = pc - tw / 2;
  const wp = ramp(t, T.speech - 0.05, T.speech + 0.9, ease.out);
  const silent = ramp(t, T.speech + 0.35, T.soundOut + 0.6, ease.inOut);
  return (
    <Stage bg={C.paper}>
      <Particles t={t} x={120} y={160} w={1680} h={820} n={18} seed={5} size={[3, 6]} color={C.paperDark} opacity={[0.25, 0.5]} vx={6} vy={-4} />
      {cardOut < 1 && (
        <g opacity={(1 - cardOut) * cardIn} transform={`translate(960 ${cy}) scale(${(0.94 + 0.06 * cardIn) * (1 - 0.25 * cardOut)}) rotate(${-1.5 + 4 * cardOut}) translate(-960 ${-cy + cardOut * 80 + (1 - cardIn) * 40})`}>
          {/* flat offset shadow */}
          <rect x={dx + 16} y={dy + 18} width={DW} height={DH} rx={22} fill={C.paperDark} />
          {/* page block peeking out */}
          <rect x={dx + 24} y={dy + 14} width={DW - 18} height={DH - 8} rx={14} fill={C.paperLight} />
          {[0, 1, 2].map((i) => <line key={i} x1={dx + 40} x2={dx + DW - 4} y1={dy + DH - 2 - i * 5} y2={dy + DH - 2 - i * 5} stroke={C.paperDeep} strokeWidth={2} />)}
          {/* cover */}
          <rect x={dx} y={dy} width={DW - 14} height={DH - 14} rx={22} fill={C.wood} />
          <rect x={dx} y={dy} width={70} height={DH - 14} rx={22} fill={C.woodDark} />
          <rect x={dx + 50} y={dy} width={20} height={DH - 14} fill={C.woodDark} />
          <rect x={dx + 96} y={dy + 26} width={DW - 140} height={DH - 66} rx={14} fill="none" stroke={C.woodLight} strokeWidth={4} />
          {/* label plate */}
          <rect x={pc - tw / 2 - 50} y={cy - 85} width={tw + 100} height={150} rx={12} fill={C.paperLight} />
          <rect x={pc - tw / 2 - 38} y={cy - 73} width={tw + 76} height={126} rx={8} fill="none" stroke={C.paperDeep} strokeWidth={3} />
          <text x={tx} y={cy + 22} fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={fs} fill={C.ink}>
            {txt}
          </text>
          {/* strap + clasp lock */}
          <rect x={dx + DW - 170} y={dy - 10} width={70} height={DH + 6} rx={10} fill={C.woodDark} />
          <rect x={dx + DW - 200} y={cy - 70} width={130} height={140} rx={16} fill={C.metal} />
          <rect x={dx + DW - 190} y={cy - 60} width={110} height={120} rx={12} fill={C.stoneDark} />
          <Icon name="lock" x={dx + DW - 135} y={cy} s={0.95} color={C.ink} accent={C.caution} knock={C.stoneDark} />
          <RedPen lines={[{x: tx - 14, y: cy, w: tw + 28}]} strike p={ramp(t, T.secret - 0.2, T.secret + 0.45, (x) => x)} thick={12} />
        </g>
      )}
      <SilentWave x={210} y={650} w={1500} amp={150} t={t} p={wp} silent={silent} seed={4} id="c04hero" />
      <Headline x={960} y={300} text="Speech with the sound taken out." size={92} mode="words" accent={{sound: C.oxblood, taken: C.oxblood, out: C.oxblood}} p={ramp(t, T.speech + 0.3, T.soundOut + 0.9, (x) => x)} />
    </Stage>
  );
};
