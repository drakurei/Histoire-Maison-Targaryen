/**
 * Parcours d'apprentissage et leurs questionnaires.
 * Données produites par `scripts/build-content.mjs` à partir de `content/learning/paths.json`.
 */
import data from '@/content/generated/paths.json';
import type { LearningPath } from './types';

interface PathsData {
  paths: LearningPath[];
}

/*
 * Seul transtypage du module : la forme est garantie par la validation de
 * `scripts/build-content.mjs`, que le compilateur ne peut pas refaire sur du JSON.
 */
const typed = data as unknown as PathsData;

/** Parcours dans l'ordre conseillé (`order`). */
export const paths: readonly LearningPath[] = typed.paths;

const pathById: ReadonlyMap<string, LearningPath> = new Map(paths.map((path) => [path.id, path]));

export function getPath(id: string): LearningPath | undefined {
  return pathById.get(id);
}
