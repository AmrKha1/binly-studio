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

### Storytelling, not documentary (channel owner's decision, 2026-10-14)
Binly videos are gripping YouTube storytelling with a balanced-to-brisk rhythm — never a slow, reverent documentary.
This overrides the "documentary" wording in `brand/` (music included: cinematic and atmospheric, but driving the story).

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
- **Palette = WHITE MODE, elegant glow** (`src/kit/theme.ts`, owner 2026-10-20): CLEAN WHITE #FFFFFF background (never
  cream/off-white); dark scenes ONLY when the scene is naturally dark (night, a dark room, space). Ink #2B2420 for text;
  **gold #B07D0C = the key accent** (key word, big number) and it always glows softly (GLOW.gold); oxblood #8B2E1F =
  warnings / signal only; evidence green #2F5233, theory plum #5C4A72, caution
  mustard #B8860B for meaning. Tints/shades within these families are fine; NO new hue families, no
  saturated primaries, no neon, no candy pastels. Each video may lean its emphasis (a dark tense story may
  sit more in ink panels; a warm historical one in paper/wood), recorded in the plan.
- Flat vector, bold clean silhouettes, colour blocking, layered depth, flat shade shapes on the side away
  from the light, light as flat low-opacity shapes. **Elegant glow, never neon:** the kit's soft halos only (GLOW filters,
  GlowPill, Halo, Sparkles) on the few things that matter in a frame (key word, big number, hero object, pills); cards
  lift off the white with a soft shadow (GLOW.soft). No noise/grain/texture, no glow on everything. Allowed polish (owner 2026-10-21): soft gradient skies and gentle
  shading in generated art; a camera-focus DEPTH blur (kit/asset Depth) on a foreground host/object or on the plate in a
  close-up — only for ~5–10 special shots per video (dialogue, reveals), never on text or the whole frame.
- **THE LOOK — clean, polished, modern (owner 2026-10-21), for EVERYTHING on screen (Flow art AND code-drawn elements,
  hosts, icons, charts, text):** bright clean frames — white or light neutral grounds, clear daylight, crisp thick black
  outlines, clean flat colours with light simple shading, a few strong accents (one hero element may glow). Cartoon is
  fine when it is the polished modern kind (like the reference frames in docs/art/references/) — never the cheap kind.
  NEVER: yellow/sepia/orange casts, brown-beige "old paper" mood, muddy or dark frames (dark only when the story is
  literally at night/underground), heavy vignettes, over-saturated or neon colours, flat lifeless grey, crude/wobbly
  shapes, thin scratchy lines, clip-art. If a code-drawn piece (old kit rooms/streets/props) looks dated or murky next to
  the generated art, use generated art or white mode instead. Judge every contact sheet with this list.
- **Big characters, mostly close and medium shots** (phone viewers): a host or story character's face fills ~⅓ of the
  frame in close shots; wide shots only to establish a place. Generated art is checked on the --phone sheet too.
- Typography (owner 2026-10-21): **Poppins Black** (geometric, bold, clean — picked by the owner from a test page; Arabic = Baloo Bhaijaan 2) for
  headlines/quotes/numbers/pills AND labels/kickers/tags — one font, normal case, normal letter spacing, no italics
  (the old tracked capitals / Fraunces italics are retired). All text is heavy (800–900) with a clean halo + soft
  drop (Stage applies it automatically) so it pops on any background; big moments use PopText / glow / stickers. Rare accent only: Caveat
  handwriting (`HandNote`) for a scribbled note on an image/document — never titles or body text. Certainty labels look
  like museum captions (`Tag`, default); myth-busting verdicts use the editor's red pen (strike + handwritten verdict);
  for the climax verdict the same red pen at hero size (full-screen claim, heavy strike, big handwritten verdict). Ink on paper or
  paper on ink — never mid-tone on mid-tone. Inside SAFE margins (96 px). Readable at 1080p.
- Each scene has ONE clear focal point (scale, contrast, negative space). No collisions of text/objects.
- Variety without changing art direction: alternate environment / character / concept / diagram scenes.
  Recurring motifs only when they connect ideas. Don't make every scene a dashboard or a slide.
- Reference images in `brand/references/` = shape language & mood only, never literal colours.

### Real archival images (channel owner's decision, 2026-10-14)
Real images (paintings, manuscripts, documents, historical photos, real objects) are a **first-class tool**: use **as many
as the video truly needs** — no fixed limit. History/art/medicine topics may be image-rich; topics with no free images
(recent science) stay animated. Animation remains Binly's identity: images are edited **like a top YouTube storyteller-editor** and woven together with animation (animated overlays on images, images inside animated worlds, zooms from
animation into evidence and back) — never a slideshow of static pictures. Every image moves with meaning (Ken Burns
toward the detail that matters, punch-ins on cue, montage cut on the rhythm of the narration, collage, compare, document
scan) — see the archival templates in docs/KIT.md. ONLY free licences via `tools/photo.mjs` (public domain, CC0, CC BY,
CC BY-SA) with credit — never other sources, never "just a few seconds" of a copyrighted image. Images of violence,
death, persecution or real victims: only when the narration is about them, briefly, framed, respectfully, never as a gag.
Every used image is listed in `videos/<slug>/CREDITS.md` → the YouTube description.
**YouTube-safe (protects ads and reach):** no visible nudity — no genitals, bare breasts or nude bottoms on screen, even in
old art (medieval bath scenes often have them): pick another image, or crop/pan/frame so only clothed or non-revealing
parts show at every moment of the move. Nothing sexual or suggestive, no graphic gore or close-up wounds/corpses. The
thumbnail and title stay fully clean. When unsure about an image, don't use it — there is always another.

### Arabic videos (one Studio, two channels — owner, 2026-10-20)
- A video is Arabic when its `video.json` has `"lang": "ar"` (auto-detected from an Arabic script by new-video.mjs).
  Same Binly look (white mode, gold glow, pills); the kit switches automatically: every font → **Baloo Bhaijaan 2 heavy**
  (rounded bold — the owner's pick; hand notes → Marhey), no letter-spacing, no italics, and the whole layout is MIRRORED
  right-to-left (lists, timelines, arrows, comparisons read right→left). Photos and maps keep their real orientation.
- **Language guard:** check.mjs fails if an Arabic video shows English sentences or ODDESTORY, or an English video shows
  Arabic or AZTIKA. Names/places in Arabic letters ("راسل هيرلبرت"), digits stay 123.
- Write ALL on-screen text in Arabic (titles, pills, labels, chapter titles in chapters.json). Numbers in Western
  digits (123) exactly as spoken. Same visual stories — only the words change.
- Speech timing uses the multilingual large-v3 model (slower: start ingest early). Formal Arabic times best.
- **The Arabic channel is "ازتيكا" (Aztika) and has a HOST: Aztika, the Aztec storyteller (kit/host, owner 2026-10-20).**
  He is the narrator talking to the viewer, on every topic: he appears in MOST of the video but not everywhere —
  the hook, the explaining moments, reactions, chapter turns, the ending — standing at the side of the frame and pointing
  at / presenting / reacting to the story elements. MODERATE, MEANINGFUL animation (owner 2026-10-20): alive and natural —
  breathing, sway, head tilt, nods while talking, gestures gliding between poses, expressions, blinks, lip movement
  (talkFrom + src/videos/<slug>/speech.ts) — but never popping/bouncing around without a reason. How much, where, which
  poses, whether a pose change makes a sound and whether he mirrors in RTL: the video director decides per video/shot
  (`life` 0–2, `sfx`, `mirror`, kit/motion wrappers for a jump-in or a tada). He is the guide; the visuals still tell it.
  **He is NOT a fixed full-body figure:** vary the framing like a real presenter — full body, waist-up, head-and-shoulders
  close-up for reactions, peeking in from an edge, tiny in a wide scene — and MOVE him (walk across, slide in from the
  side, rise from below, step aside to reveal) wherever it helps the viewer follow and keeps them watching.
  **He never just appears or vanishes:** when he joins a scene that is already running he ARRIVES with an animation
  (pop, slide in from a side, rise, drop, peek, walk in) and leaves with one; after a cut he may already be there, but a
  small settle-in is usually nicer for the eye. Which animation and when: the director decides (`enter`/`exit`).
  **Control (keeps cost + mistakes low):** use the built-in poses, faces, framings and entrances; never hand-animate his
  body inside a chapter. A video MAY add a FEW new poses/faces to kit/host if the story really needs them (at most ~2–3 per
  video, added to the kit + tested with kit-test, then free for every later video). He never covers key text or the
  object being explained.
  English videos: the host is **ODDESTORY** (black suit + tie, spiky black hair with orange tips, white face and hands) —
  same role, same rules. Both hosts are REAL ILLUSTRATED POSE IMAGES (owner 2026-10-21: the code-drawn cartoon looked
  cheap) shown with kit/image-host: `<ImageHost who="oddestory" poses={[[t, 'pose'], …]} …/>`. Poses live in
  public/_hosts/<who>/ (list: src/kit/host-images.ts; ODDESTORY 27 poses, 10 full body). AZTIKA's image sheet is coming;
  until then the code-drawn kit/host AZTIKA is the fallback. New poses: generate a white-background sheet (Nano Banana
  Pro, same character reference), `node tools/cutout.mjs <sheet> --out public/_hosts/<who> --names a,b,c`, then
  `node tools/host-manifest.mjs` — at most ~2–3 new poses per video.

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

### Channel owner's preferences (grows with every video — follow them like rules)
One line each, added when the owner states a preference (style check, polish notes). Only lasting preferences,
not one-off fixes. Keep ≤ 15 lines: merge similar ones.
- WHITE MODE + ELEGANT GLOW (both channels, 2026-10-20): clean white pages, gold glowing key word/number, glowing
  rounded pills (GlowPill) for labels, hero objects glow (soft halo + a few twinkling sparkles). Reference: the owner's
  pick in .cache/arabic-font-test.html (A3). Dark only when the scene itself is dark.
- Sources in the YouTube description as plain text (author, title, year — searchable), no links. Links only where an
  image licence requires them (CC BY / BY-SA); public-domain/CC0 image credits are text only.
- Every frame reads on a small phone AND stays calm on a TV (YouTube watch time ≈ ⅓ TV, ⅓ phones, ⅓ computers). Text:
  the shot's key word/line ≥ 72 px · text the viewer must read (labels, tags, names) ≥ 48 px · secondary text ≥ 36 px ·
  only image credits / source notes may be 26 px (legibility rule: 16–22 arc-minutes; 32 px was too small on phones).
- NO image that contains any nudity anywhere (not even bare torsos or loincloth figures) — never "crop it safe"; drop
  the image and animate the scene (bath scenes = animated, clothed figures). Only free-licence images, always credited.
- Hook beats (first ~30 s) are rich, layered signature scenes (a real place, depth, light, a camera move) — never a
- Every on-screen text is rock-steady (no shimmer/vibration): no noise, wobble, micro-rotation or pulsing scale on text; text moves only with eased entrances and the camera.
  plain object/document on a flat backdrop with small icons (owner: "looks cheap").

## 6. Sound
- **NO MUSIC** (owner, 2026-10-20): the voice + sound effects only. Never add music, score.json moods or music tracks.
- **SOUND EFFECTS ON EVERY MOVEMENT** (owner, 2026-10-20): like a top YouTuber's edit — every pop-up, label, card,
  slide, count, slam, transition and object is HEARD and felt, so the video feels alive in every second. Clearly
  audible — a short sound peaks clearly but under the voice (median ≈ 11 dB under; owner-tuned, inside the usual 10–18 dB editing range) — yet it steps aside for the words: a small duck + a dip in the voice band
  while the narrator speaks, so they never mask a syllable. Two layers:
  1. **Auto** — every kit animation cues its own sound (pills pop, text swishes, cards swoosh, numbers tick-count and
     ding, SlamTitle hits, every shot change whooshes). The cloud render scans the video (tools/sfx-scan.mjs) → no
     hand work. Custom-drawn elements call `cueSfx()` so they sound too.
  2. **Story** — the meaning sounds by hand in `videos/<slug>/sfx/<chapter>.json`: cash, coins, door, crowd, impact,
     bell, footsteps, power-up, error … these win over auto cues at the same moment.
  Real CC0 recordings (library/sfx: Kenney packs, qubodup swooshes) replace code-made sounds automatically.

## 7. Delivery standard
1920×1080, 16:9, constant 60 fps, H.264 MP4, AAC 320k, duration = voiceover exactly. Verified on the real
rendered file (cloud QA). Never claim a check passed unless it was performed. Report limitations honestly.
