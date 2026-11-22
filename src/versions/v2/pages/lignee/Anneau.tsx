import { useT } from '@/core/i18n';

import type { Anneau as AnneauData } from './modelePal';
import styles from './Pal.module.css';

/**
 * Le signe de l'union, tel que l'écrivent les généalogistes : deux anneaux enlacés pour un
 * mariage, l'un d'eux en pointillé pour une liaison, deux anneaux disjoints pour des
 * fiançailles, un anneau seul pour des enfants nés hors de toute union enregistrée. Entre
 * parents par le sang, les anneaux sont de sang et plus épais : la boucle se referme.
 */
export function Anneau({ anneau }: { anneau: AnneauData }) {
  const t = useT();
  const label =
    anneau.type === 'sans-union'
      ? t('v2.lineage.without_union')
      : anneau.sang && anneau.type === 'mariage'
        ? t('v2.lineage.ring_blood')
        : t(anneau.type === 'mariage' ? 'page.lignee.key.union' : anneau.type === 'liaison' ? 'page.lignee.key.liaison' : 'page.lignee.union.fiancailles');
  const apart = anneau.type === 'fiancailles';
  return (
    <svg
      className={styles.anneau}
      data-noeud={anneau.id}
      data-sang={anneau.sang ? '' : undefined}
      viewBox="0 0 22 12"
      width="22"
      height="12"
      role="img"
      aria-label={label}
      focusable="false"
    >
      {anneau.type === 'sans-union' ? (
        <circle data-boucle cx="7" cy="6" r="4.5" strokeDasharray="1.6 2" />
      ) : (
        <>
          <circle data-boucle cx={apart ? 5.5 : 7.5} cy="6" r="4.5" />
          <circle data-boucle cx={apart ? 16.5 : 14.5} cy="6" r="4.5" strokeDasharray={anneau.type === 'liaison' ? '1.6 2' : undefined} />
        </>
      )}
    </svg>
  );
}
