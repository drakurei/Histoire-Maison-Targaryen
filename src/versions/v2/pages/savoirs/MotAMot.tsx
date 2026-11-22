import { useMemo } from 'react';

import type { Localized } from '@/core/content/types';
import { useTx, useTypo, VALYRIAN_TAG } from '@/core/i18n';

import { parseLiteral } from './glose';
import styles from './MotAMot.module.css';

interface MotAMotProps {
  literal: Localized;
  /** `grand` : la figure de l'accueil de la langue. */
  taille?: 'courant' | 'grand';
  className?: string;
}

/**
 * La glose interlinéaire d'une édition savante (DESIGN §3) : sous chaque mot valyrien, son
 * sens en italique, puis son analyse dans la voix du musée. Les colonnes se suivent et
 * passent à la ligne comme des mots.
 */
export function MotAMot({ literal, taille = 'courant', className }: MotAMotProps) {
  const tx = useTx();
  const typo = useTypo();
  const { mots, remarques } = useMemo(() => parseLiteral(tx(literal)), [tx, literal]);
  if (mots.length === 0) return null;
  return (
    <div className={`${styles.root} ${className ?? ''}`} data-taille={taille}>
      <ol role="list" className={styles.mots}>
        {mots.map((mot, index) => (
          <li key={`${mot.hv}-${index}`} className={styles.mot}>
            <span className={styles.hv} lang={VALYRIAN_TAG}>
              {mot.hv}
            </span>
            {mot.sens ? <span className={styles.sens}>{typo(mot.sens)}</span> : null}
            {mot.analyse ? <span className={styles.analyse}>{typo(mot.analyse)}</span> : null}
          </li>
        ))}
      </ol>
      {remarques.length > 0 ? <p className={styles.remarque}>{typo(remarques.join(' ; '))}</p> : null}
    </div>
  );
}
