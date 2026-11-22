/**
 * Biographies rédigées. Toutes les personnes n'en ont pas : `Person.hasBiography` le dit
 * sans charger ce module.
 * Données produites par `scripts/build-content.mjs` à partir de `content/characters/biographies/`.
 */
import data from '@/content/generated/biographies.json';
import type { Biography } from './types';

interface BiographiesData {
  biographies: Biography[];
}

/*
 * Seul transtypage du module : la forme est garantie par la validation de
 * `scripts/build-content.mjs`, que le compilateur ne peut pas refaire sur du JSON.
 */
const typed = data as unknown as BiographiesData;

/** Biographies, dans l'ordre des personnes de la généalogie. */
export const biographies: readonly Biography[] = typed.biographies;

const biographyByPerson: ReadonlyMap<string, Biography> = new Map(
  biographies.map((biography) => [biography.personId, biography]),
);

export function getBiography(personId: string): Biography | undefined {
  return biographyByPerson.get(personId);
}
