/**
 * Mouvement : GSAP enregistré une fois, durées et courbes alignées sur les jetons, mouvement réduit.
 *
 * Importer ce module charge GSAP. Un composant qui a seulement besoin de savoir si le
 * lecteur veut moins de mouvement importe `@/core/motion/reducedMotion`, qui ne charge rien.
 */
export { DrawSVGPlugin, Flip, gsap, ScrollTrigger, SplitText, useGSAP } from './gsap';
export { prefersReducedMotion, usePrefersReducedMotion } from './reducedMotion';
export {
  CSS_EASE,
  DURATION,
  EASE,
  FULL_MOTION_QUERY,
  MOTION_CONDITIONS,
  REDUCED_MOTION_QUERY,
} from './tokens';
export type { DurationName, EaseName } from './tokens';
