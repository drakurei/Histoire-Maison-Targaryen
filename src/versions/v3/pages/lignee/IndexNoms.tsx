import type { Person } from '@/core/content/types';
import { useLang, useT, useTxTypo } from '@/core/i18n';
import { indexName, lifeYears } from '@/versions/v1-codex/pages/lineage/model';
import type { IndexGroup } from '@/versions/v1-codex/pages/people/peopleIndex';

import { Nom } from '../../components/common/Nom';
import styles from './IndexNoms.module.css';

/**
 * L'index savant des personnages (v3-spec §6.6, `?tri=nom`), repris de la V1 : les noms par
 * lettre, la précision d'homonymie en italique, l'épithète, les années. Une colonne de texte,
 * pas de cartes ; sur grand écran, l'index court sur trois colonnes comme une table imprimée.
 */
export function IndexNoms({ groupes }: { groupes: readonly IndexGroup[] }) {
  const t = useT();
  return (
    <div className={styles.index} role="group" aria-label={t('v3.lignee.index')}>
      {groupes.map((groupe) => (
        <section key={groupe.id} id={`l-${groupe.id}`} className={styles.lettre} aria-labelledby={`l-${groupe.id}-t`}>
          <h2 id={`l-${groupe.id}-t`} className={styles.initiale}>
            {groupe.id}
          </h2>
          <ul role="list" className={styles.liste}>
            {groupe.persons.map((person) => (
              <Entree key={person.id} person={person} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Entree({ person }: { person: Person }) {
  const { reading } = useLang();
  const tx = useTxTypo();
  const t = useT();
  const fr = indexName(person, 'fr');
  const en = indexName(person, 'en');
  const qualifier = (reading === 'fr' ? fr : en).qualifier;
  const years = lifeYears(person, reading);
  return (
    <li className={styles.entree}>
      <Nom kind="person" id={person.id} name={{ fr: fr.main, en: en.main }} className={styles.nom} />
      {qualifier ? <span className={styles.precision}>{qualifier}</span> : null}
      {person.epithet ? <span className={styles.epithete}>{tx(person.epithet)}</span> : null}
      <span className={styles.annees}>{years ?? t('page.person.datesUnknown')}</span>
    </li>
  );
}
