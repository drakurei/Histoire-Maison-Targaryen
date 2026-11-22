import { useParams } from 'react-router-dom';

import { MAIN_ID } from '@/app/a11y';
import { NotFound } from '@/app/NotFound';
import { VLink } from '@/app/version';
import { getPath, paths } from '@/core/content/paths';
import type { PathStep } from '@/core/content/types';
import { Gloss, useLang, useT, useTx } from '@/core/i18n';

import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { Prose } from '../components/Prose';
import { Rubric } from '../components/Rubric';
import { Quiz } from './learn/Quiz';
import styles from './PathPage.module.css';

/**
 * Un parcours (/apprendre/:pathId) : ses étapes dans l'ordre, chacune avec ce qu'il faut
 * retenir et les salles où lire la suite ; puis le questionnaire, une question à la fois ;
 * enfin le parcours précédent et le suivant.
 */
export default function PathPage() {
  const { pathId = '' } = useParams();
  const t = useT();
  const { reading } = useLang();
  const path = getPath(pathId);
  if (!path) return <NotFound />;

  const index = paths.findIndex((item) => item.id === path.id);
  const previous = index > 0 ? paths[index - 1] : undefined;
  const following = index >= 0 && index < paths.length - 1 ? paths[index + 1] : undefined;

  return (
    <main id={MAIN_ID}>
      <Folio>
        <header className={`${styles.header} ${col.pleine}`}>
          <span className={styles.numeral} aria-hidden="true">
            {path.order}
          </span>
          <div className={styles.headText}>
            <p className={styles.kicker}>
              <VLink to="/apprendre" className={styles.back}>
                {t('page.path.all')}
              </VLink>
            </p>
            <Rubric as="h1" text={path.title} className={styles.title} />
            <p className={styles.meta}>
              {t('page.path.number', { n: path.order })}, {t('page.learn.meta', { steps: path.steps.length, questions: path.quiz.length, minutes: path.minutes })}
            </p>
          </div>
        </header>

        <Prose text={path.intro} variant="chapeau" className={styles.intro} />

        <Rubric as="h2" id="etapes" k="page.path.steps.title" className={styles.section} />
        <ol role="list" className={`${styles.steps} ${col.pleine}`}>
          {path.steps.map((step, stepIndex) => (
            <Step key={step.id} step={step} n={stepIndex + 1} />
          ))}
        </ol>

        <Rubric as="h2" id="questions" k="page.path.quiz.title" className={styles.section} />
        {path.quiz.length === 0 ? (
          <p className={styles.quizEmpty}>{t('page.path.quiz.empty')}</p>
        ) : (
          <>
            <p className={styles.quizIntro} lang={reading}>
              {t('page.path.quiz.intro', { n: path.quiz.length })}
            </p>
            <div className={col.large}>
              <Quiz key={path.id} pathId={path.id} questions={path.quiz} />
            </div>
          </>
        )}

        <nav className={`${styles.pager} ${col.pleine}`} aria-label={t('page.path.all')}>
          {previous ? (
            <VLink to={`/apprendre/${previous.id}`} className={styles.pagerLink} rel="prev">
              <span className={styles.pagerLabel}>{t('page.path.previous')}</span>
              <Gloss text={previous.title} classes={{ main: styles.pagerTitle, tr: styles.pagerGloss }} />
            </VLink>
          ) : (
            <span />
          )}
          {following ? (
            <VLink to={`/apprendre/${following.id}`} className={`${styles.pagerLink} ${styles.pagerNext}`} rel="next">
              <span className={styles.pagerLabel}>{t('page.path.next')}</span>
              <Gloss text={following.title} classes={{ main: styles.pagerTitle, tr: styles.pagerGloss }} />
            </VLink>
          ) : null}
        </nav>
      </Folio>
    </main>
  );
}

function Step({ step, n }: { step: PathStep; n: number }) {
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  const id = `etape-${step.id}`;
  return (
    <li className={styles.step} aria-labelledby={id}>
      <div className={styles.stepMain}>
        <h3 id={id} className={styles.stepTitle}>
          <span className={styles.stepNumber}>{n}</span>
          <Gloss text={step.title} classes={{ main: styles.stepName, tr: styles.stepGloss }} />
        </h3>
        <Prose text={step.body} />
      </div>
      <aside className={styles.stepMargin} aria-label={tx(step.title)}>
        {step.retain.length > 0 ? (
          <div className={styles.retain}>
            <p className={styles.marginTitle}>{t('page.path.retain')}</p>
            <ul role="list" className={styles.retainList}>
              {step.retain.map((item, index) => (
                <li key={index} lang={reading}>
                  {tx(item)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {step.links.length > 0 ? (
          <div className={styles.links}>
            <p className={styles.marginTitle}>{t('page.path.links')}</p>
            <ul role="list" className={styles.linkList}>
              {step.links.map((link) => (
                <li key={link.to}>
                  <VLink to={link.to} className={styles.link}>
                    {tx(link.label)}
                  </VLink>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </li>
  );
}
