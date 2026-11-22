import { useCallback, useRef } from 'react';
import type { BurnPlayOptions, BurnTransitionHandle } from './BurnTransition';

/**
 * Raccourci pour piloter une `<BurnTransition ref={ref} />` :
 *
 *   const burn = useBurnTransition();
 *   …
 *   <BurnTransition ref={burn.ref} />
 *   await burn.play({ onCovered: () => navigate(to) });
 *
 * Si la surcouche n'est pas montée, `play` change le contenu sans passage du feu.
 */
export function useBurnTransition() {
  const ref = useRef<BurnTransitionHandle>(null);
  const play = useCallback(async (options?: BurnPlayOptions): Promise<void> => {
    if (ref.current) return ref.current.play(options);
    await options?.onCovered?.();
  }, []);
  return { ref, play };
}
