/**
 * Chroniques : les huit périodes et leurs événements.
 * Données produites par `scripts/build-content.mjs` à partir de `content/timeline/`.
 */
import data from '@/content/generated/timeline.json';
import type { HistoricalEvent, Localized, Period, SourceRef } from './types';

/**
 * Question que les livres parus laissent ouverte (parents de Jon Snow, identité du jeune
 * Griff…). `Period.openQuestions` n'en garde que l'énoncé ; le détail est ici, avec ce qui
 * est établi, l'hypothèse des lecteurs et ce que l'adaptation affirme, tenus séparés.
 */
export interface OpenQuestion {
  id: string;
  periodId: string;
  question: Localized;
  established: Localized;
  hypothesis: Localized;
  adaptation?: Localized;
  /** Valeur de la source, par exemple « non-resolu-dans-les-livres ». */
  status: string;
  sources: SourceRef[];
}

interface TimelineData {
  periods: Period[];
  events: HistoricalEvent[];
  openQuestions: OpenQuestion[];
}

/*
 * Seul transtypage du module. TypeScript infère du JSON des `string` là où le contrat
 * attend des unions littérales (`Reliability`, `Continuity`…) : la forme exacte est
 * garantie en amont par la validation de `scripts/build-content.mjs`, pas par le compilateur.
 */
const timeline = data as unknown as TimelineData;

/** Périodes dans l'ordre (p1 à p8). */
export const periods: readonly Period[] = timeline.periods;

/** Tous les événements, période par période, dans l'ordre du récit (adaptations en fin de période). */
export const events: readonly HistoricalEvent[] = timeline.events;

export const openQuestions: readonly OpenQuestion[] = timeline.openQuestions;

const periodById: ReadonlyMap<string, Period> = new Map(periods.map((period) => [period.id, period]));
const eventById: ReadonlyMap<string, HistoricalEvent> = new Map(events.map((event) => [event.id, event]));

const eventsByPeriod = new Map<string, HistoricalEvent[]>();
for (const event of events) {
  const list = eventsByPeriod.get(event.periodId);
  if (list) list.push(event);
  else eventsByPeriod.set(event.periodId, [event]);
}

const NO_EVENTS: readonly HistoricalEvent[] = [];

export function getPeriod(id: string): Period | undefined {
  return periodById.get(id);
}

export function getEvent(id: string): HistoricalEvent | undefined {
  return eventById.get(id);
}

/** Événements d'une période, dans l'ordre du récit. Tableau vide si la période est inconnue. */
export function eventsOfPeriod(periodId: string): readonly HistoricalEvent[] {
  return eventsByPeriod.get(periodId) ?? NO_EVENTS;
}

/** Questions ouvertes rattachées à une période (seule la dernière en porte aujourd'hui). */
export function openQuestionsOfPeriod(periodId: string): readonly OpenQuestion[] {
  return openQuestions.filter((question) => question.periodId === periodId);
}
