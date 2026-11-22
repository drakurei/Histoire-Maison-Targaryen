/**
 * Les repères du portail (spec §5.1) : cinq annotations posées sur la masse en majesté,
 * chacune liée à son événement. Les années, les comptes et les événements viennent des
 * données ; seul le choix des cinq moments est éditorial.
 */
import { events } from '@/core/content/timeline';

import { PEAK, presence } from '../../state/scene';

import { aliveAt, chronology } from './model';

/**
 * Comment le repère se pose : contre le mur de Valyria (le Fléau), contre le flanc du
 * sommet (le plus fort de la masse), ou sur une tige au-dessus du relief.
 */
export type RepereMode = 'mur' | 'sommet' | 'relief';

export interface Repere {
  id: 'doom' | 'conquest' | 'peak' | 'last_dragon' | 'hatching';
  eventId: string;
  year: number;
  /** Clé du texte (`v2.portal.note.*`) et sa variable. */
  key: string;
  n?: number;
  mode: RepereMode;
  /** Côté du texte par rapport à son ancre. */
  side: 'droite' | 'gauche';
  /** Gardé au téléphone, où la masse est étroite (spec : la Danse et 153). */
  phone: boolean;
}

function yearOf(id: string): number | null {
  return events.find((event) => event.id === id)?.year ?? null;
}

/** L'année du plus fort de la masse, et le premier événement des livres daté de cette année. */
function peakMoment(): { year: number; eventId: string } | null {
  const entry = presence.years.find((candidate) => candidate.attested.length === PEAK);
  if (!entry) return null;
  const event = chronology(events).find((candidate) => candidate.year === entry.year && candidate.continuity === 'livres');
  return event ? { year: entry.year, eventId: event.id } : null;
}

function build(): Repere[] {
  const list: Repere[] = [];
  const add = (repere: Omit<Repere, 'year'>, year: number | null) => {
    if (year !== null) list.push({ ...repere, year });
  };
  add({ id: 'doom', eventId: 'p1-fleau', key: 'v2.portal.note.doom', mode: 'mur', side: 'droite', phone: false }, yearOf('p1-fleau'));
  add(
    { id: 'conquest', eventId: 'p3-debarquement', key: 'v2.portal.note.conquest', mode: 'relief', side: 'droite', phone: false },
    yearOf('p3-debarquement'),
  );
  const peak = peakMoment();
  if (peak) {
    add({ id: 'peak', eventId: peak.eventId, key: 'v2.portal.note.peak', n: PEAK, mode: 'sommet', side: 'droite', phone: true }, peak.year);
  }
  add(
    { id: 'last_dragon', eventId: 'p5-dernier-dragon', key: 'v2.portal.note.last_dragon', mode: 'relief', side: 'droite', phone: true },
    yearOf('p5-dernier-dragon'),
  );
  const hatching = yearOf('p8-eclosion');
  add(
    {
      id: 'hatching',
      eventId: 'p8-eclosion',
      key: 'v2.portal.note.hatching',
      n: hatching === null ? 0 : aliveAt(presence, hatching),
      mode: 'relief',
      side: 'gauche',
      phone: false,
    },
    hatching,
  );
  return list;
}

export const REPERES: readonly Repere[] = build();
