import React from 'react';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {Shots, TransitionKind} from '../../kit/shots';
import {Headline, Kicker} from '../../kit/text';

// Transition showcase: a new transition every 2 s (labels say which). Stills at 1.0, 3.0 (mid), …
const KINDS: TransitionKind[] = ['fade', 'dip', 'ink', 'iris', 'irisOut', 'push', 'paper', 'zoom', 'wipe', 'cut'];
const shot = (i: number) => (t: number) => (
  <Stage bg={i % 2 ? C.ink : C.paper}>
    <circle cx={960 + Math.sin(t) * 40} cy={540} r={220} fill={i % 2 ? C.oxblood : C.evidence} />
    <Headline x={960} y={560} text={`Shot ${i}`} p={1} color={C.paperLight} size={90} />
    <Kicker x={960} y={900} text={i > 0 ? `in: ${KINDS[(i - 1) % KINDS.length]}` : 'start'} p={1} color={i % 2 ? C.paperShade : C.inkMute} size={36} />
  </Stage>
);
export const Transitions: React.FC<{t: number}> = ({t}) => (
  <Shots t={t} shots={Array.from({length: KINDS.length + 1}, (_, i) => ({start: i * 2, render: shot(i), in: i > 0 ? {kind: KINDS[i - 1], x: 1300, y: 400, dir: 'left' as const} : undefined}))} />
);
