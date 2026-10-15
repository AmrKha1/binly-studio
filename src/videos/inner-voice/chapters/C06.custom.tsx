// Custom shots for C06 "Is the voice a tool?" (builder-owned).
import React from 'react';
import {Stage, Cam, breathe, shake} from '../../../kit/stage';
import {C, FONT_SERIF, FONT_SANS} from '../../../kit/theme';
import {camAt, clamp01, countUp, ease, lerp, ramp} from '../../../kit/anim';
import {Headline, Kicker, Tag} from '../../../kit/text';
import {QuestionMark} from '../../../kit/diagrams';
import {Icon} from '../../../kit/icons';
import {Person, personHands} from '../../../kit/people';
import type {PersonProps} from '../../../kit/people';
import {MindSpace, Door, Floor, Plant} from '../../../kit/env';
import {HeadProfile} from '../../../kit/science';
import {BalanceScale} from '../../../kit/data';
import {Particles, Pulse} from '../../../kit/fx';
import {Shots} from '../../../kit/shots';

// ---- cue times (spoken words as comments)
const T = {
  s1: 354.6, // "Still, a voice built from borrowed machinery"
  effect: 358.3, // "could just be a side effect"
  job: 359.15, // "A feeling with no job."
  anything: 360.89, // "Does it do anything?"
  s2: 361.98, // "Hold a phone number in your head"
  phone: 362.34, // "phone number"
  someone: 365.08, // "Now someone makes you say"
  loud: 367.24, // "out loud"
  slip: 370.64, // "The number starts to slip."
  artic: 372.22, // "That's called articulatory suppression"
  s3: 376.97, // "It does something similar to switching between tasks."
  emerson: 380.56, // "Emerson and Miyake"
  math: 384.64, // "math and color"
  slower: 386.04, // "got slower at switching"
  disrupted: 388.3, // "inner speech was disrupted"
  cue: 389.22, // "people silently cue themselves"
  next: 392.39, // "Next, color."
  s4: 393.82, // "So the voice looks like a tool."
  tool: 394.88, // "tool"
  y2024: 395.62, // "A 2024 study complicated that."
  s5: 397.95, // "Two researchers,"
  ned: 399.44, // "Johanne Nedergaard"
  lup: 400.52, // "Gary Lupyan"
  little: 402.75, // "they found people who report having little of it"
  n46: 406.79, // "46 adults with low inner speech"
  n47: 409.8, // "47 with a lot"
  s6: 411.66, // "The low group did worse"
  wm: 413.12, // "verbal working memory"
  rhyme: 414.43, // "They were also slower and less accurate … rhyme"
  exactly: 419.56, // "Exactly what the voice-as-tool idea predicts."
  s7: 422.48, // "But on task switching,"
  ts: 422.8, // "task switching"
  nodiff: 426.41, // "there was no difference."
  end: 427.5,
};

const e = (t: number, a: number, b: number) => ramp(t, a, b, ease.out);

// ---------------- local helpers ----------------
/** Bubble that holds children: solid ink (spoken) or dashed plum (inner). */
const Bub: React.FC<{
  x: number; y: number; w: number; h: number; to?: {x: number; y: number}; p?: number; dashed?: boolean;
  stroke?: string; fill?: string; op?: number; children?: React.ReactNode;
}> = ({x, y, w, h, to, p = 1, dashed, stroke = C.ink, fill = C.paperLight, op = 1, children}) => {
  if (p <= 0 || op <= 0) return null;
  const k = ease.outBack(clamp01(p));
  const dash = dashed ? '16 11' : undefined;
  let tail: React.ReactNode = null;
  if (to) {
    const dx = to.x - x;
    const dy = to.y - y;
    const a = Math.atan2(dy, dx);
    const bx = Math.cos(a) * w * 0.3;
    const by = Math.sin(a) * h * 0.38;
    const nx = -Math.sin(a) * 20;
    const ny = Math.cos(a) * 20;
    tail = <path d={`M${bx + nx} ${by + ny} L${dx / k} ${dy / k} L${bx - nx} ${by - ny} Z`} fill={fill} stroke={stroke} strokeWidth={5} strokeDasharray={dash} strokeLinejoin="round" />;
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={op * clamp01(p * 3)}>
      {tail}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.42} fill={fill} stroke={stroke} strokeWidth={5} strokeDasharray={dash} />
      {children}
    </g>
  );
};

/** Researcher name tag (COMMON: name ≥ 52 px, sub ≥ 34 px on a light backing). */
const NTag: React.FC<{x: number; y: number; name: string; sub?: string; p: number}> = ({x, y, name, sub, p}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  const w = Math.max(90 + name.length * 34, sub ? 90 + sub.length * 28 : 0);
  return (
    <g transform={`translate(${x - (1 - k) * 30} ${y})`} opacity={k}>
      <rect x={-10} y={-70} width={w} height={sub ? 150 : 98} rx={12} fill={C.paperLight} opacity={0.94} />
      <rect x={0} y={-60} width={10} height={sub ? 130 : 78} fill={C.ink} />
      <text x={34} y={4} fontFamily={FONT_SERIF} fontWeight={700} fontSize={70} fill={C.ink}>{name}</text>
      {sub && <text x={36} y={58} fontFamily={FONT_SANS} fontWeight={700} fontSize={38} letterSpacing={4} fill={C.inkMute}>{sub.toUpperCase()}</text>}
    </g>
  );
};

const gearPath = (r: number, n: number, depth: number) => {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const step = (Math.PI * 2) / n;
    const seq: [number, number][] = [
      [a0, r - depth], [a0 + step * 0.12, r], [a0 + step * 0.42, r], [a0 + step * 0.54, r - depth],
    ];
    seq.forEach(([a, rr], j) => pts.push(`${i === 0 && j === 0 ? 'M' : 'L'}${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`));
  }
  return pts.join(' ') + 'Z';
};

const Gear: React.FC<{x: number; y: number; r: number; n: number; rot: number; fill: string; shade: string; hub: string; children?: React.ReactNode}> = ({x, y, r, n, rot, fill, shade, hub, children}) => (
  <g transform={`translate(${x} ${y})`}>
    <g transform={`rotate(${rot})`}>
      <path d={gearPath(r, n, 30)} fill={fill} />
      <path d={gearPath(r, n, 30)} fill={shade} transform="translate(6 8)" opacity={0} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return <circle key={i} cx={Math.cos(a) * r * 0.6} cy={Math.sin(a) * r * 0.6} r={r * 0.11} fill={shade} />;
      })}
    </g>
    <circle r={r * 0.42} fill={hub} />
    {children}
  </g>
);

const Mount: React.FC<{x: number; y: number; base: number}> = ({x, y, base}) => (
  <g>
    <rect x={x - 12} y={y} width={24} height={base - y} fill={C.inkLift} />
    <rect x={x - 60} y={base - 8} width={120} height={22} rx={6} fill={C.inkLift} />
  </g>
);

// ================= S1 · 354.60 · "a voice built from borrowed machinery could just be a side effect"
export const S1: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s1 - 0.6, 900, 540, 1.04], [T.effect, 960, 530, 1.0], [T.anything + 0.8, 1110, 540, 1.1]]), t);
  const run = t - T.s1;
  const A = {x: 600, y: 560, r: 190};
  const B = {x: 890, y: 470, r: 130};
  const P = {x: 1290, y: 340, r: 52};
  const rotA = run * 34;
  const rotB = -run * 34 * (16 / 11) + 9;
  const beltP = e(t, T.s1 + 0.3, T.s1 + 1.4);
  // pulley belt B → P (dashed, travelling)
  const vx = P.x - B.x;
  const vy = P.y - B.y;
  const L = Math.hypot(vx, vy);
  const nx = (-vy / L) * 52;
  const ny = (vx / L) * 52;
  const off = -run * 140;
  // loose output belt
  const slack = ramp(t, T.effect - 0.1, T.effect + 1.1, ease.inOut);
  const endX = lerp(1640, 1560, slack) + Math.sin(t * 1.5) * 10 * slack;
  const endY = lerp(330, 690, slack);
  const midX = lerp(1460, 1470, slack);
  const midY = lerp(320, 440, slack);
  const outP = e(t, T.s1 + 1.0, T.s1 + 2.2);
  const trayP = ramp(t, T.job + 0.2, T.job + 0.8);
  const trayK = ease.outBack(trayP);
  return (
    <Stage bg={C.ink}>
      <MindSpace t={t} bg="ink" density={0.7} seed={6} />
      <Cam cam={cam}>
        {/* mounts + base rail */}
        <rect x={360} y={872} width={1440} height={16} rx={8} fill={C.inkLift} />
        <Mount x={A.x} y={A.y} base={880} />
        <Mount x={B.x} y={B.y} base={880} />
        <Mount x={P.x} y={P.y} base={880} />
        {/* gears */}
        <Gear x={A.x} y={A.y} r={A.r} n={16} rot={rotA} fill={C.paperShade} shade={C.paperDeep} hub={C.paperLight}>
          <Icon name="mouth" x={0} y={0} s={1.2} color={C.ink} accent={C.inkSoft} knock={C.paperLight} />
        </Gear>
        <Gear x={B.x} y={B.y} r={B.r} n={11} rot={rotB} fill={C.theory} shade={C.theoryLight} hub={C.theoryTint}>
          <Icon name="brain" x={0} y={0} s={0.85} color={C.theory} accent={C.theoryLight} knock={C.theoryTint} />
        </Gear>
        {/* belt to the far pulley */}
        <g opacity={beltP}>
          <path d={`M${B.x + nx} ${B.y + ny} L${P.x + nx} ${P.y + ny} M${B.x - nx} ${B.y - ny} L${P.x - nx} ${P.y - ny}`} stroke={C.theoryLight} strokeWidth={10} strokeDasharray="26 16" strokeDashoffset={off} strokeLinecap="round" fill="none" />
          <g transform={`translate(${P.x} ${P.y}) rotate(${-run * 120})`}>
            <circle r={P.r + 6} fill={C.paperShade} />
            <circle r={P.r * 0.5} fill={C.inkLift} />
            <rect x={-4} y={-P.r} width={8} height={P.r * 2} fill={C.inkLift} />
          </g>
        </g>
        {/* output belt — goes nowhere, then hangs loose */}
        {outP > 0 && (
          <path
            d={`M${P.x} ${P.y - P.r - 4} Q${midX} ${midY} ${lerp(P.x, endX, outP)} ${lerp(P.y - P.r, endY, outP)}`}
            stroke={C.theoryLight}
            strokeWidth={12}
            strokeDasharray="26 16"
            strokeDashoffset={off * (1 - slack * 0.9)}
            strokeLinecap="round"
            fill="none"
          />
        )}
        {/* the empty tray at the end */}
        {trayP > 0 && (
          <g transform={`translate(1600 ${830 + (1 - trayK) * 60}) scale(${0.6 + 0.4 * trayK})`} opacity={clamp01(trayP * 3)}>
            <path d="M-150 -60 L-120 30 L120 30 L150 -60" fill={C.paperShade} stroke={C.paperLight} strokeWidth={6} strokeLinejoin="round" />
            <rect x={-150} y={-66} width={300} height={12} rx={6} fill={C.paperLight} />
            <rect x={-110} y={-48} width={220} height={66} fill={C.paperDeep} />
          </g>
        )}
        <QuestionMark x={1760} y={560} size={220} p={ramp(t, T.anything + 0.05, T.anything + 0.5)} color={C.oxblood} />
      </Cam>
    </Stage>
  );
};

// ================= S2 · 361.98 · "Hold a phone number in your head…"
const DIGITS = ['5', '5', '5', '0', '1', '9', '3'];
const LINE_X = [-180, -126, -72, 18, 72, 126, 180];
const SLIPS: Record<number, number> = {5: 0, 2: 1, 3: 2, 6: 3}; // digit → slip order
const PA: PersonProps = {x: 600, y: 990, s: 1.05, outfit: 'casual', skin: 2, hair: 'curly', hairColor: C.hair[1], top: C.evidence, prop: 'phone', seed: 3};

export const S2: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s2, 980, 540, 1.04], [T.slip + 2.5, 960, 540, 1.0]]), t);
  const saying = t > T.loud - 0.1 && t < T.end;
  const talk = saying ? Math.abs(Math.sin((t - T.loud) * 5.7)) : 0;
  const pa = {...PA, t, talk, expression: (t > T.slip ? 'worried' : 'thinking') as PersonProps['expression']};
  const head = personHands(pa).head;
  // B walks in
  const wp = ramp(t, T.someone - 0.3, T.someone + 1.4, ease.inOut);
  const bx = lerp(2050, 1400, wp);
  const walking = wp > 0 && wp < 0.98;
  const bTalk = t > T.someone + 0.6 && t < T.loud - 0.2 ? Math.abs(Math.sin(t * 9)) : 0;
  // thought bubble with looping digits
  const BX = 640;
  const BY = 236;
  const tbP = ramp(t, T.phone - 0.25, T.phone + 0.35);
  const loop = ramp(t, T.phone + 1.0, T.phone + 2.0, ease.inOut);
  const ang0 = (t - T.phone) * 1.25;
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        {/* hallway */}
        <rect x={-200} y={0} width={2320} height={850} fill={C.paper} />
        <rect x={-200} y={610} width={2320} height={240} fill={C.paperShade} />
        <rect x={-200} y={604} width={2320} height={12} fill={C.paperDeep} />
        <Floor y={850} kind="tiles" seed={4} />
        <Door x={160} y={850} w={210} h={400} style="panel" color={C.wood} />
        <Door x={1800} y={850} w={210} h={400} style="flush" color={C.slate} />
        <Plant x={1010} y={850} kind="tall" t={t} seed={2} />
        <ellipse cx={PA.x} cy={992} rx={130} ry={16} fill={C.ink} opacity={0.12} />
        <ellipse cx={bx} cy={992} rx={130} ry={16} fill={C.ink} opacity={0.12} />
        <Person {...pa} />
        <Person x={bx} y={990} s={1.05} t={t} facing={-1} outfit="suit" skin={4} hair="short" top={C.slate}
          walk={walking ? t * 1.1 : undefined} pose={t > T.someone + 1.3 && t < T.slip ? 'point' : undefined} talk={bTalk} seed={8} />
      </Cam>
      {/* inner loop of the number (dashed plum = silent) */}
      <Bub x={BX} y={BY} w={640} h={250} dashed stroke={C.theory} to={{x: head.x + 20, y: head.y - 80}} p={tbP}>
        {DIGITS.map((d, i) => {
          const so = SLIPS[i];
          const slipT = so === undefined ? 1e9 : T.slip + 0.1 + so * 0.42;
          const sp = ramp(t, slipT, slipT + 1.3, ease.in);
          const a = ang0 + (i / DIGITS.length) * Math.PI * 2;
          const ox = Math.cos(a) * 225;
          const oy = Math.sin(a) * 62;
          const dx = lerp(LINE_X[i], ox, loop) + sp * (i % 2 ? 60 : -60);
          const dy = lerp(0, oy, loop) + sp * 190;
          const depth = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(a) * loop + 0.5 * (1 - loop));
          const o = Math.min(1, depth) * (1 - sp) * clamp01((t - T.phone + 0.1) / 0.3 - i * 0.15);
          if (o <= 0) return null;
          return (
            <g key={i} opacity={o}>
              <text x={dx} y={dy + 26} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={74} fill={C.theory}>
                {d}
              </text>
              <line x1={dx - 20} x2={dx + 20} y1={dy + 44} y2={dy + 44} stroke={C.theory} strokeWidth={5} strokeDasharray="8 6" strokeLinecap="round" />
            </g>
          );
        })}
      </Bub>
      {/* spoken out loud: solid ink */}
      <Bub x={1010} y={470} w={480} h={118} to={{x: head.x + 70, y: head.y + 40}} p={ramp(t, T.loud - 0.25, T.loud + 0.3)}>
        {['the…', 'the…', 'the…'].map((w, i) => {
          const beat = (t - T.loud) / 0.55;
          const shown = beat >= i;
          const hot = Math.floor(beat) % 3 === i && t < T.end;
          return shown ? (
            <text key={i} x={-145 + i * 145} y={17} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={50} fill={hot ? C.ink : C.inkMute}>
              {w}
            </text>
          ) : null;
        })}
      </Bub>
      <Tag x={1070} y={150} text="Articulatory suppression" kind="confirmed" size={40} p={ramp(t, T.artic + 0.3, T.artic + 0.9)} />
      <Kicker x={1074} y={258} text="CAN DISRUPT SOME VERBAL MEMORY" size={32} anchor="start" p={ramp(t, T.artic + 1.1, T.artic + 1.7)} />
    </Stage>
  );
};

// ================= S3 · 376.97 · "It does something similar to switching between tasks."
// flip schedule: brisk, then slow once inner speech is disrupted
const FLIPS: number[] = (() => {
  const a: number[] = [];
  let f = 381.2;
  while (f < 386) {
    a.push(f);
    f += 1.05;
  }
  return [...a, 388.6, T.next - 0.12]; // odd count → colour face lands on "Next, color."
})();
const flipState = (t: number) => {
  let n = 0;
  let fp = 1;
  for (const f of FLIPS) {
    if (t >= f) {
      n++;
      fp = clamp01((t - f) / 0.36);
    }
  }
  // face: n flips done; during a flip the face swaps at halfway
  const face = fp < 0.5 ? n - 1 : n;
  const sx = n === 0 ? 1 : Math.abs(1 - 2 * ease.inOut(fp));
  return {face: Math.max(0, face) % 2, sx: Math.max(0.02, sx)};
};

const TaskCard: React.FC<{x: number; y: number; w: number; h: number; face: number; sx: number; p: number; dark?: boolean}> = ({x, y, w, h, face, sx, p, dark}) => {
  if (p <= 0) return null;
  const k = ease.outBack(clamp01(p));
  return (
    <g transform={`translate(${x} ${y + (1 - k) * 40}) scale(${sx * k} ${k})`} opacity={clamp01(p * 3)}>
      <rect x={-w / 2 + 12} y={-h / 2 + 16} width={w} height={h} rx={22} fill={C.ink} opacity={dark ? 0.4 : 0.14} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={22} fill={C.paperLight} />
      {face === 0 ? (
        <text x={0} y={h * 0.15} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={h * 0.42} fill={C.ink}>
          7 + 5
        </text>
      ) : (
        [C.ink, C.oxblood, C.evidence].map((c, i) => (
          <rect key={i} x={-w * 0.36 + i * w * 0.25} y={-h * 0.3} width={w * 0.21} height={h * 0.6} rx={14} fill={c} />
        ))
      )}
    </g>
  );
};

const Stopwatch: React.FC<{x: number; y: number; r: number; t: number; p: number}> = ({x, y, r, t, p}) => {
  if (p <= 0) return null;
  const k = ease.outBack(clamp01(p));
  const fast = 300;
  const slow = 120;
  const t0 = 381.2;
  const tb = T.slower - 0.1;
  const ang = t < t0 ? 0 : fast * (Math.min(t, tb) - t0) + slow * Math.max(0, t - tb);
  const lag = ramp(t, tb, tb + 3, ease.out);
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={clamp01(p * 3)}>
      <rect x={-22} y={-r - 46} width={44} height={36} rx={8} fill={C.ink} />
      <rect x={-12} y={-r - 20} width={24} height={24} fill={C.ink} />
      <circle r={r + 16} fill={C.ink} />
      <circle r={r} fill={C.paperLight} />
      {lag > 0 && <path d={`M0 0 L0 ${-r * 0.86} A${r * 0.86} ${r * 0.86} 0 0 1 ${Math.sin(lag * 2.2) * r * 0.86} ${-Math.cos(lag * 2.2) * r * 0.86} Z`} fill={C.cautionTint} />}
      {Array.from({length: 12}).map((_, i) => (
        <rect key={i} x={-3} y={-r + 8} width={6} height={i % 3 ? 14 : 24} fill={C.inkSoft} transform={`rotate(${i * 30})`} />
      ))}
      <g transform={`rotate(${ang})`}>
        <rect x={-5} y={-r * 0.8} width={10} height={r * 0.9} rx={5} fill={lag > 0.05 ? C.caution : C.ink} />
      </g>
      <circle r={13} fill={C.ink} />
    </g>
  );
};

const PS3: PersonProps = {x: 400, y: 990, s: 1.05, outfit: 'casual', skin: 1, hair: 'bun', hairColor: C.hair[3], top: C.theory, seed: 11};

const S3Room: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s3 - 0.4, 1000, 540, 1.0], [T.slower, 960, 540, 1.02], [T.disrupted + 0.2, 960, 540, 1.03], [T.cue + 0.3, 700, 470, 1.3]]), t);
  const fs = flipState(t);
  const dis = t > T.slower - 0.4;
  const pp = {...PS3, t, expression: (dis ? 'worried' : 'thinking') as PersonProps['expression'], talk: dis ? Math.abs(Math.sin((t - T.slower) * 5.7)) : 0};
  const head = personHands(pp).head;
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <rect x={-200} y={850} width={2320} height={400} fill={C.stone} opacity={0.35} />
        <ellipse cx={PS3.x} cy={992} rx={130} ry={16} fill={C.ink} opacity={0.12} />
        <Person {...pp} />
        <TaskCard x={1010} y={560} w={480} h={320} face={fs.face} sx={fs.sx} p={ramp(t, T.s3 + 0.2, T.s3 + 0.8)} />
        <Stopwatch x={1560} y={560} r={150} t={t} p={ramp(t, T.s3 + 0.6, T.s3 + 1.2)} />
      </Cam>
      <Bub x={720} y={250} w={420} h={116} to={{x: head.x + 60, y: head.y - 30}} p={ramp(t, T.slower - 0.45, T.slower + 0.05)}>
        <text x={0} y={17} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={50} fill={C.ink}>the… the…</text>
      </Bub>
      <Tag x={1560} y={850} anchor="center" text="Slower switching" kind="caution" size={40} p={ramp(t, T.slower + 0.1, T.slower + 0.7)} />
      <NTag x={200} y={250} name="Emerson & Miyake" sub="Task-switching experiments" p={ramp(t, T.emerson - 0.4, T.emerson + 0.3) * (1 - ramp(t, T.slower - 0.9, T.slower - 0.4))} />
    </Stage>
  );
};

const S3Mind: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.cue, 960, 540, 1.08], [T.next + 1.2, 960, 540, 1.0]]), t);
  const fs = flipState(t);
  return (
    <Stage bg={C.ink}>
      <MindSpace t={t} bg="ink" density={0.6} seed={9} />
      <Cam cam={cam}>
        <HeadProfile x={620} y={600} s={1.15} skin={C.skin[1]} t={t} o={0.95} />
        <Pulse x={600} y={520} r={240} p={((t - T.cue) / 1.6) % 1} color={C.theoryLight} />
        <TaskCard x={1460} y={600} w={420} h={290} face={fs.face} sx={fs.sx} p={1} dark />
      </Cam>
      <Bub x={1000} y={250} w={560} h={150} dashed stroke={C.theoryLight} fill={C.ink} to={{x: 760, y: 420}} p={ramp(t, T.next - 0.2, T.next + 0.25)}>
        <text x={0} y={24} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={70} fill={C.theoryLight}>Next, color.</text>
      </Bub>
    </Stage>
  );
};

export const S3: React.FC<{t: number}> = ({t}) => (
  <Shots
    t={t}
    shots={[
      {start: T.s3 - 1, render: (t: number) => <S3Room t={t} />},
      {start: T.cue, in: {kind: 'iris', x: 400, y: 470}, render: (t: number) => <S3Mind t={t} />},
    ]}
  />
);

// ================= S4 · 393.82 · "So the voice looks like a tool. A 2024 study complicated that."
const Wrench: React.FC<{x: number; y: number; s: number; p: number}> = ({x, y, s, p}) => {
  if (p <= 0) return null;
  const k = ease.outBack(clamp01(p));
  return (
    <g transform={`translate(${x} ${y}) rotate(${-40 + (1 - k) * -30}) scale(${s * k})`} opacity={clamp01(p * 3)}>
      <rect x={-18} y={-10} width={36} height={170} rx={16} fill={C.inkSoft} />
      <path d="M-58 -70 A62 62 0 1 0 58 -70 L58 -110 L22 -110 L22 -56 L-22 -56 L-22 -110 L-58 -110 Z" fill={C.ink} />
      <circle cx={0} cy={130} r={10} fill={C.paperShade} />
    </g>
  );
};

export const S4: React.FC<{t: number}> = ({t}) => {
  const hit = T.y2024 + 0.34;
  const fall = ramp(t, T.y2024 - 0.05, hit, ease.in);
  const knock = ramp(t, hit, hit + 0.55, ease.outBack);
  const cam = shake(breathe(camAt(t, [[T.s4, 960, 540, 1.06], [T.y2024 + 2, 960, 560, 1.0]]), t), t, hit, 14, 6);
  const cardY = t < hit ? lerp(-260, 330, fall) : 330 + knock * 40;
  const cardR = t < hit ? lerp(-18, 4, fall) : 4 + knock * 6;
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        <g transform={`rotate(${knock * 6} 960 560) translate(0 ${knock * 36})`} opacity={1 - knock * 0.25}>
          <Headline x={880} y={590} text="The voice looks like a tool." size={100} mode="words" p={ramp(t, T.s4 - 0.1, T.s4 + 1.0)} />
          <Wrench x={1700} y={530} s={1} p={ramp(t, T.tool - 0.2, T.tool + 0.3)} />
        </g>
        {fall > 0 && (
          <g transform={`translate(1300 ${cardY}) rotate(${cardR})`}>
            <rect x={-200 + 12} y={-125 + 16} width={400} height={250} rx={16} fill={C.ink} opacity={0.16} />
            <rect x={-200} y={-125} width={400} height={250} rx={16} fill={C.paperLight} />
            <rect x={-200} y={-125} width={16} height={250} fill={C.oxblood} />
            <text x={10} y={48} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={140} fill={C.ink}>2024</text>
          </g>
        )}
      </Cam>
    </Stage>
  );
};

// ================= S5 · 397.95 · "Two researchers, Johanne Nedergaard and Gary Lupyan…"
const ROW = [
  {skin: 0, hair: 'short', out: 'casual', full: true},
  {skin: 3, hair: 'long', out: 'suit', full: false},
  {skin: 2, hair: 'curly', out: 'casual', full: true},
  {skin: 4, hair: 'bald', out: 'labcoat', full: false},
  {skin: 1, hair: 'ponytail', out: 'casual', full: true},
  {skin: 3, hair: 'side', out: 'suit', full: false},
  {skin: 2, hair: 'bun', out: 'casual', full: true},
] as const;

const Group: React.FC<{t: number; x: number; n: number; at: number; full: boolean; label: string}> = ({t, x, n, at, full, label}) => {
  const bp = ramp(t, at - 0.35, at + 0.2);
  const cp = ramp(t, at - 0.1, at + 0.9, ease.out);
  return (
    <g>
      <Bub x={x} y={235} w={400} h={220} dashed stroke={C.theory} fill={full ? C.theoryTint : C.paper} op={full ? 1 : 0.6} to={{x, y: 420}} p={bp}>
        <text x={0} y={52} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={150} fill={C.ink}>{countUp(String(n), cp)}</text>
      </Bub>
      {Array.from({length: n}).map((_, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const ip = ramp(t, at + i * 0.018, at + i * 0.018 + 0.35, ease.outBack);
        return <Icon key={i} name="person" x={x - 301 + col * 86} y={470 + row * 76} s={0.8 * ip} color={C.theory} accent={C.theory} knock={C.paperShade} p={1} />;
      }).map((el, i) => (
        <g key={i} opacity={full ? 1 : 0.42}>{el}</g>
      ))}
      <Kicker x={x} y={950} text={label} size={44} anchor="middle" color={C.ink} p={ramp(t, at + 0.2, at + 0.8)} />
    </g>
  );
};

export const S5: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s5, 960, 540, 1.04], [T.n46 - 0.3, 960, 540, 1.0]]), t);
  const rowOut = ramp(t, T.n46 - 0.6, T.n46 - 0.1, ease.inOut);
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        {rowOut < 1 && (
          <g opacity={1 - rowOut} transform={`translate(0 ${rowOut * 80})`}>
            <rect x={-200} y={1000} width={2320} height={200} fill={C.stone} opacity={0.35} />
            {ROW.map((r, i) => {
              const x = 300 + i * 220 + (i > 2 ? 0 : 0);
              const ip = ramp(t, T.s5 + 0.1 + i * 0.1, T.s5 + 0.9 + i * 0.1, ease.out);
              const pp: PersonProps = {x, y: 1000 + (1 - ip) * 60, s: 0.8, t, skin: r.skin, hair: r.hair, outfit: r.out, facing: i < 3 ? 1 : -1, seed: 20 + i, opacity: ip};
              const hd = personHands(pp).head;
              const bp = ramp(t, T.little + 0.6 + i * 0.22, T.little + 1.1 + i * 0.22);
              return (
                <g key={i}>
                  <Person {...pp} />
                  <Bub x={x} y={hd.y - 150} w={180} h={100} dashed stroke={C.theory} fill={r.full ? C.theoryTint : C.paperShade} op={r.full ? 1 : 0.4} to={{x: hd.x, y: hd.y - 55}} p={bp}>
                    {r.full && [0, 1].map((j) => <line key={j} x1={-54} x2={j ? 30 : 54} y1={-12 + j * 26} y2={-12 + j * 26} stroke={C.theory} strokeWidth={7} strokeDasharray="12 9" strokeLinecap="round" />)}
                  </Bub>
                </g>
              );
            })}
          </g>
        )}
        <Group t={t} x={520} n={46} at={T.n46} full={false} label="LOW INNER SPEECH" />
        <Group t={t} x={1400} n={47} at={T.n47} full label="A LOT" />
      </Cam>
      {(() => {
        const out = 1 - ramp(t, T.little - 0.6, T.little - 0.1);
        return (
          <>
            <NTag x={200} y={250} name="Johanne Nedergaard" p={ramp(t, T.ned - 0.45, T.ned + 0.25) * out} />
            <NTag x={200} y={390} name="Gary Lupyan" p={ramp(t, T.lup - 0.4, T.lup + 0.3) * out} />
          </>
        );
      })()}
    </Stage>
  );
};

// ================= S6 · 411.66 · "The low group did worse…" — scoreboard
const Row: React.FC<{y: number; p: number; rp: number; left: React.ReactNode; result: string; ax?: number}> = ({y, p, rp, left, result, ax = 1060}) => {
  if (p <= 0) return null;
  const k = ease.outQuint(clamp01(p));
  return (
    <g transform={`translate(${(1 - k) * -80} ${y})`} opacity={k}>
      <rect x={260 + 10} y={-90 + 14} width={1400} height={180} rx={18} fill={C.ink} opacity={0.12} />
      <rect x={260} y={-90} width={1400} height={180} rx={18} fill={C.paperLight} />
      <rect x={260} y={-90} width={14} height={180} fill={C.theory} />
      {left}
      {rp > 0 && (
        <g opacity={ease.out(clamp01(rp))} transform={`translate(${(1 - ease.out(clamp01(rp))) * 40} 0)`}>
          <path d={`M${ax} 0 L${ax + 60} 0 M${ax + 40} -18 L${ax + 62} 0 L${ax + 40} 18`} stroke={C.inkMute} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x={1620} y={20} textAnchor="end" fontFamily={FONT_SERIF} fontWeight={700} fontSize={result.length > 12 ? 52 : 60} fill={C.ink}>{result}</text>
        </g>
      )}
    </g>
  );
};

export const S6: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s6, 960, 560, 1.03], [T.exactly + 2, 960, 540, 1.0]]), t);
  const sp = ramp(t, T.exactly - 0.1, T.exactly + 0.35, ease.outQuint);
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <Kicker x={960} y={260} text="LOW INNER SPEECH" size={40} anchor="middle" color={C.theory} p={ramp(t, T.s6 - 0.2, T.s6 + 0.4)} />
        <Row y={430} p={ramp(t, T.s6 - 0.1, T.s6 + 0.6)} rp={ramp(t, T.s6 + 0.85, T.s6 + 1.3)} result="Worse"
          left={<text x={320} y={20} fontFamily={FONT_SERIF} fontWeight={600} fontSize={58} fill={C.ink}>Verbal working memory</text>} />
        <Row y={660} p={ramp(t, T.rhyme - 0.2, T.rhyme + 0.5)} rp={ramp(t, T.rhyme + 0.4, T.rhyme + 0.9)} result="Slower, less accurate" ax={950}
          left={
            <g>
              <Icon name="clock" x={330} y={0} s={1.0} accent={C.inkSoft} p={ramp(t, T.rhyme, T.rhyme + 0.5)} />
              <Icon name="lock" x={430} y={0} s={1.0} accent={C.inkSoft} p={ramp(t, T.rhyme + 0.15, T.rhyme + 0.65)} />
              <text x={490} y={20} fontFamily={FONT_SERIF} fontWeight={600} fontSize={52} fill={C.ink}>Do these rhyme?</text>
            </g>
          } />
        {sp > 0 && (
          <g transform={`translate(960 880) rotate(-3) scale(${lerp(1.35, 1, sp)})`} opacity={clamp01(sp * 2)}>
            <rect x={-600} y={-66} width={1200} height={132} rx={10} fill="none" stroke={C.evidence} strokeWidth={8} />
            <text x={0} y={19} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={700} fontSize={60} fill={C.evidence}>
              Exactly what the tool idea predicts
            </text>
          </g>
        )}
      </Cam>
    </Stage>
  );
};

// ================= S7 · 422.48 · "But on task switching … there was no difference." — THE TWIST
export const S7: React.FC<{t: number}> = ({t}) => {
  const land = T.nodiff - 0.08;
  const lp = ramp(t, land, land + 0.4, ease.outQuint);
  const dim = 1 - 0.86 * ramp(t, land - 0.15, land + 0.2);
  const cam = shake(camAt(t, [[T.s7, 960, 540, 1.0], [land, 960, 560, 1.07], [T.end + 0.6, 960, 560, 1.07]]), t, land + 0.05, 10, 7);
  const cp = ramp(t, T.ts - 0.3, T.ts + 0.4, ease.outQuint);
  const scP = ramp(t, T.ts + 0.2, T.ts + 1.0, ease.out);
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        <g opacity={dim}>
          <g transform={`translate(${(1 - cp) * 1100} 0)`} opacity={cp}>
            <rect x={960 - 380 + 10} y={230 - 80 + 14} width={760} height={160} rx={18} fill={C.ink} opacity={0.12} />
            <rect x={960 - 380} y={230 - 80} width={760} height={160} rx={18} fill={C.paperLight} />
            <rect x={960 - 380} y={230 - 80} width={14} height={160} fill={C.theory} />
            <text x={960} y={256} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={76} fill={C.ink}>Task switching</text>
          </g>
          <BalanceScale x={960} y={470} s={1.25} tilt={0} p={scP} leftLabel="LOW INNER SPEECH" rightLabel="A LOT" labelSize={34}
            leftColor={C.theory} rightColor={C.theory}
            leftItems={<Icon name="people" x={0} y={-50} s={0.9} color={C.theory} accent={C.theory} />}
            rightItems={<Icon name="people" x={0} y={-50} s={0.9} color={C.theory} accent={C.theory} />} />
        </g>
        {lp > 0 && (
          <g transform={`translate(960 590) scale(${lerp(1.18, 1, lp)})`} opacity={clamp01(lp * 4)}>
            <text x={0} y={0} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={200} fill={C.oxblood}>No difference.</text>
            <rect x={-560 * lp} y={60} width={1120 * lp} height={10} rx={5} fill={C.ink} />
          </g>
        )}
      </Cam>
    </Stage>
  );
};
