// Start a new video from the files in input/ (voiceover + script + optional notes).
//   node tools/new-video.mjs [--slug medieval-baths] [--title "Why a Hot Bath Was Medicine"] [--lang ar] [--no-analyze] [--vo-ok]
//   (--lang is auto-detected: an Arabic script → "ar". Give Arabic videos an English --slug, e.g. --slug ar-diamonds.)
// Does: creates videos/<slug>/ (moves the input files there), scaffolds src/videos/<slug>/, activates it,
// uploads the voiceover to GitHub (release vo-<slug>), and runs the cloud timing analysis.
// VOICEOVER IN PARTS (owner 2026-11-08): put all parts in input/ (loose files or one folder, numbered "1…", "2…" …).
// tools/vo-prep.mjs levels every part to the same loudness, joins them in number order with 0.35 s, trims every pause
// > 0.23 s to 0.20 s → videos/<slug>/voiceover.wav = the master clock, verified by the voice gate (tools/vo-check.mjs). (--raw keeps a single file exactly as recorded.)
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, args} from './lib/render.mjs';
import {gh, probeAudio, sh} from './lib/sys.mjs';
import {approveVoice} from './lib/vo-gate.mjs';

const a = args();
const IN = path.join(ROOT, 'input');
const files = fs.existsSync(IN) ? fs.readdirSync(IN).filter((f) => !f.startsWith('.') && !['readme.md', 'vo-check.md'].includes(f.toLowerCase())) : [];
const audio = files.filter((f) => /\.(wav|mp3|m4a|flac|aac|ogg)$/i.test(f));
const texts = files.filter((f) => /\.(txt|md)$/i.test(f));
if (audio.length !== 1) {
  console.log(`input/ must contain exactly ONE voiceover audio file (found ${audio.length}: ${audio.join(', ') || 'none'}).`);
  process.exit(1);
}
const notesFile = texts.find((f) => /^(notes|brief|instructions)\b/i.test(f));
const scriptFile = texts.find((f) => f !== notesFile);

const kebab = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/\b(final|vo|voiceover|export|master|v\d+)\b/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const slug = a.slug ?? (kebab(path.parse(audio.length === 1 ? audio[0] : dirs[0] ?? audio[0]).name) || `video-${new Date().toISOString().slice(0, 10)}`);
const vdir = path.join(ROOT, 'videos', slug);
const sdir = path.join(ROOT, 'src', 'videos', slug);
if (fs.existsSync(vdir) && !a.force) {
  console.log(`videos/${slug} already exists. Use --slug <new-name>, or --force to reuse it.`);
  process.exit(1);
}
fs.mkdirSync(vdir, {recursive: true});

// 1) move inputs
let ext = path.extname(audio[0]).toLowerCase();
let voDest = path.join(vdir, `voiceover${ext}`);
if (a.raw) fs.copyFileSync(path.join(IN, audio[0]), voDest);
else {
  // keep the original parts next to the video (git-ignored), then build the one clean voiceover
  const partsDir = path.join(vdir, 'vo-parts');
  fs.mkdirSync(partsDir, {recursive: true});
  for (const f of audio) fs.copyFileSync(path.join(IN, f), path.join(partsDir, path.basename(f)));
  ext = '.wav';
  voDest = path.join(vdir, 'voiceover.wav');
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'vo-prep.mjs'), partsDir, '--out', voDest], {stdio: 'inherit'});
  if (r.status !== 0) process.exit(1);
}
// STEP 1 GATE (owner 2026-11-08): nothing goes on until the voiceover is verified clean (tools/vo-check.mjs).
// FAIL → stop. WARN → stop until a human listened to the listed times and said it is fine (--vo-ok).
if (!a.raw) {
  const c = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'vo-check.mjs'), voDest], {encoding: 'utf8'});
  process.stdout.write(c.stdout ?? '');
  const warn = c.status === 2; // vo-check: 0 = clean PASS · 2 = PASS with warnings · 1 = FAIL
  if (c.status === 1 || c.status === null) {
    console.log(`
VOICE GATE: FAIL — fix the voiceover first (report: input/vo-check.md). The input files were left in input/.`);
    fs.copyFileSync(path.join(vdir, 'vo-check.md'), path.join(IN, 'vo-check.md'));
    fs.rmSync(vdir, {recursive: true, force: true});
    process.exit(1);
  }
  if (warn && !a['vo-ok']) {
    console.log(`
VOICE GATE: warnings — listen to the times listed (report: input/vo-check.md), then run again with --vo-ok if they are fine. The input files were left in input/.`);
    fs.copyFileSync(path.join(vdir, 'vo-check.md'), path.join(IN, 'vo-check.md'));
    fs.rmSync(vdir, {recursive: true, force: true});
    process.exit(2);
  }
  // the stamp every later step checks (tools/lib/vo-gate.mjs): who let this exact voiceover through
  approveVoice(voDest, warn ? 'owner (--vo-ok after listening to the warnings)' : 'voice gate (clean PASS)');
  console.log('VOICE GATE: passed ✓ — the voiceover is locked; every later step checks it is still this exact file');
}
const info = probeAudio(voDest);
let scriptText = '';
if (scriptFile) {
  scriptText = fs.readFileSync(path.join(IN, scriptFile), 'utf8');
  fs.writeFileSync(path.join(vdir, 'script.txt'), scriptText);
}
if (notesFile) fs.copyFileSync(path.join(IN, notesFile), path.join(vdir, 'notes.md'));
const firstLine = scriptText.split(/\r?\n/).map((l) => l.trim()).find((l) => l && !/^[-\d\s]+$/.test(l)) ?? slug;
const title = a.title ?? firstLine.replace(/^#+\s*/, '').slice(0, 80);
// language: Arabic if the script (or file name) is written in Arabic → Arabic fonts, RTL layout, Arabic speech model
const lang = a.lang ?? (/[؀-ۿ]/.test(scriptText + audio[0]) ? 'ar' : 'en');
if (lang === 'ar') console.log('Arabic video detected → lang "ar" (Arabic fonts, right-to-left layout, Arabic speech model)');
const meta = {slug, title, lang, duration: Math.round(info.duration * 10000) / 10000, sampleRate: info.sampleRate, channels: info.channels, codec: info.codec, audio: `voiceover${ext}`, source: audio.length === 1 ? audio[0] : `${audio.length} parts`, voPrep: !a.raw, created: new Date().toISOString()};
fs.writeFileSync(path.join(vdir, 'video.json'), JSON.stringify(meta, null, 1));
for (const f of [...audio, scriptFile, notesFile].filter(Boolean)) fs.rmSync(path.join(IN, f));
for (const d of dirs) if (!fs.readdirSync(path.join(IN, d)).length) fs.rmdirSync(path.join(IN, d));

// 2) scaffold source
fs.mkdirSync(path.join(sdir, 'chapters'), {recursive: true});
fs.mkdirSync(path.join(sdir, 'shared'), {recursive: true});
if (!fs.existsSync(path.join(vdir, 'chapters.json'))) fs.writeFileSync(path.join(vdir, 'chapters.json'), '[]\n');
spawnSync(process.execPath, [path.join(ROOT, 'tools', 'scaffold.mjs'), slug], {stdio: 'inherit'});
spawnSync(process.execPath, [path.join(ROOT, 'tools', 'activate.mjs'), slug], {stdio: 'inherit'});

console.log(`video: ${slug} · "${title}" · ${info.duration.toFixed(2)} s · ${info.sampleRate} Hz ${info.channels}ch ${info.codec}${scriptFile ? ' · script ✓' : ' · NO SCRIPT (timing will use the transcription text)'}${notesFile ? ' · notes ✓' : ''}`);

// 3) upload voiceover (release asset — keeps big audio out of git) + timing analysis
if (!a['no-analyze']) {
  spawnSync(process.execPath, [path.join(ROOT, 'tools', 'cloud.mjs'), 'push', `new video: ${slug}`], {stdio: 'inherit'});
  const tag = `vo-${slug}`;
  const exists = sh('gh', ['release', 'view', tag], {allowFail: true}) !== null;
  if (exists) gh('release', 'upload', tag, voDest, '--clobber');
  else gh('release', 'create', tag, voDest, '--title', `Voiceover: ${slug}`, '--notes', a.raw ? 'Original voiceover (unprocessed). Used by the cloud render.' : 'Voiceover made by tools/vo-prep.mjs (parts levelled to equal loudness, joined with 0.35 s, pauses > 0.23 s → 0.20 s) and passed tools/vo-check.mjs. Used by the cloud render.');
  console.log(`voiceover uploaded (release ${tag})`);
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'cloud.mjs'), 'analyze', slug], {stdio: 'inherit'});
  if (r.status !== 0) process.exit(r.status ?? 1);
  spawnSync(process.execPath, [path.join(ROOT, 'tools', 'speech-map.mjs'), '--slug', slug], {stdio: 'inherit'}); // host lip movement
}
console.log(`\nNEXT: read videos/${slug}/timing/transcript.md, then plan (see .claude/skills/make-video/PIPELINE.md).`);
