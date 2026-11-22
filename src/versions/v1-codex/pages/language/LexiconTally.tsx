import type { LexiconEntry } from '@/core/content/types';

import styles from './LexiconTally.module.css';
import { StatusGlyph } from './StatusMark';

interface LexiconTallyProps {
  /** Tout le lexique, dans l'ordre des statuts. */
  entries: readonly LexiconEntry[];
  /** Identifiants retenus par les filtres. */
  shown: ReadonlySet<string>;
}

/**
 * LexiconTally : le lexique en marques, un carré par forme, rangé par statut. Les formes
 * que les filtres écartent pâlissent : la figure suit la recherche. Décorative pour le
 * lecteur d'écran, qui reçoit le même compte du bandeau de filtres.
 */
export function LexiconTally({ entries, shown }: LexiconTallyProps) {
  return (
    <div className={styles.tally} aria-hidden="true">
      {entries.map((entry) => (
        <span key={entry.id} className={styles.cell} data-status={entry.status} data-off={!shown.has(entry.id) || undefined}>
          <StatusGlyph status={entry.status} size="0.95rem" />
        </span>
      ))}
    </div>
  );
}
