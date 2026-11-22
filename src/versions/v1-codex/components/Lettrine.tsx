import type { ReactNode } from 'react';

import styles from './Lettrine.module.css';

interface LettrineProps {
  children: ReactNode;
  /** Ouverture d'un volume : lettrine d'or sombre au lieu de la rubrique. */
  gilded?: boolean;
  className?: string;
}

/**
 * Lettrine : paragraphe dont la première lettre tombe sur quatre lignes, en Grenze Gotisch,
 * à l'encre rouge (ou dorée à l'ouverture d'un volume). `initial-letter` là où le navigateur
 * le connaît, lettre flottante ailleurs.
 */
export function Lettrine({ children, gilded = false, className }: LettrineProps) {
  return (
    <p className={`${styles.lettrine} ${className ?? ''}`} data-gilded={gilded || undefined}>
      {children}
    </p>
  );
}
