// YOUTUBE MASTER (owner 2026-11-08): the final file is made to YouTube's own upload recommendations
// (support.google.com/youtube/answer/1722171) so it uploads fast, processes fast and keeps its quality:
//   MP4 · H.264 High profile · progressive · 4:2:0 (yuv420p) · BT.709 colour TAGGED (no colour shift on YouTube) ·
//   constant frame rate = the render's (60) · closed GOP of half the frame rate (keyframe every 0.5 s) · 2 B-frames ·
//   high-quality VBR (CRF 12, capped, aq-mode 3 against banding in dark gradients) — YouTube re-encodes everything, so a richer source = a sharper result ·
//   AAC-LC 384 kb/s stereo 48 kHz · "faststart" (moov atom first = web-optimised, starts playing/processing at once).
// res 1440 = optional upscale to 2560×1440 (lanczos): YouTube gives 1440p+ uploads its better codecs (VP9/AV1) and more
// bitrate — evidence is mixed for flat animation, so it is an option to A/B test, not the default.
export const ytVideoArgs = ({res = 1080, fps = 60, fast = false} = {}) => {
  const up = Number(res) === 1440;
  const vf = up
    ? ['-vf', 'scale=2560:1440:flags=lanczos:out_color_matrix=bt709:out_range=tv,setsar=1,format=yuv420p']
    : ['-vf', 'setsar=1,format=yuv420p'];
  return [
    ...vf,
    '-c:v', 'libx264', '-preset', fast ? 'veryfast' : 'medium', '-profile:v', 'high', '-level:v', up ? '5.1' : '4.2',
    // CRF 12 + aq-mode 3 (more bits to dark, flat gradients — our night skies, glows and rays never band)
    '-crf', '12', '-maxrate', up ? '60M' : '40M', '-bufsize', up ? '120M' : '80M', '-x264-params', 'aq-mode=3',
    '-g', String(Math.round(fps / 2)), '-keyint_min', String(Math.round(fps / 2)), '-sc_threshold', '0', '-flags', '+cgop', '-bf', '2',
    '-r', String(fps), '-fps_mode', 'cfr',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  ];
};
export const ytAudioArgs = () => ['-c:a', 'aac', '-profile:a', 'aac_low', '-b:a', '384k', '-ar', '48000', '-ac', '2'];
export const ytContainerArgs = () => ['-movflags', '+faststart', '-brand', 'mp42'];

/**
 * Check a delivered file against the spec. probe = parsed `ffprobe -show_streams -show_format -of json`; head = the
 * first bytes of the file (to see whether the moov atom comes before mdat). Returns [{ok, label, value}].
 */
export const ytCheck = (probe, head, {fps = 60} = {}) => {
  const v = probe.streams.find((s) => s.codec_type === 'video') ?? {};
  const au = probe.streams.find((s) => s.codec_type === 'audio') ?? {};
  const [n, d] = String(v.avg_frame_rate ?? '0/1').split('/').map(Number);
  const rate = n / (d || 1);
  const [rn, rd] = String(v.r_frame_rate ?? '0/1').split('/').map(Number);
  const moov = head.indexOf('moov'), mdat = head.indexOf('mdat');
  const vbr = Number(v.bit_rate ?? 0) || Number(probe.format?.bit_rate ?? 0);
  const out = [];
  const add = (ok, label, value) => out.push({ok, label, value});
  add(probe.format?.format_name?.includes('mp4'), 'Container', `MP4 (${probe.format?.format_name})`);
  add(moov >= 0 && (mdat < 0 || moov < mdat), 'Web-optimised (faststart)', moov >= 0 && (mdat < 0 || moov < mdat) ? 'moov first — starts playing/processing at once' : 'moov at the END — YouTube must read the whole file first');
  add(v.codec_name === 'h264' && /high/i.test(v.profile ?? ''), 'Video codec', `${v.codec_name} ${v.profile ?? ''} level ${v.level ?? '?'}`);
  add(v.pix_fmt === 'yuv420p', 'Chroma 4:2:0', v.pix_fmt);
  add(v.color_space === 'bt709' && v.color_primaries === 'bt709' && v.color_transfer === 'bt709', 'Colour BT.709 tagged', `${v.color_space}/${v.color_primaries}/${v.color_transfer} (${v.color_range ?? '?'} range)`);
  add([1080, 1440].includes(Number(v.height)) && Number(v.width) === Math.round((Number(v.height) * 16) / 9), 'Resolution 16:9', `${v.width}×${v.height}`);
  add(Math.abs(rate - fps) < 0.01 && Math.abs(rn / (rd || 1) - fps) < 0.01, 'Constant frame rate', `${rate.toFixed(3)} fps`);
  add(v.field_order === undefined || v.field_order === 'progressive', 'Progressive', v.field_order ?? 'progressive');
  add(vbr >= 8e6, 'Video bitrate', `${(vbr / 1e6).toFixed(1)} Mb/s (YouTube suggests ~12 for 1080p60; flat animation needs fewer bits for the same quality — ≥ 8 passes)`);
  add(au.codec_name === 'aac' && /LC/i.test(au.profile ?? 'LC'), 'Audio codec', `${au.codec_name} ${au.profile ?? ''}`);
  add(Number(au.sample_rate) === 48000 && Number(au.channels) === 2 && Number(au.bit_rate ?? 0) >= 256e3, 'Audio 48 kHz stereo', `${au.sample_rate} Hz, ${au.channels} ch, ${Math.round(Number(au.bit_rate ?? 0) / 1000)} kb/s`);
  return out;
};
