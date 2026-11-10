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
    <NPill text="45 مليون $" x={868} y={266} size={60} kind="gold" id="q" p={(t - 0.6) / 0.25} />
    <WordPop t={t} id="h" y={318} size={150} right={1650}
      words={[{w: 'أنت', at: 0.9}, {w: 'غالي!', at: 1.2, tone: 'gold'}]} />   {/* each word pops on its spoken time */}
    <HostGlow id="host"><ImageHost t={t} x={480} y={1068} h={340} poses={[[0, 'full-thumbsup-wink']]} shadow={false} /></HostGlow>
  </NightScreen>
</Stage>
```

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
- **RevealRing** `{t, at, x, y, r?, color?}` — expanding gold ring + sparkles (0.7 s) when a new object appears.
- **YearBadge** `{t, at, year, from?, x, y, label?, place?, id, size=120}` — black tile, gold border, glowing gold digits;
  `from` makes it count year by year (0.1 s per step: «1506 → 1503» = going back in time); label pill on top (سنة),
  place pill below.
- **HostGlow** `{id, rim=4, glow=1, color}` — wrap the host (or any hero character) for the gold rim line + soft glow.
- **Sparkle** `{x, y, r, o, color}` — 4-point star. **N** = the measured palette. **textWidth(text, size)** = exact width.

## Set 2 — kit/night-fx (import from '../../../kit/night-fx')
Gallery `night4` runs them in order (stills 1.5, 3.6, 5.9, 7.95, 8.08, 8.48, 9.8).
- **Rays** `{t, id, x?, y?, tone: gold|dark|cyan|violet, n?, spin?}` — slowly rotating sunburst + vignette. gold = the
  "you!" hero moment (0:16.4), dark = the sign-off (14:44), cyan = science/body, violet = space. + **Bokeh** `{t, n?, color?, seed?}`.
- **CountNumber** `{t, at, value, x, y, size=170, tone, id, dur=1.2, from=0.03}` — exact spoken value counting up with
  an ease-out and a small punch when it lands (2:00.4).
- **Stamp** `{t, at, text, x, y, size=110, rot=-8, color}` — red ink stamp slams in from 1.6× with a shake (3:16–3:47).
- **Bubble** `{t, at, lines, x, y, tx, ty, size=64, mark?: check|cross, icon?, out?}` — speech bubble that grows out of
  the speaker's mouth (tail tip tx,ty), thick outline, optional ✔/✖ badge or icon (0:45). **Mark** = the ✔/✖ badge alone.
- **punchT(t, end, cx, cy, dur=0.35, amount=0.35)** — transform for the end-of-scene punch-in on the key line, then
  **WhooshOut** `{t, at, dur=0.18}` — streaks across an empty sky between scenes (0:27.4–27.8).
- **StripeWipe** `{t, at, dur=0.6}` — gold/orange diagonal stripes; fully covers the frame at at+dur/2 → cut there (0:09).
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
- **StoryPerson** `{x, y, s, body, hat: none|beret|top|helmet|bicorne|crown|turban|cap|feather, hatColor, pose:
  idle|point|hold|up, flip, t, id}` — the mini-story actors: faceless dark round head with a GOLD RIM, ONE identifying
  hat, flat body, breathing. AZTIKA is the only character with a face. **MoneyBag** prop.
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
- mystery: black silhouette hovering over the empty spot (the row makes room first) → lands at `at` with the reveal ring.
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

## Text tones (all sets)
GlowText / WordPop tone: white · gold · grey · cyan · **red** (bad news, twists, war — «انسرقت!» measured #FD4B5B) ·
**green** (money won, good news). NPill kind: gold · white · grey · cyan · **red** · **green** · **dark**. Rays tone: gold ·
dark · cyan · violet · **orange** (sun) · **green** (land/nature) · **red** (war).

## Sound (built in)
Restraint like the reference (STYLE-BIBLE §6): StripeWipe/WhooshOut whoosh · RevealRing soft sparkle · Stamp stamp ·
Bubble/PriceTag soft pop · Flag soft swish · NeonSign neon hum · HostTrack moves very soft swish · ChoiceCards flip soft
swish. Silent: WordPop, NPill, CountNumber, YearBadge, host pose swaps, space, charts, timeline, receipt, calendar, money.
Add `{"kind":"boom"}` by hand in sfx/<chapter>.json for the 1–3 biggest reveals. No music.

## Still to build
See references/universe-claude/GAP-CHECK.md (P2 story tools, P3 art/poses). The pilot video stays the owner's call.
