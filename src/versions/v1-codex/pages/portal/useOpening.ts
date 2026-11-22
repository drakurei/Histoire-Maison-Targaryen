/**
 * L'ouverture du portail, jouée une fois quand le seuil se lève (DESIGN.md §7, v1-codex §4).
 *
 * Le noir ; la pierre en monte ; une lueur rouge la traverse ; l'ombre d'un dragon passe ;
 * l'emblème se trace ; le titre s'inscrit ligne à ligne ; les dos des volumes se lèvent un à
 * un. 3,2 s au plus, passable d'un clic ou d'une touche ; rien si le lecteur demande moins de
 * mouvement. Tant que le seuil couvre le site, la scène est tenue dans son état initial pour
 * que le lever du seuil découvre du noir, et non la page déjà posée.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { gsap, useGSAP } from '@/core/motion';
import { usePrefersReducedMotion } from '@/core/motion/reducedMotion';
import { useSeuil } from '@/shared/seuil/SeuilGate';

export type OpeningPhase = 'idle' | 'primed' | 'running';

/** Durée totale de la chorégraphie, en secondes (plafond de la spécification : 3,2). */
export const OPENING_SECONDS = 3.1;

const HIDDEN_LINE = 'inset(-25% 100% -35% 0%)';
const SHOWN_LINE = 'inset(-25% 0% -35% 0%)';

export interface Opening {
  phase: OpeningPhase;
  /** Compteur du survol de l'ombre de dragon (0 : pas encore). */
  flight: number;
  /** Vrai tant que l'ombre a le droit de passer (faux une fois l'ouverture passée). */
  shadow: boolean;
  skip: () => void;
}

export function useOpening(scope: RefObject<HTMLElement | null>): Opening {
  const { open: seuilOpen } = useSeuil();
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<OpeningPhase>(() => (seuilOpen && !reduced ? 'primed' : 'idle'));
  const [flight, setFlight] = useState(0);
  const [shadow, setShadow] = useState(true);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  // Le seuil couvre (ou recouvre, si le lecteur rejoue l'ouverture) : on tient la scène. Il se lève : on joue.
  useEffect(() => {
    if (reduced) {
      setPhase('idle');
      return;
    }
    if (seuilOpen) {
      setPhase('primed');
      setFlight(0);
      setShadow(true);
    } else setPhase((current) => (current === 'primed' ? 'running' : current));
  }, [seuilOpen, reduced]);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root || phase === 'idle') return;
      const q = gsap.utils.selector(root);
      const veil = q('[data-op-veil]');
      const glow = q('[data-op-glow]');
      const emblem = q('[data-op-emblem] path');
      const lines = q('[data-op-line]');
      const after = q('[data-op-after]');
      // Les dos de volumes appartiennent au bâti : on les anime sans les toucher, et tout est rendu à la fin.
      // Hors de la portée du contexte : on les cherche dans le document entier.
      const spines = Array.from(document.querySelectorAll<HTMLElement>('[data-spines] li'));

      if (phase === 'primed') {
        gsap.set(veil, { autoAlpha: 1 });
        gsap.set(glow, { autoAlpha: 0 });
        gsap.set(emblem, { drawSVG: '0%', fillOpacity: 0, stroke: 'currentColor', strokeWidth: 1.6 });
        gsap.set(lines, { clipPath: HIDDEN_LINE });
        gsap.set(after, { autoAlpha: 0 });
        gsap.set(spines, { yPercent: 104 });
        return;
      }

      // Départs explicites (fromTo) : la scène tenue pendant le seuil vient d'être rendue, et
      // l'état initial est reposé dans le même passage, avant que rien ne soit peint.
      const tl = gsap.timeline({
        defaults: { ease: 'power4.out' },
        onComplete: () => {
          timeline.current = null;
          setShadow(false);
          setPhase('idle');
        },
      });
      timeline.current = tl;
      tl.fromTo(veil, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.75, ease: 'power2.out' }, 0)
        .fromTo(glow, { autoAlpha: 1, xPercent: -100 }, { xPercent: 100, duration: 0.9, ease: 'power2.inOut' }, 0.2)
        .set(glow, { autoAlpha: 0 }, 1.1)
        .call(() => setFlight(1), [], 0.35)
        .fromTo(
          emblem,
          { drawSVG: '0%', fillOpacity: 0, stroke: 'currentColor', strokeWidth: 1.6 },
          { drawSVG: '100%', duration: 1.05, ease: 'power2.inOut', stagger: 0.012 },
          0.55,
        )
        .to(emblem, { fillOpacity: 1, strokeWidth: 0, duration: 0.5, ease: 'power2.out' }, 1.45)
        .fromTo(lines, { clipPath: HIDDEN_LINE }, { clipPath: SHOWN_LINE, duration: 0.62, ease: 'power3.inOut', stagger: 0.16 }, 0.95)
        .fromTo(after, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'none', stagger: 0.08 }, 1.85)
        .fromTo(spines, { yPercent: 104 }, { yPercent: 0, duration: 0.6, ease: 'expo.out', stagger: 0.04 }, 2.1);
      // Ne jamais dépasser le plafond, même si l'onglet a perdu des images.
      const guard = window.setTimeout(() => timeline.current?.progress(1), (OPENING_SECONDS + 0.6) * 1000);
      return () => window.clearTimeout(guard);
    },
    // Chaque phase défait la précédente : à la fin, plus aucun style posé ne reste, sur la page comme sur les dos.
    { scope, dependencies: [phase], revertOnUpdate: true },
  );

  const skip = useCallback(() => {
    setShadow(false);
    timeline.current?.progress(1);
  }, []);

  // Un clic ou une touche passe l'ouverture (la tabulation reste la tabulation).
  useEffect(() => {
    if (phase !== 'running') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.metaKey || event.ctrlKey || event.altKey) return;
      skip();
    };
    window.addEventListener('pointerdown', skip);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', onKey);
    };
  }, [phase, skip]);

  return { phase, flight, shadow, skip };
}
