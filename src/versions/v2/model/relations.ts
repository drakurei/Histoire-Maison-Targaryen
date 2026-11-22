/**
 * Les quatre rangées du cartel (sang, dragon, guerre, lieu) et les années d'une entité.
 *
 * DÉPENDANCE D5 DE LA SPÉCIFICATION (v2-spec.md §9) : `relationsOf` et `entityYears`. Fonctions
 * pures, testées (relations.test.ts), qui reçoivent tous les registres en argument ; elles
 * vivent ici en attendant d'être remontées dans `@/core/content` ou `@/core/timeline`.
 *
 * Rien n'est déduit au-delà des registres : une relation est un lien écrit dans les données
 * (filiation, union, monte, mention dans un événement, engagement dans une bataille).
 */
import type { Battle, Dragon, HistoricalEvent, Localized, Parentage, Person, Place, Union, War } from '@/core/content/types';

export type RelationKind = 'person' | 'dragon' | 'war' | 'battle' | 'place' | 'event';

export interface RelatedEntity {
  kind: RelationKind;
  id: string;
  name: Localized;
}

export interface Relations {
  blood: RelatedEntity[];
  dragon: RelatedEntity[];
  war: RelatedEntity[];
  place: RelatedEntity[];
}

export interface Registry {
  persons: readonly Person[];
  unions: readonly Union[];
  parentage: readonly Parentage[];
  dragons: readonly Dragon[];
  events: readonly HistoricalEvent[];
  wars: readonly War[];
  places: readonly Place[];
}

/** Liste sans doublon, dans l'ordre d'arrivée. */
function unique(items: readonly RelatedEntity[]): RelatedEntity[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.kind}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function index<T extends { id: string }>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function bySort(a: HistoricalEvent, b: HistoricalEvent): number {
  return a.sortYear - b.sortYear;
}

/** Index des registres, calculé une fois. */
export function prepareRegistry(registry: Registry) {
  const persons = index(registry.persons);
  const dragons = index(registry.dragons);
  const places = index(registry.places);
  const wars = index(registry.wars);
  const battles = new Map<string, Battle>();
  for (const war of registry.wars) for (const battle of war.battles) battles.set(battle.id, battle);
  const events = index(registry.events);
  const warOfEvent = new Map<string, War[]>();
  for (const war of registry.wars) {
    for (const eventId of war.eventIds) warOfEvent.set(eventId, [...(warOfEvent.get(eventId) ?? []), war]);
  }
  return { registry, persons, dragons, places, wars, battles, events, warOfEvent };
}

export type PreparedRegistry = ReturnType<typeof prepareRegistry>;

function person(prepared: PreparedRegistry, id: string | null | undefined): RelatedEntity[] {
  const found = id ? prepared.persons.get(id) : undefined;
  return found ? [{ kind: 'person', id: found.id, name: found.name }] : [];
}

function dragonRef(prepared: PreparedRegistry, id: string | undefined): RelatedEntity[] {
  const found = id ? prepared.dragons.get(id) : undefined;
  return found ? [{ kind: 'dragon', id: found.id, name: found.name }] : [];
}

function placeRef(prepared: PreparedRegistry, id: string | undefined): RelatedEntity[] {
  const found = id ? prepared.places.get(id) : undefined;
  return found ? [{ kind: 'place', id: found.id, name: found.name }] : [];
}

function warRef(war: War): RelatedEntity {
  return { kind: 'war', id: war.id, name: war.title };
}

function battleRef(battle: Battle): RelatedEntity {
  return { kind: 'battle', id: battle.id, name: battle.name };
}

/** Ce que disent ensemble des événements : personnes, dragons, lieux, guerres. */
function fromEvents(prepared: PreparedRegistry, events: readonly HistoricalEvent[]): Relations {
  const sorted = [...events].sort(bySort);
  return {
    blood: sorted.flatMap((event) => event.people.flatMap((ref) => person(prepared, ref.id))),
    dragon: sorted.flatMap((event) => event.dragons.flatMap((ref) => dragonRef(prepared, ref.id))),
    war: sorted.flatMap((event) => (prepared.warOfEvent.get(event.id) ?? []).map(warRef)),
    place: sorted.flatMap((event) => event.places.flatMap((ref) => placeRef(prepared, ref.id))),
  };
}

function eventsWith(prepared: PreparedRegistry, test: (event: HistoricalEvent) => boolean): HistoricalEvent[] {
  return prepared.registry.events.filter(test);
}

function merge(...parts: Partial<Relations>[]): Relations {
  return {
    blood: unique(parts.flatMap((part) => part.blood ?? [])),
    dragon: unique(parts.flatMap((part) => part.dragon ?? [])),
    war: unique(parts.flatMap((part) => part.war ?? [])),
    place: unique(parts.flatMap((part) => part.place ?? [])),
  };
}

function personRelations(prepared: PreparedRegistry, id: string): Relations {
  const { registry } = prepared;
  const own = registry.parentage.find((entry) => entry.child === id);
  const parents = [...person(prepared, own?.father), ...person(prepared, own?.mother)];
  const partners = registry.unions
    .filter((union) => union.partners.includes(id))
    .flatMap((union) => person(prepared, union.partners[0] === id ? union.partners[1] : union.partners[0]));
  const children = registry.parentage
    .filter((entry) => entry.father === id || entry.mother === id)
    .flatMap((entry) => person(prepared, entry.child));
  const ridden = registry.dragons
    .filter((dragon) => dragon.riders.some((rider) => rider.personId === id))
    .map((dragon): RelatedEntity => ({ kind: 'dragon', id: dragon.id, name: dragon.name }));
  const led = registry.wars
    .filter((war) => war.belligerents.some((side) => side.leaders.some((leader) => leader.id === id)))
    .map(warRef);
  const events = fromEvents(
    prepared,
    eventsWith(prepared, (event) => event.people.some((ref) => ref.id === id)),
  );
  const blood = [...parents, ...partners, ...children].filter((entry) => entry.id !== id);
  return merge({ blood }, { dragon: ridden }, { war: led }, { dragon: events.dragon, war: events.war, place: events.place });
}

function dragonRelations(prepared: PreparedRegistry, id: string): Relations {
  const dragon = prepared.dragons.get(id);
  if (!dragon) return merge();
  const riders = dragon.riders.flatMap((rider) => person(prepared, rider.personId));
  const fought = dragon.battleIds.flatMap((battleId) => {
    const battle = prepared.battles.get(battleId);
    return battle ? [battle] : [];
  });
  const events = fromEvents(
    prepared,
    eventsWith(prepared, (event) => event.dragons.some((ref) => ref.id === id) || dragon.eventIds.includes(event.id)),
  );
  return merge(
    { blood: riders },
    {
      dragon: fought.flatMap((battle) => battle.dragons.flatMap((engaged) => dragonRef(prepared, engaged.dragonId))).filter((entry) => entry.id !== id),
      war: fought.flatMap((battle) => {
        const war = prepared.wars.get(battle.warId);
        return war ? [warRef(war)] : [];
      }),
      place: fought.flatMap((battle) => placeRef(prepared, battle.placeId)),
    },
    { blood: events.blood, war: events.war, place: events.place },
  );
}

function placeRelations(prepared: PreparedRegistry, id: string): Relations {
  const place = prepared.places.get(id);
  if (!place) return merge();
  const battles = [...prepared.battles.values()].filter((battle) => battle.placeId === id || place.battleIds.includes(battle.id));
  const events = fromEvents(
    prepared,
    eventsWith(prepared, (event) => event.places.some((ref) => ref.id === id) || place.eventIds.includes(event.id)),
  );
  return merge(
    { blood: events.blood, dragon: events.dragon, war: events.war },
    {
      dragon: battles.flatMap((battle) => battle.dragons.flatMap((engaged) => dragonRef(prepared, engaged.dragonId))),
      war: battles.map(battleRef),
    },
  );
}

function warRelations(prepared: PreparedRegistry, id: string): Relations {
  const war = prepared.wars.get(id);
  if (!war) return merge();
  return merge({
    blood: war.belligerents.flatMap((side) => side.leaders.flatMap((leader) => person(prepared, leader.id))),
    dragon: war.battles.flatMap((battle) => battle.dragons.flatMap((engaged) => dragonRef(prepared, engaged.dragonId))),
    war: war.battles.map(battleRef),
    place: war.battles.flatMap((battle) => placeRef(prepared, battle.placeId)),
  });
}

function battleRelations(prepared: PreparedRegistry, id: string): Relations {
  const battle = prepared.battles.get(id);
  if (!battle) return merge();
  const war = prepared.wars.get(battle.warId);
  const sides = war?.belligerents.filter((side) => battle.sides.includes(side.id)) ?? [];
  return merge({
    blood: sides.flatMap((side) => side.leaders.flatMap((leader) => person(prepared, leader.id))),
    dragon: battle.dragons.flatMap((engaged) => dragonRef(prepared, engaged.dragonId)),
    war: war ? [warRef(war)] : [],
    place: placeRef(prepared, battle.placeId),
  });
}

function eventRelations(prepared: PreparedRegistry, id: string): Relations {
  const event = prepared.events.get(id);
  return event ? merge(fromEvents(prepared, [event])) : merge();
}

/** Les quatre rangées du cartel, toujours dans cet ordre : sang, dragon, guerre, lieu. */
export function relationsOf(prepared: PreparedRegistry, kind: RelationKind, id: string): Relations {
  switch (kind) {
    case 'person':
      return personRelations(prepared, id);
    case 'dragon':
      return dragonRelations(prepared, id);
    case 'place':
      return placeRelations(prepared, id);
    case 'war':
      return warRelations(prepared, id);
    case 'battle':
      return battleRelations(prepared, id);
    case 'event':
      return eventRelations(prepared, id);
  }
}

/** Années ponctuelles d'un lieu : ses événements et ses batailles datés (encoches de la fasce). */
export function placeYears(prepared: PreparedRegistry, id: string): number[] {
  const place = prepared.places.get(id);
  if (!place) return [];
  const years = [
    ...prepared.registry.events
      .filter((event) => event.places.some((ref) => ref.id === id) || place.eventIds.includes(event.id))
      .map((event) => event.year),
    ...[...prepared.battles.values()]
      .filter((battle) => battle.placeId === id || place.battleIds.includes(battle.id))
      .map((battle) => battle.year),
  ];
  return [...new Set(years.filter((year): year is number => year !== null))].sort((a, b) => a - b);
}

/* ------------------------------------------------------------------ âge à l'année (D11) */

/** Années écoulées de `from` à `to`, sans an 0. */
export function yearsBetween(from: number, to: number): number {
  return to - from - (from < 0 && to > 0 ? 1 : 0);
}

export type AgeAt =
  | { state: 'unborn' }
  | { state: 'alive'; age: number; approx: boolean }
  | { state: 'dead'; since: number };

/**
 * L'âge d'une personne à une année, ou sa mort depuis tant d'années. `null` quand rien ne
 * permet de le dire (naissance inconnue pour un vivant) : jamais un âge inventé.
 */
export function ageAt(person: Person, year: number): AgeAt | null {
  const born = person.born ?? person.bornRange?.[0] ?? null;
  const died = person.died ?? person.diedRange?.[1] ?? null;
  if (died !== null && year > died) return { state: 'dead', since: yearsBetween(died, year) };
  if (born === null) return null;
  if (year < born) return { state: 'unborn' };
  const approx = person.born === null || person.dateCertainty !== 'exacte';
  return { state: 'alive', age: yearsBetween(born, year), approx };
}
