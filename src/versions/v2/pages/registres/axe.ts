/**
 * L'axe des figures « fascé » des registres : une figure posée de bord à bord dans la page
 * lit la place de la fasce et son échelle, et convertit une année en abscisse dans son
 * propre repère. Ce qui est dessiné au-dessus d'une année tombe exactement au-dessus de la
 * même année sur la fasce (spec §2.4).
 */
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { yearEdges } from '../../model/geometry';
import { fasceScale, useFasceGeometry } from '../../components/fasce/geometry';

interface Box {
  left: number;
  width: number;
}

export interface Axe<T extends HTMLElement> {
  ref: RefObject<T | null>;
  /** Largeur de la figure, en pixels (0 avant la mesure). */
  width: number;
  /** Bords gauche et droit d'une année, dans le repère de la figure. */
  edges: (year: number) => readonly [number, number];
  /** Bord gauche d'une année. */
  x: (year: number) => number;
  ready: boolean;
}

/** Mesure de la figure (bord gauche dans la fenêtre, largeur), tenue à jour au redimensionnement. */
function useBox<T extends HTMLElement>(): [RefObject<T | null>, Box | null] {
  const ref = useRef<T>(null);
  const [box, setBox] = useState<Box | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setBox((current) =>
        current && Math.abs(current.left - rect.left) < 0.5 && Math.abs(current.width - rect.width) < 0.5
          ? current
          : { left: rect.left, width: rect.width },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  return [ref, box];
}

/** L'axe d'une figure alignée sur la fasce. Sans fasce mesurée, la figure prend sa propre largeur. */
export function useAxe<T extends HTMLElement>(): Axe<T> {
  const [ref, box] = useBox<T>();
  const geometry = useFasceGeometry();
  const left = geometry ? geometry.left - (box?.left ?? 0) : 0;
  const span = geometry ? geometry.width : (box?.width ?? 0);
  const scale = fasceScale(Math.max(1, span));

  const edges = useCallback(
    (year: number): readonly [number, number] => {
      const [a, b] = yearEdges(scale, year);
      return [left + a, left + b];
    },
    [scale, left],
  );
  const x = useCallback((year: number) => edges(year)[0], [edges]);

  return { ref, width: box?.width ?? 0, edges, x, ready: box !== null && span > 0 };
}
