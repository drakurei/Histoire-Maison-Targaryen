import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/core/motion/reducedMotion';
import { createShaderCanvas, isWebGLAvailable } from './createShaderCanvas';
import type { ShaderCanvas as ShaderCanvasHandle, Uniforms } from './createShaderCanvas';
import styles from './ShaderCanvas.module.css';

export interface ShaderCanvasProps {
  /** Source GLSL du fragment (voir `shaders/`). */
  fragment: string;
  /** Uniformes libres ; un changement est pris en compte à l'image suivante. */
  uniforms?: Uniforms;
  /** Fige l'image en cours. */
  paused?: boolean;
  /** Ce qui s'affiche sans WebGL (ou si le shader ne compile pas) : image, SVG, aplat. */
  fallback: ReactNode;
  /** Classe du cadre : c'est lui qui donne la taille, le canvas le remplit. */
  className?: string;
  /** Couche transparente (alpha prémultiplié) posée sur la page. */
  transparent?: boolean;
  /** Plafond d'images par seconde. */
  fps?: number;
  /** Fraction de la définition, 0,25 à 1. */
  resolution?: number;
  /** Instant montré quand le lecteur demande moins de mouvement (secondes). 12 par défaut. */
  stillTime?: number;
}

/**
 * Un shader plein cadre, décoratif (`aria-hidden`), avec repli statique.
 *
 * Mouvement réduit : une seule image, à `stillTime`, puis plus rien. Le canvas est créé à
 * chaque montage et jeté au démontage : un contexte rendu au navigateur ne se réutilise pas.
 */
export function ShaderCanvas({
  fragment,
  uniforms,
  paused = false,
  fallback,
  className,
  transparent = false,
  fps,
  resolution,
  stillTime = 12,
}: ShaderCanvasProps) {
  const frame = useRef<HTMLDivElement>(null);
  const handle = useRef<ShaderCanvasHandle | null>(null);
  const latest = useRef(uniforms);
  const [failed, setFailed] = useState(() => !isWebGLAvailable());
  const reduced = usePrefersReducedMotion();
  const still = reduced || paused;

  useEffect(() => {
    latest.current = uniforms;
  }, [uniforms]);

  useEffect(() => {
    const host = frame.current;
    if (!host || failed) return;
    const canvas = document.createElement('canvas');
    canvas.className = styles.canvas ?? '';
    host.appendChild(canvas);
    const shader = createShaderCanvas(canvas, {
      fragment,
      uniforms: latest.current,
      transparent,
      fps,
      resolution,
      autoplay: false,
      startTime: stillTime,
    });
    if (!shader) {
      canvas.remove();
      setFailed(true);
      return;
    }
    handle.current = shader;
    return () => {
      handle.current = null;
      shader.destroy();
      canvas.remove();
    };
  }, [fragment, transparent, fps, resolution, stillTime, failed]);

  // Lecture, pause et image figée.
  useEffect(() => {
    const shader = handle.current;
    if (!shader) return;
    if (still) {
      shader.pause();
      if (reduced) shader.setTime(stillTime);
      shader.render();
    } else {
      shader.play();
    }
  }, [still, reduced, stillTime, fragment, transparent, fps, resolution, failed]);

  // Uniformes : appliqués aussitôt ; redessinés tout de suite si la boucle est arrêtée.
  useEffect(() => {
    const shader = handle.current;
    if (!shader || !uniforms) return;
    shader.setUniforms(uniforms);
    if (!shader.isPlaying()) shader.render();
  }, [uniforms]);

  if (failed) return <div className={className}>{fallback}</div>;
  return <div ref={frame} className={[styles.frame, className].filter(Boolean).join(' ')} aria-hidden="true" />;
}
