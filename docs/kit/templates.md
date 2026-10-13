# templates — `src/kit/templates.tsx` (shot templates)

**Use templates for standard beats; hand-craft the hook, reveals and signature moments.**

Each template is a finished full-frame shot (`<Stage>`), a pure function of absolute `t`, for a shot living from
`a` to `b` (s). Entrances key off cue props (`at`, `cues`, `…At`; default ≈ `a + 0.2`), holds stay alive (camera
push + breathe, dust, slow rings), and everything settles before `b` so any `<Shots>` transition works.
Common props (`ShotBase`): `t a b tone?: 'paper'|'ink'|'shade' seed? motif?: 'rings'|'band'|'frame'|'dots'|'none'`
— `seed` varies backdrop motif, camera drift and small layout choices (vary it between shots).
Gallery: `{"page":"templates"}` (stills 2.5, 5.5 … 29.5) and `{"page":"templates2"}` (2.5, 5.5 = Process, Question).
Helpers exported: `ShotShell` (stage + camera + backdrop + dust + vignette, for custom shots that should match),
`RichText` (wrapped text with words/type/fade reveal + marker/underline `mark` words), `tonePal`, `semColor`, `Backdrop`, `shotCam`.

## TitleShot
Chapter/section title: kicker + big title (`\n` = 2 lines) + icon medallion, giant numeral, or custom art slot. Default tone ink.
```ts
<TitleShot {...base} title kicker? sub? icon?: IconName number?: '02' accent?: string[] at? layout?: 'center'|'left'
  children?: slot art (origin = slot centre, ≈380×340) />
```
```tsx
{start: T.c2, render: (t) => <TitleShot t={t} a={T.c2} b={T.s1} kicker="Chapter two" title="The bath that cured nothing" icon="bath" accent={['nothing']} at={T.c2 + 0.2}/>}
```

## StatShot
One exact number made tangible (counts up, lands exactly; oxblood beat). Optional comparison on the other half.
```ts
<StatShot {...base} value: '26' unit? label? kicker? note? icon? color? count?=true at? compareAt?
  compare?: {kind:'dots', filled, total?=100, cols?, color?, caption?}
          | {kind:'bars', bars: Bar[], highlight?, caption?}
          | {kind:'scale', items: {label, value, display?, icon?, color?}[2–3], caption?} />
```
```tsx
<StatShot t={t} a={T.s} b={T.e} value="26" unit="%" label="of patients recovered" at={T.num}
  compare={{kind:'dots', filled:26, caption:'26 out of every 100'}} compareAt={T.dots}/>
```

## QuoteShot
Quote or document excerpt. style `card` (paper card, big quote mark) · `document` (aged page, camera leans in) · `typed` (types with caret, ink).
```ts
<QuoteShot {...base} text source? sub? style?='card' highlight?: string[] at? highlightAt? revealDur? docTitle? />
```
```tsx
<QuoteShot t={t} a={T.q} b={T.r} style="document" docTitle="Report to the King · 1348" text="…the pestilence enters the body."
  highlight={['pestilence']} highlightAt={T.pest} source="Paris Medical Faculty"/>
```

## EvidenceShot
Real archival image framed on a gallery wall (wires, lamp light); camera pushes to the marked detail.
```ts
<EvidenceShot {...base} slug src credit? caption? aspect?=1.6 (img w/h) width? frame?: 'museum'|'print' tint?='paper'
  pan?: {from:[fx,fy,z], to:[fx,fy,z]}  mark?: {rx, ry, rw, rh, at?, shape?, label?}
  tag?: {text, kind?: Sem, at?}  nameTag?: {name, sub?, at?}  at? />   // default tone shade; ink = dark gallery
```
```tsx
<EvidenceShot t={t} a={T.ev} b={T.n} slug="medieval-baths" src="img/tournai.jpg" aspect={801/482} caption="Burial of plague victims, Tournai, 1349"
  credit="Pierart dou Tielt · Public domain" mark={{rx:0.32, ry:0.55, rw:0.3, rh:0.48, at:T.coffins, label:'Coffins'}} tag={{text:'Primary source'}}/>
```
`mark` coords = 0..1 of the window at zoom 1; the default pan zooms around the mark so it stays on the detail.

## ClaimShot
A claim with its certainty: confirmed (solid green frame) · theory (dashed plum = inferred) · caution (mustard). Optional stamp + "But…" line.
```ts
<ClaimShot {...base} text kind?: 'confirmed'|'theory'|'caution' tag? (default Confirmed/Theory/Debated) stamp? but?
  icon? highlight?: string[] at? tagAt? stampAt? butAt? />
```
```tsx
<ClaimShot t={t} a={T.c} b={T.d} kind="theory" text="Hot water spread the plague through open pores." highlight={['open','pores']}
  but="No one had yet seen a single germ." butAt={T.but} stamp="Wrong" stampAt={T.wrong}/>
```

## CompareShot
A vs B: `columns` (two cards + VS) · `venn` (overlap + side lists) · `balance` (scale tips to the verdict side).
```ts
type CompareSide = {title; bullets?: string[] (≤3, short); kind?: Sem; icon?; value?; weight? (balance blocks)}
<CompareShot {...base} left right mode?='columns' overlap? kicker? title? at? rightAt?
  verdict?: {text, side?: 'left'|'right'|'both', kind?: Sem, at?} />
```
```tsx
<CompareShot t={t} a={T.a} b={T.b} left={{title:'Miasma', icon:'wind', kind:'theory', bullets:['Bad air from rot']}}
  right={{title:'Germ theory', icon:'germ', kind:'confirmed', bullets:['Living microbes']}} rightAt={T.germ} verdict={{text:'Microbes win', side:'right', kind:'confirmed', at:T.win}}/>
```

## ListShot
2–5 items revealed on cues. `tiles` = icon medallions in a row; `column` = numbered rows + big medallion of the latest item (or `children` at 1440,560).
```ts
type ListItem = {label; icon?; sub?; kind?: Sem}
<ListShot {...base} items kicker? title? layout?='tiles' numbered?=true cues?: number[] at? gap?=0.7 highlight?: index highlightAt? children? />
```
```tsx
<ListShot t={t} a={T.l} b={T.m} title="More than a wash" items={[{label:'Hot water', icon:'drop'}, {label:'Gossip', icon:'speech'}]}
  cues={[T.water, T.gossip]} highlight={1} highlightAt={T.gossip + 2}/>
```

## TimelineShot
Events on cues while an oxblood cursor travels the axis; cards on two tiers; `eras` tint columns + labelled strip.
```ts
<TimelineShot {...base} from to events: {year, label, at?, kind?: Sem, yearLabel?, tier?: 0|1}[]
  eras?: {from, to, label, color?}[] ticks? format? kicker? title? at? gap?=0.8 />
```
```tsx
<TimelineShot t={t} a={T.tl} b={T.x} from={1200} to={1700} ticks={100} title="From cure to culprit"
  eras={[{from:1347, to:1550, label:'Plague years', color:C.oxblood}]} events={[{year:1348, label:'Black Death', kind:'signal', at:T.bd}]}/>
```
With `eras`, tick labels are hidden (the strip + cursor pill carry the years). Labels ≤ ~22 chars.

## MapShot
One GeoMap with pins / cities / spread rings, routes, areas, country highlights on cues. `side` layout = map + title column with a growing legend; `full` = full-bleed + title plate.
```ts
<MapShot {...base} region pins?: {lon, lat, label?, sub?, at?, kind?: 'pin'|'city'|'spread', side?, color?}[]
  routes?: {points: LonLat[], at?, dashed?, color?, bend?}[] areas?: {lon, lat, rx, ry?, rot?, label?, at?, color?}[]
  highlight?: (MapHighlight & {at?})[] labels? borders? kicker? title? sub? layout?='side' at? gap? />
```
```tsx
<MapShot t={t} a={T.m} b={T.n} region="western-europe" title="The plague reaches the baths"
  pins={[{lon:9.19, lat:45.46, label:'Milan', at:T.milan}, {lon:2.35, lat:48.86, label:'Paris', at:T.paris}]} routes={[{points:[[9.19,45.46],[2.35,48.86]], at:T.route, dashed:true}]}/>
```
Heavy to render locally (≈1–2 s/frame): one map per shot.

## PersonShot
Real-person intro: Person in a small environment + NameTag plate (kicker inside), optional held icon prop.
```ts
<PersonShot {...base} name sub? kicker? person?: Partial<PersonProps> env?: 'room'|'study'|'lab'|'street'|'museum'|'plain'
  era?: RoomEra ('modern' → modern lab/street) night? side?: 'left'|'right' prop?: IconName at? nameAt? children? (props behind the person) />
```
```tsx
<PersonShot t={t} a={T.p} b={T.q} name="Guy de Chauliac" sub="Papal physician · Avignon · 1348" env="study"
  person={{outfit:'robe', hat:'scholar', beard:'short'}} prop="book" nameAt={T.name}/>
```

## ProcessShot
Cause → effect on cues: `chain` (medallions + drawing arrows, a pulse runs the chain on the hold) or `cycle` (ring, labels outside, `center` text).
```ts
type ProcessStep = {label; icon?; kind?: Sem; sub?}
<ProcessShot {...base} steps mode?='chain' kicker? title? center? cues? at? gap?=0.6 />
```
```tsx
<ProcessShot t={t} a={T.p} b={T.q} title="Why baths seemed deadly" cues={[T.hot, T.pores, T.air, T.plague]}
  steps={[{label:'Hot water', icon:'drop'}, {label:'Pores open', icon:'thermometer'}, {label:'Bad air enters', icon:'wind', kind:'theory'}, {label:'Plague', icon:'skull'}]}/>
```

## QuestionShot
Open question / curiosity pivot: big question (accent words) + slot: `?`, dashed `silhouette`, or your art. Default tone ink.
```ts
<QuestionShot {...base} question kicker? highlight?: string[] mark?: 'question'|'silhouette'|'none' at? markAt? side?='right'
  children? (slot art, origin = slot centre, ≈520×520) />
```
```tsx
<QuestionShot t={t} a={T.q} b={T.r} question="So who actually carried the plague into the bathhouse?" highlight={['carried']} mark="silhouette"/>
```
