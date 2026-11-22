import { useSyncExternalStore } from 'react';

const QUERY = '(width < 1024px)';

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** Vrai au téléphone et à la tablette (moins de 1024 px) : le bâti y change de forme (spec §2.3). */
export function useTelephone(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
