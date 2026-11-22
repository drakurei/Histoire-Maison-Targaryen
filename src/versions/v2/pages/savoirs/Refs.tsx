import { Gloss } from '@/core/i18n';

import { refLabel } from './glose';
import styles from './Refs.module.css';

interface RefsProps {
  refs: readonly string[];
  /** Clé du titre ; par défaut « Références ». */
  k?: string;
  className?: string;
}

/**
 * Les références d'une forme, d'une formule ou d'une leçon : pages publiées en ligne (le wiki
 * qui recense les publications de Peterson, son blogue). Titre lisible, puis le site.
 */
export function Refs({ refs, k = 'page.lexicon.entry.refs', className }: RefsProps) {
  if (refs.length === 0) return null;
  return (
    <div className={`${styles.refs} ${className ?? ''}`}>
      <span className={styles.titre}>
        <Gloss k={k} />
      </span>
      <ul role="list" className={styles.liste}>
        {refs.map((ref) => {
          const { titre, site } = refLabel(ref);
          const isUrl = site !== '';
          return (
            <li key={ref}>
              {isUrl ? (
                <a href={ref} rel="noreferrer noopener" target="_blank" className={styles.lien}>
                  <cite>{titre}</cite>
                </a>
              ) : (
                <cite>{titre}</cite>
              )}
              {isUrl && site !== titre && !titre.startsWith(site) ? <span className={styles.site}>{site}</span> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
