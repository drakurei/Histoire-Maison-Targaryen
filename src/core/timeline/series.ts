/**
 * Séries tirées des registres pour les figures du temps : dragons vivants par année,
 * rubans des règnes, événements par année, lignes de vie, densité d'événements.
 *
 * Fonctions pures : les données arrivent en argument, rien n'est modifié. Ce que les
 * sources ne datent pas n'est jamais placé d'autorité : chaque fonction rend à part ce
 * qu'elle n'a pas pu situer (`unknown`, `undated`) pour que la figure puisse le dire.
 *
 * Fichier en TypeScript « effaçable » : importable tel quel par Node 24.
 */
import type { DateCertainty, Dragon, HistoricalEvent, Localized, Person, Sovereign, Year } from '../content/types.ts';

/** Dernière année du récit : ceux qui vivent encore sont tracés jusque-là. */
export const NARRATIVE_END = 300;

function isYear(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Années entières de `from` à `to`, bornes comprises. Il n'y a pas d'an 0. */
export function chronicleYears(from: number, to: number): number[] {
  const years: number[] = [];
  for (let year = Math.ceil(from); year <= Math.floor(to); year += 1) {
    if (year !== 0) years.push(year);
  }
  return years;
}

/* ------------------------------------------------------------------ dragons vivants */

export interface DragonLife {
  id: string;
  from: number;
  /** Année de la mort ; `null` si le dragon vit encore à la fin du récit ou si son sort est inconnu. */
  to: number | null;
  /** Vrai si `from` n'est pas l'éclosion mais la première année connue du premier cavalier. */
  inferred: boolean;
}

export interface DragonLives {
  lives: DragonLife[];
  /** Dragons que rien ne permet de situer : ni éclosion, ni première monte datée, ou fin non dite. */
  unknown: string[];
}

function lifeOf(dragon: Dragon): DragonLife | null {
  const hatched = isYear(dragon.hatched) ? dragon.hatched : null;
  const firstRide = dragon.riders[0]?.from;
  const from = hatched ?? (isYear(firstRide) ? firstRide : null);
  const to = isYear(dragon.died) ? dragon.died : null;
  if (from === null) return null;
  if (to === null ? dragon.alive !== true : to < from) return null;
  return { id: dragon.id, from, to, inferred: hatched === null };
}

/**
 * Durée de vie connue de chaque dragon. Sans année d'éclosion, le dragon compte à partir de
 * la première année de son premier cavalier, si elle est connue ; sinon il va dans `unknown`.
 * Un dragon sans année de mort n'est tracé que s'il est dit vivant (`alive`).
 */
export function dragonLives(dragons: readonly Dragon[]): DragonLives {
  const lives: DragonLife[] = [];
  const unknown: string[] = [];
  for (const dragon of dragons) {
    const life = lifeOf(dragon);
    if (life) lives.push(life);
    else unknown.push(dragon.id);
  }
  return { lives, unknown };
}

export interface DragonCount {
  year: number;
  count: number;
  /** Identifiants des dragons vivants cette année-là, dans l'ordre du registre. */
  ids: string[];
}

export interface DragonSeries {
  /** Un point par année de `from` à `to`, sans an 0. */
  points: DragonCount[];
  /** Dragons comptés à partir de leur premier cavalier, faute d'année d'éclosion. */
  inferred: string[];
  /** Dragons non comptés : la courbe est un minimum, pas un recensement. */
  unknown: string[];
}

/**
 * Nombre de dragons vivants, année par année. Un dragon compte de son année d'éclosion à
 * l'année de sa mort, toutes deux comprises ; un dragon dit vivant compte jusqu'à `to`.
 */
export function dragonsAlive(dragons: readonly Dragon[], from: number, to: number): DragonSeries {
  const { lives, unknown } = dragonLives(dragons);
  const points = chronicleYears(from, to).map((year) => {
    const ids = lives.filter((life) => life.from <= year && (life.to === null || year <= life.to)).map((life) => life.id);
    return { year, count: ids.length, ids };
  });
  return { points, inferred: lives.filter((life) => life.inferred).map((life) => life.id), unknown };
}

/* ------------------------------------------------------------------ règnes */

export interface ReignRibbon {
  /** Identifiant de la personne. */
  id: string;
  /** Rang dans la suite officielle ; `null` pour qui a régné sans y être compté. */
  ordinal: number | null;
  name: Localized;
  epithet?: Localized;
  from: number;
  to: number;
  contested: boolean;
  /** Couloir du ruban : 0 pour la suite principale, 1 et plus quand deux règnes se recouvrent. */
  lane: number;
}

function byReign(a: Sovereign, b: Sovereign): number {
  const official = Number(a.ordinal === null) - Number(b.ordinal === null);
  return a.reignFrom - b.reignFrom || official || (a.ordinal ?? 0) - (b.ordinal ?? 0);
}

/** Premier couloir libre à cette année ; un règne peut commencer l'année où le précédent finit. */
function takeLane(laneEnds: number[], from: number, to: number): number {
  const free = laneEnds.findIndex((end) => end <= from);
  const lane = free === -1 ? laneEnds.length : free;
  laneEnds[lane] = to;
  return lane;
}

/**
 * Rubans des règnes, dans l'ordre du temps. Deux règnes qui se recouvrent (Aegon II et
 * Rhaenyra) sont rangés dans deux couloirs ; le souverain compté dans la suite garde le premier.
 */
export function reignRibbons(sovereigns: readonly Sovereign[]): ReignRibbon[] {
  const laneEnds: number[] = [];
  return [...sovereigns].sort(byReign).map((sovereign) => {
    const { id, ordinal, name, epithet, reignFrom: from, reignTo: to, contested } = sovereign;
    const ribbon: ReignRibbon = { id, ordinal, name, from, to, contested, lane: takeLane(laneEnds, from, to) };
    if (epithet) ribbon.epithet = epithet;
    return ribbon;
  });
}

/* ------------------------------------------------------------------ événements par année */

export interface YearGroup {
  /** Année commune aux événements du groupe ; `null` pour une suite d'événements non datés. */
  year: Year;
  /** Place du groupe dans le fil du temps : `sortYear` de son premier événement. */
  sortYear: number;
  events: HistoricalEvent[];
}

function bySortYear(a: HistoricalEvent, b: HistoricalEvent): number {
  return a.sortYear - b.sortYear;
}

/**
 * Événements regroupés par année, dans le fil du temps (`sortYear`). Les événements non
 * datés ne sont rattachés à aucune année : ils forment leurs propres groupes (`year: null`),
 * à la place que leur donne `sortYear`, entre les années qui les encadrent.
 */
export function eventsByYear(events: readonly HistoricalEvent[]): YearGroup[] {
  const groups: YearGroup[] = [];
  const dated = new Map<number, YearGroup>();
  for (const event of [...events].sort(bySortYear)) {
    const last = groups[groups.length - 1];
    const open = event.year === null ? (last?.year === null ? last : undefined) : dated.get(event.year);
    if (open) {
      open.events.push(event);
      continue;
    }
    const group: YearGroup = { year: event.year, sortYear: event.sortYear, events: [event] };
    if (event.year !== null) dated.set(event.year, group);
    groups.push(group);
  }
  return groups;
}

/* ------------------------------------------------------------------ lignes de vie */

/** Une extrémité de vie : l'année si elle est connue, et la fourchette que laissent les sources. */
export interface LifeBound {
  year: Year;
  earliest: Year;
  latest: Year;
}

export interface LifeSpan {
  id: string;
  name: Localized;
  born: LifeBound;
  died: LifeBound;
  /** Vrai si la personne vit encore à la fin du récit. */
  alive: boolean;
  certainty: DateCertainty;
  reign: readonly [number, number] | null;
  /** Années où la personne vit à coup sûr : de la naissance au plus tard à la mort au plus tôt. */
  sure: readonly [number, number] | null;
  /** Tout ce que l'on peut tracer : de la première à la dernière année qu'une source rattache à cette vie. */
  extent: readonly [number, number];
}

export interface LifeSpans {
  /** Lignes de vie, de la plus ancienne à la plus récente. */
  spans: LifeSpan[];
  /** Personnes dont aucune année n'est connue : impossibles à placer sur le temps. */
  undated: string[];
}

function boundOf(year: Year, range: [Year, Year] | undefined): LifeBound {
  return range ? { year, earliest: range[0], latest: range[1] } : { year, earliest: year, latest: year };
}

/** Une seule borne connue : la personne vit à coup sûr cette année-là, on n'en sait pas plus. */
function sureSpan(from: Year, to: Year): readonly [number, number] | null {
  const start = from ?? to;
  const end = to ?? from;
  if (start === null || end === null) return null;
  return start <= end ? [start, end] : null;
}

function yearsOf(bound: LifeBound): Year[] {
  return [bound.year, bound.earliest, bound.latest];
}

function lifeSpanOf(person: Person, until: number): LifeSpan | null {
  const born = boundOf(person.born, person.bornRange);
  const died = boundOf(person.died, person.diedRange);
  const alive = person.alive === true;
  const end = alive ? until : null;
  const known = [...yearsOf(born), ...yearsOf(died), end, ...(person.reign ?? [])].filter(isYear);
  if (known.length === 0) return null;
  const sure = sureSpan(born.latest ?? born.year ?? person.reign?.[0] ?? null, died.earliest ?? died.year ?? end);
  const extent = [Math.min(...known), Math.max(...known)] as const;
  const { id, name, dateCertainty: certainty, reign } = person;
  return { id, name, born, died, alive, certainty, reign, sure, extent };
}

/**
 * Lignes de vie. `sure` est la partie à tracer d'un trait plein ; ce qui dépasse dans
 * `extent`, ou une borne `null`, est une incertitude à montrer comme telle. Une personne
 * dite vivante est prolongée jusqu'à `until` (fin du récit).
 */
export function lifeSpans(persons: readonly Person[], until: number = NARRATIVE_END): LifeSpans {
  const spans: LifeSpan[] = [];
  const undated: string[] = [];
  for (const person of persons) {
    const span = lifeSpanOf(person, until);
    if (span) spans.push(span);
    else undated.push(person.id);
  }
  spans.sort((a, b) => a.extent[0] - b.extent[0]);
  return { spans, undated };
}

/* ------------------------------------------------------------------ densité */

export interface DensityBucket {
  /** Début de la tranche (compris). */
  from: number;
  /** Fin de la tranche (exclue) : `from + step`. */
  to: number;
  count: number;
  /** Parmi `count`, les événements sans année, placés d'après `sortYear`. */
  undated: number;
  ids: string[];
}

export interface DensityOptions {
  /** Largeur d'une tranche en années. Défaut : 10. */
  step?: number;
  /** Première et dernière année à couvrir. Défaut : du premier au dernier événement. */
  from?: number;
  to?: number;
}

/** Année où l'événement est placé sur le temps : la sienne, ou à défaut celle de `sortYear`. */
export function placementYear(event: HistoricalEvent): number {
  return event.year ?? Math.floor(event.sortYear);
}

function bucketStart(year: number, step: number): number {
  return Math.floor(year / step) * step;
}

function emptyBuckets(from: number, to: number, step: number): Map<number, DensityBucket> {
  const buckets = new Map<number, DensityBucket>();
  for (let start = bucketStart(from, step); start <= bucketStart(to, step); start += step) {
    buckets.set(start, { from: start, to: start + step, count: 0, undated: 0, ids: [] });
  }
  return buckets;
}

/**
 * Nombre d'événements par tranche de `step` années (par décennie par défaut). Les tranches
 * se suivent sans trou de `from` à `to`, tranches vides comprises ; un événement qui dure
 * compte dans la tranche de son début. Les décennies tombent sur les dizaines : 120 à 129,
 * et de 120 à 111 av. C. avant la Conquête.
 */
export function eventDensity(events: readonly HistoricalEvent[], options: DensityOptions = {}): DensityBucket[] {
  const step = options.step ?? 10;
  if (!Number.isInteger(step) || step <= 0) throw new RangeError('Densité : le pas est un nombre entier d’années, au moins 1.');
  if (events.length === 0 && (options.from === undefined || options.to === undefined)) return [];
  const years = events.map(placementYear);
  const buckets = emptyBuckets(options.from ?? Math.min(...years), options.to ?? Math.max(...years), step);
  for (const event of events) {
    const bucket = buckets.get(bucketStart(placementYear(event), step));
    if (!bucket) continue;
    bucket.count += 1;
    bucket.ids.push(event.id);
    if (event.year === null) bucket.undated += 1;
  }
  return [...buckets.values()];
}
