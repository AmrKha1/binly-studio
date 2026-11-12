// THE SHORT (owner 2026-11-12): one hook Short per long video, to send viewers to the long one. Vertical 1080×1920,
// laid out like the owner's reference screenshots: the hook TITLE pinned at the top (white line + gold line), the long
// video's MOMENT in the middle (re-rendered sharp, not a cropped copy), the same moment blurred + darkened behind
// everything, word-by-word SUBTITLES (the spoken word lights up gold — Shorts are often watched muted; long videos keep
// "no subtitles"), and the red «الفيديو الكامل على القناة» pill pinned near the bottom for the whole Short. After the
// moment ends, the last frame FREEZES for `freeze` s while the owner's outro voice says the pill's words.
// Props (tools/short.mjs writes them; the words travel sealed — never in git): {from, to, title: [line1, line2],
// words: [{w, s, e}] (long-video seconds), freeze = 3.5, pill}.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {active} from '../active';
import {FPS} from '../kit/theme';
import {setLang} from '../kit/lang';
import {nightFont, textWidth} from '../kit/night';

export type ShortProps = {from: number; to: number; title: [string, string]; words: {w: string; s: number; e: number}[]; freeze?: number; pill?: string; outroDelay?: number};
/** the outro voice starts this long into the freeze (owner: a breath before the call); the pill swells with it */
export const OUTRO_DELAY = 0.5;
export const SW = 1080, SH = 1920;
// layout measured from the owner's screenshots (fractions of the 1080×1920 canvas)
export const SHORT_LAYOUT = {title1: 332, title2: 480, clipTop: 650, clipH: 607.5, subs: 1400, pill: 1575, pillW: 720, pillH: 112};
const GOLD = '#FFC928', RED = '#E8303D', OUT = '#0A0716';

const Txt: React.FC<{y: number; size: number; children: React.ReactNode; fill?: string; stroke?: number}> = ({y, size, children, fill = '#FFFFFF', stroke = 0.16}) => (
  <text x={SW / 2} y={y} textAnchor="middle" dominantBaseline="central" direction="rtl" fontFamily={nightFont()} fontWeight={900} fontSize={size}
    fill={fill} stroke={OUT} strokeWidth={size * stroke} strokeLinejoin="round" paintOrder="stroke" style={{filter: `drop-shadow(0 6px 10px rgba(0,0,0,0.55))`}}>
    {children}
  </text>
);

/** the phrase on screen now: words grouped into short lines (≤ 3 words — owner 2026-11-12, or a pause > 0.35 s starts a new one) */
const phrases = (words: ShortProps['words']) => {
  const out: ShortProps['words'][] = [];
  let cur: ShortProps['words'] = [];
  for (const w of words) {
    const prev = cur[cur.length - 1];
    if (cur.length && (cur.length >= 3 || w.s - prev.e > 0.35 || /[.!؟?،,]$/.test(prev.w))) { out.push(cur); cur = []; }
    cur.push(w);
  }
  if (cur.length) out.push(cur);
  return out;
};

/** the subtitle line: each word placed on its own (right → left), so the word being SPOKEN can turn gold AND swell a
 *  little (1 → 1.12 → 1 in 0.22 s, one smooth swell — owner 2026-11-12: "a slight pop and settle"). The gaps leave room
 *  for the swell, so neighbours never move or touch. */
const SUB = 74;
const SubLine: React.FC<{words: ShortProps['words']; t: number}> = ({words, t}) => {
  const ws = words.map((w) => textWidth(w.w, SUB));
  const gaps = ws.map((w, i) => (i < ws.length - 1 ? Math.max(SUB * 0.3, 0.08 * (w + ws[i + 1])) : 0));
  let right = SW / 2 + (ws.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0)) / 2;
  return (
    <g>
      {words.map((w, i) => {
        const cx = right - ws[i] / 2;
        right -= ws[i] + gaps[i];
        const on = t >= w.s - 0.03 && t < (words[i + 1]?.s ?? w.e + 0.3);
        const u = (t - (w.s - 0.03)) / 0.22;
        const sc = u > 0 && u < 1 ? 1 + 0.12 * Math.sin(Math.PI * u) : 1;
        return (
          <g key={i} transform={`translate(${cx} ${SHORT_LAYOUT.subs}) scale(${sc})`}>
            <text x={0} y={0} textAnchor="middle" dominantBaseline="central" direction="rtl" fontFamily={nightFont()} fontWeight={900} fontSize={SUB}
              fill={on ? GOLD : '#FFFFFF'} stroke={OUT} strokeWidth={SUB * 0.18} strokeLinejoin="round" paintOrder="stroke" style={{filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.55))'}}>
              {w.w}
            </text>
          </g>
        );
      })}
    </g>
  );
};

export const Short: React.FC<ShortProps> = ({from, to, title, words, freeze = 3.5, pill = 'الفيديو الكامل على القناة', outroDelay = OUTRO_DELAY}) => {
  setLang(active.meta.lang);
  const frame = useCurrentFrame();
  const local = frame / FPS;
  const frozen = local > to - from;
  const t = Math.min(from + local, to); // the long video's time (held on the last frame during the freeze)
  const V = active.Video;
  const L = SHORT_LAYOUT, k = SW / 1920;
  const groups = phrases(words.filter((w) => w.e > from && w.s < to));
  const g = frozen ? null : groups.find((p, i) => t >= p[0].s - 0.05 && (t < (groups[i + 1]?.[0].s ?? to + 1) - 0.05));
  const pu = local - (to - from) - outroDelay; // the pill swells when the outro voice says its words
  // a gentle swell (1 → 1.12 → 1): the pill is ALREADY on screen, so it must not shrink first like an appearing pop
  const ps = frozen && pu > 0 && pu < 0.3 ? 1 + 0.12 * Math.sin((Math.PI * pu) / 0.3) : 1;
  const pillPop = {sx: ps, sy: ps, o: 1};
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* behind: the same moment, enlarged to fill the frame, blurred and darkened */}
      <div style={{position: 'absolute', left: SW / 2 - (1920 * (SH / 1080)) / 2, top: 0, width: 1920, height: 1080, transform: `scale(${SH / 1080})`, transformOrigin: '0 0', filter: 'blur(28px) brightness(0.45) saturate(1.2)'}}>
        <V t={t} />
      </div>
      {/* the moment, sharp, full width */}
      <div style={{position: 'absolute', left: 0, top: L.clipTop, width: 1920, height: 1080, transform: `scale(${k})`, transformOrigin: '0 0', boxShadow: '0 0 60px rgba(0,0,0,0.6)'}}>
        <V t={t} />
      </div>
      <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{position: 'absolute', inset: 0}}>
        <rect x={0} y={L.clipTop - 3} width={SW} height={3} fill="#000" opacity={0.6} />
        <rect x={0} y={L.clipTop + L.clipH} width={SW} height={3} fill="#000" opacity={0.6} />
        {/* the hook title — pinned for the whole Short */}
        <Txt y={L.title1} size={92}>{title[0]}</Txt>
        <Txt y={L.title2} size={118} fill={GOLD}>{title[1]}</Txt>
        {/* the spoken words: white, the word being said lights up gold */}
        {g && <SubLine words={g} t={t} />}
        {/* the red pill — pinned for the whole Short (it swells once when the outro voice says it) */}
        <g transform={`translate(${SW / 2} ${L.pill}) scale(${pillPop.sx} ${pillPop.sy})`}>
          <rect x={-L.pillW / 2} y={-L.pillH / 2} width={L.pillW} height={L.pillH} rx={L.pillH / 2} fill={RED} stroke={OUT} strokeWidth={6} />
          <rect x={-L.pillW / 2 + 14} y={-L.pillH / 2 + 10} width={L.pillW - 28} height={L.pillH * 0.3} rx={L.pillH * 0.15} fill="#FFFFFF" opacity={0.2} />
          <text x={0} y={4} textAnchor="middle" dominantBaseline="central" direction="rtl" fontFamily={nightFont()} fontWeight={900} fontSize={58} fill="#FFFFFF">{pill}</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
export const shortFrames = (p: ShortProps) => Math.max(1, Math.ceil((p.to - p.from + (p.freeze ?? 3.5)) * FPS));
