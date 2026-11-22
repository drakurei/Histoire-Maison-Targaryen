/**
 * Ce que la lignée et l'index des personnages lisent du graphe : le graphe lui-même (construit
 * une fois), les noms courts, les années en notation généalogique, le fil du sang régnant et
 * les boucles des unions consanguines. Aucune présentation ici, aucune chaîne d'interface.
 */
import { dragons } from '@/core/content/dragons';
import { mainThread, parentage, persons, sovereigns, successions, unions } from '@/core/content/people';
import type { Person, SupportLang, Union } from '@/core/content/types';
import { buildGraph, lineBetween } from '@/core/genealogy';
import type { FamilyGraph } from '@/core/genealogy';
import { formatYear } from '@/core/i18n';

/** Le graphe complet de la dynastie, construit une seule fois. */
export const graph: FamilyGraph = buildGraph(persons, unions, parentage);

const EN_DASH = '–';
const NBSP = ' ';
const QUALIFIER = /\s*\(([^)]*)\)\s*$/;
const HOUSE_SUFFIX = / Targaryen$/;

/** Nom d'usage, sans le nom de maison des Targaryen ni la précision entre parenthèses. */
export function shortName(person: Person, reading: SupportLang): string {
  return person.name[reading].replace(QUALIFIER, '').replace(HOUSE_SUFFIX, '');
}

/** Nom d'index : le nom d'usage et la précision qui distingue deux homonymes (« fille d'Aemon »). */
export function indexName(person: Person, reading: SupportLang): { main: string; qualifier: string | null } {
  const full = person.name[reading];
  const match = QUALIFIER.exec(full);
  const main = full.replace(QUALIFIER, '').replace(HOUSE_SUFFIX, '');
  return { main, qualifier: match?.[1] ?? null };
}

/**
 * Années en notation généalogique : « 97–130 apr. C. », « ° 284 apr. C. », « † 37 apr. C. ».
 * `null` quand les sources ne datent rien.
 */
export function lifeYears(person: Person, reading: SupportLang): string | null {
  const { born, died } = person;
  if (born !== null && died !== null) {
    if (born === died) return formatYear(born, reading);
    if ((born < 0) === (died < 0)) {
      const era = formatYear(died, reading).split(NBSP).slice(1).join(NBSP);
      return `${Math.abs(born)}${EN_DASH}${Math.abs(died)}${NBSP}${era}`;
    }
    return `${formatYear(born, reading)}${NBSP}${EN_DASH} ${formatYear(died, reading)}`;
  }
  if (born !== null) return `°${NBSP}${formatYear(born, reading)}`;
  if (died !== null) return `†${NBSP}${formatYear(died, reading)}`;
  return null;
}

/** Années serrées pour l'arbre : nombres seuls après la Conquête, sigle seulement avant. */
export function treeYears(person: Person, reading: SupportLang): string {
  const one = (year: number | null): string => (year === null ? '?' : year < 0 ? formatYear(year, reading) : String(year));
  if (person.born === null && person.died === null) return '';
  if (person.alive && person.died === null) return `${one(person.born)}${EN_DASH}`;
  return `${one(person.born)}${EN_DASH}${one(person.died)}`;
}

/** Arête de filiation, du parent vers l'enfant. */
export function edgeKey(parent: string, child: string): string {
  return `${parent}>${child}`;
}

/** Arêtes d'un chemin de filiation (`lineBetween`), chacune orientée du parent vers l'enfant. */
function pathEdges(ids: readonly string[]): string[] {
  const edges: string[] = [];
  for (let i = 0; i + 1 < ids.length; i += 1) {
    const x = ids[i];
    const y = ids[i + 1];
    if (x === undefined || y === undefined) continue;
    const yIsParent = (graph.parentIds.get(x) ?? []).includes(y);
    edges.push(yIsParent ? edgeKey(y, x) : edgeKey(x, y));
  }
  return edges;
}

/**
 * Le sang de la couronne : le fil direct d'Aenar à Daenerys, et le chemin de filiation qui
 * relie chaque souverain à celui qu'il remplace (un frère passe par leur père commun).
 */
function rulingEdges(): ReadonlySet<string> {
  const edges = new Set<string>(pathEdges(mainThread));
  for (const succession of successions) {
    if (!succession.from) continue;
    const line = lineBetween(graph, succession.from, succession.to);
    if (line) for (const edge of pathEdges(line.ids)) edges.add(edge);
  }
  return edges;
}

export const RULING_EDGES: ReadonlySet<string> = rulingEdges();

/** La boucle d'une union consanguine : les filiations qui mènent des deux conjoints à leur ancêtre commun. */
export function loopEdges(union: Pick<Union, 'partners'>): string[] {
  const line = lineBetween(graph, union.partners[0], union.partners[1]);
  return line ? pathEdges(line.ids) : [];
}

/** Toutes les boucles du sang, par union. */
export const LOOPS: ReadonlyMap<string, readonly string[]> = new Map(
  unions.map((union) => [union.id, loopEdges(union)] as const).filter(([, edges]) => edges.length > 0),
);

/** Vrai pour une personne née hors de l'arbre, venue par alliance. */
export function marriedIn(id: string): boolean {
  return (graph.parentIds.get(id)?.length ?? 0) === 0 && (graph.unionIds.get(id)?.length ?? 0) > 0 && graph.depth.get(id) === 0;
}

/** Cavaliers de dragon, d'après les registres des dragons. */
export const RIDERS: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const dragon of dragons) {
    for (const rider of dragon.riders) {
      if (!rider.personId) continue;
      const list = map.get(rider.personId) ?? [];
      if (!list.includes(dragon.id)) list.push(dragon.id);
      map.set(rider.personId, list);
    }
  }
  return map;
})();

/** Ceux qui ont porté la couronne : les rois comptés et Rhaenyra, qui régna sans être comptée. */
export const CROWNED: ReadonlySet<string> = new Set([...persons.filter((person) => person.king).map((person) => person.id), ...sovereigns.map((s) => s.id)]);

/** Reines : épouses d'un roi, et les femmes qui ont régné. */
export const QUEENS: ReadonlySet<string> = (() => {
  const set = new Set<string>();
  for (const id of CROWNED) if (graph.personById.get(id)?.sex === 'f') set.add(id);
  for (const union of unions) {
    if (union.type !== 'mariage') continue;
    const [a, b] = union.partners;
    const pa = graph.personById.get(a);
    const pb = graph.personById.get(b);
    if (pa && CROWNED.has(a) && pb?.sex === 'f') set.add(b);
    if (pb && CROWNED.has(b) && pa?.sex === 'f') set.add(a);
  }
  return set;
})();
