# Binly Studio — how to make a video

## Every video (3 steps)
1. Put **two files** in the `input` folder:
   - your voiceover (`.wav`, `.mp3`, `.m4a` or `.flac`)
   - the script as a `.txt` file (the same text you recorded — numbers/spelling are taken from it)
   - optional: `notes.txt` with special wishes ("make the king appear as a chess piece", "darker mood")
2. Open **Claude Code** in this folder (`Binly Studio`), choose **Opus**, and type:
   > **/make-video**

   (or just "make the video"). You can add wishes after it, e.g.
   `/make-video darker mood in the plague part, show the king as a chess piece`
3. Wait. Claude plans the video, helpers build each chapter, it renders in the cloud for free, checks the
   result, and puts the finished MP4 in `videos/<name>/output/`. A short report is in `videos/<name>/REPORT.md`.

Your PC only does light work (planning and small preview pictures). The heavy rendering happens on GitHub.

## Fixing / polishing a video after it's done
- Your own list: `/polish-video at 2:31 the label covers the king's face; at 7:10 the transition is too abrupt`
- Let Claude check and fix everything itself: `/polish-video` (with nothing after it)
Best: run `/polish-video` once, watch, then send your own list. Use the same session if it's still open,
otherwise a new one. The fixed video appears as the next version in `videos/<name>/output/`
(`<name>-v2.mp4`, `-v3` … — the highest number is the newest; old versions are kept).

## If a session stops (usage limit, closed window)
Open Claude Code here again and say **"continue the video"** — progress is saved in files.

## Good to know
- **Model:** the main session works best with **Opus**. The chapter helpers use Sonnet (cheaper) and Opus
  for the opening and climax. To change it, edit the `model:` line in `.claude/agents/binly-builder.md`.
- **Music:** generated automatically. For even better music, drop royalty-free tracks (e.g. from the free
  YouTube Audio Library) into `library/music/` and tell Claude to use them.
- **Preview by yourself:** `npx remotion studio` opens an interactive preview in your browser.
- **Where things are:** `videos/<name>/` = everything about one video · `src/kit/` = the animation library ·
  `docs/` = the rules and guides Claude follows · `brand/` = your original channel documents.
- **Your channel rules** live in `brand/` and `docs/PLAYBOOK.md`. To change the style for all future videos,
  ask Claude to update them.
