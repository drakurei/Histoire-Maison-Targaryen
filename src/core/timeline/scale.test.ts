import { describe, expect, it } from 'vitest';

import {
  DEFAULT_WARP,
  clampYear,
  createTimeScale,
  paceAt,
  snapYear,
  timeTicks,
  timeZones,
  xToYear,
  yearExtent,
  yearToX,
} from './scale.ts';
import type { TimeScale, TimeTick } from './scale.ts';

/** Le domaine entier de la chronique sur un ruban de 1200 unités. */
const FULL = createTimeScale({ domain: [-8000, 300], range: [0, 1200] });
const YEARS = [-8000, -4700, -1436, -1000, -300, -250, -114.5, -114, -113.5, -102, -2, 0.5, 1, 1.5, 37, 129, 283, 300];

const width = (scale: TimeScale, from: number, to: number): number => yearToX(scale, to) - yearToX(scale, from);
const gaps = (ticks: readonly TimeTick[]): number[] => ticks.slice(1).map((tick, i) => Math.abs(tick.x - (ticks[i]?.x ?? 0)));

describe('createTimeScale', () => {
  it('pose les bornes du domaine sur les bornes de l’étendue', () => {
    expect(yearToX(FULL, -8000)).toBeCloseTo(0, 9);
    expect(yearToX(FULL, 300)).toBeCloseTo(1200, 9);
  });

  it('remet un domaine inversé dans l’ordre et élargit un domaine réduit à une année', () => {
    expect(createTimeScale({ domain: [300, -114], range: [0, 100] }).domain).toEqual([-114, 300]);
    const single = createTimeScale({ domain: [129, 129], range: [0, 100] });
    expect(single.domain).toEqual([128, 130]);
    expect(yearToX(single, 129)).toBeCloseTo(50, 9);
  });

  it('refuse un domaine, une étendue ou une déformation qui ne veulent rien dire', () => {
    expect(() => createTimeScale({ domain: [Number.NaN, 300], range: [0, 100] })).toThrow(RangeError);
    expect(() => createTimeScale({ domain: [0, 300], range: [0, Number.POSITIVE_INFINITY] })).toThrow(RangeError);
    expect(() => createTimeScale({ domain: [0, 300], range: [0, 100], warp: { approachPace: 0 } })).toThrow(RangeError);
    expect(() => createTimeScale({ domain: [0, 300], range: [0, 100], warp: { pivot: 5 } })).toThrow(RangeError);
  });

  it('rend une échelle gelée', () => {
    expect(Object.isFrozen(FULL)).toBe(true);
    expect(Object.isFrozen(FULL.warp)).toBe(true);
    expect(FULL.warp).toEqual(DEFAULT_WARP);
  });
});

describe('yearToX', () => {
  it('avance toujours avec le temps', () => {
    const xs = YEARS.map((year) => yearToX(FULL, year));
    for (let i = 1; i < xs.length; i += 1) expect(xs[i]).toBeGreaterThan(xs[i - 1] ?? Number.POSITIVE_INFINITY);
  });

  it('compresse le temps légendaire et dilate la dynastie', () => {
    // 7886 années de légende tiennent dans moins de place que 299 années de dynastie.
    expect(width(FULL, -8000, -114)).toBeLessThan(width(FULL, 1, 300) / 2);
    expect(width(FULL, 1, 300) / 1200).toBeGreaterThan(0.6);
    expect(width(FULL, -8000, -114) / 1200).toBeLessThan(0.25);
    // Un siècle de la dynastie est deux fois plus long qu'un siècle de l'approche…
    expect(width(FULL, 100, 200)).toBeCloseTo(2 * width(FULL, -110, -10), 9);
    // … et chaque siècle légendaire est plus court que celui qui le suit.
    expect(width(FULL, -400, -300)).toBeLessThan(width(FULL, -300, -200));
    expect(width(FULL, -5000, -4900)).toBeLessThan(width(FULL, -1000, -900));
  });

  it('se raccorde sans saut ni cassure à 114 av. C., et sans saut à 1 apr. C.', () => {
    const near = 1e-6;
    expect(yearToX(FULL, -114 - near)).toBeCloseTo(yearToX(FULL, -114 + near), 4);
    expect(yearToX(FULL, 1 - near)).toBeCloseTo(yearToX(FULL, 1 + near), 4);
    expect(paceAt(FULL, -114 - near)).toBeCloseTo(paceAt(FULL, -114 + near), 4);
    expect(paceAt(FULL, 1 + near)).toBeCloseTo(2 * paceAt(FULL, 1 - near), 9);
  });

  it('est régulière à l’intérieur de la dynastie', () => {
    const period = createTimeScale({ domain: [105, 153], range: [0, 960] });
    expect(yearToX(period, 129)).toBeCloseTo(480, 9);
    expect(paceAt(period, 110)).toBeCloseTo(20, 9);
  });

  it('accepte une étendue décroissante', () => {
    const mirrored = createTimeScale({ domain: [-8000, 300], range: [1200, 0] });
    for (const year of YEARS) expect(yearToX(mirrored, year)).toBeCloseTo(1200 - yearToX(FULL, year), 9);
    expect(paceAt(mirrored, 50)).toBeCloseTo(paceAt(FULL, 50), 9);
  });
});

describe('xToYear', () => {
  it('est la réciproque de yearToX dans les trois zones', () => {
    for (const year of YEARS) expect(xToYear(FULL, yearToX(FULL, year))).toBeCloseTo(year, 6);
  });

  it('reste réciproque hors du domaine', () => {
    for (const year of [-12000, -9000, 301, 450]) expect(xToYear(FULL, yearToX(FULL, year))).toBeCloseTo(year, 5);
    for (const x of [-50, 0, 137.5, 274, 400, 1199, 1300]) expect(yearToX(FULL, xToYear(FULL, x))).toBeCloseTo(x, 6);
  });

  it('rend le début du domaine quand l’étendue est nulle', () => {
    const flat = createTimeScale({ domain: [-114, 300], range: [40, 40] });
    expect(yearToX(flat, 129)).toBe(40);
    expect(xToYear(flat, 40)).toBe(-114);
  });

  it('respecte une déformation sur mesure', () => {
    const custom = createTimeScale({ domain: [-2000, 300], range: [0, 1000], warp: { approachPace: 0.25, legendSpan: 200 } });
    for (const year of [-2000, -640, -114, -57, 1, 150, 300]) expect(xToYear(custom, yearToX(custom, year))).toBeCloseTo(year, 6);
    expect(width(custom, 100, 200)).toBeCloseTo(4 * width(custom, -110, -10), 9);
  });
});

describe('clampYear, snapYear, yearExtent', () => {
  it('ramène une année dans le domaine', () => {
    expect(clampYear(FULL, 412)).toBe(300);
    expect(clampYear(FULL, -9000)).toBe(-8000);
    expect(clampYear(FULL, 129)).toBe(129);
  });

  it('arrondit à une année qui existe : pas d’an 0', () => {
    expect(snapYear(128.6)).toBe(129);
    expect(snapYear(-113.5)).toBe(-113);
    expect(snapYear(0.4)).toBe(1);
    expect(snapYear(0)).toBe(1);
    expect(snapYear(-0.4)).toBe(-1);
  });

  it('donne l’étendue des années connues', () => {
    expect(yearExtent([129, null, -114, undefined, 300])).toEqual([-114, 300]);
    expect(yearExtent([null, undefined])).toBeNull();
    expect(yearExtent([])).toBeNull();
  });
});

describe('timeZones', () => {
  it('découpe le domaine entier en trois zones contiguës', () => {
    const zones = timeZones(FULL);
    expect(zones.map((zone) => zone.id)).toEqual(['legend', 'approach', 'dynasty']);
    expect(zones.map((zone) => [zone.from, zone.to])).toEqual([
      [-8000, -114],
      [-114, 1],
      [1, 300],
    ]);
    expect(zones[0]?.x1).toBeCloseTo(zones[1]?.x0 ?? Number.NaN, 9);
    expect(zones[1]?.x1).toBeCloseTo(zones[2]?.x0 ?? Number.NaN, 9);
  });

  it('ne rend que les zones présentes dans le domaine', () => {
    expect(timeZones(createTimeScale({ domain: [105, 153], range: [0, 100] })).map((zone) => zone.id)).toEqual(['dynasty']);
    expect(timeZones(createTimeScale({ domain: [-300, -114], range: [0, 100] })).map((zone) => zone.id)).toEqual(['legend']);
    expect(timeZones(createTimeScale({ domain: [-50, 50], range: [0, 100] })).map((zone) => zone.id)).toEqual(['approach', 'dynasty']);
  });
});

describe('timeTicks', () => {
  it('gradue le ruban entier avec des années rondes, charnières comprises', () => {
    const ticks = timeTicks(FULL, { minGap: 64 });
    expect(ticks.map((tick) => tick.year)).toEqual([-5000, -1000, -300, -114, -50, 1, 50, 100, 150, 200, 250, 300]);
    expect(ticks.filter((tick) => tick.anchor).map((tick) => tick.year)).toEqual([-114, 1]);
  });

  it('ne serre jamais deux graduations en deçà de l’écart demandé', () => {
    const widths = [320, 760, 1200, 2400];
    for (const length of widths) {
      for (const minGap of [24, 40, 64, 96]) {
        const scale = createTimeScale({ domain: [-8000, 300], range: [0, length] });
        for (const gap of gaps(timeTicks(scale, { minGap }))) expect(gap).toBeGreaterThanOrEqual(minGap - 1e-6);
      }
    }
  });

  it('rend les graduations triées, sans doublon, à leur abscisse', () => {
    const ticks = timeTicks(FULL, { minGap: 30 });
    const years = ticks.map((tick) => tick.year);
    expect(years).toEqual([...new Set(years)].sort((a, b) => a - b));
    for (const tick of ticks) expect(tick.x).toBeCloseTo(yearToX(FULL, tick.year), 9);
  });

  it('ne gradue jamais l’an 0 : la Conquête est marquée à 1 apr. C.', () => {
    for (const minGap of [1, 8, 30, 64]) {
      const years = timeTicks(createTimeScale({ domain: [-60, 60], range: [0, 1200] }), { minGap }).map((tick) => tick.year);
      expect(years).not.toContain(0);
      expect(years).toContain(1);
    }
  });

  it('adapte le pas à la place : régulier dans les zones d’allure constante', () => {
    const period = createTimeScale({ domain: [105, 153], range: [0, 900] });
    expect(timeTicks(period).map((tick) => tick.year)).toEqual([105, 110, 115, 120, 125, 130, 135, 140, 145, 150]);
    expect(timeTicks(period, { minGap: 150 }).map((tick) => tick.year)).toEqual([110, 120, 130, 140, 150]);
  });

  it('sur un ruban étroit, garde la Conquête et laisse tomber 114 av. C. plutôt que de les serrer', () => {
    const narrow = createTimeScale({ domain: [-8000, 300], range: [0, 360] });
    const ticks = timeTicks(narrow, { minGap: 56 });
    expect(ticks.map((tick) => tick.year)).toEqual([-5000, 1, 100, 200, 300]);
    expect(ticks.filter((tick) => tick.anchor).map((tick) => tick.year)).toEqual([1]);
    expect(Math.abs(yearToX(narrow, 1) - yearToX(narrow, -114))).toBeLessThan(56);
  });

  it('ne propose dans le temps légendaire que des années dont la rondeur se voit', () => {
    // Écart de 40 : rien ne tient entre 1000 et 5000 av. C. ; on laisse le vide plutôt que d'y graduer « 2100 av. C. ».
    expect(timeTicks(FULL, { minGap: 40 }).map((tick) => tick.year)).toEqual([-5000, -1000, -500, -200, -114, -50, 1, 50, 100, 150, 200, 250, 300]);
    for (const minGap of [8, 24, 40, 64]) {
      const legend = timeTicks(FULL, { minGap }).filter((tick) => tick.zone === 'legend');
      expect(legend.length).toBeGreaterThan(0);
      // Le pas dont l'année est multiple mesure, là où elle est, au moins le quart de l'écart demandé.
      for (const tick of legend) expect(tick.step * paceAt(FULL, tick.year)).toBeGreaterThanOrEqual(minGap / 4);
    }
  });

  it('dit la zone et la rondeur de chaque graduation', () => {
    const byYear = new Map(timeTicks(FULL, { minGap: 64 }).map((tick) => [tick.year, tick]));
    expect(byYear.get(-5000)).toMatchObject({ zone: 'legend', anchor: false, step: 5000 });
    expect(byYear.get(-114)).toMatchObject({ zone: 'approach', anchor: true, step: 1 });
    expect(byYear.get(-50)).toMatchObject({ zone: 'approach', anchor: false, step: 50 });
    expect(byYear.get(1)).toMatchObject({ zone: 'dynasty', anchor: true, step: 1 });
    expect(byYear.get(100)).toMatchObject({ zone: 'dynasty', step: 100 });
    expect(byYear.get(150)).toMatchObject({ zone: 'dynasty', step: 50 });
  });

  it('reste bornée quand on demande un écart nul, et vide quand l’étendue est nulle', () => {
    expect(timeTicks(FULL, { minGap: 0 }).length).toBeLessThanOrEqual(501);
    expect(timeTicks(createTimeScale({ domain: [-114, 300], range: [10, 10] }))).toEqual([]);
  });
});
