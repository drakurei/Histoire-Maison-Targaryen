import { describe, expect, it } from 'vitest';

import { auditLayout } from './audit.ts';
import type { LayoutLink, LayoutNode, LayoutUnion } from './layout.ts';

const box = (id: string, x: number, y: number): LayoutNode => ({ id, x, y, w: 100, h: 40, generation: 0 });
const link = (from: string, to: string, points: [number, number][], fromKind: LayoutLink['fromKind'] = 'person'): LayoutLink => ({
  from,
  fromKind,
  to,
  points: points.map(([x, y]) => ({ x, y })),
  certainty: null,
});

describe('auditLayout', () => {
  it('ne trouve rien à redire à un couple et son enfant', () => {
    const union: LayoutUnion = {
      id: 'u',
      unionId: 'u',
      x: 115,
      y: 20,
      a: 'a',
      b: 'b',
      consanguineous: false,
      ties: [
        { person: 'a', route: 'side', points: [{ x: 115, y: 20 }, { x: 100, y: 20 }] },
        { person: 'b', route: 'side', points: [{ x: 115, y: 20 }, { x: 130, y: 20 }] },
      ],
    };
    const audit = auditLayout({
      nodes: [box('a', 0, 0), box('b', 130, 0), box('c', 65, 100)],
      unions: [union],
      links: [link('u', 'c', [[115, 20], [115, 100]], 'union')],
    });
    expect(audit).toEqual({ nodeOverlaps: [], duplicates: [], linesThroughNodes: [], markersInNodes: [], loose: [], diagonals: 0, crossings: 0, overlaps: 0, combs: 0, details: [] });
  });

  it('voit les cases qui se recouvrent et les doublons', () => {
    const audit = auditLayout({ nodes: [box('a', 0, 0), box('b', 90, 10), box('a', 300, 0)], unions: [], links: [] });
    expect(audit.nodeOverlaps).toEqual([['a', 'b']]);
    expect(audit.duplicates).toEqual(['a']);
  });

  it('voit un tracé qui traverse une case, un biais, un tracé détaché', () => {
    const nodes = [box('a', 0, 0), box('b', 0, 100), box('c', 0, 200), box('d', 300, 200)];
    const through = auditLayout({ nodes, unions: [], links: [link('a', 'c', [[50, 40], [50, 200]])] });
    expect(through.linesThroughNodes).toEqual(['a > c > b']);
    const slanted = auditLayout({ nodes, unions: [], links: [link('a', 'd', [[50, 40], [350, 200]])] });
    expect(slanted.diagonals).toBe(1);
    const loose = auditLayout({ nodes, unions: [], links: [link('a', 'd', [[50, 40], [50, 60], [350, 60], [350, 190]])] });
    expect(loose.loose).toEqual(['a > d']);
  });

  it('compte croisements et superpositions entre origines différentes', () => {
    const nodes = [box('a', 0, 0), box('b', 150, 0), box('c', 300, 200), box('d', 150, 200)];
    const crossed = auditLayout({
      nodes,
      unions: [],
      links: [link('a', 'c', [[50, 40], [50, 100], [350, 100], [350, 200]]), link('b', 'd', [[200, 40], [200, 200]])],
    });
    expect(crossed.crossings).toBe(1);
    expect(crossed.overlaps).toBe(0);
    expect(crossed.details).toEqual(['croisement : a > c × b > d @ 200,100']);

    const stacked = auditLayout({
      nodes,
      unions: [],
      links: [link('a', 'c', [[50, 40], [50, 100], [350, 100], [350, 200]]), link('b', 'd', [[200, 40], [200, 100], [240, 100], [240, 200]])],
    });
    expect(stacked.overlaps).toBe(1);
    expect(stacked.crossings).toBe(0);
    expect(stacked.details.some((detail) => detail.startsWith('superposition'))).toBe(true);
  });

  it('range à part les tracés qui partent ensemble de la même personne', () => {
    const nodes = [box('a', 0, 0), box('c', 0, 200), box('d', 300, 200)];
    const audit = auditLayout({
      nodes,
      unions: [],
      links: [link('a', 'c', [[50, 40], [50, 200]])],
    });
    expect(audit.combs).toBe(0);
    const shared = auditLayout({
      nodes: [...nodes, box('e', 300, 0)],
      unions: [
        {
          id: 'u',
          unionId: 'u',
          x: 200,
          y: 100,
          a: 'a',
          b: 'e',
          consanguineous: false,
          ties: [
            { person: 'a', route: 'under', points: [{ x: 200, y: 100 }, { x: 50, y: 100 }, { x: 50, y: 40 }] },
            { person: 'e', route: 'under', points: [{ x: 200, y: 100 }, { x: 350, y: 100 }, { x: 350, y: 40 }] },
          ],
        },
      ],
      links: [link('a', 'c', [[50, 40], [50, 200]])],
    });
    expect(shared.combs).toBe(1);
    expect(shared.overlaps).toBe(0);
  });
});
