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

## Still to build (next steps of the upgrade)
Rays background (rotating wedges + vignette + bokeh), count-up hero number, stamps (slam + shake), speech bubbles with
✔/✖, camera punch-in + whoosh/streak transition, gold stripe wipe, sunset + city silhouette scene, paper map scene,
teal science scene, neon sign-off, SFX mapping.
