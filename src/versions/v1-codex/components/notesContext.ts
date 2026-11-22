/** Lien entre les appels de note (NoteRef) et leurs notes (MarginNote) d'un même passage. */
import { createContext } from 'react';

export interface NotesApi {
  /** Vrai si la note est dépliée (écran étroit). */
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
  /** Note signalée brièvement après un clic sur son appel (écran large). */
  flashed: string | null;
  flash: (id: string) => void;
}

export const NotesContext = createContext<NotesApi | null>(null);
