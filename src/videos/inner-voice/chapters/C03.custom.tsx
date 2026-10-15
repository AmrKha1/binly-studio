// Custom shots for C03 (builder-owned). Each: export const S<n>: React.FC<{t: number}> returning a full <Stage>.
import React from 'react';
import {Stage} from '../../../kit/stage';
import {TitleCard} from '../../../kit/text';
import {C} from '../../../kit/theme';

// S1 — PLACEHOLDER (custom shot, not built yet): beep, wall of snapshot cards fills: image, feeling, awareness
export const S1: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C03 S1" title={"beep, wall of snapshot cards fills: image, feeli"} p={1} size={44} />
  </Stage>
);

// S2 — PLACEHOLDER (custom shot, not built yet): push into wordless card; cross out words/image; Tag Still debated
export const S2: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C03 S2" title={"push into wordless card; cross out words/image; "} p={1} size={44} />
  </Stage>
);

// S3 — PLACEHOLDER (custom shot, not built yet): pull back, card wall alive; Headline Not an empty mind.
export const S3: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C03 S3" title={"pull back, card wall alive; Headline Not an empt"} p={1} size={44} />
  </Stage>
);

// S4 — PLACEHOLDER (custom shot, not built yet): two people one room: narrator vs images; invisible dashed wall
export const S4: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C03 S4" title={"two people one room: narrator vs images; invisib"} p={1} size={44} />
  </Stage>
);

// S5 — PLACEHOLDER (custom shot, not built yet): ink: conversation with yourself; one word Keys! carries a thought
export const S5: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C03 S5" title={"ink: conversation with yourself; one word Keys! "} p={1} size={44} />
  </Stage>
);

// S7 — PLACEHOLDER (custom shot, not built yet): toddler private speech, solid bubbles, grows, bubble goes inside dashed
export const S7: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C03 S7" title={"toddler private speech, solid bubbles, grows, bu"} p={1} size={44} />
  </Stage>
);

// S8 — PLACEHOLDER (custom shot, not built yet): two heads: line between people bends back, folds inward, splits into 3 origins
export const S8: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C03 S8" title={"two heads: line between people bends back, folds"} p={1} size={44} />
  </Stage>
);
