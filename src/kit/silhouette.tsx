import React from 'react';
import {C} from './theme';
import {clamp01, ease} from './anim';
import {SILHOUETTES} from '../assets/silhouettes';

/**
 * Recolourable organism silhouette from the shared library (tools/silhouette.mjs — free PhyloPic shapes).
 * <Silhouette name="trex" x={960} y={900} h={420} color={C.ink} p={ramp(t, a, a + 0.8)} reveal="wipe" />
 * origin = bottom-centre (anchor "bottom", default) or centre (anchor "center"). h = height in px.
 * outline: 'dashed' = Binly grammar for inferred / reconstructed / absent (fill "none" + dashed stroke).
 * p (0→1) reveal: 'fade' | 'wipe' (left→right) | 'rise' (from below) | 'pop' (scale settle). flip = face the other way.
 * Unknown name → a dashed placeholder box (visible in sheets) — fetch it with tools/silhouette.mjs.
 */
export const Silhouette: React.FC<{
  name: string;
  x: number;
  y: number;
  h: number;
  color?: string;
  fill?: boolean;
  outline?: 'none' | 'solid' | 'dashed';
  outlineColor?: string;
  strokeWidth?: number;
  p?: number;
  reveal?: 'fade' | 'wipe' | 'rise' | 'pop';
  flip?: boolean;
  rot?: number;
  o?: number;
  anchor?: 'bottom' | 'center';
}> = ({name, x, y, h, color = C.ink, fill = true, outline = 'none', outlineColor, strokeWidth = 4, p = 1, reveal = 'fade', flip = false, rot = 0, o = 1, anchor = 'bottom'}) => {
  if (p <= 0) return null;
  const s = SILHOUETTES[name];
  const k = clamp01(p);
  if (!s) {
    return (
      <g opacity={o}>
        <rect x={x - h * 0.6} y={anchor === 'bottom' ? y - h : y - h / 2} width={h * 1.2} height={h} fill="none" stroke={C.caution} strokeWidth={4} strokeDasharray="14 10" />
        <text x={x} y={anchor === 'bottom' ? y - h / 2 : y} textAnchor="middle" fontSize={24} fontFamily="Inter" fill={C.caution}>
          missing silhouette "{name}"
        </text>
      </g>
    );
  }
  const [vw, vh] = s.viewBox;
  const sc = h / vh;
  const w = vw * sc;
  const top = anchor === 'bottom' ? y - h : y - h / 2;
  const left = x - w / 2;
  const id = `sil-${name}-${Math.round(x)}-${Math.round(y)}`;
  const rise = reveal === 'rise' ? (1 - ease.outQuint(k)) * h * 0.25 : 0;
  const pop = reveal === 'pop' ? 0.9 + 0.1 * ease.outBack(k) : 1;
  const alpha = reveal === 'fade' ? ease.out(k) : reveal === 'wipe' ? 1 : clamp01(k * 2);
  const stroke = outline === 'none' ? undefined : (outlineColor ?? color);
  const dash = outline === 'dashed' ? `${strokeWidth * 3} ${strokeWidth * 2.2}` : undefined;
  return (
    <g opacity={o * alpha} transform={`rotate(${rot} ${x} ${anchor === 'bottom' ? y - h / 2 : y}) translate(0 ${rise})`}>
      {reveal === 'wipe' && (
        <clipPath id={id}>
          <rect x={left - 4} y={top - 4} width={(w + 8) * ease.inOut(k)} height={h + 8} />
        </clipPath>
      )}
      <g clipPath={reveal === 'wipe' ? `url(#${id})` : undefined} transform={`translate(${x} ${top + h / 2}) scale(${pop}) translate(${-x} ${-(top + h / 2)})`}>
        <g transform={`translate(${flip ? left + w : left} ${top}) scale(${flip ? -sc : sc} ${sc})`}>
          <g fill={fill ? color : 'none'} stroke={stroke} strokeWidth={stroke ? strokeWidth : undefined} strokeDasharray={dash} strokeLinejoin="round" dangerouslySetInnerHTML={{__html: s.markup}} />
        </g>
      </g>
    </g>
  );
};

/** Names currently in the shared library (for galleries / validation). */
export const SILHOUETTE_NAMES = Object.keys(SILHOUETTES);
