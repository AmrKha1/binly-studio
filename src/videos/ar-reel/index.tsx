// THE MOTION REEL (owner 2026-11-11): ~40 s of the new AZTIKA toolkit at full speed with sound — to judge the FEEL
// before the first real video. Not a video for YouTube. Sections: stairs · screen · deal · painted plate · hero · twist.
import React from 'react';
import type {VideoModule} from '../../kit/video';
import {Stage} from '../../kit/stage';
import META from '../../../videos/ar-reel/video.json';
import {GridFloor, HostTrack, NightScreen, NightSky, NPill, WordPop, YearBadge} from '../../kit/night';
import {MarkPill} from '../../kit/night-data';
import {Bubble, CountNumber, Flash, HeroObject, Rays, Stamp, StripeWipe, WhooshOut} from '../../kit/night-fx';
import {StairGame, stairCamT, type StairEntry} from '../../kit/night-game';
import {coinArt, documentArt, driveArt} from '../../kit/night-objects';
import {AlertBanner, TransferScreen} from '../../kit/night-ui';
import {MoneyBag, RoomWorld, StoryPerson} from '../../kit/night-worlds';
import {PlateFx, PlateWorld} from '../../kit/night-places';
import {pushT, settleT} from '../../kit/anim';

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
    <HostTrack t={t} id="host" enter={{kind: 'riseSoft', at: t < 30 ? 0.2 : 33.9}}
      spots={[{at: 0, spot: 'sideLeft'}]} poses={[[0, 'present'], [2.4, 'point'], [5.8, 'think'], [35.2, 'wow'], [38.3, 'viewer']]} />
  </>
);

const Video: React.FC<{t: number}> = ({t}) => (
  <Stage bg="#0F062B">
    <NightScreen>
      {/* 1 · the stairs climb (0–7.5) */}
      {t < 7.53 && <Stairs t={t} />}
      {/* 2 · the screen: a transfer rolls into the wrong amount (7.53–14.1) */}
      {t >= 7.53 && t < 14.1 && (
        <g transform={settleT(t, 7.53)}>
          <NightSky t={t} id="sky2" />
          <g transform={pushT(t, 7.53)}>
            <TransferScreen t={t} at={7.9} x={960} y={560} from="حساب البنك" to="حساب المقرضين" amount="7.8 مليون $" wrong="894 مليون $" id="tr" />
            <AlertBanner t={t} at={11.3} x={960} y={140} text="تحويل بالغلط!" id="al" />
          </g>
          <Flash t={t} at={9.15} />
        </g>
      )}
      {/* 3 · the deal: faceless cast, a bubble, the stamp (14.1–21.0) */}
      {t >= 14.1 && t < 21.0 && (
        <g transform={pushT(t, 14.1, 960, 600)}>
          <RoomWorld t={t} id="room" />
          <StoryPerson x={560} y={900} s={1.05} role="businessman" pose={t > 15.2 ? 'hold' : 'talk'} prop="document" t={t} id="seller" />
          <StoryPerson x={1300} y={900} s={1.0} role="banker" rim="#7FD8FF" pose="idle" t={t} id="buyer1" flip />
          <StoryPerson x={1520} y={900} s={0.95} role="man" outfit="hoodie" hat="hood" rim="#7FD8FF" pose={t > 18.2 ? 'shock' : 'idle'} t={t} id="buyer2" flip />
          <MoneyBag x={960} y={905} s={1.1} />
          <Bubble t={t} at={14.8} lines={['15 مليون', 'وخذوا الكل!']} x={760} y={330} tx={600} ty={560} />
          <Stamp t={t} at={18.0} text="تم البيع" x={950} y={640} size={118} color="#FF5A6A" />
        </g>
      )}
      {/* 4 · a painted plate with life on top (21.0–28.0) */}
      {t >= 21.0 && t < 28.0 && (
        <>
          <PlateWorld t={t} id="pl" src="ar-reel/bg/treasury-room.jpg" look="natural" at={21.0} dur={7} from={{x: 0.5, y: 0.55, s: 1.04}} to={{x: 0.55, y: 0.5, s: 1.16}} />
          <PlateFx t={t} kind="dust" density={1.3} />
          <PlateFx t={t} kind="rays" />
          <YearBadge t={t} at={21.5} year={1875} from={1869} x={960} y={170} id="yb" />
          <StoryPerson x={1500 - Math.min(1, Math.max(0, (t - 22.5) / 3)) * 420} y={1000} s={0.95} role="man" hat="tarboush" outfit="uniform" medals pose={t > 22.5 && t < 25.5 ? 'walk' : 'think'} t={t} id="khedive" />
          <WordPop t={t} id="hw" y={930} size={112} right={880} words={[{w: 'الخزنة', at: 24.2}, {w: 'فاضية', at: 24.6, tone: 'gold'}]} />
          <NPill text="الخديوي" x={1500 - Math.min(1, Math.max(0, (t - 22.5) / 3)) * 420} y={545} size={48} kind="white" id="kname" p={(t - 23.0) / 0.3} />
          <MarkPill t={t} at={26.2} text="فاضية" x={1560} y={330} mark="cross" id="empty" />
        </>
      )}
      {/* 5 · the hero reveal: the Claude-drawn coin + the S-curve count (28.0–34.0) */}
      {t >= 28.0 && t < 34.0 && (
        <g transform={pushT(t, 28.0)}>
          <Rays t={t} id="rays" tone="gold" x={960} y={470} />
          <HeroObject t={t} at={28.3} draw={coinArt('₿')} ar={1} x={960} y={430} h={380} id="hero" />
          <CountNumber t={t} at={29.6} value="785" x={960} y={790} size={150} id="cnt" />
          <WordPop t={t} id="w5" y={935} size={80} right={1220} words={[{w: 'مليون', at: 31.4}, {w: 'دولار', at: 31.7}]} />
        </g>
      )}
      {t >= 13.75 && t < 14.3 && <WhooshOut t={t} at={13.95} />}
      {t >= 6.95 && t < 7.6 && <StripeWipe t={t} at={7.3} />}
      {t >= 20.6 && t < 21.3 && <StripeWipe t={t} at={20.77} />}
      {t >= 27.6 && t < 28.3 && <StripeWipe t={t} at={27.77} />}
      {/* 6 · back to the stairs: the twist takes the summit, then the recap (34.0–end) */}
      {t >= 34.0 && <Stairs t={t} />}
      {t >= 34.0 && <MarkPill t={t} at={37.0} text="أصغر رقم" x={1320} y={130} mark="check" id="small" />}
      {t >= 34.0 && <NPill text="أغلى غلطة" x={1320} y={250} size={56} kind="gold" id="final" p={(t - 39.0) / 0.3} />}
      {t >= 33.6 && t < 34.3 && <StripeWipe t={t} at={33.77} />}
    </NightScreen>
  </Stage>
);

export const active: VideoModule = {meta: {slug: META.slug, title: META.title, duration: 40.48, audio: META.audio, lang: 'ar'} as VideoModule['meta'], Video};
