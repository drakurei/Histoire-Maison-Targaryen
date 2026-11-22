import { useCallback } from 'react';

import type { Person } from '@/core/content/types';
import { formatSpan, useLang, useT } from '@/core/i18n';

import { ageAt } from '../../model/relations';

import { deathKnown, lifeBounds } from './donnees';

/** Ce qu'une personne est à l'année réglée : la lignée éteint, estompe ou date selon l'état. */
export type Etat = 'vivant' | 'mort' | 'a-naitre' | 'inconnu' | 'tout';

export interface EtatAnnee {
  etat: Etat;
  /** Ce qui suit le nom : âge, mort, naissance à venir, ou les années de la vie sans année réglée. */
  texte: string;
}

/**
 * L'âge à l'année réglée (spec §5.7, D11) : « 32 ans », « vers 32 ans », « morte en 130 »,
 * « pas encore né » ; « date inconnue » quand rien ne permet de le dire, jamais un âge
 * inventé. Sans année réglée : les années de la vie.
 */
export function useEtatAnnee(): (person: Person, year: number | null) => EtatAnnee {
  const t = useT();
  const { reading } = useLang();
  return useCallback(
    (person: Person, year: number | null): EtatAnnee => {
      const { born, died } = lifeBounds(person);
      if (year === null) {
        if (born === null && died === null) return { etat: 'tout', texte: t('label.unknownDate') };
        const span = formatSpan(born, died, reading);
        // « vers » ne précède qu'un intervalle complet : « jusqu'en 26 av. C. » dit déjà sa borne.
        const circa = person.dateCertainty !== 'exacte' && born !== null && died !== null;
        return { etat: 'tout', texte: circa ? t('v2.cartel.circa', { span }) : span };
      }
      const age = ageAt(person, year);
      if (age === null) {
        if (born === null && died === null) return { etat: 'inconnu', texte: t('label.unknownDate') };
        // Une vie bornée par des fourchettes ouvertes : on donne ce que la source dit, sans âge.
        if (person.born === null && person.died === null) {
          const span = formatSpan(born, died, reading);
          return { etat: 'inconnu', texte: born !== null && died !== null ? t('v2.cartel.circa', { span }) : span };
        }
        return { etat: 'inconnu', texte: t('v2.lineage.age_unknown') };
      }
      if (age.state === 'unborn') return { etat: 'a-naitre', texte: t(`v2.lineage.unborn.${person.sex}`) };
      if (age.state === 'dead') {
        return { etat: 'mort', texte: t(`v2.lineage.dead.${person.sex}`, { year: formatSpan(died, died, reading) }) };
      }
      if (!deathKnown(person)) {
        return { etat: 'inconnu', texte: t(`v2.lineage.death_unknown.${person.sex}`, { year: formatSpan(born, born, reading) }) };
      }
      if (age.age === 0) return { etat: 'vivant', texte: t('v2.lineage.age.zero') };
      if (age.approx) return { etat: 'vivant', texte: t('v2.lineage.age_approx', { n: age.age }) };
      return { etat: 'vivant', texte: t(age.age === 1 ? 'v2.lineage.age.one' : 'v2.lineage.age.many', { n: age.age }) };
    },
    [t, reading],
  );
}
