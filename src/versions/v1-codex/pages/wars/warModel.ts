/**
 * Rangements des pages des guerres de la version 1 : fonctions pures.
 */
import type { Battle, Belligerent, Place, War } from '@/core/content/types';

/** Les batailles d'une guerre dans l'ordre du temps (ordre de la source à année égale). */
export function battlesInOrder(war: War): Battle[] {
  return war.battles
    .map((battle, index) => ({ battle, index }))
    .sort((a, b) => (a.battle.year ?? Infinity) - (b.battle.year ?? Infinity) || a.index - b.index)
    .map((entry) => entry.battle);
}

export function belligerentOf(war: War, id: string): Belligerent | undefined {
  return war.belligerents.find((side) => side.id === id);
}

export interface BattleMarker {
  placeId: string;
  coord: readonly [number, number];
  /** Numéros d'ordre des batailles livrées en ce lieu (1 = la première de la guerre). */
  numbers: number[];
  /** Première bataille du lieu : l'ancre vers laquelle mène le signe. */
  battleId: string;
}

/** En deçà de cette distance (unités de la carte), deux lieux de bataille partagent un signe. */
const MERGE_DISTANCE = 9;

/** Un signe par lieu de bataille, portant les numéros de toutes les batailles qui s'y sont livrées. */
export function battleMarkers(ordered: readonly Battle[], placeOf: (id: string) => Place | undefined): BattleMarker[] {
  const byPlace = new Map<string, BattleMarker>();
  ordered.forEach((battle, index) => {
    if (!battle.placeId) return;
    const place = placeOf(battle.placeId);
    if (!place) return;
    // Deux lieux presque confondus sur la carte (Port-Réal et Fossedragon) partagent un signe.
    const marker =
      byPlace.get(place.id) ??
      [...byPlace.values()].find((other) => Math.hypot(other.coord[0] - place.coord[0], other.coord[1] - place.coord[1]) < MERGE_DISTANCE);
    if (marker) marker.numbers.push(index + 1);
    else byPlace.set(place.id, { placeId: place.id, coord: place.coord, numbers: [index + 1], battleId: battle.id });
  });
  return [...byPlace.values()];
}

const SENTENCE_END = /(?<=[a-zàâçéèêëîïôûùüÿœ)»”0-9][.;])\s+(?=[A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŒ«“])/u;
const ABBREVIATIONS = /(?:\b(?:av|apr|C|St|Mr|Ier|Ire)\.)$/u;

/**
 * La phrase d'ouverture d'un résumé, pour la liste des guerres. Les sigles d'ère
 * (« av. C. », « apr. C. ») ne ferment pas une phrase.
 */
export function openingSentence(text: string, min = 80): string {
  const parts = text.split(SENTENCE_END);
  let out = '';
  for (const part of parts) {
    out = out ? `${out} ${part}` : part;
    if (out.length >= min && !ABBREVIATIONS.test(out)) break;
  }
  return out;
}

/**
 * Un nom de camp pris dans une phrase : l'article initial passe en minuscule (« contre le
 * Trône de Fer »), le reste ne change pas.
 */
export function inSentence(name: string): string {
  return name.replace(/^(Le|La|Les|L’|L'|The) /u, (article) => article.toLowerCase()).replace(/^L’/u, 'l’');
}
