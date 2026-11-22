/**
 * Langues : affichage (haut valyrien, français, anglais), langue d'appui, gloses, dates.
 * Contrat : documentation/architecture/ARCHITECTURE.md, « Langues ».
 */
export { I18nProvider } from './I18nProvider';
export { useLang, useT, useTitle, useTx, useUi } from './hooks';
export { Gloss } from './Gloss';
export type { GlossClasses, GlossProps } from './Gloss';
export { formatSpan, formatYear, yearParts } from './format';
export type { YearParts } from './format';
export { interpolate } from './resolve';
export type { TitleText, UiText, Vars } from './resolve';
export { DEFAULT_LANG, LANGS, SUPPORT_LANGS, VALYRIAN_TAG } from './lang';
export type { LangApi } from './context';
export type { Lang, SupportLang } from '@/core/content/types';
