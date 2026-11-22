import { useCallback, useContext } from 'react';

import type { Localized } from '@/core/content/types';
import { uiByKey } from '@/core/content/ui';

import { I18nContext } from './context';
import type { LangApi } from './context';
import { createMissingKeyReporter, resolveText, resolveTitle, resolveUi } from './resolve';
import type { TitleText, UiText, Vars } from './resolve';
import { fineTypo } from './typo';

/** En développement, une clé absente est signalée une fois dans la console ; en production, jamais. */
const reportMissingKey: (key: string) => void = import.meta.env.DEV
  ? createMissingKeyReporter((message) => console.warn(message))
  : () => {};

/** `{ lang, support, reading, setLang, setSupport }`. */
export function useLang(): LangApi {
  const api = useContext(I18nContext);
  if (!api) {
    throw new Error('useLang() est appelé hors de <I18nProvider>.');
  }
  return api;
}

/**
 * `ui(key, vars?)` : chaîne d'interface complète, avec sa glose, son statut et sa note
 * quand la première ligne est en valyrien. Clé absente : `[clé]`.
 */
export function useUi(): (key: string, vars?: Vars) => UiText {
  const { lang, support } = useLang();
  return useCallback(
    (key: string, vars?: Vars): UiText => {
      const entry = uiByKey.get(key);
      if (!entry) reportMissingKey(key);
      return resolveUi(entry, key, lang, support, vars);
    },
    [lang, support],
  );
}

/** `t(key, vars?)` : la chaîne principale seule, pour `aria-label`, `title` et autres attributs. */
export function useT(): (key: string, vars?: Vars) => string {
  const ui = useUi();
  return useCallback((key: string, vars?: Vars): string => ui(key, vars).primary, [ui]);
}

/** `tx(loc)` : texte de récit, toujours dans la langue lue. Champ absent : chaîne vide. */
export function useTx(): (loc: Localized | null | undefined) => string {
  const { reading } = useLang();
  return useCallback((loc: Localized | null | undefined): string => resolveText(loc, reading), [reading]);
}

/** `title(loc)` : titre de contenu, en valyrien avec glose quand la forme existe et que `lang` vaut `hv`. */
export function useTitle(): (loc: Localized) => TitleText {
  const { lang, support } = useLang();
  return useCallback((loc: Localized): TitleText => resolveTitle(loc, lang, support), [lang, support]);
}

/**
 * Comme `useTx()`, avec la typographie fine de la langue lue (`fineTypo`) : apostrophes
 * courbes, espaces insécables françaises. Pour l'affichage seulement, jamais pour une clé.
 */
export function useTxTypo(): (loc: Localized | null | undefined) => string {
  const tx = useTx();
  const { reading } = useLang();
  return useCallback((loc: Localized | null | undefined): string => fineTypo(tx(loc), reading), [tx, reading]);
}

/** `typo(text)` : la typographie fine de la langue lue, appliquée à une chaîne déjà résolue. */
export function useTypo(): (text: string) => string {
  const { reading } = useLang();
  return useCallback((text: string): string => fineTypo(text, reading), [reading]);
}
