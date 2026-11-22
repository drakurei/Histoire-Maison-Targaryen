import { describe, expect, it } from 'vitest';

import { dragons } from '@/core/content/dragons';
import { events } from '@/core/content/timeline';

import { dragonCurve, stepPath } from './curveData';

const curve = dragonCurve(dragons, events, -114, 300);
const at = (year: number) => curve.points.find((point) => point.year === year);

describe('courbe des dragons vivants', () => {
  it('culmine pendant la Danse', () => {
    expect(curve.peak.year).toBeGreaterThanOrEqual(129);
    expect(curve.peak.year).toBeLessThanOrEqual(131);
  });

  it('tient la dernière mort datée pour la fin des dragons des Targaryen', () => {
    expect(curve.extinction).toBe(153);
    expect(at(154)?.count).toBe(0);
    expect(at(154)?.doubt).toBe(0);
    expect(at(200)?.count).toBe(0);
  });

  it('ne fait pas voler jusqu’en 298 les dragons à la fin inconnue', () => {
    expect(at(297)?.ids).toEqual([]);
    expect(at(140)?.doubtIds).toContain('silverwing');
    expect(at(140)?.ids).not.toContain('silverwing');
  });

  it('compte les dragons à leur dernière mention dans les annales', () => {
    expect(at(131)?.ids).toEqual(expect.arrayContaining(['silverwing', 'sheepstealer', 'morning']));
  });

  it('retrouve les dragons nés à la fin du récit', () => {
    expect(curve.revival).not.toBeNull();
    expect(at(300)?.count).toBe(3);
  });

  it('n’a pas d’an 0', () => {
    expect(at(0)).toBeUndefined();
  });
});

describe('stepPath', () => {
  it('trace des marches horizontales puis verticales', () => {
    const d = stepPath(
      [
        { year: 1, value: 1 },
        { year: 2, value: 2 },
      ],
      (year) => year * 10,
      (value) => 100 - value * 10,
      30,
    );
    expect(d).toBe('M10.0 90.0H20.0V80.0H30.0');
  });
});
