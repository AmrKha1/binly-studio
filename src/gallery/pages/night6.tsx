import React from 'react';
import {Stage} from '../../kit/stage';
import {GlowText, NightScreen, NPill, RevealRing} from '../../kit/night';
import {Bokeh, HeroObject, Rays} from '../../kit/night-fx';

// page "night6": HeroObject on the night look (test cut-outs from library/art — white-mode style, for mechanics only).
// Stills: 1.2 (chest settled, shine passing), 2.8 (coin, cyan glow).
export const NightPage6: React.FC<{t: number}> = ({t}) => (
  <Stage bg="#0F062B">
    <NightScreen>
      {t < 2 ? (
        <>
          <Rays t={t} id="h1" tone="violet" x={760} y={540} />
          <Bokeh t={t} />
          <RevealRing t={t} at={0.2} x={760} y={540} r={300} />
          <HeroObject t={t} at={0.15} src="_night-test/el/treasure-chest.png" ar={753 / 701} x={760} y={560} h={480} glow="#FFC928" enter="rise" id="chest" />
          <GlowText text="الكنز" x={1450} y={500} size={170} tone="gold" id="g1" />
        </>
      ) : (
        <>
          <Rays t={t} id="h2" tone="cyan" x={1100} y={560} />
          <Bokeh t={t} color="#57D9FA" seed={4} />
          <HeroObject t={t} at={2.05} src="_night-test/el/gold-coin.png" ar={610 / 607} x={1100} y={560} h={420} glow="#57D9FA" enter="zoom" id="coin" />
          <NPill text="عملة ذهبية" x={520} y={540} size={64} kind="cyan" id="p2" p={(t - 2.3) / 0.25} />
        </>
      )}
    </NightScreen>
  </Stage>
);
