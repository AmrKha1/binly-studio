# Binly Playbook — the rules every video follows
Condensed from the channel's source documents in `brand/` (Main prompt, PRODUCTION_CORE, VISUAL_STYLE,
color_system). If anything here seems to conflict with them, `brand/` wins. Read this once per session.

## 1. What Binly is
English animated curiosity/storytelling channel: humans, science, history, psychology, culture, the world.
Story-driven 2D flat-vector animation + editorial motion graphics, selective 3D-looking moments only when
they clearly help. Craft reference: **Kurzgesagt's technique** (clean silhouettes, colour blocking,
purposeful camera through layered worlds, clear visual metaphors) — never their palette, characters or motifs.
Goal: a video a curious viewer genuinely enjoys from first to last second. Not a slideshow, not unrelated
AI images, not generic templates. "Technically flawless but dull" = failed.

## 2. Source of truth (hard rules)
- The supplied voiceover is the final narration and the master clock. Never rewrite, trim, stretch, denoise,
  normalise, EQ, compress or reorder it. Music/SFX are separate layers; the voice stays loudest and clear.
- **Never invent facts, figures, quotes, studies or evidence.** Visual metaphor is allowed; label
  reconstructions as such. If a claim can't be shown confidently, use a neutral/conceptual visual.
- **Numbers on screen = exactly what is spoken** (0.061 percent → "0.061%", never rounded or re-derived).
- Real people (historical/scientific figures) appear as respectful generic stylised figures + `NameTag`;
  no attempt at a real likeness. No permanent mascot, logo, HUD, watermark, timecode, scene numbers.
- No burned-in full subtitles. Short editorial headlines/labels/key phrases only, when they add value.

## 3. How Binly scripts work (plan around this)
- **Rhetorical-question pivots** ("So where does the fear come from?", "Which brings us back to…") are
  narrative beats → give each a visual turn: reveal, camera move, composition or colour shift.
  The visual structure tracks the argument's structure (a chain of reveals, not a timeline).
- **Certainty levels are explicit** ("still debated", "a model, not a settled fact") → use the semantic
  colours deliberately: green = confirmed/evidence, plum = theory/speculation/inference,
  mustard = caution/debated/limits. Not decoration.
- **Precise statistics** appear often → `Stat`, `DotGrid`, `PercentRing`, `BarChart` with exact values.
- **Mostly non-character-driven** → environments, conceptual imagery, diagrams, editorial graphics; real
  figures appear briefly. Don't invent a character for every scene. A recurring character only if the
  narration benefits (e.g. "picture two people sitting in the same room").

## 4. Look (VISUAL_STYLE + color_system)
- **Palette = Warm Editorial on paper** (`src/kit/theme.ts`): paper #EDE4D3 default background; ink #2B2420
  for text/dark panels/night interiors; oxblood #8B2E1F = the ONE most important beat per scene (title
  reveal, key stat, realisation) — never decoration; evidence green #2F5233, theory plum #5C4A72, caution
  mustard #B8860B for meaning. Tints/shades within these families are fine; NO new hue families, no
  saturated primaries, no neon, no candy pastels. Each video may lean its emphasis (a dark tense story may
  sit more in ink panels; a warm historical one in paper/wood), recorded in the plan.
- Flat vector, bold clean silhouettes, colour blocking, layered depth, flat shade shapes on the side away
  from the light, light as flat low-opacity shapes. **No gradients over large areas, no noise/grain/
  texture, no blur** (they band or look dirty after encoding). Output must be perfectly clean.
- Typography: Fraunces (serif) for headlines/quotes/numbers, Inter caps for labels/tags. Ink on paper or
  paper on ink — never mid-tone on mid-tone. Inside SAFE margins (96 px). Readable at 1080p.
- Each scene has ONE clear focal point (scale, contrast, negative space). No collisions of text/objects.
- Variety without changing art direction: alternate environment / character / concept / diagram scenes.
  Recurring motifs only when they connect ideas. Don't make every scene a dashboard or a slide.
- Reference images in `brand/references/` = shape language & mood only, never literal colours.

### Real archival images (approved by the channel owner, 2026-10-13)
Flat vector stays the main style. Real images are used as **evidence moments** where they add truth: a real
document, the real painting/manuscript of the event, a real object or historical photo — framed inside the animated
world (`Photo` component), usually with the warm `paper` tint. ONLY free licences via `tools/photo.mjs` (public
domain, CC0, CC BY, CC BY-SA) with credit; never images from other sources, never "just a few seconds" of a
copyrighted image. Handle images of violence, death, persecution or real victims with restraint and respect: show them
only when the narration is about them, briefly, framed, never as a gag. Every used image is listed in
`videos/<slug>/CREDITS.md` for the YouTube description.

## 5. Motion
- Every move has a purpose: advance the story, create curiosity, clarify, reveal a relation/contrast/
  cause, set place/time/stakes, make a discovery satisfying.
- Smooth: eased moves (cubic in-out for camera, out for entrances), no jitter/popping/snapping, no
  constant bouncing, overshoot only for things that "land". Never a dead static frame: if a frame holds,
  something subtle lives (camera breathe, particles, blink, light flicker) — and hold a strong image only
  as long as the idea needs to land, then move on.
- Transitions are motivated (match cut, camera move, shape/colour continuity, ink/iris to enter an idea);
  hard cuts only when motivated. No fade-up-everything habit.
- Pace follows the narration: quick decisive moves for punchy lines, calm holds for big ideas. New visual
  information roughly every 3–6 s; a meaningful change of composition at every pivot.

## 6. Sound
- Music: original, cinematic-atmospheric, evolves with the story (not one loop), recedes under dense
  narration, swells at reveals/emotional beats, ~20 dB under the voice while it speaks (audible, never
  competing). Set by `videos/<slug>/score.json` (moods per section + accents).
- SFX: sparse, subtle, precisely timed to meaningful visual events (stamp lands, card slides, door, bell,
  a dramatic pause) — "I sense that happened", never "I noticed a sound effect". ~22 dB under voice peak,
  generated from `videos/<slug>/sfx/<chapter>.json`. Never one on every movement.

## 7. Delivery standard
1920×1080, 16:9, constant 60 fps, H.264 MP4, AAC 320k, duration = voiceover exactly. Verified on the real
rendered file (cloud QA). Never claim a check passed unless it was performed. Report limitations honestly.
