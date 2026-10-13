# Lessons learned (append 1–5 short lines after every video)

- (seed) Sync reveals ~0.1–0.25 s BEFORE the stressed word; exactly on the word reads late.
- (seed) Contact sheets with 20 tiles catch most layout problems; use `--times` around transitions.
- (seed) Keep chapters 60–120 s; longer chapters make builders run out of attention, shorter ones multiply overhead.

- (kit) GeoMap is the heaviest component (~2 s/frame locally, ~0.7 s in the cloud): one map per shot, keep map shots short (≤ 12 s) and avoid maps inside contact sheets with many tiles.
- (test) Sonnet builders produce good chapters from concrete briefs (≈8 min, ≈200k tokens each in their own context). Concrete beat lists with exact cue words are what makes this work.
- (test) Contact sheets render each tile as a separate still (tools/sheet.mjs) — SVG ids would collide otherwise.
- (test) Small Tags (size < 22) get hard to read at 1080p; keep labels ≥ 22 px.

## Kit backlog
- See docs/ASSETS.md (catalog of reusable pieces from past videos).
- Archival templates: CollageShot slightly left-heavy (link label can touch a print); ParallaxCutout ellipse can read as a lens; square/portrait images in full frame show only a band (use frames or MontageShot); collage credits 17 px → raise to ≥ 22 px.
- Templates: some secondary labels (counts, list captions) are ~18 px at 1080p — raise to ≥ 22 px on next kit pass.
