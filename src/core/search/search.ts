/**
 * Recherche dans l'index (`SearchEntry[]`) : classement, regroupement par genre, passages
 * à mettre en évidence.
 *
 * Fonctions pures. L'index arrive en argument ; ses clés (`keys`) sont déjà normalisées par
 * `scripts/build-content.mjs`, la requête l'est ici par la même règle (`normalize`).
 *
 * Classement, du plus fort au plus faible :
 *   1. `prefix`      une clé commence par la requête (« aeg » pour « Aegon Ier »), article
 *                    initial non compté (« conquérant » pour « le Conquérant ») ;
 *   2. `word`        la requête est un mot entier ailleurs dans une clé ;
 *   3. `word-start`  la requête commence un mot ailleurs dans une clé ;
 *   4. `substring`   la requête apparaît au milieu d'un mot.
 * Une requête de plusieurs mots qui ne se suivent dans aucune clé (« aegon conquérant » :
 * le nom dans une clé, l'épithète dans une autre) est classée d'après son mot le plus
 * faible, après les réponses d'un seul tenant de même rang (`scattered`).
 * À rang égal, dans cet ordre : personnes et dragons d'abord (qui tape « daenerys » cherche
 * la reine avant l'entrée du lexique) ; puis la clé qui est exactement la requête (`exact`) ;
 * puis les réponses visibles dans la langue affichée et la clé la plus proche de la requête ;
 * enfin l'ordre de l'index. Les bonus sont étagés pour que cet ordre soit strict.
 *
 * Fichier en TypeScript « effaçable » : importable tel quel par Node 24.
 */
import type { Lang, Localized, SearchEntry, SearchKind } from '../content/types.ts';
import { endsWord, findRanges, startsWord } from './highlight.ts';
import type { TextRange } from './highlight.ts';
import { normalize, normalizeLoose, wordsOf } from './normalize.ts';

/* ------------------------------------------------------------------ types */

export type MatchRank = 'prefix' | 'word' | 'word-start' | 'substring';

/** Passages trouvés dans chaque forme d'un texte traduit. `hv` seulement si la forme existe. */
export interface Highlights {
  fr: TextRange[];
  en: TextRange[];
  hv?: TextRange[];
}

export interface SearchHit {
  entry: SearchEntry;
  rank: MatchRank;
  /** Vrai si une clé est exactement la requête (article initial non compté). */
  exact: boolean;
  /** Vrai si les mots de la requête ont été trouvés séparément, pas d'un seul tenant. */
  scattered: boolean;
  /** Note de classement : plus elle est haute, plus la réponse est proche. */
  score: number;
  /** Clés de l'index qui ont répondu : à montrer quand rien n'est surligné dans le libellé. */
  matched: string[];
  /** Passages à marquer dans `entry.label`. */
  label: Highlights;
  /** Passages à marquer dans `entry.hint`, s'il y en a un. */
  hint?: Highlights;
}

export interface SearchGroup {
  kind: SearchKind;
  /** Nombre de réponses de ce genre avant la coupe à `limit`. */
  total: number;
  hits: SearchHit[];
}

export interface SearchResults {
  /** Requête normalisée ; vide si rien n'était cherchable. */
  query: string;
  /** Nombre de réponses avant la coupe à `limit`. */
  total: number;
  /** Réponses par genre avant la coupe, zéros compris. */
  totals: Record<SearchKind, number>;
  /** Les `limit` meilleures réponses, tous genres mêlés, de la plus proche à la moins proche. */
  hits: SearchHit[];
  /** Les mêmes réponses par genre ; le genre de la meilleure réponse vient en premier. */
  groups: SearchGroup[];
}

/** Genres de l'index, dans l'ordre du contrat. */
export const SEARCH_KINDS: readonly SearchKind[] = [
  'person',
  'dragon',
  'event',
  'period',
  'war',
  'battle',
  'place',
  'word',
  'path',
];

export const DEFAULT_SEARCH_LIMIT = 24;

/* ------------------------------------------------------------------ rang d'une clé */

const NONE = 0;
const SUBSTRING = 1;
const WORD_START = 2;
const WORD = 3;
const PREFIX = 4;

const RANK_NAMES: readonly MatchRank[] = ['substring', 'substring', 'word-start', 'word', 'prefix'];
const RANK_SCORES: readonly number[] = [0, 100, 200, 300, 400];
/*
 * Bonus étagés : chacun dépasse la somme de tous ceux qui le suivent (50 > 24 + 12 + 4 + 6,
 * 24 > 12 + 4 + 6, 12 > 4 + 6), et leur total reste sous l'écart entre deux rangs (100).
 */
/** Une réponse d'un seul tenant passe devant une réponse éparse de même rang. */
const WHOLE_BONUS = 50;
const KIND_BONUS: Readonly<Partial<Record<SearchKind, number>>> = { person: 24, dragon: 24 };
const EXACT_BONUS = 12;
const VISIBLE_BONUS = 4;
const CLOSENESS_BONUS = 6;

/** Article initial d'une clé, forme relâchée comprise (« l exile ») : on cherche « conquérant », pas « le ». */
const ARTICLE = /^(?:les |le |la |l'|l |the )/;

function articleLength(key: string): number {
  return ARTICLE.exec(key)?.[0].length ?? 0;
}

function rankAt(key: string, needle: string, at: number, lead: number): number {
  if (at === 0 || at === lead) return PREFIX;
  if (!startsWord(key, at)) return SUBSTRING;
  return endsWord(key, at + needle.length) ? WORD : WORD_START;
}

/** Vrai si la clé, avec ou sans son article initial, est exactement `needle`. */
function isExact(key: string, needle: string): boolean {
  return key === needle || key.slice(articleLength(key)) === needle;
}

/** Rang de `needle` dans une clé : sa meilleure occurrence. */
function rankIn(key: string, needle: string): number {
  const lead = articleLength(key);
  let best = NONE;
  for (let at = key.indexOf(needle); at !== -1 && best < PREFIX; at = key.indexOf(needle, at + 1)) {
    best = Math.max(best, rankAt(key, needle, at, lead));
  }
  // Une seule lettre au milieu d'un mot ne désigne rien.
  return needle.length === 1 && best === SUBSTRING ? NONE : best;
}

interface KeyMatch {
  level: number;
  key: string;
  exact: boolean;
}

/** À rang égal, la clé exacte l'emporte, puis la plus courte. */
function beats(found: KeyMatch, best: KeyMatch | null): boolean {
  if (best === null) return true;
  if (found.level !== best.level) return found.level > best.level;
  if (found.exact !== best.exact) return found.exact;
  return found.key.length < best.key.length;
}

/** Meilleure clé pour l'une des formes de la requête. */
function bestKey(keys: readonly string[], needles: readonly string[]): KeyMatch | null {
  let best: KeyMatch | null = null;
  for (const key of keys) {
    for (const needle of needles) {
      const level = rankIn(key, needle);
      if (level === NONE) continue;
      const found: KeyMatch = { level, key, exact: isExact(key, needle) };
      if (beats(found, best)) best = found;
    }
  }
  return best;
}

/** Formes strictes et relâchées d'une requête, sans doublon ni forme vide. */
function needlesOf(needle: string): string[] {
  const loose = normalizeLoose(needle);
  return loose === '' || loose === needle ? [needle] : [needle, loose];
}

/* ------------------------------------------------------------------ index préparé */

interface Prepared {
  entry: SearchEntry;
  order: number;
  /** Texte affiché dans chaque langue, relâché : sert à savoir si la réponse se verra. */
  shown: Record<Lang, string>;
}

function shownIn(label: Localized, hint: Localized | undefined, lang: 'fr' | 'en'): string {
  return normalizeLoose(`${label[lang]} ${hint?.[lang] ?? ''}`);
}

function prepareEntry(entry: SearchEntry, order: number): Prepared {
  const fr = shownIn(entry.label, entry.hint, 'fr');
  const en = shownIn(entry.label, entry.hint, 'en');
  // En haut valyrien, la glose est donnée dans la langue d'appui, que l'on ne connaît pas ici.
  const hv = `${normalizeLoose(entry.label.hv ?? '')} ${fr} ${en}`;
  return { entry, order, shown: { fr, en, hv } };
}

const preparedCache = new WeakMap<readonly SearchEntry[], Prepared[]>();

/** Mémoïsation par tableau d'index : les libellés ne sont normalisés qu'une fois. */
function prepare(entries: readonly SearchEntry[]): Prepared[] {
  let prepared = preparedCache.get(entries);
  if (!prepared) {
    prepared = entries.map(prepareEntry);
    preparedCache.set(entries, prepared);
  }
  return prepared;
}

/* ------------------------------------------------------------------ classement */

interface Candidate {
  item: Prepared;
  level: number;
  exact: boolean;
  scattered: boolean;
  matched: string[];
  score: number;
}

interface Query {
  needle: string;
  needles: string[];
  words: string[];
  looseWords: string[];
}

function parseQuery(needle: string): Query {
  return { needle, needles: needlesOf(needle), words: wordsOf(needle), looseWords: wordsOf(normalizeLoose(needle)) };
}

function bonusOf(item: Prepared, query: Query, lang: Lang, closeness: number): number {
  const visible = query.looseWords.every((word) => item.shown[lang].includes(word));
  return (KIND_BONUS[item.entry.kind] ?? 0) + (visible ? VISIBLE_BONUS : 0) + closeness * CLOSENESS_BONUS;
}

function wholeMatch(item: Prepared, query: Query, lang: Lang): Candidate | null {
  const best = bestKey(item.entry.keys, query.needles);
  if (best === null) return null;
  const closeness = Math.min(1, query.needle.length / best.key.length);
  const bonus = WHOLE_BONUS + (best.exact ? EXACT_BONUS : 0) + bonusOf(item, query, lang, closeness);
  const score = (RANK_SCORES[best.level] ?? 0) + bonus;
  return { item, level: best.level, exact: best.exact, scattered: false, matched: [best.key], score };
}

function scatteredMatch(item: Prepared, query: Query, lang: Lang): Candidate | null {
  if (query.words.length < 2) return null;
  let level = PREFIX;
  const matched: string[] = [];
  for (const word of query.words) {
    const best = bestKey(item.entry.keys, needlesOf(word));
    if (best === null) return null;
    level = Math.min(level, best.level);
    if (!matched.includes(best.key)) matched.push(best.key);
  }
  const score = (RANK_SCORES[level] ?? 0) + bonusOf(item, query, lang, 0);
  return { item, level, exact: false, scattered: true, matched, score };
}

function rankAll(prepared: readonly Prepared[], query: Query, lang: Lang): Candidate[] {
  const found: Candidate[] = [];
  for (const item of prepared) {
    const candidate = wholeMatch(item, query, lang) ?? scatteredMatch(item, query, lang);
    if (candidate) found.push(candidate);
  }
  return found.sort((a, b) => b.score - a.score || a.item.order - b.item.order);
}

/* ------------------------------------------------------------------ réponses */

function highlightsOf(text: Localized, needle: string): Highlights {
  const marks: Highlights = { fr: findRanges(text.fr, needle), en: findRanges(text.en, needle) };
  if (text.hv !== undefined) marks.hv = findRanges(text.hv, needle);
  return marks;
}

function toHit(candidate: Candidate, needle: string): SearchHit {
  const { entry } = candidate.item;
  const hit: SearchHit = {
    entry,
    rank: RANK_NAMES[candidate.level] ?? 'substring',
    exact: candidate.exact,
    scattered: candidate.scattered,
    score: candidate.score,
    matched: candidate.matched,
    label: highlightsOf(entry.label, needle),
  };
  if (entry.hint) hit.hint = highlightsOf(entry.hint, needle);
  return hit;
}

function emptyTotals(): Record<SearchKind, number> {
  return { person: 0, dragon: 0, event: 0, period: 0, war: 0, battle: 0, place: 0, word: 0, path: 0 };
}

/**
 * Regroupe des réponses par genre, sans changer leur ordre à l'intérieur d'un genre.
 * Les genres viennent dans l'ordre de leur première réponse. `totals`, s'il est donné,
 * renseigne le nombre de réponses avant la coupe ; sinon c'est le nombre de réponses reçues.
 */
export function groupHits(hits: readonly SearchHit[], totals?: Readonly<Record<SearchKind, number>>): SearchGroup[] {
  const groups: SearchGroup[] = [];
  const byKind = new Map<SearchKind, SearchGroup>();
  for (const hit of hits) {
    let group = byKind.get(hit.entry.kind);
    if (!group) {
      group = { kind: hit.entry.kind, total: totals?.[hit.entry.kind] ?? 0, hits: [] };
      byKind.set(hit.entry.kind, group);
      groups.push(group);
    }
    group.hits.push(hit);
    if (!totals) group.total = group.hits.length;
  }
  return groups;
}

/**
 * Cherche `query` dans l'index.
 *
 * @param entries index complet (`searchEntries`) ou un sous-ensemble
 * @param query   ce que le lecteur a tapé, tel quel
 * @param lang    langue affichée : elle départage les ex æquo en faveur des réponses qui s'y lisent
 * @param limit   nombre maximal de réponses rendues, tous genres mêlés
 */
export function search(
  entries: readonly SearchEntry[],
  query: string,
  lang: Lang,
  limit: number = DEFAULT_SEARCH_LIMIT,
): SearchResults {
  const needle = normalize(query);
  const totals = emptyTotals();
  if (needle === '') return { query: needle, total: 0, totals, hits: [], groups: [] };
  const ranked = rankAll(prepare(entries), parseQuery(needle), lang);
  for (const candidate of ranked) totals[candidate.item.entry.kind] += 1;
  const kept = Number.isNaN(limit) ? [] : ranked.slice(0, Math.max(0, Math.floor(limit)));
  const hits = kept.map((candidate) => toHit(candidate, needle));
  return { query: needle, total: ranked.length, totals, hits, groups: groupHits(hits, totals) };
}
