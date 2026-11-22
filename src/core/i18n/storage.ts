import { initialLangState, STORAGE_KEYS } from './lang';
import type { LangState } from './lang';

/*
 * Accès au navigateur pour les langues : stockage local, adresse, préférences.
 * Le stockage peut être refusé (navigation privée, réglage strict) : on lit alors `null`
 * et l'écriture est ignorée, le choix vaut pour la visite en cours.
 */

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Stockage refusé : rien à faire, l'état en mémoire reste juste.
  }
}

export function readInitialLangState(): LangState {
  return initialLangState({
    search: window.location.search,
    storedLang: read(STORAGE_KEYS.lang),
    storedSupport: read(STORAGE_KEYS.support),
    navigatorLanguages: window.navigator.languages,
  });
}

export function persistLangState(state: LangState): void {
  write(STORAGE_KEYS.lang, state.lang);
  write(STORAGE_KEYS.support, state.support);
}
