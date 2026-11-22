import { Gloss, useT } from '@/core/i18n';
import { HallmarkJD } from '@/shared/marks/Marks';
import { useSeuil } from '@/shared/seuil/SeuilGate';
import { Lien } from '@/versions/v2/components/Lien';

import styles from './Colophon3.module.css';

/**
 * Le colophon de la V3, au pied de chaque vue, au-dessus de la réserve de la fasce : le
 * poinçon du relieur (JD, lien vers sa place dans l'à-propos), les crédits, la mention non
 * officielle, les polices, puis les sources, l'à-propos et « revoir l'ouverture ».
 */
export function Colophon3() {
  const t = useT();
  const { replay } = useSeuil();

  return (
    <div className={styles.root}>
      <Lien to="/a-propos#poincon" className={styles.poincon} aria-label={t('page.bati.colophon.hallmark')}>
        <HallmarkJD size="2.5rem" />
      </Lien>
      <div className={styles.texte}>
        <p>{t('page.bati.colophon.credits')}</p>
        <p>{t('page.bati.colophon.unofficial')}</p>
        <p>{t('page.bati.colophon.type')}</p>
      </div>
      <ul role="list" className={styles.liens}>
        <li>
          <Lien to="/sources" className={styles.lien}>
            <Gloss k="nav.sources" />
          </Lien>
        </li>
        <li>
          <Lien to="/a-propos" className={styles.lien}>
            <Gloss k="nav.about" />
          </Lien>
        </li>
        <li>
          <button type="button" className={styles.lien} onClick={replay}>
            {t('seuil.replay')}
          </button>
        </li>
      </ul>
    </div>
  );
}
