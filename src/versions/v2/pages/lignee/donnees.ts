/**
 * La lignée, indexée une fois au chargement du bloc : le graphe de `@/core/genealogy`, le fil
 * de filiation (une personne par génération), les souverains et les cavaliers. Aucune
 * présentation ici ; tout ce que la lignée, les personnages et la fiche lisent sur le sang
 * passe par ce module, pour que le graphe ne soit construit qu'une fois (coût linéaire).
 */
import { dragons } from '@/core/content/dragons';
import { getPerson, mainThread, parentage, persons, sovereigns, unions } from '@/core/content/people';
import type { Person, Sovereign } from '@/core/content/types';
import { buildGraph } from '@/core/genealogy';

export const graph = buildGraph(persons, unions, parentage);

/** Le fil : génération -> identifiant de la personne qui la porte sur le pal. */
export const threadByGeneration: ReadonlyMap<number, string> = new Map(
  mainThread.flatMap((id) => {
    const person = getPerson(id);
    return person ? [[person.generation, id] as const] : [];
  }),
);

export const threadIds: ReadonlySet<string> = new Set(mainThread);

/** Rang dans le fil (0 pour Aenar), pour le chiffre de la génération. */
export const threadRank: ReadonlyMap<string, number> = new Map(mainThread.map((id, index) => [id, index]));

export const sovereignById: ReadonlyMap<string, Sovereign> = new Map(sovereigns.map((sovereign) => [sovereign.id, sovereign]));

/** Génération la plus haute du registre. */
export const maxGeneration: number = persons.reduce((max, person) => Math.max(max, person.generation), 0);

/** Les personnes, par génération puis dans l'ordre de la source (listes déroulantes du lien). */
export const personsByGeneration: ReadonlyMap<number, readonly Person[]> = (() => {
  const map = new Map<number, Person[]>();
  for (const person of persons) {
    const list = map.get(person.generation);
    if (list) list.push(person);
    else map.set(person.generation, [person]);
  }
  return new Map([...map].sort((a, b) => a[0] - b[0]));
})();

/** Dragons montés par personne, dans l'ordre du registre des dragons. */
export const dragonsByRider: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const dragon of dragons) {
    for (const rider of dragon.riders) {
      if (!rider.personId) continue;
      const list = map.get(rider.personId);
      if (!list) map.set(rider.personId, [dragon.id]);
      else if (!list.includes(dragon.id)) list.push(dragon.id);
    }
  }
  return map;
})();

/**
 * Bornes connues d'une vie : l'année, sinon la borne de la fourchette que la source donne
 * (« né avant 138 av. C. » donne 138 av. C.) ; `null` quand la source ne dit rien.
 */
export function lifeBounds(person: Person): { born: number | null; died: number | null } {
  return {
    born: person.born ?? person.bornRange?.[0] ?? person.bornRange?.[1] ?? null,
    died: person.died ?? person.diedRange?.[1] ?? person.diedRange?.[0] ?? null,
  };
}

/**
 * La mort est-elle bornée ? Sans année ni fourchette de mort, et sans être dite vivante à la
 * fin du récit, une personne n'a pas d'âge à une année donnée : `ageAt` la croirait vivante
 * pour toujours, ce serait un âge inventé.
 */
export function deathKnown(person: Person): boolean {
  return person.died !== null || person.diedRange !== undefined || person.alive === true;
}

export { persons, sovereigns };
