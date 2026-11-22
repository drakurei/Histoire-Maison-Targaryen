/** Adresses de l'enveloppe, hors des versions. Le plan de chaque version est décrit dans ARCHITECTURE.md. */

/** La racine redirige vers la version par défaut (`DEFAULT_VERSION`, src/app/routes.tsx). */
export const HOME_PATH = '/';

/** Espace de comparaison des trois versions. */
export const COMPARE_PATH = '/comparer';

/**
 * Chemin de publication, sans barre finale : vide en local, « /Histoire-Maison-Targaryen »
 * sur GitHub Pages (option `base` de Vite, variable BASE_PATH au build).
 */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/+$/, '');

/**
 * Pour un attribut href écrit à la main (<a href> hors de <Link>) : préfixe une adresse
 * interne par le chemin de publication. Les valeurs passées à navigate() restent sans préfixe,
 * le routeur ajoute lui-même son basename.
 */
export function withBase(to: string): string {
  return to.startsWith('/') && !to.startsWith('//') ? `${BASE_PATH}${to}` : to;
}
