// NIGHT WORLDS — the story backdrops of the AZTIKA look (copied from references/universe-claude, STYLE-BIBLE §3):
// SunsetWorld (time jumps/history, 0:40) · PaperMap + MapShape/Flag/PriceTag/Route (geography, 3:16) · ScienceWorld +
// HoloRing (body/science, 0:21.8) · NightCity (money/cities, 4:18) · RoomWorld (mini-stories, 0:46) · StoryPerson
// (faceless round head + ONE hat + gold rim, 0:46). All in screen coordinates — use inside <NightScreen>.
import React from 'react';
import {clamp01, rand} from './anim';
import {H, W} from './theme';
import {uid} from './stage';
import {N, nightFont, textWidth} from './night';
import {isAr} from './lang';

const WEIGHT = () => (isAr() ? 800 : 900);
const OUT = '#14101C'; // the thick dark outline of the flat world objects

// ─────────────────────────────── SUNSET (0:40.6): orange sky, big soft rays from a low sun, clouds, plum skyline
export type Skyline = 'town' | 'city' | 'pyramids' | 'desert';
const skylinePath = (kind: Skyline, base: number, seed: number, tall: number) => {
  let d = `M0 ${H} L0 ${base}`;
  let x = 0;
  let i = 0;
  while (x < W + 60) {
    const r = rand(seed + i++);
    if (kind === 'pyramids') {
      const w = 260 + r * 280, h = (0.5 + r * 0.8) * tall;
      d += ` L${x} ${base} L${x + w / 2} ${base - h} L${x + w} ${base}`;
      x += w + 40 + rand(seed + i) * 160;
    } else if (kind === 'desert') {
      const w = 380 + r * 400, h = (0.15 + r * 0.25) * tall;
      d += ` Q${x + w / 2} ${base - h * 2} ${x + w} ${base}`;
      x += w;
    } else {
      const w = (kind === 'city' ? 70 : 90) + r * 110, h = (kind === 'city' ? 0.6 + r * 1.4 : 0.35 + r * 0.6) * tall;
      const roof = kind === 'town' && r > 0.3 ? w * 0.35 : 0;
      d += ` L${x} ${base - h}` + (roof ? ` L${x + w / 2} ${base - h - roof} L${x + w} ${base - h}` : ` L${x + w} ${base - h}`) + ` L${x + w} ${base}`;
      x += w + (rand(seed + i) > 0.7 ? 20 : 0);
    }
  }
  return d + ` L${W} ${H} Z`;
};

export const SunsetWorld: React.FC<{t: number; id: string; skyline?: Skyline; sunX?: number; sunY?: number}> = ({t, id, skyline = 'town', sunX = 1390, sunY = 530}) => {
  // measured from 0:40.6: warm orange around the sun → darker brown corners; small houses low in the frame (rooftops
  // ~630–760), a lighter back row + a dark plum front row, flat dark plum ground below ~775.
  const g = uid('nsun', id);
  const a0 = t * 0.035;
  return (
    <g>
      <defs>
        <radialGradient id={g} cx={sunX / W} cy={sunY / H} r="1">
          <stop offset="0" stopColor="#FFD58A" />
          <stop offset="0.3" stopColor="#F7A757" />
          <stop offset="0.75" stopColor="#D97A45" />
          <stop offset="1" stopColor="#B9643F" />
        </radialGradient>
        <radialGradient id={g + 'v'} cx="0.55" cy="0.55" r="0.8">
          <stop offset="0.5" stopColor="#3A1E10" stopOpacity="0" />
          <stop offset="1" stopColor="#3A1E10" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={g + 'f'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#56263F" />
          <stop offset="1" stopColor="#310D21" />
        </linearGradient>
        <filter id={g + 'b'} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={34} />
        </filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      {Array.from({length: 18}, (_, i) => {
        const a = a0 + (i * Math.PI) / 9, b = a + Math.PI / 20, R = 2600;
        return <path key={i} d={`M${sunX} ${sunY} L${sunX + Math.cos(a) * R} ${sunY + Math.sin(a) * R} L${sunX + Math.cos(b) * R} ${sunY + Math.sin(b) * R}Z`} fill="#FFF0B8" opacity={0.32} />;
      })}
      <circle cx={sunX} cy={sunY} r={170} fill="#FFF3C0" opacity={0.55} filter={`url(#${g}b)`} />
      <circle cx={sunX} cy={sunY} r={90} fill="#FFF5CC" />
      {[[700, 95, 1], [1330, 105, 0.85], [1050, 225, 0.95], [40, 45, 0.6]].map(([cx, cy, sc], i) => {
        const x = ((cx + t * 10 * (1 + i * 0.3)) % (W + 400)) - 200;
        return (
          <g key={i} transform={`translate(${x} ${cy}) scale(${sc})`} opacity={0.4}>
            <path d="M-170 40 Q-170 0 -120 0 Q-110 -55 -45 -55 Q0 -95 60 -60 Q120 -70 130 -10 Q175 -5 170 40 Z" fill="#FFF6E6" />
          </g>
        );
      })}
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g}v)`} />
      <path d={skylinePath(skyline, 715, 11, 125)} fill="#A85A63" opacity={0.6} />
      <path d={skylinePath(skyline, 778, 29, 95)} fill="#56263F" />
      <rect x={0} y={776} width={W} height={H - 776} fill={`url(#${g}f)`} />
    </g>
  );
};

// ─────────────────────────────── PAPER MAP (3:16): parchment + vignette + little "~" waves; chunky shapes with thick outline
export const PaperMap: React.FC<{t: number; id: string}> = ({t, id}) => {
  const g = uid('npap', id);
  return (
    <g>
      <defs>
        <radialGradient id={g} cx="0.5" cy="0.45" r="0.8">
          <stop offset="0" stopColor="#F1E2B4" />
          <stop offset="0.6" stopColor="#D9C394" />
          <stop offset="1" stopColor="#A69678" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      {Array.from({length: 34}, (_, i) => {
        const x = rand(i * 3 + 1) * W, y = rand(i * 7 + 2) * H + Math.sin(t * 0.8 + i) * 3;
        return <path key={i} d={`M${x} ${y} q12 -8 24 0 t24 0 t24 0`} fill="none" stroke="#8C7A55" strokeWidth={3} strokeLinecap="round" opacity={0.3} />;
      })}
    </g>
  );
};
/** A region on the paper map: flat fill, thick dark outline; dashed = the moving border / disputed zone. p = draw-in 0..1 (fade). */
export const MapShape: React.FC<{d: string; fill: string; dashed?: boolean; p?: number; outline?: number}> = ({d, fill, dashed, p = 1, outline = 9}) =>
  p <= 0 ? null : (
    <g opacity={clamp01(p * 2)}>
      <path d={d} fill={fill} stroke={dashed ? '#FFFFFF' : OUT} strokeWidth={dashed ? 5 : outline} strokeLinejoin="round" strokeDasharray={dashed ? '16 10' : undefined} />
    </g>
  );
/** Flag on a pole planted at (x, y = pole foot): vertical stripes (France ['#2340A8','#FFFFFF','#D21034']) or horizontal. */
export const Flag: React.FC<{x: number; y: number; colors: string[]; horizontal?: boolean; size?: number; t?: number; at?: number}> = ({x, y, colors, horizontal, size = 130, t = 1, at = 0}) => {
  const p = clamp01((t - at) / 0.3);
  if (p <= 0) return null;
  const pole = size * 2.1, fw = size, fh = size * 0.62, top = y - pole * p;
  const n = colors.length;
  const wave = Math.sin(t * 4) * 3;
  return (
    <g>
      <rect x={x - 4} y={top} width={8} height={y - top} rx={4} fill="#E9E6E0" stroke={OUT} strokeWidth={2} />
      <circle cx={x} cy={top} r={8} fill="#F5C223" />
      <g transform={`translate(${x + 4} ${top + 8}) skewY(${wave * 0.5})`}>
        {colors.map((c, i) => (horizontal ? <rect key={i} x={0} y={(i * fh) / n} width={fw} height={fh / n + 0.5} fill={c} /> : <rect key={i} x={(i * fw) / n} y={0} width={fw / n + 0.5} height={fh} fill={c} />))}
        <rect x={0} y={0} width={fw} height={fh} fill="none" stroke={OUT} strokeWidth={3} />
      </g>
    </g>
  );
};
/** Price tag (3:25 «15 مليون $»): green tag with a hole, thick outline, heavy dark text. x,y = centre. */
export const PriceTag: React.FC<{text: string; x: number; y: number; size?: number; color?: string; p?: number}> = ({text, x, y, size = 64, color = '#2EE88B', p = 1}) => {
  if (p <= 0) return null;
  const w = textWidth(text, size) + size * 1.9, h = size * 1.75;
  const s = 0.4 + 0.6 * clamp01(p) + Math.sin(clamp01(p) * Math.PI) * 0.12;
  const n = h * 0.42;
  return (
    <g transform={`translate(${x} ${y}) rotate(-3) scale(${s})`}>
      <path d={`M${-w / 2 + n} ${-h / 2} H${w / 2 - 14} Q${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 14} V${h / 2 - 14} Q${w / 2} ${h / 2} ${w / 2 - 14} ${h / 2} H${-w / 2 + n} L${-w / 2} 0 Z`} fill={color} stroke={OUT} strokeWidth={size * 0.12} strokeLinejoin="round" />
      <circle cx={-w / 2 + n * 0.75} cy={0} r={size * 0.12} fill={OUT} />
      <text x={size * 0.35} y={size * 0.04} fontSize={size} fontFamily={nightFont()} fontWeight={WEIGHT()} textAnchor="middle" dominantBaseline="central" fill="#0A1A12" stroke="#0A1A12" strokeWidth={size * 0.03} paintOrder="stroke">
        {text}
      </text>
    </g>
  );
};
/** Dotted route on the map, drawn on from start to end (p 0..1). */
export const Route: React.FC<{d: string; p: number; id: string; color?: string}> = ({d, p, id, color = '#C2272D'}) => {
  if (p <= 0) return null;
  const m = uid('nrt', id);
  return (
    <g>
      <defs>
        <mask id={m} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={30} strokeLinecap="round" pathLength={1} strokeDasharray={`${clamp01(p)} 1`} />
        </mask>
      </defs>
      <path d={d} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeDasharray="1 18" mask={`url(#${m})`} />
    </g>
  );
};

// ─────────────────────────────── SCIENCE (0:21.8): dark teal + faint square grid + cyan bokeh + holo ring under the subject
export const ScienceWorld: React.FC<{t: number; id: string}> = ({t, id}) => {
  const g = uid('nsci', id);
  return (
    <g>
      <defs>
        <radialGradient id={g} cx="0.4" cy="0.5" r="0.9">
          <stop offset="0" stopColor="#11495B" />
          <stop offset="0.55" stopColor="#0B3242" />
          <stop offset="1" stopColor="#02131F" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      <g stroke="#5FC8E0" strokeWidth={1.5} opacity={0.13}>
        {Array.from({length: 25}, (_, i) => <line key={'v' + i} x1={i * 80} y1={0} x2={i * 80} y2={H} />)}
        {Array.from({length: 14}, (_, i) => <line key={'h' + i} x1={0} y1={i * 80} x2={W} y2={i * 80} />)}
      </g>
      {Array.from({length: 18}, (_, i) => (
        <circle key={i} cx={rand(i * 5 + 3) * W} cy={(rand(i * 9 + 1) * H - t * 8 * (1 + rand(i))) % H + (t * 8 > 0 ? 0 : 0)} r={3 + rand(i) * 5} fill="#7FE6FF" opacity={0.15 + 0.2 * (0.5 + 0.5 * Math.sin(t + i))} />
      ))}
    </g>
  );
};
/** Holographic ring platform under a subject (0:21.8): two glowing ellipses + a slow sweeping arc. */
export const HoloRing: React.FC<{x: number; y: number; rx?: number; t: number}> = ({x, y, rx = 380, t}) => (
  <g>
    <ellipse cx={x} cy={y} rx={rx} ry={rx * 0.2} fill="none" stroke="#57D9FA" strokeWidth={3} opacity={0.45} />
    <ellipse cx={x} cy={y} rx={rx * 0.62} ry={rx * 0.12} fill="none" stroke="#57D9FA" strokeWidth={4} opacity={0.6} />
    <ellipse cx={x} cy={y} rx={rx * 0.62} ry={rx * 0.12} fill="none" stroke="#BFF3FF" strokeWidth={6} strokeDasharray={`${rx * 0.5} ${rx * 4}`} strokeDashoffset={-t * 300} opacity={0.7} />
  </g>
);

// ─────────────────────────────── NIGHT CITY (4:18): navy sky + stars, 3 layers of buildings with warm windows
const Building: React.FC<{x: number; w: number; h: number; base: number; fill: string; win: string; off: string; outline?: boolean; seed: number; t: number; cols?: number}> = ({
  x, w, h, base, fill, win, off, outline, seed, t, cols,
}) => {
  const top = base - h;
  const c = cols ?? Math.max(2, Math.round(w / 52));
  const ww = w / (c * 1.7 + 0.7), wh = ww * 1.25;
  const rows = Math.floor((h - ww * 1.4) / (wh * 1.75));
  return (
    <g>
      <rect x={x} y={top} width={w} height={h + 40} rx={outline ? 10 : 0} fill={fill} stroke={outline ? '#0B0E2A' : 'none'} strokeWidth={outline ? 8 : 0} />
      {Array.from({length: rows}, (_, r) =>
        Array.from({length: c}, (_, k) => {
          const id = seed * 131 + r * 17 + k;
          const lit = rand(id) > 0.32 !== (Math.sin(t * 0.7 + id) > 0.985);
          if (!lit && !outline && rand(id + 1) > 0.5) return null;
          return <rect key={`${r}-${k}`} x={x + ww * 0.7 + k * ww * 1.7} y={top + ww * 1.4 + r * wh * 1.75} width={ww} height={wh} rx={2} fill={lit ? win : off} />;
        })
      )}
    </g>
  );
};
export const NightCity: React.FC<{t: number; id: string; base?: number}> = ({t, id, base = 1020}) => {
  const g = uid('ncty', id);
  const layer = (n: number, seed: number, minH: number, maxH: number, wMin: number, wMax: number, fill: string, win: string, off: string, outline: boolean, b: number) => {
    const out: React.ReactNode[] = [];
    let x = -30, i = 0;
    while (x < W && i < n) {
      const w = wMin + rand(seed + i) * (wMax - wMin), h = minH + rand(seed + i + 50) * (maxH - minH);
      out.push(<Building key={i} x={x} w={w} h={h} base={b} fill={fill} win={win} off={off} outline={outline} seed={seed + i} t={t} />);
      x += w + (outline ? 50 + rand(seed + i + 9) * 70 : 6);
      i++;
    }
    return out;
  };
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#11143E" />
          <stop offset="1" stopColor="#262C6E" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      {Array.from({length: 40}, (_, i) => <circle key={i} cx={rand(i * 7) * W} cy={rand(i * 3 + 1) * 380} r={1 + rand(i) * 1.5} fill="#FFFFFF" opacity={0.4 + 0.4 * Math.sin(t * 2 + i)} />)}
      {layer(26, 300, 380, 760, 110, 170, '#262B70', '#A59A6A', '#2F3580', false, 900)}
      {layer(20, 500, 260, 520, 120, 190, '#2E3482', '#E9CF7C', '#3A4194', false, 960)}
      {layer(9, 700, 320, 600, 150, 175, '#3B44A6', '#F2D27A', '#4A53B5', true, base)}
      <rect x={0} y={base} width={W} height={H - base} fill="#0E1030" />
    </g>
  );
};

// ─────────────────────────────── ROOM (0:46): warm brown wall, plank floor, window with a sunset + a light shaft, dust
export const RoomWorld: React.FC<{t: number; id: string; winX?: number; winY?: number}> = ({t, id, winX = 1370, winY = 95}) => {
  const g = uid('nroom', id);
  const ww = 420, wh = 465;
  return (
    <g>
      <defs>
        <radialGradient id={g} cx="0.35" cy="0.55" r="0.9">
          <stop offset="0" stopColor="#8A5228" />
          <stop offset="0.6" stopColor="#66381F" />
          <stop offset="1" stopColor="#3E2411" />
        </radialGradient>
        <linearGradient id={g + 's'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFC37A" />
          <stop offset="1" stopColor="#E07A4A" />
        </linearGradient>
        <clipPath id={g + 'c'}>
          <rect x={winX} y={winY} width={ww} height={wh} rx={22} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      <rect x={0} y={870} width={W} height={H - 870} fill="#5A3418" />
      {Array.from({length: 9}, (_, i) => <line key={i} x1={i * 240 + 60} y1={870} x2={i * 240 - 40} y2={H} stroke="#3E2411" strokeWidth={3} opacity={0.5} />)}
      <line x1={0} y1={870} x2={W} y2={870} stroke="#3E2411" strokeWidth={6} />
      <path d={`M${winX} ${winY + 20} L${winX + ww - 10} ${winY + wh} L${winX + 30} 900 L${winX - 650} 900 Z`} fill="#FFD9A0" opacity={0.12} />
      <g clipPath={`url(#${g}c)`}>
        <rect x={winX} y={winY} width={ww} height={wh} fill={`url(#${g}s)`} />
        <circle cx={winX + ww * 0.62} cy={winY + wh * 0.55} r={60} fill="#FFF0C8" opacity={0.8} />
        <path d={`M${winX} ${winY + wh} V${winY + wh * 0.78} h70 v-40 h60 v50 h50 v-160 l22 -40 l22 40 v150 h60 v-60 h60 v70 h80 V${winY + wh} Z`} fill="#7A3048" />
      </g>
      <rect x={winX} y={winY} width={ww} height={wh} rx={22} fill="none" stroke="#1E1210" strokeWidth={16} />
      <line x1={winX + ww / 2} y1={winY} x2={winX + ww / 2} y2={winY + wh} stroke="#1E1210" strokeWidth={12} />
      <line x1={winX} y1={winY + wh / 2} x2={winX + ww} y2={winY + wh / 2} stroke="#1E1210" strokeWidth={12} />
      {Array.from({length: 14}, (_, i) => (
        <circle key={i} cx={(rand(i * 4) * W + t * 6) % W} cy={(rand(i * 6 + 2) * 800 + Math.sin(t * 0.6 + i) * 20) % 860} r={2 + rand(i) * 3} fill="#FFE2B0" opacity={0.25} />
      ))}
    </g>
  );
};

// ─────────────────────────────── STORY PEOPLE (0:46): faceless round dark head, ONE identifying hat, flat body, gold rim
export type StoryHat = 'none' | 'beret' | 'top' | 'helmet' | 'bicorne' | 'crown' | 'turban' | 'cap' | 'feather';
export const StoryPerson: React.FC<{x: number; y: number; s?: number; body?: string; hat?: StoryHat; hatColor?: string; pose?: 'idle' | 'point' | 'hold' | 'up'; flip?: boolean; t?: number; id: string}> = ({
  x, y, s = 1, body = '#7A3FC8', hat = 'none', hatColor = '#3A1A6E', pose = 'idle', flip, t = 0, id,
}) => {
  const f = uid('nsp', id);
  const breathe = Math.sin(t * 2 + x) * 3;
  const head = -330 + breathe, r = 78;
  const arm = (side: 1 | -1) => {
    const sx = side * 70, sy = -210 + breathe;
    const out = pose === 'point' && side === 1 ? [sx + 150, sy - 10] : pose === 'up' && side === 1 ? [sx + 60, sy - 150] : pose === 'hold' ? [sx * 0.6, sy + 60] : [sx + side * 18, sy + 120];
    return (
      <g key={side}>
        <path d={`M${sx} ${sy} L${out[0]} ${out[1]}`} stroke={OUT} strokeWidth={34} strokeLinecap="round" />
        <path d={`M${sx} ${sy} L${out[0]} ${out[1]}`} stroke={body} strokeWidth={22} strokeLinecap="round" />
        <circle cx={out[0]} cy={out[1]} r={20} fill="#16121F" stroke="#FFC928" strokeWidth={5} />
      </g>
    );
  };
  const hats: Record<StoryHat, React.ReactNode> = {
    none: null,
    beret: <path d={`M${-r - 6} ${head - r * 0.45} Q${-r * 0.6} ${head - r * 1.35} ${r * 0.5} ${head - r * 1.15} Q${r + 14} ${head - r * 0.9} ${r} ${head - r * 0.45} Z`} fill={hatColor} stroke={OUT} strokeWidth={8} />,
    top: (
      <g>
        <rect x={-r * 0.7} y={head - r * 2.05} width={r * 1.4} height={r * 1.3} rx={8} fill={hatColor} stroke={OUT} strokeWidth={8} />
        <rect x={-r * 0.7} y={head - r * 1.05} width={r * 1.4} height={r * 0.2} fill="#F5D27A" />
        <rect x={-r * 1.05} y={head - r * 0.88} width={r * 2.1} height={r * 0.24} rx={8} fill={hatColor} stroke={OUT} strokeWidth={8} />
      </g>
    ),
    helmet: (
      <g>
        <path d={`M${-r * 1.02} ${head - r * 0.25} Q${-r} ${head - r * 1.25} 0 ${head - r * 1.25} Q${r} ${head - r * 1.25} ${r * 1.02} ${head - r * 0.25} Z`} fill={hatColor} stroke={OUT} strokeWidth={8} />
        <rect x={-r * 1.2} y={head - r * 0.35} width={r * 2.4} height={r * 0.2} rx={6} fill={hatColor} stroke={OUT} strokeWidth={6} />
        <circle cx={0} cy={head - r * 0.8} r={r * 0.18} fill="#FFF3C0" stroke={OUT} strokeWidth={4} />
      </g>
    ),
    bicorne: <path d={`M${-r * 1.4} ${head - r * 0.55} Q0 ${head - r * 1.9} ${r * 1.4} ${head - r * 0.55} Q0 ${head - r * 0.85} ${-r * 1.4} ${head - r * 0.55} Z`} fill={hatColor} stroke={OUT} strokeWidth={8} />,
    crown: <path d={`M${-r * 0.75} ${head - r * 0.8} L${-r * 0.8} ${head - r * 1.55} L${-r * 0.35} ${head - r * 1.15} L0 ${head - r * 1.7} L${r * 0.35} ${head - r * 1.15} L${r * 0.8} ${head - r * 1.55} L${r * 0.75} ${head - r * 0.8} Z`} fill="#F5C223" stroke={OUT} strokeWidth={8} strokeLinejoin="round" />,
    turban: <path d={`M${-r * 1.02} ${head - r * 0.35} Q${-r * 1.15} ${head - r * 1.45} 0 ${head - r * 1.4} Q${r * 1.15} ${head - r * 1.45} ${r * 1.02} ${head - r * 0.35} Q0 ${head - r * 0.7} ${-r * 1.02} ${head - r * 0.35} Z`} fill={hatColor} stroke={OUT} strokeWidth={8} />,
    cap: (
      <g>
        <path d={`M${-r} ${head - r * 0.4} Q${-r} ${head - r * 1.2} 0 ${head - r * 1.2} Q${r} ${head - r * 1.2} ${r} ${head - r * 0.4} Z`} fill={hatColor} stroke={OUT} strokeWidth={8} />
        <path d={`M${r * 0.2} ${head - r * 0.45} L${r * 1.5} ${head - r * 0.35}`} stroke={OUT} strokeWidth={22} strokeLinecap="round" />
      </g>
    ),
    feather: (
      <g>
        {['#17B07A', '#E2552D', '#F5B82E', '#2FD3C8', '#17B07A'].map((c, i) => (
          <ellipse key={i} cx={0} cy={head - r * 1.5} rx={14} ry={r * 0.7} fill={c} stroke={OUT} strokeWidth={5} transform={`rotate(${-50 + i * 25} 0 ${head - r * 0.8})`} />
        ))}
        <rect x={-r} y={head - r * 0.95} width={r * 2} height={r * 0.32} rx={6} fill="#F5C223" stroke={OUT} strokeWidth={6} />
      </g>
    ),
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * s} ${s})`}>
      <defs>
        <filter id={f} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
      </defs>
      <ellipse cx={0} cy={4} rx={95} ry={14} fill="#000" opacity={0.25} />
      <rect x={-40} y={-110} width={30} height={100} rx={12} fill="#1A1838" />
      <rect x={10} y={-110} width={30} height={100} rx={12} fill="#1A1838" />
      <rect x={-52} y={-18} width={48} height={24} rx={12} fill="#FFFFFF" stroke={OUT} strokeWidth={5} />
      <rect x={4} y={-18} width={48} height={24} rx={12} fill="#FFFFFF" stroke={OUT} strokeWidth={5} />
      {arm(-1)}
      <path d={`M-78 ${-90 + breathe} Q-90 ${-250 + breathe} -40 ${-250 + breathe} H40 Q90 ${-250 + breathe} 78 ${-90 + breathe} Q0 ${-70 + breathe} -78 ${-90 + breathe} Z`} fill={body} stroke={OUT} strokeWidth={9} strokeLinejoin="round" />
      <rect x={-34} y={-235 + breathe} width={16} height={90} rx={8} fill="#FFFFFF" opacity={0.18} />
      {arm(1)}
      <circle cx={0} cy={head} r={r + 10} fill="#FFC928" opacity={0.45} filter={`url(#${f})`} />
      <circle cx={0} cy={head} r={r} fill="#16121F" stroke="#FFC928" strokeWidth={8} />
      {hats[hat]}
    </g>
  );
};

/** Little props used in the reference's rooms. */
export const MoneyBag: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-70 0 Q-95 -70 -30 -100 L-45 -130 Q0 -110 45 -130 L30 -100 Q95 -70 70 0 Z" fill="#D9C08A" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
    <text x={0} y={-45} fontSize={64} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#1F8A4C" stroke="none">$</text>
  </g>
);
export const _N = N; // (palette re-export for builders that import only worlds)
