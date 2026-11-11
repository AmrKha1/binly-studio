import React from 'react';
import {Stage} from '../../kit/stage';
import {GridFloor, NightScreen, NightSky, NPill} from '../../kit/night';
import {HeroObject, Rays} from '../../kit/night-fx';
import {coinArt, documentArt, driveArt} from '../../kit/night-objects';

// page "night17": the HERO FINISH on Claude-drawn objects, side by side with a Flow-made hero (the giant diamond) —
// the quality bar: a code-drawn object must look as rich, glowing and modern. Render with {"lang":"ar"}.
// Stills: 1.2 (all four, settled) · 0.25 (mid-pop) · 2.6 (light sweep across).
const el = (n: string) => `_night-test/el/${n}.png`;
export const NightPage17: React.FC<{t: number}> = ({t}) => (
  <Stage bg="#0F062B">
    <NightScreen>
      <NightSky t={t} id="s17" />
      <Rays t={t} id="r17" tone="violet" x={960} y={500} />
      <GridFloor id="f17" t={t} />
      <HeroObject t={t} at={0.1} src={el('giant-diamond')} ar={1.176} x={330} y={470} h={300} glow="#7FE6FF" id="dia" />
      <HeroObject t={t} at={0.1} draw={coinArt('₿')} ar={1} x={790} y={470} h={300} id="coin" />
      <HeroObject t={t} at={0.1} draw={documentArt()} ar={0.78} x={1180} y={470} h={320} id="doc" glow="#FFE3A0" />
      <HeroObject t={t} at={0.1} draw={driveArt()} ar={0.72} x={1580} y={470} h={300} id="drv" glow="#5CF2FF" />
      <NPill text="Flow" x={330} y={700} size={40} kind="white" id="l1" />
      <NPill text="بيتكوين" x={790} y={700} size={40} kind="gold" id="l2" />
      <NPill text="عقد" x={1180} y={700} size={40} kind="gold" id="l3" />
      <NPill text="هارديسك" x={1580} y={700} size={40} kind="gold" id="l4" />
    </NightScreen>
  </Stage>
);
