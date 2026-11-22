import { useMemo } from 'react';

import { MAIN_ID } from '@/app/a11y';
import { VLink } from '@/app/version';
import { paths } from '@/core/content/paths';
import { periods } from '@/core/content/timeline';
import type { LearningPath } from '@/core/content/types';
import { formatSpan, Gloss, useLang, useT, useTxTypo } from '@/core/i18n';

import { EmptyState } from '../components/EmptyState';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { toRoman } from '../components/numerals';
import { Rubric } from '../components/Rubric';
import { readProgress, safeStorage } from './learn/progress';
import type { PathProgress } from './learn/progress';
import styles from './LearnPage.module.css';

/**
 * Apprendre (/apprendre) : les parcours, numérotés parce qu'ils forment une vraie suite,
 * chacun avec son propos, sa longueur et l'état du questionnaire sur cet appareil. Tant
 * qu'ils ne sont pas rédigés, la salle propose de lire les huit volumes dans l'ordre.
 */
export default function LearnPage() {
  const t = useT();
  const { reading } = useLang();
  const progress = useMemo(() => {
    const storage = safeStorage();
    return new Map(paths.map((path) => [path.id, readProgress(path, storage)] as const));
  }, []);

  return (
    <main id={MAIN_ID}>
      <Folio>
        <Rubric as="h1" size="monumental" k="nav.learn" className={styles.title} />
        {paths.length > 0 ? (
          <p className={`${styles.lead} ${col.recit}`} lang={reading}>
            {t('page.learn.lead')}
          </p>
        ) : null}

        {paths.length > 0 ? (
          <ol role="list" className={`${styles.paths} ${col.pleine}`}>
            {paths.map((path) => (
              <PathRow key={path.id} path={path} progress={progress.get(path.id) ?? { kind: 'none' }} />
            ))}
          </ol>
        ) : (
          <>
            <EmptyState titleKey="page.learn.empty.title" bodyKey="page.learn.empty.body" className={styles.empty} />
            <Rubric as="h2" k="page.learn.volumes.title" className={styles.section} />
            <ol role="list" className={`${styles.paths} ${col.pleine}`}>
              {periods.map((period) => (
                <li key={period.id} className={styles.row}>
                  <span className={styles.numeral} aria-hidden="true">
                    {toRoman(period.order)}
                  </span>
                  <div className={styles.rowBody}>
                    <VLink to={`/chroniques/${period.id}`} className={styles.rowLink}>
                      <Gloss text={period.title} classes={{ main: styles.rowTitle, tr: styles.rowGloss }} />
                    </VLink>
                    <p className={styles.meta}>{formatSpan(period.from, period.to, reading)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </Folio>
    </main>
  );
}

function progressText(t: ReturnType<typeof useT>, progress: PathProgress): string {
  switch (progress.kind) {
    case 'none':
      return t('page.learn.progress.none');
    case 'ongoing':
      return t('page.learn.progress.ongoing', { n: progress.question, total: progress.total });
    case 'done':
      return t('page.learn.progress.done', { correct: progress.correct, total: progress.total });
  }
}

function PathRow({ path, progress }: { path: LearningPath; progress: PathProgress }) {
  const t = useT();
  const tx = useTxTypo();
  const { reading } = useLang();
  return (
    <li className={styles.row} data-progress={progress.kind}>
      <span className={styles.numeral} aria-hidden="true">
        {path.order}
      </span>
      <div className={styles.rowBody}>
        <VLink to={`/apprendre/${path.id}`} className={styles.rowLink}>
          <span className={styles.srOnly}>{t('page.path.number', { n: path.order })} </span>
          <Gloss text={path.title} classes={{ main: styles.rowTitle, tr: styles.rowGloss }} />
        </VLink>
        <p className={styles.intro} lang={reading}>
          {tx(path.intro)}
        </p>
        <p className={styles.meta}>
          {t('page.learn.meta', { steps: path.steps.length, questions: path.quiz.length, minutes: path.minutes })}
        </p>
        <p className={styles.progress}>{progressText(t, progress)}</p>
      </div>
    </li>
  );
}
