// Word TIMES without the words (owner 2026-11-11: the unreleased script and its word timing stay on this PC — the public
// repo only gets numbers). timing/words.json (local, git-ignored: text + times) → timing/times.json (committed: [{s, e}]).
// Readers that need only when words are spoken (sound density, silence after the sign-off) use readWordTimes().
import fs from 'node:fs';
import path from 'node:path';

export const readWordTimes = (vdir) => {
  for (const f of ['words.json', 'times.json']) {
    try { return JSON.parse(fs.readFileSync(path.join(vdir, 'timing', f), 'utf8')); } catch {}
  }
  return [];
};
export const writeWordTimes = (vdir) => {
  const src = path.join(vdir, 'timing', 'words.json');
  if (!fs.existsSync(src)) return 0;
  const times = JSON.parse(fs.readFileSync(src, 'utf8')).map((w) => ({s: w.s, e: w.e}));
  fs.writeFileSync(path.join(vdir, 'timing', 'times.json'), JSON.stringify(times));
  return times.length;
};
