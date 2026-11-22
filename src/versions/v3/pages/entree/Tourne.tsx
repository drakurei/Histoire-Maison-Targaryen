/*
 * Copie adaptée de `PageTurn` de la V1 (src/versions/v1-codex/components/PageTurn.tsx) : même
 * feuillet qui pivote sur la reliure gauche du folio (620 ms, `power3.inOut`), même ombre ;
 * mais la page ne tourne que si le lecteur a demandé le volume voisin depuis le pied du folio
 * (v3-spec §7, mouvement 5). Une navigation par la fasce ou les chroniques joue le feu, jamais
 * la page. La colonne et la fasce ne bougent pas : seul le folio est couvert.
 */
import { useRef } from 'react';
import type { ReactNode } from 'react';

import { DURATION, EASE, gsap, MOTION_CONDITIONS, useGSAP } from '@/core/motion';
import styles from '@/versions/v1-codex/components/PageTurn.module.css';

const TURN_SECONDS = 0.62;
const TURN_ANGLE = -88;

/** Le prochain changement de volume tournera la page : posé par le lien du pied du folio. */
let armed = false;

export function armerTourne(): void {
  armed = true;
}

interface TourneProps {
  /** Le volume affiché : la page tourne quand il change, si le pied du folio l'a demandé. */
  volume: string;
  children: ReactNode;
}

export function Tourne({ volume, children }: TourneProps) {
  const scope = useRef<HTMLDivElement>(null);
  const previous = useRef<string | null>(null);

  useGSAP(
    () => {
      const before = previous.current;
      previous.current = volume;
      const wanted = armed;
      armed = false;
      if (before === null || before === volume) return;

      const root = scope.current;
      const leaf = root?.querySelector<HTMLElement>('[data-turn-leaf]');
      const cast = root?.querySelector<HTMLElement>('[data-turn-cast]');
      const folio = root?.querySelector<HTMLElement>('[data-folio]');
      if (!root || !leaf || !cast || !folio || !wanted) return;

      const mm = gsap.matchMedia();
      mm.add(MOTION_CONDITIONS, (context) => {
        if (context.conditions?.reduced) {
          gsap.fromTo(folio, { opacity: 0 }, { opacity: 1, duration: DURATION.gesteCourt, ease: EASE.power4, clearProps: 'opacity' });
          return;
        }
        const box = folio.getBoundingClientRect();
        const frame = root.getBoundingClientRect();
        const top = Math.max(0, box.top - frame.top);
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
        const guard = window.setTimeout(() => timeline.progress(1), TURN_SECONDS * 1000 + 400);
        return () => window.clearTimeout(guard);
      });
      return () => mm.revert();
    },
    { dependencies: [volume], scope },
  );

  return (
    <div ref={scope} className={styles.turn}>
      {children}
      <div className={styles.cast} data-turn-cast="" aria-hidden="true" />
      <div className={styles.leaf} data-turn-leaf="" aria-hidden="true" />
    </div>
  );
}
