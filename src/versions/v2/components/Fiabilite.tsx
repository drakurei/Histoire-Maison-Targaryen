import { getReliabilityLevel } from '@/core/content/sources';
import type { Reliability } from '@/core/content/types';
import { useTxTypo } from '@/core/i18n';
import { ReliabilityGlyph } from '@/shared/marks/Marks';

import styles from './Fiabilite.module.css';

interface FiabiliteProps {
  level: Reliability;
  /** Marque seule : le libellé devient son nom accessible. */
  compact?: boolean;
  className?: string;
}

/**
 * Le degré de certitude d'un fait : la marque dessinée (`@/shared/marks`, forme et couleur,
 * jamais la couleur seule) et son libellé. Cinq niveaux, cinq marques, partout les mêmes.
 */
export function Fiabilite({ level, compact = false, className }: FiabiliteProps) {
  const tx = useTxTypo();
  const label = tx(getReliabilityLevel(level)?.label);
  return (
    <span className={`${styles.root} ${className ?? ''}`} data-niveau={level}>
      <ReliabilityGlyph level={level} className={styles.marque} title={compact ? label : undefined} />
      {compact ? null : <span>{label}</span>}
    </span>
  );
}
