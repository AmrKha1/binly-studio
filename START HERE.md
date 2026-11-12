# Binly Studio — how to make a video

## Every video (3 steps)
1. Put these in the `input` folder:
   - your voiceover (`.wav`, `.mp3`, `.m4a` or `.flac`) — one file, OR all its recorded **parts** (loose or in one folder),
     numbered in order ("1 …", "2 …", … "10 …"). The Studio levels every part to the same loudness, joins them and
     shortens every pause longer than 0.23 s to 0.19 s, with exactly 0.35 s between two parts. Then a **voice check** listens
     for problems (volume jumps, clicks, noise, hum, distortion, cut words); if it finds something it stops and tells you
     the exact times to listen to (report: `input/vo-check.md`). The finished video comes out as a YouTube-ready master (web-optimised, correct colours,
     high quality, −14 LUFS / −1 dB true peak) — upload it as it is. Older videos: `node tools/youtube-export.mjs "D:my video.mp4"`.
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
- `videos/<name>/output/<name>-short-1.mp4` — the hook Short (after Stop 4)
- `videos/<name>/REPORT.md` — what was made and the quality-check results

## Your 4 stops (everything else runs by itself)
1. **Stop 1 — the plan:** the chapters, the signature moments ("new vs the last videos"), the new pieces — and whether
   to use Flow for a few backgrounds/objects. Nothing is built before your OK.
2. **Stop 2 — chapter 1 preview:** watch the FEEL at full speed (motion, sound) before the rest is built the same way.
3. **Stop 3 — the final video:** 1440p 60 fps (Arabic), −14 LUFS, checked in the QA report.
4. **Stop 4 — the hook Short:** ONE vertical Short (1080×1920 60 fps) from the best moment, stopping before the answer —
   title on top, gold word-by-word subtitles, the red «الفيديو الكامل على القناة» pill, your outro voice at the end.
   Publish it AFTER the long video and link it to the long video in YouTube Studio ("Related video").

Before ANY render the **Render Gate** checks everything the viewer will see and hear (overlaps, motion, sound, numbers
as spoken, names as written…) and fixes real problems until it says GO. Arabic videos end on the yellow like/subscribe
CTA (5 silent seconds to tap).

## Privacy
Your voiceover and script are unreleased: they go to the cloud SEALED (encrypted) and the temporary upload is deleted
after the render. Only word timings (numbers, no words) are stored on GitHub.

## After publishing: make the next video better
A few days after a video is live, open YouTube Studio → the video → Analytics → Engagement, take screenshots
of the **audience retention graph** (and the numbers), and type `/learn-from-youtube` + paste them.
Claude finds where viewers left and why, and writes lessons the Studio uses for every future video.

## Every 3–5 videos: let the Studio improve itself
Type `/improve-studio`. Claude merges the lessons from your last videos into the Studio's rules, turns useful
things the helpers built (characters, objects, scenes) into permanent kit parts, adds new ready-made shots, and keeps
the instructions short — so each video is faster, cheaper and better than the last.

## Watching progress
Claude does NOT open a live preview (it slows this PC). It reviews with contact sheets and shows you results.
If you want to watch yourself: `node tools/preview.mjs` in the Binly Studio folder → http://localhost:3000.

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

## Two channels
- **English** script → English video with **Oddestory**, Poppins font. **Arabic** script → Arabic video with **AZTIKA**,
  Arabic font, right-to-left. Detected automatically; the two are never mixed (a check blocks any mix).
- Generated art (Flow, free) is a bonus: if Flow refuses, the video is still made with code-built scenes.

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
