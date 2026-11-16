// Custom shots for C04 (builder-owned, AZTIKA). Each: export const S<n>: React.FC<{t: number}> returning the shot's WORLD
// (SVG, no <Stage>/<NightScreen> — the chapter provides them; NightShots joins, drifts and pins the host).
import React from 'react';
import {GlowText, NightSky} from '../../../kit/night';

// S1 — PLACEHOLDER (custom shot, not built yet): split stage, a thin glowing vertical seam in the middle. RIGHT half (grey rain, cold): Howells (StoryPerson man, grey rim #9AA3B5) swings th
export const S1: React.FC<{t: number}> = ({t}) => (
  <>
    <NightSky t={t} id="ph-C04-S1" />
    <GlowText text={"split stage, a thin glowing vertical sea"} x={960} y={540} size={56} id="pht-C04-S1" />
  </>
);

// S2 — PLACEHOLDER (custom shot, not built yet): RoomWorld (warm wall, night window). YearBadge counts BACK 2013 → 2010 on سنة 186.32 (lands 186.75, riser). On البيتكوين 187.20 the bitcoin-
export const S2: React.FC<{t: number}> = ({t}) => (
  <>
    <NightSky t={t} id="ph-C04-S2" />
    <GlowText text={"RoomWorld (warm wall, night window). Yea"} x={960} y={540} size={56} id="pht-C04-S2" />
  </>
);

// S4 — PLACEHOLDER (custom shot, not built yet): same warm room, night: Laszlo = StoryPerson programmer + glasses, prop laptop, gold rim, at a desk (screen glow on his face). White NPill «م
export const S4: React.FC<{t: number}> = ({t}) => (
  <>
    <NightSky t={t} id="ph-C04-S4" />
    <GlowText text={"same warm room, night: Laszlo = StoryPer"} x={960} y={540} size={56} id="pht-C04-S4" />
  </>
);

// S5 — PLACEHOLDER (custom shot, not built yet): ★ BALANCE SCALE (build in the chapter): a tall gold balance on a glowing podium in the warm room going dark-purple; RIGHT pan = two-pizzas (
export const S5: React.FC<{t: number}> = ({t}) => (
  <>
    <NightSky t={t} id="ph-C04-S5" />
    <GlowText text={"★ BALANCE SCALE (build in the chapter): "} x={960} y={540} size={56} id="pht-C04-S5" />
  </>
);

// S6 — PLACEHOLDER (custom shot, not built yet): NightSky + GridFloor; on نحسبها 204.20 the old «2010» YearBadge (top) spins forward and turns into a gold NPill «اليوم» on اليوم 204.60 (no 
export const S6: React.FC<{t: number}> = ({t}) => (
  <>
    <NightSky t={t} id="ph-C04-S6" />
    <GlowText text={"NightSky + GridFloor; on نحسبها 204.20 t"} x={960} y={540} size={56} id="pht-C04-S6" />
  </>
);

// S7 — PLACEHOLDER (custom shot, not built yet): the coin with its «78 ألف و500 $» tag slides top-left and a gold «× 10000» drops beside it on البيتزتين 209.56; the two-pizzas (art) rise bi
export const S7: React.FC<{t: number}> = ({t}) => (
  <>
    <NightSky t={t} id="ph-C04-S7" />
    <GlowText text={"the coin with its «78 ألف و500 $» tag sl"} x={960} y={540} size={56} id="pht-C04-S7" />
  </>
);

// S9 — PLACEHOLDER (custom shot, not built yet): NightSky + GridFloor, Lineup of 4 round frames right → left: «مطعم» (a small restaurant front) ✖ on مطعم 217.59 · «سلسلة مطاعم» (three front
export const S9: React.FC<{t: number}> = ({t}) => (
  <>
    <NightSky t={t} id="ph-C04-S9" />
    <GlowText text={"NightSky + GridFloor, Lineup of 4 round "} x={960} y={540} size={56} id="pht-C04-S9" />
  </>
);

// S10 — PLACEHOLDER (custom shot, not built yet): split again (rhymes with S1): RIGHT Howells (man, grey rim) on a grey landfill strip, «هاولز» white pill on هاولز 222.94; on ما استفاد 223.7
export const S10: React.FC<{t: number}> = ({t}) => (
  <>
    <NightSky t={t} id="ph-C04-S10" />
    <GlowText text={"split again (rhymes with S1): RIGHT Howe"} x={960} y={540} size={56} id="pht-C04-S10" />
  </>
);

// S11 — PLACEHOLDER (custom shot, not built yet): OPEN LOOP (tease, no total): MistakeBill (shared) «فاتورة البيتزا» drops in on انتبه 226.24; a small gold bookmark pill «بنرجع له في النهاية
export const S11: React.FC<{t: number}> = ({t}) => (
  <>
    <NightSky t={t} id="ph-C04-S11" />
    <GlowText text={"OPEN LOOP (tease, no total): MistakeBill"} x={960} y={540} size={56} id="pht-C04-S11" />
  </>
);
