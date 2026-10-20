// AUTO SOUND EFFECTS (owner, 2026-10-20: "sound on every movement — heard and felt, never fighting the voice").
// Kit components call cueSfx() while they render. In normal rendering this is a no-op (pure, deterministic). The scan
// tool (tools/sfx-scan.mjs) renders the whole video to markup frame by frame with a collector installed and turns every
// rising edge (an element starting to appear / a moment starting) into a timed cue → videos/<slug>/sfx/_auto.json.
// Story sounds (cash, door, crowd …) are still written by hand in videos/<slug>/sfx/<chapter>.json and win over auto cues.
import {isAr} from './lang';

export type SfxCue = {kind: string; key: string; pan: number; sustain?: boolean; gain?: number};
let COLLECT: ((c: SfxCue) => void) | null = null;
/** scan tool only */
export const setSfxCollector = (fn: ((c: SfxCue) => void) | null) => {
  COLLECT = fn;
};
/**
 * Register a sound for this frame. `active` = the element is (starting to be) visible / the moment is happening; the cue
 * fires on its rising edge. x = element centre (world px) → stereo pan. sustain = the sound lasts while active (count,
 * scribble). key must be stable for this element across frames (kind + position + text is enough).
 */
export const cueSfx = (kind: string, key: string, active: boolean, x = 960, opts: {sustain?: boolean; gain?: number} = {}) => {
  if (!COLLECT || !active) return;
  const pan = Math.max(-0.6, Math.min(0.6, ((x - 960) / 960) * 0.6)) * (isAr() ? -1 : 1);
  COLLECT({kind, key: `${kind}|${key}`, pan, ...opts});
};
