import type { HvStatus } from '@/core/content/types';
import { useLang, useT, VALYRIAN_TAG } from '@/core/i18n';

import { refLabel } from './lexiconTools';
import styles from './PhraseEntry.module.css';
import { StatusMark } from './StatusMark';

export interface PhraseEntryProps {
  id: string;
  hv: string;
  /** Sens, dans la langue lue. */
  meaning: string;
  status: HvStatus;
  literal?: string;
  context?: string;
  /** Analyse du linguiste (formules tirées du lexique en attendant le recueil). */
  analysis?: string;
  /** Langue réelle de l'analyse, quand elle diffère de la langue lue. */
  analysisLang?: string;
  refs: readonly string[];
}

/**
 * PhraseEntry : une formule. Elle-même en grand, son sens en italique dessous (la glose
 * interlinéaire), puis l'appareil : mot à mot, contexte ou analyse, références ; le statut
 * de la forme dans la marge.
 */
export function PhraseEntry({ id, hv, meaning, status, literal, context, analysis, analysisLang, refs }: PhraseEntryProps) {
  const t = useT();
  const { reading } = useLang();
  return (
    <article id={`formule-${id}`} className={styles.entry} aria-labelledby={`formule-${id}-titre`}>
      <div className={styles.head}>
        <h2 id={`formule-${id}-titre`} className={styles.hv} lang={VALYRIAN_TAG}>
          {hv}
        </h2>
        <p className={styles.meaning} lang={reading}>
          {meaning}
        </p>
      </div>
      <dl className={styles.apparatus}>
        {literal ? (
          <div className={styles.row}>
            <dt className={styles.term}>{t('page.phrases.literal')}</dt>
            <dd className={styles.def} lang={reading}>
              {literal}
            </dd>
          </div>
        ) : null}
        {context ? (
          <div className={styles.row}>
            <dt className={styles.term}>{t('page.phrases.context')}</dt>
            <dd className={styles.def} lang={reading}>
              {context}
            </dd>
          </div>
        ) : null}
        {analysis ? (
          <div className={styles.row}>
            <dt className={styles.term}>{t('page.phrases.analysis')}</dt>
            <dd className={styles.def} lang={analysisLang ?? reading}>
              {analysis}
            </dd>
          </div>
        ) : null}
      </dl>
      <div className={styles.margin}>
        <StatusMark status={status} />
        {refs.length > 0 ? (
          <ul role="list" className={styles.refs} aria-label={t('page.lexicon.entry.refs')}>
            {refs.map((url) => (
              <li key={url}>
                <a href={url} className={styles.ref} rel="noreferrer noopener" target="_blank">
                  {refLabel(url)}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
