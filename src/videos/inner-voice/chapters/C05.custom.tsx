// Custom shots for C05 (builder-owned). Each: export const S<n>: React.FC<{t: number}> returning a full <Stage>.
import React from 'react';
import {Stage} from '../../../kit/stage';
import {TitleCard} from '../../../kit/text';
import {C} from '../../../kit/theme';

// S2 — PLACEHOLDER (custom shot, not built yet): aphasia: broken solid bubble vs fuller dashed inner bubble; Tag A clue, not a proof; volume slider struck
export const S2: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C05 S2" title={"aphasia: broken solid bubble vs fuller dashed in"} p={1} size={44} />
  </Stage>
);

// S3 — PLACEHOLDER (custom shot, not built yet): forecast ghost; brain command + copy → Predicted result; can't tickle yourself
export const S3: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C05 S3" title={"forecast ghost; brain command + copy → Predicted"} p={1} size={44} />
  </Stage>
);

// S4 — PLACEHOLDER (custom shot, not built yet): StudyCard Whitford & colleagues 2017
export const S4: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C05 S4" title={"StudyCard Whitford & colleagues 2017"} p={1} size={44} />
  </Stage>
);

// S6 — PLACEHOLDER (custom shot, not built yet): EEG experiment: imagined ba + heard ba → weaker; bi vs ba → no change
export const S6: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C05 S6" title={"EEG experiment: imagined ba + heard ba → weaker;"} p={1} size={44} />
  </Stage>
);

// S7 — PLACEHOLDER (custom shot, not built yet): curves overlaid; SilentWave sentence with forecast ghost; ba vs bi differ
export const S7: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C05 S7" title={"curves overlaid; SilentWave sentence with foreca"} p={1} size={44} />
  </Stage>
);

// S8 — PLACEHOLDER (custom shot, not built yet): luggage tag MINE on the inner voice; Tag A model, not a settled fact
export const S8: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C05 S8" title={"luggage tag MINE on the inner voice; Tag A model"} p={1} size={44} />
  </Stage>
);

// S9 — PLACEHOLDER (custom shot, not built yet): Measured: a brain response / Not measured: what anyone heard
export const S9: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C05 S9" title={"Measured: a brain response / Not measured: what "} p={1} size={44} />
  </Stage>
);

// S11 — PLACEHOLDER (custom shot, not built yet): jigsaw: Forecast piece solid, rest dashed
export const S11: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C05 S11" title={"jigsaw: Forecast piece solid, rest dashed"} p={1} size={44} />
  </Stage>
);
