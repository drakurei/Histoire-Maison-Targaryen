import { useMemo } from 'react';

import type { Source } from '@/core/content/types';
import { useT } from '@/core/i18n';

import { useElementWidth } from '../../components/useElementWidth';
import styles from './Frise.module.css';

/** Mesures de la frise, en pixels. */
const LANE = 19;
const GAP = 10;
const CHAR = 6.1;
const PAD = 8;
const BAR = 5;

interface Placed {
  source: Source;
  x0: number;
  x1: number;
  /** Bord gauche et largeur de l'étiquette. */
  labelX: number;
  labelWidth: number;
  anchor: 'start' | 'end';
  lane: number;
}

/** Range les étiquettes en couloirs, chacune au plus près de l'axe, sans recouvrement. */
function placeLabels(items: readonly Omit<Placed, 'lane'>[]): Placed[] {
  const ends: number[] = [];
  return [...items]
    .sort((a, b) => a.labelX - b.labelX)
    .map((item) => {
      const free = ends.findIndex((end) => end + PAD <= item.labelX);
      const lane = free === -1 ? ends.length : free;
      ends[lane] = item.labelX + item.labelWidth;
      return { ...item, lane };
    });
}

interface FriseProps {
  sources: readonly Source[];
  /** Fin de l'axe : l'année la plus récente à montrer. */
  until: number;
}

/**
 * Frise des parutions (spec §5.14) : au-dessus de l'axe, les livres, chacun à son année ;
 * au-dessous, les séries, chacune sur la durée de sa diffusion. La séparation des deux
 * continuités se voit d'un regard. Titres originaux, comme dans une bibliographie.
 */
export function Frise({ sources, until }: FriseProps) {
  const t = useT();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const works = useMemo(() => sources.filter((source) => source.year !== null && !source.members?.length && source.type !== 'outil-de-verification'), [sources]);
  const from = Math.min(...works.map((source) => source.year ?? until));

  const layout = useMemo(() => {
    if (width === 0) return null;
    const span = Math.max(1, until + 1 - from);
    const x = (year: number) => ((year - from) / span) * width;
    const place = (source: Source): Omit<Placed, 'lane'> => {
      const x0 = x(source.year ?? from);
      const x1 = source.continuity === 'adaptation' ? x((source.yearEnd ?? until) + 1) : x0;
      const labelWidth = source.title.length * CHAR;
      const anchor = x0 + labelWidth > width ? 'end' : 'start';
      return { source, x0, x1, labelX: anchor === 'start' ? x0 : x0 - labelWidth, labelWidth, anchor };
    };
    const books = placeLabels(works.filter((source) => source.continuity === 'livres').map(place));
    const screen = placeLabels(works.filter((source) => source.continuity === 'adaptation').map(place));
    const bookLanes = Math.max(1, ...books.map((item) => item.lane + 1));
    const screenLanes = Math.max(1, ...screen.map((item) => item.lane + 1));
    const axis = bookLanes * LANE + GAP * 2;
    const height = axis + GAP + BAR + GAP + screenLanes * LANE + LANE;
    const ticks: number[] = [];
    for (let year = Math.ceil(from / 5) * 5; year <= until; year += 5) ticks.push(year);
    return { x, books, screen, axis, height, ticks };
  }, [width, works, from, until]);

  return (
    <div ref={ref} className={styles.frise}>
      {layout ? (
        <svg width={width} height={layout.height} role="img" aria-label={t('page.sources.separate.figure', { from, to: until })}>
          {layout.books.map((item) => {
            const baseline = layout.axis - GAP - item.lane * LANE;
            return <line key={item.source.id} x1={item.x0} x2={item.x0} y1={layout.axis} y2={baseline - 11} className={styles.attache} />;
          })}
          {layout.books.map((item) => {
            const baseline = layout.axis - GAP - item.lane * LANE;
            return (
              <text key={item.source.id} x={item.anchor === 'start' ? item.x0 + 4 : item.x0 - 4} y={baseline - 2} textAnchor={item.anchor} className={styles.titre}>
                {item.source.title}
              </text>
            );
          })}
          <line x1={0} x2={width} y1={layout.axis} y2={layout.axis} className={styles.axe} />
          {layout.ticks.map((year) => (
            <text key={year} x={layout.x(year)} y={layout.height - 4} className={styles.annee} textAnchor="middle">
              {year}
            </text>
          ))}
          {layout.ticks.map((year) => (
            <line key={`g-${year}`} x1={layout.x(year)} x2={layout.x(year)} y1={layout.axis - 3} y2={layout.axis + 3} className={styles.graduation} />
          ))}
          {layout.screen.map((item) => {
            const top = layout.axis + GAP;
            const baseline = top + BAR + GAP + 9 + item.lane * LANE;
            return (
              <g key={item.source.id}>
                <rect x={item.x0} y={top} width={Math.max(3, item.x1 - item.x0)} height={BAR} className={styles.diffusion} />
                <line x1={item.x0} x2={item.x0} y1={top} y2={baseline - 9} className={styles.attache} />
              </g>
            );
          })}
          {layout.screen.map((item) => {
            const baseline = layout.axis + GAP + BAR + GAP + 9 + item.lane * LANE;
            return (
              <text key={item.source.id} x={item.anchor === 'start' ? item.x0 + 4 : item.x0 - 4} y={baseline} textAnchor={item.anchor} className={styles.titre}>
                {item.source.title}
              </text>
            );
          })}
        </svg>
      ) : null}
    </div>
  );
}
