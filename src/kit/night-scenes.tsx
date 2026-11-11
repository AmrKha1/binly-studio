// NIGHT SCENES — how AZTIKA scenes JOIN, like the reference (owner 2026-11-11: "no harsh animation, ease in and out, the
// viewer must feel good"). Measured: the reference has only 2–4 hard cuts per minute; scenes FLOW into each other — a
// soft ≈ 0.25 s dissolve while the new scene settles in (MOTION.md §8), the old one drifting forward as it leaves — and
// the picture is never still (a slow push ≈ 0.35 %/s, MOTION.md §3). Our first reel cut 39×/min and flashed a full-frame
// stripe wipe at every section: that was the harsh part. So:
//   <NightShots t={t} shots={[
//     {start: 0, render: (t) => <Board t={t}/>, drift: false},                    // has its own camera
//     {start: 7.5, render: (t) => <Screen t={t}/>},                                // default join = 'match'
//     {start: 21, render: (t) => <History t={t}/>, in: {kind: 'wipe'}},           // a CHAPTER change only
//     {start: 28, render: (t) => <Hero t={t}/>, carry: {at: 'start', from: {x: 300, y: 600, s: 0.5}, to: {x: 960, y: 430, s: 1},
//       render: (x, y, s) => <g transform={`translate(${x} ${y}) scale(${s})`}>…the object…</g>}},
//   ]} hud={(t) => <HostTrack … />}/>
// Joins: 'match' (default · dissolve + settle) · 'dissolve' (softer, no zoom) · 'wipe' (StripeWipe — once per chapter) ·
// 'flash' (a hard cut hidden under the white flash — a slam/reveal) · 'cut' (only when motivated: a punchline).
// Every shot DRIFTS by itself (pushT from its start) unless `drift: false` (scenes with their own camera). The outgoing
// scene never vanishes: it fades out while drifting forward (an eased exit). `hud` = what is pinned to the SCREEN across
// shots (the host, a chapter title) — it never moves with a scene's camera.
import React from 'react';
import {clamp01, ease, lerp, pushT, settleT} from './anim';
import {Flash, StripeWipe} from './night-fx';
import {cueSfx} from './sfx';

export type NightJoin = 'match' | 'dissolve' | 'wipe' | 'flash' | 'cut';
export type NightShot = {
  start: number;
  render: (t: number) => React.ReactNode;
  in?: {kind: NightJoin; dur?: number};
  /** the slow push-in focus (default: frame centre) · false = the scene has its own camera */
  drift?: false | {cx?: number; cy?: number; rate?: number};
  /** an object that FLIES from the old scene into its place in this one during the join (the reference's match-move) */
  carry?: {from: {x: number; y: number; s?: number}; to: {x: number; y: number; s?: number}; render: (x: number, y: number, s: number) => React.ReactNode; dur?: number};
};

export const JOIN_DUR: Record<NightJoin, number> = {match: 0.28, dissolve: 0.4, wipe: 0.47, flash: 0, cut: 0};

const world = (s: NightShot, t: number) => {
  const node = s.render(t);
  if (s.drift === false) return node;
  const d = s.drift ?? {};
  return <g transform={pushT(t, s.start, d.cx ?? 960, d.cy ?? 540, d.rate ?? 0.0035)}>{node}</g>;
};
// the new scene's entrance: the reference's measured settle (settleT: 1.53× → 1.00, most of it in 0.3 s, MOTION.md §8)
const settle = (t: number, start: number) => settleT(t, start);
// the old scene's exit: it drifts forward a little as it fades — never a dead stop
const leave = (u: number) => {
  const z = 1 + 0.05 * ease.in(u);
  return `translate(960 540) scale(${z}) translate(-960 -540)`;
};

export const NightShots: React.FC<{t: number; shots: NightShot[]; hud?: (t: number) => React.ReactNode}> = ({t, shots, hud}) => {
  let i = 0;
  for (let k = 0; k < shots.length; k++) if (t >= shots[k].start) i = k;
  const cur = shots[i], prev = i > 0 ? shots[i - 1] : undefined;
  const kind = cur.in?.kind ?? (i === 0 ? 'cut' : 'match');
  const dur = cur.in?.dur ?? JOIN_DUR[kind];
  const u = dur > 0 ? clamp01((t - cur.start) / dur) : 1;
  // the wipe covers the frame from start − dur/2: the cut hides under it
  const wipeNext = shots[i + 1]?.in?.kind === 'wipe' ? shots[i + 1] : undefined;
  let body: React.ReactNode;
  if (prev && u < 1 && (kind === 'match' || kind === 'dissolve')) {
    if (kind === 'match') cueSfx('whoosh', `join-${cur.start}`, true, 960, {at: cur.start, hit: dur * 0.5});
    const a = ease.inOut(u);
    body = (
      <>
        <g opacity={1 - a} transform={kind === 'match' ? leave(u) : undefined}>{world(prev, t)}</g>
        <g opacity={a} transform={kind === 'match' ? settle(t, cur.start) : undefined}>{world(cur, t)}</g>
      </>
    );
  } else {
    body = kind === 'match' && prev ? <g transform={settle(t, cur.start)}>{world(cur, t)}</g> : world(cur, t);
  }
  const c = cur.carry;
  let carried: React.ReactNode = null;
  if (c && prev) {
    const cd = c.dur ?? Math.max(0.35, dur + 0.12);
    const k = ease.inOut(clamp01((t - cur.start + 0.05) / cd));
    if (k < 1) carried = c.render(lerp(c.from.x, c.to.x, k), lerp(c.from.y, c.to.y, k), lerp(c.from.s ?? 1, c.to.s ?? 1, k));
  }
  // marks the join window for tools/layout-scan.mjs (two scenes overlap here BY DESIGN — not a layout problem)
  const joining = (prev && t < cur.start + Math.max(dur, 0.5)) || (wipeNext && t >= wipeNext.start - JOIN_DUR.wipe / 2);
  return (
    <>
      {joining && <g data-lb-join="1" />}
      {body}
      {carried}
      {hud?.(t)}
      {kind === 'flash' && prev && <Flash t={t} at={cur.start} />}
      {kind === 'wipe' && prev && t < cur.start + JOIN_DUR.wipe / 2 && <StripeWipe t={t} at={cur.start - JOIN_DUR.wipe / 2} />}
      {wipeNext && t >= wipeNext.start - JOIN_DUR.wipe / 2 && <StripeWipe t={t} at={wipeNext.start - JOIN_DUR.wipe / 2} />}
    </>
  );
};

/** SMOOTH SPEED (owner 2026-11-11: "fast is okay, harsh is not — always ease in and out"): move from `from` to `to`
 * starting at `at`, eased in AND out, never faster than the eye can follow — the time is at least 0.2 s + distance/2000 px
 * (a 400 px hop ≥ 0.4 s, crossing the frame ≥ 0.75 s), however short `dur` is asked. Returns the position now.
 *   const [x, y] = move(t, 22.5, [1560, 1000], [1260, 1000]); */
export const minMoveDur = (dist: number) => 0.2 + dist / 2000;
export const move = (t: number, at: number, from: [number, number], to: [number, number], dur = 0, fn = ease.inOut): [number, number] => {
  const d = Math.max(dur, minMoveDur(Math.hypot(to[0] - from[0], to[1] - from[1])));
  const k = fn(clamp01((t - at) / d));
  return [lerp(from[0], to[0], k), lerp(from[1], to[1], k)];
};
/** the same rule for one value (a scale, an angle, a single coordinate) */
export const moveTo = (t: number, at: number, from: number, to: number, dur = 0, fn = ease.inOut) => move(t, at, [from, 0], [to, 0], dur, fn)[0];
