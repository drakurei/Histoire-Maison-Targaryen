/**
 * Projections des registres pour les vues des dragons, des guerres et des lieux. Rien n'est
 * déduit au-delà des données : un lieu « où paraît » un dragon est le lieu d'un de ses
 * événements ou d'une de ses batailles ; un lieu « de l'année » est celui d'un événement ou
 * d'une bataille datés de cette année.
 */
import { getDragon } from '@/core/content/dragons';
import { getPlace } from '@/core/content/places';
import { events, getEvent } from '@/core/content/timeline';
import type { Battle, Dragon, HistoricalEvent, Localized, War } from '@/core/content/types';
import { battles, getBattle } from '@/core/content/wars';

export interface Appearance {
  kind: 'event' | 'battle';
  id: string;
  name: Localized;
  year: number | null;
}

export interface PlaceAppearances {
  placeId: string;
  /** Numéro d'ordre : rang de la première apparition. */
  order: number;
  items: Appearance[];
}

function sortYear(year: number | null): number {
  return year ?? Number.POSITIVE_INFINITY;
}

/** Les lieux où paraît un dragon, dans l'ordre du temps (première apparition), avec ce qui s'y passe. */
export function dragonPlaces(dragon: Dragon): PlaceAppearances[] {
  const found: { placeId: string; item: Appearance; sort: number }[] = [];
  for (const eventId of dragon.eventIds) {
    const event = getEvent(eventId);
    if (!event) continue;
    for (const ref of event.places) {
      if (ref.id && getPlace(ref.id)) found.push({ placeId: ref.id, item: { kind: 'event', id: event.id, name: event.title, year: event.year }, sort: event.sortYear });
    }
  }
  for (const battleId of dragon.battleIds) {
    const battle = getBattle(battleId);
    if (!battle?.placeId || !getPlace(battle.placeId)) continue;
    found.push({ placeId: battle.placeId, item: { kind: 'battle', id: battle.id, name: battle.name, year: battle.year }, sort: sortYear(battle.year) });
  }
  found.sort((a, b) => a.sort - b.sort);
  const byPlace = new Map<string, PlaceAppearances>();
  for (const entry of found) {
    let group = byPlace.get(entry.placeId);
    if (!group) {
      group = { placeId: entry.placeId, order: byPlace.size + 1, items: [] };
      byPlace.set(entry.placeId, group);
    }
    if (!group.items.some((item) => item.kind === entry.item.kind && item.id === entry.item.id)) group.items.push(entry.item);
  }
  return [...byPlace.values()];
}

/** Années des événements et batailles d'un dragon (encoches de sa vie agrandie). */
export function dragonYears(dragon: Dragon): number[] {
  const years = [
    ...dragon.eventIds.map((id) => getEvent(id)?.year ?? null),
    ...dragon.battleIds.map((id) => getBattle(id)?.year ?? null),
  ];
  return [...new Set(years.filter((year): year is number => year !== null))].sort((a, b) => a - b);
}

/** Le dragon engagé dans une bataille, et son sort tel que la chronique le dit. */
export function dragonInBattle(battle: Battle, dragonId: string): Battle['dragons'][number] | undefined {
  return battle.dragons.find((engaged) => engaged.dragonId === dragonId);
}

function inYear(event: HistoricalEvent, year: number): boolean {
  if (event.year === null) return false;
  const end = event.yearEnd ?? event.year;
  return event.year <= year && year <= end;
}

/** Les lieux d'une année : ceux de ses événements et de ses batailles datés, avec ce qui s'y passe. */
export function placesOfYear(year: number): Map<string, Appearance[]> {
  const result = new Map<string, Appearance[]>();
  const add = (placeId: string | undefined, item: Appearance) => {
    if (!placeId || !getPlace(placeId)) return;
    const list = result.get(placeId) ?? [];
    if (!list.some((entry) => entry.kind === item.kind && entry.id === item.id)) list.push(item);
    result.set(placeId, list);
  };
  for (const event of events) {
    if (!inYear(event, year)) continue;
    for (const ref of event.places) add(ref.id, { kind: 'event', id: event.id, name: event.title, year: event.year });
  }
  for (const battle of battles) {
    if (battle.year !== year) continue;
    add(battle.placeId, { kind: 'battle', id: battle.id, name: battle.name, year: battle.year });
  }
  return result;
}

const STOP = new Set(['de', 'd', 'du', 'des', 'la', 'le', 'l', 'les', 'of', 'the']);

/** Un titre réduit à ses mots pleins, sans accents ni articles : « L'incendie d'Harrenhal » = « L'incendie de Harrenhal ». */
function titleKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !STOP.has(word))
    .join(' ');
}

/**
 * Un événement et une bataille portent parfois le même titre (« La bataille du Gosier ») :
 * pour une liste, on ne garde que la bataille.
 */
export function withoutTwins(items: readonly Appearance[], name: (loc: Localized) => string): Appearance[] {
  const battles = new Set(items.filter((item) => item.kind === 'battle').map((item) => titleKey(name(item.name))));
  return items.filter((item) => item.kind === 'battle' || !battles.has(titleKey(name(item.name))));
}

/** Ce qui s'est passé en un lieu, dans l'ordre du temps : ses événements et ses batailles. */
export function placeHistory(placeId: string): Appearance[] {
  const place = getPlace(placeId);
  if (!place) return [];
  const items: (Appearance & { sort: number })[] = [];
  const seen = new Set<string>();
  for (const event of events) {
    if (!(event.places.some((ref) => ref.id === placeId) || place.eventIds.includes(event.id))) continue;
    if (seen.has(`e:${event.id}`)) continue;
    seen.add(`e:${event.id}`);
    items.push({ kind: 'event', id: event.id, name: event.title, year: event.year, sort: event.sortYear });
  }
  for (const battle of battles) {
    if (!(battle.placeId === placeId || place.battleIds.includes(battle.id))) continue;
    if (seen.has(`b:${battle.id}`)) continue;
    seen.add(`b:${battle.id}`);
    items.push({ kind: 'battle', id: battle.id, name: battle.name, year: battle.year, sort: sortYear(battle.year) });
  }
  return items.sort((a, b) => a.sort - b.sort).map(({ sort: _sort, ...item }) => item);
}

/** Dragons engagés dans les batailles d'une guerre et morts pendant elle. */
export function dragonsLost(war: War): string[] {
  const engaged = new Set(war.battles.flatMap((battle) => battle.dragons.map((entry) => entry.dragonId)));
  return [...engaged].filter((id) => {
    const died = getDragon(id)?.died;
    return died !== null && died !== undefined && died >= war.from && died <= war.to;
  });
}

/** Les batailles d'une guerre et leur numéro d'ordre, par lieu (« 9, 12 » pour Tumbleton). */
export function battleMarks(war: War): Map<string, string> {
  const marks = new Map<string, number[]>();
  war.battles.forEach((battle, index) => {
    if (!battle.placeId || !getPlace(battle.placeId)) return;
    marks.set(battle.placeId, [...(marks.get(battle.placeId) ?? []), index + 1]);
  });
  return new Map([...marks].map(([id, numbers]) => [id, numbers.join(', ')]));
}
