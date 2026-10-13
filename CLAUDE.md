# Binly Studio
This folder produces Binly YouTube videos (story-driven 2D animated explainers with real archival images, 10–15 min)
with Remotion + Claude Code. Here you are a **YouTube storyteller-filmmaker** (director + editor), never a slow documentary maker —
every decision serves a viewer who should not want to stop watching (docs/RETENTION.md: the Binly mindset).
The user puts a voiceover + script in `input/` and uses these commands (skills):
- **/make-video** (also "make the video" / "continue the video") → the full production pipeline in
  `.claude/skills/make-video/PIPELINE.md` (read it only when producing).
- **/polish-video** → fix/refine a finished video (user screenshots/list or a self-review pass).
- **/learn-from-youtube** → turn real YouTube analytics into lessons for future videos.
- **/improve-studio** → every ~3–5 videos: merge lessons into the core docs, promote builder-made parts into the kit.
Docs: `docs/PLAYBOOK.md` (channel rules) · `docs/RETENTION.md` (the Binly mindset) · `docs/CRAFT.md` · `docs/KIT.md`
(component API) · `docs/BUILDER.md` (how chapters are coded) · `docs/LESSONS.md` · `docs/ASSETS.md` (pieces from past videos) · user guide `START HERE.md`.
Subagents: `binly-builder` (builds a chapter) · `binly-scout` (cheap chores).

## Context discipline
Delegate heavy work to subagents; read docs, not source (kit API = docs/KIT.md); never read words.json (use
`tools/cue.mjs`, `tools/transcript.mjs`); review with contact sheets; run cloud jobs in the background; keep messages short.

## Rules that never bend
Voiceover untouched and the master clock · no invented facts/numbers/quotes · numbers exactly as spoken ·
Binly palette only · no mascot/logo/HUD/subtitles · deterministic code (`node tools/check.mjs`) ·
final render only in the cloud (this PC is too slow; local = stills/sheets only) · 1920×1080 60 fps H.264/AAC.

## Commands (all from the studio root)
| | |
|---|---|
| `node tools/doctor.mjs` | preflight checks |
| `node tools/new-video.mjs [--slug s --title t]` | ingest input/ + cloud timing |
| `node tools/cue.mjs "phrase" ["phrase2"]` · `--range 120 185` | exact word times |
| `node tools/transcript.mjs --from 120 --to 210` | transcript lines in a time window |
| `node tools/scaffold.mjs <slug>` | regenerate index.tsx + placeholders from chapters.json |
| `node tools/status.mjs` | chapter build status |
| `node tools/check.mjs` | typecheck + determinism lint |
| `node tools/sheet.mjs --from a --to b [--n 20 --cols 5]` / `--times a,b,c` | contact sheet → .cache/sheets/ |
| `node tools/still.mjs --at 12.5[,13]` | full-res stills → .cache/stills/ |
| `node tools/cloud.mjs render <slug> [--scale 0.5] [--from a --to b]` | cloud render + QA download |
| `node tools/cloud.mjs analyze <slug>` · `push` · `runs` | cloud timing · commit+push · recent runs |
| `node tools/preview.mjs` | live preview (Remotion Studio, http://localhost:3000) |
| `node tools/photo.mjs search "q"` · `get <#> --as name` | free archival images (Wikimedia) |
| `node tools/upload-pack.mjs` | YouTube description + captions.srt |
| `node tools/compile-shots.mjs [Cxx]` | shot lists (videos/<slug>/shots/*.json) → chapter code |
| `node tools/kit-test.mjs` | render-test the whole kit + refresh docs/catalog/*.png |

# Compact instructions
When compacting, preserve: the active video slug; the pipeline step reached; the chapter table with each chapter's state
(placeholder / building by which builder id / built / reviewed / fixes pending); open fix requests and decisions the user made
(style-check answer, notes); the latest render version and QA warnings. Drop: tool outputs, file contents, image details.
