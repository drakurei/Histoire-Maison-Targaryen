import { describe, expect, it } from 'vitest';

import { DRAGON_PARTS, buildDragon } from '../../core/dragons/geometry.ts';
import type { DragonPartName } from '../../core/dragons/geometry.ts';
import { dragonLayers, dragonSilhouette, layerCss, layerPath } from './layers.ts';
import type { DragonDetail, DragonGround, DragonKnown, DragonTone } from './layers.ts';

const COLORS = { body: '#1f1b1c', wing: '#2d2627', crest: '#131011', flame: '#b8281f' };
const GEOMETRY = buildDragon({ span: 1, neck: 0.5, tail: 0.62, horns: 3 });

const TONES: DragonTone[] = ['specimen', 'engraving'];
const GROUNDS: DragonGround[] = ['light', 'dark'];
const DETAILS: DragonDetail[] = ['fine', 'plain'];
const KNOWN: DragonKnown[] = [{}, { body: false }, { wing: false }, { crest: false }, { body: false, wing: false, crest: false, flame: false }];
const FINE: DragonPartName[] = ['wingHatchL', 'wingHatchR', 'bodyHatch', 'bodyMarks', 'headMarks'];

describe('dragonLayers', () => {
  it('donne des couches aux clés uniques, peintes et tracées, dans toutes les variantes', () => {
    for (const tone of TONES) {
      for (const ground of GROUNDS) {
        for (const known of KNOWN) {
          for (const detail of DETAILS) {
            const layers = dragonLayers(COLORS, tone, ground, known, detail);
            expect(new Set(layers.map((item) => item.key)).size).toBe(layers.length);
            for (const item of layers) {
              expect(layerPath(item, GEOMETRY.parts).startsWith('M')).toBe(true);
              expect(layerCss(item)).not.toMatch(/undefined|NaN/);
              for (const part of item.parts) expect(DRAGON_PARTS).toContain(part);
            }
          }
        }
      }
    }
  });

  it('peint la membrane sous les os et le corps au-dessus des ailes', () => {
    const keys = dragonLayers(COLORS).map((item) => item.key);
    expect(keys.indexOf('membrane')).toBeLessThan(keys.indexOf('hand'));
    expect(keys.indexOf('hand')).toBeLessThan(keys.indexOf('trunk'));
    expect(keys.indexOf('trunk')).toBeLessThan(keys.indexOf('head'));
  });

  it('retire les hachures et épaissit le trait en vignette', () => {
    for (const tone of TONES) {
      const fine = dragonLayers(COLORS, tone, 'light', {}, 'fine');
      const plain = dragonLayers(COLORS, tone, 'light', {}, 'plain');
      expect(plain.length).toBeLessThan(fine.length);
      for (const item of plain) {
        for (const part of FINE) expect(item.parts).not.toContain(part);
        const twin = fine.find((other) => other.key === item.key);
        if (twin && twin.strokeWidth > 0) expect(item.strokeWidth).toBeGreaterThan(twin.strokeWidth);
      }
    }
  });

  it('laisse au trait ce que les livres ne décrivent pas', () => {
    const bare = dragonLayers(COLORS, 'specimen', 'light', { body: false, wing: false, crest: false, flame: false });
    for (const item of bare) {
      expect(item.fill).not.toContain(COLORS.body);
      expect(item.fill).not.toContain(COLORS.wing);
      expect(item.stroke).not.toContain(COLORS.wing);
    }
    // Une crête non décrite prend le ton de la robe quand la robe, elle, est connue.
    const horns = dragonLayers(COLORS, 'specimen', 'light', { crest: false }).find((item) => item.key === 'horns');
    expect(horns?.fill).toContain(COLORS.body);
    expect(horns?.fill).not.toContain(COLORS.crest);
  });

  it('réduit l’ombre à une silhouette d’un seul tenant', () => {
    expect(dragonLayers(COLORS, 'shadow')).toEqual([dragonSilhouette]);
    expect(layerPath(dragonSilhouette, GEOMETRY.parts)).toContain(GEOMETRY.parts.wingMembraneL);
  });
});
