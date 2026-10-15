## Core — stage, camera, time, shots (`kit/stage`, `kit/anim`, `kit/shots`, `kit/theme`)

**theme** — `C` palette (paper, paperLight/Shade/Deep/Dark, ink, inkSoft/Lift/Mute/Faint, oxblood, oxLight/oxTint/oxDeep,
evidence(+Light/Tint), theory(+Light/Tint), caution(+Light/Tint), bone, wood/woodDark/woodLight, stone/stoneShade/stoneDark,
metal, lamp, fire, water/waterDeep, slate, sky, dusk, night, skin[0..4], skinShade[0..4], hair[0..4], strata[0..6]),
`SEM` (confirmed|evidence|theory|speculation|caution|debated|signal|ink → colour), `FONT_SERIF`, `FONT_SANS`, `W`=1920, `H`=1080, `SAFE`=96.

**anim** (pure functions of t):
- `ramp(t,a,b,fn=ease.inOut)` 0→1 · `unramp` 1→0 · `keys(t,[[t,v],…],fn)` · `win(t,a,b,fi=.4,fo=.4)` fade window
- `stagger(t,start,i,gap,dur,fn)` · `drift(t,period,amp,phase)` · `noise1(x,seed)` ∈[-1,1] · `rand(seed)` ∈[0,1) · `randRange(seed,lo,hi)`
- `ease.{linear,inOut,out,in,outQuint,inOutQuint,inOutSine,outSine,outBack,outElastic}` · `lerp` · `clamp01` · `mixHex(a,b,k)`
- `camAt(t, [[time,cx,cy,zoom,rotDeg?],…])` → CamState (log-space zoom) · `typeOn(t,a,text,cps)` · `countUp(value,p)` (exact landing)

**stage**
- `<Stage bg={C.paper}>…svg children…</Stage>` full 1920×1080 frame (every shot/chapter renders one).
- `<Cam cam={state} depth={1}>` camera group (depth<1 far/slow, >1 foreground). `<CamKeys t keys={[...]} depth>` shorthand.
- `<World cam={cam} layers={[{depth:0.3, el:<Far/>},{depth:1, el:<Main/>},{depth:1.4, el:<Front/>}]}/>` parallax.
- `breathe(cam,t,amount=1)` subtle handheld life for holds (translation only — never add micro rotation/zoom noise on text: it shimmers) · `shake(cam,t,t0,strength=14,decay=5)` impacts.
- `<At x y s sx sy r o>` transform wrapper · `uid(...parts)` stable ids for clip paths.

**shots**
- `<Shots t shots={[{start, render:(t)=>el, in?:{kind,dur?,x?,y?,dir?,color?}}]}/>` sequence with transitions.
  kinds: `cut fade dip ink iris irisOut push paper zoom wipe` (x,y = focus point; dir = left|right|up|down).
- `<TransitionView tr p a b/>` low-level blend of two elements.

**video** — `ChapterDef {id,start,end,C,in?}` · `<Chapters t chapters/>` (generated `index.tsx` uses it).
