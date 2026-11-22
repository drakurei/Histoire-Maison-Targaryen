import { describe, expect, it } from 'vitest';

import { dragons } from '@/core/content/dragons';
import { parentage, persons, unions } from '@/core/content/people';
import { places } from '@/core/content/places';
import { events } from '@/core/content/timeline';
import { wars } from '@/core/content/wars';

import { ageAt, placeYears, prepareRegistry, relationsOf, yearsBetween } from './relations';

const prepared = prepareRegistry({ persons, unions, parentage, dragons, events, wars, places });
const ids = (list: readonly { id: string }[]) => list.map((item) => item.id);

describe('relationsOf (D5) : les quatre rangées du cartel', () => {
  it('donne à Rhaenyra son père, son dragon et sa guerre', () => {
    const rows = relationsOf(prepared, 'person', 'rhaenyra');
    expect(ids(rows.blood)).toContain('viserys-i');
    expect(ids(rows.dragon)).toContain('syrax');
    expect(rows.war.length).toBeGreaterThan(0);
  });

  it('ne compte jamais une entité deux fois dans une rangée', () => {
    for (const kind of ['person', 'dragon', 'place'] as const) {
      const sample = kind === 'person' ? 'rhaenyra' : kind === 'dragon' ? 'vhagar' : 'port-real';
      const rows = relationsOf(prepared, kind, sample);
      for (const row of [rows.blood, rows.dragon, rows.war, rows.place]) {
        const keys = row.map((item) => `${item.kind}:${item.id}`);
        expect(new Set(keys).size).toBe(keys.length);
      }
    }
  });

  it('donne à Vhagar ses cavaliers', () => {
    expect(relationsOf(prepared, 'dragon', 'vhagar').blood.length).toBeGreaterThan(0);
  });

  it('rend des rangées vides pour une entité inconnue', () => {
    const rows = relationsOf(prepared, 'war', 'inconnue');
    expect([rows.blood, rows.dragon, rows.war, rows.place].every((row) => row.length === 0)).toBe(true);
  });
});

describe('placeYears', () => {
  it('donne les années de Port-Réal, croissantes et distinctes', () => {
    const years = placeYears(prepared, 'port-real');
    expect(years.length).toBeGreaterThan(2);
    expect([...years].sort((a, b) => a - b)).toEqual(years);
    expect(new Set(years).size).toBe(years.length);
  });
});

describe('ageAt (D11)', () => {
  const rhaenyra = persons.find((person) => person.id === 'rhaenyra');

  it('compte sans an 0', () => {
    expect(yearsBetween(-2, 1)).toBe(2);
    expect(yearsBetween(97, 129)).toBe(32);
  });

  it('donne un âge, une mort passée, une naissance à venir', () => {
    if (!rhaenyra) throw new Error('Rhaenyra absente du registre');
    expect(ageAt(rhaenyra, 129)).toMatchObject({ state: 'alive' });
    expect(ageAt(rhaenyra, 200)).toMatchObject({ state: 'dead' });
    expect(ageAt(rhaenyra, 50)).toEqual({ state: 'unborn' });
  });
});
