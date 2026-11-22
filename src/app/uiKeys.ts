import type { VersionId } from './versionPath';

/**
 * Clés d'interface employées par l'enveloppe de l'application et par l'espace de comparaison.
 * Les textes vivent dans content/interface/ui.*.json ; une clé qui y manque s'affiche entre
 * crochets et est signalée une fois dans la console en développement.
 * Les réunir ici permet de les rapprocher du fichier de chaînes en un seul endroit :
 * src/app/uiKeys.test.ts échoue si l'une d'elles n'existe pas.
 */
export const UI = {
  /** Lien d'évitement : « Aller au contenu ». */
  skipToContent: 'a11y.skipToContent',
  /** Attente d'un bloc chargé à la demande. */
  loading: 'phrase.loading',

  /** Garde d'erreur : ce qui s'est passé, puis quoi faire. */
  errorTitle: 'error.boundary.title',
  errorBody: 'error.boundary.body',
  retry: 'error.boundary.retry',

  /** Page introuvable. */
  notFoundTitle: 'error.notFound.title',
  notFoundBody: 'error.notFound.body',

  /** Retour au portail : les textes d'erreur le nomment ainsi (« revenez au portail »). */
  portal: 'nav.portal',

  /** Écran provisoire des versions qui ne sont pas encore ouvertes. */
  underConstruction: 'version.underConstruction',

  /** Espace de comparaison. Son titre sert aussi de libellé au lien qui y mène. */
  compareTitle: 'compare.title',
  compareIntro: 'compare.intro',
  versionName: {
    'version-1': 'version.1.name',
    'version-2': 'version.2.name',
    'version-3': 'version.3.name',
  },
  /** Ce qu'est chaque version, en deux ou trois phrases. */
  versionWhat: {
    'version-1': 'compare.version.1.what',
    'version-2': 'compare.version.2.what',
    'version-3': 'compare.version.3.what',
  },
  /** Mention de la version ouverte à la racine (DEFAULT_VERSION). */
  compareDefault: 'compare.default',
} as const satisfies Record<string, string | Record<VersionId, string>>;
