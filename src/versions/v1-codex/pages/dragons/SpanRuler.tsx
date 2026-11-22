import { useLang, useT } from '@/core/i18n';

import styles from './SpanRuler.module.css';

interface SpanRulerProps {
  /** Envergure relative, Balerion = 1. */
  span: number;
  name: string;
}

const TICKS = [0.25, 0.5, 0.75] as const;

/**
 * Règle de l'envergure : la longueur de Balerion fait la règle entière, celle du dragon est
 * tracée en rouge par-dessus. Quart, moitié, trois quarts sont gravés.
 */
export function SpanRuler({ span, name }: SpanRulerProps) {
  const t = useT();
  const { reading } = useLang();
  const share = Math.min(Math.max(span, 0), 1);
  const value = new Intl.NumberFormat(reading, { maximumFractionDigits: 2 }).format(share);

  return (
    <div className={styles.ruler} role="img" aria-label={t('page.dragon.span.ruler', { name, value })}>
      <div className={styles.track}>
        <span className={styles.bar} style={{ inlineSize: `${share * 100}%` }} />
        {TICKS.map((tick) => (
          <span key={tick} className={styles.tick} style={{ insetInlineStart: `${tick * 100}%` }} />
        ))}
        <span className={`${styles.tick} ${styles.end}`} style={{ insetInlineStart: '100%' }} />
      </div>
      <div className={styles.labels} aria-hidden="true">
        <span className={styles.zero}>0</span>
        <span className={styles.value} style={{ insetInlineStart: `${share * 100}%` }} data-edge={share > 0.82 || undefined}>
          {value}
        </span>
        <span className={styles.balerion}>{t('page.dragon.span.balerion')}</span>
      </div>
    </div>
  );
}
