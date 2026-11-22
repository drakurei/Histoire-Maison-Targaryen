/** Petits crochets de présentation partagés par les composants de la version 1. */
import { useCallback, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';

/** Seuil du bâti : au-dessus, dos de volumes, signets et marge ; au-dessous, étagère et appels de note. */
export const WIDE_QUERY = '(min-width: 1024px)';

/** Vrai tant que la requête média est satisfaite ; suit les changements en direct. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Vrai sur un écran large (bâti complet). */
export function useWide(): boolean {
  return useMediaQuery(WIDE_QUERY);
}

/** Largeur de contenu d'un élément, mesurée et tenue à jour (0 avant la première mesure). */
export function useElementWidth(ref: RefObject<Element | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(Math.round(element.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}
