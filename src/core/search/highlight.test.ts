import { describe, expect, it } from 'vitest';

import { endsWord, findRanges, mergeRanges, splitByRanges, startsWord } from './highlight.ts';
import type { TextRange } from './highlight.ts';

const COMBINING_MACRON = String.fromCharCode(0x0304);

/** Les passages trouvés, tels que le lecteur les verra. */
const marked = (text: string, query: string): string[] => findRanges(text, query).map(([start, end]) => text.slice(start, end));

describe('findRanges', () => {
  it('trouve la requête dans le texte d’origine, majuscules et accents rendus', () => {
    expect(findRanges('Aegon Ier Targaryen', 'aeg')).toEqual([[0, 3]]);
    expect(findRanges('Port-Réal', 'real')).toEqual([[5, 9]]);
    expect(marked('Port-Réal', 'REAL')).toEqual(['Réal']);
    expect(marked('le Conquérant', 'conquerant')).toEqual(['Conquérant']);
  });

  it('ne coupe jamais une lettre de son macron', () => {
    expect(marked('Zaldrīzes', 'zaldri')).toEqual(['Zaldrī']);
    const decomposed = `Zaldri${COMBINING_MACRON}zes`;
    expect(findRanges(decomposed, 'zaldri')).toEqual([[0, 7]]);
    expect(findRanges(decomposed, 'zes')).toEqual([[7, 10]]);
  });

  it('marque la ligature entière quand on en tape le début', () => {
    expect(marked('Œildieu', 'o')).toEqual(['Œ']);
    expect(marked('Œildieu', 'oeil')).toEqual(['Œil']);
  });

  it('rend toutes les occurrences', () => {
    expect(findRanges('Aegon, fils d’Aegon', 'aegon')).toEqual([
      [0, 5],
      [14, 19],
    ]);
  });

  it('retrouve une requête sans tirets ni apostrophes dans un texte qui en a', () => {
    expect(marked('Port-Réal', 'port real')).toEqual(['Port-Réal']);
    expect(marked('Aenar l’Exilé', 'l exile')).toEqual(['l’Exilé']);
    expect(marked('Aenar l’Exilé', "l'exile")).toEqual(['l’Exilé']);
  });

  it('à défaut de la requête entière, marque chacun de ses mots', () => {
    expect(marked('Aegon Ier le Conquérant', 'conquerant aegon')).toEqual(['Aegon', 'Conquérant']);
  });

  it('préfère, pour un mot, les endroits où il commence un mot', () => {
    expect(marked('Trois rois attendent', 'roi att')).toEqual(['roi', 'att']);
    // Aucun mot ne commence par « ois » : on le marque alors partout où il se trouve.
    expect(marked('Trois rois', 'ois tr')).toEqual(['Trois', 'ois']);
  });

  it('ne rend rien quand rien ne répond ou que la requête est vide', () => {
    expect(findRanges('Balerion', 'vhagar')).toEqual([]);
    expect(findRanges('Balerion', '')).toEqual([]);
    expect(findRanges('Balerion', '  « » ')).toEqual([]);
    expect(findRanges('', 'aegon')).toEqual([]);
  });
});

describe('mergeRanges', () => {
  it('trie et réunit les étendues qui se touchent ou se chevauchent', () => {
    const ranges: TextRange[] = [
      [5, 8],
      [0, 3],
      [2, 6],
      [12, 14],
    ];
    expect(mergeRanges(ranges)).toEqual([
      [0, 8],
      [12, 14],
    ]);
    expect(mergeRanges([[0, 2], [2, 4]])).toEqual([[0, 4]]);
  });

  it('écarte les étendues vides et ne modifie pas le tableau reçu', () => {
    const ranges: TextRange[] = [
      [10, 10],
      [4, 6],
    ];
    expect(mergeRanges(ranges)).toEqual([[4, 6]]);
    expect(ranges).toEqual([
      [10, 10],
      [4, 6],
    ]);
    expect(mergeRanges([])).toEqual([]);
  });
});

describe('splitByRanges', () => {
  it('découpe le texte en morceaux trouvés et non trouvés, sans rien perdre', () => {
    expect(splitByRanges('Port-Réal', [[5, 9]])).toEqual([
      { text: 'Port-', hit: false },
      { text: 'Réal', hit: true },
    ]);
    const text = 'Aegon, fils d’Aegon';
    const segments = splitByRanges(text, findRanges(text, 'aegon'));
    expect(segments.map((segment) => segment.hit)).toEqual([true, false, true]);
    expect(segments.map((segment) => segment.text).join('')).toBe(text);
  });

  it('rend le texte entier, non marqué, quand il n’y a pas d’étendue', () => {
    expect(splitByRanges('Balerion', [])).toEqual([{ text: 'Balerion', hit: false }]);
    expect(splitByRanges('', [])).toEqual([]);
  });

  it('rogne les étendues qui débordent et réunit celles qui se chevauchent', () => {
    expect(splitByRanges('abc', [[1, 10]])).toEqual([
      { text: 'a', hit: false },
      { text: 'bc', hit: true },
    ]);
    expect(splitByRanges('abcdef', [[3, 5], [0, 2], [1, 4]])).toEqual([
      { text: 'abcde', hit: true },
      { text: 'f', hit: false },
    ]);
    expect(splitByRanges('abc', [[7, 9]])).toEqual([{ text: 'abc', hit: false }]);
  });
});

describe('startsWord, endsWord', () => {
  it('reconnaît le début et la fin d’un mot dans un texte normalisé', () => {
    expect(startsWord('port real', 0)).toBe(true);
    expect(startsWord('port real', 5)).toBe(true);
    expect(startsWord('port real', 6)).toBe(false);
    expect(endsWord('port real', 4)).toBe(true);
    expect(endsWord('port real', 9)).toBe(true);
    expect(endsWord('port real', 3)).toBe(false);
  });

  it('tient tirets et apostrophes pour des séparateurs', () => {
    expect(startsWord("l'exile", 2)).toBe(true);
    expect(startsWord('port-real', 5)).toBe(true);
    expect(endsWord('port-real', 4)).toBe(true);
  });
});
