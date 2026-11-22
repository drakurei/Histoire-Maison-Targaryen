import { useId, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useVersionPath } from '@/app/version';
import { getPerson, sovereigns } from '@/core/content/people';
import { formatSpan, formatYear, useLang, useT } from '@/core/i18n';
import { reignRibbons } from '@/core/timeline';

import { toRoman } from '../../components/numerals';
import { shortName } from '../lineage/model';
import styles from './ReignRibbon.module.css';
import { withBase } from '@/app/paths';

const FROM = 1;
const TO = 300;
const WIDTH = 900;
const PAD = 6;
const ROW = 18;
const ROWS = 4;
const CHAR = 7.3;
const BAND = 30;
const LANE_GAP = 4;
const TICKS = [1, 50, 100, 150, 200, 250, 300];

function x(year: number): number {
  return PAD + ((year - FROM) / (TO - FROM)) * (WIDTH - 2 * PAD);
}

/**
 * Le ruban des règnes, en tête de l'index : chaque souverain occupe la durée de son règne,
 * à l'or sombre, sur trois siècles. Le rang dans la suite est écrit en chiffres gothiques
 * dans la bande quand elle est assez large ; les noms sont rangés au-dessus sur trois lignes,
 * chacun relié par un filet au début de son règne. Chaque bande mène à la fiche.
 */
export function ReignRibbon() {
  const t = useT();
  const { reading } = useLang();
  const path = useVersionPath();
  const navigate = useNavigate();
  const titleId = useId();

  const ribbons = useMemo(() => reignRibbons(sovereigns), []);

  const placed = useMemo(() => {
    const ends = Array.from({ length: ROWS }, () => -Infinity);
    return ribbons.map((ribbon) => {
      const person = getPerson(ribbon.id);
      const label = person ? shortName(person, reading) : ribbon.name[reading];
      const left = x(ribbon.from);
      const length = label.length * CHAR + 8;
      const anchor: 'start' | 'end' = left + length > WIDTH - PAD ? 'end' : 'start';
      const from = anchor === 'start' ? left : left - length;
      let row = ends.findIndex((end) => end < from - 4);
      if (row === -1) row = ends.indexOf(Math.min(...ends));
      ends[row] = from + length;
      return { ribbon, label, row, anchor };
    });
  }, [reading, ribbons]);

  const lanes = Math.max(...ribbons.map((ribbon) => ribbon.lane)) + 1;
  const bandTop = ROWS * ROW + 14;
  const axis = bandTop + lanes * (BAND + LANE_GAP);
  const height = axis + 28;

  return (
    <div className={styles.scroller} role="region" tabIndex={0} aria-label={t('page.people.ribbon.label')}>
      <svg className={styles.svg} viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-labelledby={titleId}>
        <title id={titleId}>{t('page.people.ribbon.label')}</title>
        <line className={styles.axis} x1={PAD} x2={WIDTH - PAD} y1={axis} y2={axis} />
        {TICKS.map((year) => (
          <g key={year}>
            <line className={styles.tick} x1={x(year)} x2={x(year)} y1={axis} y2={axis + 5} />
            <text className={styles.year} x={x(year)} y={axis + 18} textAnchor={year === FROM ? 'start' : year === TO ? 'end' : 'middle'}>
              {formatYear(year, reading)}
            </text>
          </g>
        ))}

        {placed.map(({ ribbon, label, row, anchor }, index) => {
          const x0 = x(ribbon.from);
          const x1 = x(Math.max(ribbon.to, ribbon.from + 0.6));
          const top = bandTop + ribbon.lane * (BAND + LANE_GAP);
          const labelY = 12 + row * ROW;
          const to = `/personnages/${ribbon.id}`;
          const name = `${ribbon.name[reading]}, ${formatSpan(ribbon.from, ribbon.to, reading)}`;
          return (
            <a
              key={ribbon.id}
              href={withBase(path(to))}
              className={styles.reign}
              data-tone={index % 2 === 0 ? 'a' : 'b'}
              data-lane={ribbon.lane}
              aria-label={name}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                navigate(path(to));
              }}
            >
              <title>{name}</title>
              <line className={styles.leader} x1={x0} x2={x0} y1={labelY + 4} y2={top} />
              <text className={styles.label} x={anchor === 'start' ? x0 + 3 : x0 - 3} y={labelY} textAnchor={anchor}>
                {label}
              </text>
              <rect className={styles.band} x={x0} y={top} width={Math.max(2.4, x1 - x0 - 1)} height={BAND} />
              {ribbon.ordinal !== null && x1 - x0 > 19 ? (
                <text className={styles.ordinal} x={(x0 + x1) / 2} y={top + BAND / 2 + 6} textAnchor="middle">
                  {toRoman(ribbon.ordinal)}
                </text>
              ) : null}
            </a>
          );
        })}
      </svg>
    </div>
  );
}
