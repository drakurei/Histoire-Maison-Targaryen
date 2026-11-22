import { useId, useMemo } from 'react';

import type { Dragon } from '@/core/content/types';
import { formatYear, useLang, useT, useTx } from '@/core/i18n';

import { NomEntite } from '../../components/NomEntite';
import { useElementWidth } from '../../components/useElementWidth';
import { useYear } from '../../state/year';

import type { DragonLife } from './dragonLife';
import styles from './VieCavaliers.module.css';

const LANE = 30;
const BAR = 12;
/** Largeur approchée d'un caractère du nom d'un cavalier, pour ranger les noms sans chevauchement. */
const CHAR = 6.6;

interface Placed {
  key: string;
  personId?: string;
  name: Dragon['riders'][number]['name'];
  from: number;
  to: number;
  inferred: boolean;
  lane: number;
}

/** Années écoulées sans an 0. */
function between(a: number, b: number): number {
  return b - a - (a < 0 && b > 0 ? 1 : 0);
}

/**
 * La vie agrandie d'un dragon (spec §5.10, colonne de droite) : sa vie en sang (hachurée pour
 * le sort inconnu), ses cavaliers en traits clairs nommés au-dessus, chacun dans son couloir,
 * les années de ses événements en encoches dessous, l'année réglée en entaille.
 */
export function VieCavaliers({ dragon, life, years }: { dragon: Dragon; life: DragonLife; years: readonly number[] }) {
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  const year = useYear();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const length = Math.max(1, between(life.from, life.to) + 1);
  const x = (y: number) => (width * between(life.from, y)) / length;

  const riders = useMemo(() => {
    const placed: Placed[] = [];
    const ends: number[] = [];
    dragon.riders.forEach((rider, index) => {
      if (rider.from === undefined && rider.to === undefined) return;
      const from = Math.max(life.from, rider.from ?? life.from);
      const to = Math.min(life.to, rider.to ?? life.sureTo);
      if (to < from) return;
      const start = width > 0 ? (width * between(life.from, from)) / length : 0;
      const labelEnd = start + tx(rider.name).length * CHAR + 10;
      let lane = ends.findIndex((end) => end <= start);
      if (lane === -1) lane = ends.length;
      ends[lane] = Math.max(labelEnd, width > 0 ? (width * (between(life.from, to) + 1)) / length : 0);
      placed.push({ key: `${rider.personId ?? 'r'}-${index}`, personId: rider.personId, name: rider.name, from, to, inferred: rider.from === undefined || rider.to === undefined, lane });
    });
    return placed;
  }, [dragon.riders, life, width, length, tx]);
  const undated = dragon.riders.filter((rider) => rider.from === undefined && rider.to === undefined);
  const lanes = riders.reduce((max, rider) => Math.max(max, rider.lane + 1), 0);
  const barTop = lanes * LANE + 6;
  const height = barTop + BAR + 14;
  const notch = year !== null && year >= life.from && year <= life.to ? x(year) + width / length / 2 : null;

  return (
    <figure className={styles.figure}>
      <div ref={ref} className={styles.trace} style={{ height }}>
        {width > 0 ? (
          <>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
              <defs>
                <pattern id={`${uid}h`} width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width={1.6} height={4} className={styles.hachure} />
                </pattern>
              </defs>
              <rect className={styles.vie} x={0} y={barTop} width={Math.max(2, x(life.sureTo) + width / length)} height={BAR} />
              {life.doubt ? (
                <rect x={x(life.doubt[0])} y={barTop} width={Math.max(2, x(life.doubt[1]) + width / length - x(life.doubt[0]))} height={BAR} fill={`url(#${uid}h)`} />
              ) : null}
              {riders.map((rider) => (
                <line
                  key={rider.key}
                  className={styles.cavalier}
                  data-deduit={rider.inferred ? '' : undefined}
                  x1={x(rider.from) + 0.5}
                  x2={Math.max(x(rider.from) + 2, x(rider.to) + width / length - 1)}
                  y1={rider.lane * LANE + LANE - 4}
                  y2={rider.lane * LANE + LANE - 4}
                />
              ))}
              {years
                .filter((mark) => mark >= life.from && mark <= life.to)
                .map((mark) => (
                  <rect key={mark} className={styles.encoche} x={x(mark) + width / length / 2 - 1} y={barTop + BAR + 3} width={2} height={8} />
                ))}
              {notch !== null ? <rect className={styles.entaille} x={notch - 1.5} y={barTop - 3} width={3} height={BAR + 6} /> : null}
            </svg>
            {riders.map((rider) => (
              <span
                key={rider.key}
                className={styles.nom}
                style={{ left: Math.min(x(rider.from), Math.max(0, width - tx(rider.name).length * CHAR)), top: rider.lane * LANE }}
              >
                {rider.personId ? <NomEntite kind="person" id={rider.personId} name={rider.name} /> : tx(rider.name)}
              </span>
            ))}
          </>
        ) : null}
      </div>
      <figcaption className={styles.legende}>
        <span className={styles.bornes}>
          <span>{formatYear(life.from, reading)}</span>
          <span>{formatYear(life.to, reading)}</span>
        </span>
        {undated.length > 0 ? (
          <span>
            {undated.map((rider, index) => (
              <span key={`${rider.personId ?? index}`}>
                {index > 0 ? ', ' : null}
                {rider.personId ? <NomEntite kind="person" id={rider.personId} name={rider.name} /> : tx(rider.name)}
              </span>
            ))}{' '}
            <span className={styles.cendre}>({t('v2.dragon.rider_undated')})</span>
          </span>
        ) : null}
        {dragon.riders.length === 0 ? <span className={styles.cendre}>{t('page.dragons.riders.none')}</span> : null}
      </figcaption>
    </figure>
  );
}
