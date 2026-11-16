# MODEL TEST — do Sonnet builders hold the quality? (owner 2026-11-16)
The project decides by itself with the rule below — no opinion, no asking around. Read by the director at the end of the
SECOND Arabic video (PIPELINE step 4 "MODEL TEST").

## The rule (decided at delivery of Arabic video #2)
Compare the SONNET chapters of video #2 with the OPUS chapters (video #1 baseline below + the Opus chapters of #2).
KEEP the mix (Opus for hook/climax/ending, Sonnet for the rest) only if ALL of these hold:
1. **Fix rounds:** Sonnet chapters average ≤ baseline average + 0.5 review fix rounds, and none needs a 3rd round.
2. **Gate:** real render-gate issues (round 1, after gate-ok) per Sonnet chapter ≤ 1.5 × the Opus average.
3. **Look:** the director's sheet score (below) for Sonnet chapters averages ≥ 4.0 and none is under 3.
4. **No regression the owner sees:** the owner's /polish-video notes don't single out Sonnet chapters.
Otherwise → go BACK to Opus for every builder. Either way: write the numbers + the decision in docs/LESSONS.md, update
PIPELINE step 4 (make the winner the standard, delete the "MODEL TEST" paragraph) and tell the owner in one line.

## Sheet score (director, at the first review of each chapter, before any fix) — 1 to 5
5 = would fit inside the reference video as is · 4 = small fixes only (sizes, positions) · 3 = one real problem
(a weak signature, an empty/crowded moment) · 2 = several real problems · 1 = rebuild.

## How to record (every Arabic video from #2 on)
At each chapter's first review add one row to `videos/<slug>/builders.md`:
`| Cxx | model | score | fix rounds | gate real issues (round 1) |` — fill fix rounds and gate issues as they happen.

## Baseline — Arabic video #1 `ar-costly-mistakes` (every builder Opus 5.5; scores given at first review)
| ch | model | score | fix rounds | gate real issues |
|---|---|---|---|---|
| C01 hook | opus | 4 | 1 | 0 |
| C02 | opus | 4 | 0 | 1 (host over a card) |
| C03 | opus | 4 | 0 | 1 (host over landfill) |
| C04 | opus | 4 | 1 | 0 |
| C05 | opus | 4 | 1 | 3 (host, bundles over heads, gavel) |
| C06 | opus | 4 | 0 | 0 |
| C07 | opus | 5 | 0 | 1 (host over tower) |
| C08 | opus | 4 | 1 | 1 (unspoken year 2008) |
| C09 | opus | 4 | 1 | 1 (label on label) |
| C10 climax | opus | 4 | 1 | 1 (crowded lineup) |
| C11 | opus | 4 | 1 | 2 (unspoken year 1876, door over head) |
| C12 ending | opus | 3 | 1 | 1 (recap pills doubled) |
Averages: score 4.0 · fix rounds 0.67 · gate real issues 1.0 per chapter · usage-limit pauses in the build: 3.
