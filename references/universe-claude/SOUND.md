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
- **How it is enforced** (tools/lib/sfx-density.mjs, Arabic only):
  - render (tools/cloud/merge-sfx.mjs): **cap 34 per any 60 s** (the reference's hook rate; the smallest auto sounds —
    ticks, pops, swishes — give way first, the most crowded first, so it thins evenly; booms, stamps, risers and story
    sounds never drop) · **silence after the last word** (+0.4 s).
  - before the render: `node tools/sfx-scan.mjs` prints SOUND DENSITY — **QUIET** (> 3.6 s of speech with no sound) and
    **LOW** (a minute under 24/min, the hook under 30/min). Fix with a visual beat that carries its sound; a held, silent
    moment on purpose is fine (note it).
