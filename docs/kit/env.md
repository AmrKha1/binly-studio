# kit/env — environments & props

`import {…} from '../kit/env'`. Flat stepped colour, upper-left light, palette only. Everything is a pure
function of props; `t` = idle life (cloud drift, sway, flicker, ripples), `seed` = variation.

**Conventions**
- Environments fill 1920×1080 at s=1, origin = frame top-left, with ~400px overscan left/right/below for parallax.
- Interiors share the floor line `ENV_FLOOR` = **820** (character feet). Streets: medieval cobbles/modern sidewalk start at 820.
- Props: origin = **base / bottom-centre** unless noted. All props accept `x, y, s, flip`.
- Types: `Tone = 'day'|'dusk'|'night'|'overcast'`, `Layer = 'far'|'mid'|'near'`, `Era = 'medieval'|'early-modern'|'modern'`, `RoomEra = 'medieval'|'19thc'|'modern'`.
- Helpers: `mixC(a, b, k)` (chainable colour mix, accepts hex or rgb()), `toned(color, tone, far01)` (re-tint a material for time of day + atmosphere), `skyBands(tone)` (5 sky colours top→horizon), `BOOK_COLORS`.

## Parallax recipe
```tsx
<World cam={cam} layers={[
  {depth: 0.1, el: <Sky variant="dusk" t={t}/>},
  {depth: 0.3, el: <Hills layer="far" tone="dusk"/>},
  {depth: 0.5, el: <CitySkyline era="medieval" layer="mid" tone="dusk" walls/>},
  {depth: 1,   el: <Ground y={860} tone="dusk"/>},
  {depth: 1.3, el: <Trees layer="near" tone="dusk" t={t} x0={-200} x1={400}/>},
]}/>
```

## Sky & landscape (origin = frame)
- **Sky** — stepped 5-band sky, sun (day/dusk) or moon (night), stars, drifting clouds.
  `{variant?: Tone='day'; t?; horizon?=760; stars?: bool (default night); sun?=true; sunX?; sunY?; moon?: 'full'|'crescent'; clouds?: n; cloudSpeed?=1; seed?}`
  `<Sky variant="night" t={t} moon="crescent"/>`
- **Cloud** — single flat cloud, origin bottom-centre. `{w?=300; color?; shade?; o?}`
- **Moon** — disc with halo, origin centre. `{x; y; r?=60; phase?: 'full'|'crescent'}`
- **Stars** — twinkling field in a box. `{t?; seed?; x?; y?; w?; h?; n?=80}`
- **Hills** — rolling band, shade on right-facing slopes, fills to bottom. `y` = crest base.
  `{layer?: Layer='mid'; seed?; tone?; color?; y? (650/730/850); amp?; shade?=true}`
- **Ground** — flat plane from `y` down with sparse marks. `{y?=820; kind?: 'grass'|'earth'|'sand'; tone?; color?; seed?}`
- **Tree** — single tree, origin trunk base. `{kind?: 'round'|'conifer'|'bare'|'poplar'; h?=300; t?; seed?; tone?; far?: 0..1; color?; trunk?}`
- **Trees** — seeded row. `{layer?; kind?: TreeKind|'mixed'; y?; x0?=-250; x1?=2170; density?=1; h?=300; t?; tone?; seed?}`
- **Water** — lake band with drifting ripple dashes + optional sun/moon glint column.
  `{y?=780; h?=400; t?; tone?; glintX?; x?; w?; color?; seed?}`
- **Landscape** — ready composite (sky, hills, trees, optional lake, ground). `{tone?; seed?; t?; water?: bool; trees?: TreeKind|'mixed'}`
  `<Landscape tone="dusk" water t={t}/>` (lake shore / floor ≈ y 955; without water, near hill ≈ 870–900)

## City
- **CitySkyline** — silhouette band; `y` = building ground line (buildings extend below). Night ⇒ lit windows (some flicker with `t`).
  `{era?: Era='medieval'; layer?: Layer='mid'; tone?; y?; lit?; t?; walls?: bool (medieval town wall + gate towers); color?; seed?; x0?; x1?}`
  medieval: gabled houses, towers, church spire · early-modern: stepped/bell gables, domes, clock tower · modern: blocks, rooftop kit, window grids.
- **Street** — full street scene: sky, far + mid skyline, row of facades, street surface (floor 820).
  `{era?: 'medieval'|'modern'; tone?: Tone='day'; t?; seed?}` · medieval = stone ground floor, jettied half-timber, cobbles, lanterns at night; modern = shopfronts + awnings, sidewalk 820–880, road, lamp posts.
  `<Street era="medieval" tone="night" t={t}/>`
- **StreetLamp** — modern lamp post, origin pole base. `{h?=420; lit?; color?}`

## Interiors (origin = frame, floor at 820)
- **Room** — `{era?: RoomEra='19thc'; wall?; floor?; trim?; window?: 'arched'|'square'|'none'; windowX?; door?=true; doorX?; doorOpen?: 0..1; light?=true (LightShaft + floor patch); night?; sky?: Tone; t?; seed?}`
  medieval = stone blocks, ceiling beam + corbels, arched window, plank door, flagstones · 19thc = striped wallpaper, picture rail, wainscot, sash window with curtains, panel door · modern = plain wall, radiator, pendant lamp, flush door.
  `<Room era="medieval" windowX={400} doorX={1600} t={t}/>`
- **Floor** — floor band. `{y?=820; color?; kind?: 'planks'|'flags'|'tiles'; seed?}`
- **Bathhouse** — medieval public bath: stone arcade, oculi + light shafts, beams, two wooden tubs (left under linen canopy at x 460, right x 1470, base y≈900), bench, buckets, steam.
  `{t?; seed?; layer?: 'all'|'back'|'front'}` — draw `layer="back"`, then bathers, then `layer="front"` (tub fronts + steam).
- **Lab** — counter (top y 640) with microscope, glassware, test tubes; wall shelves; window; modern adds monitor + strip light, 19thc a retort + burner + lantern.
  `{t?; era?: '19thc'|'modern'; night?; seed?}`
- **Classroom** — chalkboard (x 560–1380, y 180–580) with faint notes, clock, window, teacher desk, foreground desks.
  `{t?; time?: hours; layer?: 'all'|'back'|'front'; seed?}` · **ClassroomFront** `{y?=960; color?}` = the desk row alone.
- **MuseumHall** — arched windows between pilasters, cornice, light shafts, tiled floor, central Plinth (top ≈ y 770).
  `{t?; windows?=4; plinth?=true; wall?; seed?}`
- **Study** — dark panelled library: tall bookshelves both sides, framed map, desk across the front (top y 690) with oil lamp, books, quill.
  `{t?; layer?: 'all'|'back'|'front'; lamp?=true; seed?}` — characters go between `back` and `front`.
- **Bedroom** — night bedroom: curtained window with moon & stars (x 560), moonlight shaft onto the bed (x≈1250), nightstand + candle.
  `{t?; night?=true; candle?: bool (lit); seed?}`
- **MindSpace** — calm ink/plum field with floating soft shapes, slow orbit rings, dust; centre kept clear for text.
  `{t?; bg?: 'ink'|'plum'='plum'; density?=1; seed?}`

## Props (origin = base-centre unless noted; all take x, y, s, flip)
| Prop | Props | Notes |
|---|---|---|
| Table | `w?=360 h?=150 color?` | |
| Desk | `w?=440 h?=170 color?` | drawer pedestal right |
| Chair | `h?=240 color?` | side view, faces right (`flip` for left) |
| Bed | `w?=560 frame? blanket? pillow? sheet?` | side view, headboard left |
| Bookshelf | `w?=300 h?=520 seed? shelves? fill?=0.9 color?` | seeded books, leaners, jars |
| BookStack | `n?=4 w?=150 seed?` | |
| OilLamp | `t? lit?=true glow?=1 color?` | ~165 tall, LightPool glow |
| Candle | `t? lit? h?=90 glow? color? holder?` | |
| Torch | `t? lit? glow? seed?` | wall torch, origin = handle bottom |
| Lantern | `t? lit? chain?=0 glow? color?` | `chain` draws chain above the ring |
| Window | `w?=240 h?=360 shape?: 'arched'\|'square' sky?: Tone t? frame? reveal? curtains? curtainColor? moon? panes? seed?` | origin = sill centre |
| Door | `w?=200 h?=360 shape? style?: 'plank'\|'panel'\|'flush' color? frame? open?: 0..1 inside?` | origin = threshold |
| Bathtub | `kind?: 'wood'\|'modern' w?=380 t? water? color? linen? part?: 'all'\|'back'\|'front'` | `back` before a bather, `front` after |
| Bucket | `w?=90 color? water?=true` | |
| Plant | `kind?: 'leafy'\|'tall'\|'bush' seed? t? pot? color?` | sways with t |
| Barrel | `w?=150 h?=200 color?` | |
| Cauldron | `w?=220 t? steam?=true fire? liquid? color?` | bubbles + Steam |
| Scroll | `w?=360 h?=300 p?: 0..1 lines? seed? color?` | origin = **top roll**; `p` unrolls down |
| Bench | `w?=420 h?=110 color?` | |
| Clock | `time?: hours (3.5 = 3:30) r?=90 t? pendulum? color? face?` | origin = **face centre** |
| Bell | `r?=80 t? swing?: deg color?` | origin = **hanging point** |
| Banner | `kind?: 'hanging'\|'flag' w?=200 h?=320 t? color? emblem?: 'none'\|'circle'\|'cross'\|'stripe' trim?` | hanging: origin = **rod centre**; flag: pole foot |
| Plinth | `w?=600 h?=90 color? label?=true` | blank label plate for a Kicker |
| Frame | `w?=300 h?=220 kind?: 'landscape'\|'portrait'\|'map'\|'blank' color?` | origin = **centre** |
| StreetLamp | `h?=420 lit? color?` | |
| Tree | see above | origin = trunk base |

```tsx
<Room era="19thc" t={t}/>
<Desk x={1200} y={ENV_FLOOR}/><OilLamp x={1080} y={ENV_FLOOR - 170} t={t}/>
<Clock x={1500} y={260} r={60} time={10 + t / 60}/>
```
