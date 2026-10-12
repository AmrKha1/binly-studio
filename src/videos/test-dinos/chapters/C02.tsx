import React from 'react';
import {Stage} from '../../../kit/stage';
import {TitleCard} from '../../../kit/text';
import {C} from '../../../kit/theme';

// C02 · 26.40–56.35 s · "We've been wrong before" — PLACEHOLDER (not built yet)
export const C02: React.FC<{t: number}> = ({t}) => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="placeholder · C02" title={"We've been wrong before"} p={1} size={64} />
    <text x={960} y={760} textAnchor="middle" fontFamily="Inter" fontSize={36} fill={C.inkMute}>{t.toFixed(1)} s</text>
  </Stage>
);
