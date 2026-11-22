import type { ReactNode } from 'react';

import type { HvStatus } from '@/core/content/types';
import { useT } from '@/core/i18n';

import styles from './Statut.module.css';

/**
 * Statut d'une forme valyrienne : une marque carrée. Les marques de fiabilité d'un fait sont
 * rondes ; celles d'une forme sont carrées, pour qu'on ne confonde jamais les deux. Même
 * règle : moins il y a d'encre, moins la forme est sûre. Grille de 16, trait de 1.5.
 *
 *   attestée   carré plein
 *   dérivée    carré dont la moitié est encrée (bâtie sur de l'attesté)
 *   éditoriale carré vide
 *   reprise    carré ouvert aux angles (la forme n'est pas fermée)
 *
 * Mêmes formes que la V1 : une marque est la même partout (PRODUCT, principe 5). À remonter
 * dans `@/shared/marks` (signalé au rapport).
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

/** Les statuts, du plus sûr au plus distant. */
export const STATUSES: readonly HvStatus[] = ['atteste', 'derive', 'editorial', 'adaptation'];

interface GlyphProps {
  status: HvStatus;
  size?: string;
  className?: string;
  /** Nom accessible ; sans lui, la marque est décorative (le libellé est écrit à côté). */
  title?: string;
}

export function StatutGlyph({ status, size = '1em', className, title }: GlyphProps) {
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

interface StatutProps {
  status: HvStatus;
  /** Marque seule : le libellé devient son nom accessible. */
  compact?: boolean;
  className?: string;
}

/** La marque et son libellé (« attestée », « dérivée »…). */
export function Statut({ status, compact = false, className }: StatutProps) {
  const t = useT();
  const label = t(`page.savoirs.status.${status}`);
  return (
    <span className={`${styles.root} ${className ?? ''}`} data-statut={status}>
      <StatutGlyph status={status} className={styles.marque} title={compact ? label : undefined} />
      {compact ? null : <span>{label}</span>}
    </span>
  );
}
