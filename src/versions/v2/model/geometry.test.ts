import { describe, expect, it } from 'vitest';

import { createTimeScale } from '@/core/timeline';

import { extentLanes, nextYear, spreadTargets, stepArea, yearEdges } from './geometry';

const scale = createTimeScale({ domain: [1, 11], range: [0, 100] });

describe('stepArea', () => {
  it('trace une marche par valeur, années égales fusionnées, posée sur la base', () => {
    const d = stepArea(
      [
        { year: 1, value: 1 },
        { year: 2, value: 1 },
        { year: 3, value: 2 },
      ],
      scale,
      (value) => 10 - value,
      10,
    );
    expect(d).toBe('M0 10V9H20V8H30V10Z');
  });

  it('coupe l’aire là où la valeur tombe à zéro', () => {
    const d = stepArea(
      [
        { year: 1, value: 1 },
        { year: 2, value: 0 },
        { year: 3, value: 1 },
      ],
      scale,
      (value) => 10 - value,
      10,
    );
    expect(d).toBe('M0 10V9H10V10ZM20 10V9H30V10Z');
  });

  it('rend une chaîne vide quand tout est nul', () => {
    expect(stepArea([{ year: 1, value: 0 }], scale, () => 0, 10)).toBe('');
  });
});

describe('années', () => {
  it('saute l’an 0', () => {
    expect(nextYear(-1)).toBe(1);
    expect(nextYear(5)).toBe(6);
  });

  it('donne à une année toute sa largeur', () => {
    expect(yearEdges(scale, 1)).toEqual([0, 10]);
  });
});

describe('extentLanes', () => {
  it('met dans un second couloir ce qui chevauche, et laisse partager ce qui se touche', () => {
    const lanes = extentLanes([
      { id: 'a', from: 1, to: 129 },
      { id: 'b', from: 105, to: 153 },
      { id: 'c', from: 153, to: 200 },
    ]);
    expect(lanes.get('a')).toBe(0);
    expect(lanes.get('b')).toBe(1);
    expect(lanes.get('c')).toBe(0);
  });
});

describe('spreadTargets', () => {
  it('laisse en place des cibles qui ne se gênent pas', () => {
    const placed = spreadTargets(
      [
        { id: 'a', center: 50, width: 20 },
        { id: 'b', center: 150, width: 20 },
      ],
      0,
      200,
    );
    expect(placed.get('a')).toBe(40);
    expect(placed.get('b')).toBe(140);
  });

  it('écarte deux cibles qui se recouvrent autour de leur centre commun', () => {
    const placed = spreadTargets(
      [
        { id: 'a', center: 100, width: 40 },
        { id: 'b', center: 100, width: 40 },
      ],
      0,
      300,
    );
    expect(placed.get('a')).toBe(60);
    expect(placed.get('b')).toBe(100);
  });

  it('garde les cibles entre les bornes', () => {
    const placed = spreadTargets(
      [
        { id: 'a', center: 0, width: 40 },
        { id: 'b', center: 200, width: 40 },
      ],
      0,
      200,
    );
    expect(placed.get('a')).toBe(0);
    expect(placed.get('b')).toBe(160);
  });
});
