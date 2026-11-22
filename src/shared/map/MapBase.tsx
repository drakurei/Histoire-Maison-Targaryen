import { memo, useLayoutEffect, useRef, useState } from 'react';

import type { MapData } from '@/core/content/types';

import { reliefPaths } from './labels';
import styles from './WorldMap.module.css';

interface MapBaseProps {
  map: Readonly<MapData>;
  /** Préfixe des identifiants SVG, unique dans la page. */
  uid: string;
  /** Lignes de crête à tracer comme un mur (droite, double), et non comme un relief. */
  wallIds: readonly string[];
}

interface Relief {
  id: string;
  peaks: string;
  shade: string;
}

/** Pas d'échantillonnage le long d'une crête et hauteur d'un sommet, en unités de la carte. */
const RELIEF_STEP = 9;
const RELIEF_SIZE = 8.5;

/** Les reliefs ne dépendent que du tracé : calculés une fois par session. */
const reliefCache = new Map<string, Relief>();

/**
 * Le fond gravé de la carte, qui ne change pas quand on se déplace : côtes doublées de
 * lignes d'eau, terres, fleuves, reliefs, mur. Les épaisseurs de trait sont en pixels
 * d'écran (`vector-effect`) : le trait reste fin à tous les grossissements.
 */
export const MapBase = memo(function MapBase({ map, uid, wallIds }: MapBaseProps) {
  const crests = useRef<(SVGPathElement | null)[]>([]);
  const ranges = map.ranges.filter((range) => !wallIds.includes(range.id));
  const walls = map.ranges.filter((range) => wallIds.includes(range.id));
  const [reliefs, setReliefs] = useState<Relief[]>(() =>
    ranges.flatMap((range) => {
      const cached = reliefCache.get(range.d);
      return cached ? [cached] : [];
    }),
  );

  useLayoutEffect(() => {
    if (reliefs.length === ranges.length) return;
    const next: Relief[] = [];
    ranges.forEach((range, index) => {
      const cached = reliefCache.get(range.d);
      if (cached) {
        next.push(cached);
        return;
      }
      const path = crests.current[index];
      if (!path) return;
      const length = path.getTotalLength();
      const points: [number, number][] = [];
      for (let at = RELIEF_STEP / 2; at < length; at += RELIEF_STEP) {
        const p = path.getPointAtLength(at);
        points.push([p.x, p.y]);
      }
      const relief = { id: range.id, ...reliefPaths(points, RELIEF_SIZE) };
      reliefCache.set(range.d, relief);
      next.push(relief);
    });
    setReliefs(next);
    // Les tracés de la carte ne changent pas pendant la vie de la page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  const coast = `${uid}-coast`;

  return (
    <g className={styles.base}>
      <defs>
        <g id={coast}>
          {map.lands.map((land) => (
            <path key={land.id} d={land.d} vectorEffect="non-scaling-stroke" />
          ))}
          {map.islands.map((island) => (
            <path key={island.id} d={island.d} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </defs>

      {/* Lignes d'eau : deux contours parallèles à la côte, comme sur une carte gravée. */}
      <use href={`#${coast}`} className={styles.ringOuter} />
      <use href={`#${coast}`} className={styles.ringOuterGap} />
      <use href={`#${coast}`} className={styles.ringInner} />
      <use href={`#${coast}`} className={styles.ringInnerGap} />
      <use href={`#${coast}`} className={styles.land} />

      <g className={styles.rivers}>
        {map.rivers.map((river) => (
          <path key={river.id} d={river.d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>

      <g className={styles.crests} aria-hidden="true">
        {ranges.map((range, index) => (
          <path
            key={range.id}
            d={range.d}
            ref={(el) => {
              crests.current[index] = el;
            }}
          />
        ))}
      </g>
      <g className={styles.relief}>
        {reliefs.map((relief) => (
          <g key={relief.id}>
            <path className={styles.reliefShade} d={relief.shade} vectorEffect="non-scaling-stroke" />
            <path className={styles.reliefPeaks} d={relief.peaks} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </g>

      <g className={styles.walls}>
        {walls.map((wall) => (
          <g key={wall.id}>
            <path className={styles.wallBody} d={wall.d} vectorEffect="non-scaling-stroke" />
            <path className={styles.wallCore} d={wall.d} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </g>
    </g>
  );
});
