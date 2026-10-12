import React from 'react';
import {Stage, uid} from '../../kit/stage';
import {C} from '../../kit/theme';
import {ease, lerp, ramp} from '../../kit/anim';
import {Kicker} from '../../kit/text';
import {Steam} from '../../kit/fx';
import {DepthStack, Globe, iso, isoChimneyTop, IsoBox, IsoBuilding, IsoCylinder, IsoFloor, IsoRoom, IsoStairs, LonLat, Sphere} from '../../kit/depth';

// "Looks 3D, drawn flat" showcase. Everything settles by t = 4 s (steam / spin keep a little idle life).
const G = {x: 410, y: 405, r: 285};
const TOWN = {x: 1120, y: 205};
const ROOM = {x: 1700, y: 300};
const DS = {x: 80, y: 795, w: 660, h: 215};

export const Depth: React.FC<{t: number}> = ({t}) => {
  const turn = ramp(t, 0.1, 3.6, ease.inOut);
  const rot: LonLat = [lerp(-80, 14, turn), lerp(22, 44, turn)];
  const at = (gx: number, gy: number, gz = 0): [number, number] => {
    const [a, b] = iso(gx, gy, gz);
    return [TOWN.x + a, TOWN.y + b];
  };
  const bath = {gx: 30, gy: 128, w: 200, d: 104, floors: 1};
  const [bx, by] = at(bath.gx, bath.gy);
  const [cx, cy] = isoChimneyTop({w: bath.w, d: bath.d, floors: bath.floors});
  const [rx, ry] = iso(96, 84);
  const dolly = ramp(t, 0.4, 3.8, ease.inOut);
  return (
    <Stage>
      {/* ---------------- globe */}
      <Globe
        {...G}
        rotate={rot}
        p={ramp(t, 0, 0.8)}
        night={0.3}
        highlight={[{countries: ['France'], color: C.oxLight, p: ramp(t, 2.8, 3.6)}]}
        pins={[
          {lon: -74.0, lat: 40.7, label: 'New York', p: ramp(t, 0.4, 1)},
          {lon: 2.35, lat: 48.86, label: 'Paris', side: 'left', p: ramp(t, 2.4, 3.2)},
          {lon: 28.97, lat: 41.01, label: 'Constantinople', color: C.caution, p: ramp(t, 2.8, 3.6)},
        ]}
        routes={[{from: [-74.0, 40.7], to: [2.35, 48.86], p: ramp(t, 0.8, 3.2), dashed: true}]}
      />
      <Kicker x={G.x} y={752} text="Globe · rotate, highlight, pins, route, night" size={22} p={ramp(t, 0.3, 0.9)} />

      {/* ---------------- depth stack (dolly through layers) */}
      <clipPath id={uid('ds', DS.x, DS.y)}>
        <rect x={DS.x} y={DS.y} width={DS.w} height={DS.h} />
      </clipPath>
      <g clipPath={`url(#${uid('ds', DS.x, DS.y)})`}>
        <rect x={DS.x} y={DS.y} width={DS.w} height={DS.h} fill={C.sky} />
        <DepthStack
          frame={DS}
          cam={{x: DS.w / 2 + dolly * 30, y: DS.h / 2 + dolly * 8, z: dolly * 0.66}}
          haze={0.55}
          focus={1}
          hazeColor={C.sky}
          layers={[
            {
              z: 5,
              el: (
                <>
                  <circle cx={470} cy={70} r={30} fill={C.cautionTint} />
                  <path d="M-200 150 L40 70 L150 115 L260 52 L420 130 L560 80 L860 150 L860 400 L-200 400 Z" fill={C.stoneShade} />
                </>
              ),
            },
            {z: 2.4, el: <path d="M-300 170 Q20 105 230 150 T600 135 T960 160 L960 500 L-300 500 Z" fill={C.evidenceLight} />},
            {
              z: 1.4,
              el: (
                <g>
                  <path d="M-300 200 L960 200 L960 500 L-300 500 Z" fill={C.evidence} />
                  {[60, 190, 300, 470, 590].map((tx, i) => (
                    <Sphere key={i} x={tx} y={170 - (i % 2) * 8} r={26 + (i % 3) * 6} color={C.evidenceLight} terminator={0.35} rim={false} highlight={false} outline={false} />
                  ))}
                </g>
              ),
            },
            {
              z: 0.8,
              el: (
                <g fill={C.inkLift}>
                  <rect x={30} y={-40} width={34} height={320} />
                  <rect x={596} y={-40} width={34} height={320} />
                  <rect x={0} y={-40} width={660} height={40} />
                </g>
              ),
            },
          ]}
        />
      </g>
      <rect x={DS.x} y={DS.y} width={DS.w} height={DS.h} fill="none" stroke={C.ink} strokeWidth={3} />
      <Kicker x={DS.x + DS.w / 2} y={1050} text="DepthStack · dolly through layers + haze" size={22} p={ramp(t, 0.5, 1.1)} />

      {/* ---------------- isometric town block */}
      <IsoFloor x={TOWN.x} y={TOWN.y} cols={8} rows={6} size={44} p={ramp(t, 0.1, 1.3)} />
      <IsoBuilding x={at(10, 8)[0]} y={at(10, 8)[1]} w={92} d={74} floors={2} seed={3} material="timber" windowsLit={ramp(t, 2.8, 3.8) * 0.5} p={ramp(t, 0.7, 1.7)} />
      <IsoBuilding x={at(118, 8)[0]} y={at(118, 8)[1]} w={72} d={84} floors={3} seed={8} windowsLit={ramp(t, 2.8, 3.8) * 0.5} p={ramp(t, 0.9, 1.9)} />
      <IsoBuilding x={bx} y={by} w={bath.w} d={bath.d} floors={bath.floors} seed={4} wall={C.stone} roofColor={C.slate} chimney p={ramp(t, 1.2, 2.2)} />
      <Steam t={t} x={bx + cx} y={by + cy - 4} w={40} h={150} n={3} strength={ramp(t, 2.2, 3)} />
      <IsoCylinder x={at(255, 44)[0]} y={at(255, 44)[1]} r={30} h={200} kind="tower" p={ramp(t, 1.4, 2.5)} />
      <IsoBox x={at(262, 128)[0]} y={at(262, 128)[1]} w={62} d={52} h={56} color={C.stoneShade} p={ramp(t, 1.8, 2.6)} />
      <IsoCylinder x={at(293, 154, 56)[0]} y={at(293, 154, 56)[1]} r={19} h={16} kind="tub" color={C.stone} fill={0.8} shadow={false} p={ramp(t, 2.4, 3)} />
      <IsoStairs x={at(262, 180)[0]} y={at(262, 180)[1]} w={62} d={72} h={56} steps={7} color={C.stoneShade} p={ramp(t, 2, 2.8)} />
      <IsoCylinder x={at(244, 250)[0]} y={at(244, 250)[1]} r={12} h={30} kind="barrel" p={ramp(t, 2.4, 3)} />
      <IsoCylinder x={at(214, 252)[0]} y={at(214, 252)[1]} r={12} h={30} kind="barrel" p={ramp(t, 2.5, 3.1)} />
      <Kicker x={TOWN.x + 30} y={612} text="IsoFloor · IsoBuilding · IsoCylinder · IsoStairs" size={22} p={ramp(t, 0.5, 1.1)} />

      {/* ---------------- iso room (bath interior) */}
      <IsoRoom x={ROOM.x} y={ROOM.y} w={180} d={150} h={140} p={ramp(t, 0.6, 1.6)}>
        <IsoCylinder x={rx} y={ry} r={36} h={34} kind="tub" fill={0.75} p={ramp(t, 1.6, 2.4)} />
        <Steam t={t} x={rx} y={ry - 40} w={60} h={110} n={3} strength={ramp(t, 2.4, 3) * 0.7} />
        <IsoBox x={iso(132, 22)[0]} y={iso(132, 22)[1]} w={30} d={30} h={26} color={C.wood} p={ramp(t, 2, 2.6)} />
      </IsoRoom>
      <Kicker x={ROOM.x - 10} y={612} text="IsoRoom" size={22} p={ramp(t, 0.7, 1.3)} />

      {/* ---------------- spheres */}
      <Sphere x={990} y={820} r={118} preset="planet" rotate={t * 25} seed={2} p={ramp(t, 0.6, 1.4)} />
      <Sphere x={1250} y={828} r={92} preset="moon" rotate={t * 10} seed={5} p={ramp(t, 0.9, 1.7)} />
      <Sphere x={1490} y={822} r={100} preset="cell" seed={3} rotate={t * 6} p={ramp(t, 1.2, 2)}>
        <circle cx={-14} cy={-6} r={38} fill={C.theoryLight} />
        <circle cx={-24} cy={-16} r={10} fill={C.theoryTint} opacity={0.8} />
      </Sphere>
      <Sphere x={1730} y={828} r={80} preset="eyeball" p={ramp(t, 1.5, 2.3)}>
        <circle cx={lerp(-10, 14, ramp(t, 2.4, 3.4))} cy={-4} r={32} fill={C.evidenceLight} />
        <circle cx={lerp(-10, 14, ramp(t, 2.4, 3.4))} cy={-4} r={15} fill={C.ink} />
      </Sphere>
      <Kicker x={1360} y={1000} text="Sphere · planet · moon · cell · eyeball" size={22} p={ramp(t, 0.8, 1.4)} />
    </Stage>
  );
};
