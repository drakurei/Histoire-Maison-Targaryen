/**
 * Le fil vertical : la filiation directe, un maillon par génération, pour un écran étroit.
 *
 * Chaque maillon occupe une bande. À gauche, la personne du fil ; à droite, sur autant de
 * lignes qu'il faut, ses conjoints ; sous chaque conjoint, leurs enfants en éventail compact.
 * L'union d'où sort le maillon suivant est toujours la dernière : son tronc descend seul
 * jusqu'à la bande d'après.
 *
 * Personne n'est dessiné deux fois. Une sœur épousée par son frère n'apparaît pas dans
 * l'éventail de ses parents : elle est à côté de son mari, dans la bande suivante, et reçoit
 * de l'union de ses parents le même trait de filiation que lui. Un conjoint né plus haut
 * dans le fil (un oncle) est relié à l'union de ses parents par un couloir en marge droite.
 *
 * Fonction pure et déterministe.
 */
import type { Person } from '../content/types.ts';
import type { Family, FamilyGraph } from './graph.ts';
import { kinshipCoefficient, partnerIn, unionsOf } from './graph.ts';
import type { Bounds, LayoutLink, LayoutNode, LayoutTie, LayoutUnion, Point } from './layout.ts';

export interface ThreadOptions {
  /** Largeur totale disponible (360 par défaut : un téléphone). */
  width?: number;
  padding?: number;
  /** Case d'un maillon du fil. */
  mainWidth?: number;
  mainHeight?: number;
  /** Hauteur de la case d'un conjoint ; sa largeur est ce qui reste à droite du fil. */
  partnerHeight?: number;
  /** Hauteur et largeur minimale de la case d'un enfant de l'éventail. */
  childHeight?: number;
  childMinWidth?: number;
  /** Espace entre la colonne du fil et celle des conjoints : il porte les points d'union. */
  unionGap?: number;
  /** Écart entre deux cases voisines. */
  gap?: number;
  /** Hauteur libre entre deux maillons. */
  stepGap?: number;
  laneGap?: number;
  /**
   * Vrai pour un enfant dont le nom ne tient pas dans une case d'éventail de `childWidth`
   * pixels : il prend toute la largeur de la colonne des conjoints, sur sa propre ligne, à son
   * rang de naissance. L'interface, qui connaît la police, en décide ; par défaut aucun.
   */
  wideChild?: (person: Person, childWidth: number) => boolean;
}

export interface ThreadNode extends LayoutNode {
  /** `thread` : maillon du fil ; `partner` : conjoint ; `child` : enfant de l'éventail. */
  role: 'thread' | 'partner' | 'child';
  /** Rang du maillon auquel la case appartient. */
  step: number;
  /** Vrai si la personne a déjà une case plus haut (conjoint de deux maillons, par exemple). */
  repeat: boolean;
}

export interface ThreadStep {
  id: string;
  index: number;
  y: number;
  height: number;
}

export interface ThreadLayout {
  nodes: ThreadNode[];
  unions: LayoutUnion[];
  links: LayoutLink[];
  bounds: Bounds;
  steps: ThreadStep[];
}

interface Resolved {
  width: number;
  padding: number;
  mainWidth: number;
  mainHeight: number;
  partnerHeight: number;
  childHeight: number;
  childMinWidth: number;
  unionGap: number;
  gap: number;
  stepGap: number;
  laneGap: number;
  wideChild: ((person: Person, childWidth: number) => boolean) | null;
}

function resolve(options: ThreadOptions): Resolved {
  return {
    width: options.width ?? 360,
    padding: options.padding ?? 12,
    mainWidth: options.mainWidth ?? 132,
    mainHeight: options.mainHeight ?? 44,
    partnerHeight: options.partnerHeight ?? 36,
    childHeight: options.childHeight ?? 28,
    childMinWidth: options.childMinWidth ?? 76,
    unionGap: options.unionGap ?? 32,
    gap: options.gap ?? 6,
    stepGap: options.stepGap ?? 30,
    laneGap: options.laneGap ?? 8,
    wideChild: options.wideChild ?? null,
  };
}

/** Une ligne d'une bande : un conjoint (ou aucun) et les enfants nés de ce couple. */
interface Row {
  /** Identifiant du point d'union ; `null` quand un seul parent est connu. */
  coupleId: string | null;
  unionId: string | null;
  partner: string | null;
  family: Family | null;
  bearing: boolean;
  /** Enfants de l'éventail (ni le maillon suivant, ni un conjoint placé ailleurs). */
  fan: string[];
  /** Enfants qui ont leur case ailleurs, comme conjoints. */
  away: string[];
}

interface Step {
  id: string;
  rows: Row[];
}

/** Trait de filiation vers une personne placée comme conjoint dans une autre bande. */
interface Remote {
  from: { step: number; row: number };
  to: { step: number; row: number };
  child: string;
  direct: boolean;
  lane: number;
}

function planSteps(graph: FamilyGraph, ids: readonly string[]): Step[] {
  const steps: Step[] = [];
  const known = ids.filter((id, index) => graph.personById.has(id) && ids.indexOf(id) === index);
  // Un couple formé de deux maillons du fil n'est montré qu'une fois, au maillon le plus bas.
  const shownLater = (id: string, partner: string | null): boolean => partner !== null && known.indexOf(partner) > known.indexOf(id);
  known.forEach((id, index) => {
    const next = known[index + 1];
    const families = graph.familiesOfParent.get(id) ?? [];
    const rows: Row[] = [];
    for (const union of unionsOf(graph, id)) {
      if (shownLater(id, partnerIn(union, id))) continue;
      const family = families.find((candidate) => candidate.id === union.id) ?? null;
      rows.push({
        coupleId: union.id,
        unionId: union.id,
        partner: partnerIn(union, id),
        family,
        bearing: next !== undefined && (family?.children.includes(next) ?? false),
        fan: [],
        away: [],
      });
    }
    for (const family of families) {
      if (rows.some((row) => row.family === family)) continue;
      const partner = family.parents.find((parent) => parent !== id) ?? null;
      if (shownLater(id, partner)) continue;
      rows.push({
        coupleId: partner === null ? null : family.id,
        unionId: family.unionId,
        partner,
        family,
        bearing: next !== undefined && family.children.includes(next),
        fan: [],
        away: [],
      });
    }
    // Conjoints d'abord, parent seul ensuite, et l'union d'où sort le maillon suivant en dernier.
    const weight = (row: Row): number => (row.bearing ? 2 : row.partner === null ? 1 : 0);
    rows.sort((a, b) => weight(a) - weight(b));
    steps.push({ id, rows });
  });
  return steps;
}

/**
 * Fil vertical des maillons `mainThreadIds` (chacun enfant du précédent), avec conjoints et
 * enfants. Les identifiants inconnus du graphe sont ignorés.
 */
export function layoutThread(graph: FamilyGraph, mainThreadIds: readonly string[], options: ThreadOptions = {}): ThreadLayout {
  const o = resolve(options);
  const steps = planSteps(graph, mainThreadIds);
  const mains = new Set(steps.map((step) => step.id));

  // Où chaque conjoint a sa case : la première bande qui le cite.
  const partnerSpot = new Map<string, { step: number; row: number }>();
  steps.forEach((step, s) => {
    step.rows.forEach((row, r) => {
      if (row.partner !== null && !mains.has(row.partner) && !partnerSpot.has(row.partner)) partnerSpot.set(row.partner, { step: s, row: r });
    });
  });

  // Répartition des enfants : maillon suivant, conjoint placé ailleurs, ou éventail.
  const remotes: Remote[] = [];
  steps.forEach((step, s) => {
    step.rows.forEach((row, r) => {
      for (const child of row.family?.children ?? []) {
        if (mains.has(child)) continue;
        const spot = partnerSpot.get(child);
        if (!spot) {
          row.fan.push(child);
          continue;
        }
        row.away.push(child);
        const direct = row.bearing && spot.step === s + 1 && spot.row === 0;
        remotes.push({ from: { step: s, row: r }, to: spot, child, direct, lane: -1 });
      }
    });
  });
  // Couloirs de la marge droite : un par trait, partagé seulement si les bandes ne se chevauchent pas.
  let lanes = 0;
  const channelled = remotes.filter((remote) => !remote.direct);
  for (const remote of channelled) {
    const lo = Math.min(remote.from.step, remote.to.step);
    const hi = Math.max(remote.from.step, remote.to.step);
    const taken = new Set<number>();
    for (const other of channelled) {
      if (other.lane < 0) continue;
      if (Math.min(other.from.step, other.to.step) <= hi && lo <= Math.max(other.from.step, other.to.step)) taken.add(other.lane);
    }
    let lane = 0;
    while (taken.has(lane)) lane += 1;
    remote.lane = lane;
    lanes = Math.max(lanes, lane + 1);
  }

  // Colonnes.
  const mainLeft = o.padding;
  const mainRight = mainLeft + o.mainWidth;
  const mainCentre = mainLeft + o.mainWidth / 2;
  const combX = mainRight + Math.round(o.unionGap * 0.28);
  const markerX = mainRight + Math.round(o.unionGap * 0.62);
  const partnerLeft = mainRight + o.unionGap;
  const channelZone = lanes > 0 ? lanes * o.laneGap + 2 : 0;
  const partnerRight = Math.max(partnerLeft + o.childMinWidth, o.width - o.padding - channelZone);
  const partnerWidth = partnerRight - partnerLeft;
  const partnerCentre = partnerLeft + partnerWidth / 2;
  const columns = Math.max(1, Math.floor((partnerWidth + o.gap) / (o.childMinWidth + o.gap)));
  const childWidth = Math.floor((partnerWidth - (columns - 1) * o.gap) / columns);
  const channelX = (lane: number): number => partnerRight + 2 + (lane + 0.5) * o.laneGap;

  const nodes: ThreadNode[] = [];
  const unions: LayoutUnion[] = [];
  const links: LayoutLink[] = [];
  const stepsOut: ThreadStep[] = [];
  const generationOf = (id: string): number => graph.personById.get(id)?.generation ?? 0;
  const certaintyOf = (id: string): LayoutLink['certainty'] => graph.parentageByChild.get(id)?.certainty ?? null;

  /** Géométrie retenue pour chaque ligne : d'où part son tronc, où passent ses barres. */
  interface RowPlace {
    /** Du bord de la case du maillon (ou du point d'union) jusqu'au départ du tronc. */
    lead: Point[];
    trunkX: number;
    startY: number;
    centreY: number;
    /** Ordonnée de la barre qui rejoint le couloir de marge, sous l'éventail. */
    channelY: number;
    partnerTop: number;
  }
  const places: RowPlace[][] = [];
  const stepTop: number[] = [];
  const busY: number[] = [];

  let cursor = o.padding;
  steps.forEach((step, s) => {
    const top = cursor;
    stepTop.push(top);
    const mainMiddle = top + o.mainHeight / 2;
    nodes.push({ id: step.id, x: mainLeft, y: top, w: o.mainWidth, h: o.mainHeight, generation: generationOf(step.id), role: 'thread', step: s, repeat: false });
    const rowPlaces: RowPlace[] = [];
    let lineTop = top;
    let bottom = top + o.mainHeight;
    step.rows.forEach((row, r) => {
      const first = r === 0;
      const lineHeight = row.partner === null ? (first ? o.mainHeight : o.laneGap * 2) : first ? o.mainHeight : o.partnerHeight;
      const centreY = first ? mainMiddle : lineTop + lineHeight / 2;
      const partnerTop = centreY - o.partnerHeight / 2;
      // Un parent seul dont la ligne est la seule : le fil descend droit sous sa case.
      const straight = row.partner === null && step.rows.length === 1;
      const trunkX = straight ? mainCentre : markerX;
      const startY = straight ? top + o.mainHeight : centreY;

      if (row.partner !== null) {
        const spot = partnerSpot.get(row.partner);
        const repeat = mains.has(row.partner) || !spot || spot.step !== s || spot.row !== r;
        nodes.push({ id: row.partner, x: partnerLeft, y: partnerTop, w: partnerWidth, h: o.partnerHeight, generation: generationOf(row.partner), role: 'partner', step: s, repeat });
        const toMain: Point[] = first
          ? [{ x: markerX, y: centreY }, { x: mainRight, y: centreY }]
          : [{ x: markerX, y: centreY }, { x: combX, y: centreY }, { x: combX, y: mainMiddle }, { x: mainRight, y: mainMiddle }];
        const ties: LayoutTie[] = [
          { person: step.id, route: first ? 'side' : 'under', points: toMain },
          { person: row.partner, route: 'side', points: [{ x: markerX, y: centreY }, { x: partnerLeft, y: centreY }] },
        ];
        unions.push({
          id: row.coupleId ?? `${step.id}+${row.partner}`,
          unionId: row.unionId,
          x: markerX,
          y: centreY,
          a: step.id,
          b: row.partner,
          consanguineous: kinshipCoefficient(graph, step.id, row.partner) > 0,
          ties,
        });
      }

      // Éventail : des rangées de petites cases sous la ligne, une barre par rangée.
      let below = lineTop + lineHeight;
      const from = row.coupleId ?? step.id;
      const fromKind: LayoutLink['fromKind'] = row.coupleId === null ? 'person' : 'union';
      const lead: Point[] = straight || row.partner !== null
        ? [{ x: trunkX, y: startY }]
        : first
          ? [{ x: mainRight, y: centreY }, { x: markerX, y: centreY }]
          : [{ x: mainRight, y: mainMiddle }, { x: combX, y: mainMiddle }, { x: combX, y: centreY }, { x: markerX, y: centreY }];
      // Rang de naissance gardé : un enfant large ouvre sa propre ligne, le suivant repart à gauche.
      let column = 0;
      let line = 0;
      row.fan.forEach((child) => {
        const person = graph.personById.get(child);
        const wide = columns > 1 && o.wideChild !== null && person !== undefined && o.wideChild(person, childWidth);
        if (wide && column > 0) {
          line += 1;
          column = 0;
        }
        const w = wide ? partnerWidth : childWidth;
        const x = partnerLeft + column * (childWidth + o.gap);
        const y = lineTop + lineHeight + o.gap + o.laneGap + line * (o.childHeight + o.gap + o.laneGap);
        nodes.push({ id: child, x, y, w, h: o.childHeight, generation: generationOf(child), role: 'child', step: s, repeat: false });
        column = wide ? columns : column + 1;
        if (column >= columns) {
          line += 1;
          column = 0;
        }
        const bar = y - o.laneGap;
        const cx = x + w / 2;
        links.push({ from, fromKind, to: child, points: [...lead.map((p) => ({ ...p })), { x: trunkX, y: bar }, { x: cx, y: bar }, { x: cx, y }], certainty: certaintyOf(child) });
        below = y + o.childHeight;
      });
      const needsChannel = remotes.some((remote) => !remote.direct && remote.from.step === s && remote.from.row === r);
      const channelY = below + o.laneGap;
      if (needsChannel) below = channelY;
      rowPlaces.push({ lead, trunkX, startY, centreY, channelY, partnerTop });
      bottom = Math.max(bottom, below);
      lineTop = Math.max(below, first ? top + o.mainHeight : below) + o.gap;
    });
    places.push(rowPlaces);
    busY.push(bottom + o.stepGap / 2);
    stepsOut.push({ id: step.id, index: s, y: top, height: bottom - top });
    cursor = bottom + o.stepGap;
  });

  // Le fil lui-même : de l'union porteuse au maillon suivant.
  steps.forEach((step, s) => {
    const next = steps[s + 1];
    if (!next) return;
    const r = step.rows.findIndex((row) => row.bearing);
    const row = step.rows[r];
    const place = places[s]?.[r];
    const bar = busY[s];
    const nextTop = stepTop[s + 1];
    if (!row || !place || bar === undefined || nextTop === undefined) return;
    const lead = place.lead.map((point) => ({ ...point }));
    const end = { x: mainCentre, y: nextTop };
    links.push({
      from: row.coupleId ?? step.id,
      fromKind: row.coupleId === null ? 'person' : 'union',
      to: next.id,
      points: place.trunkX === end.x ? [...lead, end] : [...lead, { x: place.trunkX, y: bar }, { x: end.x, y: bar }, end],
      certainty: certaintyOf(next.id),
    });
  });

  // Filiation des conjoints nés dans le fil.
  for (const remote of remotes) {
    const source = steps[remote.from.step]?.rows[remote.from.row];
    const sourceStep = steps[remote.from.step];
    const place = places[remote.from.step]?.[remote.from.row];
    const target = places[remote.to.step]?.[remote.to.row];
    if (!source || !sourceStep || !place || !target) continue;
    const lead = place.lead.map((point) => ({ ...point }));
    let points: Point[];
    if (remote.direct) {
      const bar = busY[remote.from.step] ?? place.startY;
      points = [...lead, { x: place.trunkX, y: bar }, { x: partnerCentre, y: bar }, { x: partnerCentre, y: target.partnerTop }];
    } else {
      const x = channelX(remote.lane);
      const y = target.partnerTop + o.partnerHeight / 2;
      points = [...lead, { x: place.trunkX, y: place.channelY }, { x, y: place.channelY }, { x, y }, { x: partnerRight, y }];
    }
    links.push({
      from: source.coupleId ?? sourceStep.id,
      fromKind: source.coupleId === null ? 'person' : 'union',
      to: remote.child,
      points,
      certainty: certaintyOf(remote.child),
    });
  }

  const height = steps.length > 0 ? cursor - o.stepGap + o.padding : 2 * o.padding;
  const right = lanes > 0 ? channelX(lanes - 1) + o.laneGap / 2 + o.padding : partnerRight + o.padding;
  return { nodes, unions, links, bounds: { x: 0, y: 0, width: Math.max(o.width, right), height }, steps: stepsOut };
}
