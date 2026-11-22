import { useMemo } from 'react';

import { places } from '@/core/content/places';
import type { Place } from '@/core/content/types';
import { formatYear, useLang, useT, useTx, useTypo } from '@/core/i18n';
import { Filtres } from '@/versions/v2/components/Filtres';
import { Vide } from '@/versions/v2/components/Vide';
import { placeYears } from '@/versions/v2/model/relations';
import type { Appearance } from '@/versions/v2/pages/registres/appearances';
import { withoutTwins } from '@/versions/v2/pages/registres/appearances';
import { KINDS, kindKey } from '@/versions/v2/pages/registres/kinds';
import { useFasce } from '@/versions/v2/state/fasce';
import { registry } from '@/versions/v2/state/registry';
import { useSetYear, useYear } from '@/versions/v2/state/year';

import { Nom } from '../../components/common/Nom';
import { TitreChamp } from '../../components/common/TitreChamp';
import styles from './ListeLieux.module.css';

/** La contrée d'un lieu, pour grouper la liste : la première partie de sa région. */
function regionOf(place: Place, tx: (loc: Place['region']) => string): string {
  return tx(place.region).split(',')[0]?.trim() ?? '';
}

interface ListeLieuxProps {
  shown: readonly Place[];
  ofYear: Map<string, Appearance[]> | null;
  highlight: ReadonlySet<string> | null;
  survol: string | null;
  onSurvol: (id: string | null) => void;
}

/**
 * L'index des lieux, dans la colonne de la scène (v3-spec §6.12) : le titre, les lieux de
 * l'année réglée et ce qui s'y passe, puis tous les lieux par contrée, filtrables par genre.
 * Survoler un lieu le désigne sur la carte et pose ses années sur la fasce.
 */
export function ListeLieux({ shown, ofYear, highlight, survol, onSurvol }: ListeLieuxProps) {
  const t = useT();
  const tx = useTx();
  const typo = useTypo();
  const { reading } = useLang();
  const year = useYear();
  const setYear = useSetYear();

  const groups = useMemo(() => {
    const map = new Map<string, Place[]>();
    for (const place of shown) {
      const key = regionOf(place, tx);
      map.set(key, [...(map.get(key) ?? []), place]);
    }
    return [...map];
  }, [shown, tx]);
  const hoveredYears = useMemo(() => (survol ? placeYears(registry, survol) : []), [survol]);
  useFasce(survol ? { marks: hoveredYears.map((mark) => ({ year: mark, active: mark === year })) } : {}, 'transient');

  const options = KINDS.filter((kind) => places.some((place) => place.kind === kind)).map((kind) => ({
    value: kind,
    label: t(`page.places.kinds.${kindKey(kind)}`),
  }));
  const when = year !== null ? formatYear(year, reading) : '';
  const active = (id: string) => (on: boolean) => onSurvol(on ? id : null);

  return (
    <>
      <TitreChamp k="nav.places" className={styles.titre}>
        <p className={styles.chapeau}>{typo(t('page.places.lead'))}</p>
      </TitreChamp>

      <section className={styles.bloc} aria-labelledby="lieux-annee" aria-live="polite">
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
                      <Nom kind="place" id={place.id} name={place.name} onActive={active(place.id)} />
                    </p>
                    <ul className={styles.faits} role="list">
                      {withoutTwins(items, tx).map((item) => (
                        <li key={`${item.kind}:${item.id}`}>
                          <Nom kind={item.kind} id={item.id} name={item.name} />
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

      <section className={styles.bloc} aria-labelledby="tous-lieux">
        {year !== null ? (
          <h2 id="tous-lieux" className={styles.sousTitre}>
            {t('v2.places.all')}
          </h2>
        ) : (
          <h2 id="tous-lieux" className="sr-only">
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
                    <Nom kind="place" id={place.id} name={place.name} onActive={active(place.id)} />
                    <span className={styles.genre}>{t(`page.places.kind.${kindKey(place.kind)}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </>
  );
}
