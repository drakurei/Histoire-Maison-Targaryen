import { dragons } from '@/core/content/dragons';
import { useT, useTypo } from '@/core/i18n';
import { QuiVole } from '@/versions/v2/pages/registres/QuiVole';
import { ViesDragons } from '@/versions/v2/pages/registres/ViesDragons';

import { TitreChamp } from '../components/common/TitreChamp';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import styles from './DragonsPage.module.css';

/**
 * Dragons `/dragons` (v3-spec §6.8, fascé, champ). En tête, qui vole à l'année réglée, tous à
 * la même échelle, un homme debout pour repère (tous les dragons quand aucune année n'est
 * réglée) ; puis une vie par dragon, alignée sur la fasce, cavaliers compris, groupée par
 * époque, les non datés à la fin. Les deux figures viennent de la V2, telles quelles.
 */
export default function DragonsPage() {
  const t = useT();
  const typo = useTypo();
  useVue();
  return (
    <Vue partition="fasce">
      <TitreChamp k="nav.dragons" className={styles.entete}>
        <p className={styles.chapeau}>{typo(t('page.dragons.lead', { n: dragons.length }))}</p>
      </TitreChamp>
      <div className={styles.figures}>
        <QuiVole />
        <ViesDragons />
      </div>
    </Vue>
  );
}
