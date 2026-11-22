import { useMemo } from 'react';

import { createTimeScale } from '@/core/timeline';

import { MasseSvg } from './fasce/MasseSvg';

interface ProfilProps {
  /** Durée montrée : un segment de la fasce, agrandi. */
  from: number;
  to: number;
  width: number;
  height: number;
  /** Hauteur, en pixels, de quinze dragons. Par défaut 45 % de `height` (spec §2.4). */
  full?: number;
  /** Durée de la vue, en sang ; le reste du segment en cramoisi. */
  span?: readonly [number, number] | null;
  off?: boolean;
  className?: string;
}

/**
 * Le profil : le segment de la fasce qui correspond à une durée, agrandi, même couleur, même
 * hachure. Réutilisé par la colonne du parti (soudé à la fasce), l'Index, le portail, la page
 * introuvable. Dessin seul (`aria-hidden`) : la vue dit la même chose en texte.
 */
export function Profil({ from, to, width, height, full, span = null, off = false, className }: ProfilProps) {
  const scale = useMemo(() => createTimeScale({ domain: [from, to], range: [0, Math.max(1, width)] }), [from, to, width]);
  return (
    <MasseSvg
      scale={scale}
      width={width}
      height={height}
      full={full ?? height * 0.45}
      span={span}
      off={off}
      className={className}
    />
  );
}
