import React from 'react';
import {Stage} from '../../kit/stage';
import {GlowBackdrop, Halo, Sparkles} from '../../kit/fx';
import {Headline, GlowPill} from '../../kit/text';
import {ImageAsset} from '../../kit/asset';
import {ImageHost} from '../../kit/image-host';
import {C} from '../../kit/theme';
import {ramp, ease} from '../../kit/anim';

// Pilot: generated elements (Flow / Nano Banana) animated in a scene with the host. Stills at 0.6, 2, 3.6.
const A: [string, number, number, number, number, string][] = [
  // name, x, y, width, aspect, entrance
  ['cowrie-shells', 300, 430, 300, 654 / 464, 'bounceDrop'],
  ['gold-coin', 620, 420, 250, 610 / 607, 'zoomSpin'],
  ['coin-pouch', 900, 430, 230, 528 / 604, 'jackInTheBox'],
  ['banknotes', 300, 760, 320, 675 / 527, 'backInLeft'],
  ['treasure-chest', 640, 780, 330, 753 / 701, 'pop'],
  ['credit-card', 980, 770, 300, 734 / 577, 'whipRight'],
];
export const Pilot: React.FC<{t: number}> = ({t}) => (
  <Stage>
    <GlowBackdrop t={t} id="pl" x={640} y={600} tone="gold" strength={0.8} />
    <Headline x={640} y={170} text="From shells to swipes" size={84} accent={{swipes: C.gold}} p={ramp(t, 0.1, 1, ease.linear)} />
    {A.map(([n, x, y, w, ar, kind], i) => (
      <ImageAsset key={n} slug="_pilot" name={n} x={x} y={y} w={w} ar={ar} t={t}
        enter={{kind: kind as never, p: ramp(t, 0.3 + i * 0.22, 1.1 + i * 0.22, ease.linear)}}
        attention={n === 'treasure-chest' ? {kind: 'tada', at: 2.8} : undefined} />
    ))}
    <Halo id="plh" x={640} y={780} r={260} color={C.goldLight} p={ramp(t, 2.6, 3.2)} strength={0.6} />
    <Sparkles t={t} x={640} y={740} r={200} n={5} p={ramp(t, 2.8, 3.2)} />
    <GlowPill x={640} y={1000} text="5,000 years of money" kind="caution" anchor="center" p={ramp(t, 1.8, 2.4, ease.linear)} size={50} />
    <ImageHost t={t} who="oddestory" x={1580} y={1100} h={700} flip poses={[[0, 'idea'], [2.8, 'laughing']]} enter={{kind: 'slideRight', at: 0.4}} id="plo" />
  </Stage>
);
