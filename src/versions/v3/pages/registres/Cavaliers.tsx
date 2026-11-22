import type { Dragon } from '@/core/content/types';
import { Gloss, useT } from '@/core/i18n';
import type { DragonLife } from '@/versions/v2/pages/registres/dragonLife';
import { VieCavaliers } from '@/versions/v2/pages/registres/VieCavaliers';

import styles from './Cavaliers.module.css';

/**
 * Les cavaliers sur la vie du dragon (v3-spec §6.9), sur le champ : la vie agrandie de la V2
 * (`VieCavaliers`), sous son titre ; une phrase quand rien ne la situe dans le temps.
 */
export function Cavaliers({ dragon, life, years }: { dragon: Dragon; life: DragonLife | undefined; years: readonly number[] }) {
  const t = useT();
  return (
    <section className={styles.cavaliers} aria-labelledby={`cavaliers-${dragon.id}`}>
      <h2 id={`cavaliers-${dragon.id}`} className={styles.titre}>
        <Gloss k="page.dragon.riders.heading" classes={{ tr: styles.glose }} />
      </h2>
      {life ? <VieCavaliers dragon={dragon} life={life} years={years} /> : <p className={styles.phrase}>{t('v2.dragon.life_unknown')}</p>}
    </section>
  );
}
