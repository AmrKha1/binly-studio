// Pipeline smoke test (not a real video): exercises heavy kit parts in the cloud render.
import React from 'react';
import {VideoModule} from '../../kit/video';
import {Shots} from '../../kit/shots';
import {Stage, World, breathe} from '../../kit/stage';
import {C} from '../../kit/theme';
import {camAt, ramp} from '../../kit/anim';
import {Headline, Stamp, Stat} from '../../kit/text';
import {Person, Crowd} from '../../kit/people';
import {Steam} from '../../kit/fx';
import {Street} from '../../kit/env';
import META from '../../../videos/test-smoke/video.json';

const A: React.FC<{t: number}> = ({t}) => (
  <Stage>
    <Headline x={960} y={420} text="Smoke test" p={ramp(t, 0.2, 1.2)} size={110} mode="words" />
    <Stamp x={960} y={620} text="Cloud render" p={ramp(t, 2, 2.5)} />
    <Stat x={960} y={900} value="47,000" label="frames" p={ramp(t, 3, 5)} size={120} />
  </Stage>
);
const B: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[6, 960, 540, 1.3], [14, 1100, 520, 1]]), t);
  return (
    <Stage bg={C.sky}>
      <World cam={cam} layers={[{depth: 0.6, el: <Street />}, {depth: 1, el: <g><Crowd x={960} y={1000} w={1200} n={8} t={t} era="medieval" /><Person x={500} y={1020} t={t} walk={t * 0.9} outfit="robe" hat="hood" /></g>}]} />
      <Steam t={t} x={1500} y={900} />
    </Stage>
  );
};
const Video: React.FC<{t: number}> = ({t}) => (
  <Shots t={t} shots={[{start: 0, render: (t) => <A t={t} />}, {start: 6, in: {kind: 'ink', x: 960, y: 540}, render: (t) => <B t={t} />}]} />
);
export const active: VideoModule = {meta: {slug: META.slug, title: META.title, duration: META.duration, audio: META.audio}, Video};
