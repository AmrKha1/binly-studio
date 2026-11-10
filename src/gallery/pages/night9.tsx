import React from 'react';
import {Stage} from '../../kit/stage';
import {GlowText, GridFloor, HostTrack, NightScreen, NightSky, NPill, WordPop} from '../../kit/night';
import {Rays} from '../../kit/night-fx';
import {BlueprintCard, ChoiceCards, CloudWorld, CoinRain, FlyingBills, MoneyPile, MysteryPillar, MysteryTile} from '../../kit/night-props';
import {CalendarCard, JourneyPath} from '../../kit/night-data';
import {Earth} from '../../kit/night-space';
import {MysteryBox} from '../../kit/night-props';

// page "night9": hook + mystery + money (render with {"lang":"ar"}), 2.5 s each. Stills: 2, 4.5, 7, 9.5, 12, 14.5.
// money pile + counting calendar + host (0:00) · journey path (0:12) · mystery pillar (0:09) + red text · choice cards
// flipping (2:47) · blueprint "?" in the clouds (7:10) · dark "?" tile + coin rain.
export const NightPage9: React.FC<{t: number}> = ({t}) => {
  let s: React.ReactNode;
  if (t < 2.5) {
    s = (
      <>
        <NightSky t={t} id="k1" />
        <GridFloor t={t} id="f1" />
        <MoneyPile t={t} x={560} y={820} s={0.85} id="mp" />
        <NPill text="28.4 تريليون $" x={480} y={380} size={40} kind="white" id="p1" />
        <CalendarCard t={t} at={0.1} x={960} y={420} from={11378} to={28391} dur={2.2} label="اليوم" pill="+ مليار $" id="cal" />
        <HostTrack t={t} id="h1" spots={[{at: 0, x: 1420, y: 1068, h: 440}]} poses={[[0, 'present']]} />
      </>
    );
  } else if (t < 5) {
    const u = t - 2.5;
    s = (
      <>
        <NightSky t={t} id="k2" horizonY={1080} />
        <WordPop t={u} y={130} size={96} words={[{w: 'رحلة', at: 0}, {w: 'بين', at: 0.15}, {w: 'أغلى', at: 0.3, tone: 'gold'}, {w: 'وأثمن', at: 0.45, tone: 'gold'}, {w: 'الأشياء', at: 0.6}]} id="wp" />
        <JourneyPath t={u} at={0} dur={1.6} x0={260} y0={735} x1={1880} y1={560} id="jp" stations={[
          {u: 0.1, node: <MysteryBox t={u} x={0} y={0} size={170} id="jb" />, dy: -140},
          {u: 0.25, node: <Earth t={u} x={0} y={0} r={80} id="je" />},
          {u: 0.45, node: <circle r={60} fill="#B98BFF" />},
          {u: 0.62, node: <circle r={60} fill="#E8EAF0" />},
          {u: 0.8, node: <circle r={60} fill="#3FD58F" />},
          {u: 0.95, node: <circle r={60} fill="#FFC928" />},
        ]} />
      </>
    );
  } else if (t < 7.5) {
    s = (
      <>
        <NightSky t={t} id="k3" />
        <GridFloor t={t} id="f3" />
        <MysteryPillar t={t} at={5.1} x={960} base={836} h={320} size={230} id="mpil" />
        <GlowText text="انسرقت!" x={1450} y={300} size={150} tone="red" id="red" />
      </>
    );
  } else if (t < 10) {
    s = (
      <>
        <Rays t={t} id="r4" tone="violet" />
        <ChoiceCards t={t} at={7.6} id="cc" cards={[
          {x: 700, y: 520, color: 'gold'},
          {x: 1220, y: 520, color: 'cyan', reveal: 8.6, content: <GlowText text="الندرة" x={0} y={120} size={90} tone="cyan" id="cc1" />},
        ]} />
        <HostTrack t={t} id="h4" spots={[{at: 7.5, spot: 'smallLeft'}]} poses={[[7.5, 'think']]} />
      </>
    );
  } else if (t < 12.5) {
    s = (
      <>
        <CloudWorld t={t} id="cw" />
        <BlueprintCard t={t} at={10.1} x={960} y={480} id="bp" />
        <GlowText text="المشروع نفسه" x={960} y={860} size={90} tone="white" id="g5" />
      </>
    );
  } else {
    s = (
      <>
        <NightSky t={t} id="k6" />
        <GridFloor t={t} id="f6" />
        <MysteryTile t={t} at={12.6} x={760} y={560} id="tile" />
        <NPill text="في بيت ثاني..." x={760} y={380} size={40} kind="white" id="p6" p={(t - 12.8) / 0.25} />
        <CoinRain t={t} at={12.5} n={14} x0={1100} x1={1800} />
        <FlyingBills t={t} at={12.7} x={1450} y={760} n={12} />
      </>
    );
  }
  return (
    <Stage bg="#0F062B">
      <NightScreen>{s}</NightScreen>
    </Stage>
  );
};
