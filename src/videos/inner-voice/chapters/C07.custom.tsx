// Custom shots for C07 "The wrong question" (builder-owned).
import React from 'react';
import {Stage, Cam, breathe} from '../../../kit/stage';
import {C, FONT_SANS, FONT_SERIF} from '../../../kit/theme';
import {camAt, clamp01, ease, mixHex, noise1, ramp} from '../../../kit/anim';
import {Headline, Kicker, Tag, RedPen, Para, textW} from '../../../kit/text';
import {Card} from '../../../kit/cards';
import {QuestionMark} from '../../../kit/diagrams';
import {HeadProfile} from '../../../kit/science';
import {SilentWave, ThoughtContent} from '../shared';
import {getPointAtLength, getLength} from '@remotion/paths';

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const inv = (v: number) => 1 - v;

// ---- cue times (spoken words as comments)
const T = {
  s1: 434.5, // "Nobody knows yet how both can be true."
  sw: 437.9, // "isn't a clean off switch"
  review: 440.0, // "a 2026 review" (439.9)
  unc: 441.9, // "how uncertain it still is"
  s2: 445.7, // "A mind with less voice might also be doing the same job"
  another: 448.14, // "another way"
  poss: 449.6, // "a possibility"
  s3: 451.7, // "The authors named the low end"
  anend: 453.28, // "anendophasia"
  critics: 455.98, // "critics say the data don't show"
  s4: 459.2, // "A 2025 commentary"
  c2026: 463.5, // "and a 2026 one"
  s5: 467.4, // "It's a fair worry."
  rnd: 468.44, // "A few random moments"
  never: 470.54, // "never"
  s7: 482.4, // "The best-supported picture so far is that the voice is a tool."
  tool: 485.36, // "tool"
  inward: 486.4, // "Language, built to carry messages between people, turned inward"
  fold: 487.7,
  s9: 497.6, // "Some minds reach for it constantly."
  rarely: 499.71, // "Some rarely."
  theory: 500.8, // "And no one has a single theory"
  s10: 506.6, // "What no one has fully explained"
  head: 510.3, // "experienced as hearing" (511.2)
};

const ink = C.ink;

// small flat text helper (never animated beyond eased entrances)
const Txt: React.FC<{x: number; y: number; text: string; size: number; color?: string; anchor?: 'start' | 'middle' | 'end'; font?: 'serif' | 'sans'; weight?: number; p?: number; spacing?: number}> = ({x, y, text, size, color = ink, anchor = 'middle', font = 'sans', weight = 700, p = 1, spacing = 0}) =>
  p <= 0 ? null : (
    <text x={x} y={y + (1 - ease.out(clamp01(p))) * 14} textAnchor={anchor} fontFamily={font === 'serif' ? FONT_SERIF : FONT_SANS} fontWeight={weight} fontSize={size} letterSpacing={spacing} fill={color} opacity={ease.out(clamp01(p))}>
      {text}
    </text>
  );

// ============ S1 · "?" between findings; the switch only dims the voice ============
export const S1: React.FC<{t: number}> = ({t}) => {
  const flip = ramp(t, T.sw - 0.1, T.sw + 0.5, ease.outBack);
  const dim = ramp(t, T.sw, T.sw + 0.8, ease.inOut);
  const topOut = ramp(t, T.review - 0.3, T.review + 0.5, ease.inOut);
  const flick = dim > 0.9 ? 0.72 + 0.28 * Math.abs(noise1(t * 7, 5)) : 1;
  const card = (x: number, text: string, p: number) => (
    <Card x={x} y={240 - 30 * topOut} w={700} h={200} p={p} fill={C.paperLight}>
      <rect x={0} y={0} width={12} height={200} fill={C.inkMute} />
      <Txt x={50} y={122} text={text} size={52} font="serif" weight={700} anchor="start" />
    </Card>
  );
  const sx = 310;
  const sy = 720;
  const lever = lerp(-58, 58, flip);
  return (
    <Stage bg={C.ink}>
      <Cam cam={breathe({cx: 960, cy: 540, z: 1, r: 0}, t, 0.5)}>
        <g opacity={inv(topOut)}>
          {card(470, 'Disturb the voice', ramp(t, T.s1 - 0.3, T.s1 + 0.4))}
          {card(1450, 'Live with little voice', ramp(t, T.s1 - 0.2, T.s1 + 0.5))}
          <QuestionMark x={960} y={240} size={230} p={ramp(t, T.s1 + 0.1, T.s1 + 0.8)} color={C.theoryLight} />
        </g>
        {/* wall switch */}
        <g opacity={ramp(t, T.s1 + 1.2, T.s1 + 2.0)} transform={`translate(${sx} ${sy}) scale(1.3) translate(${-sx} ${-sy})`}>
          <rect x={sx - 90} y={sy - 140} width={180} height={280} rx={20} fill={C.paperLight} />
          <rect x={sx - 42} y={sy - 94} width={84} height={188} rx={14} fill={C.paperShade} />
          <rect x={sx - 30} y={sy + lever - 40} width={60} height={80} rx={12} fill={ink} />
          <rect x={sx - 30} y={sy + lever - 40} width={60} height={14} rx={7} fill={C.inkMute} />
        </g>
        {/* the voice wave beside it: dims to half and flickers, never off */}
        <g opacity={ramp(t, T.s1 + 1.2, T.s1 + 2.0) * flick}>
          <SilentWave x={500} y={sy} w={820} amp={lerp(130, 60, dim)} t={t} p={ramp(t, T.s1 + 1.4, T.s1 + 2.6)} seed={4} tone="ink" bursts={5} color={mixHex(C.paperLight, C.cautionLight, dim)} />
        </g>
        {/* 2026 review card */}
        <Card x={1600} y={620} w={520} h={340} p={ramp(t, T.review - 0.1, T.review + 0.6)} rot={-1.5}>
          <rect x={0} y={0} width={14} height={340} fill={C.caution} />
          <Txt x={50} y={110} text="2026 REVIEW" size={36} color={C.inkMute} anchor="start" spacing={3} />
          <Txt x={44} y={220} text="2026 review" size={64} font="serif" anchor="start" />
          <rect x={44} y={262} width={190} height={8} fill={C.caution} />
        </Card>
        <Tag x={1400} y={880} anchor="center" kind="caution" size={42} text="Still uncertain what it disrupts" p={ramp(t, T.unc, T.unc + 0.5)} />
      </Cam>
    </Stage>
  );
};

// ============ S2 · two routes, same flag ============
export const S2: React.FC<{t: number}> = ({t}) => {
  const A = 'M330 540 C 450 330 600 330 800 330 L1120 330 C 1350 330 1500 400 1570 500';
  const B = 'M330 540 C 450 760 600 770 740 760 L1180 760 C 1380 760 1500 650 1570 570';
  const pa = ramp(t, T.s2 + 0.3, T.s2 + 1.9, ease.inOut);
  const pb = ramp(t, T.s2 + 1.9, T.s2 + 3.5, ease.inOut);
  const dotA = (t * 0.28) % 1;
  const dotB = (t * 0.22 + 0.45) % 1;
  const route = (d: string, p: number, col: string) => <path d={d} fill="none" stroke={col} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />;
  const flagIn = ramp(t, T.s2, T.s2 + 0.8, ease.outBack);
  const lit = ramp(t, T.poss - 0.2, T.poss + 0.6);
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={breathe({cx: 960, cy: 540, z: 1, r: 0}, t, 0.6)}>
        {route(A, pa, ink)}
        {route(B, pb, ink)}
        {/* word-bubble on route A (dashed plum = inner speech) */}
        <g opacity={ramp(t, T.s2 + 1.0, T.s2 + 1.7)}>
          <rect x={800} y={270} width={320} height={120} rx={60} fill={C.paperLight} stroke={C.theory} strokeWidth={7} strokeDasharray="16 12" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={850 + i * 0} y={304 + i * 26} width={[210, 150, 180][i]} height={10} rx={5} fill={C.theory} opacity={0.7} />
          ))}
        </g>
        {/* image + feeling on route B */}
        <g opacity={ramp(t, T.s2 + 2.4, T.s2 + 3.1)}>
          <ThoughtContent x={870} y={760} r={92} kind="image" frame="circle" t={t} p={ramp(t, T.s2 + 2.4, T.s2 + 3.4)} seed={2} />
          <ThoughtContent x={1050} y={760} r={92} kind="feeling" frame="circle" t={t} p={ramp(t, T.another - 0.2, T.another + 0.8)} seed={3} />
        </g>
        {/* start */}
        <circle cx={330} cy={540} r={34} fill={ink} />
        <circle cx={330} cy={540} r={52} fill="none" stroke={ink} strokeWidth={5} />
        {/* goal flag */}
        <g transform={`translate(1600 ${540}) scale(${flagIn})`}>
          <rect x={-6} y={-130} width={12} height={230} fill={ink} />
          <path d="M6 -130 L150 -90 L6 -50 Z" fill={C.oxblood} />
          <circle cx={0} cy={100} r={16} fill={ink} />
        </g>
        {/* travelers */}
        {pa >= 1 && <circle r={13} fill={C.theory} {...travel(A, dotA)} />}
        {pb >= 1 && <circle r={13} fill={C.theory} {...travel(B, dotB)} />}
      </Cam>
      <Tag x={960} y={950} anchor="center" kind="theory" size={46} text="Possible — not settled" p={lit} />
    </Stage>
  );
};
function travel(d: string, k: number) {
  const len = pathLen(d);
  const p = getPointAtLength(d, clamp01(k) * len);
  return {cx: p?.x ?? 0, cy: p?.y ?? 0};
}
const lenCache: Record<string, number> = {};
function pathLen(d: string) {
  if (!lenCache[d]) lenCache[d] = getLength(d);
  return lenCache[d];
}

// ============ S3 · slider: INNER SPEECH, anendophasia ============
export const S3: React.FC<{t: number}> = ({t}) => {
  const y = 730;
  const dashed = ramp(t, T.critics + 0.3, T.critics + 0.9);
  const card = ramp(t, T.anend - 0.2, T.anend + 0.6);
  const bar = ramp(t, T.s3 - 0.1, T.s3 + 0.7, ease.inOut);
  const cam = camAt(t, [[T.critics - 0.4, 960, 540, 1, 0], [T.critics + 0.7, 560, 640, 1.45, 0]], ease.inOut);
  const ring = ramp(t, T.critics + 0.5, T.critics + 1.4, ease.inOut);
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={breathe(cam, t, 0.4)}>
        <Kicker x={1680} y={610} text="INNER SPEECH" anchor="end" size={42} color={C.inkSoft} p={ramp(t, T.s3, T.s3 + 0.6)} />
        <g opacity={bar}>
          {/* main bar */}
          <rect x={330} y={y - 24} width={1350} height={48} fill={C.paperLight} stroke={ink} strokeWidth={5} />
          {/* "None" end: solid, then dashed and hollow */}
          <rect x={240} y={y - 24} width={90} height={48} fill={mixHex(C.paperLight, C.paperShade, dashed)} stroke={dashed > 0.5 ? C.caution : ink} strokeWidth={5} strokeDasharray={dashed > 0.5 ? '12 9' : undefined} />
        </g>
        <Txt x={560} y={y + 100} text="Low" size={44} p={ramp(t, T.s3 + 0.2, T.s3 + 0.8)} />
        <Txt x={1680} y={y + 100} text="A lot" size={44} anchor="end" p={ramp(t, T.s3 + 0.4, T.s3 + 1.0)} />
        <Txt x={240} y={y + 100} text="None" size={44} anchor="start" color={dashed > 0.5 ? C.caution : ink} p={ramp(t, T.critics - 0.1, T.critics + 0.5)} />
        {/* marker at low end */}
        <path d={`M560 ${y - 34} l-22 -40 h44 Z`} fill={C.theory} opacity={card} />
        <QuestionMark x={285} y={y - 80} size={110} p={ramp(t, 458.0, 458.6)} color={C.caution} />
        {ring > 0.02 && <ellipse cx={297} cy={y + 88} rx={104} ry={52} fill="none" stroke={C.oxblood} strokeWidth={9} strokeLinecap="butt" pathLength={1} strokeDasharray={`${ring} 1`} transform={`rotate(-4 297 ${y + 88})`} />}
        {/* term card */}
        <g opacity={1 - ramp(t, T.critics - 0.2, T.critics + 0.5)}><Card x={960} y={340} w={940} h={290} p={card} rot={-1}>
          <rect x={0} y={0} width={14} height={290} fill={C.theory} />
          <Txt x={50} y={160} text="anendophasia" size={124} font="serif" anchor="start" />
          <Txt x={52} y={242} text="a lack of inner speech" size={52} font="serif" weight={500} color={C.inkSoft} anchor="start" p={ramp(t, T.anend + 1.2, T.anend + 1.9)} />
        </Card>
        <path d={`M560 ${y - 36} L560 500`} stroke={C.theory} strokeWidth={6} strokeDasharray="12 10" strokeLinecap="round" fill="none" opacity={card} />
        </g>
      </Cam>
    </Stage>
  );
};

// ============ S4 · two commentaries ============
export const S4: React.FC<{t: number}> = ({t}) => {
  const one = (x: number, year: string, line: string, p: number, rot: number) => (
    <Card x={x} y={540} w={720} h={460} p={p} rot={rot}>
      <rect x={0} y={0} width={14} height={460} fill={C.caution} />
      <Txt x={56} y={110} text={year} size={64} font="serif" anchor="start" />
      <rect x={56} y={140} width={150} height={7} fill={C.caution} />
      <Para x={56} y={176} w={620} h={260} text={line} size={50} weight={600} color={C.inkSoft} p={ramp(p, 0.3, 0.9)} />
      <circle cx={360} cy={-8} r={20} fill={C.caution} />
    </Card>
  );
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={breathe({cx: 960, cy: 540, z: 1, r: 0}, t, 0.6)}>
        {one(500, '2025 commentary', 'No compelling evidence for complete absence', ramp(t, T.s4 - 0.4, T.s4 + 0.4), -1.5)}
        {one(1420, '2026 commentary', 'How could absence ever be established?', ramp(t, T.c2026 - 0.2, T.c2026 + 0.5), 1.5)}
      </Cam>
    </Stage>
  );
};

// ============ S5 · a day, four snapshots, "never" struck ============
export const S5: React.FC<{t: number}> = ({t}) => {
  const y = 690;
  const xs = [330, 740, 1150, 1560];
  const kinds = ['image', 'feeling', 'awareness', 'wordless'] as const;
  const line = ramp(t, T.s5 - 0.2, T.s5 + 0.8, ease.inOut);
  const nv = ramp(t, T.never - 0.9, T.never - 0.2);
  const hw = textW('never', 150, 'serif', 700);
  return (
    <Stage bg={C.paper}>
      <Cam cam={breathe({cx: 960, cy: 540, z: 1, r: 0}, t, 0.6)}>
        {/* the long day, mostly unknown */}
        <path d={`M150 ${y} L${150 + 1620 * line} ${y}`} stroke={C.inkMute} strokeWidth={8} strokeLinecap="round" strokeDasharray="22 18" fill="none" />
        {xs.map((x, i) => {
          const p = ramp(t, T.s5 + 0.3 + i * 0.35, T.s5 + 0.9 + i * 0.35);
          return (
            <g key={i}>
              {p > 0 && <circle cx={x} cy={y} r={20 * ease.outBack(p)} fill={ink} />}
              <rect x={x - 4} y={y - 100 * ease.out(p)} width={8} height={100 * ease.out(p) - 20} fill={ink} />
              <ThoughtContent x={x} y={y - 230} r={95} kind={kinds[i]} frame="circle" t={t} p={ramp(t, T.s5 + 0.6 + i * 0.35, T.s5 + 1.4 + i * 0.35)} seed={i + 3} />
            </g>
          );
        })}
        <Headline x={960} y={230} text="never" size={150} p={nv} weight={700} anchor="middle" mode="rise" />
        <RedPen lines={[{x: 960 - hw / 2, y: 190, w: hw}]} p={ramp(t, T.never - 0.1, T.never + 0.5, (x) => x)} strike thick={12} />
      </Cam>
    </Stage>
  );
};

// ============ S7 · language folds inward (C03 S8 look) ============
export const S7: React.FC<{t: number}> = ({t}) => {
  const L = {x: 540, y: 600};
  const R = {x: 1380, y: 600};
  const SH = 1.05;
  const draw = ramp(t, T.s7 + 0.6, T.s7 + 3.0, ease.inOut);
  const trav = ramp(t, T.inward - 0.1, 488.3, ease.inOut);
  const bend = ramp(t, 488.3, 489.1, ease.inOut);
  const fold = ramp(t, 488.6, 489.7, ease.inOut);
  const P0 = {x: L.x + 215 * SH, y: L.y + 80 * SH};
  const endX = lerp(lerp(R.x - 170 * SH, L.x + 40, bend), L.x - 20, fold);
  const endY = lerp(lerp(R.y - 10, L.y - 120 * SH, bend), L.y - 40, fold);
  const ctlX = lerp(lerp(960, 880, bend), L.x + 150, fold);
  const ctlY = lerp(lerp(P0.y - 40, 190, bend), L.y - 280 * SH, fold);
  const d = `M${P0.x} ${P0.y} Q${ctlX} ${ctlY} ${endX} ${endY}`;
  const col = mixHex(ink, C.theory, fold);
  const sp = ramp(t, 489.0, 489.8);
  const u = trav;
  const bx = (1 - u) * (1 - u) * P0.x + 2 * (1 - u) * u * ctlX + u * u * endX;
  const by = (1 - u) * (1 - u) * P0.y + 2 * (1 - u) * u * ctlY + u * u * endY;
  const bpop = ease.outBack(ramp(t, T.inward - 0.2, T.inward + 0.3));
  const bsc = 1.7 * bpop * (1 - 0.5 * fold);
  const plum = fold > 0.5;
  let spiral = '';
  for (let i = 0; i <= 40; i++) {
    const a = i * 0.34;
    const r = 118 - i * 2.7;
    spiral += `${i === 0 ? 'M' : 'L'}${L.x - 10 + Math.cos(a) * r} ${L.y - 50 + Math.sin(a) * r * 0.9} `;
  }
  return (
    <Stage bg={C.paper}>
      <Cam cam={breathe({cx: 960, cy: 540, z: 1, r: 0}, t, 0.6)}>
        <HeadProfile x={R.x} y={R.y} s={SH} facing="left" skin={C.skin[3]} t={t} />
        <HeadProfile x={L.x} y={L.y} s={SH} facing="right" skin={C.skin[1]} t={t} />
        {draw > 0 && <path d={d} fill="none" stroke={col} strokeWidth={10} strokeLinecap="round" strokeDasharray={fold > 0.7 ? '16 12' : undefined} pathLength={1} style={draw < 1 ? {strokeDasharray: `${draw} 1`} : undefined} />}
        {draw > 0 && draw < 1 && <circle cx={lerp(P0.x, endX, draw)} cy={lerp(P0.y, endY, draw) - 20 * Math.sin(draw * Math.PI)} r={10} fill={ink} />}
        {bpop > 0 && (
          <g transform={`translate(${bx} ${by - 30}) scale(${bsc})`} opacity={1 - 0.2 * fold}>
            <rect x={-80} y={-55} width={160} height={110} rx={30} fill={plum ? mixHex(C.paperLight, C.theoryTint, 0.5) : C.paperLight} stroke={plum ? C.theory : ink} strokeWidth={8} strokeDasharray={plum ? "16 11" : undefined} />
            {[[-48, -22, 96], [-48, 2, 66], [-48, 26, 82]].map(([a, b, w], j) => (
              <rect key={j} x={a} y={b} width={w} height={12} rx={6} fill={plum ? C.theory : ink} />
            ))}
          </g>
        )}
        {sp > 0 && <path d={spiral} fill="none" stroke={C.theory} strokeWidth={9} strokeLinecap="round" strokeDasharray="16 12" opacity={sp} />}
      </Cam>
      <Tag x={960} y={150} anchor="center" kind="confirmed" size={46} text="Best-supported picture" p={ramp(t, T.s7 + 0.2, T.s7 + 0.8)} />
    </Stage>
  );
};

// ============ S9 · seven heads, bubbles from constantly to rarely ============
export const S9: React.FC<{t: number}> = ({t}) => {
  const periods = [0.75, 0.95, 1.35, 1.95, 2.9, 4.4, 7];
  const y = 640;
  const sy = 880;
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={breathe({cx: 960, cy: 540, z: 1, r: 0}, t, 0.6)}>
        {periods.map((per, i) => {
          const x = 290 + i * 225;
          const start = T.s9 + 0.2 + i * 0.08;
          const age = t - start;
          const ph = age > 0 ? ((age + i * 0.37) % per) / per : 1;
          const life = Math.min(1, 1.5 / per + 0.0);
          void life;
          const active = ph < Math.min(0.75, 1.1 / per);
          const k = active ? ease.outBack(clamp01(ph / Math.min(0.75, 1.1 / per) / 0.35)) * (1 - ramp(ph, Math.min(0.75, 1.1 / per) * 0.7, Math.min(0.75, 1.1 / per))) : 0;
          return (
            <g key={i}>
              <HeadProfile x={x} y={y} s={0.46} facing="right" skin={C.skin[(i * 3) % 5 < C.skin.length ? (i * 3) % 5 : i % 4]} t={t} o={ramp(t, T.s9 - 0.3 + i * 0.06, T.s9 + 0.3 + i * 0.06)} />
              {k > 0.02 && age > 0 && (
                <g transform={`translate(${x + 10} ${y - 330}) scale(${k})`}>
                  <ellipse cx={0} cy={0} rx={108} ry={88} fill={C.paperLight} stroke={C.theory} strokeWidth={6} strokeDasharray="12 9" />
                  <circle cx={-20} cy={108} r={15} fill={C.theory} />
                  <circle cx={-52} cy={140} r={9} fill={C.theory} />
                  <g>{[[-70,-40,140],[-70,-8,100],[-70,24,120]].map(([a,b,w],j)=><rect key={j} x={a} y={b} width={w} height={16} rx={8} fill={C.theory} opacity={0.8} />)}</g>
                </g>
              )}
            </g>
          );
        })}
        {/* spectrum line */}
        <g opacity={ramp(t, T.s9 + 0.5, T.s9 + 1.2)}>
          <path d={`M290 ${sy} L1640 ${sy}`} stroke={C.inkSoft} strokeWidth={6} strokeLinecap="round" />
          <circle cx={290} cy={sy} r={14} fill={ink} />
          <circle cx={1640} cy={sy} r={14} fill="none" stroke={ink} strokeWidth={6} />
        </g>
        <Txt x={290} y={sy + 70} text="Constantly" size={44} anchor="start" p={ramp(t, T.s9 + 0.8, T.s9 + 1.4)} />
        <Txt x={1640} y={sy + 70} text="Rarely" size={44} anchor="end" p={ramp(t, T.rarely - 0.1, T.rarely + 0.5)} />
      </Cam>
      <Tag x={960} y={170} anchor="center" kind="caution" size={44} text="No single theory explains every form" p={ramp(t, T.theory - 0.1, T.theory + 0.5)} />
    </Stage>
  );
};

// ============ S10 · why does it feel like hearing? ============
export const S10: React.FC<{t: number}> = ({t}) => {
  const ex = 1130;
  const ey = 610;
  const wp = ramp(t, T.s10 + 0.3, T.s10 + 2.0, ease.inOut);
  const earP = ramp(t, T.s10 + 0.1, T.s10 + 0.9, ease.out);
  const q = ramp(t, T.head + 0.8, T.head + 1.5);
  return (
    <Stage bg={C.ink}>
      <Cam cam={breathe({cx: 960, cy: 540, z: 1, r: 0}, t, 0.7)}>
        <g transform={`translate(${ex} ${ey}) scale(${1.25 * (0.9 + 0.1 * earP)})`} opacity={earP}>
          <path d="M0 -200 C 150 -230 230 -120 215 20 C 200 150 120 230 20 250 C -40 255 -80 200 -60 130 C -45 80 -100 60 -95 -10 C -90 -120 -60 -190 0 -200 Z" fill={C.skin[2]} />
          <path d="M30 -120 C 130 -130 150 0 110 90 C 80 150 30 170 0 150" fill="none" stroke={C.skinShade[2]} strokeWidth={14} strokeLinecap="round" />
          <path d="M20 -60 C 70 -60 80 0 55 40" fill="none" stroke={C.skinShade[2]} strokeWidth={12} strokeLinecap="round" />
          <ellipse cx={-30} cy={20} rx={26} ry={34} fill={C.skinShade[2]} />
        </g>
        <SilentWave x={160} y={ey + 20} w={780} amp={105} t={t} p={wp} silent={1} seed={6} tone="ink" bursts={6} />
      </Cam>
      <Headline x={960} y={200} size={88} anchor="middle" color={C.paperLight} text="Why does it feel like hearing?" p={ramp(t, T.head, T.head + 1.0)} mode="rise" />
      <QuestionMark x={1580} y={560} size={260} p={q} color={C.theoryLight} />
    </Stage>
  );
};
