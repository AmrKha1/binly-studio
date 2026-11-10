import React from 'react';
import {Stage} from '../../kit/stage';
import {GlowText, NightScreen, NightSky, NPill, WordPop} from '../../kit/night';
import {MarkPill, NBarChart, NBars, NGauge, NTimeline, Receipt, WarWorld} from '../../kit/night-data';
import {SpaceWorld} from '../../kit/night-space';

// page "night10": data in the night look (render with {"lang":"ar"}), 2.5 s each. Stills: 2.2, 4.7, 7.2, 9.7, 12.2.
// war timeline (8:45–9:02) · gauge «التقديرات» (7:27) · horizontal bars (11:07) · bar chart (12:46) · receipt (14:22).
export const NightPage10: React.FC<{t: number}> = ({t}) => {
  let s: React.ReactNode;
  if (t < 2.5) {
    s = (
      <>
        <WarWorld t={t} id="w1" />
        <WordPop t={t} y={150} size={110} words={[{w: 'الحرب', at: 0.05}, {w: 'غالية', at: 0.2, tone: 'red'}, {w: 'جداً', at: 0.35}]} id="wp" />
        <NTimeline t={t} id="tl" y={560} events={[
          {year: '1861', label: 'الحرب الأهلية الأمريكية', sub: 'تغيّرت أساليب التمويل', at: 0.4},
          {year: '1914', label: 'الحرب العالمية الأولى', sub: 'ديون وتعويضات لعقود', at: 0.9},
          {label: 'شي أكبر...', at: 1.4, mystery: true},
        ]} />
      </>
    );
  } else if (t < 5) {
    s = (
      <>
        <NightSky t={t} id="k2" stars={40} horizonY={1080} />
        <NGauge t={t} x={1150} y={560} id="ga" title="التقديرات" ticks={[
          {at: 2.6, level: 0.18, label: 'مئات المليارات'},
          {at: 3.4, level: 0.55, label: 'تريليونات'},
          {at: 4.1, level: 0.95, label: '8.8 تريليون $'},
        ]} />
      </>
    );
  } else if (t < 7.5) {
    s = (
      <>
        <NightSky t={t} id="k3" stars={40} horizonY={1080} />
        <WordPop t={t} y={180} size={100} words={[{w: 'وقت', at: 5.05}, {w: 'خيالي!', at: 5.2, tone: 'gold'}]} id="wp3" />
        <NBars t={t} id="bars" x={1560} y={420} len={1100} bars={[
          {label: 'عمر الكون', value: 0.25, at: 5.3, color: 'cyan'},
          {label: 'الوقت اللي تحتاجه', value: 1, at: 5.8, color: 'hot', kind: 'gold'},
        ]} />
        <GlowText text="أكبر بكثير من عمر الكون" x={1000} y={790} size={64} tone="gold" id="g3" />
      </>
    );
  } else if (t < 10) {
    s = (
      <>
        <NightSky t={t} id="k4" stars={40} horizonY={1080} />
        <NPill text="أكبر من اقتصادات دول كاملة" x={1350} y={160} size={44} kind="gold" id="p4" />
        <NBarChart t={t} id="bc" x={1050} base={820} maxH={500} bars={[
          {label: 'غرام واحد', value: 62.5, at: 7.6},
          {label: 'اقتصاد دولة', value: 25, at: 7.9},
          {label: 'اقتصاد دولة', value: 18, at: 8.1},
          {label: 'اقتصاد دولة', value: 12, at: 8.3},
        ]} />
      </>
    );
  } else {
    s = (
      <>
        <SpaceWorld t={t} id="s5" />
        <Receipt t={t} at={10.05} x={560} y={540} title="فاتورة الكون" id="rc" step={0.25}
          rows={[{label: 'ذهب ومعادن', value: '0 $'}, {label: 'كواكب', value: '0 $'}, {label: 'نجوم', value: '0 $'}, {label: 'مجرات', value: '0 $'}]}
          total={{label: 'المجموع', value: '0 $'}} />
        <MarkPill t={t} at={11.4} text="ما اشتريناها" x={1250} y={400} id="m1" />
        <MarkPill t={t} at={11.7} text="ما دفعنا عليها" x={1250} y={500} id="m2" />
        <MarkPill t={t} at={12.0} text="ما أخذنا قرض" x={1250} y={600} id="m3" />
      </>
    );
  }
  return (
    <Stage bg="#0F062B">
      <NightScreen>{s}</NightScreen>
    </Stage>
  );
};
