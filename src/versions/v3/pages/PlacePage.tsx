import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { VLink } from '@/app/version';
import { getPlace } from '@/core/content/places';
import { formatYear, Gloss, useLang, useT, useTx } from '@/core/i18n';
import { Prose } from '@/versions/v2/components/Prose';
import { SourcesPied } from '@/versions/v2/components/SourcesPied';
import { Vide } from '@/versions/v2/components/Vide';
import { placeHistory, withoutTwins } from '@/versions/v2/pages/registres/appearances';
import { kindKey } from '@/versions/v2/pages/registres/kinds';
import { useYear } from '@/versions/v2/state/year';

import { Nom } from '../components/common/Nom';
import { TitreChamp } from '../components/common/TitreChamp';
import styles from './PlacePage.module.css';

/**
 * La notice d'un lieu (v3-spec §6.12), rendue dans la colonne de la scène que porte
 * `PlacesPage` (pas de `main` propre) : retour à l'index, nom valyrien et glose, genre,
 * région, description, ce que la dynastie lui doit, puis ses années dans l'ordre du temps
 * (celle de l'année réglée en braise ; chacune est aussi une encoche sur la fasce), sources.
 */
export default function PlacePage() {
  const { placeId = '' } = useParams();
  const place = getPlace(placeId);
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  const year = useYear();
  const history = useMemo(() => (place ? withoutTwins(placeHistory(place.id), tx) : []), [place, tx]);

  if (!place) {
    return (
      <>
        <VLink to="/lieux" className={styles.retour}>
          {t('page.place.back')}
        </VLink>
        <TitreChamp k="phrase.not_found" />
        <p className={styles.note}>{t('error.notFound.body')}</p>
      </>
    );
  }

  return (
    <>
      <VLink to="/lieux" className={styles.retour}>
        {t('page.place.back')}
      </VLink>
      <TitreChamp text={place.name}>
        <p className={styles.situation}>
          <span>{t(`page.places.kind.${kindKey(place.kind)}`)}</span>
          <span className={styles.region}>{tx(place.region)}</span>
        </p>
      </TitreChamp>
      <Prose text={place.description} className={styles.prose} />

      <section className={styles.section} aria-labelledby={`role-${place.id}`}>
        <h2 id={`role-${place.id}`} className={styles.sousTitre}>
          <Gloss k="page.place.role.heading" classes={{ tr: styles.glose }} />
        </h2>
        <Prose text={place.role} className={styles.prose} />
      </section>

      <section className={styles.section} aria-labelledby={`annees-${place.id}`}>
        <h2 id={`annees-${place.id}`} className={styles.sousTitre}>
          {t('v2.place.years')}
        </h2>
        {history.length === 0 ? (
          <Vide>{t('page.place.nothing')}</Vide>
        ) : (
          <ol className={styles.annees} role="list">
            {history.map((item) => (
              <li key={`${item.kind}:${item.id}`} className={styles.fait} data-maintenant={item.year !== null && item.year === year ? '' : undefined}>
                <span className={styles.an}>{formatYear(item.year, reading)}</span>
                <Nom kind={item.kind} id={item.id} name={item.name} />
              </li>
            ))}
          </ol>
        )}
      </section>

      <SourcesPied sources={place.sources} />
    </>
  );
}
