import { describe, expect, it } from 'vitest';

import type { HistoricalEvent, LearningPath, Period } from '@/core/content/types';

import { lienGenre, pathCover } from './parcours';

const period = (id: string, from: number, to: number) => ({ id, from, to }) as unknown as Period;
const event = (id: string, periodId: string, year: number | null) => ({ id, periodId, year }) as unknown as HistoricalEvent;

const data = {
  periods: [period('p1', -2000, -102), period('p4', 1, 129), period('p5', 105, 153)],
  getEvent: (id: string) => [event('p5-gosier', 'p5', 130), event('p4-sans-date', 'p4', null)].find((item) => item.id === id),
  bounds: (item: Period) => [item.from ?? -2000, item.to] as const,
};

describe('pathCover', () => {
  it('réunit les périodes ouvertes et celles des événements cités', () => {
    const path = {
      steps: [
        { links: [{ to: '/chroniques/p4' }, { to: '/personnages/rhaenyra' }] },
        { links: [{ to: '/chroniques/p5/p5-gosier' }, { to: '/chroniques/p4/p4-sans-date' }] },
      ],
    } as unknown as LearningPath;
    const cover = pathCover(path, data);
    expect(cover.periods.map((item) => item.id)).toEqual(['p4', 'p5']);
    expect(cover.years).toEqual([130]);
    expect(cover.span).toEqual([1, 153]);
  });

  it('ne donne aucune durée sans lien vers la chronique', () => {
    const path = { steps: [{ links: [{ to: '/dragons/balerion' }] }] } as unknown as LearningPath;
    expect(pathCover(path, data).span).toBeNull();
  });
});

describe('lienGenre', () => {
  it('reconnaît les entités et les vues', () => {
    expect(lienGenre('/personnages/aegon-i')).toEqual({ kind: 'person', id: 'aegon-i' });
    expect(lienGenre('/guerres/danse-des-dragons#baie-des-naufrageurs')).toEqual({
      kind: 'battle',
      id: 'baie-des-naufrageurs',
      warId: 'danse-des-dragons',
    });
    expect(lienGenre('/chroniques/p5/p5-gosier')).toEqual({ kind: 'event', id: 'p5-gosier' });
    expect(lienGenre('/lignee?p=aenar')).toEqual({ kind: 'page', to: '/lignee?p=aenar' });
    expect(lienGenre('/chroniques/p1')).toEqual({ kind: 'page', to: '/chroniques/p1' });
  });
});
