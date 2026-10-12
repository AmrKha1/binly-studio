import React from 'react';
import {Stage, Cam, breathe} from '../../../kit/stage';
import {C, FONT_SERIF, FONT_SANS} from '../../../kit/theme';
import {ease, lerp, noise1, rand, ramp} from '../../../kit/anim';
import {Stamp, Tag, textW} from '../../../kit/text';
import {Card, Polaroid} from '../../../kit/cards';
import {Icon, IconName} from '../../../kit/icons';
import {MuseumHall, mixC} from '../../../kit/env';
import {Crowd} from '../../../kit/people';
import {Particles} from '../../../kit/fx';
import {makeCurve, smoothPath} from '../../../kit/science';

// ───────────────────────── cues (from tools/cue.mjs) ─────────────────────────
const T = {
  stamp: 3.06, // "has ever existed"
  cards: [3.92, 4.82, 6.24, 7.52], // "No witness." "No preserved muscle." "No skin sample." "No color chart."
  dive: 8.5, // "Almost all of the soft tissue is gone"
  diveEnd: 9.9,
  swap: 9.95, // desk world -> bone world (identical frame)
  bones: 10.0, // outline fades to bones
  rock: 11.0, // "What's left is mostly rock" (10.82)
  evid: 11.95, // green EVIDENCE tag
  rise: 12.35, // "And yet" (12.55)
  arrive: 15.2, // museum hall reached ("natural history museum" 14.5)
  crowd: 15.4, // visitors appear
  bonesTag: 17.5, // "Tyrannosaurus" (17.40)
  flesh: 19.11, // "Fully fleshed"
  stripes: 20.28, // "textured"
  colour: 21.14, // "colored"
  stride: 21.87, // "mid-stride"
  turn: 23.13, // "looking back at you"
  frame: 25.2, // "forgot to take"
  frameEnd: 26.05,
  flash: 25.56, // "photograph"
};

const CROWD = mixC(C.paperDeep, C.ink, 0.62);
const D = 1500; // world offset of the bone scene below the museum
const WALL = mixC(C.paperShade, C.paperDeep, 0.25);

type Pt = [number, number];
const mixP = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const mixLeg = (a: Pt[], b: Pt[], k: number) => a.map((p, i) => mixP(p, b[i], k));

// ───────────────────────── the dinosaur (local helper, side view, feet on y=0, facing right) ─────────────────────────
// legs: [hip, knee, ankle, ball-of-foot, toe tip]
const FAR_STAND: Pt[] = [[-18, -148], [28, -92], [-24, -44], [-20, -10], [38, -2]];
const FAR_STRIDE: Pt[] = [[-18, -148], [14, -98], [-52, -54], [-58, -12], [2, -2]];
const NEAR_STAND: Pt[] = [[8, -148], [74, -96], [26, -44], [30, -10], [92, -2]];
const NEAR_STRIDE: Pt[] = [[8, -148], [108, -120], [64, -64], [106, -56], [152, -42]];

const SPINE: Pt[] = [[-328, -156], [-262, -176], [-196, -199], [-128, -220], [-58, -234], [14, -241], [84, -247], [140, -259], [182, -283]];
const spineY = (x: number) => {
  for (let i = 1; i < SPINE.length; i++) {
    if (x <= SPINE[i][0]) return lerp(SPINE[i - 1][1], SPINE[i][1], (x - SPINE[i - 1][0]) / (SPINE[i][0] - SPINE[i - 1][0]));
  }
  return SPINE[SPINE.length - 1][1];
};
const SPINE_CURVE = makeCurve(SPINE);

const BODY = smoothPath(
  [[-334, -156], [-262, -186], [-192, -208], [-122, -229], [-52, -247], [18, -254], [90, -261], [148, -275], [192, -296], [230, -278], [212, -232], [184, -192], [150, -156], [104, -128], [30, -114], [-42, -120], [-104, -150], [-172, -160], [-252, -156]],
  true
);
const HEAD = smoothPath(
  [[192, -322], [222, -343], [268, -346], [318, -332], [350, -315], [354, -299], [334, -289], [338, -279], [318, -264], [270, -257], [224, -257], [198, -268], [186, -296]],
  true
);
// the guess: one dashed silhouette (standing, simplified)
const GHOST = smoothPath(
  [[-334, -156], [-262, -186], [-192, -208], [-122, -229], [-52, -247], [18, -254], [90, -261], [148, -275], [192, -300], [224, -344], [272, -348], [320, -334], [352, -316], [356, -298], [334, -288], [338, -278], [316, -262], [270, -255], [228, -250], [212, -222], [184, -190], [150, -158], [116, -126], [108, -98], [74, -64], [58, -40], [100, -12], [100, 3], [-14, 3], [-26, -40], [-48, -76], [-52, -112], [-46, -122], [-102, -148], [-172, -160], [-252, -156]],
  true
);
// place the dino's bounding-box centre at the origin, scaled by k
const centre = (k: number) => `scale(${k}) translate(-11 172)`;

const taper = (p: Pt, q: Pt, w1: number, w2: number) => {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l;
  const ny = dx / l;
  return `M${p[0] + (nx * w1) / 2} ${p[1] + (ny * w1) / 2} L${q[0] + (nx * w2) / 2} ${q[1] + (ny * w2) / 2} L${q[0] - (nx * w2) / 2} ${q[1] - (ny * w2) / 2} L${p[0] - (nx * w1) / 2} ${p[1] - (ny * w1) / 2} Z`;
};

const FleshLeg: React.FC<{leg: Pt[]; col: string}> = ({leg, col}) => {
  const [hip, knee, ankle, ball, toe] = leg;
  const toe2: Pt = [toe[0] - 14, toe[1] + 1];
  return (
    <g fill={col}>
      <path d={taper(hip, knee, 84, 58)} />
      <circle cx={hip[0]} cy={hip[1]} r={42} />
      <circle cx={knee[0]} cy={knee[1]} r={29} />
      <path d={taper(knee, ankle, 54, 32)} />
      <circle cx={ankle[0]} cy={ankle[1]} r={16} />
      <path d={taper(ankle, ball, 30, 28)} />
      <path d={taper(ball, toe, 30, 14)} />
      <path d={taper(ball, toe2, 24, 10)} />
      <circle cx={ball[0]} cy={ball[1]} r={14} />
    </g>
  );
};

const BoneLeg: React.FC<{leg: Pt[]; fill: string; line: string}> = ({leg, fill, line}) => {
  const [hip, knee, ankle, ball, toe] = leg;
  return (
    <g fill={fill} stroke={line} strokeWidth={2.5} strokeLinejoin="round">
      <path d={taper(hip, knee, 17, 13)} />
      <path d={taper(knee, ankle, 12, 8)} />
      <path d={taper(ankle, ball, 9, 9)} />
      <path d={taper(ball, toe, 8, 3)} />
      <path d={taper(ball, [toe[0] - 14, toe[1] + 1], 6, 2)} />
      <circle cx={hip[0]} cy={hip[1]} r={11} />
      <circle cx={knee[0]} cy={knee[1]} r={11} />
      <circle cx={ankle[0]} cy={ankle[1]} r={8} />
    </g>
  );
};

const Teeth: React.FC<{fill: string}> = ({fill}) => (
  <g fill={fill}>
    {Array.from({length: 8}, (_, i) => {
      const x = 332 - i * 13;
      return <path key={i} d={`M${x} ${-290 + i * 0.4} l-6 0 l3 ${9 - (i % 2) * 2} Z`} />;
    })}
  </g>
);

type RexProps = {
  id: string;
  t: number;
  bones?: number;
  flesh?: number; // 0→1 wipe tail→head
  stripes?: number;
  colour?: number;
  stride?: number;
  turn?: number;
  boneFill?: string;
  boneLine?: string;
};

const Rex: React.FC<RexProps> = ({id, t, bones = 1, flesh = 0, stripes = 0, colour = 0, stride = 0, turn = 0, boneFill = C.bone, boneLine = C.boneShade}) => {
  const sg = ease.inOut(stride);
  const far = mixLeg(FAR_STAND, FAR_STRIDE, sg);
  const near = mixLeg(NEAR_STAND, NEAR_STRIDE, sg);
  const bob = -5 * sg + Math.sin(t * 1.7) * 1.2;
  const lean = -1.6 * sg;
  const baseCol = mixC(C.stone, mixC(C.oxblood, C.wood, 0.42), colour);
  const shadeCol = mixC(baseCol, C.ink, 0.28);
  const bellyCol = mixC(baseCol, C.paperDeep, 0.5);
  const dark = mixC(baseCol, C.ink, 0.62);
  const hp: Pt = [200, -285];
  const headT = `translate(${hp[0]} ${hp[1] + 4 * turn}) rotate(${-3 * turn}) scale(${1 - 0.34 * turn} 1) translate(${-hp[0]} ${-hp[1]})`;
  const wipeW = lerp(0, 840, ease.inOut(flesh));
  const blink = Math.max(0, 1 - Math.abs((t * 0.37) % 1 - 0.5) * 40);
  const eyeY = -319;
  const ribs = Array.from({length: 7}, (_, i) => {
    const sx = 136 - i * 21;
    const sy = spineY(sx) + 6;
    const len = 112 - i * 7;
    return `M${sx} ${sy} C${sx + 24} ${sy + 22} ${sx + 38} ${sy + len * 0.6} ${sx + 22} ${sy + len}`;
  });
  return (
    <g transform={`translate(0 ${bob}) rotate(${lean} -10 -150)`}>
      {bones > 0 && (
        <g opacity={bones}>
          <BoneLeg leg={far} fill={mixC(boneFill, C.ink, 0.14)} line={boneLine} />
          {ribs.map((d, i) => (
            <g key={i} fill="none" strokeLinecap="round">
              <path d={d} stroke={boneLine} strokeWidth={10} />
              <path d={d} stroke={boneFill} strokeWidth={5.5} />
            </g>
          ))}
          <path d={SPINE_CURVE.d} fill="none" stroke={boneLine} strokeWidth={8} strokeLinecap="round" />
          {Array.from({length: 32}, (_, i) => {
            const pt = SPINE_CURVE.at(i / 31);
            const r = lerp(3.2, 10.5, ease.out(i / 31));
            return <circle key={i} cx={pt.x} cy={pt.y} r={r} fill={boneFill} stroke={boneLine} strokeWidth={2} />;
          })}
          <path d="M-62 -232 L8 -246 L28 -206 L18 -160 L-2 -138 L-30 -150 L-50 -190 Z" fill={boneFill} stroke={boneLine} strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M22 -168 L52 -118 L38 -112 L6 -150 Z" fill={boneFill} stroke={boneLine} strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M146 -214 L172 -178 L198 -184" fill="none" stroke={boneLine} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M146 -214 L172 -178 L198 -184" fill="none" stroke={boneFill} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <g transform={headT}>
            <path d={HEAD} fill={boneFill} stroke={boneLine} strokeWidth={3} strokeLinejoin="round" />
            <ellipse cx={262} cy={eyeY} rx={14} ry={13} fill={C.ink} />
            <ellipse cx={308} cy={-318} rx={24} ry={9} fill={C.inkSoft} transform="rotate(8 308 -318)" />
            <path d="M356 -298 L228 -283" stroke={boneLine} strokeWidth={3} fill="none" strokeLinecap="round" />
            <Teeth fill={C.paperLight} />
          </g>
          <BoneLeg leg={near} fill={boneFill} line={boneLine} />
        </g>
      )}

      {flesh > 0 && (
        <g>
          <clipPath id={`${id}-wipe`}>
            <rect x={-420} y={-420} width={wipeW} height={520} />
          </clipPath>
          <mask id={`${id}-sil`} maskUnits="userSpaceOnUse" x={-420} y={-420} width={900} height={520}>
            <path d={BODY} fill="#fff" />
            <path d={HEAD} fill="#fff" />
            <FleshLeg leg={far} col="#fff" />
            <FleshLeg leg={near} col="#fff" />
          </mask>
          <g clipPath={`url(#${id}-wipe)`}>
            <FleshLeg leg={far} col={shadeCol} />
            <path d={BODY} fill={baseCol} />
            <path d={smoothPath([[150, -156], [104, -134], [30, -122], [-42, -128], [-104, -152], [-60, -150], [20, -148], [100, -156]], true)} fill={bellyCol} opacity={0.9} />
            {stripes > 0 && (
              <g mask={`url(#${id}-sil)`} opacity={stripes * 0.5} fill={C.ink}>
                {Array.from({length: 17}, (_, i) => {
                  const x = -316 + i * 30;
                  const top = spineY(x) - 60;
                  const k = 0.55 + 0.45 * rand(i + 9);
                  return <path key={i} d={`M${x} ${top} L${x + 14} ${top} L${x + 3 + 10 * k} ${top + 120 * k + 60} L${x - 6} ${top + 120 * k + 52} Z`} />;
                })}
              </g>
            )}
            <FleshLeg leg={near} col={baseCol} />
            <path d="M146 -212 L172 -176 L196 -182" fill="none" stroke={shadeCol} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" />
            <g transform={headT}>
              <path d={HEAD} fill={baseCol} />
              <path d={smoothPath([[196, -268], [240, -262], [300, -266], [336, -283], [318, -266], [270, -257], [224, -257]], true)} fill={bellyCol} opacity={0.85} />
              <path d="M356 -298 L228 -284" stroke={dark} strokeWidth={3.5} fill="none" strokeLinecap="round" />
              <Teeth fill={C.paperLight} />
              <path d="M222 -336 C 246 -346 270 -340 282 -330" stroke={dark} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.7} />
              <circle cx={262 + turn * 12} cy={eyeY} r={13} fill={C.cautionLight} />
              <circle cx={262 + turn * 15} cy={eyeY} r={6.5 - 1.5 * turn} fill={C.ink} />
              <g opacity={ramp(turn, 0.35, 0.9)}>
                <circle cx={302} cy={-326} r={11} fill={C.cautionLight} />
                <circle cx={298} cy={-326} r={5.5} fill={C.ink} />
                <circle cx={338} cy={-308} r={3.6} fill={dark} />
              </g>
              <circle cx={340} cy={-309} r={3.4} fill={dark} opacity={1 - ramp(turn, 0.35, 0.9)} />
              {blink > 0 && <rect x={246} y={eyeY - 14} width={32} height={28 * Math.min(1, blink)} fill={baseCol} />}
            </g>
          </g>
        </g>
      )}
    </g>
  );
};

// ───────────────────────── strata ─────────────────────────
const BANDS = [940, 1090, 1350, 1580, 1830, 2130, 2350];
const BOTTOM = D + 1080 + 40;
const wavy = (top: number, seed: number) => {
  let d = '';
  for (let x = -420; x <= 2340; x += 40) {
    const y = top + noise1(x * 0.0045, seed) * 20 + noise1(x * 0.017, seed + 5) * 7;
    d += `${x === -420 ? 'M' : 'L'}${x} ${y.toFixed(1)} `;
  }
  return d;
};
const Band: React.FC<{k: number; off: number}> = ({k, off}) => {
  const top = BANDS[k];
  const col = C.strata[k];
  const yEnd = k < 6 ? BANDS[k + 1] : BOTTOM;
  return (
    <g transform={`translate(0 ${off})`}>
      <path d={`${wavy(top, k + 1)} L2340 ${BOTTOM + 200} L-420 ${BOTTOM + 200} Z`} fill={col} />
      <path d={wavy(top, k + 1)} fill="none" stroke={mixC(col, C.paperLight, 0.22)} strokeWidth={6} opacity={0.55} />
      {Array.from({length: 14}, (_, i) => {
        const s = k * 40 + i;
        const dk = rand(s + 4) > 0.5;
        return (
          <ellipse
            key={i}
            cx={-300 + rand(s) * 2500}
            cy={top + 30 + rand(s + 1) * Math.max(40, yEnd - top - 60)}
            rx={6 + rand(s + 2) * 20}
            ry={3 + rand(s + 3) * 8}
            fill={dk ? mixC(col, C.ink, 0.3) : mixC(col, C.paperLight, 0.25)}
            opacity={0.5}
          />
        );
      })}
    </g>
  );
};

// ───────────────────────── Desk world (0 → swap) ─────────────────────────
const CARDS: {label: string; icon: IconName}[] = [
  {label: 'No witness', icon: 'eye'},
  {label: 'No preserved muscle', icon: 'hand'},
  {label: 'No skin sample', icon: 'magnifier'},
  {label: 'No color chart', icon: 'question'},
];
const POL = {x: 700, y: 500, w: 640, rot: -2};
const WS = 0.685; // dino scale inside the photo window
const ZOOM = 3.5; // dive zoom (window fills the frame)

const ghostOp = (t: number) => (t < T.swap ? lerp(1, 1, ramp(t, T.dive, T.diveEnd)) : 1 - ramp(t, T.bones + 0.1, T.bones + 1.0));

const Ghost: React.FC<{t: number; op: number}> = ({t, op}) => (
  <path d={GHOST} fill="none" stroke={C.theoryLight} strokeWidth={9} strokeDasharray="22 16" strokeLinecap="round" strokeDashoffset={-t * 6} opacity={op} />
);

const deskCam = (t: number) => {
  const u = Math.min(1, t / 8.5);
  const pz = 1 + 0.1 * u;
  const pcx = lerp(930, 960, u);
  const k = ramp(t, T.dive, T.diveEnd, ease.inOutQuint);
  const kp = ramp(t, T.dive, T.diveEnd, ease.inOut);
  return {cx: lerp(pcx, POL.x, kp), cy: lerp(540, POL.y, kp), z: Math.exp(lerp(Math.log(pz), Math.log(ZOOM), k)), r: lerp(0, -POL.rot, kp)};
};

const Desk: React.FC<{t: number}> = ({t}) => {
  const cam0 = deskCam(t);
  const cam = t < T.dive ? breathe(cam0, t, 0.8) : cam0;
  const stampP = ramp(t, T.stamp - 0.12, T.stamp + 0.35, ease.linear);
  const stampOut = 1 - ramp(t, T.dive - 0.3, T.dive + 0.35);
  const stampText = 'NO PHOTOGRAPH';
  const sw = textW(stampText, 46, 'sansCaps', 800) + 46 * 1.2;
  return (
    <Stage bg={C.paperShade}>
      <Cam cam={cam}>
        <rect x={-900} y={-700} width={4000} height={2600} fill={C.paperShade} />
        {Array.from({length: 40}, (_, i) => (
          <line key={`v${i}`} x1={-700 + i * 80} y1={-600} x2={-700 + i * 80} y2={1700} stroke={C.inkFaint} strokeWidth={1.5} opacity={0.14} />
        ))}
        {Array.from({length: 30}, (_, i) => (
          <line key={`h${i}`} x1={-700} y1={-500 + i * 80} x2={3000} y2={-500 + i * 80} stroke={C.inkFaint} strokeWidth={1.5} opacity={0.14} />
        ))}
        <rect x={154} y={108} width={1660} height={900} rx={26} fill={C.ink} opacity={0.1} />
        <rect x={140} y={90} width={1660} height={900} rx={26} fill={C.paperLight} opacity={0.7} />

        <Polaroid id="c01-pol" x={POL.x} y={POL.y} w={POL.w} rot={POL.rot} caption="T. rex, living" p={1}>
          <g transform={`scale(${WS}) translate(-11 172)`}>
            <Ghost t={t} op={ghostOp(t)} />
          </g>
        </Polaroid>

        {CARDS.map((c, i) => {
          const p = ramp(t, T.cards[i] - 0.2, T.cards[i] + 0.6, ease.outQuint);
          const cy = 242 + i * 172;
          const dx = (1 - p) * 240;
          const tp = ramp(t, T.cards[i] + 0.35, T.cards[i] + 0.95, ease.out);
          return (
            <g key={i} transform={`translate(${dx} 0)`}>
              <Card x={1425} y={cy} w={720} h={150} p={p}>
                <Icon name={c.icon} x={80} y={75} s={1.15} color={C.ink} accent={C.theory} p={ramp(p, 0.3, 1)} />
                <text x={152} y={91} fontFamily={FONT_SERIF} fontWeight={600} fontSize={38} fill={C.ink}>
                  {c.label}
                </text>
              </Card>
              <Tag x={1425 + 360 - 30} y={cy} text="None" kind="caution" anchor="right" size={24} p={tp} />
            </g>
          );
        })}

        {stampP > 0 && stampOut > 0 && (
          <g opacity={stampOut} transform={`rotate(${POL.rot} ${POL.x} ${POL.y})`}>
            <g transform={`translate(${POL.x} ${POL.y + 24}) rotate(-8)`}>
              <rect x={-sw / 2} y={-39} width={sw} height={78} rx={8} fill={C.paperLight} opacity={Math.min(1, stampP * 3) * 0.95} />
            </g>
            <Stamp x={POL.x} y={POL.y + 24} text={stampText} p={stampP} size={46} rot={-8} />
          </g>
        )}
      </Cam>
    </Stage>
  );
};

// ───────────────────────── Bone + museum scene (swap → end) ─────────────────────────
const worldCam = (t: number) => {
  if (t < T.rise) return {cx: 960, cy: 540 + D, z: 1, r: 0};
  const k = ramp(t, T.rise, T.arrive, ease.inOutQuint);
  const z = 1 - 0.1 * Math.sin(Math.PI * k);
  const push = 1 + 0.06 * ramp(t, T.arrive, T.frame, ease.inOutSine);
  return {cx: 960, cy: lerp(540 + D, 540, k), z: z * push, r: 0};
};

const Scene: React.FC<{t: number; ui?: number}> = ({t, ui = 1}) => {
  const cam0 = worldCam(t);
  const cam = t > T.arrive ? breathe(cam0, t, 0.8) : cam0;

  const bandOff = (k: number) => {
    const startY = Math.min(BANDS[k] + 1100, BOTTOM);
    const pk = ramp(t, T.rock + (6 - k) * 0.11, T.rock + 0.95 + (6 - k) * 0.11, ease.outQuint);
    return (1 - pk) * (startY - BANDS[k]);
  };

  const boneOp = ramp(t, T.bones, T.bones + 1.0);
  const crowdP = ramp(t, T.crowd, T.crowd + 0.9, ease.outQuint);
  const fleshP = ramp(t, T.flesh - 0.15, T.flesh + 0.7, ease.linear);
  const stripeP = ramp(t, T.stripes - 0.15, T.stripes + 0.55);
  const colourP = ramp(t, T.colour - 0.15, T.colour + 0.6);
  const strideP = ramp(t, T.stride - 0.1, T.stride + 0.8, ease.inOutSine);
  const turnP = ramp(t, T.turn - 0.1, T.turn + 0.9, ease.inOutSine);
  const plateP = ramp(t, 14.6, 15.4, ease.out);
  const plateText = 'NATURAL HISTORY MUSEUM';
  const pw = textW(plateText, 28, 'sansCaps', 700) + 70;
  const tp = (cue: number) => ramp(t, cue - 0.1, cue + 0.5, ease.out);
  const rockScale = ZOOM * WS;
  const rockT = `translate(960 ${540 + D}) scale(${rockScale}) translate(-11 172)`;

  return (
    <>
      <Cam cam={cam}>
        <MuseumHall t={t} seed={3} windows={4} wall={WALL} />
        <Particles t={t} x={300} y={150} w={1400} h={650} n={26} seed={4} size={[1.5, 3.5]} color={C.paperLight} opacity={[0.25, 0.7]} vx={4} vy={-5} />
        <g transform="translate(948 762) scale(1.4)">
          <Rex id="mus" t={t} bones={1} flesh={fleshP} stripes={stripeP} colour={colourP} stride={strideP} turn={turnP} boneFill={mixC(C.bone, C.woodLight, 0.3)} boneLine={C.inkMute} />
        </g>
        <g transform={`translate(0 ${(1 - crowdP) * 300})`} opacity={Math.min(1, crowdP * 2.5)}>
          <Crowd x={330} y={925} w={560} n={4} rows={1} s={0.5} t={t} seed={3} era="modern" silhouette={CROWD} facing={1} />
          <Crowd x={1590} y={925} w={560} n={4} rows={1} s={0.5} t={t} seed={7} era="modern" silhouette={CROWD} facing={-1} />
        </g>

        {/* the museum floor is a cut-away: ground below it, down to the fossil */}
        <rect x={-420} y={1000} width={2760} height={2400} fill={C.ink} />
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <Band key={k} k={k} off={bandOff(k)} />
        ))}
        <g transform={rockT}>
          <Ghost t={t} op={ghostOp(t)} />
          <Rex id="rock" t={t} bones={boneOp} />
        </g>
        <Band k={6} off={bandOff(6)} />
        <rect x={-420} y={922} width={2760} height={24} fill={C.inkSoft} />
        <Tag x={620} y={D + 170} text="Evidence" kind="evidence" size={34} p={tp(T.evid)} to={{x: 1150, y: D + 500}} />
      </Cam>

      <g opacity={ui}>
      {plateP > 0 && (
        <g opacity={plateP} transform={`translate(0 ${(1 - plateP) * -30})`}>
          <rect x={960 - pw / 2} y={150} width={pw} height={64} rx={6} fill={C.ink} />
          <text x={960} y={191} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={28} letterSpacing={2.4} fill={C.paperLight}>
            {plateText}
          </text>
        </g>
      )}
      <Tag x={96} y={170} text="Evidence: bones" kind="evidence" size={26} p={tp(T.bonesTag)} />
      <Tag x={96} y={238} text="Reconstructed: flesh" kind="theory" size={26} p={tp(T.flesh)} />
      <Tag x={96} y={306} text="Reconstructed: texture" kind="theory" size={26} p={tp(T.stripes)} />
      <Tag x={96} y={374} text="Reconstructed: colour" kind="theory" size={26} p={tp(T.colour)} />
      <Tag x={96} y={442} text="Reconstructed: pose" kind="theory" size={26} p={tp(T.stride)} />
      </g>
    </>
  );
};

// ───────────────────────── chapter ─────────────────────────
export const C01: React.FC<{t: number}> = ({t}) => {
  if (t < T.swap) return <Desk t={t} />;
  const k = ramp(t, T.frame, T.frameEnd, ease.inOutQuint);
  const flash = 0.6 * ramp(t, T.flash - 0.04, T.flash) * (1 - ramp(t, T.flash, T.flash + 0.35, ease.out));
  if (k <= 0) {
    return (
      <Stage bg={C.paperShade}>
        <Scene t={t} />
      </Stage>
    );
  }
  // Polaroid closes around the scene
  const img = lerp(1920, 669, k);
  const w = img / 0.88;
  const pad = w * 0.06;
  const wcy = lerp(540, 472, k);
  const s = lerp(1, 0.62, k);
  const hTot = pad + img + w * 0.24;
  const top = wcy - img / 2 - pad;
  return (
    <Stage bg={C.paperShade}>
      <g transform={`rotate(${-1.5 * k} 960 540)`}>
        <rect x={960 - w / 2 + 16} y={top + 20} width={w} height={hTot} rx={6} fill={C.ink} opacity={0.16} />
        <rect x={960 - w / 2} y={top} width={w} height={hTot} rx={6} fill={C.paperLight} />
        <clipPath id="c01-photo">
          <rect x={960 - img / 2} y={wcy - img / 2} width={img} height={img} />
        </clipPath>
        <g clipPath="url(#c01-photo)">
          <rect x={960 - img / 2} y={wcy - img / 2} width={img} height={img} fill={C.ink} />
          <g transform={`translate(960 ${wcy}) scale(${s}) translate(-960 -540)`}>
            <Scene t={t} ui={1 - ramp(k, 0, 0.45)} />
          </g>
        </g>
        <text x={960} y={wcy + img / 2 + w * 0.14} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontWeight={600} fontSize={w * 0.062} fill={C.ink} opacity={ramp(k, 0.7, 1)}>
          T. rex, in a museum
        </text>
      </g>
      {flash > 0 && <rect x={0} y={0} width={1920} height={1080} fill={C.paperLight} opacity={flash} />}
    </Stage>
  );
};
