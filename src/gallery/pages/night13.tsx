import React from 'react';
import {Stage} from '../../kit/stage';
import {NightScreen, NightSky, NPill} from '../../kit/night';
import {Flag, PaperMap} from '../../kit/night-worlds';
import {Stamp} from '../../kit/night-fx';
import {NeonLines, NightMap, nightProj} from '../../kit/night-maps';
import {ChapterTitle, QuoteCard} from '../../kit/night-story';
import {PlateWorld} from '../../kit/night-places';
import {StoryPerson} from '../../kit/night-worlds';

// page "night13": maps + quote + chapter title + painted plate (render with {"lang":"ar"}), 3 s each.
// Stills: 2.6, 5.6, 8.6, 11.6, 14.6.
// paper map: Louisiana spreads over the US (2:52–3:27) · neon map + routes (6:40) · empire spreading from Rome ·
// quote card · painted plate with the running chapter title.
const US = 'United States of America';
export const NightPage13: React.FC<{t: number}> = ({t}) => {
  let s: React.ReactNode;
  if (t < 3) {
    const pj = nightProj([[-128, 22], [-64, 52]], 1500, 900, 210, 120);
    const [fx, fy] = pj(-98, 40);
    s = (
      <>
        <PaperMap t={t} id="pm" />
        <NightMap t={t} id="m1" region={[[-128, 22], [-64, 52]]} x={210} y={120} w={1500} h={900} areas={[
          {countries: [US], fill: '#F3EAD3'},
          {countries: [US], fill: '#33AE6E', at: 0.4, spread: [-90, 30], dur: 1.6},
        ]} />
        <Flag x={fx} y={fy} colors={['#B22234', '#FFFFFF', '#3C3B6E']} horizontal t={t} at={1.6} />
        <NPill text="صفقة لويزيانا" x={1600} y={110} size={48} kind="gold" id="p1" />
        <Stamp t={t} at={2.1} text="تم البيع" x={760} y={760} />
      </>
    );
  } else if (t < 6) {
    const pj = nightProj([[-128, 22], [-64, 52]], 1400, 860, 260, 140);
    const city = (lon: number, lat: number) => pj(lon, lat);
    s = (
      <>
        <rect x={0} y={0} width={1920} height={1080} fill="#060B22" />
        <NightSky t={t} id="k2" horizonY={1080} stars={30} />
        <NightMap t={t} id="m2" mode="neon" region={[[-128, 22], [-64, 52]]} x={260} y={140} w={1400} h={860} areas={[{countries: [US], fill: '#0B1A44', at: 3.05}]} />
        <NeonLines t={t} at={3.5} id="nl" lines={[
          [city(-122.4, 37.8), city(-104.9, 39.7), city(-87.6, 41.9), city(-74, 40.7)],
          [city(-118.2, 34), city(-96.8, 32.8), city(-84.4, 33.7), city(-80.2, 25.8)],
          [city(-122.3, 47.6), city(-93.3, 44.9), city(-87.6, 41.9)],
          [city(-96.8, 32.8), city(-93.3, 44.9)],
        ]} />
        <NPill text="شبكة الطرق السريعة الأمريكية" x={1480} y={90} size={40} kind="gold" id="p2" />
      </>
    );
  } else if (t < 9) {
    const reg: [[number, number], [number, number]] = [[-12, 22], [48, 56]];
    s = (
      <>
        <PaperMap t={t} id="pm3" />
        <NightMap t={t} id="m3" region={reg} min={3} areas={[
          {countries: ['Spain', 'Portugal', 'France', 'Italy', 'Germany', 'Austria', 'Switzerland', 'Greece', 'Turkey', 'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Egypt', 'Syria', 'Israel', 'Jordan', 'Lebanon', 'Croatia', 'Serbia', 'Bulgaria', 'Romania', 'Albania', 'Bosnia and Herz.', 'Slovenia', 'Hungary', 'United Kingdom', 'Belgium', 'Netherlands'], fill: '#F3EAD3'},
          {countries: ['Italy', 'Spain', 'Portugal', 'France', 'Greece', 'Turkey', 'Tunisia', 'Egypt', 'Syria', 'Croatia', 'Albania', 'Bulgaria', 'Libya', 'Morocco', 'Algeria', 'Israel', 'Jordan', 'Lebanon'], fill: '#C2272D', at: 6.3, spread: [12.5, 41.9], dur: 2},
        ]} />
        <NPill text="الإمبراطورية الرومانية" x={1500} y={110} size={46} kind="red" id="p3" p={(t - 6.4) / 0.25} />
      </>
    );
  } else if (t < 12) {
    s = (
      <>
        <NightSky t={t} id="k4" horizonY={1080} />
        <QuoteCard t={t} at={9.1} x={960} y={520} lines={['«إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ', 'حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ»']} source="سورة الرعد ١١" id="qc" />
      </>
    );
  } else {
    s = (
      <>
        <PlateWorld t={t} src="_night-test/bg/treasury-room.jpg" id="pl" at={12} dur={3} />
        <StoryPerson x={760} y={1040} s={0.8} body="#7A3FC8" hat="crown" hatColor="#FFC928" id="king" t={t} />
        <ChapterTitle t={t} id="ct" chapters={[{at: 12.1, text: 'روما في عزّها', n: 1}]} />
      </>
    );
  }
  return (
    <Stage bg="#0F062B">
      <NightScreen>{s}</NightScreen>
    </Stage>
  );
};
