import React from 'react';
import {cueSfx} from './sfx';
import {Img, staticFile} from 'remotion';
import {C, FONT_SANS, FONT_SERIF, SAFE, SEM, Sem, TYPE} from './theme';
import {CamState, clamp, clamp01, ease, lerp, mixHex, noise1, rand, ramp} from './anim';
import {Stage, World, breathe} from './stage';
import {Kicker, Para, Tag, textW} from './text';
import {LightPool, Vignette} from './fx';
import {Icon, IconName} from './icons';
import {Arrow} from './diagrams';
import {Person, PersonProps, personHands} from './people';
import {Bench, Floor, Study, mixC} from './env';
import {Backdrop, ShotBase, tonePal} from './templates';

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Archival image templates — real images (paintings, manuscripts, documents, photographs) edited like
// a top YouTube storyteller: brisk, always moving, always meaning something, every image credited.
// Same contract as templates.tsx: each template is a full frame (<Stage>), a pure function of absolute t
// for a shot living a → b, entrances keyed to cue props, alive holds. Like templates.tsx this module
// composes the whole kit (it imports templates/env/people/diagrams on purpose).
// Image coords: (rx, ry) = 0..1 of the SOURCE image; a Focus [fx, fy, zoom] aims the "camera" on the image
// (zoom 1 = image just covers the window; > 1 = closer). Overlays track the image through every move.
// ════════════════════════════════════════════════════════════════════════════════════════════════

export type Focus = [number, number, number];
export type ArchTint = 'paper' | 'sepia' | 'ink' | 'none';
type XY = {x: number; y: number};
/** Props shared by archival templates. */
export type ArchBase = ShotBase & {slug: string; credit?: string; tint?: ArchTint; caption?: string};

const FILTER: Record<ArchTint, string> = {
  paper: 'sepia(0.35) saturate(0.75) contrast(0.96) brightness(1.02)',
  sepia: 'sepia(0.85) saturate(0.6) contrast(0.95)',
  ink: 'grayscale(1) sepia(0.45) brightness(0.72) contrast(1.15)',
  none: 'none',
};

const lerpFocus = (a: Focus, b: Focus, k: number): Focus => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), k))];
/** Tiny handheld drift on a focus (alive holds). */
const alive = (f: Focus, t: number, seed = 0, amt = 1): Focus => [f[0] + noise1(t * 0.22, seed + 1) * 0.004 * amt, f[1] + noise1(t * 0.2, seed + 2) * 0.004 * amt, f[2] * (1 + noise1(t * 0.17, seed + 3) * 0.004 * amt)];

/** Full-frame images narrower than this (w/h) are shown whole at full height over a calm backdrop, not cropped to a band. */
const FULL_MIN_ASPECT = 1.3;

/** Where an image of `aspect` (w/h) lands inside a w×h window aimed at focus f: {left, top, IW, IH} (window px). */
export const viewRect = (w: number, h: number, aspect: number, f: Focus) => {
  // Full-frame (1920×1080) window + square/portrait image (aspect < FULL_MIN_ASPECT): show the WHOLE image at full height
  // (zoom 1 = fit height, centred) instead of cropping to a horizontal band. ArchImage fills the side bars.
  const iw0 = w === 1920 && h === 1080 && aspect < FULL_MIN_ASPECT ? h * aspect : Math.max(w, h * aspect);
  const ih0 = iw0 / aspect;
  const z = Math.max(1, f[2]);
  const IW = iw0 * z;
  const IH = ih0 * z;
  return {left: IW <= w ? (w - IW) / 2 : clamp(w / 2 - f[0] * IW, w - IW, 0), top: clamp(h / 2 - f[1] * IH, h - IH, 0), IW, IH};
};
export type ViewRect = ReturnType<typeof viewRect>;
/** Image point (rx, ry) → window point (add the window's x/y for stage coords). */
export const onView = (v: ViewRect, rx: number, ry: number): XY => ({x: v.left + rx * v.IW, y: v.top + ry * v.IH});

/**
 * ArchImage — one real image in a window (origin = TOP-LEFT of the window, w×h), 'cover' fit, aimed by `focus`.
 * tint (paper default), `dim` (ink veil 0..1), `wash` (paper veil 0..1), `clip` (CSS clip-path in window px),
 * `round` (ellipse window). Loads via Remotion <Img> (render waits for it). Use `viewRect` to place overlays.
 */
export const ArchImage: React.FC<{
  slug: string;
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  aspect?: number;
  focus?: Focus;
  tint?: ArchTint;
  o?: number;
  dim?: number;
  wash?: number;
  clip?: string;
  round?: boolean;
  filter?: string;
  bg?: string;
}> = ({slug, src, x, y, w, h, aspect = 1.5, focus = [0.5, 0.5, 1], tint = 'paper', o = 1, dim = 0, wash = 0, clip, round = false, filter, bg = C.paperShade}) => {
  if (o <= 0) return null;
  const v = viewRect(w, h, aspect, focus);
  const f = [FILTER[tint], filter].filter((s) => s && s !== 'none').join(' ') || 'none';
  return (
    <foreignObject x={x} y={y} width={w} height={h} opacity={o}>
      <div style={{width: w, height: h, overflow: 'hidden', position: 'relative', background: bg, clipPath: clip, borderRadius: round ? '50%' : undefined}}>
        {v.left > 0 && bg !== 'transparent' && (
          <Img
            src={staticFile(`${slug}/${src}`)}
            style={{position: 'absolute', left: (w - Math.max(w, h * aspect) * 1.12) / 2, top: (h - (Math.max(w, h * aspect) * 1.12) / aspect) / 2, width: Math.max(w, h * aspect) * 1.12, height: (Math.max(w, h * aspect) * 1.12) / aspect, maxWidth: 'none', filter: `${f === 'none' ? '' : f + ' '}blur(28px) brightness(0.55) saturate(0.8)`}}
          />
        )}
        <Img src={staticFile(`${slug}/${src}`)} style={{position: 'absolute', left: v.left, top: v.top, width: v.IW, height: v.IH, maxWidth: 'none', filter: f, boxShadow: v.left > 0 ? `0 24px 70px ${C.ink}88` : undefined}} />
        {tint === 'paper' && <div style={{position: 'absolute', inset: 0, background: C.paper, opacity: 0.12, mixBlendMode: 'multiply'}} />}
        {wash > 0 && <div style={{position: 'absolute', inset: 0, background: C.paper, opacity: wash}} />}
        {dim > 0 && <div style={{position: 'absolute', inset: 0, background: C.ink, opacity: dim}} />}
      </div>
    </foreignObject>
  );
};

// ───────────────────────────────────────────────────────────────── shared overlays

/** Credit line (small, always shown when given). onImage → soft ink pill behind it. anchor end = x is the right edge. */
export const CreditLine: React.FC<{text?: string; x?: number; y?: number; p?: number; anchor?: 'start' | 'end'; onImage?: boolean; dark?: boolean}> = ({
  text,
  x = 1872,
  y = 1040,
  p = 1,
  anchor = 'end',
  onImage = true,
  dark = false,
}) => {
  if (!text || p <= 0) return null;
  const size = TYPE.credit;
  const w = textW(text, size, 'sans', 500) + 28;
  const x0 = anchor === 'end' ? x - w : x;
  return (
    <g opacity={clamp01(p)}>
      {onImage && <rect x={x0} y={y - size - 6} width={w} height={size + 18} rx={6} fill={C.ink} opacity={0.55} />}
      <text x={x0 + 14} y={y} fontFamily={FONT_SANS} fontWeight={500} fontSize={size} letterSpacing={0.5} fill={onImage || dark ? C.paperShade : C.inkMute}>
        {text}
      </text>
    </g>
  );
};

/** Lower third: ink plate + oxblood bar, optional kicker, serif italic caption. origin = bottom-left. */
export const LowerThird: React.FC<{text: string; kicker?: string; p: number; x?: number; y?: number; size?: number}> = ({text, kicker, p, x = 96, y = 950, size: size0 = 54}) => {
  if (p <= 0) return null;
  cueSfx('swoosh', `lt@${text}`, true, x);
  const size = Math.max(size0, TYPE.read); // phone-readable floor; y = 950 keeps it above YouTube's player controls
  const k = ease.outQuint(clamp01(p));
  const w = Math.max(textW(text, size, 'serif'), kicker ? textW(kicker, TYPE.small, 'sansCaps', 700) * 1.1 : 0) + 84;
  const h = kicker ? size * 1.3 + 84 : size * 1.3 + 34;
  const top = y - h;
  return (
    <g>
      <rect x={x} y={top} width={w * k} height={h} fill={C.ink} opacity={0.86} />
      <rect x={x} y={top} width={9} height={h * k} fill={C.oxblood} />
      <g opacity={ramp(p, 0.4, 1)}>
        {kicker && (
          <text x={x + 36} y={top + 58} fontFamily={FONT_SANS} fontWeight={700} fontSize={TYPE.small} letterSpacing={5} fill={C.oxTint}>
            {kicker}
          </text>
        )}
        <text x={x + 36} y={y - 24} fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={size} fill={C.paperLight}>
          {text}
        </text>
      </g>
    </g>
  );
};

/** Label plate: paper card + semantic bar, caps label, optional serif note. (x, y) = vertical centre of the anchor edge. */
const LabelPlate: React.FC<{x: number; y: number; text: string; note?: string; kind?: Sem; p: number; anchor?: 'start' | 'end' | 'middle'; size?: number; dark?: boolean}> = ({
  x,
  y,
  text,
  note,
  kind = 'signal',
  p,
  anchor = 'start',
  size: size0 = TYPE.label,
  dark = false,
}) => {
  if (p <= 0) return null;
  cueSfx('popup', `lp@${text}@${Math.round(x)},${Math.round(y)}`, true, x);
  const size = Math.max(size0, TYPE.small); // phone-readable floor (kicker plates use TYPE.small, labels default TYPE.label)
  const k = ease.outQuint(clamp01(p));
  const label = text;
  const w = Math.max(textW(label, size, 'sansCaps', 700) * 1.08, note ? textW(note, size * 0.95, 'serif') : 0) + 64;
  const h = note ? size * 3.1 : size * 2.1;
  // stay inside the title-safe frame and above YouTube's player controls (y ≤ 970)
  const x0 = clamp(anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w, SAFE, 1920 - SAFE - w);
  y = clamp(y, SAFE + h / 2, 970 - h / 2);
  const col = dark ? mixHex(SEM[kind], C.paperLight, 0.25) : SEM[kind];
  return (
    <g opacity={clamp01(p * 2.5)} transform={`translate(${(1 - k) * (anchor === 'start' ? -16 : anchor === 'end' ? 16 : 0)} ${anchor === 'middle' ? (1 - k) * 12 : 0})`}>
      <rect x={x0 + 6} y={y - h / 2 + 8} width={w} height={h} rx={8} fill={C.ink} opacity={0.25} />
      <rect x={x0} y={y - h / 2} width={w} height={h} rx={8} fill={dark ? C.inkSoft : C.paperLight} />
      <rect x={x0} y={y - h / 2} width={9} height={h} rx={3} fill={col} />
      <text x={x0 + 32} y={note ? y - size * 0.25 : y + size * 0.36} fontFamily={FONT_SANS} fontWeight={700} fontSize={size} letterSpacing={size * 0.08} fill={dark ? C.paperLight : C.ink} opacity={ramp(p, 0.3, 1)}>
        {label}
      </text>
      {note && (
        <text x={x0 + 32} y={y + size * 1.0} fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={500} fontSize={size * 0.95} fill={dark ? C.paperDeep : C.inkMute} opacity={ramp(p, 0.45, 1)}>
          {note}
        </text>
      )}
    </g>
  );
};

/** Stroke with a paper halo so marks read on any image. */
const HaloShape: React.FC<{shape: 'ellipse' | 'box'; cx: number; cy: number; w: number; h: number; p: number; color: string; width?: number; dashed?: boolean; t?: number}> = ({
  shape,
  cx,
  cy,
  w,
  h,
  p,
  color,
  width = 6,
  dashed = false,
  t = 0,
}) => {
  if (p <= 0) return null;
  const k = ease.inOut(clamp01(p));
  const el = (stroke: string, sw: number, o: number) => {
    const common = dashed
      ? {stroke, strokeWidth: sw, fill: 'none', opacity: o * clamp01(p * 2), strokeDasharray: `${width * 2.6} ${width * 2}`, strokeDashoffset: -t * 18, strokeLinecap: 'round' as const}
      : {stroke, strokeWidth: sw, fill: 'none', opacity: o, pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - k, strokeLinecap: 'round' as const};
    return shape === 'box' ? <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={8} {...common} /> : <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} transform={`rotate(-6 ${cx} ${cy})`} {...common} />;
  };
  return (
    <g>
      {el(C.paperLight, width + 7, 0.85)}
      {el(color, width, 1)}
    </g>
  );
};

/** Numbered badge (detail index). */
const Badge: React.FC<{x: number; y: number; n: number; p: number; color: string; r?: number}> = ({x, y, n, p, color, r = 22}) => {
  if (p <= 0) return null;
  const s = ease.outBack(clamp01(p));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={r + 4} fill={C.paperLight} />
      <circle r={r} fill={color} />
      <text y={r * 0.38} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={r * 1.1} fill={C.paperLight}>
        {n}
      </text>
    </g>
  );
};

/** Full-frame stage for bleed images: background + content + fixed overlays + vignette. */
const Bleed: React.FC<{bg?: string; vignette?: number; children?: React.ReactNode}> = ({bg = C.ink, vignette = 0.9, children}) => (
  <Stage bg={bg}>
    {/* RTL: full-frame image shots keep their real geometry (overlays sit at image coordinates) */}
    <g className="k-nomirror">
      <rect x={0} y={0} width={1920} height={1080} fill="none" />
      {children}
    </g>
    {vignette > 0 && <Vignette strength={vignette} />}
  </Stage>
);

/** Focus over time: slow from→to move + optional cue beats that re-aim the camera (eased or hard cut). */
const focusAt = (t: number, t0: number, t1: number, from: Focus, to: Focus, beats?: {at: number; focus: Focus; cut?: boolean; dur?: number}[], seed = 0): Focus => {
  let cur = lerpFocus(from, to, ease.inOutSine(clamp01((t - t0) / Math.max(0.5, t1 - t0))));
  for (const bt of beats ?? []) {
    const q = bt.cut ? (t >= bt.at ? 1 : 0) : ramp(t, bt.at, bt.at + (bt.dur ?? 1.1), ease.inOut);
    if (q <= 0) continue;
    const tgt: Focus = [bt.focus[0], bt.focus[1], bt.focus[2] * (1 + 0.02 * Math.max(0, t - bt.at))];
    cur = lerpFocus(cur, tgt, q);
  }
  return alive(cur, t, seed);
};

// ════════════════════════════════════════════════════════════════════════════════ 1 · KenBurnsShot

/**
 * KenBurnsShot — one image with a slow, motivated move (from → to, eased, log-zoom) + optional `beats` that re-aim
 * the camera on cue (editor punch-ins: eased 1.1 s, or `cut: true` = hard punch). frame 'full' (bleed) | 'print'
 * (framed print on a tone backdrop). caption → lower third (+ `kicker`) at captionAt; credit always shown.
 */
export const KenBurnsShot: React.FC<
  ArchBase & {
    src: string;
    aspect?: number;
    from?: Focus;
    to?: Focus;
    beats?: {at: number; focus: Focus; cut?: boolean}[];
    frame?: 'full' | 'print';
    vignette?: boolean;
    kicker?: string;
    captionAt?: number;
    at?: number;
  }
> = ({t, a, b, tone = 'ink', seed = 1, slug, src, aspect = 1.5, from = [0.5, 0.5, 1], to = [0.5, 0.44, 1.16], beats, frame = 'full', vignette = true, tint = 'paper', caption, kicker, credit, captionAt, at}) => {
  const t0 = at ?? a;
  const f = focusAt(t, t0, Math.max(b, t0 + 3), from, to, beats, seed);
  const o = ramp(t, t0 - 0.35, t0 + 0.05, ease.linear);
  const cA = captionAt ?? t0 + 0.6;
  const overlays = (
    <g>
      {caption && <LowerThird text={caption} kicker={kicker} p={ramp(t, cA, cA + 0.7, ease.linear)} />}
      <CreditLine text={credit} p={ramp(t, t0 + 0.2, t0 + 0.6)} onImage={frame === 'full' || tone === 'ink'} />
    </g>
  );
  if (frame === 'full')
    return (
      <Bleed vignette={vignette ? 0.9 : 0}>
        <ArchImage slug={slug} src={src} x={0} y={0} w={1920} h={1080} aspect={aspect} focus={f} tint={tint} o={o} bg={C.ink} />
        {overlays}
      </Bleed>
    );
  const P = tonePal(tone);
  const maxW = 1400;
  const maxH = 700;
  const w = Math.min(maxW, maxH * aspect);
  const h = w / aspect;
  const x = 960 - w / 2;
  const y = 470 - h / 2;
  const k = ease.outQuint(ramp(t, t0 - 0.3, t0 + 0.6, ease.linear));
  const cam = breathe({cx: 960 + sideOf(seed) * lerp(-10, 10, ramp(t, a, b, ease.inOutSine)), cy: 540, z: lerp(1, 1.035, ramp(t, a, b + 1, ease.inOutSine)), r: 0}, t, 0.6);
  return (
    <Stage bg={P.bg}>
      <World
        cam={cam}
        layers={[
          {depth: 0.4, el: <Backdrop tone={tone} seed={seed} t={t} />},
          {
            depth: 1,
            el: (
              <g opacity={k} transform={`translate(0 ${(1 - k) * 40})`}>
                <rect x={x - 18 + 14} y={y - 18 + 18} width={w + 36} height={h + 36} rx={4} fill={C.ink} opacity={P.dark ? 0.45 : 0.18} />
                <rect x={x - 18} y={y - 18} width={w + 36} height={h + 36} rx={4} fill={C.paperLight} />
                <ArchImage slug={slug} src={src} x={x} y={y} w={w} h={h} aspect={aspect} focus={f} tint={tint} />
              </g>
            ),
          },
        ]}
      />
      <Vignette strength={P.dark ? 1.1 : 0.55} />
      {overlays}
    </Stage>
  );
};

const sideOf = (seed: number) => (rand(seed * 7.31 + 3) < 0.5 ? -1 : 1);

// ════════════════════════════════════════════════════════════════════════════════ 2 · DetailHuntShot

export type Detail = {rx: number; ry: number; rw: number; rh: number; label: string; note?: string; at?: number; kind?: Sem; shape?: 'ellipse' | 'box'; zoom?: number};

/**
 * DetailHuntShot — start wide, then on each cue punch/drift into a detail (rx, ry centre, rw×rh size, 0..1 of the
 * image) and annotate it (draw-on circle/box + leader line + label plate, semantic colour). Each detail gets its own
 * camera framing (auto zoom so it fills ~45 % of the frame, offset to leave room for the label). Returns wide at
 * `returnAt` (default b − 1.4; false = stay) and shows every detail as a numbered marker.
 */
export const DetailHuntShot: React.FC<ArchBase & {src: string; aspect?: number; details: Detail[]; returnAt?: number | false; kicker?: string; at?: number}> = ({
  t,
  a,
  b,
  seed = 1,
  slug,
  src,
  aspect = 1.5,
  details,
  returnAt,
  tint = 'paper',
  caption,
  kicker,
  credit,
  at,
}) => {
  const t0 = at ?? a;
  const n = details.length;
  const gap = (b - t0 - 1.6) / (n + 1);
  const ats = details.map((d, i) => d.at ?? t0 + 0.6 + i * gap);
  const ret = returnAt === false ? Infinity : (returnAt ?? b - 1.4);
  const v1 = viewRect(1920, 1080, aspect, [0.5, 0.5, 1]);
  const targets: Focus[] = details.map((d) => {
    const z = d.zoom ?? clamp(Math.min((0.42 * 1920) / (d.rw * v1.IW), (0.55 * 1080) / (d.rh * v1.IH)), 1.25, 3.2);
    const side = d.rx < 0.5 ? 1 : -1; // detail on the left of frame → label right
    return [d.rx + (side * 0.13 * 1920) / (v1.IW * z), d.ry, z];
  });
  const beats = [...details.map((_, i) => ({at: ats[i], focus: targets[i], dur: 1.0})), ...(ret < Infinity ? [{at: ret, focus: [0.5, 0.5, 1.02] as Focus, dur: 1.2}] : [])];
  const f = focusAt(t, t0, ats[0] ?? b, [0.5, 0.5, 1], [0.5, 0.5, 1.05], beats, seed);
  const v = viewRect(1920, 1080, aspect, f);
  const o = ramp(t, t0 - 0.35, t0 + 0.05, ease.linear);
  const summary = ramp(t, ret + 0.5, ret + 1.0);
  return (
    <Bleed>
      <ArchImage slug={slug} src={src} x={0} y={0} w={1920} h={1080} aspect={aspect} focus={f} tint={tint} o={o} bg={C.ink} />
      {details.map((d, i) => {
        const col = SEM[d.kind ?? 'signal'];
        const c = onView(v, d.rx, d.ry);
        const w = d.rw * v.IW;
        const h = d.rh * v.IH;
        const end = Math.min(ats[i + 1] ?? Infinity, ret);
        const out = 1 - ramp(t, end - 0.05, end + 0.3, ease.linear);
        const pr = ramp(t, ats[i] + 0.6, ats[i] + 1.2, ease.linear);
        const pm = pr * out;
        const right = c.x < 960;
        const ex = c.x + (right ? 1 : -1) * (w / 2 + 6);
        const lx = c.x + (right ? 1 : -1) * (w / 2 + 90);
        const ly = clamp(c.y, 160, 900);
        const pl = ramp(t, ats[i] + 0.9, ats[i] + 1.4, ease.linear) * out;
        return (
          <g key={i}>
            {pm > 0 && (
              <g opacity={out}>
                <HaloShape shape={d.shape ?? 'ellipse'} cx={c.x} cy={c.y} w={w * 1.04} h={h * 1.04} p={pr} color={col} width={7} />
                <path d={`M${ex} ${c.y} L${lx - (right ? 30 : -30)} ${ly} L${lx} ${ly}`} stroke={C.paperLight} strokeWidth={11} fill="none" opacity={0.85 * ramp(t, ats[i] + 0.8, ats[i] + 1.0)} strokeLinejoin="round" />
                <path d={`M${ex} ${c.y} L${lx - (right ? 30 : -30)} ${ly} L${lx} ${ly}`} stroke={col} strokeWidth={5} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease.inOut(ramp(t, ats[i] + 0.75, ats[i] + 1.1))} strokeLinejoin="round" />
              </g>
            )}
            <LabelPlate x={lx} y={ly} text={d.label} note={d.note} kind={d.kind ?? 'signal'} p={pl} anchor={right ? 'start' : 'end'} />
            {summary > 0 && (
              <g opacity={summary}>
                <HaloShape shape={d.shape ?? 'ellipse'} cx={c.x} cy={c.y} w={w} h={h} p={1} color={col} width={4} />
                <Badge x={c.x - (w / 2) * 0.72} y={c.y - (h / 2) * 0.72} n={i + 1} p={ramp(t, ret + 0.5 + i * 0.12, ret + 0.9 + i * 0.12, ease.linear)} color={col} />
                <LabelPlate x={c.x + (w / 2) * 0.72 + 14} y={c.y + (h / 2) * 0.72} text={d.label} kind={d.kind ?? 'signal'} p={ramp(t, ret + 0.6 + i * 0.12, ret + 1.1 + i * 0.12, ease.linear)} />
              </g>
            )}
          </g>
        );
      })}
      {kicker && <LabelPlate x={96} y={110} text={kicker} kind="ink" p={ramp(t, t0, t0 + 0.6, ease.linear) * (1 - ramp(t, ats[0] - 0.2, ats[0] + 0.2) * (1 - summary))} size={TYPE.small} />}
      {caption && <LowerThird text={caption} p={ramp(t, t0 + 0.2, t0 + 0.9, ease.linear) * (1 - ramp(t, (ats[0] ?? b) - 0.1, (ats[0] ?? b) + 0.3) * (1 - summary))} />}
      <CreditLine text={credit} p={ramp(t, t0 + 0.2, t0 + 0.6)} />
    </Bleed>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 3 · MontageShot

export type MontageItem = {src: string; aspect?: number; credit?: string; caption?: string; kicker?: string; from?: Focus; to?: Focus};
const MOVES: [Focus, Focus][] = [
  [[0.5, 0.5, 1.0], [0.5, 0.44, 1.16]],
  [[0.5, 0.5, 1.2], [0.5, 0.52, 1.04]],
  [[0.3, 0.5, 1.16], [0.68, 0.48, 1.16]],
  [[0.7, 0.48, 1.16], [0.32, 0.52, 1.16]],
];

/**
 * MontageShot — 2–8 images cut on cues, each with its own small move (push / pull / pan, seeded unless from/to given).
 * `cuts` = start time of each item (length n, or n−1 = starts of items 2…n; default evenly spaced). transition:
 * 'cut' (hard cut + 4 % punch), 'dissolve' (0.35 s), 'slide' (incoming slides over with an oxblood edge).
 * One `tint` for all → mixed sources feel cohesive. counter = "02 / 05" progress ticks top-right.
 */
export const MontageShot: React.FC<ShotBase & {slug: string; items: MontageItem[]; cuts?: number[]; transition?: 'cut' | 'dissolve' | 'slide'; tint?: ArchTint; counter?: boolean; kicker?: string; at?: number}> = ({
  t,
  a,
  b,
  seed = 1,
  slug,
  items,
  cuts,
  transition = 'cut',
  tint = 'paper',
  counter = true,
  kicker,
  at,
}) => {
  const n = items.length;
  const t0 = at ?? a;
  const starts = cuts && cuts.length >= n ? cuts.slice(0, n) : cuts && cuts.length === n - 1 ? [t0, ...cuts] : items.map((_, i) => t0 + (i * (b - t0)) / n);
  const lead = transition === 'cut' ? 0 : transition === 'dissolve' ? 0.18 : 0.12;
  let cur = 0;
  for (let i = 0; i < n; i++) if (t >= starts[i] - lead) cur = i;
  const tr = transition === 'dissolve' ? ramp(t, starts[cur] - 0.18, starts[cur] + 0.17, ease.linear) : transition === 'slide' ? ramp(t, starts[cur] - 0.12, starts[cur] + 0.38, ease.inOutQuint) : 1;
  const draw = (i: number, dx = 0, o = 1) => {
    const it = items[i];
    const mv = MOVES[Math.floor(rand(seed * 5.1 + i * 2.7) * MOVES.length) % MOVES.length];
    const from = it.from ?? mv[0];
    const to = it.to ?? mv[1];
    const s0 = starts[i];
    const s1 = (starts[i + 1] ?? b) + 0.6;
    let f = alive(lerpFocus(from, to, ease.inOutSine(clamp01((t - s0) / (s1 - s0)))), t, seed + i);
    if (transition === 'cut' && i > 0) f = [f[0], f[1], f[2] * (1 + 0.045 * (1 - ease.out(ramp(t, s0, s0 + 0.45, ease.linear))))];
    return (
      <g key={i} transform={`translate(${dx} 0)`} opacity={o}>
        <ArchImage slug={slug} src={it.src} x={0} y={0} w={1920} h={1080} aspect={it.aspect ?? 1.5} focus={f} tint={tint} bg={C.ink} />
        {transition === 'slide' && dx > 0 && <rect x={-14} y={0} width={14} height={1080} fill={C.oxblood} />}
      </g>
    );
  };
  const it = items[cur];
  const sCur = starts[cur];
  const o0 = ramp(t, starts[0] - 0.35, starts[0] + 0.05, ease.linear);
  return (
    <Bleed>
      <g opacity={o0}>
        {cur > 0 && tr < 1 && draw(cur - 1, transition === 'slide' ? -480 * tr : 0)}
        {draw(cur, transition === 'slide' && cur > 0 ? 1920 * (1 - tr) : 0, transition === 'dissolve' && cur > 0 ? tr : 1)}
      </g>
      {kicker && <LabelPlate x={96} y={110} text={kicker} kind="ink" p={ramp(t, t0, t0 + 0.6, ease.linear)} size={TYPE.small} />}
      {counter && (
        <g opacity={ramp(t, t0, t0 + 0.5)}>
          <text x={1824} y={124} textAnchor="end" fontFamily={FONT_SANS} fontWeight={700} fontSize={TYPE.small} letterSpacing={3} fill={C.paperLight}>
            {`${String(cur + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`}
          </text>
          {items.map((_, i) => (
            <rect key={i} x={1824 - (n - i) * 34 + 6} y={150} width={26} height={6} rx={3} fill={i === cur ? C.oxLight : C.paperLight} opacity={i <= cur ? 0.95 : 0.4} />
          ))}
        </g>
      )}
      {it.caption && <LowerThird key={`c${cur}`} text={it.caption} kicker={it.kicker} p={ramp(t, sCur + 0.25, sCur + 0.85, ease.linear)} />}
      <CreditLine text={it.credit} p={ramp(t, sCur + 0.1, sCur + 0.4)} />
    </Bleed>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 4 · CollageShot

export type CollageItem = {src: string; aspect?: number; credit?: string; label?: string; at?: number; x?: number; y?: number; w?: number; rot?: number; fasten?: 'tape' | 'pin'};
const SLOTS: Record<number, [number, number, number][]> = {
  2: [
    [620, 520, 700],
    [1310, 560, 640],
  ],
  3: [
    [500, 460, 560],
    [1110, 400, 520],
    [1460, 720, 470],
  ],
  4: [
    [640, 285, 600],
    [1290, 285, 560],
    [700, 775, 560],
    [1270, 770, 560],
  ],
  5: [
    [420, 335, 430],
    [930, 285, 420],
    [1460, 365, 430],
    [690, 785, 430],
    [1260, 805, 430],
  ],
  6: [
    [400, 305, 390],
    [880, 275, 380],
    [1390, 305, 410],
    [540, 785, 410],
    [1030, 755, 390],
    [1510, 785, 390],
  ],
};

/** Split a credit into lines that fit a print's inner width (breaks at " · " first, then at spaces). */
const wrapCredit = (text: string, maxW: number): string[] => {
  const fit = (x: string) => textW(x, TYPE.credit, 'sans', 500) <= maxW;
  const lines: string[] = [];
  let cur = '';
  for (const unit of text.split(' · ')) {
    const joined = cur ? cur + ' · ' + unit : unit;
    if (fit(joined)) {
      cur = joined;
      continue;
    }
    if (cur) lines.push(cur);
    cur = '';
    for (const word of unit.split(' ')) {
      const w2 = cur ? cur + ' ' + word : word;
      if (cur && !fit(w2)) {
        lines.push(cur);
        cur = word;
      } else cur = w2;
    }
  }
  if (cur) lines.push(cur);
  return lines;
};

/**
 * CollageShot — 2–6 images as prints/clippings on a board (paper pinboard or dark), slight rotations, tape or pins,
 * flat shadows, arriving on cues (they drop and settle); the camera drifts across. Auto layout per count (or x/y/w per
 * item, world coords). `link` = red string (pin to pin) or arrow between two items, optional Tag label at `link.at`.
 */
export const CollageShot: React.FC<
  ShotBase & {slug: string; items: CollageItem[]; board?: 'paper' | 'dark'; tint?: ArchTint; link?: {from: number; to: number; at?: number; style?: 'string' | 'arrow'; label?: string; kind?: Sem}; at?: number; gap?: number}
> = ({t, a, b, seed = 1, slug, items, board = 'paper', tint = 'paper', link, at, gap = 0.45}) => {
  const t0 = at ?? a + 0.1;
  const dark = board === 'dark';
  const bg = dark ? C.inkSoft : C.paperShade;
  const slots = SLOTS[clamp(items.length, 2, 6)];
  const lay = items.map((it, i) => {
    const sl = slots[i % slots.length];
    const asp = it.aspect ?? 1.4;
    let w = it.w ?? sl[2];
    const hMax = items.length <= 2 ? 540 : items.length <= 4 ? 310 : 320;
    if (w / asp > hMax) w = hMax * asp;
    const h = w / asp;
    const rot = it.rot ?? (rand(seed * 3.3 + i * 1.7) - 0.5) * 9;
    const cl = it.credit ? wrapCredit(it.credit, Math.max(w, 340)) : [];
    const pw = Math.max(w + 28, ...cl.map((ln) => textW(ln, TYPE.credit, 'sans', 500) + 28)); // paper widens for a long credit line
    const ex = Math.max(0, cl.length - 1) * 32; // extra room for wrapped credit lines
    return {x: it.x ?? sl[0], y: it.y ?? sl[1], w, h, rot, at: it.at ?? t0 + i * gap, pad: 14, bottom: (it.label && it.credit ? 100 : it.label ? 66 : it.credit ? 44 : 14) + ex, cl, pw};
  });
  // Axis-aligned bounds of each (rotated) print incl. paper margin and shadow.
  const boxOf = (L: (typeof lay)[number]) => {
    const r = (L.rot * Math.PI) / 180;
    const hw = L.pw / 2;
    const hh = (L.h + L.pad + L.bottom) / 2;
    const oy = (L.bottom - L.pad) / 2;
    const ex = Math.abs(Math.cos(r)) * hw + Math.abs(Math.sin(r)) * hh;
    const ey = Math.abs(Math.sin(r)) * hw + Math.abs(Math.cos(r)) * hh;
    return {x0: L.x - Math.sin(r) * oy - ex, x1: L.x - Math.sin(r) * oy + ex, y0: L.y + Math.cos(r) * oy - ey, y1: L.y + Math.cos(r) * oy + ey};
  };
  // A string-link label must fit between the two linked prints: when they sit side by side, push the columns apart.
  const lbl = link?.label;
  const lblW = lbl ? textW(lbl, TYPE.read, 'serif', 600) * 1.06 + 43 * 0.97 + 16 : 0;
  if (link && lbl && link.style !== 'arrow' && items[link.from].x === undefined && items[link.to].x === undefined) {
    const A = boxOf(lay[link.from]);
    const B = boxOf(lay[link.to]);
    const [l, r] = A.x1 <= B.x1 ? [A, B] : [B, A];
    const extra = lblW + 24 - (r.x0 - l.x1);
    if (extra > 0 && Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0) > 0) {
      const mx = (l.x1 + r.x0) / 2;
      lay.forEach((L, i) => {
        if (items[i].x === undefined && items[i].y === undefined) L.x += (L.x < mx ? -1 : 1) * (extra / 2);
      });
    }
  }
  // Rebalance the auto-placed prints around the frame centre (slots are hand-set and drift left/low); explicit x/y stay as given.
  {
    const ext = lay.map(boxOf);
    const bx0 = Math.min(...ext.map((e) => e.x0));
    const bx1 = Math.max(...ext.map((e) => e.x1));
    const by0 = Math.min(...ext.map((e) => e.y0));
    const by1 = Math.max(...ext.map((e) => e.y1));
    const dx = 985 - (bx0 + bx1) / 2; // camera drift 915→1005 + settle: aim a little right so the settled frame is centred
    const dy = clamp(540 - (by0 + by1) / 2, -70, 70);
    lay.forEach((L, i) => {
      if (items[i].x === undefined && items[i].y === undefined) {
        L.x += dx;
        L.y += dy;
      }
    });
  }
  const pinOf = (i: number): XY => {
    const L = lay[i];
    const r = (L.rot * Math.PI) / 180;
    const dy = -L.h / 2 - L.pad + 26;
    return {x: L.x - Math.sin(r) * dy, y: L.y + Math.cos(r) * dy};
  };
  const linkAt = link?.at ?? (lay[lay.length - 1]?.at ?? t0) + 0.8;
  const lp = link ? ramp(t, linkAt, linkAt + 0.9, ease.linear) : 0;
  const mid = link ? {x: (lay[link.from].x + lay[link.to].x) / 2, y: (lay[link.from].y + lay[link.to].y) / 2} : {x: 960, y: 540};
  const k = ramp(t, a - 0.3, b + 0.5, ease.inOutSine);
  const lk = link ? ramp(t, linkAt - 0.2, linkAt + 1.2, ease.inOut) * 0.15 : 0;
  const cam: CamState = breathe({cx: lerp(lerp(915, 1005, k), mid.x, lk), cy: lerp(lerp(548, 532, k), mid.y, lk * 0.5), z: lerp(1.02, 1.06, k) + lk * 0.1, r: 0}, t, 0.8);
  const lineCol = dark ? mixHex(C.inkSoft, C.paperLight, 0.07) : mixHex(C.paperShade, C.ink, 0.06);
  const board_ = (
    <g>
      <rect x={-300} y={-300} width={2520} height={1680} fill={bg} />
      {Array.from({length: 40}, (_, i) => (
        <rect key={`v${i}`} x={-300 + i * 64} y={-300} width={2} height={1680} fill={lineCol} />
      ))}
      {Array.from({length: 28}, (_, i) => (
        <rect key={`h${i}`} x={-300} y={-300 + i * 64} width={2520} height={2} fill={lineCol} />
      ))}
      <LightPool x={960} y={480} r={900} sy={0.75} strength={dark ? 1.4 : 0.8} color={C.lamp} />
    </g>
  );
  const prints = lay.map((L, i) => {
    const it = items[i];
    const p = ramp(t, L.at, L.at + 0.6, ease.linear);
    if (p <= 0) return null;
    const kk = ease.outQuint(p);
    const s = lerp(1.14, 1, kk);
    const rot = L.rot + (1 - kk) * (i % 2 ? -7 : 7);
    const sh = lerp(34, 12, kk);
    const W = L.pw;
    const H = L.h + L.pad + L.bottom;
    const fasten = link && link.style !== 'arrow' && (i === link.from || i === link.to) ? 'pin' : (it.fasten ?? (i % 2 ? 'pin' : 'tape'));
    const f: Focus = [0.5, 0.5, lerp(1.0, 1.06, ramp(t, L.at, b + 1, ease.inOutSine))];
    return (
      <g key={i} transform={`translate(${L.x} ${L.y}) rotate(${rot}) scale(${s})`} opacity={clamp01(p * 3)}>
        <rect x={-W / 2 + sh} y={-L.h / 2 - L.pad + sh * 1.3} width={W} height={H} rx={3} fill={C.ink} opacity={dark ? 0.45 : 0.2} />
        <rect x={-W / 2} y={-L.h / 2 - L.pad} width={W} height={H} rx={3} fill={C.paperLight} />
        <ArchImage slug={slug} src={it.src} x={-L.w / 2} y={-L.h / 2} w={L.w} h={L.h} aspect={it.aspect ?? 1.4} focus={f} tint={tint} />
        {it.credit && (
          <text x={L.w / 2} y={L.h / 2 + (it.label ? 88 : 34)} textAnchor="end" fontFamily={FONT_SANS} fontWeight={500} fontSize={TYPE.credit} fill={C.inkFaint}>
            {L.cl.map((ln, j) => (
              <tspan key={j} x={L.w / 2} dy={j ? 32 : 0}>
                {ln}
              </tspan>
            ))}
          </text>
        )}
        {it.label && (
          <text x={-L.w / 2} y={L.h / 2 + 50} textAnchor="start" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={TYPE.small} fill={C.ink}>
            {it.label}
          </text>
        )}
        {fasten === 'tape' ? (
          <g opacity={ramp(t, L.at + 0.3, L.at + 0.6)}>
            <rect x={-W / 2 - 40} y={-L.h / 2 - L.pad - 16} width={120} height={36} fill={C.paperDeep} opacity={0.82} transform={`rotate(-38 ${-W / 2 + 20} ${-L.h / 2 - L.pad + 2})`} />
            <rect x={W / 2 - 80} y={-L.h / 2 - L.pad - 16} width={120} height={36} fill={C.paperDeep} opacity={0.82} transform={`rotate(38 ${W / 2 - 20} ${-L.h / 2 - L.pad + 2})`} />
          </g>
        ) : (
          <g transform={`translate(0 ${-L.h / 2 - L.pad + 26})`} opacity={ramp(t, L.at + 0.3, L.at + 0.5)}>
            <ellipse cx={6} cy={8} rx={15} ry={12} fill={C.ink} opacity={0.3} />
            <circle r={15} fill={C.oxblood} />
            <circle cx={4} cy={4} r={11} fill={C.oxDeep} opacity={0.5} />
            <circle cx={-4} cy={-5} r={5} fill={C.oxTint} />
          </g>
        )}
      </g>
    );
  });
  let linkEl: React.ReactNode = null;
  if (link && lp > 0) {
    const kind = link.kind ?? 'signal';
    if (link.style === 'arrow') {
      const A = lay[link.from];
      const B = lay[link.to];
      linkEl = (
        <g>
          <Arrow from={{x: A.x, y: A.y}} to={{x: B.x, y: B.y}} p={lp} bend={-60} color={C.paperLight} width={14} head={30} shorten={Math.min(A.w, B.w) * 0.42} />
          <Arrow from={{x: A.x, y: A.y}} to={{x: B.x, y: B.y}} p={lp} bend={-60} color={SEM[kind]} width={7} head={26} shorten={Math.min(A.w, B.w) * 0.42} />
        </g>
      );
    } else {
      const A = pinOf(link.from);
      const B = pinOf(link.to);
      const d = `M${A.x} ${A.y} Q${(A.x + B.x) / 2} ${Math.max(A.y, B.y) + 90} ${B.x} ${B.y}`;
      linkEl = (
        <g>
          <path d={d} stroke={C.ink} strokeWidth={5} fill="none" opacity={0.2} transform="translate(6 10)" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease.inOut(lp)} />
          <path d={d} stroke={SEM[kind] === C.oxblood ? C.oxLight : SEM[kind]} strokeWidth={5} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease.inOut(lp)} />
        </g>
      );
    }
  }
  let lblX = link ? (lay[link.from].x + lay[link.to].x) / 2 : 0;
  let lblY = link ? (link.style === 'arrow' ? Math.min(lay[link.from].y, lay[link.to].y) - 40 : Math.max(pinOf(link.from).y, pinOf(link.to).y) + 70) : 0;
  if (link && lbl) {
    // Keep the label clear of every print: search around the default spot for the nearest free position (else least overlap).
    const lw = lblW;
    const lh = 43 * 1.9 + 16; // Tag height at its phone-readable floor
    const bs = lay.map(boxOf);
    const fa = bs[link.from];
    const ta = bs[link.to];
    if (link.style !== 'arrow' && Math.min(fa.y1, ta.y1) - Math.max(fa.y0, ta.y0) > 0) lblX = fa.x1 <= ta.x0 ? (fa.x1 + ta.x0) / 2 : ta.x1 <= fa.x0 ? (ta.x1 + fa.x0) / 2 : lblX; // centre of the gap between side-by-side prints
    const over = (x: number, y: number) =>
      bs.reduce((acc, q) => acc + Math.max(0, Math.min(x + lw / 2, q.x1 + 6) - Math.max(x - lw / 2, q.x0 - 6)) * Math.max(0, Math.min(y + lh / 2, q.y1 + 6) - Math.max(y - lh / 2, q.y0 - 6)), 0);
    let best = {x: lblX, y: lblY, o: over(lblX, lblY), d: 0};
    for (let dy2 = -400; dy2 <= 400; dy2 += 20) {
      for (let dx2 = -420; dx2 <= 420; dx2 += 20) {
        const x = lblX + dx2;
        const y = lblY + dy2;
        if (x - lw / 2 < 60 || x + lw / 2 > 1860 || y - lh / 2 < 90 || y + lh / 2 > 1000) continue;
        const o = over(x, y);
        const d = Math.hypot(dx2, dy2);
        if (o < best.o - 1 || (o <= best.o + 1 && d < best.d && o < 1)) best = {x, y, o, d};
      }
    }
    lblX = best.x;
    lblY = best.y;
  }
  return (
    <Stage bg={bg}>
      <World
        cam={cam}
        layers={[
          {depth: 0.6, el: board_},
          {
            depth: 1,
            el: (
              <g>
                {prints}
                {linkEl}
                {lbl && <Tag x={lblX} y={lblY} text={lbl} kind={link?.kind ?? 'signal'} p={ramp(t, linkAt + 0.6, linkAt + 1.2, ease.linear)} anchor="center" />}
              </g>
            ),
          },
        ]}
      />
      <Vignette strength={dark ? 1.1 : 0.6} />
    </Stage>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 5 · CompareImagesShot

export type CompareSideImg = {src: string; aspect?: number; label: string; sub?: string; tag?: {text: string; kind?: Sem}; credit?: string; from?: Focus; to?: Focus};

/**
 * CompareImagesShot — two images: mode 'side' (two framed panels + labels + semantic tags, "vs" seal) or 'wipe'
 * (full-frame, the right image wipes in behind a slider handle that settles at `split` and breathes). Then vs now,
 * claim vs evidence. Right side arrives at rightAt (side) / wipes at rightAt (wipe).
 */
export const CompareImagesShot: React.FC<ShotBase & {slug: string; left: CompareSideImg; right: CompareSideImg; mode?: 'side' | 'wipe'; split?: number; tint?: ArchTint; title?: string; at?: number; rightAt?: number}> = ({
  t,
  a,
  b,
  tone = 'shade',
  seed = 1,
  slug,
  left,
  right,
  mode = 'side',
  split = 0.5,
  tint = 'paper',
  title,
  at,
  rightAt,
}) => {
  const t0 = at ?? a + 0.1;
  const tR = rightAt ?? t0 + 0.7;
  const fOf = (s: CompareSideImg, i: number) => alive(lerpFocus(s.from ?? [0.5, 0.5, 1.02], s.to ?? [0.5, 0.47, 1.12], ramp(t, t0, b + 0.5, ease.inOutSine)), t, seed + i);
  if (mode === 'wipe') {
    const sp = ramp(t, tR, tR + 1.3, ease.inOutQuint);
    const X = lerp(1920, split * 1920, sp) + noise1(t * 0.3, seed) * 10 * sp;
    const lp = ramp(t, t0, t0 + 0.6, ease.linear);
    return (
      <Bleed>
        <ArchImage slug={slug} src={left.src} x={0} y={0} w={1920} h={1080} aspect={left.aspect ?? 1.5} focus={fOf(left, 0)} tint={tint} o={ramp(t, t0 - 0.35, t0 + 0.05, ease.linear)} bg={C.ink} />
        {X < 1919 && <ArchImage slug={slug} src={right.src} x={0} y={0} w={1920} h={1080} aspect={right.aspect ?? 1.5} focus={fOf(right, 1)} tint={tint} clip={`inset(0 0 0 ${X}px)`} bg={C.ink} />}
        <g opacity={clamp01(sp * 4)}>
          <rect x={X - 4} y={0} width={8} height={1080} fill={C.paperLight} />
          <circle cx={X} cy={540} r={40} fill={C.paperLight} />
          <circle cx={X} cy={540} r={40} fill="none" stroke={C.ink} strokeWidth={4} />
          <path d={`M${X - 10} 524 L${X - 24} 540 L${X - 10} 556 M${X + 10} 524 L${X + 24} 540 L${X + 10} 556`} stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <LabelPlate x={96} y={120} text={left.label} note={left.sub} kind={left.tag?.kind ?? 'ink'} p={lp} />
        {left.tag && <Tag x={96} y={left.sub ? 222 : 196} text={left.tag.text} kind={left.tag.kind ?? 'ink'} p={ramp(t, t0 + 0.3, t0 + 0.9, ease.linear)} />}
        <LabelPlate x={1824} y={120} text={right.label} note={right.sub} kind={right.tag?.kind ?? 'ink'} p={ramp(t, tR + 0.8, tR + 1.4, ease.linear)} anchor="end" />
        {right.tag && <Tag x={1824} y={right.sub ? 222 : 196} text={right.tag.text} kind={right.tag.kind ?? 'ink'} p={ramp(t, tR + 1.1, tR + 1.7, ease.linear)} anchor="right" />}
        <CreditLine text={left.credit} x={48} anchor="start" p={ramp(t, t0 + 0.2, t0 + 0.6)} />
        <CreditLine text={right.credit} p={ramp(t, tR + 0.6, tR + 1)} />
      </Bleed>
    );
  }
  const P = tonePal(tone);
  const pw = 780;
  const ph = title ? 560 : 600;
  const py = title ? 250 : 200;
  const panel = (s: CompareSideImg, i: number, tIn: number) => {
    const x = i ? 1000 : 140;
    const p = ramp(t, tIn - 0.2, tIn + 0.5, ease.linear);
    if (p <= 0) return null;
    const k = ease.outQuint(p);
    return (
      <g key={i} opacity={clamp01(p * 2.5)} transform={`translate(0 ${(1 - k) * 50})`}>
        <rect x={x - 14 + 12} y={py - 14 + 16} width={pw + 28} height={ph + 28} rx={4} fill={C.ink} opacity={P.dark ? 0.45 : 0.16} />
        <rect x={x - 14} y={py - 14} width={pw + 28} height={ph + 28} rx={4} fill={C.paperLight} />
        <ArchImage slug={slug} src={s.src} x={x} y={py} w={pw} h={ph} aspect={s.aspect ?? 1.5} focus={fOf(s, i)} tint={tint} />
        {s.tag && <Tag x={x + 24} y={py + 40} text={s.tag.text} kind={s.tag.kind ?? 'ink'} p={ramp(t, tIn + 0.4, tIn + 1, ease.linear)} />}
        <text x={x} y={py + ph + 80} fontFamily={FONT_SERIF} fontWeight={700} fontSize={46} fill={P.fg} opacity={ramp(t, tIn + 0.15, tIn + 0.6)}>
          {s.label}
        </text>
        {s.sub && <Kicker x={x} y={py + ph + 122} text={s.sub} anchor="start" color={P.mute} p={ramp(t, tIn + 0.3, tIn + 0.8)} />}
        <CreditLine text={s.credit} x={x + pw - 12} y={py + ph - 14} anchor="end" p={ramp(t, tIn + 0.3, tIn + 0.8)} />
      </g>
    );
  };
  const vs = ramp(t, tR + 0.3, tR + 0.8, ease.linear);
  return (
    <Stage bg={P.bg}>
      <World
        cam={breathe({cx: 960, cy: 540, z: lerp(1, 1.03, ramp(t, a, b + 1, ease.inOutSine)), r: 0}, t, 0.6)}
        layers={[
          {depth: 0.4, el: <Backdrop tone={tone} motif="none" seed={seed} t={t} />},
          {
            depth: 1,
            el: (
              <g>
                {title && (
                  <text x={960} y={160} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={60} fill={P.fg} opacity={ramp(t, t0 - 0.2, t0 + 0.4)}>
                    {title}
                  </text>
                )}
                {panel(left, 0, t0)}
                {panel(right, 1, tR)}
                {vs > 0 && (
                  <g transform={`translate(960 ${py + ph / 2}) scale(${ease.outBack(vs)})`}>
                    <circle r={48} fill={P.dark ? C.inkSoft : C.paperLight} />
                    <circle r={48} fill="none" stroke={P.accent} strokeWidth={4} />
                    <text y={13} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={700} fontSize={38} fill={P.accent}>
                      vs
                    </text>
                  </g>
                )}
              </g>
            ),
          },
        ]}
      />
      <Vignette strength={P.dark ? 1.1 : 0.55} />
    </Stage>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 6 · DocumentScanShot

export type DocRegion = {rx: number; ry: number; rw: number; rh: number; at?: number; kind?: Sem; label?: string; text?: string};

/**
 * DocumentScanShot — a document/manuscript on the desk: a lamp-coloured scan bar sweeps it (revealing it), then each
 * region (rx, ry = TOP-LEFT, rw×rh, 0..1 of the image) gets a marker highlight + semantic outline on cue, with a
 * transcription / translation card (label + short text) appearing in the right column, linked by a leader line.
 * `lens` = a magnifier that glides to the active region. Keep ≤ 3 regions with text.
 */
export const DocumentScanShot: React.FC<ArchBase & {src: string; aspect?: number; regions: DocRegion[]; lens?: boolean; scan?: boolean; kicker?: string; title?: string; at?: number; gap?: number}> = ({
  t,
  a,
  b,
  tone = 'shade',
  seed = 1,
  slug,
  src,
  aspect = 0.75,
  regions,
  lens = true,
  scan = true,
  tint = 'paper',
  credit,
  kicker,
  title,
  at,
  gap = 1.1,
}) => {
  const P = tonePal(tone);
  const t0 = at ?? a + 0.1;
  const hasText = regions.some((r) => r.text || r.label);
  const dh = Math.min(880, 900 / aspect);
  const dw = dh * aspect;
  const x0 = hasText ? 170 : 960 - dw / 2;
  const y0 = 545 - dh / 2;
  const scanEnd = scan ? t0 + 1.3 : t0;
  const ats = regions.map((r, i) => r.at ?? scanEnd + 0.3 + i * gap);
  let act = -1;
  ats.forEach((s, i) => {
    if (t >= s) act = i;
  });
  const rc = (r: DocRegion) => ({x: x0 + (r.rx + r.rw / 2) * dw, y: y0 + (r.ry + r.rh / 2) * dh});
  const focusPt = act >= 0 ? rc(regions[act]) : {x: x0 + dw / 2, y: 540};
  const fk = act >= 0 ? ramp(t, ats[act], ats[act] + 1, ease.inOut) : 0;
  const prevPt = act > 0 ? rc(regions[act - 1]) : {x: x0 + dw / 2, y: 540};
  const fp = {x: lerp(prevPt.x, focusPt.x, act >= 0 ? fk : 0), y: lerp(prevPt.y, focusPt.y, act >= 0 ? fk : 0)};
  const cam = breathe({cx: 960 + (fp.x - 960) * 0.08, cy: 540 + (fp.y - 540) * 0.1, z: lerp(1, 1.045, ramp(t, a, b + 1, ease.inOutSine)), r: 0}, t, 0.6);
  const docP = ramp(t, t0 - 0.3, t0 + 0.5, ease.linear);
  const sq = ramp(t, t0, scanEnd, ease.inOutSine);
  const scanY = y0 + dh * sq;
  const colX = x0 + dw + 110;
  const colW = 1790 - colX;
  // cards stacked in the right column
  const cardTop = title || kicker ? 330 : 230;
  let cy = cardTop;
  const cards = regions.map((r, i) => {
    const size = TYPE.read;
    const lines = r.text ? Math.max(1, Math.ceil((textW(r.text, size, 'serif') * 1.12) / (colW - 90))) : 0;
    const h = (r.label ? 74 : 20) + lines * size * 1.3 + 34;
    const c = {y: cy, h};
    cy += h + 28;
    return c;
  });
  const lensR = 150;
  const mag = 2.3;
  const lensPos = (i: number) => {
    const c = rc(regions[i]);
    return {x: clamp(c.x - 40, x0 + 60, x0 + dw - 60), y: c.y - lensR - 50 < y0 + 40 ? c.y + lensR + 50 : c.y - lensR - 50};
  };
  const lp = lens && act >= 0 ? ramp(t, ats[0], ats[0] + 0.6, ease.linear) : 0;
  const L0 = act > 0 ? lensPos(act - 1) : act >= 0 ? lensPos(act) : {x: 0, y: 0};
  const L1 = act >= 0 ? lensPos(act) : L0;
  const lk = ramp(t, ats[Math.max(0, act)], ats[Math.max(0, act)] + 0.8, ease.inOut);
  const LP = {x: lerp(L0.x, L1.x, lk), y: lerp(L0.y, L1.y, lk) + noise1(t * 0.4, seed) * 4};
  // lens shows the doc point under its centre
  const R0 = act > 0 ? rc(regions[act - 1]) : act >= 0 ? rc(regions[act]) : {x: 0, y: 0};
  const R1 = act >= 0 ? rc(regions[act]) : R0;
  const lrx = (lerp(R0.x, R1.x, lk) - x0) / dw;
  const lry = (lerp(R0.y, R1.y, lk) - y0) / dh;
  return (
    <Stage bg={P.bg}>
      <World
        cam={cam}
        layers={[
          {depth: 0.4, el: <Backdrop tone={tone} motif="none" seed={seed} t={t} />},
          {
            depth: 1,
            el: (
              <g>
                <LightPool x={x0 + dw / 2} y={y0 + dh * 0.4} r={dh * 0.9} strength={P.dark ? 1.4 : 0.9} color={C.lamp} />
                <g opacity={docP} transform={`translate(0 ${(1 - ease.outQuint(docP)) * 40})`}>
                  <rect x={x0 - 12 + 14} y={y0 - 12 + 18} width={dw + 24} height={dh + 24} rx={3} fill={C.ink} opacity={P.dark ? 0.45 : 0.2} />
                  <rect x={x0 - 12} y={y0 - 12} width={dw + 24} height={dh + 24} rx={3} fill={C.paperLight} />
                  <ArchImage slug={slug} src={src} x={x0} y={y0} w={dw} h={dh} aspect={aspect} tint={tint} />
                  {scan && sq < 1 && <rect x={x0} y={scanY} width={dw} height={y0 + dh - scanY} fill={C.ink} opacity={0.28} />}
                  {scan && sq > 0 && sq < 1 && (
                    <g>
                      <rect x={x0} y={Math.max(y0, scanY - 70)} width={dw} height={Math.min(70, scanY - y0)} fill={C.lamp} opacity={0.22} />
                      <rect x={x0 - 20} y={scanY - 3} width={dw + 40} height={6} rx={3} fill={C.lamp} />
                    </g>
                  )}
                </g>
                {regions.map((r, i) => {
                  const p = ramp(t, ats[i], ats[i] + 0.5, ease.inOut);
                  if (p <= 0) return null;
                  const col = SEM[r.kind ?? 'caution'];
                  const rx = x0 + r.rx * dw;
                  const ry = y0 + r.ry * dh;
                  const rw = r.rw * dw;
                  const rh = r.rh * dh;
                  const dimmed = i < act ? 0.7 : 1;
                  const cd = cards[i];
                  const hasCard = !!(r.text || r.label);
                  const lineP = ramp(t, ats[i] + 0.3, ats[i] + 0.8, ease.inOut);
                  const cp = ramp(t, ats[i] + 0.55, ats[i] + 1.1, ease.linear);
                  const ly = cd.y + 40;
                  return (
                    <g key={i} opacity={dimmed}>
                      <rect x={rx} y={ry} width={rw * p} height={rh} fill={C.cautionLight} opacity={0.42} />
                      <rect x={rx - 6} y={ry - 6} width={rw + 12} height={rh + 12} rx={6} fill="none" stroke={col} strokeWidth={5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
                      {hasCard && (
                        <g>
                          <path d={`M${rx + rw + 6} ${ry + rh / 2} L${colX - 50} ${ry + rh / 2} L${colX - 20} ${ly} L${colX} ${ly}`} stroke={col} strokeWidth={4} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - lineP} strokeLinejoin="round" />
                          <circle cx={rx + rw + 6} cy={ry + rh / 2} r={8 * lineP} fill={col} />
                          {cp > 0 && (
                            <g opacity={clamp01(cp * 2)} transform={`translate(${(1 - ease.outQuint(cp)) * 30} 0)`}>
                              <rect x={colX + 10} y={cd.y + 12} width={colW} height={cd.h} rx={10} fill={C.ink} opacity={P.dark ? 0.4 : 0.14} />
                              <rect x={colX} y={cd.y} width={colW} height={cd.h} rx={10} fill={P.dark ? C.inkSoft : C.paperLight} />
                              <rect x={colX} y={cd.y} width={9} height={cd.h} rx={3} fill={col} />
                              {r.label && <Kicker x={colX + 40} y={cd.y + 56} text={r.label} anchor="start" size={TYPE.small} color={col} />}
                              {r.text && <Para x={colX + 40} y={cd.y + (r.label ? 80 : 22)} w={colW - 80} h={cd.h} text={`“${r.text}”`} size={TYPE.read} italic weight={500} color={P.fg} lineHeight={1.3} p={ramp(cp, 0.3, 1)} />}
                            </g>
                          )}
                        </g>
                      )}
                    </g>
                  );
                })}
                {lp > 0 && (
                  <g opacity={lp} transform={`translate(${LP.x} ${LP.y}) scale(${lerp(0.85, 1, ease.outBack(lp))}) translate(${-LP.x} ${-LP.y})`}>
                    <line x1={LP.x - lensR * 0.7} y1={LP.y + lensR * 0.7} x2={LP.x - lensR * 1.35} y2={LP.y + lensR * 1.35} stroke={C.woodDark} strokeWidth={30} strokeLinecap="round" />
                    <circle cx={LP.x + 10} cy={LP.y + 14} r={lensR + 8} fill={C.ink} opacity={0.22} />
                    <foreignObject x={LP.x - lensR} y={LP.y - lensR} width={lensR * 2} height={lensR * 2}>
                      <div style={{width: lensR * 2, height: lensR * 2, borderRadius: '50%', overflow: 'hidden', position: 'relative', background: C.paperLight}}>
                        <Img
                          src={staticFile(`${slug}/${src}`)}
                          style={{position: 'absolute', left: lensR - lrx * dw * mag, top: lensR - lry * dh * mag, width: dw * mag, height: dh * mag, maxWidth: 'none', filter: FILTER[tint]}}
                        />
                      </div>
                    </foreignObject>
                    <circle cx={LP.x} cy={LP.y} r={lensR} fill="none" stroke={C.ink} strokeWidth={12} />
                    <circle cx={LP.x} cy={LP.y} r={lensR - 9} fill="none" stroke={C.paperLight} strokeWidth={3} opacity={0.6} />
                    <path d={`M${LP.x - lensR * 0.62} ${LP.y - lensR * 0.3} A${lensR * 0.7} ${lensR * 0.7} 0 0 1 ${LP.x - lensR * 0.3} ${LP.y - lensR * 0.62}`} stroke={C.paperLight} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.7} />
                  </g>
                )}
                {(kicker || title) && (
                  <g opacity={ramp(t, t0, t0 + 0.6)}>
                    {kicker && <Kicker x={colX} y={title ? 200 : 210} text={kicker} anchor="start" color={P.accent} />}
                    {title && (
                      <text x={colX} y={kicker ? 268 : 240} fontFamily={FONT_SERIF} fontWeight={700} fontSize={54} fill={P.fg}>
                        {title}
                      </text>
                    )}
                  </g>
                )}
              </g>
            ),
          },
        ]}
      />
      <Vignette strength={P.dark ? 1.1 : 0.55} />
      <CreditLine text={credit} p={ramp(t, t0 + 0.3, t0 + 0.7)} onImage={false} dark={P.dark} />
    </Stage>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 7 · AnnotatedImageShot

type Pt2 = [number, number];
export type Overlay =
  | {kind: 'arrow'; from: Pt2; to: Pt2; at?: number; sem?: Sem; bend?: number; label?: string}
  | {kind: 'outline'; rx: number; ry: number; rw: number; rh: number; at?: number; sem?: Sem; shape?: 'ellipse' | 'box'; dashed?: boolean; label?: string}
  | {kind: 'label'; rx: number; ry: number; text: string; note?: string; at?: number; sem?: Sem; dx?: number; dy?: number}
  | {kind: 'icon'; rx: number; ry: number; icon: IconName; at?: number; sem?: Sem; label?: string}
  | {kind: 'flow'; points: Pt2[]; at?: number; sem?: Sem; label?: string; dur?: number};

/** Catmull-Rom sample through points → polyline + cumulative lengths. */
const spline = (pts: XY[], per = 14) => {
  const out: XY[] = [];
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    for (let s = 0; s < per; s++) {
      const u = s / per;
      const u2 = u * u;
      const u3 = u2 * u;
      const f = (a0: number, a1: number, a2: number, a3: number) => 0.5 * (2 * a1 + (-a0 + a2) * u + (2 * a0 - 5 * a1 + 4 * a2 - a3) * u2 + (-a0 + 3 * a1 - 3 * a2 + a3) * u3);
      out.push({x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y)});
    }
  }
  out.push(pts[n - 1]);
  const cum = [0];
  for (let i = 1; i < out.length; i++) cum.push(cum[i - 1] + Math.hypot(out[i].x - out[i - 1].x, out[i].y - out[i - 1].y));
  return {pts: out, cum};
};
const alongPath = (s: ReturnType<typeof spline>, d: number): XY => {
  const {pts, cum} = s;
  const L = cum[cum.length - 1];
  const dd = clamp(d, 0, L);
  let i = 1;
  while (i < cum.length - 1 && cum[i] < dd) i++;
  const k = (dd - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  return {x: lerp(pts[i - 1].x, pts[i].x, k), y: lerp(pts[i - 1].y, pts[i].y, k)};
};

/**
 * AnnotatedImageShot — "animation on top of reality" (the Binly signature): a full-frame image with flat-vector
 * overlays drawn on cue: arrows, outlines (solid / dashed = inferred), callout labels, icon medallions, and flow lines
 * with travelling dots. All coords 0..1 of the image; overlays track the slow from→to move. `dim` = ink veil so marks pop.
 */
export const AnnotatedImageShot: React.FC<ArchBase & {src: string; aspect?: number; overlays: Overlay[]; from?: Focus; to?: Focus; dim?: number; kicker?: string; at?: number; gap?: number}> = ({
  t,
  a,
  b,
  seed = 1,
  slug,
  src,
  aspect = 1.5,
  overlays,
  from = [0.5, 0.5, 1.02],
  to = [0.5, 0.48, 1.1],
  dim = 0.12,
  tint = 'paper',
  caption,
  credit,
  kicker,
  at,
  gap = 0.5,
}) => {
  const t0 = at ?? a + 0.1;
  const f = focusAt(t, a, Math.max(b, a + 3), from, to, undefined, seed);
  const v = viewRect(1920, 1080, aspect, f);
  const P = (rx: number, ry: number) => onView(v, rx, ry);
  const els = overlays.map((ov, i) => {
    const s = ov.at ?? t0 + 0.4 + i * gap;
    const col = SEM[ov.sem ?? 'signal'];
    const p = ramp(t, s, s + 0.7, ease.linear);
    if (p <= 0) return null;
    if (ov.kind === 'arrow') {
      const A = P(...ov.from);
      const B = P(...ov.to);
      return (
        <g key={i}>
          <Arrow from={A} to={B} p={p} bend={ov.bend ?? 40} color={C.paperLight} width={15} head={30} />
          <Arrow from={A} to={B} p={p} bend={ov.bend ?? 40} color={col} width={8} head={26} />
          {ov.label && <LabelPlate x={A.x + (A.x > B.x ? 26 : -26)} y={A.y} text={ov.label} kind={ov.sem ?? 'signal'} p={ramp(t, s + 0.3, s + 0.9, ease.linear)} anchor={A.x > B.x ? 'start' : 'end'} />}
        </g>
      );
    }
    if (ov.kind === 'outline') {
      const c = P(ov.rx, ov.ry);
      const w = ov.rw * v.IW;
      const h = ov.rh * v.IH;
      const col2 = ov.dashed && !ov.sem ? SEM.theory : col;
      const right = c.x < 960;
      return (
        <g key={i}>
          <HaloShape shape={ov.shape ?? 'ellipse'} cx={c.x} cy={c.y} w={w} h={h} p={p} color={col2} width={6} dashed={ov.dashed} t={t} />
          {ov.label && <LabelPlate x={right ? c.x - w * 0.3 : c.x + w * 0.3} y={Math.max(130, c.y - h / 2 - 34)} text={ov.label} kind={ov.sem ?? (ov.dashed ? 'theory' : 'signal')} p={ramp(t, s + 0.4, s + 1, ease.linear)} anchor={right ? 'start' : 'end'} />}
        </g>
      );
    }
    if (ov.kind === 'label') {
      const c = P(ov.rx, ov.ry);
      const dx = ov.dx ?? (c.x < 960 ? 140 : -140);
      const dy = ov.dy ?? -90;
      const lk = ease.inOut(ramp(t, s + 0.1, s + 0.5));
      return (
        <g key={i}>
          <path d={`M${c.x} ${c.y} L${c.x + dx} ${c.y + dy}`} stroke={C.paperLight} strokeWidth={10} opacity={0.85 * lk} />
          <path d={`M${c.x} ${c.y} L${c.x + dx} ${c.y + dy}`} stroke={col} strokeWidth={4.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - lk} />
          <circle cx={c.x} cy={c.y} r={11 * ease.outBack(clamp01(p * 2))} fill={col} stroke={C.paperLight} strokeWidth={4} />
          <LabelPlate x={c.x + dx} y={c.y + dy} text={ov.text} note={ov.note} kind={ov.sem ?? 'signal'} p={ramp(t, s + 0.35, s + 0.95, ease.linear)} anchor={dx >= 0 ? 'start' : 'end'} />
        </g>
      );
    }
    if (ov.kind === 'icon') {
      const c = P(ov.rx, ov.ry);
      const k = ease.outBack(clamp01(p * 1.4));
      return (
        <g key={i}>
          <g transform={`translate(${c.x} ${c.y + noise1(t * 0.5, i) * 4}) scale(${k})`}>
            <circle cx={5} cy={8} r={60} fill={C.ink} opacity={0.3} />
            <circle r={60} fill={C.paperLight} />
            <circle r={52} fill="none" stroke={col} strokeWidth={5} />
          </g>
          <Icon name={ov.icon} x={c.x} y={c.y + noise1(t * 0.5, i) * 4} s={0.78} color={C.ink} accent={col} knock={C.paperLight} p={ramp(t, s + 0.15, s + 0.7, ease.linear)} />
          {ov.label && <LabelPlate x={c.x} y={c.y + 100} text={ov.label} kind={ov.sem ?? 'signal'} p={ramp(t, s + 0.4, s + 0.9, ease.linear)} anchor="middle" />}
        </g>
      );
    }
    // flow
    const sp = spline(ov.points.map(([x, y]) => P(x, y)));
    const L = sp.cum[sp.cum.length - 1];
    const dur = ov.dur ?? 1.2;
    const dp = ease.inOut(ramp(t, s, s + dur));
    const d = sp.pts.map((q, j) => `${j ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ');
    const dots = dp >= 1 ? [0, 1, 2, 3].map((j) => alongPath(sp, (((t - s - dur) * 160 + (j * L) / 4) % L + L) % L)) : [];
    const end = alongPath(sp, L);
    return (
      <g key={i}>
        <path d={d} stroke={C.paperLight} strokeWidth={13} fill="none" opacity={0.8} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - dp} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} stroke={col} strokeWidth={6} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - dp} strokeLinecap="round" strokeLinejoin="round" />
        {dots.map((q, j) => (
          <circle key={j} cx={q.x} cy={q.y} r={9} fill={C.paperLight} stroke={col} strokeWidth={4} />
        ))}
        {dp > 0.95 && <circle cx={end.x} cy={end.y} r={14} fill={col} stroke={C.paperLight} strokeWidth={4} />}
        {ov.label && <LabelPlate x={end.x + 30} y={end.y} text={ov.label} kind={ov.sem ?? 'signal'} p={ramp(t, s + dur * 0.7, s + dur + 0.4, ease.linear)} anchor={end.x > 1400 ? 'end' : 'start'} />}
      </g>
    );
  });
  return (
    <Bleed>
      <ArchImage slug={slug} src={src} x={0} y={0} w={1920} h={1080} aspect={aspect} focus={f} tint={tint} dim={dim * ramp(t, t0, t0 + 0.6)} o={ramp(t, a - 0.35, a + 0.05, ease.linear)} bg={C.ink} />
      {els}
      {kicker && <LabelPlate x={96} y={110} text={kicker} kind="ink" p={ramp(t, t0, t0 + 0.6, ease.linear)} size={TYPE.small} />}
      {caption && <LowerThird text={caption} p={ramp(t, t0 + 0.2, t0 + 0.9, ease.linear)} />}
      <CreditLine text={credit} p={ramp(t, t0 + 0.2, t0 + 0.6)} />
    </Bleed>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 8 · ImageInWorldShot

/**
 * ImageInWorldShot — the image as a physical object in an animated scene, then the camera pushes into it until it
 * fills the frame ("zoom into the evidence"). setting 'desk' (top-down desk under a lamp: notes, loupe, pencil),
 * 'museum' (framed on a gallery wall, visitors looking), 'hands' (a Person holds the print up; `person` overrides).
 * pushAt (default a + 1.4) / pushDur (1.6 s); after the push the image keeps a slow Ken Burns + caption/credit.
 */
export const ImageInWorldShot: React.FC<
  ArchBase & {src: string; aspect?: number; setting?: 'desk' | 'museum' | 'hands'; pushAt?: number | false; pushDur?: number; label?: string; kicker?: string; person?: Partial<PersonProps>; at?: number}
> = ({t, a, b, seed = 1, slug, src, aspect = 1.5, setting = 'desk', pushAt, pushDur = 1.6, label, kicker, person, tint = 'paper', caption, credit, at}) => {
  const t0 = at ?? a + 0.1;
  const tp = pushAt === false ? Infinity : (pushAt ?? a + 1.4);
  // image window (world) per setting
  let w: number;
  let cx: number;
  let cy: number;
  let rot: number;
  let pad: number;
  let hands: PersonProps | null = null;
  if (setting === 'museum') {
    w = Math.min(640, 400 * aspect);
    cx = 960;
    cy = 420;
    rot = 0;
    pad = Math.min(w, w / aspect) * 0.1;
  } else if (setting === 'hands') {
    hands = {x: 560, y: 1290, s: 1.75, facing: 1, pose: 'present', arms: {front: [62, 28], back: [48, 40]}, outfit: 'coat', hair: 'short', t, seed, ...person};
    const hp = personHands(hands);
    w = Math.min(560, 420 * aspect);
    cx = hp.front.x + w / 2 - 40;
    cy = hp.front.y - 40;
    rot = 3;
    pad = 16;
  } else {
    w = Math.min(820, 520 * aspect);
    cx = 960;
    cy = 520;
    rot = -3.5;
    pad = 22;
  }
  const h = w / aspect;
  const zFill = Math.max(1920 / w, 1080 / h) * 1.01;
  const pk = ramp(t, tp, tp + pushDur, ease.inOutQuint);
  const wide: CamState = breathe({cx: 960, cy: 540, z: lerp(1, 1.04, ramp(t, a, tp + 0.5, ease.inOutSine)), r: 0}, t, 0.7);
  const post = ramp(t, tp + pushDur, Math.max(b, tp + pushDur + 3) + 1, ease.inOutSine);
  const cam: CamState = {
    cx: lerp(wide.cx, cx, pk),
    cy: lerp(wide.cy, cy, pk),
    z: Math.exp(lerp(Math.log(wide.z), Math.log(zFill * (1 + 0.06 * post)), pk)),
    r: lerp(wide.r, -rot, pk),
  };
  const f: Focus = [0.5, 0.5, 1];
  const k = ease.outQuint(ramp(t, t0 - 0.3, t0 + 0.6, ease.linear));
  const img = <ArchImage slug={slug} src={src} x={cx - w / 2} y={cy - h / 2} w={w} h={h} aspect={aspect} focus={f} tint={tint} />;
  let scene: React.ReactNode;
  if (setting === 'museum') {
    const wall = mixC(C.paperShade, C.paperDeep, 0.25);
    const W = w + pad * 2;
    const H = h + pad * 2;
    scene = (
      <g>
        <rect x={-400} y={-300} width={2720} height={1700} fill={wall} />
        <rect x={-400} y={-300} width={2720} height={380} fill={mixC(wall, C.ink, 0.06)} />
        <rect x={-400} y={80} width={2720} height={10} fill={mixC(wall, C.ink, 0.15)} />
        <rect x={-400} y={700} width={2720} height={14} fill={mixC(wall, C.ink, 0.12)} />
        <Floor y={880} color={C.paperDeep} kind="tiles" seed={seed} />
        <LightPool x={cx} y={cy - 80} r={620} sy={0.9} strength={1.2} color={C.lamp} />
        {[-1, 1].map((sd) => (
          <g key={sd} opacity={0.55}>
            <rect x={960 + sd * 640 - 150} y={300} width={300} height={220} fill={C.paperLight} />
            <rect x={960 + sd * 640 - 130} y={320} width={260} height={180} fill={mixHex(C.paperDeep, C.ink, 0.15)} />
          </g>
        ))}
        <rect x={cx - W / 2 - 12 + 14} y={cy - H / 2 - 12 + 18} width={W + 24} height={H + 24} fill={C.ink} opacity={0.2} />
        <rect x={cx - W / 2 - 12} y={cy - H / 2 - 12} width={W + 24} height={H + 24} fill={C.woodDark} />
        <rect x={cx - W / 2} y={cy - H / 2} width={W} height={H} fill={C.paperLight} />
        {img}
        <rect x={cx + W / 2 + 40} y={cy + H / 2 - 70} width={150} height={70} fill={C.paperLight} />
        <rect x={cx + W / 2 + 56} y={cy + H / 2 - 54} width={90} height={8} fill={C.inkFaint} />
        <rect x={cx + W / 2 + 56} y={cy + H / 2 - 36} width={110} height={6} fill={C.paperDark} />
        <rect x={cx + W / 2 + 56} y={cy + H / 2 - 24} width={70} height={6} fill={C.paperDark} />
        <Bench x={960} y={1000} w={520} h={100} color={C.woodDark} />
        <Person x={520} y={960} s={0.95} facing={1} t={t} seed={seed} outfit="coat" hair="bun" look={0.3} pose="handsBack" />
        <Person x={1420} y={970} s={1.0} facing={-1} t={t} seed={seed + 3} outfit="casual" hair="short" skin={3} pose="point" arms={{front: [72, 6]}} />
      </g>
    );
  } else if (setting === 'hands') {
    scene = (
      <g>
        <Study t={t} seed={seed} layer="back" />
        <rect x={-400} y={-300} width={2720} height={1700} fill={C.ink} opacity={0.25} />
        <LightPool x={cx} y={cy} r={700} strength={1.3} color={C.lamp} />
        {hands && <Person {...hands} />}
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
          <rect x={cx - w / 2 - pad + 12} y={cy - h / 2 - pad + 16} width={w + pad * 2} height={h + pad * 2} fill={C.ink} opacity={0.35} />
          <rect x={cx - w / 2 - pad} y={cy - h / 2 - pad} width={w + pad * 2} height={h + pad * 2} rx={3} fill={C.paperLight} />
          {img}
        </g>
        {hands && <ellipse cx={personHands(hands).front.x + 6} cy={personHands(hands).front.y - 6} rx={20} ry={26} fill={C.skin[hands.skin ?? 1]} stroke={C.skinShade[hands.skin ?? 1]} strokeWidth={3} />}
      </g>
    );
  } else {
    const plank = 150;
    scene = (
      <g>
        <rect x={-400} y={-300} width={2720} height={1700} fill={C.wood} />
        {Array.from({length: 12}, (_, i) => (
          <g key={i}>
            <rect x={-400} y={-300 + i * plank} width={2720} height={plank} fill={i % 2 ? C.wood : mixHex(C.wood, C.woodLight, 0.25)} />
            <rect x={-400} y={-300 + i * plank} width={2720} height={4} fill={C.woodDark} opacity={0.7} />
            <rect x={-400 + rand(seed + i) * 1600} y={-300 + i * plank} width={4} height={plank} fill={C.woodDark} opacity={0.5} />
          </g>
        ))}
        <LightPool x={cx - 120} y={cy - 60} r={900} strength={1.5} color={C.lamp} />
        <rect x={cx - 640} y={cy - 360} width={420} height={540} fill={C.paperShade} transform={`rotate(-12 ${cx - 430} ${cy - 90})`} />
        <rect x={cx + 260} y={cy + 40} width={520} height={380} fill={C.paperLight} transform={`rotate(9 ${cx + 520} ${cy + 230})`} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={cx + 320} y={cy + 110 + i * 46} width={380 - (i % 2) * 90} height={10} fill={C.paperDark} transform={`rotate(9 ${cx + 520} ${cy + 230})`} />
        ))}
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
          <rect x={cx - w / 2 - pad + 16} y={cy - h / 2 - pad + 22} width={w + pad * 2} height={h + pad * 2} fill={C.ink} opacity={0.3} />
          <rect x={cx - w / 2 - pad} y={cy - h / 2 - pad} width={w + pad * 2} height={h + pad * 2} rx={3} fill={C.paperLight} />
          {img}
        </g>
        <g transform={`translate(${cx + w / 2 + 120} ${cy - h / 2 + 40})`}>
          <line x1={60} y1={60} x2={170} y2={170} stroke={C.woodDark} strokeWidth={30} strokeLinecap="round" />
          <circle cx={6} cy={10} r={92} fill={C.ink} opacity={0.25} />
          <circle r={90} fill={C.paperLight} opacity={0.25} />
          <circle r={90} fill="none" stroke={C.ink} strokeWidth={12} />
        </g>
        <g transform={`rotate(-28 ${cx - w / 2 - 80} ${cy + h / 2 + 60})`}>
          <rect x={cx - w / 2 - 300} y={cy + h / 2 + 50} width={420} height={22} rx={4} fill={C.caution} />
          <path d={`M${cx - w / 2 + 120} ${cy + h / 2 + 50} L${cx - w / 2 + 160} ${cy + h / 2 + 61} L${cx - w / 2 + 120} ${cy + h / 2 + 72} Z`} fill={C.bone} />
          <rect x={cx - w / 2 - 300} y={cy + h / 2 + 50} width={40} height={22} fill={C.oxblood} />
        </g>
      </g>
    );
  }
  const tagP = ramp(t, t0 + 0.5, t0 + 1.1, ease.linear) * (1 - ramp(t, tp - 0.2, tp + 0.2));
  const after = ramp(t, tp + pushDur - 0.1, tp + pushDur + 0.6, ease.linear);
  return (
    <Stage bg={C.ink}>
      <g opacity={k}>
        <World cam={cam} layers={[{depth: 1, el: scene}]} />
      </g>
      <Vignette strength={lerp(0.8, 0.9, pk)} />
      {label && <LabelPlate x={96} y={110} text={label} kind="ink" p={tagP} size={TYPE.small} />}
      {caption && <LowerThird text={caption} kicker={kicker} p={after} />}
      <CreditLine text={credit} p={ramp(t, t0 + 0.4, t0 + 0.8)} />
    </Stage>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 9 · ParallaxCutoutShot

export type Cut = {rx: number; ry: number; rw: number; rh: number; shape?: 'rect' | 'ellipse'} | {points: Pt2[]};

/**
 * ParallaxCutoutShot — fake 2.5D without segmentation: the image is the background (receding: darkened 'ink' or
 * washed 'paper', desaturated — never blurred) and a crop of it (`cut` rect/ellipse with rx, ry = TOP-LEFT + rw×rh,
 * or polygon `points`, all 0..1 of the image) lifts off at `at` as a paper cut-out with a flat shadow, then moves at a
 * different parallax speed while the camera pans. `depth` scales the parallax, `label` = Tag beside the cut-out.
 */
export const ParallaxCutoutShot: React.FC<ArchBase & {src: string; aspect?: number; cut: Cut; from?: Focus; to?: Focus; depth?: number; recede?: 'ink' | 'paper'; label?: {text: string; kind?: Sem; at?: number}; kicker?: string; at?: number}> = ({
  t,
  a,
  b,
  seed = 1,
  slug,
  src,
  aspect = 1.5,
  cut,
  from = [0.42, 0.5, 1.12],
  to = [0.58, 0.48, 1.2],
  depth = 1,
  recede = 'ink',
  label,
  tint = 'paper',
  caption,
  kicker,
  credit,
  at,
}) => {
  const t0 = at ?? a + 0.5;
  const f = focusAt(t, a, Math.max(b, a + 3), from, to, undefined, seed);
  const fL = focusAt(t0, a, Math.max(b, a + 3), from, to, undefined, seed);
  const v = viewRect(1920, 1080, aspect, f);
  const vL = viewRect(1920, 1080, aspect, fL);
  const lift = ramp(t, t0, t0 + 0.9, ease.inOut);
  const pts: XY[] = 'points' in cut ? cut.points.map(([x, y]) => onView(v, x, y)) : [];
  const box = 'points' in cut ? null : {x: v.left + cut.rx * v.IW, y: v.top + cut.ry * v.IH, w: cut.rw * v.IW, h: cut.rh * v.IH, ell: cut.shape === 'ellipse'};
  const cen: XY = box ? {x: box.x + box.w / 2, y: box.y + box.h / 2} : {x: pts.reduce((s, q) => s + q.x, 0) / pts.length, y: pts.reduce((s, q) => s + q.y, 0) / pts.length};
  // where the centre was when it lifted → parallax = extra travel since then
  const cenL: XY = box
    ? {x: vL.left + ('points' in cut ? 0 : (cut.rx + cut.rw / 2) * vL.IW), y: vL.top + ('points' in cut ? 0 : (cut.ry + cut.rh / 2) * vL.IH)}
    : (() => {
        const q = (cut as {points: Pt2[]}).points.map(([x, y]) => onView(vL, x, y));
        return {x: q.reduce((s, p) => s + p.x, 0) / q.length, y: q.reduce((s, p) => s + p.y, 0) / q.length};
      })();
  const par = {x: (cen.x - cenL.x) * 0.7 * depth * lift, y: (cen.y - cenL.y) * 0.7 * depth * lift};
  const sc = 1 + 0.07 * lift;
  const tf = `translate(${cen.x + par.x} ${cen.y + par.y}) scale(${sc}) translate(${-cen.x} ${-cen.y})`;
  // An ellipse cut is drawn as a slightly irregular hand-cut outline (a perfect ellipse + thick ring reads as a camera lens).
  const cutPts: XY[] = box && box.ell ? Array.from({length: 72}, (_, i) => {
        const th = (i / 72) * Math.PI * 2;
        const k = 1 + 0.014 * Math.sin(3 * th + seed * 1.7) + 0.01 * Math.sin(5 * th + seed * 3.1) + 0.006 * Math.sin(9 * th + seed * 0.6);
        return {x: box.x + box.w / 2 + Math.cos(th) * (box.w / 2) * k, y: box.y + box.h / 2 + Math.sin(th) * (box.h / 2) * k};
      }) : pts;
  const clip = box && !box.ell ? `inset(${box.y}px ${1920 - box.x - box.w}px ${1080 - box.y - box.h}px ${box.x}px)` : `polygon(${cutPts.map((q) => `${q.x}px ${q.y}px`).join(', ')})`;
  const shape = (props: React.SVGProps<SVGElement>) =>
    box && !box.ell ? (
      <rect x={box.x} y={box.y} width={box.w} height={box.h} {...(props as React.SVGProps<SVGRectElement>)} />
    ) : (
      <polygon points={cutPts.map((q) => `${q.x},${q.y}`).join(' ')} {...(props as React.SVGProps<SVGPolygonElement>)} />
    );
  const rim = box && box.ell ? 8 : 14; // thin paper edge for the hand-cut blob, original ring for boxes / polygons
  const bgFilter = `grayscale(${0.55 * lift})`;
  const lp = label ? ramp(t, label.at ?? t0 + 0.7, (label.at ?? t0 + 0.7) + 0.6, ease.linear) : 0;
  const top = box ? box.y : Math.min(...pts.map((q) => q.y));
  const bottom = box ? box.y + box.h : Math.max(...pts.map((q) => q.y));
  const lblBelow = top < 260;
  return (
    <Bleed>
      <ArchImage
        slug={slug}
        src={src}
        x={0}
        y={0}
        w={1920}
        h={1080}
        aspect={aspect}
        focus={f}
        tint={tint}
        filter={bgFilter}
        dim={recede === 'ink' ? 0.42 * lift : 0}
        wash={recede === 'paper' ? 0.55 * lift : 0}
        o={ramp(t, a - 0.35, a + 0.05, ease.linear)}
        bg={C.ink}
      />
      {lift > 0 && (
        <g transform={tf}>
          {rim < 14 && <g transform={`translate(${34 * lift} ${46 * lift})`}>{shape({fill: C.ink, opacity: 0.16 * lift})}</g>}
          <g transform={`translate(${18 * lift} ${26 * lift})`}>{shape({fill: C.ink, opacity: 0.4 * lift})}</g>
          {shape({fill: 'none', stroke: C.paperLight, strokeWidth: rim * lift, strokeLinejoin: 'round'})}
          <ArchImage slug={slug} src={src} x={0} y={0} w={1920} h={1080} aspect={aspect} focus={f} tint={tint} clip={clip} bg="transparent" />
        </g>
      )}
      {label && (
        <g transform={`translate(${par.x} ${par.y})`}>
          <Tag x={cen.x} y={lblBelow ? bottom * sc + 60 : top - 50 - (sc - 1) * 100} text={label.text} kind={label.kind ?? 'signal'} p={lp} anchor="center" />
        </g>
      )}
      {kicker && <LabelPlate x={96} y={110} text={kicker} kind="ink" p={ramp(t, a + 0.1, a + 0.7, ease.linear)} size={TYPE.small} />}
      {caption && <LowerThird text={caption} p={ramp(t, t0 + 0.5, t0 + 1.2, ease.linear)} />}
      <CreditLine text={credit} p={ramp(t, a + 0.2, a + 0.6)} />
    </Bleed>
  );
};

