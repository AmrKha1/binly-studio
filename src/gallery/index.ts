import React from 'react';
import {Text} from './pages/text';
import {Cards} from './pages/cards';
import {Diagrams} from './pages/diagrams';
import {Data} from './pages/data';
import {Icons} from './pages/icons';
import {Env} from './pages/env';
import {Science} from './pages/science';
import {Geo} from './pages/geo';
import {People} from './pages/people';
import {Transitions} from './pages/transitions';
import {PhotoPage} from './pages/photo';
import {Depth} from './pages/depth';
import {Templates, Templates2} from './pages/templates';
import {Archival, Archival2} from './pages/archival';

import {Silhouettes} from './pages/silhouettes';
import {World} from './pages/world';
import {Biomes} from './pages/biomes';
import {Jitter} from './pages/jitter';
import {Glow, GlowFloorPage} from './pages/glow';
import {Arabic} from './pages/arabic';
import {Motion} from './pages/motion';
import {HostPage, HostPage2, HostPage3, HostPage5} from './pages/host';
import {IHost, IHostAll} from './pages/ihost';
import {Pilot} from './pages/pilot';
import {Pilot2} from './pages/pilot2';
import {DepthDemo} from './pages/depth2';
import {Alive} from './pages/alive';
import {EditFx} from './pages/editfx';
import {NightPage, NightPage2, NightPage3} from './pages/night';
import {NightPage4} from './pages/night4';
import {NightPage5} from './pages/night5';
import {NightPage6} from './pages/night6';
import {NightPage7} from './pages/night7';
import {NightPage8} from './pages/night8';
import {NightPage9} from './pages/night9';
import {NightPage10} from './pages/night10';
import {NightPage11} from './pages/night11';
import {NightPage12} from './pages/night12';
import {NightPage13} from './pages/night13';

// Kit showcase pages. Render a page: node tools/still.mjs Gallery --props '{"page":"icons"}' --at 2
export const GALLERY: Record<string, React.FC<{t: number}>> = {
  night: NightPage,
  night2: NightPage2,
  night3: NightPage3,
  night4: NightPage4,
  night5: NightPage5,
  night6: NightPage6,
  night7: NightPage7,
  night8: NightPage8,
  night9: NightPage9,
  night10: NightPage10,
  night11: NightPage11,
  night12: NightPage12,
  night13: NightPage13,
  glow: Glow,
  arabic: Arabic,
  motion: Motion,
  host: HostPage,
  host2: HostPage2,
  host3: HostPage3,
  host5: HostPage5,
  ihost: IHost,
  pilot: Pilot,
  pilot2: Pilot2,
  depthdemo: DepthDemo,
  alive: Alive,
  editfx: EditFx,
  'ihost-all': IHostAll,
  glowfloor: GlowFloorPage,
  text: Text,
  cards: Cards,
  diagrams: Diagrams,
  data: Data,
  icons: Icons,
  env: Env,
  science: Science,
  geo: Geo,
  people: People,
  transitions: Transitions,
  photo: PhotoPage,
  depth: Depth,
  templates: Templates,
  templates2: Templates2,
  archival: Archival,
  archival2: Archival2,
  silhouettes: Silhouettes,
  world: World,
  biomes: Biomes,
  jitter: Jitter,
};
