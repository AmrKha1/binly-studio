import React from 'react';
import {C} from '../../kit/theme';
import {
  TitleShot,
  StatShot,
  QuoteShot,
  EvidenceShot,
  ClaimShot,
  CompareShot,
  ListShot,
  TimelineShot,
  MapShot,
  PersonShot,
  ProcessShot,
  QuestionShot,
} from '../../kit/templates';

// Shot templates: one template per 3 s window (t 0–3 TitleShot, 3–6 StatShot, …). Stills at 2.5, 5.5, 8.5, …
// show each settled. The Gallery composition is 30 s long, so templates 11–12 live on page "templates2"
// (same page shifted by 30 s: stills at 2.5 and 5.5 there).
const SHOTS: ((t: number, a: number, b: number) => React.ReactNode)[] = [
  (t, a, b) => <TitleShot t={t} a={a} b={b} kicker="Chapter two" title="The bath that cured nothing" icon="bath" accent={['nothing']} sub="Paris · 1300s" at={a + 0.1} />,
  (t, a, b) => (
    <StatShot t={t} a={a} b={b} value="26" unit="%" label="of patients recovered" kicker="Hôtel-Dieu, 1349" at={a + 0.1} compare={{kind: 'dots', filled: 26, total: 100, caption: '26 out of every 100'}} compareAt={a + 0.5} />
  ),
  (t, a, b) => (
    <QuoteShot t={t} a={a} b={b} style="card" text="The air of the bath opens the pores, and through them the pestilence enters the body." source="Paris Medical Faculty" sub="Report to the King · 1348" highlight={['pestilence']} at={a + 0.1} revealDur={1.3} highlightAt={a + 1.6} />
  ),
  (t, a, b) => (
    <EvidenceShot
      t={t}
      a={a}
      b={b}
      slug="test-dinos"
      src="img/tournai.jpg"
      aspect={801 / 482}
      caption="Burial of plague victims, Tournai, 1349"
      credit="Pierart dou Tielt · Public domain"
      mark={{rx: 0.32, ry: 0.55, rw: 0.3, rh: 0.48, at: a + 1, label: 'Coffins'}}
      tag={{text: 'Primary source', kind: 'confirmed', at: a + 0.5}}
      at={a + 0.1}
    />
  ),
  (t, a, b) => <ClaimShot t={t} a={a} b={b} text="Hot water spread the plague through open pores." kind="theory" highlight={['open', 'pores']} but="No one had yet seen a single germ." stamp="Wrong" at={a + 0.1} butAt={a + 1.3} stampAt={a + 1.7} />,
  (t, a, b) => (
    <CompareShot
      t={t}
      a={a}
      b={b}
      kicker="Two explanations"
      left={{title: 'Miasma', icon: 'wind', kind: 'theory', bullets: ['Bad air from rot', 'Smell = danger', 'Accepted 1,500 years']}}
      right={{title: 'Germ theory', icon: 'germ', kind: 'confirmed', bullets: ['Living microbes', 'Seen under a lens', 'Proven 1861']}}
      verdict={{text: 'Microbes win', side: 'right', kind: 'confirmed', at: a + 1.6}}
      at={a + 0.1}
      rightAt={a + 0.5}
    />
  ),
  (t, a, b) => (
    <ListShot
      t={t}
      a={a}
      b={b}
      kicker="What the bathhouse offered"
      title="More than a wash"
      items={[
        {label: 'Hot water', icon: 'drop'},
        {label: 'Gossip', icon: 'speech'},
        {label: 'Food & wine', icon: 'flame'},
        {label: 'Medicine', icon: 'pill'},
      ]}
      at={a + 0.3}
      gap={0.3}
      highlight={3}
      highlightAt={a + 1.7}
    />
  ),
  (t, a, b) => (
    <TimelineShot
      t={t}
      a={a}
      b={b}
      kicker="Five centuries of baths"
      title="From cure to culprit"
      from={1200}
      to={1700}
      ticks={100}
      eras={[
        {from: 1200, to: 1347, label: 'Bath culture'},
        {from: 1347, to: 1550, label: 'Plague years', color: C.oxblood},
        {from: 1550, to: 1700, label: 'Dry hygiene', color: C.caution},
      ]}
      events={[
        {year: 1292, label: '26 baths in Paris', at: a + 0.6},
        {year: 1348, label: 'Black Death', kind: 'signal', at: a + 1.0},
        {year: 1546, label: 'Bathhouses close', at: a + 1.4},
      ]}
      at={a + 0.1}
    />
  ),
  (t, a, b) => (
    <MapShot
      t={t}
      a={a}
      b={b}
      region="western-europe"
      kicker="1347–1349"
      title="The plague reaches the baths"
      sub="Along the trade routes, in under two years."
      pins={[
        {lon: 9.19, lat: 45.46, label: 'Milan', at: a + 0.6},
        {lon: 2.35, lat: 48.86, label: 'Paris', at: a + 1.0},
        {lon: 3.39, lat: 50.6, label: 'Tournai', kind: 'spread', side: 'top', at: a + 1.4},
      ]}
      routes={[{points: [[9.19, 45.46], [2.35, 48.86]], at: a + 0.8, dashed: true}]}
      at={a + 0.1}
    />
  ),
  (t, a, b) => (
    <PersonShot t={t} a={a} b={b} name="Guy de Chauliac" sub="Papal physician · Avignon · 1348" kicker="The doctor" env="study" person={{outfit: 'robe', hat: 'scholar', beard: 'short', hair: 'short'}} prop="book" side="left" at={a + 0.1} nameAt={a + 0.7} />
  ),
  (t, a, b) => (
    <ProcessShot
      t={t}
      a={a}
      b={b}
      kicker="The medieval logic"
      title="Why baths seemed deadly"
      steps={[
        {label: 'Hot water', icon: 'drop'},
        {label: 'Pores open', icon: 'thermometer'},
        {label: 'Bad air enters', icon: 'wind', kind: 'theory'},
        {label: 'Plague', icon: 'skull'},
      ]}
      at={a + 0.2}
      gap={0.4}
    />
  ),
  (t, a, b) => (
    <QuestionShot t={t} a={a} b={b} kicker="The real question" question="So who actually carried the plague into the bathhouse?" highlight={['carried']} mark="silhouette" at={a + 0.1} markAt={a + 0.4} />
  ),
];

const SLOT = 3;

export const Templates: React.FC<{t: number}> = ({t}) => {
  const i = Math.max(0, Math.min(SHOTS.length - 1, Math.floor(t / SLOT)));
  return <>{SHOTS[i](t, i * SLOT, i * SLOT + SLOT)}</>;
};

/** Same page shifted by 30 s (the Gallery composition is 30 s long): templates 11–12. */
export const Templates2: React.FC<{t: number}> = ({t}) => <Templates t={t + 30} />;