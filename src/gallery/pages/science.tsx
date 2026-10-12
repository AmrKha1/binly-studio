import React from 'react';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {ease, ramp} from '../../kit/anim';
import {Kicker} from '../../kit/text';
import {
  BloodVessel,
  BodyOutline,
  Brain,
  Cell,
  DNA,
  ElectrodeArray,
  Eye,
  EyeCrossSection,
  Germ,
  Heart,
  HeadProfile,
  ImmuneCell,
  Lungs,
  Molecule,
  Neuron,
  Synapse,
  Waveform,
} from '../../kit/science';

// Science showcase. Everything settles by t = 4 s (idle motion keeps running).
const Cap: React.FC<{x: number; y: number; text: string; t: number; d?: number}> = ({x, y, text, t, d = 0}) => (
  <Kicker x={x} y={y} text={text} size={22} p={ramp(t, 0.2 + d, 0.8 + d)} />
);

export const Science: React.FC<{t: number}> = ({t}) => {
  const blink = Math.max(0, 1 - Math.abs(((t % 3.2) - 2.9) / 0.12));
  return (
    <Stage>
      {/* ---- row 1: heads, brain, body, organs */}
      <HeadProfile x={180} y={270} s={0.54} showBrain implant highlight="motor" hp={ramp(t, 1, 2)} signal={((t - 1.2) % 2.2) / 1.6} t={t} o={ramp(t, 0, 0.6)} />
      <Cap x={180} y={500} text="Head · implant" t={t} />
      <HeadProfile x={500} y={270} s={0.54} facing="left" eeg skin={C.skin[3]} t={t} o={ramp(t, 0.15, 0.75)} />
      <Cap x={500} y={500} text="Head · EEG cap" t={t} d={0.1} />
      <Brain x={970} y={250} s={0.64} lobes labels labelP={ramp(t, 1.2, 2.6)} o={ramp(t, 0.3, 0.9)} />
      <Cap x={970} y={500} text="Brain · lobes" t={t} d={0.2} />
      <BodyOutline x={1420} y={470} s={0.6} t={t} p={ramp(t, 0.2, 1)} organs={{brain: ramp(t, 0.8, 1.4), lungs: ramp(t, 1, 1.6), heart: ramp(t, 1.2, 1.8), stomach: ramp(t, 1.4, 2), blood: ramp(t, 1.6, 3)}} />
      <Cap x={1420} y={500} text="BodyOutline" t={t} d={0.3} />
      <Lungs x={1730} y={190} s={0.58} breath={0.5 + 0.5 * Math.sin(t * 1.6)} o={ramp(t, 0.4, 1)} />
      <Heart x={1730} y={400} s={0.44} t={t} o={ramp(t, 0.5, 1.1)} />
      <Cap x={1730} y={500} text="Lungs · Heart" t={t} d={0.4} />

      {/* ---- row 2: eyes, neuron, synapse, cell */}
      <EyeCrossSection x={250} y={705} s={0.56} rays={ramp(t, 1, 2.4)} labels labelP={ramp(t, 1.6, 3)}>
        <ImmuneCell x={-60 + Math.sin(t * 0.5) * 20} y={70} s={0.34} t={t} heading={-20} seed={2} />
        <ImmuneCell x={-40} y={-74 + Math.sin(t * 0.6) * 12} s={0.3} t={t + 3} heading={160} seed={5} />
      </EyeCrossSection>
      <Cap x={250} y={860} text="EyeCrossSection" t={t} d={0.1} />
      <Eye x={630} y={705} s={0.6} look={[Math.sin(t * 0.9) * 0.6, Math.sin(t * 0.7) * 0.3]} blink={blink} pupil={0.35 + 0.25 * ramp(t, 1, 3)} />
      <Cap x={630} y={860} text="Eye" t={t} d={0.2} />
      <Neuron x={900} y={705} s={0.58} signal={((t - 0.5) % 2) / 1.6} o={ramp(t, 0.3, 0.9)} />
      <Cap x={1080} y={860} text="Neuron · signal" t={t} d={0.3} />
      <Synapse x={1450} y={700} s={0.46} p={((t - 0.4) % 3) / 2.4} t={t} />
      <Cap x={1450} y={860} text="Synapse" t={t} d={0.4} />
      <Cell x={1745} y={705} s={0.8} t={t} />
      <Cap x={1745} y={860} text="Cell" t={t} d={0.5} />

      {/* ---- row 3: immune, germs, DNA, molecules, vessel, waves, array */}
      <ImmuneCell x={110} y={960} s={0.6} t={t} heading={10} seed={3} />
      <Cap x={110} y={1048} text="Immune" t={t} d={0.5} />
      <Germ x={250} y={955} s={0.45} kind="rod" t={t} seed={4} />
      <Germ x={355} y={960} s={0.48} kind="coccus" t={t} seed={2} />
      <Germ x={455} y={958} s={0.45} kind="spiral" t={t} seed={3} />
      <Germ x={560} y={958} s={0.55} kind="virus" t={t} seed={1} />
      <Cap x={405} y={1048} text="Germ ×4" t={t} d={0.5} />
      <DNA x={800} y={958} s={0.6} length={400} radius={50} t={t} p={ramp(t, 0.4, 2.2, ease.inOut)} />
      <Cap x={800} y={1048} text="DNA" t={t} d={0.5} />
      <Molecule x={1050} y={950} s={0.52} kind="O2" t={t} spin={20} label p={ramp(t, 0.8, 1.4)} />
      <Molecule x={1160} y={950} s={0.52} kind="CO2" label p={ramp(t, 1, 1.6)} />
      <Molecule x={1275} y={950} s={0.52} kind="H2O" label p={ramp(t, 1.2, 1.8)} />
      <BloodVessel points={[[1350, 1000], [1410, 930], [1480, 975], [1540, 925]]} t={t} width={20} from={C.oxblood} to={C.theory} p={ramp(t, 0.4, 1.4)} />
      <Cap x={1445} y={1048} text="BloodVessel" t={t} d={0.5} />
      <Waveform x={1580} y={925} w={190} amp={20} t={t} kind="speech" p={ramp(t, 0.6, 1.6)} />
      <Waveform x={1580} y={965} w={190} amp={20} t={t} kind="eeg" p={ramp(t, 0.8, 1.8)} />
      <Waveform x={1580} y={1005} w={190} amp={24} t={t} kind="ecg" p={ramp(t, 1, 2)} />
      <Cap x={1675} y={1048} text="Waveform" t={t} d={0.5} />
      <ElectrodeArray x={1835} y={950} s={0.6} t={t} active={ramp(t, 1, 2)} />
      <Cap x={1835} y={1048} text="Array" t={t} d={0.5} />
    </Stage>
  );
};
