import { dragons } from '@/core/content/dragons';
import { useTypo, useT } from '@/core/i18n';

import { Page } from '../components/Page';
import { Titre } from '../components/Titre';

import { QuiVole } from './registres/QuiVole';
import { ViesDragons } from './registres/ViesDragons';
import styles from './DragonsPage.module.css';

/**
 * Dragons `/dragons` (fascé, spec §5.10). En tête, qui vole à l'année réglée, à la même
 * échelle, un homme debout pour repère (tous les dragons sans année) ; puis une vie par
 * dragon, alignée au pixel sur la fasce, cavaliers compris, groupée par époque.
 */
export default function DragonsPage() {
  const t = useT();
  const typo = useTypo();
  return (
    <Page partition="fasce">
      <Titre k="nav.dragons" className={styles.entete}>
        <p className={styles.chapeau}>{typo(t('page.dragons.lead', { n: dragons.length }))}</p>
      </Titre>
      <QuiVole />
      <ViesDragons />
    </Page>
  );
}
