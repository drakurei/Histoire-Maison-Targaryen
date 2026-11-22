import type { PlaceKind } from '@/core/content/types';

/** Les genres de lieux, dans l'ordre des filtres. */
export const KINDS: readonly PlaceKind[] = ['cite', 'cite-libre', 'forteresse', 'ile', 'ruine', 'champ-de-bataille', 'region'];

/** Clé d'interface d'un genre (`page.places.kind.cite_libre`). */
export function kindKey(kind: PlaceKind): string {
  return kind.replace(/-/g, '_');
}
