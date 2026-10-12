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
};
