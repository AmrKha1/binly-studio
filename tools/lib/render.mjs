// Shared local rendering helpers (stills only — full videos render in the cloud).
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let serveUrl = null;
let browser = null;

// Each run bundles into its OWN folder inside the project (.cache/bundles/<pid>) and deletes it when done —
// webpack bundles are ~0.17 GB each and used to pile up in the system temp folder (hundreds of them).
const BUNDLES = path.join(ROOT, '.cache', 'bundles');
const myBundle = path.join(BUNDLES, `${process.pid}-${Date.now()}`);
const STALE_MS = 10 * 3600 * 1000; // only leftovers of crashed runs older than 10 h
function cleanStale() {
  const sweep = (dir, match) => {
    try {
      for (const n of fs.readdirSync(dir)) {
        if (!match(n)) continue;
        const p = path.join(dir, n);
        try {
          if (Date.now() - fs.statSync(p).mtimeMs > STALE_MS) fs.rmSync(p, {recursive: true, force: true});
        } catch {}
      }
    } catch {}
  };
  sweep(BUNDLES, () => true); // leftovers of crashed runs
  sweep(os.tmpdir(), (n) => n.startsWith('remotion-webpack-bundle-')); // old-style leftovers in the system temp
}
const removeMine = () => {
  try {
    fs.rmSync(myBundle, {recursive: true, force: true});
  } catch {}
};
process.on('exit', removeMine);

// Several agents may render at once: webpack's shared cache must not be written concurrently,
// so bundling is serialised with a lock directory (stale after 3 minutes).
const LOCK = path.join(ROOT, '.cache', 'bundle.lock');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function withLock(fn) {
  fs.mkdirSync(path.dirname(LOCK), {recursive: true});
  for (;;) {
    try {
      fs.mkdirSync(LOCK);
      break;
    } catch {
      try {
        if (Date.now() - fs.statSync(LOCK).mtimeMs > 180000) fs.rmSync(LOCK, {recursive: true, force: true});
      } catch {}
      await sleep(1000);
    }
  }
  try {
    return await fn();
  } finally {
    fs.rmSync(LOCK, {recursive: true, force: true});
  }
}

export async function getBundle() {
  if (serveUrl) return serveUrl;
  fs.mkdirSync(path.join(ROOT, 'public'), {recursive: true});
  cleanStale();
  fs.mkdirSync(BUNDLES, {recursive: true});
  const t0 = Date.now();
  serveUrl = await withLock(() =>
    bundle({
      entryPoint: path.join(ROOT, 'src', 'index.ts'),
      publicDir: path.join(ROOT, 'public'),
      enableCaching: true,
      outDir: myBundle,
      onProgress: () => {},
    })
  );
  console.log(`bundled in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  return serveUrl;
}

export async function stills({id, props = {}, frames, outFiles, scale = 1, quiet = false}) {
  const url = await getBundle();
  browser ??= await openBrowser('chrome', {chromiumOptions: {gl: 'swangle'}});
  const composition = await selectComposition({serveUrl: url, id, inputProps: props, puppeteerInstance: browser});
  for (let i = 0; i < frames.length; i++) {
    const frame = Math.max(0, Math.min(composition.durationInFrames - 1, frames[i]));
    fs.mkdirSync(path.dirname(outFiles[i]), {recursive: true});
    const t0 = Date.now();
    await renderStill({composition, serveUrl: url, frame, output: outFiles[i], imageFormat: 'png', inputProps: props, puppeteerInstance: browser, scale, chromiumOptions: {gl: 'swangle'}, overwrite: true});
    if (!quiet) console.log(`wrote ${path.relative(ROOT, outFiles[i])} (frame ${frame}, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  }
}

export async function done() {
  if (browser) await browser.close({silent: true});
  removeMine();
}

/** Tiny argv parser: --key value, repeated keys become arrays, bare flags = true. */
export function args(argv = process.argv.slice(2)) {
  const out = {_: []};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      if (k in out) out[k] = [].concat(out[k], v);
      else out[k] = v;
    } else out._.push(a);
  }
  return out;
}

export const list = (v) => (v === undefined ? [] : [].concat(v).flatMap((x) => String(x).split(',')).filter(Boolean));
