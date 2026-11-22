import { describe, expect, it } from 'vitest';

import { mainThread, parentage, persons, sovereigns, unions } from '@/core/content/people';
import { periods } from '@/core/content/timeline';
import { buildGraph } from '@/core/genealogy';
import { lifeSpans } from '@/core/timeline';

import { groupesVies } from './groupesVies';
import type { Ligne, ModelePal } from './modelePal';
import { idsOfLigne, modelePal } from './modelePal';
import { nomCourt } from './nomCourt';

const graph = buildGraph(persons, unions, parentage);
const threadByGeneration = new Map(mainThread.map((id) => [graph.personById.get(id)?.generation ?? -1, id]));
const rank = new Map(mainThread.map((id, index) => [id, index]));

function model(id: string): ModelePal {
  const result = modelePal(graph, id, threadByGeneration, rank);
  if (!result) throw new Error(`modèle absent pour ${id}`);
  return result;
}

function shownIds(result: ModelePal): string[] {
  return result.rangees.flatMap((rangee) => rangee.lignes.flatMap((ligne: Ligne) => idsOfLigne(ligne)));
}

describe('modelePal', () => {
  it('rend null pour une personne inconnue', () => {
    expect(modelePal(graph, 'personne', threadByGeneration, rank)).toBeNull();
  });

  it("n'écrit jamais une personne deux fois, même quand le sang se referme", () => {
    for (const person of persons) {
      const ids = shownIds(model(person.id));
      expect(new Set(ids).size, person.id).toBe(ids.length);
    }
  });

  it('range Rhaenyra : parents, trois unions, enfants par union, et le fil qui passe par Viserys II', () => {
    const result = model('rhaenyra');
    const row = (generation: number) => result.rangees.find((rangee) => rangee.generation === generation);
    expect(row(11)?.lignes[0]?.kind).toBe('centre');
    expect(row(11)?.lignes.filter((ligne) => ligne.kind === 'conjoint')).toHaveLength(3);
    const daemon = row(11)?.lignes.find((ligne) => ligne.kind === 'conjoint' && ligne.person?.id === 'daemon');
    expect(daemon && daemon.kind === 'conjoint' && daemon.anneau.sang).toBe(true);
    expect(row(12)?.lignes.filter((ligne) => ligne.kind === 'enfants')).toHaveLength(2);
    expect(shownIds(result)).toContain('viserys-ii');
    // Chaque groupe d'enfants descend d'un anneau du bloc.
    for (const descente of result.descentes.filter((entry) => entry.to.startsWith('g:'))) expect(descente.from.startsWith('ring:')).toBe(true);
  });

  it("met en tête le porteur du fil d'un couple de parents", () => {
    const result = model('viserys-ii');
    const parents = result.rangees.find((rangee) => rangee.lignes.some((ligne) => ligne.kind === 'tete' && ligne.role === 'parent'));
    const head = parents?.lignes.find((ligne) => ligne.kind === 'tete');
    expect(head && head.kind === 'tete' ? head.person.id : null).toBe('rhaenyra');
  });
});

describe('groupesVies', () => {
  it('garde toutes les vies, dans l’ordre de naissance, sans groupe de plus de trente', () => {
    const { spans } = lifeSpans(persons);
    const groups = groupesVies(spans, periods, sovereigns);
    expect(groups.flatMap((group) => group.spans).map((span) => span.id)).toEqual(spans.map((span) => span.id));
    for (const group of groups) expect(group.spans.length, group.key).toBeLessThanOrEqual(30);
  });
});

describe('nomCourt', () => {
  it('ôte la Maison Targaryen et met la précision à part', () => {
    const baelon = graph.personById.get('baelon-fils-jaehaerys-i');
    if (!baelon) throw new Error('Baelon absent');
    expect(nomCourt(baelon, 'Baelon Targaryen (fils de Jaehaerys Ier)')).toEqual({ nom: 'Baelon', precision: 'fils de Jaehaerys Ier' });
    const aemma = graph.personById.get('aemma-arryn');
    if (!aemma) throw new Error('Aemma absente');
    expect(nomCourt(aemma, 'Aemma Arryn').nom).toBe('Aemma Arryn');
  });
});
