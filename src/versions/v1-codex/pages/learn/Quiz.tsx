import { useEffect, useMemo, useReducer, useRef } from 'react';

import type { QuizQuestion } from '@/core/content/types';
import { useLang, useT, useTxTypo } from '@/core/i18n';
import { answer, createQuiz, currentQuestion, loadQuiz, next, quizMistakes, quizReducer, quizScore, quizStorageKey, restart, saveQuiz } from '@/core/quiz';
import type { QuizState } from '@/core/quiz';

import { Prose } from '../../components/Prose';
import { SourceList } from '../../components/SourceList';
import { safeStorage } from './progress';
import styles from './Quiz.module.css';

interface QuizProps {
  /** Identifiant du parcours : clé de la sauvegarde. */
  pathId: string;
  questions: readonly QuizQuestion[];
}

function initial({ pathId, questions }: QuizProps): QuizState {
  const storage = safeStorage();
  const saved = storage ? loadQuiz(storage, quizStorageKey(pathId), questions) : null;
  // Réponses mélangées pour que la bonne ne soit pas toujours à la même place ; graine changeante d'une visite à l'autre.
  return saved ?? createQuiz(questions, { shuffle: true, seed: Date.now() % 2 ** 31 });
}

/**
 * Quiz : une question à la fois. Le lecteur choisit ; la réponse est dite juste ou non,
 * expliquée et sourcée ; il passe à la suivante. Au bout, un bilan sobre : le compte des
 * réponses justes et les erreurs à revoir, avec leur explication. Ni médaille ni jauge.
 * La manche en cours est gardée sur l'appareil, si le navigateur le permet.
 */
export function Quiz(props: QuizProps) {
  const { pathId } = props;
  const t = useT();
  const tx = useTxTypo();
  const { reading } = useLang();
  const [state, dispatch] = useReducer(quizReducer, props, initial);
  const storage = useMemo(safeStorage, []);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLParagraphElement>(null);
  const touched = useRef(false);

  useEffect(() => {
    if (storage) saveQuiz(storage, quizStorageKey(pathId), state);
  }, [storage, pathId, state]);

  // Le focus suit le déroulé, mais seulement après un geste du lecteur (pas à l'arrivée sur la page).
  useEffect(() => {
    if (!touched.current) return;
    if (state.phase === 'feedback') feedbackRef.current?.focus();
    else if (state.phase === 'question') questionRef.current?.focus();
    else resultRef.current?.focus();
  }, [state.phase, state.index, state.round]);

  const act = (action: Parameters<typeof dispatch>[0]) => {
    touched.current = true;
    dispatch(action);
  };

  const view = currentQuestion(state);
  const score = quizScore(state);

  if (state.phase === 'done' || !view) {
    const mistakes = quizMistakes(state);
    return (
      <div className={styles.quiz}>
        <p ref={resultRef} tabIndex={-1} className={styles.result}>
          {t('page.path.quiz.result', { correct: score.correct, total: score.total })}
        </p>
        {mistakes.length === 0 ? (
          <p className={styles.perfect}>{t('page.path.quiz.perfect')}</p>
        ) : (
          <section aria-labelledby={`${pathId}-erreurs`} className={styles.mistakes}>
            <h3 id={`${pathId}-erreurs`} className={styles.mistakesTitle}>
              {t('page.path.quiz.mistakes')}
            </h3>
            <ol role="list" className={styles.mistakeList}>
              {mistakes.map((mistake) => (
                <li key={mistake.question.id} className={styles.mistake}>
                  <p className={styles.mistakeQuestion} lang={reading}>
                    {tx(mistake.question.question)}
                  </p>
                  <p className={styles.given}>{t('page.path.quiz.given', { a: tx(mistake.givenLabel) })}</p>
                  <p className={styles.right}>{t('page.path.quiz.answer', { a: tx(mistake.answerLabel) })}</p>
                  <Prose text={mistake.question.explanation} className={styles.explanation} />
                  {mistake.question.source ? <SourceList sources={[mistake.question.source]} variant="bloc" /> : null}
                </li>
              ))}
            </ol>
          </section>
        )}
        <div className={styles.actions}>
          {mistakes.length > 0 ? (
            <button type="button" className={styles.primary} onClick={() => act(restart({ scope: 'mistakes' }))}>
              {t('page.path.quiz.retryMistakes')}
            </button>
          ) : null}
          <button type="button" className={mistakes.length > 0 ? styles.secondary : styles.primary} onClick={() => act(restart())}>
            {t('page.path.quiz.restart')}
          </button>
        </div>
      </div>
    );
  }

  const answered = view.given !== null;
  const rightLabel = view.answer !== null ? view.question.choices[view.answer] : undefined;

  return (
    <div className={styles.quiz}>
      <div className={styles.position}>
        <p className={styles.counter}>{t('page.path.quiz.counter', { n: view.number, total: view.total })}</p>
        <span className={styles.ruler} aria-hidden="true">
          {state.slots.map((slot, index) => (
            <span key={index} className={styles.tick} data-state={index < state.index || (index === state.index && answered) ? 'done' : index === state.index ? 'current' : 'todo'} />
          ))}
        </span>
        {state.scope === 'mistakes' ? <p className={styles.round}>{t('page.path.quiz.round')}</p> : null}
      </div>

      <h3 ref={questionRef} tabIndex={-1} className={styles.question} lang={reading}>
        {tx(view.question.question)}
      </h3>

      <ul role="list" className={styles.choices} aria-label={t('page.path.quiz.choices')}>
        {view.choices.map((choice) => {
          const isGiven = view.given === choice.index;
          const isRight = view.answer === choice.index;
          return (
            <li key={choice.index}>
              <button
                type="button"
                className={styles.choice}
                disabled={answered}
                aria-pressed={answered ? isGiven : undefined}
                data-given={isGiven || undefined}
                data-right={(answered && isRight) || undefined}
                onClick={() => act(answer(choice.index))}
              >
                <span lang={reading}>{tx(choice.label)}</span>
                {answered && isRight ? <span className={styles.flag}>{t('page.path.quiz.correct')}</span> : null}
                {answered && isGiven && !isRight ? <span className={styles.flag}>{t('page.path.quiz.yours')}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>

      <div ref={feedbackRef} tabIndex={-1} className={styles.feedback} aria-live="polite" data-correct={view.correct ?? undefined}>
        {answered ? (
          <>
            <p className={styles.verdict}>
              {view.correct ? t('page.path.quiz.right') : t('page.path.quiz.wrong', { a: tx(rightLabel) })}
            </p>
            <Prose text={view.question.explanation} className={styles.explanation} />
            {view.question.source ? <SourceList sources={[view.question.source]} variant="bloc" /> : null}
          </>
        ) : null}
      </div>

      {answered ? (
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => act(next())}>
            {view.last ? t('page.path.quiz.finish') : t('page.path.quiz.next')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
