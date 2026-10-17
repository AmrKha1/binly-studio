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
The VOICEOVER is the truth: transcript.md follows what was actually said (script only fixes spelling). If the output
shows a WARNING (script differs a lot), tell the user in one line (maybe a wrong script file) and continue.
While it runs: read `docs/PLAYBOOK.md`, `docs/RETENTION.md`, `docs/CRAFT.md`, `docs/KIT-INDEX.md`, `docs/LESSONS.md`, and `notes.md` if present (the user's special requests override defaults).

**2 · Plan** (your most important work — this is where quality is decided). Read `videos/<slug>/timing/transcript.md`
(one line per paragraph with times). Then write:
- `videos/<slug>/plan.md` (≤ 700 words): logline · **the story spine** (hook → the question & why it matters → rising tension / turns → the big reveal →
  payoff; mark where each lands in time — the plan must read like a story, not a topic outline) · the question that drives the video · visual thesis (the
  ONE big visual idea/world) · palette leaning (within the Binly system) · recurring motifs and what they mean ·
  recurring characters/objects/places → **reuse first**: check `docs/KIT-INDEX.md` and `docs/ASSETS.md` (pieces built in
  past videos); only what's missing becomes a **new shared component** in `src/videos/<slug>/shared/` (name, file, props,
  look) — **3–6 new shared pieces per video, made for THIS story** (a guide, not a quota); **up to ~8 for image-poor
  topics** (science, psychology — animation carries everything there), sized by the story's core ideas and signature
  moments. More only with a reason written in plan.md; never build a piece just to reach a number. One-off custom
  visuals inside chapters are not counted (its motif, the signature moments, the core ideas' visuals — what makes
  this video unlike the last one); reuse covers the supporting beats (every NEW piece is built FLEXIBLY — props for era, colour, pose, size — so
  future videos can reuse it by changing a setting instead of building again); everything else uses existing pieces · **visual concept**: a concrete, moving visual for EACH core idea (the mechanism,
  not a label) and the 5–8 signature moments people will remember · **retention map**: what changes every ~30–60 s (a reveal,
  a re-hook at each chapter start, a switch of visual mode — scene / character / diagram / map / real image) so no minute
  feels the same as the last; **1–2 big open loops across the whole video**, paid off at the climax — never answer them
  early, never bury the payoff under setup (too many teases and viewers stop trusting the payoff); smaller questions are
  raised and answered within a chapter · chapter overview · music arc · the hook (what the first ~30 s show) · the real archival images the story needs — as many as truly help, no fixed limit (delegate searching
  to `binly-scout` subagents — cheap Haiku — with the queries, in batches per chapter; pick from their shortlists, fetch
  with `tools/photo.mjs get`, and name them in the shot lists with an archival template: KenBurnsShot, DetailHuntShot,
  MontageShot, CollageShot, CompareImagesShot, DocumentScanShot, AnnotatedImageShot, ImageInWorldShot,
  ParallaxCutoutShot, EvidenceShot — vary the treatment) 
- `videos/<slug>/chapters.json` — chapters on paragraph boundaries, 60–120 s each (10–15 min ⇒ 8–12),
  each `{"id":"C01","start":0,"end":84.2,"title":"…","in":{"kind":"ink","x":960,"y":540}}` (C01 has no `in`;
  `start` of each chapter = `end` of the previous; last `end` = video duration). Then `node tools/scaffold.mjs <slug>`.
- `videos/<slug>/briefs/Cxx.md` per chapter (≤ 400 words): time range + paragraphs · purpose of the chapter ·
  a numbered **shot list** — the chapter is a sequence of shots of mostly 4–10 s, **averaging ~6–7 s** (the owner's
  videos: 6.8 s felt right, 8.2 s felt slow; 10–15 s only for a lively camera journey), normally one shot per narration sentence or idea (`node tools/transcript.mjs --from a --to b` prints sentence start times):
  `S3 [01:42.6–01:51.0] "In Paris, there were enough public baths…" → what we see · camera · transition in`
  with components from KIT.md — **show, don't tell:** act every idea out (scene, characters, a mechanism that moves);
  name a shot template where it SHOWS (EvidenceShot and the archival image templates, MapShot, TimelineShot, StatShot,
  ProcessShot, PersonShot, CompareShot). **Text cards** — ClaimShot, QuestionShot, QuoteShot, TitleShot, or a custom shot
  whose main visual is words — are the rare exception: **at most 1 per chapter**, only when the words themselves are the
  point (a famous myth being busted, the video's central question once, a real quote), each with `"ok":"why this can't be
  shown"` in the shots JSON. Turn a would-be card into a scene: "How did the Middle Ages actually think?" → the camera dives
  into a medieval physician's head where the four humors swirl; "Bathing is about hygiene" → a modern shower cuts to a
  physician PRESCRIBING a hot bath as medicine, the red pen striking the modern idea. Custom shots carry the hook, reveals
  and signature moments — EXACT on-screen strings and numbers, certainty colours. A shot may continue the
  same world with a camera move (preferred) or cut/transition to a new one. Also: how the chapter begins
  (continuity from the previous chapter's last frame) and ends (what the next chapter enters from) · 3–8 SFX
  moments · music mood. Be concrete: builders execute, they should not have to invent the direction — but
  leave them room for craft. Shot numbers make later fixes precise ("C04 S3: …").
  **The standard is `docs/EXAMPLE-BRIEF.md`** (read it once before the first brief). Each shot answers:
  SIZE + FOCUS (wide/medium/close · the one thing the eye goes to) · ACTION (what appears/moves, in order, on which
  spoken words) · exact TEXT · KIT/IMAGE (named pieces, image files already fetched and looked at — YouTube-safe per
  PLAYBOOK, with the crop/pan region if the image has nudity elsewhere) · CAMERA + IN-transition ·
  DONE WHEN (one line: what must read clearly, by when). Specify the WHAT; leave the HOW to the builder.
  **No-guess test before sending a brief:** could a builder build every shot without asking one question? Any
  "something like…", "maybe", missing image or unnamed piece → decide it now (a line for you; a guess costs a rebuild).
  **Beat rule (explain, don't narrate over a still):** EVERY spoken sentence gets its own visible change on its cue
  word — a new element, a camera move, or a cut. An explanation shows the MECHANISM moving (cause → effect animated:
  the signal travels, the pattern lights up, the number fills), never a label or text card restating what is said.
  Don't over-correct: a visible change can be a camera move, a highlight or ONE element appearing — not a new cut every
  sentence. Payoff moments and big reveals may hold 2–3 s (mark them `"ok":"payoff hold"`). Busy and choppy loses
  viewers as surely as still does. **Parts first, then the mechanism:** before an explanation uses several new parts
  (the four humors, the motor cortex and the ear), introduce them visually one by one, then show them working together —
  never names and process at the same time.
  **Flow line** at the top of each brief: the chapter's visual journey — which world(s), how the camera travels
  (push into the detail, pull back to reveal, pan to the next idea, one world rather than a slideshow), and how each
  shot hands over to the next (match cut, push-through, ink, iris — motivated and varied, never the same one in a row).
  Reference for pacing and structure (not for beats): the shot lists of a past video the owner liked
  (`videos/medieval-bathing/shots/` + briefs) — read the text, never re-render it. The standard for beats is
  `docs/EXAMPLE-BRIEF.md` + the beat rule.
  **Signature shots (5–8 per video):** the moments people will remember and share — mark them `"signature": true` in
  the shots JSON and give each a **hero brief** (★ SIGNATURE in the brief): layered staging (foreground / mid /
  background), the exact camera path (start → end), the PAYOFF beat (the instant it lands, on which word), what moves
  and how, a sound accent, and DONE WHEN "a viewer would screenshot it". Detail here is cheap; a weak signature shot is not.
- `videos/<slug>/score.json` — music: `{"key":"D","mode":"minor","bpm":68,"seed":3,"sections":[{"t":0,"mood":"curious"},…],"accents":[{"t":…,"kind":"drop","dur":2},…]}`
  Moods: curious, wonder, tension, dark, build, reflective, warm, neutral, playful, sad, triumphant.
  Accents: swell, drop, resolve, sting, silence. Change mood at pivots/chapters, not every 10 s.
  If `library/music/` has tracks the user added, a section may use `"track":"library/music/x.mp3","offset":0`.

**2b · Shot lists as data** — for each chapter also write `videos/<slug>/shots/Cxx.json` (format in
`tools/compile-shots.mjs`): template shots with their props, custom shots as `{"id":"S4","start":…,"custom":true,"note":"…","beats":[t1,t2,…]}` (`beats` = cue times of
the visible changes inside the shot, one per sentence after the first; `mode` = scene | character | diagram | map |
image | text | data — templates set it themselves). Then run `node tools/plan-check.mjs` — it flags
long shots that go still (> 10 s with a beat-less sentence, or > 15 s — a lively 10–15 s shot with a beat per sentence
passes), sentences with no visible change (text only, costs nothing). Fix every flag (split the shot, add a beat
or a camera travel) or accept it on purpose with `"ok":"why"` on that shot.

**2c · Plan improvement (one round, text only)** — re-read plan + briefs as a tough YouTube editor who wants viewers
to stay: for each minute, where could a viewer get bored, confused or feel "this again"? Which 5 shots are the weakest
(a label instead of a mechanism, a safe idea where a signature moment belongs, a reused piece where this story needed
its own)? **Mute test:** read each chapter's shots without the narration — would a viewer with the sound off still
follow the story? Every place where only the words carry it gets a visual. Upgrade them in the briefs and shots JSON,
then run `node tools/plan-check.mjs` again.

**2d · Ready gate** — production starts only when: plan-check PASSES (or every flag has an "ok" reason) · the editor
round is done · the no-guess test holds for every brief. Write one line in STATUS.md: "Plan ready — <n> shots, <m> new
pieces". No builder starts before this line.
Run `node tools/compile-shots.mjs` → chapter code is generated; builders then build ONLY the custom shots in
`Cxx.custom.tsx`. A chapter with no custom shots needs no builder at all. Fixes to template shots = edit the JSON and
re-run the compiler (no builder). Look at `docs/catalog/templates.png` once (one image) to choose templates visually.

**3 · Shared assets** (if plan.md lists any): one `binly-builder` (model opus) builds them first in
`src/videos/<slug>/shared/` and shows them on a test sheet. Chapters then import them (consistency!).

**3b · Style check with the user (fast, no time lost)** — build C01 (the hook) FIRST, and immediately start the next
2 builders in parallel. When C01 is done, show the user its contact sheet (and the live preview) and ask with
AskUserQuestion: "Continue in this direction" / "Change something" (+ their notes). Apply the answer to C01 and to
the briefs of chapters not yet started; message running builders if it affects them. A lasting preference in their
notes → one line in docs/PLAYBOOK.md → "Channel owner's preferences" (+ `node tools/sync-agents.mjs`). Skip this step only if the
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
Against the PLAN, not from scratch — and the **mute test** on the sheet (does the story read from the pictures alone?): the signature moments land as planned, the builder's "Beats:" line (any beat off
its cue = a sentence over a still frame), focal point, readability, each shot's DONE WHEN met, the builder's "Decided myself"
items acceptable, nothing broken/empty/colliding. Send back only what
really matters. Send concrete fixes to the SAME builder with SendMessage
(it keeps its context). **At most 2 fix rounds per chapter** — after that, anything imperfect but not broken goes on a
short list for /polish-video; move on. Spot-check only boundaries with a special transition (match cut, ink/iris into a detail): `node tools/sheet.mjs --times <b-0.6>,<b-0.2>,<b+0.2>,<b+0.6>`
— simple fades/cuts don't need a picture.
`node tools/status.mjs` shows which chapters are still placeholders.

**5b · Hook & signature pass (once, before the final render)** — when all chapters are done, look with everything learned
during production at C01's frame sheet AND at each signature shot's payoff (`node tools/sheet.mjs --times …`, one sheet
for all of them). If every one is "wow" — screenshot-worthy, story-specific, the mechanism or payoff unmistakable — move
on. Otherwise upgrade ONLY the weak ones with one Opus builder on medium effort (the hook's builder if it's still alive),
which edits just those shots' exports in the chapters' `.custom.tsx` files — one round only, never a loop.

**5c · Sync check (once, before the final render)** — `node tools/sync-check.mjs` (background, ~1 min per chapter, no
tokens: it compares pixels itself) lists sentences whose picture barely changes. Fix the real ones in one round (send the
list to the chapter's builder); an intentional payoff hold is fine — leave it.

**6 · Render** — `node tools/check.mjs` must pass. Then `node tools/cloud.mjs render <slug>` in the background
(parallel cloud render, ~10–20 min for 15 min of video). Optional earlier: a partial preview of a chapter
`node tools/cloud.mjs render <slug> --from 120 --to 210 --scale 0.5`.

**7 · QA** — read `videos/<slug>/qa/<name>/qa_report.md` and look at every `sheet-NN.png` (one tile per 3 s).
Warnings (static holds, near-empty frames) mean "go look": check those times with `tools/sheet.mjs --times …` and fix only real defects (via builders), then re-render. **At most 2 full render rounds per
video** (first render + one fix round) unless something is clearly broken — collect every fix before re-rendering;
use a partial render (`--from/--to`, `--scale 0.5`) to verify a single fix. Do not claim a check you did not do.

**8 · Deliver** — run `node tools/upload-pack.mjs` → `videos/<slug>/youtube/` (description draft with clickable
chapter timestamps — so give chapters viewer-friendly titles in chapters.json: curiosity, never spoilers ("The king's
report", not "Doctors thought baths let the plague in"; a title must never give away an open loop or a reveal) — subtitles `captions.srt` with the exact
script, image credits). Tell the user to paste the description and upload the .srt in YouTube Studio. Write `videos/<slug>/REPORT.md` (≤ 400 words: video path, chapters, style decisions,
QA results with numbers, render settings, honest limitations). Append 1–5 reusable lessons to
`docs/LESSONS.md`. Register every reusable piece built for this video (shared components and good local helpers) in
`docs/ASSETS.md` (one line each: name, what/dials, path, video). If a builder made a component worth reusing, note it under "Kit backlog" in LESSONS.md.
Tell the user where the MP4 is, in plain words.

## When something fails (never loop)
Cloud job fails → the tool prints the failed log tail itself → fix the cause, retry ONCE. Same error twice → stop
and tell the user in plain words what failed and what you tried. A builder that is still stuck after its 2 fix rounds →
one fresh builder with a narrower brief, never more. Never retry the same thing unchanged.

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

