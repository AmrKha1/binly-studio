// Custom shots for C03 (builder-owned, AZTIKA). Each: export const S<n>: React.FC<{t: number}> returning the shot's WORLD
// (SVG, no <Stage>/<NightScreen> — the chapter provides them; NightShots joins, drifts and pins the host).
// C03 · Howells — the hard drive in the bin. Grey rain; gold only on the key / bitcoin.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp01, ease, lerp, popRef, pressIn} from '../../../kit/anim';
import {lb, uid} from '../../../kit/stage';
import {W, H} from '../../../kit/theme';
import {GlowText, NightSky, NPill, RevealRing, Sparkle, WordPop, YearBadge, textWidth} from '../../../kit/night';
import {Bubble, HeroObject, Mark, Rays, Bokeh} from '../../../kit/night-fx';
import {NightCity, PaperMap, RoomWorld, StoryPerson, StoryPropIcon} from '../../../kit/night-worlds';
import {MoneyPile} from '../../../kit/night-props';
import {Measure} from '../../../kit/night-story';
import {PlateFx, PlateWorld} from '../../../kit/night-places';
import {NightMap, nightProj} from '../../../kit/night-maps';
import {coinArt} from '../../../kit/night-objects';
import {move, moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {LandfillSlice, MistakeBill} from '../shared';
import {OUT, popAt} from '../shared/util';

const SLUG = 'ar-costly-mistakes';
const T = {
  s1: 109.4, ghalta: 110.88, hukuma: 111.24, budget: 111.78, // «غلطة حكومة بميزانية حكومة»
  s2: 112.94, normal: 114.4, home: 115.88, boxes: 116.63, // «شخص عادي جدًا، في بيته، وهو يرتب أغراضه»
  s3: 117.56, year: 117.8, newport: 119.6, wales: 120.28, // «سنة 2013، مدينة نيوبورت في ويلز»
  s4: 120.68, james: 121.58, clean: 122.44, throw: 123.4, // «جيمس هاولز ينظف بيته ويرمي الأشياء القديمة»
  s5: 124.58, drives: 124.88, same: 126.34, exact: 126.98, // «هارديسكين شكلهم نفس الشيء بالضبط»
  s6: 127.5, empty: 127.77, key: 129.18, btc: 130.02, // «واحد فاضي، والثاني فيه مفتاح محفظة بيتكوين»
  s8: 134.46, shuffle: 135.39, ramet: 137.14, wrong: 137.51, // «رميت الغلط»
  s9: 138.2, half: 139.96, notEnd: 141.87, // «نص مليون جنيه» · «مو نهاية العالم»
  s10: 143.68, flew: 144.02, today: 144.98, // «البيتكوين طار، واليوم»
  s11: 146.34, v590: 147.5, v630: 148.24, million: 149.32, // «بين 590 و630 مليون دولار»
  s13: 154.2, mt: 155.64, // «1.4 مليون … طن»
  s14: 158, narrow: 158.9, drive: 159.66, k100: 161.1, bas1: 162.26, bas2: 162.8, // «ضيّق … 100 ألف طن بس. "بس"»
  s16: 168.64, owned: 168.98, permit: 170.24, noDig: 171.8, // «ملك البلدية … تصاريح البيئة تمنع الحفر»
  s18: 176.88, buried: 177.5, city: 178.66, end: 179.48, // «مدفونة تحت زبالة مدينة كاملة»
};

const DRIVE = {src: `${SLUG}/el/hard-drive-blank.png`, ar: 1.172};
const GOLD = '#FFC928', CYAN = '#5CF2FF';

// ---------------------------------------------------------------- local helpers
/** a generated image, centred at x,y (h tall), optional glow (same look as HeroObject, but layerable + movable) */
const Pic: React.FC<{src: string; x: number; y: number; h: number; ar: number; o?: number; s?: number; rot?: number; glow?: string; id: string}> = ({src, x, y, h, ar, o = 1, s = 1, rot = 0, glow, id}) => {
  if (o <= 0.001 || s <= 0.001) return null;
  const w = h * ar;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} {...lb('object', id)}>
      <foreignObject x={-w / 2 - 50} y={-h / 2 - 50} width={w + 100} height={h + 100}>
        <div style={{position: 'relative', width: w + 100, height: h + 100}}>
          <Img src={staticFile(src)} style={{position: 'absolute', left: 50, top: 50, width: w, height: h, filter: glow ? `drop-shadow(0 0 10px ${glow}) drop-shadow(0 0 30px ${glow}aa)` : 'drop-shadow(0 10px 8px rgba(0,0,0,0.45))'}} />
        </div>
      </foreignObject>
    </g>
  );
};

/** an arc move (eased in and out via move()): returns [x, y, k] */
const arc = (t: number, at: number, from: [number, number], to: [number, number], lift: number, dur = 0): [number, number, number] => {
  const [x, y] = move(t, at, from, to, dur);
  const dist = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
  const k = clamp01(Math.hypot(x - from[0], y - from[1]) / dist);
  return [x, y - lift * Math.sin(Math.PI * k), k];
};

const Glow: React.FC<{x: number; y: number; r: number; color: string; o?: number; id: string}> = ({x, y, r, color, o = 1, id}) => {
  const g = uid('c3glow', id);
  if (o <= 0.01) return null;
  return (
    <g opacity={o}>
      <defs>
        <radialGradient id={g}>
          <stop offset="0" stopColor={color} stopOpacity={0.85} />
          <stop offset="0.35" stopColor={color} stopOpacity={0.35} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${g})`} />
    </g>
  );
};

/** a cardboard box (flat, thick outline, tape stripe) */
const CardBox: React.FC<{x: number; y: number; w: number; h: number; rot?: number; s?: number}> = ({x, y, w, h, rot = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-w / 2} y={-h} width={w} height={h} rx={8} fill="#C98A4B" stroke={OUT} strokeWidth={6} />
    <rect x={w * 0.18} y={-h + 6} width={w * 0.3} height={h - 12} fill="#A86C35" />
    <rect x={-w / 2} y={-h} width={w} height={h * 0.22} fill="#DDA466" stroke={OUT} strokeWidth={6} />
    <rect x={-w * 0.09} y={-h} width={w * 0.18} height={h} fill="#E9D9A8" opacity={0.85} />
    <rect x={-w / 2 + 12} y={-h + h * 0.3} width={8} height={h * 0.55} rx={4} fill="#FFFFFF" opacity={0.6} />
  </g>
);

/** dark room + one hanging lamp + table: the shell-game stage */
const Lamp: React.FC<{t: number; id: string; tableY: number; cx?: number}> = ({t, id, tableY, cx = 960}) => {
  const g = uid('c3lamp', id);
  const sw = Math.sin(t * 0.9) * 6;
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF1C8" stopOpacity={0.5} />
          <stop offset="1" stopColor="#FFF1C8" stopOpacity={0.04} />
        </linearGradient>
        <radialGradient id={g + 'p'}>
          <stop offset="0" stopColor="#FFE9B0" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFE9B0" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={g + 't'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5A3A5E" />
          <stop offset="1" stopColor="#24142E" />
        </linearGradient>
      </defs>
      {/* table */}
      <rect x={-40} y={tableY} width={W + 80} height={H - tableY + 40} fill={`url(#${g}t)`} stroke={OUT} strokeWidth={8} />
      <rect x={-40} y={tableY + 6} width={W + 80} height={10} fill="#8A6390" opacity={0.7} />
      <ellipse cx={cx} cy={tableY + 60} rx={760} ry={120} fill={`url(#${g}p)`} />
      {/* cone + shade */}
      <path d={`M${cx + sw - 110} 150 L${cx - 720} ${tableY + 40} L${cx + 720} ${tableY + 40} L${cx + sw + 110} 150 Z`} fill={`url(#${g})`} />
      <line x1={cx} y1={-20} x2={cx + sw} y2={90} stroke={OUT} strokeWidth={8} />
      <path d={`M${cx + sw - 60} 90 L${cx + sw + 60} 90 L${cx + sw + 120} 152 L${cx + sw - 120} 152 Z`} fill="#3B2A6A" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
      <ellipse cx={cx + sw} cy={154} rx={70} ry={12} fill="#FFF6D8" />
    </g>
  );
};

const DarkWall: React.FC<{t: number; id: string}> = ({t, id}) => {
  const g = uid('c3wall', id);
  return (
    <g>
      <defs>
        <radialGradient id={g} cx="0.5" cy="0.25" r="0.85">
          <stop offset="0" stopColor="#2B1A55" />
          <stop offset="1" stopColor="#0B0420" />
        </radialGradient>
      </defs>
      <rect x={-40} y={-40} width={W + 80} height={H + 80} fill={`url(#${g})`} />
      <Bokeh t={t} n={10} color="#7D6BFF" seed={7} />
    </g>
  );
};

/** a drive on the table: image + table shadow; x-ray mode draws the cyan see-through outline */
const TableDrive: React.FC<{x: number; y: number; h: number; s?: number; o?: number; xray?: number; empty?: number; keyGlow?: number; id: string; tableY: number}> = ({x, y, h, s = 1, o = 1, xray = 0, empty = 0, keyGlow = 0, id, tableY}) => {
  const w = h * DRIVE.ar;
  const g = uid('c3xr', id);
  return (
    <g>
      <ellipse cx={x} cy={tableY + 30} rx={w * 0.42 * s} ry={22 * s} fill="#000" opacity={0.35 * o} />
      <Glow x={x} y={y} r={h * 0.9 * s} color={GOLD} o={keyGlow * o} id={id + 'kg'} />
      <Pic {...DRIVE} x={x} y={y} h={h} s={s} o={o * (1 - 0.75 * xray)} glow={keyGlow > 0.3 ? GOLD : undefined} id={id} />
      {xray > 0.01 && (
        <g transform={`translate(${x} ${y}) scale(${s})`} opacity={xray * o}>
          <defs>
            <filter id={g} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={9} /></filter>
          </defs>
          <rect x={-w * 0.42} y={-h * 0.36} width={w * 0.84} height={h * 0.72} rx={26} fill="#0A3A55" opacity={0.55} />
          <rect x={-w * 0.42} y={-h * 0.36} width={w * 0.84} height={h * 0.72} rx={26} fill="none" stroke={CYAN} strokeWidth={14} filter={`url(#${g})`} />
          <rect x={-w * 0.42} y={-h * 0.36} width={w * 0.84} height={h * 0.72} rx={26} fill="none" stroke={CYAN} strokeWidth={6} />
          <circle cx={-w * 0.08} cy={0} r={h * 0.22} fill="none" stroke={CYAN} strokeWidth={5} opacity={0.8} />
          <circle cx={-w * 0.08} cy={0} r={h * 0.04} fill={CYAN} />
          <line x1={w * 0.12} y1={h * 0.2} x2={w * 0.32} y2={-h * 0.18} stroke={CYAN} strokeWidth={6} strokeLinecap="round" opacity={0.8} />
          {empty > 0.01 && (
            <rect x={-w * 0.3} y={-h * 0.26} width={w * 0.6} height={h * 0.52} rx={18} fill="none" stroke="#B9B4CC" strokeWidth={6} strokeDasharray="18 14" opacity={empty} />
          )}
        </g>
      )}
    </g>
  );
};

const Rain: React.FC<{t: number; density?: number; seed?: number}> = ({t, density = 1, seed = 3}) => <PlateFx t={t} kind="rain" density={density} seed={seed} />;

// ---------------------------------------------------------------- S1 · 109.40 · «لكن هذي على الأقل غلطة حكومة بميزانية حكومة»
export const S1: React.FC<{t: number}> = ({t}) => {
  const pile = ease.out(clamp01((t - (T.budget - 0.15)) / 0.6));
  if (t >= T.budget - 0.15) cueSfx('coins', 'c3-s1-pile', t < T.budget + 0.3, 1660, {at: T.budget - 0.15, hit: 0.3, gain: 0.7});
  return (
    <>
      <NightSky t={t} id="c3s1" />
      <NightCity t={t} id="c3s1c" base={1030} />
      <RevealRing t={t} at={109.5} x={1180} y={560} r={330} boom={false} />
      <HeroObject t={t} at={109.45} src={`${SLUG}/el/bank-building.png`} ar={1.035} x={1180} y={560} h={600} glow={GOLD} id="c3s1-hall" sparkles={3} />
      {pile > 0 && <MoneyPile t={t} x={1640} y={1000} s={0.75} grow={pile} id="c3s1-money" />}
      <NPill text="ميزانية حكومة" x={1180} y={925} size={52} kind="white" id="c3s1-pill" p={(t - (T.budget - 0.1)) / 0.3} />
      <WordPop t={t} id="c3s1-w" y={150} size={124} right={1780} words={[{w: 'غلطة', at: T.ghalta - 0.1}, {w: 'حكومة', at: T.hukuma - 0.1, tone: 'gold'}]} />
    </>
  );
};

// ---------------------------------------------------------------- S2 · 112.94 · «الغلطة الجاية سواها شخص عادي جدًا، في بيته، وهو يرتب أغراضه»
const House: React.FC<{t: number; x: number; y: number; lit: number; who: number; id: string}> = ({t, x, y, lit, who, id}) => {
  const g = uid('c3house', id);
  const wallW = 600, wallH = 330;
  const win = (wx: number) => (
    <g>
      <rect x={wx - 75} y={y - 270} width={150} height={140} rx={10} fill={lit > 0 ? '#FFD27A' : '#1A1440'} opacity={1} stroke={OUT} strokeWidth={7} />
      <rect x={wx - 75} y={y - 270} width={150} height={140} rx={10} fill="#1A1440" opacity={1 - lit} />
    </g>
  );
  const fx = moveTo(t, T.boxes - 0.1, -120, 110, 1.4);
  return (
    <g>
      <defs>
        <clipPath id={g}><rect x={x + 110 - 75} y={y - 270} width={150} height={140} rx={10} /></clipPath>
      </defs>
      <Glow x={x} y={y - 200} r={420} color="#FFD27A" o={lit * 0.55} id={id + 'g'} />
      {/* walls + roof */}
      <rect x={x - wallW / 2} y={y - wallH} width={wallW} height={wallH} fill="#6E5A8C" stroke={OUT} strokeWidth={8} />
      <rect x={x + wallW / 2 - 90} y={y - wallH} width={90} height={wallH} fill="#4E3E6A" />
      <path d={`M${x - wallW / 2 - 50} ${y - wallH} L${x} ${y - wallH - 210} L${x + wallW / 2 + 50} ${y - wallH} Z`} fill="#3A2A5C" stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
      <path d={`M${x - wallW / 2 - 20} ${y - wallH - 10} L${x} ${y - wallH - 190}`} stroke="#8C7AB8" strokeWidth={8} strokeLinecap="round" />
      <rect x={x + 150} y={y - wallH - 190} width={60} height={110} fill="#4E3E6A" stroke={OUT} strokeWidth={7} />
      {/* windows */}
      {win(x - 110)}
      {win(x + 110)}
      {/* someone moving boxes behind the right window */}
      {who > 0 && (
        <g clipPath={`url(#${g})`} opacity={who}>
          <g transform={`translate(${x + 110 + fx} ${y - 130})`}>
            <circle cx={0} cy={-95} r={26} fill="#2A1A3E" />
            <rect x={-30} y={-68} width={60} height={80} rx={20} fill="#2A1A3E" />
            <rect x={14} y={-70} width={56} height={46} rx={4} fill="#7A4E2A" />
          </g>
        </g>
      )}
      {/* door + steps */}
      <rect x={x - 45} y={y - 170} width={90} height={170} rx={8} fill="#4A2A1E" stroke={OUT} strokeWidth={7} />
      <circle cx={x + 25} cy={y - 85} r={7} fill={GOLD} />
      <rect x={x - wallW / 2 - 20} y={y - 6} width={wallW + 40} height={18} fill="#2A2040" stroke={OUT} strokeWidth={5} />
      {/* boxes waiting outside */}
      <CardBox x={x - 230} y={y} w={110} h={90} />
      <CardBox x={x - 225} y={y - 90} w={86} h={70} rot={-4} />
    </g>
  );
};
export const S2: React.FC<{t: number}> = ({t}) => {
  const [ox, oy] = move(t, T.s2 + 0.05, [-260, 560], [0, 0], 1.1);
  const lit = ease.out(clamp01((t - T.home) / 0.35));
  const who = ease.out(clamp01((t - T.boxes) / 0.3));
  cueSfx('click', 'c3-s2-light', t >= T.home && t < T.home + 0.2, 1250, {at: T.home, hit: 0.05});
  return (
    <>
      <NightSky t={t} id="c3s2" />
      <rect x={0} y={0} width={W} height={H} fill="#2A3048" opacity={0.35} />
      <g transform={`translate(${ox} ${oy})`}>
        <g opacity={0.55}><NightCity t={t} id="c3s2c" base={940} /></g>
        <Pic src={`${SLUG}/el/bank-building.png`} ar={1.035} x={1420} y={-330} h={640} glow={GOLD} id="c3s2-hall" />
        <rect x={-400} y={930} width={W + 800} height={400} fill="#1D1830" stroke={OUT} strokeWidth={8} />
        <rect x={-400} y={1010} width={W + 800} height={10} fill="#3A3458" />
        <House t={t} x={1250} y={935} lit={lit} who={who} id="c3s2h" />
      </g>
      <Rain t={t} density={1.2} seed={5} />
      <NPill text="شخص عادي" x={1250} y={330} size={56} kind="white" id="c3s2-pill" p={(t - (T.normal - 0.1)) / 0.3} />
    </>
  );
};

// ---------------------------------------------------------------- S3 · 117.56 · «سنة 2013، مدينة نيوبورت في ويلز»
const WALES: [number, number][] = [
  [-3.05, 53.33], [-3.4, 53.35], [-4.05, 53.3], [-4.35, 53.42], [-4.6, 53.3], [-4.55, 53.05], [-4.75, 52.8], [-4.2, 52.9],
  [-4.1, 52.6], [-4.05, 52.3], [-4.6, 52.1], [-5.3, 51.88], [-5.05, 51.62], [-4.3, 51.67], [-4.05, 51.56], [-3.6, 51.45],
  [-3.15, 51.4], [-2.65, 51.62], [-2.95, 51.9], [-3.1, 52.1], [-2.98, 52.55], [-3.12, 52.95], [-2.75, 53.05], [-3.05, 53.33],
];
export const S3: React.FC<{t: number}> = ({t}) => {
  const MX = 460, MY = 40, MW = 1000, MH = 1000;
  const pj = nightProj('british-isles', MW, MH, MX, MY);
  const wd = 'M' + WALES.map(([lo, la]) => pj(lo, la).map((v) => v.toFixed(1)).join(' ')).join(' L') + ' Z';
  const [nx, ny] = pj(-2.99, 51.58);
  const [wx, wy] = pj(-3.75, 52.35);
  const sp = ease.inOut(clamp01((t - T.year) / 1.0));
  const z = moveTo(t, T.year + 0.2, 1, 1.45, 1.6);
  const g = uid('c3wales', 'a');
  const pin = clamp01((t - (T.newport - 0.1)) / 0.35);
  const pinY = ny - (1 - ease.out(pin)) * 160;
  if (t >= T.year) cueSfx('whoosh', 'c3-s3-wales', t < T.year + 0.4, wx, {at: T.year, hit: 0.3, gain: 0.7});
  if (pin > 0) cueSfx('thump', 'c3-s3-pin', pin < 1, nx, {at: T.newport - 0.1, hit: 0.3});
  return (
    <>
      <PaperMap t={t} id="c3s3p" />
      <g transform={`translate(${wx} ${wy}) scale(${z}) translate(${-wx} ${-wy})`}>
        <NightMap t={t} id="c3s3m" region="british-isles" x={MX} y={MY} w={MW} h={MH} areas={[
          {countries: ['United Kingdom'], fill: '#F3EAD3'},
          {countries: ['Ireland'], fill: '#D8CDB3'},
        ]} />
        <defs><clipPath id={g}><circle cx={nx} cy={ny} r={420 * sp} /></clipPath></defs>
        {sp > 0 && (
          <g clipPath={`url(#${g})`}>
            <path d={wd} fill="#F2B51C" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
            <path d={wd} fill="none" stroke="#FFE38A" strokeWidth={3} strokeLinejoin="round" opacity={0.8} transform="translate(-3 -3)" />
          </g>
        )}
        {pin > 0 && (
          <g transform={`translate(${nx} ${pinY})`} opacity={clamp01(pin * 4)}>
            <ellipse cx={0} cy={4} rx={16} ry={6} fill="#000" opacity={0.3} />
            <path d="M0 0 C -10 -22 -30 -34 -30 -56 A30 30 0 1 1 30 -56 C 30 -34 10 -22 0 0 Z" fill="#E23A4E" stroke={OUT} strokeWidth={6} />
            <circle cx={0} cy={-56} r={11} fill="#FFFFFF" />
          </g>
        )}
        <NPill text="نيوبورت" x={nx + 150} y={ny + 40} size={40} kind="white" id="c3s3-np" p={(t - T.newport) / 0.3} />
        <NPill text="ويلز" x={wx - 20} y={wy - 40} size={40} kind="gold" id="c3s3-wl" p={(t - (T.wales - 0.1)) / 0.3} />
      </g>
      <YearBadge t={t} at={T.year - 0.1} year={2013} from={2025} x={1640} y={210} label="سنة" id="c3s3-y" />
    </>
  );
};

// ---------------------------------------------------------------- S4 · 120.68 · «شاب اسمه جيمس هاولز ينظف بيته ويرمي الأشياء القديمة»
const Junk: React.FC<{kind: 'box' | 'cable' | 'lamp'}> = ({kind}) =>
  kind === 'box' ? (
    <CardBox x={0} y={45} w={110} h={90} />
  ) : kind === 'cable' ? (
    <g>
      <path d="M-50 10 C -60 -40 20 -50 30 -10 C 40 30 -30 40 -30 0 C -30 -25 10 -25 12 0" fill="none" stroke={OUT} strokeWidth={16} strokeLinecap="round" />
      <path d="M-50 10 C -60 -40 20 -50 30 -10 C 40 30 -30 40 -30 0 C -30 -25 10 -25 12 0" fill="none" stroke="#8C8FA8" strokeWidth={9} strokeLinecap="round" />
      <rect x={-64} y={8} width={28} height={22} rx={4} fill="#3A3A50" stroke={OUT} strokeWidth={5} />
    </g>
  ) : (
    <g>
      <rect x={-34} y={30} width={68} height={16} rx={6} fill="#5A5470" stroke={OUT} strokeWidth={5} />
      <line x1={0} y1={30} x2={-10} y2={-20} stroke={OUT} strokeWidth={9} />
      <path d="M-50 -20 L30 -20 L10 -60 L-30 -60 Z" fill="#C8B5E8" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
export const S4: React.FC<{t: number}> = ({t}) => {
  const BAG: [number, number] = [1300, 860];
  const pose = t >= T.throw - 0.1 ? 'up' : t >= T.clean - 0.1 ? 'hold' : 'idle';
  const [bxp, byp] = move(t, T.clean - 0.1, [1010, 1000], [905, 770], 0.45);
  const items: {kind: 'box' | 'cable' | 'lamp'; at: number}[] = [
    {kind: 'box', at: T.throw - 0.1},
    {kind: 'cable', at: T.throw + 0.05},
    {kind: 'lamp', at: T.throw + 0.2},
  ];
  const hit = items.map((it) => clamp01((t - (it.at + 0.55)) / 0.3));
  const bump = hit.reduce((a, h) => a + (h > 0 && h < 1 ? Math.sin(h * Math.PI) : 0), 0);
  const winG = uid('c3s4w', 'a');
  return (
    <>
      <RoomWorld t={t} id="c3s4r" />
      {/* grey rainy window */}
      <defs><clipPath id={winG}><rect x={1370} y={95} width={420} height={465} rx={22} /></clipPath></defs>
      <g clipPath={`url(#${winG})`}>
        <rect x={1370} y={95} width={420} height={465} fill="#4A5270" opacity={0.85} />
        <Rain t={t} density={1.4} seed={9} />
      </g>
      {/* clutter */}
      <CardBox x={420} y={1010} w={210} h={170} />
      <CardBox x={440} y={840} w={170} h={130} rot={-3} />
      <CardBox x={640} y={1015} w={150} h={120} rot={2} />
      <path d="M560 1012 C 600 960 700 980 720 1010" fill="none" stroke="#7E819A" strokeWidth={10} strokeLinecap="round" />
      {/* the bin bag by the door */}
      <ellipse cx={BAG[0]} cy={BAG[1] + 150} rx={140} ry={22} fill="#000" opacity={0.35} />
      <g transform={`translate(${BAG[0]} ${BAG[1]}) scale(${1 + 0.06 * bump} ${1 - 0.05 * bump}) translate(${-BAG[0]} ${-BAG[1]})`}>
        <Pic src={`${SLUG}/el/trash-bag.png`} ar={0.931} x={BAG[0]} y={BAG[1]} h={320} id="c3s4-bag" />
      </g>
      <StoryPerson t={t} x={820} y={1015} s={1.15} outfit="hoodie" pose={pose} id="c3s4-howells" />
      {/* the box he picks up */}
      {t < T.throw - 0.1 && <CardBox x={bxp} y={byp} w={130} h={100} />}
      {items.map((it, i) => {
        if (t < it.at) return null;
        const [x, y, k] = arc(t, it.at, [900, 700], [BAG[0], BAG[1] - 90], 240, 0.55);
        cueSfx('swish', `c3-s4-throw-${i}`, t < it.at + 0.3, x, {at: it.at, hit: 0.25, gain: 0.7});
        cueSfx('thump', `c3-s4-land-${i}`, t >= it.at + 0.55 && t < it.at + 0.8, BAG[0], {at: it.at + 0.55, hit: 0.02, gain: 0.6});
        const o = 1 - clamp01((k - 0.85) / 0.15);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${k * 220 * (i % 2 ? -1 : 1)}) scale(${1 - 0.35 * k})`} opacity={o}>
            <Junk kind={it.kind} />
          </g>
        );
      })}
      <NPill text="جيمس هاولز" x={820} y={470} size={52} kind="white" id="c3s4-name" p={(t - (T.james - 0.1)) / 0.3} />
    </>
  );
};

// ---------------------------------------------------------------- S5 · 124.58 · «وعنده هارديسكين شكلهم نفس الشيء بالضبط»
const L5: [number, number] = [700, 520], R5: [number, number] = [1220, 520];
/** shell-game positions of drive A (starts left) and B (starts right): swaps at s1 and s2 */
const shell = (t: number, s1: number, s2: number): {a: [number, number]; b: [number, number]} => {
  const sw = (t0: number, from: [number, number], to: [number, number], lift: number) => {
    const [x, y] = arc(t, t0, from, to, lift, 0.46);
    return [x, y] as [number, number];
  };
  if (t < s2) return {a: sw(s1, L5, R5, 90), b: sw(s1, R5, L5, -60)};
  return {a: sw(s2, R5, L5, -60), b: sw(s2, L5, R5, 90)};
};
export const S5: React.FC<{t: number}> = ({t}) => {
  const TY = 740;
  const s1 = T.same, s2 = T.same + 0.5;
  const {a, b} = shell(t, s1, s2);
  const qa = popAt(t, T.drives - 0.1), qb = popAt(t, T.drives + 0.02);
  cueSfx('pop', 'c3-s5-a', t >= T.drives - 0.1 && t < T.drives + 0.2, L5[0], {at: T.drives - 0.1, hit: 0.125});
  cueSfx('pop', 'c3-s5-b', t >= T.drives + 0.02 && t < T.drives + 0.3, R5[0], {at: T.drives + 0.02, hit: 0.125});
  cueSfx('swish', 'c3-s5-sw1', t >= s1 && t < s1 + 0.3, 960, {at: s1, hit: 0.23});
  cueSfx('swish', 'c3-s5-sw2', t >= s2 && t < s2 + 0.3, 960, {at: s2, hit: 0.23});
  return (
    <>
      <DarkWall t={t} id="c3s5" />
      <Lamp t={t} id="c3s5l" tableY={TY} />
      <TableDrive x={a[0]} y={a[1]} h={380} s={qa.s} o={qa.o} id="c3s5-a" tableY={TY} />
      <TableDrive x={b[0]} y={b[1]} h={380} s={qb.s} o={qb.o} id="c3s5-b" tableY={TY} />
      <NPill text="نفس الشيء بالضبط" x={960} y={890} size={56} kind="gold" id="c3s5-pill" p={(t - (T.exact - 0.1)) / 0.3} />
    </>
  );
};

// ---------------------------------------------------------------- S6 · 127.50 · «واحد فاضي، والثاني فيه مفتاح محفظة بيتكوين»
export const S6: React.FC<{t: number}> = ({t}) => {
  const TY = 740;
  const xr = ease.inOut(clamp01((t - T.s6 + 0.05) / 0.35));
  const scan = clamp01((t - T.s6 + 0.05) / 0.45);
  const emp = ease.out(clamp01((t - T.empty) / 0.3));
  if (t >= T.s6) cueSfx('sweep_down', 'c3-s6-scan', t < T.s6 + 0.3, 960, {at: T.s6, hit: 0.2, gain: 0.6});
  return (
    <>
      <DarkWall t={t} id="c3s6" />
      <Lamp t={t} id="c3s6l" tableY={TY} />
      <rect x={0} y={0} width={W} height={H} fill="#03202E" opacity={0.35 * xr} />
      <TableDrive x={L5[0]} y={L5[1]} h={380} xray={xr} empty={emp} id="c3s6-a" tableY={TY} />
      <TableDrive x={R5[0]} y={R5[1]} h={380} xray={xr} keyGlow={0.6 * ease.out(clamp01((t - T.key) / 0.4))} id="c3s6-b" tableY={TY} />
      {scan > 0 && scan < 1 && <rect x={0} y={lerp(-20, H, ease.inOut(scan))} width={W} height={10} fill={CYAN} opacity={0.6} />}
      <RevealRing t={t} at={T.key - 0.05} x={R5[0]} y={R5[1]} r={240} boom={false} />
      <HeroObject t={t} at={T.key - 0.1} src={`${SLUG}/el/gold-key.png`} ar={1.003} x={R5[0] - 30} y={R5[1]} h={230} glow={GOLD} sparkles={3} id="c3s6-key" />
      <HeroObject t={t} at={T.btc - 0.1} draw={coinArt('₿')} ar={1} x={R5[0] + 210} y={R5[1] - 190} h={130} glow={GOLD} sparkles={2} id="c3s6-coin" />
      <NPill text="فاضي" x={L5[0]} y={850} size={52} kind="grey" id="c3s6-empty" p={(t - (T.empty - 0.05)) / 0.3} />
      <NPill text="مفتاح محفظة بيتكوين" x={R5[0]} y={850} size={52} kind="gold" id="c3s6-key-p" p={(t - (T.key + 0.1)) / 0.3} />
    </>
  );
};

// ---------------------------------------------------------------- S8 ★ 134.46 · «وهو بنفسه قالها بعدين ببساطة: رميت الغلط»
const BinBagBack: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={0} rx={250} ry={70} fill="#1B1B28" stroke={OUT} strokeWidth={8} />
    <ellipse cx={0} cy={10} rx={215} ry={50} fill="#05030A" />
  </g>
);
const BinBagFront: React.FC<{x: number; y: number; squash: number}> = ({x, y, squash}) => {
  const lip = Array.from({length: 9}, (_, i) => {
    const u = -1 + (2 * i) / 8;
    const px = u * 245, py = Math.sqrt(Math.max(0, 1 - u * u)) * 70;
    return `L${px.toFixed(1)} ${(py + (i % 2 ? 16 : 0)).toFixed(1)}`;
  }).join(' ');
  return (
    <g transform={`translate(${x} ${y}) scale(${1 + 0.05 * squash} ${1 - 0.04 * squash})`}>
      <path d={`M-250 0 ${lip} L250 0 C 300 160 330 330 260 420 L-260 420 C -330 330 -300 160 -250 0 Z`} fill="#22222F" stroke={OUT} strokeWidth={9} strokeLinejoin="round" />
      <path d="M-200 90 C -230 200 -230 300 -190 390" fill="none" stroke="#4E4E66" strokeWidth={14} strokeLinecap="round" />
      <path d="M150 110 C 190 200 190 290 170 370" fill="none" stroke="#33334A" strokeWidth={10} strokeLinecap="round" />
      <path d="M-40 60 C -10 140 -60 220 -20 300" fill="none" stroke="#2E2E40" strokeWidth={8} strokeLinecap="round" />
    </g>
  );
};
export const S8: React.FC<{t: number}> = ({t}) => {
  const TY = 700;
  const L: [number, number] = [780, 560], R: [number, number] = [1180, 560];
  const BAG: [number, number] = [470, 790];
  const tGrab = 136.55, tLift = 136.6, tCarry = 136.82, tDrop = T.ramet;
  // G = the drive with the key (starts right), E = the empty one
  let g: [number, number];
  let e: [number, number];
  if (t < tLift) {
    const [gx, gy] = arc(t, T.shuffle, R, L, 90, 0.46);
    const [ex, ey] = arc(t, T.shuffle, L, R, -50, 0.46);
    g = [gx, gy];
    e = [ex, ey];
  } else {
    e = R;
    if (t < tCarry) g = move(t, tLift, L, [L[0], L[1] - 90], 0.2);
    else if (t < tDrop) g = move(t, tCarry, [L[0], L[1] - 90], [BAG[0], BAG[1] - 260], 0.3);
    else {
      const u = clamp01((t - tDrop) / 0.3);
      g = [BAG[0], lerp(BAG[1] - 260, BAG[1] + 140, ease.in(u))];
    }
  }
  const fall = clamp01((t - tDrop) / 0.3);
  const swallow = clamp01((t - (tDrop + 0.18)) / 0.25);
  const landed = t >= tDrop + 0.3;
  const squash = landed ? Math.max(0, Math.sin(clamp01((t - tDrop - 0.3) / 0.3) * Math.PI)) : 0;
  const puff = landed ? Math.max(0, 1 - (t - tDrop - 0.3) / 0.4) : 0;
  // the hand: down from the top onto G, carries it, lets go and pulls back up
  const handIn = move(t, tGrab - 0.42, [L[0], -160], [L[0], L[1] - 140], 0.42);
  let hand: [number, number] = handIn;
  if (t >= tLift) hand = [g[0], g[1] - 140];
  if (t >= tDrop) hand = move(t, tDrop, [BAG[0], BAG[1] - 400], [BAG[0] + 120, -220], 0.5);
  // camera: slow push on the table, then tilt down with the fall
  const z = moveTo(t, T.s8, 1, 1.1, 2.0);
  const ty = moveTo(t, tDrop - 0.05, 0, -90, 0.5);
  const glowK = (t < tDrop ? 0.85 + 0.15 * Math.sin(t * 4) : 1 - swallow) * (t < T.s8 + 0.1 ? 0.6 : 1);
  cueSfx('swish', 'c3-s8-shuffle', t >= T.shuffle && t < T.shuffle + 0.3, 960, {at: T.shuffle, hit: 0.23});
  cueSfx('swish', 'c3-s8-hand', t >= tGrab - 0.42 && t < tGrab - 0.1, L[0], {at: tGrab - 0.42, hit: 0.3, gain: 0.6});
  cueSfx('whoosh', 'c3-s8-drop', t >= tDrop && t < tDrop + 0.3, BAG[0], {at: tDrop, hit: 0.25, gain: 0.7});
  const winG = uid('c3s8w', 'a');
  return (
    <>
      <DarkWall t={t} id="c3s8" />
      <g transform={`translate(0 ${ty}) translate(960 600) scale(${z}) translate(-960 -600)`}>
        {/* rain window, back wall */}
        <defs><clipPath id={winG}><rect x={170} y={110} width={380} height={400} rx={18} /></clipPath></defs>
        <rect x={170} y={110} width={380} height={400} rx={18} fill="#3B4466" />
        <g clipPath={`url(#${winG})`}><Rain t={t} density={1.6} seed={11} /></g>
        <rect x={170} y={110} width={380} height={400} rx={18} fill="none" stroke={OUT} strokeWidth={10} />
        <line x1={360} y1={110} x2={360} y2={510} stroke={OUT} strokeWidth={8} />
        <line x1={170} y1={310} x2={550} y2={310} stroke={OUT} strokeWidth={8} />
        <Lamp t={t} id="c3s8l" tableY={TY} />
        <TableDrive x={e[0]} y={e[1]} h={300} id="c3s8-e" tableY={TY} />
        {t < tDrop + 0.05 && <TableDrive x={g[0]} y={g[1]} h={300} keyGlow={glowK} id="c3s8-g" tableY={t < tLift ? TY : 2000} />}
        {/* the bin bag in the foreground swallows it */}
        <BinBagBack x={BAG[0]} y={BAG[1]} />
        {t >= tDrop + 0.05 && (
          <g>
            <Glow x={g[0]} y={g[1]} r={300 * (1 - 0.5 * swallow)} color={GOLD} o={glowK} id="c3s8-fg" />
            <Pic {...DRIVE} x={g[0]} y={g[1]} h={300} rot={fall * 25} glow={swallow < 0.5 ? GOLD : undefined} id="c3s8-fall" />
          </g>
        )}
        <BinBagFront x={BAG[0]} y={BAG[1]} squash={squash} />
        <Glow x={BAG[0]} y={BAG[1] - 20} r={260} color={GOLD} o={puff * 0.8} id="c3s8-puff" />
        {/* the gold-rim hand */}
        {t > tGrab - 0.45 && t < tDrop + 0.55 && (
          <g>
            <line x1={hand[0] + 60} y1={-300} x2={hand[0]} y2={hand[1]} stroke={OUT} strokeWidth={92} strokeLinecap="round" />
            <line x1={hand[0] + 60} y1={-300} x2={hand[0]} y2={hand[1]} stroke="#4A2F86" strokeWidth={76} strokeLinecap="round" />
            <circle cx={hand[0]} cy={hand[1] + 40} r={52} fill="#1A1040" stroke={GOLD} strokeWidth={8} />
          </g>
        )}
      </g>
      <StoryPerson t={t} x={1740} y={1130} s={1.2} outfit="hoodie" pose={t >= T.wrong ? 'shock' : 'idle'} flip id="c3s8-howells" />
      <Bubble t={t} at={T.wrong - 0.05} lines={['رميت الغلط']} x={1380} y={250} tx={1690} ty={640} size={66} mark="cross" />
    </>
  );
};

// ---------------------------------------------------------------- S9 · 138.20 · «وقتها قيمتها كانت حوالي نص مليون جنيه إسترليني. مبلغ كبير بس مو نهاية العالم»
export const S9: React.FC<{t: number}> = ({t}) => {
  const bu = clamp01((t - T.notEnd) / 0.3);
  const bump = bu > 0 && bu < 1 ? popRef(bu).s : 1;
  return (
    <>
      <NightSky t={t} id="c3s9" />
      <Rays t={t} id="c3s9r" x={1200} y={520} tone="violet" />
      <g transform={`translate(1200 470) scale(${bump}) translate(-1200 -470)`}>
        <MistakeBill t={t} at={T.s9 + 0.05} x={1200} y={470} w={920} s={1.2} title="فاتورة هاولز" id="c3-bill-a"
          rows={[{label: 'وقتها', value: 'نص مليون جنيه', at: T.half - 0.1}]} />
      </g>
      <NPill text="مو نهاية العالم" x={1200} y={780} size={48} kind="grey" id="c3s9-grey" p={(t - T.notEnd) / 0.3} />
    </>
  );
};

// ---------------------------------------------------------------- S10 · 143.68 · «لكن البيتكوين طار، واليوم…»
const LINE: [number, number][] = [[760, 900], [880, 860], [960, 880], [1060, 780], [1130, 810], [1240, 640], [1320, 680], [1430, 460], [1520, 380], [1620, 300], [1760, 290]];
export const S10: React.FC<{t: number}> = ({t}) => {
  const p = ease.inOut(clamp01((t - (T.flew - 0.1)) / 1.05));
  const segs = LINE.length - 1;
  const fpos = p * segs;
  const i0 = Math.min(segs - 1, Math.floor(fpos));
  const f = fpos - i0;
  const head: [number, number] = [lerp(LINE[i0][0], LINE[i0 + 1][0], f), lerp(LINE[i0][1], LINE[i0 + 1][1], f)];
  const pts = [...LINE.slice(0, i0 + 1), head];
  const d = 'M' + pts.map(([x, y]) => `${x} ${y}`).join(' L');
  const fill = d + ` L${head[0]} 960 L${LINE[0][0]} 960 Z`;
  const g = uid('c3s10', 'a');
  const level = clamp01((t - T.today) / 0.4);
  cueSfx('rise', 'c3-s10-rise', t >= T.flew - 0.1 && t < T.flew + 0.2, 1200, {at: T.flew - 0.1, hit: 0.9});
  return (
    <>
      <NightSky t={t} id="c3s10" />
      {[360, 520, 680, 840].map((y) => <line key={y} x1={700} x2={1840} y1={y} y2={y} stroke="#8A7CC8" strokeWidth={3} strokeDasharray="10 14" opacity={0.35} />)}
      <line x1={700} x2={1840} y1={960} y2={960} stroke="#B9B0E8" strokeWidth={5} opacity={0.6} />
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22C55E" stopOpacity={0.45} /><stop offset="1" stopColor="#22C55E" stopOpacity={0} /></linearGradient>
        <filter id={g + 'b'} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={10} /></filter>
      </defs>
      {p > 0 && (
        <g>
          <path d={fill} fill={`url(#${g})`} />
          <path d={d} fill="none" stroke="#22C55E" strokeWidth={22} strokeLinejoin="round" strokeLinecap="round" filter={`url(#${g}b)`} opacity={0.8} />
          <path d={d} fill="none" stroke={OUT} strokeWidth={18} strokeLinejoin="round" strokeLinecap="round" />
          <path d={d} fill="none" stroke="#3EE07A" strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      )}
      {level > 0 && [0, 1, 2, 3].map((i) => <Sparkle key={i} x={head[0] - 60 + i * 50} y={head[1] - 100 - (i % 2) * 40} r={14 + 10 * Math.max(0, Math.sin(t * 3 + i))} o={level} color="#FFFFFF" />)}
      <HeroObject t={t} at={T.s10 + 0.05} draw={coinArt('₿')} ar={1} x={p > 0 ? head[0] : LINE[0][0]} y={(p > 0 ? head[1] : LINE[0][1]) - 90} h={170} glow={GOLD} float={false} sparkles={2} id="c3s10-coin" />
      <WordPop t={t} id="c3s10-w" y={170} size={124} right={1330} words={[{w: 'البيتكوين', at: T.s10 + 0.1}, {w: 'طار!', at: T.flew - 0.05, tone: 'green'}]} />
    </>
  );
};

// ---------------------------------------------------------------- S11 · 146.34 · «نفس الكمية قيمتها تقريبًا بين 590 و630 مليون دولار»
export const S11: React.FC<{t: number}> = ({t}) => {
  const BX = 1200, BY = 500;
  const value = t < T.v630 - 0.1 ? 'بين 590' : t < T.million - 0.1 ? 'بين 590 و630' : 'بين 590 و630 مليون $';
  // the coin flies in from the chart into the bill
  const fly = ease.inOut(clamp01((t - T.s11) / 0.6));
  const [cx, cy] = move(t, T.s11, [1760, 200], [BX, BY + 120], 0.6);
  const grey = ease.out(clamp01((t - (T.v590 + 0.3)) / 0.4));
  return (
    <>
      <NightSky t={t} id="c3s11" />
      <Rays t={t} id="c3s11r" x={BX} y={BY + 40} tone="gold" />
      <MistakeBill t={t} at={T.s11 - 0.4} x={BX} y={BY} w={920} s={1.05} title="فاتورة هاولز" id="c3-bill-b"
        rows={[{label: 'وقتها', value: 'نص مليون جنيه', at: T.s11 - 1}]}
        total={{label: 'اليوم', value, tone: 'gold', at: T.v590 - 0.1}} />
      {grey > 0 && (
        <g transform={`translate(${BX} ${BY}) rotate(-2) scale(1.05)`} opacity={grey}>
          <rect x={-440} y={-59 - 42} width={880} height={84} rx={8} fill="#6E6888" opacity={0.55} />
          <line x1={-420} x2={lerp(-420, 420, grey)} y1={-59} y2={-59} stroke="#3A3450" strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
      {fly < 1 && <g opacity={1 - clamp01((fly - 0.75) / 0.25)} transform={`translate(${cx} ${cy}) scale(${1 - 0.6 * fly})`}><g transform="translate(0 0)">{coinArt('₿')(170)}</g></g>}
    </>
  );
};

// ---------------------------------------------------------------- S13 · 154.20 · «المكب فيه حوالي 1.4 مليون … طن زبالة»
const Bulldozer: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-60} y={-46} width={90} height={34} rx={6} fill="#F2B51C" stroke={OUT} strokeWidth={5} />
    <rect x={-40} y={-80} width={46} height={36} rx={5} fill="#F2B51C" stroke={OUT} strokeWidth={5} />
    <rect x={-32} y={-74} width={30} height={20} fill="#9FE6FF" />
    <rect x={-66} y={-14} width={104} height={20} rx={10} fill="#3A3450" stroke={OUT} strokeWidth={5} />
    <path d="M40 -40 L70 -40 L80 4 L44 4 Z" fill="#C9C4D8" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
  </g>
);
export const S13: React.FC<{t: number}> = ({t}) => {
  const dz = moveTo(t, T.s13 + 1.2, 900, 1060, 2.4);
  return (
    <>
      <NightSky t={t} id="c3s13" />
      <rect x={0} y={0} width={W} height={H} fill="#2A3048" opacity={0.3} />
      <LandfillSlice t={t} at={T.s13 + 0.05} x={960} y={940} w={1560} h={560} rain zoneAt={9999} driveAt={9999} id="c3-lf-a" />
      {t > T.s13 + 0.5 && <Bulldozer x={dz} y={392 + Math.abs(dz - 960) * 0.05} s={0.9} />}
      <Measure t={t} at={T.mt - 0.55} x1={180} y1={300} x2={1740} y2={300} label="1.4 مليون طن" size={56} id="c3s13-m" />
    </>
  );
};

// ---------------------------------------------------------------- S14 · 158.00 · «ضيّق مكان الهارديسك لمنطقة فيها 100 ألف طن بس. "بس"»
export const S14: React.FC<{t: number}> = ({t}) => {
  const PX = 960 - 230, PY = 940 - 230;
  const z = moveTo(t, T.narrow, 1, 1.5, 1.5);
  const bw = textWidth('"بس"', 160);
  return (
    <>
      <NightSky t={t} id="c3s14" />
      <rect x={0} y={0} width={W} height={H} fill="#2A3048" opacity={0.3} />
      <g transform={`translate(${PX} ${PY}) scale(${z}) translate(${-PX} ${-PY})`}>
        <LandfillSlice t={t} x={960} y={940} w={1560} h={560} rain zoneAt={T.s14 + 0.2} narrowAt={T.narrow} driveAt={T.drive - 0.1}
          pocket={{dx: -230, dy: 230, w: 300, h: 190}} labels={[{text: '100 ألف طن', at: T.k100 - 0.1, dx: -230, dy: 400, kind: 'gold'}]} id="c3-lf-b" />
      </g>
      <NPill text="بس" x={350} y={PY - 255} size={44} kind="grey" id="c3s14-bas" p={(t - T.bas1) / 0.3} />
      <WordPop t={t} id="c3s14-w" y={190} size={160} right={760 + bw / 2} words={[{w: '"بس"', at: T.bas2 - 0.05, tone: 'red'}]} />
    </>
  );
};

// ---------------------------------------------------------------- S16 · 168.64 · «صار ملك البلدية، وإن تصاريح البيئة تمنع الحفر أصلًا»
const Fence: React.FC<{id: string}> = ({id}) => {
  const g = uid('c3fence', id);
  return (
    <g>
      <defs>
        <pattern id={g} width={44} height={44} patternUnits="userSpaceOnUse">
          <path d="M0 0 L44 44 M44 0 L0 44" stroke="#B8BCD0" strokeWidth={4} opacity={0.75} />
        </pattern>
      </defs>
      <rect x={-40} y={540} width={W + 80} height={560} fill={`url(#${g})`} />
      <rect x={-40} y={530} width={W + 80} height={16} rx={8} fill="#8E93AA" stroke={OUT} strokeWidth={5} />
      {Array.from({length: 10}, (_, i) => -20 + i * 220).map((x) => (
        <rect key={x} x={x - 14} y={500} width={28} height={600} rx={8} fill="#6E7390" stroke={OUT} strokeWidth={6} />
      ))}
      <path d="M-40 512 L1960 512" stroke="#9AA0B5" strokeWidth={4} strokeDasharray="10 8" />
    </g>
  );
};
const NoDigSign: React.FC<{t: number; at: number; x: number; y: number}> = ({t, at, x, y}) => {
  if (t < at) return null;
  cueSfx('stamp', 'c3-s16-sign', t < at + 0.3, x, {at, hit: 0.16});
  const q = pressIn(clamp01((t - at) / 0.165));
  const tw = textWidth('ممنوع الحفر', 64) + 80;
  return (
    <g transform={`translate(${x} ${y}) rotate(-6) scale(${q.s})`} opacity={q.o} {...lb('text', 'c3s16-sign')}>
      <line x1={-tw / 2 + 30} y1={-60} x2={-tw / 2 + 10} y2={-150} stroke={OUT} strokeWidth={5} />
      <line x1={tw / 2 - 30} y1={-60} x2={tw / 2 - 10} y2={-150} stroke={OUT} strokeWidth={5} />
      <rect x={-tw / 2} y={-60} width={tw} height={120} rx={16} fill="#E23A4E" stroke={OUT} strokeWidth={8} />
      <rect x={-tw / 2 + 12} y={-48} width={tw - 24} height={96} rx={10} fill="none" stroke="#FFFFFF" strokeWidth={5} />
      <GlowText text="ممنوع الحفر" x={0} y={4} size={64} id="c3s16-sign-t" />
    </g>
  );
};
export const S16: React.FC<{t: number}> = ({t}) => {
  const card = popAt(t, T.permit - 0.1);
  const ownP = clamp01((t - (T.owned - 0.1)) / 0.3);
  cueSfx('pop', 'c3-s16-card', t >= T.permit - 0.1 && t < T.permit + 0.2, 520, {at: T.permit - 0.1, hit: 0.125});
  return (
    <>
      <PlateWorld t={t} src={`${SLUG}/bg/landfill-newport.jpg`} id="c3s16p" at={T.s16} dur={4} look="natural" from={{x: 0.5, y: 0.45, s: 1.12}} to={{x: 0.52, y: 0.5, s: 1.2}} />
      <rect x={0} y={0} width={W} height={H} fill="#1E0B4A" opacity={0.25} />
      <Rain t={t} density={1} seed={13} />
      <Fence id="c3s16f" />
      {/* the gate sign */}
      {ownP > 0 && (
        <g>
          <line x1={820} y1={546} x2={860} y2={610} stroke={OUT} strokeWidth={5} />
          <line x1={1100} y1={546} x2={1060} y2={610} stroke={OUT} strokeWidth={5} />
        </g>
      )}
      <NPill text="ملك البلدية" x={960} y={640} size={60} kind="gold" id="c3s16-own" p={ownP} />
      {/* the environmental permit */}
      {card.o > 0 && (
        <g transform={`translate(470 780) rotate(-5) scale(${card.s})`} opacity={card.o}>
          <rect x={-150} y={-110} width={300} height={220} rx={18} fill="#F6F1E4" stroke={OUT} strokeWidth={7} />
          <rect x={-150} y={-110} width={300} height={54} rx={18} fill="#22A05A" stroke={OUT} strokeWidth={7} />
          <path d="M-30 40 C -30 -20 30 -40 60 -40 C 60 10 30 50 -20 50 Z" fill="#3EE07A" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
          <path d="M-40 60 L30 -20" stroke={OUT} strokeWidth={5} />
          {[0, 1].map((i) => <rect key={i} x={-120} y={-30 + i * 34} width={70} height={10} rx={5} fill="#B8B2A0" />)}
          <Mark kind="check" x={110} y={70} r={30} />
        </g>
      )}
      {/* no digging */}
      {t >= T.noDig && (
        <g>
          <StoryPropIcon prop="pickaxe" x={1450} y={870} s={1.7} id="c3s16-pick" />
          {t >= T.noDig + 0.15 && <Mark kind="cross" x={1510} y={800} r={40} />}
        </g>
      )}
      <NoDigSign t={t} at={T.noDig - 0.05} x={1450} y={700} />
    </>
  );
};

// ---------------------------------------------------------------- S18 · 176.88 · «لأنها مدفونة تحت زبالة مدينة كاملة»
export const S18: React.FC<{t: number}> = ({t}) => {
  const FX = 0.66, FY = 0.62; // the buried drive, in plate fractions
  const a = T.s18 + 0.25, dur = 2.1;
  const from = {x: FX, y: FY, s: 2.3}, to = {x: 0.5, y: 0.5, s: 1.0};
  // mirror PlateWorld's framing so overlays stay glued to the plate
  const k = ease.inOut(clamp01((t - a) / dur));
  const s = lerp(from.s, to.s, k), fx = lerp(from.x, to.x, k), fy = lerp(from.y, to.y, k);
  const w = W * s, h = H * s;
  const left = Math.min(0, Math.max(W - w, W / 2 - fx * w)), top = Math.min(0, Math.max(H - h, H / 2 - fy * h));
  const pm = (u: number, v: number): [number, number] => [left + u * w, top + v * h];
  const [gx, gy] = pm(FX, FY);
  const pulse = 0.8 + 0.2 * Math.sin(t * 5);
  const cityP = ease.out(clamp01((t - (T.city - 0.3)) / 0.5));
  if (t >= a) cueSfx('whoosh', 'c3-s18-pull', t < a + 0.3, 960, {at: a, hit: 0.8, gain: 0.7});
  return (
    <>
      <PlateWorld t={t} src={`${SLUG}/bg/landfill-newport.jpg`} id="c3s18p" at={a} dur={dur} look="natural" from={from} to={to} />
      <rect x={0} y={0} width={W} height={H} fill="#1E0B4A" opacity={0.3} />
      {/* city lights on the horizon */}
      <g opacity={0.35 + 0.65 * cityP}>
        {Array.from({length: 26}, (_, i) => {
          const [x, y] = pm(0.37 + i * 0.0055, 0.345 - (i % 3) * 0.004);
          return <circle key={i} cx={x} cy={y} r={Math.max(2, 3.2 * s)} fill="#FFD27A" opacity={0.6 + 0.4 * Math.sin(t * 2 + i)} />;
        })}
        <Glow x={pm(0.44, 0.34)[0]} y={pm(0.44, 0.34)[1]} r={200 * s} color="#FFB45A" o={0.5 * cityP} id="c3s18-city" />
      </g>
      <Glow x={gx} y={gy} r={190 * s * pulse} color={CYAN} o={0.95} id="c3s18-drive" />
      <circle cx={gx} cy={gy} r={Math.max(5, 12 * s)} fill="#E8FDFF" />
      <Rain t={t} density={1.2} seed={17} />
      <NPill text="مدفونة" x={gx} y={gy - Math.max(70, 120 * s)} size={48} kind="cyan" id="c3s18-buried" p={(t - (T.buried - 0.1)) / 0.3} />
      <NPill text="مدينة كاملة" x={pm(0.44, 0.34)[0]} y={pm(0.44, 0.34)[1] - 70} size={52} kind="white" id="c3s18-city-p" p={(t - (T.city - 0.1)) / 0.3} />
    </>
  );
};
