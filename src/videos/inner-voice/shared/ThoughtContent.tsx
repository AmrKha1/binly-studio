import React from 'react';
import {C, FONT_SANS, FONT_SERIF} from '../../../kit/theme';
import {clamp01, ease, lerp, noise1, ramp} from '../../../kit/anim';
import {idOf} from './util';

export type ThoughtKind = 'words' | 'image' | 'feeling' | 'awareness' | 'wordless' | 'empty';

export type ThoughtContentProps = {
  x: number;
  y: number;
  /** window radius (default 150) */
  r?: number;
  /** reveal 0→1 (frame first, then the content) */
  p?: number;
  t?: number;
  kind: ThoughtKind;
  /** inner-speech line for kind 'words' (types on with p) */
  text?: string;
  tone?: 'paper' | 'ink';
  frame?: 'circle' | 'card' | 'none';
  /** caption under the window (Inter caps) */
  label?: string;
  labelSize?: number;
  seed?: number;
  id?: string;
};

/**
 * ThoughtContent — ONE kind of mental content inside a round window. origin = window centre, radius r (150).
 * kinds: words (dashed-plum inner line, types on) · image (house/tree/sun memory) · feeling (warm pulsing blob) ·
 * awareness (room line drawing + lamp pool) · wordless (plum dot, dashed halo, empty dashed frame) · empty.
 */
export const ThoughtContent: React.FC<ThoughtContentProps> = ({x, y, r = 150, p = 1, t = 0, kind, text = 'Next, colour.', tone = 'paper', frame = 'circle', label, labelSize = 32, seed = 1, id}) => {
  if (p <= 0) return null;
  const ink = tone === 'ink';
  const k = r / 150;
  const fp = ease.outQuint(clamp01(p / 0.4));
  const cp = clamp01((p - 0.3) / 0.7);
  const plum = ink ? C.theoryLight : C.theory;
  const line = ink ? C.paperShade : C.ink;
  const faint = ink ? C.inkMute : C.paperDark;
  const winFill = ink ? C.inkSoft : C.paperLight;
  const cid = `tc-${id ?? ''}-${idOf(x, y, r, seed)}`;
  const shapeD =
    frame === 'card'
      ? `M${-r + 28 * k} ${-r} H${r - 28 * k} Q${r} ${-r} ${r} ${-r + 28 * k} V${r - 28 * k} Q${r} ${r} ${r - 28 * k} ${r} H${-r + 28 * k} Q${-r} ${r} ${-r} ${r - 28 * k} V${-r + 28 * k} Q${-r} ${-r} ${-r + 28 * k} ${-r} Z`
      : `M${-r} 0 A${r} ${r} 0 1 0 ${r} 0 A${r} ${r} 0 1 0 ${-r} 0 Z`;
  const life = Math.sin(t * 1.6 + seed);

  const content = () => {
    switch (kind) {
      case 'words': {
        const full = text;
        const n = Math.floor(full.length * ease.inOutSine(clamp01(cp / 0.85)) + 0.0001);
        const shown = full.slice(0, n);
        // one or two lines, size ≥ 30
        const words = full.split(' ');
        let lines = [full];
        let size = 40 * k;
        const fitW = r * 1.7;
        const tw = (s: string, z: number) => s.length * z * 0.48;
        if (tw(full, size) > fitW) {
          const half = Math.ceil(words.length / 2);
          lines = words.length > 1 ? [words.slice(0, half).join(' '), words.slice(half).join(' ')] : [full];
          const longest = Math.max(...lines.map((l) => tw(l, 1)));
          size = Math.max(30, Math.min(40 * k, fitW / longest));
        }
        let used = 0;
        const lh = size * 1.25;
        const y0 = -((lines.length - 1) * lh) / 2;
        const cursorOn = cp > 0 && cp < 1 && Math.sin(t * 9) > -0.2;
        return (
          <g>
            {lines.map((ln, i) => {
              const part = shown.slice(used, used + ln.length);
              used += ln.length + 1;
              const yy = y0 + i * lh + size * 0.34;
              const wl = tw(ln, size);
              return (
                <g key={i}>
                  <text x={-wl / 2} y={yy} fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={500} fontSize={size} fill={plum}>
                    {part}
                  </text>
                  <line x1={-wl / 2} y1={yy + size * 0.32} x2={-wl / 2 + wl * clamp01(part.length / Math.max(1, ln.length))} y2={yy + size * 0.32} stroke={plum} strokeWidth={3} strokeDasharray="9 7" strokeLinecap="round" opacity={0.8} />
                  {cursorOn && part.length < ln.length && part.length > 0 && <rect x={-wl / 2 + tw(part, size) + 4} y={yy - size * 0.78} width={4} height={size * 0.92} fill={plum} />}
                </g>
              );
            })}
          </g>
        );
      }
      case 'image': {
        const o = ease.out(cp);
        const sky = ink ? C.slate : C.sky;
        return (
          <g opacity={o} transform={`scale(${k * lerp(1.08, 1, o)})`}>
            <rect x={-170} y={-170} width={340} height={340} fill={sky} />
            {/* sun */}
            <circle cx={70} cy={-70} r={30 + life * 2} fill={C.lamp} />
            <circle cx={70} cy={-70} r={46 + life * 3} fill={C.lamp} opacity={0.25} />
            {/* hills */}
            <path d="M-170 50 C-90 10 -20 30 40 40 C100 50 140 30 170 36 L170 170 L-170 170 Z" fill={C.evidenceLight} />
            <path d="M-170 90 C-80 70 40 86 170 76 L170 170 L-170 170 Z" fill={C.evidence} opacity={0.85} />
            {/* house */}
            <rect x={-92} y={0} width={96} height={72} fill={C.paperLight} />
            <rect x={-92} y={0} width={20} height={72} fill={C.paperDeep} />
            <path d="M-104 4 L-44 -48 L16 4 Z" fill={C.oxblood} />
            <path d="M-104 4 L-44 -48 L-60 4 Z" fill={C.oxDeep} />
            <rect x={-56} y={30} width={24} height={42} fill={C.wood} />
            <rect x={-20} y={18} width={18} height={18} fill={C.lamp} />
            {/* tree */}
            <rect x={56} y={10} width={12} height={60} fill={C.woodDark} />
            <circle cx={62} cy={0} r={34 + life * 1.5} fill={C.evidence} />
            <circle cx={50} cy={-10} r={16} fill={C.evidenceLight} opacity={0.8} />
          </g>
        );
      }
      case 'feeling': {
        const o = ease.out(cp);
        const beat = 0.5 + 0.5 * Math.sin(t * 2.4 + seed);
        const blob = (rr: number, ph: number) => {
          const pts: string[] = [];
          for (let i = 0; i < 24; i++) {
            const a = (i / 24) * Math.PI * 2;
            const q = rr * (1 + 0.09 * noise1(i * 0.7 + t * 0.8 + ph, seed));
            pts.push(`${(Math.cos(a) * q).toFixed(1)} ${(Math.sin(a) * q).toFixed(1)}`);
          }
          return 'M' + pts.join(' L') + ' Z';
        };
        return (
          <g transform={`scale(${k * o})`}>
            {[0, 1, 2].map((i) => {
              const ph = (t * 0.45 + i / 3) % 1;
              return <circle key={i} r={62 + ph * 80} fill="none" stroke={C.caution} strokeWidth={4} opacity={(1 - ph) * 0.55} />;
            })}
            <path d={blob(78 + beat * 6, 0)} fill={C.oxTint} />
            <path d={blob(56 + beat * 5, 3)} fill={C.oxLight} opacity={0.85} />
            <path d={blob(30 + beat * 4, 6)} fill={C.cautionLight} />
          </g>
        );
      }
      case 'awareness': {
        const o = ease.out(cp);
        const sw = 4;
        return (
          <g transform={`scale(${k})`} opacity={o} fill="none" stroke={line} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            {/* lamp light pool */}
            <ellipse cx={58} cy={-6} rx={90} ry={70} fill={C.lamp} stroke="none" opacity={0.18 + 0.04 * life} />
            <ellipse cx={58} cy={-6} rx={58} ry={44} fill={C.lamp} stroke="none" opacity={0.2} />
            {/* floor line */}
            <line x1={-150} y1={92} x2={150} y2={92} opacity={0.6} />
            {/* window */}
            <rect x={-120} y={-96} width={80} height={96} />
            <line x1={-80} y1={-96} x2={-80} y2={0} />
            <line x1={-120} y1={-48} x2={-40} y2={-48} />
            {/* chair */}
            <path d="M-70 92 L-70 30 L-10 30 L-10 92 M-70 30 L-72 -30 M-10 30 L-10 50" />
            {/* lamp: base, pole, shade */}
            <path d="M40 92 L76 92 M58 92 L58 -10" />
            <path d="M34 -10 L82 -10 L72 -46 L44 -46 Z" fill={C.lamp} />
          </g>
        );
      }
      case 'wordless': {
        const o = ease.outBack(clamp01(cp * 1.2));
        const halo = 1 + 0.06 * life;
        return (
          <g transform={`scale(${k})`}>
            <rect x={-104} y={-84} width={208} height={168} rx={14} fill="none" stroke={faint} strokeWidth={3.5} strokeDasharray="10 9" opacity={ease.out(cp)} />
            <circle r={58 * halo} fill="none" stroke={plum} strokeWidth={4} strokeDasharray="8 8" opacity={0.75 * clamp01(cp * 1.5)} transform={`rotate(${t * 12})`} />
            <circle r={36 * halo} fill={plum} opacity={0.16 * clamp01(cp * 1.5)} />
            <circle r={18 * o} fill={plum} />
            <circle r={7 * o} cx={-5} cy={-5} fill={ink ? C.paperLight : C.theoryTint} opacity={0.8} />
          </g>
        );
      }
      case 'empty':
      default:
        return <circle r={r * 0.62} fill="none" stroke={faint} strokeWidth={3.5} strokeDasharray="10 10" opacity={0.7 * cp} transform={`rotate(${t * 6})`} />;
    }
  };

  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={cid}>
          <path d={shapeD} />
        </clipPath>
      </defs>
      <g transform={`scale(${lerp(0.82, 1, fp)})`} opacity={fp}>
        {frame !== 'none' && <path d={shapeD} fill={winFill} />}
        <g clipPath={frame !== 'none' ? `url(#${cid})` : undefined}>{content()}</g>
        {frame !== 'none' && <path d={shapeD} fill="none" stroke={kind === 'words' || kind === 'wordless' ? plum : line} strokeWidth={5} strokeDasharray={kind === 'empty' ? '12 10' : undefined} />}
      </g>
      {label && (
        <text y={r + labelSize + 22 + (1 - ramp(p, 0.4, 1)) * 12} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={600} fontSize={Math.max(30, labelSize)} letterSpacing={3} fill={ink ? C.paperShade : C.inkSoft} opacity={ramp(p, 0.4, 1)}>
          {label.toUpperCase()}
        </text>
      )}
    </g>
  );
};
