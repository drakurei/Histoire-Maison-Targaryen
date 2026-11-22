import type { ReactNode } from 'react';

import { MAIN_ID } from '@/app/a11y';

import styles from './Page.module.css';

/** Les quatre partitions héraldiques (spec §2.4). Aucune vue n'en invente une cinquième. */
export type Partition = 'parti' | 'pal' | 'fasce' | 'champ';

interface PageProps {
  /** Partition de la vue : sa raison est toujours une donnée. */
  partition: Partition;
  children: ReactNode;
  className?: string;
  /** `introuvable` pour la page introuvable (audit des liens). */
  ecran?: 'introuvable';
}

/**
 * Le `main` d'une vue : un seul par vue, cible du lien d'évitement et du focus après une
 * navigation (`MAIN_ID`). Pose les marges de page de DESIGN §6 et la grille de 12 colonnes.
 */
export function Page({ partition, children, className, ecran }: PageProps) {
  return (
    <main id={MAIN_ID} className={`${styles.page} ${className ?? ''}`} data-partition={partition} data-ecran={ecran}>
      {children}
    </main>
  );
}
