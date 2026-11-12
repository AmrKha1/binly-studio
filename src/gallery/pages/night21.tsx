import React from 'react';
import {Stage} from '../../kit/stage';
import {GridFloor, HostTrack, NightScreen, NightSky} from '../../kit/night';
import {CtaBoard, CtaPhone, CtaPress, EndScreen} from '../../kit/night-cta';

// pages "night21"–"night24": the CTA samples (owner 2026-11-11), timed to the closing line
// «وإلى هنا يخلص مقطعنا. إذا عجبك المقطع اضغط زر اللايك واشترك في القناة، وأشوفك في الفيديو الجاي»:
// like pressed on «اضغط زر اللايك» (≈ 1.8 s), subscribe on «واشترك» (≈ 3.2 s), the bell right after. Render with {"lang":"ar"}.
const T = {at: 0.6, like: 1.8, sub: 3.2, bell: 3.8};
const Host: React.FC<{t: number; poses: [number, string][]}> = ({t, poses}) => (
  <HostTrack t={t} id="cta-host" enter={{kind: 'riseSoft', at: 0.1}} spots={[{at: 0, spot: 'sideLeft'}]} poses={poses as never} />
);
const Base: React.FC<{t: number; children: React.ReactNode; floor?: boolean}> = ({t, children, floor = true}) => (
  <Stage bg="#0F062B">
    <NightScreen>
      <NightSky t={t} id="cta-s" />
      {floor && <GridFloor id="cta-f" t={t} />}
      {children}
    </NightScreen>
  </Stage>
);

/** A · AZTIKA presses it */
export const NightPage21: React.FC<{t: number}> = ({t}) => (
  <Base t={t}>
    <CtaPress t={t} {...T} id="a" />
    <Host t={t} poses={[[0, 'present'], [1.5, 'point'], [4.3, 'lower'], [4.9, 'viewer']]} />
  </Base>
);
/** B · the phone that teaches */
export const NightPage22: React.FC<{t: number}> = ({t}) => (
  <Base t={t} floor={false}>
    <CtaPhone t={t} {...T} id="b" />
    <Host t={t} poses={[[0, 'present'], [1.5, 'point'], [4.9, 'viewer']]} />
  </Base>
);
/** C · on the board */
export const NightPage23: React.FC<{t: number}> = ({t}) => (
  <Base t={t}>
    <CtaBoard t={t} {...T} id="c" />
    <Host t={t} poses={[[0, 'present'], [1.5, 'higher'], [4.3, 'lower'], [5.0, 'viewer']]} />
  </Base>
);
/** D · the end screen after the closing words (YouTube's real buttons go on the two outlines) */
export const NightPage24: React.FC<{t: number}> = ({t}) => (
  <Base t={t}>
    <EndScreen t={t} at={0.3} id="d" />
    <Host t={t} poses={[[0, 'welcome'], [2.5, 'point'], [5, 'viewer']]} />
  </Base>
);
