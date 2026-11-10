# What's installed — use these directly (don't search for alternatives)
Everything below is installed, tested and wired into the Studio. Prefer it. Only install something new if a real need
isn't covered: npm packages → pin the exact version, check the licence, note it here; system programs (Python, Blender,
full ffmpeg, …) → ask the user first. Never use network resources at render time.

## This PC (Windows 10, i5-3340 4 cores, ~14 GB RAM, Intel HD graphics — slow)
- **Node.js 24 + npm**, **Git**, **GitHub CLI `gh`** (logged in as AmrKha1, `workflow` scope) — on PATH; if a shell can't find
  git/gh, prepend `C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI`.
- **Remotion 4.0.534** (React video) + its own headless Chrome — local use: stills, contact sheets, live preview only.
- **ffmpeg / ffprobe (limited, bundled)**: `node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe` / `ffprobe.exe`
  (`tools/lib/sys.mjs` exports `FFMPEG`, `FFPROBE`). Can decode audio → 16-bit WAV, probe files, encode AAC/MP4.
  Cannot: raw-PCM pipes, `null` output, many filters (tile, drawtext, entropy). Anything heavier runs in the cloud.
- **NOT installed (by design):** Python, Blender, full ffmpeg, GPU 3D. Final renders never run locally.
- PowerShell blocks `npm`/`npx` scripts → use `node tools/…`, `npx.cmd`, or the Bash tool.

## The cloud (GitHub Actions, free, repo AmrKha1/binly-studio)
- `node tools/cloud.mjs analyze <slug>` → Ubuntu runner, Python 3.12 + **faster-whisper** transcription + script alignment.
- `node tools/cloud.mjs render <slug>` → parallel chunked Remotion render, **full ffmpeg** (concat, audio mix, QA filters),
  music/SFX generation, QA report + contact sheets. Large media lives in GitHub **release** assets (`vo-<slug>`).

## npm libraries in the project (import directly)
- `remotion` (core), `@remotion/cli|bundler|renderer` (tools use them)
- `@remotion/layout-utils` — `measureText`, `fitText`, `fillTextBox`: exact text widths / fit text to a box
- `@remotion/paths` — `evolvePath` (draw a path on), `interpolatePath` (morph shapes), `getLength`, `getPointAtLength`,
  `getTangentAtLength` (move objects along a path), `parsePath`, `scalePath`, `translatePath`
- `@remotion/shapes` — `makeCircle|Rect|Triangle|Star|Polygon|Pie|Ellipse` (+ React components) for crisp geometric shapes
- `@remotion/noise` — `noise2D/3D/4D(seed, x, y…)` smooth deterministic noise for organic motion (complements `noise1` in kit/anim)
- `@remotion/media-utils`, `@remotion/captions`, `@remotion/paths` (already present)
- `d3-geo`, `topojson-client`, `world-atlas` (maps/globe — used by kit/geo and kit/depth)
- Fonts: `@fontsource/poppins` (English, all text) · `@fontsource/baloo-bhaijaan-2` + `@fontsource/marhey` (Arabic) ·
  Caveat (rare hand notes); Fraunces/Inter only as fallbacks
- Canvas and SVG are native in Remotion's Chrome — no install needed. Three.js/Lottie/anime.js are deliberately NOT used
  (slow without GPU, off-style, or not frame-deterministic).

## The Studio's own tools (see CLAUDE.md commands table) and kit (docs/KIT.md)
Kit: stage/camera/shots, text, cards, diagrams, data, icons (64), env, people, science, geo, depth (globe/isometric/spheres),
photo + archival image templates, 12+ shot templates, fx, music/SFX engine (code-generated, copyright-free).
Images: `tools/photo.mjs` (Wikimedia Commons, free licences only, credits automatic).
Silhouettes: `tools/silhouette.mjs` (PhyloPic organism shapes → shared library `src/assets/silhouettes`, recolourable via `Silhouette`).

## Reference videos (the look we aim for) — `tools/watch.mjs`
The owner's model videos live in `references/<name>/` (the .mp4 stays local/git-ignored; all learned material is committed).
Read `references/<name>/STUDY.md` first (the director's analysis), then `report.md` (pace/colour/sound numbers),
`overview/min-NN.jpg` (frame every 3 s) and `shots/shots-NN.jpg` (every shot). To look closer: `watch.mjs sheet <ref> --from a --to b`,
`strip <ref> --at t` (dense frames = how a move animates), `frames <ref> --at t` (full res), `audio <ref> --from a --to b`
(loudness + words = the sound rhythm), `transcript <ref>`. New reference: `watch.mjs ingest <file> --as <name>` then `transcribe <name>`.

## Voiceover prep + delivery loudness (owner 2026-11-08)
`tools/vo-prep.mjs` (run by new-video): parts → equal loudness (ITU-R BS.1770 LUFS, one gain per part) → joined in number
order with exactly 0.35 s room tone between parts → pauses > 0.23 s inside parts → 0.19 s → `videos/<slug>/voiceover.wav` (48 kHz 24-bit, −20 LUFS) + `.prep.json` report. The cloud
render masters the final mix to −14 LUFS / −1 dBTP (two-pass loudnorm, linear) and checks the delivered file.
`tools/vo-check.mjs` (run by new-video right after vo-prep) = the voice gate: 16 independent checks (loudness whole +
per part, peaks/clipping, DC, pauses, joins, cuts in silence, clicks at edits + anywhere, start/end, over-trim, noise
floor, mains hum, clipping in the original parts, even delivery) → vo-check.md; FAIL stops, WARN needs `--vo-ok`.

## YouTube master (owner 2026-11-08)
Chunks render near-lossless (`--color-space=bt709 --jpeg-quality=100 --crf=12`), then assemble encodes ONCE to YouTube's
upload spec (tools/cloud/youtube.mjs, support.google.com/youtube/answer/1722171): MP4, H.264 High, yuv420p, BT.709
tagged, CFR 60, closed GOP 0.5 s, 2 B-frames, CRF 12 VBR + aq-mode 3 (no banding in dark gradients), AAC-LC 384k 48 kHz
stereo, faststart, audio −14 LUFS / −1 dBTP. The QA report lists every spec check. `cloud.mjs render <slug> --yt 1440` =
optional 2560×1440 upscale (YouTube gives 1440p+ its better codecs; A/B test it once). `tools/youtube-export.mjs` does
the same for any existing file. This PC also has a FULL ffmpeg on PATH (winget Gyan.FFmpeg 9.0.2) — the export tool uses it.

## Optional, outside the Studio
- **Google Flow** via the `flow` MCP server (spare Google account) — AI-generated images/clips. Off-style for the main video;
  possible use: thumbnails/background plates. Stills free, video clips cost credits — always ask the user before spending.
  Installed 2026-11-08 after a security review: **GTAI-1/flow-mcp** pinned at commit `1d17b7b` in `C:/Users/amrou/flow-mcp`
  (npm ci --ignore-scripts, all 193 deps from registry.npmjs.org, no install scripts; talks only to flow.google.com,
  huggingface.co, Google APIs; panel bound to 127.0.0.1). Registered user-scope in ~/.claude.json as `flow` (backup:
  ~/.claude.json.backup-before-flow-2026-11-08). Its Chrome uses its OWN profile (~/.flow-mcp/chrome-profile) — sign in
  there by hand with the SPARE Google account (`node dist/login.js` in that folder); while that Chrome is open its
  debugging port 9333 is reachable by programs on this PC only. Update = review the new commits first, then git pull,
  npm ci --ignore-scripts, npm run build. Tools: flow_status, flow_generate, flow_wait, flow_download, flow_agent_images …

## Art check gate — tools/art-check.mjs (2026-11-10)
Every generated object is cut out of its white sheet by tools/cutout.mjs (`--holes` for objects: card frames drawn by the
model are removed, enclosed white gaps like trophy handles opened; characters never use --holes because of AZTIKA's white
face), then checked: HOLE · FRINGE · SPECKS · CUT · SMALL. `art.mjs ingest` runs it and writes videos/<slug>/art/review.jpg
(night sky + magenta). Flagged items are refused by `art.mjs use` until regenerated or `art.mjs approve <name>` after looking.
Standalone: `node tools/art-check.mjs <folder|png…> [--sheet out.jpg]` (exit 2 when anything is flagged).
