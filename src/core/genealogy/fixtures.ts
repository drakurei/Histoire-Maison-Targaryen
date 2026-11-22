/**
 * Jeu d'essai des tests : un extrait fidèle de `content/genealogy/genealogy.json`, d'Aerion et
 * Valaena à Aegon III et Viserys II (41 personnes, 18 unions, 33 filiations). Identifiants,
 * générations, unions et filiations sont ceux de la source ; seules les personnes hors de
 * l'extrait manquent (les autres enfants de Jaehaerys Ier, par exemple).
 *
 * On y trouve ce qui fait la difficulté de l'arbre : un roi marié à ses deux sœurs, un frère et
 * une sœur mariés, deux unions entre oncle et nièce, des cousins germains, une demi-tante, un
 * père allégué, une filiation de légende.
 *
 * Fichier produit à partir de la source ; ne sert qu'aux tests.
 */
import type { Parentage, Person, Reliability, Union } from '../content/types.ts';

type PersonRow = [id: string, fr: string, en: string, sex: 'm' | 'f', house: string, generation: number, king: boolean, legitimacy: Person['legitimacy']];

const PERSON_ROWS: PersonRow[] = [
  ['aerion-peyredragon', 'Aerion Targaryen (fils de Daemion)', 'Aerion Targaryen (son of Daemion)', 'm', 'targaryen', 5, false, 'legitime'],
  ['valaena-velaryon', 'Valaena Velaryon', 'Valaena Velaryon', 'f', 'velaryon', 5, false, 'legitime'],
  ['orys-baratheon', 'Orys Baratheon', 'Orys Baratheon', 'm', 'baratheon', 6, false, 'batard'],
  ['visenya', 'Visenya Targaryen', 'Visenya Targaryen', 'f', 'targaryen', 6, false, 'legitime'],
  ['aegon-i', 'Aegon Ier Targaryen', 'Aegon I Targaryen', 'm', 'targaryen', 6, true, 'legitime'],
  ['rhaenys', 'Rhaenys Targaryen', 'Rhaenys Targaryen', 'f', 'targaryen', 6, false, 'legitime'],
  ['aenys-i', 'Aenys Ier Targaryen', 'Aenys I Targaryen', 'm', 'targaryen', 7, true, 'legitime'],
  ['maegor-i', 'Maegor Ier Targaryen', 'Maegor I Targaryen', 'm', 'targaryen', 7, true, 'legitime'],
  ['alyssa-velaryon', 'Alyssa Velaryon', 'Alyssa Velaryon', 'f', 'velaryon', 7, false, 'legitime'],
  ['ceryse-hightower', 'Ceryse Hightower', 'Ceryse Hightower', 'f', 'hightower', 7, false, 'legitime'],
  ['rogar-baratheon', 'Rogar Baratheon', 'Rogar Baratheon', 'm', 'baratheon', 7, false, 'legitime'],
  ['boremund-baratheon', 'Boremund Baratheon', 'Boremund Baratheon', 'm', 'baratheon', 8, false, 'legitime'],
  ['jocelyn-baratheon', 'Jocelyn Baratheon', 'Jocelyn Baratheon', 'f', 'baratheon', 8, false, 'legitime'],
  ['rhaena-fille-aenys-i', 'Rhaena Targaryen (fille d\'Aenys Ier)', 'Rhaena Targaryen (daughter of Aenys I)', 'f', 'targaryen', 8, false, 'legitime'],
  ['aegon-fils-aenys-i', 'Aegon Targaryen (fils d\'Aenys Ier)', 'Aegon Targaryen (son of Aenys I)', 'm', 'targaryen', 8, false, 'legitime'],
  ['viserys-fils-aenys-i', 'Viserys Targaryen (fils d\'Aenys Ier)', 'Viserys Targaryen (son of Aenys I)', 'm', 'targaryen', 8, false, 'legitime'],
  ['jaehaerys-i', 'Jaehaerys Ier Targaryen', 'Jaehaerys I Targaryen', 'm', 'targaryen', 8, true, 'legitime'],
  ['alysanne', 'Alysanne Targaryen', 'Alysanne Targaryen', 'f', 'targaryen', 8, false, 'legitime'],
  ['vaella-fille-aenys-i', 'Vaella Targaryen (fille d\'Aenys Ier)', 'Vaella Targaryen (daughter of Aenys I)', 'f', 'targaryen', 8, false, 'legitime'],
  ['aerea', 'Aerea Targaryen', 'Aerea Targaryen', 'f', 'targaryen', 9, false, 'legitime'],
  ['rhaella-fille-aegon', 'Rhaella Targaryen (fille d\'Aegon)', 'Rhaella Targaryen (daughter of Aegon)', 'f', 'targaryen', 9, false, 'legitime'],
  ['aemon-fils-jaehaerys-i', 'Aemon Targaryen (fils de Jaehaerys Ier)', 'Aemon Targaryen (son of Jaehaerys I)', 'm', 'targaryen', 9, false, 'legitime'],
  ['baelon-fils-jaehaerys-i', 'Baelon Targaryen (fils de Jaehaerys Ier)', 'Baelon Targaryen (son of Jaehaerys I)', 'm', 'targaryen', 9, false, 'legitime'],
  ['alyssa-fille-jaehaerys-i', 'Alyssa Targaryen', 'Alyssa Targaryen', 'f', 'targaryen', 9, false, 'legitime'],
  ['daella-fille-jaehaerys-i', 'Daella Targaryen (fille de Jaehaerys Ier)', 'Daella Targaryen (daughter of Jaehaerys I)', 'f', 'targaryen', 9, false, 'legitime'],
  ['rhaenys-fille-aemon', 'Rhaenys Targaryen (fille d\'Aemon)', 'Rhaenys Targaryen (daughter of Aemon)', 'f', 'targaryen', 10, false, 'legitime'],
  ['viserys-i', 'Viserys Ier Targaryen', 'Viserys I Targaryen', 'm', 'targaryen', 10, true, 'legitime'],
  ['daemon', 'Daemon Targaryen', 'Daemon Targaryen', 'm', 'targaryen', 10, false, 'legitime'],
  ['aegon-fils-baelon', 'Aegon Targaryen (fils de Baelon)', 'Aegon Targaryen (son of Baelon)', 'm', 'targaryen', 10, false, 'legitime'],
  ['rodrik-arryn', 'Rodrik Arryn', 'Rodrik Arryn', 'm', 'arryn', 9, false, 'legitime'],
  ['aemma-arryn', 'Aemma Arryn', 'Aemma Arryn', 'f', 'arryn', 10, false, 'legitime'],
  ['corlys-velaryon', 'Corlys Velaryon', 'Corlys Velaryon', 'm', 'velaryon', 10, false, 'legitime'],
  ['laena-velaryon', 'Laena Velaryon', 'Laena Velaryon', 'f', 'velaryon', 11, false, 'legitime'],
  ['laenor-velaryon', 'Laenor Velaryon', 'Laenor Velaryon', 'm', 'velaryon', 11, false, 'legitime'],
  ['rhaenyra', 'Rhaenyra Targaryen', 'Rhaenyra Targaryen', 'f', 'targaryen', 11, false, 'legitime'],
  ['baelon-fils-viserys-i', 'Baelon Targaryen (fils de Viserys Ier)', 'Baelon Targaryen (son of Viserys I)', 'm', 'targaryen', 11, false, 'legitime'],
  ['harwin-strong', 'Harwin Strong', 'Harwin Strong', 'm', 'strong', 11, false, 'legitime'],
  ['jacaerys-velaryon', 'Jacaerys Velaryon', 'Jacaerys Velaryon', 'm', 'velaryon', 12, false, 'legitime'],
  ['aegon-iii', 'Aegon III Targaryen', 'Aegon III Targaryen', 'm', 'targaryen', 12, true, 'legitime'],
  ['viserys-ii', 'Viserys II Targaryen', 'Viserys II Targaryen', 'm', 'targaryen', 12, true, 'legitime'],
  ['visenya-fille-rhaenyra', 'Visenya Targaryen (fille de Rhaenyra)', 'Visenya Targaryen (daughter of Rhaenyra)', 'f', 'targaryen', 12, false, 'legitime'],
];

type UnionRow = [id: string, a: string, b: string, type: Union['type'], year: number | null];

const UNION_ROWS: UnionRow[] = [
  ['u-aerion-peyredragon-valaena-velaryon', 'aerion-peyredragon', 'valaena-velaryon', 'mariage', null],
  ['u-aegon-i-visenya', 'aegon-i', 'visenya', 'mariage', null],
  ['u-aegon-i-rhaenys', 'aegon-i', 'rhaenys', 'mariage', null],
  ['u-aenys-i-alyssa-velaryon', 'aenys-i', 'alyssa-velaryon', 'mariage', 22],
  ['u-maegor-i-ceryse-hightower', 'maegor-i', 'ceryse-hightower', 'mariage', 25],
  ['u-alyssa-velaryon-rogar-baratheon', 'alyssa-velaryon', 'rogar-baratheon', 'mariage', 49],
  ['u-aegon-fils-aenys-i-rhaena-fille-aenys-i', 'aegon-fils-aenys-i', 'rhaena-fille-aenys-i', 'mariage', 41],
  ['u-maegor-i-rhaena-fille-aenys-i', 'maegor-i', 'rhaena-fille-aenys-i', 'mariage', 47],
  ['u-jaehaerys-i-alysanne', 'jaehaerys-i', 'alysanne', 'mariage', 49],
  ['u-aemon-fils-jaehaerys-i-jocelyn-baratheon', 'aemon-fils-jaehaerys-i', 'jocelyn-baratheon', 'mariage', 70],
  ['u-baelon-fils-jaehaerys-i-alyssa-fille-jaehaerys-i', 'baelon-fils-jaehaerys-i', 'alyssa-fille-jaehaerys-i', 'mariage', 75],
  ['u-daella-fille-jaehaerys-i-rodrik-arryn', 'daella-fille-jaehaerys-i', 'rodrik-arryn', 'mariage', 80],
  ['u-corlys-velaryon-rhaenys-fille-aemon', 'corlys-velaryon', 'rhaenys-fille-aemon', 'mariage', 90],
  ['u-viserys-i-aemma-arryn', 'viserys-i', 'aemma-arryn', 'mariage', 93],
  ['u-rhaenyra-laenor-velaryon', 'rhaenyra', 'laenor-velaryon', 'mariage', 114],
  ['u-rhaenyra-harwin-strong', 'rhaenyra', 'harwin-strong', 'liaison', null],
  ['u-daemon-laena-velaryon', 'daemon', 'laena-velaryon', 'mariage', 115],
  ['u-daemon-rhaenyra', 'daemon', 'rhaenyra', 'mariage', 120],
];

type ParentageRow = [child: string, union: string | null, father: string | null, mother: string | null, certainty: Reliability, allegedFather?: string];

const PARENTAGE_ROWS: ParentageRow[] = [
  ['orys-baratheon', null, 'aerion-peyredragon', null, 'legende'],
  ['visenya', 'u-aerion-peyredragon-valaena-velaryon', 'aerion-peyredragon', 'valaena-velaryon', 'etabli'],
  ['aegon-i', 'u-aerion-peyredragon-valaena-velaryon', 'aerion-peyredragon', 'valaena-velaryon', 'etabli'],
  ['rhaenys', 'u-aerion-peyredragon-valaena-velaryon', 'aerion-peyredragon', 'valaena-velaryon', 'etabli'],
  ['aenys-i', 'u-aegon-i-rhaenys', 'aegon-i', 'rhaenys', 'etabli'],
  ['maegor-i', 'u-aegon-i-visenya', 'aegon-i', 'visenya', 'etabli'],
  ['rhaena-fille-aenys-i', 'u-aenys-i-alyssa-velaryon', 'aenys-i', 'alyssa-velaryon', 'etabli'],
  ['aegon-fils-aenys-i', 'u-aenys-i-alyssa-velaryon', 'aenys-i', 'alyssa-velaryon', 'etabli'],
  ['viserys-fils-aenys-i', 'u-aenys-i-alyssa-velaryon', 'aenys-i', 'alyssa-velaryon', 'etabli'],
  ['jaehaerys-i', 'u-aenys-i-alyssa-velaryon', 'aenys-i', 'alyssa-velaryon', 'etabli'],
  ['alysanne', 'u-aenys-i-alyssa-velaryon', 'aenys-i', 'alyssa-velaryon', 'etabli'],
  ['vaella-fille-aenys-i', 'u-aenys-i-alyssa-velaryon', 'aenys-i', 'alyssa-velaryon', 'etabli'],
  ['boremund-baratheon', 'u-alyssa-velaryon-rogar-baratheon', 'rogar-baratheon', 'alyssa-velaryon', 'etabli'],
  ['jocelyn-baratheon', 'u-alyssa-velaryon-rogar-baratheon', 'rogar-baratheon', 'alyssa-velaryon', 'etabli'],
  ['aerea', 'u-aegon-fils-aenys-i-rhaena-fille-aenys-i', 'aegon-fils-aenys-i', 'rhaena-fille-aenys-i', 'etabli'],
  ['rhaella-fille-aegon', 'u-aegon-fils-aenys-i-rhaena-fille-aenys-i', 'aegon-fils-aenys-i', 'rhaena-fille-aenys-i', 'etabli'],
  ['aemon-fils-jaehaerys-i', 'u-jaehaerys-i-alysanne', 'jaehaerys-i', 'alysanne', 'etabli'],
  ['baelon-fils-jaehaerys-i', 'u-jaehaerys-i-alysanne', 'jaehaerys-i', 'alysanne', 'etabli'],
  ['alyssa-fille-jaehaerys-i', 'u-jaehaerys-i-alysanne', 'jaehaerys-i', 'alysanne', 'etabli'],
  ['daella-fille-jaehaerys-i', 'u-jaehaerys-i-alysanne', 'jaehaerys-i', 'alysanne', 'etabli'],
  ['rhaenys-fille-aemon', 'u-aemon-fils-jaehaerys-i-jocelyn-baratheon', 'aemon-fils-jaehaerys-i', 'jocelyn-baratheon', 'etabli'],
  ['viserys-i', 'u-baelon-fils-jaehaerys-i-alyssa-fille-jaehaerys-i', 'baelon-fils-jaehaerys-i', 'alyssa-fille-jaehaerys-i', 'etabli'],
  ['daemon', 'u-baelon-fils-jaehaerys-i-alyssa-fille-jaehaerys-i', 'baelon-fils-jaehaerys-i', 'alyssa-fille-jaehaerys-i', 'etabli'],
  ['aegon-fils-baelon', 'u-baelon-fils-jaehaerys-i-alyssa-fille-jaehaerys-i', 'baelon-fils-jaehaerys-i', 'alyssa-fille-jaehaerys-i', 'etabli'],
  ['aemma-arryn', 'u-daella-fille-jaehaerys-i-rodrik-arryn', 'rodrik-arryn', 'daella-fille-jaehaerys-i', 'etabli'],
  ['laena-velaryon', 'u-corlys-velaryon-rhaenys-fille-aemon', 'corlys-velaryon', 'rhaenys-fille-aemon', 'etabli'],
  ['laenor-velaryon', 'u-corlys-velaryon-rhaenys-fille-aemon', 'corlys-velaryon', 'rhaenys-fille-aemon', 'etabli'],
  ['rhaenyra', 'u-viserys-i-aemma-arryn', 'viserys-i', 'aemma-arryn', 'etabli'],
  ['baelon-fils-viserys-i', 'u-viserys-i-aemma-arryn', 'viserys-i', 'aemma-arryn', 'etabli'],
  ['jacaerys-velaryon', 'u-rhaenyra-laenor-velaryon', 'laenor-velaryon', 'rhaenyra', 'contradictoire', 'harwin-strong'],
  ['aegon-iii', 'u-daemon-rhaenyra', 'daemon', 'rhaenyra', 'etabli'],
  ['viserys-ii', 'u-daemon-rhaenyra', 'daemon', 'rhaenyra', 'etabli'],
  ['visenya-fille-rhaenyra', 'u-daemon-rhaenyra', 'daemon', 'rhaenyra', 'etabli'],
];

export const persons: Person[] = PERSON_ROWS.map(([id, fr, en, sex, house, generation, king, legitimacy]) => ({
  id,
  name: { fr, en },
  sex,
  house,
  born: null,
  died: null,
  dateCertainty: 'inconnue',
  king,
  reign: null,
  legitimacy,
  generation,
  sources: [],
  hasBiography: false,
}));

export const unions: Union[] = UNION_ROWS.map(([id, a, b, type, year]) => ({ id, partners: [a, b], type, year, certainty: 'etabli', sources: [] }));

export const parentage: Parentage[] = PARENTAGE_ROWS.map(([child, union, father, mother, certainty, allegedFather]) => ({
  child,
  union,
  father,
  mother,
  ...(allegedFather === undefined ? {} : { allegedFather }),
  certainty,
  sources: [],
}));

/** Filiation directe dans l'extrait : chaque maillon est l'enfant du précédent. */
export const mainThread: string[] = ['aerion-peyredragon', 'aegon-i', 'aenys-i', 'jaehaerys-i', 'baelon-fils-jaehaerys-i', 'viserys-i', 'rhaenyra', 'viserys-ii'];

/** Personne minimale pour les cas construits à la main. */
export function makePerson(id: string, sex: 'm' | 'f' = 'm', generation = 0): Person {
  return {
    id,
    name: { fr: id, en: id },
    sex,
    house: 'essai',
    born: null,
    died: null,
    dateCertainty: 'inconnue',
    king: false,
    reign: null,
    legitimacy: 'legitime',
    generation,
    sources: [],
    hasBiography: false,
  };
}

export function makeUnion(id: string, a: string, b: string, type: Union['type'] = 'mariage'): Union {
  return { id, partners: [a, b], type, year: null, certainty: 'etabli', sources: [] };
}

export function makeChild(child: string, father: string | null, mother: string | null, union: string | null = null): Parentage {
  return { child, union, father, mother, certainty: 'etabli', sources: [] };
}
