import { useT } from '@/core/i18n';

import { TitreChamp } from '../components/common/TitreChamp';
import { useVue } from '../components/common/useVue';
import type { EtatFasce } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import styles from './Provisoire.module.css';

interface ProvisoireProps {
  /** Clé d'interface du titre (`nav.*`, `title.site`). */
  k: string;
  etat?: EtatFasce;
  monumental?: boolean;
}

/**
 * Vue provisoire du bâti : le titre de la salle sur le champ et l'état de la fasce qu'elle
 * aura. Chaque page provisoire (`pages/<Nom>Page.tsx`) est remplacée par son groupe.
 */
export function Provisoire({ k, etat = 'datee', monumental = false }: ProvisoireProps) {
  const t = useT();
  useVue({ etat });
  return (
    <Vue partition="champ" className={styles.vue}>
      <TitreChamp k={k} monumental={monumental} />
      <p className={styles.note}>{t('v3.cadre.provisoire')}</p>
    </Vue>
  );
}
