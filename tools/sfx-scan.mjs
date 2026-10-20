// AUTO SFX: renders the active video's scenes to markup frame by frame (plain Node, no browser, no video) with the kit's
// cue collector on, and writes every rising edge (an element starting to appear / a moment starting) as a timed sound
// cue → videos/<slug>/sfx/_auto.json. Hand-written story sounds in videos/<slug>/sfx/<chapter>.json win over these.
//   node tools/sfx-scan.mjs [--slug s] [--fps 30] [--from a --to b]
// Runs automatically in the cloud render (render.yml) before the audio stems are made; run it locally to inspect.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {ROOT, args} from './lib/render.mjs';

const a = args();
const activeSlug = fs.readFileSync(path.join(ROOT, 'src', 'active.ts'), 'utf8').match(/videos\/([^']+)'/)?.[1];
const slug = a.slug ?? activeSlug;
const fps = Number(a.fps ?? 30);
const tmp = path.join(ROOT, '.cache', 'sfx-scan');
fs.mkdirSync(tmp, {recursive: true});
const entry = path.join(tmp, 'entry.tsx');
const rel = (p) => path.relative(tmp, p).split(path.sep).join('/');
fs.writeFileSync(
  entry,
  `import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {active} from '${rel(path.join(ROOT, 'src', 'videos', slug, 'index'))}';
import {setSfxCollector} from '${rel(path.join(ROOT, 'src', 'kit', 'sfx'))}';
import {setLang} from '${rel(path.join(ROOT, 'src', 'kit', 'lang'))}';
export const meta = active.meta;
export const frame = (t, collect) => {
  setLang(active.meta.lang);
  setSfxCollector(collect);
  try { renderToStaticMarkup(React.createElement(active.Video, {t})); } finally { setSfxCollector(null); }
};
`
);
const out = path.join(tmp, 'bundle.mjs');
await build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: out,
  jsx: 'automatic',
  loader: {'.css': 'empty', '.png': 'empty', '.jpg': 'empty', '.svg': 'empty', '.woff2': 'empty', '.woff': 'empty'},
  // only the bare 'remotion' import is stubbed ('remotion/no-react' used by @remotion/paths stays real)
  plugins: [{name: 'remotion-stub', setup: (b) => b.onResolve({filter: /^remotion$/}, () => ({path: path.join(ROOT, 'tools', 'sfx', 'remotion-stub.tsx')}))}],
  logLevel: 'error',
  define: {'process.env.NODE_ENV': '"production"'},
  banner: {js: "import {createRequire} from 'module'; const require = createRequire(import.meta.url);"},
});
const mod = await import(pathToFileURL(out).href + `?v=${Date.now()}`);
const dur = mod.meta.duration;
const from = Number(a.from ?? 0);
const to = Math.min(dur, Number(a.to ?? dur));

// rising-edge detection per key; sustain cues get a duration (active span)
const prev = new Map(); // key → last frame index seen active
const open = new Map(); // sustain key → cue
const cues = [];
const t0 = Date.now();
const nFrames = Math.floor((to - from) * fps);
let errors = 0;
for (let f = 0; f <= nFrames; f++) {
  const t = from + f / fps;
  const seen = new Map();
  try {
    mod.frame(t, (c) => seen.set(c.key, c));
  } catch (e) {
    if (errors++ < 3) console.log(`WARNING: frame ${t.toFixed(2)}s failed to render (${String(e.message ?? e).split('\n')[0].slice(0, 120)})`);
    continue;
  }
  for (const [key, c] of seen) {
    if (prev.get(key) !== f - 1) {
      const cue = {t: Math.round(t * 1000) / 1000, kind: c.kind, pan: Math.round(c.pan * 100) / 100, ...(c.gain ? {gain: c.gain} : {}), auto: true};
      cues.push(cue);
      if (c.sustain) open.set(key, cue);
    }
    prev.set(key, f);
  }
  for (const [key, cue] of open) if (!seen.has(key)) {
    cue.dur = Math.max(0.15, Math.round((t - cue.t) * 100) / 100);
    open.delete(key);
  }
  if (f % (fps * 60) === 0 && f) process.stdout.write(`  ${Math.round(t)} s scanned, ${cues.length} cues\r`);
}
for (const cue of open.values()) cue.dur = Math.max(0.15, Math.round((to - cue.t) * 100) / 100);
// density control: a burst of many elements (a grid of 30 icons) becomes a quick rhythm, not a wall of noise —
// the same kind at most every 0.12 s, any sound at most every 0.08 s (bigger kinds win when two collide)
const RANK = {slam: 9, stamp: 8, whoosh: 7, count: 7, ding: 6, confirm: 6, swoosh: 5, popup: 4, pop: 4, sparkle: 3, swish: 3, scribble: 3, tick: 1};
cues.sort((x, y) => x.t - y.t);
const lastOfKind = new Map();
const kept = [];
for (const c of cues) {
  if (c.t - (lastOfKind.get(c.kind) ?? -9) < 0.12) continue;
  const prevC = kept[kept.length - 1];
  if (prevC && c.t - prevC.t < 0.08) {
    if ((RANK[c.kind] ?? 2) > (RANK[prevC.kind] ?? 2)) kept[kept.length - 1] = c;
    continue;
  }
  kept.push(c);
  lastOfKind.set(c.kind, c.t);
}
const dropped = cues.length - kept.length;
cues.length = 0;
cues.push(...kept);
const file = path.join(ROOT, 'videos', slug, 'sfx', '_auto.json');
fs.mkdirSync(path.dirname(file), {recursive: true});
fs.writeFileSync(file, JSON.stringify(cues, null, 0).replace(/\},\{/g, '},\n{'));
const byKind = {};
for (const c of cues) byKind[c.kind] = (byKind[c.kind] ?? 0) + 1;
console.log(`sfx scan ${slug}: ${cues.length} auto cues in ${(to - from).toFixed(0)} s (${(cues.length / Math.max(1, to - from) * 60).toFixed(0)}/min) · ${Object.entries(byKind).map(([k, n]) => `${k} ${n}`).join(' · ')} · ${((Date.now() - t0) / 1000).toFixed(0)} s → ${path.relative(ROOT, file)}${errors ? ` · ${errors} frames failed` : ''}${dropped ? ` · ${dropped} merged in bursts` : ''}`);
