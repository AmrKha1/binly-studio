// Process helpers: git / gh / bundled ffprobe+ffmpeg, with Windows PATH fixes.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT} from './render.mjs';

const extra = ['C:\\Program Files\\Git\\cmd', 'C:\\Program Files\\GitHub CLI'];
const env = {...process.env, PATH: [process.env.PATH ?? process.env.Path ?? '', ...extra].join(path.delimiter), GH_PROMPT_DISABLED: '1'};

/** Run a command; returns stdout (trimmed). Throws with stderr on failure unless allowFail. */
export function sh(cmd, args, {allowFail = false, cwd = ROOT, input} = {}) {
  const r = spawnSync(cmd, args, {cwd, env, encoding: 'utf8', input, maxBuffer: 1 << 28, shell: false});
  if (r.error) {
    if (allowFail) return null;
    throw new Error(`${cmd} not found or failed to start: ${r.error.message}`);
  }
  if (r.status !== 0) {
    if (allowFail) return null;
    throw new Error(`${cmd} ${args.join(' ')} failed (exit ${r.status}):\n${(r.stderr || r.stdout || '').trim().slice(-1500)}`);
  }
  return (r.stdout ?? '').trim();
}
export const git = (...a) => sh('git', a);
export const gh = (...a) => sh('gh', a);

const COMP = path.join(ROOT, 'node_modules', '@remotion', process.platform === 'win32' ? 'compositor-win32-x64-msvc' : 'compositor-linux-x64-gnu');
export const FFPROBE = fs.existsSync(path.join(COMP, 'ffprobe.exe')) ? path.join(COMP, 'ffprobe.exe') : 'ffprobe';
export const FFMPEG = fs.existsSync(path.join(COMP, 'ffmpeg.exe')) ? path.join(COMP, 'ffmpeg.exe') : 'ffmpeg';

/** Audio file info via ffprobe: {duration, sampleRate, channels, codec}. */
export function probeAudio(file) {
  const out = JSON.parse(sh(FFPROBE, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]));
  const a = out.streams.find((s) => s.codec_type === 'audio');
  return {duration: +out.format.duration, sampleRate: +a.sample_rate, channels: a.channels, codec: a.codec_name};
}

/** owner/name of the GitHub repo of this studio. */
export function repoName() {
  return gh('repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner');
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const token = () => Math.random().toString(36).slice(2, 10);
