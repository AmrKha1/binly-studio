// Small helpers shared by the ar-costly-mistakes pieces (night look). Not a component.
import {clamp01, ease, popRef} from '../../../kit/anim';

/** the reference's outline colour (STYLE-BIBLE: thick near-black outline on every object) */
export const OUT = '#05030F';
/** paper ink for text printed on the bill */
export const INK = '#1A1430';

/** progress 0..1 of a window that starts at `at` and lasts `d` seconds */
export const prog = (t: number, at: number | undefined, d: number) => (at === undefined ? 1 : clamp01((t - at) / d));

/** the reference pop (MOTION.md §1) for something that appears at `at` — {s, o}; 0 before `at` */
export const popAt = (t: number, at: number | undefined) => {
  if (at === undefined) return {s: 1, o: 1};
  if (t < at) return {s: 0, o: 0};
  const q = popRef(clamp01((t - at) / 0.3));
  return {s: q.s, o: q.o};
};

/** growth (podium/bar/fence) — ease.out over d s, no bounce */
export const grow = (t: number, at: number | undefined, d = 0.5) => ease.out(prog(t, at, d));

/** a gentle fade-out at `out` (0.2 s) — 1 before */
export const fadeOut = (t: number, out?: number, d = 0.2) => (out === undefined ? 1 : 1 - clamp01((t - out) / d));
