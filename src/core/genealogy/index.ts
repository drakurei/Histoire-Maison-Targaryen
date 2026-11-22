/**
 * Généalogie : graphe, parenté, vue rapprochée et mise en page de l'arbre.
 *
 * Point d'entrée unique pour l'interface : `import { buildGraph, layoutTree } from '@/core/genealogy'`.
 * Tout est pur : les personnes, unions et filiations arrivent en arguments (en pratique celles de
 * `@/core/content/people`), rien n'est lu ici.
 *
 *   const graph = buildGraph(persons, unions, parentage);
 *   const tree = layoutTree(graph);                 // arbre complet, en rangées de générations
 *   const thread = layoutThread(graph, mainThread); // fil vertical pour téléphone
 *   const view = focusOn(graph, 'rhaenyra');        // parents, unions, fratrie, grands-parents
 */
export {
  KIN_UI_KEYS,
  allegedFatherOf,
  ancestorsOf,
  buildGraph,
  childrenOf,
  consanguinity,
  descendantsOf,
  generationsOf,
  inbreedingOf,
  kinship,
  kinshipCoefficient,
  lineBetween,
  parentsOf,
  partnerIn,
  siblingsOf,
  spousesOf,
  unionsOf,
} from './graph.ts';
export type {
  Consanguinity,
  Family,
  FamilyGraph,
  GraphIssue,
  KinRelation,
  KinVars,
  Kinship,
  Line,
  Relative,
  Sibling,
  UnionKinRelation,
} from './graph.ts';

export { focusOn } from './focus.ts';
export type { FocusGrandparent, FocusParent, FocusUnion, FocusView, ParentRole } from './focus.ts';

export { layoutThread, layoutTree } from './layout.ts';
export type {
  Bounds,
  LayoutLink,
  LayoutNode,
  LayoutOptions,
  LayoutResult,
  LayoutRow,
  LayoutTie,
  LayoutUnion,
  Point,
  ThreadLayout,
  ThreadNode,
  ThreadOptions,
  ThreadStep,
  TieRoute,
} from './layout.ts';

export { auditLayout } from './audit.ts';
export type { LayoutAudit } from './audit.ts';
