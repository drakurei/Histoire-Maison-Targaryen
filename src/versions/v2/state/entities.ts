/**
 * Adresse canonique d'une entité et souverains reconnus. Léger : n'importe que les modules
 * déjà tirés par la fasce (chroniques, lignée, guerres).
 */
import { getEvent } from '@/core/content/timeline';
import { getBattle } from '@/core/content/wars';

import type { EntityKind } from './useVoir';
import { sovereigns } from './scene';

/** La fiche d'une entité, chemin interne sans préfixe, et l'année qu'y porte le lien. */
export function entityPath(kind: EntityKind, id: string): { to: string; year: number | null | 'keep' } {
  switch (kind) {
    case 'person':
      return { to: `/personnages/${id}`, year: 'keep' };
    case 'dragon':
      return { to: `/dragons/${id}`, year: 'keep' };
    case 'place':
      return { to: `/lieux/${id}`, year: 'keep' };
    case 'war':
      return { to: `/guerres/${id}`, year: 'keep' };
    case 'battle': {
      const battle = getBattle(id);
      return battle ? { to: `/guerres/${battle.warId}#${id}`, year: battle.year ?? 'keep' } : { to: '/guerres', year: 'keep' };
    }
    case 'event': {
      const event = getEvent(id);
      return event ? { to: `/chroniques/${event.periodId}/${id}`, year: event.year ?? 'keep' } : { to: '/chroniques', year: 'keep' };
    }
  }
}

const SOVEREIGN_IDS: ReadonlySet<string> = new Set(sovereigns.map((sovereign) => sovereign.id));

/** Vrai pour un roi ou une reine qui a régné : son nom porte la couronne. */
export function isSovereign(id: string): boolean {
  return SOVEREIGN_IDS.has(id);
}

/** Dernier élément qui a ouvert le cartel : le focus y revient à la fermeture. */
let opener: HTMLElement | null = null;

export function rememberOpener(element: HTMLElement | null): void {
  opener = element;
}

export function takeOpener(): HTMLElement | null {
  const element = opener;
  opener = null;
  return element && element.isConnected ? element : null;
}
