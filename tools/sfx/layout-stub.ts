// Stand-in for '@remotion/layout-utils' in the sfx scanner (plain Node has no canvas, so measureText() throws and the
// whole frame — with all its sound cues — was lost). The scanner only needs a rough width (it affects the stereo pan of
// a cue, never its time), so this approximates: ≈ 0.56 × font size per character.
export const measureText = ({text, fontSize}: {text: string; fontSize: number}) => ({width: String(text).length * fontSize * 0.56, height: fontSize});
