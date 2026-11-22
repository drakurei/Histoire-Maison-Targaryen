import { Gloss } from '@/core/i18n';

import styles from './RouteFallback.module.css';
import { UI } from './uiKeys';

/** Ce que l'on voit pendant qu'une version ou l'espace de comparaison se charge. */
export function RouteFallback() {
  return (
    <div className={styles.wait} role="status">
      <p className={styles.mention}>
        <Gloss k={UI.loading} classes={{ tr: styles.translation }} />
      </p>
    </div>
  );
}
