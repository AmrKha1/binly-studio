// VO PREP (owner 2026-11-08): the owner records the voiceover in PARTS. This makes ONE clean voiceover from them:
//   1) every part levelled to the SAME loudness (ITU-R BS.1770 integrated LUFS, gated — the LUFS meter standard), so the
//      voice never jumps up/down between parts (a plain gain per part: no compression, no EQ — the voice keeps its life)
//   2) parts joined in number order ("1 Arabic.wav", "2.wav" … "10.wav"), 5 ms fades at every join (no clicks)
//   3) SILENCE TRIM (owner 2026-11-08): inside each part every pause longer than 0.25 s → 0.19 s (keeps its first and last
//      half of natural room tone, 10 ms crossfade; breaths stay); each part's silent head/tail is removed and the parts are
//      joined with EXACTLY 0.35 s made of their own room tone (no digital silence). Start 0.10 s, end 0.40 s.
//   The report (<out>.prep.json) lists every part, join and cut position → tools/vo-check.mjs verifies them.
// The result is the master clock of the video (timing, captions, render). The final MIX is mastered separately in the
// cloud render to −14 LUFS / −1 dBTP (tools/cloud/assemble.mjs).
//   node tools/vo-prep.mjs <folder | files…> --out videos/<slug>/voiceover.wav [--target -20] [--max-pause 0.25 --keep 0.19 --gap 0.35]
// Prints a report (per-part loudness + gain, pauses trimmed, seconds saved) and writes <out>.json next to the output.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, args} from './lib/render.mjs';
import {FFMPEG} from './lib/sys.mjs';

const a = args();
const SR = 48000;
const TARGET = Number(a.target ?? -20); // LUFS (mono measure) — headroom for the final −14 LUFS master
const MAX_PAUSE = Number(a['max-pause'] ?? 0.25);
const KEEP = Number(a.keep ?? 0.19); // owner 2026-11-08 (listened to samples): pauses > 0.25 s → 0.19 s
const JOIN_GAP = Number(a.gap ?? 0.35); // owner 2026-11-08: exactly this much (room tone) between two parts
const AUDIO = /\.(wav|mp3|m4a|flac|aac|ogg|opus)$/i;

// ---------------------------------------------------------------- inputs (numeric order by the leading number)
let inputs = a._.flatMap((p) => (fs.existsSync(p) && fs.statSync(p).isDirectory() ? fs.readdirSync(p).filter((f) => AUDIO.test(f)).map((f) => path.join(p, f)) : [p]));
const num = (f) => {
  const m = path.basename(f).match(/\d+/);
  return m ? Number(m[0]) : 1e9;
};
inputs = inputs.filter((f) => AUDIO.test(f)).sort((x, y) => num(x) - num(y) || x.localeCompare(y));
if (!inputs.length || !a.out) {
  console.log('usage: node tools/vo-prep.mjs <folder | files…> --out <voiceover.wav> [--target -20] [--max-pause 0.25 --keep 0.19 --gap 0.35]');
  process.exit(1);
}

// ---------------------------------------------------------------- decode (bundled ffmpeg → 48 kHz mono 16-bit wav)
const tmpDir = path.join(ROOT, '.cache', 'vo-prep');
fs.mkdirSync(tmpDir, {recursive: true});
const readWav = (file) => {
  const buf = fs.readFileSync(file);
  let p = 12, bits = 16, data = null;
  while (p < buf.length - 8) {
    const id = buf.toString('ascii', p, p + 4), size = buf.readUInt32LE(p + 4);
    if (id === 'fmt ') bits = buf.readUInt16LE(p + 22);
    if (id === 'data') {
      data = buf.subarray(p + 8, p + 8 + size);
      break;
    }
    p += 8 + size + (size & 1);
  }
  const n = Math.floor(data.length / (bits / 8));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = bits === 24 ? ((data[i * 3] | (data[i * 3 + 1] << 8) | (data[i * 3 + 2] << 16)) << 8 >> 8) / 8388608 : data.readInt16LE(i * 2) / 32768;
  return out;
};
const decode = (file, i) => {
  const t = path.join(tmpDir, `part-${i}.wav`);
  const r = spawnSync(FFMPEG, ['-hide_banner', '-v', 'error', '-y', '-i', file, '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s24le', t]);
  if (r.status !== 0) throw new Error(`cannot decode ${file}: ${String(r.stderr).slice(-300)}`);
  const s = readWav(t);
  fs.rmSync(t);
  return s;
};

// ---------------------------------------------------------------- loudness: ITU-R BS.1770-4 (K-weighting, 400 ms blocks, gates −70 / −10)
const biquad = (x, b, aa) => {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b[0] * x[i] + b[1] * x1 + b[2] * x2 - aa[1] * y1 - aa[2] * y2;
    x2 = x1, x1 = x[i], y2 = y1, y1 = v, y[i] = v;
  }
  return y;
};
const kWeight = (x) =>
  biquad(biquad(x, [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]), [1, -2, 1], [1, -1.99004745483398, 0.99007225036621]);
export const lufs = (x) => {
  const k = kWeight(x);
  const B = Math.round(0.4 * SR), hop = Math.round(0.1 * SR);
  const z = [];
  for (let s = 0; s + B <= k.length; s += hop) {
    let acc = 0;
    for (let i = s; i < s + B; i++) acc += k[i] * k[i];
    z.push(acc / B);
  }
  const L = (m) => -0.691 + 10 * Math.log10(m + 1e-12);
  const g1 = z.filter((m) => L(m) > -70);
  if (!g1.length) return -70;
  const rel = L(g1.reduce((s, m) => s + m, 0) / g1.length) - 10;
  const g2 = g1.filter((m) => L(m) > rel);
  return L(g2.reduce((s, m) => s + m, 0) / g2.length);
};
const peakDb = (x) => {
  let m = 0;
  for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
  return 20 * Math.log10(m + 1e-12);
};

// ---------------------------------------------------------------- 1) level each part
const report = {target_lufs: TARGET, parts: []};
const parts = inputs.map((f, i) => {
  const s = decode(f, i);
  const l = lufs(s), g = TARGET - l;
  const k = Math.pow(10, g / 20);
  for (let j = 0; j < s.length; j++) s[j] *= k;
  const fade = Math.round(0.005 * SR);
  for (let j = 0; j < fade && j < s.length; j++) {
    s[j] *= j / fade;
    s[s.length - 1 - j] *= j / fade;
  }
  report.parts.push({file: path.basename(f), seconds: +(s.length / SR).toFixed(2), lufs_before: +l.toFixed(1), gain_db: +g.toFixed(1), peak_after_db: +peakDb(s).toFixed(1)});
  return s;
});

// ---------------------------------------------------------------- 2+3) per part: trim inner pauses, cut its silent head/tail
// One silence threshold for the whole voiceover (relative to the speech level of all parts together).
const F = Math.round(0.01 * SR); // 10 ms frames
const xf = Math.round(0.01 * SR); // 10 ms crossfades
const framesDb = (x) => {
  const n = Math.floor(x.length / F), d = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    let acc = 0;
    for (let i = k * F; i < (k + 1) * F; i++) acc += x[i] * x[i];
    d[k] = 10 * Math.log10(acc / F + 1e-12);
  }
  return d;
};
const allDb = Float32Array.from(parts.flatMap((p) => Array.from(framesDb(p)))).sort();
const speech = allDb[Math.floor(allDb.length * 0.7)];
const thr = Math.max(speech - 32, -60);
const keepF = Math.round(KEEP * 100), maxF = Math.round(MAX_PAUSE * 100);
/** Join segments of x with 10 ms crossfades (each fade uses the original continuation — natural room tone, no click). */
const stitch = (x, segs) => {
  const len = segs.reduce((n, [p, q]) => n + (q - p), 0);
  const y = new Float32Array(len), cuts = [];
  let o = 0;
  segs.forEach(([p, q], i) => {
    y.set(x.subarray(p, q), o);
    if (i > 0) {
      cuts.push(o);
      const n = Math.min(xf, q - p, o), prev = x.subarray(segs[i - 1][1], segs[i - 1][1] + n);
      for (let j = 0; j < n; j++) y[o + j] = x[p + j] * (j / n) + (prev[j] ?? 0) * (1 - j / n);
    }
    o += q - p;
  });
  return {y, cuts};
};
/** Room tone of the given length from a quiet region (looped with crossfades if it is short). */
const tone = (src, want) => {
  const y = new Float32Array(want);
  if (!src.length) return y;
  let o = 0;
  while (o < want) {
    const n = Math.min(src.length, want - o);
    for (let j = 0; j < n; j++) {
      const fadeIn = o > 0 && j < xf ? j / xf : 1;
      y[o + j] = src[j] * fadeIn + (o > 0 && j < xf ? y[o + j] * (1 - fadeIn) : 0);
    }
    o += Math.max(1, n - (src.length > 2 * xf ? xf : 0));
  }
  return y;
};
let trimmed = 0, saved = 0;
const bodies = parts.map((x, pi) => {
  const d = framesDb(x), nf = d.length;
  let first = 0, last = nf - 1;
  while (first < nf && d[first] < thr) first++;
  while (last > first && d[last] < thr) last--;
  const head = x.subarray(0, first * F), tail = x.subarray((last + 1) * F); // room tone sources
  // inner pauses
  const segs = [];
  let cursor = first * F;
  for (let k = first; k <= last; ) {
    if (d[k] < thr) {
      let j = k;
      while (j <= last && d[j] < thr) j++;
      const len = j - k;
      if (len > maxF) {
        const h = Math.floor(keepF / 2), t = keepF - h;
        segs.push([cursor, (k + h) * F]);
        cursor = (j - t) * F;
        trimmed++;
        saved += (len - keepF) / 100;
      }
      k = j;
    } else k++;
  }
  segs.push([cursor, (last + 1) * F]);
  const {y, cuts} = stitch(x, segs);
  saved += (head.length + tail.length) / SR;
  return {y, cuts, head, tail, file: report.parts[pi].file};
});

// ---------------------------------------------------------------- 4) assemble: start 0.10 s · part · GAP 0.35 s · part … · end 0.40 s
const START = Math.round(0.1 * SR), GAP = Math.round(JOIN_GAP * SR), END = Math.round(0.4 * SR);
const pieces = [], marks = {parts: [], joins: [], cuts: []};
let o = 0;
const push = (y) => (pieces.push(y), (o += y.length));
push(tone(bodies[0].head.length ? bodies[0].head : bodies[0].tail, START));
bodies.forEach((b, i) => {
  if (i > 0) {
    // the gap = the previous part's own tail room tone, then the next part's own head room tone (crossfaded halves)
    const half = Math.floor(GAP / 2);
    const g = new Float32Array(GAP);
    const prv = tone(bodies[i - 1].tail.length ? bodies[i - 1].tail : bodies[i - 1].head, half + xf);
    const nxt = tone(b.head.length ? b.head : b.tail, GAP - half);
    g.set(prv.subarray(0, half), 0);
    for (let j = 0; j < nxt.length; j++) {
      const w = j < xf ? j / xf : 1; // 10 ms crossfade between the two room tones
      g[half + j] = nxt[j] * w + (j < xf ? prv[half + j] * (1 - w) : 0);
    }
    marks.joins.push({after: bodies[i - 1].file, start: +(o / SR).toFixed(3), end: +((o + GAP) / SR).toFixed(3)});
    push(g);
  }
  marks.parts.push({file: b.file, start: +(o / SR).toFixed(3), end: +((o + b.y.length) / SR).toFixed(3)});
  for (const c of b.cuts) marks.cuts.push(+((o + c) / SR).toFixed(3));
  push(b.y);
});
push(tone(bodies[bodies.length - 1].tail.length ? bodies[bodies.length - 1].tail : bodies[bodies.length - 1].head, END));
const total = parts.reduce((n, x) => n + x.length, 0);
const outLen = o;
const out = new Float32Array(outLen);
o = 0;
for (const p of pieces) {
  out.set(p, o);
  // 5 ms fades at every piece boundary (no clicks between room tone and speech)
  const n = Math.min(Math.round(0.005 * SR), p.length);
  for (let j = 0; j < n; j++) out[o + j] *= j / n, (out[o + p.length - 1 - j] *= j / n);
  o += p.length;
}
// ---------------------------------------------------------------- write 48 kHz mono 24-bit wav
const writeWav = (file, x) => {
  const n = x.length, data = Buffer.alloc(n * 3);
  let clipped = 0;
  for (let i = 0; i < n; i++) {
    let v = x[i];
    if (v > 0.999 || v < -0.999) clipped++, (v = Math.max(-0.999, Math.min(0.999, v)));
    const s = Math.round(v * 8388607);
    data[i * 3] = s & 255, data[i * 3 + 1] = (s >> 8) & 255, data[i * 3 + 2] = (s >> 16) & 255;
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0), h.writeUInt32LE(36 + data.length, 4), h.write('WAVE', 8), h.write('fmt ', 12), h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20), h.writeUInt16LE(1, 22), h.writeUInt32LE(SR, 24), h.writeUInt32LE(SR * 3, 28), h.writeUInt16LE(3, 32), h.writeUInt16LE(24, 34);
  h.write('data', 36), h.writeUInt32LE(data.length, 40);
  fs.mkdirSync(path.dirname(path.resolve(file)), {recursive: true});
  fs.writeFileSync(file, Buffer.concat([h, data]));
  return clipped;
};
const clipped = writeWav(a.out, out);
Object.assign(report, {
  parts_joined: parts.length,
  seconds_before: +(total / SR).toFixed(2),
  seconds_after: +(outLen / SR).toFixed(2),
  pauses_trimmed: trimmed,
  join_gap_s: JOIN_GAP,
  keep_s: KEEP,
  max_pause_s: MAX_PAUSE,
  marks,
  seconds_saved: +((total - outLen) / SR).toFixed(2),
  pause_rule: `> ${MAX_PAUSE} s → ${KEEP} s`,
  silence_threshold_db: +thr.toFixed(1),
  sources: inputs.map((f) => path.resolve(f)),
  lufs_after: +lufs(out).toFixed(1),
  peak_after_db: +peakDb(out).toFixed(1),
  clipped_samples: clipped,
});
fs.writeFileSync(a.out.replace(/\.wav$/i, '') + '.prep.json', JSON.stringify(report, null, 1));
console.log('part                   len s   LUFS before   gain dB   peak after');
for (const p of report.parts) console.log(`${p.file.padEnd(22)} ${String(p.seconds).padStart(6)}   ${String(p.lufs_before).padStart(8)}   ${String(p.gain_db).padStart(7)}   ${String(p.peak_after_db).padStart(7)} dB`);
console.log(`\njoined ${parts.length} parts · ${report.seconds_before} s → ${report.seconds_after} s (${trimmed} pauses > ${MAX_PAUSE} s → ${KEEP} s · parts joined with exactly ${JOIN_GAP} s · ${report.seconds_saved} s saved)`);
console.log(`voiceover: ${report.lufs_after} LUFS, peak ${report.peak_after_db} dBFS${clipped ? `, WARNING ${clipped} clipped samples (lower --target)` : ''} → ${a.out}`);
