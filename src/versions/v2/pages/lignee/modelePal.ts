/**
 * Le pal (spec §5.7) mis en rangées : une rangée par génération, le fil sur le pal, et autour
 * de la personne au centre ses grands-parents, ses parents, ses unions, sa fratrie et ses
 * enfants groupés par union. Fonction pure : tout vient du graphe ; le composant ne fait que
 * dessiner ce que ce module range.
 *
 * Une personne n'est jamais écrite deux fois : quand le porteur du fil d'une génération est
 * déjà dans le bloc (parent, conjoint, enfant), c'est sa ligne qui porte l'entaille du pal.
 */
import type { Person, Reliability, Union } from '@/core/content/types';
import { consanguinity, focusOn, kinship } from '@/core/genealogy';
import type { FamilyGraph, FocusView, Kinship } from '@/core/genealogy';

export interface Anneau {
  /** Identifiant du nœud dans le dessin : `ring:<id>`. */
  id: string;
  type: Union['type'] | 'sans-union';
  /** Les deux conjoints ont un ancêtre commun : l'anneau est de sang. */
  sang: boolean;
  /** Ce que le conjoint est pour la personne à laquelle il est uni, par le sang (`kin.*`), ou `null`. */
  parente: Kinship | null;
  certitude: Reliability | null;
}

export type Role = 'grand-parent' | 'parent' | 'centre' | 'conjoint' | 'fratrie' | 'enfant' | 'fil';

export type Ligne =
  | { kind: 'fil'; key: string; person: Person; parente: Kinship | null }
  | { kind: 'tete'; key: string; person: Person; role: 'grand-parent' | 'parent' }
  | { kind: 'conjoint'; key: string; person: Person | null; anneau: Anneau; role: 'grand-parent' | 'parent' | 'conjoint' }
  | { kind: 'centre'; key: string; person: Person }
  | { kind: 'fratrie'; key: string; pleine: Person[]; demi: Person[] }
  | { kind: 'enfants'; key: string; partner: Person | null; enfants: Person[]; anneau: string };

export interface Rangee {
  generation: number;
  /** Rangée du bloc de la personne au centre (et non simple maillon du fil). */
  bloc: boolean;
  lignes: Ligne[];
  /** Porteur du fil de cette génération, s'il y en a un. */
  fil: string | null;
}

/** Un fil de filiation du bloc : d'un anneau (ou d'un parent seul) vers une personne ou un groupe d'enfants. */
export interface Descente {
  from: string;
  to: string;
  /** Filiation contestée, légendaire ou de récit unique : le fil est en pointillé. */
  doute: boolean;
}

export interface ModelePal {
  centre: Person;
  vue: FocusView;
  rangees: Rangee[];
  descentes: Descente[];
}

interface Couple {
  key: string;
  father: Person | null;
  mother: Person | null;
  union: Union | null;
}

function coupleOf(graph: FamilyGraph, childId: string): Couple | null {
  const link = graph.parentageByChild.get(childId);
  const family = graph.familyOfChild.get(childId);
  if (!link && !family) return null;
  const father = link?.father ? (graph.personById.get(link.father) ?? null) : null;
  const mother = link?.mother ? (graph.personById.get(link.mother) ?? null) : null;
  if (!father && !mother) return null;
  const union = family?.unionId ? (graph.unionById.get(family.unionId) ?? null) : null;
  return { key: family?.id ?? `f:${father?.id ?? ''}+${mother?.id ?? ''}`, father, mother, union };
}

function anneauOf(graph: FamilyGraph, id: string, a: Person, b: Person | null, union: Union | null): Anneau {
  const blood = b ? consanguinity(graph, { partners: [a.id, b.id] }) : null;
  return {
    id: `ring:${id}`,
    type: union?.type ?? 'sans-union',
    sang: blood?.consanguineous ?? false,
    parente: blood?.consanguineous ? blood.kinship : null,
    certitude: union?.certainty ?? null,
  };
}

function doubtful(graph: FamilyGraph, childId: string): boolean {
  const certainty = graph.parentageByChild.get(childId)?.certainty;
  return certainty !== undefined && certainty !== 'etabli';
}

/**
 * Lignes d'un couple de parents : la tête (le porteur du fil s'il en fait partie, sinon le
 * père), puis l'anneau et l'autre parent. Rend aussi le nœud d'où descend l'enfant.
 */
function coupleLines(graph: FamilyGraph, couple: Couple, role: 'grand-parent' | 'parent', rank: ReadonlyMap<string, number>): { lignes: Ligne[]; from: string } {
  const pair = [couple.father, couple.mother].filter((person): person is Person => person !== null);
  const headIndex = Math.max(0, pair.findIndex((person) => rank.has(person.id)));
  const head = pair[headIndex] as Person;
  const other = pair[1 - headIndex] ?? null;
  const lignes: Ligne[] = [{ kind: 'tete', key: `t:${head.id}`, person: head, role }];
  if (!other) return { lignes, from: `p:${head.id}` };
  const anneau = anneauOf(graph, couple.key, other, head, couple.union);
  // La parenté est dite depuis la tête : ce que le conjoint est pour elle.
  if (anneau.sang) anneau.parente = kinship(graph, head.id, other.id);
  lignes.push({ kind: 'conjoint', key: `c:${couple.key}`, person: other, anneau, role });
  return { lignes, from: anneau.id };
}

function personIds(lignes: readonly Ligne[]): string[] {
  return lignes.flatMap((ligne) => {
    switch (ligne.kind) {
      case 'fratrie':
        return [...ligne.pleine, ...ligne.demi].map((person) => person.id);
      case 'enfants':
        return ligne.enfants.map((person) => person.id);
      case 'conjoint':
        return ligne.person ? [ligne.person.id] : [];
      default:
        return [ligne.person.id];
    }
  });
}

/** Ajoute la ligne du porteur du fil quand il n'est pas déjà écrit dans le bloc. */
function withThread(graph: FamilyGraph, rangee: Rangee, centreId: string, shown: ReadonlySet<string>): Rangee {
  const { fil } = rangee;
  if (!fil || shown.has(fil)) return rangee;
  const person = graph.personById.get(fil);
  if (!person) return rangee;
  const link = kinship(graph, centreId, fil);
  const ligne: Ligne = { kind: 'fil', key: `f:${fil}`, person, parente: link.relation === 'none' ? null : link };
  const lignes = [...rangee.lignes];
  // Sur la rangée du centre, le centre reste en tête : le fil vient après ses unions.
  const at = rangee.lignes[0]?.kind === 'centre' ? lignes.findIndex((entry) => entry.kind === 'fratrie') : 0;
  lignes.splice(at === -1 ? lignes.length : at, 0, ligne);
  return { ...rangee, lignes };
}

/**
 * Range le pal autour d'une personne. `null` si l'identifiant est inconnu.
 *
 * `threadByGeneration` : le porteur du fil de chaque génération (`mainThread`) ; `rank` : son
 * rang dans le fil. Un couple qui compte un porteur du fil le met en tête, et les couples
 * d'une rangée suivent l'ordre du fil.
 */
export function modelePal(
  graph: FamilyGraph,
  centreId: string,
  threadByGeneration: ReadonlyMap<number, string>,
  rank: ReadonlyMap<string, number>,
): ModelePal | null {
  const vue = focusOn(graph, centreId);
  if (!vue) return null;
  const centre = vue.person;
  const g = centre.generation;
  const thread = (generation: number) => threadByGeneration.get(generation) ?? null;
  const descentes: Descente[] = [];
  const bloc = new Map<number, Ligne[]>();

  // Grands-parents : un couple par parent, une seule fois quand les parents sont frère et sœur.
  const couples = new Map<string, { lignes: Ligne[]; from: string; order: number }>();
  for (const { person: parent } of vue.parents) {
    const couple = coupleOf(graph, parent.id);
    if (!couple) continue;
    let entry = couples.get(couple.key);
    if (!entry) {
      const members = [couple.father, couple.mother].filter((person): person is Person => person !== null);
      const order = Math.min(...members.map((person) => rank.get(person.id) ?? Number.POSITIVE_INFINITY));
      entry = { ...coupleLines(graph, couple, 'grand-parent', rank), order };
      couples.set(couple.key, entry);
    }
    descentes.push({ from: entry.from, to: `p:${parent.id}`, doute: doubtful(graph, parent.id) });
  }
  const grandparents = [...couples.values()].sort((a, b) => a.order - b.order).flatMap((entry) => entry.lignes);
  if (grandparents.length > 0) bloc.set(g - 2, grandparents);

  // Parents.
  const own = coupleOf(graph, centre.id);
  if (own) {
    const { lignes, from } = coupleLines(graph, own, 'parent', rank);
    bloc.set(g - 1, lignes);
    descentes.push({ from, to: `p:${centre.id}`, doute: doubtful(graph, centre.id) });
  }

  // Le centre, ses unions, sa fratrie.
  const centreLines: Ligne[] = [{ kind: 'centre', key: `x:${centre.id}`, person: centre }];
  const childrenLines: Ligne[] = [];
  vue.unions.forEach((entry, index) => {
    const id = entry.union?.id ?? `${centre.id}-${entry.partner?.id ?? 'inconnu'}-${index}`;
    const anneau = anneauOf(graph, id, centre, entry.partner, entry.union);
    if (entry.partner && entry.union) {
      centreLines.push({ kind: 'conjoint', key: `c:${id}`, person: entry.partner, anneau, role: 'conjoint' });
    } else if (!entry.union && entry.children.length > 0) {
      // Enfants nés hors de toute union enregistrée : l'anneau dit « sans union ».
      centreLines.push({ kind: 'conjoint', key: `c:${id}`, person: entry.partner, anneau, role: 'conjoint' });
    }
    if (entry.children.length === 0) return;
    const key = `g:${id}`;
    childrenLines.push({ kind: 'enfants', key, partner: entry.partner, enfants: entry.children, anneau: anneau.id });
    descentes.push({ from: anneau.id, to: key, doute: entry.children.some((child) => doubtful(graph, child.id)) });
  });
  // Un frère ou une sœur épousé est écrit sur sa ligne d'union (« sœur et épouse »), pas deux fois.
  const threadSelf = thread(g);
  const spouses = new Set(vue.unions.flatMap((entry) => (entry.partner ? [entry.partner.id] : [])));
  const keep = (id: string) => id !== threadSelf && !spouses.has(id);
  const pleine = vue.siblings.filter((s) => s.kind === 'full' && keep(s.person.id)).map((s) => s.person);
  const demi = vue.siblings.filter((s) => s.kind === 'half' && keep(s.person.id)).map((s) => s.person);
  if (pleine.length + demi.length > 0) centreLines.push({ kind: 'fratrie', key: `s:${centre.id}`, pleine, demi });
  bloc.set(g, centreLines);
  if (childrenLines.length > 0) bloc.set(g + 1, childrenLines);

  // Toutes les générations du fil, et celles du bloc. Un porteur du fil déjà écrit dans le bloc
  // (un grand-parent d'une génération plus haute, chez les Targaryen) n'est pas répété.
  const shown = new Set([...bloc.values()].flatMap((lignes) => personIds(lignes)));
  const generations = new Set<number>([...threadByGeneration.keys(), ...bloc.keys()]);
  const rangees = [...generations]
    .sort((a, b) => a - b)
    .map((generation): Rangee => {
      const lignes = bloc.get(generation);
      const base: Rangee = { generation, bloc: lignes !== undefined, lignes: lignes ?? [], fil: thread(generation) };
      if (!lignes) {
        const person = base.fil && !shown.has(base.fil) ? graph.personById.get(base.fil) : undefined;
        return person ? { ...base, lignes: [{ kind: 'fil', key: `f:${person.id}`, person, parente: null }] } : base;
      }
      return withThread(graph, base, centre.id, shown);
    })
    .filter((rangee) => rangee.lignes.length > 0);

  return { centre, vue, rangees, descentes };
}

/** Identifiants écrits dans une ligne : sert à savoir laquelle porte l'entaille du fil. */
export function idsOfLigne(ligne: Ligne): string[] {
  return personIds([ligne]);
}
