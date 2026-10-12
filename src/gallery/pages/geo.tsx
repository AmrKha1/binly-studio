import React from 'react';
import {Stage} from '../../kit/stage';
import {C} from '../../kit/theme';
import {ramp} from '../../kit/anim';
import {Kicker} from '../../kit/text';
import {AreaMark, CityDot, GeoMap, makeProjection, MapPin, Route, SpreadRings} from '../../kit/geo';

// Maps showcase. Everything settles by t = 4 s (outbreak rings keep pulsing).
const EU = {x: 80, y: 100, w: 1040, h: 860};
const WD = {x: 1200, y: 100, w: 640, h: 330};
const MD = {x: 1200, y: 540, w: 640, h: 420};

export const Geo: React.FC<{t: number}> = ({t}) => {
  const eu = makeProjection('europe', EU.w, EU.h, {x: EU.x, y: EU.y});
  const md = makeProjection('mediterranean', MD.w, MD.h, {x: MD.x, y: MD.y});
  const [px, py] = eu(2.35, 48.86);
  const [zx, zy] = eu(8.54, 47.37);
  const [gx, gy] = eu(-3.6, 37.18);
  const [bx, by] = eu(4.9, 51.1);
  const [mx, my] = md(15.55, 38.19);
  return (
    <Stage>
      <GeoMap
        {...EU}
        region="europe"
        p={ramp(t, 0, 0.9)}
        labelP={ramp(t, 0.6, 1.8)}
        labels={[
          {text: 'Atlantic Ocean', lon: -8.5, lat: 46, rotate: -8},
          {text: 'Mediterranean Sea', lon: 6.6, lat: 37.75},
          {text: 'North Sea', lon: 3.2, lat: 56},
        ]}
      >
        <AreaMark x={bx} y={by} rx={46} ry={30} rot={-20} p={ramp(t, 1.4, 2.4)} color={C.theory} />
        <Route points={[[-3.6, 37.18], [-1.2, 43.4], [2.35, 48.86], [4.9, 51.1]]} proj={eu} p={ramp(t, 1.6, 3.4)} dashed color={C.oxblood} />
        <SpreadRings t={t} x={zx} y={zy} r={70} p={ramp(t, 1.2, 2)} color={C.caution} core={9} />
        <MapPin x={gx} y={gy} label="Granada" sub="1349" p={ramp(t, 0.8, 1.6)} />
        <MapPin x={px} y={py} label="Paris" p={ramp(t, 1.0, 1.8)} side="left" />
        <MapPin x={zx} y={zy} label="Zurich" p={ramp(t, 1.2, 2)} color={C.caution} />
        <MapPin x={bx} y={by} label="Brabant" sub="region" p={ramp(t, 1.4, 2.2)} color={C.theory} />
      </GeoMap>
      <Kicker x={EU.x} y={EU.y + EU.h + 58} text="GeoMap · europe · conicConformal · pins, route, area, rings" anchor="start" size={22} p={ramp(t, 0.4, 1)} />

      <GeoMap {...WD} region="world" p={ramp(t, 0.3, 1.2)} highlight={[{countries: ['India'], color: C.oxLight, p: ramp(t, 1.4, 2.4)}, {countries: [76], color: C.evidenceLight, p: ramp(t, 1.8, 2.8)}]} />
      <Kicker x={WD.x + WD.w / 2} y={WD.y + WD.h + 50} text="GeoMap · world · highlight" size={22} p={ramp(t, 0.6, 1.2)} />

      <GeoMap {...MD} region="mediterranean" p={ramp(t, 0.5, 1.4)} labelP={ramp(t, 1, 2)} labels={[{text: 'Mare Nostrum', lon: 22.5, lat: 33.6}]}>
        <Route points={[[28.97, 41.0], [15.55, 38.19]]} proj={md} p={ramp(t, 1.4, 2.6)} bend={-0.15} />
        <Route points={[[15.55, 38.19], [5.37, 43.3]]} proj={md} p={ramp(t, 2.2, 3.4)} bend={0.2} />
        <SpreadRings t={t} x={mx} y={my} r={60} p={ramp(t, 2, 2.8)} />
        <CityDot {...xy(md(28.97, 41.0))} label="Constantinople" side="top" p={ramp(t, 1.2, 1.8)} />
        <CityDot {...xy(md(15.55, 38.19))} label="Messina" side="right" p={ramp(t, 1.8, 2.4)} />
        <CityDot {...xy(md(5.37, 43.3))} label="Marseille" side="top" p={ramp(t, 2.8, 3.4)} />
      </GeoMap>
      <Kicker x={MD.x + MD.w / 2} y={MD.y + MD.h + 58} text="mediterranean · CityDot · SpreadRings" size={22} p={ramp(t, 0.8, 1.4)} />
    </Stage>
  );
};

const xy = ([x, y]: [number, number]) => ({x, y});
