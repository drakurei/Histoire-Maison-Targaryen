import { Gloss, useT } from '@/core/i18n';
import { Lien } from '@/versions/v2/components/Lien';
import { Profil } from '@/versions/v2/components/Profil';
import { useSheets } from '@/versions/v2/components/sheets';
import { useElementWidth } from '@/versions/v2/components/useElementWidth';
import { DOMAIN, periods } from '@/versions/v2/state/scene';

import { Dos } from '../components/common/Dos';
import { TitreChamp } from '../components/common/TitreChamp';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import styles from './NotFoundPage.module.css';

/**
 * Page introuvable de secours (v3-spec §6.19 ; le groupe D peut la reprendre) : « Kesir ilos
 * daor. » et sa glose, l'explication, le portail et Registres. La figure : la fasce en
 * majesté, toute en cramoisi, sans encoche ; dessous, les huit volumes en dos couchés.
 */
export default function NotFoundPage() {
  const t = useT();
  const { openIndex } = useSheets();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  useVue({ etat: 'eteinte' });
  const height = Math.round(window.innerHeight * 0.3);

  return (
    <Vue partition="champ" ecran="introuvable" className={styles.vue}>
      <div className={styles.texte}>
        <TitreChamp k="phrase.not_found" monumental />
        <p className={styles.corps}>{t('error.notFound.body')}</p>
        <div className={styles.actions}>
          <Lien to="/" className={styles.lien}>
            <Gloss k="nav.portal" />
          </Lien>
          <button type="button" className={styles.lien} onClick={openIndex}>
            <Gloss k="v2.index.title" />
          </button>
        </div>
      </div>
      <div ref={ref} className={styles.figure} aria-hidden="true">
        {width > 0 ? <Profil from={DOMAIN[0]} to={DOMAIN[1]} width={width} height={height} full={height} off /> : null}
      </div>
      <nav className={styles.volumes} aria-label={t('v2.index.periods')}>
        <ol role="list">
          {periods.map((period) => (
            <li key={period.id}>
              <Dos period={period} to={`/chroniques/${period.id}`} />
            </li>
          ))}
        </ol>
      </nav>
    </Vue>
  );
}
