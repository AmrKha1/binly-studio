# RECIPE — how «وش أغلى شيء في الكون؟» is BUILT (the director follows this for every AZTIKA video)

STYLE-BIBLE.md says how things LOOK; GAP-CHECK.md says what the kit can make; this file says how the video is
STRUCTURED, measured from all 176 shots (2026-11-10). It applies to every Arabic video, whatever the topic: the topic
changes, the recipe stays. `node tools/plan-check.mjs` checks the plan against it (RECIPE flags) before anything is built.
"Our edit" = where we deliberately do better than the reference (owner: copy it, small improvements allowed).

## 1. The formula in one line
**One question → a game that grows → each chapter = a mini-story that ends in a bigger answer → back to the game board →
a last twist that changes the question → a warm sign-off.**
The reference: "what is the most expensive thing?" → the podium leaderboard → 13 contenders, each pricier → the recap
row → "the universe gave us everything for free" → «في أمان الله».

## 2. The spine = the home stage (the game board)
- One **home stage** for the whole video (NightSky + GridFloor + the game device). The reference returns to it **12 times**,
  every **25–150 s (typically ~50 s)**; 17 % of the screen time. Every return = a new round: the newcomer arrives, the
  board changes (taller podium, ×2 bracket, the old champion steps aside), AZTIKA reacts.
- The game device depends on the question: ranking → **PodiumGame** · "from the cheapest to the most expensive, step by
  step" (a ladder of cases, often with a twist at the top) → **StairGame** (summit «؟» from the hook, the twist takes the summit) · biggest/oldest/fastest → PodiumGame (value = size/
  age/speed) · history of one thing → **NTimeline** that grows · "how did X fall/rise" → a **NGauge**/scoreboard that
  moves · places → **NightMap** that fills · a list ("7 secrets") → **ChapterTitle** + a numbered board. Pick ONE device
  per video and keep it; it is also the recap.
- **Our edit:** never more than **150 s** away from the board (the reference's longest gap, 150 s, is in its slowest part).

## 3. The hook (0–60 s) — the reference: 22 visual changes, one every 2.7 s
1. **0 s — a visible payoff at once**, never a title: the biggest image of the promise (money pile + counting calendar
   + AZTIKA presenting). Counting numbers make the first second move.
2. **The question**, word by word (WordPop), key word gold.
3. **The road map** (JourneyPath): a dotted path through what's coming, ending at the **MysteryBox** = the answer the
   viewer must wait for. Then a StripeWipe.
4. **"It starts with YOU"** — the personal entry point (AZTIKA centre on rays, «أنت!»), then the first contender
   within ~30 s (the reference: the human body, 45 M $, at 0:21).
5. First return to the board by ~25 s: the first podium appears — the game has started.
- Pace: **≤ 3 s per shot** in the first minute (reference 2.7 s, median 1.7 s).

## 4. A chapter (one contender / one step of the story) — 30–170 s, typically 50–80 s
| step | what | devices (kit) | time |
|---|---|---|---|
| 1 Bridge + tease | "but something is pricier…" — a silhouette or mystery over the board | PodiumGame mystery · MysteryTile · Stamp «مو الأغلى» | 2–5 s |
| 2 Place & time | where/when the story happens | YearBadge (counts back) on SunsetWorld · NightMap · NightCity · SpaceWorld · PlateWorld | 3–6 s |
| 3 Mini-story | 3–8 shots of people doing things — story first, number second | StoryPerson + RoomWorld/MineWorld/VillageWorld · Bubble ✔/✖ · CalendarCard · ProgressBar · Newspapers · Lineup | 15–40 s |
| 4 The reveal | the object + its exact number | HeroObject on Rays + RevealRing · CountNumber · NPill stack · Callout/Measure | 5–15 s |
| 5 Back to the board | the newcomer takes its place, ×N if it jumps | PodiumGame · AZTIKA point/react/wow/higher | 5–10 s |
| 6 Turn | why it matters / the twist that opens the next chapter | StrikeSwap · Stamp · MarkPill · Bubble | 2–6 s |
- AZTIKA is **on the board and the reveals**, **off in the mini-stories** (story people act them). His beats follow
  BEAT_POSE (present · point · react · higher · wow · think · list · sure · you · awe…).
- Every chapter switches the **world palette** (sunset = history, paper map = geography, city = money, red = war, teal =
  science, space = space, beige = everyday/funny) — the home stage stays purple.

## 5. Sentence → picture (the reference never shows a sentence without a device)
| the sentence says… | show |
|---|---|
| a number / price / weight | CountNumber (exact as said) + NPill (gold = now, white = before, grey = small) |
| "X times bigger" | PodiumGame times ×N bracket · NBars |
| a year / "back in…" | YearBadge counting back on SunsetWorld |
| a place / border / deal | NightMap (paper; `spread` for growth/conquest) + Flag + PriceTag + Stamp |
| how big / how long | Measure line · SizeBracket (Measure) · scale comparison next to a familiar thing |
| an estimate that keeps rising | NGauge |
| comparison of two amounts | NBars / NBarChart |
| "not X, not Y, not Z — it was…" | Lineup with ✖ · MarkPill rows · StrikeSwap |
| a list of features | IconList |
| a sequence of events | NTimeline (+ red «؟» pin for "something bigger…") |
| "nobody knows / unclear" | CloudWorld + BlueprintCard «؟» |
| a choice / "rarity or prestige?" | ChoiceCards that flip |
| a person's words | Bubble (✔/✖ on the answer) |
| a real person | story character with ONE identifying detail + name pill (Napoleon = bicorne) · a real face that truly matters → NightPortrait (free-licence photo) |
| a real object / artwork / place | illustrated hero art (HeroObject), never a photo — even the Mona Lisa |
| the news / fame | Newspapers + PaperStorm |
| a quote / Quran / hadith | QuoteCard (never popped) |
| tiny / invisible | Magnifier «×1,000,000» · WeighScale «1.000 g» |
| "one for every…" / huge counts | MassGrid |
| money flowing | MoneyPile · FlyingBills · CoinRain · FactoryLine |

## 6. The ending (last ~60–90 s)
1. **Recap** on the board: every contender in one row + the question again under it (PodiumGame recapAt + WordPop).
2. **The twist** that changes the question (the reference: the price concept collapses in space → the universe's
   invoice: Receipt «0 $» + MarkPill «ما اشتريناها ✖…»).
3. **The thesis line** over the biggest image (galaxy), word by word.
4. **Sign-off**: AZTIKA from behind looking up (`awe`), then NeonSign with the owner's OWN closing words (the reference:
   «في أمان الله»; if he says «سلام» or asks for a like/subscribe, the sign and AZTIKA's beat follow what is said — the
   voiceover is the truth). Silence after it. No added "subscribe" card or button graphics.
- **When the ranking isn't by the number** (the winner is the smallest price, or the category changes: money → people
  → time), the board must SHOW the new rule — that turn is the video's signature moment, built new (PodiumGame value =
  the real rank, label = the spoken number).

## 7. Rhythm (measured, per part of the video)
| part | reference avg / median per shot | ours |
|---|---|---|
| 0–1 min | 2.7 s / 1.7 s | ≤ 3 s |
| 1–3 min | 3.5 s / 2.6 s | ≤ 4 s |
| 3–7 min | 4.6 s / 5.2 s | ≤ 5 s |
| 7–11 min | 6.3 s / 5.0 s | **≤ 5.5 s (our edit)** |
| 11–15 min | 7.6 s / 6.2 s | **≤ 5.5 s (our edit — the reference's slowest part)** |
- Something animates every 2–4 s inside a held shot (count-ups, pills, word pops, host beats, camera drift).
- **Our edit:** no shot over 8 s without a new beat (the reference holds 15–22 s at 8:45, 9:11, 11:56 — its weak spots).

## 8. Words, sound, host — fixed (see STYLE-BIBLE / PLAYBOOK)
Text: one headline per shot, ≤ 5 words, ONE gold key word; numbers exactly as spoken; sizes per the PHONE rule.
Sound: no music; the MEASURED map in SOUND.md (≈ 23 effects/min, median 21 dB under the voice; boom / shimmer / pop / thump /
riser / whoosh / tick per what is on screen) — the night kit cues it by itself.
Host: AZTIKA alive but calm (moves ≥ 6 s apart with a reason, never frozen > 8 s), off-screen in mini-stories.

## 9. How the plan declares it (plan-check reads these)
In shots/<Cxx>.json, each shot may carry `"device"`: one of
`stage · mystery · roadmap · story · reveal · rays · count · map · timeline · chart · gauge · list · lineup · measure ·
compare · quote · news · choice · space · recap · twist · thesis · signoff` — and the video's `"recipe"` in
chapters.json (`{"recipe": {"device": "podium", "question": "…"}}`). plan-check then flags (RECIPE):
- **HOOK** first 60 s average shot > 3 s · no `mystery`/`roadmap` in the first 45 s
- **SPINE** no `stage` shot at all · a gap > 150 s between `stage` visits
- **PACE** any 3-minute window averaging > 5.5 s per shot (after the hook)
- **ENDING** no `recap` and no `signoff` in the last 120 s
- **CHAPTER** a `reveal` not followed by a `stage` visit within 60 s (the newcomer never joins the board)
- **SCENE** a chapter's first shot without `"in"` (match · dissolve · wipe · flash · whoosh) · its last shot without
  `"out"` (fly · wipe · whoosh) · a `stage` shot right after a `reveal` that is not `"in": "match"` (the hero object
  flies onto its podium — reference 0:24.2) — MOTION.md §4, §8
- **FLOW** a shot using Flow art declares `"flow": "plate"|"object"` + `"fallback"` (the Claude-made version); painted
  backgrounds ≤ 25 % of the video and never alone — Claude animation on top (`"beats"`)
- **NUMBER** a `count` shot whose narration says مليون / مليار / ألف without `"spoken"` (the number in words under it,
  exactly as said — reference 0:23 «45 مليون دولار»)
Accept a flag on purpose with `"ok": "why"` like every other plan-check flag.
