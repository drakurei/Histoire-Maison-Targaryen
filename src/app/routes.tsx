import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { NotFound } from './NotFound';
import { COMPARE_PATH } from './paths';
import { VERSION_IDS, VersionProvider } from './version';
import type { VersionId } from './version';

/** Version ouverte à la racine du site : l'édition ultime, « le Codex armorié ». */
export const DEFAULT_VERSION: VersionId = 'version-3';

/**
 * Point d'entrée de chaque version, chargé à la demande : un bloc par version.
 *
 * Contrat d'un point d'entrée : un module dont l'export par défaut est un composant sans
 * props. Il est monté sous « /version-N/* » et déclare lui-même, dans son propre <Routes>,
 * le plan commun décrit dans ARCHITECTURE.md (chemins relatifs, sans préfixe), sa mise en
 * page et sa page introuvable. Ses liens passent par <VLink> ou useVersionPath().
 *
 * Tant qu'une version n'existe pas, son préfixe mène à l'écran « en construction ».
 */
const VERSION_ENTRIES = {
  'version-1': lazy(() => import('@/versions/v1-codex')),
  'version-2': lazy(() => import('@/versions/v2')),
  'version-3': lazy(() => import('@/versions/v3')),
} satisfies Record<VersionId, unknown>;

const ComparePage = lazy(() => import('@/compare/ComparePage'));

const versionRoutes = VERSION_IDS.map((id) => {
  const Entry = VERSION_ENTRIES[id];
  return (
    <Route
      key={id}
      path={`/${id}/*`}
      element={
        <VersionProvider id={id}>
          <Entry />
        </VersionProvider>
      }
    />
  );
});

export function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to={`/${DEFAULT_VERSION}`} replace />} />
      {versionRoutes}
      <Route path={COMPARE_PATH} element={<ComparePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
