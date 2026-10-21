import React from 'react';
import {Stage} from '../../kit/stage';
import {BgPlate} from '../../kit/asset';
import {ImageHost} from '../../kit/image-host';
import {Headline, SayPop, Stat} from '../../kit/text';
import {C} from '../../kit/theme';
import {ramp, ease} from '../../kit/anim';

// "alive": SayPop words above the host as they're "spoken" (fake timings), sticker number, Poppins headline. Stills 1.6, 3.
const SPOKEN: [number, number, string][] = [[0.4, 0.6, 'more'], [0.65, 0.8, 'than'], [0.85, 1.3, '98'], [1.35, 1.8, 'percent'], [1.85, 2.0, 'of'], [2.05, 2.2, 'the'], [2.25, 2.6, 'time!']];
export const Alive: React.FC<{t: number}> = ({t}) => (
  <Stage>
    <BgPlate slug="_pilot" file="treasury.jpg" t={t} a={0} b={4} push="in" amount={0.04} />
    <Headline x={700} y={190} text="The brain knows first" size={92} accent={{brain: C.gold}} p={ramp(t, 0.1, 1.1, ease.linear)} />
    <Stat x={700} y={620} value="98%" p={ramp(t, 0.8, 1.6, ease.linear)} size={230} count={false} sticker="#2F4C8C" />
    <ImageHost t={t} who="oddestory" x={1560} y={1110} h={720} flip poses={[[0, 'idea']]} talk={0.6} id="al" />
    <SayPop t={t} x={1430} y={300} spoken={SPOKEN} from={0} to={3} accent={{'98': C.gold}} tail="down-right" />
  </Stage>
);
