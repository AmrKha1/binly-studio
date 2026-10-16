// Plan check — runs on the shot lists BEFORE any building (cheap: text only, no rendering).
// Catches the "words said but nothing new on screen" problem:
//   • LONG shot     — longer than 10 s with a sentence that has no beat, or longer than 15 s (a 10–15 s shot where
//                     every sentence has its own beat — moving camera, new elements — passes as "long ok")
//   • STILL SENTENCE — a spoken sentence that starts with no visible change near it (no shot start, no beat)
//   • SAME  — 3 shots in a row with the same template, or 3 text / diagram / image / data shots in a row
//   • FLAT  — more than 60 s (story scenes: 120 s) without a switch of visual mode (scene / character / diagram / map / image / text / data)
// Custom shots declare their mode: "mode":"scene" (templates know theirs).
// Custom shots list their visible changes as cue times: {"id":"S3","start":98.9,"custom":true,"note":"…","beats":[100.2,103.6]}
// Template shots count their own reveal times (props named at / …At / cues / items[].at).
// A flag can be accepted on purpose with  "ok": "why"  on that shot (e.g. "slow push holds the big idea").
//   node tools/plan-check.mjs [--slug s] [C03]
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, args} from './lib/render.mjs';

const a = args();
const active = fs.readFileSync(path.join(ROOT, 'src', 'active.ts'), 'utf8').match(/videos\/([^']+)'/)?.[1];
const slug = a.slug ?? active;
const vdir = path.join(ROOT, 'videos', slug);
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
let flags = 0, shotsTotal = 0, longTotal = 0, stillTotal = 0, sameTotal = 0, flatTotal = 0, noMode = 0;
for (const ch of chapters) {
  if (only && ch.id !== only) continue;
  const f = path.join(vdir, 'shots', `${ch.id}.json`);
  if (!fs.existsSync(f)) {
    console.log(`${ch.id}: no shots/${ch.id}.json (hand-written chapter — not checked)`);
    continue;
  }
  const shots = JSON.parse(fs.readFileSync(f, 'utf8')).shots ?? [];
  const lines = [];
  shots.forEach((s, i) => {
    shotsTotal++;
    const end = i + 1 < shots.length ? shots[i + 1].start : ch.end;
    const mode = s.mode ?? (s.custom ? null : TEMPLATE_MODE[s.template] ?? null);
    if (s.custom && !s.mode) noMode++;
    seq.push({ch: ch.id, id: s.id, start: s.start, end, mode, kind: s.custom ? 'custom' : s.template, ok: s.ok, sig: !!s.signature});
    const dur = end - s.start;
    const changes = [s.start, ...(s.beats ?? []), ...(s.custom ? [] : templateBeats(s.props))];
    const said = sentences.filter((x) => x.s >= s.start - 0.3 && x.s < end - 0.3);
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
console.log(`\nplan-check ${slug}: ${shotsTotal} shots · ${longTotal} long · ${stillTotal} still sentences · ${sameTotal} same-in-a-row · ${flatTotal} flat · ${flags ? `${flags} flag(s) — fix or justify ("ok") before building` : 'PASS'}`);
process.exit(flags ? 1 : 0);
