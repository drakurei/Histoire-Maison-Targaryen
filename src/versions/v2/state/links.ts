/**
 * Les liens de la version gardent l'année (spec §2.6, « L'année suit le lecteur ») : un lien
 * interne reprend `?an=` tel qu'il est, sauf s'il porte lui-même une année (un événement, une
 * bataille datés : y aller, c'est aller à leur année) ou s'il demande « tout le temps ».
 */
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useVersionPath } from '@/app/version';

import { VOIR_PARAM } from './useVoir';
import { YEAR_PARAM } from './year';

/** Année que porte le lien : `'keep'` (par défaut) garde celle du lecteur, `null` la retire. */
export type LinkYear = number | null | 'keep';

/** Chemin interne + année -> adresse complète dans la version courante. Le cartel ouvert n'est pas transmis. */
export function withYear(to: string, current: string | null, year: LinkYear = 'keep'): string {
  if (to.startsWith('#')) return to;
  const hashAt = to.indexOf('#');
  const beforeHash = hashAt === -1 ? to : to.slice(0, hashAt);
  const hash = hashAt === -1 ? '' : to.slice(hashAt);
  const queryAt = beforeHash.indexOf('?');
  const pathname = queryAt === -1 ? beforeHash : beforeHash.slice(0, queryAt);
  const params = new URLSearchParams(queryAt === -1 ? '' : beforeHash.slice(queryAt + 1));
  params.delete(VOIR_PARAM);
  if (year === 'keep') {
    if (!params.has(YEAR_PARAM) && current !== null) params.set(YEAR_PARAM, current);
  } else if (year === null) {
    params.delete(YEAR_PARAM);
  } else {
    params.set(YEAR_PARAM, String(year));
  }
  const search = params.toString();
  return `${pathname}${search ? `?${search}` : ''}${hash}`;
}

/** `href(to, year?)` : adresse complète, préfixe de version et année du lecteur compris. */
export function useLienHref(): (to: string, year?: LinkYear) => string {
  const path = useVersionPath();
  const [params] = useSearchParams();
  const current = params.get(YEAR_PARAM);
  return useCallback((to: string, year: LinkYear = 'keep') => path(withYear(to, current, year)), [path, current]);
}
