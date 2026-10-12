import React from 'react';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {keys, ramp} from '../../kit/anim';
import {Kicker} from '../../kit/text';
import {BalanceScale, BarChart, Comparison, CounterRow, DotGrid, Gauge, LineChart, Meter, PercentRing, TimelineAxis} from '../../kit/data';

// Data-viz showcase with Binly-like figures. Everything settles by t ≈ 3.6 s.
const Cap: React.FC<{x: number; y: number; text: string; t: number; a: number}> = ({x, y, text, t, a}) => (
  <Kicker x={x} y={y} text={text} anchor="start" size={18} color={C.oxblood} p={ramp(t, a, a + 0.5)} />
);

export const Data: React.FC<{t: number}> = ({t}) => {
  const tilt = keys(t, [
    [0.6, 0],
    [1.4, -0.6],
    [2.4, 0.75],
  ]);
  return (
    <Stage>
      {/* row 1 */}
      <Cap x={70} y={70} text="BarChart · highlight" t={t} a={0} />
      <BarChart
        x={70}
        y={100}
        w={560}
        h={290}
        p={ramp(t, 0.1, 2.6)}
        highlight={0}
        bars={[
          {label: 'Florence', value: 60, valueLabel: '60%'},
          {label: 'Paris', value: 50, valueLabel: '50%'},
          {label: 'London', value: 45, valueLabel: '45%'},
          {label: 'Milan', value: 15, valueLabel: '15%'},
        ]}
      />
      <Cap x={720} y={70} text="DotGrid · 26 of 100" t={t} a={0.1} />
      <DotGrid x={720} y={100} cols={10} rows={10} filled={26} size={22} gap={9} p={ramp(t, 0.2, 3)} />
      <Cap x={1110} y={70} text="PercentRing" t={t} a={0.2} />
      <PercentRing x={1240} y={235} r={100} value={26} label="26%" caption="of waking moments" p={ramp(t, 0.3, 2.8)} />
      <Cap x={1480} y={70} text="Gauge · certainty" t={t} a={0.3} />
      <Gauge x={1650} y={310} r={150} value={0.72} labels={['Guess', 'Proven']} valueLabel="Likely" zones={[C.theoryTint, C.cautionTint, C.evidenceTint]} color={C.evidence} p={ramp(t, 0.4, 3)} />

      {/* row 2 */}
      <Cap x={70} y={460} text="LineChart · draw-on" t={t} a={0.5} />
      <LineChart
        x={150}
        y={530}
        w={470}
        h={140}
        p={ramp(t, 0.6, 3.4)}
        points={[
          [1340, 75],
          [1347, 80],
          [1351, 50],
          [1361, 45],
          [1400, 40],
          [1450, 52],
        ]}
        yDomain={[0, 100]}
        yTicks={[0, 50, 100]}
        xTicks={[1340, 1400, 1450]}
        fmtY={(v) => `${v}M`}
        highlight={{index: 3, label: '45M'}}
        yLabel="Europe population"
      />
      <Cap x={720} y={460} text="Comparison" t={t} a={0.6} />
      <Comparison
        x={720}
        y={480}
        w={1130}
        h={270}
        p={ramp(t, 0.7, 2.8)}
        left={{title: 'Miasma theory', value: '1,500', body: 'years as the accepted explanation.', color: C.theory}}
        right={{title: 'Germ theory', value: '1861', count: false, body: 'Pasteur shows microbes cause decay.', color: C.evidence}}
      />

      {/* row 3 */}
      <Cap x={70} y={790} text="TimelineAxis · cursor" t={t} a={0.8} />
      <TimelineAxis
        x={110}
        y={960}
        w={760}
        from={-500}
        to={2000}
        ticks={500}
        p={ramp(t, 0.9, 3.6)}
        cursor={keys(t, [
          [1.6, -500],
          [3.6, 1348],
        ])}
        labelSize={24}
        events={[
          {year: -400, label: 'Hippocrates', above: true, stem: 44},
          {year: 165, label: 'Antonine Plague', above: true, stem: 104, color: C.theory},
          {year: 1348, label: 'Black Death', above: true, stem: 44, color: C.oxblood},
          {year: 1861, label: 'Germ theory', above: true, stem: 104, color: C.evidence},
        ]}
      />
      <Cap x={980} y={790} text="BalanceScale" t={t} a={0.9} />
      <BalanceScale x={1180} y={860} s={0.5} tilt={tilt} leftLabel="Miasma" rightLabel="Germs" leftItems={2} rightItems={5} p={ramp(t, 1, 1.6)} />
      <Cap x={1440} y={790} text="Meter" t={t} a={1} />
      <Meter x={1440} y={880} w={400} value={0.35} labels={['Speculation', 'Confirmed']} valueLabel="Debated" color={C.caution} p={ramp(t, 1.1, 3)} />
      <CounterRow
        x={1400}
        y={1010}
        w={480}
        size={56}
        p={ramp(t, 1.2, 3.6)}
        items={[
          {value: '1347', label: 'Arrives', count: false},
          {value: '25M', label: 'Dead', color: C.oxblood},
          {value: '4', label: 'Years'},
        ]}
      />
    </Stage>
  );
};
