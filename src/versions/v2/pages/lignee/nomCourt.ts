import type { Person } from '@/core/content/types';

/**
 * Dans la lignée, la Maison va sans dire : « Rhaenyra » plutôt que « Rhaenyra Targaryen ».
 * La précision que la source ajoute pour départager deux homonymes (« fils de Jaehaerys Ier »)
 * est rendue à part, pour être écrite plus petit. Les autres maisons gardent leur nom.
 */
export function nomCourt(person: Person, text: string): { nom: string; precision: string | null } {
  const match = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(text);
  const base = match ? (match[1] ?? text) : text;
  const precision = match ? (match[2] ?? null) : null;
  const nom = person.house === 'targaryen' ? base.replace(/\s+Targaryen$/, '') : base;
  return { nom: nom || base, precision };
}
