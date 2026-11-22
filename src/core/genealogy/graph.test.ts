import { describe, expect, it } from 'vitest';

import { makeChild, makePerson, makeUnion, parentage, persons, unions } from './fixtures.ts';
import {
  KIN_UI_KEYS,
  allegedFatherOf,
  ancestorsOf,
  buildGraph,
  childrenOf,
  consanguinity,
  descendantsOf,
  generationsOf,
  inbreedingOf,
  kinship,
  kinshipCoefficient,
  lineBetween,
  parentsOf,
  partnerIn,
  siblingsOf,
  spousesOf,
  unionsOf,
} from './graph.ts';

const graph = buildGraph(persons, unions, parentage);
const ids = (list: readonly { id: string }[]): string[] => list.map((entry) => entry.id);

/** Petite famille construite à la main : deux fondateurs, deux enfants, des cousins. */
function family() {
  const people = [
    makePerson('pere', 'm', 0),
    makePerson('mere', 'f', 0),
    makePerson('fils', 'm', 1),
    makePerson('fille', 'f', 1),
    makePerson('bru', 'f', 1),
    makePerson('gendre', 'm', 1),
    makePerson('cousin', 'm', 2),
    makePerson('cousine', 'f', 2),
    makePerson('demi', 'm', 1),
    makePerson('autre', 'f', 0),
  ];
  const links = [
    makeChild('fils', 'pere', 'mere', 'u1'),
    makeChild('fille', 'pere', 'mere', 'u1'),
    makeChild('cousin', 'fils', 'bru', 'u2'),
    makeChild('cousine', 'gendre', 'fille', 'u3'),
    makeChild('demi', 'pere', 'autre'),
  ];
  const pairs = [makeUnion('u1', 'pere', 'mere'), makeUnion('u2', 'fils', 'bru'), makeUnion('u3', 'gendre', 'fille')];
  return buildGraph(people, pairs, links);
}

describe('buildGraph', () => {
  it('indexe l’extrait sans anomalie', () => {
    expect(graph.issues).toEqual([]);
    expect(graph.persons).toHaveLength(41);
    expect(graph.unions).toHaveLength(18);
    expect(graph.parentage).toHaveLength(33);
  });

  it('range les enfants par fratrie : une par union, une par parent seul', () => {
    const royal = graph.familyById.get('u-aenys-i-alyssa-velaryon');
    expect(royal?.children).toEqual(['rhaena-fille-aenys-i', 'aegon-fils-aenys-i', 'viserys-fils-aenys-i', 'jaehaerys-i', 'alysanne', 'vaella-fille-aenys-i']);
    expect(royal?.parents).toEqual(['aenys-i', 'alyssa-velaryon']);
    const alone = graph.familyOfChild.get('orys-baratheon');
    expect(alone?.unionId).toBeNull();
    expect(alone?.parents).toEqual(['aerion-peyredragon']);
    expect(graph.familiesOfParent.get('aegon-i')?.map((entry) => entry.id)).toEqual(['u-aegon-i-rhaenys', 'u-aegon-i-visenya']);
  });

  it('ignore et signale une référence vers une personne absente', () => {
    const partial = buildGraph([makePerson('a'), makePerson('b', 'f')], [makeUnion('u', 'a', 'fantome')], [makeChild('b', 'a', 'fantome'), makeChild('fantome', 'a', null)]);
    expect(partial.issues.map((issue) => issue.kind)).toEqual(['personne-inconnue', 'personne-inconnue', 'personne-inconnue']);
    expect(partial.unions).toHaveLength(0);
    expect(ids(parentsOf(partial, 'b'))).toEqual(['a']);
  });

  it('garde la première déclaration d’un doublon', () => {
    const twice = buildGraph([makePerson('a', 'm', 0), makePerson('a', 'f', 3)], [], []);
    expect(twice.persons).toHaveLength(1);
    expect(twice.personById.get('a')?.sex).toBe('m');
    expect(twice.issues.map((issue) => issue.kind)).toEqual(['doublon']);
  });

  it('coupe un cycle de filiation au lieu de tourner sans fin', () => {
    const looped = buildGraph([makePerson('a'), makePerson('b'), makePerson('c')], [], [makeChild('a', 'b', null), makeChild('b', 'c', null), makeChild('c', 'a', null)]);
    expect(looped.issues.filter((issue) => issue.kind === 'cycle')).toHaveLength(1);
    expect(ancestorsOf(looped, 'a').length).toBeLessThan(3);
    expect(Math.max(...looped.depth.values())).toBe(2);
  });
});

describe('voisinage immédiat', () => {
  it('donne les parents, père d’abord', () => {
    expect(ids(parentsOf(graph, 'aegon-i'))).toEqual(['aerion-peyredragon', 'valaena-velaryon']);
    expect(parentsOf(graph, 'valaena-velaryon')).toEqual([]);
    expect(parentsOf(graph, 'inconnu')).toEqual([]);
  });

  it('donne les enfants de toutes les unions', () => {
    expect(ids(childrenOf(graph, 'aegon-i'))).toEqual(['aenys-i', 'maegor-i']);
    expect(ids(childrenOf(graph, 'aerion-peyredragon'))).toEqual(['orys-baratheon', 'visenya', 'aegon-i', 'rhaenys']);
  });

  it('donne les conjoints dans l’ordre des unions', () => {
    expect(ids(spousesOf(graph, 'aegon-i'))).toEqual(['visenya', 'rhaenys']);
    expect(ids(spousesOf(graph, 'rhaena-fille-aenys-i'))).toEqual(['aegon-fils-aenys-i', 'maegor-i']);
    expect(unionsOf(graph, 'rhaenyra').map((union) => partnerIn(union, 'rhaenyra')).sort()).toEqual(['daemon', 'harwin-strong', 'laenor-velaryon']);
  });

  it('distingue frères et sœurs de mêmes parents et demi-fratrie', () => {
    const ofAegon = siblingsOf(graph, 'aegon-i');
    expect(ofAegon.map((sibling) => [sibling.person.id, sibling.kind])).toEqual([
      ['orys-baratheon', 'half'],
      ['visenya', 'full'],
      ['rhaenys', 'full'],
    ]);
    // La mère d'Orys est inconnue : la demi-fratrie est une supposition des sources.
    expect(ofAegon[0]?.assumed).toBe(true);
    expect(ofAegon[1]?.shared).toEqual(['aerion-peyredragon', 'valaena-velaryon']);

    const ofJocelyn = siblingsOf(graph, 'jocelyn-baratheon');
    expect(ofJocelyn.filter((sibling) => sibling.kind === 'full').map((sibling) => sibling.person.id)).toEqual(['boremund-baratheon']);
    const half = ofJocelyn.filter((sibling) => sibling.kind === 'half');
    expect(half).toHaveLength(6);
    expect(half.every((sibling) => sibling.shared.length === 1 && sibling.shared[0] === 'alyssa-velaryon' && !sibling.assumed)).toBe(true);
  });

  it('retrouve le père allégué sans le mêler à la filiation', () => {
    expect(allegedFatherOf(graph, 'jacaerys-velaryon')?.id).toBe('harwin-strong');
    expect(ids(parentsOf(graph, 'jacaerys-velaryon'))).toEqual(['laenor-velaryon', 'rhaenyra']);
    expect(kinship(graph, 'harwin-strong', 'jacaerys-velaryon').relation).toBe('none');
    expect(allegedFatherOf(graph, 'aegon-i')).toBeNull();
  });
});

describe('ascendance et descendance', () => {
  it('ne compte qu’une fois un ancêtre atteint par plusieurs branches', () => {
    const ancestors = ancestorsOf(graph, 'rhaenyra');
    expect(ancestors.slice(0, 2).map((entry) => entry.person.id)).toEqual(['viserys-i', 'aemma-arryn']);
    const jaehaerys = ancestors.filter((entry) => entry.person.id === 'jaehaerys-i');
    expect(jaehaerys).toHaveLength(1);
    expect(jaehaerys[0]?.distance).toBe(3);
    expect(new Set(ancestors.map((entry) => entry.person.id)).size).toBe(ancestors.length);
    for (let i = 1; i < ancestors.length; i += 1) expect(ancestors[i]?.distance).toBeGreaterThanOrEqual(ancestors[i - 1]?.distance ?? 0);
  });

  it('descend toutes les branches', () => {
    const descendants = descendantsOf(graph, 'aerion-peyredragon');
    expect(descendants.find((entry) => entry.person.id === 'aegon-iii')?.distance).toBe(6);
    expect(descendants.some((entry) => entry.person.id === 'valaena-velaryon')).toBe(false);
    expect(descendantsOf(graph, 'aegon-iii')).toEqual([]);
    expect(ancestorsOf(graph, 'inconnu')).toEqual([]);
  });
});

describe('lineBetween', () => {
  it('monte à l’ancêtre commun le plus proche puis redescend', () => {
    const line = lineBetween(graph, 'rhaenyra', 'daemon');
    expect(line?.ids).toEqual(['rhaenyra', 'viserys-i', 'baelon-fils-jaehaerys-i', 'daemon']);
    expect(line?.up).toBe(2);
    expect(line?.down).toBe(1);
    expect(line?.apexes).toEqual(['baelon-fils-jaehaerys-i', 'alyssa-fille-jaehaerys-i']);
  });

  it('suit la ligne directe entre un ancêtre et son descendant', () => {
    const down = lineBetween(graph, 'aegon-i', 'aegon-iii');
    expect(down?.up).toBe(0);
    expect(down?.down).toBe(5);
    expect(down?.ids).toEqual(['aegon-i', 'aenys-i', 'jaehaerys-i', 'baelon-fils-jaehaerys-i', 'daemon', 'aegon-iii']);
    const up = lineBetween(graph, 'aegon-iii', 'aegon-i');
    expect(up?.up).toBe(5);
    expect(up?.down).toBe(0);
  });

  it('chaque pas du chemin est une filiation', () => {
    const line = lineBetween(graph, 'aerea', 'visenya-fille-rhaenyra');
    expect(line).not.toBeNull();
    const path = line?.ids ?? [];
    for (let i = 0; i + 1 < path.length; i += 1) {
      const a = path[i] ?? '';
      const b = path[i + 1] ?? '';
      const linked = (graph.parentIds.get(a) ?? []).includes(b) || (graph.parentIds.get(b) ?? []).includes(a);
      expect(linked).toBe(true);
    }
  });

  it('ne confond pas alliance et filiation', () => {
    expect(lineBetween(graph, 'valaena-velaryon', 'ceryse-hightower')).toBeNull();
    expect(lineBetween(graph, 'aenys-i', 'alyssa-velaryon')).toBeNull();
    expect(lineBetween(graph, 'aegon-i', 'inconnu')).toBeNull();
    expect(lineBetween(graph, 'aegon-i', 'aegon-i')?.ids).toEqual(['aegon-i']);
  });
});

describe('kinship', () => {
  it('nomme la sœur épouse : lien de sang et union à la fois', () => {
    const link = kinship(graph, 'aegon-i', 'visenya');
    expect(link.relation).toBe('sibling');
    expect(link.key).toBe('kin.sibling.f');
    expect(link.degree).toBe(2);
    expect(link.half).toBe(false);
    expect(link.unionRelation).toBe('spouse');
    expect(link.unionKey).toBe('kin.spouse.f');
    expect(link.union?.id).toBe('u-aegon-i-visenya');
  });

  it('nomme l’oncle et la nièce dans les deux sens', () => {
    const uncle = kinship(graph, 'rhaenyra', 'daemon');
    expect(uncle.relation).toBe('uncleAunt');
    expect(uncle.key).toBe('kin.uncleAunt.m');
    expect([uncle.up, uncle.down, uncle.degree, uncle.canonDegree]).toEqual([2, 1, 3, 2]);
    const niece = kinship(graph, 'daemon', 'rhaenyra');
    expect(niece.relation).toBe('nephewNiece');
    expect(niece.key).toBe('kin.nephewNiece.f');
    expect(niece.unionKey).toBe('kin.spouse.f');
  });

  it('nomme les cousins germains', () => {
    const link = kinship(graph, 'viserys-i', 'aemma-arryn');
    expect(link.relation).toBe('firstCousin');
    expect(link.key).toBe('kin.firstCousin.f');
    expect(link.vars).toEqual({ degree: 4, up: 2, down: 2, cousinDegree: 1, removed: 0 });
    expect(link.half).toBe(false);
  });

  it('marque les liens par un seul ancêtre commun', () => {
    expect(kinship(graph, 'aegon-i', 'orys-baratheon').relation).toBe('halfSibling');
    // Jocelyn Baratheon est la demi-sœur de Jaehaerys Ier par leur mère : la demi-tante d'Aemon.
    const aunt = kinship(graph, 'aemon-fils-jaehaerys-i', 'jocelyn-baratheon');
    expect(aunt.relation).toBe('uncleAunt');
    expect(aunt.half).toBe(true);
    expect(aunt.apexes).toEqual(['alyssa-velaryon']);
    // Maegor et Aenys n'ont que leur père en commun.
    const niece = kinship(graph, 'maegor-i', 'rhaena-fille-aenys-i');
    expect(niece.relation).toBe('nephewNiece');
    expect(niece.half).toBe(true);
    expect(niece.unionRelation).toBe('spouse');
  });

  it('nomme la ligne directe', () => {
    expect(kinship(graph, 'jaehaerys-i', 'aegon-i').key).toBe('kin.grandparent.m');
    expect(kinship(graph, 'aegon-i', 'jaehaerys-i').key).toBe('kin.grandchild.m');
    expect(kinship(graph, 'aenys-i', 'rhaenys').key).toBe('kin.parent.f');
    expect(kinship(graph, 'rhaenys', 'aenys-i').key).toBe('kin.child.m');
    expect(kinship(graph, 'aegon-iii', 'aegon-i').relation).toBe('ancestor');
    expect(kinship(graph, 'aegon-i', 'aegon-iii').relation).toBe('descendant');
  });

  it('rend « aucun lien » sans ancêtre commun, et garde l’union', () => {
    const none = kinship(graph, 'valaena-velaryon', 'ceryse-hightower');
    expect(none.relation).toBe('none');
    expect(none.key).toBe('kin.none');
    expect(none.degree).toBeNull();
    expect(none.line).toEqual([]);
    const married = kinship(graph, 'aenys-i', 'alyssa-velaryon');
    expect(married.relation).toBe('none');
    expect(married.unionKey).toBe('kin.spouse.f');
    const lovers = kinship(graph, 'rhaenyra', 'harwin-strong');
    expect(lovers.unionRelation).toBe('lover');
    expect(kinship(graph, 'aegon-i', 'aegon-i').key).toBe('kin.self');
  });

  it('ne rend que des clés déclarées dans KIN_UI_KEYS', () => {
    const known = new Set(KIN_UI_KEYS);
    for (const a of persons) {
      for (const b of persons) {
        const link = kinship(graph, a.id, b.id);
        expect(known.has(link.key)).toBe(true);
        if (link.unionKey !== null) expect(known.has(link.unionKey)).toBe(true);
      }
    }
    expect(new Set(KIN_UI_KEYS).size).toBe(KIN_UI_KEYS.length);
  });

  it('nomme oncles, cousins et cousins éloignés sur une famille simple', () => {
    const simple = family();
    expect(kinship(simple, 'cousin', 'cousine').relation).toBe('firstCousin');
    expect(kinship(simple, 'cousin', 'fille').key).toBe('kin.uncleAunt.f');
    expect(kinship(simple, 'fille', 'cousin').key).toBe('kin.nephewNiece.m');
    expect(kinship(simple, 'fils', 'demi').relation).toBe('halfSibling');
    const halfUncle = kinship(simple, 'cousin', 'demi');
    expect(halfUncle.relation).toBe('uncleAunt');
    expect(halfUncle.half).toBe(true);
    expect(kinship(simple, 'bru', 'gendre').relation).toBe('none');
  });
});

describe('consanguinité', () => {
  it('donne les coefficients classiques', () => {
    const simple = family();
    expect(kinshipCoefficient(simple, 'fils', 'fille')).toBe(0.25);
    expect(kinshipCoefficient(simple, 'pere', 'fils')).toBe(0.25);
    expect(kinshipCoefficient(simple, 'fils', 'demi')).toBe(0.125);
    expect(kinshipCoefficient(simple, 'cousin', 'fille')).toBe(0.125);
    expect(kinshipCoefficient(simple, 'cousin', 'cousine')).toBe(0.0625);
    expect(kinshipCoefficient(simple, 'pere', 'mere')).toBe(0);
    expect(kinshipCoefficient(simple, 'pere', 'pere')).toBe(0.5);
    expect(kinshipCoefficient(simple, 'pere', 'inconnu')).toBe(0);
  });

  it('reconnaît les unions entre proches et leur degré', () => {
    const sisters = consanguinity(graph, { partners: ['aegon-i', 'visenya'] });
    expect(sisters.consanguineous).toBe(true);
    expect(sisters.kinship.relation).toBe('sibling');
    expect(sisters.coefficient).toBe(0.25);

    const uncle = graph.unionById.get('u-daemon-rhaenyra');
    expect(uncle).toBeDefined();
    if (uncle) {
      const result = consanguinity(graph, uncle);
      expect(result.consanguineous).toBe(true);
      expect(result.kinship.relation).toBe('nephewNiece');
      // Les mariages répétés entre proches portent le coefficient au-delà de celui d'un oncle et d'une nièce ordinaires.
      expect(result.coefficient).toBeGreaterThan(0.125);
    }

    const outsider = consanguinity(graph, { partners: ['aenys-i', 'alyssa-velaryon'] });
    expect(outsider.consanguineous).toBe(false);
    expect(outsider.coefficient).toBe(0);
  });

  it('additionne les boucles de consanguinité', () => {
    expect(inbreedingOf(graph, 'aegon-i')).toBe(0);
    // Aenys Ier : parents frère et sœur, grands-parents sans lien connu.
    expect(inbreedingOf(graph, 'aenys-i')).toBe(0.25);
    expect(inbreedingOf(graph, 'jaehaerys-i')).toBe(0);
    // Baelon : parents frère et sœur dont le père (Aenys) est lui-même consanguin à 0,25.
    expect(inbreedingOf(graph, 'baelon-fils-jaehaerys-i')).toBe(0.28125);
    expect(inbreedingOf(graph, 'orys-baratheon')).toBe(0);
  });

  it('compte les unions consanguines de l’extrait', () => {
    const close = unions.filter((union) => consanguinity(graph, union).consanguineous).map((union) => union.id);
    expect(close).toEqual([
      'u-aegon-i-visenya',
      'u-aegon-i-rhaenys',
      'u-aegon-fils-aenys-i-rhaena-fille-aenys-i',
      'u-maegor-i-rhaena-fille-aenys-i',
      'u-jaehaerys-i-alysanne',
      'u-aemon-fils-jaehaerys-i-jocelyn-baratheon',
      'u-baelon-fils-jaehaerys-i-alyssa-fille-jaehaerys-i',
      'u-viserys-i-aemma-arryn',
      'u-rhaenyra-laenor-velaryon',
      'u-daemon-laena-velaryon',
      'u-daemon-rhaenyra',
    ]);
  });
});

describe('generationsOf', () => {
  it('retrouve les générations de la source, à l’origine près', () => {
    const computed = generationsOf(graph);
    for (const person of persons) expect([person.id, computed.get(person.id)]).toEqual([person.id, person.generation - 5]);
  });
});
