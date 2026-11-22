import { VLink } from '@/app/version';
import { Gloss, useT } from '@/core/i18n';
import { HallmarkJD } from '@/shared/marks/Marks';
import { useSeuil } from '@/shared/seuil/SeuilGate';

import styles from './Colophon.module.css';

/**
 * Colophon : le pied de la bibliothèque, feuillet de garde glissé sous le folio. Sources et
 * à-propos, crédits, mention non officielle, « revoir l'ouverture », poinçon du relieur.
 */
export function Colophon() {
  const t = useT();
  const { replay } = useSeuil();

  return (
    <footer className={styles.colophon} data-surface="velin">
      <HallmarkJD className={styles.hallmark} size="2.25rem" title={t('page.bati.colophon.hallmark')} />
      <div className={styles.text}>
        <p className={styles.credits}>{t('page.bati.colophon.credits')}</p>
        <p>{t('page.bati.colophon.unofficial')}</p>
        <p className={styles.type}>{t('page.bati.colophon.type')}</p>
      </div>
      <ul role="list" className={styles.links}>
        <li>
          <VLink to="/sources" className={styles.link}>
            <Gloss k="nav.sources" />
          </VLink>
        </li>
        <li>
          <VLink to="/a-propos" className={styles.link}>
            <Gloss k="nav.about" />
          </VLink>
        </li>
        <li>
          <button type="button" className={`${styles.link} ${styles.plain}`} onClick={replay}>
            {t('seuil.replay')}
          </button>
        </li>
      </ul>
    </footer>
  );
}
