/**
 * Rangement du registre des dragons, pour les pages de la version 1 : fonctions pures.
 *
 * Les livres datent rarement une éclosion. Un dragon est rangé à l'époque où les chroniques
 * le font paraître pour la première fois : année d'éclosion si elle est connue, sinon
 * première année de cavalier, sinon premier événement daté où il paraît.
 */
import type { Dragon, HistoricalEvent, Localized, Period } from '@/core/content/types';

/** Nom à afficher : sans forme valyrienne quand elle ne diffère pas du nom courant (« Balerion » sur « Balerion »). */
export function dragonName(dragon: Dragon): Localized {
  const { hv, fr, en } = dragon.name;
  if (!hv || hv === fr || hv === en) return { fr, en };
  return dragon.name;
}

/** Première année où le dragon paraît dans la chronique, ou `null` si rien ne le date. */
export function firstKnownYear(dragon: Dragon, eventById: ReadonlyMap<string, HistoricalEvent>): number | null {
  const years: number[] = [];
  if (dragon.hatched !== null) years.push(dragon.hatched);
  for (const rider of dragon.riders) if (rider.from !== undefined) years.push(rider.from);
  for (const id of dragon.eventIds) {
    const event = eventById.get(id);
    if (event) years.push(event.sortYear);
  }
  return years.length > 0 ? Math.min(...years) : null;
}

/** Dernière période commencée à cette année (les périodes se chevauchent : la plus récente l'emporte). */
export function periodAt(year: number, periods: readonly Period[]): Period | undefined {
  let found: Period | undefined;
  for (const period of [...periods].sort((a, b) => a.order - b.order)) {
    const from = period.from ?? -Infinity;
    if (from <= year) found = period;
  }
  return found;
}

export interface DragonEpoch {
  period: Period;
  dragons: Dragon[];
}

/** Les dragons par époque de première mention, chaque époque dans l'ordre des volumes. */
export function dragonEpochs(
  dragons: readonly Dragon[],
  periods: readonly Period[],
  events: readonly HistoricalEvent[],
): DragonEpoch[] {
  const eventById = new Map(events.map((event) => [event.id, event]));
  const byPeriod = new Map<string, { dragon: Dragon; year: number }[]>();
  for (const dragon of dragons) {
    const year = firstKnownYear(dragon, eventById) ?? dragon.died ?? 0;
    const period = periodAt(year, periods);
    if (!period) continue;
    const list = byPeriod.get(period.id) ?? [];
    list.push({ dragon, year });
    byPeriod.set(period.id, list);
  }
  return [...periods]
    .sort((a, b) => a.order - b.order)
    .flatMap((period) => {
      const list = byPeriod.get(period.id);
      if (!list) return [];
      list.sort((a, b) => a.year - b.year || b.dragon.look.span - a.dragon.look.span);
      return [{ period, dragons: list.map((entry) => entry.dragon) }];
    });
}

/** Dragons voisins dans l'ordre du registre, pour aller de planche en planche. */
export function neighbours<T extends { id: string }>(list: readonly T[], id: string): { previous?: T; next?: T } {
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return {};
  return { previous: list[index - 1], next: list[index + 1] };
}
