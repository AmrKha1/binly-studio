# kit/night — the AZTIKA look (Arabic channel)

Owner 2026-11-08: Arabic videos copy the model video's style as it is (references/universe-claude, exact specs in its
STYLE-BIBLE.md). This module is that look. Gallery: `night` (copy test of the 0:26.2 frame), `night2` (year badge).
`node tools/still.mjs --comp Gallery --props '{"page":"night","lang":"ar"}' --at 2`

**Screen coordinates:** put night scenes inside `<NightScreen>` (first child of `<Stage>`): nothing is mirrored, so you
place things exactly where the reference does — headline top-right, object centre, AZTIKA = the illustrated image poses (kit/image-host, public/_hosts/aztika), full body, toward the middle and big
(owner 2026-11-08: x≈480, feet 1068, h≈340 → ~650 px tall — closer to the viewer than the reference host), gold rim (HostGlow).

```tsx
<Stage bg="#0F062B">
  <NightScreen>
    <NightSky t={t} id="a" />                       {/* indigo-violet space, twinkling stars + sparkles; horizonY=836 */}
    <GridFloor id="a" t={t} />                       {/* glowing purple horizon + perspective grid (slowly scrolling) */}
    <Podium x={870} base={836} w={250} h={216} id="p" grow={(t - 0.2) / 0.5} color="green" />  {/* green|gold|red */}
    <RevealRing t={t} at={0.35} x={870} y={470} />   {/* gold ring + sparkle burst when an object appears */}
    <NPill text="45 مليون $" x={868} y={266} size={60} kind="gold" id="q" p={(t - 0.6) / 0.3} />   {/* p over 0.3 s = the reference pop */}
    <WordPop t={t} id="h" y={318} size={150} right={1650}
      words={[{w: 'أنت', at: 0.9}, {w: 'غالي!', at: 1.2, tone: 'gold'}]} />   {/* each word pops on its spoken time */}
    <HostGlow id="host"><ImageHost t={t} x={480} y={1068} h={340} poses={[[0, 'full-thumbsup-wink']]} shadow={false} /></HostGlow>
  </NightScreen>
</Stage>
```

## MOTION = the reference, measured frame by frame (references/universe-claude/MOTION.md, 2026-11-11)
**SMOOTH, NEVER HARSH (owner 2026-11-11):** fast is fine, harsh is not — every move eases in AND out, and scenes FLOW
into each other. The reference cuts only 1–3.5×/min; our first reel cut 7×/min and flashed a full-frame wipe at every
section — that was the harsh part.
- **Join scenes with `NightShots` (kit/night-scenes)** — `<NightShots t={t} shots={[{start, render, in?, drift?, carry?}]}
  hud={(t) => <HostTrack…/>}/>`. Default join `match`: the old scene drifts forward and fades while the new one dissolves
  in and SETTLES (settleT) + a soft whoosh. Other joins: `dissolve` (softer) · `wipe` (StripeWipe — once per CHAPTER, a
  time jump) · `flash` (a cut under the white flash — a slam/reveal) · `cut` (a punchline only). `carry` flies a hero
  object from the old scene into its place in the new one (the reference's match-move). `settle`: how strongly the new scene zooms in (default 0.53 = the reference) — use ≈ 0.08 when the shot's main piece makes its OWN entrance at the start (a screen, a panel): two entrances at once read as a punch. Every shot DRIFTS by itself
  (pushT) — `drift: false` only for scenes with their own camera (boards, stairs). `hud` = pinned to the screen (the
  host): it never zooms with a scene; the host leaves with `exit: {kind: 'fadeOut'}`, returns with `riseSoft`.
- **Move things with `move(t, at, from, to)` / `moveTo(…)`** (kit/night-scenes): eased in and out, and never faster than
  0.2 s + distance/2000 px (a 400 px hop ≥ 0.4 s, across the frame ≥ 0.75 s) however short you ask. `node tools/check.mjs`
  FAILS a position driven by a raw straight-line time ramp.
- **After a render:** the QA report's "Motion vs the reference" section (`node tools/motion-check.mjs <video>`) must be
  inside the reference's range — cuts, full-frame sweeps, stillness, sudden starts.
- **NIGHT SHOT TEMPLATES (kit/night-templates, 2026-11-11)** — the reference's repeating moments as one-line shots, so an
  Arabic chapter is mostly DATA: `videos/<slug>/shots/Cxx.json` → `node tools/compile-shots.mjs` (Arabic videos compile to
  night templates joined with NightShots; builders hand-build only the special moments). Every prop is plain JSON; art =
  `"src": "<slug>/el/x.png", "ar": 0.8` or code-drawn `"art": "coin:₿" | "document" | "drive"`.
  · **BoardShot** `{game: podium|stairs, entries: "@board" (= videos/<slug>/board.json — ONE board for the whole video),
    recapAt?, summitAt?, topLabel?, words?}` — its own camera (no drift) · **MysteryShot** `{at, kind: pillar|box, words?}`
  · **HeroShot** `{at, src|art, value?, countAt?, spoken?: words, label?: {text, at}}` — reveal + S-curve count + the
    spoken words · **HeadlineShot** `{words, y?, size?, pill?: {text, at}}` · **StoryShot** `{world: room|sunset|city|village|
    day|lab|mine|plate, plate?, people?: [{role, x, pose?, poses?: [[t, pose]], walk?: {at, to}, name?: {text, at}, flip?, rim?,
    prop?, hat?, outfit?}], bubble?, stamp?, pills?, marks?, year?, words?}` (walks use move()) · **TwistShot** `{at, words,
    mark?, rays?}` (a slam under the flash).
  · words = `[{"w": "الأغلى", "at": 12.4, "tone": "gold"}]` (centred automatically). A shot's `"in"`: match (default) ·
    dissolve · wipe · flash · cut; `"drift": false` for a shot with its own camera. AZTIKA = the shots' `"host"` beats
    (`[{"at", "spot", "pose", "why"}, {"at", "off": true}]`) → the compiler pins him in the hud: rises in, moves on his
    beats, fades out on "off", may return.
  · **Custom shots** (Cxx.custom.tsx) return the shot's WORLD (SVG — no <Stage>/<NightScreen>; the chapter provides them).
  · Chapters join the same way (kit/video `Chapters` → night joins for Arabic: `"in"` in chapters.json, match by default,
    `wipe` for a real chapter turn); new chapters start as NIGHT placeholders (scaffold).
Every night piece already moves like the reference — keep it that way in custom pieces:
- **Pop-in** = `popRef(p)` (p over 0.3 s): ONE smooth swell 0.46 → 1.16 at 125 ms → 1.00 at 295 ms; no wobble, no
  squash/stretch (the old `popIn` jelly is for the English channel only). Its sound peaks on the swell (`hit: 0.125`).
- **Camera never still:** wrap every held shot's WORLD in `pushT(t, shotStart, cx, cy)` (≈ 0.35 %/s push-in, around
  the focus); hosts stay outside (pinned to the screen). Big moves: `camAt` keyframes with `ease.inOut`.
- **Board camera:** `<g transform={boardCamT(t, {entries, …})}><GridFloor/><PodiumGame/></g>` — travels to each newcomer.
- **Exits:** at a scene end, punchT on the key line + the other pieces FLY OUT with `flyOut(t, out, dirX, dirY)` (≈ 0.2 s,
  accelerating) — not a fade. **Flash** on the biggest slam/reveal. **StripeWipe** for chapter-level cuts.
- **Count-up** = CountNumber (late S-curve 1.64 s, white → gold on the final value). **Stamp** = a clean press, no shake.
- Life in held shots = rotating rays, twinkling sparkles, the slow push — not pulsing glows.
- **Growth** (podium, bars, pillars) = `ease.out` over 0.5 s, no bounce. **Callout** = line 0.12 s → label at once → tag later.
- **Scene change** = a short dissolve while the hero object flies to its place in the next scene + `settleT(t, start)` on the
  new world (zooms in 1.53× → settles) + the host `riseSoft`/`fade` in. **Road map** (JourneyPath) runs RIGHT → LEFT.
- **Host:** AZTIKA swaps poses instantly (HostTrack does it); enter with `{kind: 'fade'}` or `'riseSoft'`, leave `'fadeOut'`.
  **Bubbles** shrink back into the speaker when they leave (`out`).
- **WordPop:** gold/colour KEY words pop (the swell), WHITE supporting words fade in with a slight grow (override per word
  with `enter: 'pop'|'fade'`); the glow is steady (the reference never pulses text). **YearBadge:** a few years back
  tick one per 0.1 s; time passing (forward, or > 8 years) ACCELERATES like 1:07 (1704 → 1705 → 1707 → 1711 → 1718 → 1730).
- Plan fields (plan-check SCENE/NUMBER): each chapter's first shot `"in"` (match · dissolve · wipe · flash · whoosh), last
  shot `"out"` (fly · wipe · whoosh), big counted numbers `"spoken"` (the words under the number).
- `node tools/sync-check.mjs` flags FROZEN pictures (< 1 % change in 1.35 s — the reference never goes below 0.36 %).

## The CTA — like + subscribe (owner pick 2026-11-11: C + D) — kit/night-cta
- **CtaShot** (template) / **CtaBoard** `{t, at, like, sub, bell?}`: like (230 px) + «اشترك» (76 px) on golden podiums over
  gold rays, each PRESSED on its spoken word (a finger taps, a ripple, a smooth sink — never a snap), the like fills gold
  with sparkles, «اشترك» → «مشترك ✓», the bell rings (ding), then gold arrows point DOWN to the real buttons (phones).
  Sounds: pop · click · sparkle · ding · thump (podiums) · whoosh (arrows). Host: higher → lower → viewer.
- **EndScreenShot** / **EndScreen** `{t, at}`: the last ≈ 10 s (video.json `"endScreen": 10`, the video runs past the
  voice; the audio is padded with silence): a calm night frame + a red circle and a framed box exactly where YouTube's
  subscribe element and video element go (END_SCREEN coordinates). SILENT, like the reference after its sign-off.
- Also in the kit (samples, gallery night21/22): CtaPress (A, AZTIKA presses big buttons) · CtaPhone (B, a phone with
  the like/subscribe row, the camera pushes in while a finger taps) — not the standard, kept for a video that wants them.

## AZTIKA reacts (owner 2026-11-08)
He is never a statue: he changes pose on the beats to interact with the SCENE (points at / presents the object that
appears, reacts to a number) and with the VIEWER (wink, thumbs-up, pointing at them on «أنت»). Directions (screen):
`full-point-right` and `full-present` aim at screen RIGHT (toward the centre stage when he stands left); `full-point-both`
aims LEFT. Viewer poses: `full-thumbsup-wink`, `full-welcome`, `full-point-both-smile`. Reactions: `full-surprised`,
`full-scared`, `full-jump-joy`, `full-thinking`, `full-shrug`, `full-skeptical`, `full-sad`, `full-angry`. Each switch
gets a soft pop (built into ImageHost). Gallery `night` 0–2 s shows a 4-beat example.

## AZTIKA alive — HostTrack (owner 2026-11-08: moves with the story, smooth, never too much)
```tsx
<HostTrack t={t} id="h" enter={{kind: 'pop', at: 0}}
  spots={[{at: 0, spot: 'sideLeft'}, {at: 1.5, spot: 'closeRight'}, {at: 3.6, spot: 'sideRight', move: 'glide', dur: 0.8},
          {at: 5.0, spot: 'peekLeft', dur: 0.7}]}
  poses={[[0, 'present'], [1.5, 'viewer'], [3.6, 'point'], [5.0, 'think']]} />
```
- **SPOTS** (pick by intent): sideLeft/sideRight (presenter beside the action) · closeLeft/closeRight (big, near the
  camera, talking to the viewer) · peekLeft/peekRight (rises from the bottom: an aside, a thought) · smallLeft/smallRight
  (little in a corner while the scene is the star). Override with x/y/h when a scene needs it.
- **Moves:** hop (default, springy arc) · glide (smooth slide) · walk (steps); `dur` default 0.55 s. He faces the centre
  automatically (flipped right of centre). Enter/exit with ImageHost moves (pop, rise, drop, peek, slide…).
- **New poses (P3, 2026-11-10):** awe (back view, looking up — the ending) · higher (points up) · lower (points down) ·
  list (counts on fingers) · sure (arms crossed) · wow (hands on cheeks) · rest (sits — on a podium edge: x/y so his seat
  is the podium top) · you (grins, points). All 46 AZTIKA images pass the art check (--char); `sad` was
  redrawn (its old cut-out had lost the face). New waist-up: thinking (hand on chin), proud (hands on hips), whisper.
- **Reasons → poses (BEAT_POSE):** present · point · react · viewer · welcome · think · room · joy · shrug · doubt ·
  scared (or any image pose name).
- **Rules:** a story reason for every move · moves ≥ 6 s apart · pose every ~3–6 s (≥ 1.5 s apart) · never frozen > 8 s ·
  never over the key object/text · off-screen during mini-stories. Shot lists carry `"host": [...]`; plan-check checks it.
Gallery `night3` = demo (stills 0.8, 1.72, 2.8, 4.0, 4.6, 6.0).

## Pieces
- **GlowText** `{text, x, y, size, tone: white|gold|grey|cyan, id, glow?, outline?, anchor?}` — the reference text recipe:
  soft colour glow → thick dark outline (also inside holes) → gradient fill (white fades to light grey; gold #FCC018).
  x,y = centre. Sizes: hero 150–180, headline 120–150, secondary 100–130.
- **WordPop** `{t, words: [{w, at, tone?}], y, size, right (Arabic) | left (English), id, gap?, out?}` — headline built
  word by word on the spoken words; pop 0.3 → overshoot → 1 in ~0.2 s; glow breathes while it holds; `out` = fade time.
  Rule: white words + ONE gold key word.
- **NPill** `{text, x, y, size=44, kind: gold|white|grey|cyan, id, p}` — capsule label with glow. gold = current/hero
  value, white = previous, grey = small/old, cyan = topic on science scenes. `p` 0→1 = pop-in progress.
- **Podium** `{x, base, w, h, id, grow, color}` — glowing 3D block (light left facet, dark right side, bright top).
  `grow` 0→1 rises with a spring. The leaderboard = several podiums whose heights compare values.
- **RevealRing** `{t, at, x, y, r?, color?, boom?, tail?}` — expanding gold ring + sparkles (0.7 s) when a new object appears (+ boom). `tail` = the long deep reveal tail: ONLY for the video's 2–4 biggest reveals (the hook's answer, the twist, the champion), like the reference.
- **YearBadge** `{t, at, year, from?, x, y, label?, place?, id, size=120}` — black tile, gold border, glowing gold digits;
  `from` makes it count year by year (0.1 s per step: «1506 → 1503» = going back in time); label pill on top (سنة),
  place pill below.
- **HostGlow** `{id, rim=4, glow=1, color}` — wrap the host (or any hero character) for the gold rim line + soft glow.
- **Sparkle** `{x, y, r, o, color}` — 4-point star. **N** = the measured palette. **textWidth(text, size)** = exact width.

## Set 2 — kit/night-fx (import from '../../../kit/night-fx')
Gallery `night4` runs them in order (stills 1.5, 3.6, 5.9, 7.95, 8.08, 8.48, 9.8).
- **Rays** `{t, id, x?, y?, tone: gold|dark|cyan|violet, n?, spin?}` — slowly rotating sunburst + vignette. gold = the
  "you!" hero moment (0:16.4), dark = the sign-off (14:44), cyan = science/body, violet = space. + **Bokeh** `{t, n?, color?, seed?}`.
- **CountNumber** `{t, at, value, x, y, size=170, tone, id, dur=1.64, from=0.03}` — exact spoken value counting up like the
  reference (2:00.4): a late S-curve (slow start = suspense), WHITE while counting, turns `tone` (gold) on the final value.
- **Stamp** `{t, at, text, x, y, size=110, rot=-8, color}` — red ink stamp PRESSES in: 1.64× → 1.00 decelerating in 0.165 s
  while fading in, then rock still (3:18, measured frame by frame).
- **NightPortrait** `{t, at, photo, x, y, h, ar=0.8, name?, shape: frame|oval, id, out?}` — the ONLY way a real photo
  appears in an Arabic video: a real face that truly matters (free-licence Wikimedia via tools/photo.mjs), framed like the
  reference's Mona Lisa — glowing gold frame, night grade, light sweep, reference pop, name pill. Everything else illustrated.
- **Flash** `{t, at, strength=0.5, color}` — the reference's flash on a big slam/reveal (0:15.6): instant ≈ 50 % white,
  exponential fade (gone by ≈ 0.4 s). On the slam's frame, on top.
- **Bubble** `{t, at, lines, x, y, tx, ty, size=64, mark?: check|cross, icon?, out?}` — speech bubble that grows out of
  the speaker's mouth (tail tip tx,ty), thick outline, optional ✔/✖ badge or icon (0:45). **Mark** = the ✔/✖ badge alone.
- **punchT(t, end, cx, cy, dur=0.35, amount=0.35)** — transform for the end-of-scene punch-in on the key line, then
  **WhooshOut** `{t, at, dur=0.18}` — streaks across an empty sky between scenes (0:27.4–27.8).
- **StripeWipe** `{t, at, dur=0.47}` — gold/orange diagonal stripes: cover in 0.17 s, HOLD 0.1 s, clear in 0.2 s; cut at
  at+dur/2 (inside the hold) (0:08.85).
- **NeonSign** `{t, at, x, y, text? | d?, size=220, color, id}` — gold neon tube that flickers on, then hums (sign-off).
  Ending recipe: Rays dark + Bokeh + NeonSign «ازتيكا» + WordPop gold «في أمان الله» + AZTIKA thumbs-up/wink.

## Set 3 — story worlds: kit/night-worlds (import from '../../../kit/night-worlds')
Gallery `night5` (stills 1.6 sunset · 3.6 map · 5.6 science · 7.6 night city · 9.6 room). Pick the world by the story:
- **SunsetWorld** `{t, id, skyline: town|city|pyramids|desert, sunX?, sunY?}` — time jumps, history, "back in year X"
  (orange sky, big soft rays from a low sun, drifting clouds, two plum skyline layers). Pair with YearBadge.
- **PaperMap** `{t, id}` + **MapShape** `{d, fill, dashed?, p?}` (chunky regions, thick outline; dashed white = moving
  border) + **Flag** `{x, y, colors, horizontal?, t, at}` (rises on its pole, waves) + **PriceTag** `{text, x, y, color?, p}`
  + **Route** `{d, p, id}` (dotted red path drawn on). Geography, deals, borders, journeys.
- **ScienceWorld** `{t, id}` + **HoloRing** `{x, y, rx?, t}` — body/science/tech subjects (dark teal, square grid, cyan
  bokeh, glowing platform under the object). Pair with NPill kind cyan + CountNumber white.
- **NightCity** `{t, id, base?}` — money, cities, real estate (3 layers of buildings, warm windows that blink, outlined
  front towers).
- **RoomWorld** `{t, id, winX?, winY?}` — mini-stories indoors (warm wall, plank floor, sunset window + light shaft, dust).
- **StoryPerson** — THE CAST (owner 2026-11-11: "the faceless characters like the reference, the normal types for every
  future video"). Faceless dark round head with a coloured RIM (gold by default; `rim="#7FD8FF"` = the other side of a
  story — the reference's Napoleon gold vs the American buyers cyan), round hands in the rim colour, white shoes, one
  highlight stripe, breathing. AZTIKA is the ONLY character with a face (the host, kit/image-host — his 46 cut-out poses).
  - **role** (one word = the whole look; explicit props win): king queen prince sultan sheikh arabMan arabWoman pharaoh knight
    soldier officer general police pirate explorer sailor pilot astronaut doctor nurse scientist engineer programmer hacker
    worker farmer miner chef businessman banker lawyer judge politician journalist teacher student painter musician athlete
    oldMan child man woman (table: `STORY_ROLES`).
  - **hat**: none beret top helmet bicorne crown turban cap feather (headband + one feather) warbonnet tarboush ghutra hijab
    hood officer hardhat judge nemes knight army tricorn safari sailor aviator space nurse chef straw grad headband fedora.
  - **outfit**: plain suit shirt hoodie thobe bisht labcoat uniform dress overalls robe pharaoh armor vest sailor spacesuit
    scrubs chef gown sport doctor (+ `tieColor`, `medals`).
  - **prop** (in hand): laptop phone harddrive pizza document pen briefcase coin gavel scroll money sign sword wrench pickaxe
    pitchfork pan book microphone brush guitar ball map clipboard flask cane (`StoryPropIcon` draws one alone).
  - **pose**: idle point hold up talk shock think cheer walk (walk = a stride cycle from t).
  - extras: `glasses` · `hair` short|long|bun|bald + `hairColor` · `beard` (a colour) · `flip`.
  Gallery `night15` (1.5 headwear · 4.5 outfits · 7.5 props · 10.5 poses · 13.5 a deal scene · 16.5/19.5/22.5 the roster).
  - **NEW CHARACTERS ARE WELCOME (owner 2026-11-11)** — the roster above is a starting set, NOT a limit. When a story
    needs a type that is missing (a Viking, a monk, a firefighter, a Bedouin, a 1920s flapper, a samurai, a specific
    historical uniform…), CREATE it: first combine existing role/hat/outfit/prop/hair/beard; if a piece is still missing,
    draw the new hat / outfit / prop / pose (same drawing language: thick dark outline, flat fills + one highlight stripe,
    coloured rim, glow) — the director adds it straight to StoryPerson in `src/kit/night-worlds.tsx` + a role in
    `STORY_ROLES`; a chapter builder (who never edits the kit) draws it in `src/videos/<slug>/shared/` as a wrapper around
    StoryPerson and reports it, and the director promotes it into the kit after the video so every future video reuses it. Always faceless (dark round head + rim, ONE identifying detail); never a real face (real
    faces only in NightPortrait); never a second recurring character (AZTIKA stays the only face). Check the new type
    on a still beside 2–3 existing roles (gallery `night15`) so it matches the set, then list it here and in docs/ASSETS.md.
  **MoneyBag** prop.
Hero objects (diamond, palace, painting…) come from generated art (tools/art.mjs, ART-STYLE) placed on these worlds.

## Hero objects — HeroObject (kit/night-fx) + generated art (docs/ART-STYLE.md "NIGHT LOOK")
The glowing centrepiece of a shot, like the reference's crown / diamonds / money pile / capsule. Art: plan the objects in
videos/<slug>/art/plan.json as 6-item sheets → `node tools/art.mjs prompts <slug>` (Arabic videos get the NIGHT blocks
automatically: polished game-icon style, thick outline, white background, no painted glow) → generate in Flow (Nano Banana,
free) → `node tools/art.mjs ingest <slug>` (cut-out + library, tagged "night"; `art.mjs find night` lists them).
```tsx
<RevealRing t={t} at={0.2} x={760} y={540} r={300} />
<HeroObject t={t} at={0.15} src={`${slug}/el/royal-crown.png`} ar={1.07} x={760} y={560} h={480} glow="#FFC928" enter="rise" id="crown" />
```
- `{t, at, src, x, y, h, ar, glow, enter: pop|rise|drop|zoom, float=true, shine=true, sparkles=5, id, out?}` — soft glow in
  its own colour (gold money/crowns · cyan science/diamonds · violet energy/mystery · green land/nature), slow float, a light
  band sweeping across it every ~3.5 s, twinkling sparkles. 35–55 % of the frame height; one hero per shot. Silent —
  RevealRing gives the soft sparkle sound. Gallery `night6`.

### Starter hero library (P3, 2026-11-10) — `node tools/art.mjs find night` · `art.mjs use <slug> <names>`
36 checked night-style objects in library/art/el (Nano Banana Pro, 0 credits, all passed the ART CHECK):
wealth money-pile · gold-bars · giant-diamond · royal-crown · gold-trophy · vault-door · golden-hourglass ·
space space-station · astronaut · planet-earth · antimatter-capsule · rocket · gold-asteroid ·
places land-tile · parking-tile · highway-tile · skyscraper · royal-palace · small-house ·
history egypt-pyramids · mosque · medieval-castle · greek-temple · camel ·
war/history battle-tank · warship · fighter-plane · factory · oil-barrel · ancient-scroll · sword-shield · old-book.
Use them with HeroObject (glow in the object's colour) — gallery `night14` shows them in place. The code-drawn space pieces
(Earth, ISS…) stay for scenes that need motion (spinning Earth, orbits); the art is for hero moments.

## The podium game — PodiumGame (kit/night-game) — the spine of ranking videos
"What is the most expensive / biggest / oldest / fastest …?" → one leaderboard that grows through the whole video and
returns as the recap (reference 1:34 → 14:03). Give the data; the game does the layout and all the motion.
```tsx
const E: Contender[] = [
  {id: 'body', value: 45e6, label: '45 مليون $', at: 22.7, src: `${slug}/el/human-body.png`, ar: 0.6},
  {id: 'mona', value: 1e9, label: '1 مليار $', at: 94.4, mystery: 93.1, src: `${slug}/el/mona-lisa.png`, ar: 0.8},
  {id: 'diamond', value: 2e9, label: '2 مليار $', at: 151, mystery: 149.5, src: …, times: '×2', timesAt: 160.5},
];
<NightSky …/><GridFloor …/>
<PodiumGame t={t} id="game" entries={E} recapAt={843} />        {/* inside <NightScreen>; AZTIKA at sideLeft */}
```
- value = for the height only (same unit for all); label = exactly what is SAID. Heights ∝ value^0.35 (measured), so a
  45 M body still shows next to billions; a giant newcomer shrinks the others.
- Champion = tallest, stands next to AZTIKA (x0 ≈ 760); the rest step right, shrink, and slide out after maxVisible (5).
  Pills: gold champion · white runners-up · grey tiny. color: green (default) · red (war, losses) · gold (the final winner).
- mystery: the old champion steps aside (0.55 s), THEN the black silhouette pops into the empty spot (0.35 s later) and
  hovers; at `at` its podium rises to it, lifts it, and the real object pops over it in place (no gap) with the reveal ring.
- **Camera:** wrap GridFloor + PodiumGame in `boardCamT(t, {entries, …same props})` — the board travels to each newcomer
  (pan + push 1.07, 0.5 s) and keeps pushing slowly; the recap pulls back. AZTIKA stays outside the transform.
- times "×2" (timesAt): dashed bracket + big gold ×N vs the previous champion; leaves when the next contender comes.
- recapAt: everybody in one row (put the question under it with WordPop, AZTIKA smallLeft thinking).
- Between game beats the story leaves the stage (worlds, mini-stories) and comes back — every return = a new round.
- AZTIKA's beats on each arrival: point at the newcomer · react to a giant jump · viewer on a joke. Gallery `night7`.


## Set 4 — space: kit/night-space (13 % of the reference; 7:51–8:44, 12:59–14:31)
Gallery `night8` (stills 1.5 ISS over Earth · 3.5 astronaut · 5.5 orbiters · 7.5 asteroid cut-away · 9.5 sun · 11.5 galaxy).
- **SpaceWorld** `{t, id, stars=140, drift=4, nebula=true}` — near-black navy (measured #01010A → #03071E), faint blue
  nebula, tiny twinkling stars drifting (parallax). The space chapter's home.
- **Earth** `{t, x, y, r, id, at?, spin=4°/s, lon, lat, glow, night}` — real continents, deep blue sea, drifting clouds,
  blue atmosphere + glow, dark night side. "Earth from orbit": `y=1480 r=620` (only the top arc shows, 7:51).
- **Sun** `{t, x, y, r, id, at?}` — boiling orange surface + corona; big on `<Rays tone="orange">` (13:35), small as a far star.
- **Galaxy** `{t, x, y, r, id, at?, tilt=0.42, rot=-22, n=520, color}` — tilted two-arm spiral of star dust, bright core.
- **Asteroid** `{x, y, r, seed, rot, cut 0..1, core, id}` — flat grey rock; `cut` opens a wedge to a glowing core
  («مليانة معادن» 13:20). **AsteroidField** `{t, n, seed, size, avoid:{x,y,r}, id}` — drifting, tumbling rocks.
- **Planet** `{x, y, r, color, band, ring?, id, t}` · **ISS** `{x, y, s, t, rot}` (s 1 ≈ 520 px wide) · **Astronaut**
  `{x, y, s, t, rot, tx?, ty?, accent}` (tether to tx,ty, 8:30) · **Orbiters** `{t, x, y, rx, ry?, n, speed, s, at?}` —
  little astronauts circling the Earth («لما العالم يتعاون» 8:40; draw after Earth with the same x, y).
- For a realistic ISS / astronaut / Earth close-up, generated art (HeroObject) can replace the drawn ones (GAP-CHECK P3).

## Set 5 — mystery + money: kit/night-props
Gallery `night9` (stills 2 money pile + calendar · 4.5 journey path · 7 mystery pillar + red text · 9.5 choice cards ·
12 blueprint in clouds · 14.5 dark tile + coin rain + bills).
- **MysteryBox** `{t, at?, x, y, size=240, id, float, out?}` — glossy gold block, dark "؟" (0:09, 13:30): what's next / the
  unknown winner. **MysteryPillar** `{t, at?, x, base=836, h=300, size, id, out?}` — the box on a glowing gold column
  rising from the floor (the hook's question, 0:09 / 12:16). **MysteryTile** `{t, at?, x, y, w, h, id}` — dark tile with a
  gold "؟" (5:45: a smaller unknown, "another house…").
- **ChoiceCards** `{t, at, cards:[{x, y, w?, h?, color: gold|cyan|violet|red, reveal?, content?}], id, out?}` — two "؟"
  cards; each flips at `reveal` to its content (2:45 «الندرة» or «الهيبة»?). Soft swish on the flip.
- **BlueprintCard** `{t, at?, x, y, w, h, rot, id}` + **CloudWorld** `{t, id}` — "the plan itself is unclear" (7:08);
  CloudWorld alone = nobody knows / fog of history (4:07).
- **MoneyPile** `{t, x, y, s, grow 0..1, id, flutter}` (0:00, 5:03) · **FlyingBills** `{t, at, x, y, n, spread, dur, w}` (a
  reward bursting out, 2:24) · **CoinRain** `{t, at, n, x0, x1, r, dur, speed}` (6:56) · **Bill** · **Coin** (spin).

## Set 6 — numbers, time, lists: kit/night-data
Gallery `night10` (stills 2.2 war timeline · 4.7 gauge · 7.2 bars · 9.7 bar chart · 12.4 receipt).
- **WarWorld** `{t, id, embers}` — blood-red dark backdrop (measured 8:50), drifting smoke, rising embers. War, disaster.
- **NTimeline** `{t, events:[{year?, label?, sub?, subKind?, at, x?, mystery?}], y=560, from?, to?, id, size=34}` — glowing
  cream line drawn on (Arabic: right → left), gold year pill above each pin, white label below, small red sub pill;
  `mystery` = red "؟" pin «شي أكبر...». History in steps, "and then something bigger".
- **NGauge** `{t, x, y, w, h, ticks:[{at, level 0..1, label, kind?}], title?, id, side}` — a tube filling green → yellow →
  red as an estimate climbs (7:27 «مئات المليارات → 8.8 تريليون»); red ↑ bobs while it climbs.
- **NBars** `{t, bars:[{label, value, at, color: cyan|hot|gold|green|pink|violet, kind?}], x, y, len, max?, thick, gap, id}`
  — glowing horizontal bars growing from x (Arabic: x = right edge), label pill above the far end (11:07).
- **NBarChart** `{t, bars, x (left column centre), base, colW, gap, maxH, max?, id}` — glowing columns, tiny label pills
  under them; reads left → right like the reference (12:46). The hero bar first.
- **Receipt** `{t, at, x, y, title, rows:[{label, value}], total, w, rot, step, id}` — paper invoice, rows print one by
  one, torn bottom (14:22 «فاتورة الكون … 0 $»). **MarkPill** `{t, at, text, x, y, mark: cross|check, size, id}` — ✖/✔ +
  white pill rows beside it («ما اشتريناها ✖»).
- **CalendarCard** `{t, at, x, y, to, from?, dur, label?, pill?, size, id, decimals}` — tear-off card counting days/years
  (0:00 «اليوم 11,378 → 28,391», 10:37 «75»); green pill under it.
- **JourneyPath** `{t, at, dur, x0, y0, x1, y1, amp, waves, stations:[{u, node, dx?, dy?}], id}` — the hook's road map
  (0:09–0:14): dotted gold wave drawn on, glowing head, each station's object pops as the head passes. Put the
  MysteryBox at the destination and small HeroObjects (or space pieces) for what's coming.
- **formatNum(n, decimals)** — "12,345.6" for numbers you compute yourself.

## Set 7 — story tools: kit/night-story
Gallery `night11` (stills 2.2 newspapers · 4.7 lineup · 7.2 icon list + strike swap · 9.7 callouts + size · 12.2 measure +
plan frame · 14.7 spotlight + progress + crowd).
- **IconList** `{t, rows:[{text, at, icon?, color?}], x, y, w=700, size=44, gap=100, id}` — white rows with an icon disc (5:26).
- **StrikeSwap** `{t, at, strikeAt, swapAt, from, to, x, y, size=60, id}` — «بيت» struck out ✖ → «شركة» ✔ (5:36).
- **Lineup** `{t, items:[{label, at, node?, mark?, markAt?, kind?}], x, y, r=140, gap, id}` — round frames with a figure/icon,
  label under, ✖/✔ slams on (2:12 «مو عالم · مو مستكشف · مو بطل», 12:39 «مو كيلو · مو صندوق · مو شاحنة»).
- **Callout** `{t, at, x, y, lx, ly, text, kind, size=40, id}` — dot → line → pill (1:30).
- **Measure** `{t, at, x1, y1, x2, y2, label, kind=gold, size=50, off, id}` — dimension line with end ticks («170 كم», «76 سم»).
- **DashedFrame** `{t, at, x, y, w, h, label?, kind=cyan, color, id}` — "the plan" outline (7:43 «المخطط»).
- **ProgressBar** `{t, at, x, y, w, from, to, dur, label?, id}` — striped green bar + big % («نسبة الإنجاز 89 %»).
- **Spotlight** `{x, y, top, w, color, id}` · **StoryCrowd** `{t, x0, x1, y, n, rows, s, cheer?, id}` (1:19) ·
  **StoryTable** `{x, y, w, children}` (3:05 deals).
- **Newspapers** `{t, papers:[{headline, sub?, masthead?, node?, at}], x, y, dx?, w=460, id}` + **PaperStorm** `{t, n}` —
  front pages slap in one by one (soft swish), grey sheets tumbling behind (1:16).
- **QuoteCard** `{t, at, x, y, lines, source?, w=1300, size=70, id}` — Quran / hadith / historical quote: cream card, double
  gold frame, gentle fade-rise (never popped, no glow pulse). Words EXACTLY as said; source pill under it.
- **ChapterTitle** `{t, chapters:[{at, text, n?}], x, y=70, size=40, hide?}` — quiet running chapter pill for list videos.

## Set 8 — more places: kit/night-places
Gallery `night12` (2.2 mine · 4.7 village · 7.2 day · 9.7 factory · 12.2 scale + particles · 14.7 lab · 17.2 ring · 19.7 grid + magnifier).
- **MineWorld** `{t, id}` (1:43) · **VillageWorld** `{t, id, kind: teepee|tent|hut, ground}` (3:44) · **DayWorld** `{t, id,
  sunX, sunY, ground}` (4:32 bright "normal life") · **LabWorld** `{t, id, counter}` (10:37 beige light lab) +
  **StarsRating** `{t, at, x, y, value, n=5, size}`.
- **FactoryLine** `{t, x, y, items: (tank|ship|plane|shell|fuel|box)[], speed, s=1.3, id}` — cargo rides into the factory,
  coins ride out, chimneys smoke (9:11). Put it on WarWorld; label pills under the belt.
- **PlateWorld** `{t, src, id, at, dur, from:{x,y,s}, to:{x,y,s}, grade=0.5, tint}` — a painted Flow backdrop of a REAL
  place with a slow camera move + night grade (see ART-STYLE "painted history plates"). Reuse one plate for several shots.

## Set 9 — science extras: kit/night-sci
- **Particle** `{t, at?, x, y, r=46, color, symbol?, label?, id}` · **ParticleSwarm** `{t, x, y, r, n, color, seed, at?}` (10:01–10:08).
- **WeighScale** `{t, at?, x, y, w=640, value, count, children}` — digital scale «1.000 g»; children sit on the plate.
- **Magnifier** `{t, at?, x, y, r, angle, zoom?, zoomTone, id, children}` — lens with a zoomed world inside, «×1,000,000».
- **RingGauge** `{t, at?, x, y, r=320, value, from, label?, sub?, id}` — accelerator ring with a counting % (11:39).
- **MassGrid** `{t, at, x, y, w, h, cols, rows, dur, node(i)}` + **BananaGlyph** — one thing ×hundreds (11:12).

## Set 10 — real maps: kit/night-maps
Gallery `night13` (2.6 Louisiana spreading · 5.6 neon map + routes · 8.6 Rome spreading · 11.6 quote card · 14.6 plate + chapter title).
- **NightMap** `{t, region, areas:[{countries, fill, at?, spread?:[lon,lat], dur?, dashed?, outline?}], x, y, w, h, mode:
  paper|neon, neon, min=4, id}` — real country shapes (kit/geo data) drawn chunky: thick outline + soft shadow on
  PaperMap, or glowing outline on a dark sky. `spread` = colour spreads from that point (empires, a deal doubling a
  country). region = a kit/geo preset or a bbox `[[W,S],[E,N]]`.
- **nightProj(region, w, h, x, y)** → (lon, lat) ⇒ [x, y] for flags, pins, pills. **NeonLines** `{t, at, lines, color, dur, id}`.

## Set 11 — the video-1 upgrade (2026-11-11): hero finish, stair game, plates
- **HeroObject `draw`** (kit/night-fx) — a CLAUDE-DRAWN object gets the same hero finish as a Flow image (double glow
  halo from its own shape, a light sweep clipped to it, twinkles, the reference pop, float, shimmer):
  `<HeroObject t at draw={coinArt('₿')} ar={1} x y h id />`. Owner rule: every object glows and looks as rich and modern as
  the reference's diamond — never a flat icon. Gallery `night17` = the quality bar (code coin / contract / hard drive
  next to the Flow diamond).
- **kit/night-objects** — ready draws drawn the reference's way (gradients, bevel/rim, highlight, thick outline):
  `coinArt(symbol='₿', tone)` · `documentArt(sealText?)` · `driveArt(led?)`. New objects follow the same recipe.
- **StairGame + stairCamT** (kit/night-game) — the second game device, "from the cheapest to the most expensive, step by
  step": `entries: {id, label (exactly as spoken), at, src|draw, ar, glow?, twist?}[]`, `summitAt` (the «؟» waits on the
  summit — the hook's promise), `recapAt`, `topLabel` («الأغلى»). The `twist` entry takes the SUMMIT even with the
  smallest number (gold step, flash, ring, label) — the board SHOWS the new rule. Arabic stairs rise RIGHT → LEFT.
  `<g transform={stairCamT(t, P)}><GridFloor wide …/><StairGame t id="stairs" {...P} /></g>`. Gallery `night18`.
- **GridFloor `wide`** — extends the floor far past the frame (same vanishing point, no seam): use it under any camera
  that pans or zooms out (boardCamT, stairCamT, pushT on a big world).
- **PlateWorld `look="natural"`** (kit/night-places) — a painted SCENE PLATE (Flow helper, docs/ART-STYLE.md "SCENE PLATE")
  in its own colours; `look="night"` = the night grade. **PlateFx** `{t, kind: confetti|snow|smoke|dust|embers|rays|rain,
  density?, seed?, color?}` — the life layer on a plate. A plate is never a still shot: camera move + PlateFx + Claude's
  overlays (YearBadge, WordPop, StoryPeople, pills, objects). Plan: `"flow": "plate"` + `"fallback"`; ≤ 25 % of the video.
  Gallery `night19`.

## Set 12 — screens / UI: kit/night-ui (2026-11-11) — modern stories happen on screens
Glossy night panels, thick outlines, gold/cyan/red glow, heavy Arabic right-to-left text, faceless avatars (gold rim).
All take `{t, at, id, out?}`; entrances = the reference pop, exits = flyOut; sounds built in. NAMES as text, never real
logos or real app UIs. Gallery `night16` (2.2 laptop+job message · 5.2 phone+chat · 8.4/10.6 video call · 13.2/15.6
downloads ✔/⚠ · 17.0/18.9 transfer press → wrong amount · 21.6 search boxes · 24.9 wallet draining · 26.2/27.4 alerts).
- **Laptop** `{x, y (base bottom-centre), w, screen? (local 1000×625 box), glow?}` · **Phone** `{x, y (centre), h, screen?
  (local 450×900), glow?, float?}` — UI inside a device gets small: put the key piece full-size beside it or push in.
- **MessageCard** `{x, y, w?, from, role?, text, kind: job|chat|alert, action?, badge?, hat?, body?}` — a job offer / chat.
- **VideoCall** `{x, y, w, people: {name, role?, hat?, body?}[], speaking?: index | [time, index][]}` — 1–3 faceless tiles;
  `hat` (UiHat): tie · glasses · headset · hood · hijab · cap · top · crown · bun.
- **DownloadBar** `{x, y, w?, file, dur?, danger?, verdict?}` — % ticks, ✔ done, or red ⚠ (malware) + a verdict pill.
- **TransferScreen** `{x, y, from, to, amount (as spoken), wrong?, dur?, press?, s?, title?, button?}` — the confirm
  press; with `wrong` the amount rolls into the wrong one in red (boom).
- **SearchBox** `{x, y, w?, text, brand?, speed?}` — types letter by letter; `brand` = a text pill.
- **WalletBalance** `{x, y, from, to, unit?, dur?, start?, symbol?, label?, s?}` — counts with countCurve; red ▼ drain /
  green ▲ rise + a trend line.
- **AlertBanner** `{x, y, text, tone: red|gold, size?}` — slams in (pressIn) with hazard stripes.

## Phone sizes (owner 2026-11-10)
Follow the reference's sizes (hero 150–180 · headline 120–140 · hero pill 40–48 · secondary pill 28–32); our one edit:
nothing under **34 px** for labels (NPill enforces it) or **56 px** for free text (GlowText enforces it) — the reference's
tiny 18–22 px chart tags strain on phones. Hero objects ≥ 40 % of the frame height. Not oversized either: the frame
must still breathe. Check with `node tools/sheet.mjs … --phone`. Constants: `PHONE` in kit/night.

## Text tones (all sets)
GlowText / WordPop tone: white · gold · grey · cyan · **red** (bad news, twists, war — «انسرقت!» measured #FD4B5B) ·
**green** (money won, good news). NPill kind: gold · white · grey · cyan · **red** · **green** · **dark**. Rays tone: gold ·
dark · cyan · violet · **orange** (sun) · **green** (land/nature) · **red** (war).

## Sound (built in)
The reference's MEASURED sound map (references/universe-claude/SOUND.md, 2026-11-10 — ≈ 23 effects/min, median 21 dB
under the voice; Arabic renders use the "reference" level model automatically):
boom → PodiumGame newcomer (×N = bigger boom) · Stamp · MysteryBox/MysteryPillar · MassGrid · RevealRing (boom=false
when the caller booms) · shimmer (sparkle) → RevealRing · HeroObject appearing · CountNumber landing · riser → YearBadge
· PodiumGame mystery · pop → NPill/PriceTag/Bubble · YearBadge · thump → MysteryTile · CalendarCard · MarkPill ✖ · ding →
MarkPill ✔ · ProgressBar 100 % · tick → JourneyPath stations · ProgressBar start · whoosh → StripeWipe/WhooshOut ·
Callout · swish → Flag · ChoiceCards · Newspapers · neon → NeonSign. Silent: WordPop words, host pose swaps (as the
reference). Custom pieces: `cueSfx(kind, key, active, x, {gain})` — gain 1 = the reference's typical level for that
kind, 2 = 6 dB louder (a bigger moment). Story sounds by hand in sfx/<chapter>.json. No music; silence after the sign-off.
SYNC (SOUND.md §5): a sound's PEAK lands on the frame the thing LANDS — custom pieces call `cueSfx(kind, key, active, x,
{at, hit})` with at = the exact start time and hit = seconds until it visibly lands (popIn over d s → ≈ 0.19·d; a slam →
its slam time; a whoosh → its fastest moment). Without them the sound is placed at the first frame (early).
Density B (owner pick): ≈ 26–28/min all through, cap 34/min — `node tools/sfx-scan.mjs` flags QUIET (> 3.6 s of speech
with no sound) → add a visual beat that cues its sound (NPill, Callout, CountNumber, JourneyPath dot), never a bare filler.

## Still to build
See references/universe-claude/GAP-CHECK.md (P3 art/poses). The pilot video stays the owner's call.
