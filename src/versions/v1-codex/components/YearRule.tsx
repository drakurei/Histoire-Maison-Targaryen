import { useMemo, useRef } from 'react';

import { formatYear, useLang, useT } from '@/core/i18n';
import { createTimeScale, timeTicks, timeZones, yearToX } from '@/core/timeline';
import type { TimeScale, TimeZoneId } from '@/core/timeline';

import { useElementWidth } from './hooks';
import styles from './YearRule.module.css';

/** Repère posé sur la règle : une encoche et, s'il y a lieu, un mot au-dessus. */
export interface YearMark {
  year: number;
  /** Texte déjà traduit. */
  label?: string;
  /** Encoche rouge et plus haute : le repère qui compte. */
  strong?: boolean;
}

/** Durée tracée en bande épaisse sur la règle (règne, guerre, vie). */
export interface YearSpan {
  from: number;
  to: number;
  /** `or` : règne ; `rubrique` : guerre ou période en cours ; `encre` : le reste. */
  tone?: 'or' | 'rubrique' | 'encre';
  /** Texte déjà traduit, donné en infobulle. */
  label?: string;
}

interface YearRuleProps {
  from: number;
  to: number;
  marks?: readonly YearMark[];
  spans?: readonly YearSpan[];
  /** Nom accessible ; par défaut « Règle du temps, de … à … ». */
  label?: string;
  className?: string;
}

const NO_MARKS: readonly YearMark[] = [];
const NO_SPANS: readonly YearSpan[] = [];
const PAD = 10;
const ROW = 16;
const LABEL_GAP = 90;
const MINOR_GAP = 14;
const CHAR = 6.4;
const ZONE_KEYS: Record<TimeZoneId, string> = {
  legend: 'page.bati.time.zone.legend',
  approach: 'page.bati.time.zone.approach',
  dynasty: 'page.bati.time.zone.dynasty',
};

interface PlacedMark extends YearMark {
  x: number;
  row: number;
  anchor: 'start' | 'end';
}

/** Range les libellés des repères sur deux lignes au plus, sans chevauchement quand c'est possible. */
function placeMarks(scale: TimeScale, marks: readonly YearMark[], width: number): PlacedMark[] {
  const ends = [-Infinity, -Infinity];
  return [...marks]
    .sort((a, b) => a.year - b.year)
    .map((mark) => {
      const x = yearToX(scale, mark.year);
      const length = (mark.label?.length ?? 0) * CHAR + 6;
      const anchor = x + length > width - PAD ? 'end' : 'start';
      const left = anchor === 'start' ? x : x - length;
      let row = ends.findIndex((end) => end < left - 4);
      if (row === -1) row = (ends[0] ?? 0) <= (ends[1] ?? 0) ? 0 : 1;
      ends[row] = left + length;
      return { ...mark, x, row, anchor };
    });
}

/**
 * YearRule : la règle du temps tracée à l'encre. Graduations de l'échelle commune
 * (@/core/timeline : temps légendaire resserré, approche, dynastie), repères, durées.
 * S'adapte à la largeur de son conteneur ; lisible sur le vélin comme sur la pierre.
 */
export function YearRule({ from, to, marks = NO_MARKS, spans = NO_SPANS, label, className }: YearRuleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  const t = useT();
  const { reading } = useLang();

  const drawing = useMemo(() => {
    if (width < 80) return null;
    const scale = createTimeScale({ domain: [from, to], range: [PAD, width - PAD] });
    const placed = placeMarks(scale, marks, width);
    const rows = placed.some((mark) => mark.label) ? Math.max(...placed.map((mark) => mark.row)) + 1 : 0;
    const base = 8 + rows * ROW + 10;
    const zones = timeZones(scale);
    return {
      scale,
      placed,
      base,
      zones,
      labelled: timeTicks(scale, { minGap: LABEL_GAP }),
      minor: timeTicks(scale, { minGap: MINOR_GAP }),
      height: base + 30 + (zones.length > 1 ? ROW + 4 : 0),
    };
  }, [width, from, to, marks]);

  const name = label ?? t('page.bati.time.label', { from: formatYear(from, reading), to: formatYear(to, reading) });

  return (
    <div ref={ref} className={`${styles.rule} ${className ?? ''}`}>
      {drawing ? (
        <svg width={width} height={drawing.height} viewBox={`0 0 ${width} ${drawing.height}`} role="img" aria-label={name}>
          {drawing.zones.map((zone) => (
            <line
              key={zone.id}
              className={styles.line}
              data-zone={zone.id}
              x1={zone.x0}
              x2={zone.x1}
              y1={drawing.base}
              y2={drawing.base}
            />
          ))}

          {spans.map((span, index) => {
            const x0 = yearToX(drawing.scale, span.from);
            const x1 = yearToX(drawing.scale, span.to);
            return (
              <rect
                key={`${span.from}-${span.to}-${index}`}
                className={styles.span}
                data-tone={span.tone ?? 'encre'}
                x={Math.min(x0, x1)}
                y={drawing.base - 3}
                width={Math.max(2, Math.abs(x1 - x0))}
                height={6}
              >
                {span.label ? <title>{span.label}</title> : null}
              </rect>
            );
          })}

          {drawing.minor.map((tick) => (
            <line key={`m${tick.year}`} className={styles.minor} x1={tick.x} x2={tick.x} y1={drawing.base} y2={drawing.base + 4} />
          ))}
          {drawing.labelled.map((tick) => (
            <g key={`t${tick.year}`}>
              <line className={styles.major} x1={tick.x} x2={tick.x} y1={drawing.base} y2={drawing.base + 9} />
              <text className={styles.year} x={tick.x} y={drawing.base + 23} textAnchor={tickAnchor(tick.x, width)}>
                {formatYear(tick.year, reading)}
              </text>
            </g>
          ))}

          {drawing.placed.map((mark, index) => {
            const top = 8 + mark.row * ROW;
            return (
              // Deux repères sans libellé peuvent tomber la même année : l'indice les distingue.
              <g key={`k${mark.year}-${mark.label ?? ''}-${index}`}className={styles.mark} data-strong={mark.strong || undefined}>
                <line x1={mark.x} x2={mark.x} y1={mark.label ? top + 3 : drawing.base - 9} y2={drawing.base} />
                {mark.label ? (
                  <text x={mark.anchor === 'start' ? mark.x + 4 : mark.x - 4} y={top + 9} textAnchor={mark.anchor}>
                    {mark.label}
                  </text>
                ) : null}
              </g>
            );
          })}

          {drawing.zones.length > 1
            ? drawing.zones.map((zone) => (
                <text key={`z${zone.id}`} className={styles.zone} x={zone.x0 + 2} y={drawing.height - 6}>
                  {t(ZONE_KEYS[zone.id])}
                </text>
              ))
            : null}
        </svg>
      ) : null}
    </div>
  );
}

function tickAnchor(x: number, width: number): 'start' | 'middle' | 'end' {
  if (x < 36) return 'start';
  if (x > width - 36) return 'end';
  return 'middle';
}
