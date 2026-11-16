// Test page for the shared pieces of ar-costly-mistakes (not used by the video). Registered in the Gallery as "costly":
//   node tools/still.mjs --comp Gallery --props '{"page":"costly","lang":"ar"}' --at 2.6,6.3,12.9,13.4,17.6,19,22.4,24.6,28.4,30.5
// Windows: bill 0–4 · doors 4–9 · rocket + button 9–15 · equation + graphs 15–20 · landfill 20–25 · dominoes 25–31.
import React from 'react';
import {Stage} from '../../../kit/stage';
import {GridFloor, NightScreen, NightSky} from '../../../kit/night';
import {SunsetWorld} from '../../../kit/night-worlds';
import {CloudWorld} from '../../../kit/night-props';
import {StoryPropIcon} from '../../../kit/night-worlds';
import {DrawCrown} from '../../../kit/night-game';
import {documentArt} from '../../../kit/night-objects';
import {ramp} from '../../../kit/anim';
import {ConsequenceTrain, EquationBar, FateDoor, LandfillSlice, MistakeBill, RangeSafetyButton, ReadingsGraph, WobbleRocket} from './index';

export const CostlySharedPage: React.FC<{t: number}> = ({t}) => {
  let s: React.ReactNode;
  if (t < 4) {
    s = (
      <>
        <NightSky t={t} id="k1" />
        <GridFloor id="f1" t={t} />
        <MistakeBill t={t} at={0.1} x={960} y={500} s={1.3} id="bill" title="فاتورة الخطأ"
          rows={[{label: 'وقتها', value: '18.5 مليون $', at: 0.6}, {label: 'اليوم', value: '150 مليون $', tone: 'red', at: 1.0}]}
          total={{label: 'الخسارة', value: '131.5 مليون $', tone: 'red', at: 1.5}}
          stamp={{text: 'خطأ', at: 2.0}} fly={{at: 3.0, x: 1600, y: 260, s: 0.35}} />
      </>
    );
  } else if (t < 9) {
    s = (
      <>
        <SunsetWorld t={t} id="k2" skyline="pyramids" />
        <FateDoor t={t} at={4.05} x={620} y={950} h={700} kind="wood" light="#FFC928" openAt={4.4} closeAt={8.0} id="d1"
          label={{text: 'أول باب', at: 4.6}}
          through={{at: 5.6, dur: 1.4, node: <StoryPropIcon prop="money" s={1.4} />, to: [0, 60]}} />
        <FateDoor t={t} at={4.15} x={1360} y={950} h={700} kind="digital" light="#FF2E4D" openAt={4.8} id="d2"
          label={{text: 'الملف', at: 5.0, kind: 'red'}}
          through={{at: 5.9, dur: 1.4, node: <g>{documentArt()(180)}</g>, to: [0, 40]}} />
      </>
    );
  } else if (t < 15) {
    s = (
      <>
        <NightSky t={t} id="k3" />
        <GridFloor id="f3" t={t} />
        <WobbleRocket t={t} at={9.3} x0={460} y0={880} cx={480} cy={220} x1={1150} y1={120} dur={5} wobbleAt={10.8} wobble={24} explodeAt={13.0} s={0.95} id="rk" />
        <RangeSafetyButton t={t} x={1500} y={700} s={0.85} guardAt={12.0} pressAt={12.8} label={{text: 'زر التدمير', at: 11.8}} id="btn" />
      </>
    );
  } else if (t < 20) {
    s = (
      <>
        <NightSky t={t} id="k4" stars={40} horizonY={1080} />
        <EquationBar t={t} at={15.1} x={560} y={520} w={760} h={600} liftAt={16.5} label={{text: 'المتوسط', at: 15.5}} id="eq" />
        <ReadingsGraph t={t} at={15.3} x={1390} y={290} w={760} h={400} mode="avg" p={ramp(t, 15.4, 16.6)} label={{text: 'مع الشرطة', at: 15.6}} id="g1" />
        <ReadingsGraph t={t} at={17.0} x={1390} y={790} w={760} h={400} mode="raw" p={ramp(t, 17.1, 18.3)} label={{text: 'بدونها', at: 17.2}} id="g2" />
      </>
    );
  } else if (t < 25) {
    s = (
      <>
        <CloudWorld t={t} id="k5" />
        <LandfillSlice t={t} at={20.1} x={960} y={1000} w={1640} h={660} narrowAt={21.6} narrowDur={1.6} driveAt={23.2} fenceAt={23.9} rain id="lf"
          labels={[{text: '1.4 مليون طن', at: 20.9, dx: -420, dy: 700}, {text: '100 ألف طن', at: 23.0, dx: 230, dy: 520, kind: 'gold'}]} />
      </>
    );
  } else {
    const ic = (n: React.ReactNode) => n;
    s = (
      <>
        <SunsetWorld t={t} id="k6" skyline="pyramids" />
        <ConsequenceTrain t={t} x={960} y={700} id="ct" tiles={[
          {year: '1875', label: 'البيع', at: 25.2, fallAt: 27.6, icon: ic(<StoryPropIcon prop="document" s={0.8} />)},
          {year: '1876', label: 'الإفلاس', at: 25.6, fallAt: 27.95, icon: ic(<StoryPropIcon prop="coin" s={0.8} />)},
          {year: '1879', label: 'عزل إسماعيل', at: 26.0, fallAt: 28.3, icon: ic(<g transform="rotate(-18) translate(0 30)">{DrawCrown(70)}</g>)},
          {year: '1882', label: 'الاحتلال', at: 26.4, fallAt: 28.65, icon: ic(<StoryPropIcon prop="sword" s={0.8} />)},
          {year: '1956', label: 'التأميم', at: 26.8, fallAt: 29.0, icon: ic(<StoryPropIcon prop="gavel" s={0.8} />)},
        ]} />
      </>
    );
  }
  return (
    <Stage bg="#0F062B">
      <NightScreen>{s}</NightScreen>
    </Stage>
  );
};
