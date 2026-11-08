# STYLE BIBLE — the AZTIKA look (copied from «وش أغلى شيء في الكون؟»)

Owner decision 2026-11-08: **safe mode — copy this video's style as it is.** Our fingerprint = AZTIKA (the host) + small
touches of our own. Everything below was MEASURED from the video (tools/watch.mjs color / zoom / strip / hits), not guessed.
Times = where to look (`node tools/watch.mjs frames universe-claude --at <t>`). Pixel sizes are for 1920×1080.

## 1. Text — the most important detail
Every on-screen word is built from 4 layers (back → front):
1. **Soft colour glow** — the text's own colour, blurred ~24–30 px, ~45 % opacity (gold glow behind gold, white/cyan
   glow behind white). On dark backgrounds it is clearly visible as a haze.
2. **Thick dark outline** — ~10–12 px (≈ 7 % of the font size), near-black at ~65 % opacity, so it reads dark-brown on
   gold areas and dark-navy on blue ones. Drawn on the OUTSIDE and inside holes (the inside of "0" is dark too).
   Round joins. (zoom 2:05.0 box 1330,330,170,120)
3. **Fill** — flat colour with a soft top→bottom gradient:
   - white text: #FFFFFF → #D8D8E0 (light grey at the bottom/edge) — never pure flat white
   - gold text: #FCC018 (measured) → #F2B010
   - $ sign / units sometimes in light grey #C4C5CC (2:05, 0:21.8)
4. (on rays/glow scenes only) a faint inner light at the top edge.

**Font:** very heavy, rounded Arabic display face (rounded terminals, wide counters). The Studio's Baloo Bhaijaan 2 at
weight 800 is the closest we have — confirm in the copy test (side-by-side); if it falls short, find a closer heavy
rounded Arabic font. Digits are the same heavy rounded style.
**Sizes:** hero word / number 150–180 px font (0:16.4 «أنت!», 2:05 «3,106»); headline 120–140 px (0:26.2 «أنت غالي!»);
secondary line 100–130 px (2:05 «قيراط»); pills 40–48 px text.
**Colour rule:** white words + ONE key word in gold (0:26.2: «أنت» white, «غالي!» gold). Numbers that are the point = gold.
**Placement:** headlines top-right (RTL start), objects centre, host bottom-left. Text never covers the object.

## 2. Pills (labels)
Fully rounded capsule, height ≈ 1.6× text size, padding ≈ 0.8× text size left/right, bold dark text.
- **Gold pill** (current / hero value): #F5C223 with a lighter top #F2CA50 (subtle vertical gradient), text #2A1A00,
  soft gold outer glow ~20 px. (0:26.2 «45 مليون $»)
- **White pill** (previous value): #FFFFFF → #ECECF2, text #1A1A2E, soft white glow.
- **Grey pill** (small / old value): #D9D9E3, smaller, text #3A3A4A (2:30 «45 مليون $» next to the big ones).
- **Cyan pill** (category/topic on science/teal scenes): #57D9FA → #34D2FA, text #04212B, cyan glow. (0:21.8 «قيمة أعضاء جسمك»)
- Year badge: black rounded rectangle #141414, 4 px gold border #FCC018, gold digits 120 px + gold glow; small gold pill
  «سنة» on top edge, white pill (place) on the bottom edge (0:40.5).

## 3. Colours (measured)
| what | colour |
|---|---|
| space sky top / middle | #0F062B → #181944 (sides #1D0B30) — deep indigo-purple, NOT black |
| floor horizon line | #8A4AF2 bright purple + glow above/below (~12 px) |
| floor grid area | #1E0D48 with purple perspective grid lines (low opacity, fading to the horizon) |
| podium green | front #139F66 · left light facet #39B17E · right dark side #0E8351 · top #4EB081 · green glow |
| gold (text, pills, rays) | #FCC018 / #F5C223 |
| science / body scenes | dark teal #02131F → #0E3B4A with a faint square grid + cyan glow #57D9FA |
| rays scene (gold) | centre #8B5805 → edges #2B1A01, alternating ray wedges, dark vignette |
| sunset scene | orange-peach sky with big soft rays + clouds, dark plum city silhouette #2A1020 |
| paper map | beige #E9DDBB with soft paper texture, green land hex #8CC65E, dotted red route |

## 4. Glow & light
- Everything important glows in its own colour: text, pills, objects (cyan glow behind the body 0:21.8), the host
  (yellow rim line + soft gold glow), even story people (thin gold rim, 0:45).
- **Rays** behind hero moments: 16–24 wedges, slowly rotating, two shades of the scene colour, strong vignette (0:16.4).
- **Particles:** slow floating bokeh dots (gold on rays, cyan on science) + 4-point sparkle stars that twinkle.
- **Reveal burst:** when an object appears: a thin gold ring expands from it and fades (~0.5 s) + sparkles spray out (0:25.2).
- Stars in the space sky: small white dots + a few 4-point sparkles, some twinkle.

## 5. Motion (measured frame by frame)
- **Word-by-word headlines:** each word pops in on its spoken word: scale 0.3 → 1.08 → 1.0 in ~150 ms (spring with a
  small overshoot) (0:25.5–25.6). Never typewriter.
- **Pills / bubbles:** pop from the speaker/object: scale 0 → 1.1 → 1.0 in ~150 ms (bubble 0:45.1–45.2).
- **Glow pulse:** while text holds, its glow breathes slowly (brightness ±15 %).
- **Count-up numbers:** fast, ease-out, ~1–1.5 s (100 → 3,106 at 2:00.4); the year badge counts DOWN year by year
  (1506 → 1503, ~0.1 s per step, 0:40.0) = "going back in time".
- **Camera:** slow constant drift/zoom (never fully still); a fast **punch-in** on the key line just before a scene ends
  while other elements fly out (0:27.4).
- **Transitions:** (a) whoosh exit: everything flies off + empty sky with speed streaks for 2–3 frames (0:27.8);
  (b) diagonal gold/orange stripe wipe (0:09.0); (c) white flash on big reveals.
- **Stamps** («تم البيع», «مو الأغلى»): slam in from 1.5× scale with a small shake (3:16, 3:47).
- **Characters** change pose on their line (arm out when they speak, 0:45.2) — pose swaps, not walking.

## 6. Sound (measured — I can't hear the music, the owner can)
- Voice is king: speech ≈ −32 dB RMS; music in pauses only reaches ≈ −53 dB → **music ~20 dB under the voice**, barely
  audible, a bed.
- **Sound effects** sit on visual events: biggest hits (+30…+46 dB jumps) at the speech-bubble pops (0:45.0, 0:46.8,
  0:48.4), year badge (0:40.2), diamond reveal (1:50.8), big reveals at cuts. Pattern: every pop/slam/reveal = a SFX;
  plain word pops = no SFX or a very soft one.
- Silence after the last word («في أمان الله») — no outro music.
- Pace of speech: ≈ 121 words/min, short pauses (99 pauses ≥ 0.3 s).
- (Owner to describe: music style/mood, and which effects sound like what.)

## 7. Characters
- Host (theirs; ours = AZTIKA): full body, bottom-left, ~45 % of frame height, thick dark outline + yellow rim light +
  soft gold glow. Poses: point, thumbs-up, shrug, point-at-viewer (0:16.4 centre on rays = "you!").
- Story people: faceless round heads, ONE identifying hat, flat colours, thin gold rim. Stylised rooms with one warm
  window light shaft.

## 8. Our fingerprint (small, on top of the copy)
- AZTIKA replaces their host everywhere they use him (same size, place, rim light, glow).
- Optional owner-approved touches later: jade stepped-pyramid podiums, the glyph-stone mystery box, sun-stone rays.
