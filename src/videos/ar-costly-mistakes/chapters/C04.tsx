import React from 'react';
import {Stage} from '../../../kit/stage';
import {GlowText, NightScreen, NightSky} from '../../../kit/night';

// C04 · 179.48–732.18 s · "…" — PLACEHOLDER (not built yet)
export const C04: React.FC<{t: number}> = ({t}) => (
  <Stage bg="#0F062B">
    <NightScreen>
      <NightSky t={t} id="ph-C04" />
      <GlowText text={"…"} x={960} y={500} size={84} tone="gold" id="ph-t-C04" />
      <GlowText text={`C04 · ${t.toFixed(1)}`} x={960} y={640} size={48} id="ph-s-C04" />
    </NightScreen>
  </Stage>
);
