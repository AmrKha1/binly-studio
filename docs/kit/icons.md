# icons — `src/kit/icons.tsx`

Bold flat pictogram family (filled geometric shapes + 6px round-capped strokes), two-tone: main `color`
plus one `accent` detail. Gallery: `{"page":"icons"}`.

## Icon
One pictogram. Origin = centre; 96×96 px at `s=1` (content within ±44 px). `p` 0→1 pops it in
(scale + slight turn, gentle settle); `p` defaults to 1 (static).

```ts
<Icon name: IconName; x; y; s?=1; color?=C.ink; accent?=C.oxblood; knock?=C.paper; p?=1; r?=0 />
```
- `knock` paints cut-outs (holes, highlights, separators). **Set it to the background colour** when the
  icon is not on plain paper (e.g. `knock={C.ink}` on a dark panel, with `color={C.paperLight}`).
- Semantic use: `color={C.evidence}` on `check`, `color={C.caution}` on `warning`, etc.

```tsx
<Icon name="lungs" x={960} y={540} s={2} p={ramp(t, 1, 1.6)} />
<Icon name="check" x={300} y={200} color={C.evidence} />
<Icon name="moon" x={1600} y={160} color={C.paperLight} accent={C.lamp} knock={C.night} />
```

## ICON_NAMES
`IconName[]` — every available name (64):

question, exclamation, check, cross, warning, info, eye, brain, ear, mouth, hand, heart, lungs, drop, flame,
thermometer, sun, moon, star, cloud, wind, lightning, clock, hourglass, calendar, book, scroll, document,
quill, magnifier, microscope, flask, pill, syringe, germ, virus, dna, atom, person, people, crown, skull,
house, building, church, castle, globe, pin, key, lock, phone, computer, chip, speech, thought, lightbulb,
coin, scale, shield, chart, gear, arrow-right, arrow-up, bath.

Notes: `check/cross/question/exclamation/info` are badge discs (glyph knocked out); `heart`, `flame`,
`lightning`, `pin` are drawn mainly in `accent`. For other arrow directions use `r` (e.g. `arrow-right` with `r={90}`).
