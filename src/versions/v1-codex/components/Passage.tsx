import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { NotesContext } from './notesContext';
import type { NotesApi } from './notesContext';
import styles from './Passage.module.css';

interface PassageProps {
  /** Le récit : paragraphes, Prose, avec leurs NoteRef. */
  children: ReactNode;
  /** Les notes de marge (MarginNote) appelées dans ce passage, dans l'ordre. */
  notes?: ReactNode;
  className?: string;
}

const FLASH_MS = 1400;

/**
 * Passage : une rangée du folio qui porte un récit et sa marge savante. Écran large : les
 * notes vivent dans les colonnes 8 à 10, à hauteur du texte. Écran étroit : elles se
 * déplient sous le passage quand on touche leur appel, sans fenêtre modale.
 */
export function Passage({ children, notes, className }: PassageProps) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const [flashed, setFlashed] = useState<string | null>(null);

  useEffect(() => {
    if (!flashed) return;
    const timer = window.setTimeout(() => setFlashed(null), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [flashed]);

  const toggle = useCallback((id: string) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const api = useMemo<NotesApi>(
    () => ({ isOpen: (id) => open.has(id), toggle, flashed, flash: setFlashed }),
    [open, toggle, flashed],
  );

  return (
    <NotesContext value={api}>
      <div className={`${styles.passage} ${className ?? ''}`}>
        <div className={styles.text}>{children}</div>
        {notes ? <div className={styles.margin}>{notes}</div> : null}
      </div>
    </NotesContext>
  );
}
