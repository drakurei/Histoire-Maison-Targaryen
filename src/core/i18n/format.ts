import type { Lang, SupportLang, Year } from '@/core/content/types';

/**
 * Dates de la chronique. Les années se comptent depuis la Conquête : négatives avant,
 * positives après, `null` quand les sources ne donnent rien.
 *
 * Le nombre et son sigle sont liés par une espace insécable : une date ne se coupe pas
 * en fin de ligne. Les intervalles prennent un tiret demi-cadratin.
 */

/** Espace insécable (U+00A0). */
export const NBSP = '\u00A0';
/** Tiret demi-cadratin (U+2013), celui des intervalles. */
export const EN_DASH = '\u2013';

type Era = 'before' | 'after';

const ERA: Record<SupportLang, Record<Era, string>> = {
  fr: { before: `av.${NBSP}C.`, after: `apr.${NBSP}C.` },
  en: { before: 'BC', after: 'AC' },
};

const UNKNOWN: Record<SupportLang, string> = {
  fr: 'date inconnue',
  en: 'date unknown',
};

const UNTIL: Record<SupportLang, (end: string) => string> = {
  fr: (end) => `jusqu’en ${end}`,
  en: (end) => `until ${end}`,
};

const FROM: Record<SupportLang, (start: string) => string> = {
  fr: (start) => `à partir de ${start}`,
  en: (start) => `from ${start}`,
};

/**
 * Le haut valyrien n'a pas de sigle d'ère attesté et l'on n'en invente pas : en mode `hv`,
 * passer la langue du récit (`reading` de `useLang()`). Si `hv` arrive malgré tout ici,
 * les sigles sont ceux de l'œuvre originale (BC, AC).
 */
function dateLang(lang: Lang): SupportLang {
  return lang === 'hv' ? 'en' : lang;
}

function eraOf(year: number): Era {
  return year < 0 ? 'before' : 'after';
}

/** Une année en deux morceaux : le nombre, puis le sigle d'ère. */
export interface YearParts {
  value: string;
  era: string;
}

/**
 * Le nombre et le sigle séparés, pour composer le sigle à part (petites capitales,
 * DESIGN.md §3). `null` si l'année est inconnue : il n'y a alors rien à découper.
 */
export function yearParts(year: Year | undefined, lang: Lang): YearParts | null {
  if (year === null || year === undefined) return null;
  return { value: String(Math.abs(year)), era: ERA[dateLang(lang)][eraOf(year)] };
}

/** « 114 av. C. », « 42 apr. C. », "114 BC", "42 AC". Année inconnue : « date inconnue », "date unknown". */
export function formatYear(year: Year | undefined, lang: Lang): string {
  const parts = yearParts(year, lang);
  return parts ? `${parts.value}${NBSP}${parts.era}` : UNKNOWN[dateLang(lang)];
}

/**
 * Intervalle d'années.
 * - même ère : « 54–56 apr. C. » (le sigle une seule fois) ;
 * - à cheval sur la Conquête : « 2 av. C. – 1 apr. C. » ;
 * - bornes égales : l'année seule ;
 * - une borne inconnue : « jusqu'en 102 av. C. », « à partir de 42 apr. C. » ;
 * - deux bornes inconnues : « date inconnue ».
 */
export function formatSpan(from: Year | undefined, to: Year | undefined, lang: Lang): string {
  const l = dateLang(lang);
  const start = from ?? null;
  const end = to ?? null;

  if (start === null && end === null) return UNKNOWN[l];
  if (start === null) return UNTIL[l](formatYear(end, l));
  if (end === null) return FROM[l](formatYear(start, l));
  if (start === end) return formatYear(start, l);

  if (eraOf(start) === eraOf(end)) {
    return `${Math.abs(start)}${EN_DASH}${Math.abs(end)}${NBSP}${ERA[l][eraOf(start)]}`;
  }
  return `${formatYear(start, l)}${NBSP}${EN_DASH} ${formatYear(end, l)}`;
}
