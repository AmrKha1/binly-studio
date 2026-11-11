// RENDER GATE (owner 2026-11-11): "never render before it makes sure everything is working and in the best shape —
// check and fix, check and fix, until it says GO RENDER — fixing the REAL issues (what the viewer will see or feel),
// not personal preferences." Nothing renders (not even a preview) without this gate's GO stamp; cloud.mjs checks it.
//
//   node tools/render-gate.mjs --reviewed "what you looked at"     (run after build + review; loop until GO)
//
// Automatic checks (all must be clean — or the item accepted in videos/<slug>/gate-ok.json with a reason):
//   1 voice locked and unchanged · 2 project check (night look only, no raw photos, language, determinism, types)
//   · phone-size text · 3 plan-check (structure like the reference) · 4 sync-check (WEAK sentences, FROZEN and BLANK
//   frames) · 5 sound density (QUIET / LOW) · 6 every number on screen was SPOKEN (transcript/script) · 7 names
//   spelled as in the script (screen words one letter away from a spoken word) · 8 every image/file the video uses exists.
// The director's own review (items the tools cannot judge: cut-off/overlap, contrast, "would this frame fit inside the
// reference video?", YouTube-safe) is confirmed with --reviewed. Max 3 failing rounds → stop and report to the owner.
// GO = videos/<slug>/render-gate.json {go, fingerprint}: any later change to the video's code/sound/plan voids it.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, args} from './lib/render.mjs';
import {videoFingerprint} from './lib/render-gate-lock.mjs';

const a = args();
const slug = a.slug ?? fs.readFileSync(path.join(ROOT, 'src', 'active.ts'), 'utf8').match(/videos\/([^']+)'/)?.[1];
const vdir = path.join(ROOT, 'videos', slug), sdir = path.join(ROOT, 'src', 'videos', slug);
const stampFile = path.join(vdir, 'render-gate.json');
const lang = (() => { try { return JSON.parse(fs.readFileSync(path.join(vdir, 'video.json'), 'utf8')).lang ?? 'en'; } catch { return 'en'; } })();
const okList = (() => { try { return JSON.parse(fs.readFileSync(path.join(vdir, 'gate-ok.json'), 'utf8')).items ?? []; } catch { return []; } })();
const accepted = (line) => okList.find((o) => o.match && line.includes(o.match));
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const run = (tool, extra = []) => spawnSync(process.execPath, [path.join(ROOT, 'tools', tool), ...extra], {cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26});
const issues = []; // {check, line}
const add = (check, line) => { if (!accepted(line)) issues.push({check, line: line.trim()}); };
const t0 = Date.now();
console.log(`RENDER GATE ${slug} (${lang}) — checking what the viewer will see and hear…`);

const fingerprint = () => videoFingerprint(ROOT, slug);

// 1 voice lock
{
  const g = path.join(vdir, 'vo-gate.json');
  if (!fs.existsSync(g)) add('voice', 'the voiceover is not locked by the voice gate (run new-video / vo-check)');
}
// 2 project check (+ phone-size text in THIS video)
{
  const r = run('check.mjs');
  const out = r.stdout + r.stderr;
  if (r.status !== 0) out.split(/\r?\n/).filter((l) => /^\s+\S/.test(l) && /error|ARABIC|ENGLISH|white-look|raw photo|Math\.random|Date/.test(l)).slice(0, 30).forEach((l) => add('project check', l));
  if (r.status !== 0 && !issues.some((i) => i.check === 'project check')) add('project check', 'node tools/check.mjs failed — run it to see why');
  const small = out.split(/\r?\n/).filter((l) => l.includes(`src\\videos\\${slug}`) || l.includes(`src/videos/${slug}`)).filter((l) => /size|labelSize|fontSize/.test(l));
  small.forEach((l) => add('phone text', `${l.trim()} — under the phone floor (readable text ≥ 48 px, labels ≥ 34 px)`));
}
// 3 plan-check
{
  const r = run('plan-check.mjs', ['--slug', slug]);
  if (r.status !== 0) {
    // every plan-check flag is a line "  KEYWORD …" (STILL, LONG, SAME, FLAT, HOST, HOOK, SPINE, PACE, ENDING, CHAPTER, SCENE, NUMBER, FLOW…)
    const flags = (r.stdout + r.stderr).split(/\r?\n/).filter((l) => /^\s{2}[A-Z]{3,}\s/.test(l));
    (flags.length ? flags : ['plan-check has flags — run node tools/plan-check.mjs']).slice(0, 30).forEach((l) => add('plan', l));
  }
}
// 4 sync-check (renders small frames — the slow part)
if (!a['skip-sync']) {
  const r = run('sync-check.mjs', ['--slug', slug]);
  (r.stdout + r.stderr).split(/\r?\n/).filter((l) => /^\s+(WEAK|FROZEN|BLANK)\b/.test(l)).forEach((l) => add('sync', l));
  if (r.status !== 0 && !/sync-check:/.test(r.stdout)) {
    const img = (r.stdout + r.stderr).match(/Error loading image with src: (\S+)/);
    add('sync', img ? `the video cannot render: missing image ${img[1].replace(/^https?:\/\/[^/]+\/public\//, 'public/')} (see [files])` : 'sync-check did not finish (a render error) — run node tools/sync-check.mjs to see it');
  }
}
// 5 sound density (Arabic = the owner's pick B)
if (lang === 'ar') {
  const r = run('sfx-scan.mjs', ['--slug', slug]);
  (r.stdout + r.stderr).split(/\r?\n/).filter((l) => /^\s+(QUIET|LOW)\b/.test(l)).forEach((l) => add('sound', l));
}
// on-screen text of the video's own code (string props and JSX text)
const screen = [];
for (const f of walk(sdir).filter((x) => /\.(tsx|ts)$/.test(x) && !/speech\.ts$/.test(x))) {
  fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((ln, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(ln)) return;
    const at = `${path.relative(ROOT, f)}:${i + 1}`;
    for (const m of ln.matchAll(/\b(text|label|value|title|w|name|times|spoken|kicker|caption|place|lines)\s*[=:]\s*\{?\s*(["'`])((?:(?!\2).)*)\2/g)) screen.push({at, s: m[3]});
    for (const m of ln.matchAll(/\b(year)\s*=\s*\{\s*(\d{3,4})\s*\}/g)) screen.push({at, s: m[2]});
    // JSX text = text right before a CLOSING tag ("…</") — code like `t >= 14.1 && t < 21.0` never ends in "</"
    for (const m of ln.matchAll(/>\s*([^<>{}=&|]*[\p{L}\d][^<>{}=&|]*?)\s*<\//gu)) screen.push({at, s: m[1]});
  });
}
const transcript = (() => { try { return fs.readFileSync(path.join(vdir, 'timing', 'transcript.md'), 'utf8'); } catch { return ''; } })();
const script = (() => { try { return fs.readFileSync(path.join(vdir, 'script.txt'), 'utf8'); } catch { return ''; } })();
const spoken = transcript + '\n' + script;
// 6 numbers exactly as spoken
{
  const norm = (x) => x.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/٫/g, '.').replace(/[,٬ ]/g, '');
  const nums = (x) => [...norm(x).matchAll(/\d+(?:\.\d+)?/g)].map((m) => m[0].replace(/^0+(?=\d)/, ''));
  const said = new Set(nums(spoken));
  for (const {at, s} of screen) {
    if (/\$\{/.test(s)) continue; // computed strings are checked by eye
    for (const n of nums(s)) if (Number(n) >= 10 && !said.has(n)) add('numbers', `${at}  "${s.slice(0, 40)}" shows ${n} — never said like that (numbers exactly as spoken)`);
  }
}
// 7 names / words spelled as spoken (Arabic: a screen word one letter away from a spoken word = a typo)
{
  const normAr = (w) => w.replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
  const words = (x) => [...x.matchAll(lang === 'ar' ? /[ء-ي٠-٩ـً-ْ]+/g : /[A-Za-z][A-Za-z'-]+/g)].map((m) => m[0]);
  const vocab = new Set(words(spoken).map((w) => (lang === 'ar' ? normAr(w) : w.toLowerCase())));
  const lev1 = (x, y) => {
    if (Math.abs(x.length - y.length) > 1) return false;
    let i = 0, j = 0, d = 0;
    while (i < x.length && j < y.length) {
      if (x[i] === y[j]) { i++; j++; continue; }
      if (++d > 1) return false;
      if (x.length > y.length) i++; else if (y.length > x.length) j++; else { i++; j++; }
    }
    return d + (x.length - i) + (y.length - j) === 1;
  };
  const vlist = [...vocab].filter((v) => v.length >= 4);
  const seen = new Set();
  for (const {at, s} of screen) for (const w0 of words(s)) {
    const w = lang === 'ar' ? normAr(w0) : w0.toLowerCase();
    if (w.length < 4 || vocab.has(w) || seen.has(w)) continue;
    const near = vlist.find((v) => lev1(w, v));
    if (near) { seen.add(w); add('spelling', `${at}  "${w0}" — the voiceover/script says "${near}" (a misspelled word or name?)`); }
  }
}
// 8 every file the video uses exists
{
  const pub = path.join(ROOT, 'public');
  for (const f of walk(sdir).filter((x) => /\.(tsx|ts)$/.test(x))) {
    fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((ln, i) => {
      for (const m of ln.matchAll(/(?:staticFile\(\s*|src\s*[=:]\s*\{?\s*|photo\s*[=:]\s*\{?\s*|file\s*[=:]\s*\{?\s*)(["'`])([^"'`]+\.(?:png|jpe?g|webp|svg|gif|mp4|webm|wav|mp3|ogg|flac))\1/gi)) {
        const p = m[2].replace(/\$\{slug\}/g, slug).replace(/^\//, '');
        if (/\$\{/.test(p)) continue;
        if (!fs.existsSync(path.join(pub, p))) add('files', `${path.relative(ROOT, f)}:${i + 1}  uses "${m[2]}" — public/${p} does not exist (a broken / empty spot on screen)`);
      }
    });
  }
}
// the director's review (what tools cannot judge)
if (!a.reviewed) add('review', 'confirm your visual review with --reviewed "…": contact sheets of every chapter side by side with the reference (cut-off / overlap / contrast / "would this frame fit inside the reference video?" / YouTube-safe)');

// verdict
const prev = (() => { try { return JSON.parse(fs.readFileSync(stampFile, 'utf8')); } catch { return {rounds: 0, history: []}; } })();
const round = (prev.go ? 0 : prev.rounds ?? 0) + 1;
const fp = fingerprint();
const byCheck = {};
for (const i of issues) (byCheck[i.check] ??= []).push(i.line);
const min = ((Date.now() - t0) / 60000).toFixed(1);
if (!issues.length) {
  fs.writeFileSync(stampFile, JSON.stringify({go: true, slug, at: new Date().toISOString(), fingerprint: fp, reviewed: a.reviewed, accepted: okList, rounds: round, history: [...(prev.history ?? []), {at: new Date().toISOString(), issues: 0}]}, null, 1));
  console.log(`\n✅ GO RENDER — every check is clean (round ${round}, ${min} min). Stamp: ${path.relative(ROOT, stampFile)}`);
  console.log('   Any change to the video\'s code, sound cues or chapters after this voids the stamp → run the gate again.');
  process.exit(0);
}
fs.writeFileSync(stampFile, JSON.stringify({go: false, slug, at: new Date().toISOString(), rounds: round, history: [...(prev.history ?? []), {at: new Date().toISOString(), issues: issues.length}]}, null, 1));
console.log(`\n⛔ NOT READY — ${issues.length} real issue(s), round ${round} of 3 (${min} min):`);
for (const [c, ls] of Object.entries(byCheck)) {
  console.log(`\n[${c}] ${ls.length}`);
  ls.slice(0, 25).forEach((l) => console.log('  ' + l));
  if (ls.length > 25) console.log(`  … ${ls.length - 25} more`);
}
console.log(`\nFix what the VIEWER would see or feel (wrong number/name, unreadable, frozen, empty, broken, out of sync, off-look).
A flag that is a deliberate choice (e.g. a payoff hold) → accept it in videos/${slug}/gate-ok.json {"items":[{"match":"…","why":"…"}]}.
Personal preferences are not issues — don't churn on them. Then run the gate again (only what changed is re-checked by you).`);
if (round >= 3) console.log(`\nROUND ${round}: STOP fixing — tell the owner in plain words which real issues remain and why, and wait.`);
process.exit(1);
