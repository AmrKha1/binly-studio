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
  Arabic voiceover/script → give an English `--slug` (e.g. `ar-diamonds`); lang "ar" is detected automatically and the
  timing uses the Arabic model (takes longer — plan meanwhile from the script). All on-screen text then in Arabic.
It moves the inputs to `videos/<slug>/`, scaffolds `src/videos/<slug>/`, activates it, uploads the voiceover
to GitHub (release `vo-<slug>`) and runs the cloud timing analysis (~5–10 min) → `videos/<slug>/timing/`.
The VOICEOVER is the truth: transcript.md follows what was actually said (script only fixes spelling). If the output
shows a WARNING (script differs a lot), tell the user in one line (maybe a wrong script file) and continue.
While it runs: read `docs/PLAYBOOK.md`, `docs/RETENTION.md`, `docs/CRAFT.md`, `docs/KIT-INDEX.md`, `docs/LESSONS.md`, and `notes.md` if present (the user's special requests override defaults).

**1b · Art (start it EARLY — it runs in the background while you plan and build)** — CODE FIRST, FLOW AS A BONUS (owner
2026-10-21): the plan must work completely WITHOUT Flow — every scene has a code-built version (kit places/objects,
white mode, glow backdrops, templates, editfx) that you design in full. Flow only UPGRADES a few chosen scenes (richer
backgrounds/objects) when it works; if Flow is slow, refuses or is down, nothing changes in the plan. As soon as the story is clear from
the script/transcript, decide the generated art (rules + exact prompt blocks: docs/ART-STYLE.md):
1. `node tools/art.mjs find <words>` — reuse library backgrounds/objects first (the library grows with every video).
2. Write `videos/<slug>/art/plan.json`: **≤ 12 images** — 4–6 key BACKGROUNDS (hook, the story's main places, climax;
   empty, an open area for host/objects) + 4–6 OBJECT SHEETS (6 objects each, in reading order). No text, no real
   people/events presented as real (those stay archival), clean flat style only.
3. `node tools/art.mjs prompts <slug>` → art/prompts.json + art/prompts.md (owner fallback).
4. ONE `flow_generate` call: project `art-<slug>`, scenes = art/prompts.json (model Nano Banana 2 Lite, max_credits 0).
   Then keep working; check back with `flow_wait` only when you need the art (never poll in a loop).
5. When done: `node tools/art.mjs ingest <slug>` → objects cut out, named, added to the library, copied into
   public/<slug>/ (sizes in public/<slug>/art.json). Look at ONE contact sheet of everything; regenerate bad ones (free).
**If Flow refuses ("unusual activity") or fails:** stop generating (never retry in a burst), tell the owner in one line
that art/prompts.md is ready to paste into Flow by hand, and continue — chapters without art use the white-mode kit
scenes (GlowBackdrop/GlowFloor, templates); swap art in later with `node tools/art.mjs ingest <slug> --dir input`.
Where art goes: the planner writes, per scene, its CODE version (always) + optional FLOW upgrade (≤ 12 images per video,
only where it clearly adds value: the hook, the main places, the climax). Build every chapter with the code version first
so the video is complete; when Flow art arrives, swap it into the marked scenes. WHITE MODE for explanations, numbers,
lists, timelines and infographics — alternate with story scenes for rhythm.

**2 · Plan** (your most important work — this is where quality is decided). Read `videos/<slug>/timing/transcript.md`
(one line per paragraph with times). Then write:
- `videos/<slug>/plan.md` (≤ 700 words): logline · **the story spine** (hook → the question & why it matters → rising tension / turns → the big reveal →
  payoff; mark where each lands in time — the plan must read like a story, not a topic outline) · the question that drives the video · visual thesis (the
  ONE big visual idea/world) · palette leaning (within the Binly system) · recurring motifs and what they mean ·
  recurring characters/objects/places → **quality first**: check `docs/KIT-INDEX.md` and `docs/ASSETS.md` (pieces built in
  past videos) and reuse what serves the story just as well; what's missing, or would be better made new for this
  story, becomes a **new shared component** in `src/videos/<slug>/shared/` (name, file, props,
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
  raised and answered within a chapter · chapter overview · sound design (where the big hits, cash, power-ups land) · the hook (what the first ~30 s show) · the real archival images the story needs — as many as truly help, no fixed limit (delegate searching
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
  whose main visual is words — are the rare exception: **0 by default, at most 1 per chapter**, only when the words
  themselves are the point (a famous myth being busted, the video's central question once, a real quote), each with `"ok":"why this can't be
  shown"` in the shots JSON. Turn a would-be card into a scene: "How did the Middle Ages actually think?" → the camera dives
  into a medieval physician's head where the four humors swirl; "Bathing is about hygiene" → a modern shower cuts to a
  physician PRESCRIBING a hot bath as medicine, the red pen striking the modern idea. Custom shots carry the hook, reveals
  and signature moments — EXACT on-screen strings and numbers, certainty colours. A shot may continue the
  same world with a camera move (preferred) or cut/transition to a new one. Also: how the chapter begins
  (continuity from the previous chapter's last frame) and ends (what the next chapter enters from) · 10–30 story
  sounds (cash, impact, power-up …). Be concrete: builders execute, they should not have to invent the direction — but
  leave them room for craft. Shot numbers make later fixes precise ("C04 S3: …").
  **The standard is `docs/EXAMPLE-BRIEF.md`** (read it once before the first brief). Each shot answers:
  SIZE + FOCUS (wide/medium/close · the one thing the eye goes to; mobile first: the subject fills ≥ ~⅓ of the frame) ·
  PLACE (where it happens — foreground / mid / background and light; no empty stage) · ACTION (what appears/moves, in order, on which
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
- NO MUSIC: never write score.json moods/tracks (the engine makes no music). Sound = sfx: automatic from the kit +
  10–30 story cues per chapter in `videos/<slug>/sfx/<ID>.json` (see BUILDER "Sound effects").
- **SOUND DESIGN IS PLANNED HERE, not left to the render** (the render only mixes it): in every brief, per shot, write the
  story sounds on their cue words (cash on "money", impact on the twist, error on the myth, power-up on the reveal,
  ambience at a new place), the 1–2 moments of near-silence right before big reveals, and which edit FX hits carry a
  sound. Kit animations add their own pops/swooshes automatically — plan the MEANING layer on top of them.

**Motion + sound plan (owner, 2026-10-20 — decide it HERE, builders execute):** almost EVERYTHING on screen pops up and
bounces in — text, labels, objects, icons, cards, people, numbers (kit/motion: pop · bounceDrop · backIn* · jackInTheBox ·
flipIn · zoomSpin · whip* · stamp; headlines bounce by default). For every shot the brief names each element's entrance,
the key object's Attention move on its word (heartBeat emphasis · tada win · shake myth · float held hero) and its exit;
vary the presets inside a scene. Every movement makes a sound automatically + 10–30 story sounds per chapter (cash,
impact, power-up, error …). White-mode backgrounds: GlowBackdrop / GlowFloor; 3–6 SlamTitle pivots per video.
**Every video has its channel host (English = ODDESTORY, Arabic = AZTIKA; kit/image-host):** plan where he is on screen (most of the video, not everywhere), his pose +
face track per shot (point/present at the element being named, react on twists), how lively he is (moderate,
meaningful — your call per shot) and his FRAMING + movement (full / waist-up / close-up / peek / tiny; walks, slides in,
steps aside) — vary it like a real presenter — and how he ARRIVES and LEAVES (`enter`/`exit`; never just appears). Built-in
vocabulary only; at most ~2–3 new poses per video, added to kit/host. Write it in each brief.

**Alive pass (in every brief):** for each shot list what changes every 2–4 s and WHERE supporting text appears (beside
the object, above the speaker with SayPop, along an arrow, on the map, on the reveal), how objects and the host move,
and the camera move. A shot with nothing new for > 4 s gets a beat (pop, move, punch-in, reaction) — RETENTION §11.

**Hook & pacing gate (plan, RETENTION §12):** mark in plan.md (a) what is on screen at 0–5 s (the payoff/most striking
image of the title's promise), (b) one RE-HOOK every 60–90 s (question / "but…" / teaser / twist) with its time, (c) the
ending: payoff → echo of the hook → stop. If any is missing, the plan is not ready.

**2b · Shot lists as data** — for each chapter also write `videos/<slug>/shots/Cxx.json` (format in
`tools/compile-shots.mjs`): template shots with their props, custom shots as `{"id":"S4","start":…,"custom":true,"note":"…","beats":[t1,t2,…]}` (`beats` = cue times of
the visible changes inside the shot, one per sentence after the first; `mode` = scene | character | diagram | map |
image | text | data — templates set it themselves; `size` = wide | medium | close). **Shot-size rhythm:** mix wide,
medium and close in every chapter — close-ups for emotion, reactions and key details; never 3 wides in a row.
**Light & colour variety:** no long stretch in the same flat paper light — time of day, interiors, dark mind-space, a
dramatic light on a reveal are story moments (plan them in the retention map). Then run `node tools/plan-check.mjs` — it flags
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

**3b · Style self-check (no waiting for the owner — the style is already decided, owner 2026-10-21)** — build C01
(the hook) FIRST and start the next 2 builders in parallel. When C01 is done, judge its contact sheet yourself against
THE LOOK (PLAYBOOK), docs/art/references/ and RETENTION §11–12 (clean bright frames, bold text, alive every 2–4 s, hook
payoff in 5 s). Fix C01 and update the remaining briefs if anything is off; never stop to ask the owner. Only ask if
something truly cannot be decided from the docs.

**4 · Build chapters** — spawn `binly-builder` subagents, **at most 3 running at once** (this PC is slow).
Builder prompts: always the same short form (identical opening = shared prompt cache): `Build the custom shots of chapter C03 of video <slug> (src/videos/<slug>/chapters/C03.custom.tsx). Brief: videos/<slug>/briefs/C03.md, shot list: videos/<slug>/shots/C03.json` (+ anything special).
Use `model: "opus"` for C01 (the hook) and the climax chapter; default (sonnet) for the rest.
Optional (experimental, Pro needs /config → Dynamic workflows on): run the saved workflow `/build-chapters` with args
`{slug, chapters:[{id:"C02"},…], batch:3}` instead of spawning builders one by one — its helpers pause and resume at usage
limits instead of failing, and you get one combined report. If it isn't available or misbehaves, use subagents as above.
Each builder writes only `src/videos/<slug>/chapters/C03.tsx` (+ `videos/<slug>/sfx/C03.json`).

**5 · Review each chapter** as it arrives: `node tools/sheet.mjs --from <start> --to <end> --n 20 --cols 5`,
then Read the PNG. Judge like a demanding art director with the Binly mindset (docs/RETENTION.md): would a stranger keep watching?
Against the PLAN, not from scratch — the **mute test** on the sheet (does the story read from the pictures alone?) and
the **phone test** (would each frame read on a phone — big subject, a real place, close-ups that land, no empty stage? check one
`--phone` sheet per chapter: tiles at upright-phone size; text that doesn't read there is too small): the signature moments land as planned, the builder's "Beats:" line (any beat off
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

**5d · High-end editor pass (once, before the final render)** — check THE LOOK (PLAYBOOK: clean bright polished, no
yellow/dark/murky/cheap frames) and watch the whole video as contact sheets at 2 s spacing
(`node tools/sheet.mjs --from a --to b --n 30` per ~1 min) with RETENTION §12 in mind: any second where nothing changes,
a slow entrance/fade, a long transition, a sag in the middle without a re-hook, a hook that doesn't deliver the
promise in 5 s, an outro that drags → fix it (one builder round per chapter at most), then render.

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

## Live preview — OFF (owner preference)
Do NOT open the live preview (Remotion Studio) — the owner does not want it and it slows this PC. Review with contact
sheets. Open it only if the owner asks. Owner screenshots/notes → treat like `/polish-video`.

## Other requests
- **"continue the video"** → `node tools/status.mjs` + read `videos/<slug>/STATUS.md` (if any), `plan.md`, `chapters.json`;
  resume at the first unfinished step (placeholders → brief builders; all built → render; rendered → QA/deliver).
- **Edits to a finished video** ("make the king scene longer") → find the chapter(s) by time/title in `chapters.json`,
  send a builder the change (a new builder reading the brief + current chapter file), re-render, keep old versions.
- **Style change for all future videos** → edit `docs/PLAYBOOK.md` (and `brand/` if the user asks), note it in LESSONS.md.
- **Kit improvement** → follow `docs/KIT-AUTHORING.md`, update `docs/kit/*.md`, then `node tools/kitdoc.mjs`.

