// THE MOTION REEL (owner 2026-11-11): ~40 s of the new AZTIKA toolkit at full speed with sound — to judge the FEEL
// before the first real video. Not a video for YouTube. Sections: stairs · screen · deal · history world (the Claude-made
// path when no Flow plate exists) · hero · twist.
// v2 (owner: "no harsh animation"): scenes JOIN like the reference — NightShots 'match' dissolves (old scene drifts
// forward and fades, the new one settles in), ONE stripe wipe for the jump back to 1875, every scene drifts by itself,
// the host is pinned to the screen and fades out/in instead of vanishing, the Khedive walks with move() (eased).
import React from 'react';
import type {VideoModule} from '../../kit/video';
import {Stage} from '../../kit/stage';
import META from '../../../videos/ar-reel/video.json';
import {GridFloor, HostTrack, NightScreen, NightSky, NPill, WordPop, YearBadge} from '../../kit/night';
import {MarkPill} from '../../kit/night-data';
import {Bubble, CountNumber, Flash, HeroObject, Rays, Stamp} from '../../kit/night-fx';
import {StairGame, stairCamT, type StairEntry} from '../../kit/night-game';
import {coinArt, documentArt, driveArt} from '../../kit/night-objects';
import {AlertBanner, TransferScreen} from '../../kit/night-ui';
import {MoneyBag, RoomWorld, StoryPerson, SunsetWorld} from '../../kit/night-worlds';
import {PlateFx} from '../../kit/night-places';
import {move, NightShots} from '../../kit/night-scenes';
import {cueSfx} from '../../kit/sfx';

const STAIRS: StairEntry[] = [
  {id: 'a', label: '150 مليون $', at: 0.7, draw: documentArt(), ar: 0.78},
  {id: 'b', label: '600 مليون $', at: 2.5, draw: driveArt(), ar: 0.72, glow: '#5CF2FF'},
  {id: 'c', label: '785 مليون $', at: 4.3, draw: coinArt('₿'), ar: 1},
  {id: 'z', label: '4 مليون £', at: 35.0, draw: documentArt(), ar: 0.78, twist: true},
];
const SP = {entries: STAIRS, summitAt: 5.8, recapAt: 38.2, topLabel: 'الأغلى'};

const Stairs: React.FC<{t: number}> = ({t}) => (
  <>
    <NightSky t={t} id="sky" />
    <g transform={stairCamT(t, SP)}>
      <GridFloor id="fl" t={t} wide />
      <StairGame t={t} id="st" {...SP} />
    </g>
  </>
);

const Screen: React.FC<{t: number}> = ({t}) => (
  <>
    <NightSky t={t} id="sky2" />
    <TransferScreen t={t} at={7.62} x={960} y={560} from="حساب البنك" to="حساب المقرضين" amount="7.8 مليون $" wrong="894 مليون $" id="tr" />
    <AlertBanner t={t} at={11.3} x={960} y={140} text="تحويل بالغلط!" id="al" />
  </>
);

// the deal is ACTED: the buyers push the money over to the seller (owner review: no 4-second quiet stretch)
const Deal: React.FC<{t: number}> = ({t}) => {
  const [bx] = move(t, 16.0, [1150, 905], [800, 905]);
  cueSfx('swish', 'deal-bag', t >= 16.0 && t < 16.3, 960, {at: 16.0, hit: 0.3});
  return (
  <>
    <RoomWorld t={t} id="room" />
    <StoryPerson x={560} y={900} s={1.05} role="businessman" pose={t > 15.2 ? 'hold' : 'talk'} prop="document" t={t} id="seller" />
    <StoryPerson x={1300} y={900} s={1.0} role="banker" rim="#7FD8FF" pose={t > 15.9 && t < 17.2 ? 'point' : 'idle'} t={t} id="buyer1" flip />
    <StoryPerson x={1520} y={900} s={0.95} role="man" outfit="hoodie" hat="hood" rim="#7FD8FF" pose={t > 18.2 ? 'shock' : 'idle'} t={t} id="buyer2" flip />
    <MoneyBag x={bx} y={905} s={1.1} />
    <Bubble t={t} at={14.8} lines={['15 مليون', 'وخذوا الكل!']} x={760} y={330} tx={600} ty={560} />
    <Stamp t={t} at={18.0} text="تم البيع" x={950} y={640} size={118} color="#FF5A6A" />
  </>
  );
};

const History: React.FC<{t: number}> = ({t}) => {
  const [kx] = move(t, 22.5, [1560, 1000], [1260, 1000], 3); // eased in and out (starts and stops like a person)
  return (
    <>
      <SunsetWorld t={t} id="sun" />
      <PlateFx t={t} kind="dust" density={1.3} />
      <PlateFx t={t} kind="rays" />
      <YearBadge t={t} at={21.5} year={1875} from={1869} x={960} y={170} id="yb" />
      <StoryPerson x={kx} y={1000} s={0.95} role="man" hat="tarboush" outfit="uniform" medals pose={t > 22.5 && t < 25.4 ? 'walk' : 'think'} t={t} id="khedive" />
      <WordPop t={t} id="hw" y={930} size={112} right={820} words={[{w: 'الخزنة', at: 24.2}, {w: 'فاضية', at: 24.6, tone: 'gold'}]} />
      <NPill text="الخديوي" x={kx} y={545} size={48} kind="white" id="kname" p={(t - 23.0) / 0.3} />
    </>
  );
};

const Hero: React.FC<{t: number}> = ({t}) => (
  <>
    <Rays t={t} id="rays" tone="gold" x={960} y={470} />
    <HeroObject t={t} at={28.3} draw={coinArt('₿')} ar={1} x={960} y={430} h={380} id="hero" />
    <CountNumber t={t} at={29.6} value="785" x={960} y={790} size={150} id="cnt" />
    <WordPop t={t} id="w5" y={935} size={80} right={1220} words={[{w: 'مليون', at: 31.4}, {w: 'دولار', at: 31.7}]} />
  </>
);

const Twist: React.FC<{t: number}> = ({t}) => (
  <>
    <Stairs t={t} />
    <MarkPill t={t} at={37.0} text="أصغر رقم" x={1320} y={130} mark="check" id="small" />
    <NPill text="أغلى غلطة" x={1320} y={250} size={56} kind="gold" id="final" p={(t - 39.0) / 0.3} />
  </>
);

const Video: React.FC<{t: number}> = ({t}) => (
  <Stage bg="#0F062B">
    <NightScreen>
      <NightShots t={t} shots={[
        {start: 0, render: (t) => <Stairs t={t} />, drift: false}, // the stairs have their own camera
        {start: 7.53, render: (t) => <><Screen t={t} /><Flash t={t} at={9.15} /></>, drift: {cy: 560}, settle: 0.08}, // the screen pops in by itself
        {start: 14.1, render: (t) => <Deal t={t} />, drift: {cy: 600}},
        {start: 21.0, render: (t) => <History t={t} />, in: {kind: 'wipe'}}, // a jump back in time = a chapter change
        {start: 28.0, render: (t) => <Hero t={t} />, drift: {cy: 470}},
        {start: 34.0, render: (t) => <Twist t={t} />, drift: false},
      ]} hud={(t) => (
        // the host is pinned to the SCREEN (never zooms with a scene) and leaves/returns softly
        (t < 8.2 || t >= 33.6) && <HostTrack t={t} id="host"
          enter={{kind: 'riseSoft', at: t < 30 ? 0.2 : 33.9}} exit={t < 30 ? {kind: 'fadeOut', at: 7.45, dur: 0.3} : undefined}
          spots={[{at: 0, spot: 'sideLeft'}]} poses={[[0, 'present'], [2.4, 'point'], [5.8, 'think'], [35.2, 'wow'], [38.3, 'viewer']]} />
      )} />
    </NightScreen>
  </Stage>
);

export const active: VideoModule = {meta: {slug: META.slug, title: META.title, duration: 40.48, audio: META.audio, lang: 'ar'} as VideoModule['meta'], Video};
