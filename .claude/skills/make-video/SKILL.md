---
name: make-video
description: Produce the complete Binly video from the voiceover + script in input/ (or continue the active one) in this single session — highest quality, context-efficient. Use when the user says "make the video", "/make-video", or "continue the video".
---

Produce the full video now by following `.claude/skills/make-video/PIPELINE.md` exactly (read it first), start to
finish, in THIS session.

Priorities, in order:
1. **Quality and retention first** — a video a curious viewer can't stop watching: work with the Binly mindset (docs/RETENTION.md) —
   principles, not paperwork; strong hook, a visual idea for every beat, smooth motion, exact
   facts and numbers, real archival images as evidence where they add truth, Binly's look. Never trade quality for
   speed or tokens.
2. **Finish in one session** — protect your own context so you can reach delivery:
   - Plan deeply, then delegate every chapter to `binly-builder` subagents (max 3 at a time); never build chapters yourself.
   - Read docs (PLAYBOOK, RETENTION, CRAFT, KIT-INDEX + needed kit sections, LESSONS, ASSETS) instead of source; use `tools/cue.mjs` / `tools/transcript.mjs`, never words.json.
   - Review with contact sheets (one image, many frames); keep your notes and messages short.
   - Run cloud jobs in the background; don't poll.
   - Keep `videos/<slug>/STATUS.md` current at each phase so a usage-limit pause loses nothing.
3. **Be honest** — report real QA results and real limitations in REPORT.md.

If there is already an active unfinished video (see `node tools/status.mjs`) and input/ is empty, continue it instead.
Extra wishes from the user for this video (if any): $ARGUMENTS
