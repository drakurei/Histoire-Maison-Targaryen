/**
 * Mise en page de l'arbre complet, en rangées de générations.
 *
 * Fonctions pures et déterministes : un graphe et des options donnent des rectangles, des
 * points d'union et des tracés orthogonaux. Aucune présentation ici.
 *
 * Principe
 * 1. Une rangée par génération (`Person.generation`).
 * 2. Dans une rangée, une fratrie forme un BLOC contigu ; un bloc est une suite de CELLULES.
 *    Une cellule porte une personne née dans l'arbre (ou une chaîne de frères et sœurs mariés
 *    entre eux, côte à côte) et, de part et d'autre, ses conjoints venus d'ailleurs.
 * 3. Chaque union a un seul point. Si les deux conjoints se touchent, il est entre eux. Sinon
 *    un crochet les relie par-dessus ou par-dessous la rangée, selon ce qui croise le moins,
 *    et le point est sur le crochet. Personne n'est jamais dessiné deux fois : une union entre
 *    frère et sœur, oncle et nièce ou cousins relie deux cases qui ont chacune leur filiation.
 * 4. Une union entre deux générations (oncle et nièce) pose son point à côté du conjoint le
 *    plus bas ; un trait descend de l'autre conjoint.
 * 5. Les blocs d'une rangée suivent l'ordre des points d'union de la rangée du dessus : les
 *    filiations de fratries différentes ne se croisent pas. Restent à choisir l'ordre des
 *    cellules dans chaque bloc et le côté de chaque conjoint : passes barycentriques
 *    (descente puis remontée), puis recherche locale sur un coût (croisements, crochets,
 *    longueur des tracés) évalué sur des abscisses approchées.
 * 6. Abscisses : relaxation rangée par rangée. Chaque cellule est tirée sous le point d'union
 *    de ses parents et au-dessus de ses enfants ; la régression isotone (PAV) donne à chaque
 *    rangée la solution exacte sous contrainte d'écartement.
 * 7. Tracés : chaque fratrie a un tronc, une barre et des descentes ; les barres qui se
 *    recouvrent prennent des couloirs différents, ordonnés pour ne pas se croiser.
 *
 * Fichier en TypeScript « effaçable » : importable tel quel par Node 24.
 */
import type { Person, Reliability } from '../content/types.ts';
import type { FamilyGraph } from './graph.ts';
import { generationsOf, kinshipCoefficient } from './graph.ts';

/* ------------------------------------------------------------------ contrat */

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutOptions {
  /** Largeur d'une case (132 par défaut). Arrondie au nombre pair le plus proche. */
  nodeWidth?: number;
  /** Largeur propre à une personne (un roi plus large, par exemple). */
  widthOf?: (person: Person) => number;
  nodeHeight?: number;
  /** Écart entre deux cases d'une même fratrie. */
  siblingGap?: number;
  /** Écart entre deux fratries. */
  blockGap?: number;
  /** Écart entre deux cases qui portent un point d'union entre elles. */
  unionGap?: number;
  /** Hauteur minimale entre deux rangées. */
  rowGap?: number;
  /** Écart entre deux couloirs de tracés. */
  laneGap?: number;
  padding?: number;
}

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  generation: number;
}

/**
 * Tracé qui relie un point d'union à l'un des deux conjoints.
 * `side` : trait court, le conjoint touche le point. `over` / `under` : crochet par-dessus ou
 * par-dessous la rangée. `descent` : trait qui descend d'un conjoint de la génération d'avant.
 */
export type TieRoute = 'side' | 'over' | 'under' | 'descent';

export interface LayoutTie {
  person: string;
  route: TieRoute;
  points: Point[];
}

export interface LayoutUnion {
  /** Identifiant de l'union, ou de la fratrie (`f:père+mère`) pour deux parents sans union enregistrée. */
  id: string;
  unionId: string | null;
  /** Position du point d'union. */
  x: number;
  y: number;
  a: string;
  b: string;
  /** Vrai si les deux conjoints ont un ancêtre commun dans le graphe. */
  consanguineous: boolean;
  ties: LayoutTie[];
}

export interface LayoutLink {
  /** Identifiant de `LayoutUnion`, ou de la personne quand un seul parent est connu. */
  from: string;
  fromKind: 'union' | 'person';
  to: string;
  /** Ligne brisée orthogonale, du parent vers l'enfant. */
  points: Point[];
  /** Certitude de la filiation, telle que la source la donne. */
  certainty: Reliability | null;
}

export interface LayoutRow {
  generation: number;
  y: number;
  height: number;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  unions: LayoutUnion[];
  links: LayoutLink[];
  bounds: Bounds;
  rows: LayoutRow[];
  /** Ce que l'ordre retenu coûte, compté avant le tracé définitif. */
  estimate: { crossings: number; brackets: number };
}

/* ------------------------------------------------------------------ outils */

function at<T>(list: ArrayLike<T>, index: number): T {
  const value = list[index];
  if (value === undefined) throw new RangeError(`genealogy/layout : index ${index} hors limites`);
  return value;
}

function need<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`genealogy/layout : ${what} introuvable`);
  return value;
}

function pushTo<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

const even = (value: number): number => Math.max(2, 2 * Math.round(value / 2));

interface Resolved {
  nodeWidth: number;
  nodeHeight: number;
  siblingGap: number;
  blockGap: number;
  unionGap: number;
  rowGap: number;
  laneGap: number;
  padding: number;
  widthOf: ((person: Person) => number) | null;
}

function resolve(options: LayoutOptions): Resolved {
  return {
    nodeWidth: even(options.nodeWidth ?? 132),
    nodeHeight: even(options.nodeHeight ?? 44),
    siblingGap: even(options.siblingGap ?? 14),
    blockGap: even(options.blockGap ?? 40),
    unionGap: even(options.unionGap ?? 30),
    rowGap: options.rowGap ?? 60,
    laneGap: options.laneGap ?? 9,
    padding: options.padding ?? 24,
    widthOf: options.widthOf ?? null,
  };
}

/* ------------------------------------------------------------------ modèle */

/*
 * Tout ce qui occupe une place dans une rangée est un EMPLACEMENT numéroté : les personnes
 * (dans l'ordre de la source), puis une place réservée par union entre deux générations.
 */

/** Deux personnes liées par une union ou par des enfants communs : un point d'union. */
interface Couple {
  index: number;
  id: string;
  unionId: string | null;
  a: number;
  b: number;
  hasChildren: boolean;
  consanguineous: boolean;
  /** Rangée du point d'union : celle du conjoint le plus bas. */
  row: number;
  /** Conjoint d'une rangée supérieure, pour une union entre deux générations ; -1 sinon. */
  upper: number;
  /** Conjoint de la rangée du point. */
  lower: number;
  /** Place réservée au point d'une union entre deux générations ; -1 sinon. */
  ghost: number;
}

/** Origine d'une fratrie : un couple, ou un parent seul. */
interface Source {
  index: number;
  id: string;
  couple: Couple | null;
  /** Parent seul ; -1 pour un couple. */
  person: number;
  row: number;
  children: number[];
}

/** Un conjoint venu d'ailleurs (et ceux qui s'y rattachent), ou la place d'une union entre générations. */
interface Item {
  /** Du plus proche de l'hôte au plus éloigné. */
  slots: number[];
  ghost: boolean;
}

interface Cell {
  row: number;
  core: number[];
  /** Du plus proche du cœur au plus éloigné. */
  left: Item[];
  right: Item[];
}

interface Block {
  row: number;
  source: Source | null;
  order: number;
  /** Pour un bloc sans parents : conjoint de la rangée du dessus près duquel se placer ; -1 sinon. */
  hint: number;
  cells: Cell[];
  key: number;
}

interface Model {
  rows: number;
  minGeneration: number;
  slotOf: Map<string, number>;
  slotName: string[];
  slotRow: number[];
  slotWidth: number[];
  /** Emplacements qui reçoivent un tracé par le haut (filiation, descente d'un conjoint). */
  slotTop: Uint8Array;
  /** Nombre de tracés qui partent par le bas de chaque emplacement (tronc d'un parent seul, descente vers une union de la génération suivante, tronc d'une place réservée). */
  slotBottom: Uint8Array;
  ghostCouple: (Couple | null)[];
  sourceOfChild: (Source | null)[];
  couples: Couple[];
  sources: Source[];
  blocks: Block[];
  blocksByRow: Block[][];
  couplesByRow: Couple[][];
  sourcesByRow: Source[][];
  /** Fratries dont des enfants sont dans la rangée, avec ces enfants. */
  netsInto: { source: Source; children: number[] }[][];
  descentsInto: Couple[][];
  descentsFrom: Couple[][];
  sourcesOfCell: Map<Cell, Source[]>;
  descentsOfCell: Map<Cell, Couple[]>;
  /** Cellule de chaque emplacement et bloc de chaque cellule : ils ne changent jamais, seul l'ordre change. */
  cellOfSlot: Map<number, Cell>;
  blockOfCell: Map<Cell, Block>;
  /** Par rangée : la rangée la plus basse dont la mise en place lit directement celle-ci. */
  reach: number[];
}

function buildModel(graph: FamilyGraph, o: Resolved): Model {
  let fallback: Map<string, number> | null = null;
  const generationOf = (person: Person): number => {
    if (Number.isFinite(person.generation)) return Math.round(person.generation);
    fallback ??= generationsOf(graph);
    return fallback.get(person.id) ?? 0;
  };
  let minGeneration = 0;
  let maxGeneration = -1;
  graph.persons.forEach((person, index) => {
    const generation = generationOf(person);
    minGeneration = index === 0 ? generation : Math.min(minGeneration, generation);
    maxGeneration = index === 0 ? generation : Math.max(maxGeneration, generation);
  });
  const rows = maxGeneration - minGeneration + 1;

  const slotOf = new Map<string, number>();
  const slotName: string[] = [];
  const slotRow: number[] = [];
  const slotWidth: number[] = [];
  for (const person of graph.persons) {
    slotOf.set(person.id, slotName.length);
    slotName.push(person.id);
    slotRow.push(generationOf(person) - minGeneration);
    slotWidth.push(o.widthOf ? even(o.widthOf(person)) : o.nodeWidth);
  }
  const personCount = slotName.length;
  const slot = (id: string): number => need(slotOf.get(id), id);

  const couples: Couple[] = [];
  const coupleById = new Map<string, Couple>();
  const addCouple = (id: string, unionId: string | null, aId: string, bId: string, hasChildren: boolean): void => {
    if (coupleById.has(id)) return;
    const a = slot(aId);
    const b = slot(bId);
    const ra = at(slotRow, a);
    const rb = at(slotRow, b);
    const couple: Couple = {
      index: couples.length,
      id,
      unionId,
      a,
      b,
      hasChildren,
      consanguineous: kinshipCoefficient(graph, aId, bId) > 0,
      row: Math.max(ra, rb),
      upper: ra === rb ? -1 : ra < rb ? a : b,
      lower: ra < rb ? b : a,
      ghost: -1,
    };
    if (couple.upper >= 0) {
      couple.ghost = slotName.length;
      slotName.push(`~${id}`);
      slotRow.push(couple.row);
      slotWidth.push(o.unionGap);
    }
    couples.push(couple);
    coupleById.set(id, couple);
  };
  for (const union of graph.unions) {
    addCouple(union.id, union.id, union.partners[0], union.partners[1], (graph.familyById.get(union.id)?.children.length ?? 0) > 0);
  }
  for (const family of graph.families) {
    const [first, second] = family.parents;
    if (first !== undefined && second !== undefined) addCouple(family.id, family.unionId, first, second, true);
  }
  const slotCount = slotName.length;
  const ghostCouple: (Couple | null)[] = new Array<Couple | null>(slotCount).fill(null);
  for (const couple of couples) if (couple.ghost >= 0) ghostCouple[couple.ghost] = couple;

  const sources: Source[] = [];
  const sourceOfChild: (Source | null)[] = new Array<Source | null>(slotCount).fill(null);
  for (const family of graph.families) {
    const [first, second] = family.parents;
    if (first === undefined) continue;
    const couple = second === undefined ? null : need(coupleById.get(family.id), `couple ${family.id}`);
    const source: Source = {
      index: sources.length,
      id: family.id,
      couple,
      person: couple ? -1 : slot(first),
      row: couple ? couple.row : at(slotRow, slot(first)),
      children: family.children.map(slot),
    };
    sources.push(source);
    for (const child of source.children) sourceOfChild[child] = source;
  }
  const inTree = (s: number): boolean => at(sourceOfChild, s) !== null;

  // Conjoints de même rangée, dans l'ordre des unions.
  const mates = new Map<number, number[]>();
  for (const couple of couples) {
    if (couple.upper >= 0) continue;
    pushTo(mates, couple.a, couple.b);
    pushTo(mates, couple.b, couple.a);
  }

  // Chaque personne sans parents se range auprès d'un conjoint déjà placé ; à défaut elle ouvre un bloc.
  const hostOf = new Map<number, number>();
  const placed = new Set<number>();
  const heads: number[] = [];
  let pending: number[] = [];
  for (let s = 0; s < personCount; s += 1) {
    if (inTree(s)) placed.add(s);
    else pending.push(s);
  }
  while (pending.length > 0) {
    let progress = false;
    for (const s of pending) {
      const list = mates.get(s) ?? [];
      const host = list.find(inTree) ?? list.find((mate) => placed.has(mate));
      if (host === undefined) continue;
      hostOf.set(s, host);
      placed.add(s);
      progress = true;
    }
    pending = pending.filter((s) => !placed.has(s));
    if (!progress) {
      const head = pending.shift();
      if (head !== undefined) {
        heads.push(head);
        placed.add(head);
      }
    }
  }
  const chainOf = (s: number): number[] => {
    const chain = [s];
    for (let host = hostOf.get(s); host !== undefined; host = hostOf.get(host)) chain.push(host);
    return chain;
  };

  // Regroupe les rattachés par ancre puis par conjoint direct de l'ancre.
  const itemsOf = new Map<number, Item[]>();
  const itemByTop = new Map<number, Item>();
  for (let s = 0; s < personCount; s += 1) {
    const chain = chainOf(s);
    if (chain.length < 2) continue;
    const anchor = at(chain, chain.length - 1);
    const topGuest = at(chain, chain.length - 2);
    let item = itemByTop.get(topGuest);
    if (!item) {
      item = { slots: [topGuest], ghost: false };
      itemByTop.set(topGuest, item);
      pushTo(itemsOf, anchor, item);
    }
    if (s !== topGuest) item.slots.push(s);
  }
  for (const [anchor, items] of itemsOf) {
    const order = mates.get(anchor) ?? [];
    items.sort((x, y) => order.indexOf(at(x.slots, 0)) - order.indexOf(at(y.slots, 0)));
  }
  for (const couple of couples) {
    if (couple.ghost < 0) continue;
    const chain = chainOf(couple.lower);
    pushTo(itemsOf, at(chain, chain.length - 1), { slots: [couple.ghost], ghost: true });
  }

  // Blocs : une fratrie par rangée, puis les personnes sans parents ni hôte.
  const blocks: Block[] = [];
  const members = new Map<Block, number[]>();
  const blockByKey = new Map<string, Block>();
  for (const source of sources) {
    for (const child of source.children) {
      const row = at(slotRow, child);
      const key = `${source.index}@${row}`;
      let block = blockByKey.get(key);
      if (!block) {
        block = { row, source, order: blocks.length, hint: -1, cells: [], key: 0 };
        blockByKey.set(key, block);
        blocks.push(block);
        members.set(block, []);
      }
      need(members.get(block), 'bloc').push(child);
    }
  }
  for (const head of heads) {
    const above = couples.find((couple) => couple.upper >= 0 && couple.lower === head);
    const block: Block = { row: at(slotRow, head), source: null, order: blocks.length, hint: above ? above.upper : -1, cells: [], key: 0 };
    blocks.push(block);
    members.set(block, [head]);
  }

  const cellOf = new Map<number, Cell>();
  const blockOfCell = new Map<Cell, Block>();
  for (const block of blocks) {
    for (const core of siblingChains(need(members.get(block), 'bloc'), mates)) {
      const cell: Cell = { row: block.row, core, left: [], right: [] };
      const single = core.length === 1;
      let turn = 0;
      for (const s of core) {
        for (const item of itemsOf.get(s) ?? []) {
          let side: Item[];
          if (single) {
            side = item.ghost || turn % 2 === 0 ? cell.right : cell.left;
            if (!item.ghost) turn += 1;
          } else {
            side = s === at(core, 0) ? cell.left : cell.right;
          }
          side.push(item);
        }
      }
      tidySides(cell);
      block.cells.push(cell);
      blockOfCell.set(cell, block);
      for (const s of core) cellOf.set(s, cell);
      for (const item of [...cell.left, ...cell.right]) for (const s of item.slots) cellOf.set(s, cell);
    }
  }

  const perRow = <T>(): T[][] => Array.from({ length: Math.max(rows, 0) }, () => []);
  const blocksByRow = perRow<Block>();
  const couplesByRow = perRow<Couple>();
  const sourcesByRow = perRow<Source>();
  const netsInto = perRow<{ source: Source; children: number[] }>();
  const descentsInto = perRow<Couple>();
  const descentsFrom = perRow<Couple>();
  for (const block of blocks) at(blocksByRow, block.row).push(block);
  const slotTop = new Uint8Array(slotCount);
  const slotBottom = new Uint8Array(slotCount);
  const sourcesOfCell = new Map<Cell, Source[]>();
  const descentsOfCell = new Map<Cell, Couple[]>();
  for (const source of sources) {
    at(sourcesByRow, source.row).push(source);
    if (source.person >= 0) slotBottom[source.person] = at(slotBottom, source.person) + 1;
    const byRow = new Map<number, number[]>();
    for (const child of source.children) {
      slotTop[child] = 1;
      pushTo(byRow, at(slotRow, child), child);
    }
    for (const [row, children] of byRow) at(netsInto, row).push({ source, children });
    const parents = source.couple ? [source.couple.a, source.couple.b] : [source.person];
    const seen = new Set<Cell>();
    for (const parent of parents) {
      const cell = cellOf.get(parent);
      if (!cell || seen.has(cell)) continue;
      seen.add(cell);
      pushTo(sourcesOfCell, cell, source);
    }
  }
  for (const couple of couples) {
    at(couplesByRow, couple.row).push(couple);
    if (couple.ghost < 0) continue;
    at(descentsInto, couple.row).push(couple);
    at(descentsFrom, at(slotRow, couple.upper)).push(couple);
    slotTop[couple.ghost] = 1;
    slotBottom[couple.upper] = at(slotBottom, couple.upper) + 1;
    if (couple.hasChildren) slotBottom[couple.ghost] = 1;
    const cell = cellOf.get(couple.upper);
    if (cell) pushTo(descentsOfCell, cell, couple);
  }

  // Ce qu'une rangée lit des rangées du dessus : l'origine de ses fratries, le conjoint d'où descend une union, le repère d'un bloc sans parents.
  const reach: number[] = Array.from({ length: Math.max(rows, 0) }, (_, r) => r);
  const reaches = (upper: number, lower: number): void => {
    if (lower > at(reach, upper)) reach[upper] = lower;
  };
  for (const source of sources) for (const child of source.children) reaches(Math.min(source.row, at(slotRow, child)), at(slotRow, child));
  for (const couple of couples) if (couple.ghost >= 0) reaches(at(slotRow, couple.upper), couple.row);
  for (const block of blocks) if (block.hint >= 0) reaches(Math.min(at(slotRow, block.hint), block.row), block.row);

  return {
    rows,
    minGeneration,
    slotOf,
    slotName,
    slotRow,
    slotWidth,
    slotTop,
    slotBottom,
    ghostCouple,
    sourceOfChild,
    couples,
    sources,
    blocks,
    blocksByRow,
    couplesByRow,
    sourcesByRow,
    netsInto,
    descentsInto,
    descentsFrom,
    sourcesOfCell,
    descentsOfCell,
    cellOfSlot: cellOf,
    blockOfCell,
    reach,
  };
}

/**
 * Découpe une fratrie en chaînes : frères et sœurs mariés entre eux restent côte à côte
 * (Visenya, Aegon, Rhaenys). Chaque chaîne prend la place de son premier membre.
 */
function siblingChains(members: readonly number[], mates: ReadonlyMap<number, readonly number[]>): number[][] {
  const inside = new Set(members);
  const near = (s: number): number[] => (mates.get(s) ?? []).filter((mate, i, all) => inside.has(mate) && all.indexOf(mate) === i);
  const seen = new Set<number>();
  const chains: number[][] = [];
  const walk = (start: number): void => {
    const chain = [start];
    seen.add(start);
    let cursor = start;
    for (;;) {
      const next = near(cursor).find((mate) => !seen.has(mate));
      if (next === undefined) break;
      chain.push(next);
      seen.add(next);
      cursor = next;
    }
    chains.push(chain);
  };
  // Les extrémités d'abord, pour dérouler chaque chaîne d'un bout à l'autre.
  for (const s of members) if (!seen.has(s) && near(s).length === 1) walk(s);
  for (const s of members) if (!seen.has(s)) walk(s);
  const firstRank = (chain: readonly number[]): number => Math.min(...chain.map((s) => members.indexOf(s)));
  return chains.sort((x, y) => firstRank(x) - firstRank(y));
}

/** La place d'une union entre générations reste contre le conjoint : le trait qui y descend ne survole personne. */
function tidySides(cell: Cell): void {
  cell.left = [...cell.left.filter((item) => item.ghost), ...cell.left.filter((item) => !item.ghost)];
  cell.right = [...cell.right.filter((item) => item.ghost), ...cell.right.filter((item) => !item.ghost)];
}

/* ------------------------------------------------------------------ ordre, abscisses approchées, coût */

const ROUTE_SIDE = 0;
const ROUTE_OVER = 1;
const ROUTE_UNDER = 2;

/** Un croisement vaut 1200 px de tracé ; un crochet, 40 px en plus de sa longueur. */
const COST_CROSSING = 1200;
const COST_BRACKET = 40;
const COST_WIDTH = 2;
const COST_SHARED_GAP = 3000;
const FAR = 1e9;
const PORT_INSET = 12;

/** Régression isotone pondérée (algorithme PAV) : la suite croissante la plus proche des cibles. */
function isotonic(target: readonly number[], weight: readonly number[]): number[] {
  const means: number[] = [];
  const weights: number[] = [];
  const sizes: number[] = [];
  for (let i = 0; i < target.length; i += 1) {
    let m = at(target, i);
    let w = at(weight, i);
    let size = 1;
    while (means.length > 0 && at(means, means.length - 1) > m) {
      const pm = means.pop() ?? 0;
      const pw = weights.pop() ?? 0;
      m = (pm * pw + m * w) / (pw + w);
      w += pw;
      size += sizes.pop() ?? 0;
    }
    means.push(m);
    weights.push(w);
    sizes.push(size);
  }
  const out: number[] = [];
  for (let b = 0; b < means.length; b += 1) for (let k = 0; k < at(sizes, b); k += 1) out.push(at(means, b));
  return out;
}

interface Span {
  lo: number;
  hi: number;
}

interface Net extends Span {
  trunk: number;
  drops: number[];
}

const overlap = (a: Span, b: Span): boolean => a.lo <= b.hi && b.lo <= a.hi;
const inside = (x: number, span: Span): boolean => x > span.lo && x < span.hi;
/** Croisements entre deux barres d'un même entre-rangées si `upper` passe au-dessus de `lower`. */
const price = (upper: Net, lower: Net): number => {
  let count = inside(lower.trunk, upper) ? 1 : 0;
  for (const x of upper.drops) if (inside(x, lower)) count += 1;
  return count;
};

interface Formation {
  source: Source;
  first: number;
  last: number;
  /** Milieu des enfants quand le bloc est serré, compté depuis le bord gauche de sa première cellule. */
  middle: number;
}

interface RowState {
  seq: number[];
  /** Largeur de chaque case, sa cellule, son décalage dans la cellule. */
  width: number[];
  cellIndex: number[];
  offset: number[];
  cellWidth: number[];
  /** Écart minimal entre la cellule c et la suivante. */
  cellGap: number[];
  /** Somme des largeurs et des écarts avant chaque cellule. */
  prefix: number[];
  cellX: number[];
  /** Nombre de points d'union (ou de troncs) dans l'intervalle qui suit chaque case. */
  used: Uint8Array;
  formations: Formation[];
  /** Bords gauche et droit approchés de la rangée. */
  lo: number;
  hi: number;
  crossings: number;
  brackets: number;
  cost: number;
}

interface Derived {
  rows: RowState[];
  /** Rang de chaque emplacement dans sa rangée. */
  pos: Int32Array;
  /** Bord gauche approché de chaque emplacement. */
  x: Float64Array;
  /** Par couple : intervalle du point (ou du tronc) ; -1 sur une place réservée ; -2 au milieu d'un crochet sans enfants. */
  gap: Int32Array;
  /** Par couple : rang parmi les points d'un même intervalle. */
  rank: Uint8Array;
  /** Par couple : côte à côte, crochet par-dessus ou par-dessous. */
  route: Uint8Array;
  markerX: Float64Array;
  sourceX: Float64Array;
  cost: number;
  crossings: number;
  brackets: number;
}

/**
 * Déroule les rangées du haut vers le bas à partir de `from` (les rangées du dessus sont
 * reprises de `base`) : ordre des blocs, points d'union, abscisses approchées, coût.
 */
function derive(model: Model, o: Resolved, from = 0, base: Derived | null = null, spare: Derived | null = null): Derived {
  const slots = model.slotName.length;
  let derived: Derived;
  if (base !== null && spare !== null && spare !== base) {
    // Essai de la recherche locale : on recopie `base` dans un état déjà alloué plutôt que d'en créer un.
    derived = spare;
    derived.rows.length = 0;
    for (let r = 0; r < from; r += 1) derived.rows.push(at(base.rows, r));
    derived.pos.set(base.pos);
    derived.x.set(base.x);
    derived.gap.set(base.gap);
    derived.rank.set(base.rank);
    derived.route.set(base.route);
    derived.markerX.set(base.markerX);
    derived.sourceX.set(base.sourceX);
    derived.cost = 0;
    derived.crossings = 0;
    derived.brackets = 0;
  } else if (base !== null) {
    derived = {
      rows: base.rows.slice(0, from),
      pos: base.pos.slice(),
      x: base.x.slice(),
      gap: base.gap.slice(),
      rank: base.rank.slice(),
      route: base.route.slice(),
      markerX: base.markerX.slice(),
      sourceX: base.sourceX.slice(),
      cost: 0,
      crossings: 0,
      brackets: 0,
    };
  } else {
    derived = {
      rows: [],
      pos: new Int32Array(slots).fill(-1),
      x: new Float64Array(slots),
      gap: new Int32Array(model.couples.length).fill(-1),
      rank: new Uint8Array(model.couples.length),
      route: new Uint8Array(model.couples.length),
      markerX: new Float64Array(model.couples.length),
      sourceX: new Float64Array(model.sources.length).fill(Number.NaN),
      cost: 0,
      crossings: 0,
      brackets: 0,
    };
  }
  // Une rangée retrouvée telle quelle, que plus aucune rangée modifiée n'atteint : tout le dessous est celui de `base`.
  let dirty = -1;
  for (let r = derived.rows.length; r < model.rows; r += 1) {
    const row = deriveRow(model, o, r, derived);
    derived.rows.push(row);
    if (base === null) continue;
    const before = base.rows[r];
    if (!before) continue;
    if (!sameRow(row, before)) {
      dirty = Math.max(dirty, at(model.reach, r));
    } else if (dirty <= r) {
      for (let k = r + 1; k < model.rows; k += 1) derived.rows.push(at(base.rows, k));
      break;
    }
  }
  let lo = Infinity;
  let hi = -Infinity;
  for (const row of derived.rows) {
    derived.cost += row.cost;
    derived.crossings += row.crossings;
    derived.brackets += row.brackets;
    lo = Math.min(lo, row.lo);
    hi = Math.max(hi, row.hi);
  }
  // Un arbre qui dérive de biais est plus large qu'il ne faut : la largeur totale compte aussi.
  if (hi > lo) derived.cost += (hi - lo) * COST_WIDTH;
  return derived;
}

/** Même ordre et mêmes abscisses : tout ce que les rangées du dessous lisent de celle-ci est inchangé. */
function sameRow(a: RowState, b: RowState): boolean {
  if (a.seq.length !== b.seq.length || a.cellX.length !== b.cellX.length) return false;
  for (let i = 0; i < a.seq.length; i += 1) if (a.seq[i] !== b.seq[i]) return false;
  for (let c = 0; c < a.cellX.length; c += 1) if (a.cellX[c] !== b.cellX[c]) return false;
  return true;
}

function deriveRow(model: Model, o: Resolved, r: number, d: Derived): RowState {
  const { pos, x } = d;
  const widthOfSlot = model.slotWidth;
  const centre = (s: number): number => at(x, s) + at(widthOfSlot, s) / 2;

  // 1. Les blocs suivent l'ordre de leurs origines dans les rangées du dessus.
  const ordered = at(model.blocksByRow, r).slice();
  for (const block of ordered) {
    if (block.source) {
      const origin = at(d.sourceX, block.source.index);
      block.key = Number.isNaN(origin) || block.source.row >= r ? FAR : origin;
    } else {
      block.key = block.hint >= 0 && at(model.slotRow, block.hint) < r ? centre(block.hint) : FAR;
    }
  }
  ordered.sort((a, b) => a.key - b.key || a.order - b.order);

  // 2. La rangée, case par case.
  const seq: number[] = [];
  const cellIndex: number[] = [];
  const cellStart: number[] = [];
  const cellBlock: number[] = [];
  ordered.forEach((block, b) => {
    for (const cell of block.cells) {
      const c = cellStart.length;
      cellStart.push(seq.length);
      cellBlock.push(b);
      for (let i = cell.left.length - 1; i >= 0; i -= 1) {
        const itemSlots = at(cell.left, i).slots;
        for (let k = itemSlots.length - 1; k >= 0; k -= 1) {
          seq.push(at(itemSlots, k));
          cellIndex.push(c);
        }
      }
      for (const s of cell.core) {
        seq.push(s);
        cellIndex.push(c);
      }
      for (const item of cell.right) {
        for (const s of item.slots) {
          seq.push(s);
          cellIndex.push(c);
        }
      }
    }
  });
  const length = seq.length;
  for (let i = 0; i < length; i += 1) pos[at(seq, i)] = i;

  // 3. Points d'union : entre deux voisins, sinon sur un crochet par-dessus ou par-dessous.
  // Un crochet par-dessus coupe ce qui arrive par le haut des cases survolées ; par-dessous, ce
  // qui en part par le bas et les troncs des unions posées dans les intervalles franchis.
  const used = new Uint8Array(length);
  const trunk = new Uint8Array(length);
  let crossings = 0;
  let brackets = 0;
  let shared = 0;
  /** Crochets déjà posés dans la rangée : étendue en rangs et côté. */
  const laid: { lo: number; hi: number; over: boolean }[] = [];
  const between = (lo: number, hi: number): { over: number; under: number } => {
    let over = 0;
    let under = 0;
    for (let i = lo + 1; i < hi; i += 1) {
      over += at(model.slotTop, at(seq, i));
      under += at(model.slotBottom, at(seq, i));
    }
    for (let g = lo; g < hi; g += 1) under += at(trunk, g);
    // Deux crochets du même côté qui s'entrecroisent se coupent une fois.
    for (const other of laid) {
      const crossed = (other.lo < lo && lo < other.hi && other.hi < hi) || (lo < other.lo && other.lo < hi && hi < other.hi);
      if (!crossed) continue;
      if (other.over) over += 1;
      else under += 1;
    }
    return { over, under };
  };
  /** Ce que coupe le tronc d'un crochet par-dessus en descendant par l'intervalle g : les crochets plus courts qui le couvrent. */
  const through = (g: number): number => {
    let count = 0;
    for (const other of laid) if (other.lo <= g && g < other.hi) count += 1;
    return count;
  };
  const rowCouples = at(model.couplesByRow, r)
    .map((couple) => ({ couple, span: couple.ghost >= 0 ? 0 : Math.abs(at(pos, couple.a) - at(pos, couple.b)) }))
    .sort((p, q) => p.span - q.span || p.couple.index - q.couple.index);
  for (const { couple, span } of rowCouples) {
    const c = couple.index;
    d.rank[c] = 0;
    if (couple.ghost >= 0) {
      // Union entre deux générations : le point occupe sa place réservée, contre le conjoint de cette rangée.
      const spot = at(pos, couple.ghost);
      const low = at(pos, couple.lower);
      d.gap[c] = -1;
      d.route[c] = ROUTE_SIDE;
      if (Math.abs(low - spot) > 1) {
        const lo = Math.min(low, spot);
        const hi = Math.max(low, spot);
        const cut = between(lo, hi);
        const over = cut.over <= cut.under;
        d.route[c] = over ? ROUTE_OVER : ROUTE_UNDER;
        crossings += Math.min(cut.over, cut.under);
        brackets += 1;
        laid.push({ lo, hi, over });
      }
      continue;
    }
    const lo = Math.min(at(pos, couple.a), at(pos, couple.b));
    const hi = Math.max(at(pos, couple.a), at(pos, couple.b));
    if (span === 1 && at(used, lo) === 0) {
      d.gap[c] = lo;
      d.route[c] = ROUTE_SIDE;
      used[lo] = 1;
      if (couple.hasChildren) trunk[lo] = 1;
      continue;
    }
    const cut = between(lo, hi);
    brackets += 1;
    if (!couple.hasChildren) {
      const over = cut.over <= cut.under;
      d.route[c] = over ? ROUTE_OVER : ROUTE_UNDER;
      crossings += Math.min(cut.over, cut.under);
      d.gap[c] = -2;
      laid.push({ lo, hi, over });
      continue;
    }
    // Le tronc des enfants descend par un intervalle libre : contre le conjoint venu d'ailleurs, sinon au milieu.
    const rooted = (i: number): boolean => at(model.sourceOfChild, at(seq, i)) !== null;
    const preferred = !rooted(hi) ? hi - 1 : !rooted(lo) ? lo : Math.floor((lo + hi - 1) / 2);
    let chosen = -1;
    for (let delta = 0; delta < hi - lo && chosen < 0; delta += 1) {
      for (const g of [preferred - delta, preferred + delta]) {
        if (g >= lo && g < hi && at(used, g) === 0) {
          chosen = g;
          break;
        }
      }
    }
    if (chosen < 0) {
      chosen = preferred;
      shared += 1;
    }
    // Par-dessus, le tronc traverse la rangée : il coupe les crochets plus courts qui couvrent son intervalle.
    const overCost = cut.over + through(chosen);
    const over = overCost <= cut.under;
    d.route[c] = over ? ROUTE_OVER : ROUTE_UNDER;
    crossings += Math.min(overCost, cut.under);
    d.gap[c] = chosen;
    d.rank[c] = at(used, chosen);
    used[chosen] = at(used, chosen) + 1;
    trunk[chosen] = 1;
    laid.push({ lo, hi, over });
  }

  // 4. Abscisses approchées : chaque bloc serré, à l'aplomb de son origine, sans chevauchement.
  const width = seq.map((s) => at(widthOfSlot, s));
  const gapWidth = (i: number): number => {
    const left = at(seq, i);
    const right = at(seq, i + 1);
    const count = at(used, i);
    if (at(cellIndex, i) === at(cellIndex, i + 1)) {
      if (at(model.ghostCouple, left)?.lower === right || at(model.ghostCouple, right)?.lower === left) return 0;
      return count > 0 ? o.unionGap * count : o.siblingGap;
    }
    const sameBlock = at(cellBlock, at(cellIndex, i)) === at(cellBlock, at(cellIndex, i + 1));
    return Math.max(sameBlock ? o.siblingGap : o.blockGap, o.unionGap * count);
  };
  const cells = cellStart.length;
  const offset: number[] = [];
  const cellWidth: number[] = new Array<number>(cells).fill(0);
  const cellGap: number[] = new Array<number>(cells).fill(0);
  let cursor = 0;
  for (let i = 0; i < length; i += 1) {
    const c = at(cellIndex, i);
    if (i > 0 && at(cellIndex, i - 1) !== c) cursor = 0;
    offset.push(cursor);
    cellWidth[c] = cursor + at(width, i);
    if (i + 1 < length) {
      if (at(cellIndex, i + 1) === c) cursor += at(width, i) + gapWidth(i);
      else cellGap[c] = gapWidth(i);
    }
  }
  const prefix: number[] = [];
  let total = 0;
  for (let c = 0; c < cells; c += 1) {
    prefix.push(total);
    total += at(cellWidth, c) + at(cellGap, c);
  }
  const formations: Formation[] = [];
  const target: number[] = [];
  const weight: number[] = [];
  let first = 0;
  for (const block of ordered) {
    const last = first + block.cells.length - 1;
    let goal: number;
    if (block.source && block.key < FAR) {
      let lowest = Infinity;
      let highest = -Infinity;
      const end = last + 1 < cells ? at(cellStart, last + 1) : length;
      for (let i = at(cellStart, first); i < end; i += 1) {
        if (at(model.sourceOfChild, at(seq, i)) !== block.source) continue;
        const middle = at(prefix, at(cellIndex, i)) - at(prefix, first) + at(offset, i) + at(width, i) / 2;
        lowest = Math.min(lowest, middle);
        highest = Math.max(highest, middle);
      }
      const middle = (lowest + highest) / 2;
      formations.push({ source: block.source, first, last, middle });
      goal = block.key - middle;
    } else {
      const near = block.key < FAR ? block.key : 0;
      goal = near - (at(prefix, last) + at(cellWidth, last) - at(prefix, first)) / 2;
    }
    for (let c = first; c <= last; c += 1) {
      target.push(goal - at(prefix, first));
      weight.push(1);
    }
    first = last + 1;
  }
  const solved = isotonic(target, weight);
  const cellX = solved.map((value, c) => value + at(prefix, c));
  for (let i = 0; i < length; i += 1) x[at(seq, i)] = at(cellX, at(cellIndex, i)) + at(offset, i);

  // 5. Points d'union et origines de cette rangée, puis le coût de ce qui y arrive.
  let ink = 0;
  for (const { couple } of rowCouples) {
    const c = couple.index;
    const g = at(d.gap, c);
    const sideBySide = at(d.route, c) === ROUTE_SIDE;
    if (g >= 0) {
      const start = at(x, at(seq, g)) + at(width, g);
      const end = at(x, at(seq, g + 1));
      d.markerX[c] = start + ((at(d.rank, c) + 1) / (at(used, g) + 1)) * (end - start);
      if (sideBySide) ink += end - start - o.unionGap;
    } else if (g === -1) {
      d.markerX[c] = centre(couple.ghost);
      if (!sideBySide) ink += Math.abs(centre(couple.lower) - centre(couple.ghost));
    } else {
      d.markerX[c] = (centre(couple.a) + centre(couple.b)) / 2;
    }
    if (couple.ghost < 0 && !sideBySide) ink += Math.abs(centre(couple.a) - centre(couple.b));
  }
  for (const source of at(model.sourcesByRow, r)) {
    d.sourceX[source.index] = source.couple ? at(d.markerX, source.couple.index) : centre(source.person);
  }
  const nets: Net[] = [];
  for (const entry of at(model.netsInto, r)) {
    const start = at(d.sourceX, entry.source.index);
    if (Number.isNaN(start) || entry.source.row >= r) continue;
    const drops = entry.children.map(centre);
    nets.push({ trunk: start, drops, lo: Math.min(start, ...drops), hi: Math.max(start, ...drops) });
  }
  for (const couple of at(model.descentsInto, r)) {
    const drop = at(d.markerX, couple.index);
    const left = at(x, couple.upper);
    const inset = Math.min(PORT_INSET, at(widthOfSlot, couple.upper) / 4);
    const start = Math.min(Math.max(drop, left + inset), left + at(widthOfSlot, couple.upper) - inset);
    nets.push({ trunk: start, drops: [drop], lo: Math.min(start, drop), hi: Math.max(start, drop) });
  }
  for (let i = 0; i < nets.length; i += 1) {
    const a = at(nets, i);
    ink += a.hi - a.lo;
    for (let j = i + 1; j < nets.length; j += 1) {
      const b = at(nets, j);
      if (overlap(a, b)) crossings += Math.min(price(a, b), price(b, a));
    }
  }

  return {
    seq,
    width,
    cellIndex,
    offset,
    cellWidth,
    cellGap,
    prefix,
    cellX,
    used,
    formations,
    lo: length > 0 ? at(x, at(seq, 0)) : Infinity,
    hi: length > 0 ? at(x, at(seq, length - 1)) + at(width, length - 1) : -Infinity,
    crossings,
    brackets,
    cost: crossings * COST_CROSSING + brackets * COST_BRACKET + shared * COST_SHARED_GAP + ink,
  };
}

/* ------------------------------------------------------------------ passes barycentriques */

const mean = (values: readonly number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;

/** Tri stable des cellules qui ont une clé ; les autres gardent leur place. Rend vrai si l'ordre a changé. */
function reorder(block: Block, keys: ReadonlyMap<Cell, number>): boolean {
  const keyed = block.cells.filter((cell) => keys.has(cell));
  if (keyed.length < 2) return false;
  const sorted = keyed
    .map((cell, index) => ({ cell, index, key: need(keys.get(cell), 'clé') }))
    .sort((a, b) => a.key - b.key || a.index - b.index);
  if (sorted.every((entry, index) => entry.index === index)) return false;
  let next = 0;
  block.cells = block.cells.map((cell) => {
    if (!keys.has(cell)) return cell;
    next += 1;
    return at(sorted, next - 1).cell;
  });
  return true;
}

/**
 * Descente : dans chaque rangée, une cellule est tirée vers le barycentre de ses voisins du
 * dessus (le point d'union de ses parents, le conjoint d'une union entre générations).
 */
function sweepDown(model: Model, o: Resolved, start: Derived): Derived {
  let derived = start;
  const middle = (s: number): number => at(derived.x, s) + at(model.slotWidth, s) / 2;
  for (let r = 1; r < model.rows; r += 1) {
    let changed = false;
    for (const block of at(model.blocksByRow, r)) {
      if (!block.source) continue;
      const parents = at(derived.sourceX, block.source.index);
      if (Number.isNaN(parents)) continue;
      const keys = new Map<Cell, number>();
      for (const cell of block.cells) {
        const pulls = [parents];
        for (const item of [...cell.left, ...cell.right]) {
          const couple = item.ghost ? at(model.ghostCouple, at(item.slots, 0)) : null;
          if (!couple || at(model.slotRow, couple.upper) >= r) continue;
          const above = middle(couple.upper);
          pulls.push(above);
          if (cell.core.length !== 1) continue;
          // La place réservée passe du côté d'où descend le conjoint.
          const wasLeft = cell.left.includes(item);
          if (wasLeft === above < parents) continue;
          cell.left = cell.left.filter((other) => other !== item);
          cell.right = cell.right.filter((other) => other !== item);
          if (above < parents) cell.left.unshift(item);
          else cell.right.unshift(item);
          changed = true;
        }
        keys.set(cell, mean(pulls));
      }
      if (reorder(block, keys)) changed = true;
    }
    if (changed) derived = derive(model, o, r, derived);
  }
  return derived;
}

/**
 * Remontée : une cellule est tirée vers le barycentre de ses voisins du dessous (ses enfants,
 * le conjoint d'une union entre générations). Les cellules sans descendance gardent leur place.
 */
function sweepUp(model: Model, o: Resolved, start: Derived): Derived {
  let derived = start;
  const middle = (s: number): number => at(derived.x, s) + at(model.slotWidth, s) / 2;
  for (let r = model.rows - 2; r >= 0; r -= 1) {
    let changed = false;
    for (const block of at(model.blocksByRow, r)) {
      if (block.cells.length < 2) continue;
      const keys = new Map<Cell, number>();
      for (const cell of block.cells) {
        const pulls: number[] = [];
        for (const source of model.sourcesOfCell.get(cell) ?? []) for (const child of source.children) pulls.push(middle(child));
        for (const couple of model.descentsOfCell.get(cell) ?? []) pulls.push(middle(couple.ghost));
        if (pulls.length > 0) keys.set(cell, mean(pulls));
      }
      if (reorder(block, keys)) changed = true;
    }
    if (changed) derived = derive(model, o, r, derived);
  }
  return derived;
}

/* ------------------------------------------------------------------ recherche locale */

type Shape = { core: number[]; left: Item[]; right: Item[] };
type Snapshot = { cells: Cell[]; shapes: Shape[] }[];

function snapshot(model: Model): Snapshot {
  return model.blocks.map((block) => ({
    cells: block.cells.slice(),
    shapes: block.cells.map((cell) => ({ core: cell.core.slice(), left: cell.left.slice(), right: cell.right.slice() })),
  }));
}

function restore(model: Model, saved: Snapshot): void {
  model.blocks.forEach((block, index) => {
    const entry = at(saved, index);
    block.cells = entry.cells.slice();
    block.cells.forEach((cell, k) => {
      const shape = at(entry.shapes, k);
      cell.core = shape.core.slice();
      cell.left = shape.left.slice();
      cell.right = shape.right.slice();
    });
  });
}

interface Move {
  row: number;
  undo: () => void;
}

const sameItems = (a: readonly Item[], b: readonly Item[]): boolean => a.length === b.length && a.every((item, index) => item === b[index]);

/** Tous les essais d'une passe : chaque essai modifie le modèle et rend de quoi le défaire. */
function* moves(model: Model): Generator<Move> {
  for (const block of model.blocks) {
    const size = block.cells.length;
    const reset = (before: Cell[]) => (): void => {
      block.cells = before;
    };
    // Une cellule change de place dans sa fratrie.
    for (let i = 0; i < size; i += 1) {
      for (let target = 0; target < size; target += 1) {
        if (target === i || target === i - 1) continue;
        const before = block.cells;
        const after = before.slice();
        const [moved] = after.splice(i, 1);
        if (!moved) continue;
        after.splice(target, 0, moved);
        block.cells = after;
        yield { row: block.row, undo: reset(before) };
      }
    }
    for (const cell of block.cells) {
      // Chaque essai part de l'état courant : un essai retenu ne doit pas être écrasé par le suivant.
      const state = (): Shape => ({ core: cell.core, left: cell.left, right: cell.right });
      const undoTo = (before: Shape) => (): void => {
        cell.core = before.core;
        cell.left = before.left;
        cell.right = before.right;
      };
      if (cell.left.length + cell.right.length > 0 || cell.core.length > 1) {
        // Miroir : la chaîne se retourne, les conjoints changent de côté.
        const before = state();
        cell.core = before.core.slice().reverse();
        cell.left = before.right;
        cell.right = before.left;
        yield { row: block.row, undo: undoTo(before) };
      }
      // Un conjoint change de côté ou de rang ; dans une chaîne, il reste du côté de son hôte.
      for (const fromSide of ['left', 'right'] as const) {
        for (let i = 0; i < cell[fromSide].length; i += 1) {
          for (const toSide of ['left', 'right'] as const) {
            if (toSide !== fromSide && cell.core.length !== 1) continue;
            for (const nearest of [true, false]) {
              const before = state();
              const item = before[fromSide][i];
              if (!item) continue;
              const origin = before[fromSide].filter((other) => other !== item);
              const destination = toSide === fromSide ? origin : before[toSide];
              cell[fromSide] = origin;
              cell[toSide] = nearest ? [item, ...destination] : [...destination, item];
              tidySides(cell);
              if (sameItems(cell.left, before.left) && sameItems(cell.right, before.right)) {
                undoTo(before)();
                continue;
              }
              yield { row: block.row, undo: undoTo(before) };
            }
          }
        }
      }
    }
  }
}

/* Mouvements composés : rapprocher d'un coup les deux conjoints d'une union que des cases séparent. */

/** Place une cellule à un bout de son bloc. */
function toEnd(block: Block, cell: Cell, right: boolean): void {
  const rest = block.cells.filter((other) => other !== cell);
  block.cells = right ? [...rest, cell] : [cell, ...rest];
}

/** Place une cellule juste avant ou juste après une autre du même bloc. */
function beside(block: Block, cell: Cell, anchor: Cell, after: boolean): void {
  const rest = block.cells.filter((other) => other !== cell);
  const index = rest.indexOf(anchor);
  if (index < 0) return;
  rest.splice(after ? index + 1 : index, 0, cell);
  block.cells = rest;
}

/** Tourne une cellule pour que l'emplacement `s` en occupe le bord voulu, si sa forme le permet. */
function face(cell: Cell, s: number, right: boolean): void {
  const near: 'left' | 'right' = right ? 'right' : 'left';
  const away: 'left' | 'right' = right ? 'left' : 'right';
  const mirror = (): void => {
    cell.core = cell.core.slice().reverse();
    const left = cell.left;
    cell.left = cell.right;
    cell.right = left;
  };
  if (cell.core.includes(s)) {
    if (cell.core.length === 1) {
      // Tous les conjoints passent de l'autre côté : le bord est libre.
      cell[away] = [...cell[away], ...cell[near]];
      cell[near] = [];
      tidySides(cell);
    } else if (at(cell.core, right ? 0 : cell.core.length - 1) === s) {
      mirror();
    }
    return;
  }
  const holds = (item: Item): boolean => at(item.slots, item.slots.length - 1) === s;
  if (cell[near].some(holds)) {
    const item = need(cell[near].find(holds), 'conjoint');
    cell[near] = [...cell[near].filter((other) => other !== item), item];
  } else if (cell[away].some(holds)) {
    if (cell.core.length !== 1) {
      mirror();
      face(cell, s, right);
      return;
    }
    const item = need(cell[away].find(holds), 'conjoint');
    cell[away] = cell[away].filter((other) => other !== item);
    cell[near] = [...cell[near], item];
  }
  tidySides(cell);
}

/** Cellules, dans un même bloc, des parents de deux fratries ; `null` si elles n'ont pas de bloc commun. */
function parentCells(model: Model, first: Block, second: Block): { block: Block; first: Cell; second: Cell } | null {
  const cellsOf = (block: Block): Cell[] => {
    const source = block.source;
    if (!source) return [];
    const parents = source.couple ? [source.couple.a, source.couple.b] : [source.person];
    return parents.map((parent) => model.cellOfSlot.get(parent)).filter((cell): cell is Cell => cell !== undefined);
  };
  for (const a of cellsOf(first)) {
    for (const b of cellsOf(second)) {
      const block = model.blockOfCell.get(a);
      if (a !== b && block && block === model.blockOfCell.get(b)) return { block, first: a, second: b };
    }
  }
  return null;
}

/**
 * Essais composés. Pour chaque union d'une même rangée : les deux conjoints au bord de leurs
 * fratries, face à face, puis les fratries elles-mêmes rendues voisines en déplaçant leurs
 * parents. Pour chaque union entre deux générations : le conjoint du bas au bord de sa
 * fratrie, ses parents au bord de la leur, le conjoint du haut contre eux.
 */
function* jointMoves(model: Model): Generator<Move> {
  const cellOf = (s: number): Cell => need(model.cellOfSlot.get(s), 'cellule');
  const blockOf = (cell: Cell): Block => need(model.blockOfCell.get(cell), 'bloc');
  for (const couple of model.couples) {
    const trials: (() => number)[] = [];
    // Ce que les essais de ce couple peuvent toucher : de quoi les défaire sans photographier tout le modèle.
    const blocks = new Set<Block>();
    const cells = new Set<Cell>();
    if (couple.ghost < 0) {
      for (const [l, r] of [[couple.a, couple.b], [couple.b, couple.a]] as const) {
        const cl = cellOf(l);
        const cr = cellOf(r);
        if (cl === cr) continue;
        const bl = blockOf(cl);
        const br = blockOf(cr);
        const above = bl === br ? null : parentCells(model, bl, br);
        cells.add(cl).add(cr);
        blocks.add(bl).add(br);
        if (above) blocks.add(above.block);
        const meet = (): void => {
          face(cl, l, true);
          face(cr, r, false);
          if (bl === br) {
            beside(bl, cl, cr, false);
          } else {
            toEnd(bl, cl, true);
            toEnd(br, cr, false);
          }
        };
        trials.push(() => {
          meet();
          return bl.row;
        });
        if (!above) continue;
        trials.push(() => {
          meet();
          beside(above.block, above.first, above.second, false);
          return above.block.row;
        });
      }
    } else {
      const low = cellOf(couple.lower);
      const lowBlock = blockOf(low);
      const high = cellOf(couple.upper);
      const highBlock = blockOf(high);
      const ghost = low.left.concat(low.right).find((item) => item.ghost && at(item.slots, 0) === couple.ghost);
      const source = lowBlock.source;
      const parent = source ? model.cellOfSlot.get(source.couple ? source.couple.lower : source.person) : undefined;
      cells.add(low);
      blocks.add(lowBlock).add(highBlock);
      if (parent) blocks.add(blockOf(parent));
      for (const right of [false, true]) {
        const lean = (): void => {
          toEnd(lowBlock, low, right);
          if (!ghost || low.core.length !== 1) return;
          low.left = low.left.filter((item) => item !== ghost);
          low.right = low.right.filter((item) => item !== ghost);
          if (right) low.right = [ghost, ...low.right];
          else low.left = [ghost, ...low.left];
        };
        trials.push(() => {
          lean();
          return lowBlock.row;
        });
        if (!parent || parent === high) continue;
        const parentBlock = blockOf(parent);
        trials.push(() => {
          lean();
          toEnd(parentBlock, parent, right);
          return parentBlock.row;
        });
        if (parentBlock === highBlock) {
          // Oncle et nièce : l'oncle contre les parents, du côté où la nièce l'attend.
          trials.push(() => {
            lean();
            beside(parentBlock, high, parent, right);
            return parentBlock.row;
          });
        } else {
          trials.push(() => {
            lean();
            toEnd(parentBlock, parent, right);
            toEnd(highBlock, high, !right);
            return Math.min(parentBlock.row, highBlock.row);
          });
        }
      }
    }
    for (const trial of trials) {
      // Les tableaux ne sont jamais modifiés en place : garder leurs références suffit.
      const order = [...blocks].map((block) => ({ block, cells: block.cells }));
      const shapes = [...cells].map((cell) => ({ cell, core: cell.core, left: cell.left, right: cell.right }));
      const row = trial();
      yield {
        row,
        undo: () => {
          for (const entry of order) entry.block.cells = entry.cells;
          for (const entry of shapes) {
            entry.cell.core = entry.core;
            entry.cell.left = entry.left;
            entry.cell.right = entry.right;
          }
        },
      };
    }
  }
}

function* allMoves(model: Model): Generator<Move> {
  yield* jointMoves(model);
  yield* moves(model);
}

const PASSES = 3;
const SEARCH_SWEEPS = 6;
const EPSILON = 1e-6;

function optimise(model: Model, o: Resolved): Derived {
  let best = derive(model, o);
  let saved = snapshot(model);
  let current = best;
  const keepIfBetter = (): void => {
    if (current.cost < best.cost - EPSILON) {
      best = current;
      saved = snapshot(model);
    }
  };
  for (let pass = 0; pass < PASSES; pass += 1) {
    current = sweepDown(model, o, current);
    keepIfBetter();
    current = sweepUp(model, o, current);
    keepIfBetter();
  }
  restore(model, saved);

  // Deux états suffisent : le meilleur connu et celui de l'essai en cours, qui échangent leurs rôles quand l'essai est retenu.
  let spare: Derived | null = null;
  for (let sweep = 0; sweep < SEARCH_SWEEPS; sweep += 1) {
    let improved = false;
    for (const move of allMoves(model)) {
      const candidate = derive(model, o, move.row, best, spare);
      if (candidate.cost < best.cost - EPSILON) {
        spare = best;
        best = candidate;
        improved = true;
      } else {
        spare = candidate;
        move.undo();
      }
    }
    if (!improved) break;
  }
  return derive(model, o);
}

/* ------------------------------------------------------------------ abscisses définitives */

const WEIGHT_DOWN = 1;
const WEIGHT_UP = 1;
const WEIGHT_DESCENT = 0.4;
const WEIGHT_REST = 1e-4;
const RELAX_ITERATIONS = 30;
/** Écarts, en pixels, en deçà desquels une fratrie est ramenée à l'aplomb : d'un enfant sous le tronc, ou de son milieu. */
const SNAP_DROP = 10;
const SNAP_MIDDLE = 6;

/** Tout ce qu'il faut pour lire une abscisse dans l'état courant des rangées. */
function makeReader(model: Model, derived: Derived) {
  const rowOf = (s: number): RowState => at(derived.rows, at(model.slotRow, s));
  const left = (s: number): number => {
    const row = rowOf(s);
    const i = at(derived.pos, s);
    return at(row.cellX, at(row.cellIndex, i)) + at(row.offset, i);
  };
  const centre = (s: number): number => left(s) + at(model.slotWidth, s) / 2;
  const cellOf = (s: number): number => at(rowOf(s).cellIndex, at(derived.pos, s));
  const markerX = (couple: Couple): number => {
    const g = at(derived.gap, couple.index);
    if (g === -1) return centre(couple.ghost);
    if (g < 0) return (centre(couple.a) + centre(couple.b)) / 2;
    const row = at(derived.rows, couple.row);
    const start = left(at(row.seq, g)) + at(row.width, g);
    const end = left(at(row.seq, g + 1));
    return start + ((at(derived.rank, couple.index) + 1) / (at(row.used, g) + 1)) * (end - start);
  };
  const sourceX = (source: Source): number => (source.couple ? markerX(source.couple) : centre(source.person));
  /** Cellules qui portent l'origine : une seule, ou les deux qui encadrent le point d'union. */
  const sourceCells = (source: Source): number[] => {
    if (!source.couple) return [cellOf(source.person)];
    const g = at(derived.gap, source.couple.index);
    if (g < 0) return [cellOf(source.couple.ghost >= 0 ? source.couple.ghost : source.couple.a)];
    const row = at(derived.rows, source.row);
    const a = at(row.cellIndex, g);
    const b = at(row.cellIndex, g + 1);
    return a === b ? [a] : [a, b];
  };
  return { left, centre, cellOf, markerX, sourceX, sourceCells };
}

function relax(model: Model, derived: Derived): void {
  const read = makeReader(model, derived);
  const solve = (r: number): void => {
    const row = at(derived.rows, r);
    const size = row.cellX.length;
    if (size === 0) return;
    const weight: number[] = new Array<number>(size).fill(0);
    const pull: number[] = new Array<number>(size).fill(0);
    const add = (c: number, w: number, target: number): void => {
      weight[c] = at(weight, c) + w;
      pull[c] = at(pull, c) + w * target;
    };
    for (const formation of row.formations) {
      const origin = read.sourceX(formation.source) - formation.middle - at(row.prefix, formation.first);
      for (let c = formation.first; c <= formation.last; c += 1) add(c, WEIGHT_DOWN, origin + at(row.prefix, c));
    }
    for (const source of at(model.sourcesByRow, r)) {
      let lowest = Infinity;
      let highest = -Infinity;
      for (const child of source.children) {
        const middle = read.centre(child);
        lowest = Math.min(lowest, middle);
        highest = Math.max(highest, middle);
      }
      if (lowest === Infinity) continue;
      const shift = (lowest + highest) / 2 - read.sourceX(source);
      const cells = read.sourceCells(source);
      for (const c of cells) add(c, WEIGHT_UP / cells.length, at(row.cellX, c) + shift);
    }
    for (const couple of at(model.descentsInto, r)) {
      const c = read.cellOf(couple.ghost);
      add(c, WEIGHT_DESCENT, at(row.cellX, c) + read.centre(couple.upper) - read.centre(couple.ghost));
    }
    for (const couple of at(model.descentsFrom, r)) {
      const c = read.cellOf(couple.upper);
      add(c, WEIGHT_DESCENT, at(row.cellX, c) + read.centre(couple.ghost) - read.centre(couple.upper));
    }
    const target: number[] = [];
    const weights: number[] = [];
    for (let c = 0; c < size; c += 1) {
      const w = at(weight, c);
      target.push((w > 0 ? at(pull, c) / w : at(row.cellX, c)) - at(row.prefix, c));
      weights.push(w > 0 ? w : WEIGHT_REST);
    }
    const solved = isotonic(target, weights);
    for (let c = 0; c < size; c += 1) row.cellX[c] = at(solved, c) + at(row.prefix, c);
  };

  for (let iteration = 0; iteration < RELAX_ITERATIONS; iteration += 1) {
    for (let r = 0; r < derived.rows.length; r += 1) solve(r);
    for (let r = derived.rows.length - 1; r >= 0; r -= 1) solve(r);
  }

  // Abscisses entières, écartements garantis.
  const floorOf = (row: RowState, c: number): number => (c === 0 ? -Infinity : at(row.cellX, c - 1) + at(row.cellWidth, c - 1) + at(row.cellGap, c - 1));
  for (const row of derived.rows) {
    for (let c = 0; c < row.cellX.length; c += 1) row.cellX[c] = Math.max(Math.round(at(row.cellX, c)), floorOf(row, c));
  }
  // Pas de petit décrochement : un enfant qui tombe à quelques pixels de l'aplomb du tronc y est
  // ramené avec toute sa fratrie ; à défaut, une fratrie presque centrée sous ses parents l'est tout à fait.
  for (let r = 0; r < derived.rows.length; r += 1) {
    const row = at(derived.rows, r);
    for (const formation of row.formations) {
      const origin = read.sourceX(formation.source);
      let lowest = Infinity;
      let highest = -Infinity;
      let nearest = Infinity;
      for (const child of formation.source.children) {
        if (at(model.slotRow, child) !== r) continue;
        const middle = read.centre(child);
        lowest = Math.min(lowest, middle);
        highest = Math.max(highest, middle);
        if (Math.abs(origin - middle) < Math.abs(nearest)) nearest = origin - middle;
      }
      const centring = origin - (lowest + highest) / 2;
      // Les cases restent sur des pixels entiers.
      const whole = (value: number, limit: number): boolean => Number.isInteger(value) && Math.abs(value) <= limit;
      const delta = whole(nearest, SNAP_DROP) ? nearest : whole(centring, SNAP_MIDDLE) ? centring : 0;
      if (delta === 0) continue;
      const { first, last } = formation;
      const roomLeft = at(row.cellX, first) - floorOf(row, first);
      const roomRight = last === row.cellX.length - 1 ? Infinity : at(row.cellX, last + 1) - floorOf(row, last + 1);
      if (delta < 0 ? -delta > roomLeft : delta > roomRight) continue;
      for (let c = first; c <= last; c += 1) row.cellX[c] = at(row.cellX, c) + delta;
    }
  }
}

/* ------------------------------------------------------------------ couloirs */

/** Crochets d'une rangée : les plus courts au plus près des cases, un couloir de plus à chaque recouvrement. */
function bracketLanes(spans: readonly Span[]): number[] {
  const length = (index: number): number => at(spans, index).hi - at(spans, index).lo;
  const order = spans.map((_, index) => index).sort((a, b) => length(a) - length(b) || a - b);
  const lane: number[] = new Array<number>(spans.length).fill(-1);
  for (const index of order) {
    let free = 0;
    for (const other of order) {
      if (at(lane, other) >= 0 && other !== index && overlap(at(spans, index), at(spans, other))) free = Math.max(free, at(lane, other) + 1);
    }
    lane[index] = free;
  }
  return lane;
}

const CLASH = 1000;
/** Vrai si, `upper` passant au-dessus de `lower`, une descente de `upper` longerait le tronc de `lower`. */
const clash = (upper: Net, lower: Net): boolean => upper.drops.some((x) => Math.abs(x - lower.trunk) < 1);

/**
 * Barres d'un même entre-rangées. Deux barres qui se recouvrent prennent des couloirs
 * différents ; celle du dessus est choisie pour que tronc et descentes ne coupent pas l'autre.
 */
function busLanes(nets: readonly Net[]): number[] {
  const count = nets.length;
  const below: number[][] = nets.map(() => []);
  const waiting: number[] = new Array<number>(count).fill(0);
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      const a = at(nets, i);
      const b = at(nets, j);
      if (!overlap(a, b)) continue;
      // Un tronc à l'aplomb exact d'une descente de l'autre barre se superposerait à elle s'il passait dessous : il passe dessus, quoi qu'il en coûte.
      const first = price(a, b) + (clash(a, b) ? CLASH : 0);
      const second = price(b, a) + (clash(b, a) ? CLASH : 0);
      if (first === second) continue;
      const upper = first < second ? i : j;
      const lower = first < second ? j : i;
      at(below, upper).push(lower);
      waiting[lower] = at(waiting, lower) + 1;
    }
  }
  const lane: number[] = new Array<number>(count).fill(-1);
  const done: boolean[] = new Array<boolean>(count).fill(false);
  for (let step = 0; step < count; step += 1) {
    // Le premier que plus rien ne doit précéder ; en cas de cycle, le premier restant.
    let pick = -1;
    for (let i = 0; i < count; i += 1) {
      if (at(done, i)) continue;
      if (at(waiting, i) === 0) {
        pick = i;
        break;
      }
      if (pick < 0) pick = i;
    }
    if (pick < 0) break;
    done[pick] = true;
    let free = 0;
    for (let i = 0; i < count; i += 1) {
      if (i !== pick && at(lane, i) >= 0 && overlap(at(nets, pick), at(nets, i))) free = Math.max(free, at(lane, i) + 1);
    }
    lane[pick] = free;
    for (const lower of at(below, pick)) waiting[lower] = at(waiting, lower) - 1;
  }
  return lane;
}

/* ------------------------------------------------------------------ points d'attache */

const PORT_STEP = 12;
const PORT_CLEARANCE = 8;

/** Point où un tracé d'union touche le bord d'une case (dessus ou dessous). */
interface Port {
  person: number;
  top: boolean;
  /** Abscisse vers laquelle part le tracé. */
  target: number;
  /** Vrai pour le trait qui descend vers une union de la génération suivante. */
  descent: boolean;
  x: number;
}

/**
 * Répartit sur le bord d'une case les tracés d'union qui la touchent : jamais deux au même
 * endroit, jamais au milieu quand la filiation y passe. L'ordre évite qu'ils se coupent au
 * départ : les crochets (qui reviennent dans la rangée) du plus court au bord au plus long
 * vers l'intérieur ; les descentes (qui continuent vers la rangée du dessous) à l'intérieur
 * des crochets, la plus lointaine vers le bord.
 */
function placePorts(
  ports: readonly Port[],
  box: {
    left: (s: number) => number;
    width: (s: number) => number;
    inset: (s: number) => number;
    centreTaken: (s: number, top: boolean) => boolean;
  },
): void {
  const sides = new Map<string, Port[]>();
  for (const entry of ports) pushTo(sides, `${entry.person}:${entry.top ? 't' : 'b'}`, entry);
  for (const group of sides.values()) {
    const first = at(group, 0);
    const s = first.person;
    const left = box.left(s);
    const width = box.width(s);
    const inset = box.inset(s);
    const centre = left + width / 2;
    const taken = box.centreTaken(s, first.top);
    if (group.length === 1) {
      if (!first.descent) {
        first.x = taken ? (first.target >= centre ? left + width - inset : left + inset) : centre;
        continue;
      }
      // Une descente seule part à l'aplomb du point d'union quand il est sous la case.
      const straight = Math.min(Math.max(first.target, left + inset), left + width - inset);
      first.x = taken && Math.abs(straight - centre) < inset ? centre + (first.target >= centre ? inset : -inset) : straight;
      continue;
    }
    const far = (entry: Port): number => Math.abs(entry.target - centre);
    // Du bord vers le milieu : crochets du plus proche au plus lointain, puis descentes de la plus lointaine à la plus proche.
    const inward = (a: Port, b: Port): number =>
      Number(a.descent) - Number(b.descent) || (a.descent ? far(b) - far(a) : far(a) - far(b)) || ports.indexOf(a) - ports.indexOf(b);
    const room = width / 2 - inset - PORT_CLEARANCE;
    for (const rightward of [false, true]) {
      const side = group.filter((entry) => entry.target >= centre === rightward).sort(inward);
      const step = side.length > 1 ? Math.min(PORT_STEP, room / (side.length - 1)) : 0;
      side.forEach((entry, index) => {
        const depth = inset + Math.round(index * step);
        entry.x = rightward ? left + width - depth : left + depth;
      });
    }
  }
}

/* ------------------------------------------------------------------ tracés */

function route(model: Model, derived: Derived, graph: FamilyGraph, o: Resolved): LayoutResult {
  const read = makeReader(model, derived);
  const rows = model.rows;
  const name = (s: number): string => at(model.slotName, s);
  const widthOf = (s: number): number => at(model.slotWidth, s);
  const inset = (s: number): number => Math.min(PORT_INSET, widthOf(s) / 4);

  // 1. Crochets de chaque rangée et barres de chaque entre-rangées, avec leurs couloirs.
  interface Bracket extends Span {
    couple: Couple;
    over: boolean;
    marker: number;
    /** Conjoints reliés par le crochet et abscisse où il les touche. */
    ends: Port[];
    /** Vrai pour le trait de repli entre une place réservée et un conjoint qui ne la touche pas. */
    fromMiddle: boolean;
    lane: number;
  }
  interface Bus extends Net {
    source: Source | null;
    couple: Couple | null;
    children: number[];
    lane: number;
  }
  const ports: Port[] = [];
  const port = (person: number, top: boolean, target: number, descent: boolean): Port => {
    const entry: Port = { person, top, target, descent, x: read.centre(person) };
    ports.push(entry);
    return entry;
  };
  const bracketsByRow: Bracket[][] = [];
  const bracketOf = new Map<Couple, Bracket>();
  const descentPort = new Map<Couple, Port>();
  for (let r = 0; r < rows; r += 1) {
    const brackets: Bracket[] = [];
    for (const couple of at(model.couplesByRow, r)) {
      const marker = read.markerX(couple);
      if (couple.ghost >= 0) descentPort.set(couple, port(couple.upper, false, marker, true));
      const code = at(derived.route, couple.index);
      if (code === ROUTE_SIDE) continue;
      const over = code === ROUTE_OVER;
      const ends =
        couple.ghost >= 0
          ? [port(couple.lower, over, marker, false)]
          : [port(couple.a, over, read.centre(couple.b), false), port(couple.b, over, read.centre(couple.a), false)];
      const bracket: Bracket = { couple, over, marker, ends, fromMiddle: couple.ghost >= 0, lo: marker, hi: marker, lane: 0 };
      brackets.push(bracket);
      bracketOf.set(couple, bracket);
    }
    bracketsByRow.push(brackets);
  }
  placePorts(ports, {
    left: read.left,
    width: widthOf,
    inset,
    // Le milieu du bord est pris par la filiation : celle qui arrive par le haut, ou le tronc d'un parent seul.
    centreTaken: (s, top) => (top ? at(model.sourceOfChild, s) !== null : model.sources.some((source) => source.person === s)),
  });

  const busesByRow: Bus[][] = [];
  const overCount: number[] = [];
  const underCount: number[] = [];
  for (let r = 0; r < rows; r += 1) {
    const brackets = at(bracketsByRow, r);
    for (const bracket of brackets) {
      const xs = [bracket.marker, ...bracket.ends.map((end) => end.x)];
      bracket.lo = Math.min(...xs);
      bracket.hi = Math.max(...xs);
    }
    for (const over of [true, false]) {
      const group = brackets.filter((bracket) => bracket.over === over);
      const lanes = bracketLanes(group);
      group.forEach((bracket, index) => {
        bracket.lane = at(lanes, index);
      });
      (over ? overCount : underCount).push(group.length > 0 ? Math.max(...lanes) + 1 : 0);
    }

    const buses: Bus[] = [];
    for (const entry of at(model.netsInto, r)) {
      const trunk = read.sourceX(entry.source);
      const drops = entry.children.map(read.centre);
      buses.push({ source: entry.source, couple: null, children: entry.children, trunk, drops, lo: Math.min(trunk, ...drops), hi: Math.max(trunk, ...drops), lane: 0 });
    }
    for (const couple of at(model.descentsInto, r)) {
      const drop = read.markerX(couple);
      const trunk = need(descentPort.get(couple), `descente ${couple.id}`).x;
      buses.push({ source: null, couple, children: [], trunk, drops: [drop], lo: Math.min(trunk, drop), hi: Math.max(trunk, drop), lane: 0 });
    }
    const lanes = busLanes(buses);
    buses.forEach((bus, index) => {
      bus.lane = at(lanes, index);
    });
    busesByRow.push(buses);
  }

  // 2. Ordonnées : entre deux rangées, les crochets du dessous de l'une, les barres, les crochets du dessus de l'autre.
  const lane = o.laneGap;
  const rowTop: number[] = [];
  const busTop: number[] = [];
  for (let r = 0; r < rows; r += 1) {
    const buses = at(busesByRow, r);
    const busCount = buses.length > 0 ? Math.max(...buses.map((bus) => bus.lane)) + 1 : 0;
    const over = at(overCount, r);
    if (r === 0) {
      rowTop.push(over > 0 ? (over + 1) * lane : 0);
      busTop.push(0);
      continue;
    }
    const under = at(underCount, r - 1);
    const previousBottom = at(rowTop, r - 1) + o.nodeHeight;
    const needed = (under + busCount + over + 2) * lane + (busCount > 0 ? lane : 0);
    const top = previousBottom + Math.max(o.rowGap, needed);
    const zoneStart = previousBottom + (under + 1) * lane;
    const zoneEnd = top - (over + 1) * lane;
    busTop.push((zoneStart + zoneEnd) / 2 - ((Math.max(busCount, 1) - 1) * lane) / 2);
    rowTop.push(top);
  }
  const rowMiddle = (r: number): number => at(rowTop, r) + o.nodeHeight / 2;
  const laneY = (r: number, bracket: Bracket): number =>
    bracket.over ? at(rowTop, r) - (bracket.lane + 1) * lane : at(rowTop, r) + o.nodeHeight + (bracket.lane + 1) * lane;
  /** Ordonnée du point d'union : sur son crochet, sinon au milieu de la rangée. */
  const markerY = (couple: Couple): number => {
    const bracket = bracketOf.get(couple);
    return bracket && !bracket.fromMiddle ? laneY(couple.row, bracket) : rowMiddle(couple.row);
  };

  // 3. Sorties.
  const nodes: LayoutNode[] = graph.persons.map((person) => {
    const s = need(model.slotOf.get(person.id), person.id);
    const r = at(model.slotRow, s);
    return { id: person.id, x: read.left(s), y: at(rowTop, r), w: widthOf(s), h: o.nodeHeight, generation: r + model.minGeneration };
  });

  const tiesOf = new Map<Couple, LayoutTie[]>();
  for (const couple of model.couples) tiesOf.set(couple, []);
  const pushTie = (couple: Couple, tie: LayoutTie): void => {
    need(tiesOf.get(couple), couple.id).push(tie);
  };
  for (let r = 0; r < rows; r += 1) {
    const y = rowMiddle(r);
    for (const couple of at(model.couplesByRow, r)) {
      if (at(derived.route, couple.index) !== ROUTE_SIDE) continue;
      const marker = read.markerX(couple);
      for (const person of couple.ghost >= 0 ? [couple.lower] : [couple.a, couple.b]) {
        const edge = marker >= read.centre(person) ? read.left(person) + widthOf(person) : read.left(person);
        pushTie(couple, { person: name(person), route: 'side', points: [{ x: marker, y }, { x: edge, y }] });
      }
    }
    for (const bracket of at(bracketsByRow, r)) {
      const bar = laneY(r, bracket);
      const edge = bracket.over ? at(rowTop, r) : at(rowTop, r) + o.nodeHeight;
      for (const end of bracket.ends) {
        const start: Point[] = bracket.fromMiddle ? [{ x: bracket.marker, y }, { x: bracket.marker, y: bar }] : [{ x: bracket.marker, y: bar }];
        pushTie(bracket.couple, {
          person: name(end.person),
          route: bracket.over ? 'over' : 'under',
          points: [...start, { x: end.x, y: bar }, { x: end.x, y: edge }],
        });
      }
    }
  }

  const links: LayoutLink[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (const bus of at(busesByRow, r)) {
      const busY = at(busTop, r) + bus.lane * lane;
      if (bus.couple) {
        const upper = bus.couple.upper;
        const start = { x: bus.trunk, y: at(rowTop, at(model.slotRow, upper)) + o.nodeHeight };
        const end = { x: at(bus.drops, 0), y: rowMiddle(r) };
        const points = start.x === end.x ? [start, end] : [start, { x: start.x, y: busY }, { x: end.x, y: busY }, end];
        pushTie(bus.couple, { person: name(upper), route: 'descent', points });
        continue;
      }
      const source = bus.source;
      if (!source) continue;
      const startY = source.couple ? markerY(source.couple) : at(rowTop, source.row) + o.nodeHeight;
      bus.children.forEach((child, index) => {
        const start = { x: bus.trunk, y: startY };
        const end = { x: at(bus.drops, index), y: at(rowTop, r) };
        links.push({
          from: source.couple ? source.id : name(source.person),
          fromKind: source.couple ? 'union' : 'person',
          to: name(child),
          points: start.x === end.x ? [start, end] : [start, { x: start.x, y: busY }, { x: end.x, y: busY }, end],
          certainty: graph.parentageByChild.get(name(child))?.certainty ?? null,
        });
      });
    }
  }

  const unions: LayoutUnion[] = model.couples.map((couple) => ({
    id: couple.id,
    unionId: couple.unionId,
    x: read.markerX(couple),
    y: markerY(couple),
    a: name(couple.a),
    b: name(couple.b),
    consanguineous: couple.consanguineous,
    ties: need(tiesOf.get(couple), couple.id),
  }));

  // 4. Cadrage : tout est ramené dans un rectangle dont le coin est (0, 0), marge comprise.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const see = (px: number, py: number): void => {
    minX = Math.min(minX, px);
    minY = Math.min(minY, py);
    maxX = Math.max(maxX, px);
    maxY = Math.max(maxY, py);
  };
  for (const node of nodes) {
    see(node.x, node.y);
    see(node.x + node.w, node.y + node.h);
  }
  const lines = [...links.map((link) => link.points), ...unions.flatMap((union) => union.ties.map((tie) => tie.points))];
  for (const points of lines) for (const point of points) see(point.x, point.y);
  for (const union of unions) see(union.x, union.y);
  if (nodes.length === 0) {
    minX = 0;
    minY = 0;
    maxX = 0;
    maxY = 0;
  }
  const dx = o.padding - minX;
  const dy = o.padding - minY;
  for (const node of nodes) {
    node.x += dx;
    node.y += dy;
  }
  for (const points of lines) {
    for (const point of points) {
      point.x += dx;
      point.y += dy;
    }
  }
  for (const union of unions) {
    union.x += dx;
    union.y += dy;
  }

  return {
    nodes,
    unions,
    links,
    bounds: { x: 0, y: 0, width: maxX - minX + 2 * o.padding, height: maxY - minY + 2 * o.padding },
    rows: rowTop.map((y, r) => ({ generation: r + model.minGeneration, y: y + dy, height: o.nodeHeight })),
    estimate: { crossings: derived.crossings, brackets: derived.brackets },
  };
}

/* ------------------------------------------------------------------ entrée */

/**
 * Arbre complet en rangées de générations. Même graphe, mêmes options : même résultat.
 *
 * Coordonnées en pixels, origine en haut à gauche de `bounds`. Les unions consanguines ne
 * dupliquent personne : chaque personne a une seule case.
 */
export function layoutTree(graph: FamilyGraph, options: LayoutOptions = {}): LayoutResult {
  const o = resolve(options);
  const model = buildModel(graph, o);
  const derived = optimise(model, o);
  relax(model, derived);
  return route(model, derived, graph, o);
}

export { layoutThread } from './thread.ts';
export type { ThreadLayout, ThreadNode, ThreadOptions, ThreadStep } from './thread.ts';
