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

## Still to build
Story worlds (sunset + city silhouette, paper map with regions/flags/price tag, teal science grid + holo ring, night city,
warm room with window light shaft), story people (faceless round heads + one hat, gold rim), SFX mapping + music mix.
