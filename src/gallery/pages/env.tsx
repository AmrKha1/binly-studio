import React from 'react';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {ease, ramp} from '../../kit/anim';
import {Kicker} from '../../kit/text';
import {
  Banner,
  Bathhouse,
  Bathtub,
  Bed,
  Bedroom,
  Bell,
  Bench,
  BookStack,
  Bookshelf,
  Barrel,
  Bucket,
  Candle,
  Cauldron,
  Chair,
  CitySkyline,
  Classroom,
  Clock,
  Desk,
  Door,
  Frame,
  Ground,
  Hills,
  Lab,
  Landscape,
  Lantern,
  MindSpace,
  MuseumHall,
  OilLamp,
  Plant,
  Plinth,
  Room,
  Scroll,
  Sky,
  Street,
  StreetLamp,
  Study,
  Table,
  Torch,
  Tree,
  Water,
  Window,
} from '../../kit/env';

// Env gallery. The page pages itself every 3 s (each page fades in over 0.4 s, cards stagger in by ~1.2 s):
//   0–3 s   environments 1–6   (landscapes, city skylines)               → still at t=2
//   3–6 s   environments 7–12  (skyline, streets, medieval room)          → t=5
//   6–9 s   environments 13–18 (rooms, bathhouse, lab, classroom, museum) → t=8
//   9–12 s  environments 19–24 (study, bedroom, mind space, variants)     → t=11
//   12–15 s props A (furniture, doors, windows, frame)                    → t=14
//   15–18 s props B (tubs, containers, lights, clock)                     → t=17
//   18–21 s props C (bell, banners, trees, plinth, lamp post)             → t=20 (stays to the end)

type EnvItem = {name: string; el: (t: number) => React.ReactNode};

const ENVS: EnvItem[] = [
  {name: 'Landscape · day', el: (t) => <Landscape tone="day" t={t} seed={2} />},
  {name: 'Landscape · dusk lake', el: (t) => <Landscape tone="dusk" t={t} seed={4} water />},
  {name: 'Landscape · night lake', el: (t) => <Landscape tone="night" t={t} seed={7} water trees="conifer" />},
  {name: 'Landscape · overcast', el: (t) => <Landscape tone="overcast" t={t} seed={9} trees="bare" />},
  {
    name: 'Skyline · medieval dusk',
    el: (t) => (
      <g>
        <Sky variant="dusk" t={t} horizon={760} />
        <CitySkyline era="medieval" layer="far" tone="dusk" y={720} seed={3} />
        <CitySkyline era="medieval" layer="mid" tone="dusk" y={820} seed={5} walls />
        <Hills layer="near" tone="dusk" y={930} amp={30} seed={2} />
      </g>
    ),
  },
  {
    name: 'Skyline · modern night',
    el: (t) => (
      <g>
        <Sky variant="night" t={t} horizon={760} />
        <CitySkyline era="modern" layer="far" tone="night" y={760} seed={2} t={t} />
        <CitySkyline era="modern" layer="mid" tone="night" y={860} seed={6} t={t} />
        <Water y={880} tone="night" t={t} glintX={1450} />
      </g>
    ),
  },
  {
    name: 'Skyline · early-modern',
    el: (t) => (
      <g>
        <Sky variant="day" t={t} horizon={760} />
        <CitySkyline era="early-modern" layer="far" y={730} seed={8} />
        <CitySkyline era="early-modern" layer="mid" y={820} seed={4} />
        <CitySkyline era="early-modern" layer="near" y={940} seed={1} />
        <Ground y={930} kind="earth" />
      </g>
    ),
  },
  {name: 'Street · medieval day', el: (t) => <Street era="medieval" t={t} seed={1} />},
  {name: 'Street · medieval night', el: (t) => <Street era="medieval" tone="night" t={t} seed={3} />},
  {name: 'Street · modern day', el: (t) => <Street era="modern" t={t} seed={2} />},
  {name: 'Street · modern night', el: (t) => <Street era="modern" tone="night" t={t} seed={5} />},
  {name: 'Room · medieval', el: (t) => <Room era="medieval" t={t} />},
  {name: 'Room · 19th century', el: (t) => <Room era="19thc" t={t} />},
  {name: 'Room · modern', el: (t) => <Room era="modern" t={t} />},
  {name: 'Bathhouse (medieval)', el: (t) => <Bathhouse t={t} />},
  {name: 'Lab · modern', el: (t) => <Lab t={t} />},
  {name: 'Classroom', el: (t) => <Classroom t={t} />},
  {name: 'Museum hall', el: (t) => <MuseumHall t={t} />},
  {name: 'Study / library', el: (t) => <Study t={t} />},
  {name: 'Bedroom · night', el: (t) => <Bedroom t={t} />},
  {name: 'Mind space · plum', el: (t) => <MindSpace t={t} bg="plum" />},
  {name: 'Mind space · ink', el: (t) => <MindSpace t={t} bg="ink" seed={4} />},
  {name: 'Lab · 19th century', el: (t) => <Lab t={t} era="19thc" />},
  {name: 'Room · 19thc night', el: (t) => <Room era="19thc" night t={t} doorOpen={0.6} />},
];

type PropItem = {name: string; s: number; el: (t: number) => React.ReactNode};
const PROPS: PropItem[][] = [
  [
    {name: 'Table', s: 0.8, el: () => <Table />},
    {name: 'Desk', s: 0.62, el: () => <Desk />},
    {name: 'Chair', s: 1, el: () => <Chair />},
    {name: 'Bed', s: 0.5, el: () => <Bed />},
    {name: 'Bookshelf', s: 0.62, el: () => <Bookshelf seed={3} />},
    {name: 'BookStack', s: 1.2, el: () => <BookStack seed={2} />},
    {name: 'Bench', s: 0.66, el: () => <Bench />},
    {name: 'Door · plank', s: 0.8, el: () => <Door shape="arched" style="plank" frame={C.stoneShade} />},
    {name: 'Door · panel open', s: 0.8, el: () => <Door open={0.6} />},
    {name: 'Window · arched', s: 0.8, el: (t) => <Window shape="arched" w={200} h={340} t={t} />},
    {name: 'Window · curtains', s: 0.64, el: (t) => <Window w={220} h={320} curtains sky="night" t={t} frame={C.paperLight} reveal={C.woodLight} />},
    {name: 'Frame', s: 0.8, el: () => <g transform="translate(0 -150)"><Frame kind="landscape" /></g>},
  ],
  [
    {name: 'Bathtub · wood', s: 0.72, el: (t) => <Bathtub t={t} />},
    {name: 'Bathtub · modern', s: 0.66, el: (t) => <Bathtub kind="modern" t={t} />},
    {name: 'Bucket', s: 1.4, el: () => <Bucket />},
    {name: 'Plant · leafy', s: 1.2, el: (t) => <Plant t={t} />},
    {name: 'Cauldron', s: 0.9, el: (t) => <Cauldron t={t} fire />},
    {name: 'Barrel', s: 1, el: () => <Barrel />},
    {name: 'Scroll', s: 0.7, el: () => <g transform="translate(0 -330)"><Scroll /></g>},
    {name: 'Lantern', s: 1.3, el: (t) => <Lantern t={t} />},
    {name: 'OilLamp', s: 1.4, el: (t) => <OilLamp t={t} glow={0.6} />},
    {name: 'Candle', s: 1.6, el: (t) => <Candle t={t} glow={0.6} />},
    {name: 'Torch', s: 1, el: (t) => <Torch t={t} glow={0.6} />},
    {name: 'Clock', s: 0.62, el: (t) => <g transform="translate(0 -400)"><Clock pendulum t={t} time={3.4 + t * 0.05} /></g>},
  ],
  [
    {name: 'Bell', s: 1, el: (t) => <g transform="translate(0 -170)"><Bell t={t} swing={10} /></g>},
    {name: 'Banner', s: 0.85, el: (t) => <g transform="translate(0 -360)"><Banner t={t} /></g>},
    {name: 'Banner · flag', s: 0.85, el: (t) => <Banner kind="flag" t={t} emblem="stripe" color={C.evidence} />},
    {name: 'Plant · tall', s: 1.2, el: (t) => <Plant kind="tall" t={t} seed={3} />},
    {name: 'Plinth', s: 0.45, el: () => <Plinth />},
    {name: 'StreetLamp', s: 0.75, el: () => <StreetLamp />},
    {name: 'Tree · round', s: 1, el: (t) => <Tree t={t} />},
    {name: 'Tree · conifer', s: 1, el: (t) => <Tree kind="conifer" t={t} />},
    {name: 'Tree · bare', s: 1, el: (t) => <Tree kind="bare" t={t} seed={3} />},
    {name: 'Tree · poplar', s: 1, el: (t) => <Tree kind="poplar" t={t} />},
    {name: 'Lantern · hung', s: 1, el: (t) => <g transform="translate(0 -40)"><Lantern t={t} chain={150} glow={0.5} /></g>},
    {name: 'Plant · bush', s: 1.2, el: (t) => <Plant kind="bush" t={t} />},
  ],
];

const SC = 0.31;
const CW = 1920 * SC;
const CH = 1080 * SC;
const GX = (1920 - 3 * CW) / 4;

const EnvGrid: React.FC<{t: number; page: number; lt: number}> = ({t, page, lt}) => (
  <g>
    {ENVS.slice(page * 6, page * 6 + 6).map((e, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = GX + col * (CW + GX);
      const y = 118 + row * (CH + 100);
      const k = ramp(lt, 0.1 + i * 0.1, 0.7 + i * 0.1, ease.out);
      const id = `envcell-${page}-${i}`;
      return (
        <g key={`${page}-${i}`} opacity={k} transform={`translate(0 ${(1 - k) * 24})`}>
          <rect x={x + 8} y={y + 10} width={CW} height={CH} fill={C.ink} opacity={0.12} />
          <clipPath id={id}>
            <rect x={x} y={y} width={CW} height={CH} />
          </clipPath>
          <g clipPath={`url(#${id})`}>
            <g transform={`translate(${x} ${y}) scale(${SC})`}>{e.el(t)}</g>
          </g>
          <Kicker x={x + CW / 2} y={y + CH + 44} text={e.name} size={22} color={C.inkSoft} />
        </g>
      );
    })}
  </g>
);

const PropGrid: React.FC<{t: number; page: number; lt: number}> = ({t, page, lt}) => (
  <g>
    {[0, 1].map((r) => (
      <rect key={r} x={60} y={470 + r * 470} width={1800} height={6} rx={3} fill={C.paperDeep} />
    ))}
    {PROPS[page].map((p, i) => {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const x = 160 + col * 320;
      const y = 470 + row * 470;
      const k = ramp(lt, 0.1 + i * 0.07, 0.6 + i * 0.07, ease.out);
      return (
        <g key={`${page}-${i}`} opacity={k}>
          <g transform={`translate(${x} ${y + (1 - k) * 20}) scale(${p.s})`}>{p.el(t)}</g>
          <Kicker x={x} y={y + 52} text={p.name} size={22} color={C.inkSoft} />
        </g>
      );
    })}
  </g>
);

const TITLES = [
  'Environments 1 · landscapes & skylines',
  'Environments 2 · cities & streets',
  'Environments 3 · interiors',
  'Environments 4 · interiors & abstract',
  'Props A · furniture, doors, windows',
  'Props B · tubs, containers, lights',
  'Props C · bells, banners, trees',
];

export const Env: React.FC<{t: number}> = ({t}) => {
  const page = Math.min(TITLES.length - 1, Math.max(0, Math.floor(t / 3)));
  const lt = t - page * 3;
  const fade = ramp(lt, 0, 0.4);
  return (
    <Stage bg={C.paper}>
      <g opacity={fade}>
        <Kicker x={960} y={70} text={`kit/env — ${TITLES[page]}`} size={26} color={C.inkMute} />
        {page < 4 ? <EnvGrid t={t} page={page} lt={lt} /> : <PropGrid t={t} page={page - 4} lt={lt} />}
      </g>
    </Stage>
  );
};
