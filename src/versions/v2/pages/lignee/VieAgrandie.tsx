import { useMemo } from 'react';

import type { Person } from '@/core/content/types';
import { formatYear, useLang, useT, useTitle } from '@/core/i18n';
import { createTimeScale, lifeSpans, yearToX } from '@/core/timeline';

import { Profil } from '../../components/Profil';
import { useElementWidth } from '../../components/useElementWidth';

import { sovereignById } from './donnees';
import { useEtatAnnee } from './useEtatAnnee';
import styles from './VieAgrandie.module.css';

interface VieAgrandieProps {
  person: Person;
  /** Années des événements où la personne paraît : encoches au-dessus de la vie. */
  eventYears: readonly number[];
  year: number | null;
  height: number;
}

const SKY = 34;

/**
 * La vie agrandie (spec §5.9) : le segment de la fasce qui couvre la vie, agrandi, la vie en
 * sang et le reste en cramoisi (les dragons vivants de ces années-là), et au-dessus, le trait
 * de la vie (plein pour le sûr, pointillé pour l'ouvert), le règne en or, les événements en
 * encoches, l'année réglée en braise. Posée en bas de la colonne, soudée à la fasce.
 */
export function VieAgrandie({ person, eventYears, year, height }: VieAgrandieProps) {
  const t = useT();
  const title = useTitle();
  const { reading } = useLang();
  const etat = useEtatAnnee()(person, year);
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const span = useMemo(() => lifeSpans([person]).spans[0] ?? null, [person]);
  const sovereign = sovereignById.get(person.id);

  if (!span) return <p className={styles.inconnue}>{t('v2.person.life_unknown')}</p>;

  const [a, b] = span.extent;
  const pad = Math.max(4, Math.round((b - a) * 0.12));
  let from = a - pad;
  let to = b + pad;
  if (from <= 0 && a > 0) from = 1;
  if (to === 0) to = 1;
  const scale = createTimeScale({ domain: [from, to], range: [0, Math.max(1, width)] });
  const x = (value: number) => yearToX(scale, value);
  const mass = height - SKY;
  const inside = year !== null && year >= from && year <= to;
  const reign: readonly [number, number] | null = sovereign ? [sovereign.reignFrom, sovereign.reignTo] : span.reign;
  const claim = person.pretender && !sovereign ? person.pretender : null;

  return (
    <figure className={styles.vie} aria-label={t('page.person.life.label', { name: title(person.name).primary })}>
      <figcaption className={styles.legende}>
        <span>
          {t('page.person.rule.born')} <span className={styles.chiffre}>{formatYear(span.born.year ?? span.born.latest ?? span.born.earliest, reading)}</span>
        </span>
        {year !== null ? <span className={styles.etat}>{t('v2.person.at_year', { year: formatYear(year, reading), state: etat.texte })}</span> : null}
        <span>
          {span.alive ? t(`page.person.alive.${person.sex}`) : t('page.person.rule.died')}{' '}
          {span.alive ? null : <span className={styles.chiffre}>{formatYear(span.died.year ?? span.died.earliest ?? span.died.latest, reading)}</span>}
        </span>
      </figcaption>
      <div ref={ref} className={styles.dessin} style={{ height }}>
        {width > 0 ? (
          <>
            <div className={styles.masse} aria-hidden="true">
              <Profil from={from} to={to} width={width} height={mass} full={mass} span={[a, b]} />
            </div>
            <svg className={styles.ciel} width={width} height={height} aria-hidden="true" focusable="false">
              <line className={styles.ouvert} x1={x(a)} x2={x(b)} y1={SKY - 8} y2={SKY - 8} />
              {span.sure ? <line className={styles.sur} x1={x(span.sure[0])} x2={Math.max(x(span.sure[1]), x(span.sure[0]) + 3)} y1={SKY - 8} y2={SKY - 8} /> : null}
              {reign ? <rect className={styles.regne} x={x(reign[0])} y={SKY - 16} width={Math.max(3, x(reign[1]) - x(reign[0]))} height={5} /> : null}
              {claim ? (
                <rect className={styles.pretention} x={x(claim.from)} y={SKY - 15.5} width={Math.max(3, x(claim.to ?? 300) - x(claim.from))} height={4} />
              ) : null}
              {eventYears.map((value) => (
                <rect key={value} className={styles.encoche} x={x(value) - 1} y={2} width={2} height={8} />
              ))}
              {inside && year !== null ? <rect className={styles.annee} x={x(year) - 1.5} y={0} width={3} height={height} /> : null}
            </svg>
          </>
        ) : null}
      </div>
    </figure>
  );
}
