import { getSource } from '@/core/content/sources';
import type { SourceRef } from '@/core/content/types';
import { Gloss, useLang, useT } from '@/core/i18n';

import { Lien } from './Lien';
import styles from './SourcesPied.module.css';

interface SourcesPiedProps {
  sources: readonly SourceRef[];
  className?: string;
}

/**
 * Les sources d'une section, une seule fois, en pied (spec §4) : titre de l'ouvrage en
 * italique (titre français s'il existe), emplacement, lien vers le registre (`/sources#id`).
 */
export function SourcesPied({ sources, className }: SourcesPiedProps) {
  const t = useT();
  const { reading } = useLang();
  if (sources.length === 0) return null;
  return (
    <footer className={`${styles.pied} ${className ?? ''}`}>
      <span className={styles.titre}>
        <Gloss k="label.sources" />
      </span>
      <ul role="list" className={styles.liste}>
        {sources.map((ref, index) => {
          const source = getSource(ref.id);
          const name = source ? (reading === 'fr' && source.titleFr ? source.titleFr : source.title) : null;
          return (
            <li key={`${ref.id}-${index}`}>
              {name ? (
                <Lien to={`/sources#${ref.id}`} className={styles.ouvrage}>
                  <cite>{name}</cite>
                </Lien>
              ) : (
                <span className={styles.inconnue}>{t('page.bati.sources.unlisted')}</span>
              )}
              {ref.locator ? <span className={styles.emplacement}>, {ref.locator}</span> : null}
            </li>
          );
        })}
      </ul>
    </footer>
  );
}
