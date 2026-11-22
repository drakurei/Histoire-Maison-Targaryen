import { createContext } from 'react';

import type { Lang, SupportLang } from '@/core/content/types';

/** Ce que renvoie `useLang()`. */
export interface LangApi {
  /** Langue d'affichage : interface, titres, formules. */
  lang: Lang;
  /** Langue d'appui : récit et gloses quand `lang` vaut `hv`. */
  support: SupportLang;
  /** Langue du récit : `support` si `lang === 'hv'`, sinon `lang`. */
  reading: SupportLang;
  setLang: (lang: Lang) => void;
  setSupport: (support: SupportLang) => void;
}

export const I18nContext = createContext<LangApi | null>(null);
