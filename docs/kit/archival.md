# archival — `src/kit/archival.tsx` (real-image templates)

**Real images edited like a documentary: always move, always mean something, credit every image.**

Same contract as `templates`: each is a full-frame `<Stage>`, a pure function of absolute `t` for a shot `a → b`,
entrances keyed to cue props (`at`, `…At`, per-item `at`), alive holds, works inside `<Shots>`.
Shared props (`ArchBase`): `t a b slug tone? seed? credit? tint?: 'paper'|'sepia'|'ink'|'none' (default paper) caption?`.
Image coords: `rx, ry` = 0..1 of the SOURCE image. `Focus = [fx, fy, zoom]` aims the camera on the image
(zoom 1 = just covers the frame). Always pass `aspect` = source width / height (overlays depend on it).
`credit` is always drawn small (ink pill bottom-right on images); `caption` → documentary lower third (+ `kicker`).
Gallery: `{"page":"archival"}` (stills 3.5, 7.5 … 27.5) and `{"page":"archival2"}` (3.5 ImageInWorld, 7.5 ParallaxCutout).
Helpers exported: `ArchImage` (one image in a window, origin top-left, cover-fit, focus/tint/dim/wash/clip),
`viewRect` + `onView` (map image coords → window px), `LowerThird`, `CreditLine`.
Square/portrait images in a full 16:9 frame show only a horizontal band (≈ ry 0.2–0.8 at zoom 1) — aim focus accordingly.

## KenBurnsShot
Slow motivated move from→to (eased, log zoom) + `beats` re-aiming the camera on cue (eased 1.1 s punch-in, or `cut:true` = hard punch).
```ts
<KenBurnsShot {...base} slug src aspect? from?: Focus to?: Focus beats?: {at, focus: Focus, cut?}[]
  frame?: 'full'|'print' vignette?=true caption? kicker? captionAt? credit? at? />   // print: framed print on tone backdrop
```
```tsx
<KenBurnsShot t={t} a={T.k} b={T.l} slug="medieval-baths" src="img/tournai.jpg" aspect={801/482} caption="Burial of plague victims, Tournai, 1349"
  credit="Pierart dou Tielt · Public domain" beats={[{at: T.coffins, focus: [0.3, 0.56, 1.75]}]}/>
```

## DetailHuntShot
Starts wide, punches into each detail on cue and annotates it (draw-on ellipse/box + leader + label plate, semantic colour),
returns wide at `returnAt` with all details as numbered markers. Zoom is automatic (detail ≈ 45 % of frame), label goes to the open side.
```ts
type Detail = {rx, ry (centre), rw, rh, label, note?, at?, kind?: Sem, shape?: 'ellipse'|'box', zoom?}
<DetailHuntShot {...base} slug src aspect? details: Detail[] returnAt?: number|false (default b−1.4) kicker? caption? credit? at? />
```
```tsx
<DetailHuntShot t={t} a={T.d} b={T.e} slug="medieval-baths" src="img/bathhouse.jpg" aspect={1690/1653}
  details={[{rx:0.42, ry:0.26, rw:0.17, rh:0.25, label:'Guests arrive', at:T.door}, {rx:0.73, ry:0.5, rw:0.36, rh:0.3, label:'Dinner in the tub', shape:'box', at:T.tub}]}/>
```
Allow ≥ 1.6 s per detail (punch 1 s, mark +0.6, label +0.9).

## MontageShot
2–8 images cut on cues, each with its own small move (seeded push / pull / pan, or `from`/`to`); one tint unifies mixed sources.
```ts
type MontageItem = {src, aspect?, credit?, caption?, kicker?, from?: Focus, to?: Focus}
<MontageShot {...base} slug items cuts?: number[] (n starts, or n−1 = starts of items 2…n) transition?: 'cut'|'dissolve'|'slide'
  tint? counter?=true kicker? at? />   // cut = hard cut + 4 % punch; slide = incoming slides over with an oxblood edge
```
```tsx
<MontageShot t={t} a={T.m} b={T.n} slug="medieval-baths" transition="cut" cuts={[T.m, T.b1, T.b2, T.b3]}
  items={[{src:'img/tournai.jpg', aspect:801/482, credit:'…'}, {src:'img/bath.jpg', aspect:1.02, credit:'…', caption:'Bathhouse, c. 1470'}]}/>
```

## CollageShot
2–6 prints on a board (paper pinboard or `dark`), slight rotations, tape or pins, flat shadows; they drop in on cues, the camera drifts.
`link` = red string (pin to pin) or arrow between two items + optional Tag label. Labels/credits are written on each print's margin.
```ts
type CollageItem = {src, aspect?, credit?, label?, at?, x?, y?, w?, rot?, fasten?: 'tape'|'pin'}
<CollageShot {...base} slug items board?: 'paper'|'dark' tint? link?: {from, to, at?, style?: 'string'|'arrow', label?, kind?: Sem} at? gap?=0.45 />
```
```tsx
<CollageShot t={t} a={T.c} b={T.d} slug="medieval-baths" items={[{src:'img/tournai.jpg', aspect:801/482, label:'Tournai, 1349', credit:'…'}, …]}
  link={{from:0, to:1, at:T.link, label:'Same century'}}/>
```

## CompareImagesShot
Two images: `side` (two framed panels, labels, semantic tags, "vs" seal, optional title) or `wipe` (full-frame slider wipes the right
image in and settles at `split`, breathing). Then vs now, claim vs evidence.
```ts
type CompareSideImg = {src, aspect?, label, sub?, tag?: {text, kind?: Sem}, credit?, from?: Focus, to?: Focus}
<CompareImagesShot {...base} slug left right mode?='side' split?=0.5 tint? title? (side) at? rightAt? />   // default tone shade
```
```tsx
<CompareImagesShot t={t} a={T.c} b={T.d} slug="medieval-baths" mode="wipe" rightAt={T.now}
  left={{src:'img/then.jpg', aspect:1.5, label:'Then', sub:'1349', credit:'…'}} right={{src:'img/now.jpg', aspect:1.5, label:'Now', tag:{text:'Photograph', kind:'evidence'}}}/>
```

## DocumentScanShot
Document/manuscript page: a lamp scan bar sweeps (reveals) it, then each region gets a marker highlight + outline on cue and a
transcription/translation card in the right column (leader line); `lens` = magnifier inset showing the active region.
```ts
type DocRegion = {rx, ry (TOP-LEFT), rw, rh, at?, kind?: Sem (default caution), label?, text?}
<DocumentScanShot {...base} slug src aspect? (w/h, default 0.75) regions lens?=true scan?=true kicker? title? credit? at? gap?=1.1 />
```
```tsx
<DocumentScanShot t={t} a={T.d} b={T.e} slug="medieval-baths" src="img/decree.jpg" aspect={0.745} title="The decree" kicker="Paris · 1348"
  regions={[{rx:0.43, ry:0.25, rw:0.15, rh:0.1, label:'Opening words', text:'When the Author of the universe…', at:T.open}]}/>
```
Keep ≤ 3 regions with text, text ≤ ~70 chars.

## AnnotatedImageShot
"Animation on top of reality" (the Binly signature): full-frame image + flat-vector overlays drawn on cue, tracking the slow move.
Strokes carry a paper halo so they read on any image; `dim` = ink veil so marks pop.
```ts
type Overlay =
  | {kind:'arrow', from:[rx,ry], to:[rx,ry], at?, sem?, bend?, label?}
  | {kind:'outline', rx, ry (centre), rw, rh, at?, sem?, shape?: 'ellipse'|'box', dashed? (= inferred, plum), label?}
  | {kind:'label', rx, ry, text, note?, at?, sem?, dx?, dy?}
  | {kind:'icon', rx, ry, icon: IconName, at?, sem?, label?}
  | {kind:'flow', points: [rx,ry][], at?, sem?, label?, dur?}      // spline + travelling dots
<AnnotatedImageShot {...base} slug src aspect? overlays from? to? dim?=0.12 kicker? caption? credit? at? gap?=0.5 />
```
```tsx
<AnnotatedImageShot t={t} a={T.a} b={T.b} slug="medieval-baths" src="img/bath.jpg" aspect={1.02} overlays={[
  {kind:'outline', rx:0.75, ry:0.62, rw:0.42, rh:0.34, shape:'box', label:'Shared hot tub', at:T.tub},
  {kind:'flow', points:[[0.43,0.42],[0.47,0.52],[0.55,0.6]], label:'Way in', sem:'evidence', at:T.walk}]}/>
```

## ImageInWorldShot
The image as an object in a scene, then the camera pushes into it until it fills the frame ("zoom into the evidence"), keeps a
slow Ken Burns and shows caption + credit. setting `desk` (top-down desk under a lamp), `museum` (framed on a gallery wall,
visitors), `hands` (a Person holds the print up; `person` overrides PersonProps).
```ts
<ImageInWorldShot {...base} slug src aspect? setting?='desk' pushAt?: number|false (default a+1.4) pushDur?=1.6
  label? (top-left plate before the push) person? caption? kicker? credit? at? />
```
```tsx
<ImageInWorldShot t={t} a={T.w} b={T.x} slug="medieval-baths" src="img/tournai.jpg" aspect={801/482} setting="museum" pushAt={T.look}
  label="Room 14 · Medieval Flanders" caption="Burial of plague victims, Tournai, 1349" credit="Pierart dou Tielt · Public domain"/>
```

## ParallaxCutoutShot
Fake 2.5D without segmentation: the image recedes (`ink` darken or `paper` wash + desaturate, never blur) while a crop of it lifts
off at `at` as a paper cut-out with a flat shadow and travels at a different parallax speed during the pan.
```ts
type Cut = {rx, ry (TOP-LEFT), rw, rh, shape?: 'rect'|'ellipse'} | {points: [rx,ry][]}
<ParallaxCutoutShot {...base} slug src aspect? cut from?: Focus to?: Focus depth?=1 recede?='ink'
  label?: {text, kind?, at?} kicker? caption? credit? at? (default a+0.5) />
```
```tsx
<ParallaxCutoutShot t={t} a={T.p} b={T.q} slug="medieval-baths" src="img/bath.jpg" aspect={1.02} from={[0.4,0.3,1.15]} to={[0.52,0.34,1.22]}
  cut={{rx:0.355, ry:0.15, rw:0.15, rh:0.28, shape:'ellipse'}} label={{text:'The visitors'}} at={T.lift}/>
```
