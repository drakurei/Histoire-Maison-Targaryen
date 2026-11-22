/**
 * Hasard reproductible pour le questionnaire : une graine donne toujours la même suite,
 * donc le même mélange. Aucun appel à `Math.random` : le moteur reste une fonction pure,
 * c'est à l'appelant de fournir une graine qui change (l'heure, un compteur) s'il veut
 * un ordre différent à chaque visite.
 *
 * Fichier en TypeScript « effaçable » : importable tel quel par Node 24.
 */

const UINT32 = 0x1_0000_0000;

/** FNV-1a sur 32 bits : une chaîne devient une graine entière. */
function hashText(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  }
  return hash >>> 0;
}

/** Graine entière sur 32 bits, à partir d'un nombre ou d'un texte (identifiant de parcours, date…). */
export function toSeed(seed: number | string): number {
  if (typeof seed === 'string') return hashText(seed);
  return Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : 0;
}

/** Graine de la manche suivante : différente de la précédente, et toujours la même pour une même graine. */
export function nextSeed(seed: number): number {
  return hashText(`${toSeed(seed)}+1`);
}

/** Générateur mulberry32 : rend une fonction qui tire un nombre dans [0, 1[. */
export function createRandom(seed: number): () => number {
  let state = toSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32;
  };
}

/** Copie mélangée (Fisher-Yates). Le tableau d'origine n'est pas touché. */
export function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const held = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = held;
  }
  return copy;
}
