import React from 'react';
import {Audio, getRemotionEnvironment, staticFile} from 'remotion';

/**
 * Audio for Studio preview only. Final videos are muxed in the cloud (render.yml): the ORIGINAL
 * voiceover untouched + music stem + SFX stem, so nothing here affects the delivered mix.
 * The active video's voiceover is copied to public/_active/ by tools/activate.mjs (only one at a time, on purpose).
 */
export const VideoAudio: React.FC<{slug: string; file?: string}> = ({slug, file = "voiceover.wav"}) => {
  const env = getRemotionEnvironment();
  if (!env.isStudio || !slug || slug === 'none') return null;
  return (
    <>
      <Audio src={staticFile(`_active/${file}`)} />
    </>
  );
};
