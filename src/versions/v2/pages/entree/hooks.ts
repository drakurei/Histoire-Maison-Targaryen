import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/** Ordinateur : la fasce porte la rangée des périodes, le parti a sa colonne collante. */
export const DESKTOP_QUERY = '(min-width: 1024px)';

/** Vrai tant que la requête média est satisfaite. */
export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
}

export interface Box {
  /** Bord gauche dans la fenêtre, en pixels. */
  left: number;
  width: number;
  height: number;
}

const NO_BOX: Box = { left: 0, width: 0, height: 0 };

/** Bord gauche, largeur et hauteur d'un élément, tenus à jour au redimensionnement. */
export function useBox<T extends HTMLElement>(): [RefObject<T | null>, Box] {
  const ref = useRef<T>(null);
  const [box, setBox] = useState<Box>(NO_BOX);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setBox((current) =>
        Math.abs(current.left - rect.left) < 0.5 && Math.abs(current.width - rect.width) < 0.5 && Math.abs(current.height - rect.height) < 0.5
          ? current
          : { left: rect.left, width: rect.width, height: rect.height },
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

/** La hauteur de la fenêtre, tenue à jour (les profils se mesurent sur elle). */
export function useViewportHeight(): number {
  const [height, setHeight] = useState(() => window.innerHeight);
  useEffect(() => {
    const update = () => setHeight(window.innerHeight);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return height;
}
