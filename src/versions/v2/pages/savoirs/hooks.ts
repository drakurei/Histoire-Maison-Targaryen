import { useEffect, useState } from 'react';

/** Ordinateur : le parti a sa colonne collante, la fasce sa rangée des périodes. */
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

/** Part de la hauteur de la fenêtre où se tient la ligne de lecture (spec §5.5). */
const READING_LINE = 0.4;

/**
 * L'élément en cours de lecture parmi `ids` : le dernier dont le haut a franchi la ligne de
 * lecture. Le premier tant qu'aucun ne l'a franchie. Lecture seule : ne fait rien défiler.
 */
export function useEnLecture(ids: readonly string[]): string | null {
  const key = ids.join('|');
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  useEffect(() => {
    const list = key ? key.split('|') : [];
    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = window.innerHeight * READING_LINE;
      let current: string | null = list[0] ?? null;
      for (const id of list) {
        const node = document.getElementById(id);
        if (!node) continue;
        if (node.getBoundingClientRect().top <= line) current = id;
        else break;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [key]);
  return active;
}
