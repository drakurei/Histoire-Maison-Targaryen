import type { Belligerent } from '@/core/content/types';

import styles from './CampMark.module.css';

/**
 * La marque d'un camp (spec §5.11) : jamais la couleur seule, une forme par camp. Les Noirs,
 * un carré plein d'ivoire ; les Verts, un rond plein de vert ; la Maison et la couronne, un
 * triangle de sang (le rouge est ici la donnée de la Maison) ; l'or, un triangle d'or ; un
 * camp sans couleur attestée, un carré vide.
 */
export function CampMark({ tone }: { tone: Belligerent['tone'] }) {
  return (
    <svg className={styles.marque} data-ton={tone} viewBox="0 0 16 16" width="0.85em" height="0.85em" aria-hidden="true" focusable="false">
      {tone === 'vert' ? <circle cx={8} cy={8} r={6} /> : null}
      {tone === 'noir' ? <rect x={2.5} y={2.5} width={11} height={11} /> : null}
      {tone === 'rouge' || tone === 'or' ? <path d="M8 2.2 14.2 13.6H1.8Z" /> : null}
      {tone === 'neutre' ? <rect x={3} y={3} width={10} height={10} className={styles.vide} /> : null}
    </svg>
  );
}
