import { Link } from 'react-router-dom';

import { Gloss } from '@/core/i18n';

import styles from './SystemAction.module.css';

/** Une commande d'un écran de l'enveloppe ; `labelKey` est une clé d'interface. */
export type SystemActionSpec =
  /** Lien du routeur. */
  | { labelKey: string; to: string }
  /** Lien dur : recharge l'application, pour repartir d'un état sain après une erreur. */
  | { labelKey: string; href: string }
  /** Bouton. */
  | { labelKey: string; onAct: () => void };

interface SystemActionProps {
  action: SystemActionSpec;
}

export function SystemAction({ action }: SystemActionProps) {
  const label = <Gloss k={action.labelKey} classes={{ main: styles.primary, tr: styles.translation }} />;

  if ('to' in action) {
    return (
      <Link className={styles.link} to={action.to}>
        {label}
      </Link>
    );
  }
  if ('href' in action) {
    return (
      <a className={styles.link} href={action.href}>
        {label}
      </a>
    );
  }
  return (
    <button type="button" className={styles.button} onClick={action.onAct}>
      {label}
    </button>
  );
}
