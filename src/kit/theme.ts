// Binly colour system as code. Core values come from brand/color_system.txt (Warm Editorial).
// Every extra shade here is a tint/shade INSIDE one of those families — never a new hue family.
// Use C.* everywhere; never hard-code a hex in a chapter unless it is a mix of these (see mixHex in anim.ts).

export const C = {
  // ---- core system (brand/color_system.txt)
  paper: '#FFFFFF', // default background — CLEAN WHITE (owner, 2026-10-20: white mode, never cream/off-white)
  ink: '#2B2420', // text on paper, dark panels, night interiors
  oxblood: '#8B2E1F', // signal accent: ONE key beat per scene
  evidence: '#2F5233', // semantic: confirmed / documented
  theory: '#5C4A72', // semantic: theory / speculation / inference
  caution: '#B8860B', // semantic: warning / debated / handle with care

  // ---- paper family
  paperLight: '#FFFFFF', // cards/pills: white, separated from the white page by soft shadow + glow (kit filters)
  paperShade: '#F1F1F4', // neutral light greys (no beige) for panels, lines, shading on white
  paperDeep: '#E2E2E7',
  paperDark: '#C8C8CF',

  // ---- ink family
  inkSoft: '#2B2420', // owner 2026-10-21: body text bold and BLACK, not washed-out grey
  inkLift: '#4A3F37',
  inkMute: '#4A423C',
  inkFaint: '#6E655E',

  // ---- signal family (oxblood)
  oxLight: '#B5553F',
  oxTint: '#D9A493',
  oxDeep: '#6A2217',

  // ---- semantic tints (for fills behind outlines, soft panels)
  evidenceLight: '#5E7F5F',
  evidenceTint: '#C9D3BF',
  theoryLight: '#8C7BA0',
  theoryTint: '#D8CFDC',
  cautionLight: '#D4A73C',
  cautionTint: '#EAD7A6',
  // gold = the KEY accent (key word, big number) — always with its soft gold glow (GLOW.gold)
  gold: '#B07D0C',
  goldLight: '#E0B23E',
  goldTint: '#F7EBC8',
  lavender: '#D9CDEA', // glowing lavender pill / diamond halo

  // ---- materials (all inside the families above)
  bone: '#F2E9D8', // CLEAN LOOK retune (owner 2026-10-21): brighter, cleaner, no brown/beige mud
  boneShade: '#DCCDB2',
  wood: '#A6764F',
  woodDark: '#7D5435',
  woodLight: '#C99B6E',
  stone: '#DCD9D3',
  stoneShade: '#BEB9B1',
  stoneDark: '#8E8981',
  metal: '#A9AFB7',
  lamp: '#E8C67A', // warm light (caution family, lifted)
  fire: '#D9822B', // flame core (caution → oxblood)
  water: '#8EC5E0', // clear light blue — water, glass, steam tint
  waterDeep: '#4E91BC',
  slate: '#5F6B7D', // cool shadow, steel
  sky: '#DDEEFA', // day sky = clean light blue
  dusk: '#F6CDB0', // dusk sky = soft peach (no brown)
  night: '#26304D', // night sky = clean deep blue (not muddy)

  // ---- skin tones (muted, varied; oxblood/caution families)
  skin: ['#E3C3A8', '#D4A98A', '#B9876A', '#946650', '#6E4A3A'],
  skinShade: ['#CDA88D', '#BC9071', '#9F7155', '#7C5341', '#573A2D'],
  hair: ['#2B2420', '#4A3F37', '#6E4A30', '#9C7A5C', '#BFB2A0'],

  // ---- earth ramp (paper → ink), for strata / depth
  strata: ['#E2D3B5', '#CDB892', '#B49B74', '#957C5A', '#765F45', '#574535', '#3B2F27'],
};

/** Semantic certainty colours. Use them for MEANING (confirmed / theory / caution), not decoration. */
export const SEM = {
  confirmed: C.evidence,
  evidence: C.evidence,
  theory: C.theory,
  speculation: C.theory,
  caution: C.caution,
  debated: C.caution,
  signal: C.oxblood,
  ink: C.ink,
} as const;
export type Sem = keyof typeof SEM;

// Headline face (owner 2026-10-21, picked from a test page): Poppins Black — geometric, bold, clean (Arabic videos
// swap to Baloo Bhaijaan 2 automatically).
export const FONT_SERIF = '"Poppins", "Inter", "Segoe UI", sans-serif'; // titles, numbers, quotes, pills (name kept for compatibility)
// Labels too (owner 2026-10-21: "remove the old text styles"): Poppins everywhere, normal case, normal letter spacing.
export const FONT_SANS = '"Poppins", "Inter", "Segoe UI", Arial, sans-serif'; // labels, tags, kickers, UI
export const FONT_HAND = '"Caveat", "Segoe Print", cursive'; // RARE accent: handwritten notes on images/documents only (≥ 34 px)

export const W = 1920;
export const H = 1080;
export const FPS = 60;
/** Title-safe margin (px). Keep text inside [SAFE, W-SAFE] x [SAFE, H-SAFE]. */
export const SAFE = 96;
/** Text sizes (px at 1080p) that read on an upright phone and stay calm on a TV (16–22 arc-minute legibility rule).
 *  key: the shot's key word/line · read: text the viewer must read · label: ALL-CAPS sans text the viewer must read (caps read
 *  bigger per px) · small: secondary text (kickers, side notes) · credit: image credits/source notes only. */
export const TYPE = {key: 72, read: 48, label: 40, small: 36, credit: 26} as const;

/**
 * ELEGANT GLOW (owner, 2026-10-20): soft halos only — never neon, never on everything. Filters are defined once per
 * <Stage> (kit/stage). Use: <g filter={GLOW.gold}>…</g>. soft = soft lifted shadow for cards/pills on white.
 */
export const GLOW = {
  soft: 'url(#kSoft)',
  gold: 'url(#kGlowGold)',
  lavender: 'url(#kGlowLav)',
  green: 'url(#kGlowGreen)',
  oxblood: 'url(#kGlowOx)',
  white: 'url(#kGlowWhite)',
} as const;
/** The glow that belongs to an accent colour (undefined = no glow). */
export const glowFor = (color?: string): string | undefined => {
  const c = (color ?? '').toUpperCase();
  if ([C.gold, C.goldLight, C.caution, C.cautionLight].some((k) => k.toUpperCase() === c)) return GLOW.gold;
  if ([C.oxblood, C.oxLight].some((k) => k.toUpperCase() === c)) return GLOW.oxblood;
  if ([C.theory, C.theoryLight, C.lavender].some((k) => k.toUpperCase() === c)) return GLOW.lavender;
  if ([C.evidence, C.evidenceLight].some((k) => k.toUpperCase() === c)) return GLOW.green;
  return undefined;
};
