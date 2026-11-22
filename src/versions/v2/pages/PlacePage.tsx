import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { getPlace } from '@/core/content/places';
import { formatYear, Gloss, useLang, useT, useTx } from '@/core/i18n';

import { Introuvable } from '../components/Introuvable';
import { Lien } from '../components/Lien';
import { NomEntite } from '../components/NomEntite';
import { Page } from '../components/Page';
import { Prose } from '../components/Prose';
import { SourcesPied } from '../components/SourcesPied';
import { Titre } from '../components/Titre';
import { Vide } from '../components/Vide';
import { useFasce } from '../state/fasce';
import { useYear } from '../state/year';

import { placeHistory, placesOfYear, withoutTwins } from './registres/appearances';
import { kindKey } from './registres/kinds';
import { boundsAround, LieuxScene } from './registres/LieuxScene';
import styles from './PlacePage.module.css';

/**
 * Lieu `/lieux/:placeId` (champ plein, carte persistante, spec §5.12). La carte se recadre
 * sur le lieu, à partir du cadre de la vue précédente ; la colonne devient la notice : nom
 * et glose, genre, région, description, ce que la dynastie lui doit, puis ses années, dans
 * l'ordre du temps. Chacune de ces années est une encoche sur la fasce ; celle de l'année
 * réglée passe en braise.
 */
export default function PlacePage() {
  const { placeId = '' } = useParams();
  const place = getPlace(placeId);
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  const year = useYear();

  const history = useMemo(() => (place ? withoutTwins(placeHistory(place.id), tx) : []), [place, tx]);
  const years = useMemo(
    () => [...new Set(history.map((item) => item.year).filter((value): value is number => value !== null))].sort((a, b) => a - b),
    [history],
  );
  const lit = useMemo(() => (year !== null ? new Set(placesOfYear(year).keys()) : null), [year]);
  const bounds = useMemo(() => (place ? boundsAround(place.coord) : boundsAround([500, 700])), [place]);
  useFasce({ marks: years.map((mark) => ({ year: mark, active: mark === year })) });

  if (!place) return <Introuvable />;

  return (
    <Page partition="champ">
      <LieuxScene bounds={bounds} highlightIds={lit} selectedId={place.id} mapTitle={t('page.place.map.title', { name: tx(place.name) })}>
        <Lien to="/lieux" className={styles.retour}>
          {t('page.place.back')}
        </Lien>
        <Titre text={place.name} className={styles.titre}>
          <p className={styles.situation}>
            <span>{t(`page.places.kind.${kindKey(place.kind)}`)}</span>
            <span className={styles.region}>{tx(place.region)}</span>
          </p>
        </Titre>
        <Prose text={place.description} className={styles.prose} />

        <section className={styles.section} aria-labelledby="role">
          <h2 id="role" className={styles.sousTitre}>
            <Gloss k="page.place.role.heading" />
          </h2>
          <Prose text={place.role} className={styles.prose} />
        </section>

        <section className={styles.section} aria-labelledby="annees">
          <h2 id="annees" className={styles.sousTitre}>
            {t('v2.place.years')}
          </h2>
          {history.length === 0 ? (
            <Vide>{t('page.place.nothing')}</Vide>
          ) : (
            <>
              <p className={styles.note}>{t('v2.place.years_note')}</p>
              <ol className={styles.annees} role="list">
                {history.map((item) => (
                  <li key={`${item.kind}:${item.id}`} className={styles.fait} data-maintenant={item.year !== null && item.year === year ? '' : undefined}>
                    <span className={styles.an}>{formatYear(item.year, reading)}</span>
                    <NomEntite kind={item.kind} id={item.id} name={item.name} />
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        <SourcesPied sources={place.sources} />
      </LieuxScene>
    </Page>
  );
}
