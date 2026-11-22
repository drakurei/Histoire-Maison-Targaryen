/**
 * Échelle comparée : mise en place de plusieurs dragons à l'échelle de leur envergure,
 * épaules sur une même ligne, et silhouette humaine pour repère.
 *
 * Fonctions pures, TypeScript « effaçable ». Les livres ne donnent aucune mesure : les
 * envergures sont des ordres de grandeur relatifs (`look.span`, Balerion = 1) et la taille
 * de l'homme par rapport à Balerion est une hypothèse éditoriale, passée en paramètre.
 */
import type { Bounds, Pt } from './curves.ts';
import { emptyBounds, loop, orient, pathOf, ribbon } from './curves.ts';
import { buildDragon } from './geometry.ts';
import type { DragonShape } from './geometry.ts';

/** Unités de l'échelle pour une envergure de 1 (Balerion). */
export const SCALE_UNIT = 1000;

/**
 * Taille d'un homme rapportée à l'envergure de Balerion. Hypothèse éditoriale : rien dans
 * les livres ne la fixe. 1/50 revient à donner une envergure d'environ quatre-vingt-dix
 * mètres au plus grand dragon connu.
 */
export const HUMAN_RATIO = 1 / 50;

export interface ScaleEntry {
  id: string;
  look: DragonShape;
}

export interface ScaleItem {
  id: string;
  /** Coin supérieur gauche et dimensions du cadre du dragon, en unités de l'échelle. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Abscisse de la colonne du dragon. */
  centerX: number;
  /** Envergure à l'échelle. */
  wingspan: number;
}

export interface ScaleLayout {
  width: number;
  height: number;
  /** Ordonnée de la ligne des épaules. */
  axisY: number;
  items: ScaleItem[];
  /** Repère humain : abscisse de son axe, ordonnée de ses pieds, hauteur. */
  human: { x: number; y: number; height: number };
}

export interface ScaleOptions {
  /** Espace entre deux envergures, en fraction de l'envergure de Balerion. Négatif : les ailes se recouvrent. */
  gap?: number | undefined;
  /** Taille de l'homme rapportée à l'envergure de Balerion. */
  humanRatio?: number | undefined;
  /** `desc` : du plus grand au plus petit (défaut). `given` : ordre reçu. */
  order?: 'desc' | 'asc' | 'given' | undefined;
}

export function layoutDragonScale(entries: readonly ScaleEntry[], options: ScaleOptions = {}): ScaleLayout {
  const gap = (options.gap ?? 0.03) * SCALE_UNIT;
  const humanHeight = (options.humanRatio ?? HUMAN_RATIO) * SCALE_UNIT;
  const order = options.order ?? 'desc';
  const sorted = entries.slice();
  if (order !== 'given') sorted.sort((a, b) => (order === 'desc' ? b.look.span - a.look.span : a.look.span - b.look.span));

  const placed = sorted.map((entry) => {
    const g = buildDragon(entry.look, { flap: 0 });
    const k = (Math.max(entry.look.span, 0.01) * SCALE_UNIT) / g.metrics.wingspan;
    return { id: entry.id, k, box: g.box, wingspan: g.metrics.wingspan * k };
  });

  const above = placed.reduce((m, p) => Math.max(m, -p.box.y * p.k), humanHeight / 2);
  const below = placed.reduce((m, p) => Math.max(m, (p.box.y + p.box.height) * p.k), humanHeight / 2);

  const items: ScaleItem[] = [];
  let cursor = 0;
  for (const p of placed) {
    const width = p.box.width * p.k;
    const margin = (width - p.wingspan) / 2;
    const x = cursor - margin;
    items.push({ id: p.id, x, y: above + p.box.y * p.k, width, height: p.box.height * p.k, centerX: x + width / 2, wingspan: p.wingspan });
    cursor += p.wingspan + gap;
  }
  // L'homme se tient à une hauteur d'homme et demie de la dernière aile : assez près pour être comparé.
  const lastWing = items.length > 0 ? cursor - gap : 0;
  const humanX = lastWing + humanHeight * 1.5;
  return {
    width: humanX + humanHeight * 0.6,
    height: above + below,
    axisY: above,
    items,
    human: { x: humanX, y: above + humanHeight / 2, height: humanHeight },
  };
}

export interface HumanFigure {
  d: string;
  width: number;
  height: number;
}

let human: HumanFigure | null = null;

/**
 * Silhouette humaine debout, de face, bras le long du corps : le repère des planches de
 * comparaison. Dessinée dans un cadre de 100 de haut, pieds en bas.
 */
export function humanFigure(): HumanFigure {
  if (human) return human;
  const b: Bounds = emptyBounds();
  const cx = 22;
  const mirror = (points: readonly Pt[]): Pt[] => [...points, ...points.slice().reverse().map(([x, y]): Pt => [-x, y])];
  const shift = (points: readonly Pt[]): Pt[] => points.map(([x, y]): Pt => [cx + x, y]);

  const head = shift(mirror([[0, 0.6], [3.6, 1.6], [5.2, 5.4], [4.6, 10], [2.6, 13.2], [0, 14]]).slice(0, -1));
  const torso = shift(
    mirror([
      [2.6, 12.4],
      [3, 16.2],
      [9.4, 17.8],
      [12.4, 20.6],
      [11, 30],
      [8.8, 40],
      [8.4, 46],
      [9.8, 52],
      [9.6, 57],
    ]),
  );
  let d = pathOf(orient(loop(head)), b) + pathOf(orient(loop(torso)), b);
  for (const side of [1, -1]) {
    const arm: Pt[] = [
      [cx + side * 11.4, 20],
      [cx + side * 13.4, 31],
      [cx + side * 14.4, 42],
      [cx + side * 15.4, 51],
      [cx + side * 15.8, 58],
    ];
    d += pathOf(ribbon(arm, [3.1, 2.8, 2.4, 2, 1.7]), b);
    const leg: Pt[] = [
      [cx + side * 5, 50],
      [cx + side * 5.6, 62],
      [cx + side * 5.4, 74],
      [cx + side * 5, 86],
      [cx + side * 5, 96],
      [cx + side * 6.6, 99.2],
    ];
    d += pathOf(ribbon(leg, [5, 4.6, 3.7, 3, 2.3, 1.6]), b);
  }
  human = { d, width: cx * 2, height: 100 };
  return human;
}
