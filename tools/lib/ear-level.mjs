// EAR LEVEL — the ONE ruler for sound-effect levels (owner 2026-11-10: "like the reference"): tools/ref-sfx.mjs measured
// the model video with it, tools/audio/make-audio.mjs sets our cues with it, so "18 dB under the voice" means the same
// thing on both sides. 24 kHz mono · 1024-point FFT every 10 ms · 5 bands with ear weights ≈ K-weighting
// (sub <150 ×0.35 · low 150–600 ×1 · mid 600–2500 ×1 · hi 2500–6000 ×1.5 · air >6000 ×1.5).
export const EAR_SR = 24000, EAR_HOP = 240 /* exactly 10 ms: frame k = k/100 s, no drift */, EAR_NF = 1024, EAR_NB = 5;
export const EAR_W = [0.35, 1, 1, 1.5, 1.5];
const win = Float32Array.from({length: EAR_NF}, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / EAR_NF));
const binHz = EAR_SR / EAR_NF;
const bandIdx = Int8Array.from({length: EAR_NF / 2}, (_, i) => { const f = i * binHz; return f < 150 ? 0 : f < 600 ? 1 : f < 2500 ? 2 : f < 6000 ? 3 : 4; });
export const fft = (re, im) => {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let b = n >> 1;
    for (; j & b; b >>= 1) j ^= b;
    j ^= b;
    if (i < j) [re[i], re[j]] = [re[j], re[i]], ([im[i], im[j]] = [im[j], im[i]]);
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len)
      for (let j = 0; j < len / 2; j++) {
        const wr = Math.cos(ang * j), wi = Math.sin(ang * j), h = len / 2;
        const ur = re[i + j], ui = im[i + j], vr = re[i + j + h] * wr - im[i + j + h] * wi, vi = re[i + j + h] * wi + im[i + j + h] * wr;
        re[i + j] = ur + vr, (im[i + j] = ui + vi), (re[i + j + h] = ur - vr), (im[i + j + h] = ui - vi);
      }
  }
};
/** any-rate mono → 22.05 kHz (linear interpolation after a short box low-pass when downsampling) */
export const toEarRate = (x, sr) => {
  if (sr === EAR_SR) return x;
  const r = sr / EAR_SR, n = Math.floor(x.length / r), y = new Float32Array(n), box = Math.max(1, Math.round(r));
  for (let i = 0; i < n; i++) {
    const p = i * r, i0 = Math.floor(p);
    let s = 0;
    for (let k = 0; k < box; k++) s += x[Math.min(x.length - 1, i0 + k)] ?? 0;
    y[i] = s / box;
  }
  return y;
};
/** per-band power every 10 ms (Float32Array n×5) */
export const earBands = (x) => {
  const n = Math.floor(x.length / EAR_HOP), out = new Float32Array(n * EAR_NB), re = new Float32Array(EAR_NF), im = new Float32Array(EAR_NF);
  const off = Math.floor(EAR_HOP / 2) - EAR_NF / 2;
  for (let k = 0; k < n; k++) {
    const p0 = k * EAR_HOP + off;
    for (let i = 0; i < EAR_NF; i++) (re[i] = (x[p0 + i] ?? 0) * win[i]), (im[i] = 0);
    fft(re, im);
    for (let i = 1; i < EAR_NF / 2; i++) out[k * EAR_NB + bandIdx[i]] += (re[i] * re[i] + im[i] * im[i]) / ((EAR_NF * EAR_NF) / 8);
  }
  return out;
};
/** weighted power per 10 ms frame */
export const earPower = (bands) => {
  const n = bands.length / EAR_NB, p = new Float32Array(n);
  for (let k = 0; k < n; k++) for (let b = 0; b < EAR_NB; b++) p[k] += EAR_W[b] * bands[k * EAR_NB + b];
  return p;
};
export const dB = (p) => 10 * Math.log10(p + 1e-14);
/** the narrator's speech level (dB): power mean of his loudest 60 % of 10 ms frames */
export const voiceLevel = (power) => {
  const s = Float32Array.from(power).sort(), top = s.subarray(Math.floor(s.length * 0.4));
  return dB(top.reduce((q, v) => q + v, 0) / Math.max(1, top.length));
};
/** a sound's level (dB): its loudest 10 ms frame */
export const peakLevel = (power) => dB(power.reduce((m, v) => Math.max(m, v), 0));
