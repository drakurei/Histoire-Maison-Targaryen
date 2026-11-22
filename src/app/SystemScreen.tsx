import { Gloss } from '@/core/i18n';

import { MAIN_ID } from './a11y';
import type { ScreenKind } from './a11y';
import { SystemAction } from './SystemAction';
import type { SystemActionSpec } from './SystemAction';
import styles from './SystemScreen.module.css';

interface SystemScreenProps {
  /** Nature de l'écran, exposée par `data-ecran` (lue par l'audit des liens). */
  kind: ScreenKind;
  /** Clé d'interface du titre : ce qui s'est passé. */
  titleKey: string;
  /** Clé d'interface de la phrase qui suit : quoi faire. */
  bodyKey?: string;
  /** Grand chiffre, quand l'écran numérote quelque chose de réel (le numéro d'une version). */
  numeral?: string;
  /** Une erreur s'annonce aux lecteurs d'écran dès qu'elle apparaît. */
  announce?: boolean;
  actions?: readonly SystemActionSpec[];
}

const glossClasses = { main: styles.primary, tr: styles.translation };

/** Gabarit sobre des écrans que l'enveloppe affiche hors des versions. */
export function SystemScreen({ kind, titleKey, bodyKey, numeral, announce = false, actions = [] }: SystemScreenProps) {
  return (
    <main id={MAIN_ID} tabIndex={-1} className={styles.screen} data-ecran={kind}>
      {numeral ? (
        <p className={styles.numeral} aria-hidden="true">
          {numeral}
        </p>
      ) : null}
      <div className={styles.text} role={announce ? 'alert' : undefined}>
        <h1 className={styles.title}>
          <Gloss k={titleKey} classes={glossClasses} />
        </h1>
        {bodyKey ? (
          <p className={styles.body}>
            <Gloss k={bodyKey} classes={glossClasses} />
          </p>
        ) : null}
        {actions.length > 0 ? (
          <div className={styles.actions}>
            {actions.map((action) => (
              <SystemAction key={action.labelKey} action={action} />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
