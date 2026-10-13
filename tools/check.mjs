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
if (!problems.length && !tsErrors.length) console.log('check OK (typecheck + determinism lint)');
process.exit(problems.length || tsErrors.length ? 1 : 0);
