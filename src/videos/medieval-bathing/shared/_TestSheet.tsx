// Test sheet for the shared assets (not used by the video). Render by temporarily pointing src/active.ts at
// `testActive` (export {testActive as active} from './videos/medieval-bathing/shared/_TestSheet') and run
// node tools/sheet.mjs --times 4,14,24,34 --cols 2 ; then restore src/active.ts.
import React from 'react';
import {Stage} from '../../../kit/stage';
import {C} from '../../../kit/theme';
import {Kicker} from '../../../kit/text';
import {ramp} from '../../../kit/anim';
import {VideoModule} from '../../../kit/video';
import {HeroTub, HumorWheel, Miasma, PoreSkin} from './index';

const Lbl: React.FC<{x: number; y: number; text: string; dark?: boolean}> = ({x, y, text, dark}) => <Kicker x={x} y={y} text={text} size={24} color={dark ? C.paperShade : C.inkMute} />;

const Pores1: React.FC<{t: number}> = ({t}) => (
  <Stage bg={C.paper}>
    <Lbl x={480} y={110} text="open 0" />
    <PoreSkin x={480} y={200} s={0.55} w={1500} open={0} t={t} />
    <Lbl x={1440} y={110} text="open 0.5 · heat 0.6" />
    <PoreSkin x={1440} y={200} s={0.55} w={1500} open={0.5} heat={0.6} t={t} />
    <Lbl x={480} y={440} text="open 1 · heat 1 · flowOut 1" />
    <PoreSkin x={480} y={620} s={0.55} w={1500} open={1} heat={1} flowOut={1} t={t} />
    <Lbl x={1440} y={440} text="open 1 · flowIn 1" />
    <PoreSkin x={1440} y={620} s={0.55} w={1500} open={1} flowIn={1} t={t} />
    <Lbl x={480} y={800} text="sealed 1" />
    <PoreSkin x={480} y={880} s={0.55} w={1500} open={1} sealed={1} t={t} />
    <Lbl x={1440} y={800} text="sealed 0.5" />
    <PoreSkin x={1440} y={880} s={0.55} w={1500} open={1} sealed={0.5} t={t} />
  </Stage>
);

const Pores2: React.FC<{t: number}> = ({t}) => (
  <Stage bg={C.ink}>
    <Lbl x={960} y={150} text="split · tone ink · open 1 · heat 0.5" dark />
    <PoreSkin x={960} y={560} s={1} w={1600} open={1} heat={0.5} flowOut={1} flowIn={1} split={0} tone="ink" t={t} />
    <Miasma x={980} y={200} w={820} h={260} density={0.5} toward={{x: 1300, y: 560, k: 0.8}} dark t={t} from="right" />
  </Stage>
);

const Wheel: React.FC<{t: number}> = ({t}) => (
  <Stage bg={C.paper}>
    <HumorWheel x={520} y={560} s={0.82} t={t} heatArrow={ramp(t, 20, 22)} balance={0.3} tilt={-1} />
    <rect x={960} y={0} width={960} height={1080} fill={C.ink} />
    <HumorWheel x={1440} y={560} s={0.82} t={t} highlight={0} dark />
  </Stage>
);

const Mias: React.FC<{t: number}> = ({t}) => (
  <Stage bg={C.paper}>
    <Lbl x={480} y={120} text="miasma on paper" />
    <Miasma x={100} y={180} w={760} h={360} density={0.8} t={t} />
    <Lbl x={480} y={620} text="toward a point" />
    <Miasma x={100} y={660} w={600} h={340} density={0.6} toward={{x: 820, y: 860, k: 1}} t={t} />
    <circle cx={820} cy={860} r={14} fill={C.ink} />
    <rect x={960} y={0} width={960} height={1080} fill={C.ink} />
    <Lbl x={1440} y={120} text="miasma on ink · from bottom" dark />
    <Miasma x={1060} y={180} w={760} h={800} density={0.7} dark from="bottom" p={0.8} t={t} />
  </Stage>
);

const Tub: React.FC<{t: number; split: number; bather: number; herbs: number}> = ({t, split, bather, herbs}) => (
  <Stage bg={C.paper}>
    <HeroTub x={960} y={1010} s={0.95} split={split} bather={bather} herbs={herbs} backdrop t={t} />
  </Stage>
);

const Video: React.FC<{t: number}> = ({t}) => {
  if (t < 10) return <Pores1 t={t} />;
  if (t < 20) return <Wheel t={t} />;
  if (t < 30) return <Mias t={t} />;
  if (t < 40) return <Pores2 t={t} />;
  if (t < 50) return <Tub t={t} split={0} bather={1} herbs={1} />;
  if (t < 60) return <Tub t={t} split={0.5} bather={1} herbs={1} />;
  return <Tub t={t} split={1} bather={1} herbs={1} />;
};

export const testActive: VideoModule = {meta: {slug: 'medieval-bathing', title: 'shared test', duration: 70, audio: undefined}, Video};
