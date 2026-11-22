import { describe, expect, it } from 'vitest';

import { parentage, persons, unions } from './fixtures.ts';
import { focusOn } from './focus.ts';
import { buildGraph } from './graph.ts';

const graph = buildGraph(persons, unions, parentage);

describe('focusOn', () => {
  it('rend null pour une personne inconnue', () => {
    expect(focusOn(graph, 'inconnu')).toBeNull();
  });

  it('rassemble parents, grands-parents, fratrie, unions et enfants', () => {
    const view = focusOn(graph, 'rhaenyra');
    expect(view).not.toBeNull();
    if (!view) return;
    expect(view.person.id).toBe('rhaenyra');
    expect(view.parents.map((parent) => [parent.person.id, parent.role])).toEqual([
      ['viserys-i', 'father'],
      ['aemma-arryn', 'mother'],
    ]);
    expect(view.parentsUnion?.id).toBe('u-viserys-i-aemma-arryn');
    expect(view.parentsConsanguinity?.kinship.relation).toBe('firstCousin');
    expect(view.grandparents.map((entry) => [entry.person.id, entry.via])).toEqual([
      ['baelon-fils-jaehaerys-i', ['father']],
      ['alyssa-fille-jaehaerys-i', ['father']],
      ['rodrik-arryn', ['mother']],
      ['daella-fille-jaehaerys-i', ['mother']],
    ]);
    expect(view.siblings.map((sibling) => [sibling.person.id, sibling.kind])).toEqual([['baelon-fils-viserys-i', 'full']]);
    expect(view.allegedFather).toBeNull();
    expect(view.inbreeding).toBeGreaterThan(0.0625);
  });

  it('range les unions par année connue et attache les enfants à leur couple', () => {
    const view = focusOn(graph, 'rhaenyra');
    if (!view) throw new Error('vue attendue');
    const byPartner = new Map(view.unions.map((entry) => [entry.partner?.id, entry]));
    expect([...byPartner.keys()].sort()).toEqual(['daemon', 'harwin-strong', 'laenor-velaryon']);
    const order = view.unions.map((entry) => entry.partner?.id);
    expect(order.indexOf('laenor-velaryon')).toBeLessThan(order.indexOf('daemon'));
    expect(byPartner.get('laenor-velaryon')?.children.map((child) => child.id)).toEqual(['jacaerys-velaryon']);
    expect(byPartner.get('daemon')?.children.map((child) => child.id)).toEqual(['aegon-iii', 'viserys-ii', 'visenya-fille-rhaenyra']);
    expect(byPartner.get('harwin-strong')?.children).toEqual([]);
    expect(byPartner.get('harwin-strong')?.union?.type).toBe('liaison');
    // Vu depuis Rhaenyra, Daemon est son oncle.
    expect(byPartner.get('daemon')?.consanguinity?.kinship.relation).toBe('uncleAunt');
    expect(byPartner.get('harwin-strong')?.consanguinity?.consanguineous).toBe(false);
  });

  it('ne compte qu’une fois les grands-parents quand les parents sont frère et sœur', () => {
    const view = focusOn(graph, 'aenys-i');
    expect(view?.grandparents.map((entry) => [entry.person.id, entry.via])).toEqual([
      ['aerion-peyredragon', ['father', 'mother']],
      ['valaena-velaryon', ['father', 'mother']],
    ]);
    expect(view?.parentsConsanguinity?.kinship.relation).toBe('sibling');
    expect(view?.inbreeding).toBe(0.25);
  });

  it('montre les deux sœurs épouses avec leurs enfants respectifs', () => {
    const view = focusOn(graph, 'aegon-i');
    expect(view?.unions.map((entry) => [entry.partner?.id, entry.children.map((child) => child.id)])).toEqual([
      ['visenya', ['maegor-i']],
      ['rhaenys', ['aenys-i']],
    ]);
    expect(view?.unions.every((entry) => entry.consanguinity?.consanguineous)).toBe(true);
  });

  it('garde les enfants nés hors de toute union enregistrée', () => {
    const view = focusOn(graph, 'aerion-peyredragon');
    expect(view?.parents).toEqual([]);
    expect(view?.parentage).toBeNull();
    expect(view?.unions).toHaveLength(2);
    const [married, alone] = view?.unions ?? [];
    expect(married?.partner?.id).toBe('valaena-velaryon');
    expect(married?.children.map((child) => child.id)).toEqual(['visenya', 'aegon-i', 'rhaenys']);
    expect(alone?.partner).toBeNull();
    expect(alone?.union).toBeNull();
    expect(alone?.consanguinity).toBeNull();
    expect(alone?.children.map((child) => child.id)).toEqual(['orys-baratheon']);
  });

  it('porte la certitude de la filiation et le père allégué', () => {
    const orys = focusOn(graph, 'orys-baratheon');
    expect(orys?.parents.map((parent) => [parent.person.id, parent.role])).toEqual([['aerion-peyredragon', 'father']]);
    expect(orys?.parentage?.certainty).toBe('legende');
    expect(orys?.parentsUnion).toBeNull();
    expect(orys?.parentsConsanguinity).toBeNull();
    expect(orys?.unions).toEqual([]);

    const jacaerys = focusOn(graph, 'jacaerys-velaryon');
    expect(jacaerys?.allegedFather?.id).toBe('harwin-strong');
    expect(jacaerys?.parentage?.certainty).toBe('contradictoire');
    expect(jacaerys?.parents.map((parent) => parent.person.id)).toEqual(['laenor-velaryon', 'rhaenyra']);
  });

  it('donne la demi-fratrie avec son parent commun', () => {
    const view = focusOn(graph, 'boremund-baratheon');
    const half = view?.siblings.filter((sibling) => sibling.kind === 'half') ?? [];
    expect(half.map((sibling) => sibling.person.id)).toContain('jaehaerys-i');
    expect(half.every((sibling) => sibling.shared[0] === 'alyssa-velaryon')).toBe(true);
  });
});
