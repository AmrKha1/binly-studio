// PODIUM GAME — the model video's spine (references/universe-claude: 1:34, 2:31, 2:41, 4:04, 6:22, 6:31, 14:03).
// One question ("what is the most expensive thing?") becomes a competition on the night stage: every contender gets a
// glowing podium, the tallest = the champion, the newest champion stands next to AZTIKA, older ones step right, shrink
// and slide out. Give the DATA, the game does the rest:
//   • heights ∝ value^0.35 (measured: 3 bn / 2 bn / 1 bn / 45 M → 125 / 110 / 90 / 30) — small values stay visible
//   • a mystery silhouette before a reveal (1:34.5), reveal ring + sparkles when it lands (6:22.5)
//   • price pills: gold = champion · white = runners-up · grey = small ones (STYLE-BIBLE §2)
//   • ×N dashed bracket between the champion and the one before (2:41)
//   • recap: every contender in one row (14:03)
import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp01, ease, lerp, popRef, spring} from './anim';
import {H, W} from './theme';
import {GlowText, N, NPill, Podium, RevealRing, Sparkle} from './night';
import {cueSfx} from './sfx';
import {Flash, HeroObject} from './night-fx';
import {isAr} from './lang';

export type Contender = {
  id: string; // stable, unique
  value: number; // for the HEIGHT only (any unit, all the same unit) — what is SAID goes in label
  label: string; // the price pill, exactly as spoken ("2 مليار $")
  at: number; // when it lands on its podium (the word that names it)
  src?: string; // cut-out PNG inside public/ (generated art) …
  ar?: number; // … its width / height
  draw?: (h: number) => React.ReactNode; // … or code-drawn: draw centred at (0,0), about h tall
  color?: 'green' | 'gold' | 'red';
  mystery?: number; // show it as a black silhouette from this time (before `at`)
  times?: string; // "×2" bracket vs the previous champion …
  timesAt?: number; // … shown at this time (default at + 1.2)
};

type Slot = {x: number; h: number; w: number; rank: number; o: number};
const EXP = 0.35;

/** Layout of one state of the game (contenders sorted by value, champion first). */
const layout = (list: Contender[], x0: number, maxH: number, maxVisible: number, right: number): Map<string, Slot> => {
  const sorted = [...list].sort((a, b) => b.value - a.value);
  const vmax = sorted[0]?.value ?? 1;
  const m = new Map<string, Slot>();
  const n = Math.min(sorted.length, maxVisible);
  // shrink everything a little when the row is long, so it fits between x0 and `right`
  let k = 1;
  for (let tries = 0; tries < 8; tries++) {
    let x = x0, ok = true;
    for (let r = 0; r < n; r++) {
      const h = Math.max(16, maxH * k * Math.pow(sorted[r].value / vmax, EXP));
      const w = (0.42 * maxH + 0.38 * h) * Math.sqrt(k);
      if (r > 0) x += w / 2;
      if (x + w / 2 > right) ok = false;
      x += w / 2 + 70 * k;
    }
    if (ok) break;
    k *= 0.88;
  }
  let x = x0;
  sorted.forEach((c, r) => {
    const h = Math.max(16, maxH * k * Math.pow(c.value / vmax, EXP));
    const w = (0.42 * maxH + 0.38 * h) * Math.sqrt(k);
    if (r > 0) x += w / 2;
    m.set(c.id, r < n ? {x, h, w, rank: r, o: 1} : {x: W + 400 + r * 200, h, w, rank: r, o: 0});
    x += w / 2 + 70 * k;
  });
  return m;
};

/** the board's states: one after each arrival (a mystery silhouette counts as its arrival) + the recap row */
const boardStates = (entries: Contender[], x0: number, maxH: number, maxVisible: number, right: number, recapAt?: number) => {
  const order = [...entries].sort((a, b) => a.at - b.at);
  const order2 = [...order].sort((a, b) => (a.mystery ?? a.at) - (b.mystery ?? b.at));
  const states = order2.map((c, k) => ({at: c.mystery ?? c.at, newId: c.id as string | null, slots: layout(order2.slice(0, k + 1), x0, maxH, maxVisible, right)}));
  if (recapAt !== undefined) states.push({at: recapAt, newId: null, slots: layout(order, Math.max(x0 - 120, 520), maxH * 0.95, order.length, right)});
  return {order, states};
};

/**
 * boardCamT — the reference's BOARD CAMERA (MOTION.md §3, 1:34): on every arrival the camera travels toward the newcomer
 * (pan + a push to 1.07, 0.5 s ease-in-out), then keeps pushing slowly (0.35 %/s) — never still; the recap pulls back to
 * the whole row. Wrap the WORLD (GridFloor + PodiumGame) — NOT the host (he stays pinned to the screen, as in the
 * reference):  <g transform={boardCamT(t, {entries, …same props as PodiumGame})}><GridFloor wide …/><PodiumGame …/></g>
 */
export const boardCamT = (t: number, o: {entries: Contender[]; x0?: number; base?: number; maxH?: number; maxVisible?: number; right?: number; recapAt?: number}) => {
  const {x0 = 760, base = 836, maxH = 290, maxVisible = 5, right = W - 60, recapAt} = o;
  const {states} = boardStates(o.entries, x0, maxH, maxVisible, right, recapAt);
  if (!states.length) return '';
  const focus = (k: number) => {
    const st = states[k];
    const xs = [...st.slots.values()].filter((q) => q.o > 0).map((q) => q.x);
    const mid = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 960;
    const nx = st.newId ? st.slots.get(st.newId)?.x ?? mid : mid;
    const cx = st.newId === null ? mid : k === 0 ? nx : lerp(mid, nx, 0.5);
    return {cx: lerp(960, cx, 0.6), z: st.newId === null || k === 0 ? 1 : 1.07};
  };
  let k = -1;
  for (let i = 0; i < states.length; i++) if (t >= states[i].at) k = i;
  const a = focus(Math.max(0, k - 1)), b = focus(Math.max(0, k));
  const u = k <= 0 ? 1 : ease.inOut(clamp01((t - states[k].at) / 0.5));
  const since = Math.max(0, t - (k >= 0 ? states[k].at : 0));
  const cx = lerp(a.cx, b.cx, u), z = lerp(a.z, b.z, u) * (1 + 0.0035 * since);
  return `translate(960 ${base}) scale(${z}) translate(${-cx} ${-base})`;
};

const pillKind = (rank: number, rel: number) => (rank === 0 ? 'gold' : rel < 0.06 ? 'grey' : 'white') as 'gold' | 'white' | 'grey';

/**
 * PodiumGame — the whole leaderboard from data. x0 = centre of the champion's podium (next to AZTIKA at sideLeft),
 * base = floor y (GridFloor 836), maxH = the champion's height, right = right edge of the usable row.
 * recapAt: from this time every contender is shown in one row (the ending). Draw inside <NightScreen> on the night stage.
 * CAMERA (the reference's board travels to each newcomer): wrap GridFloor + PodiumGame in boardCamT(t, same props).
 */
export const PodiumGame: React.FC<{t: number; id: string; entries: Contender[]; x0?: number; base?: number; maxH?: number; maxVisible?: number; right?: number; recapAt?: number}> = ({
  t, id, entries, x0 = 760, base = 836, maxH = 290, maxVisible = 5, right = W - 60, recapAt,
}) => {
  // states: after each arrival (+ the recap) — shared with boardCamT so the camera follows exactly this board
  const {order, states} = boardStates(entries, x0, maxH, maxVisible, right, recapAt);
  let si = -1;
  for (let k = 0; k < states.length; k++) if (t >= states[k].at) si = k;
  const TW = 0.55; // re-arrange time (the old champion steps aside before the newcomer appears — MOTION.md §3)
  const cur = si >= 0 ? states[si] : null;
  const prev = si > 0 ? states[si - 1] : null;
  const u = cur ? ease.inOut(clamp01((t - cur.at) / TW)) : 0;
  const slotOf = (cid: string): Slot | null => {
    const b = cur?.slots.get(cid);
    if (!b) return null;
    const a = prev?.slots.get(cid);
    if (!a) return b; // just arrived: grows in place
    return {x: lerp(a.x, b.x, u), h: lerp(a.h, b.h, u), w: lerp(a.w, b.w, u), rank: b.rank, o: lerp(a.o, b.o, u)};
  };
  const vmax = cur ? Math.max(...order.filter((c) => (c.mystery ?? c.at) <= t || (recapAt !== undefined && t >= recapAt)).map((c) => c.value)) : 1;
  const nodes: React.ReactNode[] = [];
  const over: React.ReactNode[] = [];
  for (const c of order) {
    // mystery silhouette before it lands: hovering where the champion will stand
    // (MOTION.md §3, 1:34: the old champion slides aside FIRST, the silhouette pops into the empty space, and it is replaced
    // IN PLACE by the real object — it waits 0.35 s, and stays until the object has popped over it)
    const MW = 0.35, gone = c.at + 0.2 + 0.3;
    if (c.mystery !== undefined && t >= c.mystery + MW && t < gone) {
      const p = clamp01((t - c.mystery - MW) / 0.3);
      const q = popRef(p);
      const fadeOut = 1 - clamp01((t - c.at - 0.3) / 0.2);
      const oh = Math.min(230, 0.62 * maxH + 40);
      const ms = slotOf(c.id);
      const mx = ms ? ms.x : x0;
      // hovering before the reveal; once its podium grows (t ≥ at) it rides on the podium's top, where the object will pop
      const ph0 = t >= c.at && ms ? ms.h * ease.out(clamp01((t - c.at) / 0.5)) : 0;
      const hover = base - (ms ? ms.h : maxH) * 0.55 - oh / 2 + Math.sin(t * 2) * 8;
      const y = t >= c.at && ms ? Math.min(hover, base - ph0 - oh / 2 - 12) : hover; // keeps hovering until the rising podium reaches it
      (t >= c.at ? over : nodes).push(
        <g key={c.id + '__m'} transform={`translate(${mx} ${y}) scale(${q.sx} ${q.sy})`} opacity={q.o * fadeOut}>
          <ObjectArt c={c} h={oh} silhouette />
        </g>
      );
      cueSfx('riser', `${id}-mystery-${c.id}`, t >= c.mystery + MW && t < c.mystery + MW + 0.3, x0, {at: c.mystery + MW + 0.125}); // SOUND MAP: the run-up lands on the silhouette's pop
    }
    if (t < c.at) continue;
    const s = slotOf(c.id);
    cueSfx('boom', `${id}-in-${c.id}`, t >= c.at && t < c.at + 0.3, s?.x ?? 960, {at: c.at, hit: 0.13}); // SOUND MAP: the board jumps when a newcomer arrives
    if (!s || s.o <= 0.01) continue;
    const e = t - c.at;
    const grow = ease.out(clamp01(e / 0.5)); // reference (MOTION.md §8): rises over 0.5 s, decelerating, no overshoot
    const ph = s.h * grow;
    const rel = c.value / vmax;
    const oh = Math.max(40, Math.min(230, 38 + 0.62 * s.h));
    const top = base - ph;
    const objP = clamp01((e - 0.2) / 0.35);
    const oq = popRef(objP, 0.45, 0.4);
    const bob = Math.sin(t * 1.4 + s.x * 0.01) * 5;
    const pillP = clamp01((e - 0.35) / 0.25);
    const champ = s.rank === 0;
    nodes.push(
      <g key={c.id} opacity={s.o}>
        <Podium x={s.x} base={base} w={s.w} h={Math.max(1, ph)} id={`${id}-${c.id}`} color={c.color ?? 'green'} />
        {objP > 0 && (
          <g transform={`translate(${s.x} ${top - oh / 2 - 12 + bob}) scale(${oq.sx} ${oq.sy})`} opacity={oq.o}>
            <ObjectArt c={c} h={oh} />
          </g>
        )}
        <NPill text={c.label} x={s.x} y={top - oh - 52 + bob} size={champ ? 46 : rel < 0.06 ? 28 : 36} kind={pillKind(s.rank, rel)} id={`${id}-${c.id}-p`} p={pillP} />
      </g>
    );
    over.push(<RevealRing key={c.id + '__r'} boom={false} t={t} at={c.at + 0.2} x={s.x} y={top - oh / 2} r={Math.max(180, oh * 1.3)} />);
    if (champ && t - c.at > 0.6) {
      // the champion breathes a little light
      const k = 0.5 + 0.5 * Math.sin(t * 2.2);
      over.push(<Sparkle key={c.id + '__s'} x={s.x + s.w * 0.42} y={top - oh * 0.85} r={8 + 8 * k} o={0.4 + 0.5 * k} />);
    }
    // ×N bracket between this contender and the one it beat
    if (c.times) {
      const ta = c.timesAt ?? c.at + 1.2;
      const prevChamp = order.filter((x) => x.at < c.at).sort((a, b) => b.value - a.value)[0];
      const ps = prevChamp ? slotOf(prevChamp.id) : null;
      const nextAt = Math.min(...order.filter((x) => (x.mystery ?? x.at) > c.at).map((x) => x.mystery ?? x.at), recapAt ?? Infinity);
      if (ps && t >= ta && t < nextAt) {
        const pp = clamp01((t - ta) / 0.3) * (1 - clamp01((t - (nextAt - 0.25)) / 0.25));
        const y1 = top + 26, y2 = base - ps.h + 26;
        const xa = s.x + s.w / 2 + 6, xb = ps.x - ps.w / 2 - 6, xm = (xa + xb) / 2;
        const q = popRef(pp, 0.5, 0.3);
        over.push(
          <g key={c.id + '__x'} opacity={pp}>
            <path d={`M${xa} ${y1} H${xm} V${y2} H${xb}`} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeDasharray="12 9" />
            <g transform={`translate(${xm + 40} ${(y1 + y2) / 2 + 30}) scale(${q.s})`}>
              <GlowText text={c.times} x={0} y={0} size={120} tone="gold" id={`${id}-${c.id}-x`} />
            </g>
          </g>
        );
        cueSfx('boom', `${id}-times-${c.id}`, t >= ta && t < ta + 0.3, xm, {gain: 1.4, at: ta, hit: 0.125}); // SOUND MAP: ×N = a bigger boom
      }
    }
  }
  return (
    <g>
      {nodes}
      {over}
    </g>
  );
};

/** The contender's art: cut-out PNG (with a soft glow) or code-drawn; silhouette = solid black (the mystery). */
const ObjectArt: React.FC<{c: Contender; h: number; silhouette?: boolean}> = ({c, h, silhouette}) => {
  if (c.src) {
    const w = h * (c.ar ?? 1);
    return (
      <foreignObject x={-w / 2 - 30} y={-h / 2 - 30} width={w + 60} height={h + 60}>
        <Img
          src={staticFile(c.src)}
          style={{position: 'absolute', left: 30, top: 30, width: w, height: h, filter: silhouette ? 'brightness(0) drop-shadow(0 0 14px rgba(170,120,255,0.55))' : 'drop-shadow(0 0 8px rgba(255,214,90,0.55))'}}
        />
      </foreignObject>
    );
  }
  if (!c.draw) return null;
  return silhouette ? (
    <g style={{filter: 'brightness(0) drop-shadow(0 0 14px rgba(170,120,255,0.55))'}}>{c.draw(h)}</g>
  ) : (
    <>{c.draw(h)}</>
  );
};

/** Little code-drawn contenders for tests and quick videos (real videos use generated hero art). */
export const DrawDiamond = (h: number) => {
  const s = h / 2;
  return (
    <g>
      <polygon points={`${-s},${-s * 0.15} ${-s * 0.55},${-s * 0.7} ${s * 0.55},${-s * 0.7} ${s},${-s * 0.15} 0,${s}`} fill="#BFF3F7" stroke={N.outline} strokeWidth={h * 0.04} strokeLinejoin="round" />
      <polygon points={`${-s},${-s * 0.15} ${s},${-s * 0.15} 0,${s}`} fill="#7FD9E6" />
      <polygon points={`${-s * 0.55},${-s * 0.7} 0,${-s * 0.15} ${s * 0.55},${-s * 0.7}`} fill="#E8FDFF" />
      <path d={`M${-s} ${-s * 0.15} L0 ${s} L${s} ${-s * 0.15}`} fill="none" stroke={N.outline} strokeWidth={h * 0.04} strokeLinejoin="round" />
    </g>
  );
};
export const DrawGoldBar = (h: number) => {
  const w = h * 1.5;
  return (
    <g>
      <path d={`M${-w / 2} ${h * 0.3} L${-w * 0.36} ${-h * 0.3} H${w * 0.36} L${w / 2} ${h * 0.3} Z`} fill="#F5C223" stroke={N.outline} strokeWidth={h * 0.05} strokeLinejoin="round" />
      <path d={`M${-w * 0.36} ${-h * 0.3} H${w * 0.36} L${w * 0.28} ${-h * 0.05} H${-w * 0.28} Z`} fill="#FFE08A" />
    </g>
  );
};
export const DrawCrown = (h: number) => {
  const w = h * 1.2;
  return (
    <g>
      <path d={`M${-w / 2} ${h * 0.35} L${-w / 2} ${-h * 0.35} L${-w * 0.22} ${0} L0 ${-h * 0.5} L${w * 0.22} 0 L${w / 2} ${-h * 0.35} L${w / 2} ${h * 0.35} Z`} fill="#F5C223" stroke={N.outline} strokeWidth={h * 0.05} strokeLinejoin="round" />
      <rect x={-w / 2} y={h * 0.18} width={w} height={h * 0.17} fill="#E2552D" stroke={N.outline} strokeWidth={h * 0.04} />
      {[-0.32, 0, 0.32].map((k, i) => <circle key={i} cx={w * k} cy={h * 0.06} r={h * 0.07} fill="#57D9FA" stroke={N.outline} strokeWidth={h * 0.03} />)}
    </g>
  );
};
export const _H = H;

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// STAIR GAME — the second game device: "from the cheapest to the most expensive, step by step" («نطلع درجة درجة»).
// Each case CLIMBS one step (a glowing block rising like the reference podium, its object popping on top with the hero
// finish, its price pill EXACTLY as spoken); the SUMMIT waits with a «؟» from `summitAt` (the promise of the hook); the
// `twist` entry takes the summit at the end even when its number is the smallest — the board SHOWS the new rule (gold
// summit, flash, ring, `topLabel` like «الأغلى»). Arabic stairs rise RIGHT → LEFT (the reading direction).
// Camera: wrap <GridFloor wide/> + StairGame in stairCamT(t, same props) — it climbs with every new step, recap pulls back.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type StairEntry = {
  id: string; label: string; at: number; // when it takes its step (the word that names it)
  src?: string; draw?: (h: number) => React.ReactNode; ar?: number; glow?: string; // its object (Flow image or Claude-drawn)
  twist?: boolean; // the entry that takes the SUMMIT (the rule changes)
};
type StairProps = {entries: StairEntry[]; x0?: number; base?: number; stepW?: number; stepH?: number; h0?: number; summitAt?: number; recapAt?: number; topLabel?: string; dir?: 1 | -1};
const stairLayout = (o: StairProps) => {
  const {entries, x0, base = 836, stepW = 250, stepH = 62, h0 = 110} = o;
  const dir = o.dir ?? (isAr() ? -1 : 1);
  const start = x0 ?? (dir === -1 ? W - 260 : 260);
  const plain = entries.filter((e) => !e.twist).sort((a, b) => a.at - b.at);
  const twist = entries.find((e) => e.twist);
  const n = plain.length + 1; // + the summit
  const steps = Array.from({length: n}, (_, i) => ({x: start + dir * i * stepW, h: h0 + i * stepH + (i === n - 1 ? stepH * 0.6 : 0)}));
  return {plain, twist, steps, base, stepW, dir};
};
export const stairCamT = (t: number, o: StairProps) => {
  const {plain, twist, steps, base} = stairLayout(o);
  const focusOf = (i: number) => ({cx: steps[i].x, cy: base - steps[i].h - 120, z: 1.05});
  const all = (() => {
    const xs = steps.map((s) => s.x), w = Math.max(...xs) - Math.min(...xs) + 500;
    return {cx: (Math.max(...xs) + Math.min(...xs)) / 2, cy: base - steps[steps.length - 1].h / 2 - 60, z: Math.min(1, 1760 / w)};
  })();
  const keys: {at: number; f: {cx: number; cy: number; z: number}}[] = [];
  plain.forEach((e, i) => keys.push({at: e.at, f: focusOf(i)}));
  if (o.summitAt !== undefined) keys.push({at: o.summitAt, f: all});
  if (twist) keys.push({at: twist.at, f: focusOf(steps.length - 1)});
  if (o.recapAt !== undefined) keys.push({at: o.recapAt, f: all});
  keys.sort((a, b) => a.at - b.at);
  if (!keys.length) return '';
  let k = -1;
  for (let i = 0; i < keys.length; i++) if (t >= keys[i].at) k = i;
  const a = keys[Math.max(0, k - 1)].f, b = keys[Math.max(0, k)].f;
  const u = k <= 0 ? 1 : ease.inOut(clamp01((t - keys[k].at) / 0.7));
  const z = lerp(a.z, b.z, u) * (1 + 0.0035 * Math.max(0, t - (k >= 0 ? keys[k].at : 0))); // never still (MOTION.md §3)
  // the horizon never moves (like the reference board camera): pan + zoom ALONG the floor line — the sky stays seamless
  const cx = lerp(a.cx, b.cx, u);
  return `translate(960 ${base}) scale(${z}) translate(${-cx} ${-base})`;
};
export const StairGame: React.FC<{t: number; id: string} & StairProps> = (p) => {
  const {t, id, topLabel} = p;
  const {plain, twist, steps, base, stepW} = stairLayout(p);
  const nodes: React.ReactNode[] = [];
  const objH = Math.min(200, stepW * 0.8);
  // the pill colours of the reference board (STYLE-BIBLE §2): the CURRENT champion gold, the others white
  const champ = twist && t >= twist.at ? twist.id : [...plain].reverse().find((e) => t >= e.at)?.id;
  const put = (e: StairEntry, i: number, summit: boolean) => {
    if (t < e.at) return;
    const s = steps[i], el = t - e.at;
    cueSfx('boom', `${id}-step-${e.id}`, t >= e.at && t < e.at + 0.3, s.x, {at: e.at, hit: 0.13, gain: summit ? 1.6 : 1}); // SOUND MAP: a newcomer = boom
    const grow = ease.out(clamp01(el / 0.5));
    const top = base - s.h * grow;
    nodes.push(<Podium key={e.id} x={s.x} base={base} w={stepW - 18} h={Math.max(1, s.h * grow)} id={`${id}-${e.id}`} color={summit ? 'gold' : 'green'} />);
    nodes.push(<HeroObject key={e.id + 'o'} t={t} at={e.at + 0.25} src={e.src} draw={e.draw} ar={e.ar ?? 1} x={s.x} y={top - objH / 2 - 14} h={objH} glow={e.glow} id={`${id}-${e.id}-o`} sparkles={summit ? 7 : 4} />);
    nodes.push(<NPill key={e.id + 'p'} text={e.label} x={s.x} y={top - objH - 52} size={summit ? 50 : e.id === champ ? 46 : 40} kind={e.id === champ ? 'gold' : 'white'} id={`${id}-${e.id}-p`} p={(el - 0.45) / 0.3} />);
    if (summit) {
      nodes.push(<RevealRing key={e.id + 'r'} t={t} at={e.at + 0.25} boom={false} x={s.x} y={top - objH / 2} r={objH * 1.4} />);
      if (topLabel && el > 0.7) {
        const q = popRef(clamp01((el - 0.7) / 0.3));
        nodes.push(
          <g key={e.id + 'l'} transform={`translate(${s.x} ${top - objH - 140}) scale(${q.s})`} opacity={q.o}>
            <GlowText text={topLabel} x={0} y={0} size={96} tone="gold" id={`${id}-top`} />
          </g>
        );
      }
    }
  };
  plain.forEach((e, i) => put(e, i, false));
  // the summit: a «؟» waits on it from summitAt (the hook's promise) until the twist takes it
  const sIdx = steps.length - 1, summit = steps[sIdx];
  if (p.summitAt !== undefined && t >= p.summitAt && (!twist || t < twist.at + 0.3)) {
    const el = t - p.summitAt;
    const grow = ease.out(clamp01(el / 0.5));
    const fadeOut = twist ? 1 - clamp01((t - twist.at) / 0.3) : 1;
    nodes.push(
      <g key="summit-wait" opacity={fadeOut}>
        <Podium x={summit.x} base={base} w={stepW - 18} h={Math.max(1, summit.h * grow)} id={`${id}-summit`} color="gold" />
        {el > 0.3 && (
          <g transform={`translate(${summit.x} ${base - summit.h * grow - 90 + Math.sin(t * 2) * 6}) scale(${popRef(clamp01((el - 0.3) / 0.3)).s})`}>
            <GlowText text="؟" x={0} y={0} size={150} tone="gold" id={`${id}-q`} />
          </g>
        )}
      </g>
    );
    cueSfx('riser', `${id}-summit`, t >= p.summitAt && t < p.summitAt + 0.3, summit.x, {at: p.summitAt + 0.3});
  }
  if (twist) put(twist, sIdx, true);
  return <g>{nodes}{twist && t >= twist.at && t < twist.at + 0.6 ? <Flash t={t} at={twist.at + 0.15} strength={0.45} /> : null}</g>;
};
