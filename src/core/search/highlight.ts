/**
 * Mise en évidence : où, dans un texte affiché, se trouve ce que le lecteur a tapé.
 *
 * Les étendues sont données dans le texte d'origine (avec ses accents, ses macrons, ses
 * majuscules), en unités UTF-16, fin exclue : `text.slice(start, end)` est le passage trouvé.
 *
 * Fichier en TypeScript « effaçable » : importable tel quel par Node 24.
 */
import { fold, loosen, normalize, wordsOf } from './normalize.ts';
import type { Folded } from './normalize.ts';

/** Étendue `[début, fin[` dans le texte d'origine. */
export type TextRange = readonly [start: number, end: number];

/** Morceau de texte, trouvé (`hit`) ou non. */
export interface TextSegment {
  text: string;
  hit: boolean;
}

function isWordCode(code: number): boolean {
  return (code >= 97 && code <= 122) || (code >= 48 && code <= 57) || code > 127;
}

/** Vrai si un mot commence à cette place d'un texte normalisé. */
export function startsWord(text: string, at: number): boolean {
  return at === 0 || !isWordCode(text.charCodeAt(at - 1));
}

/** Vrai si un mot finit juste avant cette place d'un texte normalisé. */
export function endsWord(text: string, at: number): boolean {
  return at >= text.length || !isWordCode(text.charCodeAt(at));
}

function occurrences(folded: Folded, needle: string, wordStartOnly: boolean): TextRange[] {
  const found: TextRange[] = [];
  if (needle === '') return found;
  for (let at = folded.text.indexOf(needle); at !== -1; at = folded.text.indexOf(needle, at + 1)) {
    if (wordStartOnly && !startsWord(folded.text, at)) continue;
    const start = folded.starts[at];
    const end = folded.ends[at + needle.length - 1];
    if (start !== undefined && end !== undefined) found.push([start, end]);
  }
  return found;
}

/** Étendues triées, celles qui se touchent ou se chevauchent réunies. */
export function mergeRanges(ranges: readonly TextRange[]): TextRange[] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: [number, number][] = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else if (end > start) merged.push([start, end]);
  }
  return merged;
}

/** Chaque mot de la requête, là où il commence un mot ; à défaut, partout où il apparaît. */
function wordRanges(loose: Folded, words: readonly string[]): TextRange[] {
  const found: TextRange[] = [];
  for (const word of words) {
    const leading = occurrences(loose, word, true);
    found.push(...(leading.length > 0 ? leading : occurrences(loose, word, false)));
  }
  return found;
}

/**
 * Étendues de `text` qui répondent à `query`. Trois essais, du plus strict au plus large :
 * la requête entière ; la requête entière sans tenir compte des tirets, apostrophes et
 * ponctuations (« port real » dans « Port-Réal ») ; enfin chaque mot séparément.
 * Tableau vide si rien ne répond.
 */
export function findRanges(text: string, query: string): TextRange[] {
  const needle = normalize(query);
  if (needle === '') return [];
  const strict = fold(text);
  const exact = occurrences(strict, needle, false);
  if (exact.length > 0) return mergeRanges(exact);
  const loose = loosen(strict);
  const looseNeedle = loosen(fold(needle)).text;
  const relaxed = occurrences(loose, looseNeedle, false);
  if (relaxed.length > 0) return mergeRanges(relaxed);
  const words = wordsOf(looseNeedle);
  return words.length > 1 ? mergeRanges(wordRanges(loose, words)) : [];
}

/**
 * Découpe `text` selon des étendues : de quoi composer le texte avec ses passages marqués,
 * sans recalculer d'indices dans le composant. Les étendues hors du texte sont rognées.
 */
export function splitByRanges(text: string, ranges: readonly TextRange[]): TextSegment[] {
  const segments: TextSegment[] = [];
  let at = 0;
  for (const [from, to] of mergeRanges(ranges)) {
    const start = Math.max(at, Math.min(from, text.length));
    const end = Math.min(to, text.length);
    if (end <= start) continue;
    if (start > at) segments.push({ text: text.slice(at, start), hit: false });
    segments.push({ text: text.slice(start, end), hit: true });
    at = end;
  }
  if (at < text.length) segments.push({ text: text.slice(at), hit: false });
  return segments;
}
