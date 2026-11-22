import type { HvStatus, Lang, Localized, SupportLang, UiString } from '@/core/content/types';

import { readingLang } from './lang';

/** Valeurs à insérer dans une chaîne : `{ n: 3 }` remplit « {n} ». */
export type Vars = Readonly<Record<string, string | number>>;

/** Chaîne d'interface résolue pour la langue courante. */
export interface UiText {
  /** Ce qui s'affiche en première ligne : la forme valyrienne si elle existe en mode `hv`, sinon la langue lue. */
  primary: string;
  /** Traduction dans la langue d'appui. Présente seulement quand `primary` est du valyrien. */
  gloss?: string;
  /** Statut linguistique de la forme valyrienne (attestée, dérivée, éditoriale, adaptation). */
  status?: HvStatus;
  /** Note du linguiste sur la forme valyrienne. */
  note?: string;
  /** Vrai si `primary` est du haut valyrien : à baliser `lang="art-x-valyrian"`. */
  isHv: boolean;
}

/** Titre de contenu résolu : même logique que `UiText`, sans statut ni note. */
export interface TitleText {
  primary: string;
  gloss?: string;
  isHv: boolean;
}

const PLACEHOLDER = /\{(\w+)\}/g;

/** Remplace chaque « {nom} » par `vars.nom`. Un nom sans valeur reste tel quel, donc visible. */
export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(PLACEHOLDER, (placeholder: string, name: string) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : placeholder,
  );
}

/** Ce qui s'affiche à la place d'une clé absente : la clé entre crochets. */
export function missingKeyText(key: string): string {
  return `[${key}]`;
}

/**
 * Résout une chaîne d'interface.
 * En `hv` : la forme valyrienne en première ligne et la langue d'appui en glose ;
 * sans forme valyrienne, ou en `fr` / `en`, la langue lue seule.
 */
export function resolveUi(
  entry: UiString | undefined,
  key: string,
  lang: Lang,
  support: SupportLang,
  vars?: Vars,
): UiText {
  if (!entry) return { primary: missingKeyText(key), isHv: false };

  if (lang === 'hv' && entry.hv) {
    return {
      primary: interpolate(entry.hv, vars),
      gloss: interpolate(entry[support], vars),
      status: entry.status,
      note: entry.note,
      isHv: true,
    };
  }
  return { primary: interpolate(entry[readingLang(lang, support)], vars), isHv: false };
}

/** Résout un titre de contenu, qui peut porter une forme valyrienne validée. */
export function resolveTitle(loc: Localized, lang: Lang, support: SupportLang): TitleText {
  if (lang === 'hv' && loc.hv) {
    return { primary: loc.hv, gloss: loc[support], isHv: true };
  }
  return { primary: loc[readingLang(lang, support)], isHv: false };
}

/** Texte de récit, toujours dans la langue lue. Champ absent : chaîne vide. */
export function resolveText(loc: Localized | null | undefined, reading: SupportLang): string {
  return loc ? loc[reading] : '';
}

/**
 * Fabrique un signalement de clé absente qui n'avertit qu'une fois par clé,
 * pour ne pas noyer la console à chaque rendu.
 */
export function createMissingKeyReporter(warn: (message: string) => void): (key: string) => void {
  const reported = new Set<string>();
  return (key) => {
    if (reported.has(key)) return;
    reported.add(key);
    warn(`[i18n] Clé d'interface absente de content/interface/ui.json : « ${key} ».`);
  };
}
