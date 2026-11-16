# STATUS — ar-costly-mistakes «أغلى غلطة في التاريخ» (732.18 s)
Owner (2026-11-16 04:xx): asleep; full autonomy — NO stops (skip STOP 1–4), produce long video + hook Short, render only when 100 % sure. Auto-resume cron hourly (:17).

## Done
- Voice gate PASS, locked. Flow connected (project art-ar-costly-mistakes). Test sheet = scene-01 (not used).
- art/plan.json (5 sheets + 5 plates) → Flow jobs scene-02 … scene-11 queued (files in C:\Users\amrou\flow-mcp-out\art-ar-costly-mistakes).

## Next
- cloud timing → transcript → plan.md, chapters.json, board.json, briefs + shots (planner agents) → plan-check
- art ingest (from flow-mcp-out, scene-02..11) + art check
- shared pieces builder → chapter builders (≤3) → review → gate → render → Short → deliver

## Open issues
- (solved 05:2x) pizza part recorded by owner → inserted as part 4; 11 parts; voice gate PASS again; 787.91 s; owner went to sleep.
- C01–C03 planner started on the OLD timing (parts 1–3 unchanged → times should be identical; verify with cue.mjs).
- Backups: .cache/backup-ar-costly/ (plan, art, old parts).
- ART DONE (05:4x): 43 objects in public/ar-costly-mistakes/el + 5 plates in bg/ (launch-1962, landfill-newport, office-2000,
  chernobyl-1986, suez-1869). REMOVED (English text on them): hard-drive, laptop-drive, quill-contract, rental-store → use
  hard-drive-blank, contract-blank, rental-store-blank. Approved by eye: mariner-rocket, steamship-1869.

## Chapter table (06:5x) — plan-check PASS (193 shots, avg 4.1 s); board.json COMPLETE (10 entries, suez twist 757.24, recapAt 741.70)
Signatures (8): C01 S9 · C02 S10 · C03 S8 · C04 S5 · C06 S10 · C08 S18 · C12 S2 · C12 S6.
| C01 C02 C03 | BUILT + REVIEWED (C01 one fix round done; C02/C03 accepted) — recompiled with final board |
| C04 | BUILT + REVIEWED (fix round done) |
| C05 | BUILT + REVIEWED (fix round done: first ruling no year) |
| C06 | BUILT + REVIEWED (accepted) |
| C07 | BUILT + REVIEWED (accepted) |
| C08 | BUILT + REVIEWED (size fix round done) |
| C09 | BUILT + REVIEWED (fix round done) |
| C10 | BUILT + REVIEWED (accepted) |
| C11 | BUILT + REVIEWED (fix round done) |
| C12 | BUILT + REVIEWED (twist + stamp fixed) |
Notes: spoken lines use digits as in script («6.3 مليار دولار», «حوالي 10.2 مليار دولار») — ASR merged words, never guess.
- 10:0x usage limit hit at ~07:00 (C01–C03 builders paused mid-work); resumed all three after reset.
- tools fixed: cue.mjs (Arabic letters were stripped → every phrase empty), plan-check (object "in"). Board: mariner icon = toy-rocket; howells label «بين 590 و630 مليون $».
- BEFORE RENDER GATE: recompile ALL chapters (board.json is baked into each Cxx.tsx at compile time).
- howells board label → «600 مليون $» (as spoken in the recap; the range overlapped the pizza pill). Recompile all before gate.
- sfx-density cap fixed (never thin a cue that opens a QUIET hole; story cues had crowded out auto cues → QUIET flags everywhere). Re-run sfx-scan after all chapters built.
- AZTIKA pose "sad" renders small/low (kit image) → replaced by "think" in all shot lists. Kit backlog: fix full-sad.png framing.
- NEXT after C12 fix: recompile ALL → sfx-scan → sync-check results (.cache/sync-ar-costly.log) → hook & signature pass → full-video pass (sheets at 2 s) → render-gate.
- ALL 12 CHAPTERS BUILT + REVIEWED. All recompiled. sync-check 12/12 clean (C10 blank fixed). sfx: no QUIET (36/min). Joins checked.
- RENDER GATE round 1 running (.cache/gate1.log).
- GATE round 1: NOT READY (112). Real fixes sent: C05 C08(2008) C09 C10 C11(1876) C12 (recap/thesis pills); AZTIKA overlaps fixed in JSON (C02 C03 C05 C07). Accepted flags → gate-ok.json. Next: gate round 2 when builders report.
- gate round-1 fixes all done (C05 C08 C09 C10 C11 C12 + host). GATE round 2 running (.cache/gate2.log).
- GATE round 2: ✅ GO RENDER (render-gate.json). Next: C01 preview (cloud, 0.5) → motion check → full render.
- PREVIEW 1 QA: motion in reference range; loudness -14/-1.4; sfx 2–4 dB too quiet (story gains median 0.6) + 36/min. FIX: story gains ×1.5 (203), slams ≤0.8, density cap thins to quiet limit → 32/min. Gate round (sound change) + preview 2 running.
- NOTE: render-gate now also flags story sfx gains < 0.75 (non-ambience) and Arabic digit ranges. If another gate round is needed for this video, first raise remaining non-ambient gains < 0.75 to 0.8.

## TO-DO AFTER DELIVERY (owner 2026-11-16)
- SOUND REPORT (owner-facing, plain words, verdict): whole video (loudness, effects/min, voice clear on phone) · per chapter
  (effects/min, level under voice, quiet/busy, ✅/⚠/❌) · per sound type (on target / too quiet / too loud, phone too) ·
  one viewer-feel line per chapter · final verdict ✅ ready / ❌ fix list. Build it after delivery, test it on THIS video's
  final render; the owner decides from that result whether it becomes part of the project.
  + idea for the SOUND REPORT: mix the AUDIO ONLY locally (merge-sfx without pictures) → measure the full balance of the whole video BEFORE any render.
  + PLAN (owner asked): make the local audio-only mix + sound-qa a RENDER-GATE step (sound off → NOT READY), Sound Report comes out of it before any render. Proof: compare today's local full-audio measurement (.cache/audio-full) with the final render's cloud QA sound table — if they match, wire it in after delivery (owner decides).
  + DECISION ORDER (owner): Claude gives the expert verdict FIRST (keep/not yet + why, from local-vs-cloud numbers ≤ ~1 dB match), THEN the owner decides. Same for the Sound Report.
