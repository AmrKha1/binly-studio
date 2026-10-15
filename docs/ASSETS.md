# Asset catalog — reusable pieces built inside past videos (not yet in src/kit)
Check this AND docs/KIT.md before planning new shared assets. Reuse by importing from the path below (or copy into
`src/videos/<slug>/shared/` if you need to change it). `/improve-studio` promotes the best ones into `src/kit/`.
Format: `name` — what it is · props/dials · path · (video it came from)

- `TRex` (local, not exported yet) — procedural flat T. rex: bones / flesh / stripes / colour / stride / head turn dials, both feet planted mode · `src/videos/test-dinos/chapters/C01.tsx` · (test-dinos)
- `Iguanodon` (local) — 19th-c. "best guess" Iguanodon with nose horn, dashed/solid variants · `src/videos/test-dinos/chapters/C02.tsx` · (test-dinos)
- Polaroid "closing around the scene" wrapper (local) — the frame shrinks around a live scene to become a photo · `src/videos/test-dinos/chapters/C01.tsx` · (test-dinos)
- `PoreSkin` — skin cross-section with pores (signature "heat opens the body") · x,y,s,w,pores,open,heat,flowOut,flowIn,sealed,tone paper|ink,split,p,t,seed (origin = top-surface centre) · `src/videos/medieval-bathing/shared/PoreSkin.tsx` · (medieval-bathing)
- `HumorWheel` — four humors on HOT/COLD × WET/DRY axes, centre balance · x,y,s,reveal[4],axesP,highlight,balance,tilt,heatArrow,dark,p,t (R=330) · `src/videos/medieval-bathing/shared/HumorWheel.tsx` · (medieval-bathing)
- `Miasma` — flat plum corrupted-air tendrils · x,y,w,h,density,p,from,vx,toward{x,y,k},color,dark,opacity,t,seed · `src/videos/medieval-bathing/shared/Miasma.tsx` · (medieval-bathing)
- `HeroTub` — hero wooden bathtub close-up, split warm/ink world, clothed bather, herbs · x,y,s,split,splitX,steam,light,herbs,bather,backdrop,t,seed (origin bottom centre, ≈1120 w) · `src/videos/medieval-bathing/shared/HeroTub.tsx` · (medieval-bathing)
- `BathSign` (local, copied in several chapters) — hanging bathhouse sign with bath emblem + swinging lantern (lit/dim) · `src/videos/medieval-bathing/chapters/C06.custom.tsx` · (medieval-bathing)
- `WaxSeal` (local) — oxblood wax seal stamp with pulse · `src/videos/medieval-bathing/chapters/C01.custom.tsx` · (medieval-bathing)
- `TownPlan` / `TownBG` / `House` (local) — flat medieval town plan + street backdrop pieces · `src/videos/medieval-bathing/chapters/C06.custom.tsx` · (medieval-bathing)
