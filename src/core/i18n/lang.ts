import type { Lang, SupportLang } from '@/core/content/types';

/** Langues d'affichage, dans l'ordre où un sélecteur les propose. */
export const LANGS = ['hv', 'fr', 'en'] as const satisfies readonly Lang[];
/** Langues d'appui : celles du récit et des gloses quand l'affichage est en haut valyrien. */
export const SUPPORT_LANGS = ['fr', 'en'] as const satisfies readonly SupportLang[];

export const DEFAULT_LANG: Lang = 'hv';
/** Repli quand le navigateur n'annonce ni le français ni l'anglais. */
export const FALLBACK_SUPPORT: SupportLang = 'en';

/** Étiquette BCP 47 de tout texte valyrien (sous-étiquette d'usage privé d'une langue construite). */
export const VALYRIAN_TAG = 'art-x-valyrian';

/** Paramètre d'adresse qui impose la langue d'affichage au chargement : `?lang=fr`. */
export const LANG_PARAM = 'lang';
export const STORAGE_KEYS = { lang: 'tlv.lang', support: 'tlv.support' } as const;

export interface LangState {
  lang: Lang;
  support: SupportLang;
}

export function isLang(value: unknown): value is Lang {
  return value === 'hv' || value === 'fr' || value === 'en';
}

export function isSupportLang(value: unknown): value is SupportLang {
  return value === 'fr' || value === 'en';
}

/** Langue du récit : la langue d'appui en mode valyrien, sinon la langue d'affichage. */
export function readingLang(lang: Lang, support: SupportLang): SupportLang {
  return lang === 'hv' ? support : lang;
}

/** Lit `?lang=` dans une chaîne de requête (`location.search`). `null` si absent ou inconnu. */
export function langFromSearch(search: string): Lang | null {
  const value = new URLSearchParams(search).get(LANG_PARAM)?.trim().toLowerCase();
  return isLang(value) ? value : null;
}

/**
 * Langue d'appui déduite des préférences du navigateur (`navigator.languages`, par ordre
 * de préférence) : la première qui soit du français ou de l'anglais l'emporte.
 */
export function supportFromNavigator(languages: readonly string[]): SupportLang {
  for (const tag of languages) {
    const primary = tag.toLowerCase().split('-')[0];
    if (isSupportLang(primary)) return primary;
  }
  return FALLBACK_SUPPORT;
}

/**
 * Change la langue d'affichage. Choisir le français ou l'anglais règle aussi la langue
 * d'appui : qui repasse ensuite au valyrien garde ses gloses dans la langue qu'il lisait.
 */
export function withLang(state: LangState, lang: Lang): LangState {
  return { lang, support: lang === 'hv' ? state.support : lang };
}

export function withSupport(state: LangState, support: SupportLang): LangState {
  return { ...state, support };
}

export interface LangSources {
  /** `location.search`. */
  search: string;
  /** Valeurs lues dans le stockage local, `null` si absentes. */
  storedLang: string | null;
  storedSupport: string | null;
  /** `navigator.languages`. */
  navigatorLanguages: readonly string[];
}

/**
 * État initial. Par ordre de priorité : le paramètre `?lang=`, puis le choix mémorisé,
 * puis les défauts (haut valyrien, langue d'appui déduite du navigateur).
 */
export function initialLangState(sources: LangSources): LangState {
  const remembered: LangState = {
    lang: isLang(sources.storedLang) ? sources.storedLang : DEFAULT_LANG,
    support: isSupportLang(sources.storedSupport)
      ? sources.storedSupport
      : supportFromNavigator(sources.navigatorLanguages),
  };
  const requested = langFromSearch(sources.search);
  return requested ? withLang(remembered, requested) : remembered;
}
