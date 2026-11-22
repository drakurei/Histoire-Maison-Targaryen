import { createContext, useCallback, useContext } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { versionPath } from './versionPath';
import type { VersionId } from './versionPath';

export { isVersionId, splitVersionPath, VERSION_IDS, versionNumber, versionPath } from './versionPath';
export type { VersionId } from './versionPath';

const VersionContext = createContext<VersionId | null>(null);

interface VersionProviderProps {
  id: VersionId;
  children: ReactNode;
}

/** Posé par le routeur autour de chaque version : dit à ses liens sous quel préfixe elle est montée. */
export function VersionProvider({ id, children }: VersionProviderProps) {
  return <VersionContext value={id}>{children}</VersionContext>;
}

/** La version dans laquelle le composant est rendu. */
export function useVersion(): VersionId {
  const version = useContext(VersionContext);
  if (!version) {
    throw new Error('useVersion() est appelé hors d’une version (<VersionProvider>).');
  }
  return version;
}

/**
 * `path('/dragons/balerion')` -> `/version-1/dragons/balerion` dans la version courante.
 * Pour `navigate()`, `<Navigate>` ou tout lien qui ne passe pas par `<VLink>`.
 */
export function useVersionPath(): (to: string) => string {
  const version = useVersion();
  return useCallback((to: string): string => versionPath(version, to), [version]);
}

type VLinkProps = Omit<ComponentProps<typeof Link>, 'to'> & {
  /** Chemin interne, sans préfixe de version : « /dragons/balerion ». */
  to: string;
};

/** Lien interne à la version courante. Mêmes props que `Link`, `to` sans préfixe. */
export function VLink({ to, ...rest }: VLinkProps) {
  const path = useVersionPath();
  return <Link to={path(to)} {...rest} />;
}

type VNavLinkProps = Omit<ComponentProps<typeof NavLink>, 'to'> & {
  /** Chemin interne, sans préfixe de version. Ajouter `end` pour le portail (« / »). */
  to: string;
};

/** Lien de navigation : comme `VLink`, et porte `aria-current="page"` sur la vue active. */
export function VNavLink({ to, ...rest }: VNavLinkProps) {
  const path = useVersionPath();
  return <NavLink to={path(to)} {...rest} />;
}
