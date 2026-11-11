// Cloud jobs on GitHub Actions (free, parallel). Run long ones in the background.
//   node tools/cloud.mjs push ["message"]                 commit + push the studio (code, plans, timing)
//   node tools/cloud.mjs analyze <slug> [--model small.en] transcribe + align → videos/<slug>/timing/
//   node tools/cloud.mjs render <slug> [--scale 0.5] [--from 120 --to 210] [--yt 1440]   (YouTube master 1080 default, or 1440 upscale)
//        → videos/<slug>/output/<file>.mp4 + videos/<slug>/qa/<label>/ (qa_report.md, sheet-NN.png)
//   node tools/cloud.mjs runs                             recent runs
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, args} from './lib/render.mjs';
import {requireVoice} from './lib/vo-gate.mjs';
import {requireRenderGate} from './lib/render-gate-lock.mjs';
import {gh, git, sh} from './lib/sys.mjs';
import {dispatch, wait} from './lib/gha.mjs';

const a = args();
const [cmd, slug] = a._;
if ((cmd === 'analyze' || cmd === 'render') && slug) requireVoice(slug, 'cloud ' + cmd);
// RENDER GATE (owner 2026-11-11): no render — not even a preview — before tools/render-gate.mjs says GO for this exact video
if (cmd === 'render' && slug) requireRenderGate(ROOT, slug, 'cloud render');

export function push(message = 'studio update') {
  git('add', '-A');
  const status = git('status', '--porcelain');
  if (status) {
    git('commit', '-q', '-m', message);
    console.log(`committed: ${message}`);
  }
  const ahead = sh('git', ['rev-list', '--count', '@{u}..HEAD'], {allowFail: true});
  if (ahead === null || Number(ahead) > 0) {
    sh('git', ['push', '-q', '-u', 'origin', 'HEAD']);
    console.log('pushed');
  } else console.log('nothing to push');
}

async function analyze() {
  const vj = path.join(ROOT, 'videos', slug, 'video.json');
  const lang = a.lang ?? (fs.existsSync(vj) ? JSON.parse(fs.readFileSync(vj, 'utf8')).lang : undefined) ?? 'en';
  // Arabic: the multilingual large-v3 model (most accurate Arabic; slower on the cloud CPU, ~1-2x audio length)
  const model = a.model ?? (lang === 'ar' ? 'large-v3' : 'small.en');
  push(`timing: ${slug}`);
  // SEALED (owner 2026-11-11): the voice + script arrive encrypted, the timing leaves encrypted — nothing readable in
  // the public repo's runs; only the word TIMES (numbers) are committed (timing/times.json)
  const id = await dispatch('analyze.yml', {slug, model, lang, sealed: '1'});
  console.log(`analyze run ${id} started`);
  await wait(id, 'analyze');
  const dir = path.join(ROOT, 'videos', slug, 'timing');
  fs.rmSync(dir, {recursive: true, force: true});
  const tmp = path.join(ROOT, '.cache', `sealed-${slug}`);
  fs.rmSync(tmp, {recursive: true, force: true});
  gh('run', 'download', String(id), '-n', `${slug}-timing`, '-D', tmp);
  const key = process.env.REF_KEY ?? fs.readFileSync(path.join(ROOT, '.cache', 'ref', 'key.txt'), 'utf8').trim();
  const {decryptFile} = await import('./cloud/crypt.mjs');
  decryptFile(path.join(tmp, 'timing.enc'), path.join(tmp, 'timing.tgz'), key);
  sh('tar', ['-xzf', path.join(tmp, 'timing.tgz'), '-C', path.join(ROOT, 'videos', slug)]);
  fs.rmSync(tmp, {recursive: true, force: true});
  const {writeWordTimes} = await import('./lib/word-times.mjs');
  writeWordTimes(path.join(ROOT, 'videos', slug));
  const info = JSON.parse(fs.readFileSync(path.join(dir, 'info.json'), 'utf8'));
  console.log(`timing ready: ${info.words} words, ${info.paragraphs} paragraphs, script match ${(info.script_match_ratio * 100).toFixed(1)}%, duration ${info.duration}s`);
  if (info.spoken_not_in_script || info.script_words_not_spoken) console.log(`voiceover vs script: ${info.spoken_not_in_script ?? 0} spoken words not in the script (kept), ${info.script_words_not_spoken ?? 0} script words not spoken (dropped) — the transcript follows the VOICEOVER`);
  if (info.script_match_ratio < 0.9) console.log('WARNING: the script differs a lot from the voiceover — tell the user (wrong script file?). Timing still follows the voiceover.');
  console.log(`→ read videos/${slug}/timing/transcript.md`);
  push(`timing ready: ${slug}`);
}

// the YouTube upload size: Arabic (AZTIKA) = 1440p by default (owner 2026-11-11: YouTube gives 1440p uploads its better
// codec + bitrate, so the deep gradients and glows stay clean even for 1080p viewers; we still RENDER at 1080p — only the
// final encode scales up). English stays 1080p. Override with --yt 1080|1440.
const ytDefault = () => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'videos', slug, 'video.json'), 'utf8')).lang === 'ar' ? '1440' : '1080'; } catch { return '1080'; } };
async function render() {
  const scale = a.scale ?? '1';
  const from = a.from !== undefined ? String(a.from) : '';
  const to = a.to !== undefined ? String(a.to) : '';
  push(`render: ${slug}${from || to ? ` ${from}-${to}` : ''} scale ${scale}`);
  const id = await dispatch('render.yml', {slug, scale, from_s: from, to_s: to, chunk_s: a.chunk ?? '75', youtube: String(a.yt ?? ytDefault())});
  console.log(`render run ${id} started (https://github.com/${gh('repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner')}/actions/runs/${id})`);
  await wait(id, 'render');
  const outDir = path.join(ROOT, 'videos', slug, 'output');
  fs.mkdirSync(outDir, {recursive: true});
  const base = from || to ? `${slug}-part-${from || 0}-${to || 'end'}${scale !== '1' ? '-preview' : ''}` : `${slug}${scale !== '1' ? '-preview' : ''}`;
  let name = `${base}.mp4`;
  for (let v = 2; fs.existsSync(path.join(outDir, name)); v++) name = `${base}-v${v}.mp4`;
  const tmp = path.join(ROOT, '.cache', `dl-${id}`);
  fs.rmSync(tmp, {recursive: true, force: true});
  gh('run', 'download', String(id), '-n', `${slug}-video`, '-D', tmp);
  fs.renameSync(path.join(tmp, 'video.mp4'), path.join(outDir, name));
  const qaDir = path.join(ROOT, 'videos', slug, 'qa', name.replace(/\.mp4$/, ''));
  fs.rmSync(qaDir, {recursive: true, force: true});
  gh('run', 'download', String(id), '-n', `${slug}-qa`, '-D', qaDir);
  const report = fs.readFileSync(path.join(qaDir, 'qa_report.md'), 'utf8');
  console.log(`\nVIDEO: videos/${slug}/output/${name}\nQA:    ${path.relative(ROOT, qaDir)}/ (qa_report.md, sheet-NN.png)\n\n${report}`);
}

if (cmd === 'push') push(slug ?? a.m ?? 'studio update');
else if (cmd === 'analyze' && slug) await analyze();
else if (cmd === 'render' && slug) await render();
else if (cmd === 'runs') console.log(gh('run', 'list', '--limit', '10'));
else console.log('usage: node tools/cloud.mjs push|analyze <slug>|render <slug> [--scale 0.5] [--from s --to s]|runs');
