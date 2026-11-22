/**
 * Projections des chroniques pour les vues d'entrée de la version 2 (portail, chroniques,
 * période, événement). Fonctions pures, sans présentation, testées par `model.test.ts`.
 * Elles lisent les registres reçus en argument et n'inventent rien : un lieu, un dragon,
 * une année ne viennent que des données.
 */
import type { EntityRef, HistoricalEvent } from '@/core/content/types';
import { yearToX } from '@/core/timeline';
import type { TimeScale } from '@/core/timeline';

import type { DragonPresence } from '../../model/presence';

/** Identifiants distincts des entités citées, dans l'ordre d'apparition (les noms sans fiche sont omis). */
export function idsOf(lists: readonly (readonly EntityRef[])[]): string[] {
  const seen = new Set<string>();
  for (const refs of lists) for (const ref of refs) if (ref.id) seen.add(ref.id);
  return [...seen];
}

/** Lieux d'un ensemble d'événements, dans l'ordre du récit. */
export function placeIdsOf(events: readonly HistoricalEvent[]): string[] {
  return idsOf(events.map((event) => event.places));
}

/** L'année tombe-t-elle dans la durée de l'événement ? */
function covers(event: HistoricalEvent, year: number): boolean {
  if (event.year === null) return false;
  const end = event.yearEnd ?? event.year;
  return event.year <= year && year <= end;
}

/** Lieux des événements de l'année ; `null` quand aucune année n'est réglée. */
export function placesOfYear(events: readonly HistoricalEvent[], year: number | null): ReadonlySet<string> | null {
  if (year === null) return null;
  return new Set(placeIdsOf(events.filter((event) => covers(event, year))));
}

/**
 * Le dragon qui compte le plus dans une suite d'événements : le plus souvent cité, et à
 * égalité le premier cité. `null` si aucun dragon des registres n'y paraît.
 */
export function leadingDragon(events: readonly HistoricalEvent[]): string | null {
  const counts = new Map<string, number>();
  for (const event of events) {
    for (const id of new Set(event.dragons.map((ref) => ref.id).filter((id): id is string => Boolean(id)))) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [id, count] of counts) {
    if (count > bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}

export interface Peak {
  /** Plus grand nombre de dragons attestés une même année dans la durée. */
  count: number;
  /** Première année où il est atteint ; `null` si aucun dragon. */
  year: number | null;
  /** Vrai si la durée touche la masse de Valyria, que personne n'a comptée. */
  uncounted: boolean;
}

/** Le plus fort de la masse dans une durée. */
export function peakIn(presence: DragonPresence, from: number, to: number, valyria: readonly [number, number]): Peak {
  let count = 0;
  let year: number | null = null;
  for (const entry of presence.years) {
    if (entry.year < from || entry.year > to) continue;
    if (entry.attested.length > count) {
      count = entry.attested.length;
      year = entry.year;
    }
  }
  return { count, year, uncounted: from <= valyria[1] && to >= valyria[0] };
}

/** Nombre de dragons attestés à une année, 0 hors du domaine. */
export function aliveAt(presence: DragonPresence, year: number): number {
  return presence.years.find((entry) => entry.year === year)?.attested.length ?? 0;
}

/** Abréviations après lesquelles un point ne finit pas la phrase (ères, initiales, titres). */
const ABBREVIATION = /(?:^|[\s(])(?:apr|av|env|cf|St|Ste|Mme|[A-ZÀ-Þ])$/u;

/**
 * La première phrase d'un texte : jusqu'au premier point, point d'interrogation ou de
 * suspension suivi d'une majuscule, sauf après une abréviation (« 129 apr. C. », « R. R. »).
 */
export function firstSentence(text: string): string {
  const trimmed = text.trim();
  const ends = /[.?!…](?=\s+[«“"A-ZÀ-ÖØ-Þ])/gu;
  for (let match = ends.exec(trimmed); match; match = ends.exec(trimmed)) {
    const before = trimmed.slice(0, match.index);
    if (match[0] === '.' && ABBREVIATION.test(before)) continue;
    return trimmed.slice(0, match.index + 1);
  }
  return trimmed;
}

/** Tous les événements dans le fil du temps de la chronique (`sortYear`), ordre du récit à égalité. */
export function chronology(events: readonly HistoricalEvent[]): HistoricalEvent[] {
  return events.map((event, index) => ({ event, index })).sort((a, b) => a.event.sortYear - b.event.sortYear || a.index - b.index).map(({ event }) => event);
}

export interface Neighbours<T> {
  previous: T | null;
  next: T | null;
}

/** Le précédent et le suivant d'un élément dans une suite. */
export function neighboursOf<T extends { id: string }>(list: readonly T[], id: string): Neighbours<T> {
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return { previous: null, next: null };
  return { previous: list[index - 1] ?? null, next: list[index + 1] ?? null };
}

/* ------------------------------------------------------------------ le grand nombre évidé */

/**
 * Hauteur de l'aplat (dragons attestés) sous chaque colonne de pixels d'un profil : ce sur
 * quoi le grand nombre peut être évidé. Les hachures (Valyria, sort inconnu) ne comptent
 * pas : un chiffre évidé dans une hachure ne se lit plus.
 */
export function solidHeights(presence: DragonPresence, scale: TimeScale, width: number, full: number, peak: number): Float32Array {
  const heights = new Float32Array(Math.max(0, Math.round(width)));
  const perDragon = full / Math.max(1, peak);
  const [from, to] = scale.domain;
  for (const entry of presence.years) {
    if (entry.year < from || entry.year > to || entry.attested.length === 0) continue;
    const next = entry.year === -1 ? 1 : entry.year + 1;
    const x0 = Math.max(0, Math.floor(yearToX(scale, entry.year)));
    const x1 = Math.min(heights.length, Math.ceil(yearToX(scale, next)));
    const height = entry.attested.length * perDragon;
    for (let x = x0; x < x1; x += 1) heights[x] = Math.max(heights[x] ?? 0, height);
  }
  return heights;
}

export interface NumberPlacement {
  /** Bord gauche du nombre dans le profil, en pixels. */
  left: number;
  /** Écart entre le pied du profil et le pied du nombre, en pixels. */
  bottom: number;
  /** Corps du nombre, en fraction du corps demandé (1 : le `--t6` entier). */
  scale: number;
  /** Évidé dans le rouge (vrai) ou écrit en ivoire au-dessus du profil (faux). */
  hollow: boolean;
}

export interface NumberBox {
  /** Largeur et hauteur du nombre au corps entier, en pixels. */
  width: number;
  height: number;
  /** Largeur qui ne suit pas le corps (le sigle d'ère, en corps fixe), en pixels. */
  extra?: number;
}

/** Plus petite hauteur d'une fenêtre de `span` colonnes commençant à `start`. */
function windowMin(heights: Float32Array, start: number, span: number): number {
  let min = Infinity;
  for (let x = start; x < start + span; x += 1) min = Math.min(min, heights[x] ?? 0);
  return min;
}

function windowMax(heights: Float32Array, start: number, span: number): number {
  let max = 0;
  for (let x = start; x < start + span; x += 1) max = Math.max(max, heights[x] ?? 0);
  return max;
}

/**
 * Où poser le grand nombre sur un profil. On cherche d'abord à l'évider dans l'aplat : au
 * corps entier, puis un peu plus petit (jusqu’à la moitié), dans la fenêtre la plus haute, et de
 * préférence au plus près de l'abscisse voulue (l'année réglée). Si le rouge est trop bas
 * partout, le nombre est écrit en ivoire au-dessus de la partie la plus basse du profil.
 */
export function placeNumber(heights: Float32Array, box: NumberBox, options: { preferX?: number | null; pad?: number } = {}): NumberPlacement {
  const width = heights.length;
  const pad = options.pad ?? 10;
  const preferX = options.preferX ?? null;
  for (let step = 0; step <= 10; step += 1) {
    const scale = 1 - step * 0.05;
    const span = Math.ceil(box.width * scale + (box.extra ?? 0));
    if (span <= 0 || span > width) continue;
    const need = box.height * scale + pad * 2;
    let best: { left: number; score: number; min: number } | null = null;
    for (let start = 0; start + span <= width; start += 2) {
      const min = windowMin(heights, start, span);
      if (min < need) continue;
      const centre = start + span / 2;
      const score = preferX === null ? -start : -Math.abs(centre - preferX);
      if (!best || score > best.score) best = { left: start, score, min };
    }
    if (best) {
      // Au milieu de l'aplat qui le porte : le rouge l'entoure également dessus et dessous.
      const bottom = Math.max(pad, Math.round((best.min - box.height * scale) / 2));
      return { left: best.left, bottom, scale: Math.round(scale * 100) / 100, hollow: true };
    }
  }
  const span = Math.min(width, Math.ceil(box.width + (box.extra ?? 0)));
  let lowest = { left: 0, max: Infinity };
  for (let start = 0; start + span <= width; start += 2) {
    const max = windowMax(heights, start, span);
    if (max < lowest.max) lowest = { left: start, max };
  }
  return { left: lowest.left, bottom: (Number.isFinite(lowest.max) ? lowest.max : 0) + pad, scale: 1, hollow: false };
}
