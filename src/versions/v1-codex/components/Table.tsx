import type { ReactNode } from 'react';

import styles from './Table.module.css';

/** Table : racine du bâti (.v1), la table de basalte la nuit. Grain figé, lumière basse, rien ne bouge. */
export function Table({ children }: { children: ReactNode }) {
  return <div className={`v1 ${styles.table}`}>{children}</div>;
}
