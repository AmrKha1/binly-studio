# empires-flow — machine report

Source: `كيف سقطت أقوى 6 إمبراطوريات بالتاريخ؟ 👑_1080p.mp4` · 1920×1080 30 fps · 15:34.9 · aac 44100 Hz 2ch

## Pace (cuts)
- **170 shots**, average **5.5s**, median **5.3s** (Binly target: a visible change every 2–4 s)
- shot lengths: <1s 14 · 1–2s 10 · 2–4s 32 · 4–8s 75 · 8s+ 39
- first 60 s (the hook): 12 shots (avg 5.0s) vs whole video avg 5.5s
- longest shots: #25 @2:03.8 15.7s · #35 @3:25.5 13.9s · #28 @2:34.6 13.2s · #71 @7:14.1 12.9s · #66 @6:41.5 12.4s · #113 @10:58.6 11.9s

Cuts per minute · motion inside shots (0 = still, 5+ = lively) · brightness · loudness
```
 0m  cuts  12 ██████                motion  1.0  lum 193  -27.2 dB
 1m  cuts  12 ██████                motion  1.4  lum 210  -27.9 dB
 2m  cuts   6 ███                   motion  0.7  lum 134  -27.5 dB
 3m  cuts   8 ████                  motion  1.1  lum 198  -27.4 dB
 4m  cuts   9 █████                 motion  0.8  lum 176  -27.9 dB
 5m  cuts   9 █████                 motion  1.0  lum 147  -27.6 dB
 6m  cuts  11 ██████                motion  1.2  lum 177  -27.7 dB
 7m  cuts   9 █████                 motion  1.3  lum 175  -28.4 dB
 8m  cuts  11 ██████                motion  1.1  lum 164  -28.8 dB
 9m  cuts  13 ███████               motion  1.0  lum 190  -28.7 dB
10m  cuts  13 ███████               motion  3.1  lum 172  -28.7 dB
11m  cuts   8 ████                  motion  0.8  lum 185  -29.6 dB
12m  cuts  11 ██████                motion  1.1  lum 178  -28.2 dB
13m  cuts  16 ████████              motion  1.5  lum 174  -28.6 dB
14m  cuts  14 ███████               motion  1.1  lum 169  -28.2 dB
15m  cuts   8 ████                  motion  1.1  lum 190  -28.9 dB
```

## Look
- average brightness 169/255 · saturation 0.28 · near-white area 35% · dark area 4%
- dominant colours (share of all pixels): #f0f0f0 30% · #707050 3% · #909070 3% · #b0b090 3% · #505030 2% · #907050 2% · #d0d0d0 2% · #909050 2% · #d0b070 2% · #b09070 2% · #b09050 2% · #b0b0b0 2%

## Sound
- median loudness -25.4 dB (RMS, 0.1 s windows); quiet = below -43.4 dB
- 10 quiet gaps ≥ 0.4 s (beats / breaths / dramatic pauses): 2:03.0 (0.5s) · 2:34.1 (0.4s) · 3:04.0 (0.6s) · 3:47.0 (0.4s) · 6:29.9 (0.4s) · 7:28.7 (0.4s) · 9:09.8 (0.4s) · 10:16.3 (0.5s) · 12:22.2 (0.5s) · 14:38.1 (0.8s)
- no transcript yet → node tools/watch.mjs transcribe empires-flow

## Files
- `overview/min-NN.jpg` — a frame every 3 s, one sheet per minute
- `shots/shots-NN.jpg` — the middle frame of every shot, numbered like shots.json
- `shots.json` — every shot: s/e/dur, cut strength, motion, lum, sat, white/dark share, average colour
- `audio.json` — loudness every 0.1 s + quiet gaps
- `timing/` — transcript (after transcribe)
- `STUDY.md` — the director's analysis (what to copy, what to avoid)
