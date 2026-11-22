import type { ReactNode } from 'react';

import styles from './Vide.module.css';

interface VideProps {
  /** Ce qui s'est passé, déjà traduit : « Aucun dragon ne vole en 200. » */
  children: ReactNode;
  /** Ce qu'on peut faire : un lien ou un bouton (« tout le temps », « tout afficher »). */
  action?: ReactNode;
}

/** Un état vide qui dit ce qui se passe et invite à agir (DESIGN §8). */
export function Vide({ children, action }: VideProps) {
  return (
    <div className={styles.vide} role="status">
      <p className={styles.texte}>{children}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
