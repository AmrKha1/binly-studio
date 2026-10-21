import React from 'react';
import {Stage} from '../../kit/stage';
import {BgPlate, Depth} from '../../kit/asset';
import {ImageHost} from '../../kit/image-host';
import {PopText, SpeedLines, Burst, Tilt, Punch, EmoteMark} from '../../kit/editfx';
import {Stat} from '../../kit/text';
import {C} from '../../kit/theme';
import {ramp, ease} from '../../kit/anim';

// Edit FX showcase. 0–3: burst + "500 MILLION" + speed lines + angry host with anger mark + punch-in.
// 3–6: tilted counter "469,981" with depth blur + PopText "6:30 AM". Stills 1.6, 4.6.
export const EditFx: React.FC<{t: number}> = ({t}) => {
  if (t < 3)
    return (
      <Stage>
        <Punch t={t} at={0.5}>
          <BgPlate slug="_pilot" file="treasury.jpg" t={t} a={0} b={3} push="in" amount={0.05} />
          <SpeedLines t={t} p={ramp(t, 0.45, 0.6) * (1 - ramp(t, 2.2, 2.8))} cx={720} cy={520} color="#FFFFFF" />
          <Burst t={t} at={0.5} x={720} y={520} r={360} />
          <PopText t={t} at={0.6} x={720} y={440} text="500" size={190} fill="#E04A3A" shadow="#2B2420" rot={-6} />
          <PopText t={t} at={0.75} x={720} y={640} text="MILLION" size={170} fill="#E04A3A" shadow="#2B2420" rot={-6} />
          <ImageHost t={t} who="oddestory" x={1560} y={1110} h={760} flip poses={[[0, 'furious']]} id="fx1" />
          <EmoteMark t={t} at={0.9} x={1420} y={330} kind="anger" s={1.3} />
        </Punch>
      </Stage>
    );
  return (
    <Stage>
      <rect x={0} y={0} width={1920} height={1080} fill="#F4F5F7" />
      <SpeedLines t={t} p={0.6} cx={1100} cy={520} color="#D9DCE3" inner={650} />
      <Tilt t={t} x={960} y={520} angle={-7} skew={-8}>
        <Stat x={1180} y={480} value="469,981" p={ramp(t, 3.1, 4.4, ease.linear)} size={210} color="#3A3F4A" anchor="middle" label="views" />
        <rect x={420} y={560} width={1300} height={26} rx={13} fill="#E2E2E7" />
        <rect x={420} y={560} width={1300 * ramp(t, 3.2, 4.4)} height={26} rx={13} fill="#E85B4C" />
        <Depth blur={6}>
          <Stat x={760} y={800} value="3,733" p={ramp(t, 3.3, 4.4, ease.linear)} size={150} color="#5A5F6A" anchor="middle" />
        </Depth>
      </Tilt>
      <PopText t={t} at={4} x={560} y={200} text="6:30 AM" size={140} fill="#FFFFFF" shadow="#1F2A5C" rot={-4} />
    </Stage>
  );
};
