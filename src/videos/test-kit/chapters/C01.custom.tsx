// Custom shots for C01 (builder-owned). Each: export const S<n>: React.FC<{t: number}> returning a full <Stage>.
import React from 'react';
import {Stage} from '../../../kit/stage';
import {TitleCard} from '../../../kit/text';
import {C} from '../../../kit/theme';

// S3 — PLACEHOLDER (custom shot, not built yet): globe turning to Paris
export const S3: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C01 S3" title={"globe turning to Paris"} p={1} size={44} />
  </Stage>
);
