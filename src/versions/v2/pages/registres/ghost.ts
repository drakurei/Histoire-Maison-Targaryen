/**
 * Le fantôme des planches (spec §5.10) : le dragon vu juste avant, gardé dans la session.
 * `sessionStorage` sous `try/catch` ; refusé, la mémoire de la page suffit, et Balerion sert
 * de fantôme par défaut.
 */
const KEY = 'tlv.v2.fantome';
const DEFAULT_GHOST = 'balerion';

let memory: string | null = null;

function read(): string | null {
  try {
    return window.sessionStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

export interface Ghost {
  id: string;
  /** Vrai si c'est la planche vue juste avant ; faux pour l'étalon par défaut. */
  previous: boolean;
}

/** Le fantôme d'une planche : la précédente si ce n'est pas la même, sinon Balerion, sinon rien. */
export function ghostFor(current: string): Ghost | null {
  const previous = read();
  if (previous && previous !== current) return { id: previous, previous: true };
  return current === DEFAULT_GHOST ? null : { id: DEFAULT_GHOST, previous: false };
}

export function rememberPlate(id: string): void {
  memory = id;
  try {
    window.sessionStorage.setItem(KEY, id);
  } catch {
    // Stockage refusé : la mémoire de la page suffit jusqu'au rechargement.
  }
}
