import type { ReactNode } from 'react';

import { VLink } from '@/app/version';
import { useT } from '@/core/i18n';

import styles from './NeighbourNav.module.css';

export interface Neighbour {
  to: string;
  /** Rang ou date, en petit au-dessus du titre (déjà composé). */
  mark?: ReactNode;
  /** `gothique` : un chiffre de volume ; `date` : une date en cartel (la gothique défigure les sigles d'ère). */
  markKind?: 'gothique' | 'date';
  /** Titre, déjà composé (glose comprise s'il y a lieu). */
  title: ReactNode;
}

interface NeighbourNavProps {
  /** Clé du nom de la navigation (« Volumes voisins »). */
  labelKey: string;
  prevKey: string;
  nextKey: string;
  prev: Neighbour | null;
  next: Neighbour | null;
}

/**
 * Précédent et suivant, en pied de feuillet : à gauche ce qui précède, à droite ce qui suit,
 * comme les réclames d'un manuscrit. Aucune flèche : le mot dit le sens.
 */
export function NeighbourNav({ labelKey, prevKey, nextKey, prev, next }: NeighbourNavProps) {
  const t = useT();
  if (!prev && !next) return null;
  return (
    <nav className={styles.nav} aria-label={t(labelKey)}>
      {prev ? (
        <VLink to={prev.to} className={styles.link} rel="prev" data-side="prev">
          <span className={styles.kind}>{t(prevKey)}</span>
          {prev.mark ? <span className={styles.mark} data-kind={prev.markKind ?? 'gothique'}>{prev.mark}</span> : null}
          <span className={styles.title}>{prev.title}</span>
        </VLink>
      ) : (
        <span />
      )}
      {next ? (
        <VLink to={next.to} className={styles.link} rel="next" data-side="next">
          <span className={styles.kind}>{t(nextKey)}</span>
          {next.mark ? <span className={styles.mark} data-kind={next.markKind ?? 'gothique'}>{next.mark}</span> : null}
          <span className={styles.title}>{next.title}</span>
        </VLink>
      ) : null}
    </nav>
  );
}
