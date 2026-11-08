// Small audio helpers shared by the voice tools (vo-check): WAV reading, BS.1770 loudness, frame levels.
import fs from 'node:fs';

/** PCM 16/24-bit WAV → {x: Float32Array (mono mix), sr, channels}. */
export const readWav = (file) => {
  const buf = fs.readFileSync(file);
  let p = 12, bits = 16, sr = 48000, ch = 1, data = null;
  while (p < buf.length - 8) {
    const id = buf.toString('ascii', p, p + 4), size = buf.readUInt32LE(p + 4);
    if (id === 'fmt ') ch = buf.readUInt16LE(p + 10), (sr = buf.readUInt32LE(p + 12)), (bits = buf.readUInt16LE(p + 22));
    if (id === 'data') {
      data = buf.subarray(p + 8, p + 8 + size);
      break;
    }
    p += 8 + size + (size & 1);
  }
  const bps = bits / 8, n = Math.floor(data.length / bps / ch);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let acc = 0;
    for (let c = 0; c < ch; c++) {
      const o = (i * ch + c) * bps;
      acc += bits === 24 ? ((data[o] | (data[o + 1] << 8) | (data[o + 2] << 16)) << 8 >> 8) / 8388608 : data.readInt16LE(o) / 32768;
    }
    x[i] = acc / ch;
  }
  return {x, sr, channels: ch};
};

const biquad = (x, b, a) => {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
    x2 = x1, x1 = x[i], y2 = y1, y1 = v, y[i] = v;
  }
  return y;
};
/** ITU-R BS.1770-4 K-weighting coefficients for 48 kHz (other rates: close enough for checks). */
const K1 = [[1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]];
const K2 = [[1, -2, 1], [1, -1.99004745483398, 0.99007225036621]];
/** Integrated loudness (LUFS, mono). ungated = plain K-weighted level (for short windows). */
export const lufs = (x, sr = 48000, ungated = false) => {
  const k = biquad(biquad(x, K1[0], K1[1]), K2[0], K2[1]);
  const Lk = (m) => -0.691 + 10 * Math.log10(m + 1e-12);
  if (ungated) {
    let acc = 0;
    for (let i = 0; i < k.length; i++) acc += k[i] * k[i];
    return Lk(acc / Math.max(1, k.length));
  }
  const B = Math.round(0.4 * sr), hop = Math.round(0.1 * sr), z = [];
  for (let s = 0; s + B <= k.length; s += hop) {
    let acc = 0;
    for (let i = s; i < s + B; i++) acc += k[i] * k[i];
    z.push(acc / B);
  }
  const g1 = z.filter((m) => Lk(m) > -70);
  if (!g1.length) return -70;
  const rel = Lk(g1.reduce((s, m) => s + m, 0) / g1.length) - 10;
  const g2 = g1.filter((m) => Lk(m) > rel);
  return Lk(g2.reduce((s, m) => s + m, 0) / g2.length);
};
/** Level of every frame (dBFS RMS), frame = seconds. */
export const framesDb = (x, sr, frame = 0.01) => {
  const F = Math.round(frame * sr), n = Math.floor(x.length / F), d = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    let acc = 0;
    for (let i = k * F; i < (k + 1) * F; i++) acc += x[i] * x[i];
    d[k] = 10 * Math.log10(acc / F + 1e-12);
  }
  return d;
};
