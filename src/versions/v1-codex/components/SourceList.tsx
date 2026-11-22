import { VLink } from '@/app/version';
import { getSource } from '@/core/content/sources';
import type { SourceRef } from '@/core/content/types';
import { useLang, useT } from '@/core/i18n';

import styles from './SourceList.module.css';

/**
 * Sigles des ouvrages, tels que les lecteurs les abrègent (titres originaux). Donnée
 * d'appareil : à déplacer dans content/sources/sources.json si le contrat gagne un champ `siglum`.
 */
export const SIGLA: Readonly<Record<string, string>> = {
  fab: 'F&B',
  twoiaf: 'TWoIaF',
  trotd: 'TRotD',
  agot: 'AGoT',
  acok: 'ACoK',
  asos: 'ASoS',
  affc: 'AFfC',
  adwd: 'ADwD',
  thk: 'THK',
  tss: 'TSS',
  tmk: 'TMK',
  tpatq: 'TPatQ',
  trp: 'TRP',
  tsotd: 'TSotD',
  asoiaf: 'ASoIaF',
  'dunk-egg': 'D&E',
  got: 'GoT',
  hotd: 'HotD',
  'akotsk-serie': 'AKotSK',
  awoiaf: 'AWoIaF',
};

interface SourceListProps {
  sources: readonly SourceRef[];
  /** `marge` : resserrée, pour la colonne des notes ; `bloc` : sous un texte, sur la largeur du récit. */
  variant?: 'marge' | 'bloc';
  className?: string;
}

/**
 * SourceList : les sources d'un élément, comme en pied d'édition savante. Sigle, titre en
 * italique (titre français publié s'il existe, en lecture française), emplacement ; chaque
 * entrée mène à sa notice du registre des sources (/sources#id).
 */
export function SourceList({ sources, variant = 'marge', className }: SourceListProps) {
  const t = useT();
  const { reading } = useLang();
  if (sources.length === 0) return null;

  return (
    <ul role="list" className={`${styles.list} ${className ?? ''}`} data-variant={variant}>
      {sources.map((ref, index) => {
        const source = getSource(ref.id);
        const title = source ? (reading === 'fr' && source.titleFr ? source.titleFr : source.title) : null;
        return (
          <li key={`${ref.id}-${index}`} className={styles.item}>
            <VLink to={`/sources#${ref.id}`} className={styles.link}>
              <span className={styles.siglum}>{SIGLA[ref.id] ?? ref.id}</span>
              {title ? <cite className={styles.title}>{title}</cite> : <span className={styles.title}>{t('page.bati.sources.unlisted')}</span>}
            </VLink>
            {ref.locator ? <span className={styles.locator}>{ref.locator}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
