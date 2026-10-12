// Post-render QA on the cloud runner (real ffmpeg/ffprobe). Measures the delivered file honestly.
// usage: node tools/cloud/qa.mjs <video.mp4> <voiceover> <qaDir> [from_s] [to_s]
// Writes <qaDir>/qa_report.md (+ contact sheets sheet-NN.png every 3 s, 30 tiles per sheet, and a waveform).
import fs from 'node:fs';
import path from 'node:path';
const FF = process.env.FFMPEG ?? "ffmpeg";
const FP = process.env.FFPROBE ?? "ffprobe";
import {execFileSync, spawnSync} from 'node:child_process';

const [, , video, vo, qaDir, fromS, toS] = process.argv;
fs.mkdirSync(qaDir, {recursive: true});
const run = (bin, args) => execFileSync(bin, args, {maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'pipe']});
const ffLog = (args) => spawnSync(FF, ['-hide_banner', '-nostats', ...args], {encoding: 'utf8', maxBuffer: 1 << 30}).stderr;
const lines = [];
const warn = [];
const log = (s) => {
  console.log(s);
  lines.push(s);
};

const probe = JSON.parse(run(FP, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', video]).toString());
const v = probe.streams.find((s) => s.codec_type === 'video');
const a = probe.streams.find((s) => s.codec_type === 'audio');
const dur = +probe.format.duration;
log(`- File: ${(probe.format.size / 1e6).toFixed(1)} MB, duration ${dur.toFixed(3)} s`);
log(`- Video: ${v.codec_name} ${v.profile ?? ''} ${v.width}x${v.height} ${v.pix_fmt}, ${v.r_frame_rate} fps, bitrate ${(v.bit_rate / 1e6).toFixed(1)} Mb/s`);
log(`- Audio: ${a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels}ch ${(a.bit_rate / 1000).toFixed(0)} kb/s` : 'MISSING'}`);
if (!a) warn.push('No audio stream');
if (v.r_frame_rate !== '60/1') warn.push(`Frame rate is ${v.r_frame_rate}, expected 60/1`);
const voDur = +JSON.parse(run(FP, ['-v', 'error', '-show_format', '-of', 'json', vo]).toString()).format.duration;
const expect = (toS ? Number(toS) : voDur) - (fromS ? Number(fromS) : 0);
log(`- Expected duration (voiceover${fromS || toS ? ' range' : ''}): ${expect.toFixed(3)} s → difference ${(dur - expect).toFixed(3)} s`);
if (Math.abs(dur - expect) > 0.1) warn.push(`Duration differs from voiceover by ${(dur - expect).toFixed(2)} s`);

// constant frame interval
const pts = run(FP, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time', '-of', 'csv=p=0', video]).toString().trim().split(/\r?\n/).map(Number).sort((x, y) => x - y);
const deltas = new Map();
for (let i = 1; i < pts.length; i++) {
  const d = (pts[i] - pts[i - 1]).toFixed(4);
  deltas.set(d, (deltas.get(d) ?? 0) + 1);
}
log(`- Frames: ${pts.length}; frame-interval histogram: ${[...deltas.entries()].map(([d, c]) => `${d}s×${c}`).join(', ')}`);
if ([...deltas.keys()].some((d) => Math.abs(Number(d) - 1 / 60) > 0.002)) warn.push('Irregular frame intervals (possible dropped/duplicated frames at a chunk seam)');

// static holds and black frames
const fr = ffLog(['-i', video, '-vf', 'freezedetect=n=0.0008:d=4', '-map', '0:v', '-f', 'null', '-']);
const freezes = [...fr.matchAll(/freeze_start: ([\d.]+)[\s\S]*?freeze_duration: ([\d.]+)/g)].map((m) => [+m[1], +m[2]]);
log(`- Static holds ≥ 4 s (frames nearly identical): ${freezes.length ? freezes.map(([s, d]) => `${s.toFixed(1)}s (+${d.toFixed(1)}s)`).join(', ') : 'none'}`);
if (freezes.length) warn.push(`${freezes.length} static hold(s) ≥ 4 s — check they are intentional (dead frames hurt retention)`);
const bl = ffLog(['-i', video, '-vf', 'blackdetect=d=0.2:pix_th=0.06', '-map', '0:v', '-f', 'null', '-']);
const blacks = [...bl.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => `${m[1]}-${m[2]}`);
log(`- Black segments ≥ 0.2 s: ${blacks.length ? blacks.join(', ') : 'none'}`);

// near-empty frames: very low visual information (e.g. a blank paper frame between shots)
{
  const out = ffLog(['-i', video, '-vf', "select='not(mod(n\\,15))',scale=480:-1,entropy,metadata=print:key=lavfi.entropy.normalized_entropy.normal.Y", '-an', '-f', 'null', '-']);
  const pts = [...out.matchAll(/pts_time:([\d.]+)[\s\S]*?normalized_entropy\.normal\.Y=([\d.]+)/g)].map((m) => [+m[1], +m[2]]);
  const low = pts.filter(([, e]) => e < 0.12);
  const spans = [];
  for (const [t] of low) {
    const last = spans[spans.length - 1];
    if (last && t - last[1] <= 0.3) last[1] = t;
    else spans.push([t, t]);
  }
  const bad = spans.filter(([a, b]) => b - a >= 0.4 && a > 0.5 && b < dur - 1.5);
  log(`- Near-empty frames (very low detail ≥ 0.4 s): ${bad.length ? bad.map(([a, b]) => `${(a + off).toFixed(1)}–${(b + off).toFixed(1)}s`).join(', ') : 'none'} (sampled ${pts.length} frames)`);
  if (bad.length) warn.push(`${bad.length} near-empty stretch(es) — check they are intentional (an empty frame looks broken)`);
}

// loudness
const loud = (file) => {
  const out = ffLog(['-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const I = [...out.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop();
  const tp = [...out.matchAll(/Peak:\s+(-?[\d.]+) dBFS/g)].pop();
  return {I: I ? +I[1] : NaN, tp: tp ? +tp[1] : NaN};
};
const lf = loud(video);
const lv = loud(vo);
log(`- Loudness: final mix ${lf.I} LUFS (true peak ${lf.tp} dBFS); voiceover alone ${lv.I} LUFS (true peak ${lv.tp} dBFS)`);
log(`- Music + SFX contribution to integrated loudness: ${(lf.I - lv.I).toFixed(2)} LU (small = voice stays dominant)`);
if (lf.tp > -0.1) warn.push(`True peak ${lf.tp} dBFS — possible clipping`);

// narration alignment: cross-correlation of final audio vs the source voiceover
const pcm = (file, ss, to) => {
  const args = ['-v', 'error'];
  if (ss) args.push('-ss', String(ss));
  if (to) args.push('-to', String(to));
  args.push('-i', file, '-ac', '1', '-ar', '8000', '-f', 'f32le', '-');
  const b = run(FF, args);
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
};
const A = pcm(video);
const B = pcm(vo, fromS, toS);
const n = Math.min(A.length, B.length, 8000 * 240);
let best = -Infinity, lag = 0;
for (let l = -400; l <= 400; l++) {
  let s = 0;
  for (let i = 4000; i < n - 4000; i += 5) s += A[i + l] * B[i];
  if (s > best) {
    best = s;
    lag = l;
  }
}
let num = 0, da = 0, db = 0;
for (let i = 0; i < n; i++) {
  num += A[i] * B[i];
  da += A[i] * A[i];
  db += B[i] * B[i];
}
const corr = num / Math.sqrt(da * db);
log(`- Voiceover alignment: offset ${((lag / 8000) * 1000).toFixed(1)} ms, correlation ${corr.toFixed(3)} (voice present and in sync if offset ≈ 0 ms and correlation high)`);
if (Math.abs(lag) > 8) warn.push(`Voiceover offset ${((lag / 8000) * 1000).toFixed(1)} ms`);

// contact sheets: 1 frame / 3 s, 6x5 tiles per sheet (90 s per sheet), timestamps burned in
const font = ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'].find((f) => fs.existsSync(f));
const off = fromS ? Number(fromS) : 0;
const sheets = Math.ceil(dur / 90);
// exact frames: every 180th frame (= 3 s at 60 fps), labelled with the real video second
for (let k = 0; k < sheets; k++) {
  const base = off + k * 90;
  const label = font ? `,drawtext=fontfile=${font}:text='%{eif\\:n*3+${base}\\:d}s':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6` : '';
  spawnSync(FF, ['-v', 'error', '-y', '-ss', String(k * 90), '-t', '90', '-i', video, '-vf', `select='not(mod(n\\,180))',scale=320:-1${label},tile=6x5:padding=4:color=gray`, '-fps_mode', 'vfr', '-frames:v', '1', path.join(qaDir, `sheet-${String(k + 1).padStart(2, '0')}.png`)]);
}
log(`- Contact sheets: ${sheets} (sheet-NN.png, one tile every 3 s${off ? `, times relative to ${off}s` : ''})`);
spawnSync(FF, ['-v', 'error', '-y', '-i', video, '-filter_complex', 'showwavespic=s=1920x260:split_channels=1:colors=0x2B2420|0x8B2E1F', '-frames:v', '1', path.join(qaDir, 'waveform.png')]);

const report = [`# QA report — ${path.basename(video)}`, '', `**Result: ${warn.length ? `${warn.length} warning(s)` : 'all automated checks passed'}**`, '', ...warn.map((w) => `- ⚠ ${w}`), warn.length ? '' : '', '## Measurements', ...lines, ''].join('\n');
fs.writeFileSync(path.join(qaDir, 'qa_report.md'), report);
console.log(report);
