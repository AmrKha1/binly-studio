// NIGHT PLACES — more story worlds for the AZTIKA look (references/universe-claude, GAP-CHECK P2):
// MineWorld (1:43 the diamond mine) · VillageWorld (3:44 «وإحنا؟!» — teepees / bedouin tents / huts) · DayWorld (4:32
// bright day: "normal life", a house, the land) · LabWorld (10:37 the beige "light lab") · FactoryLine (9:11 «اقتصاد كل
// قوة كبيرة»: things ride a conveyor into a factory, coins come out) · PlateWorld (a painted Flow backdrop of a real place
// with a slow camera move + night grade — from the second reference). Screen coordinates — use inside <NightScreen>.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp01, ease, lerp, rand} from './anim';
import {H, W} from './theme';
import {uid} from './stage';
import {Coin} from './night-props';
import {cueSfx} from './sfx';

const OUT = '#14101C';

/** MineWorld — dark tunnel with wooden frames in depth, warm hanging lamps, floating dust (1:43). */
export const MineWorld: React.FC<{t: number; id: string}> = ({t, id}) => {
  const g = uid('nmine', id);
  const frame = (cx: number, w: number, top: number, floor: number, k: number) => (
    <g key={cx} opacity={0.55 + 0.45 * k}>
      <rect x={cx - w / 2} y={top} width={w} height={22 * k + 6} fill="#6B4423" stroke={OUT} strokeWidth={4} />
      <rect x={cx - w / 2} y={top} width={18 * k + 6} height={floor - top} fill="#5A381C" stroke={OUT} strokeWidth={4} />
      <rect x={cx + w / 2 - 18 * k - 6} y={top} width={18 * k + 6} height={floor - top} fill="#5A381C" stroke={OUT} strokeWidth={4} />
      <line x1={cx} y1={top + 22 * k} x2={cx} y2={top + 60 * k + 14} stroke="#2A1A0E" strokeWidth={3} />
      <circle cx={cx} cy={top + 66 * k + 18} r={10 * k + 4} fill="#FFD25A" />
    </g>
  );
  return (
    <g>
      <defs>
        <radialGradient id={g} cx="0.5" cy="0.55" r="0.75">
          <stop offset="0" stopColor="#4A3220" />
          <stop offset="0.6" stopColor="#2A1C12" />
          <stop offset="1" stopColor="#120B06" />
        </radialGradient>
        <filter id={g + '__b'} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={26} />
        </filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      <rect x={0} y={880} width={W} height={H - 880} fill="#1E140C" />
      <rect x={0} y={872} width={W} height={10} fill="#3A2614" />
      {[[960, 780, 300, 760, 0.35], [520, 900, 200, 880, 1], [1400, 900, 200, 880, 1]].map(([cx, w, top, fl, k]) => frame(cx, w, top, fl, k))}
      {[960, 520, 1400].map((cx, i) => (
        <circle key={i} cx={cx} cy={i ? 284 : 340} r={i ? 70 : 40} fill="#FFC23A" opacity={0.35} filter={`url(#${g}__b)`} />
      ))}
      {Array.from({length: 24}, (_, i) => {
        const x = (rand(i * 3) * W + Math.sin(t * 0.5 + i) * 30) % W;
        const y = (rand(i * 7) * H + t * (6 + rand(i) * 8)) % H;
        return <circle key={i} cx={x} cy={y} r={1.5 + rand(i * 5) * 2} fill="#E9C38A" opacity={0.25 + 0.25 * Math.sin(t + i)} />;
      })}
    </g>
  );
};

/** DayWorld — bright blue sky, a sun with big soft rays, puffy clouds, green rolling hills (4:32): ordinary life, home, land. */
export const DayWorld: React.FC<{t: number; id: string; sunX?: number; sunY?: number; ground?: number}> = ({t, id, sunX = 330, sunY = 150, ground = 820}) => {
  const g = uid('nday', id);
  const cloud = (x: number, y: number, s: number, k: number) => (
    <g key={k} transform={`translate(${((x + t * 12 * s) % (W + 300)) - 150} ${y}) scale(${s})`} fill="#FFFFFF" stroke="#BFE3F7" strokeWidth={3}>
      <ellipse cx={0} cy={0} rx={90} ry={34} />
      <circle cx={-34} cy={-18} r={34} />
      <circle cx={18} cy={-30} r={42} />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3FA4F2" />
          <stop offset="1" stopColor="#B9E4FF" />
        </linearGradient>
        <filter id={g + '__b'} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={40} />
        </filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      <g opacity={0.28}>
        {Array.from({length: 14}, (_, i) => {
          const a = (i / 14) * Math.PI * 2 + t * 0.03, b = a + Math.PI / 20;
          return <path key={i} d={`M${sunX} ${sunY} L${sunX + Math.cos(a) * 2600} ${sunY + Math.sin(a) * 2600} L${sunX + Math.cos(b) * 2600} ${sunY + Math.sin(b) * 2600}Z`} fill="#FFFFFF" />;
        })}
      </g>
      <circle cx={sunX} cy={sunY} r={150} fill="#FFF6B0" opacity={0.8} filter={`url(#${g}__b)`} />
      <circle cx={sunX} cy={sunY} r={70} fill="#FFE45A" stroke="#FFF6C8" strokeWidth={8} />
      {cloud(1400, 120, 1, 1)}
      {cloud(900, 220, 0.7, 2)}
      {cloud(1750, 300, 0.6, 3)}
      <path d={`M0 ${ground} Q${W * 0.25} ${ground - 70} ${W * 0.5} ${ground - 10} T${W} ${ground - 40} V${H} H0Z`} fill="#4FB85A" />
      <path d={`M0 ${ground + 60} Q${W * 0.3} ${ground + 10} ${W * 0.6} ${ground + 70} T${W} ${ground + 50} V${H} H0Z`} fill="#3E9E4A" />
      <path d={`M0 ${ground} Q${W * 0.25} ${ground - 70} ${W * 0.5} ${ground - 10} T${W} ${ground - 40}`} fill="none" stroke="#2E7A38" strokeWidth={6} />
    </g>
  );
};

/**
 * VillageWorld — a pale daytime field with a row of homes (3:44 «وإحنا؟!» the people who lived there): kind teepee
 * (striped cone tents), tent (bedouin black tents), hut (round huts with straw roofs). Put StoryPeople in front.
 */
export const VillageWorld: React.FC<{t: number; id: string; kind?: 'teepee' | 'tent' | 'hut'; ground?: number}> = ({t, id, kind = 'teepee', ground = 880}) => {
  const g = uid('nvil', id);
  const home = (x: number, s: number, k: number) => {
    if (kind === 'teepee')
      return (
        <g key={k} transform={`translate(${x} ${ground}) scale(${s})`} stroke={OUT} strokeWidth={6} strokeLinejoin="round">
          <path d="M-20 -330 L-4 -280 M20 -330 L4 -280 M0 -340 L0 -280" fill="none" />
          <path d="M-150 0 L0 -290 L150 0 Z" fill="#F2E3C2" />
          <path d="M-112 -70 L112 -70 L120 -50 L-120 -50Z" fill="#C2410C" stroke="none" />
          <path d="M-70 -150 L70 -150 L76 -136 L-76 -136Z" fill="#1D4ED8" stroke="none" />
          <path d="M-40 0 Q0 -110 40 0 Z" fill="#3A2614" />
        </g>
      );
    if (kind === 'tent')
      return (
        <g key={k} transform={`translate(${x} ${ground}) scale(${s})`} stroke={OUT} strokeWidth={6} strokeLinejoin="round">
          <path d="M-210 0 L-170 -150 L-60 -120 L0 -170 L60 -120 L170 -150 L210 0 Z" fill="#2A2420" />
          <path d="M-210 0 L-170 -150 L-60 -120 L0 -170 L60 -120 L170 -150 L210 0" fill="none" stroke="#E2C48A" strokeWidth={4} strokeDasharray="10 14" />
          <path d="M-50 0 L-30 -110 L30 -110 L50 0Z" fill="#8A2A1E" />
        </g>
      );
    return (
      <g key={k} transform={`translate(${x} ${ground}) scale(${s})`} stroke={OUT} strokeWidth={6} strokeLinejoin="round">
        <rect x={-120} y={-150} width={240} height={150} rx={20} fill="#C99A64" />
        <path d="M-160 -130 Q0 -330 160 -130 Z" fill="#E2B04A" />
        <path d="M-30 0 V-80 Q0 -110 30 -80 V0Z" fill="#3A2614" />
      </g>
    );
  };
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF7DA" />
          <stop offset="1" stopColor="#F4E6B8" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      <path d={`M0 ${ground - 120} Q${W * 0.3} ${ground - 170} ${W * 0.6} ${ground - 120} T${W} ${ground - 130} V${H} H0Z`} fill="#B9D77A" opacity={0.6} />
      <rect x={0} y={ground - 10} width={W} height={H - ground + 10} fill="#7CC05A" />
      <rect x={0} y={ground - 10} width={W} height={8} fill="#5C9E3E" />
      {[[260, 0.75], [1660, 0.75], [640, 1], [1290, 1], [960, 0.6]].map(([x, s], k) => home(x, s, k))}
      {Array.from({length: 18}, (_, i) => (
        <path key={i} d={`M${rand(i * 3) * W} ${ground + 30 + rand(i * 5) * 150} l${8 + Math.sin(t * 2 + i) * 3} -18 l8 18`} fill="none" stroke="#4E9A36" strokeWidth={4} strokeLinecap="round" />
      ))}
    </g>
  );
};

/** LabWorld — the bright beige "light lab" (10:37 the banana factory): tiled wall, a counter, a soft light from above. */
export const LabWorld: React.FC<{t: number; id: string; counter?: number}> = ({t, id, counter = 900}) => {
  const g = uid('nlab', id);
  return (
    <g>
      <defs>
        <radialGradient id={g} cx="0.5" cy="0.25" r="0.8">
          <stop offset="0" stopColor="#FFF6DD" />
          <stop offset="1" stopColor="#EAD6A8" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      <g stroke="#DCC79A" strokeWidth={3}>
        {Array.from({length: 13}, (_, i) => <line key={'v' + i} x1={i * 160} y1={0} x2={i * 160} y2={counter} />)}
        {Array.from({length: 7}, (_, i) => <line key={'h' + i} x1={0} y1={i * 130} x2={W} y2={i * 130} />)}
      </g>
      <rect x={0} y={counter} width={W} height={36} fill="#FFFFFF" stroke="#CDBB92" strokeWidth={4} />
      <rect x={0} y={counter + 36} width={W} height={H - counter - 36} fill="#E2D2AE" />
      <rect x={0} y={counter + 36} width={W} height={14} fill="#CDBB92" />
      <ellipse cx={W / 2} cy={counter - 10} rx={520 + Math.sin(t) * 4} ry={60} fill="#FFFFFF" opacity={0.5} />
    </g>
  );
};

/** StarsRating — a row of stars (10:51 «مصنع أنتي ماتر ★★★★☆»): `value` of n filled (halves allowed), popping one by one from `at`. */
export const StarsRating: React.FC<{t: number; at: number; x: number; y: number; value: number; n?: number; size?: number}> = ({t, at, x, y, value, n = 5, size = 40}) => {
  const star = (r: number) => Array.from({length: 10}, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    return `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
  }).join(' ') + 'Z';
  const d = star(size / 2);
  // SOUND MAP: small mechanics — one tick per star as it fills (they are 0.08 s apart, so only the first and the last
  // filled star tick: never a machine-gun)
  const filled = Math.max(1, Math.ceil(value));
  [0, filled - 1].filter((v, k, a) => a.indexOf(v) === k).forEach((i) => { const sa = at + i * 0.08; cueSfx('tick', `nstars-${x}-${y}-${i}-${sa}`, t >= sa && t < sa + 0.3, x, {at: sa, hit: 0.1}); });
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const p = clamp01((t - at - i * 0.08) / 0.2);
        if (p <= 0) return null;
        const fill = clamp01(value - i);
        const cx = x + (i - (n - 1) / 2) * size * 1.15;
        const gid = uid('nstar', x, y, i);
        return (
          <g key={i} transform={`translate(${cx} ${y}) scale(${ease.out(p)})`}>
            <defs>
              <clipPath id={gid}>
                <rect x={-size / 2} y={-size / 2} width={size * fill} height={size} />
              </clipPath>
            </defs>
            <path d={d} fill="#D9D3C2" stroke={OUT} strokeWidth={3} strokeLinejoin="round" />
            <path d={d} fill="#FFC928" clipPath={`url(#${gid})`} />
            <path d={d} fill="none" stroke={OUT} strokeWidth={3} strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
};

type Cargo = 'tank' | 'ship' | 'plane' | 'shell' | 'fuel' | 'box';
const cargo = (k: Cargo) => {
  const s = {stroke: OUT, strokeWidth: 4, strokeLinejoin: 'round' as const};
  switch (k) {
    case 'tank':
      return <g {...s}><rect x={-46} y={-22} width={92} height={24} rx={10} fill="#4B5A2A" /><rect x={-24} y={-40} width={44} height={20} rx={6} fill="#5E6E34" /><rect x={18} y={-34} width={44} height={8} fill="#5E6E34" /></g>;
    case 'ship':
      return <g {...s}><path d="M-56 -20 H56 L40 0 H-40 Z" fill="#7A8494" /><rect x={-18} y={-40} width={30} height={20} fill="#C9CED6" /></g>;
    case 'plane':
      return <g {...s}><path d="M-50 -14 H40 Q56 -14 56 -8 Q56 -2 40 -2 H-50 Z" fill="#B9BECA" /><path d="M-6 -12 L-26 -38 H-14 L10 -12 Z" fill="#9AA0AE" /><path d="M-44 -12 L-54 -30 H-46 L-34 -12Z" fill="#9AA0AE" /></g>;
    case 'shell':
      return <g {...s}><path d="M-10 0 V-34 Q0 -50 10 -34 V0 Z" fill="#E0A20E" /></g>;
    case 'fuel':
      return <g {...s}><rect x={-20} y={-44} width={40} height={44} rx={6} fill="#C2272D" /><rect x={-20} y={-30} width={40} height={6} fill="#FFFFFF" /></g>;
    default:
      return <g {...s}><rect x={-26} y={-40} width={52} height={40} rx={4} fill="#A8743E" /><path d="M-26 -26 H26" stroke={OUT} strokeWidth={3} /></g>;
  }
};
/**
 * FactoryLine — a war/industry factory on a conveyor (9:11): cargo (tanks, ships, planes, shells, fuel, boxes) rides
 * the belt INTO the factory, gold coins ride out the other side, chimneys smoke. dir: 'in-from-left' (default) moves
 * things right-to-left like the reference. y = belt top. Labels: put NPills under the belt.
 */
export const FactoryLine: React.FC<{t: number; x?: number; y?: number; items?: Cargo[]; speed?: number; s?: number; id: string}> = ({t, x = 900, y = 800, items = ['plane', 'tank', 'ship', 'shell', 'shell', 'fuel'], speed = 70, s = 1.3, id}) => {
  const g = uid('nfact', id);
  const FW = 260, FH = 260, fw = FW * s; // building drawn at 1×, scaled by s around its base
  const belt = (
    <g>
      <rect x={0} y={y} width={W} height={26} fill="#3A3F4E" stroke={OUT} strokeWidth={4} />
      {Array.from({length: 40}, (_, i) => <rect key={i} x={((i * 52 - t * speed) % (W + 52) + W + 52) % (W + 52) - 26} y={y + 6} width={30} height={14} rx={3} fill="#5C6272" />)}
    </g>
  );
  const span = W - (x + fw / 2); // cargo comes from the right edge into the factory
  return (
    <g>
      <defs>
        <filter id={g} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={18} />
        </filter>
      </defs>
      {belt}
      {items.map((k, i) => {
        const u = ((t * speed + (i * span) / items.length) % span) / span;
        const cx = W - u * span;
        return (
          <g key={i} transform={`translate(${cx} ${y}) scale(${s})`} opacity={clamp01((1 - u) * 6)}>
            {cargo(k)}
          </g>
        );
      })}
      {Array.from({length: 6}, (_, i) => {
        const u = ((t * speed + i * 120) % (x - fw / 2)) / (x - fw / 2);
        return <Coin key={i} x={x - fw / 2 - u * (x - fw / 2)} y={y - 30 * s} r={24 * s} t={t} spin={3} phase={i} />;
      })}
      <g transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`}>
        <g stroke={OUT} strokeWidth={6} strokeLinejoin="round">
          {[-80, -20, 40].map((dx, i) => (
            <rect key={i} x={x + dx - 18} y={y - FH - 120 + i * 10} width={36} height={130} fill="#2A2430" />
          ))}
          <rect x={x - FW / 2} y={y - FH} width={FW} height={FH} rx={8} fill="#7A4A3A" />
          {[-70, 0, 70].map((dx) => (
            <rect key={dx} x={x + dx - 26} y={y - FH + 34} width={52} height={52} rx={4} fill="#FF9A2A" />
          ))}
          <circle cx={x} cy={y - 80} r={44} fill="#5A3A2E" stroke="#C9CED6" strokeWidth={8} />
        </g>
        <g transform={`rotate(${t * 60} ${x} ${y - 80})`}>
          {Array.from({length: 8}, (_, i) => <rect key={i} x={x - 6} y={y - 80 - 56} width={12} height={18} fill="#C9CED6" transform={`rotate(${i * 45} ${x} ${y - 80})`} />)}
        </g>
        {[-80, -20, 40].map((dx, i) =>
          Array.from({length: 4}, (_, k) => {
            const u = ((t * 0.5 + k * 0.25 + i * 0.13) % 1);
            return <circle key={`${i}-${k}`} cx={x + dx + Math.sin(u * 6 + i) * 20} cy={y - FH - 120 - u * 260} r={20 + u * 50} fill="#1A1216" opacity={0.5 * (1 - u)} filter={`url(#${g})`} />;
          }),
        )}
        </g>
    </g>
  );
};

/**
 * PlateWorld — a full-frame painted backdrop of a real place (Rome, Baghdad, Tenochtitlan…) generated with Flow in the
 * NIGHT PLATE style (docs/ART-STYLE.md), shown with a slow camera move (from → to over the shot: x/y = focus point in
 * the image as 0..1, s = zoom) and a night grade (darken + purple tint + vignette) so it sits with the rest of the look.
 * Reuse the same plate across shots with different elements on top. src = path inside public/.
 * SILENT: a background plate — the elements on top carry the sounds.
 */
export const PlateWorld: React.FC<{t: number; src: string; id: string; at?: number; dur?: number; from?: {x: number; y: number; s: number}; to?: {x: number; y: number; s: number}; grade?: number; tint?: string; look?: 'night' | 'natural'}> = ({
  t, src, id, at = 0, dur = 8, from = {x: 0.5, y: 0.5, s: 1.05}, to = {x: 0.5, y: 0.45, s: 1.15}, grade: grade0, tint = '#1E0B4A', look = 'night',
}) => {
  // look 'natural' = the painted SCENE PLATE in its own colours (owner 2026-11-11: bright story backgrounds like the
  // creator's other videos) — only a soft vignette; 'night' = the night grade (darken + purple tint) for night plates
  const grade = grade0 ?? (look === 'natural' ? 0 : 0.5);
  const k = ease.inOut(clamp01((t - at) / dur));
  const s = lerp(from.s, to.s, k), fx = lerp(from.x, to.x, k), fy = lerp(from.y, to.y, k);
  const w = W * s, h = H * s;
  const left = Math.min(0, Math.max(W - w, W / 2 - fx * w)), top = Math.min(0, Math.max(H - h, H / 2 - fy * h));
  const g = uid('nplate', id);
  return (
    <g>
      <defs>
        <radialGradient id={g} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#05010F" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <foreignObject x={0} y={0} width={W} height={H}>
        <div style={{width: W, height: H, overflow: 'hidden', position: 'relative'}}>
          <Img src={staticFile(src)} style={{position: 'absolute', left, top, width: w, height: h, objectFit: 'cover'}} />
        </div>
      </foreignObject>
      {/* night grade as plain overlays (blend modes don't cross foreignObject reliably) */}
      <rect x={0} y={0} width={W} height={H} fill={tint} opacity={grade * 0.75} />
      <rect x={0} y={0} width={W} height={H} fill="#05010F" opacity={grade * 0.3} />
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
    </g>
  );
};

/**
 * PlateFx — the LIFE layer on a painted plate (owner 2026-11-11: a painted background is never a still shot — Claude's
 * animation runs on top). Deterministic particles matched to the scene, drawn over the plate and under the overlays:
 * confetti (celebration 1945) · snow (Vienna 1909) · smoke (a factory, a chimney) · dust (light shafts in a hall, a mine)
 * · embers (fire, war) · rays (sunlight shafts sweeping slowly) · rain. density 0.5–2. Combine with the plate's camera
 * move, StoryPeople, pills, YearBadge, WordPop.
 */
export const PlateFx: React.FC<{t: number; kind: 'confetti' | 'snow' | 'smoke' | 'dust' | 'embers' | 'rays' | 'rain'; density?: number; seed?: number; color?: string}> = ({t, kind, density = 1, seed = 1, color}) => {
  const R = (i: number) => rand(i * 9.13 + seed * 31.7);
  if (kind === 'rays') {
    return (
      <g style={{mixBlendMode: 'screen'}}>
        {[0, 1, 2, 3].map((i) => {
          const x = 260 + i * 420 + Math.sin(t * 0.25 + i) * 60, w = 120 + R(i) * 120;
          return <path key={i} d={`M${x} -40 L${x + w} -40 L${x + w + 380} ${H + 40} L${x + 260} ${H + 40} Z`} fill={color ?? '#FFE8B0'} opacity={0.07 + 0.05 * Math.sin(t * 0.7 + i * 1.7)} />;
        })}
      </g>
    );
  }
  const n = Math.round({confetti: 70, snow: 90, smoke: 14, dust: 60, embers: 40, rain: 120}[kind] * density);
  const pal = ['#FF5A7A', '#FFC928', '#5CF2FF', '#7CF29A', '#B98BFF', '#FF9A3D'];
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const a = R(i), b = R(i + 500), c = R(i + 900);
        if (kind === 'confetti') {
          const y = ((b * H + t * (120 + 80 * a)) % (H + 80)) - 40, x = (a * W + Math.sin(t * (1 + c) + i) * 40) % W;
          return <rect key={i} x={x} y={y} width={10 + 6 * c} height={5 + 3 * a} rx={2} fill={color ?? pal[i % pal.length]} transform={`rotate(${(t * 160 * (c - 0.5) + i * 37) % 360} ${x} ${y})`} opacity={0.9} />;
        }
        if (kind === 'snow') {
          const y = ((b * H + t * (40 + 50 * a)) % (H + 40)) - 20, x = (a * W + Math.sin(t * 0.8 + i) * 30) % W;
          return <circle key={i} cx={x} cy={y} r={2 + 4 * c} fill={color ?? '#FFFFFF'} opacity={0.55 + 0.4 * c} />;
        }
        if (kind === 'smoke') {
          const life = (t * 0.12 + a) % 1, x = 200 + b * (W - 400) + life * 120 * (c - 0.3), y = H * (0.75 - life * 0.9);
          return <circle key={i} cx={x} cy={y} r={60 + life * 220} fill={color ?? '#E9E4F2'} opacity={0.16 * (1 - life)} />;
        }
        if (kind === 'dust') {
          const x = (a * W + t * 12 * (c - 0.5) + Math.sin(t * 0.6 + i) * 20 + W) % W, y = (b * H + Math.cos(t * 0.5 + i) * 20 + H) % H;
          return <circle key={i} cx={x} cy={y} r={1.5 + 2.5 * c} fill={color ?? '#FFF1C8'} opacity={0.25 + 0.5 * Math.max(0, Math.sin(t * (1 + c) + i))} />;
        }
        if (kind === 'embers') {
          const life = (t * (0.2 + 0.15 * c) + a) % 1, x = b * W + Math.sin(t * 2 + i) * 24, y = H * (1 - life);
          return <circle key={i} cx={x} cy={y} r={2 + 3 * c} fill={color ?? '#FFB347'} opacity={(1 - life) * 0.9} />;
        }
        const y = ((b * H + t * 900) % (H + 60)) - 30, x = a * W - (t * 120) % 40;
        return <line key={i} x1={x} y1={y} x2={x - 8} y2={y + 26} stroke={color ?? '#BFD6FF'} strokeWidth={2} opacity={0.35} />;
      })}
    </g>
  );
};
