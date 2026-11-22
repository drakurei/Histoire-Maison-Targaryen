/**
 * Progression des parcours, gardée sur l'appareil du lecteur. Le stockage peut être refusé
 * (navigation privée, données bloquées) : on n'en fait jamais une erreur pour le lecteur,
 * la visite continue en mémoire.
 */
import type { LearningPath } from '@/core/content/types';
import { loadQuiz, quizScore, quizStorageKey } from '@/core/quiz';
import type { QuizStorage } from '@/core/quiz';

/** `window.localStorage`, ou `null` si le navigateur le refuse (l'accès lui-même peut lever une exception). */
export function safeStorage(): QuizStorage | null {
  try {
    const storage = window.localStorage;
    const probe = '__tlv_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export type PathProgress =
  | { kind: 'none' }
  | { kind: 'ongoing'; question: number; total: number }
  | { kind: 'done'; correct: number; total: number };

/** Où en est le lecteur du questionnaire d'un parcours. */
export function readProgress(path: LearningPath, storage: QuizStorage | null = safeStorage()): PathProgress {
  if (!storage || path.quiz.length === 0) return { kind: 'none' };
  const state = loadQuiz(storage, quizStorageKey(path.id), path.quiz);
  if (!state) return { kind: 'none' };
  const score = quizScore(state);
  if (score.done) return { kind: 'done', correct: score.correct, total: score.total };
  if (score.answered === 0 && state.round === 1) return { kind: 'none' };
  return { kind: 'ongoing', question: state.index + 1, total: score.total };
}
