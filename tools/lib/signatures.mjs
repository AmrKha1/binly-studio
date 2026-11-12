// THE CHANNEL'S SIGNATURE MEMORY (owner 2026-11-12: "every video its own identity" — checked, not just written).
// Each video's signature shots carry a one-line "idea" (the shot list: {"signature": true, "idea": "the money stamped SOLD"}).
// When a video is delivered (tools/upload-pack.mjs) its ideas are saved in library/signatures.json; the next plan is
// compared with them (plan-check REPEAT) and Stop 1 shows "new vs the last videos".
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from './render.mjs';

const FILE = path.join(ROOT, 'library', 'signatures.json');
export const readSignatures = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; } };

/** every signature shot of a video's shot lists: [{ch, id, start, idea}] */
export const videoSignatures = (slug) => {
  const dir = path.join(ROOT, 'videos', slug, 'shots');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /^C\d+\.json$/.test(f)).sort().flatMap((f) => {
    const spec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    return (spec.shots ?? spec).filter((s) => s.signature).map((s) => ({ch: f.replace('.json', ''), id: s.id, start: s.start, idea: s.idea ?? ''}));
  });
};

/** save (or replace) this video's ideas in the channel memory */
export const recordSignatures = (slug) => {
  const ideas = videoSignatures(slug).filter((x) => x.idea).map((x) => x.idea);
  if (!ideas.length) return 0;
  const all = readSignatures().filter((v) => v.video !== slug);
  all.push({video: slug, date: new Date().toISOString().slice(0, 10), ideas});
  fs.writeFileSync(FILE, JSON.stringify(all, null, 1));
  return ideas.length;
};

// similarity of two ideas: shared meaningful words (Arabic letters normalised; short words ignored)
const norm = (s) => s.toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2 && !['the', 'and', 'with', 'into', 'from', 'that', 'its', 'his', 'her'].includes(w));
export const similarity = (a, b) => {
  const A = new Set(norm(a)), B = new Set(norm(b));
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n / Math.min(A.size, B.size);
};
