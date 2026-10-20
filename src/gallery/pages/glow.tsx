import React from 'react';
import {Stage} from '../../kit/stage';
import {GlowBackdrop, GlowFloor, Halo, Sparkles} from '../../kit/fx';
import {Headline, GlowPill, Stat} from '../../kit/text';
import {Icon} from '../../kit/icons';
import {C, GLOW} from '../../kit/theme';
import {ramp} from '../../kit/anim';

// White-mode glow kit: GlowBackdrop (the background), Halo + Sparkles (hero object), GlowPill, gold key word/number.
// One tone per 3 s window: 0 gold · 3 lavender · 6 green · 9 sky · 12 warm. Stills at 2, 5, 8, 11, 14.
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

const SCENES: {tone: 'gold' | 'lavender' | 'green' | 'sky' | 'warm'; title: string; key: string; hero: (t: number) => React.ReactNode; pill: [string, 'caution' | 'theory' | 'confirmed' | 'ink' | 'signal']}[] = [
  {tone: 'gold', title: 'The most expensive land?', key: 'expensive', hero: () => <Icon name="coin" x={960} y={600} s={3.2} color={C.ink} accent={C.goldLight} />, pill: ['$ 45 million', 'caution']},
  {tone: 'lavender', title: 'The biggest diamond ever', key: 'diamond', hero: (t) => <><Halo id="gw-h" x={960} y={590} r={330} /><Gem x={960} y={590} s={2.6} /><Sparkles t={t} x={960} y={570} r={260} n={5} size={30} /></>, pill: ['3,106 carats', 'theory']},
  {tone: 'green', title: 'Life finds a way', key: 'life', hero: () => <Icon name="dna" x={960} y={600} s={3.2} color={C.ink} accent={C.evidence} />, pill: ['Confirmed', 'confirmed']},
  {tone: 'sky', title: 'Inside the machine', key: 'machine', hero: () => <Icon name="computer" x={960} y={600} s={3.2} color={C.ink} accent={C.theory} />, pill: ['Since 1946', 'ink']},
  {tone: 'warm', title: 'A family business', key: 'family', hero: () => <Icon name="house" x={960} y={600} s={3.2} color={C.ink} accent={C.oxblood} />, pill: ['Warning', 'signal']},
];

export const Glow: React.FC<{t: number}> = ({t}) => {
  const i = Math.min(SCENES.length - 1, Math.floor(t / 3));
  const sc = SCENES[i];
  const lt = t - i * 3;
  return (
    <Stage>
      <GlowBackdrop t={t} id={`gw${i}`} x={960} y={590} tone={sc.tone} p={ramp(lt, 0, 0.6)} seed={i + 1} />
      <Headline x={960} y={190} text={sc.title} size={88} accent={{[sc.key]: C.gold}} p={ramp(lt, 0.1, 0.8)} />
      {sc.hero(t)}
      <GlowPill x={960} y={900} text={sc.pill[0]} kind={sc.pill[1]} anchor="center" p={ramp(lt, 0.4, 1)} size={52} />
      {i === 0 && <Stat x={1500} y={640} value="45" unit="M" p={ramp(lt, 0.3, 1.2)} size={150} color={C.gold} />}
    </Stage>
  );
};

// GlowFloor ("stage" background) — page "glowfloor": bars standing on the glowing white floor. Still at 2.
export const GlowFloorPage: React.FC<{t: number}> = ({t}) => {
  const bars = [
    {h: 300, label: '$4.9B'},
    {h: 250, label: '$4B'},
    {h: 190, label: '$3B'},
    {h: 130, label: '$2B'},
    {h: 80, label: '$1B'},
  ];
  return (
    <Stage>
      <GlowFloor t={t} id="gf" horizon={660} tone="lavender" drift={30} />
      {bars.map((b, i) => {
        const x = 780 + i * 250;
        const k = ramp(t, 0.2 + i * 0.15, 0.9 + i * 0.15);
        return (
          <g key={i}>
            <rect x={x - 55} y={700 - b.h * k} width={110} height={b.h * k} rx={10} fill={C.evidenceLight} filter={GLOW.green} />
            <GlowPill x={x} y={700 - b.h * k - 60} text={b.label} kind={i === 0 ? 'caution' : 'ink'} anchor="center" p={ramp(t, 0.6 + i * 0.15, 1.2 + i * 0.15)} size={44} />
          </g>
        );
      })}
      <Icon name="globe" x={420} y={560} s={2.6} color={C.ink} accent={C.theory} />
      <GlowPill x={960} y={960} text="After inflation" kind="ink" anchor="center" p={ramp(t, 0.5, 1.1)} size={52} />
    </Stage>
  );
};
