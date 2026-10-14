import React from 'react';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {Kicker} from '../../kit/text';
import {Weather, WeatherKind} from '../../kit/fx';
import {Barrels, Campfire, Crates, MarketStall, Throne, Tree, Well} from '../../kit/env';
import {Car, Cart, Ship, Train} from '../../kit/transport';

// World page: transport (kit/transport), everyday props (kit/env) and the Weather overlay (kit/fx).
// Everything is moving / animated; a still at t=3 shows all pieces.
const L: React.FC<{x: number; y: number; text: string}> = ({x, y, text}) => <Kicker x={x} y={y} text={text} size={17} color={C.inkSoft} />;

const WX: {kind: WeatherKind; sky: string; ground: string; color?: string}[] = [
  {kind: 'rain', sky: C.stone, ground: C.evidenceLight},
  {kind: 'snow', sky: C.slate, ground: C.paperShade},
  {kind: 'fog', sky: C.sky, ground: C.evidenceLight},
  {kind: 'wind', sky: C.dusk, ground: C.woodLight},
  {kind: 'leaves', sky: C.sky, ground: C.evidenceLight},
];

export const World: React.FC<{t: number}> = ({t}) => (
  <Stage bg={C.paper}>
    {/* row 1: ships on water, cars on a road */}
    <rect x={0} y={200} width={1110} height={56} fill={C.water} opacity={0.55} />
    <rect x={1110} y={226} width={810} height={14} fill={C.paperDeep} />
    <Ship kind="rowboat" x={150} y={212} s={0.45} t={t} moving />
    <Ship kind="sailing" x={490} y={212} s={0.4} t={t} moving />
    <Ship kind="steam" x={900} y={212} s={0.4} t={t} moving />
    <Car kind="vintage" x={1300} y={228} s={0.6} t={t} moving />
    <Car kind="modern" x={1660} y={228} s={0.6} t={t} moving />
    <L x={150} y={290} text="Ship · rowboat" />
    <L x={490} y={290} text="Ship · sailing" />
    <L x={900} y={290} text="Ship · steam" />
    <L x={1300} y={290} text="Car · vintage" />
    <L x={1660} y={290} text="Car · modern" />

    {/* row 2: horse-drawn + trains */}
    <rect x={0} y={466} width={1920} height={10} fill={C.paperDeep} />
    <Cart kind="cart" x={110} y={468} s={0.5} t={t} moving />
    <Cart kind="wagon" x={500} y={468} s={0.5} t={t} moving />
    <Cart kind="carriage" x={900} y={468} s={0.5} t={t} moving />
    <Train kind="steam" cars={1} x={1430} y={468} s={0.4} t={t} moving />
    <Train kind="modern" cars={1} x={1780} y={468} s={0.4} t={t} moving />
    <L x={190} y={510} text="Cart · cart" />
    <L x={600} y={510} text="Cart · wagon" />
    <L x={1000} y={510} text="Cart · carriage" />
    <L x={1360} y={510} text="Train · steam" />
    <L x={1710} y={510} text="Train · modern" />

    {/* row 3: everyday props */}
    <rect x={0} y={758} width={1920} height={10} fill={C.paperDeep} />
    {[
      {x: 130, el: <MarketStall goods="fruit" />, name: 'Stall · fruit'},
      {x: 360, el: <MarketStall goods="cloth" awning={C.evidence} />, name: 'Stall · cloth'},
      {x: 590, el: <MarketStall goods="pots" awning={C.caution} />, name: 'Stall · pots'},
      {x: 820, el: <Campfire t={t} />, name: 'Campfire'},
      {x: 1050, el: <Well />, name: 'Well'},
      {x: 1290, el: <Barrels n={3} />, name: 'Barrels n=3'},
      {x: 1540, el: <Crates n={4} w={100} />, name: 'Crates n=4'},
      {x: 1790, el: <Throne />, name: 'Throne'},
    ].map((it) => (
      <g key={it.name}>
        <g transform={`translate(${it.x} 760) scale(0.5)`}>{it.el}</g>
        <L x={it.x} y={798} text={it.name} />
      </g>
    ))}

    {/* row 4: Weather kinds */}
    {WX.map((w, i) => {
      const x = 30 + i * 375;
      const y = 820;
      return (
        <g key={w.kind}>
          <clipPath id={`wt-${i}`}>
            <rect x={x} y={y} width={360} height={240} rx={10} />
          </clipPath>
          <g clipPath={`url(#wt-${i})`}>
            <rect x={x} y={y} width={360} height={240} fill={w.sky} />
            <Tree x={x + 90} y={y + 200} h={130} kind="round" t={t} seed={i + 1} tone={w.kind === 'snow' ? 'night' : 'day'} />
            <Tree x={x + 280} y={y + 200} h={100} kind="conifer" t={t} seed={i + 4} tone={w.kind === 'snow' ? 'night' : 'day'} />
            <rect x={x} y={y + 196} width={360} height={44} fill={w.ground} />
            <Weather t={t} kind={w.kind} x={x} y={y} w={360} h={240} seed={i + 2} strength={w.kind === 'fog' ? 1.2 : 1} />
            <rect x={x + 10} y={y + 10} width={(w.kind.length + 11) * 16 * 0.78 + 22} height={30} rx={6} fill={C.paperLight} opacity={0.92} />
            <Kicker x={x + 20} y={y + 32} text={`Weather · ${w.kind}`} size={16} color={C.ink} anchor="start" />
          </g>
        </g>
      );
    })}
  </Stage>
);
