/**
 * Les personnages rangés pour la figure fascée (spec §5.8) : par naissance (ordre de
 * `lifeSpans`), en groupes de période ; les périodes longues (IV, VI) sont subdivisées par
 * règne, et un règne de moins de quatre naissances rejoint le précédent, pour qu'aucun groupe
 * ne dépasse une trentaine de vies sans émietter le rail. Fonction pure.
 */
import type { Period, Sovereign } from '@/core/content/types';
import type { LifeSpan } from '@/core/timeline';

export interface GroupeVies {
  key: string;
  period: Period;
  /** Souverains sous lesquels ces personnes naissent (subdivision d'une longue période). */
  reigns: Sovereign[];
  spans: LifeSpan[];
}

const SPLIT: ReadonlySet<string> = new Set(['p4', 'p6']);
const MIN_REIGN = 4;

function periodOf(periods: readonly Period[], year: number): Period | undefined {
  let found: Period | undefined;
  for (const period of periods) if ((period.from ?? Number.NEGATIVE_INFINITY) <= year) found = period;
  return found ?? periods[0];
}

function reignOf(sovereigns: readonly Sovereign[], year: number): Sovereign | undefined {
  let found: Sovereign | undefined;
  for (const sovereign of sovereigns) if (sovereign.ordinal !== null && sovereign.reignFrom <= year) found = sovereign;
  return found;
}

export function groupesVies(spans: readonly LifeSpan[], periods: readonly Period[], sovereigns: readonly Sovereign[]): GroupeVies[] {
  const ordered = [...periods].sort((a, b) => a.order - b.order);
  const counted = [...sovereigns].filter((sovereign) => sovereign.ordinal !== null).sort((a, b) => a.reignFrom - b.reignFrom);
  const groups: GroupeVies[] = [];
  for (const span of spans) {
    const period = periodOf(ordered, span.extent[0]);
    if (!period) continue;
    const reign = SPLIT.has(period.id) ? reignOf(counted, span.extent[0]) : undefined;
    const key = reign ? `${period.id}-${reign.id}` : period.id;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.spans.push(span);
    else groups.push({ key, period, reigns: reign ? [reign] : [], spans: [span] });
  }
  // Un règne trop court rejoint le groupe précédent de la même période.
  const merged: GroupeVies[] = [];
  for (const group of groups) {
    const previous = merged[merged.length - 1];
    if (previous && previous.period.id === group.period.id && group.reigns.length > 0 && group.spans.length < MIN_REIGN) {
      previous.spans.push(...group.spans);
      previous.reigns.push(...group.reigns);
    } else {
      merged.push({ ...group, reigns: [...group.reigns], spans: [...group.spans] });
    }
  }
  return merged;
}
