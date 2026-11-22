import { VLink } from '@/app/version';
import type { LexiconEntry } from '@/core/content/types';
import { useLang, useT, VALYRIAN_TAG } from '@/core/i18n';

import { entryAnchor } from './lexiconTools';
import styles from './LexiconWall.module.css';

interface LexiconWallProps {
  /** Les entrées, déjà triées. */
  entries: readonly LexiconEntry[];
}

/**
 * LexiconWall : le lexique composé comme une page de spécimen d'imprimeur. Toutes les formes
 * à la suite, chacune dans la graisse de son statut (romain, italique, rouge, encre pâle) ;
 * chaque forme mène à sa notice. C'est la figure : on voit d'un coup d'œil ce qui est
 * attesté et ce que la bibliothèque a dû composer.
 */
export function LexiconWall({ entries }: LexiconWallProps) {
  const t = useT();
  const { reading } = useLang();
  return (
    <ul role="list" className={styles.wall} aria-label={t('page.language.wall.label')}>
      {entries.map((entry) => (
        <li key={entry.id} className={styles.item}>
          <VLink
            to={`/langue/lexique#${entryAnchor(entry.id)}`}
            className={styles.form}
            data-status={entry.status}
            lang={VALYRIAN_TAG}
            title={entry[reading]}
          >
            {entry.hv}
          </VLink>
        </li>
      ))}
    </ul>
  );
}
