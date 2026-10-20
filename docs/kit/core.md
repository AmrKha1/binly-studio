## Core — stage, camera, time, shots (`kit/stage`, `kit/anim`, `kit/shots`, `kit/theme`)

**theme** — `C` palette (paper, paperLight/Shade/Deep/Dark, ink, inkSoft/Lift/Mute/Faint, oxblood, oxLight/oxTint/oxDeep,
evidence(+Light/Tint), theory(+Light/Tint), caution(+Light/Tint), bone, wood/woodDark/woodLight, stone/stoneShade/stoneDark,
metal, lamp, fire, water/waterDeep, slate, sky, dusk, night, skin[0..4], skinShade[0..4], hair[0..4], strata[0..6]),
`SEM` (confirmed|evidence|theory|speculation|caution|debated|signal|ink → colour), `FONT_SERIF`, `FONT_SANS`, `W`=1920, `H`=1080, `SAFE`=96,
`lang` (kit/lang): `isAr()`, `lang()`, `word('vs'|'VS'|'but')` (kit-written words), `FONT_AR`. Set per render from
video.json → Stage applies Arabic fonts + RTL mirroring; `className="k-nomirror"` keeps a group's real geometry.
`GLOW` = {soft, gold, lavender, green, oxblood, white} filter urls (defined in every Stage) + `glowFor(color)` — elegant
soft halos: `<g filter={GLOW.gold}>`. `C.gold` (key accent) · `C.goldLight` · `C.goldTint` · `C.lavender`. Paper = clean white.
`TYPE` = {key 72 · read 48 · label 40 (all-caps sans) · small 36 · credit 26} — phone-readable text sizes (never go below them;
kit Kicker/Tag/LabelPlate/chart labels enforce the floor). Keep important text above y = 970 (YouTube player controls).

**anim** (pure functions of t):
- `ramp(t,a,b,fn=ease.inOut)` 0→1 · `unramp` 1→0 · `keys(t,[[t,v],…],fn)` · `win(t,a,b,fi=.4,fo=.4)` fade window
- `stagger(t,start,i,gap,dur,fn)` · `drift(t,period,amp,phase)` · `noise1(x,seed)` ∈[-1,1] · `rand(seed)` ∈[0,1) · `randRange(seed,lo,hi)`
- `ease.{linear,inOut,out,in,outQuint,inOutQuint,inOutSine,outSine,outBack,outElastic}` · `lerp` · `clamp01` · `mixHex(a,b,k)`
- `camAt(t, [[time,cx,cy,zoom,rotDeg?],…])` → CamState (log-space zoom) · `typeOn(t,a,text,cps)` · `countUp(value,p)` (exact landing)

**stage**
- `<Stage bg={C.paper}>…svg children…</Stage>` full 1920×1080 frame (every shot/chapter renders one).
- **Steady text (rule):** Chrome snaps axis-aligned glyphs to whole pixels vertically, so under slow camera drifts text
  lags then jumps ~1 px against shapes. Stage fixes it globally with a constant, invisible 0.1° tilt on every `<text>`
  (without its own `transform` attribute) and every `<foreignObject className={TEXT_FO}>` (export of kit/stage; RichText,
  Para, Bubble use it) → glyphs land sub-pixel in both axes. Your own HTML text in a foreignObject: add
  `className={TEXT_FO}`. Never animate text with noise/wobble. Check: `node tools/jitter-test.mjs --kit`, or a real shot
  `--at <sec> --text x0,y0,x1,y1 --ref x0,y0,x1,y1` (ref = a solid shape on the same layer), or a cloud render `--mp4 file --at <sec>`.
- `<Cam cam={state} depth={1}>` camera group (depth<1 far/slow, >1 foreground). `<CamKeys t keys={[...]} depth>` shorthand.
- `<World cam={cam} layers={[{depth:0.3, el:<Far/>},{depth:1, el:<Main/>},{depth:1.4, el:<Front/>}]}/>` parallax.
- `breathe(cam,t,amount=1)` subtle handheld life for holds (translation only — never add micro rotation/zoom noise on text: it shimmers) · `shake(cam,t,t0,strength=14,decay=5)` impacts.
- `<At x y s sx sy r o>` transform wrapper · `uid(...parts)` stable ids for clip paths.

**shots**
- `<Shots t shots={[{start, render:(t)=>el, in?:{kind,dur?,x?,y?,dir?,color?}}]}/>` sequence with transitions.
  kinds: `cut fade dip ink iris irisOut push paper zoom wipe` (x,y = focus point; dir = left|right|up|down).
- `<TransitionView tr p a b/>` low-level blend of two elements.

**video** — `ChapterDef {id,start,end,C,in?}` · `<Chapters t chapters/>` (generated `index.tsx` uses it).
