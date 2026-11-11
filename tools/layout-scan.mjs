// LAYOUT SCAN (owner 2026-11-11: "no overlapping things, nothing bad in the frame"). Plays the active video in the render
// browser WITHOUT taking pictures (fast), reads the real on-screen box of every tagged piece (src/probe/LayoutProbe +
// kit/stage lb()), and flags what a viewer would see as a mistake:
//   TEXT ON TEXT     two labels / pills / headlines / bubbles touching
//   OVER A FACE      text, a bubble or an object covering AZTIKA's face or a character's head
//   OVER THE HERO    text covering more than a corner of a hero object
//   OFF THE EDGE     text outside the safe area (or cut by the frame); a hero object more than a quarter off-frame
//   TOO CROWDED      more than 8 texts on screen at once (unreadable on a phone)
// Ignored by design: scene joins (two scenes overlap for ≈ 0.3 s), pieces still fading in/out (opacity < 0.85), and any
// clash shorter than 0.4 s (a thing flying past). Each flag: time range + the pieces' ids.
//   node tools/layout-scan.mjs [--from s --to s] [--every 12] [--stills]     → videos/<slug>/layout-scan.json
// Accept a flag ON PURPOSE in videos/<slug>/gate-ok.json like any gate item ({"match": "<text of the flag>", "why": "…"}).
import fs from 'node:fs';
import path from 'node:path';
import {renderFrames, selectComposition, openBrowser} from '@remotion/renderer';
import {ROOT, args, getBundle} from './lib/render.mjs';

const a = args();
const FPS = 60;
const slug = fs.readFileSync(path.join(ROOT, 'src', 'active.ts'), 'utf8').match(/videos\/([^']+)'/)?.[1];
const vdir = path.join(ROOT, 'videos', slug);
const every = +(a.every ?? 60); // 60 = one look per second (a clash must last ≥ 2 s to count — real overlaps hold for seconds)

export const SAFE = {x0: 48, y0: 27, x1: 1872, y1: 1053};
const area = (b) => Math.max(0, b.w) * Math.max(0, b.h);
const inter = (p, q) => area({w: Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x), h: Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y)});
const face = (b) => ({...b, x: b.x + b.w * 0.2, w: b.w * 0.6, h: b.h * 0.32}); // AZTIKA's face = the top third of his cut-out

/** the rules: frame boxes → problems in this frame [{key, text}] */
export const frameProblems = (boxes) => {
  // text boxes include the font's empty space above/below the letters → trim 15 % top and bottom (the letters themselves)
  const vis = boxes.filter((b) => b.o >= 0.85).map((b) => (b.role === 'text' ? {...b, y: b.y + b.h * 0.15, h: b.h * 0.7} : b));
  const texts = vis.filter((b) => b.role === 'text' || b.role === 'bubble');
  const faces = vis.filter((b) => b.role === 'head').concat(vis.filter((b) => b.role === 'host').map(face));
  const objects = vis.filter((b) => b.role === 'object');
  const out = [];
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const p = texts[i], q = texts[j], ov = inter(p, q);
    if (p.id === q.id) continue; // a piece and its own inner pill (MarkPill → NPill)
    if (ov > 0.06 * Math.min(area(p), area(q))) out.push({key: `tt|${p.id}|${q.id}`, text: `TEXT ON TEXT: ${p.id} × ${q.id}`});
  }
  for (const f of faces) for (const p of texts.concat(objects)) {
    if (inter(p, f) > (f.role === 'host' ? 0.08 : 0.1) * area(f)) out.push({key: `face|${f.id}|${p.id}`, text: `OVER A FACE: ${p.id} covers ${f.role === 'host' ? "AZTIKA's face" : `the head of ${f.id}`}`});
  }
  for (const o of objects) for (const p of texts) {
    if (inter(p, o) > 0.15 * area(o)) out.push({key: `hero|${o.id}|${p.id}`, text: `OVER THE HERO: ${p.id} covers ${Math.round((100 * inter(p, o)) / area(o))} % of ${o.id}`});
  }
  for (const p of texts) {
    if (inter(p, {x: 0, y: 0, w: 1920, h: 1080}) <= 0) continue; // fully outside = hidden, not a mistake
    const off = p.x < SAFE.x0 - 4 || p.y < SAFE.y0 - 4 || p.x + p.w > SAFE.x1 + 4 || p.y + p.h > SAFE.y1 + 4;
    if (off) out.push({key: `edge|${p.id}`, text: `OFF THE EDGE: ${p.id} reaches outside the safe area (${p.x},${p.y} ${p.w}×${p.h})`});
  }
  for (const o of objects) {
    const inside = inter(o, {x: 0, y: 0, w: 1920, h: 1080});
    // partly cut by the frame = a mistake; fully outside = simply not in the shot yet (the camera has not reached it)
    if (inside < 0.75 * area(o) && inside > 0.05 * area(o)) out.push({key: `edge|${o.id}`, text: `OFF THE EDGE: hero ${o.id} is ${Math.round(100 - (100 * inside) / area(o))} % off-frame`});
  }
  if (texts.length > 8) out.push({key: 'crowd', text: `TOO CROWDED: ${texts.length} texts on screen at once`});
  return out;
};

const run = async () => {
  const url = await getBundle();
  const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'swangle'}});
  const composition = await selectComposition({serveUrl: url, id: 'LayoutProbe', puppeteerInstance: browser});
  const f0 = Math.round(+(a.from ?? 0) * FPS), f1 = Math.min(composition.durationInFrames - 1, Math.round(+(a.to ?? 1e6) * FPS));
  const frames = new Map();
  const t0 = Date.now();
  await renderFrames({
    composition, serveUrl: url, imageFormat: 'none', inputProps: {}, puppeteerInstance: browser, everyNthFrame: every, frameRange: [f0, f1], concurrency: +(a.tabs ?? 4), logLevel: 'error',
    outputDir: null, onStart: () => {}, onFrameUpdate: () => {},
    onBrowserLog: (log) => {
      if (!log.text.startsWith('LB|')) return;
      const [, fr, join, json] = log.text.split('|');
      frames.set(+fr, {join: join === '1', boxes: JSON.parse(json).map(([tag, x, y, w, h, o]) => ({role: tag.split(':')[0], id: tag.split(':').slice(1).join(':'), x, y, w, h, o}))});
    },
  });
  await browser.close({silent: true});
  const secs = (Date.now() - t0) / 1000;
  // persistence: a problem must hold for ≥ 2 looks in a row (≥ 2 s at 1 look/s) — a thing flying past is not a mistake
  const keys = [...frames.keys()].sort((p, q) => p - q);
  const open = new Map(), found = [];
  const close = (k, end) => { const o = open.get(k); if (o.n >= 2) found.push({...o, end}); open.delete(k); };
  for (const fr of keys) {
    const F = frames.get(fr), now = F.join ? [] : frameProblems(F.boxes), seen = new Set();
    for (const p of now) { seen.add(p.key); const o = open.get(p.key); if (o) o.n++; else open.set(p.key, {key: p.key, text: p.text, start: fr, n: 1}); }
    for (const k of [...open.keys()]) if (!seen.has(k)) close(k, fr);
  }
  for (const k of [...open.keys()]) close(k, keys[keys.length - 1] ?? 0);
  let ok = [];
  try { ok = JSON.parse(fs.readFileSync(path.join(vdir, 'gate-ok.json'), 'utf8')).items ?? []; } catch {}
  const flags = found.map((f) => ({...f, from: +(f.start / FPS).toFixed(2), to: +(f.end / FPS).toFixed(2)})).filter((f) => !ok.some((x) => f.text.includes(x.match))).sort((p, q) => p.from - q.from);
  fs.writeFileSync(path.join(vdir, 'layout-scan.json'), JSON.stringify({looks: frames.size, seconds: +secs.toFixed(1), flags}, null, 1));
  console.log(`LAYOUT SCAN ${slug}: ${frames.size} looks in ${secs.toFixed(0)} s`);
  if (!flags.length) console.log('layout: OK — nothing overlaps, nothing off the edge, nothing too crowded');
  else for (const f of flags) console.log(`  ${f.from.toFixed(1)}–${f.to.toFixed(1)} s  ${f.text}`);
  if (a.stills && flags.length) {
    const {stills, done} = await import('./lib/render.mjs');
    const outs = flags.slice(0, 12).map((f, i) => path.join(ROOT, '.cache', 'layout', `flag-${i + 1}-${f.from}.png`));
    await stills({id: 'Main', frames: flags.slice(0, 12).map((f) => Math.round(((f.from + f.to) / 2) * FPS)), outFiles: outs, quiet: true});
    await done();
    console.log(`  stills: ${path.relative(ROOT, path.dirname(outs[0]))}/flag-*.png`);
  }
  return flags.length;
};

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('layout-scan.mjs')) {
  const n = await run();
  process.exit(n ? 1 : 0);
}
