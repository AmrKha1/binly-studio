# Binly Studio — how to make a video

## Every video (3 steps)
1. Put **two files** in the `input` folder:
   - your voiceover (`.wav`, `.mp3`, `.m4a` or `.flac`)
   - the script as a `.txt` file — just as you wrote it, no need to transcribe anything. **The voiceover is the main
     engine:** the video follows what you actually SAID. The script only helps spell names and numbers correctly; if you
     changed, added or skipped lines while recording, the voiceover wins automatically.
   - optional: `notes.txt` with special wishes ("make the king appear as a chess piece", "darker mood")
2. Open **Claude Code** in this folder (`Binly Studio`), choose **Opus**, and type:
   > **/make-video**

   (or just "make the video"). You can add wishes after it, e.g.
   `/make-video darker mood in the plague part, show the king as a chess piece`
3. Wait. Claude plans the video, helpers build each chapter, it renders in the cloud for free, checks the
   result, and puts the finished MP4 in `videos/<name>/output/`. A short report is in `videos/<name>/REPORT.md`.

Your PC only does light work (planning and small preview pictures). The heavy rendering happens on GitHub.

## What you get with every video
- `videos/<name>/output/<name>.mp4` — the video (fixed versions: `-v2`, `-v3` … highest = newest)
- `videos/<name>/youtube/` — `description.md` (paste into YouTube: hook line, clickable chapters, credits) and
  `captions.srt` (upload in YouTube Studio → Subtitles; exact script wording, perfectly timed)
- `videos/<name>/REPORT.md` — what was made and the quality-check results

## One quick question during production
After the opening chapter (the hook) is built, Claude shows it to you and asks: **continue or change?**
Answer in a few words — the other chapters keep building meanwhile, so no time is lost. (Say "don't ask me
anything" after `/make-video` if you want it fully automatic.)

## After publishing: make the next video better
A few days after a video is live, open YouTube Studio → the video → Analytics → Engagement, take screenshots
of the **audience retention graph** (and the numbers), and type `/learn-from-youtube` + paste them.
Claude finds where viewers left and why, and writes lessons the Studio uses for every future video.

## Every 3–5 videos: let the Studio improve itself
Type `/improve-studio`. Claude merges the lessons from your last videos into the Studio's rules, turns useful
things the helpers built (characters, objects, scenes) into permanent kit parts, adds new ready-made shots, and keeps
the instructions short — so each video is faster, cheaper and better than the last.

## Watch it live while it's being made
Claude opens a **live preview** (player + timeline) in the side panel. Chapters appear there as soon as
the helpers finish them — no rendering. Pause on any problem, take a screenshot (with the time visible),
paste it into the chat with a few words. Fixes show up in the preview within seconds of being saved.
When everything looks right, Claude renders the final file in the cloud (that's the "export").
Open it yourself any time: `node tools/preview.mjs` in the Binly Studio folder → http://localhost:3000
(playback can stutter on this PC in heavy scenes; pausing/scrubbing is always fine).

## Fixing / polishing a video after it's done
- Your own list: `/polish-video at 2:31 the label covers the king's face; at 7:10 the transition is too abrupt`
- Let Claude check and fix everything itself: `/polish-video` (with nothing after it)
Best: run `/polish-video` once, watch, then send your own list. Use the same session if it's still open,
otherwise a new one. The fixed video appears as the next version in `videos/<name>/output/`
(`<name>-v2.mp4`, `-v3` … — the highest number is the newest; old versions are kept).

## If you hit the 5-hour usage limit
You don't need to do anything: Claude Code **waits and continues by itself** when the limit resets — as long as
the session stays open and the PC doesn't sleep for more than ~30 minutes (then press Enter once).
Tip: in Windows power settings set "Sleep: Never" while a video is being made.
If the window was closed: open Claude Code here again and say **"continue the video"** — progress is saved in files.

## Habits that save usage (tokens)
- **One video per session.** Start a new session for each new video (a fresh, small memory is cheaper).
- **Don't switch model or effort in the middle of a production** — it resets the cache and the next steps cost more.
- **Avoid leaving a production idle for more than ~1 hour** (the cache expires; the next message re-reads everything).
  If you must stop, just come back and say "continue the video" — progress is in files.
- **Send fixes together** (one message with all screenshots/notes), not one by one.
- Check your usage any time: Claude app → Settings → Usage.

## Good to know
- **Model:** the main session works best with **Opus**. The chapter helpers use Sonnet (cheaper) and Opus
  for the opening and climax. To change it, edit the `model:` line in `.claude/agents/binly-builder.md`.
- **Sound:** no music — only sound effects, on every movement (automatic from the animations + story sounds).
  Free CC0 sounds live in `library/sfx/`.
- **Preview by yourself:** `npx remotion studio` opens an interactive preview in your browser.
- **Where things are:** `videos/<name>/` = everything about one video · `src/kit/` = the animation library ·
  `docs/` = the rules and guides Claude follows · `brand/` = your original channel documents.
- **Your channel rules** live in `brand/` and `docs/PLAYBOOK.md`. To change the style for all future videos,
  ask Claude to update them.
