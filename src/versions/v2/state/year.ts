/**
 * L'année réglée : une seule source pour toute la version (spec §2.2, « État », et §6, mouvement 2).
 *
 * L'année vit dans l'adresse (`?an=129`, négatif avant la Conquête, jamais 0). Pendant qu'on
 * tire la fasce, l'adresse n'est pas réécrite : l'année glissée vit dans un petit magasin
 * externe (`useSyncExternalStore`), et l'adresse n'est réécrite qu'au relâcher, en `replace`.
 * Le survol de la masse écrit une année dans le cartel sans la régler : c'est la troisième
 * valeur du magasin, que seul le cartel lit.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { clampToDomain } from './scene';

export const YEAR_PARAM = 'an';

interface Transient {
  /** Année tirée sur la fasce, pas encore écrite dans l'adresse. */
  drag: number | null;
  /** Année survolée sur la masse ou sur une période : le cartel la montre, rien d'autre. */
  hover: number | null;
}

let transient: Transient = { drag: null, hover: null };
const listeners = new Set<() => void>();

function emit(next: Partial<Transient>): void {
  const merged = { ...transient, ...next };
  if (merged.drag === transient.drag && merged.hover === transient.hover) return;
  transient = merged;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getTransient = () => transient;

/** Année glissée (pendant un geste sur la fasce). `null` pour finir le geste. */
export function setDragYear(year: number | null): void {
  emit({ drag: year === null ? null : clampToDomain(year) });
}

/** Année survolée ; `null` en sortant. */
export function setHoverYear(year: number | null): void {
  emit({ hover: year === null ? null : clampToDomain(year) });
}

/** `?an=` lu tel quel : un entier non nul dans le temps de la fasce, sinon `null`. */
export function parseYearParam(value: string | null): number | null {
  if (value === null || !/^-?\d{1,4}$/.test(value.trim())) return null;
  const year = Number(value);
  if (year === 0) return null;
  return clampToDomain(year);
}

/** L'année écrite dans l'adresse. */
export function useUrlYear(): number | null {
  const [params] = useSearchParams();
  return parseYearParam(params.get(YEAR_PARAM));
}

/** L'année réglée, glisser compris : ce que lisent l'encoche, la carte, les âges, le profil. */
export function useYear(): number | null {
  const url = useUrlYear();
  const { drag } = useSyncExternalStore(subscribe, getTransient, getTransient);
  return drag ?? url;
}

/** L'année survolée, s'il y en a une. Pour le cartel de la fasce seulement. */
export function useHoverYear(): number | null {
  return useSyncExternalStore(subscribe, getTransient, getTransient).hover;
}

/**
 * Régler l'année : écrit `?an=` (ou le retire pour « tout le temps ») sans entrée
 * d'historique, garde les autres paramètres et l'ancre, ne fait pas défiler la page.
 */
export function useSetYear(): (year: number | null) => void {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (year: number | null) => {
      const params = new URLSearchParams(location.search);
      if (year === null) params.delete(YEAR_PARAM);
      else params.set(YEAR_PARAM, String(clampToDomain(year)));
      const search = params.toString();
      setDragYear(null);
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash },
        { replace: true, state: location.state, preventScrollReset: true },
      );
    },
    [navigate, location.pathname, location.search, location.hash, location.state],
  );
}
