# SHARED assets · medieval-bathing — build FIRST (chapters import them)
Folder: `src/videos/medieval-bathing/shared/` (one file per component + `index.ts` re-exporting all).
Test sheet: a test composition/page showing each component in 2–3 dial states (use the studio's normal way of
showing a sheet; render with `node tools/sheet.mjs`/`tools/still.mjs`). Flat Binly style, palette `C` only, no
gradients/blur/texture, deterministic (pure functions of props + t). Every component: `x, y, s` (origin documented),
`t` (idle life), `seed`, `p` (entrance 0→1) where sensible. Build them FLEXIBLE (future videos reuse them by dials).
Report: file paths + each component's props in one line each (I put them in docs/ASSETS.md).

## 1. PoreSkin — THE video's signature motif ("heat opens the body")
A horizontal cross-section strip of skin, like a cut-away wall: top surface line with ~7–11 pores (small arched
openings/funnels going down into the skin), 2–3 flat layers below (outer skin paper-warm tint `C.paperDeep`/skin tones,
deeper layer slightly darker, a hint of inner body warmth at the bottom). Origin = centre of the top surface; `w` ≈ 1400 default.
Dials:
- `open` 0..1 — pores closed (thin slits) → wide open funnels. Must look clearly different at 0, 0.5, 1.
- `heat` 0..1 — warm lamp/oxblood-tinted glow shapes over the surface + rising `Steam` wisps above (heat = steam).
- `flowOut` 0..1 — warm/evidence-green droplets & wisps travel OUT through the pores upward (sweating out what's
  inside = healing). Count/opacity scales with value; motion with t.
- `flowIn` 0..1 — plum (`C.theory`) wisps drifting DOWN into the open pores and spreading into the layers (corrupted
  air entering). Visibly invades layer 2 at 1.
- `sealed` 0..1 — morphs to the MODERN view: a continuous smooth barrier, no openings (for "skin as a sealed barrier").
- `tone` 'paper'|'ink' (ink = plague-night version: darker surround, same skin readable).
- `split?: number` (x position) — optional: left of split uses flowOut, right of split uses flowIn (the climax
  "same pore, two airs" image). If set, `flowOut`/`flowIn` apply only to their side.
- `pores?` count, `w`, `s`, `t`, `seed`.
Read at thumbnail size: openings must be big and bold enough (pore mouth ≈ 50–90 px wide at s=1, open=1).

## 2. HumorWheel — the four humors
Circular diagram, origin centre, radius ≈ 330 at s=1. Four quadrants, each with a flat vessel/drop emblem + label
(Inter caps ≥ 26 px): BLOOD (oxblood family), PHLEGM (paper-light/pale blue-grey from ink tints), YELLOW BILE (mustard),
BLACK BILE (ink). Axes as labels outside: HOT ↔ COLD (horizontal), WET ↔ DRY (vertical) — blood = hot+wet,
yellow bile = hot+dry, black bile = cold+dry, phlegm = cold+wet (place quadrants accordingly).
Dials: `reveal: [n,n,n,n]` 0..1 per humor (pop-in), `axesP` 0..1 (axes + HOT/COLD/WET/DRY labels draw on),
`highlight?: 0..3` (one quadrant glows, others dim), `balance` 0..1 (centre: a small flat body silhouette or a balance
needle that sits level at 1 and tilts at 0), `tilt` −1..1 (imbalance direction), `heatArrow` 0..1 (a warm arrow pushing
toward HOT+WET — "a hot bath warms and moistens"), `s`, `t`, `p`, `dark?` (on ink).

## 3. Miasma — corrupted air
Flat plum tendrils/fog bands (stacked flat shapes with low opacity, NO blur) drifting and curling. Origin top-left of
box `x,y,w,h`. Dials: `density` 0..1, `p` (creeps in from `from: 'left'|'right'|'bottom'|'top'`), `vx` drift speed,
`toward?: {x, y, k}` (tendrils bend and flow into a target point with strength k — used to flow INTO pores/doorways),
`color` (default `C.theory`), `opacity`, `t`, `seed`. Must sit over paper AND over ink (shade variants).

## 4. HeroTub — hook & bookend hero tub
Close-up hero of a medieval wooden bathtub (staves, iron/rope hoops, linen draped over the rim), water surface, thick
`Steam`, warm lamp pool light from the left. Origin = bottom centre, ≈ 1100 px wide at s=1.
Dials: `split` 0..1 — a vertical boundary wipes from the right: right of it the world turns ink (night), the light goes
cold, steam turns plum and curls DOWN toward the water instead of up (death seeping in); left half stays warm.
`splitX` (where the boundary sits when split=1, default frame centre), `steam` 0..1, `light` 0..1, `herbs` 0..1
(a hand-less sprinkle of herb leaves floating on the water — "medicine"), `bather` 0..1 (head + shoulders of a calm
bather in the water, CLOTHED in a linen bathing shift; generic, back-turned or 3/4 — no nudity at all), `t`, `seed`.
Background is NOT included (chapters place it on paper/ink); provide optional `backdrop` boolean = simple stone-wall
+ beam backdrop behind it.

## Done when
Test sheet shows: PoreSkin at open 0 / 0.5 / 1, with flowOut, with flowIn, sealed, split; HumorWheel full + one
highlight; Miasma over paper and ink + toward a point; HeroTub split 0 / 0.5 / 1 with bather + herbs. All readable at
1080p, nothing static (t moves steam, wisps, drops), `node tools/check.mjs` passes.
