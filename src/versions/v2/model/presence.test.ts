import { describe, expect, it } from 'vitest';

import { dragons } from '@/core/content/dragons';
import { sovereigns } from '@/core/content/people';
import { events, periods } from '@/core/content/timeline';
import { battles } from '@/core/content/wars';

import {
  datedYears,
  dragonPresence,
  nearestDated,
  parseYearQuery,
  periodsAt,
  presenceAt,
  reignsAt,
  stepYear,
} from './presence';

const presence = dragonPresence(dragons, events, battles, -2000, 300);
const at = (year: number) => presenceAt(presence, year);

describe('dragonPresence (D1) : la fasce ne ment pas', () => {
  it('n’a pas d’an 0 et retrouve chaque année par son entrée', () => {
    expect(presence.years.some((entry) => entry.year === 0)).toBe(false);
    for (const year of [-2000, -114, -1, 1, 129, 300]) expect(at(year)?.year).toBe(year);
  });

  it('culmine pendant la Danse', () => {
    const peakYears = presence.years.filter((entry) => entry.attested.length === presence.peak).map((entry) => entry.year);
    expect(peakYears.some((year) => year >= 129 && year <= 131)).toBe(true);
  });

  it('tient le dernier dragon des Targaryen pour mort en 153', () => {
    expect(presence.extinction).toBe(153);
  });

  it('ne montre aucun dragon, ni plein ni hachuré, de 154 à 298', () => {
    for (let year = 154; year <= 298; year += 1) {
      expect(at(year)?.attested).toEqual([]);
      expect(at(year)?.doubtful).toEqual([]);
    }
  });

  it('passe Vif-Argent en sort inconnu après sa dernière mention', () => {
    expect(at(131)?.attested).toContain('silverwing');
    expect(at(140)?.attested).not.toContain('silverwing');
    expect(at(140)?.doubtful).toContain('silverwing');
  });

  it('compte trois dragons après les éclosions de la fin du récit', () => {
    expect(at(300)?.attested.length).toBe(3);
  });

  it('compte Balerion avant la Conquête', () => {
    expect(at(-50)?.attested).toContain('balerion');
  });
});

describe('crans d’année (D3)', () => {
  const years = datedYears(events);

  it('donne des années distinctes, croissantes, sans an 0', () => {
    expect(years.length).toBeGreaterThan(40);
    expect([...years].sort((a, b) => a - b)).toEqual(years);
    expect(new Set(years).size).toBe(years.length);
    expect(years).not.toContain(0);
  });

  it('saute d’un cran au suivant et au précédent', () => {
    const middle = years[10] ?? 0;
    expect(stepYear(years, middle, 1)).toBe(years[11]);
    expect(stepYear(years, middle, -1)).toBe(years[9]);
  });

  it('part du premier ou du dernier cran sans année réglée, et s’arrête au bout', () => {
    expect(stepYear(years, null, 1)).toBe(years[0]);
    expect(stepYear(years, null, -1)).toBe(years[years.length - 1]);
    expect(stepYear(years, years[years.length - 1] ?? 0, 1)).toBeNull();
  });

  it('aimante une année proche d’un cran', () => {
    expect(nearestDated([100, 130], 128, 3)).toBe(130);
    expect(nearestDated([100, 130], 115, 3)).toBeNull();
  });
});

describe('règnes et périodes à l’année', () => {
  const ids = (year: number) => reignsAt(sovereigns, year).map((sovereign) => sovereign.id);

  it('donne l’année d’une succession au nouveau règne', () => {
    expect(ids(103)).toEqual(['viserys-i']);
    expect(ids(129).sort()).toEqual(['aegon-ii', 'rhaenyra']);
    expect(ids(131)).toEqual(['aegon-iii']);
  });

  it('garde Rhaenyra en 130, l’année de sa mort, que personne ne reprend', () => {
    expect(ids(130).sort()).toEqual(['aegon-ii', 'rhaenyra']);
  });

  it('laisse sa dernière année au dernier roi', () => {
    expect(ids(283)).toEqual(['aerys-ii']);
    expect(ids(290)).toEqual([]);
    expect(ids(-10)).toEqual([]);
  });

  it('trouve les périodes qui se chevauchent', () => {
    expect(periodsAt(periods, 120, -2000).map((period) => period.id)).toEqual(['p4', 'p5']);
    expect(periodsAt(periods, -500, -2000).map((period) => period.id)).toEqual(['p1']);
  });
});

describe('parseYearQuery (D4)', () => {
  it.each([
    ['129', 129],
    ['an 129', 129],
    ['130 apr', 130],
    ['130 apr. C.', 130],
    ['-114', -114],
    ['114 av', -114],
    ['114 av. C.', -114],
    ['114 BC', -114],
    ['42 AC', 42],
  ])('lit « %s »', (query, year) => {
    expect(parseYearQuery(query)).toBe(year);
  });

  it.each(['0', 'Aegon', '129 dragons', '-114 av', ''])('refuse « %s »', (query) => {
    expect(parseYearQuery(query)).toBeNull();
  });
});
