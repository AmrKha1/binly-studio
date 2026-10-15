// Custom shots for C06 (builder-owned): "So what killed the bathhouse?"
import React from 'react';
import {Stage, Cam, breathe} from '../../../kit/stage';
import {C, FONT_SERIF, FONT_SANS} from '../../../kit/theme';
import {camAt, clamp01, ease, lerp, ramp, rand, win} from '../../../kit/anim';
import {Headline, Kicker, Tag, HandNote} from '../../../kit/text';
import {Card, DocumentPage, OpenBook} from '../../../kit/cards';
import {Icon} from '../../../kit/icons';
import {Person} from '../../../kit/people';
import {Germ} from '../../../kit/science';
import {Banner, Bathtub, Bench, Chair, CitySkyline, Door, Lantern} from '../../../kit/env';
import {Pulse, Steam} from '../../../kit/fx';
import {Miasma} from '../shared/Miasma';

// ---------------------------------------------------------------- cues
const T = {
  // S1 [382.32] "So now you'd expect the obvious ending."
  s1: 382.32,
  kick: 382.6,
  plague: 384.8, // "The Black Death hits."
  doctor: 386.1, // "Doctors warn against bathing."
  door: 387.62, // "The bathhouses close."
  dirty: 389.06, // "Europe stops bathing and stays dirty"
  strike: 392.75, // "Except that's not what happened."
  note: 393.2,
  // S2 [394.16]
  y1349: 395.4, // "1349"
  y1360: 397.5, // "1360"
  gens: 398.62, // "They continued for generations."
  // S3 [400.58]
  food: 400.6, // "They kept serving food."
  barber: 402.0, // "social and medical functions"
  walkIn: 404.4, // "People kept going."
  fog: 405.44, // "The plague changed the calculation"
  clear: 407.3, // "during outbreaks" ... clears
  still: 408.6, // "It didn't end the institution."
  // S6 [417.36]
  s6: 417.36,
  century: 418.9, // "more than a century later"
  pores: 420.3, // "pores"
  decade: 421.6, // lands on 1490s
  // S7 [421.88]
  s7: 421.88,
  endk: 422.2, // "At the very end of the 15th century"
  germ: 423.5, // "a new disease appeared"
  syph: 426.04, // "Syphilis."
  // S10 [443.07]
  s10: 443.07,
  frown: 444.6,
  book: 446.31, // "You can see it in the municipal record."
  // S12 [457.72]
  s12: 457.72,
  slip1: 457.9,
  slip2: 458.4,
  slip3: 462.6, // "laundry"
  // S13 [464.82]
  vague: 464.9, // "vague cultural anxiety"
  pop: 466.6,
  writing: 468.8, // "in writing"
  pull: 471.9, // "contagion"
};

const SIGN_WOOD = C.wood;

// ---------------------------------------------------------------- shared local helpers
/** Medieval house front (flat): stone ground floor, timber upper storey, gabled roof. Origin = bottom-left at street level. */
const House: React.FC<{x: number; w: number; top?: number; stone?: string; roof?: string; seed?: number}> = ({x, w, top = 330, stone = C.stone, roof = C.woodDark, seed = 1}) => {
  const wins: number[] = [];
  const n = Math.max(2, Math.floor(w / 190));
  for (let i = 0; i < n; i++) wins.push(x + (w / n) * (i + 0.5));
  return (
    <g>
      <polygon points={`${x - 20},${top} ${x + w / 2},${top - 150} ${x + w + 20},${top}`} fill={roof} />
      <rect x={x} y={top} width={w} height={820 - top} fill={stone} />
      <rect x={x} y={top} width={w} height={210} fill={C.bone} />
      <rect x={x - 10} y={top + 205} width={w + 20} height={16} fill={C.woodDark} />
      {[0.12, 0.5, 0.88].map((k, i) => (
        <rect key={i} x={x + w * k - 5} y={top} width={10} height={210} fill={C.woodLight} />
      ))}
      <line x1={x} y1={top + 105} x2={x + w} y2={top + 105} stroke={C.woodLight} strokeWidth={8} />
      {wins.map((wx, i) => (
        <g key={i}>
          <rect x={wx - 26} y={top + 28} width={52} height={64} rx={4} fill={C.inkSoft} />
          <rect x={wx - 26} y={top + 28} width={52} height={64} rx={4} fill={rand(seed + i) > 0.5 ? C.lamp : C.inkSoft} opacity={0.35} />
          <line x1={wx} y1={top + 28} x2={wx} y2={top + 92} stroke={C.woodLight} strokeWidth={4} />
        </g>
      ))}
      <rect x={x} y={780} width={w} height={40} fill={C.stoneShade} />
    </g>
  );
};

/** Town backdrop: sky, skyline, ground, cobbles. */
const TownBG: React.FC<{x0: number; x1: number; t: number}> = ({x0, x1, t}) => (
  <g>
    <rect x={x0} y={-300} width={x1 - x0} height={1400} fill={C.paperShade} />
    <CitySkyline era="medieval" layer="far" y={640} x0={x0} x1={x1} t={t} seed={5} />
    <rect x={x0} y={820} width={x1 - x0} height={300} fill={C.stoneShade} />
    <rect x={x0} y={820} width={x1 - x0} height={10} fill={C.stoneDark} opacity={0.5} />
    {Array.from({length: Math.ceil((x1 - x0) / 140)}).map((_, i) => (
      <rect key={i} x={x0 + i * 140 + (i % 2) * 40} y={880 + (i % 3) * 50} width={70} height={10} rx={5} fill={C.stoneDark} opacity={0.35} />
    ))}
  </g>
);

/** Bathhouse sign: wall plate + arm + hanging banner with bath emblem + hanging lantern. Origin = arm height at banner centre. */
const BathSign: React.FC<{x: number; y: number; s?: number; t: number; glow?: number; swing?: number}> = ({x, y, s = 1, t, glow = 1, swing = 1}) => {
  const sw = Math.sin(t * 1.3) * 1.6 * swing;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-250} y={-60} width={26} height={150} rx={6} fill={C.woodDark} />
      <line x1={-236} y1={0} x2={130} y2={0} stroke={C.woodDark} strokeWidth={14} strokeLinecap="round" />
      <path d="M-236 70 L-150 4" stroke={C.woodDark} strokeWidth={9} />
      <g transform={`rotate(${sw} 0 0)`}>
        <Banner kind="hanging" w={170} h={240} color={SIGN_WOOD} emblem="none" x={0} y={0} t={t} />
        <circle cx={0} cy={130} r={56} fill={C.paperLight} />
        <Icon name="bath" x={0} y={130} s={1.05} color={C.ink} accent={C.oxblood} knock={C.paperLight} />
      </g>
      <g transform={`rotate(${-sw * 0.8} -150 0)`}>
        <Lantern x={-150} y={186} chain={40} t={t} glow={glow} lit={glow > 0.04} />
      </g>
    </g>
  );
};

const OpenBoard: React.FC<{x: number; y: number; p: number}> = ({x, y, p}) => (
  <Card x={x} y={y} w={150} h={58} p={p} stroke={C.evidence} fill={C.paperLight} radius={8}>
    <text x={75} y={39} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={28} letterSpacing={4} fill={C.evidence}>
      OPEN
    </text>
  </Card>
);

// ---------------------------------------------------------------- S1
// S1 · 382.32 · "So now you'd expect the obvious ending… Except that's not what happened."
const Panel: React.FC<{x: number; p: number; fill: string; children?: React.ReactNode; rot?: number}> = ({x, p, fill, children, rot = 0}) => (
  <Card x={x} y={570} w={380} h={483} p={p} rot={rot} stroke={C.ink} fill={C.paperLight}>
    <g transform="scale(1.1515)">
      <rect x={16} y={16} width={298} height={388} rx={6} fill={fill} />
      {children}
    </g>
  </Card>
);

export const S1: React.FC<{t: number}> = ({t}) => {
  const xs = [330, 750, 1170, 1590];
  const pTs = [T.plague, T.doctor, T.door, T.dirty];
  const p = pTs.map((a) => ramp(t, a - 0.15, a + 0.7, ease.outQuint));
  const slam = ramp(t, T.door - 0.05, T.door + 0.16, ease.in);
  const doorOpen = 1 - slam;
  const shake = t > T.door + 0.15 ? Math.sin((t - T.door) * 70) * 5 * Math.max(0, 1 - (t - T.door - 0.15) * 4) : 0;
  const strike = ramp(t, T.strike - 0.05, T.strike + 0.45, ease.out);
  const strike2 = ramp(t, T.strike + 0.12, T.strike + 0.6, ease.out);
  const L1 = Math.hypot(1680, 510);
  const flip = (t - T.dirty) * 3.2;
  const out = win(t, 0, 999) * (1 - 0);
  return (
    <Stage bg={C.paperShade}>
      <Kicker x={960} y={178} text="THE OBVIOUS ENDING" size={42} p={ramp(t, T.kick, T.kick + 0.6)} />
      {/* panel 1 · plague: ink town + skull */}
      <Panel x={xs[0]} p={p[0]} fill={C.ink} rot={-1.5}>
        <g opacity={0.9}>
          {[40, 100, 160, 215, 262].map((hx, i) => (
            <g key={i}>
              <polygon points={`${hx - 6},${300 - (i % 2) * 30} ${hx + 28},${250 - (i % 2) * 30} ${hx + 62},${300 - (i % 2) * 30}`} fill={C.inkLift} />
              <rect x={hx} y={300 - (i % 2) * 30} width={56} height={110} fill={C.inkLift} />
            </g>
          ))}
        </g>
        <Miasma x={16} y={200} w={298} h={190} density={0.7} p={ramp(t, T.plague, T.plague + 1.2)} vx={26} dark t={t} seed={3} />
        <Icon name="skull" x={165} y={150} s={2.1 + Math.sin(t * 2) * 0.03} color={C.paperLight} accent={C.oxLight} knock={C.ink} p={ramp(t, T.plague + 0.2, T.plague + 0.8, ease.outBack)} />
      </Panel>
      {/* panel 2 · doctor warns at a tub */}
      <Panel x={xs[1]} p={p[1]} fill={C.paperDeep} rot={1}>
        <rect x={16} y={350} width={298} height={54} fill={C.stone} />
        <Bathtub x={105} y={372} w={170} t={t} kind="wood" />
        <Steam t={t} x={105} y={305} w={110} h={130} n={3} strength={0.6} />
        <Person x={238} y={384} s={0.46} facing={-1} t={t} outfit="robe" hat="beret" pose="point" expression="worried" talk={win(t, T.doctor + 0.2, T.doctor + 1.3) * Math.abs(Math.sin(t * 9))} emote="exclaim" emoteP={ramp(t, T.doctor + 0.5, T.doctor + 0.9)} seed={4} />
      </Panel>
      {/* panel 3 · door slams, lantern out */}
      <Panel x={xs[2]} p={p[2]} fill={C.stone} rot={-0.8}>
        <rect x={16} y={350} width={298} height={54} fill={C.stoneShade} />
        <g transform={`translate(${shake} 0)`}>
          <Door x={150} y={354} w={150} h={250} style="plank" open={doorOpen} inside={C.lamp} />
        </g>
        <Lantern x={262} y={196} chain={20} t={t} lit={t < T.door + 0.2} glow={0.8} />
      </Panel>
      {/* panel 4 · dirty figure, pages flipping */}
      <Panel x={xs[3]} p={p[3]} fill={C.paperDeep} rot={1.3}>
        <Person x={105} y={384} s={0.46} t={t} outfit="peasant" hat="hood" expression="sad" pose="idle" seed={9} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} cx={60 + i * 22 + Math.sin(t * 2 + i) * 4} cy={230 + ((i * 37) % 90) + Math.cos(t * 2.4 + i) * 5} r={4 + (i % 3)} fill={C.woodDark} opacity={0.35} />
        ))}
        <g transform="translate(236 190)">
          <rect x={-46} y={-52} width={92} height={104} rx={8} fill={C.paperLight} stroke={C.ink} strokeWidth={4} />
          <rect x={-46} y={-52} width={92} height={24} rx={8} fill={C.oxblood} />
          {[0, 1, 2].map((i) => {
            const f = (flip + i * 0.33) % 1;
            const sc = Math.cos(f * Math.PI);
            return <rect key={i} x={-34} y={-18 + (sc < 0 ? 0 : 0)} width={68} height={Math.abs(sc) * 56} fill={C.paper} stroke={C.inkMute} strokeWidth={2.5} opacity={0.9 - i * 0.15} />;
          })}
        </g>
      </Panel>
      {/* red-pen strike across all four */}
      <g opacity={strike > 0 ? 1 : 0}>
        <line x1={120} y1={330} x2={1800} y2={840} stroke={C.oxblood} strokeWidth={22} strokeLinecap="round" strokeDasharray={L1} strokeDashoffset={L1 * (1 - strike)} />
        <line x1={120} y1={376} x2={1800} y2={886} stroke={C.oxblood} strokeWidth={9} strokeLinecap="round" strokeDasharray={L1} strokeDashoffset={L1 * (1 - strike2)} opacity={0.9} />
      </g>
      <HandNote x={960} y={985} text="Not what happened" anchor="middle" size={72} rot={-2} p={ramp(t, T.note, T.note + 0.9)} />
    </Stage>
  );
};

// ---------------------------------------------------------------- S2
// S2 · 394.16 · "Bathhouses didn't disappear in 1349… 1360… continued for generations."
const WALK_OUTFITS = ['peasant', 'merchant', 'dress', 'tunic', 'merchant', 'peasant'] as const;

export const S2: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[394, 960, 540, 1.04], [400.6, 1000, 540, 1.1]]), t);
  const plate = ramp(t, T.y1349 - 0.15, T.y1349 + 0.6, ease.outQuint);
  const yr = (() => {
    if (t < T.y1360 - 0.15) return 1349;
    if (t < T.gens) return 1360;
    return 1360 + Math.round(ease.in(clamp01((t - T.gens) / 1.9)) * 70) + Math.round(ease.out(clamp01((t - T.gens) / 2)) * 60);
  })();
  const flipAt = (a: number) => Math.abs(Math.cos(Math.PI * clamp01((t - a) / 0.34)));
  const flipK = t < T.y1360 ? (t > T.y1349 ? 1 : 1) : Math.min(1, flipAt(T.y1360 - 0.17) + (t > T.y1360 + 0.17 ? 1 : 0));
  const spin = ramp(t, T.gens, T.gens + 0.4);
  const frac = (t - T.gens) * 11;
  const walkT = Math.max(0, t - 397.6);
  const xs0 = [1230, 1400, 1570, 1740, 1910, 2080];
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <TownBG x0={-300} x1={2300} t={t} />
        <House x={470} w={720} seed={2} />
        <Door x={760} y={820} w={190} h={300} style="plank" open={0.5} inside={C.lamp} frame={C.woodDark} />
        <Steam t={t} x={1000} y={200} w={220} h={220} n={4} strength={0.7} />
        <BathSign x={1040} y={330} s={1} t={t} glow={1} />
        <OpenBoard x={1040} y={590} p={ramp(t, T.y1349 - 0.1, T.y1349 + 0.5, ease.outBack)} />
        {/* year plate */}
        <Card x={1530} y={340} w={330} h={200} p={plate} fill={C.paperLight} stroke={C.ink}>
          <g transform={`translate(165 100) scale(1 ${Math.max(0.05, flipK)})`}>
            {spin < 0.01 ? (
              <text x={0} y={42} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={124} fill={C.ink}>
                {yr}
              </text>
            ) : (
              [-1, 0, 1].map((k) => {
                const f = frac % 1;
                const off = (k - f) * 120;
                return (
                  <text key={k} x={0} y={42 + off} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={124} fill={C.ink} opacity={Math.max(0, 1 - Math.abs(off) / 110)}>
                    {yr + k}
                  </text>
                );
              })
            )}
          </g>
        </Card>
        {/* townsfolk queue and stream in */}
        {xs0.map((x0, i) => {
          const x = x0 - walkT * 190;
          const go = walkT > 0;
          return (
            <Person
              key={i}
              x={x}
              y={846 + (i % 2) * 14}
              s={0.62}
              facing={-1}
              t={t}
              outfit={WALK_OUTFITS[i]}
              walk={go ? walkT * 1.5 + i : 0}
              hat={i % 3 === 1 ? 'coif' : i % 3 === 2 ? 'hood' : 'none'}
              opacity={ramp(x, 770, 860)}
              seed={20 + i}
            />
          );
        })}
      </Cam>
    </Stage>
  );
};

// ---------------------------------------------------------------- S3
// S3 · 400.58 · "They kept serving food… People kept going… plague changed the calculation… didn't end the institution."
export const S3: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[400.58, 540, 600, 1.25], [T.barber - 0.4, 560, 600, 1.25], [T.barber + 0.5, 1060, 620, 1.35], [T.walkIn - 0.2, 1100, 600, 1.3], [T.walkIn + 1.0, 1650, 560, 1.12], [410, 1670, 560, 1.12]]), t, 0.8);
  const fog = Math.min(ramp(t, T.fog - 0.2, T.fog + 1.4, ease.inOut), 1 - ramp(t, T.clear, T.clear + 1.3, ease.inOut));
  const glow = 1 - 0.9 * fog + 0.12 * ramp(t, T.clear + 0.8, T.clear + 1.4) * (1 - fog);
  const door3 = 0.92 - 0.55 * fog;
  const relight = ramp(t, T.clear + 0.9, T.clear + 1.7);
  // carriers into the left doorway
  const carry = (a: number, prop: 'basket' | 'cup', outfit: 'peasant' | 'dress', i: number) => {
    const k = ramp(t, a, a + 1.9, ease.inOut);
    const x = lerp(170, 470, k);
    return <Person key={i} x={x} y={850} s={0.62} t={t} outfit={outfit} prop={prop} walk={k > 0 && k < 1 ? (t - a) * 1.6 : 0} opacity={1 - ramp(k, 0.82, 1)} pose="carry" seed={30 + i} />;
  };
  const shave = Math.sin(t * 5) * 0.5 + 0.5;
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <TownBG x0={-500} x1={2900} t={t} />
        {/* A · doorway peek */}
        <House x={200} w={600} seed={7} />
        <Door x={480} y={820} w={190} h={300} style="plank" open={0.9} inside={C.lamp} frame={C.woodDark} />
        {carry(T.food, 'basket', 'peasant', 0)}
        {carry(T.food + 0.55, 'cup', 'dress', 1)}
        {/* B · barber shaving + a bather resting */}
        <House x={860} w={400} seed={9} />
        <rect x={900} y={560} width={320} height={260} fill={C.inkSoft} />
        <rect x={900} y={560} width={320} height={260} fill={C.lamp} opacity={0.22} />
        <rect x={890} y={548} width={340} height={16} fill={C.woodDark} />
        <rect x={890} y={780} width={340} height={40} fill={C.woodDark} />
        <Chair x={1040} y={800} h={190} />
        <Person x={1060} y={800} s={0.42} t={t} outfit="tunic" sit={1} beard="short" expression="neutral" hat="none" seed={41} />
        <Person x={1150} y={800} s={0.42} facing={-1} t={t} outfit="merchant" hat="coif" pose="reach" arms={{front: [-40 - shave * 10, 20], back: [10, 10]}} seed={42} />
        <g opacity={ramp(t, T.barber, T.barber + 0.6)}>
          <Bench x={1010} y={830} w={150} h={70} />
        </g>
        {/* C · the bathhouse with its sign */}
        <House x={1300} w={1000} seed={11} />
        <Door x={1900} y={820} w={200} h={300} style="plank" open={door3} inside={C.lamp} frame={C.woodDark} />
        <Steam t={t} x={1700} y={170} w={240} h={220} n={4} strength={0.7} />
        <BathSign x={1560} y={330} t={t} glow={glow} />
        <Pulse x={1410} y={430} r={110} p={relight} color={C.lamp} width={8} />
        <OpenBoard x={1560} y={590} p={ramp(t, T.walkIn - 0.2, T.walkIn + 0.4)} />
        {/* people keep going in */}
        {[0, 1, 2, 3].map((i) => {
          const a = T.walkIn + i * 0.55;
          const k = ramp(t, a, a + 2.6, ease.inOut);
          const x = lerp(2420, 1930, k);
          return <Person key={i} x={x} y={848 + (i % 2) * 14} s={0.62} facing={-1} t={t} outfit={(['merchant', 'peasant', 'dress', 'tunic'] as const)[i]} walk={k > 0 && k < 1 ? (t - a) * 1.5 : 0} opacity={ramp(k, 0, 0.05) * (1 - ramp(k, 0.9, 1))} seed={50 + i} />;
        })}
      </Cam>
      {/* plum fog rolls through the street */}
      <Miasma x={0} y={300} w={1920} h={640} density={0.85} p={fog} from="left" vx={90} t={t} seed={6} opacity={0.95} />
      <Tag x={760} y={190} anchor="center" text="Still standing" size={34} kind="evidence" p={ramp(t, T.still - 0.15, T.still + 0.6)} />
    </Stage>
  );
};

// ---------------------------------------------------------------- S6
// S6 · 417.36 · "The answer arrives more than a century later, and it has much less to do with pores."
export const S6: React.FC<{t: number}> = ({t}) => {
  const k = ramp(t, T.s6 + 0.05, T.decade, ease.outQuint);
  const cy = lerp(1340, 1495, k); // centre year
  const PX = 38;
  const years: number[] = [];
  for (let y = Math.floor(cy - 30); y <= cy + 30; y++) if (y % 5 === 0) years.push(y);
  const land = ramp(t, T.decade - 0.7, T.decade + 0.2);
  const poreP = ramp(t, T.pores - 0.1, T.pores + 0.4);
  const poreOut = ramp(t, T.pores + 0.5, T.pores + 1.3, ease.inOut);
  return (
    <Stage bg={C.paper}>
      <Kicker x={960} y={250} text="MORE THAN A CENTURY LATER" size={44} p={ramp(t, T.century - 0.1, T.century + 0.6)} />
      {/* ribbon */}
      <rect x={0} y={470} width={1920} height={150} fill={C.paperLight} />
      <rect x={0} y={466} width={1920} height={6} fill={C.ink} />
      <rect x={0} y={618} width={1920} height={6} fill={C.ink} />
      <rect x={960 + (1490 - cy) * PX} y={466} width={10 * PX} height={158} fill={C.cautionTint} opacity={0.9 * land} />
      {years.map((y) => {
        const x = 960 + (y - cy) * PX;
        const dec = y % 10 === 0;
        return (
          <g key={y}>
            <line x1={x} y1={470} x2={x} y2={dec ? 530 : 505} stroke={C.ink} strokeWidth={dec ? 5 : 3} />
            {dec && (
              <text x={x} y={590} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={600} fontSize={48} fill={C.ink}>
                {y}
              </text>
            )}
          </g>
        );
      })}
      <polygon points="960,462 940,424 980,424" fill={C.oxblood} />
      <text x={960} y={410} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={80} fill={C.oxblood} opacity={land} transform={`translate(0 ${(1 - land) * 20})`}>
        1490s
      </text>
      {/* pore icon: small arch in skin, shrinks and fades aside */}
      <g transform={`translate(${lerp(960, 1560, ease.inOut(poreOut))} ${lerp(760, 860, poreOut)}) scale(${(0.2 + 0.8 * ease.outBack(poreP)) * 1.9 * (1 - 0.65 * poreOut)})`} opacity={(1 - poreOut) * clamp01(poreP * 2)}>
        <rect x={-130} y={0} width={260} height={90} rx={10} fill={C.paperDark} />
        <rect x={-130} y={0} width={260} height={22} rx={10} fill={C.paperDeep} />
        <path d="M-40 22 L-40 -2 A40 40 0 0 1 40 -2 L40 22 Z" fill={C.ink} transform="translate(0 6)" />
        <path d="M-40 22 L-40 8 A40 40 0 0 1 40 8 L40 22" fill="none" stroke={C.inkMute} strokeWidth={5} transform="translate(0 0)" />
      </g>
      <Steam t={t} x={960} y={805} w={120} h={150} n={3} strength={0.5 * (1 - poreOut) * poreP} />
    </Stage>
  );
};

// ---------------------------------------------------------------- S7
// S7 · 421.88 · "At the very end of the 15th century, a new disease appeared in Europe. Syphilis."
export const S7: React.FC<{t: number}> = ({t}) => {
  const g = ramp(t, T.germ - 0.1, T.germ + 1.8, ease.outQuint);
  const void_ = ramp(t, T.s7, T.germ + 0.5, ease.out);
  const uncoil = (1 - g) * 140;
  return (
    <Stage bg={C.ink}>
      <Miasma x={0} y={0} w={1920} h={1080} density={0.35} p={ramp(t, T.s7, T.germ)} from="right" vx={30} dark t={t} seed={8} opacity={0.6} />
      <circle cx={1300} cy={540} r={430 * void_} fill={C.inkSoft} />
      <circle cx={1300} cy={540} r={300 * void_} fill={C.inkLift} opacity={0.6} />
      <Kicker x={140} y={210} anchor="start" text="END OF THE 15TH CENTURY" size={40} color={C.paperShade} p={ramp(t, T.endk, T.endk + 0.7)} />
      <g transform={`rotate(${-uncoil} 1300 540)`} opacity={clamp01(g * 3)}>
        <Germ x={1300} y={540} s={3.2 * (0.25 + 0.75 * g)} kind="spiral" color={C.oxLight} shade={C.oxblood} seed={3} t={t} />
      </g>
      <Headline x={140} y={560} anchor="start" text="Syphilis" size={150} color={C.oxLight} mode="rise" p={ramp(t, T.syph - 0.1, T.syph + 0.9)} />
    </Stage>
  );
};

// ---------------------------------------------------------------- S10
// S10 · 443.07 · "The combination changed how some authorities viewed the bathhouse. You can see it in the municipal record."
export const S10: React.FC<{t: number}> = ({t}) => {
  const walk = ramp(t, T.s10, T.frown - 0.3, ease.out);
  const push = ramp(t, T.book + 0.35, 447.95, ease.inOut);
  const cam = {cx: lerp(960, 1290, push), cy: lerp(540, 640, push), z: lerp(1.05, 2.9, push), r: 0};
  const bookP = ramp(t, T.book - 0.1, T.book + 0.8, ease.outQuint);
  const frown = ramp(t, T.frown - 0.3, T.frown + 0.3);
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={breathe(cam, t, 0.7)}>
        <TownBG x0={-300} x1={2300} t={t} />
        <House x={160} w={760} seed={13} />
        <Door x={540} y={820} w={190} h={300} style="plank" open={0.5} inside={C.lamp} frame={C.woodDark} />
        <BathSign x={700} y={330} t={t} glow={1} />
        <Person
          x={lerp(1650, 1230, walk)}
          y={860}
          s={0.95}
          facing={-1}
          t={t}
          outfit="robe"
          hat="beret"
          accent={C.oxblood}
          top={C.inkSoft}
          pose={frown > 0.5 ? 'handsOnHips' : 'idle'}
          walk={walk > 0 && walk < 1 ? t * 1.2 : 0}
          look={-0.6}
          tilt={-6 * frown}
          expression={frown > 0.5 ? 'angry' : 'neutral'}
          seed={60}
        />
        <g transform={`translate(0 ${(1 - bookP) * 520})`} opacity={clamp01(bookP * 3)}>
          <OpenBook x={1290} y={640} s={1} p={1} leftTitle="Council record" lines={7} />
        </g>
      </Cam>
    </Stage>
  );
};

// ---------------------------------------------------------------- S12 / S13 (same document world)
const SLIPS = [
  {text: 'Infected: stay away from inns & bathhouses', y: 360, at: T.slip1},
  {text: 'Barbers & surgeons: no infected bathers', y: 560, at: T.slip2},
  {text: 'Rules for contaminated laundry', y: 760, at: T.slip3},
];

const Slip: React.FC<{text: string; y: number; p: number}> = ({text, y, p}) => {
  const words = text.split(' ');
  const mid = Math.ceil(words.length / 2);
  const l1 = words.slice(0, mid).join(' ');
  const l2 = words.slice(mid).join(' ');
  return (
    <Card x={1380} y={y} w={640} h={150} p={p} fill={C.paperLight} rot={y === 560 ? 0.8 : -0.6}>
      <rect x={0} y={0} width={14} height={150} rx={6} fill={C.evidence} />
      <circle cx={600} cy={24} r={9} fill={C.oxblood} />
      <text x={44} y={l2 ? 70 : 88} fontFamily={FONT_SERIF} fontSize={36} fontWeight={600} fill={C.ink}>
        {l1}
      </text>
      {l2 && (
        <text x={44} y={116} fontFamily={FONT_SERIF} fontSize={36} fontWeight={600} fill={C.ink}>
          {l2}
        </text>
      )}
    </Card>
  );
};

const ZurichWorld: React.FC<{t: number; write: number; hl: boolean}> = ({t, write, hl}) => (
  <g>
    <DocumentPage
      x={620}
      y={520}
      s={1.05}
      p={ramp(t, T.s12 - 0.1, T.s12 + 0.7, ease.outQuint)}
      rot={-1.2}
      title="Zurich council · 1496"
      lines={9}
      seal
      sealColor={C.evidence}
      signature
      style="parchment"
      write={write}
      highlight={hl ? {line: t > 461.3 ? 5 : 3, p: ramp(t, t > 461.3 ? 461.2 : 459.6, t > 461.3 ? 461.8 : 460.2), color: C.cautionLight} : undefined}
    />
    {SLIPS.map((s, i) => (
      <Slip key={i} text={s.text} y={s.y} p={ramp(t, s.at - 0.1, s.at + 0.7, ease.outQuint)} />
    ))}
  </g>
);

// S12 · 457.72 · "Barbers and surgeons were restricted… contaminated laundry."
export const S12: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[457, 960, 540, 1.03], [465, 980, 540, 1.0]]), t, 0.6);
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        <ZurichWorld t={t} write={ramp(t, T.s12 + 0.1, T.s12 + 2.4, ease.out)} hl />
      </Cam>
      <Kicker x={620} y={985} text="PARAPHRASED" size={24} p={ramp(t, T.slip1 + 0.3, T.slip1 + 1)} />
    </Stage>
  );
};

/** Town plan, top view (flat). Origin = centre. */
const TownPlan: React.FC<{t: number; p: number; ring: number}> = ({t, p, ring}) => {
  const blocks: React.ReactElement[] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 6; c++) {
      if (r === 1 && c === 3) continue;
      blocks.push(
        <rect key={`${r}${c}`} x={-345 + c * 118 + rand(r * 7 + c) * 8} y={-215 + r * 112 + rand(c * 5 + r) * 8} width={92} height={78} rx={6} fill={(r + c) % 3 === 0 ? C.stone : C.boneShade} stroke={C.stoneDark} strokeWidth={2} />
      );
    }
  return (
    <g opacity={clamp01(p * 2)} transform={`translate(0 ${(1 - ease.out(p)) * 40})`}>
      <rect x={-400} y={-270} width={800} height={540} rx={20} fill={C.paperLight} stroke={C.ink} strokeWidth={4} />
      <path d="M-400 215 C-250 150 -120 245 40 205 S 300 160 400 215 L400 270 L-400 270 Z" fill={C.paperDark} opacity={0.7} />
      {blocks}
      {/* the bathhouse block */}
      <rect x={-345 + 3 * 118 - 8} y={-215 + 112 - 6} width={108} height={92} rx={8} fill={C.wood} stroke={C.ink} strokeWidth={4} />
      <Icon name="bath" x={-345 + 3 * 118 + 46} y={-215 + 112 + 40} s={0.8} color={C.paperLight} accent={C.paperLight} knock={C.wood} />
      <circle cx={-345 + 3 * 118 + 46} cy={-215 + 112 + 40} r={88 + Math.sin(t * 3) * 3} fill="none" stroke={C.oxblood} strokeWidth={9} strokeDasharray={`${560 * ring} 600`} />
      <Pulse x={-345 + 3 * 118 + 46} y={-215 + 112 + 40} r={95} p={ring > 0.99 ? (((t - T.pull - 1) % 1.6) / 1.6) : 0} />
    </g>
  );
};

// S13 · 464.82 · "This wasn't just vague cultural anxiety. It was a government, in writing… point of contagion."
export const S13: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, [[464, 980, 540, 1.0], [T.pull - 0.1, 980, 540, 1.0], [T.pull + 1.9, 1500, 545, 0.78]]);
  const cloudIn = ramp(t, T.vague - 0.1, T.vague + 0.7, ease.out);
  const popK = ramp(t, T.pop, T.pop + 0.5);
  const cy = lerp(215, 150, ramp(t, T.vague, T.pop)) + Math.sin(t * 2.2) * 5;
  const cloudS = 1.35 * (0.4 + 0.6 * cloudIn) * (1 + 0.12 * ramp(t, T.pop - 0.25, T.pop));
  const cloud = 'M-120 40 C-170 40 -175 -20 -125 -28 C-125 -80 -60 -85 -40 -55 C-10 -100 70 -90 80 -45 C130 -50 165 -5 130 25 C150 60 105 70 80 55 C50 75 -10 72 -30 55 C-60 70 -110 70 -120 40 Z';
  const sealPulse = ramp(t, T.writing, T.writing + 1.0);
  const ring = ramp(t, T.pull + 0.5, T.pull + 1.6, ease.out);
  return (
    <Stage bg={C.paper}>
      <Cam cam={cam}>
        <ZurichWorld t={t} write={1} hl={false} />
        {/* the vague cloud: floats up, pops */}
        {popK < 1 && (
          <g transform={`translate(1380 ${cy}) scale(${cloudS})`} opacity={cloudIn * (1 - popK)}>
            <path d={cloud} fill={C.theoryTint} fillOpacity={0.6} stroke={C.theory} strokeWidth={5} strokeDasharray="14 10" />
            <text x={0} y={22} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontSize={34} fill={C.theory}>
              vague anxiety
            </text>
          </g>
        )}
        {popK > 0 && popK < 1 && (
          <g>
            <Pulse x={1380} y={150} r={150} p={popK} color={C.theory} />
            {Array.from({length: 8}).map((_, i) => {
              const a = (i / 8) * Math.PI * 2 + 0.3;
              const d = 70 + 120 * ease.out(popK);
              return <circle key={i} cx={1380 + Math.cos(a) * d} cy={150 + Math.sin(a) * d * 0.7} r={9 * (1 - popK)} fill={C.theory} />;
            })}
          </g>
        )}
        <Tag x={620} y={118} anchor="center" text="In writing" kind="evidence" p={ramp(t, T.writing - 0.15, T.writing + 0.6)} />
        <Pulse x={745} y={790} r={70} p={sealPulse} color={C.evidence} />
        {/* town plan beside the document */}
        <g transform="translate(2230 520)">
          <g transform="scale(1.15)"><TownPlan t={t} p={ramp(t, T.pull + 0.1, T.pull + 1.2, ease.outQuint)} ring={ring} /></g>
          <Kicker x={0} y={410} text="POINT OF CONTAGION" size={50} color={C.oxblood} p={ramp(t, T.pull + 1.2, T.pull + 1.9)} />
        </g>
      </Cam>
    </Stage>
  );
};
