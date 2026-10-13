import React from 'react';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {ramp} from '../../kit/anim';
import {Kicker} from '../../kit/text';
import {Silhouette, SILHOUETTE_NAMES} from '../../kit/silhouette';

// Shared silhouette library: every entry, plus treatments (fill, dashed "inferred" outline, wipe reveal, flip).
export const Silhouettes: React.FC<{t: number}> = ({t}) => {
  const names = SILHOUETTE_NAMES;
  const colors = [C.ink, C.oxblood, C.evidence, C.theory, C.caution, C.inkLift];
  return (
    <Stage>
      {names.map((n, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 330 + col * 620;
        const y = 380 + row * 360;
        return (
          <g key={n}>
            <Silhouette name={n} x={x} y={y} h={200} color={colors[i % colors.length]} p={ramp(t, 0.2 + i * 0.2, 1.2 + i * 0.2)} reveal="wipe" />
            <Kicker x={x} y={y + 50} text={n} size={20} />
          </g>
        );
      })}
      <Silhouette name="trex" x={1560} y={1000} h={300} color={C.theory} fill={false} outline="dashed" strokeWidth={4} p={ramp(t, 1.5, 2.5)} flip />
      <Kicker x={1560} y={1045} text="dashed outline = inferred" size={20} color={C.theory} />
      <Silhouette name="unknown-animal" x={420} y={1000} h={180} p={1} />
    </Stage>
  );
};
