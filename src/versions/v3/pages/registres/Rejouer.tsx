import type { War } from '@/core/content/types';
import { useT, useTx } from '@/core/i18n';

import styles from './Rejouer.module.css';

interface RejouerProps {
  war: War;
  current: number | null;
  /** La bataille courante n'a pas de lieu : la carte garde le cadre précédent. */
  kept: boolean;
  onStep: (index: number) => void;
}

/**
 * « Rejouer » (v3-spec §6.11), sous la carte, sur le champ : bataille précédente et suivante,
 * jamais de lecture automatique ; l'état dit où l'on en est.
 */
export function Rejouer({ war, current, kept, onStep }: RejouerProps) {
  const t = useT();
  const tx = useTx();
  const total = war.battles.length;
  const battle = current !== null ? war.battles[current] : undefined;

  return (
    <div className={styles.rejouer} role="group" aria-label={t('v2.war.replay_label')}>
      <div className={styles.boutons}>
        <button type="button" className={styles.bouton} disabled={current === null || current === 0} onClick={() => current !== null && onStep(current - 1)}>
          {t('v2.war.replay_previous')}
        </button>
        <button type="button" className={styles.bouton} disabled={current !== null && current >= total - 1} onClick={() => onStep(current === null ? 0 : current + 1)}>
          {current === null ? t('v2.war.replay_start') : t('v2.war.replay_next')}
        </button>
      </div>
      <p className={styles.etat} aria-live="polite">
        {battle ? (
          <>
            <span className={styles.compteur}>{t('v2.war.replay_status', { n: (current ?? 0) + 1, total })}</span> {tx(battle.name)}
            {kept ? <span className={styles.garde}>{t('v2.war.place_kept')}</span> : null}
          </>
        ) : null}
      </p>
    </div>
  );
}
