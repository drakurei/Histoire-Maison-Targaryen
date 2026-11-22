/**
 * Le dessin du pal, mesuré sur le texte réel : la bande de sang, les entailles du fil, les
 * traits qui posent chaque porteur du fil sur le pal, et les fils de filiation du bloc, qui
 * courent dans des couloirs entre le pal et les noms. Rien n'est supposé de la mise en page :
 * tout part des rectangles du DOM, pour que le dessin suive la césure, la langue et la largeur.
 */
import type { Descente } from './modelePal';

export interface Trace {
  width: number;
  height: number;
  pal: { x: number; top: number; bottom: number };
  entailles: { y: number; braise: boolean }[];
  traits: { y: number; x1: number; x2: number }[];
  fils: { key: string; d: string; doute: boolean }[];
}

/** Largeur du pal (spec §5.7) : 12 px. */
export const PAL = 12;

function rectIn(root: DOMRect, element: Element): DOMRect {
  const rect = element.getBoundingClientRect();
  return new DOMRect(rect.left - root.left, rect.top - root.top, rect.width, rect.height);
}

/** Couloirs : le fil le plus court au plus près des noms, pour que les entrées ne se croisent pas. */
function lanesOf(spans: readonly { top: number; bottom: number }[]): number[] {
  const order = spans.map((span, index) => ({ ...span, index })).sort((a, b) => a.bottom - a.top - (b.bottom - b.top));
  const lanes: { top: number; bottom: number }[][] = [];
  const result = new Array<number>(spans.length).fill(0);
  for (const span of order) {
    let lane = lanes.findIndex((taken) => taken.every((other) => span.bottom < other.top - 2 || span.top > other.bottom + 2));
    if (lane === -1) {
      lane = lanes.length;
      lanes.push([]);
    }
    lanes[lane]?.push(span);
    result[span.index] = lane;
  }
  return result;
}

export function mesurerPal(root: HTMLElement, descentes: readonly Descente[]): Trace | null {
  const box = root.getBoundingClientRect();
  const rail = root.querySelector('[data-rail]');
  if (!rail || box.width === 0) return null;
  const railRect = rectIn(box, rail);
  const palX = railRect.left + railRect.width / 2;
  // Le bord du texte : le bloc de contenu moins sa marge intérieure, où courent les couloirs.
  const contents = [...root.querySelectorAll<HTMLElement>('[data-contenu]')].map(
    (element) => rectIn(box, element).left + parseFloat(getComputedStyle(element).paddingLeft || '0'),
  );
  const contentLeft = contents.length > 0 ? Math.min(...contents) : palX + PAL;
  const rows = [...root.querySelectorAll('[data-rangee]')].map((element) => rectIn(box, element));
  const first = rows[0];
  const last = rows[rows.length - 1];

  const entailles: Trace['entailles'] = [];
  const traits: Trace['traits'] = [];
  for (const element of root.querySelectorAll('[data-fil-nom]')) {
    const rect = rectIn(box, element);
    const y = Math.round(rect.top + Math.min(rect.height / 2, 18));
    entailles.push({ y, braise: element.hasAttribute('data-centre') || element.hasAttribute('data-chemin') });
    traits.push({ y, x1: palX + PAL / 2, x2: contentLeft - 3 });
  }

  const ends = descentes.map((descente) => {
    const from = root.querySelector(`[data-noeud="${descente.from}"]`);
    const to = root.querySelector(`[data-noeud="${descente.to}"]`);
    if (!from || !to) return null;
    const a = rectIn(box, from);
    const b = rectIn(box, to);
    // Une personne écrite après un anneau : le fil arrive au début de la ligne, avant l'anneau.
    const entry = to.closest('[data-union]');
    const target = entry ? rectIn(box, entry) : b;
    // D'un anneau, le fil part de dessous, pour ne pas suivre la ligne où il est écrit.
    const ring = descente.from.startsWith('ring:');
    return {
      descente,
      ring,
      rx: a.left + a.width / 2,
      fx: a.left - 2,
      fy: ring ? a.top + a.height + 9 : a.top + a.height / 2,
      fromBottom: a.top + a.height,
      tx: target.left - 4,
      ty: b.top + Math.min(b.height / 2, 16),
    };
  });
  const present = ends.filter((end): end is NonNullable<typeof end> => end !== null);
  const lanes = lanesOf(present.map((end) => ({ top: Math.min(end.fy, end.ty), bottom: Math.max(end.fy, end.ty) })));
  const laneCount = Math.max(1, ...lanes.map((lane) => lane + 1));
  const base = contentLeft - 9;
  const room = base - (palX + PAL / 2) - 6;
  const gap = Math.max(3, Math.min(6, room / laneCount));
  const fils = present.map((end, index) => {
    const x = Math.round(base - (lanes[index] ?? 0) * gap) + 0.5;
    const start = end.ring
      ? `M${end.rx.toFixed(1)} ${end.fromBottom.toFixed(1)}V${end.fy.toFixed(1)}`
      : `M${end.fx.toFixed(1)} ${end.fy.toFixed(1)}`;
    const d = `${start}H${x}V${end.ty.toFixed(1)}H${end.tx.toFixed(1)}`;
    return { key: `${end.descente.from}>${end.descente.to}`, d, doute: end.descente.doute };
  });

  return {
    width: box.width,
    height: box.height,
    pal: { x: palX, top: first ? first.top : 0, bottom: last ? last.top + last.height : box.height },
    entailles,
    traits,
    fils,
  };
}
