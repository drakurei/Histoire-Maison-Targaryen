import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { yearToX } from '@/core/timeline';
import { BurnTransition, useBurnTransition } from '@/shared/gl';

import { fasceScale, readFasceGeometry } from './fasce/geometry';

interface FeuApi {
  /**
   * Le feu part de l'année désignée sur la fasce, couvre l'écran, puis la vue `href` arrive
   * (adresse complète, déjà préfixée). Sans année, il part du pointeur ou du bas à gauche.
   * Un seul passage à la fois : un second appel pendant un passage navigue sans feu.
   */
  passer: (href: string, origin?: { year?: number | null; point?: readonly [number, number] }) => void;
}

const FeuContext = createContext<FeuApi | null>(null);

/** Le feu de la version (spec §6, mouvement 3). */
export function useFeu(): FeuApi {
  const api = useContext(FeuContext);
  if (!api) throw new Error('useFeu() est appelé hors de <FeuHost>.');
  return api;
}

/** Point de départ du feu, en fraction de la fenêtre, origine en bas à gauche (repère du shader). */
function originOf(origin: { year?: number | null; point?: readonly [number, number] } | undefined): readonly [number, number] {
  if (origin?.point) {
    const [x, y] = origin.point;
    return [x / window.innerWidth, 1 - y / window.innerHeight];
  }
  const geometry = readFasceGeometry();
  if (origin?.year !== undefined && origin.year !== null && geometry) {
    const x = geometry.left + yearToX(fasceScale(geometry.width), origin.year);
    return [x / window.innerWidth, geometry.massTop / window.innerHeight];
  }
  return [0.08, 0.06];
}

/**
 * Monte une seule fois `BurnTransition` (shader compilé pendant un temps mort) et donne
 * `useFeu()`. Mouvement réduit : le voile d'obsidienne de 150 ms du composant.
 */
export function FeuHost({ children }: { children: ReactNode }) {
  const { ref: burnRef, play } = useBurnTransition();
  const navigate = useNavigate();
  const busy = useRef(false);

  const passer = useCallback<FeuApi['passer']>(
    (href, origin) => {
      if (busy.current) {
        navigate(href);
        return;
      }
      busy.current = true;
      void play({ origin: originOf(origin), onCovered: () => navigate(href) })
        .finally(() => {
          busy.current = false;
        });
    },
    [play, navigate],
  );

  const api = useMemo(() => ({ passer }), [passer]);

  return (
    <FeuContext value={api}>
      {children}
      <BurnTransition ref={burnRef} duration={1.1} />
    </FeuContext>
  );
}
