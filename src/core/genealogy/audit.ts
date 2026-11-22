/**
 * Contrôle géométrique d'une mise en page : ce qu'un œil chercherait sur la planche, compté.
 *
 * Sert aux tests et à `scripts/tree-sheet.mjs`. Fonction pure ; elle ne suppose rien de
 * l'algorithme, seulement des cases rectangulaires et des tracés en lignes brisées.
 */
import type { LayoutLink, LayoutNode, LayoutUnion, Point } from './layout.ts';

export interface LayoutAudit {
  /** Paires de cases qui se recouvrent. */
  nodeOverlaps: [string, string][];
  /** Personnes dessinées plus d'une fois. */
  duplicates: string[];
  /** Tracés qui traversent une case : `tracé > case`. */
  linesThroughNodes: string[];
  /** Points d'union posés dans une case. */
  markersInNodes: string[];
  /** Tracés qui ne touchent pas ce qu'ils relient (case de la personne, point d'union). */
  loose: string[];
  /** Segments ni horizontaux ni verticaux. */
  diagonals: number;
  /** Croisements francs entre tracés d'origines différentes. */
  crossings: number;
  /** Tracés d'origines différentes superposés sur une longueur non nulle. */
  overlaps: number;
  /**
   * Superpositions entre tracés qui partent de la même personne : le « peigne » voulu par le
   * fil vertical (un seul trait sort de la case, il se divise vers chaque union). L'arbre
   * complet n'en a aucune.
   */
  combs: number;
  /** Détail des croisements et des superpositions : `origine × origine @ x,y`. */
  details: string[];
}

interface Segment {
  group: string;
  /** Personne d'où part le tracé, quand il part d'une case. */
  anchor: string | null;
  label: string;
  horizontal: boolean;
  /** Coordonnée fixe (y si horizontal, x sinon) et étendue sur l'autre axe. */
  fixed: number;
  lo: number;
  hi: number;
}

const EPSILON = 0.01;

function segmentsOf(points: readonly Point[], group: string, anchor: string | null, label: string, into: Segment[]): number {
  let diagonals = 0;
  for (let i = 0; i + 1 < points.length; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (!a || !b) continue;
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    if (dx < EPSILON && dy < EPSILON) continue;
    if (dy < EPSILON) into.push({ group, anchor, label, horizontal: true, fixed: a.y, lo: Math.min(a.x, b.x), hi: Math.max(a.x, b.x) });
    else if (dx < EPSILON) into.push({ group, anchor, label, horizontal: false, fixed: a.x, lo: Math.min(a.y, b.y), hi: Math.max(a.y, b.y) });
    else diagonals += 1;
  }
  return diagonals;
}

/** Le point est-il sur le bord de la case (ni dedans, ni à distance) ? */
function onBorder(point: Point | undefined, node: LayoutNode | undefined): boolean {
  if (!point || !node) return false;
  const withinX = point.x >= node.x - EPSILON && point.x <= node.x + node.w + EPSILON;
  const withinY = point.y >= node.y - EPSILON && point.y <= node.y + node.h + EPSILON;
  const onX = Math.abs(point.x - node.x) < EPSILON || Math.abs(point.x - node.x - node.w) < EPSILON;
  const onY = Math.abs(point.y - node.y) < EPSILON || Math.abs(point.y - node.y - node.h) < EPSILON;
  return (onX && withinY) || (onY && withinX);
}

function samePoint(a: Point | undefined, b: Point): boolean {
  return a !== undefined && Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON;
}

/**
 * Les tracés issus d'une même union (ses traits vers les conjoints, le tronc et les barres
 * de ses enfants) partagent des segments par construction : ils forment une seule origine.
 */
export function auditLayout(layout: {
  nodes: readonly LayoutNode[];
  unions: readonly LayoutUnion[];
  links: readonly LayoutLink[];
}): LayoutAudit {
  const audit: LayoutAudit = {
    nodeOverlaps: [],
    duplicates: [],
    linesThroughNodes: [],
    markersInNodes: [],
    loose: [],
    diagonals: 0,
    crossings: 0,
    overlaps: 0,
    combs: 0,
    details: [],
  };

  // Une personne redessinée (`repeat`) garde une seule case de référence : la première.
  const nodeById = new Map<string, LayoutNode>();
  const boxesById = new Map<string, LayoutNode[]>();
  for (const node of layout.nodes) {
    if (nodeById.has(node.id)) {
      if (!audit.duplicates.includes(node.id)) audit.duplicates.push(node.id);
    } else {
      nodeById.set(node.id, node);
    }
    const boxes = boxesById.get(node.id);
    if (boxes) boxes.push(node);
    else boxesById.set(node.id, [node]);
  }
  const touches = (point: Point | undefined, id: string): boolean => (boxesById.get(id) ?? []).some((node) => onBorder(point, node));
  for (let i = 0; i < layout.nodes.length; i += 1) {
    for (let j = i + 1; j < layout.nodes.length; j += 1) {
      const a = layout.nodes[i];
      const b = layout.nodes[j];
      if (!a || !b) continue;
      const apart = a.x + a.w <= b.x + EPSILON || b.x + b.w <= a.x + EPSILON || a.y + a.h <= b.y + EPSILON || b.y + b.h <= a.y + EPSILON;
      if (!apart) audit.nodeOverlaps.push([a.id, b.id]);
    }
  }

  const unionById = new Map<string, LayoutUnion>();
  for (const union of layout.unions) unionById.set(union.id, union);

  const segments: Segment[] = [];
  for (const link of layout.links) {
    const label = `${link.from} > ${link.to}`;
    audit.diagonals += segmentsOf(link.points, link.from, link.fromKind === 'person' ? link.from : null, label, segments);
    const first = link.points[0];
    const last = link.points[link.points.length - 1];
    const union = link.fromKind === 'union' ? unionById.get(link.from) : undefined;
    const leaves = link.fromKind === 'union' ? union !== undefined && samePoint(first, union) : touches(first, link.from);
    if (!leaves || !touches(last, link.to)) audit.loose.push(label);
  }
  for (const union of layout.unions) {
    for (const tie of union.ties) {
      const label = `${union.id} ~ ${tie.person}`;
      audit.diagonals += segmentsOf(tie.points, union.id, tie.person, label, segments);
      const first = tie.points[0];
      const last = tie.points[tie.points.length - 1];
      const joined = (samePoint(first, union) && touches(last, tie.person)) || (samePoint(last, union) && touches(first, tie.person));
      if (!joined) audit.loose.push(label);
    }
    const inside = layout.nodes.find(
      (node) => union.x > node.x + EPSILON && union.x < node.x + node.w - EPSILON && union.y > node.y + EPSILON && union.y < node.y + node.h - EPSILON,
    );
    if (inside) audit.markersInNodes.push(`${union.id} dans ${inside.id}`);
  }

  for (const segment of segments) {
    for (const node of layout.nodes) {
      const along = segment.horizontal ? { lo: node.x, hi: node.x + node.w } : { lo: node.y, hi: node.y + node.h };
      const across = segment.horizontal ? { lo: node.y, hi: node.y + node.h } : { lo: node.x, hi: node.x + node.w };
      const within = segment.fixed > across.lo + EPSILON && segment.fixed < across.hi - EPSILON;
      const length = Math.min(segment.hi, along.hi) - Math.max(segment.lo, along.lo);
      if (within && length > EPSILON) {
        const entry = `${segment.label} > ${node.id}`;
        if (!audit.linesThroughNodes.includes(entry)) audit.linesThroughNodes.push(entry);
      }
    }
  }

  const seen = new Set<string>();
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const a = segments[i];
      const b = segments[j];
      if (!a || !b || a.group === b.group) continue;
      if (a.horizontal === b.horizontal) {
        if (Math.abs(a.fixed - b.fixed) > EPSILON) continue;
        const length = Math.min(a.hi, b.hi) - Math.max(a.lo, b.lo);
        if (length <= EPSILON) continue;
        const where = a.horizontal ? `${Math.round(Math.max(a.lo, b.lo))},${Math.round(a.fixed)}` : `${Math.round(a.fixed)},${Math.round(Math.max(a.lo, b.lo))}`;
        const key = `=${a.group}|${b.group}|${where}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (a.anchor !== null && a.anchor === b.anchor) {
          audit.combs += 1;
        } else {
          audit.overlaps += 1;
          audit.details.push(`superposition : ${a.label} = ${b.label} @ ${where}`);
        }
        continue;
      }
      const h = a.horizontal ? a : b;
      const v = a.horizontal ? b : a;
      if (v.fixed > h.lo + EPSILON && v.fixed < h.hi - EPSILON && h.fixed > v.lo + EPSILON && h.fixed < v.hi - EPSILON) {
        // Plusieurs enfants d'une même fratrie partagent tronc et barre : un croisement, pas un par enfant.
        const key = `x${a.group}|${b.group}|${Math.round(v.fixed)},${Math.round(h.fixed)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        audit.crossings += 1;
        audit.details.push(`croisement : ${h.label} × ${v.label} @ ${Math.round(v.fixed)},${Math.round(h.fixed)}`);
      }
    }
  }
  return audit;
}
