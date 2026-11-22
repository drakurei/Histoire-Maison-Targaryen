import { describe, expect, it } from 'vitest';

import type { Localized, UiString } from '@/core/content/types';

import {
  createMissingKeyReporter,
  interpolate,
  missingKeyText,
  resolveText,
  resolveTitle,
  resolveUi,
} from './resolve';

const dragons: UiString = {
  key: 'nav.dragons',
  hv: 'Zaldrīzesse',
  fr: 'Dragons',
  en: 'Dragons',
  status: 'atteste',
  note: 'Nominatif pluriel de zaldrīzes.',
};

const reload: UiString = { key: 'action.reload', fr: 'Recharger la page', en: 'Reload the page' };

// « jēda » (année) est attesté ; la chaîne ne sert qu'à éprouver l'interpolation.
const yearLabel: UiString = {
  key: 'label.yearOf',
  hv: 'Jēda {year}',
  fr: 'An {year}',
  en: 'Year {year}',
};

describe('interpolate', () => {
  it('remplace les variables nommées', () => {
    expect(interpolate('{n} dragons sur {total}', { n: 3, total: 28 })).toBe('3 dragons sur 28');
  });

  it('remplace chaque occurrence', () => {
    expect(interpolate('{a}, {a}', { a: 'x' })).toBe('x, x');
  });

  it('laisse visible une variable sans valeur', () => {
    expect(interpolate('Règne de {name}', {})).toBe('Règne de {name}');
    expect(interpolate('Règne de {name}')).toBe('Règne de {name}');
  });

  it('ne lit pas les propriétés héritées', () => {
    expect(interpolate('{constructor} {toString}', {})).toBe('{constructor} {toString}');
  });

  it('accepte zéro comme valeur', () => {
    expect(interpolate('{n} dragons', { n: 0 })).toBe('0 dragons');
  });
});

describe('resolveUi', () => {
  it('donne la forme valyrienne et sa glose en mode hv', () => {
    expect(resolveUi(dragons, dragons.key, 'hv', 'fr')).toEqual({
      primary: 'Zaldrīzesse',
      gloss: 'Dragons',
      status: 'atteste',
      note: 'Nominatif pluriel de zaldrīzes.',
      isHv: true,
    });
  });

  it('glose dans la langue d’appui', () => {
    const french = { ...dragons, fr: 'Les dragons' };
    expect(resolveUi(french, french.key, 'hv', 'fr').gloss).toBe('Les dragons');
    expect(resolveUi(french, french.key, 'hv', 'en').gloss).toBe('Dragons');
  });

  it('donne la langue d’appui seule quand aucune forme valyrienne n’existe', () => {
    expect(resolveUi(reload, reload.key, 'hv', 'fr')).toEqual({ primary: 'Recharger la page', isHv: false });
    expect(resolveUi(reload, reload.key, 'hv', 'en')).toEqual({ primary: 'Reload the page', isHv: false });
  });

  it('donne la langue d’affichage seule en français et en anglais', () => {
    expect(resolveUi(dragons, dragons.key, 'fr', 'en')).toEqual({ primary: 'Dragons', isHv: false });
    expect(resolveUi(reload, reload.key, 'en', 'fr')).toEqual({ primary: 'Reload the page', isHv: false });
  });

  it('interpole la première ligne et la glose', () => {
    expect(resolveUi(yearLabel, yearLabel.key, 'hv', 'fr', { year: 42 })).toMatchObject({
      primary: 'Jēda 42',
      gloss: 'An 42',
    });
    expect(resolveUi(yearLabel, yearLabel.key, 'en', 'fr', { year: 42 }).primary).toBe('Year 42');
  });

  it('rend la clé entre crochets quand elle est absente', () => {
    expect(resolveUi(undefined, 'nav.inconnue', 'hv', 'fr')).toEqual({ primary: '[nav.inconnue]', isHv: false });
    expect(missingKeyText('a.b')).toBe('[a.b]');
  });
});

describe('resolveTitle, resolveText', () => {
  const motto: Localized = { hv: 'Valar morghūlis', fr: 'Tout homme doit mourir', en: 'All men must die' };
  const plain: Localized = { fr: 'Les sources', en: 'The sources' };

  it('met le titre valyrien en première ligne en mode hv', () => {
    expect(resolveTitle(motto, 'hv', 'en')).toEqual({
      primary: 'Valar morghūlis',
      gloss: 'All men must die',
      isHv: true,
    });
  });

  it('retombe sur la langue lue sans forme valyrienne ou hors du mode hv', () => {
    expect(resolveTitle(plain, 'hv', 'fr')).toEqual({ primary: 'Les sources', isHv: false });
    expect(resolveTitle(motto, 'fr', 'en')).toEqual({ primary: 'Tout homme doit mourir', isHv: false });
  });

  it('donne le récit dans la langue lue, jamais en valyrien', () => {
    expect(resolveText(motto, 'fr')).toBe('Tout homme doit mourir');
    expect(resolveText(motto, 'en')).toBe('All men must die');
  });

  it('rend une chaîne vide pour un champ absent', () => {
    expect(resolveText(undefined, 'fr')).toBe('');
    expect(resolveText(null, 'en')).toBe('');
  });
});

describe('createMissingKeyReporter', () => {
  it('n’avertit qu’une fois par clé', () => {
    const messages: string[] = [];
    const report = createMissingKeyReporter((message) => messages.push(message));

    report('nav.inconnue');
    report('nav.inconnue');
    report('action.inconnue');

    expect(messages).toHaveLength(2);
    expect(messages[0]).toContain('nav.inconnue');
    expect(messages[1]).toContain('action.inconnue');
  });
});
