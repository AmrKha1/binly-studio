// SOUND QA — the render's check that our sound effects sit like the reference's (owner 2026-11-10: "the most
// professional feeling under the voice"). Measures OUR finished SFX stem against the voiceover with the same ruler that
// measured the reference (tools/ref-sfx.mjs --cues), on full-range speakers AND through a phone speaker, plus density.
//   node tools/audio/sound-qa.mjs <voiceover> <sfx.wav> <cues.json> <outDir> [--words words.json]
// Writes <outDir>/sound-qa.md + sound-qa.json {warnings, lines}; tools/cloud/qa.mjs folds it into the QA report.
// Reading note: in a dense mix a quiet cue can pick up a louder neighbour, so levels are judged per kind (median) with a
// ±2 dB tolerance; the exact calibration is done in isolation (SOUND.md §6).
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {REF_TARGET, PHONE_CHANGE, PHONE_FILTER, AUDIBLE_DB, targetUnder, aimUnder, PHONE_HEADROOM} from '../lib/sound-ref.mjs';
import {densityReport} from '../lib/sfx-density.mjs';

const argv = process.argv.slice(2), opt = {}, pos = [];
for (let i = 0; i < argv.length; i++) argv[i].startsWith('--') ? (opt[argv[i].slice(2)] = argv[++i]) : pos.push(argv[i]);
const [vo, fx, cuesFile, out] = pos;
if (!vo || !fx || !cuesFile || !out) {
  console.log('usage: node tools/audio/sound-qa.mjs <voiceover> <sfx.wav> <cues.json> <outDir> [--words words.json]');
  process.exit(1);
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FF = process.env.FFMPEG ?? 'ffmpeg';
fs.mkdirSync(out, {recursive: true});
const cues = JSON.parse(fs.readFileSync(cuesFile, 'utf8')).filter((c) => typeof c.t === 'number');
const known = cues.filter((c) => REF_TARGET[c.kind] !== undefined && !c.dur);
const kf = path.join(out, 'cues-known.json');
fs.writeFileSync(kf, JSON.stringify(known));
const measure = (v, f, dir) => {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'ref-sfx.mjs'), 'sound-qa', '--voice', v, '--fx', f, '--cues', kf, '--out', dir], {encoding: 'utf8', maxBuffer: 1 << 26});
  if (r.status) throw new Error('ref-sfx failed: ' + r.stderr.slice(0, 400));
  return JSON.parse(fs.readFileSync(path.join(dir, 'cue-levels.json'), 'utf8'));
};
const phone = (src, dst) => {
  const r = spawnSync(FF, ['-v', 'error', '-y', '-i', src, '-ac', '1', '-af', PHONE_FILTER, '-c:a', 'pcm_s16le', dst]);
  if (r.status) throw new Error('ffmpeg phone filter failed on ' + src);
  return dst;
};
const full = measure(vo, fx, path.join(out, 'full'));
const ph = measure(phone(vo, path.join(out, 'phone-voice.wav')), phone(fx, path.join(out, 'phone-sfx.wav')), path.join(out, 'phone'));
const n = {};
for (const c of known) n[c.kind] = (n[c.kind] ?? 0) + 1;
const lines = [], warnings = [];
lines.push('| sound | cues | under the voice | target (owner-approved level) | on a phone | phone change (ref) |', '|---|---|---|---|---|---|');
for (const k of Object.keys(full).sort((a, b) => (n[b] ?? 0) - (n[a] ?? 0))) {
  const lv = full[k], tg = +aimUnder(k).toFixed(1), pv = ph[k], ch = pv - lv, rc = PHONE_CHANGE[k];
  lines.push(`| ${k} | ${n[k] ?? 0} | ${lv.toFixed(1)} dB | ${tg} dB | ${pv.toFixed(1)} dB | ${ch >= 0 ? '+' : ''}${ch.toFixed(1)}${rc !== undefined ? ` (${rc >= 0 ? '+' : ''}${rc})` : ''} |`);
  if ((n[k] ?? 0) >= 3 && Math.abs(lv - tg) > 2) warnings.push(`sound: ${k} sits ${lv.toFixed(1)} dB under the voice — the target is ${tg} dB (${lv > tg ? 'too quiet' : 'too loud'})`);
  if (pv < PHONE_HEADROOM - 0.5) warnings.push(`sound: ${k} peaks only ${pv.toFixed(1)} dB under the voice on a PHONE — the rule is ≥ ${PHONE_HEADROOM} dB (words must win): too loud`);
  if ((n[k] ?? 0) >= 3 && k !== 'thump' && pv > AUDIBLE_DB) warnings.push(`sound: ${k} is lost on a phone speaker (${pv.toFixed(1)} dB under the voice)`);
  if ((n[k] ?? 0) >= 3 && rc !== undefined && ch > rc + 3) warnings.push(`sound: ${k} drops ${ch.toFixed(1)} dB on a phone — the reference only ${rc} dB`);
}
let words = [];
try { words = opt.words ? JSON.parse(fs.readFileSync(opt.words, 'utf8')) : []; } catch {}
const d = densityReport(cues, words);
if (d.perMin != null) {
  const quiet = d.flags.filter((f) => f.type === 'QUIET').length, low = d.flags.filter((f) => f.type === 'LOW').length;
  lines.push('', `Density: ${d.perMin.toFixed(0)} effects/min overall, hook ${d.hookRate.toFixed(0)}/min (owner's pick B: ≈ 26–28, hook ≈ 34, cap 34) · ${quiet} quiet stretch(es) > 3.6 s · ${low} thin minute(s)`);
  if (quiet > 5) warnings.push(`sound: ${quiet} stretches of > 3.6 s of speech with no sound (density B) — node tools/sfx-scan.mjs lists them`);
}
const after = words.length ? cues.filter((c) => c.t > (words[words.length - 1].e ?? words[words.length - 1].s) + 0.4).length : 0;
if (after) warnings.push(`sound: ${after} effect(s) after the last word (the reference is silent after the sign-off)`);
const md = ['## Sound effects vs the reference (tools/audio/sound-qa.mjs)', '', ...lines, '', ...(warnings.length ? warnings.map((w) => `- ⚠ ${w}`) : ['- ✓ every kind sits like the reference, on full-range speakers and on a phone'])].join('\n');
fs.writeFileSync(path.join(out, 'sound-qa.md'), md + '\n');
fs.writeFileSync(path.join(out, 'sound-qa.json'), JSON.stringify({warnings, lines}, null, 1));
for (const f of ['phone-voice.wav', 'phone-sfx.wav', 'cues-known.json']) fs.rmSync(path.join(out, f), {force: true});
console.log(md);
