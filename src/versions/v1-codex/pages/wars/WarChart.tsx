import { useMemo, useRef } from 'react';

import { VLink } from '@/app/version';
import { periods } from '@/core/content/timeline';
import type { War } from '@/core/content/types';
import { formatSpan, formatYear, useLang, useT, useTitle, VALYRIAN_TAG } from '@/core/i18n';
import { createTimeScale, timeTicks, yearToX } from '@/core/timeline';

import { useElementWidth } from '../../components/hooks';
import { toRoman } from '../../components/numerals';
import styles from './WarChart.module.css';

interface WarChartProps {
  wars: readonly War[];
  from: number;
  to: number;
}

/** Marge intérieure de la règle du temps (YearRule) : les barres s'alignent sur ses graduations. */
const PAD = 10;
const CHAR = 7.2;
const LABEL_GAP = 90;
const MINOR_GAP = 14;

/**
 * L'ordre des guerres : une ligne par conflit, sa durée en barre d'encre rouge sur l'échelle
 * commune du temps, les volumes de la chronique en bandes derrière, graduée dessous.
 * Une guerre d'un an a une barre d'un an : l'échelle ne ment pas sur les durées.
 */
export function WarChart({ wars, from, to }: WarChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  const title = useTitle();
  const t = useT();
  const { reading } = useLang();

  const scale = useMemo(() => (width > 80 ? createTimeScale({ domain: [from, to], range: [PAD, width - PAD] }) : null), [width, from, to]);

  const bands = useMemo(() => {
    if (!scale) return [];
    const inRange = [...periods].filter((period) => period.to >= from && (period.from ?? -Infinity) <= to).sort((a, b) => a.order - b.order);
    return inRange.map((period, index) => {
      const start = Math.max(period.from ?? from, from);
      const nextStart = inRange[index + 1]?.from ?? to;
      return { period, x0: yearToX(scale, start), x1: yearToX(scale, Math.min(nextStart, to)) };
    });
  }, [scale, from, to]);

  return (
    <div className={styles.chart}>
      <div ref={ref} className={styles.field} style={{ blockSize: `${wars.length * 2 + 2.6}rem` }}>
        {scale
          ? bands.map((band, index) => (
              <div
                key={band.period.id}
                className={styles.band}
                data-even={index % 2 === 0 || undefined}
                style={{ insetInlineStart: `${band.x0}px`, inlineSize: `${Math.max(band.x1 - band.x0, 1)}px` }}
              >
                {band.x1 - band.x0 > 28 ? (
                  <span className={styles.volume} aria-hidden="true">
                    {toRoman(band.period.order)}
                  </span>
                ) : null}
              </div>
            ))
          : null}
        {scale ? (
          <ol className={styles.rows} role="list" aria-label={t('page.wars.chart.label')}>
            {wars.map((war, index) => {
              const x0 = yearToX(scale, war.from);
              const x1 = Math.max(yearToX(scale, war.to + 1), x0 + 3);
              const name = title(war.title);
              const labelWidth = name.primary.length * CHAR + 8;
              const flip = x1 + labelWidth > width;
              return (
                <li key={war.id} className={styles.row} style={{ insetBlockStart: `${index * 2 + 2.2}rem` }}>
                  <span className={styles.bar} style={{ insetInlineStart: `${x0}px`, inlineSize: `${x1 - x0}px` }} />
                  <VLink
                    to={`/guerres/${war.id}`}
                    className={styles.label}
                    data-flip={flip || undefined}
                    style={flip ? { insetInlineEnd: `${width - x0 + 8}px` } : { insetInlineStart: `${x1 + 8}px` }}
                    title={formatSpan(war.from, war.to, reading)}
                  >
                    <span lang={name.isHv ? VALYRIAN_TAG : undefined}>{name.primary}</span>
                  </VLink>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
      {scale ? (
        <svg className={styles.axis} width={width} height={34} viewBox={`0 0 ${width} 34`} role="img" aria-label={t('page.bati.time.label', { from: formatYear(from, reading), to: formatYear(to, reading) })}>
          <line className={styles.axisLine} x1={PAD} x2={width - PAD} y1={4} y2={4} />
          {timeTicks(scale, { minGap: MINOR_GAP }).map((tick) => (
            <line key={`m${tick.year}`} className={styles.axisLine} x1={tick.x} x2={tick.x} y1={4} y2={8} />
          ))}
          {timeTicks(scale, { minGap: LABEL_GAP }).map((tick) => (
            <g key={`t${tick.year}`}>
              <line className={styles.axisLine} x1={tick.x} x2={tick.x} y1={4} y2={12} />
              <text className={styles.axisYear} x={tick.x} y={27} textAnchor={tick.x < 36 ? 'start' : tick.x > width - 36 ? 'end' : 'middle'}>
                {formatYear(tick.year, reading)}
              </text>
            </g>
          ))}
        </svg>
      ) : null}
    </div>
  );
}
