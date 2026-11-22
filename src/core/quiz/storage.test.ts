import { describe, expect, it } from 'vitest';

import type { Localized, QuizQuestion } from '../content/types.ts';
import { answer, createQuiz, currentQuestion, next, quizReducer, quizScore, restart } from './quiz.ts';
import type { QuizAction, QuizState } from './quiz.ts';
import { clearQuiz, fromSnapshot, loadQuiz, quizStorageKey, saveQuiz, toSnapshot } from './storage.ts';
import type { QuizSnapshot, QuizStorage } from './storage.ts';

/* ------------------------------------------------------------------ jeux d'essai */

const loc = (fr: string, en: string = fr): Localized => ({ fr, en });

function question(id: string, choices: string[], right: number): QuizQuestion {
  return { id, question: loc(`Question ${id}`), choices: choices.map((choice) => loc(choice)), answer: right, explanation: loc('') };
}

const QUESTIONS: QuizQuestion[] = [
  question('q1', ['Balerion', 'Vhagar', 'Meraxes'], 0),
  question('q2', ['37', '42', '48', '103'], 3),
  question('q3', ['Peyredragon', 'Port-Réal'], 1),
  question('q4', ['Aenys', 'Maegor', 'Jaehaerys', 'Viserys'], 2),
];

const KEY = quizStorageKey('p5');
const play = (state: QuizState, ...actions: QuizAction[]): QuizState => actions.reduce(quizReducer, state);

/** Stockage en mémoire, de la forme de `window.localStorage`. */
function memoryStorage(): QuizStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

/** Stockage refusé : navigation privée, quota dépassé, réglage strict. */
const REFUSED: QuizStorage = {
  getItem: () => {
    throw new Error('refusé');
  },
  setItem: () => {
    throw new Error('refusé');
  },
  removeItem: () => {
    throw new Error('refusé');
  },
};

/** États pris à chaque moment d'une manche : début, explication, milieu, fin, révision, mélange. */
function sampleStates(): QuizState[] {
  const start = createQuiz(QUESTIONS);
  const feedback = play(start, answer(1));
  const middle = play(feedback, next(), answer(3), next());
  const done = play(middle, answer(0), next(), answer(2), next());
  const review = play(done, restart({ scope: 'mistakes' }));
  const mixed = play(createQuiz(QUESTIONS, { shuffle: true, seed: 'p5' }), answer(0), next());
  return [start, feedback, middle, done, review, mixed, play(mixed, restart())];
}

/** Sauvegarde valide d'une manche en cours, à abîmer champ par champ. */
function snapshot(): QuizSnapshot {
  return toSnapshot(play(createQuiz(QUESTIONS), answer(1), next()));
}

/* ------------------------------------------------------------------ essais */

describe('quizStorageKey', () => {
  it('range les questionnaires avec les autres clés du site', () => {
    expect(KEY).toBe('tlv.quiz.p5');
  });
});

describe('toSnapshot', () => {
  it('désigne les questions par leur identifiant et n’emporte pas leur texte', () => {
    expect(snapshot()).toEqual({
      v: 1,
      shuffle: false,
      seed: 1,
      round: 1,
      scope: 'all',
      index: 1,
      phase: 'question',
      slots: [
        { id: 'q1', choices: [0, 1, 2], given: 1 },
        { id: 'q2', choices: [0, 1, 2, 3], given: null },
        { id: 'q3', choices: [0, 1], given: null },
        { id: 'q4', choices: [0, 1, 2, 3], given: null },
      ],
    });
    expect(JSON.stringify(snapshot())).not.toContain('Balerion');
  });

  it('rend une copie : la modifier ne touche pas à l’état', () => {
    const state = createQuiz(QUESTIONS);
    const copy = toSnapshot(state);
    copy.slots[0]?.choices.reverse();
    copy.index = 3;
    expect(state.slots[0]?.choices).toEqual([0, 1, 2]);
    expect(state.index).toBe(0);
  });
});

describe('saveQuiz et loadQuiz', () => {
  it('rétablissent l’état à l’identique, à chaque moment d’une manche', () => {
    for (const state of sampleStates()) {
      const storage = memoryStorage();
      expect(saveQuiz(storage, KEY, state)).toBe(true);
      const loaded = loadQuiz(storage, KEY, QUESTIONS);
      expect(loaded).toEqual(state);
      expect(loaded?.questions).toBe(QUESTIONS);
      expect(loaded && Object.isFrozen(loaded) && Object.isFrozen(loaded.slots)).toBe(true);
    }
  });

  it('écrivent du JSON sous la clé donnée, et seulement là', () => {
    const storage = memoryStorage();
    saveQuiz(storage, KEY, createQuiz(QUESTIONS));
    expect([...storage.data.keys()]).toEqual(['tlv.quiz.p5']);
    expect(JSON.parse(storage.data.get(KEY) ?? '')).toMatchObject({ v: 1, phase: 'question' });
  });

  it('permettent de reprendre la manche là où elle en était', () => {
    const storage = memoryStorage();
    saveQuiz(storage, KEY, play(createQuiz(QUESTIONS, { shuffle: true, seed: 4 }), answer(0), next()));
    const loaded = loadQuiz(storage, KEY, QUESTIONS);
    expect(loaded && currentQuestion(loaded)?.number).toBe(2);
    const resumed = loaded ? play(loaded, answer(currentQuestion(loaded)?.question.answer ?? 0), next()) : null;
    expect(resumed?.index).toBe(2);
    expect(resumed && quizScore(resumed).answered).toBe(2);
  });

  it('retrouvent les questions par identifiant même si leur ordre a changé', () => {
    const storage = memoryStorage();
    saveQuiz(storage, KEY, play(createQuiz(QUESTIONS), answer(1), next()));
    const reordered = [...QUESTIONS].reverse();
    const loaded = loadQuiz(storage, KEY, reordered);
    expect(loaded?.slots.map((slot) => reordered[slot.question]?.id)).toEqual(['q1', 'q2', 'q3', 'q4']);
    expect(loaded && currentQuestion(loaded)?.question.id).toBe('q2');
  });

  it('rendent null quand rien n’a été sauvegardé', () => {
    expect(loadQuiz(memoryStorage(), KEY, QUESTIONS)).toBeNull();
  });

  it('n’échouent jamais quand le stockage refuse', () => {
    expect(saveQuiz(REFUSED, KEY, createQuiz(QUESTIONS))).toBe(false);
    expect(loadQuiz(REFUSED, KEY, QUESTIONS)).toBeNull();
    expect(clearQuiz(REFUSED, KEY)).toBe(false);
  });

  it('rendent null pour un contenu illisible', () => {
    for (const raw of ['', 'pas du json', '{', 'null', '[]', '"texte"', '42']) {
      const storage = memoryStorage();
      storage.data.set(KEY, raw);
      expect(loadQuiz(storage, KEY, QUESTIONS)).toBeNull();
    }
  });
});

describe('clearQuiz', () => {
  it('efface la sauvegarde', () => {
    const storage = memoryStorage();
    saveQuiz(storage, KEY, createQuiz(QUESTIONS));
    expect(clearQuiz(storage, KEY)).toBe(true);
    expect(loadQuiz(storage, KEY, QUESTIONS)).toBeNull();
    expect(storage.data.size).toBe(0);
  });
});

describe('fromSnapshot : sauvegarde qui ne correspond plus', () => {
  it('accepte une sauvegarde intacte', () => {
    expect(fromSnapshot(snapshot(), QUESTIONS)).not.toBeNull();
  });

  it('refuse une autre version du format', () => {
    expect(fromSnapshot({ ...snapshot(), v: 2 }, QUESTIONS)).toBeNull();
    expect(fromSnapshot({ ...snapshot(), v: undefined }, QUESTIONS)).toBeNull();
  });

  it('refuse un questionnaire dont une question a disparu', () => {
    expect(fromSnapshot(snapshot(), QUESTIONS.slice(1))).toBeNull();
  });

  it('refuse une manche entière à laquelle il manque une question ajoutée depuis', () => {
    const grown = [...QUESTIONS, question('q5', ['129', '130'], 0)];
    expect(fromSnapshot(snapshot(), grown)).toBeNull();
  });

  it('accepte une révision qui ne pose qu’une partie des questions', () => {
    const done = play(createQuiz(QUESTIONS), answer(1), next(), answer(3), next(), answer(1), next(), answer(0), next());
    const review = play(done, restart({ scope: 'mistakes' }));
    expect(review.slots).toHaveLength(2);
    expect(fromSnapshot(toSnapshot(review), QUESTIONS)).toEqual(review);
  });

  it('refuse une question dont le nombre de réponses a changé', () => {
    const changed = QUESTIONS.map((item) => (item.id === 'q3' ? question('q3', ['Peyredragon', 'Port-Réal', 'Accalmie'], 1) : item));
    expect(fromSnapshot(snapshot(), changed)).toBeNull();
  });

  it('refuse des réponses qui ne sont pas une permutation', () => {
    const broken = snapshot();
    broken.slots[0] = { id: 'q1', choices: [0, 0, 2], given: 1 };
    expect(fromSnapshot(broken, QUESTIONS)).toBeNull();
  });

  it('refuse une question posée deux fois', () => {
    const broken = snapshot();
    broken.slots[3] = { id: 'q2', choices: [0, 1, 2, 3], given: null };
    expect(fromSnapshot(broken, QUESTIONS)).toBeNull();
  });

  it('refuse une réponse donnée qui n’existe pas', () => {
    const broken = snapshot();
    broken.slots[0] = { id: 'q1', choices: [0, 1, 2], given: 3 };
    expect(fromSnapshot(broken, QUESTIONS)).toBeNull();
  });

  it('refuse un déroulé incohérent', () => {
    const jumped = { ...snapshot(), index: 2 };
    const unanswered = { ...snapshot(), phase: 'feedback' };
    const early = { ...snapshot(), phase: 'done' };
    const outside = { ...snapshot(), index: 4 };
    for (const broken of [jumped, unanswered, early, outside]) expect(fromSnapshot(broken, QUESTIONS)).toBeNull();
  });

  it('refuse des champs du mauvais type', () => {
    const fields: Record<string, unknown>[] = [
      { shuffle: 'oui' },
      { seed: -1 },
      { seed: 1.5 },
      { round: 0 },
      { scope: 'tout' },
      { phase: 'pause' },
      { index: '1' },
      { slots: 'aucune' },
      { slots: [null, null, null, null] },
    ];
    for (const field of fields) expect(fromSnapshot({ ...snapshot(), ...field }, QUESTIONS)).toBeNull();
    for (const value of [null, undefined, 'texte', 12, []]) expect(fromSnapshot(value, QUESTIONS)).toBeNull();
  });

  it('accepte la sauvegarde d’un questionnaire vide', () => {
    const empty = createQuiz([]);
    expect(fromSnapshot(toSnapshot(empty), [])).toEqual(empty);
  });
});
