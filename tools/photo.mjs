// Real archival images from Wikimedia Commons — ONLY free licences (public domain, CC0, CC BY, CC BY-SA).
//   node tools/photo.mjs search "Tournai plague burial 1349" [--n 12]
//        → candidate sheet .cache/photos/search.png (one image, numbered tiles) + list with licence/author
//   node tools/photo.mjs get <number from the last search | "File:Exact title.jpg"> --as tournai [--width 2400]
//        → public/<slug>/img/tournai.jpg + credit recorded in videos/<slug>/credits.json + CREDITS.md
// Use in a chapter: <Photo src="img/tournai.jpg" …/> (kit/photo.tsx). Never use images from other sources.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, args, done, stills} from './lib/render.mjs';

const UA = 'BinlyStudio/1.0 (https://github.com/AmrKha1/binly-studio; educational YouTube animation)';
const API = 'https://commons.wikimedia.org/w/api.php';
const a = args();
const [cmd, q] = a._;
const active = fs.readFileSync(path.join(ROOT, 'src', 'active.ts'), 'utf8').match(/videos\/([^']+)'/)?.[1];
const slug = a.slug ?? active;
const cacheDir = path.join(ROOT, '.cache', 'photos');
fs.mkdirSync(cacheDir, {recursive: true});
const strip = (h = '') => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** Licence gate: returns a normalised licence string if safe to use, else null. */
function safeLicence(m) {
  const short = strip(m.LicenseShortName?.value ?? '');
  const lic = (m.License?.value ?? '').toLowerCase();
  const s = (short + ' ' + lic).toLowerCase();
  if (/\b(nc|nd)\b|non-?commercial|no-?deriv|fair use|copyrighted|all rights/.test(s)) return null;
  if (/public domain|^pd|pd-|cc0|cc-zero/.test(s)) return short || 'Public domain';
  if (/cc[- ]by(-sa)?[- ]?\d|cc by(-sa)? \d|cc-by/.test(s)) return short;
  return null;
}

async function api(params) {
  const u = new URL(API);
  for (const [k, v] of Object.entries({format: 'json', formatversion: '2', ...params})) u.searchParams.set(k, String(v));
  const r = await fetch(u, {headers: {'User-Agent': UA}});
  if (!r.ok) throw new Error(`Wikimedia API ${r.status}`);
  return r.json();
}

const info = (p) => {
  const ii = p.imageinfo?.[0];
  if (!ii) return null;
  const m = ii.extmetadata ?? {};
  const licence = safeLicence(m);
  return {
    title: p.title,
    w: ii.width,
    h: ii.height,
    licence,
    author: strip(m.Artist?.value) || 'Unknown',
    credit: strip(m.Credit?.value),
    attributionRequired: (m.AttributionRequired?.value ?? 'true') === 'true',
    desc: strip(m.ImageDescription?.value).slice(0, 140),
    date: strip(m.DateTimeOriginal?.value).slice(0, 40),
    thumb: ii.thumburl,
    page: ii.descriptionurl,
    mime: ii.mime,
  };
};

async function search() {
  const n = Number(a.n ?? 12);
  const j = await api({action: 'query', generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: 6, gsrlimit: Math.min(50, n * 3), prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: 480});
  const pages = (j.query?.pages ?? []).sort((x, y) => (x.index ?? 0) - (y.index ?? 0));
  const all = pages.map(info).filter(Boolean);
  const ok = all.filter((x) => x.licence && x.w >= 800 && /jpeg|png|tiff|webp/.test(x.mime)).slice(0, n);
  const skipped = all.length - ok.length;
  if (!ok.length) {
    console.log(`no safely licensed results for "${q}" (${skipped} skipped: unfree, too small or not a photo). Try other words (English/Latin/French names, artist, museum).`);
    return;
  }
  fs.writeFileSync(path.join(cacheDir, 'last-search.json'), JSON.stringify(ok, null, 1));
  // candidate sheet: download thumbnails → one composed image
  const imgs = [];
  for (const c of ok) {
    const r = await fetch(c.thumb, {headers: {'User-Agent': UA}});
    const b = Buffer.from(await r.arrayBuffer());
    imgs.push(`data:${r.headers.get('content-type') ?? 'image/jpeg'};base64,${b.toString('base64')}`);
  }
  const cols = Math.min(4, ok.length);
  await stills({id: 'Grid', props: {images: imgs, labels: ok.map((_, i) => `#${i + 1}`), cols, fit: 'contain'}, frames: [0], outFiles: [path.join(cacheDir, 'search.png')], quiet: true});
  await done();
  ok.forEach((c, i) => console.log(`#${i + 1}  ${c.title.replace(/^File:/, '')}  ${c.w}×${c.h}  [${c.licence}]  by ${c.author.slice(0, 50)}${c.date ? ` · ${c.date}` : ''}`));
  console.log(`\nsheet: .cache/photos/search.png  (${skipped} unsafe/small results hidden) → node tools/photo.mjs get <#> --as <name>`);
}

async function get() {
  if (!slug || slug === '_empty') throw new Error('no active video');
  const name = (a.as ?? '').replace(/[^\w-]/g, '');
  if (!name) throw new Error('give a short name: --as tournai');
  let title = q;
  if (/^#?\d+$/.test(q)) {
    const last = JSON.parse(fs.readFileSync(path.join(cacheDir, 'last-search.json'), 'utf8'));
    title = last[Number(q.replace('#', '')) - 1]?.title;
    if (!title) throw new Error(`no result #${q} in the last search`);
  }
  if (!title.startsWith('File:')) title = `File:${title}`;
  const width = Number(a.width ?? 2400);
  const j = await api({action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: width});
  const c = info(j.query.pages[0]);
  if (!c) throw new Error(`not found: ${title}`);
  if (!c.licence) throw new Error(`REFUSED: "${title}" is not under a free licence (${c.page}). Use another image.`);
  const url = c.w > width ? c.thumb : (await api({action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url'})).query.pages[0].imageinfo[0].url;
  const r = await fetch(url, {headers: {'User-Agent': UA}});
  if (!r.ok) throw new Error(`download failed ${r.status}`);
  const ext = /png/.test(r.headers.get('content-type') ?? '') ? 'png' : 'jpg';
  const dir = path.join(ROOT, 'public', slug, 'img');
  fs.mkdirSync(dir, {recursive: true});
  const file = path.join(dir, `${name}.${ext}`);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  // credits
  const credFile = path.join(ROOT, 'videos', slug, 'credits.json');
  const creds = fs.existsSync(credFile) ? JSON.parse(fs.readFileSync(credFile, 'utf8')) : [];
  const entry = {file: `img/${name}.${ext}`, title: c.title.replace(/^File:/, ''), author: c.author, licence: c.licence, source: c.page, attributionRequired: c.attributionRequired};
  const i = creds.findIndex((x) => x.file === entry.file);
  if (i >= 0) creds[i] = entry;
  else creds.push(entry);
  fs.writeFileSync(credFile, JSON.stringify(creds, null, 1));
  const md = ['# Image credits (paste into the YouTube description)', '', ...creds.map((x) => `- ${x.title} — ${x.author} — ${x.licence}${/public domain|pd|cc0/i.test(x.licence) ? '' : ''} — via Wikimedia Commons: ${x.source}`), ''];
  fs.writeFileSync(path.join(ROOT, 'videos', slug, 'CREDITS.md'), md.join('\n'));
  const short = /public domain|cc0|^pd/i.test(c.licence) ? `${c.author} · Public domain` : `${c.author} · ${c.licence}`;
  console.log(`saved public/${slug}/img/${name}.${ext} (${c.w}×${c.h} source, ${c.licence})\nuse: <Photo slug="${slug}" src="img/${name}.${ext}" credit=${JSON.stringify(short.slice(0, 80))} … />   (credit recorded in videos/${slug}/CREDITS.md)`);
}

try {
  if (cmd === 'search' && q) await search();
  else if (cmd === 'get' && q) await get();
  else console.log('usage: node tools/photo.mjs search "query" [--n 12] | get <#|File:title> --as <name> [--width 2400]');
} catch (e) {
  console.log(`photo: ${e.message}`);
  await done();
  process.exit(1);
}
