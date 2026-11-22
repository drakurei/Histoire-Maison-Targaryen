import type { MouseEvent, ReactNode } from 'react';

import { useT } from '@/core/i18n';
import styles from '@/versions/v1-codex/pages/chronicles/NeighbourNav.module.css';
import { Lien } from '@/versions/v2/components/Lien';
import type { LinkYear } from '@/versions/v2/state/links';

export interface Voisin {
  to: string;
  year?: LinkYear;
  /** Chiffre gothique (volume) ou date en cartel (événement). */
  mark?: ReactNode;
  markKind?: 'gothique' | 'date';
  title: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

interface VoisinsProps {
  label: string;
  prevLabel: string;
  nextLabel: string;
  prev: Voisin | null;
  next: Voisin | null;
}

/**
 * Les réclames du pied du folio (V1 `NeighbourNav`, mêmes styles) : ce qui précède à gauche,
 * ce qui suit à droite, sans flèche ; le mot dit le sens. Les liens gardent l'année du lecteur
 * (V2 `Lien`) et laissent la vue choisir son mouvement (page qui tourne ou feu).
 */
export function Voisins({ label, prevLabel, nextLabel, prev, next }: VoisinsProps) {
  const t = useT();
  if (!prev && !next) return null;
  const link = (voisin: Voisin, side: 'prev' | 'next') => (
    <Lien to={voisin.to} year={voisin.year} className={styles.link} rel={side} data-side={side} onClick={voisin.onClick}>
      <span className={styles.kind}>{t(side === 'prev' ? prevLabel : nextLabel)}</span>
      {voisin.mark ? (
        <span className={styles.mark} data-kind={voisin.markKind ?? 'gothique'}>
          {voisin.mark}
        </span>
      ) : null}
      <span className={styles.title}>{voisin.title}</span>
    </Lien>
  );
  return (
    <nav className={styles.nav} aria-label={t(label)}>
      {prev ? link(prev, 'prev') : <span />}
      {next ? link(next, 'next') : null}
    </nav>
  );
}
