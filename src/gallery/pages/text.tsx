import React from 'react';
import {Stage} from '../../kit/stage';
import {C, FONT_SERIF} from '../../kit/theme';
import {ramp} from '../../kit/anim';
import {Circled, HandNote, Headline, Highlight, Kicker, NameTag, RedPen, Stat, Tag, TitleCard, Underline, textW} from '../../kit/text';
import {RichText} from '../../kit/templates';

// Typography showcase. Everything settles by t = 3 s.
export const Text: React.FC<{t: number}> = ({t}) => (
  <Stage>
    <Kicker x={120} y={110} text="Kicker label" anchor="start" p={ramp(t, 0, 0.6)} />
    <Headline x={120} y={200} text="A hot bath was medicine." anchor="start" p={ramp(t, 0.1, 1.2)} size={78} mode="words" accent={{medicine: C.oxblood}} />
    <Highlight x={116} y={250} w={420} h={60} p={ramp(t, 0.8, 1.6)} />
    <Headline x={120} y={300} text="Heat opens the body" anchor="start" p={ramp(t, 0.6, 1.6)} size={56} mode="mask" italic />
    <Underline x={120} y={322} w={500} p={ramp(t, 1.4, 2.2)} />
    <Tag x={120} y={410} text="Confirmed" kind="confirmed" p={ramp(t, 0.5, 1.5)} />
    <Tag x={380} y={410} text="Theory" kind="theory" p={ramp(t, 0.7, 1.7)} />
    <Tag x={590} y={410} text="Debated" kind="caution" p={ramp(t, 0.9, 1.9)} />
    {/* key words get the yellow marker (preferred over plain paragraphs) */}
    <RichText x={120} y={468} w={700} h={170} p={ramp(t, 0.8, 1.8)} size={34} weight={500} mode="fade" text="Physicians prescribed baths for fevers, joint pain and headaches, adjusting the temperature." mark={['fevers', 'joint', 'pain', 'headaches']} markP={ramp(t, 1.8, 2.6)} />
    <NameTag x={120} y={720} name="Ibn al-Khatib" sub="Physician · Granada · 1349" p={ramp(t, 1, 2)} />
    {/* Binly default verdict: the editor's red pen */}
    <text x={1150} y={150} fontFamily={FONT_SERIF} fontWeight={600} fontSize={54} fill={C.ink} opacity={ramp(t, 0.2, 0.8)}>Baths spread the plague.</text>
    <RedPen lines={[{x: 1150, y: 137, w: textW('Baths spread the plague.', 54, 'serif') * 0.98}]} note="mostly wrong!" noteX={1420} noteY={222} p={ramp(t, 1.0, 2.2)} />
    <Stat x={1440} y={470} value="0.061" unit="%" label="of all surgeries" p={ramp(t, 0.5, 2.5)} color={C.oxblood} />
    <Stat x={1440} y={760} value="505,000" label="intraocular surgeries" p={ramp(t, 0.5, 2.5)} size={130} />
    <Circled x={1450} y={400} rx={330} ry={108} p={ramp(t, 2.2, 3)} />
    <HandNote x={880} y={660} text="the street name!" p={ramp(t, 1.5, 2.6)} />
    <g>
      <rect x={0} y={860} width={1920} height={220} fill={C.ink} />
      <TitleCard x={960} y={990} kicker="Part two" title="The Black Death" p={ramp(t, 0.5, 2.5)} color={C.paperLight} size={72} />
    </g>
  </Stage>
);
