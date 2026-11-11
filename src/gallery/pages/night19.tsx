import React from 'react';
import {Stage} from '../../kit/stage';
import {NightScreen, WordPop, YearBadge} from '../../kit/night';
import {PlateFx} from '../../kit/night-places';
import {StoryPerson, SunsetWorld} from '../../kit/night-worlds';
import {WarWorld} from '../../kit/night-data';

// page "night19": the LIFE LAYER (PlateFx) + Claude's overlays on a world — a Flow scene plate (PlateWorld look="natural")
// takes the world's place when one exists; without Flow, the Claude-made world stays (the owner's rule). Was: a painted plate (owner 2026-11-11: plates are a helper layer, never a still
// shot): natural look + camera move + dust in the light + a year badge + a headline + story people. Render {"lang":"ar"}.
// Stills: 0.6 · 2.5 · 4.5 (natural look) · 6.5 (night look + embers).
export const NightPage19: React.FC<{t: number}> = ({t}) => {
  const night = t >= 5.5;
  return (
    <Stage bg="#0F062B">
      <NightScreen>
        {night ? <WarWorld t={t} id="ww" /> : <SunsetWorld t={t} id="sw" />}
        <PlateFx t={t} kind={night ? 'embers' : 'dust'} density={night ? 1 : 1.2} />
        {!night && <PlateFx t={t} kind="rays" />}
        <YearBadge t={t} at={0.3} year={1875} x={960} y={170} id="yb" />
        <WordPop t={t} id="hw" y={930} size={110} right={1500} words={[{w: 'خزنة', at: 1.2}, {w: 'فاضية', at: 1.6, tone: 'gold'}]} />
        <StoryPerson x={1500} y={900} s={0.9} hat="top" pose="point" t={t} id="sp1" />
      </NightScreen>
    </Stage>
  );
};
