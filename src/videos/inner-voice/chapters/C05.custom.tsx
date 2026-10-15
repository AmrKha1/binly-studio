// Custom shots for C05 (builder-owned). Each: export const S<n>: React.FC<{t: number}> returning a full <Stage>.
import React from 'react';
import {Stage, breathe} from '../../../kit/stage';
import {Kicker, Tag, textW} from '../../../kit/text';
import {C, FONT_SERIF, FONT_SANS} from '../../../kit/theme';
import {ease, ramp, win, camAt, clamp01, lerp} from '../../../kit/anim';
import {Person, personHands} from '../../../kit/people';
import {HeadProfile, Brain} from '../../../kit/science';
import {MindSpace, Window, Plant} from '../../../kit/env';
import {StudyCard, Card} from '../../../kit/cards';
import {SilentWave} from '../shared';

const T = {
  // S2
  aph: 261.4, // "First, some people with aphasia"
  struggle: 263.3, // "struggle to produce speech aloud"
  keep: 265.4, // "keep aspects of their inner speech"
  clue: 267.3, // "that's a clue, not a proof"
  volOn: 271.9, // "isn't simply speaking with the volume turned down"
  volDown: 276.7, // "volume turned down"
  // S3
  fc: 278.5, // "Second, silent speech seems to carry a forecast"
  cmd: 282.5, // "When your brain sends a command to move"
  copy: 284.6, // "keeps an internal copy"
  tickle: 288.1, // "why you can't tickle yourself"
  // S4
  study: 289.9,
  // S6
  syl: 301.4, // "a single syllable"
  ba: 302.4, // "ba"
  matched: 306.9, // "matched"
  nomatch: 311.0, // "when it didn't match"
  // S7
  right: 313.0,
  sentence: 320.4, // "say a sentence in your head"
  fine: 324.6, // "detail fine enough to tell one syllable from another"
  // S8
  one: 327.8,
  tagOn: 331.1, // "tag the voice as yours"
  model: 333.0, // "a model, not a settled fact"
  // S9
  limits: 335.5,
  measured: 337.0,
  notm: 339.0,
  // S11
  puz: 351.2,
  piece: 352.0, // "a strong clue"
};

const INNER = C.theory;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

// ---------- helpers ----------
/** A speech-bubble outline path (rounded rect + tail), origin top-left. */
const bubblePath = (w: number, h: number, tx: number, ty: number, r = 36) => {
  const bx = clamp(tx, r + 20, w - r - 70);
  return `M${r} 0 H${w - r} Q${w} 0 ${w} ${r} V${h - r} Q${w} ${h} ${w - r} ${h} H${bx + 50} L${tx} ${ty} L${bx} ${h} H${r} Q0 ${h} 0 ${h - r} V${r} Q0 0 ${r} 0 Z`;
};

/** Row of word-bars inside a bubble. fall[i] = 0..1 how far bar i has dropped. */
const WordBars: React.FC<{x: number; y: number; widths: number[]; color: string; dash?: boolean; fall?: number[]; present?: boolean[]; p?: number}> = ({x, y, widths, color, dash, fall = [], present = [], p = 1}) => {
  let cx = x;
  return (
    <g>
      {widths.map((w, i) => {
        const xi = cx;
        cx += w + 22;
        if (present[i] === false) return null;
        const f = fall[i] ?? 0;
        const vis = clamp(p * widths.length - i);
        return (
          <rect
            key={i}
            x={xi}
            y={y + f * 260}
            width={w * vis}
            height={30}
            rx={15}
            fill={dash ? 'none' : color}
            stroke={color}
            strokeWidth={dash ? 4 : 0}
            strokeDasharray={dash ? '10 8' : undefined}
            opacity={1 - f * 0.9}
            transform={`rotate(${f * 40} ${xi + w / 2} ${y})`}
          />
        );
      })}
    </g>
  );
};

/** Point along a polyline at 0..1. */
const along = (pts: [number, number][], u: number): [number, number] => {
  const L = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const tot = L.reduce((a, b) => a + b, 0);
  let d = clamp(u) * tot;
  for (let i = 0; i < L.length; i++) {
    if (d <= L[i] || i === L.length - 1) {
      const k = L[i] ? Math.min(1, d / L[i]) : 0;
      return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
    }
    d -= L[i];
  }
  return pts[0];
};
const polyD = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');

/** Inline text with exact measured width (for strikes). */
const Txt: React.FC<{x: number; y: number; text: string; size: number; color?: string; anchor?: 'start' | 'middle' | 'end'; o?: number; weight?: number; font?: string}> = ({x, y, text, size, color = C.ink, anchor = 'middle', o = 1, weight = 600, font = FONT_SERIF}) => (
  <text x={x} y={y} fontFamily={font} fontSize={size} fontWeight={weight} fill={color} textAnchor={anchor} opacity={o}>
    {text}
  </text>
);

/** Soft-edged rounded chip with a syllable, solid (sound) or dashed (inner). */
const Chip: React.FC<{x: number; y: number; text: string; inner?: boolean; p: number; size?: number; w?: number}> = ({x, y, text, inner, p, size = 56, w = 120}) => {
  if (p <= 0) return null;
  const col = inner ? INNER : C.ink;
  const sc = 0.7 + 0.3 * ease.outBack(p);
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={clamp(p * 3)}>
      <rect x={-w / 2} y={-size * 0.8} width={w} height={size * 1.5} rx={size * 0.5} fill={inner ? C.theoryTint : C.paperLight} stroke={col} strokeWidth={5} strokeDasharray={inner ? '12 9' : undefined} />
      <Txt x={0} y={size * 0.2} text={text} size={size} color={col} />
    </g>
  );
};

/** Event-related-response curve: baseline wobble + one dip. */
const erp = (x0: number, x1: number, yb: number, depth: number, t: number) => {
  const n = 60;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = lerp(x0, x1, u);
    const g = Math.exp(-Math.pow((u - 0.52) / 0.09, 2));
    const wob = 7 * Math.sin(u * 17 + t * 0) * (1 - g) + 5 * Math.sin(u * 41);
    pts.push([x, yb + wob + depth * g]);
  }
  return pts;
};
const smoothD = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

// S2 · 261.40 · aphasia
export const S2: React.FC<{t: number}> = ({t}) => {
  const A = win(t, T.aph - 1, T.volOn + 0.1, 0.01, 0.4); // phase A visible
  const B = win(t, T.volOn - 0.1, T.volDown + 3, 0.4, 0.01);
  const pIn = ramp(t, T.aph + 0.2, T.aph + 0.9, ease.out);
  const bubP = ramp(t, T.struggle - 0.4, T.struggle + 0.6, ease.out);
  const fall = [0, 1, 2, 3, 4].map((i) => ramp(t, T.struggle + 0.5 + i * 0.35, T.struggle + 1.4 + i * 0.35, ease.in));
  const winP = ramp(t, T.keep - 0.5, T.keep + 0.4, ease.out);
  const talk = win(t, T.aph + 0.5, T.struggle + 2.5, 0.2, 0.4) * Math.abs(Math.sin(t * 8)) * 0.8;
  const vol = ramp(t, T.volOn + 0.8, T.volDown - 0.6, ease.inOut);
  const strike = ramp(t, T.volDown - 0.2, T.volDown + 0.4, ease.out);
  const label = 'Speech, volume down';
  const lw = textW(label, 64, 'serif', 600);
  const kx = lerp(1500, 480, vol);
  return (
    <Stage bg={C.paperShade}>
      {/* a place: room corner */}
      <rect x={0} y={900} width={1920} height={180} fill={C.paperDeep} />
      <rect x={0} y={890} width={1920} height={14} fill={C.paperDark} />
      <Window x={1560} y={560} w={260} h={380} t={t} />
      <Plant x={1840} y={900} s={1.3} t={t} />
      <g opacity={A}>
        <Person x={360} y={1010} s={1.4} t={t} outfit="casual" age="elder" skin={2} hair="bun" expression="worried" talk={talk} seed={5} pose="idle" />
        {/* broken solid bubble */}
        <g transform={`translate(${500 + (1 - pIn) * -30} 70)`} opacity={bubP}>
          <path d={bubblePath(780, 300, 60, 340)} fill={C.paperLight} />
          <path d={bubblePath(780, 300, 60, 340)} fill="none" stroke={C.ink} strokeWidth={8} strokeLinecap="round" strokeDasharray="190 46 110 70 240 36 90 60 180 50" />
          <WordBars x={60} y={80} widths={[120, 80, 160, 100, 130]} color={C.ink} fall={fall} p={bubP} />
          <WordBars x={60} y={170} widths={[100, 150, 80, 140]} color={C.ink} fall={[0, fall[1] * 0.8, 0, fall[3] * 0.9]} p={bubP} present={[true, true, false, true]} />
        </g>
        {/* cut-away window: the inner speech */}
        <g opacity={winP} transform={`translate(${(1 - winP) * 40} 0)`}>
          <rect x={1060} y={440} width={740} height={400} rx={34} fill={C.ink} />
          <rect x={1060} y={440} width={740} height={400} rx={34} fill="none" stroke={C.paperDark} strokeWidth={4} />
          <g transform="translate(1100 480)">
            <path d={bubblePath(660, 250, 80, 310)} fill={mixPlum()} />
            <path d={bubblePath(660, 250, 80, 310)} fill="none" stroke={C.theoryLight} strokeWidth={7} strokeLinecap="round" strokeDasharray="22 14 22 14 22 14 22 14 22 14 22 14 22 14 22 14 22 30 22 14 22 14 22 14 22 14 22 14 22 14 22 14 22 14 22 14 22 40" />
            <WordBars x={50} y={65} widths={[110, 80, 150, 90, 110]} color={C.theoryLight} dash p={winP} />
            <WordBars x={50} y={140} widths={[100, 140, 80, 130]} color={C.theoryLight} dash p={winP} present={[true, true, true, false]} />
          </g>
          <Kicker x={1430} y={880} text="INSIDE THE HEAD" size={38} color={C.inkMute} p={winP} />
        </g>
        <Tag x={1060} y={975} text="A clue, not a proof" kind="caution" size={42} p={ramp(t, T.clue, T.clue + 0.5, ease.out)} />
      </g>
      {/* phase B: volume slider */}
      <g opacity={B}>
        <rect x={250} y={170} width={1420} height={760} rx={40} fill={C.paperLight} />
        <SilentWave x={330} y={430} w={1260} amp={lerp(160, 14, vol)} t={t} p={ramp(t, T.volOn - 0.3, T.volOn + 0.5)} silent={0} bursts={6} seed={4} live={1} />
        <g>
          <rect x={480} y={655} width={960} height={16} rx={8} fill={C.paperDark} />
          <rect x={480} y={655} width={Math.max(0, kx - 480)} height={16} rx={8} fill={C.ink} />
          <circle cx={kx} cy={663} r={36} fill={C.paperLight} stroke={C.ink} strokeWidth={7} />
        </g>
        <Txt x={960} y={830} text={label} size={64} />
        <path d={`M${960 - lw / 2 - 10} ${815} L${960 - lw / 2 - 10 + (lw + 20) * strike} ${795}`} stroke={C.oxblood} strokeWidth={9} strokeLinecap="round" opacity={strike > 0 ? 1 : 0} />
      </g>
    </Stage>
  );
};
function mixPlum() {
  return '#3B3050';
}

// S3 · 278.50 · the forecast
export const S3: React.FC<{t: number}> = ({t}) => {
  const A = win(t, T.fc - 1, T.cmd - 0.1, 0.01, 0.5);
  const B = win(t, T.cmd - 0.2, T.tickle + 5, 0.5, 0.01);
  const sig = ramp(t, T.cmd + 0.2, T.cmd + 1.9, ease.linear);
  const route: [number, number][] = [[430, 610], [430, 780], [1100, 780], [1360, 640]];
  const mainU = ramp(t, T.cmd + 1.9, T.copy + 1.8, ease.inOut);
  const branchU = ramp(t, T.copy, T.copy + 1.6, ease.inOut);
  const cardP = ramp(t, T.copy + 1.4, T.copy + 2.0, ease.outBack);
  const expect = ramp(t, T.tickle + 0.2, T.tickle + 0.7, ease.out);
  const reach = ramp(t, T.tickle - 1.0, T.tickle, ease.inOut);
  const tickleA = ramp(t, T.tickle, T.tickle + 1.5, ease.linear);
  const hand: [number, number] = [lerp(1190, 1415, reach), lerp(650, 770, reach)];
  const wig = Math.sin(t * 22) * 14 * reach * (tickleA > 0 ? 1 : 0.2);
  const mp = along(route, mainU);
  const branch: [number, number][] = [[1000, 760], [1000, 540], [1000, 340]];
  const bp = along(branch, branchU);
  return (
    <Stage bg={C.ink}>
      <MindSpace t={t} bg="ink" seed={3} density={0.8} />
      {/* A: forecast wave with ghost */}
      <g opacity={A}>
        <SilentWave x={310} y={560} w={1300} amp={140} t={t} p={ramp(t, T.fc - 0.4, T.fc + 0.8)} silent={1} tone="ink" words={['If', 'I', 'said', 'it']} labelSize={42} seed={8} ghost={{offset: 80, color: C.theoryTint, match: 1, silent: 1, p: ramp(t, T.fc - 0.2, T.fc + 1.2)}} />
        <Kicker x={960} y={300} text="FORECAST" size={46} color={C.paperLight} p={ramp(t, T.fc, T.fc + 0.6, ease.out)} />
      </g>
      {/* B: command + copy */}
      <g opacity={B}>
        <Brain x={430} y={400} s={0.85} highlight="motor" hp={ramp(t, T.cmd, T.cmd + 0.5)} signal={sig} />
        {/* nerve route */}
        <path d={polyD(route)} fill="none" stroke={C.theoryLight} strokeWidth={8} strokeLinejoin="round" opacity={0.55} />
        <Person x={1450} y={1000} s={1.0} facing={-1} t={t} outfit="casual" skin={2} hair="short" expression="neutral" pose={reach > 0.5 ? "hold" : "idle"} seed={7} />
        {reach > 0 && (() => { const h = personHands({x: 1450, y: 1000, s: 1.0, facing: -1, pose: "hold"} as any).front; return (
          <g transform={`translate(${h.x} ${h.y + wig}) rotate(${-20 + wig})`}>
            <path d="M0 0 Q60 -22 120 -12 Q70 22 0 0 Z" fill={C.paperLight} />
            <path d="M0 0 L112 -10" stroke={C.inkMute} strokeWidth={3} />
          </g>); })()}
        {/* pulses */}
        {mainU > 0 && mainU < 1 && <circle cx={mp[0]} cy={mp[1]} r={20} fill={C.theoryLight} />}
        {sig > 0 && mainU === 0 && sig < 1 && <circle cx={430} cy={lerp(520, 610, sig)} r={16} fill={C.theoryLight} />}
        {/* copy branch */}
        <path d={polyD(branch)} fill="none" stroke={C.theoryTint} strokeWidth={5} strokeDasharray="14 12" opacity={branchU > 0 ? 0.8 : 0} />
        {branchU > 0 && branchU < 1 && <circle cx={bp[0]} cy={bp[1]} r={18} fill="none" stroke={C.theoryTint} strokeWidth={5} strokeDasharray="8 6" />}
        {/* prediction card */}
        <g transform={`translate(1000 ${250 + (1 - cardP) * 30})`} opacity={clamp(cardP * 2)}>
          <rect x={-310} y={-80} width={620} height={170} rx={28} fill={C.paperLight} stroke={C.theoryLight} strokeWidth={5} strokeDasharray="14 10" />
          <Txt x={0} y={-8} text="Predicted result" size={54} />
          <Txt x={0} y={60} text="✓ expected" size={46} color={C.evidence} font={FONT_SANS} weight={700} o={expect} />
        </g>
      </g>
    </Stage>
  );
};

// S4 · 289.70 · study card
export const S4: React.FC<{t: number}> = ({t}) => {
  const p = ramp(t, T.study, T.study + 0.8, ease.out);
  return (
    <Stage bg={C.paperShade}>
      <SilentWave x={260} y={900} w={1400} amp={50} t={t} p={ramp(t, 289.8, 291.5)} silent={1} bursts={7} seed={21} />
      <g transform={`translate(960 470) scale(1.55) translate(-960 -470)`}>
        <StudyCard x={960} y={470} p={p} rot={-1.5} title="Does silent speech forecast its sound?" who="Thomas Whitford & colleagues" year="2017" />
      </g>
    </Stage>
  );
};

// S6 · 301.00 · the experiment (signature)
export const S6: React.FC<{t: number}> = ({t}) => {
  const cur = ramp(t, 301.0, T.ba, ease.inOut);
  const fireIn = ramp(t, T.ba - 0.05, T.ba + 0.5, ease.out);
  const fireS = ramp(t, T.ba + 0.1, T.ba + 0.6, ease.out);
  const pulse = win(t, T.ba, T.ba + 1.2, 0.05, 0.8);
  const tx0 = 800;
  const tx1 = 1780;
  const mark = 1260;
  const cx = lerp(tx0, mark, cur) + (cur >= 1 ? (t - T.ba) * 90 : 0);
  const m1 = ramp(t, 300.9, 301.8, ease.out);
  const dipA = ramp(t, 306.2, 308.0, ease.inOut);
  const dipB = ramp(t, T.nomatch - 0.2, T.nomatch + 1.4, ease.inOut);
  const yb = 735;
  const curA = erp(640, 1160, yb, 70, t);
  const curB = erp(1260, 1780, yb, 150, t);
  const ref = erp(640, 1160, yb, 150, t);
  const HX = 300;
  const HY = 430;
  const k = 0.9 / 0.62;
  return (
    <Stage bg={C.paperShade}>
      <HeadProfile x={HX} y={HY} s={0.9} eeg t={t} skin={C.skin[3]} />
      <g transform={`translate(${HX} ${HY}) scale(${k}) translate(-330 -470)`}>
        <path d="M250 440 Q250 300 345 295 Q440 300 436 420" fill="none" stroke={C.ink} strokeWidth={18} strokeLinecap="round" />
        <ellipse cx={343} cy={500} rx={44} ry={56} fill={C.ink} />
        <ellipse cx={343} cy={500} rx={22} ry={32} fill={C.inkLift} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${400 + i * 22} ${470 - 20 - i * 6} Q${430 + i * 22} 500 ${400 + i * 22} ${530 + i * 6}`} fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" opacity={pulse * (1 - i * 0.25)} />
        ))}
      </g>
      <Chip x={640} y={420} text="ba" inner p={fireIn} size={64} w={150} />
      {/* timeline strip */}
      <g>
        <rect x={tx0} y={254} width={tx1 - tx0} height={14} rx={7} fill={C.paperDark} />
        {Array.from({length: 11}).map((_, i) => (
          <rect key={i} x={tx0 + i * 98 - 2} y={238} width={4} height={46} fill={C.inkFaint} />
        ))}
        <rect x={mark - 5} y={216} width={10} height={90} fill={C.caution} />
        <path d={`M${cx} 200 V312`} stroke={C.ink} strokeWidth={7} />
        <path d={`M${cx - 16} 186 H${cx + 16} L${cx} 214 Z`} fill={C.ink} />
        <Chip x={mark + 20} y={140} text="ba" p={fireS} size={64} w={150} />
      </g>
      {/* result panels */}
      <g opacity={m1}>
        {[{x: 620, a: 'ba', c: 'ba', wait: 1 - dipA}, {x: 1240, a: 'bi', c: 'ba', wait: 1 - dipB}].map((pn, i) => (
          <g key={i}>
            <rect x={pn.x} y={500} width={560} height={410} rx={28} fill={C.paperLight} stroke={C.paperDark} strokeWidth={3} />
            <Chip x={pn.x + 150} y={585} text={pn.a} inner p={1} size={60} w={130} />
            <Txt x={pn.x + 280} y={606} text="+" size={56} color={C.inkMute} />
            <Chip x={pn.x + 410} y={585} text={pn.c} p={1} size={60} w={130} />
            <path d={`M${pn.x + 20} ${yb} H${pn.x + 540}`} stroke={C.paperDark} strokeWidth={3} />
            <Txt x={pn.x + 280} y={yb + 40} text="?" size={110} color={C.theoryLight} o={pn.wait * 0.55} />
          </g>
        ))}
        <path d={smoothD(ref)} fill="none" stroke={C.inkFaint} strokeWidth={5} strokeDasharray="12 10" opacity={dipA * 0.9} />
        <path d={smoothD(curA)} fill="none" stroke={C.evidence} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${dipA} 1.01`} />
        <path d={smoothD(curB)} fill="none" stroke={C.theory} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${dipB} 1.01`} />
      </g>
      <Tag x={640} y={975} text="Weaker response" kind="confirmed" size={42} p={ramp(t, T.matched + 0.6, T.matched + 1.1, ease.out)} />
      <Tag x={1260} y={975} text="No change" kind="ink" size={42} p={ramp(t, T.nomatch + 1.0, T.nomatch + 1.5, ease.out)} />
    </Stage>
  );
};

// S7 · 312.90 · imagining changed the answer
export const S7: React.FC<{t: number}> = ({t}) => {
  const P1 = win(t, T.right - 1, T.sentence + 0.8, 0.01, 0.6);
  const P2 = win(t, T.sentence - 0.3, T.fine + 0.2, 0.6, 0.6);
  const P3 = win(t, T.fine - 0.6, 330, 0.6, 0.01);
  const cA = ramp(t, 313.0, 314.8, ease.inOut);
  const cB = ramp(t, 314.2, 316.6, ease.inOut);
  const curveA = erp(300, 1620, 620, 70, t);
  const curveB = erp(300, 1620, 620, 250, t);
  return (
    <Stage bg={C.paper}>
      <g opacity={P1}>
        <path d="M280 620 H1640" stroke={C.paperDark} strokeWidth={4} />
        <path d={smoothD(curveB)} fill="none" stroke={C.theory} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${cB} 1.01`} />
        <path d={smoothD(curveA)} fill="none" stroke={C.evidence} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${cA} 1.01`} />
        <Chip x={440} y={330} text="ba" inner p={ramp(t, 313.8, 314.4, ease.out)} size={64} w={140} />
        <Txt x={580} y={352} text="+" size={60} color={C.inkMute} o={ramp(t, 313.8, 314.4)} />
        <Chip x={720} y={330} text="ba" p={ramp(t, 313.8, 314.4, ease.out)} size={64} w={140} />
        <Chip x={1060} y={330} text="bi" inner p={ramp(t, 316.0, 316.6, ease.out)} size={64} w={140} />
        <Txt x={1190} y={352} text="+" size={60} color={C.inkMute} o={ramp(t, 316.0, 316.6)} />
        <Chip x={1340} y={330} text="ba" p={ramp(t, 316.0, 316.6, ease.out)} size={64} w={140} />
        <Tag x={440} y={900} text="Weaker response" kind="confirmed" size={42} p={ramp(t, 315.0, 315.5, ease.out)} />
        <Tag x={1060} y={900} text="Full response" kind="theory" size={42} p={ramp(t, 317.4, 317.9, ease.out)} />
      </g>
      <g opacity={P2}>
        <SilentWave x={260} y={540} w={1400} amp={150} t={t} p={ramp(t, T.sentence - 0.4, T.sentence + 0.8)} silent={1} words={['say', 'it', 'in', 'your', 'head']} labelSize={42} seed={12} ghost={{offset: 38, match: 1, color: C.evidence, silent: 1, p: ramp(t, T.sentence + 1.2, T.sentence + 2.6)}} />
        <Tag x={260} y={330} text="Forecast, in detail" kind="theory" size={42} p={ramp(t, T.sentence + 2.3, T.sentence + 2.8, ease.out)} />
      </g>
      <g opacity={P3}>
        <Kicker x={960} y={190} text="FINE ENOUGH TO TELL ONE SYLLABLE FROM ANOTHER" size={38} color={C.ink} p={ramp(t, T.fine - 0.3, T.fine + 0.4, ease.out)} />
        {[{x: 190, w: 'ba', m: 1}, {x: 1030, w: 'bi', m: 0}].map((o, i) => (
          <g key={i}>
            <SilentWave x={o.x} y={600} w={700} amp={190} t={t} p={ramp(t, T.fine - 0.6 + i * 0.4, T.fine + 0.6 + i * 0.4)} silent={1} bursts={1} words={[o.w]} labelSize={70} seed={31} ghost={{offset: 0, match: o.m, color: o.m ? C.evidence : C.oxblood, silent: 1, p: ramp(t, T.fine + 0.2 + i * 0.4, T.fine + 1.2 + i * 0.4)}} />
          </g>
        ))}
      </g>
    </Stage>
  );
};

// S8 · 327.80 · tag it as yours
export const S8: React.FC<{t: number}> = ({t}) => {
  const waveP = ramp(t, T.one, T.one + 1.4);
  const drop = ramp(t, T.tagOn - 0.2, T.tagOn + 0.7, ease.outBack);
  const sway = (1 - drop) * 6;
  const tagY = lerp(250, 640, drop);
  return (
    <Stage bg={C.ink}>
      <MindSpace t={t} bg="ink" seed={5} density={0.8} />
      <SilentWave x={220} y={500} w={1240} amp={120} t={t} p={waveP} silent={1} tone="ink" words={['hello', 'there', 'me']} labelSize={42} seed={9} />
      {/* luggage tag tied on */}
      <g transform={`translate(1500 ${tagY}) rotate(${sway})`}>
        <path d="M0 -150 Q-10 -60 0 -4" fill="none" stroke={C.paperDark} strokeWidth={6} />
        <path d="M-110 20 L-75 -20 H75 L110 20 V220 Q110 250 75 250 H-75 Q-110 250 -110 220 Z" fill={C.paperLight} stroke={C.paperDark} strokeWidth={4} />
        <circle cx={0} cy={4} r={14} fill={C.ink} />
        <Txt x={0} y={150} text="MINE" size={50} weight={800} />
      </g>
      <circle cx={1500} cy={500} r={0} />
      <path d={`M1465 ${500 + 8} Q1500 ${Math.min(520, tagY - 120)} 1500 ${tagY - 150}`} fill="none" stroke={C.paperDark} strokeWidth={5} opacity={drop > 0 ? 1 : 0} />
      <Tag x={220} y={900} text="A model, not a settled fact" kind="theory" size={42} p={ramp(t, T.model - 0.1, T.model + 0.5, ease.out)} />
    </Stage>
  );
};

// S9 · 335.40 · measured / not measured
export const S9: React.FC<{t: number}> = ({t}) => {
  const a = ramp(t, T.limits - 0.3, T.limits + 0.5, ease.out);
  const b = ramp(t, T.notm - 0.3, T.notm + 0.5, ease.out);
  const k = ramp(t, T.measured, T.measured + 0.5, ease.outBack);
  return (
    <Stage bg={C.paperShade}>
      <Card x={960} y={340} w={1340} h={280} p={a} rot={-0.6}>
        <circle cx={150} cy={140} r={62} fill={C.evidence} />
        <path d="M118 140 L142 166 L186 112" fill="none" stroke={C.paperLight} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" pathLength={1} style={{strokeDasharray: `${k} 1.01`}} />
        <Txt x={260} y={160} text="Measured: a brain response" size={64} anchor="start" />
      </Card>
      <Card x={960} y={720} w={1340} h={280} p={b} rot={0.6}>
        <circle cx={150} cy={140} r={62} fill="none" stroke={C.caution} strokeWidth={10} strokeDasharray="14 10" />
        <Txt x={150} y={170} text="?" size={86} color={C.caution} weight={700} />
        <Txt x={260} y={160} text="Not measured: what anyone heard" size={60} anchor="start" />
      </Card>
    </Stage>
  );
};

// S11 · 351.20 · jigsaw
const pieceD = (x: number, y: number, s: number, e: [number, number, number, number]) => {
  // edges: top, right, bottom, left; value 0 flat, 1 knob out, -1 knob in
  const corners: [number, number][] = [[x, y], [x + s, y], [x + s, y + s], [x, y + s]];
  const normals: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  let d = `M${x} ${y}`;
  for (let i = 0; i < 4; i++) {
    const S0 = corners[i];
    const E0 = corners[(i + 1) % 4];
    const dv: [number, number] = [E0[0] - S0[0], E0[1] - S0[1]];
    const n = normals[i];
    const k = e[i];
    if (!k) {
      d += ` L${E0[0]} ${E0[1]}`;
      continue;
    }
    const pa: [number, number] = [S0[0] + dv[0] * 0.4, S0[1] + dv[1] * 0.4];
    const pb: [number, number] = [S0[0] + dv[0] * 0.6, S0[1] + dv[1] * 0.6];
    const h = s * 0.27 * k;
    d += ` L${pa[0]} ${pa[1]} C${pa[0] + n[0] * h - dv[0] * 0.12} ${pa[1] + n[1] * h - dv[1] * 0.12} ${pb[0] + n[0] * h + dv[0] * 0.12} ${pb[1] + n[1] * h + dv[1] * 0.12} ${pb[0]} ${pb[1]} L${E0[0]} ${E0[1]}`;
  }
  return d + ' Z';
};
export const S11: React.FC<{t: number}> = ({t}) => {
  const s = 270;
  const x0 = 960 - 1.5 * s;
  const y0 = 540 - s;
  // vertical (between cols) and horizontal edge signs
  const v = [[1, -1], [-1, 1]]; // v[row][joint]
  const hz = [1, -1, 1]; // between rows, per col
  const cells: {c: number; r: number; e: [number, number, number, number]}[] = [];
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 3; c++) {
      const top = r === 0 ? 0 : -hz[c];
      const bottom = r === 1 ? 0 : hz[c];
      const left = c === 0 ? 0 : -v[r][c - 1];
      const right = c === 2 ? 0 : v[r][c];
      cells.push({c, r, e: [top, right, bottom, left]});
    }
  const land = ramp(t, T.piece - 0.3, T.piece + 0.7, ease.outBack);
  const fl = ramp(t, T.puz, T.puz + 0.6, ease.out);
  return (
    <Stage bg={C.paper}>
      <g opacity={fl}>
        {[...cells].sort((a, b) => Number(a.c === 1 && a.r === 0) - Number(b.c === 1 && b.r === 0)).map((cl) => {
          const x = x0 + cl.c * s;
          const y = y0 + cl.r * s;
          const star = cl.c === 1 && cl.r === 0;
          const stag = ramp(t, T.puz + cl.c * 0.12 + cl.r * 0.1, T.puz + 0.7 + cl.c * 0.12 + cl.r * 0.1, ease.out);
          const dy = star ? (1 - land) * -420 : (1 - stag) * 40;
          const d = pieceD(x, y, s - 6, cl.e);
          return (
            <g key={cl.c + '-' + cl.r} transform={`translate(${star ? 0 : 0} ${dy + (star ? 0 : Math.sin(t * 1.4 + cl.c * 2 + cl.r) * 2)}) translate(${cl.c * 3} ${cl.r * 3})`} opacity={star ? clamp(land * 4) : stag}>
              <path d={d} fill={star ? C.evidence : C.theoryTint} fillOpacity={star ? 1 : 0.35} stroke={star ? C.evidenceLight : INNER} strokeWidth={star ? 5 : 5} strokeDasharray={star ? undefined : '16 11'} strokeLinejoin="round" />
              {star && <Txt x={x + (s - 6) / 2} y={y + s / 2 + 8} text="Forecast" size={46} color={C.paperLight} />}
            </g>
          );
        })}
      </g>
    </Stage>
  );
};
