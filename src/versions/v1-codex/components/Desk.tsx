import { Suspense } from 'react';
import type { ReactNode } from 'react';

import { Colophon } from './Colophon';
import styles from './Desk.module.css';
import { PageTurn } from './PageTurn';

/**
 * Desk : la place de la feuille sur la table, à droite du rayon des volumes. La vue
 * (qui rend son <main> et son Folio) y arrive par PageTurn ; le colophon la suit.
 */
export function Desk({ children }: { children: ReactNode }) {
  return (
    <div className={styles.desk}>
      <PageTurn>
        <Suspense fallback={<div className={styles.pending} />}>{children}</Suspense>
      </PageTurn>
      <Colophon />
    </div>
  );
}
