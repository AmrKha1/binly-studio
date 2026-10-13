// Start a new video from the files in input/ (voiceover + script + optional notes).
//   node tools/new-video.mjs [--slug medieval-baths] [--title "Why a Hot Bath Was Medicine"] [--no-analyze]
// Does: creates videos/<slug>/ (moves the input files there), scaffolds src/videos/<slug>/, activates it,
// uploads the voiceover to GitHub (release vo-<slug>), and runs the cloud timing analysis.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, args} from './lib/render.mjs';
import {gh, probeAudio, sh} from './lib/sys.mjs';

const a = args();
const IN = path.join(ROOT, 'input');
const files = fs.existsSync(IN) ? fs.readdirSync(IN).filter((f) => !f.startsWith('.') && f.toLowerCase() !== 'readme.md') : [];
const audio = files.filter((f) => /\.(wav|mp3|m4a|flac|aac|ogg)$/i.test(f));
const texts = files.filter((f) => /\.(txt|md)$/i.test(f));
if (audio.length !== 1) {
  console.log(`input/ must contain exactly ONE voiceover audio file (found ${audio.length}: ${audio.join(', ') || 'none'}).`);
  process.exit(1);
}
const notesFile = texts.find((f) => /^(notes|brief|instructions)\b/i.test(f));
const scriptFile = texts.find((f) => f !== notesFile);

const kebab = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/\b(final|vo|voiceover|export|master|v\d+)\b/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const slug = a.slug ?? (kebab(path.parse(audio[0]).name) || `video-${new Date().toISOString().slice(0, 10)}`);
const vdir = path.join(ROOT, 'videos', slug);
const sdir = path.join(ROOT, 'src', 'videos', slug);
if (fs.existsSync(vdir) && !a.force) {
  console.log(`videos/${slug} already exists. Use --slug <new-name>, or --force to reuse it.`);
  process.exit(1);
}
fs.mkdirSync(vdir, {recursive: true});

// 1) move inputs
const ext = path.extname(audio[0]).toLowerCase();
const voDest = path.join(vdir, `voiceover${ext}`);
fs.copyFileSync(path.join(IN, audio[0]), voDest);
const info = probeAudio(voDest);
let scriptText = '';
if (scriptFile) {
  scriptText = fs.readFileSync(path.join(IN, scriptFile), 'utf8');
  fs.writeFileSync(path.join(vdir, 'script.txt'), scriptText);
}
if (notesFile) fs.copyFileSync(path.join(IN, notesFile), path.join(vdir, 'notes.md'));
const firstLine = scriptText.split(/\r?\n/).map((l) => l.trim()).find((l) => l && !/^[-\d\s]+$/.test(l)) ?? slug;
const title = a.title ?? firstLine.replace(/^#+\s*/, '').slice(0, 80);
const meta = {slug, title, duration: Math.round(info.duration * 10000) / 10000, sampleRate: info.sampleRate, channels: info.channels, codec: info.codec, audio: `voiceover${ext}`, source: audio[0], created: new Date().toISOString()};
fs.writeFileSync(path.join(vdir, 'video.json'), JSON.stringify(meta, null, 1));
for (const f of [audio[0], scriptFile, notesFile].filter(Boolean)) fs.rmSync(path.join(IN, f));

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
  else gh('release', 'create', tag, voDest, '--title', `Voiceover: ${slug}`, '--notes', 'Original voiceover (unprocessed). Used by the cloud render.');
  console.log(`voiceover uploaded (release ${tag})`);
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'cloud.mjs'), 'analyze', slug], {stdio: 'inherit'});
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log(`\nNEXT: read videos/${slug}/timing/transcript.md, then plan (see .claude/skills/make-video/PIPELINE.md).`);
