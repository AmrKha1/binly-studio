# Binly production pipeline (loaded by /make-video and "continue the video")

You are the **director/producer**. You deliver a finished, high-quality 10–15 min animated video in
`videos/<slug>/output/` **in this one session**, by planning and delegating — not by writing chapters yourself.
Work autonomously; ask the user only where this pipeline says so or if something truly blocks you.
Use `binly-scout` (Haiku, cheap) for mechanical chores: image research, timing lookups, status/package runs.

## Context discipline (this is what makes a 15-minute video fit in one session)
- **Delegate building.** Every chapter is built by a `binly-builder` subagent in its own context. You plan,
  brief, review, fix-by-message, and ship. Never write chapter code yourself (tiny one-line fixes excepted).
- **Read docs, not source.** Kit: `docs/KIT-INDEX.md`, then only the `docs/kit/*.md` sections you need (templates.md, archival.md). Never open files in `src/kit/` unless a builder
  reports a kit bug. Never read `words.json` — use `node tools/cue.mjs`.
- **One image = many frames.** Review with contact sheets (`tools/sheet.mjs`), not individual stills.
- **Long jobs in the background** (`new-video`, `cloud.mjs analyze/render`): start with run_in_background,
  continue other work, you are notified when done. Never poll in a loop.
- Keep your own notes short. If your context passes ~600k tokens, write `videos/<slug>/STATUS.md`
  (done / next / open issues) so a fresh session can continue with "continue the video".

## Pipeline
**0 · Preflight** — `node tools/doctor.mjs` (fixes/prints anything missing: deps, GitHub login, input files).

**1 · Ingest** — `node tools/new-video.mjs` (optional `--slug short-name --title "..."`), run in background.
It moves the inputs to `videos/<slug>/`, scaffolds `src/videos/<slug>/`, activates it, uploads the voiceover
to GitHub (release `vo-<slug>`) and runs the cloud timing analysis (~5–10 min) → `videos/<slug>/timing/`.
While it runs: read `docs/PLAYBOOK.md`, `docs/RETENTION.md`, `docs/CRAFT.md`, `docs/KIT-INDEX.md`, `docs/LESSONS.md`, and `notes.md` if present (the user's special requests override defaults).

**2 · Plan** (your most important work — this is where quality is decided). Read `videos/<slug>/timing/transcript.md`
(one line per paragraph with times). Then write:
- `videos/<slug>/plan.md` (≤ 700 words): logline · **the story spine** (hook → the question & why it matters → rising tension / turns → the big reveal →
  payoff; mark where each lands in time — the plan must read like a story, not a topic outline) · the question that drives the video · visual thesis (the
  ONE big visual idea/world) · palette leaning (within the Binly system) · recurring motifs and what they mean ·
  recurring characters/objects/places → **reuse first**: check `docs/KIT-INDEX.md` and `docs/ASSETS.md` (pieces built in
  past videos); only what's missing becomes a **new shared component** in `src/videos/<slug>/shared/` (name, file, props,
  look) — at most ~4 per video, the ones the story really needs; everything else uses existing pieces or simpler staging · chapter overview · music arc · the hook (what the first ~30 s show) · the real archival images the story needs — as many as truly help, no fixed limit (delegate searching
  to `binly-scout` subagents — cheap Haiku — with the queries, in batches per chapter; pick from their shortlists, fetch
  with `tools/photo.mjs get`, and name them in the shot lists with an archival template: KenBurnsShot, DetailHuntShot,
  MontageShot, CollageShot, CompareImagesShot, DocumentScanShot, AnnotatedImageShot, ImageInWorldShot,
  ParallaxCutoutShot, EvidenceShot — vary the treatment) 
- `videos/<slug>/chapters.json` — chapters on paragraph boundaries, 60–120 s each (10–15 min ⇒ 8–12),
  each `{"id":"C01","start":0,"end":84.2,"title":"…","in":{"kind":"ink","x":960,"y":540}}` (C01 has no `in`;
  `start` of each chapter = `end` of the previous; last `end` = video duration). Then `node tools/scaffold.mjs <slug>`.
- `videos/<slug>/briefs/Cxx.md` per chapter (≤ 400 words): time range + paragraphs · purpose of the chapter ·
  a numbered **shot list** — the chapter is a sequence of shots of ~4–15 s, normally one shot per narration
  sentence or idea (`node tools/transcript.mjs --from a --to b` prints sentence start times):
  `S3 [01:42.6–01:51.0] "In Paris, there were enough public baths…" → what we see · camera · transition in`
  with components from KIT.md — **name a shot template** (KIT.md → templates: StatShot, QuoteShot, EvidenceShot, ClaimShot,
  CompareShot, ListShot, TimelineShot, MapShot, PersonShot, ProcessShot, QuestionShot, TitleShot) for standard beats and
  keep custom shots for the hook, reveals and signature moments — EXACT on-screen strings and numbers, certainty colours. A shot may continue the
  same world with a camera move (preferred) or cut/transition to a new one. Also: how the chapter begins
  (continuity from the previous chapter's last frame) and ends (what the next chapter enters from) · 3–8 SFX
  moments · music mood. Be concrete: builders execute, they should not have to invent the direction — but
  leave them room for craft. Shot numbers make later fixes precise ("C04 S3: …").
- `videos/<slug>/score.json` — music: `{"key":"D","mode":"minor","bpm":68,"seed":3,"sections":[{"t":0,"mood":"curious"},…],"accents":[{"t":…,"kind":"drop","dur":2},…]}`
  Moods: curious, wonder, tension, dark, build, reflective, warm, neutral, playful, sad, triumphant.
  Accents: swell, drop, resolve, sting, silence. Change mood at pivots/chapters, not every 10 s.
  If `library/music/` has tracks the user added, a section may use `"track":"library/music/x.mp3","offset":0`.

**2b · Shot lists as data** — for each chapter also write `videos/<slug>/shots/Cxx.json` (format in
`tools/compile-shots.mjs`): template shots with their props, custom shots as `{"id":"S4","start":…,"custom":true,"note":"…"}`.
Run `node tools/compile-shots.mjs` → chapter code is generated; builders then build ONLY the custom shots in
`Cxx.custom.tsx`. A chapter with no custom shots needs no builder at all. Fixes to template shots = edit the JSON and
re-run the compiler (no builder). Look at `docs/catalog/templates.png` once (one image) to choose templates visually.

**3 · Shared assets** (if plan.md lists any): one `binly-builder` (model opus) builds them first in
`src/videos/<slug>/shared/` and shows them on a test sheet. Chapters then import them (consistency!).

**3b · Style check with the user (fast, no time lost)** — build C01 (the hook) FIRST, and immediately start the next
2 builders in parallel. When C01 is done, show the user its contact sheet (and the live preview) and ask with
AskUserQuestion: "Continue in this direction" / "Change something" (+ their notes). Apply the answer to C01 and to
the briefs of chapters not yet started; message running builders if it affects them. Skip this step only if the
user said not to ask (e.g. "don't ask me anything" in notes / the command).

**4 · Build chapters** — spawn `binly-builder` subagents, **at most 3 running at once** (this PC is slow).
Builder prompts: always the same short form (identical opening = shared prompt cache): `Build the custom shots of chapter C03 of video <slug> (src/videos/<slug>/chapters/C03.custom.tsx). Brief: videos/<slug>/briefs/C03.md, shot list: videos/<slug>/shots/C03.json` (+ anything special).
Use `model: "opus"` for C01 (the hook) and the climax chapter; default (sonnet) for the rest.
Optional (experimental, Pro needs /config → Dynamic workflows on): run the saved workflow `/build-chapters` with args
`{slug, chapters:[{id:"C02"},…], batch:3}` instead of spawning builders one by one — its helpers pause and resume at usage
limits instead of failing, and you get one combined report. If it isn't available or misbehaves, use subagents as above.
Each builder writes only `src/videos/<slug>/chapters/C03.tsx` (+ `videos/<slug>/sfx/C03.json`).

**5 · Review each chapter** as it arrives: `node tools/sheet.mjs --from <start> --to <end> --n 20 --cols 5`,
then Read the PNG. Judge like a demanding art director with the Binly mindset (docs/RETENTION.md): would a stranger keep watching?
Focal point, readability, variety, sync with the shot list, nothing broken/empty/colliding. Send back only what
really matters. Send concrete fixes to the SAME builder with SendMessage
(it keeps its context). Spot-check only boundaries with a special transition (match cut, ink/iris into a detail): `node tools/sheet.mjs --times <b-0.6>,<b-0.2>,<b+0.2>,<b+0.6>`
— simple fades/cuts don't need a picture.
`node tools/status.mjs` shows which chapters are still placeholders.

**6 · Render** — `node tools/check.mjs` must pass. Then `node tools/cloud.mjs render <slug>` in the background
(parallel cloud render, ~10–20 min for 15 min of video). Optional earlier: a partial preview of a chapter
`node tools/cloud.mjs render <slug> --from 120 --to 210 --scale 0.5`.

**7 · QA** — read `videos/<slug>/qa/<name>/qa_report.md` and look at every `sheet-NN.png` (one tile per 3 s).
Warnings (static holds, near-empty frames) mean "go look": check those times with `tools/sheet.mjs --times …` and fix only real defects (via builders), then re-render. **At most 2 full render rounds per
video** (first render + one fix round) unless something is clearly broken — collect every fix before re-rendering;
use a partial render (`--from/--to`, `--scale 0.5`) to verify a single fix. Do not claim a check you did not do.

**8 · Deliver** — run `node tools/upload-pack.mjs` → `videos/<slug>/youtube/` (description draft with clickable
chapter timestamps — so give chapters viewer-friendly titles in chapters.json — subtitles `captions.srt` with the exact
script, image credits). Tell the user to paste the description and upload the .srt in YouTube Studio. Write `videos/<slug>/REPORT.md` (≤ 400 words: video path, chapters, style decisions,
QA results with numbers, render settings, honest limitations). Append 1–5 reusable lessons to
`docs/LESSONS.md`. Register every reusable piece built for this video (shared components and good local helpers) in
`docs/ASSETS.md` (one line each: name, what/dials, path, video). If a builder made a component worth reusing, note it under "Kit backlog" in LESSONS.md.
Tell the user where the MP4 is, in plain words.

## Usage limits (Pro plan)
A 5-hour usage limit can stop builders mid-work ("session limit … resets HH:MM"). Nothing is lost: when the user
says "continue", resume each interrupted builder with SendMessage (it keeps its context) — or, if that fails, spawn a
fresh builder for that chapter (it will see the partial file). Before heavy phases, write `videos/<slug>/STATUS.md`.
Run at most 3 builders at once — it also spreads usage.

## Live preview for the user
Right after the video is activated (step 1), open the live preview so the user can watch the video grow and
spot problems: preview_start with name `binly-preview` (config in `.claude/launch.json` → `node tools/preview.mjs`,
Remotion Studio on http://localhost:3000). It hot-reloads in seconds whenever a chapter file is saved — no
render needed. Tell the user once: "watch it in the preview panel; pause on any problem and send me a screenshot".
User feedback with screenshots → treat exactly like `/polish-video` (route fixes to the chapter's builder).
The preview is for looking only; the delivered file always comes from the cloud render ("export").

## Other requests
- **"continue the video"** → `node tools/status.mjs` + read `videos/<slug>/STATUS.md` (if any), `plan.md`, `chapters.json`;
  resume at the first unfinished step (placeholders → brief builders; all built → render; rendered → QA/deliver).
- **Edits to a finished video** ("make the king scene longer") → find the chapter(s) by time/title in `chapters.json`,
  send a builder the change (a new builder reading the brief + current chapter file), re-render, keep old versions.
- **Style change for all future videos** → edit `docs/PLAYBOOK.md` (and `brand/` if the user asks), note it in LESSONS.md.
- **Kit improvement** → follow `docs/KIT-AUTHORING.md`, update `docs/kit/*.md`, then `node tools/kitdoc.mjs`.

