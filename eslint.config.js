import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/**
 * Frontières de l'architecture (documentation/architecture/ARCHITECTURE.md) :
 * core n'importe ni shared, ni versions, ni l'enveloppe de l'application, ni aucun CSS ;
 * shared n'importe pas versions ; une version n'importe jamais une autre version.
 */
const restrict = (patterns) => ['error', { patterns }];

const CORE_FORBIDDEN = [
  {
    group: ['@/shared', '@/shared/**', '@/versions', '@/versions/**', '@/app', '@/app/**', '@/compare', '@/compare/**'],
    message: 'src/core ne dépend ni de la présentation commune, ni des versions, ni de l’enveloppe de l’application.',
  },
  {
    group: ['*.css', '**/*.css'],
    message: 'src/core ne porte aucune présentation : aucun import de CSS.',
  },
];

const SHARED_FORBIDDEN = [
  {
    group: ['@/versions', '@/versions/**', '@/compare', '@/compare/**'],
    message: 'src/shared sert les trois versions et n’en importe aucune.',
  },
];

/** Interdit à la version `own` d'importer les deux autres. */
const otherVersions = (own) =>
  [1, 2, 3]
    .filter((n) => n !== own)
    .map((n) => ({
      group: [`@/versions/v${n}-*`, `@/versions/v${n}-*/**`, `**/versions/v${n}-*`, `**/versions/v${n}-*/**`],
      message: 'Une version n’importe jamais une autre version.',
    }));

export default defineConfig(
  globalIgnores([
    'dist/',
    'node_modules/',
    'src/content/generated/',
    'tests/visual/out/',
    '_sauvegardes/',
    'command-center/',
    'design/',
  ]),

  tseslint.configs.recommended,

  {
    name: 'tlv/react',
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
  },

  {
    name: 'tlv/frontiere-core',
    files: ['src/core/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrict(CORE_FORBIDDEN) },
  },
  {
    name: 'tlv/frontiere-shared',
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrict(SHARED_FORBIDDEN) },
  },
  ...[1, 2, 3].map((own) => ({
    name: `tlv/frontiere-version-${own}`,
    files: [`src/versions/v${own}-*/**/*.{ts,tsx}`],
    rules: { 'no-restricted-imports': restrict(otherVersions(own)) },
  })),
);
