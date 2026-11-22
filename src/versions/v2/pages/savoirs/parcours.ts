/**
 * Ce qu'un parcours couvre dans le temps, d'après ses liens (spec §5.15, dépendance D5,
 * `pathSpan`) : les périodes qu'il ouvre, les événements datés qu'il cite. Fonctions pures,
 * les données leur sont passées.
 */
import type { HistoricalEvent, LearningPath, PathStep, Period } from '@/core/content/types';

export interface Couverture {
  /** Périodes ouvertes par les liens, dans l'ordre de la chronique. */
  periods: Period[];
  /** Années des événements datés cités, sans doublon, triées. */
  years: number[];
  /** Du début de la première période couverte à la fin de la dernière ; `null` sans période. */
  span: [number, number] | null;
}

export interface CouvertureData {
  periods: readonly Period[];
  getEvent: (id: string) => HistoricalEvent | undefined;
  /** Bornes d'une période sur la fasce (la première commence au bord du temps). */
  bounds: (period: Period) => readonly [number, number];
}

const CHRONICLE = /^\/chroniques\/([^/?#]+)(?:\/([^/?#]+))?/;

/** Périodes et événements nommés par une liste de liens internes. */
function linked(links: readonly { to: string }[], data: CouvertureData): { periodIds: Set<string>; events: HistoricalEvent[] } {
  const periodIds = new Set<string>();
  const events: HistoricalEvent[] = [];
  for (const { to } of links) {
    const match = CHRONICLE.exec(to);
    if (!match) continue;
    const [, periodId, eventId] = match;
    if (periodId) periodIds.add(periodId);
    const event = eventId ? data.getEvent(eventId) : undefined;
    if (event) {
      events.push(event);
      periodIds.add(event.periodId);
    }
  }
  return { periodIds, events };
}

function cover(links: readonly { to: string }[], data: CouvertureData): Couverture {
  const { periodIds, events } = linked(links, data);
  const periods = data.periods.filter((period) => periodIds.has(period.id));
  const years = [...new Set(events.map((event) => event.year).filter((year): year is number => year !== null))].sort((a, b) => a - b);
  if (periods.length === 0) return { periods, years, span: null };
  const edges = periods.map((period) => data.bounds(period));
  const span: [number, number] = [Math.min(...edges.map((edge) => edge[0])), Math.max(...edges.map((edge) => edge[1]))];
  return { periods, years, span };
}

/** Ce que couvre une étape. */
export function stepCover(step: PathStep, data: CouvertureData): Couverture {
  return cover(step.links, data);
}

/** Ce que couvre un parcours entier : la réunion de ses étapes. */
export function pathCover(path: LearningPath, data: CouvertureData): Couverture {
  return cover(
    path.steps.flatMap((step) => step.links),
    data,
  );
}

export type LienGenre =
  | { kind: 'person' | 'dragon' | 'place' | 'war' | 'event'; id: string }
  | { kind: 'battle'; id: string; warId: string }
  | { kind: 'page'; to: string };

/** La nature d'un lien de parcours : une entité (ouverte au cartel) ou une vue. */
export function lienGenre(to: string): LienGenre {
  const [path = '', hash = ''] = to.split('#');
  const parts = path.split('?')[0]?.split('/').filter(Boolean) ?? [];
  const [root, first, second] = parts;
  if (root === 'personnages' && first && !second) return { kind: 'person', id: first };
  if (root === 'dragons' && first && !second) return { kind: 'dragon', id: first };
  if (root === 'lieux' && first && !second) return { kind: 'place', id: first };
  if (root === 'guerres' && first && !second) return hash ? { kind: 'battle', id: hash, warId: first } : { kind: 'war', id: first };
  if (root === 'chroniques' && first && second) return { kind: 'event', id: second };
  return { kind: 'page', to };
}
