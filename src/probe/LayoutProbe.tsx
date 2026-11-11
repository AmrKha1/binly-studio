// LAYOUT PROBE (tools/layout-scan.mjs, owner 2026-11-11: "no overlapping things"). Renders the active video exactly like
// Main and, once each frame is laid out, logs the REAL on-screen box of every tagged piece (kit/stage `lb()`: text ·
// object · head · host · bubble) with its visible opacity — measured by the same browser engine that renders the video,
// so camera moves, zooms, the right-to-left mirror and scene joins are all exact. Tooling only: never in a video.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {active} from '../active';
import {FPS} from '../kit/theme';
import {setLang} from '../kit/lang';

export const LayoutProbe: React.FC = () => {
  setLang(active.meta.lang);
  const frame = useCurrentFrame();
  const ref = useRef<HTMLDivElement>(null);
  const V = active.Video;
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const out: [string, number, number, number, number, number][] = [];
    root.querySelectorAll('[data-lb]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      let o = 1;
      for (let n: Element | null = el; n && n !== root; n = n.parentElement) o *= +(getComputedStyle(n).opacity || 1);
      out.push([el.getAttribute('data-lb') ?? '?', Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), +o.toFixed(2)]);
    });
    const join = root.querySelector('[data-lb-join]') ? 1 : 0;
    console.log(`LB|${frame}|${join}|${JSON.stringify(out)}`);
  });
  return (
    <AbsoluteFill ref={ref}>
      <V t={frame / FPS} />
    </AbsoluteFill>
  );
};
