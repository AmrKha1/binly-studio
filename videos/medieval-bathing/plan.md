# Plan — medieval-bathing · "Did Medieval People Really Never Bathe?" · 10:42.8

**Logline:** Medieval Europe bathed happily — until its doctors' own logic turned the same hot bath from medicine into an open door for plague, and a different disease, 150 years later, finally emptied the bathhouse.
**Driving question:** how can ONE hot bath be both medicine and a way to let death in? (second loop, 06:49: if the plague didn't kill the bathhouse, what did?)

## Story spine
- **Hook 00:00–01:00** — the paradox in the first 7 s: one steaming tub, warm medicine → the same tub turns ink, death seeps in. The myth (dirty Middle Ages) set up and struck "mostly wrong" (00:36). Promise: a framework so logical a king ordered a report.
- **World 01:00–01:58** — the bathhouse as a public square with water: lively, social, regulated, Paris streets named after baths, real soap. Ends on the turn "So where does the fear come from?"
- **Rising 01:58–03:12** — bathing as MEDICINE: four humors, balance, heat & moisture as forces. Porous skin: "Heat opens the body" (03:10) = the rule we plant.
- **Collision / climax 03:12–05:01** — 1348, Black Death, miasma. Two ideas side by side → King Philip VI's report → the warning. **Reveal 04:34: "the contradiction disappears"** — same pore, two airs.
- **Turn 05:01–06:22** — not a monolith: Ibn al-Khatib & Ibn Khātima argue contagion; crowding was a real danger.
- **Second loop 06:22–08:05** — the obvious ending is false; bathhouses survived → syphilis → Zurich 1496 ordinance (evidence in writing).
- **Resolution 08:05–09:20** — Erasmus 1523; slow, uneven decline; bathing never stopped → a *redistribution* of cleanliness.
- **Payoff 09:20–10:43** — back to the tub: one idea, two situations; what they got right; the bath stayed, the world changed. Bookend on the first image.

## Visual thesis — "The open body"
Skin as a wall of tiny doors. Heat (steam) opens them. In clean air, what's inside flows OUT (healing, warm/green); in corrupted air, plum miasma flows IN. One mechanism, two worlds — the video's whole argument in one picture, planted in C03, paid off in C04, echoed in C08.

## Motifs
- **Steam** = heat = opening. Every bath steams; plague-year steam curls plum.
- **Pore doors** (PoreSkin) — appear at every "opens the body".
- **The bathhouse lantern** — the institution's health: lit & busy (C02) → dimmed during plague (C04 end) → relit (C06) → in C07 its one big light splits into many small window lights across the town (redistribution).
- **The paper trail** (evidence green): Paris report 1348 → Zurich ordinance 1496 → Erasmus 1523.
- Certainty colours: green = documented; plum = theory (miasma, pores); mustard = caution (estimates, literary observation); oxblood = one beat per scene.

## Palette leaning
Warm paper, wood, lamp light, steam for bath life; ink panels for 1348; plum fog for miasma. No new hues.

## Shared components (NEW, flexible — `src/videos/medieval-bathing/shared/`)
1. **PoreSkin** — skin cross-section strip with pores as tiny openings. Dials: x,y,s,w, pores, open 0..1, heat 0..1 (warm tint + steam), flowOut 0..1 (warm/green wisps & drops leaving), flowIn 0..1 (plum wisps entering), sealed (modern "barrier" look), tone paper/ink, t, seed.
2. **HumorWheel** — four humors (blood, phlegm, yellow bile, black bile) in quadrants on hot/cold × wet/dry axes; dials: reveal[4], axesP, highlight, balance/tilt, s, t.
3. **Miasma** — corrupted-air tendrils/fog bands; dials: x,y,w,h, density, spread p, drift vx, toward {x,y} (flows into a target), color (plum default), t, seed.
4. **HeroTub** — hero close-up of a steaming wooden tub (hook + bookend); dials: split 0..1 (right half turns ink, steam plum), steam, light, bather 0..1 (shoulders/head of a bather, clothed look), t.
Everything else: kit (Bathhouse, Street, CitySkyline, Person/Crowd, DocumentPage, templates, archival).

## Chapters
C01 0–60.3 hook · C02 60.3–117.6 bathhouse · C03 117.6–192.45 medicine & pores · C04 192.45–300.9 1348 & the report (climax) · C05 300.9–382.3 not a monolith · C06 382.3–485.0 what killed the bathhouse · C07 485.0–560.0 never stopped bathing · C08 560.0–642.84 back to the bath.

## Music arc
curious (hook) → playful (myth) → warm (bathhouse) → curious/wonder (medicine, pores) → drop → dark/tension (1348) → drop before 04:34 → swell → reflective → curious (Granada) → playful (obvious ending) → tension (syphilis, Zurich) → reflective (decline) → warm resolve.

## Archival images (fetched in planning, see shot lists)
Bathhouse miniature (crop safe), Paris "Rue des Étuves" sign, physician/uroscopy, Tournai 1349 burial, Philip VI, Granada/Alhambra, Dürer 1496 syphilis sheet, Zurich c.1500 (Hans Leu), Erasmus (Holbein 1523).
