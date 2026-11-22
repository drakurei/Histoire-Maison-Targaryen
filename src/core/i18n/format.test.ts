import { describe, expect, it } from 'vitest';

import { uiByKey } from '@/core/content/ui';

import { EN_DASH, formatSpan, formatYear, NBSP, yearParts } from './format';
import { SUPPORT_LANGS } from './lang';

describe('formatYear', () => {
  it('écrit une année d’avant la Conquête', () => {
    expect(formatYear(-114, 'fr')).toBe(`114${NBSP}av.${NBSP}C.`);
    expect(formatYear(-114, 'en')).toBe(`114${NBSP}BC`);
  });

  it('écrit une année d’après la Conquête', () => {
    expect(formatYear(42, 'fr')).toBe(`42${NBSP}apr.${NBSP}C.`);
    expect(formatYear(42, 'en')).toBe(`42${NBSP}AC`);
  });

  it('n’insère aucun séparateur de milliers', () => {
    expect(formatYear(-4700, 'fr')).toBe(`4700${NBSP}av.${NBSP}C.`);
  });

  it('dit qu’une date est inconnue plutôt que d’en inventer une', () => {
    expect(formatYear(null, 'fr')).toBe('date inconnue');
    expect(formatYear(null, 'en')).toBe('date unknown');
    expect(formatYear(undefined, 'fr')).toBe('date inconnue');
  });

  it('lie le nombre à son sigle par une espace insécable', () => {
    expect(formatYear(129, 'fr')).not.toContain(' ');
    expect(formatYear(129, 'en')).not.toContain(' ');
  });

  it('n’invente pas de sigle valyrien : en hv, les sigles de l’œuvre originale', () => {
    expect(formatYear(-2, 'hv')).toBe(formatYear(-2, 'en'));
    expect(formatYear(null, 'hv')).toBe(formatYear(null, 'en'));
  });
});

describe('formatSpan', () => {
  it('ne répète pas le sigle dans une même ère', () => {
    expect(formatSpan(54, 56, 'fr')).toBe(`54${EN_DASH}56${NBSP}apr.${NBSP}C.`);
    expect(formatSpan(-950, -700, 'en')).toBe(`950${EN_DASH}700${NBSP}BC`);
  });

  it('écrit les deux sigles à cheval sur la Conquête', () => {
    expect(formatSpan(-2, 1, 'fr')).toBe(`2${NBSP}av.${NBSP}C.${NBSP}${EN_DASH} 1${NBSP}apr.${NBSP}C.`);
    expect(formatSpan(-2, 1, 'en')).toBe(`2${NBSP}BC${NBSP}${EN_DASH} 1${NBSP}AC`);
  });

  it('réduit un intervalle nul à son année', () => {
    expect(formatSpan(130, 130, 'fr')).toBe(formatYear(130, 'fr'));
  });

  it('dit ce qu’il sait quand une borne manque', () => {
    expect(formatSpan(null, -102, 'fr')).toBe(`jusqu’en 102${NBSP}av.${NBSP}C.`);
    expect(formatSpan(null, -102, 'en')).toBe(`until 102${NBSP}BC`);
    expect(formatSpan(42, null, 'fr')).toBe(`à partir de 42${NBSP}apr.${NBSP}C.`);
    expect(formatSpan(42, undefined, 'en')).toBe(`from 42${NBSP}AC`);
  });

  it('dit qu’un intervalle sans borne est inconnu', () => {
    expect(formatSpan(null, null, 'fr')).toBe('date inconnue');
    expect(formatSpan(undefined, undefined, 'en')).toBe('date unknown');
  });

  it('n’emploie jamais de tiret cadratin', () => {
    const emDash = '\u2014';
    expect(formatSpan(-2, 1, 'fr')).not.toContain(emDash);
    expect(formatSpan(54, 56, 'en')).not.toContain(emDash);
  });
});

describe('yearParts', () => {
  it('sépare le nombre de son sigle', () => {
    expect(yearParts(-114, 'fr')).toEqual({ value: '114', era: `av.${NBSP}C.` });
    expect(yearParts(42, 'en')).toEqual({ value: '42', era: 'AC' });
  });

  it('recompose exactement ce que formatYear écrit', () => {
    for (const year of [-4700, -1, 1, 283]) {
      const parts = yearParts(year, 'fr');
      expect(`${parts?.value}${NBSP}${parts?.era}`).toBe(formatYear(year, 'fr'));
    }
  });

  it('ne découpe pas une date inconnue', () => {
    expect(yearParts(null, 'fr')).toBeNull();
    expect(yearParts(undefined, 'en')).toBeNull();
  });
});

/*
 * Les sigles d'ère et la mention « date inconnue » figurent aussi parmi les chaînes
 * d'interface (era.bc, era.ac, label.unknownDate). Tant qu'elles y sont, les deux
 * écritures doivent s'accorder, à la nature des espaces près.
 */
describe('accord avec les chaînes d’interface', () => {
  const plain = (text: string | undefined): string | undefined => text?.replace(/\s/g, ' ');

  it.skipIf(!uiByKey.has('era.bc') || !uiByKey.has('era.ac'))('emploie les mêmes sigles d’ère', () => {
    for (const lang of SUPPORT_LANGS) {
      expect(plain(yearParts(-1, lang)?.era)).toBe(plain(uiByKey.get('era.bc')?.[lang]));
      expect(plain(yearParts(1, lang)?.era)).toBe(plain(uiByKey.get('era.ac')?.[lang]));
    }
  });

  it.skipIf(!uiByKey.has('label.unknownDate'))('dit « date inconnue » dans les mêmes termes', () => {
    for (const lang of SUPPORT_LANGS) {
      expect(plain(formatYear(null, lang))).toBe(plain(uiByKey.get('label.unknownDate')?.[lang]));
    }
  });
});
