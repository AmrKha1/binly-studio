import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp01, lerp, spring} from './anim';
import {cueSfx} from './sfx';
import {HostMove, MOVE_SFX, hostMove} from './host';
import {HOST_IMAGES, HostImageWho} from './host-images';
import {isAr} from './lang';

/** The channel's host follows the video language: English → ODDESTORY, Arabic → AZTIKA (never mixed). */
export const channelHost = (): HostImageWho => (isAr() ? 'aztika' : 'oddestory');

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ImageHost — the channel hosts as real illustrated pose images (owner, 2026-10-21): ODDESTORY (English channel) and,
// once his sheet exists, AZTIKA (Arabic channel). Pose images live in public/_hosts/<who>/<pose>.png (transparent,
// cut out with tools/cutout.mjs; names in src/kit/host-images.ts — run tools/host-manifest.mjs after adding images).
// Life comes from: a springy pop/squash on every pose switch, gentle breathing + float, a small talking bounce while
// the narrator speaks, and animated entrances/exits — moderate and meaningful, the director decides where and how.
//
//   <ImageHost t={t} who="oddestory" x={1500} y={1080} h={760}
//     poses={[[0, 'think-point'], [12.4, 'shocked'], [15.1, 'laughing']]} talk={talkFrom(t, WORDS)}
//     enter={{kind: 'slideRight', at: 0}} exit={{kind: 'sink', at: 19}} />
// (x, y) = bottom-centre of the image (waist-up poses: put y at or below the frame bottom, 1080–1120, so the cut
// waist is hidden; full-* poses: y = where his feet stand). h = displayed height of a waist-up pose in px; full-body
// poses are drawn at the same character scale automatically (≈ 1.9× taller). flip = face the other way.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

const FULL_RATIO = 1.9; // a full-body image shows the same character ~1.9× taller than a waist-up one
type PoseKey = [number, string];

export const ImageHost: React.FC<{
  t: number;
  who?: HostImageWho; // omit it: the host follows the video language (channelHost). check.mjs fails on a wrong host.
  x: number;
  y: number;
  h?: number;
  poses: PoseKey[];
  talk?: number;
  enter?: HostMove;
  exit?: HostMove;
  life?: number; // 0 still · 1 natural (default) · 2 lively
  flip?: boolean;
  swapSfx?: boolean; // a soft pop on each pose switch (default on — the director may turn it off)
  shadow?: boolean; // soft ground shadow under full-body poses (default on)
  id?: string;
}> = ({t, who: who0, x, y, h = 720, poses, talk = 0, enter, exit, life = 1, flip = false, swapSfx = true, shadow = true, id = 'ihost'}) => {
  const who = who0 ?? channelHost();
  const mv = hostMove(t, enter, exit);
  if (!mv.visible) return null;
  for (const [m, tag] of [[enter, 'in'], [exit, 'out']] as [HostMove | undefined, string][]) {
    if (!m) continue;
    const isWalk = m.kind.startsWith('walk');
    const d = m.dur ?? (isWalk ? 1.4 : 0.6);
    cueSfx(MOVE_SFX[m.kind], `${id}-${tag}@${m.at}`, t >= m.at && (!isWalk || t < m.at + d), x, {sustain: isWalk});
  }
  // current pose + how long since it switched
  let i = 0;
  for (let k = 0; k < poses.length; k++) if (t >= poses[k][0]) i = k;
  const [at, name] = poses[i];
  const sz = (HOST_IMAGES[who] as Record<string, readonly [number, number]>)[name];
  if (!sz) return null;
  if (swapSfx && i > 0) cueSfx('pop', `${id}-pose@${at}`, true, x, {gain: 0.5});
  const full = name.startsWith('full-');
  const dh = full ? h * FULL_RATIO : h;
  const dw = (sz[0] / sz[1]) * dh;
  // pose switch: a quick squash-and-stretch pop (spring), anchored at the bottom
  const u = i > 0 ? clamp01((t - at) / 0.42) : 1;
  const k = spring(u, 0.5);
  const pop = i > 0 ? lerp(0.9, 1, k) : 1;
  const over = pop - 1;
  const sx = pop * (1 - over * 0.6);
  const sy = pop * (1 + over * 0.6);
  // life: breathing, a slow float, a small bounce while talking
  const breath = 1 + Math.sin(t * 1.9) * 0.008 * life;
  const float = Math.sin(t * 1.1 + 0.4) * 4 * life;
  const talkB = 1 + talk * 0.012 * Math.min(1, life + 0.5);
  const walking = mv.walking;
  const step = walking ? Math.abs(Math.sin(t * Math.PI * 2.2)) * 10 : 0;
  const S = mv.s;
  return (
    <g transform={`translate(${x + mv.dx} ${y + mv.dy}) scale(${S})`} opacity={mv.o}>
      {full && shadow && <ellipse cx={0} cy={2} rx={dw * 0.32} ry={dh * 0.018} fill="#2B2420" opacity={0.12} />}
      <g transform={`translate(0 ${-float - step}) scale(${(flip ? -1 : 1) * sx} ${sy * breath * talkB})`}>
        <foreignObject x={-dw / 2} y={-dh} width={dw} height={dh}>
          <Img src={staticFile(`_hosts/${who}/${name}.png`)} style={{width: dw, height: dh, display: 'block'}} />
        </foreignObject>
      </g>
    </g>
  );
};

/** Ready framings for an ImageHost (1920×1080 frame): corner presenter, big close presenter, full body, peek, tiny. */
export const imageHostShot = (framing: 'corner' | 'big' | 'full' | 'peek' | 'tiny', side: 'left' | 'center' | 'right' = 'right') => {
  const X = {left: 300, center: 960, right: 1620}[side];
  switch (framing) {
    case 'big':
      return {x: X, y: 1110, h: 980};
    case 'full':
      return {x: X, y: 1040, h: 470};
    case 'peek':
      return {x: side === 'left' ? 120 : 1800, y: 1140, h: 760};
    case 'tiny':
      return {x: X, y: 1000, h: 250};
    case 'corner':
    default:
      return {x: X, y: 1100, h: 680};
  }
};
