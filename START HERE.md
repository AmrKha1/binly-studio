# Binly Studio — how to make a video

## Every video (3 steps)
1. Put **two files** in the `input` folder:
   - your voiceover (`.wav`, `.mp3`, `.m4a` or `.flac`)
   - the script as a `.txt` file (the same text you recorded — numbers/spelling are taken from it)
   - optional: `notes.txt` with special wishes ("make the king appear as a chess piece", "darker mood")
2. Open **Claude Code** in this folder (`Binly Studio`) and type:
   > **make the video**
3. Wait. Claude plans the video, helpers build each chapter, it renders in the cloud for free, checks the
   result, and puts the finished MP4 in `videos/<name>/output/`. A short report is in `videos/<name>/REPORT.md`.

Your PC only does light work (planning and small preview pictures). The heavy rendering happens on GitHub.

## Changing a video after it's done
Open Claude Code here and describe the change, e.g. *"in medieval-baths, make the king scene longer and
use a darker colour mood"*. Claude edits that chapter and renders a new version (older versions are kept).

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
