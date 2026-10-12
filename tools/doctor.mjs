// Preflight: checks everything a production session needs and says exactly how to fix what's missing.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT} from './lib/render.mjs';
import {sh} from './lib/sys.mjs';

let bad = 0;
const ok = (m) => console.log(`✓ ${m}`);
const no = (m, fix) => {
  bad++;
  console.log(`✗ ${m}\n    → ${fix}`);
};

const major = Number(process.versions.node.split('.')[0]);
major >= 20 ? ok(`node ${process.versions.node}`) : no(`node ${process.versions.node} is too old`, 'install Node.js 20+ (winget install OpenJS.NodeJS.LTS)');

if (!fs.existsSync(path.join(ROOT, 'node_modules', 'remotion'))) {
  console.log('… installing dependencies (first run, ~2 min)');
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--no-fund', '--no-audit'], {cwd: ROOT, stdio: 'inherit', shell: true});
  r.status === 0 ? ok('dependencies installed') : no('npm install failed', 'run: npm install   (in the studio folder)');
} else ok('dependencies');

const gitV = sh('git', ['--version'], {allowFail: true});
gitV ? ok(gitV) : no('git not found', 'winget install --id Git.Git -e');
const ghV = sh('gh', ['--version'], {allowFail: true});
if (!ghV) no('GitHub CLI not found', 'winget install --id GitHub.cli -e');
else {
  const st = spawnSync('gh', ['auth', 'status'], {encoding: 'utf8', env: {...process.env, PATH: `${process.env.PATH};C:\\Program Files\\GitHub CLI;C:\\Program Files\\Git\\cmd`}});
  const txt = (st.stdout ?? '') + (st.stderr ?? '');
  if (!/Logged in/.test(txt)) no('GitHub CLI not logged in', 'run in background: gh auth login --web --hostname github.com --git-protocol https --scopes workflow  → give the user the one-time code + https://github.com/login/device');
  else if (!/workflow/.test(txt)) no('GitHub token lacks the "workflow" scope', 'gh auth refresh -h github.com -s workflow (or the login command above with --scopes workflow)');
  else ok('GitHub login (with workflow scope)');
}
const remote = sh('git', ['remote', 'get-url', 'origin'], {allowFail: true});
remote ? ok(`GitHub repo: ${remote}`) : no('studio has no GitHub remote', 'ask the user for permission, then: gh repo create binly-studio --public --source . --push');

const input = fs.existsSync(path.join(ROOT, 'input')) ? fs.readdirSync(path.join(ROOT, 'input')).filter((f) => f.toLowerCase() !== 'readme.md') : [];
const aud = input.filter((f) => /\.(wav|mp3|m4a|flac|aac|ogg)$/i.test(f));
const txt = input.filter((f) => /\.(txt|md)$/i.test(f));
if (aud.length === 1) ok(`input voiceover: ${aud[0]}${txt.length ? ` · text: ${txt.join(', ')}` : ' · (no script — timing will use the transcription)'}`);
else console.log(`• input/: ${aud.length} audio file(s) — ${aud.length ? 'need exactly one' : 'empty (fine if you are continuing an existing video)'}`);
const active = fs.readFileSync(path.join(ROOT, 'src', 'active.ts'), 'utf8').match(/videos\/([^']+)'/)?.[1];
console.log(`• active video: ${active}`);
console.log(bad ? `\n${bad} problem(s) to fix first.` : '\nready.');
process.exit(bad ? 1 : 0);
