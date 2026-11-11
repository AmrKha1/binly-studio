// NIGHT MAPS — real country shapes in the AZTIKA look (references/universe-claude 2:52–3:47 paper map, 6:40 neon map;
// GAP-CHECK P2 + "territory spread" from the second reference). Data = the kit's world-atlas (kit/geo), drawn chunky:
// thick dark outline, flat fill, a soft drop shadow (paper) or a glowing outline on dark (neon).
//   <PaperMap t id/>  (kit/night-worlds — the beige page)  +  <NightMap … mode="paper" areas=[…]/>
//   <SpaceWorld/> or a dark rect  +  <NightMap … mode="neon" …/>
// areas: each a group of countries with its own fill; `at` pops it in; `spread` = [lon, lat] makes the colour SPREAD
// out from that point over `dur` (empires, conquests, a deal doubling a country). Place pins/labels with nightProj().
import React from 'react';
import {clamp01, ease, popRef} from './anim';
import {cueSfx} from './sfx';
import {uid} from './stage';
import {countryD, makeProjection, ProjName, Region} from './geo';
import {W, H} from './theme';

const OUT = '#14101C';

export type MapArea = {countries: (string | number)[]; fill: string; at?: number; spread?: [number, number]; dur?: number; dashed?: boolean; outline?: string};

/** The projection a NightMap with the same region/x/y/w/h uses: (lon, lat) → [x, y] in screen px. */
export const nightProj = (region: Region, w = W, h = H, x = 0, y = 0, projection?: ProjName) => makeProjection(region, w, h, {x, y, projection});

/**
 * NightMap — countries as chunky game-map shapes. mode paper (default): fill + 9 px dark outline + soft shadow, on the
 * beige PaperMap. mode neon: dark fill + glowing outline (default electric blue), on a dark backdrop (6:40 the US
 * highway map). min = chunkiness (vertex spacing in px; 2.5 = smooth, 6 = blocky like the reference).
 */
export const NightMap: React.FC<{t: number; region: Region; areas: MapArea[]; x?: number; y?: number; w?: number; h?: number; mode?: 'paper' | 'neon'; neon?: string; min?: number; projection?: ProjName; detail?: '50m' | '110m'; id: string; out?: number}> = ({
  t, region, areas, x = 0, y = 0, w = W, h = H, mode = 'paper', neon = '#3B82F6', min = 4, projection, detail, id, out,
}) => {
  const fade = out !== undefined ? 1 - clamp01((t - out) / 0.25) : 1;
  if (fade <= 0) return null;
  const g = uid('nmap', id);
  const proj = makeProjection(region, w, h, {projection});
  return (
    <g transform={`translate(${x} ${y})`} opacity={fade}>
      <defs>
        <filter id={g} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={mode === 'neon' ? 10 : 14} />
        </filter>
      </defs>
      {areas.map((a, i) => {
        const d = countryD(region, w, h, a.countries, {detail, projection, min});
        if (!d) return null;
        const at = a.at ?? -1;
        if (t < at) return null;
        // SOUND MAP: a map region FILLS → thump as it lands; a spreading region → whoosh as it sweeps
        if (at >= 0) cueSfx(a.spread ? 'whoosh' : 'thump', `nmap-${id}-${i}-${at}`, t < at + 0.3, x + w / 2, {at, hit: a.spread ? 0.25 : 0.125});
        const pop = at >= 0 && !a.spread ? popRef(clamp01((t - at) / 0.3), 0.4, 0.15) : {sx: 1, sy: 1, o: 1};
        const sp = a.spread ? ease.inOut(clamp01((t - Math.max(0, at)) / (a.dur ?? 1.2))) : 1;
        const [sx, sy] = a.spread ? proj(a.spread[0], a.spread[1]) : [0, 0];
        const cid = `${g}-c${i}`;
        const line = a.outline ?? (mode === 'neon' ? neon : OUT);
        const shape = (
          <g>
            {mode === 'paper' ? (
              <>
                <path d={d} fill="#000000" opacity={0.18} transform="translate(8 12)" filter={`url(#${g})`} />
                <path d={d} fill={a.fill} stroke={line} strokeWidth={9} strokeLinejoin="round" strokeDasharray={a.dashed ? '18 14' : undefined} />
              </>
            ) : (
              <>
                <path d={d} fill={a.fill} />
                <path d={d} fill="none" stroke={line} strokeWidth={10} strokeLinejoin="round" opacity={0.7} filter={`url(#${g})`} />
                <path d={d} fill="none" stroke={line} strokeWidth={4} strokeLinejoin="round" />
                <path d={d} fill="none" stroke="#DCEBFF" strokeWidth={1.5} strokeLinejoin="round" opacity={0.8} />
              </>
            )}
          </g>
        );
        return (
          <g key={i}>
            {a.spread && (
              <defs>
                <clipPath id={cid}>
                  <circle cx={sx} cy={sy} r={Math.hypot(w, h) * sp} />
                </clipPath>
              </defs>
            )}
            <g transform={`translate(${w / 2} ${h / 2}) scale(${pop.sx} ${pop.sy}) translate(${-w / 2} ${-h / 2})`} opacity={pop.o} clipPath={a.spread ? `url(#${cid})` : undefined}>
              {shape}
            </g>
            {a.spread && sp > 0 && sp < 1 && <circle cx={sx} cy={sy} r={Math.hypot(w, h) * sp} fill="none" stroke={a.fill} strokeWidth={6} opacity={0.5 * (1 - sp)} />}
          </g>
        );
      })}
    </g>
  );
};

/** NeonLines — glowing route lines drawn on over a neon map (6:40 the highway network). points in screen px. */
export const NeonLines: React.FC<{t: number; at: number; lines: [number, number][][]; color?: string; dur?: number; id: string}> = ({t, at, lines, color = '#FFC928', dur = 1.5, id}) => {
  if (t < at) return null;
  cueSfx('whoosh', `nneonl-${id}-${at}`, t < at + 0.3, 960, {at, hit: 0.25}); // SOUND MAP: lines drawn on → whoosh
  const g = uid('nneonl', id);
  const k = ease.inOut(clamp01((t - at) / dur));
  return (
    <g>
      <defs>
        <filter id={g} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      {lines.map((pts, i) => {
        const d = pts.map((p, j) => `${j ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={color} strokeWidth={10} opacity={0.6} pathLength={1} strokeDasharray={`${k} 1`} filter={`url(#${g})`} />
            <path d={d} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${k} 1`} />
          </g>
        );
      })}
    </g>
  );
};


