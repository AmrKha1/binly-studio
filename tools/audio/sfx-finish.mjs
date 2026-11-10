// REFERENCE FINISH for a new real sound (owner 2026-11-10: the raw CC0 files sounded "harsh for the ears").
// Measured against the reference's own effects (references/universe-claude/SOUND.md §4): they fade in softly
// (75–600 ms, never a click), their top is rounded (little above 10 kHz, no 3–4 kHz bite), and they ring out in a room
// (0.6–1 s tail). Raw library files are dry, instant and bright. This tool gives any file the reference's finish:
//   node tools/audio/sfx-finish.mjs <in> <out.flac> --type shimmer|ding|riser|hit [--from a --to b]
// shimmer/ding: trimmed from the first sound (max length per type) · riser: cut so it ENDS on its peak (the mixer lands
// a riser's end on the cue) · then tone (low-pass, high shelf, −4 dB at 3.5 kHz) + soft bloom + room tail. Measure the
// result with the reference's ruler before installing it into library/sfx/<kind>.flac (see docs/TOOLS.md).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const argv = process.argv.slice(2), a = {}, pos = [];
for (let i = 0; i < argv.length; i++) argv[i].startsWith('--') ? (a[argv[i].slice(2)] = argv[++i]) : pos.push(argv[i]);
const [inp, out] = pos;
const TYPES = {
  shimmer: {max: 0.6, bloom: 0.12, wet: 1.2, top: 15000, shelf: -2, hp: 1800}, // airy like the reference (air share ≈ 0.6), no low knock
  ding: {max: 0.65, bloom: 0.12, wet: 1.4, top: 8000, shelf: -7},
  riser: {riser: 1.8, bloom: 0, wet: 0, top: 11000, shelf: -4}, // builds and stops dry into the hit (a tail would make it a falling whoosh)
  hit: {max: 1.2, bloom: 0, wet: 0.6, top: 12000, shelf: -3},
};
const P = TYPES[a.type];
if (!inp || !out || !P) {
  console.log('usage: node tools/audio/sfx-finish.mjs <in> <out.flac> --type ' + Object.keys(TYPES).join('|') + ' [--from a --to b]');
  process.exit(1);
}
const FF = process.env.FFMPEG ?? 'ffmpeg', SR = 48000;
const dec = (f) => {
  const r = spawnSync(FF, ['-v', 'error', '-i', f, '-ac', '2', '-ar', String(SR), '-f', 'f32le', '-'], {maxBuffer: 1 << 28});
  if (r.status) throw new Error(`ffmpeg could not decode ${f}`);
  return Float32Array.from(new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4));
};
// loudness every 10 ms over a 50 ms window
const x = dec(inp), hop = SR / 100, n = Math.floor(x.length / 2 / hop), p = new Float32Array(n), e = new Float32Array(n);
for (let k = 0; k < n; k++) for (let i = k * hop; i < (k + 1) * hop; i++) p[k] += x[2 * i] ** 2 + x[2 * i + 1] ** 2;
for (let k = 0; k < n; k++) for (let j = k; j < Math.min(n, k + 5); j++) e[k] += p[j];
const mx = Math.max(...e), len = x.length / 2 / SR;
const first = Math.max(0, e.findIndex((v) => v > mx * 1e-4) / 100 - 0.005);
let from, to;
if (a.from != null) (from = +a.from), (to = +(a.to ?? len));
else if (P.riser) (to = Math.min(len, e.indexOf(mx) / 100 + 0.05)), (from = Math.max(first, to - P.riser));
else (from = first), (to = Math.min(len, first + P.max));
const fout = P.riser ? 0.03 : Math.min(0.25, (to - from) * 0.4), fin = P.riser ? 0.35 : 0.004;
// the room: stereo noise, 12 ms pre-delay, ~1.7 s decay, darker with time (same energy), deterministic
const ir = path.join(os.tmpdir(), `binly-room-${process.pid}.wav`);
{
  const L = Math.round(SR * 2.2), pre = Math.round(SR * 0.012), l = new Float32Array(L), r = new Float32Array(L);
  let s = 12345, yl = 0, yr = 0;
  const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296) * 2 - 1;
  for (let i = pre; i < L; i++) {
    const t = (i - pre) / SR, c = Math.min(0.85, 0.35 + t * 0.9), g = Math.exp((-6.9 * t) / 1.7) * Math.sqrt((1 + c) / (1 - c));
    yl = yl * c + rnd() * (1 - c); yr = yr * c + rnd() * (1 - c);
    l[i] = yl * g; r[i] = yr * g;
  }
  let en = 0; for (let i = 0; i < L; i++) en += l[i] ** 2; const k = 1 / Math.sqrt(en);
  const b = Buffer.alloc(44 + L * 8);
  b.write('RIFF', 0); b.writeUInt32LE(36 + L * 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(3, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 8, 28); b.writeUInt16LE(8, 32); b.writeUInt16LE(32, 34); b.write('data', 36); b.writeUInt32LE(L * 8, 40);
  for (let i = 0; i < L; i++) b.writeFloatLE(l[i] * k, 44 + i * 8), b.writeFloatLE(r[i] * k, 48 + i * 8);
  fs.writeFileSync(ir, b);
}
const trim = `atrim=${from.toFixed(3)}:${to.toFixed(3)},asetpts=N/SR/TB,afade=t=in:d=${fin},afade=t=out:st=${(to - from - fout).toFixed(3)}:d=${fout.toFixed(3)}`;
const tone = `${P.hp ? `highpass=f=${P.hp}:p=2,highpass=f=${P.hp}:p=2,` : ''}lowpass=f=${P.top}:p=2,lowpass=f=${P.top}:p=2,highshelf=f=6500:g=${P.shelf},equalizer=f=3500:t=q:w=1.2:g=-4`;
const fc = `[0:a]aformat=channel_layouts=stereo,aresample=${SR},${trim},${tone}${P.bloom ? `,afade=t=in:curve=qsin:d=${P.bloom}` : ''},apad=pad_dur=2[d];` +
  `[d]asplit[a][b];[b][1:a]afir=dry=1:wet=1:irnorm=-1[w];[a][w]amix=inputs=2:weights='1 ${P.wet}':normalize=0,` +
  `areverse,silenceremove=start_periods=1:start_threshold=-66dB,areverse`;
const r = spawnSync(FF, ['-v', 'error', '-y', '-i', inp, '-i', ir, '-filter_complex', fc, '-ar', String(SR), '-c:a', 'flac', '-sample_fmt', 's32', out], {encoding: 'utf8'});
fs.rmSync(ir, {force: true});
if (r.status) { console.log(r.stderr); process.exit(1); }
console.log(`finished (${a.type}): ${path.basename(inp)} ${from.toFixed(2)}–${to.toFixed(2)} s → ${out}`);
