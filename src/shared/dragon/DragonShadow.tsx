import { useEffect, useMemo, useRef } from 'react';
import { buildDragon } from '@/core/dragons/geometry';
import type { DragonShape } from '@/core/dragons/geometry';
import { MOTION_CONDITIONS, gsap, useGSAP } from '@/core/motion';
import { dragonSilhouette, layerPath } from './layers';
import styles from './DragonShadow.module.css';

export interface DragonShadowProps {
  /**
   * Déclencheur. Chaque passage à une valeur vraie lance un seul survol : `true`, ou un
   * nombre non nul qu'on incrémente pour rejouer.
   */
  play: boolean | number;
  /** Silhouette du dragon qui passe. Par défaut, un grand dragon sans identité. */
  look?: DragonShape;
  /** Durée du survol en secondes, bornée entre 2,5 et 4. */
  duration?: number;
  /** Bord par lequel l'ombre entre. */
  from?: 'left' | 'right';
  /** Appelé quand l'ombre est sortie (ou aussitôt, si le lecteur demande un mouvement réduit). */
  onDone?: () => void;
}

const ANONYMOUS: DragonShape = { span: 0.8, neck: 0.5, tail: 0.6, horns: 2 };

type Point = readonly [number, number];

/** Point et tangente d'une courbe de Bézier quadratique. */
function along(p0: Point, p1: Point, p2: Point, t: number): { x: number; y: number; dx: number; dy: number } {
  const u = 1 - t;
  return {
    x: u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    y: u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    dx: 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]),
    dy: 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]),
  };
}

/**
 * L'ombre d'un dragon traverse la fenêtre, une fois : elle entre par un bord, vire, bat des
 * ailes une fois et demie, sort par l'autre. Couche fixe, sans prise sur les clics.
 * Rien ne s'affiche si le lecteur demande un mouvement réduit.
 */
export function DragonShadow({ play, look = ANONYMOUS, duration = 3.2, from = 'left', onDone }: DragonShadowProps) {
  const veil = useRef<HTMLDivElement>(null);
  const figure = useRef<SVGSVGElement>(null);
  const outline = useRef<SVGPathElement>(null);
  const done = useRef(onDone);

  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  const { span, neck, tail, horns } = look;
  const shape = useMemo(() => ({ span, neck, tail, horns }), [span, neck, tail, horns]);
  const glide = useMemo(() => buildDragon(shape, { flap: 0.9, tailCurve: 0.3 }), [shape]);
  const seconds = Math.min(4, Math.max(2.5, duration));

  useGSAP(
    () => {
      if (!play) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_CONDITIONS, (context) => {
        const svg = figure.current;
        const path = outline.current;
        if (context.conditions?.reduced || !svg || !path) {
          done.current?.();
          return;
        }

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const box = svg.getBoundingClientRect();
        const w = box.width || vw * 0.6;
        const h = box.height || w;
        const dir = from === 'left' ? 1 : -1;
        const edge = w * 0.8;
        // Trajectoire courbe : entrée basse, virage vers le haut de la fenêtre, sortie à mi-hauteur.
        const p0: Point = [dir > 0 ? -edge : vw + edge, vh * 0.86];
        const p1: Point = [vw * (dir > 0 ? 0.4 : 0.6), -vh * 0.08];
        const p2: Point = [dir > 0 ? vw + edge : -edge, vh * 0.4];
        // Le dragon s'incline dans son virage.
        const roll = -0.35 * dir;
        const state = { t: 0 };

        const place = () => {
          const at = along(p0, p1, p2, state.t);
          gsap.set(svg, {
            x: at.x - w / 2,
            y: at.y - h * 0.42,
            rotation: (Math.atan2(at.dy, at.dx) * 180) / Math.PI + 90,
            scale: 0.94 + 0.12 * Math.sin(Math.PI * state.t),
          });
          const pose = { flap: 0.9 + 1.5 * state.t, bank: roll, tailCurve: 0.3 * Math.cos(Math.PI * 3 * state.t) };
          path.setAttribute('d', layerPath(dragonSilhouette, buildDragon(shape, pose).parts));
        };

        gsap.set(svg, { autoAlpha: 0, transformOrigin: '50% 42%' });
        place();
        const pass = gsap.timeline({
          onComplete: () => {
            gsap.set(svg, { autoAlpha: 0 });
            done.current?.();
          },
        });
        pass.to(state, { t: 1, duration: seconds, ease: 'none', onUpdate: place }, 0);
        pass.to(svg, { autoAlpha: 1, duration: seconds * 0.16, ease: 'none' }, 0);
        pass.to(svg, { autoAlpha: 0, duration: seconds * 0.16, ease: 'none' }, seconds * 0.84);
      });
    },
    { scope: veil, dependencies: [play, shape, seconds, from], revertOnUpdate: true },
  );

  return (
    <div ref={veil} className={styles.veil} aria-hidden="true">
      <svg ref={figure} className={styles.shadow} viewBox={glide.viewBox} focusable="false">
        <path ref={outline} d={layerPath(dragonSilhouette, glide.parts)} style={{ fill: dragonSilhouette.fill }} />
      </svg>
    </div>
  );
}
