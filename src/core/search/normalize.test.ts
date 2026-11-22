import { describe, expect, it } from 'vitest';

import { fold, loosen, normalize, normalizeLoose, wordsOf } from './normalize.ts';

/* Caractères invisibles ou combinants : construits par leur code pour rester lisibles ici. */
const NBSP = String.fromCharCode(0x00a0);
const SOFT_HYPHEN = String.fromCharCode(0x00ad);
const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);
const COMBINING_MACRON = String.fromCharCode(0x0304);
const COMBINING_ACUTE = String.fromCharCode(0x0301);
const MODIFIER_APOSTROPHE = String.fromCharCode(0x02bc);
const PRIME = String.fromCharCode(0x2032);

const MARKS = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, 'g');

/** La règle de `norm` dans `scripts/build-content.mjs`, recopiée : c'est elle qui fabrique les clés de l'index. */
function buildNorm(text: string): string {
  return text
    .normalize('NFD')
    .replace(MARKS, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[’‘`´]/g, "'")
    .replace(/[«»“”"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** La variante sans tirets ni apostrophes de `searchKeys`, dans le même script. */
function buildLoose(text: string): string {
  return buildNorm(text)
    .replace(/[-']/g, ' ')
    .replace(/[().,:;]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const SAMPLES = [
  'Aegon Ier Targaryen',
  'le Conquérant',
  'Port-Réal',
  'l’Exilé',
  'Zaldrīzes',
  'Dāro Vilinion',
  'Kesīr Targārio Lentro vestriarzir ilza. Umbās, se gūrēñās.',
  'Mort du Conquérant, avènement d’Aenys Ier',
  'Aemon Targaryen (fils de Viserys II)',
  'Le duel de l’Œildieu',
  '« la Danse des Dragons »',
  'Daenerys’s Wedding and the Three Eggs',
  '  Série :   l’incendie de Port-Réal  ',
  'Fléau-des-Dragons',
  'ÆGON',
  '',
];

describe('normalize', () => {
  it('met en minuscules et retire accents, trémas et macrons', () => {
    expect(normalize('Zaldrīzes')).toBe('zaldrizes');
    expect(normalize('Targārio Lentro Vestriarja')).toBe('targario lentro vestriarja');
    expect(normalize('Conquérant')).toBe('conquerant');
    expect(normalize('Gūrēñās')).toBe('gurenas');
    expect(normalize('AEGON')).toBe('aegon');
  });

  it('délie « œ » et « æ », avec ou sans macron', () => {
    expect(normalize('Œildieu')).toBe('oeildieu');
    expect(normalize('ÆGON')).toBe('aegon');
    expect(normalize('Dǣnerys')).toBe('daenerys');
  });

  it('retire un accent écrit à part de sa lettre', () => {
    expect(normalize(`Zaldri${COMBINING_MACRON}zes`)).toBe('zaldrizes');
    expect(normalize(`Re${COMBINING_ACUTE}al`)).toBe('real');
  });

  it('ramène toutes les apostrophes à l’apostrophe droite', () => {
    for (const apostrophe of ['’', '‘', '`', '´', "'", MODIFIER_APOSTROPHE, PRIME]) {
      expect(normalize(`l${apostrophe}Exilé`)).toBe("l'exile");
    }
  });

  it('retire les guillemets, français et anglais', () => {
    expect(normalize('« Port-Réal »')).toBe('port-real');
    expect(normalize('“the Conqueror”')).toBe('the conqueror');
    expect(normalize('"Balerion"')).toBe('balerion');
  });

  it('réduit les espaces à un seul, insécables compris, et rogne les bords', () => {
    expect(normalize(`  Aegon \t le\n Conquérant  `)).toBe('aegon le conquerant');
    expect(normalize(`27${NBSP}av.${NBSP}C.`)).toBe('27 av. c.');
    expect(normalize(` ${NBSP} `)).toBe('');
  });

  it('ignore les caractères invisibles', () => {
    expect(normalize(`Targ${SOFT_HYPHEN}aryen`)).toBe('targaryen');
    expect(normalize(`Bale${ZERO_WIDTH_SPACE}rion`)).toBe('balerion');
  });

  it('garde les tirets et la ponctuation : c’est normalizeLoose qui les relâche', () => {
    expect(normalize('Port-Réal')).toBe('port-real');
    expect(normalize('Aemon (fils de Viserys II)')).toBe('aemon (fils de viserys ii)');
  });

  it('ne change plus rien à un texte déjà normalisé', () => {
    for (const sample of SAMPLES) expect(normalize(normalize(sample))).toBe(normalize(sample));
  });

  it('suit la règle qui fabrique les clés de l’index', () => {
    for (const sample of SAMPLES) expect(normalize(sample)).toBe(buildNorm(sample));
  });
});

describe('normalizeLoose', () => {
  it('lit tirets et apostrophes comme des espaces et oublie la ponctuation', () => {
    expect(normalizeLoose('Port-Réal')).toBe('port real');
    expect(normalizeLoose('l’Exilé')).toBe('l exile');
    expect(normalizeLoose('Aemon Targaryen (fils de Viserys II)')).toBe('aemon targaryen fils de viserys ii');
    expect(normalizeLoose('Mort du Conquérant, avènement d’Aenys Ier')).toBe('mort du conquerant avenement d aenys ier');
    expect(normalizeLoose(' - ')).toBe('');
  });

  it('suit la variante relâchée des clés de l’index', () => {
    for (const sample of SAMPLES) expect(normalizeLoose(sample)).toBe(buildLoose(sample));
  });
});

describe('wordsOf', () => {
  it('découpe un texte normalisé en mots, sans mot vide', () => {
    expect(wordsOf('aegon le conquerant')).toEqual(['aegon', 'le', 'conquerant']);
    expect(wordsOf('')).toEqual([]);
    expect(wordsOf(normalize('  Port-Réal  '))).toEqual(['port-real']);
  });
});

describe('fold', () => {
  it('rend le même texte que normalize', () => {
    for (const sample of SAMPLES) expect(fold(sample).text).toBe(normalize(sample));
    expect(fold(`Zaldri${COMBINING_MACRON}zes  ${NBSP}bū `).text).toBe('zaldrizes bu');
  });

  it('rattache chaque caractère normalisé à sa place d’origine', () => {
    const folded = fold('Réal');
    expect(folded).toEqual({ text: 'real', starts: [0, 1, 2, 3], ends: [1, 2, 3, 4] });
  });

  it('fait porter les deux lettres d’une ligature sur le même caractère d’origine', () => {
    expect(fold('Œil')).toEqual({ text: 'oeil', starts: [0, 0, 1, 2], ends: [1, 1, 2, 3] });
  });

  it('garde un accent écrit à part attaché à sa lettre', () => {
    expect(fold(`i${COMBINING_MACRON}z`)).toEqual({ text: 'iz', starts: [0, 2], ends: [2, 3] });
  });

  it('compte une suite d’espaces pour une seule, qui la couvre toute', () => {
    expect(fold('a   b')).toEqual({ text: 'a b', starts: [0, 1, 4], ends: [1, 4, 5] });
    expect(fold('  ab ')).toEqual({ text: 'ab', starts: [2, 3], ends: [3, 4] });
  });

  it('saute les guillemets et les caractères invisibles sans décaler la suite', () => {
    expect(fold('«a»b')).toEqual({ text: 'ab', starts: [1, 3], ends: [2, 4] });
    expect(fold(`a${SOFT_HYPHEN}b`)).toEqual({ text: 'ab', starts: [0, 2], ends: [1, 3] });
  });

  it('donne autant de places que de caractères', () => {
    for (const sample of SAMPLES) {
      const folded = fold(sample);
      expect(folded.starts).toHaveLength(folded.text.length);
      expect(folded.ends).toHaveLength(folded.text.length);
    }
  });
});

describe('loosen', () => {
  it('garde la correspondance avec le texte d’origine à travers les tirets', () => {
    const loose = loosen(fold('Port-Réal'));
    expect(loose.text).toBe('port real');
    expect(loose.starts).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(loose.ends).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('retire la ponctuation et fond les séparateurs voisins en une espace', () => {
    const loose = loosen(fold('Mort, d’Aenys'));
    expect(loose.text).toBe('mort d aenys');
    // « , » disparaît ; l'espace qui suit devient le séparateur.
    expect('Mort, d’Aenys'.slice(loose.starts[5] ?? 0, loose.ends[5] ?? 0)).toBe('d');
    expect('Mort, d’Aenys'.slice(loose.starts[7] ?? 0, loose.ends[11] ?? 0)).toBe('Aenys');
  });
});
