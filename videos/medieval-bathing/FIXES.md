# FIXES · medieval-bathing · polish round 1 (owner notes + self-review)

## KIT (whole video) — DONE by director
- Text shimmer/vibrating in place (owner, e.g. 1:33): camera breathe added micro rotation + zoom noise every frame and text used default (hinted) rendering → glyphs snapped differently each frame. Fixed in `src/kit/stage.tsx`: breathe is translation-only; Stage svg uses `text-rendering: geometricPrecision`. Measured at 93.00–93.12 s: text now moves monotonically with the scene (before: back-and-forth steps up to 0.2 px).

## C01
- S2 (6.94–14.82): remove the "ILLUSTRATION" kicker top-left (owner). — director, one-line.

## C05 (owner: "fix the people fitting into the bath")
- S8/S9 (351.78–367.18), packed Bathhouse: standing figures are drawn BEHIND the tub fronts while their feet stand in front → they look like they are wearing the barrels. Rule: every figure is either (a) a bather INSIDE a tub — only head + shoulders (+ arms on the rim) visible above the water, body hidden by the tub front, or (b) standing on the floor — fully visible, drawn in FRONT of the tubs if its feet are lower (closer) than the tub base (y≈900), or fully BEHIND the tub (feet above the tub base, smaller scale) and never overlapping a tub's body. No legs visible under a tub. Keep it crowded (12+ people) but spread standing people into the gaps between/around tubs and the bench.
- S9: the dashed mustard "might be sick" outlines are rough rectangles behind the tubs → draw them as rounded dashed outlines hugging the 3 chosen figures, in front, and only on clearly visible figures.
- S11 (375.01–382.32): check the door/steam view — same rule for any figures seen inside.

## C02
- S5 (83.66–88.44): the speech bubble at 87.5 is empty — two bubbles with small icons (e.g. `speech`/`cup`-like flat icons, or bread + cup) as in the brief; check bathers sit IN the tub (head/shoulders only) and the plank/cups don't float through faces.
- S4 (79.8–83.6): same tub rule as C05 for any standing/bench figures.

## C01 · polish round 2 (owner: "0:07–0:14 looks cheap — make scene 2 stronger")
S2 (6.94–14.82) REBUILD as a signature beat (opus quality). No real-looking quotes, no readable fake text.
- 6.94–9.3 "It's sitting right there in the historical record" (cue 8.20): open CLOSE on a lamp-lit archive shelf — rows of thick old book spines (leather, gold bands, varied heights), dust in the lamp light, slow camera drift right; at 8.2 ("historical record") ONE thick manuscript slides out toward camera.
- 9.37 ("Physicians…"): the book lands open on a dark desk under the lamp (push-in): an ILLUMINATED MANUSCRIPT spread — paper-cream pages, gold/oxblood border vines, a big red-and-blue initial on each page, two columns of script-like ink squiggle lines (unreadable), a tiny generic physician figure in a margin roundel.
- 11.82 ("both things at once"): on the LEFT page a painted miniature (flat Binly style, framed like a medieval miniature) draws on: the warm wooden tub, steam rising, herbs, a green check — caption under it in Fraunces "a cure"; ~0.4 s later on the RIGHT page the SAME tub miniature but ink night, plum steam curling down, mustard warning — caption "a danger". This mirrors the hook's split tub.
- 13.88 ("same document"): camera pulls back to the whole open book; a gold ribbon/oxblood bracket arcs across the spine connecting both miniatures + Tag "Same document" (size ≥ 38). Hold alive (lamp flicker, dust, page edge lift) to 14.82.
- Keep the hand-off into S3 (iris) working. Light: warm lamp pool, deep ink-brown surroundings; oxblood only on the bracket.
