// Joins rendered chunks (lossless concat) and muxes the final audio:
//   voiceover (as prepared at ingest) + music stem (silent — no music) + SFX stem → MASTERED to the owner's delivery
//   spec (2026-11-08): −14 LUFS integrated, −1 dBTP true peak — two-pass EBU R128 loudnorm in LINEAR mode (one constant
//   gain for the whole mix, so the voice keeps its dynamics), aimed at −1.5 dBTP so the AAC encode lands ≤ −1 dBTP;
//   the final file is measured again → final/loudness.json (shown in the QA report).
// usage: node tools/cloud/assemble.mjs <slug> [from_s] [to_s]     (expects chunks/, stems/, in/)
import fs from 'node:fs';
import path from 'node:path';
const FF = process.env.FFMPEG ?? "ffmpeg";
const FP = process.env.FFPROBE ?? "ffprobe";
import {execFileSync, spawnSync} from 'node:child_process';

const [, , slug, fromS, toS] = process.argv;
const run = (args) => execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...args], {stdio: 'inherit'});
fs.mkdirSync('final', {recursive: true});
const chunks = fs.readdirSync('chunks').filter((f) => /^chunk-\d+\.mp4$/.test(f)).sort();
if (!chunks.length) throw new Error('no chunks');
fs.writeFileSync('final/list.txt', chunks.map((c) => `file '${path.resolve('chunks', c)}'`).join('\n'));
run(['-f', 'concat', '-safe', '0', '-i', 'final/list.txt', '-c', 'copy', 'final/video-only.mp4']);

const vo = path.join('in', fs.readdirSync('in').find((f) => f.startsWith('voiceover.')));
const from = fromS ? Number(fromS) : 0;
const range = [];
if (fromS) range.push('-ss', String(from));
if (toS) range.push('-to', String(Number(toS)));
// voiceover is only resampled/upmixed for the container; its samples are not processed (no gain, EQ, compression)
const filter = '[1:a]aresample=48000,aformat=channel_layouts=stereo[v];[2:a]aresample=48000[m];[3:a]aresample=48000[s];[v][m][s]amix=inputs=3:normalize=0:duration=first[a]';
// 1) the mix (24-bit wav)
run([...range, '-i', vo, ...range, '-i', 'stems/music.wav', ...range, '-i', 'stems/sfx.wav',
  '-filter_complex', filter.replace(/[1:a]/, '[0:a]').replace(/[2:a]/, '[1:a]').replace(/[3:a]/, '[2:a]'),
  '-map', '[a]', '-c:a', 'pcm_s24le', '-ar', '48000', 'final/mix.wav']);
// 2) measure (EBU R128) → 3) one linear gain to −14 LUFS with a true-peak ceiling
const I = -14, TP = -1.5, LRA = 20;
const measure = (file, extra = []) => {
  const r = spawnSync(FF, ['-hide_banner', '-nostats', '-i', file, ...extra, '-af', `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:print_format=json`, '-f', 'null', '-'], {encoding: 'utf8'});
  const m = (r.stderr || '').match(/{[sS]*}/);
  if (!m) throw new Error('loudness measurement failed: ' + (r.stderr || '').slice(-400));
  return JSON.parse(m[0]);
};
const m1 = measure('final/mix.wav');
run(['-i', 'final/mix.wav', '-af',
  `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:measured_I=${m1.input_i}:measured_TP=${m1.input_tp}:measured_LRA=${m1.input_lra}:measured_thresh=${m1.input_thresh}:offset=${m1.target_offset}:linear=true:print_format=summary,aresample=48000`,
  '-c:a', 'pcm_s24le', 'final/master.wav']);
// 4) mux the mastered audio (AAC 320k)
run(['-i', 'final/video-only.mp4', '-i', 'final/master.wav', '-map', '0:v', '-map', '1:a',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-shortest', '-movflags', '+faststart', 'final/video.mp4']);
// 5) verify the delivered file
const m2 = measure('final/video.mp4', ['-vn']);
const loud = {target: {lufs: -14, true_peak_db: -1}, mix_before: {lufs: +m1.input_i, true_peak_db: +m1.input_tp}, final: {lufs: +m2.input_i, true_peak_db: +m2.input_tp, lra: +m2.input_lra}};
loud.ok = Math.abs(loud.final.lufs + 14) <= 0.5 && loud.final.true_peak_db <= -1.0;
fs.writeFileSync('final/loudness.json', JSON.stringify(loud, null, 1));
console.log(`master: ${loud.mix_before.lufs} LUFS → ${loud.final.lufs} LUFS, true peak ${loud.final.true_peak_db} dBTP ${loud.ok ? '✓' : '✗ (outside −14 LUFS ±0.5 / −1 dBTP)'}`);
fs.rmSync('final/mix.wav', {force: true});
console.log(`assembled final/video.mp4 from ${chunks.length} chunk(s)${fromS || toS ? ` (range ${fromS || 0}–${toS || 'end'} s)` : ''}`);
