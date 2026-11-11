import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Shot, Shots, Transition} from './shots';
import {isAr} from './lang';
import {Stage} from './stage';
import {NightScreen} from './night';
import {Flash, StripeWipe} from './night-fx';
import {JOIN_DUR, type NightJoin} from './night-scenes';
import {clamp01, ease} from './anim';
import {cueSfx} from './sfx';

/** What every video folder (src/videos/<slug>/index.tsx) exports as `active`. */
export type VideoModule = {
  meta: {slug: string; title: string; duration: number; audio?: string; lang?: string};
  Video: React.FC<{t: number}>;
};

/** One chapter of a video: a pure function of absolute time t, active from `start`. */
export type ChapterDef = {
  id: string; // "C01"
  start: number; // seconds (absolute video time)
  end: number; // seconds — informational (next chapter's start wins)
  C: React.FC<{t: number}>;
  /** transition FROM the previous chapter INTO this one. English: the white kit's kinds (kit/shots). Arabic: the night
   *  joins (match · dissolve · wipe · flash · cut — kit/night-scenes); white kinds are mapped to the closest night join. */
  in?: Transition | {kind: NightJoin; dur?: number};
};

// Arabic: the white kinds mean the same intent in the night look (owner 2026-11-11: chapters FLOW like the reference)
const NIGHT_OF: Record<string, NightJoin> = {match: 'match', dissolve: 'dissolve', fade: 'dissolve', wipe: 'wipe', dip: 'wipe', ink: 'wipe', flash: 'flash', cut: 'cut', whoosh: 'match'};
const Overlay: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Stage bg="transparent">
    <NightScreen>{children}</NightScreen>
  </Stage>
);
// the reference's join, on whole chapter pages: the old page drifts forward and fades, the new one dissolves in and
// settles from 1.53× (settleT, MOTION.md §8); the stripe wipe hides a chapter turn; the flash hides a slam cut
const NightChapters: React.FC<{t: number; chapters: ChapterDef[]}> = ({t, chapters}) => {
  let i = 0;
  for (let k = 0; k < chapters.length; k++) if (t >= chapters[k].start) i = k;
  const cur = chapters[i], prev = i > 0 ? chapters[i - 1] : undefined, next = chapters[i + 1];
  const kind: NightJoin = prev ? NIGHT_OF[cur.in?.kind ?? 'match'] ?? 'match' : 'cut';
  const dur = cur.in?.dur ?? JOIN_DUR[kind];
  const u = dur > 0 ? clamp01((t - cur.start) / dur) : 1;
  const settle = 1 + 0.53 * Math.exp(-Math.max(0, t - cur.start) / 0.135);
  const nextWipe = next && NIGHT_OF[next.in?.kind ?? 'match'] === 'wipe';
  const page = (c: ChapterDef, style?: React.CSSProperties) => <AbsoluteFill style={{overflow: 'hidden', ...style}}><c.C t={t} /></AbsoluteFill>;
  let body: React.ReactNode;
  if (prev && u < 1 && (kind === 'match' || kind === 'dissolve')) {
    if (kind === 'match') cueSfx('whoosh', `chapjoin-${cur.start}`, true, 960, {at: cur.start, hit: dur * 0.5});
    const a = ease.inOut(u);
    body = (
      <>
        {page(prev, {opacity: 1 - a, transform: kind === 'match' ? `scale(${1 + 0.05 * ease.in(u)})` : undefined})}
        {page(cur, {opacity: a, transform: kind === 'match' ? `scale(${settle})` : undefined})}
      </>
    );
  } else body = page(cur, kind === 'match' && prev ? {transform: `scale(${settle})`} : undefined);
  return (
    <>
      {body}
      {kind === 'flash' && prev && t < cur.start + 0.5 && <Overlay><Flash t={t} at={cur.start} /></Overlay>}
      {kind === 'wipe' && prev && t < cur.start + JOIN_DUR.wipe / 2 && <Overlay><StripeWipe t={t} at={cur.start - JOIN_DUR.wipe / 2} /></Overlay>}
      {nextWipe && t >= next.start - JOIN_DUR.wipe / 2 && <Overlay><StripeWipe t={t} at={next.start - JOIN_DUR.wipe / 2} /></Overlay>}
    </>
  );
};

/** Top-level timeline: chapters in order, with their entry transitions (Arabic → the night joins). */
export const Chapters: React.FC<{t: number; chapters: ChapterDef[]}> = ({t, chapters}) => {
  if (isAr()) return <NightChapters t={t} chapters={chapters} />;
  const shots: Shot[] = chapters.map((c) => ({start: c.start, in: c.in as Transition | undefined, render: (tt: number) => <c.C t={tt} />}));
  return <Shots t={t} shots={shots} />;
};
