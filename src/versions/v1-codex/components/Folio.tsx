import type { ReactNode } from 'react';

import { useT } from '@/core/i18n';

import styles from './Folio.module.css';
import { toRoman } from './numerals';
import { Ribbons } from './Ribbons';

interface FolioProps {
  children: ReactNode;
  /** Numéro du volume lu (1 à 8) : affiche la foliotation au pied de la feuille. */
  volume?: number;
  /** Numéro du feuillet dans le volume (rang de l'événement, par exemple). */
  leaf?: number;
  /** Rouleau : la feuille prend toute la largeur du bureau (lignée, carte). */
  wide?: boolean;
  /** Faux pour une feuille sans signets (une seconde feuille sur la même page). */
  ribbons?: boolean;
  className?: string;
}

/**
 * Folio : la feuille de vélin posée sur la table. Bords à peine irréguliers, ombre courte et
 * dure, signets des registres en tête, grille de 10 colonnes (récit 7, marge 3), foliotation
 * en pied. À placer dans le <main> de la page ; ses enfants directs se rangent sur la grille
 * (voir `col` dans ./grid). Aucun `position: fixed` à l'intérieur : la découpe le rognerait.
 */
export function Folio({ children, volume, leaf, wide = false, ribbons = true, className }: FolioProps) {
  const t = useT();
  const foliation =
    volume === undefined
      ? null
      : leaf === undefined
        ? t('page.bati.folio.volume', { volume: toRoman(volume) })
        : t('page.bati.folio.leaf', { volume: toRoman(volume), leaf });

  return (
    <div className={styles.folio} data-wide={wide || undefined} data-folio="">
      <div className={styles.shadow} aria-hidden="true" />
      <div className={`${styles.sheet} ${className ?? ''}`} data-surface="velin">
        <div className={styles.grid}>{children}</div>
        {foliation ? <p className={styles.foliation}>{foliation}</p> : null}
      </div>
      {ribbons ? <Ribbons /> : null}
    </div>
  );
}
