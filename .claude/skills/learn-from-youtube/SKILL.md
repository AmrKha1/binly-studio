---
name: learn-from-youtube
description: Learn from a published Binly video's real YouTube analytics (retention graph screenshots, average view duration, CTR, comments) and turn it into lessons that improve every future video. Use for "/learn-from-youtube", "here's my retention graph", "why did people leave".
---

The user shares real results of a published video (screenshots of the YouTube Studio retention graph / key moments,
numbers like average view duration, average % viewed, CTR, and maybe notable comments). Work lean: this is analysis,
not production.

1. Identify the video (ask only if unclear) → `videos/<slug>/chapters.json`, `plan.md`, `briefs/`.
2. Read the graph: the first-30-seconds drop, the steady slope, every sharp drop (> ~5 points within ~20 s), spikes
   (re-watches) and the ending. Convert each to a timestamp → chapter + shot (briefs list shots with times). Use
   `node tools/sheet.mjs --times …` on 2–4 key moments if you need to see what was on screen (activate the video
   first with `node tools/activate.mjs <slug>`).
3. For each moment, give the most likely cause in one line (visual stale for too long? unclear image? weak hook? a
   topic turn without a re-hook? a payoff that came too late? spikes = what people loved).
4. Write the result:
   - `videos/<slug>/RESULTS.md` — the numbers, the moments, the causes (short).
   - `docs/LESSONS.md` — only DURABLE lessons, phrased as rules for future videos, marked `(data: <slug>)`.
   - If a lesson is strong and repeated across videos, update the principle itself in `docs/RETENTION.md` or
     `docs/CRAFT.md` (keep them short — replace, don't pile up).
5. Tell the user in plain words: what worked, what lost viewers, and what the Studio will now do differently.
Never invent numbers you can't read from the screenshots; say when something is uncertain.

User's material/notes: $ARGUMENTS
