/**
 * Les mêmes fonctions sur la généalogie entière, telle que l'application la charge.
 * Seul fichier du dossier qui lit les données : il les passe en arguments, comme le fera l'interface.
 */
import { describe, expect, it } from 'vitest';

import { mainThread, parentage, persons, unions } from '@/core/content/people';

import { auditLayout } from './audit.ts';
import { focusOn } from './focus.ts';
import { KIN_UI_KEYS, buildGraph, consanguinity, generationsOf, kinship, lineBetween } from './graph.ts';
import { layoutThread, layoutTree } from './layout.ts';

const graph = buildGraph(persons, unions, parentage);

describe('généalogie entière : graphe', () => {
  it('se construit sans anomalie', () => {
    expect(graph.issues).toEqual([]);
    expect(graph.persons).toHaveLength(persons.length);
    expect(graph.unions).toHaveLength(unions.length);
  });

  it('retrouve le champ generation de chaque personne', () => {
    const computed = generationsOf(graph);
    for (const person of persons) expect([person.id, computed.get(person.id)]).toEqual([person.id, person.generation]);
  });

  it('suit le fil de filiation directe d’Aenar à Daenerys', () => {
    for (let i = 1; i < mainThread.length; i += 1) {
      const parents = graph.parentIds.get(mainThread[i] ?? '') ?? [];
      expect(parents).toContain(mainThread[i - 1]);
    }
    const first = mainThread[0] ?? '';
    const last = mainThread[mainThread.length - 1] ?? '';
    const line = lineBetween(graph, first, last);
    expect(line?.up).toBe(0);
    // Le plus court chemin peut gagner une génération sur le fil : Aegon III descend de Baelon par Daemon, l'oncle de sa mère.
    expect(line?.down ?? 0).toBeLessThanOrEqual(mainThread.length - 1);
    expect(line?.down ?? 0).toBeGreaterThanOrEqual(mainThread.length - 3);
    expect(kinship(graph, last, first).relation).toBe('ancestor');
  });

  it('qualifie chaque union et ne rend que des clés déclarées', () => {
    const known = new Set(KIN_UI_KEYS);
    let close = 0;
    for (const union of unions) {
      const result = consanguinity(graph, union);
      expect(known.has(result.kinship.key)).toBe(true);
      expect(result.coefficient >= 0 && result.coefficient <= 0.5).toBe(true);
      expect(result.consanguineous).toBe(result.coefficient > 0);
      if (result.consanguineous) close += 1;
    }
    // Les unions entre proches sont le cœur du sujet : plus du quart des unions de la source.
    expect(close).toBeGreaterThan(unions.length / 4);
  });

  it('donne une vue rapprochée pour chaque personne', () => {
    for (const person of persons) {
      const view = focusOn(graph, person.id);
      expect(view?.person.id).toBe(person.id);
      expect(view?.parents.length ?? 0).toBeLessThanOrEqual(2);
      expect(view?.grandparents.length ?? 0).toBeLessThanOrEqual(4);
    }
  });
});

describe('généalogie entière : arbre', () => {
  const tree = layoutTree(graph);
  const audit = auditLayout(tree);

  it('dessine chaque personne une fois, dans sa rangée', () => {
    expect(tree.nodes).toHaveLength(persons.length);
    expect(audit.duplicates).toEqual([]);
    for (const node of tree.nodes) expect(node.generation).toBe(graph.personById.get(node.id)?.generation);
    expect(tree.links).toHaveLength(parentage.filter((link) => (graph.parentIds.get(link.child) ?? []).length > 0).length);
    for (const union of unions) expect(tree.unions.some((entry) => entry.id === union.id)).toBe(true);
  });

  it('ne chevauche rien et ne laisse aucun tracé en l’air', () => {
    expect(audit.nodeOverlaps).toEqual([]);
    expect(audit.linesThroughNodes).toEqual([]);
    expect(audit.markersInNodes).toEqual([]);
    expect(audit.loose).toEqual([]);
    expect(audit.diagonals).toBe(0);
    expect(audit.overlaps).toBe(0);
    expect(audit.combs).toBe(0);
  });

  it('garde peu de croisements', () => {
    // Mesuré à 5 sur la source actuelle ; la marge laisse vivre le contenu sans masquer une régression.
    expect(audit.crossings).toBeLessThanOrEqual(8);
  });

  it('est déterministe', () => {
    expect(layoutTree(buildGraph(persons, unions, parentage))).toEqual(tree);
  });
});

describe('généalogie entière : fil vertical', () => {
  const thread = layoutThread(graph, mainThread);
  const audit = auditLayout(thread);

  it('a un maillon par génération du fil', () => {
    expect(thread.steps.map((step) => step.id)).toEqual([...mainThread]);
    expect(thread.bounds.width).toBe(360);
  });

  it('ne chevauche rien, ne croise rien', () => {
    expect(audit.nodeOverlaps).toEqual([]);
    expect(audit.linesThroughNodes).toEqual([]);
    expect(audit.markersInNodes).toEqual([]);
    expect(audit.loose).toEqual([]);
    expect(audit.diagonals).toBe(0);
    expect(audit.overlaps).toBe(0);
    expect(audit.crossings).toBe(0);
  });

  it('ne redessine une personne que marquée comme répétée', () => {
    const seen = new Set<string>();
    for (const node of thread.nodes) {
      if (seen.has(node.id)) expect(node.repeat).toBe(true);
      seen.add(node.id);
    }
  });
});
