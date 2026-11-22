/**
 * Biographies rédigées, un fichier par personne (`src/content/generated/biographies/`),
 * chargé avec la fiche de la personne seulement. Toutes les personnes n'en ont pas :
 * `Person.hasBiography` le dit sans rien charger.
 * Données produites par `scripts/build-content.mjs` à partir de `content/characters/biographies/`.
 */
import { use } from 'react';

import { lazyRecord } from './lazyRecord';
import type { Biography } from './types';

const record = lazyRecord<Biography>(
  import.meta.glob('/src/content/generated/biographies/*.json', { import: 'default' }),
);

/** Précharge une biographie (au survol d'un lien, par exemple). */
export function preloadBiography(personId: string): void {
  void record.load(personId);
}

/** Biographie de la personne, ou `undefined`. Suspend au premier appel. */
export function useBiography(personId: string | undefined): Biography | undefined {
  return use(record.load(personId ?? ''));
}
