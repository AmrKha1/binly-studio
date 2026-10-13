import React from 'react';
import {
  AnnotatedImageShot,
  CollageShot,
  CompareImagesShot,
  DetailHuntShot,
  DocumentScanShot,
  ImageInWorldShot,
  KenBurnsShot,
  MontageShot,
  ParallaxCutoutShot,
} from '../../kit/archival';

// Archival image templates: one template per 4 s window (0–4 KenBurns, 4–8 DetailHunt, … 24–28 Annotated).
// Stills at 3.5, 7.5, 11.5 … show each settled. The Gallery composition is 30 s long, so templates 8–9 live on
// page "archival2" (same page shifted by 28 s: stills at 3.5 and 7.5 there). Test images: public/test-dinos/img/.
const S = 'test-dinos';
const TOURNAI = {src: 'img/tournai.jpg', aspect: 801 / 482, credit: 'Pierart dou Tielt · Public domain'};
const BATH = {src: 'img/bathhouse.jpg', aspect: 1690 / 1653, credit: 'Master of Anthony of Burgundy · Public domain'};
const MS = {src: 'img/manuscript.jpg', aspect: 1920 / 2578, credit: 'Trotula manuscript, c. 1300 · Public domain'};
const MARV = {src: 'img/marville.jpg', aspect: 1920 / 1455, credit: 'Charles Marville · Public domain'};

const SHOTS: ((t: number, a: number, b: number) => React.ReactNode)[] = [
  (t, a, b) => (
    <KenBurnsShot
      t={t}
      a={a}
      b={b}
      slug={S}
      {...TOURNAI}
      from={[0.5, 0.5, 1]}
      to={[0.45, 0.5, 1.12]}
      beats={[{at: a + 1.5, focus: [0.3, 0.56, 1.75]}]}
      caption="Burial of plague victims, Tournai, 1349"
      kicker="Chronicle of Gilles Li Muisis"
    />
  ),
  (t, a, b) => (
    <DetailHuntShot
      t={t}
      a={a}
      b={b}
      slug={S}
      {...BATH}
      details={[
        {rx: 0.42, ry: 0.26, rw: 0.17, rh: 0.25, label: 'Guests arrive', note: 'dressed — for now', at: a + 0.2, kind: 'ink'},
        {rx: 0.73, ry: 0.5, rw: 0.36, rh: 0.3, label: 'Dinner in the tub', note: 'food, wine, company', at: a + 1.8, kind: 'signal', shape: 'box'},
      ]}
      returnAt={false}
    />
  ),
  (t, a, b) => (
    <MontageShot
      t={t}
      a={a}
      b={b}
      slug={S}
      transition="dissolve"
      kicker="Five centuries of bathing"
      items={[
        {...TOURNAI},
        {...MS, from: [0.5, 0.3, 1.0], to: [0.5, 0.36, 1.1]},
        {...BATH},
        {...MARV, caption: 'La Bièvre, Paris, c. 1865', kicker: 'Charles Marville'},
      ]}
      cuts={[a, a + 0.8, a + 1.6, a + 2.4]}
    />
  ),
  (t, a, b) => (
    <CollageShot
      t={t}
      a={a}
      b={b}
      slug={S}
      items={[
        {...TOURNAI, label: 'Tournai, 1349'},
        {...MS, label: 'Trotula, c. 1300'},
        {...BATH, label: 'Bathhouse, c. 1470'},
        {...MARV, label: 'Paris, c. 1865'},
      ]}
      gap={0.3}
      link={{from: 0, to: 1, at: a + 1.5, label: 'Same century', kind: 'signal'}}
    />
  ),
  (t, a, b) => (
    <CompareImagesShot
      t={t}
      a={a}
      b={b}
      slug={S}
      title="Pleasure, then plague"
      left={{...BATH, label: 'The bathhouse', sub: 'Flanders · c. 1470', tag: {text: 'Painted scene', kind: 'theory'}}}
      right={{...TOURNAI, label: 'The burials', sub: 'Tournai · 1349', tag: {text: 'Eyewitness', kind: 'confirmed'}}}
      at={a + 0.1}
      rightAt={a + 0.7}
    />
  ),
  (t, a, b) => (
    <DocumentScanShot
      t={t}
      a={a}
      b={b}
      slug={S}
      {...MS}
      kicker="Salerno · c. 1300"
      title="A women's medical book"
      regions={[
        {rx: 0.43, ry: 0.255, rw: 0.15, rh: 0.095, label: 'Opening words', text: 'When the Author of the universe first created the world…', kind: 'caution', at: a + 1.5},
        {rx: 0.58, ry: 0.594, rw: 0.17, rh: 0.024, label: 'Red chapter title', text: 'On the weakness of women', kind: 'signal', at: a + 2.4},
      ]}
    />
  ),
  (t, a, b) => (
    <AnnotatedImageShot
      t={t}
      a={a}
      b={b}
      slug={S}
      {...BATH}
      kicker="Inside a bathhouse"
      from={[0.5, 0.55, 1.0]}
      to={[0.5, 0.55, 1.06]}
      overlays={[
        {kind: 'outline', rx: 0.75, ry: 0.62, rw: 0.42, rh: 0.34, shape: 'box', label: 'Shared hot tub', sem: 'signal', at: a + 0.3},
        {kind: 'outline', rx: 0.2, ry: 0.4, rw: 0.22, rh: 0.22, dashed: true, label: 'Private room?', at: a + 0.8},
        {kind: 'flow', points: [[0.43, 0.42], [0.47, 0.52], [0.55, 0.6]], label: 'Way in', sem: 'evidence', at: a + 1.2, dur: 0.9},
        {kind: 'icon', rx: 0.62, ry: 0.36, icon: 'speech', label: 'Gossip', sem: 'caution', at: a + 1.7},
        {kind: 'label', rx: 0.38, ry: 0.69, text: 'A pet dog', sem: 'ink', at: a + 2.0, dx: -160, dy: 60},
      ]}
    />
  ),
  (t, a, b) => <ImageInWorldShot t={t} a={a} b={b} slug={S} {...TOURNAI} setting="museum" label="Room 14 · Medieval Flanders" pushAt={a + 3.2} pushDur={1.5} caption="Burial of plague victims, Tournai, 1349" />,
  (t, a, b) => (
    <ParallaxCutoutShot
      t={t}
      a={a}
      b={b}
      slug={S}
      {...BATH}
      cut={{rx: 0.355, ry: 0.15, rw: 0.15, rh: 0.28, shape: 'ellipse'}}
      from={[0.4, 0.3, 1.15]}
      to={[0.52, 0.34, 1.22]}
      label={{text: 'The visitors', kind: 'signal'}}
      at={a + 0.6}
      caption="A bathhouse, Flanders, c. 1470"
    />
  ),
];

const SLOT = 4;

export const Archival: React.FC<{t: number}> = ({t}) => {
  const i = Math.max(0, Math.min(SHOTS.length - 1, Math.floor(t / SLOT)));
  return <>{SHOTS[i](t, i * SLOT, i * SLOT + SLOT)}</>;
};

/** Same page shifted by 28 s (the Gallery composition is 30 s long): templates 8–9 (stills at 3.5 and 7.5). */
export const Archival2: React.FC<{t: number}> = ({t}) => <Archival t={t + 28} />;
