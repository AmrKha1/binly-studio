// NIGHT FX — set 2 of the AZTIKA look (copied from references/universe-claude, see its STYLE-BIBLE.md):
// Rays · Bokeh · CountNumber · Stamp · Mark · Bubble · punchT · WhooshOut · StripeWipe · NeonSign.
// Reference moments: rays 0:16.4 · count 2:00.4 · stamp 3:16–3:47 · bubble 0:45–0:46 · punch/whoosh 0:27.4–27.8 ·
// stripe wipe 0:09.0 · neon sign-off 14:44.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp01, countCurve, countUp, ease, lerp, phaseOf, popRef, pressIn, rand} from './anim';
import {H, W} from './theme';
import {lb, uid} from './stage';
import {GlowText, N, NPill, nightFont, textWidth, Tone} from './night';
import {isAr} from './lang';
import {cueSfx} from './sfx';
// SOUND (measured from the reference, 2026-11-08): sound marks only the big moments — transitions whoosh, stamps hit,
// bubbles/tags pop, the neon hums. Word pops, pills, count-ups and the year count stay SILENT (the voice carries them).

const WEIGHT = () => (isAr() ? 800 : 900);

/** Rays — slowly rotating sunburst wedges + dark vignette. tone gold («أنت!» 0:16.4) | dark (ending 14:44) | cyan | violet. */
export const Rays: React.FC<{t: number; id: string; x?: number; y?: number; tone?: 'gold' | 'dark' | 'cyan' | 'violet' | 'orange' | 'green' | 'red'; n?: number; spin?: number}> = ({
  t, id, x = W / 2, y = H / 2, tone = 'gold', n = 22, spin = 4,
}) => {
  // orange = behind the sun (13:40) · green = land/nature (2:49) · red = war/danger
  const P = {gold: ['#9A6306', '#5E3A04', '#2B1A01'], dark: ['#3A2E0A', '#161104', '#050402'], cyan: ['#0E4C66', '#082E40', '#02131F'], violet: ['#3A1590', '#22105A', '#0F062B'], orange: ['#C2560E', '#7A3006', '#2A0F02'], green: ['#1F6B3A', '#0F3D22', '#04140B'], red: ['#7A1418', '#45090C', '#160304']}[tone];
  const g = uid('nray', id);
  const R = 2600, a0 = (t * spin * Math.PI) / 180;
  return (
    <g>
      <defs>
        <radialGradient id={g} cx={x / W} cy={y / H} r="0.75">
          <stop offset="0" stopColor={P[0]} />
          <stop offset="0.55" stopColor={P[1]} />
          <stop offset="1" stopColor={P[2]} />
        </radialGradient>
        <radialGradient id={g + '__v'} cx={x / W} cy={y / H} r="0.8">
          <stop offset="0.35" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      {Array.from({length: n}, (_, i) => {
        const a = a0 + (i * 2 * Math.PI) / n, b = a + Math.PI / n;
        return <path key={i} d={`M${x} ${y} L${x + Math.cos(a) * R} ${y + Math.sin(a) * R} L${x + Math.cos(b) * R} ${y + Math.sin(b) * R}Z`} fill="#000" opacity={0.3} />;
      })}
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g}__v)`} />
    </g>
  );
};

/** Bokeh — slow floating soft light dots (gold on rays, cyan on science). */
export const Bokeh: React.FC<{t: number; n?: number; color?: string; seed?: number}> = ({t, n = 26, color = '#FFC928', seed = 1}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const s = seed * 97 + i;
      const x = (rand(s) * W + t * (8 + rand(s + 1) * 14)) % W;
      const y = (rand(s + 2) * H - t * (6 + rand(s + 3) * 10) + H * 4) % H;
      const r = 2 + rand(s + 4) * 4, o = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * (0.8 + rand(s + 5)) + i));
      return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={o} />;
    })}
  </g>
);

/**
 * CountNumber — the hero number counting up fast with an ease-out (2:00.4: 100 → 3,106 in ~1.2 s), in GlowText, with a
 * small punch when it lands. value = the EXACT spoken string ("3,106", "25,800,000 $"); from = start fraction.
 */
export const CountNumber: React.FC<{t: number; at: number; value: string; x: number; y: number; size?: number; tone?: Tone; id: string; dur?: number; from?: number}> = ({
  t, at, value, x, y, size = 170, tone = 'gold', id, dur = 1.64, from = 0.03,
}) => {
  if (t < at) return null;
  // SOUND MAP (references/universe-claude/SOUND.md, measured 2026-11-10): a counted value lands with a shimmer
  cueSfx('sparkle', `count-${id}-${at}`, t >= at + dur && t < at + dur + 0.25, x, {at: at + dur});
  // the reference's count (MOTION.md §5): a late S-curve over 1.64 s (slow start = suspense), WHITE while counting,
  // turning to its tone (gold) on the final value — the payoff
  const p = clamp01((t - at) / dur);
  const k = from + (1 - from) * countCurve(p);
  const q = popRef(clamp01((t - at) / 0.3));
  return (
    <g transform={`translate(${x} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o} {...lb('text', id)}>
      <GlowText text={countUp(value, k)} x={0} y={0} size={size} tone={p >= 1 ? tone : 'white'} id={id} />
    </g>
  );
};

/** Stamp — «تم البيع» / «مو الأغلى»: red ink box + text, PRESSES in like the reference (MOTION.md §2): from 1.64×
 * decelerating to 1.00 in 0.165 s while fading in, then rock still (no shake), tilted (3:16–3:47). */
export const Stamp: React.FC<{t: number; at: number; text: string; x: number; y: number; size?: number; rot?: number; color?: string}> = ({
  t, at, text, x, y, size = 110, rot = -8, color = '#E23A4E',
}) => {
  cueSfx('stamp', `stamp-${text}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.16}); // SOUND MAP: «تم البيع», «انسرقت!» — the owner's stamp (sound library, 2026-11-11; the reference used a boom)
  if (t < at) return null;
  const pr = pressIn((t - at) / 0.165);
  const w = textWidth(text, size) + size * 0.9, h = size * 1.45;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${pr.s})`} opacity={pr.o * 0.92} {...lb('text', `stamp-${at}`)}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={size * 0.2} fill={color} fillOpacity={0.1} stroke={color} strokeWidth={size * 0.09} />
      <text x={0} y={size * 0.05} fontSize={size} fontFamily={nightFont()} fontWeight={WEIGHT()} textAnchor="middle" dominantBaseline="central" fill={color} stroke="none">
        {text}
      </text>
    </g>
  );
};

/** ✔ / ✖ round badge (bubbles, choices, myths). */
export const Mark: React.FC<{kind: 'check' | 'cross'; x: number; y: number; r?: number}> = ({kind, x, y, r = 26}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill={kind === 'check' ? '#22C55E' : '#E23A4E'} stroke="#FFFFFF" strokeWidth={r * 0.18} />
    {kind === 'check' ? (
      <path d={`M${-r * 0.45} 0 L${-r * 0.12} ${r * 0.35} L${r * 0.5} ${-r * 0.35}`} fill="none" stroke="#FFFFFF" strokeWidth={r * 0.26} strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d={`M${-r * 0.38} ${-r * 0.38} L${r * 0.38} ${r * 0.38} M${r * 0.38} ${-r * 0.38} L${-r * 0.38} ${r * 0.38}`} stroke="#FFFFFF" strokeWidth={r * 0.26} strokeLinecap="round" />
    )}
  </g>
);

/**
 * Bubble — speech bubble that pops out of the speaker (0:45.1): white, thick dark outline, tail to (tx, ty).
 * lines = 1–2 short lines; mark = ✔/✖ badge on its corner; icon = any SVG node shown beside the text.
 */
export const Bubble: React.FC<{t: number; at: number; lines: string[]; x: number; y: number; tx: number; ty: number; size?: number; mark?: 'check' | 'cross'; icon?: React.ReactNode; out?: number}> = ({
  t, at, lines, x, y, tx, ty, size = 64, mark, icon, out,
}) => {
  cueSfx('pop', `bubble-${lines.join('')}-${at}`, t >= at && t < at + 0.3, tx, {at, hit: 0.14}); // SOUND MAP: bubbles pop
  // reference (MOTION.md §1, 0:45.0): a bubble swells a little slower than a word — peak 1.15 at ≈ 165 ms
  const p = clamp01((t - at) / 0.33);
  if (p <= 0) return null;
  // exit like the reference (0:50.5): it SHRINKS BACK into the speaker's mouth in 0.15 s, accelerating — not a fade
  const back = out !== undefined ? 1 - ease.in(clamp01((t - out) / 0.15)) : 1;
  if (back <= 0.01) return null;
  const iconW = icon ? size * 2.4 : 0;
  const tw = Math.max(...lines.map((l) => textWidth(l, size)));
  const w = tw + iconW + size * 1.2, h = lines.length * size * 1.25 + size * 0.9;
  const q = popRef(p, 0.5, 0.15);
  const ox = tx - x, oy = ty - y; // tail tip relative to the bubble centre — the bubble grows from it
  const tb = Math.max(-w / 2 + size, Math.min(w / 2 - size, ox * 0.35));
  const sw = size * 0.11;
  return (
    <g transform={`translate(${tx} ${ty}) scale(${q.sx * back} ${q.sy * back}) translate(${-ox} ${-oy})`} opacity={q.o}>
      <path d={`M${tb - size * 0.45} ${h / 2 - sw} L${ox} ${oy} L${tb + size * 0.45} ${h / 2 - sw} Z`} fill="#FFFFFF" stroke={N.outline} strokeWidth={sw} strokeLinejoin="round" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={size * 0.6} fill="#FFFFFF" stroke={N.outline} strokeWidth={sw} {...lb('bubble', `bubble-${at}`)} />
      <rect x={tb - size * 0.38} y={h / 2 - sw * 1.6} width={size * 0.76} height={sw * 2.2} fill="#FFFFFF" />
      {icon && <g transform={`translate(${-w / 2 + size * 0.6 + iconW / 2} 0)`}>{icon}</g>}
      {lines.map((l, i) => (
        <text key={i} x={iconW / 2} y={(i - (lines.length - 1) / 2) * size * 1.25} fontSize={size} fontFamily={nightFont()} fontWeight={WEIGHT()} textAnchor="middle" dominantBaseline="central" fill="#14141F" stroke="none">
          {l}
        </text>
      ))}
      {mark && <Mark kind={mark} x={w / 2 - size * 0.2} y={-h / 2 + size * 0.2} r={size * 0.42} />}
    </g>
  );
};

/**
 * punchT — end-of-scene camera punch-in on the key line (0:27.4): a transform for the last `dur` seconds before `end`,
 * zooming around (cx, cy). <g transform={punchT(t, end, cx, cy)}>…scene…</g>, then <WhooshOut at={end}/>.
 */
export const punchT = (t: number, end: number, cx: number, cy: number, dur = 0.35, amount = 0.35) => {
  const u = clamp01((t - (end - dur)) / dur);
  const s = 1 + amount * u * u;
  return `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`;
};

/** WhooshOut — speed streaks across an empty sky for a few frames between scenes (0:27.8). Draw on top. */
export const WhooshOut: React.FC<{t: number; at: number; dur?: number; color?: string; bg?: string}> = ({t, at, dur = 0.18, color = '#B98BFF', bg = N.skyMid}) => {
  cueSfx('whoosh', `whooshout-${at}`, t >= at - 0.25 && t < at + dur, 960, {at, hit: dur / 2});
  const u = (t - at) / dur;
  if (u < 0 || u > 1) return null;
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={bg} />
      {Array.from({length: 18}, (_, i) => {
        const y = rand(i * 11 + 3) * H, len = 300 + rand(i * 5) * 700;
        const x = -len + (W + len * 2) * ((u * (1.2 + rand(i)) + rand(i * 7)) % 1);
        return <rect key={i} x={x} y={y} width={len} height={2 + rand(i * 3) * 3} rx={2} fill={color} opacity={0.35 + 0.4 * rand(i * 9)} />;
      })}
    </g>
  );
};

/** StripeWipe — diagonal gold/orange stripes cover the cut like the reference (0:08.85, MOTION.md §4): they sweep in and
 * COVER the frame in 36 % of dur (0.17 s), HOLD the cover 22 % (0.10 s — the cut hides here: cut at at + dur/2), then clear
 * in 42 % (0.20 s). Draw on top. */
export const StripeWipe: React.FC<{t: number; at: number; dur?: number}> = ({t, at, dur = 0.47}) => {
  cueSfx('whoosh', `stripes-${at}`, t >= at && t < at + dur, 960, {at, hit: dur * 0.1}); // the sweep is fastest as it enters
  const u = (t - at) / dur;
  if (u < 0 || u > 1) return null;
  const cols = ['#FFC928', '#F59E0B', '#FFD45A', '#F2B010'];
  const lean = H * 0.6, sw = (W + lean) / cols.length + 20; // the band of stripes is wide enough to cover the frame
  const band = sw * cols.length;
  const k = u < 0.36 ? 0.5 * ease.out(u / 0.36) : u < 0.58 ? 0.5 + 0.02 * ((u - 0.36) / 0.22) : 0.52 + 0.48 * ease.in((u - 0.58) / 0.42);
  const x0 = lerp(-(band + lean), W, k); // off left → covers the frame (held) → off right
  return (
    <g>
      {cols.map((c, i) => {
        const x = x0 + i * sw + Math.sin(u * Math.PI) * (i - 1.5) * 30; // a little spread so the stripes feel alive
        return <path key={i} d={`M${x} ${H} L${x + lean} 0 L${x + lean + sw + 70} 0 L${x + sw + 70} ${H} Z`} fill={c} />;
      })}
    </g>
  );
};

/**
 * NightPortrait — the ONE place a real photo may appear in an Arabic video (owner 2026-11-11): a real face that truly
 * matters to the story (a modern famous person), from a FREE-licence Wikimedia photo (`node tools/photo.mjs` → public/<slug>/img,
 * credited in CREDITS.md). Everything else is illustrated (HeroObject art; people = story characters), like the reference.
 * The photo is framed like the reference's Mona Lisa: thick glowing gold frame, graded into the night palette (a touch warmer,
 * darker edges), a light sweep, the reference pop, a slow float and a name pill. photo = path inside public/ (…/img/…).
 */
export const NightPortrait: React.FC<{t: number; at?: number; photo: string; x: number; y: number; h: number; ar?: number; name?: string; shape?: 'frame' | 'oval'; id: string; out?: number}> = ({
  t, at = 0, photo, x, y, h, ar = 0.8, name, shape = 'frame', id, out,
}) => {
  if (t < at) return null;
  cueSfx('sparkle', `portrait-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125}); // SOUND MAP: a hero appears with a shimmer
  const e = t - at;
  const q = popRef(clamp01(e / 0.3));
  const back = out !== undefined ? 1 - ease.in(clamp01((t - out) / 0.18)) : 1;
  if (back <= 0.01) return null;
  const w = h * ar, b = Math.max(14, h * 0.055); // frame thickness
  const fl = Math.sin(t * 1.2 + phaseOf(id)) * 8;
  const sweep = ((e * 0.4) % 1.8) - 0.4;
  const oval = shape === 'oval';
  const rad = oval ? '50%' : `${b * 0.6}px`;
  return (
    <g transform={`translate(${x} ${y + fl}) scale(${q.sx * back} ${q.sy * back})`} opacity={q.o}>
      <foreignObject x={-w / 2 - b - 70} y={-h / 2 - b - 70} width={w + 2 * b + 140} height={h + 2 * b + 140}>
        <div style={{position: 'relative', width: w + 2 * b + 140, height: h + 2 * b + 140}}>
          {/* gold frame with its glow */}
          <div style={{position: 'absolute', left: 70, top: 70, width: w + 2 * b, height: h + 2 * b, borderRadius: oval ? '50%' : b,
            background: 'linear-gradient(145deg, #FFE08A 0%, #F2B010 28%, #C98F0A 52%, #FFD45A 74%, #B07A08 100%)',
            boxShadow: '0 0 18px rgba(255,201,40,0.75), 0 0 60px rgba(255,201,40,0.45), inset 0 0 0 3px rgba(90,50,0,0.55)'}} />
          {/* the photo, graded into the night look */}
          <div style={{position: 'absolute', left: 70 + b, top: 70 + b, width: w, height: h, borderRadius: rad, overflow: 'hidden', boxShadow: 'inset 0 0 0 3px rgba(60,30,0,0.6)'}}>
            <Img src={staticFile(photo)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.9) contrast(1.06) brightness(0.96) sepia(0.12)'}} />
            <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 42%, transparent 55%, rgba(15,6,43,0.55) 100%)'}} />
            <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', background: `linear-gradient(115deg, transparent ${(sweep - 0.1) * 100}%, rgba(255,255,255,0.35) ${sweep * 100}%, transparent ${(sweep + 0.1) * 100}%)`}} />
          </div>
        </div>
      </foreignObject>
      {name && <NPill text={name} x={0} y={h / 2 + b + 34} size={46} kind="white" id={`${id}-name`} p={(e - 0.15) / 0.3} />}
    </g>
  );
};

/** Flash — the reference's white flash on a big slam / reveal («أنت!» 0:15.6, MOTION.md §4): the frame jumps INSTANTLY to
 * ≈ 50 % white, then fades exponentially (half gone in 100 ms, gone by ≈ 0.4 s). Draw on top, on the slam's frame.
 * SILENT: it only lights the frame of a slam/reveal whose own piece already plays the boom (no double hit). */
export const Flash: React.FC<{t: number; at: number; strength?: number; color?: string}> = ({t, at, strength = 0.5, color = '#FFFFFF'}) => {
  if (t < at) return null;
  const o = strength * Math.exp(-(t - at) / 0.144);
  return o < 0.01 ? null : <rect x={-20} y={-20} width={W + 40} height={H + 40} fill={color} opacity={o} />;
};

/**
 * NeonSign — glowing gold neon tube (the 14:44 sign-off emblem): text (or a path `d`) drawn as a bright tube with a
 * light core and a big soft glow; flickers on at `at`, then hums softly.
 */
export const NeonSign: React.FC<{t: number; at: number; x: number; y: number; text?: string; d?: string; size?: number; color?: string; id: string}> = ({
  t, at, x, y, text, d, size = 220, color = '#FFC928', id,
}) => {
  cueSfx('neon', `neon-${id}-${at}`, t >= at && t < at + 0.5, x, {gain: 0.6, at});
  if (t < at) return null;
  const e = t - at;
  const flick = e < 0.5 ? (Math.sin(e * 90) > 0.2 ? 1 : 0.25) : 0.92 + 0.08 * Math.sin(t * 7);
  const f = uid('nneon', id);
  const w = text ? size * 0.07 : size * 0.12;
  const tube = (sw: number, c: string, o: number, filt?: string) =>
    text ? (
      <text x={x} y={y} fontSize={size} fontFamily={nightFont()} fontWeight={WEIGHT()} textAnchor="middle" dominantBaseline="central" fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" opacity={o} filter={filt}>
        {text}
      </text>
    ) : (
      <path d={d} transform={`translate(${x} ${y})`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" opacity={o} filter={filt} />
    );
  return (
    <g opacity={flick}>
      <defs>
        <filter id={f} x="-40%" y="-60%" width="180%" height="220%">
          <feGaussianBlur stdDeviation={size * 0.09} />
        </filter>
      </defs>
      {tube(w * 3.2, color, 0.65, `url(#${f})`)}
      {tube(w * 1.6, color, 1)}
      {tube(w * 0.55, '#FFF3C4', 0.95)}
    </g>
  );
};

/**
 * HeroObject — the glowing centrepiece of a shot (crown 2:28, money pile 3:33, capsule 10:18): a cut-out PNG (generated
 * art, docs/ART-STYLE.md NIGHT blocks) with a soft glow in its own colour, a slow float, a light sweep (shine) across its
 * surface every few seconds and twinkling sparkles. src = path inside public/ (e.g. `${slug}/el/royal-crown.png`),
 * ar = width / height (printed by art.mjs). enter: pop | rise | drop | zoom. Silent (pair with RevealRing for the sparkle sound).
 */
export const HeroObject: React.FC<{t: number; at?: number; src?: string; draw?: (h: number) => React.ReactNode; x: number; y: number; h: number; ar: number; glow?: string; enter?: 'pop' | 'rise' | 'drop' | 'zoom'; float?: boolean; shine?: boolean; sparkles?: number; id: string; out?: number}> = ({
  t, at = 0, src, draw, x, y, h, ar, glow = '#FFC928', enter = 'pop', float = true, shine = true, sparkles = 5, id, out,
}) => {
  if (t < at) return null;
  // SOUND MAP (references/universe-claude/SOUND.md, measured 2026-11-10): precious / hero objects shimmer as they appear
  cueSfx('sparkle', `hero-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.125});
  const e = t - at;
  const p = clamp01(e / 0.35);
  const q = popRef(p, 0.45, enter === 'zoom' ? 0.05 : 0.3);
  const dy = enter === 'rise' ? (1 - ease.out(p)) * 260 : enter === 'drop' ? -(1 - ease.out(p)) * 320 : 0;
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const w = h * ar;
  const fl = float ? Math.sin(t * 1.3 + phaseOf(id)) * 10 : 0;
  const sweep = ((e * 0.45) % 1.6) - 0.3; // a light band passes every ~3.5 s
  const twinkles = Array.from({length: sparkles}, (_, i) => {
    const sx = (rand(i * 7 + id.length) - 0.5) * w * 0.9, sy = (rand(i * 13 + 3) - 0.5) * h * 0.9;
    const tw = Math.max(0, Math.sin(t * (2 + rand(i) * 2) + i * 2.1));
    return tw > 0.05 ? <Sparkle4 key={i} x={sx} y={sy} r={10 + 16 * tw} o={tw} /> : null;
  });
  // HERO FINISH for a CLAUDE-DRAWN object (owner 2026-11-11: "the objects should glow and be fantastic and modern like the
  // reference even if Claude created it by its own"): the same finish as a Flow image — a double glow halo built from the
  // object's own shape, a light sweep clipped exactly to it, twinkles, the reference pop + float, the shimmer sound.
  // draw(h) renders the object centred at (0,0), about h tall and h·ar wide (rich gradients, a highlight edge, a darker
  // side, a thick dark outline — never a flat icon).
  if (draw) {
    const g = uid('nhero', id);
    return (
      <g transform={`translate(${x} ${y + dy + fl}) scale(${q.sx} ${q.sy})`} opacity={q.o * fade}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="none" stroke="none" {...lb('object', id)} />
        <defs>
          <filter id={`${g}-glow`} x="-70%" y="-70%" width="240%" height="240%">
            <feFlood floodColor={glow} result="c" />
            <feGaussianBlur in="SourceAlpha" stdDeviation={h * 0.022} result="b1" />
            <feComposite in="c" in2="b1" operator="in" result="g1" />
            <feGaussianBlur in="SourceAlpha" stdDeviation={h * 0.075} result="b2" />
            <feComposite in="c" in2="b2" operator="in" result="g2" />
            <feMerge><feMergeNode in="g2" /><feMergeNode in="g2" /><feMergeNode in="g1" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`${g}-white`}><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" /></filter>
          <mask id={`${g}-m`}><g filter={`url(#${g}-white)`}>{draw(h)}</g></mask>
          <linearGradient id={`${g}-s`} x1="0" y1="0" x2="1" y2="0" gradientTransform="rotate(25 .5 .5)">
            <stop offset={Math.max(0, sweep - 0.12)} stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset={Math.min(1, Math.max(0, sweep))} stopColor="#FFFFFF" stopOpacity={0.55} />
            <stop offset={Math.min(1, sweep + 0.12)} stopColor="#FFFFFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <g filter={`url(#${g}-glow)`}>{draw(h)}</g>
        {shine && sweep > -0.1 && sweep < 1.1 && <rect x={-w / 2 - 20} y={-h / 2 - 20} width={w + 40} height={h + 40} fill={`url(#${g}-s)`} mask={`url(#${g}-m)`} style={{mixBlendMode: 'screen'}} />}
        {twinkles}
      </g>
    );
  }
  if (!src) return null;
  const file = staticFile(src);
  return (
    <g transform={`translate(${x} ${y + dy + fl}) scale(${q.sx} ${q.sy})`} opacity={q.o * fade}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="none" stroke="none" {...lb('object', id)} />
      <foreignObject x={-w / 2 - 60} y={-h / 2 - 60} width={w + 120} height={h + 120}>
        <div style={{position: 'relative', width: w + 120, height: h + 120}}>
          <Img src={file} style={{position: 'absolute', left: 60, top: 60, width: w, height: h, filter: `drop-shadow(0 0 10px ${glow}) drop-shadow(0 0 34px ${glow}aa)`}} />
          {shine && (
            <div
              style={{
                position: 'absolute', left: 60, top: 60, width: w, height: h,
                WebkitMaskImage: `url("${file}")`, WebkitMaskSize: '100% 100%', maskImage: `url("${file}")`, maskSize: '100% 100%',
                background: `linear-gradient(115deg, transparent ${(sweep - 0.12) * 100}%, rgba(255,255,255,0.55) ${sweep * 100}%, transparent ${(sweep + 0.12) * 100}%)`,
                mixBlendMode: 'screen',
              }}
            />
          )}
        </div>
      </foreignObject>
      {Array.from({length: sparkles}, (_, i) => {
        const sx = (rand(i * 7 + id.length) - 0.5) * w * 0.9, sy = (rand(i * 13 + 3) - 0.5) * h * 0.9;
        const tw = Math.max(0, Math.sin(t * (2 + rand(i) * 2) + i * 2.1));
        return tw > 0.05 ? <Sparkle4 key={i} x={sx} y={sy} r={10 + 16 * tw} o={tw} /> : null;
      })}
    </g>
  );
};
const Sparkle4: React.FC<{x: number; y: number; r: number; o: number}> = ({x, y, r, o}) => {
  const k = r * 0.2;
  return <path d={`M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r}Z`} fill="#FFFFFF" opacity={o} />;
};
