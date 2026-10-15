import React from 'react';
import {Cam, Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {Headline, Kicker, Para} from '../../kit/text';
import {RichText} from '../../kit/templates';

/**
 * Text-steadiness test page (used by tools/jitter-test.mjs --kit). A slow camera drift of 0.15 px/frame in x and
 * 0.12 px/frame in y carries SVG text (Headline), HTML text (RichText, Para) and a flat reference shape. Text must
 * move exactly with the shape — no "lag then jump" sawtooth from glyph pixel-snapping. Everything is settled (p = 1).
 * Measurement boxes (screen px, valid for t = 1–2 s) live in tools/jitter-test.mjs.
 */
export const Jitter: React.FC<{t: number}> = ({t}) => (
  <Stage>
    <Cam cam={{cx: 960 + 9 * t, cy: 540 + 7.2 * t, z: 1, r: 0}}>
      <rect x={1440} y={170} width={200} height={160} fill={C.ink} />
      <Headline x={220} y={270} text="Similar conclusions" p={1} size={72} anchor="start" />
      <RichText x={220} y={390} w={1000} h={110} p={1} size={46} weight={500} mode="fade" valign="top" text="Physicians prescribed baths for fevers." />
      <Kicker x={220} y={800} text="Small caps label · 30 px" size={30} anchor="start" color={C.ink} />
      <Para x={220} y={590} w={1000} h={100} text="Heat opens the body, they believed." size={44} />
    </Cam>
  </Stage>
);
