import { describe, expect, it } from 'vitest';

import {
  initialLangState,
  isLang,
  isSupportLang,
  langFromSearch,
  readingLang,
  supportFromNavigator,
  withLang,
  withSupport,
} from './lang';
import type { LangSources } from './lang';

const blank: LangSources = {
  search: '',
  storedLang: null,
  storedSupport: null,
  navigatorLanguages: [],
};

describe('isLang, isSupportLang', () => {
  it('n’accepte que les langues du site', () => {
    expect(isLang('hv')).toBe(true);
    expect(isLang('fr')).toBe(true);
    expect(isLang('de')).toBe(false);
    expect(isLang(null)).toBe(false);
  });

  it('refuse le valyrien comme langue d’appui', () => {
    expect(isSupportLang('en')).toBe(true);
    expect(isSupportLang('hv')).toBe(false);
  });
});

describe('readingLang', () => {
  it('lit le récit dans la langue d’appui en mode valyrien', () => {
    expect(readingLang('hv', 'fr')).toBe('fr');
    expect(readingLang('hv', 'en')).toBe('en');
  });

  it('lit le récit dans la langue d’affichage sinon', () => {
    expect(readingLang('en', 'fr')).toBe('en');
    expect(readingLang('fr', 'en')).toBe('fr');
  });
});

describe('langFromSearch', () => {
  it('lit le paramètre lang', () => {
    expect(langFromSearch('?lang=fr')).toBe('fr');
    expect(langFromSearch('?p=aegon-i&lang=hv')).toBe('hv');
  });

  it('tolère la casse et les espaces', () => {
    expect(langFromSearch('?lang=EN')).toBe('en');
    expect(langFromSearch('?lang=%20fr%20')).toBe('fr');
  });

  it('ignore une valeur absente ou inconnue', () => {
    expect(langFromSearch('')).toBeNull();
    expect(langFromSearch('?lang=')).toBeNull();
    expect(langFromSearch('?lang=dothraki')).toBeNull();
  });
});

describe('supportFromNavigator', () => {
  it('choisit le français pour un navigateur francophone', () => {
    expect(supportFromNavigator(['fr-FR', 'en'])).toBe('fr');
    expect(supportFromNavigator(['fr-CA'])).toBe('fr');
  });

  it('respecte l’ordre de préférence', () => {
    expect(supportFromNavigator(['en-GB', 'fr'])).toBe('en');
    expect(supportFromNavigator(['de-DE', 'fr-FR', 'en'])).toBe('fr');
  });

  it('retombe sur l’anglais quand ni le français ni l’anglais ne figurent', () => {
    expect(supportFromNavigator(['ja-JP', 'de'])).toBe('en');
    expect(supportFromNavigator([])).toBe('en');
  });
});

describe('withLang, withSupport', () => {
  it('garde la langue d’appui en passant au valyrien', () => {
    expect(withLang({ lang: 'fr', support: 'fr' }, 'hv')).toEqual({ lang: 'hv', support: 'fr' });
  });

  it('aligne la langue d’appui sur une langue d’affichage vivante', () => {
    expect(withLang({ lang: 'hv', support: 'fr' }, 'en')).toEqual({ lang: 'en', support: 'en' });
  });

  it('change la langue d’appui sans toucher à l’affichage', () => {
    expect(withSupport({ lang: 'hv', support: 'fr' }, 'en')).toEqual({ lang: 'hv', support: 'en' });
  });
});

describe('initialLangState', () => {
  it('ouvre en haut valyrien, glosé selon le navigateur', () => {
    expect(initialLangState({ ...blank, navigatorLanguages: ['fr-FR'] })).toEqual({ lang: 'hv', support: 'fr' });
    expect(initialLangState({ ...blank, navigatorLanguages: ['es-ES'] })).toEqual({ lang: 'hv', support: 'en' });
  });

  it('reprend le choix mémorisé', () => {
    const state = initialLangState({ ...blank, storedLang: 'hv', storedSupport: 'en', navigatorLanguages: ['fr'] });
    expect(state).toEqual({ lang: 'hv', support: 'en' });
  });

  it('écarte une valeur mémorisée corrompue', () => {
    const state = initialLangState({ ...blank, storedLang: 'klingon', storedSupport: 'hv', navigatorLanguages: ['fr'] });
    expect(state).toEqual({ lang: 'hv', support: 'fr' });
  });

  it('donne la priorité au paramètre d’adresse', () => {
    const state = initialLangState({ ...blank, search: '?lang=en', storedLang: 'fr', storedSupport: 'fr' });
    expect(state).toEqual({ lang: 'en', support: 'en' });
  });

  it('garde la langue d’appui mémorisée quand l’adresse demande le valyrien', () => {
    const state = initialLangState({ ...blank, search: '?lang=hv', storedLang: 'en', storedSupport: 'en' });
    expect(state).toEqual({ lang: 'hv', support: 'en' });
  });
});
