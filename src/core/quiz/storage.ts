/**
 * Persistance facultative du questionnaire : reprendre une manche là où le lecteur l'a laissée.
 *
 * Le moteur ne connaît aucun stockage. L'appelant en fournit un (`QuizStorage`, dont
 * `window.localStorage` a déjà la forme) ; un stockage refusé ou plein n'est jamais une
 * erreur pour le lecteur : `saveQuiz` rend `false`, `loadQuiz` rend `null`, et la visite
 * continue avec l'état en mémoire.
 *
 * Ce qui est écrit (`QuizSnapshot`) désigne les questions par leur identifiant, pas par leur
 * position : si le questionnaire a changé depuis (question retirée, réponses ajoutées), la
 * sauvegarde ne correspond plus et `loadQuiz` rend `null` plutôt qu'un état faux.
 *
 * Fichier en TypeScript « effaçable » : importable tel quel par Node 24.
 */
import type { QuizQuestion } from '../content/types.ts';
import { sealQuiz } from './quiz.ts';
import type { QuizPhase, QuizScope, QuizSlot, QuizState } from './quiz.ts';

/** Stockage clé-valeur injecté. `window.localStorage` et `sessionStorage` conviennent tels quels. */
export interface QuizStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface QuizSnapshotSlot {
  /** Identifiant de la question (`QuizQuestion.id`). */
  id: string;
  choices: number[];
  given: number | null;
}

export interface QuizSnapshot {
  v: 1;
  shuffle: boolean;
  seed: number;
  round: number;
  scope: QuizScope;
  index: number;
  phase: QuizPhase;
  slots: QuizSnapshotSlot[];
}

/** Clé de stockage d'un questionnaire, dans la famille des clés du site (`tlv.lang`, `tlv.support`). */
export function quizStorageKey(quizId: string): string {
  return `tlv.quiz.${quizId}`;
}

/* ------------------------------------------------------------------ écrire */

/** Forme sérialisable d'un état : tout sauf les questions elles-mêmes. */
export function toSnapshot(state: QuizState): QuizSnapshot {
  const { shuffle, seed, round, scope, index, phase } = state;
  const slots = state.slots.map((slot) => ({
    id: state.questions[slot.question]?.id ?? '',
    choices: [...slot.choices],
    given: slot.given,
  }));
  return { v: 1, shuffle, seed, round, scope, index, phase, slots };
}

/** Écrit l'état. Rend `false` si le stockage a refusé. */
export function saveQuiz(storage: QuizStorage, key: string, state: QuizState): boolean {
  try {
    storage.setItem(key, JSON.stringify(toSnapshot(state)));
    return true;
  } catch {
    return false;
  }
}

/** Efface la sauvegarde. Rend `false` si le stockage a refusé. */
export function clearQuiz(storage: QuizStorage, key: string): boolean {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ relire */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIndex(value: unknown, length: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < length;
}

/** Vrai si `value` range une fois chacune les positions 0 à `count - 1`. */
function isPermutation(value: unknown, count: number): value is number[] {
  if (!Array.isArray(value) || value.length !== count) return false;
  return value.every((item) => isIndex(item, count)) && new Set(value).size === count;
}

function slotFrom(raw: unknown, questions: readonly QuizQuestion[], byId: ReadonlyMap<string, number>): QuizSlot | null {
  if (!isRecord(raw) || typeof raw.id !== 'string') return null;
  const question = byId.get(raw.id);
  if (question === undefined) return null;
  const count = questions[question]?.choices.length ?? 0;
  const { choices, given } = raw;
  if (!isPermutation(choices, count)) return null;
  if (given !== null && !isIndex(given, count)) return null;
  return { question, choices, given };
}

function slotsFrom(raw: unknown, questions: readonly QuizQuestion[]): QuizSlot[] | null {
  if (!Array.isArray(raw)) return null;
  const byId = new Map(questions.map((question, i) => [question.id, i] as const));
  const slots: QuizSlot[] = [];
  for (const item of raw) {
    const slot = slotFrom(item, questions, byId);
    if (!slot || slots.some((other) => other.question === slot.question)) return null;
    slots.push(slot);
  }
  return slots;
}

/** Le déroulé est cohérent : tout ce qui précède la question en cours a une réponse, rien de ce qui suit. */
function isCoherent(slots: readonly QuizSlot[], index: unknown, phase: QuizPhase): index is number {
  if (slots.length === 0) return index === 0 && phase === 'done';
  if (!isIndex(index, slots.length)) return false;
  if (phase === 'done' && index !== slots.length - 1) return false;
  const answered = phase === 'question' ? index : index + 1;
  return slots.every((slot, i) => (slot.given !== null) === (i < answered));
}

function isPhase(value: unknown): value is QuizPhase {
  return value === 'question' || value === 'feedback' || value === 'done';
}

function isScope(value: unknown): value is QuizScope {
  return value === 'all' || value === 'mistakes';
}

/**
 * Rétablit un état à partir d'une sauvegarde, pour ces questions. Rend `null` si la
 * sauvegarde est d'une autre version, abîmée, ou ne correspond plus au questionnaire.
 */
export function fromSnapshot(value: unknown, questions: readonly QuizQuestion[]): QuizState | null {
  if (!isRecord(value) || value.v !== 1) return null;
  const { shuffle, seed, round, scope, index, phase } = value;
  if (typeof shuffle !== 'boolean' || !isIndex(seed, 2 ** 32) || !isPhase(phase) || !isScope(scope)) return null;
  if (typeof round !== 'number' || !Number.isInteger(round) || round < 1) return null;
  const slots = slotsFrom(value.slots, questions);
  if (!slots || !isCoherent(slots, index, phase)) return null;
  // Une manche entière pose toutes les questions : s'il en manque, le questionnaire a grandi depuis.
  if (scope === 'all' && slots.length !== questions.length) return null;
  return sealQuiz({ questions, shuffle, seed, round, scope, slots, index, phase });
}

/** Relit l'état sauvegardé sous `key`. `null` s'il n'y en a pas, s'il est illisible ou périmé. */
export function loadQuiz(storage: QuizStorage, key: string, questions: readonly QuizQuestion[]): QuizState | null {
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : fromSnapshot(JSON.parse(raw), questions);
  } catch {
    return null;
  }
}
