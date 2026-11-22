/**
 * Typographie fine du récit, appliquée au rendu : les textes de contenu arrivent avec des
 * espaces ordinaires devant « ; : ! ? » et à l'intérieur des guillemets, et parfois avec
 * des apostrophes droites. Sans espace insécable, un « » » ou un « ; » peut tomber seul en
 * tête de ligne, ce qu'aucune édition imprimée n'admet.
 */
import { useCallback } from 'react';

import type { Localized } from '@/core/content/types';
import { useLang, useTx } from '@/core/i18n';

/** Espace fine insécable (avant ; : ! ?) et espace insécable (dans les guillemets). */
const FINE = ' ';
const NBSP = ' ';

/** Apostrophe typographique entre deux lettres ; espaces insécables françaises. */
export function fineTypo(text: string, lang: string): string {
  let out = text.replace(/([\p{L}\d])'(?=\p{L})/gu, '$1’');
  if (lang === 'fr') {
    out = out
      .replace(/«[ \t]+/g, `«${NBSP}`)
      .replace(/[ \t]+»/g, `${NBSP}»`)
      .replace(/[ \t]+([;:!?])/g, `${FINE}$1`);
  }
  return out;
}

/** Comme `useTx()`, avec la typographie fine de la langue lue. Pour l'affichage seulement. */
export function useTxTypo(): (loc: Localized | null | undefined) => string {
  const tx = useTx();
  const { reading } = useLang();
  return useCallback((loc: Localized | null | undefined) => fineTypo(tx(loc), reading), [tx, reading]);
}
