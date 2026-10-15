import {clamp01, lerp} from '../../../kit/anim';

/** Hex-in, hex-out colour mix (kit mixHex returns rgb(), which cannot be mixed again). */
export const mix = (a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const m = (s: number) => Math.round(lerp(ch(pa, s), ch(pb, s), clamp01(k)));
  return '#' + [m(16), m(8), m(0)].map((v) => v.toString(16).padStart(2, '0')).join('');
};

/** Fractional part, always in [0,1). */
export const frac = (x: number) => x - Math.floor(x);

export type P2 = [number, number];
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Catmull-Rom smooth path through points (open or closed). */
export const smooth = (pts: P2[], closed = false) => {
  const n = pts.length;
  if (n < 2) return '';
  const get = (i: number): P2 => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    d += ` C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return closed ? d + ' Z' : d;
};
