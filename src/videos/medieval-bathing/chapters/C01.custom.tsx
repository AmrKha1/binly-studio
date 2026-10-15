// Custom shots for C01 (builder-owned). Each: export const S<n>: React.FC<{t: number}> returning a full <Stage>.
import React from 'react';
import {Stage, Cam, breathe, shake} from '../../../kit/stage';
import {C} from '../../../kit/theme';
import {camAt, clamp01, ease, keys, lerp, noise1, ramp, rand, randRange, stagger, win} from '../../../kit/anim';
import {Headline, Kicker, Tag} from '../../../kit/text';
import {DocumentPage} from '../../../kit/cards';
import {Arrow, Bracket, CheckMark} from '../../../kit/diagrams';
import {LightPool, Particles, Pulse, Steam, Vignette} from '../../../kit/fx';
import {Crowd, Person} from '../../../kit/people';
import {Icon} from '../../../kit/icons';
import {Banner, Door, Lantern, Street} from '../../../kit/env';
import {BodyOutline} from '../../../kit/science';
import {RichText} from '../../../kit/templates';
import {HeroTub, HumorWheel} from '../shared';

const T = {
  open: 0.0,
  medicine: 0.96, //   "A hot bath was medicine."
  doctors: 3.72, //    "according to the very same doctors"
  death: 5.58, //      "a way to let death into your body"
  s2: 6.94, //         "It's sitting right there in the historical record."
  record: 8.2, //      "historical record"
  physicians: 9.6, //  "Physicians in medieval Europe genuinely believed"
  both: 11.82, //      "both things at once"
  sameDoc: 13.88, //   "sometimes in the same document"
  s4: 21.61, //        "You've probably heard the other version"
  didnt: 23.8, //      "Medieval people didn't bathe."
  streets: 25.75, //   "Filthy streets"
  bodies: 27.08, //    "filthy bodies"
  grime: 28.05, //     "centuries of grime"
  soap: 29.66, //      "until soap"
  water: 30.24, //     "and running water"
  rescued: 31.4, //    "finally rescued Europe"
  darkAges: 32.62, //  "from the Dark Ages of hygiene"
  s6: 37.32, //        "Medieval Europeans bathed."
  inst: 39.44, //      "entire institutions around it"
  s8: 45.6, //         "…the very thing keeping people clean"
  vuln: 48.84, //      "vulnerable to disease"
  s9: 49.88, //        "Not because they were simply ignorant"
  ignorant: 51.28, //  "ignorant"
  frame: 54.44, //     "through a framework"
  logical: 56.0, //    "made that conclusion logical"
  s10: 56.94, //       "So logical that a king"
  king: 58.04, //      "king"
  report: 59.04, //    "an official report about it"
  end: 60.3,
};

// ───────────────────────── S1 · 0.00 · "A hot bath was medicine… a way to let death in" ─────────────────────────
const FallingHerbs: React.FC<{t: number}> = ({t}) => (
  <g>
    {Array.from({length: 9}, (_, i) => {
      const t0 = 0.55 + i * 0.07;
      const k = ramp(t, t0, t0 + 0.75, ease.in);
      if (k <= 0 || k >= 1) return null;
      const x0 = 640 + randRange(i * 13 + 1, -140, 260);
      const x = x0 + noise1(t * 2 + i, i) * 18 + k * 40;
      const y = lerp(120, 610 + randRange(i * 7, -10, 20), k);
      const r = (t * 220 + i * 47) % 360;
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`} opacity={win(k, 0, 1, 0.1, 0.12)}>
          {i % 3 === 0 ? <circle r={9} fill={C.cautionLight} /> : <ellipse rx={16} ry={7} fill={i % 2 ? C.evidenceLight : C.evidence} />}
        </g>
      );
    })}
  </g>
);

export const S1: React.FC<{t: number}> = ({t}) => {
  const split = ramp(t, T.doctors - 0.7, T.doctors + 0.9, ease.inOut);
  const cam = breathe(
    camAt(t, [
      [-0.6, 960, 560, 0.99],
      [T.death - 0.3, 970, 548, 1.06],
      [T.death + 0.5, 1010, 545, 1.08],
      [T.s2 + 0.6, 1020, 542, 1.1],
    ]),
    t,
  );
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <HeroTub x={960} y={1075} s={1.02} split={split} splitX={0} herbs={ramp(t, 0.9, 2.0, ease.out)} bather={1} steam={1} light={1} backdrop t={t} seed={1} />
        <FallingHerbs t={t} />
      </Cam>
      <Tag x={590} y={330} anchor="right" text="Medicine" kind="evidence" size={46} p={ramp(t, T.medicine - 0.1, T.medicine + 0.5, ease.out)} />
      <Tag x={1170} y={330} anchor="left" text="A way in for death" kind="theory" size={46} p={ramp(t, T.death - 0.2, T.death + 0.4, ease.out)} />
      <Vignette strength={0.5} />
    </Stage>
  );
};

// ───────────────────────── S2 · 6.94 · "It's sitting right there in the historical record" ─────────────────────────
const DeskTop: React.FC<{t: number; lamp?: number}> = ({t, lamp = 1}) => (
  <g>
    <rect x={-400} y={-300} width={2720} height={1680} fill={C.woodDark} />
    {Array.from({length: 9}, (_, i) => (
      <rect key={i} x={-400} y={-300 + i * 190} width={2720} height={6} fill={C.ink} opacity={0.22} />
    ))}
    {Array.from({length: 14}, (_, i) => (
      <path key={`g${i}`} d={`M${randRange(i * 3, -300, 2200)} ${randRange(i * 5, -200, 1300)} q 120 ${randRange(i, -10, 10)} 260 0`} stroke={C.wood} strokeWidth={3} fill="none" opacity={0.35} />
    ))}
    <LightPool x={900} y={500} r={900} color={C.lamp} strength={(0.9 + noise1(t * 1.5, 4) * 0.06) * lamp} />
  </g>
);

export const S2: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s2 - 0.6, 960, 530, 0.96], [T.sameDoc + 1.0, 960, 560, 1.06]]), t);
  const pageP = ramp(t, T.s2 - 0.1, T.s2 + 0.8, ease.out);
  const L = {x: 560, y: 360};
  const R = {x: 1360, y: 640};
  return (
    <Stage bg={C.woodDark}>
      <Cam cam={cam}>
        <DeskTop t={t} />
        <g transform="translate(1600 870) rotate(-28)">
          <Icon name="quill" x={0} y={0} s={2.2} color={C.paperShade} accent={C.caution} knock={C.woodDark} />
        </g>
        <DocumentPage x={960} y={500} s={0.95} rot={-1.2} p={pageP} lines={12} seal sealColor={C.caution} style="parchment" />
        {/* left margin: bath + check (healing) */}
        <Icon name="bath" x={L.x} y={L.y} s={1.4} color={C.paperLight} accent={C.lamp} knock={C.woodDark} p={ramp(t, T.physicians - 0.1, T.physicians + 0.4, ease.out)} />
        <CheckMark x={L.x} y={L.y + 130} size={100} p={ramp(t, T.physicians + 0.3, T.physicians + 0.8)} color={C.evidenceLight} />
        {/* right margin: bath + warning */}
        <Icon name="bath" x={R.x} y={R.y} s={1.4} color={C.paperLight} accent={C.lamp} knock={C.woodDark} p={ramp(t, T.both - 0.15, T.both + 0.35, ease.out)} />
        <Icon name="warning" x={R.x} y={R.y + 130} s={1.3} color={C.caution} accent={C.ink} knock={C.woodDark} p={ramp(t, T.both + 0.25, T.both + 0.7, ease.out)} />
        <Bracket a={{x: L.x, y: 940}} b={{x: R.x, y: 940}} depth={-34} p={ramp(t, T.sameDoc - 0.1, T.sameDoc + 0.6)} label="" color={C.paperShade} />
        <path d={`M${L.x} 520 L${L.x} 940`} stroke={C.paperShade} strokeWidth={4} strokeDasharray="10 10" opacity={0.6 * ramp(t, T.sameDoc - 0.2, T.sameDoc + 0.3)} />
        <path d={`M${R.x} 805 L${R.x} 940`} stroke={C.paperShade} strokeWidth={4} strokeDasharray="10 10" opacity={0.6 * ramp(t, T.sameDoc - 0.2, T.sameDoc + 0.3)} />
      </Cam>
      <Kicker x={130} y={130} anchor="start" text="ILLUSTRATION" size={30} color={C.paperShade} p={ramp(t, T.s2 + 0.3, T.s2 + 0.9)} />
      <Tag x={960} y={1010} anchor="center" text="Same document" kind="debated" size={40} p={ramp(t, T.sameDoc + 0.2, T.sameDoc + 0.7, ease.out)} />
      <Vignette strength={0.6} />
    </Stage>
  );
};

// ───────────────────────── S4 · 21.61 · the myth as a cheesy storybook ─────────────────────────
const Soap: React.FC<{t: number; p: number}> = ({t, p}) => {
  if (p <= 0) return null;
  const k = ease.outBack(clamp01(p));
  const x = lerp(2200, 1360, k);
  const y = lerp(-200, 470, k) + Math.sin(t * 2.2) * 8;
  const r = lerp(-40, -10, k) + Math.sin(t * 1.7) * 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <rect x={-200} y={-80} width={400} height={180} rx={60} fill={C.ink} opacity={0.18} transform="translate(14 16)" />
      <rect x={-200} y={-90} width={400} height={180} rx={60} fill={C.paperLight} stroke={C.ink} strokeWidth={6} />
      <rect x={-200} y={30} width={400} height={60} rx={30} fill={C.paperDeep} opacity={0.6} />
      <ellipse cx={0} cy={-6} rx={120} ry={50} fill="none" stroke={C.paperDark} strokeWidth={8} />
      <ellipse cx={-120} cy={-52} rx={36} ry={12} fill={C.paper} opacity={0.9} />
    </g>
  );
};

const Tap: React.FC<{t: number; p: number; flow: number}> = ({t, p, flow}) => {
  if (p <= 0) return null;
  const y = lerp(-260, 0, ease.outBack(clamp01(p)));
  const len = 640 * ease.out(clamp01(flow));
  return (
    <g transform={`translate(1700 ${170 + y})`}>
      {len > 0 && (
        <g>
          <rect x={-104} y={70} width={44} height={len} rx={18} fill={C.water} />
          <rect x={-94} y={70} width={10} height={len} fill={C.paperLight} opacity={0.6} />
          {Array.from({length: 6}, (_, i) => {
            const ph = (t * 1.6 + i / 6) % 1;
            return <circle key={i} cx={-82 + Math.sin(i * 3 + t * 5) * 40 * ph} cy={70 + len - ph * 60} r={10 * (1 - ph)} fill={C.water} opacity={len > 600 ? 0.8 : 0} />;
          })}
        </g>
      )}
      <rect x={-20} y={-200} width={70} height={130} rx={14} fill={C.caution} stroke={C.ink} strokeWidth={6} />
      <path d="M 30 -60 L 30 30 Q 30 70 -20 70 L -100 70 L -100 40 L -20 40 Q 0 40 0 20 L 0 -60 Z" fill={C.caution} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-110} y={56} width={56} height={26} rx={6} fill={C.cautionLight} stroke={C.ink} strokeWidth={5} />
      <rect x={-50} y={-130} width={120} height={22} rx={10} fill={C.cautionLight} stroke={C.ink} strokeWidth={5} />
    </g>
  );
};

const MythStreet: React.FC<{t: number; clean: boolean}> = ({t, clean}) => {
  const walkK = ramp(t, T.didnt - 0.1, T.streets - 0.1, ease.out);
  const px = lerp(-180, 720, walkK);
  const walking = walkK > 0 && walkK < 0.98;
  const grimeP = (i: number) => ease.outBack(stagger(t, T.bodies - 0.1, i, 0.12, 0.35));
  const puddles = [
    {x: 420, y: 930, rx: 150, ry: 26},
    {x: 1080, y: 990, rx: 200, ry: 32},
    {x: 1550, y: 905, rx: 120, ry: 20},
    {x: 250, y: 1030, rx: 130, ry: 24},
  ];
  return (
    <g>
      <Street era="medieval" tone={clean ? 'day' : 'overcast'} t={t} seed={4} />
      {!clean && <rect x={0} y={0} width={1920} height={1080} fill={C.woodDark} opacity={0.18} />}
      {!clean &&
        puddles.map((pd, i) => {
          const k = ease.outBack(stagger(t, T.streets - 0.15, i, 0.12, 0.4));
          return k > 0 ? (
            <g key={i}>
              <ellipse cx={pd.x} cy={pd.y} rx={pd.rx * k} ry={pd.ry * k} fill={C.woodDark} />
              <ellipse cx={pd.x - pd.rx * 0.3} cy={pd.y - pd.ry * 0.3} rx={pd.rx * 0.3 * k} ry={pd.ry * 0.25 * k} fill={C.wood} opacity={0.6} />
              {[0, 1, 2].map((j) => (
                <circle key={j} cx={pd.x + (j - 1) * pd.rx * 0.9} cy={pd.y - 30 - j * 8} r={9 * k} fill={C.woodDark} opacity={1 - ramp(t, T.streets + 0.6, T.streets + 1.2)} />
              ))}
            </g>
          ) : null;
        })}
      <Person
        x={px}
        y={980}
        s={1.05}
        t={t}
        outfit="peasant"
        hair="short"
        beard={clean ? 'none' : 'short'}
        expression={clean ? 'happy' : 'worried'}
        pose={clean ? 'cheer' : walking ? undefined : 'worried'}
        walk={walking ? t * 1.1 : undefined}
        emote={clean ? 'sparkle' : 'sweat'}
        emoteP={clean ? 1 : ramp(t, T.didnt + 0.5, T.didnt + 0.9, ease.out)}
        seed={7}
      />
      {!clean &&
        [
          [-30, -330, 26],
          [40, -250, 34],
          [-20, -150, 30],
          [30, -80, 22],
          [-45, -420, 18],
          [25, -470, 16],
        ].map(([dx, dy, r], i) => {
          const k = grimeP(i);
          return k > 0 ? <ellipse key={i} cx={px + dx} cy={980 + dy} rx={r * k} ry={r * 0.75 * k} fill={C.woodDark} opacity={0.8} /> : null;
        })}
      {!clean && (
        <Particles t={t} x={px - 120} y={980 - 640} w={240} h={200} n={9} seed={11} size={[4, 6]} color={C.ink} opacity={[0.8, 0.9]} wobble={40} vx={0} vy={0} />
      )}
      {/* centuries of grime: sediment bands rise from the bottom */}
      {!clean &&
        [0, 1, 2].map((i) => {
          const k = ease.out(stagger(t, T.grime + 0.2, i, 0.3, 0.6));
          if (k <= 0) return null;
          const top = 1080 - (i + 1) * 95 * k;
          const d = `M0 1090 L0 ${top} ${Array.from({length: 13}, (_, j) => `L${j * 160} ${top + Math.sin(j * 1.7 + i * 2) * 14}`).join(' ')} L1920 ${top} L1920 1090 Z`;
          return <path key={i} d={d} fill={[C.stoneDark, C.woodDark, C.inkSoft][i]} opacity={0.82} />;
        })}
    </g>
  );
};

export const S4: React.FC<{t: number}> = ({t}) => {
  const wipe = ramp(t, T.rescued - 0.1, T.rescued + 0.8, ease.inOut);
  const wx = lerp(-120, 2040, wipe);
  const cam = breathe(camAt(t, [[T.s4 - 0.6, 960, 560, 1.06], [T.grime + 1.2, 960, 540, 1.0], [T.end, 960, 540, 1.0]]), t);
  const titleP = ramp(t, T.darkAges - 0.25, T.darkAges + 0.5, ease.out);
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <MythStreet t={t} clean={false} />
        {wipe > 0 && (
          <g>
            <clipPath id="c01s4wipe">
              <rect x={-200} y={-200} width={wx + 200} height={1500} />
            </clipPath>
            <g clipPath="url(#c01s4wipe)">
              <MythStreet t={t} clean />
            </g>
            {wipe < 1 && (
              <g>
                <rect x={wx - 60} y={-200} width={60} height={1500} fill={C.paperLight} opacity={0.85} />
                {Array.from({length: 10}, (_, i) => (
                  <circle key={i} cx={wx - 30 + randRange(i, -30, 30)} cy={i * 120} r={randRange(i + 3, 18, 40)} fill="none" stroke={C.water} strokeWidth={5} />
                ))}
              </g>
            )}
          </g>
        )}
        <Soap t={t} p={ramp(t, T.soap - 0.2, T.soap + 0.5)} />
        <Particles t={t} x={1150} y={330} w={420} h={300} n={10} seed={21} size={[6, 14]} color={C.paperLight} shape="ring" twinkle opacity={[0.6 * ramp(t, T.soap + 0.2, T.soap + 0.6), 0.9 * ramp(t, T.soap + 0.2, T.soap + 0.6)]} vy={-30} />
        <Tap t={t} p={ramp(t, T.water - 0.25, T.water + 0.3)} flow={ramp(t, T.water + 0.2, T.water + 0.8)} />
      </Cam>
      <Kicker x={960} y={130} text="THE STORY YOU'VE HEARD" size={36} color={C.ink} p={ramp(t, T.s4 + 0.2, T.s4 + 0.8) * (1 - ramp(t, T.darkAges - 0.5, T.darkAges - 0.2))} />
      {titleP > 0 && (
        <g opacity={titleP}>
          <rect x={160} y={lerp(470, 430, titleP)} width={1600} height={230} fill={C.paperLight} stroke={C.ink} strokeWidth={8} />
          <rect x={180} y={lerp(470, 430, titleP) + 20} width={1560} height={190} fill="none" stroke={C.ink} strokeWidth={3} />
          <Icon name="star" x={270} y={lerp(585, 545, titleP)} s={0.7} color={C.caution} accent={C.caution} />
          <Icon name="star" x={1650} y={lerp(585, 545, titleP)} s={0.7} color={C.caution} accent={C.caution} />
        </g>
      )}
      <Headline x={960} y={580} text="THE DARK AGES OF HYGIENE" size={88} weight={800} italic p={titleP} color={C.ink} />
    </Stage>
  );
};

// ───────────────────────── S6 / S8 · the street of bathhouse signs (motif: sign + lantern) ─────────────────────────
const SIGNS = [
  {x: 330, y: 330, door: 330},
  {x: 800, y: 360, door: 800},
  {x: 1270, y: 330, door: 1270},
  {x: 1720, y: 350, door: 1720},
];

const BathSign: React.FC<{x: number; y: number; t: number; seed: number; glow: number; tone: 'day' | 'dusk'}> = ({x, y, t, seed, glow, tone}) => {
  const sw = Math.sin(t * 1.6 + seed * 1.3) * 4 + noise1(t * 0.7, seed) * 1.5;
  const dusk = tone === 'dusk';
  return (
    <g>
      {/* iron bracket arm from the wall */}
      <path d={`M${x - 140} ${y - 30} L${x + 30} ${y - 30} M${x - 140} ${y + 40} L${x - 60} ${y - 30}`} stroke={C.ink} strokeWidth={9} strokeLinecap="round" fill="none" />
      <rect x={x - 150} y={y - 50} width={20} height={110} fill={C.ink} />
      <g transform={`rotate(${sw} ${x} ${y - 30})`}>
        <line x1={x - 60} y1={y - 30} x2={x - 60} y2={y} stroke={C.ink} strokeWidth={4} />
        <line x1={x + 20} y1={y - 30} x2={x + 20} y2={y} stroke={C.ink} strokeWidth={4} />
        <Banner kind="hanging" x={x - 20} y={y} w={170} h={220} t={t} color={dusk ? C.theory : C.evidence} emblem="none" trim={C.cautionTint} />
        <Icon name="bath" x={x - 20} y={y + 95} s={0.95} color={C.paperLight} accent={C.lamp} knock={dusk ? C.theory : C.evidence} />
      </g>
      <Lantern x={x + 120} y={y + 150} t={t} chain={60} lit glow={glow} color={C.ink} />
    </g>
  );
};

const SignStreet: React.FC<{t: number; tone: 'day' | 'dusk'; glow?: number; crowd?: number}> = ({t, tone, glow = 1, crowd = 1}) => (
  <g>
    <Street era="medieval" tone={tone} t={t} seed={9} />
    {SIGNS.map((sg, i) => (
      <Steam key={`st${i}`} t={t + i * 1.3} x={sg.x + 40} y={250} w={160} h={260} n={4} color={C.paperLight} strength={tone === 'dusk' ? 0.5 : 0.8} />
    ))}
    {SIGNS.map((sg, i) => (
      <Door key={`d${i}`} x={sg.door + 20} y={820} w={170} h={300} style="plank" open={0.35} color={C.wood} />
    ))}
    {SIGNS.map((sg, i) => (
      <BathSign key={`s${i}`} x={sg.x} y={sg.y} t={t} seed={i + 1} glow={glow} tone={tone} />
    ))}
    {crowd > 0 && <Crowd x={980} y={1000} w={1700} n={9} rows={1} t={t} seed={5} s={0.62} era="medieval" facing="mixed" />}
  </g>
);

// S6 · 37.32 · "Medieval Europeans bathed. They built entire institutions around it."
export const S6: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(
    camAt(t, [
      [T.s6 - 0.6, 830, 470, 2.7],
      [T.inst - 0.15, 815, 480, 2.5],
      [T.inst + 0.9, 960, 560, 1.0],
      [T.s8, 960, 555, 1.02],
    ]),
    t,
  );
  return (
    <Stage bg={C.sky}>
      <Cam cam={cam}>
        <SignStreet t={t} tone="day" />
      </Cam>
      <Vignette strength={0.4} />
    </Stage>
  );
};

// S8 · 45.60 · "…the very thing keeping people clean could also make them vulnerable to disease."
export const S8: React.FC<{t: number}> = ({t}) => {
  const walkK = ramp(t, T.s8 - 0.3, T.s8 + 0.8, ease.out);
  const px = lerp(-60, 330, walkK);
  const pointP = ramp(t, 46.3, 46.7, ease.out);
  const glow = lerp(1, 0.18, ramp(t, 47.9, 48.6, ease.inOut)) * (1 + noise1(t * 6, 3) * 0.08);
  const cam = breathe(camAt(t, [[T.s8 - 0.6, 760, 560, 1.32], [T.vuln + 1.2, 800, 540, 1.4]]), t);
  return (
    <Stage bg={C.dusk}>
      <Cam cam={cam}>
        <SignStreet t={t} tone="dusk" glow={glow} crowd={0} />
        <Person
          x={px}
          y={1000}
          s={1.05}
          t={t}
          outfit="robe"
          hat="beret"
          beard="full"
          age="elder"
          expression={pointP > 0.5 ? 'worried' : 'thinking'}
          pose={pointP > 0.5 ? 'point' : undefined}
          walk={walkK < 0.98 ? t * 1.0 : undefined}
          seed={3}
        />
      </Cam>
      <Tag x={1180} y={760} text="Vulnerable" kind="caution" size={46} p={ramp(t, T.vuln - 0.15, T.vuln + 0.4, ease.out)} />
      <Vignette strength={0.6} />
    </Stage>
  );
};

// ───────────────────────── S9 · 49.88 · "Not because they were simply ignorant… a framework" ─────────────────────────
export const S9: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.s9 - 0.6, 960, 540, 1.08], [53.4, 940, 545, 1.0], [54.6, 1940, 540, 1.0], [T.s10 + 0.6, 1960, 540, 1.02]]), t);
  const slipP = ramp(t, T.s9 - 0.05, T.s9 + 0.4, ease.outBack);
  const wheelP = ramp(t, T.frame - 0.55, T.frame + 0.3, ease.out);
  const chain = [0, 1, 2].map((i) => stagger(t, T.logical - 0.15, i, 0.22, 0.35));
  const CX = [2400, 2560, 2720];
  return (
    <Stage bg={C.ink}>
      <Cam cam={cam}>
        {/* blueprint grid */}
        {Array.from({length: 26}, (_, i) => (
          <line key={`v${i}`} x1={1000 + i * 80} y1={0} x2={1000 + i * 80} y2={1080} stroke={C.paperShade} strokeWidth={1.5} opacity={0.06 * wheelP} />
        ))}
        {Array.from({length: 14}, (_, i) => (
          <line key={`h${i}`} x1={1000} y1={i * 80} x2={3100} y2={i * 80} stroke={C.paperShade} strokeWidth={1.5} opacity={0.06 * wheelP} />
        ))}
        <LightPool x={760} y={520} r={600} color={C.lamp} strength={0.5} />
        {/* the physician — same look as S8 */}
        <Person x={760} y={1010} s={1.25} t={t} outfit="robe" hat="beret" beard="full" age="elder" expression="thinking" seed={3} />
        {slipP > 0 && (
          <g transform={`translate(760 ${1010 - 1.25 * 330}) rotate(${-4 * slipP}) scale(${slipP})`}>
            <rect x={-150} y={-46} width={300} height={92} fill={C.paperLight} stroke={C.ink} strokeWidth={3} />
            <circle cx={0} cy={-36} r={7} fill={C.slate} />
          </g>
        )}
        {slipP > 0.5 && (
          <g transform={`translate(760 ${1010 - 1.25 * 330}) rotate(-4)`}>
            <RichText x={-140} y={-40} w={280} h={80} text="IGNORANT?" size={46} align="center" valign="middle" weight={700} mode="fade" p={1} strike={ramp(t, T.ignorant - 0.1, T.ignorant + 0.4)} />
          </g>
        )}
        {/* framework: humor wheel blueprint behind a body */}
        <HumorWheel x={1780} y={540} s={0.95} dark reveal={[0, 1, 2, 3].map((i) => stagger(t, T.frame - 0.35, i, 0.12, 0.4)) as [number, number, number, number]} axesP={ramp(t, T.frame - 0.5, T.frame + 0.3)} p={wheelP} t={t} />
        <g opacity={0.78}>
          <BodyOutline x={1780} y={900} s={0.78} t={t} p={ramp(t, 53.9, 54.6, ease.out)} fill={C.inkLift} shade={C.inkSoft} />
        </g>
        {/* logic chain */}
        {CX.map((cx, i) => (
          <g key={i}>
            {i > 0 && <Arrow from={{x: CX[i - 1] + 34, y: 540}} to={{x: cx - 34, y: 540}} p={chain[i]} color={C.paperShade} width={5} head={16} />}
            <circle cx={cx} cy={540} r={26} fill="none" stroke={C.paperShade} strokeWidth={5} opacity={ramp(t, T.frame + 0.4, T.frame + 0.9)} />
            <circle cx={cx} cy={540} r={18 * ease.outBack(chain[i])} fill={C.lamp} />
            <Pulse x={cx} y={540} r={60} p={ramp(t, T.logical + i * 0.22, T.logical + i * 0.22 + 0.7)} color={C.lamp} />
          </g>
        ))}
      </Cam>
      <Vignette strength={0.5} />
    </Stage>
  );
};

// ───────────────────────── S10 · 56.94 · "So logical that a king commissioned an official report" ─────────────────────────
const WaxSeal: React.FC<{x: number; y: number; p: number}> = ({x, y, p}) => {
  if (p <= 0) return null;
  const k = clamp01(p);
  const sc = lerp(1.8, 1, ease.out(k));
  const o = ramp(k, 0, 0.35);
  const scallop = Array.from({length: 18}, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const r = 78 + (i % 2 ? 6 : -4);
    return `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={o}>
      <path d={`${scallop} Z`} fill={C.oxblood} transform="translate(6 8)" opacity={0.35} />
      <path d={`${scallop} Z`} fill={C.oxblood} />
      <circle r={56} fill="none" stroke={C.oxDeep} strokeWidth={6} />
      <Icon name="crown" x={0} y={2} s={0.75} color={C.oxDeep} accent={C.oxDeep} knock={C.oxblood} />
      <ellipse cx={-26} cy={-34} rx={18} ry={8} fill={C.oxLight} opacity={0.5} transform="rotate(-30 -26 -34)" />
    </g>
  );
};

export const S10: React.FC<{t: number}> = ({t}) => {
  const base = camAt(t, [[T.s10 - 0.6, 960, 545, 1.0], [T.end + 0.6, 960, 560, 1.08]]);
  const cam = shake(breathe(base, t), t, T.report, 10, 6);
  const crownK = ramp(t, T.king - 0.25, T.king + 0.35, ease.outBack);
  const crownY = lerp(-160, 300, crownK);
  return (
    <Stage bg={C.woodDark}>
      <Cam cam={cam}>
        <DeskTop t={t} />
        <DocumentPage x={960} y={540} s={1.0} rot={0.8} p={ramp(t, T.s10 - 0.3, T.s10 + 0.4, ease.out)} lines={12} signature style="parchment" />
        {crownK > 0 && (
          <g>
            <ellipse cx={960} cy={340} rx={90 * crownK} ry={12 * crownK} fill={C.ink} opacity={0.2} />
            <Icon name="crown" x={960} y={crownY} s={1.7} color={C.caution} accent={C.cautionLight} knock={C.paperLight} r={keys(t, [[T.king, -10], [T.king + 0.4, 3], [T.king + 0.7, 0]])} />
          </g>
        )}
        <WaxSeal x={960} y={560} p={ramp(t, T.report - 0.12, T.report + 0.18)} />
        <Pulse x={960} y={560} r={180} p={ramp(t, T.report + 0.05, T.report + 0.7)} color={C.oxblood} />
      </Cam>
      <Vignette strength={0.6} />
    </Stage>
  );
};
