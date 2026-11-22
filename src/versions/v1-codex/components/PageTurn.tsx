import { useRef } from 'react';
import type { ReactNode } from 'react';

import { DURATION, EASE, gsap, MOTION_CONDITIONS, useGSAP } from '@/core/motion';

import styles from './PageTurn.module.css';
import { useInternalPath, volumeIdOf } from './volumes';

/** Durée totale du tour de page (v1-codex §5). */
const TURN_SECONDS = 0.62;
/** Le feuillet tourne autour de la reliure, jusqu'à se présenter par la tranche. */
const TURN_ANGLE = -88;

/**
 * PageTurn : la transition entre deux vues. D'un volume à un autre, le feuillet tourne sur
 * la reliure (bord gauche du folio) et découvre la page suivante, 620 ms. Ailleurs, la vue
 * arrive en fondu de 160 ms. Mouvement réduit : rien. N'anime que transform et opacity, et
 * jamais le contenu lui-même (ses éléments fixes restent fixes).
 */
export function PageTurn({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const previous = useRef<string | null>(null);
  const path = useInternalPath();

  useGSAP(
    () => {
      const before = previous.current;
      previous.current = path;
      if (before === null || before === path) return;

      const root = scope.current;
      const content = root?.querySelector<HTMLElement>('[data-turn-content]');
      const leaf = root?.querySelector<HTMLElement>('[data-turn-leaf]');
      const cast = root?.querySelector<HTMLElement>('[data-turn-cast]');
      const folio = root?.querySelector<HTMLElement>('[data-folio]');
      if (!root || !content || !leaf || !cast) return;

      const fromVolume = volumeIdOf(before);
      const toVolume = volumeIdOf(path);
      const turns = folio !== null && fromVolume !== null && toVolume !== null && fromVolume !== toVolume;

      const mm = gsap.matchMedia();
      mm.add(MOTION_CONDITIONS, (context) => {
        if (context.conditions?.reduced) return;

        if (!turns || !folio) {
          gsap.fromTo(content, { opacity: 0 }, { opacity: 1, duration: DURATION.gesteCourt, ease: EASE.power4, clearProps: 'opacity' });
          return;
        }

        // Le feuillet prend la place du folio visible : sa largeur, au plus la hauteur de l'écran.
        const box = folio.getBoundingClientRect();
        const frame = root.getBoundingClientRect();
        const top = box.top - frame.top;
        const height = Math.min(box.height, window.innerHeight - Math.max(0, box.top));
        gsap.set([leaf, cast], { display: 'block', top, left: box.left - frame.left, width: box.width, height });

        const timeline = gsap.timeline({
          onComplete: () => {
            gsap.set([leaf, cast], { display: 'none', clearProps: 'transform,opacity' });
          },
        });
        timeline
          .fromTo(
            leaf,
            { rotateY: 0, transformPerspective: 2200, transformOrigin: '0% 50%' },
            { rotateY: TURN_ANGLE, duration: TURN_SECONDS, ease: 'power3.inOut' },
            0,
          )
          .fromTo(leaf, { '--ombre': 0 }, { '--ombre': 0.75, duration: TURN_SECONDS, ease: 'power3.in' }, 0)
          .fromTo(cast, { opacity: 0.55 }, { opacity: 0, duration: TURN_SECONDS, ease: 'power3.in' }, 0);

        // Onglet en arrière-plan : les images ne défilent plus. Le feuillet ne doit jamais rester
        // posé sur la page ; au-delà du délai, on achève le tour d'un coup.
        const guard = window.setTimeout(() => timeline.progress(1), TURN_SECONDS * 1000 + 400);
        return () => window.clearTimeout(guard);
      });
      return () => mm.revert();
    },
    { dependencies: [path], scope },
  );

  return (
    <div ref={scope} className={styles.turn}>
      <div data-turn-content="">{children}</div>
      <div className={styles.cast} data-turn-cast="" aria-hidden="true" />
      <div className={styles.leaf} data-turn-leaf="" aria-hidden="true" />
    </div>
  );
}
