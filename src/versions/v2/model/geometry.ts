/**
 * Géométrie de la fasce et des figures qui s'alignent sur elle. Fonctions pures, sans
 * données propres : elles reçoivent l'échelle et les séries, et rendent des tracés SVG et
 * des positions. C'est du dessin, pas de la logique d'histoire.
 */
import { yearToX } from '@/core/timeline';
import type { TimeScale } from '@/core/timeline';

/** L'année qui suit, sans an 0. */
export function nextYear(year: number): number {
  return year === -1 ? 1 : year + 1;
}

/** Bord gauche et bord droit d'une année sur l'échelle : une année occupe toute sa largeur. */
export function yearEdges(scale: TimeScale, year: number): readonly [number, number] {
  return [yearToX(scale, year), yearToX(scale, nextYear(year))];
}

/** Abscisse du milieu d'une année. */
export function yearCenter(scale: TimeScale, year: number): number {
  const [left, right] = yearEdges(scale, year);
  return (left + right) / 2;
}

function r(value: number): string {
  return (Math.round(value * 2) / 2).toString();
}

export interface StepPoint {
  year: number;
  value: number;
}

/**
 * Aire en escalier posée sur la ligne de base `base` : une marche par année, les années de
 * même valeur fusionnées. `y(value)` donne la hauteur du bord haut. Chaîne vide si tout est nul.
 */
export function stepArea(
  points: readonly StepPoint[],
  scale: TimeScale,
  y: (value: number) => number,
  base: number,
): string {
  const runs: { x0: number; x1: number; value: number }[] = [];
  for (const point of points) {
    const [x0, x1] = yearEdges(scale, point.year);
    const last = runs[runs.length - 1];
    if (last && last.value === point.value && Math.abs(last.x1 - x0) < 0.01) last.x1 = x1;
    else runs.push({ x0, x1, value: point.value });
  }
  const parts: string[] = [];
  let open = false;
  for (const run of runs) {
    if (run.value <= 0) {
      if (open) parts.push(`V${r(base)}Z`);
      open = false;
      continue;
    }
    if (!open) parts.push(`M${r(run.x0)} ${r(base)}`);
    parts.push(`V${r(y(run.value))}H${r(run.x1)}`);
    open = true;
  }
  if (open) parts.push(`V${r(base)}Z`);
  return parts.join('');
}

/* ------------------------------------------------------------------ couloirs des périodes */

export interface Extent {
  id: string;
  from: number;
  to: number;
}

/**
 * Couloir de chaque étendue : 0 pour la première, 1 et plus quand deux étendues se
 * chevauchent. Deux étendues qui se touchent à une même année sans se recouvrir partagent
 * un couloir.
 */
export function extentLanes(extents: readonly Extent[]): Map<string, number> {
  const ends: number[] = [];
  const lanes = new Map<string, number>();
  for (const extent of [...extents].sort((a, b) => a.from - b.from)) {
    const free = ends.findIndex((end) => end <= extent.from);
    const lane = free === -1 ? ends.length : free;
    ends[lane] = extent.to;
    lanes.set(extent.id, lane);
  }
  return lanes;
}

/* ------------------------------------------------------------------ cibles écartées */

export interface Target {
  id: string;
  /** Centre voulu. */
  center: number;
  width: number;
}

/**
 * Range des cibles sur une ligne sans qu'elles se recouvrent, chacune au plus près de son
 * centre voulu, dans l'ordre, entre `min` et `max`. Les cibles qui se gênent forment un bloc
 * centré sur la moyenne de leurs centres voulus. Rend le bord gauche de chaque cible.
 */
export function spreadTargets(targets: readonly Target[], min: number, max: number, gap = 0): Map<string, number> {
  const sorted = [...targets].sort((a, b) => a.center - b.center);
  interface Block {
    items: Target[];
    left: number;
    width: number;
  }
  const blocks: Block[] = [];
  for (const target of sorted) {
    let block: Block = { items: [target], left: target.center - target.width / 2, width: target.width };
    for (;;) {
      const previous = blocks[blocks.length - 1];
      if (!previous || previous.left + previous.width + gap <= block.left) break;
      blocks.pop();
      const items = [...previous.items, ...block.items];
      const width = items.reduce((sum, item) => sum + item.width, 0) + gap * (items.length - 1);
      // Bord gauche qui minimise l'écart quadratique de chaque centre à son centre voulu.
      let offset = 0;
      let sum = 0;
      for (const item of items) {
        sum += item.center - (offset + item.width / 2);
        offset += item.width + gap;
      }
      block = { items, left: sum / items.length, width };
    }
    blocks.push(block);
  }
  const placed = new Map<string, number>();
  let floor = min;
  for (const block of blocks) {
    block.left = Math.max(block.left, floor);
    floor = block.left + block.width + gap;
  }
  let ceiling = max;
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const block = blocks[index];
    if (!block) continue;
    block.left = Math.min(block.left, ceiling - block.width);
    ceiling = block.left - gap;
  }
  for (const block of blocks) {
    let left = block.left;
    for (const item of block.items) {
      placed.set(item.id, left);
      left += item.width + gap;
    }
  }
  return placed;
}
