// Cloud smoke test of templates + Photo + Globe (not a real video).
import React from 'react';
import {VideoModule} from '../../kit/video';
import {Shots} from '../../kit/shots';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {ramp} from '../../kit/anim';
import {StatShot, EvidenceShot, TitleShot} from '../../kit/templates';
import {Globe} from '../../kit/depth';
import META from '../../../videos/test-kit/video.json';

const GlobeShot: React.FC<{t: number}> = ({t}) => (
  <Stage bg={C.ink}>
    <Globe x={960} y={540} r={380} rotate={[-10 + (t - 15) * 6, -40]} p={ramp(t, 15, 16)} night={0.5} rim
      highlight={[{countries: ['France'], color: C.oxLight, p: ramp(t, 16, 17)}]} pins={[{lon: 2.35, lat: 48.85, label: 'Paris'}]} />
  </Stage>
);
const Video: React.FC<{t: number}> = ({t}) => (
  <Shots t={t} shots={[
    {start: 0, render: (t) => <TitleShot t={t} a={0} b={5} kicker="Kit test" title="Templates in the cloud" />},
    {start: 5, in: {kind: 'ink'}, render: (t) => <StatShot t={t} a={5} b={10} value="26" unit="%" label="test number" at={5.6} compare={{kind: 'dots', filled: 26}} compareAt={6.5} />},
    {start: 10, in: {kind: 'paper', dir: 'left'}, render: (t) => <EvidenceShot t={t} a={10} b={15} slug="test-dinos" src="img/tournai.jpg" aspect={801 / 482} caption="Burial of plague victims, Tournai, 1349" credit="Pierart dou Tielt · Public domain" mark={{rx: 0.32, ry: 0.55, rw: 0.3, rh: 0.48, at: 11.5}} />},
    {start: 15, in: {kind: 'iris'}, render: (t) => <GlobeShot t={t} />},
  ]} />
);
export const active: VideoModule = {meta: {slug: META.slug, title: META.title, duration: META.duration, audio: META.audio}, Video};
