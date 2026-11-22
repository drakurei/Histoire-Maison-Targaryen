import type { ReactNode } from 'react';

import { Folio } from '@/versions/v1-codex/components/Folio';

import styles from './Feuillet.module.css';

interface FeuilletProps {
  children: ReactNode;
  /** Numéro du volume (période) : foliotation en pied, seulement dans une période. */
  volume?: number;
  /** Numéro du feuillet dans le volume. */
  leaf?: number;
  /** Rouleau : toute la largeur (l'arbre entier). */
  wide?: boolean;
  /** Identifiant du titre qui nomme l'article. */
  labelledBy?: string;
  /** `div` quand le feuillet est une partie d'un article plus large (Parti3). */
  as?: 'article' | 'div';
  className?: string;
}

/**
 * Le folio de la V3 (v3-spec §3.1) : la feuille de vélin de la V1 (`Folio`, bords irréguliers
 * et ombre courte sur ordinateur, pli d'ombre au téléphone, grille de 10 colonnes : récit 7,
 * marge savante 3), sans signets, dans un `article`. Ses enfants directs se rangent avec
 * `col` de `@/versions/v1-codex/components/grid`. Les encres suivent `data-surface="velin"`.
 */
export function Feuillet({ children, volume, leaf, wide = false, labelledBy, as: Tag = 'article', className }: FeuilletProps) {
  return (
    <Tag className={styles.feuillet} aria-labelledby={Tag === 'article' ? labelledBy : undefined}>
      <Folio volume={volume} leaf={leaf} wide={wide} ribbons={false} className={className}>
        {children}
      </Folio>
    </Tag>
  );
}
