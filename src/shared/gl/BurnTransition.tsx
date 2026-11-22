import { useEffect, useImperativeHandle, useRef } from 'react';
import type { Ref } from 'react';
import { DURATION, gsap, prefersReducedMotion, useGSAP } from '@/core/motion';
import { createShaderCanvas, isWebGLAvailable } from './createShaderCanvas';
import type { ShaderCanvas } from './createShaderCanvas';
import { BURN, BURN_DEFAULTS } from './shaders/burn';
import styles from './BurnTransition.module.css';

export interface BurnPlayOptions {
  /**
   * Appelé quand la suie couvre tout l'écran : c'est là qu'on change le contenu (navigation,
   * changement de section). La suie attend la fin de la promesse avant de tomber.
   */
  onCovered?: () => void | Promise<void>;
  /** Point de départ du feu pour ce passage (0..1, origine en bas à gauche). */
  origin?: readonly [number, number];
}

export interface BurnTransitionHandle {
  /** Joue un passage du feu ; la promesse se résout quand la page est rendue. */
  play(options?: BurnPlayOptions): Promise<void>;
}

export interface BurnTransitionProps {
  ref?: Ref<BurnTransitionHandle>;
  /** Point de départ du feu par défaut. En bas à gauche, du côté de la lumière. */
  origin?: readonly [number, number];
  /** Durée totale en secondes, bornée entre 0,9 et 1,4. 1,2 par défaut. */
  duration?: number;
}

/** Part du passage où le feu avance ; le reste est la chute de la suie. */
const COVER_SHARE = 0.56;

type Vars = gsap.TweenVars;

/**
 * Le feu efface et révèle : surcouche plein écran pour les passages entre grandes sections.
 *
 * Le front de feu traverse l'écran et laisse la suie, `onCovered` change le contenu, puis la
 * suie tombe et rend la page. Sans WebGL ou si le lecteur demande moins de mouvement : un voile
 * d'obsidienne en fondu de 150 ms à l'aller comme au retour. Le shader est compilé pendant un
 * temps mort du navigateur, avant le premier passage, et son tampon ne fait qu'un pixel au repos.
 */
export function BurnTransition({ ref, origin = BURN_DEFAULTS.u_origin, duration = 1.2 }: BurnTransitionProps) {
  const root = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const shader = useRef<ShaderCanvas | null>(null);
  const running = useRef<Promise<void> | null>(null);
  const settings = useRef({ origin, duration });

  useEffect(() => {
    settings.current = { origin, duration };
  }, [origin, duration]);

  // Compilation anticipée, sur un canvas créé ici et jeté au démontage.
  useEffect(() => {
    const host = root.current;
    if (!host || !isWebGLAvailable()) return;
    let canvas: HTMLCanvasElement | null = null;
    const prepare = () => {
      canvas = document.createElement('canvas');
      canvas.className = styles.canvas ?? '';
      host.prepend(canvas);
      shader.current = createShaderCanvas(canvas, {
        fragment: BURN,
        uniforms: { ...BURN_DEFAULTS },
        transparent: true,
        autoplay: false,
      });
      if (!shader.current) canvas.remove();
    };
    const idle = window.requestIdleCallback?.(prepare, { timeout: 2500 });
    const timer = idle === undefined ? window.setTimeout(prepare, 400) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) window.clearTimeout(timer);
      shader.current?.destroy();
      shader.current = null;
      canvas?.remove();
    };
  }, []);

  const { contextSafe } = useGSAP({ scope: root });

  // Chaque interpolation est créée dans le contexte du composant : le démontage l'interrompt.
  const tween = contextSafe(
    (target: object, vars: Vars) =>
      new Promise<void>((resolve) => {
        gsap.to(target, { ...vars, onComplete: resolve, onInterrupt: resolve });
      }),
  );

  const run = async (options: BurnPlayOptions | undefined): Promise<void> => {
    const overlay = root.current;
    const cover = veil.current;
    if (!overlay || !cover) {
      await options?.onCovered?.();
      return;
    }
    const fire = prefersReducedMotion() ? null : shader.current;
    overlay.dataset.active = '';
    try {
      if (!fire) {
        await tween(cover, { opacity: 1, duration: DURATION.fondu, ease: 'none' });
        await options?.onCovered?.();
        await tween(cover, { opacity: 0, duration: DURATION.fondu, ease: 'none' });
        return;
      }
      const total = Math.min(1.4, Math.max(0.9, settings.current.duration));
      const state = { progress: 0, clear: 0 };
      const from = options?.origin ?? settings.current.origin;
      const seed = Math.random() * 40;
      const start = performance.now();
      const draw = () => {
        fire.setUniforms({ u_progress: state.progress, u_clear: state.clear, u_origin: from, u_seed: seed });
        fire.setTime((performance.now() - start) / 1000);
        fire.render();
      };
      fire.resize();
      draw();
      // Le feu avance à vitesse constante : aucune courbe, c'est la combustion qui dessine.
      await tween(state, { progress: 1, duration: total * COVER_SHARE, ease: 'none', onUpdate: draw });
      await options?.onCovered?.();
      fire.resize();
      await tween(state, { clear: 1, duration: total * (1 - COVER_SHARE), ease: 'none', onUpdate: draw });
    } finally {
      delete overlay.dataset.active;
      gsap.set(cover, { opacity: 0 });
      // Couche cachée : le tampon retombe à un pixel.
      shader.current?.resize();
    }
  };

  const play = (options?: BurnPlayOptions): Promise<void> => {
    if (running.current) return running.current;
    const pass = run(options).finally(() => {
      running.current = null;
    });
    running.current = pass;
    return pass;
  };

  useImperativeHandle(ref, () => ({ play }));

  return (
    <div ref={root} className={styles.overlay} aria-hidden="true">
      <div ref={veil} className={styles.veil} />
    </div>
  );
}
