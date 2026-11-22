import { useCallback, useId, useState } from 'react';
import type { ReactNode } from 'react';

import { useT } from '@/core/i18n';

import styles from './Notes.module.css';

/**
 * Notes dépliables (spec §4) : un appel numéroté dans le paragraphe, la note qui se déplie
 * sous lui, sur tous les écrans. Pas de marge savante (c'est la V1), pas de fenêtre.
 *
 *   const notes = useNotes();
 *   <p>… le serment de 105<NoteRef {...notes.ref(1)} /> …</p>
 *   <Note {...notes.note(1)}>Texte de la note.</Note>
 */
export function useNotes() {
  const base = useId();
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());
  const toggle = useCallback((n: number) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }, []);
  return {
    ref: (n: number) => ({ n, id: `${base}-n${n}`, open: open.has(n), onToggle: () => toggle(n) }),
    note: (n: number) => ({ n, id: `${base}-n${n}`, open: open.has(n) }),
  };
}

interface NoteRefProps {
  n: number;
  id: string;
  open: boolean;
  onToggle: () => void;
}

/** L'appel : un chiffre en exposant, cible de 44 px, qui déplie ou replie sa note. */
export function NoteRef({ n, id, open, onToggle }: NoteRefProps) {
  const t = useT();
  return (
    <button
      type="button"
      className={styles.appel}
      aria-expanded={open}
      aria-controls={id}
      aria-label={t('page.bati.note.ref', { n })}
      onClick={onToggle}
    >
      <sup>{n}</sup>
    </button>
  );
}

interface NoteProps {
  n: number;
  id: string;
  open: boolean;
  children: ReactNode;
}

/** La note dépliée sous son paragraphe. */
export function Note({ n, id, open, children }: NoteProps) {
  return (
    <div id={id} className={styles.note} hidden={!open}>
      <span className={styles.numero} aria-hidden="true">
        {n}
      </span>
      <div>{children}</div>
    </div>
  );
}
