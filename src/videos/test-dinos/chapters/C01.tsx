import React from 'react';
import {Stage} from '../../../kit/stage';
import {TitleCard} from '../../../kit/text';
import {C} from '../../../kit/theme';

// C01 · 0.00–26.40 s · "The photograph that doesn't exist" — PLACEHOLDER (not built yet)
export const C01: React.FC<{t: number}> = ({t}) => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="placeholder · C01" title={"The photograph that doesn't exist"} p={1} size={64} />
    <text x={960} y={760} textAnchor="middle" fontFamily="Inter" fontSize={36} fill={C.inkMute}>{t.toFixed(1)} s</text>
  </Stage>
);
