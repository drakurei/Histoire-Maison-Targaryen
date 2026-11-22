/**
 * Déplacer et agrandir le rouleau : glisser (souris, stylet, doigt), molette, pincement à deux
 * doigts, et les commandes des boutons. Pointer Events seuls, aucun écouteur de défilement
 * de la page. Les mouvements programmés (recentrer) passent par GSAP, coupés si le lecteur
 * demande moins de mouvement.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { DURATION, EASE, gsap, prefersReducedMotion } from '@/core/motion';

export interface View {
  x: number;
  y: number;
  k: number;
}

interface Bounds {
  width: number;
  height: number;
}

export const MIN_ZOOM = 0.18;
export const MAX_ZOOM = 2.4;
const DRAG_SLOP = 5;

function clampZoom(k: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));
}

export interface PanZoom {
  view: View;
  /** Vrai pendant un glissement : la sélection au relâché n'a pas lieu. */
  dragged: RefObject<boolean>;
  zoomBy: (factor: number) => void;
  /** Place le point (x, y) du dessin au centre de la scène, à l'échelle `k`. */
  centerOn: (x: number, y: number, k?: number, animate?: boolean) => void;
  /** Tout le dessin dans la scène. */
  fit: (animate?: boolean) => void;
  /** Ramène le point dans la scène s'il en sort (focus au clavier). */
  reveal: (x: number, y: number, margin?: number) => void;
}

/**
 * `stage` : l'élément qui reçoit les gestes et donne la taille visible ; `content` : la taille
 * du dessin. La vue est une translation puis une échelle.
 */
export function usePanZoom(stage: RefObject<HTMLElement | null>, content: Bounds): PanZoom {
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 0.6 });
  const live = useRef<View>(view);
  const tween = useRef<gsap.core.Tween | null>(null);
  const dragged = useRef(false);

  const apply = useCallback((next: View) => {
    live.current = next;
    setView(next);
  }, []);

  const size = useCallback((): Bounds => {
    const rect = stage.current?.getBoundingClientRect();
    return { width: rect?.width ?? 800, height: rect?.height ?? 600 };
  }, [stage]);

  const animateTo = useCallback(
    (target: View, animate: boolean) => {
      tween.current?.kill();
      if (!animate || prefersReducedMotion()) {
        apply(target);
        return;
      }
      const state = { ...live.current };
      tween.current = gsap.to(state, {
        ...target,
        duration: DURATION.passage * 0.72,
        ease: EASE.expo,
        onUpdate: () => apply({ ...state }),
      });
    },
    [apply],
  );

  const zoomAround = useCallback(
    (factor: number, cx: number, cy: number) => {
      const current = live.current;
      const k = clampZoom(current.k * factor);
      const ratio = k / current.k;
      apply({ k, x: cx - (cx - current.x) * ratio, y: cy - (cy - current.y) * ratio });
    },
    [apply],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const { width, height } = size();
      const current = live.current;
      const k = clampZoom(current.k * factor);
      const ratio = k / current.k;
      const cx = width / 2;
      const cy = height / 2;
      animateTo({ k, x: cx - (cx - current.x) * ratio, y: cy - (cy - current.y) * ratio }, true);
    },
    [animateTo, size],
  );

  const centerOn = useCallback(
    (x: number, y: number, k?: number, animate = true) => {
      const { width, height } = size();
      const scale = clampZoom(k ?? live.current.k);
      animateTo({ k: scale, x: width / 2 - x * scale, y: height / 2 - y * scale }, animate);
    },
    [animateTo, size],
  );

  const fit = useCallback(
    (animate = true) => {
      const { width, height } = size();
      const k = clampZoom(Math.min(width / content.width, height / content.height) * 0.96);
      animateTo({ k, x: (width - content.width * k) / 2, y: (height - content.height * k) / 2 }, animate);
    },
    [animateTo, content.height, content.width, size],
  );

  const reveal = useCallback(
    (x: number, y: number, margin = 80) => {
      const { width, height } = size();
      const current = live.current;
      const sx = x * current.k + current.x;
      const sy = y * current.k + current.y;
      if (sx > margin && sx < width - margin && sy > margin && sy < height - margin) return;
      centerOn(x, y);
    },
    [centerOn, size],
  );

  // Gestes : un pointeur glisse, deux pointeurs pincent ; la molette agrandit autour du curseur.
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let start: { x: number; y: number } | null = null;
    let pinch: { distance: number; k: number } | null = null;

    const local = (event: PointerEvent | WheelEvent) => {
      const rect = element.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const spread = () => {
      const [a, b] = [...pointers.values()];
      if (!a || !b) return null;
      return { distance: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      if (event.target instanceof Element && event.target.closest('[data-pan-ignore]')) return;
      tween.current?.kill();
      pointers.set(event.pointerId, local(event));
      if (pointers.size === 1) {
        start = local(event);
        dragged.current = false;
      } else if (pointers.size === 2) {
        const s = spread();
        if (s) pinch = { distance: s.distance, k: live.current.k };
        dragged.current = true;
      }
    };

    const onMove = (event: PointerEvent) => {
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      const point = local(event);
      pointers.set(event.pointerId, point);
      if (pointers.size === 2 && pinch) {
        const s = spread();
        if (!s) return;
        const k = clampZoom(pinch.k * (s.distance / pinch.distance));
        zoomAround(k / live.current.k, s.cx, s.cy);
        return;
      }
      if (start && !dragged.current && Math.hypot(point.x - start.x, point.y - start.y) > DRAG_SLOP) {
        dragged.current = true;
        element.setPointerCapture(event.pointerId);
        element.dataset.dragging = '';
      }
      if (dragged.current) {
        const current = live.current;
        apply({ ...current, x: current.x + point.x - previous.x, y: current.y + point.y - previous.y });
      }
    };

    const onUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) {
        start = null;
        delete element.dataset.dragging;
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-pan-ignore]')) return;
      event.preventDefault();
      tween.current?.kill();
      const point = local(event);
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      zoomAround(Math.exp(-delta * 0.0016), point.x, point.y);
    };

    element.addEventListener('pointerdown', onDown);
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerup', onUp);
    element.addEventListener('pointercancel', onUp);
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      element.removeEventListener('pointerdown', onDown);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerup', onUp);
      element.removeEventListener('pointercancel', onUp);
      element.removeEventListener('wheel', onWheel);
    };
  }, [apply, stage, zoomAround]);

  useEffect(() => () => void tween.current?.kill(), []);

  return { view, dragged, zoomBy, centerOn, fit, reveal };
}
