import { useMemo } from 'react';

import type { Dragon } from '@/core/content/types';
import { useT } from '@/core/i18n';
import { Carte } from '@/versions/v2/components/Carte';
import { dragonPlaces } from '@/versions/v2/pages/registres/appearances';

import styles from './LieuxDuDragon.module.css';

/**
 * Les lieux où paraît un dragon (v3-spec §6.9) : une petite carte où chaque lieu porte son
 * numéro dans l'ordre du temps, et la légende qui dit que ce n'est pas un vol.
 */
export function LieuxDuDragon({ dragon, name }: { dragon: Dragon; name: string }) {
  const t = useT();
  const places = useMemo(() => dragonPlaces(dragon), [dragon]);
  const marks = useMemo(() => new Map(places.map((place) => [place.placeId, String(place.order)])), [places]);

  return (
    <section className={styles.lieux} aria-labelledby={`lieux-${dragon.id}`}>
      <h2 id={`lieux-${dragon.id}`} className={styles.titre}>
        {t('v3.registres.planche.lieux')}
      </h2>
      {places.length === 0 ? (
        <p className={styles.legende}>{t('v2.dragon.places_none')}</p>
      ) : (
        <>
          <div className={styles.carte}>
            <Carte title={t('v2.dragon.places_map', { name })} placeIds={places.map((place) => place.placeId)} marks={marks} />
          </div>
          <p className={styles.legende}>{t('v3.registres.planche.lieux_note')}</p>
        </>
      )}
    </section>
  );
}
