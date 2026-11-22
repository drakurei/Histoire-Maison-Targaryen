import { useEffect, useRef } from 'react';
import type { Dispatch } from 'react';

import { useT, useTxTypo } from '@/core/i18n';
import { answer, currentQuestion, next, quizMistakes, quizScore, restart } from '@/core/quiz';
import type { QuizAction, QuizState } from '@/core/quiz';

import { SourcesPied } from '../../components/SourcesPied';

import styles from './Questionnaire.module.css';

interface QuestionnaireProps {
  state: QuizState;
  dispatch: Dispatch<QuizAction>;
}

/**
 * Le questionnaire d'un parcours (spec §5.15, `@/core/quiz`) : une question à la fois, la
 * réponse expliquée et sourcée, puis le bilan avec les erreurs à revoir. Aucune médaille,
 * aucun score mis en scène : une phrase, et ce qu'il faut relire.
 */
export function Questionnaire({ state, dispatch }: QuestionnaireProps) {
  const t = useT();
  const typo = useTxTypo();
  const view = currentQuestion(state);
  const score = quizScore(state);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const bilanRef = useRef<HTMLHeadingElement>(null);
  const touched = useRef(false);

  // Le focus suit le déroulé : la réponse expliquée, puis la question suivante, puis le bilan.
  useEffect(() => {
    if (!touched.current) return;
    if (state.phase === 'feedback') feedbackRef.current?.focus({ preventScroll: false });
    else if (state.phase === 'question') questionRef.current?.focus({ preventScroll: false });
    else bilanRef.current?.focus({ preventScroll: false });
  }, [state.phase, state.index, state.round]);

  const act = (action: QuizAction) => {
    touched.current = true;
    dispatch(action);
  };

  if (state.questions.length === 0) {
    return <p className={styles.vide}>{t('page.path.quiz.empty')}</p>;
  }

  if (!view) {
    const mistakes = quizMistakes(state);
    return (
      <div className={styles.bilan}>
        <h3 ref={bilanRef} tabIndex={-1} className={styles.resultat}>
          {t('page.path.quiz.result', { correct: score.correct, total: score.total })}
        </h3>
        {mistakes.length === 0 ? (
          <p className={styles.parfait}>{t('page.path.quiz.perfect')}</p>
        ) : (
          <>
            <h4 className={styles.rubrique}>{t('page.path.quiz.mistakes')}</h4>
            <ol role="list" className={styles.erreurs}>
              {mistakes.map((mistake) => (
                <li key={mistake.question.id} className={styles.erreur}>
                  <p className={styles.erreurQuestion}>{typo(mistake.question.question)}</p>
                  <p className={styles.erreurDonnee}>{t('page.path.quiz.given', { a: typo(mistake.givenLabel) })}</p>
                  <p className={styles.erreurReponse}>{t('page.path.quiz.answer', { a: typo(mistake.answerLabel) })}</p>
                  <p className={styles.explication}>{typo(mistake.question.explanation)}</p>
                </li>
              ))}
            </ol>
          </>
        )}
        <div className={styles.actions}>
          {mistakes.length > 0 ? (
            <button type="button" className={styles.action} onClick={() => act(restart({ scope: 'mistakes' }))}>
              {t('page.path.quiz.retryMistakes')}
            </button>
          ) : null}
          <button type="button" className={styles.action} onClick={() => act(restart())}>
            {t('page.path.quiz.restart')}
          </button>
        </div>
      </div>
    );
  }

  const answered = view.given !== null;
  const answerLabel = view.answer !== null ? view.question.choices[view.answer] : undefined;

  return (
    <div className={styles.question}>
      <p className={styles.compteur}>
        {t('page.path.quiz.counter', { n: view.number, total: view.total })}
        {state.scope === 'mistakes' ? <span className={styles.manche}>{t('page.path.quiz.round')}</span> : null}
      </p>
      <h3 ref={questionRef} tabIndex={-1} className={styles.enonce}>
        {typo(view.question.question)}
      </h3>
      <ul role="list" className={styles.choix} aria-label={t('page.path.quiz.choices')}>
        {view.choices.map((choice) => {
          const given = view.given === choice.index;
          const right = view.answer === choice.index;
          return (
            <li key={choice.index}>
              <button
                type="button"
                className={styles.reponse}
                disabled={answered}
                aria-pressed={answered ? given : undefined}
                data-juste={answered && right ? '' : undefined}
                data-donnee={given ? '' : undefined}
                onClick={() => act(answer(choice.index))}
              >
                <span className={styles.reponseTexte}>{typo(choice.label)}</span>
                {answered && (given || right) ? (
                  <span className={styles.reponseMarque}>
                    {[given ? t('page.path.quiz.yours') : null, right ? t('page.path.quiz.correct') : null].filter(Boolean).join(', ')}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div ref={feedbackRef} tabIndex={-1} className={styles.retour} aria-live="polite">
        {answered ? (
          <>
            <p className={styles.verdict}>
              {view.correct ? t('page.path.quiz.right') : t('page.path.quiz.wrong', { a: answerLabel ? typo(answerLabel) : '' })}
            </p>
            <p className={styles.explication}>{typo(view.question.explanation)}</p>
            {view.question.source ? <SourcesPied sources={[view.question.source]} /> : null}
            <button type="button" className={styles.action} onClick={() => act(next())}>
              {view.last ? t('page.path.quiz.finish') : t('page.path.quiz.next')}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
