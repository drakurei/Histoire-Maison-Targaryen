import { describe, expect, it } from 'vitest';

import { fineTypo, NARROW_NBSP } from './typo';

const NBSP = ' ';

describe('fineTypo', () => {
  it('courbe l’apostrophe droite entre deux lettres, dans toutes les langues', () => {
    expect(fineTypo("l'héritier d'Aegon", 'fr')).toBe('l’héritier d’Aegon');
    expect(fineTypo("Rhaenyra's dragon", 'en')).toBe('Rhaenyra’s dragon');
  });

  it('laisse une apostrophe qui n’est pas entre deux lettres', () => {
    expect(fineTypo("'citation'", 'fr')).toBe("'citation'");
  });

  it('lie les guillemets français à leur texte par une espace insécable', () => {
    expect(fineTypo('« Feu et Sang »', 'fr')).toBe(`«${NBSP}Feu et Sang${NBSP}»`);
  });

  it('pose une espace fine insécable devant ; : ! ? en français', () => {
    expect(fineTypo('Pourquoi ? Parce que : le sang ; le feu !', 'fr')).toBe(
      `Pourquoi${NARROW_NBSP}? Parce que${NARROW_NBSP}: le sang${NARROW_NBSP}; le feu${NARROW_NBSP}!`,
    );
  });

  it('ne touche pas aux espaces de l’anglais', () => {
    expect(fineTypo('Why ? Because : blood', 'en')).toBe('Why ? Because : blood');
  });

  it('garde une espace déjà insécable', () => {
    const text = `«${NBSP}Valar morghūlis${NBSP}»`;
    expect(fineTypo(text, 'fr')).toBe(text);
  });

  it('ne colle rien quand il n’y a pas d’espace', () => {
    expect(fineTypo('a:b', 'fr')).toBe('a:b');
  });
});
