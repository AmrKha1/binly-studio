## Silhouettes (`kit/silhouette` + `tools/silhouette.mjs`) — shared library of free organism shapes
Animals, dinosaurs, humans, plants, microbes as clean single-colour vector shapes (PhyloPic, free licences only, credits
automatic). The library in `src/assets/silhouettes/` is SHARED by all videos — check it first, add to it when needed.
- `node tools/silhouette.mjs list` (what exists) · `search "canis lupus"` (→ `.cache/silhouettes/search.png`) · `get <#> --as wolf`
  Search works best with scientific names; check the result's title — PhyloPic may return a close relative.
- `Silhouette {name, x, y, h, color=ink, fill=true, outline:'none'|'solid'|'dashed', outlineColor, strokeWidth=4, p, reveal:'fade'|'wipe'|'rise'|'pop', flip, rot, o, anchor:'bottom'|'center'}`
  origin = bottom-centre (default). `outline="dashed" fill={false}` = Binly grammar for inferred / reconstructed / absent.
  `<Silhouette name="trex" x={1200} y={900} h={420} color={C.oxblood} reveal="wipe" p={ramp(t, T.rex, T.rex + 1)} />`
- `SILHOUETTE_NAMES` — names in the library. Unknown name → visible dashed "missing silhouette" box (fetch it).
Combine with kit parts: walk a silhouette across a Landscape (move x over time), scale comparisons with a Person,
dashed flesh over a skeleton, a Crowd of the same animal (several Silhouettes with seeded offsets).
