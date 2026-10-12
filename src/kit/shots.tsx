import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, H, W} from './theme';
import {clamp01, ease, lerp} from './anim';

/**
 * Shot sequencing + motivated transitions.
 *
 * A "shot" is a function of absolute time t that returns a full-frame element (usually a <Stage>).
 * <Shots t={t} shots={[
 *   {start: 120.0, render: (t) => <Opening t={t}/>},
 *   {start: 131.4, render: (t) => <Bathhouse t={t}/>, in: {kind: 'iris', dur: 0.9, x: 1200, y: 500}},
 * ]}/>
 * Each shot runs from its start until the next shot's start. During a transition the
 * outgoing shot keeps receiving the real t (it must hold/continue gracefully past its end).
 * Chapters are composed the same way at the top level (see video.tsx).
 */

export type TransitionKind =
  | 'cut' // hard cut — only when motivated (a slam, a reveal, a punchline)
  | 'fade' // soft cross-dissolve
  | 'dip' // dip to paper (or `color`) and back — chapter/time breaks
  | 'ink' // ink blot grows from (x,y) covering frame, then opens to next — big topic turns
  | 'iris' // next shot revealed by a growing circle from (x,y) — "zoom into this idea"
  | 'irisOut' // current shot closes to a circle at (x,y), next is behind — "step back"
  | 'push' // whole frame slides (dir) — moving along a line of thought / a timeline
  | 'paper' // next shot slides in as a paper sheet over the old one (dir)
  | 'zoom' // zoom-through: old scales up and fades as new settles from slightly small
  | 'wipe'; // straight edge wipe in `dir` with a thin ink edge

export type Transition = {
  kind: TransitionKind;
  dur?: number; // seconds (default by kind)
  x?: number; // focus point for ink/iris/irisOut (px)
  y?: number;
  dir?: 'left' | 'right' | 'up' | 'down';
  color?: string; // dip / ink colour
};

export type Shot = {start: number; render: (t: number) => React.ReactNode; in?: Transition};

const DEFAULT_DUR: Record<TransitionKind, number> = {cut: 0, fade: 0.6, dip: 0.9, ink: 1.1, iris: 0.9, irisOut: 0.9, push: 0.8, paper: 0.8, zoom: 0.8, wipe: 0.7};

const Layer: React.FC<{style?: React.CSSProperties; children?: React.ReactNode}> = ({style, children}) => (
  <AbsoluteFill style={{overflow: 'hidden', ...style}}>{children}</AbsoluteFill>
);

const dirVec = (d: Transition['dir'] = 'left') => (d === 'left' ? [-1, 0] : d === 'right' ? [1, 0] : d === 'up' ? [0, -1] : [0, 1]);

/** Renders the blend of outgoing A and incoming B at progress p (0..1). */
export const TransitionView: React.FC<{tr: Transition; p: number; a: React.ReactNode; b: React.ReactNode}> = ({tr, p, a, b}) => {
  const x = tr.x ?? W / 2;
  const y = tr.y ?? H / 2;
  const R = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 40;
  switch (tr.kind) {
    case 'cut':
      return <>{p < 0.5 ? a : b}</>;
    case 'fade':
      return (
        <>
          <Layer>{a}</Layer>
          <Layer style={{opacity: ease.inOutSine(p)}}>{b}</Layer>
        </>
      );
    case 'dip': {
      const col = tr.color ?? C.paper;
      const k = p < 0.5 ? ease.inOutSine(p * 2) : 1 - ease.inOutSine((p - 0.5) * 2);
      return (
        <>
          <Layer>{p < 0.5 ? a : b}</Layer>
          <Layer style={{background: col, opacity: k}} />
        </>
      );
    }
    case 'ink': {
      // ink blot grows over A (0→0.5), then a hole opens in the ink revealing B (0.5→1)
      const col = tr.color ?? C.ink;
      if (p < 0.5) {
        const r = ease.in(p * 2) * R;
        return (
          <>
            <Layer>{a}</Layer>
            <Layer style={{background: col, clipPath: `circle(${r}px at ${x}px ${y}px)`}} />
          </>
        );
      }
      const r = ease.out((p - 0.5) * 2) * R;
      return (
        <>
          <Layer style={{background: col}} />
          <Layer style={{clipPath: `circle(${r}px at ${x}px ${y}px)`}}>{b}</Layer>
        </>
      );
    }
    case 'iris': {
      const r = ease.inOut(p) * R;
      return (
        <>
          <Layer>{a}</Layer>
          <Layer style={{clipPath: `circle(${r}px at ${x}px ${y}px)`}}>{b}</Layer>
        </>
      );
    }
    case 'irisOut': {
      const r = (1 - ease.inOut(p)) * R;
      return (
        <>
          <Layer>{b}</Layer>
          <Layer style={{clipPath: `circle(${r}px at ${x}px ${y}px)`}}>{a}</Layer>
        </>
      );
    }
    case 'push': {
      const [dx, dy] = dirVec(tr.dir);
      const k = ease.inOut(p);
      return (
        <>
          <Layer style={{transform: `translate(${dx * k * W}px, ${dy * k * H}px)`}}>{a}</Layer>
          <Layer style={{transform: `translate(${-dx * (1 - k) * W}px, ${-dy * (1 - k) * H}px)`}}>{b}</Layer>
        </>
      );
    }
    case 'paper': {
      const [dx, dy] = dirVec(tr.dir);
      const k = ease.inOut(p);
      return (
        <>
          <Layer style={{transform: `translate(${dx * k * W * 0.18}px, ${dy * k * H * 0.18}px)`, filter: `brightness(${1 - 0.12 * k})`}}>{a}</Layer>
          <Layer
            style={{
              transform: `translate(${-dx * (1 - k) * W}px, ${-dy * (1 - k) * H}px)`,
              boxShadow: `${dx * 18}px ${dy * 18}px 0 rgba(43,36,32,${0.18 * (1 - k)})`,
            }}
          >
            {b}
          </Layer>
        </>
      );
    }
    case 'zoom': {
      const k = ease.inOut(p);
      return (
        <>
          <Layer style={{transform: `scale(${lerp(1, 1.6, k)})`, transformOrigin: `${x}px ${y}px`, opacity: 1 - ease.in(clamp01(p * 1.4))}}>{a}</Layer>
          <Layer style={{transform: `scale(${lerp(0.86, 1, k)})`, transformOrigin: `${x}px ${y}px`, opacity: ease.out(clamp01((p - 0.15) * 1.6))}}>{b}</Layer>
        </>
      );
    }
    case 'wipe': {
      const k = ease.inOut(p);
      const d = tr.dir ?? 'left';
      // B revealed from the side the motion comes from
      const inset =
        d === 'left' ? `inset(0 0 0 ${(1 - k) * 100}%)` : d === 'right' ? `inset(0 ${(1 - k) * 100}% 0 0)` : d === 'up' ? `inset(${(1 - k) * 100}% 0 0 0)` : `inset(0 0 ${(1 - k) * 100}% 0)`;
      const edgePos = d === 'left' ? {left: `${(1 - k) * 100}%`, top: 0, bottom: 0, width: 8} : d === 'right' ? {left: `calc(${k * 100}% - 8px)`, top: 0, bottom: 0, width: 8} : d === 'up' ? {top: `${(1 - k) * 100}%`, left: 0, right: 0, height: 8} : {top: `calc(${k * 100}% - 8px)`, left: 0, right: 0, height: 8};
      return (
        <>
          <Layer>{a}</Layer>
          <Layer style={{clipPath: inset}}>{b}</Layer>
          {p > 0 && p < 1 && <div style={{position: 'absolute', background: C.ink, ...edgePos}} />}
        </>
      );
    }
  }
};

/** Sequence shots with transitions. Only the active shot(s) render (cheap). */
export const Shots: React.FC<{t: number; shots: Shot[]}> = ({t, shots}) => {
  // find the last shot whose (start - half transition) <= t
  let idx = 0;
  for (let i = 0; i < shots.length; i++) {
    const tr = shots[i].in;
    const half = tr ? (tr.dur ?? DEFAULT_DUR[tr.kind]) / 2 : 0;
    if (t >= shots[i].start - half) idx = i;
  }
  const cur = shots[idx];
  const tr = cur.in;
  if (idx > 0 && tr && tr.kind !== 'cut') {
    const dur = tr.dur ?? DEFAULT_DUR[tr.kind];
    const p = (t - (cur.start - dur / 2)) / dur;
    if (p < 1) {
      return <TransitionView tr={tr} p={clamp01(p)} a={shots[idx - 1].render(t)} b={cur.render(t)} />;
    }
  }
  if (idx > 0 && tr?.kind === 'cut' && t < cur.start) return <>{shots[idx - 1].render(t)}</>;
  return <>{cur.render(t)}</>;
};
