# Generated art style (Flow / Nano Banana) — owner-approved look, 2026-10-21

Flow is a SUPPORTER, not the base: every video is complete with code-built scenes; Flow upgrades ≤ 12 chosen images.

Every generated image (background plates, element sheets, host costumes) uses the blocks below WORD FOR WORD.
The owner rejected a warm, yellow, moody result ("the colours are yellow and the atmosphere…"). The target is the
**clean, flat, evenly lit cartoon look**: easy on the eyes, neutral colours, crisp lines.

More owner-approved references (other channels, the look we aim for): docs/art/references/.
Approved example: docs/art/approved-background.jpg (use it as the reference image for new plates). Rejected:
docs/art/rejected-yellow.jpg (warm, yellow, light beams, painterly) — never this.

## Model (owner, 2026-10-21)
Always generate with **model: "Nano Banana 2 Lite"** and **max_credits: 0** (images must stay free; Flow skips any
image that would cost credits). Never use another model unless the owner says so.

## STYLE block (append to every prompt)
> Clean flat 2D cartoon illustration in the style of a modern animated explainer video. Crisp uniform black outlines on
> everything, flat colour fills with only very light simple cel shading, no texture, no grain, no painterly brushwork.
> Bright, even, neutral daylight: no colour grading, no warm or yellow or sepia tint, no orange glow, no light beams,
> no god rays, no dust, no haze, no vignette, no dramatic shadows. Natural balanced colours: clean off-white and light
> beige walls, natural wood browns, a few clear accent colours (deep red, emerald green, royal blue, gold) used
> sparingly. Soft, slightly muted colours, never over-saturated, never neon or candy-bright. Gentle soft gradients in
> skies and soft simple shading on large surfaces are fine. Polished, clean and calm. Clear readable shapes, tidy
> uncluttered composition, large readable forms (it will be watched on a phone).

## BACKGROUND block (scene plates)
> Wide 16:9 eye-level view of <PLACE>, symmetrical or calm composition, a clear open area in the <centre/lower middle>
> where characters and objects will be placed later. The scene is EMPTY: no people, no characters, no animals, no text,
> no letters, no signs, no logos, no watermark.

## ELEMENT SHEET block (cut-out objects)
> An asset sheet of 6 separate objects arranged in 2 rows of 3, in this order (left to right, top row first): <LIST>.
> Generous empty white space between them, no object touching or overlapping another, each shown whole and front-facing,
> each enclosed by a closed black outline. Background: plain pure flat white everywhere, no floor, no shadows, no
> scenery, no text, no labels, no numbers.

## Rules
- Never write "warm", "golden hour", "sunset", "cinematic lighting", "moody", "atmospheric" or "dramatic light" in a
  prompt — they cause the yellow look. Use the time of day only when the story needs it, still with flat even colours.
- Dark or night scenes only when the story is there (a dungeon, a battlefield at night, hell): same flat style, just
  darker flat colours.
- No text inside generated images (all words come from the kit). No nudity. Real people/events that the story presents
  as real → real archival images, not generated ones.
- Review every plate on a contact sheet before use; regenerate (free) any that drift yellow, textured or busy.

# NIGHT LOOK — AZTIKA (Arabic) hero objects (owner 2026-11-08: copy the model video, references/universe-claude)
The blocks above are the ENGLISH white-mode look. Arabic videos (lang "ar", or plan.json "look":"night") use the blocks
below instead — `tools/art.mjs prompts` switches automatically. Worlds (sky, map, city, room…) are built in code
(kit/night-worlds); generated art is for the HERO OBJECTS the story is about (diamond, crown, palace, painting, capsule,
money pile, land plot, car, ship…) — the glowing centrepiece of a shot. The glow, rays and sparkles are added in code
(kit/night-fx HeroObject), never painted into the image. Measured references: crown + diamonds 2:28, money pile + land
tile 3:33, palace 6:16, antimatter capsule 10:18.

## NIGHT STYLE block
> Polished, highly detailed cartoon illustration in the style of a premium mobile-game item icon or collectible sticker.
> Bold clean dark outline around the whole object and its main parts, rich saturated jewel-like colours, smooth soft
> shading with depth and volume, bright glossy specular highlights, sparkling gems and shiny metal where they belong,
> crisp tiny details. Lit evenly from the front-top, no cast shadow. Clean, premium, eye-catching, readable on a phone.

## NIGHT HERO SHEET block
> An asset sheet of 6 separate hero objects arranged in 2 rows of 3, in this order (left to right, top row first): <LIST>.
> Each object is shown whole, front-facing or as a three-quarter isometric view, centred in its cell, large, with
> generous empty white space around it, no object touching or overlapping another, each enclosed by a thick closed dark
> outline. Places and lands are shown as a small floating isometric diorama tile (a square of ground with its edge cut
> like a cake slice). Background: plain pure flat white everywhere, no floor, no shadows, no glow, no light rays, no
> sparkles in the background, no scenery, no text, no labels, no numbers, no logos, no watermark.

## NIGHT BACKGROUND block (rare — the worlds are code-built)
> Wide 16:9 view of <PLACE> at night or dusk in the same polished cartoon style, deep indigo-violet sky, calm composition,
> a clear open area in the <centre/lower middle> where objects and the host will be placed later. EMPTY: no people, no
> characters, no animals, no text, no letters, no signs, no logos, no watermark.

## Night rules
- One hero object per shot, big (35–55 % of the frame height), on a code-built world, with HeroObject glow in its own
  colour (gold for money/crowns, cyan for science/diamonds, violet for energy/mystery, green for land/nature).
- Real people/events presented as real → real archival images (kit/photo), framed like the reference (gold frame).
- Review every sheet on a contact sheet; regenerate (free) anything flat, muddy, textured or with painted glow.
