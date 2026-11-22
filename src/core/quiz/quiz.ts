/**
 * Moteur de questionnaire. Aucun état global : `createQuiz` rend un état immuable (gelé),
 * `quizReducer` rend l'état suivant sans toucher au précédent. Le tout se branche tel quel
 * sur `useReducer`.
 *
 * Déroulé d'une manche : `question` (le lecteur choisit) -> `answer` -> `feedback`
 * (l'explication est montrée) -> `next` -> question suivante, ou `done` après la dernière.
 * Une action qui n'a pas de sens dans la phase en cours rend l'état reçu, à l'identique :
 * on ne répond pas deux fois, on ne passe pas une question sans y répondre.
 *
 * `restart` ouvre une nouvelle manche, sur toutes les questions ou sur les seules erreurs
 * de la manche qui s'achève (`scope: 'mistakes'`).
 *
 * Les réponses sont toujours désignées par leur position dans `QuizQuestion.choices`,
 * quel que soit l'ordre dans lequel le mélange les présente.
 *
 * Fichier en TypeScript « effaçable » : importable tel quel par Node 24.
 */
import type { Localized, QuizQuestion } from '../content/types.ts';
import { createRandom, nextSeed, shuffled, toSeed } from './random.ts';

/* ------------------------------------------------------------------ état */

export interface QuizOptions {
  /** Mélange l'ordre des questions et celui des réponses. Défaut : non. */
  shuffle?: boolean;
  /** Graine du mélange : la même graine redonne le même ordre. Défaut : 1. */
  seed?: number | string;
}

export type QuizPhase = 'question' | 'feedback' | 'done';
export type QuizScope = 'all' | 'mistakes';

/** Une question telle qu'elle est posée dans la manche. */
export interface QuizSlot {
  /** Position de la question dans `QuizState.questions`. */
  readonly question: number;
  /** Ordre de présentation des réponses : positions dans `QuizQuestion.choices`. */
  readonly choices: readonly number[];
  /** Réponse donnée (position dans `QuizQuestion.choices`) ; `null` tant que le lecteur n'a pas répondu. */
  readonly given: number | null;
}

export interface QuizState {
  readonly questions: readonly QuizQuestion[];
  readonly shuffle: boolean;
  /** Graine de la manche en cours (entier sur 32 bits). */
  readonly seed: number;
  /** Numéro de la manche, à partir de 1. */
  readonly round: number;
  /** Ce que la manche pose : tout le questionnaire, ou les erreurs de la manche précédente. */
  readonly scope: QuizScope;
  readonly slots: readonly QuizSlot[];
  /** Position de la question en cours dans `slots`. */
  readonly index: number;
  readonly phase: QuizPhase;
}

export const DEFAULT_QUIZ_SEED = 1;

/** Gèle un état et ses questions posées. Sert aussi à rétablir un état sauvegardé (`storage.ts`). */
export function sealQuiz(state: QuizState): QuizState {
  for (const slot of state.slots) {
    Object.freeze(slot.choices);
    Object.freeze(slot);
  }
  Object.freeze(state.slots);
  return Object.freeze(state);
}

/* ------------------------------------------------------------------ manche */

type RoundSettings = Pick<QuizState, 'questions' | 'shuffle' | 'seed' | 'round' | 'scope'>;

function positions(length: number): number[] {
  return Array.from({ length }, (_, i) => i);
}

/** Distribue les questions retenues ; un seul tirage sert à l'ordre des questions puis à celui des réponses. */
function deal(settings: RoundSettings, picked: readonly number[]): QuizSlot[] {
  const random = createRandom(settings.seed);
  const order = settings.shuffle ? shuffled(picked, random) : [...picked];
  return order.map((question) => {
    const choices = positions(settings.questions[question]?.choices.length ?? 0);
    return { question, choices: settings.shuffle ? shuffled(choices, random) : choices, given: null };
  });
}

function startRound(settings: RoundSettings, picked: readonly number[]): QuizState {
  const slots = deal(settings, picked);
  return sealQuiz({ ...settings, slots, index: 0, phase: slots.length === 0 ? 'done' : 'question' });
}

/**
 * Ouvre un questionnaire sur sa première question. Sans question, il est aussitôt terminé.
 * Avec `shuffle`, donner une graine qui varie (l'heure, par exemple) pour que l'ordre change
 * d'une visite à l'autre : sans graine, le mélange est toujours le même.
 */
export function createQuiz(questions: readonly QuizQuestion[], options: QuizOptions = {}): QuizState {
  const settings: RoundSettings = {
    questions,
    shuffle: options.shuffle === true,
    seed: toSeed(options.seed ?? DEFAULT_QUIZ_SEED),
    round: 1,
    scope: 'all',
  };
  return startRound(settings, positions(questions.length));
}

/* ------------------------------------------------------------------ lecture */

/** Vrai si le lecteur a répondu juste à cette question. Sans réponse : faux. */
export function isCorrect(state: QuizState, slot: QuizSlot): boolean {
  return slot.given !== null && state.questions[slot.question]?.answer === slot.given;
}

function isMistake(state: QuizState, slot: QuizSlot): boolean {
  return slot.given !== null && !isCorrect(state, slot);
}

export interface QuizChoice {
  /** Position dans `QuizQuestion.choices` : c'est elle que l'on donne à `answer`. */
  index: number;
  label: Localized;
}

export interface QuizView {
  question: QuizQuestion;
  /** Rang de la question dans la manche, à partir de 1. */
  number: number;
  total: number;
  /** Vrai pour la dernière question de la manche. */
  last: boolean;
  /** Réponses dans l'ordre où les présenter. */
  choices: QuizChoice[];
  given: number | null;
  /** `null` tant que le lecteur n'a pas répondu : rien n'est révélé avant. */
  correct: boolean | null;
  /** Position de la bonne réponse, révélée après la réponse seulement. */
  answer: number | null;
}

function choicesOf(question: QuizQuestion, order: readonly number[]): QuizChoice[] {
  const shown: QuizChoice[] = [];
  for (const index of order) {
    const label = question.choices[index];
    if (label) shown.push({ index, label });
  }
  return shown;
}

/** La question en cours, prête à être affichée ; `null` quand la manche est terminée. */
export function currentQuestion(state: QuizState): QuizView | null {
  const slot = state.slots[state.index];
  const question = slot ? state.questions[slot.question] : undefined;
  if (state.phase === 'done' || !slot || !question) return null;
  const answered = slot.given !== null;
  return {
    question,
    number: state.index + 1,
    total: state.slots.length,
    last: state.index === state.slots.length - 1,
    choices: choicesOf(question, slot.choices),
    given: slot.given,
    correct: answered ? isCorrect(state, slot) : null,
    answer: answered ? question.answer : null,
  };
}

export interface QuizScore {
  correct: number;
  answered: number;
  total: number;
  /** Part de réponses justes sur l'ensemble de la manche, de 0 à 1 ; 0 pour une manche vide. */
  ratio: number;
  done: boolean;
}

export function quizScore(state: QuizState): QuizScore {
  const total = state.slots.length;
  const answered = state.slots.filter((slot) => slot.given !== null).length;
  const correct = state.slots.filter((slot) => isCorrect(state, slot)).length;
  return { correct, answered, total, ratio: total === 0 ? 0 : correct / total, done: state.phase === 'done' };
}

export interface QuizMistake {
  question: QuizQuestion;
  /** Réponse donnée, et son texte. */
  given: number;
  givenLabel: Localized;
  /** Texte de la bonne réponse ; l'explication est dans `question.explanation`. */
  answerLabel: Localized;
}

/** Les erreurs de la manche, dans l'ordre où les questions ont été posées. */
export function quizMistakes(state: QuizState): QuizMistake[] {
  const mistakes: QuizMistake[] = [];
  for (const slot of state.slots) {
    const question = state.questions[slot.question];
    if (!question || slot.given === null || !isMistake(state, slot)) continue;
    const givenLabel = question.choices[slot.given];
    const answerLabel = question.choices[question.answer];
    if (givenLabel && answerLabel) mistakes.push({ question, given: slot.given, givenLabel, answerLabel });
  }
  return mistakes;
}

/* ------------------------------------------------------------------ actions */

export interface RestartOptions {
  /** `all` (défaut) : tout le questionnaire. `mistakes` : seulement les erreurs de la manche en cours. */
  scope?: QuizScope;
  /** Graine de la nouvelle manche. Sans elle, un questionnaire mélangé dérive la suivante de la graine en cours. */
  seed?: number | string;
}

export type QuizAction =
  | { readonly type: 'answer'; readonly choice: number }
  | { readonly type: 'next' }
  | ({ readonly type: 'restart' } & Readonly<RestartOptions>);

/** Répondre à la question en cours ; `choice` est une position dans `QuizQuestion.choices`. */
export function answer(choice: number): QuizAction {
  return { type: 'answer', choice };
}

/** Quitter l'explication : question suivante, ou fin de la manche. */
export function next(): QuizAction {
  return { type: 'next' };
}

/** Ouvrir une nouvelle manche. */
export function restart(options: RestartOptions = {}): QuizAction {
  return { type: 'restart', ...options };
}

function applyAnswer(state: QuizState, choice: number): QuizState {
  const current = state.slots[state.index];
  if (state.phase !== 'question' || !current || !current.choices.includes(choice)) return state;
  const slots = state.slots.map((slot, i) => (i === state.index ? { ...slot, given: choice } : slot));
  return sealQuiz({ ...state, slots, phase: 'feedback' });
}

function applyNext(state: QuizState): QuizState {
  if (state.phase !== 'feedback') return state;
  if (state.index >= state.slots.length - 1) return sealQuiz({ ...state, phase: 'done' });
  return sealQuiz({ ...state, index: state.index + 1, phase: 'question' });
}

/** Sans erreur à revoir, une révision n'a pas d'objet : l'état reste tel quel. */
function applyRestart(state: QuizState, options: RestartOptions): QuizState {
  const scope = options.scope ?? 'all';
  const missed = state.slots.filter((slot) => isMistake(state, slot)).map((slot) => slot.question);
  if (scope === 'mistakes' && missed.length === 0) return state;
  const derived = state.shuffle ? nextSeed(state.seed) : state.seed;
  const seed = options.seed === undefined ? derived : toSeed(options.seed);
  const { questions, shuffle } = state;
  const picked = scope === 'mistakes' ? missed : positions(questions.length);
  return startRound({ questions, shuffle, seed, round: state.round + 1, scope }, picked);
}

/** Réducteur pur : `(état, action) -> état`. L'état reçu n'est jamais modifié. */
export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'answer':
      return applyAnswer(state, action.choice);
    case 'next':
      return applyNext(state);
    case 'restart':
      return applyRestart(state, action);
    default:
      return state;
  }
}
