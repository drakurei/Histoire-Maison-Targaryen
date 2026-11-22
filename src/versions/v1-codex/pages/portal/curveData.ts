/**
 * Données de la courbe des dragons vivants, tirées du registre par `dragonsAlive`.
 *
 * Le registre dit `alive` pour deux choses différentes : un dragon vivant à la fin du récit
 * (Drogon) et un dragon dont on ignore la fin (Vif-Argent après Tumbleton). Les compter
 * ensemble ferait voler trois dragons jusqu'en 298. On les sépare par une date tirée du
 * registre lui-même : la dernière mort datée (153, le dernier dragon des Targaryen). Un
 * dragon `alive` né avant elle a une fin inconnue.
 *
 * Les annales servent d'attestations : un dragon cité par un événement des livres vit cette
 * année-là. Un dragon sans date de naissance commence donc à sa première mention (le
 * Cannibale en 129), et un dragon à la fin inconnue est tenu pour vivant jusqu'à sa dernière
 * mention (Vif-Argent en 131), puis compté en pointillé, au plus tard jusqu'à la dernière
 * mort datée. Rien n'est inventé : la courbe pleine est le minimum que les livres affirment.
 */
import type { Dragon, HistoricalEvent } from '@/core/content/types';
import { dragonsAlive } from '@/core/timeline';

export interface CurvePoint {
  year: number;
  /** Dragons dont la vie est attestée cette année-là. */
  count: number;
  /** Dragons à la fin non datée, peut-être encore vivants cette année-là. */
  doubt: number;
  ids: string[];
  doubtIds: string[];
}

export interface DragonCurve {
  from: number;
  to: number;
  points: CurvePoint[];
  /** Plus haut point de la courbe pleine (le premier, s'il y en a plusieurs). */
  peak: CurvePoint;
  /** Plus grande valeur, pointillé compris : la hauteur de l'axe. */
  ceiling: number;
  /** Dernière mort datée du registre, ou `null` si aucune. */
  extinction: number | null;
  /** Première année où la courbe pleine remonte après l'extinction, ou `null`. */
  revival: number | null;
  /** Dragons absents de la courbe faute de toute date. */
  uncounted: string[];
}

/** Années où les annales des livres citent chaque dragon. */
function mentions(events: readonly HistoricalEvent[]): Map<string, number[]> {
  const years = new Map<string, number[]>();
  for (const event of events) {
    if (event.year === null || event.continuity !== 'livres') continue;
    for (const ref of event.dragons) {
      if (!ref.id) continue;
      const list = years.get(ref.id) ?? [];
      list.push(event.year, event.yearEnd ?? event.year);
      years.set(ref.id, list);
    }
  }
  return years;
}

/** Dernière année de mort connue dans le registre. */
function lastDeath(dragons: readonly Dragon[]): number | null {
  const deaths = dragons.map((dragon) => dragon.died).filter((year): year is number => year !== null);
  return deaths.length > 0 ? Math.max(...deaths) : null;
}

interface Split {
  /** Vie attestée, à tracer d'un trait plein. */
  sure: Dragon | null;
  /** Survie possible, à tracer en pointillé. */
  maybe: Dragon | null;
}

function life(dragon: Dragon, from: number, to: number | null, alive = false): Dragon {
  return { ...dragon, hatched: from, riders: [], died: to, alive };
}

function split(dragon: Dragon, seen: readonly number[], extinction: number | null): Split {
  const start = dragon.hatched ?? dragon.riders[0]?.from ?? (seen.length > 0 ? Math.min(...seen) : null);
  if (start === null) return { sure: null, maybe: null };
  if (dragon.died !== null) return { sure: life(dragon, start, Math.max(start, dragon.died)), maybe: null };
  if (dragon.alive !== true) return { sure: null, maybe: null };
  if (extinction === null || start >= extinction) return { sure: life(dragon, start, null, true), maybe: null };
  const last = Math.max(start, ...seen.filter((year) => year < extinction));
  return { sure: life(dragon, start, last), maybe: last < extinction ? life(dragon, last + 1, extinction) : null };
}

export function dragonCurve(dragons: readonly Dragon[], events: readonly HistoricalEvent[], from: number, to: number): DragonCurve {
  const extinction = lastDeath(dragons);
  const seen = mentions(events);
  const sure: Dragon[] = [];
  const maybe: Dragon[] = [];
  const uncounted: string[] = [];
  for (const dragon of dragons) {
    const parts = split(dragon, seen.get(dragon.id) ?? [], extinction);
    if (parts.sure) sure.push(parts.sure);
    else uncounted.push(dragon.id);
    if (parts.maybe) maybe.push(parts.maybe);
  }

  const solid = dragonsAlive(sure, from, to);
  const doubtful = dragonsAlive(maybe, from, to);

  const points = solid.points.map((point, index): CurvePoint => {
    const other = doubtful.points[index];
    return { year: point.year, count: point.count, doubt: other?.count ?? 0, ids: point.ids, doubtIds: other?.ids ?? [] };
  });

  const first = points[0] ?? { year: from, count: 0, doubt: 0, ids: [], doubtIds: [] };
  const peak = points.reduce((best, point) => (point.count > best.count ? point : best), first);
  const ceiling = Math.max(1, ...points.map((point) => point.count + point.doubt));
  const revival =
    extinction === null
      ? null
      : (points.find((point, index) => point.year > extinction && point.count > 0 && (points[index - 1]?.count ?? 0) === 0)?.year ?? null);

  return { from, to, points, peak, ceiling, extinction, revival, uncounted };
}

/**
 * Tracé en escalier d'une série annuelle : un dragon compte toute l'année, la marche tombe
 * au passage à l'année suivante. `x(year)` donne le bord gauche de l'année.
 */
export function stepPath(
  points: readonly { year: number; value: number }[],
  x: (year: number) => number,
  y: (value: number) => number,
  end: number,
): string {
  if (points.length === 0) return '';
  const parts: string[] = [];
  points.forEach((point, index) => {
    const x0 = x(point.year);
    const next = points[index + 1];
    const x1 = next ? x(next.year) : end;
    const yy = y(point.value);
    parts.push(index === 0 ? `M${r(x0)} ${r(yy)}` : `V${r(yy)}`, `H${r(x1)}`);
  });
  return parts.join('');
}

function r(value: number): string {
  return value.toFixed(1);
}
