import React from 'react';
import {Stage} from '../../kit/stage';
import {HostTrack, NightScreen, NPill, YearBadge} from '../../kit/night';
import {Bubble, CountNumber, Stamp} from '../../kit/night-fx';
import {Flag, HoloRing, MapShape, MoneyBag, NightCity, PaperMap, PriceTag, RoomWorld, Route, ScienceWorld, StoryPerson, SunsetWorld} from '../../kit/night-worlds';

// page "night5": the story worlds of the AZTIKA look, 2 s each (render with {"lang":"ar"}). Stills: 1.6, 3.6, 5.6, 7.6, 9.6.
// sunset + year badge · paper map + flag + price tag + stamp · science + holo ring + count · night city + pill · room +
// story people + bubble.
const WEST = 'M320 300 L420 285 L670 300 L760 600 L900 700 L1040 760 L940 775 L860 880 L760 780 L480 715 L400 650 L330 430 Z';
const MID = 'M670 300 L1000 315 L1040 360 L1010 450 L1040 700 L1030 760 L900 700 L760 600 Z';
const EAST = 'M1000 315 L1050 345 L1130 340 L1160 390 L1210 380 L1250 420 L1410 330 L1440 370 L1320 470 L1260 600 L1240 720 L1280 820 L1250 880 L1180 760 L1040 740 L1040 700 L1010 450 L1040 360 Z';

export const NightPage5: React.FC<{t: number}> = ({t}) => {
  let s: React.ReactNode;
  if (t < 2) {
    s = (
      <>
        <SunsetWorld t={t} id="w1" />
        <YearBadge t={t} at={0.2} year={1503} from={1506} x={960} y={500} label="سنة" place="إيطاليا" id="yb" size={270} />
      </>
    );
  } else if (t < 4) {
    s = (
      <>
        <PaperMap t={t} id="w2" />
        <MapShape d={WEST} fill="#C9B88A" />
        <MapShape d={MID} fill="#3E57D6" p={(t - 2.1) / 0.3} />
        <MapShape d={EAST} fill="#33AE6E" />
        <Flag x={878} y={580} colors={['#2340A8', '#FFFFFF', '#D21034']} t={t} at={2.3} />
        <Route d="M880 600 Q1100 520 1350 640" p={(t - 2.4) / 0.8} id="rt" />
        <NPill text="صفقة لويزيانا" x={1520} y={150} size={58} kind="gold" id="p2" p={(t - 2.2) / 0.25} />
        <PriceTag text="15 مليون $" x={1600} y={310} p={(t - 2.6) / 0.3} />
        <Stamp t={t} at={3.0} text="تم البيع" x={920} y={720} size={110} />
      </>
    );
  } else if (t < 6) {
    s = (
      <>
        <ScienceWorld t={t} id="w3" />
        <HoloRing x={560} y={960} t={t} />
        <NPill text="قيمة أعضاء جسمك" x={1290} y={330} size={50} kind="cyan" id="p3" p={(t - 4.2) / 0.25} />
        <CountNumber t={t} at={4.4} value="45,000,000 $" x={1290} y={510} size={140} tone="white" id="c3" dur={1.0} />
      </>
    );
  } else if (t < 8) {
    s = (
      <>
        <NightCity t={t} id="w4" />
        <NPill text="من أهم المناطق المالية في العالم" x={960} y={165} size={58} kind="gold" id="p4" p={(t - 6.2) / 0.25} />
        <HostTrack t={t} id="h4" spots={[{at: 6, spot: 'closeRight'}]} poses={[[6, 'react']]} enter={{kind: 'rise', at: 6.3}} />
      </>
    );
  } else {
    s = (
      <>
        <RoomWorld t={t} id="w5" />
        <StoryPerson x={700} y={1010} s={1.05} body="#8A5A3A" hat="beret" hatColor="#B0182E" id="sp1" t={t} />
        <StoryPerson x={1230} y={1010} s={1.05} body="#7A3FC8" hat="top" hatColor="#3A1A6E" pose={t > 8.4 ? 'point' : 'idle'} flip id="sp2" t={t} />
        <MoneyBag x={1390} y={1010} />
        <Bubble t={t} at={8.4} lines={['ارسم لي', 'زوجتي؟']} x={1030} y={430} tx={1200} ty={600} size={70} />
      </>
    );
  }
  return (
    <Stage bg="#0F062B">
      <NightScreen>{s}</NightScreen>
    </Stage>
  );
};
