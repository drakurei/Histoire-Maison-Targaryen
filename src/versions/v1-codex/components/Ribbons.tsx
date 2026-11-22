import type { CSSProperties } from 'react';

import { VLink } from '@/app/version';
import { useT, useUi, VALYRIAN_TAG } from '@/core/i18n';

import { inRegister, REGISTERS } from './registers';
import styles from './Ribbons.module.css';
import { useInternalPath } from './volumes';

/**
 * Longueur au repos de chaque signet, en rem : des rubans de tissu ne pendent jamais tous
 * à la même hauteur. Valeurs fixes (pas de hasard) pour que la page soit la même à chaque visite.
 */
const REST = [3.3, 4.1, 2.9, 4.5, 3.6, 3.95, 3.15];

/**
 * Ribbons : les signets rouges des registres, glissés dans le haut du folio (écran large).
 * Au repos on ne voit que le bout et l'initiale ; au survol ou au focus le ruban descend et
 * montre son libellé valyrien vertical et sa glose. Le registre courant pend plus bas.
 */
export function Ribbons() {
  const ui = useUi();
  const t = useT();
  const path = useInternalPath();

  return (
    <nav className={styles.ribbons} aria-label={t('page.bati.ribbons.label')}>
      <ul role="list" className={styles.row}>
        {REGISTERS.map((register, index) => {
          const label = ui(register.key);
          const current = inRegister(path, register);
          const rest = { '--repos': `${REST[index % REST.length]}rem` } as CSSProperties;
          return (
            <li key={register.id} className={styles.item} style={rest}>
              <VLink
                to={register.to}
                className={styles.ribbon}
                aria-current={current ? 'page' : undefined}
                data-current={current || undefined}
              >
                <span className={styles.label}>
                  <span className={styles.primary} lang={label.isHv ? VALYRIAN_TAG : undefined}>
                    {label.primary}
                  </span>
                  {label.gloss ? <span className={styles.gloss}>{label.gloss}</span> : null}
                </span>
                <span className={styles.initial} aria-hidden="true" lang={label.isHv ? VALYRIAN_TAG : undefined}>
                  {Array.from(label.primary)[0]}
                </span>
              </VLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
