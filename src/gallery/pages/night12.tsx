import React from 'react';
import {Stage} from '../../kit/stage';
import {GlowText, NightScreen, NightSky, NPill} from '../../kit/night';
import {StoryPerson} from '../../kit/night-worlds';
import {DayWorld, FactoryLine, LabWorld, MineWorld, StarsRating, VillageWorld} from '../../kit/night-places';
import {WarWorld} from '../../kit/night-data';
import {BananaGlyph, Magnifier, MassGrid, Particle, ParticleSwarm, RingGauge, WeighScale} from '../../kit/night-sci';
import {Bubble} from '../../kit/night-fx';

// page "night12": places + science (render with {"lang":"ar"}), 2.5 s each. Stills: 2.2 … 19.7 (every 2.5 s).
// mine (1:43) · village «وإحنا؟!» (3:44) · day house (4:32) · factory line (9:11) · scale + particles (9:59/10:08) ·
// lab + stars (10:51) · ring gauge (11:39) · magnifier + mass grid (12:16 / 11:12).
export const NightPage12: React.FC<{t: number}> = ({t}) => {
  let s: React.ReactNode;
  if (t < 2.5) {
    s = (
      <>
        <MineWorld t={t} id="mw" />
        <StoryPerson x={960} y={880} s={0.8} body="#B07A4A" hat="helmet" hatColor="#FFC928" id="miner" t={t} />
        <NPill text="مدير المنجم" x={960} y={520} size={36} kind="white" id="p1" />
      </>
    );
  } else if (t < 5) {
    s = (
      <>
        <VillageWorld t={t} id="vw" />
        {[860, 960, 1060].map((x, i) => <StoryPerson key={x} x={x} y={1000} s={0.55} body={['#8A4A2A', '#A0522D', '#7A3A1A'][i]} hat="feather" hatColor="#C2272D" id={'v' + i} t={t + i} />)}
        <Bubble t={t} at={2.8} lines={['وإحنا؟!']} x={960} y={560} tx={960} ty={680} size={64} />
        <NPill text="من أعظم صفقات الأراضي" x={1450} y={120} size={40} kind="gold" id="p2" />
      </>
    );
  } else if (t < 7.5) {
    s = (
      <>
        <DayWorld t={t} id="dw" />
        <g stroke="#14101C" strokeWidth={8} strokeLinejoin="round">
          <rect x={800} y={600} width={320} height={240} fill="#FFF3D6" />
          <path d="M760 610 L960 440 L1160 610 Z" fill="#E23A4E" />
          <rect x={925} y={720} width={70} height={120} fill="#8A5A34" />
        </g>
        <ellipse cx={960} cy={860} rx={330} ry={46} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeDasharray="14 10" />
        <NPill text="البيت" x={1280} y={480} size={44} kind="gold" id="p3" />
        <NPill text="الأرض" x={620} y={860} size={40} kind="white" id="p3b" />
      </>
    );
  } else if (t < 10) {
    s = (
      <>
        <WarWorld t={t} id="ww" />
        <FactoryLine t={t} id="fl" />
        <NPill text="اقتصاد كل قوة كبيرة" x={1450} y={180} size={56} kind="gold" id="p4" />
        {['طيارات', 'دبابات', 'سفن', 'ذخيرة', 'وقود'].map((w, i) => <NPill key={w} text={w} x={1760 - i * 190} y={910} size={42} kind="white" id={'w' + i} />)}
      </>
    );
  } else if (t < 12.5) {
    s = (
      <>
        <NightSky t={t} id="k5" horizonY={1080} stars={30} />
        <GlowText text="غرام واحد" x={960} y={170} size={130} tone="gold" id="g5" />
        <WeighScale t={t} at={10.1} x={960} y={760} value="1.000 g">
          <Particle t={t} x={0} y={-30} r={16} color="#FF4FC8" id="pp" />
        </WeighScale>
        <ParticleSwarm t={t} x={330} y={560} r={150} color="#FF4FC8" at={10.3} />
        <ParticleSwarm t={t} x={1590} y={560} r={150} color="#3B82F6" seed={4} at={10.3} />
        <Particle t={t} at={10.6} x={330} y={330} r={34} color="#E83AB0" symbol="e⁺" label="بوزترون" id="pa" />
        <Particle t={t} at={10.8} x={1590} y={330} r={34} color="#3B82F6" symbol="e⁻" label="إلكترون" id="pb" />
      </>
    );
  } else if (t < 15) {
    s = (
      <>
        <LabWorld t={t} id="lw" />
        <StarsRating t={t} at={12.6} x={960} y={200} value={4.5} size={56} />
        <NPill text="مصنع أنتي ماتر" x={960} y={290} size={44} kind="gold" id="p6" />
        <path d="M760 620 Q960 860 1180 600" fill="none" stroke="#14101C" strokeWidth={70} strokeLinecap="round" />
        <path d="M760 620 Q960 860 1180 600" fill="none" stroke="#FFD23A" strokeWidth={52} strokeLinecap="round" />
        <NPill text="أسوأ مصنع في التاريخ" x={960} y={980} size={40} kind="red" id="p6b" />
      </>
    );
  } else if (t < 17.5) {
    s = (
      <>
        <NightSky t={t} id="k7" horizonY={1080} />
        <RingGauge t={t} at={15.1} x={820} y={560} r={300} value="99.99%" from={60} label="السرعة" sub="من سرعة الضوء" id="rg" />
        <NPill text="الطريقة الوحيدة تقريباً" x={1500} y={140} size={40} kind="gold" id="p7" />
      </>
    );
  } else {
    s = (
      <>
        <NightSky t={t} id="k8" horizonY={1080} stars={30} />
        <MassGrid t={t} at={17.6} x={620} y={600} w={1000} h={700} cols={22} rows={16} node={() => <BananaGlyph />} />
        <Magnifier t={t} at={17.8} x={1460} y={500} r={200} zoom="×1,000,000" id="mg" />
        <NPill text="موزة لكل إنسان عاش في التاريخ" x={620} y={200} size={40} kind="gold" id="p8" />
      </>
    );
  }
  return (
    <Stage bg="#0F062B">
      <NightScreen>{s}</NightScreen>
    </Stage>
  );
};
