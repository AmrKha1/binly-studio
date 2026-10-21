import React from 'react';
import {Img, staticFile} from 'remotion';
import {Enter, EnterKind, Exit, ExitKind, Attention, AttentionKind} from './motion';

/**
 * ImageAsset — a generated illustrated element (Nano Banana via Flow, cut out with tools/cutout.mjs) living in
 * public/<slug>/el/<name>.png. Centre at (x, y), width w (height from the image's aspect `ar` = width/height).
 * Wrap motion with `enter` / `exit` / `attention` (kit/motion presets, each with its own sound) or animate x/y/scale/rot.
 */
export const ImageAsset: React.FC<{
  slug: string; name: string; x: number; y: number; w: number; ar: number; t?: number;
  enter?: {kind: EnterKind; p: number}; exit?: {kind: ExitKind; p: number}; attention?: {kind: AttentionKind; at: number};
  rot?: number; s?: number; o?: number; flip?: boolean;
}> = ({slug, name, x, y, w, ar, t = 0, enter, exit, attention, rot = 0, s = 1, o = 1, flip = false}) => {
  const h = w / ar;
  let el: React.ReactNode = (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${(flip ? -1 : 1) * s} ${s})`} opacity={o}>
      <foreignObject x={-w / 2} y={-h / 2} width={w} height={h}>
        <Img src={staticFile(`${slug}/el/${name}.png`)} style={{width: w, height: h, display: 'block'}} />
      </foreignObject>
    </g>
  );
  if (attention) el = <Attention kind={attention.kind} t={t} at={attention.at} x={x} y={y}>{el}</Attention>;
  if (exit) el = <Exit kind={exit.kind} p={exit.p} x={x} y={y}>{el}</Exit>;
  if (enter) el = <Enter kind={enter.kind} p={enter.p} x={x} y={y} id={name}>{el}</Enter>;
  return <>{el}</>;
};

/**
 * BgPlate — a generated full-frame background scene (Flow, illustrated, EMPTY: no characters/objects/text) at
 * public/<slug>/bg/<file>. Fills the frame (cover) with a slow camera move so the world never freezes:
 * push 'in' (default) | 'out' | 'left' | 'right' | 'none', over [a, b] seconds. dim 0..1 darkens it slightly so
 * cut-out elements on top pop (0.08 default). Put elements on top in the SAME coordinates: wrap them in
 * <PlateCam t a b push>…</PlateCam> to move them with the plate.
 */
const plateCam = (t: number, a: number, b: number, push: 'in' | 'out' | 'left' | 'right' | 'none', amount: number) => {
  const k = Math.max(0, Math.min(1, (t - a) / Math.max(0.1, b - a)));
  const e = k * k * (3 - 2 * k);
  if (push === 'none') return {s: 1, dx: 0};
  if (push === 'in') return {s: 1 + amount * e, dx: 0};
  if (push === 'out') return {s: 1 + amount * (1 - e), dx: 0};
  return {s: 1 + amount * 0.6, dx: (push === 'left' ? 1 : -1) * (e - 0.5) * 1920 * amount * 0.8};
};
export const PlateCam: React.FC<{t: number; a: number; b: number; push?: 'in' | 'out' | 'left' | 'right' | 'none'; amount?: number; cx?: number; cy?: number; children?: React.ReactNode}> = ({t, a, b, push = 'in', amount = 0.06, cx = 960, cy = 540, children}) => {
  const c = plateCam(t, a, b, push, amount);
  return <g transform={`translate(${cx + c.dx} ${cy}) scale(${c.s}) translate(${-cx} ${-cy})`}>{children}</g>;
};
export const BgPlate: React.FC<{slug: string; file: string; t: number; a: number; b: number; push?: 'in' | 'out' | 'left' | 'right' | 'none'; amount?: number; dim?: number; cx?: number; cy?: number}> = ({slug, file, t, a, b, push = 'in', amount = 0.06, dim = 0.08, cx, cy}) => (
  <PlateCam t={t} a={a} b={b} push={push} amount={amount} cx={cx} cy={cy}>
    <g className="k-nomirror">
      <foreignObject x={0} y={0} width={1920} height={1080}>
        <Img src={staticFile(`${slug}/bg/${file}`)} style={{width: 1920, height: 1080, objectFit: 'cover', display: 'block'}} />
      </foreignObject>
      {dim > 0 && <rect x={0} y={0} width={1920} height={1080} fill="#2B2420" opacity={dim} />}
    </g>
  </PlateCam>
);

/**
 * Depth — the "camera focus" polish (owner 2026-10-21, use SPARINGLY: ~5–10 shots per video — dialogue, reveals, hero
 * moments). Wrap a FOREGROUND layer (a host or object close to the camera) to soften it: blur in px (6–14 good), optional
 * dim. Or wrap a BACKGROUND plate in a close-up so the subject pops. Animate `blur` from 0 for a rack-focus pull.
 * Blur costs render time — never on the whole frame, never on text.
 */
export const Depth: React.FC<{blur: number; dim?: number; children?: React.ReactNode}> = ({blur, dim = 0, children}) => {
  const b = Math.max(0, blur);
  if (b < 0.3 && dim <= 0) return <>{children}</>;
  return <g style={{filter: `blur(${b.toFixed(2)}px)${dim > 0 ? ` brightness(${(1 - dim).toFixed(2)})` : ''}`}}>{children}</g>;
};

/**
 * Lift — glow + depth for a hero element (owner 2026-10-21): soft coloured halo behind it, a soft contact shadow under it
 * and a gentle float, so key objects/icons/cards look polished and 3D instead of flat. Wrap anything centred at (x, y).
 *   glow: halo colour (default gold) · strength 0..1.5 · shadow: ground shadow width (0 = none, e.g. for flying items)
 */
export const Lift: React.FC<{t?: number; x: number; y: number; r?: number; glow?: string; strength?: number; shadow?: number; float?: number; children?: React.ReactNode}> = ({
  t = 0, x, y, r = 180, glow = '#E0B23E', strength = 1, shadow = 0, float = 6, children,
}) => {
  const fy = Math.sin(t * 1.3) * float;
  const k = Math.max(0, strength);
  // the glow hugs the object's own shape (coloured drop-shadows at 0 offset) + a soft lift shadow below it
  const g1 = Math.round(r * 0.06 * k), g2 = Math.round(r * 0.16 * k), d = Math.round(r * 0.07);
  const f = `drop-shadow(0 0 ${g1}px ${glow}) drop-shadow(0 0 ${g2}px ${glow}) drop-shadow(0 ${d}px ${d}px rgba(43,36,32,0.28))`;
  return (
    <g>
      {shadow > 0 && <ellipse cx={x} cy={y + r * 0.95} rx={shadow * (1 - fy / 120)} ry={shadow * 0.14} fill="#2B2420" opacity={0.2} />}
      <g transform={`translate(0 ${fy})`} style={{filter: k > 0 ? f : undefined}}>
        {children}
      </g>
    </g>
  );
};
