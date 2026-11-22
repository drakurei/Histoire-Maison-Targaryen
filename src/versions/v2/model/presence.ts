/**
 * Ce que la fasce compte, année par année : les dragons vivants attestés, ceux dont le sort
 * est inconnu après leur dernière mention, et ceux qu'on ne peut situer.
 *
 * DÉPENDANCES D1 ET D3 DE LA SPÉCIFICATION (documentation/design/v2-spec.md §9). Ces fonctions
 * sont pures et testées (presence.test.ts) ; elles vivent ici en attendant d'être remontées
 * telles quelles dans `@/core/timeline` par l'orchestrateur. Aucun import de présentation.
 *
 * Règle de comptage :
 * - début : l'éclosion ; sinon la première monte datée ; sinon la première année où un
 *   événement des livres ou une bataille le cite ;
 * - fin : la mort datée ;
 * - un dragon dit vivant (`alive`) né avant la dernière mort datée du registre (153, le
 *   dernier dragon des Targaryen) a une fin inconnue : il est attesté jusqu'à sa dernière
 *   mention (événement, bataille, fin de monte), puis compté « sort inconnu » au plus tard
 *   jusqu'à cette dernière mort. Après elle, les livres ne connaissent plus aucun dragon :
 *   la fasce n'y montre rien, pas même une hachure ;
 * - un dragon dit vivant né après (les trois de 299) est attesté jusqu'à la fin du domaine.
 */
import type { Battle, Dragon, HistoricalEvent, Period, Sovereign, Year } from '@/core/content/types';
import { chronicleYears } from '@/core/timeline';

export interface PresenceYear {
  year: number;
  /** Dragons dont la vie est attestée cette année-là, dans l'ordre du registre. */
  attested: string[];
  /** Dragons au sort inconnu : peut-être vivants, plus jamais cités. */
  doubtful: string[];
}

export interface DragonPresence {
  from: number;
  to: number;
  /** Une entrée par année de `from` à `to`, sans an 0. */
  years: PresenceYear[];
  /** Dragons que rien ne permet de situer dans le temps. */
  unplaced: string[];
  /** Dernière mort datée du registre ; `null` s'il n'y en a aucune. */
  extinction: number | null;
  /** Plus grand nombre de dragons attestés une même année. */
  peak: number;
}

function isYear(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Années où les annales des livres et les batailles citent chaque dragon. */
export function dragonMentions(events: readonly HistoricalEvent[], battles: readonly Battle[]): Map<string, number[]> {
  const years = new Map<string, number[]>();
  const add = (id: string | undefined, ...found: number[]) => {
    if (!id) return;
    const list = years.get(id) ?? [];
    list.push(...found);
    years.set(id, list);
  };
  for (const event of events) {
    if (event.year === null || event.continuity !== 'livres') continue;
    for (const ref of event.dragons) add(ref.id, event.year, event.yearEnd ?? event.year);
  }
  for (const battle of battles) {
    if (battle.year === null) continue;
    for (const engaged of battle.dragons) add(engaged.dragonId, battle.year);
  }
  return years;
}

function lastDeath(dragons: readonly Dragon[]): number | null {
  const deaths = dragons.map((dragon) => dragon.died).filter(isYear);
  return deaths.length > 0 ? Math.max(...deaths) : null;
}

interface Span {
  id: string;
  sure: readonly [number, number] | null;
  doubt: readonly [number, number] | null;
}

function spanOf(dragon: Dragon, seen: readonly number[], extinction: number | null, end: number): Span | null {
  const rides = dragon.riders.flatMap((rider) => [rider.from, rider.to]).filter(isYear);
  const firstRide = dragon.riders.map((rider) => rider.from).find(isYear);
  const start = isYear(dragon.hatched) ? dragon.hatched : (firstRide ?? (seen.length > 0 ? Math.min(...seen) : null));
  if (start === null) return null;
  if (isYear(dragon.died)) return { id: dragon.id, sure: [start, Math.max(start, dragon.died)], doubt: null };
  if (dragon.alive !== true) return null;
  if (extinction === null || start >= extinction) return { id: dragon.id, sure: [start, end], doubt: null };
  const last = Math.max(start, ...[...seen, ...rides].filter((year) => year < extinction));
  return { id: dragon.id, sure: [start, last], doubt: last < extinction ? [last + 1, extinction] : null };
}

function within(span: readonly [number, number] | null, year: number): boolean {
  return span !== null && span[0] <= year && year <= span[1];
}

/** La présence des dragons de `from` à `to` (D1). */
export function dragonPresence(
  dragons: readonly Dragon[],
  events: readonly HistoricalEvent[],
  battles: readonly Battle[],
  from: number,
  to: number,
): DragonPresence {
  const extinction = lastDeath(dragons);
  const seen = dragonMentions(events, battles);
  const spans: Span[] = [];
  const unplaced: string[] = [];
  for (const dragon of dragons) {
    const span = spanOf(dragon, seen.get(dragon.id) ?? [], extinction, to);
    if (span) spans.push(span);
    else unplaced.push(dragon.id);
  }
  const years = chronicleYears(from, to).map((year) => ({
    year,
    attested: spans.filter((span) => within(span.sure, year)).map((span) => span.id),
    doubtful: spans.filter((span) => within(span.doubt, year)).map((span) => span.id),
  }));
  const peak = years.reduce((best, entry) => Math.max(best, entry.attested.length), 0);
  return { from, to, years, unplaced, extinction, peak };
}

/** L'entrée d'une année, ou `undefined` hors du domaine. */
export function presenceAt(presence: DragonPresence, year: number): PresenceYear | undefined {
  const index = year < 0 ? year - presence.from : year - presence.from - (presence.from < 0 ? 1 : 0);
  const entry = presence.years[index];
  return entry?.year === year ? entry : presence.years.find((candidate) => candidate.year === year);
}

/* ------------------------------------------------------------------ crans d'année (D3) */

/** Les années distinctes des événements datés, dans l'ordre : les crans de « ‹ » et « › ». */
export function datedYears(events: readonly HistoricalEvent[]): number[] {
  return [...new Set(events.map((event) => event.year).filter(isYear))].sort((a, b) => a - b);
}

/**
 * Le cran suivant (`1`) ou précédent (`-1`). Sans année réglée, le premier ou le dernier.
 * Au bout de la suite, `null` : il n'y a plus de cran dans ce sens.
 */
export function stepYear(years: readonly number[], year: Year, direction: 1 | -1): number | null {
  if (years.length === 0) return null;
  if (year === null) return direction === 1 ? (years[0] ?? null) : (years[years.length - 1] ?? null);
  if (direction === 1) return years.find((candidate) => candidate > year) ?? null;
  for (let index = years.length - 1; index >= 0; index -= 1) {
    const candidate = years[index];
    if (candidate !== undefined && candidate < year) return candidate;
  }
  return null;
}

/** Le cran le plus proche de `year`, s'il en est à `tolerance` années au plus. */
export function nearestDated(years: readonly number[], year: number, tolerance: number): number | null {
  let best: number | null = null;
  for (const candidate of years) {
    const gap = Math.abs(candidate - year);
    if (gap <= tolerance && (best === null || gap < Math.abs(best - year))) best = candidate;
  }
  return best;
}

/* ------------------------------------------------------------------ l'année (part de D2) */

/**
 * Les souverains qui règnent cette année-là. L'année d'une succession appartient au nouveau
 * règne (en 103, Viserys Ier ; en 129, Aegon II et Rhaenyra ; en 131, Aegon III). La dernière
 * année d'un règne que personne ne reprend cette année-là reste à son souverain : en 130,
 * Aegon II et Rhaenyra ; en 283, Aerys II.
 */
export function reignsAt(sovereigns: readonly Sovereign[], year: number): Sovereign[] {
  const succeeded = sovereigns.some((sovereign) => sovereign.reignFrom === year);
  return sovereigns.filter(
    (sovereign) =>
      sovereign.reignFrom <= year && (year < sovereign.reignTo || (year === sovereign.reignTo && !succeeded)),
  );
}

/** Bornes d'une période ; la première n'a pas de début daté et commence avec le domaine. */
export function periodBounds(period: Period, domainStart: number): readonly [number, number] {
  return [period.from ?? domainStart, period.to];
}

/** Les périodes qui contiennent cette année (deux quand elles se chevauchent). */
export function periodsAt(periods: readonly Period[], year: number, domainStart: number): Period[] {
  return periods.filter((period) => {
    const [from, to] = periodBounds(period, domainStart);
    return from <= year && year <= to;
  });
}

/* ------------------------------------------------------------------ requête d'année (D4) */

const BEFORE = /^(?:av\.?\s*(?:j\.?-?\s*)?c?\.?|bc|b\.c\.?|avant)$/;
const AFTER = /^(?:apr\.?\s*(?:j\.?-?\s*)?c?\.?|ap\.?\s*c?\.?|ac|a\.c\.?|apres|après)$/;

/**
 * « 129 », « an 129 », « 130 apr. C. », « -114 », « 114 av », « 114 BC », « 42 AC » vers une
 * année ; tout le reste vers `null`. L'an 0 n'existe pas.
 */
export function parseYearQuery(query: string): number | null {
  const text = query.trim().toLowerCase().replace(/\s+/g, ' ');
  const match = /^(?:(?:l'|l’)?an |year )?([-−]?)(\d{1,4})(?: ?(.*))?$/.exec(text);
  if (!match) return null;
  const [, sign = '', digits = '', rest = ''] = match;
  const value = Number(digits);
  if (!Number.isInteger(value) || value === 0) return null;
  const era = rest.trim();
  if (era === '') return sign ? -value : value;
  if (sign) return null;
  if (BEFORE.test(era)) return -value;
  if (AFTER.test(era)) return value;
  return null;
}
