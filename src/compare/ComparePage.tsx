import { Link } from 'react-router-dom';

import { MAIN_ID } from '@/app/a11y';
import { DEFAULT_VERSION } from '@/app/routes';
import { UI } from '@/app/uiKeys';
import { VERSION_IDS, versionNumber, versionPath } from '@/app/version';
import { Gloss, useT, useTypo } from '@/core/i18n';

import styles from './ComparePage.module.css';

const glossClasses = { main: styles.primary, tr: styles.translation };

/**
 * Espace de comparaison (/comparer) : les trois versions côte à côte, dans l'ordre de leur
 * numéro. Pour chacune, son nom (le lien qui l'ouvre) et ce qu'elle est en deux ou trois
 * phrases ; la version ouverte à la racine le dit en toutes lettres. Ni cadre ni fond : trois
 * colonnes de la grille, séparées par le blanc. Au téléphone, l'une sous l'autre.
 */
export default function ComparePage() {
  const t = useT();
  const typo = useTypo();

  return (
    <main id={MAIN_ID} className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>
          <Gloss k={UI.compareTitle} classes={glossClasses} />
        </h1>
        <p className={styles.intro}>{typo(t(UI.compareIntro))}</p>
      </header>

      {/* Liste ordonnée : le chiffre affiché est celui que la liste annonce déjà. */}
      <ol className={styles.versions} role="list">
        {VERSION_IDS.map((id) => {
          const isDefault = id === DEFAULT_VERSION;
          return (
            <li key={id} className={styles.version} data-defaut={isDefault || undefined}>
              <span className={styles.numeral} aria-hidden="true">
                {versionNumber(id)}
              </span>
              <h2 className={styles.name}>
                <Link className={styles.link} to={versionPath(id, '/')}>
                  <Gloss k={UI.versionName[id]} classes={glossClasses} />
                </Link>
              </h2>
              <p className={styles.what}>{typo(t(UI.versionWhat[id]))}</p>
              {isDefault ? <p className={styles.defaut}>{typo(t(UI.compareDefault))}</p> : null}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
