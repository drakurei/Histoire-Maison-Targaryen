/**
 * Cadrage de la carte : fonctions pures, sans DOM.
 *
 * Une vue est un centre et une largeur, en unités de `MapData.viewBox`. Sa hauteur suit le
 * rapport du cadre à l'écran : la carte remplit toujours son cadre, sans bandes vides.
 */

export interface MapView {
  cx: number;
  cy: number;
  /** Largeur visible, en unités de la carte. */
  w: number;
}

/** Rectangle en unités de la carte : x0, y0, x1, y1. */
export type MapBounds = readonly [number, number, number, number];

/** Ce que l'appelant demande à voir : un rectangle à faire tenir, ou un point et une largeur. */
export type MapFrame = { bounds: MapBounds; pad?: number } | { center: readonly [number, number]; width: number };

/** Largeur la plus serrée qu'on autorise : en deçà, le tracé des côtes ne tient plus. */
export const MIN_VIEW_WIDTH = 70;

export function boundsOfViewBox(viewBox: readonly [number, number, number, number]): MapBounds {
  const [x, y, w, h] = viewBox;
  return [x, y, x + w, y + h];
}

/** Rectangle qui contient tous les points, ou `null` s'il n'y en a aucun. */
export function boundsOfPoints(points: readonly (readonly [number, number])[]): MapBounds | null {
  if (points.length === 0) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of points) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1];
}

/** Largeur la plus large : la carte entière tient dans le cadre, sans plus. */
export function maxViewWidth(map: MapBounds, aspect: number): number {
  const mapW = map[2] - map[0];
  const mapH = map[3] - map[1];
  return Math.max(mapW, mapH * aspect);
}

/** Garde la vue dans la carte : largeur bornée, centre ramené à l'intérieur. */
export function clampView(view: MapView, map: MapBounds, aspect: number): MapView {
  const maxW = maxViewWidth(map, aspect);
  const w = Math.min(Math.max(view.w, MIN_VIEW_WIDTH), maxW);
  const h = w / aspect;
  const clampAxis = (c: number, lo: number, hi: number, size: number) => {
    // Plus large que la carte sur cet axe : on centre. Sinon, le bord de la vue ne sort pas de la carte.
    if (size >= hi - lo) return (lo + hi) / 2;
    return Math.min(Math.max(c, lo + size / 2), hi - size / 2);
  };
  return { cx: clampAxis(view.cx, map[0], map[2], w), cy: clampAxis(view.cy, map[1], map[3], h), w };
}

/** Vue qui montre le cadre demandé dans un cadre d'écran de rapport `aspect` (largeur / hauteur). */
export function viewOfFrame(frame: MapFrame, map: MapBounds, aspect: number): MapView {
  if ('center' in frame) {
    return clampView({ cx: frame.center[0], cy: frame.center[1], w: frame.width }, map, aspect);
  }
  const [x0, y0, x1, y1] = frame.bounds;
  const pad = frame.pad ?? 0.12;
  const bw = Math.max(x1 - x0, 1);
  const bh = Math.max(y1 - y0, 1);
  const w = Math.max(bw, bh * aspect) * (1 + 2 * pad);
  return clampView({ cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w }, map, aspect);
}

/** Le `viewBox` SVG d'une vue. */
export function viewBoxOf(view: MapView, aspect: number): [number, number, number, number] {
  const h = view.w / aspect;
  return [view.cx - view.w / 2, view.cy - h / 2, view.w, h];
}

/** Zoom de facteur `k` (> 1 : on s'approche) autour d'un point de la carte qui reste immobile à l'écran. */
export function zoomAt(view: MapView, k: number, at: readonly [number, number]): MapView {
  const w = view.w / k;
  return {
    cx: at[0] + (view.cx - at[0]) / k,
    cy: at[1] + (view.cy - at[1]) / k,
    w,
  };
}

/** Vrai si le point est dans la vue, à une marge près (fraction de la largeur). */
export function viewContains(view: MapView, aspect: number, point: readonly [number, number], margin = 0.04): boolean {
  const [x, y, w, h] = viewBoxOf(view, aspect);
  const m = w * margin;
  return point[0] >= x + m && point[0] <= x + w - m && point[1] >= y + m && point[1] <= y + h - m;
}
