import { useContext } from 'react';

import { useT } from '@/core/i18n';

import { useWide } from './hooks';
import { NotesContext } from './notesContext';
import styles from './NoteRef.module.css';

interface NoteRefProps {
  /** Identifiant de la note appelée (MarginNote `id`). */
  target: string;
  n: number;
}

/**
 * NoteRef : l'appel de note, un chiffre en exposant dans le récit. Écran étroit : il déplie
 * ou replie la note sous le passage (`aria-expanded`). Écran large : la note est déjà en
 * marge ; l'appel y porte le focus et la signale un instant.
 */
export function NoteRef({ target, n }: NoteRefProps) {
  const t = useT();
  const wide = useWide();
  const notes = useContext(NotesContext);
  const folds = !wide && notes !== null;

  const onClick = () => {
    if (folds) {
      notes.toggle(target);
      return;
    }
    notes?.flash(target);
    document.getElementById(target)?.focus({ preventScroll: false });
  };

  return (
    <sup className={styles.ref}>
      <button
        type="button"
        className={styles.button}
        aria-controls={target}
        aria-expanded={folds ? notes.isOpen(target) : undefined}
        aria-label={t('page.bati.note.ref', { n })}
        onClick={onClick}
      >
        {n}
      </button>
    </sup>
  );
}
