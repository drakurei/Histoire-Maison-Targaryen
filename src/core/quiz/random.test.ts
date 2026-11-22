import { describe, expect, it } from 'vitest';

import { createRandom, nextSeed, shuffled, toSeed } from './random.ts';

const draw = (seed: number, count: number): number[] => {
  const random = createRandom(seed);
  return Array.from({ length: count }, () => random());
};

describe('toSeed', () => {
  it('ramène un nombre à un entier sur 32 bits', () => {
    expect(toSeed(1)).toBe(1);
    expect(toSeed(42.9)).toBe(42);
    expect(toSeed(-1)).toBe(4294967295);
    expect(toSeed(2 ** 32 + 7)).toBe(7);
    expect(toSeed(Number.NaN)).toBe(0);
    expect(toSeed(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('tire d’un texte une graine stable et différente d’un texte à l’autre', () => {
    expect(toSeed('danse-des-dragons')).toBe(toSeed('danse-des-dragons'));
    expect(toSeed('danse-des-dragons')).not.toBe(toSeed('danse-des-dragon'));
    expect(toSeed('')).toBe(0x811c9dc5);
    // Valeur de référence de FNV-1a 32 bits pour « a ».
    expect(toSeed('a')).toBe(0xe40c292c);
    expect(Number.isInteger(toSeed('p5'))).toBe(true);
  });
});

describe('nextSeed', () => {
  it('donne une autre graine, toujours la même pour une même graine', () => {
    expect(nextSeed(1)).toBe(nextSeed(1));
    expect(nextSeed(1)).not.toBe(1);
    expect(nextSeed(1)).not.toBe(nextSeed(2));
    expect(new Set([1, nextSeed(1), nextSeed(nextSeed(1)), nextSeed(nextSeed(nextSeed(1)))]).size).toBe(4);
  });
});

describe('createRandom', () => {
  it('redonne la même suite pour la même graine', () => {
    expect(draw(7, 20)).toEqual(draw(7, 20));
    expect(draw(7, 20)).not.toEqual(draw(8, 20));
  });

  it('tire dans [0, 1[', () => {
    for (const value of draw(123456, 2000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('se répartit sans biais grossier', () => {
    const values = draw(2026, 4000);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(mean).toBeGreaterThan(0.47);
    expect(mean).toBeLessThan(0.53);
    const low = values.filter((value) => value < 0.25).length / values.length;
    expect(low).toBeGreaterThan(0.22);
    expect(low).toBeLessThan(0.28);
  });

  it('garde deux générateurs indépendants l’un de l’autre', () => {
    const a = createRandom(5);
    const b = createRandom(5);
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
  });
});

describe('shuffled', () => {
  const ITEMS = ['balerion', 'vhagar', 'meraxes', 'caraxes', 'syrax', 'sunfyre', 'vermax', 'arrax'];

  it('rend une permutation sans toucher au tableau reçu', () => {
    const copy = [...ITEMS];
    const mixed = shuffled(ITEMS, createRandom(3));
    expect(ITEMS).toEqual(copy);
    expect(mixed).not.toBe(ITEMS);
    expect([...mixed].sort()).toEqual([...ITEMS].sort());
  });

  it('donne le même ordre pour la même graine, un autre pour une autre', () => {
    expect(shuffled(ITEMS, createRandom(3))).toEqual(shuffled(ITEMS, createRandom(3)));
    expect(shuffled(ITEMS, createRandom(3))).not.toEqual(shuffled(ITEMS, createRandom(4)));
  });

  it('change vraiment l’ordre', () => {
    const moved = [1, 2, 3, 4, 5].filter((seed) => shuffled(ITEMS, createRandom(seed)).join() !== ITEMS.join());
    expect(moved.length).toBeGreaterThanOrEqual(4);
  });

  it('place chaque élément à chaque rang à peu près aussi souvent', () => {
    const firsts = new Map<string, number>();
    for (let seed = 1; seed <= 1600; seed += 1) {
      const first = shuffled(ITEMS, createRandom(seed))[0] ?? '';
      firsts.set(first, (firsts.get(first) ?? 0) + 1);
    }
    expect(firsts.size).toBe(ITEMS.length);
    // 200 attendus par élément ; l'écart toléré est large, il ne s'agit que d'écarter un mélange truqué.
    for (const count of firsts.values()) {
      expect(count).toBeGreaterThan(140);
      expect(count).toBeLessThan(260);
    }
  });

  it('accepte un tableau vide ou d’un seul élément', () => {
    expect(shuffled([], createRandom(1))).toEqual([]);
    expect(shuffled(['seul'], createRandom(1))).toEqual(['seul']);
  });
});
