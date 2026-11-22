/**
 * Contrat d'accessibilité entre l'enveloppe et les vues.
 *
 * Chaque vue rend un seul <main id="contenu"> : c'est la cible du lien d'évitement et
 * l'endroit où le focus se pose après une navigation. Un écran de l'enveloppe (page
 * introuvable, erreur, version en construction) porte en plus l'attribut `data-ecran`,
 * que l'audit des liens (tests/functional/links.mjs) recherche pour signaler un lien mort.
 */

export const MAIN_ID = 'contenu';

/** Valeurs de l'attribut `data-ecran`. */
export type ScreenKind = 'introuvable' | 'erreur' | 'construction';

/** Pose le focus sur le contenu principal, sans faire défiler. Faux si la vue n'est pas encore rendue. */
export function focusMain(): boolean {
  const main = document.getElementById(MAIN_ID);
  if (!main) return false;
  if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
  main.focus({ preventScroll: true });
  return true;
}
