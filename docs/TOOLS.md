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

## Optional, outside the Studio
- **Google Flow** via the `flow` MCP server (spare Google account) — AI-generated images/clips. Off-style for the main video;
  possible use: thumbnails/background plates. Stills free, video clips cost credits — always ask the user before spending.
