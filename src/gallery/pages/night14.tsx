import React from 'react';
import {Stage} from '../../kit/stage';
import {GlowText, GridFloor, HostTrack, NightScreen, NightSky, NPill, Podium, RevealRing} from '../../kit/night';
import {CountNumber, HeroObject, Rays} from '../../kit/night-fx';
import {NightCity, ScienceWorld} from '../../kit/night-worlds';
import {Earth, SpaceWorld} from '../../kit/night-space';
import {WarWorld} from '../../kit/night-data';

// page "night14": the generated hero library in place (render with {"lang":"ar"}), 2.5 s each. Stills: 2.2 … 14.7.
// diamond on rays + count (1:52) · money pile + host on the stage (0:00) · ISS over Earth (7:51) · capsule on science
// (10:18) · palace + parking tile on podiums (6:23) · tank in the war world (9:03).
const el = (n: string) => `_night-test/el/${n}.png`;
export const NightPage14: React.FC<{t: number}> = ({t}) => {
  let s: React.ReactNode;
  if (t < 2.5) {
    s = (
      <>
        <Rays t={t} id="r1" tone="cyan" x={720} y={540} />
        <RevealRing t={t} at={0.2} x={720} y={540} r={330} />
        <HeroObject t={t} at={0.15} src={el('giant-diamond')} ar={1.176} x={720} y={540} h={440} glow="#7FE6FF" enter="zoom" id="d" />
        <NPill text="الوزن" x={1420} y={330} size={44} kind="white" id="p1" />
        <CountNumber t={t} at={0.5} value="3,106" x={1420} y={480} size={170} id="c1" />
        <GlowText text="قيراط" x={1420} y={640} size={110} tone="gold" id="g1" />
      </>
    );
  } else if (t < 5) {
    s = (
      <>
        <NightSky t={t} id="k2" />
        <GridFloor t={t} id="f2" />
        <HeroObject t={t} at={2.6} src={el('money-pile')} ar={1.3} x={620} y={620} h={420} glow="#2EE88B" enter="rise" id="m" />
        <NPill text="11.4 تريليون $" x={600} y={340} size={46} kind="white" id="p2" />
        <HostTrack t={t} id="h2" spots={[{at: 2.5, x: 1380, y: 1068, h: 440}]} poses={[[2.5, 'present']]} />
      </>
    );
  } else if (t < 7.5) {
    s = (
      <>
        <SpaceWorld t={t} id="s3" />
        <Earth t={t} x={960} y={1480} r={620} id="e3" lon={-40} lat={20} />
        <HeroObject t={t} at={5.1} src={el('space-station')} ar={1.57} x={960} y={430} h={380} glow="#7FB8FF" enter="drop" id="iss" />
        <NPill text="من أغلى الأشياء اللي بناها البشر" x={1300} y={110} size={44} kind="gold" id="p3" />
      </>
    );
  } else if (t < 10) {
    s = (
      <>
        <ScienceWorld t={t} id="w4" />
        <HeroObject t={t} at={7.6} src={el('antimatter-capsule')} ar={0.883} x={620} y={520} h={560} glow="#FF4FC8" enter="pop" id="cap" />
        <GlowText text="المادة المضادة" x={1350} y={520} size={130} tone="white" id="g4" />
      </>
    );
  } else if (t < 12.5) {
    s = (
      <>
        <NightSky t={t} id="k5" />
        <GridFloor t={t} id="f5" />
        <Podium x={760} base={836} w={230} h={260} id="pd1" />
        <Podium x={1120} base={836} w={200} h={190} id="pd2" />
        <HeroObject t={t} at={10.1} src={el('royal-palace')} ar={1.043} x={760} y={470} h={230} id="pal" enter="drop" />
        <HeroObject t={t} at={10.3} src={el('parking-tile')} ar={1.273} x={1120} y={560} h={170} id="park" enter="drop" />
        <NPill text="4.9 مليار £" x={760} y={300} size={44} kind="gold" id="p5" />
        <NPill text="3 مليار $" x={1120} y={420} size={40} kind="white" id="p5b" />
        <HostTrack t={t} id="h5" spots={[{at: 10, spot: 'sideLeft'}]} poses={[[10, 'point']]} />
      </>
    );
  } else {
    s = (
      <>
        <WarWorld t={t} id="w6" />
        <HeroObject t={t} at={12.6} src={el('battle-tank')} ar={1.276} x={960} y={600} h={420} glow="#FF5A3A" enter="rise" id="tank" />
        <NPill text="أغلى صراع في التاريخ" x={1450} y={160} size={46} kind="red" id="p6" />
      </>
    );
  }
  return (
    <Stage bg="#0F062B">
      <NightScreen>{s}</NightScreen>
    </Stage>
  );
};
