// AUTO SOUND EFFECTS (owner, 2026-10-20: "sound on every movement — heard and felt, never fighting the voice").
// Kit components call cueSfx() while they render. In normal rendering this is a no-op (pure, deterministic). The scan
// tool (tools/sfx-scan.mjs) renders the whole video to markup frame by frame with a collector installed and turns every
// rising edge (an element starting to appear / a moment starting) into a timed cue → videos/<slug>/sfx/_auto.json.
// Story sounds (cash, door, crowd …) are still written by hand in videos/<slug>/sfx/<chapter>.json and win over auto cues.
import {isAr} from './lang';

export type SfxCue = {kind: string; key: string; pan: number; sustain?: boolean; gain?: number; at?: number; hit?: number};
let COLLECT: ((c: SfxCue) => void) | null = null;
/** scan tool only */
export const setSfxCollector = (fn: ((c: SfxCue) => void) | null) => {
  COLLECT = fn;
};
/**
 * Register a sound for this frame. `active` = the element is (starting to be) visible / the moment is happening; the cue
 * fires on its rising edge. x = element centre (world px) → stereo pan. sustain = the sound lasts while active (count,
 * scribble). key must be stable for this element across frames (kind + position + text is enough).
 * SYNC (measured on the reference, SOUND.md §5): a sound's PEAK sits on the frame where the thing LANDS (pop-in reaches full
 * size, a stamp touches, a podium block settles) or, for whooshes, on its fastest moment. Pass at = the exact start time
 * (not the frame) and hit = seconds from at to that landing — e.g. popIn over d s with bounce 0.45 lands at ≈ 0.19·d,
 * spring(e/0.6, 0.3) at 0.13 s, a 0.16 s slam at 0.16 s. The Arabic mixer puts the sound's peak exactly there.
 */
export const cueSfx = (kind: string, key: string, active: boolean, x = 960, opts: {sustain?: boolean; gain?: number; at?: number; hit?: number} = {}) => {
  if (!COLLECT || !active) return;
  const pan = Math.max(-0.6, Math.min(0.6, ((x - 960) / 960) * 0.6)) * (isAr() ? -1 : 1);
  COLLECT({kind, key: `${kind}|${key}`, pan, ...opts});
};
