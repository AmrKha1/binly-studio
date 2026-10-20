import React from 'react';
import {Stage} from '../../kit/stage';
import {GlowBackdrop, Halo, Sparkles} from '../../kit/fx';
import {Headline, GlowPill, SlamTitle, Stat, HandNote} from '../../kit/text';
import {CompareShot, ListShot} from '../../kit/templates';
import {Icon} from '../../kit/icons';
import {C, GLOW} from '../../kit/theme';
import {ramp} from '../../kit/anim';

// Bilingual test page for the Arabic engine (render with props {page:'arabic', lang:'ar'} → mirrored RTL + Arabic fonts).
// 0–3 glow hero scene · 3–6 SlamTitle · 6–9 ListShot (row grows right→left in Arabic) · 9–12 CompareShot. Stills at 2.5, 5, 8.5, 11.5.
const Gem: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} filter={GLOW.lavender}>
    <polygon points="-56,-40 56,-40 84,-12 0,80 -84,-12" fill="#D8CFDC" />
    <polygon points="-56,-40 -28,-12 -84,-12" fill="#FFFFFF" />
    <polygon points="-28,-12 28,-12 0,-40" fill="#FFFFFF" />
    <polygon points="28,-12 56,-40 84,-12" fill="#8C7BA0" />
    <polygon points="-84,-12 0,80 -28,-12" fill="#B5A9C2" />
    <polygon points="-28,-12 28,-12 0,80" fill="#ECE7F0" />
    <polygon points="28,-12 84,-12 0,80" fill="#8C7BA0" />
    <polyline points="-56,-40 56,-40 84,-12 0,80 -84,-12 -56,-40" fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinejoin="round" />
  </g>
);

export const Arabic: React.FC<{t: number}> = ({t}) => {
  if (t < 3)
    return (
      <Stage>
        <GlowBackdrop t={t} id="ar0" x={560} y={600} tone="lavender" />
        <Headline x={960} y={190} text="أكبر ألماسة في التاريخ" size={96} accent={{'ألماسة': C.gold}} p={ramp(t, 0.1, 0.8)} />
        <Halo id="ar0h" x={560} y={600} r={330} />
        <Gem x={560} y={600} s={2.6} />
        <Sparkles t={t} x={560} y={580} r={260} n={5} size={30} />
        <GlowPill x={1340} y={400} text="الوزن" kind="ink" anchor="center" p={ramp(t, 0.3, 0.9)} size={52} />
        <Stat x={1340} y={620} value="3,106" p={ramp(t, 0.4, 1.4)} size={190} color={C.gold} count={false} />
        <Headline x={1340} y={760} text="قيراط" size={84} p={ramp(t, 0.6, 1.2)} />
        <GlowPill x={1340} y={870} text="شبه عديمة اللون" kind="caution" anchor="center" p={ramp(t, 0.8, 1.4)} size={50} />
        <HandNote x={300} y={300} text="ليس صحيحاً!" p={ramp(t, 1, 2)} size={64} />
      </Stage>
    );
  if (t < 6)
    return (
      <Stage>
        <GlowBackdrop t={t} id="ar1" tone="warm" />
        <Icon name="globe" x={960} y={560} s={4} color={C.ink} accent={C.evidence} />
        <SlamTitle t={t} at={3.6} text="الحرب" tone="red" sub="1914 – 1918" />
      </Stage>
    );
  if (t < 9)
    return (
      <ListShot t={t} a={6} b={9} kicker="داخل الحمّام" title="أكثر من مجرد غسل" items={[{label: 'العناية', icon: 'hand'}, {label: 'الأحاديث', icon: 'speech'}, {label: 'العلاج', icon: 'heart', kind: 'signal'}]} at={6.3} gap={0.5} />
    );
  return (
    <CompareShot t={t} a={9} b={12} kicker="تفسيران" left={{title: 'الهواء الفاسد', bullets: ['رائحة كريهة', 'مقبول ١٥٠٠ سنة'], icon: 'wind', kind: 'theory'}} right={{title: 'الجراثيم', bullets: ['كائنات حية', 'ثبت عام 1861'], icon: 'germ', kind: 'confirmed'}} at={9.2} rightAt={9.6} verdict={{text: 'الجراثيم تفوز', side: 'right', kind: 'confirmed', at: 10.4}} />
  );
};
