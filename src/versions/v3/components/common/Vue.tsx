import type { ReactNode } from 'react';

import { MAIN_ID } from '@/app/a11y';

import styles from './Vue.module.css';

/** Les quatre partitions héraldiques (v3-spec §6). Aucune vue n'en invente une cinquième. */
export type Partition = 'parti' | 'pal' | 'fasce' | 'champ';

interface VueProps {
  partition: Partition;
  children: ReactNode;
  className?: string;
  /** `introuvable` pour la page introuvable (audit des liens). */
  ecran?: 'introuvable';
}

/**
 * Le `main` d'une vue de la V3 : un seul par vue, cible du lien d'évitement et du focus
 * après une navigation (`MAIN_ID`). Marges de page de DESIGN §6, grille de 12 colonnes.
 */
export function Vue({ partition, children, className, ecran }: VueProps) {
  return (
    <main id={MAIN_ID} className={`${styles.vue} ${className ?? ''}`} data-partition={partition} data-ecran={ecran}>
      {children}
    </main>
  );
}
