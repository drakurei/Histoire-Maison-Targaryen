import { useCallback } from 'react';

import type { Localized } from '@/core/content/types';
import { formatYear, useLang, useT, useTx, yearParts } from '@/core/i18n';

import { periodsAt, presenceAt, reignsAt } from '../../model/presence';
import { DOMAIN, periods, presence, sovereigns } from '../../state/scene';

/** Le nom de maison n'apprend rien dans une fasce Targaryen : « Aegon II », pas « Aegon II Targaryen ». */
export function withoutHouse(name: string): string {
  return name.replace(/\s+Targaryen$/u, '');
}

export interface YearInfo {
  year: number;
  /** Le nombre, sans signe. */
  value: string;
  /** Le sigle d'ère, dans la langue du récit. */
  era: string;
  /** « 129 apr. C. » */
  label: string;
  /** Souverains de l'année, joints : « Aegon II, Rhaenyra ». Vide hors de la dynastie. */
  reign: string;
  /** Titres des périodes de l'année, joints. */
  period: string;
  /** Dragons attestés et dragons au sort inconnu. */
  attested: number;
  doubtful: number;
}

/** Tout ce que la fasce dit d'une année, dans la langue du lecteur. */
export function useYearInfo(): (year: number) => YearInfo {
  const { reading } = useLang();
  const tx = useTx();
  return useCallback(
    (year: number): YearInfo => {
      const parts = yearParts(year, reading) ?? { value: String(Math.abs(year)), era: '' };
      const names = (list: readonly { name: Localized }[]) => list.map((item) => withoutHouse(tx(item.name))).join(', ');
      const entry = presenceAt(presence, year);
      return {
        year,
        value: parts.value,
        era: parts.era,
        label: formatYear(year, reading),
        reign: names(reignsAt(sovereigns, year)),
        period: periodsAt(periods, year, DOMAIN[0])
          .map((period) => tx(period.title))
          .join(', '),
        attested: entry?.attested.length ?? 0,
        doubtful: entry?.doubtful.length ?? 0,
      };
    },
    [reading, tx],
  );
}

/** « aucun dragon vivant », « un dragon vivant », « 15 dragons vivants ». */
export function useAliveText(): (count: number) => string {
  const t = useT();
  return useCallback(
    (count: number) => {
      if (count === 0) return t('v2.fasce.alive.none');
      if (count === 1) return t('v2.fasce.alive.one');
      return t('v2.fasce.alive.many', { n: count });
    },
    [t],
  );
}
