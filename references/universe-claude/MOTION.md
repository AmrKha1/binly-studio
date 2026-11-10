# MOTION — how things move in «وش أغلى شيء في الكون؟», measured frame by frame (2026-11-11)

How it is measured (not guessed): 60 fps frame strips (`node tools/watch.mjs strip universe-claude --at t --span 0.5
--fps 60`) to SEE each motion, then the element's real pixel size per frame (a colour mask inside a crop → its bounding
box ÷ its final size). Event times come from the sound map (SOUND.md: every effect = something appearing). Our kit's
curves are computed from its code (src/kit/anim.ts) on the same 60 fps frames. The STYLE-BIBLE §5 notes were eyeballed;
where they differ, this file wins.

## 1. Pop-in (words, pills, tags, bubbles) — ONE smooth swell, no wobble
| frame (1/60 s) | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7–8 | 10 | 12 | 14 | 17 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| word «غالي!» 0:25.46 | 0.65 | 0.80 | 0.90 | 0.99 | 1.10 | 1.14 | 1.15 | **1.16** | 1.13 | 1.08 | 1.04 | 1.00 |
| bubble 0:45.00 | 0.54 | 0.67 | 0.79 | 0.89 | 0.96 | 1.03 | 1.08 | 1.12 | **1.15** | 1.14 | 1.10 | 1.05→1.00 @20 |
- Appears already at ~0.55–0.65 of its size (no growing from a dot), reaches full size in **60–85 ms**, swells to
  **≈ 1.15 at 125–165 ms**, glides back to 1.00 by **280–330 ms**. Width and height grow TOGETHER (no squash/stretch).
  No undershoot, no second bounce.
- Fits almost exactly (±0.02): cubic ease-out 0.55 → 1.16 over 133 ms, then sine ease-in-out 1.16 → 1.00 over 150 ms.
- Bubbles grow OUT of the speaker (scale + move from the mouth), and the speaker's pose changes during the pop.
- **Ours (popIn, bounce 0.45, 0.25–0.3 s): a jelly wobble** — 1.12 wide / **1.30 tall** at 80 ms, then UNDER size
  (0.91–0.95), then over again, still at ~250 ms. Twice as fast, twice the swell, stretchy, wobbling = cartoonish.

## 2. Stamp slam («تم البيع» 3:18.03) — a clean press, decelerating, no shake
1.64 · 1.43 · 1.27 · 1.17 · 1.10 · 1.05 · 1.02 · 1.00 (first frame ≈ 1.75×; 133 ms), fading in while it shrinks, rock
still after. Then the story continues at once (the bought region spreads over the map).
- **Ours (Stamp): 1.6 → 1.0 ACCELERATING (u²) over 160 ms + a shake** — the opposite curve.

## 3. Camera
- **Never still:** a slow push-in ≈ **0.3–0.4 % zoom per second** on held shots (map 3:18–3:21, plus a slight pan).
- **Pull-back reveal** (0:06.6): the golden pillar goes from filling the frame to a small bar in ≈ 0.35 s, ease-out.
- Rays behind the host rotate slowly and continuously (0:15).
- **Ours:** no default drift — a shot moves only if its builder adds a camera by hand.

- **The board camera travels** (1:34.1–34.6): on a board return the camera pans to the newcomer's side and pushes in
  (≈ 0.5 s, ease-in-out); the old champion slides away, the newcomer's black silhouette pops in, the title word fades up
  while growing slightly. **The host is pinned to the SCREEN** (he does not move with the world/camera).
- **Ours:** PodiumGame has no camera at all — the board sits still while things grow on it.

## 4. Transitions
- **White flash** on a big slam/reveal («أنت!» 0:15.6): brightness jumps INSTANTLY to ≈ 50 % white (34 → 113 of 255),
  then fades exponentially — half gone in ≈ 100 ms, gone by ≈ 300 ms. **Ours: no flash component.**
- **Stripe wipe** (0:08.85): gold diagonal stripes enter from the top-left, cover the whole frame in ≈ 0.17 s, HOLD the
  cover ≈ 0.1 s (the cut hides inside), then clear. **Ours (StripeWipe 0.6 s ease-in-out): full cover only for an
  instant at the middle.**
- **End-of-scene exit** (0:27.4–27.6): the camera punches in on the key line while everything else FLIES OUT (pill and
  body drop away, host leaves) in ≈ 0.2 s, accelerating; only the key line stays into the next scene.
  **Ours: punchT ✓, but kit pieces leave by a 0.2 s fade (`out`), not by flying away.**
- Draw-on lines (roads 6:41): paths draw progressively, several at once.

## 5. Count-up («الوزن» 100 → 3,106 قيراط, 2:00.4–2:02.0)
| s | 0 | 0.2 | 0.4 | 0.6 | 0.8 | 1.0 | 1.2 | 1.4 | 1.6 |
|---|---|---|---|---|---|---|---|---|---|
| value | 100 | 107 | 178 | 319 | 588 | 1355 | 2183 | 2876 | 3106 |
- An S-curve skewed late (slow start builds suspense, fast middle, eases into the number), **1.6 s** — fits
  inOutCubic(p^1.6). The number is **white while counting and turns GOLD on the final value** (the payoff). It pops in
  with its small label pill above it first.
- **Ours (CountNumber): ease-out cubic (fast start), 1.2 s, one colour throughout.**

## 6. Word timing and life inside a held shot
- Words pop ON their spoken word or a hair before (0–90 ms) — «غالي» at its first syllable; a stamp 90 ms before its
  word; a bubble with the start of the quoted line. Never noticeably late. (Ours: entrances land ≈ 0.15 s before ✓.)
- Life in held shots = slowly rotating rays, twinkling sparkles, the slow camera push. A held diamond's brightness
  stays within ±0.6 % — **no pulsing glow** (the STYLE-BIBLE "glow breathes ±15 %" is not supported).

## 8. Growth, labels, scene changes (measured 2026-11-11)
- **Podium / bars rise** (0:24.3): height 87 → 121 → 147 → 161 → 173 → 175 px over ≈ 0.3 s — a plain ease-out over
  0.5 s (fits ±0.02), NO overshoot. Ours was spring(…, 0.3): 1.18 then 0.97 (jelly). → Podium, PodiumGame, MysteryPillar,
  NBars now `ease.out`.
- **Callouts** (0:20): the leader line draws out in ≈ 0.1 s, the label pops AT ONCE at its end, the gold tag ≈ 0.15 s
  later (line → label → tag). Ours: line 0.3 s, label after 0.25 s → now 0.12 s / 0.1 s.
- **Count-up with its spoken form** (0:20.6–23.0): the big number counts, decelerates into «45,000,000 $», turns gold,
  then the SPOKEN words «45 مليون دولار» appear under it in white (builder: a WordPop/NPill under the CountNumber).
- **Scene change = match-move dissolve** (0:24.1–24.3): the old scene dissolves (≈ 0.2 s) while its hero object FLIES to
  its place in the next scene (the body → onto its podium); the new scene enters zoomed in and SETTLES (1.53 → 1.00,
  `settleT`); the host rises in from the bottom-left.
- **Road-map path** (0:09.8–13.2): in Arabic it draws from RIGHT to LEFT (the mystery waits at the left end), ≈ 3.4 s,
  each station's object pops as the head arrives. Ours ran left → right → JourneyPath now defaults to RTL in Arabic.
- **Headline words:** the KEY word pops (the swell); supporting words fade in softly (≈ 0.1 s) (0:12.9, 1:34.6).
- **"Time passing":** the year badge counts UP faster and faster (1704 → 1705 → 1707 → 1711 → 1718 → 1730, 1:07.2–07.7)
  while the room slides away.

## 9. The host and the bubbles
- AZTIKA **enters by fading in** (≈ 0.2 s, 0:30.3) or **rising in from the bottom-left during a dissolve** (0:24.2) —
  silently. Characters **swap poses instantly** (0:45.07) — no squash, no bounce. Ours: a 10 % squash-and-stretch spring
  on every pose switch → AZTIKA now swaps instantly (`swap="cut"`), new host moves `fade` · `riseSoft` · `fadeOut`.
- **Bubbles exit by shrinking back into the speaker's mouth** (≈ 0.15 s, 0:50.5), the ✔ with them — ours faded → fixed.
  A bubble swells a little slower than a word (peak at 165 ms) → its pop now runs over 0.33 s.

## 10. Automatic check: no frozen frames
Inside the reference's shots the picture never changes by less than 0.36 % in 1.35 s (95 % of the time > 2.4 %;
268 samples). `node tools/sync-check.mjs` now flags **FROZEN** (Arabic videos) when a sentence's picture changes < 1 %
(raw, camera drift counted) — add `pushT` / a camera move / something alive.

## 7. THE GAPS — all FIXED 2026-11-11 (kit/anim.ts popRef · pressIn · countCurve · flyOut · pushT; night-fx Flash,
StripeWipe, CountNumber, Stamp; night-game boardCamT + the mystery reveal), each checked on rendered frames with the same
pixel measure: pill pop peaks 1.16 like the reference (one frame earlier), stamp matches frame for frame (1.43 · 1.28 ·
1.17 · 1.09 · 1.05 · 1.02), count 97 → 634 → 2,228 → 3,106 gold vs 100 → 588 → 2,183 → 3,106. Found while checking: the
mystery silhouette overlapped the old champion and vanished before the object appeared — fixed (steps aside first,
replaced in place). Exits (flyOut) and the camera push (pushT) are tools the builder applies per shot (docs/kit/night.md).
1. **Pop-in** (≈ 29 kit pieces): jelly wobble → the reference's single swell (0.55 → 1.16 → 1.00 in ≈ 280 ms, no squash).
2. **Camera never still**: a default slow push (≈ 0.35 %/s) on every held shot.
3. **Board camera**: PodiumGame pans + pushes to the newcomer (≈ 0.5 s ease-in-out); host stays pinned to the screen.
4. **Count-up**: late S-curve 1.6 s + white → gold on the final value.
5. **Stamp**: decelerating press from 1.75×, fade in, no shake.
6. **Exits**: fly out (accelerating, ≈ 0.2 s) instead of fading.
7. **Flash**: new — instant ≈ 50 % white, exponential fade 300 ms.
8. **Stripe wipe**: in 0.17 s · hold 0.1 s · out ≈ 0.2 s.
