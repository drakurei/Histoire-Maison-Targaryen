/**
 * La vie de chaque dragon telle que la fasce la compte (`presence` de la scène) : années
 * attestées, puis années au sort inconnu. Lu une fois, au chargement du registre : aucune
 * règle nouvelle, seulement la projection par dragon de la série D1.
 */
import { dragons } from '@/core/content/dragons';
import type { Dragon, Period } from '@/core/content/types';

import { boundsOf, periods, presence } from '../../state/scene';

export interface DragonLife {
  /** Première et dernière année comptées (attestée ou au sort inconnu). */
  from: number;
  to: number;
  /** Dernière année attestée. */
  sureTo: number;
  /** Années au sort inconnu, après la dernière mention. */
  doubt: readonly [number, number] | null;
}

function computeLives(): Map<string, DragonLife> {
  const lives = new Map<string, DragonLife>();
  for (const entry of presence.years) {
    for (const id of entry.attested) {
      const life = lives.get(id);
      if (!life) lives.set(id, { from: entry.year, to: entry.year, sureTo: entry.year, doubt: null });
      else {
        life.to = entry.year;
        life.sureTo = entry.year;
      }
    }
    for (const id of entry.doubtful) {
      const life = lives.get(id);
      if (!life) continue;
      life.to = entry.year;
      life.doubt = life.doubt ? [life.doubt[0], entry.year] : [entry.year, entry.year];
    }
  }
  return lives;
}

const LIVES: ReadonlyMap<string, DragonLife> = computeLives();

export function lifeOf(id: string): DragonLife | undefined {
  return LIVES.get(id);
}

/** L'époque d'un dragon : la période qui contient le début de sa vie (la plus récente si deux se chevauchent). */
function epochOf(life: DragonLife): Period | undefined {
  let found: Period | undefined;
  for (const period of periods) {
    const [from, to] = boundsOf(period);
    if (life.from < from || life.from > to) continue;
    if (!found || from >= boundsOf(found)[0]) found = period;
  }
  return found;
}

export interface DragonEpoch {
  period: Period | null;
  dragons: readonly Dragon[];
}

/** Les dragons groupés par époque, dans l'ordre du temps ; les non datés à la fin (`period: null`). */
export function dragonEpochs(): DragonEpoch[] {
  const groups = new Map<string, Dragon[]>();
  const undated: Dragon[] = [];
  const dated = dragons
    .filter((dragon) => {
      const life = LIVES.get(dragon.id);
      if (!life) undated.push(dragon);
      return life !== undefined;
    })
    .sort((a, b) => (LIVES.get(a.id)?.from ?? 0) - (LIVES.get(b.id)?.from ?? 0));
  for (const dragon of dated) {
    const life = LIVES.get(dragon.id);
    const period = life ? epochOf(life) : undefined;
    const key = period?.id ?? '';
    groups.set(key, [...(groups.get(key) ?? []), dragon]);
  }
  const result: DragonEpoch[] = periods
    .filter((period) => groups.has(period.id))
    .map((period) => ({ period, dragons: groups.get(period.id) ?? [] }));
  if (undated.length > 0) result.push({ period: null, dragons: undated });
  return result;
}

/** Premier dragon compté, et dernière mort avant la longue absence : bornes des états vides. */
export const FIRST_DRAGON_YEAR: number | null = presence.years.find((entry) => entry.attested.length > 0)?.year ?? null;
export const EXTINCTION: number | null = presence.extinction;

/** Première année, après l'extinction, où un dragon est de nouveau attesté. */
export const RETURN_YEAR: number | null =
  presence.extinction === null
    ? null
    : (presence.years.find((entry) => entry.year > (presence.extinction ?? 0) && entry.attested.length > 0)?.year ?? null);
