# Reference videos — the videos the owner wants us to make like

The Studio's focus (owner, 2026-11-08): **the Arabic channel AZTIKA first** (less saturated than English).
These are real videos the owner picked as the target. Read the STUDY.md files before planning any Arabic video.

| ref | what it is | role |
|---|---|---|
| `universe-claude/` | «وش أغلى شيء في الكون؟» — made 100 % with Claude Code, 14:47 | **THE model to match** — exact specs in `STYLE-BIBLE.md` · what the kit can/can't make yet: `GAP-CHECK.md` |
| `empires-flow/` | «كيف سقطت أقوى 6 إمبراطوريات بالتاريخ؟» — Google Flow images, 15:35 | ideas to borrow (painted worlds, maps, chapter header) |

Each folder: `STUDY.md` (director's analysis) · `report.md` (pace/colour/sound numbers) · `overview/min-NN.jpg` (a frame
every 3 s) · `shots/shots-NN.jpg` (every shot) · `shots.json` · `audio.json` · `timing/` (transcript) · `video.mp4`
(local only, git-ignored). Look closer any time with `node tools/watch.mjs` (sheet / strip / frames / audio / transcript).
Add a new one: `node tools/watch.mjs ingest <file.mp4> --as <name>` → `transcribe <name>` → write its STUDY.md here.

## The AZTIKA target (synthesis of both)
1. **One question → one game device** that grows through the video and returns as the recap (leaderboard of podiums,
   a ladder, a map that fills, a scale). The viewer plays along.
2. **A home stage + chapter worlds**: one recurring stage where AZTIKA comments and the device lives; each chapter gets
   its own world (sunset for history, paper map, night city, painted plates).
3. **Rich hero objects** (illustrated cut-outs with rays/sparkles) vs **simple story people** (flat, faceless/stick,
   one costume item). Contrast makes the subject pop.
4. **Arabic text that moves with the voice**: word-by-word headlines, one gold key word, counting numbers, pills with a
   colour hierarchy (gold = now, white = before, grey = small), stamps, ×N brackets.
5. **Always alive**: a new beat every 2–4 s even inside long shots (both references lose energy in their long holds —
   our edge).
6. **AZTIKA as the host** in the hook, the device beats, reactions and the ending; never in every shot.
7. **A real ending**: recap device → thesis line → a warm sign-off (e.g. «في أمان الله»).

## Owner decision (2026-11-08)
- **Safe mode: copy the reference style as it is** (colours, text, glow, motion, sound mix). AZTIKA is our fingerprint.
  The measured specs: `universe-claude/STYLE-BIBLE.md`. English videos keep white mode.
