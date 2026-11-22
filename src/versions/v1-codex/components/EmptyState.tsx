import { VLink } from '@/app/version';
import { Gloss, useT } from '@/core/i18n';

import styles from './EmptyState.module.css';

interface EmptyStateProps {
  /** Clé de ce qui manque (« Aucun événement ne répond à ces filtres »). */
  titleKey: string;
  /** Clé de la phrase qui dit quoi faire. */
  bodyKey?: string;
  /** Une action : un bouton (`onClick`) ou un lien interne (`to`). */
  action?: { labelKey: string; onClick?: () => void; to?: string };
  className?: string;
}

/**
 * EmptyState : un état vide qui invite à agir. Une phrase à l'encre, une consigne, une
 * action ; ni illustration, ni cadre.
 */
export function EmptyState({ titleKey, bodyKey, action, className }: EmptyStateProps) {
  const t = useT();
  return (
    <div className={`${styles.empty} ${className ?? ''}`} role="status">
      <p className={styles.title}>
        <Gloss k={titleKey} />
      </p>
      {bodyKey ? <p className={styles.body}>{t(bodyKey)}</p> : null}
      {action?.to ? (
        <VLink to={action.to} className={styles.action}>
          {t(action.labelKey)}
        </VLink>
      ) : action?.onClick ? (
        <button type="button" className={styles.action} onClick={action.onClick}>
          {t(action.labelKey)}
        </button>
      ) : null}
    </div>
  );
}
