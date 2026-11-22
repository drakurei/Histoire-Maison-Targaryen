import { describe, expect, it } from 'vitest';

import type { EntityRef, HistoricalEvent, Localized, Year } from '../content/types.ts';
import { activeCriteria, entityKey, eventFacets, filterEvents, matchesEvent } from './filters.ts';
import type { EventFilter } from './filters.ts';

/* ------------------------------------------------------------------ jeux d'essai */

const loc = (fr: string, en: string = fr): Localized => ({ fr, en });
const ref = (id: string | undefined, fr: string, en: string = fr): EntityRef => (id === undefined ? { name: loc(fr, en) } : { id, name: loc(fr, en) });

const DAEMON = ref('daemon', 'Daemon Targaryen');
const RHAENYRA = ref('rhaenyra', 'Rhaenyra Targaryen');
const AEMOND = ref('aemond', 'Aemond Targaryen');
const AEGON = ref('aegon-i', 'Aegon Ier Targaryen', 'Aegon I Targaryen');
const JAENARA = ref(undefined, 'Jaenara Belaerys');
const CARAXES = ref('caraxes', 'Caraxes');
const VHAGAR = ref('vhagar', 'Vhagar');
const BALERION: EntityRef = { id: 'balerion', name: { fr: 'Balerion', en: 'Balerion', hv: 'Balerion' } };
const PORT_REAL = ref(undefined, 'Port-Réal', 'King’s Landing');
const HARRENHAL = ref('harrenhal', 'Harrenhal');

function event(id: string, year: Year, patch: Partial<HistoricalEvent> = {}): HistoricalEvent {
  return {
    id,
    periodId: 'p5',
    year,
    sortYear: year ?? 0,
    dateCertainty: year === null ? 'inconnue' : 'exacte',
    yearLabel: loc(''),
    title: loc(id),
    summary: loc(''),
    consequence: loc(''),
    people: [],
    dragons: [],
    places: [],
    continuity: 'livres',
    reliability: 'etabli',
    sources: [],
    ...patch,
  };
}

const EVENTS: HistoricalEvent[] = [
  event('jaenara', null, {
    periodId: 'p1',
    sortYear: -250,
    title: loc('Le voyage de Jaenara Belaerys', 'The Voyage of Jaenara Belaerys'),
    people: [JAENARA],
    reliability: 'recit-unique',
  }),
  event('conquete', -2, {
    periodId: 'p3',
    yearEnd: 1,
    title: loc('La Conquête', 'The Conquest'),
    summary: loc('Aegon débarque à l’embouchure de la Néra avec ses sœurs.', 'Aegon lands at the mouth of the Blackwater with his sisters.'),
    people: [AEGON],
    dragons: [BALERION],
    places: [PORT_REAL],
  }),
  event('gue-pourpre', 129, {
    title: loc('La prise de Port-Réal', 'The Fall of King’s Landing'),
    summary: loc('Les trois rois attendent.', 'Three kings wait.'),
    people: [DAEMON, RHAENYRA],
    dragons: [CARAXES],
    places: [PORT_REAL],
    reliability: 'contradictoire',
  }),
  event('oeildieu', 130, {
    title: loc('Le duel de l’Œildieu', 'The Battle Above the Gods Eye'),
    people: [DAEMON, AEMOND],
    dragons: [CARAXES, VHAGAR],
    places: [HARRENHAL],
  }),
  event('serie-couronnement', null, {
    sortYear: 129.6,
    title: loc('Série : le couronnement', 'Series: the coronation'),
    people: [RHAENYRA],
    continuity: 'adaptation',
    reliability: 'adaptation',
  }),
  event('regence', 131, { periodId: 'p6', yearEnd: 136, title: loc('La régence', 'The Regency') }),
];

const found = (filter: EventFilter, lang: 'fr' | 'en' | 'hv' = 'fr'): string[] => filterEvents(EVENTS, filter, lang).map((item) => item.id);
const ALL = EVENTS.map((item) => item.id);

/* ------------------------------------------------------------------ essais */

describe('entityKey', () => {
  it('vaut l’identifiant quand l’entité a une fiche', () => {
    expect(entityKey(DAEMON)).toBe('daemon');
  });

  it('vaut le nom français normalisé, précédé d’un tilde, quand elle n’en a pas', () => {
    expect(entityKey(JAENARA)).toBe('~jaenara belaerys');
    expect(entityKey(PORT_REAL)).toBe('~port-real');
  });
});

describe('filterEvents : un critère à la fois', () => {
  it('ne filtre rien quand le filtre est vide ou ses critères vides', () => {
    expect(found({})).toEqual(ALL);
    expect(found({ periods: [], people: [], reliability: [], text: '   ', years: [null, null] })).toEqual(ALL);
  });

  it('filtre par période', () => {
    expect(found({ periods: ['p1', 'p6'] })).toEqual(['jaenara', 'regence']);
  });

  it('filtre par fiabilité et par continuité', () => {
    expect(found({ reliability: ['contradictoire', 'recit-unique'] })).toEqual(['jaenara', 'gue-pourpre']);
    expect(found({ continuity: ['adaptation'] })).toEqual(['serie-couronnement']);
    expect(found({ continuity: ['livres'] })).toHaveLength(5);
  });

  it('filtre par personne, par dragon, par lieu', () => {
    expect(found({ people: ['daemon'] })).toEqual(['gue-pourpre', 'oeildieu']);
    expect(found({ dragons: ['vhagar'] })).toEqual(['oeildieu']);
    expect(found({ places: ['harrenhal'] })).toEqual(['oeildieu']);
  });

  it('retrouve une entité sans fiche par sa clé de nom', () => {
    expect(found({ people: [entityKey(JAENARA)] })).toEqual(['jaenara']);
    expect(found({ places: ['~port-real'] })).toEqual(['conquete', 'gue-pourpre']);
  });

  it('propose des alternatives par défaut, exige tout avec entities: all', () => {
    expect(found({ people: ['daemon', 'rhaenyra'] })).toEqual(['gue-pourpre', 'oeildieu', 'serie-couronnement']);
    expect(found({ people: ['daemon', 'rhaenyra'], entities: 'all' })).toEqual(['gue-pourpre']);
    expect(found({ dragons: ['caraxes', 'vhagar'], entities: 'all' })).toEqual(['oeildieu']);
  });
});

describe('filterEvents : intervalle d’années', () => {
  it('garde les événements de l’intervalle, bornes comprises', () => {
    expect(found({ years: [129, 130] })).toEqual(['gue-pourpre', 'oeildieu', 'serie-couronnement']);
    expect(found({ years: [130, 130] })).toEqual(['oeildieu']);
  });

  it('garde un événement qui dure dès qu’il touche l’intervalle', () => {
    expect(found({ years: [134, 140] })).toEqual(['regence']);
    expect(found({ years: [1, 50] })).toEqual(['conquete']);
    expect(found({ years: [137, 140] })).toEqual([]);
  });

  it('laisse un côté ouvert avec null et remet un intervalle inversé dans l’ordre', () => {
    expect(found({ years: [null, -2] })).toEqual(['jaenara', 'conquete']);
    expect(found({ years: [131, null] })).toEqual(['regence']);
    expect(found({ years: [130, 129] })).toEqual(found({ years: [129, 130] }));
  });

  it('juge un événement non daté à la place que lui donne sortYear', () => {
    expect(found({ years: [-300, -200] })).toEqual(['jaenara']);
    expect(found({ years: [129, 129] })).toEqual(['gue-pourpre', 'serie-couronnement']);
  });
});

describe('filterEvents : texte', () => {
  it('ignore la casse, les accents, les tirets et les apostrophes', () => {
    expect(found({ text: 'PORT REAL' })).toEqual(['conquete', 'gue-pourpre']);
    expect(found({ text: 'port-réal' })).toEqual(['conquete', 'gue-pourpre']);
    expect(found({ text: 'oeildieu' })).toEqual(['oeildieu']);
    expect(found({ text: 'l’œildieu' })).toEqual(['oeildieu']);
  });

  it('cherche dans le titre, le récit et les noms cités', () => {
    expect(found({ text: 'embouchure' })).toEqual(['conquete']);
    expect(found({ text: 'vhagar' })).toEqual(['oeildieu']);
    expect(found({ text: 'harrenhal' })).toEqual(['oeildieu']);
  });

  it('exige tous les mots, chacun au début d’un mot', () => {
    expect(found({ text: 'daemon aemond' })).toEqual(['oeildieu']);
    expect(found({ text: 'daemon balerion' })).toEqual([]);
    // « roi » trouve « rois », pas « trois ».
    expect(found({ text: 'roi' })).toEqual(['gue-pourpre']);
    expect(found({ text: 'rois' })).toEqual(['gue-pourpre']);
    expect(found({ text: 'emon' })).toEqual([]);
  });

  it('ne cherche que dans la langue lue', () => {
    expect(found({ text: 'blackwater' }, 'fr')).toEqual([]);
    expect(found({ text: 'blackwater' }, 'en')).toEqual(['conquete']);
    expect(found({ text: 'king’s landing' }, 'en')).toEqual(['conquete', 'gue-pourpre']);
    expect(found({ text: 'nera' }, 'en')).toEqual([]);
  });

  it('en haut valyrien, cherche dans les deux langues d’appui', () => {
    expect(found({ text: 'blackwater' }, 'hv')).toEqual(['conquete']);
    expect(found({ text: 'néra' }, 'hv')).toEqual(['conquete']);
  });
});

describe('filterEvents : critères combinés', () => {
  it('garde ce qui satisfait tous les critères à la fois', () => {
    expect(found({ periods: ['p5'], people: ['daemon'], years: [130, 131] })).toEqual(['oeildieu']);
    expect(found({ periods: ['p5'], continuity: ['livres'], text: 'port real' })).toEqual(['gue-pourpre']);
    expect(found({ people: ['rhaenyra'], reliability: ['etabli'] })).toEqual([]);
  });

  it('garde l’ordre reçu et ne modifie rien', () => {
    const reversed = [...EVENTS].reverse();
    expect(filterEvents(reversed, { people: ['daemon'] }).map((item) => item.id)).toEqual(['oeildieu', 'gue-pourpre']);
    expect(EVENTS.map((item) => item.id)).toEqual(ALL);
  });

  it('matchesEvent dit la même chose pour un seul événement', () => {
    const filter: EventFilter = { people: ['daemon'], text: 'duel' };
    for (const item of EVENTS) expect(matchesEvent(item, filter)).toBe(item.id === 'oeildieu');
  });
});

describe('activeCriteria', () => {
  it('ne compte que les critères qui filtrent réellement', () => {
    expect(activeCriteria({})).toEqual([]);
    expect(activeCriteria({ periods: [], text: '  ', years: [null, null], entities: 'all' })).toEqual([]);
    expect(activeCriteria({ people: ['daemon'], reliability: ['etabli'], years: [129, null], text: 'duel' })).toEqual([
      'people',
      'reliability',
      'years',
      'text',
    ]);
  });
});

describe('eventFacets', () => {
  const facets = eventFacets(EVENTS);

  it('compte les périodes, fiabilités et continuités dans l’ordre d’apparition', () => {
    expect(facets.periods).toEqual([
      { value: 'p1', count: 1 },
      { value: 'p3', count: 1 },
      { value: 'p5', count: 3 },
      { value: 'p6', count: 1 },
    ]);
    expect(facets.reliability.find((facet) => facet.value === 'etabli')?.count).toBe(3);
    expect(facets.continuity).toEqual([
      { value: 'livres', count: 5 },
      { value: 'adaptation', count: 1 },
    ]);
  });

  it('range les entités de la plus citée à la moins citée, avec leur clé', () => {
    expect(facets.people.map((facet) => [facet.key, facet.count])).toEqual([
      ['daemon', 2],
      ['rhaenyra', 2],
      ['~jaenara belaerys', 1],
      ['aegon-i', 1],
      ['aemond', 1],
    ]);
    expect(facets.dragons[0]).toEqual({ key: 'caraxes', id: 'caraxes', name: loc('Caraxes'), count: 2 });
    expect(facets.places[0]).toEqual({ key: '~port-real', name: loc('Port-Réal', 'King’s Landing'), count: 2 });
  });

  it('ne compte une entité qu’une fois par événement', () => {
    const twice = [event('double', 129, { people: [DAEMON, DAEMON] })];
    expect(eventFacets(twice).people).toEqual([{ key: 'daemon', id: 'daemon', name: DAEMON.name, count: 1 }]);
  });

  it('donne les années touchées, durées et événements non datés compris', () => {
    expect(facets.years).toEqual([-250, 136]);
    expect(eventFacets([]).years).toBeNull();
  });

  it('une clé de facette rendue au filtre retrouve exactement ses événements', () => {
    for (const facet of facets.people) expect(filterEvents(EVENTS, { people: [facet.key] })).toHaveLength(facet.count);
    for (const facet of facets.dragons) expect(filterEvents(EVENTS, { dragons: [facet.key] })).toHaveLength(facet.count);
    for (const facet of facets.places) expect(filterEvents(EVENTS, { places: [facet.key] })).toHaveLength(facet.count);
  });
});
