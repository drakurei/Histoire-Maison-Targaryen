/**
 * Les trois versions montent le même plan de routes sous leur préfixe. Un lien interne
 * s'écrit donc sans préfixe (« /dragons/balerion ») ; ce module l'ajoute et le retire.
 */

export type VersionId = 'version-1' | 'version-2' | 'version-3';

export const VERSION_IDS = ['version-1', 'version-2', 'version-3'] as const satisfies readonly VersionId[];

const VERSION_NUMBERS: Record<VersionId, 1 | 2 | 3> = {
  'version-1': 1,
  'version-2': 2,
  'version-3': 3,
};

const PREFIX = /^\/(version-[123])(?=[/?#]|$)/;

export function isVersionId(value: unknown): value is VersionId {
  return value === 'version-1' || value === 'version-2' || value === 'version-3';
}

export function versionNumber(version: VersionId): 1 | 2 | 3 {
  return VERSION_NUMBERS[version];
}

/**
 * Chemin interne sans préfixe -> adresse dans la version donnée.
 *
 *   versionPath('version-1', '/dragons/balerion')  -> '/version-1/dragons/balerion'
 *   versionPath('version-1', '/')                  -> '/version-1'
 *   versionPath('version-2', '/lignee?p=aegon-i')  -> '/version-2/lignee?p=aegon-i'
 *   versionPath('version-1', '#blackwater')        -> '#blackwater' (même page)
 *
 * Un chemin déjà préfixé est rendu tel quel : préfixer deux fois est impossible.
 */
export function versionPath(version: VersionId, to: string): string {
  if (to.startsWith('#') || to.startsWith('?')) return to;
  if (PREFIX.test(to)) return to;

  const path = to.startsWith('/') ? to : `/${to}`;
  const cut = path.search(/[?#]/);
  const pathname = cut === -1 ? path : path.slice(0, cut);
  const suffix = cut === -1 ? '' : path.slice(cut);

  return `/${version}${pathname.replace(/\/+$/, '')}${suffix}`;
}

/**
 * Adresse -> version et chemin interne. Sert à passer d'une version à l'autre
 * sans quitter la page lue.
 *
 *   splitVersionPath('/version-1/dragons/balerion') -> { version: 'version-1', path: '/dragons/balerion' }
 *   splitVersionPath('/version-3')                  -> { version: 'version-3', path: '/' }
 *   splitVersionPath('/comparer')                   -> { version: null, path: '/comparer' }
 */
export function splitVersionPath(pathname: string): { version: VersionId | null; path: string } {
  const match = PREFIX.exec(pathname);
  const version = match?.[1];
  if (!isVersionId(version)) return { version: null, path: pathname };
  return { version, path: pathname.slice(version.length + 1) || '/' };
}
