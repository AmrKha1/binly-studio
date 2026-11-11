import React from 'react';
import {Stage} from '../../kit/stage';
import {GridFloor, NightScreen, NightSky} from '../../kit/night';
import {AlertBanner, DownloadBar, Laptop, MessageCard, Phone, SearchBox, TransferScreen, VideoCall, WalletBalance} from '../../kit/night-ui';

// page "night16": SCREENS / UI set (kit/night-ui) — render with {"lang":"ar"}.
// Stills: 2.2 laptop + job message · 5.2 phone + wallet · 8.4 video call (HR speaks) · 10.6 (CEO speaks)
//         13.2 downloads mid-way · 15.6 downloads done (✔ + ⚠) · 17.0 transfer press · 18.9 wrong amount landed
//         21.6 search boxes typed · 24.9 wallet drained · 27.4 alert banners
export const NightPage16: React.FC<{t: number}> = ({t}) => (
  <Stage bg="#0F062B">
    <NightScreen>
      <NightSky t={t} id="s16" />
      <GridFloor id="f16" t={t} />
      {/* 0–3.2 · Laptop with a job message on its screen */}
      <Laptop t={t} at={0.2} x={960} y={1010} w={1320} id="lap" out={3.0}
        screen={<MessageCard t={t} at={0.6} x={500} y={312} w={860} kind="job" from="سارة" role="مسؤولة توظيف" hat="headset" text="عندنا وظيفة تناسبك براتب ممتاز" action="تقديم" id="lapmsg" />} />
      {/* 3.2–6.2 · Phone with a wallet on its screen + a chat message beside it */}
      <Phone t={t} at={3.3} x={1340} y={520} h={860} id="ph" out={6.0}
        screen={<WalletBalance t={t} at={3.6} x={225} y={450} from={6.3} to={0} unit="مليار $" s={0.52} id="phwal" />} />
      <MessageCard t={t} at={3.7} x={560} y={500} w={760} kind="chat" from="المدير" role="الرئيس التنفيذي" hat="tie" text="حوّل المبلغ اليوم قبل الساعة 5" id="chat" out={6.0} />
      {/* 6.2–12.0 · Video call: HR speaks, then the fake CEO */}
      <VideoCall t={t} at={6.3} x={960} y={500} w={1500} id="vc" out={11.8}
        people={[{name: 'سارة', role: 'التوظيف', hat: 'headset'}, {name: 'جون', role: 'المدير التنفيذي', hat: 'tie', body: '#1A1636'}]}
        speaking={[[6.8, 0], [9.8, 1]]} />
      {/* 12.0–16.2 · Downloads: a normal file, then the malware */}
      <DownloadBar t={t} at={12.1} x={960} y={330} file="عرض الوظيفة.pdf" dur={2.2} id="dl1" out={16.0} />
      <DownloadBar t={t} at={12.4} x={960} y={680} file="اختبار المهارات.zip" dur={2.4} danger verdict="برنامج خبيث" id="dl2" out={16.0} />
      {/* 16.2–20.0 · The transfer: 7.8 million typed, 894 million sent */}
      <TransferScreen t={t} at={16.3} x={960} y={520} from="حساب الشركة" to="حساب العميل" amount="7.8 مليون $" wrong="894 مليون $" press={16.9} id="tr" out={19.8} />
      {/* 20.0–23.0 · Search boxes (names as text only) */}
      <SearchBox t={t} at={20.1} x={960} y={360} w={1150} text="أفضل محرك بحث" brand="ياهو" id="sb1" out={22.8} />
      <SearchBox t={t} at={20.5} x={960} y={680} w={1150} text="أفضل محرك بحث" brand="جوجل" glow="#FCC018" id="sb2" out={22.8} />
      {/* 23.0–26.0 · Wallet drained */}
      <WalletBalance t={t} at={23.1} x={960} y={500} from={6.3} to={0.2} unit="مليار $" label="محافظ العملات" id="wal" out={25.8} />
      {/* 26.0–29 · Alert banners */}
      <AlertBanner t={t} at={26.1} x={960} y={380} text="تم اختراق الحساب!" id="al1" />
      <AlertBanner t={t} at={26.6} x={960} y={660} text="تحقق قبل التحويل" tone="gold" size={64} id="al2" />
    </NightScreen>
  </Stage>
);
