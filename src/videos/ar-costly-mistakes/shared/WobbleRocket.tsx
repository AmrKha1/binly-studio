/**
 * WobbleRocket — Mariner 1 (1962): a white/silver Atlas rocket with a small gold probe on its nose lifts off a pad and
 * flies an upward arc; at `wobbleAt` the guidance starts OVER-CORRECTING — a zigzag in which every correction is bigger
 * than the last (the mechanism of the missing bar), drawn by a dotted trail; at `explodeAt` it is destroyed: flash,
 * fireball, debris, smoke ring. + RangeSafetyButton (the red destruct button under a flip-up guard, pressed by a finger).
 * Origin: built for ar-costly-mistakes C02 (2026-11-16). Night look: thick dark outline, silver gradients, one highlight
 * stripe, warm flame glow; motion eased (the rocket accelerates), no jelly. Screen coordinates (inside <NightScreen>).
 *
 * WobbleRocket props: t · at (lift-off) · x0, y0 = pad (rocket base) · x1, y1 = arc end · cx, cy = arc control point ·
 * dur (flight time to the arc end, 6) · wobbleAt? · wobble (amplitude px, 26) · explodeAt? · s (1 ≈ 380 px tall) ·
 * pad (true: launch tower + platform) · trail (true) · src?/ar? (draw an image instead of the code rocket) · id.
 * Sounds: thump (rumble of ignition) · swish (each big over-correction, max 4) · explosion.
 * RangeSafetyButton props: t · x, y (panel centre) · s · guardAt? (guard flips up) · pressAt? (finger presses) ·
 * label? {text, at} · id. Sounds: click (guard) · thump (press) · wrong (the alarm).
 */
import React from 'react';
import {staticFile} from 'remotion';
import {clamp01, ease, noise1, rand} from '../../../kit/anim';
import {lb, uid} from '../../../kit/stage';
import {NPill} from '../../../kit/night';
import {cueSfx} from '../../../kit/sfx';
import {OUT, prog} from './util';

export type WobbleRocketProps = {
  t: number; at: number; x0: number; y0: number; x1: number; y1: number; cx: number; cy: number; dur?: number;
  wobbleAt?: number; wobble?: number; explodeAt?: number; s?: number; pad?: boolean; trail?: boolean; src?: string; ar?: number; id: string;
};

const L0 = 380;

/** the code-drawn Atlas-Agena with the Mariner probe — upright, centred on 0,0, nose at −L/2 */
const AtlasArt: React.FC<{L: number; g: string; flame: number; t: number}> = ({L, g, flame, t}) => {
  const bw = L * 0.13;
  const top = -L * 0.3, bot = L * 0.32;
  const fl = flame * (0.85 + 0.15 * noise1(t * 14, 3));
  return (
    <g>
      <defs>
        <linearGradient id={`${g}-s`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.45" stopColor="#D9DEE8" /><stop offset="1" stopColor="#7E889E" /></linearGradient>
        <linearGradient id={`${g}-gd`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFE38A" /><stop offset="0.5" stopColor="#F2B010" /><stop offset="1" stopColor="#A86E00" /></linearGradient>
        <linearGradient id={`${g}-f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.25" stopColor="#FFE680" /><stop offset="0.6" stopColor="#FF9A2E" /><stop offset="1" stopColor="#E8452C" stopOpacity={0} /></linearGradient>
        <filter id={`${g}-fb`} x="-100%" y="-50%" width="300%" height="200%"><feGaussianBlur stdDeviation={L * 0.03} /></filter>
      </defs>
      {/* flame */}
      {fl > 0.01 && (
        <g transform={`translate(0 ${L * 0.46})`}>
          <ellipse cx={0} cy={L * 0.16 * fl} rx={bw * 1.1} ry={L * 0.26 * fl} fill="#FF9A2E" opacity={0.55} filter={`url(#${g}-fb)`} />
          <path d={`M${-bw * 0.62} 0 Q${-bw * 0.7} ${L * 0.22 * fl} 0 ${L * 0.48 * fl} Q${bw * 0.7} ${L * 0.22 * fl} ${bw * 0.62} 0 Z`} fill={`url(#${g}-f)`} />
          <path d={`M${-bw * 0.3} 0 Q${-bw * 0.32} ${L * 0.1 * fl} 0 ${L * 0.24 * fl} Q${bw * 0.32} ${L * 0.1 * fl} ${bw * 0.3} 0 Z`} fill="#FFFFFF" opacity={0.9} />
        </g>
      )}
      {/* nozzles */}
      {[-0.42, 0, 0.42].map((f, i) => <path key={i} d={`M${bw * f - bw * 0.16} ${L * 0.42} L${bw * f + bw * 0.16} ${L * 0.42} L${bw * f + bw * 0.24} ${L * 0.48} L${bw * f - bw * 0.24} ${L * 0.48} Z`} fill="#3A3F55" stroke={OUT} strokeWidth={L * 0.012} />)}
      {/* booster skirt (wider) */}
      <path d={`M${-bw / 2} ${bot - L * 0.04} L${bw / 2} ${bot - L * 0.04} L${bw * 0.7} ${L * 0.43} L${-bw * 0.7} ${L * 0.43} Z`} fill={`url(#${g}-s)`} stroke={OUT} strokeWidth={L * 0.016} strokeLinejoin="round" />
      {/* main tank */}
      <rect x={-bw / 2} y={top} width={bw} height={bot - top} fill={`url(#${g}-s)`} stroke={OUT} strokeWidth={L * 0.016} />
      {[0.08, 0.36, 0.62].map((f, i) => <rect key={i} x={-bw / 2} y={top + (bot - top) * f} width={bw} height={L * 0.018} fill="#4A5068" />)}
      {/* upper stage + nose shroud with the gold probe */}
      <rect x={-bw * 0.4} y={-L * 0.4} width={bw * 0.8} height={L * 0.1} fill={`url(#${g}-s)`} stroke={OUT} strokeWidth={L * 0.014} />
      <path d={`M${-bw * 0.4} ${-L * 0.4} Q${-bw * 0.4} ${-L * 0.47} 0 ${-L * 0.5} Q${bw * 0.4} ${-L * 0.47} ${bw * 0.4} ${-L * 0.4} Z`} fill={`url(#${g}-gd)`} stroke={OUT} strokeWidth={L * 0.014} strokeLinejoin="round" />
      <circle cx={0} cy={-L * 0.445} r={L * 0.012} fill="#FFFFFF" opacity={0.9} />
      {/* fins */}
      {[-1, 1].map((sd) => <path key={sd} d={`M${sd * bw * 0.68} ${L * 0.3} L${sd * bw * 1.05} ${L * 0.44} L${sd * bw * 0.7} ${L * 0.43} Z`} fill="#5E6880" stroke={OUT} strokeWidth={L * 0.012} strokeLinejoin="round" />)}
      {/* the highlight stripe */}
      <rect x={-bw * 0.34} y={top + L * 0.02} width={bw * 0.08} height={(bot - top) * 0.9} rx={bw * 0.04} fill="#FFFFFF" opacity={0.85} />
    </g>
  );
};

export const WobbleRocket: React.FC<WobbleRocketProps> = ({t, at, x0, y0, x1, y1, cx, cy, dur = 6, wobbleAt, wobble = 26, explodeAt, s = 1, pad = true, trail = true, src, ar = 0.25, id}) => {
  const L = L0 * s;
  const g = uid('wrkt', id);
  // centre of the rocket at path parameter u (the base sits on the pad at u = 0)
  const start: [number, number] = [x0, y0 - L * 0.48];
  const bez = (u: number): [number, number] => {
    const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
    return [a * start[0] + b * cx + c * x1, a * start[1] + b * cy + c * y1];
  };
  const tan = (u: number) => {
    const dx = 2 * (1 - u) * (cx - start[0]) + 2 * u * (x1 - cx), dy = 2 * (1 - u) * (cy - start[1]) + 2 * u * (y1 - cy);
    return Math.atan2(dy, dx);
  };
  // the over-correcting wobble: each swing bigger than the last (sideways to the path)
  const P = 0.7;
  const wob = (tau: number) => {
    if (wobbleAt === undefined || tau < wobbleAt) return 0;
    const e = tau - wobbleAt;
    return wobble * Math.pow(1 + e * 1.25, 1.5) * ease.out(clamp01(e / 0.3)) * Math.sin((2 * Math.PI * e) / P);
  };
  const core = (tau: number): [number, number] => {
    const u = Math.pow(clamp01((tau - at) / dur), 1.2); // accelerating climb
    const extra = Math.max(0, (tau - at - dur) / dur) * 0.8; // keeps going past the arc end
    const [px, py] = bez(u);
    const a = tan(u);
    const off = wob(tau);
    return [px + Math.cos(a) * extra * 700 - Math.sin(a) * off, py + Math.sin(a) * extra * 700 + Math.cos(a) * off];
  };
  // heading = the real direction of travel (so the nose swings with every over-correction)
  const pos = (tau: number) => {
    const [px, py] = core(tau);
    const [qx, qy] = core(tau + 0.03);
    const [rx, ry] = core(Math.max(at, tau - 0.03));
    const u = Math.pow(clamp01((tau - at) / dur), 1.2);
    const base = (tan(u) * 180) / Math.PI + 90;
    let dev = Math.hypot(qx - rx, qy - ry) > 0.5 ? (Math.atan2(qy - ry, qx - rx) * 180) / Math.PI + 90 - base : 0;
    dev = ((dev + 540) % 360) - 180;
    const a = base + Math.max(-38, Math.min(38, dev));
    return {x: px, y: py, a};
  };
  const tEnd = explodeAt !== undefined ? Math.min(t, explodeAt) : t;
  const flying = t >= at;
  const exploded = explodeAt !== undefined && t >= explodeAt;
  const now = pos(Math.max(at, tEnd));
  const E = explodeAt !== undefined ? pos(explodeAt) : now;

  // SOUND MAP: ignition rumble · each growing over-correction swishes (max 4) · the destruct explosion
  cueSfx('thump', `wrkt-${id}-ign-${at}`, t >= at && t < at + 0.3, x0, {at, hit: 0.1, gain: 1.4});
  if (wobbleAt !== undefined) for (let i = 0; i < 4; i++) {
    const ta = wobbleAt + P * (i + 0.25) + P * 0.5;
    if (explodeAt === undefined || ta < explodeAt) cueSfx('swish', `wrkt-${id}-w${i}-${wobbleAt}`, t >= ta && t < ta + 0.25, pos(ta).x, {at: ta, hit: 0.1, gain: 0.5 + i * 0.15});
  }
  if (explodeAt !== undefined) cueSfx('explosion', `wrkt-${id}-boom-${explodeAt}`, t >= explodeAt && t < explodeAt + 0.4, E.x, {at: explodeAt, hit: 0.05});

  // dotted trail (sampled path)
  const dots: React.ReactNode[] = [];
  if (trail && flying) {
    const step = 0.05;
    for (let tau = at + 0.2, i = 0; tau <= tEnd - 0.12; tau += step, i++) {
      const p = pos(tau);
      const late = wobbleAt !== undefined && tau >= wobbleAt;
      dots.push(<circle key={i} cx={p.x} cy={p.y} r={late ? 7 : 6} fill={late ? '#FF6B78' : '#FFFFFF'} opacity={0.85} />);
    }
  }

  // lift-off smoke at the pad
  const smokeK = flying ? prog(t, at, 2.2) : 0;
  const smoke = flying && smokeK < 1 ? Array.from({length: 9}, (_, i) => {
    const sx = (i - 4) * 46 * (0.4 + smokeK), r = (50 + rand(i * 3 + 1) * 40) * (0.5 + ease.out(smokeK));
    return <circle key={i} cx={x0 + sx} cy={y0 - 20 - rand(i + 9) * 30 * smokeK} r={r} fill={i % 2 ? '#C9C3D6' : '#A79FB8'} stroke={OUT} strokeWidth={4} opacity={0.9 * (1 - smokeK)} />;
  }) : null;

  // explosion
  let boom: React.ReactNode = null;
  if (exploded && explodeAt !== undefined) {
    const e = t - explodeAt;
    const fb = ease.out(clamp01(e / 0.45));
    const fade = 1 - clamp01((e - 1.0) / 1.0);
    const blob = (r: number, seed: number, fill: string, o: number) => {
      const n = 14;
      const d = Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2, rr = r * (0.82 + 0.28 * rand(seed + i) + 0.06 * Math.sin(e * 6 + i));
        return `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
      }).join(' ') + 'Z';
      return <path d={d} fill={fill} stroke={OUT} strokeWidth={5} strokeLinejoin="round" opacity={o} />;
    };
    boom = (
      <g transform={`translate(${E.x} ${E.y})`}>
        {/* smoke ring */}
        <ellipse cx={0} cy={0} rx={60 + 360 * ease.out(clamp01(e / 1.6))} ry={(60 + 360 * ease.out(clamp01(e / 1.6))) * 0.42} fill="none" stroke="#9A93AE" strokeWidth={34 * (1 - clamp01(e / 1.8))} opacity={0.7 * (1 - clamp01(e / 1.8))} />
        {/* lingering smoke */}
        {Array.from({length: 6}, (_, i) => {
          const a = (i / 6) * Math.PI * 2 + 0.3;
          const k = ease.out(clamp01(e / 1.4));
          return <circle key={i} cx={Math.cos(a) * 120 * k} cy={Math.sin(a) * 80 * k - 30 * k} r={70 * k + 10} fill="#5E5870" stroke={OUT} strokeWidth={4} opacity={0.75 * (1 - clamp01((e - 1.4) / 1.2))} />;
        })}
        <g transform={`scale(${fb})`} opacity={fade}>
          {blob(210, 3, '#E8452C', 1)}
          {blob(160, 17, '#FF9A2E', 1)}
          {blob(100, 31, '#FFE680', 1)}
          <circle r={50} fill="#FFFFFF" opacity={0.9} />
        </g>
        {/* debris */}
        {Array.from({length: 12}, (_, i) => {
          const a = rand(i * 7 + 2) * Math.PI * 2, v = 380 + rand(i * 5 + 1) * 420;
          const dx = Math.cos(a) * v * e, dy = Math.sin(a) * v * e + 520 * e * e;
          const big = i < 3;
          return (
            <g key={i} transform={`translate(${dx} ${dy}) rotate(${e * (200 + i * 40) * (i % 2 ? 1 : -1)})`} opacity={1 - clamp01((e - 1.2) / 0.6)}>
              {i === 0 ? <path d="M-14 -10 L14 -10 L8 12 L-8 12 Z" fill="#F2B010" stroke={OUT} strokeWidth={4} />
                : <rect x={big ? -18 : -9} y={big ? -8 : -5} width={big ? 36 : 18} height={big ? 16 : 10} rx={3} fill={i % 3 ? '#D9DEE8' : '#7E889E'} stroke={OUT} strokeWidth={4} />}
            </g>
          );
        })}
        {/* flash */}
        <circle r={260 * ease.out(clamp01(e / 0.15))} fill="#FFFFFF" opacity={0.85 * (1 - clamp01(e / 0.3))} />
      </g>
    );
  }

  return (
    <g {...lb('object', id)}>
      {pad && (
        <g>
          {/* launch tower */}
          <g transform={`translate(${x0 - L * 0.32} ${y0})`}>
            <rect x={-L * 0.05} y={-L * 1.12} width={L * 0.1} height={L * 1.12} fill="#2B2F45" stroke={OUT} strokeWidth={6} />
            {Array.from({length: 8}, (_, i) => <path key={i} d={`M${-L * 0.05} ${-L * 0.14 * i} L${L * 0.05} ${-L * 0.14 * (i + 1)}`} stroke="#6A7090" strokeWidth={4} />)}
            <rect x={L * 0.05} y={-L * 0.8} width={L * 0.16 * (1 - ease.inOut(prog(t, at - 0.6, 0.5)) * 0.7)} height={L * 0.04} fill="#E8452C" stroke={OUT} strokeWidth={4} />
            <circle cx={0} cy={-L * 1.14} r={8} fill="#FF4D5E" opacity={0.6 + 0.4 * Math.sin(t * 5)} />
          </g>
          <rect x={x0 - L * 0.45} y={y0} width={L * 0.9} height={L * 0.09} rx={8} fill="#3A3F55" stroke={OUT} strokeWidth={6} />
          <rect x={x0 - L * 0.42} y={y0 + 6} width={L * 0.84} height={6} rx={3} fill="#FFFFFF" opacity={0.25} />
        </g>
      )}
      {smoke}
      {dots}
      {!exploded && (
        <g transform={`translate(${now.x} ${now.y}) rotate(${flying ? now.a : 0})`}>
          {src ? (
            <image href={staticFile(src)} x={-(L * ar) / 2} y={-L / 2} width={L * ar} height={L} />
          ) : (
            <AtlasArt L={L} g={g} flame={flying ? ease.out(prog(t, at - 0.15, 0.4)) : 0} t={t} />
          )}
        </g>
      )}
      {boom}
    </g>
  );
};

/** RangeSafetyButton — the red destruct button: guard flips up, a finger presses it, the alarm beacon spins red. */
export const RangeSafetyButton: React.FC<{t: number; x: number; y: number; s?: number; guardAt?: number; pressAt?: number; label?: {text: string; at: number}; id: string}> = ({t, x, y, s = 1, guardAt, pressAt, label, id}) => {
  const g = uid('rsb', id);
  const gp = guardAt === undefined ? 0 : ease.inOut(prog(t, guardAt, 0.35));
  const pressed = pressAt !== undefined && t >= pressAt;
  const fingerIn = pressAt === undefined ? 0 : ease.out(prog(t, pressAt - 0.45, 0.45));
  const sink = pressed ? ease.out(prog(t, pressAt!, 0.12)) : 0;
  const alarm = pressed ? clamp01((t - pressAt!) / 0.1) : 0;
  if (guardAt !== undefined) cueSfx('click', `rsb-${id}-g-${guardAt}`, t >= guardAt && t < guardAt + 0.3, x, {at: guardAt, hit: 0.3});
  if (pressAt !== undefined) {
    cueSfx('thump', `rsb-${id}-p-${pressAt}`, t >= pressAt && t < pressAt + 0.3, x, {at: pressAt, hit: 0.05});
    cueSfx('wrong', `rsb-${id}-a-${pressAt}`, t >= pressAt + 0.15 && t < pressAt + 0.5, x, {at: pressAt + 0.15, hit: 0.05});
  }
  const flash = alarm * (0.5 + 0.5 * Math.sin((t - (pressAt ?? 0)) * 14));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} {...lb('object', id)}>
      <defs>
        <linearGradient id={`${g}-pl`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3C4260" /><stop offset="1" stopColor="#1C2036" /></linearGradient>
        <radialGradient id={`${g}-btn`} cx="0.38" cy="0.32" r="0.75"><stop offset="0" stopColor="#FF8A94" /><stop offset="0.45" stopColor="#E8243C" /><stop offset="1" stopColor="#8A0E1E" /></radialGradient>
        <pattern id={`${g}-hz`} width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="20" height="40" fill="#FCC018" /><rect x="20" width="20" height="40" fill="#141414" /></pattern>
        <filter id={`${g}-b`} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={30} /></filter>
      </defs>
      {/* alarm glow behind */}
      <circle cx={0} cy={-40} r={330} fill="#FF2E4D" opacity={0.45 * flash} filter={`url(#${g}-b)`} />
      {/* panel with hazard border */}
      <rect x={-250} y={-170} width={500} height={340} rx={36} fill={`url(#${g}-hz)`} stroke={OUT} strokeWidth={8} />
      <rect x={-218} y={-138} width={436} height={276} rx={24} fill={`url(#${g}-pl)`} stroke={OUT} strokeWidth={6} />
      <rect x={-200} y={-122} width={10} height={220} rx={5} fill="#FFFFFF" opacity={0.25} />
      {/* collar + button */}
      <ellipse cx={0} cy={36} rx={128} ry={44} fill="#9AA2B8" stroke={OUT} strokeWidth={7} />
      <g transform={`translate(0 ${sink * 22})`}>
        <path d="M-96 30 L-96 0 Q-96 -92 0 -92 Q96 -92 96 0 L96 30 Q0 62 -96 30 Z" fill={`url(#${g}-btn)`} stroke={OUT} strokeWidth={8} strokeLinejoin="round" transform={`scale(1 ${1 - sink * 0.18})`} />
        <path d="M-58 -40 Q-40 -74 0 -78" fill="none" stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" opacity={0.75} />
      </g>
      {/* the flip-up guard, hinged on its top edge */}
      <g transform={`translate(0 -112) scale(1 ${1 - 1.4 * gp})`}>
        <path d="M-122 0 H122 V176 Q122 196 102 196 H-102 Q-122 196 -122 176 Z" fill="#E8243C" fillOpacity={0.28} stroke="#FF6B78" strokeWidth={6} />
        <path d="M-122 0 H122" stroke={OUT} strokeWidth={10} />
        <rect x={-104} y={14} width={12} height={150} rx={6} fill="#FFFFFF" opacity={0.45} />
      </g>
      {/* hinge */}
      <rect x={-130} y={-122} width={260} height={18} rx={9} fill="#5E6880" stroke={OUT} strokeWidth={5} />
      {/* alarm beacon */}
      <g transform="translate(170 -170)">
        <rect x={-34} y={-6} width={68} height={22} rx={6} fill="#2B2F45" stroke={OUT} strokeWidth={5} />
        <path d="M-28 -6 Q-28 -60 0 -60 Q28 -60 28 -6 Z" fill={alarm > 0 ? '#FF2E4D' : '#7A2030'} stroke={OUT} strokeWidth={6} />
        {alarm > 0 && <path d={`M0 -34 L${-260} ${-120} L${-260} ${40} Z`} fill="#FF4D5E" opacity={0.35 * flash} transform={`rotate(${((t - (pressAt ?? 0)) * 260) % 360} 0 -34)`} />}
        <rect x={-16} y={-50} width={7} height={34} rx={3} fill="#FFFFFF" opacity={0.7} />
      </g>
      {/* the finger (a sleeve and a pointing hand coming down from the top right) */}
      {fingerIn > 0 && (
        <g transform={`translate(${(1 - fingerIn) * 260 + 6} ${(1 - fingerIn) * -520 + sink * 22 - 150}) rotate(-18)`}>
          <rect x={30} y={-330} width={150} height={190} rx={30} fill="#26305A" stroke={OUT} strokeWidth={8} />
          <rect x={22} y={-160} width={166} height={40} rx={16} fill="#F2B010" stroke={OUT} strokeWidth={7} />
          <path d="M40 -122 Q38 -40 92 -26 L150 -30 Q182 -36 178 -92 L176 -124 Z" fill="#E9B48A" stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
          <rect x={44} y={-58} width={40} height={130} rx={20} fill="#E9B48A" stroke={OUT} strokeWidth={8} />
          <rect x={52} y={-46} width={8} height={70} rx={4} fill="#FFFFFF" opacity={0.6} />
        </g>
      )}
      {label && t >= label.at && <NPill text={label.text} x={0} y={230} size={44} kind="red" id={`${id}-lbl`} p={clamp01((t - label.at) / 0.3)} />}
    </g>
  );
};
