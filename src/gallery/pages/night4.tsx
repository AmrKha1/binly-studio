import React from 'react';
import {Stage} from '../../kit/stage';
import {GlowText, HostTrack, NightScreen, NightSky, NPill, WordPop} from '../../kit/night';
import {Bokeh, Bubble, CountNumber, NeonSign, punchT, Rays, Stamp, StripeWipe, WhooshOut} from '../../kit/night-fx';

// page "night4": set 2 of the AZTIKA look, one beat after another (render with {"lang":"ar"}).
// 0–2 rays «أنت!» · 2–4.2 science count-up · 4.2–8 paper: stamp + bubble ✔, punch-in · 8 whoosh · 8.25 stripe wipe →
// 8.6– neon sign-off. Stills: 1.5, 3.6, 5.9, 7.95, 8.08, 8.4, 9.8.
const PAPER = '#E9DDBB';
export const NightPage4: React.FC<{t: number}> = ({t}) => {
  let scene: React.ReactNode;
  if (t < 2) {
    scene = (
      <>
        <Rays t={t} id="r1" tone="gold" y={620} />
        <Bokeh t={t} />
        <WordPop t={t} id="w1" y={170} size={190} right={1140} words={[{w: 'أنت!', at: 0.3, tone: 'gold'}]} />
        <HostTrack t={t} id="h1" spots={[{at: 0, x: 960, y: 1180, h: 470}]} poses={[[0, 'full-point-both-smile']]} enter={{kind: 'rise', at: 0}} />
      </>
    );
  } else if (t < 4.2) {
    scene = (
      <>
        <Rays t={t} id="r2" tone="cyan" x={560} />
        <Bokeh t={t} color="#57D9FA" seed={3} />
        <NPill text="قيمة أعضاء جسمك" x={1290} y={330} size={50} kind="cyan" id="p2" p={(t - 2.2) / 0.25} />
        <CountNumber t={t} at={2.5} value="25,800,000 $" x={1290} y={510} size={150} tone="white" id="c2" dur={1.1} />
      </>
    );
  } else if (t < 8) {
    scene = (
      <g transform={punchT(t, 8, 1000, 560)}>
        <rect x={0} y={0} width={1920} height={1080} fill={PAPER} />
        <NPill text="صفقة لويزيانا" x={1500} y={150} size={60} kind="gold" id="p3" p={(t - 4.3) / 0.25} />
        <Stamp t={t} at={4.7} text="تم البيع" x={1000} y={560} size={120} />
        <GlowText text="x2" x={1500} y={560} size={190} tone="gold" id="x2" glow={0} />
        <HostTrack t={t} id="h3" spots={[{at: 4.2, spot: 'sideLeft'}]} poses={[[4.2, 'present'], [5.4, 'viewer']]} enter={{kind: 'slideLeft', at: 4.2}} />
        <Bubble t={t} at={5.4} lines={['أكيد!']} x={640} y={420} tx={540} ty={600} size={72} mark="check" />
      </g>
    );
  } else {
    scene = (
      <>
        <Rays t={t} id="r4" tone="dark" x={960} y={420} />
        <Bokeh t={t} seed={5} />
        <NeonSign t={t} at={8.6} x={960} y={400} text="ازتيكا" size={260} id="n4" />
        <WordPop t={t} id="w4" y={860} size={130} right={1760} words={[{w: 'في', at: 9.0, tone: 'gold'}, {w: 'أمان', at: 9.15, tone: 'gold'}, {w: 'الله', at: 9.3, tone: 'gold'}]} />
        <HostTrack t={t} id="h4" spots={[{at: 8, spot: 'sideLeft'}]} poses={[[8, 'full-thumbsup-wink']]} enter={{kind: 'pop', at: 8.7}} />
      </>
    );
  }
  return (
    <Stage bg="#0F062B">
      <NightScreen>
        {t >= 2 && t < 4.2 ? <NightSky t={t} id="bg" stars={0} /> : null}
        {scene}
        <WhooshOut t={t} at={8} />
        <StripeWipe t={t} at={8.18} />
      </NightScreen>
    </Stage>
  );
};
