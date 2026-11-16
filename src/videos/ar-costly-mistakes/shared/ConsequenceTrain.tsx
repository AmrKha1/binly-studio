/**
 * ConsequenceTrain — consequences as a row of tall DOMINO tiles on a glowing timeline: each tile stands up on its `at`,
 * carries an icon (node) on its face, with a gold year pill + a short white label on the timeline under it; then the
 * first push knocks them over in sequence (`fallAt` per tile) — each tile falls onto the next and the chain leans,
 * glowing red once it has fallen. Arabic: the sequence runs RIGHT → LEFT and the tiles fall to the LEFT (auto).
 * Origin: built for ar-costly-mistakes C10 (Suez aftermath: 1875 sale · 1876 bankrupt · 1879 Ismail deposed · 1882
 * occupation · 1956 nationalised), 2026-11-16. Night look: ivory tiles with a thick dark outline, a bevel side, one
 * highlight stripe, gold glow while standing → red glow when fallen; growth ease.out (no bounce), falls accelerate.
 * Screen coordinates (inside <NightScreen>).
 *
 * Props: t · x (centre of the row) · y (floor line under the tiles) · tiles [{year, label, icon (node centred on 0,0,
 * ≈ 120 px), at, fallAt?}] · gap (300) · tileW (170) · tileH (400) · dir? (+1 sequence to the right, −1 to the left;
 * default by language) · line (true: timeline + pills) · id.
 * Sounds: thump (tile stands) · thump (tile lands on the next; the last one = impact).
 */
import React from 'react';
import {clamp01, ease} from '../../../kit/anim';
import {lb, uid} from '../../../kit/stage';
import {NPill} from '../../../kit/night';
import {moveTo} from '../../../kit/night-scenes';
import {cueSfx} from '../../../kit/sfx';
import {isAr} from '../../../kit/lang';
import {OUT, grow, popAt, prog} from './util';

export type ConsequenceTile = {year: string; label: string; icon?: React.ReactNode; at: number; fallAt?: number};
export type ConsequenceTrainProps = {t: number; x: number; y: number; tiles: ConsequenceTile[]; gap?: number; tileW?: number; tileH?: number; dir?: 1 | -1; line?: boolean; id: string};

const DEG = 180 / Math.PI;

export const ConsequenceTrain: React.FC<ConsequenceTrainProps> = ({t, x, y, tiles, gap = 300, tileW = 170, tileH = 400, dir, line = true, id}) => {
  const sd = dir ?? (isAr() ? -1 : 1);
  const n = tiles.length;
  const g = uid('ctrain', id);
  const cx = (i: number) => x - sd * ((n - 1) / 2) * gap + sd * i * gap;
  const rest = Math.acos(Math.min(0.98, tileW / gap)) * DEG; // leaning on the next tile
  const touch = Math.asin(clamp01((gap - tileW) / tileH)) * DEG; // first contact while the next still stands
  const FALL = 0.42;

  // own fall (accelerating) for tile i, in degrees, before the chain carries it further
  const own = (i: number) => {
    const fa = tiles[i].fallAt;
    if (fa === undefined) return 0;
    const last = i === n - 1;
    const target = last ? 90 : touch;
    const k = ease.in(prog(t, fa, FALL * (last ? 1.25 : 1)));
    return target * k;
  };
  // the chain: tile i leans further as tile i+1 goes down
  const angles: number[] = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let a = own(i);
    if (i < n - 1 && a >= touch - 0.01 && tiles[i].fallAt !== undefined) {
      const nextA = Math.min(angles[i + 1], rest);
      a = touch + (rest - touch) * (nextA / rest);
    }
    angles[i] = a;
  }

  tiles.forEach((tl, i) => {
    cueSfx('thump', `ctrain-${id}-up${i}-${tl.at}`, t >= tl.at && t < tl.at + 0.3, cx(i), {at: tl.at, hit: 0.3, gain: 0.8});
    if (tl.fallAt !== undefined) {
      const last = i === n - 1;
      const land = FALL * (last ? 1.25 : 1);
      cueSfx(last ? 'impact' : 'thump', `ctrain-${id}-fall${i}-${tl.fallAt}`, t >= tl.fallAt && t < tl.fallAt + 0.6, cx(i), {at: tl.fallAt, hit: land});
    }
  });

  // timeline grows to the newest tile
  const shown = tiles.filter((tl) => t >= tl.at).length;
  const lastShownAt = shown ? tiles[shown - 1].at : 0;
  const prevReach = shown > 1 ? cx(shown - 2) : cx(0);
  const reach = shown ? moveTo(t, lastShownAt, prevReach, cx(shown - 1), 0.45) : cx(0);
  const lineY = y + 34;

  return (
    <g {...lb('object', id)}>
      <defs>
        <linearGradient id={`${g}-face`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFDF5" /><stop offset="0.6" stopColor="#EFE7D4" /><stop offset="1" stopColor="#D6CAB0" /></linearGradient>
        <filter id={`${g}-b`} x="-60%" y="-40%" width="220%" height="180%"><feGaussianBlur stdDeviation={22} /></filter>
        <filter id={`${g}-lb`} x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation={8} /></filter>
      </defs>
      {/* the timeline */}
      {line && shown > 0 && (
        <g>
          <line x1={cx(0) + sd * -60} x2={reach + sd * 60} y1={lineY} y2={lineY} stroke="#FFE7A8" strokeWidth={16} opacity={0.6} filter={`url(#${g}-lb)`} />
          <line x1={cx(0) + sd * -60} x2={reach + sd * 60} y1={lineY} y2={lineY} stroke="#FFF4D6" strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
      {tiles.map((tl, i) => {
        if (t < tl.at) return null;
        const up = grow(t, tl.at, 0.45);
        const a = angles[i];
        const fallen = tl.fallAt !== undefined && t >= tl.fallAt ? clamp01((t - tl.fallAt) / FALL) : 0;
        const px = cx(i) + sd * (tileW / 2); // pivot: bottom corner on the falling side
        const glowC = fallen > 0.5 ? '#FF2E4D' : '#FCC018';
        const pips = Math.min(6, i + 1);
        return (
          <g key={i}>
            <g transform={`translate(${px} ${y}) rotate(${sd * a}) translate(${-sd * (tileW / 2)} 0) scale(1 ${up})`}>
              <rect x={-tileW / 2} y={-tileH} width={tileW} height={tileH} rx={22} fill={glowC} opacity={0.35} filter={`url(#${g}-b)`} />
              {/* bevel side (thickness) */}
              <rect x={-tileW / 2 + 14 * -sd} y={-tileH + 10} width={tileW} height={tileH} rx={22} fill="#8E8268" stroke={OUT} strokeWidth={7} />
              <rect x={-tileW / 2} y={-tileH} width={tileW} height={tileH} rx={22} fill={`url(#${g}-face)`} stroke={OUT} strokeWidth={7} />
              <rect x={-tileW / 2 + 16} y={-tileH + 22} width={9} height={tileH - 44} rx={4.5} fill="#FFFFFF" opacity={0.9} />
              {/* icon on the upper half */}
              <g transform={`translate(0 ${-tileH * 0.66})`}>{tl.icon}</g>
              <line x1={-tileW / 2 + 22} x2={tileW / 2 - 22} y1={-tileH * 0.36} y2={-tileH * 0.36} stroke={OUT} strokeWidth={6} strokeLinecap="round" />
              {/* domino pips = the step number */}
              {Array.from({length: pips}, (_, k) => {
                const col = k % 2, row = Math.floor(k / 2);
                const rows = Math.ceil(pips / 2);
                const ppx = pips === 1 ? 0 : (col ? 1 : -1) * tileW * 0.2;
                const ppy = -tileH * 0.18 + (row - (rows - 1) / 2) * tileH * 0.085;
                return <circle key={k} cx={ppx} cy={ppy} r={tileW * 0.065} fill="#2A1A3A" />;
              })}
            </g>
            {line && (() => {
              const q = popAt(t, tl.at + 0.15);
              return (
                <g opacity={q.o}>
                  <circle cx={cx(i)} cy={lineY} r={12} fill="#FCC018" stroke={OUT} strokeWidth={5} />
                  <NPill text={tl.year} x={cx(i)} y={lineY + 62} size={46} kind="gold" id={`${id}-y${i}`} p={clamp01((t - tl.at - 0.15) / 0.3)} />
                  <NPill text={tl.label} x={cx(i)} y={lineY + 140} size={38} kind={fallen > 0.5 ? 'red' : 'white'} id={`${id}-l${i}`} p={clamp01((t - tl.at - 0.3) / 0.3)} />
                </g>
              );
            })()}
          </g>
        );
      })}
    </g>
  );
};
