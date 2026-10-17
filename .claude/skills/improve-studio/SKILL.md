---
name: improve-studio
description: Maintenance pass that turns accumulated experience into a better, leaner Studio — consolidate docs/LESSONS.md into the core docs, promote builder-made components from the Kit backlog into src/kit, add new shot templates for recurring beats. Run every ~3–5 videos or when LESSONS.md gets long. Use for "/improve-studio", "clean up the lessons", "make the studio better".
disable-model-invocation: true
---

Goal: the Studio gets better AND stays lean. Every new session should read less, find more ready-made, and repeat no
old mistake. Work through helpers for any code; keep your own context small.

1. **Consolidate lessons.** Read `docs/LESSONS.md` (and any `videos/*/RESULTS.md` from /learn-from-youtube).
   - Merge durable lessons into the right core doc — `docs/RETENTION.md` (viewer behaviour), `docs/CRAFT.md`
     (direction), `docs/BUILDER.md` (coding/animation bans & defaults), `docs/PLAYBOOK.md` (channel rules, only with
     the user's OK), `.claude/skills/make-video/PIPELINE.md` (process). Rewrite/replace instead of appending; keep
     each doc short (RETENTION ≤ ~700 words, CRAFT ≤ ~1000, BUILDER ≤ ~1400).
   - **Trim only what is clearly repeated or outdated — never remove a rule the owner decided** (anything marked
     "channel owner's decision", the owner's preferences list, the quality-first goal (reuse only when just as good), voiceover-first, YouTube-safe,
     storytelling-not-documentary, real images, the red-pen/caption styles). When unsure, keep it.
   - Remove lessons that are now built into the docs or kit, outdated, or contradicted by real data.
   - Leave LESSONS.md with only fresh, not-yet-merged notes (target < 20 lines) + the Kit backlog.
2. **Promote assets.** For the most reused / most valuable entries in `docs/ASSETS.md` (and the Kit backlog in
   LESSONS.md), spawn a `binly-builder` (model opus) to move it into `src/kit/` following `docs/KIT-AUTHORING.md`:
   generic props, gallery page, `docs/kit/<module>.md`, `node tools/kitdoc.mjs`. Remove promoted entries from ASSETS.md. Don't break existing videos
   (keep their local copies or update imports; `node tools/check.mjs` must pass).
3. **New templates.** Look at the last videos' briefs: any standard beat hand-built ≥ 3 times → add it to
   `src/kit/templates.tsx` (via a helper), with docs.
4. **Check the size budget.** `wc -c CLAUDE.md docs/*.md .claude/skills/*/*.md` — CLAUDE.md stays ≤ ~6.5 KB; trim
   where docs grew without adding value — same rule: only repetition, never an owner's decision.
5. `node tools/kitdoc.mjs` (refreshes KIT-INDEX + the builder definition), `node tools/kit-test.mjs` (must pass; refreshes the visual catalogs), `node tools/cloud.mjs push "studio improvements"`, then tell the user in plain words what
   improved (what's new in the kit, which rules changed, what got shorter).
