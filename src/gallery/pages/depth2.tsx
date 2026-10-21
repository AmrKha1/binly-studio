import React from 'react';
import {Stage} from '../../kit/stage';
import {BgPlate, Depth, ImageAsset} from '../../kit/asset';
import {ImageHost} from '../../kit/image-host';
import {ramp} from '../../kit/anim';

// Depth polish demo: blurred foreground host (left), sharp object + host in focus (right). Rack focus 0.5–1.5 s. Still at 2.
export const DepthDemo: React.FC<{t: number}> = ({t}) => (
  <Stage>
    <BgPlate slug="_pilot" file="treasury.jpg" t={t} a={0} b={3} push="in" amount={0.04} />
    <ImageAsset slug="_pilot" name="treasure-chest" x={1050} y={640} w={360} ar={753 / 701} />
    <ImageHost t={t} who="oddestory" x={1520} y={1110} h={760} flip poses={[[0, 'scheming']]} life={0.6} id="dd2" />
    <Depth blur={ramp(t, 0.5, 1.5) * 12} dim={0.04}>
      <ImageHost t={t} who="oddestory" x={330} y={1180} h={1050} poses={[[0, 'skeptical']]} life={0.4} swapSfx={false} id="dd1" />
    </Depth>
  </Stage>
);
