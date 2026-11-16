# REPORT — «أغلى غلطة في التاريخ» (ar-costly-mistakes) · Arabic video #1 (AZTIKA)

## Files
- **Long video:** `videos/ar-costly-mistakes/output/ar-costly-mistakes.mp4` — 13:13 (13:08 + 5 s silent hold on like/subscribe), 2560×1440 60 fps
- **Hook Short:** `videos/ar-costly-mistakes/output/ar-costly-mistakes-short-1.mp4` — 0:00–0:38 of the hook + 3.5 s freeze, 1080×1920 60 fps.
  Title «أغلى غلطة في التاريخ / سعرها أصغر رقم!». Publish it AFTER the long video and link it in YouTube Studio ("Related video").
- **YouTube pack:** `videos/ar-costly-mistakes/youtube/` — description.md (Arabic, 12 clickable chapters), captions.srt (exact script wording; first cue and 8 doubled numbers corrected by hand).

## What it is
One question («أغلى غلطة؟») → a game staircase that grows → 10 mini-stories (Mariner 1 · Howells · the pizza · Citibank ·
the fake interview · Netflix · Google · Chernobyl · Suez) → the twist: the smallest number (4 مليون £) takes the summit →
the thesis «الفاتورة دايم توصل متأخرة» → like/subscribe. Motif: the BILL; 8 signature moments; 193 shots (avg 4.1 s);
night look like the reference; 43 Flow objects + 5 painted plates; 6 new shared pieces.

## QA (final file, measured)
- YouTube master: **11/11 spec checks pass** · H.264 High · BT.709 · CFR 60 · faststart · 21.7 Mb/s · AAC 48 kHz stereo.
- Loudness **−14.0 LUFS, true peak −1.4 dBTP** (target −14 / −1). Voice in sync (offset 0 ms, correlation 0.997).
- No black frames · no static holds ≥ 4 s · no near-empty frames · motion inside the reference's range on all 5 measures
  (cuts 1.4/min · sweeps 3/min · still 51.6 % · flow 0.14 · sudden starts 1.5/min).
- Render gate: GO (layout, numbers as spoken, names, sync 12/12, sound density, phone text). All 264 QA tiles reviewed.

## 🔊 AUDIO SUMMARY (plain words)
- **Balance:** your voice always leads. The effects together add only 6 LU to the loudness — they decorate, they never compete.
- **Levels:** 36 of 41 sound types sit on your approved level (within ~1 dB) — pops, whooshes, booms, stamps, coins, dings,
  impacts, explosions. **On a phone no effect comes closer than 10 dB to your voice** (words win everywhere).
- **4 types sit ~2.5 dB softer than target on purpose** (riser, rise, powerup, sparkle): raising them breaks the phone rule
  (the riser is exactly at the 10 dB phone limit). "page" reads loud only because its 5 cues sit inside a busy burst.
- **Density:** 32 effects/min overall (your pick ≈ 26–28, cap 34) · hook 36/min (energetic opening) · **no silent gaps**.
- **What the viewer feels:** lively and clear like the reference — a sound on every reveal, count and stamp; the big moments
  (785 مليون, 6.3 مليار, the twist) hit harder; near-silence before the twist; silence after «سلام».
- **Verdict: ✅ GOOD — ready to upload.** Nothing needed.

## Sound check before rendering — expert verdict (for your decision)
This video's sound was mixed and measured **locally, audio only, before the render**. The final cloud QA gave **exactly
the same numbers** (every sound type to the decimal). It found and fixed the quiet effects before the render instead of
after. **My verdict: make it permanent** (a render-gate step + the Sound Report) — it is reliable, catches problems early,
saves cloud renders and usage. **Your call.** (To-do with the plan: STATUS.md.)

## Changes made on the way (honest)
- The pizza part was missing from the 10 VO parts — you recorded it; inserted as part 4, voice gate passed again.
- Fixes found by review/gate: unspoken years removed (2008, 1876), the first court ruling showed the wrong year (removed),
  ranges written «بين 590 و630» (RTL had flipped them), English inside 4 images (replaced), AZTIKA covering elements (moved).
- Sound: builders had turned story sounds down (effects 2–4 dB quiet) → raised; per-type calibration for 10 quiet types; the
  one slam → stamp (phone rule). Tools fixed: cue.mjs (Arabic letters were dropped), sound-density cap, plan-check.
- Usage: all builders ran Opus → 3 usage-limit pauses; model test set for Arabic video #2 (docs/MODEL-TEST.md).

## Limitations
- I can't listen; sound judged by measurement (the same ruler that measured the reference).
- A few scene starts show AZTIKA alone for < 1 s before the elements pop in (within the standard; QA found no empty frames).
- The Short's first words and the captions' first cue were corrected by hand (speech timing garbled the first 0.8 s).
