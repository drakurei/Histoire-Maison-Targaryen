import type { ReactNode } from 'react';

import type { Localized } from '@/core/content/types';
import { Gloss, useTitle } from '@/core/i18n';

import styles from './Titre.module.css';

type TitreProps = { className?: string; children?: ReactNode } & (
  | { k: string; text?: never }
  | { text: Localized; k?: never }
);

/**
 * Le `h1` d'une vue (spec §3.2) : Texturina maigre, `--t5`, bas de casse, serré, sur deux
 * lignes au plus, avec sa glose interlinéaire en mode `hv`. Aucun titre rouge. `children` :
 * ce qui suit le titre dans l'en-tête (années, marque de fiabilité). Un nom dont la forme
 * valyrienne est la même que sa traduction (Balerion, Rhaenyra) ne répète pas sa glose.
 */
export function Titre({ k, text, className, children }: TitreProps) {
  const title = useTitle();
  const echo = text !== undefined && title(text).gloss === title(text).primary;
  return (
    <header className={`${styles.root} ${className ?? ''}`}>
      <h1 className={styles.titre}>
        {k !== undefined ? <Gloss k={k} classes={{ tr: styles.glose }} /> : <Gloss text={text} classes={{ tr: echo ? styles.echo : styles.glose }} />}
      </h1>
      {children}
    </header>
  );
}
