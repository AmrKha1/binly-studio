// Video language (set once per render from the active video's video.json "lang"; default English).
// Arabic ('ar'): Stage swaps every font to Baloo Bhaijaan 2 (+ Marhey for hand notes), zeroes letter-spacing, drops
// italics and MIRRORS the whole layout right-to-left (text, photos and maps stay readable — see kit/stage).
export type Lang = 'en' | 'ar';
let LANG: Lang = 'en';
export const setLang = (l?: string) => {
  LANG = l === 'ar' ? 'ar' : 'en';
};
export const lang = (): Lang => LANG;
export const isAr = () => LANG === 'ar';

// Words the kit itself writes on screen (everything else comes from the video's own text).
const WORDS = {
  vs: {en: 'vs', ar: 'ضد'},
  VS: {en: 'VS', ar: 'ضد'},
  but: {en: 'BUT', ar: 'لكن'},
} as const;
export const word = (k: keyof typeof WORDS) => WORDS[k][LANG];

export const FONT_AR = '"Baloo Bhaijaan 2", "Cairo", "Segoe UI", sans-serif';
export const FONT_AR_HAND = '"Marhey", "Baloo Bhaijaan 2", sans-serif';
