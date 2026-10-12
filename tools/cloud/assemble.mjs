// Joins rendered chunks (lossless concat) and muxes the final audio:
//   ORIGINAL voiceover (no processing, gain 1) + music stem + SFX stem → AAC 320k.
// usage: node tools/cloud/assemble.mjs <slug> [from_s] [to_s]     (expects chunks/, stems/, in/)
import fs from 'node:fs';
import path from 'node:path';
const FF = process.env.FFMPEG ?? "ffmpeg";
const FP = process.env.FFPROBE ?? "ffprobe";
import {execFileSync} from 'node:child_process';

const [, , slug, fromS, toS] = process.argv;
const run = (args) => execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...args], {stdio: 'inherit'});
fs.mkdirSync('final', {recursive: true});
const chunks = fs.readdirSync('chunks').filter((f) => /^chunk-\d+\.mp4$/.test(f)).sort();
if (!chunks.length) throw new Error('no chunks');
fs.writeFileSync('final/list.txt', chunks.map((c) => `file '${path.resolve('chunks', c)}'`).join('\n'));
run(['-f', 'concat', '-safe', '0', '-i', 'final/list.txt', '-c', 'copy', 'final/video-only.mp4']);

const vo = path.join('in', fs.readdirSync('in').find((f) => f.startsWith('voiceover.')));
const from = fromS ? Number(fromS) : 0;
const range = [];
if (fromS) range.push('-ss', String(from));
if (toS) range.push('-to', String(Number(toS)));
// voiceover is only resampled/upmixed for the container; its samples are not processed (no gain, EQ, compression)
const filter = '[1:a]aresample=48000,aformat=channel_layouts=stereo[v];[2:a]aresample=48000[m];[3:a]aresample=48000[s];[v][m][s]amix=inputs=3:normalize=0:duration=first[a]';
run([
  '-i', 'final/video-only.mp4',
  ...range, '-i', vo,
  ...range, '-i', 'stems/music.wav',
  ...range, '-i', 'stems/sfx.wav',
  '-filter_complex', filter,
  '-map', '0:v', '-map', '[a]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000',
  '-shortest', '-movflags', '+faststart',
  'final/video.mp4',
]);
console.log(`assembled final/video.mp4 from ${chunks.length} chunk(s)${fromS || toS ? ` (range ${fromS || 0}–${toS || 'end'} s)` : ''}`);
