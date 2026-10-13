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

// Kit showcase pages. Render a page: node tools/still.mjs Gallery --props '{"page":"icons"}' --at 2
export const GALLERY: Record<string, React.FC<{t: number}>> = {
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
};
