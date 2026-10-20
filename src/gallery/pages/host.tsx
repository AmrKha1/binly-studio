import React from 'react';
import {Stage} from '../../kit/stage';
import {GlowBackdrop} from '../../kit/fx';
import {Host, HostPose, HostFace, hostShot} from '../../kit/host';
import {GlowFloor} from '../../kit/fx';
import {Icon} from '../../kit/icons';
import {C} from '../../kit/theme';
import {ease, lerp} from '../../kit/anim';
import {GlowPill} from '../../kit/text';

// AZTIKA host showcase: 7 pose/face combos side by side (still at 2), page "host2": one big host talking + changing pose.
const SET: [HostPose, HostFace][] = [['idle', 'neutral'], ['pointRight', 'surprised'], ['present', 'happy'], ['shrug', 'worried'], ['think', 'thinking'], ['thumbsUp', 'wink'], ['surprised', 'excited']];
export const HostPage: React.FC<{t: number}> = ({t}) => (
  <Stage>
    {SET.map(([pose, face], i) => (
      <g key={i}>
        <Host t={t} x={150 + i * 270} y={900} s={0.62} poses={[[0, pose]]} faces={[[0, face]]} talk={i === 2 ? 0.7 : 0} id={`h${i}`} />
        <GlowPill x={150 + i * 270} y={970} text={pose} kind="ink" anchor="center" p={1} size={44} />
      </g>
    ))}
  </Stage>
);
export const HostPage2: React.FC<{t: number}> = ({t}) => (
  <Stage>
    <GlowBackdrop t={t} id="hp2" x={620} y={560} tone="gold" strength={0.8} />
    <Host t={t} x={620} y={1030} s={1.05} id="big"
      poses={[[0, 'idle'], [1, 'pointRight'], [2.5, 'present'], [4, 'shrug'], [5.5, 'thumbsUp']]}
      faces={[[0, 'neutral'], [1, 'surprised'], [2.5, 'happy'], [4, 'worried'], [5.5, 'wink']]}
      talk={0.5 + 0.5 * Math.abs(Math.sin(t * 9))} />
  </Stage>
);

// page "host3": framings — 0–2 half (waist up) · 2–4 close (head & shoulders) · 4–6 peek from the edge · 6–8 walking across
// Stills at 1, 3, 5, 7.
export const HostPage3: React.FC<{t: number}> = ({t}) => {
  const w = Math.floor(t / 2);
  if (w === 0) {
    const h = hostShot('half', 'right');
    return (
      <Stage>
        <GlowBackdrop t={t} id="hf0" x={620} y={520} tone="lavender" />
        <Icon name="lightbulb" x={620} y={520} s={3} color={C.ink} accent={C.goldLight} />
        <Host t={t} {...h} poses={[[0, 'pointLeft']]} faces={[[0, 'excited']]} talk={0.5 + 0.5 * Math.abs(Math.sin(t * 9))} id="hf0h" />
      </Stage>
    );
  }
  if (w === 1) {
    const h = hostShot('close', 'center');
    return (
      <Stage>
        <GlowBackdrop t={t} id="hf1" tone="warm" />
        <Host t={t} {...h} poses={[[0, 'surprised']]} faces={[[0, 'surprised']]} id="hf1h" />
      </Stage>
    );
  }
  if (w === 2) {
    const h = hostShot('peek', 'left');
    return (
      <Stage>
        <GlowBackdrop t={t} id="hf2" x={1100} tone="green" />
        <Icon name="globe" x={1150} y={540} s={3.4} color={C.ink} accent={C.evidence} />
        <Host t={t} {...h} poses={[[0, 'wave']]} faces={[[0, 'happy']]} id="hf2h" />
      </Stage>
    );
  }
  const k = ease.inOut(Math.min(1, (t - 6) / 2));
  return (
    <Stage>
      <GlowFloor t={t} id="hf3" horizon={700} tone="gold" />
      <Host t={t} x={lerp(260, 1660, k)} y={1000} s={0.75} poses={[[0, 'idle']]} faces={[[0, 'happy']]} walk={1} id="hf3h" />
    </Stage>
  );
};
