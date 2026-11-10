import React from 'react';
import {Stage} from '../../kit/stage';
import {NightScreen, NightSky, NPill} from '../../kit/night';
import {Rays} from '../../kit/night-fx';
import {NightCity, RoomWorld, StoryPerson} from '../../kit/night-worlds';
import {Callout, DashedFrame, IconList, Lineup, Measure, Newspapers, PaperStorm, ProgressBar, Spotlight, StoryCrowd, StrikeSwap} from '../../kit/night-story';
import {SunsetWorld} from '../../kit/night-worlds';

// page "night11": story tools (render with {"lang":"ar"}), 2.5 s each. Stills: 2.2, 4.7, 7.2, 9.7, 12.2, 14.7.
// newspapers (1:16) · lineup ✖ (2:12) · icon list + strike swap (5:26/5:36) · callouts + size bracket (1:30) ·
// measure «170 كم» + dashed plan frame (7:20/7:43) · progress bar + spotlight + crowd (0:57/1:19).
export const NightPage11: React.FC<{t: number}> = ({t}) => {
  let s: React.ReactNode;
  if (t < 2.5) {
    s = (
      <>
        <NightSky t={t} id="k1" horizonY={1080} stars={20} />
        <PaperStorm t={t} />
        <Newspapers t={t} x={960} y={540} id="np" papers={[
          {headline: 'سرقة القرن!', sub: 'اختفاء الموناليزا', at: 0.2},
          {headline: 'أين اللوحة؟', sub: 'العالم كله يسأل', at: 0.8},
          {headline: 'رجعت الموناليزا!', sub: 'أشهر لوحة في العالم', at: 1.4},
        ]} />
      </>
    );
  } else if (t < 5) {
    const per = (body: string, hat: 'cap' | 'helmet' | 'feather') => <StoryPerson x={0} y={150} s={0.42} body={body} hat={hat} hatColor="#3A3A4A" t={t} id={'lp' + body} />;
    s = (
      <>
        <NightSky t={t} id="k2" horizonY={1080} />
        <Lineup t={t} x={960} y={470} id="lu" items={[
          {label: 'عالم', at: 2.6, node: per('#E8EAF0', 'cap'), mark: 'cross', markAt: 3.4},
          {label: 'مستكشف', at: 2.8, node: per('#B07A4A', 'helmet'), mark: 'cross', markAt: 3.7},
          {label: 'بطل رحلة أسطورية', at: 3.0, node: per('#C2272D', 'feather'), mark: 'cross', markAt: 4.0},
        ]} />
      </>
    );
  } else if (t < 7.5) {
    s = (
      <>
        <NightCity t={t} id="c3" />
        <IconList t={t} x={1350} y={260} id="il" rows={[
          {text: '168 موقف سيارة', at: 5.1},
          {text: '3 مهابط هليكوبتر', at: 5.35},
          {text: 'غرفة ثلج', at: 5.6},
        ]} />
        <StrikeSwap t={t} at={5.9} strikeAt={6.3} swapAt={6.7} from="بيت" to="شركة" x={560} y={420} id="ss" />
      </>
    );
  } else if (t < 10) {
    s = (
      <>
        <Rays t={t} id="r4" tone="cyan" />
        <rect x={780} y={300} width={300} height={420} rx={10} fill="#8A5A34" stroke="#14101C" strokeWidth={8} />
        <rect x={810} y={330} width={240} height={360} fill="#4A6A3A" />
        <Callout t={t} at={7.7} x={830} y={380} lx={480} ly={300} text="طبقات زيت ملون" id="c1" />
        <Callout t={t} at={8.0} x={800} y={650} lx={480} ly={760} text="لوح خشب" kind="gold" id="c2" />
        <Measure t={t} at={8.3} x1={1130} y1={300} x2={1130} y2={720} label="76 سم" off={-90} id="m4" kind="white" size={40} />
      </>
    );
  } else if (t < 12.5) {
    s = (
      <>
        <SunsetWorld t={t} id="w5" skyline="desert" />
        <path d="M80 760 L1840 300 L1840 1000 Z" fill="#9CC8F2" opacity={0.9} stroke="#14101C" strokeWidth={6} />
        <Measure t={t} at={10.1} x1={140} y1={700} x2={1800} y2={260} label="170 كم" off={-70} id="m5" />
        <DashedFrame t={t} at={10.8} x={1500} y={640} w={300} h={460} label="المخطط" id="df" />
      </>
    );
  } else {
    s = (
      <>
        <RoomWorld t={t} id="w6" />
        <Spotlight x={760} y={900} top={0} w={600} id="sp" />
        <rect x={660} y={430} width={200} height={260} fill="#4A6A3A" stroke="#C9A24A" strokeWidth={14} />
        <ProgressBar t={t} at={12.6} x={1400} y={300} from={0} to={89} dur={1.4} label="نسبة الإنجاز" id="pb" />
        <StoryCrowd t={t} id="cr" n={12} rows={2} y={1260} s={0.6} cheer />
        <NPill text="متحف اللوفر" x={760} y={760} size={40} kind="white" id="p6" />
      </>
    );
  }
  return (
    <Stage bg="#0F062B">
      <NightScreen>{s}</NightScreen>
    </Stage>
  );
};
