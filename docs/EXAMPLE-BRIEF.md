# Example brief — the standard every chapter brief meets (illustrative times; real ones come from tools/cue.mjs)
A builder must be able to build every shot WITHOUT GUESSING: what we see (size + focus), what moves in what order on
which words, exact on-screen text, which kit pieces/images, the camera, how it enters and leaves, and when it's done.
Specify the WHAT precisely; leave the HOW (exact curves, small details, polish) to the builder's craft.

---
# C02 · 01:24.0–02:51.0 · "A public square with water in it"
**Purpose:** destroy the "medieval people were dirty" myth with a lively, crowded, joyful bathhouse — then pivot to medicine.
**Enters from:** C01 ends on a single steaming tub (close). **Hands off to:** C03 enters from the four-humors diagram (ink).
**Mood:** warm, playful → curious. Palette leaning: warm paper, wood, steam; oxblood only on "medicine".

**S1 [01:24.0–01:31.6] "Picture a medieval European city in the 1300s."** — custom
- SIZE + FOCUS: wide establishing; a medieval city skyline at dusk, focus on a steaming bathhouse roof centre-right.
- ACTION: on "Picture" the skyline fades up from paper; on "city" smoke + steam rise; on "1300s" Kicker "PARIS · 1300s" slides in top-left.
- KIT: CitySkyline(medieval, layer far/mid), Sky(dusk), Steam, Kicker. CAMERA: slow push toward the bathhouse (1.0 → 1.25).
- DONE WHEN: the bathhouse is clearly the focal point by 01:29; nothing static > 2 s.

**S2 [01:31.6–01:38.9] "…you go to the bathhouse."** — custom
- SIZE + FOCUS: medium; interior of the bathhouse, two shared wooden tubs, 5–6 bathers (Crowd medieval, Person), steam.
- ACTION: camera continues the push THROUGH the roof (zoom transition) into the interior; bathers laugh/talk (talk dials) on "go".
- KIT: Bathhouse(back/front layers), Person ×2, Crowd, Steam, LightShaft. IN: zoom-through from S1. CAMERA: drift right.
- DONE WHEN: reads instantly as "crowded social bath", not a hospital; faces readable.

**S3 [01:38.9–01:46.0] "There was food, drink, and conversation."** — template ListShot
- TEXT (exact): title "What the bathhouse offered"; items "Food" (icon `flame`), "Drink" (`drop`), "Conversation" (`speech`) — each pops ON its spoken word (cues from tools/cue.mjs).
- IN: paper slide from right. DONE WHEN: each label lands within 0.2 s of its word.

**S4 [01:46.0–01:53.2] "In Paris, there were enough public baths that some streets were named after them."** — template EvidenceShot
- IMAGE: `img/paris-bathhouse.jpg` (fetched in planning; manuscript bath scene), caption "A bathhouse, Paris, 15th century", credit from CREDITS.md.
- MARK: the street-name sign region on "named after them". TAG: "Documented" (confirmed).
- DONE WHEN: the camera ends close on the marked detail as the sentence ends.

**SFX:** `crowd` 01:31.8 (dur 4, gain 0.6), `splash` 01:33.0, `paper` 01:38.9, `page` 01:46.0.
**Music:** warm → curious at the end of S4 (score.json section already planned).

shots/C02.json (the template shots as data):
```json
{"shots":[
 {"id":"S1","start":84.0,"custom":true,"note":"medieval city at dusk, push toward steaming bathhouse; Kicker PARIS · 1300s"},
 {"id":"S2","start":91.6,"custom":true,"note":"bathhouse interior, shared tubs, laughing bathers","in":{"kind":"zoom","x":1250,"y":420}},
 {"id":"S3","start":98.9,"template":"ListShot","props":{"title":"What the bathhouse offered","items":[{"label":"Food","icon":"flame"},{"label":"Drink","icon":"drop"},{"label":"Conversation","icon":"speech"}],"cues":[99.4,100.2,101.0]},"in":{"kind":"paper","dir":"left"}},
 {"id":"S4","start":106.0,"template":"EvidenceShot","props":{"src":"img/paris-bathhouse.jpg","caption":"A bathhouse, Paris, 15th century","mark":{"rx":0.7,"ry":0.2,"rw":0.2,"rh":0.15,"at":110.8},"tag":{"text":"Documented","kind":"confirmed"}}}
]}
```
(Prop names match src/kit/templates.tsx; EvidenceShot gets `slug` automatically. If a compile fails, check docs/kit/templates.md.)
