import type { ReactNode } from 'react';

import type { HvStatus } from '@/core/content/types';
import { useT } from '@/core/i18n';

import styles from './StatusMark.module.css';

/**
 * Statut d'une forme valyrienne : une marque carrée (les marques de fiabilité sont rondes,
 * pour qu'on ne confonde jamais la certitude d'une forme et celle d'un fait). Même règle :
 * moins il y a d'encre, moins la forme est sûre. Grille de 16, trait de 1.5.
 *
 *   attestée   carré plein
 *   dérivée    carré dont la moitié est encrée (bâtie sur de l'attesté)
 *   éditoriale carré vide
 *   reprise    carré ouvert aux angles (la forme n'est pas fermée)
 */
const SHAPES: Record<HvStatus, ReactNode> = {
  atteste: <path d="M3 3h10v10H3z" fill="currentColor" stroke="none" />,
  derive: (
    <>
      <path d="M3.75 3.75h8.5v8.5h-8.5z" />
      <path d="M12.25 3.75v8.5h-8.5z" fill="currentColor" stroke="none" />
    </>
  ),
  editorial: <path d="M3.75 3.75h8.5v8.5h-8.5z" />,
  adaptation: <path d="M3.75 6.5V3.75H6.5M9.5 3.75h2.75V6.5M12.25 9.5v2.75H9.5M6.5 12.25H3.75V9.5" />,
};

interface StatusGlyphProps {
  status: HvStatus;
  size?: string;
  className?: string;
  /** Nom accessible ; sans lui, la marque est décorative (le libellé est écrit à côté). */
  title?: string;
}

export function StatusGlyph({ status, size = '1em', className, title }: StatusGlyphProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {SHAPES[status]}
    </svg>
  );
}

interface StatusMarkProps {
  status: HvStatus;
  /** Glyphe seul : le libellé devient son nom accessible. */
  compact?: boolean;
  className?: string;
}

/** La marque et son libellé de cartel (« Attestée », « Dérivée »…). */
export function StatusMark({ status, compact = false, className }: StatusMarkProps) {
  const t = useT();
  const label = t(`page.savoirs.status.${status}`);
  return (
    <span className={`${styles.mark} ${className ?? ''}`} data-status={status}>
      <StatusGlyph status={status} size="1.05em" className={styles.glyph} title={compact ? label : undefined} />
      {compact ? null : <span className={styles.label}>{label}</span>}
    </span>
  );
}
