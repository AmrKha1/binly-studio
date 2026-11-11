// NIGHT WORLDS — the story backdrops of the AZTIKA look (copied from references/universe-claude, STYLE-BIBLE §3):
// SunsetWorld (time jumps/history, 0:40) · PaperMap + MapShape/Flag/PriceTag/Route (geography, 3:16) · ScienceWorld +
// HoloRing (body/science, 0:21.8) · NightCity (money/cities, 4:18) · RoomWorld (mini-stories, 0:46) · StoryPerson
// (faceless round head + ONE hat + gold rim, 0:46). All in screen coordinates — use inside <NightScreen>.
import React from 'react';
import {clamp01, mixHex, phaseOf, rand} from './anim';
import {H, W} from './theme';
import {uid} from './stage';
import {N, nightFont, textWidth} from './night';
import {isAr} from './lang';
import {cueSfx} from './sfx';

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
        <radialGradient id={g + '__v'} cx="0.55" cy="0.55" r="0.8">
          <stop offset="0.5" stopColor="#3A1E10" stopOpacity="0" />
          <stop offset="1" stopColor="#3A1E10" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={g + '__f'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#56263F" />
          <stop offset="1" stopColor="#310D21" />
        </linearGradient>
        <filter id={g + '__b'} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={34} />
        </filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      {Array.from({length: 18}, (_, i) => {
        const a = a0 + (i * Math.PI) / 9, b = a + Math.PI / 20, R = 2600;
        return <path key={i} d={`M${sunX} ${sunY} L${sunX + Math.cos(a) * R} ${sunY + Math.sin(a) * R} L${sunX + Math.cos(b) * R} ${sunY + Math.sin(b) * R}Z`} fill="#FFF0B8" opacity={0.32} />;
      })}
      <circle cx={sunX} cy={sunY} r={170} fill="#FFF3C0" opacity={0.55} filter={`url(#${g}__b)`} />
      <circle cx={sunX} cy={sunY} r={90} fill="#FFF5CC" />
      {[[700, 95, 1], [1330, 105, 0.85], [1050, 225, 0.95], [40, 45, 0.6]].map(([cx, cy, sc], i) => {
        const x = ((cx + t * 10 * (1 + i * 0.3)) % (W + 400)) - 200;
        return (
          <g key={i} transform={`translate(${x} ${cy}) scale(${sc})`} opacity={0.4}>
            <path d="M-170 40 Q-170 0 -120 0 Q-110 -55 -45 -55 Q0 -95 60 -60 Q120 -70 130 -10 Q175 -5 170 40 Z" fill="#FFF6E6" />
          </g>
        );
      })}
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g}__v)`} />
      <path d={skylinePath(skyline, 715, 11, 125)} fill="#A85A63" opacity={0.6} />
      <path d={skylinePath(skyline, 778, 29, 95)} fill="#56263F" />
      <rect x={0} y={776} width={W} height={H - 776} fill={`url(#${g}__f)`} />
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
  cueSfx('swish', `flag-${x}-${at}`, t >= at && t < at + 0.3, x, {gain: 0.45, at});
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
  cueSfx('pop', `tag-${text}`, p > 0 && p < 1, x, {gain: 0.6, hit: 0.125});
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
        <linearGradient id={g + '__s'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFC37A" />
          <stop offset="1" stopColor="#E07A4A" />
        </linearGradient>
        <clipPath id={g + '__c'}>
          <rect x={winX} y={winY} width={ww} height={wh} rx={22} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} />
      <rect x={0} y={870} width={W} height={H - 870} fill="#5A3418" />
      {Array.from({length: 9}, (_, i) => <line key={i} x1={i * 240 + 60} y1={870} x2={i * 240 - 40} y2={H} stroke="#3E2411" strokeWidth={3} opacity={0.5} />)}
      <line x1={0} y1={870} x2={W} y2={870} stroke="#3E2411" strokeWidth={6} />
      <path d={`M${winX} ${winY + 20} L${winX + ww - 10} ${winY + wh} L${winX + 30} 900 L${winX - 650} 900 Z`} fill="#FFD9A0" opacity={0.12} />
      <g clipPath={`url(#${g}__c)`}>
        <rect x={winX} y={winY} width={ww} height={wh} fill={`url(#${g}__s)`} />
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

// ─────────────────────────────── STORY PEOPLE (0:46 · 3:12 · 3:45): faceless round dark head with a coloured RIM (= the
// side of the story: gold France vs cyan America at 3:12), ONE identifying headwear, flat rounded torso with ONE light
// stripe, thick round arms, small dark round hands rimmed like the head, white capsule shoes. A general cast:
// `role` sets everything at once (explicit props override it); hat · outfit · prop · pose · hair · beard · glasses are dials.
export type StoryHat =
  | 'none' | 'beret' | 'top' | 'helmet' | 'bicorne' | 'crown' | 'turban' | 'cap' | 'feather' | 'warbonnet'
  | 'tarboush' | 'ghutra' | 'hijab' | 'hood' | 'officer' | 'hardhat' | 'judge'
  | 'nemes' | 'knight' | 'army' | 'tricorn' | 'safari' | 'sailor' | 'aviator' | 'space' | 'nurse' | 'chef' | 'straw' | 'grad' | 'headband' | 'fedora';
export type StoryOutfit =
  | 'plain' | 'suit' | 'shirt' | 'hoodie' | 'thobe' | 'bisht' | 'labcoat' | 'uniform' | 'dress' | 'overalls'
  | 'robe' | 'pharaoh' | 'armor' | 'vest' | 'sailor' | 'spacesuit' | 'scrubs' | 'chef' | 'gown' | 'sport' | 'doctor';
export type StoryProp =
  | 'none' | 'laptop' | 'phone' | 'harddrive' | 'pizza' | 'document' | 'pen' | 'briefcase' | 'coin' | 'gavel' | 'scroll' | 'money' | 'sign'
  | 'sword' | 'wrench' | 'pickaxe' | 'pitchfork' | 'pan' | 'book' | 'microphone' | 'brush' | 'guitar' | 'ball' | 'map' | 'clipboard' | 'flask' | 'cane';
export type StoryPose = 'idle' | 'point' | 'hold' | 'up' | 'talk' | 'shock' | 'think' | 'cheer' | 'walk';
export type StoryHair = 'none' | 'short' | 'long' | 'bun' | 'bald';
export type StoryRole =
  | 'king' | 'queen' | 'prince' | 'sultan' | 'sheikh' | 'arabMan' | 'arabWoman' | 'pharaoh' | 'knight' | 'soldier' | 'officer' | 'general'
  | 'police' | 'pirate' | 'explorer' | 'sailor' | 'pilot' | 'astronaut' | 'doctor' | 'nurse' | 'scientist' | 'engineer' | 'programmer'
  | 'hacker' | 'worker' | 'farmer' | 'miner' | 'chef' | 'businessman' | 'banker' | 'lawyer' | 'judge' | 'politician' | 'journalist'
  | 'teacher' | 'student' | 'painter' | 'musician' | 'athlete' | 'oldMan' | 'child' | 'woman' | 'man';

type StoryLook = {
  hat?: StoryHat; hatColor?: string; outfit?: StoryOutfit; body?: string; tieColor?: string; prop?: StoryProp; pose?: StoryPose;
  glasses?: boolean; hair?: StoryHair; hairColor?: string; beard?: string; rim?: string; medals?: boolean; sMul?: number;
};
const SP_SKIN = '#16121F'; // the faceless dark head / hands
const SP_WHITE = '#F4F1EA';
const SP_GOLD = '#FFC928';
/** One word → a whole character (explicit StoryPerson props win). */
export const STORY_ROLES: Record<StoryRole, StoryLook> = {
  king: {hat: 'crown', outfit: 'robe', body: '#C8283A'},
  queen: {hat: 'crown', hair: 'long', hairColor: '#7A4A2A', outfit: 'robe', body: '#7A3FC8'},
  prince: {hat: 'crown', outfit: 'uniform', body: '#2E5EAA'},
  sultan: {hat: 'turban', hatColor: SP_WHITE, outfit: 'robe', body: '#1F8A6A', beard: '#5A5068'},
  sheikh: {hat: 'ghutra', hatColor: '#D2363A', outfit: 'bisht'},
  arabMan: {hat: 'ghutra', hatColor: SP_WHITE, outfit: 'thobe'},
  arabWoman: {hat: 'hijab', hatColor: '#3A2F55', outfit: 'dress', body: '#2E2640'},
  pharaoh: {hat: 'nemes', outfit: 'pharaoh'},
  knight: {hat: 'knight', outfit: 'armor', body: '#C8283A', prop: 'sword'},
  soldier: {hat: 'army', outfit: 'uniform', body: '#4E6B3A'},
  officer: {hat: 'officer', hatColor: '#4E6B3A', outfit: 'uniform', body: '#4E6B3A'},
  general: {hat: 'officer', hatColor: '#2B3A6B', outfit: 'uniform', body: '#2B3A6B', medals: true},
  police: {hat: 'officer', hatColor: '#1E2E5A', outfit: 'uniform', body: '#2F57A8'},
  pirate: {hat: 'tricorn', outfit: 'vest', body: SP_WHITE, prop: 'sword', beard: '#6A4A32'},
  explorer: {hat: 'safari', outfit: 'shirt', body: '#B98A4E', prop: 'map'},
  sailor: {hat: 'sailor', outfit: 'sailor'},
  pilot: {hat: 'aviator', outfit: 'shirt', body: '#8A5A34'},
  astronaut: {hat: 'space', outfit: 'spacesuit', rim: '#7FD8FF'},
  doctor: {outfit: 'doctor', body: '#3A8FD0', prop: 'clipboard'},
  nurse: {hat: 'nurse', outfit: 'scrubs', body: '#2FB3A6', hair: 'bun'},
  scientist: {outfit: 'labcoat', body: '#7A3FC8', glasses: true, prop: 'flask'},
  engineer: {hat: 'hardhat', hatColor: SP_WHITE, outfit: 'shirt', body: '#3A8FD0', prop: 'clipboard'},
  programmer: {outfit: 'shirt', body: '#2FB3A6', glasses: true, prop: 'laptop', pose: 'hold'},
  hacker: {hat: 'hood', outfit: 'hoodie', body: '#2A2438', prop: 'laptop', pose: 'hold', rim: '#FF5A60'},
  worker: {hat: 'hardhat', outfit: 'overalls', body: '#E0703A', prop: 'wrench'},
  farmer: {hat: 'straw', outfit: 'overalls', body: '#C8283A', prop: 'pitchfork'},
  miner: {hat: 'helmet', hatColor: SP_GOLD, outfit: 'overalls', body: '#8A5A34', prop: 'pickaxe'},
  chef: {hat: 'chef', outfit: 'chef', prop: 'pan'},
  businessman: {outfit: 'suit', body: '#2E3A5E', tieColor: '#D2363A', prop: 'briefcase'},
  banker: {hat: 'top', outfit: 'suit', body: '#3A3A4A', tieColor: SP_GOLD, prop: 'money'},
  lawyer: {outfit: 'suit', body: '#1E1A2A', tieColor: '#3A8FD0', glasses: true, prop: 'book'},
  judge: {hat: 'judge', outfit: 'gown', prop: 'gavel'},
  politician: {outfit: 'suit', body: '#2B3A6B', tieColor: '#D2363A', prop: 'microphone', pose: 'talk'},
  journalist: {hat: 'fedora', outfit: 'shirt', body: '#C9B48A', prop: 'microphone'},
  teacher: {outfit: 'shirt', body: '#7A4A8A', glasses: true, prop: 'book'},
  student: {hat: 'grad', outfit: 'hoodie', body: '#2FB3A6', prop: 'book'},
  painter: {hat: 'beret', hatColor: '#D2363A', outfit: 'shirt', body: '#3A6EA5', prop: 'brush'},
  musician: {outfit: 'vest', body: '#7A3FC8', prop: 'guitar', pose: 'hold'},
  athlete: {hat: 'headband', hatColor: SP_WHITE, outfit: 'sport', body: '#D2363A', prop: 'ball'},
  oldMan: {hair: 'bald', beard: '#E8E4DC', outfit: 'vest', body: '#8A6A5A', prop: 'cane'},
  child: {hair: 'short', hairColor: '#7A4A2A', outfit: 'shirt', body: '#F5B82E', sMul: 0.72},
  woman: {hair: 'long', hairColor: '#7A4A2A', outfit: 'dress', body: '#C0587E'},
  man: {hair: 'short', hairColor: '#3A2A22', outfit: 'plain', body: '#7A3FC8'},
};
const HAT_DEFAULT: Partial<Record<StoryHat, string>> = {
  top: '#1C1830', tarboush: '#C8283A', ghutra: SP_WHITE, hijab: '#3A6EA5', officer: '#2B3A6B', hardhat: SP_GOLD, judge: '#ECE8DE',
  feather: '#D2363A', nemes: '#F5C223', knight: '#A9B2C6', army: '#4E6B3A', tricorn: '#1C1830', safari: '#D9B878', sailor: SP_WHITE,
  aviator: '#7A4A2A', space: SP_WHITE, nurse: SP_WHITE, chef: SP_WHITE, straw: '#E8C46A', grad: '#1C1830', headband: SP_WHITE, fedora: '#5A4A3A',
};
const OUTFIT_BODY: Partial<Record<StoryOutfit, string>> = {
  suit: '#2E3A5E', shirt: '#3A8FD0', hoodie: '#5A6278', thobe: SP_WHITE, bisht: SP_WHITE, labcoat: '#3A8FD0', doctor: '#3A8FD0', uniform: '#2B3A6B',
  dress: '#C0587E', overalls: '#E0703A', robe: '#C8283A', pharaoh: '#2A2236', armor: '#C8283A', vest: SP_WHITE, sailor: SP_WHITE,
  spacesuit: SP_WHITE, scrubs: '#2FB3A6', chef: SP_WHITE, gown: '#1E1A2A', sport: '#D2363A',
};
const LONG: StoryOutfit[] = ['thobe', 'bisht', 'dress', 'robe', 'gown'];

/** A held object, drawn around its grip point (0,0) in the night flat style. */
const storyProp = (p: StoryProp, id: string, mirrored: boolean): React.ReactNode => {
  const o = {stroke: OUT, strokeLinejoin: 'round' as const};
  switch (p) {
    case 'laptop':
      return (
        <g {...o}>
          <rect x={-74} y={-104} width={148} height={96} rx={9} fill="#2A2F45" strokeWidth={7} />
          <rect x={-61} y={-93} width={122} height={73} rx={4} fill="#5FD3F5" stroke="none" />
          <rect x={-48} y={-80} width={58} height={9} rx={4} fill="#FFFFFF" opacity={0.75} stroke="none" />
          <rect x={-48} y={-63} width={84} height={9} rx={4} fill="#FFFFFF" opacity={0.5} stroke="none" />
          <rect x={-48} y={-46} width={40} height={9} rx={4} fill="#FFFFFF" opacity={0.5} stroke="none" />
          <path d="M-90 -9 H90 L78 8 H-78 Z" fill="#C9CEDC" strokeWidth={6} />
        </g>
      );
    case 'phone':
      return (
        <g {...o}>
          <rect x={-27} y={-50} width={54} height={100} rx={11} fill="#1E2236" strokeWidth={6} />
          <rect x={-19} y={-39} width={38} height={72} rx={4} fill="#5FD3F5" stroke="none" />
          <circle cx={0} cy={41} r={4} fill="#5A6078" stroke="none" />
        </g>
      );
    case 'harddrive':
      return (
        <g {...o}>
          <rect x={-62} y={-44} width={124} height={88} rx={12} fill="#8C93A8" strokeWidth={7} />
          <rect x={-62} y={-44} width={124} height={18} rx={9} fill="#B9C0D2" stroke="none" />
          <circle cx={-12} cy={6} r={26} fill="#C9CEDC" strokeWidth={5} />
          <circle cx={-12} cy={6} r={6} fill="#5A6078" stroke="none" />
          <circle cx={40} cy={28} r={7} fill="#3FE08A" strokeWidth={3} />
        </g>
      );
    case 'pizza':
      return (
        <g {...o}>
          <path d="M-98 -24 L-76 -56 H76 L98 -24 Z" fill="#E8B878" strokeWidth={7} />
          <rect x={-98} y={-24} width={196} height={28} rx={4} fill="#C98E4E" strokeWidth={7} />
          <ellipse cx={0} cy={-40} rx={26} ry={9} fill="#D9363A" strokeWidth={4} />
        </g>
      );
    case 'document':
      return (
        <g {...o}>
          <path d="M-48 -132 H28 L48 -112 V-6 H-48 Z" fill="#F7F3E8" strokeWidth={6} />
          <path d="M28 -132 V-112 H48" fill="#D9D2C0" strokeWidth={5} />
          {[-106, -88, -70, -52].map((yy, i) => <rect key={yy} x={-34} y={yy} width={i === 0 ? 46 : 68} height={7} rx={3} fill="#9A93A8" stroke="none" />)}
          <path d="M-30 -24 q8 -20 16 0 t16 0 t18 -8" fill="none" stroke="#2A5BD7" strokeWidth={5} strokeLinecap="round" />
        </g>
      );
    case 'pen':
      return (
        <g transform="rotate(-35)" {...o}>
          <rect x={-10} y={-100} width={20} height={112} rx={8} fill="#F5C223" strokeWidth={6} />
          <path d="M-10 12 L0 36 L10 12 Z" fill="#2A2233" strokeWidth={4} />
        </g>
      );
    case 'briefcase':
      return (
        <g {...o}>
          <path d="M-24 18 V2 Q-24 -10 -12 -10 H12 Q24 -10 24 2 V18" fill="none" strokeWidth={9} />
          <rect x={-66} y={14} width={132} height={90} rx={12} fill="#7A4A2A" strokeWidth={7} />
          <line x1={-66} y1={44} x2={66} y2={44} strokeWidth={5} />
          <rect x={-10} y={36} width={20} height={18} rx={3} fill={SP_GOLD} strokeWidth={4} />
        </g>
      );
    case 'coin': {
      const glyph = (
        <g className="k-nomirror" transform={mirrored ? 'scale(-1 1)' : undefined}>
          <path d="M-14 -26 H6 Q22 -26 22 -13 Q22 0 6 0 H-14 M-14 0 H9 Q26 0 26 13 Q26 26 9 26 H-14 M-14 -26 V26 M-6 -36 V-26 M6 -36 V-26 M-6 26 V36 M6 26 V36" fill="none" stroke="#9A6A08" strokeWidth={8} strokeLinecap="round" />
        </g>
      );
      return (
        <g {...o}>
          <circle r={52} fill="#F5C223" strokeWidth={7} />
          <circle r={40} fill="#FFDB5C" stroke="#C99512" strokeWidth={4} />
          {glyph}
        </g>
      );
    }
    case 'gavel':
      return (
        <g {...o}>
          <rect x={-8} y={-88} width={16} height={100} rx={6} fill="#B07040" strokeWidth={5} />
          <rect x={-50} y={-124} width={100} height={44} rx={12} fill="#8A5230" strokeWidth={7} />
          <rect x={-34} y={-124} width={10} height={44} fill={SP_GOLD} strokeWidth={3} />
          <rect x={24} y={-124} width={10} height={44} fill={SP_GOLD} strokeWidth={3} />
        </g>
      );
    case 'scroll':
      return (
        <g {...o}>
          <rect x={-52} y={-66} width={104} height={124} fill="#F2DFAE" strokeWidth={6} />
          {[-40, -22, -4, 14].map((yy) => <rect key={yy} x={-36} y={yy} width={72} height={7} rx={3} fill="#B89A60" stroke="none" />)}
          <rect x={-64} y={-80} width={128} height={24} rx={12} fill="#D9B878" strokeWidth={6} />
          <rect x={-64} y={50} width={128} height={24} rx={12} fill="#D9B878" strokeWidth={6} />
        </g>
      );
    case 'money':
      return (
        <g {...o}>
          {[16, 0, -16].map((yy, i) => (
            <g key={yy} transform={`translate(${i * 6 - 6} ${yy})`}>
              <rect x={-68} y={-30} width={136} height={60} rx={6} fill={i === 2 ? '#4FC27E' : '#2F9A5E'} strokeWidth={6} />
              {i === 2 && <circle r={16} fill="#2F9A5E" strokeWidth={4} />}
            </g>
          ))}
          <rect x={-16} y={-50} width={32} height={84} fill="#F5D27A" strokeWidth={4} transform="translate(6 0)" />
        </g>
      );
    case 'sign':
      return (
        <g {...o}>
          <rect x={-8} y={-130} width={16} height={146} rx={5} fill="#B07040" strokeWidth={5} />
          <rect x={-100} y={-250} width={200} height={128} rx={12} fill="#F7F3E8" strokeWidth={8} />
        </g>
      );
    case 'sword':
      return (
        <g {...o}>
          <path d="M-9 -34 L-9 -190 L0 -214 L9 -190 L9 -34 Z" fill="#DDE3EE" strokeWidth={6} />
          <line x1={0} y1={-44} x2={0} y2={-190} stroke="#9AA3B8" strokeWidth={4} />
          <rect x={-40} y={-40} width={80} height={14} rx={7} fill={SP_GOLD} strokeWidth={5} />
          <rect x={-7} y={-26} width={14} height={40} rx={5} fill="#7A4A2A" strokeWidth={4} />
        </g>
      );
    case 'wrench':
      return (
        <g transform="rotate(-30)" {...o}>
          <rect x={-10} y={-80} width={20} height={104} rx={8} fill="#B9C0D2" strokeWidth={6} />
          <path d="M-26 -84 A30 30 0 1 1 26 -84 L12 -108 H-12 Z" fill="#B9C0D2" strokeWidth={6} />
        </g>
      );
    case 'pickaxe':
      return (
        <g {...o}>
          <rect x={-8} y={-150} width={16} height={170} rx={6} fill="#B07040" strokeWidth={5} />
          <path d="M-86 -118 Q0 -176 86 -118 Q0 -150 -86 -118 Z" fill="#8C93A8" strokeWidth={6} />
        </g>
      );
    case 'pitchfork':
      return (
        <g {...o}>
          <rect x={-7} y={-150} width={14} height={180} rx={5} fill="#B07040" strokeWidth={5} />
          <path d="M-34 -210 V-160 Q-34 -146 -20 -146 H20 Q34 -146 34 -160 V-210 M0 -214 V-146" fill="none" stroke="#8C93A8" strokeWidth={9} strokeLinecap="round" />
        </g>
      );
    case 'pan':
      return (
        <g {...o}>
          <rect x={-8} y={-70} width={16} height={84} rx={7} fill="#2A2233" strokeWidth={5} />
          <ellipse cx={0} cy={-118} rx={62} ry={52} fill="#3A3F52" strokeWidth={7} />
          <ellipse cx={-8} cy={-124} rx={22} ry={16} fill="#F5C223" stroke="none" />
          <circle cx={-8} cy={-124} r={8} fill="#FF9A2E" stroke="none" />
        </g>
      );
    case 'book':
      return (
        <g {...o}>
          <rect x={-56} y={-50} width={112} height={92} rx={8} fill="#F7F3E8" strokeWidth={6} />
          <rect x={-60} y={-56} width={112} height={92} rx={8} fill="#2E5EAA" strokeWidth={7} />
          <rect x={-60} y={-56} width={18} height={92} rx={4} fill="#1E3E7A" strokeWidth={0} />
          <rect x={-26} y={-30} width={58} height={10} rx={4} fill={SP_GOLD} stroke="none" />
        </g>
      );
    case 'microphone':
      return (
        <g {...o}>
          <rect x={-10} y={-56} width={20} height={70} rx={8} fill="#2A2233" strokeWidth={5} />
          <circle cx={0} cy={-74} r={26} fill="#9AA3B8" strokeWidth={6} />
          <path d="M-18 -74 H18 M0 -92 V-56" stroke="#5A6078" strokeWidth={4} />
        </g>
      );
    case 'brush':
      return (
        <g transform="rotate(-25)" {...o}>
          <rect x={-6} y={-110} width={12} height={130} rx={5} fill="#B07040" strokeWidth={5} />
          <rect x={-9} y={-128} width={18} height={22} fill="#C9CEDC" strokeWidth={4} />
          <path d="M-10 -128 Q0 -170 10 -128 Z" fill="#E2552D" strokeWidth={5} />
        </g>
      );
    case 'guitar':
      return (
        <g transform="rotate(-40)" {...o}>
          <rect x={-9} y={-170} width={18} height={130} rx={4} fill="#5A3A22" strokeWidth={5} />
          <rect x={-15} y={-196} width={30} height={34} rx={6} fill="#3A2416" strokeWidth={5} />
          <circle cx={0} cy={0} r={52} fill="#D9822E" strokeWidth={7} />
          <circle cx={0} cy={-56} r={38} fill="#D9822E" strokeWidth={7} />
          <circle cx={0} cy={0} r={52} fill="#D9822E" stroke="none" />
          <circle cx={0} cy={-14} r={15} fill="#3A2416" stroke="none" />
          <rect x={-22} y={20} width={44} height={10} rx={4} fill="#3A2416" stroke="none" />
        </g>
      );
    case 'ball':
      return (
        <g {...o}>
          <circle cx={0} cy={-40} r={48} fill="#F08A2E" strokeWidth={7} />
          <path d="M-48 -40 H48 M0 -88 V8 M-34 -74 Q-10 -40 -34 -6 M34 -74 Q10 -40 34 -6" fill="none" strokeWidth={4} />
        </g>
      );
    case 'map':
      return (
        <g {...o}>
          <path d="M-74 -100 L-26 -90 L26 -102 L74 -92 V8 L26 -2 L-26 10 L-74 0 Z" fill="#F2DFAE" strokeWidth={6} />
          <path d="M-26 -90 V10 M26 -102 V-2" fill="none" strokeWidth={4} />
          <path d="M-56 -20 Q-20 -70 10 -40 T52 -66" fill="none" stroke="#D9363A" strokeWidth={5} strokeDasharray="10 8" strokeLinecap="round" />
          <path d="M44 -74 l16 16 M60 -74 l-16 16" stroke="#D9363A" strokeWidth={6} strokeLinecap="round" />
        </g>
      );
    case 'clipboard':
      return (
        <g {...o}>
          <rect x={-52} y={-130} width={104} height={136} rx={10} fill="#A86A3A" strokeWidth={7} />
          <rect x={-40} y={-114} width={80} height={108} rx={4} fill="#F7F3E8" strokeWidth={4} />
          {[-92, -74, -56, -38].map((yy) => <rect key={yy} x={-28} y={yy} width={56} height={7} rx={3} fill="#9A93A8" stroke="none" />)}
          <rect x={-20} y={-140} width={40} height={20} rx={5} fill="#9AA3B8" strokeWidth={5} />
        </g>
      );
    case 'flask':
      return (
        <g {...o}>
          <circle cx={0} cy={-46} r={50} fill="#3FE08A" opacity={0.25} stroke="none" />
          <path d="M-14 -120 V-78 L-52 -6 Q-56 6 -42 6 H42 Q56 6 52 -6 L14 -78 V-120 Z" fill="#E6F4FF" strokeWidth={6} />
          <path d="M-36 -36 L36 -36 L50 -6 Q52 2 42 2 H-42 Q-52 2 -50 -6 Z" fill="#3FE08A" stroke="none" />
          <rect x={-20} y={-130} width={40} height={14} rx={6} fill="#C9CEDC" strokeWidth={5} />
        </g>
      );
    case 'cane':
      return (
        <g {...o}>
          <path d="M0 0 V100 M0 0 Q0 -26 24 -26 Q44 -26 44 -6" fill="none" stroke={OUT} strokeWidth={20} strokeLinecap="round" />
          <path d="M0 0 V100 M0 0 Q0 -26 24 -26 Q44 -26 44 -6" fill="none" stroke="#8A5230" strokeWidth={10} strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
};

/** One held object alone (catalogues, a prop on a table): grip point at (0,0). */
export const StoryPropIcon: React.FC<{prop: StoryProp; x?: number; y?: number; s?: number; id?: string}> = ({prop, x = 0, y = 0, s = 1, id = 'sp'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>{storyProp(prop, id, false)}</g>
);

export const StoryPerson: React.FC<{
  x: number; y: number; s?: number; body?: string; hat?: StoryHat; hatColor?: string; pose?: StoryPose; flip?: boolean; t?: number; id: string;
  role?: StoryRole; outfit?: StoryOutfit; tieColor?: string; prop?: StoryProp; glasses?: boolean; rim?: string;
  hair?: StoryHair; hairColor?: string; beard?: string; medals?: boolean;
}> = (props) => {
  const R: StoryLook = props.role ? STORY_ROLES[props.role] : {};
  const {x, y, flip, t = 0, id} = props;
  const s = (props.s ?? 1) * (R.sMul ?? 1);
  const outfit = props.outfit ?? R.outfit ?? 'plain';
  const body = props.body ?? R.body ?? OUTFIT_BODY[outfit] ?? '#7A3FC8';
  const hat = props.hat ?? R.hat ?? 'none';
  const hc = props.hatColor ?? R.hatColor ?? (hat === 'hood' ? body : HAT_DEFAULT[hat] ?? '#3A1A6E');
  const pose = props.pose ?? R.pose ?? 'idle';
  const prop = props.prop ?? R.prop ?? 'none';
  const rim = props.rim ?? R.rim ?? SP_GOLD;
  const tieColor = props.tieColor ?? R.tieColor ?? '#D2363A';
  const hair = props.hair ?? R.hair ?? 'none';
  const hairColor = props.hairColor ?? R.hairColor ?? (hair === 'bald' ? '#E8E4DC' : '#5A3A2A');
  const beard = props.beard ?? R.beard;
  const glasses = props.glasses ?? R.glasses ?? false;
  const medals = props.medals ?? R.medals ?? false;
  const f = uid('nsp', id);

  // walk: a calm deterministic stride from t (legs swing at the hips, arms swing opposite, a soft bob). The phase comes
  // from the id, NEVER from x (x moves while walking → the wave would turn into a shake). The bob is a smooth wave
  // (two lifts per stride, no sharp |cos| landing).
  const seed = phaseOf(id);
  const ph = t * 5.2 + seed;
  const sw = pose === 'walk' ? Math.sin(ph) : 0;
  const bob = pose === 'walk' ? -(1 - Math.cos(2 * ph)) * 2.5 : 0;
  const b = Math.sin(t * 2 + seed) * 3 + bob;
  const head = -330 + b, r = 78;
  const long = LONG.includes(outfit);
  const rf = hat === 'hijab' || hat === 'hood' ? r * 0.86 : r; // face disc (smaller inside a hijab / hood)

  const dark = (c: string, k: number) => mixHex(c, '#000000', k);
  const light = (c: string, k: number) => mixHex(c, '#FFFFFF', k);
  const armColor = ({labcoat: SP_WHITE, doctor: SP_WHITE, chef: SP_WHITE, spacesuit: SP_WHITE, sailor: SP_WHITE, bisht: '#2A2030', armor: '#A9B2C6', pharaoh: SP_SKIN, gown: '#1E1A2A'} as Partial<Record<StoryOutfit, string>>)[outfit] ?? body;
  const legColor = ({overalls: '#3A64B0', armor: '#A9B2C6', spacesuit: SP_WHITE, uniform: '#1E2440', suit: '#1E1A2A', pharaoh: SP_SKIN, scrubs: body, sport: SP_SKIN} as Partial<Record<StoryOutfit, string>>)[outfit] ?? '#1A1838';

  // ── arms: shoulder → elbow → hand per pose
  type P2 = [number, number];
  const armPts = (side: 1 | -1): {e: P2; h: P2} => {
    const sx = side * 70, sy = -210 + b;
    const mid = (h: P2): {e: P2; h: P2} => ({e: [(sx + h[0]) / 2, (sy + h[1]) / 2], h});
    const idle: P2 = [sx + side * 18, sy + 120];
    const front = side === 1;
    switch (pose) {
      case 'point': return front ? mid([sx + 150, sy - 10]) : mid(idle);
      case 'up': return front ? mid([sx + 60, sy - 150]) : mid(idle);
      case 'hold': return mid([sx * 0.6, sy + 60]);
      case 'talk': return front ? {e: [sx + 48, sy + 72], h: [sx + 124, sy + 18]} : mid(idle);
      case 'shock': return {e: [side * 128, sy + 18], h: [side * 120, head + 6]};
      case 'think': return front ? {e: [sx + 72, sy + 78], h: [38, head + r * 0.98]} : mid(idle);
      case 'cheer': return {e: [side * 128, sy - 72], h: [side * 152, sy - 190]};
      case 'walk': {
        const a = ((front ? -26 : 26) * sw * Math.PI) / 180;
        const vx = idle[0] - sx, vy = idle[1] - sy;
        const h: P2 = [sx + vx * Math.cos(a) - vy * Math.sin(a), sy + vx * Math.sin(a) + vy * Math.cos(a)];
        return mid(h);
      }
      default: return mid(idle);
    }
  };
  const arm = (side: 1 | -1) => {
    const {e, h} = armPts(side);
    const d = `M${side * 70} ${-210 + b} L${e[0]} ${e[1]} L${h[0]} ${h[1]}`;
    return (
      <g key={side}>
        <path d={d} fill="none" stroke={OUT} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke={armColor} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={h[0]} cy={h[1]} r={pose === 'talk' && side === 1 ? 23 : 20} fill={SP_SKIN} stroke={rim} strokeWidth={5} />
      </g>
    );
  };
  const hand1 = armPts(1).h;
  const propAt: P2 = pose === 'hold' ? [0, -150 + b] : hand1;
  const propEl = prop !== 'none' && (
    <g transform={`translate(${propAt[0]} ${propAt[1]})`}>{storyProp(prop, id, !!flip)}</g>
  );

  // ── legs (rotate at the hips while walking) + white capsule shoes
  const leg = (side: 1 | -1) => {
    const lx = side === 1 ? 10 : -40;
    const a = (side === 1 ? 22 : -22) * sw;
    return (
      <g key={side} transform={`rotate(${a} ${side * 25} -105)`}>
        {!long && <rect x={lx} y={-110} width={30} height={100} rx={12} fill={legColor} stroke={outfit === 'spacesuit' || outfit === 'armor' ? OUT : 'none'} strokeWidth={5} />}
        <rect x={side === 1 ? 4 : -52} y={-18} width={48} height={24} rx={12} fill="#FFFFFF" stroke={OUT} strokeWidth={5} />
      </g>
    );
  };

  // ── torso shapes
  const T0 = `M-78 ${-90 + b} Q-90 ${-250 + b} -40 ${-250 + b} H40 Q90 ${-250 + b} 78 ${-90 + b} Q0 ${-70 + b} -78 ${-90 + b} Z`;
  const hem = sw * 6;
  const L0 = `M-40 ${-250 + b} H40 Q90 ${-250 + b} 84 ${-110 + b} L${96 + hem} -14 Q0 -2 ${-96 + hem} -14 L-84 ${-110 + b} Q-90 ${-250 + b} -40 ${-250 + b} Z`;
  const DR = `M-40 ${-250 + b} H40 Q88 ${-250 + b} 78 ${-150 + b} L${112 + hem} -14 Q0 0 ${-112 + hem} -14 L-78 ${-150 + b} Q-88 ${-250 + b} -40 ${-250 + b} Z`;
  const sh = {stroke: OUT, strokeWidth: 9, strokeLinejoin: 'round' as const};
  const Y = (v: number) => v + b;
  const stripe = (h = 90) => <rect x={-34} y={Y(-235)} width={16} height={h} rx={8} fill="#FFFFFF" opacity={0.18} />;
  const torso = (() => {
    switch (outfit) {
      case 'suit':
        return (
          <g>
            <path d={T0} fill={body} {...sh} />
            {stripe()}
            <path d={`M-32 ${Y(-250)} L0 ${Y(-160)} L32 ${Y(-250)} Z`} fill={SP_WHITE} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
            <path d={`M-9 ${Y(-242)} H9 L14 ${Y(-180)} L0 ${Y(-158)} L-14 ${Y(-180)} Z`} fill={tieColor} stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
            <path d={`M-34 ${Y(-250)} L-54 ${Y(-206)} L-26 ${Y(-204)} L0 ${Y(-160)} L26 ${Y(-204)} L54 ${Y(-206)} L34 ${Y(-250)}`} fill="none" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
            <line x1={0} y1={Y(-160)} x2={0} y2={Y(-82)} stroke={OUT} strokeWidth={4} />
            <circle cx={-12} cy={Y(-132)} r={6} fill={OUT} />
            <circle cx={-12} cy={Y(-106)} r={6} fill={OUT} />
          </g>
        );
      case 'shirt':
        return (
          <g>
            <path d={T0} fill={body} {...sh} />
            {stripe()}
            <line x1={0} y1={Y(-236)} x2={0} y2={Y(-82)} stroke={OUT} strokeWidth={4} opacity={0.6} />
            {[-205, -170, -135].map((yy) => <circle key={yy} cx={0} cy={Y(yy)} r={5} fill={light(body, 0.6)} stroke={OUT} strokeWidth={2} />)}
            <path d={`M-34 ${Y(-252)} L-2 ${Y(-238)} L-16 ${Y(-212)} Z M34 ${Y(-252)} L2 ${Y(-238)} L16 ${Y(-212)} Z`} fill={light(body, 0.35)} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
            <rect x={22} y={Y(-206)} width={30} height={28} rx={4} fill="none" stroke={OUT} strokeWidth={4} opacity={0.6} />
          </g>
        );
      case 'hoodie':
        return (
          <g>
            <path d={T0} fill={body} {...sh} />
            {stripe(60)}
            <path d={`M-30 ${Y(-252)} Q0 ${Y(-228)} 30 ${Y(-252)}`} fill="none" stroke={OUT} strokeWidth={6} />
            <path d={`M-14 ${Y(-238)} L-18 ${Y(-180)} M14 ${Y(-238)} L18 ${Y(-176)}`} stroke={SP_WHITE} strokeWidth={6} strokeLinecap="round" />
            <circle cx={-18} cy={Y(-176)} r={6} fill={SP_WHITE} />
            <circle cx={18} cy={Y(-172)} r={6} fill={SP_WHITE} />
            <path d={`M-48 ${Y(-150)} H48 L60 ${Y(-102)} Q0 ${Y(-92)} -60 ${Y(-102)} Z`} fill={dark(body, 0.18)} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
          </g>
        );
      case 'thobe':
      case 'bisht':
        return (
          <g>
            <path d={L0} fill={body} {...sh} />
            {stripe(170)}
            <rect x={-20} y={Y(-254)} width={40} height={14} rx={7} fill={body} stroke={OUT} strokeWidth={5} />
            <line x1={0} y1={Y(-240)} x2={0} y2={Y(-180)} stroke={OUT} strokeWidth={4} />
            {outfit === 'bisht' && (
              <g>
                <path d={`M-30 ${Y(-252)} Q-96 ${Y(-252)} -92 ${Y(-150)} L-104 -26 L-40 -26 L-26 ${Y(-150)} Z`} fill="#2A2030" stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
                <path d={`M30 ${Y(-252)} Q96 ${Y(-252)} 92 ${Y(-150)} L104 -26 L40 -26 L26 ${Y(-150)} Z`} fill="#2A2030" stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
                <path d={`M-30 ${Y(-246)} L-26 ${Y(-150)} L-40 -30 M30 ${Y(-246)} L26 ${Y(-150)} L40 -30`} fill="none" stroke="#E8B54A" strokeWidth={8} strokeLinecap="round" />
              </g>
            )}
          </g>
        );
      case 'dress':
        return (
          <g>
            <path d={DR} fill={body} {...sh} />
            {stripe(170)}
            <path d={`M-28 ${Y(-250)} Q0 ${Y(-226)} 28 ${Y(-250)}`} fill="none" stroke={light(body, 0.35)} strokeWidth={6} />
          </g>
        );
      case 'robe':
        return (
          <g>
            <path d={L0} fill={body} {...sh} />
            {stripe(170)}
            <path d={`M-6 ${Y(-230)} L-6 -18 M6 ${Y(-230)} L6 -18`} stroke={SP_GOLD} strokeWidth={6} />
            <path d={`M-86 ${Y(-218)} Q-90 ${Y(-262)} -40 ${Y(-262)} H40 Q90 ${Y(-262)} 86 ${Y(-218)} Q0 ${Y(-196)} -86 ${Y(-218)} Z`} fill={SP_WHITE} stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
            {[-56, -24, 10, 42].map((xx, i) => <rect key={xx} x={xx} y={Y(-236 + (i % 2) * 8)} width={7} height={11} rx={3} fill={OUT} />)}
          </g>
        );
      case 'gown':
        return (
          <g>
            <path d={L0} fill={body} {...sh} />
            {stripe(170)}
            <path d={`M-8 ${Y(-246)} L-14 ${Y(-206)} H-2 Z M8 ${Y(-246)} L14 ${Y(-206)} H2 Z`} fill={SP_WHITE} stroke={OUT} strokeWidth={3} />
          </g>
        );
      case 'labcoat':
      case 'doctor':
        return (
          <g>
            <path d={T0} fill={body} {...sh} />
            <path d={`M-40 ${Y(-250)} H40 Q92 ${Y(-250)} 86 -44 H-86 Q-92 ${Y(-250)} -40 ${Y(-250)} Z`} fill={SP_WHITE} {...sh} />
            <path d={`M-24 ${Y(-252)} H24 L10 ${Y(-110)} H-10 Z`} fill={body} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
            <path d={`M-24 ${Y(-252)} L-40 ${Y(-200)} L-12 ${Y(-180)} M24 ${Y(-252)} L40 ${Y(-200)} L12 ${Y(-180)}`} fill="none" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
            <line x1={0} y1={Y(-110)} x2={0} y2={-46} stroke={OUT} strokeWidth={4} />
            <rect x={-64} y={Y(-150)} width={34} height={34} rx={4} fill="none" stroke={OUT} strokeWidth={4} />
            <rect x={-56} y={Y(-170)} width={8} height={30} rx={3} fill="#2E5EAA" stroke={OUT} strokeWidth={3} />
            {outfit === 'doctor' && (
              <g fill="none" strokeLinecap="round">
                <path d={`M-30 ${Y(-246)} Q-48 ${Y(-170)} -6 ${Y(-150)} M30 ${Y(-246)} Q48 ${Y(-170)} 6 ${Y(-150)} M0 ${Y(-150)} V${Y(-122)}`} stroke={OUT} strokeWidth={10} />
                <path d={`M-30 ${Y(-246)} Q-48 ${Y(-170)} -6 ${Y(-150)} M30 ${Y(-246)} Q48 ${Y(-170)} 6 ${Y(-150)} M0 ${Y(-150)} V${Y(-122)}`} stroke="#5A6078" strokeWidth={5} />
                <circle cx={0} cy={Y(-112)} r={12} fill="#C9CEDC" stroke={OUT} strokeWidth={4} />
              </g>
            )}
          </g>
        );
      case 'uniform':
        return (
          <g>
            <path d={T0} fill={body} {...sh} />
            {stripe()}
            <rect x={-26} y={Y(-254)} width={52} height={16} rx={6} fill={SP_GOLD} stroke={OUT} strokeWidth={4} />
            {[-218, -188, -158].map((yy) => [-18, 18].map((xx) => <circle key={`${xx}${yy}`} cx={xx} cy={Y(yy)} r={6} fill={SP_GOLD} stroke={OUT} strokeWidth={2} />))}
            <rect x={-80} y={Y(-134)} width={160} height={20} fill="#1E1A14" stroke={OUT} strokeWidth={4} />
            <rect x={-14} y={Y(-138)} width={28} height={28} rx={4} fill={SP_GOLD} stroke={OUT} strokeWidth={4} />
            {[-1, 1].map((sd) => (
              <g key={sd}>
                <rect x={sd === 1 ? 50 : -96} y={Y(-260)} width={46} height={18} rx={8} fill={SP_GOLD} stroke={OUT} strokeWidth={4} />
                {[0, 1, 2, 3].map((k) => <line key={k} x1={(sd === 1 ? 56 : -90) + k * 11} y1={Y(-242)} x2={(sd === 1 ? 56 : -90) + k * 11} y2={Y(-228)} stroke={SP_GOLD} strokeWidth={4} />)}
              </g>
            ))}
            {medals && [-58, -42].map((xx, i) => (
              <g key={xx}>
                <rect x={xx} y={Y(-222)} width={12} height={18} fill={i ? '#3A8FD0' : '#D2363A'} stroke={OUT} strokeWidth={3} />
                <circle cx={xx + 6} cy={Y(-196)} r={8} fill={SP_GOLD} stroke={OUT} strokeWidth={3} />
              </g>
            ))}
          </g>
        );
      case 'overalls':
        return (
          <g>
            <path d={T0} fill={body} {...sh} />
            <path d={`M-46 ${Y(-206)} H46 L62 ${Y(-92)} Q0 ${Y(-72)} -62 ${Y(-92)} Z`} fill="#3A64B0" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
            <path d={`M-40 ${Y(-204)} L-52 ${Y(-250)} M40 ${Y(-204)} L52 ${Y(-250)}`} stroke="#3A64B0" strokeWidth={14} strokeLinecap="round" />
            <circle cx={-34} cy={Y(-194)} r={6} fill={SP_GOLD} stroke={OUT} strokeWidth={2} />
            <circle cx={34} cy={Y(-194)} r={6} fill={SP_GOLD} stroke={OUT} strokeWidth={2} />
            <rect x={-22} y={Y(-176)} width={44} height={34} rx={5} fill="none" stroke={OUT} strokeWidth={4} opacity={0.7} />
            <rect x={-34} y={Y(-235)} width={14} height={30} rx={7} fill="#FFFFFF" opacity={0.18} />
          </g>
        );
      case 'pharaoh':
        return (
          <g>
            <path d={T0} fill={body} {...sh} />
            <path d={`M-74 ${Y(-236)} Q0 ${Y(-140)} 74 ${Y(-236)} Q0 ${Y(-180)} -74 ${Y(-236)} Z`} fill={SP_GOLD} stroke={OUT} strokeWidth={5} />
            <path d={`M-62 ${Y(-222)} Q0 ${Y(-160)} 62 ${Y(-222)}`} fill="none" stroke="#2E5EAA" strokeWidth={7} />
            <path d={`M-78 ${Y(-120)} H78 L92 -40 H-92 Z`} fill={SP_WHITE} stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
            <rect x={-80} y={Y(-128)} width={160} height={16} fill={SP_GOLD} stroke={OUT} strokeWidth={4} />
            <path d={`M-14 ${Y(-112)} H14 L20 -40 H-20 Z`} fill={SP_GOLD} stroke={OUT} strokeWidth={4} />
          </g>
        );
      case 'armor':
        return (
          <g>
            <path d={T0} fill="#A9B2C6" {...sh} />
            <path d={`M-42 ${Y(-248)} H42 L48 ${Y(-84)} Q0 ${Y(-76)} -48 ${Y(-84)} Z`} fill={body} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
            <path d={`M0 ${Y(-220)} V${Y(-120)} M-26 ${Y(-180)} H26`} stroke={SP_WHITE} strokeWidth={14} strokeLinecap="round" />
            <rect x={-80} y={Y(-120)} width={160} height={16} fill="#5A4A3A" stroke={OUT} strokeWidth={4} />
            {[-1, 1].map((sd) => <ellipse key={sd} cx={sd * 70} cy={Y(-238)} rx={30} ry={22} fill="#C9CEDC" stroke={OUT} strokeWidth={6} />)}
          </g>
        );
      case 'vest':
        return (
          <g>
            <path d={T0} fill={body} {...sh} />
            <path d={`M-40 ${Y(-250)} Q-90 ${Y(-250)} -78 ${Y(-92)} L-20 ${Y(-84)} L-14 ${Y(-238)} Z`} fill="#2A2238" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
            <path d={`M40 ${Y(-250)} Q90 ${Y(-250)} 78 ${Y(-92)} L20 ${Y(-84)} L14 ${Y(-238)} Z`} fill="#2A2238" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
            <rect x={-82} y={Y(-122)} width={164} height={20} fill="#D2363A" stroke={OUT} strokeWidth={4} />
          </g>
        );
      case 'sailor':
        return (
          <g>
            <path d={T0} fill={body} {...sh} />
            <path d={`M-70 ${Y(-246)} H70 L58 ${Y(-206)} L0 ${Y(-160)} L-58 ${Y(-206)} Z`} fill="#1E3E7A" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
            <path d={`M-62 ${Y(-232)} H62`} stroke={SP_WHITE} strokeWidth={4} />
            <path d={`M-16 ${Y(-176)} L16 ${Y(-176)} L0 ${Y(-150)} Z M-6 ${Y(-160)} L-16 ${Y(-126)} M6 ${Y(-160)} L16 ${Y(-126)}`} fill="#D2363A" stroke="#D2363A" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
          </g>
        );
      case 'spacesuit':
        return (
          <g>
            <path d={`M-84 ${Y(-84)} Q-98 ${Y(-252)} -40 ${Y(-252)} H40 Q98 ${Y(-252)} 84 ${Y(-84)} Q0 ${Y(-66)} -84 ${Y(-84)} Z`} fill={body} {...sh} />
            {stripe()}
            <rect x={-34} y={Y(-200)} width={68} height={50} rx={8} fill="#C9CEDC" stroke={OUT} strokeWidth={5} />
            <circle cx={-16} cy={Y(-175)} r={7} fill="#D2363A" />
            <circle cx={2} cy={Y(-175)} r={7} fill="#3FE08A" />
            <rect x={-26} y={Y(-164)} width={52} height={6} rx={3} fill="#3A8FD0" />
            <rect x={-84} y={Y(-124)} width={168} height={18} fill="#9AA3B8" stroke={OUT} strokeWidth={4} />
          </g>
        );
      case 'scrubs':
        return (
          <g>
            <path d={T0} fill={body} {...sh} />
            {stripe()}
            <path d={`M-30 ${Y(-250)} L0 ${Y(-200)} L30 ${Y(-250)}`} fill={dark(body, 0.3)} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
            <rect x={-60} y={Y(-190)} width={32} height={30} rx={4} fill="none" stroke={OUT} strokeWidth={4} opacity={0.6} />
          </g>
        );
      case 'chef':
        return (
          <g>
            <path d={T0} fill={body} {...sh} />
            {[-210, -178, -146].map((yy) => [-20, 20].map((xx) => <circle key={`${xx}${yy}`} cx={xx} cy={Y(yy)} r={6} fill="#9AA3B8" stroke={OUT} strokeWidth={2} />))}
            <path d={`M-30 ${Y(-252)} Q0 ${Y(-226)} 30 ${Y(-252)} L14 ${Y(-218)} H-14 Z`} fill="#D2363A" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
          </g>
        );
      case 'sport':
        return (
          <g>
            <rect x={-62} y={-128} width={124} height={50} rx={10} fill={dark(body, 0.25)} stroke={OUT} strokeWidth={6} />
            <path d={T0} fill={body} {...sh} />
            {stripe()}
            <path d={`M-72 ${Y(-240)} L-62 ${Y(-92)} M72 ${Y(-240)} L62 ${Y(-92)}`} stroke={SP_WHITE} strokeWidth={8} strokeLinecap="round" />
            <path d={`M-26 ${Y(-250)} Q0 ${Y(-220)} 26 ${Y(-250)}`} fill="none" stroke={SP_WHITE} strokeWidth={6} />
          </g>
        );
      default:
        return (
          <g>
            <path d={T0} fill={body} {...sh} />
            {stripe()}
          </g>
        );
    }
  })();

  // ── headwear: [behind the head, over the head]
  const H = (k: number) => head - r * k;
  const o8 = {stroke: OUT, strokeWidth: 8, strokeLinejoin: 'round' as const};
  const checked = hat === 'ghutra' && hc.toUpperCase() !== SP_WHITE && hc.toUpperCase() !== '#FFFFFF';
  const cloth = checked ? `url(#${f}__chk)` : hc;
  const hats: Record<StoryHat, [React.ReactNode, React.ReactNode]> = {
    none: [null, null],
    beret: [null, <path d={`M${-r - 6} ${H(0.45)} Q${-r * 0.6} ${H(1.35)} ${r * 0.5} ${H(1.15)} Q${r + 14} ${H(0.9)} ${r} ${H(0.45)} Z`} fill={hc} {...o8} />],
    top: [null, (
      <g>
        <rect x={-r * 0.7} y={H(2.15)} width={r * 1.4} height={r * 1.4} rx={8} fill={hc} {...o8} />
        <rect x={-r * 0.7 + 4} y={H(1.08)} width={r * 1.4 - 8} height={r * 0.24} fill="#8FD8FF" />
        <rect x={-r * 1.08} y={H(0.88)} width={r * 2.16} height={r * 0.24} rx={8} fill={hc} {...o8} />
        <rect x={-r * 0.5} y={H(2.0)} width={12} height={r * 0.8} rx={6} fill="#FFFFFF" opacity={0.16} />
      </g>
    )],
    helmet: [null, (
      <g>
        <path d={`M${-r * 1.02} ${H(0.25)} Q${-r} ${H(1.25)} 0 ${H(1.25)} Q${r} ${H(1.25)} ${r * 1.02} ${H(0.25)} Z`} fill={hc} {...o8} />
        <rect x={-r * 1.2} y={H(0.35)} width={r * 2.4} height={r * 0.2} rx={6} fill={hc} stroke={OUT} strokeWidth={6} />
        <circle cx={0} cy={H(0.8)} r={r * 0.18} fill="#FFF3C0" stroke={OUT} strokeWidth={4} />
      </g>
    )],
    bicorne: [null, (
      <g>
        <path d={`M${-r * 1.6} ${H(0.5)} Q0 ${H(1.95)} ${r * 1.6} ${H(0.5)} Q0 ${H(0.85)} ${-r * 1.6} ${H(0.5)} Z`} fill={hc} {...o8} />
        <path d={`M${-r * 1.45} ${H(0.6)} Q0 ${H(0.9)} ${r * 1.45} ${H(0.6)}`} fill="none" stroke={SP_GOLD} strokeWidth={5} />
        <circle cx={r * 0.35} cy={H(1.12)} r={r * 0.17} fill="#D2363A" stroke={OUT} strokeWidth={4} />
        <circle cx={r * 0.35} cy={H(1.12)} r={r * 0.07} fill={SP_WHITE} />
      </g>
    )],
    crown: [null, <path d={`M${-r * 0.75} ${H(0.8)} L${-r * 0.8} ${H(1.55)} L${-r * 0.35} ${H(1.15)} L0 ${H(1.7)} L${r * 0.35} ${H(1.15)} L${r * 0.8} ${H(1.55)} L${r * 0.75} ${H(0.8)} Z`} fill="#F5C223" {...o8} />],
    turban: [null, (
      <g>
        <path d={`M${-r * 1.02} ${H(0.35)} Q${-r * 1.15} ${H(1.45)} 0 ${H(1.4)} Q${r * 1.15} ${H(1.45)} ${r * 1.02} ${H(0.35)} Q0 ${H(0.7)} ${-r * 1.02} ${H(0.35)} Z`} fill={hc} {...o8} />
        <path d={`M${-r * 0.9} ${H(0.75)} Q0 ${H(1.25)} ${r * 0.9} ${H(0.75)}`} fill="none" stroke={OUT} strokeWidth={4} opacity={0.5} />
      </g>
    )],
    cap: [null, (
      <g>
        <path d={`M${-r} ${H(0.4)} Q${-r} ${H(1.2)} 0 ${H(1.2)} Q${r} ${H(1.2)} ${r} ${H(0.4)} Z`} fill={hc} {...o8} />
        <path d={`M${r * 0.2} ${H(0.45)} L${r * 1.5} ${H(0.35)}`} stroke={OUT} strokeWidth={22} strokeLinecap="round" />
      </g>
    )],
    // 3:45 teepee people: a red headband + ONE white feather standing up behind
    feather: [
      <g>
        <path d={`M${r * 0.12} ${H(0.6)} Q${-r * 0.12} ${H(1.6)} ${r * 0.46} ${H(2.3)} Q${r * 0.95} ${H(1.5)} ${r * 0.6} ${H(0.6)} Z`} fill={SP_WHITE} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M${r * 0.36} ${H(0.7)} Q${r * 0.32} ${H(1.5)} ${r * 0.46} ${H(2.15)}`} fill="none" stroke={OUT} strokeWidth={4} />
        <path d={`M${r * 0.3} ${H(2.0)} Q${r * 0.46} ${H(2.32)} ${r * 0.62} ${H(2.0)}`} fill="#1C1830" stroke="none" />
      </g>,
      <g clipPath={`url(#${f}__hc)`}>
        <rect x={-r - 10} y={H(0.62)} width={2 * r + 20} height={r * 0.3} fill={hc} stroke={OUT} strokeWidth={6} />
      </g>,
    ],
    warbonnet: [null, (
      <g>
        {['#17B07A', '#E2552D', '#F5B82E', '#2FD3C8', '#17B07A'].map((c, i) => (
          <ellipse key={i} cx={0} cy={H(1.5)} rx={14} ry={r * 0.7} fill={c} stroke={OUT} strokeWidth={5} transform={`rotate(${-50 + i * 25} 0 ${H(0.8)})`} />
        ))}
        <rect x={-r} y={H(0.95)} width={r * 2} height={r * 0.32} rx={6} fill="#F5C223" stroke={OUT} strokeWidth={6} />
      </g>
    )],
    tarboush: [null, (
      <g>
        <path d={`M${-r * 0.74} ${H(0.6)} L${-r * 0.58} ${H(1.62)} Q0 ${H(1.74)} ${r * 0.58} ${H(1.62)} L${r * 0.74} ${H(0.6)} Q0 ${H(0.46)} ${-r * 0.74} ${H(0.6)} Z`} fill={hc} {...o8} />
        <rect x={-r * 0.48} y={H(1.5)} width={11} height={r * 0.8} rx={5} fill="#FFFFFF" opacity={0.2} />
        <path d={`M0 ${H(1.68)} Q${r * 0.6} ${H(1.74)} ${r * 0.84} ${H(1.1)}`} fill="none" stroke={OUT} strokeWidth={7} strokeLinecap="round" />
        <ellipse cx={r * 0.86} cy={H(0.92)} rx={10} ry={22} fill="#1C1830" stroke={OUT} strokeWidth={4} />
      </g>
    )],
    ghutra: [
      <path d={`M${-r * 1.3} ${-226 + b} Q${-r * 1.34} ${H(-0.2)} ${-r * 1.1} ${H(0.7)} Q${-r * 0.8} ${H(1.32)} 0 ${H(1.32)} Q${r * 0.8} ${H(1.32)} ${r * 1.1} ${H(0.7)} Q${r * 1.34} ${H(-0.2)} ${r * 1.3} ${-226 + b} Q0 ${-200 + b} ${-r * 1.3} ${-226 + b} Z`} fill={cloth} {...o8} />,
      <g>
        <path d={`M${-r * 1.06} ${H(0.0)} Q${-r * 1.08} ${H(1.3)} 0 ${H(1.3)} Q${r * 1.08} ${H(1.3)} ${r * 1.06} ${H(0.0)} Q${r * 0.9} ${H(0.62)} 0 ${H(0.62)} Q${-r * 0.9} ${H(0.62)} ${-r * 1.06} ${H(0.0)} Z`} fill={cloth} {...o8} />
        <ellipse cx={0} cy={H(0.92)} rx={r * 0.98} ry={r * 0.2} fill="none" stroke={OUT} strokeWidth={22} />
        <ellipse cx={0} cy={H(0.92)} rx={r * 0.98} ry={r * 0.2} fill="none" stroke="#2A2438" strokeWidth={10} />
      </g>,
    ],
    hijab: [
      <path d={`M${-r * 1.22} ${H(0)} Q${-r * 1.24} ${H(1.24)} 0 ${H(1.24)} Q${r * 1.24} ${H(1.24)} ${r * 1.22} ${H(0)} Q${r * 1.24} ${-232 + b} ${r * 1.08} ${-178 + b} Q0 ${-150 + b} ${-r * 1.08} ${-178 + b} Q${-r * 1.24} ${-232 + b} ${-r * 1.22} ${H(0)} Z`} fill={hc} {...o8} />,
      <g>
        <path d={`M${-rf - 6} ${head + 4} A${rf + 6} ${rf + 6} 0 0 1 ${rf + 6} ${head + 4}`} fill="none" stroke={hc} strokeWidth={18} />
        <rect x={-r * 0.9} y={H(-0.6)} width={14} height={r * 0.9} rx={7} fill="#FFFFFF" opacity={0.16} />
      </g>,
    ],
    hood: [
      <path d={`M${-r * 1.2} ${-232 + b} Q${-r * 1.34} ${H(0.6)} ${-r * 0.7} ${H(1.22)} Q0 ${H(1.5)} ${r * 0.7} ${H(1.22)} Q${r * 1.34} ${H(0.6)} ${r * 1.2} ${-232 + b} Q0 ${-212 + b} ${-r * 1.2} ${-232 + b} Z`} fill={hc} {...o8} />,
      <circle cx={0} cy={head} r={rf + 9} fill="none" stroke={dark(hc, 0.3)} strokeWidth={12} />,
    ],
    officer: [null, (
      <g>
        <path d={`M${-r * 0.98} ${H(0.62)} L${-r * 1.24} ${H(1.32)} Q0 ${H(1.62)} ${r * 1.24} ${H(1.32)} L${r * 0.98} ${H(0.62)} Z`} fill={hc} {...o8} />
        <rect x={-r * 1.0} y={H(0.86)} width={r * 2.0} height={r * 0.28} fill="#1C1830" stroke={OUT} strokeWidth={5} />
        <circle cx={0} cy={H(1.02)} r={r * 0.2} fill={SP_GOLD} stroke={OUT} strokeWidth={4} />
        <path d={`M${-r * 0.98} ${H(0.6)} Q0 ${H(0.2)} ${r * 0.98} ${H(0.6)} Z`} fill="#0E0C14" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M${-r * 0.6} ${H(0.48)} Q0 ${H(0.3)} ${r * 0.6} ${H(0.48)}`} fill="none" stroke="#6A6A84" strokeWidth={4} />
      </g>
    )],
    hardhat: [null, (
      <g>
        <path d={`M${-r * 1.0} ${H(0.35)} Q${-r * 1.0} ${H(1.4)} 0 ${H(1.4)} Q${r * 1.0} ${H(1.4)} ${r * 1.0} ${H(0.35)} Z`} fill={hc} {...o8} />
        <rect x={-r * 0.14} y={H(1.42)} width={r * 0.28} height={r * 1.0} rx={7} fill={light(hc, 0.35)} stroke={OUT} strokeWidth={5} />
        <rect x={-r * 1.32} y={H(0.48)} width={r * 2.64} height={r * 0.24} rx={10} fill={hc} stroke={OUT} strokeWidth={7} />
      </g>
    )],
    judge: [
      <g>
        {[-1, 1].map((sd) => [0, 1, 2, 3].map((k) => (
          <ellipse key={`${sd}${k}`} cx={sd * r * 1.02} cy={H(0.2 - k * 0.42)} rx={r * 0.32} ry={r * 0.24} fill={hc} stroke={OUT} strokeWidth={6} />
        )))}
      </g>,
      <g>
        <path d={`M${-r * 1.08} ${H(0.2)} Q${-r * 1.12} ${H(1.32)} 0 ${H(1.3)} Q${r * 1.12} ${H(1.32)} ${r * 1.08} ${H(0.2)} Q0 ${H(0.72)} ${-r * 1.08} ${H(0.2)} Z`} fill={hc} {...o8} />
        <path d={`M${-r * 0.8} ${H(0.85)} Q0 ${H(1.15)} ${r * 0.8} ${H(0.85)} M${-r * 0.9} ${H(0.5)} Q0 ${H(0.85)} ${r * 0.9} ${H(0.5)}`} fill="none" stroke={OUT} strokeWidth={4} opacity={0.45} />
      </g>,
    ],
    nemes: [
      <g>
        <clipPath id={`${f}__nm`}>
          <path d={`M${-r * 0.95} ${H(1.0)} L${r * 0.95} ${H(1.0)} L${r * 1.42} ${-222 + b} L${-r * 1.42} ${-222 + b} Z`} />
        </clipPath>
        <path d={`M${-r * 0.95} ${H(1.0)} L${r * 0.95} ${H(1.0)} L${r * 1.42} ${-222 + b} L${-r * 1.42} ${-222 + b} Z`} fill={hc} {...o8} />
        <g clipPath={`url(#${f}__nm)`}>
          {[0, 1, 2, 3, 4, 5, 6].map((k) => <rect key={k} x={-r * 1.6} y={H(0.8 - k * 0.36)} width={r * 3.2} height={r * 0.16} fill="#2E5EAA" />)}
        </g>
      </g>,
      <g>
        <path d={`M${-r * 1.06} ${H(0.1)} Q${-r * 1.1} ${H(1.34)} 0 ${H(1.34)} Q${r * 1.1} ${H(1.34)} ${r * 1.06} ${H(0.1)} L${r * 0.9} ${H(0.5)} Q0 ${H(0.62)} ${-r * 0.9} ${H(0.5)} Z`} fill={hc} {...o8} />
        <path d={`M${-r * 0.9} ${H(0.85)} Q0 ${H(1.05)} ${r * 0.9} ${H(0.85)}`} fill="none" stroke="#2E5EAA" strokeWidth={9} />
        <circle cx={0} cy={H(0.62)} r={r * 0.12} fill="#2E5EAA" stroke={OUT} strokeWidth={4} />
      </g>,
    ],
    knight: [
      <path d={`M0 ${H(1.5)} Q${-r * 0.5} ${H(2.3)} ${-r * 0.9} ${H(1.9)} Q${-r * 0.4} ${H(1.9)} 0 ${H(1.3)} Z`} fill="#D2363A" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />,
      <g>
        <path d={`M${-r * 1.04} ${H(0.3)} Q${-r * 1.0} ${H(1.3)} 0 ${H(1.6)} Q${r * 1.0} ${H(1.3)} ${r * 1.04} ${H(0.3)} Z`} fill={hc} {...o8} />
        <rect x={-r * 1.08} y={H(0.42)} width={r * 2.16} height={r * 0.22} rx={6} fill={light(hc, 0.3)} stroke={OUT} strokeWidth={6} />
        <rect x={-r * 0.1} y={H(0.3)} width={r * 0.2} height={r * 0.75} rx={5} fill={hc} stroke={OUT} strokeWidth={5} />
        <rect x={-r * 0.55} y={H(1.2)} width={11} height={r * 0.6} rx={5} fill="#FFFFFF" opacity={0.25} />
      </g>,
    ],
    army: [null, (
      <g>
        <path d={`M${-r * 1.06} ${H(0.42)} Q${-r * 1.06} ${H(1.38)} 0 ${H(1.38)} Q${r * 1.06} ${H(1.38)} ${r * 1.06} ${H(0.42)} Z`} fill={hc} {...o8} />
        <path d={`M${-r * 1.3} ${H(0.36)} Q0 ${H(0.62)} ${r * 1.3} ${H(0.36)}`} fill="none" stroke={OUT} strokeWidth={22} strokeLinecap="round" />
        <path d={`M${-r * 1.3} ${H(0.36)} Q0 ${H(0.62)} ${r * 1.3} ${H(0.36)}`} fill="none" stroke={hc} strokeWidth={10} strokeLinecap="round" />
        <path d={`M${-r * 0.7} ${H(0.8)} L${r * 0.4} ${H(1.2)} M${-r * 0.3} ${H(0.7)} L${r * 0.8} ${H(1.0)}`} stroke={dark(hc, 0.3)} strokeWidth={4} />
      </g>
    )],
    tricorn: [null, (
      <g>
        <path d={`M${-r * 1.5} ${H(0.55)} Q${-r * 0.9} ${H(1.0)} ${-r * 0.7} ${H(1.55)} Q0 ${H(1.85)} ${r * 0.7} ${H(1.55)} Q${r * 0.9} ${H(1.0)} ${r * 1.5} ${H(0.55)} Q0 ${H(0.95)} ${-r * 1.5} ${H(0.55)} Z`} fill={hc} {...o8} />
        <path d={`M${-r * 1.36} ${H(0.62)} Q0 ${H(1.0)} ${r * 1.36} ${H(0.62)}`} fill="none" stroke={SP_GOLD} strokeWidth={6} />
        <circle cx={0} cy={H(1.3)} r={r * 0.17} fill={SP_WHITE} stroke={OUT} strokeWidth={4} />
      </g>
    )],
    safari: [null, (
      <g>
        <ellipse cx={0} cy={H(0.45)} rx={r * 1.42} ry={r * 0.24} fill={dark(hc, 0.12)} {...o8} />
        <path d={`M${-r * 0.96} ${H(0.48)} Q${-r * 1.0} ${H(1.5)} 0 ${H(1.5)} Q${r * 1.0} ${H(1.5)} ${r * 0.96} ${H(0.48)} Z`} fill={hc} {...o8} />
        <rect x={-r * 0.97} y={H(0.72)} width={r * 1.94} height={r * 0.2} fill="#7A4A2A" />
      </g>
    )],
    sailor: [null, (
      <g>
        <path d={`M${-r * 0.82} ${H(0.62)} Q${-r * 0.82} ${H(1.32)} 0 ${H(1.32)} Q${r * 0.82} ${H(1.32)} ${r * 0.82} ${H(0.62)} Z`} fill={hc} {...o8} />
        <path d={`M${-r * 1.08} ${H(0.95)} Q${-r * 1.05} ${H(0.5)} 0 ${H(0.5)} Q${r * 1.05} ${H(0.5)} ${r * 1.08} ${H(0.95)} Q0 ${H(0.68)} ${-r * 1.08} ${H(0.95)} Z`} fill={hc} {...o8} />
        <rect x={-r * 0.8} y={H(0.86)} width={r * 1.6} height={r * 0.14} fill="#1E3E7A" />
      </g>
    )],
    aviator: [null, (
      <g>
        <path d={`M${-r * 1.04} ${H(-0.25)} Q${-r * 1.1} ${H(1.3)} 0 ${H(1.3)} Q${r * 1.1} ${H(1.3)} ${r * 1.04} ${H(-0.25)} L${r * 0.78} ${H(-0.25)} Q${r * 0.8} ${H(0.62)} 0 ${H(0.62)} Q${-r * 0.8} ${H(0.62)} ${-r * 0.78} ${H(-0.25)} Z`} fill={hc} {...o8} />
        <rect x={-r * 0.95} y={H(0.98)} width={r * 1.9} height={r * 0.16} fill="#3A2416" />
        {[-1, 1].map((sd) => <circle key={sd} cx={sd * r * 0.38} cy={H(1.02)} r={r * 0.26} fill="#7FD8FF" stroke={SP_GOLD} strokeWidth={7} />)}
      </g>
    )],
    space: [
      <circle cx={0} cy={head} r={r * 1.42} fill={hc} {...o8} />,
      <g>
        <circle cx={0} cy={head} r={r * 1.42} fill="#BEE8FF" opacity={0.12} stroke="none" />
        <path d={`M${-r * 0.95} ${H(0.6)} A${r * 1.15} ${r * 1.15} 0 0 1 ${-r * 0.2} ${H(1.12)}`} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
        <rect x={-r * 0.9} y={head + r * 1.18} width={r * 1.8} height={r * 0.32} rx={10} fill="#C9CEDC" stroke={OUT} strokeWidth={6} />
      </g>,
    ],
    nurse: [null, (
      <g>
        <path d={`M${-r * 0.72} ${H(0.72)} L${-r * 0.62} ${H(1.38)} H${r * 0.62} L${r * 0.72} ${H(0.72)} Q0 ${H(0.6)} ${-r * 0.72} ${H(0.72)} Z`} fill={hc} {...o8} />
        <rect x={-r * 0.08} y={H(1.28)} width={r * 0.16} height={r * 0.48} fill="#D2363A" />
        <rect x={-r * 0.24} y={H(1.12)} width={r * 0.48} height={r * 0.16} fill="#D2363A" />
      </g>
    )],
    chef: [null, (
      <g>
        {[-0.5, 0, 0.5].map((k) => <circle key={k} cx={r * k} cy={H(1.75 - Math.abs(k) * 0.3)} r={r * 0.5} fill={hc} {...o8} />)}
        <rect x={-r * 0.78} y={H(1.5)} width={r * 1.56} height={r * 0.8} fill={hc} stroke="none" />
        <rect x={-r * 0.82} y={H(1.0)} width={r * 1.64} height={r * 0.4} rx={6} fill={hc} {...o8} />
        <path d={`M${-r * 0.82} ${H(1.0)} L${-r * 0.95} ${H(1.6)} M${r * 0.82} ${H(1.0)} L${r * 0.95} ${H(1.6)}`} stroke={OUT} strokeWidth={8} />
      </g>
    )],
    straw: [null, (
      <g>
        <ellipse cx={0} cy={H(0.5)} rx={r * 1.62} ry={r * 0.28} fill={hc} {...o8} />
        <path d={`M${-r * 0.82} ${H(0.55)} Q${-r * 0.82} ${H(1.4)} 0 ${H(1.4)} Q${r * 0.82} ${H(1.4)} ${r * 0.82} ${H(0.55)} Z`} fill={hc} {...o8} />
        <rect x={-r * 0.82} y={H(0.78)} width={r * 1.64} height={r * 0.2} fill="#D2363A" />
      </g>
    )],
    grad: [null, (
      <g>
        <path d={`M${-r * 0.78} ${H(0.62)} V${H(1.12)} H${r * 0.78} V${H(0.62)} Q0 ${H(0.48)} ${-r * 0.78} ${H(0.62)} Z`} fill={hc} {...o8} />
        <path d={`M0 ${H(1.6)} L${r * 1.45} ${H(1.22)} L0 ${H(0.88)} L${-r * 1.45} ${H(1.22)} Z`} fill={hc} {...o8} />
        <path d={`M0 ${H(1.22)} L${r * 1.0} ${H(1.12)} V${H(0.5)}`} fill="none" stroke={SP_GOLD} strokeWidth={6} />
        <rect x={r * 0.92} y={H(0.55)} width={16} height={26} rx={4} fill={SP_GOLD} />
      </g>
    )],
    headband: [null, (
      <g clipPath={`url(#${f}__hc)`}>
        <rect x={-r - 10} y={H(0.66)} width={2 * r + 20} height={r * 0.3} fill={hc} stroke={OUT} strokeWidth={6} />
      </g>
    )],
    fedora: [null, (
      <g>
        <ellipse cx={0} cy={H(0.6)} rx={r * 1.42} ry={r * 0.22} fill={hc} {...o8} />
        <path d={`M${-r * 0.82} ${H(0.62)} L${-r * 0.72} ${H(1.42)} Q${-r * 0.3} ${H(1.55)} 0 ${H(1.35)} Q${r * 0.3} ${H(1.55)} ${r * 0.72} ${H(1.42)} L${r * 0.82} ${H(0.62)} Z`} fill={hc} {...o8} />
        <rect x={-r * 0.8} y={H(0.86)} width={r * 1.6} height={r * 0.2} fill="#1C1830" />
        <rect x={r * 0.25} y={H(1.12)} width={r * 0.34} height={r * 0.24} fill={SP_WHITE} stroke={OUT} strokeWidth={3} />
      </g>
    )],
  };
  const [hatBack, hatFront] = hats[hat] ?? [null, null];

  // ── hair (under the headwear) + beard + glasses
  const hairBack = hair === 'long'
    ? <path d={`M${-r * 1.1} ${-200 + b} Q${-r * 1.22} ${H(0.9)} 0 ${H(1.16)} Q${r * 1.22} ${H(0.9)} ${r * 1.1} ${-200 + b} Q0 ${-186 + b} ${-r * 1.1} ${-200 + b} Z`} fill={hairColor} {...o8} />
    : hair === 'bun' ? <circle cx={-r * 0.15} cy={H(1.12)} r={r * 0.4} fill={hairColor} {...o8} />
    : null;
  const hairFront = hair === 'long' || hair === 'short' || hair === 'bun'
    ? <path d={`M${-r * 1.04} ${H(0.3)} Q${-r * 1.06} ${H(1.12)} 0 ${H(1.1)} Q${r * 1.06} ${H(1.12)} ${r * 1.04} ${H(0.3)} Q${r * 0.7} ${H(0.8)} ${r * 0.1} ${H(0.7)} Q${-r * 0.6} ${H(0.72)} ${-r * 1.04} ${H(0.3)} Z`} fill={hairColor} {...o8} />
    : hair === 'bald' ? (
      <g>
        {[-1, 1].map((sd) => <ellipse key={sd} cx={sd * r * 0.98} cy={H(0.12)} rx={r * 0.24} ry={r * 0.36} fill={hairColor} stroke={OUT} strokeWidth={6} />)}
      </g>
    ) : null;
  const beardEl = beard && (
    <path d={`M${-rf * 0.95} ${head + rf * 0.05} Q${-rf * 0.9} ${head + rf * 1.35} ${rf * 0.05} ${head + rf * 1.4} Q${rf * 0.95} ${head + rf * 1.3} ${rf * 0.95} ${head + rf * 0.05} Q${rf * 0.1} ${head + rf * 0.6} ${-rf * 0.95} ${head + rf * 0.05} Z`} fill={beard} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
  );
  const glassesEl = glasses && (
    <g fill="none" stroke="#E8F4FF" strokeWidth={6} strokeLinecap="round">
      <circle cx={-rf * 0.26} cy={head - rf * 0.02} r={rf * 0.25} fill="#E8F4FF" fillOpacity={0.14} />
      <circle cx={rf * 0.46} cy={head - rf * 0.02} r={rf * 0.25} fill="#E8F4FF" fillOpacity={0.14} />
      <path d={`M${-rf * 0.01} ${head - rf * 0.05} H${rf * 0.21} M${-rf * 0.51} ${head - rf * 0.06} L${-rf * 0.92} ${head - rf * 0.16}`} />
    </g>
  );

  const frontArmsLate = pose === 'think' || pose === 'shock' || pose === 'cheer';
  const backArmFront = pose === 'hold' || pose === 'shock' || pose === 'cheer';
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * s} ${s})`}>
      <defs>
        <filter id={f} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
        <clipPath id={`${f}__hc`}>
          <circle cx={0} cy={head} r={r} />
        </clipPath>
        {checked && (
          <pattern id={`${f}__chk`} width={26} height={26} patternUnits="userSpaceOnUse">
            <rect width={26} height={26} fill={SP_WHITE} />
            <path d="M0 6 H26 M6 0 V26" stroke={hc} strokeWidth={6} />
          </pattern>
        )}
      </defs>
      <ellipse cx={0} cy={4} rx={95} ry={14} fill="#000" opacity={0.25} />
      {leg(-1)}
      {leg(1)}
      {!backArmFront && arm(-1)}
      {torso}
      {pose === 'hold' && propEl}
      {backArmFront && arm(-1)}
      {!frontArmsLate && arm(1)}
      {pose !== 'hold' && !frontArmsLate && propEl}
      {hairBack}
      {hatBack}
      <circle cx={0} cy={head} r={rf + 10} fill={rim} opacity={0.45} filter={`url(#${f})`} />
      <circle cx={0} cy={head} r={rf} fill={SP_SKIN} stroke={rim} strokeWidth={8} />
      {beardEl}
      {glassesEl}
      {hairFront}
      {hatFront}
      {frontArmsLate && arm(1)}
      {frontArmsLate && propEl}
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
