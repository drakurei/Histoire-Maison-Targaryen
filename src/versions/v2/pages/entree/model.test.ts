import { describe, expect, it } from 'vitest';

import type { HistoricalEvent } from '@/core/content/types';
import { createTimeScale } from '@/core/timeline';

import { presence, VALYRIA } from '../../state/scene';
import { events, periods } from '@/core/content/timeline';
import {
  chronology,
  firstSentence,
  leadingDragon,
  neighboursOf,
  peakIn,
  placeIdsOf,
  placeNumber,
  placesOfYear,
  solidHeights,
} from './model';

function event(partial: Partial<HistoricalEvent> & { id: string }): HistoricalEvent {
  return {
    periodId: 'p5',
    year: 130,
    sortYear: 130,
    dateCertainty: 'exacte',
    yearLabel: { fr: '', en: '' },
    title: { fr: partial.id, en: partial.id },
    summary: { fr: '', en: '' },
    consequence: { fr: '', en: '' },
    people: [],
    dragons: [],
    places: [],
    continuity: 'livres',
    reliability: 'etabli',
    sources: [],
    ...partial,
  };
}

const n = (id?: string) => (id ? { id, name: { fr: id, en: id } } : { name: { fr: 'x', en: 'x' } });

describe('lieux', () => {
  const list = [
    event({ id: 'a', year: 129, places: [n('peyredragon'), n()] }),
    event({ id: 'b', year: 130, yearEnd: 131, places: [n('le-gosier'), n('peyredragon')] }),
    event({ id: 'c', year: null, sortYear: 132, places: [n('port-real')] }),
  ];

  it('garde les lieux des registres, sans doublon, dans l’ordre', () => {
    expect(placeIdsOf(list)).toEqual(['peyredragon', 'le-gosier', 'port-real']);
  });

  it('allume les lieux de l’année, durée comprise, et rien sans année', () => {
    expect(placesOfYear(list, null)).toBeNull();
    expect([...(placesOfYear(list, 131) ?? [])]).toEqual(['le-gosier', 'peyredragon']);
    expect(placesOfYear(list, 140)?.size).toBe(0);
  });
});

describe('dragon qui compte', () => {
  it('prend le plus cité, le premier à égalité, et rien sans dragon', () => {
    const list = [
      event({ id: 'a', dragons: [n('syrax'), n('caraxes')] }),
      event({ id: 'b', dragons: [n('caraxes'), n('caraxes')] }),
      event({ id: 'c', dragons: [n('vhagar')] }),
    ];
    expect(leadingDragon(list)).toBe('caraxes');
    expect(leadingDragon([event({ id: 'd', dragons: [n()] })])).toBeNull();
  });
});

describe('suites', () => {
  it('range dans le fil du temps, l’ordre du récit à égalité', () => {
    const list = [event({ id: 'b', sortYear: 2 }), event({ id: 'a', sortYear: 1 }), event({ id: 'c', sortYear: 2 })];
    expect(chronology(list).map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(neighboursOf(chronology(list), 'b')).toMatchObject({ previous: { id: 'a' }, next: { id: 'c' } });
    expect(neighboursOf(list, 'z')).toEqual({ previous: null, next: null });
  });

  it('coupe la première phrase sans couper « apr. C. » ni un sigle', () => {
    expect(firstSentence('Aegon débarque. Il brûle Harrenhal.')).toBe('Aegon débarque.');
    expect(firstSentence('Une seule phrase')).toBe('Une seule phrase');
    expect(firstSentence('En 129 apr. C. le roi meurt. Ensuite.')).toBe('En 129 apr. C. le roi meurt.');
  });
});

describe('les données réelles', () => {
  const bounds = (id: string) => {
    const period = periods.find((item) => item.id === id);
    if (!period) throw new Error(id);
    return [period.from ?? -2000, period.to] as const;
  };

  it('culmine pendant la Danse et ne compte rien pendant la Chute', () => {
    const [from, to] = bounds('p5');
    const danse = peakIn(presence, from, to, VALYRIA);
    expect(danse.count).toBe(presence.peak);
    expect(danse.uncounted).toBe(false);
    const [f7, t7] = bounds('p7');
    expect(peakIn(presence, f7, t7, VALYRIA).count).toBe(0);
    expect(peakIn(presence, -2000, -102, VALYRIA).uncounted).toBe(true);
  });

  it('chaque période a des événements dont les lieux existent dans le fil du temps', () => {
    const ordered = chronology(events);
    expect(ordered).toHaveLength(events.length);
    for (let index = 1; index < ordered.length; index += 1) {
      expect((ordered[index]?.sortYear ?? 0) >= (ordered[index - 1]?.sortYear ?? 0)).toBe(true);
    }
  });
});

describe('le grand nombre', () => {
  const scale = createTimeScale({ domain: [105, 153], range: [0, 400] });
  const heights = solidHeights(presence, scale, 400, 360, presence.peak);

  it('mesure l’aplat colonne par colonne', () => {
    expect(heights).toHaveLength(400);
    expect(Math.max(...heights)).toBeCloseTo(360, 0);
  });

  it('s’évide dans le rouge quand il y tient, sinon s’écrit au-dessus du plus bas', () => {
    const tall = new Float32Array(300).fill(200);
    expect(placeNumber(tall, { width: 100, height: 80 })).toMatchObject({ hollow: true, scale: 1, left: 0, bottom: 60 });
    expect(placeNumber(tall, { width: 100, height: 80 }, { preferX: 250 }).left).toBe(200);
    const low = new Float32Array(300).fill(20);
    low.fill(5, 150, 300);
    expect(placeNumber(low, { width: 100, height: 80 })).toMatchObject({ hollow: false, left: 150, bottom: 15 });
  });

  it('se fait plus petit plutôt que de mentir sur la hauteur', () => {
    const mid = new Float32Array(300).fill(80);
    const placed = placeNumber(mid, { width: 100, height: 80 });
    expect(placed.hollow).toBe(true);
    expect(placed.scale).toBeLessThan(1);
  });
});
