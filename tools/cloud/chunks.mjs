// Prints the GitHub Actions matrix of frame ranges for a parallel render.
// usage: node tools/cloud/chunks.mjs <slug> [from_s] [to_s] [chunk_s]   → "matrix=[{i,a,b},...]"
import fs from 'node:fs';

const [, , slug, fromS, toS, chunkS] = process.argv;
const FPS = 60;
const meta = JSON.parse(fs.readFileSync(`videos/${slug}/video.json`, 'utf8'));
const total = Math.ceil(meta.duration * FPS);
const a0 = fromS ? Math.max(0, Math.floor(Number(fromS) * FPS)) : 0;
const b0 = toS ? Math.min(total - 1, Math.ceil(Number(toS) * FPS) - 1) : total - 1;
const per = Math.max(600, Math.round(Number(chunkS || 75) * FPS));
const n = Math.min(20, Math.max(1, Math.ceil((b0 - a0 + 1) / per)));
const size = Math.ceil((b0 - a0 + 1) / n);
const out = [];
for (let i = 0; i < n; i++) {
  const a = a0 + i * size;
  const b = Math.min(b0, a + size - 1);
  if (a <= b) out.push({i: String(i).padStart(2, '0'), a, b});
}
console.log(`matrix=${JSON.stringify(out)}`);
