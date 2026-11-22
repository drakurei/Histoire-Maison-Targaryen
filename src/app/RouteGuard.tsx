import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { ErrorBoundary } from './ErrorBoundary';
import { ErrorScreen } from './ErrorScreen';

interface RouteGuardProps {
  children: ReactNode;
}

/**
 * Garde d'erreur des routes. Elle se relève quand le chemin change : après une vue
 * qui a échoué, le bouton précédent du navigateur ramène à une page qui marche.
 */
export function RouteGuard({ children }: RouteGuardProps) {
  const { pathname } = useLocation();

  return (
    <ErrorBoundary resetKey={pathname} fallback={<ErrorScreen />}>
      {children}
    </ErrorBoundary>
  );
}
