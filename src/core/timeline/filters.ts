/**
 * Filtres des événements : période, personne, dragon, lieu, fiabilité, continuité,
 * intervalle d'années, texte. Tous se combinent.
 *
 * Règle de combinaison : un événement est gardé s'il satisfait chaque critère renseigné.
 * À l'intérieur d'un critère, les valeurs sont des alternatives (« établi » ou « légende ») ;
 * pour les personnes, dragons et lieux, `entities: 'all'` exige au contraire que toutes les
 * valeurs soient présentes (« Daemon et Rhaenyra ensemble »). Un critère absent ou vide ne
 * filtre rien.
 *
 * Beaucoup de personnes et de lieux cités par les événements n'ont pas de fiche, donc pas
 * d'identifiant : on les désigne par une clé (`entityKey`) qui vaut l'identifiant quand il
 * existe, sinon le nom normalisé. `eventFacets` donne les clés présentes et leurs effectifs.
 *
 * Fichier en TypeScript « effaçable » : importable tel quel par Node 24.
 */
import type { Continuity, EntityRef, HistoricalEvent, Lang, Localized, Reliability } from '../content/types.ts';
import { startsWord } from '../search/highlight.ts';
import { normalize, normalizeLoose, wordsOf } from '../search/normalize.ts';
import { placementYear } from './series.ts';

export interface EventFilter {
  /** Identifiants de périodes (`p1` … `p8`). */
  periods?: readonly string[];
  /** Clés de personnes (`entityKey`). */
  people?: readonly string[];
  /** Clés de dragons. */
  dragons?: readonly string[];
  /** Clés de lieux. */
  places?: readonly string[];
  reliability?: readonly Reliability[];
  continuity?: readonly Continuity[];
  /** Intervalle d'années, bornes comprises ; `null` laisse un côté ouvert. */
  years?: readonly [from: number | null, to: number | null];
  /** Mots cherchés dans le titre, le récit, la date et les noms cités. */
  text?: string;
  /** Personnes, dragons, lieux : l'une des valeurs suffit (`any`, défaut) ou toutes sont exigées (`all`). */
  entities?: 'any' | 'all';
}

export type EventCriterion = Exclude<keyof EventFilter, 'entities'>;

/** Clé d'une entité citée : son identifiant, sinon « ~ » suivi de son nom français normalisé. */
export function entityKey(ref: EntityRef): string {
  return ref.id ?? `~${normalize(ref.name.fr)}`;
}

/* ------------------------------------------------------------------ critères */

function oneOf<T>(wanted: readonly T[] | undefined, value: T): boolean {
  return wanted === undefined || wanted.length === 0 || wanted.includes(value);
}

function refsMatch(wanted: readonly string[] | undefined, refs: readonly EntityRef[], mode: 'any' | 'all'): boolean {
  if (wanted === undefined || wanted.length === 0) return true;
  const present = new Set(refs.map(entityKey));
  return mode === 'all' ? wanted.every((key) => present.has(key)) : wanted.some((key) => present.has(key));
}

/**
 * Un événement qui dure (`yearEnd`) répond dès qu'il touche l'intervalle. Un événement non
 * daté est jugé à la place que lui donne `sortYear`, celle où la frise le montre.
 */
function inYears(event: HistoricalEvent, years: EventFilter['years']): boolean {
  if (!years) return true;
  const [a, b] = years;
  const inverted = a !== null && b !== null && a > b;
  const from = inverted ? b : a;
  const to = inverted ? a : b;
  return (from === null || endYear(event) >= from) && (to === null || placementYear(event) <= to);
}

/** Dernière année d'un événement : celle où il s'achève s'il dure, sinon celle où il est placé. */
function endYear(event: HistoricalEvent): number {
  const start = placementYear(event);
  return Math.max(start, event.yearEnd ?? start);
}

/* ------------------------------------------------------------------ texte */

/** Formes lues par le lecteur dans cette langue ; en haut valyrien, le récit peut être en français ou en anglais. */
function formsOf(text: Localized | undefined, lang: Lang): string[] {
  if (!text) return [];
  const shown = lang === 'hv' ? [text.fr, text.en] : [text[lang]];
  return text.hv === undefined ? shown : [...shown, text.hv];
}

function proseOf(event: HistoricalEvent, lang: Lang): string {
  const texts = [event.title, event.summary, event.consequence, event.yearLabel, event.dateNote, event.reliabilityNote];
  const names = [...event.people, ...event.dragons, ...event.places].map((ref) => ref.name);
  return normalizeLoose([...texts, ...names].flatMap((text) => formsOf(text, lang)).join(' '));
}

const proseCache = new WeakMap<HistoricalEvent, Partial<Record<Lang, string>>>();

/** Texte cherchable d'un événement, normalisé une seule fois par langue. */
function cachedProse(event: HistoricalEvent, lang: Lang): string {
  let byLang = proseCache.get(event);
  if (!byLang) {
    byLang = {};
    proseCache.set(event, byLang);
  }
  return (byLang[lang] ??= proseOf(event, lang));
}

function startsAWord(prose: string, word: string): boolean {
  for (let at = prose.indexOf(word); at !== -1; at = prose.indexOf(word, at + 1)) {
    if (startsWord(prose, at)) return true;
  }
  return false;
}

/** Mots d'une recherche, normalisés comme le texte des événements. */
function queryWords(text: string | undefined): string[] {
  return text === undefined ? [] : wordsOf(normalizeLoose(text));
}

/** Chaque mot tapé doit commencer un mot du texte : « roi » trouve « rois », pas « trois ». */
function textMatches(event: HistoricalEvent, words: readonly string[], lang: Lang): boolean {
  if (words.length === 0) return true;
  const prose = cachedProse(event, lang);
  return words.every((word) => startsAWord(prose, word));
}

/* ------------------------------------------------------------------ filtrage */

function passes(event: HistoricalEvent, filter: EventFilter, words: readonly string[], lang: Lang): boolean {
  const mode = filter.entities ?? 'any';
  return (
    oneOf(filter.periods, event.periodId) &&
    oneOf(filter.reliability, event.reliability) &&
    oneOf(filter.continuity, event.continuity) &&
    refsMatch(filter.people, event.people, mode) &&
    refsMatch(filter.dragons, event.dragons, mode) &&
    refsMatch(filter.places, event.places, mode) &&
    inYears(event, filter.years) &&
    textMatches(event, words, lang)
  );
}

/**
 * Vrai si l'événement satisfait tous les critères renseignés.
 * @param lang langue lue par le lecteur (`reading`) : le texte n'est cherché que dans ce qu'il voit.
 */
export function matchesEvent(event: HistoricalEvent, filter: EventFilter, lang: Lang = 'fr'): boolean {
  return passes(event, filter, queryWords(filter.text), lang);
}

/** Événements qui satisfont le filtre, dans l'ordre reçu. Le tableau d'origine n'est pas modifié. */
export function filterEvents(events: readonly HistoricalEvent[], filter: EventFilter, lang: Lang = 'fr'): HistoricalEvent[] {
  const words = queryWords(filter.text);
  return events.filter((event) => passes(event, filter, words, lang));
}

const LIST_CRITERIA = ['periods', 'people', 'dragons', 'places', 'reliability', 'continuity'] as const;

/** Critères qui filtrent réellement : ni absents, ni vides. */
export function activeCriteria(filter: EventFilter): EventCriterion[] {
  const active: EventCriterion[] = LIST_CRITERIA.filter((name) => (filter[name]?.length ?? 0) > 0);
  if (filter.years && (filter.years[0] !== null || filter.years[1] !== null)) active.push('years');
  if (queryWords(filter.text).length > 0) active.push('text');
  return active;
}

/* ------------------------------------------------------------------ valeurs disponibles */

export interface FacetValue<T extends string = string> {
  value: T;
  count: number;
}

export interface EntityFacet {
  /** Clé à donner au filtre (`entityKey`). */
  key: string;
  /** Identifiant de la fiche, si l'entité en a une. */
  id?: string;
  name: Localized;
  count: number;
}

export interface EventFacets {
  /** Dans l'ordre de première apparition. */
  periods: FacetValue[];
  reliability: FacetValue<Reliability>[];
  continuity: FacetValue<Continuity>[];
  /** Du plus cité au moins cité. */
  people: EntityFacet[];
  dragons: EntityFacet[];
  places: EntityFacet[];
  /** Première et dernière année touchées par un événement ; `null` s'il n'y a aucun événement. */
  years: [number, number] | null;
}

function countValues<T extends string>(values: readonly T[]): FacetValue<T>[] {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].map(([value, count]) => ({ value, count }));
}

function facetOf(key: string, ref: EntityRef): EntityFacet {
  const facet: EntityFacet = { key, name: ref.name, count: 0 };
  if (ref.id !== undefined) facet.id = ref.id;
  return facet;
}

/** Clés distinctes des entités citées par un événement. */
function distinctRefs(refs: readonly EntityRef[]): Map<string, EntityRef> {
  const distinct = new Map<string, EntityRef>();
  for (const ref of refs) {
    const key = entityKey(ref);
    if (!distinct.has(key)) distinct.set(key, ref);
  }
  return distinct;
}

/** Une entité compte une fois par événement, même citée deux fois. */
function countEntities(lists: readonly (readonly EntityRef[])[]): EntityFacet[] {
  const facets = new Map<string, EntityFacet>();
  for (const refs of lists) {
    for (const [key, ref] of distinctRefs(refs)) {
      const facet = facets.get(key) ?? facetOf(key, ref);
      facet.count += 1;
      facets.set(key, facet);
    }
  }
  return [...facets.values()].sort((a, b) => b.count - a.count);
}

function yearsTouched(events: readonly HistoricalEvent[]): [number, number] | null {
  if (events.length === 0) return null;
  return [Math.min(...events.map(placementYear)), Math.max(...events.map(endYear))];
}

/**
 * Valeurs que l'on peut proposer au lecteur pour filtrer ces événements, avec leurs
 * effectifs. À calculer sur la liste déjà filtrée pour annoncer ce qu'un critère de plus
 * laisserait, ou sur la liste entière pour proposer tous les choix.
 */
export function eventFacets(events: readonly HistoricalEvent[]): EventFacets {
  return {
    periods: countValues(events.map((event) => event.periodId)),
    reliability: countValues(events.map((event) => event.reliability)),
    continuity: countValues(events.map((event) => event.continuity)),
    people: countEntities(events.map((event) => event.people)),
    dragons: countEntities(events.map((event) => event.dragons)),
    places: countEntities(events.map((event) => event.places)),
    years: yearsTouched(events),
  };
}
