// Plan check — runs on the shot lists BEFORE any building (cheap: text only, no rendering).
// Catches the "words said but nothing new on screen" problem:
//   • LONG shot     — longer than 10 s with a sentence that has no beat, or longer than 15 s (a 10–15 s shot where
//                     every sentence has its own beat — moving camera, new elements — passes as "long ok")
//   • STILL SENTENCE — a spoken sentence that starts with no visible change near it (no shot start, no beat)
//   • SAME  — 3 shots in a row with the same template, or 3 text / diagram / image / data shots in a row
//   • FLAT  — more than 60 s (story scenes: 120 s) without a switch of visual mode
//   • SIZE  — a chapter without a close-up, or 3 wide shots in a row (mobile first: get close)
//   • HOST  — the channel host, alive but calm (owner 2026-11-08): shots list his beats as
//             "host":[{"at":102.4,"spot":"sideLeft","pose":"present","why":"shows the podium"},{"at":110,"off":true}]
//             flags: a MOVE (spot change) without "why" · moves < 6 s apart (too busy) · on screen > 8 s with no pose or
//             spot change (frozen) · pose changes < 1.5 s apart (jittery) · Arabic video with no host beats at all
//   • RECIPE (Arabic) — the model video's structure (references/universe-claude/RECIPE.md): HOOK pace + mystery/roadmap,
//             SPINE ("device":"stage" every ≤ 150 s), PACE (≤ 5.5 s/shot per 3 min), ENDING (recap + signoff), CTA (a CtaShot on the like/subscribe line + the end screen), CHAPTER
//             (every "reveal" joins the board within 60 s). Shots declare "device": stage|mystery|roadmap|story|reveal|…
//   • TEXT  — show, do not tell: more than 1 text card per chapter, a text card without an "ok" reason, or > 8 % of shots (scene / character / diagram / map / image / text / data)
// Custom shots declare their mode: "mode":"scene" (templates know theirs).
// Custom shots list their visible changes as cue times: {"id":"S3","start":98.9,"custom":true,"note":"…","beats":[100.2,103.6]}
// Template shots count their own reveal times (props named at / …At / cues / items[].at).
// A flag can be accepted on purpose with  "ok": "why"  on that shot (e.g. "slow push holds the big idea").
//   node tools/plan-check.mjs [--slug s] [C03]
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, args} from './lib/render.mjs';
import {requireVoice} from './lib/vo-gate.mjs';

const a = args();
const active = fs.readFileSync(path.join(ROOT, 'src', 'active.ts'), 'utf8').match(/videos\/([^']+)'/)?.[1];
const slug = a.slug ?? active;
const vdir = path.join(ROOT, 'videos', slug);
requireVoice(slug, 'planning (plan-check)');
const LONG = 10; // s — a long shot passes if every sentence in it has its own beat (alive); flagged if not
const TOO_LONG = 15; // s — always flagged (split it, or justify a real camera journey with "ok")
const NEAR = 1.2; // s — a change this close to a sentence start counts as its visual

const words = JSON.parse(fs.readFileSync(path.join(vdir, 'timing', 'words.json'), 'utf8'));
const sentences = [];
let cur = [];
for (const w of words) {
  cur.push(w);
  if (/[.?!…]["”')]?$/.test(w.w)) {
    sentences.push({s: cur[0].s, text: cur.map((x) => x.w).join(' ')});
    cur = [];
  }
}
if (cur.length) sentences.push({s: cur[0].s, text: cur.map((x) => x.w).join(' ')});

const chapters = JSON.parse(fs.readFileSync(path.join(vdir, 'chapters.json'), 'utf8'));
const only = a._[0];
const mmss = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;
const templateBeats = (props = {}) => {
  const out = [];
  const walk = (o, key) => {
    if (typeof o === 'number' && key && (key === 'at' || /At$/.test(key))) out.push(o);
    else if (Array.isArray(o)) o.forEach((v) => (key === 'cues' && typeof v === 'number' ? out.push(v) : walk(v, null)));
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, k);
  };
  walk(props, null);
  return out;
};

const TEMPLATE_MODE = {StatShot: 'data', QuoteShot: 'text', ClaimShot: 'text', QuestionShot: 'text', TitleShot: 'text', CompareShot: 'diagram',
  ListShot: 'diagram', TimelineShot: 'diagram', ProcessShot: 'diagram', MapShot: 'map', PersonShot: 'character', EvidenceShot: 'image',
  KenBurnsShot: 'image', DetailHuntShot: 'image', MontageShot: 'image', CollageShot: 'image', CompareImagesShot: 'image',
  DocumentScanShot: 'image', AnnotatedImageShot: 'image', ImageInWorldShot: 'image', ParallaxCutoutShot: 'image'};
const seq = []; // the whole video in order, for the retention-flow checks
const hostBeats = []; // every host beat in the video, in order
let flags = 0, shotsTotal = 0, longTotal = 0, stillTotal = 0, sameTotal = 0, flatTotal = 0, noMode = 0;
for (const ch of chapters) {
  if (only && ch.id !== only) continue;
  const f = path.join(vdir, 'shots', `${ch.id}.json`);
  if (!fs.existsSync(f)) {
    console.log(`${ch.id}: no shots/${ch.id}.json (hand-written chapter — not checked)`);
    continue;
  }
  const shots = JSON.parse(fs.readFileSync(f, 'utf8')).shots ?? [];
  for (const s of shots) for (const b of s.host ?? []) hostBeats.push({...b, ch: ch.id, shot: s.id, ok: b.ok ?? s.ok});
  const lines = [];
  shots.forEach((s, i) => {
    shotsTotal++;
    const end = i + 1 < shots.length ? shots[i + 1].start : ch.end;
    const mode = s.mode ?? (s.custom ? null : TEMPLATE_MODE[s.template] ?? null);
    if (s.custom && !s.mode) noMode++;
    const dur = end - s.start;
    const changes = [s.start, ...(s.beats ?? []), ...(s.custom ? [] : templateBeats(s.props))];
    const said = sentences.filter((x) => x.s >= s.start - 0.3 && x.s < end - 0.3);
    seq.push({ch: ch.id, id: s.id, start: s.start, end, mode, kind: s.custom ? 'custom' : s.template, ok: s.ok, sig: !!s.signature, size: s.size ?? null, device: s.device ?? null,
      inT: s.in ?? null, outT: s.out ?? null, spoken: s.spoken ?? null, said: said.map((x) => x.text).join(' '),
      flow: s.flow ?? null, fallback: s.fallback ?? null, beatsN: (s.beats ?? []).length});
    const still = said.filter((x) => !changes.some((c) => Math.abs(c - x.s) <= NEAR || (c > x.s && c < x.s + NEAR)));
    const isLong = dur > TOO_LONG || (dur > LONG && still.length > 0);
    const longAlive = dur > LONG && !isLong;
    if (s.ok) {
      if (isLong || still.length) lines.push(`  ok   ${s.id} ${mmss(s.start)} ${dur.toFixed(1)} s — accepted: ${s.ok}`);
      return;
    }
    if (longAlive) lines.push(`  long ok ${s.id} ${mmss(s.start)} ${dur.toFixed(1)} s — alive: every sentence has a beat`);
    if (isLong) { longTotal++; flags++; lines.push(`  LONG ${s.id} ${mmss(s.start)}–${mmss(end)} ${dur.toFixed(1)} s, ${said.length} sentences, ${changes.length - 1} beats → split, or add beats + camera travel`); }
    for (const x of still) { stillTotal++; flags++; lines.push(`  STILL ${s.id} ${mmss(x.s)} "${x.text.slice(0, 70)}${x.text.length > 70 ? '…' : ''}" → give it a visible change (beat at ${x.s.toFixed(2)})`); }
  });
  console.log(`${ch.id} (${shots.length} shots, avg ${((ch.end - ch.start) / Math.max(1, shots.length)).toFixed(1)} s): ${lines.length ? '' : 'OK'}`);
  lines.forEach((l) => console.log(l));
}
// retention flow across the whole video (chapter borders included)
const flow = [];
for (let i = 2; i < seq.length; i++) {
  const [x, y, z] = [seq[i - 2], seq[i - 1], seq[i]];
  if (z.ok) continue;
  const sameTpl = x.kind !== 'custom' && x.kind === y.kind && y.kind === z.kind;
  const sameMode = x.mode && x.mode !== 'scene' && x.mode === y.mode && y.mode === z.mode; // story scenes in a row are normal
  if (sameTpl || sameMode) {
    sameTotal++; flags++;
    flow.push(`  SAME ${x.ch} ${x.id} → ${z.ch} ${z.id} (${mmss(x.start)}): 3× ${sameTpl ? z.kind : z.mode} in a row → vary the treatment`);
  }
}
for (let i = 0; i < seq.length; ) {
  let j = i;
  while (seq[i].mode && j + 1 < seq.length && seq[j + 1].mode === seq[i].mode) j++;
  const dur = seq[j].end - seq[i].start;
  const limit = seq[i].mode === 'scene' ? 120 : 60; // story scenes may run longer before a change of mode
  if (seq[i].mode && dur > limit && !seq.slice(i, j + 1).some((x) => x.ok)) {
    flatTotal++; flags++;
    flow.push(`  FLAT ${mmss(seq[i].start)}–${mmss(seq[j].end)} ${dur.toFixed(0)} s all "${seq[i].mode}" → switch mode (character / map / real image / diagram)`);
  }
  i = j + 1;
}
if (flow.length) { console.log('\nRetention flow:'); flow.forEach((l) => console.log(l)); }
if (noMode) console.log(`\nnote: ${noMode} custom shots have no "mode" — add it so the flow check can see them`);
const sigs = seq.filter((x) => x.sig);
console.log(`\nSignature shots: ${sigs.length}${sigs.length ? ' — ' + sigs.map((x) => `${x.ch} ${x.id} ${mmss(x.start)}`).join(', ') : ''}`);
if (!only && (sigs.length < 5 || sigs.length > 8)) {
  flags++;
  console.log(`  SIGNATURE count ${sigs.length} → mark 5–8 shots "signature": true, each with a ★ hero brief`);
}
// shot-size rhythm (mobile first): every chapter needs close-ups; never 3 wides in a row
const noSize = seq.filter((x) => !x.size).length;
if (noSize) console.log(`\nnote: ${noSize} shots have no "size" (wide | medium | close) — add it so the size rhythm can be checked`);
const sizeLines = [];
const byCh = {};
for (const x of seq) (byCh[x.ch] ??= []).push(x);
for (const [chId, list] of Object.entries(byCh)) {
  if (list.some((x) => x.size) && !list.some((x) => x.size === 'close')) { flags++; sizeLines.push(`  SIZE ${chId}: no close-up → add close shots for emotion, reactions and key details`); }
}
for (let i = 2; i < seq.length; i++) {
  const [x, y, z] = [seq[i - 2], seq[i - 1], seq[i]];
  if (x.size === 'wide' && y.size === 'wide' && z.size === 'wide' && !z.ok) { flags++; sizeLines.push(`  SIZE ${x.ch} ${x.id} → ${z.ch} ${z.id}: 3 wide shots in a row → go closer`); }
}
if (sizeLines.length) { console.log('\nShot sizes:'); sizeLines.forEach((l) => console.log(l)); }
// show, don't tell: text cards (words as the main visual) are the rare exception — ≤ 1 per chapter, each with an "ok" reason
const texts = seq.filter((x) => x.mode === 'text');
console.log(`\nText cards: ${texts.length}${texts.length ? ' — ' + texts.map((x) => `${x.ch} ${x.id} ${x.kind}`).join(', ') : ''}`);
const perCh = {};
for (const x of texts) (perCh[x.ch] ??= []).push(x);
for (const [chId, list] of Object.entries(perCh)) {
  if (list.length > 1) { flags++; console.log(`  TEXT ${chId}: ${list.length} text cards → max 1 per chapter; act the others out (scene, characters, mechanism)`); }
}
for (const x of texts) if (!x.ok) { flags++; console.log(`  TEXT ${x.ch} ${x.id}: a text card needs "ok": "why this can't be shown" — or turn it into a scene`); }
if (!only && seq.length && texts.length / seq.length > 0.08) { flags++; console.log(`  TEXT share ${((100 * texts.length) / seq.length).toFixed(0)}% of shots → keep text cards under ~8%`); }
// the host: alive but calm — every move has a story reason, never busy, never frozen, never jittery
{
  const vj = path.join(vdir, 'video.json');
  const isAr = fs.existsSync(vj) && JSON.parse(fs.readFileSync(vj, 'utf8')).lang === 'ar';
  const hb = hostBeats.sort((x, y) => x.at - y.at);
  const hl = [];
  let lastSpot = null, lastMove = -1e9, lastPose = -1e9, on = false, lastChange = null;
  const videoEnd = chapters[chapters.length - 1]?.end ?? 0;
  for (const b of hb) {
    if (on && lastChange !== null && b.at - lastChange > 8 && !b.ok) { flags++; hl.push(`  HOST frozen ${mmss(lastChange)}–${mmss(b.at)} (${(b.at - lastChange).toFixed(1)} s, no pose/spot change) → give him a reaction on a word`); }
    if (b.off) { on = false; lastSpot = null; lastChange = null; continue; }
    const moved = b.spot && lastSpot && b.spot !== lastSpot;
    if (moved && !b.why && !b.ok) { flags++; hl.push(`  HOST ${b.ch} ${b.shot} ${mmss(b.at)}: moves to ${b.spot} with no "why" → every move needs a story reason`); }
    if (moved && b.at - lastMove < 6 && !b.ok) { flags++; hl.push(`  HOST ${b.ch} ${b.shot} ${mmss(b.at)}: moves again after ${(b.at - lastMove).toFixed(1)} s → too busy (≥ 6 s between moves)`); }
    if (b.pose && b.at - lastPose < 1.5 && !b.ok) { flags++; hl.push(`  HOST ${b.ch} ${b.shot} ${mmss(b.at)}: pose change ${(b.at - lastPose).toFixed(1)} s after the last → jittery (≥ 1.5 s)`); }
    if (moved) lastMove = b.at;
    if (b.pose) lastPose = b.at;
    if (b.spot) lastSpot = b.spot;
    on = true;
    lastChange = b.at;
  }
  if (on && lastChange !== null && !only && videoEnd - lastChange > 8) { flags++; hl.push(`  HOST frozen ${mmss(lastChange)}–end → a last beat (sign-off wave)`); }
  console.log(`
Host beats: ${hb.length} (${hb.filter((b, i) => b.spot && i && hb[i - 1].spot && b.spot !== hb[i - 1].spot).length} moves)`);
  if (isAr && !hb.length && seq.length) { flags++; hl.push(`  HOST no host beats planned → list AZTIKA's spot/pose/why per shot ("host": [...])`); }
  hl.forEach((l) => console.log(l));
}
// FLOW = A HELPER, CLAUDE = THE STANDARD (owner 2026-11-11): a shot that uses Flow art declares "flow": "plate" (a painted
// background) or "object", and "fallback": the Claude-made version used when Flow is missing or fails. Painted backgrounds
// stay a minority (≤ 25 % of the video) and are never a shot on their own — Claude's animation runs on top (beats).
if (!only && seq.length) {
  const fl = [];
  const total = seq[seq.length - 1].end - seq[0].start;
  const plates = seq.filter((x) => x.flow === 'plate');
  const plateT = plates.reduce((q, x) => q + (x.end - x.start), 0);
  if (total > 0 && plateT / total > 0.25) fl.push(`  FLOW painted backgrounds fill ${((100 * plateT) / total).toFixed(0)} % of the video → ≤ 25 %: Claude's animation (board, reveals, counts, maps, screens, characters) carries the video`);
  for (const x of seq.filter((y) => y.flow)) {
    if (!x.fallback && !x.ok) fl.push(`  FLOW ${x.ch} ${x.id} ${mmss(x.start)}: no "fallback" — name the Claude-made version used if Flow is missing or fails`);
    if (x.flow === 'plate' && x.beatsN < 1 && !x.ok) fl.push(`  FLOW ${x.ch} ${x.id} ${mmss(x.start)}: a painted background alone is never a shot → Claude animation on top ("beats": camera push, characters, objects, text, counts, particles)`);
  }
  if (fl.length) {
    flags += fl.length;
    console.log(`
Flow balance (${seq.filter((y) => y.flow).length} shot(s) use Flow art):`);
    fl.forEach((l) => console.log(l));
  }
}

// RECIPE (Arabic / AZTIKA videos, owner 2026-11-10): the structure of the model video — references/universe-claude/RECIPE.md
{
  const vj = path.join(vdir, 'video.json');
  const isAr = fs.existsSync(vj) && JSON.parse(fs.readFileSync(vj, 'utf8')).lang === 'ar';
  if (isAr && !only && seq.length) {
    const rl = [];
    const t0 = seq[0].start, tEnd = seq[seq.length - 1].end;
    const dev = (d) => seq.filter((x) => x.device === d);
    const undeclared = seq.filter((x) => !x.device).length;
    // HOOK: fast and with a promise of the answer
    const hook = seq.filter((x) => x.start < t0 + 60);
    const hookAvg = hook.length ? Math.min(60, tEnd - t0) / hook.length : 0;
    if (hookAvg > 3 && !hook.some((x) => x.ok)) rl.push(`  HOOK first minute averages ${hookAvg.toFixed(1)} s per shot → ≤ 3 s (reference 2.7 s): more beats, shorter shots`);
    if (!seq.some((x) => x.start < t0 + 45 && (x.device === 'mystery' || x.device === 'roadmap'))) rl.push('  HOOK no "mystery"/"roadmap" in the first 45 s → show the road map / the mystery box the viewer waits for');
    // SPINE: the game board keeps coming back
    const st = dev('stage');
    if (!st.length) rl.push('  SPINE no "stage" shot → the video needs its home stage / game device (PodiumGame, growing timeline, map…)');
    else {
      const visits = [];
      for (const x of st) { const v = visits[visits.length - 1]; if (v && x.start - v.e <= 20) v.e = x.end; else visits.push({s: x.start, e: x.end}); }
      for (let i = 1; i < visits.length; i++) if (visits[i].s - visits[i - 1].e > 150) rl.push(`  SPINE ${mmss(visits[i - 1].e)}–${mmss(visits[i].s)}: ${(visits[i].s - visits[i - 1].e).toFixed(0)} s away from the board → return every ≤ 150 s (reference ~50 s)`);
      if (tEnd - visits[visits.length - 1].e > 200) rl.push(`  SPINE the board is last seen at ${mmss(visits[visits.length - 1].e)} → bring it back for the recap`);
    }
    // PACE: hold the pace where the reference slows down
    for (let w = t0 + 60; w + 180 <= tEnd; w += 30) {
      const n = seq.filter((x) => x.start >= w && x.start < w + 180).length;
      if (n && 180 / n > 5.5) { rl.push(`  PACE ${mmss(w)}–${mmss(w + 180)} averages ${(180 / n).toFixed(1)} s per shot → ≤ 5.5 s (our edit: the reference sags to 7.6 s here)`); w += 150; }
    }
    // ENDING: recap + sign-off
    const last = seq.filter((x) => x.end > tEnd - 120);
    if (!last.some((x) => x.device === 'recap')) rl.push('  ENDING no "recap" in the last 120 s → everything back on the board + the question');
    if (!last.some((x) => x.device === 'signoff')) rl.push('  ENDING no "signoff" → AZTIKA (awe) + NeonSign «في أمان الله»');
    // CTA (owner pick 2026-11-11: C + D — our own addition, the reference shows no buttons): when the voice asks for a
    // like/subscribe, that line is acted with a CtaShot (presses ON the spoken words); the video ends on the end screen
    const ctaWord = words.find((w) => /اشترك|لايك/.test(w.w));
    if (ctaWord && !seq.some((x) => x.kind === 'CtaShot' && x.start <= ctaWord.s + 0.5 && x.end >= ctaWord.s)) rl.push(`  CTA the voice asks for like/subscribe at ${mmss(ctaWord.s)} («${ctaWord.w}») → a CtaShot on that line ("like" / "sub" = the spoken times of «اللايك» / «اشترك»)`);
    const endScreen = (() => { try { return JSON.parse(fs.readFileSync(vj, 'utf8')).endScreen ?? 0; } catch { return 0; } })();
    if (endScreen > 0 && seq.length && seq[seq.length - 1].kind !== 'EndScreenShot') rl.push(`  CTA the video runs ${endScreen} s past the voice → its last shot is an EndScreenShot (room for YouTube's real end-screen buttons)`);
    // CHAPTER: every reveal joins the board
    for (const r of dev('reveal')) if (!r.ok && !st.some((x) => x.start >= r.start && x.start <= r.end + 60)) rl.push(`  CHAPTER ${r.ch} ${r.id} ${mmss(r.start)}: reveal never joins the board within 60 s → add the "stage" round (newcomer + host reaction)`);
    // SCENE CHANGES (references/universe-claude/MOTION.md §4, §8): how each scene enters and leaves is part of the plan
    const chs = [...new Set(seq.map((x) => x.ch))];
    chs.forEach((c, ci) => {
      const cs = seq.filter((x) => x.ch === c);
      const first = cs[0], lastS = cs[cs.length - 1];
      if (ci > 0 && !first.inT && !first.ok) rl.push(`  SCENE ${c} ${first.id} ${mmss(first.start)}: declare how the scene ENTERS — "in": "match" (the hero flies to its place in the new scene) | "dissolve" | "wipe" | "flash" | "whoosh"`);
      if (ci < chs.length - 1 && !lastS.outT && !lastS.ok) rl.push(`  SCENE ${c} ${lastS.id} ${mmss(lastS.start)}: declare how the scene LEAVES — "out": "fly" (punch-in on the key line, the rest flies out) | "wipe" | "whoosh"`);
    });
    seq.forEach((x, i) => {
      const prev = seq[i - 1];
      if (prev && x.device === 'stage' && prev.device === 'reveal' && x.inT !== 'match' && !x.ok) rl.push(`  SCENE ${x.ch} ${x.id} ${mmss(x.start)}: after the reveal, the hero object should FLY onto its podium — "in": "match" (reference 0:24.2)`);
      // BIG NUMBERS: the count is followed by the number as SPOKEN, in words (reference 0:23 «45 مليون دولار»)
      if (x.device === 'count' && !x.spoken && !x.ok && /مليون|ملايين|مليار|مليارات|تريليون|ترليون|ألف|آلاف/.test(x.said)) rl.push(`  NUMBER ${x.ch} ${x.id} ${mmss(x.start)}: add the spoken form under the counted number — "spoken": "45 مليون دولار" (exactly as said)`);
    });
    flags += rl.length;
    console.log(`
Recipe (references/universe-claude/RECIPE.md): ${seq.length - undeclared}/${seq.length} shots declare a "device"${rl.length ? '' : ' — follows the recipe'}`);
    if (undeclared > seq.length * 0.2) console.log(`  note: ${undeclared} shots have no "device" — declare them so the recipe can be checked`);
    rl.forEach((l) => console.log(l));
  }
}
// pace: the owner's videos — 6.8 s per shot felt right, 8.2 s felt slow
const avg = seq.length ? (seq[seq.length - 1].end - seq[0].start) / seq.length : 0;
const arVid = (() => { const vj = path.join(vdir, 'video.json'); return fs.existsSync(vj) && JSON.parse(fs.readFileSync(vj, 'utf8')).lang === 'ar'; })();
console.log(`\nPace: ${seq.length} shots, average ${avg.toFixed(1)} s per shot (${arVid ? 'AZTIKA recipe: hook ≤ 3 s, then ≤ 5.5 s' : 'aim ~6–7 s'})`);
if (!only && avg > 8) {
  flags++;
  console.log('  PACE average over 8 s → too slow for brisk storytelling: split the longest shots');
}
console.log(`\nplan-check ${slug}: ${shotsTotal} shots · ${longTotal} long · ${stillTotal} still sentences · ${sameTotal} same-in-a-row · ${flatTotal} flat · ${flags ? `${flags} flag(s) — fix or justify ("ok") before building` : 'PASS'}`);
process.exit(flags ? 1 : 0);
