# Craft notes — how to direct a Binly story that nobody wants to leave
Practical technique from the best YouTube storytellers and animation channels, serving the Binly mindset
(docs/RETENTION.md): gripping storytelling, balanced-to-brisk rhythm, never a slow documentary. Apply with judgement.

## Structure & retention
- **First 15–30 s decide everything.** Open on the most striking image the hook allows, moving within the
  first second. Show the paradox/question visually before it is fully explained. No logo, no slow fade-in.
- **Open loops:** when the narration poses a question, make it visual (a "?" object, a dashed silhouette,
  a locked door, an empty frame) and pay it off visually when answered — callbacks feel rewarding.
- **Pivots = scene turns.** At each rhetorical question or "but…", change something big: camera direction,
  scale (zoom into a detail / pull out to context), light (paper → ink panel), or world.
- **Rhythm:** brisk by default. Tension = shorter shots; a payoff gets a short breath (≈2–3 s, still moving) to
  land, then the story moves on. Avoid more than ~10–12 s of the same composition or the same kind of visual.
- **Visual change cadence:** a new piece of visual information every ~2–4 s; a new composition every
  ~6–10 s; a new "world"/setting at chapter changes. Small life between (parallax drift, particles, blink).
- **Ending:** return to the opening image/motif transformed by what we learned (bookend). Let the final
  line land on a strong, simple frame; music resolves; a short beat after the last line — then end, no lingering.

## Camera (the main storytelling tool)
- Build each chapter as ONE continuous world when possible and move the camera through it (pan to the
  next idea, push in to a detail, pull out to reveal context) instead of cutting between slides.
- Use `World` layers (depth 0.2–0.5 far, 1 main, 1.2–1.6 foreground) for parallax; even a 40 px pan with
  parallax feels expensive. Zoom in log space (`camAt`). Ease in-out; camera moves of 1.5–4 s.
- Reveal by camera: start tight on a detail, pull back to show what it belongs to ("…and that was just
  one of 200 bathhouses in Paris").
- Scale shifts (body → cell → molecule; city → room → hand) are the signature move for science stories.
- During holds, `breathe(cam, t)` keeps the frame alive without drawing attention.

## Composition
- One focal point per frame; supporting elements smaller/lower contrast. Rule of thirds for characters
  with look-room; centred for symbolic/iconic moments.
- Big shapes first: a strong silhouette readable as a thumbnail. Detail only where the eye goes.
- Foreground framing elements (window frame, leaves, arch, desk edge) add depth cheaply.
- Text: one idea, few words, big, placed where it doesn't fight the image; animate in on the spoken word.

## Visual metaphor toolbox (match the idea, don't decorate)
- Absence / unknown → dashed outline, empty frame, "?" | Evidence → solid shapes, green tags, documents,
  stamps | Theory → plum, dashed, thought bubbles | Debate → two figures/cards facing, balance scale |
  Time → timeline, clock, seasons, ageing paper | Scale → zoom, size comparison | Cause→effect →
  flow chain, dominoes, arrows | Spread → map routes, ripples, crowds | Inner life → ink/plum mind-space,
  inner-speech bubbles (dashed) | Danger/caution → mustard, flicker, low drones | Revelation → oxblood
  accent, camera push, music swell, a single SFX.
- Keep a **video-level motif** (e.g. "heat opens the body" = pores opening/closing icon) and reuse it
  at each mention so the viewer learns the visual language.

## Characters
- Expressive through pose + head tilt + brows more than faces. Small idle life (breathe, blink, glance).
- Stage figures in profile/3-quarter with clear silhouettes; give them something to do (point, write,
  hold an object) synchronised to the narration.
- Groups: `Crowd` for scale; distant figures as `silhouette`.

## Transitions (kit `shots.tsx`)
- fade (gentle continuity) · iris (enter a detail/idea at a point) · irisOut (step back) · ink (big topic
  turn, dark mood) · push (moving along a line of thought/time) · paper (next document/case) · zoom
  (zoom-through into the next world) · wipe (comparisons, before/after) · dip (time jump) · cut (punchline
  or shock, on a hard consonant/beat). Best of all: an in-world camera move or a match cut on a shape.

## Sound design rhythm
- Music recedes under dense facts, rises in pauses and at reveals; a "drop" (near silence) right before a
  big reveal makes it land; "resolve" at the end of an argument.
- SFX only for events the viewer sees and that matter: ~1 every 10–20 s on average, clustered at key
  moments, silent stretches are fine.

## Quality traps to avoid
Generic fade-ups on everything · constant wobble · elements popping on/off without easing · text
colliding with objects · tiny unreadable labels · frames with nothing alive for >4 s · every scene
centred · too many accent colours in one frame · the same layout repeated · decoration without meaning.
