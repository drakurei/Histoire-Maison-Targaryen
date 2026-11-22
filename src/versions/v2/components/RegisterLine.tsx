import { NavLink } from 'react-router-dom';

import { Gloss, useT } from '@/core/i18n';

import { useLienHref } from '../state/links';

import { LangSwitch } from './LangSwitch';
import { REGISTERS } from './registers';
import styles from './RegisterLine.module.css';

/**
 * La ligne des registres (spec §2.1) : sans fond propre ni filet, non fixe, elle part au
 * défilement (la fasce reste). Le nom du site, les neuf registres écrits en entier en glose
 * interlinéaire, la langue. Au téléphone : le nom et la langue ; les registres sont dans l'Index.
 */
export function RegisterLine() {
  const t = useT();
  const href = useLienHref();

  return (
    <header className={styles.root}>
      <NavLink to={href('/')} end className={styles.nom}>
        <Gloss k="title.site" classes={{ tr: styles.nomGlose }} />
      </NavLink>
      <nav className={styles.registres} aria-label={t('page.bati.shelf.drawerRegisters')}>
        <ul role="list" className={styles.liste}>
          {REGISTERS.map((register) => (
            <li key={register.to}>
              <NavLink to={href(register.to)} className={styles.registre}>
                <Gloss k={register.key} />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <LangSwitch className={styles.langue} />
      <LangSwitch mode="select" className={styles.langueTel} />
    </header>
  );
}
