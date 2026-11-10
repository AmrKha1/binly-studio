// NIGHT FX — set 2 of the AZTIKA look (copied from references/universe-claude, see its STYLE-BIBLE.md):
// Rays · Bokeh · CountNumber · Stamp · Mark · Bubble · punchT · WhooshOut · StripeWipe · NeonSign.
// Reference moments: rays 0:16.4 · count 2:00.4 · stamp 3:16–3:47 · bubble 0:45–0:46 · punch/whoosh 0:27.4–27.8 ·
// stripe wipe 0:09.0 · neon sign-off 14:44.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp01, countUp, ease, lerp, popIn, rand} from './anim';
import {H, W} from './theme';
import {uid} from './stage';
import {GlowText, N, nightFont, textWidth, Tone} from './night';
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
  t, at, value, x, y, size = 170, tone = 'gold', id, dur = 1.2, from = 0.03,
}) => {
  if (t < at) return null;
  // SOUND MAP (references/universe-claude/SOUND.md, measured 2026-11-10): a counted value lands with a shimmer
  cueSfx('sparkle', `count-${id}-${at}`, t >= at + dur && t < at + dur + 0.25, x, {at: at + dur});
  const p = clamp01((t - at) / dur);
  const k = from + (1 - from) * (1 - Math.pow(1 - p, 3));
  const q = popIn(clamp01((t - at) / 0.2), 0.45, 0.5);
  const land = p >= 1 ? 1 + 0.06 * Math.max(0, 1 - (t - at - dur) / 0.25) : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${q.sx * land} ${q.sy * land})`} opacity={q.o}>
      <GlowText text={countUp(value, k)} x={0} y={0} size={size} tone={tone} id={id} />
    </g>
  );
};

/** Stamp — «تم البيع» / «مو الأغلى»: red ink box + text, slams in from 1.6× with a short shake, tilted (3:16–3:47). */
export const Stamp: React.FC<{t: number; at: number; text: string; x: number; y: number; size?: number; rot?: number; color?: string}> = ({
  t, at, text, x, y, size = 110, rot = -8, color = '#E23A4E',
}) => {
  cueSfx('boom', `stamp-${text}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.16}); // SOUND MAP: stamps hit as a deep boom («تم البيع», «انسرقت!»)
  if (t < at) return null;
  const u = (t - at) / 0.16;
  const s = u < 1 ? lerp(1.6, 1, u * u) : 1;
  const sh = u >= 1 ? Math.exp(-(t - at - 0.16) * 14) * 7 * Math.sin((t - at) * 70) : 0;
  const w = textWidth(text, size) + size * 0.9, h = size * 1.45;
  return (
    <g transform={`translate(${x + sh} ${y}) rotate(${rot}) scale(${s})`} opacity={clamp01(u * 2) * 0.92}>
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
  cueSfx('pop', `bubble-${lines.join('')}-${at}`, t >= at && t < at + 0.3, tx, {at, hit: 0.04}); // SOUND MAP: bubbles pop
  const p = clamp01((t - at) / 0.22);
  if (p <= 0) return null;
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.15) : 1;
  if (fade <= 0) return null;
  const iconW = icon ? size * 2.4 : 0;
  const tw = Math.max(...lines.map((l) => textWidth(l, size)));
  const w = tw + iconW + size * 1.2, h = lines.length * size * 1.25 + size * 0.9;
  const q = popIn(p, 0.5, 0.15);
  const ox = tx - x, oy = ty - y; // tail tip relative to the bubble centre — the bubble grows from it
  const tb = Math.max(-w / 2 + size, Math.min(w / 2 - size, ox * 0.35));
  const sw = size * 0.11;
  return (
    <g transform={`translate(${tx} ${ty}) scale(${q.sx} ${q.sy}) translate(${-ox} ${-oy})`} opacity={q.o * fade}>
      <path d={`M${tb - size * 0.45} ${h / 2 - sw} L${ox} ${oy} L${tb + size * 0.45} ${h / 2 - sw} Z`} fill="#FFFFFF" stroke={N.outline} strokeWidth={sw} strokeLinejoin="round" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={size * 0.6} fill="#FFFFFF" stroke={N.outline} strokeWidth={sw} />
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

/** StripeWipe — diagonal gold/orange stripes sweep across and cover the cut (0:09.0, ~0.6 s). Draw on top. */
export const StripeWipe: React.FC<{t: number; at: number; dur?: number}> = ({t, at, dur = 0.6}) => {
  cueSfx('whoosh', `stripes-${at}`, t >= at && t < at + dur, 960, {at, hit: dur / 2});
  const u = (t - at) / dur;
  if (u < 0 || u > 1) return null;
  const cols = ['#FFC928', '#F59E0B', '#FFD45A', '#F2B010'];
  const lean = H * 0.6, sw = (W + lean) / cols.length + 20; // the band of stripes is wide enough to cover the frame
  const band = sw * cols.length;
  const x0 = lerp(-(band + lean), W, ease.inOut(u)); // fully off left → covers the frame at the middle → off right
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
export const HeroObject: React.FC<{t: number; at?: number; src: string; x: number; y: number; h: number; ar: number; glow?: string; enter?: 'pop' | 'rise' | 'drop' | 'zoom'; float?: boolean; shine?: boolean; sparkles?: number; id: string; out?: number}> = ({
  t, at = 0, src, x, y, h, ar, glow = '#FFC928', enter = 'pop', float = true, shine = true, sparkles = 5, id, out,
}) => {
  if (t < at) return null;
  // SOUND MAP (references/universe-claude/SOUND.md, measured 2026-11-10): precious / hero objects shimmer as they appear
  cueSfx('sparkle', `hero-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.065});
  const e = t - at;
  const p = clamp01(e / 0.35);
  const q = popIn(p, 0.45, enter === 'zoom' ? 0.05 : 0.3);
  const dy = enter === 'rise' ? (1 - ease.out(p)) * 260 : enter === 'drop' ? -(1 - ease.out(p)) * 320 : 0;
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.2) : 1;
  if (fade <= 0) return null;
  const w = h * ar;
  const fl = float ? Math.sin(t * 1.3 + x * 0.01) * 10 : 0;
  const sweep = ((e * 0.45) % 1.6) - 0.3; // a light band passes every ~3.5 s
  const file = staticFile(src);
  return (
    <g transform={`translate(${x} ${y + dy + fl}) scale(${q.sx} ${q.sy})`} opacity={q.o * fade}>
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
