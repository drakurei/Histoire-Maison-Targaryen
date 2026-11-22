import { useMemo, useState } from 'react';

import { places } from '@/core/content/places';
import type { Place } from '@/core/content/types';
import { formatYear, useLang, useT, useTx, useTypo } from '@/core/i18n';

import { Filtres, useFiltre } from '../components/Filtres';
import { NomEntite } from '../components/NomEntite';
import { Page } from '../components/Page';
import { Titre } from '../components/Titre';
import { Vide } from '../components/Vide';
import { useFasce } from '../state/fasce';
import { registry } from '../state/registry';
import { placeYears } from '../model/relations';
import { useSetYear, useUrlYear, useYear } from '../state/year';

import { placesOfYear, withoutTwins } from './registres/appearances';
import { KINDS, kindKey } from './registres/kinds';
import { boundsAroundPlaces, DEFAULT_BOUNDS, LieuxScene, PHONE_BOUNDS } from './registres/LieuxScene';
import styles from './PlacesPage.module.css';

/** La contrée d'un lieu, pour grouper la liste : la première partie de sa région. */
function regionOf(place: Place, tx: (loc: Place['region']) => string): string {
  return tx(place.region).split(',')[0]?.trim() ?? '';
}

/**
 * Lieux `/lieux` (champ plein, carte persistante, spec §5.12). La carte prend tout le champ,
 * cadrée sur la baie de la Néra, Valyria au bord. La colonne de gauche en est l'équivalent
 * accessible : les lieux de l'année réglée en tête (avec ce qui s'y passe), puis tous les
 * lieux par contrée, filtrables par genre. Survoler un lieu le désigne sur la carte et pose
 * ses années sur la fasce.
 */
export default function PlacesPage() {
  const t = useT();
  const tx = useTx();
  const typo = useTypo();
  const { reading } = useLang();
  const year = useYear();
  const setYear = useSetYear();
  const kinds = useFiltre('genre');
  const [hovered, setHovered] = useState<string | null>(null);

  const ofYear = useMemo(() => (year !== null ? placesOfYear(year) : null), [year]);
  const highlight = useMemo(() => (ofYear ? new Set(ofYear.keys()) : null), [ofYear]);
  const shown = useMemo(() => places.filter((place) => kinds.size === 0 || kinds.has(place.kind)), [kinds]);
  const groups = useMemo(() => {
    const map = new Map<string, Place[]>();
    for (const place of shown) {
      const key = regionOf(place, tx);
      map.set(key, [...(map.get(key) ?? []), place]);
    }
    return [...map];
  }, [shown, tx]);
  // La carte se cadre sur les lieux de l'année une fois l'année posée (au relâcher, jamais pendant le glisser).
  const settled = useUrlYear();
  const framed = useMemo(() => {
    if (settled === null) return null;
    const ids = [...placesOfYear(settled).keys()];
    return boundsAroundPlaces(places.filter((place) => ids.includes(place.id)).map((place) => place.coord));
  }, [settled]);
  const hoveredYears = useMemo(() => (hovered ? placeYears(registry, hovered) : []), [hovered]);
  useFasce(hovered ? { marks: hoveredYears.map((mark) => ({ year: mark, active: mark === year })) } : {}, 'transient');

  const options = KINDS.filter((kind) => places.some((place) => place.kind === kind)).map((kind) => ({
    value: kind,
    label: t(`page.places.kinds.${kindKey(kind)}`),
  }));
  const when = year !== null ? formatYear(year, reading) : '';
  const active = (id: string) => (on: boolean) => setHovered(on ? id : null);

  return (
    <Page partition="champ">
      <LieuxScene
        bounds={framed ?? DEFAULT_BOUNDS}
        phoneBounds={framed ?? PHONE_BOUNDS}
        placeIds={kinds.size > 0 ? shown.map((place) => place.id) : undefined}
        highlightIds={highlight}
        selectedId={hovered}
        mapTitle={t('page.places.map.title')}
      >
        <Titre k="nav.places" className={styles.titre}>
          <p className={styles.chapeau}>{typo(t('page.places.lead'))}</p>
        </Titre>

        <section className={styles.annee} aria-labelledby="lieux-annee" aria-live="polite">
          <h2 id="lieux-annee" className={styles.sousTitre}>
            {year !== null ? t('v2.places.this_year', { year: when }) : t('v2.places.all')}
          </h2>
          {year === null ? (
            <p className={styles.invite}>{t('v2.places.no_year')}</p>
          ) : ofYear && ofYear.size > 0 ? (
            <>
              <p className={styles.compte}>{ofYear.size === 1 ? t('v2.places.lit.one') : t('v2.places.lit.many', { n: ofYear.size })}</p>
              <ul className={styles.allumes} role="list">
                {[...ofYear].map(([placeId, items]) => {
                  const place = places.find((candidate) => candidate.id === placeId);
                  if (!place) return null;
                  return (
                    <li key={placeId} className={styles.allume}>
                      <p className={styles.nom}>
                        <NomEntite kind="place" id={place.id} name={place.name} onActive={active(place.id)} />
                      </p>
                      <ul className={styles.faits} role="list">
                        {withoutTwins(items, tx).map((item) => (
                          <li key={`${item.kind}:${item.id}`}>
                            <NomEntite kind={item.kind} id={item.id} name={item.name} />
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <Vide
              action={
                <button type="button" className={styles.action} onClick={() => setYear(null)}>
                  {t('v2.fasce.all_time')}
                </button>
              }
            >
              {t('v2.places.this_year_none', { year: when })}
            </Vide>
          )}
        </section>

        <section className={styles.tous} aria-labelledby="tous-lieux">
          {year !== null ? (
            <h2 id="tous-lieux" className={styles.sousTitre}>
              {t('v2.places.all')}
            </h2>
          ) : (
            <h2 id="tous-lieux" className={styles.cache}>
              {t('page.places.index.label')}
            </h2>
          )}
          <Filtres param="genre" options={options} count={shown.length} total={places.length} label={t('page.places.filter.kind')} />
          {shown.length === 0 ? (
            <Vide>{t('page.places.empty')}</Vide>
          ) : (
            groups.map(([region, list]) => (
              <div key={region} className={styles.groupe}>
                <h3 className={styles.region}>{region}</h3>
                <ul className={styles.liste} role="list">
                  {list.map((place) => (
                    <li key={place.id} className={styles.lieu} data-allume={highlight?.has(place.id) ? '' : undefined}>
                      <NomEntite kind="place" id={place.id} name={place.name} onActive={active(place.id)} />
                      <span className={styles.genre}>{t(`page.places.kind.${kindKey(place.kind)}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      </LieuxScene>
    </Page>
  );
}
