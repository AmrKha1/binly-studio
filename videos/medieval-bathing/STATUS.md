# STATUS · medieval-bathing (keep current)
Step: 8 · DELIVERED (v2 final). Owner rules (2026-10-15): NO image with any nudity (even croppable); free licences only; live preview NOT wanted (don't open it).
Images (all checked clean): philip6, erasmus, etuves-atget, tournai, zurich-murer, physician, alhambra.
Shared: PoreSkin, HumorWheel, Miasma, HeroTub ✓ (in ASSETS.md). Never use Person hat "scholar" (looks like a mortarboard).
All briefs + shots written & compiled (C01–C08); score.json ✓.
| ch | state |
|---|---|
| C01 | built + reviewed ✓ (owner approved style) |
| C02 | built + reviewed ✓ (polish: soap bar still greyish at 103.5) |
| C03 | built + reviewed ✓ (1 fix round) |
| C04 | built + reviewed ✓ (1 fix round) |
| C05 | built + reviewed ✓ (1 fix round) |
| C06 | built + reviewed (1 fix round) ✓ |
| C07 | built + reviewed ✓ (1 fix round) |
| C08 | built + reviewed ✓ (1 fix round) |
Compiler change: tools/compile-shots.mjs supports archival templates.
Shared HeroTub night side fixed ✓.
Tool fix: tools/sheet.mjs uses a per-run tiles folder (parallel sheets no longer collide).
Backlog: HeroTub clip ids derive from seed+x+y → two tubs at same spot collide (use per-instance id).
Kit bug: ListShot layout=column + kicker → kicker overlaps title (removed kickers in C05/C08).
Render v1 ✓ (output/medieval-bathing-v1.mp4, QA in qa/medieval-bathing-v1): 1080p60, 642.844 s exact, VO sync 0 ms, −13.5 LUFS, no black/static; 17 near-empty flags (mostly intentional).
Fix round 2 (final): C03 S2/S9, C07 S7, C08 S4/S7, then C02 soap → final render v2.
Upload pack ✓ (description w/ sources incl. Zurich 2016 article; captions fixed).
