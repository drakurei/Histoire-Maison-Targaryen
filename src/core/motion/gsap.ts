/**
 * Enregistrement unique de GSAP et de ses modules.
 *
 * Tout le projet importe GSAP d'ici (`@/core/motion`), jamais du paquet : l'enregistrement
 * a lieu une seule fois, avant tout usage, et les réglages par défaut valent partout.
 * Rappel du contrat : toujours `useGSAP` avec `scope`, et `gsap.matchMedia()` avec
 * `MOTION_CONDITIONS` pour le mouvement réduit.
 */
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { DURATION, EASE } from './tokens';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, DrawSVGPlugin);

// Sans précision, une animation est un geste : courte, sans rebond.
gsap.defaults({ duration: DURATION.geste, ease: EASE.power4 });

// Sur téléphone, la barre d'adresse qui se replie change la hauteur de la fenêtre :
// ce n'est pas une raison de recalculer tous les déclencheurs de défilement.
ScrollTrigger.config({ ignoreMobileResize: true });

export { DrawSVGPlugin, Flip, gsap, ScrollTrigger, SplitText, useGSAP };
