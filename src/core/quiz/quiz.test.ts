import { describe, expect, it } from 'vitest';

import type { Localized, QuizQuestion } from '../content/types.ts';
import { answer, createQuiz, currentQuestion, isCorrect, next, quizMistakes, quizReducer, quizScore, restart } from './quiz.ts';
import type { QuizAction, QuizState } from './quiz.ts';

/* ------------------------------------------------------------------ jeux d'essai */

const loc = (fr: string, en: string = fr): Localized => ({ fr, en });

function question(id: string, choices: string[], right: number): QuizQuestion {
  return {
    id,
    question: loc(`Question ${id}`),
    choices: choices.map((choice) => loc(choice)),
    answer: right,
    explanation: loc(`Explication ${id}`),
  };
}

const QUESTIONS: QuizQuestion[] = [
  question('q1', ['Balerion', 'Vhagar', 'Meraxes'], 0),
  question('q2', ['37', '42', '48', '103'], 3),
  question('q3', ['Peyredragon', 'Port-Réal'], 1),
  question('q4', ['Aenys', 'Maegor', 'Jaehaerys', 'Viserys'], 2),
  question('q5', ['129', '130', '131'], 0),
];

const play = (state: QuizState, ...actions: QuizAction[]): QuizState => actions.reduce(quizReducer, state);
const rightAnswer = (state: QuizState): number => currentQuestion(state)?.question.answer ?? -1;
const wrongAnswer = (state: QuizState): number => (rightAnswer(state) === 0 ? 1 : 0);
/** Répond à toutes les questions restantes ; `wrongIds` dit lesquelles sont ratées. */
function finish(state: QuizState, wrongIds: readonly string[] = []): QuizState {
  let current = state;
  while (current.phase !== 'done') {
    const id = currentQuestion(current)?.question.id ?? '';
    current = play(current, answer(wrongIds.includes(id) ? wrongAnswer(current) : rightAnswer(current)), next());
  }
  return current;
}
const asked = (state: QuizState): string[] => state.slots.map((slot) => state.questions[slot.question]?.id ?? '');

/* ------------------------------------------------------------------ essais */

describe('createQuiz', () => {
  it('ouvre sur la première question, dans l’ordre du questionnaire', () => {
    const state = createQuiz(QUESTIONS);
    expect(state).toMatchObject({ index: 0, phase: 'question', round: 1, scope: 'all', shuffle: false });
    expect(asked(state)).toEqual(['q1', 'q2', 'q3', 'q4', 'q5']);
    expect(state.slots.map((slot) => slot.choices)).toEqual([[0, 1, 2], [0, 1, 2, 3], [0, 1], [0, 1, 2, 3], [0, 1, 2]]);
    expect(state.slots.every((slot) => slot.given === null)).toBe(true);
  });

  it('rend un état gelé, jusqu’aux réponses présentées', () => {
    const state = createQuiz(QUESTIONS, { shuffle: true, seed: 3 });
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.slots)).toBe(true);
    expect(state.slots.every((slot) => Object.isFrozen(slot) && Object.isFrozen(slot.choices))).toBe(true);
    expect(() => {
      (state as { index: number }).index = 3;
    }).toThrow(TypeError);
  });

  it('ne modifie ni ne copie les questions reçues', () => {
    const before = JSON.stringify(QUESTIONS);
    const state = createQuiz(QUESTIONS, { shuffle: true, seed: 9 });
    expect(state.questions).toBe(QUESTIONS);
    expect(JSON.stringify(QUESTIONS)).toBe(before);
    expect(Object.isFrozen(QUESTIONS)).toBe(false);
  });

  it('est aussitôt terminé quand il n’y a pas de question', () => {
    const state = createQuiz([]);
    expect(state.phase).toBe('done');
    expect(currentQuestion(state)).toBeNull();
    expect(quizScore(state)).toEqual({ correct: 0, answered: 0, total: 0, ratio: 0, done: true });
    expect(play(state, answer(0), next())).toBe(state);
  });
});

describe('mélange', () => {
  it('donne le même ordre pour la même graine', () => {
    const a = createQuiz(QUESTIONS, { shuffle: true, seed: 'danse' });
    const b = createQuiz(QUESTIONS, { shuffle: true, seed: 'danse' });
    expect(a.slots).toEqual(b.slots);
    expect(a.seed).toBe(b.seed);
  });

  it('donne un autre ordre pour une autre graine', () => {
    const orders = new Set([1, 2, 3, 4, 5, 6].map((seed) => JSON.stringify(createQuiz(QUESTIONS, { shuffle: true, seed }).slots)));
    expect(orders.size).toBeGreaterThanOrEqual(5);
  });

  it('pose chaque question une fois et présente chaque réponse une fois', () => {
    for (const seed of [1, 2, 3, 'p5', 'p8']) {
      const state = createQuiz(QUESTIONS, { shuffle: true, seed });
      expect(asked(state).sort()).toEqual(['q1', 'q2', 'q3', 'q4', 'q5']);
      for (const slot of state.slots) {
        const count = QUESTIONS[slot.question]?.choices.length ?? 0;
        expect([...slot.choices].sort()).toEqual(Array.from({ length: count }, (_, i) => i));
      }
    }
  });

  it('mélange vraiment les questions et les réponses', () => {
    const states = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => createQuiz(QUESTIONS, { shuffle: true, seed }));
    expect(states.some((state) => asked(state).join() !== 'q1,q2,q3,q4,q5')).toBe(true);
    expect(states.some((state) => state.slots.some((slot) => slot.choices.some((choice, i) => choice !== i)))).toBe(true);
  });

  it('ne mélange rien sans shuffle, quelle que soit la graine', () => {
    expect(createQuiz(QUESTIONS, { seed: 99 }).slots).toEqual(createQuiz(QUESTIONS).slots);
  });

  it('la bonne réponse reste la bonne, où qu’elle soit présentée', () => {
    let state = createQuiz(QUESTIONS, { shuffle: true, seed: 11 });
    while (state.phase !== 'done') {
      const view = currentQuestion(state);
      if (!view) throw new Error('une question était attendue');
      const right = view.question.answer;
      expect(view.choices.find((choice) => choice.index === right)?.label).toEqual(view.question.choices[right]);
      state = play(state, answer(right), next());
    }
    expect(quizScore(state).correct).toBe(QUESTIONS.length);
  });
});

describe('quizReducer : answer', () => {
  it('enregistre la réponse et passe à l’explication', () => {
    const start = createQuiz(QUESTIONS);
    const state = play(start, answer(1));
    expect(state.phase).toBe('feedback');
    expect(state.index).toBe(0);
    expect(state.slots[0]?.given).toBe(1);
    expect(Object.isFrozen(state)).toBe(true);
  });

  it('ne touche pas à l’état précédent', () => {
    const start = createQuiz(QUESTIONS);
    const snapshot = JSON.stringify(start.slots);
    const state = play(start, answer(0));
    expect(state).not.toBe(start);
    expect(JSON.stringify(start.slots)).toBe(snapshot);
    expect(start.phase).toBe('question');
    // Les questions non concernées sont partagées, pas recopiées.
    expect(state.slots[1]).toBe(start.slots[1]);
  });

  it('ne laisse pas répondre deux fois', () => {
    const once = play(createQuiz(QUESTIONS), answer(1));
    expect(play(once, answer(0))).toBe(once);
  });

  it('refuse une réponse qui n’existe pas', () => {
    const start = createQuiz(QUESTIONS);
    for (const choice of [-1, 3, 1.5, Number.NaN]) expect(play(start, answer(choice))).toBe(start);
  });
});

describe('quizReducer : next', () => {
  it('ne passe pas une question sans réponse', () => {
    const start = createQuiz(QUESTIONS);
    expect(play(start, next())).toBe(start);
  });

  it('avance à la question suivante après l’explication', () => {
    const state = play(createQuiz(QUESTIONS), answer(0), next());
    expect(state).toMatchObject({ index: 1, phase: 'question' });
    expect(currentQuestion(state)?.question.id).toBe('q2');
  });

  it('termine la manche après la dernière question, puis ne fait plus rien', () => {
    const done = finish(createQuiz(QUESTIONS));
    expect(done).toMatchObject({ phase: 'done', index: QUESTIONS.length - 1 });
    expect(play(done, next())).toBe(done);
    expect(play(done, answer(0))).toBe(done);
    expect(currentQuestion(done)).toBeNull();
  });

  it('ignore une action inconnue', () => {
    const start = createQuiz(QUESTIONS);
    expect(quizReducer(start, { type: 'skip' } as unknown as QuizAction)).toBe(start);
  });
});

describe('currentQuestion', () => {
  it('ne révèle rien avant la réponse', () => {
    const view = currentQuestion(createQuiz(QUESTIONS));
    expect(view).toMatchObject({ number: 1, total: 5, last: false, given: null, correct: null, answer: null });
    expect(view?.choices).toEqual([
      { index: 0, label: loc('Balerion') },
      { index: 1, label: loc('Vhagar') },
      { index: 2, label: loc('Meraxes') },
    ]);
  });

  it('dit après la réponse si elle est juste, et laquelle l’était', () => {
    const wrong = currentQuestion(play(createQuiz(QUESTIONS), answer(2)));
    expect(wrong).toMatchObject({ given: 2, correct: false, answer: 0 });
    const right = currentQuestion(play(createQuiz(QUESTIONS), answer(0)));
    expect(right).toMatchObject({ given: 0, correct: true, answer: 0 });
  });

  it('signale la dernière question', () => {
    let state = createQuiz(QUESTIONS);
    for (let i = 0; i < 4; i += 1) state = play(state, answer(0), next());
    expect(currentQuestion(state)).toMatchObject({ number: 5, total: 5, last: true });
  });

  it('présente les réponses dans l’ordre du mélange, chacune avec sa position d’origine', () => {
    const state = createQuiz(QUESTIONS, { shuffle: true, seed: 5 });
    const view = currentQuestion(state);
    expect(view?.choices.map((choice) => choice.index)).toEqual([...(state.slots[0]?.choices ?? [])]);
    for (const choice of view?.choices ?? []) expect(choice.label).toEqual(view?.question.choices[choice.index]);
  });
});

describe('quizScore', () => {
  it('compte les réponses justes au fil de la manche', () => {
    const start = createQuiz(QUESTIONS);
    expect(quizScore(start)).toEqual({ correct: 0, answered: 0, total: 5, ratio: 0, done: false });
    const two = play(start, answer(0), next(), answer(0));
    expect(quizScore(two)).toEqual({ correct: 1, answered: 2, total: 5, ratio: 0.2, done: false });
  });

  it('donne le résultat final', () => {
    expect(quizScore(finish(createQuiz(QUESTIONS)))).toEqual({ correct: 5, answered: 5, total: 5, ratio: 1, done: true });
    expect(quizScore(finish(createQuiz(QUESTIONS), ['q2', 'q5']))).toEqual({ correct: 3, answered: 5, total: 5, ratio: 0.6, done: true });
  });

  it('isCorrect est faux tant qu’il n’y a pas de réponse', () => {
    const start = createQuiz(QUESTIONS);
    const first = start.slots[0];
    expect(first && isCorrect(start, first)).toBe(false);
  });
});

describe('quizMistakes', () => {
  it('rend les erreurs avec la réponse donnée et la bonne, dans l’ordre des questions posées', () => {
    const done = finish(createQuiz(QUESTIONS), ['q2', 'q5']);
    const mistakes = quizMistakes(done);
    expect(mistakes.map((mistake) => mistake.question.id)).toEqual(['q2', 'q5']);
    expect(mistakes[0]).toEqual({ question: QUESTIONS[1], given: 0, givenLabel: loc('37'), answerLabel: loc('103') });
    expect(mistakes[1]).toMatchObject({ given: 1, givenLabel: loc('130'), answerLabel: loc('129') });
  });

  it('ne compte pas comme erreur une question sans réponse', () => {
    const state = play(createQuiz(QUESTIONS), answer(1));
    expect(quizMistakes(state).map((mistake) => mistake.question.id)).toEqual(['q1']);
    expect(quizMistakes(finish(createQuiz(QUESTIONS)))).toEqual([]);
  });
});

describe('quizReducer : restart', () => {
  it('rouvre tout le questionnaire, réponses effacées', () => {
    const again = play(finish(createQuiz(QUESTIONS), ['q1']), restart());
    expect(again).toMatchObject({ index: 0, phase: 'question', round: 2, scope: 'all' });
    expect(asked(again)).toEqual(['q1', 'q2', 'q3', 'q4', 'q5']);
    expect(quizScore(again).answered).toBe(0);
    expect(Object.isFrozen(again)).toBe(true);
  });

  it('peut reprendre en cours de manche', () => {
    const again = play(createQuiz(QUESTIONS), answer(0), next(), answer(1), restart());
    expect(again).toMatchObject({ index: 0, phase: 'question', round: 2 });
  });

  it('révise les seules erreurs avec scope: mistakes', () => {
    const review = play(finish(createQuiz(QUESTIONS), ['q2', 'q5']), restart({ scope: 'mistakes' }));
    expect(review).toMatchObject({ index: 0, phase: 'question', round: 2, scope: 'mistakes' });
    expect(asked(review)).toEqual(['q2', 'q5']);
    expect(quizScore(review).total).toBe(2);
    expect(review.questions).toBe(QUESTIONS);
  });

  it('enchaîne les révisions jusqu’à ce qu’il ne reste plus d’erreur', () => {
    const first = play(finish(createQuiz(QUESTIONS), ['q2', 'q5']), restart({ scope: 'mistakes' }));
    const second = play(finish(first, ['q5']), restart({ scope: 'mistakes' }));
    expect(asked(second)).toEqual(['q5']);
    const clean = finish(second);
    expect(quizScore(clean)).toMatchObject({ correct: 1, total: 1, ratio: 1 });
    // Plus rien à revoir : la révision n'a pas d'objet, l'état ne change pas.
    expect(play(clean, restart({ scope: 'mistakes' }))).toBe(clean);
    expect(asked(play(clean, restart()))).toEqual(['q1', 'q2', 'q3', 'q4', 'q5']);
  });

  it('sans mélange, garde la graine et l’ordre', () => {
    const start = createQuiz(QUESTIONS, { seed: 7 });
    const again = play(finish(start), restart());
    expect(again.seed).toBe(start.seed);
    expect(again.slots).toEqual(start.slots);
  });

  it('avec mélange, dérive une nouvelle graine, toujours la même', () => {
    const start = createQuiz(QUESTIONS, { shuffle: true, seed: 7 });
    const a = play(finish(start), restart());
    const b = play(finish(start, ['q1']), restart());
    expect(a.seed).not.toBe(start.seed);
    expect(b.seed).toBe(a.seed);
    expect(b.slots).toEqual(a.slots);
    expect(asked(a).sort()).toEqual(['q1', 'q2', 'q3', 'q4', 'q5']);
  });

  it('prend la graine donnée à restart', () => {
    const start = createQuiz(QUESTIONS, { shuffle: true, seed: 7 });
    const again = play(finish(start), restart({ seed: 'autre' }));
    expect(again.slots).toEqual(createQuiz(QUESTIONS, { shuffle: true, seed: 'autre' }).slots);
  });

  it('mélange aussi la révision', () => {
    const start = createQuiz(QUESTIONS, { shuffle: true, seed: 2 });
    const review = play(finish(start, ['q1', 'q3', 'q4']), restart({ scope: 'mistakes', seed: 5 }));
    expect(asked(review).sort()).toEqual(['q1', 'q3', 'q4']);
    expect(review.slots.every((slot) => slot.given === null)).toBe(true);
  });
});
