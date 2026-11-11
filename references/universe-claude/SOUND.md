# SOUND — every sound effect of «وش أغلى شيء في الكون؟», measured (2026-11-10)

How it was measured (not guessed): the reference audio was split in the cloud (sealed, Demucs htdemucs_ft) into the
narrator and everything else; `tools/ref-sfx.mjs` then found every AUDIBLE effect (within 30 dB of the voice, after
removing the voice's faint leak per frequency band), typed it from its sound (attack, length, deep/mid/bright balance,
noise vs tone, sweep), measured its level the way the ear weighs it, and matched it to the frame and the words
(`node tools/watch.mjs separate` → `node tools/ref-sfx.mjs <ref> [--list]`; the stems and lists stay local). Numbers below = the
final run (exact 10 ms frames; an early run drifted 0.23 % late and was redone).
Checked by eye: spectrograms of the effects layer + frame sheets per type; the known moments were all found
(mystery-box boom 0:06.9, the rising whoosh into the stripe wipe 0:08.4, «أنت!» boom 0:15.6, the diamond 1:51.2,
the «تم البيع» stamp 3:17.7). The old rule ("sound only on big moments", from 12 sampled moments) was WRONG.

## 1. The headline numbers
- **≈ 23 audible effects per minute** (333 in 14:47). Hook 0–60 s: **34/min**; then 14–32/min (median ≈ 22) to the end. It never
  goes quiet for long: a sound every ~2.6 s on average — the video feels alive because things you SEE also SOUND.
- **Level: median 21 dB under the voice** (ear-weighted peak vs the narrator's speech level). Loudest 10 % ≈ 12 dB
  under (the big booms; the diamond reveal ≈ 6 dB under). Quietest 10 % ≈ 29 dB under (ticks, pops) — felt more than
  heard. **Effects are NOT ducked** under speech (≈ 1 dB louder over speech than in pauses) — instead, while the voice
  speaks, they carry almost nothing in the mid band where words live (the shimmer's mid share 0.02 over speech vs 0.13
  in pauses; pops 0.37 vs 0.57): deep + bright, never in the voice's way.
- **Only 17 % sit on a cut.** Sounds follow THINGS (an element appears, lands, glows, grows), not edits.
- **Mono-centred** (stereo width 0.06): no wide panning.
- **A small signature set, reused**: one shimmer used 21×, one boom 12×, one whoosh 11×, one swish 5×, one ding 4×.
- **No music.** **Silence after «في أمان الله»** (0 effects after 14:44).

## 2. The sound map — what is on screen → which sound, how loud (dB under the voice, median)
| type (share) | level | length | what triggers it in the reference |
|---|---|---|---|
| **boom** — deep hit with a tail (20 %) | **18** (big reveals 6–12) | 0.4 s (reveal tails to 3 s) | the mystery box appearing · the podium jumping when a newcomer arrives · a stamp («تم البيع», «انسرقت!») · huge numbers («61.7 تريليون», «70 مليون إنسان») · ✖ marks · the «أنت!» slam · the diamond reveal (long tail) |
| **thump** — short deep knock (13 %) | 25 | 0.07 s | something LANDS: a podium block, a map region filling, coins on a belt, a calendar card, a city skyline settling |
| **shimmer** — airy sparkle (14 %) | 21 | 0.2 s | precious / glowing things: diamond, money pile, Mona-Lisa spotlight, the palace, Antilia, Earth, the magnifier, the recap row |
| **pop** (9 %) | 28 | 0.1 s | pills, tags and headline words popping in («45 مليون $», «ليش؟», «بس اصبر!»), the host stepping in, year badges |
| **riser** — builds up (8 %) | 19 | 1.1 s | the run-up to a reveal: money counting, mystery box, the year badge «1905», the podium entering, a thesis line |
| **whoosh** (+ falling) (12 %) | 18–20 | 0.5 s | a transition, or a thing sliding / flying in: labels, a gauge, Earth rising, people circling, the stripe wipe |
| **click / tick** (6 %) | 28 | 0.05 s | small mechanics: the dots of the road-map path, a progress bar's %, a glint in the mine, diamond pieces placed |
| **impact** — broad hit (3 %) | 28 | 0.07 s | a hard accent inside a story beat |
| **ding / chime** (1.5 %) | 25 | 0.5 s | a value confirmed (the "45 مليون" settle, «غالي!») |
| **swish** (1.5 %) | 28 | 0.1 s | a paper / card flick |
| **bed / tail** (3 %) | 8–12 | 3–5 s | the long tail of the biggest reveals (sub-bass that fades) — not music |

Timing (only the effects near a cut): risers and shimmers START 130–170 ms BEFORE the cut (they lead in); booms land
~120 ms AFTER it (with the visual hit); pops ~50 ms after.

## 3. What we copy · what we add (our edit)
- **Copy:** the map above (which thing → which sound), the density (≈ 32/min hook, ≈ 20–24/min after), the levels per
  type, deep+bright not mid while the voice speaks, mono, a small reused signature set, silence after the sign-off,
  host pose swaps silent.
- **Our edit = the DEFAULT (owner picked B by ear, 2026-11-10, samples/sfx-ab):** the reference's map and levels, kept
  alive through the whole video — ≈ 26–28/min instead of dipping to 19/min in 3–7 min (the reference's pattern on our VO
  left 66 stretches of > 3.6 s with no sound; B left 7). Every board change and every newcomer gets its boom; a soft tick
  rhythm for counting numbers. The extra sounds come from VISUAL beats (a pill, label, count, path dot appearing) — never
  a filler with nothing on screen. Never louder than the reference's loudest 10 % (12 dB under).
- **Our edit — LEVEL (owner by ear, 2026-11-11):** at the reference's exact levels the effects felt too far under the
  voice (effects vs voice −21.7 dB). Chosen: **−19.2 dB** (`OWNER_LIFT` 4 in tools/lib/sound-ref.mjs, all kinds lifted
  TOGETHER, the reference's balance between kinds kept) = the LOUDEST level that keeps the PHONE RULE: on a phone speaker
  every effect stays ≥ 10 dB under the voice (ar-reel: riser 10.2, sparkle 11.5). −18 breaks it; a −15 mix put pops/dings
  2–3 dB under the voice on phones (too hot). The render's sound check compares against the lifted target AND warns on
  any kind that breaks the phone rule.
- **Every night-kit piece that appears plays its sound** (owner 2026-11-11: «الخزنة فاضية» popped in silent) —
  headline words = a smooth popup. `node tools/check.mjs` fails a timed piece with no cue (or one not marked SILENT:).
- **Samples for the owner must come from the SAME path as the render** (`SFX_MODEL=reference` for Arabic). A sample made
  with the default "classic" model was 6 dB louder than the cloud render and made the A/B misleading (2026-11-11).
- **How it is enforced** (tools/lib/sfx-density.mjs, Arabic only):
  - render (tools/cloud/merge-sfx.mjs): **cap 34 per any 60 s** (the reference's hook rate; the smallest auto sounds —
    ticks, pops, swishes — give way first, the most crowded first, so it thins evenly; booms, stamps, risers and story
    sounds never drop) · **silence after the last word** (+0.4 s).
  - before the render: `node tools/sfx-scan.mjs` prints SOUND DENSITY — **QUIET** (> 3.6 s of speech with no sound) and
    **LOW** (a minute under 24/min, the hook under 30/min). Fix with a visual beat that carries its sound; a held, silent
    moment on purpose is fine (note it).

## 4. The reference's TONE — why raw library sounds feel harsh, and the finish we give ours (2026-11-10)
The owner heard the first real CC0 recordings as "harsh for the ears". Measured against the reference's own effects
(1/3-octave spectrum, start, tail), the reference's sounds differ from raw library files in three ways:
| | reference | raw library files |
|---|---|---|
| start | blooms in, 75–600 ms (never a click) | instant, 0–10 ms |
| top | rounded: ding/riser 20–40 dB down above 10 kHz, nothing sharp at 3–4 kHz | piled at 12–16 kHz and 3–4 kHz |
| tail | rings in a room, 0.6–1 s (shimmer, ding) | dry, 0.1–0.4 s |
Two exceptions found by typing the result with `ref-sfx` (it must read as the reference's type): the **shimmer stays
airy** (air share ≈ 0.6, so no dark top — only the low knock is removed), and the **riser stops dry** into the hit (a room
tail turns it into a falling whoosh). `node tools/audio/sfx-finish.mjs <in> <out> --type shimmer|ding|riser|hit` applies
this.
**OWNER PICK (2026-11-10, by ear, A/B on his voice): the CODE-MADE shimmer (sparkle), riser and ding stay** — he chose
them over the best finished CC0 recordings (Freesound 703288 / 828163 / 627794, kept local only). Measured, the code-made
shimmer and ding already have the reference's bloom and ~1 s ring (attack 160 ms / tail 820 ms; ding tail 1015 ms).
The real recordings for boom, thump, pop, tick, whoosh and swish (Kenney, qubodup) stay as they are.
**Any new real sound:** finish it, type it (ref-sfx on the file alone), calibrate (make-audio + `ref-sfx --cues`), then
listen next to the old one before it replaces anything.

## 5. SYNC — the sound's PEAK on the frame where the thing LANDS (measured 2026-11-10)
Each of the reference's effects was matched to the motion around it (frame differences at 60 fps, clean isolated
movements only): whooshes peak ON the fastest moment of the motion (0 ms) · risers END on the reveal (+17 ms) · booms
peak ≈ 130 ms and shimmers ≈ 150 ms after the movement starts = the frame a pop-in reaches full size (the podium's
spring lands at exactly +0.13 s). Before this, our sounds were placed by their START at the element's first frame:
booms peaked 280 ms late, sparkles 165 ms late, whooshes 120 ms early, the riser faded out before its reveal.
**Now:** every night-kit cue passes `{at, hit}` (exact start + its own landing delay, from its entrance curve: popIn over
d s lands at ≈ 0.19·d, the 0.16 s stamp slam at 0.16, a card flip edge-on at its middle, a wipe at its fastest middle);
the scanner uses the exact time (not the 30 fps frame); the Arabic mixer puts each sound's PEAK on that time (risers
build to their peak at 75 % and peak on the reveal). Custom pieces: pass `at` + `hit` the same way (docs/kit/night.md).
Also fixed: the scanner could not measure text in plain Node, so every frame with a Stamp/pill/label lost ALL its sounds
(tools/sfx/layout-stub.ts).

## 6. PHONES + the sound check (measured 2026-11-10)
Most viewers hear the video on a phone speaker (almost nothing under ~350 Hz). Through a phone model, the reference
keeps 276 of its 333 effects audible: bright/mid sounds get ≈ 4–5 dB LOUDER vs the voice, booms lose only ≈ 4 dB (they
have a mid body), thumps vanish (felt, not heard). Ours: booms −23 dB, impacts −22 dB = gone on phones. The Arabic mixer
now adds a phone layer per cue until it translates like the reference (deep hits: their low part soft-saturated into
400 Hz–4 kHz harmonics; air sounds: their own presence 600 Hz–6 kHz) — full-range levels unchanged. Result on a phone
vs the reference: boom +5.7 (+4.3) · impact +3.9 (+2.7) · whoosh −1.6 (−4.3) · swish −1.2 (−5.9) dB — all audible.
Calibration is done with each kind ALONE (12× each, 6 s apart): a dense mix flatters quiet kinds (pop/tick read 1.5 dB
too loud there) — all kinds now within 0.3 dB of the reference in isolation.
**Every Arabic render checks itself:** `tools/audio/sound-qa.mjs` (render stems job) measures our SFX stem against the
voice with the reference's ruler, full range AND phone, plus density B → a "Sound effects vs the reference" table and
warnings in the QA report (a kind > 2 dB off, lost on a phone, a phone drop > 3 dB worse than the reference, > 5 quiet
stretches, sound after the last word). Targets live in ONE place: tools/lib/sound-ref.mjs.
