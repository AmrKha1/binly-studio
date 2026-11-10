// VOICE GATE LOCK (owner 2026-11-10): "when the VO is ready and confirmed, the project can go to the next step".
// new-video writes videos/<slug>/vo-gate.json once the voiceover passed tools/vo-check.mjs (clean PASS, or warnings
// the owner listened to and accepted with --vo-ok). Every later step (plan-check, compile-shots, cloud analyze/render)
// calls requireVoice(slug): no stamp, a FAIL stamp, or a voiceover that changed since it was checked → STOP.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT} from './render.mjs';

const sha1 = (file) => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');

/** Lock the checked voiceover: its fingerprint + the vo-check verdict + who approved it. */
export function approveVoice(wav, by) {
  const dir = path.dirname(wav);
  const check = fs.existsSync(path.join(dir, 'vo-check.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'vo-check.json'), 'utf8')) : {};
  if (check.verdict === 'FAIL') throw new Error('vo-gate: the voice check FAILED — cannot approve');
  const stamp = {file: path.basename(wav), sha1: sha1(wav), verdict: check.verdict ?? 'unknown', warnings: check.warnings ?? [], rule: check.rule ?? null, approved_by: by, approved: new Date().toISOString()};
  fs.writeFileSync(path.join(dir, 'vo-gate.json'), JSON.stringify(stamp, null, 1));
  return stamp;
}

/** Stop the step unless this video's voiceover passed the voice gate and is still the exact file that was checked. */
export function requireVoice(slug, step = 'this step') {
  const vdir = path.join(ROOT, 'videos', slug);
  const meta = fs.existsSync(path.join(vdir, 'video.json')) ? JSON.parse(fs.readFileSync(path.join(vdir, 'video.json'), 'utf8')) : null;
  if (!meta || !meta.voPrep) return; // older videos (before the gate) and --raw single files: nothing to enforce
  const stop = (why) => {
    console.error(`\nVOICE GATE: ${step} is blocked — ${why}\n→ fix the voiceover, then: node tools/vo-check.mjs videos/${slug}/voiceover.wav (and new-video --vo-ok only after the owner listened).`);
    process.exit(3);
  };
  const f = path.join(vdir, 'vo-gate.json');
  if (!fs.existsSync(f)) stop('the voiceover was never approved (no videos/' + slug + '/vo-gate.json).');
  const s = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (s.verdict === 'FAIL') stop('the voice check FAILED.');
  const wav = path.join(vdir, s.file);
  if (!fs.existsSync(wav)) stop(`${s.file} is missing.`);
  if (sha1(wav) !== s.sha1) stop(`${s.file} changed after it was checked — it must be checked again.`);
}
