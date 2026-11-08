import React from 'react';
import {Stage} from '../../kit/stage';
import {ImageHost} from '../../kit/image-host';
import {GridFloor, HostGlow, HostTrack, NightScreen, NightSky, NPill, Podium, RevealRing, WordPop, YearBadge} from '../../kit/night';

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

// page "night3": AZTIKA alive — moves around the frame between beats (stills 0.8, 1.75, 2.6, 4.2, 5.4, 6.8).
// left presenting → hops to centre-front, big, close to the viewer → glides right and points back at the podium →
// sinks to peek up from the bottom-left corner, thinking.
export const NightPage3: React.FC<{t: number}> = ({t}) => (
  <Stage bg="#0F062B">
    <NightScreen>
      <NightSky t={t} id="n3" />
      <GridFloor id="n3" t={t} />
      <Podium x={960} base={836} w={250} h={216} id="n3p" grow={(t - 0.1) / 0.5} />
      <NPill text="45 مليون $" x={960} y={560} size={60} kind="gold" id="n3q" p={(t - 0.4) / 0.25} />
      <WordPop t={t} id="n3w" y={200} size={140} right={1180} words={[{w: 'أنت', at: 2.2}, {w: 'غالي!', at: 2.45, tone: 'gold'}]} />
      <HostTrack t={t} id="n3h" enter={{kind: 'pop', at: 0}}
        spots={[
          {at: 0, x: 420, y: 1068, h: 340},
          {at: 1.5, x: 1400, y: 1180, h: 470},
          {at: 3.6, x: 1560, y: 1068, h: 340, move: 'glide', dur: 0.8},
          {at: 5.0, x: 260, y: 1250, h: 360, move: 'hop', dur: 0.7},
        ]}
        poses={[[0, 'full-present'], [1.5, 'full-thumbsup-wink'], [3.6, 'full-point-right'], [5.0, 'full-thinking']]} />
    </NightScreen>
  </Stage>
);
