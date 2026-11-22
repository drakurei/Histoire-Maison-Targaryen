/**
 * Outils purs de la bibliothèque linguistique de la version 1 : tri, initiales, filtres,
 * ancres et genres du lexique. Aucune présentation ici ; testés par lexiconTools.test.ts.
 */
import type { HvStatus, LexiconEntry } from '@/core/content/types';
import { normalize, wordsOf } from '@/core/search';

/** Ordre de lecture des statuts : du plus sûr au moins sûr (moins d'encre, moins de certitude). */
export const STATUS_ORDER: readonly HvStatus[] = ['atteste', 'derive', 'editorial', 'adaptation'];

/** Clé de tri d'une forme valyrienne : sans macron ni capitale. */
export function sortKey(hv: string): string {
  return normalize(hv);
}

/** Le lexique dans l'ordre alphabétique de la forme valyrienne, macrons ignorés. */
export function sortLexicon(entries: readonly LexiconEntry[]): LexiconEntry[] {
  return [...entries].sort((a, b) => sortKey(a.hv).localeCompare(sortKey(b.hv), 'fr'));
}

/** Initiale de classement (« Ā » range sous « A »). */
export function initialOf(hv: string): string {
  return sortKey(hv).charAt(0).toUpperCase() || '#';
}

/** Rangées groupées par initiale, dans l'ordre reçu. */
export function groupByInitial(entries: readonly LexiconEntry[]): { initial: string; entries: LexiconEntry[] }[] {
  const groups: { initial: string; entries: LexiconEntry[] }[] = [];
  for (const entry of entries) {
    const initial = initialOf(entry.hv);
    const last = groups.at(-1);
    if (last && last.initial === initial) last.entries.push(entry);
    else groups.push({ initial, entries: [entry] });
  }
  return groups;
}

export interface LexiconFilter {
  themes: ReadonlySet<string>;
  statuses: ReadonlySet<string>;
  /** Texte libre : cherché dans la forme, le français et l'anglais, macrons et accents ignorés. */
  query: string;
}

/** Vrai si chaque mot de la requête se trouve dans la forme ou l'une des traductions. */
export function matchesQuery(entry: LexiconEntry, query: string): boolean {
  const words = wordsOf(normalize(query));
  if (words.length === 0) return true;
  const haystack = normalize(`${entry.hv} ${entry.fr} ${entry.en}`);
  return words.every((word) => haystack.includes(word));
}

/** Filtre : un groupe vide ne retient rien de moins ; dans un groupe, les choix s'additionnent. */
export function filterLexicon(entries: readonly LexiconEntry[], filter: LexiconFilter): LexiconEntry[] {
  return entries.filter(
    (entry) =>
      (filter.themes.size === 0 || filter.themes.has(entry.theme)) &&
      (filter.statuses.size === 0 || filter.statuses.has(entry.status)) &&
      matchesQuery(entry, filter.query),
  );
}

/** Nombre d'entrées par valeur d'un champ, dans l'ordre de première apparition. */
export function countBy<K extends string>(entries: readonly LexiconEntry[], pick: (entry: LexiconEntry) => K): Map<K, number> {
  const counts = new Map<K, number>();
  for (const entry of entries) counts.set(pick(entry), (counts.get(pick(entry)) ?? 0) + 1);
  return counts;
}

/** Identifiant d'ancre d'une notice : « #mot-nav.portal ». */
export function entryAnchor(id: string): string {
  return `mot-${id}`;
}

/** Identifiant de notice à partir d'une ancre d'adresse, ou `null`. */
export function entryFromHash(hash: string): string | null {
  const raw = decodeURIComponent(hash.replace(/^#/, ''));
  return raw.startsWith('mot-') ? raw.slice(4) : null;
}

/** Clé d'interface du libellé d'un thème : « parenté » donne « page.lexicon.theme.parente ». */
export function themeKey(theme: string): string {
  return `page.lexicon.theme.${normalize(theme).replace(/[^a-z0-9]+/g, '')}`;
}

/* ------------------------------------------------------------------ genres */

export type Gender = 'lunaire' | 'solaire' | 'terrestre' | 'aquatique';
export const GENDERS: readonly Gender[] = ['lunaire', 'solaire', 'terrestre', 'aquatique'];

export interface GenderedWord {
  entry: LexiconEntry;
  gender: Gender;
  /** Déclinaison telle que la notice la donne : « 3 », ou « 2/6 » quand elle hésite entre deux. */
  declension: string;
}

/** « 1re décl. lunaire », « 3e décl. terrestre » : la classe telle que les notices l'écrivent. */
const CLASS = /(\d(?:\s*(?:re|e)?\s*\/\s*\d)*)\s*(?:re|e)?\s*d[ée]cl(?:\.|inaison)?\s+(lunaire|solaire|terrestre|aquatique)/i;
/** Une notice qui ne fait que supposer la classe ne compte pas. */
const HEDGE = /probabl|vraisembl|non document|non vérifi|par analogie/i;
/** Une forme fléchie (pluriel, collectif d'un autre mot) n'illustre pas la classe : son lemme le fait. */
const INFLECTED = /\b(?:pluriel|collectif) (?:de|réanalysé)/i;

/**
 * Genre documenté d'un mot du lexique, lu dans sa notice. Seules comptent les formes d'un seul
 * mot dont la notice donne la classe sans réserve : un syntagme mêle plusieurs genres, et une
 * classe supposée n'est pas une classe documentée.
 */
export function genderOf(entry: LexiconEntry): GenderedWord | null {
  if (/\s/.test(entry.hv.trim())) return null;
  const note = entry.notes.fr;
  if (HEDGE.test(note) || INFLECTED.test(note)) return null;
  const match = CLASS.exec(note);
  if (!match) return null;
  const gender = match[2]?.toLowerCase() as Gender;
  const declension = (match[1] ?? '').replace(/\s*(?:re|e)\s*/g, '').replace(/\s+/g, '');
  return { entry, gender, declension };
}

/** Les mots documentés, rangés par genre. */
export function wordsByGender(entries: readonly LexiconEntry[]): Map<Gender, GenderedWord[]> {
  const out = new Map<Gender, GenderedWord[]>(GENDERS.map((gender) => [gender, []]));
  for (const entry of entries) {
    const word = genderOf(entry);
    if (word) out.get(word.gender)?.push(word);
  }
  return out;
}

/* ------------------------------------------------------------------ références */

/** Libellé lisible d'un lien de référence : domaine sans « www », puis page décodée. */
export function refLabel(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const title = parsed.searchParams.get('title');
    const page = title ?? decodeURIComponent(parsed.pathname.split('/').filter(Boolean).at(-1) ?? '');
    const readable = page.replace(/_/g, ' ');
    return readable && readable !== 'index.php' ? `${host}, ${readable}` : host;
  } catch {
    return url;
  }
}

/* ------------------------------------------------------------------ typographie */

/**
 * Espaces insécables de la typographie française, posées à l'affichage : les notes du
 * linguiste sont saisies avec des espaces ordinaires, et un « » ne doit jamais commencer
 * une ligne. Sans effet sur un texte qui n'a pas ces espaces.
 */
export function frenchSpacing(text: string): string {
  return text.replace(/« /g, '« ').replace(/ »/g, ' »').replace(/ ([:;?])/g, ' $1');
}
