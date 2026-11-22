import { useMemo } from 'react';

import { dragons } from '@/core/content/dragons';
import { formatYear, Gloss, useLang, useT } from '@/core/i18n';

import { NomEntite } from '../../components/NomEntite';
import { Vide } from '../../components/Vide';
import { presenceAt, reignsAt } from '../../model/presence';
import { ageAt } from '../../model/relations';
import { presence } from '../../state/scene';
import { useSetYear } from '../../state/year';

import { deathKnown, persons, sovereigns } from './donnees';
import styles from './LigneAnnee.module.css';

interface Compte {
  vivants: number;
  cavaliers: number;
}

/** Ce que la lignée compte à une année : personnes connues en vie, et parmi elles les cavaliers dont le dragon vit. */
function compter(year: number): Compte {
  const living = new Set(persons.filter((person) => deathKnown(person) && ageAt(person, year)?.state === 'alive').map((person) => person.id));
  const flying = new Set(presenceAt(presence, year)?.attested ?? []);
  const riders = new Set<string>();
  for (const dragon of dragons) {
    if (!flying.has(dragon.id)) continue;
    for (const rider of dragon.riders) {
      if (!rider.personId || !living.has(rider.personId)) continue;
      if (rider.from !== undefined && year < rider.from) continue;
      if (rider.to !== undefined && year > rider.to) continue;
      riders.add(rider.personId);
    }
  }
  return { vivants: living.size, cavaliers: riders.size };
}

/**
 * La ligne de l'année, sous le pal (spec §5.7) : vivants connus, cavaliers, règne. Sans année
 * réglée, elle invite à en régler une, en proposant une année qui parle pour la personne au centre.
 */
export function LigneAnnee({ year, suggestion }: { year: number | null; suggestion: number | null }) {
  const t = useT();
  const { reading } = useLang();
  const setYear = useSetYear();
  const compte = useMemo(() => (year === null ? null : compter(year)), [year]);
  const reigning = useMemo(() => (year === null ? [] : reignsAt(sovereigns, year)), [year]);

  if (year === null || compte === null) {
    return (
      <Vide
        action={
          suggestion !== null ? (
            <button type="button" className={styles.regler} onClick={() => setYear(suggestion)}>
              {t('v2.search.set_year', { year: formatYear(suggestion, reading) })}
            </button>
          ) : undefined
        }
      >
        {t('v2.lineage.year_empty')}
      </Vide>
    );
  }

  return (
    <section className={styles.ligne} aria-label={t('v2.lineage.year_title', { year: formatYear(year, reading) })}>
      <p className={styles.annee}>{t('v2.lineage.year_title', { year: formatYear(year, reading) })}</p>
      <dl className={styles.chiffres}>
        <div className={styles.chiffre}>
          <dt>{t('v2.lineage.living')}</dt>
          <dd className={styles.nombre}>{compte.vivants}</dd>
        </div>
        <div className={styles.chiffre}>
          <dt>{t('v2.lineage.riders')}</dt>
          <dd className={styles.nombre}>{compte.cavaliers}</dd>
        </div>
        <div className={styles.chiffre}>
          <dt>
            <Gloss k="label.reign" />
          </dt>
          <dd className={styles.regne}>
            {reigning.length === 0 ? (
              <span className={styles.aucun}>{t('v2.state.no_reign')}</span>
            ) : (
              reigning.map((sovereign, index) => (
                <span key={sovereign.id}>
                  {index > 0 ? ', ' : null}
                  <NomEntite kind="person" id={sovereign.id} name={sovereign.name} />
                </span>
              ))
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
