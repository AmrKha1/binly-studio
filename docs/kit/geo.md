# geo — `src/kit/geo.tsx`

Maps for history/geography beats in an old-print style: paper land, slightly darker sea with an engraved
line along the coast, thin ink coastlines, faint borders + graticule, Fraunces italic sea names.
Data = local world-atlas TopoJSON (`50m` regional, `110m` world) via d3-geo; projections and paths are
memoised per region+size (first frame computes, later frames are cheap). Gallery: `{"page":"geo"}`.

Regions (`REGIONS`): `world` (equalEarth) · `europe`, `western-europe`, `mediterranean`, `north-america`,
`asia` (conicConformal) · `south-america`, `africa`, `middle-east`, `iberia`, `british-isles`, `france`,
`italy`, `low-countries`, `alps` (mercator) — or any bbox `[[W,S],[E,N]]` (mercator). The bbox is fitted
*inside* the box (extra area shows around it).

## makeProjection
Pure helper: the exact projection GeoMap uses. Pass the map's x/y to get absolute stage px.
```ts
makeProjection(region, w, h, {x?, y?, projection?}) → (lon, lat) => [x, y]     // type Proj
```
```tsx
const eu = makeProjection('europe', 1040, 860, {x: 80, y: 100});
const [px, py] = eu(2.35, 48.86); // Paris
```

## GeoMap
Map in the box (x, y, w, h), clipped, with a double neatline frame. `children` draw on top, clipped to the
box (use absolute coords from makeProjection). World maps draw the globe outline instead of a box.
```ts
<GeoMap x y w h region?='europe' projection?: 'mercator'|'equalEarth'|'conicConformal' detail?: '50m'|'110m'
  p?=1 land?=C.paperLight sea?=C.paperShade border?=C.inkFaint coast?=C.inkLift borders?=true
  graticule?: boolean | stepDeg ripples?=(not world) frame?=true
  highlight?: {countries: (name | ISO numeric)[]; color?=C.oxLight; p?; outline?}[]
  labels?: {text; lon; lat; kind?: 'sea'|'region'|'country'; size?; rotate?}[] labelP?=1>{children}</GeoMap>
```
Country names are Natural Earth names (case-insensitive): 'France', 'Spain', 'United States of America',
'Dem. Rep. Congo'… or ISO numeric (`250`, `'076'`). Modern borders — for medieval maps pass `borders={false}`.
```tsx
<GeoMap x={80} y={100} w={1040} h={860} region="europe" p={ramp(t,0,1)}
  labels={[{text:'Mediterranean Sea', lon:6.6, lat:37.8}]} highlight={[{countries:['Italy'], p: ramp(t,1,2)}]}>
  <MapPin {...} />
</GeoMap>
```
Cost: a 50m regional map ≈1–2 s/frame locally (slow PC); avoid more than two maps on screen at once.

## MapPin
Teardrop pin that drops with a gentle settle. Origin = pin tip (the location). Label in Fraunces 32 with a
paper halo, optional `sub` (sans caps 22). `side`: 'right' | 'left' | 'top'.
```ts
<MapPin x y p?=1 label? sub? color?=C.oxblood s?=1 side?='right' />
```

## CityDot
Ring + centre dot city marker with Fraunces label (halo). `side`: 'right' | 'left' | 'top' | 'bottom'.
```ts
<CityDot x y label? p?=1 color?=C.ink side?='right' size?=28 italic?=false />
```

## Route
Line that draws on with a travelling arrowhead. `points` are `[lon,lat]` with `proj`, or px without it.
Two points → arc (`bend` fraction of length, sign flips side). More points → smooth curve through them.
```ts
<Route points proj? p?=1 color?=C.oxblood width?=5 dashed?=false arrow?=true bend?=0.18 dots?=false />
```
```tsx
<Route points={[[28.97,41.0],[15.55,38.19],[5.37,43.3]]} proj={md} p={ramp(t,1,3)} dashed />
```

## SpreadRings
Outbreak / spread marker: filled core + rings expanding on a loop driven by `t`. Origin = centre.
```ts
<SpreadRings t x y r?=110 n?=3 period?=2.4 color?=C.oxblood p?=1 core?=12 />
```

## AreaMark
Region without a modern border (e.g. Brabant, "the Low Countries"): flat tint + dashed rim drawing on,
optional label. Origin = centre.
```ts
<AreaMark x y rx ry?=rx*0.7 rot?=0 p?=1 color?=C.theory label? labelDy? />
```

## MapLabel
Map typography. 'sea' = Fraunces italic tracked (no halo), 'region' = sans caps tracked, 'country' = Fraunces caps.
```ts
<MapLabel x y text kind?='sea' size? rotate?=0 p?=1 color? />
```
