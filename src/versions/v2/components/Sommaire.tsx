import styles from './Sommaire.module.css';

export interface SommaireEntry {
  /** Identifiant de l'ancre dans la vue. */
  id: string;
  label: string;
}

interface SommaireProps {
  entries: readonly SommaireEntry[];
  /** Nom accessible du sommaire, déjà traduit. */
  label: string;
  className?: string;
}

/** Sommaire numéroté d'une vue longue (spec §4) : une vraie suite, des liens d'ancre. */
export function Sommaire({ entries, label, className }: SommaireProps) {
  if (entries.length === 0) return null;
  return (
    <nav className={`${styles.sommaire} ${className ?? ''}`} aria-label={label}>
      <ol role="list" className={styles.liste}>
        {entries.map((entry, index) => (
          <li key={entry.id} className={styles.entree}>
            <span className={styles.numero} aria-hidden="true">
              {index + 1}
            </span>
            <a href={`#${entry.id}`} className={styles.lien}>
              {entry.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
