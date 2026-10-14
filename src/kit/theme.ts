// Binly colour system as code. Core values come from brand/color_system.txt (Warm Editorial).
// Every extra shade here is a tint/shade INSIDE one of those families — never a new hue family.
// Use C.* everywhere; never hard-code a hex in a chapter unless it is a mix of these (see mixHex in anim.ts).

export const C = {
  // ---- core system (brand/color_system.txt)
  paper: '#EDE4D3', // default background
  ink: '#2B2420', // text on paper, dark panels, night interiors
  oxblood: '#8B2E1F', // signal accent: ONE key beat per scene
  evidence: '#2F5233', // semantic: confirmed / documented
  theory: '#5C4A72', // semantic: theory / speculation / inference
  caution: '#B8860B', // semantic: warning / debated / handle with care

  // ---- paper family
  paperLight: '#F5EFE3',
  paperShade: '#E2D6C0',
  paperDeep: '#D3C4A8',
  paperDark: '#BFAE8E',

  // ---- ink family
  inkSoft: '#3A312B',
  inkLift: '#4A3F37',
  inkMute: '#6B5D50',
  inkFaint: '#8E8070',

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

  // ---- materials (all inside the families above)
  bone: '#E6D8BC',
  boneShade: '#CDBB98',
  wood: '#7A5A43',
  woodDark: '#5E4433',
  woodLight: '#9C7A5C',
  stone: '#B9AC97',
  stoneShade: '#9A8D79',
  stoneDark: '#7C7062',
  metal: '#8E8A84',
  lamp: '#E8C67A', // warm light (caution family, lifted)
  fire: '#D9822B', // flame core (caution → oxblood)
  water: '#7E8F8C', // muted grey-green (evidence family, greyed) — water, glass, steam tint
  waterDeep: '#5B6B69',
  slate: '#5E5866', // ink+plum: cool shadow, steel, night sky
  sky: '#E9DCC4', // day sky = lighter paper
  dusk: '#D9B98C', // dusk sky (caution family, softened)
  night: '#2F2A33', // night sky (ink + plum)

  // ---- skin tones (muted, varied; oxblood/caution families)
  skin: ['#E3C3A8', '#D4A98A', '#B9876A', '#946650', '#6E4A3A'],
  skinShade: ['#CDA88D', '#BC9071', '#9F7155', '#7C5341', '#573A2D'],
  hair: ['#2B2420', '#4A3F37', '#6E4A30', '#9C7A5C', '#BFB2A0'],

  // ---- earth ramp (paper → ink), for strata / depth
  strata: ['#C9B595', '#B29C79', '#9A8263', '#7D6750', '#5F4E40', '#463A31', '#342B25'],
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

export const FONT_SERIF = '"Fraunces", Georgia, serif'; // titles, editorial captions, quotes
export const FONT_SANS = '"Inter", "Segoe UI", Arial, sans-serif'; // labels, tags, numbers, UI
export const FONT_HAND = '"Caveat", "Segoe Print", cursive'; // RARE accent: handwritten notes on images/documents only (≥ 34 px)

export const W = 1920;
export const H = 1080;
export const FPS = 60;
/** Title-safe margin (px). Keep text inside [SAFE, W-SAFE] x [SAFE, H-SAFE]. */
export const SAFE = 96;
