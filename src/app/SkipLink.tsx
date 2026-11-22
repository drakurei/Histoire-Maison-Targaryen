import type { MouseEvent } from 'react';

import { Gloss } from '@/core/i18n';

import { focusMain, MAIN_ID } from './a11y';
import styles from './SkipLink.module.css';
import { UI } from './uiKeys';

/**
 * Premier élément focalisable de la page : mène droit au contenu principal.
 * Le clic est pris en charge ici plutôt que par l'ancre, pour que l'adresse ne change
 * pas et que le routeur n'y voie pas une navigation.
 */
export function SkipLink() {
  const goToMain = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (focusMain()) {
      document.getElementById(MAIN_ID)?.scrollIntoView({ block: 'start' });
    }
  };

  return (
    <a className={styles.skip} href={`#${MAIN_ID}`} onClick={goToMain}>
      <Gloss k={UI.skipToContent} classes={{ root: styles.label, tr: styles.translation }} />
    </a>
  );
}
