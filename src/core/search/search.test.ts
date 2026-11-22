import { describe, expect, it } from 'vitest';

import type { Localized, SearchEntry, SearchKind } from '../content/types.ts';
import { normalize, normalizeLoose } from './normalize.ts';
import { DEFAULT_SEARCH_LIMIT, SEARCH_KINDS, groupHits, search } from './search.ts';
import type { SearchResults } from './search.ts';

/* ------------------------------------------------------------------ index d'essai */

const loc = (fr: string, en: string = fr, hv?: string): Localized => (hv === undefined ? { fr, en } : { fr, en, hv });

/** Clés fabriquées comme dans `scripts/build-content.mjs` : forme normalisée et forme relâchée. */
function keysOf(...texts: (Localized | undefined)[]): string[] {
  const forms = texts.flatMap((text) => (text ? [text.fr, text.en, text.hv ?? ''] : [])).filter((form) => form !== '');
  return [...new Set(forms.flatMap((form) => [normalize(form), normalizeLoose(form)]))];
}

/** Une entrée dont les clés viennent du libellé et, s'il y en a, des autres noms (`names`). */
function entry(kind: SearchKind, id: string, label: Localized, hint?: Localized, names?: Localized): SearchEntry {
  const base = { kind, id, to: `/${kind}/${id}`, label, keys: keysOf(label, names) };
  return hint ? { ...base, hint } : base;
}

/** Personne ou dragon : l'épithète est à la fois l'indication affichée et une clé. */
const named = (kind: SearchKind, id: string, label: Localized, epithet: Localized): SearchEntry => entry(kind, id, label, epithet, epithet);

const INDEX: SearchEntry[] = [
  entry('period', 'p5', loc('La Danse des Dragons', 'The Dance of the Dragons')),
  entry('event', 'mort-conquerant', loc('Mort du Conquérant, avènement d’Aenys Ier', 'Death of the Conqueror, Accession of Aenys I')),
  entry('event', 'sac', loc('Le sac de Port-Réal', 'The Sack of King’s Landing')),
  entry('word', 'w-daenerys', loc('Daenerys', 'Daenerys', 'Daenerys'), loc('nom propre', 'proper name')),
  entry('word', 'w-zaldrizesse', loc('Zaldrīzesse', 'Zaldrīzesse', 'Zaldrīzesse'), loc('dragons'), loc('dragons')),
  entry('word', 'w-zaldrizes', loc('Zaldrīzes', 'Zaldrīzes', 'Zaldrīzes'), loc('dragon'), loc('dragon')),
  entry('word', 'w-balerion', loc('Balerion', 'Balerion', 'Balerion'), loc('nom de dragon', 'dragon name')),
  entry('place', 'port-real', loc('Port-Réal', 'King’s Landing'), loc('Terres de la Couronne', 'Crownlands')),
  named('person', 'aegon-i', loc('Aegon Ier Targaryen', 'Aegon I Targaryen'), loc('le Conquérant', 'the Conqueror')),
  named('person', 'aegon-ii', loc('Aegon II Targaryen'), loc('l’Aîné', 'the Elder')),
  named('person', 'aenar', loc('Aenar Targaryen'), loc('l’Exilé', 'the Exile')),
  named('person', 'viserys-i', loc('Viserys Ier Targaryen', 'Viserys I Targaryen'), loc('le Pacifique', 'the Peaceful')),
  named('person', 'daenerys', loc('Daenerys Targaryen'), loc('du Typhon', 'Stormborn')),
  named('dragon', 'balerion', loc('Balerion', 'Balerion', 'Balerion'), loc('la Terreur noire', 'the Black Dread')),
  named('dragon', 'vhagar', loc('Vhagar', 'Vhagar', 'Vagar'), loc('la reine de tous les dragons', 'queen of all dragons')),
];

const ids = (results: SearchResults): string[] => results.hits.map((hit) => hit.entry.id);
const hitOf = (results: SearchResults, id: string) => results.hits.find((hit) => hit.entry.id === id);
const find = (query: string, lang: 'fr' | 'en' | 'hv' = 'fr', limit?: number): SearchResults => search(INDEX, query, lang, limit);

/* ------------------------------------------------------------------ essais */

describe('search : requête', () => {
  it('ne rend rien pour une requête vide ou sans rien de cherchable', () => {
    for (const query of ['', '   ', '« »']) {
      const results = find(query);
      expect(results.query).toBe('');
      expect(results.total).toBe(0);
      expect(results.hits).toEqual([]);
      expect(results.groups).toEqual([]);
      expect(Object.values(results.totals).every((count) => count === 0)).toBe(true);
    }
  });

  it('normalise la requête : casse, accents, macrons, espaces', () => {
    expect(find('  CONQUÉRANT ').query).toBe('conquerant');
    expect(ids(find('  CONQUÉRANT '))).toEqual(ids(find('conquerant')));
    expect(ids(find('Zaldrīzes'))).toEqual(ids(find('zaldrizes')));
    expect(ids(find('Dǣnerys'))).toEqual(ids(find('daenerys')));
  });

  it('lit de la même façon tirets, apostrophes et espaces', () => {
    const expected = ids(find('port-real'));
    expect(expected.slice(0, 2)).toEqual(['port-real', 'sac']);
    expect(ids(find('Port Réal'))).toEqual(expected);
    expect(ids(find("l'exile"))).toEqual(['aenar']);
    expect(ids(find('l’exilé'))).toEqual(['aenar']);
    expect(ids(find('l exile'))).toEqual(['aenar']);
  });
});

describe('search : classement', () => {
  it('range préfixe, mot entier, début de mot, puis milieu de mot', () => {
    const tiny: SearchEntry[] = [
      entry('event', 'milieu', loc('Fossedragon')),
      entry('event', 'debut', loc('La danse des dragons')),
      entry('event', 'mot', loc('Mort du dragon')),
      entry('event', 'prefixe', loc('Dragon noir')),
    ];
    const results = search(tiny, 'dragon', 'fr');
    expect(ids(results)).toEqual(['prefixe', 'mot', 'debut', 'milieu']);
    expect(results.hits.map((hit) => hit.rank)).toEqual(['prefix', 'word', 'word-start', 'substring']);
    const scores = results.hits.map((hit) => hit.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('ne compte pas l’article initial d’une clé', () => {
    expect(hitOf(find('conquerant'), 'aegon-i')).toMatchObject({ rank: 'prefix', exact: true, scattered: false });
    expect(hitOf(find('conq'), 'aegon-i')).toMatchObject({ rank: 'prefix', exact: false });
    expect(hitOf(find('terreur'), 'balerion')?.rank).toBe('prefix');
    expect(hitOf(find('black', 'en'), 'balerion')?.rank).toBe('prefix');
    expect(hitOf(find('dread', 'en'), 'balerion')?.rank).toBe('word');
  });

  it('place l’épithète exacte d’une personne avant le titre qui la cite', () => {
    expect(ids(find('conquerant'))).toEqual(['aegon-i', 'mort-conquerant']);
    expect(hitOf(find('conquerant'), 'mort-conquerant')?.rank).toBe('word');
  });

  it('à rang égal, fait passer personnes et dragons avant le reste', () => {
    // L'entrée du lexique est exactement « daenerys », la reine n'en est que le préfixe : elle passe pourtant devant.
    expect(ids(find('daenerys'))).toEqual(['daenerys', 'w-daenerys']);
    expect(ids(find('balerion'))).toEqual(['balerion', 'w-balerion']);
    expect(ids(find('aeg')).every((id) => id.startsWith('aegon'))).toBe(true);
  });

  it('ne laisse pas ce bonus renverser un rang', () => {
    const tiny: SearchEntry[] = [entry('person', 'gardien', loc('Gardien de Fossedragon')), entry('event', 'prefixe', loc('Dragon noir'))];
    expect(ids(search(tiny, 'dragon', 'fr'))).toEqual(['prefixe', 'gardien']);
  });

  it('dans un même genre, fait passer la clé exacte avant le simple préfixe', () => {
    expect(ids(find('zaldrizes'))).toEqual(['w-zaldrizes', 'w-zaldrizesse']);
    expect(hitOf(find('zaldrizes'), 'w-zaldrizes')?.exact).toBe(true);
    expect(hitOf(find('zaldrizes'), 'w-zaldrizesse')?.exact).toBe(false);
    expect(ids(find('aegon ii targaryen'))).toEqual(['aegon-ii']);
  });

  it('trouve le milieu d’un mot en dernier recours, mais pas une lettre seule', () => {
    expect(hitOf(find('rys'), 'viserys-i')?.rank).toBe('substring');
    expect(hitOf(find('rys'), 'daenerys')?.rank).toBe('substring');
    // « h » ne commence aucun mot de « Vhagar » : une lettre au milieu d'un mot ne désigne rien.
    expect(ids(find('h'))).not.toContain('vhagar');
    expect(ids(find('v'))).toContain('vhagar');
  });

  it('garde l’ordre de l’index entre deux réponses que rien ne départage', () => {
    const twins: SearchEntry[] = [entry('event', 'un', loc('Dragon noir')), entry('event', 'deux', loc('Dragon noir'))];
    expect(ids(search(twins, 'dragon', 'fr'))).toEqual(['un', 'deux']);
  });
});

describe('search : plusieurs mots', () => {
  it('trouve des mots répartis sur plusieurs clés et le signale', () => {
    const results = find('aegon conquerant');
    expect(ids(results)).toEqual(['aegon-i']);
    expect(results.hits[0]).toMatchObject({ rank: 'prefix', scattered: true, exact: false });
    expect(results.hits[0]?.matched).toEqual(['aegon i targaryen', 'le conquerant']);
    expect(ids(find('conquerant aegon'))).toEqual(['aegon-i']);
  });

  it('exige que chaque mot soit trouvé', () => {
    expect(find('aegon vhagar').total).toBe(0);
  });

  it('classe une réponse d’un seul tenant avant une réponse éparse de même rang', () => {
    const tiny: SearchEntry[] = [
      named('person', 'epars', loc('Dragon Rouge'), loc('Noir de suie')),
      entry('event', 'tenant', loc('Dragon noir')),
    ];
    const results = search(tiny, 'dragon noir', 'fr');
    expect(ids(results)).toEqual(['tenant', 'epars']);
    expect(results.hits.map((hit) => hit.scattered)).toEqual([false, true]);
  });
});

describe('search : langue', () => {
  it('trouve dans toutes les langues, quelle que soit la langue affichée', () => {
    expect(ids(find('stormborn', 'fr'))).toEqual(['daenerys']);
    expect(ids(find('typhon', 'en'))).toEqual(['daenerys']);
    expect(ids(find('vagar', 'fr'))).toEqual(['vhagar']);
  });

  it('départage les ex æquo en faveur de ce qui se lit dans la langue affichée', () => {
    const tiny: SearchEntry[] = [
      entry('event', 'anglais-seul', loc('Ver ailé', 'Dragon wyrm')),
      entry('event', 'les-deux', loc('Dragon noir', 'Dragon dark')),
    ];
    expect(ids(search(tiny, 'dragon', 'fr'))).toEqual(['les-deux', 'anglais-seul']);
    expect(ids(search(tiny, 'dragon', 'en'))).toEqual(['anglais-seul', 'les-deux']);
    expect(ids(search(tiny, 'dragon', 'hv'))).toEqual(['anglais-seul', 'les-deux']);
  });
});

describe('search : mise en évidence', () => {
  it('donne les passages à marquer dans chaque forme du libellé', () => {
    const hit = hitOf(find('real'), 'port-real');
    expect(hit?.label).toEqual({ fr: [[5, 9]], en: [] });
    expect(hit?.hint).toEqual({ fr: [], en: [] });
  });

  it('marque aussi l’indication, et la forme valyrienne quand elle existe', () => {
    const aegon = hitOf(find('conquerant'), 'aegon-i');
    expect(aegon?.label).toEqual({ fr: [], en: [] });
    expect(aegon?.hint).toEqual({ fr: [[3, 13]], en: [] });
    const vhagar = hitOf(find('vagar'), 'vhagar');
    expect(vhagar?.label).toEqual({ fr: [], en: [], hv: [[0, 5]] });
  });

  it('dit quelles clés ont répondu quand rien n’est visible dans la langue affichée', () => {
    const hit = hitOf(find('stormborn', 'fr'), 'daenerys');
    expect(hit?.label.fr).toEqual([]);
    expect(hit?.hint?.fr).toEqual([]);
    expect(hit?.hint?.en).toEqual([[0, 9]]);
    expect(hit?.matched).toEqual(['stormborn']);
  });

  it('n’ajoute pas d’indication à une entrée qui n’en a pas', () => {
    const hit = hitOf(find('danse'), 'p5');
    expect(hit).toBeDefined();
    expect(hit && 'hint' in hit).toBe(false);
  });
});

describe('search : coupe et regroupement', () => {
  it('compte toutes les réponses avant de couper', () => {
    const all = find('a', 'fr', 100);
    const cut = find('a', 'fr', 2);
    expect(all.total).toBeGreaterThan(2);
    expect(cut.hits).toHaveLength(2);
    expect(cut.total).toBe(all.total);
    expect(cut.totals).toEqual(all.totals);
    expect(ids(cut)).toEqual(ids(all).slice(0, 2));
    expect(Object.values(all.totals).reduce((sum, count) => sum + count, 0)).toBe(all.total);
  });

  it('accepte une coupe nulle, négative, fractionnaire ou absurde', () => {
    expect(find('a', 'fr', 0).hits).toEqual([]);
    expect(find('a', 'fr', 0).total).toBeGreaterThan(0);
    expect(find('a', 'fr', -3).hits).toEqual([]);
    expect(find('a', 'fr', 2.9).hits).toHaveLength(2);
    expect(find('a', 'fr', Number.NaN).hits).toEqual([]);
    expect(find('a', 'fr', Number.POSITIVE_INFINITY).hits).toHaveLength(find('a').total);
  });

  it('coupe par défaut à DEFAULT_SEARCH_LIMIT', () => {
    const many = Array.from({ length: DEFAULT_SEARCH_LIMIT + 6 }, (_, i) => entry('event', `e${i}`, loc(`Dragon ${i}`)));
    const results = search(many, 'dragon', 'fr');
    expect(results.hits).toHaveLength(DEFAULT_SEARCH_LIMIT);
    expect(results.total).toBe(DEFAULT_SEARCH_LIMIT + 6);
  });

  it('regroupe par genre, le genre de la meilleure réponse en premier', () => {
    const results = find('dragon', 'fr');
    expect(results.groups.map((group) => group.kind)).toEqual([...new Set(results.hits.map((hit) => hit.entry.kind))]);
    expect(results.groups[0]?.kind).toBe(results.hits[0]?.entry.kind);
    for (const group of results.groups) {
      expect(group.hits).toEqual(results.hits.filter((hit) => hit.entry.kind === group.kind));
      expect(group.total).toBe(results.totals[group.kind]);
    }
  });

  it('donne à chaque groupe son effectif d’avant la coupe', () => {
    const results = find('a', 'fr', 3);
    for (const group of results.groups) {
      expect(group.total).toBe(results.totals[group.kind]);
      expect(group.total).toBeGreaterThanOrEqual(group.hits.length);
    }
    expect(results.groups.reduce((sum, group) => sum + group.hits.length, 0)).toBe(3);
  });

  it('groupHits, sans effectifs donnés, compte les réponses reçues', () => {
    const hits = find('dragon', 'fr').hits;
    const groups = groupHits(hits);
    expect(groups.reduce((sum, group) => sum + group.total, 0)).toBe(hits.length);
    for (const group of groups) expect(group.total).toBe(group.hits.length);
    expect(groupHits([])).toEqual([]);
  });

  it('connaît tous les genres du contrat dans les effectifs', () => {
    expect(Object.keys(find('aegon').totals).sort()).toEqual([...SEARCH_KINDS].sort());
  });
});

describe('search : pureté', () => {
  it('ne modifie pas l’index et rend deux fois la même réponse', () => {
    const before = JSON.stringify(INDEX);
    const first = find('dragon');
    const second = find('dragon');
    expect(JSON.stringify(INDEX)).toBe(before);
    expect(second).toEqual(first);
  });

  it('accepte un sous-ensemble de l’index', () => {
    const dragons = INDEX.filter((item) => item.kind === 'dragon');
    expect(ids(search(dragons, 'dragon', 'fr'))).toEqual(['vhagar']);
    expect(search([], 'dragon', 'fr').total).toBe(0);
  });
});
