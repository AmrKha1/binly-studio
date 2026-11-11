// Shot compiler: chapter shot lists as DATA → chapter code. Template shots cost nothing to build; fixes are one-line edits.
//   node tools/compile-shots.mjs [--slug s] [C03]       (all chapters that have videos/<slug>/shots/Cxx.json, or one)
//
// videos/<slug>/shots/C03.json:
// {"shots": [
//   {"id":"S1","start":101.7,"template":"StatShot","props":{"value":"26","unit":"%","label":"of patients recovered","at":102.4,
//            "compare":{"kind":"dots","filled":26}}},
//   {"id":"S2","start":109.2,"custom":true,"note":"two people in the same room, one narrating, one in images","in":{"kind":"iris","x":1200,"y":500}},
//   {"id":"S3","start":121.0,"template":"QuoteShot","props":{"text":"…","source":"…"},"in":{"kind":"paper","dir":"left"}}
// ]}
// • start = absolute seconds; each shot ends where the next starts (last one at the chapter's end). a/b are filled in.
// • template shots: props are passed straight to the template (see docs/KIT.md → templates). EvidenceShot gets `slug` automatically.
// • custom shots: built by a builder in src/videos/<slug>/chapters/C03.custom.tsx as `export const S2: React.FC<{t:number}>`.
// Generates src/videos/<slug>/chapters/C03.tsx (owned by this tool — never edit it by hand) and creates C03.custom.tsx
// with placeholder components for missing custom shots (never overwrites existing ones).
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, args} from './lib/render.mjs';
import {requireVoice} from './lib/vo-gate.mjs';

const a = args();
const active = fs.readFileSync(path.join(ROOT, 'src', 'active.ts'), 'utf8').match(/videos\/([^']+)'/)?.[1];
const slug = a.slug ?? active;
const vdir = path.join(ROOT, 'videos', slug);
requireVoice(slug, 'building (compile-shots)');
const cdir = path.join(ROOT, 'src', 'videos', slug, 'chapters');
const chapters = JSON.parse(fs.readFileSync(path.join(vdir, 'chapters.json'), 'utf8'));
const shotNames = (f) => [...fs.readFileSync(path.join(ROOT, 'src', 'kit', f), 'utf8').matchAll(/^export const (\w+Shot)\b/gm)].map((m) => m[1]);
const ARCHIVAL = new Set(shotNames('archival.tsx')); // real-image templates (need slug → added automatically)
// ARABIC (AZTIKA, owner 2026-11-11): night templates (kit/night-templates) joined with NightShots like the reference —
// match dissolves by default, board shots keep their own camera, the host pinned in the hud ("host" in the shot list),
// "entries": "@board" = videos/<slug>/board.json (ONE board for the whole video: every return shows the same game).
const META = JSON.parse(fs.readFileSync(path.join(vdir, 'video.json'), 'utf8'));
const AR = META.lang === 'ar';
const NIGHT = new Set(shotNames('night-templates.tsx'));
const NIGHT_OF = {match: 'match', dissolve: 'dissolve', fade: 'dissolve', wipe: 'wipe', dip: 'wipe', ink: 'wipe', flash: 'flash', cut: 'cut', whoosh: 'match'};
const boardFile = path.join(vdir, 'board.json');
const TEMPLATES = AR ? NIGHT : new Set([...shotNames('templates.tsx'), ...ARCHIVAL]);
const shotsDir = path.join(vdir, 'shots');
const ids = a._.length ? a._ : fs.existsSync(shotsDir) ? fs.readdirSync(shotsDir).filter((f) => /^C\d+\.json$/.test(f)).map((f) => f.replace('.json', '')) : [];
if (!ids.length) {
  console.log(`no shot lists in videos/${slug}/shots/ (write Cxx.json files first)`);
  process.exit(1);
}

let problems = 0;
for (const id of ids) {
  const ch = chapters.find((c) => c.id === id);
  if (!ch) {
    console.log(`${id}: not in chapters.json`);
    problems++;
    continue;
  }
  const spec = JSON.parse(fs.readFileSync(path.join(shotsDir, `${id}.json`), 'utf8'));
  const shots = spec.shots ?? spec;
  const errs = [];
  shots.forEach((s, i) => {
    if (typeof s.start !== 'number') errs.push(`${s.id ?? i}: missing numeric start`);
    if (i && s.start <= shots[i - 1].start) errs.push(`${s.id}: start must increase`);
    if (!s.custom && !TEMPLATES.has(s.template)) errs.push(`${s.id}: unknown template "${s.template}" (have: ${[...TEMPLATES].join(', ')})`);
  });
  if (shots[0] && Math.abs(shots[0].start - ch.start) > 0.05) errs.push(`first shot should start at the chapter start ${ch.start}`);
  if (errs.length) {
    console.log(`${id}: ${errs.join('; ')}`);
    problems++;
    continue;
  }
  const usedAll = [...new Set(shots.filter((s) => !s.custom).map((s) => s.template))];
  const used = usedAll.filter((n) => !ARCHIVAL.has(n));
  const usedArch = usedAll.filter((n) => ARCHIVAL.has(n));
  const customs = shots.filter((s) => s.custom);
  if (AR) {
    const board = fs.existsSync(boardFile) ? JSON.parse(fs.readFileSync(boardFile, 'utf8')) : null;
    const lines = shots.map((s, i) => {
      const b = i + 1 < shots.length ? shots[i + 1].start : ch.end;
      const join = s.in ? `, in: ${JSON.stringify({...s.in, kind: NIGHT_OF[s.in.kind] ?? 'match'})}` : '';
      const drift = s.drift !== undefined ? `, drift: ${JSON.stringify(s.drift)}` : s.template === 'BoardShot' ? ', drift: false' : '';
      if (s.custom) return `      // ${s.id} · ${s.start.toFixed(2)}–${b.toFixed(2)} · custom: ${(s.note ?? '').replace(/\n/g, ' ').slice(0, 110)}\n      {start: ${s.start}${join}${drift}, render: (t: number) => <Custom.${s.id} t={t} />},`;
      let props = {...(s.props ?? {})};
      if (props.entries === '@board') {
        if (!board) throw new Error(`${id} ${s.id}: "entries": "@board" but videos/${slug}/board.json does not exist`);
        props = {...board, ...props, entries: board.entries};
      }
      return `      // ${s.id} · ${s.start.toFixed(2)}–${b.toFixed(2)} · ${s.template}\n      {start: ${s.start}${join}${drift}, render: (t: number) => <${s.template} t={t} a={${s.start}} b={${b}} {...(${JSON.stringify(props)} as Omit<React.ComponentProps<typeof ${s.template}>, 't' | 'a' | 'b'>)} />},`;
    });
    const used = [...new Set(shots.filter((x) => !x.custom).map((x) => x.template))];
    const customs = shots.filter((x) => x.custom);
    // AZTIKA's beats, planned per shot ("host": [{"at", "spot", "pose", "why"}, {"at", "off": true}] — plan-check reads the
    // same data) → host SEGMENTS: he rises in softly, moves/poses on his beats, fades out on "off", and may come back
    const beats = shots.flatMap((x) => x.host ?? []).sort((p, q) => p.at - q.at);
    const segs = [];
    let seg = null;
    for (const hb of beats) {
      if (hb.off) { if (seg) { seg.exit = hb.at; segs.push(seg); seg = null; } continue; }
      if (!seg) seg = {start: hb.at, enter: hb.enter ?? 'riseSoft', spots: [], poses: []};
      if (hb.spot || hb.x !== undefined) seg.spots.push(Object.fromEntries(Object.entries({at: hb.at, spot: hb.spot, x: hb.x, y: hb.y, h: hb.h, flip: hb.flip, move: hb.move}).filter(([, v]) => v !== undefined)));
      if (hb.pose) seg.poses.push([hb.at, hb.pose]);
    }
    if (seg) segs.push(seg);
    const tracks = segs.map((g, k) => {
      const props = {spots: g.spots.length ? g.spots : [{at: g.start, spot: 'sideLeft'}], poses: g.poses.length ? g.poses : [[g.start, 'present']], enter: {kind: g.enter, at: g.start}, ...(g.exit !== undefined ? {exit: {kind: 'fadeOut', at: g.exit, dur: 0.3}} : {})};
      return `{t >= ${(g.start - 0.05).toFixed(2)}${g.exit !== undefined ? ` && t < ${(g.exit + 0.4).toFixed(2)}` : ''} && <HostTrack t={t} id="host-${id}-${k}" {...(${JSON.stringify(props)} as Omit<React.ComponentProps<typeof HostTrack>, 't' | 'id'>)} />}`;
    });
    const host = tracks.length ? `\n          hud={(t: number) => (\n            <>\n              ${tracks.join('\n              ')}\n            </>\n          )}` : '';
    const code = `// GENERATED by tools/compile-shots.mjs from videos/${slug}/shots/${id}.json — do not edit; change the JSON and re-run.
// Custom shots live in ./${id}.custom.tsx (builder-owned). AZTIKA: night templates joined like the reference (NightShots).
import React from 'react';
import {Stage} from '../../../kit/stage';
import {${shots.some((x) => x.host?.length) ? 'HostTrack, ' : ''}NightScreen} from '../../../kit/night';
import {NightShots} from '../../../kit/night-scenes';
${used.length ? `import {${used.join(', ')}} from '../../../kit/night-templates';\n` : ''}${customs.length ? `import * as Custom from './${id}.custom';\n` : ''}
// ${id} · ${ch.start.toFixed(2)}–${ch.end.toFixed(2)} s · "${ch.title ?? ''}" · ${shots.length} shots (${shots.length - customs.length} template, ${customs.length} custom)
export const ${id}: React.FC<{t: number}> = ({t}) => (
  <Stage bg="#0F062B">
    <NightScreen>
      <NightShots
        t={t}
        shots={[
${lines.join('\n')}
        ]}${host}
      />
    </NightScreen>
  </Stage>
);
`;
    fs.writeFileSync(path.join(cdir, `${id}.tsx`), code);
    let added = 0;
    if (customs.length) {
      const cf = path.join(cdir, `${id}.custom.tsx`);
      let cur = fs.existsSync(cf) ? fs.readFileSync(cf, 'utf8') : `// Custom shots for ${id} (builder-owned, AZTIKA). Each: export const S<n>: React.FC<{t: number}> returning the shot's WORLD\n// (SVG, no <Stage>/<NightScreen> — the chapter provides them; NightShots joins, drifts and pins the host).\nimport React from 'react';\nimport {GlowText, NightSky} from '../../../kit/night';\n`;
      for (const x of customs) {
        if (new RegExp(`export const ${x.id}\\b`).test(cur)) continue;
        cur += `\n// ${x.id} — PLACEHOLDER (custom shot, not built yet): ${(x.note ?? '').replace(/\n/g, ' ').slice(0, 140)}\nexport const ${x.id}: React.FC<{t: number}> = ({t}) => (\n  <>\n    <NightSky t={t} id="ph-${id}-${x.id}" />\n    <GlowText text={${JSON.stringify((x.note ?? x.id).slice(0, 40))}} x={960} y={540} size={56} id="pht-${id}-${x.id}" />\n  </>\n);\n`;
        added++;
      }
      fs.writeFileSync(cf, cur);
    }
    console.log(`${id}: ${shots.length} shots → ${id}.tsx (night: ${shots.length - customs.length} template, ${customs.length} custom${added ? `, ${added} new placeholder(s)` : ''})`);
    continue;
  }
  const lines = shots.map((s, i) => {
    const b = i + 1 < shots.length ? shots[i + 1].start : ch.end;
    const tin = s.in ? `, in: ${JSON.stringify(s.in)}` : '';
    if (s.custom) return `    // ${s.id} · ${s.start.toFixed(2)}–${b.toFixed(2)} · custom: ${(s.note ?? '').replace(/\n/g, ' ').slice(0, 110)}\n    {start: ${s.start}${tin}, render: (t: number) => <Custom.${s.id} t={t} />},`;
    const props = {...(s.props ?? {})};
    if ((s.template === 'EvidenceShot' || ARCHIVAL.has(s.template)) && !props.slug) props.slug = slug;
    return `    // ${s.id} · ${s.start.toFixed(2)}–${b.toFixed(2)} · ${s.template}\n    {start: ${s.start}${tin}, render: (t: number) => <${s.template} t={t} a={${s.start}} b={${b}} {...(${JSON.stringify(props)} as const)} />},`;
  });
  const code = `// GENERATED by tools/compile-shots.mjs from videos/${slug}/shots/${id}.json — do not edit; change the JSON and re-run.
// Custom shots live in ./${id}.custom.tsx (builder-owned).
import React from 'react';
import {Shots} from '../../../kit/shots';
${used.length ? `import {${used.join(', ')}} from '../../../kit/templates';\n` : ''}${usedArch.length ? `import {${usedArch.join(', ')}} from '../../../kit/archival';\n` : ''}${customs.length ? `import * as Custom from './${id}.custom';\n` : ''}
// ${id} · ${ch.start.toFixed(2)}–${ch.end.toFixed(2)} s · "${ch.title ?? ''}" · ${shots.length} shots (${shots.length - customs.length} template, ${customs.length} custom)
export const ${id}: React.FC<{t: number}> = ({t}) => (
  <Shots
    t={t}
    shots={[
${lines.join('\n')}
    ]}
  />
);
`;
  fs.writeFileSync(path.join(cdir, `${id}.tsx`), code);
  // custom stubs
  if (customs.length) {
    const cf = path.join(cdir, `${id}.custom.tsx`);
    let cur = fs.existsSync(cf) ? fs.readFileSync(cf, 'utf8') : `// Custom shots for ${id} (builder-owned). Each: export const S<n>: React.FC<{t: number}> returning a full <Stage>.\nimport React from 'react';\nimport {Stage} from '../../../kit/stage';\nimport {TitleCard} from '../../../kit/text';\nimport {C} from '../../../kit/theme';\n`;
    let added = 0;
    for (const s of customs) {
      if (new RegExp(`export const ${s.id}\\b`).test(cur)) continue;
      cur += `\n// ${s.id} — PLACEHOLDER (custom shot, not built yet): ${(s.note ?? '').replace(/\n/g, ' ').slice(0, 140)}\nexport const ${s.id}: React.FC<{t: number}> = () => (\n  <Stage bg={C.paperShade}>\n    <TitleCard kicker="custom shot · ${id} ${s.id}" title={${JSON.stringify((s.note ?? s.id).slice(0, 48))}} p={1} size={44} />\n  </Stage>\n);\n`;
      added++;
    }
    fs.writeFileSync(cf, cur);
    console.log(`${id}: ${shots.length} shots → ${id}.tsx (${shots.length - customs.length} template, ${customs.length} custom${added ? `, ${added} new custom placeholder(s) in ${id}.custom.tsx` : ''})`);
  } else console.log(`${id}: ${shots.length} shots → ${id}.tsx (all templates)`);
}
process.exit(problems ? 1 : 0);
