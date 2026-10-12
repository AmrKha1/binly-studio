# Writing kit components (rules for anyone adding to src/kit)

The kit is Binly's reusable animation library (Remotion + React + SVG). Chapters of every video are
assembled from it, so components must be **reliable, generic, beautiful, on-brand and cheap to use**.

## Hard rules
1. **Pure functions of time.** Components receive progress values (`p`, 0→1) or the absolute time `t`
   (seconds) as props. Never `useCurrentFrame`, `Math.random`, `Date`, timers, React state/effects.
   Randomness → `rand(seed)`, `randRange`, `noise1` from `src/kit/anim.ts`.
2. **SVG first.** Components render SVG elements (`<g>`, `<path>`, …) meant to be placed inside a
   `<Stage>` (src/kit/stage.tsx, a 1920×1080 SVG). Position with `x`, `y` (and `s` scale) props, or
   wrap with `<At x y s r o>`. Origin conventions must be documented in the JSDoc (e.g. "origin = feet").
3. **Colours only from `C` / `SEM`** in `src/kit/theme.ts` (Binly Warm Editorial palette: paper, ink,
   oxblood signal, evidence green, theory plum, caution mustard + their families). Allow colour props
   with on-palette defaults. No new hue families, no saturated primaries, no neon.
4. **Flat vector look:** bold clean silhouettes, colour blocking, flat shade shapes on the side away
   from light (light comes from the upper-left unless a prop says otherwise), rounded joins.
   NO gradients over large areas (they band), NO noise/grain/texture fills, NO blur filters.
   Depth = layered flat shapes + flat low-opacity shapes for light (see `LightPool` in fx.tsx).
5. **Animated by props:** expose the useful dials (`p` for build-on, `open`, `level`, `phase`, `walk`, …)
   so builders can animate without editing the component. Idle life (breathing, flicker, drift)
   should be available via a `t` prop where it makes sense.
6. **clipPath / mask ids must be unique per instance** — derive them from a required `id` prop or
   from position/size props.
7. **Readable at 1080p**: strokes ≥ 3px at scale 1, text ≥ 22px.
8. **Typed props + JSDoc on every export** (one line: what it is, origin, size at s=1, key props).
9. Keep each file self-contained (import only from react, ./theme, ./anim, ./stage, ./text, ./fx).

## Workflow
- Showcase every component on its gallery page `src/gallery/pages/<page>.tsx` (export name already
  fixed there) — lay components out in a grid with small captions (`Kicker`), animate them over
  0–4 s so a still at t=4 shows the settled state.
- Check: `node tools/check.mjs` (typecheck + determinism lint; only errors in YOUR files matter
  if others are editing in parallel).
- Look: `node tools/still.mjs --comp Gallery --props "{\"page\":\"<page>\"}" --at 4` then Read the PNG in
  `.cache/stills/`. Also check a mid-animation time (e.g. `--at 1.5`). Fix anything ugly, cramped,
  off-palette, misaligned or noisy. Iterate until it looks like professional editorial animation.
- Finally document the module in `docs/kit/<module>.md` (API reference used by video builders, merged
  into docs/KIT.md): per component — name, one-line purpose, props signature (compact TS), and a 1–3
  line usage example. Be concise: builders read this instead of the source, so it must be accurate.
