// Custom shots for C02 (builder-owned). Each: export const S<n>: React.FC<{t: number}> returning a full <Stage>.
import React from 'react';
import {Stage} from '../../../kit/stage';
import {C, FONT_SANS, FONT_SERIF} from '../../../kit/theme';
import {clamp01, ease, lerp, ramp} from '../../../kit/anim';
import {Tag, Circled} from '../../../kit/text';
import {Card, Bubble} from '../../../kit/cards';
import {Arrow} from '../../../kit/diagrams';
import {Person} from '../../../kit/people';
import {Icon} from '../../../kit/icons';
import {Clock} from '../../../kit/env';
import {Particles} from '../../../kit/fx';
import {Beeper, ThoughtContent} from '../shared';

// ---- cues (spoken words as comments)
const T = {
  chain: 54.5, // "Thought is made of words"
  words: 56.07, // "the words come with a voice"
  voice: 56.92, // "a voice"
  every: 57.76, // "everyone's"
  freeze: 60.7, // "Then researchers tried to catch it"
  walk: 62.9,
  hurl: 63.1, // "Russell Hurlburt"
  beep: 68.4, // "it went off"
  note: 70.0, // "freeze and record what was in their mind"
  usually: 73.4,
  strike: 73.65, // "Not what they usually think"
  circle: 74.85, // "What was there."
  s5: 81.6,
  never: 84.0, // "never reported it"
  three: 86.45, // "three out of four"
  crack: 97.4, // "it breaks"
  talk: 102.5, // "I talk to myself constantly"
  split: 104.4, // "your instinct and the data can disagree"
};

// ---- shared street of nonstop narrators (S2 / S3 / S7)
type Hair = 'short' | 'long' | 'bun' | 'curly' | 'ponytail' | 'bald';
type Walker = {x0: number; v: number; y: number; s: number; skin: number; outfit: 'casual' | 'suit' | 'labcoat'; hair: Hair; seed: number};
const WALKERS: Walker[] = (
  [
    {x0: 120, v: 34, y: 860, s: 0.44, skin: 0, outfit: 'casual', hair: 'short', seed: 1},
    {x0: 420, v: -30, y: 905, s: 0.48, skin: 3, outfit: 'suit', hair: 'bun', seed: 2},
    {x0: 700, v: 40, y: 840, s: 0.4, skin: 2, outfit: 'casual', hair: 'curly', seed: 3},
    {x0: 980, v: -36, y: 880, s: 0.46, skin: 4, outfit: 'casual', hair: 'long', seed: 4},
    {x0: 1260, v: 30, y: 930, s: 0.5, skin: 1, outfit: 'suit', hair: 'bald', seed: 5},
    {x0: 1500, v: -42, y: 850, s: 0.42, skin: 0, outfit: 'casual', hair: 'ponytail', seed: 6},
    {x0: 1780, v: 36, y: 900, s: 0.47, skin: 3, outfit: 'labcoat', hair: 'short', seed: 7},
    {x0: 2040, v: -32, y: 835, s: 0.4, skin: 2, outfit: 'casual', hair: 'bun', seed: 8},
    {x0: 260, v: -38, y: 950, s: 0.5, skin: 4, outfit: 'casual', hair: 'curly', seed: 9},
  ] as Walker[]
).map((w) => ({...w, s: w.s * 1.38, y: w.y + 28})).sort((a, b) => a.y - b.y);

const TOPS = [C.theoryLight, C.caution, C.evidenceLight, C.inkMute, C.wood, C.cautionTint, C.theory, C.stoneDark, C.evidence];
const BOTS = [C.inkSoft, C.woodDark, C.inkMute, C.ink];
const SPAN = 2320;
const wx = (w: Walker, tt: number) => ((((w.x0 + w.v * tt + 200) % SPAN) + SPAN) % SPAN) - 200;

/** small dashed-plum inner bubble streaming word-bars nonstop; c = crack 0..1 (falls apart) */
const MiniBubble: React.FC<{x: number; y: number; t: number; seed: number; c?: number; p?: number}> = ({x, y, t, seed, c = 0, p = 1}) => {
  if (p <= 0) return null;
  const w = 190;
  const h = 84;
  const cyc = (t * 1.5 + seed * 0.7) % 5.4;
  const bars = [0, 1, 2, 3].map((i) => ({x: -72 + i * 38, w: 26 + ((i * 5 + seed * 3) % 3) * 6, a: clamp01(cyc - i)}));
  const fall = ease.in(clamp01(c));
  const fx = (k: number) => Math.sin(k * 2.7 + seed) * 46 * ease.out(clamp01(c));
  const piece = (k: number, children: React.ReactNode) => (
    <g key={k} transform={`translate(${fx(k)} ${fall * (230 + k * 30)}) rotate(${Math.sin(k * 3 + seed) * 70 * fall})`} opacity={1 - clamp01((c - 0.55) / 0.45)}>
      {children}
    </g>
  );
  const sc = ease.outBack(clamp01(p));
  const seg = {stroke: C.theory, strokeWidth: 3.5, strokeDasharray: '12 9', strokeLinecap: 'round' as const};
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={clamp01(p * 3)}>
      {c <= 0.001 ? (
        <>
          <path d={`M-14 ${h / 2} L0 ${h / 2 + 22} L14 ${h / 2} Z`} fill={C.paperLight} stroke={C.theory} strokeWidth={3} strokeLinejoin="round" />
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={22} fill={C.paperLight} stroke={C.theory} strokeWidth={3.5} strokeDasharray="12 9" />
          {bars.map((b, i) => (
            <rect key={i} x={b.x} y={-7} width={b.w * b.a} height={14} rx={7} fill={C.theory} />
          ))}
        </>
      ) : (
        <>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={22} fill={C.paperLight} opacity={1 - clamp01(c * 5)} />
          {piece(1, <line x1={-w / 2 + 20} y1={-h / 2} x2={w / 2 - 20} y2={-h / 2} {...seg} />)}
          {piece(2, <line x1={-w / 2 + 20} y1={h / 2} x2={w / 2 - 20} y2={h / 2} {...seg} />)}
          {piece(3, <line x1={-w / 2} y1={-h / 2 + 18} x2={-w / 2} y2={h / 2 - 18} {...seg} />)}
          {piece(4, <line x1={w / 2} y1={-h / 2 + 18} x2={w / 2} y2={h / 2 - 18} {...seg} />)}
          {piece(5, <path d={`M-14 ${h / 2} L0 ${h / 2 + 22} L14 ${h / 2}`} fill="none" stroke={C.theory} strokeWidth={3} strokeLinejoin="round" />)}
          {bars.map((b, i) => piece(6 + i, <rect x={b.x} y={-7} width={b.w * Math.max(b.a, 0.5)} height={14} rx={7} fill={C.theory} />))}
          <path
            d={`M-8 ${-h / 2 - 6} L6 -14 L-10 4 L8 ${h / 2 + 6}`}
            fill="none"
            stroke={C.ink}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={1 - clamp01((c - 0.12) / 0.2)}
            strokeDasharray="120"
            strokeDashoffset={120 * (1 - clamp01(c / 0.1))}
          />
        </>
      )}
    </g>
  );
};

const Street: React.FC<{t: number; st?: number; crack?: number; clockTime?: number}> = ({t, st, crack = 0, clockTime}) => {
  const ts = st ?? t;
  const tt = ts - 54.4;
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={C.paperShade} />
      {[0, 1, 2].map((layer) =>
        [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const bw = 260 + ((i * 53 + layer * 31) % 90);
          const bh = [470, 380, 290][layer] + ((i * 97 + layer * 41) % 120);
          const bx = i * (250 + layer * 15) - 60 + layer * 90;
          const fill = [C.paperDark, C.paperDeep, C.paperShade][layer];
          const wf = [C.paperDeep, C.paperShade, C.paper][layer];
          return (
            <g key={layer * 10 + i}>
              <rect x={bx} y={800 - bh} width={bw} height={bh} fill={fill} />
              {[0, 1, 2].map((r) => [0, 1, 2].map((q) => <rect key={r * 3 + q} x={bx + 30 + q * 80} y={800 - bh + 36 + r * 84} width={46} height={54} fill={wf} />))}
            </g>
          );
        }),
      )}
      <rect x={0} y={800} width={1920} height={280} fill={C.stone} />
      <rect x={0} y={800} width={1920} height={10} fill={C.stoneShade} />
      {clockTime !== undefined && (
        <g opacity={ramp(t, 57.2, 58.0)}>
          <Clock x={1620} y={250} r={78} time={clockTime} t={t} color={C.ink} />
        </g>
      )}
      {WALKERS.map((w, i) => {
        const x = wx(w, tt);
        const dir = w.v > 0 ? 1 : -1;
        const hy = w.y - 540 * w.s - 78;
        const bp = ramp(t, T.every + (i % 9) * 0.1 - 0.05, T.every + (i % 9) * 0.1 + 0.4, ease.out);
        return (
          <g key={i}>
            <ellipse cx={x} cy={w.y + 4} rx={52 * w.s * 2} ry={9} fill={C.ink} opacity={0.12} />
            <Person x={x} y={w.y} s={w.s} facing={dir as 1 | -1} t={ts} walk={ts * 0.9 * (Math.abs(w.v) / 36) + w.seed} outfit={w.outfit} top={TOPS[i % TOPS.length]} bottom={BOTS[(i * 3) % BOTS.length]} hair={w.hair} skin={w.skin} seed={w.seed} />
            <MiniBubble x={x + dir * 10} y={hy} t={ts} seed={w.seed} c={crack} p={bp} />
          </g>
        );
      })}
    </g>
  );
};

// ================= S2 · 54.40 · "Thought is made of words…"
const Medallion: React.FC<{x: number; y: number; icon: 'thought' | 'document' | 'mouth'; label: string; p: number; plum?: boolean}> = ({x, y, icon, label, p, plum}) => {
  if (p <= 0) return null;
  const e = ease.outBack(clamp01(p));
  return (
    <g transform={`translate(${x} ${y}) scale(${e})`} opacity={clamp01(p * 3)}>
      <circle cx={0} cy={0} r={170} fill={C.paperLight} stroke={plum ? C.theory : C.ink} strokeWidth={5} strokeDasharray={plum ? '16 11' : undefined} />
      <Icon name={icon} x={0} y={0} s={3.4} color={plum ? C.theory : C.ink} />
      <text x={0} y={262} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={600} fontSize={64} fill={C.ink}>
        {label}
      </text>
    </g>
  );
};

export const S2: React.FC<{t: number}> = ({t}) => {
  const out = ramp(t, 57.3, 58.4, ease.inOut);
  const street = ramp(t, 57.15, 57.9, ease.out);
  const cs = lerp(1, 0.45, out);
  const ss = lerp(2.1, 1, ease.inOut(clamp01((t - 57.2) / 1.5)));
  const clockT = 3 + Math.max(0, t - 57.6) * 4.5;
  return (
    <Stage bg={C.paperShade}>
      <g opacity={1 - out} transform={`translate(960 480) scale(${cs}) translate(-960 -480)`}>
        <Medallion x={380} y={460} icon="thought" label="Thought" p={ramp(t, T.chain - 0.15, T.chain + 0.5)} />
        <Medallion x={960} y={460} icon="document" label="Words" p={ramp(t, T.words - 0.15, T.words + 0.5)} />
        <Medallion x={1540} y={460} icon="mouth" label="A voice" p={ramp(t, T.voice - 0.15, T.voice + 0.5)} plum />
        <Arrow from={{x: 570, y: 460}} to={{x: 760, y: 460}} p={ramp(t, T.words - 0.35, T.words + 0.1, ease.out)} color={C.theory} dashed width={7} />
        <Arrow from={{x: 1150, y: 460}} to={{x: 1350, y: 460}} p={ramp(t, T.voice - 0.4, T.voice + 0.1, ease.out)} color={C.theory} dashed width={7} />
      </g>
      <g opacity={street} transform={`translate(960 640) scale(${ss}) translate(-960 -640)`}>
        <Street t={t} clockTime={clockT} />
      </g>
    </Stage>
  );
};

const NTag: React.FC<{x: number; y: number; name: string; sub?: string; p: number}> = ({x, y, name, sub, p}) => {
  if (p <= 0) return null;
  const k = ease.out(clamp01(p));
  return (
    <g transform={`translate(${x - (1 - k) * 30} ${y})`} opacity={k}>
      <rect x={-6} y={-52} width={170 + name.length * 24} height={sub ? 120 : 76} rx={10} fill={C.paperLight} opacity={0.92} />
      <rect x={0} y={-46} width={8} height={sub ? 108 : 64} fill={C.ink} />
      <text x={26} y={0} fontFamily={FONT_SERIF} fontWeight={700} fontSize={56} fill={C.ink}>{name}</text>
      {sub && <text x={28} y={46} fontFamily={FONT_SANS} fontWeight={700} fontSize={34} letterSpacing={4} fill={C.inkMute}>{sub.toUpperCase()}</text>}
    </g>
  );
};

// ================= S3 · 60.60 · "Then researchers tried to catch it in the act…"
const HEAD_Y = 548;
const Corner: React.FC<{x: number; y: number; sx: number; sy: number; p: number}> = ({x, y, sx, sy, p}) => (
  <path d={`M${x} ${y + sy * 70 * p} V${y} H${x + sx * 70 * p}`} fill="none" stroke={C.ink} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
);

export const S3: React.FC<{t: number}> = ({t}) => {
  const flash = Math.max(0, 1 - Math.abs(t - T.freeze - 0.05) / 0.28) * 0.9;
  const dim = ramp(t, T.freeze + 0.1, T.freeze + 0.9) * 0.3;
  const wp = ramp(t, T.walk, 67.0, ease.out);
  const vx = lerp(-160, 580, wp);
  const moving = t > T.walk && wp < 0.985;
  const vy = 1010;
  const beepF = t >= T.beep ? clamp01(1 - (t - T.beep) / 0.12) * 0.65 : 0;
  const framep = ramp(t, T.beep + 0.05, T.beep + 0.5, ease.outQuint);
  const cp = ramp(t, T.beep + 0.35, T.beep + 1.35, ease.outQuint);
  const cx = lerp(vx + 24, 1120, cp);
  const cy = lerp(HEAD_Y, 470 + Math.sin(t * 1.4) * 6, cp);
  const cs = lerp(0.2, 1, cp);
  const tcp = ramp(t, T.beep + 0.8, T.beep + 2.0);
  const notep = ramp(t, T.note - 0.1, T.note + 0.6);
  const usp = ramp(t, T.usually, T.usually + 0.5);
  const strikep = ramp(t, T.strike, T.strike + 0.35, ease.out);
  const circp = ramp(t, T.circle, T.circle + 0.7, ease.out);
  return (
    <Stage bg={C.paperShade}>
      <Street t={t} st={T.freeze} />
      <rect x={0} y={0} width={1920} height={1080} fill={C.paper} opacity={dim} />
      <Particles t={t} x={0} y={0} w={1920} h={1080} n={14} seed={4} size={[3,6]} color={C.theory} opacity={[0.15,0.35]} vy={-6} vx={4} />
      <rect x={0} y={0} width={1920} height={1080} fill={C.paperLight} opacity={flash} />

      <ellipse cx={vx} cy={vy + 4} rx={120} ry={14} fill={C.ink} opacity={0.14} />
      <Person x={vx} y={vy} s={0.95} t={t} walk={moving ? (t - T.walk) * 0.9 : undefined} outfit="casual" hair="ponytail" skin={3} seed={21} expression="neutral" />
      <Beeper x={vx + 52} y={vy - 232} s={0.34} p={ramp(t, T.walk + 0.4, T.walk + 1.0)} t={t} beepAt={[T.beep]} />

      <g opacity={framep}>
        <Corner x={70} y={70} sx={1} sy={1} p={framep} />
        <Corner x={1850} y={70} sx={-1} sy={1} p={framep} />
        <Corner x={70} y={1010} sx={1} sy={-1} p={framep} />
        <Corner x={1850} y={1010} sx={-1} sy={-1} p={framep} />
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill={C.paperLight} opacity={beepF * 0.5} />

      {cp > 0 && cp < 1 && <line x1={vx + 24} y1={HEAD_Y} x2={cx} y2={cy} stroke={C.theory} strokeWidth={4} strokeDasharray="10 9" opacity={1 - cp} />}
      {cp > 0 && (
        <g transform={`translate(${cx} ${cy}) scale(${cs})`}>
          <rect x={-178} y={-194} width={380} height={420} rx={16} fill={C.ink} opacity={0.14} />
          <rect x={-190} y={-210} width={380} height={420} rx={16} fill={C.paperLight} stroke={C.ink} strokeWidth={3} />
          <ThoughtContent x={0} y={-6} r={150} p={tcp} t={t} kind="image" frame="card" seed={3} />
          <rect x={-120} y={168} width={240} height={14} rx={7} fill={C.paperDark} opacity={ramp(t, T.beep + 1.2, T.beep + 1.6)} />
        </g>
      )}
      <Card x={1610} y={420} w={440} h={250} p={notep} rot={3} fill={C.cautionTint}>
        <text x={34} y={92} fontFamily={FONT_SANS} fontWeight={800} fontSize={36} letterSpacing={2} fill={C.ink}>
          WHAT WAS IN
        </text>
        <text x={34} y={142} fontFamily={FONT_SANS} fontWeight={800} fontSize={36} letterSpacing={2} fill={C.ink}>
          YOUR MIND —
        </text>
        <text x={34} y={192} fontFamily={FONT_SANS} fontWeight={800} fontSize={36} letterSpacing={2} fill={C.ink}>
          RIGHT NOW?
        </text>
      </Card>
      <Card x={1610} y={800} w={440} h={120} p={usp} rot={-2} fill={C.paperLight}>
        <text x={36} y={80} fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={500} fontSize={56} fill={C.ink} opacity={lerp(1, 0.55, strikep)}>
          USUALLY…
        </text>
        <line x1={20} y1={64} x2={20 + 400 * strikep} y2={52 - 6 * strikep} stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      </Card>
      <Circled x={1120} y={470} rx={218} ry={240} p={circp} color={C.oxblood} thick={9} rot={-4} />

      <NTag x={120} y={200} name="Russell Hurlburt" sub="Psychologists" p={ramp(t, T.hurl - 0.45, T.hurl + 0.3)} />
      <NTag x={120} y={340} name="Chris Heavey" p={ramp(t, T.hurl + 0.05, T.hurl + 0.7)} />
    </Stage>
  );
};

// ================= S5 · 81.50 · "the average hides what matters…"
const STRIPS = [2, 0, 6, 1, 3, 1]; // average ≈ 26 %
const SKIN = [0, 3, 2, 4, 1, 3];
const HAIR: Hair[] = ['short', 'bun', 'curly', 'bald', 'long', 'ponytail'];
const OUT: ('casual' | 'suit' | 'labcoat')[] = ['casual', 'suit', 'casual', 'labcoat', 'casual', 'suit'];

export const S5: React.FC<{t: number}> = ({t}) => {
  const sp = ramp(t, T.s5 - 0.05, T.s5 + 0.9, ease.inOut);
  const fs = lerp(230, 110, sp);
  const lx = 960;
  const ly = lerp(560, 190, sp);
  const hl = ramp(t, T.never - 0.2, T.never + 0.3);
  return (
    <Stage bg={C.paperShade}>
      <rect x={0} y={760} width={1920} height={320} fill={C.stone} opacity={0.4} />
      <text x={lx} y={ly + fs * 0.34} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={fs} fill={C.oxblood}>
        26%
      </text>
      {STRIPS.map((n, i) => {
        const x = 210 + i * 300;
        const ip = ramp(t, T.s5 + 0.3 + i * 0.12, T.s5 + 0.9 + i * 0.12, ease.out);
        const isHi = i === 1 || i === 2;
        const dim = lerp(1, isHi ? 1 : 0.65, hl);
        return (
          <g key={i} opacity={ip * dim} transform={`translate(0 ${(1 - ip) * 40})`}>
            <ellipse cx={x} cy={692} rx={80} ry={10} fill={C.ink} opacity={0.12} />
            <Person x={x} y={690} s={0.62} t={t} skin={SKIN[i]} hair={HAIR[i]} outfit={OUT[i]} top={TOPS[(i + 2) % TOPS.length]} bottom={BOTS[i % BOTS.length]} seed={30 + i} expression="neutral" />
            {Array.from({length: 8}).map((_, k) => {
              const fp = ramp(t, T.s5 + 1.2 + i * 0.1 + k * 0.07, T.s5 + 1.45 + i * 0.1 + k * 0.07, ease.outBack);
              const sx = x - 4 * 33 + k * 33 + 3;
              return (
                <g key={k}>
                  <rect x={sx} y={760} width={28} height={28} rx={5} fill={C.paperLight} stroke={C.paperDark} strokeWidth={2.5} />
                  {k < n && <rect x={sx + 14 - 14 * fp} y={774 - 14 * fp} width={28 * fp} height={28 * fp} rx={5} fill={C.theory} />}
                </g>
              );
            })}
          </g>
        );
      })}
      <Tag x={510} y={850} anchor="center" text="Never" kind="theory" size={42} p={ramp(t, T.never - 0.1, T.never + 0.5)} />
      <Tag x={810} y={935} anchor="center" text="Roughly 3 out of 4" kind="theory" size={42} p={ramp(t, T.three - 0.15, T.three + 0.5)} />
      <Particles t={t} x={0} y={0} w={1920} h={1080} n={10} seed={7} size={[3,5]} color={C.theory} opacity={[0.1,0.3]} vy={-5} />
    </Stage>
  );
};

// ================= S7 · 97.10 · "But it breaks the picture of a narrator that never stops."
export const S7: React.FC<{t: number}> = ({t}) => {
  const c = ramp(t, T.crack - 0.1, T.crack + 1.5, ease.inOut);
  const z = 1 + 0.05 * clamp01((t - 97.1) / 3.2);
  return (
    <Stage bg={C.paperShade}>
      <g transform={`translate(960 640) scale(${z}) translate(-960 -640)`}>
        <Street t={t} crack={c} clockTime={3 + Math.max(0, t - 57.6) * 4.5} />
      </g>
      <Particles t={t} x={0} y={500} w={1920} h={500} n={10} seed={9} size={[3,6]} color={C.theory} opacity={[0.2,0.4]} vy={8} />
    </Stage>
  );
};

// ================= S8 · 100.20 · "Your instinct is already pushing back…"
type TK = 'words' | 'image' | 'feeling' | 'awareness' | 'wordless' | 'empty';
const WALL: TK[] = ['image', 'words', 'feeling', 'awareness', 'image', 'wordless', 'feeling', 'empty', 'words'];

export const S8: React.FC<{t: number}> = ({t}) => {
  const sp = ramp(t, T.split - 0.1, T.split + 0.9, ease.inOut);
  const px = lerp(800, 440, sp);
  const bp = ramp(t, T.talk - 0.2, T.talk + 0.45);
  const wallp = ramp(t, T.split + 0.05, T.split + 0.9, ease.out);
  return (
    <Stage bg={C.paperShade}>
      <rect x={0} y={800} width={1920} height={280} fill={C.stone} opacity={0.4} />
      <g opacity={clamp01(wallp * 2)} transform={`translate(${(1 - wallp) * 160} 0)`}>
        <rect x={1060} y={110} width={770} height={800} rx={24} fill={C.paperDeep} />
        {WALL.map((k, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const ip = ramp(t, T.split + 0.35 + i * 0.09, T.split + 0.9 + i * 0.09, ease.out);
          return <ThoughtContent key={i} x={1210 + col * 245} y={270 + row * 245} r={88} p={ip} t={t} kind={k} frame="card" text="Next, colour." seed={i + 2} id={`w${i}`} />;
        })}
      </g>
      <rect x={998} y={110 + 800 * (1 - sp)} width={5} height={800 * sp} fill={C.ink} opacity={0.5} />
      <ellipse cx={px} cy={1014} rx={130} ry={14} fill={C.ink} opacity={0.14} />
      <Person x={px} y={1010} s={0.95} t={t} pose="cross" expression="determined" outfit="casual" hair="curly" skin={2} seed={11} />
      <Bubble x={px + 10} y={300} w={720} h={130} kind="inner" text="I talk to myself constantly." size={46} to={{x: px, y: 470}} p={bp} type={ramp(t, T.talk - 0.1, T.talk + 1.2)} />
      <g transform={`translate(1000 540) scale(${ease.outBack(ramp(t, T.split + 0.8, T.split + 1.3))})`}>
        <circle r={52} fill={C.paperLight} stroke={C.caution} strokeWidth={6} />
        <text x={0} y={22} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={70} fill={C.caution}>
          ≠
        </text>
      </g>
    </Stage>
  );
};
