/**
 * Lignée : personnes, unions, filiations, souverains et passages de couronne.
 * Données produites par `scripts/build-content.mjs` à partir de `content/genealogy/`
 * et de `content/timeline/sovereigns.json`.
 */
import data from '@/content/generated/people.json';
import type { Localized, Parentage, Person, SourceRef, Sovereign, Succession, Union } from './types';

/**
 * Prétendant que les listes officielles des rois ne comptent pas (Aegon le Sans-Couronne,
 * les Feunoyr, Viserys « III »…). Certains ne sont pas des personnes de la généalogie :
 * ils n'ont donc qu'un nom, des années et une note.
 */
export interface UncountedClaimant {
  name: Localized;
  /** Années de la prétention, telles que la source les écrit (« 42–43 », « depuis 298 »). */
  years: Localized;
  note: Localized;
  sources: SourceRef[];
}

interface PeopleData {
  persons: Person[];
  unions: Union[];
  parentage: Parentage[];
  sovereigns: Sovereign[];
  successions: Succession[];
  mainThread: string[];
  uncountedClaimants: UncountedClaimant[];
}

/*
 * Seul transtypage du module. TypeScript infère du JSON des `string` et des tableaux là où
 * le contrat attend des unions littérales et des couples (`partners`, `reign`) : la forme
 * exacte est garantie en amont par la validation de `scripts/build-content.mjs`.
 */
const people = data as unknown as PeopleData;

/** Les personnes de la généalogie, dans l'ordre de la source (par génération). */
export const persons: readonly Person[] = people.persons;

export const unions: readonly Union[] = people.unions;

/** Une filiation par enfant. */
export const parentage: readonly Parentage[] = people.parentage;

/** Les dix-sept rois comptés et Rhaenyra à sa place chronologique (sans numéro d'ordre). */
export const sovereigns: readonly Sovereign[] = people.sovereigns;

/** Passages de couronne, dans l'ordre (`order` 0 = fondation). */
export const successions: readonly Succession[] = people.successions;

/** Identifiants du fil de filiation directe, d'Aenar à Daenerys : une personne par génération. */
export const mainThread: readonly string[] = people.mainThread;

export const uncountedClaimants: readonly UncountedClaimant[] = people.uncountedClaimants;

const personById: ReadonlyMap<string, Person> = new Map(persons.map((person) => [person.id, person]));

export function getPerson(id: string): Person | undefined {
  return personById.get(id);
}
