import React from 'react';
import {Stage} from '../../kit/stage';
import {Halo, Sparkles} from '../../kit/fx';
import {GlowPill, SlamTitle} from '../../kit/text';
import {BgPlate, ImageAsset, PlateCam} from '../../kit/asset';
import {ImageHost} from '../../kit/image-host';
import {C} from '../../kit/theme';
import {ramp, ease} from '../../kit/anim';

// Pilot 2: Flow background plate (illustrated, empty) + cut-out Flow elements landing ON the table + host. 0–6 s.
// Stills at 1.2, 3.2, 5.
const TABLE = 690; // table-top line in frame px (objects stand on it)
const OBJ: [string, number, number, number, string][] = [
  // name, x, width, aspect, entrance
  ['cowrie-shells', 620, 190, 654 / 464, 'bounceDrop'],
  ['gold-coin', 790, 150, 610 / 607, 'zoomSpin'],
  ['treasure-chest', 980, 280, 753 / 701, 'pop'],
  ['coin-pouch', 1170, 150, 528 / 604, 'jackInTheBox'],
  ['banknotes', 1330, 200, 675 / 527, 'backInRight'],
];
export const Pilot2: React.FC<{t: number}> = ({t}) => (
  <Stage>
    <PlateCam t={t} a={0} b={6} push="in" amount={0.07} cy={640}>
      <BgPlate slug="_pilot" file="treasury.jpg" t={t} a={0} b={6} push="none" dim={0.06} />
      {OBJ.map(([n, x, w, ar, kind], i) => {
        const h = w / ar;
        const at = 0.5 + i * 0.35;
        return (
          <g key={n}>
            <ellipse cx={x} cy={TABLE + 4} rx={w * 0.42} ry={10} fill="#2B2420" opacity={0.28 * ramp(t, at + 0.2, at + 0.6)} />
            <ImageAsset slug="_pilot" name={n} x={x} y={TABLE - h / 2} w={w} ar={ar} t={t}
              enter={{kind: kind as never, p: ramp(t, at, at + 0.8, ease.linear)}}
              attention={n === 'treasure-chest' ? {kind: 'tada', at: 3.4} : undefined} />
          </g>
        );
      })}
      <Halo id="p2h" x={980} y={TABLE - 140} r={230} color={C.goldLight} p={ramp(t, 3.2, 3.8)} strength={0.55} />
      <Sparkles t={t} x={980} y={TABLE - 170} r={170} n={5} p={ramp(t, 3.4, 3.8)} />
    </PlateCam>
    <GlowPill x={960} y={140} text="Before coins: shells" kind="ink" anchor="center" p={ramp(t, 0.6, 1.2, ease.linear)} size={54} />
    <ImageHost t={t} who="oddestory" x={300} y={1110} h={640} poses={[[0, 'think-point'], [3.4, 'surprised']]} enter={{kind: 'slideLeft', at: 0.2}} id="p2o" />
    <SlamTitle t={t} at={4.6} text="TREASURE" tone="gold" wash={0} y={540} />
  </Stage>
);
