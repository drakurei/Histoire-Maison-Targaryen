import { Fragment, useMemo } from 'react';

import type { Person } from '@/core/content/types';
import { focusOn } from '@/core/genealogy';
import { useT, useTitle } from '@/core/i18n';

import { Lien } from '../../components/Lien';
import { NomEntite } from '../../components/NomEntite';

import { Anneau } from './Anneau';
import { graph } from './donnees';
import styles from './FragmentPal.module.css';
import type { Anneau as AnneauData } from './modelePal';
import { nomCourt } from './nomCourt';

function Nom({ person }: { person: Person }) {
  const title = useTitle();
  const text = title(person.name);
  return <NomEntite kind="person" id={person.id} name={text.isHv ? person.name : { fr: nomCourt(person, person.name.fr).nom, en: nomCourt(person, person.name.en).nom }} />;
}

function Liste({ persons }: { persons: readonly Person[] }) {
  return (
    <span className={styles.liste}>
      {persons.map((person, index) => (
        <Fragment key={person.id}>
          <span className={styles.item}>
            <Nom person={person} />
            {index < persons.length - 1 ? ',' : null}
          </span>
          {index < persons.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  );
}

/**
 * Le fragment du pal, dans la colonne de la fiche (spec §5.9) : parents au-dessus, la
 * personne sur le pal, ses unions et leurs enfants dessous ; « voir dans la lignée ».
 */
export function FragmentPal({ person }: { person: Person }) {
  const t = useT();
  const title = useTitle();
  const vue = useMemo(() => focusOn(graph, person.id), [person.id]);
  if (!vue) return null;
  const self = nomCourt(person, title(person.name).primary).nom;

  return (
    <section className={styles.fragment} aria-label={t('page.person.kin.heading')}>
      <svg className={styles.pal} aria-hidden="true" focusable="false" preserveAspectRatio="none" viewBox="0 0 12 100">
        <rect width="12" height="100" />
      </svg>
      <div className={styles.lignes}>
        {vue.parents.length > 0 ? (
          <p className={styles.parents}>
            <span className={styles.etiquette}>{t('page.lignee.panel.parents')}</span>
            <Liste persons={vue.parents.map((parent) => parent.person)} />
          </p>
        ) : (
          <p className={styles.vide}>{t('page.lignee.panel.noParents')}</p>
        )}
        <p className={styles.soi}>{self}</p>
        {vue.unions.map((union, index) => {
          const anneau: AnneauData = {
            id: `ring:fiche-${index}`,
            type: union.union?.type ?? 'sans-union',
            sang: union.consanguinity?.consanguineous ?? false,
            parente: union.consanguinity?.consanguineous ? union.consanguinity.kinship : null,
            certitude: union.union?.certainty ?? null,
          };
          return (
            <div key={union.union?.id ?? `u-${index}`} className={styles.union}>
              <p className={styles.conjoint}>
                <Anneau anneau={anneau} />
                {union.partner ? <Nom person={union.partner} /> : <span className={styles.vide}>{t('page.lignee.panel.unknownPartner')}</span>}
              </p>
              {union.children.length > 0 ? (
                <p className={styles.enfants}>
                  <Liste persons={union.children} />
                </p>
              ) : null}
            </div>
          );
        })}
        <p className={styles.voir}>
          <Lien to={`/lignee?p=${person.id}`}>{t('v2.person.in_lineage')}</Lien>
        </p>
      </div>
    </section>
  );
}
