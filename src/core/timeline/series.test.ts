import { describe, expect, it } from 'vitest';

import type { Dragon, DragonRider, HistoricalEvent, Localized, Person, Sovereign, Year } from '../content/types.ts';
import {
  NARRATIVE_END,
  chronicleYears,
  dragonLives,
  dragonsAlive,
  eventDensity,
  eventsByYear,
  lifeSpans,
  placementYear,
  reignRibbons,
} from './series.ts';

/* ------------------------------------------------------------------ jeux d'essai */

const loc = (fr: string, en: string = fr): Localized => ({ fr, en });

function dragon(id: string, patch: Partial<Dragon> = {}): Dragon {
  const attested = { body: false, wing: false, crest: false, flame: false, size: false };
  return {
    id,
    name: loc(id),
    appearance: null,
    look: { span: 1, neck: 0.5, tail: 0.5, horns: 1, body: '#111', wing: '#111', crest: '#111', flame: '#111', attested },
    riders: [],
    origin: loc(''),
    hatched: null,
    died: null,
    fate: loc(''),
    battleIds: [],
    eventIds: [],
    continuity: 'livres',
    reliability: 'etabli',
    sources: [],
    ...patch,
  };
}

const rider = (from?: number, to?: number): DragonRider => ({ name: loc('cavalier'), from, to });
/** Le JSON produit écrit `null` là où le type dit « absent » : le code doit lire les deux. */
const riderWithNullStart = { name: loc('cavalier'), from: null, to: 10 } as unknown as DragonRider;

const DRAGONS: Dragon[] = [
  dragon('balerion', { hatched: -114, died: 94 }),
  dragon('vhagar', { hatched: -52, died: 130 }),
  dragon('caraxes', { riders: [rider(72, 92), rider(undefined, 130)], died: 130 }),
  dragon('meraxes', { riders: [riderWithNullStart], died: 10 }),
  dragon('silverwing', { hatched: 36, alive: true }),
  dragon('sans-fin', { hatched: 100 }),
  dragon('cannibal', { alive: true }),
  dragon('a-rebours', { hatched: 50, died: 40 }),
];

function sovereign(id: string, ordinal: number | null, reignFrom: number, reignTo: number, patch: Partial<Sovereign> = {}): Sovereign {
  return {
    id,
    ordinal,
    name: loc(id),
    reignFrom,
    reignTo,
    born: null,
    died: reignTo,
    predecessor: null,
    successor: null,
    relationToPredecessor: loc(''),
    contested: false,
    note: loc(''),
    sources: [],
    ...patch,
  };
}

function person(id: string, patch: Partial<Person> = {}): Person {
  return {
    id,
    name: loc(id),
    sex: 'f',
    house: 'targaryen',
    born: null,
    died: null,
    dateCertainty: 'exacte',
    king: false,
    reign: null,
    legitimacy: 'legitime',
    generation: 0,
    sources: [],
    hasBiography: false,
    ...patch,
  };
}

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

const ids = (events: readonly HistoricalEvent[]): string[] => events.map((item) => item.id);

/* ------------------------------------------------------------------ essais */

describe('chronicleYears', () => {
  it('énumère les années entières, bornes comprises, sans an 0', () => {
    expect(chronicleYears(-2, 2)).toEqual([-2, -1, 1, 2]);
    expect(chronicleYears(128, 131)).toEqual([128, 129, 130, 131]);
  });

  it('s’en tient aux années entières du segment et rend vide un segment à l’envers', () => {
    expect(chronicleYears(1.2, 3.9)).toEqual([2, 3]);
    expect(chronicleYears(5, 4)).toEqual([]);
  });
});

describe('dragonLives', () => {
  const { lives, unknown } = dragonLives(DRAGONS);
  const life = (id: string) => lives.find((item) => item.id === id);

  it('prend l’année d’éclosion quand elle est connue', () => {
    expect(life('balerion')).toEqual({ id: 'balerion', from: -114, to: 94, inferred: false });
  });

  it('à défaut, part de la première année du premier cavalier et le signale', () => {
    expect(life('caraxes')).toEqual({ id: 'caraxes', from: 72, to: 130, inferred: true });
  });

  it('laisse ouverte la vie d’un dragon dit vivant', () => {
    expect(life('silverwing')).toEqual({ id: 'silverwing', from: 36, to: null, inferred: false });
  });

  it('range à part ce que rien ne situe, sans rien inventer', () => {
    // meraxes : premier cavalier sans année de début ; sans-fin : ni mort ni « vivant » ;
    // cannibal : ni éclosion ni cavalier ; a-rebours : mort avant d'éclore.
    expect(unknown).toEqual(['meraxes', 'sans-fin', 'cannibal', 'a-rebours']);
    expect(lives.map((item) => item.id)).toEqual(['balerion', 'vhagar', 'caraxes', 'silverwing']);
  });
});

describe('dragonsAlive', () => {
  const series = dragonsAlive(DRAGONS, -120, NARRATIVE_END);
  const at = (year: number) => series.points.find((point) => point.year === year);

  it('donne un point par année, sans an 0', () => {
    expect(series.points).toHaveLength(120 + 300);
    expect(at(0)).toBeUndefined();
    expect(series.points[0]?.year).toBe(-120);
    expect(series.points[series.points.length - 1]?.year).toBe(300);
  });

  it('compte un dragon de l’éclosion à la mort, années comprises', () => {
    expect(at(-115)).toEqual({ year: -115, count: 0, ids: [] });
    expect(at(-114)).toEqual({ year: -114, count: 1, ids: ['balerion'] });
    expect(at(94)?.ids).toContain('balerion');
    expect(at(95)?.ids).not.toContain('balerion');
  });

  it('compte le dragon sans éclosion à partir de son premier cavalier', () => {
    expect(at(71)?.ids).not.toContain('caraxes');
    expect(at(72)).toEqual({ year: 72, count: 4, ids: ['balerion', 'vhagar', 'caraxes', 'silverwing'] });
  });

  it('prolonge un dragon vivant jusqu’à la fin demandée', () => {
    expect(at(131)).toEqual({ year: 131, count: 1, ids: ['silverwing'] });
    expect(at(300)).toEqual({ year: 300, count: 1, ids: ['silverwing'] });
  });

  it('dit ce qui est déduit et ce qui n’est pas compté', () => {
    expect(series.inferred).toEqual(['caraxes']);
    expect(series.unknown).toEqual(['meraxes', 'sans-fin', 'cannibal', 'a-rebours']);
  });

  it('rend une série vide pour un intervalle à l’envers, sans perdre les inconnus', () => {
    const empty = dragonsAlive(DRAGONS, 10, 5);
    expect(empty.points).toEqual([]);
    expect(empty.unknown).toHaveLength(4);
  });
});

describe('reignRibbons', () => {
  const SOVEREIGNS: Sovereign[] = [
    sovereign('aegon-iii', 7, 131, 157),
    sovereign('rhaenyra', null, 129, 130, { contested: true }),
    sovereign('aegon-ii', 6, 129, 131, { contested: true, epithet: loc('l’Aîné', 'the Elder') }),
    sovereign('viserys-i', 5, 103, 129),
  ];
  const ribbons = reignRibbons(SOVEREIGNS);

  it('range les règnes dans l’ordre du temps, le souverain compté avant sa rivale', () => {
    expect(ribbons.map((ribbon) => ribbon.id)).toEqual(['viserys-i', 'aegon-ii', 'rhaenyra', 'aegon-iii']);
  });

  it('met dans un second couloir le règne qui en recouvre un autre', () => {
    expect(ribbons.map((ribbon) => ribbon.lane)).toEqual([0, 0, 1, 0]);
  });

  it('laisse un règne commencer l’année où le précédent s’achève', () => {
    const [viserys, aegon] = ribbons;
    expect(viserys?.to).toBe(aegon?.from);
    expect(aegon?.lane).toBe(viserys?.lane);
  });

  it('reprend les bornes, le rang, la contestation et l’épithète quand il y en a une', () => {
    expect(ribbons[1]).toEqual({
      id: 'aegon-ii',
      ordinal: 6,
      name: loc('aegon-ii'),
      epithet: loc('l’Aîné', 'the Elder'),
      from: 129,
      to: 131,
      contested: true,
      lane: 0,
    });
    expect(ribbons[2]).toMatchObject({ ordinal: null, contested: true });
    expect('epithet' in (ribbons[0] ?? {})).toBe(false);
  });

  it('ne modifie pas le tableau reçu', () => {
    expect(SOVEREIGNS.map((item) => item.id)).toEqual(['aegon-iii', 'rhaenyra', 'aegon-ii', 'viserys-i']);
  });
});

describe('eventsByYear', () => {
  const EVENTS: HistoricalEvent[] = [
    event('couronnement', 129),
    event('serie-1', null, { sortYear: 129.2 }),
    event('serie-2', null, { sortYear: 129.6 }),
    event('mort-de-rhaenyra', 130),
    event('accalmie', 129),
    event('quatorze-flammes', null, { sortYear: -8000 }),
    event('ghis', -4700),
    event('possessions', null, { sortYear: -4600 }),
  ];
  const groups = eventsByYear(EVENTS);

  it('suit le fil du temps et réunit les événements d’une même année', () => {
    expect(groups.map((group) => group.year)).toEqual([null, -4700, null, 129, null, 130]);
    expect(ids(groups[3]?.events ?? [])).toEqual(['couronnement', 'accalmie']);
  });

  it('ne rattache un événement non daté à aucune année : il garde sa place entre les autres', () => {
    expect(ids(groups[0]?.events ?? [])).toEqual(['quatorze-flammes']);
    expect(ids(groups[2]?.events ?? [])).toEqual(['possessions']);
    expect(ids(groups[4]?.events ?? [])).toEqual(['serie-1', 'serie-2']);
    expect(groups[4]?.sortYear).toBe(129.2);
  });

  it('ne perd ni ne duplique aucun événement, et ne modifie pas le tableau reçu', () => {
    expect(groups.flatMap((group) => ids(group.events)).sort()).toEqual(ids(EVENTS).sort());
    expect(EVENTS[0]?.id).toBe('couronnement');
    expect(eventsByYear([])).toEqual([]);
  });
});

describe('lifeSpans', () => {
  const PERSONS: Person[] = [
    person('daenerys', { born: 284, alive: true }),
    person('inconnue'),
    person('aegon-i', { born: -27, died: 37, king: true, reign: [1, 37] }),
    person('aenar', { bornRange: [null, -138], diedRange: [-102, null], dateCertainty: 'approximative' }),
    person('rhaenys', { born: -26, bornRange: [-26, -25], died: 10, dateCertainty: 'approximative' }),
    person('aerys-i', { died: 221, king: true, reign: [209, 221] }),
    person('valaena', { diedRange: [-26, null], dateCertainty: 'approximative' }),
    person('incoherent', { born: 299, died: 298 }),
  ];
  const { spans, undated } = lifeSpans(PERSONS);
  const span = (id: string) => spans.find((item) => item.id === id);

  it('trace d’un trait sûr une vie aux dates exactes', () => {
    expect(span('aegon-i')).toMatchObject({ sure: [-27, 37], extent: [-27, 37], reign: [1, 37], alive: false, certainty: 'exacte' });
    expect(span('aegon-i')?.born).toEqual({ year: -27, earliest: -27, latest: -27 });
  });

  it('borne le trait sûr à la naissance au plus tard et à la mort au plus tôt', () => {
    expect(span('aenar')).toMatchObject({ sure: [-138, -102], extent: [-138, -102] });
    expect(span('aenar')?.born).toEqual({ year: null, earliest: null, latest: -138 });
    expect(span('aenar')?.died).toEqual({ year: null, earliest: -102, latest: null });
    expect(span('rhaenys')).toMatchObject({ sure: [-25, 10], extent: [-26, 10] });
  });

  it('prolonge une personne vivante jusqu’à la fin du récit', () => {
    expect(span('daenerys')).toMatchObject({ sure: [284, NARRATIVE_END], extent: [284, NARRATIVE_END], alive: true });
    expect(lifeSpans(PERSONS, 305).spans.find((item) => item.id === 'daenerys')?.sure).toEqual([284, 305]);
  });

  it('s’appuie sur le règne quand la naissance manque', () => {
    expect(span('aerys-i')).toMatchObject({ sure: [209, 221], extent: [209, 221] });
    expect(span('aerys-i')?.born.earliest).toBeNull();
  });

  it('réduit à un point une vie dont on ne connaît qu’une borne', () => {
    expect(span('valaena')).toMatchObject({ sure: [-26, -26], extent: [-26, -26] });
  });

  it('ne trace pas de trait sûr quand les dates se contredisent', () => {
    expect(span('incoherent')?.sure).toBeNull();
    expect(span('incoherent')?.extent).toEqual([298, 299]);
  });

  it('range à part les personnes sans aucune année et trie les autres par ancienneté', () => {
    expect(undated).toEqual(['inconnue']);
    expect(spans.map((item) => item.id)).toEqual(['aenar', 'aegon-i', 'rhaenys', 'valaena', 'aerys-i', 'daenerys', 'incoherent']);
  });
});

describe('eventDensity', () => {
  const EVENTS: HistoricalEvent[] = [
    event('a', 105),
    event('b', 129),
    event('c', 129),
    event('d', 130),
    event('e', 131),
    event('serie', null, { sortYear: 120.5 }),
    event('regence', 136, { yearEnd: 141 }),
  ];

  it('compte par décennie, tranches vides comprises', () => {
    const buckets = eventDensity(EVENTS, { from: 100, to: 149 });
    expect(buckets.map((bucket) => [bucket.from, bucket.to, bucket.count])).toEqual([
      [100, 110, 1],
      [110, 120, 0],
      [120, 130, 3],
      [130, 140, 3],
      [140, 150, 0],
    ]);
    expect(buckets[2]?.ids).toEqual(['b', 'c', 'serie']);
  });

  it('place un événement non daté d’après sortYear et le signale', () => {
    expect(placementYear(event('serie', null, { sortYear: 120.5 }))).toBe(120);
    expect(placementYear(event('legende', null, { sortYear: -8000 }))).toBe(-8000);
    expect(placementYear(event('date', 129, { sortYear: 129.4 }))).toBe(129);
    expect(eventDensity(EVENTS, { from: 120, to: 129 })[0]).toMatchObject({ count: 3, undated: 1 });
  });

  it('compte un événement qui dure dans la tranche de son début', () => {
    const buckets = eventDensity(EVENTS, { from: 130, to: 149 });
    expect(buckets.map((bucket) => bucket.ids)).toEqual([['d', 'e', 'regence'], []]);
  });

  it('couvre par défaut du premier au dernier événement', () => {
    const buckets = eventDensity(EVENTS);
    expect(buckets[0]?.from).toBe(100);
    expect(buckets[buckets.length - 1]?.from).toBe(130);
    expect(buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(EVENTS.length);
  });

  it('fait tomber les décennies sur les dizaines, avant comme après la Conquête', () => {
    const around = [event('exil', -114), event('fin', -110), event('conquete', -2), event('sacre', 1)];
    const buckets = eventDensity(around, { from: -120, to: 9 });
    const counted = buckets.filter((bucket) => bucket.count > 0).map((bucket) => [bucket.from, bucket.ids]);
    expect(counted).toEqual([
      [-120, ['exil']],
      [-110, ['fin']],
      [-10, ['conquete']],
      [0, ['sacre']],
    ]);
    expect(buckets).toHaveLength(13);
  });

  it('accepte un autre pas et refuse un pas qui ne veut rien dire', () => {
    expect(eventDensity(EVENTS, { step: 50, from: 100, to: 149 }).map((bucket) => bucket.count)).toEqual([7]);
    expect(() => eventDensity(EVENTS, { step: 0 })).toThrow(RangeError);
    expect(() => eventDensity(EVENTS, { step: 2.5 })).toThrow(RangeError);
  });

  it('rend vide une liste vide sans bornes, et des tranches vides si les bornes sont données', () => {
    expect(eventDensity([])).toEqual([]);
    expect(eventDensity([], { from: 1, to: 20 }).map((bucket) => bucket.count)).toEqual([0, 0, 0]);
  });
});
