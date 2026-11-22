import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { Lang, SupportLang } from '@/core/content/types';

import { I18nContext } from './context';
import type { LangApi } from './context';
import { readingLang, withLang, withSupport } from './lang';
import { persistLangState, readInitialLangState } from './storage';

interface I18nProviderProps {
  children: ReactNode;
}

/**
 * Porte la langue d'affichage et la langue d'appui pour toute l'application.
 * Le changement est immédiat, sans rechargement ; le choix est mémorisé et
 * l'attribut `lang` de <html> suit la langue réellement lue.
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const [state, setState] = useState(readInitialLangState);
  const reading = readingLang(state.lang, state.support);

  const setLang = useCallback((lang: Lang) => setState((current) => withLang(current, lang)), []);
  const setSupport = useCallback(
    (support: SupportLang) => setState((current) => withSupport(current, support)),
    [],
  );

  useEffect(() => {
    persistLangState(state);
  }, [state]);

  // Avant la peinture : le document annonce la langue du récit. Les fragments valyriens
  // portent leur propre balise ; `data-lang` expose le mode d'affichage aux feuilles de style.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = reading;
    root.dataset.lang = state.lang;
  }, [reading, state.lang]);

  const api = useMemo<LangApi>(
    () => ({ lang: state.lang, support: state.support, reading, setLang, setSupport }),
    [state.lang, state.support, reading, setLang, setSupport],
  );

  return <I18nContext value={api}>{children}</I18nContext>;
}
