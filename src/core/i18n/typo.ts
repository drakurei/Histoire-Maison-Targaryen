/**
 * Typographie fine du texte affiché, commune aux trois versions.
 *
 * Les textes de contenu arrivent avec des espaces ordinaires devant « ; : ! ? » et à
 * l'intérieur des guillemets, et parfois avec des apostrophes droites. Sans espace
 * insécable, un « » » ou un « ; » peut tomber seul en tête de ligne, ce qu'aucune édition
 * imprimée n'admet. Fonction pure : appliquée au rendu, jamais aux données.
 */
import type { SupportLang } from '@/core/content/types';

/** Espace fine insécable (U+202F), devant ; : ! ? en français. */
export const NARROW_NBSP = ' ';
/** Espace insécable (U+00A0), à l'intérieur des guillemets français. */
const NBSP = ' ';

/** Apostrophe droite entre une lettre (ou un chiffre) et une lettre. */
const STRAIGHT_APOSTROPHE = /([\p{L}\d])'(?=\p{L})/gu;

/**
 * Apostrophe typographique entre deux lettres, dans toutes les langues ; en français,
 * espaces insécables dans les guillemets et espace fine insécable devant ; : ! ?.
 * Une espace déjà insécable est laissée telle quelle.
 */
export function fineTypo(text: string, lang: SupportLang | string): string {
  let out = text.replace(STRAIGHT_APOSTROPHE, '$1’');
  if (lang === 'fr') {
    out = out
      .replace(/«[ \t]+/g, `«${NBSP}`)
      .replace(/[ \t]+»/g, `${NBSP}»`)
      .replace(/[ \t]+([;:!?])/g, `${NARROW_NBSP}$1`);
  }
  return out;
}
