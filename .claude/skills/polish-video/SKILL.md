---
name: polish-video
description: Review and fix a finished (or nearly finished) Binly video — the user's list of problems and/or a self-review polish pass over every chapter — then re-render. Use for "fix these problems", "polish the video", "/polish-video".
---

Polish the video (the active one unless the user names another; `node tools/status.mjs`). Same priorities as
production: quality first, keep YOUR context lean, helpers do the work.

1. **Collect issues.**
   - From the user's message (timestamps → chapter via `videos/<slug>/chapters.json`).
   - Self-review: read the latest `videos/<slug>/qa/<version>/qa_report.md` and look at every `sheet-NN.png`;
     check flagged times with `node tools/sheet.mjs --times …`. Look for: collisions/overlaps, clipped or
     tiny text, empty or dead frames, broken/floating anatomy, things showing through other things, jarring
     transitions, off-palette colours, text that doesn't match the narration, holds that drag.
   - Write the list to `videos/<slug>/FIXES.md` grouped by chapter (precise: time, what is wrong, what it
     should be).
2. **Fix per chapter with helpers** (max 2 at once). If the builder that made the chapter is still alive in
   this session, SendMessage it the chapter's list; otherwise spawn a `binly-builder`:
   `Fix chapter C05 of <slug>: apply the C05 section of videos/<slug>/FIXES.md. Also do a careful self-review of
   the whole chapter (sheets) and fix any other technical defect you find; keep the direction unchanged.`
3. **Verify** each fixed chapter with one sheet around the fixed times.
4. **Re-render once** (`node tools/cloud.mjs render <slug>`, background) after all fixes — the new version gets
   the next `-vN` number; old versions are kept. Read the new QA report.
5. Tell the user the new file name and a short list of what changed. Add durable lessons to `docs/LESSONS.md`
   (if a problem came from the kit or the rules, fix it there so it never repeats). If the user's notes show a
   lasting preference ("I prefer…", "too much X", the same kind of complaint twice), add ONE line to
   docs/PLAYBOOK.md → "Channel owner's preferences", then run `node tools/sync-agents.mjs` so builders get it.

User's issues / extra wishes (if any): $ARGUMENTS
