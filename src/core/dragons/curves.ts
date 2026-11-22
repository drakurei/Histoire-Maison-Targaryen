/**
 * Outils de tracé communs à la géométrie du dragon : points, courbes lisses, rubans
 * d'épaisseur variable, écriture des attributs `d`. Fonctions pures, TypeScript « effaçable ».
 */

export type Pt = readonly [number, number];
/** Chaîne de Bézier cubiques : [p0, c1, c2, p1, c1, c2, p2, …]. */
export type Chain = Pt[];
export type Cubic = readonly [Pt, Pt, Pt, Pt];

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const emptyBounds = (): Bounds => ({ minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const finite = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

export function smooth(t: number): number {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
}

/** Accès borné : hors limites, renvoie l'extrémité la plus proche. */
export function at<T>(list: readonly T[], i: number): T {
  return list[i < 0 ? 0 : i >= list.length ? list.length - 1 : i] as T;
}

/** Accès circulaire. */
export function wrap<T>(list: readonly T[], i: number): T {
  const n = list.length;
  return list[((i % n) + n) % n] as T;
}

export const mix = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const polar = (o: Pt, r: number, angle: number): Pt => [o[0] + r * Math.cos(angle), o[1] + r * Math.sin(angle)];
export const dist = (a: Pt, b: Pt): number => Math.hypot(b[0] - a[0], b[1] - a[1]);

export function unit(a: Pt, b: Pt): Pt {
  const l = dist(a, b) || 1;
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
}

/** Bruit déterministe dans [0, 1[ : les déchirures d'une membrane ne changent pas d'un rendu à l'autre. */
export function noise(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export const r1 = (n: number): string => String(Math.round(n * 10) / 10);

/** Courbe lisse (Catmull-Rom vers Bézier) passant par tous les points. */
export function through(points: readonly Pt[]): Chain {
  const n = points.length;
  const out: Chain = [at(points, 0)];
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(points, i - 1);
    const p1 = at(points, i);
    const p2 = at(points, i + 1);
    const p3 = at(points, i + 2);
    out.push(
      [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
      [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
      p2,
    );
  }
  return out;
}

/** Courbe lisse fermée passant par tous les points. */
export function loop(points: readonly Pt[]): Chain {
  const n = points.length;
  const out: Chain = [wrap(points, 0)];
  for (let i = 0; i < n; i++) {
    const p0 = wrap(points, i - 1);
    const p1 = wrap(points, i);
    const p2 = wrap(points, i + 1);
    const p3 = wrap(points, i + 2);
    out.push(
      [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
      [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
      p2,
    );
  }
  return out;
}

/**
 * Contour fermé, lisse partout sauf aux indices donnés, où il fait une pointe vive
 * (éperons du crâne). Sans pointe, équivaut à `loop`.
 */
export function shape(points: readonly Pt[], corners: ReadonlySet<number>): Chain {
  const n = points.length;
  const stops = [...corners].filter((i) => i >= 0 && i < n).sort((a, b) => a - b);
  if (stops.length === 0) return loop(points);
  const out: Chain = [wrap(points, at(stops, 0))];
  for (let k = 0; k < stops.length; k++) {
    const from = at(stops, k);
    const to = k + 1 < stops.length ? at(stops, k + 1) : at(stops, 0) + n;
    const run: Pt[] = [];
    for (let i = from; i <= to; i++) run.push(wrap(points, i));
    out.push(...through(run).slice(1));
  }
  return out;
}

/** Segment droit, écrit comme une cubique, sans son point de départ. */
export function lineTo(a: Pt, b: Pt): Pt[] {
  return [mix(a, b, 1 / 3), mix(a, b, 2 / 3), b];
}

export function cubicAt(c: Cubic, t: number): Pt {
  const a = mix(c[0], c[1], t);
  const b = mix(c[1], c[2], t);
  const d = mix(c[2], c[3], t);
  return mix(mix(a, b, t), mix(b, d, t), t);
}

/** Fleur (blossom) d'une cubique : sert à en extraire un tronçon exact. */
export function blossom(c: Cubic, u: number, v: number, w: number): Pt {
  const a = mix(c[0], c[1], u);
  const b = mix(c[1], c[2], u);
  const d = mix(c[2], c[3], u);
  return mix(mix(a, b, v), mix(b, d, v), w);
}

/** Tronçon [t0, t1] d'une cubique, sans son point de départ. */
export function subCubic(c: Cubic, t0: number, t1: number): Pt[] {
  return [blossom(c, t0, t0, t1), blossom(c, t0, t1, t1), blossom(c, t1, t1, t1)];
}

/** Aire signée (formule du lacet) sur tous les points de la chaîne. */
export function signedArea(chain: readonly Pt[]): number {
  let sum = 0;
  for (let i = 0; i < chain.length; i++) {
    const a = wrap(chain, i);
    const b = wrap(chain, i + 1);
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

/**
 * Toutes les formes fermées tournent dans le même sens (aire négative, celui des rubans) :
 * on peut ainsi les réunir dans un seul tracé rempli en `nonzero` sans creuser de trou.
 */
export function orient(chain: Chain): Chain {
  return signedArea(chain) > 0 ? chain.slice().reverse() : chain;
}

export function grow(b: Bounds, x: number, y: number): void {
  if (x < b.minX) b.minX = x;
  if (x > b.maxX) b.maxX = x;
  if (y < b.minY) b.minY = y;
  if (y > b.maxY) b.maxY = y;
}

/** Un nombre négatif se passe de séparateur : les tracés sont écrits au plus court. */
const tight = (d: string): string => d.replace(/ -/g, '-');

export function pathOf(chain: readonly Pt[], bounds: Bounds, close = true): string {
  let d = '';
  for (let i = 0; i < chain.length; i++) {
    const [x, y] = at(chain, i);
    grow(bounds, x, y);
    if (i === 0) d = `M${r1(x)} ${r1(y)}`;
    else d += `${i % 3 === 1 ? 'C' : ' '}${r1(x)} ${r1(y)}`;
  }
  return tight(close ? `${d}Z` : d);
}

export function polygon(points: readonly Pt[], bounds: Bounds): string {
  let d = '';
  for (let i = 0; i < points.length; i++) {
    const [x, y] = at(points, i);
    grow(bounds, x, y);
    d += `${i === 0 ? 'M' : 'L'}${r1(x)} ${r1(y)}`;
  }
  return tight(`${d}Z`);
}

export function segment(a: Pt, b: Pt): string {
  return tight(`M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}`);
}

/**
 * Ruban d'épaisseur variable autour d'une ligne médiane : un côté à l'aller, l'autre au
 * retour. Sert aux os, aux griffes, aux cornes. Le sens de rotation est toujours le même.
 */
export function ribbon(center: readonly Pt[], half: readonly number[]): Chain {
  const n = center.length;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const c = at(center, i);
    const [tx, ty] = unit(at(center, i - 1), at(center, i + 1));
    const h = at(half, i);
    left.push([c[0] - ty * h, c[1] + tx * h]);
    right.push([c[0] + ty * h, c[1] - tx * h]);
  }
  right.reverse();
  return [...through(left), ...lineTo(at(left, n - 1), at(right, 0)), ...through(right).slice(1)];
}

/** Interpolation d'Hermite sur des clés (abscisse, valeur) : profil d'épaisseur le long de la colonne. */
export function profile(keys: readonly (readonly [number, number])[]): (s: number) => number {
  const n = keys.length;
  return (s) => {
    if (s <= at(keys, 0)[0]) return at(keys, 0)[1];
    if (s >= at(keys, n - 1)[0]) return at(keys, n - 1)[1];
    let i = 0;
    while (i < n - 2 && at(keys, i + 1)[0] < s) i++;
    const [x0, y0] = at(keys, i - 1);
    const [x1, y1] = at(keys, i);
    const [x2, y2] = at(keys, i + 1);
    const [x3, y3] = at(keys, i + 2);
    const dx = x2 - x1 || 1;
    const m1 = i > 0 ? (y2 - y0) / (x2 - x0 || 1) : (y2 - y1) / dx;
    const m2 = i + 2 < n ? (y3 - y1) / (x3 - x1 || 1) : (y2 - y1) / dx;
    const t = (s - x1) / dx;
    const t2 = t * t;
    const t3 = t2 * t;
    const v = (2 * t3 - 3 * t2 + 1) * y1 + (t3 - 2 * t2 + t) * dx * m1 + (-2 * t3 + 3 * t2) * y2 + (t3 - t2) * dx * m2;
    return v < 0 ? 0 : v;
  };
}
