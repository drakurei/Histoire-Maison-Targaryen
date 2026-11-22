import { useContext } from 'react';
import type { ReactNode } from 'react';

import styles from './MarginNote.module.css';
import { NotesContext } from './notesContext';

interface MarginNoteProps {
  /** Identifiant unique dans la page, repris par l'appel (`NoteRef target`). */
  id: string;
  /** Numéro de l'appel. */
  n: number;
  children: ReactNode;
}

/**
 * MarginNote : une note de la marge savante. Écran large : toujours visible dans la marge.
 * Écran étroit : repliée, elle se déplie sous le passage quand on touche son appel.
 * À placer dans `notes` d'un Passage.
 */
export function MarginNote({ id, n, children }: MarginNoteProps) {
  const notes = useContext(NotesContext);
  const open = notes ? notes.isOpen(id) : true;
  const flashed = notes?.flashed === id;

  return (
    <div
      id={id}
      className={styles.note}
      tabIndex={-1}
      data-open={open || undefined}
      data-flash={flashed || undefined}
    >
      <span className={styles.number} aria-hidden="true">
        {n}
      </span>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
