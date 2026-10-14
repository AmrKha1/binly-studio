# kit/transport — vehicles

`import {Ship, Cart, Train, Car, Horse} from '../kit/transport'`. Flat, upper-left light, palette only.
All vehicles face **right** (`flip` for left); origin = **ground / waterline under the body centre**.
Shared props: `{x, y, s?, flip?, t?, tone?: Tone, color?, moving?: bool}` — `moving` + `t` turn on motion
(wheels turn, horse walks, sails billow, smoke puffs, boats bob + wake); `tone` re-tints like env props.
Sizes at s=1 are big (≈300–600 wide): use s 0.4–0.8 in scenes. Pair with `Weather` (kit/fx) and env backgrounds.

- **Ship** — `{kind?: 'rowboat'|'sailing'|'steam'='sailing'}` · rowboat ~260 wide (oar rows) · sailing ~520, 2 masts, ~440 tall · steam ~580, funnel smoke. Put on `Water` with y = water top + ~15.
  `<Ship kind="sailing" x={900} y={800} s={0.6} t={t} moving/>`
- **Cart** — horse-drawn `{kind?: 'cart'|'wagon'|'carriage'='cart'; horse?=true}` · cart = 2-wheel open · wagon = covered 4-wheel · carriage = closed coach. Horse walks in front (+x ≈ 250 → total ≈ 520–620 wide).
  `<Cart kind="wagon" x={600} y={ENV_FLOOR} s={0.7} t={t} moving/>`
- **Train** — `{kind?: 'steam'|'modern'='steam'; cars?=2}` · loco ~400 wide, each coach +330 trailing behind (−x). steam: boiler, cab, drive rod, smoke; modern: streamlined nose, window band, red stripe.
  `<Train kind="steam" cars={3} x={1500} y={860} s={0.5} t={t} moving/>`
- **Car** — `{kind?: 'vintage'|'modern'='modern'}` · ~300 long · vintage (1910s–30s, spoked wheels, bounce, default green) · modern sedan (default slate).
- **Horse** — the cart horse alone, side view, ~260 long × 230 tall, walk cycle when `moving`. `{color?}`

Motion across the frame is the builder's job: animate `x` (e.g. `x={lerp(-300, 2200, ramp(t, 0, 8, ease.linear))}`) and pass `moving`.
