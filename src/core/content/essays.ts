/**
 * Récits longs des périodes, un fichier par période (`src/content/generated/essays/`),
 * chargé avec la page de la période seulement. `Period.essayCount` en donne la longueur
 * sans rien charger.
 */
import { use } from 'react';

import { lazyRecord } from './lazyRecord';
import type { EssaySection } from './types';

interface EssayFile {
  sections: EssaySection[];
}

const record = lazyRecord<EssayFile>(import.meta.glob('/src/content/generated/essays/*.json', { import: 'default' }));

const NONE: readonly EssaySection[] = [];

/** Précharge le récit d'une période (au survol d'un lien, par exemple). */
export function preloadEssay(periodId: string): void {
  void record.load(periodId);
}

/** Sections du récit long de la période ; vide si elle n'en a pas. Suspend au premier appel. */
export function useEssay(periodId: string | undefined): readonly EssaySection[] {
  const file = use(record.load(periodId ?? ''));
  return file?.sections ?? NONE;
}
