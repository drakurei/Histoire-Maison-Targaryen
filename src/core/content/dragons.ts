/**
 * Registre des dragons.
 * Données produites par `scripts/build-content.mjs` à partir de `content/dragons/`.
 */
import data from '@/content/generated/dragons.json';
import type { Dragon, Localized } from './types';

/** Remarques du dessinateur sur la taille et les teintes retenues pour la planche. */
export interface DragonLookNote {
  size?: Localized;
  color?: Localized;
}

interface DragonsData {
  dragons: Dragon[];
  extraTextualNotes: Record<string, Localized>;
  lookNotes: Record<string, DragonLookNote>;
}

/*
 * Seul transtypage du module. TypeScript infère du JSON des `string` là où le contrat
 * attend des unions littérales : la forme exacte est garantie en amont par la validation
 * de `scripts/build-content.mjs`.
 */
const typed = data as unknown as DragonsData;

/** Les dragons, du plus ancien au plus récent (ordre de la source). */
export const dragons: readonly Dragon[] = typed.dragons;

const dragonById: ReadonlyMap<string, Dragon> = new Map(dragons.map((dragon) => [dragon.id, dragon]));
const extraTextualNotes: ReadonlyMap<string, Localized> = new Map(Object.entries(typed.extraTextualNotes));
const lookNotes: ReadonlyMap<string, DragonLookNote> = new Map(Object.entries(typed.lookNotes));

export function getDragon(id: string): Dragon | undefined {
  return dragonById.get(id);
}

/**
 * Couleur connue par une illustration ou par une indication donnée hors texte, jamais par
 * un livre publié. À montrer à part de `Dragon.appearance`, qui ne contient que le texte.
 */
export function getExtraTextualNote(dragonId: string): Localized | undefined {
  return extraTextualNotes.get(dragonId);
}

export function getLookNote(dragonId: string): DragonLookNote | undefined {
  return lookNotes.get(dragonId);
}
