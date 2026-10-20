// Kit test + visual catalog.
//   node tools/kit-test.mjs            → renders every kit showcase page and every shot template; fails loudly on any
//                                        render error; then writes the visual catalogs:
//                                          docs/catalog/templates.png  (every template, named)
//                                          docs/catalog/kit.png        (every kit showcase page, named)
// Run after any kit change (and in /improve-studio). New template? add it to TEMPLATE_TILES below.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, done, stills} from './lib/render.mjs';
import {spawnSync} from 'node:child_process';

// [gallery page, time (s), name] — templates gallery shows one template per 3 s window
const TEMPLATE_TILES = [
  ['templates', 2.8, 'TitleShot'], ['templates', 5.8, 'StatShot'], ['templates', 8.8, 'QuoteShot'], ['templates', 11.8, 'EvidenceShot'],
  ['templates', 14.8, 'ClaimShot'], ['templates', 17.8, 'CompareShot'], ['templates', 20.8, 'ListShot'], ['templates', 23.8, 'TimelineShot'],
  ['templates', 26.8, 'MapShot'], ['templates', 29.5, 'PersonShot'], ['templates2', 2.8, 'ProcessShot'], ['templates2', 5.8, 'QuestionShot'],
  ['archival', 3.5, 'KenBurnsShot'], ['archival', 7.5, 'DetailHuntShot'], ['archival', 11.5, 'MontageShot'], ['archival', 15.5, 'CollageShot'],
  ['archival', 19.5, 'CompareImagesShot'], ['archival', 23.5, 'DocumentScanShot'], ['archival', 27.5, 'AnnotatedImageShot'],
  ['archival2', 3.5, 'ImageInWorldShot'], ['archival2', 7.5, 'ParallaxCutoutShot'],
];
const KIT_TILES = [
  ['motion', 2.5, 'motion · Enter presets'], ['motion', 3.6, 'motion · Attention moves'],
  ['glow', 5, 'glow · GlowBackdrop + Halo + Sparkles'], ['glowfloor', 2.5, 'glow · GlowFloor'],
  ['arabic', 2.5, 'ARABIC · hero scene', 'ar'], ['arabic', 5, 'ARABIC · SlamTitle', 'ar'], ['arabic', 8.5, 'ARABIC · ListShot RTL', 'ar'], ['arabic', 11.5, 'ARABIC · CompareShot RTL', 'ar'],
  ['text', 3.5, 'text'], ['cards', 4, 'cards'], ['diagrams', 4, 'diagrams'], ['data', 4, 'data'], ['icons', 4, 'icons'],
  ['env', 2, 'env · environments 1'], ['env', 5, 'env · cities & streets'], ['env', 8, 'env · interiors'], ['env', 11, 'env · rooms'],
  ['env', 14, 'env · props 1'], ['env', 17, 'env · props 2'], ['env', 20, 'env · props 3'], ['science', 4, 'science'], ['geo', 4, 'geo'],
  ['people', 2.3, 'people'], ['photo', 4, 'photo'], ['depth', 4, 'depth (globe · isometric · spheres)'], ['transitions', 5.85, 'transitions'], ['silhouettes', 4, 'silhouettes (shared library)'], ['world', 3, 'world (transport · props · weather)'], ['biomes', 4, 'biomes · emotes'],
];

// 1) typecheck first
const tc = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'check.mjs')], {encoding: 'utf8', cwd: ROOT});
if (tc.status !== 0) {
  console.log(tc.stdout.trim());
  console.log('KIT TEST FAILED at typecheck');
  process.exit(1);
}

const tmp = path.join(ROOT, '.cache', 'kit-test');
fs.rmSync(tmp, {recursive: true, force: true});
const failures = [];
async function renderTiles(tiles, tag) {
  const files = [];
  const labels = [];
  for (const [page, t, name, lang] of tiles) {
    const f = path.join(tmp, `${tag}-${page}-${t}${lang ? '-' + lang : ''}.png`);
    try {
      await stills({id: 'Gallery', props: {page, lang}, frames: [Math.round(t * 60)], outFiles: [f], scale: 0.25, quiet: true});
      files.push(f);
      labels.push(name);
    } catch (e) {
      failures.push(`${name} (${page} @ ${t}s): ${String(e.message ?? e).split('\n')[0].slice(0, 200)}`);
    }
  }
  return {files, labels};
}
const t0 = Date.now();
const tpl = await renderTiles(TEMPLATE_TILES, 'tpl');
const kit = await renderTiles(KIT_TILES, 'kit');
fs.mkdirSync(path.join(ROOT, 'docs', 'catalog'), {recursive: true});
const toData = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
// Grid is one 1920×1080 frame: use enough columns that every tile row fits
const fitCols = (n, min) => {
  for (let c = min; c < 12; c++) if (Math.ceil(n / c) * (((1920 - 8 * (c + 1)) / c) * (9 / 16) + 8) + 8 <= 1080) return c;
  return 12;
};
if (tpl.files.length) await stills({id: 'Grid', props: {images: tpl.files.map(toData), labels: tpl.labels, cols: fitCols(tpl.files.length, 4)}, frames: [0], outFiles: [path.join(ROOT, 'docs', 'catalog', 'templates.png')], quiet: true});
if (kit.files.length) await stills({id: 'Grid', props: {images: kit.files.map(toData), labels: kit.labels, cols: fitCols(kit.files.length, 5)}, frames: [0], outFiles: [path.join(ROOT, 'docs', 'catalog', 'kit.png')], quiet: true});
await done();
console.log(`kit test: ${tpl.files.length}/${TEMPLATE_TILES.length} templates, ${kit.files.length}/${KIT_TILES.length} kit pages rendered in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
console.log('catalogs: docs/catalog/templates.png · docs/catalog/kit.png');
if (failures.length) {
  console.log(`KIT TEST FAILED (${failures.length}):\n  ` + failures.join('\n  '));
  process.exit(1);
}
console.log('KIT TEST PASSED');
