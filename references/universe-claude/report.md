# universe-claude — machine report

Source: `وش أغلى شيء في الكون؟_1080p60.mp4` · 1920×1080 60 fps · 14:47.4 · aac 44100 Hz 2ch

## Pace (cuts)
- **176 shots**, average **5.04s**, median **3.7s** (Binly target: a visible change every 2–4 s)
- shot lengths: <1s 46 · 1–2s 20 · 2–4s 27 · 4–8s 41 · 8s+ 42
- first 60 s (the hook): 22 shots (avg 2.7s) vs whole video avg 5.04s
- longest shots: #131 @9:11.0 22.1s · #148 @11:07.7 20.2s · #154 @11:56.5 19.7s · #128 @8:45.0 17.9s · #164 @13:11.9 17.8s · #94 @5:52.0 17.7s

Cuts per minute · motion inside shots (0 = still, 5+ = lively) · brightness · loudness · words/min
```
 0m  cuts  22 ███████████           motion 13.8  lum  47  -35.3 dB  137 w
 1m  cuts  23 ████████████          motion 11.0  lum  58  -35.6 dB  118 w
 2m  cuts  11 ██████                motion 14.4  lum  40  -35.3 dB  119 w
 3m  cuts  13 ███████               motion 15.6  lum  64  -36.0 dB  127 w
 4m  cuts  14 ███████               motion 18.4  lum  53  -35.2 dB  128 w
 5m  cuts  11 ██████                motion 15.6  lum  68  -35.8 dB  118 w
 6m  cuts  14 ███████               motion 14.5  lum  52  -35.3 dB  114 w
 7m  cuts  15 ████████              motion 15.8  lum  62  -35.6 dB  121 w
 8m  cuts   5 ███                   motion  1.9  lum  44  -35.2 dB  122 w
 9m  cuts   8 ████                  motion  6.2  lum  26  -35.8 dB  120 w
10m  cuts  10 █████                 motion  9.9  lum  51  -36.5 dB  113 w
11m  cuts   8 ████                  motion 19.5  lum  44  -35.8 dB  122 w
12m  cuts   8 ████                  motion 22.1  lum  29  -35.5 dB  122 w
13m  cuts   6 ███                   motion  2.4  lum  29  -36.3 dB  116 w
14m  cuts   8 ████                  motion  9.1  lum  29  -37.9 dB  86 w
```

## Look
- average brightness 48/255 · saturation 0.68 · near-white area 1% · dark area 67%
- dominant colours (share of all pixels): #101010 37% · #101030 14% · #301010 3% · #103030 2% · #303010 2% · #503010 2% · #101050 2% · #103050 1% · #303030 1% · #301030 1% · #503030 1% · #303050 1%

## Sound
- median loudness -31.6 dB (RMS, 0.1 s windows); quiet = below -49.6 dB
- 69 quiet gaps ≥ 0.4 s (beats / breaths / dramatic pauses): 0:00.0 (0.7s) · 0:04.5 (0.4s) · 0:34.8 (0.4s) · 0:46.3 (0.4s) · 0:49.9 (0.6s) · 1:03.6 (0.5s) · 1:08.6 (0.6s) · 1:18.6 (0.4s) · 1:59.8 (0.4s) · 2:02.8 (0.4s) · 2:11.0 (0.5s) · 2:20.4 (0.4s) · 2:23.4 (0.5s) · 2:40.9 (0.4s) · 2:44.6 (0.4s) · 3:09.8 (0.5s) · 3:15.2 (0.5s) · 3:22.4 (0.5s) · 3:30.9 (0.4s) · 3:33.5 (0.4s) · 3:37.8 (0.6s) · 3:46.2 (0.7s) · 3:55.1 (0.4s) · 3:57.4 (0.4s) · 4:18.7 (0.5s) · 4:30.9 (0.6s) · 4:45.0 (0.5s) · 4:55.9 (0.4s) · 5:22.2 (0.5s) · 5:35.4 (0.5s) …
- speech: 1783 words → 121 words/min

## Files
- `overview/min-NN.jpg` — a frame every 3 s, one sheet per minute
- `shots/shots-NN.jpg` — the middle frame of every shot, numbered like shots.json
- `shots.json` — every shot: s/e/dur, cut strength, motion, lum, sat, white/dark share, average colour
- `audio.json` — loudness every 0.1 s + quiet gaps
- `timing/` — transcript (after transcribe)
- `STUDY.md` — the director's analysis (what to copy, what to avoid)
