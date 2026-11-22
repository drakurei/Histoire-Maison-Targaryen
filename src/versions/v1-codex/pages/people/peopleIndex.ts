/**
 * L'index des personnages : tri, regroupement et filtres. Fonctions pures sur les personnes
 * de la généalogie ; l'interface ne fait que les afficher.
 */
import type { Person, SupportLang } from '@/core/content/types';

import { CROWNED, QUEENS, RIDERS, indexName } from '../lineage/model';

export type SortMode = 'alpha' | 'generation' | 'house';
export type Role = 'crowned' | 'queens' | 'pretenders' | 'riders' | 'bastards';

export const ROLES: readonly Role[] = ['crowned', 'queens', 'pretenders', 'riders', 'bastards'];

/** Maisons proposées au filtre ; les autres sont réunies sous « autres maisons ». */
export const HOUSE_FILTERS: readonly string[] = ['targaryen', 'velaryon', 'blackfyre', 'baratheon', 'hightower', 'penrose', 'others'];

export interface IndexFilter {
  roles: ReadonlySet<Role>;
  houses: ReadonlySet<string>;
}

export interface IndexGroup {
  /** Clé du groupe : lettre, numéro de génération ou identifiant de maison. */
  id: string;
  mode: SortMode;
  persons: Person[];
}

/** Minuscules sans diacritiques, pour trier et regrouper sans que « Ǣ » parte en fin d'alphabet. */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function hasRole(person: Person, role: Role): boolean {
  switch (role) {
    case 'crowned':
      return CROWNED.has(person.id);
    case 'queens':
      return QUEENS.has(person.id);
    case 'pretenders':
      return person.pretender !== undefined;
    case 'riders':
      return RIDERS.has(person.id);
    case 'bastards':
      return person.legitimacy !== 'legitime';
  }
}

function houseBucket(house: string): string {
  return HOUSE_FILTERS.includes(house) ? house : 'others';
}

export function matches(person: Person, filter: IndexFilter): boolean {
  if (filter.roles.size > 0 && ![...filter.roles].some((role) => hasRole(person, role))) return false;
  if (filter.houses.size > 0 && !filter.houses.has(houseBucket(person.house))) return false;
  return true;
}

export function countHouse(persons: readonly Person[], bucket: string): number {
  return persons.filter((person) => houseBucket(person.house) === bucket).length;
}

function byName(reading: SupportLang) {
  return (a: Person, b: Person): number => {
    const na = indexName(a, reading);
    const nb = indexName(b, reading);
    return (
      fold(na.main).localeCompare(fold(nb.main), reading) ||
      (a.born ?? a.died ?? 9999) - (b.born ?? b.died ?? 9999) ||
      fold(na.qualifier ?? '').localeCompare(fold(nb.qualifier ?? ''), reading)
    );
  };
}

function byBirth(rank: ReadonlyMap<string, number>) {
  return (a: Person, b: Person): number => (a.born ?? 9999) - (b.born ?? 9999) || (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0);
}

/** Les personnes retenues, rangées en groupes selon le tri choisi. */
export function groupIndex(persons: readonly Person[], mode: SortMode, reading: SupportLang): IndexGroup[] {
  const rank = new Map(persons.map((person, index) => [person.id, index]));
  const groups = new Map<string, Person[]>();
  const keyOf = (person: Person): string => {
    if (mode === 'generation') return String(person.generation);
    if (mode === 'house') return person.house;
    return fold(indexName(person, reading).main).charAt(0).toUpperCase();
  };
  for (const person of persons) {
    const key = keyOf(person);
    groups.set(key, [...(groups.get(key) ?? []), person]);
  }

  const list = [...groups.entries()].map(([id, members]) => ({
    id,
    mode,
    persons: members.sort(mode === 'generation' ? byBirth(rank) : byName(reading)),
  }));

  if (mode === 'generation') list.sort((a, b) => Number(a.id) - Number(b.id));
  else if (mode === 'house')
    list.sort((a, b) => Number(b.id === 'targaryen') - Number(a.id === 'targaryen') || b.persons.length - a.persons.length || a.id.localeCompare(b.id));
  else list.sort((a, b) => a.id.localeCompare(b.id, reading));
  return list;
}

/** Années de naissance connues d'un groupe : l'époque d'une génération (« v. 120 »). */
export function medianBirth(persons: readonly Person[]): number | null {
  const years = persons
    .map((person) => person.born)
    .filter((year): year is number => typeof year === 'number')
    .sort((a, b) => a - b);
  return years.length > 0 ? (years[Math.floor(years.length / 2)] ?? null) : null;
}
