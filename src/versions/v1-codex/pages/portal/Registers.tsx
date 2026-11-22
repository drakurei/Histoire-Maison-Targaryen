import { VLink } from '@/app/version';
import { dragons } from '@/core/content/dragons';
import { Gloss, useT } from '@/core/i18n';

import { REGISTERS } from '../../components/registers';
import styles from './Registers.module.css';

/**
 * Phrase de chaque registre. Le nombre de dragons vient du registre déjà chargé par la courbe ;
 * les autres registres ne sont pas chargés sur le portail pour un simple compte.
 */
const LINES: Readonly<Record<string, { key: string; n?: () => number }>> = {
  lignee: { key: 'page.portal.reg.lignee' },
  personnages: { key: 'page.portal.reg.personnages' },
  dragons: { key: 'page.portal.reg.dragons', n: () => dragons.length },
  guerres: { key: 'page.portal.reg.guerres' },
  lieux: { key: 'page.portal.reg.lieux' },
  langue: { key: 'page.portal.reg.langue' },
  apprendre: { key: 'page.portal.reg.apprendre' },
};

const ENTRIES = [
  ...REGISTERS.map((register) => ({ id: register.id, to: register.to, key: register.key })),
  { id: 'sources', to: '/sources', key: 'nav.sources' },
];

/**
 * Les registres de la bibliothèque, comme un index en fin de volume : le nom (valyrien et
 * sa glose) suspendu à gauche, ce qu'on y trouve à droite.
 */
export function Registers() {
  const t = useT();
  return (
    <ul role="list" className={styles.list}>
      {ENTRIES.map((entry) => {
        const line = LINES[entry.id];
        const text = line ? t(line.key, line.n ? { n: line.n() } : undefined) : t('page.portal.reg.sources');
        return (
          <li key={entry.id} className={styles.row}>
            <VLink to={entry.to} className={styles.name}>
              <Gloss k={entry.key} classes={{ main: styles.nameMain, tr: styles.nameTr }} />
            </VLink>
            <p className={styles.text}>{text}</p>
          </li>
        );
      })}
    </ul>
  );
}
