// NIGHT SHOT TEMPLATES (owner 2026-11-11) — the reference's REPEATING moments as one-line shots, so an AZTIKA chapter
// is mostly DATA (videos/<slug>/shots/Cxx.json → tools/compile-shots.mjs) and builders hand-build only the special
// moments. Each template returns the shot's WORLD (SVG inside NightScreen); the compiler joins them with NightShots
// (match dissolves, drift, the host pinned in the hud). Every prop is plain JSON. Art: `"src": "<slug>/el/x.png"` +
// `"ar"`, or code-drawn `"art": "coin:₿" | "coin" | "document" | "drive"`.
//   BoardShot     — back to the board (podium or stairs) with its newcomer · `"entries": "@board"` = videos/<slug>/board.json
//   MysteryShot   — the question: a mystery pillar/box rises, the headline asks
//   HeroShot      — the hero object reveal + its count-up + the spoken words under the number
//   HeadlineShot  — a headline built word by word on the spoken words (+ an optional pill)
//   StoryShot     — a mini-story: a world, faceless people (poses over time, a walk), a bubble, a stamp, pills, a year
//   TwistShot     — the twist: a slam word under the white flash + its mark
import React from 'react';
import {GridFloor, NightSky, NPill, textWidth, WordPop, YearBadge, type PillKind, type PopWord} from './night';
import {MarkPill} from './night-data';
import {Bubble, CountNumber, Flash, HeroObject, Rays, Stamp} from './night-fx';
import {boardCamT, PodiumGame, StairGame, stairCamT, type Contender, type StairEntry} from './night-game';
import {coinArt, documentArt, driveArt} from './night-objects';
import {MysteryBox, MysteryPillar} from './night-props';
import {DayWorld, LabWorld, MineWorld, PlateWorld, VillageWorld} from './night-places';
import {NightCity, RoomWorld, StoryPerson, SunsetWorld, type StoryPose, type StoryRole} from './night-worlds';
import {move} from './night-scenes';

type Base = {t: number; a: number; b: number};
type Art = {src?: string; art?: string; ar?: number; glow?: string};
type RaysTone = 'gold' | 'dark' | 'cyan' | 'violet' | 'orange' | 'green' | 'red';
const artOf = (o: Art): {src?: string; draw?: (h: number) => React.ReactNode; ar: number; glow?: string} => {
  if (o.src) return {src: o.src, ar: o.ar ?? 1, glow: o.glow};
  const [k, arg] = (o.art ?? 'coin').split(':');
  if (k === 'document') return {draw: documentArt(), ar: 0.78, glow: o.glow ?? '#FFE3A0'};
  if (k === 'drive') return {draw: driveArt(), ar: 0.72, glow: o.glow ?? '#5CF2FF'};
  return {draw: coinArt(arg ?? '$'), ar: 1, glow: o.glow};
};
/** the right edge that CENTRES a WordPop line on x (Arabic lines run right → left) */
const centred = (words: PopWord[], size: number, x = 960) => x + (words.reduce((s, w) => s + textWidth(w.w, size), 0) + size * 0.2 * (words.length - 1)) / 2;
const Headline: React.FC<{t: number; id: string; words?: PopWord[]; y: number; size: number}> = ({t, id, words, y, size}) =>
  words?.length ? <WordPop t={t} id={id} y={y} size={size} right={centred(words, size)} words={words} /> : null;

// ── BoardShot ────────────────────────────────────────────────────────────────────────────────────────────────────────
type BoardEntry = Art & {id: string; label: string; at: number; value?: number; mystery?: number; times?: string; timesAt?: number; color?: 'green' | 'gold' | 'red'; twist?: boolean};
export const BoardShot: React.FC<Base & {game?: 'podium' | 'stairs'; entries: BoardEntry[]; recapAt?: number; summitAt?: number; topLabel?: string; words?: PopWord[]; wordsY?: number}> = ({
  t, a, game = 'podium', entries, recapAt, summitAt, topLabel, words, wordsY = 975,
}) => {
  const id = `bd${Math.round(a * 100)}`;
  if (game === 'stairs') {
    const S = entries.map((e) => ({...e, ...artOf(e)})) as StairEntry[];
    const o = {entries: S, summitAt, recapAt, topLabel};
    return (
      <>
        <NightSky t={t} id={`${id}s`} />
        <g transform={stairCamT(t, o)}>
          <GridFloor id={`${id}f`} t={t} wide />
          <StairGame t={t} id={id} {...o} />
        </g>
        <Headline t={t} id={`${id}w`} words={words} y={wordsY} size={80} />
      </>
    );
  }
  const E = entries.map((e) => ({...e, value: e.value ?? 1, ...artOf(e)})) as Contender[];
  return (
    <>
      <NightSky t={t} id={`${id}s`} />
      <g transform={boardCamT(t, {entries: E, recapAt})}>
        <GridFloor id={`${id}f`} t={t} wide />
        <PodiumGame t={t} id={id} entries={E} recapAt={recapAt} />
      </g>
      <Headline t={t} id={`${id}w`} words={words} y={wordsY} size={80} />
    </>
  );
};

// ── MysteryShot ──────────────────────────────────────────────────────────────────────────────────────────────────────
export const MysteryShot: React.FC<Base & {at: number; kind?: 'pillar' | 'box'; x?: number; words?: PopWord[]; wordsY?: number; rays?: RaysTone}> = ({
  t, a, at, kind = 'pillar', x = 960, words, wordsY = 975, rays = 'violet',
}) => {
  const id = `my${Math.round(a * 100)}`;
  return (
    <>
      <NightSky t={t} id={`${id}s`} />
      <Rays t={t} id={`${id}r`} tone={rays} x={x} y={500} />
      <GridFloor id={`${id}f`} t={t} />
      {kind === 'pillar' ? <MysteryPillar t={t} at={at} x={x} id={id} /> : <MysteryBox t={t} at={at} x={x} y={470} id={id} />}
      <Headline t={t} id={`${id}w`} words={words} y={wordsY} size={84} />
    </>
  );
};

// ── HeroShot ─────────────────────────────────────────────────────────────────────────────────────────────────────────
export const HeroShot: React.FC<Base & Art & {at: number; h?: number; value?: string; countAt?: number; spoken?: PopWord[]; label?: {text: string; at: number; kind?: PillKind}; rays?: RaysTone}> = ({
  t, a, at, h = 380, value, countAt, spoken, label, rays = 'gold', ...art
}) => {
  const id = `hr${Math.round(a * 100)}`, A = artOf(art);
  return (
    <>
      <NightSky t={t} id={`${id}s`} />
      <Rays t={t} id={`${id}r`} tone={rays} x={960} y={470} />
      <HeroObject t={t} at={at} src={A.src} draw={A.draw} ar={A.ar} glow={A.glow} x={960} y={value ? 430 : 500} h={h} id={id} />
      {label && <NPill text={label.text} x={960} y={value ? 170 : 150} size={52} kind={label.kind ?? 'gold'} id={`${id}l`} p={(t - label.at) / 0.3} />}
      {value && <CountNumber t={t} at={countAt ?? at + 1.2} value={value} x={960} y={790} size={150} id={`${id}c`} />}
      <Headline t={t} id={`${id}w`} words={spoken} y={935} size={80} />
    </>
  );
};

// ── HeadlineShot ─────────────────────────────────────────────────────────────────────────────────────────────────────
export const HeadlineShot: React.FC<Base & {words: PopWord[]; y?: number; size?: number; pill?: {text: string; at: number; kind?: PillKind; y?: number}; rays?: RaysTone | false; floor?: boolean}> = ({
  t, a, words, y = 540, size = 120, pill, rays = 'violet', floor = true,
}) => {
  const id = `hl${Math.round(a * 100)}`;
  return (
    <>
      <NightSky t={t} id={`${id}s`} />
      {rays && <Rays t={t} id={`${id}r`} tone={rays} x={960} y={y} />}
      {floor && <GridFloor id={`${id}f`} t={t} />}
      <Headline t={t} id={`${id}w`} words={words} y={y} size={size} />
      {pill && <NPill text={pill.text} x={960} y={pill.y ?? y - size * 1.15} size={52} kind={pill.kind ?? 'gold'} id={`${id}p`} p={(t - pill.at) / 0.3} />}
    </>
  );
};

// ── StoryShot ────────────────────────────────────────────────────────────────────────────────────────────────────────
type Person = {role?: StoryRole; x: number; y?: number; s?: number; pose?: StoryPose; poses?: [number, StoryPose][]; flip?: boolean; rim?: string; prop?: string; hat?: string; outfit?: string; medals?: boolean; walk?: {at: number; to: number; dur?: number}; name?: {text: string; at: number}};
export const StoryShot: React.FC<Base & {
  world: 'room' | 'sunset' | 'city' | 'village' | 'day' | 'lab' | 'mine' | 'plate'; plate?: string; plateLook?: 'night' | 'natural';
  people?: Person[]; bubble?: {at: number; lines: string[]; x: number; y: number; tx: number; ty: number}; stamp?: {at: number; text: string; x?: number; y?: number; size?: number; color?: string};
  pills?: {text: string; x: number; y: number; at: number; kind?: PillKind; size?: number}[]; year?: {at: number; year: number; from?: number}; words?: PopWord[]; wordsY?: number; marks?: {at: number; text: string; x: number; y: number; mark?: 'check' | 'cross'}[];
}> = ({t, a, world, plate, plateLook = 'natural', people = [], bubble, stamp, pills = [], year, words, wordsY = 975, marks = []}) => {
  const id = `st${Math.round(a * 100)}`;
  const W0 = {room: RoomWorld, sunset: SunsetWorld, city: NightCity, village: VillageWorld, day: DayWorld, lab: LabWorld, mine: MineWorld}[world as Exclude<typeof world, 'plate'>];
  return (
    <>
      {world === 'plate' && plate ? <PlateWorld t={t} src={plate} id={`${id}w`} at={a} look={plateLook} /> : W0 ? <W0 t={t} id={`${id}w`} /> : <NightSky t={t} id={`${id}w`} />}
      {year && <YearBadge t={t} at={year.at} year={year.year} from={year.from} x={960} y={170} id={`${id}y`} />}
      {people.map((p, i) => {
        const [px] = p.walk ? move(t, p.walk.at, [p.x, 0], [p.walk.to, 0], p.walk.dur ?? 0) : [p.x];
        const walking = p.walk && t > p.walk.at && Math.abs(px - p.walk.to) > 2;
        let pose = p.pose;
        for (const [pt, ps] of p.poses ?? []) if (t >= pt) pose = ps;
        const y = p.y ?? 900;
        return (
          <g key={i}>
            <StoryPerson x={px} y={y} s={p.s ?? 1} role={p.role} pose={walking ? 'walk' : pose} flip={p.flip} rim={p.rim} medals={p.medals} t={t} id={`${id}p${i}`}
              {...(p.prop ? {prop: p.prop as never} : {})} {...(p.hat ? {hat: p.hat as never} : {})} {...(p.outfit ? {outfit: p.outfit as never} : {})} />
            {p.name && <NPill text={p.name.text} x={px} y={y - 455 * (p.s ?? 1)} size={46} kind="white" id={`${id}n${i}`} p={(t - p.name.at) / 0.3} />}
          </g>
        );
      })}
      {bubble && <Bubble t={t} at={bubble.at} lines={bubble.lines} x={bubble.x} y={bubble.y} tx={bubble.tx} ty={bubble.ty} />}
      {stamp && <Stamp t={t} at={stamp.at} text={stamp.text} x={stamp.x ?? 960} y={stamp.y ?? 600} size={stamp.size ?? 118} color={stamp.color ?? '#FF5A6A'} />}
      {pills.map((p, i) => <NPill key={i} text={p.text} x={p.x} y={p.y} size={p.size ?? 48} kind={p.kind ?? 'white'} id={`${id}q${i}`} p={(t - p.at) / 0.3} />)}
      {marks.map((m, i) => <MarkPill key={i} t={t} at={m.at} text={m.text} x={m.x} y={m.y} mark={m.mark} id={`${id}m${i}`} />)}
      <Headline t={t} id={`${id}h`} words={words} y={wordsY} size={96} />
    </>
  );
};

// ── TwistShot ────────────────────────────────────────────────────────────────────────────────────────────────────────
export const TwistShot: React.FC<Base & {at: number; words: PopWord[]; size?: number; mark?: {at: number; text: string; mark?: 'check' | 'cross'}; rays?: RaysTone; flash?: boolean}> = ({
  t, a, at, words, size = 150, mark, rays = 'red', flash = true,
}) => {
  const id = `tw${Math.round(a * 100)}`;
  return (
    <>
      <NightSky t={t} id={`${id}s`} />
      {t >= at && <Rays t={t} id={`${id}r`} tone={rays} x={960} y={520} />}
      <GridFloor id={`${id}f`} t={t} />
      <Headline t={t} id={`${id}w`} words={words} y={520} size={size} />
      {mark && <MarkPill t={t} at={mark.at} text={mark.text} x={960} y={720} mark={mark.mark ?? 'cross'} id={`${id}m`} />}
      {flash && <Flash t={t} at={at} />}
    </>
  );
};

/** the templates the compiler knows for Arabic videos; BOARD-style shots have their own camera (no drift) */
export const NIGHT_TEMPLATES = ['BoardShot', 'MysteryShot', 'HeroShot', 'HeadlineShot', 'StoryShot', 'TwistShot'] as const;
