import { useMemo } from 'react';

import { phrases } from '@/core/content/language';
import type { Phrase } from '@/core/content/types';
import { useT, useTx, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';

import { Filtres, useFiltre } from '../components/Filtres';
import { Page } from '../components/Page';
import { Parti } from '../components/Parti';
import { Titre } from '../components/Titre';
import { Vide } from '../components/Vide';
import { useFasce } from '../state/fasce';

import { DESKTOP_QUERY, useEnLecture, useMedia } from './savoirs/hooks';
import { MotAMot } from './savoirs/MotAMot';
import { Refs } from './savoirs/Refs';
import commun from './savoirs/Savoirs.module.css';
import { Statut, STATUSES } from './savoirs/Statut';
import styles from './PhrasesPage.module.css';

/** L'ancre d'une formule : son identifiant, tel que les autres vues y renvoient (`#valar-dohaeris`). */
function phraseAnchor(phrase: Phrase): string {
  return phrase.id;
}

function Formule({ phrase }: { phrase: Phrase }) {
  const t = useT();
  const typo = useTxTypo();
  const anchor = phraseAnchor(phrase);
  return (
    <article id={anchor} className={styles.formule} aria-labelledby={`${anchor}-hv`}>
      <h2 id={`${anchor}-hv`} className={styles.hv} lang={VALYRIAN_TAG}>
        {phrase.hv}
      </h2>
      <p className={styles.sens}>{typo({ fr: phrase.fr, en: phrase.en })}</p>
      {phrase.literal ? (
        <div className={styles.motAMot}>
          <p className={styles.rubrique}>{t('page.phrases.literal')}</p>
          <MotAMot literal={phrase.literal} />
        </div>
      ) : null}
      <div className={styles.contexte}>
        <p className={styles.rubrique}>{t('page.phrases.context')}</p>
        <p className={styles.contexteTexte}>{typo(phrase.context)}</p>
      </div>
      <div className={styles.pied}>
        <Statut status={phrase.status} />
      </div>
      <Refs refs={phrase.refs} className={styles.refs} />
    </article>
  );
}

/**
 * Expressions `/langue/expressions` (parti, fasce éteinte, spec §5.13) : chaque formule en
 * Texturina, son sens, son mot à mot en glose interlinéaire (le mot, son sens, son analyse),
 * son contexte et ses références. À droite, collant, l'index des formules, celle qu'on lit
 * marquée.
 */
export default function PhrasesPage() {
  useFasce({ off: true });
  const t = useT();
  const tx = useTx();
  const desktop = useMedia(DESKTOP_QUERY);
  const statuts = useFiltre('statut');
  const shown = useMemo(() => phrases.filter((phrase) => statuts.size === 0 || statuts.has(phrase.status)), [statuts]);
  const presentStatuses = useMemo(() => STATUSES.filter((status) => phrases.some((phrase) => phrase.status === status)), []);
  const anchors = useMemo(() => shown.map(phraseAnchor), [shown]);
  const active = useEnLecture(desktop ? anchors : []);

  const entete = (
    <div className={commun.entete}>
      <Titre k="page.bati.title.phrases" />
      <p className={styles.chapeau}>{t('page.phrases.lead')}</p>
      {presentStatuses.length > 1 ? (
        <Filtres
          param="statut"
          label={t('page.savoirs.status.label')}
          options={presentStatuses.map((status) => ({ value: status, label: t(`page.savoirs.status.${status}`) }))}
          count={shown.length}
          total={phrases.length}
        />
      ) : null}
    </div>
  );

  const temps =
    desktop && shown.length > 0 ? (
      <nav className={commun.colonne} aria-label={t('v2.phrases.index')}>
        <p className={styles.indexTitre}>{t('v2.phrases.count', { n: shown.length })}</p>
        <ul role="list" className={styles.index}>
          {shown.map((phrase) => (
            <li key={phrase.id}>
              <a
                href={`#${phraseAnchor(phrase)}`}
                className={styles.indexLien}
                aria-current={active === phrase.id ? 'location' : undefined}
                title={tx({ fr: phrase.fr, en: phrase.en })}
              >
                <span lang={VALYRIAN_TAG}>{phrase.hv}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    ) : null;

  const recit =
    shown.length === 0 ? (
      <Vide>{t('page.phrases.empty.title')} {t('page.phrases.empty.body')}</Vide>
    ) : (
      <div className={styles.formules}>
        {shown.map((phrase) => (
          <Formule key={phrase.id} phrase={phrase} />
        ))}
      </div>
    );

  return (
    <Page partition="parti" className={styles.page}>
      <Parti entete={entete} recit={recit} temps={temps} />
    </Page>
  );
}
