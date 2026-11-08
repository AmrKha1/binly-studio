import React from 'react';
import {Stage} from '../../kit/stage';
import {GridFloor, HostTrack, NightScreen, NightSky, WordPop} from '../../kit/night';
import {Contender, DrawCrown, DrawDiamond, DrawGoldBar, PodiumGame} from '../../kit/night-game';

// page "night7": the podium game from data (render with {"lang":"ar"}). Demo contenders + made-up prices (test only).
// Stills: 1.8 · 4.6 (mystery) · 6.6 (×2) · 8.4 · 10.4 · 12.8 (recap).
const E: Contender[] = [
  {id: 'chest', value: 45, label: '45 مليون $', at: 0.6, src: '_night-test/el/treasure-chest.png', ar: 753 / 701},
  {id: 'crown', value: 1000, label: '1 مليار $', at: 2.6, mystery: 1.9, draw: DrawCrown},
  {id: 'diamond', value: 2000, label: '2 مليار $', at: 5.0, mystery: 4.1, draw: DrawDiamond, times: '×2', timesAt: 6.2},
  {id: 'bar', value: 3000, label: '3 مليار $', at: 7.6, draw: DrawGoldBar},
  {id: 'coin', value: 4900, label: '4.9 مليار $', at: 9.6, mystery: 9.0, src: '_night-test/el/gold-coin.png', ar: 610 / 607},
];
export const NightPage7: React.FC<{t: number}> = ({t}) => (
  <Stage bg="#0F062B">
    <NightScreen>
      <NightSky t={t} id="g7" />
      <GridFloor id="g7" t={t} />
      <PodiumGame t={t} id="pg" entries={E} recapAt={11.6} />
      {t >= 11.6 && <WordPop t={t} id="q" y={985} size={78} right={1360} words={[{w: 'إيش', at: 11.9}, {w: 'هو', at: 12.0}, {w: 'أغلى', at: 12.1, tone: 'gold'}, {w: 'شيء', at: 12.25}, {w: 'موجود؟', at: 12.35}]} />}
      <HostTrack t={t} id="h7" enter={{kind: 'pop', at: 0}}
        spots={[{at: 0, spot: 'sideLeft'}, {at: 11.6, spot: 'smallLeft', dur: 0.7}]}
        poses={[[0, 'present'], [2.6, 'point'], [5.0, 'react'], [7.6, 'viewer'], [9.6, 'point'], [11.6, 'think']]} />
    </NightScreen>
  </Stage>
);
