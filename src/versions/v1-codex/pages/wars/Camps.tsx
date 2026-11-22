import { getPerson } from '@/core/content/people';
import type { Belligerent } from '@/core/content/types';
import { useT, useTxTypo } from '@/core/i18n';

import { EntityLink } from '../../components/EntityLink';
import styles from './Camps.module.css';

interface CampsProps {
  sides: readonly Belligerent[];
}

/**
 * Les camps face à face. Chacun a son fanion à queue d'aronde, de la couleur que les sources
 * lui donnent (les noirs, les verts, le rouge Targaryen) ; un camp sans couleur attestée a un
 * fanion au trait. Deux camps : de part et d'autre du mot « contre ». Davantage : en rang.
 */
export function Camps({ sides }: CampsProps) {
  const t = useT();
  const tx = useTxTypo();
  const duel = sides.length === 2;

  return (
    <div className={styles.camps} data-duel={duel || undefined}>
      {sides.map((side, index) => (
        <div key={side.id} className={styles.campWrap}>
          {duel && index === 1 ? (
            <p className={styles.versus} aria-hidden="true">
              {t('page.war.versus')}
            </p>
          ) : null}
          <section className={styles.camp} aria-label={tx(side.name)}>
            <svg className={styles.pennon} data-tone={side.tone} viewBox="0 0 40 64" aria-hidden="true">
              <path d="M2 2H38V62L20 50L2 62Z" />
            </svg>
            <div>
              <h3 className={styles.name}>{tx(side.name)}</h3>
              {side.leaders.length > 0 ? (
                <ul className={styles.leaders} role="list">
                  {side.leaders.map((leader, i) => (
                    <li key={`${leader.id ?? 'x'}-${i}`}>
                      <EntityLink kind="person" id={leader.id} name={leader.name} king={leader.id ? getPerson(leader.id)?.king : false} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        </div>
      ))}
    </div>
  );
}
