import styles from './GrandNombre.module.css';

interface GrandNombreProps {
  /** Le nombre, déjà écrit (année sans signe, chiffre romain de la période, ordinal du roi). */
  value: string;
  /** Sigle d'ère ou complément, en vraies petites capitales. */
  era?: string;
  /**
   * Évidé : le noir du sable apparaît à travers le rouge du profil sur lequel le nombre est
   * posé (`mix-blend-mode` sur fond opaque, jamais un texte en dégradé). Sinon, ivoire.
   */
  hollow?: boolean;
  className?: string;
}

/**
 * Le grand nombre de la vue (spec §2.4) : un seul `--t6` par vue, en Grenze Gotisch. Le plus
 * souvent l'année réglée, sinon le chiffre de la vue. Décoratif pour la lecture d'écran :
 * la vue écrit la même information en texte.
 */
export function GrandNombre({ value, era, hollow = false, className }: GrandNombreProps) {
  return (
    <p className={`${styles.root} ${className ?? ''}`} data-evide={hollow ? '' : undefined} aria-hidden="true">
      <span className={styles.nombre}>{value}</span>
      {era ? <span className={`${styles.ere} ere`}>{era}</span> : null}
    </p>
  );
}
