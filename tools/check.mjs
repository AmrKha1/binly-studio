// Fast correctness gate: TypeScript typecheck + determinism lint. Run after every edit batch.
//   node tools/check.mjs            (whole project)
//   node tools/check.mjs --quiet    (only errors)
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT} from './lib/render.mjs';

const problems = [];

// 1) determinism lint on kit + videos (Root/gallery may read the frame; scenes must take `t` as a prop)
const banned = [
  [/Math\.random\s*\(/, 'Math.random() — use rand(seed) from kit/anim (deterministic)'],
  [/\bDate\.now\s*\(|new Date\s*\(/, 'Date — animation must depend only on t'],
  [/\bset(Timeout|Interval)\s*\(/, 'timers — animation must depend only on t'],
  [/\buse(State|Effect|Reducer)\s*\(/, 'React state/effects — scenes must be pure functions of t'],
  [/\buseCurrentFrame\s*\(/, 'useCurrentFrame() inside a scene — take `t` as a prop instead (contact sheets render scenes at arbitrary t)'],
  [/requestAnimationFrame/, 'requestAnimationFrame — not seek-safe'],
  [/https?:\/\/(?!www\.w3\.org)/, 'network URL — all assets must be local'],
];
const walk = (d) => fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.(tsx?|jsx?)$/.test(e.name) ? [path.join(d, e.name)] : []));
// scope: the kit + the ACTIVE video only (old videos don't need re-checking; keeps checks fast as the channel grows)
const activeSlug = fs.readFileSync(path.join(ROOT, 'src', 'active.ts'), 'utf8').match(/videos\/([^']+)'/)?.[1] ?? '_empty';
for (const dir of ['src/kit', `src/videos/${activeSlug}`]) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of walk(abs)) {
    const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
    lines.forEach((ln, i) => {
      if (/^\s*(\/\/|\*)/.test(ln)) return;
      for (const [re, why] of banned) if (re.test(ln)) problems.push(`${path.relative(ROOT, f)}:${i + 1}  ${why}`);
    });
  }
}

// 1b) phone-readability warnings (active video only — warns, never fails): literal text sizes under 36 px.
//     26–35 px is fine ONLY for image credits / source notes; text the viewer must read needs ≥ 48 (ALL-CAPS labels ≥ 40).
const small = [];
const vdir = path.join(ROOT, 'src', 'videos', activeSlug);
if (fs.existsSync(vdir)) {
  for (const f of walk(vdir)) {
    fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((ln, i) => {
      if (/^\s*(\/\/|\*)/.test(ln)) return;
      for (const m of ln.matchAll(/\b(fontSize|size|labelSize|bodySize|noteSize)\s*[=:]\s*\{?\s*(\d+(?:\.\d+)?)\b/g)) {
        const v = Number(m[2]);
        // fontSize always counts; a bare `size` only on a line that draws text (not icons/shapes)
        if (v >= 8 && v < 36 && (m[1] !== 'size' || /<(Para|RichText|Kicker|Tag|Headline|Callout|HandNote|ScreenText|NameTag|Note|SpeechBubble|Lbl|Node|Flow|Cycle|Bracket|CityDot|LabelPlate|LowerThird)\b/.test(ln))) {
          small.push(`${path.relative(ROOT, f)}:${i + 1}  ${m[1]} ${v}`);
        }
      }
    });
  }
}

// 1c) LANGUAGE GUARD (owner 2026-10-21: an English video must never contain Arabic or AZTIKA, an Arabic video never
//     English sentences or ODDESTORY). Scans the active video's code + its on-screen data files. Errors FAIL the check.
const langErr = [];
const langWarn = [];
{
  const vj = path.join(ROOT, 'videos', activeSlug, 'video.json');
  const lang = fs.existsSync(vj) ? (JSON.parse(fs.readFileSync(vj, 'utf8')).lang ?? 'en') : 'en';
  const AR = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
  const files = [];
  if (fs.existsSync(vdir)) files.push(...walk(vdir));
  for (const extra of ['chapters.json', 'art/plan.json']) {
    const f = path.join(ROOT, 'videos', activeSlug, extra);
    if (fs.existsSync(f)) files.push(f);
  }
  const shotsDir = path.join(ROOT, 'videos', activeSlug, 'shots');
  if (fs.existsSync(shotsDir)) for (const f of fs.readdirSync(shotsDir)) if (f.endsWith('.json')) files.push(path.join(shotsDir, f));
  for (const f of files) {
    const rel = path.relative(ROOT, f);
    if (/speech\.ts$/.test(f)) continue; // generated from the voiceover itself
    fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((ln, i) => {
      const code = ln.replace(/\/\/.*$/, '');
      if (/^\s*(\*|\/\*)/.test(ln)) return;
      const at = `${rel}:${i + 1}`;
      if (lang === 'en') {
        if (AR.test(code)) langErr.push(`${at}  Arabic text in an ENGLISH video`);
        if (/who=["']aztika["']|['"]aztika['"]/.test(code)) langErr.push(`${at}  AZTIKA (Arabic host) in an ENGLISH video — use ODDESTORY (or omit who)`);
        if (/<Host\b/.test(code)) langErr.push(`${at}  code-drawn AZTIKA <Host> in an ENGLISH video — use <ImageHost> (ODDESTORY)`);
      } else {
        if (/who=["']oddestory["']|['"]oddestory['"]/.test(code)) langErr.push(`${at}  ODDESTORY (English host) in an ARABIC video — use AZTIKA (or omit who)`);
        // on-screen English: string props/JSX text with 2+ consecutive English words (names/units/numbers alone are fine)
        const strs = [...code.matchAll(/(?:text|title|kicker|label|sub|caption|name|note)\s*[=:]\s*["'`]([^"'`]*)["'`]|>\s*([^<>{}]*[A-Za-z][^<>{}]*)\s*</g)].map((m) => m[1] ?? m[2] ?? '');
        for (const s of strs) if (/[A-Za-z]{2,}\s+[A-Za-z]{2,}/.test(s) && !AR.test(s)) langErr.push(`${at}  English on-screen text in an ARABIC video: "${s.trim().slice(0, 40)}"`);
        // (no soft warnings: code props like kind="caution" are not on-screen text)
      }
    });
  }
}

// 2) typecheck
const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'tsconfig.json'), 'utf8'));
const scoped = {...base, include: ['../src/*.ts', '../src/*.tsx', '../src/kit', '../src/gallery', '../src/assets', '../src/videos/_empty', `../src/videos/${activeSlug}`]};
fs.mkdirSync(path.join(ROOT, '.cache'), {recursive: true});
fs.writeFileSync(path.join(ROOT, '.cache', 'tsconfig.check.json'), JSON.stringify(scoped));
const tsc = spawnSync(process.execPath, [path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit', '-p', path.join(ROOT, '.cache', 'tsconfig.check.json')], {encoding: 'utf8', cwd: ROOT});
const tsOut = (tsc.stdout + tsc.stderr).trim();
const tsErrors = tsOut ? tsOut.split(/\r?\n/).filter((l) => /error TS/.test(l)) : [];

if (problems.length) {
  console.log(`DETERMINISM: ${problems.length} problem(s)`);
  problems.slice(0, 40).forEach((p) => console.log('  ' + p));
}
if (tsErrors.length) {
  console.log(`TYPESCRIPT: ${tsErrors.length} error(s)`);
  tsErrors.slice(0, 40).forEach((p) => console.log('  ' + p));
}
if (langErr.length) {
  console.log(`LANGUAGE: ${langErr.length} error(s) — the video mixes languages or uses the other channel's host:`);
  langErr.slice(0, 40).forEach((p) => console.log('  ' + p));
}
if (langWarn.length) langWarn.slice(0, 10).forEach((p) => console.log('  (warning) ' + p));
if (small.length) {
  console.log(`PHONE TEXT (warning): ${small.length} text size(s) under 36 px — OK only for image credits / source notes; text the viewer must read ≥ 48 (caps labels ≥ 40). Check with sheet.mjs --phone:`);
  small.slice(0, 30).forEach((p) => console.log('  ' + p));
}
if (!problems.length && !tsErrors.length && !langErr.length) console.log('check OK (typecheck + determinism lint + language guard)');
process.exit(problems.length || tsErrors.length || langErr.length ? 1 : 0);
