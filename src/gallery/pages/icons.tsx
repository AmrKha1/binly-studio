import React from 'react';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {mixHex, ramp, stagger} from '../../kit/anim';
import {Kicker} from '../../kit/text';
import {Icon, ICON_NAMES} from '../../kit/icons';

// Icon family showcase: every icon in a grid with its name. All settled by t = 3.2 s.
const COLS = 11;
const X0 = 120;
const DX = 168;
const Y0 = 178;
const DY = 154;
const KNOCK = mixHex(C.paper, C.paperShade, 0.45); // cut-outs match the tile behind each icon

export const Icons: React.FC<{t: number}> = ({t}) => (
  <Stage>
    <Kicker x={X0 - 50} y={70} text={`Binly icons · ${ICON_NAMES.length}`} anchor="start" size={22} color={C.oxblood} p={ramp(t, 0, 0.5)} />
    <Kicker x={1850} y={70} text="ink + oxblood accent · 96 px base" anchor="end" size={18} p={ramp(t, 0.2, 0.7)} />
    {ICON_NAMES.map((name, i) => {
      const x = X0 + (i % COLS) * DX;
      const y = Y0 + Math.floor(i / COLS) * DY;
      const p = stagger(t, 0.2, i, 0.035, 0.7);
      return (
        <g key={name}>
          <circle cx={x} cy={y} r={58} fill={C.paperShade} opacity={0.45 * Math.min(1, p * 2)} />
          <Icon name={name} x={x} y={y} s={0.84} p={p} knock={KNOCK} />
          <Kicker x={x} y={y + 82} text={name} size={16} p={p} />
        </g>
      );
    })}
  </Stage>
);
