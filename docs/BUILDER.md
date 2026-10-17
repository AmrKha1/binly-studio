# Builder handbook — how a Binly chapter is coded

## The contract
- **Compiled chapters (the normal case):** the director writes `videos/<slug>/shots/Cxx.json` and `tools/compile-shots.mjs`
  generates `Cxx.tsx` (never edit it). You build only the custom shots in `Cxx.custom.tsx`: one export per shot id,
  `export const S4: React.FC<{t: number}>` returning a full `<Stage>`, valid for the shot's time range (from the JSON;
  the shot ends where the next one starts). Replace each `PLACEHOLDER (custom shot…)` stub. If a template shot needs a
  change, edit its props in the JSON and re-run `node tools/compile-shots.mjs Cxx` (you may do that).
- **Hand-written chapters (no shots JSON):** the rules below apply to the whole chapter file.
- File: `src/videos/<slug>/chapters/<ID>.tsx`, exporting `export const <ID>: React.FC<{t: number}>`.
- `t` = **absolute video time in seconds** (not chapter-relative). Your chapter is shown from its `start`
  until the next chapter's start (plus transition overlap): keep it valid slightly before `start` (≈0.6 s)
  and after `end` (≈0.6 s) — hold the last state; ramps clamp automatically.
- Pure function of `t`: no `useCurrentFrame`, `Math.random`, `Date`, state, effects, timers (lint fails).
  Randomness → `rand(seed)`, `noise1(x, seed)` from kit/anim.
- Return a full frame: `<Stage bg={...}>…svg…</Stage>`, or `<Shots t={t} shots=[…]/>` when the chapter has
  several shots (each shot renders its own `<Stage>`).
- Imports: `../../../kit/<module>` (kit) and `../shared/<file>` (this video's shared assets).
- **The brief is the spec.** Meet each shot's DONE WHEN. If something is truly unclear or impossible (missing image,
  kit piece doesn't exist), choose the simplest strong option that serves the shot's purpose, keep going, and list it
  in your report under "Decided myself:" so the director can check it — never stop to ask, never silently skip.

## Timing
Put every cue at the top, from `node tools/cue.mjs`, with the spoken words as comments:
```tsx
const T = {
  open: 84.2,     // chapter start
  bath: 85.06,    // "A medieval bathhouse"
  square: 88.9,   // "public square that happened to have water"
  food: 93.4,     // "There was food, drink, and conversation"
  paris: 101.7,   // "In Paris, there were enough public baths"
  end: 112.6,
};
```
Animate ON the word: start a reveal ~0.1–0.25 s before the stressed word lands so it reads as synchronous.
Progress values: `ramp(t, a, b, ease.x)`, `keys(t, [[t0,v0],[t1,v1]])`, `win(t, a, b)` (fade in/out window),
`stagger(t, start, i, gap, dur)`. Camera: `camAt(t, [[time, cx, cy, zoom], …])` → `<Cam cam={…}>` or
`<World cam={cam} layers=[{depth, el}]/>` for parallax. Holds: `breathe(cam, t)`.

## Bans and defaults (decide nothing twice)
**Mobile first (most viewers watch on a phone):** the main subject fills ≥ ~⅓ of the frame height; faces in close shots
are big enough to read an expression; labels ≤ ~6 words. Honour the brief's shot size — a CLOSE shot is truly close
(a face or an object filling the frame), not a medium shot with a small subject.
**Never:** linear easing on visible motion · everything fading in the same way · elements popping on/off without
easing · gradients, glow blur, noise/grain, glassy effects · drop shadows except the kit's flat offset shadows ·
more than one oxblood accent per frame · more than 2 text elements at once (lists excepted) · text under 22 px or outside
96 px margins · an "empty stage" (one small thing on plain paper — every
shot happens in a PLACE with foreground / mid / background and light, except a deliberate void like MindSpace) · centred-everything layouts shot after shot · a frame with nothing alive for > 2 s ·
generic stock-like decoration · new colours outside `C` · `Math.random`/timers.
**Always:** `ease.out`/`outQuint` for entrances, `inOut` for camera, `outBack` only for things that land · big moves get
a tiny anticipation (wind-up) before and a small settle (follow-through) after, so motion feels alive, not mechanical ·
keep screen direction consistent (a journey, army or timeline that moves left→right keeps doing so across shots) · stagger
groups by 0.08–0.15 s · enter ~0.15 s before the spoken word · one focal point per frame · a held final state that
the next shot/chapter can transition from · semantic colours for certainty · exact numbers as spoken.

## Patterns
- **Templates first for standard beats** (docs/KIT.md → templates): stats, quotes, evidence images, claims, comparisons, lists, timelines, maps, person intros, processes, questions — then spend your effort on the custom shots.
- **Every beat is a visible change on its cue word** (the shot's `beats` in the JSON / the ACTION in the brief): a new element,
  a camera move or a cut — never a sentence spoken over an unchanged frame; show the mechanism moving, not a label.
  A small tag alone is too weak for a new idea (sync-check flags it); one strong element or a camera move is enough.
- **Show, don't tell:** text may SUPPORT a scene (a small label, a name tag, a key number), never REPLACE it — a card of
  words as the main visual only where the brief explicitly asks for one. On-screen words: few and short (a label names a
  thing, the picture explains it), readable in under 2 s, never the sentence the narrator is saying. A label sits right
  NEXT TO the thing it names (on the glowing brain area, not in a legend or a corner box) — the eye never has to jump.
- **Follow the brief's shot list** (S1, S2, …): implement each shot as a named sub-component or a camera stop, with a comment `// S3 · 101.70 · "In Paris…"` so fixes like "C04 S3" are easy to find.
- **One world, moving camera** beats a sequence of slides: lay out the chapter's ideas in one large SVG
  world (e.g. 4000×1080) and move the camera from idea to idea with eased pans/zooms.
- **Shots** when the place really changes: `<Shots t={t} shots={[{start: T.open, render: (t) => <A t={t}/>},
  {start: T.paris, in: {kind: 'iris', x: 1300, y: 420}, render: (t) => <B t={t}/>}]}/>` (kinds: fade, dip,
  ink, iris, irisOut, push, paper, zoom, wipe, cut).
- **Build-ups**: elements arrive on their cue with `p` props (`<Tag p={ramp(t, T.x - 0.1, T.x + 0.5)}/>`),
  and leave with motivation (camera moves away, a wipe, fade with `win`).
- **Alive holds**: something always subtly moves (camera breathe, particles, blinking/breathing people,
  flame flicker, steam) — never a dead frame > 2 s.
- **Depth order with objects**: a figure is either IN an object (bather in a tub: head + shoulders only above the rim)
  or fully in front of / behind it — never drawn behind an object's front while its legs show below it.
- **Readable labels**: Tags ≥ 34 px, Kickers ≥ 30 px, inside SAFE, in clear space near their subject.
- **Semantic colour** on claims: confirmed → `kind="confirmed"`, theory → `"theory"`, caution → `"caution"`.
  Oxblood (`C.oxblood`) only on the single key beat of a scene.
- **Exact numbers**: `<Stat value="0.061" unit="%" …/>` — `value` is the spoken figure exactly.
- Text sizes: headline 64–110, label 22–30, never < 22. Keep text inside x 96–1824, y 96–984.
- Layering inside a Stage: background → far → mid (subjects) → foreground → text/labels → vignette.
- Local helpers: small sub-components inside your file are fine (`const Tub = (…) => …`). Reusable
  across chapters → they belong in `../shared/` (ask the director).

## SFX file `videos/<slug>/sfx/<ID>.json`
`[{"t": 85.1, "kind": "whoosh"}, {"t": 101.7, "kind": "stamp", "gain": 0.8, "pan": -0.3}]` — 3–8 per chapter,
only on meaningful visible events. Kinds: stamp whoosh swoosh swish sweep_down pop tick click thump impact
rumble low_drone shutter paper page chime ding bell bell_toll riser clack scribble typing bubble sparkle
heartbeat breath drip splash wind fire crowd door glass footsteps water coins (`dur` for scribble/typing/wind/fire/crowd/
water/footsteps). Real recordings (library/sfx: crowd, water, bell_toll, page, door, coins, footsteps) replace the
code-made versions automatically.
**Levels are automatic** (each sound levelled, ducked under the voice, felt not noticed) — never raise `gain` above 1;
use 0.4–0.8 only to make a sound softer.
**Sound map — pick from this, don't deliberate:** label/tag/text appears → `tick` (bigger element → `pop`) · card/panel/
image slides in → `swoosh` · fast camera move/push → `whoosh` · ink/iris/wipe transition → `swish` · zoom-through/big
scene change → `sweep_down` · photo appears → `shutter` · document/paper → `paper` · page/book → `page` · map pin/point
lands → `click` · number lands → `clack` · red-pen strike or handwriting → `scribble` (dur = drawing time) · verdict/key
fact lands → `thump` · big reveal → `riser` (ends on the reveal) + `impact` · idea/discovery → `chime` or `sparkle` ·
tension/danger → `low_drone` or `heartbeat` · money/trade → `coins` · someone walks/arrives → `footsteps` · bell/church/
hour → `bell_toll` · place ambience → `crowd`/`water`/`wind`/`fire` (short `dur`, at scene start).
One sound per visible event, never stacked; leave the narrator's key sentence clean; ≤ 8 per chapter.

## Real examples
`src/videos/test-dinos/chapters/C01.tsx` (one continuous camera world) and `C02.tsx` (several shots with transitions) — built by builders from the briefs in `videos/test-dinos/briefs/`. Skim one if you want to see a complete chapter.

## Worked example (pattern reference, not a template to copy literally)
```tsx
import React from 'react';
import {Stage, World, breathe} from '../../../kit/stage';
import {C} from '../../../kit/theme';
import {camAt, ease, ramp, win} from '../../../kit/anim';
import {Headline, Kicker, Tag, Stat} from '../../../kit/text';
import {Person} from '../../../kit/people';
import {Steam, LightShaft} from '../../../kit/fx';
import {Shots} from '../../../kit/shots';
import {FlowChain} from '../../../kit/diagrams';

const T = {open: 84.2, bath: 85.06, square: 88.9, food: 93.4, humors: 104.1, four: 106.3, end: 112.6};

// Shot A — the bathhouse as a social space: one wide world, camera drifts right as the list grows
const Bathhouse: React.FC<{t: number}> = ({t}) => {
  const cam = breathe(camAt(t, [[T.open, 760, 540, 1.25], [T.square, 960, 540, 1.0], [T.food + 4, 1180, 520, 1.12]]), t);
  return (
    <Stage bg={C.paperShade}>
      <World cam={cam} layers={[
        {depth: 0.4, el: <rect x={-400} y={0} width={2800} height={620} fill={C.stone} />},
        {depth: 1, el: (
          <g>
            <LightShaft x1={300} x2={420} y={0} dx={160} len={760} />
            <Person x={620} y={900} t={t} outfit="tunic" pose="present" talk={win(t, T.food, T.food + 1.6) * Math.abs(Math.sin(t * 9))} seed={1} />
            <Person x={980} y={900} t={t} outfit="dress" hair="bun" facing={-1} expression="smile" seed={2} />
            <Steam t={t} x={800} y={760} w={420} />
          </g>
        )},
      ]} />
      <Kicker x={960} y={150} text="Paris · 1300s" p={ramp(t, T.bath, T.bath + 0.8)} />
      <Headline x={960} y={230} text="A public square with water in it" p={ramp(t, T.square - 0.2, T.square + 0.9)} mode="words" accent={{water: C.oxblood}} />
    </Stage>
  );
};

// Shot B — the idea: four humors as a balance (diagram on ink panel)
const Humors: React.FC<{t: number}> = ({t}) => (
  <Stage bg={C.ink}>
    <Kicker x={960} y={260} text="Medieval medicine" color={C.paperShade} p={ramp(t, T.humors, T.humors + 0.6)} />
    <FlowChain x={960} y={540} items={['Blood', 'Phlegm', 'Yellow bile', 'Black bile']} p={ramp(t, T.four, T.four + 2.4)} />
    <Tag x={960} y={760} anchor="center" text="A theory — not germs" kind="theory" p={ramp(t, T.four + 2.6, T.four + 3.4)} />
  </Stage>
);

export const C02: React.FC<{t: number}> = ({t}) => (
  <Shots t={t} shots={[
    {start: T.open, render: (t) => <Bathhouse t={t} />},
    {start: T.humors, in: {kind: 'ink', x: 960, y: 540}, render: (t) => <Humors t={t} />},
  ]} />
);
```
