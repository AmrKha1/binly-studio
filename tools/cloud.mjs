// Cloud jobs on GitHub Actions (free, parallel). Run long ones in the background.
//   node tools/cloud.mjs push ["message"]                 commit + push the studio (code, plans, timing)
//   node tools/cloud.mjs analyze <slug> [--model small.en] transcribe + align → videos/<slug>/timing/
//   node tools/cloud.mjs render <slug> [--scale 0.5] [--from 120 --to 210]
//        → videos/<slug>/output/<file>.mp4 + videos/<slug>/qa/<label>/ (qa_report.md, sheet-NN.png)
//   node tools/cloud.mjs runs                             recent runs
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, args} from './lib/render.mjs';
import {gh, git, sh, sleep, token} from './lib/sys.mjs';

const a = args();
const [cmd, slug] = a._;

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

async function dispatch(workflow, fields) {
  const tok = token();
  gh('workflow', 'run', workflow, ...Object.entries({...fields, token: tok}).flatMap(([k, v]) => ['-f', `${k}=${v}`]));
  for (let i = 0; i < 40; i++) {
    await sleep(3000);
    const runs = JSON.parse(gh('run', 'list', '--workflow', workflow, '--limit', '15', '--json', 'databaseId,displayTitle'));
    const r = runs.find((x) => x.displayTitle.includes(tok));
    if (r) return r.databaseId;
  }
  throw new Error('workflow run did not appear');
}

async function wait(id, label) {
  const t0 = Date.now();
  let last = '';
  for (;;) {
    const r = JSON.parse(gh('run', 'view', String(id), '--json', 'status,conclusion,jobs'));
    const done = (r.jobs ?? []).filter((j) => j.status === 'completed').length;
    const line = `${r.status}${r.conclusion ? ' / ' + r.conclusion : ''} · jobs ${done}/${(r.jobs ?? []).length}`;
    if (line !== last) {
      console.log(`[${((Date.now() - t0) / 60000).toFixed(1)} min] ${label}: ${line}`);
      last = line;
    }
    if (r.status === 'completed') {
      if (r.conclusion !== 'success') {
        const logs = sh('gh', ['run', 'view', String(id), '--log-failed'], {allowFail: true}) ?? '';
        console.log('---- failed log (tail) ----\n' + logs.split('\n').slice(-60).join('\n'));
        throw new Error(`${label} failed (run ${id})`);
      }
      return;
    }
    await sleep(20000);
  }
}

async function analyze() {
  const model = a.model ?? 'small.en';
  push(`timing: ${slug}`);
  const id = await dispatch('analyze.yml', {slug, model});
  console.log(`analyze run ${id} started`);
  await wait(id, 'analyze');
  const dir = path.join(ROOT, 'videos', slug, 'timing');
  fs.rmSync(dir, {recursive: true, force: true});
  gh('run', 'download', String(id), '-n', `${slug}-timing`, '-D', dir);
  const info = JSON.parse(fs.readFileSync(path.join(dir, 'info.json'), 'utf8'));
  console.log(`timing ready: ${info.words} words, ${info.paragraphs} paragraphs, script match ${(info.script_match_ratio * 100).toFixed(1)}%, duration ${info.duration}s`);
  console.log(`→ read videos/${slug}/timing/transcript.md`);
  push(`timing ready: ${slug}`);
}

async function render() {
  const scale = a.scale ?? '1';
  const from = a.from !== undefined ? String(a.from) : '';
  const to = a.to !== undefined ? String(a.to) : '';
  push(`render: ${slug}${from || to ? ` ${from}-${to}` : ''} scale ${scale}`);
  const id = await dispatch('render.yml', {slug, scale, from_s: from, to_s: to, chunk_s: a.chunk ?? '75'});
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
