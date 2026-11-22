import { openQuestionsOfPeriod } from '@/core/content/timeline';
import type { Period } from '@/core/content/types';
import { useLang, useT, useTx } from '@/core/i18n';

import { SourceList } from '../../components/SourceList';
import styles from './OpenQuestions.module.css';

/**
 * Les questions ouvertes d'un volume : chacune posée en titre, puis ce qui est établi, ce
 * que supposent les lecteurs et ce qu'affirme l'adaptation, tenus séparés ; sources en marge.
 */
export function OpenQuestions({ period }: { period: Period }) {
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  const details = openQuestionsOfPeriod(period.id);

  return (
    <ol role="list" className={styles.list}>
      {period.openQuestions.map((question, index) => {
        const detail = details.find((item) => item.question.fr === question.fr);
        return (
          <li key={index} className={styles.question}>
            <h3 className={styles.title} lang={reading}>
              {tx(question)}
            </h3>
            {detail ? (
              <>
                <dl className={styles.body} lang={reading}>
                  <div className={styles.part}>
                    <dt>{t('page.period.q.established')}</dt>
                    <dd>{tx(detail.established)}</dd>
                  </div>
                  <div className={styles.part}>
                    <dt>{t('page.period.q.hypothesis')}</dt>
                    <dd>{tx(detail.hypothesis)}</dd>
                  </div>
                  {detail.adaptation ? (
                    <div className={styles.part} data-kind="adaptation">
                      <dt>{t('page.period.q.adaptation')}</dt>
                      <dd>{tx(detail.adaptation)}</dd>
                    </div>
                  ) : null}
                </dl>
                <SourceList sources={detail.sources} className={styles.sources} />
              </>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
