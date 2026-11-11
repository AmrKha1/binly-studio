// CLAUDE-DRAWN HERO OBJECTS (owner 2026-11-11: "the objects should glow and be fantastic and modern like the reference
// even if Claude created it by its own"). Each is a `draw(h)` for <HeroObject draw={…}> (kit/night-fx), which adds the
// hero finish (glow halo, light sweep, twinkles, the reference pop, float, sound). Drawn the reference's way — never flat:
// rich gradients, a bright highlight edge, a darker side, a rim/bevel for thickness, a thick dark outline, small shine
// details. Centred at (0,0), about h tall. Use them as the quality bar for every new code-drawn object.
import React from 'react';

const OUT = '#14102A';
let gid = 0;
const id = (p: string) => `${p}-${gid++}`;

/** a thick gold coin with an embossed symbol (₿ by default; '$', '£'…) — ar 1 */
export const coinArt = (symbol = '₿', tone: 'gold' | 'silver' = 'gold') => (h: number) => {
  const r = h / 2, g = id('coin');
  const c = tone === 'gold' ? ['#FFF1B8', '#FFD45A', '#E9A90C', '#A86F05', '#7A4E02'] : ['#FFFFFF', '#E3E8F2', '#B9C2D3', '#7D889E', '#55607A'];
  return (
    <g>
      <defs>
        <radialGradient id={`${g}-f`} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor={c[0]} /><stop offset="0.35" stopColor={c[1]} /><stop offset="0.8" stopColor={c[2]} /><stop offset="1" stopColor={c[3]} />
        </radialGradient>
        <linearGradient id={`${g}-e`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c[3]} /><stop offset="1" stopColor={c[4]} /></linearGradient>
      </defs>
      {/* the coin's thickness (edge) under the face */}
      <ellipse cx={0} cy={r * 0.1} rx={r} ry={r} fill={`url(#${g}-e)`} stroke={OUT} strokeWidth={h * 0.035} />
      {Array.from({length: 18}, (_, i) => {
        const a = Math.PI * (0.08 + (0.84 * i) / 17);
        return <line key={i} x1={Math.cos(a) * r * 0.97} y1={Math.sin(a) * r * 0.97 + r * 0.04} x2={Math.cos(a) * r * 0.97} y2={Math.sin(a) * r * 0.97 + r * 0.12} stroke={c[4]} strokeWidth={h * 0.012} />;
      })}
      <circle cx={0} cy={0} r={r} fill={`url(#${g}-f)`} stroke={OUT} strokeWidth={h * 0.035} />
      <circle cx={0} cy={0} r={r * 0.8} fill="none" stroke={c[3]} strokeWidth={h * 0.03} />
      <circle cx={0} cy={0} r={r * 0.8 - h * 0.022} fill="none" stroke={c[0]} strokeWidth={h * 0.012} opacity={0.8} />
      {/* embossed symbol: shadow + light face */}
      <text x={h * 0.012} y={h * 0.02} fontSize={h * 0.62} fontWeight={900} fontFamily="Arial Black, Arial, sans-serif" textAnchor="middle" dominantBaseline="central" fill={c[4]} opacity={0.75}>{symbol}</text>
      <text x={0} y={0} fontSize={h * 0.62} fontWeight={900} fontFamily="Arial Black, Arial, sans-serif" textAnchor="middle" dominantBaseline="central" fill={c[1]} stroke={c[3]} strokeWidth={h * 0.012}>{symbol}</text>
      {/* glint */}
      <path d={`M${-r * 0.62} ${-r * 0.35} A${r * 0.72} ${r * 0.72} 0 0 1 ${-r * 0.2} ${-r * 0.7}`} fill="none" stroke="#FFFFFF" strokeWidth={h * 0.04} strokeLinecap="round" opacity={0.85} />
    </g>
  );
};

/** a signed document with a gold seal (a contract, a deal, a decision) — ar ≈ 0.78 */
export const documentArt = (sealText = '') => (h: number) => {
  const w = h * 0.74, g = id('doc'), fold = h * 0.14;
  return (
    <g transform="rotate(-4)">
      <defs>
        <linearGradient id={`${g}-p`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFDF4" /><stop offset="0.6" stopColor="#F3E7C6" /><stop offset="1" stopColor="#D9C595" /></linearGradient>
        <radialGradient id={`${g}-s`} cx="0.4" cy="0.35" r="0.7"><stop offset="0" stopColor="#FF8A7A" /><stop offset="0.6" stopColor="#D2363A" /><stop offset="1" stopColor="#8E1C22" /></radialGradient>
      </defs>
      <path d={`M${-w / 2} ${-h / 2} H${w / 2 - fold} L${w / 2} ${-h / 2 + fold} V${h / 2} H${-w / 2} Z`} fill={`url(#${g}-p)`} stroke={OUT} strokeWidth={h * 0.03} strokeLinejoin="round" />
      <path d={`M${w / 2 - fold} ${-h / 2} V${-h / 2 + fold} H${w / 2}`} fill="#E5D3A6" stroke={OUT} strokeWidth={h * 0.025} strokeLinejoin="round" />
      <rect x={-w * 0.36} y={-h * 0.37} width={w * 0.5} height={h * 0.05} rx={h * 0.02} fill="#3A2E5E" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-w * 0.36} y={-h * 0.24 + i * h * 0.075} width={w * (i % 3 === 2 ? 0.48 : 0.72)} height={h * 0.022} rx={h * 0.01} fill="#9C8B66" />)}
      {/* signature */}
      <path d={`M${-w * 0.34} ${h * 0.33} q${w * 0.06} ${-h * 0.12} ${w * 0.1} 0 t${w * 0.1} -${h * 0.02} t${w * 0.12} ${h * 0.01} q${w * 0.05} ${-h * 0.06} ${w * 0.08} ${h * 0.02}`} fill="none" stroke="#1E2A8A" strokeWidth={h * 0.018} strokeLinecap="round" />
      {/* the seal */}
      <g transform={`translate(${w * 0.26} ${h * 0.3})`}>
        {Array.from({length: 12}, (_, i) => <circle key={i} cx={Math.cos((i / 12) * Math.PI * 2) * h * 0.1} cy={Math.sin((i / 12) * Math.PI * 2) * h * 0.1} r={h * 0.035} fill="#B8272D" stroke={OUT} strokeWidth={h * 0.012} />)}
        <circle cx={0} cy={0} r={h * 0.1} fill={`url(#${g}-s)`} stroke={OUT} strokeWidth={h * 0.018} />
        <circle cx={0} cy={0} r={h * 0.065} fill="none" stroke="#FFB4A8" strokeWidth={h * 0.01} opacity={0.8} />
        {sealText && <text x={0} y={0} fontSize={h * 0.05} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#FFE3DC">{sealText}</text>}
      </g>
      <path d={`M${-w * 0.42} ${-h * 0.44} H${w * 0.2}`} stroke="#FFFFFF" strokeWidth={h * 0.02} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

/** a sleek external hard drive with a glowing LED — ar ≈ 0.72 */
export const driveArt = (led = '#5CF2FF') => (h: number) => {
  const w = h * 0.7, g = id('drv'), r = h * 0.08;
  return (
    <g transform="rotate(-6)">
      <defs>
        <linearGradient id={`${g}-b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E9EEF7" /><stop offset="0.45" stopColor="#AEB8CC" /><stop offset="1" stopColor="#5E6880" /></linearGradient>
        <linearGradient id={`${g}-d`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2C2650" /><stop offset="1" stopColor="#15112B" /></linearGradient>
      </defs>
      {/* side thickness */}
      <rect x={-w / 2 + h * 0.035} y={-h / 2 + h * 0.035} width={w} height={h} rx={r} fill="#454E66" stroke={OUT} strokeWidth={h * 0.03} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={`url(#${g}-b)`} stroke={OUT} strokeWidth={h * 0.03} />
      <rect x={-w * 0.36} y={-h * 0.38} width={w * 0.72} height={h * 0.6} rx={r * 0.7} fill={`url(#${g}-d)`} stroke={OUT} strokeWidth={h * 0.018} />
      {[0, 1, 2].map((i) => <rect key={i} x={-w * 0.27} y={-h * 0.28 + i * h * 0.12} width={w * (i === 2 ? 0.3 : 0.54)} height={h * 0.035} rx={h * 0.015} fill="#5B5290" />)}
      <circle cx={w * 0.26} cy={h * 0.36} r={h * 0.04} fill={led} />
      <circle cx={w * 0.26} cy={h * 0.36} r={h * 0.085} fill={led} opacity={0.35} />
      {[[-1, -1], [1, -1], [-1, 1]].map(([sx, sy], i) => <circle key={i} cx={sx * w * 0.4} cy={sy * h * 0.43} r={h * 0.02} fill="#7D879E" stroke={OUT} strokeWidth={h * 0.008} />)}
      <path d={`M${-w * 0.44} ${-h * 0.4} V${h * 0.1}`} stroke="#FFFFFF" strokeWidth={h * 0.025} strokeLinecap="round" opacity={0.75} />
    </g>
  );
};
