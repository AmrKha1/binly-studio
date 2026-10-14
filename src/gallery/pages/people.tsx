import React from 'react';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {Kicker} from '../../kit/text';
import {Crowd, Person} from '../../kit/people';

// Characters showcase: poses, outfits, props, age / build, sit / lie, crowd. t drives idle/blink/walk/talk/wave.
const S = 0.5;
const R1 = 322; // floor lines of the three rows
const R2 = 672;
const R3 = 1012;
const col = (i: number) => 96 + i * 192;

export const People: React.FC<{t: number}> = ({t}) => (
  <Stage>
    {[R1, R2, R3].map((y) => (
      <rect key={y} x={0} y={y - 4} width={1920} height={10} fill={C.paperShade} />
    ))}

    {/* row 1: poses */}
    <Person x={col(0) - 30} y={R1} s={S} t={t} outfit="robe" hat="coif" beard="full" pose="point" expression="determined" seed={1} />
    <Kicker x={col(0)} y={R1 + 36} text="point" size={16} />
    <Person x={col(1) - 30} y={R1} s={S} t={t} outfit="royal" hat="crown" beard="short" pose="present" skin={0} seed={2} />
    <Kicker x={col(1)} y={R1 + 36} text="present" size={16} />
    <Person x={col(2)} y={R1} s={S} t={t} outfit="labcoat" hair="side" glasses pose="think" expression="thinking" skin={3} seed={4} />
    <Kicker x={col(2)} y={R1 + 36} text="think" size={16} />
    <Person x={col(3)} y={R1} s={S} t={t} outfit="robe" hair="tonsure" pose="facepalm" expression="sad" seed={11} />
    <Kicker x={col(3)} y={R1 + 36} text="facepalm" size={16} />
    <Person x={col(4)} y={R1} s={S} t={t} outfit="scrubs" hat="surgical" pose="cheer" expression="happy" skin={3} seed={10} />
    <Kicker x={col(4)} y={R1 + 36} text="cheer" size={16} />
    <Person x={col(5)} y={R1} s={S} t={t} outfit="suit" hair="bald" pose="armsCrossed" talk={Math.max(0, Math.sin(t * 9))} skin={2} seed={8} />
    <Kicker x={col(5)} y={R1 + 36} text="armsCrossed" size={16} />
    <Person x={col(6) - 20} y={R1} s={S} t={t} outfit="casual" hair="curly" pose="wave" expression="smile" skin={4} seed={5} />
    <Kicker x={col(6)} y={R1 + 36} text="wave" size={16} />
    <Person x={col(7)} y={R1} s={S} t={t} outfit="dress" hat="veil" hair="long" pose="worried" expression="worried" skin={2} seed={3} />
    <Kicker x={col(7)} y={R1 + 36} text="worried" size={16} />
    <Person x={col(8)} y={R1} s={S} t={t} outfit="casual" hair="ponytail" pose="handsOnHips" expression="determined" skin={1} seed={12} />
    <Kicker x={col(8)} y={R1 + 36} text="handsOnHips" size={16} />
    <Person x={col(9)} y={R1} s={S} t={t} outfit="coat" hair="short" beard="moustache" pose="awe" expression="surprised" skin={0} seed={7} />
    <Kicker x={col(9)} y={R1 + 36} text="awe" size={16} />

    {/* row 2: new outfits + props */}
    <Person x={col(0) - 20} y={R2} s={S} t={t} outfit="peasant" hat="coif" hair="long" pose="carry" prop="basket" skin={1} seed={13} />
    <Kicker x={col(0)} y={R2 + 36} text="peasant" size={16} />
    <Person x={col(1)} y={R2} s={S} t={t} outfit="soldier" pose="kneel" expression="determined" skin={2} seed={14} />
    <Kicker x={col(1)} y={R2 + 36} text="soldier · kneel" size={16} />
    <Person x={col(2) - 10} y={R2} s={S} t={t} outfit="nun" pose="hold" prop="book" expression="smile" skin={0} seed={15} />
    <Kicker x={col(2)} y={R2 + 36} text="nun · book" size={16} />
    <Person x={col(3) - 20} y={R2} s={S} t={t} outfit="merchant" hat="beret" beard="short" pose="present" prop="scroll" skin={3} seed={16} />
    <Kicker x={col(3)} y={R2 + 36} text="merchant" size={16} />
    <Person x={col(4) - 10} y={R2} s={S} t={t} outfit="worker" pose="hold" prop="tool" skin={4} seed={17} />
    <Kicker x={col(4)} y={R2 + 36} text="worker · tool" size={16} />
    <Person x={col(5) - 10} y={R2} s={S} t={t} outfit="casual" hair="side" pose="hold" prop="phone" look={0.6} tilt={8} skin={2} seed={18} />
    <Kicker x={col(5)} y={R2 + 36} text="phone" size={16} />
    <Person x={col(6) - 10} y={R2} s={S} t={t} outfit="labcoat" hair="bun" pose="hold" prop="cup" expression="smile" skin={1} seed={19} />
    <Kicker x={col(6)} y={R2 + 36} text="cup" size={16} />
    <Person x={col(7)} y={R2} s={S} t={t} outfit="tunic" hat="hood" prop="lantern" age="elder" beard="full" skin={1} seed={20} />
    <Kicker x={col(7)} y={R2 + 36} text="elder · lantern" size={16} />
    <Person x={col(8) - 20} y={R2} s={S} t={t} outfit="tunic" hat="hood" walk={t * 0.9} skin={3} seed={6} />
    <Kicker x={col(8)} y={R2 + 36} text="walk" size={16} />
    <Person x={col(9)} y={R2} s={S} t={t} outfit="casual" hair="short" pose="kneel" expression="sad" build="heavy" skin={0} seed={21} facing={-1} />
    <Kicker x={col(9)} y={R2 + 36} text="kneel · heavy" size={16} />

    {/* row 3: sit / lie / age / build / crowd */}
    <rect x={44} y={R3 - 154} width={130} height={14} fill={C.woodDark} />
    <rect x={52} y={R3 - 140} width={12} height={140} fill={C.woodDark} />
    <rect x={154} y={R3 - 140} width={12} height={140} fill={C.woodDark} />
    <Person x={160} y={R3} s={S} t={t} outfit="nightwear" hair="bun" sit={1} pose="write" expression="smile" seed={9} />
    <Kicker x={130} y={R3 + 36} text="sit · write" size={16} />
    <rect x={300} y={R3 - 40} width={330} height={40} rx={6} fill={C.wood} />
    <rect x={300} y={R3 - 52} width={90} height={22} rx={10} fill={C.paperLight} />
    <Person x={600} y={R3 - 40} s={S} t={t} outfit="nightwear" hair="short" lie={1} blink={1} expression="sad" skin={2} seed={22} />
    <Kicker x={465} y={R3 + 36} text="lie · sick in bed" size={16} />
    <Person x={760} y={R3} s={S} t={t} age="child" outfit="casual" hair="curly" pose="wave" expression="happy" skin={3} seed={23} />
    <Person x={880} y={R3} s={S} t={t} outfit="dress" hair="long" pose="idle" skin={3} seed={24} />
    <Person x={1000} y={R3} s={S} t={t} age="elder" outfit="coat" hair="bald" beard="short" glasses skin={3} seed={25} />
    <Kicker x={880} y={R3 + 36} text="age · child adult elder" size={16} />
    <Person x={1150} y={R3} s={S} t={t} build="slim" outfit="suit" hair="side" skin={1} seed={26} />
    <Person x={1270} y={R3} s={S} t={t} build="average" outfit="suit" hair="side" skin={1} seed={26} />
    <Person x={1400} y={R3} s={S} t={t} build="heavy" outfit="suit" hair="side" skin={1} seed={26} />
    <Kicker x={1275} y={R3 + 36} text="build · slim avg heavy" size={16} />
    <Crowd x={1700} y={R3} w={400} n={8} rows={2} t={t} seed={3} s={0.42} era="medieval" variety />
    <Kicker x={1700} y={R3 + 36} text="crowd · variety" size={16} />
  </Stage>
);
