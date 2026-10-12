"""
Binly timing analysis (runs in the cloud: .github/workflows/analyze.yml).

Word-level timestamps for the voiceover with faster-whisper, snapped to real pauses measured
from the waveform, then aligned to the ORIGINAL SCRIPT so every word/number is spelled exactly
as written. Outputs (in <out>):
  words.json       [{"w": "Medieval", "s": 12.34, "e": 12.71, "p": 3}]   (p = paragraph index)
  paragraphs.json  [{"i": 3, "s": 12.3, "e": 19.8, "text": "..."}]
  transcript.md    compact timed transcript for planning (one line per paragraph)
  info.json        duration, match ratio, model, long pauses

usage: python transcribe.py <voiceover> <script.txt|-> <outdir> [model]
"""
import json, re, sys, difflib, os
import numpy as np
from faster_whisper import WhisperModel, decode_audio

vo, script_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
model_name = sys.argv[4] if len(sys.argv) > 4 else "small.en"
os.makedirs(out, exist_ok=True)

SR = 16000
audio = decode_audio(vo, sampling_rate=SR)
duration = len(audio) / SR

# ---------------------------------------------------------------- pauses from the waveform
hop = int(SR * 0.01)
frames = len(audio) // hop
rms = np.sqrt(np.mean(audio[: frames * hop].reshape(frames, hop) ** 2, axis=1) + 1e-12)
db = 20 * np.log10(rms + 1e-9)
speech_db = np.percentile(db, 70)
thr = max(speech_db - 30, -55)
silent = db < thr
pauses = []  # (start, end) seconds, >= 150 ms
i = 0
while i < frames:
    if silent[i]:
        j = i
        while j < frames and silent[j]:
            j += 1
        if (j - i) >= 15:
            pauses.append((i / 100.0, j / 100.0))
        i = j
    else:
        i += 1

# ---------------------------------------------------------------- script
script_text = ""
if script_path != "-" and os.path.exists(script_path):
    with open(script_path, encoding="utf-8-sig") as f:
        script_text = f.read()
script_text = "\n".join(l for l in script_text.splitlines() if not re.fullmatch(r"\s*(-{3,}|\d+\s*-\s*)\s*", l))
paras_src = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", script_text) if p.strip()]

# ---------------------------------------------------------------- transcription
model = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4)
prompt = paras_src[0][:220] if paras_src else None
segments, _ = model.transcribe(vo, language="en", word_timestamps=True, beam_size=5, condition_on_previous_text=False, initial_prompt=prompt, vad_filter=False)
hyp = []
for seg in segments:
    for w in seg.words or []:
        hyp.append({"w": w.word.strip(), "s": float(w.start), "e": float(w.end)})
print(f"whisper: {len(hyp)} words, {duration:.2f} s audio", flush=True)

# snap starts/ends to measured pause edges (whisper word times drift ~0.1-0.3 s)
pause_ends = np.array([p[1] for p in pauses]) if pauses else np.array([])
pause_starts = np.array([p[0] for p in pauses]) if pauses else np.array([])
for w in hyp:
    if len(pause_ends):
        k = np.argmin(np.abs(pause_ends - w["s"]))
        if -0.30 <= pause_ends[k] - w["s"] <= 0.20:
            w["s"] = float(pause_ends[k])
        k = np.argmin(np.abs(pause_starts - w["e"]))
        if -0.20 <= pause_starts[k] - w["e"] <= 0.35:
            w["e"] = float(pause_starts[k])
    if w["e"] < w["s"]:
        w["e"] = w["s"] + 0.05

# ---------------------------------------------------------------- align to script
NUMW = {"zero":"0","one":"1","two":"2","three":"3","four":"4","five":"5","six":"6","seven":"7","eight":"8","nine":"9","ten":"10"}
def norm(t):
    t = t.lower().replace("%", " percent").replace("’", "'")
    t = re.sub(r"(?<=\d),(?=\d{3})", "", t)
    t = re.sub(r"[^\w\s'.]", " ", t)
    t = re.sub(r"(?<!\d)\.|\.(?!\d)", " ", t)
    toks = [NUMW.get(x, x) for x in t.split()]
    return toks

words_out = []
if paras_src:
    src = []  # (original token, normalized key, paragraph index)
    for pi, p in enumerate(paras_src):
        for tok in p.split(" "):
            keys = norm(tok) or [""]
            src.append((tok, keys[0], pi))
    hyp_keys = []
    hyp_idx = []
    for hi, w in enumerate(hyp):
        for k in norm(w["w"]) or [""]:
            hyp_keys.append(k)
            hyp_idx.append(hi)
    sm = difflib.SequenceMatcher(a=[s[1] for s in src], b=hyp_keys, autojunk=False)
    times = [None] * len(src)
    matched = 0
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            h = hyp[hyp_idx[b + k]]
            times[a + k] = (h["s"], h["e"])
            matched += 1
    # interpolate unmatched source words between anchors
    known = [i for i, x in enumerate(times) if x is not None]
    for i in range(len(src)):
        if times[i] is not None:
            continue
        prev = max([k for k in known if k < i], default=None)
        nxt = min([k for k in known if k > i], default=None)
        t0 = times[prev][1] if prev is not None else 0.0
        t1 = times[nxt][0] if nxt is not None else duration
        span = (nxt if nxt is not None else len(src)) - (prev if prev is not None else -1)
        pos = i - (prev if prev is not None else -1)
        s = t0 + (t1 - t0) * (pos - 0.5) / span
        times[i] = (s, min(t1, s + max(0.08, (t1 - t0) / span * 0.8)))
    for (tok, _, pi), (s, e) in zip(src, times):
        words_out.append({"w": tok, "s": round(s, 3), "e": round(e, 3), "p": pi})
    ratio = matched / max(1, len(src))
else:
    # no script: paragraphs = runs separated by pauses >= 0.7 s
    pi = 0
    for k, w in enumerate(hyp):
        if k and w["s"] - hyp[k - 1]["e"] >= 0.7:
            pi += 1
        words_out.append({"w": w["w"], "s": round(w["s"], 3), "e": round(w["e"], 3), "p": pi})
    ratio = 1.0
    paras_src = []
    for i in range(pi + 1):
        paras_src.append(" ".join(w["w"] for w in words_out if w["p"] == i))

paragraphs = []
for i, text in enumerate(paras_src):
    ws = [w for w in words_out if w["p"] == i]
    if not ws:
        continue
    paragraphs.append({"i": i, "s": ws[0]["s"], "e": ws[-1]["e"], "text": text})

def mmss(x):
    return f"{int(x // 60):02d}:{x % 60:04.1f}"

long_pauses = [(round(a, 2), round(b - a, 2)) for a, b in pauses if b - a >= 0.9 and a > 0.5 and b < duration - 0.5]
with open(os.path.join(out, "words.json"), "w", encoding="utf-8") as f:
    json.dump(words_out, f, ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(out, "paragraphs.json"), "w", encoding="utf-8") as f:
    json.dump(paragraphs, f, ensure_ascii=False, indent=0)
with open(os.path.join(out, "transcript.md"), "w", encoding="utf-8") as f:
    f.write(f"# Timed transcript · {mmss(duration)} ({duration:.2f} s) · {len(words_out)} words · {len(paragraphs)} paragraphs\n")
    f.write("Format: [start–end] P<index>  text   (exact word times: node tools/cue.mjs \"phrase\")\n\n")
    for p in paragraphs:
        f.write(f"[{mmss(p['s'])}–{mmss(p['e'])}] P{p['i']}  {p['text']}\n")
    if long_pauses:
        f.write("\nLong pauses (start s, length s): " + ", ".join(f"{a}+{b}" for a, b in long_pauses) + "\n")
with open(os.path.join(out, "info.json"), "w") as f:
    json.dump({"duration": round(duration, 4), "words": len(words_out), "paragraphs": len(paragraphs), "script_match_ratio": round(ratio, 4), "model": model_name, "long_pauses": long_pauses}, f, indent=1)
print(f"aligned: {len(words_out)} words, {len(paragraphs)} paragraphs, script match {ratio:.1%}")
