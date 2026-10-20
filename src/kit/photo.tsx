import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, FONT_SANS, FONT_SERIF} from './theme';
import {clamp01, ease, lerp} from './anim';

/**
 * Real archival image (from tools/photo.mjs — free licences only) shown INSIDE the Binly world as evidence.
 * <Photo slug="medieval-baths" src="img/tournai.jpg" x={960} y={500} w={900} h={600} p={…}
 *        frame="museum" tint="paper" pan={{a: T.x, b: T.x + 8, from: [0.5, 0.5, 1.0], to: [0.62, 0.4, 1.35]}}
 *        t={t} credit="Pierart dou Tielt · Public domain" caption="Burial of plague victims, Tournai, 1349" />
 * origin = centre of the image window. w×h = window size (image fills it, 'cover').
 * pan: slow move across the image between times a→b: [focusX 0..1, focusY 0..1, zoom] (Ken Burns, eased).
 * tint: 'paper' (warm print, fits the palette) · 'sepia' · 'ink' (dark duotone-ish) · 'none' (true colour).
 * frame: 'museum' (mat + thin frame + label) · 'print' (paper print with shadow) · 'polaroid' · 'none' (bare, full-bleed use).
 * Requires `slug` (the video folder; files live in public/<slug>/img/).
 */
export const Photo: React.FC<{
  slug: string;
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  p?: number;
  t?: number;
  rot?: number;
  frame?: 'museum' | 'print' | 'polaroid' | 'none';
  tint?: 'paper' | 'sepia' | 'ink' | 'none';
  pan?: {a: number; b: number; from: [number, number, number]; to: [number, number, number]};
  credit?: string;
  caption?: string;
  dark?: boolean; // caption/credit colours for dark backgrounds
}> = ({slug, src, x, y, w, h, p = 1, t = 0, rot = 0, frame = 'print', tint = 'paper', pan, credit, caption, dark = false}) => {
  if (p <= 0) return null;
  const k = ease.outQuint(clamp01(p));
  const o = clamp01(p * 3);
  let fx = 0.5, fy = 0.5, z = 1;
  if (pan) {
    const q = ease.inOutSine(clamp01((t - pan.a) / (pan.b - pan.a || 1)));
    fx = lerp(pan.from[0], pan.to[0], q);
    fy = lerp(pan.from[1], pan.to[1], q);
    z = Math.exp(lerp(Math.log(pan.from[2]), Math.log(pan.to[2]), q));
  }
  const filter = tint === 'paper' ? 'sepia(0.35) saturate(0.75) contrast(0.96) brightness(1.02)' : tint === 'sepia' ? 'sepia(0.85) saturate(0.6) contrast(0.95)' : tint === 'ink' ? 'grayscale(1) sepia(0.45) brightness(0.72) contrast(1.15)' : 'none';
  const pad = frame === 'museum' ? Math.min(w, h) * 0.09 : frame === 'print' ? 18 : frame === 'polaroid' ? 22 : 0;
  const bottom = frame === 'polaroid' ? 90 : frame === 'museum' && caption ? 0 : 0;
  const W = w + pad * 2;
  const H = h + pad * 2 + bottom;
  const textCol = dark ? C.paperShade : C.inkMute;
  return (
    <g transform={`translate(${x} ${y + (1 - k) * 50}) rotate(${rot}) scale(${0.97 + 0.03 * k})`} opacity={o}>
      {frame !== 'none' && (
        <g>
          <rect x={-W / 2 + 14} y={-h / 2 - pad + 18} width={W} height={H} rx={frame === 'print' ? 4 : 2} fill={C.ink} opacity={0.18} />
          {frame === 'museum' && <rect x={-W / 2 - 10} y={-h / 2 - pad - 10} width={W + 20} height={H + 20} fill={C.woodDark} />}
          <rect x={-W / 2} y={-h / 2 - pad} width={W} height={H} rx={frame === 'print' ? 4 : 0} fill={frame === 'museum' ? C.paperLight : C.paperLight} />
          {frame === 'museum' && <rect x={-w / 2 - 6} y={-h / 2 - 6} width={w + 12} height={h + 12} fill="none" stroke={C.paperDeep} strokeWidth={3} />}
        </g>
      )}
      <foreignObject x={-w / 2} y={-h / 2} width={w} height={h}>
        <div style={{width: w, height: h, overflow: 'hidden', position: 'relative', background: C.paperShade}}>
          <Img
            src={staticFile(`${slug}/${src}`)}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: w,
              height: h,
              objectFit: 'cover',
              objectPosition: `${fx * 100}% ${fy * 100}%`,
              transform: `scale(${z})`,
              transformOrigin: `${fx * 100}% ${fy * 100}%`,
              filter,
            }}
          />
          {tint === 'paper' && <div style={{position: 'absolute', inset: 0, background: C.paper, opacity: 0.12, mixBlendMode: 'multiply'}} />}
        </div>
      </foreignObject>
      {caption && (
        <text x={0} y={h / 2 + pad + (frame === 'polaroid' ? 56 : 50)} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={Math.max(36, Math.min(48, w * 0.055))} fill={frame === 'none' ? textCol : C.ink}>
          {caption}
        </text>
      )}
      {credit && (
        <text x={W / 2 - 4} y={h / 2 + pad + (caption ? 92 : 34) + (frame === 'polaroid' ? 10 : 0)} textAnchor="end" fontFamily={FONT_SANS} fontWeight={600} fontSize={26} letterSpacing={1} fill={textCol} opacity={0.85}>
          {credit}
        </text>
      )}
    </g>
  );
};

/** Highlight a region of a Photo (in window-relative 0..1 coords) with a circle/box drawn on top. Place after <Photo>. */
export const PhotoMark: React.FC<{x: number; y: number; w: number; h: number; rx: number; ry: number; rw: number; rh: number; p: number; color?: string; shape?: 'box' | 'ellipse'}> = ({
  x,
  y,
  w,
  h,
  rx,
  ry,
  rw,
  rh,
  p,
  color = C.oxblood,
  shape = 'ellipse',
}) => {
  if (p <= 0) return null;
  const cx = x - w / 2 + rx * w;
  const cy = y - h / 2 + ry * h;
  const k = ease.inOut(clamp01(p));
  return shape === 'box' ? (
    <rect x={cx - (rw * w) / 2} y={cy - (rh * h) / 2} width={rw * w} height={rh * h} fill="none" stroke={color} strokeWidth={6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} rx={6} />
  ) : (
    <ellipse cx={cx} cy={cy} rx={(rw * w) / 2} ry={(rh * h) / 2} fill="none" stroke={color} strokeWidth={6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
  );
};
