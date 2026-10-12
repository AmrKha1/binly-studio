import React from 'react';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {Kicker} from '../../kit/text';
import {Crowd, Person} from '../../kit/people';

// Characters showcase. t drives idle/blink/walk/talk.
export const People: React.FC<{t: number}> = ({t}) => (
  <Stage>
    <rect x={0} y={560} width={1920} height={520} fill={C.paperShade} />
    <Person x={150} y={540} s={0.82} t={t} outfit="robe" hat="coif" beard="full" hair="short" pose="point" expression="determined" skin={1} seed={1} />
    <Kicker x={150} y={590} text="physician · point" size={16} />
    <Person x={400} y={540} s={0.82} t={t} outfit="royal" hat="crown" beard="short" hair="short" pose="present" expression="neutral" skin={0} seed={2} />
    <Kicker x={400} y={590} text="king · present" size={16} />
    <Person x={640} y={540} s={0.82} t={t} outfit="dress" hat="veil" hair="long" pose="worried" expression="worried" skin={2} seed={3} facing={-1} />
    <Kicker x={640} y={590} text="dress · worried" size={16} />
    <Person x={880} y={540} s={0.82} t={t} outfit="labcoat" hair="side" glasses pose="think" expression="thinking" skin={3} seed={4} />
    <Kicker x={880} y={590} text="labcoat · think" size={16} />
    <Person x={1120} y={540} s={0.82} t={t} outfit="casual" hair="curly" pose="shrug" expression="surprised" skin={4} seed={5} facing={-1} />
    <Kicker x={1120} y={590} text="casual · shrug" size={16} />
    <Person x={1360} y={540} s={0.82} t={t} outfit="tunic" hat="hood" hair="short" walk={t * 0.9} expression="neutral" skin={1} seed={6} />
    <Kicker x={1360} y={590} text="tunic · walk" size={16} />
    <Person x={1600} y={540} s={0.82} t={t} outfit="coat" hat="tophat" hair="short" beard="moustache" pose="hold" expression="smile" skin={0} seed={7} facing={-1} />
    <Kicker x={1600} y={590} text="coat · hold" size={16} />
    <Person x={1810} y={540} s={0.82} t={t} outfit="suit" hair="bald" pose="idle" talk={Math.max(0, Math.sin(t * 9))} expression="neutral" skin={2} seed={8} facing={-1} />
    <Kicker x={1810} y={590} text="suit · talk" size={16} />

    {/* sitting */}
    <rect x={130} y={858} width={150} height={16} fill={C.woodDark} />
    <rect x={140} y={874} width={14} height={140} fill={C.woodDark} />
    <rect x={256} y={874} width={14} height={140} fill={C.woodDark} />
    <Person x={300} y={1012} s={0.82} t={t} outfit="nightwear" hair="bun" sit={1} pose="write" expression="smile" skin={1} seed={9} />
    <Kicker x={250} y={1060} text="sit · write" size={16} />
    <Person x={560} y={1012} s={0.82} t={t} outfit="scrubs" hat="surgical" hair="short" pose="cheer" expression="happy" skin={3} seed={10} />
    <Kicker x={560} y={1060} text="scrubs · cheer" size={16} />
    <Person x={760} y={1012} s={0.82} t={t} outfit="robe" hair="tonsure" pose="facepalm" expression="sad" skin={1} seed={11} />
    <Kicker x={760} y={1060} text="monk · facepalm" size={16} />
    <Crowd x={1350} y={1010} w={900} n={10} rows={2} t={t} seed={3} s={0.55} era="medieval" />
    <Kicker x={1350} y={1060} text="crowd · medieval" size={16} />
  </Stage>
);
