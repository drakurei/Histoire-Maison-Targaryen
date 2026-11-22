import { describe, expect, it } from 'vitest';

import { auditLayout } from './audit.ts';
import { makeChild, makePerson, makeUnion, mainThread, parentage, persons, unions } from './fixtures.ts';
import { buildGraph } from './graph.ts';
import type { FamilyGraph } from './graph.ts';
import type { Parentage } from '../content/types.ts';
import { layoutThread, layoutTree } from './layout.ts';
import type { LayoutNode, LayoutResult } from './layout.ts';

const graph = buildGraph(persons, unions, parentage);
const tree = layoutTree(graph);

function nodeOf(layout: { nodes: LayoutNode[] }, id: string): LayoutNode {
  const node = layout.nodes.find((entry) => entry.id === id);
  if (!node) throw new Error(`case absente : ${id}`);
  return node;
}

/** Tout ce qu'une planche lisible exige, quel que soit le graphe. */
function expectClean(layout: LayoutResult, source: FamilyGraph): void {
  const audit = auditLayout(layout);
  expect(audit.duplicates).toEqual([]);
  expect(audit.nodeOverlaps).toEqual([]);
  expect(audit.linesThroughNodes).toEqual([]);
  expect(audit.markersInNodes).toEqual([]);
  expect(audit.loose).toEqual([]);
  expect(audit.diagonals).toBe(0);
  expect(audit.overlaps).toBe(0);
  expect(audit.combs).toBe(0);
  expect(layout.nodes.map((node) => node.id).sort()).toEqual(source.persons.map((person) => person.id).sort());
  for (const node of layout.nodes) expect(node.generation).toBe(source.personById.get(node.id)?.generation);
  const { width, height } = layout.bounds;
  const points = [
    ...layout.nodes.flatMap((node) => [
      { x: node.x, y: node.y },
      { x: node.x + node.w, y: node.y + node.h },
    ]),
    ...layout.links.flatMap((link) => link.points),
    ...layout.unions.flatMap((union) => [{ x: union.x, y: union.y }, ...union.ties.flatMap((tie) => tie.points)]),
  ];
  for (const point of points) {
    expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
    expect(point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height).toBe(true);
  }
}

describe('layoutTree', () => {
  it('donne une case par personne, sans chevauchement ni tracé qui traverse une case', () => {
    expectClean(tree, graph);
    expect(tree.bounds.x).toBe(0);
    expect(tree.bounds.y).toBe(0);
  });

  it('aligne chaque génération sur une rangée, du haut vers le bas', () => {
    const rowY = new Map<number, number>();
    for (const node of tree.nodes) {
      const known = rowY.get(node.generation);
      if (known === undefined) rowY.set(node.generation, node.y);
      else expect(node.y).toBe(known);
    }
    const generations = [...rowY.keys()].sort((a, b) => a - b);
    expect(generations).toEqual([5, 6, 7, 8, 9, 10, 11, 12]);
    for (let i = 1; i < generations.length; i += 1) {
      const above = rowY.get(generations[i - 1] ?? 0) ?? 0;
      const below = rowY.get(generations[i] ?? 0) ?? 0;
      expect(below).toBeGreaterThan(above + 44);
    }
    expect(tree.rows.map((row) => row.generation)).toEqual(generations);
    expect(tree.rows.map((row) => row.y)).toEqual(generations.map((generation) => rowY.get(generation)));
  });

  it('pose un point par union et marque les unions consanguines', () => {
    expect(tree.unions.map((union) => union.id).sort()).toEqual(unions.map((union) => union.id).sort());
    const flag = (id: string): boolean | undefined => tree.unions.find((union) => union.id === id)?.consanguineous;
    expect(flag('u-aegon-i-visenya')).toBe(true);
    expect(flag('u-daemon-rhaenyra')).toBe(true);
    expect(flag('u-viserys-i-aemma-arryn')).toBe(true);
    expect(flag('u-aenys-i-alyssa-velaryon')).toBe(false);
    expect(flag('u-rhaenyra-harwin-strong')).toBe(false);
    for (const union of tree.unions) {
      expect(union.ties).toHaveLength(2);
      expect(union.ties.map((tie) => tie.person).sort()).toEqual([union.a, union.b].sort());
    }
  });

  it('garde le roi entre ses deux sœurs épouses, sans dupliquer personne', () => {
    const [visenya, aegon, rhaenys] = ['visenya', 'aegon-i', 'rhaenys'].map((id) => nodeOf(tree, id));
    if (!visenya || !aegon || !rhaenys) throw new Error('cases attendues');
    const order = [visenya, aegon, rhaenys].sort((a, b) => a.x - b.x).map((node) => node.id);
    expect(order[1]).toBe('aegon-i');
    for (const id of ['u-aegon-i-visenya', 'u-aegon-i-rhaenys']) {
      const union = tree.unions.find((entry) => entry.id === id);
      expect(union?.ties.map((tie) => tie.route)).toEqual(['side', 'side']);
      expect(union?.y).toBe(aegon.y + aegon.h / 2);
    }
    // Aucune case entre eux.
    const between = tree.nodes.filter((node) => node.y === aegon.y && node.x > Math.min(visenya.x, rhaenys.x) && node.x < Math.max(visenya.x, rhaenys.x));
    expect(between.map((node) => node.id)).toEqual(['aegon-i']);
  });

  it('relie un oncle et sa nièce d’une rangée à l’autre', () => {
    const union = tree.unions.find((entry) => entry.id === 'u-daemon-rhaenyra');
    const rhaenyra = nodeOf(tree, 'rhaenyra');
    const daemon = nodeOf(tree, 'daemon');
    expect(union?.y).toBe(rhaenyra.y + rhaenyra.h / 2);
    const descent = union?.ties.find((tie) => tie.person === 'daemon');
    expect(descent?.route).toBe('descent');
    expect(descent?.points[0]?.y).toBe(daemon.y + daemon.h);
    // Leurs enfants partent du point d'union.
    const child = tree.links.find((link) => link.to === 'aegon-iii');
    expect(child?.from).toBe('u-daemon-rhaenyra');
    expect(child?.points[0]).toEqual({ x: union?.x, y: union?.y });
  });

  it('trace chaque filiation du point d’union de ses parents au milieu du haut de la case', () => {
    expect(tree.links).toHaveLength(parentage.length);
    for (const link of tree.links) {
      const child = nodeOf(tree, link.to);
      const last = link.points[link.points.length - 1];
      expect(last).toEqual({ x: child.x + child.w / 2, y: child.y });
      const record = graph.parentageByChild.get(link.to);
      expect(link.certainty).toBe(record?.certainty);
      if (link.fromKind === 'union') expect(tree.unions.some((union) => union.id === link.from)).toBe(true);
      else expect(link.from).toBe(record?.father ?? record?.mother);
    }
    const orys = tree.links.find((link) => link.to === 'orys-baratheon');
    expect(orys?.fromKind).toBe('person');
    expect(orys?.certainty).toBe('legende');
  });

  it('groupe chaque fratrie : entre deux frères, seulement des frères et des conjoints venus d’ailleurs', () => {
    const rows = new Map<number, LayoutNode[]>();
    for (const node of tree.nodes) rows.set(node.generation, [...(rows.get(node.generation) ?? []), node]);
    for (const family of graph.families) {
      const members = new Set(family.children);
      for (const row of rows.values()) {
        const sorted = row.slice().sort((a, b) => a.x - b.x);
        const indexes = sorted.map((node, index) => (members.has(node.id) ? index : -1)).filter((index) => index >= 0);
        if (indexes.length < 2) continue;
        const inside = sorted.slice(indexes[0], (indexes[indexes.length - 1] ?? 0) + 1);
        for (const node of inside) {
          const rooted = (graph.parentIds.get(node.id) ?? []).length > 0;
          expect([family.id, node.id, members.has(node.id) || !rooted]).toEqual([family.id, node.id, true]);
        }
      }
    }
  });

  it('place un conjoint venu d’ailleurs contre la personne qu’il épouse', () => {
    const pairs: [string, string][] = [
      ['aenys-i', 'alyssa-velaryon'],
      ['maegor-i', 'ceryse-hightower'],
      ['jaehaerys-i', 'alysanne'],
      ['baelon-fils-jaehaerys-i', 'alyssa-fille-jaehaerys-i'],
    ];
    for (const [a, b] of pairs) {
      const first = nodeOf(tree, a);
      const second = nodeOf(tree, b);
      const gap = Math.max(first.x, second.x) - Math.min(first.x + first.w, second.x + second.w);
      expect(first.y).toBe(second.y);
      expect(gap).toBeLessThanOrEqual(40);
    }
  });

  it('croise peu et le dit', () => {
    const audit = auditLayout(tree);
    expect(audit.crossings).toBeLessThanOrEqual(3);
    expect(tree.estimate.crossings).toBeLessThanOrEqual(3);
  });

  it('est déterministe', () => {
    expect(layoutTree(graph)).toEqual(tree);
    expect(layoutTree(buildGraph(persons, unions, parentage))).toEqual(tree);
  });

  it('applique les dimensions demandées', () => {
    const small = layoutTree(graph, { nodeWidth: 100, nodeHeight: 30, rowGap: 80, padding: 10 });
    expectClean(small, graph);
    for (const node of small.nodes) expect([node.w, node.h]).toEqual([100, 30]);
    expect(Math.min(...small.nodes.map((node) => node.y))).toBeGreaterThanOrEqual(10);
    expect(small.bounds.width).toBeLessThan(tree.bounds.width);

    const wide = layoutTree(graph, { widthOf: (person) => (person.king ? 180 : 120) });
    expectClean(wide, graph);
    expect(nodeOf(wide, 'aegon-i').w).toBe(180);
    expect(nodeOf(wide, 'visenya').w).toBe(120);
  });

  it('accepte les cas limites', () => {
    const empty = layoutTree(buildGraph([], [], []));
    expect(empty.nodes).toEqual([]);
    expect(empty.links).toEqual([]);
    expect(Number.isFinite(empty.bounds.width) && Number.isFinite(empty.bounds.height)).toBe(true);

    const alone = buildGraph([makePerson('seul')], [], []);
    const single = layoutTree(alone);
    expectClean(single, alone);
    expect(single.nodes).toHaveLength(1);

    // Deux familles sans lien, un couple sans enfant, un parent seul, un mariage entre deux générations.
    const mixed = buildGraph(
      [
        makePerson('a', 'm', 0),
        makePerson('b', 'f', 0),
        makePerson('c', 'm', 1),
        makePerson('d', 'f', 1),
        makePerson('e', 'f', 2),
        makePerson('x', 'm', 0),
        makePerson('y', 'f', 1),
        makePerson('z', 'm', 1),
        makePerson('w', 'f', 1),
      ],
      [makeUnion('ab', 'a', 'b'), makeUnion('zw', 'z', 'w'), makeUnion('ce', 'c', 'e'), makeUnion('cd', 'c', 'd')],
      [makeChild('c', 'a', 'b', 'ab'), makeChild('d', 'a', 'b', 'ab'), makeChild('e', null, 'd'), makeChild('y', 'x', null)],
    );
    expect(mixed.issues).toEqual([]);
    expectClean(layoutTree(mixed), mixed);
  });

  it('tient sur un graphe où tout le monde épouse tout le monde', () => {
    // Quatre générations de frères et sœurs mariés entre eux, avec un oncle qui épouse sa nièce à chaque génération.
    const people = [makePerson('p0', 'm', 0), makePerson('m0', 'f', 0)];
    const pairs = [makeUnion('u0', 'p0', 'm0')];
    const links: Parentage[] = [];
    for (let g = 1; g <= 4; g += 1) {
      people.push(makePerson(`p${g}`, 'm', g), makePerson(`m${g}`, 'f', g), makePerson(`o${g}`, 'm', g));
      for (const child of [`p${g}`, `m${g}`, `o${g}`]) links.push(makeChild(child, `p${g - 1}`, `m${g - 1}`, `u${g - 1}`));
      pairs.push(makeUnion(`u${g}`, `p${g}`, `m${g}`));
      if (g > 1) pairs.push(makeUnion(`n${g}`, `o${g - 1}`, `m${g}`));
    }
    const dense = buildGraph(people, pairs, links);
    expect(dense.issues).toEqual([]);
    const layout = layoutTree(dense);
    expectClean(layout, dense);
    expect(layout.unions.every((union) => union.consanguineous || union.id === 'u0')).toBe(true);
  });
});

describe('layoutThread', () => {
  const thread = layoutThread(graph, mainThread);

  it('empile les maillons dans une colonne, du plus ancien au plus récent', () => {
    expect(thread.steps.map((step) => step.id)).toEqual(mainThread);
    const links = mainThread.map((id) => {
      const node = thread.nodes.find((entry) => entry.id === id && entry.role === 'thread');
      if (!node) throw new Error(`maillon absent : ${id}`);
      return node;
    });
    for (let i = 1; i < links.length; i += 1) {
      expect(links[i]?.x).toBe(links[0]?.x);
      expect(links[i]?.y ?? 0).toBeGreaterThan((links[i - 1]?.y ?? 0) + (links[i - 1]?.h ?? 0));
    }
    expect(thread.steps.map((step) => step.y)).toEqual(links.map((node) => node.y));
  });

  it('tient dans la largeur d’un téléphone', () => {
    expect(thread.bounds.width).toBe(360);
    for (const node of thread.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x + node.w).toBeLessThanOrEqual(360);
    }
    const narrow = layoutThread(graph, mainThread, { width: 320 });
    expect(narrow.bounds.width).toBe(320);
    expect(Math.max(...narrow.nodes.map((node) => node.x + node.w))).toBeLessThanOrEqual(320);
  });

  it('ne se chevauche pas, ne croise rien, ne laisse aucun tracé en l’air', () => {
    for (const layout of [thread, layoutThread(graph, mainThread, { width: 320 }), layoutThread(graph, mainThread, { width: 480 })]) {
      const audit = auditLayout(layout);
      expect(audit.nodeOverlaps).toEqual([]);
      expect(audit.linesThroughNodes).toEqual([]);
      expect(audit.markersInNodes).toEqual([]);
      expect(audit.loose).toEqual([]);
      expect(audit.diagonals).toBe(0);
      expect(audit.overlaps).toBe(0);
      expect(audit.crossings).toBe(0);
    }
  });

  it('met conjoints et enfants en regard de chaque maillon, sans redessiner personne', () => {
    const stepOf = (id: string): number => mainThread.indexOf(id);
    const visenya = thread.nodes.filter((node) => node.id === 'visenya');
    expect(visenya).toHaveLength(1);
    expect([visenya[0]?.role, visenya[0]?.step]).toEqual(['partner', stepOf('aegon-i')]);
    // Alysanne est la sœur de Jaehaerys : elle n'est pas dans l'éventail de leurs parents, elle est à côté de lui.
    const alysanne = thread.nodes.filter((node) => node.id === 'alysanne');
    expect(alysanne).toHaveLength(1);
    expect([alysanne[0]?.role, alysanne[0]?.step]).toEqual(['partner', stepOf('jaehaerys-i')]);
    expect(thread.links.some((link) => link.to === 'alysanne' && link.from === 'u-aenys-i-alyssa-velaryon')).toBe(true);
    // Les autres enfants d'Aenys sont dans l'éventail de son maillon.
    const fan = thread.nodes.filter((node) => node.role === 'child' && node.step === stepOf('aenys-i')).map((node) => node.id);
    expect(fan.sort()).toEqual(['aegon-fils-aenys-i', 'rhaena-fille-aenys-i', 'vaella-fille-aenys-i', 'viserys-fils-aenys-i']);
    // Daemon, né deux maillons plus haut, est le conjoint de Rhaenyra : une seule case, reliée à ses parents.
    const daemon = thread.nodes.filter((node) => node.id === 'daemon');
    expect(daemon).toHaveLength(1);
    expect([daemon[0]?.role, daemon[0]?.step]).toEqual(['partner', stepOf('rhaenyra')]);
    expect(thread.links.some((link) => link.to === 'daemon')).toBe(true);
    expect(thread.nodes.some((node) => node.repeat)).toBe(false);
    expect(new Set(thread.nodes.map((node) => node.id)).size).toBe(thread.nodes.length);
  });

  it('relie chaque maillon au suivant', () => {
    for (let i = 1; i < mainThread.length; i += 1) {
      const id = mainThread[i] ?? '';
      const link = thread.links.find((entry) => entry.to === id);
      expect(link).toBeDefined();
      const node = thread.nodes.find((entry) => entry.id === id);
      const last = link?.points[link.points.length - 1];
      expect(last).toEqual({ x: (node?.x ?? 0) + (node?.w ?? 0) / 2, y: node?.y });
    }
  });

  it('marque les unions consanguines du fil', () => {
    const flag = (id: string): boolean | undefined => thread.unions.find((union) => union.id === id)?.consanguineous;
    expect(flag('u-aegon-i-rhaenys')).toBe(true);
    expect(flag('u-aenys-i-alyssa-velaryon')).toBe(false);
    expect(flag('u-daemon-rhaenyra')).toBe(true);
  });

  it('donne toute la ligne à un enfant au nom long, sans changer l’ordre de naissance', () => {
    const long = new Set(['viserys-fils-aenys-i']);
    const wide = layoutThread(graph, mainThread, { wideChild: (person) => long.has(person.id) });
    const step = mainThread.indexOf('aenys-i');
    const fan = (layout: typeof thread) => layout.nodes.filter((node) => node.role === 'child' && node.step === step);
    const narrow = Math.min(...fan(thread).map((node) => node.w));
    const partner = nodeOf(wide, 'alyssa-velaryon');
    const viserys = nodeOf(wide, 'viserys-fils-aenys-i');
    expect([viserys.x, viserys.w]).toEqual([partner.x, partner.w]);
    for (const node of fan(wide)) {
      if (node.id === viserys.id) continue;
      expect(node.w).toBe(narrow);
      // Personne ne partage la ligne de l'enfant large.
      expect(node.y === viserys.y).toBe(false);
    }
    // Même ordre de lecture (de haut en bas, puis de gauche à droite) que sans la règle.
    const order = (layout: typeof thread) => fan(layout).sort((a, b) => a.y - b.y || a.x - b.x).map((node) => node.id);
    expect(order(wide)).toEqual(order(thread));
    const audit = auditLayout(wide);
    expect([audit.nodeOverlaps, audit.linesThroughNodes, audit.loose, audit.crossings, audit.overlaps]).toEqual([[], [], [], 0, 0]);
  });

  it('est déterministe et ignore les identifiants inconnus', () => {
    expect(layoutThread(graph, mainThread)).toEqual(thread);
    expect(layoutThread(graph, ['inconnu', ...mainThread])).toEqual(thread);
    expect(layoutThread(graph, []).nodes).toEqual([]);
  });
});
