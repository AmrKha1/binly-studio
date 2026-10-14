import React from 'react';
import {C} from './theme';
import {mixC, toned, Tone} from './env';

// Era-aware vehicles (flat vector, upper-left light). All face RIGHT (`flip` for left), origin = ground /
// waterline under the vehicle body centre. `moving` turns on the motion (wheels turn, sails sway, smoke
// puffs, bob); `t` drives it. `tone` re-tints for time of day (same as env props). Pure functions of t.

type Base = {x?: number; y?: number; s?: number; flip?: boolean; t?: number; tone?: Tone; color?: string; moving?: boolean};
const tf = ({x = 0, y = 0, s = 1, flip}: Base) => `translate(${x} ${y}) scale(${flip ? -s : s} ${s})`;
const dk = (c: string, k = 0.22) => mixC(c, C.ink, k);
const lt = (c: string, k = 0.25) => mixC(c, C.paperLight, k);
const R = (n: number) => Array.from({length: n}, (_, i) => i);
const BRASS = mixC(C.caution, C.wood, 0.35);
const spin = (t: number, r: number, moving?: boolean, v = 240) => (moving ? ((t * v) / r) * (180 / Math.PI) : 0);

/** Spoked (spokes>0) or solid wheel. origin = hub. */
const Wheel: React.FC<{x: number; y: number; r: number; a: number; c: string; hub?: string; spokes?: number}> = ({x, y, r, a, c, hub = BRASS, spokes = 8}) => (
  <g transform={`translate(${x} ${y}) rotate(${a})`}>
    {spokes > 0 ? (
      <>
        <circle r={r - 3} fill="none" stroke={c} strokeWidth={Math.max(6, r * 0.16)} />
        {R(spokes / 2).map((i) => (
          <line key={i} x1={-r} x2={r} transform={`rotate(${(i * 360) / spokes})`} stroke={c} strokeWidth={4} />
        ))}
      </>
    ) : (
      <>
        <circle r={r} fill={C.ink} />
        <circle r={r * 0.55} fill={hub} />
        {R(5).map((i) => (
          <circle key={i} cx={r * 0.33} cy={0} r={3} fill={C.inkLift} transform={`rotate(${i * 72})`} />
        ))}
      </>
    )}
    <circle r={Math.max(5, r * 0.18)} fill={hub} />
  </g>
);

/** Rising smoke puffs from a stack. origin = stack top. Drifts back (−x) when the vehicle moves. */
const Puffs: React.FC<{t: number; x: number; y: number; color: string; n?: number; r?: number}> = ({t, x, y, color, n = 5, r = 18}) => (
  <g fill={color}>
    {R(n).map((i) => {
      const ph = (((t / 2.4 + i / n) % 1) + 1) % 1;
      return <circle key={i} cx={x - ph * 140} cy={y - ph * 150 - r * 0.5} r={r * (0.6 + ph * 1.5)} opacity={(1 - ph) * 0.75} />;
    })}
  </g>
);

/** Flat side-view horse, faces right, origin = ground under the body centre. ~260 long, ~220 tall. Walk cycle when moving. */
export const Horse: React.FC<Base> = ({t = 0, tone = 'day', color = mixC(C.wood, C.woodLight, 0.3), moving, ...p}) => {
  const c = toned(color, tone);
  const far = dk(c, 0.25);
  const mane = toned(C.inkSoft, tone);
  const sw = (ph: number) => (moving ? Math.sin(t * 7 + ph) * 20 : 0);
  const leg = (lx: number, ph: number, col: string) => (
    <g transform={`translate(${lx} -104) rotate(${sw(ph)})`}>
      <path d="M-9 0 L9 0 L6 96 L-6 96 Z" fill={col} />
      <rect x={-8} y={92} width={16} height={10} rx={2} fill={mane} />
    </g>
  );
  return (
    <g transform={tf(p)}>
      <g transform={`translate(0 ${moving ? -Math.abs(Math.sin(t * 7)) * 4 : 0})`}>
        {leg(48, Math.PI, far)}
        {leg(-58, 0, far)}
        <path d="M-80 -134 Q-112 -110 -104 -64" fill="none" stroke={mane} strokeWidth={13} strokeLinecap="round" />
        <ellipse cx={0} cy={-120} rx={84} ry={38} fill={c} />
        <path d="M-60 -92 Q0 -80 60 -92 Q40 -84 0 -83 Q-40 -84 -60 -92 Z" fill={dk(c, 0.15)} />
        <path d="M44 -146 L94 -210 L122 -198 L86 -108 Z" fill={c} />
        <ellipse cx={128} cy={-188} rx={34} ry={15} transform="rotate(32 128 -188)" fill={c} />
        <path d="M96 -212 L100 -234 L110 -210 Z" fill={c} />
        <path d="M40 -150 L90 -214 L98 -206 L52 -140 Z" fill={mane} />
        <circle cx={118} cy={-198} r={3.5} fill={C.ink} />
        {leg(58, 0, c)}
        {leg(-48, Math.PI, c)}
      </g>
    </g>
  );
};

/** Boat / ship, origin = waterline centre. kind: rowboat (~260 wide, oars) · sailing (~520, two masts, sails sway) ·
 *  steam (~580, funnel + smoke). moving → bob, wake, oars row / sails billow / smoke. */
export const Ship: React.FC<Base & {kind?: 'rowboat' | 'sailing' | 'steam'}> = ({kind = 'sailing', t = 0, tone = 'day', color, moving, ...p}) => {
  const k = (c: string) => toned(c, tone);
  const hull = k(color ?? (kind === 'steam' ? C.inkSoft : C.wood));
  const bob = moving ? `translate(0 ${Math.sin(t * 1.9) * 4}) rotate(${Math.sin(t * 1.4) * 1.4})` : '';
  const wake = moving && (
    <g stroke={k(C.paperLight)} strokeWidth={4} strokeLinecap="round" opacity={0.7}>
      {R(3).map((i) => {
        const ph = (t * 0.8 + i / 3) % 1;
        return <line key={i} x1={-180 - ph * 160} x2={-120 - ph * 160} y1={14 + i * 8} y2={14 + i * 8} opacity={1 - ph} />;
      })}
    </g>
  );
  let body: React.ReactNode;
  if (kind === 'rowboat') {
    const oar = moving ? Math.sin(t * 3) * 28 : 8;
    body = (
      <>
        <path d="M-130 -42 L135 -46 Q120 6 70 16 L-90 16 Q-124 6 -130 -42 Z" fill={hull} />
        <path d="M-130 -42 L135 -46 L132 -34 L-127 -30 Z" fill={dk(hull, 0.3)} />
        <path d="M10 -40 L20 -40 L130 60 L120 64 Z" fill={k(C.woodLight)} transform={`rotate(${oar} 15 -40)`} />
      </>
    );
  } else if (kind === 'sailing') {
    const b = moving ? 30 + Math.sin(t * 1.2) * 12 : 22;
    const sail = (mx: number, top: number, w: number, hh: number) => (
      <path d={`M${mx - w / 2} ${top} L${mx + w / 2} ${top} Q${mx + w / 2 + b} ${top + hh / 2} ${mx + w / 2} ${top + hh} L${mx - w / 2} ${top + hh} Q${mx - w / 2 + b} ${top + hh / 2} ${mx - w / 2} ${top} Z`} fill={k(C.paperLight)} stroke={k(C.paperDeep)} strokeWidth={3} />
    );
    body = (
      <>
        <line x1={240} y1={-78} x2={340} y2={-130} stroke={k(C.woodDark)} strokeWidth={8} />
        {[0, -150].map((mx, i) => (
          <rect key={i} x={mx - 6} y={i ? -360 : -440} width={12} height={i ? 290 : 370} fill={k(C.woodDark)} />
        ))}
        {sail(0, -410, 170, 140)}
        {sail(0, -260, 210, 150)}
        {sail(-150, -330, 150, 220)}
        <path d={`M6 -440 L70 ${-428 + (moving ? Math.sin(t * 4) * 6 : 0)} L6 -414 Z`} fill={k(C.oxblood)} />
        <path d="M-250 -80 L255 -92 Q230 16 150 28 L-200 28 Q-240 4 -250 -80 Z" fill={hull} />
        <rect x={-250} y={-128} width={100} height={52} fill={hull} />
        <path d="M-250 -80 L255 -92 L250 -76 L-246 -64 Z" fill={dk(hull, 0.3)} />
        {R(5).map((i) => (
          <rect key={i} x={-110 + i * 60} y={-58} width={20} height={14} fill={dk(hull, 0.45)} />
        ))}
      </>
    );
  } else {
    const fun = k(color ? C.inkSoft : C.oxblood);
    body = (
      <>
        {moving && <Puffs t={t} x={-15} y={-262} color={k(C.stone)} r={22} />}
        <line x1={-200} y1={-90} x2={-200} y2={-260} stroke={k(C.inkLift)} strokeWidth={6} />
        <line x1={180} y1={-90} x2={180} y2={-230} stroke={k(C.inkLift)} strokeWidth={6} />
        <rect x={-130} y={-130} width={250} height={60} fill={k(C.paperLight)} />
        <rect x={40} y={-180} width={90} height={52} fill={k(C.paperShade)} />
        <rect x={52} y={-168} width={66} height={16} fill={k(C.slate)} />
        <rect x={-40} y={-262} width={50} height={135} fill={fun} />
        <rect x={-40} y={-262} width={50} height={22} fill={k(C.ink)} />
        <path d="M-290 -66 L295 -86 L250 26 L-250 26 Q-282 4 -290 -66 Z" fill={hull} />
        <path d="M-266 8 L257 8 L250 26 L-250 26 Z" fill={k(C.oxDeep)} />
        {R(7).map((i) => (
          <circle key={i} cx={-180 + i * 60} cy={-40} r={8} fill={k(C.paperShade)} />
        ))}
      </>
    );
  }
  return (
    <g transform={tf(p)}>
      {wake}
      <g transform={bob}>{body}</g>
    </g>
  );
};

/** Horse-drawn vehicle, origin = ground under the vehicle body; the horse walks in front (+x, ~+250).
 *  kind: cart (2-wheel open, ~230) · wagon (4-wheel covered, ~340) · carriage (closed coach, ~300). horse?=true. */
export const Cart: React.FC<Base & {kind?: 'cart' | 'wagon' | 'carriage'; horse?: boolean}> = ({kind = 'cart', horse = true, t = 0, tone = 'day', color, moving, ...p}) => {
  const k = (c: string) => toned(c, tone);
  const c = k(color ?? (kind === 'carriage' ? C.inkSoft : C.wood));
  const wc = k(C.woodDark);
  const front = kind === 'cart' ? 115 : kind === 'wagon' ? 170 : 165;
  const wheel = (wx: number, r: number) => <Wheel x={wx} y={-r} r={r} a={spin(t, r, moving)} c={wc} hub={k(BRASS)} />;
  return (
    <g transform={tf(p)}>
      {horse && <Horse x={front + 120} y={0} t={t} tone={tone} moving={moving} />}
      {horse && <path d={`M${front - 10} -78 L${front + 170} -118`} stroke={wc} strokeWidth={8} strokeLinecap="round" />}
      {kind === 'cart' && (
        <>
          <rect x={-115} y={-140} width={230} height={66} fill={c} />
          <rect x={-115} y={-140} width={230} height={10} fill={lt(c, 0.2)} />
          {[-60, 0, 60].map((lx) => (
            <rect key={lx} x={lx - 2} y={-130} width={4} height={56} fill={dk(c)} />
          ))}
          {wheel(-10, 58)}
        </>
      )}
      {kind === 'wagon' && (
        <>
          <path d="M-160 -152 Q-176 -300 -90 -300 L100 -300 Q178 -300 162 -152 Z" fill={k(C.paperLight)} />
          {[-80, 0, 80].map((hx) => (
            <line key={hx} x1={hx} y1={-298} x2={hx} y2={-152} stroke={k(C.paperShade)} strokeWidth={6} />
          ))}
          <rect x={-170} y={-156} width={340} height={70} fill={c} />
          <rect x={-170} y={-100} width={340} height={14} fill={dk(c)} />
          {wheel(-110, 56)}
          {wheel(118, 44)}
        </>
      )}
      {kind === 'carriage' && (
        <>
          <rect x={115} y={-230} width={55} height={14} fill={wc} />
          <path d="M125 -216 L165 -216 L150 -120 L125 -120 Z" fill={wc} />
          <path d="M-125 -275 L125 -275 L118 -110 Q0 -96 -118 -110 Z" fill={c} />
          <rect x={-135} y={-288} width={270} height={16} rx={6} fill={dk(c, 0.3)} />
          <rect x={-95} y={-250} width={80} height={70} rx={8} fill={k(C.lamp)} opacity={0.85} />
          <rect x={20} y={-258} width={4} height={140} fill={k(BRASS)} />
          <rect x={30} y={-250} width={70} height={70} rx={8} fill={dk(c, 0.35)} />
          {wheel(-80, 62)}
          {wheel(118, 46)}
        </>
      )}
    </g>
  );
};

/** Train, origin = rail level under the locomotive centre; `cars` coaches trail behind (−x, 330 each).
 *  kind: steam (boiler, funnel, cab, drive rods, smoke) · modern (streamlined nose, window band, stripe). */
export const Train: React.FC<Base & {kind?: 'steam' | 'modern'; cars?: number}> = ({kind = 'steam', cars = 2, t = 0, tone = 'day', color, moving, ...p}) => {
  const k = (c: string) => toned(c, tone);
  const steam = kind === 'steam';
  const c = k(color ?? (steam ? C.inkSoft : C.paperLight));
  const acc = k(steam ? C.oxDeep : C.oxblood);
  const wheel = (wx: number, r: number) => <Wheel x={wx} y={-r} r={r} a={spin(t, r, moving)} c={k(C.ink)} hub={k(C.metal)} spokes={steam ? 8 : 0} />;
  const coach = (i: number) => {
    const cx = -350 - i * 330;
    return (
      <g key={i}>
        <rect x={cx + 150} y={-90} width={30} height={12} fill={k(C.ink)} />
        <rect x={cx - 150} y={-220} width={300} height={170} rx={steam ? 8 : 26} fill={steam ? acc : c} />
        {steam && <rect x={cx - 158} y={-232} width={316} height={18} rx={8} fill={k(C.inkSoft)} />}
        {R(4).map((j) => (
          <rect key={j} x={cx - 125 + j * 66} y={-190} width={50} height={steam ? 56 : 40} rx={steam ? 6 : 4} fill={k(steam ? C.lamp : C.slate)} opacity={0.9} />
        ))}
        {!steam && <rect x={cx - 150} y={-120} width={300} height={14} fill={acc} />}
        <rect x={cx - 140} y={-56} width={280} height={10} fill={k(C.inkLift)} />
        {wheel(cx - 95, 24)}
        {wheel(cx + 95, 24)}
      </g>
    );
  };
  if (steam) {
    const a = (spin(t, 36, moving) * Math.PI) / 180;
    const ox = Math.cos(a) * 16;
    const oy = Math.sin(a) * 16 - 36;
    return (
      <g transform={tf(p)}>
        {R(cars).map(coach)}
        {moving && <Puffs t={t} x={120} y={-232} color={k(C.stone)} r={22} />}
        <rect x={-180} y={-66} width={350} height={24} fill={k(C.ink)} />
        <rect x={-60} y={-160} width={220} height={96} rx={16} fill={c} />
        {[0, 60].map((bx) => (
          <rect key={bx} x={bx} y={-160} width={8} height={96} fill={k(BRASS)} />
        ))}
        <rect x={140} y={-162} width={26} height={100} rx={8} fill={k(C.ink)} />
        <rect x={104} y={-222} width={32} height={64} fill={k(C.ink)} />
        <rect x={96} y={-236} width={48} height={16} rx={4} fill={k(C.ink)} />
        <path d="M18 -160 A22 22 0 0 1 62 -160 Z" fill={k(BRASS)} />
        <rect x={-180} y={-240} width={130} height={176} fill={acc} />
        <rect x={-192} y={-252} width={154} height={16} rx={6} fill={k(C.ink)} />
        <rect x={-160} y={-218} width={50} height={56} rx={6} fill={k(C.lamp)} opacity={0.9} />
        <path d="M168 -42 L215 0 L168 0 Z" fill={k(C.inkLift)} />
        {wheel(-130, 26)}
        {[-10, 64, 138].map((wx) => (
          <g key={wx}>{wheel(wx, 36)}</g>
        ))}
        <line x1={-10 + ox} y1={oy} x2={138 + ox} y2={oy} stroke={k(C.metal)} strokeWidth={8} strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g transform={tf(p)}>
      {R(cars).map(coach)}
      <path d="M-180 -220 L120 -220 Q205 -215 228 -60 L228 -50 L-180 -50 Z" fill={c} />
      <path d="M140 -210 Q192 -195 210 -130 L150 -130 Z" fill={k(C.slate)} />
      <rect x={-155} y={-190} width={260} height={40} rx={4} fill={k(C.slate)} />
      <path d="M-180 -120 L218 -120 L222 -106 L-180 -106 Z" fill={acc} />
      <path d="M-60 -220 L-30 -258 L20 -258" fill="none" stroke={k(C.inkLift)} strokeWidth={5} />
      <rect x={-170} y={-56} width={380} height={10} fill={k(C.inkLift)} />
      {wheel(-110, 24)}
      {wheel(130, 24)}
    </g>
  );
};

/** Car, origin = ground under the body centre, ~300 long. kind: vintage (1910s–30s boxy, spoked wheels, bounce) ·
 *  modern (sedan). moving → wheels turn. */
export const Car: React.FC<Base & {kind?: 'vintage' | 'modern'}> = ({kind = 'modern', t = 0, tone = 'day', color, moving, ...p}) => {
  const k = (c: string) => toned(c, tone);
  const c = k(color ?? (kind === 'vintage' ? C.evidence : C.slate));
  const glass = k(C.paperShade);
  if (kind === 'vintage') {
    const bump = moving ? Math.abs(Math.sin(t * 9)) * -3 : 0;
    const wheel = (wx: number) => <Wheel x={wx} y={-36} r={36} a={spin(t, 36, moving)} c={k(C.ink)} hub={k(BRASS)} spokes={10} />;
    return (
      <g transform={tf(p)}>
        <g transform={`translate(0 ${bump})`}>
          <rect x={-140} y={-74} width={280} height={18} rx={4} fill={k(C.ink)} />
          <rect x={-118} y={-210} width={160} height={16} rx={5} fill={k(C.ink)} />
          <rect x={-110} y={-196} width={8} height={120} fill={k(C.ink)} />
          <rect x={30} y={-196} width={8} height={120} fill={k(C.ink)} />
          <rect x={-90} y={-182} width={110} height={56} rx={4} fill={glass} />
          <rect x={-130} y={-124} width={175} height={56} rx={6} fill={c} />
          <rect x={45} y={-122} width={90} height={54} rx={6} fill={c} />
          <rect x={130} y={-126} width={14} height={60} rx={3} fill={k(BRASS)} />
          <circle cx={150} cy={-112} r={10} fill={k(C.lamp)} />
          <path d="M-138 -68 Q-90 -110 -40 -68 Z" fill={dk(c, 0.3)} />
          <path d="M42 -68 Q90 -110 138 -68 Z" fill={dk(c, 0.3)} />
        </g>
        {wheel(-88)}
        {wheel(90)}
      </g>
    );
  }
  const wheel = (wx: number) => <Wheel x={wx} y={-32} r={32} a={spin(t, 32, moving)} c={k(C.ink)} hub={k(C.metal)} spokes={0} />;
  return (
    <g transform={tf(p)}>
      <path d="M-155 -40 L-155 -92 Q-148 -110 -105 -114 L-62 -116 L-24 -162 L62 -162 L108 -116 L142 -108 Q162 -102 162 -72 L162 -40 Z" fill={c} />
      <path d="M-50 -116 L-18 -150 L14 -150 L14 -116 Z M26 -116 L26 -150 L56 -150 L90 -116 Z" fill={glass} />
      <line x1={20} y1={-114} x2={20} y2={-48} stroke={dk(c, 0.3)} strokeWidth={3} />
      <rect x={-155} y={-62} width={317} height={10} fill={dk(c, 0.25)} />
      <rect x={146} y={-98} width={16} height={12} rx={3} fill={k(C.lamp)} />
      <rect x={-155} y={-98} width={10} height={14} rx={2} fill={k(C.oxblood)} />
      {wheel(-98)}
      {wheel(104)}
    </g>
  );
};
