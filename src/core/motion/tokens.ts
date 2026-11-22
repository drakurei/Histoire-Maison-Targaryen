/**
 * Durées et courbes du mouvement, côté JavaScript.
 * Mêmes valeurs que les jetons `--d-*` et `--c-*` de src/styles/tokens.css :
 * src/styles/tokens.test.ts échoue si les deux fichiers divergent.
 */

/** Durées en secondes, l'unité de GSAP. */
export const DURATION = {
  /** Ce qui reste quand le lecteur demande moins de mouvement : un fondu, rien d'autre. */
  fondu: 0.15,
  /** Survol, pression, focus. */
  gesteCourt: 0.16,
  /** Ouvrir, filtrer, sélectionner. */
  geste: 0.22,
  /** Déplier un volet. */
  gesteLong: 0.28,
  /** D'une section à l'autre. */
  passage: 0.7,
  /** Chorégraphie : seuil, ouverture. */
  scene: 1.4,
} as const;

/** Les deux seules courbes admises (DESIGN.md §5) : ni élasticité, ni rebond. */
export const EASE = {
  expo: 'expo.out',
  power4: 'power4.out',
} as const;

/** Équivalents CSS des courbes GSAP, pour une transition écrite en style ou en WAAPI. */
export const CSS_EASE = {
  expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  power4: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
export const FULL_MOTION_QUERY = '(prefers-reduced-motion: no-preference)';

/**
 * Conditions prêtes pour `gsap.matchMedia()` :
 *
 *   const mm = gsap.matchMedia();
 *   mm.add(MOTION_CONDITIONS, (context) => {
 *     const reduced = context.conditions?.reduced;
 *     …
 *   });
 */
export const MOTION_CONDITIONS = {
  full: FULL_MOTION_QUERY,
  reduced: REDUCED_MOTION_QUERY,
} as const;

export type DurationName = keyof typeof DURATION;
export type EaseName = keyof typeof EASE;
