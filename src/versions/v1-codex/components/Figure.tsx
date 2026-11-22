import type { ReactNode } from 'react';

import { useT } from '@/core/i18n';

import styles from './Figure.module.css';

interface FigureProps {
  /** La figure elle-même : dessin, courbe, carte, planche. */
  children: ReactNode;
  /** Légende, déjà traduite ou composée. */
  caption: ReactNode;
  /** Numéro, seulement si la page compte plusieurs figures (« Fig. 3 »). */
  number?: number;
  className?: string;
}

/**
 * Figure : une figure et sa légende de cartel, sans cadre. Le numéro n'apparaît que s'il
 * numérote une vraie suite de figures dans la page.
 */
export function Figure({ children, caption, number, className }: FigureProps) {
  const t = useT();
  return (
    <figure className={`${styles.figure} ${className ?? ''}`}>
      <div className={styles.plate}>{children}</div>
      <figcaption className={styles.caption}>
        {number !== undefined ? <span className={styles.number}>{t('page.bati.figure.number', { n: number })}</span> : null}
        {caption}
      </figcaption>
    </figure>
  );
}
