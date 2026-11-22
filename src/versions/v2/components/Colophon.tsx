import { Gloss, useT } from '@/core/i18n';
import { HallmarkJD } from '@/shared/marks/Marks';
import { useSeuil } from '@/shared/seuil/SeuilGate';

import { Lien } from './Lien';
import styles from './Colophon.module.css';

/**
 * Le colophon, au pied de chaque vue, au-dessus de la réserve de la fasce : crédits, mention
 * non officielle, polices, sources et à-propos, « revoir l'ouverture », poinçon du relieur.
 */
export function Colophon() {
  const t = useT();
  const { replay } = useSeuil();

  return (
    <footer className={styles.root}>
      <Lien to="/a-propos#poincon" className={styles.poincon} aria-label={t('page.bati.colophon.hallmark')}>
        <HallmarkJD size="2rem" />
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
    </footer>
  );
}
