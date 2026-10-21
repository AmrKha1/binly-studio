// ART — generated backgrounds + objects for a video, with a shared library that grows with every video.
//
//   node tools/art.mjs find <words…>              search the library (names + tags) — ALWAYS before planning new art
//   node tools/art.mjs prompts <slug>             videos/<slug>/art/plan.json → full prompts (style blocks added):
//                                                 art/prompts.json (for flow_generate) + art/prompts.md (owner fallback)
//   node tools/art.mjs ingest <slug> [--dir d]    after Flow: cut sheets out, name, add to the library, copy into the video
//   node tools/art.mjs use <slug> <name…>         copy existing library items into public/<slug>/bg|el
//   node tools/art.mjs add <file> --name n --kind bg|el --tags a,b     add one finished image by hand
//
// plan.json: {"images": [
//   {"kind": "bg", "name": "palace-hall", "place": "a grand Ottoman palace hall with arches…", "open": "centre", "tags": ["palace"]},
//   {"kind": "sheet", "items": ["gold-coin","crown","scroll","poison-bottle","dagger","goblet"], "what": ["an ancient gold coin", …], "tags": ["royal"]}
// ]}   (≤ 12 images per video; 6 items per sheet; names = kebab-case English)
// Library: library/art/bg/<name>.jpg · library/art/el/<name>.png · library/art/index.json  ({name: {kind, tags, file, w, h, from}})
// In a video: <BgPlate slug={slug} file="palace-hall.jpg" …/> and <ImageAsset slug={slug} name="gold-coin" ar={w/h} …/>
// (ar is printed by ingest/use and stored in public/<slug>/art.json).
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, args} from './lib/render.mjs';

const a = args();
const [cmd, ...rest] = a._;
const LIB = path.join(ROOT, 'library', 'art');
const IDX = path.join(LIB, 'index.json');
fs.mkdirSync(path.join(LIB, 'bg'), {recursive: true});
fs.mkdirSync(path.join(LIB, 'el'), {recursive: true});
const index = fs.existsSync(IDX) ? JSON.parse(fs.readFileSync(IDX, 'utf8')) : {};
const save = () => fs.writeFileSync(IDX, JSON.stringify(index, null, 1));
const FLOW_OUT = 'C:/Users/malika/flow-mcp-out';

// image size from PNG/JPEG header
const dims = (f) => {
  const b = fs.readFileSync(f);
  if (b[0] === 0x89) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  let p = 2;
  while (p < b.length) {
    if (b[p] !== 0xff) { p++; continue; }
    const m = b[p + 1], l = b.readUInt16BE(p + 2);
    if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(p + 7), b.readUInt16BE(p + 5)];
    p += 2 + l;
  }
  return [0, 0];
};
// style blocks straight from docs/ART-STYLE.md (single source of truth)
const blocks = () => {
  const md = fs.readFileSync(path.join(ROOT, 'docs', 'ART-STYLE.md'), 'utf8');
  const grab = (h) => {
    const i = md.indexOf(h);
    const lines = md.slice(i).split('\n').slice(1);
    const out = [];
    for (const l of lines) { if (l.startsWith('> ')) out.push(l.slice(2)); else if (out.length) break; }
    return out.join(' ');
  };
  return {style: grab('## STYLE block'), bg: grab('## BACKGROUND block'), sheet: grab('## ELEMENT SHEET block')};
};
const vdir = (slug) => path.join(ROOT, 'videos', slug, 'art');
const pubFor = (slug, kind) => path.join(ROOT, 'public', slug, kind === 'bg' ? 'bg' : 'el');
const artJson = (slug) => path.join(ROOT, 'public', slug, 'art.json');
const use = (slug, names) => {
  const reg = fs.existsSync(artJson(slug)) ? JSON.parse(fs.readFileSync(artJson(slug), 'utf8')) : {};
  for (const n of names) {
    const it = index[n];
    if (!it) { console.log(`  ✗ ${n}: not in the library`); continue; }
    const dst = pubFor(slug, it.kind);
    fs.mkdirSync(dst, {recursive: true});
    fs.copyFileSync(path.join(LIB, it.file), path.join(dst, path.basename(it.file)));
    reg[n] = {kind: it.kind, file: path.basename(it.file), ar: Math.round((it.w / it.h) * 1000) / 1000};
    console.log(`  ✓ ${n} (${it.kind}, ar ${reg[n].ar})`);
  }
  fs.mkdirSync(path.dirname(artJson(slug)), {recursive: true});
  fs.writeFileSync(artJson(slug), JSON.stringify(reg, null, 1));
};

if (cmd === 'find') {
  const q = rest.map((x) => x.toLowerCase());
  const hits = Object.entries(index).filter(([n, it]) => !q.length || q.some((w) => n.includes(w) || (it.tags ?? []).some((t) => t.includes(w))));
  console.log(hits.length ? hits.map(([n, it]) => `${it.kind === 'bg' ? 'BG' : 'el'}  ${n}  [${(it.tags ?? []).join(', ')}]`).join('\n') : 'nothing found — plan it as new art');
  console.log(`(library: ${Object.keys(index).length} items)`);
} else if (cmd === 'prompts') {
  const slug = rest[0];
  const plan = JSON.parse(fs.readFileSync(path.join(vdir(slug), 'plan.json'), 'utf8'));
  const B = blocks();
  if (plan.images.length > 12) console.log(`WARNING: ${plan.images.length} images — the budget is 12 per video (Flow flags heavy use). Reuse library items.`);
  const prompts = plan.images.map((im) => {
    if (im.kind === 'bg') return B.bg.replace('<PLACE>', im.place).replace('<centre/lower middle>', im.open ?? 'centre') + ' ' + B.style;
    const list = (im.what ?? im.items).map((w, i) => `${i + 1}) ${w}`).join(', ');
    return B.sheet.replace('<LIST>', list) + ' ' + B.style;
  });
  fs.writeFileSync(path.join(vdir(slug), 'prompts.json'), JSON.stringify(prompts.map((p) => ({type: 'image', model: 'Nano Banana 2 Lite', max_credits: 0, aspect_ratio: '16:9', download_quality: 'upscaled', prompt: p})), null, 1));
  fs.writeFileSync(path.join(vdir(slug), 'prompts.md'), `# Art prompts — ${slug}\nIf Flow refuses the automatic run: open Flow, pick **Nano Banana 2 Lite**, 16:9, and generate each prompt below\n(in this order). Save the images into \`input/\` named 01.jpg, 02.jpg, … and say "art is in input".\n\n` + prompts.map((p, i) => `## ${String(i + 1).padStart(2, '0')} · ${plan.images[i].kind === 'bg' ? 'background: ' + plan.images[i].name : 'objects: ' + plan.images[i].items.join(', ')}\n\`\`\`\n${p}\n\`\`\`\n`).join('\n'));
  console.log(`${prompts.length} prompts → videos/${slug}/art/prompts.json (Flow) + prompts.md (manual fallback). Flow project name: art-${slug}`);
} else if (cmd === 'ingest') {
  const slug = rest[0];
  const plan = JSON.parse(fs.readFileSync(path.join(vdir(slug), 'plan.json'), 'utf8'));
  const dir = a.dir ? path.resolve(a.dir) : path.join(FLOW_OUT, `art-${slug}`);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort() : [];
  const fileFor = (i) => files.find((f) => f.startsWith(`scene-${String(i + 1).padStart(2, '0')}.`)) ?? files.find((f) => f.startsWith(String(i + 1).padStart(2, '0') + '.'));
  const names = [];
  const missing = [];
  plan.images.forEach((im, i) => {
    const f = fileFor(i);
    if (!f) { missing.push(i + 1); return; }
    const src = path.join(dir, f);
    if (im.kind === 'bg') {
      const file = `bg/${im.name}.jpg`;
      fs.copyFileSync(src, path.join(LIB, file));
      const [w, h] = dims(path.join(LIB, file));
      index[im.name] = {kind: 'bg', tags: im.tags ?? [], file, w, h, from: slug};
      names.push(im.name);
    } else {
      const tmp = path.join(ROOT, '.cache', 'art-cut', `${slug}-${i + 1}`);
      fs.rmSync(tmp, {recursive: true, force: true});
      const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'cutout.mjs'), src, '--out', tmp], {encoding: 'utf8'});
      const got = fs.existsSync(tmp) ? fs.readdirSync(tmp).filter((x) => x.endsWith('.png')).sort() : [];
      if (got.length !== im.items.length) console.log(`  ! sheet ${i + 1}: found ${got.length} objects, expected ${im.items.length} — check .cache/art-cut/${slug}-${i + 1} (objects may touch); names follow reading order`);
      got.forEach((g, k) => {
        const n = im.items[k] ?? `${slug}-obj-${i + 1}-${k + 1}`;
        const file = `el/${n}.png`;
        fs.copyFileSync(path.join(tmp, g), path.join(LIB, file));
        const [w, h] = dims(path.join(LIB, file));
        index[n] = {kind: 'el', tags: im.tags ?? [], file, w, h, from: slug};
        names.push(n);
      });
      if (r.status !== 0) console.log(r.stdout + r.stderr);
    }
  });
  save();
  use(slug, names);
  if (missing.length) console.log(`MISSING images: ${missing.join(', ')} — Flow refused or not finished. Owner fallback: videos/${slug}/art/prompts.md. Continue without them (kit white-mode scenes) or wait.`);
  console.log(`ingest: ${names.length} items added to the library and copied into public/${slug}/ (sizes in public/${slug}/art.json)`);
} else if (cmd === 'use') {
  use(rest[0], rest.slice(1));
} else if (cmd === 'add') {
  const src = path.resolve(rest[0]);
  const kind = a.kind === 'bg' ? 'bg' : 'el';
  const file = `${kind}/${a.name}${kind === 'bg' ? '.jpg' : '.png'}`;
  fs.copyFileSync(src, path.join(LIB, file));
  const [w, h] = dims(path.join(LIB, file));
  index[a.name] = {kind, tags: a.tags ? String(a.tags).split(',') : [], file, w, h, from: 'manual'};
  save();
  console.log(`added ${a.name} (${kind}, ${w}×${h})`);
} else {
  console.log('usage: node tools/art.mjs find <words…> | prompts <slug> | ingest <slug> [--dir d] | use <slug> <names…> | add <file> --name n --kind bg|el --tags a,b');
}
