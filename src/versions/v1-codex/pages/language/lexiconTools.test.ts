import { describe, expect, it } from 'vitest';

import type { LexiconEntry } from '@/core/content/types';

import {
  entryAnchor,
  entryFromHash,
  filterLexicon,
  genderOf,
  groupByInitial,
  matchesQuery,
  refLabel,
  sortLexicon,
  themeKey,
} from './lexiconTools';

function entry(id: string, hv: string, fr: string, note = '', extra: Partial<LexiconEntry> = {}): LexiconEntry {
  return { id, hv, fr, en: fr, status: 'atteste', theme: 'noms', notes: { fr: note, en: note }, refs: [], verified: true, ...extra };
}

const LEXICON = [
  entry('a', 'Zaldrīzes', 'Dragon', '4e décl. solaire (pl. zaldrīzesse)'),
  entry('b', 'Āegon', 'Aegon', '3e décl. terrestre (gén. Āego)', { theme: 'formules', status: 'derive' }),
  entry('c', 'Ānogar', 'Sang', '1re décl. aquatique'),
  entry('d', 'Tembyr', 'Source', 'Littéralement « livre » (2e/6e décl. lunaire, pl. tembyri)'),
  entry('e', 'Daemon', 'Daemon', 'Flexion non documentée ; probablement 3e décl. terrestre'),
  entry('f', 'Zaldrīzesse', 'Dragons', 'Nominatif pluriel de zaldrīzes (4e décl. solaire)'),
  entry('g', 'Valar morghūlis', 'Tous les hommes doivent mourir', '1re décl. lunaire'),
];

describe('tri et initiales', () => {
  it('range Ā sous A, sans tenir compte des macrons', () => {
    const sorted = sortLexicon(LEXICON).map((item) => item.hv);
    expect(sorted.slice(0, 2)).toEqual(['Āegon', 'Ānogar']);
    expect(groupByInitial(sortLexicon(LEXICON))[0]?.initial).toBe('A');
  });
});

describe('recherche tolérante', () => {
  it('trouve une forme sans ses macrons, et par sa traduction', () => {
    expect(matchesQuery(LEXICON[0] as LexiconEntry, 'zaldrizes')).toBe(true);
    expect(matchesQuery(LEXICON[2] as LexiconEntry, 'SANG')).toBe(true);
    expect(matchesQuery(LEXICON[2] as LexiconEntry, 'feu')).toBe(false);
  });

  it('combine thème, statut et texte', () => {
    const shown = filterLexicon(LEXICON, { themes: new Set(['formules']), statuses: new Set(['derive']), query: 'aegon' });
    expect(shown.map((item) => item.id)).toEqual(['b']);
    expect(filterLexicon(LEXICON, { themes: new Set(), statuses: new Set(), query: '' })).toHaveLength(LEXICON.length);
  });
});

describe('genres documentés', () => {
  it('lit la classe donnée sans réserve', () => {
    expect(genderOf(LEXICON[0] as LexiconEntry)).toMatchObject({ gender: 'solaire', declension: '4' });
    expect(genderOf(LEXICON[2] as LexiconEntry)).toMatchObject({ gender: 'aquatique', declension: '1' });
    expect(genderOf(LEXICON[3] as LexiconEntry)).toMatchObject({ gender: 'lunaire', declension: '2/6' });
  });

  it('écarte les classes supposées, les formes fléchies et les syntagmes', () => {
    expect(genderOf(LEXICON[4] as LexiconEntry)).toBeNull();
    expect(genderOf(LEXICON[5] as LexiconEntry)).toBeNull();
    expect(genderOf(LEXICON[6] as LexiconEntry)).toBeNull();
  });
});

describe('ancres et libellés', () => {
  it('fait l’aller et retour entre identifiant et ancre', () => {
    expect(entryFromHash(`#${entryAnchor('nav.portal')}`)).toBe('nav.portal');
    expect(entryFromHash('#autre')).toBeNull();
  });

  it('dérive la clé d’un thème accentué', () => {
    expect(themeKey('parenté')).toBe('page.lexicon.theme.parente');
    expect(themeKey('royauté')).toBe('page.lexicon.theme.royaute');
  });

  it('rend un lien lisible', () => {
    expect(refLabel('https://wiki.languageinvention.com/%C4%80nogar')).toBe('wiki.languageinvention.com, Ānogar');
    expect(refLabel('https://wiki.languageinvention.com/index.php?title=High_Valyrian_Grammar')).toBe('wiki.languageinvention.com, High Valyrian Grammar');
    expect(refLabel('https://dothraki.com/?p=1227')).toBe('dothraki.com');
  });
});
