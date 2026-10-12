## Real archival images (`kit/photo` + `tools/photo.mjs`) — free licences only
Find & fetch (director usually does this during planning; builders may too):
- `node tools/photo.mjs search "Tournai plague 1349" [--n 12]` → `.cache/photos/search.png` (numbered tiles) + list with licence/author/size.
  Unfree (NC/ND/fair-use/copyrighted) and small images are filtered out automatically. Try English, Latin or
  original-language names, artist, museum, manuscript names.
- `node tools/photo.mjs get <#> --as tournai` → `public/<slug>/img/tournai.jpg`, credit appended to `videos/<slug>/CREDITS.md`.
- `Photo {slug, src:'img/x.jpg', x,y,w,h, p, t, rot, frame:'museum'|'print'|'polaroid'|'none', tint:'paper'|'sepia'|'ink'|'none',
  pan?:{a,b,from:[fx,fy,zoom],to:[fx,fy,zoom]}, credit?, caption?, dark?}` origin = centre of the image window.
  `<Photo slug="medieval-baths" src="img/tournai.jpg" x={960} y={480} w={900} h={540} frame="museum" tint="paper" t={t}
   pan={{a:T.s, b:T.s+7, from:[0.5,0.5,1], to:[0.3,0.55,1.35]}} caption="Burial of plague victims, Tournai, 1349" credit="Pierart dou Tielt · Public domain" p={ramp(t,T.s,T.s+0.8)}/>`
- `PhotoMark {x,y,w,h (same as the Photo), rx,ry,rw,rh (0..1 region), p, color, shape:'ellipse'|'box'}` draws attention to a detail.
Rules: always show the `credit` line when the licence is CC BY/BY-SA (public domain: credit is courteous, keep it small).
Prefer sources ≥ 1600 px for anything large; small sources only in small frames. Use `tint="paper"` by default so images
sit in the Binly palette. Images are evidence moments inside the animated world — not a slideshow.
