// RENDER GATE LOCK (owner 2026-11-11): nothing renders — not even a preview — until tools/render-gate.mjs says GO for
// exactly the current video. The stamp holds a fingerprint of everything that decides the picture and the sound; any
// change after GO voids it. Shared by render-gate.mjs (writes) and cloud.mjs render (checks).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);

/** sha1 over the video's code, its hand sound cues, its chapters and its voice lock */
export const videoFingerprint = (root, slug) => {
  const vdir = path.join(root, 'videos', slug), sdir = path.join(root, 'src', 'videos', slug);
  const h = crypto.createHash('sha1');
  const files = [...walk(sdir), ...walk(path.join(vdir, 'sfx')).filter((f) => !f.endsWith('_auto.json')), path.join(vdir, 'chapters.json'), path.join(vdir, 'vo-gate.json')]
    .filter((f) => fs.existsSync(f) && fs.statSync(f).isFile()).sort();
  for (const f of files) h.update(path.relative(root, f).replace(/\\/g, '/')).update(fs.readFileSync(f));
  return h.digest('hex');
};

/** exit 3 unless the gate said GO for this exact video (videos made before the gate existed — no vo-gate — are skipped) */
export const requireRenderGate = (root, slug, what) => {
  const vdir = path.join(root, 'videos', slug);
  if (!fs.existsSync(path.join(vdir, 'vo-gate.json'))) return; // older videos (before the voice gate / render gate)
  let st = null;
  try { st = JSON.parse(fs.readFileSync(path.join(vdir, 'render-gate.json'), 'utf8')); } catch {}
  const why = !st ? 'the render gate has not run' : !st.go ? 'the render gate found real issues (NOT READY)' : st.fingerprint !== videoFingerprint(root, slug) ? 'the video changed after the gate said GO' : null;
  if (!why) return;
  console.log(`${what} refused: ${why}.\nRun: node tools/render-gate.mjs --reviewed "…"  — fix every real issue until it says GO RENDER, then render.`);
  process.exit(3);
};
