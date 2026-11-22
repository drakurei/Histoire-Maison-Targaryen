import { describe, expect, it } from 'vitest';

import { parseLiteral, refLabel } from './glose';

describe('parseLiteral', () => {
  it('sépare les mots, le sens et l’analyse', () => {
    const result = parseLiteral(
      'valar : tous les hommes (collectif de vala) ; morghūlis : meurt (aoriste, 3e personne du singulier, de morghūljagon « mourir »)',
    );
    expect(result.mots).toEqual([
      { hv: 'valar', sens: 'tous les hommes', analyse: 'collectif de vala' },
      { hv: 'morghūlis', sens: 'meurt', analyse: 'aoriste, 3e personne du singulier, de morghūljagon « mourir »' },
    ]);
    expect(result.remarques).toEqual([]);
  });

  it('ne coupe pas à l’intérieur des parenthèses', () => {
    const result = parseLiteral('hen Targārio Lentrot : de la Maison de Targaryen (hen et locatif de lentor ; Targārio, génitif) ; iksan : je suis');
    expect(result.mots.map((mot) => mot.hv)).toEqual(['hen Targārio Lentrot', 'iksan']);
    expect(result.mots[0]?.analyse).toBe('hen et locatif de lentor ; Targārio, génitif');
  });

  it('garde un nom propre non glosé et range les remarques à part', () => {
    expect(parseLiteral('Thoros ; hen Mȳrot : de Myr (hen suivi du locatif) ; iksā : tu es').mots[0]).toEqual({
      hv: 'Thoros',
      sens: '',
      analyse: '',
    });
    expect(parseLiteral('sōvētēs : volez (impératif pluriel de sōvegon « voler ») ; au singulier, sōvēs').remarques).toEqual([
      'au singulier, sōvēs',
    ]);
  });
});

describe('refLabel', () => {
  it('lit le titre d’une page de wiki', () => {
    expect(refLabel('https://wiki.languageinvention.com/%C4%80nogar')).toEqual({ titre: 'Ānogar', site: 'wiki.languageinvention.com' });
    expect(refLabel('https://wiki.languageinvention.com/index.php?title=Appendix:High_Valyrian_pronunciation').titre).toBe(
      'Appendix: High Valyrian pronunciation',
    );
  });

  it('garde l’ancre et les articles numérotés', () => {
    expect(refLabel('https://wiki.languageinvention.com/index.php?title=Season_3_Game_of_Thrones_Dialogue#Episode_306').titre).toBe(
      'Season 3 Game of Thrones Dialogue, Episode 306',
    );
    expect(refLabel('https://dothraki.com/?p=1227')).toEqual({ titre: 'dothraki.com/?p=1227', site: 'dothraki.com' });
  });

  it('rend telle quelle une chaîne qui n’est pas une adresse', () => {
    expect(refLabel('Living Language Dothraki')).toEqual({ titre: 'Living Language Dothraki', site: '' });
  });
});

describe('parseLiteral en anglais', () => {
  it('lit les séparateurs sans espace avant le signe', () => {
    expect(parseLiteral('valar: all men (collective of vala); morghūlis: dies (aorist)').mots).toEqual([
      { hv: 'valar', sens: 'all men', analyse: 'collective of vala' },
      { hv: 'morghūlis', sens: 'dies', analyse: 'aorist' },
    ]);
  });
});
