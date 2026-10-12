import React from 'react';
import {Shot, Shots, Transition} from './shots';

/** What every video folder (src/videos/<slug>/index.tsx) exports as `active`. */
export type VideoModule = {
  meta: {slug: string; title: string; duration: number; audio?: string};
  Video: React.FC<{t: number}>;
};

/** One chapter of a video: a pure function of absolute time t, active from `start`. */
export type ChapterDef = {
  id: string; // "C01"
  start: number; // seconds (absolute video time)
  end: number; // seconds — informational (next chapter's start wins)
  C: React.FC<{t: number}>;
  in?: Transition; // transition FROM the previous chapter INTO this one
};

/** Top-level timeline: chapters in order, with their entry transitions. */
export const Chapters: React.FC<{t: number; chapters: ChapterDef[]}> = ({t, chapters}) => {
  const shots: Shot[] = chapters.map((c) => ({start: c.start, in: c.in, render: (tt: number) => <c.C t={tt} />}));
  return <Shots t={t} shots={shots} />;
};
