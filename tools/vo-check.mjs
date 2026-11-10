// VO CHECK — the voice gate, STEP 1 of every video (owner 2026-11-08): nothing is planned or built until the prepared
// voiceover passes. Re-measures the finished voiceover independently (it does not trust vo-prep's own numbers):
//   LOUDNESS   integrated level on target · every part equal (re-measured inside the voiceover) · peaks · no clipping
//   TRIM       no pause inside a part longer than the rule · joins between parts exactly the gap · every cut sits in
//              silence (never inside a word) · no clicks at cuts/joins · start/end lengths · no dead air
//   RECORDING  clipping/distortion in the ORIGINAL parts · background noise level · mains hum (50/60 Hz) · DC offset ·
//              sentences much quieter (off-mic / mumbled) or much louder (shouted / bumped) than the rest
//   FORMAT     48 kHz mono · length sanity (not over-trimmed)
//   node tools/vo-check.mjs <voiceover.wav>        (reads <voiceover>.prep.json written by vo-prep)
// → prints a PASS / WARN / FAIL table with times to listen to, writes <dir>/vo-check.md, exit 1 on any FAIL.
// WARN = a human should listen (owner decides); FAIL = must be fixed (re-record the part or adjust) before going on.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {FFMPEG} from './lib/sys.mjs';
import {readWav, lufs, framesDb} from './lib/audio.mjs';

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.log('usage: node tools/vo-check.mjs <voiceover.wav>   (needs <voiceover>.prep.json from vo-prep)');
  process.exit(1);
}
const prepFile = file.replace(/\.wav$/i, '') + '.prep.json';
const prep = fs.existsSync(prepFile) ? JSON.parse(fs.readFileSync(prepFile, 'utf8')) : null;
const {x, sr, channels} = readWav(file);
const mm = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`;
const rows = []; // [status, check, detail]
const add = (st, check, detail) => rows.push([st, check, detail]);

// ---------------------------------------------------------------- FORMAT
add(sr === 48000 && channels === 1 ? 'PASS' : 'WARN', 'Format', `${sr} Hz, ${channels === 1 ? 'mono' : channels + ' channels'}, ${(x.length / sr / 60).toFixed(2)} min`);
if (!prep) add('FAIL', 'Prep report', `${path.basename(prepFile)} missing — run tools/vo-prep.mjs first`);

// ---------------------------------------------------------------- LOUDNESS
const target = prep?.target_lufs ?? -20;
const L = lufs(x, sr);
add(Math.abs(L - target) <= 0.5 ? 'PASS' : 'FAIL', 'Loudness (whole)', `${L.toFixed(1)} LUFS (target ${target} ±0.5)`);
if (prep?.marks?.parts?.length) {
  const per = prep.marks.parts.map((p) => ({file: p.file, l: lufs(x.subarray(Math.round(p.start * sr), Math.round(p.end * sr)), sr)}));
  const lo = Math.min(...per.map((p) => p.l)), hi = Math.max(...per.map((p) => p.l));
  const spread = hi - lo;
  add(spread <= 1.0 ? 'PASS' : spread <= 2 ? 'WARN' : 'FAIL', 'Loudness (parts equal)', `spread ${spread.toFixed(1)} LU across ${per.length} parts (${lo.toFixed(1)} … ${hi.toFixed(1)}; ≤ 1.0 = no audible jump)` + (spread > 1 ? ` — check ${per.filter((p) => Math.abs(p.l - target) > 0.7).map((p) => p.file).join(', ')}` : ''));
}
let peak = 0, clipped = 0, dc = 0;
for (let i = 0; i < x.length; i++) {
  const v = Math.abs(x[i]);
  if (v > peak) peak = v;
  if (v >= 0.998) clipped++;
  dc += x[i];
}
dc /= x.length;
const peakDb = 20 * Math.log10(peak + 1e-12);
add(clipped ? 'FAIL' : peakDb <= -1 ? 'PASS' : 'WARN', 'Peaks / clipping', `peak ${peakDb.toFixed(1)} dBFS, ${clipped} clipped samples (headroom for the −14 LUFS / −1 dBTP master)`);
add(Math.abs(dc) < 0.003 ? 'PASS' : 'WARN', 'DC offset', `${(dc * 100).toFixed(3)} % (mic/interface offset; > 0.3 % can thump at cuts)`);

// ---------------------------------------------------------------- TRIM
const db = framesDb(x, sr, 0.01);
const thr = prep?.silence_threshold_db ?? -50;
const quiet = (k) => db[k] < thr;
const joins = prep?.marks?.joins ?? [];
const inJoin = (t) => joins.some((j) => t >= j.start - 0.03 && t <= j.end + 0.03);
const maxPause = (prep?.max_pause_s ?? 0.23) + 0.005; // owner 2026-11-10: strict — nothing longer than the rule (0.005 = float rounding of 10 ms frames)
const pauses = [];
for (let k = 0; k < db.length; ) {
  if (quiet(k)) {
    let j = k;
    while (j < db.length && quiet(j)) j++;
    pauses.push({s: k / 100, e: j / 100, len: (j - k) / 100});
    k = j;
  } else k++;
}
const inner = pauses.filter((p) => p.s > 0.05 && p.e < db.length / 100 - 0.05 && !inJoin((p.s + p.e) / 2));
const tooLong = inner.filter((p) => p.len > maxPause);
const hist = (lo, hi) => inner.filter((p) => p.len >= lo && p.len < hi).length;
// the Studio's rule (owner 2026-11-10, chosen by ear): every pause longer than 0.23 s becomes exactly 0.19 s
const RULE = {max: 0.23, keep: 0.19};
if (prep) {
  const ok = Math.abs(prep.max_pause_s - RULE.max) < 1e-6 && Math.abs(prep.keep_s - RULE.keep) < 1e-6;
  add(ok ? 'PASS' : 'FAIL', 'Trim rule', `prepared with pauses > ${prep.max_pause_s} s → ${prep.keep_s} s` + (ok ? ' = the Studio rule' : ` — the Studio rule is > ${RULE.max} s → ${RULE.keep} s: prepare again with the defaults`));
}
// no pause left longer than the rule (30 ms tolerance = 10 ms frames + crossfades) — a single one is a FAIL
add(tooLong.length ? 'FAIL' : 'PASS', 'No long pause left',
  `${inner.length} pauses · longest ${Math.max(0, ...inner.map((p) => p.len)).toFixed(2)} s · over ${(maxPause - 0.005).toFixed(2)} s: ${tooLong.length}` + (tooLong.length ? ` → listen: ${tooLong.slice(0, 6).map((p) => `${mm(p.s)} (${p.len.toFixed(2)} s)`).join(', ')}` : ''));
// every trimmed pause really is the kept length (re-measured around each cut)
{
  const cutsAll = prep?.marks?.cuts ?? [], keep = prep?.keep_s ?? RULE.keep;
  const runs = cutsAll.map((c) => {
    let k0 = Math.round(c * 100), k1 = k0;
    if (!quiet(k0)) return {c, len: 0};
    while (k0 > 0 && quiet(k0 - 1)) k0--;
    while (k1 < db.length - 1 && quiet(k1 + 1)) k1++;
    return {c, len: (k1 - k0 + 1) / 100};
  });
  const hiR = prep?.max_pause_s ?? RULE.max, lo = keep - 0.01; // owner 2026-11-10: every trimmed pause lands in 0.19–0.23 s (−0.01 = one 10 ms frame)
  const off = runs.filter((r) => r.len < lo - 0.001 || r.len > hiR + 0.005);
  const lens = runs.map((r) => r.len).sort((p, q) => p - q), med = lens[Math.floor(lens.length / 2)] ?? 0;
  if (runs.length) add(off.length ? 'FAIL' : 'PASS', `Trimmed pauses in ${keep.toFixed(2)}–${hiR.toFixed(2)} s`,
    `${runs.length} trimmed pauses · median ${med.toFixed(2)} s · ${runs.length - off.length}/${runs.length} inside the range · shortest ${lens[0]?.toFixed(2)} s · longest ${lens[lens.length - 1]?.toFixed(2)} s` + (off.length ? ` → listen: ${off.slice(0, 6).map((r) => `${mm(r.c)} (${r.len.toFixed(2)} s)`).join(', ')}` : ''));
}
add('PASS', 'Pause spread', `0.08–0.15 s: ${hist(0.08, 0.15)} · 0.15–0.19 s: ${hist(0.15, 0.185)} · 0.19–0.23 s: ${hist(0.185, 0.235)} · over 0.23 s: ${hist(0.235, 99)} (pauses ≤ 0.23 s are left exactly as spoken)`);
const gap = prep?.join_gap_s ?? 0.35;
if (joins.length) {
  const bad = joins.filter((j) => Math.abs(j.end - j.start - gap) > 0.012);
  const loud = joins.filter((j) => {
    for (let k = Math.ceil(j.start * 100) + 1; k < Math.floor(j.end * 100) - 1; k++) if (!quiet(k)) return true;
    return false;
  });
  const dead = joins.filter((j) => {
    const a = Math.round(j.start * sr), b = Math.round(j.end * sr);
    let m = 0;
    for (let i = a; i < b; i++) m = Math.max(m, Math.abs(x[i]));
    return m < 1e-5;
  });
  add(bad.length || loud.length ? 'FAIL' : dead.length ? 'WARN' : 'PASS', 'Joins between parts',
    `${joins.length} joins · each ${gap} s ±0.01: ${joins.length - bad.length}/${joins.length} · silent: ${joins.length - loud.length}/${joins.length}` + (dead.length ? ` · ${dead.length} are digital silence (dead air)` : ' · filled with room tone') + (bad.length || loud.length ? ` → check ${[...bad, ...loud].map((j) => mm(j.start)).join(', ')}` : ''));
}
// every cut must sit in silence (never inside a word)
const cuts = prep?.marks?.cuts ?? [];
if (cuts.length) {
  const inWord = cuts.filter((c) => {
    const k = Math.round(c * 100);
    return [k - 2, k - 1, k, k + 1].some((q) => q >= 0 && q < db.length && !quiet(q));
  });
  add(inWord.length ? (inWord.length > 3 ? 'FAIL' : 'WARN') : 'PASS', 'Cuts in silence only', `${cuts.length} cuts · ${cuts.length - inWord.length} cleanly inside pauses` + (inWord.length ? ` → listen (a word may be clipped): ${inWord.slice(0, 6).map(mm).join(', ')}` : ''));
}
// clicks at every edit point (a sudden sample jump much bigger than the local signal)
const edits = [...cuts, ...joins.flatMap((j) => [j.start, j.end])];
const clicks = edits.filter((t) => {
  const c = Math.round(t * sr), w = Math.round(0.004 * sr);
  let rms = 0, jump = 0;
  for (let i = c - w; i < c + w; i++) if (i > 0 && i < x.length) rms += x[i] * x[i], (jump = Math.max(jump, Math.abs(x[i] - x[i - 1])));
  rms = Math.sqrt(rms / (2 * w));
  return jump > 0.01 && jump > 10 * rms;
});
add(clicks.length ? 'WARN' : 'PASS', 'Clicks at edits', `${edits.length} edit points checked · ${clicks.length} possible clicks` + (clicks.length ? ` → listen: ${clicks.slice(0, 6).map(mm).join(', ')}` : ''));
// clicks / pops anywhere (mouth clicks, cable crackle, digital glitches): a sample jump far above the signal around it
{
  const w = Math.round(0.005 * sr), found = []; // ±5 ms = the 10 ms of sound around the sample (both sides)
  const cum = new Float64Array(x.length + 1);
  for (let i = 0; i < x.length; i++) cum[i + 1] = cum[i] + x[i] * x[i];
  for (let i = 1; i < x.length; i++) {
    const jump = Math.abs(x[i] - x[i - 1]);
    if (jump > 0.15) {
      const a0 = Math.max(0, i - w), b0 = Math.min(x.length, i + w);
      const rms = Math.sqrt((cum[b0] - cum[a0]) / (b0 - a0));
      // a real click stands ≥ 12× above the sound around it; sharp consonants (ق ك ت) are only ~5× → not flagged
      if (jump > 12 * rms + 0.05 && (!found.length || i / sr - found[found.length - 1] > 0.5)) found.push(i / sr);
    }
  }
  add(found.length ? (found.length > 10 ? 'FAIL' : 'WARN') : 'PASS', 'Clicks / pops anywhere', found.length ? `${found.length} sudden spikes → listen: ${found.slice(0, 8).map(mm).join(', ')}` : 'no sudden spikes in the whole voiceover');
}
const lead = pauses[0]?.s === 0 ? pauses[0].len : 0, trail = pauses.length && pauses[pauses.length - 1].e >= db.length / 100 - 0.02 ? pauses[pauses.length - 1].len : 0;
add(lead <= 0.2 && trail <= 0.5 ? 'PASS' : 'WARN', 'Start / end', `starts after ${lead.toFixed(2)} s, ends ${trail.toFixed(2)} s after the last word`);
if (prep) {
  const cut = (prep.seconds_before - prep.seconds_after) / prep.seconds_before;
  add(cut <= 0.12 ? 'PASS' : 'WARN', 'Not over-trimmed', `${prep.seconds_before} s → ${prep.seconds_after} s (−${(cut * 100).toFixed(1)} %; > 12 % would mean breathless pacing)`);
}

// ---------------------------------------------------------------- RECORDING quality
// background noise = the room tone level in pauses
const qdb = pauses.filter((p) => p.len >= 0.08).flatMap((p) => Array.from(db.subarray(Math.round(p.s * 100) + 1, Math.round(p.e * 100) - 1)));
const floor = qdb.length ? qdb.sort((p, q) => p - q)[Math.floor(qdb.length / 2)] : -90;
const speechDb = Float32Array.from(db).sort()[Math.floor(db.length * 0.7)];
add(floor < -60 ? 'PASS' : floor < -50 ? 'WARN' : 'FAIL', 'Background noise', `room tone ${floor.toFixed(1)} dBFS · ${(speechDb - floor).toFixed(0)} dB below the speech (≥ 40 dB = clean; < 30 dB = noisy room/fan)`);
// mains hum: energy at 50/100 Hz or 60/120 Hz in the pauses vs neighbouring frequencies (Goertzel)
const goertzel = (seg, f) => {
  const w = (2 * Math.PI * f) / sr, c = 2 * Math.cos(w);
  let s1 = 0, s2 = 0;
  for (let i = 0; i < seg.length; i++) {
    const s0 = seg[i] + c * s1 - s2;
    s2 = s1, s1 = s0;
  }
  return s1 * s1 + s2 * s2 - c * s1 * s2;
};
const longQuiet = pauses.filter((p) => p.len >= 0.15).slice(0, 40);
if (longQuiet.length) {
  const hum = (f) => longQuiet.reduce((acc, p) => {
    const seg = x.subarray(Math.round(p.s * sr) + 480, Math.round(p.e * sr) - 480);
    const on = goertzel(seg, f), off = (goertzel(seg, f * 0.8) + goertzel(seg, f * 1.25)) / 2;
    return acc + 10 * Math.log10((on + 1e-20) / (off + 1e-20));
  }, 0) / longQuiet.length;
  const h50 = Math.max(hum(50), hum(100)), h60 = Math.max(hum(60), hum(120));
  const h = Math.max(h50, h60);
  add(h < 10 ? 'PASS' : h < 18 ? 'WARN' : 'FAIL', 'Mains hum', `${h50 >= h60 ? '50/100' : '60/120'} Hz stands ${h.toFixed(0)} dB above its neighbours in the pauses (< 10 dB = none audible)`);
}
// clipping / distortion in the ORIGINAL recordings (flat tops: ≥ 3 samples in a row at full scale)
if (prep?.sources?.length) {
  const bad = [];
  for (const src of prep.sources) {
    if (!fs.existsSync(src)) continue;
    const tmp = path.join(path.dirname(file), '.vocheck-src.wav');
    spawnSync(FFMPEG, ['-hide_banner', '-v', 'error', '-y', '-i', src, '-ac', '1', '-c:a', 'pcm_s24le', tmp]);
    if (!fs.existsSync(tmp)) continue;
    const s = readWav(tmp).x;
    fs.rmSync(tmp);
    let runs = 0, first = -1;
    for (let i = 2; i < s.length; i++)
      if (Math.abs(s[i]) > 0.985 && Math.abs(s[i - 1]) > 0.985 && Math.abs(s[i - 2]) > 0.985) {
        runs++;
        if (first < 0) first = i / 44100;
        i += 20;
      }
    if (runs) bad.push(`${path.basename(src)} ×${runs}`);
  }
  add(bad.length ? (bad.length > 2 ? 'FAIL' : 'WARN') : 'PASS', 'Recording clipping', bad.length ? `flat-topped (distorted) peaks in: ${bad.join(', ')} — re-record if you can hear it` : `${prep.sources.length} original parts checked · no distortion`);
}
// sentences much quieter / louder than the rest (3 s short-term loudness on speech)
{
  const win = 3, hop = 1, st = [];
  for (let t = 0; t + win <= x.length / sr; t += hop) {
    const seg = x.subarray(Math.round(t * sr), Math.round((t + win) * sr));
    const k0 = Math.round(t * 100), k1 = k0 + win * 100;
    let speechFrames = 0;
    for (let k = k0; k < k1 && k < db.length; k++) if (!quiet(k)) speechFrames++;
    if (speechFrames > win * 100 * 0.6) st.push({t, l: lufs(seg, sr, true)});
  }
  const med = st.map((s) => s.l).sort((p, q) => p - q)[Math.floor(st.length / 2)];
  const low = st.filter((s) => s.l < med - 6), high = st.filter((s) => s.l > med + 5);
  const merge = (arr) => arr.filter((s, i) => i === 0 || s.t - arr[i - 1].t > 2).map((s) => mm(s.t));
  add(low.length || high.length ? 'WARN' : 'PASS', 'Even delivery', `3-s loudness median ${med?.toFixed(1)} LUFS` + (low.length ? ` · much quieter (off-mic / trailing off): ${merge(low).slice(0, 6).join(', ')}` : '') + (high.length ? ` · much louder (shout / bump): ${merge(high).slice(0, 6).join(', ')}` : '') + (!low.length && !high.length ? ' · no sentence far quieter or louder than the rest' : ''));
}

// ---------------------------------------------------------------- report
const fails = rows.filter((r) => r[0] === 'FAIL').length, warns = rows.filter((r) => r[0] === 'WARN').length;
const verdict = fails ? `FAIL — ${fails} problem(s) must be fixed before the video goes on` : warns ? `PASS with ${warns} warning(s) — listen to the times listed, then the owner decides` : 'PASS — the voiceover is clean; the video can go on';
const md = [`# Voice check — ${path.basename(file)}`, '', `**${verdict}**`, '', '| | check | result |', '|---|---|---|', ...rows.map(([s, c, d]) => `| ${s === 'PASS' ? '✅' : s === 'WARN' ? '⚠️' : '❌'} ${s} | ${c} | ${d} |`), ''].join('\n');
fs.writeFileSync(path.join(path.dirname(file), 'vo-check.md'), md);
fs.writeFileSync(path.join(path.dirname(file), 'vo-check.json'), JSON.stringify({file: path.basename(file), verdict: fails ? 'FAIL' : warns ? 'WARN' : 'PASS', fails: rows.filter((r) => r[0] === 'FAIL').map((r) => r[1]), warnings: rows.filter((r) => r[0] === 'WARN').map((r) => r[1]), rule: prep ? `> ${prep.max_pause_s} s → ${prep.keep_s} s` : null, checked: new Date().toISOString()}, null, 1));
for (const [s, c, d] of rows) console.log(`${s.padEnd(4)}  ${c.padEnd(24)} ${d}`);
console.log(`\n${verdict}\n→ ${path.join(path.dirname(file), 'vo-check.md')}`);
process.exit(fails ? 1 : warns ? 2 : 0); // 0 = clean PASS · 2 = PASS with warnings (owner listens) · 1 = FAIL
