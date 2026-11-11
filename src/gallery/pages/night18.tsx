import React from 'react';
import {Stage} from '../../kit/stage';
import {GridFloor, NightScreen, NightSky} from '../../kit/night';
import {StairGame, stairCamT, type StairEntry} from '../../kit/night-game';
import {coinArt, documentArt, driveArt} from '../../kit/night-objects';

// page "night18": the STAIR GAME — 3 cases climb (0.3 · 1.6 · 2.9), the summit «؟» waits (4.2), the twist takes it
// (5.6, «الأغلى»), recap (7.6). Render with {"lang":"ar"}. Stills: 1.2 · 3.6 · 4.9 · 6.6 · 8.6.
const E: StairEntry[] = [
  {id: 'a', label: '150 مليون $', at: 0.3, draw: documentArt(), ar: 0.78},
  {id: 'b', label: '600 مليون $', at: 1.6, draw: driveArt(), ar: 0.72, glow: '#5CF2FF'},
  {id: 'c', label: '785 مليون $', at: 2.9, draw: coinArt('₿'), ar: 1},
  {id: 'z', label: '4 مليون £', at: 5.6, draw: documentArt(), ar: 0.78, twist: true},
];
const P = {entries: E, summitAt: 4.2, recapAt: 7.6, topLabel: 'الأغلى'};
export const NightPage18: React.FC<{t: number}> = ({t}) => (
  <Stage bg="#0F062B">
    <NightScreen>
      <NightSky t={t} id="s18" />
      <g transform={stairCamT(t, P)}>
        <GridFloor id="f18" t={t} wide />
        <StairGame t={t} id="stairs" {...P} />
      </g>
    </NightScreen>
  </Stage>
);
