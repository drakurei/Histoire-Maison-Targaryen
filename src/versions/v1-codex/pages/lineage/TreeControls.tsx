import { useT } from '@/core/i18n';

import styles from './TreeControls.module.css';

interface TreeControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  onAll: () => void;
}

/** Signe plus ou moins, tracé : deux traits d'encre de 1,5 sur la grille de 16. */
function Sign({ plus = false }: { plus?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className={styles.sign}>
      <path d="M3 8h10" />
      {plus ? <path d="M8 3v10" /> : null}
    </svg>
  );
}

/** Les commandes du rouleau : agrandir, réduire, recentrer, voir tout l'arbre. */
export function TreeControls({ onZoomIn, onZoomOut, onRecenter, onAll }: TreeControlsProps) {
  const t = useT();
  return (
    <div className={styles.controls} role="group" aria-label={t('page.lignee.zoom.label')}>
      <button type="button" className={styles.control} onClick={onZoomIn} aria-label={t('page.lignee.zoom.in')} title={t('page.lignee.zoom.in')}>
        <Sign plus />
      </button>
      <button type="button" className={styles.control} onClick={onZoomOut} aria-label={t('page.lignee.zoom.out')} title={t('page.lignee.zoom.out')}>
        <Sign />
      </button>
      <button type="button" className={`${styles.control} ${styles.wordy}`} onClick={onRecenter}>
        {t('page.lignee.zoom.recenter')}
      </button>
      <button type="button" className={`${styles.control} ${styles.wordy}`} onClick={onAll}>
        {t('page.lignee.zoom.all')}
      </button>
    </div>
  );
}
