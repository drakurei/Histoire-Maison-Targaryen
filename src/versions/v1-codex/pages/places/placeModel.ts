/**
 * Des lieux du registre aux signes de la carte, et quelques rangements pour les pages des
 * lieux de la version 1. Les textes arrivent traduits par l'appelant.
 */
import type { Place, PlaceKind } from '@/core/content/types';
import type { TitleText } from '@/core/i18n';
import { VALYRIAN_TAG } from '@/core/i18n';
import type { WorldMapPlace } from '@/shared/map';

export const PLACE_KINDS: readonly PlaceKind[] = ['cite', 'cite-libre', 'forteresse', 'ile', 'ruine', 'champ-de-bataille', 'region'];

const KIND_WEIGHT: Record<PlaceKind, number> = {
  cite: 6,
  'cite-libre': 5,
  forteresse: 4,
  'champ-de-bataille': 3,
  ile: 2,
  ruine: 2,
  region: 1,
};

/** Importance d'un nom sur la carte : genre du lieu, puis ce que la chronique y fait arriver. */
export function placePriority(place: Place): number {
  return KIND_WEIGHT[place.kind] + Math.min(place.eventIds.length + 2 * place.battleIds.length, 40) / 8;
}

/** Le signe d'un lieu sur la carte. `name` : son nom résolu ; `detail` : genre et région. */
export function toMapPlace(place: Place, name: TitleText, detail: string): WorldMapPlace {
  return {
    id: place.id,
    name: name.primary,
    nameLang: name.isHv ? VALYRIAN_TAG : undefined,
    kind: place.kind,
    coord: place.coord,
    href: `/lieux/${place.id}`,
    priority: placePriority(place),
    detail,
  };
}

/** Les plus proches voisins d'un lieu, par la distance sur la carte. */
export function nearestPlaces(place: Place, all: readonly Place[], count: number): Place[] {
  return all
    .filter((other) => other.id !== place.id)
    .map((other) => ({ other, d: Math.hypot(other.coord[0] - place.coord[0], other.coord[1] - place.coord[1]) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((entry) => entry.other);
}

export interface IndexLetter<T> {
  letter: string;
  items: T[];
}

/** Index alphabétique, comme à la fin d'un livre : une lettre, puis les noms qui commencent par elle. */
export function alphabetical<T>(items: readonly T[], key: (item: T) => string, locale: string): IndexLetter<T>[] {
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  const sorted = [...items].sort((a, b) => collator.compare(stripArticle(key(a)), stripArticle(key(b))));
  const letters: IndexLetter<T>[] = [];
  for (const item of sorted) {
    const letter = initialOf(stripArticle(key(item)));
    const last = letters[letters.length - 1];
    if (last && last.letter === letter) last.items.push(item);
    else letters.push({ letter, items: [item] });
  }
  return letters;
}

/** On classe « le Trident » à T, « the Trident » à T, comme un index savant. */
function stripArticle(name: string): string {
  return name.replace(/^(le |la |les |l’|l'|the )/i, '');
}

function initialOf(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').charAt(0).toUpperCase();
}

/** Clé d'interface d'un genre de lieu (les clés n'admettent pas le trait d'union). */
export function kindKey(kind: PlaceKind, plural = false): string {
  return `page.places.${plural ? 'kinds' : 'kind'}.${kind.replace(/-/g, '_')}`;
}
