// Make ANY finished video YouTube-ready (the same master the cloud render makes) — e.g. an older video or one made
// elsewhere. Owner's old one-liner was `ffmpeg -i in.mp4 -c copy -movflags +faststart out.mp4` (web-optimised only);
// this does the whole YouTube spec (tools/cloud/youtube.mjs) and checks the result:
//   node tools/youtube-export.mjs <in.mp4> [out.mp4] [--res 1080|1440] [--no-loud] [--copy]
//   default: re-encode video to the spec (H.264 High, BT.709 tagged, CFR, closed GOP, CRF 12 + aq-mode 3) + audio mastered to
//            −14 LUFS / −1 dBTP (two-pass, linear) as AAC-LC 384k 48 kHz + faststart.
//   --copy:  keep the video stream as it is (fast, only remux + audio + faststart — like the old one-liner, but checked).
//   --no-loud: keep the audio level as it is.
// Uses the full ffmpeg on PATH (this PC has one), else the bundled one.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {args} from './lib/render.mjs';
import {FFMPEG, FFPROBE} from './lib/sys.mjs';
import {ytAudioArgs, ytCheck, ytContainerArgs, ytVideoArgs} from './cloud/youtube.mjs';

const a = args();
const [input, out0] = a._;
if (!input || !fs.existsSync(input)) {
  console.log('usage: node tools/youtube-export.mjs <in.mp4> [out.mp4] [--res 1080|1440] [--no-loud] [--copy]');
  process.exit(1);
}
const has = (cmd) => spawnSync(cmd, ['-version'], {encoding: 'utf8'}).status === 0;
const FF = has('ffmpeg') ? 'ffmpeg' : FFMPEG, FP = has('ffprobe') ? 'ffprobe' : FFPROBE;
const out = out0 ?? input.replace(/(\.[^.]+)?$/, '-youtube.mp4');
const probe = (f) => JSON.parse(spawnSync(FP, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', f], {encoding: 'utf8'}).stdout);
const p0 = probe(input);
const v0 = p0.streams.find((s) => s.codec_type === 'video');
const [n, d] = String(v0.r_frame_rate).split('/').map(Number);
const fps = Math.round((n / (d || 1)) * 1000) / 1000;
console.log(`in:  ${v0.width}×${v0.height} ${fps} fps ${v0.codec_name}, ${(Number(p0.format.duration) / 60).toFixed(1)} min`);

// audio loudness: −14 LUFS / −1 dBTP (aim −1.5 so the AAC encode lands ≤ −1), two-pass linear
let af = [];
if (!a['no-loud'] && p0.streams.some((s) => s.codec_type === 'audio')) {
  const r = spawnSync(FF, ['-hide_banner', '-nostats', '-i', input, '-vn', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=20:print_format=json', '-f', 'null', '-'], {encoding: 'utf8'});
  const m = JSON.parse((r.stderr.match(/\{[\s\S]*\}/) ?? ['{}'])[0]);
  console.log(`audio: ${m.input_i} LUFS / ${m.input_tp} dBTP → −14 LUFS / ≤ −1 dBTP`);
  af = ['-af', `loudnorm=I=-14:TP=-1.5:LRA=20:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`];
}
const video = a.copy ? ['-c:v', 'copy'] : ytVideoArgs({res: Number(a.res ?? 1080), fps: Math.round(fps)});
const t0 = Date.now();
const r = spawnSync(FF, ['-hide_banner', '-v', 'error', '-stats', '-y', '-i', input, '-map', '0:v:0', '-map', '0:a:0?', ...video, ...af, ...ytAudioArgs(), ...ytContainerArgs(), out], {stdio: ['ignore', 'inherit', 'inherit']});
if (r.status !== 0) process.exit(1);
// check the delivered file
const fd = fs.openSync(out, 'r'), head = Buffer.alloc(4 << 20);
fs.readSync(fd, head, 0, head.length, 0);
fs.closeSync(fd);
const checks = ytCheck(probe(out), head.toString('latin1'), {fps: Math.round(fps)});
console.log(`\nout: ${out} · ${Math.round(fs.statSync(out).size / 1e6)} MB · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
for (const c of checks) console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}: ${c.value}`);
const lr = spawnSync(FF, ['-hide_banner', '-nostats', '-i', out, '-vn', '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], {encoding: 'utf8'});
const lm = JSON.parse((lr.stderr.match(/\{[\s\S]*\}/) ?? ['{}'])[0]);
const li = Number(lm.input_i), lt = Number(lm.input_tp);
console.log(`  ${Math.abs(li + 14) <= 0.5 && lt <= -1 ? '✓' : a['no-loud'] ? '·' : '✗'} Loudness: ${li} LUFS, ${lt} dBTP`);
const bad = checks.filter((c) => !c.ok);
console.log(bad.length ? `\n${bad.length} check(s) failed` : '\nREADY FOR YOUTUBE ✓');
process.exit(bad.length ? 1 : 0);
