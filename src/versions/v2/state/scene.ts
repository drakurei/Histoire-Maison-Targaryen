/**
 * La scène de la version 2 : ce que la fasce et le cartel de la fasce lisent en permanence.
 * Calculé une fois au chargement de la version, jamais au rendu.
 *
 * Performance (spec §7, dépendance D7) : sans index de scène généré, ce module tire les
 * chroniques, la lignée, les dragons et les guerres dans le bloc de la version.
 */
import { dragons } from '@/core/content/dragons';
import { sovereigns } from '@/core/content/people';
import { events, periods } from '@/core/content/timeline';
import type { Period } from '@/core/content/types';
import { battles, wars } from '@/core/content/wars';
import { NARRATIVE_END } from '@/core/timeline';

import { datedYears, dragonPresence, periodBounds } from '../model/presence';

/** Le temps de la fasce : des Quatorze Flammes légendaires à la fin du récit. */
export const DOMAIN: readonly [number, number] = [-2000, NARRATIVE_END];

/** Année du Fléau de Valyria : fin de la masse hachurée. Fin de la première période. */
export const DOOM: number = periods[0]?.to ?? -102;

/** Valyria n'a jamais compté ses dragons : avant le départ des Targaryen, la masse est hachurée. */
export const VALYRIA: readonly [number, number] = [DOMAIN[0], DOOM];

export const presence = dragonPresence(dragons, events, battles, DOMAIN[0], DOMAIN[1]);

/** Quinze dragons, le maximum (130), valent toute la hauteur de la masse. */
export const PEAK = Math.max(1, presence.peak);

/** Les crans de « ‹ » et « › ». */
export const DATED_YEARS: readonly number[] = datedYears(events);

export { periods, sovereigns, wars };

/** Bornes d'une période sur la fasce. */
export function boundsOf(period: Period): readonly [number, number] {
  return periodBounds(period, DOMAIN[0]);
}

/** Année ramenée dans le temps de la fasce, sans an 0. */
export function clampToDomain(year: number): number {
  const clamped = Math.min(DOMAIN[1], Math.max(DOMAIN[0], Math.round(year)));
  return clamped === 0 ? 1 : clamped;
}
