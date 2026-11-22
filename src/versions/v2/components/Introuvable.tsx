import { Gloss, useT } from '@/core/i18n';

import { useFasce } from '../state/fasce';
import { DOMAIN } from '../state/scene';

import { Lien } from './Lien';
import { Page } from './Page';
import { Profil } from './Profil';
import { useSheets } from './sheets';
import { Titre } from './Titre';
import { useElementWidth } from './useElementWidth';
import styles from './Introuvable.module.css';

/**
 * La page introuvable (spec §5.17), aussi rendue par une fiche dont l'identifiant n'existe
 * pas. « Kesir ilos daor. » et sa glose, l'explication, le portail et « Registres ». La
 * figure : la fasce en majesté, toute en cramoisi, sans encoche : on est hors du temps.
 */
export function Introuvable() {
  const t = useT();
  const { openIndex } = useSheets();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  useFasce({ off: true, majesty: 30 });

  return (
    <Page partition="champ" ecran="introuvable" className={styles.page}>
      <Titre k="phrase.not_found" />
      <p className={styles.corps}>{t('error.notFound.body')}</p>
      <div className={styles.actions}>
        <Lien to="/" className={styles.lien}>
          <Gloss k="nav.portal" />
        </Lien>
        <button type="button" className={styles.lien} onClick={openIndex}>
          <Gloss k="v2.index.title" />
        </button>
      </div>
      {/* Au téléphone, la fasce en majesté est une figure dans le flux. */}
      <div ref={ref} className={styles.figure} aria-hidden="true">
        {width > 0 ? <Profil from={DOMAIN[0]} to={DOMAIN[1]} width={width} height={Math.round(window.innerHeight * 0.3)} full={Math.round(window.innerHeight * 0.3)} off /> : null}
      </div>
    </Page>
  );
}
