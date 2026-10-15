# inner-voice · shared components (build FIRST, in `src/videos/inner-voice/shared/`)
Video: "the voice in your head" — inner speech is **language with the sound taken out**. Visual language of the
whole video: SPOKEN sound = solid ink (waveforms, speech bubbles); the INNER voice = the same shapes drawn as
**dashed theory-plum** (C.theory / C.theoryLight on ink) — like kit `Bubble kind='inner'`. Mind interiors sit on ink /
kit `MindSpace`. Oxblood only for the one key beat. Flat vector, no gradients/blur/grain, Binly palette only.
Every component: kit-style dials (x, y, s, p, t, tone 'paper'|'ink', seed …), pure function of t, deterministic,
nothing hard-coded for one shot — future videos (psychology, language, brain topics) should reuse them by changing props.
Show all four on a test sheet (several prop states each) and check with `node tools/sheet.mjs`.
Text inside components ≥ 30 px at s=1; labels ≥ 34 px.

## 1. `SilentWave.tsx` — the signature motif
A speech waveform of a phrase (syllable bursts, like kit `Waveform kind='speech'` but built from bars/segments so it
can be restyled). Props: `x y w=900 amp=90 t p (draw-on L→R) seed`
`silent: 0→1` — morph from SOUND (solid ink line/bars, `color`) to SILENT (same shape, dashed plum outline, slightly
lower amplitude, faint plum glow shapes — "the shape remains, the sound is gone"); during the morph the dashes appear
along the line left→right like the sound draining out.
`words?: string[]` — optional labels under the syllable groups (e.g. ['chitty','chitty','bang','bang']), revealed with p.
`flat: 0→1` — collapse to a flat line (nothing vibrated).
`ghost?: {offset, silent, color}` — optional second wave drawn on top (for "forecast vs real sound" comparisons:
`match: 0..1` — 1 = perfectly overlapping, 0 = visibly different shape), `tone`.
Live: bursts gently scroll/pulse with t (unless p<1).

## 2. `ThoughtContent.tsx` — what is in a mind at one moment
Renders ONE kind of mental content inside a round window (origin = centre, radius `r=150`): `kind`:
- `'words'` — a short dashed-plum inner-speech line `text` (e.g. "Next, colour.") typing on with p.
- `'image'` — a small flat picture (a house + tree + sun, simple, warm) fading in like a memory.
- `'feeling'` — a warm pulsing soft blob with 2–3 concentric flat rings (oxTint/caution family).
- `'awareness'` — the room: chair + lamp + window outline in thin ink strokes, lamp light pool.
- `'wordless'` — a bright plum dot with a dashed halo and NO words/picture (the "unsymbolized thought"); a dashed
  empty frame around it reads "something, but not words or image".
- `'empty'` — nothing, faint dashed circle.
Props: `x y r p t kind text? tone 'paper'|'ink' frame?: 'circle'|'card'|'none' label?: string (caption under it, Inter
caps ≥ 30) seed`. Use it alone, inside bubbles, or inside a head window.

## 3. `Beeper.tsx` — the experience-sampling beeper
A 1990s pager (dark plastic body, small grey LCD, one button, belt clip), 3/4 front. Origin = centre, ≈260×170 at s=1.
Props: `x y s r p t beepAt?: number[]` (each beep: LCD flashes, 3 plum/oxblood rings pulse out, small shake)
`lcd?: string` (e.g. "BEEP" or "NOW"), `tone`. Exported helper `beepFlash(t, beepAt)` → 0..1 so shots can freeze/flash
the frame on a beep.

## 4. `DecoderRig.tsx` — the brain–computer interface scene (used in the hook, the middle and the ending)
A seated person in profile (kit `Person`/`HeadProfile` — generic, respectful, adult, wheelchair visible), with an
implant on the motor cortex (kit `HeadProfile implant` look), a cable to a desktop monitor on the right showing:
a waveform strip + a text line that types out `text` (`typeP` 0→1) + an optional small `badge` (e.g. "98%").
Props: `x y s t text typeP signal (0→1 plum pulses travel head→cable→screen) badge? badgeP? lock?: 0..1 (a small
padlock on the screen corner closes/opens = the user-held password) mouth?: 'still' (default) thought?: string[] (dashed
plum words floating inside/above the head, revealed by thoughtP) thoughtP night?: bool (dim room, screen glow LightPool)
layer?: 'all'|'back'|'front'`. Room: simple modern clinical/home room, night variant lit by the screen.
Must read as "a person thinks silently; the computer types it" in one second at 1920×1080.

Register all four in docs/ASSETS.md (one line each with dials) when done. Report: file names, props, any limits.
