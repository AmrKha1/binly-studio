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
- Collage with many prints + two-line credits fills the board; prefer ≤ 4 prints when every print has label + long credit.
- Gallery tiles are rendered at 25%; check text sizes on full-res stills (`node tools/still.mjs`), not on the catalog sheet.

## medieval-bathing (2026-10-15)
- (owner) NO image with any nudity, not even croppable (bath art, Adam/Eve, flagellants, Dürer syphilis sheet, near-nude patients) → animate those scenes; also check every caption is literally true (a "Rue des Étuves" sign turned out to be Lagny, not Paris).
- (owner) Don't open the live preview; show contact sheets for the style check.
- Builders default Tags/labels to ~26 px → unreadable at 1080p; put "Tags ≥ 34, Kickers ≥ 30, inside SAFE, in clear space" in every brief.
- Kit hat 'scholar' renders as a modern mortarboard — use 'hood'/'beret'/'coif' for medieval scholars.
- One shared builder (opus) for 4 motif pieces first, then chapters: worked well; a 4-chapter usage-limit pause was recovered with SendMessage, nothing lost.
- upload-pack's auto logline may invent numbers ("150 years") and captions keep ASR slips — always proofread description.md + captions.srt against the script.

## Kit backlog (medieval-bathing)
- ListShot layout='column' + kicker → kicker overlaps the title (template bug; worked around by dropping kickers).
- `BathSign` (hanging sign + bath emblem + lantern) was rebuilt in C01/C02/C05/C06/C07 → promote to kit/env.
- HeroTub clip ids derive from seed+x+y → two instances at the same spot collide; use a per-instance id.
- tools/sheet.mjs now uses a per-run tiles folder (parallel builders used to overwrite each other's tiles).
- tools/compile-shots.mjs now compiles archival templates (KenBurnsShot, AnnotatedImageShot, MontageShot, …).
- (polish, kit) Text "vibrating in place" = breathe's micro rotation/zoom noise + hinted text rendering → glyphs snapped differently every frame. Fixed in kit/stage.tsx: breathe is translation-only and Stage uses text-rendering: geometricPrecision. Measure, don't guess: render consecutive frames (tools/still.mjs) and compare text vs shape centroids.
- (kit) Remaining text "vibration" = Skia snaps axis-aligned glyph baselines to whole pixels (1 px sawtooth vs shapes on slow drifts). Fixed in Stage: constant 0.1° tilt on text/foreignObject.ktext. Measure with tools/jitter-test.mjs (--kit / --at / --mp4); a snap shows as ~1 px residuals.
- (polish, owner) Bath scenes: a figure is either a bather IN a tub (head + shoulders only) or a standing person fully in front of / behind the tub — never drawn behind a tub front with legs showing below it ("people wearing barrels").
- (polish, owner) A plain parchment + 2 small icons in the hook read as "cheap" → rebuilt as archive shelf → illuminated manuscript with two painted miniatures. Hook beats need a place, depth and light.

## inner-voice (2026-10-16)
- ASR can silently drop a cold open (here 0–7.4 s: cue.mjs times were wrong, transcript started mid-hook). Check the first words with `cue.mjs --range 0 10` + an RMS loudness map of the WAV; time the hook by hand; add the missing lines to captions.srt.
- Builders still default to 25–30 px labels and small elements in big empty frames; a COMMON.md brief per video (visual language + "verify text on full-res stills" + no-shimmer rule) cut fix rounds. Kit NameTag sub is fixed 22 px → use a big local name plate.
- QA "near-empty" warnings were real: templates/cards entering ~1 s late on blank paper. Set template `at` ≤ shot start + 0.2 s; custom shots must have content on their first frame.
- Text jitter verified on the cloud mp4 with tools/jitter-test.mjs --mp4 (0.22–0.28 px residual on a drifting card vs 0.6–0.94 px snap before). Long-term option: text as vector outlines + lint against raw <text>.
- (owner) Every on-screen text rock-steady — in PLAYBOOK owner prefs.

## Kit backlog (inner-voice)
- `NightRoom` (shared/NightRoom.tsx: night room, window city, flat lights behind the figure) was copied into 3 chapters before being shared → promote with DecoderRig.
- C02 `Street` walkers + `MiniBubble` (crack dial) and C03 `Bub` (bubble holding child shapes, solid/dashed) are reusable.
- Kit StudyCard / NameTag / Photo credit text sizes too small for 1080p (22 px) → add a size dial.
