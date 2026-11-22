/*
 * Copie adaptée de `CampMark` de la V2 (src/versions/v2/pages/registres/CampMark.tsx) : mêmes
 * formes, mais les encres suivent la surface (v3-spec §6.11). Sur le vélin, les Noirs sont
 * un carré plein d'encre ; sur le champ, d'ivoire. Les Verts, un rond plein de vert. La
 * Maison et la couronne, un triangle de rubrique (vélin) ou de sang (champ) ; l'or, un
 * triangle d'or d'encre ou d'or ; un camp sans couleur attestée, un carré vide.
 */
import type { Belligerent } from '@/core/content/types';

import styles from './MarqueCamp.module.css';

export function MarqueCamp({ tone }: { tone: Belligerent['tone'] }) {
  return (
    <svg className={styles.marque} data-ton={tone} viewBox="0 0 16 16" width="0.85em" height="0.85em" aria-hidden="true" focusable="false">
      {tone === 'vert' ? <circle cx={8} cy={8} r={6} /> : null}
      {tone === 'noir' ? <rect x={2.5} y={2.5} width={11} height={11} /> : null}
      {tone === 'rouge' || tone === 'or' ? <path d="M8 2.2 14.2 13.6H1.8Z" /> : null}
      {tone === 'neutre' ? <rect x={3} y={3} width={10} height={10} className={styles.vide} /> : null}
    </svg>
  );
}
