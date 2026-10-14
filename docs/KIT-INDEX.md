# Kit index — read this first, then open ONLY the sections you need

## What you can show (menu — combine freely; everything below is ready-made)
- **Worlds you can fly through:** layered 2.5D parallax scenes (sky, landscapes, medieval/modern cities & streets, rooms, bathhouse, lab, museum, study, bedroom, mind space) with camera pans, push-ins, pull-outs and scale dives.
- **Looks-3D (drawn flat, fast):** a spinning globe with countries/pins/routes/night side, isometric buildings, rooms, towns, stairs, cylinders, shaded spheres (planets, moons, cells, eyeballs), dolly through depth layers.
- **People & life:** parametric characters (eras, outfits, poses, expressions, walking, talking, sitting), crowds; animal/dinosaur/microbe silhouettes (shared library, recolourable, dashed = inferred).
- **Real evidence:** archival images edited like a storyteller — Ken Burns, detail hunt with labels, montage on the beat, collage board, compare/wipe, document scan + translation, animation drawn over reality, image inside an animated scene, parallax cut-out.
- **Ideas made visible:** flows, cycles, Venn, comparisons, timelines, maps, exact-number stats with dot grids/bars/rings, claims stamped with certainty colours, open questions, quotes and documents, study cards, screens, speech/thought/inner-voice bubbles.
- **Science:** brain regions, heads with EEG/implants, body & organs, eye cross-section, neurons/synapses, cells, immune cells, germs/viruses, DNA, molecules, waveforms.
- **Life & atmosphere:** steam, flames, particles (dust/spores/embers), light shafts and pools, ripples, camera breathe/shake; transitions: fade, dip, ink, iris in/out, push, paper, zoom-through, wipe, cut.
- **Shot templates:** 21 ready full shots (12 info beats + 9 real-image treatments) — see docs/catalog/templates.png.
Missing something? Build it once, flexibly (props for era/colour/pose), and register it in docs/ASSETS.md.

Import from `../../../kit/<module>` (chapters) · visual catalogs: `docs/catalog/templates.png`, `docs/catalog/kit.png` · full reference: `docs/KIT.md` (rarely needed).

## docs/kit/core.md — Stage, camera (Cam/World/breathe/shake), time maths (ramp/keys/win/camAt/rand/noise1/countUp), Shots + transitions, palette C/SEM
modules: kit/stage, kit/anim, kit/shots, kit/theme, kit/video
Stage, Cam, CamKeys, World, breathe, shake, At, uid, EaseFn, clamp, clamp01, lerp, ease, ramp, unramp, keys, win, drift, stagger, rand, randRange, noise1, CamKey, CamState, camAt, mixHex, typeOn, countUp, sec, TransitionKind, Transition, Shot, TransitionView, Shots, C, SEM, Sem, FONT_SERIF, FONT_SANS, W, H, FPS, SAFE, VideoModule, ChapterDef, Chapters

## docs/kit/text-cards-diagrams.md — Typography, paper objects & screens & bubbles, diagrams/arrows/flows, light & motion fx, characters (Person/Crowd)
modules: kit/text, kit/cards, kit/diagrams, kit/fx, kit/people
textW, Headline, Kicker, Para, Tag, Stamp, Stat, Underline, Highlight, Circled, NameTag, TitleCard, Card, DocumentPage, Polaroid, StudyCard, Note, OpenBook, Screen, ScreenText, Bubble, Arrow, Node, FlowChain, Cycle, Venn, Bracket, Callout, DashedOutline, CrossOut, CheckMark, QuestionMark, LightPool, LightShaft, GroundShadow, Vignette, Pulse, Beacon, DrawPath, Pop, SlideIn, WipeReveal, Particles, Steam, Flame, Ripples, Expression, Outfit, Hat, Hair, PosePreset, ArmAngles, PersonProps, personHands, Person, Crowd

## docs/kit/templates.md — Ready-made full shots for standard beats (stat, quote, evidence, claim, compare, list, timeline, map, person, process, question, title)
modules: kit/templates
Tone, Motif, ShotBase, tonePal, semColor, shotCam, Backdrop, ShotShell, RichText, TitleShot, StatCompare, StatShot, QuoteShot, EvidenceShot, ClaimShot, CompareSide, CompareShot, ListItem, ListShot, TimelineShotEvent, Era, TimelineShot, MapShotPin, MapShot, PersonShot, ProcessStep, ProcessShot, QuestionShot

## docs/kit/archival.md — Real-image shots edited like a top YouTube storyteller (Ken Burns, detail hunt, montage, collage, compare, document scan, annotated, in-world, parallax)
modules: kit/archival
Focus, ArchTint, ArchBase, viewRect, ViewRect, onView, ArchImage, CreditLine, LowerThird, KenBurnsShot, Detail, DetailHuntShot, MontageItem, MontageShot, CollageItem, CollageShot, CompareSideImg, CompareImagesShot, DocRegion, DocumentScanShot, Overlay, AnnotatedImageShot, ImageInWorldShot, Cut, ParallaxCutoutShot

## docs/kit/photo.md — Photo/PhotoMark components + how to find free images (tools/photo.mjs)
modules: kit/photo
Photo, PhotoMark

## docs/kit/data.md — Charts & exact-number visuals
modules: kit/data
fmtNum, fmtYear, Bar, BarChart, dotGridSize, DotGrid, PercentRing, Side, Comparison, TimelineEvent, TimelineAxis, LineChart, Meter, Gauge, BalanceScale, CounterRow

## docs/kit/icons.md — 64 flat pictogram icons
modules: kit/icons
IconName, ICON_NAMES, Icon

## docs/kit/env.md — Environments (sky, landscape, cities, streets, rooms, bathhouse, lab, museum, study, bedroom, mind space) and props
modules: kit/env
mixC, Tone, Layer, toned, ENV_FLOOR, BOOK_COLORS, skyBands, Stars, Cloud, Sky, Moon, Hills, Ground, TreeKind, Tree, Trees, Water, Landscape, Era, CitySkyline, StreetLamp, Street, Window, Door, Table, Desk, Chair, Bed, Bookshelf, BookStack, OilLamp, Candle, Torch, Bathtub, Bucket, Plant, Barrel, Cauldron, Scroll, Bench, Lantern, Clock, Bell, Banner, Plinth, Frame, RoomEra, Floor, Room, Bathhouse, Lab, ClassroomFront, Classroom, MuseumHall, Study, Bedroom, MindSpace

## docs/kit/science.md — Brain, head, body, organs, eye, cells, germs, DNA, molecules, waveforms, electrodes
modules: kit/science
Pt, smoothPath, Curve, makeCurve, BrainRegion, BRAIN_REGIONS, Brain, Electrode, ElectrodeArray, HeadProfile, Lungs, heartPulse, Heart, BloodVessel, Organ, BodyOutline, Eye, EyeCrossSection, Neuron, Synapse, Cell, ImmuneCell, GermKind, Bacterium, Virus, Germ, DNA, Molecule, Waveform

## docs/kit/geo.md — Flat maps (GeoMap), pins, routes, spread rings
modules: kit/geo
LonLat, BBox, ProjName, RegionName, Region, REGIONS, makeProjection, Proj, MapHighlight, MapLabelSpec, GeoMap, MapLabel, MapPin, CityDot, AreaMark, Route, SpreadRings

## docs/kit/silhouette.md — Shared library of free organism silhouettes (animals, dinosaurs, microbes…) — recolourable, dashed = inferred
modules: kit/silhouette
Silhouette, SILHOUETTE_NAMES

## docs/kit/depth.md — "Looks 3D" drawn flat: Globe, isometric buildings/rooms/props, shaded spheres, DepthStack
modules: kit/depth
mixTone, crescentPath, LonLat, globeProject, globeFacing, GlobeHighlight, GlobePin, GlobeRoute, Globe, iso, IsoColors, isoShades, IsoBox, IsoTile, IsoFloor, IsoStairs, isoChimneyTop, IsoBuilding, IsoRoom, IsoCylinder, Sphere, DepthCam, depthAt, DepthStack
