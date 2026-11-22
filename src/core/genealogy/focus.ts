/**
 * Vue rapprochée d'une personne : ce qu'il faut pour dessiner son entourage immédiat
 * (parents, grands-parents, fratrie, unions et enfants) sans refaire de calcul dans le composant.
 *
 * Fonction pure : tout vient du graphe passé en argument.
 */
import type { Parentage, Person, Union } from '../content/types.ts';
import type { Consanguinity, Family, FamilyGraph, Sibling } from './graph.ts';
import { allegedFatherOf, consanguinity, inbreedingOf, partnerIn, siblingsOf, unionsOf } from './graph.ts';

export type ParentRole = 'father' | 'mother';

export interface FocusParent {
  person: Person;
  role: ParentRole;
}

/**
 * Un grand-parent n'apparaît qu'une fois : quand les parents sont frère et sœur, il est à la
 * fois paternel et maternel et `via` porte les deux côtés.
 */
export interface FocusGrandparent {
  person: Person;
  via: ParentRole[];
}

export interface FocusUnion {
  /** L'autre parent ou conjoint ; `null` quand les sources ne le nomment pas. */
  partner: Person | null;
  /** `null` pour des enfants nés hors de toute union enregistrée. */
  union: Union | null;
  /** Enfants de ce couple, dans l'ordre de la source. */
  children: Person[];
  /** Lien de sang entre les deux conjoints, le partenaire vu depuis la personne (« son oncle ») ; `null` sans partenaire connu. */
  consanguinity: Consanguinity | null;
}

export interface FocusView {
  person: Person;
  /** Père puis mère, pour ceux que le graphe connaît. */
  parents: FocusParent[];
  /** Filiation telle que la source l'enregistre (certitude, note) ; `null` sans parents connus. */
  parentage: Parentage | null;
  /** Union dont la personne est née, si elle est enregistrée. */
  parentsUnion: Union | null;
  /** Lien de sang entre les deux parents ; `null` si l'un des deux manque. */
  parentsConsanguinity: Consanguinity | null;
  /** Père que certaines sources avancent contre la filiation officielle. */
  allegedFather: Person | null;
  grandparents: FocusGrandparent[];
  /** Frères et sœurs, demi-fratrie comprise (`kind`), dans l'ordre de la source. */
  siblings: Sibling[];
  /** Unions par année croissante quand elle est connue, puis enfants nés hors union enregistrée. */
  unions: FocusUnion[];
  /** Coefficient de consanguinité de Wright de la personne (0 si un parent manque). */
  inbreeding: number;
}

function roleOf(link: Parentage | undefined, parent: string): ParentRole {
  return link?.mother === parent ? 'mother' : 'father';
}

function persons(graph: FamilyGraph, ids: readonly string[]): Person[] {
  const list: Person[] = [];
  for (const id of ids) {
    const person = graph.personById.get(id);
    if (person) list.push(person);
  }
  return list;
}

/**
 * Range les unions par année sans jamais comparer une année inconnue : deux voisines ne
 * s'échangent que si leurs deux années sont connues et inversées. L'ordre de la source,
 * chronologique dans nos données, reste la référence.
 */
function byYear(unions: Union[]): Union[] {
  const sorted = [...unions];
  for (let pass = 0; pass < sorted.length; pass += 1) {
    let moved = false;
    for (let i = 0; i + 1 < sorted.length; i += 1) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (!current || !next || current.year === null || next.year === null || current.year <= next.year) continue;
      sorted[i] = next;
      sorted[i + 1] = current;
      moved = true;
    }
    if (!moved) break;
  }
  return sorted;
}

function familyUnion(graph: FamilyGraph, family: Family, id: string): FocusUnion {
  const partnerId = family.parents.find((parent) => parent !== id);
  const partner = partnerId === undefined ? null : (graph.personById.get(partnerId) ?? null);
  return {
    partner,
    union: null,
    children: persons(graph, family.children),
    consanguinity: partner ? consanguinity(graph, { partners: [id, partner.id] }) : null,
  };
}

/**
 * Entourage immédiat d'une personne. `null` si l'identifiant est inconnu.
 */
export function focusOn(graph: FamilyGraph, id: string): FocusView | null {
  const person = graph.personById.get(id);
  if (!person) return null;

  const link = graph.parentageByChild.get(id);
  const parentIds = graph.parentIds.get(id) ?? [];
  const parents: FocusParent[] = persons(graph, parentIds).map((parent) => ({ person: parent, role: roleOf(link, parent.id) }));

  const grandparents: FocusGrandparent[] = [];
  for (const parent of parents) {
    for (const grandparent of persons(graph, graph.parentIds.get(parent.person.id) ?? [])) {
      const known = grandparents.find((entry) => entry.person.id === grandparent.id);
      if (known) {
        if (!known.via.includes(parent.role)) known.via.push(parent.role);
      } else {
        grandparents.push({ person: grandparent, via: [parent.role] });
      }
    }
  }

  const family = graph.familyOfChild.get(id);
  const parentsUnion = family?.unionId ? (graph.unionById.get(family.unionId) ?? null) : null;
  const [first, second] = parentIds;
  const parentsConsanguinity =
    first !== undefined && second !== undefined ? consanguinity(graph, { partners: [first, second] }) : null;

  const unions: FocusUnion[] = [];
  const ownFamilies = graph.familiesOfParent.get(id) ?? [];
  for (const union of byYear(unionsOf(graph, id))) {
    const partner = graph.personById.get(partnerIn(union, id)) ?? null;
    const born = ownFamilies.find((candidate) => candidate.unionId === union.id);
    unions.push({
      partner,
      union,
      children: born ? persons(graph, born.children) : [],
      consanguinity: consanguinity(graph, { partners: [id, partnerIn(union, id)] }),
    });
  }
  for (const born of ownFamilies) if (born.unionId === null) unions.push(familyUnion(graph, born, id));

  return {
    person,
    parents,
    parentage: parentIds.length > 0 ? (link ?? null) : null,
    parentsUnion,
    parentsConsanguinity,
    allegedFather: allegedFatherOf(graph, id),
    grandparents,
    siblings: siblingsOf(graph, id),
    unions,
    inbreeding: inbreedingOf(graph, id),
  };
}
