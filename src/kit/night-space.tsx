// NIGHT SPACE — the space chapter of the AZTIKA look (references/universe-claude 7:51–8:44 and 12:59–14:31, 13 % of
// the reference's screen time). SpaceWorld (near-black navy, measured #01010A → #03071E, tiny twinkling stars) ·
// Earth (real continents, blue glow, clouds, night side) · Sun (boiling surface + corona) · Galaxy (spiral of star
// dust) · Asteroid / AsteroidField (flat grey rocks, optional cut-away with a glowing core = «مليانة معادن») · Planet ·
// ISS · Astronaut (with tether) · Orbiters (people circling the Earth, «لما العالم يتعاون» 8:40).
// All in screen coordinates — use inside <NightScreen>. All silent (pair a reveal with RevealRing for the shimmer).
import React from 'react';
import {clamp01, ease, lerp, popRef, rand} from './anim';
import {cueSfx} from './sfx';
import {H, W} from './theme';
import {uid} from './stage';
import {Globe} from './depth';
import {Sparkle} from './night';

/** Space backdrop: near-black navy, faint blue nebula clouds, many tiny stars (some twinkle, a few 4-point sparkles). drift = px/s star parallax. */
export const SpaceWorld: React.FC<{t: number; id: string; stars?: number; drift?: number; nebula?: boolean}> = ({t, id, stars = 140, drift = 4, nebula = true}) => {
  const g = uid('nspace', id);
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#01010A" />
          <stop offset="0.6" stopColor="#020517" />
          <stop offset="1" stopColor="#04081F" />
        </linearGradient>
        <filter id={g + '__b'} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={90} />
        </filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      {nebula && (
        <g filter={`url(#${g}__b)`} opacity={0.55}>
          <ellipse cx={420} cy={300} rx={420} ry={220} fill="#0B1E4A" />
          <ellipse cx={1500} cy={760} rx={480} ry={240} fill="#0E1640" />
          <ellipse cx={1100} cy={180} rx={300} ry={140} fill="#170F3A" />
        </g>
      )}
      {Array.from({length: stars}, (_, i) => {
        const depth = 0.3 + rand(i * 5 + 2) * 0.7;
        const x = (((rand(i * 7 + 1) * W - t * drift * depth) % W) + W) % W, y = rand(i * 13 + 5) * H;
        const tw = 0.5 + 0.5 * Math.sin(t * (1 + rand(i) * 2.2) + i);
        return i % 23 === 0 ? <Sparkle key={i} x={x} y={y} r={6 + rand(i + 3) * 5} o={0.35 + 0.5 * tw} /> : <circle key={i} cx={x} cy={y} r={0.7 + depth * 1.3} fill="#FFFFFF" opacity={(0.2 + 0.6 * depth) * (0.6 + 0.4 * tw)} />;
      })}
    </g>
  );
};

/**
 * Earth — real continents (kit/depth Globe, 110m/50m data) dressed like the reference (7:51, 13:05): deep ocean blue,
 * green-brown land, drifting cloud wisps, a soft blue atmosphere glow and a dark night side. spin = degrees/s.
 * Put y below the frame edge (y = 1180, r = 520) for the "Earth from orbit" arc of 7:51.
 */
export const Earth: React.FC<{t: number; x: number; y: number; r: number; id: string; at?: number; spin?: number; lon?: number; lat?: number; glow?: number; night?: number}> = ({
  t, x, y, r, id, at = -1, spin = 4, lon = -60, lat = 12, glow = 1, night = 0.55,
}) => {
  if (t < at) return null;
  const q = at >= 0 ? popRef(clamp01((t - at) / 0.35), 0.4, 0.4) : {sx: 1, sy: 1, o: 1};
  if (at >= 0) cueSfx('sparkle', `nearth-${id}-${at}`, t < at + 0.3, x, {at, hit: 0.125}); // SOUND MAP: Earth appears → shimmer
  const g = uid('nearth', id);
  const rot = lon + t * spin;
  return (
    <g transform={`translate(${x} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
      <defs>
        <filter id={g + '__b'} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={r * 0.12} />
        </filter>
        <filter id={g + '__c'} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={r * 0.018} />
        </filter>
        <clipPath id={g + '__k'}>
          <circle r={r} />
        </clipPath>
        <radialGradient id={g + '__a'} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.82" stopColor="#7FD4FF" stopOpacity="0" />
          <stop offset="0.97" stopColor="#8FDCFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#CFF1FF" stopOpacity="0.9" />
        </radialGradient>
        <radialGradient id={g + '__n'} cx="0.25" cy="0.22" r="1">
          <stop offset="0.45" stopColor="#000814" stopOpacity="0" />
          <stop offset="0.85" stopColor="#000814" stopOpacity={0.75 * night} />
        </radialGradient>
        <radialGradient id={g + '__s'} cx="0.3" cy="0.28" r="0.45">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r={r * 1.08} fill="#2F8BFF" opacity={0.55 * glow} filter={`url(#${g}__b)`} />
      <Globe x={0} y={0} r={r} rotate={[rot, lat]} land="#3F9A45" sea="#0F4FA8" coast="#2E7A33" borders={false} graticule={false} shade={false} rim={false} />
      <g clipPath={`url(#${g}__k)`}>
        <circle r={r} fill="#0A3A8A" opacity={0.12} />
        <g filter={`url(#${g}__c)`} opacity={0.75}>
          {Array.from({length: 16}, (_, i) => {
            const u = ((rand(i * 3 + 1) + (t * spin) / 360) % 1) * 2.4 - 1.2; // clouds drift with the spin
            const cx = u * r, cy = (rand(i * 7 + 2) - 0.5) * r * 1.7;
            const squash = Math.sqrt(Math.max(0, 1 - (cx / r) ** 2 - (cy / r) ** 2 * 0.3));
            if (squash <= 0.05) return null;
            const len = r * (0.12 + rand(i * 5) * 0.2) * squash;
            return (
              <g key={i} opacity={0.55 + rand(i * 11) * 0.35}>
                <ellipse cx={cx} cy={cy} rx={len} ry={r * 0.028} fill="#FFFFFF" />
                <ellipse cx={cx + len * 0.35} cy={cy - r * 0.03} rx={len * 0.55} ry={r * 0.022} fill="#FFFFFF" />
              </g>
            );
          })}
        </g>
        <circle r={r} fill={`url(#${g}__s)`} />
        <circle r={r} fill={`url(#${g}__n)`} />
      </g>
      <circle r={r * 1.02} fill={`url(#${g}__a)`} />
    </g>
  );
};

/** Sun — boiling orange surface (animated noise), white-yellow centre, wide corona glow (13:35). Pair with <Rays tone="orange">. */
export const Sun: React.FC<{t: number; x: number; y: number; r: number; id: string; at?: number}> = ({t, x, y, r, id, at = -1}) => {
  if (t < at) return null;
  const q = at >= 0 ? popRef(clamp01((t - at) / 0.35), 0.4, 0.4) : {sx: 1, sy: 1, o: 1};
  if (at >= 0) cueSfx('sparkle', `nsun-${id}-${at}`, t < at + 0.3, x, {at, hit: 0.125}); // SOUND MAP: a glowing body appears → shimmer
  const g = uid('nsun', id);
  return (
    <g transform={`translate(${x} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o}>
      <defs>
        <radialGradient id={g} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF6C8" />
          <stop offset="0.35" stopColor="#FFD24A" />
          <stop offset="0.75" stopColor="#FF8A1C" />
          <stop offset="1" stopColor="#E0480C" />
        </radialGradient>
        <filter id={g + '__b'} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={r * 0.22} />
        </filter>
        <filter id={g + '__n'} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={4 / r} numOctaves={3} seed={7} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.22  0 0 0 0 0.02  0 0 0 2.2 -1.0" />
        </filter>
        <clipPath id={g + '__k'}>
          <circle r={r} />
        </clipPath>
      </defs>
      <circle r={r * 1.35} fill="#FF7A18" opacity={0.65} filter={`url(#${g}__b)`} />
      <circle r={r * 1.08} fill="#FFB02E" opacity={0.5} filter={`url(#${g}__b)`} />
      <circle r={r} fill={`url(#${g})`} />
      <g clipPath={`url(#${g}__k)`}>
        <g transform={`rotate(${t * 3})`}>
          <rect x={-r * 1.5} y={-r * 1.5} width={r * 3} height={r * 3} filter={`url(#${g}__n)`} opacity={0.75} />
        </g>
        <circle r={r} fill="none" stroke="#FF5A0A" strokeWidth={r * 0.08} opacity={0.5} />
      </g>
      {Array.from({length: 6}, (_, i) => {
        const a = rand(i * 9 + 1) * Math.PI * 2 + t * 0.05;
        const fl = 0.5 + 0.5 * Math.sin(t * (1.5 + rand(i)) + i);
        return <ellipse key={i} cx={Math.cos(a) * r * 1.01} cy={Math.sin(a) * r * 1.01} rx={r * 0.08 * (0.6 + fl)} ry={r * 0.03} transform={`rotate(${(a * 180) / Math.PI + 90} ${Math.cos(a) * r * 1.01} ${Math.sin(a) * r * 1.01})`} fill="#FFC23A" opacity={0.7 * fl} />;
      })}
    </g>
  );
};

/** Galaxy — a tilted two-arm spiral of star dust with a bright core (13:45, 14:31). tilt = flattening 0..1, rot = degrees. */
export const Galaxy: React.FC<{t: number; x: number; y: number; r: number; id: string; at?: number; tilt?: number; rot?: number; n?: number; color?: string}> = ({
  t, x, y, r, id, at = -1, tilt = 0.42, rot = -22, n = 520, color = '#C9B8FF',
}) => {
  if (t < at) return null;
  const p = at >= 0 ? clamp01((t - at) / 0.6) : 1;
  if (at >= 0) cueSfx('sparkle', `ngal-${id}-${at}`, t < at + 0.3, x, {at, hit: 0.2}); // SOUND MAP: glowing star dust → shimmer
  const g = uid('ngal', id);
  const spin = t * 0.04;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${lerp(0.7, 1, ease.out(p))})`} opacity={p}>
      <defs>
        <filter id={g + '__b'} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={r * 0.12} />
        </filter>
      </defs>
      <ellipse rx={r * 1.05} ry={r * tilt * 1.05} fill="#3B2C8A" opacity={0.35} filter={`url(#${g}__b)`} />
      <ellipse rx={r * 0.32} ry={r * tilt * 0.32} fill="#E9E1FF" opacity={0.75} filter={`url(#${g}__b)`} />
      {Array.from({length: n}, (_, i) => {
        const arm = i % 2;
        const d = Math.pow(rand(i * 3 + 1), 0.65) * r;
        const a = arm * Math.PI + (d / r) * 3.4 + (rand(i * 5 + 2) - 0.5) * 0.9 * (1 - d / r + 0.3) + spin;
        const px = Math.cos(a) * d, py = Math.sin(a) * d * tilt;
        const big = rand(i * 11) > 0.93;
        const tw = 0.6 + 0.4 * Math.sin(t * 2 + i);
        return <circle key={i} cx={px} cy={py} r={big ? 2.6 : 1 + rand(i * 7) * 1.3} fill={rand(i * 13) > 0.7 ? '#FFFFFF' : color} opacity={(1 - (d / r) * 0.6) * (big ? tw : 0.75)} />;
      })}
      <ellipse rx={r * 0.1} ry={r * tilt * 0.12} fill="#FFFFFF" opacity={0.9} filter={`url(#${g}__b)`} />
    </g>
  );
};

const rockPath = (r: number, seed: number, k = 9) =>
  Array.from({length: k}, (_, i) => {
    const a = (i / k) * Math.PI * 2, rr = r * (0.78 + rand(seed + i) * 0.3);
    return `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
  }).join(' ') + 'Z';

/**
 * Asteroid — flat grey rock: thick dark outline, light upper facet, darker lower half, a few craters (13:12).
 * cut = 0..1 opens a wedge that shows its layers and a glowing mineral core («مليانة معادن» 13:20); core = its colour.
 */
export const Asteroid: React.FC<{x: number; y: number; r: number; seed?: number; rot?: number; cut?: number; core?: string; id: string}> = ({x, y, r, seed = 1, rot = 0, cut = 0, core = '#FFE45A', id}) => {
  const d = rockPath(r, seed * 17);
  const g = uid('nast', id);
  const c = clamp01(cut);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <defs>
        <clipPath id={g}>
          <path d={d} />
        </clipPath>
        <filter id={g + '__b'} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={r * 0.15} />
        </filter>
      </defs>
      <path d={d} fill="#7D7F8C" />
      <g clipPath={`url(#${g})`}>
        <path d={`M${-r * 1.2} ${-r * 1.2} L${r * 1.2} ${-r * 1.2} L${r * 0.3} ${r * 0.05} L${-r * 1.2} ${r * 0.25}Z`} fill="#A3A5B2" />
        <path d={`M${-r * 1.2} ${r * 0.45} L${r * 1.2} ${-r * 0.1} L${r * 1.2} ${r * 1.2} L${-r * 1.2} ${r * 1.2}Z`} fill="#5C5E6B" opacity={0.85} />
        {Array.from({length: 4}, (_, i) => (
          <ellipse key={i} cx={(rand(seed * 5 + i) - 0.5) * r} cy={(rand(seed * 7 + i) - 0.5) * r} rx={r * (0.08 + rand(seed + i * 3) * 0.08)} ry={r * (0.06 + rand(seed + i * 3) * 0.05)} fill="#4E505C" opacity={0.7} />
        ))}
        {c > 0 && (
          <g>
            {/* cut-away wedge: layers, then the glowing core */}
            <path d={`M0 0 L${r * 1.3} ${-r * 0.55 * c} L${r * 1.3} ${r * 0.55 * c}Z`} fill="#3B3D48" />
            <path d={`M0 0 L${r * 0.75} ${-r * 0.32 * c} A${r * 0.8} ${r * 0.8} 0 0 1 ${r * 0.75} ${r * 0.32 * c}Z`} fill="#C8CBD6" />
            <path d={`M0 0 L${r * 0.5} ${-r * 0.22 * c} A${r * 0.55} ${r * 0.55} 0 0 1 ${r * 0.5} ${r * 0.22 * c}Z`} fill="#BFF3E9" />
            <circle r={r * 0.3 * c} fill={core} filter={`url(#${g}__b)`} />
            <circle r={r * 0.18 * c} fill={core} />
          </g>
        )}
      </g>
      <path d={d} fill="none" stroke="#1A1A24" strokeWidth={Math.max(3, r * 0.05)} strokeLinejoin="round" />
    </g>
  );
};

/** A slowly drifting, tumbling field of small asteroids (13:12). Keep `avoid` (x, y, r) clear for the hero object. */
export const AsteroidField: React.FC<{t: number; n?: number; seed?: number; size?: number; avoid?: {x: number; y: number; r: number}; id: string}> = ({t, n = 14, seed = 3, size = 34, avoid, id}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      let x = rand(seed * 31 + i) * W, y = rand(seed * 37 + i * 3) * H;
      if (avoid && Math.hypot(x - avoid.x, y - avoid.y) < avoid.r) x = (x + avoid.r * 1.6) % W;
      const r = size * (0.5 + rand(seed + i * 7) * 0.9);
      x += Math.sin(t * 0.3 + i) * 12 - t * 6 * (0.5 + rand(i));
      y += Math.cos(t * 0.25 + i * 2) * 8;
      return <Asteroid key={i} x={((x % W) + W) % W} y={y} r={r} seed={seed + i} rot={t * (rand(i * 9) - 0.5) * 30} id={`${id}-${i}`} />;
    })}
  </g>
);

/** Planet — shaded sphere with soft bands and an optional ring (gas giant). */
export const Planet: React.FC<{x: number; y: number; r: number; color?: string; band?: string; ring?: boolean; id: string; t?: number}> = ({x, y, r, color = '#D9A066', band = '#B5733E', ring, id, t = 0}) => {
  const g = uid('nplan', id);
  const ringEl = (half: 'back' | 'front') => (
    <path d={half === 'back' ? `M${-r * 1.8} 0 A${r * 1.8} ${r * 0.42} 0 0 1 ${r * 1.8} 0` : `M${-r * 1.8} 0 A${r * 1.8} ${r * 0.42} 0 0 0 ${r * 1.8} 0`} fill="none" stroke="#E9D3A8" strokeWidth={r * 0.16} opacity={0.85} transform="rotate(-14)" />
  );
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={g} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#000010" stopOpacity="0.6" />
        </radialGradient>
        <clipPath id={g + '__k'}>
          <circle r={r} />
        </clipPath>
      </defs>
      {ring && ringEl('back')}
      <circle r={r} fill={color} />
      <g clipPath={`url(#${g}__k)`}>
        {Array.from({length: 5}, (_, i) => (
          <ellipse key={i} cx={Math.sin(t * 0.2 + i) * r * 0.05} cy={-r * 0.7 + i * r * 0.35} rx={r * 1.3} ry={r * 0.07 + rand(i * 3) * r * 0.06} fill={band} opacity={0.55} />
        ))}
      </g>
      <circle r={r} fill={`url(#${g})`} />
      {ring && ringEl('front')}
    </g>
  );
};

/** ISS — the space station drawn flat (7:51): long truss, 4 pairs of blue solar wings with gold frames, white modules. s = scale (1 ≈ 520 px wide). */
export const ISS: React.FC<{x: number; y: number; s?: number; t?: number; rot?: number}> = ({x, y, s = 1, t = 0, rot = -14}) => {
  const wing = (wx: number, wy: number, key: string) => (
    <g key={key} transform={`translate(${wx} ${wy})`}>
      <rect x={-34} y={-78} width={68} height={156} rx={3} fill="#1B2F6E" stroke="#C9A24A" strokeWidth={4} />
      {Array.from({length: 7}, (_, i) => <line key={i} x1={-34} x2={34} y1={-78 + (i + 1) * 19.5} y2={-78 + (i + 1) * 19.5} stroke="#3E5BB0" strokeWidth={2} />)}
      <line x1={0} x2={0} y1={-78} y2={78} stroke="#3E5BB0" strokeWidth={2} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y + Math.sin(t * 0.8) * 6}) rotate(${rot + Math.sin(t * 0.4) * 2}) scale(${s})`}>
      <g stroke="#1A1A24" strokeWidth={5} strokeLinejoin="round">
        <rect x={-260} y={-9} width={520} height={18} rx={4} fill="#B9BCC8" />
        {[-210, -130, 130, 210].map((wx) => (
          <g key={wx}>
            {wing(wx, -92, 'a' + wx)}
            {wing(wx, 92, 'b' + wx)}
          </g>
        ))}
        <rect x={-70} y={-26} width={140} height={52} rx={22} fill="#E8EAF0" />
        <rect x={-22} y={-90} width={44} height={180} rx={18} fill="#F2F3F7" />
        <rect x={34} y={30} width={60} height={30} rx={8} fill="#D9DCE4" />
        <rect x={-100} y={-60} width={30} height={40} rx={4} fill="#F7F7FA" />
      </g>
      <rect x={-60} y={-18} width={120} height={8} rx={4} fill="#FFFFFF" opacity={0.6} />
    </g>
  );
};

/** Astronaut — white suit, round helmet with dark visor and a cyan glint (8:30). tether = a line to (tx, ty) (screen coords). */
export const Astronaut: React.FC<{x: number; y: number; s?: number; t?: number; rot?: number; tx?: number; ty?: number; accent?: string}> = ({x, y, s = 1, t = 0, rot = -10, tx, ty, accent = '#3B82F6'}) => {
  const bob = Math.sin(t * 1.1) * 8;
  const yy = y + bob;
  return (
    <g>
      {tx !== undefined && ty !== undefined && (
        <path d={`M${x + 40 * s} ${yy} C${lerp(x, tx, 0.35)} ${yy - 80} ${lerp(x, tx, 0.6)} ${ty + 70} ${tx} ${ty}`} fill="none" stroke="#E8EAF0" strokeWidth={4} opacity={0.85} />
      )}
      <g transform={`translate(${x} ${yy}) rotate(${rot + Math.sin(t * 0.7) * 5}) scale(${s})`} stroke="#1A1A24" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round">
        <rect x={-46} y={-20} width={92} height={110} rx={30} fill="#D5D8E2" />
        <path d="M-40 10 Q-80 30 -70 70" fill="none" stroke="#1A1A24" strokeWidth={34} />
        <path d="M-40 10 Q-80 30 -70 70" fill="none" stroke="#F4F5F8" strokeWidth={22} />
        <path d="M40 10 Q80 0 92 -30" fill="none" stroke="#1A1A24" strokeWidth={34} />
        <path d="M40 10 Q80 0 92 -30" fill="none" stroke="#F4F5F8" strokeWidth={22} />
        <rect x={-38} y={-10} width={76} height={104} rx={26} fill="#F4F5F8" />
        <rect x={-16} y={20} width={32} height={22} rx={5} fill={accent} />
        <rect x={-34} y={84} width={28} height={50} rx={12} fill="#F4F5F8" />
        <rect x={6} y={84} width={28} height={50} rx={12} fill="#F4F5F8" />
        <circle cx={0} cy={-62} r={56} fill="#F4F5F8" />
        <circle cx={0} cy={-62} r={40} fill="#0E1A3A" stroke="#7FE6FF" strokeWidth={5} />
        <path d="M-22 -80 Q-10 -94 8 -92" fill="none" stroke="#BFF3FF" strokeWidth={7} />
      </g>
    </g>
  );
};

/**
 * Orbiters — little astronauts circling the Earth (8:40 «لما العالم يتعاون»): n figures on an ellipse around (x, y),
 * each with its own accent colour, those behind the planet hidden. Draw AFTER <Earth> with the same x, y.
 */
export const Orbiters: React.FC<{t: number; x: number; y: number; rx: number; ry?: number; n?: number; speed?: number; s?: number; at?: number; r?: number}> = ({
  t, x, y, rx, ry, n = 9, speed = 8, s = 0.32, at = -1, r = 0,
}) => {
  if (t < at) return null;
  const p = at >= 0 ? clamp01((t - at) / 0.5) : 1;
  if (at >= 0) cueSfx('whoosh', `norbit-${at}-${x}`, t < at + 0.3, x, {at, hit: 0.25}); // SOUND MAP: people circling → whoosh
  const ryy = ry ?? rx * 0.9;
  const cols = ['#E23A4E', '#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#14B8A6'];
  return (
    <g opacity={p}>
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 + (t * speed * Math.PI) / 180;
        const px = x + Math.cos(a) * rx * lerp(0.6, 1, ease.out(p)), py = y + Math.sin(a) * ryy * lerp(0.6, 1, ease.out(p));
        if (r > 0 && Math.hypot(px - x, py - y) < r) return null;
        return <Astronaut key={i} x={px} y={py} s={s} t={t + i} rot={(a * 180) / Math.PI + 90} accent={cols[i % cols.length]} />;
      })}
    </g>
  );
};
