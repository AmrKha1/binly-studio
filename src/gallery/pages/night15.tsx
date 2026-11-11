import React from 'react';
import {Stage} from '../../kit/stage';
import {NightScreen, NightSky, NPill} from '../../kit/night';
import {MoneyBag, RoomWorld, StoryPerson, StoryPropIcon} from '../../kit/night-worlds';
import type {StoryHat, StoryOutfit, StoryPose, StoryProp, StoryRole} from '../../kit/night-worlds';

// page "night15": the AZTIKA story cast (StoryPerson) — render with {"lang":"ar"}. 3 s per sheet; stills at the middle:
//  1.5  A  new headwear (+ the reference fixes: feather = headband + one feather, top hat, bicorne)
//  4.5  B  outfits
//  7.5  C  props (held objects, drawn alone)
// 10.5  D  poses (walk animates)
// 13.5  E  mini story (3:12-style deal: gold-rim seller hands the document to the cyan-rim buyers)
// 16.5  F  roster 1/3 (roles) · 19.5 G roster 2/3 · 22.5 H roster 3/3
type Cell<K> = [K, string];

const grid = (n: number, cols: number, _x0: number, dx0: number, rowsY: number[], dx = Math.min(dx0, 1640 / Math.max(1, cols - 1)), x0 = 960 - ((cols - 1) * dx) / 2) =>
  Array.from({length: n}, (_, i) => ({x: x0 + (i % cols) * dx + (Math.floor(i / cols) === rowsY.length - 1 && n % cols ? ((cols - (n % cols)) * dx) / 2 : 0), y: rowsY[Math.floor(i / cols)]}));

const HATS: Array<[StoryHat, string, string?, string?]> = [
  ['tarboush', 'طربوش'], ['ghutra', 'غترة', undefined, 'thobe'], ['ghutra', 'شماغ', '#D2363A', 'thobe'], ['hijab', 'حجاب', undefined, 'dress'], ['hood', 'قلنسوة', undefined, 'hoodie'],
  ['officer', 'قبعة ضابط', undefined, 'uniform'], ['hardhat', 'خوذة عمل'], ['judge', 'باروكة قاضٍ', undefined, 'gown'], ['feather', 'ريشة'], ['top', 'قبعة عالية', undefined, 'suit'], ['bicorne', 'نابليون', '#1C1830', 'uniform'],
];
const OUTFITS: Array<Cell<StoryOutfit>> = [
  ['plain', 'الأصل'], ['suit', 'بدلة'], ['shirt', 'قميص'], ['hoodie', 'هودي'], ['thobe', 'ثوب'],
  ['bisht', 'بشت'], ['labcoat', 'معطف مختبر'], ['uniform', 'بزة عسكرية'], ['dress', 'عباءة'], ['overalls', 'ملابس عمل'],
];
const PROPS: Array<Cell<StoryProp>> = [
  ['laptop', 'حاسوب'], ['phone', 'هاتف'], ['harddrive', 'قرص صلب'], ['pizza', 'بيتزا'], ['document', 'عقد'], ['pen', 'قلم'], ['briefcase', 'حقيبة'],
  ['coin', 'بيتكوين'], ['gavel', 'مطرقة'], ['scroll', 'مخطوطة'], ['money', 'مال'], ['sign', 'لافتة'], ['sword', 'سيف'], ['wrench', 'مفتاح'],
  ['pickaxe', 'معول'], ['pitchfork', 'مذراة'], ['pan', 'مقلاة'], ['book', 'كتاب'], ['microphone', 'ميكروفون'], ['brush', 'فرشاة'], ['guitar', 'غيتار'],
  ['ball', 'كرة'], ['map', 'خريطة'], ['clipboard', 'لوح'], ['flask', 'دورق'], ['cane', 'عصا'],
];
const POSES: Array<Cell<StoryPose>> = [
  ['idle', 'وقوف'], ['point', 'يشير'], ['hold', 'يحمل'], ['up', 'يرفع'], ['talk', 'يتكلم'], ['shock', 'صدمة'], ['think', 'يفكر'], ['cheer', 'فرح'], ['walk', 'يمشي'],
];
const ROLES: Array<Cell<StoryRole>> = [
  ['king', 'ملك'], ['queen', 'ملكة'], ['prince', 'أمير'], ['sultan', 'سلطان'], ['sheikh', 'شيخ'], ['arabMan', 'رجل عربي'], ['arabWoman', 'امرأة عربية'],
  ['pharaoh', 'فرعون'], ['knight', 'فارس'], ['soldier', 'جندي'], ['officer', 'ضابط'], ['general', 'جنرال'], ['police', 'شرطي'], ['pirate', 'قرصان'],
  ['explorer', 'مستكشف'], ['sailor', 'بحّار'], ['pilot', 'طيّار'], ['astronaut', 'رائد فضاء'], ['doctor', 'طبيب'], ['nurse', 'ممرضة'], ['scientist', 'عالم'],
  ['engineer', 'مهندس'], ['programmer', 'مبرمج'], ['hacker', 'هاكر'], ['worker', 'عامل'], ['farmer', 'فلاح'], ['miner', 'عامل منجم'], ['chef', 'طبّاخ'],
  ['businessman', 'رجل أعمال'], ['banker', 'مصرفي'], ['lawyer', 'محامٍ'], ['judge', 'قاضٍ'], ['politician', 'سياسي'], ['journalist', 'صحفي'], ['teacher', 'معلّم'],
  ['student', 'طالب'], ['painter', 'رسّام'], ['musician', 'موسيقي'], ['athlete', 'رياضي'], ['oldMan', 'عجوز'], ['child', 'طفل'], ['woman', 'امرأة'], ['man', 'رجل'],
];

const Sky: React.FC<{t: number}> = ({t}) => <NightSky t={t} id="s15" horizonY={1080} stars={40} />;

export const NightPage15: React.FC<{t: number}> = ({t}) => {
  let s: React.ReactNode;
  if (t < 3) {
    const pos = grid(HATS.length, 6, 210, 300, [450, 920]);
    s = (
      <>
        <Sky t={t} />
        {HATS.map(([hat, name, hc, outfit], i) => (
          <g key={i}>
            <StoryPerson x={pos[i].x} y={pos[i].y} s={0.62} hat={hat} hatColor={hc} outfit={outfit as StoryOutfit | undefined} t={t + i} id={`h${i}`} />
            <NPill text={name} x={pos[i].x} y={pos[i].y + 56} size={34} kind="white" id={`hp${i}`} />
          </g>
        ))}
      </>
    );
  } else if (t < 6) {
    const pos = grid(OUTFITS.length, 5, 240, 360, [450, 920]);
    s = (
      <>
        <Sky t={t} />
        {OUTFITS.map(([outfit, name], i) => (
          <g key={outfit}>
            <StoryPerson x={pos[i].x} y={pos[i].y} s={0.62} outfit={outfit} hat={outfit === 'thobe' || outfit === 'bisht' ? 'ghutra' : outfit === 'dress' ? 'hijab' : 'none'} t={t + i} id={`o${i}`} />
            <NPill text={name} x={pos[i].x} y={pos[i].y + 56} size={34} kind="white" id={`op${i}`} />
          </g>
        ))}
      </>
    );
  } else if (t < 9) {
    const pos = grid(PROPS.length, 7, 200, 253, [250, 500, 750, 990]);
    s = (
      <>
        <Sky t={t} />
        {PROPS.map(([p, name], i) => {
          const tall = ['sign', 'sword', 'pitchfork', 'pickaxe', 'gavel', 'pan', 'guitar', 'cane'].includes(p);
          const sc = tall ? 0.62 : 0.85;
          const dy = p === 'sign' ? 0 : p === 'cane' ? -110 : p === 'briefcase' ? -120 : p === 'coin' || p === 'phone' || p === 'money' || p === 'harddrive' || p === 'scroll' || p === 'guitar' ? -60 : 0;
          return (
            <g key={p}>
              <StoryPropIcon x={pos[i].x} y={pos[i].y - 50 + dy * sc} s={sc} prop={p} />
              <NPill text={name} x={pos[i].x} y={pos[i].y - 10} size={34} kind="white" id={`pp${i}`} />
            </g>
          );
        })}
      </>
    );
  } else if (t < 12) {
    const pos = grid(POSES.length, 5, 240, 360, [450, 920]);
    s = (
      <>
        <Sky t={t} />
        {POSES.map(([pose, name], i) => (
          <g key={pose}>
            <StoryPerson x={pos[i].x} y={pos[i].y} s={0.62} pose={pose} outfit="shirt" body="#3A8FD0" prop={pose === 'hold' ? 'laptop' : pose === 'up' ? 'sign' : 'none'} t={t} id={`ps${i}`} />
            <NPill text={name} x={pos[i].x} y={pos[i].y + 56} size={34} kind={pose === 'walk' ? 'gold' : 'white'} id={`pp${i}`} />
          </g>
        ))}
      </>
    );
  } else if (t < 15) {
    // mini story: the seller (gold rim) hands the contract over; the buyers (cyan rim) take it at 13.6 and cheer at 14.2
    const given = t >= 13.6;
    const walkIn = Math.min(1, Math.max(0, (t - 12) / 0.8));
    const sx = 1400 - 180 * (1 - Math.pow(1 - walkIn, 3));
    s = (
      <>
        <RoomWorld t={t} id="rw15" />
        <MoneyBag x={980} y={930} s={1.1} />
        <StoryPerson x={sx} y={930} s={1.05} role="businessman" prop={given ? 'none' : 'document'} pose={t < 12.8 ? 'walk' : given ? 'idle' : 'point'} flip t={t} id="seller" />
        <StoryPerson x={640} y={930} s={1.05} outfit="hoodie" hat="hood" body="#3A6EA5" rim="#7FD8FF" pose={!given ? 'talk' : t < 14.2 ? 'hold' : 'cheer'} prop={given ? 'document' : 'none'} t={t} id="buyer" />
        <StoryPerson x={400} y={930} s={0.95} outfit="shirt" body="#2FB3A6" glasses rim="#7FD8FF" pose={t < 14.2 ? 'think' : 'shock'} t={t} id="buyer2" />
        <NPill text="العقد" x={1100} y={300} size={44} kind="gold" id="deal" p={Math.min(1, Math.max(0, (t - 13.6) / 0.4))} />
      </>
    );
  } else {
    const k = Math.min(2, Math.floor((t - 15) / 3));
    const part = ROLES.slice([0, 15, 29][k], [15, 29, 43][k]);
    const pos = grid(part.length, Math.ceil(part.length / 2), 170, 262, [450, 920]);
    s = (
      <>
        <Sky t={t} />
        {part.map(([role, name], i) => (
          <g key={role}>
            <StoryPerson x={pos[i].x} y={pos[i].y} s={0.56} role={role} t={t + i} id={`r${role}`} />
            <NPill text={name} x={pos[i].x} y={pos[i].y + 52} size={34} kind="white" id={`rp${role}`} />
          </g>
        ))}
      </>
    );
  }
  return (
    <Stage bg="#0F062B">
      <NightScreen>{s}</NightScreen>
    </Stage>
  );
};

