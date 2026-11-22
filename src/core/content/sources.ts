/**
 * Registre des sources et niveaux de fiabilité.
 * Données produites par `scripts/build-content.mjs` à partir de `content/sources/sources.json`.
 */
import data from '@/content/generated/sources.json';
import type { Localized, Reliability, ReliabilityLevel, Source } from './types';

/**
 * Nature d'un témoignage (récit direct, chronique fictive, adaptation, outil) : la valeur
 * de `Source.reliability`. À ne pas confondre avec `ReliabilityLevel`, qui qualifie un fait.
 */
export interface SourceScaleStep {
  id: string;
  label: Localized;
  definition: Localized;
}

interface SourcesData {
  sources: Source[];
  reliabilityLevels: ReliabilityLevel[];
  sourceScale: SourceScaleStep[];
}

/*
 * Seul transtypage du module. TypeScript infère du JSON des `string` là où le contrat
 * attend des unions littérales (`Source['type']`, `Continuity`, `Reliability`) : la forme
 * exacte est garantie en amont par la validation de `scripts/build-content.mjs`.
 */
const typed = data as unknown as SourcesData;

export const sources: readonly Source[] = typed.sources;

/** Les cinq niveaux de fiabilité d'un fait, du plus sûr au plus distant (`order`). */
export const reliabilityLevels: readonly ReliabilityLevel[] = typed.reliabilityLevels;

export const sourceScale: readonly SourceScaleStep[] = typed.sourceScale;

const sourceById: ReadonlyMap<string, Source> = new Map(sources.map((source) => [source.id, source]));
const levelById: ReadonlyMap<string, ReliabilityLevel> = new Map(reliabilityLevels.map((level) => [level.id, level]));
const scaleById: ReadonlyMap<string, SourceScaleStep> = new Map(sourceScale.map((step) => [step.id, step]));

export function getSource(id: string): Source | undefined {
  return sourceById.get(id);
}

export function getReliabilityLevel(id: Reliability): ReliabilityLevel | undefined {
  return levelById.get(id);
}

export function getSourceScaleStep(id: string): SourceScaleStep | undefined {
  return scaleById.get(id);
}
