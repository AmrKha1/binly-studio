// Custom shots for C08 (builder-owned). Each: export const S<n>: React.FC<{t: number}> returning a full <Stage>.
import React from 'react';
import {Stage} from '../../../kit/stage';
import {TitleCard} from '../../../kit/text';
import {C} from '../../../kit/theme';

// S1 — PLACEHOLDER (custom shot, not built yet): you on a train; one-mind dome; copies of your bubble over everyone
export const S1: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C08 S1" title={"you on a train; one-mind dome; copies of your bu"} p={1} size={44} />
  </Stage>
);

// S2 — PLACEHOLDER (custom shot, not built yet): neighbour's copied bubble peels off, real content images/feelings
export const S2: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C08 S2" title={"neighbour's copied bubble peels off, real conten"} p={1} size={44} />
  </Stage>
);

// S3 — PLACEHOLDER (custom shot, not built yet): beeper freeze: Words? A picture? A feeling?; USUALLY struck; moment circled; summaries vs moments
export const S3: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C08 S3" title={"beeper freeze: Words? A picture? A feeling?; USU"} p={1} size={44} />
  </Stage>
);

// S4 — PLACEHOLDER (custom shot, not built yet): two people on bench: Do you hear a voice? struck; What was in your head just then?
export const S4: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C08 S4" title={"two people on bench: Do you hear a voice? struck"} p={1} size={44} />
  </Stage>
);

// S5 — PLACEHOLDER (custom shot, not built yet): bookend DecoderRig night: four words, cable, screen, flat line, hero wave
export const S5: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C08 S5" title={"bookend DecoderRig night: four words, cable, scr"} p={1} size={44} />
  </Stage>
);

// S6 — PLACEHOLDER (custom shot, not built yet): final: line between two heads; dashed line curls inside one head into a lit little house
export const S6: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C08 S6" title={"final: line between two heads; dashed line curls"} p={1} size={44} />
  </Stage>
);

// S7 — PLACEHOLDER (custom shot, not built yet): pull back to paper; Kicker SOURCES IN THE DESCRIPTION
export const S7: React.FC<{t: number}> = () => (
  <Stage bg={C.paperShade}>
    <TitleCard kicker="custom shot · C08 S7" title={"pull back to paper; Kicker SOURCES IN THE DESCRI"} p={1} size={44} />
  </Stage>
);
