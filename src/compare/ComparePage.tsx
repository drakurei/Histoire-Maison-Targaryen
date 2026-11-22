import { Link } from 'react-router-dom';

import { MAIN_ID } from '@/app/a11y';
import { UI } from '@/app/uiKeys';
import { VERSION_IDS, versionNumber, versionPath } from '@/app/version';
import { Gloss } from '@/core/i18n';

import styles from './ComparePage.module.css';

const glossClasses = { main: styles.primary, tr: styles.translation };

/**
 * Espace de comparaison : une entrée par version, dans l'ordre de leur numéro.
 * Structure minimale, appelée à être redessinée ; les textes viennent des chaînes d'interface.
 */
export default function ComparePage() {
  return (
    <main id={MAIN_ID} className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>
          <Gloss k={UI.compareTitle} classes={glossClasses} />
        </h1>
        <p className={styles.intro}>
          <Gloss k={UI.compareIntro} classes={glossClasses} />
        </p>
      </header>

      {/* Liste ordonnée : le chiffre affiché est celui que la liste annonce déjà. */}
      <ol className={styles.versions} role="list">
        {VERSION_IDS.map((id) => (
          <li key={id} className={styles.version}>
            <span className={styles.numeral} aria-hidden="true">
              {versionNumber(id)}
            </span>
            <Link className={styles.link} to={versionPath(id, '/')}>
              <Gloss k={UI.versionName[id]} classes={glossClasses} />
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
