import type { ReactNode } from 'react';

import type { Localized } from '@/core/content/types';
import { Gloss, useTitle } from '@/core/i18n';

import styles from './TitreChamp.module.css';

type TitreChampProps = {
  className?: string;
  /** `--t5` : seulement au portail et à l'introuvable. */
  monumental?: boolean;
  /** Ce qui suit le titre dans l'en-tête (années, marques, compte). */
  children?: ReactNode;
} & ({ k: string; text?: never } | { text: Localized; k?: never });

/**
 * Le `h1` d'une vue posée sur le champ (v3-spec §4.2) : Texturina 300, `--t4` (`--t5` au
 * portail et à l'introuvable), bas de casse, serré, ivoire. La glose s'écarte de
 * `max(--e3, 0.2em)` pour laisser passer les jambages ; une glose identique au nom se tait.
 */
export function TitreChamp({ k, text, className, monumental = false, children }: TitreChampProps) {
  const title = useTitle();
  const echo = text !== undefined && title(text).gloss === title(text).primary;
  return (
    <header className={`${styles.root} ${className ?? ''}`}>
      <h1 className={styles.titre} data-monumental={monumental ? '' : undefined}>
        {k !== undefined ? (
          <Gloss k={k} classes={{ tr: styles.glose }} />
        ) : (
          <Gloss text={text} classes={{ tr: echo ? styles.echo : styles.glose }} />
        )}
      </h1>
      {children}
    </header>
  );
}
