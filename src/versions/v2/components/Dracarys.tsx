import { useEffect, useRef } from 'react';

import { useLienHref } from '../state/links';
import { hasPlayed, markPlayed } from '../state/storage';

import { useFeu } from './Feu';

const WORD = 'dracarys';
const TYPING = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]';

/**
 * Le détail caché (spec §6) : « dracarys » tapé hors d'un champ. Le feu part du pointeur
 * (du centre sur un écran tactile) et révèle le colophon au poinçon JD. Une fois par session.
 */
export function Dracarys({ disabled }: { disabled: boolean }) {
  const feu = useFeu();
  const href = useLienHref();
  const typed = useRef('');
  const pointer = useRef<readonly [number, number] | null>(null);

  useEffect(() => {
    if (disabled) return;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') pointer.current = [event.clientX, event.clientY];
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
      if (event.target instanceof Element && event.target.closest(TYPING)) return;
      typed.current = (typed.current + event.key.toLowerCase()).slice(-WORD.length);
      if (typed.current !== WORD || hasPlayed('dracarys')) return;
      typed.current = '';
      markPlayed('dracarys');
      const point = pointer.current ?? ([window.innerWidth / 2, window.innerHeight / 2] as const);
      feu.passer(href('/a-propos#poincon'), { point });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [disabled, feu, href]);

  return null;
}
