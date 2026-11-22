/**
 * La progression des questionnaires, gardée sur l'appareil (`@/core/quiz`, stockage). Le
 * stockage peut manquer ou refuser (navigation privée, données effacées) : la page reste
 * correcte, elle oublie seulement.
 */
import type { LearningPath } from '@/core/content/types';
import { loadQuiz, quizStorageKey } from '@/core/quiz';
import type { QuizState, QuizStorage } from '@/core/quiz';

/** Le stockage local, ou `null` s'il est inaccessible. */
export function quizStorage(): QuizStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** L'état sauvegardé du questionnaire d'un parcours, s'il y en a un. */
export function savedQuiz(path: LearningPath): QuizState | null {
  const storage = quizStorage();
  return storage ? loadQuiz(storage, quizStorageKey(path.id), path.quiz) : null;
}
