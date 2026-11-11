// THE REFERENCE'S SOUND, as numbers (references/universe-claude/SOUND.md, measured 2026-11-10 with tools/ref-sfx.mjs).
// One source for the mixer (tools/audio/make-audio.mjs, "reference" model) and the render's sound check
// (tools/audio/sound-qa.mjs), so what we aim for and what we check are the same thing.
// level per kind: dB UNDER the narrator's speech level (ear-weighted peak, tools/lib/ear-level.mjs) at gain 1
export const REF_TARGET = {boom: 18, slam: 15, stamp: 18, impact: 22, thump: 25, sparkle: 21, shimmer: 21, pop: 28, popup: 28, popdown: 29,
  riser: 19, rise: 19, whoosh: 19, swoosh: 19, sweep_down: 20, swish: 28, paper: 28, page: 28, tick: 28, click: 28, clack: 28,
  ding: 25, chime: 25, bell: 25, confirm: 25, neon: 26, count: 30, coins: 24, cash: 24, card: 28, blip: 28, bubble: 28,
  low_drone: 20, crowd: 24, wind: 26, fire: 26, water: 26, door: 24, footsteps: 28, glass: 25, splash: 24, rumble: 20};
// OWNER LIFT (owner, 2026-11-11): the reference's exact levels felt too far under the voice (effects vs voice −21.7 dB).
// Chosen level: −19.2 dB = lift 4 — the LOUDEST level where every effect still sits ≥ PHONE_HEADROOM dB under the voice
// on a phone speaker (measured on ar-reel: riser 10.2, sparkle 11.5). Lift 5+ (−18) puts risers/sparkles inside 10 dB on
// phones (words start to compete); the louder −15 mix put pops/dings 2–3 dB under the voice on phones (too hot).
// Every kind keeps the reference's BALANCE between kinds, all lifted together. The mixer aims for, and the sound
// check compares against, REF_TARGET − OWNER_LIFT. Don't change it without a new owner A/B.
export const OWNER_LIFT = 4;
// the phone rule: on a phone speaker every effect kind stays at least this far under the voice (words always win)
export const PHONE_HEADROOM = 10;
export const targetUnder = (kind, fallback = 24) => (REF_TARGET[kind] ?? fallback) - OWNER_LIFT;
// PHONE: how much each kind changes on a phone speaker relative to the voice in the reference (dB, + = quieter).
// Kinds not listed translate on their own (bright/mid sounds get ≈ 4–5 dB LOUDER vs the voice on a phone); thumps are
// felt, not heard, on phones — in the reference too.
export const PHONE_CHANGE = {boom: 4.3, slam: 4.3, stamp: 4.3, impact: 2.7, whoosh: -4.3, swoosh: -4.3, swish: -5.9};
// the phone speaker model used by the mixer and the check: 4th-order high-pass 350 Hz, +3 dB at 2.5 kHz, low-pass 12 kHz
export const PHONE_FILTER = 'highpass=f=350:p=2,highpass=f=350:p=2,equalizer=f=2500:t=q:w=1:g=3,lowpass=f=12000:p=2';
// heard at all: within 30 dB of the voice (quieter is masked on any speaker)
export const AUDIBLE_DB = 30;
