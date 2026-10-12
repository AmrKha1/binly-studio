import React from 'react';
import {AbsoluteFill, Composition, useCurrentFrame} from 'remotion';
import './kit/fonts';
import {C, FONT_SANS, FPS, H, W} from './kit/theme';
import {active} from './active';
import {GALLERY} from './gallery';
import {VideoAudio} from './kit/audio';

// Compositions:
//  Main    — the active video (src/active.ts points at src/videos/<slug>). Full length, 60 fps.
//  Sheet   — contact sheet: n frames of Main between `from` and `to` (seconds) tiled in one 1920x1080 still.
//  Gallery — kit showcase pages (src/gallery), used to test/preview kit components.

const Main: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const V = active.Video;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <V t={t} />
      <VideoAudio slug={active.meta.slug} file={active.meta.audio} />
    </AbsoluteFill>
  );
};

type SheetProps = {from: number; to: number; n: number; cols: number; times?: number[]};
const Sheet: React.FC<SheetProps> = ({from, to, n, cols, times}) => {
  const V = active.Video;
  const ts = times && times.length ? times : Array.from({length: n}, (_, i) => (n === 1 ? from : from + ((to - from) * i) / (n - 1)));
  const rows = Math.ceil(ts.length / cols);
  const gap = 8;
  const cw = (W - gap * (cols + 1)) / cols;
  const ch = (cw * 9) / 16;
  const s = cw / W;
  const top = Math.max(gap, (H - rows * ch - (rows - 1) * gap) / 2);
  return (
    <AbsoluteFill style={{background: '#7d7570'}}>
      {ts.map((tt, i) => {
        const x = gap + (i % cols) * (cw + gap);
        const y = top + Math.floor(i / cols) * (ch + gap);
        const mm = Math.floor(tt / 60);
        const ss = (tt - mm * 60).toFixed(1).padStart(4, '0');
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: cw, height: ch, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${s})`, transformOrigin: '0 0'}}>
              <V t={tt} />
            </div>
            <div style={{position: 'absolute', left: 6, top: 6, padding: '2px 8px', background: 'rgba(0,0,0,0.65)', color: '#fff', font: `700 ${Math.max(14, 22 * (4 / cols))}px ${FONT_SANS}`}}>
              {mm}:{ss}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Gallery: React.FC<{page: string}> = ({page}) => {
  const t = useCurrentFrame() / FPS;
  const P = GALLERY[page];
  if (!P) return <AbsoluteFill style={{background: C.paper, color: C.ink, font: `700 48px ${FONT_SANS}`, padding: 80}}>Unknown gallery page: {page}. Pages: {Object.keys(GALLERY).join(', ')}</AbsoluteFill>;
  return <P t={t} />;
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.max(1, Math.ceil(active.meta.duration * FPS))} fps={FPS} width={W} height={H} />
    <Composition
      id="Sheet"
      component={Sheet as React.FC<Record<string, unknown>>}
      durationInFrames={1}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{from: 0, to: 10, n: 12, cols: 4, times: []} as Record<string, unknown>}
    />
    <Composition id="Gallery" component={Gallery as React.FC<Record<string, unknown>>} durationInFrames={60 * 30} fps={FPS} width={W} height={H} defaultProps={{page: Object.keys(GALLERY)[0]} as Record<string, unknown>} />
  </>
);
