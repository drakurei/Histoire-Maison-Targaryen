import { getReliabilityLevel } from '@/core/content/sources';
import type { Reliability } from '@/core/content/types';
import { ReliabilityGlyph } from '@/shared/marks/Marks';

import styles from './ReliabilityMark.module.css';
import { useTxTypo } from './typo';

interface ReliabilityMarkProps {
  level: Reliability;
  /** Glyphe seul (le libellé devient son nom accessible et son infobulle). */
  compact?: boolean;
  className?: string;
}

/**
 * ReliabilityMark : la marque dessinée du niveau de fiabilité et son libellé. Cinq niveaux,
 * cinq formes, partout les mêmes ; la couleur ne porte jamais seule le sens.
 */
export function ReliabilityMark({ level, compact = false, className }: ReliabilityMarkProps) {
  const tx = useTxTypo();
  const label = tx(getReliabilityLevel(level)?.label) || level;

  if (compact) {
    return (
      <span className={`${styles.mark} ${className ?? ''}`} data-level={level}>
        <ReliabilityGlyph level={level} size="1.05em" title={label} className={styles.glyph} />
      </span>
    );
  }
  return (
    <span className={`${styles.mark} ${className ?? ''}`} data-level={level}>
      <ReliabilityGlyph level={level} size="1.05em" className={styles.glyph} />
      <span className={styles.label}>{label}</span>
    </span>
  );
}
