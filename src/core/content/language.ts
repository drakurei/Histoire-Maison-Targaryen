/**
 * Bibliothèque linguistique : lexique, expressions, leçons de grammaire.
 * Données produites par `scripts/build-content.mjs` à partir de `content/glossary/`
 * et de `content/valyrian/`.
 */
import data from '@/content/generated/language.json';
import type { GrammarLesson, LexiconEntry, Phrase } from './types';

interface LanguageData {
  lexicon: LexiconEntry[];
  phrases: Phrase[];
  grammar: GrammarLesson[];
}

/*
 * Seul transtypage du module. TypeScript infère du JSON des `string` là où le contrat
 * attend des unions littérales (`HvStatus`, `GrammarBlock['kind']`) : la forme exacte est
 * garantie en amont par la validation de `scripts/build-content.mjs`.
 */
const typed = data as unknown as LanguageData;

/** Le lexique d'origine puis ses extensions, dans l'ordre des sources. */
export const lexicon: readonly LexiconEntry[] = typed.lexicon;

export const phrases: readonly Phrase[] = typed.phrases;

/** Leçons dans l'ordre de lecture (`order`). */
export const grammar: readonly GrammarLesson[] = typed.grammar;

const entryById: ReadonlyMap<string, LexiconEntry> = new Map(lexicon.map((entry) => [entry.id, entry]));

/** Entrée du lexique par identifiant (« nav.dragons », « period.5 »…). */
export function getLexiconEntry(id: string): LexiconEntry | undefined {
  return entryById.get(id);
}
