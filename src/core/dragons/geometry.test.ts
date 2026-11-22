import { describe, expect, it } from 'vitest';

import { DRAGON_PARTS, DRAGON_WING_PARTS, buildDragon } from './geometry';
import type { DragonGeometry, DragonPartName, DragonShape } from './geometry';
import { HUMAN_RATIO, SCALE_UNIT, humanFigure, layoutDragonScale } from './scale';

const BALERION: DragonShape = { span: 1, neck: 0.5, tail: 0.62, horns: 3 };
const CARAXES: DragonShape = { span: 0.58, neck: 1, tail: 0.88, horns: 2 };
const ARRAX: DragonShape = { span: 0.16, neck: 0.36, tail: 0.44, horns: 0.6 };
const MOYEN: DragonShape = { span: 0.5, neck: 0.5, tail: 0.5, horns: 1 };
const LOOKS: DragonShape[] = [BALERION, CARAXES, ARRAX, MOYEN, { span: 0.05, neck: 0, tail: 0, horns: 0 }, { span: 1.5, neck: 1, tail: 1, horns: 3 }];
const PHASES = [0, 0.25, 0.5, 0.75];

const WING: readonly DragonPartName[] = DRAGON_WING_PARTS;
const subpaths = (d: string): number => (d.match(/M/g) ?? []).length;
const hand = (g: DragonGeometry): number =>
  Math.hypot(g.anchors.wingtipR[0] - g.anchors.wristR[0], g.anchors.wingtipR[1] - g.anchors.wristR[1]);

describe('buildDragon : tracés', () => {
  it('donne toutes les parties, valides, à toutes les phases', () => {
    for (const look of LOOKS) {
      for (const flap of PHASES) {
        const g = buildDragon(look, { flap, neckCurve: 0.2, tailCurve: 0.3 });
        for (const name of DRAGON_PARTS) {
          const d = g.parts[name];
          expect(d).not.toMatch(/NaN|Infinity|undefined/);
          const mayBeEmpty = name === 'bodyMarks' || (name === 'horns' && look.horns < 0.06);
          if (!mayBeEmpty) expect(d.startsWith('M')).toBe(true);
        }
      }
    }
  });

  it('garde le même cadre pendant le battement et contient les ailes', () => {
    for (const look of LOOKS) {
      const frames = PHASES.map((flap) => buildDragon(look, { flap }));
      for (const g of frames) {
        expect(g.viewBox).toBe(frames[0]?.viewBox);
        expect(g.anchors.wingtipL[0]).toBeGreaterThanOrEqual(g.box.x);
        expect(g.anchors.wingtipR[0]).toBeLessThanOrEqual(g.box.x + g.box.width);
      }
    }
  });

  it('est déterministe et symétrique sans roulis', () => {
    const a = buildDragon(BALERION, { flap: 0.3, tailCurve: 0.3 });
    const b = buildDragon(BALERION, { flap: 0.3, tailCurve: 0.3 });
    expect(b.parts).toEqual(a.parts);
    const flat = buildDragon(BALERION, { flap: 0 });
    expect(flat.anchors.wingtipL[0]).toBe(-flat.anchors.wingtipR[0]);
    expect(flat.anchors.wingtipL[1]).toBe(flat.anchors.wingtipR[1]);
  });

  it('ramène une envergure voisine de 1000 quel que soit le dragon', () => {
    for (const look of LOOKS) {
      const { wingspan } = buildDragon(look).metrics;
      expect(wingspan).toBeGreaterThan(940);
      expect(wingspan).toBeLessThan(1060);
    }
  });

  it('remplace les valeurs invalides par les proportions par défaut', () => {
    const broken = { span: Number.NaN, neck: undefined, tail: null, horns: 'x' } as unknown as DragonShape;
    expect(buildDragon(broken).parts).toEqual(buildDragon(MOYEN).parts);
  });
});

describe('buildDragon : battement', () => {
  it('est cyclique', () => {
    expect(buildDragon(CARAXES, { flap: 1 }).parts).toEqual(buildDragon(CARAXES, { flap: 0 }).parts);
  });

  it('ne touche que les ailes', () => {
    const open = buildDragon(MOYEN, { flap: 0 });
    const folded = buildDragon(MOYEN, { flap: 0.5 });
    for (const name of DRAGON_PARTS) {
      if (WING.includes(name)) expect(folded.parts[name]).not.toBe(open.parts[name]);
      else expect(folded.parts[name]).toBe(open.parts[name]);
    }
  });

  it('plie le poignet et ramène les doigts vers la queue sans changer la longueur de la main', () => {
    for (const look of LOOKS) {
      const open = buildDragon(look, { flap: 0 });
      const folded = buildDragon(look, { flap: 0.5 });
      // Une mise à l'échelle raccourcirait la main ; une articulation la fait pivoter.
      expect(hand(folded) / hand(open)).toBeGreaterThan(0.95);
      expect(folded.anchors.wristR[0]).toBeLessThan(open.anchors.wristR[0] * 0.8);
      const sweepOpen = open.anchors.wingtipR[1] - open.anchors.wristR[1];
      const sweepFolded = folded.anchors.wingtipR[1] - folded.anchors.wristR[1];
      expect(sweepFolded).toBeGreaterThan(sweepOpen * 2);
    }
  });

  it('raccourcit l’aile du côté où le dragon s’incline', () => {
    const g = buildDragon(BALERION, { flap: 0, bank: 0.6 });
    expect(g.anchors.wingtipR[0]).toBeLessThan(-g.anchors.wingtipL[0] - 20);
  });
});

describe('buildDragon : les paramètres changent la silhouette', () => {
  it('allonge le cou et la queue', () => {
    const base = buildDragon(MOYEN).metrics.length;
    expect(buildDragon({ ...MOYEN, neck: 1 }).metrics.length).toBeGreaterThan(base + 80);
    expect(buildDragon({ ...MOYEN, tail: 1 }).metrics.length).toBeGreaterThan(base + 120);
    expect(buildDragon(CARAXES).metrics.length).toBeGreaterThan(buildDragon(BALERION).metrics.length * 1.08);
  });

  it('allonge le cou plus vite que le paramètre : un cou très long se voit', () => {
    const short = buildDragon({ ...MOYEN, neck: 0 }).metrics.length;
    const middle = buildDragon(MOYEN).metrics.length;
    const long = buildDragon({ ...MOYEN, neck: 1 }).metrics.length;
    expect(long - middle).toBeGreaterThan((middle - short) * 1.4);
  });

  it('compte une paire de cornes par unité, et aucune à zéro', () => {
    expect(buildDragon({ ...MOYEN, horns: 0 }).parts.horns).toBe('');
    expect([1, 2, 3].map((horns) => subpaths(buildDragon({ ...MOYEN, horns }).parts.horns))).toEqual([2, 4, 6]);
  });

  it('épaissit le corps et l’aile des vieux dragons', () => {
    const old = buildDragon(BALERION);
    const young = buildDragon(ARRAX);
    expect(old.parts.body).not.toBe(young.parts.body);
    expect(old.parts.wingMembraneR).not.toBe(young.parts.wingMembraneR);
    // Seules les vieilles membranes sont entaillées : leur bord de fuite compte plus de segments.
    const smooth = buildDragon({ ...BALERION, span: 0.5 });
    expect(old.parts.wingMembraneR.length).toBeGreaterThan(smooth.parts.wingMembraneR.length);
  });
});

describe('layoutDragonScale', () => {
  const entries = [
    { id: 'arrax', look: ARRAX },
    { id: 'balerion', look: BALERION },
    { id: 'caraxes', look: CARAXES },
  ];

  it('range du plus grand au plus petit, à l’échelle des envergures', () => {
    const layout = layoutDragonScale(entries);
    expect(layout.items.map((item) => item.id)).toEqual(['balerion', 'caraxes', 'arrax']);
    expect(layout.items.map((item) => Math.round(item.wingspan))).toEqual([1000, 580, 160]);
    expect(layout.human.height).toBe(HUMAN_RATIO * SCALE_UNIT);
    expect(layout.width).toBeGreaterThan(layout.human.x);
  });

  it('ne fait pas se recouvrir les ailes et garde l’ordre reçu si on le demande', () => {
    const layout = layoutDragonScale(entries, { order: 'given', gap: 0.05 });
    expect(layout.items.map((item) => item.id)).toEqual(['arrax', 'balerion', 'caraxes']);
    layout.items.forEach((item, i) => {
      const previous = layout.items[i - 1];
      if (!previous) return;
      const left = item.x + (item.width - item.wingspan) / 2;
      const right = previous.x + (previous.width + previous.wingspan) / 2;
      expect(left).toBeGreaterThanOrEqual(right);
    });
  });

  it('dessine un homme dans un cadre de cent de haut', () => {
    const man = humanFigure();
    expect(man.height).toBe(100);
    expect(man.d.startsWith('M')).toBe(true);
    expect(man.d).not.toMatch(/NaN/);
  });
});
