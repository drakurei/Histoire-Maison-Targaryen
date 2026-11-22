/**
 * Échelle du temps de la chronique.
 *
 * Le récit va de dates légendaires (les Quatorze Flammes, des milliers d'années avant la
 * Conquête) à 300 apr. C. Une échelle régulière donnerait neuf dixièmes du ruban à des
 * siècles dont on ne sait presque rien. Celle-ci a trois allures, raccordées sans saut :
 *
 *   - `dynasty`   à partir de 1 apr. C. : une année vaut une unité, c'est l'allure pleine ;
 *   - `approach`  de 114 av. C. à la Conquête : allure ralentie (`approachPace`, la moitié) ;
 *   - `legend`    avant 114 av. C. : compression logarithmique. Juste avant 114 av. C. l'allure
 *                 est celle de `approach` (pas de cassure visible), puis chaque siècle prend
 *                 moins de place que le précédent.
 *
 * Avec les réglages par défaut et le domaine entier (8000 av. C. à 300 apr. C.), la dynastie
 * occupe environ 65 % de la longueur, l'approche 12 %, le temps légendaire 23 %.
 *
 * L'échelle est une donnée immuable (`TimeScale`) ; `yearToX` et `xToYear` sont réciproques
 * sur toute la droite, y compris hors du domaine. Les années sont des nombres : négatifs
 * avant la Conquête, et il n'y a pas d'an 0 (on passe de 1 av. C. à 1 apr. C.), d'où
 * `snapYear` pour ramener une position quelconque à une année qui existe.
 *
 * Fichier en TypeScript « effaçable » : importable tel quel par Node 24.
 */
import type { Year } from '../content/types.ts';

/* ------------------------------------------------------------------ déformation */

export interface TimeWarp {
  /** Année en deçà de laquelle le temps est compressé : 114 av. C., le départ de Valyria. */
  pivot: number;
  /** Première année de l'allure pleine : 1 apr. C. */
  origin: number;
  /** Longueur d'une année entre `pivot` et `origin`, rapportée à une année de la dynastie. */
  approachPace: number;
  /**
   * Portée de la compression, en années. À cette distance du pivot, une année ne prend déjà
   * plus que la moitié de la place qu'elle prend au pivot. Plus la portée est courte, plus
   * le passé lointain se tasse.
   */
  legendSpan: number;
}

export const DEFAULT_WARP: Readonly<TimeWarp> = { pivot: -114, origin: 1, approachPace: 0.5, legendSpan: 40 };

/** Année -> abscisse déformée : 0 à `origin`, une unité par année ensuite. */
function warpYear(warp: TimeWarp, year: number): number {
  const { pivot, origin, approachPace: pace, legendSpan: span } = warp;
  if (year >= origin) return year - origin;
  if (year >= pivot) return (year - origin) * pace;
  return (pivot - origin) * pace - pace * span * Math.log1p((pivot - year) / span);
}

/** Réciproque exacte de `warpYear`. */
function unwarpYear(warp: TimeWarp, warped: number): number {
  const { pivot, origin, approachPace: pace, legendSpan: span } = warp;
  if (warped >= 0) return origin + warped;
  const atPivot = (pivot - origin) * pace;
  if (warped >= atPivot) return origin + warped / pace;
  return pivot - span * Math.expm1((atPivot - warped) / (pace * span));
}

/** Pente de `warpYear` : longueur déformée d'une année à cet endroit. */
function warpSlope(warp: TimeWarp, year: number): number {
  if (year >= warp.origin) return 1;
  if (year >= warp.pivot) return warp.approachPace;
  return (warp.approachPace * warp.legendSpan) / (warp.legendSpan + warp.pivot - year);
}

function checkWarp(warp: TimeWarp): void {
  const finite = [warp.pivot, warp.origin, warp.approachPace, warp.legendSpan].every(Number.isFinite);
  if (!finite || warp.pivot >= warp.origin || warp.approachPace <= 0 || warp.legendSpan <= 0) {
    throw new RangeError('Échelle du temps : déformation invalide (pivot < origin, allure et portée positives).');
  }
}

/* ------------------------------------------------------------------ échelle */

export interface TimeScale {
  /** Années représentées, bornes comprises, dans l'ordre croissant. */
  readonly domain: readonly [number, number];
  /** Abscisses des deux bornes du domaine, dans l'unité de l'appelant. Peut être décroissant. */
  readonly range: readonly [number, number];
  readonly warp: Readonly<TimeWarp>;
  /** Bornes du domaine après déformation : calcul fait une fois, à ne pas modifier. */
  readonly warped: readonly [number, number];
}

export interface TimeScaleOptions {
  domain: readonly [number, number];
  range: readonly [number, number];
  warp?: Partial<TimeWarp>;
}

/** Domaine remis dans l'ordre ; réduit à une seule année, il est élargi d'un an de chaque côté. */
function cleanDomain(domain: readonly [number, number]): [number, number] {
  const [a, b] = domain;
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new RangeError('Échelle du temps : domaine non fini.');
  if (a === b) return [a - 1, b + 1];
  return a < b ? [a, b] : [b, a];
}

/**
 * Construit l'échelle. Exemple, pour un ruban de 1200 unités de large :
 * `createTimeScale({ domain: [-8000, 300], range: [0, 1200] })`.
 */
export function createTimeScale(options: TimeScaleOptions): TimeScale {
  const warp: TimeWarp = { ...DEFAULT_WARP, ...options.warp };
  checkWarp(warp);
  const [x0, x1] = options.range;
  if (!Number.isFinite(x0) || !Number.isFinite(x1)) throw new RangeError('Échelle du temps : étendue non finie.');
  const domain = cleanDomain(options.domain);
  const warped: [number, number] = [warpYear(warp, domain[0]), warpYear(warp, domain[1])];
  return Object.freeze({ domain, range: [x0, x1] as const, warp: Object.freeze(warp), warped });
}

/** Abscisse d'une année. Hors du domaine, l'échelle se prolonge avec la même loi. */
export function yearToX(scale: TimeScale, year: number): number {
  const [w0, w1] = scale.warped;
  const [x0, x1] = scale.range;
  return x0 + ((warpYear(scale.warp, year) - w0) / (w1 - w0)) * (x1 - x0);
}

/** Année (non entière) d'une abscisse : réciproque de `yearToX`. Étendue nulle : début du domaine. */
export function xToYear(scale: TimeScale, x: number): number {
  const [w0, w1] = scale.warped;
  const [x0, x1] = scale.range;
  if (x1 === x0) return scale.domain[0];
  return unwarpYear(scale.warp, w0 + ((x - x0) / (x1 - x0)) * (w1 - w0));
}

/** Longueur d'une année à cet endroit de l'échelle, dans l'unité de `range` (toujours positive). */
export function paceAt(scale: TimeScale, year: number): number {
  const [w0, w1] = scale.warped;
  const [x0, x1] = scale.range;
  return (warpSlope(scale.warp, year) * Math.abs(x1 - x0)) / (w1 - w0);
}

/** Année ramenée dans le domaine de l'échelle. */
export function clampYear(scale: TimeScale, year: number): number {
  return Math.min(scale.domain[1], Math.max(scale.domain[0], year));
}

/** Année entière la plus proche qui existe : il n'y a pas d'an 0, on tombe sur 1 av. C. ou 1 apr. C. */
export function snapYear(year: number): number {
  const rounded = Math.round(year);
  if (rounded !== 0) return rounded;
  return year < 0 ? -1 : 1;
}

/** Plus petite et plus grande année d'une série ; `null` si aucune n'est connue. */
export function yearExtent(years: Iterable<Year | undefined>): [number, number] | null {
  let extent: [number, number] | null = null;
  for (const year of years) {
    if (year === null || year === undefined || !Number.isFinite(year)) continue;
    extent = extent ? [Math.min(extent[0], year), Math.max(extent[1], year)] : [year, year];
  }
  return extent;
}

/* ------------------------------------------------------------------ zones */

export type TimeZoneId = 'legend' | 'approach' | 'dynasty';

/** Portion du domaine parcourue à une même allure : de quoi dire au lecteur où l'échelle change. */
export interface TimeZone {
  id: TimeZoneId;
  from: number;
  to: number;
  /** Abscisses de `from` et de `to`. */
  x0: number;
  x1: number;
}

/** Les zones présentes dans le domaine, de la plus ancienne à la plus récente. */
export function timeZones(scale: TimeScale): TimeZone[] {
  const { pivot, origin } = scale.warp;
  const [start, end] = scale.domain;
  const bounds: [TimeZoneId, number, number][] = [
    ['legend', start, Math.min(end, pivot)],
    ['approach', Math.max(start, pivot), Math.min(end, origin)],
    ['dynasty', Math.max(start, origin), end],
  ];
  return bounds
    .filter(([, from, to]) => from < to)
    .map(([id, from, to]) => ({ id, from, to, x0: yearToX(scale, from), x1: yearToX(scale, to) }));
}

/* ------------------------------------------------------------------ graduations */

export interface TimeTick {
  year: number;
  x: number;
  zone: TimeZoneId;
  /** Vrai pour les deux charnières de l'échelle : 1 apr. C., et 114 av. C. tant qu'elle ne la serre pas de trop près. */
  anchor: boolean;
  /** Rondeur de l'année : le plus grand pas (10000, 5000, 1000, 500, 100, 50, 10, 5, 1) dont elle est multiple. */
  step: number;
}

export interface TickOptions {
  /** Écart minimal entre deux graduations, dans l'unité de `range`. Défaut : 64 ; jamais moins qu'un 500e de la longueur. */
  minGap?: number;
}

export const DEFAULT_TICK_GAP = 64;

/** Pas emboîtés, du plus rond au plus fin : chaque pas subdivise le précédent. */
const STEPS: readonly number[] = [10000, 5000, 1000, 500, 100, 50, 10, 5, 1];
/** Deux graduations régulières exactement à l'écart minimal ne doivent pas s'éliminer par arrondi. */
const TOLERANCE = 1e-6;
/** Dans la zone compressée, un pas n'est proposé que là où il mesure au moins ce quart de l'écart minimal. */
const VISIBLE_STEP = 0.25;
/** Garde-fou : un écart demandé nul ou infime ne produit pas une graduation par année sur huit millénaires. */
const MAX_TICKS = 500;

function roundness(year: number): number {
  return STEPS.find((step) => year % step === 0) ?? 1;
}

/** Multiples de `step` entre deux années comprises, croissants. Zéro n'est pas une année. */
function multiplesIn(step: number, from: number, to: number): number[] {
  const found: number[] = [];
  for (let year = Math.ceil(from / step) * step; year <= to; year += step) {
    if (year !== 0) found.push(year);
  }
  return found;
}

function tickAt(scale: TimeScale, year: number, zone: TimeZoneId, anchor: boolean): TimeTick {
  return { year, x: yearToX(scale, year), zone, anchor, step: roundness(year) };
}

/** Les charnières présentes dans le domaine, la Conquête d'abord : c'est elle qui reste si la place manque. */
function anchorTicks(scale: TimeScale): TimeTick[] {
  const { pivot, origin } = scale.warp;
  const [start, end] = scale.domain;
  const anchors: [number, TimeZoneId][] = [
    [origin, 'dynasty'],
    [pivot, 'approach'],
  ];
  return anchors.filter(([year]) => year >= start && year <= end).map(([year, zone]) => tickAt(scale, year, zone, true));
}

/** Zone d'allure constante : le pas le plus fin dont toutes les graduations tiennent. */
function regularTicks(scale: TimeScale, zone: TimeZone, gap: number): TimeTick[] {
  const pace = paceAt(scale, (zone.from + zone.to) / 2);
  const step = STEPS.findLast((candidate) => candidate * pace >= gap - TOLERANCE);
  if (step === undefined) return [];
  return multiplesIn(step, zone.from, zone.to).map((year) => tickAt(scale, year, zone.id, false));
}

/**
 * Multiples de `step` proposés dans la zone compressée, en s'éloignant du pivot. On s'arrête
 * dès que le pas ne se voit plus : graduer « 2100 av. C. » là où un siècle mesure deux
 * unités serait afficher une précision que l'échelle n'a pas.
 */
function legendLevel(scale: TimeScale, zone: TimeZone, step: number, gap: number): TimeTick[] {
  const years = multiplesIn(step, zone.from, zone.to).reverse();
  const tooFine = years.findIndex((year) => step * paceAt(scale, year) < gap * VISIBLE_STEP);
  return (tooFine === -1 ? years : years.slice(0, tooFine)).map((year) => tickAt(scale, year, zone.id, false));
}

/**
 * Zone compressée : aucun pas ne tient partout. On propose les années les plus rondes
 * d'abord, puis de plus en plus fines ; `place` ne garde que celles qui laissent l'écart demandé.
 */
function legendTicks(scale: TimeScale, zone: TimeZone, gap: number): TimeTick[] {
  return STEPS.flatMap((step) => legendLevel(scale, zone, step, gap));
}

function place(placed: TimeTick[], candidates: readonly TimeTick[], gap: number): void {
  for (const tick of candidates) {
    const free = placed.every((other) => other.year !== tick.year && Math.abs(other.x - tick.x) >= gap - TOLERANCE);
    if (free) placed.push(tick);
  }
}

/**
 * Graduations de l'échelle, triées par année, jamais plus serrées que `minGap`.
 *
 * La Conquête (1 apr. C.) est toujours graduée si elle est dans le domaine ; l'autre
 * charnière, 114 av. C., l'est aussi tant qu'elle n'en est pas trop proche (sur un ruban
 * étroit, elle cède la place). Dans les zones d'allure constante, les graduations sont
 * régulières (tous les 100 ans, 50 ans, 10 ans… selon la place) ; dans le temps légendaire,
 * ce sont les années rondes qui tiennent. L'an 0 n'existe pas : c'est « 1 apr. C. » qui
 * marque la Conquête.
 */
export function timeTicks(scale: TimeScale, options: TickOptions = {}): TimeTick[] {
  const length = Math.abs(scale.range[1] - scale.range[0]);
  if (length === 0) return [];
  const gap = Math.max(options.minGap ?? DEFAULT_TICK_GAP, length / MAX_TICKS);
  const placed: TimeTick[] = [];
  place(placed, anchorTicks(scale), gap);
  const zones = timeZones(scale);
  for (const zone of zones) {
    if (zone.id !== 'legend') place(placed, regularTicks(scale, zone, gap), gap);
  }
  for (const zone of zones) {
    if (zone.id === 'legend') place(placed, legendTicks(scale, zone, gap), gap);
  }
  return placed.sort((a, b) => a.year - b.year);
}
