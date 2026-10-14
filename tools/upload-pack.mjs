// YouTube upload package for a finished video → videos/<slug>/youtube/
//   node tools/upload-pack.mjs [--slug s]
//   description.md  — description draft: hook line, clickable chapter timestamps, credits (images, music)
//   captions.srt    — subtitles with the EXACT script wording and the real word timings (upload in YouTube Studio)
//   chapters.txt    — just the timestamps (YouTube needs: first at 0:00, ≥ 3 chapters, each ≥ 10 s)
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, args} from './lib/render.mjs';

const a = args();
const active = fs.readFileSync(path.join(ROOT, 'src', 'active.ts'), 'utf8').match(/videos\/([^']+)'/)?.[1];
const slug = a.slug ?? active;
const vdir = path.join(ROOT, 'videos', slug);
const out = path.join(vdir, 'youtube');
fs.mkdirSync(out, {recursive: true});
const meta = JSON.parse(fs.readFileSync(path.join(vdir, 'video.json'), 'utf8'));
const chapters = JSON.parse(fs.readFileSync(path.join(vdir, 'chapters.json'), 'utf8'));
const words = JSON.parse(fs.readFileSync(path.join(vdir, 'timing', 'words.json'), 'utf8'));

// ---------- chapters (merge any < 10 s into the previous one)
const mmss = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(Math.floor(s % 60)).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};
const marks = [];
for (const c of chapters) {
  const title = (c.title ?? c.id).trim();
  if (!marks.length) marks.push({t: 0, title});
  else if (c.start - marks[marks.length - 1].t >= 10 && meta.duration - c.start >= 10) marks.push({t: c.start, title});
}
const chapterLines = marks.length >= 3 ? marks.map((m) => `${mmss(m.t)} ${m.title}`) : [];
fs.writeFileSync(path.join(out, 'chapters.txt'), chapterLines.join('\n') + '\n');

// ---------- captions (≤ 2 lines × 42 chars, ≤ 6 s, break after sentence ends / long pauses)
const ts = (s) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};
const cues = [];
let cur = [];
const flush = () => {
  if (!cur.length) return;
  cues.push({s: cur[0].s, e: cur[cur.length - 1].e, text: cur.map((w) => w.w).join(' ')});
  cur = [];
};
for (let i = 0; i < words.length; i++) {
  const w = words[i];
  const text = [...cur, w].map((x) => x.w).join(' ');
  if (cur.length && (text.length > 84 || w.e - cur[0].s > 6 || w.s - cur[cur.length - 1].e > 0.6)) flush();
  cur.push(w);
  const next = words[i + 1];
  if (/[.?!…]["”']?$/.test(w.w) && (!next || next.s - w.e > 0.25 || cur.map((x) => x.w).join(' ').length > 30)) flush();
}
flush();
const twoLines = (t) => {
  if (t.length <= 42) return t;
  let best = -1;
  for (let i = 0; i < t.length; i++) if (t[i] === ' ' && (best < 0 || Math.abs(i - t.length / 2) < Math.abs(best - t.length / 2))) best = i;
  return best < 0 ? t : `${t.slice(0, best)}\n${t.slice(best + 1)}`;
};
const srt = cues
  .map((c, i) => {
    const nextS = cues[i + 1]?.s ?? c.e + 2;
    const end = Math.min(Math.max(c.e + 0.25, c.s + 1.0), nextS - 0.02);
    return `${i + 1}\n${ts(c.s)} --> ${ts(end)}\n${twoLines(c.text)}\n`;
  })
  .join('\n');
fs.writeFileSync(path.join(out, 'captions.srt'), srt);

// ---------- description draft
const credits = fs.existsSync(path.join(vdir, 'credits.json')) ? JSON.parse(fs.readFileSync(path.join(vdir, 'credits.json'), 'utf8')) : [];
// + credits of every shared silhouette this video's code actually uses
{
  const srcDir = path.join(ROOT, 'src', 'videos', slug);
  const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
  const used = new Set();
  for (const f of walk(srcDir)) for (const m of fs.readFileSync(f, 'utf8').matchAll(/Silhouette[^>]*?name=["']([w-]+)["']/g)) used.add(m[1]);
  for (const n of used) {
    const jf = path.join(ROOT, 'src', 'assets', 'silhouettes', `${n}.json`);
    if (!fs.existsSync(jf) || credits.some((c) => c.file === `silhouette:${n}`)) continue;
    const d = JSON.parse(fs.readFileSync(jf, 'utf8'));
    credits.push({file: `silhouette:${n}`, title: `${d.title} silhouette`, author: d.credit.author, licence: d.credit.licence, source: d.credit.source});
  }
}
const plan = fs.existsSync(path.join(vdir, 'plan.md')) ? fs.readFileSync(path.join(vdir, 'plan.md'), 'utf8') : '';
const logline = plan.match(/\*\*Logline:\*\*\s*(.+)/i)?.[1]?.trim() ?? '';
const desc = [
  `<!-- Draft — edit freely before pasting into YouTube. Title: ${meta.title} -->`,
  logline || '[One or two sentences that make people curious — the video\'s hook question.]',
  '',
  ...(chapterLines.length ? ['Chapters:', ...chapterLines, ''] : []),
  ...(credits.length
    ? ['Image credits (Wikimedia Commons / PhyloPic):', ...credits.map((c) => `• ${c.title} — ${c.author} — ${c.licence}${/public domain|cc0|pdm/i.test(c.licence) ? '' : ` — ${c.source}`}`) /* links only where the licence asks for them (CC BY / BY-SA) */, '']
    : []),
  'Music: original score composed for this video.',
  '',
].join('\n');
fs.writeFileSync(path.join(out, 'description.md'), desc);

console.log(`youtube package → videos/${slug}/youtube/: description.md (${chapterLines.length} chapters${chapterLines.length ? '' : ' — fewer than 3 valid, YouTube would ignore them'}), captions.srt (${cues.length} captions), chapters.txt${credits.length ? `, ${credits.length} image credit(s)` : ''}`);
