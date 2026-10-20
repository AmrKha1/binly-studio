import React from 'react';
import {Stage} from '../../kit/stage';
import {GlowBackdrop, GlowFloor} from '../../kit/fx';
import {ImageHost, imageHostShot} from '../../kit/image-host';
import {HOST_IMAGES} from '../../kit/host-images';
import {GlowPill, Headline} from '../../kit/text';
import {Icon} from '../../kit/icons';
import {C} from '../../kit/theme';
import {ramp, ease, lerp} from '../../kit/anim';

// "ihost": ODDESTORY in scenes. 0–2 slides in (corner) + points at the coin · 2–4 big close reaction · 4–6 walks across
// the glow floor (full body). Stills: 0.45 (entering), 1.5, 3, 5.
export const IHost: React.FC<{t: number}> = ({t}) => {
  if (t < 2)
    return (
      <Stage>
        <GlowBackdrop t={t} id="ih0" x={640} y={560} tone="gold" />
        <Headline x={640} y={180} text="Worth a fortune?" size={84} accent={{fortune: C.gold}} p={ramp(t, 0.1, 0.9, ease.linear)} />
        <Icon name="coin" x={640} y={580} s={3.2} color={C.ink} accent={C.goldLight} />
        <ImageHost t={t} who="oddestory" {...imageHostShot('corner', 'right')} flip poses={[[0, 'think-point'], [1.1, 'point-angry']]} enter={{kind: 'slideRight', at: 0.1}} id="o1" />
      </Stage>
    );
  if (t < 4)
    return (
      <Stage>
        <GlowBackdrop t={t} id="ih1" tone="lavender" />
        <ImageHost t={t} who="oddestory" {...imageHostShot('big', 'center')} poses={[[2, 'surprised'], [2.9, 'shocked']]} talk={0.6} id="o2" />
      </Stage>
    );
  const k = ease.inOut(Math.min(1, (t - 4) / 2));
  return (
    <Stage>
      <GlowFloor t={t} id="ih2" horizon={700} tone="sky" />
      <GlowPill x={1500} y={420} text="Next stop: Paris" kind="caution" anchor="center" p={ramp(t, 4.3, 4.9, ease.linear)} size={52} />
      <ImageHost t={t} who="oddestory" x={lerp(300, 1100, k)} y={1010} h={460} poses={[[4, 'full-walk']]} id="o3" />
    </Stage>
  );
};

// "ihost-all": every ODDESTORY pose with its name (catalog). Still at 1.
export const IHostAll: React.FC<{t: number}> = ({t}) => {
  const names = Object.keys(HOST_IMAGES.oddestory);
  return (
    <Stage>
      {names.map((n, i) => {
        const col = i % 9, row = Math.floor(i / 9);
        const x = 110 + col * 212, y = 330 + row * 350;
        const full = n.startsWith('full-');
        return (
          <g key={n}>
            <ImageHost t={t} who="oddestory" x={x} y={y} h={full ? 150 : 270} poses={[[0, n]]} life={0} swapSfx={false} shadow={false} id={`a${i}`} />
            <GlowPill x={x} y={y + 26} text={n} kind="ink" anchor="center" p={1} size={44} />
          </g>
        );
      })}
    </Stage>
  );
};
