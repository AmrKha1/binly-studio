/**
 * LandfillSlice — a cross-section of a giant landfill mountain (the Newport bitcoin hard drive, ar-costly-mistakes C03):
 * strata of rubbish in browns and greys with recognisable bits (bin bags, cans, boxes, bottles), gulls circling, a
 * dashed cyan SEARCH ZONE that narrows from the whole mountain to one small pocket, the hard drive glowing gold-cyan deep
 * inside it, and an optional fence with a red «ممنوع الحفر» sign rising in front. Optional rain.
 * Origin: built for ar-costly-mistakes (2026-11-16). Night look: thick dark outlines, flat strata + light shading, one
 * highlight stripe on the mound's lit side, glow only on the drive (the hero); reference pop; zone moves with moveTo.
 * Screen coordinates (inside <NightScreen>).
 *
 * Props: t · at? (rises in) · x (centre) · y (ground line) · w (1500) · h (620) · zoneAt? (zone appears; default
 * narrowAt − 0.8) · narrowAt? · narrowDur (1.6) · pocket {dx, dy, w, h} (local px: dx from centre, dy above ground; default
 * {dx: 0.14·w, dy: 0.36·h, w: 300, h: 190}) · labels [{text, at, dx, dy, kind?}] (NPills, local px, dy above ground) ·
 * driveAt? · fenceAt? · fenceText ('ممنوع الحفر') · rain · birds (true) · seed · id.
 * Sounds: thump (mound rises) · popup (zone) · whoosh (zone narrows) · sparkle (drive) · thump (fence).
 */
import React from 'react';
import {clamp01, ease, noise1, rand} from '../../../kit/anim';
import {lb, uid} from '../../../kit/stage';
import {GlowText, NPill, PillKind, Sparkle, textWidth} from '../../../kit/night';
import {driveArt} from '../../../kit/night-objects';
import {moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {OUT, grow, popAt, prog} from './util';

export type LandfillSliceProps = {
  t: number; at?: number; x: number; y: number; w?: number; h?: number;
  zoneAt?: number; narrowAt?: number; narrowDur?: number; pocket?: {dx: number; dy: number; w: number; h: number};
  labels?: {text: string; at: number; dx: number; dy: number; kind?: PillKind}[];
  driveAt?: number; fenceAt?: number; fenceText?: string; rain?: boolean; birds?: boolean; seed?: number; id: string;
};

const STRATA = ['#3B3140', '#5A4838', '#46474F', '#6A5543', '#3E3B47', '#5B4A3A', '#4E505B', '#614E3D'];

export const LandfillSlice: React.FC<LandfillSliceProps> = ({
  t, at, x, y, w = 1500, h = 620, zoneAt, narrowAt, narrowDur = 1.6, pocket: pk, labels = [], driveAt, fenceAt, fenceText = 'ممنوع الحفر', rain = false, birds = true, seed = 3, id,
}) => {
  if (at !== undefined && t < at) return null;
  const g = uid('lfill', id);
  const pocket = pk ?? {dx: w * 0.14, dy: h * 0.36, w: 300, h: 190};
  const rise = at === undefined ? 1 : grow(t, at, 0.6);
  const zAt = zoneAt ?? (narrowAt !== undefined ? narrowAt - 0.8 : undefined);
  if (at !== undefined) cueSfx('thump', `lfill-${id}-${at}`, t >= at && t < at + 0.3, x, {at, hit: 0.3});
  if (zAt !== undefined) cueSfx('popup', `lfill-${id}-zone-${zAt}`, t >= zAt && t < zAt + 0.3, x, {at: zAt, hit: 0.125});
  if (narrowAt !== undefined) cueSfx('whoosh', `lfill-${id}-narrow-${narrowAt}`, t >= narrowAt && t < narrowAt + 0.4, x + pocket.dx, {at: narrowAt, hit: narrowDur * 0.5});
  if (driveAt !== undefined) cueSfx('sparkle', `lfill-${id}-drive-${driveAt}`, t >= driveAt && t < driveAt + 0.3, x + pocket.dx, {at: driveAt, hit: 0.125});
  if (fenceAt !== undefined) cueSfx('thump', `lfill-${id}-fence-${fenceAt}`, t >= fenceAt && t < fenceAt + 0.3, x, {at: fenceAt, hit: 0.35});

  // the mound profile (local: ground y = 0, up = negative)
  const NP = 48;
  const prof = Array.from({length: NP + 1}, (_, i) => {
    const u = -1 + (2 * i) / NP;
    const base = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 3.2)), 0.7);
    const bump = 0.94 + 0.06 * noise1(i * 0.6, seed);
    return [(u * w) / 2, -h * base * bump] as [number, number];
  });
  const mound = 'M' + prof.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(' L') + ' Z';
  const topAt = (lx: number) => {
    const i = Math.max(0, Math.min(NP, Math.round(((lx / w) * 2 + 1) * (NP / 2))));
    return prof[i][1];
  };

  // strata: horizontal bands with wavy tops (back to front = deep to top)
  const K = STRATA.length;
  const band = (k: number) => {
    const yy = -h * (k / K) * 1.02;
    const pts = Array.from({length: 25}, (_, i) => {
      const xx = -w / 2 - 20 + ((w + 40) * i) / 24;
      return `${xx.toFixed(1)} ${(yy + 14 * noise1(i * 0.9 + k * 3, seed + k)).toFixed(1)}`;
    });
    return `M${-w / 2 - 20} 20 L${pts.join(' L')} L${w / 2 + 20} 20 Z`;
  };

  // rubbish bits (deterministic, only where the mound is)
  const bits: React.ReactNode[] = [];
  for (let i = 0, made = 0; i < 160 && made < 58; i++) {
    const lx = (rand(seed * 97 + i * 3) - 0.5) * w * 0.92;
    const top = topAt(lx);
    const ly = top * (0.06 + rand(seed * 13 + i * 7) * 0.86);
    if (ly > -20 || ly < top + 26) continue;
    // keep the pocket clear so the drive reads
    if (Math.abs(lx - pocket.dx) < pocket.w * 0.42 && Math.abs(-ly - pocket.dy) < pocket.h * 0.42) continue;
    made++;
    const kind = Math.floor(rand(seed * 5 + i * 11) * 4);
    const s = 0.75 + rand(i * 17 + seed) * 0.6;
    const r = (rand(i * 23 + seed) - 0.5) * 70;
    bits.push(
      <g key={i} transform={`translate(${lx.toFixed(1)} ${ly.toFixed(1)}) rotate(${r.toFixed(1)}) scale(${s.toFixed(2)})`}>
        {kind === 0 && (
          <g>
            <path d="M-26 8 Q-30 -18 -6 -22 Q2 -32 10 -22 Q30 -18 26 8 Q0 20 -26 8 Z" fill={i % 2 ? '#22262E' : '#1E3A2C'} stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
            <path d="M-14 -6 Q-4 -12 8 -8" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.35} />
          </g>
        )}
        {kind === 1 && (
          <g>
            <rect x={-11} y={-20} width={22} height={34} rx={4} fill={i % 3 ? '#C93A3A' : '#B9C0CC'} stroke={OUT} strokeWidth={4} />
            <rect x={-11} y={-10} width={22} height={8} fill="#FFFFFF" opacity={0.55} />
          </g>
        )}
        {kind === 2 && (
          <g>
            <rect x={-22} y={-18} width={44} height={34} rx={3} fill="#B58B5A" stroke={OUT} strokeWidth={4} />
            <rect x={-4} y={-18} width={8} height={34} fill="#8C6A42" />
          </g>
        )}
        {kind === 3 && (
          <g>
            <path d="M-7 -26 H7 V-16 Q14 -12 14 -2 V16 Q14 20 10 20 H-10 Q-14 20 -14 16 V-2 Q-14 -12 -7 -16 Z" fill="#4FB6A8" stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
            <rect x={-8} y={-6} width={5} height={18} rx={2} fill="#FFFFFF" opacity={0.6} />
          </g>
        )}
      </g>,
    );
  }

  // search zone: whole mountain → pocket
  const full = {x: -w * 0.44, y: -h * 1.0, w: w * 0.88, h: h * 0.96};
  const pr = {x: pocket.dx - pocket.w / 2, y: -pocket.dy - pocket.h / 2, w: pocket.w, h: pocket.h};
  const na = narrowAt ?? 1e9;
  const zx = moveTo(t, na, full.x, pr.x, narrowDur), zy = moveTo(t, na, full.y, pr.y, narrowDur);
  const zw = moveTo(t, na, full.w, pr.w, narrowDur), zh = moveTo(t, na, full.h, pr.h, narrowDur);
  const nk = narrowAt === undefined ? 0 : ease.inOut(prog(t, narrowAt, narrowDur));
  const zq = popAt(t, zAt);
  const zr = Math.min(40, zh * 0.2);

  // the drive
  const dq = popAt(t, driveAt);
  const dh = Math.min(pocket.h * 0.75, 170);
  const pulse = 0.85 + 0.15 * Math.sin(t * 3.1);

  // fence
  const fk = fenceAt === undefined ? 0 : grow(t, fenceAt, 0.5);
  const fw = w * 0.96;
  const signW = textWidth(fenceText, 60) + 150;

  return (
    <g {...lb('object', id)}>
      <g transform={`translate(${x} ${y})`}>
        <defs>
          <clipPath id={`${g}-m`}><path d={mound} /></clipPath>
          <linearGradient id={`${g}-sh`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.1} /><stop offset="0.55" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.32} /></linearGradient>
          <radialGradient id={`${g}-dg`}><stop offset="0" stopColor="#FFF4C2" /><stop offset="0.35" stopColor="#FCC018" stopOpacity={0.75} /><stop offset="0.7" stopColor="#57D9FA" stopOpacity={0.35} /><stop offset="1" stopColor="#57D9FA" stopOpacity={0} /></radialGradient>
          <filter id={`${g}-zb`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={8} /></filter>
        </defs>
        <g transform={`translate(0 ${(1 - rise) * 60}) scale(1 ${0.6 + 0.4 * rise})`} opacity={clamp01(rise * 2)}>
          <path d={mound} transform="translate(16 18)" fill="#000" opacity={0.4} />
          <g clipPath={`url(#${g}-m)`}>
            <rect x={-w / 2 - 20} y={-h - 20} width={w + 40} height={h + 40} fill={STRATA[K - 1]} />
            {STRATA.map((c, k) => <path key={k} d={band(K - 1 - k)} fill={c} stroke={OUT} strokeWidth={3} strokeOpacity={0.55} />)}
            {bits}
            <rect x={-w / 2} y={-h - 20} width={w} height={h + 40} fill={`url(#${g}-sh)`} />
            {/* dim everything outside the search zone as it narrows */}
            {nk > 0 && <path d={`M${-w} ${-h * 2} H${w} V${h} H${-w} Z M${zx} ${zy} V${zy + zh} H${zx + zw} V${zy} Z`} fillRule="evenodd" fill="#05030F" opacity={0.5 * nk} />}
          </g>
          {/* lit edge + the highlight stripe along the left slope */}
          <path d={mound} fill="none" stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
          <path d={'M' + prof.slice(6, 20).map(([px, py]) => `${px.toFixed(1)} ${(py + 16).toFixed(1)}`).join(' L')} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" opacity={0.3} />
          {/* top crust: a few bags on the summit */}
          {[-0.18, -0.05, 0.08, 0.22].map((f, i) => (
            <path key={i} d={`M${f * w - 26} ${topAt(f * w) + 6} Q${f * w - 28} ${topAt(f * w) - 26} ${f * w} ${topAt(f * w) - 28} Q${f * w + 28} ${topAt(f * w) - 26} ${f * w + 26} ${topAt(f * w) + 6} Z`} fill={i % 2 ? '#22262E' : '#2D3A30'} stroke={OUT} strokeWidth={5} />
          ))}
        </g>
        {/* the drive deep inside */}
        {dq.o > 0 && (
          <g transform={`translate(${pocket.dx} ${-pocket.dy})`}>
            <circle r={dh * 1.25 * pulse} fill={`url(#${g}-dg)`} opacity={dq.o} />
            <g transform={`scale(${dq.s}) rotate(-12)`} opacity={dq.o}>{driveArt('#5CF2FF')(dh)}</g>
            {[0, 1, 2].map((i) => <Sparkle key={i} x={Math.cos(i * 2.1 + 0.5) * dh * 0.75} y={Math.sin(i * 2.1 + 0.5) * dh * 0.6} r={10 + 6 * Math.max(0, Math.sin(t * 2.6 + i * 2))} o={dq.o * 0.9} color="#FFF4C2" />)}
          </g>
        )}
        {/* the search zone */}
        {zq.o > 0 && (
          <g opacity={zq.o}>
            <rect x={zx} y={zy} width={zw} height={zh} rx={zr} fill="none" stroke="#57D9FA" strokeWidth={14} opacity={0.5} filter={`url(#${g}-zb)`} />
            <rect x={zx} y={zy} width={zw} height={zh} rx={zr} fill="#57D9FA" fillOpacity={0.06} stroke="#7FE6FF" strokeWidth={7} strokeDasharray="26 16" strokeDashoffset={-t * 40} />
          </g>
        )}
        {/* fence + sign */}
        {fk > 0 && (
          <g transform={`scale(1 ${fk})`}>
            <rect x={-fw / 2} y={-170} width={fw} height={170} fill="#9AA2B8" opacity={0.18} />
            <g stroke="#B9C0CC" strokeWidth={3} opacity={0.75}>
              {Array.from({length: Math.ceil(fw / 34)}, (_, i) => <line key={'a' + i} x1={-fw / 2 + i * 34} y1={-170} x2={-fw / 2 + i * 34 + 170} y2={0} />)}
              {Array.from({length: Math.ceil(fw / 34)}, (_, i) => <line key={'b' + i} x1={-fw / 2 + i * 34} y1={0} x2={-fw / 2 + i * 34 + 170} y2={-170} />)}
            </g>
            <rect x={-fw / 2} y={-178} width={fw} height={12} rx={6} fill="#7E889E" stroke={OUT} strokeWidth={4} />
            {Array.from({length: 9}, (_, i) => <rect key={i} x={-fw / 2 + (fw * i) / 8 - 9} y={-200} width={18} height={204} rx={5} fill="#5E6880" stroke={OUT} strokeWidth={5} />)}
            {/* the sign */}
            <g transform="translate(0 -96)">
              <rect x={-signW / 2 + 10} y={-58} width={signW} height={124} rx={18} fill="#000" opacity={0.4} />
              <rect x={-signW / 2} y={-66} width={signW} height={124} rx={18} fill="#D21F3C" stroke={OUT} strokeWidth={7} />
              <rect x={-signW / 2 + 10} y={-56} width={signW - 20} height={104} rx={12} fill="none" stroke="#FFFFFF" strokeWidth={4} />
              <g transform={`translate(${signW / 2 - 66} -4)`}>
                <circle r={34} fill="#FFFFFF" stroke={OUT} strokeWidth={4} />
                <path d="M-6 -22 H6 V8 Q14 10 14 20 H-14 Q-14 10 -6 8 Z" fill="#3A3F55" />
                <path d="M-24 -24 L24 24" stroke="#D21F3C" strokeWidth={8} strokeLinecap="round" />
              </g>
              <GlowText text={fenceText} x={-30} y={-4} size={60} tone="white" glow={0} id={`${id}-sign`} />
            </g>
          </g>
        )}
        {/* gulls */}
        {birds && [0, 1, 2].map((i) => {
          const a = t * (0.35 + i * 0.07) + i * 2.1;
          const bx = Math.cos(a) * w * (0.18 + i * 0.05) - w * 0.05, byy = -h - 70 - i * 40 + Math.sin(a * 2) * 18;
          const flap = Math.sin(t * 9 + i) * 10;
          return <path key={i} d={`M${bx - 26} ${byy - flap} Q${bx - 12} ${byy - 14} ${bx} ${byy} Q${bx + 12} ${byy - 14} ${bx + 26} ${byy - flap}`} fill="none" stroke="#E9ECF5" strokeWidth={6} strokeLinecap="round" />;
        })}
        {/* rain */}
        {rain && Array.from({length: 80}, (_, i) => {
          const rx = (rand(i * 13 + 1) - 0.5) * (w + 300);
          const sp = 1300 + rand(i * 7) * 400;
          const span = h + 420;
          const ry = (((rand(i * 3 + 5) * span + t * sp) % span) + span) % span - h - 360;
          return <line key={i} x1={rx} y1={ry} x2={rx - 14} y2={ry + 46} stroke="#B8CCEB" strokeWidth={4} strokeLinecap="round" opacity={0.45} />;
        })}
        {labels.map((l, i) => (t >= l.at ? <NPill key={i} text={l.text} x={l.dx} y={-l.dy} size={46} kind={l.kind ?? 'white'} id={`${id}-l${i}`} p={clamp01((t - l.at) / 0.3)} /> : null))}
      </g>
    </g>
  );
};
