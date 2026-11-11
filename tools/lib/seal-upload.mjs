// SEALED UPLOAD (owner 2026-11-11): the repo is PUBLIC and the voice + script are unreleased — they go to the cloud
// ENCRYPTED (AES-256-GCM, key = repo secret REF_KEY / local .cache/ref/key.txt) as release vo-<slug>, and are decrypted
// only inside the cloud jobs. Never plain: no key → stop. Used by new-video (ingest) and before any render whose release
// was deleted after use:   node tools/lib/seal-upload.mjs <slug>
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT} from './render.mjs';
import {gh, sh} from './sys.mjs';
import {encryptFile} from '../cloud/crypt.mjs';

export const sealKey = () => {
  const keyFile = path.join(ROOT, '.cache', 'ref', 'key.txt');
  const key = process.env.REF_KEY ?? (fs.existsSync(keyFile) ? fs.readFileSync(keyFile, 'utf8').trim() : '');
  if (!/^[0-9a-f]{64}$/i.test(key)) throw new Error('no sealing key (.cache/ref/key.txt / REF_KEY) — nothing is uploaded plain. Restore the key, then re-run.');
  return key;
};

export const sealUpload = (slug) => {
  const vdir = path.join(ROOT, 'videos', slug);
  const vo = ['voiceover.wav', 'voiceover.mp3', 'voiceover.m4a'].map((n) => path.join(vdir, n)).find((f) => fs.existsSync(f));
  if (!vo) throw new Error(`no voiceover in videos/${slug}`);
  const key = sealKey();
  const tag = `vo-${slug}`;
  const sealDir = path.join(ROOT, '.cache', `seal-${slug}`);
  fs.mkdirSync(sealDir, {recursive: true});
  const assets = [path.join(sealDir, 'voiceover.enc')];
  encryptFile(vo, assets[0], key);
  const script = path.join(vdir, 'script.txt');
  if (fs.existsSync(script)) { assets.push(path.join(sealDir, 'script.enc')); encryptFile(script, assets[1], key); }
  const exists = sh('gh', ['release', 'view', tag], {allowFail: true}) !== null;
  if (exists) {
    for (const n of ['voiceover.wav', 'voiceover.mp3', 'voiceover.m4a', 'script.txt']) sh('gh', ['release', 'delete-asset', tag, n, '--yes'], {allowFail: true}); // any plain copy from an older ingest
    gh('release', 'upload', tag, ...assets, '--clobber');
  } else gh('release', 'create', tag, ...assets, '--title', `Voiceover: ${slug} (sealed)`, '--notes', 'Sealed (AES-256-GCM): decrypted only inside the cloud jobs. Delete this release after the final render.');
  fs.rmSync(sealDir, {recursive: true, force: true});
  return {tag, assets: assets.map((a) => path.basename(a))};
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = sealUpload(process.argv[2]);
  console.log(`uploaded SEALED: ${r.assets.join(' + ')} (release ${r.tag})`);
}
