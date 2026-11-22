/**
 * Les mots de la parenté, partagés par le volet de la lignée et la fiche d'un personnage :
 * le lien de sang (« oncle », « cousine germaine »), le signe d'union de la notation
 * généalogique (« x » en français, « m. » en anglais) et le coefficient de parenté.
 */
import { useCallback } from 'react';

import type { Person, Union } from '@/core/content/types';
import type { Consanguinity, Kinship } from '@/core/genealogy';
import { useLang, useT } from '@/core/i18n';

export interface KinWords {
  /** Ce que l'autre est pour la personne, par le sang ; `null` sans lien de sang connu. */
  blood: (kinship: Kinship) => string | null;
  /** Signe ou mot d'une union : mariage, liaison, fiançailles. */
  unionMark: (type: Union['type']) => string;
  /** Coefficient de parenté des conjoints, en clair ; `null` s'ils ne sont pas apparentés. */
  coefficient: (consanguinity: Consanguinity | null) => string | null;
  /** « Fils de », « fille de », selon le sexe. */
  childOf: (person: Person) => string;
}

export function useKinWords(): KinWords {
  const t = useT();
  const { reading } = useLang();

  const blood = useCallback(
    (kinship: Kinship) => (kinship.relation === 'none' || kinship.relation === 'self' ? null : t(`page.lignee.${kinship.key}`, { ...kinship.vars })),
    [t],
  );

  const unionMark = useCallback((type: Union['type']) => t(`page.lignee.union.${type}`), [t]);

  const coefficient = useCallback(
    (consanguinity: Consanguinity | null) => {
      if (!consanguinity?.consanguineous || consanguinity.coefficient <= 0) return null;
      const value = new Intl.NumberFormat(reading, { maximumFractionDigits: 4 }).format(consanguinity.coefficient);
      return t('page.lignee.coefficient', { value });
    },
    [reading, t],
  );

  const childOf = useCallback((person: Person) => t(person.sex === 'f' ? 'page.lignee.daughterOf' : 'page.lignee.sonOf'), [t]);

  return { blood, unionMark, coefficient, childOf };
}
