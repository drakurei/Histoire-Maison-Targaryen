/**
 * Point d'entrée des types de contenu, et seulement des types.
 *
 * Les données s'importent depuis leur module (`@/core/content/dragons`, `…/timeline`, etc.) :
 * chaque jeu reste ainsi dans son propre bloc de chargement. Réexporter ici une valeur
 * ramènerait tous les jeux dans le bloc initial.
 */
export type * from './types';
