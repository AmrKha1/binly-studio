import React from 'react';
import {Stage} from '../../kit/stage';
import {ImageHost} from '../../kit/image-host';
import {GridFloor, HostGlow, NightScreen, NightSky, NPill, Podium, RevealRing, WordPop, YearBadge} from '../../kit/night';

// page "night": copy test of the model video's 0:26.2 frame («أنت غالي!» + gold pill + green podium + host bottom-left).
// Still at 2.0 = the settled frame; 0.9–1.5 = the word-by-word pop. AZTIKA reacts: presents the stage → points at the
// podium as it rises → surprised at the price → thumbs-up + wink to the viewer on «أنت غالي!». Render with {"lang":"ar"}.
export const NightPage: React.FC<{t: number}> = ({t}) => (
  <Stage bg="#0F062B">
    <NightScreen>
      <NightSky t={t} id="np" />
      <GridFloor id="np" t={t} />
      <Podium x={870} base={836} w={250} h={216} id="np1" grow={(t - 0.2) / 0.5} />
      <RevealRing t={t} at={0.35} x={870} y={470} />
      <NPill text="45 مليون $" x={868} y={266} size={60} kind="gold" id="np2" p={(t - 0.6) / 0.25} />
      <WordPop t={t} id="np3" y={318} size={150} right={1650} words={[{w: 'أنت', at: 0.9}, {w: 'غالي!', at: 1.2, tone: 'gold'}]} />
      <HostGlow id="nph">
        <ImageHost t={t} x={480} y={1068} h={340} poses={[[0, 'full-present'], [0.3, 'full-point-right'], [0.65, 'full-surprised'], [1.0, 'full-thumbsup-wink']]} shadow={false} id="nph" />
      </HostGlow>
    </NightScreen>
  </Stage>
);

// page "night2": year badge counting back (0:40) on the night sky — stills at 0.2, 0.5, 1.0.
export const NightPage2: React.FC<{t: number}> = ({t}) => (
  <Stage bg="#0F062B">
    <NightScreen>
      <NightSky t={t} id="np2" />
      <GridFloor id="np2" t={t} />
      <YearBadge t={t} at={0.1} year={1503} from={1506} x={960} y={420} label="سنة" place="إيطاليا" id="yb" />
    </NightScreen>
  </Stage>
);
