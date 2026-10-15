// Plan check — runs on the shot lists BEFORE any building (cheap: text only, no rendering).
// Catches the "words said but nothing new on screen" problem:
//   • LONG shot     — longer than 10 s (aim ≤ ~8 s; a moving camera carrying several beats may justify more)
//   • STILL SENTENCE — a spoken sentence that starts with no visible change near it (no shot start, no beat)
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
const LONG = 10; // s
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

let flags = 0, shotsTotal = 0, longTotal = 0, stillTotal = 0;
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
    const dur = end - s.start;
    const changes = [s.start, ...(s.beats ?? []), ...(s.custom ? [] : templateBeats(s.props))];
    const said = sentences.filter((x) => x.s >= s.start - 0.3 && x.s < end - 0.3);
    const still = said.filter((x) => !changes.some((c) => Math.abs(c - x.s) <= NEAR || (c > x.s && c < x.s + NEAR)));
    const isLong = dur > LONG;
    if (s.ok) {
      if (isLong || still.length) lines.push(`  ok   ${s.id} ${mmss(s.start)} ${dur.toFixed(1)} s — accepted: ${s.ok}`);
      return;
    }
    if (isLong) { longTotal++; flags++; lines.push(`  LONG ${s.id} ${mmss(s.start)}–${mmss(end)} ${dur.toFixed(1)} s, ${said.length} sentences, ${changes.length - 1} beats → split, or add beats + camera travel`); }
    for (const x of still) { stillTotal++; flags++; lines.push(`  STILL ${s.id} ${mmss(x.s)} "${x.text.slice(0, 70)}${x.text.length > 70 ? '…' : ''}" → give it a visible change (beat at ${x.s.toFixed(2)})`); }
  });
  console.log(`${ch.id} (${shots.length} shots, avg ${((ch.end - ch.start) / Math.max(1, shots.length)).toFixed(1)} s): ${lines.length ? '' : 'OK'}`);
  lines.forEach((l) => console.log(l));
}
console.log(`\nplan-check ${slug}: ${shotsTotal} shots · ${longTotal} long · ${stillTotal} still sentences · ${flags ? `${flags} flag(s) — fix or justify ("ok") before building` : 'PASS'}`);
process.exit(flags ? 1 : 0);
