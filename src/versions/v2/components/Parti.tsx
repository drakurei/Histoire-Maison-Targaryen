import type { ReactNode } from 'react';

import styles from './Parti.module.css';

interface PartiProps {
  /** En-tête de la vue (titre, années, chapeau). */
  entete: ReactNode;
  /** Le texte qui se lit : sept colonnes. */
  recit: ReactNode;
  /** Ce dont il parle dans le temps et l'espace : colonnes 9 à 12, collantes (`TempsEspace` ou une figure). */
  temps: ReactNode;
}

/**
 * Le parti (spec §2.4) : le récit d'un côté, le temps et l'espace de l'autre. Au téléphone,
 * une colonne : l'en-tête, la figure, puis le récit.
 */
export function Parti({ entete, recit, temps }: PartiProps) {
  return (
    <div className={styles.parti}>
      <div className={styles.entete}>{entete}</div>
      <aside className={styles.temps}>{temps}</aside>
      <div className={styles.recit}>{recit}</div>
    </div>
  );
}
