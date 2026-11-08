// AES-256-GCM file encryption for private material sent through the PUBLIC repo (reference-video audio/transcripts).
// Key: 64 hex chars in env REF_KEY (repo secret REF_KEY; local copy in .cache/ref/key.txt, never committed).
//   node tools/cloud/crypt.mjs encrypt|decrypt <in> <out>
// File format: iv(12) | tag(16) | ciphertext.
import fs from 'node:fs';
import crypto from 'node:crypto';

export function encryptFile(src, dst, keyHex) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), iv);
  const body = Buffer.concat([c.update(fs.readFileSync(src)), c.final()]);
  fs.writeFileSync(dst, Buffer.concat([iv, c.getAuthTag(), body]));
}
export function decryptFile(src, dst, keyHex) {
  const buf = fs.readFileSync(src);
  const d = crypto.createDecipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  fs.writeFileSync(dst, Buffer.concat([d.update(buf.subarray(28)), d.final()]));
}

if (process.argv[1]?.endsWith('crypt.mjs')) {
  const [mode, src, dst] = process.argv.slice(2);
  const key = process.env.REF_KEY;
  if (!key || key.length !== 64) throw new Error('REF_KEY (64 hex chars) missing');
  (mode === 'encrypt' ? encryptFile : decryptFile)(src, dst, key);
}
