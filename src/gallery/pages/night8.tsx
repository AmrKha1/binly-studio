import React from 'react';
import {Stage} from '../../kit/stage';
import {GlowText, NightScreen, NPill, RevealRing} from '../../kit/night';
import {Rays} from '../../kit/night-fx';
import {Asteroid, AsteroidField, Astronaut, Earth, Galaxy, ISS, Orbiters, Planet, SpaceWorld, Sun} from '../../kit/night-space';

// page "night8": the SPACE chapter (render with {"lang":"ar"}), 2 s each. Stills: 1.5, 3.5, 5.5, 7.5, 9.5, 11.5.
// ISS over Earth (7:51) · astronaut tethered to the ISS (8:30) · Earth + orbiters (8:40) · asteroid cut-away (13:20) ·
// sun on orange rays (13:40) · galaxy + planets (13:50 / 14:12).
export const NightPage8: React.FC<{t: number}> = ({t}) => {
  let s: React.ReactNode;
  if (t < 2) {
    s = (
      <>
        <SpaceWorld t={t} id="s1" />
        <Earth t={t} x={960} y={1480} r={620} id="e1" lon={-40} lat={20} />
        <ISS x={980} y={430} s={0.95} t={t} />
        <NPill text="من أغلى الأشياء اللي بناها البشر" x={1300} y={120} size={44} kind="gold" id="p1" />
      </>
    );
  } else if (t < 4) {
    s = (
      <>
        <SpaceWorld t={t} id="s2" />
        <Earth t={t} x={960} y={1480} r={620} id="e2" lon={-40} lat={20} />
        <ISS x={1340} y={430} s={0.7} t={t} />
        <Astronaut x={620} y={470} s={0.75} t={t} tx={1180} ty={430} />
      </>
    );
  } else if (t < 6) {
    s = (
      <>
        <SpaceWorld t={t} id="s3" />
        <Earth t={t} x={640} y={600} r={230} id="e3" at={4.05} />
        <Orbiters t={t} x={640} y={600} rx={400} ry={380} n={10} at={4.3} />
        <NPill text="لما العالم يتعاون" x={1450} y={240} size={56} kind="green" id="p3" p={(t - 4.4) / 0.25} />
      </>
    );
  } else if (t < 8) {
    s = (
      <>
        <SpaceWorld t={t} id="s4" />
        <AsteroidField t={t} n={14} seed={4} id="af" avoid={{x: 960, y: 560, r: 420}} />
        <Sun t={t} x={260} y={250} r={70} id="sun4" />
        <Asteroid x={960} y={580} r={280} seed={2} rot={-8} cut={(t - 6.4) / 0.6} id="big" />
        <NPill text="مليانة معادن" x={980} y={210} size={52} kind="white" id="p4" p={(t - 6.6) / 0.25} />
        <NPill text="حديد" x={1500} y={330} size={46} kind="grey" id="p4b" p={(t - 7.0) / 0.25} />
      </>
    );
  } else if (t < 10) {
    s = (
      <>
        <Rays t={t} id="r5" tone="orange" x={960} y={620} />
        <Sun t={t} x={960} y={620} r={300} id="sun5" at={8.1} />
        <RevealRing t={t} at={8.1} x={960} y={620} r={380} />
        <GlowText text="الشمس" x={960} y={130} size={120} tone="gold" id="g5" />
      </>
    );
  } else {
    s = (
      <>
        <SpaceWorld t={t} id="s6" />
        <Galaxy t={t} x={1350} y={300} r={330} id="gx" at={10.05} />
        <Galaxy t={t} x={330} y={820} r={150} id="gx2" tilt={0.5} rot={-60} n={260} />
        <Earth t={t} x={520} y={420} r={70} id="e6" glow={0.8} />
        <Sun t={t} x={1460} y={860} r={70} id="sun6" />
        <Planet x={1000} y={760} r={60} ring id="pl" t={t} />
        <GlowText text="مفهوم السعر" x={1500} y={110} size={100} tone="white" id="g6" />
      </>
    );
  }
  return (
    <Stage bg="#01010A">
      <NightScreen>{s}</NightScreen>
    </Stage>
  );
};
