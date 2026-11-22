/**
 * Amène à l'écran l'élément que désigne l'ancre de l'adresse (« /sources#fab »,
 * « /langue/lexique#mot-nav.portal »), une fois la vue montée : la page arrive en bloc
 * chargé à la demande, après que le navigateur a renoncé à suivre l'ancre lui-même.
 * Sert aux pages de la langue et au registre des sources.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useHashScroll(ready = true): string {
  const { hash } = useLocation();
  useEffect(() => {
    if (!ready || !hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(id);
      if (!target) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
      if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash, ready]);
  return hash;
}
