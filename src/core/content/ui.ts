/**
 * Chaînes d'interface (haut valyrien, français, anglais).
 * Données produites par `scripts/build-content.mjs` : fusion de `content/interface/ui.*.json`.
 * Ce module ne choisit pas la langue : c'est le rôle de `src/core/i18n`.
 */
import data from '@/content/generated/ui.json';
import type { UiString } from './types';

interface UiData {
  strings: UiString[];
}

/*
 * Seul transtypage du module. TypeScript infère du JSON un `status` de type `string` là où
 * le contrat attend `HvStatus` : la forme exacte est garantie en amont par la validation
 * de `scripts/build-content.mjs`, qui refuse aussi toute clé définie deux fois.
 */
const typed = data as unknown as UiData;

export const uiStrings: readonly UiString[] = typed.strings;

export const uiByKey: ReadonlyMap<string, UiString> = new Map(uiStrings.map((entry) => [entry.key, entry]));
