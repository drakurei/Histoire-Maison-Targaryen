import { useMemo } from 'react';

import { phrases } from '@/core/content/language';
import type { Phrase } from '@/core/content/types';
import { useLang, useT, useTx, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';
import { col } from '@/versions/v1-codex/components/grid';
import { Rubric } from '@/versions/v1-codex/components/Rubric';
import { Interlinear } from '@/versions/v1-codex/pages/language/Interlinear';
import { StatusMark } from '@/versions/v1-codex/pages/language/StatusMark';
import { useHashScroll } from '@/versions/v1-codex/pages/language/useHashScroll';
import { parseLiteral } from '@/versions/v2/pages/savoirs/glose';
import { useEnLecture } from '@/versions/v2/pages/savoirs/hooks';

import { Colonne } from '../components/common/Colonne';
import { Parti3 } from '../components/common/Parti3';
import { DESKTOP, useMedia } from '../components/common/useMedia';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import commun from './savoirs/commun.module.css';
import styles from './savoirs/Expressions.module.css';
import { Refs3, Sommaire3 } from './savoirs/pieces';

/**
 * Les expressions `/langue/expressions` (v3-spec §6.15 ; parti, fasce éteinte). Chaque formule
 * en Texturina, son sens, son mot à mot en glose interlinéaire (`Interlinear` de la V1, lu
 * dans le mot à mot publié), son contexte, son statut et ses références. La colonne du champ
 * porte l'index des formules, celle qu'on lit marquée. Ancres `#<id>` (« #valar-dohaeris »).
 */
export default function PhrasesPage() {
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  const desktop = useMedia(DESKTOP);
  useVue({ etat: 'eteinte' });
  useHashScroll();
  const anchors = useMemo(() => phrases.map((phrase) => phrase.id), []);
  const active = useEnLecture(desktop ? anchors : []);
  const activePhrase = phrases.find((phrase) => phrase.id === active);

  const titreId = 'v3-expressions-titre';
  const tete = (
    <header className={`${commun.tete} ${col.recit}`}>
      <Rubric as="h1" id={titreId} k="page.bati.title.phrases" />
      <p className={commun.chapeau} lang={reading}>
        {t('page.phrases.lead')}
      </p>
      <p className={commun.meta}>{t('v2.phrases.count', { n: phrases.length })}</p>
    </header>
  );

  const folio =
    phrases.length === 0 ? (
      <p className={`${commun.texte} ${commun.section}`}>
        {t('page.phrases.empty.title')} {t('page.phrases.empty.body')}
      </p>
    ) : (
      <div className={`${styles.formules} ${col.pleine}`}>
        {phrases.map((phrase, index) => (
          <Formule key={phrase.id} phrase={phrase} n={index + 1} />
        ))}
      </div>
    );

  const colonne = desktop ? (
    <Colonne
      label={t('v2.phrases.index')}
      figure={
        <div className={commun.colonne}>
          <Sommaire3
            label={t('v2.phrases.index')}
            active={active}
            className={styles.index}
            entries={phrases.map((phrase) => ({ id: phrase.id, label: phrase.hv, lang: VALYRIAN_TAG }))}
          />
        </div>
      }
      pied={activePhrase ? <p className={styles.pied}>{tx({ fr: activePhrase.fr, en: activePhrase.en })}</p> : null}
    />
  ) : null;

  return (
    <Vue partition="parti">
      <Parti3 labelledBy={titreId} tete={tete} folio={folio} colonne={colonne} />
    </Vue>
  );
}

function Formule({ phrase, n }: { phrase: Phrase; n: number }) {
  const t = useT();
  const tx = useTx();
  const typo = useTxTypo();
  const { reading } = useLang();
  const glose = useMemo(() => (phrase.literal ? parseLiteral(tx(phrase.literal)) : null), [phrase.literal, tx]);
  return (
    <article id={phrase.id} className={styles.formule} aria-labelledby={`${phrase.id}-hv`}>
      <span className={styles.rang} aria-hidden="true">
        {n}
      </span>
      <div className={styles.corps}>
        <h2 id={`${phrase.id}-hv`} className={styles.hv} lang={VALYRIAN_TAG}>
          {phrase.hv}
        </h2>
        <p className={styles.sens} lang={reading}>
          {typo({ fr: phrase.fr, en: phrase.en })}
        </p>
        {glose && glose.mots.length > 0 ? (
          <div className={styles.motAMot}>
            <p className={styles.terme}>{t('page.phrases.literal')}</p>
            <Interlinear size="courant" words={glose.mots.map((mot) => ({ form: mot.hv, sense: mot.sens || undefined, grammar: mot.analyse || undefined }))} />
            {glose.remarques.length > 0 ? <p className={styles.remarque}>{glose.remarques.join(' ; ')}</p> : null}
          </div>
        ) : null}
        <div className={styles.contexte}>
          <p className={styles.terme}>{t('page.phrases.context')}</p>
          <p className={commun.texte} lang={reading}>
            {typo(phrase.context)}
          </p>
        </div>
        <div className={styles.pieds}>
          <StatusMark status={phrase.status} />
          <Refs3 refs={phrase.refs} />
        </div>
      </div>
    </article>
  );
}
