/**
 * Placement des noms de lieux, en pixels d'écran : fonctions pures.
 *
 * Un nom se pose à droite de son signe, ou à gauche s'il n'y a pas la place. Les noms sont
 * placés par ordre d'importance ; celui qui chevaucherait un nom déjà posé est tu (le signe
 * reste, avec son nom accessible). On s'approche : la place revient, les noms aussi.
 */

export interface LabelCandidate {
  id: string;
  /** Position du signe, en pixels dans le cadre. */
  x: number;
  y: number;
  /** Largeur estimée du nom, en pixels. */
  width: number;
  /** Hauteur de ligne du nom, en pixels. */
  height: number;
  /** Plus grand : posé en premier. */
  priority: number;
  /** `center` : nom fixe, centré sur son point (régions, mers) ; sinon à droite ou à gauche du signe. */
  anchor?: 'side' | 'center';
  /** Boîte du signe du lieu : un nom moins important ne la recouvre pas. */
  glyph?: Box;
}

export interface PlacedLabel {
  id: string;
  side: 'right' | 'left' | 'above' | 'below' | 'center';
}

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const GAP = 7;

function overlaps(a: Box, b: Box): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

function boxFor(c: LabelCandidate, side: PlacedLabel['side']): Box {
  const centred = side === 'center' || side === 'above' || side === 'below';
  const x0 = centred ? c.x - c.width / 2 : side === 'right' ? c.x + GAP : c.x - GAP - c.width;
  const shift = side === 'above' ? -(c.height / 2 + GAP) : side === 'below' ? c.height / 2 + GAP : 0;
  const cy = c.y + shift;
  return { x0, y0: cy - c.height / 2, x1: x0 + c.width, y1: cy + c.height / 2 };
}

/** Décalage vertical du nom pour un côté donné, en pixels (même règle que `boxFor`). */
export function labelShift(side: PlacedLabel['side'], height: number): number {
  if (side === 'above') return -(height / 2 + GAP);
  if (side === 'below') return height / 2 + GAP;
  return 0;
}

/**
 * Choisit les noms à écrire et leur côté. `obstacles` : boîtes déjà occupées (signes,
 * commandes). `frame` : largeur et hauteur du cadre ; un nom ne déborde pas du cadre.
 */
export function placeLabels(
  candidates: readonly LabelCandidate[],
  frame: { width: number; height: number },
  obstacles: readonly Box[] = [],
): Map<string, PlacedLabel> {
  const taken: Box[] = [...obstacles];
  const placed = new Map<string, PlacedLabel>();
  const sorted = [...candidates].sort((a, b) => b.priority - a.priority);
  for (const [index, c] of sorted.entries()) {
    if (c.x < -20 || c.x > frame.width + 20 || c.y < -20 || c.y > frame.height + 20) continue;
    // Le nom d'une capitale peut couvrir le signe d'un hameau voisin, jamais l'inverse.
    const glyphs = sorted.slice(0, index).flatMap((other) => (other.glyph ? [other.glyph] : []));
    const sides: readonly PlacedLabel['side'][] = c.anchor === 'center' ? ['center'] : ['right', 'left', 'above', 'below'];
    for (const side of sides) {
      const box = boxFor(c, side);
      if (box.x0 < 2 || box.x1 > frame.width - 2 || box.y0 < 2 || box.y1 > frame.height - 2) continue;
      if (taken.some((other) => overlaps(box, other))) continue;
      if (glyphs.some((other) => overlaps(box, other))) continue;
      if (c.glyph && overlaps(box, c.glyph)) continue;
      taken.push(box);
      placed.set(c.id, { id: c.id, side });
      break;
    }
  }
  return placed;
}

/** Boîte occupée par un signe de rayon `r` en pixels : les noms ne la recouvrent pas. */
export function glyphBox(x: number, y: number, r: number): Box {
  return { x0: x - r, y0: y - r, x1: x + r, y1: y + r };
}

/** Largeur approximative d'un texte en italique de corps `size`, en pixels. */
export function estimateTextWidth(text: string, size: number): number {
  return text.length * size * 0.5 + 2;
}

/* ------------------------------------------------------------------ reliefs */

/**
 * Relief gravé : un chevron par pas le long de la ligne de crête, versant ombré de traits
 * courts. `points` : positions échantillonnées sur la crête (unités de la carte). Renvoie
 * deux tracés : les chevrons, et les hachures du versant à l'ombre (la lumière vient de l'ouest).
 */
export function reliefPaths(points: readonly (readonly [number, number])[], size: number): { peaks: string; shade: string } {
  let peaks = '';
  let shade = '';
  points.forEach(([x, y], index) => {
    // Hauteurs irrégulières mais stables : un relief n'a pas deux sommets semblables.
    const jitter = 0.78 + ((index * 37) % 11) / 22;
    const h = size * jitter;
    const half = size * 0.62 * jitter;
    const top: [number, number] = [x, y - h];
    peaks += `M${(x - half).toFixed(1)},${y.toFixed(1)}L${top[0].toFixed(1)},${top[1].toFixed(1)}L${(x + half).toFixed(1)},${y.toFixed(1)}`;
    // Trois traits sur le versant est, parallèles à la pente ouest.
    for (let k = 1; k <= 3; k += 1) {
      const t = k / 4;
      const sx = top[0] + half * t;
      const sy = top[1] + h * t;
      shade += `M${sx.toFixed(1)},${sy.toFixed(1)}L${(sx - half * 0.32).toFixed(1)},${y.toFixed(1)}`;
    }
  });
  return { peaks, shade };
}
