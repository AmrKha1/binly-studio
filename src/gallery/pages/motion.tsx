import React from 'react';
import {Stage} from '../../kit/stage';
import {GlowBackdrop} from '../../kit/fx';
import {Headline, GlowPill, Kicker} from '../../kit/text';
import {Icon} from '../../kit/icons';
import {Enter, Attention, EnterKind, AttentionKind} from '../../kit/motion';
import {C} from '../../kit/theme';
import {ramp, ease} from '../../kit/anim';

// Motion presets showcase. 0–2.5 s: every ENTER preset (staggered); 3–5 s: every ATTENTION move; bounce headline on top.
// Stills: 0.7 (mid-entrance), 2.5 (settled), 3.4 (mid-attention).
const ENTERS: EnterKind[] = ['pop', 'bounceDrop', 'backInUp', 'backInLeft', 'jackInTheBox', 'flipIn', 'zoomSpin', 'whipRight', 'stamp', 'rise'];
const ATTS: AttentionKind[] = ['rubberBand', 'heartBeat', 'tada', 'wobble', 'shake', 'pulse', 'jello', 'float'];
const ICONS = ['coin', 'star', 'heart', 'lightbulb', 'crown', 'globe', 'gear', 'key', 'shield', 'book'] as const;

export const Motion: React.FC<{t: number}> = ({t}) => {
  const att = t >= 3;
  return (
    <Stage>
      <GlowBackdrop t={t} id="mo" tone="gold" strength={0.6} />
      <Headline x={960} y={150} text={att ? 'Attention moves' : 'Pop-up and bounce'} size={80} mode="bounce" accent={{bounce: C.gold, attention: C.gold}} p={ramp(t, att ? 3 : 0.1, att ? 3.8 : 0.9, ease.linear)} />
      {(att ? ATTS : ENTERS).map((k, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const x = 260 + col * 350;
        const y = 420 + row * 330;
        const at = (att ? 3.1 : 0.4) + i * 0.12;
        const icon = <Icon name={ICONS[i % ICONS.length]} x={x} y={y} s={1.5} color={C.ink} accent={C.goldLight} />;
        return (
          <g key={k}>
            {att ? (
              <Attention kind={k as AttentionKind} t={t} at={at} x={x} y={y}>
                {icon}
              </Attention>
            ) : (
              <Enter kind={k as EnterKind} p={ramp(t, at, at + 0.8, ease.linear)} x={x} y={y + 60}>
                {icon}
              </Enter>
            )}
            <GlowPill x={x} y={y + 130} text={k} kind="ink" anchor="center" p={1} size={44} />
          </g>
        );
      })}
      <Kicker x={960} y={1010} text="kit/motion — Enter · Attention · Exit" p={1} />
    </Stage>
  );
};
