// Live preview (Remotion Studio): player + timeline, updates within seconds when code changes.
//   node tools/preview.mjs            → http://localhost:3000   (no render needed; final export = cloud render)
// Works from any folder and avoids Windows' PowerShell block on npx.ps1.
import path from 'node:path';
import {spawn} from 'node:child_process';
import {ROOT} from './lib/render.mjs';

process.chdir(ROOT);
const cli = path.join(ROOT, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');
const port = process.argv[2] ?? '3000';
const child = spawn(process.execPath, [cli, 'studio', '--port', port, '--no-open'], {stdio: 'inherit', cwd: ROOT});
child.on('exit', (code) => process.exit(code ?? 0));
