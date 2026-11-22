/**
 * Guerres et batailles.
 * Données produites par `scripts/build-content.mjs` à partir de `content/battles/wars-*.json`.
 */
import data from '@/content/generated/wars.json';
import type { Battle, War } from './types';

interface WarsData {
  wars: War[];
}

/*
 * Seul transtypage du module. TypeScript infère du JSON des `string` et des tableaux là où
 * le contrat attend des unions littérales et des couples (`sides`) : la forme exacte est
 * garantie en amont par la validation de `scripts/build-content.mjs`.
 */
const typed = data as unknown as WarsData;

/** Les conflits, par année de début. */
export const wars: readonly War[] = typed.wars;

/** Toutes les batailles, aplaties, guerre après guerre. */
export const battles: readonly Battle[] = wars.flatMap((war) => war.battles);

const warById: ReadonlyMap<string, War> = new Map(wars.map((war) => [war.id, war]));
const battleById: ReadonlyMap<string, Battle> = new Map(battles.map((battle) => [battle.id, battle]));

export function getWar(id: string): War | undefined {
  return warById.get(id);
}

export function getBattle(id: string): Battle | undefined {
  return battleById.get(id);
}
