import { getDragon } from '@/core/content/dragons';
import type { Dragon } from '@/core/content/types';
import { Gloss, useT, useTx } from '@/core/i18n';
import { DragonFigure } from '@/shared/dragon';

import { NomEntite } from '../../components/NomEntite';

import styles from './DragonsMontes.module.css';

/** Envergure de Balerion dans la colonne, en rem : la mesure commune des silhouettes. */
const BALERION_REM = 9;

/**
 * Les dragons montés (spec §5.9), en petites silhouettes à l'échelle commune : l'envergure
 * relative du registre (Balerion pour mesure), jamais agrandie pour remplir la place.
 */
export function DragonsMontes({ ids }: { ids: readonly string[] }) {
  const t = useT();
  const tx = useTx();
  const dragons = ids.map((id) => getDragon(id)).filter((dragon): dragon is Dragon => dragon !== undefined);
  if (dragons.length === 0) return null;
  return (
    <section className={styles.dragons}>
      <p className={styles.titre}>
        <Gloss k={dragons.length > 1 ? 'page.person.dragons.many' : 'page.person.dragons.one'} classes={{ tr: styles.glose }} />
      </p>
      <ul role="list" className={styles.liste}>
        {dragons.map((dragon) => (
          <li key={dragon.id} className={styles.dragon}>
            <span className={styles.figure} style={{ width: `${Math.max(1.6, dragon.look.span * BALERION_REM)}rem` }}>
              <DragonFigure look={dragon.look} title={tx(dragon.name)} tone="specimen" ground="dark" detail="plain" unattested="bare" />
            </span>
            <NomEntite kind="dragon" id={dragon.id} name={dragon.name} />
          </li>
        ))}
      </ul>
      <p className={styles.echelle}>{t('v2.person.dragons_scale')}</p>
    </section>
  );
}
