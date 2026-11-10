# Sound library — sources (all CC0 / public domain: free for YouTube, no credit required)
Files named `<kind>.ogg` or `<kind>-N.ogg` automatically REPLACE the code-made sound of that kind
(tools/audio/make-audio.mjs picks a variant per cue and levels it like every other sound).

- crowd-1.ogg — "large-crowd-medium-distance-stereo" by eguobyte — CC0 — https://commons.wikimedia.org/wiki/File:360703_eguobyte_large-crowd-medium-distance-stereo.wav
- crowd-2.ogg — "another-crowd" by unfa — CC0 — https://commons.wikimedia.org/wiki/File:211146_unfa_another-crowd.flac
- water.ogg — "water-trickle" by fractalstudios — CC0 — https://commons.wikimedia.org/wiki/File:363120_fractalstudios_water-trickle.wav
- bell_toll.ogg — "Church bells - Leverkusen, 2007" — public domain — https://commons.wikimedia.org/wiki/File:Church_bells_-_Leverkusen,_2007.oga
- page-1..3.ogg, door-1..2.ogg, coins-1..2.ogg, footsteps.ogg (10 steps joined) — "RPG Audio" by Kenney — CC0 — https://kenney.nl/assets/rpg-audio
- kenney/sci-fi-sounds/forceField_*.ogg (kind `neon`), lowFrequency_explosion*.ogg (kind `boom`) — "Sci-Fi Sounds" by Kenney — CC0 — https://kenney.nl/assets/sci-fi-sounds (downloaded 2026-11-08)
Clips were trimmed to their steadiest section, faded and encoded to Opus 96 kb/s.

## Real shimmer / riser / ding (2026-11-10) — Freesound, CC0 (no credit required), with the REFERENCE FINISH
Picked by measuring 56 CC0 candidates against the reference's own effects (references/universe-claude/SOUND.md §4),
then given the reference's finish with `node tools/audio/sfx-finish.mjs` (originals kept local, not in the repo).
- sparkle.flac — "FX_UX_quick_shimmer_reactive_08" by PLukx — CC0 — https://freesound.org/s/703288/ (--type shimmer)
- riser.flac — "Wow Rev Noise" by casperhazebeats — CC0 — https://freesound.org/s/828163/ (--type riser)
- ding.flac — "pling sound effect ui interface ding ting sound" by Leonardmedia.nl — CC0 — https://freesound.org/s/627794/ (--type ding)
