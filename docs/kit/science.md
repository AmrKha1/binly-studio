# science — `src/kit/science.tsx`

Body, brain and science visuals in flat editorial style (light from upper-left, flat shade crescents on the
lower-right). Colour meaning: flesh/blood = oxblood family (`oxTint`/`oxLight`), signals/thought = theory
plum, healthy/immune = evidence green, germs/warning = caution mustard. All are SVG for a `<Stage>`; most
take `x y s` (+ `o` opacity). Idle life via `t` (seconds). Gallery: `{"page":"science"}`.

Helpers (exported): `smoothPath(pts, closed?)` (Catmull-Rom path through `[x,y][]`),
`makeCurve(pts)` → `{d, len, at(k)→{x,y,a}, sub(k0,k1)}` (arc-length sampling for things moving along a path),
`heartPulse(t, bpm?)` → 0…1.6 lub-dub value, `BRAIN_REGIONS`.

## Brain
Side view, origin = centre of cerebrum, ≈330×330 at s=1 (brainstem reaches y≈+200).
Regions: `frontal | motor | parietal | temporal | occipital | cerebellum | brainstem`.
```ts
<Brain x y s? facing?:'right'|'left' highlight?: Region | Region[] | {[region]: colour} highlightColor?=C.theoryLight
  hp?=1 lobes?=false signal?: 0→1 labels?: true | Region[] labelP?=1 fill?=C.oxTint o? />
```
`lobes` colour-codes every lobe (map look). `signal` = plum pulse frontal → motor cortex → brainstem (motor
command). Labels sit outside the brain (≈ ±230·s px wide incl. text), always upright.
```tsx
<Brain x={960} y={500} s={1.4} highlight="motor" hp={ramp(t,1,2)} signal={ramp(t,2,3.5,ease.linear)} labels={['motor']} />
```

## HeadProfile
Bald editorial head in profile. Origin = centre of cranium; ≈450×540 at s=1 (neck bottom y=+330, nose tip x=+246).
```ts
<HeadProfile x y s? facing?:'right'|'left' skin?=C.skin[1] skinShade? showBrain? highlight? highlightColor? hp?
  lobes? signal? eeg? implant? t? o? />
```
`showBrain` = cut-away with Brain (highlight/hp/signal/lobes pass through). Without the brain, `highlight`
glows on the skull. `eeg` = dark cap with electrodes + mesh + cable (electrodes flicker plum with `t`).
`implant` = electrode array on the motor cortex, wire to a skull pedestal with cable (LED pulses with `t`).
```tsx
<HeadProfile x={700} y={560} s={1.1} showBrain implant highlight="motor" hp={ramp(t,1,2)} signal={ramp(t,2,4)} t={t} />
<HeadProfile x={1300} y={560} facing="left" eeg skin={C.skin[3]} t={t} />
```

## ElectrodeArray · Electrode
Utah-style micro-electrode array, 3/4 view, origin = plate top centre, ≈130×90 at s=1 (needles hang down,
gold ribbon wire goes up-right). `Electrode` = single EEG disc (r≈14), `active` 0→1 glows plum.
```ts
<ElectrodeArray x y s? r? n?=6 t? active?=0 wire?=true />
<Electrode x y s? active? color?=C.theoryLight />
```

## BodyOutline
Front-view human figure with toggleable organs. Origin = between the feet; ≈310×700 at s=1.
```ts
<BodyOutline x y s? t? p?=1 organs?: {lungs?, heart?, brain?, stomach?, blood?: boolean | 0→1} fill?=C.paperDeep
  shade?=C.paperDark bpm?=72 o2?=1 />
```
`t` drives breathing (4 s cycle), heartbeat and blood flow (oxblood near the heart → plum at extremities).
`o2` < 1 greys the lungs (oxygen deprivation).
```tsx
<BodyOutline x={960} y={1000} s={1.25} t={t} p={ramp(t,0,1)} organs={{lungs: ramp(t,1,1.6), heart: true, blood: ramp(t,1.5,3)}} />
```

## Lungs · Heart
`Lungs`: front view with trachea + bronchial tree; origin = centre, ≈240×300 (trachea top y=−175).
`Heart`: anatomical-friendly with aorta (oxblood), vena cava + pulmonary trunk (plum); origin = centre, ≈200×260.
```ts
<Lungs x y s? breath?=0.5 (0→1 inflate) o2?=1 color?=C.oxTint airway?=C.paperLight o? />
<Heart x y s? t? bpm?=72 beat? (override 0→1) color?=C.oxLight o? />
```
```tsx
<Lungs x={700} y={540} breath={0.5 + 0.5*Math.sin(t*1.6)} o2={1 - ramp(t,3,6)} />
<Heart x={1200} y={540} s={1.2} t={t} bpm={110} />
```

## BloodVessel
Tube along a smooth path with flowing blood cells; colour shifts from `from` (start) to `to` (end).
```ts
<BloodVessel points: [x,y][] t? speed?=90 width?=26 from?=C.oxblood to?=C.oxblood wall?=C.oxTint p?=1 density?=1 seed? />
```
```tsx
<BloodVessel points={[[200,700],[600,560],[1000,640],[1700,500]]} t={t} width={40} from={C.oxblood} to={C.theory} p={ramp(t,0,1)} />
```

## Eye · EyeCrossSection
`Eye`: front view with lids, origin = centre, ≈330×200. `look` [-1..1, -1..1], `blink` 0 open → 1 closed,
`pupil` 0 pinpoint → 1 dilated. `frame` draws the skin lid patch.
`EyeCrossSection`: side cut, light enters from the right; origin = eyeball centre, R=150 (optic nerve to x=−250).
`rays` 0→1 draws light focusing on the fovea. Children render inside the vitreous (local coords, clipped
to r=126) — e.g. patrolling `ImmuneCell`s.
```ts
<Eye x y s? look?=[0,0] blink?=0 pupil?=0.45 iris?=C.evidenceLight skin?=C.skin[1] frame?=true />
<EyeCrossSection x y s? rays?=0 labels?=false labelP?=1>{children}</EyeCrossSection>
```
```tsx
<EyeCrossSection x={960} y={540} s={1.6} rays={ramp(t,1,2.5)} labels labelP={ramp(t,2,3)}>
  <ImmuneCell x={-40 + t*8} y={60} s={0.4} t={t} heading={0} />
</EyeCrossSection>
```

## Neuron · Synapse
`Neuron`: soma + tapered dendrites + myelinated axon pointing right + terminal bulbs. Origin = soma centre;
≈(length+80)×330. `signal` 0→1 = plum action potential down the axon (myelin segments light up, terminals flash at the end).
`Synapse`: presynaptic bulb (top) with vesicles; `p` 0→1 = one release, plum neurotransmitter crosses the
cleft and lights the green receptors. Origin = cleft centre, ≈340×460.
```ts
<Neuron x y s? r? length?=560 signal? seed?=3 color?=C.oxTint o? />
<Synapse x y s? p?=0 t? color?=C.oxTint />
```
```tsx
<Neuron x={300} y={540} s={1.4} signal={ramp(t,1,2.5,ease.linear)} />
```

## Cell · ImmuneCell
`Cell`: membrane wobbles with `t`; nucleus, mitochondria, ER, vesicles. Origin = centre, r=110.
`tone`: 'healthy' (green) | 'stressed' (mustard) | 'neutral' (paper).
`ImmuneCell`: macrophage-style blob with pseudopods reaching toward `heading` (deg, 0 = right), lobed nucleus,
granules. Origin = centre, r≈70 (+pseudopods). Move it yourself (x/y from t); `t` animates the body.
```ts
<Cell x y s? t? seed? tone?='healthy' r?=110 />
<ImmuneCell x y s? t? heading?=0 seed? color?=C.evidenceTint membrane?=C.evidenceLight />
```

## Germ · Bacterium · Virus
Caution mustard by default. `Germ kind`: 'rod' (bacillus + flagellum) | 'coccus' (grape cluster, count by seed)
| 'spiral' | 'virus' (spiked capsid). Origin = centre, ≈130–160 at s=1. `seed` = pose, `t` = wiggle/spin.
```ts
<Germ x y s? kind?='rod' seed? t? color? shade? />   // Bacterium / Virus take the same props
```

## DNA
Double helix along x (rotate with `r`). Origin = centre; `length` × 2·`radius`. Ink backbones (back strand
faint), base-pair rungs in four palette colours. `t` spins, `p` builds left → right.
```ts
<DNA x y s? r? length?=560 radius?=56 pitch?=230 t? p?=1 speed?=1.2 seed? backbone?=C.inkLift />
```

## Molecule
Ball-and-stick: 'O2' | 'CO2' | 'H2O' | 'CO' | 'N2' (O oxblood, C ink, H paper, N plum). Origin = centre.
`r` + `t·spin` rotate; `label` prints the formula (O₂) below; `p` pops it in.
```ts
<Molecule x y s? kind?='O2' r?=0 t? spin?=0 label?=false p?=1 />
```

## Waveform
Scrolling signal line; origin = left end of the baseline, `w` wide, ±`amp`.
kind: 'speech' (syllable bursts, ink) | 'eeg' (plum) | 'ecg' (oxblood heartbeat) | 'flat' (flatline). `p` draws on.
```ts
<Waveform x y w?=400 amp?=50 t? freq?=1 kind?='eeg' color? width?=4 p?=1 seed? speed?=140 />
```
```tsx
<Waveform x={300} y={800} w={1300} amp={80} t={t} kind={t < 5 ? 'ecg' : 'flat'} />
```
