// Custom shots for C02 (builder-owned). Each: export const S<n>: React.FC<{t: number}> returning a full <Stage>.
import React from 'react';
import {Stage} from '../../../kit/stage';
import {TitleCard} from '../../../kit/text';
import {C} from '../../../kit/theme';

// S2 — PLACEHOLDER (custom shot, not built yet): chain Thought→Words→A voice, pull back to street of nonstop narrators
export const S2: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C02 S2" title={"chain Thought→Words→A voice, pull back to street"} p={1} size={44} />
  </Stage>
);

// S3 — PLACEHOLDER (custom shot, not built yet): street freezes; volunteer with Beeper; NameTags Hurlburt/Heavey; beep → snapshot card; USUALLY struck; snapshot circled
export const S3: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C02 S3" title={"street freezes; volunteer with Beeper; NameTags "} p={1} size={44} />
  </Stage>
);

// S5 — PLACEHOLDER (custom shot, not built yet): 6 people with snapshot strips: Never / Roughly 3 out of 4
export const S5: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C02 S5" title={"6 people with snapshot strips: Never / Roughly 3"} p={1} size={44} />
  </Stage>
);

// S7 — PLACEHOLDER (custom shot, not built yet): callback street: nonstop bubbles crack and fall apart
export const S7: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C02 S7" title={"callback street: nonstop bubbles crack and fall "} p={1} size={44} />
  </Stage>
);

// S8 — PLACEHOLDER (custom shot, not built yet): person arms crossed, inner bubble I talk to myself constantly.; split vs snapshot wall
export const S8: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C02 S8" title={"person arms crossed, inner bubble I talk to myse"} p={1} size={44} />
  </Stage>
);
