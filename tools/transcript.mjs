// Timed transcript lines (paragraphs) overlapping a window, plus sentence-level start times inside it.
//   node tools/transcript.mjs --from 120 --to 210 [--slug s]
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, args} from './lib/render.mjs';

const a = args();
const active = fs.readFileSync(path.join(ROOT, 'src', 'active.ts'), 'utf8').match(/videos\/([^']+)'/)?.[1];
const slug = a.slug ?? active;
const dir = path.join(ROOT, 'videos', slug, 'timing');
const from = Number(a.from ?? 0);
const to = Number(a.to ?? 1e9);
const paras = JSON.parse(fs.readFileSync(path.join(dir, 'paragraphs.json'), 'utf8'));
const words = JSON.parse(fs.readFileSync(path.join(dir, 'words.json'), 'utf8'));
const mmss = (x) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${(x % 60).toFixed(1).padStart(4, '0')}`;
for (const p of paras.filter((p) => p.e >= from && p.s <= to)) {
  console.log(`\n[${mmss(p.s)}–${mmss(p.e)}] (${p.s.toFixed(2)}–${p.e.toFixed(2)} s) P${p.i}`);
  // sentence starts inside the paragraph
  const ws = words.filter((w) => w.p === p.i);
  let sent = [];
  for (const w of ws) {
    sent.push(w);
    if (/[.?!…]["”']?$/.test(w.w)) {
      console.log(`  ${sent[0].s.toFixed(2)}  ${sent.map((x) => x.w).join(' ')}`);
      sent = [];
    }
  }
  if (sent.length) console.log(`  ${sent[0].s.toFixed(2)}  ${sent.map((x) => x.w).join(' ')}`);
}
