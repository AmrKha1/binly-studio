# inner-voice · REPORT
**"The Voice in Your Head Makes No Sound"** · 9:34.8 (574.81 s) · 1920×1080 · 60 fps · H.264 + AAC · cloud render.
Final file: `videos/inner-voice/output/inner-voice-v2.mp4` (v1 kept as inner-voice.mp4). YouTube package: `videos/inner-voice/youtube/`.

## Chapters
0:00 A voice that makes no sound · 0:49 Catching the voice in the act · 2:01 What fills the silence ·
3:22 What the computer actually heard · 4:13 Your brain forecasts your own voice · 5:54 Is the voice a tool? ·
7:14 The wrong question · 8:32 The mind next to yours

## Style decisions
- Visual thesis: "language with the sound taken out" — spoken = solid ink (waveforms, speech bubbles, lines between
  people), inner voice = the same shapes in dashed plum. Mind interiors on ink/plum mind-space; outside world on warm paper.
- Recurring motifs: SilentWave (sound draining into a dashed plum wave: hook, C04, C08), the beeper freeze (C02, C03,
  C08), the BCI night room (C01, C04, C08 bookend), the line between two heads folding inward (C03, C07, final image).
- Shared pieces built for this video (registered in docs/ASSETS.md): SilentWave, ThoughtContent, Beeper, DecoderRig, NightRoom.
- Real images: Stanford Main Quad, an EEG cap, the BrainGate display (3, all free licences, credited). Researchers appear
  only as name plates.
- Owner style check on the hook: "continue + fixes" (richer room, bigger text). Owner rule added: text never shimmers.

## Text jitter (owner request)
Measured on the previous video: text held still then jumped ~0.5–1 px during slow camera drifts (Chrome/Skia baseline
snapping). Kit fix: constant invisible 0.1° tilt on text (src/kit/stage.tsx) + `tools/jitter-test.mjs`. Verified on the
cloud render of this video: residual 0.22–0.28 px on a drifting card at 1:35 (PASS; the old render measured 0.6–0.94 px).

## QA
Cloud QA of v2 (real file): duration 574.810 s = voiceover (diff 0.000 s) · 34,487 frames, constant 60 fps · voice in sync
(offset 0.0 ms, correlation 0.997) · loudness -13.8 LUFS, true peak -0.5 dBFS, music ~21 dB under speech · no static holds ≥ 4 s ·
no black segments. Near-empty warnings: 17 in v1 → 12 in v2. v1's real defects (blank paper while a card/template entered late at
1:48, 5:36, 5:42, 7:09; a stray red pen dot at 9:03) were fixed and checked on stills. The 12 remaining are intentional or sparse-but-not-blank:
ink question frames (0:42), the ink dive (3:21), the pause before the twist (7:02), the ear (8:27), and a few title-first entrances (5:41, 8:10).
All 7 QA sheets of v1 were reviewed; v2 fixes were verified on stills, not on a second full sheet review.

## Honest limitations
- The speech recogniser missed the cold open (0–7.4 s); its timing was set by hand from the audio's loudness map.
  captions.srt has the first four lines added by hand — please play the first 8 s once to confirm sync.
- Sources in description.md: two are marked (verify) and the 2025/2026 commentaries and the 2026 review are not listed
  (not named in the script) — add them from your research notes before posting.
- The jitter fix is measured on two real shots, not on every shot; the long-term "text as vector outlines" upgrade is not done.
- Polish list (not defects): the opening room is still a little mid-tone; card wall at 2:02 starts sparse; C05 venn/jigsaw
  and C07's first shot are smallish; the participant's "neutral" face has a faint smile (kit has no straight mouth).
- Owner feedback after v1: some spoken phrases have no matching visual. Confirmed: 20 shots run ≥ 10 s and cover 2–4 sentences with one setup; my review checked layout, not sentence-by-sentence sync. Not fixed in v2 → proposed /polish-video pass.
- Two render rounds used (v1 + one fix round), as the pipeline allows.
