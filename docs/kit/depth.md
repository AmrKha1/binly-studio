# depth — `src/kit/depth.tsx`

"Looks 3D, drawn flat": orthographic globe, 2:1 isometric blocks, shaded spheres, perspective layer stacks.
Pure SVG — no WebGL, blur or gradients; depth = projection maths + flat crescent shades + parallax. Light from
the upper-left (tops lightest, left faces mid, right faces darkest). Gallery: `{"page":"depth"}`.

## Globe
Orthographic world-atlas globe. Origin = centre, radius `r`. `rotate` = `[lon, lat]` facing the camera —
animate it to spin / turn to a region. Data 110m (r ≤ 400) or 50m (r > 400); paths memoised per
(detail, r, rotate rounded to 0.01°), so held frames are cheap. Pins hide on the far side and fade at the
limb; routes are great-circle arcs drawing on with `p`, clipped to the visible hemisphere.
```ts
<Globe x y r rotate?=[0,20] p?=1 land?=C.paperLight sea?=C.paperShade border?=C.inkFaint coast?=C.inkLift
  borders?=true detail?: '50m'|'110m' graticule?: boolean | stepDeg night?=0 (0..1) shade?=true
  light?=[-0.6,-0.8] rim?=true
  highlight?: {countries: (name | ISO numeric)[]; color?=C.oxLight; p?}[]
  pins?: {lon; lat; label?; color?=C.oxblood; side?: 'right'|'left'; p?}[]
  routes?: {from: [lon,lat]; to: [lon,lat]; p?; color?=C.oxblood; dashed?; width?}[]>{children}</Globe>
```
```tsx
const k = ramp(t, 0, 3.5);
<Globe x={420} y={480} r={300} rotate={[lerp(-80, 14, k), lerp(22, 44, k)]} night={0.3}
  highlight={[{countries: ['France'], p: ramp(t, 3, 3.6)}]} pins={[{lon: 2.35, lat: 48.86, label: 'Paris'}]}
  routes={[{from: [-74, 40.7], to: [2.35, 48.86], p: ramp(t, 1, 3), dashed: true}]} />
```
Cost: ~30 ms JS per new rotation (110m), first frame ~0.1–0.3 s; one globe page renders in ~3 s/frame locally.

## globeProject · globeFacing
Pure helpers (same maths as Globe). `globeProject` → px relative to the centre (+ `at`), `null` on the far side.
`globeFacing` → 1 at the centre, 0 at the limb, < 0 behind (use it to fade your own overlays).
```ts
globeProject(rotate, r, at?: {x?, y?}) → (lon, lat) => [x, y] | null
globeFacing(rotate, lon, lat) → number
```
```tsx
const at = globeProject(rot, 300, {x: 420, y: 480})(2.35, 48.86); // Paris or null
```

## crescentPath · mixTone
`crescentPath(r, angleRad, n)` → path `d` of the disc part beyond a terminator ellipse on side `angle`
(n 0 → nothing, 0.5 → half, 1 → full). The flat shade used by Globe/Sphere — reuse it for any round thing.
`mixTone(a, b, k)` → hex mix of two palette colours (accepts hex or rgb(), chainable).

## iso · isoShades
2:1 isometric projection. World axes: +x → right-down, +y → left-down, +z → up; 1 unit = 1 px at s = 1.
All Iso* components take `x, y` = screen point of their world origin (back ground corner), so place a scene
by adding `iso(gx, gy, gz)` to one origin.
```ts
iso(x, y, z?=0, s?=1) → [sx, sy]
isoShades(base) → {top, left, right}            // light upper-left
```
```tsx
const at = (gx, gy, gz = 0) => { const [a, b] = iso(gx, gy, gz); return [O.x + a, O.y + b]; };
```
Painter's order: draw objects back to front (ascending gx + gy).

## IsoBox · IsoTile · IsoFloor
Box w × d × h rising from the ground with `p`; flat cast shadow to the lower-right. IsoTile = one slab tile.
IsoFloor = slab of cols × rows checker tiles that drop in as a diagonal wave (origin = back corner of its top).
```ts
<IsoBox x y w d h s?=1 color?=C.stone colors?: {top,left,right} p?=1 shadow?=true>{children}</IsoBox>
<IsoTile x y size?=48 h?=8 color?=C.stone s? p? />
<IsoFloor x y cols rows size?=48 colors?=[stone, light stone] grout? thick?=14 gap?=2.5 s? p? />
```

## IsoBuilding
Footprint w × d, `floors` × 44 (medieval) / 36 (modern). roof 'gable' (ridge along the longer side, tile
courses, optional chimney) | 'flat' (parapet + roof unit). Medieval: stone, or timber-framed plaster upper
floors over a stone ground floor (`material`, else seeded); small framed windows, plank door. Modern: concrete,
ribbon windows. `windowsLit` 0..1 = seeded fraction of lit (lamp) windows. p = rises from the ground.
```ts
<IsoBuilding x y w?=120 d?=100 floors?=2 roof?='gable'|'flat' era?='medieval'|'modern' windowsLit?=0
  p?=1 seed?=1 s?=1 wall? roofColor? chimney? door?=true shadow?=true material?: 'timber'|'stone' />
isoChimneyTop({w, d, floors, era, s}) → [dx, dy]   // chimney top, relative to the building origin (Steam)
```
```tsx
const [cx, cy] = isoChimneyTop({w: 200, d: 104, floors: 1});
<IsoBuilding x={bx} y={by} w={200} d={104} floors={1} chimney p={ramp(t,1,2)} />
<Steam t={t} x={bx + cx} y={by + cy} w={40} h={150} n={3} />
```

## IsoStairs
`steps` steps up to height h. dir 'left' = risers face the left-front, climbing toward the back-right (put a
platform IsoBox behind it at the same h); 'right' = risers face the right-front.
```ts
<IsoStairs x y w d h steps?=6 dir?='left'|'right' color?=C.stone s? p? shadow? />
```

## IsoRoom
Stage for small iso props: floor slab with tile grid + two thick back walls (left on x = 0, right on y = 0),
skirting, optional window with a flat light patch. `children` draw inside, in the room's local frame
(origin = back floor corner) — place props with `iso(x, y)`.
```ts
<IsoRoom x y w d h wallColors?: {left?=C.bone, right?=C.boneShade} floorColor?=C.stone tiles?=40 (0 = none)
  window?=true thick?=12 s? p?>{children}</IsoRoom>
```
```tsx
<IsoRoom x={1700} y={300} w={180} d={150} h={140}>
  <IsoCylinder x={iso(96, 84)[0]} y={iso(96, 84)[1]} r={36} h={34} kind="tub" />
</IsoRoom>
```

## IsoCylinder
Origin = screen point of the base centre; `r` = world radius (screen half-width r·1.41·s). Flat vertical
shade bands. kind presets: 'tower' (stone, cone roof, slit windows), 'tub' (wood, open top with liquid
`fill`), 'barrel' (wood, iron hoops, lid), 'plain'. `top` overrides: 'flat' | 'cone' | 'open' | 'crenel'.
```ts
<IsoCylinder x y r h kind?='plain' top? color? roofColor?=C.slate roofH?=r*1.6 fill?=0.7 fillColor?=C.water
  windows? s?=1 p?=1 shadow?=true seed? />
```

## Sphere
Reads round from flat crescents: terminator shade, deeper core shadow, rim (bounce light on the dark edge) and
a flat specular blob. Seeded surface `pattern` spins with `rotate` (deg; `tilt` = axial tilt toward camera).
`preset` sets defaults (explicit props win): planet (bands), moon (craters + maria), cell (spots, highlight),
eyeball (plain, highlight). `children` draw on the surface (clipped, origin = centre) under the shading.
```ts
<Sphere x y r preset?: 'planet'|'moon'|'cell'|'eyeball' color? light?=[-0.6,-0.8] terminator?=0.3 rim?
  highlight? pattern?: 'none'|'bands'|'spots'|'craters' patternColor? seed?=1 rotate?=0 tilt?=14
  outline?=true p?=1>{children}</Sphere>
```
```tsx
<Sphere x={990} y={820} r={118} preset="planet" rotate={t * 25} />
<Sphere x={1730} y={828} r={80} preset="eyeball"><circle cx={10} r={32} fill={C.evidenceLight} /><circle cx={10} r={15} fill={C.ink} /></Sphere>
```

## DepthStack · depthAt
Flat layers at depths `z` (1 = main plane, 2 = twice as far, 0.5 = foreground) viewed through a perspective
camera: scale = zoom·z / (z − cam.z), pan shift ∝ 1 / (z − cam.z). Each layer is drawn in its own frame
(default 1920×1080) and looks exactly as designed at rest (cam at frame centre, z 0, zoom 1). Dolly = animate
`cam.z` toward the layers: near ones grow fast, fade and pass the camera (hidden at z − cam.z < 0.12).
`haze` 0..1 veils layers beyond `focus` with flat `hazeColor` (atmospheric perspective, no blur).
```ts
<DepthStack layers: {el; z}[] cam: {x; y; zoom?=1; z?=0} focus?=1 haze?=0 hazeColor?=C.paper
  frame?={x:0, y:0, w:1920, h:1080} />
depthAt(z, cam, frame?) → {dz, s, dx, dy}
```
```tsx
const k = ramp(t, 0, 4);
<DepthStack cam={{x: 960 + k * 60, y: 540, z: k * 0.7}} haze={0.5} hazeColor={C.sky}
  layers={[{z: 5, el: <Mountains />}, {z: 2.4, el: <Hills />}, {z: 1, el: <Town />}, {z: 0.8, el: <Arch />}]} />
```
vs stage.tsx `World`/`Cam`: those are orthographic parallax (layer offset ∝ depth factor, zoom blended
linearly) — best for pans and gentle push-ins with keyframed `CamKeys`. Use DepthStack when the camera should
travel *into* the scene (layers pass the lens, far layers barely move). Both can nest: put a DepthStack inside
a `Cam` for an extra shake/rotation.
