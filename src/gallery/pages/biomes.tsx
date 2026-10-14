import React from 'react';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {Kicker} from '../../kit/text';
import {stagger} from '../../kit/anim';
import {Biome, Landscape, Tone} from '../../kit/env';
import {EmoteKind, Expression, Person, PosePreset} from '../../kit/people';

// Biomes page: Landscape biomes (kit/env) + Person emotion icons (kit/people). Still at t=4 = settled.
const BIOMES: [Biome, Tone][] = [['temperate', 'day'], ['desert', 'day'], ['mountains', 'overcast'], ['coast', 'dusk'], ['jungle', 'day'], ['snow', 'night']];
const EMOTES: [EmoteKind, Expression, PosePreset][] = [
  ['idea', 'happy', 'think'], ['question', 'thinking', 'shrug'], ['exclaim', 'surprised', 'armsOut'], ['sweat', 'worried', 'worried'], ['anger', 'angry', 'handsOnHips'],
  ['love', 'happy', 'idle'], ['sleep', 'neutral', 'idle'], ['storm', 'sad', 'idle'], ['sparkle', 'happy', 'cheer'],
];
const PW = 560, PH = 315;

export const Biomes: React.FC<{t: number}> = ({t}) => (
  <Stage bg={C.paper}>
    {BIOMES.map(([b, tone], i) => {
      const x = 80 + (i % 3) * 600, y = 24 + Math.floor(i / 3) * 340;
      return (
        <g key={b}>
          <clipPath id={`bio-${i}`}>
            <rect x={x} y={y} width={PW} height={PH} rx={10} />
          </clipPath>
          <g clipPath={`url(#bio-${i})`}>
            <g transform={`translate(${x} ${y}) scale(${PW / 1920})`}>
              <Landscape biome={b} tone={tone} t={t} seed={i + 2} />
            </g>
            <rect x={x + 10} y={y + 10} width={(b.length + tone.length + 3) * 17 * 0.86 + 26} height={32} rx={6} fill={C.paperLight} opacity={0.92} />
            <Kicker x={x + 22} y={y + 33} text={`${b} · ${tone}`} size={17} color={C.ink} anchor="start" />
          </g>
        </g>
      );
    })}
    {EMOTES.map(([k, ex, pose], i) => {
      const x = 120 + i * 210;
      return (
        <g key={k}>
          <Person x={x} y={1010} s={0.42} t={t} facing={i % 3 === 2 ? -1 : 1} emote={k} emoteP={stagger(t, 0.3, i, 0.25, 0.6)} expression={ex} pose={pose} blink={k === 'sleep' ? 1 : undefined} tilt={k === 'sleep' ? 12 : undefined} seed={i + 1} skin={i % 5} outfit={(['casual', 'coat', 'labcoat', 'dress', 'worker', 'suit', 'nightwear', 'merchant', 'robe'] as const)[i]} />
          <Kicker x={x} y={1056} text={k} size={18} color={C.inkSoft} />
        </g>
      );
    })}
  </Stage>
);
