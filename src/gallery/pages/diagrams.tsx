import React from 'react';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {ramp} from '../../kit/anim';
import {Arrow, Bracket, Callout, CheckMark, CrossOut, Cycle, DashedOutline, FlowChain, QuestionMark, Venn} from '../../kit/diagrams';

// Diagram showcase; settled by t = 4.
export const Diagrams: React.FC<{t: number}> = ({t}) => (
  <Stage>
    <FlowChain x={720} y={130} items={['Hot bath', 'Pores open', 'Bad air enters']} kinds={['ink', 'theory', 'caution']} p={ramp(t, 0, 3)} />
    <Cycle x={360} y={560} r={210} items={['Sleep', 'REM', 'Dream', 'Wake']} p={ramp(t, 0.3, 3)} spin={t * 6} />
    <Venn x={1100} y={560} r={180} labels={['Miasma', 'Contagion']} overlap="Crowds" p={ramp(t, 0.5, 2.5)} kinds={['theory', 'confirmed']} />
    <Arrow from={{x: 1450, y: 300}} to={{x: 1800, y: 420}} p={ramp(t, 0.5, 1.5)} bend={-80} color={C.oxblood} />
    <Arrow from={{x: 1450, y: 420}} to={{x: 1800, y: 540}} p={ramp(t, 0.8, 1.8)} bend={60} dashed color={C.theory} />
    <Bracket a={{x: 1520, y: 640}} b={{x: 1520, y: 900}} p={ramp(t, 1, 2)} depth={-36} label="25 years" />
    <Callout target={{x: 1700, y: 760}} label={{x: 1760, y: 680}} text="Porous skin" p={ramp(t, 1.2, 2.2)} kind="theory" />
    <DashedOutline d="M200 900 C260 820 420 820 480 900 C520 960 420 1010 340 1000 C240 990 160 960 200 900 Z" p={ramp(t, 1, 2)} />
    <CrossOut x={700} y={930} size={140} p={ramp(t, 1.5, 2.3)} />
    <CheckMark x={920} y={930} size={140} p={ramp(t, 1.8, 2.6)} />
    <QuestionMark x={1120} y={920} size={180} p={ramp(t, 2, 2.6)} t={t} />
  </Stage>
);
