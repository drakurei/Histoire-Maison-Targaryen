import { useEffect, useState } from 'react';

/** Ordinateur : la composition en parti, la colonne collante, la fasce en pile. */
export const DESKTOP = '(min-width: 1024px)';
export const TABLET = '(min-width: 768px) and (max-width: 1023.98px)';

/** Vrai tant que la requête média correspond ; suit les changements de taille. */
export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
}
