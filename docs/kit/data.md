# data — `src/kit/data.tsx`

Data visualisation for **exact** statistics: every number shown comes from an explicit prop, so the screen
says exactly what the narration says. Numbers in Fraunces 700, labels in Inter caps. All take `p` 0→1
(build-on; settled at 1). Count-ups land exactly on the given string (uses `countUp`). Gallery: `{"page":"data"}`.

Helpers: `fmtNum(12500) → "12,500"`, `fmtYear(-400) → "400 BCE"` (`fmtYear(y, true)` adds " CE").

## BarChart
Vertical bars growing staggered; value labels count up on top, category labels below.
Box (x,y)=top-left, w×h **includes** value + category labels. `highlight` index → oxblood, others muted.
```ts
<BarChart x y w h bars: {label; value; color?; valueLabel?}[]; p; max?; highlight?; color?=C.inkLift;
  highlightColor?=C.oxblood; grid?=true; labelSize?=22 />
```
```tsx
<BarChart x={200} y={200} w={800} h={500} p={ramp(t,1,3)} highlight={0}
  bars={[{label:'Florence', value:60, valueLabel:'60%'}, {label:'Paris', value:50, valueLabel:'50%'}]} />
```
Labels may use `"\n"` for two lines. Keep slot width (w / bars) ≥ label width.

## DotGrid
Waffle / "26 out of 100". Origin = top-left. Empty dots fade in, then filled dots fill **in order**.
```ts
<DotGrid x y cols rows filled?; p; size?=26; gap?=size*0.42; color?=C.oxblood; empty?=C.paperDeep;
  groups?: {count; color}[]; shape?: 'dot'|'square'|'person'; order?: 'row'|'col' />
dotGridSize(cols, rows, size?, gap?) → {w, h}
```
```tsx
<DotGrid x={700} y={250} cols={10} rows={10} filled={26} size={40} p={ramp(t,0.5,4)} />
<DotGrid x={700} y={250} cols={10} rows={10} groups={[{count:26,color:C.oxblood},{count:40,color:C.theory}]} p={p} />
```

## PercentRing
Donut filling to `value` (0–100) while the exact `label` counts up in the centre. Origin = centre.
```ts
<PercentRing x y r?=120 value label p; color?=C.oxblood; track?=C.paperShade; thick?=r*0.2; caption?; labelSize? />
```
```tsx
<PercentRing x={960} y={500} r={180} value={26} label="26%" caption="of waking moments" p={ramp(t,1,3)} />
```

## Comparison
A-vs-B split panel. Box (x,y)=top-left of both panels. Side = `{title; value?; body?; color?; count?}`
(`count:false` for years/IDs). Left slides in, then right, then the VS badge (`vs={null}` hides it).
```ts
<Comparison x y w h left: Side; right: Side; p; vs?='vs'; gap?=36; valueSize?; bodySize?=30 />
```
```tsx
<Comparison x={140} y={300} w={1640} h={420} p={ramp(t,0,2)}
  left={{title:'Miasma theory', value:'1,500', body:'years as the accepted explanation.', color:C.theory}}
  right={{title:'Germ theory', value:'1861', count:false, body:'Pasteur shows microbes cause decay.', color:C.evidence}} />
```
Keep bodies to ≤ 2 lines per panel (h ≈ 270 fits title + value + 2 body lines at the default sizes).

## TimelineAxis
Year axis that draws on, ticks, staggered event pins (above/below, alternating by default), optional moving
`cursor` (year) shown as an oxblood progress line + year pill (tick labels under the pill hide).
Origin = left end of the axis; needs ~110 px above/below for event labels, ~60 px below for ticks/cursor.
```ts
<TimelineAxis x y w from to p; events?: {year; label; above?; color?; stem?=70; yearLabel?}[];
  ticks?: number[] | step; cursor?: year; format?: (y)=>string; color?=C.ink; cursorColor?=C.oxblood;
  labelSize?=28; tickLabels?=true />
```
```tsx
<TimelineAxis x={160} y={600} w={1600} from={-500} to={2000} ticks={500} p={ramp(t,0,3)}
  cursor={keys(t,[[1,-500],[4,1348]])} events={[{year:1348, label:'Black Death', color:C.oxblood, above:true}]} />
// deep time:  format={(y) => `${-y / 1e6} MYA`}  with from={-252e6} to={-66e6}
```
Default format: negative → "400 BCE"; if the range crosses 0 positives get " CE". Use different `stem`
lengths for neighbouring events on the same side so labels don't collide.

## LineChart
Straight-segment line drawing on left→right with a flat area under it and a leading dot.
Box (x,y,w,h) = **plot area**; y-tick labels sit ~70 px left, x-ticks ~40 px below, `xLabel` ~80 px below,
`yLabel` above the top-left corner. `highlight` point (index or `{index,label}`) pops when the line reaches it.
```ts
<LineChart x y w h points: [x, y][]; p; xLabel?; yLabel?; highlight?: number | {index; label?};
  xDomain?; yDomain?; xTicks?; yTicks?; fmtX?=String; fmtY?=fmtNum; color?=C.oxblood; area?=true />
```
```tsx
<LineChart x={300} y={250} w={1300} h={550} p={ramp(t,0.5,4)} yDomain={[0,100]} yTicks={[0,50,100]}
  points={[[1340,75],[1351,50],[1400,40]]} fmtY={(v)=>`${v}M`} highlight={{index:1, label:'50M'}} yLabel="Europe population" />
```

## Meter
Horizontal certainty bar. Origin = left end of the track centre line. Marker + `valueLabel` above,
end `labels` below, optional `title` higher up. `zones` tints the track in equal bands.
```ts
<Meter x y w value: 0..1; labels: [left, right]; p; color?=C.oxblood; title?; valueLabel?; zones?: string[]; thick?=22 />
```
```tsx
<Meter x={560} y={600} w={800} value={0.35} labels={['Speculation','Confirmed']} valueLabel="Debated" color={C.caution} p={p} />
```

## Gauge
Semicircular dial with needle (gentle overshoot). Origin = needle pivot. `valueLabel` under the pivot.
```ts
<Gauge x y r?=150 value: 0..1; labels: [left, right]; p; color?=C.oxblood; valueLabel?; zones?: string[]; thick?=r*0.17 />
```
```tsx
<Gauge x={960} y={640} r={260} value={0.72} labels={['Guess','Proven']} valueLabel="Likely"
  zones={[C.theoryTint, C.cautionTint, C.evidenceTint]} color={C.evidence} p={ramp(t,0.5,2.5)} />
```

## BalanceScale
"Weighing two theories". Origin = beam pivot; at s=1 beam 460 px wide, stand down to y+330.
`tilt` −1…1 (**animate it yourself**; +1 = right pan down). Items: a number (stack of weight blocks in the
side colour) or any SVG node drawn at the pan rim centre. Labels stay true-size at any `s`.
```ts
<BalanceScale x y tilt; leftLabel?; rightLabel?; leftItems?: number | ReactNode; rightItems?;
  leftColor?=C.theory; rightColor?=C.evidence; color?=C.ink; s?=1; p?=1; labelSize?=22 />
```
```tsx
<BalanceScale x={960} y={380} tilt={keys(t,[[1,0],[2,-0.6],[3.5,0.8]])} leftLabel="Miasma" rightLabel="Germs"
  leftItems={2} rightItems={5} />
```

## CounterRow
Row of exact figures counting up in turn, separated by thin rules, caps labels below.
Origin = left end of the row at the numbers' baseline; total width w.
```ts
<CounterRow x y w items: {value; label; color?; count?}[]; p; size?=88 />
```
```tsx
<CounterRow x={260} y={600} w={1400} p={ramp(t,0,3)}
  items={[{value:'1347', label:'Arrives', count:false}, {value:'25M', label:'Dead', color:C.oxblood}]} />
```
