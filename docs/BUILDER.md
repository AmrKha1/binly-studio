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
**Small screens first (≈ ⅓ of watch time is on phones, often held upright = a picture ~6 cm wide):** the main subject
fills ≥ ~½ of the frame height and the composition uses ~70% of the width — never a frame that is mostly empty paper;
rows, lists and comparisons start CENTRED and grow outward (never reserve empty slots for items still to come); cards
hug their content; a detail that carries meaning is ≥ ~60 px — if it is smaller (a label inside a diagram, a chart inside
a book) push the camera in on it instead; faces in close shots big enough to read an expression; labels ≤ ~6 words.
Keep text clear of YouTube's player overlays: nothing important below y = 970 (progress bar, controls) or in the
top-left corner (title in fullscreen). Check every chapter with `sheet.mjs --phone` (phone-sized tiles).
Honour the brief's shot size — a CLOSE shot is truly close
(a face or an object filling the frame), not a medium shot with a small subject.
**Never:** linear easing on visible motion · everything fading in the same way · elements popping on/off without
easing · neon or glow on everything (glow = the kit's soft GLOW filters / GlowPill / Halo / Sparkles on the 1–3 things
that matter), harsh/rainbow gradients, noise/grain, glassy effects · blur except the kit's Depth (≤ ~10 shots/video) · cream/off-white or dark backgrounds unless the scene is
naturally dark (white mode) · more than one gold key accent per frame · more than 2 text elements at once (lists excepted) · the shot's key word/line under 72 px · text
the viewer must read (labels, tags, names) under 48 px · secondary text under 36 px (only image credits / source notes
may be 26 px; sizes: `TYPE` in kit/theme) · anything outside 96 px margins · an "empty stage" (one small thing on plain paper — every
shot happens in a PLACE with foreground / mid / background and light, except a deliberate void like MindSpace) · centred-everything layouts shot after shot · a frame with nothing alive for > 2 s ·
generic stock-like decoration · new colours outside `C` · `Math.random`/timers.
**Always:** `ease.out`/`outQuint` for entrances, `inOut` for camera, `outBack` only for things that land · big moves get
a tiny anticipation (wind-up) before and a small settle (follow-through) after, so motion feels alive, not mechanical ·
keep screen direction consistent (a journey, army or timeline that moves left→right keeps doing so across shots) · stagger
groups by 0.08–0.15 s · enter ~0.15 s before the spoken word · one focal point per frame · a held final state that
the next shot/chapter can transition from · semantic colours for certainty · exact numbers as spoken.

## Arabic videos (`"lang": "ar"` in video.json)
Write the scene exactly as for English (x grows to the right, anchor 'start' = left). Stage MIRRORS the frame for Arabic
and flips every text/foreignObject/photo back so it reads correctly — so: on-screen strings in Arabic; never build your
own RTL logic; anything that must keep real geometry (a map, an image with marks at image coordinates, a clock, a
logo) goes inside `<g className="k-nomirror">` (kit maps, archival shots, EvidenceShot and ticks already do). No
letter-spacing/caps/italic effects for meaning (they vanish in Arabic). Check with `sheet.mjs` like any chapter.

## Motion = pop-up and bounce, smooth (owner, 2026-10-20)
Everything that appears POPS or BOUNCES in with a spring (never a flat fade): wrap custom elements in
`<Enter kind=…>` (pop for icons/stickers, bounceDrop for objects landing, backIn* for cards/panels, jackInTheBox for
surprises, flipIn for cards/documents, zoomSpin for coins/badges, whip* for fast arrivals, stamp for verdicts), give the
key object an `<Attention>` on its word (heartBeat for emphasis, tada for a win, shake for a myth/wrong, rubberBand/jello
for fun, float for a held hero), leave with `<Exit>`. Headlines on hooks/pivots: `mode="bounce"`. Vary the presets —
never the same entrance for every element in a scene. Each preset sounds automatically.

## Places & objects: CODE FIRST (owner 2026-10-21)
Build every scene so it works without Flow: kit places (env rooms/landscapes/streets, GlowBackdrop/GlowFloor), kit objects
and icons, your own clean code-drawn objects (THE LOOK: thick outlines, clean colours, light shading, glow on the hero).
If the brief marks a Flow upgrade and the art exists in public/<slug>/, use it; if not, the code version ships.

## Generated art (backgrounds + objects) — kit/asset
Files are in public/<slug>/bg/ and public/<slug>/el/; sizes in public/<slug>/art.json ({name: {kind, file, ar}}).
`<BgPlate slug file="palace-hall.jpg" t a b push="in"|"out"|"left"|"right" />` fills the frame with a slow camera move;
put objects/host on it inside `<PlateCam t a b push>` so they move with the plate. Objects: `<ImageAsset slug name
x y w ar t enter={{kind,p}} attention={{kind,at}} />` (kit/motion presets; each sounds). Give objects that stand on a
surface a soft ellipse shadow under them; place them ON the plate's furniture (check on a still). Big and readable:
hero objects ≥ ~300 px wide. Never generate or draw text into art — labels are kit pills/text on top.

**Speed (RETENTION §12):** entrances 0.3–0.6 s, exits ≤ 0.4 s, transitions ≤ 0.5 s, never a slow fade or a crawl; a
hold only on a payoff (2–3 s, still moving). If an animation feels slow, it is.
**Alive (RETENTION §11):** something new every 2–4 s; supporting words/numbers pop up where they help (next to the
object, on the path, above the speaker via `<SayPop t x y spoken={SPOKEN} from to accent tail/>` from kit/text with
`import {SPOKEN} from '../speech'`), then leave; objects and hosts move with purpose; big numbers can use
`<Stat … sticker="#2F4C8C">` (white with a thick outline, like a sticker). Never a static frame under narration.
**Edit FX on beats (kit/editfx):** a big number/word → `PopText` (+ `Burst` for a shock/record, `SpeedLines` for
"look here"), a twist/hit → `Punch`, a data shot → `Tilt` (+ Depth on its far side), a reaction → `EmoteMark` by the
host's head. 1–3 FX moments per minute, each on its word; never stacked all the time (they lose power).
**Glow + depth on key elements:** wrap the hero object / key icon / important card in `<Lift t x y r glow>` (gold for value/wins,
lavender for mystery, green for life, red for danger) — 1–3 per scene, not everything.
**Depth (polish, sparingly):** `<Depth blur={10}>…foreground host/object…</Depth>` softens a near layer like a camera
focus; animate blur 0→10 for a rack-focus. For dialogue/reveal shots only — never text, never the whole frame.
**Size on phones:** characters big — close/medium shots most of the time (face ≈ ⅓ frame height in a close-up).

## The look (PLAYBOOK "THE LOOK") — applies to everything you draw in code too
Bright and clean: white/light-neutral grounds, crisp thick dark outlines (≥ 4 px at 1080p on objects), clean flat colours
+ light shading, one glowing hero. No yellow/brown/sepia casts, no dark murky frames (unless the story is at night), no
heavy vignettes, no neon/oversaturated colours, no thin scratchy or crude shapes. Prefer generated art (public/<slug>/bg|el)
and image hosts over the old code-drawn kit rooms/streets/people when they look dated next to them. Light pools are
neutral white by default (warm only for a real lamp/fire). References: docs/art/references/*.

## Language (never mixed)
Every on-screen string is in the video's language (video.json `lang`): English video → English only, Arabic video →
Arabic only (names in Arabic letters). Omit `who` on <ImageHost> — the host follows the language. `check.mjs` fails on
any mix; fix the text, never silence the check.

## The hosts — ODDESTORY (English) · AZTIKA (Arabic)
**Image hosts (preferred):** `<ImageHost t who="oddestory" {...imageHostShot('corner'|'big'|'full'|'peek'|'tiny', side)} poses={[[t0,'think-point'],[t1,'shocked']]}
talk={talkFrom(t, WORDS)} enter={{kind,at}} exit={{kind,at}} flip />` (kit/image-host). Pose names = file names in
src/kit/host-images.ts (`full-*` = full body, feet at y; others waist-up, keep y ≥ 1080 so the cut waist is hidden).
`flip` makes him face/point the other way (point-angry points right → flip it when he stands on the right). Pose switches
pop with a squash + soft sound; he breathes, floats, bounces slightly while talking. Choose the pose whose meaning fits
the words (shocked on a twist, laughing on a joke, idea on a solution, think-point while explaining).
Code-drawn fallback for AZTIKA until his image sheet exists:
`<Host t x y s poses={[[t0,'idle'],[t1,'pointRight'],…]} faces={[[t0,'neutral'],[t1,'surprised'],…]} talk={talkFrom(t, WORDS)} p={entrance} />`
from kit/host (`import {WORDS} from '../speech'`). (x, y) = between his feet; s 0.6–1.1 (≈ 500–880 px tall). Stand him at the
frame's side, feet near the bottom (y ≈ 1000–1040), facing the story element; poses on the words they belong to
(point at what is named, present a result, shrug at a mystery, think at a question, thumbsUp at a win, surprised at a
twist). Poses: idle pointLeft pointRight present presentRight shrug think wave thumbsUp surprised explain count handsOnHips ·
faces: neutral happy surprised thinking worried excited wink. Options (your choice, per the brief): `life` 0 still · 1 natural
(default) · 2 lively · `sfx` (a soft swish on pose changes, off by default) · `mirror` (false keeps his real orientation in
Arabic) · move him or wrap him in Enter/Attention/Exit. Moderate and meaningful: every gesture has a reason in the story.
Framing: `hostShot('full'|'half'|'close'|'peek'|'tiny', 'left'|'center'|'right')` → {x, y, s(, lean)} — spread it into <Host>;
the frame edge crops what is below (half = waist up, close = head & shoulders, peek = leans in from the edge). Moving:
animate x/y/s between framings with keys/ramp; set `walk={1}` while he walks so his legs step and he bobs.
Arrive/leave (never pop on/off): `enter={{kind, at, dur?}}` pop · slideLeft · slideRight · rise · drop · peek · walkInLeft ·
walkInRight; `exit={{kind, at}}` popOut · sink · fly · slideOutLeft · slideOutRight · walkOutLeft · walkOutRight (each
sounds automatically). Use ONLY the built-in vocabulary — no hand-drawn host animation; a new pose goes into kit/host
(max ~2–3 per video, ask the director).

## Backgrounds & big moments (white mode)
- `GlowBackdrop` = THE default background behind a hero object (light pours out from behind it: soft glow + slow rays +
  faint stars; tones gold/lavender/green/sky/warm). `GlowFloor` = the "stage" (glowing horizon + perspective grid floor)
  for things standing in a row (bars, objects, characters). Put the hero ON them; add `Halo` + `Sparkles` for gems/gold.
- `SlamTitle` = the giant one-word headline that slams toward the viewer (3–6 per video, at the big pivots only).

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
- **Readable labels**: Tags ≥ 48 px, Kickers ≥ 36 px, inside SAFE, in clear space near their subject.
- **Semantic colour** on claims: confirmed → `kind="confirmed"`, theory → `"theory"`, caution → `"caution"`.
  Oxblood (`C.oxblood`) only on the single key beat of a scene.
- **Exact numbers**: `<Stat value="0.061" unit="%" …/>` — `value` is the spoken figure exactly.
- Text sizes: headline 64–110, label 22–30, never < 22. Keep text inside x 96–1824, y 96–984.
- Layering inside a Stage: background → far → mid (subjects) → foreground → text/labels → vignette.
- Local helpers: small sub-components inside your file are fine (`const Tub = (…) => …`). Reusable
  across chapters → they belong in `../shared/` (ask the director).

## Sound effects — on EVERY movement (no music in Binly videos)
**Auto (free):** every kit animation already sounds (GlowPill/LabelPlate → popup · Tag/Kicker/RichText → tick · Headline
→ swish · Card/LowerThird/Photo/NameTag → swoosh · Medal/Icon pop/Node → pop · Stat → ticking count + ding · Sparkles →
sparkle · CheckMark → confirm · Stamp → stamp · HandNote → scribble · SlamTitle → whoosh + impact · every shot change →
whoosh). **Your custom elements must sound too:** when something you draw appears/moves on screen, call
`cueSfx(kind, key, active, x)` from kit/sfx in your component (`active` = it is visible / the move is happening; key =
stable id like `'coin-3'`; x = its centre for stereo). Pure no-op at render time.
**Story sounds** `videos/<slug>/sfx/<ID>.json` — the meaning layer, 10–30 per chapter:
`[{"t": 85.1, "kind": "cash"}, {"t": 101.7, "kind": "impact", "gain": 0.8, "pan": -0.3}]` (they win over auto cues).
Kinds: popup popdown pop blip tick click toggle swish swoosh whoosh sweep_down riser rise fall slam impact thump stamp
confirm win error powerup cash coins card ding chime glass sparkle bell bell_toll page paper shutter scribble typing
bubble drip splash heartbeat breath rumble low_drone door footsteps crowd water wind fire (`dur` for long ones).
**Sound map:** money/price/value → `cash` (coins → `coins`) · reveal/achievement → `powerup` or `win` · wrong/myth →
`error` · correct/fact → `confirm` · rising tension → `rise`/`riser` · falling/decline → `fall` · big hit → `impact` ·
card/document dealt → `card` · switch/state change → `toggle` · place ambience → `crowd`/`water`/`wind`/`fire`.
Levels are automatic; `gain` 0.4–0.8 only to soften. Don't stack two sounds within 0.1 s by hand (the scan thins bursts).

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
