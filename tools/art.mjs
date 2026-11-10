// ART — generated backgrounds + objects for a video, with a shared library that grows with every video.
//
//   node tools/art.mjs find <words…>              search the library (names + tags) — ALWAYS before planning new art
//   node tools/art.mjs prompts <slug>             videos/<slug>/art/plan.json → full prompts (style blocks added):
//                                                 art/prompts.json (for flow_generate) + art/prompts.md (owner fallback)
//   node tools/art.mjs ingest <slug> [--dir d]    after Flow: cut sheets out, name, add to the library, copy into the video
//                                                 → every cut-out passes the ART CHECK (tools/art-check.mjs): holes, white fringe,
//                                                 specks, cut-off edges; review sheet videos/<slug>/art/review.jpg
//   node tools/art.mjs check [names…]             re-check library items (sheet → .cache/art-check/library.jpg)
//   node tools/art.mjs approve <name…>            after LOOKING at the sheet: a flag was a false alarm → allowed
//   node tools/art.mjs use <slug> <name…>         copy existing library items into public/<slug>/bg|el (flagged items refused)
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
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {ROOT, args} from './lib/render.mjs';
import {checkPng, reviewSheet} from './art-check.mjs';

const a = args();
const [cmd, ...rest] = a._;
const LIB = path.join(ROOT, 'library', 'art');
const IDX = path.join(LIB, 'index.json');
fs.mkdirSync(path.join(LIB, 'bg'), {recursive: true});
fs.mkdirSync(path.join(LIB, 'el'), {recursive: true});
const index = fs.existsSync(IDX) ? JSON.parse(fs.readFileSync(IDX, 'utf8')) : {};
const save = () => fs.writeFileSync(IDX, JSON.stringify(index, null, 1));
// where flow-mcp saves its downloads (its own default: ~/flow-mcp-out, or FLOW_MCP_OUTPUT) — follows the logged-in user
const FLOW_OUT = process.env.FLOW_MCP_OUTPUT ?? path.join(os.homedir(), 'flow-mcp-out');

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
  return {style: grab('## STYLE block'), bg: grab('## BACKGROUND block'), sheet: grab('## ELEMENT SHEET block'),
    nStyle: grab('## NIGHT STYLE block'), nSheet: grab('## NIGHT HERO SHEET block'), nBg: grab('## NIGHT BACKGROUND block')};
};
// night-look items are tagged "night" so `find night` lists the AZTIKA hero objects
const isNightSlug = (slug) => { const f = path.join(ROOT, 'videos', slug, 'video.json'); return fs.existsSync(f) && JSON.parse(fs.readFileSync(f, 'utf8')).lang === 'ar'; };
const vdir = (slug) => path.join(ROOT, 'videos', slug, 'art');
const pubFor = (slug, kind) => path.join(ROOT, 'public', slug, kind === 'bg' ? 'bg' : 'el');
const artJson = (slug) => path.join(ROOT, 'public', slug, 'art.json');
const use = (slug, names) => {
  const reg = fs.existsSync(artJson(slug)) ? JSON.parse(fs.readFileSync(artJson(slug), 'utf8')) : {};
  for (const n of names) {
    const it = index[n];
    if (!it) { console.log(`  ✗ ${n}: not in the library`); continue; }
    // the check gate (owner 2026-11-10): flagged cut-outs never reach a video until regenerated or approved by eye
    if (it.check?.length && !it.approved) { console.log(`  ✗ ${n}: failed the art check (${it.check.join(' · ')}) — regenerate it, or look at it and run: node tools/art.mjs approve ${n}`); continue; }
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
  const B0 = blocks();
  // Arabic (AZTIKA) videos use the NIGHT look blocks (owner 2026-11-08) — or force it with plan.json "look": "night"|"white"
  const vj = path.join(ROOT, 'videos', slug, 'video.json');
  const night = plan.look ? plan.look === 'night' : fs.existsSync(vj) && JSON.parse(fs.readFileSync(vj, 'utf8')).lang === 'ar';
  const B = night ? {style: B0.nStyle, bg: B0.nBg, sheet: B0.nSheet} : B0;
  console.log(`look: ${night ? 'NIGHT (AZTIKA hero objects)' : 'white mode'}`);
  if (plan.images.length > 12) console.log(`WARNING: ${plan.images.length} images — the budget is 12 per video (Flow flags heavy use). Reuse library items.`);
  const prompts = plan.images.map((im) => {
    if (im.kind === 'bg') return B.bg.replace('<PLACE>', im.place).replace('<centre/lower middle>', im.open ?? 'centre') + ' ' + B.style;
    const list = (im.what ?? im.items).map((w, i) => `${i + 1}) ${w}`).join(', ');
    return B.sheet.replace('<LIST>', list) + ' ' + B.style;
  });
  fs.writeFileSync(path.join(vdir(slug), 'prompts.json'), JSON.stringify(prompts.map((p) => ({type: 'image', model: 'Nano Banana Pro', max_credits: 0, aspect_ratio: '16:9', download_quality: 'upscaled', prompt: p})), null, 1));
  fs.writeFileSync(path.join(vdir(slug), 'prompts.md'), `# Art prompts — ${slug}\nIf Flow refuses the automatic run: open Flow, pick **Nano Banana Pro** (0 credits), 16:9, and generate each prompt below\n(in this order). Save the images into \`input/\` named 01.jpg, 02.jpg, … and say "art is in input".\n\n` + prompts.map((p, i) => `## ${String(i + 1).padStart(2, '0')} · ${plan.images[i].kind === 'bg' ? 'background: ' + plan.images[i].name : 'objects: ' + plan.images[i].items.join(', ')}\n\`\`\`\n${p}\n\`\`\`\n`).join('\n'));
  console.log(`${prompts.length} prompts → videos/${slug}/art/prompts.json (Flow) + prompts.md (manual fallback). Flow project name: art-${slug}`);
} else if (cmd === 'ingest') {
  const slug = rest[0];
  const plan = JSON.parse(fs.readFileSync(path.join(vdir(slug), 'plan.json'), 'utf8'));
  const dir = a.dir ? path.resolve(a.dir) : path.join(FLOW_OUT, `art-${slug}`);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort() : [];
  const fileFor = (i) => files.find((f) => f.startsWith(`scene-${String(i + 1).padStart(2, '0')}.`)) ?? files.find((f) => f.startsWith(String(i + 1).padStart(2, '0') + '.'));
  const names = [];
  const missing = [];
  const checked = [];
  plan.images.forEach((im, i) => {
    const f = fileFor(i);
    if (!f) { missing.push(i + 1); return; }
    const src = path.join(dir, f);
    if (im.kind === 'bg') {
      const file = `bg/${im.name}.jpg`;
      fs.copyFileSync(src, path.join(LIB, file));
      const [w, h] = dims(path.join(LIB, file));
      index[im.name] = {kind: 'bg', tags: [...(im.tags ?? []), ...(plan.look === 'night' || isNightSlug(slug) ? ['night'] : [])], file, w, h, from: slug};
      names.push(im.name);
    } else {
      const tmp = path.join(ROOT, '.cache', 'art-cut', `${slug}-${i + 1}`);
      fs.rmSync(tmp, {recursive: true, force: true});
      const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'cutout.mjs'), src, '--out', tmp, '--holes'], {encoding: 'utf8'});
      const got = fs.existsSync(tmp) ? fs.readdirSync(tmp).filter((x) => x.endsWith('.png')).sort() : [];
      if (got.length !== im.items.length) console.log(`  ! sheet ${i + 1}: found ${got.length} objects, expected ${im.items.length} — check .cache/art-cut/${slug}-${i + 1} (objects may touch); names follow reading order`);
      got.forEach((g, k) => {
        const n = im.items[k] ?? `${slug}-obj-${i + 1}-${k + 1}`;
        const file = `el/${n}.png`;
        fs.copyFileSync(path.join(tmp, g), path.join(LIB, file));
        const [w, h] = dims(path.join(LIB, file));
        const chk = checkPng(path.join(LIB, file));
        checked.push({...chk, file: path.join(LIB, file), name: n});
        index[n] = {kind: 'el', tags: [...(im.tags ?? []), ...(plan.look === 'night' || isNightSlug(slug) ? ['night'] : [])], file, w, h, from: slug, ...(chk.ok ? {} : {check: chk.flags})};
        console.log(`  ${chk.ok ? '✓' : '✗'} ${n}${chk.ok ? '' : '  ' + chk.flags.join(' · ')}`);
        names.push(n);
      });
      if (r.status !== 0) console.log(r.stdout + r.stderr);
    }
  });
  save();
  if (checked.length) {
    const sheet = reviewSheet(checked, path.join(vdir(slug), 'review.jpg'));
    const bad = checked.filter((c) => !c.ok).length;
    console.log(`ART CHECK: ${checked.length - bad} pass, ${bad} flagged → look at ${path.relative(ROOT, sheet)} (night sky + magenta)`);
  }
  use(slug, names);
  if (missing.length) console.log(`MISSING images: ${missing.join(', ')} — Flow refused or not finished. Owner fallback: videos/${slug}/art/prompts.md. Continue without them (kit white-mode scenes) or wait.`);
  console.log(`ingest: ${names.length} items added to the library and copied into public/${slug}/ (sizes in public/${slug}/art.json)`);
} else if (cmd === 'approve') {
  // after LOOKING at the review sheet: the flag was a false alarm (e.g. a real white part) → allow it in videos
  for (const n of rest) {
    if (!index[n]) { console.log(`  ✗ ${n}: not in the library`); continue; }
    index[n].approved = new Date().toISOString().slice(0, 10);
    console.log(`  ✓ ${n} approved (was: ${(index[n].check ?? ['no flags']).join(' · ')})`);
  }
  save();
} else if (cmd === 'check') {
  // re-check library items (all, or the names given) and refresh their flags
  const names = rest.length ? rest : Object.keys(index).filter((n) => index[n].kind === 'el');
  const res = names.filter((n) => index[n]).map((n) => ({...checkPng(path.join(LIB, index[n].file)), name: n}));
  for (const r of res) {
    if (r.ok) delete index[r.name].check; else index[r.name].check = r.flags;
    console.log(`  ${r.ok ? '✓' : index[r.name].approved ? '~' : '✗'} ${r.name}${r.ok ? '' : '  ' + r.flags.join(' · ') + (index[r.name].approved ? ' (approved)' : '')}`);
  }
  save();
  const sheet = reviewSheet(res, path.join(ROOT, '.cache', 'art-check', 'library.jpg'));
  console.log(`review sheet → ${path.relative(ROOT, sheet)}`);
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
  console.log('usage: node tools/art.mjs find <words…> | prompts <slug> | ingest <slug> [--dir d] | check [names…] | approve <names…> | use <slug> <names…> | add <file> --name n --kind bg|el --tags a,b');
}
