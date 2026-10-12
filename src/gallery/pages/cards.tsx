import React from 'react';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {ramp} from '../../kit/anim';
import {Bubble, DocumentPage, Note, OpenBook, Polaroid, Screen, ScreenText, StudyCard} from '../../kit/cards';
import {Person} from '../../kit/people';

// Paper objects showcase; settled by t = 4.
export const Cards: React.FC<{t: number}> = ({t}) => (
  <Stage>
    <DocumentPage x={250} y={330} s={0.72} p={ramp(t, 0, 1)} rot={-3} title="On the Pestilence" subtitle="Faculty of Medicine · Paris · 1348" highlight={{line: 5, p: ramp(t, 1.5, 2.5)}} seal signature write={ramp(t, 0.3, 2)} />
    <StudyCard x={800} y={250} p={ramp(t, 0.4, 1.4)} title="Inner speech, sampled at random moments" who="Hurlburt & Heavey" year="2011" finding="Inner speech in about 26% of moments" n="≈30 participants" tag={{text: 'One method', kind: 'caution'}} />
    <Polaroid id="pg" x={1450} y={280} w={380} p={ramp(t, 0.6, 1.6)} rot={4} caption="T. rex, reconstructed" imageBg={C.paperShade}>
      <circle r={70} fill={C.oxLight} />
    </Polaroid>
    <Note x={1780} y={640} text="Heat opens the body." p={ramp(t, 0.8, 1.8)} />
    <OpenBook x={300} y={830} s={0.62} p={ramp(t, 1, 2)} leftTitle="Humors" rightTitle="Balance" />
    <Screen id="sc" x={960} y={690} w={620} h={300} p={ramp(t, 1.2, 2.2)}>
      <ScreenText x={40} y={110} text="i should call him tomorrow" p={ramp(t, 2, 3.6)} t={t} size={40} />
      <text x={40} y={220} fontFamily="Inter" fontWeight={700} fontSize={22} letterSpacing={3} fill={C.cautionLight}>DECODING · 74% ACCURACY</text>
    </Screen>
    <Person x={1400} y={1040} s={0.6} t={t} outfit="casual" hair="short" pose="think" expression="thinking" skin={2} />
    <Bubble x={1470} y={560} w={380} h={150} text="Next, colour." to={{x: 1420, y: 720}} p={ramp(t, 1.6, 2.2)} kind="inner" type={ramp(t, 2, 3)} />
    <Bubble x={1760} y={930} w={260} h={120} text="Hello!" to={{x: 1640, y: 980}} p={ramp(t, 2, 2.6)} />
    <Bubble x={1150} y={450} w={260} h={170} to={{x: 1360, y: 640}} p={ramp(t, 2.2, 2.8)} kind="thought" text="…" />
  </Stage>
);
