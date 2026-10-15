// Custom shots for C03 "Not hygiene, medicine" (builder-owned).
import React from 'react';
import {Stage} from '../../../kit/stage';
import {C, FONT_SERIF} from '../../../kit/theme';
import {ease, ramp, win, keys, clamp01, lerp} from '../../../kit/anim';
import {Headline, Kicker, Tag} from '../../../kit/text';
import {Arrow, CrossOut, QuestionMark} from '../../../kit/diagrams';
import {Icon} from '../../../kit/icons';
import {Germ, BodyOutline} from '../../../kit/science';
import {Card, OpenBook} from '../../../kit/cards';
import {Steam, Ripples} from '../../../kit/fx';
import {HumorWheel, PoreSkin} from '../shared';

const T = {
  // S2 · "Medieval medicine didn't have germs. It had humors."
  germ: 123.6, cross: 124.0, humors: 124.58,
  // S3 · "blood, phlegm, yellow bile, and black bile"
  blood: 126.2, phlegm: 127.0, yellow: 127.4, black: 128.4,
  // S4 · "Health was balance … hot and cold, wet and dry"
  ghost: 129.6, ghostEnd: 131.5, balance: 132.3, axes: 134.2, axesEnd: 136.7,
  // S5 · "heat and moisture … forces"
  s5: 137.0, arrive: 137.8, forces: 141.2, settle: 143.6,
  // S8 · "Fevers / Joint pain / Headaches / temperature / adding herbs"
  s8: 157.18, fevers: 159.4, joint: 160.4, head: 161.4, temp: 162.9, herbs: 163.9,
  // S9 · "folk superstition … real medicine … This was the medicine."
  s9: 166.1, folk: 166.2, real: 168.6, medicine: 169.7,
  // S10 · "sounds strangest to a modern ear"
  s10: 171.49, ear: 173.0, q: 173.5, dive: 173.7, s11: 174.6,
  // S11 · skin
  sealedTag: 176.7, morph: 178.5, porousTag: 179.3, pulse: 180.4, both: 182.5,
  // S12 · "Heat opened those openings wider … changed what could pass through"
  heat: 183.8, wider: 184.6, pull: 185.4, cloth: 187.5, flows: 189.1, end: 190.39,
};

const HUM = {blood: C.oxblood, phlegm: C.paperDark, yellow: C.caution, black: C.ink};

// ---------- local helpers ----------
const dropPath = 'M0 -26 C 6 -12 18 -2 18 12 A18 18 0 0 1 -18 12 C -18 -2 -6 -12 0 -26 Z';
const Drop: React.FC<{x: number; y: number; s?: number; color: string; o?: number}> = ({x, y, s = 1, color, o = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d={dropPath} fill={color} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={-6} cy={10} rx={4} ry={7} fill={C.paperLight} opacity={0.5} />
  </g>
);

/** Wheel state shared by S2–S4 so the three shots are one continuous world. */
const wheelView = (t: number) => ({
  s: keys(t, [[125.4, 1.2], [129.37, 1.3], [132.4, 1.3], [134.0, 0.96]]),
  y: keys(t, [[125.4, 540], [129.37, 548], [132.4, 548], [134.0, 596]]),
});

// S2 · 122.48 · "Medieval medicine didn't have germs. It had humors."
export const S2: React.FC<{t: number}> = ({t}) => {
  const gp = ramp(t, T.germ - 0.1, T.germ + 0.4, ease.outBack);
  const gOut = ramp(t, 124.55, 125.0);
  const w = wheelView(125.4);
  const xs = [820, 900, 1020, 1100];
  const cols = [HUM.blood, HUM.phlegm, HUM.yellow, HUM.black];
  const wp = ramp(t, 125.0, 125.7, ease.out);
  return (
    <Stage bg={C.paperShade}>
      <Kicker x={960} y={170} text="Medieval medicine" p={ramp(t, 122.4, 122.9)} />
      {/* germ: dashed outline = an idea that wasn't there */}
      <g transform={`translate(960 ${560 + (1 - gp) * 30}) rotate(-18) scale(${2.4 * gp * (1 - gOut * 0.6)})`} opacity={gp * (1 - gOut)}>
        <rect x={-60} y={-24} width={120} height={48} rx={24} fill="none" stroke={C.theory} strokeWidth={5} strokeDasharray="14 10" />
        {[-34, -12, 12, 34].map((dx, i) => (
          <circle key={i} cx={dx} cy={(i % 2 ? 6 : -6)} r={4} fill="none" stroke={C.theory} strokeWidth={3} strokeDasharray="4 4" />
        ))}
        {[-1, 1].map((d) => (
          <path key={d} d={`M${d * 60} 0 q${d * 24} -18 ${d * 40} 6`} fill="none" stroke={C.theory} strokeWidth={4} strokeDasharray="8 8" />
        ))}
      </g>
      <g opacity={1 - gOut}>
        <CrossOut x={960} y={540} size={300} p={ramp(t, T.cross, T.cross + 0.5, ease.out)} color={C.caution} />
      </g>
      {/* four drops fall into the centre → wheel */}
      {xs.map((x, i) => {
        const d0 = T.humors + i * 0.1;
        const k = ramp(t, d0, d0 + 0.55, ease.in);
        const o = 1 - ramp(t, 125.0, 125.4);
        return t > d0 ? <Drop key={i} x={lerp(x, 960, k)} y={lerp(-60, 540, k)} s={1.5} color={cols[i]} o={o * clamp01((t - d0) * 12)} /> : null;
      })}
      <HumorWheel x={960} y={w.y} s={w.s * wp} reveal={[0, 0, 0, 0]} axesP={0} balance={0.6} p={wp} t={t} />
    </Stage>
  );
};

// S3 · 125.40 · "Four of them: blood, phlegm, yellow bile, and black bile."
export const S3: React.FC<{t: number}> = ({t}) => {
  const w = wheelView(t);
  const r = (c: number) => ramp(t, c - 0.1, c + 0.55, ease.out);
  return (
    <Stage bg={C.paperShade}>
      <HumorWheel x={960} y={w.y} s={w.s} reveal={[r(T.blood), r(T.phlegm), r(T.yellow), r(T.black)]} axesP={0} balance={0.6} t={t} />
      <Kicker x={960} y={110} text="The four humors" p={ramp(t, 125.6, 126.2)} />
    </Stage>
  );
};

// S4 · 129.37 · "Health was balance … hot and cold, wet and dry."
export const S4: React.FC<{t: number}> = ({t}) => {
  const w = wheelView(t);
  const bal = 0.6 + 0.4 * ramp(t, T.balance - 0.1, T.balance + 1.0, ease.outBack);
  const gx = keys(t, [[T.ghost, 1500], [T.ghostEnd, 1000]]);
  const go = win(t, T.ghost, T.ghostEnd, 0.4, 0.8) * 0.5;
  return (
    <Stage bg={C.paperShade}>
      <HumorWheel x={960} y={w.y} s={w.s} axesP={ramp(t, T.axes, T.axesEnd)} balance={bal} t={t} />
      {go > 0 && (
        <g transform={`translate(${gx} ${300 + Math.sin(t * 2) * 12}) rotate(${(t - T.ghost) * 14}) scale(1.4)`} opacity={go}>
          <rect x={-40} y={-16} width={80} height={32} rx={16} fill="none" stroke={C.theory} strokeWidth={4} strokeDasharray="10 8" />
        </g>
      )}
      <Headline x={960} y={150} text="Health = balance" p={ramp(t, T.balance - 0.1, T.balance + 0.8)} size={84} color={C.oxblood} />
    </Stage>
  );
};

// S5 · 137.00 · "heat and moisture weren't just sensations… forces"
export const S5: React.FC<{t: number}> = ({t}) => {
  const bx = 1330, by = 1010;
  const lvl = (a: number, b: number) => lerp(a, b, ramp(t, T.forces + 0.3, T.settle, ease.inOut));
  const levels = [lvl(0.5, 0.82), lvl(0.5, 0.78), lvl(0.5, 0.5), lvl(0.5, 0.2)];
  const cols = [HUM.blood, HUM.phlegm, HUM.yellow, HUM.black];
  const names = ['Blood', 'Phlegm', 'Yellow bile', 'Black bile'];
  const heatIn = ramp(t, T.arrive, T.arrive + 0.7, ease.out);
  const push = ramp(t, T.forces - 0.1, T.forces + 0.7, ease.out);
  const wob = Math.sin(t * 5) * 6 * (1 - push);
  return (
    <Stage bg={C.paper}>
      <Kicker x={960} y={130} text="Not sensations" p={ramp(t, 137.2, 137.8)} />
      <BodyOutline x={bx} y={by} s={1.3} t={t} />
      {/* four vials in the torso */}
      {cols.map((c, i) => {
        const vx = bx - 51 + i * 34, vy = 330;
        const h = 120 * levels[i];
        return (
          <g key={i} opacity={ramp(t, 137.3 + i * 0.1, 137.9 + i * 0.1)}>
            <rect x={vx - 13} y={vy} width={26} height={120} rx={8} fill={C.paperLight} stroke={C.ink} strokeWidth={3} />
            <rect x={vx - 10} y={vy + 120 - h - 3} width={20} height={h} rx={5} fill={c} />
          </g>
        );
      })}
      {/* heat + moisture arrive from the left */}
      <g transform={`translate(${lerp(-200, 360, heatIn) + wob} 0)`} opacity={ramp(t, T.arrive, T.arrive + 0.3) * (1 - push * 0.0)}>
        <Icon name="flame" x={0} y={430} s={2.1} accent={C.oxblood} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${70} ${400 + i * 34} q 18 -14 36 0 t 36 0 t 36 0`} fill="none" stroke={C.oxblood} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        ))}
        <Icon name="drop" x={20} y={650} s={1.9} color={C.water} accent={C.waterDeep} />
        {[0, 1, 2].map((i) => (
          <Drop key={i} x={90 + i * 46} y={640 + ((t * 40 + i * 20) % 30)} s={0.8} color={C.water} />
        ))}
      </g>
      <Arrow from={{x: 520, y: 450}} to={{x: 1190, y: 450}} p={push} color={C.oxblood} width={10} head={30} />
      <Arrow from={{x: 520, y: 650}} to={{x: 1190, y: 520}} p={push} color={C.waterDeep} width={10} head={30} />
      {/* vial labels */}
      {names.map((n, i) => (
        <text key={n} x={bx - 78 + i * 52} y={by + 410} textAnchor="middle" fontFamily={FONT_SERIF} fontSize={22} fontWeight={600} fill={C.inkMute} opacity={ramp(t, 138.4, 139) * 0} />
      ))}
      <Tag x={760} y={900} text="Forces, not feelings" kind="theory" p={ramp(t, T.forces + 0.2, T.forces + 0.8)} anchor="center" />
    </Stage>
  );
};

// ---- tick row for prescription card
const Tick: React.FC<{x: number; y: number; p: number}> = ({x, y, p}) => (
  <path d={`M${x - 14} ${y} l11 12 l22 -26`} fill="none" stroke={C.evidence} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round"
    strokeDasharray={60} strokeDashoffset={60 * (1 - ease.out(clamp01(p)))} opacity={p > 0 ? 1 : 0} />
);

// S8 · 157.18 · "Physicians prescribed baths for fevers, joint pain, headaches…"
export const S8: React.FC<{t: number}> = ({t}) => {
  const rows: [string, number][] = [['Fevers', T.fevers], ['Joint pain', T.joint], ['Headaches', T.head]];
  const temp = keys(t, [[T.temp - 0.2, 0.3], [T.temp + 0.5, 0.85], [T.temp + 1.1, 0.55]]);
  const hx = 1330, hy = 800;
  return (
    <Stage bg={C.paperShade}>
      <Card x={600} y={540} w={640} h={640} p={ramp(t, 157.3, 157.9, ease.out)} rot={-1.5} fill={C.paperLight}>
        <text x={50} y={96} fontFamily={FONT_SERIF} fontWeight={700} fontSize={44} fill={C.ink}>Bath prescribed for</text>
        <line x1={50} y1={122} x2={590} y2={122} stroke={C.ink} strokeWidth={3} />
        {rows.map(([label, c], i) => (
          <g key={label} opacity={ramp(t, 158.2 + i * 0.12, 158.8 + i * 0.12)}>
            <text x={100} y={240 + i * 130} fontFamily={FONT_SERIF} fontSize={54} fontWeight={600} fill={C.ink}>{label}</text>
            <Tick x={52} y={228 + i * 130} p={ramp(t, c - 0.15, c + 0.35)} />
            <line x1={50} y1={266 + i * 130} x2={590} y2={266 + i * 130} stroke={C.paperDark} strokeWidth={2} strokeDasharray="6 8" />
          </g>
        ))}
        <circle cx={540} cy={560} r={34} fill="none" stroke={C.oxblood} strokeWidth={4} opacity={ramp(t, 158.8, 159.3) * 0.0} />
      </Card>
      {/* tub */}
      <g opacity={ramp(t, 157.6, 158.3)}>
        <rect x={hx - 270} y={hy - 220} width={540} height={230} rx={22} fill={C.wood} />
        <rect x={hx - 270} y={hy - 220} width={540} height={26} rx={12} fill={C.woodLight} />
        {[-180, -60, 60, 180].map((dx) => <rect key={dx} x={hx + dx - 3} y={hy - 200} width={6} height={210} fill={C.woodDark} opacity={0.5} />)}
        <rect x={hx - 270} y={hy - 120} width={540} height={12} fill={C.metal} />
        <rect x={hx - 270} y={hy - 30} width={540} height={12} fill={C.metal} />
        <rect x={hx - 250} y={hy - 220} width={500} height={20} rx={10} fill={C.water} />
        <Ripples t={t} x={hx} y={hy - 210} r={90} sy={0.22} color={C.paperLight} n={2} />
        <Steam t={t} x={hx} y={hy - 230} w={300} h={260} strength={1} />
      </g>
      {/* herb sprigs drop in */}
      {[0, 1, 2].map((i) => {
        const d0 = T.herbs + i * 0.14;
        const k = ramp(t, d0, d0 + 0.5, ease.in);
        const splash = ramp(t, d0 + 0.5, d0 + 1.1, ease.out);
        return t > d0 ? (
          <g key={i} transform={`translate(${hx - 110 + i * 110 + Math.sin(t * 2 + i) * 4 * splash} ${lerp(hy - 560, hy - 210, k)}) rotate(${-30 + i * 30})`} opacity={1 - ramp(t, d0 + 1.6, d0 + 2.2) * 0.0}>
            <path d="M0 0 q-6 -34 0 -60" stroke={C.evidence} strokeWidth={5} fill="none" strokeLinecap="round" />
            {[-48, -32, -16].map((yy, j) => (
              <g key={j}>
                <ellipse cx={-12} cy={yy} rx={13} ry={6} fill={C.evidenceLight} transform={`rotate(-30 -12 ${yy})`} />
                <ellipse cx={12} cy={yy - 6} rx={13} ry={6} fill={C.evidence} transform={`rotate(30 12 ${yy - 6})`} />
              </g>
            ))}
          </g>
        ) : null;
      })}
      <Ripples t={t - T.herbs} x={hx} y={hy - 210} r={150} sy={0.2} color={C.paperLight} n={2} period={1.6} />
      {/* thermometer */}
      <g transform={`translate(${hx + 360} ${hy - 60})`} opacity={ramp(t, 162.2, 162.8)}>
        <rect x={-14} y={-300} width={28} height={290} rx={14} fill={C.paperLight} stroke={C.ink} strokeWidth={4} />
        <circle cx={0} cy={0} r={30} fill={C.paperLight} stroke={C.ink} strokeWidth={4} />
        <circle cx={0} cy={0} r={20} fill={C.oxblood} />
        <rect x={-6} y={-8 - 270 * temp} width={12} height={8 + 270 * temp} rx={6} fill={C.oxblood} />
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={20} x2={36} y1={-50 - i * 55} y2={-50 - i * 55} stroke={C.ink} strokeWidth={3} />)}
      </g>
      <Kicker x={600} y={160} text="Medicine, prescribed" p={ramp(t, 157.5, 158.1)} />
    </Stage>
  );
};

// S9 · 166.10 · "This wasn't folk superstition… This was the medicine."
export const S9: React.FC<{t: number}> = ({t}) => {
  const out = ramp(t, T.real - 0.1, T.real + 0.8, ease.inOut);
  const cin = ramp(t, T.folk, T.folk + 0.7, ease.out);
  const book = ramp(t, T.real, T.real + 0.9, ease.out);
  return (
    <Stage bg={C.paper}>
      {/* folk charm: string of herbs + amulet, plum dashed */}
      <g transform={`translate(${lerp(-80, 560, cin) - out * 900} 360)`} opacity={cin}>
        <g fill="none" stroke={C.theory} strokeWidth={5} strokeDasharray="12 10" strokeLinecap="round">
          <path d="M-140 -120 Q0 -60 140 -120" />
          <path d="M0 -90 L0 90" />
          <circle cx={0} cy={140} r={50} />
          <path d="M-18 140 l18 -26 l18 26 l-18 26 z" />
        </g>
        {[-110, -60, 60, 110].map((dx, i) => (
          <g key={i} transform={`translate(${dx} ${-100 + (Math.abs(dx) < 80 ? 22 : 0)}) rotate(${dx > 0 ? 18 : -18})`}>
            <ellipse cx={0} cy={30} rx={10} ry={26} fill="none" stroke={C.theory} strokeWidth={4} strokeDasharray="8 8" />
          </g>
        ))}
        <text x={0} y={260} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontSize={32} fill={C.theory}>Folk superstition</text>
      </g>
      {/* big university medical book */}
      <g transform={`translate(960 ${lerp(1250, 470, book)})`} opacity={book > 0 ? 1 : 0}>
        <OpenBook x={0} y={0} s={1.35} p={1} lines={5} leftTitle="Medicina" />
        <g transform="translate(300 -10) scale(0.34)">
          <rect x={-250} y={-250} width={500} height={500} fill={C.paperLight} />
          <HumorWheel x={0} y={0} s={0.7} t={t} />
        </g>
      </g>
      <Headline x={960} y={900} text="This was the medicine." p={ramp(t, T.medicine - 0.1, T.medicine + 0.7)} size={96} accent={{medicine: C.oxblood, 'medicine.': C.oxblood}} mode="words" />
    </Stage>
  );
};

// ---------- the bather (profile, linen shift). Origin = shoulder top.
const Bather: React.FC<{x: number; y: number; s: number; t: number; night?: boolean; steam?: number}> = ({x, y, s, t, night, steam = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* tub back */}
    <rect x={-360} y={95} width={720} height={250} rx={26} fill={night ? C.woodDark : C.wood} />
    {/* neck, head */}
    <rect x={20} y={-70} width={56} height={90} fill={C.skin[1]} />
    <circle cx={64} cy={-120} r={58} fill={C.skin[1]} />
    <path d="M6 -130 Q10 -190 70 -184 Q126 -176 120 -120 Q80 -140 44 -112 Z" fill={C.paperLight} />
    <circle cx={92} cy={-116} r={4} fill={C.ink} />
    {/* shoulders: skin sliver at the top, linen shift covering the rest */}
    <path d="M-170 70 Q-150 -4 -30 -10 L90 0 Q140 10 170 70 Z" fill={C.skin[1]} />
    <path d="M-176 78 Q-150 22 -60 26 Q0 36 60 24 Q140 24 176 78 L176 140 L-176 140 Z" fill={C.paperLight} />
    <path d="M-176 78 Q-150 22 -60 26" fill="none" stroke={C.paperDark} strokeWidth={3} />
    {/* water & tub front */}
    <path d={`M-340 118 Q-170 ${108 + Math.sin(t * 2) * 3} 0 118 T340 118 L340 340 L-340 340 Z`} fill={C.water} opacity={0.88} />
    <rect x={-380} y={92} width={760} height={30} rx={14} fill={night ? C.woodDark : C.woodLight} />
    <rect x={-380} y={210} width={760} height={14} fill={C.metal} />
    {steam > 0 && <Steam t={t} x={-100} y={90} w={300} h={220} strength={steam} />}
  </g>
);

// S10 · 171.49 · "…the part that sounds strangest to a modern ear." — ink, ear + ?, dive to the shoulder
export const S10: React.FC<{t: number}> = ({t}) => {
  const earIn = ramp(t, T.s10 + 0.2, T.s10 + 0.8, ease.out);
  const gone = ramp(t, T.dive, T.dive + 0.5);
  const k = ramp(t, T.dive, 174.7, ease.in);
  const sc = lerp(0.2, 14, k);
  const reveal = ramp(t, T.dive, T.dive + 0.5, ease.out);
  return (
    <Stage bg={C.ink}>
      <g opacity={1 - gone} transform={`translate(0 ${-gone * 40})`}>
        <Icon name="ear" x={900} y={500} s={5} color={C.paperLight} accent={C.paperDark} knock={C.ink} p={earIn} />
        <QuestionMark x={1130} y={380} size={190} p={ramp(t, T.q, T.q + 0.5)} t={t} color={C.paperLight} />
      </g>
      <g opacity={reveal} clipPath="url(#s10clip)">
        <rect x={0} y={0} width={1920} height={1080} fill={C.paperShade} />
        <Bather x={960} y={540} s={sc} t={t} />
      </g>
      <defs>
        <clipPath id="s10clip"><circle cx={960} cy={540} r={lerp(60, 1500, ramp(t, T.dive, 174.3, ease.out))} /></clipPath>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill={C.skin[1]} opacity={ramp(t, 174.25, 174.6)} />
    </Stage>
  );
};

// S11 · 174.60 · skin as a sealed barrier → porous
export const S11: React.FC<{t: number}> = ({t}) => {
  const sealed = 1 - ramp(t, T.morph, T.morph + 1.2, ease.inOut);
  const open = ramp(t, T.morph, T.morph + 1.2) * 0.35;
  const mid = t > T.porousTag - 0.2;
  const kk = mid ? 'HOW THEY SAW IT' : 'HOW WE SEE SKIN';
  const flow = ramp(t, T.both, T.both + 0.9, ease.out);
  const S = 1.3, SY = 560, gap = 1400 / 9;
  const ax = (i: number) => 960 + S * (-700 + gap * (i + 0.5));
  const arrows: [number, boolean][] = [[1, true], [4, false], [7, true]];
  return (
    <Stage bg={C.paper}>
      <Kicker x={960} y={110} size={32} text={kk} p={t < T.porousTag - 0.2 ? ramp(t, 174.9, 175.5) * (1 - ramp(t, 179.0, 179.2)) : ramp(t, T.porousTag - 0.1, T.porousTag + 0.5)} color={mid ? C.oxblood : C.inkMute} />
      <Tag x={960} y={180} size={36} anchor="center" text="A sealed barrier" kind="ink" p={ramp(t, T.sealedTag, T.sealedTag + 0.6) * (1 - ramp(t, 179.0, 179.3))} />
      <Tag x={960} y={180} size={36} anchor="center" text="Porous" kind="theory" p={ramp(t, T.porousTag, T.porousTag + 0.6)} />
      <PoreSkin x={960} y={SY} s={S} sealed={sealed} open={open} flowOut={flow} flowIn={flow} t={t} p={ramp(t, 174.6, 175.2)} />
      {arrows.map(([i, up], k) => {
        const p = ramp(t, T.both + k * 0.25, T.both + k * 0.25 + 0.6, ease.out);
        const from = up ? {x: ax(i), y: SY + 150} : {x: ax(i), y: SY - 190};
        const to = up ? {x: ax(i), y: SY - 190} : {x: ax(i), y: SY + 150};
        return (
          <g key={i}>
            <Arrow from={from} to={to} p={p} color={C.paper} width={16} head={42} />
            <Arrow from={from} to={to} p={p} color={up ? C.evidence : C.oxblood} width={8} head={34} />
          </g>
        );
      })}
    </Stage>
  );
};

// S12 · 183.74 · heat opens the pores; pull back to the bather's shoulder
export const S12: React.FC<{t: number}> = ({t}) => {
  const heat = ramp(t, T.heat, T.heat + 1.0);
  const open = lerp(0.35, 1, ramp(t, T.wider - 0.1, T.wider + 0.9, ease.out));
  const pk = ramp(t, T.pull, T.pull + 1.3, ease.inOut);
  const s = lerp(1.3, 0.52, pk);
  const sy = lerp(560, 440, pk);
  const cloth = ramp(t, T.cloth - 0.1, T.cloth + 1.0, ease.inOut);
  const flows = ramp(t, T.flows, T.flows + 0.9, ease.out);
  const lensW = 1400 * s;
  return (
    <Stage bg={C.paper}>
      <g opacity={pk}>
        <rect x={0} y={0} width={1920} height={1080} fill={C.paperShade} />
        <Bather x={960} y={400} s={1.6} t={t} steam={0.6} />
      </g>
      <PoreSkin x={960} y={sy} s={s} sealed={0} open={open} heat={heat} flowOut={flows} flowIn={flows} t={t} />
      {pk > 0 && <rect x={960 - lensW / 2 - 8} y={sy - 8} width={lensW + 16} height={300 * s + 16} rx={20} fill="none" stroke={C.ink} strokeWidth={5} opacity={pk} />}
      {/* cloth wiping the surface */}
      {cloth > 0 && cloth < 1 && (
        <g transform={`translate(${lerp(960 - lensW / 2 - 60, 960 + lensW / 2 + 60, cloth)} ${sy - 18 + Math.sin(cloth * 14) * 4}) rotate(${Math.sin(cloth * 9) * 6})`}>
          <rect x={-70} y={-28} width={140} height={46} rx={18} fill={C.paperLight} stroke={C.ink} strokeWidth={4} />
          <path d="M-50 -10 h100 M-50 4 h80" stroke={C.paperDark} strokeWidth={3} />
        </g>
      )}
    </Stage>
  );
};
