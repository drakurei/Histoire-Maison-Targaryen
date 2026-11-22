/**
 * Index de recherche : personnes, dragons, événements, périodes, guerres, batailles, lieux,
 * mots et parcours. Il se suffit à lui-même (libellé, indication, chemin) : chercher ne
 * demande de charger aucun autre jeu de données.
 * Données produites par `scripts/build-content.mjs`.
 */
import data from '@/content/generated/search.json';
import type { SearchEntry } from './types';

interface SearchData {
  entries: SearchEntry[];
}

/*
 * Seul transtypage du module. TypeScript infère du JSON un `kind` de type `string` là où
 * le contrat attend `SearchKind` : la forme exacte est garantie en amont par
 * `scripts/build-content.mjs`.
 */
const typed = data as unknown as SearchData;

/**
 * Entrées de l'index. `keys` contient les formes déjà normalisées (minuscules, sans
 * diacritiques, apostrophe droite), plus une variante sans tirets ni apostrophes : la
 * requête doit recevoir la même normalisation avant d'être comparée.
 */
export const searchEntries: readonly SearchEntry[] = typed.entries;
