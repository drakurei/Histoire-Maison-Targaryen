/**
 * Graphe généalogique : index, parcours et parenté.
 *
 * Fonctions pures. Les données (personnes, unions, filiations) arrivent en arguments ;
 * rien n'est lu ici. Le graphe suit la filiation OFFICIELLE (`father`, `mother`) : un père
 * allégué (`allegedFather`) reste consultable par `allegedFatherOf`, il n'entre dans aucun
 * calcul de parenté.
 *
 * Une référence vers une personne absente est ignorée et consignée dans `issues` : on peut
 * donc construire le graphe d'un sous-ensemble (une maison, une période) sans le nettoyer.
 *
 * Fichier en TypeScript « effaçable » : importable tel quel par Node 24.
 */
import type { Parentage, Person, Union } from '../content/types.ts';

/* ------------------------------------------------------------------ types */

/**
 * Fratrie : les enfants d'une même union, ou d'un même couple de parents quand aucune
 * union n'est enregistrée (un seul parent connu, ou deux parents sans union).
 */
export interface Family {
  /** Identifiant de l'union ; à défaut `f:<père>+<mère>` (une moitié vide si le parent est inconnu). */
  id: string;
  unionId: string | null;
  father: string | null;
  mother: string | null;
  /** Parents connus, père d'abord. */
  parents: readonly string[];
  /** Enfants, dans l'ordre de la source. */
  children: readonly string[];
}

export interface GraphIssue {
  kind: 'personne-inconnue' | 'doublon' | 'cycle';
  /** Identifiant concerné (personne, union ou enfant de la filiation). */
  ref: string;
  detail: string;
}

export interface FamilyGraph {
  readonly persons: readonly Person[];
  readonly unions: readonly Union[];
  readonly parentage: readonly Parentage[];
  readonly personById: ReadonlyMap<string, Person>;
  readonly unionById: ReadonlyMap<string, Union>;
  readonly parentageByChild: ReadonlyMap<string, Parentage>;
  /** Rang de chaque personne dans la source : départage tous les ex æquo. */
  readonly rank: ReadonlyMap<string, number>;
  /** Parents connus de chacun, père d'abord (0, 1 ou 2 identifiants). */
  readonly parentIds: ReadonlyMap<string, readonly string[]>;
  readonly childIds: ReadonlyMap<string, readonly string[]>;
  /** Unions de chacun, dans l'ordre de la source. */
  readonly unionIds: ReadonlyMap<string, readonly string[]>;
  readonly families: readonly Family[];
  readonly familyById: ReadonlyMap<string, Family>;
  /** Fratrie de naissance de chacun. */
  readonly familyOfChild: ReadonlyMap<string, Family>;
  /** Fratries dont chacun est parent. */
  readonly familiesOfParent: ReadonlyMap<string, readonly Family[]>;
  /** Profondeur : longueur du plus long chemin de filiation depuis une personne sans parents. */
  readonly depth: ReadonlyMap<string, number>;
  readonly issues: readonly GraphIssue[];
}

/** Une personne et sa distance (en générations) à la personne de départ. */
export interface Relative {
  person: Person;
  distance: number;
}

export interface Sibling {
  person: Person;
  /** `full` : mêmes parents ; `half` : un seul parent commun. */
  kind: 'full' | 'half';
  /** Parents communs, père d'abord. */
  shared: readonly string[];
  /**
   * Vrai quand les sources ne permettent pas de trancher : fratrie dont un seul parent est
   * connu (dite `full` par défaut), ou demi-fratrie dont l'autre parent manque d'un côté.
   */
  assumed: boolean;
}

/** Chemin de filiation : il monte de `a` jusqu'à l'ancêtre commun, puis descend vers `b`. */
export interface Line {
  /** De `a` à `b`, ancêtre commun compris. */
  ids: readonly string[];
  /** Générations montées depuis `a`. */
  up: number;
  /** Générations descendues vers `b`. */
  down: number;
  /** Ancêtre commun emprunté par `ids`. */
  apex: string;
  /** Tous les ancêtres communs situés à la même distance (un couple, le plus souvent). */
  apexes: readonly string[];
}

export type KinRelation =
  | 'self'
  | 'parent'
  | 'child'
  | 'grandparent'
  | 'grandchild'
  | 'greatGrandparent'
  | 'greatGrandchild'
  | 'ancestor'
  | 'descendant'
  | 'sibling'
  | 'halfSibling'
  | 'uncleAunt'
  | 'nephewNiece'
  | 'grandUncleAunt'
  | 'grandNephewNiece'
  | 'firstCousin'
  | 'secondCousin'
  | 'cousin'
  | 'relative'
  | 'none';

export type UnionKinRelation = 'spouse' | 'lover' | 'betrothed';

/** Valeurs à passer à `ui(key, vars)`. */
export interface KinVars {
  /** Degré civil : nombre de générations montées et descendues. */
  degree: number;
  up: number;
  down: number;
  /** Pour les cousins : 1 = germains, 2 = issus de germains… */
  cousinDegree: number;
  /** Pour les cousins : écart de générations (« au premier degré d'éloignement »). */
  removed: number;
}

/** Ce que `b` est pour `a`. */
export interface Kinship {
  /** Lien de sang le plus proche ; `none` s'il n'y a pas d'ancêtre commun dans le graphe. */
  relation: KinRelation;
  /** Clé d'interface, suffixée par le sexe de `b` : `kin.sibling.f`. Sans suffixe pour `kin.self` et `kin.none`. */
  key: string;
  vars: KinVars;
  up: number;
  down: number;
  /** Degré civil (montées + descentes) ; `null` sans lien de sang. */
  degree: number | null;
  /** Degré canonique (la plus longue des deux branches) ; `null` sans lien de sang. */
  canonDegree: number | null;
  /** Vrai si le lien passe par un seul ancêtre commun : demi-frère, demi-oncle, demi-cousin. */
  half: boolean;
  apexes: readonly string[];
  /** Chemin de filiation de `a` à `b` ; vide sans lien de sang. */
  line: readonly string[];
  /** Union entre les deux personnes, s'il y en a une : l'interface peut dire « sœur et épouse ». */
  union: Union | null;
  unionRelation: UnionKinRelation | null;
  /** Clé d'interface de l'union, suffixée par le sexe de `b` : `kin.spouse.f`. */
  unionKey: string | null;
}

export interface Consanguinity {
  /** Vrai si les deux conjoints ont au moins un ancêtre commun dans le graphe (ou si l'un descend de l'autre). */
  consanguineous: boolean;
  /** Lien de sang le plus proche entre les conjoints : le second vu depuis le premier. */
  kinship: Kinship;
  /**
   * Coefficient de parenté des conjoints (Malécot), c'est-à-dire le coefficient de
   * consanguinité de Wright de leurs enfants : 0,25 pour un frère et une sœur de parents
   * non apparentés, 0,125 pour un oncle et sa nièce, 0,0625 pour des cousins germains.
   * Il additionne TOUS les chemins du graphe : les mariages répétés entre proches le font
   * monter au-delà de ces valeurs. Borné par ce que le graphe connaît.
   */
  coefficient: number;
}

/* ------------------------------------------------------------------ construction */

const EMPTY: readonly string[] = [];

function pushTo<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

function familyKey(father: string | null, mother: string | null): string {
  return `f:${father ?? ''}+${mother ?? ''}`;
}

interface FamilyDraft {
  id: string;
  unionId: string | null;
  father: string | null;
  mother: string | null;
  children: string[];
}

/**
 * Construit le graphe et tous ses index. Coût linéaire ; à appeler une fois par jeu de données.
 */
export function buildGraph(
  persons: readonly Person[],
  unions: readonly Union[],
  parentage: readonly Parentage[],
): FamilyGraph {
  const issues: GraphIssue[] = [];
  const personById = new Map<string, Person>();
  const rank = new Map<string, number>();
  const keptPersons: Person[] = [];
  for (const person of persons) {
    if (personById.has(person.id)) {
      issues.push({ kind: 'doublon', ref: person.id, detail: 'personne déclarée deux fois ; la première est gardée' });
      continue;
    }
    rank.set(person.id, keptPersons.length);
    personById.set(person.id, person);
    keptPersons.push(person);
  }

  const unionById = new Map<string, Union>();
  const unionIds = new Map<string, string[]>();
  const keptUnions: Union[] = [];
  for (const union of unions) {
    const [a, b] = union.partners;
    if (unionById.has(union.id)) {
      issues.push({ kind: 'doublon', ref: union.id, detail: 'union déclarée deux fois ; la première est gardée' });
      continue;
    }
    if (!personById.has(a) || !personById.has(b) || a === b) {
      issues.push({ kind: 'personne-inconnue', ref: union.id, detail: 'union ignorée : un conjoint est absent du graphe' });
      continue;
    }
    unionById.set(union.id, union);
    keptUnions.push(union);
    pushTo(unionIds, a, union.id);
    pushTo(unionIds, b, union.id);
  }

  // Filiations : une par enfant, parents inconnus ramenés à null.
  const parentageByChild = new Map<string, Parentage>();
  const rawParents = new Map<string, string[]>();
  const keptParentage: Parentage[] = [];
  for (const link of parentage) {
    if (!personById.has(link.child)) {
      issues.push({ kind: 'personne-inconnue', ref: link.child, detail: 'filiation ignorée : l’enfant est absent du graphe' });
      continue;
    }
    if (parentageByChild.has(link.child)) {
      issues.push({ kind: 'doublon', ref: link.child, detail: 'deux filiations pour le même enfant ; la première est gardée' });
      continue;
    }
    const known: string[] = [];
    for (const parent of [link.father, link.mother]) {
      if (parent === null) continue;
      if (!personById.has(parent) || parent === link.child) {
        issues.push({ kind: 'personne-inconnue', ref: link.child, detail: `parent « ${parent} » absent du graphe` });
      } else if (!known.includes(parent)) {
        known.push(parent);
      }
    }
    parentageByChild.set(link.child, link);
    keptParentage.push(link);
    rawParents.set(link.child, known);
  }

  // Un cycle de filiation est une erreur de données : on coupe l'arête qui le ferme.
  const parentIds = breakCycles(keptPersons, rawParents, issues);

  const childIds = new Map<string, string[]>();
  const drafts = new Map<string, FamilyDraft>();
  const draftOfChild = new Map<string, FamilyDraft>();
  for (const link of keptParentage) {
    const known = parentIds.get(link.child) ?? EMPTY;
    if (known.length === 0) continue;
    for (const parent of known) pushTo(childIds, parent, link.child);
    const father = link.father !== null && known.includes(link.father) ? link.father : null;
    const mother = link.mother !== null && known.includes(link.mother) ? link.mother : null;
    const union = link.union === null ? undefined : unionById.get(link.union);
    const matches = union !== undefined && known.every((parent) => union.partners.includes(parent));
    const id = matches ? union.id : familyKey(father, mother);
    let draft = drafts.get(id);
    if (!draft) {
      draft = { id, unionId: matches ? union.id : null, father, mother, children: [] };
      drafts.set(id, draft);
    }
    draft.children.push(link.child);
    draftOfChild.set(link.child, draft);
  }

  const families: Family[] = [];
  const familyById = new Map<string, Family>();
  const familyOfChild = new Map<string, Family>();
  const familiesOfParent = new Map<string, Family[]>();
  for (const draft of drafts.values()) {
    const parents = [draft.father, draft.mother].filter((id): id is string => id !== null);
    const family: Family = { ...draft, parents };
    families.push(family);
    familyById.set(family.id, family);
    for (const child of family.children) familyOfChild.set(child, family);
    for (const parent of parents) pushTo(familiesOfParent, parent, family);
  }

  const depth = new Map<string, number>();
  const depthOf = (id: string): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    let value = 0;
    for (const parent of parentIds.get(id) ?? EMPTY) value = Math.max(value, depthOf(parent) + 1);
    depth.set(id, value);
    return value;
  };
  for (const person of keptPersons) depthOf(person.id);

  return {
    persons: keptPersons,
    unions: keptUnions,
    parentage: keptParentage,
    personById,
    unionById,
    parentageByChild,
    rank,
    parentIds,
    childIds,
    unionIds,
    families,
    familyById,
    familyOfChild,
    familiesOfParent,
    depth,
    issues,
  };
}

/** Parcours en profondeur des parents ; l'arête qui revient sur le chemin en cours est retirée. */
function breakCycles(
  persons: readonly Person[],
  rawParents: ReadonlyMap<string, readonly string[]>,
  issues: GraphIssue[],
): Map<string, string[]> {
  const clean = new Map<string, string[]>();
  const state = new Map<string, 1 | 2>();
  const visit = (id: string): void => {
    state.set(id, 1);
    const kept: string[] = [];
    for (const parent of rawParents.get(id) ?? EMPTY) {
      const seen = state.get(parent);
      if (seen === 1) {
        issues.push({ kind: 'cycle', ref: id, detail: `« ${parent} » serait son propre ancêtre ; lien retiré` });
        continue;
      }
      if (seen === undefined) visit(parent);
      kept.push(parent);
    }
    clean.set(id, kept);
    state.set(id, 2);
  };
  for (const person of persons) if (!state.has(person.id)) visit(person.id);
  return clean;
}

/* ------------------------------------------------------------------ voisinage immédiat */

function personsOf(graph: FamilyGraph, ids: readonly string[]): Person[] {
  const list: Person[] = [];
  for (const id of ids) {
    const person = graph.personById.get(id);
    if (person) list.push(person);
  }
  return list;
}

/** Parents connus, père d'abord. */
export function parentsOf(graph: FamilyGraph, id: string): Person[] {
  return personsOf(graph, graph.parentIds.get(id) ?? EMPTY);
}

/** Enfants de toutes les unions, dans l'ordre de la source. */
export function childrenOf(graph: FamilyGraph, id: string): Person[] {
  return personsOf(graph, graph.childIds.get(id) ?? EMPTY);
}

/** Unions de la personne, dans l'ordre de la source. */
export function unionsOf(graph: FamilyGraph, id: string): Union[] {
  const list: Union[] = [];
  for (const unionId of graph.unionIds.get(id) ?? EMPTY) {
    const union = graph.unionById.get(unionId);
    if (union) list.push(union);
  }
  return list;
}

/** L'autre conjoint d'une union. */
export function partnerIn(union: Pick<Union, 'partners'>, id: string): string {
  return union.partners[0] === id ? union.partners[1] : union.partners[0];
}

/** Conjoints (mariages, liaisons, fiançailles), sans doublon, dans l'ordre des unions. */
export function spousesOf(graph: FamilyGraph, id: string): Person[] {
  const ids: string[] = [];
  for (const union of unionsOf(graph, id)) {
    const partner = partnerIn(union, id);
    if (!ids.includes(partner)) ids.push(partner);
  }
  return personsOf(graph, ids);
}

/** Père que certaines sources avancent contre la filiation officielle, s'il est dans le graphe. */
export function allegedFatherOf(graph: FamilyGraph, id: string): Person | null {
  const alleged = graph.parentageByChild.get(id)?.allegedFather;
  return alleged === undefined ? null : (graph.personById.get(alleged) ?? null);
}

/**
 * Frères et sœurs : toute personne qui partage au moins un parent connu, dans l'ordre de la
 * source. Les demi-frères et demi-sœurs sont marqués `half`.
 */
export function siblingsOf(graph: FamilyGraph, id: string): Sibling[] {
  const own = graph.parentIds.get(id) ?? EMPTY;
  if (own.length === 0) return [];
  const candidates = new Set<string>();
  for (const parent of own) for (const child of graph.childIds.get(parent) ?? EMPTY) if (child !== id) candidates.add(child);
  const list: Sibling[] = [];
  for (const other of candidates) {
    const person = graph.personById.get(other);
    if (!person) continue;
    const theirs = graph.parentIds.get(other) ?? EMPTY;
    const shared = own.filter((parent) => theirs.includes(parent));
    if (shared.length === 2) {
      list.push({ person, kind: 'full', shared, assumed: false });
    } else if (own.length === 1 && theirs.length === 1) {
      // Un seul parent connu des deux côtés : rien ne dit que l'autre diffère.
      list.push({ person, kind: 'full', shared, assumed: true });
    } else {
      list.push({ person, kind: 'half', shared, assumed: own.length < 2 || theirs.length < 2 });
    }
  }
  return list.sort((a, b) => rankOf(graph, a.person.id) - rankOf(graph, b.person.id));
}

function rankOf(graph: FamilyGraph, id: string): number {
  return graph.rank.get(id) ?? Number.MAX_SAFE_INTEGER;
}

/* ------------------------------------------------------------------ ascendance, descendance */

/** Distance la plus courte vers chaque personne atteinte en suivant `next`, départ compris (0). */
function distances(start: string, next: (id: string) => readonly string[]): Map<string, number> {
  const found = new Map<string, number>([[start, 0]]);
  let frontier = [start];
  let step = 0;
  while (frontier.length > 0) {
    step += 1;
    const following: string[] = [];
    for (const id of frontier) {
      for (const neighbour of next(id)) {
        if (found.has(neighbour)) continue;
        found.set(neighbour, step);
        following.push(neighbour);
      }
    }
    frontier = following;
  }
  return found;
}

function relatives(graph: FamilyGraph, id: string, next: (id: string) => readonly string[]): Relative[] {
  if (!graph.personById.has(id)) return [];
  const list: Relative[] = [];
  for (const [other, distance] of distances(id, next)) {
    const person = graph.personById.get(other);
    if (person && other !== id) list.push({ person, distance });
  }
  return list.sort((a, b) => a.distance - b.distance || rankOf(graph, a.person.id) - rankOf(graph, b.person.id));
}

/** Tous les ancêtres, du plus proche au plus lointain. Un ancêtre atteint par plusieurs branches n'apparaît qu'une fois, à sa distance la plus courte. */
export function ancestorsOf(graph: FamilyGraph, id: string): Relative[] {
  return relatives(graph, id, (current) => graph.parentIds.get(current) ?? EMPTY);
}

/** Tous les descendants, du plus proche au plus lointain. */
export function descendantsOf(graph: FamilyGraph, id: string): Relative[] {
  return relatives(graph, id, (current) => graph.childIds.get(current) ?? EMPTY);
}

/* ------------------------------------------------------------------ chemin de filiation */

/** Remonte de `from` jusqu'à `to` par le plus court chemin de parents (père d'abord à égalité). */
function climb(graph: FamilyGraph, from: string, to: string): string[] {
  const previous = new Map<string, string>();
  let frontier = [from];
  const seen = new Set<string>([from]);
  while (frontier.length > 0 && !seen.has(to)) {
    const following: string[] = [];
    for (const id of frontier) {
      for (const parent of graph.parentIds.get(id) ?? EMPTY) {
        if (seen.has(parent)) continue;
        seen.add(parent);
        previous.set(parent, id);
        following.push(parent);
      }
    }
    frontier = following;
  }
  const path = [to];
  let cursor = to;
  while (cursor !== from) {
    const before = previous.get(cursor);
    if (before === undefined) return [];
    path.push(before);
    cursor = before;
  }
  return path.reverse();
}

/**
 * Chemin de filiation le plus court entre deux personnes : il monte de `a` vers un ancêtre
 * commun puis descend vers `b` (ligne directe si l'un descend de l'autre). `null` si les
 * deux personnes n'ont aucun ancêtre commun dans le graphe : une alliance n'est pas une filiation.
 *
 * À longueur égale : la branche la plus longue la plus courte possible (degré canonique),
 * puis le moins de montées, puis l'ancêtre le premier dans la source.
 */
export function lineBetween(graph: FamilyGraph, a: string, b: string): Line | null {
  if (!graph.personById.has(a) || !graph.personById.has(b)) return null;
  const parents = (id: string): readonly string[] => graph.parentIds.get(id) ?? EMPTY;
  const above = distances(a, parents);
  const aboveB = distances(b, parents);
  let best: { apex: string; up: number; down: number } | null = null;
  let apexes: string[] = [];
  for (const [candidate, up] of above) {
    const down = aboveB.get(candidate);
    if (down === undefined) continue;
    const order = best === null ? -1 : compareBranches(up, down, best.up, best.down);
    if (best === null || order < 0) {
      best = { apex: candidate, up, down };
      apexes = [candidate];
    } else if (order === 0) {
      apexes.push(candidate);
      if (rankOf(graph, candidate) < rankOf(graph, best.apex)) best = { apex: candidate, up, down };
    }
  }
  if (best === null) return null;
  apexes.sort((x, y) => rankOf(graph, x) - rankOf(graph, y));
  const rising = climb(graph, a, best.apex);
  const falling = climb(graph, b, best.apex).reverse();
  return { ids: [...rising, ...falling.slice(1)], up: best.up, down: best.down, apex: best.apex, apexes };
}

function compareBranches(up: number, down: number, bestUp: number, bestDown: number): number {
  return up + down - (bestUp + bestDown) || Math.max(up, down) - Math.max(bestUp, bestDown) || up - bestUp;
}

/* ------------------------------------------------------------------ parenté */

const SEXED: ReadonlySet<KinRelation> = new Set<KinRelation>([
  'parent',
  'child',
  'grandparent',
  'grandchild',
  'greatGrandparent',
  'greatGrandchild',
  'ancestor',
  'descendant',
  'sibling',
  'halfSibling',
  'uncleAunt',
  'nephewNiece',
  'grandUncleAunt',
  'grandNephewNiece',
  'firstCousin',
  'secondCousin',
  'cousin',
  'relative',
]);

const UNION_RELATION: Readonly<Record<Union['type'], UnionKinRelation>> = {
  mariage: 'spouse',
  liaison: 'lover',
  fiancailles: 'betrothed',
};

/**
 * Toutes les clés d'interface que `kinship` peut rendre, à déclarer dans
 * `content/interface/ui.json`. Variables disponibles : `degree`, `up`, `down`,
 * `cousinDegree`, `removed`.
 */
export const KIN_UI_KEYS: readonly string[] = [
  'kin.self',
  'kin.none',
  ...[...SEXED].flatMap((relation) => [`kin.${relation}.m`, `kin.${relation}.f`]),
  ...Object.values(UNION_RELATION).flatMap((relation) => [`kin.${relation}.m`, `kin.${relation}.f`]),
];

function relationOf(up: number, down: number, sharedApexes: number): KinRelation {
  if (up === 0 && down === 0) return 'self';
  if (up === 0) return down === 1 ? 'child' : down === 2 ? 'grandchild' : down === 3 ? 'greatGrandchild' : 'descendant';
  if (down === 0) return up === 1 ? 'parent' : up === 2 ? 'grandparent' : up === 3 ? 'greatGrandparent' : 'ancestor';
  if (up === 1 && down === 1) return sharedApexes >= 2 ? 'sibling' : 'halfSibling';
  if (down === 1) return up === 2 ? 'uncleAunt' : up === 3 ? 'grandUncleAunt' : 'relative';
  if (up === 1) return down === 2 ? 'nephewNiece' : down === 3 ? 'grandNephewNiece' : 'relative';
  if (up === 2 && down === 2) return 'firstCousin';
  if (up === 3 && down === 3) return 'secondCousin';
  return 'cousin';
}

function unionBetween(graph: FamilyGraph, a: string, b: string): Union | null {
  if (a === b) return null;
  let found: Union | null = null;
  for (const union of unionsOf(graph, a)) {
    if (partnerIn(union, a) !== b) continue;
    // Un mariage l'emporte sur une liaison ou des fiançailles entre les mêmes personnes.
    if (found === null || (union.type === 'mariage' && found.type !== 'mariage')) found = union;
  }
  return found;
}

/**
 * Ce que `b` est pour `a` : lien de sang le plus proche (clé d'interface et degré), et
 * l'union qui les lie s'il y en a une. Chez les Targaryen les deux coexistent souvent.
 *
 * Deux personnes de même fratrie connue par un seul parent sont dites `sibling`, comme le
 * font les sources ; `siblingsOf` porte la réserve (`assumed`).
 */
export function kinship(graph: FamilyGraph, a: string, b: string): Kinship {
  const target = graph.personById.get(b);
  const suffix = target ? `.${target.sex}` : '';
  const union = graph.personById.has(a) && target ? unionBetween(graph, a, b) : null;
  const unionRelation = union ? UNION_RELATION[union.type] : null;
  const unionKey = unionRelation ? `kin.${unionRelation}${suffix}` : null;
  const line = lineBetween(graph, a, b);
  if (line === null) {
    return {
      relation: 'none',
      key: 'kin.none',
      vars: { degree: 0, up: 0, down: 0, cousinDegree: 0, removed: 0 },
      up: 0,
      down: 0,
      degree: null,
      canonDegree: null,
      half: false,
      apexes: [],
      line: [],
      union,
      unionRelation,
      unionKey,
    };
  }
  const { up, down } = line;
  const collateral = up > 0 && down > 0;
  let shared = line.apexes.length;
  if (up === 1 && down === 1 && shared === 1) {
    // Fratrie connue par un seul parent des deux côtés : même fratrie, pas demi-fratrie.
    const pa = graph.parentIds.get(a) ?? EMPTY;
    const pb = graph.parentIds.get(b) ?? EMPTY;
    if (pa.length === 1 && pb.length === 1) shared = 2;
  }
  const relation = relationOf(up, down, shared);
  const cousinDegree = collateral ? Math.min(up, down) - 1 : 0;
  return {
    relation,
    key: SEXED.has(relation) ? `kin.${relation}${suffix}` : `kin.${relation}`,
    vars: { degree: up + down, up, down, cousinDegree, removed: collateral ? Math.abs(up - down) : 0 },
    up,
    down,
    degree: up + down,
    canonDegree: Math.max(up, down),
    half: collateral && shared === 1,
    apexes: line.apexes,
    line: line.ids,
    union,
    unionRelation,
    unionKey,
  };
}

/* ------------------------------------------------------------------ consanguinité */

const coefficientCache = new WeakMap<FamilyGraph, Map<string, number>>();

/**
 * Coefficient de parenté de Malécot entre deux personnes : probabilité que deux gènes tirés
 * au hasard, un chez chacune, viennent du même ancêtre. Récurrence classique : on développe
 * toujours la personne la plus profonde, qui ne peut pas être l'ancêtre de l'autre.
 */
export function kinshipCoefficient(graph: FamilyGraph, a: string, b: string): number {
  if (!graph.personById.has(a) || !graph.personById.has(b)) return 0;
  let cache = coefficientCache.get(graph);
  if (!cache) {
    cache = new Map<string, number>();
    coefficientCache.set(graph, cache);
  }
  const memo = cache;
  const depthOf = (id: string): number => graph.depth.get(id) ?? 0;
  const phi = (x: string, y: string): number => {
    const key = x < y ? `${x}|${y}` : `${y}|${x}`;
    const known = memo.get(key);
    if (known !== undefined) return known;
    let value: number;
    if (x === y) {
      const parents = graph.parentIds.get(x) ?? EMPTY;
      const [first, second] = parents;
      value = 0.5 * (1 + (first !== undefined && second !== undefined ? phi(first, second) : 0));
    } else {
      const swap = depthOf(x) < depthOf(y);
      const deep = swap ? y : x;
      const other = swap ? x : y;
      value = 0;
      for (const parent of graph.parentIds.get(deep) ?? EMPTY) value += 0.5 * phi(parent, other);
    }
    memo.set(key, value);
    return value;
  };
  return phi(a, b);
}

/** Coefficient de consanguinité de Wright d'une personne : coefficient de parenté de ses deux parents. 0 si un parent manque. */
export function inbreedingOf(graph: FamilyGraph, id: string): number {
  const [first, second] = graph.parentIds.get(id) ?? EMPTY;
  return first !== undefined && second !== undefined ? kinshipCoefficient(graph, first, second) : 0;
}

/**
 * Les deux conjoints d'une union sont-ils parents par le sang, et à quel degré.
 * Accepte une `Union` ou tout objet portant `partners` (un couple de parents sans union).
 */
export function consanguinity(graph: FamilyGraph, union: Pick<Union, 'partners'>): Consanguinity {
  const [a, b] = union.partners;
  const link = kinship(graph, a, b);
  return {
    consanguineous: link.relation !== 'none' && link.relation !== 'self',
    kinship: link,
    coefficient: kinshipCoefficient(graph, a, b),
  };
}

/* ------------------------------------------------------------------ générations */

/**
 * Générations recalculées selon la convention de la source : 0 pour qui n'a ni parents ni
 * conjoint situé ; 1 + la plus grande génération des parents ; pour un conjoint sans
 * ascendance dans le graphe, la génération de son premier conjoint situé (ou de l'autre
 * parent de ses enfants). Sert à contrôler le champ `generation` et à le suppléer.
 */
export function generationsOf(graph: FamilyGraph): Map<string, number> {
  const generation = new Map<string, number>();
  const partnersOf = (id: string): string[] => {
    const list = unionsOf(graph, id).map((union) => partnerIn(union, id));
    for (const family of graph.familiesOfParent.get(id) ?? []) {
      for (const parent of family.parents) if (parent !== id && !list.includes(parent)) list.push(parent);
    }
    return list;
  };
  const rooted = (id: string): boolean => (graph.parentIds.get(id) ?? EMPTY).length > 0;
  let pending = graph.persons.map((person) => person.id);
  while (pending.length > 0) {
    const left: string[] = [];
    for (const id of pending) {
      const parents = graph.parentIds.get(id) ?? EMPTY;
      if (parents.length > 0) {
        const values = parents.map((parent) => generation.get(parent));
        if (values.every((value): value is number => value !== undefined)) generation.set(id, Math.max(...values) + 1);
        else left.push(id);
        continue;
      }
      const partners = partnersOf(id);
      if (partners.length === 0) {
        generation.set(id, 0);
        continue;
      }
      // Le conjoint qui a des parents dans le graphe fait foi ; sinon un conjoint déjà situé.
      const anchor = partners.find((partner) => rooted(partner) && generation.has(partner)) ??
        (partners.some(rooted) ? undefined : partners.find((partner) => generation.has(partner)));
      const value = anchor === undefined ? undefined : generation.get(anchor);
      if (value !== undefined) generation.set(id, value);
      else left.push(id);
    }
    if (left.length === pending.length) {
      // Aucun progrès : couple fondateur sans ascendance. Le premier dans la source ouvre la génération 0.
      const founder = left.find((id) => !rooted(id)) ?? left[0];
      if (founder !== undefined) generation.set(founder, 0);
      pending = left.filter((id) => id !== founder);
    } else {
      pending = left;
    }
  }
  return generation;
}
