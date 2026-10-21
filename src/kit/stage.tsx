import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, H, W} from './theme';
import {camAt, CamKey, CamState, ease, EaseFn, noise1} from './anim';
import {FONT_AR, FONT_AR_HAND, isAr} from './lang';

/**
 * Text steadiness (the "vibrating text" fix). Chrome/Skia snaps glyph baselines to whole device pixels whenever text
 * is drawn axis-aligned (sub-pixel positioning is horizontal-only), so during slow camera drifts text lags and then
 * jumps ~1 px while shapes glide (sawtooth). A constant, invisible 0.1° tilt on every text element makes the glyph
 * matrix non-axis-aligned → Skia positions glyphs sub-pixel in BOTH axes and text glides with the shapes.
 * Applied per text element around its own centre (max 0.9 px shift at the ends of a 1000 px line), never to shapes
 * or photos. Text with its own transform attribute is skipped (it's already rotated or self-positioned).
 * HTML text in a <foreignObject> gets it via className={TEXT_FO} (RichText, Para, Bubble use it).
 * Measured with tools/jitter-test.mjs --kit: vertical sawtooth 1.0 px → < 0.1 px (MapShot drift 0.83 → 0.10 px).
 */
export const TEXT_FO = 'ktext';
const TEXT_NUDGE = `text:not([transform]), foreignObject.${TEXT_FO} { rotate: 0.1deg; transform-box: fill-box; transform-origin: 50% 50%; }`;
/**
 * Stage: one full-frame 1920x1080 SVG. Every shot/chapter draws inside a Stage.
 * World units = pixels of the 1920x1080 frame when the camera is at rest.
 */
/**
 * Arabic (lang 'ar'): fonts → Baloo Bhaijaan 2 (hand notes → Marhey), no letter-spacing (it breaks Arabic joining), no
 * italics, RTL paragraphs. The whole scene is MIRRORED (k-rtl) so layouts read right→left; every <text>/<foreignObject>
 * is flipped back in place (readable glyphs, photos the right way round). Anything that must keep its real geometry
 * (maps, a photo with overlays at image coordinates) wraps itself in className="k-nomirror".
 */
const AR_CSS = `
.k-ar text, .k-ar tspan { font-family: ${FONT_AR} !important; letter-spacing: 0 !important; font-style: normal !important; }
.k-ar text { unicode-bidi: plaintext; }
.k-ar text, .k-ar tspan, .k-ar foreignObject * { font-weight: 800 !important; } /* owner pick: heavy rounded Arabic everywhere */
.k-ar [font-family*="Caveat"], .k-ar foreignObject [style*="Caveat"] { font-weight: 700 !important; }
.k-ar [font-family*="Caveat"], .k-ar [font-family*="Caveat"] tspan { font-family: ${FONT_AR_HAND} !important; }
.k-ar foreignObject, .k-ar foreignObject * { font-family: ${FONT_AR} !important; letter-spacing: 0 !important; font-style: normal !important; }
.k-ar foreignObject [style*="Caveat"] { font-family: ${FONT_AR_HAND} !important; }
.k-ar foreignObject div { direction: rtl; }
.k-ar foreignObject [style*="text-align: left"] { text-align: right !important; }
.k-rtl text, .k-rtl foreignObject, .k-rtl .k-nomirror { scale: -1 1; transform-box: fill-box; transform-origin: 50% 50%; }
.k-rtl .k-nomirror text, .k-rtl .k-nomirror foreignObject, .k-rtl .k-nomirror .k-nomirror { scale: none; }
`;

/** English: Baloo 2 has no italic — keep it upright (a fake slant looks cheap). */
const EN_CSS = `text[font-family*="Baloo"], text[font-family*="Baloo"] tspan, [style*="Baloo"] { font-style: normal !important; }`;

/** Shared elegant-glow filters (GLOW in kit/theme). Two stacked soft halos: a tight one + a wide faint one. */
const halo = (id: string, color: string, a: number, b: number) => (
  <filter id={id} x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
    <feDropShadow dx={0} dy={0} stdDeviation={10} floodColor={color} floodOpacity={a} />
    <feDropShadow dx={0} dy={0} stdDeviation={28} floodColor={color} floodOpacity={b} />
  </filter>
);
export const GlowDefs: React.FC = () => (
  <defs>
    <filter id="kSoft" x="-30%" y="-30%" width="160%" height="175%" colorInterpolationFilters="sRGB">
      <feDropShadow dx={0} dy={10} stdDeviation={16} floodColor={C.ink} floodOpacity={0.13} />
      <feDropShadow dx={0} dy={2} stdDeviation={3} floodColor={C.ink} floodOpacity={0.08} />
    </filter>
    {halo('kGlowGold', C.goldLight, 0.6, 0.35)}
    {halo('kGlowLav', C.theoryLight, 0.55, 0.35)}
    {halo('kGlowGreen', C.evidenceLight, 0.45, 0.28)}
    {halo('kGlowOx', C.oxLight, 0.45, 0.28)}
    {halo('kGlowWhite', '#FFFFFF', 0.95, 0.6)}
  </defs>
);

export const Stage: React.FC<{bg?: string; children?: React.ReactNode; style?: React.CSSProperties}> = ({bg = C.paper, children, style}) => (
  <AbsoluteFill style={{background: bg, ...style}}>
    {/* geometricPrecision: no hinting snap (inherited by HTML in foreignObject); TEXT_NUDGE: sub-pixel glyphs in y too. */}
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, overflow: 'hidden', textRendering: 'geometricPrecision'}}>
      <style>{TEXT_NUDGE + (isAr() ? AR_CSS : EN_CSS)}</style>
      <GlowDefs />
      {isAr() ? (
        <g className="k-ar k-rtl" transform={`matrix(-1 0 0 1 ${W} 0)`}>
          {children}
        </g>
      ) : (
        children
      )}
    </svg>
  </AbsoluteFill>
);

const REST: CamState = {cx: W / 2, cy: H / 2, z: 1, r: 0};

/**
 * Camera group. Looks at world point (cx, cy) with zoom z and rotation r.
 * `depth` gives parallax: 1 = main plane, <1 = far layers (move less), >1 = foreground (move more).
 */
export const Cam: React.FC<{cam?: CamState; depth?: number; children?: React.ReactNode}> = ({cam = REST, depth = 1, children}) => {
  const z = 1 + (cam.z - 1) * depth;
  const cx = cam.cx * depth + (W / 2) * (1 - depth);
  const cy = cam.cy * depth + (H / 2) * (1 - depth);
  return <g transform={`translate(${W / 2} ${H / 2}) rotate(${cam.r}) scale(${z}) translate(${-cx} ${-cy})`}>{children}</g>;
};

/** Convenience: camera from keyframes. <CamKeys t={t} keys={[[0, 960,540,1],[4, 1200,500,1.6]]}>…</CamKeys> */
export const CamKeys: React.FC<{t: number; keys: CamKey[]; depth?: number; fn?: EaseFn; children?: React.ReactNode}> = ({t, keys, depth = 1, fn = ease.inOut, children}) => (
  <Cam cam={camAt(t, keys, fn)} depth={depth}>
    {children}
  </Cam>
);

/**
 * Parallax world: pass the camera state once, then layers at different depths.
 * <World cam={cam} layers={[{depth:0.3, el:<Hills/>}, {depth:1, el:<Town/>}, {depth:1.4, el:<Grass/>}]} />
 */
export const World: React.FC<{cam: CamState; layers: {depth: number; el: React.ReactNode}[]}> = ({cam, layers}) => (
  <>
    {layers.map((l, i) => (
      <Cam key={i} cam={cam} depth={l.depth}>
        {l.el}
      </Cam>
    ))}
  </>
);

/**
 * Handheld-style micro drift for the camera (deterministic). Add to a CamState for "alive" holds.
 * Translation only: micro rotation/zoom noise re-rasterised every glyph each frame and made still text shimmer.
 */
export const breathe = (cam: CamState, t: number, amount = 1): CamState => ({
  cx: cam.cx + noise1(t * 0.25, 1) * 6 * amount,
  cy: cam.cy + noise1(t * 0.22, 2) * 4 * amount,
  z: cam.z,
  r: cam.r,
});

/** Deterministic camera shake (impacts, rumbles). strength in px, decays from t0. */
export const shake = (cam: CamState, t: number, t0: number, strength = 14, decay = 5): CamState => {
  if (t < t0) return cam;
  const k = Math.exp(-(t - t0) * decay) * strength;
  return {...cam, cx: cam.cx + noise1(t * 30, 7) * k, cy: cam.cy + noise1(t * 30, 9) * k};
};

/** Transform helper: place children at (x,y) with scale/rotation/opacity. */
export const At: React.FC<{x?: number; y?: number; s?: number; sx?: number; sy?: number; r?: number; o?: number; children?: React.ReactNode}> = ({
  x = 0,
  y = 0,
  s = 1,
  sx,
  sy,
  r = 0,
  o = 1,
  children,
}) => {
  if (o <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${sx ?? s} ${sy ?? s})`} opacity={o}>
      {children}
    </g>
  );
};

/** Unique-ish id helper for clipPaths/masks inside one frame. Always pass a stable string. */
export const uid = (...parts: (string | number)[]) => 'k' + parts.join('-').replace(/[^a-zA-Z0-9-]/g, '_');
