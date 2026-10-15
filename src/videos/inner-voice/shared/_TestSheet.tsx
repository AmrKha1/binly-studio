// Test sheet for the shared assets (not used by the video). Render by temporarily pointing src/active.ts at
// `testActive` (export {testActive as active} from './videos/inner-voice/shared/_TestSheet') and run
// node tools/sheet.mjs --times 1.2,4.5,9,14,24,34,43.3,48,51.8,54.5,58,65 --cols 3 ; then restore src/active.ts.
import React from 'react';
import {Stage} from '../../../kit/stage';
import {C} from '../../../kit/theme';
import {Kicker} from '../../../kit/text';
import {ramp} from '../../../kit/anim';
import {VideoModule} from '../../../kit/video';
import {Beeper, DecoderRig, SilentWave, ThoughtContent} from './index';

const Lbl: React.FC<{x: number; y: number; text: string; dark?: boolean}> = ({x, y, text, dark}) => <Kicker x={x} y={y} text={text} size={24} color={dark ? C.paperShade : C.inkMute} />;

const Waves1: React.FC<{t: number}> = ({t}) => (
  <Stage bg={C.paper}>
    <Lbl x={560} y={110} text="sound · words · p 0→1" />
    <SilentWave x={130} y={240} w={860} amp={80} t={t} p={ramp(t, 0, 2)} words={['chitty', 'chitty', 'bang', 'bang']} />
    <Lbl x={560} y={450} text="silent 0→1 (t 2→6)" />
    <SilentWave x={130} y={580} w={860} amp={80} t={t} silent={ramp(t, 2, 6)} words={['chitty', 'chitty', 'bang', 'bang']} />
    <Lbl x={560} y={790} text="style line · silent 0.5" />
    <SilentWave x={130} y={900} w={860} amp={70} t={t} style="line" silent={0.5} seed={3} />
    <rect x={1080} y={0} width={840} height={1080} fill={C.ink} />
    <Lbl x={1500} y={110} text="ink · silent 1" dark />
    <SilentWave x={1140} y={240} w={720} amp={80} t={t} tone="ink" silent={1} seed={2} />
    <Lbl x={1500} y={450} text="flat 0→1 (t 6→8)" dark />
    <SilentWave x={1140} y={580} w={720} amp={80} t={t} tone="ink" flat={ramp(t, 6, 8)} seed={2} />
    <Lbl x={1500} y={790} text="ink · line · sound" dark />
    <SilentWave x={1140} y={900} w={720} amp={70} t={t} tone="ink" style="line" seed={4} />
  </Stage>
);

const Waves2: React.FC<{t: number}> = ({t}) => (
  <Stage bg={C.paper}>
    <Lbl x={960} y={130} text="ghost · match 0 (forecast ≠ sound)" />
    <SilentWave x={330} y={330} w={1260} amp={110} t={t} words={['I', 'am', 'thinking', 'this']} ghost={{match: 0, silent: 1}} />
    <Lbl x={960} y={600} text="ghost · match 1 (forecast = sound)" />
    <SilentWave x={330} y={800} w={1260} amp={110} t={t} silent={1} words={['I', 'am', 'thinking', 'this']} ghost={{match: 1, silent: 0, color: C.oxblood}} />
  </Stage>
);

const KINDS = ['words', 'image', 'feeling', 'awareness', 'wordless', 'empty'] as const;
const Thoughts: React.FC<{t: number; t0: number; ink?: boolean}> = ({t, t0, ink}) => (
  <Stage bg={ink ? C.ink : C.paper}>
    {KINDS.map((k, i) => (
      <ThoughtContent
        key={k}
        x={360 + (i % 3) * 600}
        y={300 + Math.floor(i / 3) * 460}
        r={150}
        kind={k}
        t={t}
        p={ramp(t, t0 + i * 0.3, t0 + i * 0.3 + 2)}
        tone={ink ? 'ink' : 'paper'}
        frame={ink ? 'card' : 'circle'}
        text={i === 0 ? (ink ? 'Remember to call her back.' : 'Next, colour.') : undefined}
        label={['inner speech', 'image', 'feeling', 'sensory awareness', 'wordless thought', 'nothing'][i]}
        seed={i + 1}
      />
    ))}
  </Stage>
);

const Beepers: React.FC<{t: number}> = ({t}) => (
  <Stage bg={C.paper}>
    <Beeper x={480} y={540} s={1.4} t={t} beepAt={[43, 46]} p={ramp(t, 40, 41)} />
    <Lbl x={480} y={820} text="paper · beep 43 / 46" />
    <rect x={960} y={0} width={960} height={1080} fill={C.ink} />
    <Beeper x={1440} y={540} s={1.4} r={-8} t={t} beepAt={[43.1]} lcd="NOW" ringColor={C.oxblood} tone="ink" />
    <Lbl x={1440} y={820} text="ink · lcd NOW · oxblood rings" dark />
  </Stage>
);

const Rig: React.FC<{t: number; night?: boolean}> = ({t, night}) => (
  <Stage bg={C.paper}>
    <DecoderRig
      x={1000}
      y={930}
      s={1.15}
      t={t}
      night={night}
      text={night ? 'Please open the window' : 'I want some water'}
      typeP={ramp(t, (night ? 60 : 50) + 2.5, (night ? 60 : 50) + 6)}
      signal={ramp(t, (night ? 60 : 50) + 1, (night ? 60 : 50) + 2)}
      badge="98%"
      badgeP={ramp(t, (night ? 60 : 50) + 6, (night ? 60 : 50) + 6.6)}
      lock={night ? ramp(t, 63, 64) : 1}
      thought={night ? ['open', 'the', 'window'] : ['I', 'want', 'water']}
      thoughtP={ramp(t, (night ? 60 : 50) + 0.5, (night ? 60 : 50) + 2)}
    />
  </Stage>
);

const Video: React.FC<{t: number}> = ({t}) => {
  if (t < 10) return <Waves1 t={t} />;
  if (t < 20) return <Waves2 t={t} />;
  if (t < 30) return <Thoughts t={t} t0={20} />;
  if (t < 40) return <Thoughts t={t} t0={30} ink />;
  if (t < 50) return <Beepers t={t} />;
  if (t < 60) return <Rig t={t} />;
  return <Rig t={t} night />;
};

export const testActive: VideoModule = {meta: {slug: 'inner-voice', title: 'shared test', duration: 70, audio: undefined}, Video};
