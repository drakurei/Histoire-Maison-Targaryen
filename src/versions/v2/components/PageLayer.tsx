import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import styles from './PageLayer.module.css';

/** Les vues qui partagent une figure persistante (la carte des lieux) gardent la même couche. */
function layerKey(pathname: string): string {
  const match = /^\/version-\d(\/lieux)(?:\/|$)/.exec(pathname);
  return match ? 'lieux' : pathname;
}

/**
 * La couche de la vue (spec §2.5) : un fondu de 160 ms entre deux vues, rien d'autre. La
 * fasce, le cartel et le feu sont hors de cette couche : ils ne se démontent jamais. Un
 * changement de paramètres seul (`?an=`, `?voir=`) ne rejoue rien.
 */
export function PageLayer({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={layerKey(pathname)} className={styles.layer} data-fondu="">
      {children}
    </div>
  );
}
