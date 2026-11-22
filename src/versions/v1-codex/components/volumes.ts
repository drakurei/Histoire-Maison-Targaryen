/** Les huit volumes (périodes) vus par le bâti : chemin interne courant et volume ouvert. */
import { useLocation } from 'react-router-dom';

import { splitVersionPath } from '@/app/versionPath';
import { periods } from '@/core/content/timeline';
import type { Period } from '@/core/content/types';

export { periods };

const VOLUME_PATH = /^\/chroniques\/([^/?#]+)/;

/** Chemin interne de la vue courante, sans préfixe de version : « /dragons/balerion ». */
export function useInternalPath(): string {
  const { pathname } = useLocation();
  return splitVersionPath(pathname).path;
}

/** Identifiant du volume ouvert d'après un chemin interne, ou `null` hors des chroniques. */
export function volumeIdOf(path: string): string | null {
  const id = VOLUME_PATH.exec(path)?.[1];
  return id && periods.some((period) => period.id === id) ? id : null;
}

/** Le volume que lit le lecteur (page de période ou d'événement), sinon `null`. */
export function useOpenVolume(): Period | null {
  const id = volumeIdOf(useInternalPath());
  return id ? (periods.find((period) => period.id === id) ?? null) : null;
}
