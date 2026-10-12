import React from 'react';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {ramp} from '../../kit/anim';
import {Photo, PhotoMark} from '../../kit/photo';
import {Kicker, Tag} from '../../kit/text';

// Archival photo treatments (uses the test image public/test-dinos/img/tournai.jpg).
export const PhotoPage: React.FC<{t: number}> = ({t}) => (
  <Stage bg={C.paperShade}>
    <Photo slug="test-dinos" src="img/tournai.jpg" x={520} y={380} w={760} h={457} t={t} p={ramp(t, 0, 1)} frame="museum" tint="paper" caption="Burial of plague victims, Tournai, 1349" credit="Pierart dou Tielt · Public domain" pan={{a: 0, b: 6, from: [0.5, 0.5, 1], to: [0.35, 0.45, 1.4]}} />
    <PhotoMark x={520} y={380} w={760} h={457} rx={0.3} ry={0.55} rw={0.32} rh={0.5} p={ramp(t, 2, 3)} />
    <Tag x={180} y={110} text="Primary source" kind="confirmed" p={ramp(t, 1, 1.6)} />
    <Photo slug="test-dinos" src="img/tournai.jpg" x={1430} y={300} w={560} h={337} p={ramp(t, 0.3, 1.3)} frame="print" tint="sepia" rot={3} />
    <Kicker x={1430} y={530} text="print · sepia" />
    <rect x={1000} y={600} width={920} height={480} fill={C.ink} />
    <Photo slug="test-dinos" src="img/tournai.jpg" x={1460} y={820} w={640} h={385} p={ramp(t, 0.6, 1.6)} frame="none" tint="ink" credit="Pierart dou Tielt · Public domain" dark />
    <Photo slug="test-dinos" src="img/tournai.jpg" x={520} y={860} w={420} h={253} p={ramp(t, 0.9, 1.9)} frame="polaroid" tint="none" rot={-4} caption="true colour" />
  </Stage>
);
