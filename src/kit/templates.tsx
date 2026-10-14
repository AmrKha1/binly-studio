import React from 'react';
import {C, FONT_SANS, FONT_SERIF, SEM, Sem} from './theme';
import {CamState, clamp01, ease, keys, lerp, mixHex, noise1, rand, ramp} from './anim';
import {Stage, World, breathe} from './stage';
import {HandNote, Headline, Kicker, NameTag, Stamp, Stat, Tag, textW} from './text';
import {LightPool, Particles, Pulse, Vignette} from './fx';
import {Icon, IconName} from './icons';
import {Bar, BarChart, BalanceScale, DotGrid, TimelineAxis, dotGridSize, fmtYear} from './data';
import {Arrow, CheckMark, DashedOutline, QuestionMark, Venn} from './diagrams';
import {Card} from './cards';
import {Photo, PhotoMark} from './photo';
import {AreaMark, CityDot, GeoMap, LonLat, MapHighlight, MapLabelSpec, MapPin, Region, Route, SpreadRings, makeProjection} from './geo';
import {Person, PersonProps, personHands} from './people';
import {ENV_FLOOR, Lab, MuseumHall, Room, RoomEra, Street, Study} from './env';

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Shot templates — finished, premium Binly shots from a few props. Each template is a full frame
// (<Stage>) and a pure function of absolute time t, for a shot that lives from a to b (seconds):
//   <Shots t={t} shots={[{start: T.x, render: (t) => <StatShot t={t} a={T.x} b={T.y} value="26" unit="%" …/>}]}/>
// Entrances are keyed to cue props (`at`, `cues`, …), holds stay alive (camera push + breathe, dust),
// and everything is settled well before b so any transition works. `tone` = paper | ink | shade,
// `seed` varies the backdrop motif, camera drift and small layout choices.
// Templates compose the whole kit, so (unlike other kit files) this module imports every kit module.
// ════════════════════════════════════════════════════════════════════════════════════════════════

export type Tone = 'paper' | 'ink' | 'shade';
export type Motif = 'rings' | 'band' | 'frame' | 'dots' | 'none';
/** Props every template takes. */
export type ShotBase = {t: number; a: number; b: number; tone?: Tone; seed?: number; motif?: Motif};

type Pal = {bg: string; fg: string; mute: string; panel: string; motif: string; line: string; dust: string; accent: string; dark: boolean};

/** Colour set for a background tone (bg, fg text, mute, panel, motif tint, line, dust, accent, dark). */
export const tonePal = (tone: Tone = 'paper'): Pal => {
  if (tone === 'ink')
    return {bg: C.ink, fg: C.paperLight, mute: C.paperDeep, panel: C.inkSoft, motif: mixHex(C.ink, C.paperLight, 0.045), line: mixHex(C.ink, C.paperLight, 0.16), dust: C.paperDeep, accent: C.oxLight, dark: true};
  const bg = tone === 'shade' ? C.paperShade : C.paper;
  return {bg, fg: C.ink, mute: C.inkMute, panel: C.paperLight, motif: mixHex(bg, C.ink, 0.045), line: mixHex(bg, C.ink, 0.15), dust: C.paperDark, accent: C.oxblood, dark: false};
};

/** Semantic colour, lifted for legibility on dark tones. */
export const semColor = (kind: Sem, dark = false) => {
  if (!dark) return SEM[kind];
  const lift: Partial<Record<Sem, string>> = {confirmed: C.evidenceLight, evidence: C.evidenceLight, theory: C.theoryLight, speculation: C.theoryLight, caution: C.cautionLight, debated: C.cautionLight, signal: C.oxLight, ink: C.paperLight};
  return lift[kind] ?? SEM[kind];
};
const semTint = (kind: Sem) =>
  ({confirmed: C.evidenceTint, evidence: C.evidenceTint, theory: C.theoryTint, speculation: C.theoryTint, caution: C.cautionTint, debated: C.cautionTint, signal: C.oxTint, ink: C.paperDeep})[kind];

const MOTIFS: Motif[] = ['rings', 'band', 'frame', 'dots'];
const sideOf = (seed: number, salt = 0) => (rand(seed * 7.31 + salt) < 0.5 ? -1 : 1);
const cue = (list: number[] | undefined, i: number, at: number, gap: number) => list?.[i] ?? at + i * gap;
/** Font size so `len` characters fill a w×h box (serif, wrapped). */
const fitSize = (len: number, w: number, h: number, min: number, max: number, lh = 1.2) => Math.round(Math.max(min, Math.min(max, Math.sqrt((0.78 * w * h) / (Math.max(1, len) * 0.5 * lh)))));

// ───────────────────────────────────────────────────────────────── camera + backdrop

/** Template camera: slow push-in over the shot + seeded lateral drift + breathe. Safe for content inside x 150–1770. */
export const shotCam = (t: number, a: number, b: number, seed = 1, focus?: [number, number], zoom: [number, number] = [1, 1.035]): CamState => {
  const k = ramp(t, a - 0.4, Math.max(b, a + 3) + 0.6, ease.inOutSine);
  const d = sideOf(seed, 1) * 14;
  const fx = focus ? (focus[0] - 960) * 0.05 : 0;
  const fy = focus ? (focus[1] - 540) * 0.05 : 0;
  return breathe({cx: 960 - d + fx * k + d * 2 * k, cy: 546 + (fy - 10) * k, z: lerp(zoom[0], zoom[1], k), r: 0}, t, 0.7);
};

/** Background motif layer for a tone (world coords, overscanned for the camera). */
export const Backdrop: React.FC<{tone?: Tone; motif?: Motif; seed?: number; t?: number}> = ({tone = 'paper', motif, seed = 1, t = 0}) => {
  const P = tonePal(tone);
  const m = motif ?? MOTIFS[Math.floor(rand(seed * 3.7) * MOTIFS.length)];
  const s = sideOf(seed, 2);
  const cx = s > 0 ? 1580 : 340;
  if (m === 'none') return null;
  if (m === 'rings')
    return (
      <g fill="none">
        {[300, 450, 600, 750].map((r, i) => (
          <circle key={i} cx={cx} cy={600} r={r} stroke={i === 1 ? P.line : P.motif} strokeWidth={i === 1 ? 2 : 26} opacity={i === 1 ? 0.45 : 1} />
        ))}
        <circle cx={cx} cy={600} r={530} stroke={P.line} strokeWidth={3} strokeDasharray="4 22" strokeLinecap="round" opacity={0.6} transform={`rotate(${t * 2.5 * s} ${cx} 600)`} />
      </g>
    );
  if (m === 'band') {
    const x0 = s > 0 ? 1180 : 740;
    const w = 520 * s;
    return (
      <g>
        <path d={`M${x0} -200 L${x0 + w} -200 L${x0 + w - 640 * s} 1300 L${x0 - 640 * s} 1300 Z`} fill={P.motif} />
        <path d={`M${x0 + w + 60 * s} -200 L${x0 + w + 60 * s - 640 * s} 1300`} stroke={P.line} strokeWidth={3} opacity={0.5} />
      </g>
    );
  }
  if (m === 'frame')
    return (
      <g fill="none" stroke={P.line}>
        <rect x={52} y={52} width={1816} height={976} strokeWidth={2} opacity={0.55} />
        <rect x={64} y={64} width={1792} height={952} strokeWidth={1.5} opacity={0.3} />
        {[
          [52, 52],
          [1868, 52],
          [52, 1028],
          [1868, 1028],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={7} fill={P.bg} strokeWidth={2.5} opacity={0.8} />
        ))}
        <rect x={s > 0 ? 1240 : 0} y={0} width={680} height={1080} fill={P.motif} stroke="none" />
      </g>
    );
  // dots: a sparse dot field inside a large disc
  const dots: React.ReactNode[] = [];
  for (let gy = 0; gy < 15; gy++)
    for (let gx = 0; gx < 15; gx++) {
      const x = cx - 490 + gx * 70;
      const y = 600 - 490 + gy * 70;
      const dd = Math.hypot(x - cx, y - 600);
      if (dd > 500) continue;
      dots.push(<circle key={`${gx}-${gy}`} cx={x} cy={y} r={lerp(7, 3, dd / 500)} fill={P.line} opacity={0.42} />);
    }
  return (
    <g>
      <circle cx={cx} cy={600} r={560} fill={P.motif} />
      {dots}
    </g>
  );
};

/**
 * Shell: the Stage + camera + backdrop + dust + vignette shared by all templates. Children = content in world coords.
 * `bg` replaces the motif backdrop (e.g. an environment); `fixed` draws on top without camera (rarely needed).
 */
export const ShotShell: React.FC<{
  t: number;
  a: number;
  b: number;
  tone?: Tone;
  seed?: number;
  motif?: Motif;
  focus?: [number, number];
  zoom?: [number, number];
  bg?: React.ReactNode;
  dust?: boolean;
  vignette?: number;
  fixed?: React.ReactNode;
  children?: React.ReactNode;
}> = ({t, a, b, tone = 'paper', seed = 1, motif, focus, zoom, bg, dust = true, vignette, fixed, children}) => {
  const P = tonePal(tone);
  const cam = shotCam(t, a, b, seed, focus, zoom);
  return (
    <Stage bg={P.bg}>
      <World
        cam={cam}
        layers={[
          {depth: bg ? 1 : 0.4, el: bg ?? <Backdrop tone={tone} motif={motif} seed={seed} t={t} />},
          {depth: 1, el: children},
          {depth: 1.25, el: dust ? <Particles t={t} x={-100} y={-60} w={2120} h={1200} n={18} seed={seed + 11} size={[2, 4.5]} color={P.dust} opacity={P.dark ? [0.12, 0.35] : [0.18, 0.45]} vx={5} vy={-7} /> : null},
        ]}
      />
      {fixed}
      <Vignette strength={vignette ?? (P.dark ? 1.1 : 0.55)} />
    </Stage>
  );
};

// ───────────────────────────────────────────────────────────────── rich text

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9à-ÿ']/g, '');

/**
 * Wrapped text block (HTML in SVG) with word / type / fade reveal, marker or underline highlight on chosen
 * words (sweeps on with markP), optional caret. Box (x,y,w,h), `valign` positions the text inside it.
 */
export const RichText: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  size?: number;
  color?: string;
  font?: 'serif' | 'sans';
  italic?: boolean;
  weight?: number;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  p?: number;
  mode?: 'words' | 'type' | 'fade';
  mark?: string[];
  markP?: number;
  markColor?: string;
  markStyle?: 'marker' | 'underline';
  accent?: string;
  caret?: boolean;
  t?: number;
  caps?: boolean;
  tracking?: number;
  strike?: number;
  strikeColor?: string;
}> = ({x, y, w, h, text, size = 56, color = C.ink, font = 'serif', italic = false, weight = 600, align = 'left', valign = 'top', lineHeight = 1.18, p = 1, mode = 'words', mark, markP = 1, markColor = C.cautionLight, markStyle = 'marker', accent, caret = false, t = 0, caps = false, tracking = 0, strike = 0, strikeColor = C.oxblood}) => {
  if (p <= 0) return null;
  const words = text.split(/\s+/).filter(Boolean);
  const marked = new Set((mark ?? []).flatMap((m) => m.split(/\s+/)).map(norm));
  const total = text.length;
  const nChars = Math.floor(clamp01(p) * total);
  let charPos = 0;
  const hp = ease.inOut(clamp01(markP));
  const fadeK = mode === 'fade' ? ease.out(clamp01(p)) : 1;
  const caretOn = caret && (p < 1 || Math.sin(t * 6.5) > -0.2);
  const caretEl = (
    <span style={{position: 'relative'}}>
      <span style={{position: 'absolute', left: 2, top: '0.08em', width: Math.max(3, size * 0.06), height: '1em', background: accent ?? color, opacity: caretOn ? 1 : 0}} />
    </span>
  );
  let caretPlaced = false;
  const items = words.map((wd, i) => {
    const isMark = marked.has(norm(wd));
    const markCss: React.CSSProperties = isMark
      ? {
          backgroundImage: `linear-gradient(to right, ${markColor} 50%, transparent 50%)`,
          backgroundSize: markStyle === 'marker' ? '200% 78%' : '200% 0.11em',
          backgroundPosition: `${(1 - hp) * 100}% ${markStyle === 'marker' ? '70%' : '96%'}`,
          backgroundRepeat: 'no-repeat',
          color: accent && hp > 0.15 ? accent : undefined,
          padding: '0 0.06em',
          margin: '0 -0.06em',
        }
      : {};
    const start = charPos;
    charPos += wd.length + 1;
    let inner: React.ReactNode = wd;
    let style: React.CSSProperties = {...markCss};
    if (mode === 'type') {
      const vis = Math.max(0, Math.min(wd.length, nChars - start));
      const needCaret = !caretPlaced && (vis < wd.length || i === words.length - 1);
      if (needCaret) caretPlaced = true;
      inner = (
        <>
          {wd.slice(0, vis)}
          {needCaret && caretEl}
          <span style={{color: 'transparent'}}>{wd.slice(vis)}</span>
        </>
      );
      if (vis === 0) style = {...style, backgroundImage: undefined};
    } else if (mode === 'words') {
      const k = ease.out(clamp01(p * words.length * 1.12 - i));
      style = {...style, display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * 0.28}em)`};
    }
    return (
      <React.Fragment key={i}>
        <span style={style}>{inner}</span>
        {i < words.length - 1 ? ' ' : ''}
      </React.Fragment>
    );
  });
  return (
    <foreignObject x={x} y={y} width={w} height={h} opacity={fadeK}>
      <div style={{width: w, height: h, display: 'flex', flexDirection: 'column', justifyContent: valign === 'top' ? 'flex-start' : valign === 'bottom' ? 'flex-end' : 'center'}}>
        <div style={{position: 'relative'}}>
        <div
          style={{
            fontFamily: font === 'serif' ? FONT_SERIF : FONT_SANS,
            fontSize: size,
            fontWeight: weight,
            fontStyle: italic ? 'italic' : 'normal',
            color,
            textAlign: align,
            lineHeight,
            textTransform: caps ? 'uppercase' : 'none',
            letterSpacing: tracking ? `${tracking}em` : undefined,
            transform: mode === 'fade' ? `translateY(${(1 - fadeK) * 14}px)` : undefined,
          }}
        >
          {items}
        </div>
        {strike > 0 && (
          // editor's red pen ON TOP of the text: an invisible copy of the text with one hand-drawn stroke per wrapped
          // line (box-decoration-break: clone), drawn on as `strike` goes 0→1
          <div
            style={{position: 'absolute', inset: 0, fontFamily: font === 'serif' ? FONT_SERIF : FONT_SANS, fontSize: size, fontWeight: weight, fontStyle: italic ? 'italic' : 'normal', color: 'transparent', textAlign: align, lineHeight, textTransform: caps ? 'uppercase' : 'none', letterSpacing: tracking ? `${tracking}em` : undefined}}
          >
            <span
              style={{
                backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 20' preserveAspectRatio='none'><path d='M1 12 C 28 8, 62 15, 99 7' pathLength='100' stroke-dasharray='${(clamp01(strike) * 100).toFixed(2)} 100' stroke='${strikeColor}' stroke-width='3.4' stroke-linecap='round' fill='none'/></svg>`)}")`,
                backgroundSize: '100% 0.5em',
                backgroundPosition: '0 62%',
                backgroundRepeat: 'no-repeat',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
                padding: '0 0.18em',
                margin: '0 -0.18em',
              }}
            >
              {words.join(' ')}
            </span>
          </div>
        )}
        </div>
      </div>
    </foreignObject>
  );
};

// ───────────────────────────────────────────────────────────────── small shared pieces

/** Round medallion with an icon (or children) that pops in, ring draws on. origin = centre. */
const Medal: React.FC<{x: number; y: number; r: number; p: number; fill: string; ring: string; icon?: IconName; iconColor?: string; accent?: string; t?: number; dashed?: boolean; children?: React.ReactNode}> = ({
  x,
  y,
  r,
  p,
  fill,
  ring,
  icon,
  iconColor = C.ink,
  accent = C.oxblood,
  t = 0,
  dashed = false,
  children,
}) => {
  if (p <= 0) return null;
  const k = ease.outBack(clamp01(p * 1.4));
  const rk = ease.inOut(ramp(p, 0.2, 1));
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={8} cy={12} r={r * k} fill={C.ink} opacity={0.12 * clamp01(p * 3)} />
      <circle r={r * k} fill={fill} />
      {dashed ? (
        <circle r={r + 14} fill="none" stroke={ring} strokeWidth={4} strokeDasharray="10 12" opacity={rk} transform={`rotate(${-90 + t * 4})`} />
      ) : (
        <circle r={r + 14} fill="none" stroke={ring} strokeWidth={4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - rk} transform="rotate(-90)" />
      )}
      {icon && <Icon name={icon} x={0} y={0} s={(r / 62) * 0.95} p={ramp(p, 0.25, 1)} color={iconColor} accent={accent} knock={fill} />}
      {children && <g opacity={clamp01(p * 2)}>{children}</g>}
    </g>
  );
};

/** Paper plate behind a label so it reads over busy scenes. */
const Plate: React.FC<{x: number; y: number; w: number; h: number; p: number; dark?: boolean}> = ({x, y, w, h, p, dark}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p * 1.5));
  return (
    <g opacity={k}>
      <rect x={x + 10} y={y + 12} width={w} height={h} rx={10} fill={C.ink} opacity={0.18} />
      <rect x={x} y={y} width={w * lerp(0.6, 1, k)} height={h} rx={10} fill={dark ? C.inkSoft : C.paperLight} />
    </g>
  );
};

/** Kicker + optional headline block (top-left or centred). */
const Heading: React.FC<{x: number; y: number; kicker?: string; title?: string; p: number; P: Pal; anchor?: 'start' | 'middle'; size?: number; kickerColor?: string}> = ({x, y, kicker, title, p, P, anchor = 'start', size = 64, kickerColor}) => (
  <g>
    {kicker && <Kicker x={x} y={y} text={kicker} p={ramp(p, 0, 0.6)} color={kickerColor ?? P.accent} anchor={anchor} size={24} />}
    {title && <Headline x={x} y={y + (kicker ? size * 1.05 : size * 0.4)} text={title} p={ramp(p, 0.15, 1)} size={size} color={P.fg} anchor={anchor} mode="mask" />}
  </g>
);

// ════════════════════════════════════════════════════════════════════════════════ 1 · TitleShot

/**
 * TitleShot — chapter / section title: kicker + big title (use "\n" for two lines) + motif icon medallion,
 * optional giant chapter numeral, or a custom illustration in `children` (slot-local coords, origin = slot
 * centre, fits ≈ 380×340). layout 'center' (default) | 'left'. Default tone ink.
 */
export const TitleShot: React.FC<
  ShotBase & {kicker?: string; title: string; sub?: string; icon?: IconName; number?: string; accent?: string[]; at?: number; layout?: 'center' | 'left'; children?: React.ReactNode}
> = ({t, a, b, tone = 'ink', seed = 1, motif, kicker, title, sub, icon, number, accent, at, layout = 'center', children}) => {
  const P = tonePal(tone);
  const t0 = at ?? a + 0.2;
  const lines = title.split('\n');
  const longest = Math.max(...lines.map((l) => l.length));
  const hasSlot = !!(icon || children);
  const center = layout === 'center';
  const maxW = center ? 1500 : 900;
  const size = Math.round(Math.min(lines.length > 1 ? 104 : 120, maxW / (Math.max(6, longest) * 0.52)));
  const acc: Record<string, string> = {};
  (accent ?? []).forEach((w) => (acc[norm(w)] = P.accent));
  const lineH = size * 1.06;
  // vertical layout
  const tx = center ? 960 : 170;
  const anchor = center ? 'middle' : 'start';
  const blockH = lines.length * lineH;
  const titleTop = center ? (hasSlot ? 640 : 540 - blockH / 2 + size * 0.35) : 540 - blockH / 2 + size * 0.2;
  const slot = center ? {x: 960, y: 330} : {x: 1440, y: 540};
  const ruleY = titleTop + (lines.length - 1) * lineH + size * 0.42;
  const ruleW = lerp(0, 160, ease.inOut(ramp(t, t0 + 0.5, t0 + 1.2)));
  return (
    <ShotShell t={t} a={a} b={b} tone={tone} seed={seed} motif={motif ?? (number ? 'none' : undefined)} focus={center ? undefined : [960, 540]}>
      {number && (
        <text x={center ? 960 : 1420} y={center ? 760 : 820} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={800} fontSize={center ? 720 : 760} fill={P.motif} opacity={ease.out(ramp(t, t0 - 0.2, t0 + 1))} style={{fontVariantNumeric: 'lining-nums'}}>
          {number}
        </text>
      )}
      {hasSlot && (
        <g transform={`translate(${slot.x} ${slot.y})`}>
          {children ? (
            <g opacity={ease.out(ramp(t, t0, t0 + 0.7))} transform={`translate(0 ${(1 - ease.out(ramp(t, t0, t0 + 0.9))) * 30})`}>
              {children}
            </g>
          ) : (
            <Medal x={0} y={0} r={center ? 104 : 200} p={ramp(t, t0, t0 + 0.9, ease.linear)} fill={P.dark ? C.inkSoft : C.paperLight} ring={P.accent} icon={icon} iconColor={P.dark ? C.paperLight : C.ink} accent={P.accent} t={t} />
          )}
          {!children && <circle r={(center ? 104 : 200) + 44} fill="none" stroke={P.line} strokeWidth={2.5} strokeDasharray="3 14" strokeLinecap="round" opacity={ramp(t, t0 + 0.4, t0 + 1.2)} transform={`rotate(${t * -3})`} />}
        </g>
      )}
      {kicker && <Kicker x={tx} y={titleTop - size * 0.95} text={kicker} p={ramp(t, t0 + 0.1, t0 + 0.7)} color={P.accent} anchor={anchor} size={26} />}
      {lines.map((ln, i) => (
        <Headline key={i} x={tx} y={titleTop + i * lineH} text={ln} p={ramp(t, t0 + 0.2 + i * 0.18, t0 + 1.1 + i * 0.18)} size={size} color={P.fg} anchor={anchor} mode="mask" accent={acc} />
      ))}
      <rect x={center ? 960 - ruleW / 2 : tx} y={ruleY} width={ruleW} height={5} fill={P.accent} />
      {sub && <Kicker x={tx} y={ruleY + 64} text={sub} p={ramp(t, t0 + 0.9, t0 + 1.5)} color={P.mute} anchor={anchor} size={24} />}
    </ShotShell>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 2 · StatShot

export type StatCompare =
  | {kind: 'dots'; filled: number; total?: number; cols?: number; color?: string; caption?: string}
  | {kind: 'bars'; bars: Bar[]; highlight?: number; caption?: string}
  | {kind: 'scale'; items: {label: string; value: number; display?: string; icon?: IconName; color?: string}[]; caption?: string};

/**
 * StatShot — one exact number made tangible. `value` = the spoken figure as a string (counts up, lands exactly),
 * `unit`, `label` (caps under), `kicker` (above). Optional `compare`: dots (waffle, filled of total), bars (BarChart),
 * scale (2–3 proportional columns with icons). Number = the scene's oxblood beat unless `color`.
 */
export const StatShot: React.FC<
  ShotBase & {value: string; unit?: string; label?: string; kicker?: string; note?: string; icon?: IconName; color?: string; count?: boolean; at?: number; compare?: StatCompare; compareAt?: number}
> = ({t, a, b, tone = 'paper', seed = 1, motif, value, unit, label, kicker, note, icon, color, count = true, at, compare, compareAt}) => {
  const P = tonePal(tone);
  const t0 = at ?? a + 0.2;
  const tc = compareAt ?? t0 + 0.7;
  const col = color ?? P.accent;
  const side = compare ? sideOf(seed, 5) : 0; // number left (−1) or right (+1) of the comparison
  const nx = compare ? (side < 0 ? 560 : 1360) : 960;
  const cx = compare ? (side < 0 ? 1340 : 580) : 960;
  const maxW = compare ? 720 : 1500;
  const estW = (sz: number) => textW(value, sz, 'serif', 700) * 1.08 + (unit ? textW(unit, sz * 0.42, 'serif') + sz * 0.1 : 0);
  let size = compare ? 210 : 260;
  while (estW(size) > maxW && size > 90) size -= 6;
  const numY = compare ? 560 : icon ? 640 : 600;
  const discP = ease.outBack(ramp(t, t0 - 0.15, t0 + 0.6));
  const sp = ramp(t, t0, t0 + 1.4, ease.linear);
  const labelLines = label ? 1 : 0;
  return (
    <ShotShell t={t} a={a} b={b} tone={tone} seed={seed} motif={motif ?? 'none'} focus={[nx, numY - size * 0.3]}>
      <circle cx={nx} cy={numY - size * 0.3} r={(compare ? 330 : 400) * discP} fill={P.motif} />
      <circle cx={nx} cy={numY - size * 0.3} r={(compare ? 360 : 440) * discP} fill="none" stroke={P.line} strokeWidth={2.5} strokeDasharray="3 16" strokeLinecap="round" transform={`rotate(${t * 3} ${nx} ${numY - size * 0.3})`} opacity={0.8} />
      {icon && <Icon name={icon} x={nx} y={numY - size - (kicker ? 120 : 60)} s={1.15} p={ramp(t, t0 - 0.1, t0 + 0.5)} color={P.fg} accent={col} knock={P.bg} />}
      {kicker && <Kicker x={nx} y={numY - size * 0.98} text={kicker} p={ramp(t, t0 - 0.1, t0 + 0.4)} color={P.mute} size={26} />}
      <Stat x={nx} y={numY} value={value} unit={unit} label={label} p={sp} count={count} size={size} color={col} labelColor={P.fg} />
      {labelLines > 0 && <rect x={nx - 40} y={numY + size * 0.55} width={80 * ease.inOut(ramp(t, t0 + 0.8, t0 + 1.3))} height={4} fill={col} opacity={0.8} />}
      {note && <Kicker x={nx} y={numY + size * 0.55 + 70} text={note} p={ramp(t, t0 + 1, t0 + 1.5)} color={P.mute} size={22} weight={600} />}
      {compare && <StatCompareView c={compare} x={cx} t={t} t0={tc} P={P} col={col} />}
    </ShotShell>
  );
};

const StatCompareView: React.FC<{c: StatCompare; x: number; t: number; t0: number; P: Pal; col: string}> = ({c, x, t, t0, P, col}) => {
  const p = ramp(t, t0, t0 + 1.6, ease.linear);
  const caption = (capY: number) => c.caption && <Kicker x={x} y={capY} text={c.caption} p={ramp(t, t0 + 0.8, t0 + 1.4)} color={P.mute} size={24} />;
  if (c.kind === 'dots') {
    const total = c.total ?? 100;
    const cols = c.cols ?? Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);
    const size = Math.min(48, 560 / (cols + (cols - 1) * 0.42), 560 / (rows + (rows - 1) * 0.42));
    const g = dotGridSize(cols, rows, size);
    return (
      <g>
        <DotGrid x={x - g.w / 2} y={500 - g.h / 2} cols={cols} rows={rows} filled={c.filled} p={p} size={size} color={c.color ?? col} empty={P.dark ? C.inkLift : C.paperDeep} />
        {caption(500 + g.h / 2 + 80)}
      </g>
    );
  }
  if (c.kind === 'bars')
    return (
      <g>
        <BarChart x={x - 380} y={200} w={760} h={620} bars={c.bars} p={p} highlight={c.highlight} highlightColor={col} color={P.dark ? C.paperDeep : C.inkLift} labelSize={24} />
        {caption(880)}
      </g>
    );
  // scale: proportional columns on a baseline
  const n = c.items.length;
  const max = Math.max(...c.items.map((i) => i.value));
  const colW = n > 2 ? 130 : 160;
  const span = n > 2 ? 230 : 300;
  const base = 790;
  return (
    <g>
      <line x1={x - span * (n / 2) - 40} x2={x + span * (n / 2) + 40} y1={base} y2={base} stroke={P.fg} strokeWidth={5} strokeLinecap="round" opacity={ramp(p, 0, 0.2)} />
      {c.items.map((it, i) => {
        const ix = x + (i - (n - 1) / 2) * span;
        const k = ease.out(ramp(p, 0.1 + i * 0.18, 0.55 + i * 0.18));
        const hgt = Math.max(10, (it.value / max) * 470) * k;
        const ic = it.color ?? (i === 0 ? col : P.dark ? C.paperDeep : C.inkLift);
        return (
          <g key={i}>
            <rect x={ix - colW / 2} y={base - hgt} width={colW} height={hgt} rx={8} fill={ic} />
            <rect x={ix + colW / 2 - colW * 0.28} y={base - hgt} width={colW * 0.28} height={hgt} rx={8} fill={C.ink} opacity={0.12} />
            {it.icon && <Icon name={it.icon} x={ix} y={base - hgt - (it.display ? 120 : 64)} s={0.8} p={ramp(p, 0.4 + i * 0.18, 0.7 + i * 0.18)} color={P.fg} accent={ic} knock={P.bg} />}
            {it.display && (
              <text x={ix} y={base - hgt - 22} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={44} fill={P.fg} opacity={ramp(p, 0.5 + i * 0.18, 0.8 + i * 0.18)}>
                {it.display}
              </text>
            )}
            <Kicker x={ix} y={base + 48} text={it.label} p={ramp(p, 0.3 + i * 0.15, 0.6 + i * 0.15)} color={P.fg} size={22} />
          </g>
        );
      })}
      {c.caption && <Kicker x={x} y={base + 110} text={c.caption} p={ramp(t, t0 + 0.8, t0 + 1.4)} color={P.mute} size={22} weight={600} />}
    </g>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 3 · QuoteShot

/**
 * QuoteShot — a quote or document excerpt. style 'card' (paper card + big quote mark), 'document' (excerpt on an
 * aged page, camera leans in), 'typed' (types on with caret). `highlight` words get a marker sweep at `highlightAt`.
 * `revealDur` = how long the words take to appear (default ≈ reading pace, max 3.5 s).
 */
export const QuoteShot: React.FC<
  ShotBase & {text: string; source?: string; sub?: string; style?: 'card' | 'document' | 'typed'; highlight?: string[]; at?: number; highlightAt?: number; revealDur?: number; docTitle?: string}
> = ({t, a, b, tone, seed = 1, motif, text, source, sub, style = 'card', highlight, at, highlightAt, revealDur, docTitle}) => {
  const tn: Tone = tone ?? (style === 'typed' ? 'ink' : style === 'document' ? 'shade' : 'paper');
  const P = tonePal(tn);
  const t0 = at ?? a + 0.2;
  const nWords = text.split(/\s+/).length;
  const dur = revealDur ?? Math.min(3.5, 0.5 + nWords * 0.13);
  const th = highlightAt ?? t0 + dur + 0.2;
  const markColor = P.dark ? mixHex(C.ink, C.oxblood, 0.8) : mixHex(C.cautionLight, C.paperLight, 0.35);
  const accent = P.dark ? C.paperLight : undefined;
  if (style === 'document') {
    const rot = sideOf(seed, 9) * 1.4;
    const size = fitSize(text.length, 900, 380, 34, 52, 1.3);
    return (
      <ShotShell t={t} a={a} b={b} tone={tn} seed={seed} motif={motif ?? 'none'} zoom={[1, 1.07]} focus={[960, 540]}>
        <g transform={`rotate(${rot} 960 560)`} opacity={ease.out(ramp(t, t0 - 0.3, t0 + 0.3))}>
          <g transform={`translate(0 ${(1 - ease.outQuint(ramp(t, t0 - 0.3, t0 + 0.6))) * 60})`}>
            <rect x={400 + 16} y={120 + 20} width={1120} height={900} rx={6} fill={C.ink} opacity={0.16} />
            <path d="M400 128 Q680 112 960 124 Q1240 134 1520 118 L1516 1020 Q1240 1032 960 1018 Q680 1006 404 1024 Z" fill={C.bone} />
            <rect x={436} y={156} width={1048} height={840} fill="none" stroke={C.boneShade} strokeWidth={3} rx={4} />
            <line x1={520} x2={520} y1={160} y2={990} stroke={C.oxTint} strokeWidth={3} opacity={0.8} />
            {docTitle && (
              <text x={960} y={232} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={22} letterSpacing={4} fill={C.inkMute}>
                {docTitle.toUpperCase()}
              </text>
            )}
            {[0, 1].map((i) => (
              <rect key={i} x={560} y={(docTitle ? 270 : 230) + i * 40} width={i ? 640 : 860} height={10} rx={5} fill={C.ink} opacity={0.22} />
            ))}
            <RichText x={560} y={350} w={880} h={440} text={text} size={size} color={C.ink} lineHeight={1.3} p={ramp(t, t0, t0 + dur, ease.linear)} mark={highlight} markP={ramp(t, th, th + 0.7)} markColor={markColor} valign="middle" weight={500} />
            {[0, 1, 2].map((i) => (
              <rect key={i} x={560} y={830 + i * 40} width={[820, 900, 520][i]} height={10} rx={5} fill={C.ink} opacity={0.22} />
            ))}
          </g>
        </g>
        {source && <Tag x={960} y={1000} anchor="center" text={source} kind="ink" p={ramp(t, t0 + dur * 0.6, t0 + dur * 0.6 + 0.6)} size={22} />}
      </ShotShell>
    );
  }
  if (style === 'typed') {
    const size = fitSize(text.length, 1320, 440, 44, 78, 1.25);
    const done = t0 + text.length / 32;
    return (
      <ShotShell t={t} a={a} b={b} tone={tn} seed={seed} motif={motif ?? 'frame'}>
        <rect x={250} y={300} width={8} height={lerp(0, 440, ease.inOut(ramp(t, t0 - 0.4, t0 + 0.3)))} fill={P.accent} />
        <RichText x={300} y={300} w={1320} h={440} text={text} size={size} color={P.fg} lineHeight={1.25} mode="type" p={ramp(t, t0, done, ease.linear)} caret t={t} accent={P.accent} mark={highlight} markP={ramp(t, Math.max(th, done), Math.max(th, done) + 0.6)} markColor={markColor} markStyle="underline" valign="middle" weight={500} />
        {source && <NameTag x={300} y={850} name={source} sub={sub} p={ramp(t, done + 0.1, done + 0.7)} color={P.accent} dark={P.dark} />}
      </ShotShell>
    );
  }
  // card
  const cw = 1380;
  const size = fitSize(text.length, cw - 260, 380, 40, 66, 1.22);
  const cardP = ramp(t, t0 - 0.35, t0 + 0.5, ease.linear);
  const tilt = sideOf(seed, 4) * 0.8;
  return (
    <ShotShell t={t} a={a} b={b} tone={tn} seed={seed} motif={motif}>
      <Card x={960} y={520} w={cw} h={660} p={cardP} rot={tilt} fill={P.dark ? C.inkSoft : C.paperLight} radius={10}>
        <rect x={0} y={0} width={14} height={660} fill={P.accent} />
        <text x={110} y={250} fontFamily={FONT_SERIF} fontWeight={800} fontSize={300} fill={P.accent} opacity={0.9 * ease.out(ramp(t, t0, t0 + 0.6))}>
          “
        </text>
        <RichText x={170} y={150} w={cw - 300} h={360} text={text} size={size} italic color={P.fg} lineHeight={1.22} p={ramp(t, t0 + 0.1, t0 + 0.1 + dur, ease.linear)} mark={highlight} markP={ramp(t, th, th + 0.7)} markColor={markColor} accent={accent} valign="middle" weight={500} />
        {source && (
          <g>
            <rect x={170} y={548} width={lerp(0, 60, ease.inOut(ramp(t, t0 + dur * 0.7, t0 + dur * 0.7 + 0.5)))} height={4} fill={P.accent} />
            <text x={250} y={562} fontFamily={FONT_SERIF} fontWeight={700} fontSize={36} fill={P.fg} opacity={ramp(t, t0 + dur * 0.7, t0 + dur * 0.7 + 0.5)}>
              {source}
            </text>
            {sub && (
              <text x={250} y={602} fontFamily={FONT_SANS} fontWeight={700} fontSize={22} letterSpacing={2.6} fill={P.mute} opacity={ramp(t, t0 + dur * 0.8, t0 + dur * 0.8 + 0.5)}>
                {sub.toUpperCase()}
              </text>
            )}
          </g>
        )}
      </Card>
    </ShotShell>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 4 · EvidenceShot

/**
 * EvidenceShot — a real archival image framed on a gallery wall (picture wires, lamp light). Image via kit Photo
 * (slug/src/credit/caption). `aspect` = image w/h (sets the window). `mark` circles a detail (0..1 window coords)
 * with an optional callout `label`; the camera slowly pushes toward it. `tag` = certainty chip on the frame corner,
 * `nameTag` = person/source plate on the lower-left corner. Default tone shade (ink = dark gallery).
 */
export const EvidenceShot: React.FC<
  ShotBase & {
    slug: string;
    src: string;
    credit?: string;
    caption?: string;
    aspect?: number;
    width?: number;
    frame?: 'museum' | 'print';
    tint?: 'paper' | 'sepia' | 'ink' | 'none';
    pan?: {from: [number, number, number]; to: [number, number, number]};
    mark?: {rx: number; ry: number; rw: number; rh: number; at?: number; shape?: 'ellipse' | 'box'; label?: string};
    tag?: {text: string; kind?: Sem; at?: number};
    nameTag?: {name: string; sub?: string; at?: number};
    at?: number;
  }
> = ({t, a, b, tone = 'shade', seed = 1, slug, src, credit, caption, aspect = 1.6, width, frame = 'museum', tint = 'paper', pan, mark, tag, nameTag, at}) => {
  const P = tonePal(tone);
  const t0 = at ?? a + 0.1;
  const w0 = width ?? Math.min(980, 600 * aspect);
  const w = Math.round(w0);
  const h = Math.round(w0 / aspect);
  const px = 960;
  const py = 470;
  const pad = frame === 'museum' ? Math.min(w, h) * 0.09 : 18;
  const fl = px - w / 2 - pad - 10;
  const fr = px + w / 2 + pad + 10;
  const ft = py - h / 2 - pad - 10;
  const fb = py + h / 2 + pad + 10;
  const pz = pan ?? (mark ? {from: [mark.rx, mark.ry, 1] as [number, number, number], to: [mark.rx, mark.ry, 1.14] as [number, number, number]} : {from: [0.5, 0.5, 1] as [number, number, number], to: [0.5, 0.45, 1.08] as [number, number, number]});
  const pa = t0;
  const pb = Math.max(b, t0 + 4);
  const q = ease.inOutSine(clamp01((t - pa) / (pb - pa)));
  const fx = lerp(pz.from[0], pz.to[0], q);
  const fy = lerp(pz.from[1], pz.to[1], q);
  const z = Math.exp(lerp(Math.log(pz.from[2]), Math.log(pz.to[2]), q));
  const mAt = mark?.at ?? t0 + 1;
  const mcx = mark ? fx + (mark.rx - fx) * z : 0.5;
  const mcy = mark ? fy + (mark.ry - fy) * z : 0.5;
  const mx = px - w / 2 + mcx * w;
  const my = py - h / 2 + mcy * h;
  const labelRight = mx >= px;
  const wall = P.dark ? C.ink : tone === 'paper' ? C.paper : C.paperShade;
  return (
    <ShotShell
      t={t}
      a={a}
      b={b}
      tone={tone}
      seed={seed}
      focus={mark ? [mx, my] : [px, py]}
      zoom={[1, 1.04]}
      bg={
        <g>
          <rect x={-300} y={-200} width={2520} height={1500} fill={wall} />
          <rect x={-300} y={-200} width={2520} height={250} fill={mixHex(wall, C.ink, P.dark ? 0.3 : 0.05)} />
          <rect x={-300} y={44} width={2520} height={10} fill={mixHex(wall, C.ink, P.dark ? 0.45 : 0.16)} />
          <rect x={-300} y={1010} width={2520} height={400} fill={mixHex(wall, C.ink, P.dark ? 0.3 : 0.07)} />
          <rect x={-300} y={1004} width={2520} height={8} fill={mixHex(wall, C.ink, P.dark ? 0.45 : 0.16)} />
          <LightPool x={px} y={py - 120} r={760} sy={0.85} strength={P.dark ? 1.6 : 1.1} color={C.lamp} />
          <path d={`M${px} 54 L${fl + 80} ${ft + 4} M${px} 54 L${fr - 80} ${ft + 4}`} stroke={mixHex(wall, C.ink, 0.5)} strokeWidth={3} fill="none" opacity={ramp(t, t0 - 0.3, t0 + 0.2)} />
          <circle cx={px} cy={54} r={8} fill={mixHex(wall, C.ink, 0.55)} />
        </g>
      }
    >
      <Photo slug={slug} src={src} x={px} y={py} w={w} h={h} t={t} p={ramp(t, t0 - 0.35, t0 + 0.6, ease.linear)} frame={frame} tint={tint} caption={caption} credit={credit} dark={P.dark} pan={{a: pa, b: pb, from: pz.from, to: pz.to}} />
      {mark && (
        <g>
          <PhotoMark x={px} y={py} w={w} h={h} rx={mcx} ry={mcy} rw={mark.rw * z} rh={mark.rh * z} p={ramp(t, mAt, mAt + 0.8)} shape={mark.shape} color={P.dark ? C.oxLight : C.oxblood} />
          {mark.label && (
            <g opacity={ramp(t, mAt + 0.5, mAt + 0.9)}>
              <path d={`M${mx + (labelRight ? 1 : -1) * ((mark.rw * z * w) / 2 + 4)} ${my} L${labelRight ? fr + 30 : fl - 30} ${my}`} stroke={P.dark ? C.oxLight : C.oxblood} strokeWidth={4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease.inOut(ramp(t, mAt + 0.5, mAt + 1))} />
              <Plate x={labelRight ? fr + 30 : fl - 30 - (textW(mark.label.toUpperCase(), 24, 'sansCaps') + 40)} y={my - 30} w={textW(mark.label.toUpperCase(), 24, 'sansCaps') + 40} h={60} p={ramp(t, mAt + 0.7, mAt + 1.1)} dark={P.dark} />
              <Kicker x={labelRight ? fr + 50 : fl - 50} y={my + 9} text={mark.label} anchor={labelRight ? 'start' : 'end'} p={ramp(t, mAt + 0.8, mAt + 1.2)} color={P.dark ? C.paperLight : C.oxblood} size={24} />
            </g>
          )}
        </g>
      )}
      {tag && <Tag x={fl + 30} y={ft + 4} text={tag.text} kind={tag.kind ?? 'confirmed'} p={ramp(t, tag.at ?? t0 + 0.6, (tag.at ?? t0 + 0.6) + 0.6)} size={24} />}
      {nameTag && (
        <g>
          <Plate x={fl - 50} y={fb - 96} w={Math.max(textW(nameTag.name, 46), nameTag.sub ? textW(nameTag.sub.toUpperCase(), 22, 'sansCaps') : 0) + 110} h={nameTag.sub ? 122 : 90} p={ramp(t, nameTag.at ?? t0 + 0.9, (nameTag.at ?? t0 + 0.9) + 0.5)} dark={P.dark} />
          <NameTag x={fl - 20} y={fb - 40} name={nameTag.name} sub={nameTag.sub} p={ramp(t, (nameTag.at ?? t0 + 0.9) + 0.1, (nameTag.at ?? t0 + 0.9) + 0.7)} color={P.accent} dark={P.dark} />
        </g>
      )}
    </ShotShell>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 5 · ClaimShot

const KIND_ICON: Record<'confirmed' | 'theory' | 'caution', IconName> = {confirmed: 'check', theory: 'question', caution: 'warning'};
const KIND_TAG: Record<'confirmed' | 'theory' | 'caution', string> = {confirmed: 'Confirmed', theory: 'Theory', caution: 'Debated'};

/**
 * ClaimShot — one claim with its certainty. kind confirmed (solid green rule) | theory (dashed plum frame —
 * Binly "inferred") | caution (mustard). `tag` text (defaults Confirmed/Theory/Debated), optional `stamp` verdict (verdict 'pen' = Binly default: red-pen strike + handwritten note; 'stamp' = rubber stamp for rare big verdicts),
 * optional `but` follow-up line ("But…") at `butAt`. `highlight` words in the claim get the accent colour.
 */
export const ClaimShot: React.FC<
  ShotBase & {text: string; kind?: 'confirmed' | 'theory' | 'caution'; tag?: string; stamp?: string; verdict?: 'pen' | 'stamp'; but?: string; icon?: IconName; highlight?: string[]; at?: number; tagAt?: number; stampAt?: number; butAt?: number}
> = ({t, a, b, tone = 'paper', seed = 1, motif, text, kind = 'confirmed', tag, stamp, verdict = 'pen', but, icon, highlight, at, tagAt, stampAt, butAt}) => {
  const P = tonePal(tone);
  const t0 = at ?? a + 0.2;
  const col = semColor(kind, P.dark);
  const x0 = 250;
  const cw = 1060;
  const size = fitSize(text.length, cw, 290, 52, 88, 1.15);
  const lines = Math.max(1, Math.ceil((textW(text, size, 'serif') * 1.06) / cw));
  const ch = lines * size * 1.17 + 10;
  const butH = but ? 130 : 0;
  const H = 70 + ch + butH;
  const top = 560 - H / 2 + 70; // claim text top (tag sits 70 above)
  const nW = text.split(/\s+/).length;
  const dur = Math.min(1.6, 0.3 + nW * 0.08);
  const ruleH = lerp(0, ch, ease.inOut(ramp(t, t0 - 0.2, t0 + 0.6)));
  const tb = butAt ?? t0 + dur + 0.6;
  const ts = stampAt ?? t0 + dur + 0.3;
  const watermark = mixHex(P.bg, kind === 'confirmed' ? C.evidence : kind === 'theory' ? C.theory : C.caution, P.dark ? 0.22 : 0.13);
  const frameP = ramp(t, t0 - 0.2, t0 + 0.7);
  const fr = {x: x0 - 90, y: top - 130, w: cw + 180, h: H + 120};
  const dashed = kind !== 'confirmed';
  const panel = P.dark ? C.inkSoft : C.paperLight;
  return (
    <ShotShell t={t} a={a} b={b} tone={tone} seed={seed} motif={motif ?? 'none'} focus={[fr.x + fr.w / 2, fr.y + fr.h / 2]}>
      <Icon name={icon ?? KIND_ICON[kind]} x={1600} y={fr.y + fr.h / 2} s={3.6} color={watermark} accent={watermark} knock={P.bg} p={ramp(t, t0, t0 + 0.9)} r={sideOf(seed, 3) * 6} />
      <g opacity={ease.out(frameP)} transform={`translate(0 ${(1 - ease.outQuint(frameP)) * 40})`}>
        <rect x={fr.x + 12} y={fr.y + 16} width={fr.w} height={fr.h} rx={12} fill={C.ink} opacity={0.1} />
        <rect x={fr.x} y={fr.y} width={fr.w} height={fr.h} rx={12} fill={panel} />
        {dashed ? (
          <DashedOutline d={`M${fr.x + 14} ${fr.y + 14} H${fr.x + fr.w - 14} V${fr.y + fr.h - 14} H${fr.x + 14} Z`} p={1} color={col} width={4} />
        ) : (
          <rect x={fr.x + 14} y={fr.y + 14} width={fr.w - 28} height={fr.h - 28} rx={6} fill="none" stroke={col} strokeWidth={3} opacity={0.55} />
        )}
      </g>
      <rect x={x0 - 40} y={top} width={12} height={ruleH} fill={col} rx={2} />
      <Tag x={x0} y={top - 50} text={tag ?? KIND_TAG[kind]} kind={kind} p={ramp(t, tagAt ?? t0, (tagAt ?? t0) + 0.6)} size={24} />
      <RichText x={x0} y={top} w={cw} h={ch + 20} text={text} size={size} color={P.fg} lineHeight={1.15} p={ramp(t, t0 + 0.1, t0 + 0.1 + dur, ease.linear)} mark={highlight} markP={1} markColor="transparent" accent={col} valign="top" weight={600} strike={stamp && verdict === 'pen' && kind !== 'confirmed' ? ramp(t, ts, ts + 0.5, ease.inOut) : 0} strikeColor={P.accent} />
      {but && (
        <g>
          <rect x={x0} y={top + ch + 24} width={lerp(0, 120, ease.inOut(ramp(t, tb - 0.2, tb + 0.3)))} height={3} fill={P.line} />
          <Kicker x={x0} y={top + ch + 92} text="But" p={ramp(t, tb, tb + 0.4)} color={P.accent} anchor="start" size={26} />
          <RichText x={x0 + 96} y={top + ch + 50} w={cw - 96} h={100} text={but} size={Math.min(44, fitSize(but.length, cw - 96, 90, 30, 44))} italic color={P.fg} p={ramp(t, tb + 0.05, tb + 0.9, ease.linear)} weight={500} />
        </g>
      )}
      {stamp && verdict === 'stamp' && <Stamp x={fr.x + fr.w - 150} y={fr.y + 20} text={stamp} p={ramp(t, ts, ts + 0.45, ease.linear)} color={kind === 'caution' ? P.accent : col} size={52} rot={-7 * sideOf(seed, 8)} />}
      {stamp && verdict === 'pen' && (
        <HandNote x={fr.x + fr.w - 60} y={top - 34} text={stamp} anchor="end" size={60} color={P.accent} p={ramp(t, ts + 0.45, ts + 1.0, ease.linear)} />
      )}
    </ShotShell>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 6 · CompareShot

export type CompareSide = {title: string; bullets?: string[]; kind?: Sem; icon?: IconName; value?: string; weight?: number};

/**
 * CompareShot — A vs B. mode 'columns' (two cards + VS disc), 'venn' (overlap + side lists), 'balance' (scale tips to
 * the verdict). Sides: title, ≤3 short bullets, kind (semantic colour), icon, value. `verdict` {text, side, kind, at}
 * highlights the winning side (others dim) and shows a verdict chip.
 */
export const CompareShot: React.FC<
  ShotBase & {left: CompareSide; right: CompareSide; mode?: 'columns' | 'venn' | 'balance'; overlap?: string; kicker?: string; title?: string; verdict?: {text: string; side?: 'left' | 'right' | 'both'; kind?: Sem; at?: number}; at?: number; rightAt?: number}
> = ({t, a, b, tone = 'shade', seed = 1, motif, left, right, mode = 'columns', overlap, kicker, title, verdict, at, rightAt}) => {
  const P = tonePal(tone);
  const t0 = at ?? a + 0.2;
  const tr = rightAt ?? t0 + 0.5;
  const tv = verdict?.at ?? tr + 1.1;
  const vp = verdict ? ramp(t, tv, tv + 0.6) : 0;
  const head = !!(kicker || title);
  const sides = [left, right];
  const sideT = [t0, tr];
  const dimOf = (i: number) => (verdict && verdict.side && verdict.side !== 'both' && (verdict.side === 'left' ? 1 : 0) === i ? 1 - 0.5 * vp : 1);
  const win = (i: number) => verdict?.side === 'both' || (verdict?.side === 'left' && i === 0) || (verdict?.side === 'right' && i === 1);
  const colOf = (i: number) => semColor(sides[i].kind ?? (i === 0 ? 'theory' : 'confirmed'), P.dark);
  const verdictEl = verdict && <Tag x={960} y={head ? 952 : 930} anchor="center" text={verdict.text} kind={verdict.kind ?? 'signal'} p={vp} size={26} />;
  const lists = (y0: number, xl: number, xr: number) =>
    sides.map((s, i) =>
      (s.bullets ?? []).slice(0, 3).map((bl, j) => (
        <g key={`${i}-${j}`} opacity={dimOf(i)}>
          <RichText x={i === 0 ? xl - 360 : xr} y={y0 + j * 92} w={360} h={90} text={bl} size={30} color={P.fg} align={i === 0 ? 'right' : 'left'} valign="middle" p={ramp(t, sideT[i] + 0.4 + j * 0.15, sideT[i] + 0.9 + j * 0.15)} mode="fade" weight={500} />
        </g>
      ))
    );
  if (mode === 'venn') {
    const cy = head ? 590 : 540;
    return (
      <ShotShell t={t} a={a} b={b} tone={tone} seed={seed} motif={motif ?? 'none'}>
        {head && <Heading x={960} y={140} kicker={kicker} title={title} p={ramp(t, t0 - 0.3, t0 + 0.6)} P={P} anchor="middle" size={56} />}
        <Venn x={960} y={cy} r={250} labels={[left.title, right.title]} overlap={overlap} p={ramp(t, t0, tr + 1)} kinds={[left.kind ?? 'theory', right.kind ?? 'confirmed']} />
        {lists(cy - 130, 520, 1400)}
        {verdictEl}
      </ShotShell>
    );
  }
  if (mode === 'balance') {
    const tilt = verdict?.side === 'left' ? -0.75 : verdict?.side === 'right' ? 0.75 : 0;
    const tl = vp * tilt + Math.sin(t * 1.3) * 0.06 * (1 - Math.abs(vp * tilt)) + noise1(t * 0.5, seed) * 0.03;
    const by = head ? 400 : 350;
    return (
      <ShotShell t={t} a={a} b={b} tone={tone} seed={seed} motif={motif ?? 'none'}>
        {head && <Heading x={960} y={140} kicker={kicker} title={title} p={ramp(t, t0 - 0.3, t0 + 0.6)} P={P} anchor="middle" size={56} />}
        <BalanceScale x={960} y={by} s={1.3} tilt={tl} p={ramp(t, t0 - 0.2, t0 + 0.5)} leftLabel={left.title} rightLabel={right.title} leftItems={Math.round((left.weight ?? 2) * ramp(t, t0 + 0.2, t0 + 0.8, ease.linear))} rightItems={Math.round((right.weight ?? 2) * ramp(t, tr, tr + 0.6, ease.linear))} leftColor={colOf(0)} rightColor={colOf(1)} color={P.fg} labelSize={30} />
        {lists(by + 30, 470, 1450)}
        {verdict?.side && verdict.side !== 'both' && <Pulse x={960 + (verdict.side === 'left' ? -299 : 299)} y={by + 195 + 299 * 0.24 * (verdict.side === 'left' ? -tilt : tilt)} r={150} p={ramp(t, tv + 0.3, tv + 1.3)} color={P.accent} />}
        {verdictEl}
      </ShotShell>
    );
  }
  // columns
  const cy = head ? 590 : 530;
  const chh = head ? 560 : 620;
  return (
    <ShotShell t={t} a={a} b={b} tone={tone} seed={seed} motif={motif ?? 'none'}>
      {head && <Heading x={960} y={135} kicker={kicker} title={title} p={ramp(t, t0 - 0.3, t0 + 0.6)} P={P} anchor="middle" size={56} />}
      {sides.map((s, i) => {
        const x = i === 0 ? 590 : 1330;
        const c = colOf(i);
        const pp = ramp(t, sideT[i] - 0.2, sideT[i] + 0.6, ease.linear);
        const w = 660;
        const wn = win(i) ? vp : 0;
        const nb = (s.bullets ?? []).slice(0, 3);
        const hasTop = !!(s.icon || s.value);
        const titleY = hasTop ? 250 : 120;
        return (
          <g key={i} opacity={dimOf(i)}>
            <Card x={x} y={cy} w={w} h={chh} p={pp} rot={(i === 0 ? -1 : 1) * 0.6} fill={P.dark ? C.inkSoft : C.paperLight} stroke={wn > 0 ? c : undefined} radius={14}>
              <rect x={0} y={0} width={w} height={14} rx={7} fill={c} />
              {s.icon && <Medal x={w / 2} y={128} r={68} p={ramp(t, sideT[i] + 0.15, sideT[i] + 0.8, ease.linear)} fill={mixHex(P.dark ? C.inkSoft : C.paperLight, c, 0.14)} ring={c} icon={s.icon} iconColor={P.dark ? C.paperLight : C.ink} accent={c} />}
              {!s.icon && s.value && (
                <text x={w / 2} y={170} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={110} fill={c}>
                  {s.value}
                </text>
              )}
              <text x={w / 2} y={titleY} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={s.title.length > 18 ? 40 : 50} fill={P.fg}>
                {s.title}
              </text>
              <rect x={w / 2 - 30} y={titleY + 26} width={60} height={4} fill={c} />
              {nb.map((bl, j) => (
                <g key={j} opacity={ramp(t, sideT[i] + 0.45 + j * 0.15, sideT[i] + 0.85 + j * 0.15)}>
                  <circle cx={70} cy={titleY + 92 + j * 84} r={9} fill={c} />
                  <RichText x={96} y={titleY + 62 + j * 84} w={w - 140} h={70} text={bl} size={nb.some((q) => q.length > 30) ? 28 : 32} color={P.fg} valign="middle" weight={500} lineHeight={1.12} />
                </g>
              ))}
              {s.icon && s.value && (
                <text x={w - 40} y={chh - 40} textAnchor="end" fontFamily={FONT_SERIF} fontWeight={700} fontSize={56} fill={c}>
                  {s.value}
                </text>
              )}
            </Card>
            {wn > 0 && (
              <g transform={`translate(${x + w / 2 - 40} ${cy - chh / 2 + 40}) scale(${ease.outBack(wn)})`}>
                <circle r={44} fill={c} stroke={P.bg} strokeWidth={6} />
                <CheckMark x={0} y={2} size={44} p={ramp(wn, 0.3, 1)} color={C.paperLight} width={9} />
              </g>
            )}
          </g>
        );
      })}
      <g opacity={ramp(t, tr + 0.1, tr + 0.5)} transform={`translate(960 ${cy}) scale(${ease.outBack(ramp(t, tr + 0.1, tr + 0.6))})`}>
        <circle r={58} fill={P.dark ? C.paperLight : C.ink} />
        <text y={12} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={32} letterSpacing={2} fill={P.dark ? C.ink : C.paperLight}>
          VS
        </text>
      </g>
      {verdictEl}
    </ShotShell>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 7 · ListShot

export type ListItem = {label: string; icon?: IconName; sub?: string; kind?: Sem};

/**
 * ListShot — 2–5 items revealed on `cues` (or `at` + i·`gap`). layout 'tiles' (icon medallions in a row) or
 * 'column' (numbered rows + a big medallion on the right showing the latest item, or your `children` there,
 * origin = (1440, 560)). `highlight` index lifts one item at `highlightAt` and dims the rest.
 */
export const ListShot: React.FC<
  ShotBase & {items: ListItem[]; kicker?: string; title?: string; layout?: 'tiles' | 'column'; numbered?: boolean; cues?: number[]; at?: number; gap?: number; highlight?: number; highlightAt?: number; children?: React.ReactNode}
> = ({t, a, b, tone = 'paper', seed = 1, motif, items, kicker, title, layout = 'tiles', numbered = true, cues, at, gap = 0.7, highlight, highlightAt, children}) => {
  const P = tonePal(tone);
  const t0 = at ?? a + 0.4;
  const n = items.length;
  const head = !!(kicker || title);
  const lastCue = cue(cues, n - 1, t0, gap);
  const th = highlightAt ?? lastCue + 0.8;
  const hp = highlight !== undefined ? ramp(t, th, th + 0.5) : 0;
  const tp = (i: number) => ramp(t, cue(cues, i, t0, gap) - 0.1, cue(cues, i, t0, gap) + 0.7, ease.linear);
  const colOf = (it: ListItem) => (it.kind ? semColor(it.kind, P.dark) : P.dark ? C.paperDeep : C.inkLift);
  if (layout === 'column') {
    const rowH = Math.min(150, 640 / n);
    const y0 = 540 - ((n - 1) * rowH) / 2 + (head ? 60 : 0);
    // latest revealed item (for the big medallion)
    let cur = -1;
    items.forEach((_, i) => {
      if (t >= cue(cues, i, t0, gap) - 0.1) cur = i;
    });
    if (highlight !== undefined && hp > 0) cur = highlight;
    return (
      <ShotShell t={t} a={a} b={b} tone={tone} seed={seed} motif={motif ?? 'none'}>
        {head && <Heading x={170} y={150} kicker={kicker} title={title} p={ramp(t, a, t0 + 0.4)} P={P} size={60} />}
        {items.map((it, i) => {
          const p = tp(i);
          if (p <= 0) return null;
          const y = y0 + i * rowH;
          const isH = highlight === i;
          const o = highlight !== undefined && !isH ? 1 - 0.55 * hp : 1;
          const k = ease.out(p);
          const c = isH ? lerpCol(colOf(it), P.accent, hp) : colOf(it);
          return (
            <g key={i} opacity={o * clamp01(p * 2)} transform={`translate(${(1 - k) * -40} 0)`}>
              {numbered && (
                <text x={250} y={y + 22} textAnchor="end" fontFamily={FONT_SERIF} fontWeight={700} fontSize={64} fill={isH ? c : P.mute}>
                  {i + 1}
                </text>
              )}
              {it.icon && <Icon name={it.icon} x={numbered ? 330 : 220} y={y} s={0.75} p={p} color={P.fg} accent={c} knock={P.bg} />}
              <text x={it.icon ? (numbered ? 400 : 290) : numbered ? 290 : 180} y={y + (it.sub ? 4 : 16)} fontFamily={FONT_SERIF} fontWeight={600} fontSize={rowH > 120 ? 50 : 42} fill={P.fg}>
                {it.label}
              </text>
              {it.sub && <Kicker x={it.icon ? (numbered ? 402 : 292) : numbered ? 292 : 182} y={y + 44} text={it.sub} anchor="start" color={P.mute} size={22} p={ramp(p, 0.4, 1)} />}
              {isH && <rect x={it.icon ? (numbered ? 400 : 290) : 290} y={y + (it.sub ? 64 : 34)} width={lerp(0, Math.min(520, textW(it.label, 50)), ease.inOut(hp))} height={5} fill={P.accent} />}
            </g>
          );
        })}
        <g transform="translate(1440 560)">
          {children ?? (
            <g>
              <circle r={290} fill={P.motif} opacity={ramp(t, t0 - 0.3, t0 + 0.5)} />
              <circle r={330} fill="none" stroke={P.line} strokeWidth={2.5} strokeDasharray="3 16" strokeLinecap="round" transform={`rotate(${t * 3})`} opacity={ramp(t, t0, t0 + 0.6)} />
              {items.map((it, i) =>
                it.icon ? (
                  <Icon key={i} name={it.icon} x={0} y={0} s={2.9} p={i === cur ? ramp(t, Math.max(cue(cues, i, t0, gap), highlight === i ? th : 0) - 0.1, Math.max(cue(cues, i, t0, gap), highlight === i ? th : 0) + 0.5) : 0} color={P.fg} accent={it.kind ? colOf(it) : P.accent} knock={P.dark ? mixHex(C.ink, C.paperLight, 0.045) : mixHex(P.bg, C.ink, 0.045)} />
                ) : null
              )}
            </g>
          )}
        </g>
      </ShotShell>
    );
  }
  // tiles
  const slot = 1560 / n;
  const r = Math.min(110, slot * 0.29);
  const cy = head ? 590 : 510;
  const lsize = n <= 3 ? 44 : n === 4 ? 38 : 34;
  return (
    <ShotShell t={t} a={a} b={b} tone={tone} seed={seed} motif={motif ?? 'none'}>
      {head && <Heading x={960} y={190} kicker={kicker} title={title} p={ramp(t, a, t0 + 0.4)} P={P} anchor="middle" size={60} />}
      {items.slice(1).map((_, i) => (
        <line key={i} x1={180 + slot * (i + 0.5) + r + 30} x2={180 + slot * (i + 1.5) - r - 30} y1={cy} y2={cy} stroke={P.line} strokeWidth={3} strokeDasharray="2 14" strokeLinecap="round" opacity={ramp(t, t0 - 0.3, t0 + 0.3)} />
      ))}
      {items.map((it, i) => {
        const p = tp(i);
        if (p <= 0) return null;
        const x = 180 + slot * (i + 0.5);
        const isH = highlight === i;
        const o = highlight !== undefined && !isH ? 1 - 0.55 * hp : 1;
        const lift = isH ? -18 * ease.outBack(hp) : 0;
        const c = colOf(it);
        const fill = isH && hp > 0 ? lerpCol(P.dark ? C.inkSoft : C.paperLight, P.accent, hp) : P.dark ? C.inkSoft : C.paperLight;
        return (
          <g key={i} opacity={o} transform={`translate(0 ${lift})`}>
            <Medal x={x} y={cy} r={r} p={p} fill={fill} ring={isH ? P.accent : c} icon={it.icon} iconColor={isH && hp > 0.5 ? C.paperLight : P.fg} accent={isH && hp > 0.5 ? C.paperLight : it.kind ? c : P.accent} />
            {numbered && (
              <g opacity={ramp(p, 0.4, 0.8)}>
                <circle cx={x - r * 0.78} cy={cy - r * 0.78} r={24} fill={isH ? P.accent : P.fg} />
                <text x={x - r * 0.78} y={cy - r * 0.78 + 8} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={22} fill={P.bg}>
                  {i + 1}
                </text>
              </g>
            )}
            <RichText x={x - slot / 2 + 14} y={cy + r + 34} w={slot - 28} h={130} text={it.label} size={lsize} color={P.fg} align="center" p={ramp(p, 0.3, 1)} mode="fade" weight={600} lineHeight={1.1} />
            {it.sub && <Kicker x={x} y={cy + r + 34 + 150} text={it.sub} color={P.mute} size={22} p={ramp(p, 0.5, 1)} />}
          </g>
        );
      })}
    </ShotShell>
  );
};
const lerpCol = (a: string, b: string, k: number) => (a.startsWith('#') && b.startsWith('#') ? mixHex(a, b, k) : k > 0.5 ? b : a);

// ════════════════════════════════════════════════════════════════════════════════ 8 · TimelineShot

export type TimelineShotEvent = {year: number; label: string; at?: number; kind?: Sem; yearLabel?: string; tier?: 0 | 1};
export type Era = {from: number; to: number; label: string; color?: string};

/**
 * TimelineShot — years/events revealed on cues while an oxblood cursor travels along a TimelineAxis. Events = cards
 * above the axis on two tiers (auto-alternating), `eras` tint columns + a labelled strip below the axis.
 * `format` for deep time (y => `${-y/1e6} MYA`). Title/kicker top-left.
 */
export const TimelineShot: React.FC<
  ShotBase & {from: number; to: number; events: TimelineShotEvent[]; eras?: Era[]; ticks?: number[] | number; format?: (y: number) => string; kicker?: string; title?: string; at?: number; gap?: number}
> = ({t, a, b, tone = 'paper', seed = 1, motif, from, to, events, eras = [], ticks, format, kicker, title, at, gap = 0.8}) => {
  const P = tonePal(tone);
  const t0 = at ?? a + 0.2;
  const x0 = 190;
  const w = 1540;
  const ay = 740;
  const fmt = format ?? ((v: number) => fmtYear(v, from < 0 && to > 0));
  const xOf = (yr: number) => x0 + ((yr - from) / (to - from || 1)) * w;
  const evAt = (i: number) => events[i].at ?? t0 + 0.9 + i * gap;
  const ckeys: [number, number][] = [[t0 + 0.5, from]];
  events.forEach((e, i) => ckeys.push([evAt(i) - 0.15, ckeys[ckeys.length - 1][1]], [evAt(i) + 0.55, e.year]));
  const cursor = keys(t, ckeys, ease.inOut);
  const eraCols = [C.theory, C.caution, C.evidence, C.oxblood];
  const head = !!(kicker || title);
  return (
    <ShotShell t={t} a={a} b={b} tone={tone} seed={seed} motif={motif ?? 'none'}>
      {head && <Heading x={x0 - 20} y={150} kicker={kicker} title={title} p={ramp(t, t0 - 0.3, t0 + 0.6)} P={P} size={60} />}
      {eras.map((er, i) => {
        const xa = xOf(Math.max(from, er.from));
        const xb = xOf(Math.min(to, er.to));
        const c = er.color ?? eraCols[i % eraCols.length];
        const ep = ramp(t, t0 + 0.2 + i * 0.15, t0 + 0.8 + i * 0.15);
        return (
          <g key={i} opacity={ep}>
            <rect x={xa} y={head ? 290 : 220} width={(xb - xa) * ease.inOut(ep)} height={ay - (head ? 290 : 220)} fill={mixHex(P.bg, c, P.dark ? 0.2 : 0.1)} />
            <rect x={xa + 2} y={ay + 96} width={Math.max(0, xb - xa - 4) * ease.inOut(ep)} height={44} rx={6} fill={mixHex(P.bg, c, P.dark ? 0.55 : 0.3)} />
            <text x={(xa + xb) / 2} y={ay + 126} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={22} letterSpacing={2.6} fill={P.fg} opacity={ramp(ep, 0.5, 1)}>
              {er.label.toUpperCase()}
            </text>
          </g>
        );
      })}
      <TimelineAxis x={x0} y={ay} w={w} from={from} to={to} p={ramp(t, t0, t0 + 1.2, ease.linear)} ticks={ticks} format={format} cursor={cursor} color={P.fg} cursorColor={P.accent} tickLabels={!eras.length} />
      {[0, 1].map((pass) => events.map((e, i) => {
        const ep = ramp(t, evAt(i) - 0.1, evAt(i) + 0.7, ease.linear);
        if (ep <= 0) return null;
        const ex = xOf(e.year);
        const tier = e.tier ?? (i % 2) as 0 | 1;
        const stem = (tier ? 300 : 150) * ease.out(ramp(ep, 0, 0.6));
        const c = e.kind ? semColor(e.kind, P.dark) : P.fg;
        const lbl = e.label;
        const lw = Math.max(textW(lbl, 34) + 40, 150);
        const cx = Math.max(x0 + lw / 2 - 40, Math.min(x0 + w - lw / 2 + 40, ex));
        const ty = ay - stem;
        const lo = ramp(ep, 0.45, 1);
        if (pass === 0)
          return (
            <g key={`s${i}`}>
              <line x1={ex} x2={ex} y1={ay} y2={ty} stroke={c} strokeWidth={4} strokeLinecap="round" />
              <circle cx={ex} cy={ay} r={13 * ease.outBack(clamp01(ep * 2))} fill={c} stroke={P.bg} strokeWidth={4} />
            </g>
          );
        return (
          <g key={i}>
            <g opacity={lo} transform={`translate(0 ${(1 - ease.out(lo)) * 12})`}>
              <rect x={cx - lw / 2} y={ty - 104} width={lw} height={104} rx={10} fill={P.dark ? C.inkSoft : C.paperLight} />
              <rect x={cx - lw / 2} y={ty - 104} width={lw} height={8} rx={4} fill={c === P.fg ? P.accent : c} />
              <text x={cx} y={ty - 64} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={22} letterSpacing={2.6} fill={c === P.fg ? P.accent : c}>
                {(e.yearLabel ?? fmt(e.year)).toUpperCase()}
              </text>
              <text x={cx} y={ty - 24} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={600} fontSize={34} fill={P.fg}>
                {lbl}
              </text>
            </g>
          </g>
        );
      }))}
    </ShotShell>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 9 · MapShot

export type MapShotPin = {lon: number; lat: number; label?: string; sub?: string; at?: number; kind?: 'pin' | 'city' | 'spread'; side?: 'right' | 'left' | 'top'; color?: string};

/**
 * MapShot — one GeoMap with pins / cities / spread rings, routes and soft areas revealed on cues. layout 'side'
 * (map box left + title column right with a growing legend) or 'full' (full-bleed map + title plate). Keep it light:
 * one map per shot (50m maps render ≈1–2 s/frame locally).
 */
export const MapShot: React.FC<
  ShotBase & {
    region: Region;
    pins?: MapShotPin[];
    routes?: {points: LonLat[]; at?: number; dashed?: boolean; color?: string; bend?: number}[];
    areas?: {lon: number; lat: number; rx: number; ry?: number; rot?: number; label?: string; at?: number; color?: string}[];
    highlight?: (MapHighlight & {at?: number})[];
    labels?: MapLabelSpec[];
    borders?: boolean;
    kicker?: string;
    title?: string;
    sub?: string;
    layout?: 'side' | 'full';
    at?: number;
    gap?: number;
  }
> = ({t, a, b, tone = 'paper', seed = 1, region, pins = [], routes = [], areas = [], highlight = [], labels, borders, kicker, title, sub, layout = 'side', at, gap = 0.7}) => {
  const P = tonePal(tone);
  const t0 = at ?? a + 0.2;
  const full = layout === 'full';
  const box = full ? {x: -60, y: -40, w: 2040, h: 1160} : {x: 110, y: 100, w: 1160, h: 880};
  const proj = makeProjection(region, box.w, box.h, {x: box.x, y: box.y});
  const pinAt = (i: number) => pins[i].at ?? t0 + 0.8 + i * gap;
  const lastPin = pins.length ? proj(pins[pins.length - 1].lon, pins[pins.length - 1].lat) : [960, 540];
  const pinCol = (pn: MapShotPin) => pn.color ?? C.oxblood;
  return (
    <ShotShell t={t} a={a} b={b} tone={tone} seed={seed} motif="none" focus={[lastPin[0], lastPin[1]]} zoom={[1, 1.05]} dust={!full}>
      <GeoMap
        x={box.x}
        y={box.y}
        w={box.w}
        h={box.h}
        region={region}
        p={ramp(t, t0 - 0.4, t0 + 0.4)}
        frame={!full}
        borders={borders}
        labels={labels}
        labelP={ramp(t, t0 + 0.2, t0 + 0.8)}
        highlight={highlight.map((hl) => ({...hl, p: ramp(t, hl.at ?? t0 + 0.5, (hl.at ?? t0 + 0.5) + 0.8)}))}
      >
        {areas.map((ar, i) => {
          const [x, y] = proj(ar.lon, ar.lat);
          const at2 = ar.at ?? t0 + 0.6 + i * 0.4;
          return <AreaMark key={i} x={x} y={y} rx={ar.rx} ry={ar.ry} rot={ar.rot} label={ar.label} color={ar.color} p={ramp(t, at2, at2 + 0.8)} />;
        })}
        {routes.map((r, i) => {
          const at2 = r.at ?? t0 + 1 + i * gap;
          return <Route key={i} points={r.points} proj={proj} p={ramp(t, at2, at2 + 1.2)} dashed={r.dashed} color={r.color} bend={r.bend} />;
        })}
        {pins.map((pn, i) => {
          const [x, y] = proj(pn.lon, pn.lat);
          const pp = ramp(t, pinAt(i) - 0.1, pinAt(i) + 0.6, ease.linear);
          if (pn.kind === 'city') return <CityDot key={i} x={x} y={y} label={pn.label} p={pp} side={pn.side === 'top' ? 'top' : pn.side} color={pn.color} />;
          if (pn.kind === 'spread')
            return (
              <g key={i}>
                <SpreadRings t={t} x={x} y={y} p={pp} color={pinCol(pn)} />
                {pn.label && <CityDot x={x} y={y} label={pn.label} p={pp} side={pn.side ?? 'right'} color={pinCol(pn)} />}
              </g>
            );
          return <MapPin key={i} x={x} y={y} p={pp} label={pn.label} sub={pn.sub} side={pn.side} color={pinCol(pn)} />;
        })}
      </GeoMap>
      {full ? (
        (kicker || title) && (
          <g>
            <Plate x={130} y={110} w={Math.max(title ? textW(title, 56) : 0, kicker ? textW(kicker.toUpperCase(), 24, 'sansCaps') : 0) + 90} h={title ? 150 : 80} p={ramp(t, t0, t0 + 0.6)} dark={P.dark} />
            <Heading x={175} y={170} kicker={kicker} title={title} p={ramp(t, t0 + 0.1, t0 + 0.9)} P={P} size={56} />
          </g>
        )
      ) : (
        <g>
          {kicker && <Kicker x={1350} y={200} text={kicker} p={ramp(t, t0, t0 + 0.6)} color={P.accent} anchor="start" size={24} />}
          {title && <RichText x={1350} y={225} w={440} h={240} text={title} size={fitSize(title.length, 440, 220, 44, 64, 1.1)} color={P.fg} p={ramp(t, t0 + 0.1, t0 + 0.9, ease.linear)} lineHeight={1.08} weight={700} />}
          {sub && <RichText x={1350} y={460} w={440} h={120} text={sub} size={30} color={P.mute} italic p={ramp(t, t0 + 0.5, t0 + 1.1)} mode="fade" weight={500} />}
          {pins.map((pn, i) => {
            const lp = ramp(t, pinAt(i), pinAt(i) + 0.5);
            if (lp <= 0 || !pn.label) return null;
            const y = 620 + i * 66;
            return (
              <g key={i} opacity={lp} transform={`translate(${(1 - ease.out(lp)) * 20} 0)`}>
                <circle cx={1370} cy={y - 10} r={18} fill={pinCol(pn)} />
                <text x={1370} y={y - 2} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={22} fill={C.paperLight}>
                  {i + 1}
                </text>
                <text x={1406} y={y} fontFamily={FONT_SERIF} fontWeight={600} fontSize={32} fill={P.fg}>
                  {pn.label}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </ShotShell>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 10 · PersonShot

/**
 * PersonShot — introduce a real person: Person (any PersonProps via `person`) in a small environment
 * (room | study | lab | street | museum | plain) + NameTag on a plate. `era` picks the room/street/lab variant,
 * `night` darkens. `prop` = icon held up in the front hand (pose defaults to 'present'). side = where the person
 * stands. `children` = extra props drawn behind the person (world coords).
 */
export const PersonShot: React.FC<
  ShotBase & {
    name: string;
    sub?: string;
    person?: Partial<PersonProps>;
    env?: 'room' | 'study' | 'lab' | 'street' | 'museum' | 'plain';
    era?: RoomEra;
    night?: boolean;
    side?: 'left' | 'right';
    prop?: IconName;
    kicker?: string;
    at?: number;
    nameAt?: number;
    children?: React.ReactNode;
  }
> = ({t, a, b, tone = 'shade', seed = 1, name, sub, person = {}, env = 'room', era = '19thc', night = false, side, prop, kicker, at, nameAt, children}) => {
  const P = tonePal(night ? 'ink' : tone);
  const t0 = at ?? a + 0.1;
  const tn = nameAt ?? t0 + 0.6;
  const sd = side ?? (sideOf(seed, 6) < 0 ? 'left' : 'right');
  const px = sd === 'left' ? 640 : 1280;
  const facing: 1 | -1 = sd === 'left' ? 1 : -1;
  const pk = ease.out(ramp(t, t0 - 0.3, t0 + 0.6));
  const s = 1.22;
  const pprops: PersonProps = {
    pose: prop ? 'present' : 'idle',
    expression: 'smile',
    seed,
    ...person,
    x: px - facing * (1 - pk) * 60,
    y: ENV_FLOOR + (env === 'street' ? 30 : 0),
    s: person.s ?? s,
    t,
    facing: person.facing ?? facing,
    opacity: pk,
  };
  const hands = personHands(pprops);
  const darkEnv = night || env === 'study';
  const scene =
    env === 'study' ? (
      <Study t={t} seed={seed} layer="back" />
    ) : env === 'lab' ? (
      <Lab t={t} seed={seed} era={era === 'modern' ? 'modern' : '19thc'} night={night} />
    ) : env === 'street' ? (
      <Street era={era === 'modern' ? 'modern' : 'medieval'} tone={night ? 'night' : 'day'} t={t} seed={seed} />
    ) : env === 'museum' ? (
      <MuseumHall t={t} seed={seed} plinth={false} />
    ) : env === 'plain' ? (
      <g>
        <rect x={-300} y={-200} width={2520} height={1500} fill={P.bg} />
        <Backdrop tone={night ? 'ink' : tone} motif="rings" seed={seed} t={t} />
        <rect x={-300} y={ENV_FLOOR} width={2520} height={600} fill={mixHex(P.bg, C.ink, P.dark ? 0.25 : 0.07)} />
        <LightPool x={px} y={ENV_FLOOR - 300} r={520} strength={1.2} />
      </g>
    ) : (
      <Room era={era} t={t} seed={seed} night={night} windowX={sd === 'left' ? 1500 : 420} doorX={sd === 'left' ? 1150 : 760} door={false} />
    );
  const tagW = Math.max(textW(name, 46), sub ? textW(sub.toUpperCase(), 22, 'sansCaps') : 0) + 110;
  const tagX = sd === 'left' ? 1060 : 860 - tagW;
  const tagY = env === 'study' ? 420 : 560;
  return (
    <ShotShell t={t} a={a} b={b} tone={night ? 'ink' : tone} seed={seed} focus={[px, 420]} zoom={[1, 1.06]} dust={darkEnv} vignette={darkEnv ? 1.2 : 0.8} bg={scene}>
      {children}
      <ellipse cx={px} cy={pprops.y} rx={150 * pk} ry={18} fill={C.ink} opacity={0.18} />
      <Person {...pprops} />
      {prop && <Icon name={prop} x={hands.front.x + facing * 20} y={hands.front.y - 70} s={0.95} p={ramp(t, t0 + 0.3, t0 + 0.9)} color={darkEnv ? C.paperLight : C.ink} accent={C.oxblood} knock={darkEnv ? C.inkSoft : C.paperShade} />}
      {env === 'study' && <Study t={t} seed={seed} layer="front" />}
      <Plate x={tagX} y={tagY} w={tagW} h={(sub ? 130 : 96) + (kicker ? 46 : 0)} p={ramp(t, tn, tn + 0.5)} dark={darkEnv} />
      {kicker && <Kicker x={tagX + 34} y={tagY + 44} text={kicker} anchor="start" p={ramp(t, tn + 0.05, tn + 0.5)} color={darkEnv ? C.oxTint : P.accent} size={22} />}
      <NameTag x={tagX + 30} y={tagY + 72 + (kicker ? 46 : 0)} name={name} sub={sub} p={ramp(t, tn + 0.1, tn + 0.8)} color={P.accent} dark={darkEnv} />
    </ShotShell>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 11 · ProcessShot

export type ProcessStep = {label: string; icon?: IconName; kind?: Sem; sub?: string};

/**
 * ProcessShot — cause → effect on cues. mode 'chain' (2–5 medallions left→right joined by drawing arrows, a pulse
 * travels the chain on the hold) or 'cycle' (steps around a ring, labels outside, a dot circulates). `center` =
 * text in the middle of a cycle. Last step of a chain gets the accent unless kinds say otherwise.
 */
export const ProcessShot: React.FC<
  ShotBase & {steps: ProcessStep[]; mode?: 'chain' | 'cycle'; kicker?: string; title?: string; center?: string; cues?: number[]; at?: number; gap?: number}
> = ({t, a, b, tone = 'shade', seed = 1, motif, steps, mode = 'chain', kicker, title, center, cues, at, gap = 0.6}) => {
  const P = tonePal(tone);
  const t0 = at ?? a + 0.3;
  const n = steps.length;
  const ct = (i: number) => cue(cues, i, t0, gap);
  const done = ct(n - 1) + 0.8;
  const head = !!(kicker || title);
  const fill = P.dark ? C.inkSoft : C.paperLight;
  const colOf = (s: ProcessStep, i: number) => (s.kind ? semColor(s.kind, P.dark) : i === n - 1 && mode === 'chain' ? P.accent : P.fg);
  if (mode === 'cycle') {
    const cx = 960;
    const cy = 560;
    const R = 270;
    const r = 70;
    const ang = (i: number) => ((i / n) * 360 - 90) * (Math.PI / 180);
    const pt = (i: number, rr = R) => ({x: cx + Math.cos(ang(i)) * rr, y: cy + Math.sin(ang(i)) * rr});
    const loop = ((t - done) / 4) % 1;
    const da = (r + 26) / R; // angular gap around medallions
    return (
      <ShotShell t={t} a={a} b={b} tone={tone} seed={seed} motif={motif ?? 'none'}>
        {head && <Heading x={170} y={150} kicker={kicker} title={title} p={ramp(t, t0 - 0.4, t0 + 0.5)} P={P} size={56} />}
        <circle cx={cx} cy={cy} r={R - r - 40} fill={P.motif} opacity={ramp(t, t0 - 0.3, t0 + 0.4)} />
        {center && <RichText x={cx - 150} y={cy - 80} w={300} h={160} text={center} size={fitSize(center.length, 280, 140, 30, 48)} color={P.fg} align="center" valign="middle" p={ramp(t, t0, t0 + 0.6)} mode="fade" weight={700} />}
        {steps.map((s, i) => {
          const a1 = ang(i) + da;
          const a2 = ang(i + 1) - da;
          const ap = ramp(t, ct((i + 1) % n === 0 ? n - 1 : i + 1) - 0.45 + (i === n - 1 ? 0.5 : 0), ct((i + 1) % n === 0 ? n - 1 : i + 1) + 0.1 + (i === n - 1 ? 0.5 : 0));
          const d = `M${cx + Math.cos(a1) * R} ${cy + Math.sin(a1) * R} A${R} ${R} 0 0 1 ${cx + Math.cos(a2) * R} ${cy + Math.sin(a2) * R}`;
          const k = ease.inOut(ap);
          const tip = {x: cx + Math.cos(lerp(a1, a2, k)) * R, y: cy + Math.sin(lerp(a1, a2, k)) * R};
          const ta = lerp(a1, a2, k) + Math.PI / 2;
          return ap > 0 ? (
            <g key={`a${i}`}>
              <path d={d} fill="none" stroke={P.mute} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
              <path d={`M${tip.x - Math.cos(ta - 0.5) * 20} ${tip.y - Math.sin(ta - 0.5) * 20} L${tip.x} ${tip.y} L${tip.x - Math.cos(ta + 0.5) * 20} ${tip.y - Math.sin(ta + 0.5) * 20}`} fill="none" stroke={P.mute} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ) : null;
        })}
        {t > done &&
          (() => {
            const aa = -Math.PI / 2 + loop * Math.PI * 2;
            return <circle cx={cx + Math.cos(aa) * R} cy={cy + Math.sin(aa) * R} r={10} fill={P.accent} opacity={ramp(t, done, done + 0.5)} />;
          })()}
        {steps.map((s, i) => {
          const p = ramp(t, ct(i) - 0.1, ct(i) + 0.6, ease.linear);
          const c = colOf(s, i);
          const q = pt(i);
          const lp = pt(i, R + r + 40);
          const cosA = Math.cos(ang(i));
          const anchor = Math.abs(cosA) < 0.3 ? 'middle' : cosA > 0 ? 'start' : 'end';
          const ly = lp.y + (Math.abs(cosA) < 0.3 ? (Math.sin(ang(i)) < 0 ? -6 : 30) : 12);
          return (
            <g key={i}>
              <Medal x={q.x} y={q.y} r={r} p={p} fill={fill} ring={c} icon={s.icon} iconColor={P.fg} accent={s.kind ? c : P.accent} />
              {!s.icon && p > 0 && (
                <text x={q.x} y={q.y + 18} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={52} fill={c} opacity={ramp(p, 0.3, 1)}>
                  {i + 1}
                </text>
              )}
              <text x={lp.x} y={ly} textAnchor={anchor} fontFamily={FONT_SERIF} fontWeight={600} fontSize={36} fill={P.fg} opacity={ramp(p, 0.4, 1)}>
                {s.label}
              </text>
              {s.sub && (
                <text x={lp.x} y={ly + 34} textAnchor={anchor} fontFamily={FONT_SANS} fontWeight={700} fontSize={22} letterSpacing={2.4} fill={P.mute} opacity={ramp(p, 0.6, 1)}>
                  {s.sub.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}
      </ShotShell>
    );
  }
  // chain
  const slot = 1560 / n;
  const r = Math.min(100, slot * 0.27);
  const cy = head ? 590 : 510;
  const xs = steps.map((_, i) => 180 + slot * (i + 0.5));
  const lsize = n <= 3 ? 42 : n === 4 ? 36 : 32;
  const loop = ((t - done) / 2.6) % 1;
  return (
    <ShotShell t={t} a={a} b={b} tone={tone} seed={seed} motif={motif ?? 'none'}>
      {head && <Heading x={960} y={190} kicker={kicker} title={title} p={ramp(t, t0 - 0.4, t0 + 0.5)} P={P} anchor="middle" size={56} />}
      {steps.slice(1).map((_, i) => {
        const ap = ramp(t, ct(i + 1) - 0.45, ct(i + 1) + 0.05);
        return <Arrow key={i} from={{x: xs[i] + r + 22, y: cy}} to={{x: xs[i + 1] - r - 22, y: cy}} p={ap} color={P.mute} width={6} head={20} />;
      })}
      {t > done && n > 1 && (
        <circle cx={lerp(xs[0] + r + 22, xs[n - 1] - r - 22, ease.inOutSine(loop))} cy={cy} r={9} fill={P.accent} opacity={ramp(t, done, done + 0.4) * Math.min(1, Math.sin(loop * Math.PI) * 4)} />
      )}
      {steps.map((s, i) => {
        const p = ramp(t, ct(i) - 0.1, ct(i) + 0.6, ease.linear);
        const c = colOf(s, i);
        const last = i === n - 1 && !s.kind;
        return (
          <g key={i}>
            <Medal x={xs[i]} y={cy} r={r} p={p} fill={last ? mixHex(fill, P.accent, 0.12) : fill} ring={c} icon={s.icon} iconColor={P.fg} accent={s.kind ? c : P.accent} />
            {!s.icon && p > 0 && (
              <text x={xs[i]} y={cy + 20} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={64} fill={c} opacity={ramp(p, 0.3, 1)}>
                {i + 1}
              </text>
            )}
            <RichText x={xs[i] - slot / 2 + 12} y={cy + r + 40} w={slot - 24} h={130} text={s.label} size={lsize} color={P.fg} align="center" p={ramp(p, 0.3, 1)} mode="fade" weight={600} lineHeight={1.1} />
            {s.sub && <Kicker x={xs[i]} y={cy + r + 40 + 150} text={s.sub} color={P.mute} size={22} p={ramp(p, 0.5, 1)} />}
          </g>
        );
      })}
    </ShotShell>
  );
};

// ════════════════════════════════════════════════════════════════════════════════ 12 · QuestionShot

/**
 * QuestionShot — an open question / curiosity pivot: big question (words reveal, `highlight` words in the accent)
 * + a slot on the right: mark 'question' (big swaying ?), 'silhouette' (dashed unknown figure with ?), 'none',
 * or your own `children` (slot-local coords, origin = slot centre, fits ≈ 520×520). Default tone ink.
 */
export const QuestionShot: React.FC<
  ShotBase & {question: string; kicker?: string; highlight?: string[]; mark?: 'question' | 'silhouette' | 'none'; at?: number; markAt?: number; side?: 'left' | 'right'; children?: React.ReactNode}
> = ({t, a, b, tone = 'ink', seed = 1, motif, question, kicker, highlight, mark = 'question', at, markAt, side = 'right', children}) => {
  const P = tonePal(tone);
  const t0 = at ?? a + 0.2;
  const tm = markAt ?? t0 + 0.4;
  const slotX = side === 'right' ? 1420 : 500;
  const textX = side === 'right' ? 170 : 900;
  const size = fitSize(question.length, 900, 480, 54, 86, 1.12);
  const qLines = Math.max(1, Math.ceil((textW(question, size, 'serif') * 1.08) / 900));
  const qH = qLines * size * 1.12;
  const qTop = 540 - qH / 2 + 20;
  const nW = question.split(/\s+/).length;
  const plum = P.dark ? C.theoryLight : C.theory;
  const ringP = ramp(t, tm - 0.2, tm + 0.7);
  return (
    <ShotShell t={t} a={a} b={b} tone={tone} seed={seed} motif={motif ?? 'none'} focus={[slotX, 540]}>
      <g transform={`translate(${slotX} 540)`}>
        <circle r={270 * ease.outBack(ringP)} fill={P.motif} />
        <circle r={300} fill="none" stroke={plum} strokeWidth={4} strokeDasharray="14 16" strokeLinecap="round" opacity={ringP * 0.8} transform={`rotate(${t * 6})`} />
        <circle r={340} fill="none" stroke={P.line} strokeWidth={2} strokeDasharray="2 14" strokeLinecap="round" opacity={ringP} transform={`rotate(${-t * 3})`} />
        <Particles t={t} x={-300} y={-300} w={600} h={600} n={14} seed={seed + 4} size={[2, 5]} color={plum} opacity={[0.2, 0.55]} vy={-12} vx={2} />
        {children ? (
          <g opacity={ease.out(ramp(t, tm, tm + 0.6))}>{children}</g>
        ) : mark === 'question' ? (
          <QuestionMark x={0} y={-10} size={400} p={ramp(t, tm, tm + 0.7, ease.linear)} color={P.accent} t={t} />
        ) : mark === 'silhouette' ? (
          <g opacity={ramp(t, tm, tm + 0.6)}>
            <DashedOutline d="M0 -210 C62 -210 100 -160 100 -100 C100 -50 75 -12 44 4 C120 26 180 80 196 200 L-196 200 C-180 80 -120 26 -44 4 C-75 -12 -100 -50 -100 -100 C-100 -160 -62 -210 0 -210 Z" color={plum} width={5} fill={mixHex(P.bg, C.theory, P.dark ? 0.18 : 0.1)} />
            <QuestionMark x={0} y={-100} size={150} p={ramp(t, tm + 0.3, tm + 0.9, ease.linear)} color={P.accent} t={t} />
          </g>
        ) : null}
      </g>
      {kicker && <Kicker x={textX} y={qTop - 34} text={kicker} anchor="start" p={ramp(t, t0 - 0.2, t0 + 0.4)} color={plum} size={26} />}
      <RichText x={textX} y={qTop} w={900} h={qH + 40} text={question} size={size} color={P.fg} valign="top" lineHeight={1.12} p={ramp(t, t0, t0 + Math.min(1.8, 0.3 + nW * 0.12), ease.linear)} mark={highlight} markP={1} markColor="transparent" accent={P.accent} weight={600} />
    </ShotShell>
  );
};
