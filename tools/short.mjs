// THE HOOK SHORT (owner 2026-11-12): ONE vertical Short per long video that makes viewers want the long one (the
// director recommends 1; if a second moment is truly as strong, he says so and the owner decides).
//   node tools/short.mjs make   [--slug s] --from 12.4 --to 51.0 --title "سطر أبيض|السطر الذهبي" [--id 1] [--freeze 3.5]
//   node tools/short.mjs preview [--slug s] [--id 1] [--at 2,10,20]     → .cache/short/ stills (local, no render)
//   node tools/short.mjs render  [--slug s] [--id 1] [--master file.mp4]  → videos/<slug>/output/<slug>-short-<id>.mp4
// The Short = src/short/Short.tsx: the hook title pinned on top, the long video's moment (sharp) over the same moment
// blurred, word-by-word subtitles (the spoken word lights up gold), the red «الفيديو الكامل على القناة» pill pinned
// near the bottom; then the last frame FREEZES `freeze` s while the owner's outro voice (library/vo/short-outro.*)
// says the pill's words. Pick the moment: it hooks in its first 2 s, stands alone, and STOPS BEFORE THE ANSWER.
// Privacy: the props (with the spoken words) live in videos/<slug>/shorts/ (git-ignored) and reach the cloud SEALED.
// The picture renders in the cloud (short.yml); the sound comes from the long video's own master (already mixed and
// −14 LUFS) + the outro voice, joined and mastered here. Publish the Short AFTER the long video and link it to it.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, args} from './lib/render.mjs';
import {gh, sh} from './lib/sys.mjs';
import {dispatch, wait} from './lib/gha.mjs';

const a = args();
const cmd = a._[0];
const slug = a.slug ?? fs.readFileSync(path.join(ROOT, 'src', 'active.ts'), 'utf8').match(/videos\/([^']+)'/)?.[1];
const id = String(a.id ?? '1');
const vdir = path.join(ROOT, 'videos', slug);
const sfile = path.join(vdir, 'shorts', `short-${id}.json`);
const FF = process.env.FFMPEG ?? 'ffmpeg';
const ff = (args_) => { const r = spawnSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...args_], {encoding: 'utf8', maxBuffer: 1 << 26}); if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr}`); return r; };

if (cmd === 'make') {
  const from = +a.from, to = +a.to;
  if (!(to > from)) { console.log('usage: make --from <s> --to <s> --title "white line|gold line"'); process.exit(1); }
  const title = String(a.title ?? '').split('|').map((x) => x.trim());
  if (title.length !== 2 || !title[0] || !title[1]) { console.log('--title needs two lines: "white line|gold line"'); process.exit(1); }
  const words = JSON.parse(fs.readFileSync(path.join(vdir, 'timing', 'words.json'), 'utf8')).filter((w) => w.e > from && w.s < to).map((w) => ({w: w.w, s: w.s, e: w.e}));
  fs.mkdirSync(path.dirname(sfile), {recursive: true});
  fs.writeFileSync(sfile, JSON.stringify({from, to, title, words, freeze: +(a.freeze ?? 3.5)}, null, 1));
  console.log(`short ${id}: ${from}–${to} s (${(to - from).toFixed(1)} s + ${a.freeze ?? 3.5} s freeze) · ${words.length} words · videos/${slug}/shorts/short-${id}.json`);
  if (to - from > 58) console.log('  note: over ~58 s — the best hook Shorts are 30–55 s');
} else if (cmd === 'preview') {
  const at = String(a.at ?? '1,6,12').split(',');
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'still.mjs'), '--comp', 'Short', '--props', fs.readFileSync(sfile, 'utf8'), '--at', at.join(','), '--scale', '0.5', '--out', path.join(ROOT, '.cache', 'short')], {stdio: 'inherit'});
  process.exit(r.status ?? 0);
} else if (cmd === 'render') {
  const p = JSON.parse(fs.readFileSync(sfile, 'utf8'));
  // the long video's master (mixed + mastered): --master, else the newest render in videos/<slug>/output/
  const outDir = path.join(vdir, 'output');
  const master = a.master ?? fs.readdirSync(outDir).filter((f) => f.endsWith('.mp4') && !f.includes('short')).map((f) => path.join(outDir, f)).sort((x, y) => fs.statSync(y).mtimeMs - fs.statSync(x).mtimeMs)[0];
  if (!master) { console.log('STOP: no rendered long video in videos/<slug>/output/ — the Short takes its sound from it'); process.exit(1); }
  // 1) the props go to the cloud SEALED (release vo-<slug>, asset short-<id>.enc)
  const {sealKey} = await import('./lib/seal-upload.mjs');
  const {encryptFile} = await import('./cloud/crypt.mjs');
  const tmp = path.join(ROOT, '.cache', `short-${slug}-${id}`);
  fs.mkdirSync(tmp, {recursive: true});
  const enc = path.join(tmp, `short-${id}.enc`);
  encryptFile(sfile, enc, sealKey());
  const tag = `vo-${slug}`;
  const existed = sh('gh', ['release', 'view', tag], {allowFail: true}) !== null;
  if (existed) gh('release', 'upload', tag, enc, '--clobber');
  else gh('release', 'create', tag, enc, '--title', `Short props: ${slug} (sealed)`, '--notes', 'Sealed (AES-256-GCM): opened only inside the cloud job. Deleted after the render.');
  // 2) the cloud renders the picture (the Short composition must be pushed)
  spawnSync(process.execPath, [path.join(ROOT, 'tools', 'cloud.mjs'), 'push', `short: ${slug} ${id}`], {stdio: 'inherit'});
  let ok = false;
  try {
    const run = await dispatch('short.yml', {slug, id});
    console.log(`short run ${run} started`);
    await wait(run, 'short');
    gh('run', 'download', String(run), '-n', `short-${slug}-${id}`, '-D', tmp);
    ok = true;
  } finally {
    // the sealed props never stay online
    if (existed) sh('gh', ['release', 'delete-asset', tag, `short-${id}.enc`, '--yes'], {allowFail: true});
    else sh('gh', ['release', 'delete', tag, '--yes', '--cleanup-tag'], {allowFail: true});
    fs.rmSync(enc, {force: true});
  }
  if (!ok) process.exit(1);
  // 3) the sound: the long master's moment + the outro voice over the freeze, mastered to −14 LUFS
  const dur = p.to - p.from, freeze = p.freeze ?? 3.5;
  const outro = ['wav', 'mp3', 'm4a', 'flac'].map((e) => path.join(ROOT, 'library', 'vo', `short-outro.${e}`)).find((f) => fs.existsSync(f));
  if (!outro) console.log('  NOTE: no library/vo/short-outro.* yet — the freeze is silent until the owner\'s «الفيديو الكامل على القناة» voice is added');
  const mix = path.join(tmp, 'mix.wav');
  const inputs = ['-ss', String(p.from), '-t', String(dur), '-i', master, ...(outro ? ['-i', outro] : [])];
  const filter = outro
    ? `[0:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur=${dur}[m];[1:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur=${freeze},atrim=0:${freeze}[o];[m][o]concat=n=2:v=0:a=1[a]`
    : `[0:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur=${dur + freeze}[a]`;
  ff([...inputs, '-filter_complex', filter, '-map', '[a]', '-c:a', 'pcm_s24le', mix]);
  const m1 = spawnSync(FF, ['-hide_banner', '-nostats', '-i', mix, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=20:print_format=json', '-f', 'null', '-'], {encoding: 'utf8'}).stderr.match(/\{[\s\S]*\}/);
  const L = JSON.parse(m1[0]);
  const out = path.join(outDir, `${slug}-short-${id}.mp4`);
  ff(['-i', path.join(tmp, 'short.mp4'), '-i', mix, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
    '-af', `loudnorm=I=-14:TP=-1.5:LRA=20:measured_I=${L.input_i}:measured_TP=${L.input_tp}:measured_LRA=${L.input_lra}:measured_thresh=${L.input_thresh}:offset=${L.target_offset}:linear=true,aresample=48000`,
    '-c:a', 'aac', '-b:a', '384k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
  const check = spawnSync(FF, ['-hide_banner', '-nostats', '-i', out, '-vn', '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], {encoding: 'utf8'}).stderr.match(/\{[\s\S]*\}/);
  const C = JSON.parse(check[0]);
  fs.rmSync(tmp, {recursive: true, force: true});
  console.log(`SHORT READY: ${path.relative(ROOT, out)} · ${(dur + freeze).toFixed(1)} s · ${C.input_i} LUFS / ${C.input_tp} dBTP`);
  console.log('  publish AFTER the long video; in YouTube Studio link it to the long video ("Related video")');
} else {
  console.log('usage: node tools/short.mjs make|preview|render [--slug s] [--id 1] …  (see the top of this file)');
  process.exit(1);
}
