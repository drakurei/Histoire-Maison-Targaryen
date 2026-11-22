import { useSyncExternalStore } from 'react';

import { REDUCED_MOTION_QUERY } from './tokens';

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** Lecture ponctuelle, pour le code hors React (boucle WebGL, script d'amorçage). */
export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Vrai quand le lecteur a demandé moins de mouvement. Suit le réglage du système
 * en direct : le composant se rend à nouveau si le lecteur le change en cours de visite.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
